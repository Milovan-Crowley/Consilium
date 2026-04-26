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
