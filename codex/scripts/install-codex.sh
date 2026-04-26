#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
prune_agents=0
sync_config=0

usage() {
  cat <<'USAGE'
Usage: bash scripts/install-codex.sh [--prune-agents] [--sync-config]

Installs the Consilium Codex agents and skills from this repo.

Options:
  --prune-agents  Remove installed consilium agent TOMLs that are no longer generated here.
  --sync-config   Sync Consilium agent registration blocks into ~/.codex/config.toml.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prune-agents)
      prune_agents=1
      shift
      ;;
    --sync-config)
      sync_config=1
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

agent_args=()
if [[ "$prune_agents" == "1" ]]; then
  agent_args+=(--prune)
fi

bash "$repo_root/scripts/install-codex-agents.sh" "${agent_args[@]}"
bash "$repo_root/scripts/install-codex-skills.sh"

if [[ "$sync_config" == "1" ]]; then
  python3 "$repo_root/scripts/sync-codex-config.py"
else
  echo "Skipped config sync. Run python3 scripts/sync-codex-config.py or pass --sync-config when ready."
fi

echo "Consilium Codex install complete. Start a fresh Codex thread before testing new agent or skill routing."
