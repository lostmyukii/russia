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
          slug: 'pep-ru-junior-g7-a',
          publisher: 'pep',
          educationStage: 'junior',
          textbookVersion: '人教版授权版本',
        }),
        expect.objectContaining({
          slug: 'pep-ru-senior-compulsory-1',
          publisher: 'pep',
          educationStage: 'senior',
          textbookVersion: '人教版授权版本',
        }),
      ]),
    )
  })

  it('groups Russian words by PEP textbook unit without mixing lessons', () => {
    const units = groupRussianWordsByUnit('pep-ru-junior-g7-a')

    expect(units).toEqual([
      {
        unit: '1',
        unitTitle: '授权教材第1单元',
        wordCount: 2,
        lessons: [
          {
            lesson: '1',
            wordCount: 2,
          },
        ],
      },
    ])
  })

  it('rejects import rows missing unit titles and source evidence', () => {
    const result = validateVocabularyImportRows([
      {
        publisher: 'pep',
        textbookVersion: '人教版授权版本',
        bookSlug: 'pep-ru-junior-g7-a',
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
