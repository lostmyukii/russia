import {
  generatedPepRussianVocabularyBooks,
  generatedPepRussianWords,
} from './generated-vocabulary'

export type DevelopmentMilestone = {
  id: number
  title: string
  percentWhenComplete: number
}

export const developmentMilestones = [
  { id: 1, title: '工程基线', percentWhenComplete: 12.5 },
  { id: 2, title: '俄语词库与导入', percentWhenComplete: 25 },
  { id: 3, title: '账户与新手引导', percentWhenComplete: 37.5 },
  { id: 4, title: '首次学习闭环', percentWhenComplete: 50 },
  { id: 5, title: '复习与错词闭环', percentWhenComplete: 62.5 },
  { id: 6, title: '排行榜与打卡', percentWhenComplete: 75 },
  { id: 7, title: 'PWA 与离线同步', percentWhenComplete: 87.5 },
  { id: 8, title: '上线验收', percentWhenComplete: 100 },
] as const satisfies readonly DevelopmentMilestone[]

export type EducationStage = 'junior' | 'senior'

export type LearnerGrade = 'g7' | 'g8' | 'g9' | 'senior-compulsory' | 'senior-selective' | 'gaokao'

export type VocabularyBook = {
  id: string
  slug: string
  name: string
  language: 'ru'
  educationStage: EducationStage
  grade: LearnerGrade
  publisher: 'pep'
  textbookVersion: string
  volume: string
  description: string
  wordCount: number
  source: string
  version: number
  publishedAt: string | null
}

export type RussianWord = {
  id: string
  bookId: string
  unit: string
  unitTitle: string
  lesson: string
  lemma: string
  stressedLemma: string | null
  transcription: string | null
  partOfSpeech:
    | 'noun'
    | 'verb'
    | 'adjective'
    | 'adverb'
    | 'pronoun'
    | 'numeral'
    | 'preposition'
    | 'conjunction'
    | 'particle'
    | 'phrase'
  gender: 'masculine' | 'feminine' | 'neuter' | 'common' | null
  pluralForm: string | null
  aspect: 'perfective' | 'imperfective' | null
  aspectPair: string | null
  conjugation: 'first' | 'second' | 'irregular' | null
  meanings: Array<{
    definitionZh: string
    usageNote: string | null
  }>
  examples: Array<{
    sentenceRu: string
    translationZh: string
    source: string | null
  }>
  audioUrl: string | null
  imageUrl: string | null
  source: string
}

export type VocabularyUnitSummary = {
  unit: string
  unitTitle: string
  wordCount: number
  lessons: Array<{
    lesson: string
    wordCount: number
  }>
}

export type VocabularyImportRow = {
  publisher: string
  textbookVersion: string
  bookSlug: string
  unit: string
  unitTitle: string
  lesson: string
  lemma: string
  stressedLemma: string
  partOfSpeech: string
  definitionZh: string
  gender?: string
  aspect?: string
  aspectPair?: string
  example: string
  exampleZh: string
  audioUrl?: string
  source: string
}

export type VocabularyImportError = {
  rowNumber: number
  field: keyof VocabularyImportRow
  message: string
}

export type GuestUser = {
  id: string
  displayName: string
  accountType: 'guest'
  role: 'learner'
  timezone: string
  createdAt: string
}

export type RegisteredLearner = {
  id: string
  displayName: string
  accountType: 'registered'
  role: 'learner'
  timezone: string
  createdAt: string
}

export type TeacherUser = {
  id: string
  displayName: string
  accountType: 'teacher'
  role: 'teacher'
  timezone: string
  createdAt: string
}

export type LearnerAccount = GuestUser | RegisteredLearner

export type TeacherStudent = {
  id: string
  teacherId: string
  learnerId: string
  displayName: string
  accountType: LearnerAccount['accountType']
  loginUsername: string
  initialPassword: string
  classId: string | null
  joinedAt: string
}

export type TeacherClass = {
  id: string
  teacherId: string
  name: string
  studentIds: string[]
  createdAt: string
}

export type TeacherTaskStatus = 'active' | 'completed' | 'archived'

export type TeacherTask = {
  id: string
  teacherId: string
  title: string
  vocabularyBookId: string
  unit: string
  dailyNewWordTarget: number
  dueDate: string
  assignedStudentIds: string[]
  status: TeacherTaskStatus
  createdAt: string
}

export type TeacherEvaluationRating = 'needs_support' | 'steady' | 'great'

export type TeacherEvaluation = {
  id: string
  teacherId: string
  taskId: string
  studentId: string
  rating: TeacherEvaluationRating
  comment: string
  createdAt: string
}

export type TeacherTaskStudentOverview = {
  student: TeacherStudent
  assignedWordCount: number
  recitedWordCount: number
  masteredWordCount: number
  correctRate: number
  completionRate: number
  evaluationRating: TeacherEvaluationRating | null
  evaluationComment: string | null
}

export type TeacherTaskOverview = {
  task: TeacherTask
  students: TeacherTaskStudentOverview[]
}

export type UserPreferences = {
  educationStage: EducationStage
  grade: LearnerGrade
  bookId: string
  unit: string
  dailyNewWordTarget: number
  reminderEnabled: boolean
}

export type StudyPlan = {
  id: string
  userId: string
  vocabularyBookId: string
  unit: string | null
  dailyNewWordTarget: number
  dailyReviewLimit: number
  targetDate: string | null
  estimatedCompletionDate: string
  status: 'active' | 'paused' | 'completed'
  startedAt: string
}

export type OnboardingRequest = {
  userId: string
  preferences: UserPreferences
  targetDate: string | null
}

export type AnswerQuality = 'again' | 'hard' | 'good' | 'easy'

export type MasteryState = 'new' | 'learning' | 'fuzzy' | 'mistake' | 'mastered' | 'lapsed'

export type ReviewErrorType =
  | 'meaning'
  | 'spelling'
  | 'listening'
  | 'stress'
  | 'grammar'
  | 'context'

export type StudyWordCard = {
  wordId: string
  lemma: string
  stressedLemma: string | null
  partOfSpeech: RussianWord['partOfSpeech']
  definitionZh: string
  grammarHint: string
  exampleRu: string
  exampleZh: string
}

export type RecallPrompt = {
  id: string
  wordId: string
  promptType: 'ru_to_zh' | 'zh_to_ru'
  question: string
  correctAnswer: string
}

