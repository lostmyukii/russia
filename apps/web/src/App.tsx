import { useState } from 'react'

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
  createTeacherTask,
  getQueuedOfflineSyncOperations,
  evaluateStudentTask,
  groupRussianWordsByUnit,
  markOfflineSyncOperationSynced,
  pepRussianVocabularyBooks,
  type GuestUser,
  type CheckinRecord,
  type DashboardSummary,
  type LearnerAccount,
  type LeaderboardEntry,
  type LearnerProgressSummary,
  type MistakeEntry,
  type OfflineLearningPack,
  type OfflineSyncOperation,
  type StudyPlan,
  type StudyScoreEvent,
  type StudySession,
  type StudySessionResult,
  type TeacherStudent,
  type TeacherTask,
  type TeacherTaskOverview,
  type TeacherUser,
  type UserWordProgress,
} from '@russian-wordscodex/domain'

const baselineItems = [
  {
    title: '人教版教材单元词库',
    description: '按教材版本、册别、单元、课次组织初高中俄语词汇。',
  },
  {
    title: 'SRS 复习',
    description: '先完成主动回忆，再按作答质量安排下一次复习。',
  },
  {
    title: '有效背词排行榜',
    description: '只统计服务端确认后的有效掌握、到期复习和错词消灭。',
  },
]

