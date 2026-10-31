# Session 交接：retro-skills → `senior-sdet` 迁移 + S4 Task 7 收口（2026-10-31）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-31 11:02（Asia/Shanghai，`(Get-Date)` 实跑） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `14e1e71`（`docs: S4 ③ 段交接（Task 2-6 已落、senior-sdet B3 冲突阻塞收口）`；**本交接落盘提交后 HEAD 为 `9d3779b`**，以 `git log --oneline -1` 实查为准）；工作树：clean（`git status --porcelain` 空串，11:02 实跑） |
| 验证基线 | 2026-10-31 **11:02 本次实跑**：`npm run check` → `# tests 1109` / `# pass 1107` / `# fail 0` / `# skipped 2`、`baseline 37/37`、`④ markdown 检查通过（338 个文件 / 1471 张表）`、末行 `check 全部通过`（exit 0）；`node tools/docgen/cli.mjs gate` → `baseline 37/37`（exit 0）；`node scripts/check-gate-record.mjs` → `gate-record ok（R1/R2/R6 全过；splitting 0）`；`node scripts/scope-sweep.mjs --check` → `sweep ok（命中未超基线、清单齐、scope 齐）`（exit 0） |
| 继任自 | `docs/handoffs/2026-10-31-agent-card-s4-task2-impl.md`（上一份执行交接）；中间还有一份结算交接 `docs/handoffs/2026-10-31-agent-card-s4-close-blocked.md` |
| 状态 | **有 1 个开放问题（开工第一问，见「开放问题」）**：`senior-sdet` 的 B3 冲突需用户裁定后才能继续迁移与收口 |

## 项目定位

`d:\Seed\retro-skills` —— AI 协作工作流的规则 / 技能 / 机械判据仓库（五段主干 ①PRD → ②spec+testcase → 计划门 → ③实现 → ④质量 → ⑤交付；`npm run check` 是唯一总门禁）。

## 现状

- 已完成（本批 6 个提交，`git log --oneline -6` 实查）：
  - `32ef1e8` **Task 2–4**：新增 `templates/agent-card.md.tpl`、`components/renderCard.mjs`、`components/renderReadme.mjs`、`components/cardPipeline.mjs`（唯一装配点：`buildCards` / `buildEnv` / `renderSeat` / `renderAll` / `writeAll` / `expectedDocs`）、`components/cardTemplate.mjs`；`renderByName.mjs` 加双形态分支（`agent.card` → `renderSeat`，否则旧模板）；`cli.mjs` 新增 `dump --name`、`generate --readme --apply`，`collectGate` 扩 `docs/agents` 比对面（独立派生面，`baseline 37/37` 未变）；`validateAgentData.mjs` 的 `EXIT` 表从 `CARD_MODEL_CODES` + `MERGE_CODES` **派生**承接 36 脚本码 + 3 合并码（exit 1），`BASE_KEYS` 容 `card`、断言 8 只判未迁移席；`touchedSemanticKeys` 认「职责」；`criteria.md` A1 判定对象迁「职责」段；PRD §3.7 表内插「输出格式」行（6→7 段）、`:293` 省略号收敛；`docs-convention` 补 `docs/agents/` 行。
  - `bf161c9` + `2a7a4ea` **Task 5**：试点席 `detective-observer` 迁移（`draft` → 独立实例重判 A1/A2/B3 → `replace --expect-change A74541F1… --rejudge A1,A2,B3` → `generate --readme --apply`）；对照稿归档 `docs/reports/2026-10-30-agent-card-s4-pilot-contrast.md`；修 `renderCard` 边界取值（席条目自带 `boundary` 优先，`renderCard.mjs:67-71`）。
  - `bbd531f` + `8181164` **Task 6**：**13 席**批量迁移（`reviewer-audit` 为手写字面卡，其余 12 席由 `agentData.mjs` 的 `cardOf()` 构造），逐席 `replace --expect-change --rejudge A1,A2,B3`，判者 `reviewer-ai-2026-10-31-s4-task6-batch`（42/42 pass）；`docs/agents/**` 共 **15 份**（14 席 README + index，`(Get-ChildItem docs\agents -Filter *.md).Count` = 15 实跑）；旧数据常驻测试全部改成等价面（未删断言，清单见 `.session/reviews/2026-10-31-s4-task2-impl/impact-sheet.md` §五/§六）。
