import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { parse } from 'csv-parse/sync'

import type { RussianWord, VocabularyBook } from '@russian-wordscodex/domain'

const INPUT_HEADERS = [
  'publisher',
  'textbook_version',
  'book_slug',
  'unit',
  'unit_title',
  'lesson',
  'lemma',
  'stressed_lemma',
  'part_of_speech',
  'definition_zh',
  'gender',
  'aspect',
  'aspect_pair',
  'example',
  'example_zh',
  'audio_url',
  'source',
] as const

const OUTPUT_HEADERS = INPUT_HEADERS

type InputHeader = (typeof INPUT_HEADERS)[number]
type RawCsvRow = Record<InputHeader, string>

type BookDefinition = {
  sourceSlug: string
  id: string
  slug: string
  name: string
  educationStage: VocabularyBook['educationStage']
  grade: VocabularyBook['grade']
  volume: string
  shortId: string
}

type NormalizedVocabularyRow = {
  publisher: 'pep'
  textbookVersion: string
  rawBookSlug: string
  bookId: string
  bookSlug: string
  unit: string
  unitTitle: string
  lesson: string
  lemma: string
  stressedLemma: string
  partOfSpeech: RussianWord['partOfSpeech']
  definitionZh: string
  gender: RussianWord['gender']
  aspect: RussianWord['aspect']
  aspectPair: string
  example: string
  exampleZh: string
  audioUrl: string
  source: string
}

type BookAuditSummary = {
  sourceSlug: string
  bookSlug: string
  name: string
  unitCount: number
  wordCount: number
  sources: string[]
}

const DEFAULT_INPUT = 'Kimi_Agent_人教版俄语词汇CSV/人教版俄语词汇总表.csv'
const DEFAULT_OUTPUT_CSV = 'data/vocabulary/pep-russian-import.csv'
const DEFAULT_OUTPUT_AUDIT = 'data/vocabulary/pep-russian-import.audit.json'
const DEFAULT_OUTPUT_DOMAIN = 'packages/domain/src/generated-vocabulary.ts'

const TEXTBOOK_VERSION = '人教版俄语教材'
const BOOK_DEFINITIONS = [
  {
    sourceSlug: 'russian_grade7',
    id: 'book_pep_ru_g7_full',
    slug: 'pep-ru-junior-g7-full',
    name: '人教版初中俄语七年级全一册',
    educationStage: 'junior',
    grade: 'g7',
    volume: '全一册',
    shortId: 'g7',
  },
  {
    sourceSlug: 'russian_grade8',
    id: 'book_pep_ru_g8_full',
    slug: 'pep-ru-junior-g8-full',
    name: '人教版初中俄语八年级全一册',
    educationStage: 'junior',
    grade: 'g8',
    volume: '全一册',
    shortId: 'g8',
  },
  {
    sourceSlug: 'russian_grade9',
    id: 'book_pep_ru_g9_full',
    slug: 'pep-ru-junior-g9-full',
    name: '人教版初中俄语九年级全一册',
    educationStage: 'junior',
    grade: 'g9',
    volume: '全一册',
    shortId: 'g9',
  },
  {
    sourceSlug: 'russian_bixiu1',
    id: 'book_pep_ru_senior_compulsory_1',
    slug: 'pep-ru-senior-compulsory-1',
    name: '人教版高中俄语必修第一册',
    educationStage: 'senior',
    grade: 'senior-compulsory',
    volume: '第一册',
    shortId: 'bixiu1',
  },
  {
    sourceSlug: 'russian_bixiu2',
    id: 'book_pep_ru_senior_compulsory_2',
    slug: 'pep-ru-senior-compulsory-2',
    name: '人教版高中俄语必修第二册',
    educationStage: 'senior',
    grade: 'senior-compulsory',
    volume: '第二册',
    shortId: 'bixiu2',
  },
  {
    sourceSlug: 'russian_bixiu3',
    id: 'book_pep_ru_senior_compulsory_3',
    slug: 'pep-ru-senior-compulsory-3',
    name: '人教版高中俄语必修第三册',
    educationStage: 'senior',
    grade: 'senior-compulsory',
    volume: '第三册',
    shortId: 'bixiu3',
  },
  {
    sourceSlug: 'russian_xuanxiu1',
    id: 'book_pep_ru_senior_selective_1',
    slug: 'pep-ru-senior-selective-1',
    name: '人教版高中俄语选择性必修第一册',
    educationStage: 'senior',
    grade: 'senior-selective',
    volume: '第一册',
    shortId: 'xuanxiu1',
  },
  {
    sourceSlug: 'russian_xuanxiu2',
    id: 'book_pep_ru_senior_selective_2',
    slug: 'pep-ru-senior-selective-2',
    name: '人教版高中俄语选择性必修第二册',
    educationStage: 'senior',
    grade: 'senior-selective',
    volume: '第二册',
    shortId: 'xuanxiu2',
  },
  {
    sourceSlug: 'russian_xuanxiu3',
    id: 'book_pep_ru_senior_selective_3',
    slug: 'pep-ru-senior-selective-3',
    name: '人教版高中俄语选择性必修第三册',
    educationStage: 'senior',
    grade: 'senior-selective',
    volume: '第三册',
    shortId: 'xuanxiu3',
  },
  {
    sourceSlug: 'russian_xuanxiu4',
    id: 'book_pep_ru_senior_selective_4',
    slug: 'pep-ru-senior-selective-4',
    name: '人教版高中俄语选择性必修第四册',
    educationStage: 'senior',
    grade: 'senior-selective',
    volume: '第四册',
    shortId: 'xuanxiu4',
  },
] as const satisfies readonly BookDefinition[]

