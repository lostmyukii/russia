import { parse } from 'csv-parse/sync'

import { validateVocabularyImportRows, type VocabularyImportRow } from '@russian-wordscodex/domain'

type RawVocabularyCsvRow = {
  publisher?: string
  textbook_version?: string
  book_slug?: string
  unit?: string
  unit_title?: string
  lesson?: string
  lemma?: string
  stressed_lemma?: string
  part_of_speech?: string
  definition_zh?: string
  gender?: string
  aspect?: string
  aspect_pair?: string
  example?: string
  example_zh?: string
  audio_url?: string
  source?: string
}

export type VocabularyImportDryRun = {
  validRows: number
  errors: Array<{
    rowNumber: number
    field: string
    message: string
  }>
  books: Array<{
    bookSlug: string
    unitCount: number
    wordCount: number
  }>
}

export function parseVocabularyCsv(csv: string): VocabularyImportDryRun {
  const parsedRows = parse<RawVocabularyCsvRow>(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  const rows = parsedRows.map(toImportRow)
  const result = validateVocabularyImportRows(rows)
  const bookMap = new Map<string, { units: Set<string>; wordCount: number }>()

  result.validRows.forEach((row) => {
    const current = bookMap.get(row.bookSlug) ?? { units: new Set<string>(), wordCount: 0 }
    current.units.add(row.unit)
    current.wordCount += 1
    bookMap.set(row.bookSlug, current)
  })

  return {
    validRows: result.validRows.length,
    errors: result.errors,
    books: Array.from(bookMap.entries())
      .sort(([leftSlug], [rightSlug]) => leftSlug.localeCompare(rightSlug))
      .map(([bookSlug, summary]) => ({
        bookSlug,
        unitCount: summary.units.size,
        wordCount: summary.wordCount,
      })),
  }
}

function toImportRow(row: RawVocabularyCsvRow): VocabularyImportRow {
  return {
    publisher: row.publisher ?? '',
    textbookVersion: row.textbook_version ?? '',
    bookSlug: row.book_slug ?? '',
    unit: row.unit ?? '',
    unitTitle: row.unit_title ?? '',
    lesson: row.lesson ?? '',
    lemma: row.lemma ?? '',
    stressedLemma: row.stressed_lemma ?? '',
    partOfSpeech: row.part_of_speech ?? '',
    definitionZh: row.definition_zh ?? '',
    gender: row.gender ?? '',
    aspect: row.aspect ?? '',
    aspectPair: row.aspect_pair ?? '',
    example: row.example ?? '',
    exampleZh: row.example_zh ?? '',
    audioUrl: row.audio_url ?? '',
    source: row.source ?? '',
  }
}
