import { describe, expect, it } from 'vitest'

import {
  buildLaunchReadinessReport,
  createMvpLaunchReadinessChecks,
  redactSensitiveLogPayload,
} from '../src/index'

describe('launch readiness domain', () => {
  it('builds a release report that is ready only when every check is ready', () => {
    const checks = createMvpLaunchReadinessChecks()
    const readyReport = buildLaunchReadinessReport({
      checks,
      generatedAt: '2026-06-14T00:00:00.000Z',
    })
    const firstCheck = checks[0]

    expect(firstCheck).toBeDefined()

    if (!firstCheck) {
      throw new Error('MVP launch readiness checks must include at least one item')
    }

    const blockedReport = buildLaunchReadinessReport({
      checks: [{ ...firstCheck, status: 'needs_attention' }],
      generatedAt: '2026-06-14T00:00:00.000Z',
    })

    expect(readyReport.overallStatus).toBe('ready')
    expect(blockedReport.overallStatus).toBe('needs_attention')
    expect(new Set(readyReport.checks.map((check) => check.category))).toEqual(
      new Set(['security', 'privacy', 'performance', 'accessibility', 'content', 'backup', 'e2e']),
    )
  })

  it('redacts sensitive fields before structured logs are emitted', () => {
    const redacted = redactSensitiveLogPayload({
      displayName: '游客学习者',
      email: 'student@example.com',
      authorization: 'Bearer secret-token',
      profile: {
        phone: '13800000000',
        targetBook: '七年级全一册',
      },
    })

    expect(redacted).toEqual({
      displayName: '游客学习者',
      email: '[REDACTED]',
      authorization: '[REDACTED]',
      profile: {
        phone: '[REDACTED]',
        targetBook: '七年级全一册',
      },
    })
  })
})
