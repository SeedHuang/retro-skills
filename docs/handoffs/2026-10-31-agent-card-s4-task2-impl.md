# Session 交接：retro-skills → agent-card S4 渲染层（③ Task 2 起施工）（2026-10-31）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-31 09:45（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `1a6220e`（`feat(docgen): add agent-card S4 rendering layer data models and vocabularies`）；工作树：**clean**（`git status --porcelain` 空串，09:41 实跑） |
| 验证基线 | 2026-10-31 09:41–09:48 **本次实跑**：`npm run check` → `# tests 1100` / `# pass 1098` / `# fail 0` / `# skipped 2`、`baseline 37/37`、`④ markdown 检查通过（319 个文件 / 1429 张表；09:48 复跑为 **320 / 1430**，+1 文件 / +1 表 = 本交接文档自身）、末行 `check 全部通过`（exit 0）；`node --test "tools/docgen/test/card-render.test.mjs"` → `# tests 3 / # pass 3 / # fail 0`；`node --test "tools/docgen/test/card-model.test.mjs" --test-reporter=tap` → `# tests 58 / # pass 58 / # fail 0`；`node scripts/check-gate-record.mjs` → `rows 34 bad 0` + `gate-record ok`；`node scripts/scope-sweep.mjs --check` → `sweep ok（命中未超基线、清单齐、scope 齐）`；plan **734 行 / SHA256 `6730B39C…2E2A8B44E`**；上游件未改：spec **245 行 / `6AB157AC…509CE706`**、testcase **2246 行 / 61 条 / `7D8FD7BF…923A17A8A`** |
| 继任自 | `docs/handoffs/2026-10-30-agent-card-s4-plan.md` |
| 状态 | **可直开工**（0 个开放问题；1 条已裁定「不改」的项见『遗留』`K-14`） |

## 项目定位

`d:\Seed\retro-skills` —— AI 协作工作流的规则 / 技能 / 机械判据仓库（五段主干：PRD → spec+testcase → 计划门 → 实现 → 质量 → 交付；`npm run check` 是唯一总门禁）。

## 现状

- **已完成 ① ② ②→③**：三个门行都在 `skills/dev-workflow/references/gate-record.md`（`①@agent-card-contract` / `②@S4-render` / `②→③@S4-render`；全表 `rows 34 bad 0`）。计划门为独立审计两轮：第 1 轮 P1 1 + P2 3 → 全修闭合，第 2 轮判「过」，**P0/P1/P2 = 0/0/0**。
- **③ 已完成的 Task**：只到 **Task 1（数据层骨架）**，随 `1a6220e` 入库：
  - `tools/docgen/card-model/vocab/card-must-fields.mjs`（`CARD_SEGMENTS` 7 段 / `MUST_FIELDS` 5 / `PROSE_PROBES` 三类）
  - `tools/docgen/card-model/vocab/predicates.mjs`（8 条判据 id）、`vocab/landings.mjs`（4 条落点）
  - `tools/docgen/card-model/vocab/shared-actions.mjs`（4 must + 4 never + 15 席白名单；触发三键用 S1 **枚举 id**：`scene:'deliverable'` / `moment:'end'` / `repeat:'per-round'`）
  - `tools/docgen/card-model/subjects.mjs`：追加 15 条 `<seat>.card`（总数 **17** = 15 席 + 2 项产物侧，见 `K-14`）
  - `tools/docgen/components/outputFormats.mjs`：结构化 `outputFormats`（5 kind，`audit.fields` 18 项纯字段名数组）+ `legacyOutputFormats`（旧散文逐字保留，供未迁移卡逐字节比对）
  - `tools/docgen/test/card-render.test.mjs`（3 条：`A07` / `D01` / `D02`）
  - 5 处 import 改别名 `legacyOutputFormats as outputFormats`（`components/renderByName.mjs`、`acceptance/render13-snapshot.mjs`、`test/{evidence-reader,pilot-render,tool-tiers}.test.mjs`）
- **代码评审已闭环**（`TRAE-code-review`：2 个独立复核实例）：`moment` 由 `'结束时'` 改 `'end'`、`audit` 恢复 A/B 节与结论列并补「交付物完成判据核对」check、删未使用的 `specLine`；第 4 条「删 `reviewer-detective.card`」经实证判为假阳性（删后 16 条违 spec §4 `:94` 的 15+2），**不删**，登记为 `K-14`。
- **验证证据**：见元信息表『验证基线』（单源，此处不重复）。
- **提交状态**：已 commit（`1a6220e`，见元信息表『HEAD』）；工作树无未提交改动。
- **工作树异常**：无。