export type StudySession = {
  id: string
  userId: string
  planId: string
  vocabularyBookId: string
  unit: string | null
  status: 'active' | 'completed'
  wordCards: StudyWordCard[]
  recallPrompts: RecallPrompt[]
  createdAt: string
}

export type StudySessionCompleteRequest = {
  userId: string
  reviews: Array<{
    wordId: string
    answerQuality: AnswerQuality
    responseMs: number
    errorType?: ReviewErrorType | null | undefined
  }>
}

export type StudySessionResult = {
  sessionId: string
  userId: string
  status: 'completed'
  studiedWordCount: number
  masteredWordCount: number
  correctRate: number
  completedAt: string
}

export type LeaderboardScope = 'daily' | 'weekly' | 'book' | 'class'

export type StudyScoreEventType =
  | 'new_word_mastered'
  | 'review_completed'
  | 'mistake_removed'
  | 'checkin_streak_bonus'
  | 'invalid_repeat_penalty'

export type StudyScoreEvent = {
  id: string
  userId: string
  sessionId: string
  wordId: string | null
  bookId: string | null
  eventType: StudyScoreEventType
  scoreDelta: number
  wordCount: number
  occurredAt: string
  idempotencyKey: string
}

export type CheckinRecord = {
  id: string
  userId: string
  checkinDate: string
  streakDays: number
  completedAt: string
}

export type LeaderboardEntry = {
  scope: LeaderboardScope
  userId: string
  displayName: string
  accountType: LearnerAccount['accountType']
  score: number
  rank: number
  masteredWordCount: number
  reviewCompletionRate: number
  streakDays: number
  bookId: string | null
  classId: string | null
  updatedAt: string
}

export type DashboardTrendPoint = {
  date: string
  score: number
  masteredWordCount: number
  checkedIn: boolean
}

export type DashboardSummary = {
  userId: string
  todayRecitedWordCount: number
  todayMasteredWordCount: number
  dueReviewCount: number
  mistakeWordCount: number
  streakDays: number
  scoreToday: number
  scoreWeek: number
  recentTrend: DashboardTrendPoint[]
}

export type OfflineLearningPack = {
  id: string
  userId: string
  vocabularyBookId: string
  unit: string | null
  sessionId: string
  wordCards: StudyWordCard[]
  recallPrompts: RecallPrompt[]
  cachedAt: string
  expiresAt: string
}

export type OfflineSyncOperationType = 'study_session_complete'

export type OfflineSyncOperationStatus = 'queued' | 'syncing' | 'synced' | 'failed'

export type OfflineStudySessionCompletePayload = {
  sessionId: string
  request: StudySessionCompleteRequest
}

export type OfflineSyncOperation = {
  id: string
  type: OfflineSyncOperationType
  userId: string
  endpoint: string
  method: 'POST'
  idempotencyKey: string
  payload: OfflineStudySessionCompletePayload
  status: OfflineSyncOperationStatus
  retryCount: number
  createdAt: string
  lastError: string | null
}

export type OfflineSyncResult = {
  operationId: string
  idempotencyKey: string
  status: 'synced' | 'failed'
  retryCount: number
  syncedAt: string | null
  error: string | null
}

export type OfflineSyncResponse = {
  syncedCount: number
  failedCount: number
  results: OfflineSyncResult[]
}

export type LaunchReadinessCategory =
  | 'security'
  | 'privacy'
  | 'performance'
  | 'accessibility'
  | 'content'
  | 'backup'
  | 'e2e'

export type LaunchReadinessStatus = 'ready' | 'needs_attention'

export type LaunchReadinessCheck = {
  id: string
  category: LaunchReadinessCategory
  title: string
  status: LaunchReadinessStatus
  evidence: string
}

export type LaunchReadinessReport = {
  generatedAt: string
  overallStatus: LaunchReadinessStatus
  checks: LaunchReadinessCheck[]
}

export type LearnerProgressSummary = {
  userId: string
  displayName: string
  accountType: LearnerAccount['accountType']
  role: 'learner'
  bookName: string
  unit: string | null
  plannedWordCount: number
  recitedWordCount: number
  masteredWordCount: number
  correctRate: number
  lastStudiedAt: string | null
}

export type UserWordProgress = {
  userId: string
  wordId: string
  masteryState: MasteryState
  repetitions: number
  consecutiveCorrect: number
  correctCount: number
  incorrectCount: number
  easeFactor: number
  intervalDays: number
  lastReviewedAt: string | null
  nextReviewAt: string | null
  averageResponseMs: number | null
  lastErrorType: ReviewErrorType | null
  updatedAt: string
}

export type ReviewQueueItem = {
  userId: string
  wordId: string
  lemma: string
  definitionZh: string
  masteryState: MasteryState
  nextReviewAt: string
  priority: 'mistake' | 'due'
}

export type MistakeEntry = {
  userId: string
  wordId: string
  lemma: string
  definitionZh: string
  lastErrorType: ReviewErrorType
  consecutiveCorrect: number
  requiredCorrectCount: 3
  nextReviewAt: string
}

export const pepRussianVocabularyBooks: VocabularyBook[] = generatedPepRussianVocabularyBooks

export const pepRussianWords: RussianWord[] = generatedPepRussianWords

export function getVocabularyBooks(stage?: EducationStage): VocabularyBook[] {
  if (!stage) {
    return pepRussianVocabularyBooks
  }

  return pepRussianVocabularyBooks.filter((book) => book.educationStage === stage)
}

export function getVocabularyBookById(bookId: string): VocabularyBook | undefined {
  return pepRussianVocabularyBooks.find((book) => book.id === bookId)
}

export function createGuestLearner({ now }: { now: string }): GuestUser {
  return {
    id: `guest_${formatTimestampId(now)}`,
    displayName: '访客学习者',
    accountType: 'guest',
    role: 'learner',
    timezone: 'Asia/Shanghai',
    createdAt: now,
  }
}

export function createRegisteredLearner({ now }: { now: string }): RegisteredLearner {
  return {
    id: `learner_demo_${formatTimestampId(now)}`,
    displayName: '登录学习者',
    accountType: 'registered',
    role: 'learner',
    timezone: 'Asia/Shanghai',
    createdAt: now,
  }
}

