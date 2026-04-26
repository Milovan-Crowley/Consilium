import { describe, it, expect } from 'vitest';
import { createHealth } from '../src/tools/health.js';
import { createMode } from '../src/tools/mode.js';

describe('health tool', () => {
  it('reports moonshot reachable, budget, queue, breaker', async () => {
    const tool = createHealth({
      probe: async () => true,
      budget: { remaining: () => 4.5, breakerOpen: () => false, charge: () => {}, spent_usd: () => 0.5 },
      queueDepth: () => 2,
    });
    const out = await tool();
    expect(out.moonshot_reachable).toBe(true);
    expect(out.budget_remaining_usd).toBe(4.5);
    expect(out.queue_depth).toBe(2);
    expect(out.breaker_state).toBe('closed');
  });

  it('reports breaker_state=open when budget breaker is tripped', async () => {
    const tool = createHealth({
      probe: async () => true,
      budget: { remaining: () => 0, breakerOpen: () => true, charge: () => {}, spent_usd: () => 6 },
      queueDepth: () => 0,
    });
    const out = await tool();
    expect(out.breaker_state).toBe('open');
  });
});

describe('mode tool', () => {
  it('returns CONSILIUM_VERIFICATION_MODE verbatim from env', async () => {
    const tool = createMode({ env: { CONSILIUM_VERIFICATION_MODE: 'principales' } });
    expect(await tool()).toBe('principales');
  });

  it('returns "classic" when env is unset', async () => {
    const tool = createMode({ env: {} });
    expect(await tool()).toBe('classic');
  });
});
