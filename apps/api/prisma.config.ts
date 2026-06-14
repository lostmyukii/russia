import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url:
      process.env['DATABASE_URL'] ??
      'postgresql://wordscodex:wordscodex@localhost:54322/russian_wordscodex?schema=public',
  },
})
