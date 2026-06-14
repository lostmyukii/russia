import { buildApp } from './app'
import { readRateLimitOptionsFromEnv, readTeacherDataOptionsFromEnv } from './runtime-config'

const app = buildApp({
  rateLimit: readRateLimitOptionsFromEnv(process.env),
  ...readTeacherDataOptionsFromEnv(process.env),
})
const port = Number.parseInt(process.env.PORT ?? '4000', 10)
const host = process.env.HOST ?? '0.0.0.0'

try {
  await app.listen({ host, port })
  app.log.info(`Russian Wordscodex API listening on http://${host}:${port}`)
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
