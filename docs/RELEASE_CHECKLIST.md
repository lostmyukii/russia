# 俄语百词斩上线验收清单

本文档用于第 8 步“上线验收”。每次发布前按本清单执行，并把实际命令输出、负责人和时间记录到发布记录中。

## 1. 环境与配置

- `.env` 从 `.env.example` 复制，确认 `DATABASE_URL`、`REDIS_URL`、`WEB_ORIGIN`、`API_ORIGIN`、`HOST`、`PORT` 已按环境配置。
- `RATE_LIMIT_MAX_REQUESTS` 和 `RATE_LIMIT_WINDOW_MS` 已按 staging/production 压测结果调整。
- 不把数据库密码、令牌、Cookie、验证码、手机号或邮箱写入代码、日志、截图或文档。

## 2. 必跑命令

```bash
pnpm release:check
```

该命令必须覆盖：

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm db:validate`
- `pnpm vocabulary:validate scripts/import-vocabulary/fixtures/pep-russian-sample.csv`
- `pnpm test:e2e`

## 3. API 安全

- `/api/v1/health` 返回安全响应头：`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`、`Permissions-Policy`。
- 写请求触发统一限流，超过窗口阈值时返回 `RATE_LIMIT_EXCEEDED` 和 `Retry-After`。
- `/api/v1/ops/readiness` 返回 `ready` 报告，且包含安全、隐私、性能、可访问性、内容、备份和 e2e 检查项。
- 日志进入输出前使用敏感字段脱敏规则处理。

## 4. 内容与词库

- 词库按人教版教材、学段、册别、单元、课次组织。
- 正式导入前执行 dry-run 校验，错误行必须为 0。
- 每条词汇保留 `source`，不得上线无来源词条或直接手工修改生产词库。

## 5. PWA 与移动端

- 生产构建生成 `manifest.webmanifest` 和 `sw.js`。
- 打卡、排行榜和同步结果必须等待服务端确认，不使用离线缓存伪造成功状态。
- 375px 移动视口下核心学习、离线同步路径无横向溢出。

## 6. 备份与恢复

- 上线前完成 PostgreSQL 备份。
- 在 staging 或临时库完成一次恢复演练。
- 记录备份文件路径、恢复命令、校验结果和回滚负责人。

## 7. 验收结论

上线条件：

- `pnpm release:check` 通过；
- `/api/v1/ops/readiness` 返回 `overallStatus: "ready"`；
- 无高危安全问题；
- 词库来源、未成年人隐私和排行榜展示规则已经复核；
- 备份恢复演练有记录。
