# Session 交接：retro-skills → agent-card S4 收口后的 backlog（2026-10-31）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-31 17:31（Asia/Shanghai，`Get-Date` 实跑） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | 本交接文件首提交 = `47a3c9c`（其父 `b1d3996` = S4 ⑤ 段签字）；**若本文件随后有勘误提交，HEAD 以 `git log --oneline -1` 实查为准**。工作树 **clean**（`git status --porcelain` 输出为空，17:31 实查） |
| 验证基线 | 2026-10-31 **17:31 本次实跑**（本交接文件落盘后复跑，含本文件）：`npm run check` → `# tests 1163` / `# pass 1161` / `# fail 0` / `# skipped 2`、`baseline 37/37`、`④ markdown 检查通过（344 个文件 / 1481 张表）`、`⑤ .session 结构检查通过`、`⑥ 观察产物门禁 findings 0`、末行 `check 全部通过`（exit 0）；`node tools/docgen/cli.mjs gate` → `baseline 37/37`；`node scripts/check-gate-record.mjs` → `rows 37 bad 0` + `gate-record ok（R1/R2/R6 全过；splitting 0）`；`node scripts/scope-sweep.mjs --check` → 18 口径 `counts`（`I15:7 I16:7 I17:1 I18:2 I19:6`）、末行 `sweep ok（命中未超基线、清单齐、scope 齐）`（exit 0）；`node scripts/doc-name.mjs --check docs` → `命名检查通过（docs）` |
| 继任自 | `docs/handoffs/2026-10-31-agent-card-s4-quality.md`（上一份：④ 段质量开工） |
| 状态 | **有 1 个开工第一问**（下一批先做哪项，见「开放问题」）+ 1 个待取值项 |

## 项目定位

`d:\Seed\retro-skills` —— AI 协作工作流的规则 / 技能 / 机械判据仓库（五段主干 ①PRD → ②spec+testcase → 计划门 → ③实现 → ④质量 → ⑤交付；`npm run check` 是唯一总门禁）。

## 现状

- **agent-card S4 已整段收口**：`skills/dev-workflow/references/gate-record.md` 的 S4 门行 **`②`（`:42`）/ `②→③`（`:43`）/ `③`（`:44`）/ `④`（`:45`）/ `⑤`（`:46`）** 全部在位且六列齐；① PRD 主轴行在 `:11`。④ 签字 = 独立 `senior-sdet`（61 条逐条结论，`quality-4.md`）；⑤ 签字 = **用户**（原话「通过」，主 agent 转录，`portal` 见 `:46` 结论列）。
- **本 session 三个提交**：`7fd2c7b`（④ 段质量：`card-render.test.mjs` 12→61 块 + 8 处判据改判 + 代码审查 5 条修复 + R8 词表 `I15～I19`）→ `147c310`（闭合交付审计 C-1/C-2：plan 38 个 Step 全勾 + plan/testcase 指纹登记 + 新建 `docs/after/20261031165047-agent-card-s4-open-items.md` + PRD/testcase 两处锚勘误）→ `b1d3996`（⑤ 出口签字）。
- **④/⑤ 段证据（不进 git，仍在 `.session/`）**：`.session/reviews/2026-10-31-1320-agent-card-s4-quality/` 下 `progress.md`（裁定 + 申报 J-1～J-10 + ⑤ 结论）/ `impact-sheet.md`（R8 当次清单，18 口径 + 代码审查修复 5 行 + ⑤ 条件闭合 6 行）/ `quality-4.md`（sdet 61 条 v4）/ `quality-4-audit.md`（审计 v2）/ `delivery-5-s4.md`（交付审计 + 复核轮）。
- **已知限制已落 git**：`docs/after/20261031165047-agent-card-s4-open-items.md`（S4-L1 A06 中段可漏 / S4-L2 A02 删源条目静默重建 / S4-L3 gate 只点名首个 drift / S4-L4 `senior-sdet` 维度空 / S4-L5 K-9 触发未具名），每条四要素齐（限制原文 `path:line` / 漏检样例 / 谁人工兜 / 触发信号）。
- **遗留 P2（不阻断，出处 `delivery-5-s4.md` §H）**：`P2-4` — `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md:5` 与 `docs/superpowers/plans/2026-10-30-agent-card-s4-render.md:97` 仍留旧锚 `:473-476` / `:487`（已签件历史保留，映射已在 open-items 文末）；`P2-5` — testcase §7 缺口 10/11 有登记但缺触发信号（建议并入 open-items 作 S4-L6）。
- **验证证据**：见元信息表『验证基线』（单源，此处不重复）。
- **提交状态**：已 commit（`b1d3996`，见元信息表『HEAD』）。
- **工作树异常**：无。

## 过程记录

