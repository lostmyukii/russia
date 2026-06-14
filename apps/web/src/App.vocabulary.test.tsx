import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('vocabulary catalog view', () => {
  it('shows PEP Russian books grouped by textbook unit', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '人教版俄语词库' })).toBeInTheDocument()
    expect(screen.getByText('10 册 · 3956 个词')).toBeInTheDocument()
    expect(screen.getByText('人教版初中俄语七年级全一册')).toBeInTheDocument()
    expect(screen.getByText('人教版高中俄语选择性必修第四册')).toBeInTheDocument()
    expect(screen.queryByText('待导入')).not.toBeInTheDocument()
    expect(screen.getByText('预备单元')).toBeInTheDocument()
    expect(screen.getAllByText('第 1 单元').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('461 个词')).toBeInTheDocument()
    expect(screen.getAllByText('31 个词').length).toBeGreaterThanOrEqual(1)
  })
})