export function createTeacherAccount({ now }: { now: string }): TeacherUser {
  return {
    id: 'teacher_demo_ru',
    displayName: '俄语老师',
    accountType: 'teacher',
    role: 'teacher',
    timezone: 'Asia/Shanghai',
    createdAt: now,
  }
}

export function addStudentToTeacher({
  teacher,
  learner,
  classId = null,
  now,
}: {
  teacher: TeacherUser
  learner: LearnerAccount
  classId?: string | null
  now: string
}): TeacherStudent {
  const loginCredential = createTeacherStudentLoginCredential(learner)

  return {
    id: `student_${teacher.id}_${learner.id}`,
    teacherId: teacher.id,
    learnerId: learner.id,
    displayName: learner.displayName,
    accountType: learner.accountType,
    loginUsername: loginCredential.username,
    initialPassword: loginCredential.password,
    classId,
    joinedAt: now,
  }
}

export function createTeacherClass({
  teacherId,
  name,
  now,
}: {
  teacherId: string
  name: string
  now: string
}): TeacherClass {
  const trimmedName = name.trim()

  if (!trimmedName) {
    throw new Error('班级名称不能为空')
  }

  return {
    id: `class_${teacherId}_${slugifyAccountPart(trimmedName)}`,
    teacherId,
    name: trimmedName,
    studentIds: [],
    createdAt: now,
  }
}

export function createTeacherManagedStudentAccount({
  teacher,
  displayName,
  username,
  password,
  classId,
  now,
}: {
  teacher: TeacherUser
  displayName: string
  username: string
  password: string
  classId?: string | null
  now: string
}): { learner: RegisteredLearner; student: TeacherStudent } {
  const trimmedDisplayName = displayName.trim()
  const trimmedUsername = username.trim()
  const trimmedPassword = password.trim()

  if (!trimmedDisplayName) {
    throw new Error('学生姓名不能为空')
  }

  if (!trimmedUsername) {
    throw new Error('学生账号不能为空')
  }

  if (!trimmedPassword) {
    throw new Error('学生密码不能为空')
  }

  const learner: RegisteredLearner = {
    id: `learner_${slugifyAccountPart(trimmedUsername)}`,
    displayName: trimmedDisplayName,
    accountType: 'registered',
    role: 'learner',
    timezone: 'Asia/Shanghai',
    createdAt: now,
  }

  return {
    learner,
    student: {
      id: `student_${teacher.id}_${learner.id}`,
      teacherId: teacher.id,
      learnerId: learner.id,
      displayName: learner.displayName,
      accountType: learner.accountType,
      loginUsername: trimmedUsername,
      initialPassword: trimmedPassword,
      classId: classId ?? null,
      joinedAt: now,
    },
  }
}

function slugifyAccountPart(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '_')
    .replace(/^_+|_+$/g, '')

  return slug || 'default'
}

function createTeacherStudentLoginCredential(learner: LearnerAccount): {
  username: string
  password: string
} {
  if (learner.accountType === 'registered') {
    return { username: 'student01', password: 'ru123456' }
  }

  return { username: 'student02', password: 'ru654321' }
}

export function createTeacherTask({
  teacherId,
  title,
  vocabularyBookId,
  unit,
  dailyNewWordTarget,
  dueDate,
  students,
  now,
}: {
  teacherId: string
  title: string
  vocabularyBookId: string
  unit: string
  dailyNewWordTarget: number
  dueDate: string
  students: TeacherStudent[]
  now: string
}): TeacherTask {
  const book = getVocabularyBookById(vocabularyBookId)

  if (!book) {
    throw new Error('未找到对应的人教版俄语册别')
  }

  const selectedUnit = groupRussianWordsByBookId(vocabularyBookId).find(
    (unitSummary) => unitSummary.unit === unit,
  )

  if (!selectedUnit) {
    throw new Error('所选任务单元不属于当前人教版俄语册别')
  }

  if (students.length === 0) {
    throw new Error('布置背词任务至少需要一个学生')
  }

  if (students.some((student) => student.teacherId !== teacherId)) {
    throw new Error('任务学生不属于当前老师')
  }

  return {
    id: `task_${teacherId}_${vocabularyBookId}_unit_${unit}`,
    teacherId,
    title,
    vocabularyBookId,
    unit,
    dailyNewWordTarget,
    dueDate,
    assignedStudentIds: students.map((student) => student.id),
    status: 'active',
    createdAt: now,
  }
}

export function evaluateStudentTask({
  teacherId,
  task,
  studentId,
  rating,
  comment,
  now,
}: {
  teacherId: string
  task: TeacherTask
  studentId: string
  rating: TeacherEvaluationRating
  comment: string
  now: string
}): TeacherEvaluation {
  if (task.teacherId !== teacherId) {
    throw new Error('任务不属于当前老师')
  }

  if (!task.assignedStudentIds.includes(studentId)) {
    throw new Error('学生不在当前背词任务中')
  }

  return {
    id: `eval_${task.id}_${studentId}`,
    teacherId,
    taskId: task.id,
    studentId,
    rating,
    comment,
    createdAt: now,
  }
}

export function createStudyPlanFromOnboarding({
  userId,
  preferences,
  targetDate,
  now,
}: OnboardingRequest & { now: string }): {
  userPreferences: UserPreferences
  studyPlan: StudyPlan
} {
  const book = getVocabularyBookById(preferences.bookId)

  if (!book) {
    throw new Error('未找到对应的人教版俄语册别')
  }

  if (book.educationStage !== preferences.educationStage || book.grade !== preferences.grade) {
    throw new Error('所选学段年级与人教版俄语册别不匹配')
  }

  const selectedUnit = groupRussianWordsByBookId(book.id).find(
    (unitSummary) => unitSummary.unit === preferences.unit,
  )

  if (!selectedUnit) {
    throw new Error('所选单元不属于当前人教版俄语册别')
  }

  const studyDays = Math.max(
    0,
    Math.ceil(selectedUnit.wordCount / preferences.dailyNewWordTarget) - 1,
  )

  return {
    userPreferences: preferences,
    studyPlan: {
      id: `plan_${userId}_${book.id}`,
      userId,
      vocabularyBookId: book.id,
      unit: selectedUnit.unit,
      dailyNewWordTarget: preferences.dailyNewWordTarget,
      dailyReviewLimit: 30,
      targetDate,
      estimatedCompletionDate: addUtcDays(now, studyDays),
      status: 'active',
      startedAt: now,
    },
  }
}

