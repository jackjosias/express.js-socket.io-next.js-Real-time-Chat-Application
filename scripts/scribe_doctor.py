#!/usr/bin/env python3
from __future__ import annotations

from _bundle_shim import export_canonical, run_canonical_script


export_canonical(globals(), "scribe_doctor")


if __name__ == "__main__":
    run_canonical_script("scribe_doctor")
