# Session 交接：retro-skills → S-A T4（`description` 进文本扫描面）（2026-11-03）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-03 14:15（本机时区，Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `23df99b`（`refactor(docgen): agentData 降为薄壳，伴随断言改指新落点 + patch 注入目标改 JSON（T3）`，14 文件 / +142 −386）；工作树：**clean** |
| 验证基线 | typecheck 无（本仓无 typecheck）/ build 无（无构建）/ unit `# tests 1426 / # pass 1424 / # fail 0 / # skipped 2` / docgen `gate` → `baseline 38/38` exit 0 / `check-shared-refs` → `seats 15 / dangling 0 / nested 0 / keySet8 15 / keySet12 15 => ok` exit 0 / 末行 `check 全部通过`（`14:12:04` 起跑、`14:13:59` 收尾，`npm run check` exit 0） |
| 继任自 | `docs/handoffs/2026-11-03-s-a-loader-t2.md` |
| 状态 | **可直开工**；开放问题 0（见「开放问题」节） |

## 项目定位

`d:\Seed\retro-skills` —— 一套「规则 / 技能 / 角色卡生成器」仓库：`rules/` 与 `skills/` 写方法与判据，`tools/docgen/` 把组件数据渲染成 `agents/*.md` 15 张角色卡，`scripts/check-all.mjs` 是总门禁。

## 现状

- **已完成**
  - ② 段议会评审闭环：5 席 + 侦探，33 卡全处置，终判「通过」见 `.session/reviews/2026-11-03-082100-s-a-spec-parliament/problems.md:97-99`。
  - **计划门三轮**（独立审计实例）：首轮 FAIL（P0 1 / P1 6）→ 复核轮 FAIL（P1 3）→ 复核轮 3 **PASS**；全文 `.session/reviews/2026-11-03-s-a-plan-gate/plan-gate.md`（400 行）。
  - **③ T1**：`tools/docgen/data/shared.json`（恰 3 键）+ `data/seats/<seat>.json` ×15 + `sa-data-layer.test.mjs` 的 TC-001（commit `0a7cd63`，由用户提交）。
  - **③ T2**：`components/seatLoader.mjs`（`expandRefs` + `loadSeatData`）+ `tools/docgen/check-shared-refs.mjs` + `CARD_KEYS` 导出 + `EXIT[1]` 4 码（commit `91a3771`）。
  - **T2-补**（独立代码审查 4 条）：席序 `SEAT_ORDER`、叶模块 `components/cardKeys.mjs`（切断 init 环 TDZ）、`trigger.when`/`route` 类型校验、`seats/` 只收 `isFile()`（commit `7389726`）。
  - **③ T3**：`agentData.mjs` 降 8 行薄壳（先 import 再 export）+ 9 处伴随断言改指新落点 + `replace-scenarios` 的 `DATA` 改指席 JSON + **删 3 席 JSON 的 `boundary`**（policy 定义层重回单源）+ 行号守卫「结构替换豁免」（commit `23df99b`）。
- 验证证据：见元信息表『验证基线』（单源，勿在此重复填写）。
- 提交状态：**已 commit**——T1 `0a7cd63`（用户提交）、T2 `91a3771`、T2-补 `7389726`、T3 `23df99b`（后三条按用户 2026-11-03 裁定的「每任务一条 commit」由 agent 执行）。
- 工作树异常：无。

## 过程记录

- `.session/reviews/2026-11-03-s-a-plan-gate/impact-sheet.md`（**先读尾部**「重 touch 记录 1–11」：每次动 plan/spec/testcase/gate-record 后都必须重 touch 本文件）
- `.session/reviews/2026-11-03-s-a-plan-gate/plan-gate.md`（**先读「复核轮 3」§八**：终值与认输判据；首轮 P0-1 是「12 键恰等」错位的原始论证）
- `.session/reviews/2026-11-03-082100-s-a-spec-parliament/`（议会账本，未进 git；先读 `problems.md` §八 / §四 / §九）
- 历史交接词：`docs/handoffs/2026-11-03-s-a-spec-parliament.md` → `docs/handoffs/2026-11-03-s-a-data-layer-impl.md` → `docs/handoffs/2026-11-03-s-a-loader-t2.md` → 本文件（链式继任）

## 本次任务

按 plan 施工 **T4：`description` 进文本扫描面（D17 / R4）+ 同批改写三条冻结断言（R5）**；流程：③ 实现（T4）→ ④ 质量（全量 ④/⑤ 在 T6 收口）；起点：**T4 Step 1**（写失败测试）。提交口径 = **每任务一条 commit**（用户 2026-11-03 裁定）。

