import { describe, it, expect, vi } from 'vitest';
import { Semaphore } from '../src/runtime/concurrency.js';
import { SessionBudget } from '../src/runtime/budget.js';
import { logTelemetry, redactSecrets } from '../src/runtime/telemetry.js';

describe('Semaphore', () => {
  it('allows up to N parallel acquisitions', async () => {
    const s = new Semaphore(2);
    const order: string[] = [];
    const t = async (label: string, ms: number) => {
      const release = await s.acquire();
      order.push(`start-${label}`);
      await new Promise((r) => setTimeout(r, ms));
      order.push(`end-${label}`);
      release();
    };
    await Promise.all([t('a', 20), t('b', 20), t('c', 5)]);
    // a and b start first; c waits for one of them
    expect(order.slice(0, 2)).toEqual(['start-a', 'start-b']);
  });
});

describe('SessionBudget', () => {
  it('tracks spend and reports remaining', () => {
    const b = new SessionBudget(5.0);
    b.charge(1.0);
    b.charge(0.5);
    expect(b.remaining()).toBeCloseTo(3.5);
  });

  it('opens breaker when spend exceeds budget', () => {
    const b = new SessionBudget(2.0);
    b.charge(1.0);
    expect(b.breakerOpen()).toBe(false);
    b.charge(1.5);
    expect(b.breakerOpen()).toBe(true);
  });
});

describe('telemetry', () => {
  it('redacts MOONSHOT_API_KEY values from text', () => {
    const out = redactSecrets('key=sk-abc123 and bearer sk-xyz', { MOONSHOT_API_KEY: 'sk-abc123' });
    expect(out).not.toContain('sk-abc123');
    expect(out).toContain('[REDACTED]');
  });

  it('logTelemetry writes a JSON line to stderr without secrets', () => {
    const writes: string[] = [];
    const stderr = { write: (s: string) => { writes.push(s); return true; } };
    logTelemetry(
      { run_id: 'r1', lane: 'upstream-coverage', model: 'kimi-k2.5', attempt: 1, prompt_tokens: 10, completion_tokens: 5, cached_tokens: 0, finish_reason: 'stop', latency_ms: 100, schema_status: 'ok', evidence_status: 'ok', retry_count: 0, breaker_status: 'closed' },
      { stderr, env: { MOONSHOT_API_KEY: 'sk-secret' } } as never,
    );
    expect(writes.length).toBe(1);
    expect(writes[0]).toContain('"run_id":"r1"');
    expect(writes[0]).not.toContain('sk-secret');
  });
});
