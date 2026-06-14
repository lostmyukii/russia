# 俄语百词斩

面向初中、高中俄语学习者的百词斩式智能词汇学习 Web/PWA。词汇内容按人教版教材版本、册别、单元、课次组织。

## 当前开发步骤

项目按 `AGENTS.md` 约定最多拆成 8 步推进：

1. 工程基线
2. 俄语词库与导入
3. 账户与新手引导
4. 首次学习闭环
5. 复习与错词闭环
6. 排行榜与打卡
7. PWA 与离线同步
8. 上线验收

## 本地启动

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres redis
pnpm dev:api
pnpm dev:web
```

默认地址：

- Web: `http://localhost:5173`
- API: `http://localhost:4000/api/v1/health`
- PostgreSQL: `localhost:54322`
- Redis: `localhost:63799`

## 常用命令

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:validate
pnpm vocabulary:validate scripts/import-vocabulary/fixtures/pep-russian-sample.csv
pnpm test:e2e
pnpm release:check
```

`pnpm release:check` 是上线验收入口，会顺序执行格式、lint、类型检查、单元测试、生产构建、Prisma schema 校验、词库导入校验和端到端测试。

## 事实来源

- `AGENTS.md`
- `俄语版_智能词汇学习产品需求与开发文档.md`
- `docs/superpowers/plans/2026-06-14-russian-wordscodex-implementation.md`
