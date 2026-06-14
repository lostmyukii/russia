import { describe, expect, it } from 'vitest'

import { healthResponseSchema } from '../src/index'

describe('health response contract', () => {
  it('accepts the stable API health payload', () => {
    expect(
      healthResponseSchema.parse({
        status: 'ok',
        service: 'russian-wordscodex-api',
      }),
    ).toEqual({
      status: 'ok',
      service: 'russian-wordscodex-api',
    })
  })
})
