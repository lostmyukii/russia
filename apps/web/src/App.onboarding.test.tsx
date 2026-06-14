import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { App } from './App'
import { createGuestStudyPlan, enterAsGuest } from './test-utils'

afterEach(() => {
  vi.unstubAllGlobals()
})

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

  it('uses the learner selected daily new word target in the generated plan', () => {
    render(<App />)

    enterAsGuest()
    fireEvent.change(screen.getByLabelText('每日新词量'), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: '生成学习计划' }))

    expect(screen.getByRole('heading', { name: '今日任务' })).toBeInTheDocument()
    expect(screen.getByText(/每日新词\s+5 个/)).toBeInTheDocument()
    expect(screen.getByText('5 个')).toBeInTheDocument()
  })

  it('keeps the learner selected target date in the generated plan', () => {
    render(<App />)

    enterAsGuest()
    fireEvent.change(screen.getByLabelText('目标日期'), { target: { value: '2026-07-01' } })
    fireEvent.click(screen.getByRole('button', { name: '生成学习计划' }))

    expect(screen.getByRole('heading', { name: '今日任务' })).toBeInTheDocument()
    expect(screen.getByText(/目标日期\s+2026-07-01/)).toBeInTheDocument()
  })

  it('starts a real recitation card flow after generating a plan', () => {
    render(<App />)

    enterAsGuest()
    fireEvent.click(screen.getByRole('button', { name: '生成学习计划' }))
    fireEvent.click(screen.getByRole('button', { name: '开始今日学习' }))

    expect(screen.getByRole('heading', { name: '今日背诵' })).toBeInTheDocument()
    expect(screen.getByText('词卡 1/1')).toBeInTheDocument()
    expect(screen.getByText('а')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: '主动回忆选项' })).toBeInTheDocument()
    expect(screen.queryByText('conjunction 而；可是')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '显示答案' }))

    expect(screen.getByText('而；可是')).toBeInTheDocument()
    expect(screen.getAllByText('conjunction').length).toBeGreaterThanOrEqual(1)

    fireEvent.click(screen.getByRole('button', { name: '掌握' }))

    expect(screen.getByRole('heading', { name: '学习结果' })).toBeInTheDocument()
    expect(screen.getByText('已背 1 个词，掌握 1 个词')).toBeInTheDocument()
  })

  it('lets a learner answer an active recall choice before revealing the answer', () => {
    render(<App />)

    enterAsGuest()
    fireEvent.click(screen.getByRole('button', { name: '生成学习计划' }))
    fireEvent.click(screen.getByRole('button', { name: '开始今日学习' }))

    expect(screen.getByRole('group', { name: '主动回忆选项' })).toBeInTheDocument()
    expect(screen.queryByText('conjunction 而；可是')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /而；可是/ }))

    expect(screen.getByRole('heading', { name: '学习结果' })).toBeInTheDocument()
    expect(screen.getByText('已背 1 个词，掌握 1 个词')).toBeInTheDocument()
  })

  it('plays Russian pronunciation for the current study card', () => {
    type SpokenUtterance = { lang: string; text: string }

    const speak = vi.fn<(utterance: SpokenUtterance) => void>()
    const cancel = vi.fn<() => void>()

    class TestSpeechSynthesisUtterance {
      lang = ''
      pitch = 1
      rate = 1
      text: string

      constructor(text: string) {
        this.text = text
      }
    }

    vi.stubGlobal('speechSynthesis', { cancel, speak })
    vi.stubGlobal('SpeechSynthesisUtterance', TestSpeechSynthesisUtterance)

    render(<App />)

    enterAsGuest()
    fireEvent.click(screen.getByRole('button', { name: '生成学习计划' }))
    fireEvent.click(screen.getByRole('button', { name: '开始今日学习' }))
    fireEvent.click(screen.getByRole('button', { name: '播放读音' }))

    expect(cancel).toHaveBeenCalledTimes(1)
    expect(speak).toHaveBeenCalledTimes(1)
    expect(speak.mock.calls[0]?.[0]).toMatchObject({ lang: 'ru-RU', text: 'а' })
  })
})