## 过程记录

- `.session/reviews/2026-10-30-2233-agent-card-s4-render-plan-gate/`（**先读** `plan-gate.md` 尾部「施工期增量登记」、`submission.md`、`impact-sheet.md` 的 §五）
- `.session/reviews/2026-10-30-000104-agent-card-s4-render-spec/`（议会 #2 账：只读 `round-check.md` 与 `delivery-audit.md` 的结论行，勿重读全量）
- 历史交接词：`docs/handoffs/2026-10-28-s4-plan-gate.md` → `docs/handoffs/2026-10-29-agent-card-s1-spec.md` → `…/2026-10-29-agent-card-s1-plan-gate.md` → `…/2026-10-29-agent-card-s1-impl.md` → `…/2026-10-29-agent-card-s4-spec.md` → `…/2026-10-30-agent-card-s4-plan.md` → **本文件**

## 本次任务

按 plan 继续 ③ 施工：**Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7**，然后由**独立审计实例**签 ③ 出口（R2：开发不得自签），再进 ④（sdet 签）与 ⑤（用户终验）；流程：施工 6 个 Task（每 Task 一提交 / 每席一提交）→ ③ 出口审 → ④ 质量 → ⑤ 交付；起点：**Task 2 Step 1**（`docs/superpowers/plans/2026-10-30-agent-card-s4-render.md` 的「## Task 2」节，`:263` 起）。

## 范围依据

- **要读**（按顺序）：
  - plan `docs/superpowers/plans/2026-10-30-agent-card-s4-render.md`：`Task 2`（`:263` 起，含 Step 1–8 与 32 条用例表）、`Task 3` / `Task 4` / `Task 5` / `Task 6` / `Task 7`、`附录 A`（61 行落点，已按 **3 / 32 / 2 / 2 / 4 / 1 / 17** 更正）、`附录 B`（提交切分 21 条）
  - spec `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md`：§3 `:36-73`（落点 / 8 个 `vocab/` 导出名 / 写盘授权链 / 数据源单向）、§4 `:79-98`（Card 12 键 / 装配 6 函数 / `env` 11 键 / 拒绝语义）、§5 `:112-155`（三投影 / 覆盖记录 / 7 段 / `PROSE_PROBES` / 称谓）、§6 `:157-173`、§7 `:175-184`、§8 `:186-195`、§10 `:212-225`
  - testcase 同目录 `-testcase.md`：§0.3 helper 全文（`:63-235`）、§2 里 Task 2 的 32 条明细（`A03` `:415` / `A04` `:445` / `A05` `:466` / `A06` `:496` / `B01` `:577` / `B02` `:603` / `B04` `:660` / `B05` `:679` / `B06` `:715` / `B07` `:741` / `B08` `:771` / `C01` `:811` / `C02` `:837` / `C04` `:878` / `C05` `:898` / `D03` `:997` / `D04` `:1023` / `D05` `:1047` / `E02` `:1099` / `E03` `:1122` / `E04` `:1145` / `E05` `:1165` / `G04` `:1569` / `G05` `:1598` / `G06` `:1637` / `G07` `:1668` / `H02` `:1728` / `I03` `:1817` / `I04` `:1841` / `J01` `:1870` / `J02` `:1914`）、§7 缺口 10–15（`:2059-2066`）
  - 现状链（写 T2 的 Files/Interfaces 必读）：`tools/docgen/cli.mjs`（`:45-81` `cmdGenerate` 只比不写 / `:84-126` `collectGate` / `:508-535` 严格旗标白名单 / `:565-602` `main` 子命令注册）、`tools/docgen/components/renderByName.mjs`（`:22-32`）、`renderAgent.mjs`（`:38` `{{OUTPUT_FORMAT}}`）、`validateAgentData.mjs`（`:117-119` `BASE_KEYS` / `:66-79` 断言 8）、`agentData.mjs`（`:5-265` SKELETON / `:268-294` `triggerTable`）、`tools/docgen/state.json`（15 席全 `replaced`）、`tools/execution-matrix/check-agent.mjs`（`:89-124` `checkStruct` A3–A7）、`tools/observation-check/card-exempt.mjs`（`:24` `EXPIRY_LANDED`）、`scripts/check-all.mjs`（`:138`/`:148` `baselineN` 派生断言、`:416-418` 豁免窗口行）
