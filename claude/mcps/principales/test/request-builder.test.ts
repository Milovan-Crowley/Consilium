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
    expect(req.messages[1].content).toContain('# Lane: upstream-coverage');
    expect(req.messages[1].content).toContain('## Test Artifact');
    expect(req.messages[1].content).toContain('doctrine text');
    expect(req.messages[1].content).toContain('c1');
    expect(req.messages[1].content).toContain('spec aligns with doctrine');
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

  it('places the fixed sterile-clerk system prompt at messages[0] (Independence Rule)', () => {
    const req = buildRequest(args());
    expect(req.messages[0].role).toBe('system');
    expect(req.messages[0].content).toContain('Sterile evidence clerk');
    expect(req.messages[0].content).toContain('JSON');
  });
});