- 数据现状（实跑 `agentData` 过滤）：**14 席有 `card`**（`reviewer-audit` / `product` / `interaction` / `ui` / `frontend` / `backend` / `ops` / `qa` / `ai` / `security` / `actuary` / `reader` / `detective-observer` / `evidence-reader`）；**未迁移 1 席 = `senior-sdet`**。
- 验证证据：见元信息表『验证基线』（单源，此处不重复）。
- 提交状态：已 commit（6 个，hash 见元信息表『HEAD』与上列清单）。
- 工作树异常：无。

## 过程记录

- `.session/reviews/2026-10-31-s4-task2-impl/impact-sheet.md`（**先读** §五「Task 5 追加」与 §六「Task 6 追加」；§一~四 是 Task 2–4 的 R8 回扫账）
- `.session/reviews/2026-10-31-s4-task2-impl/pilot-contrast.md`（试点工作副本，只有指针；正文在归档副本）
- `docs/reports/2026-10-30-agent-card-s4-pilot-contrast.md`（试点对照稿**归档副本**，7 段逐段对照 + 差异清单 + 出数）
- `docs/after/20261031111000-senior-sdet-boundary-conflict-open-decisions.md`（**阻塞项未决单，唯一入口**，含 3 个处置选项）
- 历史交接词：`docs/handoffs/2026-10-30-agent-card-s4-plan.md` → `…/2026-10-31-agent-card-s4-task2-impl.md` → `…/2026-10-31-agent-card-s4-close-blocked.md` → **本文件**

## 本次任务

按用户裁定处置 `senior-sdet` 的边界冲突 → 迁该席 → 执行原 plan 的 **Task 7 收口** → 由**独立审计实例**签 ③ 出口（R2：开发不得自签），再进 ④（sdet 签）与 ⑤（用户终验）；流程：先做开放问题裁定 → 迁移 `senior-sdet`（draft → 独立重判 → replace → generate）→ Task 7（`EXPIRY_LANDED=true`、删两个旧 `.tpl` 与旧分支、`renderAll()` 全量、gate 31 份比对面、补 49 条全集用例）→ ③ 出口审；起点：**「开放问题」第 1 条裁定**。

## 范围依据

- 要读（按顺序）：
  - `docs/after/20261031111000-senior-sdet-boundary-conflict-open-decisions.md` 全文（冲突事实表 §一、可选处置 §三）
  - `docs/superpowers/plans/2026-10-30-agent-card-s4-render.md`：`## Task 7`（`plan:560-635`，Step 1–6）与 `附录 A`（`plan:639-707`，61 条用例落点）与 `附录 B`（`plan:711-726`，提交切分）
  - spec `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md`：§7 `:175-184`（写盘/门禁/到期事件六条）、§8 `:186-195`、§10-D7/D8/D12、§11-3/11-4
  - testcase 同目录 `-testcase.md`：Task 7 相关条目（`F01` `:1190` / `F03` `:1255` / `F04` `:1276` / `F06` `:1342` / `F07` `:1363` / `F08` `:1386` / `F09` `:1412` / `A01` `:354` / `B03` `:630` / `C03` `:858` / `E01` `:1073` / `G01` `:1463` / `G02` `:1496` / `G03` `:1539` / `I01` `:1766` / `I02` `:1795` / `J03` `:1914`）
- 现状链（写 Task 7 前必读）：`tools/docgen/components/cardPipeline.mjs`（`renderAll` 要求 15 席全有 card）、`tools/docgen/cli.mjs`（`collectGate` 的 `docs/agents` 比对面 `:150-171`、`generate --readme --apply` `:85-101`、`renderByName` 旧分支）、`tools/docgen/components/renderByName.mjs:1-30`（原 `:31-35` 的旧模板分支已随 Task 7 退场，行号按迁移后文件）、`tools/docgen/components/validateAgentData.mjs:117-123`、`tools/observation-check/card-exempt.mjs:23-24`（`EXPIRY_LANDED = false`）、`scripts/check-all.mjs:416-418`（`[豁免窗口]` 行）、`tools/docgen/templates/agent.md.tpl` / `agent-handwritten.md.tpl`（**两文件仍存在**，`Test-Path` 11:02 实跑 = `True` / `True`）
- 勿重做：`tools/docgen/card-model/**`（S1 已签，只消费不改码；`vocab/` 4 表与 `subjects.mjs` 已落）、`tools/docgen/policy/**`（S6 零改动）、`tools/observation-check/**`（唯一例外 = `card-exempt.mjs` 的 `EXPIRY_LANDED` 置 true）、`tools/observation-check/registered-ids.mjs`（零接触）、已签 S1/S4 的 spec/testcase/门行（原文不改）。

## 开放问题

