import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('vocabulary catalog view', () => {
  it('shows PEP Russian books grouped by textbook unit', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '人教版俄语词库' })).toBeInTheDocument()
    expect(screen.getByText('人教版初中俄语七年级上册')).toBeInTheDocument()
    expect(screen.getByText('授权教材第1单元')).toBeInTheDocument()
    expect(screen.getByText('2 个词')).toBeInTheDocument()
  })
})