- **勿重做（零改动或指定唯一例外）**：
  - `tools/docgen/card-model/**`（S1 已签）：本段**只增** `vocab/` 4 表与 `subjects.mjs` 的 15 席登记项，**不改任何码与判据**——`vocab/` 4 表与 `subjects.mjs` 已由 Task 1 落盘，**Task 2–7 不得再改**（除非 testcase 判据要求，且须先回 ② 段）
  - `tools/observation-check/**`（S2/S3 已签；唯一例外 = `card-exempt.mjs:24` 的 `EXPIRY_LANDED` 置 `true`，属 Task 7）
  - `tools/docgen/policy/**`（S6 已签，零改动）
  - `tools/execution-matrix/criteria.md` 的 **A3–A7** 判定面（逐字保留；只改 A1/A2 的锚点段，属 Task 3）
  - S1 的 spec / testcase / plan / 门行（已签，原文不改）
  - `tools/observation-check/registered-ids.mjs`（本段零接触，`S4-TC-I02` 用 `git diff --quiet HEAD` 证）

## 开放问题

无。唯一已裁定项：`K-14`（`SUBJECTS` 保持 17 条 = 15 席 + 2 项产物侧）。若之后要删/改名 `reviewer-detective.card`，必须先回 ② 段改 spec §4 `:94` 与 PRD `:293`（R4），**不得在 ③ 段自行改**。

## 既定约束（不要重新讨论、不要重新选型）

- **执行顺序 S2 → S3 → S1 → S4 已定，S4 是最后一格** —— PRD `docs/prd/20261026205821-agent-card-contract.md:521`。
- **卡面 = PRD 6 段 + 第 7 段「输出格式」**（用户 2026-10-29 裁定）；7 段单源 = `tools/docgen/card-model/vocab/card-must-fields.mjs` —— spec §5.1 / §10-D1。
- **README 落点 = `docs/agents/`**（`README.md` + 15 席各一份）—— spec §3 / §10-D2。
- **写盘授权链不变**：`generate` 保持「只比不写」；角色卡内容变更只走 `draft` → 用户确认 → `replace --yes`；`docs/agents/**` 只由 `generate --readme --apply`；`writeAll` 只是三处共用实现 —— spec §3 `:71`。
- **`gate` 的 `baseline 37/37` 一字不变**：`docs/agents/**` 必须用**独立派生面**（16 份）比对，不得塞进 `BASELINE_RULES` / `agentPaths()`（否则 37→53，`scripts/check-all.mjs:138`/`:148` 一起红）—— plan『接口小节』口径陷阱。
- **单席原子**：`renderSeat` 一次只产 1 卡 + 1 README，坏则该席零写盘；15 席全过是 `renderAll()` 的语义 —— spec §7-①。
- **`Card` = S1 全量 12 键**；`name`/`description`/`tools` 由 `seatEntry` 派生填入，不另存 —— spec §4 `:79-90`。
- **`description` = `trigger.when` 直出**（不再派生「在…中担任…」）；未迁移席仍走旧派生式，直到 Task 7 删旧分支 —— spec §10-D3。
- **过渡期双载体**：`outputFormats`（结构化，新卡读）与 `legacyOutputFormats`（旧散文，旧模板读）并存，收口随旧模板一起删 —— 已由 Task 1 落码，Task 2 的新分支必须读**结构化**那一个。
- **15 席逐席一提交，每席门禁绿才下一席**；每席走 `draft` → **独立实例按新卡重判 A1/A2** → `replace --yes --expect-change <sha> --rejudge A1,A2`（`DOCGEN_JUDGED_BY`）—— spec §8 + `K-12`。
- **`registeredIds` 派生切换不在本段做** —— spec §10-D6；`SUBJECTS` 只扩登记项。
- **`V-13`（A/B 盲评）不在本期**，任何材料不得引用 —— `gate-record.md:13`。
- **plan 不得有 `## 新增设计决策` 节**（R4，位置型判据）；施工期发现 spec 未定义的东西 → **回 ② 段补 spec**，不在 ③ 段自定。
- **R8 回扫用裸命令** `node scripts/scope-sweep.mjs --check`；若报「清单早于被扫文件」，为当批**新落**一份 `impact-sheet.md`，**不得改写旧清单凑绿**；**禁用** `npm run doc:sweep -- --check`。

## 遗留裁决与留观项

