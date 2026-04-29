#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "source"
MANIFEST = SOURCE / "manifest.json"

GENERATED_CLAUDE_AGENTS = ROOT / "generated" / "claude" / "agents"
GENERATED_CLAUDE_SKILLS = ROOT / "generated" / "claude" / "skills"
GENERATED_CODEX_AGENTS = ROOT / "generated" / "codex" / "agents"
GENERATED_CODEX_CONFIG = ROOT / "generated" / "codex" / "config" / "codex-config-snippet.toml"

CLAUDE_SKILLS = ROOT / "claude" / "skills"
CODEX_SOURCE = ROOT / "codex" / "source"
CODEX_AGENTS = ROOT / "codex" / "agents"
CODEX_CONFIG = ROOT / "codex" / "config" / "codex-config-snippet.toml"

INSTALLED_CLAUDE_AGENTS = Path.home() / ".claude" / "agents"
INSTALLED_CODEX_AGENTS = Path.home() / ".codex" / "agents"
CODEX_USER_CONFIG = Path.home() / ".codex" / "config.toml"
CLAUDE_PLUGIN_LINK = Path.home() / ".claude" / "plugins" / "consilium"

RETIRED_CLAUDE_AGENT_FILES = {
    "consilium-soldier.md",
    "consilium-scout.md",
    "consilium-provocator-overconfidence.md",
    "consilium-provocator-assumption.md",
    "consilium-provocator-failure-mode.md",
    "consilium-provocator-edge-case.md",
    "consilium-provocator-negative-claim.md",
}


def load_manifest() -> dict:
    return json.loads(MANIFEST.read_text())


def files_under(root: Path) -> dict[str, Path]:
    if not root.is_dir():
        return {}
    return {
        str(path.relative_to(root)): path
        for path in sorted(root.rglob("*"))
        if path.is_file() and "__pycache__" not in path.parts
    }


def check_dir_match(left: Path, right: Path, label: str) -> list[str]:
    errors = []
    left_files = files_under(left)
    right_files = files_under(right)
    for rel in sorted(left_files.keys() - right_files.keys()):
        errors.append(f"{label}: {right / rel} missing")
    for rel in sorted(right_files.keys() - left_files.keys()):
        errors.append(f"{label}: {right / rel} extra")
    for rel in sorted(left_files.keys() & right_files.keys()):
        if left_files[rel].read_bytes() != right_files[rel].read_bytes():
            errors.append(f"{label}: {right / rel} differs from {left / rel}")
    return errors


def expected_names(manifest: dict, runtime: str, surface: str | None = None) -> set[str]:
    names = set()
    for agent in manifest["agents"]:
        runtime_meta = agent["runtime_surfaces"][runtime]
        if not runtime_meta.get("enabled"):
            continue
        if surface is not None and runtime_meta.get("surface") != surface:
            continue
        names.add(agent["name"])
    return names


def check_manifest(manifest: dict) -> list[str]:
    names = [agent["name"] for agent in manifest["agents"]]
    errors = []
    if len(names) != len(set(names)):
        seen = set()
        dupes = sorted({name for name in names if name in seen or seen.add(name)})
        errors.append(f"source/manifest.json: duplicate agent names: {', '.join(dupes)}")
    if "consilium-speculator-primus" not in names:
        errors.append("source/manifest.json: missing consilium-speculator-primus")
    return errors


