# Kimi Principales v1 (Substrate) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use consilium:legion (recommended) or consilium:march to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Kimi Principales MCP server — a Moonshot-backed lane-verification tool with strict schema discipline, evidence-locator validation, and classic-fallback semantics. Ship dormant; integration is a separate case.

**Architecture:** A new TypeScript MCP server at `claude/mcps/principales/` exposes three tools (`verify_lane`, `health`, `mode`) over the standard MCP transport. The wrapper enforces sterile-clerk discipline at the host layer — Kimi cannot emit verdicts the schema rejects, evidence the wrapper cannot resolve, or "looks good" SOUNDs without locators. Two new doctrine files (`principales.md` sterile-clerk doctrine, `lanes.md` taxonomy) land alongside the existing verification protocol without amending it. No producer skill, officer agent, or Codex file changes.

**Tech Stack:** TypeScript, `@modelcontextprotocol/sdk`, `openai` SDK (Moonshot is OpenAI-compatible), `zod` for schema validation, `vitest` test runner. Initialized via the `mcp-server-dev:build-mcp-server` skill.

**Spec reference:** `/Users/milovan/projects/Consilium/docs/cases/2026-04-26-kimi-principales-v1/spec.md`. Companion `next-session-notes.md` parks deferred integration work — soldiers do not need to read it; it is for the next session's Consul.

---

## Pre-march Reconnaissance (do not implement)

Confirmed before plan dispatch:
- `claude/mcps/` does not exist today — Task 1 creates the parent directory.
- `claude/skills/references/verification/` exists; contains `protocol.md` + `templates/` only — Tasks 16 and 17 add `principales.md` and `lanes.md` siblings.
- `~/.claude/settings.json` has no top-level `mcpServers` key — Task 22 creates it for the first time.
- The drift-check script lives at `/Users/milovan/projects/Consilium/claude/scripts/check-codex-drift.py` (not `scripts/check-codex-drift.py` per `claude/CLAUDE.md`'s broken Maintenance line). This plan does not run drift-check (no agent files edited), but the integration case will need the correct path.
- Node v25 is installed; `vitest` and `tsc` come via `npm install` as devDependencies of the package.

---

## Task 1: Bootstrap MCP package

> **Confidence: High** — `mcp-server-dev:build-mcp-server` skill conventions are documented; package layout follows them.

**Files:**
- Create: `claude/mcps/principales/package.json`
- Create: `claude/mcps/principales/tsconfig.json`
- Create: `claude/mcps/principales/vitest.config.ts`
- Create: `claude/mcps/principales/.gitignore`
- Create: `claude/mcps/principales/README.md`
- Create: `claude/mcps/principales/src/index.ts` (placeholder hello-world for build verification)

**Required skill:** Soldier invokes `Skill(skill: "mcp-server-dev:build-mcp-server")` on arrival. The skill produces the canonical bootstrap layout; the soldier adapts file contents to the values below.

- [ ] **Step 1: Invoke mcp-server-dev skill and create package.json**

```json
{
  "name": "consilium-principales",
  "version": "0.1.0",
  "description": "Kimi Principales MCP — Moonshot-backed lane verification for Consilium",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "consilium-principales": "dist/index.js"
  },
  "files": ["dist", "prompts", "schemas"],
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "openai": "^4.70.0",
    "zod": "^3.25.4"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

- [ ] **Step 3: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
*.log
.env
.env.local
```

- [ ] **Step 5: Create README.md**

```markdown
# consilium-principales

Kimi Principales MCP — Moonshot-backed lane verification for Consilium.

Substrate only. Integration with Consilium dispatch lives in a separate case.

## Build

```bash
npm install
npm run build
```

## Test

```bash
npm test
```

## Configuration

Environment variables (set via Claude Code's `mcpServers` config):

- `MOONSHOT_API_KEY` — required. Never logged.
- `CONSILIUM_VERIFICATION_MODE` — read by `mode()` tool. Substrate does not branch on it.
- `CONSILIUM_KIMI_DEFAULT_MODEL` — default `kimi-k2.5`.
- `CONSILIUM_KIMI_ESCALATION_MODEL` — default `kimi-k2.6`.
- `CONSILIUM_KIMI_SESSION_BUDGET_USD` — default `5`. Per-session, in-memory.
- `CONSILIUM_KIMI_MAX_CONCURRENCY` — default `4`.
- `CONSILIUM_KIMI_TIMEOUT_MS` — default `45000`.
- `CONSILIUM_KIMI_DISABLE_THINKING` — default `true`.

## Tools

- `mcp__principales__verify_lane(args) → docket` — primary entrypoint.
- `mcp__principales__health() → status` — operator visibility.
- `mcp__principales__mode() → string` — reads `CONSILIUM_VERIFICATION_MODE`.

See `/Users/milovan/projects/Consilium/docs/cases/2026-04-26-kimi-principales-v1/spec.md` for the full design.
```

- [ ] **Step 6: Create src/index.ts placeholder**

```ts
// Bootstrap placeholder. Replaced in Task 13 (server registration).
console.error('consilium-principales: not yet implemented');
process.exit(1);
```

- [ ] **Step 7: Install dependencies and verify build**

Run from `claude/mcps/principales/`:

```bash
npm install
npm run build
ls dist/index.js
```

Expected: `dist/index.js` exists.

- [ ] **Step 8: Commit**

```bash
git add claude/mcps/principales/
git commit -m "feat: bootstrap consilium-principales MCP package"
```

---

## Task 2: Schema definition (`principalis_docket.v1`)

> **Confidence: High** — schema shape inherited verbatim from spec Section 2 (cross-field rules) and reference plan Section 6, with two documented changes: `officer` field dropped, `transport_failure` added to `unverified_reason` enum.

**Files:**
- Create: `claude/mcps/principales/src/docket/schema.ts`
- Create: `claude/mcps/principales/schemas/principalis_docket.v1.json`
- Create: `claude/mcps/principales/test/schema.test.ts`

- [ ] **Step 1: Write the failing test**

`test/schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { DocketSchema, type Docket } from '../src/docket/schema.js';

describe('principalis_docket.v1 schema', () => {
  it('accepts a minimal valid SOUND docket with strong evidence', () => {
    const docket = {
      schema_version: 'principalis_docket.v1',
      run_id: 'run-1',
      artifact_id: 'art-1',
      artifact_sha: 'sha-1',
      artifact_type: 'spec',
      lane: 'upstream-coverage',
      bundle_id: 'bundle-1',
      model: 'kimi-k2.5',
      profile: 'principalis_light',
      completion_status: 'complete',
      overall: 'SOUND',
      admissible: true,
      requires_officer_review: false,
      findings: [],
      evidence_summary: 'no findings; artifact aligns with supplied evidence',
      unverified_claims: [],
      tool_transcript_refs: [],
      runtime: {
        started_at: '2026-04-26T00:00:00Z',
        finished_at: '2026-04-26T00:00:01Z',
        attempt: 1,
        finish_reason: 'stop',
        prompt_tokens: 100,
        completion_tokens: 50,
        cached_tokens: 0,
      },
    };
    expect(() => DocketSchema.parse(docket)).not.toThrow();
  });

  it('rejects unsupported verdict in finding status', () => {
    const docket = {
      schema_version: 'principalis_docket.v1',
      run_id: 'run-1',
      artifact_id: 'art-1',
      artifact_sha: 'sha-1',
      artifact_type: 'spec',
      lane: 'upstream-coverage',
      bundle_id: 'bundle-1',
      model: 'kimi-k2.5',
      profile: 'principalis_light',
      completion_status: 'complete',
      overall: 'FINE', // bad
      admissible: true,
      requires_officer_review: false,
      findings: [],
      unverified_claims: [],
      tool_transcript_refs: [],
      runtime: {
        started_at: '2026-04-26T00:00:00Z',
        finished_at: '2026-04-26T00:00:01Z',
        attempt: 1,
        finish_reason: 'stop',
        prompt_tokens: 0,
        completion_tokens: 0,
        cached_tokens: 0,
      },
    };
    expect(() => DocketSchema.parse(docket)).toThrow();
  });

  it('rejects extra top-level fields', () => {
    const docket: Record<string, unknown> = {
      schema_version: 'principalis_docket.v1',
      run_id: 'run-1',
      artifact_id: 'art-1',
      artifact_sha: 'sha-1',
      artifact_type: 'spec',
      lane: 'upstream-coverage',
      bundle_id: 'bundle-1',
      model: 'kimi-k2.5',
      profile: 'principalis_light',
      completion_status: 'complete',
      overall: 'SOUND',
      admissible: true,
      requires_officer_review: false,
      findings: [],
      unverified_claims: [],
      tool_transcript_refs: [],
      runtime: {
        started_at: '2026-04-26T00:00:00Z',
        finished_at: '2026-04-26T00:00:01Z',
        attempt: 1,
        finish_reason: 'stop',
        prompt_tokens: 0,
        completion_tokens: 0,
        cached_tokens: 0,
      },
      naughty_extra: 'should fail',
    };
    expect(() => DocketSchema.parse(docket)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd claude/mcps/principales && npm test
```

Expected: FAIL with module-resolution error (`src/docket/schema.js` does not exist).

- [ ] **Step 3: Implement src/docket/schema.ts**

```ts
import { z } from 'zod';

export const Verdict = z.enum(['MISUNDERSTANDING', 'GAP', 'CONCERN', 'SOUND']);
export type Verdict = z.infer<typeof Verdict>;

export const ArtifactType = z.enum(['spec', 'plan', 'diagnosis', 'task', 'campaign']);
export const Profile = z.enum([
  'principalis_light',
  'principalis_grounded',
  'principalis_adversarial',
  'principalis_batch',
]);

export const CompletionStatus = z.enum([
  'complete',
  'truncated',
  'tool_error',
  'schema_error',
  'transport_error',
  'refused',
]);

export const UnverifiedReason = z.enum([
  'none',
  'missing_context',
  'missing_tool',
  'tool_failure',
  'tool_error',
  'transport_failure',
  'conflict',
  'truncation',
  'schema_failure',
]);

export const SourceType = z.enum([
  'artifact',
  'repo',
  'diff',
  'doctrine',
  'command',
  'tool_result',
  'upstream',
]);

const EvidenceItem = z
  .object({
    source_type: SourceType,
    source_id: z.string(),
    locator: z.string(),
    quote_or_fact: z.string(),
    supports: z.string(),
  })
  .strict();

const Finding = z
  .object({
    finding_id: z.string(),
    claim_id: z.string(),
    status: Verdict,
    claim: z.string(),
    assessment: z.string(),
    evidence_strength: z.enum(['none', 'weak', 'strong']),
    evidence: z.array(EvidenceItem),
    unverified_reason: UnverifiedReason,
    escalate: z.boolean(),
  })
  .strict();

const UnverifiedClaim = z
  .object({
    claim_id: z.string(),
    claim: z.string(),
    reason: z.enum([
      'missing_context',
      'missing_evidence',
      'tool_failure',
      'transport_failure',
      'conflict',
      'truncation',
    ]),
  })
  .strict();

const ToolTranscriptRef = z
  .object({
    tool_call_id: z.string(),
    tool_name: z.string(),
    status: z.enum(['success', 'failure', 'denied', 'timeout']),
    result_ref: z.string(),
  })
  .strict();

const Runtime = z
  .object({
    started_at: z.string(),
    finished_at: z.string(),
    attempt: z.number().int().min(1),
    finish_reason: z.enum(['stop', 'length', 'tool_calls', 'error']),
    prompt_tokens: z.number().int().min(0),
    completion_tokens: z.number().int().min(0),
    cached_tokens: z.number().int().min(0),
  })
  .strict();

export const DocketSchema = z
  .object({
    schema_version: z.literal('principalis_docket.v1'),
    run_id: z.string(),
    artifact_id: z.string(),
    artifact_sha: z.string(),
    artifact_type: ArtifactType,
    lane: z.string(),
    bundle_id: z.string(),
    model: z.string(),
    profile: Profile,
    completion_status: CompletionStatus,
    overall: Verdict,
    admissible: z.boolean(),
    requires_officer_review: z.boolean(),
    findings: z.array(Finding),
    evidence_summary: z.string().optional(),
    unverified_claims: z.array(UnverifiedClaim),
    tool_transcript_refs: z.array(ToolTranscriptRef),
    runtime: Runtime,
  })
  .strict();

export type Docket = z.infer<typeof DocketSchema>;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd claude/mcps/principales && npm test
```

Expected: 3 PASS.

- [ ] **Step 5: Generate JSON Schema export**

`schemas/principalis_docket.v1.json` (hand-written to mirror the zod schema):

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://consilium.divinipress.com/schemas/principalis_docket.v1.json",
  "title": "principalis_docket.v1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema_version", "run_id", "artifact_id", "artifact_sha", "artifact_type",
    "lane", "bundle_id", "model", "profile", "completion_status", "overall",
    "admissible", "requires_officer_review", "findings", "unverified_claims",
    "tool_transcript_refs", "runtime"
  ],
  "properties": {
    "schema_version": { "const": "principalis_docket.v1" },
    "run_id": { "type": "string" },
    "artifact_id": { "type": "string" },
    "artifact_sha": { "type": "string" },
    "artifact_type": { "enum": ["spec", "plan", "diagnosis", "task", "campaign"] },
    "lane": { "type": "string" },
    "bundle_id": { "type": "string" },
    "model": { "type": "string" },
    "profile": { "enum": ["principalis_light", "principalis_grounded", "principalis_adversarial", "principalis_batch"] },
    "completion_status": { "enum": ["complete", "truncated", "tool_error", "schema_error", "transport_error", "refused"] },
    "overall": { "enum": ["MISUNDERSTANDING", "GAP", "CONCERN", "SOUND"] },
    "admissible": { "type": "boolean" },
    "requires_officer_review": { "type": "boolean" },
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["finding_id", "claim_id", "status", "claim", "assessment", "evidence_strength", "evidence", "unverified_reason", "escalate"],
        "properties": {
          "finding_id": { "type": "string" },
          "claim_id": { "type": "string" },
          "status": { "enum": ["MISUNDERSTANDING", "GAP", "CONCERN", "SOUND"] },
          "claim": { "type": "string" },
          "assessment": { "type": "string" },
          "evidence_strength": { "enum": ["none", "weak", "strong"] },
          "evidence": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": ["source_type", "source_id", "locator", "quote_or_fact", "supports"],
              "properties": {
                "source_type": { "enum": ["artifact", "repo", "diff", "doctrine", "command", "tool_result", "upstream"] },
                "source_id": { "type": "string" },
                "locator": { "type": "string" },
                "quote_or_fact": { "type": "string" },
                "supports": { "type": "string" }
              }
            }
          },
          "unverified_reason": { "enum": ["none", "missing_context", "missing_tool", "tool_failure", "tool_error", "transport_failure", "conflict", "truncation", "schema_failure"] },
          "escalate": { "type": "boolean" }
        }
      }
    },
    "evidence_summary": { "type": "string" },
    "unverified_claims": { "type": "array" },
    "tool_transcript_refs": { "type": "array" },
    "runtime": {
      "type": "object",
      "additionalProperties": false,
      "required": ["started_at", "finished_at", "attempt", "finish_reason", "prompt_tokens", "completion_tokens", "cached_tokens"],
      "properties": {
        "started_at": { "type": "string" },
        "finished_at": { "type": "string" },
        "attempt": { "type": "integer", "minimum": 1 },
        "finish_reason": { "enum": ["stop", "length", "tool_calls", "error"] },
        "prompt_tokens": { "type": "integer", "minimum": 0 },
        "completion_tokens": { "type": "integer", "minimum": 0 },
        "cached_tokens": { "type": "integer", "minimum": 0 }
      }
    }
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add claude/mcps/principales/src/docket/schema.ts claude/mcps/principales/schemas/principalis_docket.v1.json claude/mcps/principales/test/schema.test.ts
git commit -m "feat: principalis_docket.v1 schema (zod + JSON Schema)"
```

---

## Task 3: Cross-field validator

> **Confidence: High** — ten cross-field rules enumerated in spec Section 2; this task implements them as a post-zod validation pass.

**Files:**
- Create: `claude/mcps/principales/src/docket/cross-field.ts`
- Create: `claude/mcps/principales/test/cross-field.test.ts`

- [ ] **Step 1: Write failing tests**

`test/cross-field.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { applyCrossFieldRules, type ValidationResult } from '../src/docket/cross-field.js';
import type { Docket } from '../src/docket/schema.js';

const baseDocket = (overrides: Partial<Docket> = {}): Docket => ({
  schema_version: 'principalis_docket.v1',
  run_id: 'run-1',
  artifact_id: 'art-1',
  artifact_sha: 'sha-1',
  artifact_type: 'spec',
  lane: 'upstream-coverage',
  bundle_id: 'bundle-1',
  model: 'kimi-k2.5',
  profile: 'principalis_light',
  completion_status: 'complete',
  overall: 'SOUND',
  admissible: true,
  requires_officer_review: false,
  findings: [],
  evidence_summary: 'no findings',
  unverified_claims: [],
  tool_transcript_refs: [],
  runtime: {
    started_at: 't0', finished_at: 't1', attempt: 1, finish_reason: 'stop',
    prompt_tokens: 0, completion_tokens: 0, cached_tokens: 0,
  },
  ...overrides,
});

