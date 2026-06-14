import { describe, expect, it } from 'vitest'

import { russianWordSchema, vocabularyBookSchema } from '../src/index'

describe('PEP Russian vocabulary contracts', () => {
  it('requires publisher, textbook version, unit title, and source for PEP books and words', () => {
    expect(
      vocabularyBookSchema.parse({
        id: 'book_pep_ru_g7_full',
        slug: 'pep-ru-junior-g7-full',
        name: '人教版初中俄语七年级全一册',
        language: 'ru',
        educationStage: 'junior',
        grade: 'g7',
        publisher: 'pep',
        textbookVersion: '人教版授权版本',
        volume: '上册',
        description: '按人教版教材单元导入',
        wordCount: 2,
        source: '人教版授权教材词表',
        version: 1,
        publishedAt: null,
      }),
    ).toMatchObject({
      publisher: 'pep',
      textbookVersion: '人教版授权版本',
      educationStage: 'junior',
    })

    expect(
      russianWordSchema.parse({
        id: 'word_shkola',
        bookId: 'book_pep_ru_g7_full',
        unit: '1',
        unitTitle: '第 1 单元',
        lesson: '1',
        lemma: 'школа',
        stressedLemma: 'шко́ла',
        transcription: null,
        partOfSpeech: 'noun',
        gender: 'feminine',
        pluralForm: null,
        aspect: null,
        aspectPair: null,
        conjugation: null,
        meanings: [{ definitionZh: '学校', usageNote: null }],
        examples: [
          {
            sentenceRu: 'Это моя школа.',
            translationZh: '这是我的学校。',
            source: '开发示例句',
          },
        ],
        audioUrl: null,
        imageUrl: null,
        source: '人教版授权教材词表',
      }),
    ).toMatchObject({
      unit: '1',
      unitTitle: '第 1 单元',
      source: '人教版授权教材词表',
    })
  })
})
