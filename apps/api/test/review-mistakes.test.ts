import { describe, expect, it } from 'vitest'

import {
  guestUserSchema,
  mistakeEntrySchema,
  studySessionSchema,
} from '@russian-wordscodex/contracts'

import { buildApp } from '../src/app'

describe('review and mistakes API', () => {
  it('updates SRS progress, returns due mistakes, and clears a mistake after elimination', async () => {
    const app = buildApp()

    const guestResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/guest',
    })
    const guestPayload: unknown = guestResponse.json()
    const guest = guestUserSchema.parse((guestPayload as { user: unknown }).user)

    await app.inject({
      method: 'POST',
      url: '/api/v1/study-plans',
      payload: {
        userId: guest.id,
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

    const sessionResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/study-sessions',
      payload: { userId: guest.id },
    })
    const sessionPayload: unknown = sessionResponse.json()
    const session = studySessionSchema.parse(
      (sessionPayload as { studySession: unknown }).studySession,
    )
    const sessionId = session.id

    const completeResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/study-sessions/${sessionId}/complete`,
      headers: {
        'Idempotency-Key': 'step-5-complete-session',
      },
      payload: {
        userId: guest.id,
        reviews: [
          { wordId: 'word_shkola', answerQuality: 'good', responseMs: 5200 },
          { wordId: 'word_klass', answerQuality: 'again', responseMs: 9000, errorType: 'meaning' },
        ],
      },
    })

    expect(completeResponse.statusCode).toBe(200)

    const mistakesResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/mistakes?userId=${guest.id}`,
    })
    expect(mistakesResponse.statusCode).toBe(200)
    const mistakePayload: unknown = mistakesResponse.json()
    const mistake = mistakeEntrySchema.parse(
      (mistakePayload as { mistakes: unknown[] }).mistakes[0],
    )
    expect(mistake).toMatchObject({
      wordId: 'word_klass',
      lemma: 'класс',
      lastErrorType: 'meaning',
    })

    const queueResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/review/queue?userId=${guest.id}&now=${encodeURIComponent(
        mistake.nextReviewAt,
      )}`,
    })
    expect(queueResponse.statusCode).toBe(200)
    expect(queueResponse.json()).toMatchObject({
      queue: [
        {
          wordId: 'word_klass',
          priority: 'mistake',
        },
      ],
    })

    const eliminationResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/mistakes/session',
      headers: {
        'Idempotency-Key': 'step-5-eliminate-mistake',
      },
      payload: {
        userId: guest.id,
        wordId: 'word_klass',
        responseMsList: [4300, 4100, 3900],
      },
    })
    expect(eliminationResponse.statusCode).toBe(200)
    expect(eliminationResponse.json()).toMatchObject({
      progress: {
        wordId: 'word_klass',
        masteryState: 'learning',
        consecutiveCorrect: 3,
        lastErrorType: null,
      },
    })

    const afterEliminationResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/mistakes?userId=${guest.id}`,
    })
    expect(afterEliminationResponse.json()).toEqual({ mistakes: [] })
  })
})
