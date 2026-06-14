import { describe, expect, it } from 'vitest'

import {
  addStudentToTeacher,
  buildTeacherProgressSummaries,
  buildTeacherTaskOverview,
  completeStudySession,
  createRegisteredLearner,
  createStudyPlanFromOnboarding,
  createStudySessionFromPlan,
  createTeacherAccount,
  createTeacherTask,
  evaluateStudentTask,
} from '../src/index'

describe('teacher class tasks', () => {
  it('adds a student, assigns a unit task and attaches a teacher evaluation', () => {
    const now = '2026-06-14T00:00:00.000Z'
    const teacher = createTeacherAccount({ now })
    const learner = createRegisteredLearner({ now })
    const student = addStudentToTeacher({ teacher, learner, now })
    const plan = createStudyPlanFromOnboarding({
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
      now,
    }).studyPlan
    const session = createStudySessionFromPlan({ plan, now })
    const result = completeStudySession({
      session,
      request: {
        userId: learner.id,
        reviews: [{ wordId: 'word_shkola', answerQuality: 'easy', responseMs: 3200 }],
      },
      now,
    })

    const task = createTeacherTask({
      teacherId: teacher.id,
      title: '七年级上册第 1 单元背词任务',
      vocabularyBookId: 'book_pep_ru_g7_a',
      unit: '1',
      dailyNewWordTarget: 2,
      dueDate: '2026-06-21',
      students: [student],
      now,
    })
    const evaluation = evaluateStudentTask({
      teacherId: teacher.id,
      task,
      studentId: student.id,
      rating: 'great',
      comment: '词义掌握稳定，继续保持。',
      now: '2026-06-14T00:05:00.000Z',
    })
    const overview = buildTeacherTaskOverview({
      task,
      students: [student],
      progressSummaries: buildTeacherProgressSummaries({
        learners: [learner],
        plans: [plan],
        results: [result],
      }),
      evaluations: [evaluation],
    })

    expect(student).toMatchObject({
      id: 'student_teacher_demo_ru_learner_demo_20260614000000',
      displayName: '登录学习者',
      accountType: 'registered',
    })
    expect(task).toMatchObject({
      id: 'task_teacher_demo_ru_book_pep_ru_g7_a_unit_1',
      assignedStudentIds: [student.id],
      status: 'active',
    })
    expect(overview.students).toEqual([
      {
        student,
        assignedWordCount: 2,
        recitedWordCount: 1,
        masteredWordCount: 1,
        correctRate: 1,
        completionRate: 0.5,
        evaluationRating: 'great',
        evaluationComment: '词义掌握稳定，继续保持。',
      },
    ])
  })
})
