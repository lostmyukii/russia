import { describe, expect, it } from 'vitest'

import { readRateLimitOptionsFromEnv } from '../src/runtime-config'

describe('runtime config', () => {
  it('reads rate limit options from environment variables', () => {
    expect(
      readRateLimitOptionsFromEnv({
        RATE_LIMIT_MAX_REQUESTS: '45',
        RATE_LIMIT_WINDOW_MS: '30000',
      }),
    ).toEqual({
      maxRequests: 45,
      windowMs: 30_000,
    })
  })

  it('ignores invalid rate limit environment variables', () => {
    expect(
      readRateLimitOptionsFromEnv({
        RATE_LIMIT_MAX_REQUESTS: '0',
        RATE_LIMIT_WINDOW_MS: '-1',
      }),
    ).toEqual({})
  })
})
