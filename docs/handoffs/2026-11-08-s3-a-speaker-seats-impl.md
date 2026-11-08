# Session 交接：retro-skills → S3-A 议长与答辩方席位施工（2026-11-08）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-08 20:29（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `1d5dd52`；工作树：clean（`git status --porcelain` 空、`git diff HEAD --stat` 空） |
| 验证基线 | spec 208 行 + testcase 71 条（正 17 / 负 33 / 边 21）+ `check-plan map 71/71 ok` + `check-plan size spec 208/350 tc 71/80 rounds 3/3 ok` + `scope-sweep ok` + `gate-record ok`（20:29 实跑） |
| 继任自 | 无（本轮首份交接） |
| 状态 | 可直开工；2 个 P2 留观（见"遗留裁决与留观项"），1 个开工第一问（B 段是否随做） |

## 项目定位

`d:\Seed\retro-skills` —— 角色卡 / 规则 / skill 的单一来源仓库（docgen 生成链路 + 议会评审流程 + 文档体系）。

## 现状

- 已完成：S3-A 的 spec + testcase + plan 三方闭环，议会 #2 共 5 轮（正式评审轮 3 + 用户授权修复核验 2），终局结论 **P0 = 0 / P1 = 0**，P2 挂 2。
- 验证证据：见元信息表"验证基线"（单源，勿重复）。
- 提交状态：spec / testcase / plan / mainline PRD / 合同 PRD / gate-record 已 commit（HEAD `1d5dd52`，`git show --stat HEAD` 6 文件）。
- 工作树异常：无。评审账本 `.session/reviews/2026-11-08-185332-s3-a-speaker-seats/` 未入 git（`.session/` 被忽略），只在磁盘；不随 commit 走。
- 关键基线：spec `038EC4246FBC626C638E6A11EA06458C21059DAE51B168BB50E505B0EB7AA433`；testcase `8D76812A4B0ED0B6B438DF42D91F93A58FF15C6E7FD6942F243568B26B544744`。

## 过程记录

- `.session/reviews/2026-11-08-185332-s3-a-speaker-seats/progress.md`（先读尾部：轮次账 + 第 5 轮结论）
- `.session/reviews/2026-11-08-185332-s3-a-speaker-seats/problems.md`（F01–F42 状态列，P2 只剩 F17/F40）
- `.session/reviews/2026-11-08-185332-s3-a-speaker-seats/cards.md`（3 轮原始卡）
- `.session/reviews/2026-11-08-185332-s3-a-speaker-seats/defense-record.md`（3 轮答辩）
- `.session/reviews/2026-11-08-185332-s3-a-speaker-seats/detective.md`（3 轮侦探观察）
- `.session/reviews/2026-11-08-185332-s3-a-speaker-seats/round-check.md`（第 2 轮轮间核对单）
- `.session/reviews/2026-11-08-185332-s3-a-speaker-seats/submission.md`（送审说明 + 最终哈希）
- `.session/reviews/2026-11-08-185332-s3-a-speaker-seats/escalation-report.md`（第 3 轮后升级记录）
- `.session/reviews/2026-11-08-185332-s3-a-speaker-seats/impact-sheet.md`（改判影响清单）
- `docs/devworkflows/20261108185253-s3-parliament-speaker/gate-record.md`（② 行 = 评审通过）
- 历史交接词：无（本轮首份）

## 本次任务

按 `docs/superpowers/plans/2026-11-08-s3-parliament-speaker.md` 施工 **S3-A（A 段 Task 1–7）**；流程：Task 1 席数据 → Task 2 登记面 → Task 3 输出合同 → Task 4 trigger 守卫 → Task 5 出生分支 → Task 6 `hostTerm` 改名 → Task 7 重生成与门禁；起点：Task 1。B 段 Task 8–12 归 S3-B，未授权前不动。

## 范围依据

