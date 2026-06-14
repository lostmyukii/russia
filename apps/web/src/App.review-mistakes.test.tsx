import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('review and mistakes flow', () => {
  it('shows a mistake entry and removes it after elimination practice', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '错词复习' }))

    expect(screen.getByText('错词本')).toBeInTheDocument()
    expect(screen.getByText('дом')).toBeInTheDocument()
    expect(screen.getByText('语义错误 · 10 分钟后复习')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '完成错词消灭' }))

    expect(screen.getByText('错词已消灭')).toBeInTheDocument()
    expect(screen.getByText('连续正确 3 次')).toBeInTheDocument()
    expect(screen.queryByText('语义错误 · 10 分钟后复习')).not.toBeInTheDocument()
  })
})
