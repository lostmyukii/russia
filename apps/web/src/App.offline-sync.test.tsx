import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('offline sync workflow', () => {
  it('caches a learning pack, queues offline answers and updates score only after sync', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '访客开始学习' }))
    fireEvent.click(screen.getByRole('button', { name: '生成学习计划' }))
    fireEvent.click(screen.getByRole('button', { name: '缓存离线学习包' }))
    fireEvent.click(screen.getByRole('button', { name: '模拟断网作答' }))

    expect(screen.getByText('学习包已缓存：1 张词卡')).toBeInTheDocument()
    expect(screen.getByText('作答待同步：1 条')).toBeInTheDocument()
    expect(screen.queryByText('今日积分 10')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '恢复网络同步' }))

    expect(screen.getByText('已自动同步 1 条离线作答')).toBeInTheDocument()
    expect(screen.getByText('服务端已确认，可继续打卡和更新榜单。')).toBeInTheDocument()
    expect(screen.getByText('已背 1 个词，掌握 1 个词')).toBeInTheDocument()
  })
})
