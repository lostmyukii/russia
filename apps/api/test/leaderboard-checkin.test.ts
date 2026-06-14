import { describe, expect, it } from 'vitest'

import {
  checkinRecordSchema,
  dashboardSummarySchema,
  guestUserSchema,
  leaderboardResponseSchema,
  studySessionSchema,
} from '@russian-wordscodex/contracts'

import { buildApp } from '../src/app'

describe('leaderboard and check-in API', () => {
  it('updates effective score after study completion, then returns check-in, leaderboard and dashboard', async () => {
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
          dailyNewWordTarget: 2,
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
    const completeResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/study-sessions/${session.id}/complete`,
      headers: {
        'Idempotency-Key': `complete-${user.id}`,
      },
      payload: {
        userId: user.id,
        reviews: [
          { wordId: 'word_shkola', answerQuality: 'good', responseMs: 4200 },
          { wordId: 'word_klass', answerQuality: 'hard', responseMs: 7300 },
        ],
      },
    })
    expect(completeResponse.statusCode).toBe(200)

    const checkinResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/checkins',
      headers: {
        'Idempotency-Key': `checkin-${user.id}`,
      },
      payload: {
        userId: user.id,
        checkinDate: '2026-06-14',
      },
    })
    const checkinPayload: unknown = checkinResponse.json()
    const checkin = checkinRecordSchema.parse((checkinPayload as { checkin: unknown }).checkin)
    expect(checkinResponse.statusCode).toBe(200)
    expect(checkin.streakDays).toBe(1)

    const leaderboardResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/leaderboard?scope=daily&now=2026-06-14T23:00:00.000Z',
    })
    const leaderboardPayload: unknown = leaderboardResponse.json()
    const leaderboard = leaderboardResponseSchema.parse(leaderboardPayload)
    expect(leaderboardResponse.statusCode).toBe(200)
    expect(leaderboard.entries).toMatchObject([
      {
        userId: user.id,
        score: 13,
        rank: 1,
        streakDays: 1,
      },
    ])

    const dashboardResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/dashboard/summary?userId=${user.id}&now=2026-06-14T23:00:00.000Z`,
    })
    const dashboardPayload: unknown = dashboardResponse.json()
    const dashboard = dashboardSummarySchema.parse(
      (dashboardPayload as { summary: unknown }).summary,
    )
    expect(dashboardResponse.statusCode).toBe(200)
    expect(dashboard).toMatchObject({
      todayRecitedWordCount: 2,
      todayMasteredWordCount: 1,
      scoreToday: 13,
      streakDays: 1,
    })
  })
})
