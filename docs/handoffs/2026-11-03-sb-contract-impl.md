# Session 交接：retro-skills → S-B 契约层 ③ 施工（从 Task 0 起）（2026-11-03）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-03 21:26（本机时区，Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `88295dd`（`docs(dev-workflow): ②@S-B 签后增量登记（testcase SHA 变更说明）`）；工作树：**clean**（`git status --porcelain` 本次实跑无输出） |
| 验证基线 | typecheck 无（本仓无 typecheck）/ build 无（无构建）/ unit `# tests 1439 / # pass 1437 / # fail 0 / # skipped 2` + `node tools/docgen/cli.mjs gate` → `baseline 38/38` + `node scripts/check-gate-record.mjs` → `rows 65 bad 0` + `node scripts/scope-sweep.mjs --check` → `sweep ok（命中未超基线、清单齐、scope 齐）` + `④ markdown 检查通过（392 个文件 / 1679 张表）` + `⑥ 观察产物门禁：扫描 2 个子目录 / 归档 1 对 / 过程 0 对 / findings 0` + `[observable] 扫描 107 个 .md / 未豁免命中 0 行 / 已豁免 6 行 / stale 0 条` + 末行 `check 全部通过`（**21:25 实跑**） |
| 继任自 | `docs/handoffs/2026-11-03-card-data-contract-sb-spec.md`（② 段开工前的交接词） |
| 状态 | **可直开工**；有 2 个开放问题（见「开放问题」节），均非阻塞 |

## 项目定位

`d:\Seed\retro-skills` —— 一套「规则 / 技能 / 角色卡生成器」仓库：`rules/` 与 `skills/` 写方法与判据，`tools/docgen/` 把 15 席数据渲染成 `agents/*.md` 15 张角色卡，`scripts/check-all.mjs` 是总门禁（七段 + `[observable]`）。

## 现状

- **已完成**：
  - **S-A 数据层五段全闭环**（门行 `②@S-A`…`⑤@S-A` 全签「过」，`skills/dev-workflow/references/gate-record.md:81`–`:85`）。
  - **`①@card-data-contract-and-proof` 门行**已补（同文件 `:87`，按「判据换载体」登记，用户 2026-11-03 选定该形态）。
  - **S-B ② 段已收口**：议会第 1 轮 5 席出卡 25 张（P0 3 / P1 20 / P2 2）归 8 族，答辩「6 承认 + 2 部分承认 + 0 无依据反驳 + 0 升级」，7 批修复 + 4 道复核（后端 / 测试 / 终核 / 侦探），独立审计签「过」（`gate-record.md:89` 的 `②@S-B` 行）。三件现值：
    - spec `docs/superpowers/specs/2026-11-03-s-b-contract-layer-design.md`（**240 行 / `88B681AD…CE1DE6CE`**）
    - testcase `…-design-testcase.md`（**861 行 / `9A1C163A…6F42AF249` / 41 条 = 正 14 / 负 19 / 边界 8**）
    - plan `docs/superpowers/plans/2026-11-03-s-b-contract-layer.md`（**282 行 / `7B7F2A59…6E04DCE13`**）
  - **S-B 计划门已过**（`gate-record.md:91` 的 `②→③@S-B` 行）：`deps: cycle 0 dangling 0（nodes 9 / edges 9）`、`map: missing 0 dangling 0（cases 41 / mapped 41）`、`size: spec 240/350 tc 41/80 rounds 1/3 => ok`、`^## 新增设计决策` 0 命中；独立审计判「成立 4 / 不成立 0」。
- **验证证据**：见元信息表『验证基线』（单源，勿在此重复）。
- **提交状态**：已 commit（本 session 4 个：`b17f3b6`（① 门行）→ `269b3d4`（②@S-B + 3 条 P2）→ `e2ad0de`（plan + 计划门行）→ `88295dd`（②@S-B 签后增量登记）；用户另自行提交 `2527d05`（spec + testcase + after 文档））。
- **工作树异常**：无。
- **一处已记账的教训（新）**：`docs/after/20261103210731-testcase-criterion-execution-open-decisions.md` —— testcase 的判据命令「写出来像命令、但没跑过」这次被抓出 1 条 P0（`Select-String -Recurse` 参数不存在 + 目录写错），同族还有 `node -e` 被审计席角色卡禁、计数当判据恒真等 3 处。该文件有 3 条待决（D-1 落规则还是角色卡 / D-2 允不允许「未施行」/ D-3 谁来跑）。

## 过程记录