## 范围依据

- 要读（按顺序）：
  1. `docs/superpowers/plans/2026-11-03-s-a-data-layer.md` 的 **T4 全节**（`:663-789`：Files / Step 1 `:675` / Step 2 `:735` / Step 3 `:740` / Step 4 `:762` / Step 5 `:775` / Step 6 `:782`）
  2. 同 spec `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md`：**§10.1 R4 `:22`**（两处同批改，缺一即静默空转）/ **R5 `:23`**（三条冻结断言，`:1141` 不动）/ R9 `:27`（`gate` 必须 exit 0 且 15 席 disk == render）
  3. 同目录 `…-testcase.md`：TC-009 `:170` / TC-020 `:291` / TC-021 `:303` / TC-022 `:314` / TC-023 `:325`
  4. 实现现状（**已核：T4 未开工**）：`tools/docgen/card-model/enums.mjs:86`（`CARD_TEXT_FIELDS`，**无 `description`**）、`:100-103`（四个文本码各挂哪个面）；`tools/docgen/card-model/validateCardModel.mjs:102`（`surfaceTexts`，其 if 链**无 `description` 分支**）；`tools/docgen/test/card-model.test.mjs:1125`（`green` ② 数量词不扫）/ `:1131`（`green` ⑦ 混称词不扫）/ `:1141`（`Object.keys(SF).length === 8`）
  5. 测试支撑：`tools/docgen/test/support/dev-workflow-checks.mjs`（`withRepoCopy` / `runCli` / `counterProbes`）
- 勿重做：`tools/docgen/data/**`（T1 已建）；`components/seatLoader.mjs` / `cardKeys.mjs` / `check-shared-refs.mjs` / `validateAgentData.mjs` 的 4 码（T2）；`components/agentData.mjs` 薄壳 + 9 处伴随断言 + `acceptance/replace-scenarios.mjs` 的 `DATA`（T3）；`sa-data-layer.test.mjs` 的 TC-001…008 / 011–019 / 026 / 027 / 029–035（T4 只加 009 / 020 / 021 / 022 / 023）；`gate-record.md` 的 `②@S-A` / `②→③@S-A` 两行（只许按 R10② 重记指纹）

## 开放问题

无。（已知的两处限制已转为「遗留裁决与留观项」，且有明确触发点）

## 既定约束（不要重新讨论、不要重新选型）

- **`CARD_TEXT_FIELDS` 与 `surfaceTexts` 必须同批改**，缺一即静默空转（TC-020 的「`/description/` 命中条数 1 → 0」就是它）—— 出处：spec §10.1 R4 `:22`、testcase `:291`（TC-020）
- **三条冻结断言同批改**：`card-model.test.mjs:1125` / `:1131` 由 `green` 改 `only`，`:1141` 的「`SCAN_FIELDS` 恰 8 键」**保持不动** —— 出处：spec §10.1 R5 `:23`、plan `:762-773`
- **只加 `description`**，不得顺带把其它字段挪进 `CARD_TEXT_FIELDS`（`MixedTermInCard` / `ProceduralWordOutsideParliament` 已各自带 `rationale`）—— 出处：`tools/docgen/card-model/enums.mjs:102-103`
- `SCAN_FIELDS` 仍 **8 键**、`CARD_MODEL_CODES` 仍 **36 码零新增** —— 出处：spec §10.2.6 `:133`、testcase `:314`（TC-022 的注入即判「第 9 键必红」）
- `description` 的**文本本身不变**（唯一源 = `triggerTable.when` + `notWhen`），所以 `gate` 必须仍 **exit 0** 且 15 席 disk == render 逐字节相等 —— 出处：spec §10.1 R9 `:27`、plan `:775-780`
- 测试里的席 / 条目计数一律派生，禁写字面量（`counterProbes` 扫 `tools/docgen/test/*.test.mjs` 的 assert 行）—— 出处：`tools/docgen/test/support/dev-workflow-checks.mjs:208-223`
- 改 `plan` / `spec` / `testcase` / `gate-record` 之后**必须重 touch** `.session/reviews/2026-11-03-s-a-plan-gate/impact-sheet.md`，否则 `F08` / `S4-TC-J04` / `S2-TC-G01` / `S3-TC-K04` 四条 sweep 类实红（T2/T3 已撞 8 次）—— 出处：`impact-sheet.md`「重 touch 记录 1–11」
- **席序 = `seatLoader.mjs` 的 `SEAT_ORDER`**（与 `seats/*.json` 文件集双向恰等，缺/多 → `InvalidInputPath`）—— 出处：spec §10.2.5 的 1b 步
- **`boundary` 的唯一源 = policy 定义层**（`patternRegistry.boundaryBySeat`）；`reviewer-audit` / `detective-observer` / `senior-sdet` 的席 JSON **不存** `boundary`，只有 `evidence-reader` 自带句留 JSON —— 出处：spec §10.2.2 `:88`（T3 补登）
- **`CARD_KEYS` 住叶模块 `components/cardKeys.mjs`**，`cardPipeline.mjs` 只 re-export（切断 `agentData → seatLoader → cardPipeline → agentData` 的初始化环）—— 出处：spec §10.2.1 新行、T2-补 commit `7389726`
- 行号守卫的「结构替换豁免」白名单只许**增条目**不许删；每条带「生效日期 + 迁往」，新增须在 plan 执行记录点名 —— 出处：`skills/managing-lessons-store/scripts/lessons.test.mjs:1765-1770`
- `baseline 38/38` **不作判据**（同式自除恒真）；`agents/*.md` 是生成物，只走 `draft` → `replace`，禁止手改 —— 出处：PRD V4 `:66`、plan Global Constraints `:27-28`

