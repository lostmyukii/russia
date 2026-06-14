import { describe, expect, it } from 'vitest'

import { guestUserSchema } from '@russian-wordscodex/contracts'

import { buildApp } from '../src/app'

describe('guest onboarding API', () => {
  it('creates a guest user and active study plan', async () => {
    const app = buildApp()

    const guestResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/guest',
    })

    expect(guestResponse.statusCode).toBe(200)
    expect(guestResponse.json()).toMatchObject({
      user: {
        accountType: 'guest',
        displayName: '访客学习者',
        role: 'learner',
      },
    })

    const guestPayload: unknown = guestResponse.json()
    const user = guestUserSchema.parse((guestPayload as { user: unknown }).user)
    const userId = user.id
    const planResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/study-plans',
      payload: {
        userId,
        preferences: {
          educationStage: 'junior',
          grade: 'g7',
          bookId: 'book_pep_ru_g7_a',
          unit: '1',
          dailyNewWordTarget: 1,
          reminderEnabled: true,
        },
        targetDate: null,
      },
    })

    expect(planResponse.statusCode).toBe(200)
    expect(planResponse.json()).toMatchObject({
      studyPlan: {
        userId,
        vocabularyBookId: 'book_pep_ru_g7_a',
        unit: '1',
        dailyNewWordTarget: 1,
        status: 'active',
      },
    })

    const activeResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/study-plans/active?userId=${userId}`,
    })

    expect(activeResponse.statusCode).toBe(200)
    expect(activeResponse.json()).toMatchObject({
      studyPlan: {
        userId,
        vocabularyBookId: 'book_pep_ru_g7_a',
        unit: '1',
      },
    })
  })
})
