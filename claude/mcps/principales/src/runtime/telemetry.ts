export interface TelemetryEvent {
  run_id: string;
  lane: string;
  model: string;
  attempt: number;
  prompt_tokens: number;
  completion_tokens: number;
  cached_tokens: number;
  finish_reason: string;
  latency_ms: number;
  schema_status: 'ok' | 'failed';
  evidence_status: 'ok' | 'failed';
  retry_count: number;
  breaker_status: 'open' | 'closed';
}

export interface TelemetryDeps {
  stderr: { write: (s: string) => boolean };
  env: NodeJS.ProcessEnv;
}

const SECRET_ENV_KEYS = ['MOONSHOT_API_KEY'];

export function redactSecrets(text: string, env: Partial<NodeJS.ProcessEnv>): string {
  let out = text;
  for (const key of SECRET_ENV_KEYS) {
    const v = env[key];
    if (typeof v === 'string' && v.length > 0) {
      out = out.split(v).join('[REDACTED]');
    }
  }
  return out;
}

export function logTelemetry(event: TelemetryEvent, deps: TelemetryDeps): void {
  const line = JSON.stringify(event);
  const safe = redactSecrets(line, deps.env);
  deps.stderr.write(safe + '\n');
}