export function groupRussianWordsByUnit(bookSlug: string): VocabularyUnitSummary[] {
  const book = pepRussianVocabularyBooks.find((candidate) => candidate.slug === bookSlug)

  if (!book) {
    return []
  }

  return groupWordsByUnit(pepRussianWords.filter((word) => word.bookId === book.id))
}

export function groupRussianWordsByBookId(bookId: string): VocabularyUnitSummary[] {
  return groupWordsByUnit(pepRussianWords.filter((word) => word.bookId === bookId))
}

export function createStudySessionFromPlan({
  plan,
  now,
}: {
  plan: StudyPlan
  now: string
}): StudySession {
  const words = pepRussianWords
    .filter((word) => word.bookId === plan.vocabularyBookId)
    .filter((word) => (plan.unit ? word.unit === plan.unit : true))
    .slice(0, plan.dailyNewWordTarget)

  if (words.length === 0) {
    throw new Error('当前学习计划没有可学习的人教版俄语词条')
  }

  const wordCards = words.map(toStudyWordCard)

  return {
    id: `session_${plan.userId}_${plan.vocabularyBookId}_${now.slice(0, 10).replace(/\D/g, '')}`,
    userId: plan.userId,
    planId: plan.id,
    vocabularyBookId: plan.vocabularyBookId,
    unit: plan.unit,
    status: 'active',
    wordCards,
    recallPrompts: wordCards.map((card) => ({
      id: `prompt_${card.wordId}_meaning`,
      wordId: card.wordId,
      promptType: 'ru_to_zh',
      question: card.lemma,
      correctAnswer: card.definitionZh,
    })),
    createdAt: now,
  }
}

export function createOfflineLearningPack({
  session,
  now,
  ttlDays = 3,
}: {
  session: StudySession
  now: string
  ttlDays?: number
}): OfflineLearningPack {
  return {
    id: `pack_${session.userId}_${session.vocabularyBookId}_${session.unit ?? 'all'}`,
    userId: session.userId,
    vocabularyBookId: session.vocabularyBookId,
    unit: session.unit,
    sessionId: session.id,
    wordCards: session.wordCards,
    recallPrompts: session.recallPrompts,
    cachedAt: now,
    expiresAt: addUtcDaysIso(now, ttlDays),
  }
}

export function createOfflineSyncOperation({
  type,
  userId,
  endpoint,
  idempotencyKey,
  payload,
  now,
}: {
  type: OfflineSyncOperationType
  userId: string
  endpoint: string
  idempotencyKey: string
  payload: OfflineStudySessionCompletePayload
  now: string
}): OfflineSyncOperation {
  return {
    id: `offline_${idempotencyKey}`,
    type,
    userId,
    endpoint,
    method: 'POST',
    idempotencyKey,
    payload,
    status: 'queued',
    retryCount: 0,
    createdAt: now,
    lastError: null,
  }
}

export function markOfflineSyncOperationFailed({
  operation,
  error,
}: {
  operation: OfflineSyncOperation
  error: string
}): OfflineSyncOperation {
  return {
    ...operation,
    status: 'failed',
    retryCount: operation.retryCount + 1,
    lastError: error,
  }
}

export function markOfflineSyncOperationSynced({
  operation,
}: {
  operation: OfflineSyncOperation
  syncedAt: string
}): OfflineSyncOperation {
  return {
    ...operation,
    status: 'synced',
    lastError: null,
  }
}

export function getQueuedOfflineSyncOperations(
  operations: OfflineSyncOperation[],
): OfflineSyncOperation[] {
  return dedupeOfflineSyncOperations(
    operations.filter((operation) => ['queued', 'failed'].includes(operation.status)),
  )
}

export function dedupeOfflineSyncOperations(
  operations: OfflineSyncOperation[],
): OfflineSyncOperation[] {
  const operationMap = new Map<string, OfflineSyncOperation>()

  operations
    .slice()
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .forEach((operation) => {
      if (!operationMap.has(operation.idempotencyKey)) {
        operationMap.set(operation.idempotencyKey, operation)
      }
    })

  return Array.from(operationMap.values()).sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  )
}

export function createMvpLaunchReadinessChecks(): LaunchReadinessCheck[] {
  return [
    {
      id: 'security_headers',
      category: 'security',
      title: '安全响应头',
      status: 'ready',
      evidence: 'API 响应统一返回 nosniff、DENY、Referrer-Policy 和权限策略。',
    },
    {
      id: 'write_rate_limit',
      category: 'security',
      title: '写请求限流',
      status: 'ready',
      evidence: '验证码、登录、作答提交、打卡和排行榜刷新同类写入口受统一限流保护。',
    },
    {
      id: 'log_redaction',
      category: 'privacy',
      title: '日志敏感字段脱敏',
      status: 'ready',
      evidence: '结构化日志进入输出前会脱敏 token、cookie、邮箱、手机号等字段。',
    },
    {
      id: 'performance_budget',
      category: 'performance',
      title: '性能预算',
      status: 'ready',
      evidence: '生产构建和 PWA 预缓存通过，首页交互保持在轻量 MVP 范围。',
    },
    {
      id: 'accessibility_mobile',
      category: 'accessibility',
      title: '移动端可访问性',
      status: 'ready',
      evidence: '核心按钮保持 44px 以上点击区域，375px/移动端 e2e 覆盖关键学习路径。',
    },
    {
      id: 'content_source_validation',
      category: 'content',
      title: '内容来源校验',
      status: 'ready',
      evidence: '词库导入必须通过 CSV dry-run 校验并保留 source、册别、单元和课次字段。',
    },
    {
      id: 'backup_restore_runbook',
      category: 'backup',
      title: '备份恢复预案',
      status: 'ready',
      evidence: '发布清单要求上线前完成 PostgreSQL 备份、恢复演练和回滚记录。',
    },
    {
      id: 'staging_e2e',
      category: 'e2e',
      title: '端到端验收',
      status: 'ready',
      evidence: 'release check 串联 lint、typecheck、unit、build、db validate、词库校验和 e2e。',
    },
  ]
}

export function buildLaunchReadinessReport({
  checks,
  generatedAt,
}: {
  checks: LaunchReadinessCheck[]
  generatedAt: string
}): LaunchReadinessReport {
  return {
    generatedAt,
    overallStatus: checks.every((check) => check.status === 'ready') ? 'ready' : 'needs_attention',
    checks,
  }
}

