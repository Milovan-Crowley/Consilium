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
