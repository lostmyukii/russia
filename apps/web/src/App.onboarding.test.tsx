import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('onboarding flow', () => {
  it('lets a guest learner create a PEP Russian study plan', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '访客开始学习' }))
    fireEvent.click(screen.getByRole('button', { name: '生成学习计划' }))

    expect(screen.getByText('计划已生成')).toBeInTheDocument()
    expect(screen.getByText('人教版初中俄语七年级上册 · 第 1 单元')).toBeInTheDocument()
    expect(screen.getByText('每日新词 1 个')).toBeInTheDocument()
  })
})
