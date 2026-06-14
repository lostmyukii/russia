import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('review and mistakes flow', () => {
  it('shows a mistake entry and removes it after elimination practice', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('link', { name: '开始学习' }))
    fireEvent.click(screen.getByRole('button', { name: '先体验一下' }))
    fireEvent.click(screen.getByRole('button', { name: '生成学习计划' }))
    fireEvent.click(screen.getByRole('link', { name: '错词本' }))
    fireEvent.click(screen.getByRole('button', { name: '错词复习' }))

    expect(screen.getByRole('heading', { name: '错词本' })).toBeInTheDocument()
    expect(screen.getByText('дом')).toBeInTheDocument()
    expect(screen.getByText('语义错误 · 10 分钟后复习')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '完成错词消灭' }))

    expect(screen.getByText('错词已消灭')).toBeInTheDocument()
    expect(screen.getByText('连续正确 3 次')).toBeInTheDocument()
    expect(screen.queryByText('语义错误 · 10 分钟后复习')).not.toBeInTheDocument()
  })
})
