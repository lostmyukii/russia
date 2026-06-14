import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from 'react'

import {
  addStudentToTeacher,
  applyMistakeEliminationReview,
  applySrsReview,
  buildDashboardSummary,
  buildLeaderboardEntries,
  buildMistakeEntries,
  buildScoreEventsForStudyResult,
  buildTeacherProgressSummaries,
  buildTeacherTaskOverview,
  completeStudySession,
  createCheckinRecord,
  createGuestLearner,
  createInitialWordProgress,
  createOfflineLearningPack,
  createOfflineSyncOperation,
  createRegisteredLearner,
  createStudyPlanFromOnboarding,
  createStudySessionFromPlan,
  createTeacherAccount,
  createTeacherClass,
  createTeacherManagedStudentAccount,
  createTeacherTask,
  getQueuedOfflineSyncOperations,
  evaluateStudentTask,
  groupRussianWordsByUnit,
  markOfflineSyncOperationSynced,
  pepRussianVocabularyBooks,
  pepRussianWords,
  type AnswerQuality,
  type GuestUser,
  type CheckinRecord,
  type DashboardSummary,
  type LearnerAccount,
  type LeaderboardEntry,
  type LearnerProgressSummary,
  type MistakeEntry,
  type OfflineLearningPack,
  type OfflineSyncOperation,
  type RussianWord,
  type StudyPlan,
  type StudyScoreEvent,
  type StudySession,
  type StudySessionResult,
  type StudyWordCard,
  type TeacherStudent,
  type TeacherClass,
  type TeacherTask,
  type TeacherTaskOverview,
  type TeacherUser,
  type UserWordProgress,
} from '@russian-wordscodex/domain'

const baselineItems = [
  {
    title: '人教版教材单元词库',
    description: '初中、高中俄语词汇按册别和单元拆分。',
  },
  {
    title: 'SRS 复习',
    description: '根据作答结果安排下次复习。',
  },
  {
    title: '背词排行榜',
    description: '按掌握、复习、打卡记录计算积分。',
  },
]

const teacherAssignedLearnerAccounts = [
  {
    username: 'student01',
    password: 'ru123456',
    displayName: '登录学习者',
  },
  {
    username: 'student02',
    password: 'ru654321',
    displayName: '访客学习者',
  },
] as const

const teacherAssignedTeacherAccounts = [
  {
    username: 'teacher01',
    password: 'teacher123456',
    displayName: '俄语老师',
  },
] as const

type LoginRole = 'student' | 'teacher'
type StudyQuestionMode = 'choice' | 'ru_to_zh_dictation' | 'zh_to_ru_dictation'
type TeacherDashboardMetrics = {
  studentCount: number
  activeTaskCount: number
  masteredWordCount: number
  averageCompletionRate: number
  pendingEvaluationCount: number
}

