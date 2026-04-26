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
  findings: [{
    finding_id: 'f1',
    claim_id: 'c1',
    status: 'SOUND',
    claim: 'spec aligns with doctrine',
    assessment: 'doctrine entry confirms alignment',
    evidence_strength: 'strong',
    evidence: [{
      source_type: 'doctrine',
      source_id: 'doctrine.md',
      locator: 'doctrine.md',
      quote_or_fact: 'rule',
      supports: 'spec aligns with doctrine',
    }],
    unverified_reason: 'none',
    escalate: false,
  }],
  evidence_summary: 'spec aligns; one finding sound',
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
    disableThinking: true,
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

describe('verify_lane error containment (GAP-A fix)', () => {
  it('maps loadLaneTemplate ENOENT to refused', async () => {
    const deps = makeDeps({ ok: true, content: validKimiResponse, finish_reason: 'stop', prompt_tokens: 1, completion_tokens: 1, cached_tokens: 0, attempts: 1 });
    const enoentErr = Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' });
    deps.loadLaneTemplate = async () => { throw enoentErr; };
    const tool = createVerifyLane(deps);
    const docket = await tool(baseInput);
    expect(docket.completion_status).toBe('refused');
  });

  it('maps buildRequest throw (empty artifact_slice) to schema_error', async () => {
    // Bypass Layer-1 Zod gate by passing the input directly to the tool factory.
    // buildRequest throws because artifactSlice is empty after trim.
    const deps = makeDeps({ ok: true, content: validKimiResponse, finish_reason: 'stop', prompt_tokens: 1, completion_tokens: 1, cached_tokens: 0, attempts: 1 });
    const tool = createVerifyLane(deps);
    const docket = await tool({ ...baseInput, artifact_slice: '' });
    expect(docket.completion_status).toBe('schema_error');
  });

  it('maps unexpected throw to schema_error', async () => {
    const deps = makeDeps({ ok: true, content: validKimiResponse, finish_reason: 'stop', prompt_tokens: 1, completion_tokens: 1, cached_tokens: 0, attempts: 1 });
    deps.loadLaneTemplate = async () => { throw new Error('weird'); };
    const tool = createVerifyLane(deps);
    const docket = await tool(baseInput);
    expect(docket.completion_status).toBe('schema_error');
  });

  it('releases semaphore even when verify-lane body throws', async () => {
    let released = 0;
    const deps = makeDeps({ ok: true, content: validKimiResponse, finish_reason: 'stop', prompt_tokens: 1, completion_tokens: 1, cached_tokens: 0, attempts: 1 });
    deps.semaphore = { acquire: async () => () => { released += 1; } };
    deps.loadLaneTemplate = async () => { throw new Error('boom'); };
    const tool = createVerifyLane(deps);
    await tool(baseInput);
    expect(released).toBe(1);
  });
});
