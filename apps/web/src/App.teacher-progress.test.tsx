import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'
import { completeGuestStudySession } from './test-utils'

describe('teacher progress dashboard', () => {
  it('shows recitation progress for guest and registered learners', () => {
    render(<App />)

    completeGuestStudySession()
    fireEvent.click(screen.getByRole('link', { name: '返回今日任务' }))
    fireEvent.click(screen.getByRole('button', { name: '老师端' }))

    expect(screen.getByText('老师账号：俄语老师')).toBeInTheDocument()
    expect(screen.getByText('登录学习者')).toBeInTheDocument()
    expect(screen.getByText('访客学习者')).toBeInTheDocument()
    expect(screen.getByText(/登录者/)).toBeInTheDocument()
    expect(screen.getByText(/游客/)).toBeInTheDocument()
    expect(screen.getAllByText('已背 1/31 个词')).toHaveLength(2)
  })
})
