import { z } from 'zod'

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('russian-wordscodex-api'),
})

export type HealthResponse = z.infer<typeof healthResponseSchema>

export const educationStageSchema = z.enum(['junior', 'senior'])

export const learnerGradeSchema = z.enum([
  'g7',
  'g8',
  'g9',
  'senior-compulsory',
  'senior-selective',
  'gaokao',
])

export const russianPartOfSpeechSchema = z.enum([
  'noun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'numeral',
  'preposition',
  'conjunction',
  'particle',
  'phrase',
])

export const vocabularyBookSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  language: z.literal('ru'),
  educationStage: educationStageSchema,
  grade: learnerGradeSchema,
  publisher: z.literal('pep'),
  textbookVersion: z.string().min(1),
  volume: z.string().min(1),
  description: z.string().min(1),
  wordCount: z.number().int().nonnegative(),
  source: z.string().min(1),
  version: z.number().int().positive(),
  publishedAt: z.string().datetime().nullable(),
})

export type VocabularyBook = z.infer<typeof vocabularyBookSchema>

export const guestUserSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  accountType: z.literal('guest'),
  role: z.literal('learner'),
  timezone: z.string().min(1),
  createdAt: z.string().datetime(),
})

export type GuestUser = z.infer<typeof guestUserSchema>

export const registeredLearnerSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  accountType: z.literal('registered'),
  role: z.literal('learner'),
  timezone: z.string().min(1),
  createdAt: z.string().datetime(),
})

export type RegisteredLearner = z.infer<typeof registeredLearnerSchema>

export const teacherUserSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  accountType: z.literal('teacher'),
  role: z.literal('teacher'),
  timezone: z.string().min(1),
  createdAt: z.string().datetime(),
})

export type TeacherUser = z.infer<typeof teacherUserSchema>

export const teacherStudentSchema = z.object({
  id: z.string().min(1),
  teacherId: z.string().min(1),
  learnerId: z.string().min(1),
  displayName: z.string().min(1),
  accountType: z.enum(['guest', 'registered']),
  joinedAt: z.string().datetime(),
})

export type TeacherStudent = z.infer<typeof teacherStudentSchema>

export const teacherTaskStatusSchema = z.enum(['active', 'completed', 'archived'])

export type TeacherTaskStatus = z.infer<typeof teacherTaskStatusSchema>

export const teacherTaskSchema = z.object({
  id: z.string().min(1),
  teacherId: z.string().min(1),
  title: z.string().min(1),
  vocabularyBookId: z.string().min(1),
  unit: z.string().min(1),
  dailyNewWordTarget: z.number().int().min(1).max(100),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  assignedStudentIds: z.array(z.string().min(1)).min(1),
  status: teacherTaskStatusSchema,
  createdAt: z.string().datetime(),
})

export type TeacherTask = z.infer<typeof teacherTaskSchema>

export const teacherEvaluationRatingSchema = z.enum(['needs_support', 'steady', 'great'])

export type TeacherEvaluationRating = z.infer<typeof teacherEvaluationRatingSchema>

export const teacherEvaluationSchema = z.object({
  id: z.string().min(1),
  teacherId: z.string().min(1),
  taskId: z.string().min(1),
  studentId: z.string().min(1),
  rating: teacherEvaluationRatingSchema,
  comment: z.string().min(1).max(200),
  createdAt: z.string().datetime(),
})

export type TeacherEvaluation = z.infer<typeof teacherEvaluationSchema>

export const teacherTaskStudentOverviewSchema = z.object({
  student: teacherStudentSchema,
  assignedWordCount: z.number().int().nonnegative(),
  recitedWordCount: z.number().int().nonnegative(),
  masteredWordCount: z.number().int().nonnegative(),
  correctRate: z.number().min(0).max(1),
  completionRate: z.number().min(0).max(1),
  evaluationRating: teacherEvaluationRatingSchema.nullable(),
  evaluationComment: z.string().min(1).nullable(),
})

