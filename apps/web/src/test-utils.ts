import { fireEvent, screen } from '@testing-library/react'

export function enterAsGuest() {
  fireEvent.click(screen.getByRole('link', { name: '开始学习' }))
  fireEvent.click(screen.getByRole('button', { name: '先体验一下' }))
}

export function createGuestStudyPlan() {
  enterAsGuest()
  fireEvent.click(screen.getByRole('button', { name: '生成学习计划' }))
}

export function completeGuestStudySession() {
  createGuestStudyPlan()
  fireEvent.click(screen.getByRole('button', { name: '开始今日学习' }))
  fireEvent.click(screen.getByRole('button', { name: '显示答案' }))
  fireEvent.click(screen.getByRole('button', { name: '掌握' }))
}
