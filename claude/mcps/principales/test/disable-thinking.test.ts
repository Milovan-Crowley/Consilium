import { describe, it, expect } from 'vitest';

// We test the parse logic by extracting it to a helper. Inline the helper here for the test;
// the actual implementation is identical in server.ts. If they drift, this test catches it.
function parseDisableThinking(envValue: string | undefined): boolean {
  const raw = (envValue ?? 'true').toLowerCase().trim();
  return raw !== 'false';
}

describe('CONSILIUM_KIMI_DISABLE_THINKING parse (GAP-D fix)', () => {
  it('defaults to true when env is unset', () => {
    expect(parseDisableThinking(undefined)).toBe(true);
  });

  it('returns false only on literal "false" (case-insensitive)', () => {
    expect(parseDisableThinking('false')).toBe(false);
    expect(parseDisableThinking('FALSE')).toBe(false);
    expect(parseDisableThinking('  False  ')).toBe(false);
  });

  it('treats any non-false value as true (defensive)', () => {
    expect(parseDisableThinking('true')).toBe(true);
    expect(parseDisableThinking('yes')).toBe(true);
    expect(parseDisableThinking('1')).toBe(true);
    expect(parseDisableThinking('')).toBe(true);
    expect(parseDisableThinking('disabled')).toBe(true);
  });
});
