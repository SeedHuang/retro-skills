# 开发工作流主干：议会 #1 收口遗留（未决）

> 状态：**未决**｜创建：2026-10-24 17:42:53｜来源：议会 #1 三轮评审 + 补充复核（账本 `.session/reviews/2026-10-24-163717-dev-workflow-mainline-prd/`）
> 搬走条件：逐条做完后把结论并入 `docs/prd/20261024073606-dev-workflow-mainline/index.md` 或对应 spec，本条迁出；**本文件不是结论**。

## A 收口前必须处理（阻塞 PRD 定稿）

| # | 事项 | 现状 | 处理动作 | 完成判据 |
|---|---|---|---|---|
| A-1 | PRD 未正式过议会 | 3 轮后仍有 P0/P1 时按新规升级用户；P0 文档层已清零、P1 见下 | 用户终裁：判「有条件通过」并把结论写进 `gate-record.md` ① 行（申报人 = 产品经理代拟，签字人 = 用户） | ① 行六列齐、结论非空；PRD 头部状态改「定稿」 |
| A-2 | §0 签字快照无 commit | `PRD@7EBCBDDB@未提交`，按 §8.2 兜底会一直按「触发」处理 | §0 重签时记录 `PRD@<sha8>@<commit7>`；或明确写「基线作废，首版按全新增」 | §0 用户行含 commit7，且 `git show` 可复算 |

> **不挂账（P1）已清零（2026-10-24）**：A-3 侦探快照两栏已进 `skills/parliament/assets/progress.md`；B-2 已在 PRD §13 加 V-9。两条均已落地，不在本表保留。

## B 未开工（不阻塞 PRD 定稿）

| # | 事项 | 现状 | 去向 |
|---|---|---|---|
| B-1 | `producer` / `research` 档 | S5 部分完成：`command` 档已落地（审计 / 侦探） | S5 剩余；S2 的写权依赖它 |
| B-2 | F-22 只落一半（节点数检查进 S2，正文解释未进） | 正文解释无验收项 | **不挂账，转本轮施工**（PRD 加 V-9） |
| B-4 | 测试未锁侦探 tools（只锁审计） | `pilot-data.test.mjs` 缺一条 | 下次改生成器时同批补 |
| B-5 | 旧措辞「13 席三元组」「14 席」 | `tools/docgen/components/validateAgentData.mjs:40`、`tools/docgen/test/validate.test.mjs:29` | S5 收口时同批清 |
| B-6 | 档位名表两处硬编码（`agentData` 与 `validateAgentData`） | 自守卫但违单一真相 | S5 收口收进 `patternRegistry.tierBySeat` |
| B-7 | 全部改动未提交 git | 工作区改动 | 用户决定提交方式后执行 |
