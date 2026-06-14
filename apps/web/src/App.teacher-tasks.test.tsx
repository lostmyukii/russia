import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'
import { completeGuestStudySession } from './test-utils'

describe('teacher task workflow', () => {
  it('lets a teacher add students, assign a task and publish an evaluation', () => {
    render(<App />)

    completeGuestStudySession()
    fireEvent.click(screen.getByRole('link', { name: '返回今日任务' }))
    fireEvent.click(screen.getByRole('button', { name: '老师端' }))
    fireEvent.click(screen.getByRole('button', { name: '添加学生' }))
    fireEvent.click(screen.getByRole('button', { name: '布置背词任务' }))
    fireEvent.click(screen.getByRole('button', { name: '评价学生' }))

    expect(screen.getByText('学生已添加：登录学习者、访客学习者')).toBeInTheDocument()
    expect(screen.getByText('账号：student01')).toBeInTheDocument()
    expect(screen.getByText('初始密码：ru123456')).toBeInTheDocument()
    expect(screen.getByText('账号：student02')).toBeInTheDocument()
    expect(screen.getByText('初始密码：ru654321')).toBeInTheDocument()
    expect(screen.getByText('七年级全一册第 1 单元背词任务')).toBeInTheDocument()
    expect(screen.getAllByText('登录学习者').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('访客学习者').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('评价：词义掌握正确。')).toHaveLength(2)
  })

  it('lets a teacher group students, reset passwords and view a class leaderboard', () => {
    render(<App />)

    completeGuestStudySession()
    fireEvent.click(screen.getByRole('link', { name: '返回今日任务' }))
    fireEvent.click(screen.getByRole('button', { name: '老师端' }))
    fireEvent.click(screen.getByRole('button', { name: '创建班级' }))
    fireEvent.click(screen.getByRole('button', { name: '添加学生' }))
    fireEvent.click(screen.getByRole('button', { name: '新增学生账号' }))
    fireEvent.click(screen.getByRole('button', { name: '重置学生密码' }))

    expect(screen.getByText('当前班级：七年级一班')).toBeInTheDocument()
    expect(screen.getByText('班级成员：登录学习者、访客学习者、安娜')).toBeInTheDocument()
    expect(screen.getByText('账号：anna01')).toBeInTheDocument()
    expect(screen.getByText('初始密码：ru2027')).toBeInTheDocument()
    expect(screen.getByText('班级排行榜')).toBeInTheDocument()
    expect(screen.getByText(/第 1 名 · 登录学习者/)).toBeInTheDocument()
  })
})
