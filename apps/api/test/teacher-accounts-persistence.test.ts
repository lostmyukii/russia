import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { leaderboardResponseSchema, studySessionSchema } from '@russian-wordscodex/contracts'

import { buildApp } from '../src/app'

function createTeacherDataFilePath() {
  return join(mkdtempSync(join(tmpdir(), 'russian-wordscodex-teacher-')), 'teacher-data.json')
}

describe('persistent teacher account API', () => {
  it('persists teacher login, student accounts, class grouping and password reset', async () => {
    const teacherDataFilePath = createTeacherDataFilePath()
    const app = buildApp({ teacherDataFilePath })

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/teacher-login',
      payload: {
        username: 'teacher01',
        password: 'teacher123456',
      },
    })
    const loginPayload: { user: { id: string; displayName: string } } = loginResponse.json()

    expect(loginResponse.statusCode).toBe(200)
    expect(loginPayload.user.displayName).toBe('俄语老师')

    const classResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/teacher/classes',
      payload: {
        teacherId: loginPayload.user.id,
        name: '七年级一班',
      },
    })
    const classPayload: { class: { id: string; name: string } } = classResponse.json()

    expect(classResponse.statusCode).toBe(200)
    expect(classPayload.class.name).toBe('七年级一班')

    const studentResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/teacher/student-accounts',
      payload: {
        teacherId: loginPayload.user.id,
        classId: classPayload.class.id,
        displayName: '安娜',
        username: 'anna01',
        password: 'ru2026',
      },
    })
    const studentPayload: {
      student: {
        id: string
        learnerId: string
        displayName: string
        loginUsername: string
        initialPassword: string
        classId: string
      }
    } = studentResponse.json()

    expect(studentResponse.statusCode).toBe(200)
    expect(studentPayload.student).toMatchObject({
      displayName: '安娜',
      loginUsername: 'anna01',
      initialPassword: 'ru2026',
      classId: classPayload.class.id,
    })

    const resetResponse = await app.inject({
      method: 'PATCH',
      url: `/api/v1/teacher/students/${studentPayload.student.id}/password`,
      payload: {
        teacherId: loginPayload.user.id,
        password: 'ru2027',
      },
    })
    const resetPayload: { student: { initialPassword: string } } = resetResponse.json()

    expect(resetResponse.statusCode).toBe(200)
    expect(resetPayload.student.initialPassword).toBe('ru2027')

    const persisted = JSON.parse(readFileSync(teacherDataFilePath, 'utf8')) as {
      classes: Array<{ name: string }>
      students: Array<{ loginUsername: string; initialPassword: string; classId: string }>
    }

    expect(persisted.classes).toMatchObject([{ name: '七年级一班' }])
    expect(persisted.students).toMatchObject([
      {
        loginUsername: 'anna01',
        initialPassword: 'ru2027',
        classId: classPayload.class.id,
      },
    ])

    await app.close()

    const restartedApp = buildApp({ teacherDataFilePath })
    const classesResponse = await restartedApp.inject({
      method: 'GET',
      url: `/api/v1/teacher/classes?teacherId=${loginPayload.user.id}`,
    })
    const classesPayload: {
      classes: Array<{ id: string; name: string; students: Array<{ loginUsername: string }> }>
    } = classesResponse.json()

    expect(classesResponse.statusCode).toBe(200)
    expect(classesPayload.classes).toMatchObject([
      {
        name: '七年级一班',
        students: [{ loginUsername: 'anna01' }],
      },
    ])

    await restartedApp.close()
  })

  it('returns a class leaderboard ordered by score and limited to the selected class', async () => {
    const teacherDataFilePath = createTeacherDataFilePath()
    const app = buildApp({ teacherDataFilePath })

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/teacher-login',
      payload: {
        username: 'teacher01',
        password: 'teacher123456',
      },
    })
    const loginPayload: { user: { id: string } } = loginResponse.json()
    const teacher = loginPayload.user
    const classResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/teacher/classes',
      payload: {
        teacherId: teacher.id,
        name: '七年级一班',
      },
    })
    const classPayload: { class: { id: string } } = classResponse.json()
    const teacherClass = classPayload.class

    const annaResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/teacher/student-accounts',
      payload: {
        teacherId: teacher.id,
        classId: teacherClass.id,
        displayName: '安娜',
        username: 'anna01',
        password: 'ru2026',
      },
    })
    const borisResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/teacher/student-accounts',
      payload: {
        teacherId: teacher.id,
        classId: teacherClass.id,
        displayName: '鲍里斯',
        username: 'boris01',
        password: 'ru2026',
      },
    })
    const annaPayload: { student: { learnerId: string; displayName: string } } = annaResponse.json()
    const borisPayload: { student: { learnerId: string; displayName: string } } =
      borisResponse.json()
    const anna = annaPayload.student
    const boris = borisPayload.student

    await completeStudentStudy(app, anna.learnerId, 2, 'complete-anna')
    await completeStudentStudy(app, boris.learnerId, 1, 'complete-boris')

    const leaderboardResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/leaderboard?scope=class&teacherId=${teacher.id}&classId=${teacherClass.id}&now=2026-06-14T23:00:00.000Z`,
    })
    const leaderboard = leaderboardResponseSchema.parse(leaderboardResponse.json())

    expect(leaderboardResponse.statusCode).toBe(200)
    expect(leaderboard.entries).toMatchObject([
      {
        displayName: anna.displayName,
        rank: 1,
      },
      {
        displayName: boris.displayName,
        rank: 2,
      },
    ])
    expect(leaderboard.entries.every((entry) => entry.classId === teacherClass.id)).toBe(true)

    await app.close()
  })
})

async function completeStudentStudy(
  app: ReturnType<typeof buildApp>,
  learnerId: string,
  correctWordCount: number,
  idempotencyKey: string,
) {
  await app.inject({
    method: 'POST',
    url: '/api/v1/study-plans',
    payload: {
      userId: learnerId,
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
  const sessionResponse = await app.inject({
    method: 'POST',
    url: '/api/v1/study-sessions',
    payload: { userId: learnerId },
  })
  const sessionPayload: unknown = sessionResponse.json()
  const session = studySessionSchema.parse(
    (sessionPayload as { studySession: unknown }).studySession,
  )
  const reviews = session.wordCards.slice(0, correctWordCount).map((wordCard) => ({
    wordId: wordCard.wordId,
    answerQuality: 'easy' as const,
    responseMs: 2800,
  }))

  await app.inject({
    method: 'POST',
    url: `/api/v1/study-sessions/${session.id}/complete`,
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    payload: {
      userId: learnerId,
      reviews,
    },
  })
}
