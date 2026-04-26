import type { Docket } from './schema.js';

export interface EvidenceSource {
  source_id: string;
  source_type: 'artifact' | 'repo' | 'diff' | 'doctrine' | 'command' | 'tool_result' | 'upstream';
  content: string;
}

export interface EvidenceBundle {
  sources: EvidenceSource[];
}

export type LocatorResult =
  | { ok: true }
  | { ok: false; errors: string[] };

const LINE_RANGE_RE = /^(.+?):(\d+)(?:-(\d+))?$/;

export function resolveLocators(docket: Docket, bundle: EvidenceBundle): LocatorResult {
  const errors: string[] = [];
  const byId = new Map(bundle.sources.map((s) => [s.source_id, s]));

  for (const finding of docket.findings) {
    for (const ev of finding.evidence) {
      const src = byId.get(ev.source_id);
      if (!src) {
        errors.push(`locator: finding ${finding.finding_id} cites source_id ${ev.source_id} not in evidence_bundle`);
        continue;
      }

      const match = LINE_RANGE_RE.exec(ev.locator);
      if (match) {
        const [, , startStr, endStr] = match;
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : start;
        const lineCount = src.content.split('\n').length;
        if (start < 1 || end > lineCount) {
          errors.push(`locator: finding ${finding.finding_id} locator ${ev.locator} out of range (source has ${lineCount} lines)`);
        }
      }
      // Non-line-range locators (section anchors, command refs) accepted as long as source_id resolves.
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
