#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path


CONFIG = Path.home() / ".codex" / "config.toml"
SNIPPET = Path(__file__).resolve().parent.parent / "config" / "codex-config-snippet.toml"


def main() -> None:
    config_text = CONFIG.read_text()
    snippet_lines = SNIPPET.read_text().splitlines()
    if not snippet_lines:
        raise SystemExit("Config snippet is empty")

    fallback_line = snippet_lines[0]
    agent_blocks = "\n".join(snippet_lines[2:]).strip()

    config_text = re.sub(
        r'^project_doc_fallback_filenames = \[.*\]$',
        fallback_line,
        config_text,
        flags=re.MULTILINE,
    )

    block_pattern = re.compile(r'(?ms)^\[agents\.consilium-[^\n]+\]\n(?:.*?\n)*?(?=^\[agents\.consilium-|^\[features\])')
    config_text = re.sub(block_pattern, '', config_text)

    features_match = re.search(r'(?m)^\[features\]$', config_text)
    if features_match is None:
        raise SystemExit("Could not find [features] block in ~/.codex/config.toml")

    insert_at = features_match.start()
    new_text = config_text[:insert_at].rstrip() + "\n\n" + agent_blocks + "\n\n" + config_text[insert_at:]
    CONFIG.write_text(new_text)
    print(f"Synced Consilium Codex config blocks into {CONFIG}")


if __name__ == "__main__":
    main()
