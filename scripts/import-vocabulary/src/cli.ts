import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { parseVocabularyCsv } from './index'

const filePath = process.argv[2]

if (!filePath) {
  console.error('Usage: pnpm vocabulary:validate <path-to-csv>')
  process.exit(1)
}

const invocationDirectory = process.env['INIT_CWD'] ?? process.cwd()
const csv = readFileSync(resolve(invocationDirectory, filePath), 'utf8')
const result = parseVocabularyCsv(csv)

console.log(JSON.stringify(result, null, 2))

if (result.errors.length > 0) {
  process.exit(1)
}