export type TeacherTaskStudentOverview = z.infer<typeof teacherTaskStudentOverviewSchema>

export const teacherTaskOverviewSchema = z.object({
  task: teacherTaskSchema,
  students: z.array(teacherTaskStudentOverviewSchema),
})

export type TeacherTaskOverview = z.infer<typeof teacherTaskOverviewSchema>

export const addTeacherStudentRequestSchema = z.object({
  teacherId: z.string().min(1),
  learnerId: z.string().min(1),
})

export type AddTeacherStudentRequest = z.infer<typeof addTeacherStudentRequestSchema>

export const createTeacherTaskRequestSchema = z.object({
  teacherId: z.string().min(1),
  title: z.string().min(1),
  vocabularyBookId: z.string().min(1),
  unit: z.string().min(1),
  dailyNewWordTarget: z.number().int().min(1).max(100),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  studentIds: z.array(z.string().min(1)).min(1),
})

export type CreateTeacherTaskRequest = z.infer<typeof createTeacherTaskRequestSchema>

export const createTeacherEvaluationRequestSchema = z.object({
  teacherId: z.string().min(1),
  taskId: z.string().min(1),
  studentId: z.string().min(1),
  rating: teacherEvaluationRatingSchema,
  comment: z.string().min(1).max(200),
})

export type CreateTeacherEvaluationRequest = z.infer<typeof createTeacherEvaluationRequestSchema>

export const userPreferencesSchema = z.object({
  educationStage: educationStageSchema,
  grade: learnerGradeSchema,
  bookId: z.string().min(1),
  unit: z.string().min(1),
  dailyNewWordTarget: z.number().int().min(1).max(100),
  reminderEnabled: z.boolean(),
})

export type UserPreferences = z.infer<typeof userPreferencesSchema>

export const onboardingRequestSchema = z.object({
  userId: z.string().min(1),
  preferences: userPreferencesSchema,
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
})

export type OnboardingRequest = z.infer<typeof onboardingRequestSchema>

export const studyPlanSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  vocabularyBookId: z.string().min(1),
  unit: z.string().min(1).nullable(),
  dailyNewWordTarget: z.number().int().min(1).max(100),
  dailyReviewLimit: z.number().int().min(1),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  estimatedCompletionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['active', 'paused', 'completed']),
  startedAt: z.string().datetime(),
})

export type StudyPlan = z.infer<typeof studyPlanSchema>

export const answerQualitySchema = z.enum(['again', 'hard', 'good', 'easy'])

export const masteryStateSchema = z.enum([
  'new',
  'learning',
  'fuzzy',
  'mistake',
  'mastered',
  'lapsed',
])

export type MasteryState = z.infer<typeof masteryStateSchema>

export const reviewErrorTypeSchema = z.enum([
  'meaning',
  'spelling',
  'listening',
  'stress',
  'grammar',
  'context',
])

export type ReviewErrorType = z.infer<typeof reviewErrorTypeSchema>

export const studyWordCardSchema = z.object({
  wordId: z.string().min(1),
  lemma: z.string().min(1),
  stressedLemma: z.string().min(1).nullable(),
  partOfSpeech: russianPartOfSpeechSchema,
  definitionZh: z.string().min(1),
  grammarHint: z.string().min(1),
  exampleRu: z.string().min(1),
  exampleZh: z.string().min(1),
})

export type StudyWordCard = z.infer<typeof studyWordCardSchema>

export const recallPromptSchema = z.object({
  id: z.string().min(1),
  wordId: z.string().min(1),
  promptType: z.enum(['ru_to_zh', 'zh_to_ru']),
  question: z.string().min(1),
  correctAnswer: z.string().min(1),
})

export type RecallPrompt = z.infer<typeof recallPromptSchema>

export const studySessionSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  planId: z.string().min(1),
  vocabularyBookId: z.string().min(1),
  unit: z.string().min(1).nullable(),
  status: z.enum(['active', 'completed']),
  wordCards: z.array(studyWordCardSchema).min(1),
  recallPrompts: z.array(recallPromptSchema).min(1),
  createdAt: z.string().datetime(),
})

