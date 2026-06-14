import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'

import {
  addTeacherStudentRequestSchema,
  createCheckinRequestSchema,
  createTeacherEvaluationRequestSchema,
  createTeacherTaskRequestSchema,
  healthResponseSchema,
  leaderboardScopeSchema,
  launchReadinessReportSchema,
  mistakeEliminationRequestSchema,
  offlineSyncRequestSchema,
  onboardingRequestSchema,
  studySessionCompleteRequestSchema,
} from '@russian-wordscodex/contracts'
import {
  addStudentToTeacher,
  applyMistakeEliminationReview,
  applySrsReview,
  buildDashboardSummary,
  buildMistakeEntries,
  buildLeaderboardEntries,
  buildMistakeRemovedScoreEvent,
  buildScoreEventsForStudyResult,
  buildTeacherProgressSummaries,
  buildTeacherTaskOverview,
  buildLaunchReadinessReport,
  completeStudySession,
  createCheckinRecord,
  createGuestLearner,
  createInitialWordProgress,
  createMvpLaunchReadinessChecks,
  createRegisteredLearner,
  createStudyPlanFromOnboarding,
  createStudySessionFromPlan,
  createTeacherAccount,
  createTeacherTask,
  dedupeOfflineSyncOperations,
  evaluateStudentTask,
  getDueReviewQueue,
  getVocabularyBookById,
  getVocabularyBooks,
  groupRussianWordsByBookId,
  type CheckinRecord,
  type EducationStage,
  type LearnerAccount,
  type LeaderboardScope,
  type OfflineSyncResponse,
  type OfflineSyncResult,
  type StudyPlan,
  type StudyScoreEvent,
  type StudySession,
  type StudySessionCompleteRequest,
  type StudySessionResult,
  type TeacherEvaluation,
  type TeacherStudent,
  type TeacherTask,
  type TeacherUser,
  type UserWordProgress,
} from '@russian-wordscodex/domain'

type RateLimitOptions = {
  maxRequests: number
  windowMs: number
}

type BuildAppOptions = {
  rateLimit?: Partial<RateLimitOptions>
}

const defaultRateLimit: RateLimitOptions = {
  maxRequests: 120,
  windowMs: 60_000,
}

type RateLimitBucket = {
  count: number
  resetAtMs: number
}

