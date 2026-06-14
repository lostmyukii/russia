export type RuntimeRateLimitOptions = {
  maxRequests?: number
  windowMs?: number
}

export function readRateLimitOptionsFromEnv(
  env: Record<string, string | undefined>,
): RuntimeRateLimitOptions {
  return {
    ...readPositiveIntegerEnv(env, 'RATE_LIMIT_MAX_REQUESTS', 'maxRequests'),
    ...readPositiveIntegerEnv(env, 'RATE_LIMIT_WINDOW_MS', 'windowMs'),
  }
}

function readPositiveIntegerEnv<TKey extends keyof RuntimeRateLimitOptions>(
  env: Record<string, string | undefined>,
  envKey: string,
  optionKey: TKey,
): Pick<RuntimeRateLimitOptions, TKey> | Record<string, never> {
  const parsedValue = Number.parseInt(env[envKey] ?? '', 10)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return {}
  }

  return {
    [optionKey]: parsedValue,
  } as Pick<RuntimeRateLimitOptions, TKey>
}
