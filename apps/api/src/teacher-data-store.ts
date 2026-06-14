import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import {
  createTeacherAccount,
  type LearnerAccount,
  type TeacherClass,
  type TeacherEvaluation,
  type TeacherStudent,
  type TeacherTask,
  type TeacherUser,
} from '@russian-wordscodex/domain'

export type PersistedTeacherAccount = TeacherUser & {
  username: string
  password: string
}

export type TeacherDataState = {
  teachers: PersistedTeacherAccount[]
  learners: LearnerAccount[]
  students: TeacherStudent[]
  classes: TeacherClass[]
  tasks: TeacherTask[]
  evaluations: TeacherEvaluation[]
}

export function loadTeacherDataState({
  filePath,
  now,
}: {
  filePath: string | undefined
  now: string
}): TeacherDataState {
  if (!filePath || !existsSync(filePath)) {
    const initialState = createInitialTeacherDataState(now)

    if (filePath) {
      saveTeacherDataState(filePath, initialState)
    }

    return initialState
  }

  const rawData: unknown = JSON.parse(readFileSync(filePath, 'utf8'))
  const state = normalizeTeacherDataState(rawData, now)
  saveTeacherDataState(filePath, state)

  return state
}

export function saveTeacherDataState(filePath: string | undefined, state: TeacherDataState): void {
  if (!filePath) {
    return
  }

  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
}

function createInitialTeacherDataState(now: string): TeacherDataState {
  return {
    teachers: [
      {
        ...createTeacherAccount({ now }),
        username: 'teacher01',
        password: 'teacher123456',
      },
    ],
    learners: [],
    students: [],
    classes: [],
    tasks: [],
    evaluations: [],
  }
}

function normalizeTeacherDataState(rawData: unknown, now: string): TeacherDataState {
  const rawState = isRecord(rawData) ? rawData : {}
  const defaultState = createInitialTeacherDataState(now)
  const teachers = readArray(rawState.teachers) as PersistedTeacherAccount[]

  return {
    teachers: teachers.length > 0 ? teachers : defaultState.teachers,
    learners: readArray(rawState.learners) as LearnerAccount[],
    students: readArray(rawState.students) as TeacherStudent[],
    classes: readArray(rawState.classes) as TeacherClass[],
    tasks: readArray(rawState.tasks) as TeacherTask[],
    evaluations: readArray(rawState.evaluations) as TeacherEvaluation[],
  }
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
