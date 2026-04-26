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
