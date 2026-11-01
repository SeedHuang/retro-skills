# Session 交接：retro-skills → S1 计划门与实现（2026-11-01）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-01 11:24（Asia/Shanghai，`node skills/review-log/scripts/time.mjs` 实跑） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `4bdb0ef`（`docs: 更新可观测判据相关文档，剔除「完整」主观词并调整基线为21行`）；工作树 **clean**（`git status --porcelain` 空） |
| 验证基线 | `npm run check` → `# tests 1166` / `# pass 1164` / `# fail 0` / `# skipped 2`、`baseline 37/37`、`0 findings`、`④ markdown 检查通过（348 个文件 / 1522 张表）`、`⑤`/`⑥` 在位、末行 `check 全部通过`；`node scripts/check-gate-record.mjs` → `rows 39 bad 0` + `gate-record ok（R1/R2/R6 全过；splitting 0）`；`node scripts/scope-sweep.mjs --check` → 18 口径 `counts`（I1:13 … I19:6）+ `sweep ok`；`node scripts/doc-name.mjs --check docs` → `命名检查通过（docs）`；`node tools/docgen/cli.mjs gate` → `baseline 37/37`（**2026-11-01 11:22–11:24 实跑**） |
| 继任自 | `docs/handoffs/2026-10-31-observable-criteria-rollout.md` |
| 状态 | 可直开工（1 个开工第一问，见「开放问题」） |

## 项目定位

`d:\Seed\retro-skills` —— AI 协作工作流的规则 / 技能 / 机械判据仓库（五段主干 ①PRD → ②spec+testcase → 计划门 → ③实现 → ④质量 → ⑤交付；`npm run check` 是唯一总门禁）。

## 现状

- **已完成（本 session，均已进 git）**：
  - **① 段（PRD）**：议会 #1（reader / audit / product / backend / qa / ai 5 席 + 侦探）出 **60 卡 → 19 族**，P0 9 族全部治本返工；PRD 定稿 **347 行 / `7EA85F9ECCA02AFEBCE6004E9B6BA9C8F58055F4808DEB7A54CA5F9E32AD9078`**；用户 2026-10-31 签「通过，签字」；门行 `gate-record.md` 的 `①@observable-criteria-rollout` 已落。
  - **② 段（S1 spec + testcase）**：议会 #2（qa / backend / ai / audit）出 **45 卡 → 12 族**，P0 11 卡全返工；spec **237 行 / `84012AA4FA1F60CDD22ED4F2309A727FFFA0952CFC37FC7868BE964B4C2ECF95`**、testcase **248 行 / `BEE801E52DD7C9E30A36402CBA4E59544BBD85ADF8D72591A778FEEB85A09B58`**（**78 条** = 正 31 / 负 34 / 边界 13）；审计两表「过 / 通过」→ 门行 `②@observable-criteria-rollout` 已落（签字人 = 审计）。
  - **三步口径修正（用户 2026-11-01 裁定「不要靠豁免，能修就修」）**：词表 **10 → 9**（剔 `完整`）、**标题行 `^#+ ` 不参与判定**、基线 **77 → 21 行**（`M+P+L=21`、`L ≤ 8`）；审计**增量复签**维持 ②「过」。落点见 `gate-record.md` ②行的「增量登记（2026-11-01）」段。
- **验证证据**：见元信息表『验证基线』（单源，此处不重复）。
- **提交状态**：本 session 的四件（PRD / gate-record / S1 spec / S1 testcase）已由用户 commit 为 `4bdb0ef`（`git show --stat 4bdb0ef` → 4 files, `218 insertions(+), 203 deletions(-)`）。
- **工作树异常**：无。

## 过程记录

- `docs/prd/20261031202331-observable-criteria-rollout/index.md`（**先读 §0.3 事实基线（含 #6b/#6c 与 21 行口径）、§3.3、§3.4、§8、§9**）
- `docs/superpowers/specs/2026-10-31-observable-criteria-rollout-design.md`（**先读 §9.3 分诊表、§4 判定与前置断言、§10 D1–D27、§11 Q1–Q24**）
- `docs/superpowers/specs/2026-10-31-observable-criteria-rollout-design-testcase.md`（**先读 §0 常量 1–18、§1 覆盖总表、§10 冲突登记（五条已闭合）**）
- `.session/reviews/2026-10-31-204101-observable-criteria-prd/`（议会 #1 账本：`progress.md` / `problems.md` / `cards.md` / `detective.md` / `round-check.md` / `delivery-audit.md` / `impact-sheet.md`；**先读尾部的终验与增量节**）
- `.session/reviews/2026-10-31-221813-observable-s1-spec/`（议会 #2 账本；同上；**先读 `round-check.md` / `delivery-audit.md` 的「增量复签（2026-11-01）」**）
- 门行：`skills/dev-workflow/references/gate-record.md` 的 `①@observable-criteria-rollout` 与 `②@observable-criteria-rollout`（含各自的 P2 与增量登记）
- 历史交接词：`docs/handoffs/2026-10-31-observable-criteria-rollout.md` → **本文件**

