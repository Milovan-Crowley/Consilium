#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
prune_agents=0
sync_config=1
dry_run=0

usage() {
  cat <<'USAGE'
Usage: bash codex/scripts/install-codex.sh [--dry-run] [--prune-agents] [--sync-config] [--skip-config-sync]

Installs the Consilium Codex agents and skills from this repo.

Options:
  --dry-run       Validate agents, skills, and config sync without writing installed files.
  --prune-agents  Remove installed consilium agent TOMLs that are no longer generated here.
  --sync-config   Compatibility flag. Config sync is now the default.
  --skip-config-sync
                  Emergency rollback testing only. Skip ~/.codex/config.toml sync.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      dry_run=1
      shift
      ;;
    --prune-agents)
      prune_agents=1
      shift
      ;;
    --sync-config)
      sync_config=1
      shift
      ;;
    --skip-config-sync)
      sync_config=0
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

bash "$script_dir/install-codex-agents.sh" --validate-only
bash "$script_dir/install-codex-skills.sh" --dry-run

if [[ "$sync_config" == "1" ]]; then
  python3 "$script_dir/sync-codex-config.py" --dry-run
  python3 "$script_dir/check-codex-config-portability.py" --simulate-fresh-config
else
  echo "Skipped config sync preflight by request."
fi

if [[ "$dry_run" == "1" ]]; then
  echo "Consilium Codex dry run complete. No installed files or config were changed."
  exit 0
fi

if [[ "$prune_agents" == "1" ]]; then
  bash "$script_dir/install-codex-agents.sh" --prune
else
  bash "$script_dir/install-codex-agents.sh"
fi

bash "$script_dir/install-codex-skills.sh"

if [[ "$sync_config" == "1" ]]; then
  python3 "$script_dir/sync-codex-config.py"
  echo "Synced Codex config registration."
else
  echo "Skipped config sync by request."
fi

echo "Consilium Codex install complete. Start a fresh Codex thread before testing new agent or skill routing."
