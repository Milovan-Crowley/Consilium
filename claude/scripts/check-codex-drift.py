#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CHECKER = ROOT / "runtimes" / "scripts" / "check-runtime-parity.py"


def main() -> int:
    print("Legacy Codex copy-paste drift is retired; running runtime parity instead.")
    return subprocess.call([sys.executable, str(CHECKER), "--installed"])


if __name__ == "__main__":
    raise SystemExit(main())