function syncTeacherApi(
  path: string,
  payload: Record<string, unknown>,
  method: 'PATCH' | 'POST' = 'POST',
) {
  if (typeof window === 'undefined') {
    return
  }

  window
    .fetch(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    .catch(() => undefined)
}

export function App() {
  const vocabularyCatalog = pepRussianVocabularyBooks
  const [routePath, setRoutePath] = useState(getInitialRoutePath)
  const [selectedBookSlug, setSelectedBookSlug] = useState<string | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)
  const [dailyNewWordTargetInput, setDailyNewWordTargetInput] = useState('1')
  const [targetDateInput, setTargetDateInput] = useState('')
  const targetDateInputRef = useRef<HTMLInputElement | null>(null)
  const [bookSearch, setBookSearch] = useState('')
  const featuredBook =
    vocabularyCatalog.find((book) => book.slug === selectedBookSlug) ?? vocabularyCatalog[0]
  const featuredUnits = featuredBook ? groupRussianWordsByUnit(featuredBook.slug) : []
  const defaultFeaturedUnit = featuredUnits.find((unit) => unit.unit !== '0') ?? featuredUnits[0]
  const featuredUnit =
    featuredUnits.find((unit) => unit.unit === selectedUnit) ?? defaultFeaturedUnit
  const dailyNewWordLimit = Math.max(featuredUnit?.wordCount ?? 1, 1)
  const featuredBookShortName =
    featuredBook?.name.replace(/^人教版(初中|高中)俄语/, '') ?? '七年级全一册'
  const featuredMistakeWord =
    pepRussianWords.find(
      (word) =>
        word.bookId === featuredBook?.id &&
        word.unit === featuredUnit?.unit &&
        word.partOfSpeech === 'noun',
    ) ??
    pepRussianWords.find(
      (word) => word.bookId === featuredBook?.id && word.unit === featuredUnit?.unit,
    )
  const [guestUser, setGuestUser] = useState<GuestUser | null>(null)
  const [assignedLearner, setAssignedLearner] = useState<LearnerAccount | null>(null)
  const [loginRole, setLoginRole] = useState<LoginRole>('student')
  const [loginUsername, setLoginUsername] = useState('student01')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginMessage, setLoginMessage] = useState<string | null>(null)
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null)
  const [studySession, setStudySession] = useState<StudySession | null>(null)
  const [studyResult, setStudyResult] = useState<StudySessionResult | null>(null)
  const [currentStudyCardIndex, setCurrentStudyCardIndex] = useState(0)
  const [studyAnswerVisible, setStudyAnswerVisible] = useState(false)
  const [studyQuestionMode, setStudyQuestionMode] = useState<StudyQuestionMode>('choice')
  const [dictationAnswer, setDictationAnswer] = useState('')
  const [pronunciationMessage, setPronunciationMessage] = useState<string | null>(null)
  const [studyReviews, setStudyReviews] = useState<
    Array<{ wordId: string; answerQuality: AnswerQuality; responseMs: number }>
  >([])
  const [scoreEvents, setScoreEvents] = useState<StudyScoreEvent[]>([])
  const [checkins, setCheckins] = useState<CheckinRecord[]>([])
  const [latestCheckin, setLatestCheckin] = useState<CheckinRecord | null>(null)
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null)
  const [dailyLeaderboard, setDailyLeaderboard] = useState<LeaderboardEntry[]>([])
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([])
  const [bookLeaderboard, setBookLeaderboard] = useState<LeaderboardEntry[]>([])
  const [teacherUser, setTeacherUser] = useState<TeacherUser | null>(null)
  const [teacherProgress, setTeacherProgress] = useState<LearnerProgressSummary[]>([])
  const [classLearners, setClassLearners] = useState<LearnerAccount[]>([])
  const [classPlans, setClassPlans] = useState<StudyPlan[]>([])
  const [classResults, setClassResults] = useState<StudySessionResult[]>([])
  const [teacherStudents, setTeacherStudents] = useState<TeacherStudent[]>([])
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([])
  const [teacherTask, setTeacherTask] = useState<TeacherTask | null>(null)
  const [teacherTaskOverview, setTeacherTaskOverview] = useState<TeacherTaskOverview | null>(null)
  const [reviewProgress, setReviewProgress] = useState<UserWordProgress | null>(null)
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([])
  const [mistakeResolved, setMistakeResolved] = useState(false)
  const [offlineLearningPack, setOfflineLearningPack] = useState<OfflineLearningPack | null>(null)
  const [offlineQueue, setOfflineQueue] = useState<OfflineSyncOperation[]>([])
  const [offlineSyncMessage, setOfflineSyncMessage] = useState<string | null>(null)
  const [offlineServerConfirmed, setOfflineServerConfirmed] = useState(false)
  const activeLearner = assignedLearner ?? guestUser
  const isStudyRoute = routePath.startsWith('/study/session')
  const isStudyResultRoute = routePath.startsWith('/study/result')
  const bookDetailSlug = routePath.startsWith('/books/')
    ? decodeURIComponent(routePath.replace('/books/', ''))
    : null
  const selectedBookDetail = bookDetailSlug
    ? vocabularyCatalog.find((book) => book.slug === bookDetailSlug)
    : null
  const selectedBookUnits = selectedBookDetail
    ? groupRussianWordsByUnit(selectedBookDetail.slug)
    : []
  const filteredVocabularyCatalog = vocabularyCatalog.filter((book) => {
    const keyword = bookSearch.trim().toLowerCase()

    if (!keyword) {
      return true
    }

    return `${book.name} ${book.grade} ${book.volume} ${book.source}`
      .toLowerCase()
      .includes(keyword)
  })

  useEffect(() => {
    function handlePopState() {
      setRoutePath(getCurrentRoutePath())
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  function navigateTo(path: string) {
    const nextPath = normalizeRoutePath(path)

    if (getCurrentRoutePath() !== nextPath) {
      window.history.pushState(null, '', nextPath)
    }

    setRoutePath(nextPath)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  function navigateOnClick(path: string) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      navigateTo(path)
    }
  }

  function startGuestLearning() {
    setAssignedLearner(null)
    setLoginMessage(null)
    setGuestUser(createGuestLearner({ now: new Date().toISOString() }))
  }

  function startGuestOnboarding() {
    startGuestLearning()
    navigateTo('/onboarding')
  }

  function updateLoginUsername(event: ChangeEvent<HTMLInputElement>) {
    setLoginUsername(event.target.value)
  }

  function updateLoginPassword(event: ChangeEvent<HTMLInputElement>) {
    setLoginPassword(event.target.value)
  }

  function selectLoginRole(role: LoginRole) {
    setLoginRole(role)
    setLoginMessage(null)
    setLoginPassword('')
    setLoginUsername(role === 'teacher' ? 'teacher01' : 'student01')
  }

  function updateBookSearch(event: ChangeEvent<HTMLInputElement>) {
    setBookSearch(event.target.value)
  }

  function updateSelectedBook(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedBookSlug(event.target.value)
    setSelectedUnit(null)
  }

  function updateSelectedUnit(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedUnit(event.target.value)
  }

  function updateDailyNewWordTarget(event: ChangeEvent<HTMLInputElement>) {
    setDailyNewWordTargetInput(event.target.value)
  }

  function updateTargetDate(event: ChangeEvent<HTMLInputElement>) {
    setTargetDateInput(event.target.value)
  }

  function updateDictationAnswer(event: ChangeEvent<HTMLInputElement>) {
    setDictationAnswer(event.target.value)
  }

  function changeStudyQuestionMode(mode: StudyQuestionMode) {
    setStudyQuestionMode(mode)
    setDictationAnswer('')
    setStudyAnswerVisible(false)
  }

  function chooseVocabularyBook(bookSlug: string) {
    setSelectedBookSlug(bookSlug)
    setSelectedUnit(null)
    navigateTo('/onboarding')
  }

  function verifyTeacherAssignedLogin() {
    const normalizedUsername = loginUsername.trim()

    if (loginRole === 'teacher') {
      const teacherAccount = teacherAssignedTeacherAccounts.find(
        (candidate) =>
          candidate.username === normalizedUsername && candidate.password === loginPassword,
      )

      if (!teacherAccount) {
        setLoginMessage('老师账号或密码不正确。')
        return
      }

      const now = new Date().toISOString()
      const teacher = createTeacherAccount({ now })

      setAssignedLearner(null)
      setGuestUser(null)
      setLoginMessage(`已登录：${teacherAccount.displayName}`)
      setLoginUsername(teacherAccount.username)
      setLoginPassword('')
      syncTeacherApi('/api/v1/auth/teacher-login', {
        username: teacherAccount.username,
        password: teacherAccount.password,
      })
      seedTeacherDashboard({ teacher, now })
      navigateTo('/teacher')
      return
    }

    const account = teacherAssignedLearnerAccounts.find(
      (candidate) =>
        candidate.username === normalizedUsername && candidate.password === loginPassword,
    )

    if (!account) {
      setLoginMessage('账号或密码不正确，请联系老师。')
      return
    }

    const now = new Date().toISOString()
    const learner: LearnerAccount = {
      id: `learner_${account.username}`,
      displayName: account.displayName,
      accountType: 'registered',
      role: 'learner',
      timezone: 'Asia/Shanghai',
      createdAt: now,
    }

    setAssignedLearner(learner)
    setGuestUser(null)
    setLoginMessage(`已登录：${learner.displayName}`)
    setLoginUsername(account.username)
    setLoginPassword('')
    navigateTo('/onboarding')
  }

  function generateStudyPlan() {
    if (!featuredBook || !featuredUnit) {
      return
    }

    const now = new Date().toISOString()
    const user = activeLearner ?? createGuestLearner({ now })
    const dailyNewWordTarget = clampDailyNewWordTarget(dailyNewWordTargetInput, dailyNewWordLimit)
    const targetDate = targetDateInputRef.current?.value.trim() || targetDateInput.trim() || null
    const result = createStudyPlanFromOnboarding({
      userId: user.id,
      preferences: {
        educationStage: featuredBook.educationStage,
        grade: featuredBook.grade,
        bookId: featuredBook.id,
        unit: featuredUnit.unit,
        dailyNewWordTarget,
        reminderEnabled: true,
      },
      targetDate,
      now,
    })

    if (!activeLearner) {
      setGuestUser(user as GuestUser)
    }

    setActivePlan(result.studyPlan)
    setStudySession(null)
    setStudyResult(null)
    setCurrentStudyCardIndex(0)
    setStudyAnswerVisible(false)
    setPronunciationMessage(null)
    setStudyReviews([])
    setScoreEvents([])
    setCheckins([])
    setLatestCheckin(null)
    setDashboardSummary(null)
    setDailyLeaderboard([])
    setWeeklyLeaderboard([])
    setBookLeaderboard([])
    setDailyNewWordTargetInput(String(dailyNewWordTarget))
    setTargetDateInput(result.studyPlan.targetDate ?? '')
    setTeacherProgress([])
    setClassLearners([])
    setClassPlans([])
    setClassResults([])
    setTeacherStudents([])
    setTeacherClasses([])
    setTeacherTask(null)
    setTeacherTaskOverview(null)
    setOfflineLearningPack(null)
    setOfflineQueue([])
    setOfflineSyncMessage(null)
    setOfflineServerConfirmed(false)
    navigateTo('/home')
  }

  function startStudySession() {
    if (!activePlan || !activeLearner) {
      return
    }

    const now = new Date().toISOString()
    const session = createStudySessionFromPlan({ plan: activePlan, now })

    setStudySession(session)
    setStudyResult(null)
    setCurrentStudyCardIndex(0)
    setStudyAnswerVisible(false)
    setStudyQuestionMode('choice')
    setDictationAnswer('')
    setPronunciationMessage(null)
    setStudyReviews([])
    setScoreEvents([])
    setLatestCheckin(null)
    setDashboardSummary(null)
    setDailyLeaderboard([])
    setWeeklyLeaderboard([])
    setBookLeaderboard([])
    setOfflineLearningPack(null)
    setOfflineQueue([])
    setOfflineSyncMessage(null)
    setOfflineServerConfirmed(false)
    navigateTo('/study/session/demo')
  }

  function showStudyAnswer() {
    setStudyAnswerVisible(true)
  }

  function playRussianPronunciation(word: string) {
    if (
      typeof window === 'undefined' ||
      !window.speechSynthesis ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      setPronunciationMessage('当前浏览器不支持读音播放。')
      return
    }

    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'ru-RU'
    utterance.rate = 0.86
    utterance.pitch = 1

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setPronunciationMessage(`正在播放：${word}`)
  }

  function answerStudyCard(answerQuality: AnswerQuality) {
    if (!studySession || !activeLearner) {
      return
    }

    const currentCard = studySession.wordCards[currentStudyCardIndex]

    if (!currentCard) {
      return
    }

    const nextReviews = [
      ...studyReviews,
      {
        wordId: currentCard.wordId,
        answerQuality,
        responseMs: answerQuality === 'again' ? 9000 : 4200,
      },
    ]

    if (currentStudyCardIndex < studySession.wordCards.length - 1) {
      setStudyReviews(nextReviews)
      setCurrentStudyCardIndex(currentStudyCardIndex + 1)
      setStudyAnswerVisible(false)
      setDictationAnswer('')
      setPronunciationMessage(null)
      return
    }

    const now = new Date().toISOString()
    const result = completeStudySession({
      session: studySession,
      request: {
        userId: activeLearner.id,
        reviews: nextReviews,
      },
      now,
    })

    setStudyReviews(nextReviews)
    setStudyResult(result)
    setScoreEvents(
      buildScoreEventsForStudyResult({
        session: studySession,
        result,
        idempotencyKey: `complete-${activeLearner.id}`,
      }),
    )
    setStudyAnswerVisible(false)
    setDictationAnswer('')
    setPronunciationMessage(null)
    navigateTo('/study/result/demo')
  }

  function submitDictationAnswer() {
    if (!currentStudyCard) {
      return
    }

    answerStudyCard(
      isDictationAnswerCorrect({
        answer: dictationAnswer,
        card: currentStudyCard,
        mode: studyQuestionMode,
      })
        ? 'good'
        : 'again',
    )
  }

  function cacheOfflineLearningPack() {
    if (!activePlan || !activeLearner) {
      return
    }

    const now = new Date().toISOString()
    const session = createStudySessionFromPlan({ plan: activePlan, now })
    const pack = createOfflineLearningPack({ session, now })

    setStudySession(session)
    setCurrentStudyCardIndex(0)
    setStudyAnswerVisible(false)
    setPronunciationMessage(null)
    setStudyReviews([])
    setOfflineLearningPack(pack)
    setOfflineQueue([])
    setOfflineSyncMessage(null)
    setOfflineServerConfirmed(false)
    setStudyResult(null)
    setStudyAnswerVisible(false)
    setStudyReviews([])
    setScoreEvents([])
    setCheckins([])
    setLatestCheckin(null)
    setDashboardSummary(null)
    setDailyLeaderboard([])
    setWeeklyLeaderboard([])
    setBookLeaderboard([])
  }

  function queueOfflineAnswer() {
    if (!activeLearner || !offlineLearningPack) {
      return
    }

    const now = new Date().toISOString()
    const operation = createOfflineSyncOperation({
      type: 'study_session_complete',
      userId: activeLearner.id,
      endpoint: `/api/v1/study-sessions/${offlineLearningPack.sessionId}/complete`,
      idempotencyKey: `complete-offline-${activeLearner.id}-${offlineLearningPack.sessionId}`,
      payload: {
        sessionId: offlineLearningPack.sessionId,
        request: {
          userId: activeLearner.id,
          reviews: offlineLearningPack.wordCards.map((card) => ({
            wordId: card.wordId,
            answerQuality: 'good',
            responseMs: 4200,
          })),
        },
      },
      now,
    })
    const nextQueue = getQueuedOfflineSyncOperations([...offlineQueue, operation])

    setOfflineQueue(nextQueue)
    setOfflineSyncMessage(`作答待同步：${nextQueue.length} 条`)
    setOfflineServerConfirmed(false)
    setStudyResult(null)
    setScoreEvents([])
    setLatestCheckin(null)
    setDashboardSummary(null)
    setDailyLeaderboard([])
    setWeeklyLeaderboard([])
    setBookLeaderboard([])
  }

  function syncOfflineQueue() {
    if (!studySession) {
      return
    }

    const queuedOperations = getQueuedOfflineSyncOperations(offlineQueue)

    if (queuedOperations.length === 0) {
      return
    }

    const now = new Date().toISOString()
    const completedOperation = queuedOperations[0]

    if (!completedOperation) {
      return
    }

    const result = completeStudySession({
      session: studySession,
      request: completedOperation.payload.request,
      now,
    })
    const syncedOperation = markOfflineSyncOperationSynced({
      operation: completedOperation,
      syncedAt: now,
    })
    const syncedIds = new Set(queuedOperations.map((operation) => operation.id))

    setStudyResult(result)
    setScoreEvents(
      buildScoreEventsForStudyResult({
        session: studySession,
        result,
        idempotencyKey: completedOperation.idempotencyKey,
      }),
    )
    setOfflineQueue([
      ...offlineQueue.filter((operation) => !syncedIds.has(operation.id)),
      syncedOperation,
    ])
    setOfflineSyncMessage(`已自动同步 ${queuedOperations.length} 条离线作答`)
    setOfflineServerConfirmed(true)
  }

  function completeDailyCheckin() {
    if (!featuredBook || !activeLearner || !activePlan || !studyResult || !studySession) {
      return
    }

    const now = studyResult.completedAt
    const currentScoreEvents =
      scoreEvents.length > 0
        ? scoreEvents
        : buildScoreEventsForStudyResult({
            session: studySession,
            result: studyResult,
            idempotencyKey: `complete-${activeLearner.id}`,
          })
    const checkin = createCheckinRecord({
      userId: activeLearner.id,
      checkinDate: now.slice(0, 10),
      existingCheckins: checkins,
      now,
    })
    const nextCheckins = [
      ...checkins.filter(
        (candidate) =>
          candidate.userId !== checkin.userId || candidate.checkinDate !== checkin.checkinDate,
      ),
      checkin,
    ]
    const dashboard = buildDashboardSummary({
      userId: activeLearner.id,
      plan: activePlan,
      results: [studyResult],
      progressList: reviewProgress ? [reviewProgress] : [],
      scoreEvents: currentScoreEvents,
      checkins: nextCheckins,
      now,
    })
    const leaderboardLearners = [activeLearner]

    setScoreEvents(currentScoreEvents)
    setCheckins(nextCheckins)
    setLatestCheckin(checkin)
    setDashboardSummary(dashboard)
    setDailyLeaderboard(
      buildLeaderboardEntries({
        scope: 'daily',
        learners: leaderboardLearners,
        scoreEvents: currentScoreEvents,
        checkins: nextCheckins,
        now,
      }),
    )
    setWeeklyLeaderboard(
      buildLeaderboardEntries({
        scope: 'weekly',
        learners: leaderboardLearners,
        scoreEvents: currentScoreEvents,
        checkins: nextCheckins,
        now,
      }),
    )
    setBookLeaderboard(
      buildLeaderboardEntries({
        scope: 'book',
        learners: leaderboardLearners,
        scoreEvents: currentScoreEvents,
        checkins: nextCheckins,
        now,
        bookId: featuredBook.id,
      }),
    )
  }

  function showTeacherProgress() {
    if (!featuredBook || !featuredUnit) {
      return
    }

    const now = new Date().toISOString()
    const teacher = createTeacherAccount({ now })

    seedTeacherDashboard({ teacher, now })
  }

  function seedTeacherDashboard({ teacher, now }: { teacher: TeacherUser; now: string }) {
    if (!featuredBook || !featuredUnit) {
      return
    }

    const registeredLearner = createRegisteredLearner({ now })
    const registeredPlan = createStudyPlanFromOnboarding({
      userId: registeredLearner.id,
      preferences: {
        educationStage: featuredBook.educationStage,
        grade: featuredBook.grade,
        bookId: featuredBook.id,
        unit: featuredUnit.unit,
        dailyNewWordTarget: 2,
        reminderEnabled: true,
      },
      targetDate: null,
      now,
    }).studyPlan
    const registeredSession = createStudySessionFromPlan({ plan: registeredPlan, now })
    const registeredResult = completeStudySession({
      session: registeredSession,
      request: {
        userId: registeredLearner.id,
        reviews: [
          {
            wordId: registeredSession.wordCards[0]?.wordId ?? '',
            answerQuality: 'easy',
            responseMs: 3200,
          },
        ],
      },
      now,
    })

    const learners = activeLearner ? [registeredLearner, activeLearner] : [registeredLearner]
    const plans = activePlan ? [registeredPlan, activePlan] : [registeredPlan]
    const results = studyResult ? [registeredResult, studyResult] : [registeredResult]
    const progressSummaries = buildTeacherProgressSummaries({ learners, plans, results })

    setTeacherUser(teacher)
    setTeacherProgress(progressSummaries)
    setClassLearners(learners)
    setClassPlans(plans)
    setClassResults(results)
    setTeacherStudents([])
    setTeacherClasses([])
    setTeacherTask(null)
    setTeacherTaskOverview(null)
  }

  function openTeacherProgress() {
    showTeacherProgress()
    navigateTo('/teacher')
  }

  function ensureDefaultTeacherClass(now: string): TeacherClass | null {
    if (!teacherUser) {
      return null
    }

    const existingClass = teacherClasses[0]

    if (existingClass) {
      return existingClass
    }

    const teacherClass = createTeacherClass({
      teacherId: teacherUser.id,
      name: '七年级一班',
      now,
    })
    setTeacherClasses([teacherClass])
    syncTeacherApi('/api/v1/teacher/classes', {
      teacherId: teacherUser.id,
      name: teacherClass.name,
    })

    return teacherClass
  }

  function createDefaultTeacherClass() {
    ensureDefaultTeacherClass(new Date().toISOString())
  }

  function addStudentsToClass() {
    if (!teacherUser || classLearners.length === 0) {
      return
    }

    const now = new Date().toISOString()
    const teacherClass = ensureDefaultTeacherClass(now)
    const students = classLearners.map((learner) =>
      addStudentToTeacher({
        teacher: teacherUser,
        learner,
        classId: teacherClass?.id ?? null,
        now,
      }),
    )

    setTeacherStudents(students)
    if (teacherClass) {
      setTeacherClasses([
        {
          ...teacherClass,
          studentIds: students.map((student) => student.id),
        },
      ])
    }
    setTeacherTask(null)
    setTeacherTaskOverview(null)
  }

  function addManagedStudentAccount() {
    if (!teacherUser) {
      return
    }

    const now = new Date().toISOString()
    const teacherClass = ensureDefaultTeacherClass(now)

    if (teacherStudents.some((student) => student.loginUsername === 'anna01')) {
      return
    }

    const { learner, student } = createTeacherManagedStudentAccount({
      teacher: teacherUser,
      displayName: '安娜',
      username: 'anna01',
      password: 'ru2026',
      classId: teacherClass?.id ?? null,
      now,
    })
    const nextStudents = [...teacherStudents, student]

    setClassLearners((currentLearners) => [...currentLearners, learner])
    setTeacherStudents(nextStudents)
    syncTeacherApi('/api/v1/teacher/student-accounts', {
      teacherId: teacherUser.id,
      classId: teacherClass?.id ?? null,
      displayName: student.displayName,
      username: student.loginUsername,
      password: student.initialPassword,
    })
    if (teacherClass) {
      setTeacherClasses([
        {
          ...teacherClass,
          studentIds: Array.from(new Set([...teacherClass.studentIds, student.id])),
        },
      ])
    }
  }

  function resetFirstStudentPassword() {
    const targetStudent = teacherStudents[teacherStudents.length - 1]

    if (teacherUser && targetStudent) {
      syncTeacherApi(
        `/api/v1/teacher/students/${targetStudent.id}/password`,
        {
          teacherId: teacherUser.id,
          password: 'ru2027',
        },
        'PATCH',
      )
    }

    setTeacherStudents((currentStudents) =>
      currentStudents.map((student, index) =>
        index === currentStudents.length - 1
          ? {
              ...student,
              initialPassword: 'ru2027',
            }
          : student,
      ),
    )
  }

  function assignTeacherTask() {
    if (!featuredBook || !featuredUnit || !teacherUser || teacherStudents.length === 0) {
      return
    }

    const task = createTeacherTask({
      teacherId: teacherUser.id,
      title: `${featuredBookShortName}第 ${featuredUnit.unit} 单元背词任务`,
      vocabularyBookId: featuredBook.id,
      unit: featuredUnit.unit,
      dailyNewWordTarget: 2,
      dueDate: formatDateAfterDays(new Date().toISOString(), 7),
      students: teacherStudents,
      now: new Date().toISOString(),
    })
    const progressSummaries = buildTeacherProgressSummaries({
      learners: classLearners,
      plans: classPlans,
      results: classResults,
    })

    setTeacherTask(task)
    setTeacherProgress(progressSummaries)
    setTeacherTaskOverview(
      buildTeacherTaskOverview({
        task,
        students: teacherStudents,
        progressSummaries,
        evaluations: [],
      }),
    )
  }

  function evaluateTeacherTask() {
    if (!teacherUser || !teacherTask || teacherStudents.length === 0) {
      return
    }

    const now = new Date().toISOString()
    const evaluations = teacherStudents.map((student) =>
      evaluateStudentTask({
        teacherId: teacherUser.id,
        task: teacherTask,
        studentId: student.id,
        rating: 'great',
        comment: '词义掌握正确。',
        now,
      }),
    )
    const progressSummaries = buildTeacherProgressSummaries({
      learners: classLearners,
      plans: classPlans,
      results: classResults,
    })

    setTeacherProgress(progressSummaries)
    setTeacherTaskOverview(
      buildTeacherTaskOverview({
        task: teacherTask,
        students: teacherStudents,
        progressSummaries,
        evaluations,
      }),
    )
  }

  function simulateMistakeReview() {
    if (!featuredMistakeWord) {
      return
    }

    const initial = createInitialWordProgress({
      userId: activeLearner?.id ?? 'guest_preview',
      wordId: featuredMistakeWord.id,
      now: '2026-06-14T00:00:00.000Z',
    })
    const progress = applySrsReview({
      previous: initial,
      answerQuality: 'again',
      responseMs: 9000,
      errorType: 'meaning',
      now: '2026-06-14T00:00:00.000Z',
    })

    setReviewProgress(progress)
    setMistakes(buildMistakeEntries({ progressList: [progress] }))
    setMistakeResolved(false)
  }

  function eliminateMistake() {
    if (!reviewProgress) {
      return
    }

    const once = applyMistakeEliminationReview({
      previous: reviewProgress,
      responseMs: 4300,
      now: '2026-06-14T00:10:00.000Z',
    })
    const twice = applyMistakeEliminationReview({
      previous: once,
      responseMs: 4100,
      now: '2026-06-14T00:11:00.000Z',
    })
    const resolved = applyMistakeEliminationReview({
      previous: twice,
      responseMs: 3900,
      now: '2026-06-14T00:12:00.000Z',
    })

    setReviewProgress(resolved)
    setMistakes(buildMistakeEntries({ progressList: [resolved] }))
    setMistakeResolved(true)
  }

  function clearLocalLearningData() {
    setGuestUser(null)
    setAssignedLearner(null)
    setLoginUsername('student01')
    setLoginPassword('')
    setLoginMessage(null)
    setActivePlan(null)
    setSelectedBookSlug(null)
    setSelectedUnit(null)
    setDailyNewWordTargetInput('1')
    setStudySession(null)
    setStudyResult(null)
    setCurrentStudyCardIndex(0)
    setStudyAnswerVisible(false)
    setPronunciationMessage(null)
    setStudyReviews([])
    setScoreEvents([])
    setCheckins([])
    setLatestCheckin(null)
    setDashboardSummary(null)
    setDailyLeaderboard([])
    setWeeklyLeaderboard([])
    setBookLeaderboard([])
    setTeacherUser(null)
    setTeacherProgress([])
    setClassLearners([])
    setClassPlans([])
    setClassResults([])
    setTeacherStudents([])
    setTeacherTask(null)
    setTeacherTaskOverview(null)
    setReviewProgress(null)
    setMistakes([])
    setMistakeResolved(false)
    setOfflineLearningPack(null)
    setOfflineQueue([])
    setOfflineSyncMessage(null)
    setOfflineServerConfirmed(false)
  }

  const pendingOfflineCount = getQueuedOfflineSyncOperations(offlineQueue).length
  const importedVocabularyBookCount = vocabularyCatalog.filter((book) => book.wordCount > 0).length
  const importedVocabularyWordCount = vocabularyCatalog.reduce(
    (total, book) => total + book.wordCount,
    0,
  )
  const pendingVocabularyBookCount = vocabularyCatalog.length - importedVocabularyBookCount
  const studyCards = studySession?.wordCards ?? []
  const currentStudyCard = studyCards[currentStudyCardIndex]
  const currentStudyCardNumber = currentStudyCard ? currentStudyCardIndex + 1 : 0
  const currentRecallOptions = currentStudyCard ? buildRecallOptions(currentStudyCard) : []
  const teacherDashboardMetrics = buildTeacherDashboardMetrics({
    progressSummaries: teacherProgress,
    students: teacherStudents,
    task: teacherTask,
    taskOverview: teacherTaskOverview,
  })
  const selectedTeacherClass = teacherClasses[0] ?? null
  const teacherClassLeaderboard = buildTeacherClassLeaderboard({
    progressSummaries: teacherProgress,
    students: teacherStudents,
    teacherClass: selectedTeacherClass,
  })

  function answerRecallOption(option: string) {
    if (!currentStudyCard) {
      return
    }

    answerStudyCard(option === currentStudyCard.definitionZh ? 'good' : 'again')
  }

  if (routePath === '/') {
    return (
      <main className="route-shell app-entry-shell">
        <section className="entry-card" aria-labelledby="entry-title">
          <p className="eyebrow">科学记忆 · 主动回忆 · 人教版俄语</p>
          <h1 id="entry-title">俄语百词斩</h1>
          <p className="hero-copy">
            按人教版教材册别和单元安排每日任务，完成背诵、复习、错词、打卡和排行榜闭环。
          </p>
          <a className="primary-action" href="/login" onClick={navigateOnClick('/login')}>
            开始学习
          </a>
        </section>

        <nav className="legal-link-row" aria-label="合规链接">
          <a href="/privacy.html">隐私政策</a>
          <a href="/terms.html">用户协议</a>
        </nav>
      </main>
    )
  }

  if (routePath === '/login') {
    return (
      <main className="auth-shell">
        <section className="auth-card" aria-labelledby="login-title">
          <p className="eyebrow">登录后继续学习</p>
          <h1 id="login-title">账号密码登录</h1>
          <p className="auth-copy">
            {loginRole === 'teacher'
              ? '老师使用教师账号进入班级看板。'
              : '学生使用老师分配的账号和初始密码登录。'}
          </p>

          {loginMessage ? (
            <p className="login-message" aria-live="polite">
              {loginMessage}
            </p>
          ) : null}

          <div className="login-role-switch" aria-label="登录身份">
            <button
              className={
                loginRole === 'student' ? 'login-role-button is-active' : 'login-role-button'
              }
              type="button"
              aria-pressed={loginRole === 'student'}
              onClick={() => selectLoginRole('student')}
            >
              学生登录
            </button>
            <button
              className={
                loginRole === 'teacher' ? 'login-role-button is-active' : 'login-role-button'
              }
              type="button"
              aria-pressed={loginRole === 'teacher'}
              onClick={() => selectLoginRole('teacher')}
            >
              老师登录
            </button>
          </div>

          <div className="auth-form" aria-label="老师分配账号登录">
            <div className="form-field">
              <label htmlFor="login-username">账号</label>
              <input
                id="login-username"
                autoComplete="username"
                value={loginUsername}
                onChange={updateLoginUsername}
              />
              <p className="field-hint">
                {loginRole === 'teacher'
                  ? '老师示例：teacher01 / teacher123456'
                  : '示例账号：student01 / ru123456'}
              </p>
            </div>

            <div className="form-field">
              <label htmlFor="login-password">密码</label>
              <input
                id="login-password"
                autoComplete="current-password"
                type="password"
                value={loginPassword}
                onChange={updateLoginPassword}
              />
            </div>

            <div className="answer-actions">
              <button className="primary-action" type="button" onClick={verifyTeacherAssignedLogin}>
                登录并继续
              </button>
            </div>
          </div>

          <div className="guest-entry">
            <span>暂时没有老师分配账号？</span>
            <button className="secondary-action" type="button" onClick={startGuestOnboarding}>
              先体验一下
            </button>
          </div>
        </section>
      </main>
    )
  }

  if (routePath === '/onboarding') {
    return (
      <main className="onboarding-shell">
        <section className="plan-card" aria-labelledby="onboarding-title">
          <p className="eyebrow">新手引导</p>
          <h1 id="onboarding-title">{activePlan ? '已有学习计划' : '生成你的学习计划'}</h1>
          <p className="hero-copy">
            先选定人教版俄语册别和单元，再生成今日任务；后续会按 SRS 安排复习。
          </p>

          {!activeLearner ? (
            <>
              <p className="form-alert" role="alert">
                请先登录或使用访客身份开始。
              </p>
              <a className="primary-action" href="/login" onClick={navigateOnClick('/login')}>
                去登录
              </a>
            </>
          ) : activePlan && featuredBook ? (
            <>
              <div className="selected-book-card">
                <span>当前计划</span>
                <strong>{featuredBook.name}</strong>
                <p>
                  第 {activePlan.unit} 单元 · 每日新词 {activePlan.dailyNewWordTarget} 个
                </p>
                {activePlan.targetDate ? <p>目标日期 {activePlan.targetDate}</p> : null}
              </div>
              <a className="primary-action" href="/home" onClick={navigateOnClick('/home')}>
                查看今日任务
              </a>
            </>
          ) : (
            <>
              {featuredBook ? (
                <div className="selected-book-card">
                  <div className="selected-book-heading">
                    <span>已选择词库</span>
                    <a href="/books" onClick={navigateOnClick('/books')}>
                      更换词库
                    </a>
                  </div>
                  <strong>{featuredBook.name}</strong>
                  <p>
                    {featuredBook.wordCount} 个词 · 第 {featuredUnit?.unit ?? '1'} 单元{' '}
                    {featuredUnit?.wordCount ?? 0} 个词
                  </p>
                </div>
              ) : null}

              <div className="plan-form" aria-label="学习计划设置">
                <div className="form-field">
                  <label htmlFor="onboarding-book">选择词库</label>
                  <select
                    id="onboarding-book"
                    value={featuredBook?.slug ?? ''}
                    onChange={updateSelectedBook}
                  >
                    {vocabularyCatalog.map((book) => (
                      <option value={book.slug} key={book.slug}>
                        {book.name} · {book.wordCount} 个词
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="onboarding-unit">选择单元</label>
                  <select
                    id="onboarding-unit"
                    value={featuredUnit?.unit ?? ''}
                    onChange={updateSelectedUnit}
                    disabled={featuredUnits.length === 0}
                  >
                    {featuredUnits.map((unit) => (
                      <option value={unit.unit} key={unit.unit}>
                        第 {unit.unit} 单元 · {unit.unitTitle} · {unit.wordCount} 个词
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="daily-target">每日新词量</label>
                  <input
                    id="daily-target"
                    inputMode="numeric"
                    min="1"
                    max={dailyNewWordLimit}
                    onChange={updateDailyNewWordTarget}
                    type="number"
                    value={dailyNewWordTargetInput}
                  />
                  <p className="field-hint">
                    可设置 1-{dailyNewWordLimit} 个，生成后会同步到今日任务。
                  </p>
                </div>
                <div className="form-field">
                  <label htmlFor="target-date">目标日期</label>
                  <input
                    id="target-date"
                    onChange={updateTargetDate}
                    ref={targetDateInputRef}
                    type="date"
                    value={targetDateInput}
                  />
                  <p className="field-hint">可选；用于记录本单元计划的完成目标。</p>
                </div>
                <button
                  className="primary-action"
                  type="button"
                  onClick={generateStudyPlan}
                  disabled={!featuredBook || !featuredUnit}
                >
                  生成学习计划
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    )
  }

  if (routePath === '/home') {
    return (
      <main className="home-shell">
        <section className="today-card" aria-labelledby="home-title">
          <p className="eyebrow">今日任务</p>
          <h1 id="home-title">今日任务</h1>

          {!activeLearner ? (
            <>
              <p className="hero-copy">请先登录或使用访客身份，再生成学习计划。</p>
              <a className="primary-action" href="/login" onClick={navigateOnClick('/login')}>
                去登录
              </a>
            </>
          ) : !activePlan || !featuredBook ? (
            <>
              <p className="hero-copy">还没有学习计划。先选择一本词库，再生成每日任务。</p>
              <a className="primary-action" href="/books" onClick={navigateOnClick('/books')}>
                选择词库
              </a>
            </>
          ) : (
            <>
              <p className="hero-copy">
                {featuredBook.name} · 第 {activePlan.unit} 单元 · 每日新词{' '}
                {activePlan.dailyNewWordTarget} 个
                {activePlan.targetDate ? ` · 目标日期 ${activePlan.targetDate}` : ''}
              </p>

              <div className="today-summary-grid" aria-label="今日学习概览">
                <div>
                  <span>新词</span>
                  <strong>{activePlan.dailyNewWordTarget}</strong>
                </div>
                <div>
                  <span>本单元</span>
                  <strong>{featuredUnit?.wordCount ?? 0}</strong>
                </div>
                <div>
                  <span>已完成</span>
                  <strong>{studyResult ? 1 : 0}</strong>
                </div>
              </div>

              <div className="checkin-card" aria-label="词库导入状态">
                <strong>词库已导入</strong>
                <span>
                  {importedVocabularyBookCount} 册 · {importedVocabularyWordCount} 个词
                </span>
              </div>

              {latestCheckin && dashboardSummary ? (
                <div className="checkin-card ready" aria-live="polite">
                  <strong>今日已打卡：连续 {latestCheckin.streakDays} 天</strong>
                  <span>
                    今日积分 {dashboardSummary.scoreToday} · 本周积分 {dashboardSummary.scoreWeek}
                  </span>
                </div>
              ) : null}

              <div className="task-list" aria-label="今日任务列表">
                <article className="task-card">
                  <div>
                    <h2>今日新词</h2>
                    <p>完成词卡学习和主动回忆后，可以打卡并进入排行榜。</p>
                  </div>
                  <strong>{activePlan.dailyNewWordTarget} 个</strong>
                </article>
                <article className="task-card">
                  <div>
                    <h2>到期复习</h2>
                    <p>首轮完成后，系统会根据作答质量安排下一次复习。</p>
                  </div>
                  <strong>0 个</strong>
                </article>
              </div>

              <button className="primary-action" type="button" onClick={startStudySession}>
                开始今日学习
              </button>

              <div className="action-row">
                <a className="secondary-action" href="/books" onClick={navigateOnClick('/books')}>
                  词库
                </a>
                <a
                  className="secondary-action"
                  href="/dashboard"
                  onClick={navigateOnClick('/dashboard')}
                >
                  学习看板
                </a>
                <a
                  className="secondary-action"
                  href="/offline"
                  onClick={navigateOnClick('/offline')}
                >
                  离线学习
                </a>
                <a
                  className="secondary-action"
                  href="/mistakes"
                  onClick={navigateOnClick('/mistakes')}
                >
                  错词本
                </a>
                <button className="secondary-action" type="button" onClick={openTeacherProgress}>
                  老师端
                </button>
                <button className="secondary-action" type="button" onClick={clearLocalLearningData}>
                  清除本机学习数据
                </button>
              </div>
            </>
          )}
        </section>

        {dailyLeaderboard.length > 0 ? (
          <section className="leaderboard-section" aria-labelledby="home-leaderboard-title">
            <div className="section-heading">
              <p className="eyebrow">积分</p>
              <h2 id="home-leaderboard-title">排行榜</h2>
            </div>
            <div className="leaderboard-grid">
              <LeaderboardPanel title="今日榜" entries={dailyLeaderboard} />
              <LeaderboardPanel title="周榜" entries={weeklyLeaderboard} />
              <LeaderboardPanel title="册别榜" entries={bookLeaderboard} />
            </div>
          </section>
        ) : null}
      </main>
    )
  }

  if (isStudyRoute) {
    return (
      <main className="study-shell">
        <section className="study-route-card" aria-labelledby="study-route-title">
          <p className="eyebrow">新词学习</p>
          <h1 id="study-route-title">今日背诵</h1>

          {!studySession || !currentStudyCard ? (
            <>
              <p className="hero-copy">当前还没有进行中的学习会话。</p>
              <button
                className="primary-action"
                type="button"
                onClick={startStudySession}
                disabled={!activePlan || !activeLearner}
              >
                开始今日学习
              </button>
            </>
          ) : (
            <>
              <p className="session-progress">
                词卡 {currentStudyCardNumber}/{studyCards.length}
              </p>
              <div className="word-card" aria-label="俄语词卡">
                <h2>
                  {studyQuestionMode === 'zh_to_ru_dictation'
                    ? currentStudyCard.definitionZh
                    : currentStudyCard.lemma}
                </h2>
                {studyQuestionMode === 'zh_to_ru_dictation' ? (
                  <p className="dictation-card-hint">写出对应的俄语。</p>
                ) : (
                  <div className="phonetic-row">
                    {currentStudyCard.stressedLemma ? (
                      <span>重音：{currentStudyCard.stressedLemma}</span>
                    ) : null}
                    <span>{currentStudyCard.grammarHint}</span>
                    <button
                      className="pronunciation-button"
                      type="button"
                      onClick={() => playRussianPronunciation(currentStudyCard.lemma)}
                    >
                      播放读音
                    </button>
                  </div>
                )}
                {pronunciationMessage && studyQuestionMode !== 'zh_to_ru_dictation' ? (
                  <p className="pronunciation-status" aria-live="polite">
                    {pronunciationMessage}
                  </p>
                ) : null}
              </div>

              {!studyAnswerVisible ? (
                <>
                  <StudyQuestionModeSelector
                    selectedMode={studyQuestionMode}
                    onSelect={changeStudyQuestionMode}
                  />
                  {studyQuestionMode === 'choice' ? (
                    <RecallOptions options={currentRecallOptions} onSelect={answerRecallOption} />
                  ) : (
                    <DictationQuestion
                      answer={dictationAnswer}
                      mode={studyQuestionMode}
                      onAnswerChange={updateDictationAnswer}
                      onSubmit={submitDictationAnswer}
                    />
                  )}
                  <button className="primary-action" type="button" onClick={showStudyAnswer}>
                    显示答案
                  </button>
                </>
              ) : (
                <>
                  <div className="meaning-list">
                    <p>
                      <strong>{currentStudyCard.partOfSpeech}</strong>{' '}
                      {currentStudyCard.definitionZh}
                    </p>
                  </div>
                  <blockquote className="example-card">
                    <p>{currentStudyCard.exampleRu}</p>
                    <footer>{currentStudyCard.exampleZh}</footer>
                  </blockquote>
                  <div className="answer-actions">
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={() => answerStudyCard('again')}
                    >
                      不熟
                    </button>
                    <button
                      className="primary-action"
                      type="button"
                      onClick={() => answerStudyCard('good')}
                    >
                      掌握
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </main>
    )
  }

  if (isStudyResultRoute) {
    const correctRate = studyResult ? Math.round(studyResult.correctRate * 100) : 0

    return (
      <main className="study-shell">
        <section className="study-route-card" aria-labelledby="result-route-title">
          <p className="eyebrow">学习结果</p>
          <h1 id="result-route-title">学习结果</h1>

          {!studyResult ? (
            <>
              <p className="hero-copy">还没有完成的学习结果。</p>
              <a className="primary-action" href="/home" onClick={navigateOnClick('/home')}>
                返回今日任务
              </a>
            </>
          ) : (
            <>
              <p className="hero-copy">
                已完成 {studyResult.studiedWordCount} 个词 · 正确率 {correctRate}%
              </p>
              <div className="checkin-card" aria-live="polite">
                <strong>
                  已背 {studyResult.studiedWordCount} 个词，掌握 {studyResult.masteredWordCount}{' '}
                  个词
                </strong>
                <span>完成打卡后会更新学习看板和排行榜。</span>
              </div>
              <div className="result-summary-grid" aria-label="学习结果概览">
                <div>
                  <span>已背</span>
                  <strong>{studyResult.studiedWordCount}</strong>
                </div>
                <div>
                  <span>掌握</span>
                  <strong>{studyResult.masteredWordCount}</strong>
                </div>
                <div>
                  <span>正确率</span>
                  <strong>{correctRate}%</strong>
                </div>
              </div>
              <div className="action-row">
                <button
                  className="primary-action"
                  type="button"
                  onClick={completeDailyCheckin}
                  disabled={!studyResult}
                >
                  完成今日打卡
                </button>
                <a className="secondary-action" href="/home" onClick={navigateOnClick('/home')}>
                  返回今日任务
                </a>
              </div>
            </>
          )}
        </section>
      </main>
    )
  }

  if (routePath === '/mistakes') {
    return (
      <main className="home-shell">
        <section className="today-card" aria-labelledby="mistakes-route-title">
          <p className="eyebrow">错词强化</p>
          <h1 id="mistakes-route-title">错词本</h1>
          <p className="hero-copy">
            答错、模糊和遗忘的词会进入错词队列，连续正确后再回到普通复习。
          </p>

          <div className="review-actions" aria-label="复习与错词操作">
            <button className="secondary-action" type="button" onClick={simulateMistakeReview}>
              错词复习
            </button>
            <button
              className="primary-action"
              type="button"
              onClick={eliminateMistake}
              disabled={!reviewProgress || mistakes.length === 0}
            >
              完成错词消灭
            </button>
          </div>

          {mistakes.length > 0 ? (
            <div className="mistake-list" aria-label="错词本">
              {mistakes.map((mistake) => (
                <div className="mistake-row" key={mistake.wordId}>
                  <strong>{mistake.lemma}</strong>
                  <span>{mistake.definitionZh}</span>
                  <span>{formatErrorType(mistake.lastErrorType)} · 10 分钟后复习</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-note">暂无错词，先完成一组学习后再回来强化。</p>
          )}

          {mistakeResolved ? (
            <div className="mistake-resolved" aria-live="polite">
              <strong>错词已消灭</strong>
              <span>连续正确 3 次</span>
            </div>
          ) : null}
        </section>
      </main>
    )
  }

  if (routePath === '/offline') {
    return (
      <main className="home-shell">
        <section className="today-card" aria-labelledby="offline-route-title">
          <p className="eyebrow">离线模式</p>
          <h1 id="offline-route-title">离线学习</h1>
          <p className="hero-copy">
            先缓存当前学习包，断网时作答会进入待同步队列，恢复网络后再写入学习结果。
          </p>

          <div className="offline-actions" aria-label="离线同步操作">
            <button
              className="secondary-action"
              type="button"
              onClick={cacheOfflineLearningPack}
              disabled={!activePlan || !activeLearner}
            >
              缓存离线学习包
            </button>
            <button
              className="primary-action"
              type="button"
              onClick={queueOfflineAnswer}
              disabled={!offlineLearningPack}
            >
              断网作答
            </button>
            <button
              className="secondary-action"
              type="button"
              onClick={syncOfflineQueue}
              disabled={pendingOfflineCount === 0}
            >
              恢复网络同步
            </button>
          </div>

          {offlineLearningPack ? (
            <div className="offline-pack" aria-live="polite">
              <strong>学习包已缓存：{offlineLearningPack.wordCards.length} 张词卡</strong>
              <span>离线会话：{offlineLearningPack.sessionId}</span>
              <span>有效期至 {offlineLearningPack.expiresAt.slice(0, 10)}</span>
            </div>
          ) : null}

          {offlineSyncMessage ? (
            <p className="offline-message" aria-live="polite">
              {offlineSyncMessage}
            </p>
          ) : null}

          {offlineServerConfirmed ? (
            <p className="offline-confirmation" aria-live="polite">
              同步已确认。
            </p>
          ) : null}

          {studyResult ? (
            <div className="study-result" aria-live="polite">
              <strong>学习结果</strong>
              <span>
                已背 {studyResult.studiedWordCount} 个词，掌握 {studyResult.masteredWordCount} 个词
              </span>
            </div>
          ) : null}
        </section>
      </main>
    )
  }

  if (routePath === '/books') {
    return (
      <main className="book-shell">
        <section className="book-hero" aria-labelledby="books-title">
          <p className="eyebrow">词库选择</p>
          <h1 id="books-title">选择人教版俄语词库</h1>
          <p className="hero-copy">初中和高中词汇按册别、单元拆分，当前已导入完整词表。</p>
          <label className="book-search" htmlFor="book-search">
            <span>搜索词库</span>
            <input
              id="book-search"
              type="search"
              value={bookSearch}
              placeholder="输入年级、册别或词库名称"
              onChange={updateBookSearch}
            />
          </label>
        </section>

        <section className="book-list-panel" aria-live="polite">
          {filteredVocabularyCatalog.length > 0 ? (
            <div className="book-grid">
              {filteredVocabularyCatalog.map((book) => (
                <article className="book-card" key={book.slug}>
                  <div>
                    <p className="book-category">
                      {book.educationStage === 'junior' ? '初中俄语' : '高中俄语'}
                    </p>
                    <h2>{book.name}</h2>
                    <p>
                      {book.grade} · {book.volume} · {book.wordCount} 个词
                    </p>
                  </div>
                  <div className="book-card-footer">
                    <span>{book.wordCount} 词</span>
                    <a
                      className="primary-action"
                      href={`/books/${book.slug}`}
                      onClick={navigateOnClick(`/books/${book.slug}`)}
                      aria-label={`查看 ${book.name}`}
                    >
                      查看详情
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="book-status">暂时没有匹配的词库。</p>
          )}
        </section>
      </main>
    )
  }

  if (bookDetailSlug) {
    return (
      <main className="book-shell">
        <a className="text-link" href="/books" onClick={navigateOnClick('/books')}>
          返回词库列表
        </a>

        {selectedBookDetail ? (
          <section className="book-detail-card" aria-labelledby="book-detail-title">
            <p className="eyebrow">
              {selectedBookDetail.educationStage === 'junior' ? '初中俄语' : '高中俄语'}
            </p>
            <h1 id="book-detail-title">{selectedBookDetail.name}</h1>
            <p className="book-detail-count">{selectedBookDetail.wordCount} 个核心词</p>
            <p className="hero-copy">词汇按人教版教材单元导入，学习计划会优先安排所选册别。</p>
            <div className="unit-list" aria-label={`${selectedBookDetail.name} 单元`}>
              {selectedBookUnits.map((unit) => (
                <div className="unit-row" key={unit.unit}>
                  <div>
                    <strong>{unit.unitTitle}</strong>
                    <span>第 {unit.unit} 单元</span>
                  </div>
                  <span>{unit.wordCount} 个词</span>
                </div>
              ))}
            </div>
            <button
              className="primary-action"
              type="button"
              onClick={() => chooseVocabularyBook(selectedBookDetail.slug)}
            >
              选择这个词库
            </button>
          </section>
        ) : (
          <section className="book-state-card" role="alert">
            <h1>词库不存在</h1>
            <p>请返回词库列表重新选择。</p>
          </section>
        )}
      </main>
    )
  }

  if (routePath === '/dashboard') {
    return (
      <main className="home-shell">
        <section className="today-card" aria-labelledby="dashboard-title">
          <p className="eyebrow">学习反馈</p>
          <h1 id="dashboard-title">学习看板</h1>
          <p className="hero-copy">
            {featuredBook?.name ?? '暂无活动词库'} · 今日已背{' '}
            {dashboardSummary?.todayRecitedWordCount ?? studyResult?.studiedWordCount ?? 0} 个词
          </p>
          <div className="today-summary-grid" aria-label="学习看板概览">
            <div>
              <span>今日积分</span>
              <strong>{dashboardSummary?.scoreToday ?? 0}</strong>
            </div>
            <div>
              <span>已掌握</span>
              <strong>
                {dashboardSummary?.todayMasteredWordCount ?? studyResult?.masteredWordCount ?? 0}
              </strong>
            </div>
            <div>
              <span>连续打卡</span>
              <strong>{latestCheckin?.streakDays ?? 0}</strong>
            </div>
          </div>
          <div className="action-row">
            <a className="primary-action" href="/home" onClick={navigateOnClick('/home')}>
              返回今日任务
            </a>
            <a className="secondary-action" href="/books" onClick={navigateOnClick('/books')}>
              词库
            </a>
          </div>
        </section>
      </main>
    )
  }

  if (routePath === '/teacher') {
    return (
      <main className="home-shell">
        <section className="teacher-panel route-teacher-panel" aria-labelledby="teacher-title">
          <p className="eyebrow">老师端</p>
          <h1 id="teacher-title">老师端看板</h1>
          {!teacherUser ? (
            <>
              <p className="hero-copy">登录老师账号后，可以查看学生进度、布置任务和发布评价。</p>
              <button className="primary-action" type="button" onClick={showTeacherProgress}>
                创建演示老师账号
              </button>
            </>
          ) : (
            <>
              <p className="teacher-account">老师账号：{teacherUser.displayName}</p>
              <TeacherDashboardOverview metrics={teacherDashboardMetrics} />
              <div className="teacher-actions" aria-label="老师任务操作">
                <button
                  className="secondary-action"
                  type="button"
                  onClick={createDefaultTeacherClass}
                >
                  创建班级
                </button>
                <button className="secondary-action" type="button" onClick={addStudentsToClass}>
                  添加学生
                </button>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={addManagedStudentAccount}
                >
                  新增学生账号
                </button>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={resetFirstStudentPassword}
                  disabled={teacherStudents.length === 0}
                >
                  重置学生密码
                </button>
                <button
                  className="primary-action"
                  type="button"
                  onClick={assignTeacherTask}
                  disabled={teacherStudents.length === 0}
                >
                  布置背词任务
                </button>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={evaluateTeacherTask}
                  disabled={!teacherTask}
                >
                  评价学生
                </button>
              </div>

              {teacherStudents.length > 0 ? (
                <p className="class-status">
                  学生已添加：{teacherStudents.map((student) => student.displayName).join('、')}
                </p>
              ) : null}
              {teacherStudents.length > 0 ? (
                <TeacherStudentCredentialsList students={teacherStudents} />
              ) : null}
              {selectedTeacherClass ? (
                <TeacherClassPanel teacherClass={selectedTeacherClass} students={teacherStudents} />
              ) : null}
              {teacherClassLeaderboard.length > 0 ? (
                <div className="teacher-class-leaderboard" aria-label="班级排行榜">
                  <LeaderboardPanel title="班级排行榜" entries={teacherClassLeaderboard} />
                </div>
              ) : null}

              <div className="progress-list" aria-label="学生背诵进度">
                {teacherProgress.map((progress) => (
                  <div className="progress-row" key={progress.userId}>
                    <div>
                      <strong>{progress.displayName}</strong>
                      <span>
                        {progress.accountType === 'guest' ? '游客' : '登录者'} · {progress.bookName}{' '}
                        · 第 {progress.unit} 单元
                      </span>
                    </div>
                    <div className="progress-metrics">
                      <span>
                        已背 {progress.recitedWordCount}/{progress.plannedWordCount} 个词
                      </span>
                      <span>掌握 {progress.masteredWordCount} 个词</span>
                    </div>
                  </div>
                ))}
              </div>

              {teacherTaskOverview ? (
                <div className="task-overview" aria-label="老师背词任务概览">
                  <div className="task-heading">
                    <h3>{teacherTaskOverview.task.title}</h3>
                    <span>截止 {teacherTaskOverview.task.dueDate}</span>
                  </div>
                  <div className="task-student-list">
                    {teacherTaskOverview.students.map((row) => (
                      <div className="task-row" key={row.student.id}>
                        <div>
                          <strong>{row.student.displayName}</strong>
                          <span>{row.student.accountType === 'guest' ? '游客' : '登录者'}</span>
                        </div>
                        <div className="task-metrics">
                          <span>
                            任务进度 {row.recitedWordCount}/{row.assignedWordCount} 个词
                          </span>
                          <span>掌握 {row.masteredWordCount} 个词</span>
                          <span>
                            {row.evaluationComment
                              ? `评价：${row.evaluationComment}`
                              : '待老师评价'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="app-title">
        <p className="eyebrow">人教版俄语</p>
        <h1 id="app-title">俄语百词斩</h1>
        <p className="hero-copy">
          初中和高中俄语词汇按册别、单元整理，包含背词、复习、错词、排行榜和老师任务。
        </p>
      </section>

      <section className="baseline-grid" aria-label="核心学习能力">
        {baselineItems.map((item) => (
          <article className="baseline-card" key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <section className="login-section" aria-labelledby="login-title">
        <div className="section-heading">
          <p className="eyebrow">登录</p>
          <h2 id="login-title">账号密码登录</h2>
        </div>

        <article className="login-panel">
          <div className="login-fields" aria-label="老师分配账号登录">
            <input
              className="text-input"
              aria-label="账号"
              autoComplete="username"
              value={loginUsername}
              onChange={updateLoginUsername}
            />
            <input
              className="text-input"
              aria-label="密码"
              autoComplete="current-password"
              placeholder="密码"
              type="password"
              value={loginPassword}
              onChange={updateLoginPassword}
            />
          </div>

          <div className="login-actions" aria-label="登录操作">
            <button className="primary-action" type="button" onClick={verifyTeacherAssignedLogin}>
              登录
            </button>
          </div>

          {loginMessage ? (
            <p className="login-message" aria-live="polite">
              {loginMessage}
            </p>
          ) : null}
        </article>
      </section>

      <section className="onboarding-section" aria-labelledby="onboarding-title">
        <div className="section-heading">
          <p className="eyebrow">学习入口</p>
          <h2 id="onboarding-title">学习计划</h2>
        </div>

        <article className="onboarding-panel">
          <div className="onboarding-copy">
            <h3>
              {featuredBookShortName}第 {featuredUnit?.unit ?? '1'} 单元
            </h3>
            <p>按每日新词目标生成学习计划。</p>
          </div>

          <div className="onboarding-actions" aria-label="新手引导操作">
            <button className="secondary-action" type="button" onClick={startGuestLearning}>
              访客开始学习
            </button>
            <button
              className="primary-action"
              type="button"
              onClick={generateStudyPlan}
              disabled={!featuredBook || !featuredUnit}
            >
              生成学习计划
            </button>
          </div>

          {activeLearner ? (
            <p className="guest-status">当前身份：{activeLearner.displayName}</p>
          ) : null}

          {activePlan && featuredBook ? (
            <div className="plan-summary" aria-live="polite">
              <strong>计划已生成</strong>
              <span>
                {featuredBook.name} · 第 {activePlan.unit} 单元
              </span>
              <span>每日新词 {activePlan.dailyNewWordTarget} 个</span>
              {featuredUnit ? (
                <span>
                  本单元 {featuredUnit.wordCount} 个词 · 今日词卡 {activePlan.dailyNewWordTarget} 张
                </span>
              ) : null}
              <span>
                词库已导入 {importedVocabularyBookCount} 册 · {importedVocabularyWordCount} 个词
              </span>
            </div>
          ) : null}

          <div className="study-actions" aria-label="学习与老师看板操作">
            <button
              className="primary-action"
              type="button"
              onClick={startStudySession}
              disabled={!activePlan || !activeLearner}
            >
              开始背诵
            </button>
            <button className="secondary-action" type="button" onClick={showTeacherProgress}>
              老师账号查看进度
            </button>
            <button
              className="primary-action"
              type="button"
              onClick={completeDailyCheckin}
              disabled={!studyResult}
            >
              完成今日打卡
            </button>
          </div>

          {studySession && currentStudyCard && !studyResult ? (
            <div className="study-card" aria-labelledby="study-card-title">
              <div className="study-card-topline">
                <h3 id="study-card-title">今日背诵</h3>
                <span>
                  词卡 {currentStudyCardNumber}/{studyCards.length}
                </span>
              </div>

              <div className="study-card-body">
                <strong>
                  {studyQuestionMode === 'zh_to_ru_dictation'
                    ? currentStudyCard.definitionZh
                    : currentStudyCard.lemma}
                </strong>
                {studyQuestionMode === 'zh_to_ru_dictation' ? (
                  <span>写出对应的俄语。</span>
                ) : (
                  <>
                    {currentStudyCard.stressedLemma ? (
                      <span>重音：{currentStudyCard.stressedLemma}</span>
                    ) : null}
                    <span>{currentStudyCard.grammarHint}</span>
                    <button
                      className="pronunciation-button"
                      type="button"
                      onClick={() => playRussianPronunciation(currentStudyCard.lemma)}
                    >
                      播放读音
                    </button>
                  </>
                )}
                {pronunciationMessage && studyQuestionMode !== 'zh_to_ru_dictation' ? (
                  <span className="pronunciation-status" aria-live="polite">
                    {pronunciationMessage}
                  </span>
                ) : null}
              </div>

              {!studyAnswerVisible ? (
                <>
                  <StudyQuestionModeSelector
                    selectedMode={studyQuestionMode}
                    onSelect={changeStudyQuestionMode}
                  />
                  {studyQuestionMode === 'choice' ? (
                    <RecallOptions options={currentRecallOptions} onSelect={answerRecallOption} />
                  ) : (
                    <DictationQuestion
                      answer={dictationAnswer}
                      mode={studyQuestionMode}
                      onAnswerChange={updateDictationAnswer}
                      onSubmit={submitDictationAnswer}
                    />
                  )}
                  <button className="secondary-action" type="button" onClick={showStudyAnswer}>
                    显示答案
                  </button>
                </>
              ) : (
                <div className="study-answer" aria-live="polite">
                  <strong>{currentStudyCard.definitionZh}</strong>
                  <span>{currentStudyCard.exampleRu}</span>
                  <span>{currentStudyCard.exampleZh}</span>
                  <div className="study-answer-actions">
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={() => answerStudyCard('again')}
                    >
                      不熟
                    </button>
                    <button
                      className="primary-action"
                      type="button"
                      onClick={() => answerStudyCard('good')}
                    >
                      掌握
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {studyResult ? (
            <div className="study-result" aria-live="polite">
              <strong>学习结果</strong>
              {studySession ? <span>本组词卡 {studySession.wordCards.length} 张</span> : null}
              <span>
                已背 {studyResult.studiedWordCount} 个词，掌握 {studyResult.masteredWordCount} 个词
              </span>
            </div>
          ) : null}
        </article>
      </section>

      <section className="offline-section" aria-labelledby="offline-title">
        <div className="section-heading">
          <p className="eyebrow">离线模式</p>
          <h2 id="offline-title">离线学习</h2>
        </div>

        <article className="offline-panel">
          <div className="offline-actions" aria-label="离线同步操作">
            <button
              className="secondary-action"
              type="button"
              onClick={cacheOfflineLearningPack}
              disabled={!activePlan || !activeLearner}
            >
              缓存离线学习包
            </button>
            <button
              className="primary-action"
              type="button"
              onClick={queueOfflineAnswer}
              disabled={!offlineLearningPack}
            >
              断网作答
            </button>
            <button
              className="secondary-action"
              type="button"
              onClick={syncOfflineQueue}
              disabled={pendingOfflineCount === 0}
            >
              恢复网络同步
            </button>
          </div>

          {offlineLearningPack ? (
            <div className="offline-pack" aria-live="polite">
              <strong>学习包已缓存：{offlineLearningPack.wordCards.length} 张词卡</strong>
              <span>离线会话：{offlineLearningPack.sessionId}</span>
              <span>有效期至 {offlineLearningPack.expiresAt.slice(0, 10)}</span>
            </div>
          ) : null}

          {offlineSyncMessage ? (
            <p className="offline-message" aria-live="polite">
              {offlineSyncMessage}
            </p>
          ) : null}

          {offlineServerConfirmed ? (
            <p className="offline-confirmation" aria-live="polite">
              同步已确认。
            </p>
          ) : null}
        </article>
      </section>

      {latestCheckin && dashboardSummary ? (
        <section className="dashboard-section" aria-labelledby="dashboard-title">
          <div className="section-heading">
            <p className="eyebrow">今日看板</p>
            <h2 id="dashboard-title">学习看板</h2>
          </div>

          <article className="dashboard-panel">
            <div className="checkin-summary" aria-live="polite">
              <strong>今日已打卡：连续 {latestCheckin.streakDays} 天</strong>
              <span>今日积分 {dashboardSummary.scoreToday}</span>
              <span>本周积分 {dashboardSummary.scoreWeek}</span>
            </div>

            <div className="dashboard-metrics" aria-label="今日学习指标">
              <div>
                <strong>{dashboardSummary.todayRecitedWordCount}</strong>
                <span>今日已背</span>
              </div>
              <div>
                <strong>{dashboardSummary.todayMasteredWordCount}</strong>
                <span>今日掌握</span>
              </div>
              <div>
                <strong>{dashboardSummary.mistakeWordCount}</strong>
                <span>错词待消灭</span>
              </div>
              <div>
                <strong>{dashboardSummary.dueReviewCount}</strong>
                <span>到期复习</span>
              </div>
            </div>

            <div className="trend-panel" aria-label="近 7 天趋势">
              <h3>近 7 天趋势</h3>
              <div className="trend-list">
                {dashboardSummary.recentTrend.map((point) => (
                  <span
                    className={point.checkedIn ? 'trend-day is-checked' : 'trend-day'}
                    key={point.date}
                  >
                    {point.date.slice(5)}
                  </span>
                ))}
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {dailyLeaderboard.length > 0 ? (
        <section className="leaderboard-section" aria-labelledby="leaderboard-title">
          <div className="section-heading">
            <p className="eyebrow">积分</p>
            <h2 id="leaderboard-title">排行榜</h2>
          </div>

          <div className="leaderboard-grid">
            <LeaderboardPanel title="今日榜" entries={dailyLeaderboard} />
            <LeaderboardPanel title="周榜" entries={weeklyLeaderboard} />
            <LeaderboardPanel title="册别榜" entries={bookLeaderboard} />
          </div>
        </section>
      ) : null}

      {teacherUser ? (
        <section className="teacher-section" aria-labelledby="teacher-title">
          <div className="section-heading">
            <p className="eyebrow">老师端</p>
            <h2 id="teacher-title">老师进度看板</h2>
          </div>

          <article className="teacher-panel">
            <p className="teacher-account">老师账号：{teacherUser.displayName}</p>
            <TeacherDashboardOverview metrics={teacherDashboardMetrics} />
            <div className="teacher-actions" aria-label="老师任务操作">
              <button
                className="secondary-action"
                type="button"
                onClick={createDefaultTeacherClass}
              >
                创建班级
              </button>
              <button className="secondary-action" type="button" onClick={addStudentsToClass}>
                添加学生
              </button>
              <button className="secondary-action" type="button" onClick={addManagedStudentAccount}>
                新增学生账号
              </button>
              <button
                className="secondary-action"
                type="button"
                onClick={resetFirstStudentPassword}
                disabled={teacherStudents.length === 0}
              >
                重置学生密码
              </button>
              <button
                className="primary-action"
                type="button"
                onClick={assignTeacherTask}
                disabled={teacherStudents.length === 0}
              >
                布置背词任务
              </button>
              <button
                className="secondary-action"
                type="button"
                onClick={evaluateTeacherTask}
                disabled={!teacherTask}
              >
                评价学生
              </button>
            </div>

            {teacherStudents.length > 0 ? (
              <p className="class-status">
                学生已添加：{teacherStudents.map((student) => student.displayName).join('、')}
              </p>
            ) : null}
            {teacherStudents.length > 0 ? (
              <TeacherStudentCredentialsList students={teacherStudents} />
            ) : null}
            {selectedTeacherClass ? (
              <TeacherClassPanel teacherClass={selectedTeacherClass} students={teacherStudents} />
            ) : null}
            {teacherClassLeaderboard.length > 0 ? (
              <div className="teacher-class-leaderboard" aria-label="班级排行榜">
                <LeaderboardPanel title="班级排行榜" entries={teacherClassLeaderboard} />
              </div>
            ) : null}

            <div className="progress-list" aria-label="学生背诵进度">
              {teacherProgress.map((progress) => (
                <div className="progress-row" key={progress.userId}>
                  <div>
                    <strong>{progress.displayName}</strong>
                    <span>
                      {progress.accountType === 'guest' ? '游客' : '登录者'} · {progress.bookName} ·
                      第 {progress.unit} 单元
                    </span>
                  </div>
                  <div className="progress-metrics">
                    <span>
                      已背 {progress.recitedWordCount}/{progress.plannedWordCount} 个词
                    </span>
                    <span>掌握 {progress.masteredWordCount} 个词</span>
                  </div>
                </div>
              ))}
            </div>

            {teacherTaskOverview ? (
              <div className="task-overview" aria-label="老师背词任务概览">
                <div className="task-heading">
                  <h3>{teacherTaskOverview.task.title}</h3>
                  <span>截止 {teacherTaskOverview.task.dueDate}</span>
                </div>
                <div className="task-student-list">
                  {teacherTaskOverview.students.map((row) => (
                    <div className="task-row" key={row.student.id}>
                      <div>
                        <strong>{row.student.displayName}</strong>
                        <span>{row.student.accountType === 'guest' ? '游客' : '登录者'}</span>
                      </div>
                      <div className="task-metrics">
                        <span>
                          任务进度 {row.recitedWordCount}/{row.assignedWordCount} 个词
                        </span>
                        <span>掌握 {row.masteredWordCount} 个词</span>
                        <span>
                          {row.evaluationComment ? `评价：${row.evaluationComment}` : '待老师评价'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </article>
        </section>
      ) : null}

      <section className="review-section" aria-labelledby="review-title">
        <div className="section-heading">
          <p className="eyebrow">错词复习</p>
          <h2 id="review-title">复习与错词</h2>
        </div>

        <article className="review-panel">
          <div className="review-actions" aria-label="复习与错词操作">
            <button className="secondary-action" type="button" onClick={simulateMistakeReview}>
              错词复习
            </button>
            <button
              className="primary-action"
              type="button"
              onClick={eliminateMistake}
              disabled={!reviewProgress || mistakes.length === 0}
            >
              完成错词消灭
            </button>
          </div>

          {mistakes.length > 0 ? (
            <div className="mistake-list" aria-label="错词本">
              <h3>错词本</h3>
              {mistakes.map((mistake) => (
                <div className="mistake-row" key={mistake.wordId}>
                  <strong>{mistake.lemma}</strong>
                  <span>{mistake.definitionZh}</span>
                  <span>{formatErrorType(mistake.lastErrorType)} · 10 分钟后复习</span>
                </div>
              ))}
            </div>
          ) : null}

          {mistakeResolved ? (
            <div className="mistake-resolved" aria-live="polite">
              <strong>错词已消灭</strong>
              <span>连续正确 3 次</span>
            </div>
          ) : null}
        </article>
      </section>

      {vocabularyCatalog.length > 0 ? (
        <section className="vocabulary-section" aria-labelledby="vocabulary-title">
          <div className="section-heading">
            <p className="eyebrow">教材词库</p>
            <h2 id="vocabulary-title">人教版俄语词库</h2>
          </div>

          <article className="book-panel">
            <div>
              <h3>词库覆盖</h3>
              <p>
                {vocabularyCatalog.length} 册 · {importedVocabularyWordCount} 个词
                {pendingVocabularyBookCount > 0 ? ` · ${pendingVocabularyBookCount} 册待导入` : ''}
              </p>
            </div>

            <div className="book-list" aria-label="人教版俄语册别">
              {vocabularyCatalog.map((book) => (
                <div className="book-row" key={book.slug}>
                  <div>
                    <strong>{book.name}</strong>
                    <span>
                      {book.educationStage === 'junior' ? '初中' : '高中'} · {book.volume} ·{' '}
                      {book.source}
                    </span>
                  </div>
                  <span>{book.wordCount > 0 ? `${book.wordCount} 个词` : '待导入'}</span>
                </div>
              ))}
            </div>

            {featuredBook ? (
              <div className="unit-list" aria-label={`${featuredBook.name} 单元`}>
                {featuredUnits.map((unit) => (
                  <div className="unit-row" key={unit.unit}>
                    <div>
                      <strong>{unit.unitTitle}</strong>
                      <span>第 {unit.unit} 单元</span>
                    </div>
                    <span>{unit.wordCount} 个词</span>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        </section>
      ) : null}

      <section className="privacy-section" aria-labelledby="privacy-title">
        <div className="section-heading">
          <p className="eyebrow">账号与隐私</p>
          <h2 id="privacy-title">隐私与账号</h2>
        </div>

        <article className="privacy-panel">
          <div className="legal-links" aria-label="法律文档">
            <a href="/privacy.html">隐私政策</a>
            <a href="/terms.html">用户协议</a>
          </div>
          <button className="secondary-action" type="button" onClick={clearLocalLearningData}>
            清除本机学习数据
          </button>
        </article>
      </section>
    </main>
  )
}

function LeaderboardPanel({ title, entries }: { title: string; entries: LeaderboardEntry[] }) {
  return (
    <article className="leaderboard-panel">
      <h3>{title}</h3>
      <div className="leaderboard-list">
        {entries.map((entry) => (
          <div className="leaderboard-row" key={`${title}-${entry.userId}`}>
            <strong>
              第 {entry.rank} 名 · {entry.displayName} · {entry.score} 分
            </strong>
            <span>
              掌握 {entry.masteredWordCount} 个词 · 连续 {entry.streakDays} 天
            </span>
          </div>
        ))}
      </div>
    </article>
  )
}

function TeacherStudentCredentialsList({ students }: { students: TeacherStudent[] }) {
  return (
    <div className="credential-list" aria-label="学生登录账号">
      {students.map((student) => (
        <div className="credential-row" key={student.id}>
          <strong>{student.displayName}</strong>
          <span>账号：{student.loginUsername}</span>
          <span>初始密码：{student.initialPassword}</span>
        </div>
      ))}
    </div>
  )
}

function TeacherClassPanel({
  teacherClass,
  students,
}: {
  teacherClass: TeacherClass
  students: TeacherStudent[]
}) {
  const classStudents = students.filter((student) => student.classId === teacherClass.id)

  return (
    <div className="teacher-class-panel" aria-label="班级分组">
      <strong>当前班级：{teacherClass.name}</strong>
      <span>
        班级成员：
        {classStudents.length > 0
          ? classStudents.map((student) => student.displayName).join('、')
          : '暂未添加'}
      </span>
    </div>
  )
}

function TeacherDashboardOverview({ metrics }: { metrics: TeacherDashboardMetrics }) {
  return (
    <section className="teacher-dashboard-overview" aria-label="班级概览">
      <div className="teacher-dashboard-heading">
        <h2>班级概览</h2>
        <span>学生进度、任务和评价集中查看。</span>
      </div>
      <div className="teacher-metric-grid">
        <div>
          <span>学生人数</span>
          <strong>{metrics.studentCount}</strong>
        </div>
        <div>
          <span>已掌握</span>
          <strong>{metrics.masteredWordCount}</strong>
        </div>
        <div>
          <span>平均完成率</span>
          <strong>{metrics.averageCompletionRate}%</strong>
        </div>
        <div>
          <span>待评价</span>
          <strong>{metrics.pendingEvaluationCount}</strong>
        </div>
      </div>
      {metrics.activeTaskCount > 0 ? (
        <p className="teacher-overview-note">当前有 {metrics.activeTaskCount} 个进行中任务。</p>
      ) : (
        <p className="teacher-overview-note">添加学生后即可布置背词任务。</p>
      )}
    </section>
  )
}

function StudyQuestionModeSelector({
  selectedMode,
  onSelect,
}: {
  selectedMode: StudyQuestionMode
  onSelect: (mode: StudyQuestionMode) => void
}) {
  const modes: Array<{ label: string; value: StudyQuestionMode }> = [
    { label: '选义题', value: 'choice' },
    { label: '俄译汉默写', value: 'ru_to_zh_dictation' },
    { label: '汉译俄默写', value: 'zh_to_ru_dictation' },
  ]

  return (
    <div className="question-mode-selector" aria-label="题型选择">
      {modes.map((mode) => (
        <button
          className={
            mode.value === selectedMode ? 'question-mode-button is-active' : 'question-mode-button'
          }
          type="button"
          aria-pressed={mode.value === selectedMode}
          key={mode.value}
          onClick={() => onSelect(mode.value)}
        >
          {mode.label}
        </button>
      ))}
    </div>
  )
}

function RecallOptions({
  options,
  onSelect,
}: {
  options: string[]
  onSelect: (option: string) => void
}) {
  const optionLabels = ['A', 'B', 'C']

  return (
    <fieldset className="recall-options" aria-label="主动回忆选项">
      <legend>主动回忆</legend>
      <p>选出这个词的中文意思。</p>
      <div className="recall-option-grid">
        {options.map((option, index) => (
          <button
            className="recall-option"
            type="button"
            key={`${option}-${index}`}
            onClick={() => onSelect(option)}
          >
            <span>{optionLabels[index]}</span>
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function DictationQuestion({
  answer,
  mode,
  onAnswerChange,
  onSubmit,
}: {
  answer: string
  mode: Exclude<StudyQuestionMode, 'choice'>
  onAnswerChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSubmit: () => void
}) {
  const prompt = mode === 'ru_to_zh_dictation' ? '写出这个词的中文意思。' : '写出对应的俄语。'

  return (
    <fieldset className="dictation-question" aria-label="默写题">
      <legend>默写题</legend>
      <p>{prompt}</p>
      <form
        className="dictation-form"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <label htmlFor="dictation-answer">默写答案</label>
        <input id="dictation-answer" autoComplete="off" value={answer} onChange={onAnswerChange} />
        <button className="primary-action" type="submit" disabled={!answer.trim()}>
          提交默写
        </button>
      </form>
    </fieldset>
  )
}

function formatErrorType(errorType: MistakeEntry['lastErrorType']): string {
  const errorTypeLabels = {
    meaning: '语义错误',
    spelling: '拼写错误',
    listening: '听音错误',
    stress: '重音错误',
    grammar: '语法错误',
    context: '语境错误',
  } as const

  return errorTypeLabels[errorType]
}

function formatDateAfterDays(isoTimestamp: string, days: number): string {
  const date = new Date(isoTimestamp)
  date.setUTCDate(date.getUTCDate() + days)

  return date.toISOString().slice(0, 10)
}

function clampDailyNewWordTarget(value: string, max: number): number {
  const parsedValue = Number.parseInt(value, 10)

  if (!Number.isFinite(parsedValue)) {
    return 1
  }

  return Math.min(Math.max(parsedValue, 1), max)
}

function buildTeacherDashboardMetrics({
  progressSummaries,
  students,
  task,
  taskOverview,
}: {
  progressSummaries: LearnerProgressSummary[]
  students: TeacherStudent[]
  task: TeacherTask | null
  taskOverview: TeacherTaskOverview | null
}): TeacherDashboardMetrics {
  const studentCount = students.length > 0 ? students.length : progressSummaries.length
  const masteredWordCount = progressSummaries.reduce(
    (total, progress) => total + progress.masteredWordCount,
    0,
  )
  const averageCompletionRate =
    progressSummaries.length === 0
      ? 0
      : Math.round(
          (progressSummaries.reduce((total, progress) => {
            if (progress.plannedWordCount === 0) {
              return total
            }

            return total + progress.recitedWordCount / progress.plannedWordCount
          }, 0) *
            100) /
            progressSummaries.length,
        )
  const pendingEvaluationCount = taskOverview
    ? taskOverview.students.filter((student) => !student.evaluationRating).length
    : task
      ? studentCount
      : 0

  return {
    studentCount,
    activeTaskCount: task ? 1 : 0,
    masteredWordCount,
    averageCompletionRate,
    pendingEvaluationCount,
  }
}

function buildTeacherClassLeaderboard({
  progressSummaries,
  students,
  teacherClass,
}: {
  progressSummaries: LearnerProgressSummary[]
  students: TeacherStudent[]
  teacherClass: TeacherClass | null
}): LeaderboardEntry[] {
  if (!teacherClass) {
    return []
  }

  const classStudentIds = new Set(teacherClass.studentIds)
  const classStudents = students.filter((student) => classStudentIds.has(student.id))
  const progressByLearnerId = new Map(
    progressSummaries.map((progress) => [progress.userId, progress]),
  )

  return classStudents
    .map((student) => {
      const progress = progressByLearnerId.get(student.learnerId)
      const recitedWordCount = progress?.recitedWordCount ?? 0
      const masteredWordCount = progress?.masteredWordCount ?? 0

      return {
        scope: 'class',
        userId: student.learnerId,
        displayName: student.displayName,
        accountType: student.accountType,
        score: masteredWordCount * 10 + recitedWordCount * 3,
        rank: 1,
        masteredWordCount,
        reviewCompletionRate:
          recitedWordCount === 0 ? 0 : Math.min(1, masteredWordCount / recitedWordCount),
        streakDays: 0,
        bookId: null,
        classId: teacherClass.id,
        updatedAt: new Date().toISOString(),
      } satisfies LeaderboardEntry
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score
      }

      if (left.masteredWordCount !== right.masteredWordCount) {
        return right.masteredWordCount - left.masteredWordCount
      }

      return left.displayName.localeCompare(right.displayName, 'zh-CN')
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))
}

function buildRecallOptions(currentCard: StudyWordCard): string[] {
  const currentWord = pepRussianWords.find((word) => word.id === currentCard.wordId)
  const candidateWords: RussianWord[] = pepRussianWords.filter(
    (word) =>
      word.id !== currentCard.wordId && getRussianWordDefinition(word) !== currentCard.definitionZh,
  )
  const prioritizedWords: RussianWord[] = [
    ...candidateWords.filter(
      (word) => word.bookId === currentWord?.bookId && word.unit === currentWord?.unit,
    ),
    ...candidateWords.filter(
      (word) => word.bookId === currentWord?.bookId && word.unit !== currentWord?.unit,
    ),
    ...candidateWords,
  ]
  const distractors: string[] = []

  for (const word of prioritizedWords) {
    const definition = getRussianWordDefinition(word)

    if (definition && !distractors.includes(definition)) {
      distractors.push(definition)
    }

    if (distractors.length === 2) {
      break
    }
  }

  const options: string[] = [currentCard.definitionZh, ...distractors]
  const offset =
    currentCard.wordId.split('').reduce((total, character) => total + character.charCodeAt(0), 0) %
    options.length

  return [...options.slice(offset), ...options.slice(0, offset)]
}

function isDictationAnswerCorrect({
  answer,
  card,
  mode,
}: {
  answer: string
  card: StudyWordCard
  mode: StudyQuestionMode
}): boolean {
  const normalizedAnswer = normalizeDictationText(answer)

  if (!normalizedAnswer || mode === 'choice') {
    return false
  }

  if (mode === 'zh_to_ru_dictation') {
    return [card.lemma, card.stressedLemma ?? ''].some(
      (candidate) => normalizeDictationText(candidate) === normalizedAnswer,
    )
  }

  return splitChineseDefinitions(card.definitionZh).some(
    (candidate) => normalizeDictationText(candidate) === normalizedAnswer,
  )
}

function splitChineseDefinitions(definition: string): string[] {
  return [definition, ...definition.split(/[；;，,、/]/u)]
}

function normalizeDictationText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase()
}

function getRussianWordDefinition(word: RussianWord): string | null {
  return word.meanings[0]?.definitionZh ?? null
}

function getInitialRoutePath(): string {
  return typeof window === 'undefined' ? '/' : getCurrentRoutePath()
}

function getCurrentRoutePath(): string {
  return normalizeRoutePath(window.location.pathname)
}

function normalizeRoutePath(path: string): string {
  const normalizedPath = path.split('?')[0]?.replace(/\/+$/, '') || '/'

  return normalizedPath === '' ? '/' : normalizedPath
}
