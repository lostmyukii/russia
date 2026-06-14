import { describe, expect, it } from 'vitest'

import { createGuestLearner, createStudyPlanFromOnboarding } from '../src/index'

describe('guest onboarding domain', () => {
  it('creates a guest learner with the learner role and local timezone', () => {
    expect(createGuestLearner({ now: '2026-06-14T00:00:00.000Z' })).toEqual({
      id: 'guest_20260614000000',
      displayName: '访客学习者',
      accountType: 'guest',
      role: 'learner',
      timezone: 'Asia/Shanghai',
      createdAt: '2026-06-14T00:00:00.000Z',
    })
  })

  it('generates an active plan from selected PEP book and unit', () => {
    const result = createStudyPlanFromOnboarding({
      userId: 'guest_20260614000000',
      preferences: {
        educationStage: 'junior',
        grade: 'g7',
        bookId: 'book_pep_ru_g7_full',
        unit: '1',
        dailyNewWordTarget: 1,
        reminderEnabled: true,
      },
      targetDate: null,
      now: '2026-06-14T00:00:00.000Z',
    })

    expect(result).toEqual({
      userPreferences: {
        educationStage: 'junior',
        grade: 'g7',
        bookId: 'book_pep_ru_g7_full',
        unit: '1',
        dailyNewWordTarget: 1,
        reminderEnabled: true,
      },
      studyPlan: {
        id: 'plan_guest_20260614000000_book_pep_ru_g7_full',
        userId: 'guest_20260614000000',
        vocabularyBookId: 'book_pep_ru_g7_full',
        unit: '1',
        dailyNewWordTarget: 1,
        dailyReviewLimit: 30,
        targetDate: null,
        estimatedCompletionDate: '2026-07-14',
        status: 'active',
        startedAt: '2026-06-14T00:00:00.000Z',
      },
    })
  })

  it('rejects onboarding when the selected unit does not belong to the selected book', () => {
    expect(() =>
      createStudyPlanFromOnboarding({
        userId: 'guest_20260614000000',
        preferences: {
          educationStage: 'junior',
          grade: 'g7',
          bookId: 'book_pep_ru_g7_full',
          unit: '99',
          dailyNewWordTarget: 10,
          reminderEnabled: false,
        },
        targetDate: null,
        now: '2026-06-14T00:00:00.000Z',
      }),
    ).toThrow('所选单元不属于当前人教版俄语册别')
  })
})
