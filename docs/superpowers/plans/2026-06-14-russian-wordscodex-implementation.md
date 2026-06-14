# Russian Wordscodex Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Russian Baicizhan-style Web/PWA MVP described in `AGENTS.md` and `俄语版_智能词汇学习产品需求与开发文档.md`.

**Architecture:** Use a pnpm monorepo with a React/Vite PWA client, Fastify API, shared Zod contracts, and pure TypeScript domain packages. Vocabulary is organized by PEP (`publisher: "pep"`) textbook version, stage, book, unit, lesson, and word. Server-confirmed study records are the source of truth for SRS, check-ins, and leaderboard score events.

**Tech Stack:** React, TypeScript, Vite, Fastify, Zod, Prisma/PostgreSQL, Redis, Vitest, Testing Library, Playwright, ESLint, Prettier.

---

### Task 1: Engineering Baseline

**Files:**

- Create: root workspace files, `apps/web`, `apps/api`, `packages/contracts`, `packages/domain`, `packages/config`
- Test: API health check, Web app shell render, contracts schema, domain baseline exports

- [ ] Create pnpm workspace, TypeScript, ESLint, Prettier, Vitest, Web, API, contracts, and domain package scaffolding.
- [ ] Write failing tests for API health, Web shell, contracts schema, and domain roadmap metadata.
- [ ] Implement minimal API health endpoint and PWA app shell.
- [ ] Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.

### Task 2: PEP Russian Vocabulary And Import

**Files:**

- Create: vocabulary contracts, domain validators, import script package, seed fixtures
- Modify: Web vocabulary routes and API vocabulary module

- [ ] Model PEP textbook books, units, lessons, and Russian words.
- [ ] Validate CSV imports include `publisher`, `textbookVersion`, `bookSlug`, `unit`, `unitTitle`, `lesson`, source, and Russian word fields.
- [ ] Add API endpoints and Web screens for PEP junior/senior books grouped by unit.
- [ ] Verify tests and import dry-run reports.

### Task 3: Account And Onboarding

- [ ] Add guest/login state, learner preferences, stage/book/unit onboarding, and active study plan creation.
- [ ] Verify a new learner can select a PEP book and daily target.

### Task 4: First Study Loop

- [ ] Add today task, Russian word card, pronunciation/stress/grammar hints, recall questions, and study result screen.
- [ ] Verify a learner can complete the first study session.

### Task 5: Review And Mistake Loop

- [ ] Add SRS v1, review queue, mistake book, mistake drill, idempotent review logs, and session recovery.
- [ ] Verify answers change mastery state and next review time.

### Task 6: Leaderboard And Check-In

- [ ] Add server-confirmed effective score events, daily/weekly/book leaderboards, check-in calendar, and dashboard.
- [ ] Verify duplicate answers do not inflate score.

### Task 7: PWA And Offline Sync

- [ ] Add installable PWA, cached started sessions, local review queue, and recovery sync.
- [ ] Verify offline work only updates final check-in and leaderboard after server confirmation.

### Task 8: Launch Readiness

- [ ] Add rate limits, log redaction, performance/a11y checks, content validation, backup/restore notes, and staging E2E acceptance.
- [ ] Verify the MVP completion checklist in the product document.
