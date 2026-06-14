import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'
import { createGuestStudyPlan, enterAsGuest } from './test-utils'

describe('onboarding flow', () => {
  it('lets a guest learner create a PEP Russian study plan', () => {
    render(<App />)

    createGuestStudyPlan()

    expect(screen.getByRole('heading', { name: '今日任务' })).toBeInTheDocument()
    expect(screen.getByText(/人教版初中俄语七年级全一册/)).toBeInTheDocument()
    expect(screen.getByText(/第 1 单元/)).toBeInTheDocument()
    expect(screen.getByText('词库已导入')).toBeInTheDocument()
    expect(screen.getByText(/3956/)).toBeInTheDocument()
  })

  it('lets a learner change the selected book before creating a plan', () => {
    render(<App />)

    enterAsGuest()
    fireEvent.change(screen.getByLabelText('选择词库'), {
      target: { value: 'pep-ru-senior-selective-4' },
    })
    fireEvent.click(screen.getByRole('button', { name: '生成学习计划' }))

    expect(screen.getByRole('heading', { name: '今日任务' })).toBeInTheDocument()
    expect(screen.getByText(/人教版高中俄语选择性必修第四册/)).toBeInTheDocument()
  })

  it('starts a real recitation card flow after generating a plan', () => {
    render(<App />)

    enterAsGuest()
    fireEvent.click(screen.getByRole('button', { name: '生成学习计划' }))
    fireEvent.click(screen.getByRole('button', { name: '开始今日学习' }))

    expect(screen.getByRole('heading', { name: '今日背诵' })).toBeInTheDocument()
    expect(screen.getByText('词卡 1/1')).toBeInTheDocument()
    expect(screen.getByText('а')).toBeInTheDocument()
    expect(screen.queryByText('而；可是')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '显示答案' }))

    expect(screen.getByText('而；可是')).toBeInTheDocument()
    expect(screen.getAllByText('conjunction').length).toBeGreaterThanOrEqual(1)

    fireEvent.click(screen.getByRole('button', { name: '掌握' }))

    expect(screen.getByRole('heading', { name: '学习结果' })).toBeInTheDocument()
    expect(screen.getByText('已背 1 个词，掌握 1 个词')).toBeInTheDocument()
  })
})
