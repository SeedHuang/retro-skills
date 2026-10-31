# 已裁定：`senior-sdet` 的「职责要写 testcase.md」与「边界禁写测试路径」冲突（2026-10-31）

> 状态：**已裁定并落地（2026-10-31，用户选方案 1）**；剩余部分 = **S6-B 结构收敛**（见 §六），本文因此保留为该项的唯一入口。
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

## 四、裁定与落地（2026-10-31）

- **用户裁定 = 方案 1**（给 SDET 席一条专用 boundary，并允许同批改两份已签字的测试口径）。
- 落地形态：`tools/docgen/components/patternRegistry.mjs` 新增 `SDET_BOUNDARY`（与 `DEFAULT_BOUNDARY` 同住一文件、只写一份），并登记进 `boundaryBySeat['senior-sdet']`；`agentData` 的 map 与 `validateAgentData` 的 `DECLARED_SLOT_SEATS` 自动派生，`policy/**` 零改动。
- 权限语义**未变**：旧卡 `agents/senior-sdet.md` 本就写「可写 testcase.md、其余只读」，`tools` 也已是 `sdet` 档；本批只是把手工边界搬进登记表。
- 同批改判：`S6-TC-G03` 的计数口径（`own` 3 → 4，默认席仍 11；`senior-sdet` 从「不注入 boundary」改为「自带专用句 + 黄金键 `senior-sdet-boundary`」），载体 = S6 testcase §G03 的日期注与「现行判据」块（**原文不删**）+ 总表行注 + `policy-pure-source.test.mjs` 断言 + `fixtures/boundary-golden.json`。
- 迁移证据：独立实例 `reviewer-ai-2026-10-31-senior-sdet-b3` 重判 A1/A2/B3 全 pass；替换凭证见 `tools/docgen/fixtures/senior-sdet.evidence.json` 末条 `changes`。

## 五、何时该搬走

- 方案 1 的落地部分已完成，**不再留待决项**；本文只剩 §六 的 S6-B 结构收敛欠账。

## 六、S6-B 结构收敛欠账（本项唯一入口）

- **要收什么**：当前 `renderBoundary` 的模板对非评审席结构不同构（首句「你是评审席」、只允许写本次评审账本、禁写「代码、测试」/`spec / plan`），所以 `senior-sdet` 只能自带一条字面边界句。理想态 = 边界句仍由「数据 → 渲染」生成（S6 的本质目标），且支持「按席排除禁写组」。
- **触发信号**：S6-B 立项（或下一次需要给非评审席新增写路径时）。
- **当前处置**：已作为登记例外落码，并在 `patternRegistry.mjs` 的 `SDET_BOUNDARY` 注释与 S6-TC-G03 日期注两处标明「S6-B 再收」。
