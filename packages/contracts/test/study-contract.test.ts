import { describe, expect, it } from 'vitest'

import {
  learnerProgressSummarySchema,
  studySessionCompleteRequestSchema,
  studySessionResultSchema,
  studySessionSchema,
  teacherUserSchema,
} from '../src/index'

describe('study and teacher progress contracts', () => {
  it('accepts a teacher account, study session, completion request, result, and progress row', () => {
    expect(
      teacherUserSchema.parse({
        id: 'teacher_demo_ru',
        displayName: '俄语老师',
        accountType: 'teacher',
        role: 'teacher',
        timezone: 'Asia/Shanghai',
        createdAt: '2026-06-14T00:00:00.000Z',
      }),
    ).toMatchObject({
      accountType: 'teacher',
      role: 'teacher',
    })

    expect(
      studySessionSchema.parse({
        id: 'session_guest_20260614000000_book_pep_ru_g7_a_20260614',
        userId: 'guest_20260614000000',
        planId: 'plan_guest_20260614000000_book_pep_ru_g7_a',
        vocabularyBookId: 'book_pep_ru_g7_a',
        unit: '1',
        status: 'active',
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
        createdAt: '2026-06-14T00:00:00.000Z',
      }),
    ).toMatchObject({
      status: 'active',
      wordCards: [{ lemma: 'школа' }],
    })

    expect(
      studySessionCompleteRequestSchema.parse({
        userId: 'guest_20260614000000',
        reviews: [
          {
            wordId: 'word_shkola',
            answerQuality: 'good',
            responseMs: 5200,
          },
        ],
      }),
    ).toMatchObject({
      reviews: [{ answerQuality: 'good' }],
    })

    expect(
      studySessionResultSchema.parse({
        sessionId: 'session_guest_20260614000000_book_pep_ru_g7_a_20260614',
        userId: 'guest_20260614000000',
        status: 'completed',
        studiedWordCount: 1,
        masteredWordCount: 1,
        correctRate: 1,
        completedAt: '2026-06-14T00:05:00.000Z',
      }),
    ).toMatchObject({
      status: 'completed',
      masteredWordCount: 1,
    })

    expect(
      learnerProgressSummarySchema.parse({
        userId: 'guest_20260614000000',
        displayName: '访客学习者',
        accountType: 'guest',
        role: 'learner',
        bookName: '人教版初中俄语七年级上册',
        unit: '1',
        plannedWordCount: 2,
        recitedWordCount: 1,
        masteredWordCount: 1,
        correctRate: 1,
        lastStudiedAt: '2026-06-14T00:05:00.000Z',
      }),
    ).toMatchObject({
      accountType: 'guest',
      recitedWordCount: 1,
    })
  })
})