- 要读：`docs/superpowers/specs/2026-11-08-s3-a-speaker-seats-design.md` §0（范围）、§4（创建链路步骤 1–10）、§5（单源改动清单全表）、§6（`--new` 与崩溃收敛）、§9（工具档与写权）、§11（已签件）。
- 要读：`docs/superpowers/plans/2026-11-08-s3-parliament-speaker.md` Task 1–7 与"批次 A/B"边界（`:44-61` 附近）。
- 要读：`docs/superpowers/specs/2026-11-08-s3-a-speaker-seats-design-testcase.md` §0.2 判据约定 + S3A-TC-01/06/11/15/18/22/30/33/36/39/43/46/51（逐 Task 验收锚）。
- 勿重做：spec / testcase / plan 已定稿（哈希见元信息）；议会评审已终局，不要重开评审轮。

## 开放问题

1. B 段 Task 8–12 是否随本轮一起做？推断：不随——spec §0 明确 `skills/parliament/**` 拆分与两张矩阵归 S3-B，plan 标注"批次 B"（`docs/superpowers/plans/2026-11-08-s3-parliament-speaker.md:63-73`）；请用户确认或纠正。
2. P2 两项是否在施工中顺手清？推断：F17（错行号）在 Task 6 改 `writeScopes.mjs` 时顺手改锚；F40（TC-71 退出码口径 / TC-55 未含 SC-TC-36）在 Task 7 改测试时一并处理；请用户确认。

## 既定约束（不要重新讨论、不要重新选型）

- P0 / P1 全修、P2 可挂 —— 用户 2026-11-08 裁定，见 `.session/reviews/2026-11-08-185332-s3-a-speaker-seats/progress.md` 第 5 轮行。
- 新席一律走 `seatLoader → cardPipeline → renderByName`；不手写 `agents/*.md`、不改 `agentData.mjs` 字面 —— spec §0。
- 三新席卡数据不得引用 `${@hostTerm}` —— spec §4 步骤 1（否则「18 处 / 13 文件」口径破，步骤 9 漏更新新席）。
- `speaker` 写作用域用新增 `review.host`，不复用 `review.ledger` —— spec §5 / §9。
- 出生 evidence 的 `goldenAssertion` 写 `pending`，不写 `pass` —— spec §6。
- 改名必须排在出生之后；13 席先批量 `draft` → 刷新投影 → 再逐席 change —— spec §4 步骤 9。
- `--new` 必须同时加 `REPLACE_FLAGS` 与 `main()` 透传 —— spec §6。
- 议会正式轮数记 3（`check-plan` 上限），第 4/5 轮记为授权核验 —— progress.md「轮数口径」行。

## 遗留裁决与留观项

- F17（P2）：`writeScopes.mjs:14` 无旧称，实为 `:8`；TC-20 记 `cli.mjs:18` 应为 `renderCard.mjs:16,77` —— 来源 `problems.md` F17；收敛时机：Task 6。
- F40（P2）：TC-71 把「渲染期 / import 期」退出码口径混写；TC-55 未含 SC-TC-36 —— 来源 `problems.md` F40；收敛时机：Task 7。

## 开工前先做

1. `git status --porcelain` 应为空、`git log -1 --oneline` 应为 `1d5dd52`；复算两件哈希（见元信息）并跑 `node scripts/check-plan.mjs map --plan docs/superpowers/plans/2026-11-08-s3-parliament-speaker.md`（应 `cases 71 / mapped 71 => ok`）。
2. 读 `docs/superpowers/plans/2026-11-08-s3-parliament-speaker.md` 的 Task 1–7 与批次 A/B 边界。
3. 读 `docs/superpowers/specs/2026-11-08-s3-a-speaker-seats-design.md` §4 步骤 1–10、§5 全表、§6 全部 bullet。
4. 读 `docs/superpowers/specs/2026-11-08-s3-a-speaker-seats-design-testcase.md` §0.2 与 S3A-TC-01/06/11/15/18/22/30/33/36/39/43/46/51。
5. 读 `docs/devworkflows/20261108185253-s3-parliament-speaker/gate-record.md` 的 ② 行，确认评审通过留痕。

## 开场话术

读 `docs/handoffs/2026-11-08-s3-a-speaker-seats-impl.md`，按交接词继续：施工 S3-A 议长与答辩方席位（plan Task 1–7）。注意：B 段 Task 8–12 未授权；P2 两项留观；开工前先跑 `git status` 与哈希复核。