const BOOKS_BY_SOURCE_SLUG: ReadonlyMap<string, BookDefinition> = new Map(
  BOOK_DEFINITIONS.map((book) => [book.sourceSlug, book]),
)
const BOOK_ORDER: ReadonlyMap<string, number> = new Map(
  BOOK_DEFINITIONS.map((book, index) => [book.slug, index]),
)

const PART_OF_SPEECH_MAP = new Map<string, RussianWord['partOfSpeech']>([
  ['名词', 'noun'],
  ['动词', 'verb'],
  ['形容词', 'adjective'],
  ['副词', 'adverb'],
  ['代词', 'pronoun'],
  ['数词', 'numeral'],
  ['前置词', 'preposition'],
  ['介词', 'preposition'],
  ['连接词', 'conjunction'],
  ['连词', 'conjunction'],
  ['语气词', 'particle'],
  ['感叹词', 'particle'],
  ['短语', 'phrase'],
])

const GENDER_MAP = new Map<string, RussianWord['gender']>([
  ['阳', 'masculine'],
  ['阳性', 'masculine'],
  ['阴', 'feminine'],
  ['阴性', 'feminine'],
  ['中', 'neuter'],
  ['中性', 'neuter'],
  ['通性', 'common'],
  ['复', null],
])

const ASPECT_MAP = new Map<string, RussianWord['aspect']>([
  ['完成体', 'perfective'],
  ['未完成体', 'imperfective'],
  ['未完成体//完成体', null],
])

const invocationDirectory = process.env['INIT_CWD'] ?? process.cwd()
const inputPath = resolve(invocationDirectory, process.argv[2] ?? DEFAULT_INPUT)
const outputCsvPath = resolve(invocationDirectory, process.argv[3] ?? DEFAULT_OUTPUT_CSV)
const outputAuditPath = resolve(invocationDirectory, process.argv[4] ?? DEFAULT_OUTPUT_AUDIT)
const outputDomainPath = resolve(invocationDirectory, process.argv[5] ?? DEFAULT_OUTPUT_DOMAIN)

const rawRows = parseRows(readFileSync(inputPath, 'utf8'))
const normalizedRows = normalizeRows(rawRows)
const deduplicatedRows = deduplicateRows(normalizedRows).sort(compareRows)
const books = buildBooks(deduplicatedRows)
const words = buildWords(deduplicatedRows)
const audit = buildAudit(rawRows, deduplicatedRows)

writeTextFile(outputCsvPath, toCsv(deduplicatedRows))
writeTextFile(outputAuditPath, `${JSON.stringify(audit, null, 2)}\n`)
writeTextFile(outputDomainPath, toGeneratedDomainFile(books, words))

console.log(JSON.stringify(audit, null, 2))

