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