1. **【开工第一问】`senior-sdet` 按哪种方式解冲突？** 独立实例（`reviewer-ai-2026-10-31-s4-task6-batch`）按 `tools/execution-matrix/criteria.md` 的 **B3「职责段 vs 边界段」** 判 **fail**：职责要「编写 `testcase.md`」，而 `patternRegistry.DEFAULT_BOUNDARY` 与 `renderBoundary('senior-sdet')`（实跑输出）都禁写「测试」路径，`agents/senior-sdet.md` 的 `tools` 却是 `Read, Glob, Grep, Write, Edit`。
   推断：**方案 1（给 SDET 席一条专用 boundary 并同批对齐 tools）**——依据：① 该席的产出物（testcase.md）在本仓确有落盘需求（`skills/dev-workflow` 的 ② 段要 testcase 文件）；② 方案 2（改 PRD 措辞为「只出设计、由主 agent 落盘」）会让 `tools` 的 `Write/Edit` 变成无意义授予，与 S6「档位与产物对齐」相反；③ 方案 3（登记豁免）等于改判据，不推荐。
   请用户：**确认方案 1，或指定方案 2/3**（若选 1，请同时确认是否允许本批改 `patternRegistry` 的 `boundaryBySeat` 与 S6 的 boundary 断言——那属 S6 面，需同批回扫）。

## 既定约束（不要重新讨论、不要重新选型）

- 执行顺序 S2 → S3 → S1 → S4 已定，S4 是最后一格 —— PRD `docs/prd/20261026205821-agent-card-contract.md:521`。
- 卡面 = 6 段 + 第 7 段「输出格式」（PRD §3.7 `:229-238`，本批已插入）；7 段单源 = `tools/docgen/card-model/vocab/card-must-fields.mjs`。
- README 落点 = `docs/agents/`（`README.md` + 每席一份）—— spec §3 `:53-56` / §10-D2。
- 写盘授权链不变：`generate` 保持「只比不写」；角色卡内容变更只走 `draft` → 独立重判 → `replace --yes --expect-change --rejudge`；`docs/agents/**` 只由 `generate --readme --apply` 落盘 —— spec §3 `:71`。
- `gate` 的 `baseline 37/37` 一字不变：`docs/agents/**` 用**独立派生面**比对，不得塞进 `BASELINE_RULES` / `agentPaths()` —— plan『接口小节』口径陷阱 + `scripts/check-all.mjs:138`/`:148`。
- 单席原子：`renderSeat` 一次只产 1 卡 + 1 README；坏则该席零写盘；15 席全过是 `renderAll()` 的语义 —— spec §7-①。
- `Card` = S1 全量 12 键；`name`/`description`/`tools` 由 `seatEntry` 派生（`description` = `trigger.when` 直出 + `notWhen` 时附「不用于」）—— spec §4 `:79-98` / §10-D3。
- 过渡期双载体：`outputFormats`（结构化，新卡读）与 `legacyOutputFormats`（旧散文，仅 `renderAgent` 读），收口随旧模板一起删 —— `components/outputFormats.mjs:1-7`。
- 15 席逐席一提交、每席门禁绿才下一席 —— spec §8 `:192` + PRD R1 `:92`（本批 13 席因 describe 前置滚动按批提交，已在 impact-sheet 登记）。
- `registeredIds` 派生切换不在本段做 —— spec §10-D6；`SUBJECTS` 保持 17 条（15 席 + 2 产物侧，`K-14`）。
- `V-13`（A/B 盲评）不在本期，任何材料不得引用 —— `skills/dev-workflow/references/gate-record.md:13`。
- plan 不得有 `## 新增设计决策` 节（R4）；R8 回扫用裸命令 `node scripts/scope-sweep.mjs --check`（**禁用** `npm run doc:sweep -- --check`）。

## 遗留裁决与留观项