export type StudySession = z.infer<typeof studySessionSchema>

export const studySessionCompleteRequestSchema = z.object({
  userId: z.string().min(1),
  reviews: z
    .array(
      z.object({
        wordId: z.string().min(1),
        answerQuality: answerQualitySchema,
        responseMs: z.number().int().nonnegative(),
        errorType: reviewErrorTypeSchema.nullable().optional(),
      }),
    )
    .min(1),
})

export type StudySessionCompleteRequest = z.infer<typeof studySessionCompleteRequestSchema>

export const studySessionResultSchema = z.object({
  sessionId: z.string().min(1),
  userId: z.string().min(1),
  status: z.literal('completed'),
  studiedWordCount: z.number().int().nonnegative(),
  masteredWordCount: z.number().int().nonnegative(),
  correctRate: z.number().min(0).max(1),
  completedAt: z.string().datetime(),
})

export type StudySessionResult = z.infer<typeof studySessionResultSchema>

export const learnerProgressSummarySchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().min(1),
  accountType: z.enum(['guest', 'registered']),
  role: z.literal('learner'),
  bookName: z.string().min(1),
  unit: z.string().min(1).nullable(),
  plannedWordCount: z.number().int().nonnegative(),
  recitedWordCount: z.number().int().nonnegative(),
  masteredWordCount: z.number().int().nonnegative(),
  correctRate: z.number().min(0).max(1),
  lastStudiedAt: z.string().datetime().nullable(),
})

export type LearnerProgressSummary = z.infer<typeof learnerProgressSummarySchema>

export const userWordProgressSchema = z.object({
  userId: z.string().min(1),
  wordId: z.string().min(1),
  masteryState: masteryStateSchema,
  repetitions: z.number().int().nonnegative(),
  consecutiveCorrect: z.number().int().nonnegative(),
  correctCount: z.number().int().nonnegative(),
  incorrectCount: z.number().int().nonnegative(),
  easeFactor: z.number().min(1.3).max(2.8),
  intervalDays: z.number().int().nonnegative(),
  lastReviewedAt: z.string().datetime().nullable(),
  nextReviewAt: z.string().datetime().nullable(),
  averageResponseMs: z.number().int().nonnegative().nullable(),
  lastErrorType: reviewErrorTypeSchema.nullable(),
  updatedAt: z.string().datetime(),
})

export type UserWordProgress = z.infer<typeof userWordProgressSchema>

export const reviewQueueItemSchema = z.object({
  userId: z.string().min(1),
  wordId: z.string().min(1),
  lemma: z.string().min(1),
  definitionZh: z.string().min(1),
  masteryState: masteryStateSchema,
  nextReviewAt: z.string().datetime(),
  priority: z.enum(['mistake', 'due']),
})

export type ReviewQueueItem = z.infer<typeof reviewQueueItemSchema>

export const mistakeEntrySchema = z.object({
  userId: z.string().min(1),
  wordId: z.string().min(1),
  lemma: z.string().min(1),
  definitionZh: z.string().min(1),
  lastErrorType: reviewErrorTypeSchema,
  consecutiveCorrect: z.number().int().nonnegative(),
  requiredCorrectCount: z.literal(3),
  nextReviewAt: z.string().datetime(),
})

export type MistakeEntry = z.infer<typeof mistakeEntrySchema>

export const mistakeEliminationRequestSchema = z.object({
  userId: z.string().min(1),
  wordId: z.string().min(1),
  responseMsList: z.array(z.number().int().nonnegative()).min(3),
})

export type MistakeEliminationRequest = z.infer<typeof mistakeEliminationRequestSchema>

export const leaderboardScopeSchema = z.enum(['daily', 'weekly', 'book', 'class'])

export type LeaderboardScope = z.infer<typeof leaderboardScopeSchema>

