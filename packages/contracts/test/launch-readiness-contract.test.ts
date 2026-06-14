import { describe, expect, it } from 'vitest'

import { launchReadinessCheckSchema, launchReadinessReportSchema } from '../src/index'

describe('launch readiness contracts', () => {
  it('validates launch readiness checks and reports', () => {
    const check = launchReadinessCheckSchema.parse({
      id: 'security_headers',
      category: 'security',
      title: '安全响应头',
      status: 'ready',
      evidence: 'API 响应包含 nosniff、DENY 和隐私权限策略。',
    })
    const report = launchReadinessReportSchema.parse({
      generatedAt: '2026-06-14T00:00:00.000Z',
      overallStatus: 'ready',
      checks: [check],
    })

    expect(report).toMatchObject({
      overallStatus: 'ready',
      checks: [{ id: 'security_headers', category: 'security' }],
    })
    expect(() =>
      launchReadinessReportSchema.parse({
        generatedAt: '2026-06-14T00:00:00.000Z',
        overallStatus: 'ready',
        checks: [],
      }),
    ).toThrow()
  })
})