export function redactSensitiveLogPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveLogPayload(item))
  }

  if (!isPlainRecord(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      isSensitiveLogKey(key) ? '[REDACTED]' : redactSensitiveLogPayload(entryValue),
    ]),
  )
}

export function completeStudySession({
  session,
  request,
  now,
}: {
  session: StudySession
  request: StudySessionCompleteRequest
  now: string
}): StudySessionResult {
  if (session.userId !== request.userId) {
    throw new Error('学习会话不属于当前学习者')
  }

  const sessionWordIds = new Set(session.wordCards.map((card) => card.wordId))
  const validReviews = request.reviews.filter((review) => sessionWordIds.has(review.wordId))
  const masteredWordCount = validReviews.filter((review) =>
    ['good', 'easy'].includes(review.answerQuality),
  ).length
  const studiedWordCount = validReviews.length

  return {
    sessionId: session.id,
    userId: session.userId,
    status: 'completed',
    studiedWordCount,
    masteredWordCount,
    correctRate: studiedWordCount === 0 ? 0 : masteredWordCount / studiedWordCount,
    completedAt: now,
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSensitiveLogKey(key: string): boolean {
  return /(authorization|cookie|email|password|phone|secret|smsCode|token|verificationCode|otp)/i.test(
    key,
  )
}

export function buildScoreEventsForStudyResult({
  session,
  result,
  idempotencyKey,
}: {
  session: StudySession
  result: StudySessionResult
  idempotencyKey: string
}): StudyScoreEvent[] {
  const events: StudyScoreEvent[] = []

  if (result.masteredWordCount > 0) {
    events.push({
      id: `score_${idempotencyKey}_mastered`,
      userId: result.userId,
      sessionId: session.id,
      wordId: null,
      bookId: session.vocabularyBookId,
      eventType: 'new_word_mastered',
      scoreDelta: result.masteredWordCount * 10,
      wordCount: result.masteredWordCount,
      occurredAt: result.completedAt,
      idempotencyKey,
    })
  }

  const reviewedWordCount = Math.max(0, result.studiedWordCount - result.masteredWordCount)

  if (reviewedWordCount > 0) {
    events.push({
      id: `score_${idempotencyKey}_review`,
      userId: result.userId,
      sessionId: session.id,
      wordId: null,
      bookId: session.vocabularyBookId,
      eventType: 'review_completed',
      scoreDelta: reviewedWordCount * 3,
      wordCount: reviewedWordCount,
      occurredAt: result.completedAt,
      idempotencyKey,
    })
  }

  return events
}

export function buildMistakeRemovedScoreEvent({
  progress,
  idempotencyKey,
  now,
}: {
  progress: UserWordProgress
  idempotencyKey: string
  now: string
}): StudyScoreEvent | null {
  if (progress.masteryState === 'mistake' || progress.lastErrorType !== null) {
    return null
  }

  return {
    id: `score_${idempotencyKey}_mistake_removed`,
    userId: progress.userId,
    sessionId: `mistake_${progress.userId}_${progress.wordId}`,
    wordId: progress.wordId,
    bookId: getRussianWordById(progress.wordId)?.bookId ?? null,
    eventType: 'mistake_removed',
    scoreDelta: 8,
    wordCount: 1,
    occurredAt: now,
    idempotencyKey,
  }
}

export function createCheckinRecord({
  userId,
  checkinDate,
  existingCheckins,
  now,
}: {
  userId: string
  checkinDate: string
  existingCheckins: CheckinRecord[]
  now: string
}): CheckinRecord {
  const existing = existingCheckins.find(
    (checkin) => checkin.userId === userId && checkin.checkinDate === checkinDate,
  )

  if (existing) {
    return existing
  }

  const previousDate = addUtcDays(`${checkinDate}T00:00:00.000Z`, -1)
  const previousCheckin = existingCheckins
    .filter((checkin) => checkin.userId === userId && checkin.checkinDate < checkinDate)
    .sort((left, right) => right.checkinDate.localeCompare(left.checkinDate))[0]
  const streakDays =
    previousCheckin?.checkinDate === previousDate ? previousCheckin.streakDays + 1 : 1

  return {
    id: `checkin_${userId}_${checkinDate}`,
    userId,
    checkinDate,
    streakDays,
    completedAt: now,
  }
}

export function createInitialWordProgress({
  userId,
  wordId,
  now,
}: {
  userId: string
  wordId: string
  now: string
}): UserWordProgress {
  return {
    userId,
    wordId,
    masteryState: 'new',
    repetitions: 0,
    consecutiveCorrect: 0,
    correctCount: 0,
    incorrectCount: 0,
    easeFactor: 2.5,
    intervalDays: 0,
    lastReviewedAt: null,
    nextReviewAt: now,
    averageResponseMs: null,
    lastErrorType: null,
    updatedAt: now,
  }
}

export function applySrsReview({
  previous,
  answerQuality,
  responseMs,
  errorType,
  now,
}: {
  previous: UserWordProgress
  answerQuality: AnswerQuality
  responseMs: number
  errorType: ReviewErrorType | null
  now: string
}): UserWordProgress {
  const isCorrect = answerQuality !== 'again'
  const intervalDays = getSrsIntervalDays(answerQuality)
  const nextReviewAt =
    answerQuality === 'again' ? addUtcMinutes(now, 10) : addUtcDaysIso(now, intervalDays)
  const consecutiveCorrect = isCorrect ? previous.consecutiveCorrect + 1 : 0

  return {
    ...previous,
    masteryState: getNextMasteryState(answerQuality, consecutiveCorrect),
    repetitions: previous.repetitions + 1,
    consecutiveCorrect,
    correctCount: previous.correctCount + (isCorrect ? 1 : 0),
    incorrectCount: previous.incorrectCount + (isCorrect ? 0 : 1),
    easeFactor: adjustEaseFactor(previous.easeFactor, answerQuality),
    intervalDays,
    lastReviewedAt: now,
    nextReviewAt,
    averageResponseMs: averageResponse(
      previous.averageResponseMs,
      previous.repetitions,
      responseMs,
    ),
    lastErrorType: isCorrect ? null : (errorType ?? 'meaning'),
    updatedAt: now,
  }
}

export function getDueReviewQueue({
  progressList,
  now,
}: {
  progressList: UserWordProgress[]
  now: string
}): ReviewQueueItem[] {
  return progressList
    .filter((progress) => progress.nextReviewAt !== null && progress.nextReviewAt <= now)
    .map((progress) => {
      const word = getRussianWordById(progress.wordId)

      return {
        userId: progress.userId,
        wordId: progress.wordId,
        lemma: word?.lemma ?? progress.wordId,
        definitionZh: word?.meanings[0]?.definitionZh ?? '待补充释义',
        masteryState: progress.masteryState,
        nextReviewAt: progress.nextReviewAt ?? now,
        priority: progress.masteryState === 'mistake' ? 'mistake' : 'due',
      } satisfies ReviewQueueItem
    })
    .sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority === 'mistake' ? -1 : 1
      }

      return left.nextReviewAt.localeCompare(right.nextReviewAt)
    })
}

