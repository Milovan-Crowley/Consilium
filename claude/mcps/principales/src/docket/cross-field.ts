import type { Docket, Verdict } from './schema.js';

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

export const VERDICT_SEVERITY: Record<Verdict, number> = {
  SOUND: 0,
  CONCERN: 1,
  GAP: 2,
  MISUNDERSTANDING: 3,
};

export function worstStatus(statuses: Verdict[]): Verdict {
  if (statuses.length === 0) return 'SOUND';
  return statuses.reduce((worst, s) =>
    VERDICT_SEVERITY[s] > VERDICT_SEVERITY[worst] ? s : worst,
  );
}

export function applyCrossFieldRules(docket: Docket): ValidationResult {
  const errors: string[] = [];

  // Rule 1: overall must be the worst finding status
  const expectedOverall = worstStatus(docket.findings.map((f) => f.status));
  if (docket.findings.length > 0 && docket.overall !== expectedOverall) {
    errors.push(`rule 1: overall must be ${expectedOverall} (worst finding), got ${docket.overall}`);
  }

  // Rule 2: every SOUND finding has at least one strong evidence item
  for (const f of docket.findings) {
    if (f.status === 'SOUND') {
      const hasStrong = f.evidence_strength === 'strong' && f.evidence.length > 0;
      if (!hasStrong) {
        errors.push(`rule 2: SOUND finding ${f.finding_id} requires evidence_strength=strong with at least one evidence item`);
      }
    }
  }

  // Rule 3: completion_status != complete forces requires_officer_review
  if (docket.completion_status !== 'complete' && !docket.requires_officer_review) {
    errors.push(`rule 3: completion_status=${docket.completion_status} requires requires_officer_review=true`);
  }

  // Rule 4: transport_failure / missing_context / truncation cannot produce overall SOUND
  const blockingReasons = new Set(['transport_failure', 'missing_context', 'truncation', 'tool_failure', 'tool_error', 'schema_failure']);
  if (docket.overall === 'SOUND') {
    for (const f of docket.findings) {
      if (blockingReasons.has(f.unverified_reason)) {
        errors.push(`rule 4: finding ${f.finding_id} has blocking unverified_reason=${f.unverified_reason}; overall cannot be SOUND`);
      }
    }
  }

  // Rule 5: MISUNDERSTANDING (overall or any finding) forces requires_officer_review
  const hasMisunderstanding =
    docket.overall === 'MISUNDERSTANDING' ||
    docket.findings.some((f) => f.status === 'MISUNDERSTANDING');
  if (hasMisunderstanding && !docket.requires_officer_review) {
    errors.push('rule 5: MISUNDERSTANDING present; requires_officer_review must be true');
  }

  // Rule 6: empty findings allowed only when overall=SOUND and evidence_summary exists
  if (docket.findings.length === 0) {
    if (docket.overall !== 'SOUND') {
      errors.push(`rule 6: empty findings requires overall=SOUND, got ${docket.overall}`);
    }
    if (!docket.evidence_summary || docket.evidence_summary.trim() === '') {
      errors.push('rule 6: empty findings requires non-empty evidence_summary');
    }
  }

  // Rules 7 (extra fields), 8 (unsupported verdicts) are enforced by zod's .strict() in schema.ts.
  // Rule 9 (locator resolution) is enforced by the locator validator (Task 4).
  // Rule 10 (missing claims to unverified) is enforced by the request-builder/verify_lane glue (Task 13)
  //   — we cannot detect "missing claims" here without knowing the requested claim list.

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
