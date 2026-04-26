#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
skill_name="tribune"
src_dir="$repo_root/skills/$skill_name"
target_root="$HOME/.agents/skills"
dry_run=0

usage() {
  cat <<'USAGE'
Usage: bash scripts/install-codex-skills.sh [--dry-run] [--target-root PATH]

Installs the Consilium Codex skill package into the local Codex skill registry.
Default target root: ~/.agents/skills
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      dry_run=1
      shift
      ;;
    --target-root)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --target-root" >&2
        exit 1
      fi
      target_root="$2"
      shift 2
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

target_dir="$target_root/$skill_name"

if [[ ! -d "$src_dir" ]]; then
  echo "Missing skill source: $src_dir" >&2
  exit 1
fi

python3 - <<'PY' "$src_dir"
from pathlib import Path
import sys

src = Path(sys.argv[1])
skill = src / "SKILL.md"
openai = src / "agents" / "openai.yaml"

if not skill.is_file():
    raise SystemExit(f"Missing {skill}")

text = skill.read_text()
if not text.startswith("---\n"):
    raise SystemExit("SKILL.md must start with YAML frontmatter")

parts = text.split("---\n", 2)
if len(parts) < 3 or parts[0] != "":
    raise SystemExit("SKILL.md frontmatter is not closed")

frontmatter = parts[1]

required = ("name:", "description:")
missing = [key for key in required if key not in frontmatter]
if missing:
    raise SystemExit(f"SKILL.md frontmatter missing: {', '.join(missing)}")

if not openai.is_file():
    raise SystemExit(f"Missing {openai}")

openai_text = openai.read_text()
for key in ("interface:", "display_name:", "short_description:", "default_prompt:"):
    if key not in openai_text:
        raise SystemExit(f"agents/openai.yaml missing {key}")
PY

banned_regex='/Users/jesse|CLAUDE|Claude|Lace|skills/debugging/systematic-debugging|consilium:gladius|consilium:sententia'
if rg -n "$banned_regex" "$src_dir"; then
  echo "Banned stale reference found in skill source" >&2
  exit 1
fi

if rg -n --glob '*.md' '^\|.*\|$' "$src_dir"; then
  echo "Markdown tables found in runtime skill docs" >&2
  exit 1
fi

python3 "$repo_root/scripts/check-tribune-shared-docs.py"

if [[ -e "$target_dir" && ! -L "$target_dir" ]]; then
  echo "Refusing to replace non-symlink skill target: $target_dir" >&2
  exit 1
fi

if [[ "$dry_run" == "1" ]]; then
  echo "Validated $src_dir"
  echo "Would link $target_dir -> $src_dir"
  exit 0
fi

mkdir -p "$target_root"
ln -sfn "$src_dir" "$target_dir"

resolved="$(readlink "$target_dir")"
if [[ "$resolved" != "$src_dir" ]]; then
  echo "Install verification failed: $target_dir points to $resolved" >&2
  exit 1
fi

python3 "$repo_root/scripts/check-tribune-shared-docs.py" --installed

echo "Installed Consilium Codex skill '$skill_name' to $target_dir"
echo "Start a new Codex thread or session to pick up updated skill instructions."