function parseRows(csv: string): RawCsvRow[] {
  const rows = parse<Record<string, string>>(csv, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  const firstRow = rows[0]
  if (!firstRow) {
    throw new Error(`Vocabulary CSV has no data rows: ${inputPath}`)
  }

  const missingHeaders = INPUT_HEADERS.filter((header) => !(header in firstRow))
  if (missingHeaders.length > 0) {
    throw new Error(`Vocabulary CSV is missing required headers: ${missingHeaders.join(', ')}`)
  }

  return rows.map((row) => {
    const normalized = Object.fromEntries(
      INPUT_HEADERS.map((header) => [header, normalizeCell(row[header])]),
    )

    return normalized as RawCsvRow
  })
}

function normalizeRows(rows: RawCsvRow[]): NormalizedVocabularyRow[] {
  return rows.map((row, index) => {
    const book = BOOKS_BY_SOURCE_SLUG.get(row.book_slug)
    if (!book) {
      throw new Error(`Unknown book_slug at CSV row ${index + 2}: ${row.book_slug}`)
    }

    const partOfSpeech = mapRequiredValue(
      PART_OF_SPEECH_MAP,
      row.part_of_speech,
      `part_of_speech at CSV row ${index + 2}`,
    )
    const gender = mapOptionalValue(GENDER_MAP, row.gender, `gender at CSV row ${index + 2}`)
    const aspect = mapOptionalValue(ASPECT_MAP, row.aspect, `aspect at CSV row ${index + 2}`)

    return {
      publisher: 'pep',
      textbookVersion: TEXTBOOK_VERSION,
      rawBookSlug: row.book_slug,
      bookId: book.id,
      bookSlug: book.slug,
      unit: row.unit,
      unitTitle: normalizeUnitTitle(row),
      lesson: row.lesson,
      lemma: row.lemma,
      stressedLemma: row.stressed_lemma,
      partOfSpeech,
      definitionZh: normalizeDefinition(row.definition_zh),
      gender,
      aspect,
      aspectPair: row.aspect_pair,
      example: row.example,
      exampleZh: row.example_zh,
      audioUrl: row.audio_url,
      source: row.source,
    }
  })
}

function deduplicateRows(rows: NormalizedVocabularyRow[]): NormalizedVocabularyRow[] {
  const byKey = new Map<string, NormalizedVocabularyRow>()

  rows.forEach((row) => {
    const key = [row.bookSlug, row.unit, row.lesson, row.lemma].join('|')
    const existing = byKey.get(key)

    if (!existing) {
      byKey.set(key, row)
      return
    }

    existing.definitionZh = appendUniqueParts(existing.definitionZh, row.definitionZh)
    existing.source = appendUniqueParts(existing.source, row.source)

    if (!existing.stressedLemma && row.stressedLemma) {
      existing.stressedLemma = row.stressedLemma
    }
    if (!existing.aspectPair && row.aspectPair) {
      existing.aspectPair = row.aspectPair
    }
    if (!existing.example && row.example) {
      existing.example = row.example
      existing.exampleZh = row.exampleZh
    }
    if (!existing.audioUrl && row.audioUrl) {
      existing.audioUrl = row.audioUrl
    }
  })

  return Array.from(byKey.values())
}

function buildBooks(rows: NormalizedVocabularyRow[]): VocabularyBook[] {
  return BOOK_DEFINITIONS.map((book) => {
    const bookRows = rows.filter((row) => row.bookId === book.id)

    return {
      id: book.id,
      slug: book.slug,
      name: book.name,
      language: 'ru',
      educationStage: book.educationStage,
      grade: book.grade,
      publisher: 'pep',
      textbookVersion: TEXTBOOK_VERSION,
      volume: book.volume,
      description: '按人教版教材单元导入',
      wordCount: bookRows.length,
      source: appendUniqueParts(...bookRows.map((row) => row.source)),
      version: 1,
      publishedAt: null,
    }
  })
}

function buildWords(rows: NormalizedVocabularyRow[]): RussianWord[] {
  return rows.map((row) => ({
    id: createWordId(row),
    bookId: row.bookId,
    unit: row.unit,
    unitTitle: row.unitTitle,
    lesson: row.lesson,
    lemma: row.lemma,
    stressedLemma: row.stressedLemma || null,
    transcription: null,
    partOfSpeech: row.partOfSpeech,
    gender: row.gender,
    pluralForm: null,
    aspect: row.aspect,
    aspectPair: row.aspectPair || null,
    conjugation: null,
    meanings: [{ definitionZh: row.definitionZh, usageNote: null }],
    examples:
      row.example && row.exampleZh
        ? [{ sentenceRu: row.example, translationZh: row.exampleZh, source: row.source }]
        : [],
    audioUrl: row.audioUrl || null,
    imageUrl: null,
    source: row.source,
  }))
}

function buildAudit(
  rawRowsForAudit: RawCsvRow[],
  normalizedRowsForAudit: NormalizedVocabularyRow[],
): {
  inputPath: string
  outputCsvPath: string
  outputAuditPath: string
  outputDomainPath: string
  rawRows: number
  normalizedRows: number
  duplicateRowsMerged: number
  books: BookAuditSummary[]
} {
  return {
    inputPath,
    outputCsvPath,
    outputAuditPath,
    outputDomainPath,
    rawRows: rawRowsForAudit.length,
    normalizedRows: normalizedRowsForAudit.length,
    duplicateRowsMerged: rawRowsForAudit.length - normalizedRowsForAudit.length,
    books: BOOK_DEFINITIONS.map((book) => {
      const bookRows = normalizedRowsForAudit.filter((row) => row.bookId === book.id)

      return {
        sourceSlug: book.sourceSlug,
        bookSlug: book.slug,
        name: book.name,
        unitCount: new Set(bookRows.map((row) => row.unit)).size,
        wordCount: bookRows.length,
        sources: splitParts(appendUniqueParts(...bookRows.map((row) => row.source))),
      }
    }),
  }
}

function normalizeUnitTitle(row: RawCsvRow): string {
  if (row.book_slug === 'russian_grade7') {
    return row.unit === '0' ? '预备单元' : `第 ${row.unit} 单元`
  }

  if (row.book_slug === 'russian_grade8') {
    return `第 ${row.unit} 单元`
  }

  return row.unit_title
}

function normalizeDefinition(definition: string): string {
  return appendUniqueParts(definition)
}

function createWordId(row: NormalizedVocabularyRow): string {
  const book = BOOKS_BY_SOURCE_SLUG.get(row.rawBookSlug)
  if (!book) {
    throw new Error(`Cannot create word id for unknown book slug: ${row.rawBookSlug}`)
  }

  const hash = createHash('sha1')
    .update([row.bookSlug, row.unit, row.lesson, row.lemma].join('|'))
    .digest('hex')
    .slice(0, 12)

  return `word_${book.shortId}_${hash}`
}

function compareRows(left: NormalizedVocabularyRow, right: NormalizedVocabularyRow): number {
  const leftBookOrder = BOOK_ORDER.get(left.bookSlug) ?? Number.MAX_SAFE_INTEGER
  const rightBookOrder = BOOK_ORDER.get(right.bookSlug) ?? Number.MAX_SAFE_INTEGER

  if (leftBookOrder !== rightBookOrder) {
    return leftBookOrder - rightBookOrder
  }

  return (
    compareNaturalNumberStrings(left.unit, right.unit) ||
    compareNaturalNumberStrings(left.lesson, right.lesson) ||
    left.lemma.localeCompare(right.lemma, 'ru')
  )
}

function compareNaturalNumberStrings(left: string, right: string): number {
  const leftNumber = Number(left)
  const rightNumber = Number(right)

  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber !== rightNumber) {
    return leftNumber - rightNumber
  }

  return left.localeCompare(right, 'zh-Hans-CN')
}

