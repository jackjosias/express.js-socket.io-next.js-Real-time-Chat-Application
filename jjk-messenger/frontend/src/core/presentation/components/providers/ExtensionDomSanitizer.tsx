"use client";

import { useEffect } from "react";

const BLOCKED_ATTRIBUTE_NAMES = new Set([
  "bis_register",
  "bis_skin_checked",
  "cz-shortcut-listen",
  "data-dynamic-id",
]);

const BLOCKED_ATTRIBUTE_PREFIXES = ["__processed_", "bis_", "data-bis-"];
const EXTENSION_SCRIPT_PROTOCOL = "chrome-extension:";
const KNOWN_BIS_EXTENSION_ID = "eppiocemhmnlbhjplcgkofciiegomcon";

function shouldRemoveAttribute(name: string): boolean {
  return BLOCKED_ATTRIBUTE_NAMES.has(name)
    || BLOCKED_ATTRIBUTE_PREFIXES.some((prefix) => name.startsWith(prefix));
}

function cleanElementAttributes(element: Element): void {
  for (const name of element.getAttributeNames()) {
    if (shouldRemoveAttribute(name)) {
      element.removeAttribute(name);
    }
  }
}

function isKnownBisExtensionScript(element: Element): boolean {
  const src = element.getAttribute("src") ?? "";
  return element.tagName === "SCRIPT"
    && src.startsWith(EXTENSION_SCRIPT_PROTOCOL)
    && (
      src.includes(KNOWN_BIS_EXTENSION_ID)
      || element.hasAttribute("bis_use")
      || element.hasAttribute("data-bis-config")
    );
}

function cleanTree(root: ParentNode): void {
  if (root instanceof Element) {
    cleanElementAttributes(root);
  }

  for (const element of root.querySelectorAll("*")) {
    if (isKnownBisExtensionScript(element)) {
      element.remove();
      continue;
    }

    cleanElementAttributes(element);
  }
}

export function ExtensionDomSanitizer() {
  useEffect(() => {
    cleanTree(document.documentElement);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.target instanceof Element) {
          cleanElementAttributes(mutation.target);
        }

        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) {
            continue;
          }

          if (isKnownBisExtensionScript(node)) {
            node.remove();
            continue;
          }

          cleanTree(node);
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    const disconnectTimer = window.setTimeout(() => observer.disconnect(), 5000);

    return () => {
      window.clearTimeout(disconnectTimer);
      observer.disconnect();
    };
  }, []);

  return null;
}
