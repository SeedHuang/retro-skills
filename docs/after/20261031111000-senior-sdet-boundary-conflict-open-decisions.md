# 未决：`senior-sdet` 的「职责要写 testcase.md」与「边界禁写测试路径」冲突（2026-10-31）

> 状态：**未决（待用户裁定）**。本文是这条冲突的唯一入口；裁定后把结论并入 S6 spec / PRD，并删除本节。
> 来源：S4 Task 6（13 席迁移批）由**独立实例**按 `tools/execution-matrix/criteria.md` 的 **B3（职责段 vs 边界段）** 判 `senior-sdet` 为 `fail`（判者 `reviewer-ai-2026-10-31-s4-task6-batch`）。

## 一、冲突事实（可复核）

| 面 | 原文 | 位置 |
|---|---|---|
| PRD 角色职责 | 为 PRD/spec 设计并**编写**测试用例（`testcase.md`） | `tools/docgen/components/agentData.mjs` 的 `senior-sdet.identity` / `fixedList`；PRD 对 SDET 席的定义 |
| 工具档位 | `Read, Glob, Grep, Write, Edit`（可写） | `agents/senior-sdet.md` 的 frontmatter `tools` |
| 权限物（边界） | 「你是**只读**评审角色：不得创建、修改、删除任何文件」 | `patternRegistry.DEFAULT_BOUNDARY`；`renderBoundary('senior-sdet')` 亦把「测试」列为禁止写路径 |

结论：**职责动作（写 testcase.md）被边界明确禁止**，两段合看自相矛盾 —— 这正是 B3 要拦的形态（两段分开看都对、合起来冲突）。

## 二、为什么本批不自行修

- 修边界 = 改 `tools/docgen/policy/**` 或 S6 spec 的权限物（S6 已签，属 ② 段改判）；
- 修职责 = 改 PRD 的角色定义（属 ① 段改判）；
- S4（③ 段）只能消费这两份上游件，不得在渲染段自定 —— 否则是本规则禁止的「3 段自定上游口径」。

## 三、可选处置（择一，需用户拍板）

1. **给 SDET 席一条专用 boundary**（推荐）：在 S6 配置里为 `senior-sdet` 增加一条允许「写本次 testcase 产物」的边界句，并把 `Write` 档位与它对齐；同步 S6 testcase 的 boundary 断言。
2. **改 PRD 职责措辞**：「编写 testcase.md」改为「设计 testcase 内容，由主 agent 落盘」；边界不动。代价：SDET 席不再拥有写权限，`tools` 也要同批收窄。
3. **维持现状并接受 B3 = fail**：需在 S6 的判据表里显式登记该席为豁免（等于改判据），不推荐。

## 四、未决期间的当前状态

- `senior-sdet` **未迁移**：保留旧卡（`agentData` 无 `card`），gate 走旧模板分支，仓库门禁绿；
- S4 收口（Task 7：`EXPIRY_LANDED=true` / 删旧模板 / gate 31 份比对面 / `renderAll()` 全量）**因此阻塞**；
- 其余 14 席已迁移（试点 1 + 批量 13），`docs/agents/**` 15 份（14 席 README + index）。

## 五、何时该搬走

裁定完成后：把结论并入 `docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design.md`（若走方案 1）或 PRD 角色表（若走方案 2），实施迁移，随后删除本文。
