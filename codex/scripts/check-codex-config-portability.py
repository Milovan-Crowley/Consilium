#!/usr/bin/env python3
from __future__ import annotations

import argparse
import importlib.util
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
GENERATOR = ROOT / "runtimes" / "scripts" / "generate.py"
SYNC_SCRIPT = ROOT / "codex" / "scripts" / "sync-codex-config.py"


def load_generator():
    spec = importlib.util.spec_from_file_location("consilium_runtime_generate", GENERATOR)
    if spec is None or spec.loader is None:
        raise SystemExit(f"Could not load generator: {GENERATOR}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def config_file_values(text: str) -> dict[str, str]:
    values = {}
    current_agent = None
    for line in text.splitlines():
        block_match = re.match(r"^\[agents\.(consilium-[^\]]+)\]\s*$", line)
        if block_match:
            current_agent = block_match.group(1)
            continue
        if current_agent and line.startswith("["):
            current_agent = None
            continue
        if current_agent:
            value_match = re.match(r"^config_file\s*=\s*(.+)$", line)
            if value_match:
                values[current_agent] = json.loads(value_match.group(1))
    return values


def assert_no_milovan_path(label: str, text: str) -> None:
    if "/Users/milovan" in text:
        raise SystemExit(f"{label}: contains /Users/milovan")


def assert_portable_snippet(snippet_text: str) -> None:
    assert_no_milovan_path("rendered Codex config snippet", snippet_text)
    values = config_file_values(snippet_text)
    if not values:
        raise SystemExit("rendered Codex config snippet: no consilium config_file values found")
    for agent, value in sorted(values.items()):
        expected = f"$HOME/.codex/agents/{agent}.toml"
        if value != expected:
            raise SystemExit(f"rendered Codex config snippet: {agent} config_file is {value!r}, expected {expected!r}")


def render_portable_snippet() -> str:
    generator = load_generator()
    return generator.render_codex_config(generator.load_manifest())


def run_sync_fixture(label: str, snippet_text: str, config_text: str | None) -> None:
    with tempfile.TemporaryDirectory(prefix=f"codex-config-{label}-") as tmp:
        root = Path(tmp)
        snippet = root / "snippet.toml"
        config = root / "config.toml"
        agent_dir = root / "agents"

        snippet.write_text(snippet_text)
        if config_text is not None:
            config.write_text(config_text)

        result = subprocess.run(
            [
                sys.executable,
                str(SYNC_SCRIPT),
                "--config",
                str(config),
                "--snippet",
                str(snippet),
                "--agent-dir",
                str(agent_dir),
            ],
            text=True,
            capture_output=True,
            check=False,
        )
        if result.returncode != 0:
            detail = result.stderr.strip() or result.stdout.strip()
            raise SystemExit(f"{label}: sync fixture failed: {detail}")

        output = config.read_text()
        assert_no_milovan_path(label, output)

        values = config_file_values(output)
        if not values:
            raise SystemExit(f"{label}: synced config has no consilium config_file values")
        for agent, value in sorted(values.items()):
            expected = str(agent_dir / f"{agent}.toml")
            if value != expected:
                raise SystemExit(f"{label}: {agent} config_file is {value!r}, expected {expected!r}")

        if config_text and "persist_me = true" in config_text and "persist_me = true" not in output:
            raise SystemExit(f"{label}: existing non-Consilium setting was not preserved")
        if config_text and "[features]" in config_text and "[features]" not in output:
            raise SystemExit(f"{label}: existing [features] block was not preserved")


def assert_installed_config(config_path: Path, agent_dir: Path) -> None:
    if not config_path.is_file():
        raise SystemExit(f"installed config does not exist: {config_path}")

    text = config_path.read_text()
    values = config_file_values(text)
    if not values:
        raise SystemExit(f"installed config has no consilium config_file values: {config_path}")

    for agent, value in sorted(values.items()):
        expected = str(agent_dir / f"{agent}.toml")
        if value != expected:
            raise SystemExit(f"installed config: {agent} config_file is {value!r}, expected {expected!r}")

        agent_file = Path(value)
        if not agent_file.is_file():
            raise SystemExit(f"installed config: missing agent file for {agent}: {agent_file}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--simulate-fresh-config",
        action="store_true",
        help="also simulate missing config and config without [features]",
    )
    parser.add_argument(
        "--installed",
        action="store_true",
        help="also verify the current user's installed Codex config and agent file paths",
    )
    args = parser.parse_args()

    snippet_text = render_portable_snippet()
    assert_portable_snippet(snippet_text)

    run_sync_fixture(
        "existing-features",
        snippet_text,
        'persist_me = true\n\n[features]\nmodel_context_window = 200000\n',
    )

    if args.simulate_fresh_config:
        run_sync_fixture("missing-config", snippet_text, None)
        run_sync_fixture("missing-features", snippet_text, 'persist_me = true\n')

    if args.installed:
        assert_installed_config(Path.home() / ".codex" / "config.toml", Path.home() / ".codex" / "agents")

    print("Codex config portability checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