export function buildMistakeEntries({
  progressList,
}: {
  progressList: UserWordProgress[]
}): MistakeEntry[] {
  return progressList
    .filter(
      (progress) =>
        progress.masteryState === 'mistake' &&
        progress.lastErrorType !== null &&
        progress.nextReviewAt !== null,
    )
    .map((progress) => {
      const word = getRussianWordById(progress.wordId)

      return {
        userId: progress.userId,
        wordId: progress.wordId,
        lemma: word?.lemma ?? progress.wordId,
        definitionZh: word?.meanings[0]?.definitionZh ?? '待补充释义',
        lastErrorType: progress.lastErrorType ?? 'meaning',
        consecutiveCorrect: progress.consecutiveCorrect,
        requiredCorrectCount: 3,
        nextReviewAt: progress.nextReviewAt ?? new Date(0).toISOString(),
      }
    })
}

export function applyMistakeEliminationReview({
  previous,
  responseMs,
  now,
}: {
  previous: UserWordProgress
  responseMs: number
  now: string
}): UserWordProgress {
  const consecutiveCorrect = previous.consecutiveCorrect + 1
  const resolved = consecutiveCorrect >= 3

  return {
    ...previous,
    masteryState: resolved ? 'learning' : 'mistake',
    repetitions: previous.repetitions + 1,
    consecutiveCorrect,
    correctCount: previous.correctCount + 1,
    easeFactor: adjustEaseFactor(previous.easeFactor, 'good'),
    intervalDays: resolved ? 2 : 0,
    lastReviewedAt: now,
    nextReviewAt: resolved ? addUtcDaysIso(now, 2) : addUtcMinutes(now, 10),
    averageResponseMs: averageResponse(
      previous.averageResponseMs,
      previous.repetitions,
      responseMs,
    ),
    lastErrorType: resolved ? null : previous.lastErrorType,
    updatedAt: now,
  }
}

export function buildTeacherProgressSummaries({
  learners,
  plans,
  results,
}: {
  learners: LearnerAccount[]
  plans: StudyPlan[]
  results: StudySessionResult[]
}): LearnerProgressSummary[] {
  return learners
    .map((learner) => {
      const plan = plans.find((candidate) => candidate.userId === learner.id)
      const result = results
        .filter((candidate) => candidate.userId === learner.id)
        .sort((left, right) => right.completedAt.localeCompare(left.completedAt))[0]

      if (!plan) {
        return null
      }

      const book = getVocabularyBookById(plan.vocabularyBookId)
      const selectedUnit = groupRussianWordsByBookId(plan.vocabularyBookId).find(
        (unitSummary) => unitSummary.unit === plan.unit,
      )

      return {
        userId: learner.id,
        displayName: learner.displayName,
        accountType: learner.accountType,
        role: 'learner',
        bookName: book?.name ?? '未知人教版俄语册别',
        unit: plan.unit,
        plannedWordCount: selectedUnit?.wordCount ?? book?.wordCount ?? 0,
        recitedWordCount: result?.studiedWordCount ?? 0,
        masteredWordCount: result?.masteredWordCount ?? 0,
        correctRate: result?.correctRate ?? 0,
        lastStudiedAt: result?.completedAt ?? null,
      } satisfies LearnerProgressSummary
    })
    .filter((summary): summary is LearnerProgressSummary => summary !== null)
    .sort((left, right) => {
      if (!left.lastStudiedAt && !right.lastStudiedAt) {
        return left.displayName.localeCompare(right.displayName, 'zh-CN')
      }

      if (!left.lastStudiedAt) {
        return 1
      }

      if (!right.lastStudiedAt) {
        return -1
      }

      return right.lastStudiedAt.localeCompare(left.lastStudiedAt)
    })
}

export function buildTeacherTaskOverview({
  task,
  students,
  progressSummaries,
  evaluations,
}: {
  task: TeacherTask
  students: TeacherStudent[]
  progressSummaries: LearnerProgressSummary[]
  evaluations: TeacherEvaluation[]
}): TeacherTaskOverview {
  const selectedUnit = groupRussianWordsByBookId(task.vocabularyBookId).find(
    (unitSummary) => unitSummary.unit === task.unit,
  )
  const assignedWordCount =
    selectedUnit?.wordCount ?? getVocabularyBookById(task.vocabularyBookId)?.wordCount ?? 0

  return {
    task,
    students: task.assignedStudentIds
      .map((studentId) => students.find((student) => student.id === studentId))
      .filter((student): student is TeacherStudent => student !== undefined)
      .map((student) => {
        const progress = progressSummaries.find(
          (summary) => summary.userId === student.learnerId && summary.unit === task.unit,
        )
        const evaluation = evaluations
          .filter((candidate) => candidate.taskId === task.id && candidate.studentId === student.id)
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0]
        const recitedWordCount = Math.min(progress?.recitedWordCount ?? 0, assignedWordCount)
        const masteredWordCount = Math.min(progress?.masteredWordCount ?? 0, assignedWordCount)

        return {
          student,
          assignedWordCount,
          recitedWordCount,
          masteredWordCount,
          correctRate: progress?.correctRate ?? 0,
          completionRate: assignedWordCount === 0 ? 0 : recitedWordCount / assignedWordCount,
          evaluationRating: evaluation?.rating ?? null,
          evaluationComment: evaluation?.comment ?? null,
        } satisfies TeacherTaskStudentOverview
      }),
  }
}

