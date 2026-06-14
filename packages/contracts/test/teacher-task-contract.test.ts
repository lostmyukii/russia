import { describe, expect, it } from 'vitest'

import {
  addTeacherStudentRequestSchema,
  createTeacherClassRequestSchema,
  createTeacherEvaluationRequestSchema,
  createTeacherStudentAccountRequestSchema,
  createTeacherTaskRequestSchema,
  resetTeacherStudentPasswordRequestSchema,
  teacherClassSchema,
  teacherEvaluationSchema,
  teacherLoginRequestSchema,
  teacherStudentSchema,
  teacherTaskOverviewSchema,
  teacherTaskSchema,
} from '../src/index'

describe('teacher task contracts', () => {
  it('validates class roster, task, evaluation and overview payloads', () => {
    const student = teacherStudentSchema.parse({
      id: 'student_teacher_demo_ru_learner_demo_20260614000000',
      teacherId: 'teacher_demo_ru',
      learnerId: 'learner_demo_20260614000000',
      displayName: '登录学习者',
      accountType: 'registered',
      loginUsername: 'student01',
      initialPassword: 'ru123456',
      classId: 'class_teacher_demo_ru_g7_1',
      joinedAt: '2026-06-14T00:00:00.000Z',
    })
    const teacherClass = teacherClassSchema.parse({
      id: 'class_teacher_demo_ru_g7_1',
      teacherId: 'teacher_demo_ru',
      name: '七年级一班',
      studentIds: [student.id],
      createdAt: '2026-06-14T00:00:00.000Z',
    })

    const task = teacherTaskSchema.parse({
      id: 'task_teacher_demo_ru_book_pep_ru_g7_full_unit_1',
      teacherId: 'teacher_demo_ru',
      title: '七年级全一册第 1 单元背词任务',
      vocabularyBookId: 'book_pep_ru_g7_full',
      unit: '1',
      dailyNewWordTarget: 2,
      dueDate: '2026-06-21',
      assignedStudentIds: [student.id],
      status: 'active',
      createdAt: '2026-06-14T00:00:00.000Z',
    })

    const evaluation = teacherEvaluationSchema.parse({
      id: `eval_${task.id}_${student.id}`,
      teacherId: 'teacher_demo_ru',
      taskId: task.id,
      studentId: student.id,
      rating: 'great',
      comment: '词义掌握稳定，继续保持。',
      createdAt: '2026-06-14T00:05:00.000Z',
    })

    expect(
      teacherTaskOverviewSchema.parse({
        task,
        students: [
          {
            student,
            assignedWordCount: 2,
            recitedWordCount: 1,
            masteredWordCount: 1,
            correctRate: 1,
            completionRate: 0.5,
            evaluationRating: evaluation.rating,
            evaluationComment: evaluation.comment,
          },
        ],
      }),
    ).toMatchObject({
      task: {
        title: '七年级全一册第 1 单元背词任务',
      },
      students: [
        {
          student: {
            classId: teacherClass.id,
            displayName: '登录学习者',
          },
          evaluationComment: '词义掌握稳定，继续保持。',
        },
      ],
    })
  })

  it('validates teacher write requests before API handlers use them', () => {
    expect(
      teacherLoginRequestSchema.parse({
        username: 'teacher01',
        password: 'teacher123456',
      }),
    ).toEqual({
      username: 'teacher01',
      password: 'teacher123456',
    })

    expect(
      createTeacherClassRequestSchema.parse({
        teacherId: 'teacher_demo_ru',
        name: '七年级一班',
      }),
    ).toEqual({
      teacherId: 'teacher_demo_ru',
      name: '七年级一班',
    })

    expect(
      createTeacherStudentAccountRequestSchema.parse({
        teacherId: 'teacher_demo_ru',
        classId: 'class_teacher_demo_ru_g7_1',
        displayName: '安娜',
        username: 'anna01',
        password: 'ru2026',
      }),
    ).toMatchObject({
      displayName: '安娜',
      username: 'anna01',
    })

    expect(
      resetTeacherStudentPasswordRequestSchema.parse({
        teacherId: 'teacher_demo_ru',
        password: 'ru2027',
      }),
    ).toEqual({
      teacherId: 'teacher_demo_ru',
      password: 'ru2027',
    })

    expect(
      addTeacherStudentRequestSchema.parse({
        teacherId: 'teacher_demo_ru',
        learnerId: 'learner_demo_20260614000000',
      }),
    ).toEqual({
      teacherId: 'teacher_demo_ru',
      learnerId: 'learner_demo_20260614000000',
    })

    expect(
      createTeacherTaskRequestSchema.parse({
        teacherId: 'teacher_demo_ru',
        title: '七年级全一册第 1 单元背词任务',
        vocabularyBookId: 'book_pep_ru_g7_full',
        unit: '1',
        dailyNewWordTarget: 2,
        dueDate: '2026-06-21',
        studentIds: ['student_teacher_demo_ru_learner_demo_20260614000000'],
      }),
    ).toMatchObject({
      teacherId: 'teacher_demo_ru',
      studentIds: ['student_teacher_demo_ru_learner_demo_20260614000000'],
    })

    expect(
      createTeacherEvaluationRequestSchema.parse({
        teacherId: 'teacher_demo_ru',
        taskId: 'task_teacher_demo_ru_book_pep_ru_g7_full_unit_1',
        studentId: 'student_teacher_demo_ru_learner_demo_20260614000000',
        rating: 'great',
        comment: '词义掌握稳定，继续保持。',
      }),
    ).toMatchObject({
      rating: 'great',
      comment: '词义掌握稳定，继续保持。',
    })
  })
})
