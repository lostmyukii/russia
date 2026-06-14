import { describe, expect, it } from 'vitest'

import { buildApp } from '../src/app'

describe('health endpoint', () => {
  it('returns a stable Russian Wordscodex API health payload', async () => {
    const app = buildApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      status: 'ok',
      service: 'russian-wordscodex-api',
    })
  })
})
