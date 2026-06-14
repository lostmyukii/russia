import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('vocabulary catalog view', () => {
  it('shows PEP Russian books grouped by textbook unit', () => {
    window.history.pushState(null, '', '/books')
    render(<App />)

    expect(screen.getByRole('heading', { name: '选择人教版俄语词库' })).toBeInTheDocument()
    expect(screen.getByText('人教版初中俄语七年级全一册')).toBeInTheDocument()
    expect(screen.getByText('人教版高中俄语选择性必修第四册')).toBeInTheDocument()
    expect(screen.getAllByText(/461/).length).toBeGreaterThanOrEqual(1)
  })
})
