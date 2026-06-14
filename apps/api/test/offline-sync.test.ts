import { describe, expect, it } from 'vitest'

import {
  guestUserSchema,
  leaderboardResponseSchema,
  offlineSyncResponseSchema,
  studySessionSchema,
} from '@russian-wordscodex/contracts'

import { buildApp } from '../src/app'

describe('offline sync API', () => {
  it('syncs queued study completion operations once by idempotency key', async () => {
    const app = buildApp()
    const guestResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/guest',
    })
    const guestPayload: unknown = guestResponse.json()
    const user = guestUserSchema.parse((guestPayload as { user: unknown }).user)

    const planResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/study-plans',
      payload: {
        userId: user.id,
        preferences: {
          educationStage: 'junior',
          grade: 'g7',
          bookId: 'book_pep_ru_g7_a',
          unit: '1',
          dailyNewWordTarget: 1,
          reminderEnabled: true,
        },
        targetDate: null,
      },
    })
    expect(planResponse.statusCode).toBe(200)

    const sessionResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/study-sessions',
      payload: { userId: user.id },
    })
    const sessionPayload: unknown = sessionResponse.json()
    const session = studySessionSchema.parse(
      (sessionPayload as { studySession: unknown }).studySession,
    )
    const operation = {
      id: `offline_complete-${user.id}`,
      type: 'study_session_complete',
      userId: user.id,
      endpoint: `/api/v1/study-sessions/${session.id}/complete`,
      method: 'POST',
      idempotencyKey: `complete-${user.id}`,
      payload: {
        sessionId: session.id,
        request: {
          userId: user.id,
          reviews: [{ wordId: 'word_shkola', answerQuality: 'good', responseMs: 4200 }],
        },
      },
      status: 'queued',
      retryCount: 0,
      createdAt: '2026-06-14T00:10:00.000Z',
      lastError: null,
    }

    const firstSync = await app.inject({
      method: 'POST',
      url: '/api/v1/offline/sync',
      payload: { operations: [operation] },
    })
    const secondSync = await app.inject({
      method: 'POST',
      url: '/api/v1/offline/sync',
      payload: { operations: [operation] },
    })
    const leaderboardResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/leaderboard?scope=daily&now=2026-06-14T23:00:00.000Z',
    })

    expect(firstSync.statusCode).toBe(200)
    expect(secondSync.statusCode).toBe(200)
    expect(offlineSyncResponseSchema.parse(firstSync.json())).toMatchObject({
      syncedCount: 1,
      failedCount: 0,
      results: [{ status: 'synced', idempotencyKey: `complete-${user.id}` }],
    })
    expect(offlineSyncResponseSchema.parse(secondSync.json())).toMatchObject({
      syncedCount: 1,
      failedCount: 0,
      results: [{ status: 'synced', idempotencyKey: `complete-${user.id}` }],
    })
    expect(leaderboardResponseSchema.parse(leaderboardResponse.json()).entries).toMatchObject([
      {
        userId: user.id,
        score: 10,
      },
    ])
  })
})
