# Session 交接：retro-skills → 可观察判据与卡面表达重构（2026-10-31）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-31 20:31（Asia/Shanghai，`Get-Date` 实跑） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `d1e9b3f`；工作树：**仅 1 项未跟踪** = `docs/prd/20261031202331-observable-criteria-rollout/`（新 PRD，未提交） |
| 验证基线 | 2026-10-31 **20:29 本次实跑**：`npm run check` → `# tests 1166` / `# pass 1164` / `# fail 0` / `# skipped 2`、`baseline 37/37`、`④ markdown 检查通过（345 个文件 / 1499 张表）`、`⑤ .session 结构检查通过`、`⑥ … findings 0` 且豁免行 `卡面 findings 0 / 告警 0 / 阻断 0`、末行 `check 全部通过`（exit 0）；`node tools/docgen/cli.mjs gate` → `baseline 37/37`；`node scripts/check-gate-record.mjs` → `rows 37 bad 0` + `gate-record ok（R1/R2/R6 全过；splitting 0）`；`node scripts/scope-sweep.mjs --check` → 18 口径 `counts`（`I15:7 I16:7 I17:1 I18:2 I19:6`）+ `sweep ok`（exit 0）；`node scripts/doc-name.mjs --check docs` → `命名检查通过（docs）` |
| 继任自 | `docs/handoffs/2026-10-31-post-s4-backlog.md` |
| 状态 | **可直开工**（有 1 个开工第一问 + 6 项待确认，见「开放问题」） |

## 项目定位

`d:\Seed\retro-skills` —— AI 协作工作流的规则 / 技能 / 机械判据仓库（五段主干 ①PRD → ②spec+testcase → 计划门 → ③实现 → ④质量 → ⑤交付；`npm run check` 是唯一总门禁）。

## 现状

- **已完成（本 session 三个提交，已进 git）**：
  - `3e4ce26` —— K-8/K-9 接线：`scripts/check-all.mjs` ⑥ 段的卡面 findings 由硬编码 `[]` 改为 `cardPipeline.collectCardFindings()` 逐席实算，**阻断非空 → `check` exit 1**，删行末「（S1 未上线：非达标证据）」；卡面路径收口到 `baseline.cardPathOfSeat()`；`checkall.test.mjs` 补 3 条断言。含代码审查 R1–R3（路径单源 / 装配错误即停 / 分支覆盖）。
  - `d1f8f7c` —— 文档口径落位：S3 spec `:130`/`:171` 与 S3 testcase H45 加 2026-10-31 日期注（原文保留）、S4 spec §7⑤ 补 `cardPathOfSeat` 与「装配错误即停」、`docs/after/…s4-open-items.md` 删 S4-L5（闭合）。
  - `d1e9b3f` —— PRD 状态回填（`agent-card-contract` §0.0 `:30` / §8 `:522` 日期注）+ 探索稿改标「已被 PRD 取代」并把 V-8 点名的 4 处结论改为指针。
