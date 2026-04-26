import type { FailureClass } from '../pipeline/retry-mapper.js';

export interface MoonshotRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  max_completion_tokens?: number;
  stream?: boolean;
  response_format?: unknown;
  // OpenAI prompt-caching + identity discipline. Spec Section 1.
  // Forwarded to Moonshot's OpenAI-compatible endpoint; if unsupported it is silently ignored,
  // so the spec invariant of "stable cache keys" is honored regardless of upstream support.
  prompt_cache_key?: string;
  safety_identifier?: string;
}

export interface MoonshotSuccess {
  ok: true;
  content: string;
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'error';
  prompt_tokens: number;
  completion_tokens: number;
  cached_tokens?: number;
  attempts: number;
}

export interface MoonshotFailure {
  ok: false;
  failure_class: FailureClass;
  message: string;
  attempts: number;
}

export type MoonshotResult = MoonshotSuccess | MoonshotFailure;
export type { FailureClass };
