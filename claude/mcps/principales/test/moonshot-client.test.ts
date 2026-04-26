import { describe, it, expect, vi } from 'vitest';
import { MoonshotClient, type MoonshotClientDeps } from '../src/moonshot/client.js';

function makeMockChatCompletions(responses: Array<{ ok: true; content: string } | { ok: false; error: Error }>) {
  let i = 0;
  const create = vi.fn(async () => {
    const r = responses[i++];
    if (!r) throw new Error('mock exhausted');
    if (!r.ok) throw r.error;
    return {
      choices: [{ message: { content: r.content }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    };
  });
  return { create };
}

const baseRequest = {
  model: 'kimi-k2.5',
  messages: [{ role: 'user', content: 'test' }],
  max_completion_tokens: 100,
};

describe('Moonshot client', () => {
  it('returns content on first-try success', async () => {
    const mock = makeMockChatCompletions([{ ok: true, content: '{"ok": true}' }]);
    const deps: MoonshotClientDeps = {
      chatCompletionsCreate: mock.create,
      sleep: () => Promise.resolve(),
    };
    const client = new MoonshotClient(deps);
    const result = await client.complete(baseRequest);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.content).toBe('{"ok": true}');
      expect(result.attempts).toBe(1);
    }
  });

  it('retries once on 429 then succeeds', async () => {
    const err: Error & { status?: number } = new Error('rate limited');
    err.status = 429;
    const mock = makeMockChatCompletions([
      { ok: false, error: err },
      { ok: true, content: 'second-try' },
    ]);
    const deps: MoonshotClientDeps = {
      chatCompletionsCreate: mock.create,
      sleep: () => Promise.resolve(),
    };
    const client = new MoonshotClient(deps);
    const result = await client.complete(baseRequest);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.attempts).toBe(2);
  });

  it('returns transport_failure after retry exhaustion on persistent 5xx', async () => {
    const err: Error & { status?: number } = new Error('upstream down');
    err.status = 503;
    const mock = makeMockChatCompletions([
      { ok: false, error: err },
      { ok: false, error: err },
    ]);
    const deps: MoonshotClientDeps = {
      chatCompletionsCreate: mock.create,
      sleep: () => Promise.resolve(),
    };
    const client = new MoonshotClient(deps);
    const result = await client.complete(baseRequest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure_class).toBe('transport_failure');
    }
  });

  it('returns transport_failure on non-retryable error after one attempt', async () => {
    const err = new Error('weird');
    const mock = makeMockChatCompletions([{ ok: false, error: err }]);
    const deps: MoonshotClientDeps = {
      chatCompletionsCreate: mock.create,
      sleep: () => Promise.resolve(),
    };
    const client = new MoonshotClient(deps);
    const result = await client.complete(baseRequest);
    expect(result.ok).toBe(false);
  });
});

describe('MoonshotClient.fromEnv (GAP-B fix: defensive timeout parsing)', () => {
  // Note: We can't easily intercept the OpenAI SDK constructor here without
  // a vi.mock setup. The defensive-parse logic is tested separately by
  // observing that fromEnv does not throw on malformed env values.

  it('does not throw on malformed CONSILIUM_KIMI_TIMEOUT_MS', () => {
    expect(() => MoonshotClient.fromEnv({
      MOONSHOT_API_KEY: 'sk-test',
      CONSILIUM_KIMI_TIMEOUT_MS: 'not-a-number',
    } as NodeJS.ProcessEnv)).not.toThrow();
  });

  it('does not throw on negative CONSILIUM_KIMI_TIMEOUT_MS', () => {
    expect(() => MoonshotClient.fromEnv({
      MOONSHOT_API_KEY: 'sk-test',
      CONSILIUM_KIMI_TIMEOUT_MS: '-1000',
    } as NodeJS.ProcessEnv)).not.toThrow();
  });

  it('throws clear error on placeholder MOONSHOT_API_KEY', () => {
    expect(() => MoonshotClient.fromEnv({
      MOONSHOT_API_KEY: '<from-vault>',
    } as NodeJS.ProcessEnv)).toThrow(/placeholder/);
  });
});
