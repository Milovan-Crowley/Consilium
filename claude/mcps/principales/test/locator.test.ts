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
