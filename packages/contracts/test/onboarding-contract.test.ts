import { describe, expect, it } from 'vitest'

import {
  guestUserSchema,
  onboardingRequestSchema,
  studyPlanSchema,
  userPreferencesSchema,
} from '../src/index'

describe('onboarding contracts', () => {
  it('accepts a guest learner, onboarding request, preferences, and generated study plan', () => {
    expect(
      guestUserSchema.parse({
        id: 'guest_20260614',
        displayName: '访客学习者',
        accountType: 'guest',
        role: 'learner',
        timezone: 'Asia/Shanghai',
        createdAt: '2026-06-14T00:00:00.000Z',
      }),
    ).toMatchObject({
      accountType: 'guest',
      role: 'learner',
    })

    expect(
      userPreferencesSchema.parse({
        educationStage: 'junior',
        grade: 'g7',
        bookId: 'book_pep_ru_g7_a',
        unit: '1',
        dailyNewWordTarget: 10,
        reminderEnabled: true,
      }),
    ).toMatchObject({
      educationStage: 'junior',
      unit: '1',
    })

    expect(
      onboardingRequestSchema.parse({
        userId: 'guest_20260614',
        preferences: {
          educationStage: 'junior',
          grade: 'g7',
          bookId: 'book_pep_ru_g7_a',
          unit: '1',
          dailyNewWordTarget: 10,
          reminderEnabled: true,
        },
        targetDate: '2026-07-01',
      }),
    ).toMatchObject({
      userId: 'guest_20260614',
      targetDate: '2026-07-01',
    })

    expect(
      studyPlanSchema.parse({
        id: 'plan_guest_20260614_book_pep_ru_g7_a',
        userId: 'guest_20260614',
        vocabularyBookId: 'book_pep_ru_g7_a',
        unit: '1',
        dailyNewWordTarget: 10,
        dailyReviewLimit: 30,
        targetDate: '2026-07-01',
        estimatedCompletionDate: '2026-06-15',
        status: 'active',
        startedAt: '2026-06-14T00:00:00.000Z',
      }),
    ).toMatchObject({
      status: 'active',
      dailyNewWordTarget: 10,
    })
  })
})
