import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('vocabulary catalog view', () => {
  it('shows PEP Russian books grouped by textbook unit', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '人教版俄语词库' })).toBeInTheDocument()
    expect(screen.getByText('14 册 · 已导入 3 个词 · 12 册待导入')).toBeInTheDocument()
    expect(screen.getByText('人教版初中俄语七年级上册')).toBeInTheDocument()
    expect(screen.getByText('人教版高中俄语选择性必修第四册')).toBeInTheDocument()
    expect(screen.getAllByText('待导入')).toHaveLength(12)
    expect(screen.getByText('授权教材第1单元')).toBeInTheDocument()
    expect(screen.getAllByText('2 个词')).toHaveLength(2)
  })
})
