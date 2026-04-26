export interface ScrubbableRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  top_p?: number;
  n?: number;
  functions?: unknown;
  tool_choice?: unknown;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  stream?: boolean;
  response_format?: unknown;
  // Spec Section 1 stable cache + identity fields. The scrubber preserves them so the
  // wrapper's iteration-1 cache-key work survives the strip pass.
  prompt_cache_key?: string;
  safety_identifier?: string;
  [k: string]: unknown;
}

export interface ScrubbedRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  max_completion_tokens?: number;
  stream?: boolean;
  response_format?: unknown;
  prompt_cache_key?: string;
  safety_identifier?: string;
}

const STRIP_KEYS = new Set([
  'temperature',
  'top_p',
  'n',
  'functions',
  'tool_choice',
  'frequency_penalty',
  'presence_penalty',
]);

export function scrubParameters(req: ScrubbableRequest): ScrubbedRequest {
  const out: ScrubbedRequest = {
    model: req.model,
    messages: req.messages,
  };

  if (req.max_completion_tokens !== undefined) {
    out.max_completion_tokens = req.max_completion_tokens;
  } else if (req.max_tokens !== undefined) {
    out.max_completion_tokens = req.max_tokens;
  }

  if (req.stream !== undefined) out.stream = req.stream;
  if (req.response_format !== undefined) out.response_format = req.response_format;

  // Preserve the cache + identity fields. Without this, Iteration-1's prompt_cache_key and
  // safety_identifier work would be silently neutralized at this layer.
  if (req.prompt_cache_key !== undefined) out.prompt_cache_key = req.prompt_cache_key;
  if (req.safety_identifier !== undefined) out.safety_identifier = req.safety_identifier;

  // Anything in STRIP_KEYS is dropped by omission. Other unknown keys also drop.
  return out;
}