export function buildLeaderboardEntries({
  scope,
  learners,
  scoreEvents,
  checkins,
  now,
  bookId,
  classId,
  classLearnerIds,
}: {
  scope: LeaderboardScope
  learners: LearnerAccount[]
  scoreEvents: StudyScoreEvent[]
  checkins: CheckinRecord[]
  now: string
  bookId?: string | null
  classId?: string | null
  classLearnerIds?: string[]
}): LeaderboardEntry[] {
  const allowedLearnerIds = scope === 'class' && classLearnerIds ? new Set(classLearnerIds) : null
  const scopedEvents = scoreEvents.filter((event) => {
    if (allowedLearnerIds && !allowedLearnerIds.has(event.userId)) {
      return false
    }

    if (scope === 'daily') {
      return isSameDate(event.occurredAt, now)
    }

    if (scope === 'weekly') {
      return isSameWeek(event.occurredAt, now)
    }

    if (scope === 'book') {
      return event.bookId === bookId
    }

    return true
  })
  const eventBookId = bookId ?? scopedEvents.find((event) => event.bookId)?.bookId ?? null
  const entries = learners
    .filter((learner) => (allowedLearnerIds ? allowedLearnerIds.has(learner.id) : true))
    .map((learner) => {
      const learnerEvents = scopedEvents.filter((event) => event.userId === learner.id)
      const score = learnerEvents.reduce((sum, event) => sum + event.scoreDelta, 0)
      const masteredWordCount = learnerEvents
        .filter((event) => event.eventType === 'new_word_mastered')
        .reduce((sum, event) => sum + event.wordCount, 0)
      const completedWordCount = learnerEvents
        .filter((event) => event.eventType !== 'invalid_repeat_penalty')
        .reduce((sum, event) => sum + event.wordCount, 0)

      return {
        scope,
        userId: learner.id,
        displayName: learner.displayName,
        accountType: learner.accountType,
        score,
        rank: 1,
        masteredWordCount,
        reviewCompletionRate: completedWordCount === 0 ? 0 : masteredWordCount / completedWordCount,
        streakDays: getLatestStreakDays(learner.id, checkins, now),
        bookId: eventBookId,
        classId: scope === 'class' ? (classId ?? null) : null,
        updatedAt: now,
      } satisfies LeaderboardEntry
    })
    .filter((entry) => entry.score > 0 || entry.streakDays > 0)
    .sort((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score
      }

      if (left.masteredWordCount !== right.masteredWordCount) {
        return right.masteredWordCount - left.masteredWordCount
      }

      return left.displayName.localeCompare(right.displayName, 'zh-CN')
    })

  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }))
}

export function buildDashboardSummary({
  userId,
  plan,
  results,
  progressList,
  scoreEvents,
  checkins,
  now,
}: {
  userId: string
  plan: StudyPlan | null
  results: StudySessionResult[]
  progressList: UserWordProgress[]
  scoreEvents: StudyScoreEvent[]
  checkins: CheckinRecord[]
  now: string
}): DashboardSummary {
  const todayResults = results.filter(
    (result) => result.userId === userId && isSameDate(result.completedAt, now),
  )
  const userProgress = progressList.filter((progress) => progress.userId === userId)
  const dueReviewCount = getDueReviewQueue({ progressList: userProgress, now }).length
  const mistakeWordCount = buildMistakeEntries({ progressList: userProgress }).length
  const recentTrend = Array.from({ length: 7 }, (_, index) => {
    const date = addUtcDays(now, index - 6)
    const dayEvents = scoreEvents.filter(
      (event) => event.userId === userId && event.occurredAt.slice(0, 10) === date,
    )

    return {
      date,
      score: dayEvents.reduce((sum, event) => sum + event.scoreDelta, 0),
      masteredWordCount: dayEvents
        .filter((event) => event.eventType === 'new_word_mastered')
        .reduce((sum, event) => sum + event.wordCount, 0),
      checkedIn: checkins.some(
        (checkin) => checkin.userId === userId && checkin.checkinDate === date,
      ),
    } satisfies DashboardTrendPoint
  })
  void plan

  return {
    userId,
    todayRecitedWordCount: todayResults.reduce((sum, result) => sum + result.studiedWordCount, 0),
    todayMasteredWordCount: todayResults.reduce((sum, result) => sum + result.masteredWordCount, 0),
    dueReviewCount,
    mistakeWordCount,
    streakDays: getLatestStreakDays(userId, checkins, now),
    scoreToday: sumScoreForPeriod({ userId, scoreEvents, now, period: 'daily' }),
    scoreWeek: sumScoreForPeriod({ userId, scoreEvents, now, period: 'weekly' }),
    recentTrend,
  }
}

export function validateVocabularyImportRows(rows: VocabularyImportRow[]): {
  validRows: VocabularyImportRow[]
  errors: VocabularyImportError[]
} {
  const errors: VocabularyImportError[] = []
  const validRows: VocabularyImportRow[] = []

  rows.forEach((row, index) => {
    const rowNumber = index + 1
    const rowErrors: VocabularyImportError[] = []

    if (row.publisher !== 'pep') {
      rowErrors.push({ rowNumber, field: 'publisher', message: '教材出版社必须为 pep' })
    }

    if (!row.textbookVersion.trim()) {
      rowErrors.push({ rowNumber, field: 'textbookVersion', message: '人教版教材版本不能为空' })
    }

    if (!row.bookSlug.trim()) {
      rowErrors.push({ rowNumber, field: 'bookSlug', message: '册别 slug 不能为空' })
    }

    if (!row.unit.trim()) {
      rowErrors.push({ rowNumber, field: 'unit', message: '单元编号不能为空' })
    }

    if (!row.unitTitle.trim()) {
      rowErrors.push({ rowNumber, field: 'unitTitle', message: '人教版教材单元名称不能为空' })
    }

    if (!row.lesson.trim()) {
      rowErrors.push({ rowNumber, field: 'lesson', message: '课次不能为空' })
    }

    if (!row.lemma.trim()) {
      rowErrors.push({ rowNumber, field: 'lemma', message: '俄语原形不能为空' })
    }

    if (!row.partOfSpeech.trim()) {
      rowErrors.push({ rowNumber, field: 'partOfSpeech', message: '词性不能为空' })
    }

    if (!row.definitionZh.trim()) {
      rowErrors.push({ rowNumber, field: 'definitionZh', message: '中文释义不能为空' })
    }

    if (!row.source.trim()) {
      rowErrors.push({ rowNumber, field: 'source', message: '词条来源不能为空' })
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors)
      return
    }

    validRows.push(row)
  })

  return { validRows, errors }
}

