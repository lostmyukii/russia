import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('teacher progress dashboard', () => {
  it('shows recitation progress for guest and registered learners', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '访客开始学习' }))
    fireEvent.click(screen.getByRole('button', { name: '生成学习计划' }))
    fireEvent.click(screen.getByRole('button', { name: '完成首组背诵' }))
    fireEvent.click(screen.getByRole('button', { name: '老师账号查看进度' }))

    expect(screen.getByText('老师账号：俄语老师')).toBeInTheDocument()
    expect(screen.getByText('登录学习者')).toBeInTheDocument()
    expect(screen.getByText('访客学习者')).toBeInTheDocument()
    expect(screen.getByText(/登录者/)).toBeInTheDocument()
    expect(screen.getByText(/游客/)).toBeInTheDocument()
    expect(screen.getAllByText('已背 1/2 个词')).toHaveLength(2)
  })
})
