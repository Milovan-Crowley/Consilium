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
    disableThinking: true,
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
