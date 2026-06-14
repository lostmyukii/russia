import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('launch readiness privacy controls', () => {
  it('links legal documents and lets a learner clear local demo data', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '访客开始学习' }))
    fireEvent.click(screen.getByRole('button', { name: '生成学习计划' }))

    expect(screen.getByText('计划已生成')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '隐私政策' })).toHaveAttribute('href', '/privacy.html')
    expect(screen.getByRole('link', { name: '用户协议' })).toHaveAttribute('href', '/terms.html')

    fireEvent.click(screen.getByRole('button', { name: '清除本机学习数据' }))

    expect(screen.queryByText('计划已生成')).not.toBeInTheDocument()
    expect(screen.queryByText('当前身份：游客学习者')).not.toBeInTheDocument()
  })
})
