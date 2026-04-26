# consilium-docs - Retrospective

## What we built

Split the original consilium-docs migration into Piece 1 bootstrap/preflight and Piece 2 guarded cutover, then moved Claude-Consilium runtime doctrine and case transport to `/Users/milovan/projects/consilium-docs`.

## What we learned

The migration marker only matters after Phase 0 guards exist in source and plugin cache. The safe shape is marker creation, guard-only install, negative halt simulation, then cutover.

## What would we do differently

Keep future migration plans from moving their own untracked source artifact without an explicit backup/recovery path.

## Patterns to promote

For runtime-surface migrations, require source/cache/user-agent snapshots, guard-first ordering, negative guard simulation, and a final global stale-reference gate.
