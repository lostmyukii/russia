import { describe, expect, it } from 'vitest'

import {
  checkinRecordSchema,
  createCheckinRequestSchema,
  dashboardSummarySchema,
  leaderboardEntrySchema,
  leaderboardResponseSchema,
  leaderboardScopeSchema,
  studyScoreEventSchema,
} from '../src/index'

describe('leaderboard and check-in contracts', () => {
  it('validates check-in, score event, leaderboard and dashboard payloads', () => {
    const checkin = checkinRecordSchema.parse({
      id: 'checkin_guest_20260614_2026-06-14',
      userId: 'guest_20260614000000',
      checkinDate: '2026-06-14',
      streakDays: 1,
      completedAt: '2026-06-14T00:10:00.000Z',
    })

    const scoreEvent = studyScoreEventSchema.parse({
      id: 'score_complete-guest_20260614000000_mastered',
      userId: 'guest_20260614000000',
      sessionId: 'session_guest_20260614000000_book_pep_ru_g7_full_20260614',
      wordId: null,
      bookId: 'book_pep_ru_g7_full',
      eventType: 'new_word_mastered',
      scoreDelta: 10,
      wordCount: 1,
      occurredAt: '2026-06-14T00:10:00.000Z',
      idempotencyKey: 'complete-guest_20260614000000',
    })

    const entry = leaderboardEntrySchema.parse({
      scope: 'daily',
      userId: 'guest_20260614000000',
      displayName: '访客学习者',
      accountType: 'guest',
      score: 13,
      rank: 1,
      masteredWordCount: 1,
      reviewCompletionRate: 1,
      streakDays: checkin.streakDays,
      bookId: 'book_pep_ru_g7_full',
      classId: null,
      updatedAt: '2026-06-14T00:10:00.000Z',
    })

    expect(leaderboardScopeSchema.parse('book')).toBe('book')
    expect(
      leaderboardResponseSchema.parse({
        scope: 'daily',
        entries: [entry],
      }),
    ).toMatchObject({
      entries: [
        {
          score: 13,
          masteredWordCount: 1,
        },
      ],
    })
    expect(
      dashboardSummarySchema.parse({
        userId: 'guest_20260614000000',
        todayRecitedWordCount: 2,
        todayMasteredWordCount: 1,
        dueReviewCount: 0,
        mistakeWordCount: 1,
        streakDays: 1,
        scoreToday: 13,
        scoreWeek: 13,
        recentTrend: [
          {
            date: '2026-06-14',
            score: scoreEvent.scoreDelta,
            masteredWordCount: scoreEvent.wordCount,
            checkedIn: true,
          },
        ],
      }),
    ).toMatchObject({
      scoreToday: 13,
      recentTrend: [{ checkedIn: true }],
    })
  })

  it('validates check-in requests', () => {
    expect(
      createCheckinRequestSchema.parse({
        userId: 'guest_20260614000000',
        checkinDate: '2026-06-14',
      }),
    ).toEqual({
      userId: 'guest_20260614000000',
      checkinDate: '2026-06-14',
    })
  })
})
