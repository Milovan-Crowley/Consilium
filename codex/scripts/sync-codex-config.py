#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONFIG = Path.home() / ".codex" / "config.toml"
DEFAULT_SNIPPET = ROOT / "generated" / "codex" / "config" / "codex-config-snippet.toml"
DEFAULT_AGENT_DIR = Path.home() / ".codex" / "agents"


def quote(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def render_agent_blocks(snippet_text: str, agent_dir: Path) -> str:
    pattern = re.compile(r"(?ms)^\[agents\.(consilium-[^\]]+)\]\n.*?(?=^\[agents\.|\Z)")
    blocks = []

    for match in pattern.finditer(snippet_text):
        name = match.group(1)
        block = match.group(0).strip()
        config_file = f"config_file = {quote(str(agent_dir / f'{name}.toml'))}"
        if re.search(r"(?m)^config_file\s*=", block):
            block = re.sub(r"(?m)^config_file\s*=.*$", config_file, block)
        else:
            lines = block.splitlines()
            lines.insert(1, config_file)
            block = "\n".join(lines)
        blocks.append(block)

    if not blocks:
        raise SystemExit("Config snippet has no [agents.consilium-*] blocks")

    return "\n\n".join(blocks)


def remove_managed_blocks(config_text: str) -> str:
    lines = config_text.splitlines()
    kept = []
    skipping = False

    for line in lines:
        if re.match(r"^\[agents\.consilium-[^\]]+\]\s*$", line):
            skipping = True
            continue
        if skipping and re.match(r"^\[.*\]\s*$", line):
            skipping = False
        if not skipping:
            kept.append(line)

    return "\n".join(kept).strip()


def upsert_fallback_line(config_text: str, fallback_line: str) -> str:
    if re.search(r"(?m)^project_doc_fallback_filenames\s*=", config_text):
        return re.sub(
            r"(?m)^project_doc_fallback_filenames\s*=.*$",
            fallback_line,
            config_text,
            count=1,
        )
    if config_text.strip():
        return f"{fallback_line}\n{config_text.lstrip()}"
    return fallback_line


def insert_agent_blocks(config_text: str, agent_blocks: str) -> str:
    features_match = re.search(r"(?m)^\[features\]\s*$", config_text)
    if features_match is None:
        sections = [config_text.strip(), agent_blocks.strip()]
        return "\n\n".join(section for section in sections if section).rstrip() + "\n"

    before = config_text[: features_match.start()].strip()
    after = config_text[features_match.start() :].strip()
    sections = [before, agent_blocks.strip(), after]
    return "\n\n".join(section for section in sections if section).rstrip() + "\n"


def render_config(config_text: str, snippet_text: str, agent_dir: Path) -> str:
    snippet_lines = snippet_text.splitlines()
    if not snippet_lines:
        raise SystemExit("Config snippet is empty")
    fallback_line = snippet_lines[0]
    if not fallback_line.startswith("project_doc_fallback_filenames"):
        raise SystemExit("Config snippet must start with project_doc_fallback_filenames")

    config_text = remove_managed_blocks(config_text)
    config_text = upsert_fallback_line(config_text, fallback_line)
    agent_blocks = render_agent_blocks(snippet_text, agent_dir)
    return insert_agent_blocks(config_text, agent_blocks)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG, help="Codex config file to update")
    parser.add_argument("--snippet", type=Path, default=DEFAULT_SNIPPET, help="Generated Consilium config snippet")
    parser.add_argument("--agent-dir", type=Path, default=DEFAULT_AGENT_DIR, help="Installed Consilium agent TOML directory")
    parser.add_argument("--dry-run", action="store_true", help="validate rendering without writing the config file")
    args = parser.parse_args()

    if not args.snippet.is_file():
        raise SystemExit(f"Missing config snippet: {args.snippet}")

    config_text = args.config.read_text() if args.config.is_file() else ""
    new_text = render_config(config_text, args.snippet.read_text(), args.agent_dir)

    if args.dry_run:
        print(f"Validated Codex config sync for {args.config} without writing.")
        return 0

    args.config.parent.mkdir(parents=True, exist_ok=True)
    args.config.write_text(new_text)
    print(f"Synced Consilium Codex config blocks into {args.config}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