export function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({
    logger: false,
  })
  const rateLimitOptions = {
    ...defaultRateLimit,
    ...options.rateLimit,
  }
  const rateLimitBuckets = new Map<string, RateLimitBucket>()
  const learners = new Map<string, LearnerAccount>()
  const teachers = new Map<string, TeacherUser>()
  const teacherStudents = new Map<string, TeacherStudent>()
  const teacherTasks = new Map<string, TeacherTask>()
  const teacherEvaluations = new Map<string, TeacherEvaluation>()
  const activeStudyPlans = new Map<string, StudyPlan>()
  const studySessions = new Map<string, StudySession>()
  const studyResults = new Map<string, StudySessionResult>()
  const userWordProgress = new Map<string, UserWordProgress>()
  const scoreEvents = new Map<string, StudyScoreEvent>()
  const checkins = new Map<string, CheckinRecord>()
  const completionResultsByIdempotencyKey = new Map<string, StudySessionResult>()
  const mistakeResultsByIdempotencyKey = new Map<string, UserWordProgress>()
  const checkinsByIdempotencyKey = new Map<string, CheckinRecord>()

  app.addHook('onRequest', (request, reply, done) => {
    applySecurityHeaders(reply)

    if (!isWriteRequest(request)) {
      done()
      return
    }

    const result = consumeRateLimit({
      buckets: rateLimitBuckets,
      request,
      options: rateLimitOptions,
      nowMs: Date.now(),
    })

    if (!result.allowed) {
      reply.header('Retry-After', String(result.retryAfterSeconds))
      reply.code(429).send({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '请求过于频繁，请稍后再试。',
          requestId: request.id,
        },
      })
      return
    }

    done()
  })

  const completeStudySessionWithSideEffects = ({
    sessionId,
    parsedRequest,
    idempotencyKey,
    now,
  }: {
    sessionId: string
    parsedRequest: StudySessionCompleteRequest
    idempotencyKey: string
    now: string
  }):
    | { ok: true; result: StudySessionResult }
    | { ok: false; statusCode: 400 | 404; code: string; message: string } => {
    const cachedResult = completionResultsByIdempotencyKey.get(idempotencyKey)

    if (cachedResult) {
      return { ok: true, result: cachedResult }
    }

    const studySession = studySessions.get(sessionId)

    if (!studySession) {
      return {
        ok: false,
        statusCode: 404,
        code: 'STUDY_SESSION_NOT_FOUND',
        message: '未找到学习会话。',
      }
    }

    try {
      const result = completeStudySession({
        session: studySession,
        request: parsedRequest,
        now,
      })
      const completedAt = result.completedAt
      const sessionWordIds = new Set(studySession.wordCards.map((card) => card.wordId))
      parsedRequest.reviews
        .filter((review) => sessionWordIds.has(review.wordId))
        .forEach((review) => {
          const progressKey = getProgressKey(parsedRequest.userId, review.wordId)
          const previousProgress =
            userWordProgress.get(progressKey) ??
            createInitialWordProgress({
              userId: parsedRequest.userId,
              wordId: review.wordId,
              now: completedAt,
            })
          const nextProgress = applySrsReview({
            previous: previousProgress,
            answerQuality: review.answerQuality,
            responseMs: review.responseMs,
            errorType: review.errorType ?? null,
            now: completedAt,
          })
          userWordProgress.set(progressKey, nextProgress)
        })
      const completedSession = { ...studySession, status: 'completed' as const }
      studySessions.set(sessionId, completedSession)
      studyResults.set(sessionId, result)
      buildScoreEventsForStudyResult({
        session: studySession,
        result,
        idempotencyKey,
      }).forEach((event) => {
        scoreEvents.set(event.id, event)
      })
      completionResultsByIdempotencyKey.set(idempotencyKey, result)

      return { ok: true, result }
    } catch (error) {
      return {
        ok: false,
        statusCode: 400,
        code: 'STUDY_SESSION_COMPLETE_FAILED',
        message: error instanceof Error ? error.message : '学习会话完成失败。',
      }
    }
  }

  app.get('/api/v1/health', () => {
    return healthResponseSchema.parse({
      status: 'ok',
      service: 'russian-wordscodex-api',
    })
  })

  app.get('/api/v1/ops/readiness', () => {
    return launchReadinessReportSchema.parse(
      buildLaunchReadinessReport({
        checks: createMvpLaunchReadinessChecks(),
        generatedAt: new Date().toISOString(),
      }),
    )
  })

  app.get('/api/v1/vocabulary-books', (request) => {
    const { stage } = request.query as { stage?: EducationStage; language?: string }

    return {
      books: getVocabularyBooks(stage),
    }
  })

  app.get('/api/v1/vocabulary-books/:bookId/units', (request, reply) => {
    const { bookId } = request.params as { bookId: string }
    const book = getVocabularyBookById(bookId)

    if (!book) {
      reply.code(404)
      return {
        error: {
          code: 'VOCABULARY_BOOK_NOT_FOUND',
          message: '未找到对应的人教版俄语词库。',
          requestId: request.id,
        },
      }
    }

    return {
      bookId,
      units: groupRussianWordsByBookId(bookId),
    }
  })

  app.post('/api/v1/auth/guest', () => {
    const user = createGuestLearner({ now: new Date().toISOString() })
    learners.set(user.id, user)

    return { user }
  })

  app.post('/api/v1/auth/demo-learner', () => {
    const user = createRegisteredLearner({ now: new Date().toISOString() })
    learners.set(user.id, user)

    return { user }
  })

  app.post('/api/v1/auth/teacher', () => {
    const user = createTeacherAccount({ now: new Date().toISOString() })
    teachers.set(user.id, user)

    return { user }
  })

  app.post('/api/v1/study-plans', (request, reply) => {
    const parsedRequest = onboardingRequestSchema.safeParse(request.body)

    if (!parsedRequest.success) {
      reply.code(400)
      return {
        error: {
          code: 'ONBOARDING_REQUEST_INVALID',
          message: '新手引导参数不完整。',
          requestId: request.id,
        },
      }
    }

    try {
      const result = createStudyPlanFromOnboarding({
        ...parsedRequest.data,
        now: new Date().toISOString(),
      })
      activeStudyPlans.set(result.studyPlan.userId, result.studyPlan)

      return result
    } catch (error) {
      reply.code(400)
      return {
        error: {
          code: 'STUDY_PLAN_INVALID',
          message: error instanceof Error ? error.message : '学习计划创建失败。',
          requestId: request.id,
        },
      }
    }
  })

  app.get('/api/v1/study-plans/active', (request, reply) => {
    const { userId } = request.query as { userId?: string }

    if (!userId) {
      reply.code(400)
      return {
        error: {
          code: 'USER_ID_REQUIRED',
          message: '查询活跃学习计划需要 userId。',
          requestId: request.id,
        },
      }
    }

    const studyPlan = activeStudyPlans.get(userId)

    if (!studyPlan) {
      reply.code(404)
      return {
        error: {
          code: 'ACTIVE_STUDY_PLAN_NOT_FOUND',
          message: '未找到活跃学习计划。',
          requestId: request.id,
        },
      }
    }

    return { studyPlan }
  })

  app.post('/api/v1/study-sessions', (request, reply) => {
    const { userId } = request.body as { userId?: string }

    if (!userId) {
      reply.code(400)
      return {
        error: {
          code: 'USER_ID_REQUIRED',
          message: '创建学习会话需要 userId。',
          requestId: request.id,
        },
      }
    }

    const plan = activeStudyPlans.get(userId)

    if (!plan) {
      reply.code(404)
      return {
        error: {
          code: 'ACTIVE_STUDY_PLAN_NOT_FOUND',
          message: '请先生成学习计划。',
          requestId: request.id,
        },
      }
    }

    const studySession = createStudySessionFromPlan({ plan, now: new Date().toISOString() })
    studySessions.set(studySession.id, studySession)

    return { studySession }
  })

  app.get('/api/v1/study-sessions/:sessionId', (request, reply) => {
    const { sessionId } = request.params as { sessionId: string }
    const studySession = studySessions.get(sessionId)

    if (!studySession) {
      reply.code(404)
      return {
        error: {
          code: 'STUDY_SESSION_NOT_FOUND',
          message: '未找到学习会话。',
          requestId: request.id,
        },
      }
    }

    return { studySession }
  })

  app.post('/api/v1/study-sessions/:sessionId/complete', (request, reply) => {
    const { sessionId } = request.params as { sessionId: string }
    const idempotencyKey = request.headers['idempotency-key']

    if (typeof idempotencyKey !== 'string' || idempotencyKey.length === 0) {
      reply.code(400)
      return {
        error: {
          code: 'IDEMPOTENCY_KEY_REQUIRED',
          message: '完成学习会话需要 Idempotency-Key。',
          requestId: request.id,
        },
      }
    }

    const parsedRequest = studySessionCompleteRequestSchema.safeParse(request.body)

    if (!parsedRequest.success) {
      reply.code(400)
      return {
        error: {
          code: 'STUDY_SESSION_REVIEW_INVALID',
          message: '学习作答记录不完整。',
          requestId: request.id,
        },
      }
    }

    const completed = completeStudySessionWithSideEffects({
      sessionId,
      parsedRequest: parsedRequest.data,
      idempotencyKey,
      now: new Date().toISOString(),
    })

    if (!completed.ok) {
      reply.code(completed.statusCode)
      return {
        error: {
          code: completed.code,
          message: completed.message,
          requestId: request.id,
        },
      }
    }

    return { result: completed.result }
  })

  app.post('/api/v1/offline/sync', (request, reply) => {
    const parsedRequest = offlineSyncRequestSchema.safeParse(request.body)

    if (!parsedRequest.success) {
      reply.code(400)
      return {
        error: {
          code: 'OFFLINE_SYNC_REQUEST_INVALID',
          message: '离线同步队列参数不完整。',
          requestId: request.id,
        },
      }
    }

    const now = new Date().toISOString()
    const results: OfflineSyncResult[] = dedupeOfflineSyncOperations(
      parsedRequest.data.operations,
    ).map((operation) => {
      const completed = completeStudySessionWithSideEffects({
        sessionId: operation.payload.sessionId,
        parsedRequest: operation.payload.request,
        idempotencyKey: operation.idempotencyKey,
        now,
      })

      if (!completed.ok) {
        return {
          operationId: operation.id,
          idempotencyKey: operation.idempotencyKey,
          status: 'failed',
          retryCount: operation.retryCount + 1,
          syncedAt: null,
          error: completed.message,
        }
      }

      return {
        operationId: operation.id,
        idempotencyKey: operation.idempotencyKey,
        status: 'synced',
        retryCount: operation.retryCount,
        syncedAt: now,
        error: null,
      }
    })

    const response: OfflineSyncResponse = {
      syncedCount: results.filter((result) => result.status === 'synced').length,
      failedCount: results.filter((result) => result.status === 'failed').length,
      results,
    }

    return response
  })

  app.get('/api/v1/study-sessions/:sessionId/result', (request, reply) => {
    const { sessionId } = request.params as { sessionId: string }
    const result = studyResults.get(sessionId)

    if (!result) {
      reply.code(404)
      return {
        error: {
          code: 'STUDY_SESSION_RESULT_NOT_FOUND',
          message: '未找到学习结果。',
          requestId: request.id,
        },
      }
    }

    return { result }
  })

  app.get('/api/v1/review/queue', (request, reply) => {
    const { userId, now } = request.query as { userId?: string; now?: string }

    if (!userId) {
      reply.code(400)
      return {
        error: {
          code: 'USER_ID_REQUIRED',
          message: '查询复习队列需要 userId。',
          requestId: request.id,
        },
      }
    }

    return {
      queue: getDueReviewQueue({
        progressList: Array.from(userWordProgress.values()).filter(
          (progress) => progress.userId === userId,
        ),
        now: now ?? new Date().toISOString(),
      }),
    }
  })

  app.get('/api/v1/mistakes', (request, reply) => {
    const { userId } = request.query as { userId?: string }

    if (!userId) {
      reply.code(400)
      return {
        error: {
          code: 'USER_ID_REQUIRED',
          message: '查询错词本需要 userId。',
          requestId: request.id,
        },
      }
    }

    return {
      mistakes: buildMistakeEntries({
        progressList: Array.from(userWordProgress.values()).filter(
          (progress) => progress.userId === userId,
        ),
      }),
    }
  })

  app.post('/api/v1/mistakes/session', (request, reply) => {
    const idempotencyKey = request.headers['idempotency-key']

    if (typeof idempotencyKey !== 'string' || idempotencyKey.length === 0) {
      reply.code(400)
      return {
        error: {
          code: 'IDEMPOTENCY_KEY_REQUIRED',
          message: '错词消灭训练需要 Idempotency-Key。',
          requestId: request.id,
        },
      }
    }

    const cachedProgress = mistakeResultsByIdempotencyKey.get(idempotencyKey)

    if (cachedProgress) {
      return { progress: cachedProgress }
    }

    const parsedRequest = mistakeEliminationRequestSchema.safeParse(request.body)

    if (!parsedRequest.success) {
      reply.code(400)
      return {
        error: {
          code: 'MISTAKE_SESSION_INVALID',
          message: '错词消灭训练参数不完整。',
          requestId: request.id,
        },
      }
    }

    const progressKey = getProgressKey(parsedRequest.data.userId, parsedRequest.data.wordId)
    const currentProgress = userWordProgress.get(progressKey)

    if (!currentProgress || currentProgress.masteryState !== 'mistake') {
      reply.code(404)
      return {
        error: {
          code: 'MISTAKE_NOT_FOUND',
          message: '未找到需要消灭的错词。',
          requestId: request.id,
        },
      }
    }

    const now = new Date().toISOString()
    const progress = parsedRequest.data.responseMsList.reduce(
      (previousProgress, responseMs, index) =>
        applyMistakeEliminationReview({
          previous: previousProgress,
          responseMs,
          now: addSeconds(now, index),
        }),
      currentProgress,
    )
    userWordProgress.set(progressKey, progress)
    const mistakeRemovedEvent = buildMistakeRemovedScoreEvent({
      progress,
      idempotencyKey,
      now,
    })

    if (mistakeRemovedEvent) {
      scoreEvents.set(mistakeRemovedEvent.id, mistakeRemovedEvent)
    }
    mistakeResultsByIdempotencyKey.set(idempotencyKey, progress)

    return { progress }
  })

  app.post('/api/v1/checkins', (request, reply) => {
    const idempotencyKey = request.headers['idempotency-key']

    if (typeof idempotencyKey !== 'string' || idempotencyKey.length === 0) {
      reply.code(400)
      return {
        error: {
          code: 'IDEMPOTENCY_KEY_REQUIRED',
          message: '完成打卡需要 Idempotency-Key。',
          requestId: request.id,
        },
      }
    }

    const cachedCheckin = checkinsByIdempotencyKey.get(idempotencyKey)

    if (cachedCheckin) {
      return { checkin: cachedCheckin }
    }

    const parsedRequest = createCheckinRequestSchema.safeParse(request.body)

    if (!parsedRequest.success) {
      reply.code(400)
      return {
        error: {
          code: 'CHECKIN_REQUEST_INVALID',
          message: '打卡参数不完整。',
          requestId: request.id,
        },
      }
    }

    const learner = learners.get(parsedRequest.data.userId)

    if (!learner) {
      reply.code(404)
      return {
        error: {
          code: 'LEARNER_NOT_FOUND',
          message: '未找到要打卡的学习者。',
          requestId: request.id,
        },
      }
    }

    const now = new Date().toISOString()
    const checkinDate = parsedRequest.data.checkinDate ?? now.slice(0, 10)
    const hasCompletedToday = Array.from(studyResults.values()).some(
      (result) => result.userId === learner.id && result.completedAt.slice(0, 10) === checkinDate,
    )

    if (!hasCompletedToday) {
      reply.code(400)
      return {
        error: {
          code: 'CHECKIN_NOT_READY',
          message: '完成今日最低背词任务后才能打卡。',
          requestId: request.id,
        },
      }
    }

    const checkin = createCheckinRecord({
      userId: learner.id,
      checkinDate,
      existingCheckins: Array.from(checkins.values()),
      now,
    })
    checkins.set(checkin.id, checkin)
    checkinsByIdempotencyKey.set(idempotencyKey, checkin)

    return { checkin }
  })

  app.get('/api/v1/leaderboard', (request, reply) => {
    const { scope, bookId, teacherId, now } = request.query as {
      scope?: LeaderboardScope
      bookId?: string
      teacherId?: string
      now?: string
    }
    const parsedScope = leaderboardScopeSchema.safeParse(scope ?? 'daily')

    if (!parsedScope.success) {
      reply.code(400)
      return {
        error: {
          code: 'LEADERBOARD_SCOPE_INVALID',
          message: '排行榜类型不正确。',
          requestId: request.id,
        },
      }
    }

    const leaderboardNow = now ?? new Date().toISOString()
    const classStudents =
      parsedScope.data === 'class' && teacherId
        ? Array.from(teacherStudents.values()).filter((student) => student.teacherId === teacherId)
        : []

    return {
      scope: parsedScope.data,
      entries: buildLeaderboardEntries({
        scope: parsedScope.data,
        learners: Array.from(learners.values()),
        scoreEvents: Array.from(scoreEvents.values()),
        checkins: Array.from(checkins.values()),
        now: leaderboardNow,
        bookId: bookId ?? null,
        classId: teacherId ?? null,
        classLearnerIds: classStudents.map((student) => student.learnerId),
      }),
    }
  })

  app.get('/api/v1/dashboard/summary', (request, reply) => {
    const { userId, now } = request.query as { userId?: string; now?: string }

    if (!userId) {
      reply.code(400)
      return {
        error: {
          code: 'USER_ID_REQUIRED',
          message: '查询学习看板需要 userId。',
          requestId: request.id,
        },
      }
    }

    const learner = learners.get(userId)

    if (!learner) {
      reply.code(404)
      return {
        error: {
          code: 'LEARNER_NOT_FOUND',
          message: '未找到学习者。',
          requestId: request.id,
        },
      }
    }

    return {
      summary: buildDashboardSummary({
        userId,
        plan: activeStudyPlans.get(userId) ?? null,
        results: Array.from(studyResults.values()),
        progressList: Array.from(userWordProgress.values()),
        scoreEvents: Array.from(scoreEvents.values()),
        checkins: Array.from(checkins.values()),
        now: now ?? new Date().toISOString(),
      }),
    }
  })

  app.get('/api/v1/teacher/progress', (request, reply) => {
    const { teacherId } = request.query as { teacherId?: string }

    if (!teacherId) {
      reply.code(400)
      return {
        error: {
          code: 'TEACHER_ID_REQUIRED',
          message: '查询老师看板需要 teacherId。',
          requestId: request.id,
        },
      }
    }

    const teacher = teachers.get(teacherId)

    if (!teacher) {
      reply.code(404)
      return {
        error: {
          code: 'TEACHER_NOT_FOUND',
          message: '未找到老师账号。',
          requestId: request.id,
        },
      }
    }

    return {
      teacher,
      learners: buildTeacherProgressSummaries({
        learners: Array.from(learners.values()),
        plans: Array.from(activeStudyPlans.values()),
        results: Array.from(studyResults.values()),
      }),
    }
  })

  app.post('/api/v1/teacher/students', (request, reply) => {
    const parsedRequest = addTeacherStudentRequestSchema.safeParse(request.body)

    if (!parsedRequest.success) {
      reply.code(400)
      return {
        error: {
          code: 'TEACHER_STUDENT_REQUEST_INVALID',
          message: '添加学生参数不完整。',
          requestId: request.id,
        },
      }
    }

    const teacher = teachers.get(parsedRequest.data.teacherId)

    if (!teacher) {
      reply.code(404)
      return {
        error: {
          code: 'TEACHER_NOT_FOUND',
          message: '未找到老师账号。',
          requestId: request.id,
        },
      }
    }

    const learner = learners.get(parsedRequest.data.learnerId)

    if (!learner) {
      reply.code(404)
      return {
        error: {
          code: 'LEARNER_NOT_FOUND',
          message: '未找到要添加的学生。',
          requestId: request.id,
        },
      }
    }

    const student = addStudentToTeacher({
      teacher,
      learner,
      now: new Date().toISOString(),
    })
    teacherStudents.set(student.id, student)

    return { student }
  })

  app.post('/api/v1/teacher/tasks', (request, reply) => {
    const parsedRequest = createTeacherTaskRequestSchema.safeParse(request.body)

    if (!parsedRequest.success) {
      reply.code(400)
      return {
        error: {
          code: 'TEACHER_TASK_REQUEST_INVALID',
          message: '布置任务参数不完整。',
          requestId: request.id,
        },
      }
    }

    const teacher = teachers.get(parsedRequest.data.teacherId)

    if (!teacher) {
      reply.code(404)
      return {
        error: {
          code: 'TEACHER_NOT_FOUND',
          message: '未找到老师账号。',
          requestId: request.id,
        },
      }
    }

    const students = parsedRequest.data.studentIds
      .map((studentId) => teacherStudents.get(studentId))
      .filter((student): student is TeacherStudent => student !== undefined)

    if (students.length !== parsedRequest.data.studentIds.length) {
      reply.code(404)
      return {
        error: {
          code: 'TEACHER_STUDENT_NOT_FOUND',
          message: '任务中包含未添加的学生。',
          requestId: request.id,
        },
      }
    }

    try {
      const task = createTeacherTask({
        teacherId: parsedRequest.data.teacherId,
        title: parsedRequest.data.title,
        vocabularyBookId: parsedRequest.data.vocabularyBookId,
        unit: parsedRequest.data.unit,
        dailyNewWordTarget: parsedRequest.data.dailyNewWordTarget,
        dueDate: parsedRequest.data.dueDate,
        students,
        now: new Date().toISOString(),
      })
      teacherTasks.set(task.id, task)

      return { task }
    } catch (error) {
      reply.code(400)
      return {
        error: {
          code: 'TEACHER_TASK_CREATE_FAILED',
          message: error instanceof Error ? error.message : '布置背词任务失败。',
          requestId: request.id,
        },
      }
    }
  })

  app.post('/api/v1/teacher/evaluations', (request, reply) => {
    const parsedRequest = createTeacherEvaluationRequestSchema.safeParse(request.body)

    if (!parsedRequest.success) {
      reply.code(400)
      return {
        error: {
          code: 'TEACHER_EVALUATION_REQUEST_INVALID',
          message: '评价参数不完整。',
          requestId: request.id,
        },
      }
    }

    const teacher = teachers.get(parsedRequest.data.teacherId)
    const task = teacherTasks.get(parsedRequest.data.taskId)
    const student = teacherStudents.get(parsedRequest.data.studentId)

    if (!teacher) {
      reply.code(404)
      return {
        error: {
          code: 'TEACHER_NOT_FOUND',
          message: '未找到老师账号。',
          requestId: request.id,
        },
      }
    }

    if (!task || !student) {
      reply.code(404)
      return {
        error: {
          code: 'TEACHER_TASK_STUDENT_NOT_FOUND',
          message: '未找到要评价的任务或学生。',
          requestId: request.id,
        },
      }
    }

    try {
      const evaluation = evaluateStudentTask({
        teacherId: parsedRequest.data.teacherId,
        task,
        studentId: parsedRequest.data.studentId,
        rating: parsedRequest.data.rating,
        comment: parsedRequest.data.comment,
        now: new Date().toISOString(),
      })
      teacherEvaluations.set(evaluation.id, evaluation)

      return { evaluation }
    } catch (error) {
      reply.code(400)
      return {
        error: {
          code: 'TEACHER_EVALUATION_FAILED',
          message: error instanceof Error ? error.message : '发布评价失败。',
          requestId: request.id,
        },
      }
    }
  })

  app.get('/api/v1/teacher/tasks/:taskId/overview', (request, reply) => {
    const { taskId } = request.params as { taskId: string }
    const { teacherId } = request.query as { teacherId?: string }

    if (!teacherId) {
      reply.code(400)
      return {
        error: {
          code: 'TEACHER_ID_REQUIRED',
          message: '查询任务概览需要 teacherId。',
          requestId: request.id,
        },
      }
    }

    const teacher = teachers.get(teacherId)
    const task = teacherTasks.get(taskId)

    if (!teacher || !task || task.teacherId !== teacherId) {
      reply.code(404)
      return {
        error: {
          code: 'TEACHER_TASK_NOT_FOUND',
          message: '未找到老师账号或背词任务。',
          requestId: request.id,
        },
      }
    }

    return {
      overview: buildTeacherTaskOverview({
        task,
        students: Array.from(teacherStudents.values()).filter(
          (student) => student.teacherId === teacherId,
        ),
        progressSummaries: buildTeacherProgressSummaries({
          learners: Array.from(learners.values()),
          plans: Array.from(activeStudyPlans.values()),
          results: Array.from(studyResults.values()),
        }),
        evaluations: Array.from(teacherEvaluations.values()).filter(
          (evaluation) => evaluation.teacherId === teacherId,
        ),
      }),
    }
  })

  return app
}

