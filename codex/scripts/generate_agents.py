#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "source"
MANIFEST = SOURCE / "manifest.json"
AGENTS_DIR = ROOT / "agents"
CONFIG_SNIPPET = ROOT / "config" / "codex-config-snippet.toml"


def load_manifest() -> dict:
    return json.loads(MANIFEST.read_text())


def quote(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def render_agent(agent: dict) -> str:
    role = (SOURCE / agent["role_file"]).read_text().rstrip()
    includes = []
    for rel in agent["include_files"]:
        includes.append((SOURCE / rel).read_text().rstrip())

    sections = [role] + includes
    developer_instructions = "\n\n".join(section for section in sections if section).rstrip() + "\n"

    body = [
        f'name = {quote(agent["name"])}',
        f'description = {quote(agent["description"])}',
        f'model = {quote(agent["model"])}',
        f'model_reasoning_effort = {quote(agent["reasoning_effort"])}',
        f'sandbox_mode = {quote(agent["sandbox_mode"])}',
        'developer_instructions = """',
        developer_instructions.rstrip(),
        '"""',
        "",
    ]
    return "\n".join(body)


def write_agents(manifest: dict) -> None:
    AGENTS_DIR.mkdir(parents=True, exist_ok=True)
    expected = set()

    for agent in manifest["agents"]:
        filename = f'{agent["name"]}.toml'
        expected.add(filename)
        (AGENTS_DIR / filename).write_text(render_agent(agent))

    for stale in AGENTS_DIR.glob("consilium-*.toml"):
        if stale.name not in expected:
            stale.unlink()


def write_config_snippet(manifest: dict) -> None:
    lines = ['project_doc_fallback_filenames = ["AGENTS.md"]', ""]

    for agent in manifest["agents"]:
        nicknames = ", ".join(quote(name) for name in agent["nickname_candidates"])
        config_file = f"/Users/milovan/.codex/agents/{agent['name']}.toml"
        lines.extend(
            [
                f'[agents.{agent["name"]}]',
                f"config_file = {quote(config_file)}",
                f'description = {quote(agent["description"])}',
                f'nickname_candidates = [{nicknames}]',
                "",
            ]
        )

    CONFIG_SNIPPET.parent.mkdir(parents=True, exist_ok=True)
    CONFIG_SNIPPET.write_text("\n".join(lines).rstrip() + "\n")


def main() -> None:
    manifest = load_manifest()
    write_agents(manifest)
    write_config_snippet(manifest)
    print(f"Generated {len(manifest['agents'])} agent TOMLs")


if __name__ == "__main__":
    main()
