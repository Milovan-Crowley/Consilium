import type { Docket } from './schema.js';
import { worstStatus } from './cross-field.js';

export function downgradeWeakSound(docket: Docket): Docket {
  let needsReview = false;
  const findings = docket.findings.map((f) => {
    if (f.status !== 'SOUND') return f;
    const strong = f.evidence_strength === 'strong' && f.evidence.length > 0;
    if (strong) return f;
    needsReview = true;
    // Flip status SOUND → CONCERN; preserve evidence_strength so the officer can see
    // why the wrapper distrusted this finding ('weak' or 'none').
    const preservedStrength: 'weak' | 'none' =
      f.evidence_strength === 'none' ? 'none' : 'weak';
    return { ...f, status: 'CONCERN' as const, evidence_strength: preservedStrength };
  });

  if (!needsReview) return docket;

  // Recompute overall to reflect the new worst status among findings.
  const newOverall = worstStatus(findings.map((f) => f.status));

  return {
    ...docket,
    findings,
    overall: newOverall,
    requires_officer_review: true,
  };
}
