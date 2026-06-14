import { describe, expect, it } from 'vitest'

import { parseVocabularyCsv } from '../src/index'

describe('vocabulary CSV importer', () => {
  it('dry-runs PEP textbook vocabulary rows and reports grouped unit counts', () => {
    const csv = [
      'publisher,textbook_version,book_slug,unit,unit_title,lesson,lemma,stressed_lemma,part_of_speech,definition_zh,gender,aspect,aspect_pair,example,example_zh,audio_url,source',
      'pep,人教版授权版本,pep-ru-junior-g7-a,1,授权教材第1单元,1,школа,шко́ла,noun,学校,feminine,,,Это моя школа.,这是我的学校。,,人教版授权教材词表',
      'pep,人教版授权版本,pep-ru-junior-g7-a,1,授权教材第1单元,1,класс,класс,noun,班级;教室,masculine,,,Это наш класс.,这是我们的教室。,,人教版授权教材词表',
    ].join('\n')

    expect(parseVocabularyCsv(csv)).toEqual({
      validRows: 2,
      errors: [],
      books: [
        {
          bookSlug: 'pep-ru-junior-g7-a',
          unitCount: 1,
          wordCount: 2,
        },
      ],
    })
  })
})