- `K-6`（testcase §7 缺口 12–15：`writeAll(artifacts)` / `checks[]` / `changed` / `SHARED_USE` 缺省语义）—— 已按最小形状落码（`cardPipeline.mjs` 的 `writeAll` / `renderReadme` 覆盖表 / `expectedDocs`）；收敛时机：无（如与 spec 冲突才回 ② 段）。
- `K-7`（称谓计数口径）：`detective-observer` 迁移前 `Select-String '议长|主持人'` = 8 行（议长 1 / 主持人 7）；迁移后卡面「议长」0、「主持人」2 处（`S4-TC-C06` 已固化为用例）。
- `K-8`/`K-9`（`scripts/check-all.mjs:416` 的 `cardFindings` 硬编码 `[]` 与 `[豁免窗口]` 行末句）—— 不改；触发 = 下次改 `check-all.mjs` 时同批改文案；④ 段结论须写「卡面 findings 非达标证据」。
- `K-10`（旧模板 9 处 `.mjs` 引用，Task 7 逐处处置；测试类改断新渲染器等价面、**不得删断言换绿**；`agentData.mjs` 的 `sourceLine` 随旧模板删）—— 取数 `Get-ChildItem tools\docgen -Recurse -Filter *.mjs | Select-String -Pattern 'agent\.md\.tpl|agent-handwritten\.md\.tpl'`（当前仍为 9）。
- `K-11`（迁移打断常驻测试）—— 本批已按等价面同步（清单见 impact-sheet §五/§六）；`senior-sdet` 迁移时仍须先取清单：`Get-ChildItem tools\docgen\test -Filter *.test.mjs | Select-String -Pattern 'senior-sdet'`。
- `K-12`（每席 `replace` 在 change 段要求 `--expect-change` + `--rejudge` + `DOCGEN_JUDGED_BY`；annotations 现值 15 席 × 10 键全 `pass`）—— 每席由独立实例按新卡重判后写回。
- `K-13`（`patternRegistry.description` 两个派生分支）—— Task 7 收口后若全仓无引用即删（spec §11-4 `:234`）。
- `K-14`（`SUBJECTS` 17 条里 `reviewer-detective.card` 与席名 `detective-observer` 不同名）—— **按 spec §4 `:94` 保留**；④ 段记「已核、按 spec 保留」。
- 新增：**`senior-sdet` B3 阻塞** —— 来源：`docs/after/20261031111000-…open-decisions.md`；收敛时机：本 session 开工第一问裁定后。
- `O-4`（PRD `:293` 省略号）已收口（本批 Task 4，`S4-TC-K01` 固化为用例）；`O-12`（`registeredIds` 切换）不在本段；`O-13`（豁免窗口）Task 7；`O-16`～`O-19`（spec 侧空白）不触碰。

## 开工前先做

1. `git status --porcelain`（应空串）+ `git log --oneline -1`（应 `14e1e71`）；复跑元信息表『验证基线』四条命令，数值应逐项相同（`npm run check` / `gate` / `check-gate-record` / `scope-sweep`）。
2. 读 `docs/after/20261031111000-senior-sdet-boundary-conflict-open-decisions.md` 全文，**先向用户确认方案 1/2/3**（开工第一问）。
3. 若走方案 1：读 `tools/docgen/components/patternRegistry.mjs:28-56`（`boundaryBySeat` / `tierBySeat` / `description`）与 `tools/docgen/policy/seat-policy.mjs` 的 `senior-sdet` 条目，再读 `tools/docgen/policy/definitions/paths.mjs` 的 `pathGroups['tests'…]`（确认「测试」路径组），同批改 S6 的 boundary 断言（`tools/docgen/test/policy-pure-source.test.mjs` 中 `boundaryBySeat` 相关用例）与 `tools/docgen/test/tool-tiers.test.mjs` 的 S5-TC-B08。
4. 迁移 `senior-sdet`：取影响面 `Get-ChildItem tools\docgen\test -Filter *.test.mjs | Select-String -Pattern 'senior-sdet'` → 落 `card`（参考 `agentData.mjs` 里 `cardOf()` 与 `detective-observer` 字面卡）→ `node tools/docgen/cli.mjs draft --kind agent --name senior-sdet` → 独立实例重判 A1/A2/B3 → `DOCGEN_JUDGED_BY=<实例名> node tools/docgen/cli.mjs replace … --expect-change <新 sha> --rejudge A1,A2,B3` → `node tools/docgen/cli.mjs generate --readme --apply`（**先 generate 再 replace 的顺序**见 impact-sheet §五 的落盘次序说明）。
5. Task 7：读 `plan:560-635` 逐 Step 执行；每步后跑 `node --test "tools/docgen/test/card-render.test.mjs"` + `node tools/docgen/cli.mjs gate` + `npm run check`，末态 `test('S4-TC-` 累计 = **61**、`gate` 无 `Mismatch`、`check 全部通过`。

## 开场话术

```
读 docs/handoffs/2026-10-31-senior-sdet-migration.md，按交接词继续：先裁定 senior-sdet 的 B3 边界冲突（开工第一问），再迁该席并执行 agent-card S4 的 Task 7 收口，最后由独立审计实例签 ③ 出口。注意：`senior-sdet` 未迁移前不得置 `EXPIRY_LANDED=true`、不得删旧模板。
```
