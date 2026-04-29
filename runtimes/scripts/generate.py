#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "source"
MANIFEST = SOURCE / "manifest.json"

GENERATED = ROOT / "generated"
GENERATED_CLAUDE_AGENTS = GENERATED / "claude" / "agents"
GENERATED_CLAUDE_SKILLS = GENERATED / "claude" / "skills"
GENERATED_CODEX_AGENTS = GENERATED / "codex" / "agents"
GENERATED_CODEX_CONFIG = GENERATED / "codex" / "config" / "codex-config-snippet.toml"

CODEX_SOURCE = ROOT / "codex" / "source"
CODEX_AGENTS = ROOT / "codex" / "agents"
CODEX_CONFIG = ROOT / "codex" / "config" / "codex-config-snippet.toml"
CLAUDE_SKILLS = ROOT / "claude" / "skills"


CLAUDE_TOOL_PROFILES = {
    "read": [
        "Read",
        "Grep",
        "Glob",
        "Skill",
        "mcp__serena__find_symbol",
        "mcp__serena__find_referencing_symbols",
        "mcp__serena__get_symbols_overview",
        "mcp__serena__search_for_pattern",
        "mcp__serena__find_file",
        "mcp__serena__list_dir",
        "mcp__medusa__ask_medusa_question",
    ],
    "read_bash": [
        "Read",
        "Grep",
        "Glob",
        "Skill",
        "Bash",
        "mcp__serena__find_symbol",
        "mcp__serena__find_referencing_symbols",
        "mcp__serena__get_symbols_overview",
        "mcp__serena__search_for_pattern",
        "mcp__serena__find_file",
        "mcp__serena__list_dir",
        "mcp__medusa__ask_medusa_question",
    ],
    "write": [
        "Read",
        "Write",
        "Edit",
        "Grep",
        "Glob",
        "Bash",
        "WebFetch",
        "Skill",
        "mcp__serena__find_symbol",
        "mcp__serena__find_referencing_symbols",
        "mcp__serena__get_symbols_overview",
        "mcp__serena__search_for_pattern",
        "mcp__serena__replace_symbol_body",
        "mcp__serena__insert_after_symbol",
        "mcp__serena__insert_before_symbol",
        "mcp__serena__rename_symbol",
        "mcp__serena__safe_delete_symbol",
        "mcp__serena__find_file",
        "mcp__serena__list_dir",
        "mcp__serena__activate_project",
        "mcp__medusa__ask_medusa_question",
    ],
}


def load_manifest() -> dict:
    return json.loads(MANIFEST.read_text())


def quote(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def reset_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def copy_tree(src: Path, dst: Path) -> None:
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)


def composed_body(agent: dict) -> str:
    sections = [(SOURCE / agent["role_file"]).read_text().rstrip()]
    sections.extend((SOURCE / rel).read_text().rstrip() for rel in agent.get("include_files", []))
    return "\n\n".join(section for section in sections if section).rstrip() + "\n"


def render_codex_agent(agent: dict) -> str:
    return "\n".join(
        [
            f'name = {quote(agent["name"])}',
            f'description = {quote(agent["description"])}',
            f'model = {quote(agent["model"])}',
            f'model_reasoning_effort = {quote(agent["reasoning_effort"])}',
            f'sandbox_mode = {quote(agent["sandbox_mode"])}',
            'developer_instructions = """',
            composed_body(agent).rstrip(),
            '"""',
            "",
        ]
    )


def render_claude_agent(agent: dict) -> str:
    claude = agent["runtime_surfaces"]["claude"]
    tools_profile = claude.get("tools_profile", "read")
    tools = CLAUDE_TOOL_PROFILES[tools_profile]
    servers = claude.get("mcp_servers") or ["serena", "medusa"]
    frontmatter = [
        "---",
        f"name: {agent['name']}",
        f"description: {agent['description']}",
        f"tools: {', '.join(tools)}",
        "mcpServers:",
    ]
    frontmatter.extend(f"  - {server}" for server in servers)
    frontmatter.extend([f"model: {claude.get('model', 'opus')}", "---"])
    return "\n".join(frontmatter) + "\n" + composed_body(agent)


def write_codex_outputs(manifest: dict) -> int:
    reset_dir(GENERATED_CODEX_AGENTS)
    GENERATED_CODEX_CONFIG.parent.mkdir(parents=True, exist_ok=True)

    agents = [agent for agent in manifest["agents"] if agent["runtime_surfaces"]["codex"]["enabled"]]
    for agent in agents:
        (GENERATED_CODEX_AGENTS / f"{agent['name']}.toml").write_text(render_codex_agent(agent))

    lines = ['project_doc_fallback_filenames = ["AGENTS.md"]', ""]
    for agent in agents:
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
    GENERATED_CODEX_CONFIG.write_text("\n".join(lines).rstrip() + "\n")
    return len(agents)


def write_claude_outputs(manifest: dict) -> int:
    reset_dir(GENERATED_CLAUDE_AGENTS)
    agents = [
        agent
        for agent in manifest["agents"]
        if agent["runtime_surfaces"]["claude"]["enabled"]
        and agent["runtime_surfaces"]["claude"].get("surface") == "agent"
    ]
    for agent in agents:
        (GENERATED_CLAUDE_AGENTS / f"{agent['name']}.md").write_text(render_claude_agent(agent))
    return len(agents)


def sync_compatibility_copies() -> int:
    copy_tree(SOURCE, CODEX_SOURCE)
    copy_tree(GENERATED_CODEX_AGENTS, CODEX_AGENTS)
    CODEX_CONFIG.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(GENERATED_CODEX_CONFIG, CODEX_CONFIG)
    copy_tree(GENERATED_CLAUDE_SKILLS, CLAUDE_SKILLS)
    return 4


def main() -> None:
    manifest = load_manifest()
    copy_tree(SOURCE / "skills" / "claude", GENERATED_CLAUDE_SKILLS)
    codex_count = write_codex_outputs(manifest)
    claude_agent_count = write_claude_outputs(manifest)
    compatibility_count = sync_compatibility_copies()
    claude_skill_count = sum(1 for path in GENERATED_CLAUDE_SKILLS.glob("*/SKILL.md") if path.is_file())
    print(f"Generated {codex_count} Codex agents")
    print(f"Generated {claude_agent_count} Claude agents")
    print(f"Generated {claude_skill_count} Claude skills")
    print(f"Synced {compatibility_count} compatibility paths")


if __name__ == "__main__":
    main()
