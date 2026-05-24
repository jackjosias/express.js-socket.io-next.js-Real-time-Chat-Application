from __future__ import annotations

import importlib.util
import runpy
import sys
from pathlib import Path
from types import ModuleType
from typing import Any


sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[1]
CANONICAL_SCRIPTS_DIR = ROOT / ".agent" / "workflow" / "scribe-engineering-rag" / "scripts"


def ensure_canonical_path() -> None:
    scripts_path = str(CANONICAL_SCRIPTS_DIR)
    if scripts_path not in sys.path:
        sys.path.insert(0, scripts_path)


def load_canonical_module(module_name: str) -> ModuleType:
    ensure_canonical_path()
    module_path = CANONICAL_SCRIPTS_DIR / f"{module_name}.py"
    if not module_path.exists():
        raise ModuleNotFoundError(f"Cannot find SCRIBE bundle module: {module_path}")

    private_name = f"_scribe_bundle_{module_name}"
    cached = sys.modules.get(private_name)
    if cached is not None:
        return cached

    spec = importlib.util.spec_from_file_location(private_name, module_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load SCRIBE bundle module: {module_path}")

    module = importlib.util.module_from_spec(spec)
    sys.modules[private_name] = module
    spec.loader.exec_module(module)
    return module


def export_canonical(namespace: dict[str, Any], module_name: str) -> None:
    module = load_canonical_module(module_name)
    public_names = [name for name in vars(module) if not name.startswith("_")]
    namespace["__doc__"] = module.__doc__
    namespace["__all__"] = public_names
    for name in public_names:
        namespace[name] = getattr(module, name)


def run_canonical_script(module_name: str) -> None:
    ensure_canonical_path()
    runpy.run_path(str(CANONICAL_SCRIPTS_DIR / f"{module_name}.py"), run_name="__main__")
