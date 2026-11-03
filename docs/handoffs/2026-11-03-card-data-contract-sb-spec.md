# Session 交接：retro-skills → 补 ① 门行 + 起 S-B 契约层 spec（2026-11-03）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-03 18:53（本机时区，Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `d375bdf`（`docs(dev-workflow): S-A ⑤ 段交付终签（⑤@S-A）+ S-A-Q-7 落 after`）；工作树：**clean**（`git status --porcelain` 本次实跑无输出） |
| 验证基线 | typecheck 无（本仓无 typecheck）/ build 无（无构建）/ unit `# tests 1439 / # pass 1437 / # fail 0 / # skipped 2` + `node tools/docgen/cli.mjs gate` → `baseline 38/38` + `node scripts/check-gate-record.mjs` → `rows 62 bad 0` + `node scripts/scope-sweep.mjs --check` → `sweep ok`（33 口径与基线逐项相同）+ `④ markdown 387 文件 / 1646 表` + `[observable] 107 .md / 未豁免 0 / 已豁免 6 / stale 0` + 末行 `check 全部通过`（`18:52`–`18:53` 实跑 `npm run check` **3 次**：第 1 次 `# fail 1`、第 2/3 次 `# fail 0`，见「开放问题」第 3 条） |
| 继任自 | `docs/handoffs/2026-11-03-s-a-data-layer-impl.md`（S-A 施工期交接词） |
| 状态 | **可直开工**；有 3 个开放问题（见「开放问题」节），**第 1 问是开工第一问** |

## 项目定位

`d:\Seed\retro-skills` —— 一套「规则 / 技能 / 角色卡生成器」仓库：`rules/` 与 `skills/` 写方法与判据，`tools/docgen/` 把组件数据渲染成 `agents/*.md` 15 张角色卡，`scripts/check-all.mjs` 是总门禁（七段 + `[observable]`）。

## 现状

- **已完成（S-A 数据层五段全闭环）**：
  - 门账：`skills/dev-workflow/references/gate-record.md` 五条行全签「过」——`②@S-A`（`:81`）、`②→③@S-A`（`:82`）、`③@S-A`（`:83`）、`④@S-A`（`:84`）、`⑤@S-A`（`:85`）。
  - 交付物（均在 `tools/docgen/` 下）：`data/shared.json` + `data/seats/<seat>.json` ×15；`components/seatLoader.mjs`（104 行，唯一读盘与装配点）；`components/cardKeys.mjs`（12 键叶模块，破 TDZ 环）；`check-shared-refs.mjs`；`components/agentData.mjs` 降为 9 行薄壳；`components/validateAgentData.mjs` 追加 4 码（`DanglingSharedRef` / `EmptySharedValue` / `NestedSharedRef` / `CardKeySetMismatch`）；`card-model/enums.mjs` + `card-model/validateCardModel.mjs` 纳入 `description` 扫描面；`policy/definitions/paths.mjs` 删 3 项 Q8 路径。测试：`tools/docgen/test/sa-data-layer.test.mjs`（35 个 test 块）。冻结基线：`docs/reports/2026-11-03-s-a-card-sha-baseline.md`（15 席 SHA 15/15 相等）。
  - 三件已签件（现值）：spec `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md` 240 行 / `DD2FD00361B4BD8C21DA461F99B8F0B76F4B92E9A97EA7459DB63B6429D26D74`；testcase 718 行 / `0F14D6FFACE2E5B5A8989B7899282075FF8B44AFA292D9B29A49B21E1AE88ED7`；plan 1093 行 / `FCAE6F64E7BCACAE457219860E172787435B1A500917115663EC241B72CC5640`（三处现值的唯一记账处 = `gate-record.md:81` 与 `:82` 的「签后增量登记」段）。
  - 未完成项：**7 条**，全部在 `docs/after/20261103164513-s-a-quality-open-items-open-decisions.md:10-16`（S-A-Q-1…S-A-Q-7，每条「现状 / 触发 / 该做 / 谁兜」四列齐）。
