import { describe, expect, it } from 'vitest'

import {
  registeredLearnerSchema,
  studySessionSchema,
  teacherEvaluationSchema,
  teacherStudentSchema,
  teacherTaskOverviewSchema,
  teacherTaskSchema,
} from '@russian-wordscodex/contracts'

import { buildApp } from '../src/app'

describe('teacher task API', () => {
  it('lets a teacher add students, assign a vocabulary task and evaluate progress', async () => {
    const app = buildApp()

    const teacherResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/teacher',
    })
    const learnerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/demo-learner',
    })
    const learnerPayload: unknown = learnerResponse.json()
    const learner = registeredLearnerSchema.parse((learnerPayload as { user: unknown }).user)

    expect(teacherResponse.statusCode).toBe(200)

    const planResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/study-plans',
      payload: {
        userId: learner.id,
        preferences: {
          educationStage: 'junior',
          grade: 'g7',
          bookId: 'book_pep_ru_g7_a',
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
        userId: learner.id,
      },
    })
    const sessionPayload: unknown = sessionResponse.json()
    const session = studySessionSchema.parse(
      (sessionPayload as { studySession: unknown }).studySession,
    )
    const completeResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/study-sessions/${session.id}/complete`,
      headers: {
        'Idempotency-Key': `complete-${learner.id}`,
      },
      payload: {
        userId: learner.id,
        reviews: [{ wordId: 'word_shkola', answerQuality: 'easy', responseMs: 3200 }],
      },
    })

    expect(completeResponse.statusCode).toBe(200)

    const addStudentResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/teacher/students',
      payload: {
        teacherId: 'teacher_demo_ru',
        learnerId: learner.id,
      },
    })
    const studentPayload: unknown = addStudentResponse.json()
    const student = teacherStudentSchema.parse((studentPayload as { student: unknown }).student)

    expect(addStudentResponse.statusCode).toBe(200)
    expect(student).toMatchObject({
      displayName: '登录学习者',
      teacherId: 'teacher_demo_ru',
    })

    const taskResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/teacher/tasks',
      payload: {
        teacherId: 'teacher_demo_ru',
        title: '七年级上册第 1 单元背词任务',
        vocabularyBookId: 'book_pep_ru_g7_a',
        unit: '1',
        dailyNewWordTarget: 2,
        dueDate: '2026-06-21',
        studentIds: [student.id],
      },
    })
    const taskPayload: unknown = taskResponse.json()
    const task = teacherTaskSchema.parse((taskPayload as { task: unknown }).task)

    expect(taskResponse.statusCode).toBe(200)
    expect(task.assignedStudentIds).toEqual([student.id])

    const evaluationResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/teacher/evaluations',
      payload: {
        teacherId: 'teacher_demo_ru',
        taskId: task.id,
        studentId: student.id,
        rating: 'great',
        comment: '词义掌握稳定，继续保持。',
      },
    })
    const evaluationPayload: unknown = evaluationResponse.json()
    const evaluation = teacherEvaluationSchema.parse(
      (evaluationPayload as { evaluation: unknown }).evaluation,
    )

    expect(evaluationResponse.statusCode).toBe(200)
    expect(evaluation.comment).toBe('词义掌握稳定，继续保持。')

    const overviewResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/teacher/tasks/${task.id}/overview?teacherId=teacher_demo_ru`,
    })
    const overviewPayload: unknown = overviewResponse.json()
    const overview = teacherTaskOverviewSchema.parse(
      (overviewPayload as { overview: unknown }).overview,
    )

    expect(overviewResponse.statusCode).toBe(200)
    expect(overview.students).toMatchObject([
      {
        student: {
          displayName: '登录学习者',
        },
        recitedWordCount: 1,
        evaluationComment: '词义掌握稳定，继续保持。',
      },
    ])
  })
})