## 本次任务

按五段正规流程继续「可观察判据与卡面表达重构」的 **S1 块**：先过 **②→③ 计划门**（审计签），再做 **③ 实现 S1**（清单 JSON / 校验器 / 21 行分诊 / 规则文档 / ⑦ 段接入），然后 ④ 质量 → ⑤ 交付；S2 / S3 按块滚动，**不得提前拆**（R6）。流程：计划门 → ③ → ④ → ⑤；起点：**计划门**（PLAN 落盘约定 = `docs/superpowers/plans/2026-11-01-observable-s1.md`）。

## 范围依据

- 要读（按顺序）：
  - spec `§1` 范围（做/不做各 5 行）、`§3` 清单 JSON（C-1～C-6，**`terms.length = 9`**）、`§4` 校验器（判定 1–5 / P-1～P-4 / `evaluateText` / 退出码 0/1/2 / **标题行 `^#+ ` 不参与**）、`§5` 豁免（E-1～E-6 / E-5b / 示例锚地址）、`§6` 规则文档（≤120 行 + 复制判据）、`§7` ⑦ 段接入（**不可旁路 + 批内落地顺序**）、`§8` R8 表（**含 `baseline.mjs` 登记 37→38**）、`§9.1/9.2/9.3`（**21 行分诊：`M+P+L=21`、`exemptedLines=L`、`L ≤ 8`**）
  - testcase `§0` 常量 1–18（**实现要照它写，常量 16 = 禁自递归、常量 17 = 复制判据唯一实现点**）、`§1` 覆盖总表
  - PRD `§8`（S1 可交付件四件：清单 JSON / 校验器 / `rules/observable-criteria.md` / 21 行豁免清单）、`§3.3`（词表与标记表口径）、`§9.2`（V-4/V-5/V-10）
  - `skills/dev-workflow/references/gate-record.md` 的 ②行「增量登记」段（三步口径 + 现值指纹）
- 勿重做：
  - ① 段（PRD 已定稿签字）与 ② 段（spec + testcase 已签 + 增量复签）——**不改结论，只许在 ③ 段按 spec 施工**
  - S2（卡面重构）/ S3（`predicates` 与 inspector 接线）——按 PRD §8 顺序，本块不碰
  - S6 边界物料（`producer` 档 / `S5-B` / 死路径串）——PRD C-3 另批
  - `tools/docgen/policy/**`（S6 已签，零改动）

## 开放问题

1. **【开工第一问】② 段门行 P2-① 的「侦探本轮未开」要不要在 ③ 之前补一次行为核对？** 推断：**不补**——依据：议会行为核对的对象是「答辩过程账」，已在 `problems.md` 固化；③ 结束时 ④ 段会做 sdet + 审计核（②行已把触发写成「③ 段开工时补」，若直接进 ④ 等于把这个触发顺延到 ④）。请用户：确认不补 / 或要求 ③ 开工前补。
2. **③ 段是否把「17 行文案改写 + 分诊表落 `docs/reports/`」算作本块交付物？** 推断：**算**——依据 spec §9.3（分诊表是 ③ 段申报件、`M+P+L=21` 是 ④ 段对账源，`docs/reports/2026-10-31-observable-s1-triage.md` 已定落点）。请用户：确认 / 纠正。
3. **`rules/observable-criteria.md` 由本块直接写还是走 `rule-writer` 起草？** 推断：**本块直接写 + 过 `rule-inspector` 体检**——依据 spec Q3。请用户：确认 / 纠正。

## 既定约束（不要重新讨论、不要重新选型）