function mapRequiredValue<T>(map: Map<string, T>, value: string, label: string): T {
  const mappedValue = map.get(value)
  if (!mappedValue) {
    throw new Error(`Unsupported ${label}: ${value}`)
  }

  return mappedValue
}

function mapOptionalValue<T>(map: Map<string, T>, value: string, label: string): T | null {
  if (!value) {
    return null
  }

  if (!map.has(value)) {
    throw new Error(`Unsupported ${label}: ${value}`)
  }

  return map.get(value) ?? null
}

function toCsv(rows: NormalizedVocabularyRow[]): string {
  const csvRows = rows.map(
    (row): Record<InputHeader, string> => ({
      publisher: row.publisher,
      textbook_version: row.textbookVersion,
      book_slug: row.bookSlug,
      unit: row.unit,
      unit_title: row.unitTitle,
      lesson: row.lesson,
      lemma: row.lemma,
      stressed_lemma: row.stressedLemma,
      part_of_speech: row.partOfSpeech,
      definition_zh: row.definitionZh,
      gender: row.gender ?? '',
      aspect: row.aspect ?? '',
      aspect_pair: row.aspectPair,
      example: row.example,
      example_zh: row.exampleZh,
      audio_url: row.audioUrl,
      source: row.source,
    }),
  )

  return [
    OUTPUT_HEADERS.join(','),
    ...csvRows.map((row) => OUTPUT_HEADERS.map((header) => toCsvCell(row[header])).join(',')),
    '',
  ].join('\n')
}

function toGeneratedDomainFile(books: VocabularyBook[], words: RussianWord[]): string {
  return `${[
    '// Generated by scripts/import-vocabulary/src/generate-domain-vocabulary.ts',
    `// Source: ${DEFAULT_INPUT}`,
    "import type { RussianWord, VocabularyBook } from './index'",
    `export const generatedPepRussianVocabularyBooks = ${JSON.stringify(
      books,
      null,
      2,
    )} satisfies VocabularyBook[]`,
    `export const generatedPepRussianWords = ${JSON.stringify(
      words,
      null,
      2,
    )} satisfies RussianWord[]`,
  ].join('\n\n')}\n`
}

function toCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }

  return value
}

function appendUniqueParts(...values: string[]): string {
  return Array.from(new Set(values.flatMap(splitParts))).join('；')
}

function splitParts(value: string): string[] {
  return value
    .split(/[;；]/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function normalizeCell(value: string | undefined): string {
  return (value ?? '').trim()
}

function writeTextFile(path: string, text: string): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, text, 'utf8')
}
