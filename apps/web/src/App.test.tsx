import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('App shell', () => {
  it('renders the PEP Russian vocabulary learning baseline', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '俄语百词斩' })).toBeInTheDocument()
    expect(screen.getByText('科学记忆 · 主动回忆 · 人教版俄语')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '开始学习' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: '隐私政策' })).toHaveAttribute('href', '/privacy.html')
  })
})
