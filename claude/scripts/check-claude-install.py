#!/usr/bin/env python3
import argparse
import json
import sys
from pathlib import Path


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def load_settings(path: Path) -> dict:
    if not path.exists():
        fail(f"settings file does not exist: {path}")
    try:
        data = json.loads(path.read_text())
    except json.JSONDecodeError as exc:
        fail(f"settings file is invalid JSON: {exc}")
    if not isinstance(data, dict):
        fail("settings file must contain a top-level JSON object")
    return data


def same_path(left: Path, right: Path) -> bool:
    return left.expanduser().resolve() == right.expanduser().resolve()


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify a local Consilium Claude install.")
    parser.add_argument("--repo", default=".", help="Consilium repo root. Defaults to cwd.")
    parser.add_argument("--home", default=str(Path.home()), help="Home directory to verify.")
    parser.add_argument(
        "--settings",
        help="Claude settings file to verify. Defaults to HOME/.claude/settings.json.",
    )
    parser.add_argument(
        "--installed",
        action="store_true",
        help="Compatibility alias for installed-user-home verification.",
    )
    args = parser.parse_args()

    repo_root = Path(args.repo).expanduser().resolve()
    home_dir = Path(args.home).expanduser().resolve()
    settings_path = (
        Path(args.settings).expanduser().resolve()
        if args.settings
        else home_dir / ".claude" / "settings.json"
    )

    claude_dir = repo_root / "claude"
    generated_agents_dir = repo_root / "generated" / "claude" / "agents"
    installed_agents_dir = home_dir / ".claude" / "agents"
    plugin_link = home_dir / ".claude" / "plugins" / "consilium"

    if not claude_dir.is_dir():
        fail(f"missing Claude runtime directory: {claude_dir}")
    if not generated_agents_dir.is_dir():
        fail(f"missing generated agents directory: {generated_agents_dir}")

    agent_sources = sorted(generated_agents_dir.glob("consilium-*.md"))
    if not agent_sources:
        fail(f"no generated consilium agents found in {generated_agents_dir}")

    if not installed_agents_dir.is_dir():
        fail(f"missing installed agents directory: {installed_agents_dir}")

    for source in agent_sources:
        installed = installed_agents_dir / source.name
        if not installed.exists():
            fail(f"missing installed agent: {installed}")
        if installed.read_bytes() != source.read_bytes():
            fail(f"installed agent differs from generated source: {installed}")

    if not plugin_link.is_symlink():
        fail(f"plugin path is not a symlink: {plugin_link}")
    if not same_path(plugin_link, claude_dir):
        fail(f"plugin symlink points to {plugin_link.resolve()}, expected {claude_dir}")

    retired_plugin_paths = [
        plugin_link / "docs",
        plugin_link / "mcps" / "principales",
        plugin_link / "scripts" / "check-codex-drift.py",
    ]
    for path in retired_plugin_paths:
        if path.exists():
            fail(f"retired Claude plugin surface is still installed: {path}")

    settings = load_settings(settings_path)
    marketplaces = settings.get("extraKnownMarketplaces")
    if not isinstance(marketplaces, dict):
        fail("settings.extraKnownMarketplaces is missing or not an object")

    consilium_marketplace = marketplaces.get("consilium-local")
    if not isinstance(consilium_marketplace, dict):
        fail("settings.extraKnownMarketplaces.consilium-local is missing")

    source = consilium_marketplace.get("source")
    if not isinstance(source, dict):
        fail("settings.extraKnownMarketplaces.consilium-local.source is missing")
    if source.get("source") != "directory":
        fail("consilium-local marketplace source must be 'directory'")
    if "path" not in source:
        fail("consilium-local marketplace source.path is missing")
    if not same_path(Path(source["path"]), claude_dir):
        fail(f"consilium-local source.path is {source['path']}, expected {claude_dir}")

    enabled_plugins = settings.get("enabledPlugins")
    if not isinstance(enabled_plugins, dict):
        fail("settings.enabledPlugins is missing or not an object")
    if enabled_plugins.get("consilium@consilium-local") is not True:
        fail('settings.enabledPlugins["consilium@consilium-local"] is not true')

    print(f"OK: verified {len(agent_sources)} Claude agents")
    print(f"OK: verified plugin symlink {plugin_link}")
    print(f"OK: verified settings {settings_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
