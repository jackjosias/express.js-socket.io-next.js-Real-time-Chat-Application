#!/usr/bin/env python3
"""
TENOR 2026 — Restructurateur SCSS
Transforme le CSS plat hérité des CSS Modules en SCSS idiomatique.

Transformations appliquées :
  1. Fusionne les doublons (ex: .gp-global-wrapper défini 2x)
  2. Neste les pseudo-classes : .btn:hover → .btn { &:hover {} }
  3. Neste les modificateurs : .btn.active → .btn { &.active {} }
  4. Neste les éléments enfants directs connus : .btn svg → .btn { svg {} }
  5. Neste les resets d'éléments sous .technical-analysis-root
  6. Consolide les @keyframes en haut
  7. Consolide les @media en bas
"""

import re
import sys
from collections import defaultdict, OrderedDict

INPUT  = "styles/pages/_technical-analysis-final.scss"
OUTPUT = "styles/pages/_technical-analysis-final.scss"
BACKUP = "styles/pages/_technical-analysis-final.scss.BACKUP"

# ── Helpers ──────────────────────────────────────────────────────────────────

def indent(text: str, level: int = 1, spaces: int = 2) -> str:
    pad = " " * (spaces * level)
    return "\n".join(pad + line if line.strip() else line for line in text.split("\n"))

def strip_trailing(text: str) -> str:
    return re.sub(r'\n{3,}', '\n\n', text).strip()

# ── Parser ────────────────────────────────────────────────────────────────────

class CSSBlock:
    """Represents a single CSS rule block."""
    def __init__(self, selector: str, body: str, is_at_rule: bool = False):
        self.selector = selector.strip()
        self.body = body.strip()
        self.is_at_rule = is_at_rule

    def render(self, extra_indent: int = 0) -> str:
        indented_body = indent(self.body, 1) if self.body else ""
        pad = "  " * extra_indent
        return f"{pad}{self.selector} {{\n{indent(self.body, 1)}\n{pad}}}"

def parse_blocks(text: str) -> list:
    """
    Simple block parser. Returns list of (selector, body, is_at_rule) tuples.
    Handles nested braces correctly.
    """
    blocks = []
    i = 0
    n = len(text)

    while i < n:
        # Skip whitespace and comments
        if text[i:i+2] == '/*':
            end = text.find('*/', i+2)
            if end == -1:
                break
            comment = text[i:end+2]
            blocks.append(('__comment__', comment, False))
            i = end + 2
            continue

        if text[i] in ' \t\n\r':
            i += 1
            continue

        # Find next opening brace (selector start)
        brace_pos = text.find('{', i)
        if brace_pos == -1:
            break

        selector = text[i:brace_pos].strip()
        if not selector:
            i = brace_pos + 1
            continue

        # Find matching closing brace
        depth = 1
        j = brace_pos + 1
        while j < n and depth > 0:
            if text[j] == '{':
                depth += 1
            elif text[j] == '}':
                depth -= 1
            j += 1

        body = text[brace_pos+1:j-1]
        is_at = selector.startswith('@')
        blocks.append((selector, body, is_at))
        i = j

    return blocks

# ── Restructurer ──────────────────────────────────────────────────────────────

# Children that should be nested when they appear as "selector child { }"
NESTABLE_CHILDREN = [
    'a', 'p', 'span', 'div', 'img', 'svg', 'i', 'button', 'input',
    'select', 'textarea', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4',
    'h5', 'h6', 'strong', 'label', 'form', 'table', 'th', 'td',
]

def base_selector(sel: str) -> str:
    """
    Extract the 'base' class from a compound selector.
    Example:
      .gp-btn:hover → .gp-btn
      .gp-btn.active → .gp-btn
      .gp-btn svg → .gp-btn
      .technical-analysis-root h1 → .technical-analysis-root
    """
    # Remove pseudo-classes/elements
    s = re.split(r'::?[\w-]+', sel)[0].strip()
    # Remove state modifiers like .active .open
    parts = s.split('.')
    base = '.' + parts[1] if len(parts) > 1 else s
    # Handle space-separated descendant selectors
    tokens = base.split()
    return tokens[0]

def suffix_for(sel: str, base: str) -> str:
    """
    Return the SCSS suffix (what comes after the base in a nested rule).
    Example:
      base='.gp-btn', sel='.gp-btn:hover' → '&:hover'
      base='.gp-btn', sel='.gp-btn.active' → '&.active'
      base='.gp-btn', sel='.gp-btn svg' → 'svg'
      base='.tar', sel='.tar h1, .tar h2' → 'h1, h2'
    """
    # Handle comma-separated multi-selectors:
    # .technical-analysis-root h1, .technical-analysis-root h2
    parts = [p.strip() for p in sel.split(',')]
    suffixes = []
    for part in parts:
        if part.startswith(base):
            rest = part[len(base):].strip()
            if not rest:
                return '&'
            if rest.startswith(':') or rest.startswith('::'):
                suffixes.append('&' + rest)
            elif rest.startswith('.') or rest.startswith('[') or rest.startswith('#'):
                suffixes.append('&' + rest)
            else:
                # descendant element
                suffixes.append(rest)
        else:
            suffixes.append(part)
    return ', '.join(suffixes)

def can_nest(sel: str, base: str) -> bool:
    """
    Returns True if 'sel' should be nested under 'base'.
    Strict conditions to avoid false positives.
    """
    if sel == base:
        return False
    # All comma parts must start with base
    parts = [p.strip() for p in sel.split(',')]
    return all(p == base or p.startswith(base + ':') or
               p.startswith(base + '::') or
               p.startswith(base + '.') or
               p.startswith(base + ' ') or
               p.startswith(base + '[')
               for p in parts)

