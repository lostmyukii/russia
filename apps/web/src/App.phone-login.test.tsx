import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('phone verification login', () => {
  it('lets a learner sign in with the development verification code', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('link', { name: '开始学习' }))
    fireEvent.change(screen.getByLabelText('手机号'), { target: { value: '13900000000' } })
    fireEvent.click(screen.getByRole('button', { name: '获取验证码' }))

    expect(screen.getByText('开发验证码：246810')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('验证码'), { target: { value: '246810' } })
    fireEvent.click(screen.getByRole('button', { name: '登录并继续' }))

    expect(screen.getByRole('heading', { name: '生成你的学习计划' })).toBeInTheDocument()
    expect(screen.getByText('人教版初中俄语七年级全一册')).toBeInTheDocument()
  })
})
