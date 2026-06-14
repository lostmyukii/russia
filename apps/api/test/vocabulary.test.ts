import { describe, expect, it } from 'vitest'

import { buildApp } from '../src/app'

describe('vocabulary API', () => {
  it('lists PEP junior Russian vocabulary books', async () => {
    const app = buildApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/vocabulary-books?language=ru&stage=junior',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      books: [
        expect.objectContaining({
          slug: 'pep-ru-junior-g7-a',
          name: '人教版初中俄语七年级上册',
          publisher: 'pep',
          educationStage: 'junior',
        }),
      ],
    })
  })

  it('returns unit summaries for a PEP textbook book', async () => {
    const app = buildApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/vocabulary-books/book_pep_ru_g7_a/units',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      bookId: 'book_pep_ru_g7_a',
      units: [
        {
          unit: '1',
          unitTitle: '授权教材第1单元',
          wordCount: 2,
          lessons: [{ lesson: '1', wordCount: 2 }],
        },
      ],
    })
  })
})