- `K-6`（testcase §7 缺口 12–15：`writeAll(artifacts)` / `checks[]` / `changed` / `SHARED_USE` 缺省语义未写死）—— 来源：plan『遗留』表；收敛时机：**Task 2 首次构造该形状时**按『接口小节』取最小形状（只作内部形状）；若与 spec 判据冲突 → 回 ② 段。
- `K-7`（称谓计数口径）—— 来源：plan『遗留』表；`agents/detective-observer.md` 实测 `Select-String '议长|主持人'` = **8 行**（议长 1 行 / 主持人 7 行；「主持人」出现 8 次，一行含两处），与 spec §5.2 `:154` 的「×7」**同口径（行数）**；本段材料按**行数**写。
- `K-8`（`scripts/check-all.mjs:418` 的 `[豁免窗口]` 行末句「（S1 未上线：非达标证据）」在置 true 后失效）—— 不改；触发 = 下次改 `check-all.mjs` 时同批改文案。
- `K-9`（`scripts/check-all.mjs:416` 的 `cardFindings` 仍硬编码 `[]`）—— 本段不接线（spec §2-5）；④ 段结论须写「卡面 findings 非达标证据」。
- `K-10`（旧模板 **9 处** `.mjs` 引用，Task 7 逐处处置，测试类改断新渲染器等价面、**不得删断言换绿**；`agentData.mjs:247` 的 `sourceLine` 随旧模板删）—— 取数 `Get-ChildItem tools\docgen -Recurse -Filter *.mjs | Select-String -Pattern 'agent\.md\.tpl|agent-handwritten\.md\.tpl'` → 9。
- `K-11`（每席迁移会打断引用该席数据的常驻测试）—— 收敛时机：**每席迁移前**取清单 `Get-ChildItem tools\docgen\test -Filter *.test.mjs | Select-String -Pattern '<seat>'`，同批更新为交付物。
- `K-12`（每席 `replace` 在 `change` 段要求 `--expect-change` + `--rejudge A1,A2` + `DOCGEN_JUDGED_BY`；`rules/.inspector-annotations.json` 现值 15 席 × 10 键全 `pass` 但基于旧卡）—— 每席由独立实例按新卡重判后写回。
- `K-13`（`patternRegistry.description` 两个派生分支）—— Task 7 收口后若全仓无引用即删（spec §11-4）。
- `K-14`（`SUBJECTS` 17 条里 `reviewer-detective.card` 与席名 `detective-observer` 不同名）—— **按 spec §4 `:94` 的「15 席 + 2 项产物侧」保留 17 条**；④ 段按「已核、按 spec 保留」入账，不得记成漏修。
- `O-4`（PRD `:293` 省略号）、`O-12`（`registeredIds` 切换）、`O-13`（豁免窗口）、`O-16`～`O-19`（spec 侧空白）—— 来源：`docs/after/20261029204752-agent-card-s1-open-items-open-decisions.md`；收敛时机分别在 **Task 4 / 不在本段 / Task 7 / 不触碰**。

## 开工前先做

1. `git status --porcelain`（应空串）+ `git log --oneline -1`（应 `1a6220e`）；复跑元信息表『验证基线』的六条命令，数值应逐项相同（`npm run check` / `card-render` / `card-model --test-reporter=tap` / `check-gate-record` / `scope-sweep` / plan + spec + testcase 的 `Get-FileHash` 与行数）。
2. 读 plan 的「## Task 2」节全文（`docs/superpowers/plans/2026-10-30-agent-card-s4-render.md:263` 起）与 testcase §0.3 helper（`:63-235`）+ Task 2 的 32 条明细（行号清单见上「范围依据」）。
3. 读现状链 7 个文件（`tools/docgen/cli.mjs` 的 `cmdGenerate` / `collectGate` / `parseArgs` / `main`、`components/renderByName.mjs`、`components/renderAgent.mjs`、`components/validateAgentData.mjs`、`components/agentData.mjs`、`state.json`、`scripts/check-all.mjs:138`/`:148`/`:416-418`），确认三处接线点与「`baseline 37/37` 不得变」的派生断言。
4. 写 T2 Step 1–2（`templates/agent-card.md.tpl` + `renderCard.mjs`），先用测试里手造的最小 `card` fixture（4 键全 + `PROSE_PROBES` 零命中）跑通 `renderCard`，再落 `renderSeat`；**每步**跑 `node --test "tools/docgen/test/card-render.test.mjs"` 与 `node tools/docgen/cli.mjs gate`（必须仍 `baseline 37/37` 且**无 `Mismatch`**——本 Task 不迁移任何席）。
5. T2 收尾跑 `npm run check`（`# tests` 应为 1100 + 32 = 1132、`# fail 0`）+ `node scripts/scope-sweep.mjs --check`（若报 mtime 时序，按 `②→③@S3` 先例在本批新落 `impact-sheet.md`）。

## 开场话术

读 `docs/handoffs/2026-10-31-agent-card-s4-task2-impl.md`，按交接词继续：agent-card S4 渲染层 ③ 段从 Task 2 起施工（三投影 + 15 席迁移 + 收口），做完由独立审计签 ③ 出口。