- **已落盘未提交（本 session 唯一未跟踪项）**：[`docs/prd/20261031202331-observable-criteria-rollout/index.md`](file:///d:/Seed/retro-skills/docs/prd/20261031202331-observable-criteria-rollout/index.md) —— **198 行**，待评审（未定稿）。
- **验证证据**：见元信息表『验证基线』（单源，此处不重复）。
- **提交状态**：新 PRD **未提交**；由用户决定提交时机（建议评审前先 commit 留基线，见开放问题 8）。
- **工作树异常**：无（唯一未跟踪项即上述 PRD 目录）。

## 过程记录

- `.session/reviews/2026-10-31-1756-k8-k9-wiring/impact-sheet.md`（本 session 的 R8 当次清单；**先读 §四 代码审查修复与 §五 验证**）
- `docs/prd/20261031202331-observable-criteria-rollout/index.md`（本 session 产出的需求件；**先读 §0.3 事实基线 9 项与 §7 待确认 D-01～D-06**）
- 历史交接词：`docs/handoffs/2026-10-31-agent-card-s4-quality.md` → `docs/handoffs/2026-10-31-post-s4-backlog.md` → **本文件**

## 本次任务

按五段正规流程推进「可观察判据与卡面表达重构」（把抽象/主观/模糊的话翻译成可观察判据，并让 agent 卡 / rule / skill 复用同一套）；流程：**① PRD 评审与签字（议会 + 用户）→ ② spec + testcase（testcase 由独立 `senior-sdet` 编写）→ 计划门（审计）→ ③ 实现（S1→S2→S3）→ ④ 质量 → ⑤ 交付**；起点：**① 段评审**（PRD 已落盘、未签）。

## 范围依据

- 要读（按顺序）：
  - `docs/prd/20261031202331-observable-criteria-rollout/index.md` 全文（重点 §0.2 的 A-1～A-4、§0.3 的 9 项基线、§0.6 的 C-1～C-4、§3 核心模型、§6 F-01～F-10、§7 D-01～D-06、§8 S1～S3、§9 V-1～V-11）
  - `docs/prd/20261026205821-agent-card-contract.md` 的 §3.7 `:219-241`（卡面契约现状）与 §6 F 表 `:460-489`
  - `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md` §5.1 `:121-145`（卡面 7 段 × 必渲染字段）、§9 `:197-208`（V-1～V-8）
  - `tools/docgen/components/renderCard.mjs`（要改的落点：`mustTable` `:18-27` / `neverTable` `:29-36` / `checkTable` `:38-45`）
  - `tools/docgen/templates/agent-card.md.tpl`（7 段模板，含要修的两句节首）
  - `tools/docgen/card-model/vocab/predicates.mjs` `:5-14`（8 条判据 label）与 `vocab/subjective-terms.mjs`（5 词表）
  - `tools/docgen/test/card-render.test.mjs` 的 `:895`（共享句必须被渲染，用 criterion 子串）、`:1209-1236`（G05 P-B 扫描）、`:1241-1257`（`pbMissing` 行键 = id）
  - `skills/dev-workflow/references/gate-record.md` `:21-47`（既有门行体例，新 PRD 的 ① 行照此写）
- 勿重做：
  - K-8/K-9 接线（`3e4ce26`）与文档状态清理（`d1e9b3f`）——已完成
  - **S6 边界三处**（`producer` 档 / `S5-B` / 死路径 `tools/docgen-spike/.tmp-test/`）——按 PRD §0.6 C-3 **另批**，本任务不碰
  - `tools/docgen/policy/**`（S6 已签，零改动）
  - 已签 S4 spec / testcase / plan 原文（只许「日期注 + 现行判据块」）

## 开放问题

1. **【开工第一问】① 段走议会，还是跳过直接让用户签？** 推断：**走议会**——依据 `rules/dev-workflow-mainline.md` R3（① 段议会记录非空为硬判据；跳过即违例，需在 PRD §0 记例外）；请用户：确认走议会 / 或指定跳过并授权我在 PRD §0 记例外句。
2. **D-01 卡面句式**：短指令句（A）vs 更口语（B，允许一句解释）；推断 **A**（B 会滑向散文，违零散文）。请确认。
3. **D-02「前提」为空时**：删 / 保留「前提：无」；推断 **删**（15 卡全空，保留是噪音）。
4. **D-03 三态行位置**：「一定会」段末 / 「输出格式」段；推断 **段末**。
5. **D-04 主观词初始词表**：沿用 5 词 / 扩到 ~10 词；推断 **扩**（每词必须带正反例）。
6. **D-05 豁免粒度**：行级白名单 / 引用标记；推断 **行级白名单**（显式可审计）。
7. **D-06 判据可观察化的做法**：新增码（36→37）/ 扩 `SubjectiveLabel` 判定面（0 新码）；推断 **扩面**（少改码表计数断言），但属判据级变更，需 ② 段确认。
8. **新 PRD 是否先 commit 留基线？** 推断 **是**（评审前先提交，便于 diff 与指纹；仓库 `②→③` 先例是 `git add -N` 留基线）。

## 既定约束（不要重新讨论、不要重新选型）

- **卡面不放 id**；id 只在数据层 / `dump` / README 覆盖表 —— 出处：PRD §0.2 A-1（用户 2026-10-31 裁定）。
- **卡面写成可执行语句**（中文语义、无英文键名、无空列）—— 出处：PRD §0.2 A-2。
- **复用形态 = 规则 + 判据清单 + 校验器；不新建 agent 席位** —— PRD §0.6 C-1。
- **skill 先不建**，同一流程复用 ≥2 次后再抽 —— PRD §0.6 C-2。
- **S6 边界三处另批** —— PRD §0.6 C-3（`tool-tiers.test.mjs:264` 断「`producer` 档」；`paths.mjs:18` 计入 23 条路径计数）。
- **id 锚点改行序号对账**，并用「宾语≠落点」合成卡证明落点被渲染 —— PRD §0.6 C-4。
- **五段顺序与出口签字** —— `skills/dev-workflow/references/gate-record.md`（R1/R2/R3）。
- **写 spec 必须同批产出 testcase，由独立 `senior-sdet` 在全新上下文编写** —— `rules/spec-testcase-gate.md`。
- **R8 回扫用裸命令** `node scripts/scope-sweep.mjs --check`（**禁用** `npm run doc:sweep -- --check`）。
- **`gate` 的 `baseline 37/37` 一字不变；`docs/agents/**` 只由 `node tools/docgen/cli.mjs generate --readme --apply` 落盘**（15 席 + index = 16 份）。
- 卡面段清单 = 6 段 + 第 7 段「输出格式」（单源 `tools/docgen/card-model/vocab/card-must-fields.mjs`）。

## 遗留裁决与留观项

- **S6 边界三处**（档位 id 中文化 / `S5-B` 换表述 / 删死路径）—— 来源：PRD §0.6 C-3 与 §2「不做」；收敛时机：S6 另批。
- **测试里两处 id 锚点**（`card-render.test.mjs:895`、`:1241-1257`）—— 来源：PRD §0.3-8；收敛时机：本任务 S2。
- **P-A 统一扫描命令 / O-12 `registeredIds` 单源 / S4-L1～L4 / P2-4 / P2-5** —— 来源：`docs/after/` 各自文件；与本任务无关，**勿在本批顺手改**。
- **拆分的「订单」口径**：S1 清单+校验器 / S2 卡面重构 / S3 判据与复用 —— 来源：PRD §8；收敛时机：② 拆 spec 时按此三份对应。

## 开工前先做

1. `git status --porcelain`（应只见 `?? docs/prd/20261031202331-observable-criteria-rollout/`）+ `git log --oneline -1`（应 `d1e9b3f`）；复跑元信息表『验证基线』五条命令，数值应逐项相同。
2. 读 `docs/prd/20261031202331-observable-criteria-rollout/index.md` 的 §0.3（9 项基线，逐条照抄命令复算）与 §7（D-01～D-06）。
3. 向用户确认开放问题 1（① 走议会 / 跳过）与 D-01～D-06；确认后把答案回写 PRD §7 的「状态」列（`[待确认]` → `[已确认]`/`[已决·代裁]`）。
4. 若走 ①：开 `parliament` 技能评审 PRD，按结论修订；若跳过：在 PRD §0 记例外句（授权人 + 日期 + 理由）。
5. ① 签字后进 ②：先派独立 `senior-sdet`（全新上下文）写 testcase，与 spec 同批落 `docs/superpowers/specs/2026-10-31-observable-criteria-rollout-design.md` 与 `…-design-testcase.md`。

## 开场话术

```text
读 docs/handoffs/2026-10-31-observable-criteria-rollout.md，按交接词继续：先定 ① 段走议会还是跳过，并确认 PRD §7 的 D-01～D-06，然后进 ②（spec + testcase）。注意：新 PRD 未提交（docs/prd/20261031202331-observable-criteria-rollout/），工作树只应有这一项未跟踪。
```