## 遗留裁决与留观项

- **`acceptance/replace-scenarios.mjs` 实测 9/11 红**（既有债；T3 已把 `DATA` 改指席 JSON，`:196` / `:219` 注入句在数据里 0 命中）—— 来源：spec §10.2.9 `:181`；收敛时机：**下次修该验收脚本时**，本段不动。
- **`check-plan.mjs coverage` 判不了本 PRD**（`--stage` 硬正则 `^S\d+$`，`scripts/check-plan.mjs:243`；本 PRD 阶段是 `S-A`/`S-B`/`S-C`）—— 来源：`②→③@S-A` 门行；用户 2026-11-03 裁定「只在交接/门行里记，**不建** `docs/after`」；触发 = **S-B 的计划门**（同形态必再撞）。
- **`dev-workflow-counts` 的 TC-E05 构造 A 已退役**（数据层「`SEAT_ORDER` ↔ 文件集恰等」使「有卡无登记」不可构造），新路径由 `sa-data-layer.test.mjs` 的 TC-035 覆盖（缺席 / 多出 → `InvalidInputPath` 并点名）—— 来源：plan 执行记录 T3 行；收敛时机：若 S-B 恢复该构造，再补。
- **plan 指纹链**：提交态 = `F0D446D3409B5A5D62079F0AB6B258940A140B8233BDD5EFEEA4BA0657F85060` / 1067 行；若 T4 施工中改了 plan（如补 Step 或执行记录），按 R10② 重记 `②→③@S-A` 门行指纹并 touch 清单 —— 来源：gate-record `②→③@S-A` 行。
- **T6 的 `③→④` / `④→⑤` 门行尚未出现**（gate-record 现只有 `②@S-A` / `②→③@S-A` 两行）—— 来源：`skills/dev-workflow/references/gate-record.md` 表；收敛时机：T6 收口。

## 开工前先做

1. `git --no-optional-locks status --short`（应**为空**）+ `npm run check`（记 `# tests` 与末行；本交接基线 `1426 / 1424 / 0 / 2`、`14:12:04–14:13:59`）+ `node tools/docgen/cli.mjs gate`（`baseline 38/38`）。
2. 读 plan `:663-789`（T4 全节）+ spec `:22-23`（R4 / R5）+ testcase `:170` / `:291-336`。
3. 核现状（应均为「未开工」）：`tools/docgen/card-model/enums.mjs:86` 的 `CARD_TEXT_FIELDS` **无** `description`；`validateCardModel.mjs:102` 的 `surfaceTexts` **无** `description` 分支；`card-model.test.mjs:1125` / `:1131` **仍是 `green`**、`:1141` 仍断 8 键。
4. 开 T4：按 Step 1 先写失败测试（TC-022 / TC-023 / TC-009 / TC-020+021）→ Step 2 跑红（`TC-009` 与 `TC-020` 两处）→ Step 3 两处同批改 → Step 4 改两条冻结断言（`:1141` 不动）→ Step 5 跑绿 + `gate` exit 0 → Step 6 `npm run check` + commit。
5. 收尾同 T2/T3：若动了 plan / spec / testcase / gate-record → 重算指纹、重记 `②→③@S-A` 门行、重 touch `impact-sheet.md`。

## 开场话术

读 `docs/handoffs/2026-11-03-s-a-description-scan-t4.md`，按交接词继续：从 T4 开工 `description` 进文本扫描面 + 三条冻结断言同批改写。
