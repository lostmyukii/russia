import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'
import { createGuestStudyPlan } from './test-utils'

describe('launch readiness privacy controls', () => {
  it('links legal documents and lets a learner clear local demo data', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: '隐私政策' })).toHaveAttribute('href', '/privacy.html')
    expect(screen.getByRole('link', { name: '用户协议' })).toHaveAttribute('href', '/terms.html')

    createGuestStudyPlan()

    expect(screen.getByRole('heading', { name: '今日任务' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '清除本机学习数据' }))

    expect(screen.getByText('请先登录或使用访客身份，再生成学习计划。')).toBeInTheDocument()
  })
})