describe('cross-field rules', () => {
  it('rule 1: overall is the worst material status among findings', () => {
    const docket = baseDocket({
      overall: 'SOUND',
      findings: [
        { finding_id: 'f1', claim_id: 'c1', status: 'GAP', claim: '', assessment: '',
          evidence_strength: 'strong',
          evidence: [{ source_type: 'artifact', source_id: 's', locator: 'l', quote_or_fact: 'q', supports: 's' }],
          unverified_reason: 'none', escalate: false },
      ],
    });
    const result = applyCrossFieldRules(docket);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('rule 1: overall must be GAP (worst finding), got SOUND');
  });

  it('rule 2: SOUND requires at least one strong evidence item per SOUND finding', () => {
    const docket = baseDocket({
      overall: 'SOUND',
      findings: [
        { finding_id: 'f1', claim_id: 'c1', status: 'SOUND', claim: '', assessment: '',
          evidence_strength: 'weak', evidence: [], unverified_reason: 'none', escalate: false },
      ],
    });
    const result = applyCrossFieldRules(docket);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('rule 2'))).toBe(true);
  });

  it('rule 3: completion_status != complete forces requires_officer_review', () => {
    const docket = baseDocket({
      completion_status: 'truncated',
      requires_officer_review: false,
    });
    const result = applyCrossFieldRules(docket);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('rule 3'))).toBe(true);
  });

  it('rule 4: transport_failure cannot produce overall SOUND', () => {
    const docket = baseDocket({
      overall: 'SOUND',
      findings: [
        { finding_id: 'f1', claim_id: 'c1', status: 'SOUND', claim: '', assessment: '',
          evidence_strength: 'strong',
          evidence: [{ source_type: 'artifact', source_id: 's', locator: 'l', quote_or_fact: 'q', supports: 's' }],
          unverified_reason: 'transport_failure', escalate: false },
      ],
    });
    const result = applyCrossFieldRules(docket);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('rule 4'))).toBe(true);
  });

  it('rule 5: MISUNDERSTANDING forces requires_officer_review', () => {
    const docket = baseDocket({
      overall: 'MISUNDERSTANDING',
      requires_officer_review: false,
      findings: [
        { finding_id: 'f1', claim_id: 'c1', status: 'MISUNDERSTANDING', claim: '', assessment: '',
          evidence_strength: 'strong',
          evidence: [{ source_type: 'doctrine', source_id: 's', locator: 'l', quote_or_fact: 'q', supports: 's' }],
          unverified_reason: 'none', escalate: true },
      ],
    });
    const result = applyCrossFieldRules(docket);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('rule 5'))).toBe(true);
  });

  it('rule 6: empty findings allowed only with overall=SOUND and evidence_summary present', () => {
    const docket = baseDocket({
      overall: 'GAP',
      findings: [],
    });
    const result = applyCrossFieldRules(docket);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('rule 6'))).toBe(true);
  });

  it('passes a valid SOUND docket with strong-evidenced findings', () => {
    const docket = baseDocket({
      overall: 'SOUND',
      findings: [
        { finding_id: 'f1', claim_id: 'c1', status: 'SOUND', claim: '', assessment: '',
          evidence_strength: 'strong',
          evidence: [{ source_type: 'artifact', source_id: 's', locator: 'l', quote_or_fact: 'q', supports: 's' }],
          unverified_reason: 'none', escalate: false },
      ],
    });
    expect(applyCrossFieldRules(docket).ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd claude/mcps/principales && npm test
```

Expected: FAIL — `cross-field.js` does not exist.

- [ ] **Step 3: Implement cross-field.ts**

```ts
import type { Docket, Verdict } from './schema.js';

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

export const VERDICT_SEVERITY: Record<Verdict, number> = {
  SOUND: 0,
  CONCERN: 1,
  GAP: 2,
  MISUNDERSTANDING: 3,
};

export function worstStatus(statuses: Verdict[]): Verdict {
  if (statuses.length === 0) return 'SOUND';
  return statuses.reduce((worst, s) =>
    VERDICT_SEVERITY[s] > VERDICT_SEVERITY[worst] ? s : worst,
  );
}

export function applyCrossFieldRules(docket: Docket): ValidationResult {
  const errors: string[] = [];

  // Rule 1: overall must be the worst finding status
  const expectedOverall = worstStatus(docket.findings.map((f) => f.status));
  if (docket.findings.length > 0 && docket.overall !== expectedOverall) {
    errors.push(`rule 1: overall must be ${expectedOverall} (worst finding), got ${docket.overall}`);
  }

  // Rule 2: every SOUND finding has at least one strong evidence item
  for (const f of docket.findings) {
    if (f.status === 'SOUND') {
      const hasStrong = f.evidence_strength === 'strong' && f.evidence.length > 0;
      if (!hasStrong) {
        errors.push(`rule 2: SOUND finding ${f.finding_id} requires evidence_strength=strong with at least one evidence item`);
      }
    }
  }

  // Rule 3: completion_status != complete forces requires_officer_review
  if (docket.completion_status !== 'complete' && !docket.requires_officer_review) {
    errors.push(`rule 3: completion_status=${docket.completion_status} requires requires_officer_review=true`);
  }

  // Rule 4: transport_failure / missing_context / truncation cannot produce overall SOUND
  const blockingReasons = new Set(['transport_failure', 'missing_context', 'truncation', 'tool_failure', 'tool_error', 'schema_failure']);
  if (docket.overall === 'SOUND') {
    for (const f of docket.findings) {
      if (blockingReasons.has(f.unverified_reason)) {
        errors.push(`rule 4: finding ${f.finding_id} has blocking unverified_reason=${f.unverified_reason}; overall cannot be SOUND`);
      }
    }
  }

  // Rule 5: MISUNDERSTANDING (overall or any finding) forces requires_officer_review
  const hasMisunderstanding =
    docket.overall === 'MISUNDERSTANDING' ||
    docket.findings.some((f) => f.status === 'MISUNDERSTANDING');
  if (hasMisunderstanding && !docket.requires_officer_review) {
    errors.push('rule 5: MISUNDERSTANDING present; requires_officer_review must be true');
  }

  // Rule 6: empty findings allowed only when overall=SOUND and evidence_summary exists
  if (docket.findings.length === 0) {
    if (docket.overall !== 'SOUND') {
      errors.push(`rule 6: empty findings requires overall=SOUND, got ${docket.overall}`);
    }
    if (!docket.evidence_summary || docket.evidence_summary.trim() === '') {
      errors.push('rule 6: empty findings requires non-empty evidence_summary');
    }
  }

  // Rules 7 (extra fields), 8 (unsupported verdicts) are enforced by zod's .strict() in schema.ts.
  // Rule 9 (locator resolution) is enforced by the locator validator (Task 4).
  // Rule 10 (missing claims to unverified) is enforced by the request-builder/verify_lane glue (Task 13)
  //   — we cannot detect "missing claims" here without knowing the requested claim list.

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd claude/mcps/principales && npm test
```

Expected: All cross-field tests PASS.

- [ ] **Step 5: Commit**

```bash
git add claude/mcps/principales/src/docket/cross-field.ts claude/mcps/principales/test/cross-field.test.ts
git commit -m "feat: principales cross-field rule validator"
```

---

## Task 4: Evidence-locator validator

> **Confidence: High** — spec Section 2 rule 9 mandates host-side locator resolution. Locator format is `<source_id>` keyed against the supplied evidence_bundle.

**Files:**
- Create: `claude/mcps/principales/src/docket/locator.ts`
- Create: `claude/mcps/principales/test/locator.test.ts`

- [ ] **Step 1: Write failing tests**

`test/locator.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveLocators, type EvidenceBundle } from '../src/docket/locator.js';
import type { Docket } from '../src/docket/schema.js';

const docketWithLocator = (locator: string, sourceId: string): Docket => ({
  schema_version: 'principalis_docket.v1',
  run_id: 'r', artifact_id: 'a', artifact_sha: 's', artifact_type: 'spec',
  lane: 'l', bundle_id: 'b', model: 'm', profile: 'principalis_light',
  completion_status: 'complete', overall: 'SOUND',
  admissible: true, requires_officer_review: false,
  findings: [{
    finding_id: 'f1', claim_id: 'c1', status: 'SOUND', claim: '', assessment: '',
    evidence_strength: 'strong',
    evidence: [{ source_type: 'artifact', source_id: sourceId, locator, quote_or_fact: 'q', supports: 's' }],
    unverified_reason: 'none', escalate: false,
  }],
  evidence_summary: 'x',
  unverified_claims: [], tool_transcript_refs: [],
  runtime: { started_at: 't0', finished_at: 't1', attempt: 1, finish_reason: 'stop',
    prompt_tokens: 0, completion_tokens: 0, cached_tokens: 0 },
});

describe('locator resolution', () => {
  it('passes when locator resolves to a supplied evidence source', () => {
    const bundle: EvidenceBundle = {
      sources: [
        { source_id: 'spec.md', source_type: 'artifact', content: '# Header\nLine 2\nLine 3' },
      ],
    };
    const docket = docketWithLocator('spec.md:1-3', 'spec.md');
    const result = resolveLocators(docket, bundle);
    expect(result.ok).toBe(true);
  });

  it('fails when locator references a source_id not in the bundle', () => {
    const bundle: EvidenceBundle = { sources: [{ source_id: 'spec.md', source_type: 'artifact', content: '' }] };
    const docket = docketWithLocator('phantom.md:1-3', 'phantom.md');
    const result = resolveLocators(docket, bundle);
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/phantom\.md/);
  });

  it('fails when locator line range exceeds source length', () => {
    const bundle: EvidenceBundle = {
      sources: [{ source_id: 'spec.md', source_type: 'artifact', content: 'one\ntwo' }],
    };
    const docket = docketWithLocator('spec.md:5-10', 'spec.md');
    const result = resolveLocators(docket, bundle);
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/out of range/);
  });

  it('passes for non-line-range locators (e.g. section anchors)', () => {
    const bundle: EvidenceBundle = {
      sources: [{ source_id: 'doctrine.md', source_type: 'doctrine', content: '## Section A' }],
    };
    const docket = docketWithLocator('doctrine.md#section-a', 'doctrine.md');
    const result = resolveLocators(docket, bundle);
    expect(result.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd claude/mcps/principales && npm test
```

Expected: FAIL — `locator.js` does not exist.

- [ ] **Step 3: Implement locator.ts**

```ts
import type { Docket } from './schema.js';

export interface EvidenceSource {
  source_id: string;
  source_type: 'artifact' | 'repo' | 'diff' | 'doctrine' | 'command' | 'tool_result' | 'upstream';
  content: string;
}

export interface EvidenceBundle {
  sources: EvidenceSource[];
}

export type LocatorResult =
  | { ok: true }
  | { ok: false; errors: string[] };

const LINE_RANGE_RE = /^(.+?):(\d+)(?:-(\d+))?$/;

export function resolveLocators(docket: Docket, bundle: EvidenceBundle): LocatorResult {
  const errors: string[] = [];
  const byId = new Map(bundle.sources.map((s) => [s.source_id, s]));

  for (const finding of docket.findings) {
    for (const ev of finding.evidence) {
      const src = byId.get(ev.source_id);
      if (!src) {
        errors.push(`locator: finding ${finding.finding_id} cites source_id ${ev.source_id} not in evidence_bundle`);
        continue;
      }

      const match = LINE_RANGE_RE.exec(ev.locator);
      if (match) {
        const [, , startStr, endStr] = match;
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : start;
        const lineCount = src.content.split('\n').length;
        if (start < 1 || end > lineCount) {
          errors.push(`locator: finding ${finding.finding_id} locator ${ev.locator} out of range (source has ${lineCount} lines)`);
        }
      }
      // Non-line-range locators (section anchors, command refs) accepted as long as source_id resolves.
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd claude/mcps/principales && npm test
```

Expected: All locator tests PASS.

- [ ] **Step 5: Commit**

```bash
git add claude/mcps/principales/src/docket/locator.ts claude/mcps/principales/test/locator.test.ts
git commit -m "feat: principales evidence-locator validator"
```

---

## Task 5: Evidence-quality validator (downgrade SOUND→CONCERN)

> **Confidence: High** — spec Section 1: weakly-evidenced SOUND findings are flipped to CONCERN (the Codex verdict for "verifier has an opinion the wrapper cannot validate"); `evidence_strength` is preserved on the finding for officer audit; the docket's `overall` is recomputed; `requires_officer_review=true`. The previous "weak SOUND" formulation was internally inconsistent with cross-field rule 2 and was corrected during Provocator review.

**Files:**
- Create: `claude/mcps/principales/src/docket/evidence-quality.ts`
- Create: `claude/mcps/principales/test/evidence-quality.test.ts`

- [ ] **Step 1: Write failing tests**

`test/evidence-quality.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { downgradeWeakSound } from '../src/docket/evidence-quality.js';
import type { Docket } from '../src/docket/schema.js';

const docketWithFinding = (status: 'SOUND' | 'GAP', strength: 'none' | 'weak' | 'strong', evCount: number): Docket => ({
  schema_version: 'principalis_docket.v1',
  run_id: 'r', artifact_id: 'a', artifact_sha: 's', artifact_type: 'spec',
  lane: 'l', bundle_id: 'b', model: 'm', profile: 'principalis_light',
  completion_status: 'complete', overall: status,
  admissible: true, requires_officer_review: false,
  findings: [{
    finding_id: 'f1', claim_id: 'c1', status, claim: '', assessment: '',
    evidence_strength: strength,
    evidence: Array.from({ length: evCount }, (_, i) => ({
      source_type: 'artifact' as const, source_id: `s${i}`, locator: `l${i}`,
      quote_or_fact: 'q', supports: 's',
    })),
    unverified_reason: 'none', escalate: false,
  }],
  evidence_summary: 'x',
  unverified_claims: [], tool_transcript_refs: [],
  runtime: { started_at: 't0', finished_at: 't1', attempt: 1, finish_reason: 'stop',
    prompt_tokens: 0, completion_tokens: 0, cached_tokens: 0 },
});

describe('evidence quality downgrade', () => {
  it('downgrades SOUND with empty evidence: flips status to CONCERN, preserves evidence_strength, recomputes overall, forces review', () => {
    const docket = docketWithFinding('SOUND', 'strong', 0);
    const out = downgradeWeakSound(docket);
    expect(out.findings[0].status).toBe('CONCERN');
    expect(out.findings[0].evidence_strength).toBe('weak');
    expect(out.overall).toBe('CONCERN');
    expect(out.requires_officer_review).toBe(true);
  });

  it('downgrades SOUND with non-strong evidence_strength even when evidence array is non-empty', () => {
    const docket = docketWithFinding('SOUND', 'weak', 1);
    const out = downgradeWeakSound(docket);
    expect(out.findings[0].status).toBe('CONCERN');
    expect(out.findings[0].evidence_strength).toBe('weak');
    expect(out.overall).toBe('CONCERN');
    expect(out.requires_officer_review).toBe(true);
  });

  it('leaves strong-evidenced SOUND alone', () => {
    const docket = docketWithFinding('SOUND', 'strong', 1);
    const out = downgradeWeakSound(docket);
    expect(out.findings[0].status).toBe('SOUND');
    expect(out.findings[0].evidence_strength).toBe('strong');
    expect(out.overall).toBe('SOUND');
    expect(out.requires_officer_review).toBe(false);
  });

  it('leaves non-SOUND findings alone (no flips, no review-flag change)', () => {
    const docket = docketWithFinding('GAP', 'none', 0);
    const out = downgradeWeakSound(docket);
    expect(out.findings[0].status).toBe('GAP');
    expect(out.requires_officer_review).toBe(false);
  });

  it('recomputes overall to the worst remaining status when only some findings are downgraded', () => {
    const docket = docketWithFinding('SOUND', 'weak', 0);
    docket.findings.push({
      finding_id: 'f2', claim_id: 'c2', status: 'GAP', claim: '', assessment: '',
      evidence_strength: 'strong',
      evidence: [{ source_type: 'artifact', source_id: 's', locator: 'l', quote_or_fact: 'q', supports: 's' }],
      unverified_reason: 'none', escalate: false,
    });
    docket.overall = 'GAP'; // Kimi already declared GAP overall
    const out = downgradeWeakSound(docket);
    expect(out.findings[0].status).toBe('CONCERN');
    expect(out.findings[1].status).toBe('GAP');
    expect(out.overall).toBe('GAP'); // GAP > CONCERN
    expect(out.requires_officer_review).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd claude/mcps/principales && npm test -- evidence-quality
```

Expected: FAIL on the new test file (other tests from prior tasks continue to PASS).

- [ ] **Step 3: Implement evidence-quality.ts**

```ts
import type { Docket } from './schema.js';
import { worstStatus } from './cross-field.js';

export function downgradeWeakSound(docket: Docket): Docket {
  let needsReview = false;
  const findings = docket.findings.map((f) => {
    if (f.status !== 'SOUND') return f;
    const strong = f.evidence_strength === 'strong' && f.evidence.length > 0;
    if (strong) return f;
    needsReview = true;
    // Flip status SOUND → CONCERN; preserve evidence_strength so the officer can see
    // why the wrapper distrusted this finding ('weak' or 'none').
    const preservedStrength: 'weak' | 'none' =
      f.evidence_strength === 'none' ? 'none' : 'weak';
    return { ...f, status: 'CONCERN' as const, evidence_strength: preservedStrength };
  });

  if (!needsReview) return docket;

  // Recompute overall to reflect the new worst status among findings.
  const newOverall = worstStatus(findings.map((f) => f.status));

  return {
    ...docket,
    findings,
    overall: newOverall,
    requires_officer_review: true,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd claude/mcps/principales && npm test
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add claude/mcps/principales/src/docket/evidence-quality.ts claude/mcps/principales/test/evidence-quality.test.ts
git commit -m "feat: principales evidence-quality downgrade (SOUND→CONCERN when evidence is weak)"
```

---

## Task 6: Parameter scrubber

> **Confidence: High** — spec Section 1 enumerates the strip list inherited from reference plan Section 5.

**Files:**
- Create: `claude/mcps/principales/src/pipeline/parameter-scrubber.ts`
- Create: `claude/mcps/principales/test/parameter-scrubber.test.ts`

- [ ] **Step 1: Write failing tests**

`test/parameter-scrubber.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { scrubParameters } from '../src/pipeline/parameter-scrubber.js';

describe('parameter scrubber', () => {
  it('strips arbitrary temperature, top_p, n>1', () => {
    const out = scrubParameters({ temperature: 0.7, top_p: 0.9, n: 3, model: 'kimi-k2.5', messages: [] });
    expect(out.temperature).toBeUndefined();
    expect(out.top_p).toBeUndefined();
    expect(out.n).toBeUndefined();
  });

  it('keeps n=1 (default-equivalent)', () => {
    const out = scrubParameters({ n: 1, model: 'kimi-k2.5', messages: [] });
    // n=1 is fine; we just don't pass it through
    expect(out.n).toBeUndefined();
  });

  it('strips deprecated functions and tool_choice="required"', () => {
    const out = scrubParameters({
      functions: [{ name: 'old' }],
      tool_choice: 'required',
      model: 'kimi-k2.5',
      messages: [],
    });
    expect(out.functions).toBeUndefined();
    expect(out.tool_choice).toBeUndefined();
  });

  it('strips nonzero penalties', () => {
    const out = scrubParameters({
      frequency_penalty: 0.5,
      presence_penalty: -0.1,
      model: 'kimi-k2.5',
      messages: [],
    });
    expect(out.frequency_penalty).toBeUndefined();
    expect(out.presence_penalty).toBeUndefined();
  });

  it('renames raw max_tokens to max_completion_tokens', () => {
    const out = scrubParameters({ max_tokens: 1000, model: 'kimi-k2.5', messages: [] });
    expect(out.max_tokens).toBeUndefined();
    expect(out.max_completion_tokens).toBe(1000);
  });

  it('preserves max_completion_tokens if already set', () => {
    const out = scrubParameters({ max_completion_tokens: 2000, model: 'kimi-k2.5', messages: [] });
    expect(out.max_completion_tokens).toBe(2000);
  });

  it('preserves model and messages', () => {
    const out = scrubParameters({ model: 'kimi-k2.6', messages: [{ role: 'user', content: 'hi' }] });
    expect(out.model).toBe('kimi-k2.6');
    expect(out.messages).toEqual([{ role: 'user', content: 'hi' }]);
  });

  it('preserves prompt_cache_key and safety_identifier (spec Section 1 invariant)', () => {
    const out = scrubParameters({
      model: 'kimi-k2.5',
      messages: [],
      prompt_cache_key: 'sha-1:upstream-coverage:sess-A',
      safety_identifier: 'hash-xyz',
    });
    expect(out.prompt_cache_key).toBe('sha-1:upstream-coverage:sess-A');
    expect(out.safety_identifier).toBe('hash-xyz');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd claude/mcps/principales && npm test
```

Expected: FAIL.

- [ ] **Step 3: Implement parameter-scrubber.ts**

```ts
export interface ScrubbableRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  top_p?: number;
  n?: number;
  functions?: unknown;
  tool_choice?: unknown;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  stream?: boolean;
  response_format?: unknown;
  // Spec Section 1 stable cache + identity fields. The scrubber preserves them so the
  // wrapper's iteration-1 cache-key work survives the strip pass.
  prompt_cache_key?: string;
  safety_identifier?: string;
  [k: string]: unknown;
}

export interface ScrubbedRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  max_completion_tokens?: number;
  stream?: boolean;
  response_format?: unknown;
  prompt_cache_key?: string;
  safety_identifier?: string;
}

const STRIP_KEYS = new Set([
  'temperature',
  'top_p',
  'n',
  'functions',
  'tool_choice',
  'frequency_penalty',
  'presence_penalty',
]);

export function scrubParameters(req: ScrubbableRequest): ScrubbedRequest {
  const out: ScrubbedRequest = {
    model: req.model,
    messages: req.messages,
  };

  if (req.max_completion_tokens !== undefined) {
    out.max_completion_tokens = req.max_completion_tokens;
  } else if (req.max_tokens !== undefined) {
    out.max_completion_tokens = req.max_tokens;
  }

  if (req.stream !== undefined) out.stream = req.stream;
  if (req.response_format !== undefined) out.response_format = req.response_format;

  // Preserve the cache + identity fields. Without this, Iteration-1's prompt_cache_key and
  // safety_identifier work would be silently neutralized at this layer.
  if (req.prompt_cache_key !== undefined) out.prompt_cache_key = req.prompt_cache_key;
  if (req.safety_identifier !== undefined) out.safety_identifier = req.safety_identifier;

  // Anything in STRIP_KEYS is dropped by omission. Other unknown keys also drop.
  return out;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd claude/mcps/principales && npm test
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add claude/mcps/principales/src/pipeline/parameter-scrubber.ts claude/mcps/principales/test/parameter-scrubber.test.ts
git commit -m "feat: principales parameter scrubber"
```

---

## Task 7: Retry/fallback mapper

> **Confidence: High** — spec Section 1 enumerates the failure-class mapping (transport timeout / 429 / 5xx → bounded retry then synthetic GAP; schema_error → reject; truncation → retry-then-GAP).

**Files:**
- Create: `claude/mcps/principales/src/pipeline/retry-mapper.ts`
- Create: `claude/mcps/principales/test/retry-mapper.test.ts`

- [ ] **Step 1: Write failing tests**

`test/retry-mapper.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { mapFailureToDocket, type FailureClass } from '../src/pipeline/retry-mapper.js';

const baseRequest = {
  run_id: 'r', artifact_id: 'a', artifact_sha: 's', artifact_type: 'spec' as const,
  lane: 'upstream-coverage', bundle_id: 'b', model: 'kimi-k2.5',
  profile: 'principalis_light' as const, attempt: 1,
  started_at: '2026-04-26T00:00:00Z', finished_at: '2026-04-26T00:00:01Z',
};

describe('retry/fallback mapper', () => {
  it('maps transport_failure to GAP docket with unverified_reason', () => {
    const docket = mapFailureToDocket('transport_failure', baseRequest);
    expect(docket.overall).toBe('GAP');
    expect(docket.completion_status).toBe('transport_error');
    expect(docket.findings[0].unverified_reason).toBe('transport_failure');
    expect(docket.requires_officer_review).toBe(true);
  });

  it('maps schema_error to docket with completion_status=schema_error', () => {
    const docket = mapFailureToDocket('schema_error', baseRequest);
    expect(docket.completion_status).toBe('schema_error');
    expect(docket.findings[0].unverified_reason).toBe('schema_failure');
  });

  it('maps truncation to GAP', () => {
    const docket = mapFailureToDocket('truncation', baseRequest);
    expect(docket.overall).toBe('GAP');
    expect(docket.completion_status).toBe('truncated');
    expect(docket.findings[0].unverified_reason).toBe('truncation');
  });

  it('maps refused to GAP with reason missing_context', () => {
    const docket = mapFailureToDocket('refused', baseRequest);
    expect(docket.completion_status).toBe('refused');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd claude/mcps/principales && npm test
```

Expected: FAIL.

- [ ] **Step 3: Implement retry-mapper.ts**

```ts
import type { Docket, ArtifactType, Profile } from '../docket/schema.js';

export type FailureClass = 'transport_failure' | 'schema_error' | 'truncation' | 'refused';

export interface FailureContext {
  run_id: string;
  artifact_id: string;
  artifact_sha: string;
  artifact_type: 'spec' | 'plan' | 'diagnosis' | 'task' | 'campaign';
  lane: string;
  bundle_id: string;
  model: string;
  profile: 'principalis_light' | 'principalis_grounded' | 'principalis_adversarial' | 'principalis_batch';
  attempt: number;
  started_at: string;
  finished_at: string;
}

const COMPLETION_BY_CLASS: Record<FailureClass, Docket['completion_status']> = {
  transport_failure: 'transport_error',
  schema_error: 'schema_error',
  truncation: 'truncated',
  refused: 'refused',
};

const REASON_BY_CLASS: Record<FailureClass, Docket['findings'][number]['unverified_reason']> = {
  transport_failure: 'transport_failure',
  schema_error: 'schema_failure',
  truncation: 'truncation',
  refused: 'missing_context',
};

export function mapFailureToDocket(failure: FailureClass, ctx: FailureContext): Docket {
  return {
    schema_version: 'principalis_docket.v1',
    run_id: ctx.run_id,
    artifact_id: ctx.artifact_id,
    artifact_sha: ctx.artifact_sha,
    artifact_type: ctx.artifact_type,
    lane: ctx.lane,
    bundle_id: ctx.bundle_id,
    model: ctx.model,
    profile: ctx.profile,
    completion_status: COMPLETION_BY_CLASS[failure],
    overall: 'GAP',
    admissible: false,
    requires_officer_review: true,
    findings: [
      {
        finding_id: `${ctx.run_id}-failure`,
        claim_id: `${ctx.run_id}:lane-${ctx.lane}`,
        status: 'GAP',
        claim: `Lane ${ctx.lane} could not be verified due to ${failure}`,
        assessment: `Wrapper-synthesized GAP: the underlying Moonshot call failed with class=${failure}; classic verification required for this lane.`,
        evidence_strength: 'none',
        evidence: [],
        unverified_reason: REASON_BY_CLASS[failure],
        escalate: false,
      },
    ],
    evidence_summary: undefined,
    unverified_claims: [],
    tool_transcript_refs: [],
    runtime: {
      started_at: ctx.started_at,
      finished_at: ctx.finished_at,
      attempt: ctx.attempt,
      finish_reason: failure === 'truncation' ? 'length' : 'error',
      prompt_tokens: 0,
      completion_tokens: 0,
      cached_tokens: 0,
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd claude/mcps/principales && npm test
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add claude/mcps/principales/src/pipeline/retry-mapper.ts claude/mcps/principales/test/retry-mapper.test.ts
git commit -m "feat: principales retry/fallback mapper for failure classes"
```

---

## Task 8: Moonshot client

> **Confidence: High** — Moonshot exposes an OpenAI-compatible Chat Completions API. The `openai` SDK accepts a `baseURL` override; auth via Bearer token.

**Files:**
- Create: `claude/mcps/principales/src/moonshot/client.ts`
- Create: `claude/mcps/principales/src/moonshot/types.ts`
- Create: `claude/mcps/principales/test/moonshot-client.test.ts`

- [ ] **Step 1: Write failing tests using a mock OpenAI client**

`test/moonshot-client.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { MoonshotClient, type MoonshotClientDeps } from '../src/moonshot/client.js';

function makeMockChatCompletions(responses: Array<{ ok: true; content: string } | { ok: false; error: Error }>) {
  let i = 0;
  const create = vi.fn(async () => {
    const r = responses[i++];
    if (!r) throw new Error('mock exhausted');
    if (!r.ok) throw r.error;
    return {
      choices: [{ message: { content: r.content }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    };
  });
  return { create };
}

const baseRequest = {
  model: 'kimi-k2.5',
  messages: [{ role: 'user', content: 'test' }],
  max_completion_tokens: 100,
};

describe('Moonshot client', () => {
  it('returns content on first-try success', async () => {
    const mock = makeMockChatCompletions([{ ok: true, content: '{"ok": true}' }]);
    const deps: MoonshotClientDeps = {
      chatCompletionsCreate: mock.create,
      sleep: () => Promise.resolve(),
    };
    const client = new MoonshotClient(deps);
    const result = await client.complete(baseRequest);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.content).toBe('{"ok": true}');
      expect(result.attempts).toBe(1);
    }
  });

  it('retries once on 429 then succeeds', async () => {
    const err: Error & { status?: number } = new Error('rate limited');
    err.status = 429;
    const mock = makeMockChatCompletions([
      { ok: false, error: err },
      { ok: true, content: 'second-try' },
    ]);
    const deps: MoonshotClientDeps = {
      chatCompletionsCreate: mock.create,
      sleep: () => Promise.resolve(),
    };
    const client = new MoonshotClient(deps);
    const result = await client.complete(baseRequest);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.attempts).toBe(2);
  });

  it('returns transport_failure after retry exhaustion on persistent 5xx', async () => {
    const err: Error & { status?: number } = new Error('upstream down');
    err.status = 503;
    const mock = makeMockChatCompletions([
      { ok: false, error: err },
      { ok: false, error: err },
    ]);
    const deps: MoonshotClientDeps = {
      chatCompletionsCreate: mock.create,
      sleep: () => Promise.resolve(),
    };
    const client = new MoonshotClient(deps);
    const result = await client.complete(baseRequest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure_class).toBe('transport_failure');
    }
  });

  it('returns transport_failure on non-retryable error after one attempt', async () => {
    const err = new Error('weird');
    const mock = makeMockChatCompletions([{ ok: false, error: err }]);
    const deps: MoonshotClientDeps = {
      chatCompletionsCreate: mock.create,
      sleep: () => Promise.resolve(),
    };
    const client = new MoonshotClient(deps);
    const result = await client.complete(baseRequest);
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd claude/mcps/principales && npm test
```

Expected: FAIL.

- [ ] **Step 3: Implement moonshot/types.ts**

```ts
import type { FailureClass } from '../pipeline/retry-mapper.js';

export interface MoonshotRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  max_completion_tokens?: number;
  stream?: boolean;
  response_format?: unknown;
  // OpenAI prompt-caching + identity discipline. Spec Section 1.
  // Forwarded to Moonshot's OpenAI-compatible endpoint; if unsupported it is silently ignored,
  // so the spec invariant of "stable cache keys" is honored regardless of upstream support.
  prompt_cache_key?: string;
  safety_identifier?: string;
}

export interface MoonshotSuccess {
  ok: true;
  content: string;
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'error';
  prompt_tokens: number;
  completion_tokens: number;
  cached_tokens?: number;
  attempts: number;
}

export interface MoonshotFailure {
  ok: false;
  failure_class: FailureClass;
  message: string;
  attempts: number;
}

export type MoonshotResult = MoonshotSuccess | MoonshotFailure;
export type { FailureClass };
```

`FailureClass` is the canonical type, defined in `retry-mapper.ts` (Task 7); this module re-exports it so callers can import `MoonshotResult` and `FailureClass` from one place. No duplication.

- [ ] **Step 4: Implement moonshot/client.ts**

```ts
import OpenAI from 'openai';
import type { MoonshotRequest, MoonshotResult } from './types.js';
import { scrubParameters, type ScrubbableRequest } from '../pipeline/parameter-scrubber.js';

// Aggregated, non-streaming-shape response that the deps function returns.
// fromEnv's implementation streams under the hood (spec Section 1 invariant) and aggregates.
// Mocks in tests return this shape directly without involving stream mechanics.
export interface AggregatedChatResponse {
  choices: Array<{ message: { content: string | null }; finish_reason: string }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    // Newer OpenAI SDK shape (4.70+): cached_tokens lives under prompt_tokens_details.
    prompt_tokens_details?: { cached_tokens?: number };
  };
}

export interface MoonshotClientDeps {
  chatCompletionsCreate: (req: MoonshotRequest) => Promise<AggregatedChatResponse>;
  sleep: (ms: number) => Promise<void>;
}

const FROM_VAULT_LITERALS = new Set(['<from-vault>', '<FROM_VAULT>', 'from-vault', '']);

function isPlaceholderKey(key: string): boolean {
  return FROM_VAULT_LITERALS.has(key.trim());
}

export class MoonshotClient {
  constructor(private readonly deps: MoonshotClientDeps) {}

  static fromEnv(env: NodeJS.ProcessEnv = process.env): MoonshotClient {
    const apiKey = env.MOONSHOT_API_KEY;
    if (!apiKey) throw new Error('MOONSHOT_API_KEY is not set');
    if (isPlaceholderKey(apiKey)) {
      // Refuse to start with the literal placeholder. Without this, the MCP would spawn,
      // every Moonshot call would 401, and every lane would synthesize transport_failure —
      // the Imperator would diagnose "Moonshot is broken" instead of "key is not in place."
      throw new Error(
        `MOONSHOT_API_KEY is set to a placeholder ("${apiKey}"). Replace with the real key from your vault and restart Claude Code.`,
      );
    }
    const baseURL = env.MOONSHOT_BASE_URL ?? 'https://api.moonshot.ai/v1';
    const sdk = new OpenAI({ apiKey, baseURL });
    return new MoonshotClient({
      chatCompletionsCreate: async (req): Promise<AggregatedChatResponse> => {
        // Spec invariant (Section 1): use streaming Chat Completions. Aggregate chunks
        // into a single AggregatedChatResponse so downstream logic (and test mocks)
        // see the same shape regardless of transport.
        const stream = await sdk.chat.completions.create(
          { ...(req as never), stream: true, stream_options: { include_usage: true } } as never,
        ) as AsyncIterable<{
          choices: Array<{ delta?: { content?: string }; finish_reason?: string | null }>;
          usage?: AggregatedChatResponse['usage'];
        }>;
        let content = '';
        let finish_reason = 'stop';
        let usage: AggregatedChatResponse['usage'] = undefined;
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) content += delta;
          const fr = chunk.choices[0]?.finish_reason;
          if (fr) finish_reason = fr;
          if (chunk.usage) usage = chunk.usage;
        }
        return {
          choices: [{ message: { content }, finish_reason }],
          usage,
        };
      },
      sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    });
  }

  async complete(req: ScrubbableRequest, maxRetries = 1): Promise<MoonshotResult> {
    // Defense-in-depth: strip any unsupported OpenAI params before hitting Moonshot.
    // In v1, callers (verify_lane → buildRequest) produce already-clean requests, so this
    // is a no-op; it activates if future callers pass arbitrary params.
    const scrubbed = scrubParameters(req);
    let attempt = 0;
    let lastError: unknown;
    while (attempt <= maxRetries) {
      attempt += 1;
      try {
        const res = await this.deps.chatCompletionsCreate(scrubbed);
        const choice = res.choices[0];
        if (!choice) {
          return { ok: false, failure_class: 'refused', message: 'no choices returned', attempts: attempt };
        }
        const content = choice.message.content ?? '';
        if (choice.finish_reason === 'length') {
          return { ok: false, failure_class: 'truncation', message: 'finish_reason=length', attempts: attempt };
        }
        // Defense-in-depth: an empty content body cannot be a valid docket. Surface a
        // refused failure class with a clear message so the diagnostic isn't a downstream
        // JSON.parse-of-empty-string masquerading as schema_error.
        if (content.trim() === '') {
          return { ok: false, failure_class: 'refused', message: 'empty content body', attempts: attempt };
        }
        return {
          ok: true,
          content,
          finish_reason: (choice.finish_reason as 'stop' | 'length' | 'tool_calls' | 'error') ?? 'stop',
          prompt_tokens: res.usage?.prompt_tokens ?? 0,
          completion_tokens: res.usage?.completion_tokens ?? 0,
          // OpenAI SDK 4.70+ exposes cached_tokens under prompt_tokens_details, not usage.cached_tokens.
          cached_tokens: res.usage?.prompt_tokens_details?.cached_tokens ?? 0,
          attempts: attempt,
        };
      } catch (err) {
        lastError = err;
        const status = (err as { status?: number }).status;
        const retryable = status === 429 || (typeof status === 'number' && status >= 500);
        if (!retryable || attempt > maxRetries) break;
        await this.deps.sleep(Math.min(2000 * 2 ** (attempt - 1), 8000));
      }
    }
    const status = (lastError as { status?: number }).status;
    const message = (lastError as Error).message ?? String(lastError);
    return {
      ok: false,
      failure_class: 'transport_failure',
      message: status ? `${status}: ${message}` : message,
      attempts: attempt,
    };
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd claude/mcps/principales && npm test
```

Expected: All Moonshot client tests PASS.

- [ ] **Step 6: Commit**

```bash
git add claude/mcps/principales/src/moonshot/ claude/mcps/principales/test/moonshot-client.test.ts
git commit -m "feat: principales Moonshot OpenAI-compatible client with retry"
```

---

## Task 9: Request builder

> **Confidence: High** — spec Section 1 enumerates the assembled request: lane prompt template + artifact slice + evidence bundle + claim list + schema reference + escalation rules. Stable cache keys.

**Files:**
- Create: `claude/mcps/principales/src/pipeline/request-builder.ts`
- Create: `claude/mcps/principales/test/request-builder.test.ts`

- [ ] **Step 1: Write failing tests**

`test/request-builder.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildRequest, type BuildRequestArgs } from '../src/pipeline/request-builder.js';

const args = (over: Partial<BuildRequestArgs> = {}): BuildRequestArgs => ({
  lane: 'upstream-coverage',
  laneTemplate: '# Lane: {{lane}}\n\nArtifact:\n{{artifact}}\n\nEvidence:\n{{evidence}}\n\nClaims:\n{{claims}}',
  artifactSlice: '## Test Artifact',
  evidenceBundle: { sources: [{ source_id: 's1', source_type: 'doctrine', content: 'doctrine text' }] },
  claims: [{ claim_id: 'c1', claim: 'spec aligns with doctrine' }],
  model: 'kimi-k2.5',
  maxCompletionTokens: 1500,
  artifactSha: 'sha-abc',
  sessionFamily: 'sess-1',
  safetyIdentifier: 'hash-xyz',
  ...over,
});

describe('request builder', () => {
  it('substitutes lane, artifact, evidence, claims into the template', () => {
    const req = buildRequest(args());
    expect(req.messages[0].content).toContain('# Lane: upstream-coverage');
    expect(req.messages[0].content).toContain('## Test Artifact');
    expect(req.messages[0].content).toContain('doctrine text');
    expect(req.messages[0].content).toContain('c1');
    expect(req.messages[0].content).toContain('spec aligns with doctrine');
  });

  it('sets model and max_completion_tokens', () => {
    const req = buildRequest(args({ model: 'kimi-k2.6', maxCompletionTokens: 4000 }));
    expect(req.model).toBe('kimi-k2.6');
    expect(req.max_completion_tokens).toBe(4000);
  });

  it('sets stream:true (spec invariant: streaming Chat Completions only)', () => {
    const req = buildRequest(args());
    expect(req.stream).toBe(true);
  });

  it('emits stable prompt_cache_key as artifact_sha:lane:session_family', () => {
    const req = buildRequest(args({ artifactSha: 'sha-1', lane: 'task-ordering', sessionFamily: 'sess-A' }));
    expect(req.prompt_cache_key).toBe('sha-1:task-ordering:sess-A');
  });

  it('forwards the precomputed safety_identifier without including any raw secret', () => {
    const req = buildRequest(args({ safetyIdentifier: 'hashed-user-1' }));
    expect(req.safety_identifier).toBe('hashed-user-1');
  });

  it('rejects when lane template contains no slots', () => {
    expect(() => buildRequest(args({ laneTemplate: 'no slots here' }))).toThrow();
  });

  it('rejects when artifact_slice or evidence_bundle is missing', () => {
    expect(() => buildRequest(args({ artifactSlice: '' }))).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd claude/mcps/principales && npm test
```

Expected: FAIL.

- [ ] **Step 3: Implement request-builder.ts**

```ts
import type { EvidenceBundle } from '../docket/locator.js';
import type { MoonshotRequest } from '../moonshot/types.js';

export interface BuildRequestArgs {
  lane: string;
  laneTemplate: string;
  artifactSlice: string;
  evidenceBundle: EvidenceBundle;
  claims: Array<{ claim_id: string; claim: string }>;
  model: string;
  maxCompletionTokens: number;
  // Spec Section 1 stable cache keys.
  // prompt_cache_key = artifact_sha:lane:session_family (composed here from these fields).
  artifactSha: string;
  sessionFamily: string;
  // Precomputed hashed user identifier. Caller is responsible for hashing —
  // the request builder never touches raw user secrets.
  safetyIdentifier: string;
}

const REQUIRED_SLOTS = ['{{lane}}', '{{artifact}}', '{{evidence}}', '{{claims}}'];

function renderEvidence(bundle: EvidenceBundle): string {
  return bundle.sources
    .map((s) => `### ${s.source_id} (${s.source_type})\n${s.content}`)
    .join('\n\n');
}

function renderClaims(claims: BuildRequestArgs['claims']): string {
  return claims.map((c) => `- ${c.claim_id}: ${c.claim}`).join('\n');
}

export function buildRequest(args: BuildRequestArgs): MoonshotRequest {
  if (!args.artifactSlice || args.artifactSlice.trim() === '') {
    throw new Error('artifactSlice is required and non-empty');
  }
  if (!args.evidenceBundle || args.evidenceBundle.sources.length === 0) {
    throw new Error('evidenceBundle is required with at least one source');
  }
  for (const slot of REQUIRED_SLOTS) {
    if (!args.laneTemplate.includes(slot)) {
      throw new Error(`laneTemplate is missing required slot ${slot}`);
    }
  }

  const filled = args.laneTemplate
    .replaceAll('{{lane}}', args.lane)
    .replaceAll('{{artifact}}', args.artifactSlice)
    .replaceAll('{{evidence}}', renderEvidence(args.evidenceBundle))
    .replaceAll('{{claims}}', renderClaims(args.claims));

  return {
    model: args.model,
    messages: [
      { role: 'system', content: 'You are a Consilium Principalis. Sterile evidence clerk. Return only the required JSON object.' },
      { role: 'user', content: filled },
    ],
    max_completion_tokens: args.maxCompletionTokens,
    response_format: { type: 'json_object' },
    stream: true, // Spec Section 1: streaming Chat Completions only.
    prompt_cache_key: `${args.artifactSha}:${args.lane}:${args.sessionFamily}`,
    safety_identifier: args.safetyIdentifier,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd claude/mcps/principales && npm test
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add claude/mcps/principales/src/pipeline/request-builder.ts claude/mcps/principales/test/request-builder.test.ts
git commit -m "feat: principales request builder with template slot validation"
```

---

## Task 10: Runtime utilities (concurrency + budget + telemetry)

> **Confidence: High** — spec Section 1 enumerates each utility. Budget is per-session in-memory (named `SESSION` not `DAILY`). Telemetry redacts API key.

**Files:**
- Create: `claude/mcps/principales/src/runtime/concurrency.ts`
- Create: `claude/mcps/principales/src/runtime/budget.ts`
- Create: `claude/mcps/principales/src/runtime/telemetry.ts`
- Create: `claude/mcps/principales/test/runtime.test.ts`

- [ ] **Step 1: Write failing tests**

`test/runtime.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { Semaphore } from '../src/runtime/concurrency.js';
import { SessionBudget } from '../src/runtime/budget.js';
import { logTelemetry, redactSecrets } from '../src/runtime/telemetry.js';

describe('Semaphore', () => {
  it('allows up to N parallel acquisitions', async () => {
    const s = new Semaphore(2);
    const order: string[] = [];
    const t = async (label: string, ms: number) => {
      const release = await s.acquire();
      order.push(`start-${label}`);
      await new Promise((r) => setTimeout(r, ms));
      order.push(`end-${label}`);
      release();
    };
    await Promise.all([t('a', 20), t('b', 20), t('c', 5)]);
    // a and b start first; c waits for one of them
    expect(order.slice(0, 2)).toEqual(['start-a', 'start-b']);
  });
});

describe('SessionBudget', () => {
  it('tracks spend and reports remaining', () => {
    const b = new SessionBudget(5.0);
    b.charge(1.0);
    b.charge(0.5);
    expect(b.remaining()).toBeCloseTo(3.5);
  });

  it('opens breaker when spend exceeds budget', () => {
    const b = new SessionBudget(2.0);
    b.charge(1.0);
    expect(b.breakerOpen()).toBe(false);
    b.charge(1.5);
    expect(b.breakerOpen()).toBe(true);
  });
});

describe('telemetry', () => {
  it('redacts MOONSHOT_API_KEY values from text', () => {
    const out = redactSecrets('key=sk-abc123 and bearer sk-xyz', { MOONSHOT_API_KEY: 'sk-abc123' });
    expect(out).not.toContain('sk-abc123');
    expect(out).toContain('[REDACTED]');
  });

  it('logTelemetry writes a JSON line to stderr without secrets', () => {
    const writes: string[] = [];
    const stderr = { write: (s: string) => { writes.push(s); return true; } };
    logTelemetry(
      { run_id: 'r1', lane: 'upstream-coverage', model: 'kimi-k2.5', attempt: 1, prompt_tokens: 10, completion_tokens: 5, cached_tokens: 0, finish_reason: 'stop', latency_ms: 100, schema_status: 'ok', evidence_status: 'ok', retry_count: 0, breaker_status: 'closed' },
      { stderr, env: { MOONSHOT_API_KEY: 'sk-secret' } } as never,
    );
    expect(writes.length).toBe(1);
    expect(writes[0]).toContain('"run_id":"r1"');
    expect(writes[0]).not.toContain('sk-secret');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd claude/mcps/principales && npm test
```

Expected: FAIL.

- [ ] **Step 3: Implement concurrency.ts**

```ts
export class Semaphore {
  private active = 0;
  private waiters: Array<() => void> = [];
  constructor(private readonly limit: number) {}

  async acquire(): Promise<() => void> {
    if (this.active < this.limit) {
      this.active += 1;
      return () => this.release();
    }
    return new Promise((resolve) => {
      this.waiters.push(() => {
        this.active += 1;
        resolve(() => this.release());
      });
    });
  }

  private release(): void {
    this.active -= 1;
    const next = this.waiters.shift();
    if (next) next();
  }
}
```

- [ ] **Step 4: Implement budget.ts**

```ts
export class SessionBudget {
  private spent = 0;
  constructor(private readonly limitUsd: number) {}

  charge(usd: number): void {
    this.spent += usd;
  }

  spent_usd(): number {
    return this.spent;
  }

  remaining(): number {
    return Math.max(0, this.limitUsd - this.spent);
  }

  breakerOpen(): boolean {
    return this.spent > this.limitUsd;
  }
}
```

- [ ] **Step 5: Implement telemetry.ts**

```ts
export interface TelemetryEvent {
  run_id: string;
  lane: string;
  model: string;
  attempt: number;
  prompt_tokens: number;
  completion_tokens: number;
  cached_tokens: number;
  finish_reason: string;
  latency_ms: number;
  schema_status: 'ok' | 'failed';
  evidence_status: 'ok' | 'failed';
  retry_count: number;
  breaker_status: 'open' | 'closed';
}

export interface TelemetryDeps {
  stderr: { write: (s: string) => boolean };
  env: NodeJS.ProcessEnv;
}

const SECRET_ENV_KEYS = ['MOONSHOT_API_KEY'];

export function redactSecrets(text: string, env: Partial<NodeJS.ProcessEnv>): string {
  let out = text;
  for (const key of SECRET_ENV_KEYS) {
    const v = env[key];
    if (typeof v === 'string' && v.length > 0) {
      out = out.split(v).join('[REDACTED]');
    }
  }
  return out;
}

export function logTelemetry(event: TelemetryEvent, deps: TelemetryDeps): void {
  const line = JSON.stringify(event);
  const safe = redactSecrets(line, deps.env);
  deps.stderr.write(safe + '\n');
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd claude/mcps/principales && npm test
```

Expected: All PASS.

- [ ] **Step 7: Commit**

```bash
git add claude/mcps/principales/src/runtime/ claude/mcps/principales/test/runtime.test.ts
git commit -m "feat: principales runtime utilities (semaphore, budget, telemetry)"
```

---

## Task 11: `verify_lane` tool — wires everything

> **Confidence: High** — composes Tasks 2-10 into the primary tool. Returns either a real validated docket or a synthetic-failure docket via the retry mapper.

**Files:**
- Create: `claude/mcps/principales/src/tools/verify-lane.ts`
- Create: `claude/mcps/principales/test/verify-lane.test.ts`

- [ ] **Step 1: Write failing tests**

`test/verify-lane.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createVerifyLane, type VerifyLaneDeps } from '../src/tools/verify-lane.js';
import type { MoonshotResult } from '../src/moonshot/types.js';

const baseInput = {
  run_id: 'r1',
  artifact_id: 'a1',
  artifact_sha: 'sha-1',
  artifact_type: 'spec' as const,
  lane: 'upstream-coverage',
  bundle_id: 'b1',
  profile: 'principalis_light' as const,
  model: 'kimi-k2.5',
  artifact_slice: '## Test',
  evidence_bundle: { sources: [{ source_id: 'doctrine.md', source_type: 'doctrine' as const, content: 'rule' }] },
  claims: [{ claim_id: 'c1', claim: 'spec aligns with doctrine' }],
  max_completion_tokens: 1500,
  timeout_ms: 30000,
};

const validKimiResponse = JSON.stringify({
  schema_version: 'principalis_docket.v1',
  run_id: 'r1', artifact_id: 'a1', artifact_sha: 'sha-1', artifact_type: 'spec',
  lane: 'upstream-coverage', bundle_id: 'b1', model: 'kimi-k2.5', profile: 'principalis_light',
  completion_status: 'complete', overall: 'SOUND',
  admissible: true, requires_officer_review: false,
  findings: [],
  evidence_summary: 'spec aligns; no findings',
  unverified_claims: [], tool_transcript_refs: [],
  runtime: { started_at: 't0', finished_at: 't1', attempt: 1, finish_reason: 'stop', prompt_tokens: 50, completion_tokens: 20, cached_tokens: 0 },
});

function makeDeps(result: MoonshotResult, laneTemplate?: string, allowedLanes?: Set<string>): VerifyLaneDeps {
  return {
    moonshot: { complete: async () => result },
    loadLaneTemplate: async () => laneTemplate ?? '# {{lane}}\n{{artifact}}\n{{evidence}}\n{{claims}}',
    semaphore: { acquire: async () => () => {} },
    budget: {
      charge: () => {},
      breakerOpen: () => false,
      remaining: () => 5,
      spent_usd: () => 0,
    },
    telemetry: () => {},
    now: () => '2026-04-26T00:00:00Z',
    allowedLanes: allowedLanes ?? new Set(['upstream-coverage', 'task-ordering']),
    sessionFamily: 'sess-test',
    safetyIdentifier: 'hash-test',
  };
}

describe('verify_lane tool', () => {
  it('returns a validated SOUND docket for a well-formed Kimi response', async () => {
    const deps = makeDeps({ ok: true, content: validKimiResponse, finish_reason: 'stop', prompt_tokens: 50, completion_tokens: 20, cached_tokens: 0, attempts: 1 });
    const tool = createVerifyLane(deps);
    const docket = await tool(baseInput);
    expect(docket.completion_status).toBe('complete');
    expect(docket.overall).toBe('SOUND');
  });

  it('returns synthetic GAP on transport_failure', async () => {
    const deps = makeDeps({ ok: false, failure_class: 'transport_failure', message: 'down', attempts: 2 });
    const tool = createVerifyLane(deps);
    const docket = await tool(baseInput);
    expect(docket.completion_status).toBe('transport_error');
    expect(docket.overall).toBe('GAP');
    expect(docket.findings[0].unverified_reason).toBe('transport_failure');
  });

  it('rejects an invalid-verdict response with completion_status=schema_error', async () => {
    const bad = JSON.stringify({ ...JSON.parse(validKimiResponse), overall: 'FINE' });
    const deps = makeDeps({ ok: true, content: bad, finish_reason: 'stop', prompt_tokens: 1, completion_tokens: 1, cached_tokens: 0, attempts: 1 });
    const tool = createVerifyLane(deps);
    const docket = await tool(baseInput);
    expect(docket.completion_status).toBe('schema_error');
  });

  it('downgrades a SOUND-without-evidence response: status flips to CONCERN, overall recomputes, review forced', async () => {
    const weak = JSON.parse(validKimiResponse);
    weak.findings = [{
      finding_id: 'f1', claim_id: 'c1', status: 'SOUND', claim: 'x', assessment: 'y',
      evidence_strength: 'weak', evidence: [],
      unverified_reason: 'none', escalate: false,
    }];
    weak.overall = 'SOUND';
    weak.evidence_summary = undefined;
    const deps = makeDeps({ ok: true, content: JSON.stringify(weak), finish_reason: 'stop', prompt_tokens: 1, completion_tokens: 1, cached_tokens: 0, attempts: 1 });
    const tool = createVerifyLane(deps);
    const docket = await tool(baseInput);
    expect(docket.requires_officer_review).toBe(true);
    expect(docket.findings[0].status).toBe('CONCERN');
    expect(docket.findings[0].evidence_strength).toBe('weak');
    expect(docket.overall).toBe('CONCERN');
  });

  it('opens breaker and returns synthetic refused docket when budget is exhausted', async () => {
    const deps = makeDeps({ ok: true, content: validKimiResponse, finish_reason: 'stop', prompt_tokens: 1, completion_tokens: 1, cached_tokens: 0, attempts: 1 });
    deps.budget = { ...deps.budget, breakerOpen: () => true };
    const tool = createVerifyLane(deps);
    const docket = await tool(baseInput);
    expect(docket.completion_status).toBe('refused');
  });

  it('rejects unknown lane (not in allowlist) with synthetic GAP, never invokes Moonshot', async () => {
    let moonshotCalled = false;
    const deps = makeDeps({ ok: true, content: validKimiResponse, finish_reason: 'stop', prompt_tokens: 1, completion_tokens: 1, cached_tokens: 0, attempts: 1 });
    deps.moonshot = { complete: async () => { moonshotCalled = true; return { ok: true, content: validKimiResponse, finish_reason: 'stop', prompt_tokens: 0, completion_tokens: 0, cached_tokens: 0, attempts: 1 }; } };
    deps.allowedLanes = new Set(['task-ordering']); // upstream-coverage NOT allowed
    const tool = createVerifyLane(deps);
    const docket = await tool(baseInput);
    expect(moonshotCalled).toBe(false);
    expect(docket.overall).toBe('GAP');
    expect(docket.findings[0].unverified_reason).toBe('missing_context');
  });

  it('rejects docket whose Kimi-returned identifying fields drift from request', async () => {
    const drifted = JSON.parse(validKimiResponse);
    drifted.run_id = 'r2-evil'; // does not match baseInput.run_id
    const deps = makeDeps({ ok: true, content: JSON.stringify(drifted), finish_reason: 'stop', prompt_tokens: 1, completion_tokens: 1, cached_tokens: 0, attempts: 1 });
    const tool = createVerifyLane(deps);
    const docket = await tool(baseInput);
    expect(docket.completion_status).toBe('schema_error');
  });

  it('rejects docket that omits a requested claim from both findings and unverified_claims (rule 10)', async () => {
    const missingClaim = JSON.parse(validKimiResponse);
    // baseInput has claims: [{ claim_id: 'c1', ... }]; the response below omits c1.
    missingClaim.findings = [];
    missingClaim.unverified_claims = [];
    missingClaim.evidence_summary = 'x';
    missingClaim.overall = 'SOUND';
    const deps = makeDeps({ ok: true, content: JSON.stringify(missingClaim), finish_reason: 'stop', prompt_tokens: 1, completion_tokens: 1, cached_tokens: 0, attempts: 1 });
    const tool = createVerifyLane(deps);
    const docket = await tool(baseInput);
    expect(docket.completion_status).toBe('schema_error');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd claude/mcps/principales && npm test
```

Expected: FAIL.

- [ ] **Step 3: Implement verify-lane.ts**

```ts
import type { Docket } from '../docket/schema.js';
import { DocketSchema } from '../docket/schema.js';
import { applyCrossFieldRules } from '../docket/cross-field.js';
import { resolveLocators, type EvidenceBundle } from '../docket/locator.js';
import { downgradeWeakSound } from '../docket/evidence-quality.js';
import { buildRequest } from '../pipeline/request-builder.js';
import { mapFailureToDocket, type FailureContext } from '../pipeline/retry-mapper.js';
import type { MoonshotResult } from '../moonshot/types.js';

export interface VerifyLaneInput {
  run_id: string;
  artifact_id: string;
  artifact_sha: string;
  artifact_type: 'spec' | 'plan' | 'diagnosis' | 'task' | 'campaign';
  lane: string;
  bundle_id: string;
  profile: 'principalis_light' | 'principalis_grounded' | 'principalis_adversarial' | 'principalis_batch';
  model: string;
  artifact_slice: string;
  evidence_bundle: EvidenceBundle;
  claims: Array<{ claim_id: string; claim: string }>;
  max_completion_tokens: number;
  timeout_ms: number;
}

export interface VerifyLaneDeps {
  moonshot: { complete: (req: ReturnType<typeof buildRequest>) => Promise<MoonshotResult> };
  loadLaneTemplate: (lane: string) => Promise<string>;
  semaphore: { acquire: () => Promise<() => void> };
  budget: {
    charge: (usd: number) => void;
    breakerOpen: () => boolean;
    remaining: () => number;
    spent_usd: () => number;
  };
  telemetry: (event: {
    run_id: string; lane: string; model: string; attempt: number;
    prompt_tokens: number; completion_tokens: number; cached_tokens: number;
    finish_reason: string; latency_ms: number;
    schema_status: 'ok' | 'failed'; evidence_status: 'ok' | 'failed';
    retry_count: number; breaker_status: 'open' | 'closed';
  }) => void;
  now: () => string;
  // Allowlist of lane names whose prompt files exist on disk. Built at server startup
  // by reading the prompts/ directory. Lanes outside this set are refused without ever
  // touching Moonshot — protects against path traversal and accidental disabled-lane dispatch.
  allowedLanes: Set<string>;
  // Per-MCP-process session identifier, used in prompt_cache_key.
  sessionFamily: string;
  // Precomputed hashed user identifier for safety_identifier (no raw secret material).
  safetyIdentifier: string;
}

const PRICE_USD_PER_1M = {
  prompt: 0.3,
  completion: 0.5,
};

function priceUsd(prompt_tokens: number, completion_tokens: number): number {
  return (prompt_tokens / 1_000_000) * PRICE_USD_PER_1M.prompt
       + (completion_tokens / 1_000_000) * PRICE_USD_PER_1M.completion;
}

export function createVerifyLane(deps: VerifyLaneDeps) {
  return async (input: VerifyLaneInput): Promise<Docket> => {
    const ctx: FailureContext = {
      run_id: input.run_id,
      artifact_id: input.artifact_id,
      artifact_sha: input.artifact_sha,
      artifact_type: input.artifact_type,
      lane: input.lane,
      bundle_id: input.bundle_id,
      model: input.model,
      profile: input.profile,
      attempt: 1,
      started_at: deps.now(),
      finished_at: deps.now(),
    };

    // Lane allowlist: refuse unknown / disabled lanes before consuming budget or touching Moonshot.
    if (!deps.allowedLanes.has(input.lane)) {
      const failedAt = deps.now();
      return mapFailureToDocket('refused', { ...ctx, finished_at: failedAt });
    }

    if (deps.budget.breakerOpen()) {
      return mapFailureToDocket('refused', { ...ctx, finished_at: deps.now() });
    }

    const release = await deps.semaphore.acquire();
    const startedAt = deps.now();
    try {
      const template = await deps.loadLaneTemplate(input.lane);
      const req = buildRequest({
        lane: input.lane,
        laneTemplate: template,
        artifactSlice: input.artifact_slice,
        evidenceBundle: input.evidence_bundle,
        claims: input.claims,
        model: input.model,
        maxCompletionTokens: input.max_completion_tokens,
        artifactSha: input.artifact_sha,
        sessionFamily: deps.sessionFamily,
        safetyIdentifier: deps.safetyIdentifier,
      });
      const result = await deps.moonshot.complete(req);
      const finishedAt = deps.now();

      if (!result.ok) {
        deps.telemetry({
          run_id: input.run_id, lane: input.lane, model: input.model, attempt: result.attempts,
          prompt_tokens: 0, completion_tokens: 0, cached_tokens: 0,
          finish_reason: 'error', latency_ms: 0,
          schema_status: 'failed', evidence_status: 'failed',
          retry_count: result.attempts - 1, breaker_status: deps.budget.breakerOpen() ? 'open' : 'closed',
        });
        return mapFailureToDocket(result.failure_class, { ...ctx, attempt: result.attempts, started_at: startedAt, finished_at: finishedAt });
      }

      // Charge budget on success
      const cost = priceUsd(result.prompt_tokens, result.completion_tokens);
      deps.budget.charge(cost);

      // Parse the response as JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(result.content);
      } catch {
        deps.telemetry({
          run_id: input.run_id, lane: input.lane, model: input.model, attempt: result.attempts,
          prompt_tokens: result.prompt_tokens, completion_tokens: result.completion_tokens, cached_tokens: result.cached_tokens ?? 0,
          finish_reason: result.finish_reason, latency_ms: 0,
          schema_status: 'failed', evidence_status: 'failed',
          retry_count: result.attempts - 1, breaker_status: deps.budget.breakerOpen() ? 'open' : 'closed',
        });
        return mapFailureToDocket('schema_error', { ...ctx, attempt: result.attempts, started_at: startedAt, finished_at: finishedAt });
      }

      // Validate against zod schema (rule 7, 8 enforced by .strict() and enum)
      const zodResult = DocketSchema.safeParse(parsed);
      if (!zodResult.success) {
        deps.telemetry({
          run_id: input.run_id, lane: input.lane, model: input.model, attempt: result.attempts,
          prompt_tokens: result.prompt_tokens, completion_tokens: result.completion_tokens, cached_tokens: result.cached_tokens ?? 0,
          finish_reason: result.finish_reason, latency_ms: 0,
          schema_status: 'failed', evidence_status: 'failed',
          retry_count: result.attempts - 1, breaker_status: deps.budget.breakerOpen() ? 'open' : 'closed',
        });
        return mapFailureToDocket('schema_error', { ...ctx, attempt: result.attempts, started_at: startedAt, finished_at: finishedAt });
      }

      let docket = zodResult.data;

      // Verify Kimi-returned identifying fields match request inputs.
      // Kimi's role is sterile clerk: it does not influence its own metadata.
      // Drift on any of these fields rejects the docket.
      const fieldsMatch =
        docket.run_id === input.run_id &&
        docket.artifact_id === input.artifact_id &&
        docket.artifact_sha === input.artifact_sha &&
        docket.artifact_type === input.artifact_type &&
        docket.lane === input.lane &&
        docket.bundle_id === input.bundle_id &&
        docket.profile === input.profile &&
        docket.model === input.model;
      if (!fieldsMatch) {
        deps.telemetry({
          run_id: input.run_id, lane: input.lane, model: input.model, attempt: result.attempts,
          prompt_tokens: result.prompt_tokens, completion_tokens: result.completion_tokens, cached_tokens: result.cached_tokens ?? 0,
          finish_reason: result.finish_reason, latency_ms: 0,
          schema_status: 'failed', evidence_status: 'failed',
          retry_count: result.attempts - 1, breaker_status: deps.budget.breakerOpen() ? 'open' : 'closed',
        });
        return mapFailureToDocket('schema_error', { ...ctx, attempt: result.attempts, started_at: startedAt, finished_at: finishedAt });
      }

      // Rule 10 enforcement: every requested claim must appear in either findings or unverified_claims.
      const accountedFor = new Set<string>([
        ...docket.findings.map((f) => f.claim_id),
        ...docket.unverified_claims.map((u) => u.claim_id),
      ]);
      const missingClaims = input.claims.filter((c) => !accountedFor.has(c.claim_id));
      if (missingClaims.length > 0) {
        deps.telemetry({
          run_id: input.run_id, lane: input.lane, model: input.model, attempt: result.attempts,
          prompt_tokens: result.prompt_tokens, completion_tokens: result.completion_tokens, cached_tokens: result.cached_tokens ?? 0,
          finish_reason: result.finish_reason, latency_ms: 0,
          schema_status: 'failed', evidence_status: 'ok',
          retry_count: result.attempts - 1, breaker_status: deps.budget.breakerOpen() ? 'open' : 'closed',
        });
        return mapFailureToDocket('schema_error', { ...ctx, attempt: result.attempts, started_at: startedAt, finished_at: finishedAt });
      }

      // Apply evidence-quality downgrade. Weakly-evidenced SOUND findings are flipped to CONCERN
      // and `overall` is recomputed; cross-field rule 2 then passes because no SOUND findings remain
      // without strong evidence.
      docket = downgradeWeakSound(docket);

      // Cross-field rules
      const cf = applyCrossFieldRules(docket);
      if (!cf.ok) {
        deps.telemetry({
          run_id: input.run_id, lane: input.lane, model: input.model, attempt: result.attempts,
          prompt_tokens: result.prompt_tokens, completion_tokens: result.completion_tokens, cached_tokens: result.cached_tokens ?? 0,
          finish_reason: result.finish_reason, latency_ms: 0,
          schema_status: 'failed', evidence_status: 'ok',
          retry_count: result.attempts - 1, breaker_status: deps.budget.breakerOpen() ? 'open' : 'closed',
        });
        return mapFailureToDocket('schema_error', { ...ctx, attempt: result.attempts, started_at: startedAt, finished_at: finishedAt });
      }

      // Locator resolution
      const lr = resolveLocators(docket, input.evidence_bundle);
      if (!lr.ok) {
        deps.telemetry({
          run_id: input.run_id, lane: input.lane, model: input.model, attempt: result.attempts,
          prompt_tokens: result.prompt_tokens, completion_tokens: result.completion_tokens, cached_tokens: result.cached_tokens ?? 0,
          finish_reason: result.finish_reason, latency_ms: 0,
          schema_status: 'ok', evidence_status: 'failed',
          retry_count: result.attempts - 1, breaker_status: deps.budget.breakerOpen() ? 'open' : 'closed',
        });
        return mapFailureToDocket('schema_error', { ...ctx, attempt: result.attempts, started_at: startedAt, finished_at: finishedAt });
      }

      deps.telemetry({
        run_id: input.run_id, lane: input.lane, model: input.model, attempt: result.attempts,
        prompt_tokens: result.prompt_tokens, completion_tokens: result.completion_tokens, cached_tokens: result.cached_tokens ?? 0,
        finish_reason: result.finish_reason, latency_ms: 0,
        schema_status: 'ok', evidence_status: 'ok',
        retry_count: result.attempts - 1, breaker_status: deps.budget.breakerOpen() ? 'open' : 'closed',
      });

      return docket;
    } finally {
      release();
    }
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd claude/mcps/principales && npm test
```

Expected: All `verify_lane` tests PASS.

- [ ] **Step 5: Commit**

```bash
git add claude/mcps/principales/src/tools/verify-lane.ts claude/mcps/principales/test/verify-lane.test.ts
git commit -m "feat: principales verify_lane tool wiring schema + locator + evidence-quality"
```

---

## Task 12: `health` and `mode` tools

> **Confidence: High** — small lookup tools. `mode()` reads env verbatim per spec Section 1.

**Files:**
- Create: `claude/mcps/principales/src/tools/health.ts`
- Create: `claude/mcps/principales/src/tools/mode.ts`
- Create: `claude/mcps/principales/test/health-mode.test.ts`

- [ ] **Step 1: Write failing tests**

`test/health-mode.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createHealth } from '../src/tools/health.js';
import { createMode } from '../src/tools/mode.js';

describe('health tool', () => {
  it('reports moonshot reachable, budget, queue, breaker', async () => {
    const tool = createHealth({
      probe: async () => true,
      budget: { remaining: () => 4.5, breakerOpen: () => false, charge: () => {}, spent_usd: () => 0.5 },
      queueDepth: () => 2,
    });
    const out = await tool();
    expect(out.moonshot_reachable).toBe(true);
    expect(out.budget_remaining_usd).toBe(4.5);
    expect(out.queue_depth).toBe(2);
    expect(out.breaker_state).toBe('closed');
  });

  it('reports breaker_state=open when budget breaker is tripped', async () => {
    const tool = createHealth({
      probe: async () => true,
      budget: { remaining: () => 0, breakerOpen: () => true, charge: () => {}, spent_usd: () => 6 },
      queueDepth: () => 0,
    });
    const out = await tool();
    expect(out.breaker_state).toBe('open');
  });
});

describe('mode tool', () => {
  it('returns CONSILIUM_VERIFICATION_MODE verbatim from env', async () => {
    const tool = createMode({ env: { CONSILIUM_VERIFICATION_MODE: 'principales' } });
    expect(await tool()).toBe('principales');
  });

  it('returns "classic" when env is unset', async () => {
    const tool = createMode({ env: {} });
    expect(await tool()).toBe('classic');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd claude/mcps/principales && npm test
```

Expected: FAIL.

- [ ] **Step 3: Implement health.ts**

```ts
export interface HealthDeps {
  probe: () => Promise<boolean>;
  budget: { remaining: () => number; breakerOpen: () => boolean; charge: (usd: number) => void; spent_usd: () => number };
  queueDepth: () => number;
}

export interface HealthOutput {
  moonshot_reachable: boolean;
  budget_remaining_usd: number;
  queue_depth: number;
  breaker_state: 'open' | 'closed';
}

export function createHealth(deps: HealthDeps) {
  return async (): Promise<HealthOutput> => ({
    moonshot_reachable: await deps.probe(),
    budget_remaining_usd: deps.budget.remaining(),
    queue_depth: deps.queueDepth(),
    breaker_state: deps.budget.breakerOpen() ? 'open' : 'closed',
  });
}
```

- [ ] **Step 4: Implement mode.ts**

```ts
export interface ModeDeps {
  env: NodeJS.ProcessEnv;
}

export function createMode(deps: ModeDeps) {
  return async (): Promise<string> => {
    return deps.env.CONSILIUM_VERIFICATION_MODE ?? 'classic';
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd claude/mcps/principales && npm test
```

Expected: All PASS.

- [ ] **Step 6: Commit**

```bash
git add claude/mcps/principales/src/tools/health.ts claude/mcps/principales/src/tools/mode.ts claude/mcps/principales/test/health-mode.test.ts
git commit -m "feat: principales health + mode tools"
```

---

## Task 13: MCP server registration

> **Confidence: High** — standard MCP server pattern via `@modelcontextprotocol/sdk`. Register the three tools, wire deps, start stdio transport.

**Files:**
- Modify (overwrite): `claude/mcps/principales/src/index.ts`
- Create: `claude/mcps/principales/src/server.ts`

- [ ] **Step 1: Implement src/server.ts**

```ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

import { MoonshotClient } from './moonshot/client.js';
import { Semaphore } from './runtime/concurrency.js';
import { SessionBudget } from './runtime/budget.js';
import { logTelemetry } from './runtime/telemetry.js';
import { createVerifyLane } from './tools/verify-lane.js';
import { createHealth } from './tools/health.js';
import { createMode } from './tools/mode.js';

const VerifyLaneArgs = z
  .object({
    run_id: z.string(),
    artifact_id: z.string(),
    artifact_sha: z.string(),
    artifact_type: z.enum(['spec', 'plan', 'diagnosis', 'task', 'campaign']),
    lane: z.string(),
    bundle_id: z.string(),
    profile: z.enum(['principalis_light', 'principalis_grounded', 'principalis_adversarial', 'principalis_batch']),
    model: z.string().optional(),
    artifact_slice: z.string(),
    evidence_bundle: z
      .object({
        sources: z.array(
          z
            .object({
              source_id: z.string(),
              source_type: z.enum(['artifact', 'repo', 'diff', 'doctrine', 'command', 'tool_result', 'upstream']),
              content: z.string(),
            })
            .strict(),
        ),
      })
      .strict(),
    claims: z.array(z.object({ claim_id: z.string(), claim: z.string() }).strict()),
    max_completion_tokens: z.number().int().min(100).max(16000).optional(),
    timeout_ms: z.number().int().min(1000).max(120000).optional(),
  })
  .strict();

export async function startServer(): Promise<void> {
  const env = process.env;
  const defaultModel = env.CONSILIUM_KIMI_DEFAULT_MODEL ?? 'kimi-k2.5';
  const escalationModel = env.CONSILIUM_KIMI_ESCALATION_MODEL ?? 'kimi-k2.6';
  const budgetUsd = parseFloat(env.CONSILIUM_KIMI_SESSION_BUDGET_USD ?? '5');
  const concurrency = parseInt(env.CONSILIUM_KIMI_MAX_CONCURRENCY ?? '4', 10);
  const timeoutMs = parseInt(env.CONSILIUM_KIMI_TIMEOUT_MS ?? '45000', 10);

  const moonshot = MoonshotClient.fromEnv(env);
  const semaphore = new Semaphore(concurrency);
  const budget = new SessionBudget(budgetUsd);

  // Resolve prompts directory relative to dist/server.js -> ../prompts
  const here = path.dirname(fileURLToPath(import.meta.url));
  const promptsDir = path.resolve(here, '..', 'prompts');

  // Build allowedLanes set from prompts/*.md filenames at startup. A lane is callable
  // only if its prompt template exists on disk; this gives the substrate a single source
  // of truth for "what lanes are dispatchable" and guards against path-traversal lane names.
  // Lane names must be non-empty alphanumeric-with-hyphens identifiers (rejects ".md", "..md",
  // hidden files, and other accidental matches).
  const LANE_NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
  const allowedLanes = new Set(
    (await readdir(promptsDir))
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.slice(0, -'.md'.length))
      .filter((name) => LANE_NAME_RE.test(name)),
  );

  // Per-MCP-process session family identifier — feeds into prompt_cache_key so that
  // repeat dispatches of the same artifact_sha:lane within a session can hit Moonshot's prompt cache.
  const sessionFamily = randomUUID();

  // Hashed user identifier for safety_identifier — never raw user material.
  const userMaterial = env.USER ?? env.LOGNAME ?? 'unknown';
  const safetyIdentifier = createHash('sha256').update(userMaterial).digest('hex').slice(0, 16);

  const verifyLane = createVerifyLane({
    moonshot,
    loadLaneTemplate: async (lane: string) => {
      const file = path.join(promptsDir, `${lane}.md`);
      return readFile(file, 'utf-8');
    },
    semaphore,
    budget,
    telemetry: (event) => logTelemetry(event, { stderr: process.stderr, env }),
    now: () => new Date().toISOString(),
    allowedLanes,
    sessionFamily,
    safetyIdentifier,
  });

  const health = createHealth({
    probe: async () => Boolean(env.MOONSHOT_API_KEY),
    budget,
    queueDepth: () => 0,
  });

  const mode = createMode({ env });

  const server = new Server(
    { name: 'consilium-principales', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'verify_lane',
        description: 'Run a single Principalis lane against an artifact slice + evidence bundle. Returns a validated principalis_docket.v1 JSON object.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['run_id', 'artifact_id', 'artifact_sha', 'artifact_type', 'lane', 'bundle_id', 'profile', 'artifact_slice', 'evidence_bundle', 'claims'],
          properties: {
            run_id: { type: 'string' },
            artifact_id: { type: 'string' },
            artifact_sha: { type: 'string' },
            artifact_type: { type: 'string', enum: ['spec', 'plan', 'diagnosis', 'task', 'campaign'] },
            lane: { type: 'string' },
            bundle_id: { type: 'string' },
            profile: { type: 'string', enum: ['principalis_light', 'principalis_grounded', 'principalis_adversarial', 'principalis_batch'] },
            model: { type: 'string' },
            artifact_slice: { type: 'string' },
            evidence_bundle: { type: 'object' },
            claims: { type: 'array' },
            max_completion_tokens: { type: 'number' },
            timeout_ms: { type: 'number' },
          },
        },
      },
      {
        name: 'health',
        description: 'Report MCP health: moonshot reachability, session budget remaining, queue depth, breaker state.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'mode',
        description: 'Return the value of CONSILIUM_VERIFICATION_MODE (substrate does not branch on this; reserved for integration case).',
        inputSchema: { type: 'object', properties: {} },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === 'verify_lane') {
      const parsed = VerifyLaneArgs.parse(args);
      const docket = await verifyLane({
        ...parsed,
        model: parsed.model ?? (parsed.profile === 'principalis_adversarial' ? escalationModel : defaultModel),
        max_completion_tokens: parsed.max_completion_tokens ?? 2000,
        timeout_ms: parsed.timeout_ms ?? timeoutMs,
      });
      return { content: [{ type: 'text', text: JSON.stringify(docket) }] };
    }
    if (name === 'health') {
      return { content: [{ type: 'text', text: JSON.stringify(await health()) }] };
    }
    if (name === 'mode') {
      return { content: [{ type: 'text', text: await mode() }] };
    }
    throw new Error(`Unknown tool: ${name}`);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
```

- [ ] **Step 2: Replace src/index.ts**

```ts
import { startServer } from './server.js';

startServer().catch((err) => {
  // Telemetry redacts; this stderr line should not include the key.
  process.stderr.write(`consilium-principales: failed to start: ${err.message}\n`);
  process.exit(1);
});
```

- [ ] **Step 3: Verify build succeeds**

```bash
cd claude/mcps/principales && npm run build
```

Expected: `dist/index.js`, `dist/server.js`, `dist/tools/*.js`, etc. exist.

- [ ] **Step 4: Verify all unit tests still pass**

```bash
cd claude/mcps/principales && npm test
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add claude/mcps/principales/src/server.ts claude/mcps/principales/src/index.ts
git commit -m "feat: principales MCP server registration with three tools"
```

---

## Task 14: Doctrine — `principales.md`

> **Confidence: High** — content drawn from spec Section 3 (sterile-clerk doctrine, four-verdict vocabulary, Independence Rule for Principales, forbidden-behavior list). No amendment to existing protocol.md.

**Files:**
- Create: `claude/skills/references/verification/principales.md`

- [ ] **Step 1: Write the file**

```markdown
# Principales Doctrine

The Principales are sterile evidence clerks. They do not advise. They do not rewrite. They do not plan. They do not command. They do not adjudicate. They check one lane against one artifact slice with one bounded evidence packet, and they return a compact JSON docket. Uncertainty escalates; absence of evidence is not proof of absence; the four-verdict vocabulary is sealed.

This file is a sibling of `protocol.md`. It does NOT amend the verification protocol. It defines what a Principalis IS, so that when the integration case wires Principales into Consilium dispatch, the doctrinal contract is already written.

---

## What a Principalis Is

A Principalis runs against:

- One **artifact slice** (a section of a spec, plan, diagnosis, task description, or campaign output).
- One **evidence bundle** (a structured collection of supplied source material — artifact excerpts, doctrine snippets, diff hunks, command outputs, prior dockets — that the wrapper preloaded for this lane).
- One **claim list** (the bundle of claims the dispatcher wants checked, each with a stable `claim_id`).
- One **lane prompt** (the discipline file for this lane, instructing the Principalis on what to look for and what to forbid).

The wrapper assembles these into a Moonshot Chat Completions request. The Principalis returns a `principalis_docket.v1` JSON object. The wrapper validates it. The dispatcher receives a validated docket or a synthetic-failure docket — never raw Kimi output.

---

## The Four-Verdict Vocabulary

A Principalis emits findings using only the four Codex verdicts. There are four, and only four. Anything else is a `schema_error`.

- **MISUNDERSTANDING** — the artifact appears to misunderstand a domain concept. The Principalis cites the doctrine excerpt that defines the concept and the artifact phrase that contradicts it. The wrapper sets `requires_officer_review=true` on every docket carrying a MISUNDERSTANDING; the substrate does not adjudicate.
- **GAP** — a requirement the artifact claims to address but does not, OR a wrapper-synthesized failure mapping (transport_failure, schema_error, truncation, refused).
- **CONCERN** — the artifact's approach works but a documented alternative exists. Advisory; the officer decides whether to adopt.
- **SOUND** — the verifier examined the lane's claim and the evidence supports it. SOUND requires `evidence_strength=strong` AND at least one resolvable evidence locator. SOUND-without-strong-evidence is reclassified by the wrapper as CONCERN (the verdict that captures "verifier has an opinion the wrapper cannot validate"); the original `evidence_strength` is preserved on the finding so the officer can see why, and `requires_officer_review=true`.

---

## Evidence-or-Escape Contract

Every finding either cites a resolvable locator OR escapes to `unverified_claims` with a documented reason. Silently dropped claims are not permitted.

The wrapper enforces:

- Every `findings[].evidence[].locator` must resolve to the supplied `evidence_bundle`. Hallucinated locators reject the docket.
- Every claim in the request's claim list either appears in `findings[]` keyed by its `claim_id`, or appears in `unverified_claims` with a reason. Missing-without-reason rejects the docket.
- `tool_failure` / `transport_failure` / `truncation` cannot produce overall `SOUND`. The wrapper enforces this even if Kimi insists.

---

## Independence Rule for Principales

A Principalis receives only:

- The artifact slice
- The lane prompt
- The evidence bundle
- The claim list
- The output schema reference

A Principalis does NOT receive:

- The Imperator-Consul conversation in any form (raw, summarized, or distilled into a "context").
- Other Principales' dockets within the same run.
- Officer prompts or persona content.
- Any field that biases verdicts toward concurrence.

The wrapper enforces this **structurally**, not semantically: the `verify_lane` tool's input schema accepts only the five field categories above. Callers cannot supply a "conversation" or "context_summary" field — the schema validator (zod `.strict()`) rejects unknown fields. The wrapper does not parse field contents to detect conversation-shaped strings; that is a contractual discipline on callers (the integration case will codify it for producer skills). One Principalis per `verify_lane` invocation prevents cross-lane contamination at the substrate layer.

---

## Forbidden Behavior

A Principalis does not:

- Propose broad strategy.
- Recommend implementation paths beyond a narrow assessment of a claim.
- Emit "looks good" verdicts without an evidence chain.
- Modify or extend the four-verdict vocabulary.
- Treat absence of found evidence as proof of absence (unless the supplied evidence's scope demonstrably covers the absence).
- Use unapproved tools (substrate v1: no host tools at all — preloaded evidence only).
- Close high-risk claims without officer validation. (Lane metadata flags high-risk lanes; the wrapper sets `kimi_sound_final=false` so the integration case's officer-audit logic forces review.)

---

## Profiles

A Principalis runs under one of four profiles, set by the dispatcher at request time:

- `principalis_light` — K2.5 non-thinking. Default for artifact-only lanes (upstream coverage, ambiguity, task ordering, etc.).
- `principalis_grounded` — K2.5 or K2.6 non-thinking, with host tools. **Reserved for Mode B; not active in v1.**
- `principalis_adversarial` — K2.6 non-thinking. For contradiction hunts, edge-case attacks, hidden-assumption probes.
- `principalis_batch` — Batch API, K2.5 or K2.6. **Reserved for offline sweeps; not active in v1.**

Thinking mode is OFF by default. Lane metadata may permit thinking on a case-by-case basis (`thinking_allowed: true`); the substrate does not enable thinking unless the lane explicitly grants it.

---

## What This Doctrine Does NOT Define

- How the merged docket reaches officers (officer-prompt amendments, dispatch-context placement, Independence Rule reconciliation). **Integration case.**
- Per-lane prompt content beyond the format. **Per-lane work, partly in v1 reference template.**
- Auto-feed iteration semantics for Principales. **Integration case.**
- Conflict reconciliation across lanes for the same artifact section. **Integration case.**
- Best-of-N orchestration. **Future case.**
- Cross-session daily budget aggregation. **Future case.**

This doctrine defines the substrate. The integration case writes the dispatch contract that consumes it.
```

- [ ] **Step 2: Commit**

```bash
git add claude/skills/references/verification/principales.md
git commit -m "feat: principales doctrine (sterile-clerk law, sibling of protocol.md)"
```

---

## Task 15: Lane taxonomy — `lanes.md`

> **Confidence: High** — content drawn from spec Section 4. Spec/plan lanes enabled, others disabled placeholders.

**Files:**
- Create: `claude/skills/references/verification/lanes.md`

- [ ] **Step 1: Write the file**

```markdown
# Principales Lane Taxonomy

Per-lane routing metadata. The wrapper consults this file (or rather, the per-lane prompt template under `claude/mcps/principales/prompts/<lane>.md` that mirrors these settings) to dispatch work. Lanes flagged `enabled: false` are placeholders for the Spec B integration/expansion case — the wrapper refuses to dispatch them.

---

## Metadata Keys

- `family` — broad lane category (`artifact-text`, `grounding`, `adversarial`, `business_critical`, `diagnosis`, `campaign`).
- `default_profile` — `principalis_light` / `principalis_grounded` / `principalis_adversarial` / `principalis_batch`.
- `evidence_required` — what evidence the dispatcher must supply (`artifact`, `repo`, `diff`, `doctrine`, `command`, or combinations like `artifact_and_doctrine`).
- `tools` — host tools the lane needs (empty in v1; reserved for Spec B).
- `kimi_sound_final` — whether a Kimi SOUND verdict can stand without officer spot-check (always `false` in v1; integration case may flip per-lane).
- `max_claims_per_bundle` — soft cap on claims per dispatch.
- `max_completion_tokens` — output cap.
- `thinking_allowed` — whether the lane permits thinking mode (always `false` in v1).
- `batch_allowed` — whether the lane permits offline Batch API use (always `false` in v1).
- `enabled` — `true` if the wrapper will dispatch this lane today; `false` placeholder.

---

## V1 Enabled Lanes (substrate-callable)

### Spec Lanes (artifact-text)

```yaml
upstream-coverage:
  family: artifact-text
  default_profile: principalis_light
  evidence_required: artifact_and_doctrine
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 8
  max_completion_tokens: 1500
  thinking_allowed: false
  batch_allowed: false
  enabled: true

ambiguity-audit:
  family: artifact-text
  default_profile: principalis_light
  evidence_required: artifact
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 10
  max_completion_tokens: 1500
  thinking_allowed: false
  batch_allowed: false
  enabled: true

confidence-map-sanity:
  family: artifact-text
  default_profile: principalis_light
  evidence_required: artifact
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 10
  max_completion_tokens: 1500
  thinking_allowed: false
  batch_allowed: false
  enabled: true

contradiction-hunt:
  family: adversarial
  default_profile: principalis_adversarial
  evidence_required: artifact
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 6
  max_completion_tokens: 2500
  thinking_allowed: false
  batch_allowed: false
  enabled: true

edge-case-attack:
  family: adversarial
  default_profile: principalis_adversarial
  evidence_required: artifact
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 6
  max_completion_tokens: 2500
  thinking_allowed: false
  batch_allowed: false
  enabled: true
```

### Plan Lanes (artifact-text)

```yaml
task-ordering:
  family: artifact-text
  default_profile: principalis_light
  evidence_required: artifact
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 10
  max_completion_tokens: 1500
  thinking_allowed: false
  batch_allowed: false
  enabled: true

undefined-references:
  family: artifact-text
  default_profile: principalis_light
  evidence_required: artifact
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 12
  max_completion_tokens: 1500
  thinking_allowed: false
  batch_allowed: false
  enabled: true

test-command-plausibility:
  family: artifact-text
  default_profile: principalis_light
  evidence_required: artifact
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 8
  max_completion_tokens: 1500
  thinking_allowed: false
  batch_allowed: false
  enabled: true

literal-execution-failure:
  family: adversarial
  default_profile: principalis_adversarial
  evidence_required: artifact
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 6
  max_completion_tokens: 2500
  thinking_allowed: false
  batch_allowed: false
  enabled: true

migration-risk:
  family: adversarial
  default_profile: principalis_adversarial
  evidence_required: artifact
  tools: []
  kimi_sound_final: false
  max_claims_per_bundle: 6
  max_completion_tokens: 2500
  thinking_allowed: false
  batch_allowed: false
  enabled: true
```

---

## V1 Disabled Lanes (placeholders for Spec B)

The substrate refuses to dispatch these. The integration/expansion case enables them when host tools (Mode B), diagnosis support, campaign triad, or batch sweeps land.

```yaml
codebase:
  family: grounding
  default_profile: principalis_grounded
  evidence_required: repo
  enabled: false

types:
  family: grounding
  default_profile: principalis_grounded
  evidence_required: repo
  enabled: false

api:
  family: grounding
  default_profile: principalis_grounded
  evidence_required: repo
  enabled: false

stubs:
  family: grounding
  default_profile: principalis_light
  evidence_required: diff
  enabled: false

quality:
  family: grounding
  default_profile: principalis_light
  evidence_required: diff
  enabled: false

architecture:
  family: grounding
  default_profile: principalis_grounded
  evidence_required: repo_and_doctrine
  enabled: false

integration:
  family: grounding
  default_profile: principalis_grounded
  evidence_required: repo
  enabled: false

medusa-workflow:
  family: business_critical
  default_profile: principalis_grounded
  evidence_required: repo_and_doctrine
  enabled: false

medusa-money:
  family: business_critical
  default_profile: principalis_grounded
  evidence_required: repo_and_doctrine
  kimi_sound_final: false
  enabled: false

reproduction:
  family: diagnosis
  default_profile: principalis_grounded
  evidence_required: command
  enabled: false

root-cause-evidence:
  family: diagnosis
  default_profile: principalis_grounded
  evidence_required: repo
  enabled: false

contrary-evidence:
  family: diagnosis
  default_profile: principalis_adversarial
  evidence_required: artifact
  enabled: false

threshold-honesty:
  family: diagnosis
  default_profile: principalis_adversarial
  evidence_required: artifact
  enabled: false

verification-plan:
  family: diagnosis
  default_profile: principalis_light
  evidence_required: command
  enabled: false

fix-site:
  family: diagnosis
  default_profile: principalis_grounded
  evidence_required: repo
  enabled: false

contract-compatibility:
  family: campaign
  default_profile: principalis_grounded
  evidence_required: repo
  enabled: false
```
```

- [ ] **Step 2: Commit**

```bash
git add claude/skills/references/verification/lanes.md
git commit -m "feat: principales lane taxonomy (v1 enabled spec/plan lanes; placeholders for Spec B)"
```

---

## Task 16: Reference lane prompt — `upstream-coverage.md`

> **Confidence: High** — fully written reference template per spec Section 4. Format documented in lanes.md; other lane prompts in next task are stubs that follow this shape.

**Files:**
- Create: `claude/mcps/principales/prompts/upstream-coverage.md`

- [ ] **Step 1: Write the file**

````markdown
# Lane: {{lane}}

You are a Consilium Principalis. You check ONE lane against one artifact slice with bounded evidence. You are a sterile evidence clerk — you do not advise, rewrite, plan, command, or adjudicate. You return one JSON object matching the schema. You return nothing else.

## Lane Definition

This is the **upstream-coverage** lane. Your task: determine whether the artifact (a Consul-produced spec) faithfully covers the upstream sources cited in the supplied evidence — Imperator-stated requirements, doctrine excerpts, prior diagnosis findings.

A claim of coverage is SOUND only when:
- The artifact section that addresses an upstream requirement can be quoted, AND
- The supplied evidence source for that requirement can be quoted, AND
- The two passages align on intent and scope.

A claim is GAP when:
- An upstream requirement appears in the evidence bundle but no artifact section addresses it, OR
- The artifact addresses a requirement but in narrower scope than the evidence demands, OR
- The artifact addresses a requirement using a domain concept that contradicts the doctrine in the evidence.

A claim is MISUNDERSTANDING when:
- The artifact uses a domain concept the evidence demonstrably defines differently. (Cite the doctrine source. Cite the artifact phrase.)

A claim is CONCERN when:
- The artifact technically covers the requirement but uses a documented anti-pattern when a documented alternative exists in the evidence.

## Forbidden Behavior

You do NOT:
- Propose alternatives to the artifact's approach.
- Rewrite the artifact in your assessment.
- Emit "looks good" verdicts without quoting BOTH the artifact AND the evidence source.
- Treat absence of an evidence source as proof of full coverage.
- Use the four-verdict vocabulary outside of finding `status` and the `overall` field.
- Refer to artifact-quoted vocabulary (the artifact may discuss MISUNDERSTANDING / GAP / CONCERN / SOUND as content) as findings — your findings are about the artifact's CLAIMS, not its prose.

## Claim Bundle

You will check exactly these claims:

{{claims}}

## Artifact Slice

The artifact slice under verification:

```
{{artifact}}
```

## Evidence Packet

The supplied evidence bundle. You may NOT cite locators outside this bundle — locators are validated host-side.

{{evidence}}

## Output Schema

Return one JSON object conforming to `principalis_docket.v1`. Required top-level fields:

```json
{
  "schema_version": "principalis_docket.v1",
  "run_id": "<from request>",
  "artifact_id": "<from request>",
  "artifact_sha": "<from request>",
  "artifact_type": "spec",
  "lane": "upstream-coverage",
  "bundle_id": "<from request>",
  "model": "<from request>",
  "profile": "principalis_light",
  "completion_status": "complete",
  "overall": "MISUNDERSTANDING | GAP | CONCERN | SOUND",
  "admissible": true,
  "requires_officer_review": false,
  "findings": [
    {
      "finding_id": "string",
      "claim_id": "<one of the supplied claim_ids>",
      "status": "MISUNDERSTANDING | GAP | CONCERN | SOUND",
      "claim": "<copy of the claim text>",
      "assessment": "<one to three sentences citing artifact AND evidence>",
      "evidence_strength": "none | weak | strong",
      "evidence": [
        {
          "source_type": "artifact | doctrine | upstream",
          "source_id": "<from evidence_bundle>",
          "locator": "<source_id:line-line | source_id#anchor>",
          "quote_or_fact": "<exact text>",
          "supports": "<one sentence linking quote to assessment>"
        }
      ],
      "unverified_reason": "none",
      "escalate": false
    }
  ],
  "evidence_summary": "<one sentence; required when findings is empty>",
  "unverified_claims": [
    {
      "claim_id": "<unchecked claim>",
      "claim": "<text>",
      "reason": "missing_context | missing_evidence | conflict | truncation"
    }
  ],
  "tool_transcript_refs": [],
  "runtime": {
    "started_at": "<ISO8601>",
    "finished_at": "<ISO8601>",
    "attempt": 1,
    "finish_reason": "stop",
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "cached_tokens": 0
  }
}
```

## Escalation Rule

If you cannot produce a finding for a claim because the evidence is insufficient, do NOT guess. Place that claim in `unverified_claims` with `reason: "missing_evidence"` and continue. The substrate maps an empty/sparse output to `requires_officer_review=true` automatically.

If you cannot produce ANY findings AND have no unverified claims to report, return `overall: "SOUND"` with empty `findings`, populate `evidence_summary` with one sentence justifying the empty result, and the wrapper will demand officer review for the no-finding case.

Do not return prose. Do not return commentary. Do not return JSON wrapped in markdown fences. Return the JSON object directly.
````

- [ ] **Step 2: Commit**

```bash
git add claude/mcps/principales/prompts/upstream-coverage.md
git commit -m "feat: principales upstream-coverage lane prompt (reference template)"
```

---

## Task 17: Lane prompt stubs (9 files)

> **Confidence: High** — stubs follow the upstream-coverage format with lane-specific definition + forbidden-behavior + claim/artifact/evidence slots. Integration case writes production prompts; the substrate ships callable stubs.

**Files:**
- Create: `claude/mcps/principales/prompts/ambiguity-audit.md`
- Create: `claude/mcps/principales/prompts/confidence-map-sanity.md`
- Create: `claude/mcps/principales/prompts/contradiction-hunt.md`
- Create: `claude/mcps/principales/prompts/edge-case-attack.md`
- Create: `claude/mcps/principales/prompts/task-ordering.md`
- Create: `claude/mcps/principales/prompts/undefined-references.md`
- Create: `claude/mcps/principales/prompts/test-command-plausibility.md`
- Create: `claude/mcps/principales/prompts/literal-execution-failure.md`
- Create: `claude/mcps/principales/prompts/migration-risk.md`

Each stub is a complete file. Mechanical recipe (do this exactly):

1. Copy `upstream-coverage.md` to the stub filename via `cp`.
2. Open the new file and replace the contents of `## Lane Definition` (the block between the `## Lane Definition` header and the next `## Forbidden Behavior` header) with the lane-specific block from the list below.
3. Do NOT touch any of the other sections (`# Lane: {{lane}}` heading, `## Forbidden Behavior`, `## Claim Bundle`, `## Artifact Slice`, `## Evidence Packet`, `## Output Schema`, `## Escalation Rule`). These contain the four slot tokens (`{{lane}}`, `{{artifact}}`, `{{evidence}}`, `{{claims}}`) that `buildRequest` (Task 9) requires; without them the request builder throws.
4. After all nine stubs exist, run the verification command in Step 2 — it greps every stub for the four required slot tokens and fails the task if any are missing.

- [ ] **Step 1: Generate all nine stubs**

```bash
cd claude/mcps/principales/prompts

for stub in ambiguity-audit confidence-map-sanity contradiction-hunt edge-case-attack \
            task-ordering undefined-references test-command-plausibility \
            literal-execution-failure migration-risk; do
  cp upstream-coverage.md "${stub}.md"
done
```

Then, for each new file, replace the `## Lane Definition` section's body (everything between the `## Lane Definition` header line and the `## Forbidden Behavior` header line) with the lane-specific block listed below. Use the `Edit` tool with `old_string` set to the verbatim Lane Definition body of `upstream-coverage.md` (everything between the two headers, exclusive of the headers themselves) and `new_string` set to the corresponding block below. The headers stay; only the body inside changes.

**`ambiguity-audit.md` Lane Definition:**

```
This is the **ambiguity-audit** lane. Your task: scan the artifact for claims that lack acceptance criteria, owner, inputs, or outputs.

A claim is GAP when:
- The artifact requires behavior X but does not say WHAT X is (no acceptance criterion).
- The artifact assigns work but names no owner or no execution context.
- The artifact specifies inputs/outputs only on one side.

A claim is CONCERN when:
- The acceptance criterion exists but is operationally vague ("should be performant") in a way that two readers would interpret differently.

A claim is SOUND when:
- The artifact section addresses a claim's acceptance criteria + owner + inputs + outputs explicitly. Quote each.

A claim is MISUNDERSTANDING when:
- The artifact uses a domain concept the evidence defines differently.
```

**`confidence-map-sanity.md` Lane Definition:**

```
This is the **confidence-map-sanity** lane. Your task: examine each High-confidence annotation in the artifact and verify the evidence cited supports the High rating.

A claim is GAP when:
- An annotation is High but cites no evidence.
- An annotation is High but cites evidence that is generic ("standard practice") rather than specific.
- An annotation is High but contradicts a doctrine source in the evidence bundle.

A claim is CONCERN when:
- An annotation is High and the evidence supports it, but the evidence is one source where independent corroboration would be expected.

A claim is SOUND when:
- An annotation is High AND the artifact quotes specific evidence (Imperator statement, doctrine excerpt, prior case) that supports the rating.

A claim is MISUNDERSTANDING when:
- An annotation is High because the artifact misreads doctrine the evidence directly contradicts.
```

**`contradiction-hunt.md` Lane Definition:**

```
This is the **contradiction-hunt** lane. You are an adversarial Principalis. Your task: find sections of the artifact that contradict each other or contradict named artifacts in the evidence bundle.

A claim is GAP when:
- Two artifact sections assert incompatible facts about the same subject.
- The artifact contradicts a doctrine excerpt in the evidence bundle.
- The artifact contradicts a prior case file referenced in the evidence.

A claim is CONCERN when:
- Two sections appear to contradict but a charitable reading reconciles them — the contradiction is wording-level.

A claim is SOUND when:
- The artifact section is internally consistent AND consistent with the evidence sources you checked.

Quote BOTH sides of any contradiction. A contradiction without two quoted sides is rejected by the wrapper.
```

**`edge-case-attack.md` Lane Definition:**

```
This is the **edge-case-attack** lane. You are an adversarial Principalis. Your task: surface unstated boundary conditions, failure modes, ambiguous concurrency, and trust assumptions.

A claim is GAP when:
- The artifact's logic implies a boundary case (empty collection, zero quantity, expired session, concurrent access, network failure) without addressing it.
- A trust assumption is named without saying what happens when it's wrong.

A claim is CONCERN when:
- A boundary is addressed but the response is generic ("handle gracefully") rather than specific.

A claim is SOUND when:
- The boundary case is explicitly addressed with specific behavior, or the artifact's scope explicitly excludes it.

Do not propose how to fix. Report what breaks under what condition.
```

**`task-ordering.md` Lane Definition:**

```
This is the **task-ordering** lane. Your task: verify that tasks in a plan can be executed in the stated order.

A claim is GAP when:
- Task N depends on a symbol/file/test created in Task N+k (forward reference).
- Task N references state established in Task M but the plan does not order N after M.
- A task's commit shape would leave the repo in a broken state at completion.

A claim is CONCERN when:
- The order works but a different order would be cleaner (advisory only).

A claim is SOUND when:
- Each task's preconditions are satisfied by the prefix of tasks before it.

Quote both the dependent task and the establishing task.
```

**`undefined-references.md` Lane Definition:**

```
This is the **undefined-references** lane. Your task: verify that every file path, symbol, and test command the plan references exists in the supplied evidence bundle.

A claim is GAP when:
- A file path the plan references does not appear in the evidence bundle's repo or diff sources.
- A symbol the plan references is not present in any evidence source.
- A test command the plan invokes does not match any test runner or script in the evidence.

A claim is CONCERN when:
- A reference resolves but is fragile (relative path crossing major boundaries, non-canonical symbol).

A claim is SOUND when:
- The plan's reference resolves to a quotable evidence source.

NOTE for v1: this lane runs in preloaded-evidence mode (Mode A). The dispatcher must supply repo/diff evidence for any path/symbol the plan claims to use.
```

**`test-command-plausibility.md` Lane Definition:**

```
This is the **test-command-plausibility** lane. Your task: verify that test commands the plan invokes actually exercise what the plan claims they exercise.

A claim is GAP when:
- The plan claims a test command verifies behavior X but the command targets a test file/suite/path that does not contain X.
- The test command would pass even if X were broken (false-positive risk).

A claim is CONCERN when:
- The test command verifies X but is overly narrow (one case where the spec demands several).

A claim is SOUND when:
- The test command targets the correct test artifact AND the test artifact (quoted from evidence) does verify the claimed behavior.
```

**`literal-execution-failure.md` Lane Definition:**

```
This is the **literal-execution-failure** lane. You are an adversarial Principalis. Your task: imagine a soldier executing the plan literally, without judgment, and report what breaks.

A claim is GAP when:
- A literal-reading soldier would interpret an order in a way that produces broken code (ambiguous variable name, misleading file path, sequence-dependent step labeled non-sequential).
- A step is impossible to execute as written (referenced tool absent, command shape malformed, glob would match nothing).
- A commit would leave the repo broken (test added without source, source modified without test).

A claim is CONCERN when:
- The literal reading works but the plan implies the soldier should use judgment in a way that's not made explicit.

A claim is SOUND when:
- A literal-reading soldier executes the step and the result is what the plan intended.

Do not propose alternatives. Report what breaks.
```

**`migration-risk.md` Lane Definition:**

```
This is the **migration-risk** lane. You are an adversarial Principalis. Your task: surface stale references, version drift, deprecated patterns, and brittle assumptions about repo state.

A claim is GAP when:
- The plan references a deprecated API/library/pattern named in the evidence as such.
- The plan assumes a repo state (file exists at path, branch tracks remote) that the evidence does not confirm.
- The plan's instructions would behave differently under the project's stated tooling versions vs. what the plan author assumed.

A claim is CONCERN when:
- A reference works today but is on a known deprecation path.

A claim is SOUND when:
- The plan's references match current evidence sources without drift.
```

- [ ] **Step 2: Verify all nine stubs exist AND carry the four slot tokens**

```bash
cd claude/mcps/principales/prompts

# Confirm count.
test "$(ls *.md | wc -l | tr -d ' ')" = '10' || { echo "FAIL: expected 10 prompt files"; exit 1; }

# Confirm every stub carries the four required slot tokens.
fail=0
for f in ambiguity-audit confidence-map-sanity contradiction-hunt edge-case-attack \
         task-ordering undefined-references test-command-plausibility \
         literal-execution-failure migration-risk; do
  for slot in '{{lane}}' '{{artifact}}' '{{evidence}}' '{{claims}}'; do
    if ! rg -q -F "$slot" "${f}.md"; then
      echo "FAIL: ${f}.md is missing ${slot}"
      fail=1
    fi
  done
done
test "$fail" = '0' || exit 1
echo 'OK: 10 prompt files; all stubs carry all four slot tokens.'
```

Expected: `OK: 10 prompt files; all stubs carry all four slot tokens.` If the verification fails, the soldier deleted or skipped a slot when editing the Lane Definition section — fix the offending stub before proceeding.

- [ ] **Step 3: Commit**

```bash
git add claude/mcps/principales/prompts/
git commit -m "feat: principales lane prompt stubs (9 files following upstream-coverage shape)"
```

---

## Task 18: Sanity tests — integration tests on `verify_lane`

> **Confidence: High** — the four sanity tests from spec Section 5. Each is an integration test against `createVerifyLane` with a mocked Moonshot client. Test 5 (smoke) is Imperator-driven, called out in Task 21.

**Files:**
- Create: `claude/mcps/principales/test/sanity.test.ts`

- [ ] **Step 1: Write the four sanity tests**

```ts
import { describe, it, expect } from 'vitest';
import { createVerifyLane, type VerifyLaneDeps } from '../src/tools/verify-lane.js';
import type { MoonshotResult } from '../src/moonshot/types.js';

const baseInput = {
  run_id: 'sanity-1',
  artifact_id: 'art',
  artifact_sha: 'sha',
  artifact_type: 'spec' as const,
  lane: 'upstream-coverage',
  bundle_id: 'b',
  profile: 'principalis_light' as const,
  model: 'kimi-k2.5',
  artifact_slice: '## Test artifact',
  evidence_bundle: { sources: [{ source_id: 'doctrine.md', source_type: 'doctrine' as const, content: 'rule\nline 2\nline 3' }] },
  claims: [{ claim_id: 'c1', claim: 'spec aligns with doctrine' }],
  max_completion_tokens: 1500,
  timeout_ms: 30000,
};

function makeDeps(result: MoonshotResult): VerifyLaneDeps {
  return {
    moonshot: { complete: async () => result },
    loadLaneTemplate: async () => '# {{lane}}\n{{artifact}}\n{{evidence}}\n{{claims}}',
    semaphore: { acquire: async () => () => {} },
    budget: {
      charge: () => {},
      breakerOpen: () => false,
      remaining: () => 5,
      spent_usd: () => 0,
    },
    telemetry: () => {},
    now: () => '2026-04-26T00:00:00Z',
    allowedLanes: new Set(['upstream-coverage']),
    sessionFamily: 'sess-test',
    safetyIdentifier: 'hash-test',
  };
}

describe('Sanity Test 1: Schema rejects bad shapes', () => {
  it('rejects an unsupported verdict (FINE) and emits schema_error', async () => {
    const badResponse = JSON.stringify({
      schema_version: 'principalis_docket.v1',
      run_id: 'sanity-1', artifact_id: 'art', artifact_sha: 'sha', artifact_type: 'spec',
      lane: 'upstream-coverage', bundle_id: 'b', model: 'kimi-k2.5', profile: 'principalis_light',
      completion_status: 'complete', overall: 'FINE',
      admissible: true, requires_officer_review: false,
      findings: [], evidence_summary: 'x',
      unverified_claims: [], tool_transcript_refs: [],
      runtime: { started_at: 't0', finished_at: 't1', attempt: 1, finish_reason: 'stop', prompt_tokens: 1, completion_tokens: 1, cached_tokens: 0 },
    });
    const deps = makeDeps({ ok: true, content: badResponse, finish_reason: 'stop', prompt_tokens: 1, completion_tokens: 1, cached_tokens: 0, attempts: 1 });
    const tool = createVerifyLane(deps);
    const docket = await tool(baseInput);
    expect(docket.completion_status).toBe('schema_error');
  });
});

describe('Sanity Test 2: SOUND-without-evidence downgrades to CONCERN', () => {
  it('flips finding status from SOUND to CONCERN, recomputes overall, preserves evidence_strength, and forces officer review', async () => {
    const weakResponse = JSON.stringify({
      schema_version: 'principalis_docket.v1',
      run_id: 'sanity-1', artifact_id: 'art', artifact_sha: 'sha', artifact_type: 'spec',
      lane: 'upstream-coverage', bundle_id: 'b', model: 'kimi-k2.5', profile: 'principalis_light',
      completion_status: 'complete', overall: 'SOUND',
      admissible: true, requires_officer_review: false,
      findings: [{
        finding_id: 'f1', claim_id: 'c1', status: 'SOUND', claim: 'x', assessment: 'y',
        evidence_strength: 'weak', evidence: [],
        unverified_reason: 'none', escalate: false,
      }],
      // evidence_summary intentionally omitted — the docket should still pass after downgrade
      // because downgraded findings make findings[] non-empty for cross-field rule 6.
      unverified_claims: [], tool_transcript_refs: [],
      runtime: { started_at: 't0', finished_at: 't1', attempt: 1, finish_reason: 'stop', prompt_tokens: 1, completion_tokens: 1, cached_tokens: 0 },
    });
    const deps = makeDeps({ ok: true, content: weakResponse, finish_reason: 'stop', prompt_tokens: 1, completion_tokens: 1, cached_tokens: 0, attempts: 1 });
    const tool = createVerifyLane(deps);
    const docket = await tool(baseInput);
    expect(docket.requires_officer_review).toBe(true);
    expect(docket.findings[0].status).toBe('CONCERN');
    expect(docket.findings[0].evidence_strength).toBe('weak');
    expect(docket.overall).toBe('CONCERN');
  });
});

describe('Sanity Test 3: Evidence-locator hallucination rejected', () => {
  it('rejects a SOUND with a locator referencing a source_id absent from evidence_bundle', async () => {
    const hallucinated = JSON.stringify({
      schema_version: 'principalis_docket.v1',
      run_id: 'sanity-1', artifact_id: 'art', artifact_sha: 'sha', artifact_type: 'spec',
      lane: 'upstream-coverage', bundle_id: 'b', model: 'kimi-k2.5', profile: 'principalis_light',
      completion_status: 'complete', overall: 'SOUND',
      admissible: true, requires_officer_review: false,
      findings: [{
        finding_id: 'f1', claim_id: 'c1', status: 'SOUND', claim: 'x', assessment: 'y',
        evidence_strength: 'strong',
        evidence: [{ source_type: 'doctrine', source_id: 'phantom.md', locator: 'phantom.md:1-3', quote_or_fact: 'q', supports: 's' }],
        unverified_reason: 'none', escalate: false,
      }],
      evidence_summary: 'hallucinated locator',
      unverified_claims: [], tool_transcript_refs: [],
      runtime: { started_at: 't0', finished_at: 't1', attempt: 1, finish_reason: 'stop', prompt_tokens: 1, completion_tokens: 1, cached_tokens: 0 },
    });
    const deps = makeDeps({ ok: true, content: hallucinated, finish_reason: 'stop', prompt_tokens: 1, completion_tokens: 1, cached_tokens: 0, attempts: 1 });
    const tool = createVerifyLane(deps);
    const docket = await tool(baseInput);
    expect(docket.completion_status).toBe('schema_error');
  });
});

describe('Sanity Test 4: Transport failure maps cleanly', () => {
  it('maps a Moonshot transport timeout to a synthetic GAP docket', async () => {
    const deps = makeDeps({ ok: false, failure_class: 'transport_failure', message: 'timeout', attempts: 2 });
    const tool = createVerifyLane(deps);
    const docket = await tool(baseInput);
    expect(docket.completion_status).toBe('transport_error');
    expect(docket.overall).toBe('GAP');
    expect(docket.findings[0].unverified_reason).toBe('transport_failure');
    expect(docket.requires_officer_review).toBe(true);
  });
});
```

- [ ] **Step 2: Run sanity tests**

```bash
cd claude/mcps/principales && npm test -- sanity
```

Expected: All 4 sanity tests PASS. (The unit tests from Tasks 2-12 also still pass.)

- [ ] **Step 3: Commit**

```bash
git add claude/mcps/principales/test/sanity.test.ts
git commit -m "feat: principales sanity tests (gating integration tests on verify_lane)"
```

---

## Task 19: Verify full build + all tests pass

> **Confidence: High** — gate before install. No code changes; only verification.

**Files:** None modified.

- [ ] **Step 1: Clean build**

```bash
cd claude/mcps/principales
rm -rf dist node_modules
npm install
npm run build
```

Expected: build succeeds; `dist/index.js`, `dist/server.js`, etc. exist.

- [ ] **Step 2: Run full test suite**

```bash
cd claude/mcps/principales && npm test
```

Expected: ALL tests PASS across schema, cross-field, locator, evidence-quality, parameter-scrubber, retry-mapper, moonshot-client, request-builder, runtime, verify-lane, health-mode, sanity. No failures.

- [ ] **Step 3: Confirm artifact paths**

```bash
ls -la claude/mcps/principales/dist/index.js
ls -la claude/mcps/principales/dist/server.js
ls -la claude/mcps/principales/prompts/upstream-coverage.md
ls -la claude/mcps/principales/schemas/principalis_docket.v1.json
ls -la claude/skills/references/verification/principales.md
ls -la claude/skills/references/verification/lanes.md
```

Expected: all exist.

- [ ] **Step 4: No commit (verification only)**

---

## Task 20: Add `consilium-principales` to `~/.claude/settings.json`

> **Confidence: High** — spec Configuration block. The top-level `mcpServers` key does NOT exist today; this task creates it.

**Files:**
- Modify: `/Users/milovan/.claude/settings.json`

- [ ] **Step 1: Backup the current settings.json**

```bash
cp ~/.claude/settings.json ~/.claude/settings.json.backup-$(date +%Y%m%d-%H%M%S)
```

- [ ] **Step 2: Read the current settings.json to confirm no `mcpServers` key exists**

```bash
python3 -c "import json; d = json.load(open('/Users/milovan/.claude/settings.json')); print('has_mcpServers:', 'mcpServers' in d); print('top_keys:', sorted(d.keys()))"
```

Expected: `has_mcpServers: False`. (If True, halt and report — the spec assumed otherwise; the soldier surfaces this to the Imperator.)

- [ ] **Step 3: Add the `mcpServers` block**

Use a Python edit to preserve existing structure:

```bash
python3 <<'PY'
import json, pathlib
p = pathlib.Path('/Users/milovan/.claude/settings.json')
d = json.loads(p.read_text())
d['mcpServers'] = {
    'consilium-principales': {
        'command': 'node',
        'args': ['/Users/milovan/projects/Consilium/claude/mcps/principales/dist/index.js'],
        'env': {
            'MOONSHOT_API_KEY': '<from-vault>',
            'CONSILIUM_VERIFICATION_MODE': 'classic',
            'CONSILIUM_KIMI_DEFAULT_MODEL': 'kimi-k2.5',
            'CONSILIUM_KIMI_ESCALATION_MODEL': 'kimi-k2.6',
            'CONSILIUM_KIMI_SESSION_BUDGET_USD': '5',
            'CONSILIUM_KIMI_MAX_CONCURRENCY': '4',
            'CONSILIUM_KIMI_TIMEOUT_MS': '45000',
            'CONSILIUM_KIMI_DISABLE_THINKING': 'true',
        },
    },
}
p.write_text(json.dumps(d, indent=2) + '\n')
print('OK')
PY
```

Expected: `OK`.

- [ ] **Step 4: Halt and surface to Imperator — MOONSHOT_API_KEY required**

The literal placeholder `<from-vault>` MUST be replaced with the real Moonshot API key by the Imperator before Claude Code restart. The soldier reports:

```
Settings.json updated. The MOONSHOT_API_KEY field is set to '<from-vault>' as a literal placeholder.
The Imperator must replace this with the real Moonshot API key from his vault before
Claude Code restart. Without the real key, the MCP will refuse to start and `mcp__principales__health()`
will report moonshot_reachable=false.
```

The soldier does NOT proceed to Task 21 until the Imperator confirms the key is in place.

- [ ] **Step 5: No commit (settings.json is not in this repo)**

---

## Task 21: Imperator-driven smoke test (Test 5)

> **Confidence: High** — the manual smoke test from spec Section 5. Imperator-driven; the soldier produces the artifact and asks the Imperator to walk it.

**Files:** None modified.

- [ ] **Step 1: Imperator restarts Claude Code**

After the API key is in place, the Imperator restarts Claude Code so the new `mcpServers` block takes effect and the MCP server is spawned.

- [ ] **Step 2: Imperator opens a fresh session and runs the health check**

In the new session, the Imperator (or a soldier the Imperator dispatches) runs:

```
mcp__principales__health()
```

Expected output:

```json
{ "moonshot_reachable": true, "budget_remaining_usd": 5, "queue_depth": 0, "breaker_state": "closed" }
```

If `moonshot_reachable: false`, halt — the API key is not loading. Check the env block in settings.json.

- [ ] **Step 3: Imperator runs the mode check**

```
mcp__principales__mode()
```

Expected output: `"classic"` (the default).

- [ ] **Step 4: Imperator runs a real verify_lane against a tiny fixture**

The Imperator dispatches:

```
mcp__principales__verify_lane({
  run_id: "smoke-1",
  artifact_id: "smoke-art",
  artifact_sha: "0000",
  artifact_type: "spec",
  lane: "upstream-coverage",
  bundle_id: "smoke-bundle",
  profile: "principalis_light",
  model: "kimi-k2.5",
  artifact_slice: "## Test\nThis is a tiny smoke artifact. It does nothing important.",
  evidence_bundle: { sources: [{ source_id: "doctrine.md", source_type: "doctrine", content: "There are no requirements in this fixture." }] },
  claims: [{ claim_id: "c1", claim: "smoke artifact has no requirements" }],
  max_completion_tokens: 1500,
  timeout_ms: 30000
})
```

Expected output: a JSON docket with `schema_version: "principalis_docket.v1"`, `completion_status: "complete"`, and at least one finding (likely SOUND with evidence_summary, since the smoke artifact is trivial).

If the docket validates and a real Moonshot call returns a structurally-correct result, the substrate is alive.

- [ ] **Step 5: Imperator confirms the smoke gate passed**

Imperator reports OK or surfaces any anomaly. If OK: the substrate is shipped.

- [ ] **Step 6: No commit (manual test, no artifact change)**

---

## Out-of-Scope Reminders (named so the Praetor does not flag them)

These belong to the **integration case** (separate next-session work), not Task 1-21:

- Producer skill amendments (`claude/skills/{consul,edicts}/SKILL.md`).
- Officer prompt amendments (`~/.claude/agents/consilium-{censor,praetor,provocator}.md`).
- Protocol mode amendment (Section 12 in `protocol.md`).
- Codex Independence Rule reconciliation (Censor MISUNDERSTANDING #1; resolution paths a/b/c documented in `next-session-notes.md`).
- Re-introducing the `officer` field on the docket schema (deferred per Censor MISUNDERSTANDING #2).
- Drift-check parity (no agent files edited in this case).
- Best-of-N orchestration.
- Mode-flag race / file-backed flag substrate.
- Auto-feed iteration docket reuse.
- Cross-session daily budget aggregation.
- Conflict-merge semantics across lanes.
- Repo-grounded host tools (Mode B): `read_file_slice`, `grep`, `symbol_search`, etc.
- Diagnosis lanes, campaign triad, batch sweeps.
- /checkit interaction.
- Codex-side parity (Codex CLI mcpServers configuration).
