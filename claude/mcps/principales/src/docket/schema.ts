import { z } from 'zod';

export const Verdict = z.enum(['MISUNDERSTANDING', 'GAP', 'CONCERN', 'SOUND']);
export type Verdict = z.infer<typeof Verdict>;

export const ArtifactType = z.enum(['spec', 'plan', 'diagnosis', 'task', 'campaign']);
export const Profile = z.enum([
  'principalis_light',
  'principalis_grounded',
  'principalis_adversarial',
  'principalis_batch',
]);

export const CompletionStatus = z.enum([
  'complete',
  'truncated',
  'tool_error',
  'schema_error',
  'transport_error',
  'refused',
]);

export const UnverifiedReason = z.enum([
  'none',
  'missing_context',
  'missing_tool',
  'tool_failure',
  'tool_error',
  'transport_failure',
  'conflict',
  'truncation',
  'schema_failure',
]);

export const SourceType = z.enum([
  'artifact',
  'repo',
  'diff',
  'doctrine',
  'command',
  'tool_result',
  'upstream',
]);

const EvidenceItem = z
  .object({
    source_type: SourceType,
    source_id: z.string(),
    locator: z.string(),
    quote_or_fact: z.string(),
    supports: z.string(),
  })
  .strict();

const Finding = z
  .object({
    finding_id: z.string(),
    claim_id: z.string(),
    status: Verdict,
    claim: z.string(),
    assessment: z.string(),
    evidence_strength: z.enum(['none', 'weak', 'strong']),
    evidence: z.array(EvidenceItem),
    unverified_reason: UnverifiedReason,
    escalate: z.boolean(),
  })
  .strict();

const UnverifiedClaim = z
  .object({
    claim_id: z.string(),
    claim: z.string(),
    reason: z.enum([
      'missing_context',
      'missing_evidence',
      'tool_failure',
      'transport_failure',
      'conflict',
      'truncation',
    ]),
  })
  .strict();

const ToolTranscriptRef = z
  .object({
    tool_call_id: z.string(),
    tool_name: z.string(),
    status: z.enum(['success', 'failure', 'denied', 'timeout']),
    result_ref: z.string(),
  })
  .strict();

const Runtime = z
  .object({
    started_at: z.string(),
    finished_at: z.string(),
    attempt: z.number().int().min(1),
    finish_reason: z.enum(['stop', 'length', 'tool_calls', 'error']),
    prompt_tokens: z.number().int().min(0),
    completion_tokens: z.number().int().min(0),
    cached_tokens: z.number().int().min(0),
  })
  .strict();

export const DocketSchema = z
  .object({
    schema_version: z.literal('principalis_docket.v1'),
    run_id: z.string(),
    artifact_id: z.string(),
    artifact_sha: z.string(),
    artifact_type: ArtifactType,
    lane: z.string(),
    bundle_id: z.string(),
    model: z.string(),
    profile: Profile,
    completion_status: CompletionStatus,
    overall: Verdict,
    admissible: z.boolean(),
    requires_officer_review: z.boolean(),
    findings: z.array(Finding),
    evidence_summary: z.string().optional(),
    unverified_claims: z.array(UnverifiedClaim),
    tool_transcript_refs: z.array(ToolTranscriptRef),
    runtime: Runtime,
  })
  .strict();

export type Docket = z.infer<typeof DocketSchema>;