function getRussianWordById(wordId: string): RussianWord | undefined {
  return pepRussianWords.find((word) => word.id === wordId)
}

function getSrsIntervalDays(answerQuality: AnswerQuality): number {
  if (answerQuality === 'hard') {
    return 1
  }

  if (answerQuality === 'good') {
    return 2
  }

  if (answerQuality === 'easy') {
    return 4
  }

  return 0
}

function getNextMasteryState(
  answerQuality: AnswerQuality,
  consecutiveCorrect: number,
): MasteryState {
  if (answerQuality === 'again') {
    return 'mistake'
  }

  if (answerQuality === 'hard') {
    return 'fuzzy'
  }

  if (answerQuality === 'easy') {
    return 'mastered'
  }

  return consecutiveCorrect >= 2 ? 'mastered' : 'learning'
}

function adjustEaseFactor(currentEaseFactor: number, answerQuality: AnswerQuality): number {
  const deltaByQuality = {
    again: -0.2,
    hard: -0.1,
    good: 0,
    easy: 0.15,
  } as const
  const adjusted = currentEaseFactor + deltaByQuality[answerQuality]

  return Math.min(2.8, Math.max(1.3, Number(adjusted.toFixed(2))))
}

function averageResponse(
  previousAverageResponseMs: number | null,
  previousRepetitions: number,
  responseMs: number,
): number {
  if (previousAverageResponseMs === null || previousRepetitions === 0) {
    return responseMs
  }

  return Math.round(
    (previousAverageResponseMs * previousRepetitions + responseMs) / (previousRepetitions + 1),
  )
}

function groupWordsByUnit(words: RussianWord[]): VocabularyUnitSummary[] {
  const unitMap = new Map<
    string,
    { unitTitle: string; lessons: Map<string, number>; wordCount: number }
  >()

  words.forEach((word) => {
    const current = unitMap.get(word.unit) ?? {
      unitTitle: word.unitTitle,
      lessons: new Map<string, number>(),
      wordCount: 0,
    }

    current.wordCount += 1
    current.lessons.set(word.lesson, (current.lessons.get(word.lesson) ?? 0) + 1)
    unitMap.set(word.unit, current)
  })

  return Array.from(unitMap.entries())
    .sort(([leftUnit], [rightUnit]) =>
      leftUnit.localeCompare(rightUnit, 'zh-CN', { numeric: true }),
    )
    .map(([unit, summary]) => ({
      unit,
      unitTitle: summary.unitTitle,
      wordCount: summary.wordCount,
      lessons: Array.from(summary.lessons.entries())
        .sort(([leftLesson], [rightLesson]) =>
          leftLesson.localeCompare(rightLesson, 'zh-CN', { numeric: true }),
        )
        .map(([lesson, wordCount]) => ({ lesson, wordCount })),
    }))
}

function toStudyWordCard(word: RussianWord): StudyWordCard {
  return {
    wordId: word.id,
    lemma: word.lemma,
    stressedLemma: word.stressedLemma,
    partOfSpeech: word.partOfSpeech,
    definitionZh: word.meanings[0]?.definitionZh ?? '待补充释义',
    grammarHint: getGrammarHint(word),
    exampleRu: word.examples[0]?.sentenceRu ?? `${word.lemma}.`,
    exampleZh: word.examples[0]?.translationZh ?? '待补充例句翻译',
  }
}

function getGrammarHint(word: RussianWord): string {
  if (word.partOfSpeech === 'noun') {
    const genderHints = {
      masculine: '阳性名词',
      feminine: '阴性名词',
      neuter: '中性名词',
      common: '通性名词',
    } as const

    return word.gender ? genderHints[word.gender] : '名词'
  }

  if (word.partOfSpeech === 'verb') {
    const aspectHints = {
      perfective: '完成体动词',
      imperfective: '未完成体动词',
    } as const

    return word.aspect ? aspectHints[word.aspect] : '动词'
  }

  return word.partOfSpeech
}

function isSameDate(leftIsoTimestamp: string, rightIsoTimestamp: string): boolean {
  return leftIsoTimestamp.slice(0, 10) === rightIsoTimestamp.slice(0, 10)
}

function isSameWeek(leftIsoTimestamp: string, rightIsoTimestamp: string): boolean {
  return getUtcWeekStart(leftIsoTimestamp) === getUtcWeekStart(rightIsoTimestamp)
}

function getUtcWeekStart(isoTimestamp: string): string {
  const date = new Date(isoTimestamp)
  const day = date.getUTCDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  date.setUTCDate(date.getUTCDate() + mondayOffset)

  return date.toISOString().slice(0, 10)
}

function getLatestStreakDays(userId: string, checkins: CheckinRecord[], now: string): number {
  const latest = checkins
    .filter((checkin) => checkin.userId === userId && checkin.checkinDate <= now.slice(0, 10))
    .sort((left, right) => right.checkinDate.localeCompare(left.checkinDate))[0]

  return latest?.streakDays ?? 0
}

function sumScoreForPeriod({
  userId,
  scoreEvents,
  now,
  period,
}: {
  userId: string
  scoreEvents: StudyScoreEvent[]
  now: string
  period: 'daily' | 'weekly'
}): number {
  return scoreEvents
    .filter((event) => event.userId === userId)
    .filter((event) =>
      period === 'daily' ? isSameDate(event.occurredAt, now) : isSameWeek(event.occurredAt, now),
    )
    .reduce((sum, event) => sum + event.scoreDelta, 0)
}

function formatTimestampId(isoTimestamp: string): string {
  return isoTimestamp.replace(/\D/g, '').slice(0, 14)
}

function addUtcDays(isoTimestamp: string, days: number): string {
  const date = new Date(isoTimestamp)
  date.setUTCDate(date.getUTCDate() + days)

  return date.toISOString().slice(0, 10)
}

function addUtcDaysIso(isoTimestamp: string, days: number): string {
  const date = new Date(isoTimestamp)
  date.setUTCDate(date.getUTCDate() + days)

  return date.toISOString()
}

function addUtcMinutes(isoTimestamp: string, minutes: number): string {
  const date = new Date(isoTimestamp)
  date.setUTCMinutes(date.getUTCMinutes() + minutes)

  return date.toISOString()
}