def check_generated(manifest: dict) -> list[str]:
    errors = []
    expected_claude = {f"{name}.md" for name in expected_names(manifest, "claude", "agent")}
    expected_codex = {f"{name}.toml" for name in expected_names(manifest, "codex", "agent")}
    actual_claude = {p.name for p in GENERATED_CLAUDE_AGENTS.glob("consilium-*.md")}
    actual_codex = {p.name for p in GENERATED_CODEX_AGENTS.glob("consilium-*.toml")}

    for name in sorted(expected_claude - actual_claude):
        errors.append(f"{GENERATED_CLAUDE_AGENTS}: missing {name}")
    for name in sorted(actual_claude - expected_claude):
        errors.append(f"{GENERATED_CLAUDE_AGENTS}: extra {name}")
    for name in sorted(expected_codex - actual_codex):
        errors.append(f"{GENERATED_CODEX_AGENTS}: missing {name}")
    for name in sorted(actual_codex - expected_codex):
        errors.append(f"{GENERATED_CODEX_AGENTS}: extra {name}")

    errors.extend(check_dir_match(SOURCE / "skills" / "claude", GENERATED_CLAUDE_SKILLS, "claude generated skills"))
    errors.extend(check_dir_match(GENERATED_CLAUDE_SKILLS, CLAUDE_SKILLS, "claude runtime skills"))
    errors.extend(check_dir_match(SOURCE, CODEX_SOURCE, "codex source compatibility"))
    errors.extend(check_dir_match(GENERATED_CODEX_AGENTS, CODEX_AGENTS, "codex agent compatibility"))
    if not GENERATED_CODEX_CONFIG.is_file():
        errors.append(f"{GENERATED_CODEX_CONFIG}: missing")
    elif not CODEX_CONFIG.is_file():
        errors.append(f"{CODEX_CONFIG}: missing")
    elif GENERATED_CODEX_CONFIG.read_bytes() != CODEX_CONFIG.read_bytes():
        errors.append(f"{CODEX_CONFIG}: differs from generated Codex config")
    return errors


def check_installed(manifest: dict) -> list[str]:
    errors = []
    for generated in sorted(GENERATED_CLAUDE_AGENTS.glob("consilium-*.md")):
        installed = INSTALLED_CLAUDE_AGENTS / generated.name
        if not installed.is_file():
            errors.append(f"{installed}: missing installed Claude agent")
        elif generated.read_bytes() != installed.read_bytes():
            errors.append(f"{installed}: differs from generated Claude agent {generated}")

    for generated in sorted(GENERATED_CODEX_AGENTS.glob("consilium-*.toml")):
        installed = INSTALLED_CODEX_AGENTS / generated.name
        if not installed.is_file():
            errors.append(f"{installed}: missing installed Codex agent")
        elif generated.read_bytes() != installed.read_bytes():
            errors.append(f"{installed}: differs from generated Codex agent {generated}")

    config_text = CODEX_USER_CONFIG.read_text() if CODEX_USER_CONFIG.is_file() else ""
    for name in sorted(expected_names(manifest, "codex", "agent")):
        if f"[agents.{name}]" not in config_text:
            errors.append(f"{CODEX_USER_CONFIG}: missing [agents.{name}] block")

    retired_present = sorted(name for name in RETIRED_CLAUDE_AGENT_FILES if (INSTALLED_CLAUDE_AGENTS / name).exists())
    if retired_present:
        errors.append(f"{INSTALLED_CLAUDE_AGENTS}: retired Claude agent files still present: {', '.join(retired_present)}")

    expected_plugin_root = ROOT / "claude"
    if not CLAUDE_PLUGIN_LINK.is_symlink():
        errors.append(f"{CLAUDE_PLUGIN_LINK}: expected symlink to {expected_plugin_root}")
    else:
        target = CLAUDE_PLUGIN_LINK.resolve(strict=False)
        if target != expected_plugin_root:
            errors.append(f"{CLAUDE_PLUGIN_LINK}: points to {target}, expected {expected_plugin_root}")
    if not (CLAUDE_PLUGIN_LINK / ".claude-plugin" / "plugin.json").is_file():
        errors.append(f"{CLAUDE_PLUGIN_LINK}: missing .claude-plugin/plugin.json")
    if not (CLAUDE_PLUGIN_LINK / "skills").is_dir():
        errors.append(f"{CLAUDE_PLUGIN_LINK}: missing skills directory")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--installed", action="store_true", help="also check installed runtime files and config")
    args = parser.parse_args()

    manifest = load_manifest()
    errors = []
    errors.extend(check_manifest(manifest))
    errors.extend(check_generated(manifest))
    if args.installed:
        errors.extend(check_installed(manifest))

    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1

    scope = "repo and installed runtime" if args.installed else "repo runtime"
    print(f"Consilium {scope} parity check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
