import { describe, expect, it } from 'vitest'

import {
  applyMistakeEliminationReview,
  applySrsReview,
  buildMistakeEntries,
  createInitialWordProgress,
  getDueReviewQueue,
} from '../src/index'

const FIRST_UNIT_WORD_ID = 'word_g7_5762776de4d9'
const SECOND_UNIT_WORD_ID = 'word_g7_baea78ac8b17'

describe('SRS review and mistakes domain', () => {
  it('moves an incorrect answer into the mistake queue with a 10 minute review', () => {
    const initial = createInitialWordProgress({
      userId: 'guest_20260614000000',
      wordId: SECOND_UNIT_WORD_ID,
      now: '2026-06-14T00:00:00.000Z',
    })

    expect(
      applySrsReview({
        previous: initial,
        answerQuality: 'again',
        responseMs: 9000,
        errorType: 'meaning',
        now: '2026-06-14T00:00:00.000Z',
      }),
    ).toEqual({
      userId: 'guest_20260614000000',
      wordId: SECOND_UNIT_WORD_ID,
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
    })
  })

  it('calculates SRS intervals for hard, good, and easy answers', () => {
    const initial = createInitialWordProgress({
      userId: 'guest_20260614000000',
      wordId: FIRST_UNIT_WORD_ID,
      now: '2026-06-14T00:00:00.000Z',
    })

    expect(
      applySrsReview({
        previous: initial,
        answerQuality: 'hard',
        responseMs: 8500,
        errorType: null,
        now: '2026-06-14T00:00:00.000Z',
      }),
    ).toMatchObject({
      masteryState: 'fuzzy',
      intervalDays: 1,
      nextReviewAt: '2026-06-15T00:00:00.000Z',
    })

    expect(
      applySrsReview({
        previous: initial,
        answerQuality: 'good',
        responseMs: 5200,
        errorType: null,
        now: '2026-06-14T00:00:00.000Z',
      }),
    ).toMatchObject({
      masteryState: 'learning',
      intervalDays: 2,
      nextReviewAt: '2026-06-16T00:00:00.000Z',
    })

    expect(
      applySrsReview({
        previous: initial,
        answerQuality: 'easy',
        responseMs: 2800,
        errorType: null,
        now: '2026-06-14T00:00:00.000Z',
      }),
    ).toMatchObject({
      masteryState: 'mastered',
      intervalDays: 4,
      nextReviewAt: '2026-06-18T00:00:00.000Z',
    })
  })

  it('prioritizes due mistakes before ordinary due reviews', () => {
    const dueMistake = applySrsReview({
      previous: createInitialWordProgress({
        userId: 'guest_20260614000000',
        wordId: SECOND_UNIT_WORD_ID,
        now: '2026-06-14T00:00:00.000Z',
      }),
      answerQuality: 'again',
      responseMs: 9000,
      errorType: 'meaning',
      now: '2026-06-14T00:00:00.000Z',
    })
    const ordinaryReview = applySrsReview({
      previous: createInitialWordProgress({
        userId: 'guest_20260614000000',
        wordId: FIRST_UNIT_WORD_ID,
        now: '2026-06-12T00:00:00.000Z',
      }),
      answerQuality: 'good',
      responseMs: 5200,
      errorType: null,
      now: '2026-06-12T00:00:00.000Z',
    })

    expect(
      getDueReviewQueue({
        progressList: [ordinaryReview, dueMistake],
        now: '2026-06-14T00:20:00.000Z',
      }),
    ).toEqual([
      {
        userId: 'guest_20260614000000',
        wordId: SECOND_UNIT_WORD_ID,
        lemma: 'дом',
        definitionZh: '房子；家',
        masteryState: 'mistake',
        nextReviewAt: '2026-06-14T00:10:00.000Z',
        priority: 'mistake',
      },
      {
        userId: 'guest_20260614000000',
        wordId: FIRST_UNIT_WORD_ID,
        lemma: 'а',
        definitionZh: '而；可是',
        masteryState: 'learning',
        nextReviewAt: '2026-06-14T00:00:00.000Z',
        priority: 'due',
      },
    ])
  })

  it('removes a mistake after three consecutive correct elimination reviews', () => {
    const mistake = applySrsReview({
      previous: createInitialWordProgress({
        userId: 'guest_20260614000000',
        wordId: SECOND_UNIT_WORD_ID,
        now: '2026-06-14T00:00:00.000Z',
      }),
      answerQuality: 'again',
      responseMs: 9000,
      errorType: 'meaning',
      now: '2026-06-14T00:00:00.000Z',
    })

    const once = applyMistakeEliminationReview({
      previous: mistake,
      responseMs: 4300,
      now: '2026-06-14T00:10:00.000Z',
    })
    const twice = applyMistakeEliminationReview({
      previous: once,
      responseMs: 4100,
      now: '2026-06-14T00:11:00.000Z',
    })
    const resolved = applyMistakeEliminationReview({
      previous: twice,
      responseMs: 3900,
      now: '2026-06-14T00:12:00.000Z',
    })

    expect(buildMistakeEntries({ progressList: [mistake] })).toHaveLength(1)
    expect(resolved).toMatchObject({
      masteryState: 'learning',
      consecutiveCorrect: 3,
      correctCount: 3,
      incorrectCount: 1,
      lastErrorType: null,
      nextReviewAt: '2026-06-16T00:12:00.000Z',
    })
    expect(buildMistakeEntries({ progressList: [resolved] })).toEqual([])
  })
})
