# Session 交接：retro-skills → Docgen P2 S2 施工（reviewer-audit 数据搬家）（2026-10-19）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-19 23:10（本机时区） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `376d692`；工作树：**8 个未跟踪文件**（`docs/handoffs/2026-10-19-docgen-p2-s2-parliament.md`、`docs/handoffs/2026-10-19-docgen-p2-s2-execute.md`（本文件）、`docs/reports/2026-10-19-docgen-existing-solutions-comparison.md`、`docs/superpowers/plans/2026-10-19-docgen-agent-pilot.md`、S3/S4 两对 spec+testcase），无已跟踪改动 |
| 验证基线 | `npm run check` → **323 tests（323 pass / 0 fail / 0 skip）/ baseline 35/35 / 0 findings / markdown 207 文件 690 表 / exit 0**（23:12 实跑，含本交接文件） |
| 继任自 | `docs/handoffs/2026-10-19-docgen-p2-s2-parliament.md` |
| 状态 | 可直开工（1 个开放问题：执行方式；见"开放问题"节） |

## 项目定位

`d:\Seed\retro-skills` —— 自研的复盘 / 规则 / 技能 / 议会评审工作流仓库；当前主线 docgen（「组件 → 模板 → 生成 → 守卫」把 rule / skill / agent 的 markdown 生成物从手写改为代码生成）。S2 = `reviewer-audit` 一席试点数据搬家。

## 现状

- **S2 议会评审已完成并通过终局交付审计**：3 轮评审（第 1 轮 6 席 68 卡 / 第 2 轮 6 席 57 卡 / 第 3 轮 4 席终局复核）+ 终局交付审计 **通过**（P0 = 0 / P1 = 0）。证据：`.session/reviews/2026-10-19-1936-docgen-p2-s2-pilot/delivery-audit.md`（结论"通过"）与 `round-check.md` 第 3 轮复核。
- **spec/testcase 已定稿并提交**：commit `376d692`（`git show --stat 376d692` 显示 2 文件、1507 insertions）。
  - spec：`docs/superpowers/specs/2026-10-19-docgen-agent-pilot-design.md`（rev3+，SHA256 `A813A665…`；R1–R12 + §3 + §4 九步 + §5 W1/巩固六项 + §6 硬约束 1–8 + §11 对 S1 修订清单 11 条）
  - testcase：`docs/superpowers/specs/2026-10-19-docgen-agent-pilot-design-testcase.md`（rev4，77 条；正 30 / 边界 14 / 负 33；覆盖 38/38；编写者 `sdet-2026-10-19-docgen-p2-s2-rev4`）
- **施工计划已写、未提交**：`docs/superpowers/plans/2026-10-19-docgen-agent-pilot.md`（10 个任务，TDD 步骤 + 完整 acceptance harness + 77 条用例映射）。
- **尚未施工**：`tools/docgen/` 与 `agents/reviewer-audit.md` 没有任何本计划的代码改动（`git status --short` 只有未跟踪文档，无已跟踪改动）。
- **验证证据**：见元信息表"验证基线"（单源）。
- **提交状态**：spec/testcase 已 commit（`376d692`）；plan、旧交接词、离题报告、S3/S4 两对未提交，由用户决定提交方式。
- **工作树异常**：无（仅上述未跟踪文件；无已跟踪文件的未提交改动）。

## 过程记录

- 评审账本：`.session/reviews/2026-10-19-1936-docgen-p2-s2-pilot/` —— **先读 `progress.md` 尾部 + `delivery-audit.md`**；问题漏斗 `problems.md`（第 1 轮 19 族 + 第 2 轮 G1–G12）、`cards.md`（68 卡 + 57 卡映射 + 逐卡表）、`round-check.md`（第 1–3 轮）、`detective.md`（第 1/2 轮观察）。
- S1 施工账本 `.superpowers/sdd/2026-10-19-docgen-agent-capability/progress.md` **当前不存在**（`LS` 该目录为空；不要按旧交接词去读它），S1 结论以 PRD §6.6 与 S1 spec 为准。
- 历史交接词（链式）：`docs/handoffs/2026-10-19-docgen-p2-s2-parliament.md` → `docs/handoffs/2026-10-19-docgen-p2-s1-execute.md` → `docs/handoffs/2026-10-19-docgen-p2-spec-split.md` → `docs/handoffs/2026-10-18-p2-agent-generation-prd-review.md`。

## 本次任务

