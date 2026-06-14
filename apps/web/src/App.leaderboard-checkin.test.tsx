import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('leaderboard and check-in workflow', () => {
  it('shows check-in, dashboard and leaderboard after a completed study session', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '访客开始学习' }))
    fireEvent.click(screen.getByRole('button', { name: '生成学习计划' }))
    fireEvent.click(screen.getByRole('button', { name: '完成首组背诵' }))
    fireEvent.click(screen.getByRole('button', { name: '完成今日打卡' }))

    expect(screen.getByText('今日已打卡：连续 1 天')).toBeInTheDocument()
    expect(screen.getByText('学习看板')).toBeInTheDocument()
    expect(screen.getByText('今日积分 10')).toBeInTheDocument()
    expect(screen.getByText('近 7 天趋势')).toBeInTheDocument()
    expect(screen.getByText('排行榜')).toBeInTheDocument()
    expect(screen.getByText('今日榜')).toBeInTheDocument()
    expect(screen.getByText('周榜')).toBeInTheDocument()
    expect(screen.getByText('册别榜')).toBeInTheDocument()
    expect(screen.getAllByText('第 1 名 · 访客学习者 · 10 分')).toHaveLength(3)
  })
})