- `.session/reviews/2026-10-31-1320-agent-card-s4-quality/impact-sheet.md`（**先读 §二 改判清单 / §四 代码审查修复 / §五 ⑤ 条件闭合**）
- `.session/reviews/2026-10-31-1320-agent-card-s4-quality/delivery-5-s4.md`（交付审计；**先读 §G 结论行与 §H 条件/P2**）
- `.session/reviews/2026-10-31-1320-agent-card-s4-quality/quality-4.md`（sdet 61 条；§6 缺口 G-1～G-14）
- `.session/reviews/2026-10-31-1320-agent-card-s4-quality/progress.md`（裁定依据 + 申报表 J-1～J-10）
- `.session/reviews/2026-10-31-1200-senior-sdet-migration/impact-sheet.md`（③ 段批次的 R8 清单）
- 历史交接词：`docs/handoffs/2026-10-31-senior-sdet-migration.md` → `docs/handoffs/2026-10-31-agent-card-s4-quality.md` → **本文件**

## 本次任务

从 S4 之后的 backlog 里**选一项做完**（开工第一问先定项）；若选 **K-8/K-9 接线**（推荐，见开放问题 1），流程：
读登记（`docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md` §7⑤ `:183` / §10-D7 `:220`）→ 改 `scripts/check-all.mjs` 的 416–418 行（`cardFindings` 由硬编码 `[]` 改为实算 + 行末去掉「S1 未上线：非达标证据」）→ 同批补/改断言（`tools/docgen/test/` 内对应常驻测试）→ `npm run check` 全绿 → R8 回扫（若动到判据级口径）→ 删 `docs/after/20261031165047-agent-card-s4-open-items.md` 的 **S4-L5**（闭合即删条）。
起点：**开放问题 1 的裁定**。

## 范围依据

- 要读（按顺序）：
  - `docs/after/20261031165047-agent-card-s4-open-items.md` 全文（5 条限制 + 已闭合 2 条）
  - `scripts/check-all.mjs` 的 `:29`（import）、`:416-418`（`cardFindings` / `[豁免窗口]` 行）
  - `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md` §7⑤ `:183`、§10-D7 `:220`
  - `.session/reviews/2026-10-31-1320-agent-card-s4-quality/delivery-5-s4.md` §G/§H（交付口径与 P2）
  - `docs/after/20261031111000-senior-sdet-boundary-conflict-open-decisions.md` §六（**仅当选 S6-B**）
  - `docs/after/20261024174253-dev-workflow-mainline-open-items.md` 线 G（**仅当选死代码清理**）
- 勿重做：`tools/docgen/card-model/**`（S1 已签）、`tools/docgen/policy/**`（S6 零改动）、`tools/docgen/test/card-render.test.mjs` 的 61 块（④ 已签，改判据须回 ② 加日期注）、已签 S4 spec/testcase/plan 原文（只许日期注 + 现行判据块）、`docs/agents/**`（只由 `node tools/docgen/cli.mjs generate --readme --apply` 落盘）。

## 开放问题

1. **【开工第一问】下一批先做 backlog 里的哪一项？** 选项：(a) **K-8/K-9 接线**；(b) S6-B 结构收敛（按席排除禁写组 + 模板去「评审席」化）；(c) 死代码清理（`tools/docgen/components/renderAgent.mjs` 3275 B / `sharedBlocks.mjs` 1879 B）；(d) A02 每席 `must`/`never` 条数基线（S4-L2）；(e) `senior-sdet` 补 `dimension`（S4-L4）。
   **推断：(a) K-8/K-9 接线**。依据：① 它是 ⑤ 段唯一的「假绿」来源（`npm run check` 打印的「卡面 findings 0 / 告警 0 / 阻断 0」实际来自 `scripts/check-all.mjs` 的 416 行 的硬编码 `const cardFindings = []`，行末自带「S1 未上线：非达标证据」）—— 不接线，下一次交付审计仍不能把该行当证据；② spec 已有登记（§7⑤ `:183` / §10-D7 `:220`），不新开 PRD/spec，改动面 = 1 脚本 + 1 断言；③ (b) 需走 ①② 立项，(c) 须先回扫多条已签文档里的 `renderAgent.mjs:行` 引用（`lessons.test.mjs` 行号守卫会红），(d)(e) 都涉及取值/基线定义，成本高于 (a)。
   **请用户：确认 (a)，或指定 (b)/(c)/(d)/(e)**。
2. **若选 (e)：`senior-sdet` 的 `dimension` 取什么值？** 推断：`'测试设计'`。依据：`agents/senior-sdet.md:11` 的关注类别是测试设计面（输入空间/状态转移/失败面/判别力…），且 `tools/docgen/components/agentData.mjs` 现有取值口径为短名词（`'产品设计'` / `'技术实现'` / `'独立（标准核对）'`）。**请用户：确认值或改正**（非开工第一问，做到该项时再定）。