**S2 施工**：按计划把 `reviewer-audit` 从迁移前现文件转录成 docgen 组件数据，经模板渲染逐字节复现，走完九步闭环到"已巩固"，落 W1 验收。

流程：读 plan → Task 1–8（数据 / 渲染 / generate / 错误码 / state+evidence / gate+replace / 验收脚本）→ Task 9（九步真实迁移，**replace 前必须问用户确认**）→ Task 10（全量回归 + 交付清单）→ 汇报。
起点：**Task 1**（`docs/superpowers/plans/2026-10-19-docgen-agent-pilot.md`）。
计划落盘约定：plan 已存在，直接执行；每个任务收尾把改动留在工作区，**不执行 git 写操作**。

## 范围依据

- 要读：
  - `docs/superpowers/plans/2026-10-19-docgen-agent-pilot.md` 全文（Global Constraints / File Structure / Task 1–10 / Testcase 覆盖映射 / Self-Review）。
  - `docs/superpowers/specs/2026-10-19-docgen-agent-pilot-design.md` §2 R1–R12、§3（3.1–3.4）、§4 九步、§5 W1 + 巩固六项、§6 硬约束 1–8、§11 修订/错误码表。
  - `docs/superpowers/specs/2026-10-19-docgen-agent-pilot-design-testcase.md` §0 计数口径、§1 覆盖总表、§2 TC-001–TC-078（TC-042 作废）。
  - `agents/reviewer-audit.md`（黄金快照，全文，逐字核对）。
  - `tools/docgen/cli.mjs`（S1 现状：`renderAgent` 私有函数、`gateChecks` fail-fast、`cmdReplace`、`cmdCheckAgents`、`cmdDraft`）。
  - `tools/docgen/components/agentData.mjs` / `patternRegistry.mjs` / `validateAgentData.mjs` / `baseline.mjs`；`tools/docgen/templates/agent.md.tpl`；`tools/docgen/baseline.json`。
  - 评审账本：`.session/reviews/2026-10-19-1936-docgen-p2-s2-pilot/delivery-audit.md` 与 `problems.md` 第 2 轮 G 表（修复落点）。
- 勿重做：
  - S1 能力地基（CLI 六子命令 / 草稿箱 / 守卫迁移 / 五档退出码 / baseline 35 条）——已提交 `9ad91cb`；本计划只在其上扩展，不重建。
  - S2 spec/testcase 的评审与定稿——已提交 `376d692`；**不要重开议会评审**，除施工发现 spec 缺陷才按流程回炉。
  - dc-translator / W5 新增席旅程——按 PRD 依赖图延后到 S2/S3/S4 之后；本计划所有席位数按 14 席快照（余下 12 席、13 席共用模板、11 席未拆槽、baseline 35）。
  - `docs/reports/2026-10-19-docgen-existing-solutions-comparison.md`（子代理离题产物）——与本任务无关，不要引用。

## 开放问题

1. **执行方式**（开工第一问）：subagent-driven（每任务派全新子代理，任务间审查）还是 inline（当前会话按 `executing-plans` 批量执行）？推断：**subagent-driven**，依据 = plan 10 个任务边界清晰、每任务有独立测试周期，符合 plan 头部推荐的执行方式。请用户：确认 / 纠正。
2. **plan 是否先提交**：推断：**先提交 plan 再施工**，便于回溯施工基线；但也可施工后与代码一起提交。请用户：确认 / 纠正。

## 既定约束（不要重新讨论、不要重新选型）

