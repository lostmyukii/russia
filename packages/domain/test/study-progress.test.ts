import { describe, expect, it } from 'vitest'

import {
  buildTeacherProgressSummaries,
  completeStudySession,
  createGuestLearner,
  createRegisteredLearner,
  createStudyPlanFromOnboarding,
  createStudySessionFromPlan,
  createTeacherAccount,
} from '../src/index'

describe('study session and teacher progress domain', () => {
  it('creates a teacher account and a registered learner account', () => {
    expect(createTeacherAccount({ now: '2026-06-14T00:00:00.000Z' })).toEqual({
      id: 'teacher_demo_ru',
      displayName: '俄语老师',
      accountType: 'teacher',
      role: 'teacher',
      timezone: 'Asia/Shanghai',
      createdAt: '2026-06-14T00:00:00.000Z',
    })

    expect(createRegisteredLearner({ now: '2026-06-14T00:00:00.000Z' })).toEqual({
      id: 'learner_demo_20260614000000',
      displayName: '登录学习者',
      accountType: 'registered',
      role: 'learner',
      timezone: 'Asia/Shanghai',
      createdAt: '2026-06-14T00:00:00.000Z',
    })
  })

  it('generates a first study session with Russian word cards and recall prompts', () => {
    const plan = createStudyPlanFromOnboarding({
      userId: 'guest_20260614000000',
      preferences: {
        educationStage: 'junior',
        grade: 'g7',
        bookId: 'book_pep_ru_g7_a',
        unit: '1',
        dailyNewWordTarget: 2,
        reminderEnabled: true,
      },
      targetDate: null,
      now: '2026-06-14T00:00:00.000Z',
    }).studyPlan

    expect(createStudySessionFromPlan({ plan, now: '2026-06-14T00:00:00.000Z' })).toMatchObject({
      id: 'session_guest_20260614000000_book_pep_ru_g7_a_20260614',
      userId: 'guest_20260614000000',
      status: 'active',
      wordCards: [
        {
          lemma: 'школа',
          stressedLemma: 'шко́ла',
          definitionZh: '学校',
          grammarHint: '阴性名词',
        },
        {
          lemma: 'класс',
          definitionZh: '班级；教室',
          grammarHint: '阳性名词',
        },
      ],
      recallPrompts: [
        {
          promptType: 'ru_to_zh',
          question: 'школа',
          correctAnswer: '学校',
        },
        {
          promptType: 'ru_to_zh',
          question: 'класс',
          correctAnswer: '班级；教室',
        },
      ],
    })
  })

  it('summarizes guest and registered learner recitation progress for a teacher', () => {
    const guest = createGuestLearner({ now: '2026-06-14T00:00:00.000Z' })
    const registered = createRegisteredLearner({ now: '2026-06-14T00:01:00.000Z' })

    const guestPlan = createStudyPlanFromOnboarding({
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
      now: '2026-06-14T00:00:00.000Z',
    }).studyPlan
    const registeredPlan = createStudyPlanFromOnboarding({
      userId: registered.id,
      preferences: {
        educationStage: 'junior',
        grade: 'g7',
        bookId: 'book_pep_ru_g7_a',
        unit: '1',
        dailyNewWordTarget: 2,
        reminderEnabled: true,
      },
      targetDate: null,
      now: '2026-06-14T00:01:00.000Z',
    }).studyPlan
    const guestSession = createStudySessionFromPlan({
      plan: guestPlan,
      now: '2026-06-14T00:02:00.000Z',
    })
    const registeredSession = createStudySessionFromPlan({
      plan: registeredPlan,
      now: '2026-06-14T00:03:00.000Z',
    })

    const guestResult = completeStudySession({
      session: guestSession,
      request: {
        userId: guest.id,
        reviews: [
          { wordId: 'word_shkola', answerQuality: 'good', responseMs: 5200 },
          { wordId: 'word_klass', answerQuality: 'again', responseMs: 9000 },
        ],
      },
      now: '2026-06-14T00:05:00.000Z',
    })
    const registeredResult = completeStudySession({
      session: registeredSession,
      request: {
        userId: registered.id,
        reviews: [{ wordId: 'word_shkola', answerQuality: 'easy', responseMs: 3200 }],
      },
      now: '2026-06-14T00:06:00.000Z',
    })

    expect(
      buildTeacherProgressSummaries({
        learners: [guest, registered],
        plans: [guestPlan, registeredPlan],
        results: [guestResult, registeredResult],
      }),
    ).toEqual([
      {
        userId: registered.id,
        displayName: '登录学习者',
        accountType: 'registered',
        role: 'learner',
        bookName: '人教版初中俄语七年级上册',
        unit: '1',
        plannedWordCount: 2,
        recitedWordCount: 1,
        masteredWordCount: 1,
        correctRate: 1,
        lastStudiedAt: '2026-06-14T00:06:00.000Z',
      },
      {
        userId: guest.id,
        displayName: '访客学习者',
        accountType: 'guest',
        role: 'learner',
        bookName: '人教版初中俄语七年级上册',
        unit: '1',
        plannedWordCount: 2,
        recitedWordCount: 2,
        masteredWordCount: 1,
        correctRate: 0.5,
        lastStudiedAt: '2026-06-14T00:05:00.000Z',
      },
    ])
  })
})