- **验证证据**：见元信息表『验证基线』（单源，勿在此重复）。
- **提交状态**：**已 commit**（14 个 commit：`0a7cd63`（T1）→ `91a3771`（T2）→ `7389726`（T2-补）→ `23df99b`（T3）→ `c8a5ccb`（T4）→ `c01ccf3`（T4-补）→ `4ee7baf`（T5）→ `a997211`、`4b82a74`（T5-补）→ `0bb0a33`（T2 交接件）→ `0ddde8d`（T6）→ `0691935`（T6 审查 3 条）→ `4a05cd9`（④ 补测）→ `9e90081`（④ 门行）→ `e147ecd`（⑤ C1–C4 闭合）→ `d375bdf`（⑤ 门行））；均为主 agent 按「每任务一 commit」提交。
- **工作树异常**：无（`git status --porcelain` 空）。但基线实跑出现过 **1 次 `# fail 1`**（第 2/3 次复跑即绿），见「开放问题」第 3 条。
- **未闭环一处（本次新发现，是本任务的起点）**：`gate-record.md` **没有 `①@card-data-contract-and-proof` 行**——`Grep '20261102212627|card-data-contract'` 于该文件 **0 命中**，全表 `①` 行只有 `:11`（dev-workflow-mainline）、`:21`（agent-card-contract）、`:48`（observable-criteria-rollout）。而该 PRD 的 ① 段证据其实存在：议会 r1 账本 `.session/reviews/2026-11-02-221257-card-data-contract-prd/`（`problems.md` 末尾「**已修 30 + 关闭 2 + 候选 0 + 升级 0 + 带往下轮 0 = 32**（= `cards.md` 卡数 32）」，修复载体 = PRD 115 行 / `C7D5925B…F85C3`，复核轮 r2）。→ 这是**门账补登**，不是重做评审。

## 过程记录

- `skills/dev-workflow/references/gate-record.md`（**先读 `:81`–`:85` 五条 S-A 行 + `:87`–`:101` 各列口径**；R1/R2/R6 由 `node scripts/check-gate-record.mjs` 机判）
- `.session/reviews/2026-11-03-082100-s-a-spec-parliament/`（② 段议会：1 评审轮 + 3 次复核；终态对账 `problems.md:97`、终判 `:99`）
- `.session/reviews/2026-11-03-s-a-plan-gate/plan-gate.md`（计划门三轮 400 行）+ 同目录 `impact-sheet.md`（**R8 唯一当次清单**，已 touch 29 次，`§八` 是本段最后一次）
- `.session/reviews/2026-11-03-1626-s-a-quality/quality-4.md`（sdet 200 行）+ `quality-4-audit.md`（审计 240 行，含 `§7` 复核轮）
- `.session/reviews/2026-11-03-1654-s-a-delivery/delivery-5.md`（⑤ 段审计表，含 `§2b` 全量 53 文件清单与 `§6` 复核轮）
- `.session/reviews/2026-11-02-221257-card-data-contract-prd/`（**PRD 议会账**：`cards.md` 32 卡 / `problems.md` 尾 / `round-check.md` / `delivery-audit.md` / `submission.md`）—— 补 `①` 门行的证据位在此
- 历史交接词（链式）：`docs/handoffs/2026-11-03-s-a-spec-parliament.md` → `2026-11-03-s-a-loader-t2.md` → `2026-11-03-s-a-description-scan-t4.md` → `2026-11-03-s-a-data-layer-impl.md` → `2026-11-03-s-a-quality.md`（若存在）→ 本件
- ⚠️ `.session/` 不进 git：换机器 / 重新克隆后上述评审账全部消失；`docs/after/…open-decisions.md:15`（S-A-Q-6）已登记这条风险

## 本次任务

先补 `①@card-data-contract-and-proof` 门行，再起 S-B 契约层 ② 段（spec + 独立 testcase）；流程：① 门行落行 → ② 写 S-B spec（`docs/superpowers/specs/2026-11-03-s-b-contract-layer-design.md`）→ 派 `senior-sdet` 独立写 `…-design-testcase.md` → 议会（② 是议会插点）→ ③ 计划门 → ④/⑤ 施工 → ⑥ 验收；**起点 = ① 门行**（S-A 五段已闭环）。

## 范围依据

- 要读：
  - `docs/prd/20261102212627-card-data-contract-and-proof/index.md` §8 `:131`–`:137`（依赖图 `S-A → S-B → S-C` + 三段边界表）、§8 `:143`–`:145`（「你要做哪段 → 读这些」表）、§2 D11 `:38`（策略归属）/ D14 `:41`（做法指向契约）/ D16 `:43`（三态承载面）、§3 Q3 `:52`（`categories` 复用）/ Q6 `:55`（policy 渲染粒度）、§4 V6 `:68`（引句真实性）/ V7 `:69`（映射非空心）/ V8 `:70`（卡面不内联清单）、§5 `:90`（`outputFormats['issue-card'].fields` 7 列 → 三列）
  - `skills/dev-workflow/references/stage-1-prd.md:8-30`（① 出口判据 / 谁签 / 申报-核对分工；`:12` 是「§0 四栏」判据、`:13` 是「清单 ↔ 流程图双向」判据）
  - `skills/dev-workflow/references/stage-2-tech-design.md`（② 段出口判据与谁签）
  - `rules/dev-workflow-mainline.md`（R1–R8 义务句；R3 议会只在 ①、② 两插点）