def restructure(blocks: list) -> str:
    """
    Main restructuring pass.
    Groups child selectors under their parent.
    """
    # 1. Separate at-rules, comments, and regular blocks
    keyframes = []
    media_queries = []
    regular = []

    for sel, body, is_at in blocks:
        if sel == '__comment__':
            regular.append(('__comment__', body, False))
            continue
        if sel.startswith('@keyframes'):
            keyframes.append((sel, body, True))
        elif sel.startswith('@media'):
            media_queries.append((sel, body, True))
        elif sel.startswith('@'):
            regular.append((sel, body, True))
        else:
            regular.append((sel, body, False))

    # 2. Merge duplicate selectors (keep last, merge bodies)
    merged: OrderedDict = OrderedDict()
    for sel, body, is_at in regular:
        if sel == '__comment__':
            # Use unique key to preserve all comments
            key = f'__comment__{len(merged)}'
            merged[key] = (sel, body, False)
            continue
        if sel in merged:
            # Append body (merge duplicate rule)
            prev_sel, prev_body, prev_at = merged[sel]
            # Simple merge: append new declarations
            combined = prev_body.strip() + '\n' + body.strip()
            merged[sel] = (sel, combined, is_at)
        else:
            merged[sel] = (sel, body, is_at)

    regular = list(merged.values())

    # 3. Group children under parents
    # Build index: base_selector → [child selectors]
    all_sels = [sel for sel, _, is_at in regular if sel != '__comment__' and not is_at]

    # Find which selectors are "children" of others
    parent_map: dict = {}  # child_sel → parent_sel
    for child in all_sels:
        for parent in all_sels:
            if parent == child:
                continue
            if can_nest(child, parent) and len(parent) > len(parent_map.get(child, '')):
                parent_map[child] = parent

    # 4. Build nested output
    # Collect children per parent
    children_of: dict = defaultdict(list)
    for child, parent in parent_map.items():
        children_of[parent].append(child)

    # Track which selectors have been output
    output_sels: set = set()
    out_parts = []

    def render_block(sel: str, body: str, is_at: bool, children: list, all_data: dict) -> str:
        """Render a block with its children nested inside."""
        lines = []
        # Collect own declarations (lines that aren't nested child blocks)
        own_decls = body.strip()

        # Collect nested children
        nested_parts = []
        for child in children:
            c_sel, c_body, c_is_at = all_data[child]
            suffix = suffix_for(child, sel)
            grand_children = children_of.get(child, [])
            child_nested = render_block(child, c_body, c_is_at, grand_children, all_data)
            # Replace full selector with suffix version
            child_rendered = child_nested.replace(child + ' {', suffix + ' {', 1)
            nested_parts.append(child_rendered)
            output_sels.add(child)

        if nested_parts:
            full_body = own_decls + ('\n\n' if own_decls else '') + '\n\n'.join(nested_parts)
        else:
            full_body = own_decls

        indented = indent(full_body.strip()) if full_body.strip() else ''
        return f"{sel} {{\n{indented}\n}}"

    # Build lookup dict
    all_data = {sel: (sel, body, is_at) for sel, body, is_at in regular if sel != '__comment__'}

    # 5. Output keyframes first
    kf_out = []
    for sel, body, _ in keyframes:
        kf_out.append(f"{sel} {{\n{indent(body.strip())}\n}}")

    # 6. Output regular blocks (top-level only)
    reg_out = []
    for sel, body, is_at in regular:
        if sel == '__comment__':
            reg_out.append(body)
            continue
        if sel in output_sels:
            continue  # already rendered as child
        children = children_of.get(sel, [])
        rendered = render_block(sel, body, is_at, children, all_data)
        for child in children:
            output_sels.add(child)
        reg_out.append(rendered)

    # 7. Output media queries last (consolidated)
    mq_out = []
    for sel, body, _ in media_queries:
        mq_out.append(f"{sel} {{\n{indent(body.strip())}\n}}")

    # Assemble
    sections = []
    if kf_out:
        sections.append(
            "// " + "=" * 76 + "\n"
            "// KEYFRAMES\n"
            "// " + "=" * 76 + "\n\n" +
            "\n\n".join(kf_out)
        )

    if reg_out:
        sections.append("\n\n".join(reg_out))

    if mq_out:
        sections.append(
            "\n\n// " + "=" * 76 + "\n"
            "// MEDIA QUERIES\n"
            "// " + "=" * 76 + "\n\n" +
            "\n\n".join(mq_out)
        )

    return strip_trailing("\n\n".join(sections)) + "\n"

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    import shutil, os

    # Backup
    if not os.path.exists(BACKUP):
        shutil.copy2(INPUT, BACKUP)
        print(f"✅ Backup: {BACKUP}")
    else:
        print(f"ℹ️  Backup already exists: {BACKUP}")

    # Read
    with open(INPUT, 'r', encoding='utf-8') as f:
        text = f.read()

    print(f"📖 Lu: {len(text)} bytes, {text.count(chr(10))} lignes")

    # Parse
    blocks = parse_blocks(text)
    print(f"🔍 Blocs parsés: {len(blocks)}")

    # Restructure
    result = restructure(blocks)

    # Write
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        f.write(result)

    lines_out = result.count('\n')
    print(f"✅ Écrit: {len(result)} bytes, {lines_out} lignes")
    print(f"📉 Réduction: {text.count(chr(10))} → {lines_out} lignes ({100*(1 - lines_out/text.count(chr(10))):.1f}%)")

if __name__ == '__main__':
    main()