function getProgressKey(userId: string, wordId: string): string {
  return `${userId}:${wordId}`
}

function addSeconds(isoTimestamp: string, seconds: number): string {
  const date = new Date(isoTimestamp)
  date.setUTCSeconds(date.getUTCSeconds() + seconds)

  return date.toISOString()
}

function applySecurityHeaders(reply: FastifyReply): void {
  reply.header('X-Content-Type-Options', 'nosniff')
  reply.header('X-Frame-Options', 'DENY')
  reply.header('Referrer-Policy', 'no-referrer')
  reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  reply.header('Cross-Origin-Opener-Policy', 'same-origin')
}

function isWriteRequest(request: FastifyRequest): boolean {
  return ['DELETE', 'PATCH', 'POST', 'PUT'].includes(request.method)
}

function consumeRateLimit({
  buckets,
  request,
  options,
  nowMs,
}: {
  buckets: Map<string, RateLimitBucket>
  request: FastifyRequest
  options: RateLimitOptions
  nowMs: number
}): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const routePath = request.url.split('?')[0] ?? request.url
  const key = `${request.ip}:${request.method}:${routePath}`
  const existingBucket = buckets.get(key)
  const bucket =
    existingBucket && existingBucket.resetAtMs > nowMs
      ? existingBucket
      : {
          count: 0,
          resetAtMs: nowMs + options.windowMs,
        }

  bucket.count += 1
  buckets.set(key, bucket)

  if (bucket.count <= options.maxRequests) {
    return { allowed: true }
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAtMs - nowMs) / 1000)),
  }
}