- spec + testcase 必须作为一件交付一起过；已通过终局交付审计（P0=0/P1=0）——出处：`delivery-audit.md`；用户全局规则 `spec-testcase-gate`。
- 禁止主动 git 写操作（commit/push/add 等），除非用户当前明确要求——用户全局规则 `no-git-write`；plan 每任务收尾只留改动在工作区。
- 黄金快照 = 步 1 记录提交号的 git blob（`git show <commit>:agents/reviewer-audit.md`），不得读活文件、不得在替换后读——spec R3 / §6-3。
- description 是派生字段，`agentData` 不存独立 description；硬编码 → `DescriptionDerivation`（exit 1）——spec R8 / §6-2；commit `376d692`。
- 数据形状分宿主：agentData 不含 `when/route/notWhen/fallback`，触发表四字段只住 `triggerTable`——spec R2 / §3.1–3.2；S1 §4.1 裁决。
- 九步顺序不可跳：入选 → 数据迁移 → 生成 → 逐字节比对 → 接守卫 → 落草稿 → 替换 → 验收 → 巩固——spec §6-5 / PRD 6.2。
- `state.json` 是"已接管"的唯一机器载体；只有 `replace` 写；先 state 后目标；非法 version/值/键 → `StateFileInvalid`（exit 2）——spec R9/R10 / §4 步 7。
- evidence 每席一份：`tools/docgen/fixtures/<name>.evidence.json`；字段 `commit/blob/sha256/hashObject/goldenAssertion/compareResult/renderSha256/lastWrittenHash`——spec R3/R4。
- 测试执行模型：需 replace / `npm run check` / 冷跑 / 真实仓库改写的用例一律放 `tools/docgen/acceptance/*.mjs`；`*.test.mjs` 禁止 spawn `npm run check`——spec §7。
- 14 席快照；W5/dc-translator 延后——PRD §6.6 依赖图（`docs/prd/20261019093443-docgen-agent-generation.md` 第 237 行）+ plan Global Constraints。
- 不重开议会评审；仅当施工发现 spec 缺陷时才回炉——`delivery-audit.md` 已通过。

## 遗留裁决与留观项

- **R2-A-05**：S1 spec `docs/superpowers/specs/2026-10-19-docgen-agent-capability-design.md:4` 仍写"待评审（草稿）"，与评审账本第 4 轮 PASS 不一致——来源：`problems.md` 候选表；收敛时机：S1 spec 下次修订时更新状态行，最迟 S4 开工前。
- **S1 §5.2 `InvalidOutputPath` 分支不可达**（`tools/docgen/cli.mjs:191` 直接 `join`，未经 `assertInside`）——来源：`problems.md` 候选表；收敛时机：S1 实现补 `assertInside` 或 S1 spec 明确移除该分支（用户裁决）；S2 已在 spec §11 第 4 条显式记账，不静默作废。
- **`check-all.mjs:63` 未剥离 `DOCGEN_DRAFTS_DIR`**（S1 对称性遗漏）——来源：`problems.md` 候选表；收敛时机：S1 后续顺手补。
- **replace 同秒并发 / 草稿箱跨仓库同名**——来源：第 1 轮 F17 部分承认；收敛时机：S1 后续 / S4 前补"单人单仓库、replace 串行"前提。
- **W5 / dc-translator**：S4 之后做新增席旅程，`baseline --write` 到 36/36，届时把 S2/S3/S4 文档里的 14/13/12/11 计数同步为 15/14/13/12——来源：PRD §6.6 依赖图 + S1 spec §8.2；收敛时机：S4 收口后。
- **终局审计勘误（非阻断）**：G2 证据行号 `check-all.mjs:64` 实际在 63；G10/G12"部分承认"未写不承认部分；跨组重复卡未写拆分归属；rev2/rev3 历史行号已漂移——来源：`delivery-audit.md` §七；收敛时机：下次触碰账本时顺手修。

## 开工前先做

1. `git status --short` 确认工作树 = 8 个未跟踪文件（见元信息表）；跑 `npm run check` 复核 **323 tests / baseline 35/35 / 0 findings / markdown 207 文件 690 表 / exit 0**（本交接 23:12 实跑）。
2. 读 `docs/superpowers/plans/2026-10-19-docgen-agent-pilot.md` 全文，重点 Global Constraints、File Structure、Task 1–10、Testcase 覆盖映射。
3. 读 spec `docs/superpowers/specs/2026-10-19-docgen-agent-pilot-design.md` 的 §2 R1–R12、§3、§4、§5、§6、§11；读 testcase §0/§1/§2。
4. 读 `tools/docgen/cli.mjs` 与 6 个组件文件，确认 S1 现状（尤其 `renderAgent` 私有函数、`gateChecks` fail-fast、`cmdReplace` 无 state/evidence、`cmdCheckAgents` 恒算未巩固）。
5. 与用户确认执行方式（subagent-driven / inline）与 plan 是否先提交；然后从 Task 1 开始，严格按 plan 的"失败测试 → 实现 → 通过 → 回归"步骤，每任务收尾不执行 git 写操作。

## 开场话术

```text
读 docs/handoffs/2026-10-19-docgen-p2-s2-execute.md，按交接词继续：执行 Docgen P2 S2 施工（按 plan 的 Task 1 起，TDD 逐任务）。注意：先确认执行方式（subagent-driven / inline）与 plan 是否先提交；replace 前必须问我确认，不要自行执行 git 写操作。
```