- **词表定稿 9 词**（自省 / 客观 / 诚实 / 宽松 / 严格 / 清晰 / 准确 / 显著 / 良好；`完整` 已剔除，`合理`/`充分` 归 `criterionTerms`）—— 出处：PRD `:155` + spec §2 `:23`
- **标题行 `^#+ ` 不参与判定；围栏代码块内行不参与** —— 出处：PRD `:157` 日期注 + spec §4 `:71`
- **基线 = 21 行，`M+P+L=21`、`exemptedLines=L`、`L ≤ 8`；豁免只许「术语引用 / 词表自身」且 `reason` 写术语出处** —— 出处：spec §9.3 `:164-176` + Q24
- **扫描面分期：S1 只扫 `rules/` + `skills/`；卡面与 `predicates` 留 S3** —— 出处：PRD C-6
- **hit 单位 = 行**（一行多词仍 1 条，`terms` 逗号串）；`--json` = `{scanned: string[], hits:[{path,line,terms}], exemptedLines, stale, ok}` —— 出处：spec D19/D21/Q5
- **`--root` 只换扫描根；清单/豁免默认从仓根读，否则 `--terms` / `--exempt`** —— 出处：spec D22
- **测试不得 spawn `npm run check` / `check-all`（自递归）；PS 只作记录不作断言源** —— 出处：spec Q21/Q19 + testcase 常量 16
- **新规则必须登记 `tools/docgen/components/baseline.mjs` + `baseline --write`（37 → 38）** —— 出处：spec §8 `:143`
- **⑦ 段不可经 `CHECK_BYPASS` 旁路；批内落地顺序 = 改文案 → 豁免到 exit 0 → 填分诊表 → 接 ⑦ → 跑 check** —— 出处：spec §7
- **`E-5b` 到期（365 天）S1 不实现，触发日 `2027-11-01` 落 `docs/after/`** —— 出处：spec D12/D20
- **五段顺序与出口签字** —— `skills/dev-workflow/references/gate-record.md`（R1/R2/R3）
- **R8 回扫用裸命令** `node scripts/scope-sweep.mjs --check`（**禁用** `npm run doc:sweep -- --check`）

## 遗留裁决与留观项

- **侦探未开（② 段）** —— 来源：`gate-record.md` ②行 P2-①；收敛时机 = ③ 段开工或 ④ 段行为核对时
- **`agent-card-contract` PRD `:271` 的 5 词锚** —— 来源：PRD §2.1；收敛时机 = ③ 段同批加日期注（改引用，原文保留）
- **S4 渲染 spec 的「现行判据块 + 日期注」** —— 来源：PRD C-7 / §2.1；收敛时机 = **S2**（不是本块）
- **句式参照实现 `tools/observation-check/render.mjs:79-88`** —— 来源：议会 #1 候选（`problems.md` §六）；收敛时机 = 写 S2 spec 时若句式冲突再登记差异表
- **`card-model.test.mjs:350-355` 改「从 JSON 派生 + 交集空」** —— 来源：spec §8 `:141`；收敛时机 = ③ 段同批
- **豁免审批写入门行备注的具体格式** —— 来源：议会 #1 候选；收敛时机 = ③ 段首次新增豁免时

## 开工前先做

1. `git status --porcelain`（应为空）+ `git log --oneline -1`（应 `4bdb0ef`）；复跑元信息表『验证基线』五条命令，数值应逐项相同（`1166/1164/0/2`、`rows 39 bad 0`、`sweep ok`、`baseline 37/37`）。
2. 读 `docs/superpowers/specs/2026-10-31-observable-criteria-rollout-design.md` 的 §9.3（21 行分诊与对账式）与 §4（判定 1–5 / P-1～P-4）；读 testcase §0 常量 1–18。
3. 读 `skills/dev-workflow/references/gate-record.md` 的 `②@observable-criteria-rollout` 行（含「增量登记（2026-11-01）」：三步口径 + 三件现值指纹）。
4. 写 plan 到 `docs/superpowers/plans/2026-11-01-observable-s1.md`（Task 粒度建议：清单 JSON → `evaluateText` → CLI/退出码 → 前置断言 → 豁免 → 分诊 21 行 → 规则文档 → baseline 登记 → ⑦ 段接入 → 派生改造 + `card-model.test.mjs`），送**计划门**（审计签，三条：覆盖 / 依赖无环 / 功能块↔testcase 映射）。
5. 计划门过后进 ③：先按 spec §7 的**批内落地顺序**做（先改文案/豁免到 `--check` exit 0，再接 ⑦ 段）。

## 开场话术

```text
读 docs/handoffs/2026-11-01-observable-s1-plan-gate.md，按交接词继续：先过 S1 的 ②→③ 计划门（写 plan 到 docs/superpowers/plans/2026-11-01-observable-s1.md 并送审计），再过 ③ 实现 S1（清单 JSON / 校验器 / 21 行分诊 / rules/observable-criteria.md / ⑦ 段 + baseline 37→38）。注意：① ② 两段已签字、三步口径（9 词 / 标题不扫 / 21 基线）已获审计增量复签，不要重开；开工第一问见交接词「开放问题」1。
```