- `skills/dev-workflow/references/gate-record.md`（**先读 `:89` 的 `②@S-B` 行 + `:91` 的 `②→③@S-B` 计划门行**；`:93` 起是各列口径）
- `.session/reviews/2026-11-03-1936-s-b-spec-parliament/`（② 段议会账：`progress.md` 轮次账、`cards.md` 25 卡单源、`problems.md` 族表 + 25 卡终态 + 待补 4 项、`submission.md` 基线变更表、`detective.md` 12 条观察）；**先读 `problems.md` 的「遗留」与 `detective.md` 的状态注**
- `.session/reviews/2026-11-03-s-a-plan-gate/impact-sheet.md`（R8 的当次清单，已 touch 33 次；**§十 / §十一 / §十二** 是 S-B 的三次处置）
- `.session/reviews/2026-11-03-1626-s-a-quality/`、`.session/reviews/2026-11-03-1654-s-a-delivery/`（S-A ④⑤ 段账，备查）
- 历史交接词（链式）：`docs/handoffs/2026-11-03-s-a-data-layer-impl.md` → `2026-11-03-s-a-quality.md`（若存在）→ `2026-11-03-card-data-contract-sb-spec.md` → 本件
- ⚠️ `.session/` 不进 git：换机器 / 重新克隆后上述评审账全部消失（S-A-Q-6 已登记该风险）

## 本次任务

按 `docs/superpowers/plans/2026-11-03-s-b-contract-layer.md` 施工 S-B 契约层，**从 Task 0 起依次到 Task 8**；流程：③ 施工（Task 0→8，每任务一 commit）→ ④ 质量评估（41 条用例逐条结论 + 漂移定性，派 `senior-sdet` 独立实例）→ ⑤ 交付审计（独立审计 + 用户终签）；起点 = **Task 0**（② 段与计划门已闭环，勿重做）。

## 范围依据

- 要读：
  - `docs/superpowers/plans/2026-11-03-s-b-contract-layer.md` 全文（282 行；Global Constraints / 9 个 Task 的 Steps / 附录 A 的 41 条映射）
  - `docs/superpowers/specs/2026-11-03-s-b-contract-layer-design.md` §11.2.1–§11.2.8（机制）、**§11.2.6（必红断言清单，施工最容易漏）**、§11.4（十条硬约束）、§11.3（15 卡变更面）
  - `docs/superpowers/specs/2026-11-03-s-b-contract-layer-design-testcase.md` §0 判据约定（`PROBE` / `COPY` / `GATE` / `COUNT` 各是什么）+ §1 覆盖总表（41 行）
  - `skills/dev-workflow/references/gate-record.md:89` 与 `:91`（两条已签门行）
- 勿重做（S-A 已实现，文件级）：`tools/docgen/data/**`、`components/seatLoader.mjs`、`components/cardKeys.mjs`、`check-shared-refs.mjs`、`components/agentData.mjs`（9 行薄壳）、`components/validateAgentData.mjs`（已含 S-A 4 码）、`card-model/enums.mjs` + `validateCardModel.mjs`（`description` 已进扫描面）、`policy/definitions/paths.mjs`（Q8 三项已删）、`tools/docgen/test/sa-data-layer.test.mjs`、`docs/reports/2026-11-03-s-a-card-sha-baseline.md`
- 勿改（已签三件）：S-B 的 spec / testcase / plan —— 要动必须回 ② 段重签并在 `gate-record.md` 做「签后增量登记」

## 开放问题

1. **Task 0 的修法二选一**（plan `:74`）。推断：**选「`cpSync` 失败重试一次」**——依据 plan Task 0 Step 2 + `docs/after/20261103164513-s-a-quality-open-items-open-decisions.md:13`（S-A-Q-4 的「该做」原文 = 重试或按需拷贝）；选重试的理由是改动面最小、不动共享复制根（`test/support/dev-workflow-checks.mjs` 被 S-A 多条用例复用）。请用户：**确认**或纠正。
2. **是否按 `subagent-driven-development` 逐任务派新子代理**（plan 头部建议「推荐」）。推断：**用**——每任务一 commit + 独立子代理，能保留「施工者 ≠ 复核者」的独立性（④⑤ 段要独立实例）。请用户：**确认**或指定用 `executing-plans`。

## 既定约束（不要重新讨论、不要重新选型）