export const studyScoreEventTypeSchema = z.enum([
  'new_word_mastered',
  'review_completed',
  'mistake_removed',
  'checkin_streak_bonus',
  'invalid_repeat_penalty',
])

export type StudyScoreEventType = z.infer<typeof studyScoreEventTypeSchema>

export const studyScoreEventSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  sessionId: z.string().min(1),
  wordId: z.string().min(1).nullable(),
  bookId: z.string().min(1).nullable(),
  eventType: studyScoreEventTypeSchema,
  scoreDelta: z.number().int(),
  wordCount: z.number().int().nonnegative(),
  occurredAt: z.string().datetime(),
  idempotencyKey: z.string().min(1),
})

export type StudyScoreEvent = z.infer<typeof studyScoreEventSchema>

export const checkinRecordSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  checkinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  streakDays: z.number().int().positive(),
  completedAt: z.string().datetime(),
})

export type CheckinRecord = z.infer<typeof checkinRecordSchema>

export const createCheckinRequestSchema = z.object({
  userId: z.string().min(1),
  checkinDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

export type CreateCheckinRequest = z.infer<typeof createCheckinRequestSchema>

export const leaderboardEntrySchema = z.object({
  scope: leaderboardScopeSchema,
  userId: z.string().min(1),
  displayName: z.string().min(1),
  accountType: z.enum(['guest', 'registered']),
  score: z.number().int(),
  rank: z.number().int().positive(),
  masteredWordCount: z.number().int().nonnegative(),
  reviewCompletionRate: z.number().min(0).max(1),
  streakDays: z.number().int().nonnegative(),
  bookId: z.string().min(1).nullable(),
  classId: z.string().min(1).nullable(),
  updatedAt: z.string().datetime(),
})

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>

export const leaderboardResponseSchema = z.object({
  scope: leaderboardScopeSchema,
  entries: z.array(leaderboardEntrySchema),
})

export type LeaderboardResponse = z.infer<typeof leaderboardResponseSchema>

export const dashboardTrendPointSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  score: z.number().int(),
  masteredWordCount: z.number().int().nonnegative(),
  checkedIn: z.boolean(),
})

export type DashboardTrendPoint = z.infer<typeof dashboardTrendPointSchema>

export const dashboardSummarySchema = z.object({
  userId: z.string().min(1),
  todayRecitedWordCount: z.number().int().nonnegative(),
  todayMasteredWordCount: z.number().int().nonnegative(),
  dueReviewCount: z.number().int().nonnegative(),
  mistakeWordCount: z.number().int().nonnegative(),
  streakDays: z.number().int().nonnegative(),
  scoreToday: z.number().int(),
  scoreWeek: z.number().int(),
  recentTrend: z.array(dashboardTrendPointSchema),
})

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>

export const launchReadinessCategorySchema = z.enum([
  'security',
  'privacy',
  'performance',
  'accessibility',
  'content',
  'backup',
  'e2e',
])

export type LaunchReadinessCategory = z.infer<typeof launchReadinessCategorySchema>

export const launchReadinessStatusSchema = z.enum(['ready', 'needs_attention'])

export type LaunchReadinessStatus = z.infer<typeof launchReadinessStatusSchema>

export const launchReadinessCheckSchema = z.object({
  id: z.string().min(1),
  category: launchReadinessCategorySchema,
  title: z.string().min(1),
  status: launchReadinessStatusSchema,
  evidence: z.string().min(1),
})

export type LaunchReadinessCheck = z.infer<typeof launchReadinessCheckSchema>

export const launchReadinessReportSchema = z.object({
  generatedAt: z.string().datetime(),
  overallStatus: launchReadinessStatusSchema,
  checks: z.array(launchReadinessCheckSchema).min(1),
})

export type LaunchReadinessReport = z.infer<typeof launchReadinessReportSchema>

