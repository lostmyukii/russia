import { describe, expect, it } from 'vitest'

import {
  buildDashboardSummary,
  buildLeaderboardEntries,
  buildScoreEventsForStudyResult,
  completeStudySession,
  createCheckinRecord,
  createGuestLearner,
  createStudyPlanFromOnboarding,
  createStudySessionFromPlan,
} from '../src/index'

describe('leaderboard and check-in domain', () => {
  it('scores a completed study session, creates check-in streaks, and ranks daily/book entries', () => {
    const now = '2026-06-14T00:10:00.000Z'
    const user = createGuestLearner({ now: '2026-06-14T00:00:00.000Z' })
    const plan = createStudyPlanFromOnboarding({
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
      now,
    }).studyPlan
    const session = createStudySessionFromPlan({ plan, now })
    const result = completeStudySession({
      session,
      request: {
        userId: user.id,
        reviews: [
          { wordId: 'word_shkola', answerQuality: 'good', responseMs: 4200 },
          { wordId: 'word_klass', answerQuality: 'hard', responseMs: 7300 },
        ],
      },
      now,
    })
    const scoreEvents = buildScoreEventsForStudyResult({
      session,
      result,
      idempotencyKey: 'complete-guest',
    })
    const checkin = createCheckinRecord({
      userId: user.id,
      checkinDate: '2026-06-14',
      existingCheckins: [],
      now,
    })
    const entries = buildLeaderboardEntries({
      scope: 'daily',
      learners: [user],
      scoreEvents,
      checkins: [checkin],
      now,
    })
    const dashboard = buildDashboardSummary({
      userId: user.id,
      plan,
      results: [result],
      progressList: [],
      scoreEvents,
      checkins: [checkin],
      now,
    })

    expect(scoreEvents).toEqual([
      {
        id: 'score_complete-guest_mastered',
        userId: user.id,
        sessionId: session.id,
        wordId: null,
        bookId: 'book_pep_ru_g7_a',
        eventType: 'new_word_mastered',
        scoreDelta: 10,
        wordCount: 1,
        occurredAt: now,
        idempotencyKey: 'complete-guest',
      },
      {
        id: 'score_complete-guest_review',
        userId: user.id,
        sessionId: session.id,
        wordId: null,
        bookId: 'book_pep_ru_g7_a',
        eventType: 'review_completed',
        scoreDelta: 3,
        wordCount: 1,
        occurredAt: now,
        idempotencyKey: 'complete-guest',
      },
    ])
    expect(checkin).toMatchObject({
      checkinDate: '2026-06-14',
      streakDays: 1,
    })
    expect(entries).toMatchObject([
      {
        displayName: '访客学习者',
        score: 13,
        rank: 1,
        masteredWordCount: 1,
        streakDays: 1,
      },
    ])
    expect(
      buildLeaderboardEntries({
        scope: 'book',
        learners: [user],
        scoreEvents,
        checkins: [checkin],
        now,
        bookId: 'book_pep_ru_g7_a',
      }),
    ).toHaveLength(1)
    expect(dashboard).toMatchObject({
      todayRecitedWordCount: 2,
      todayMasteredWordCount: 1,
      scoreToday: 13,
      scoreWeek: 13,
      streakDays: 1,
    })
  })
})
