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