export function App() {
  const featuredBook = pepRussianVocabularyBooks[0]
  const featuredUnits = featuredBook ? groupRussianWordsByUnit(featuredBook.slug) : []
  const featuredUnit = featuredUnits[0]
  const [guestUser, setGuestUser] = useState<GuestUser | null>(null)
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null)
  const [studySession, setStudySession] = useState<StudySession | null>(null)
  const [studyResult, setStudyResult] = useState<StudySessionResult | null>(null)
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
  const [teacherTask, setTeacherTask] = useState<TeacherTask | null>(null)
  const [teacherTaskOverview, setTeacherTaskOverview] = useState<TeacherTaskOverview | null>(null)
  const [reviewProgress, setReviewProgress] = useState<UserWordProgress | null>(null)
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([])
  const [mistakeResolved, setMistakeResolved] = useState(false)
  const [offlineLearningPack, setOfflineLearningPack] = useState<OfflineLearningPack | null>(null)
  const [offlineQueue, setOfflineQueue] = useState<OfflineSyncOperation[]>([])
  const [offlineSyncMessage, setOfflineSyncMessage] = useState<string | null>(null)
  const [offlineServerConfirmed, setOfflineServerConfirmed] = useState(false)

  function startGuestLearning() {
    setGuestUser(createGuestLearner({ now: new Date().toISOString() }))
  }

  function generateStudyPlan() {
    if (!featuredBook || !featuredUnit) {
      return
    }

    const now = new Date().toISOString()
    const user = guestUser ?? createGuestLearner({ now })
    const result = createStudyPlanFromOnboarding({
      userId: user.id,
      preferences: {
        educationStage: featuredBook.educationStage,
        grade: featuredBook.grade,
        bookId: featuredBook.id,
        unit: featuredUnit.unit,
        dailyNewWordTarget: 1,
        reminderEnabled: true,
      },
      targetDate: null,
      now,
    })

    setGuestUser(user)
    setActivePlan(result.studyPlan)
    setStudySession(null)
    setStudyResult(null)
    setScoreEvents([])
    setCheckins([])
    setLatestCheckin(null)
    setDashboardSummary(null)
    setDailyLeaderboard([])
    setWeeklyLeaderboard([])
    setBookLeaderboard([])
    setTeacherProgress([])
    setClassLearners([])
    setClassPlans([])
    setClassResults([])
    setTeacherStudents([])
    setTeacherTask(null)
    setTeacherTaskOverview(null)
    setOfflineLearningPack(null)
    setOfflineQueue([])
    setOfflineSyncMessage(null)
    setOfflineServerConfirmed(false)
  }

  function completeFirstStudySession() {
    if (!activePlan || !guestUser) {
      return
    }

    const now = new Date().toISOString()
    const session = createStudySessionFromPlan({ plan: activePlan, now })
    const result = completeStudySession({
      session,
      request: {
        userId: guestUser.id,
        reviews: session.wordCards.map((card, index) => ({
          wordId: card.wordId,
          answerQuality: index === 0 ? 'good' : 'again',
          responseMs: index === 0 ? 5200 : 9000,
        })),
      },
      now,
    })

    setStudySession(session)
    setStudyResult(result)
    setScoreEvents(
      buildScoreEventsForStudyResult({
        session,
        result,
        idempotencyKey: `complete-${guestUser.id}`,
      }),
    )
    setLatestCheckin(null)
    setDashboardSummary(null)
    setDailyLeaderboard([])
    setWeeklyLeaderboard([])
    setBookLeaderboard([])
    setOfflineLearningPack(null)
    setOfflineQueue([])
    setOfflineSyncMessage(null)
    setOfflineServerConfirmed(false)
  }

  function cacheOfflineLearningPack() {
    if (!activePlan || !guestUser) {
      return
    }

    const now = new Date().toISOString()
    const session = createStudySessionFromPlan({ plan: activePlan, now })
    const pack = createOfflineLearningPack({ session, now })

    setStudySession(session)
    setOfflineLearningPack(pack)
    setOfflineQueue([])
    setOfflineSyncMessage(null)
    setOfflineServerConfirmed(false)
    setStudyResult(null)
    setScoreEvents([])
    setCheckins([])
    setLatestCheckin(null)
    setDashboardSummary(null)
    setDailyLeaderboard([])
    setWeeklyLeaderboard([])
    setBookLeaderboard([])
  }

  function queueOfflineAnswer() {
    if (!guestUser || !offlineLearningPack) {
      return
    }

    const now = new Date().toISOString()
    const operation = createOfflineSyncOperation({
      type: 'study_session_complete',
      userId: guestUser.id,
      endpoint: `/api/v1/study-sessions/${offlineLearningPack.sessionId}/complete`,
      idempotencyKey: `complete-offline-${guestUser.id}-${offlineLearningPack.sessionId}`,
      payload: {
        sessionId: offlineLearningPack.sessionId,
        request: {
          userId: guestUser.id,
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
    if (!featuredBook || !guestUser || !activePlan || !studyResult || !studySession) {
      return
    }

    const now = studyResult.completedAt
    const currentScoreEvents =
      scoreEvents.length > 0
        ? scoreEvents
        : buildScoreEventsForStudyResult({
            session: studySession,
            result: studyResult,
            idempotencyKey: `complete-${guestUser.id}`,
          })
    const checkin = createCheckinRecord({
      userId: guestUser.id,
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
      userId: guestUser.id,
      plan: activePlan,
      results: [studyResult],
      progressList: reviewProgress ? [reviewProgress] : [],
      scoreEvents: currentScoreEvents,
      checkins: nextCheckins,
      now,
    })
    const leaderboardLearners = [guestUser]

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
            wordId: registeredSession.wordCards[0]?.wordId ?? 'word_shkola',
            answerQuality: 'easy',
            responseMs: 3200,
          },
        ],
      },
      now,
    })

    const learners = guestUser ? [registeredLearner, guestUser] : [registeredLearner]
    const plans = activePlan ? [registeredPlan, activePlan] : [registeredPlan]
    const results = studyResult ? [registeredResult, studyResult] : [registeredResult]
    const progressSummaries = buildTeacherProgressSummaries({ learners, plans, results })

    setTeacherUser(teacher)
    setTeacherProgress(progressSummaries)
    setClassLearners(learners)
    setClassPlans(plans)
    setClassResults(results)
    setTeacherStudents([])
    setTeacherTask(null)
    setTeacherTaskOverview(null)
  }

  function addStudentsToClass() {
    if (!teacherUser || classLearners.length === 0) {
      return
    }

    const now = new Date().toISOString()
    const students = classLearners.map((learner) =>
      addStudentToTeacher({ teacher: teacherUser, learner, now }),
    )

    setTeacherStudents(students)
    setTeacherTask(null)
    setTeacherTaskOverview(null)
  }

  function assignTeacherTask() {
    if (!featuredBook || !featuredUnit || !teacherUser || teacherStudents.length === 0) {
      return
    }

    const task = createTeacherTask({
      teacherId: teacherUser.id,
      title: `七年级上册第 ${featuredUnit.unit} 单元背词任务`,
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
        comment: '词义掌握稳定，继续保持。',
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
    const initial = createInitialWordProgress({
      userId: guestUser?.id ?? 'guest_preview',
      wordId: 'word_klass',
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
    setActivePlan(null)
    setStudySession(null)
    setStudyResult(null)
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

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="app-title">
        <p className="eyebrow">Russian Wordscodex MVP</p>
        <h1 id="app-title">俄语百词斩</h1>
        <p className="hero-copy">
          面向初中、高中俄语学习者，围绕人教版教材单元建立背词、复习、错词和榜单闭环。
        </p>
      </section>

      <section className="baseline-grid" aria-label="工程基线能力">
        {baselineItems.map((item) => (
          <article className="baseline-card" key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <section className="onboarding-section" aria-labelledby="onboarding-title">
        <div className="section-heading">
          <p className="eyebrow">Guest Onboarding</p>
          <h2 id="onboarding-title">新手引导</h2>
        </div>

        <article className="onboarding-panel">
          <div className="onboarding-copy">
            <h3>人教版俄语学习入口</h3>
            <p>默认从初中俄语七年级上册第 1 单元开始，按每日新词目标生成首个学习计划。</p>
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

          {guestUser ? <p className="guest-status">当前身份：{guestUser.displayName}</p> : null}

          {activePlan && featuredBook ? (
            <div className="plan-summary" aria-live="polite">
              <strong>计划已生成</strong>
              <span>
                {featuredBook.name} · 第 {activePlan.unit} 单元
              </span>
              <span>每日新词 {activePlan.dailyNewWordTarget} 个</span>
            </div>
          ) : null}

          <div className="study-actions" aria-label="学习与老师看板操作">
            <button
              className="primary-action"
              type="button"
              onClick={completeFirstStudySession}
              disabled={!activePlan || !guestUser}
            >
              完成首组背诵
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
          <p className="eyebrow">PWA Offline Sync</p>
          <h2 id="offline-title">离线学习与同步</h2>
        </div>

        <article className="offline-panel">
          <div className="offline-actions" aria-label="离线同步操作">
            <button
              className="secondary-action"
              type="button"
              onClick={cacheOfflineLearningPack}
              disabled={!activePlan || !guestUser}
            >
              缓存离线学习包
            </button>
            <button
              className="primary-action"
              type="button"
              onClick={queueOfflineAnswer}
              disabled={!offlineLearningPack}
            >
              模拟断网作答
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
              服务端已确认，可继续打卡和更新榜单。
            </p>
          ) : null}
        </article>
      </section>

      {latestCheckin && dashboardSummary ? (
        <section className="dashboard-section" aria-labelledby="dashboard-title">
          <div className="section-heading">
            <p className="eyebrow">Check-in & Leaderboard</p>
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
            <p className="eyebrow">Effective Score</p>
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
            <p className="eyebrow">Teacher Dashboard</p>
            <h2 id="teacher-title">老师进度看板</h2>
          </div>

          <article className="teacher-panel">
            <p className="teacher-account">老师账号：{teacherUser.displayName}</p>
            <div className="teacher-actions" aria-label="老师任务操作">
              <button className="secondary-action" type="button" onClick={addStudentsToClass}>
                添加学生
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
          <p className="eyebrow">SRS Review</p>
          <h2 id="review-title">复习与错词</h2>
        </div>

        <article className="review-panel">
          <div className="review-actions" aria-label="复习与错词操作">
            <button className="secondary-action" type="button" onClick={simulateMistakeReview}>
              模拟错词复习
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

      {featuredBook ? (
        <section className="vocabulary-section" aria-labelledby="vocabulary-title">
          <div className="section-heading">
            <p className="eyebrow">PEP Russian Vocabulary</p>
            <h2 id="vocabulary-title">人教版俄语词库</h2>
          </div>

          <article className="book-panel">
            <div>
              <h3>{featuredBook.name}</h3>
              <p>
                {featuredBook.textbookVersion} · {featuredBook.volume} · {featuredBook.wordCount}{' '}
                个词
              </p>
            </div>

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
          </article>
        </section>
      ) : null}

      <section className="privacy-section" aria-labelledby="privacy-title">
        <div className="section-heading">
          <p className="eyebrow">Privacy & Account</p>
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
