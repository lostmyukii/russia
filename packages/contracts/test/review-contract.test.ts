import { describe, expect, it } from 'vitest'

import { mistakeEntrySchema, reviewQueueItemSchema, userWordProgressSchema } from '../src/index'

describe('review and mistake contracts', () => {
  it('accepts user word progress, due review queue items, and mistake entries', () => {
    expect(
      userWordProgressSchema.parse({
        userId: 'guest_20260614000000',
        wordId: 'word_klass',
        masteryState: 'mistake',
        repetitions: 1,
        consecutiveCorrect: 0,
        correctCount: 0,
        incorrectCount: 1,
        easeFactor: 2.3,
        intervalDays: 0,
        lastReviewedAt: '2026-06-14T00:00:00.000Z',
        nextReviewAt: '2026-06-14T00:10:00.000Z',
        averageResponseMs: 9000,
        lastErrorType: 'meaning',
        updatedAt: '2026-06-14T00:00:00.000Z',
      }),
    ).toMatchObject({
      masteryState: 'mistake',
      lastErrorType: 'meaning',
    })

    expect(
      reviewQueueItemSchema.parse({
        userId: 'guest_20260614000000',
        wordId: 'word_klass',
        lemma: 'класс',
        definitionZh: '班级；教室',
        masteryState: 'mistake',
        nextReviewAt: '2026-06-14T00:10:00.000Z',
        priority: 'mistake',
      }),
    ).toMatchObject({
      priority: 'mistake',
      lemma: 'класс',
    })

    expect(
      mistakeEntrySchema.parse({
        userId: 'guest_20260614000000',
        wordId: 'word_klass',
        lemma: 'класс',
        definitionZh: '班级；教室',
        lastErrorType: 'meaning',
        consecutiveCorrect: 0,
        requiredCorrectCount: 3,
        nextReviewAt: '2026-06-14T00:10:00.000Z',
      }),
    ).toMatchObject({
      requiredCorrectCount: 3,
      lastErrorType: 'meaning',
    })
  })
})