export const offlineLearningPackSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  vocabularyBookId: z.string().min(1),
  unit: z.string().min(1).nullable(),
  sessionId: z.string().min(1),
  wordCards: z.array(studyWordCardSchema).min(1),
  recallPrompts: z.array(recallPromptSchema).min(1),
  cachedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
})

export type OfflineLearningPack = z.infer<typeof offlineLearningPackSchema>

export const offlineSyncOperationTypeSchema = z.enum(['study_session_complete'])

export type OfflineSyncOperationType = z.infer<typeof offlineSyncOperationTypeSchema>

export const offlineSyncOperationStatusSchema = z.enum(['queued', 'syncing', 'synced', 'failed'])

export type OfflineSyncOperationStatus = z.infer<typeof offlineSyncOperationStatusSchema>

export const offlineStudySessionCompletePayloadSchema = z.object({
  sessionId: z.string().min(1),
  request: studySessionCompleteRequestSchema,
})

export type OfflineStudySessionCompletePayload = z.infer<
  typeof offlineStudySessionCompletePayloadSchema
>

export const offlineSyncOperationSchema = z.object({
  id: z.string().min(1),
  type: offlineSyncOperationTypeSchema,
  userId: z.string().min(1),
  endpoint: z.string().min(1),
  method: z.literal('POST'),
  idempotencyKey: z.string().min(1),
  payload: offlineStudySessionCompletePayloadSchema,
  status: offlineSyncOperationStatusSchema,
  retryCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  lastError: z.string().min(1).nullable(),
})

export type OfflineSyncOperation = z.infer<typeof offlineSyncOperationSchema>

export const offlineSyncRequestSchema = z.object({
  operations: z.array(offlineSyncOperationSchema).min(1),
})

export type OfflineSyncRequest = z.infer<typeof offlineSyncRequestSchema>

export const offlineSyncResultSchema = z.object({
  operationId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  status: z.enum(['synced', 'failed']),
  retryCount: z.number().int().nonnegative(),
  syncedAt: z.string().datetime().nullable(),
  error: z.string().min(1).nullable(),
})

export type OfflineSyncResult = z.infer<typeof offlineSyncResultSchema>

export const offlineSyncResponseSchema = z.object({
  syncedCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  results: z.array(offlineSyncResultSchema),
})

export type OfflineSyncResponse = z.infer<typeof offlineSyncResponseSchema>

export const russianWordSchema = z.object({
  id: z.string().min(1),
  bookId: z.string().min(1),
  unit: z.string().min(1),
  unitTitle: z.string().min(1),
  lesson: z.string().min(1),
  lemma: z.string().min(1),
  stressedLemma: z.string().min(1).nullable(),
  transcription: z.string().min(1).nullable(),
  partOfSpeech: russianPartOfSpeechSchema,
  gender: z.enum(['masculine', 'feminine', 'neuter', 'common']).nullable(),
  pluralForm: z.string().min(1).nullable(),
  aspect: z.enum(['perfective', 'imperfective']).nullable(),
  aspectPair: z.string().min(1).nullable(),
  conjugation: z.enum(['first', 'second', 'irregular']).nullable(),
  meanings: z
    .array(
      z.object({
        definitionZh: z.string().min(1),
        usageNote: z.string().min(1).nullable(),
      }),
    )
    .min(1),
  examples: z.array(
    z.object({
      sentenceRu: z.string().min(1),
      translationZh: z.string().min(1),
      source: z.string().min(1).nullable(),
    }),
  ),
  audioUrl: z.string().url().nullable(),
  imageUrl: z.string().url().nullable(),
  source: z.string().min(1),
})

export type RussianWord = z.infer<typeof russianWordSchema>

export const vocabularyUnitSummarySchema = z.object({
  unit: z.string().min(1),
  unitTitle: z.string().min(1),
  wordCount: z.number().int().nonnegative(),
  lessons: z.array(
    z.object({
      lesson: z.string().min(1),
      wordCount: z.number().int().nonnegative(),
    }),
  ),
})

export type VocabularyUnitSummary = z.infer<typeof vocabularyUnitSummarySchema>
