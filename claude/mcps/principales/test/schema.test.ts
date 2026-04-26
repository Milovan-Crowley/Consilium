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
