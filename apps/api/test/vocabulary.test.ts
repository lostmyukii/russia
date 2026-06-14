import { describe, expect, it } from 'vitest'

import type { VocabularyBook } from '@russian-wordscodex/domain'

import { buildApp } from '../src/app'

describe('vocabulary API', () => {
  it('lists PEP junior Russian vocabulary books', async () => {
    const app = buildApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/vocabulary-books?language=ru&stage=junior',
    })

    expect(response.statusCode).toBe(200)
    const body: { books: VocabularyBook[] } = response.json()

    expect(body.books).toHaveLength(3)
    expect(body.books).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: 'pep-ru-junior-g7-full',
          name: '人教版初中俄语七年级全一册',
          publisher: 'pep',
          educationStage: 'junior',
          wordCount: 461,
        }),
        expect.objectContaining({
          slug: 'pep-ru-junior-g9-full',
          name: '人教版初中俄语九年级全一册',
          publisher: 'pep',
          educationStage: 'junior',
          wordCount: 384,
        }),
      ]),
    )
  })

  it('returns unit summaries for a PEP textbook book', async () => {
    const app = buildApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/vocabulary-books/book_pep_ru_g7_full/units',
    })

    expect(response.statusCode).toBe(200)
    const body: { bookId: string; units: unknown[] } = response.json()

    expect(body.bookId).toBe('book_pep_ru_g7_full')
    expect(body.units).toHaveLength(10)
    expect(body.units.slice(0, 2)).toEqual([
      {
        unit: '0',
        unitTitle: '预备单元',
        wordCount: 111,
        lessons: [{ lesson: '0', wordCount: 111 }],
      },
      {
        unit: '1',
        unitTitle: '第 1 单元',
        wordCount: 31,
        lessons: [
          { lesson: '1', wordCount: 8 },
          { lesson: '2', wordCount: 23 },
        ],
      },
    ])
  })
})
