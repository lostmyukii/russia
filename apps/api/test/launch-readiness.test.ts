import { describe, expect, it } from 'vitest'

import { launchReadinessReportSchema } from '@russian-wordscodex/contracts'

import { buildApp } from '../src/app'

describe('launch readiness API', () => {
  it('adds security headers to API responses', async () => {
    const app = buildApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    })

    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['x-frame-options']).toBe('DENY')
    expect(response.headers['referrer-policy']).toBe('no-referrer')
    expect(response.headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()')
  })

  it('rate limits repeated write requests', async () => {
    const app = buildApp({
      rateLimit: {
        maxRequests: 2,
        windowMs: 60_000,
      },
    })

    await app.inject({ method: 'POST', url: '/api/v1/auth/guest' })
    await app.inject({ method: 'POST', url: '/api/v1/auth/guest' })
    const limitedResponse = await app.inject({ method: 'POST', url: '/api/v1/auth/guest' })

    expect(limitedResponse.statusCode).toBe(429)
    expect(limitedResponse.headers['retry-after']).toBe('60')
    expect(limitedResponse.json()).toMatchObject({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '请求过于频繁，请稍后再试。',
      },
    })
  })

  it('returns an MVP launch readiness report', async () => {
    const app = buildApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/ops/readiness',
    })
    const report = launchReadinessReportSchema.parse(response.json())

    expect(response.statusCode).toBe(200)
    expect(report.overallStatus).toBe('ready')
    expect(report.checks.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        'security_headers',
        'write_rate_limit',
        'log_redaction',
        'content_source_validation',
        'backup_restore_runbook',
        'staging_e2e',
      ]),
    )
  })
})
