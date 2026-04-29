#!/usr/bin/env python3
from __future__ import annotations

import runpy
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
GENERATOR = ROOT / "runtimes" / "scripts" / "generate.py"


if __name__ == "__main__":
    runpy.run_path(str(GENERATOR), run_name="__main__")
