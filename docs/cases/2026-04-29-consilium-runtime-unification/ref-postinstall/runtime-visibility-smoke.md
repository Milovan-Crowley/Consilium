# Runtime Visibility Smoke

Active Claude plugin source path: /Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification/claude

## Claude

- Fresh Claude session started: yes
- /consul resolves from the Consilium plugin: yes
- /tribune resolves from the Consilium plugin: yes
- active Claude plugin source path is `/Users/milovan/projects/Consilium/.worktrees/feature/consilium-runtime-unification/claude`: yes
- `consilium-centurio-primus` is visible as a user-scope agent: yes
- `consilium-speculator-primus` is visible as a user-scope agent: yes
- `consilium-soldier` is no longer needed for active dispatch: yes
- `consilium-scout` is no longer needed for active dispatch: yes

## Codex

- Fresh Codex thread started: yes
- `consilium-centurio-primus` is registered: yes
- `consilium-speculator-primus` is registered: yes
- `consilium-consul` is registered if Codex supports configured orchestration agents: yes
- `consilium-legatus` is registered if Codex supports configured orchestration agents: yes

## Evidence

- Claude plugin list: `ref-postinstall/claude-plugin-list.txt`
- Claude agent list: `ref-postinstall/claude-agents-list.txt`
- Claude plugin validation: `ref-postinstall/claude-plugin-validate.txt`
- Codex fresh exec output: `ref-postinstall/codex-fresh-thread-smoke.txt`
- Codex config contains `[agents.consilium-centurio-primus]`, `[agents.consilium-speculator-primus]`, `[agents.consilium-consul]`, and `[agents.consilium-legatus]`.