- 卡面 `agents/*.md` 是**生成物**，只能由 `node tools/docgen/cli.mjs generate` 产出，禁手改 —— `plans/2026-11-03-s-b-contract-layer.md` Global Constraints
- **卡面变更面 = 15 张卡**（2 张因边界段指针化 + 15 张因删「关注类别：」行；13 席只少一行）；`git diff --stat <BASE> -- agents/` = 15 files —— spec §11.3 / §11.2.7-2
- `issue-card.fields` 的 3 个证据列**派生自** `evidence.fields`，禁抄字面 —— spec §11.2.1 / R1
- `outputFormats` 侧只改 `issue-card.checks[0]`；`card-contract` 侧改 `FORMAT_CHECKS[1]` 且**仍 3 条** —— spec §11.2.1 / R9（两处索引不同源，第 2 轮复核实测）
- 边界段**保留 12 槽**，只改 **5 个槽值**（`ALLOW_GROUPS` / `DENY_GROUPS` / `ENV_FORMS` / `FORBIDDEN_PATHS` / `DETECTION_PATHS`）+ 4 行文案；`SLOTS` 顺序不动 —— spec §11.2.3
- 指针只写**策略符号名**（`pathGroups` / `commandGroups` / `forbiddenGroups` / `DETECTION_BLIND_SPOTS`），不写仓内路径 —— spec R6 / §11.4-9
- `duty.categories` 从数据源删、**loader 装配期注入**（与 `duty.trigger` 同处同趟），卡面不再渲染；新码 `DutyCategoryMisplaced` 只进 `validateAgentData.mjs` 的 `EXIT[1]` —— spec §11.2.4 / R7 / R8
- `CARD_MODEL_CODES` 仍 36 码、`SCAN_FIELDS` 仍 8 键 —— PRD §5
- 两个新脚本（`check-quotes.mjs` / `check-case-assert.mjs`）**不进** `npm run check` —— spec R3（理由 = 与 `check-shared-refs.mjs` 同口径）
- `baseline 38/38` **不作判据**（同式自除恒真）—— 已签 S3 `D-15`
- 改 `gate-record.md` 任一行之后**必须再 touch** `.session/reviews/2026-11-03-s-a-plan-gate/impact-sheet.md`，否则 `sweep` 报「impact-sheet 早于被扫文件」→ 连带 4 条 sweep 用例红（本 session 已踩过一次，见 `gate-record.md:95`）
- 每任务一 commit，由 agent 直接提交 —— 用户 2026-11-03 裁定
- 不动 PRD 的 D/Q/V 正文；发现 spec 未定义的东西 → 回流 ② 段（R4），不在 plan 里补设计
- S-C 的东西（三态 5 行 / `trigger` 四型 / 斜杠串清零 / 删人设 / `HOST_TERM`）一律不做 —— spec §11.6

## 遗留裁决与留观项

- `docs/after/20261103210731-testcase-criterion-execution-open-decisions.md` 的 D-1～D-3（判据命令「跑过没跑过」的长期工序）—— 来源：本 session 议会 `Q-T-01`（P0）；收敛时机：下次修订 `spec-testcase-gate` 或 `senior-sdet` 角色卡
- S-A-Q-1…Q-7（`docs/after/20261103164513-s-a-quality-open-items-open-decisions.md`）—— 其中 **S-A-Q-4 已在 plan Task 0 升必修**；其余 6 条各带触发
- 议会第 1 轮的 **14 条候选**（P2/P3，见 `.session/reviews/2026-11-03-1936-s-b-spec-parliament/cards.md` 各席「候选」表）—— 不阻断，逐条带「为什么可后续」
- `check-quotes.mjs` 不进总门禁的**腐化风险** —— 来源：spec §11.7；收敛时机：Task 2 Step 5 会落 `docs/after/` 一条（触发 = 下次改 ⑥ 段，或语料件降到 1 份）

## 开工前先做

1. `git status --porcelain`（期望空）+ `npm run check`（期望 `# tests 1439 / # pass 1437 / # fail 0 / # skipped 2` + 末行 `check 全部通过`）；若出现 `# fail 4` 且都是 sweep 类，先查 `impact-sheet` 的 mtime
2. 读 `docs/superpowers/plans/2026-11-03-s-b-contract-layer.md` 全文，特别是 **Global Constraints**、Task 0 的「出处」块、**附录 A**（41 条用例落点）
3. 读 `docs/superpowers/specs/2026-11-03-s-b-contract-layer-design.md` 的 **§11.2.6（必红清单，5 个已签测试文件）** 与 **§11.4（十条硬约束）**
4. 记下 `BASE=$(git rev-parse HEAD)`（Task 6 的 `git diff --stat <BASE> -- agents/` = 15 files 要用它；不记就没法判）
5. 从 **Task 0** 开工，按「写失败测试 → 跑红 → 实现 → 跑绿 → commit」推进；每任务一 commit

## 开场话术

```text
读 docs/handoffs/2026-11-03-sb-contract-impl.md，按交接词继续：S-B 契约层 ③ 施工，从 Task 0 开始。
注意：开放问题第 1 条（Task 0 修法二选一）先跟我确认。
```
