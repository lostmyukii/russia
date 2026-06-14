import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'
import { completeGuestStudySession } from './test-utils'

describe('leaderboard and check-in workflow', () => {
  it('shows check-in, dashboard and leaderboard after a completed study session', () => {
    render(<App />)

    completeGuestStudySession()
    fireEvent.click(screen.getByRole('button', { name: '完成今日打卡' }))
    fireEvent.click(screen.getByRole('link', { name: '返回今日任务' }))

    expect(screen.getByText('今日已打卡：连续 1 天')).toBeInTheDocument()
    expect(screen.getByText(/今日积分 10/)).toBeInTheDocument()
    expect(screen.getByText('排行榜')).toBeInTheDocument()
    expect(screen.getByText('今日榜')).toBeInTheDocument()
    expect(screen.getByText('周榜')).toBeInTheDocument()
    expect(screen.getByText('册别榜')).toBeInTheDocument()
    expect(screen.getAllByText('第 1 名 · 访客学习者 · 10 分')).toHaveLength(3)
  })
})
