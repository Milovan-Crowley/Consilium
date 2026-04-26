export interface HealthDeps {
  probe: () => Promise<boolean>;
  budget: { remaining: () => number; breakerOpen: () => boolean; charge: (usd: number) => void; spent_usd: () => number };
  queueDepth: () => number;
}

export interface HealthOutput {
  moonshot_reachable: boolean;
  budget_remaining_usd: number;
  queue_depth: number;
  breaker_state: 'open' | 'closed';
}

export function createHealth(deps: HealthDeps) {
  return async (): Promise<HealthOutput> => ({
    moonshot_reachable: await deps.probe(),
    budget_remaining_usd: deps.budget.remaining(),
    queue_depth: deps.queueDepth(),
    breaker_state: deps.budget.breakerOpen() ? 'open' : 'closed',
  });
}
