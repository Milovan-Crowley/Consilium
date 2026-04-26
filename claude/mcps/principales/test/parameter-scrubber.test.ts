import { describe, it, expect } from 'vitest';
import { scrubParameters } from '../src/pipeline/parameter-scrubber.js';

describe('parameter scrubber', () => {
  it('strips arbitrary temperature, top_p, n>1', () => {
    const out = scrubParameters({ temperature: 0.7, top_p: 0.9, n: 3, model: 'kimi-k2.5', messages: [] });
    expect(out.temperature).toBeUndefined();
    expect(out.top_p).toBeUndefined();
    expect(out.n).toBeUndefined();
  });

  it('keeps n=1 (default-equivalent)', () => {
    const out = scrubParameters({ n: 1, model: 'kimi-k2.5', messages: [] });
    // n=1 is fine; we just don't pass it through
    expect(out.n).toBeUndefined();
  });

  it('strips deprecated functions and tool_choice="required"', () => {
    const out = scrubParameters({
      functions: [{ name: 'old' }],
      tool_choice: 'required',
      model: 'kimi-k2.5',
      messages: [],
    });
    expect(out.functions).toBeUndefined();
    expect(out.tool_choice).toBeUndefined();
  });

  it('strips nonzero penalties', () => {
    const out = scrubParameters({
      frequency_penalty: 0.5,
      presence_penalty: -0.1,
      model: 'kimi-k2.5',
      messages: [],
    });
    expect(out.frequency_penalty).toBeUndefined();
    expect(out.presence_penalty).toBeUndefined();
  });

  it('renames raw max_tokens to max_completion_tokens', () => {
    const out = scrubParameters({ max_tokens: 1000, model: 'kimi-k2.5', messages: [] });
    expect(out.max_tokens).toBeUndefined();
    expect(out.max_completion_tokens).toBe(1000);
  });

  it('preserves max_completion_tokens if already set', () => {
    const out = scrubParameters({ max_completion_tokens: 2000, model: 'kimi-k2.5', messages: [] });
    expect(out.max_completion_tokens).toBe(2000);
  });

  it('preserves model and messages', () => {
    const out = scrubParameters({ model: 'kimi-k2.6', messages: [{ role: 'user', content: 'hi' }] });
    expect(out.model).toBe('kimi-k2.6');
    expect(out.messages).toEqual([{ role: 'user', content: 'hi' }]);
  });

  it('preserves prompt_cache_key and safety_identifier (spec Section 1 invariant)', () => {
    const out = scrubParameters({
      model: 'kimi-k2.5',
      messages: [],
      prompt_cache_key: 'sha-1:upstream-coverage:sess-A',
      safety_identifier: 'hash-xyz',
    });
    expect(out.prompt_cache_key).toBe('sha-1:upstream-coverage:sess-A');
    expect(out.safety_identifier).toBe('hash-xyz');
  });
});
