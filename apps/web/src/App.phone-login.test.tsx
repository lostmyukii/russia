import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('teacher assigned account login', () => {
  it('lets a learner sign in with a teacher assigned account and password', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('link', { name: '开始学习' }))

    expect(screen.getByRole('heading', { name: '账号密码登录' })).toBeInTheDocument()
    expect(screen.queryByLabelText('手机号')).not.toBeInTheDocument()
    expect(screen.getByText('示例账号：student01 / ru123456')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('账号'), { target: { value: 'student01' } })
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'ru123456' } })
    fireEvent.click(screen.getByRole('button', { name: '登录并继续' }))

    expect(screen.getByRole('heading', { name: '生成你的学习计划' })).toBeInTheDocument()
    expect(screen.getByText('人教版初中俄语七年级全一册')).toBeInTheDocument()
  })
})
