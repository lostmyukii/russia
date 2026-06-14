import { describe, expect, it } from 'vitest'

import {
  guestUserSchema,
  registeredLearnerSchema,
  studySessionSchema,
} from '@russian-wordscodex/contracts'

import { buildApp } from '../src/app'

describe('teacher progress API', () => {
  it('lets a teacher account view guest and registered learner recitation progress', async () => {
    const app = buildApp()

    const teacherResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/teacher',
    })

    expect(teacherResponse.statusCode).toBe(200)
    expect(teacherResponse.json()).toMatchObject({
      user: {
        accountType: 'teacher',
        displayName: '俄语老师',
        role: 'teacher',
      },
    })

    const guestResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/guest',
    })
    const registeredResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/demo-learner',
    })

    const guestPayload: unknown = guestResponse.json()
    const registeredPayload: unknown = registeredResponse.json()
    const guest = guestUserSchema.parse((guestPayload as { user: unknown }).user)
    const registered = registeredLearnerSchema.parse((registeredPayload as { user: unknown }).user)

    for (const user of [guest, registered]) {
      const planResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/study-plans',
        payload: {
          userId: user.id,
          preferences: {
            educationStage: 'junior',
            grade: 'g7',
            bookId: 'book_pep_ru_g7_full',
            unit: '1',
            dailyNewWordTarget: 2,
            reminderEnabled: true,
          },
          targetDate: null,
        },
      })

      expect(planResponse.statusCode).toBe(200)

      const sessionResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/study-sessions',
        payload: {
          userId: user.id,
        },
      })

      expect(sessionResponse.statusCode).toBe(200)
      const sessionPayload: unknown = sessionResponse.json()
      const session = studySessionSchema.parse(
        (sessionPayload as { studySession: unknown }).studySession,
      )
      const sessionId = session.id
      const firstWord = session.wordCards[0]
      const secondWord = session.wordCards[1]

      expect(firstWord).toBeDefined()
      expect(secondWord).toBeDefined()

      const completeResponse = await app.inject({
        method: 'POST',
        url: `/api/v1/study-sessions/${sessionId}/complete`,
        headers: {
          'Idempotency-Key': `complete-${user.id}`,
        },
        payload: {
          userId: user.id,
          reviews:
            user.accountType === 'guest'
              ? [
                  { wordId: firstWord!.wordId, answerQuality: 'good', responseMs: 5200 },
                  { wordId: secondWord!.wordId, answerQuality: 'again', responseMs: 9000 },
                ]
              : [{ wordId: firstWord!.wordId, answerQuality: 'easy', responseMs: 3200 }],
        },
      })

      expect(completeResponse.statusCode).toBe(200)
    }

    const progressResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/teacher/progress?teacherId=teacher_demo_ru',
    })

    expect(progressResponse.statusCode).toBe(200)
    expect(progressResponse.json()).toMatchObject({
      teacher: {
        accountType: 'teacher',
        displayName: '俄语老师',
      },
      learners: [
        {
          accountType: 'registered',
          displayName: '登录学习者',
          recitedWordCount: 1,
          masteredWordCount: 1,
        },
        {
          accountType: 'guest',
          displayName: '访客学习者',
          recitedWordCount: 2,
          masteredWordCount: 1,
        },
      ],
    })
  })
})
