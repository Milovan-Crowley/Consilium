#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
src_dir="$repo_root/generated/codex/agents"
target_dir="$HOME/.codex/agents"
prune=0
validate_only=0

usage() {
  cat <<'USAGE'
Usage: bash codex/scripts/install-codex-agents.sh [--prune] [--validate-only]

Installs generated Consilium Codex agent TOMLs into ~/.codex/agents.

Options:
  --prune          Remove installed consilium agent TOMLs that are no longer generated here.
  --validate-only  Validate current generated agent TOMLs without generating or installing files.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prune)
      prune=1
      shift
      ;;
    --validate-only)
      validate_only=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ ! -f "$script_dir/generate_agents.py" ]]; then
  echo "Missing generator script" >&2
  exit 1
fi

if [[ "$validate_only" == "0" ]]; then
  python3 "$script_dir/generate_agents.py"
fi

python3 "$script_dir/check-shared-docs-adoption.py"

python3 - <<'PY' "$src_dir"
import json
import re
import sys
from pathlib import Path

src = Path(sys.argv[1])
paths = sorted(src.glob("consilium-*.toml"))
if not paths:
    raise SystemExit("No consilium TOML files found")

required = ["name", "description", "model", "model_reasoning_effort", "sandbox_mode"]
for path in paths:
    text = path.read_text()
    for key in required:
        match = re.search(rf"^{key} = (.+)$", text, flags=re.MULTILINE)
        if match is None:
            raise SystemExit(f"{path.name} missing {key}")
        try:
            json.loads(match.group(1))
        except json.JSONDecodeError as exc:
            raise SystemExit(f"{path.name} has invalid string value for {key}") from exc
    if text.count('developer_instructions = """') != 1:
        raise SystemExit(f"{path.name} missing developer_instructions block")
    if text.count('"""') != 2:
        raise SystemExit(f"{path.name} has an invalid developer_instructions delimiter count")

print(f"Validated {len(paths)} TOML files")
PY

if [[ "$validate_only" == "1" ]]; then
  echo "Validated Consilium Codex agents without generating or installing files."
  exit 0
fi

mkdir -p "$target_dir"

for src in "$src_dir"/consilium-*.toml; do
  install -m 0644 "$src" "$target_dir/$(basename "$src")"
done

python3 - <<'PY' "$src_dir" "$target_dir" "$prune"
import sys
from pathlib import Path

src = {p.name for p in Path(sys.argv[1]).glob("consilium-*.toml")}
target = {p.name for p in Path(sys.argv[2]).glob("consilium-*.toml")}
extra = sorted(target - src)
prune = sys.argv[3] == "1"

if extra:
    if prune:
        for name in extra:
            (Path(sys.argv[2]) / name).unlink()
        print(f"Pruned {len(extra)} stale consilium agent files from ~/.codex/agents")
    else:
        print("Warning: extra consilium agent files exist in ~/.codex/agents but not in this repo:")
        for name in extra:
            print(f"  - {name}")
else:
    print("No extra consilium agent files detected in ~/.codex/agents")
PY

python3 "$script_dir/check-shared-docs-adoption.py" --installed

echo "Installed Consilium Codex agents to $target_dir"
echo "Start a new Codex thread or session to pick up newly added agent types."
