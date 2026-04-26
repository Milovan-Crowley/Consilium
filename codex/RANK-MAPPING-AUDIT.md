# Codex Rank Mapping Audit

Date: 2026-04-21
Repo: `/Users/milovan/projects/Consilium-codex`
Scope: Verify whether `consilium-scout` and `consilium-soldier` still exist in the Codex Consilium repo, and name their Codex replacements if they do not.

## Verdict

- `consilium-scout` does not exist in the Codex Consilium repo.
- `consilium-soldier` does not exist in the Codex Consilium repo.
- This repo is already authored around the newer Codex rank model.
- The stale `scout` and `soldier` references I found earlier belong to the separate Claude-oriented repo at `/Users/milovan/projects/Consilium`, not to this repo.

## Evidence

The Codex repo already declares its runtime shape in `README.md`:

- retrieval and interpretation:
  - `consilium-speculator-front`
  - `consilium-speculator-back`
  - `consilium-interpres-front`
  - `consilium-interpres-back`
  - `consilium-arbiter`
- execution ranks:
  - `consilium-centurio-front`
  - `consilium-centurio-back`
  - `consilium-centurio-primus`

The same shape is reinforced in:

- `source/manifest.json`
- `config/codex-config-snippet.toml`
- `source/protocols/consul-routing.md`
- `source/protocols/legatus-routing.md`

I did not find any `consilium-scout` or `consilium-soldier` tokens anywhere in this repo.

## Replacement Map

### Old `scout` function

There is no 1:1 Codex replacement. The old scout job has been split by purpose.

- Exact trace work:
  - `consilium-speculator-front`
  - `consilium-speculator-back`
- Interpretation and domain mapping:
  - `consilium-interpres-front`
  - `consilium-interpres-back`
- Cross-repo truth judgment:
  - `consilium-arbiter`

Practical rule:

- Use a `Speculator` for file, symbol, route, and execution-path confirmation.
- Use an `Interpres` for meaning, canonical-surface identification, and business-rule explanation.
- Use the `Arbiter` when frontend and backend claims must be judged against each other.

### Old `soldier` function

The old generic implementation worker has been replaced by the Centurion lane.

- Bounded frontend execution:
  - `consilium-centurio-front`
- Bounded backend execution:
  - `consilium-centurio-back`
- Reduced-ambiguity rescue or non-clean repo-local work:
  - `consilium-centurio-primus`

Practical rule:

- Use the matching `Centurio` for repo-local implementation.
- Use `Centurio Primus` only after ambiguity has already been reduced.

## Important Conclusion

The Codex repo does not need a rename rescue for `scout` and `soldier`.

The real issue is repo separation:

- `/Users/milovan/projects/Consilium-codex` already uses the new Codex rank model.
- `/Users/milovan/projects/Consilium` still contains older `scout` and `soldier` language because it is the separate Claude-oriented repo.

So if we make changes from here, the safe sequence is:

1. Keep treating the repos as separate systems.
2. Do not use Claude-side rank names as evidence about Codex.
3. If you want alignment later, decide whether that alignment is:
   - conceptual only, with different runtime names allowed per harness
   - or a real cross-repo naming convergence project

## Recommendation

No Codex agent rename is needed right now.

If there is follow-up work, it should be one of these:

1. Audit the Claude repo independently and decide whether its `scout` and `soldier` names are still intentional there.
2. Write a short cross-repo note explaining the harness split so future audits do not mix the two systems again.
3. If you want one shared mental model across both repos, define the canonical conceptual map explicitly:
   - `Scout` concept → `Speculator` or `Interpres` in Codex
   - `Soldier` concept → `Centurio` lane in Codex
