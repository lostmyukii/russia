import { expect, test } from '@playwright/test'

test('offline sync waits for server confirmation before score updates', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: '访客开始学习' }).click()
  await page.getByRole('button', { name: '生成学习计划' }).click()
  await page.getByRole('button', { name: '缓存离线学习包' }).click()
  await page.getByRole('button', { name: '断网作答' }).click()

  await expect(page.getByText('学习包已缓存：1 张词卡')).toBeVisible()
  await expect(page.getByText('作答待同步：1 条')).toBeVisible()
  await expect(page.getByText('今日积分 10')).toHaveCount(0)

  await page.getByRole('button', { name: '恢复网络同步' }).click()

  await expect(page.getByText('已自动同步 1 条离线作答')).toBeVisible()
  await expect(page.getByText('同步已确认。')).toBeVisible()
  await expect(page.getByText('已背 1 个词，掌握 1 个词')).toBeVisible()
})