- 勿重做（S-A 已实现，文件级）：`tools/docgen/data/**`、`components/seatLoader.mjs`、`components/cardKeys.mjs`、`check-shared-refs.mjs`、`components/agentData.mjs`（薄壳）、`components/validateAgentData.mjs`（4 码）、`card-model/enums.mjs` + `validateCardModel.mjs`（`description` 扫描面）、`policy/definitions/paths.mjs`（Q8 三项已删）、`test/sa-data-layer.test.mjs`、`docs/reports/2026-11-03-s-a-card-sha-baseline.md`
- 勿改（已签三件）：spec / testcase / plan 三件现值见「现状」；要动它们必须回 ② 段重签并在 `gate-record.md` 做「签后增量登记」

## 开放问题

1. **【开工第一问】`①@card-data-contract-and-proof` 门行怎么写？** 出口判据是「§0 四栏齐 + 依据可核；功能点清单与流程图双向一一对应」（`stage-1-prd.md:12-13`），但本 PRD **无 §0**（只有 §1–§9，`Grep '^## '` = 9 个标题）、**无 F 编号功能点**（用 D1–D17 / Q1–Q8）、**无流程图**（§8 `:131` 只有 `S-A → S-B → S-C` 依赖图）。
   推断：按「判据换载体」登记并写明换载体由用户 2026-11-02 逐条裁定批准——功能点清单 = §2 D1–D17（17 行）+ §3 Q1–Q8（8 行）；流程图 = §8 `:131` 的三段依赖图；依据 = 议会 r1 账本 32 卡（已修 30 + 关闭 2）；§0 四栏改写为「问题 = §1 缺陷 1–8 / 用户 = §2·§3 各行的「依据」列 / 依据 = 议会账 + 用户原话 / 边界 = §6 不做 + §7 被否方案」。
   请用户：**确认**（照此落行）或 **纠正**（要求先补 §0 四栏再落 ① 行）。

2. **S-B 的 V6 语料现为 0 条**。PRD V6（`:68`）要求语料 = `docs/superpowers/reviews/**/observation-*.json` 的 `items[].evidence`，且 **fail-closed：扫到 0 条也 exit 1**。实查：该 glob 只命中 1 份 `docs/superpowers/reviews/2026-10-27-1200-migration-drill/observation-r3.json`，其 `items` 3 条**全无 `evidence` 键**（该文件 `:5-7` 逐条只有 `id` / `verdict` / `reason`）→ S-B 直接写 `check-quotes.mjs` 会恒 exit 1。
   推断：S-B spec 必须把「先产出 1 份含 ≥2 条 `evidence` 的真实观察记录（落 `docs/superpowers/reviews/<次>/observation-rN.json`）」写成施工第 1 步（该记录自身可复用作语料），而不是放宽 `fail-closed`。
   请用户：**确认**或指定另一份语料来源。

3. **S-A-Q-4 是否即刻升为必修？** 本 session 实跑 `npm run check` **3 次**，第 1 次 `# fail 1`（未留失败用例名，未捕获 `not ok` 行）、第 2/3 次 `# fail 0`。`docs/after/20261103164513-s-a-quality-open-items-open-decisions.md:13`（S-A-Q-4）自设触发线 =「再次出现（累计 ≥2 次即应修，不必等第三次）」，现已知同族至少 2 次（该条记录的 `S6-TC-D03` 1 次 + `S6-TC-D06` 1 次）再叠本次 1 次。
   推断：升必修，在 S-B 施工前修 `tools/docgen/test/support/dev-workflow-checks.mjs` 的 `withRepoCopy`（`cpSync` 失败重试一次，或把 `docs/agents` 改成按需拷贝）；修法二选一写进 S-B plan 的 Task 0。
   请用户：**确认升必修**或在 `docs/after` 该条注明「降级留观」。

## 既定约束（不要重新讨论、不要重新选型）

