import { describe, expect, it } from 'vitest'

import {
  groupRussianWordsByUnit,
  pepRussianVocabularyBooks,
  validateVocabularyImportRows,
} from '../src/index'

describe('PEP Russian vocabulary domain', () => {
  it('keeps the seed catalog organized by PEP textbook stage and book', () => {
    expect(pepRussianVocabularyBooks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: 'pep-ru-junior-g7-full',
          publisher: 'pep',
          educationStage: 'junior',
          textbookVersion: '人教版俄语教材',
        }),
        expect.objectContaining({
          slug: 'pep-ru-senior-compulsory-1',
          publisher: 'pep',
          educationStage: 'senior',
          textbookVersion: '人教版俄语教材',
        }),
      ]),
    )
    expect(pepRussianVocabularyBooks.map((book) => book.slug)).toEqual([
      'pep-ru-junior-g7-full',
      'pep-ru-junior-g8-full',
      'pep-ru-junior-g9-full',
      'pep-ru-senior-compulsory-1',
      'pep-ru-senior-compulsory-2',
      'pep-ru-senior-compulsory-3',
      'pep-ru-senior-selective-1',
      'pep-ru-senior-selective-2',
      'pep-ru-senior-selective-3',
      'pep-ru-senior-selective-4',
    ])
  })

  it('groups Russian words by PEP textbook unit without mixing lessons', () => {
    const units = groupRussianWordsByUnit('pep-ru-junior-g7-full')

    expect(units).toHaveLength(10)
    expect(units[0]).toEqual({
      unit: '0',
      unitTitle: '预备单元',
      wordCount: 111,
      lessons: [{ lesson: '0', wordCount: 111 }],
    })
    expect(units[1]).toEqual({
      unit: '1',
      unitTitle: '第 1 单元',
      wordCount: 31,
      lessons: [
        { lesson: '1', wordCount: 8 },
        { lesson: '2', wordCount: 23 },
      ],
    })
  })

  it('rejects import rows missing unit titles and source evidence', () => {
    const result = validateVocabularyImportRows([
      {
        publisher: 'pep',
        textbookVersion: '人教版授权版本',
        bookSlug: 'pep-ru-junior-g7-full',
        unit: '1',
        unitTitle: '',
        lesson: '1',
        lemma: 'школа',
        stressedLemma: 'шко́ла',
        partOfSpeech: 'noun',
        definitionZh: '学校',
        example: 'Это моя школа.',
        exampleZh: '这是我的学校。',
        source: '',
      },
    ])

    expect(result.validRows).toHaveLength(0)
    expect(result.errors).toEqual([
      {
        rowNumber: 1,
        field: 'unitTitle',
        message: '人教版教材单元名称不能为空',
      },
      {
        rowNumber: 1,
        field: 'source',
        message: '词条来源不能为空',
      },
    ])
  })
})
