import { describe, expect, it } from 'vitest'

import {
  createGuestLearner,
  createOfflineLearningPack,
  createOfflineSyncOperation,
  createStudyPlanFromOnboarding,
  createStudySessionFromPlan,
  dedupeOfflineSyncOperations,
  getQueuedOfflineSyncOperations,
  markOfflineSyncOperationFailed,
  markOfflineSyncOperationSynced,
} from '../src/index'

describe('offline sync domain', () => {
  it('builds a cached learning pack and keeps queued operations idempotent', () => {
    const now = '2026-06-14T00:00:00.000Z'
    const user = createGuestLearner({ now })
    const plan = createStudyPlanFromOnboarding({
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
      now,
    }).studyPlan
    const session = createStudySessionFromPlan({ plan, now })
    const pack = createOfflineLearningPack({ session, now })
    const operation = createOfflineSyncOperation({
      type: 'study_session_complete',
      userId: user.id,
      endpoint: `/api/v1/study-sessions/${session.id}/complete`,
      idempotencyKey: `complete-${user.id}`,
      payload: {
        sessionId: session.id,
        request: {
          userId: user.id,
          reviews: [{ wordId: 'word_shkola', answerQuality: 'good', responseMs: 4200 }],
        },
      },
      now: '2026-06-14T00:10:00.000Z',
    })
    const failed = markOfflineSyncOperationFailed({
      operation,
      error: '网络断开，等待恢复后同步。',
    })
    const synced = markOfflineSyncOperationSynced({
      operation: failed,
      syncedAt: '2026-06-14T00:12:00.000Z',
    })

    expect(pack).toMatchObject({
      id: `pack_${user.id}_book_pep_ru_g7_a_1`,
      expiresAt: '2026-06-17T00:00:00.000Z',
      wordCards: [{ lemma: 'школа' }],
    })
    expect(getQueuedOfflineSyncOperations([failed])).toEqual([failed])
    expect(
      dedupeOfflineSyncOperations([
        operation,
        {
          ...operation,
          id: 'offline_duplicate_should_be_removed',
          createdAt: '2026-06-14T00:11:00.000Z',
        },
      ]),
    ).toEqual([operation])
    expect(synced).toMatchObject({
      status: 'synced',
      retryCount: 1,
      lastError: null,
    })
  })
})
