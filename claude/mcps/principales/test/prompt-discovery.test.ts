import { describe, it, expect } from 'vitest';
import { readdir } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const LANE_NAME_RE = /^[a-z0-9][a-z0-9-]*$/;

async function discoverLanes(promptsDir: string): Promise<Set<string>> {
  return new Set(
    (await readdir(promptsDir))
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.slice(0, -'.md'.length))
      .filter((name) => LANE_NAME_RE.test(name)),
  );
}

describe('prompt discovery — execution family lanes', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const promptsDir = path.resolve(here, '..', 'prompts');

  it('discovers task-plan-match', async () => {
    const lanes = await discoverLanes(promptsDir);
    expect(lanes.has('task-plan-match')).toBe(true);
  });

  it('discovers task-no-stubs', async () => {
    const lanes = await discoverLanes(promptsDir);
    expect(lanes.has('task-no-stubs')).toBe(true);
  });

  it('discovers task-domain-correctness', async () => {
    const lanes = await discoverLanes(promptsDir);
    expect(lanes.has('task-domain-correctness')).toBe(true);
  });

  it('discovers task-integration-prior', async () => {
    const lanes = await discoverLanes(promptsDir);
    expect(lanes.has('task-integration-prior')).toBe(true);
  });

  it('preserves existing lanes alongside new ones', async () => {
    const lanes = await discoverLanes(promptsDir);
    expect(lanes.has('upstream-coverage')).toBe(true);
    expect(lanes.has('ambiguity-audit')).toBe(true);
    expect(lanes.has('contradiction-hunt')).toBe(true);
  });

  it('rejects accidental matches per LANE_NAME_RE', async () => {
    const lanes = await discoverLanes(promptsDir);
    expect(lanes.has('')).toBe(false);
    expect(lanes.has('.')).toBe(false);
  });
});
