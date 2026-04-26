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
