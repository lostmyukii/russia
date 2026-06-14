import { describe, expect, it } from 'vitest'

import {
  offlineLearningPackSchema,
  offlineStudySessionCompletePayloadSchema,
  offlineSyncOperationSchema,
  offlineSyncRequestSchema,
  offlineSyncResponseSchema,
} from '../src/index'

describe('offline sync contracts', () => {
  it('validates cached learning packs, queued operations and sync results', () => {
    const payload = offlineStudySessionCompletePayloadSchema.parse({
      sessionId: 'session_guest_20260614000000_book_pep_ru_g7_full_20260614',
      request: {
        userId: 'guest_20260614000000',
        reviews: [{ wordId: 'word_shkola', answerQuality: 'good', responseMs: 4200 }],
      },
    })

    const operation = offlineSyncOperationSchema.parse({
      id: 'offline_complete-guest_20260614000000',
      type: 'study_session_complete',
      userId: 'guest_20260614000000',
      endpoint:
        '/api/v1/study-sessions/session_guest_20260614000000_book_pep_ru_g7_full_20260614/complete',
      method: 'POST',
      idempotencyKey: 'complete-guest_20260614000000',
      payload,
      status: 'queued',
      retryCount: 0,
      createdAt: '2026-06-14T00:10:00.000Z',
      lastError: null,
    })

    expect(
      offlineLearningPackSchema.parse({
        id: 'pack_guest_20260614000000_book_pep_ru_g7_full_1',
        userId: 'guest_20260614000000',
        vocabularyBookId: 'book_pep_ru_g7_full',
        unit: '1',
        sessionId: payload.sessionId,
        wordCards: [
          {
            wordId: 'word_shkola',
            lemma: 'школа',
            stressedLemma: 'шко́ла',
            partOfSpeech: 'noun',
            definitionZh: '学校',
            grammarHint: '阴性名词',
            exampleRu: 'Это моя школа.',
            exampleZh: '这是我的学校。',
          },
        ],
        recallPrompts: [
          {
            id: 'prompt_word_shkola_meaning',
            wordId: 'word_shkola',
            promptType: 'ru_to_zh',
            question: 'школа',
            correctAnswer: '学校',
          },
        ],
        cachedAt: '2026-06-14T00:00:00.000Z',
        expiresAt: '2026-06-17T00:00:00.000Z',
      }),
    ).toMatchObject({
      vocabularyBookId: 'book_pep_ru_g7_full',
      unit: '1',
    })
    expect(offlineSyncRequestSchema.parse({ operations: [operation] })).toMatchObject({
      operations: [{ idempotencyKey: 'complete-guest_20260614000000' }],
    })
    expect(
      offlineSyncResponseSchema.parse({
        syncedCount: 1,
        failedCount: 0,
        results: [
          {
            operationId: operation.id,
            idempotencyKey: operation.idempotencyKey,
            status: 'synced',
            retryCount: 0,
            syncedAt: '2026-06-14T00:12:00.000Z',
            error: null,
          },
        ],
      }),
    ).toMatchObject({
      syncedCount: 1,
      failedCount: 0,
    })
  })
})