## 既定约束（不要重新讨论、不要重新选型）

- 五段顺序与出口签字已定：S4 六段门行齐（`gate-record.md:42-46`）；后续任务若开新功能必须走 ① 起。
- 已签 spec / testcase / plan **原文不改**，只允许「日期注 + 现行判据块」（本 session 8 处改判均按此办，见 `impact-sheet.md` §二）。
- R8 回扫只用裸命令 `node scripts/scope-sweep.mjs --check`（**禁用** `npm run doc:sweep -- --check`，PowerShell + npm 10.9 会吞掉 `--` 后参数）；改判据级口径须同批登记 `tools/scope-sweep/keywords.json` + 冻结基线 + 当次 `impact-sheet.md`。
- `gate` 的 `baseline 37/37` 一字不变；`docs/agents/**` 只由 `generate --readme --apply` 落盘（15 席 + index = 16 份）。
- 卡面 = 6 段 + 第 7 段「输出格式」，单源 = `tools/docgen/card-model/vocab/card-must-fields.mjs`（PRD §3.7 `:229-238`）。
- 缺口表已迁 `docs/reports/2026-10-31-agent-card-s4-tc-gap-table.md`（③ 段 P2-③ 闭合）；`docs/superpowers/reviews/` 是 observation 归档面，非 observation 账本迁入会触发 `ArtifactMissing` / `UnclassifiedArtifact`（`tools/observation-check/gate-scan.mjs` 的 23–25 行）。

## 遗留裁决与留观项

- `S4-L1` A06 中段可漏 / `S4-L2` A02 删源条目静默重建 / `S4-L3` gate 只点名首个 drift / `S4-L4` senior-sdet 维度空 / `S4-L5` K-9 触发未具名 —— 来源：`docs/after/20261031165047-agent-card-s4-open-items.md`；收敛时机：各条「触发信号」列。
- `P2-4` spec `:5` / plan `:97` 旧锚残留 —— 来源：`delivery-5-s4.md` §H；收敛时机：下次修订该 spec / plan 时（已签件历史保留，不得擅自改）。
- `P2-5` testcase §7 缺口 10/11 缺触发 —— 来源：同上；收敛时机：并入 open-items 作 S4-L6（或下次修订 testcase 时）。
- `K-8`/`K-9`（`scripts/check-all.mjs` 的 416–418 行）—— 来源：S4 spec §7⑤ `:183` 与本文件「开放问题 1」；收敛时机：选 (a) 即本批。
- `renderAgent.mjs` / `sharedBlocks.mjs` 死代码（「已停用」banner 已在）—— 来源：`docs/after/20261024174253-dev-workflow-mainline-open-items.md` 线 G；收敛时机：清理死代码 / S6-B（删前须回扫已签文档的 `renderAgent.mjs:行` 引用）。
- S6-B 结构收敛 —— 来源：`docs/after/20261031111000-senior-sdet-boundary-conflict-open-decisions.md` §六；收敛时机：S6-B 立项。

## 开工前先做

1. `git status --porcelain`（应空串）+ `git log --oneline -1`（应 ≥ `47a3c9c`，其中 `b1d3996` 为 S4 ⑤ 段签字、`47a3c9c` 为本交接首提交）；复跑元信息表『验证基线』五条命令，数值应逐项相同（`npm run check` / `gate` / `check-gate-record` / `scope-sweep` / `doc-name`）。
2. 读 `docs/after/20261031165047-agent-card-s4-open-items.md` 全文，确认 S4-L5（K-9）的原文与触发；再读 `scripts/check-all.mjs` 的 416–418 行，核对 `cardFindings` 现状。
3. 向用户确认开放问题 1 的选型（推断 = (a) K-8/K-9 接线）。
4. 若确认 (a)：先确认「卡面 findings」的实算口径（建议 = 对 15 张卡跑 `tools/docgen/card-model/index.mjs` 的 `validateCardModel`，按 `disposeCardFindings` 分 warnings/blockers），再决定是否同时改 §7⑤ 的判据文字（改判据级口径 → 需 R8 登记）。
5. 若确认 (b)/(c)/(d)/(e)：按对应来源文件读全（见「范围依据」），(b) 须先写 PRD → spec+testcase（走议会），(d) 须先定义「基线」的取数口径并确认是否属判据级（是则 R8）。

## 开场话术

```
读 docs/handoffs/2026-10-31-post-s4-backlog.md，按交接词继续：先裁定下一批做哪项（推断 = K-8/K-9 接线），再开工。注意：S4 已整段收口、HEAD 为 b1d3996、工作树应为空；已知限制在 docs/after/20261031165047-agent-card-s4-open-items.md。
```
