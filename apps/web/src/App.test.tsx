import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('App shell', () => {
  it('renders the PEP Russian vocabulary learning baseline', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '俄语百词斩' })).toBeInTheDocument()
    expect(screen.getByText('人教版教材单元词库')).toBeInTheDocument()
    expect(screen.getByText('SRS 复习')).toBeInTheDocument()
    expect(screen.getByText('背词排行榜')).toBeInTheDocument()
  })
})