- 卡面 `agents/*.md` 是**生成物**，只能由 `node tools/docgen/cli.mjs generate` 产出，禁手改 —— `docs/superpowers/plans/2026-11-03-s-a-data-layer.md` 的 Global Constraints 末两条
- 12 键契约唯一源 = `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md:89`；loader 产出的 `agentData[i].card` 恒 **8 键**（12 键只在 `cardPipeline.buildOne` 派生）—— `2026-11-03` 计划门 P0-1 实测改判，落 `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md:20`/`:128`/`:135`
- `SCAN_FIELDS` 仍 **8 键**、`CARD_MODEL_CODES` 仍 **36 码零新增** —— PRD §5 `:84`
- `baseline 38/38` **不作判据**（同式自除恒真）；V4 只认 `gate` exit 0 + 15 席逐字节 —— PRD §4 V4 `:66` + 已签 S3 D-15
- `@` 只允许**单层**（`seats/*.json` → `shared.json`）；插值必须用函数替换或 `split/join` —— `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md` §10.2.3
- 议会只在 **①、②** 两个插点；计划门不设议会 —— `rules/dev-workflow-mainline.md` R3
- **三态 5 行只在 S-C 删**，不得在 S-B 顺手删（删了会撞 `s2-card-rewrite.test.mjs` 五处冻结断言）—— PRD §8 `:135` + `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md:228`
- 每任务一 commit，由 agent 直接提交 —— 用户 2026-11-03 裁定
- 改任一判据级口径后必须重 touch 当次 `impact-sheet.md` 再跑 `node scripts/scope-sweep.mjs --check` —— `rules/dev-workflow-mainline.md` R8 + `gate-record.md:94`

## 遗留裁决与留观项

- S-A-Q-1（`TC-028` 的 `TargetDrift` / `EvidenceInvalid` 无构造）—— 来源：`docs/after/20261103164513-…:10`；收敛时机：下次改 `tools/docgen/cli.mjs` 的基线 / replace 段
- S-A-Q-2（`TC-003③` 第二份 12 键探针缺位）—— 来源：同上 `:11`；收敛时机：下次改 `seatLoader.mjs` / `check-shared-refs.mjs` 的 import 面
- S-A-Q-3（`TC-026` 的 `...s` 前置注入面）—— 来源：同上 `:12`；收敛时机：下次改 `tool-tiers.test.mjs` 的 `S5-TC-D10` 或装配顺序
- S-A-Q-4（偶发 `withRepoCopy` `cpSync` ENOENT）—— 来源：同上 `:13`；**是否升必修见开放问题 3**
- S-A-Q-5（`quality-4.md:164`/`:179` 的「184 行」是时点快照，现 240 行）—— 来源：同上 `:14`；收敛时机：下次修订该结论表
- S-A-Q-6（`.session/reviews/2026-11-03-1626-s-a-quality/` 未归档，直迁会被 ⑥ 门禁判 `ArtifactMissing`）—— 来源：同上 `:15`；收敛时机：本批归档动作或用户裁定「不迁，长期保留」
- S-A-Q-7（`0bb0a33` 未在 plan 执行记录单列）—— 来源：同上 `:16`；收敛时机：下次修订该 plan
- ④ 段 8 行缺口表（`quality-4.md` §5）—— 其中 4 条已成 S-A-Q-1…4，其余 4 条按该表「谁兜」列执行

## 开工前先做

1. `git status --porcelain`（期望空）+ `npm run check`（期望 `# tests 1439 / # fail 0` + 末行 `check 全部通过`）；若出现 `# fail 1`，先按开放问题 3 判定是否即刻修
2. 读 `skills/dev-workflow/references/gate-record.md:81-101`（五条 S-A 行形态 + 各列口径），并对照 `:21` 的 `①@agent-card-contract` 行做落行样板
3. 读 `docs/prd/20261102212627-card-data-contract-and-proof/index.md` §8 `:127`–`:145` 与 `.session/reviews/2026-11-02-221257-card-data-contract-prd/problems.md` 末尾 20 行、`round-check.md` 的「第 3 项附」归类表，取 `①` 行的证据位（含 32 卡的终态对账行）
4. 落 `①` 行后**立即** touch `.session/reviews/2026-11-03-s-a-plan-gate/impact-sheet.md`（R8 的 `I11` scope，不 touch 则 `sweep` 报 `impact-sheet 早于被扫文件`），并在其 `§九` 写本次处置表
5. 跑 `node scripts/check-gate-record.mjs`（期望 `rows 63 bad 0`）+ `node scripts/scope-sweep.mjs --check` + `npm run check`，三条全绿后按「每任务一 commit」提交

## 开场话术

```text
读 docs/handoffs/2026-11-03-card-data-contract-sb-spec.md，按交接词继续：先补 ①@card-data-contract-and-proof 门行，再起 S-B 契约层 spec。注意：第 1 个开放问题是开工第一问，先跟我确认 ① 行按「判据换载体」写。
```
