#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf 'Usage: %s [--home PATH]\n' "$(basename "$0")"
}

home_dir="${HOME:-}"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --home)
      [ "$#" -ge 2 ] || {
        echo "install-claude.sh: --home requires a path" >&2
        exit 2
      }
      home_dir="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "install-claude.sh: unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

[ -n "$home_dir" ] || {
  echo "install-claude.sh: HOME is unset; pass --home PATH" >&2
  exit 1
}

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/../.." && pwd)"
claude_dir="$repo_root/claude"
generated_agents_dir="$repo_root/generated/claude/agents"
claude_home="$home_dir/.claude"
agents_dir="$claude_home/agents"
plugins_dir="$claude_home/plugins"
plugin_link="$plugins_dir/consilium"
settings_path="$claude_home/settings.json"

[ -d "$generated_agents_dir" ] || {
  echo "install-claude.sh: missing generated agents directory: $generated_agents_dir" >&2
  exit 1
}

shopt -s nullglob
agent_sources=("$generated_agents_dir"/consilium-*.md)
shopt -u nullglob

[ "${#agent_sources[@]}" -gt 0 ] || {
  echo "install-claude.sh: no generated consilium agents found in $generated_agents_dir" >&2
  exit 1
}

if [ -e "$plugin_link" ] && [ ! -L "$plugin_link" ]; then
  echo "install-claude.sh: refusing to replace non-symlink plugin path: $plugin_link" >&2
  exit 1
fi

python3 - "$settings_path" <<'PY'
import json
import sys
from pathlib import Path

settings_path = Path(sys.argv[1])

if settings_path.exists():
    try:
        settings = json.loads(settings_path.read_text())
    except json.JSONDecodeError as exc:
        raise SystemExit(f"{settings_path}: invalid JSON: {exc}")
    if not isinstance(settings, dict):
        raise SystemExit(f"{settings_path}: expected a top-level JSON object")
else:
    settings = {}

marketplaces = settings.get("extraKnownMarketplaces", {})
if not isinstance(marketplaces, dict):
    raise SystemExit("settings.extraKnownMarketplaces must be an object")

enabled_plugins = settings.get("enabledPlugins", {})
if not isinstance(enabled_plugins, dict):
    raise SystemExit("settings.enabledPlugins must be an object")
PY

mkdir -p "$agents_dir" "$plugins_dir"

for agent_source in "${agent_sources[@]}"; do
  cp "$agent_source" "$agents_dir/"
done

if [ -L "$plugin_link" ]; then
  rm "$plugin_link"
fi

ln -s "$claude_dir" "$plugin_link"

python3 - "$settings_path" "$claude_dir" <<'PY'
import json
import sys
from pathlib import Path

settings_path = Path(sys.argv[1])
claude_dir = str(Path(sys.argv[2]).resolve())

if settings_path.exists():
    try:
        settings = json.loads(settings_path.read_text())
    except json.JSONDecodeError as exc:
        raise SystemExit(f"{settings_path}: invalid JSON: {exc}")
    if not isinstance(settings, dict):
        raise SystemExit(f"{settings_path}: expected a top-level JSON object")
else:
    settings = {}

marketplaces = settings.setdefault("extraKnownMarketplaces", {})
if not isinstance(marketplaces, dict):
    raise SystemExit("settings.extraKnownMarketplaces must be an object")

marketplaces["consilium-local"] = {
    "source": {
        "source": "directory",
        "path": claude_dir,
    }
}

enabled_plugins = settings.setdefault("enabledPlugins", {})
if not isinstance(enabled_plugins, dict):
    raise SystemExit("settings.enabledPlugins must be an object")

enabled_plugins["consilium@consilium-local"] = True

settings_path.parent.mkdir(parents=True, exist_ok=True)
settings_path.write_text(json.dumps(settings, indent=2) + "\n")
PY

printf 'Installed %s Claude agents into %s\n' "${#agent_sources[@]}" "$agents_dir"
printf 'Linked Consilium plugin at %s\n' "$plugin_link"
printf 'Updated Claude settings at %s\n' "$settings_path"
