import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('teacher task workflow', () => {
  it('lets a teacher add students, assign a task and publish an evaluation', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '访客开始学习' }))
    fireEvent.click(screen.getByRole('button', { name: '生成学习计划' }))
    fireEvent.click(screen.getByRole('button', { name: '完成首组背诵' }))
    fireEvent.click(screen.getByRole('button', { name: '老师账号查看进度' }))
    fireEvent.click(screen.getByRole('button', { name: '添加学生' }))
    fireEvent.click(screen.getByRole('button', { name: '布置背词任务' }))
    fireEvent.click(screen.getByRole('button', { name: '评价学生' }))

    expect(screen.getByText('学生已添加：登录学习者、访客学习者')).toBeInTheDocument()
    expect(screen.getByText('七年级上册第 1 单元背词任务')).toBeInTheDocument()
    expect(screen.getAllByText('登录学习者')).toHaveLength(2)
    expect(screen.getAllByText('访客学习者')).toHaveLength(2)
    expect(screen.getAllByText('评价：词义掌握稳定，继续保持。')).toHaveLength(2)
  })
})
