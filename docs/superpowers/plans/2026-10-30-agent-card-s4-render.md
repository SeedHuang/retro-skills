# agent-card S4 渲染层（一份数据 → 三投影 + 全席重生成，F-09～F-12、F-23）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.
>
> 状态：**待过计划门（`②→③@S4-render` 未签）**——本文件落盘后由独立审计实例读 plan 并签行，签行原文进 `skills/dev-workflow/references/gate-record.md`（本文件不复抄，防两处维护漂移）。本门**不设议会**（`skills/dev-workflow/references/stage-2b-plan-gate.md:12-14`）。
> **单块**：本功能块**不再拆**——spec 245 行 ≤ 350、testcase 61 条 ≤ 80、议会 #2 已收口（`.session/reviews/2026-10-30-000104-agent-card-s4-render-spec/round-check.md`）；再拆须按 `skills/dev-workflow/references/stage-2-tech-design.md` 对第二块重送议会 #2 并占 R6 名额。**用户 2026-10-30 已确认「按块 7 个 Task」**（Task 粒度见「遗留与留观」`K-0`）。

**Goal:** 把「15 张散文卡」换成**一份数据渲染出的三种视图**：`agentData` 的 `seatEntry.card` → 卡面（`agents/<seat>.md`，AI 读）/ README（`docs/agents/README.md` + 15 份，人读）/ `dump`（stdout，开发读）；同一 `renderSeat()` 产出的三视图对同一字段逐字一致，手改任一生成物即 `gate` 红；15 席逐席迁移（侦探席试点先行 + 出数），收口时全席重生成、`EXPIRY_LANDED` 置 `true`、旧模板退场。

**Architecture:** 新增**唯一装配点** `components/cardPipeline.mjs`（`buildCards` → `buildEnv` → `mergeActions` → 三投影 + `writeAll()`），卡面与 README 各一个纯投影模块（`renderCard.mjs` / `renderReadme.mjs`），模板 `templates/agent-card.md.tpl` 一份；4 个 `vocab/` 登记表（`card-must-fields` / `predicates` / `landings` / `shared-actions`）是**词与字段的唯一写死处**，`card-model/**` 只被 import 消费（判据一字不动）。数据单向：渲染输入只来自 `agentData.mjs` + `triggerTable`，`agents/*.md` **只被 gate 读来比对**。

**Tech Stack:** Node.js ≥ 22（ESM `.mjs`；只 import `node:` 标准库，零第三方依赖）；PowerShell（仓根执行）；测试统一 `node --test "tools/docgen/test/card-render.test.mjs"`。

**Spec:** `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md`（**245 行 / v4**，SHA256 `6AB157ACE3FA509262FC31D37D6BD9C97DAF0EA1AAB82FA5B68380BA509CE706`；已签 `②@S4-render`，本阶段**不改判据**）

**Testcase:** `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design-testcase.md`（**2246 行 / v4**，SHA256 `7D8FD7BFCDE92E819B0885E7E010F7A9CAC0135C3DAC918AD8EC0E0923A17A8A`，**61 条 = 正 23 / 负 20 / 边界 18**；`S4-TC-A01`…`S4-TC-K01`；由独立 `senior-sdet` 全新上下文编写，本段只消费、不改写）

> **引用口径**：`spec:NN` = 上列 spec 的行号；`testcase:NN` = 同名 `-testcase.md` 的行号；`PRD:NN` = `docs/prd/20261026205821-agent-card-contract.md` 的行号。**本 plan 自身行号不写进正文**，凡指向 plan 内部一律写「Task N / 附录 A / 附录 B」。

## Global Constraints

以下每一条对**每个任务**隐含生效（值逐字取自 spec / testcase / 仓内实测）：

1. **落点与零接触**（spec §3 `:69-73` + §2 `:25-32`）：只动 spec §3 列出的落点；`tools/docgen/card-model/**` **只增** `vocab/` 4 表与 `subjects.mjs` 的 15 席登记项——**不改任何码与判据**（spec §2-1 `:27`）；`tools/docgen/policy/**` 零改动（spec §2-3 `:29`）；`tools/observation-check/**` 唯一例外 = `card-exempt.mjs` 的 `EXPIRY_LANDED` 置 `true`（spec §2-2 `:28` / §7-⑤ `:183`）。
2. **依赖方向单向**（spec §3 `:69`）：`cardPipeline.mjs` → `card-model/**`（只读出口）+ `components/**` + `vocab/**`；**禁止** `card-model/**` 反向 import 任何 `components/**`（S1 §3 `:52` 的「反向零 import」不变）。
3. **装配唯一入口**（spec §3 `:70`）：`cli.mjs` 的 `generate` / `dump` / `gate` 与测试三者**都只经** `cardPipeline.renderAll()` / `renderSeat()`；不得各自拼渲染参数。
4. **写盘授权链不变**（spec §3 `:71`）：`generate` **保持「只比不写」**（现状 `tools/docgen/cli.mjs:45-81` 一律只比）；角色卡内容变更仍走 `draft` → 用户确认 → `replace --yes`；`docs/agents/**` 只由 `generate --readme --apply` 落盘；`writeAll(artifacts)` 只是这三处**共用实现**，不是新授权入口；`dump` 只 `console.log`、`gate` 只读。
5. **`Card` = S1 全量 12 键**（spec §4 `:79-98`）：`seat` / `name` / `description` / `tools` / `duty` / `scenes` / `signals` / `must` / `never` / `categories` / `checkItems` / `rationale`；缺任一键 → 拒绝渲染（不当空值兜底）。`name` / `description` / `tools` 由 `seatEntry` 派生填入，**不得另存**（PRD `:231`）。
6. **`env` 11 键全部派生**（spec §4 `:92-97` + S1 §6 `:143-144`）：`predicates` = `Object.keys(PREDICATES)`、`landings` = `Object.keys(LANDINGS)`、`subjects` = `SUBJECTS`、`registeredIds` = `registeredIdsOf([本席 card])`、`unboundVars` = `new Set()`；11 键缺一 → `UnverifiableOutput`（S1 判，本段不兜底）。
7. **单席原子**（spec §7-① `:179`）：`renderSeat(seat)` 一次只产 1 卡 + 1 README；该席校验 / 合并不通过 → **零写盘**；`renderAll()` 收口语义 = 15 席全过才写。逐席滚动（spec §8 `:187-195`）下不要求「15 席全过才写」。
8. **数据源单向（F-23）**（spec §3 `:73`）：`renderCard.mjs` / `cardPipeline.mjs` 内**无** `agents/` 读取、无 `readFileSync`；`agents/*.md` 只被 gate 读来比对（V-6 / `S4-TC-I04`）。
9. **零散文单源**（spec §5.1 `:137-145` + V-4 `:204`）：散文只允许落在 `card.rationale`（渲染时过滤）；探针词表**唯一写死处** = `vocab/card-must-fields.mjs` 的 `PROSE_PROBES`，**不得另写第二份词表**；指针词按 S1 同形判定（词 + 后随章节号），**不是裸子串**（假阳性守卫见 `S4-TC-G07`）。
10. **`EXIT` 表承接不新增码**（spec §10-D12 `:225`）：S1 的 36 个脚本码 + 3 个合并码归 **exit 1**，`WeakReason` 不入表（`manual`）；**不动 S1 的码与判据**，只补 `validateAgentData.mjs` 的映射行。
11. **`registeredIds` 派生切换本段不做**（spec §10-D6 `:219`）：`tools/observation-check/registered-ids.mjs` 与本段**零接触**（`S4-TC-I02` 用 `git diff --quiet HEAD` 证）；`SUBJECTS` 只扩登记项，**不回改** S2 侧常量。
12. **称谓口径**（spec §5.2 `:151-155`）：议会席过渡期「议长 / 主持人」**可并用不得混用**；非议会席（`evidence-reader` / `senior-sdet`）一律「主 agent」，两词 0 命中；试点席 `detective-observer` **必须统一为「主持人」**，不得原样搬。
13. **逐席提交、每席门禁绿才下一席**（spec §8 步 3 `:192` + PRD R1 `:92`）：一席一个提交；任一步 `npm run check` 非 0 不得开下一席。
14. **仓门禁基线不钉死**（本 plan 落盘前实跑 2026-10-30）= `# tests 1097` / `# pass 1095` / `# fail 0` / `# skipped 2`、`baseline 37/37`、`0 findings`、`④ markdown 检查通过（318 个文件 / 1416 张表）`、`⑤`/`⑥` 在位、末行 `check 全部通过`。本段每加一个测试文件 / 一个生成物，文件数与表数按实际漂移，**不钉死**。
15. **R8 回扫只认裸命令**：`node scripts/scope-sweep.mjs --check` → `sweep ok`（exit 0）；**禁用** `npm run doc:sweep -- --check`（PowerShell + npm 10.9 吞掉 `--` 后参数、跑默认分支恒 exit 0 = 假绿）。**mtime 时序**：若报「清单早于被扫文件」，为本批**新落**一份当次 `impact-sheet.md`（`scripts/scope-sweep.mjs:88` 固定查该名），**不得改写旧清单凑绿**（先例 = `②→③@S3` / `③@S1` 的增量登记节）。
16. **`V-13`（A/B 盲评）不在本期**：本 plan 与后续 ③ / ④ / ⑤ 门行**不得**引用（`skills/dev-workflow/references/gate-record.md:13` 的 `②@S6` 增量登记）。

## 文件结构

| 路径 | 动作 | 职责（spec §3 `:36-56`） |
|---|---|---|
| `tools/docgen/card-model/vocab/card-must-fields.mjs` | 新建 | `CARD_SEGMENTS`（7 段，顺序 = 渲染顺序）/ `MUST_FIELDS` / `PROSE_PROBES`（三类固定键名） |
| `tools/docgen/card-model/vocab/predicates.mjs` | 新建 | `PREDICATES` = `{ '<id>': { label, impl: 'script'\|'manual' } }` |
| `tools/docgen/card-model/vocab/landings.mjs` | 新建 | `LANDINGS` = `{ '<id>': label }` |
| `tools/docgen/card-model/vocab/shared-actions.mjs` | 新建 | `SHARED_MUST` / `SHARED_NEVER`（`Action[]`）/ `SHARED_USE`（`{ '<seat>': ['<actionId>', …] }`，白名单） |
| `tools/docgen/card-model/subjects.mjs` | 修改 | `SUBJECTS` 追加 15 席登记项（形态 `<seat>.card`），**保留**两项产物侧（spec §4 `:94`） |
| `tools/docgen/components/cardPipeline.mjs` | 新建 | `buildCards` / `buildEnv` / `renderSeat` / `renderAll` / `writeAll`（**唯一装配点**） |
| `tools/docgen/components/renderCard.mjs` | 新建 | 卡面投影（7 段 + front matter，零散文） |
| `tools/docgen/components/renderReadme.mjs` | 新建 | README 投影（每席一份 + index + 覆盖记录表） |
| `tools/docgen/components/outputFormats.mjs` | 修改 | 散文块 → 结构化合同 `{ outputKind: { fields[], checks[] } }`（5 个 kind，含新增 `testcase`） |
| `tools/docgen/templates/agent-card.md.tpl` | 新建 | 7 段模板（占位符 + 3 行模板常量：三值字面量 / 冲突裁决 / 缺答 = 不合格骨架） |
| `tools/docgen/components/renderByName.mjs` | 修改 | 加 `card` 分支 → `renderCard`；旧分支保留到收口（spec §7-⑥ `:184`） |
| `tools/docgen/components/validateAgentData.mjs` | 修改 | `BASE_KEYS` 容 `card`；断言 8（description 派生）只判未迁移席；`EXIT` 表补 S1 码分组（exit 1） |
| `tools/docgen/cli.mjs` | 修改 | `generate --readme --apply` 落 `docs/agents/**`；新增 `dump --name <seat>`（stdout-only）；`collectGate` 扩 `docs/agents` 比对面；`touchedSemanticKeys` 段名表加「职责」 |
| `docs/agents/README.md` + `docs/agents/<seat>.md` ×15 | 新建（生成物） | 人读视图（index 五列 + 每席 rationale + 覆盖记录表） |
| `agents/*.md` ×15 | 重生成 | 卡面（AI 读）；逐席滚动，试点席先行 |
| `tools/docgen/test/card-render.test.mjs` | 新建 | 常驻测试：helper（testcase §0.3 逐字）+ 61 条用例 |
| `tools/execution-matrix/criteria.md` | 修改 | A1 / A2 的「判定对象」行迁到「职责」段（D11） |
| `docs/prd/20261026205821-agent-card-contract.md` | 修改 | §3.7 段表**表内插**「输出格式」行 + `:239` 单源说明对齐 + `:293` 省略号收敛（D1 / D5） |
| `rules/docs-convention.md` | 修改 | 目录表补 `docs/agents/` 一行（D2） |
| `tools/docgen/templates/agent.md.tpl` / `agent-handwritten.md.tpl` | 删除（收口） | 旧模板退场（D8 / PRD D-05 `:500`） |

## 接口小节（模块导出面，唯一契约）

```text
vocab/card-must-fields.mjs   CARD_SEGMENTS(7) / MUST_FIELDS / PROSE_PROBES { oldSegments[], declaration[], pointers[] }
vocab/predicates.mjs         PREDICATES（{ id: { label, impl } }）
vocab/landings.mjs           LANDINGS（{ id: label }）
vocab/shared-actions.mjs     SHARED_MUST / SHARED_NEVER / SHARED_USE
subjects.mjs                 SUBJECTS（15 席 + 2 产物侧，登记表非封闭枚举）
cardPipeline.mjs             buildCards() → [{ seat, card, overrides[] }]
                             buildEnv(seat, cards) → 11 键（S1 §6 :143-144）
                             renderSeat(seat) → { card, readme }
                             renderAll() → { cards[], readmes[], index }
                             writeAll(artifacts) → { ok, wrote, errors }（逐文件 .tmp-<pid> → 全成功再 rename）
renderCard.mjs               renderCard(card, env) → string（7 段 + front matter）
renderReadme.mjs             renderReadme(card, overrides) → string；renderIndex(cards) → string
outputFormats.mjs            outputFormats = { audit|issue-card|observation|evidence|testcase: { fields[], checks[] } }
```

- **形状未写死处的处置**（testcase §7 缺口 12–15，P2）：`writeAll(artifacts)` 的 `artifacts` 元素、`outputFormats.checks[]` 元素、README 覆盖表 `changed` 列、`SHARED_USE` 缺省语义，spec **均未写死**。本段取**测试判据要求的最小形状**（`S4-TC-B06` 只断三列非空、`S4-TC-D01` 只断非空数组 + 无指针 / 无散文、`S4-TC-E05` 按**白名单**读法）；**只作内部形状**，不改任何已签判据。若施工中发现与 spec 某条判据冲突 → **回 ② 段补 spec 一行**（R4），不在本文件补设计（见 `K-6`）。
- **`gate` 比对面的口径陷阱**（实测）：`collectGate()`（`tools/docgen/cli.mjs:84-126`）现在打印 `baseline ${BASELINE_RULES.length + agentPaths().length}/${…}`（`:79` / `:151`），而 `scripts/check-all.mjs:138` / `:148` 用**同一派生值**断言该行。把 `docs/agents/**` 塞进 `BASELINE_RULES` / `agentPaths()` 会让该值从 **37 变 53** 并一起改 `baseline.json`——属越界。故 `docs/agents` 必须在 `collectGate()` 内以**独立派生面**比对（`docs/agents` 侧 = 席数 + 1 = **16 份**；全集 = `2×席数 + 1` = **31 份**），`baseline 37/37` 一字不变（`S4-TC-F01` / `S4-TC-F04` 的派生式亦按此口径）。

---

## 计划门（②→③，开工前签）

> 判据出处：`skills/dev-workflow/references/stage-2b-plan-gate.md`（三条核对 `:16-36`，三权 `:44-50`，收口 `:62-65`）。本门**不设议会**；**申报人 = 主 agent（plan 作者）**，**签字人 = 独立审计实例**（`agents/reviewer-audit.md` 角色卡 path B 贴入，未参与写 plan）——R2：主 agent 不得自签。
>
> 下表是**申报人预填**（供审计对照），**结论以审计本人读 plan 后独立复算为准**；审计只签字不读 = 不通过（`stage-2b-plan-gate.md:49`）。

### 核对一：功能点全覆盖（= 功能点 → 任务映射表）

| 功能点 | 一句话（PRD `:473-476` / `:487`） | 本 plan 落点 | 覆盖用例（附录 A） |
|---|---|---|---|
| F-09 | 卡面零散文 + 自足（`PointerToElsewhere`；`rationale` 只进 README） | Task 1、Task 2、Task 3 | A01–A08、D01–D04、G01、G02、G04、G05、G07 |
| F-10 | 一份数据三投影（卡面 / README 每席一份 + 自动 index / dump stdout-only） | Task 2、Task 7 | B01–B08、D05、E01–E05、G03、J01–J03 |
| F-11 | 全席重生成（**落地时点的 `agents/*.md` 全集**，当前 15；先 detectives 试点对照稿，再铺满） | Task 5、Task 6、Task 7 | H01–H03、F01、F08 |
| F-12 | 称谓口径（议会内过渡期可并用、不得混用；议会外主 agent） | Task 2、Task 5、Task 6 | C01–C06 |
| F-23 | 卡面数据源落点 + 手改生成物的告警 | Task 2、Task 3、Task 7 | I01–I04、F02–F07、F09、F10 |

- **PRD 侧集合**：`--stage S4` 命中 1 行 = `F-09～F-12、F-23`（`PRD:544` 的 F→S 覆盖表），区间展开后 **5 个**。
- **取集合命令**（cwd = 仓根，脚本即判）：
  ```powershell
  node scripts/check-plan.mjs coverage --plan docs\superpowers\plans\2026-10-30-agent-card-s4-render.md --prd docs\prd\20261026205821-agent-card-contract.md --stage S4
  ```
- **Expected**：首行 `coverage: gap 0（prd 5 / plan 5）steps ok => ok`，exit 0。
- **第二半**（每个被覆盖的功能点至少一条执行步骤）：上表 5 行的「本 plan 落点」均为**存在的 Task**（Task 1–7），无悬空。

### 核对二：依赖无环

- **节点**：7 个（`## Task 1:` … `## Task 7:`）。
- **边集**（每个 Task 的 `Consumes:` 只指更小编号或本段已完成的兄弟任务）：

| Task | 指向 | 边 |
|---|---|---|
| T1 | 无 | — |
| T2 | T1 | T1→T2 |
| T3 | T2 | T2→T3 |
| T4 | 无（纯上游文档面，可最先做） | — |
| T5 | T2、T3 | T2→T5、T3→T5 |
| T6 | T5 | T5→T6 |
| T7 | T2、T4、T6 | T2→T7、T4→T7、T6→T7 |

- **拓扑序**：`T1, T2, T3, T4, T5, T6, T7` 可完成；**回边 0**（**8** 条边：T2 1 / T3 1 / T5 2 / T6 1 / T7 3）。
- **取命令**：
  ```powershell
  node scripts/check-plan.mjs deps --plan docs\superpowers\plans\2026-10-30-agent-card-s4-render.md
  ```
- **Expected**：首行 `deps: cycle 0 dangling 0（nodes 7 / edges 8） => ok`，exit 0。
- **R4 抽查**（本文件**无** `## 新增设计决策` 节）：
  ```powershell
  (Select-String -Path docs\superpowers\plans\2026-10-30-agent-card-s4-render.md -Pattern '^## 新增设计决策').Count
  ```
  期望 `0`。

### 核对三：功能块 ↔ testcase 一一映射

- **一个功能块**（S4）对应**一份** testcase：`docs/superpowers/specs/2026-10-29-agent-card-s4-render-design-testcase.md`（61 条）。
- **双向**：testcase 的 61 个 ID ↔ 附录 A **61 行**，`missing` / `dangling` 均 0；逐 ID 落点见**附录 A**。
- **取命令**：
  ```powershell
  node scripts/check-plan.mjs map --plan docs\superpowers\plans\2026-10-30-agent-card-s4-render.md
  ```
- **Expected**：首行 `map: missing 0 dangling 0（cases 61 / mapped 61） => ok`，exit 0。
- **规模（同门附核，`size` 不计入三条核对）**：
  ```powershell
  node scripts/check-plan.mjs size --spec docs\superpowers\specs\2026-10-29-agent-card-s4-render-design.md --testcase docs\superpowers\specs\2026-10-29-agent-card-s4-render-design-testcase.md --rounds 3
  ```
  **Expected**：`size: spec 245/350 tc 61/80 rounds 3/3 => ok`，exit 0（**已实跑，2026-10-30**）。`rounds` = 3 取自议会 #2 轮次账（该账 2 轮 + 上一段交接的轮次计法，最大值取 3 仍 ≤ 3，不写「预期值」）。

### 签行（待签，2026-10-30）

> 结论与证据原文由独立审计实例写入 `skills/dev-workflow/references/gate-record.md` 的 `②→③@S4-render` 行（本文件不复抄）。本门「过」= 可进 ③，不等于 ③ 已施工。

---

## 存量 spec 豁免点名（`spec-testcase-gate`，进 ③ 必点）

> 出处：`rules/dev-workflow-mainline.md`「例外」节——进 ③ 必须在 plan 或交接材料里点名两件事。

1. **豁免的存量 spec（2026-10-18 之前定稿，共 25 份）**：`2026-09-27-retro-suite-design.md`、`2026-09-28-evolving-skills-design.md`、`2026-09-28-evolving-step3-design.md`、`2026-09-28-l3-l4-promotion-design.md`、`2026-09-29-aas-skill-deps-design.md`、`2026-10-01-retro-flywheel-blueprint.md`、`2026-10-01-retro-self-improvement-design.md`、`2026-10-02-session-dir-layout-design.md`、`2026-10-07-moment-context-and-timeline-design.md`、`2026-10-08-rule-optimizer-design.md`、`2026-10-09-global-ask-rewrite-design.md`、`2026-10-09-rule-suite-design.md`、`2026-10-09-rule-type-scoring-design.md`、`2026-10-09-skill-authoring-design.md`、`2026-10-09-use-rule-skills-design.md`、`2026-10-10-review-branch-design.md`、`2026-10-10-review-loop-l3-project-type-design.md`、`2026-10-10-rules-migration-design.md`、`2026-10-11-type-rules-external-design.md`、`2026-10-14-execution-assurance-design.md`、`2026-10-14-review-loop-evolution-design.md`、`2026-10-15-cognitive-rule-landing-gate-design.md`、`2026-10-15-verification-audit-checklist-design.md`、`2026-10-17-parliament-design.md`、`2026-10-17-systematic-repair-design.md`（目录 `docs/superpowers/specs/`；取数 `(Get-ChildItem docs\superpowers\specs\*.md | Where-Object { $_.Name -lt '2026-10-18' }).Count` → **25**，2026-10-30 实跑）。
2. **升级时点（事件型，可核）**：上述任一份 spec **下一次被修订并进入 plan 的那一刻**——那一刻必须先补同目录 `<名>-testcase.md`，否则按 `spec-testcase-gate` 打回。**S4 自身的 spec / testcase 于 2026-10-29 定稿，不在豁免内**（本 plan 消费的两件均已过议会 #2）。

---

## 遗留与留观（登记，不单开任务、不改判据）

来源 = `docs/handoffs/2026-10-30-agent-card-s4-plan.md`「遗留裁决与留观项」+ `docs/after/20261029204752-agent-card-s1-open-items-open-decisions.md` + 本段实测。

| # | 项 | 现状 | 触发信号 / 收敛时机 |
|---|---|---|---|
| K-0 | Task 粒度与 D11/D12 拆分 | **用户 2026-10-30 已裁定**：按块 **7 Task**；D11/D12 代码侧与上游文档侧**拆两个 Task**（= 本 plan 的 Task 3 / Task 4）；plan 落盘后 `git add -N` 留基线 | 已处置，不再讨论 |
| K-1 | `O-4`：PRD `:293` 的 `'…'` 省略号 | 开 | **Task 4** 同批收敛为「15 席 + 2 项，登记表非封闭枚举」（spec §10-D5 `:218`） |
| K-2 | `O-12`：`registeredIds` 单源切换 | **本段不做**（spec §10-D6 `:219`） | S2/S3 修订时先建 observation-check 自己的 `CHECK_ITEMS` 载体 |
| K-3 | `O-13` / `C-08`：15 卡豁免窗口 | 开 | **Task 7**：`EXPIRY_LANDED = true`（spec §10-D7 `:220`） |
| K-4 | `O-15`：`scripts/check-plan.mjs:229` 的 B 载体正则会数「F 对位」行 | 已登记 | 附录 A 首列**只放用例 ID**、F 编号单列第 3 列（否则 `map` 的 cases 虚高）；修脚本 = 下次修订该脚本或 testcase 时两侧同批 |
| K-5 | `O-16`～`O-19`：`ALLOWED_OPS` 无封闭表 / `id`+`label` 混写 / `HARDCODED_COUNT` 收窄 / `mergeActions` 零差异字段面 | 均为 spec 侧空白 | 本段**不触碰** `mergeActions` / `HARDCODED_COUNT` 的判定面（只调用），故四条继续留观 |
| K-6 | testcase §7 缺口 12–15（`writeAll(artifacts)` / `checks[]` / `changed` / `SHARED_USE` 缺省语义） | 开（P2） | **Task 2 首次构造该形状时**按「接口小节」的处置写死；若与 spec 判据冲突 → 回 ② 段（R4） |
| K-7 | **称谓计数口径**（不是与 spec 的差异）：`agents/detective-observer.md` 实测 `Select-String '议长\|主持人'` = **8 行**（议长 1 行 / 主持人 7 行；「主持人」**出现 8 次**，其中一行含两处） | 与 spec §5.2 `:154` 的「主持人 ×7」**同口径（行数）**，无差异 | 本段材料一律按**行数**写（8 行），不按出现次数写；spec 原文不改 |
| K-8 | `scripts/check-all.mjs:418` 的 `[豁免窗口]` 行末句「（S1 未上线：非达标证据）」 | 置 `true` 后该措辞失效（判据只认含 `EXPIRY_LANDED=true`，spec §7-⑤ `:183`） | 不改（spec §2-5 `:31` 只要求到期事件）；触发 = 下次改 `check-all.mjs` 时同批改文案 |
| K-9 | `scripts/check-all.mjs:416` 的 `cardFindings` 仍硬编码 `[]`（卡面 findings 源未接线） | 本段**不接线**（spec §2-5 `:31`） | 归下一段（S4 之后独立接线任务），本段只在 ④ 段结论里写明「卡面 findings 非达标证据」 |
| K-10 | 旧模板 9 处 `.mjs` 引用（`tools/docgen/cli.mjs:40` / `tools/docgen/acceptance/render13-snapshot.mjs:24` / `tools/docgen/components/agentData.mjs:247` / `tools/docgen/components/renderByName.mjs:29` / `tools/docgen/test/evidence-reader.test.mjs:17` / `tools/docgen/test/pilot-render.test.mjs:34` / `tools/docgen/test/sdet-template.test.mjs:6`、`tools/docgen/test/sdet-template.test.mjs:56` / `tools/docgen/test/tool-tiers.test.mjs:30`；取数 `Get-ChildItem tools\docgen -Recurse -Filter *.mjs \| Select-String -Pattern 'agent\.md\.tpl\|agent-handwritten\.md\.tpl'` → **9**） | 开 | **Task 7** 逐处处置（测试类改断新渲染器等价面，**不得删断言换绿**）；`tools/docgen/components/agentData.mjs:247` 的 `sourceLine` 随旧模板删（spec §7-⑥ `:184`） |
| K-11 | 15 席逐席迁移必然打断引用该席数据的常驻测试（PRD `:92` R1） | 开 | **每席迁移前**先取清单：`Get-ChildItem tools\docgen\test -Filter *.test.mjs \| Select-String -Pattern '<seat>'`；同批更新为交付物，逐席绿才下一席 |
| K-12 | 每席 `replace` 在 `change` 段要求 `--expect-change` + `--rejudge`（`touchedSemanticKeys` 命中 A1/A2）+ `DOCGEN_JUDGED_BY`（`tools/docgen/cli.mjs:454-475`） | `rules/.inspector-annotations.json` 现值 15 席 × 10 键**全 `pass`**（旧卡判定） | 每席由**独立实例**按新卡重判 A1/A2 并写回（值可仍为 `pass`，但必须基于新卡），再跑 `replace`；这是授权链的后果，不是新增流程 |
| K-13 | `SUPPORTED` 之外的描述形态：`patternRegistry.description` 的两个派生分支（`patternRegistry.mjs:44-45`） | 新卡不用；旧分支留到收口 | **Task 7** 收口后若全仓无引用即删（spec §11-4 `:234`） |
| K-14 | `SUBJECTS` 的 17 条里 `reviewer-detective.card` 与席名 `detective-observer` 不同名（前者是 PRD `:293` 的示例名）；**代码评审曾判它为「同席双登记」并建议删** | **不删**：spec §4 `:94` 写死「**15 席 + 2 项产物侧**」= **17** 条（取数 `Object.keys(SUBJECTS).length` → 17），删到 16 条即违已签 spec；改名则要动 spec（R4） | 维持 17 条；改/删须**回 ② 段改 spec :94 与 PRD `:293`**，本段不动。④ 段须以「已核、按 spec 保留」入账，不得记成「漏修」 |
| C-1～C-5 | S1 议会候选（全 P2，非 S4 阻断项） | 已登记 | `C-4`（基线快照）已由 K-0 的 `git add -N` 承接；其余见原账 |

---

## Task 1: 数据层骨架（4 个 `vocab/` 表 + `SUBJECTS` 扩席 + `outputFormats` 结构化）

**Files:**
- Create: `tools/docgen/card-model/vocab/card-must-fields.mjs`
- Create: `tools/docgen/card-model/vocab/predicates.mjs`
- Create: `tools/docgen/card-model/vocab/landings.mjs`
- Create: `tools/docgen/card-model/vocab/shared-actions.mjs`
- Modify: `tools/docgen/card-model/subjects.mjs`（只追加登记项，不改三入口）
- Modify: `tools/docgen/components/outputFormats.mjs`
- Create: `tools/docgen/test/card-render.test.mjs`（helper 的**已存在模块子集** + 5 条用例）

**Interfaces:**
- Consumes: 无（判据全在 spec §3 `:58-65`、§5.1 `:123-145`、§6 `:157-173`、§4 `:94`）
- Produces: 4 个 `vocab/` 模块的 **8 个导出名**（`CARD_SEGMENTS` / `MUST_FIELDS` / `PROSE_PROBES` / `PREDICATES` / `LANDINGS` / `SHARED_MUST` / `SHARED_NEVER` / `SHARED_USE`）+ `SUBJECTS` 的 15 席登记项 + `outputFormats` 的 5 个 kind 结构化合同

- [ ] **Step 1: `card-must-fields.mjs` 三段表 + 探针三类**

`CARD_SEGMENTS` = spec §5.1 主表（`spec:123-132`）首列去掉 `front matter` 后的 **7 段**（顺序 = 渲染顺序）：职责 / 一定会 / 禁止 / 冲突裁决 / 本席清单 / 输出格式 / 边界。`MUST_FIELDS` = 「一定会」必渲染的 5 字段名（`trigger` / `objects` / `criterion` / `landing` / `requires`，`spec:127`）。`PROSE_PROBES` = **三个固定键名** `{ oldSegments: string[], declaration: (string|RegExp)[], pointers: string[] }`（`spec:62`）：
- `oldSegments` 5 词 = 共享特质 / 通用纪律 / 固定必问 / 自由探索 / 你是谁（`spec:141`）；
- `declaration` = `声明：` / `心算` / `代填` / `必由.*本人`（RegExp）/ `注：`（`spec:142`）；
- `pointers` = S1 `POINTER_WORDS` 5 词（见 / 详见 / 参见 / 参考 / `按 §`，`spec:143` 指向 S1 §7 `:188`；**引用 S1 常量不加副本**——若 S1 已导出则 import，未导出则在**本文件**写一份并注明「S1 `enums.mjs:POINTER_WORDS` 的镜像，S1 不改」，两者同值时 A07 与 G07 都绿）。

全部 `Object.freeze`；**不得**写第二份词表（V-4 只认本文件）。

- [ ] **Step 2: `predicates.mjs` 与 `landings.mjs` 登记表骨架**

`PREDICATES = { '<id>': { label, impl: 'script'|'manual' } }`、`LANDINGS = { '<id>': label }`（`spec:63-64`）。**初始条目 = 共享 `must` 行的判据 id + 试点席（`detective-observer`）所需的全部 id**；其余席的条目由 Task 5 / Task 6 逐席追加（追加时**同步检查** `env.predicates` 未登记即被 S1 报 `MissingCriterionImpl`，`spec:92`）。`impl` 只取 `'script'` / `'manual'` 两值（`WeakReason` 一类 manual 码不入脚本面，PRD `:216`）。

- [ ] **Step 3: `shared-actions.mjs` 共享层单源**

`SHARED_MUST` / `SHARED_NEVER` = `Action[]`（S1 §4 `:68-72` 形状：`id` / `kind` / `trigger` / `objects[]` / `criterion` / `landing` / `requires[]`）；`SHARED_USE = { '<seat>': ['<actionId>', …] }`，**是白名单**（未出现的席不合并任何共享句，`S4-TC-E05` 按此读法）。内容来源 = 旧 `agent.md.tpl:12-29` 的「共享特质」(`:12-13`) 与「通用纪律」(`:24-29`) 逐句映射（探索稿 §12.6 `:419-428` 的句表），**判据 id 在源码里每条只出现 1 次**（`S4-TC-E01`）。同判据意图的句子合成一条，不按旧卡逐席复制（这是 F-09 的治本点）。

- [ ] **Step 4: `subjects.mjs` 追加 15 席登记项**

在 `SUBJECTS`（`subjects.mjs:8-11`，现值 2 项产物侧）**追加** 15 条 `'<seat>.card'` 登记项（形态写死，`spec:94`；例 `reviewer-audit.card`），`display` = 卡名、`validator` = `nonEmptyObject`。**保留**两项产物侧、**不动** `SUBJECT_VALIDATORS` / `subjectMatches` / `verdictAllowed` / `compareVerdicts`（S1 判据一字不动）。**15 条按字面逐条追加、不从 `agentData` 派生**：`card-model/**` 只许 import `node:` 与目录内相对路径（Global 2 / `spec:69`；S1 的 `tools/docgen/test/card-model.test.mjs:1249-1256` 已断言该目录无反向 import），故派生式会破 V-6；席名漂移由 `S4-TC-G01`（15 席 subject 全为 `<seat>.card`）兜底。

- [ ] **Step 5: `outputFormats.mjs` 由散文改结构化**

现状 4 个键（`audit:2` / `'issue-card':52` / `observation:73` / `evidence:85`），**无** `testcase`；`outputKind` 枚举 5 值（`patternRegistry.mjs:54`）。改法（spec §6 `:166-171` 逐行）：
- 每个 kind = `{ fields: [...], checks: [...] }`，`fields` = 必填字段名（来自原散文里的表头 / 字段说明），`checks` = 可执行校验项（**写「跑哪条命令 + 什么算失败」**，`S4-TC-D02` 的正则要求 `testcase` 块含量词与命令）；
- `audit` 块 4 段声明（`:2-4` / `:21` / `:25`）里**有判据含义**的（证据栏空 = 不通过、代填 = 无效）→ 提到共享 `must` / `never`（Task 1 Step 3 已建）；纯解释（「心算必错，实测数错 3 次被拦」）→ README `rationale`（内容随席迁移，Task 5 / 6 落）；
- `audit` 块引 `references/doc-taxonomy.md` 的那行（`:40`）→ 改为 `checks[]` 一条（「交付物完成判据核对」+ 落点），**卡面不得带指针**（`S4-TC-D03`）；
- `evidence` 块 `:87` 的「固定必问清单」句**删除**，语义并入 `evidence` 席的 `must`（spec §6 `:170`）；
- **新增** `testcase:` 块（7 节必含 + 校验命令，口径单源指 `rules/spec-testcase-gate.md`，卡面只写「跑哪条命令 + 什么算失败」，`spec:171`）；
- **禁**：`outputFormats` 复制进每席数据（`S4-TC-D05`）。

- [ ] **Step 6: 测试文件 helper（testcase §0.3 的**已存在子集**）+ 3 条用例**

helper 按 `testcase:64-216` 逐字落，**import 段只列本任务已存在的模块**（`MF` / `PRED` / `LAND` / `SH` / `OF`；`PIPE` / `renderCard` / `CM` / `checkStruct` / `touchedSemanticKeys` / `exitCodeFor` / `card-exempt` 由 Task 2 / 3 补，末态必须等于 §0.3）。本任务的 helper 面：`SPEC_LINES` / `specLine` / `cellsOf` / `specTableStrict` / `SPEC_SEGMENTS` / `SPEC_7` / `SEGS` / `MUST_FIELDS` / `VOCAB_EXPORTS` / `VOCAB_NS` / `PROBE_CLASSES` / `PROSE_PROBES` / `POINTER_FORM` / `probeSrc` / `hitClass`。

| ID | 断言（判据出处） |
|---|---|
| S4-TC-A07 | 4 个 `vocab/` 命名空间**恰为 8 个导出名**：多一 / 少一 / 改名各构造一次必红（`testcase:519` / `spec:58-65`） |
| S4-TC-D01 | 5 个 kind 键集 = `patternRegistry.outputKind`（5 值）且每份 `fields[]` / `checks[]` 均非空数组；**无指针**（`spec:161-171`） |
| S4-TC-D02 | `testcase` 块在位，`checks[]` 里能匹配到「命令 + 失败条件」（`testcase:977` / `spec:171`） |

> 施工期落点更正（**非判据级**）：`S4-TC-D04` 与 `S4-TC-E01` 均需**渲染后的卡面**（前者扫卡面「输出格式」段、后者断「每条共享句至少被一席渲染」），本任务尚无 `renderCard` / 无迁移席 → 分别下移到 Task 2 / Task 7（附录 A 已同步）。

- [ ] **Step 7: 跑测试与仓门禁**

```powershell
node --test "tools/docgen/test/card-render.test.mjs"; "exit=$LASTEXITCODE"
npm run check; "exit=$LASTEXITCODE"
```

Expected：`exit=0`、`# fail 0`、`# pass + # skipped === # tests`；本文件 `test('S4-TC-` 计数 = **3**；`check` 末行 `check 全部通过`（`baseline 37/37` 不变——本任务不新增生成物）。

---

## Task 2: 装配与三投影（`cardPipeline` / `renderCard` / `renderReadme` / `dump` / 模板 / gate 扩面）

**Files:**
- Create: `tools/docgen/templates/agent-card.md.tpl`
- Create: `tools/docgen/components/renderCard.mjs`
- Create: `tools/docgen/components/renderReadme.mjs`
- Create: `tools/docgen/components/cardPipeline.mjs`
- Modify: `tools/docgen/components/renderByName.mjs`（`card` 分支 → `renderCard`；旧分支保留）
- Modify: `tools/docgen/components/validateAgentData.mjs`（`BASE_KEYS` 容 `card`；断言 8 只判未迁移席）
- Modify: `tools/docgen/cli.mjs`（`dump` 子命令 + `generate --readme --apply` + `collectGate` 扩面）
- Modify: `tools/docgen/test/card-render.test.mjs`（补 import + 32 条）

**Interfaces:**
- Consumes: Task 1（4 个 `vocab/` 表、`SUBJECTS` 15 席、`outputFormats` 结构化）
- Produces: `buildCards()` / `buildEnv(seat, cards)` / `renderSeat(seat)` / `renderAll()` / `writeAll(artifacts)`；`renderCard` / `renderReadme` / `renderIndex`；`cli.mjs dump --name <seat>`；`generate --readme --apply`（落 `docs/agents/**`）

- [ ] **Step 1: `agent-card.md.tpl` 7 段模板 + 3 处模板常量**

段顺序 = `CARD_SEGMENTS` 7 段；占位符一份（`{{NAME}}` / `{{DESCRIPTION}}` / `{{TOOLS}}` / `{{DUTY}}` / `{{MUST_TABLE}}` / `{{MUST_CONST}}` / `{{NEVER_TABLE}}` / `{{CONFLICT}}` / `{{CHECK_TABLE}}` / `{{OUTPUT_FORMAT}}` / `{{BOUNDARY}}`）。**三行常量写死在模板**（15 卡同源 1 处，`spec:127-129`）：
- 「一定会」表头 = `| # | 必问（must） | 触发 | 宾语 | 判据 id | 落点 | 前置 |`（满足 A3 的「必问」列头，`check-agent.mjs:66-70`）；
- 「一定会」节首骨架行含 `缺答 = 不合格`（`check-agent.mjs:73` 的 `CLOSURE_RE`，满足 A4）；
- 「冲突裁决」三行：优先级 `用户 > 规则 > 本席`；采纳 / 不采纳 + 认输判据（`spec:129`）。
**禁**：模板内出现任何 `{{XXX}}` 未被填充（`renderAgent.mjs:45-49` 已有 `MissingSlot` 守卫，`renderCard` 同形）。

- [ ] **Step 2: `renderCard.mjs`（卡面投影，零散文）**

入参 `(card, env)`，出 7 段 + front matter 字符串；三条硬约束：① `description` = `trigger.when`（+ `notWhen.text` 存在时附「不用于：…」，`spec:151`；**不派生**「在…中担任」，`S4-TC-C01`）；② `rationale` **不渲染**（`S4-TC-A06`）；③ 「一定会」每行 = `trigger.scene`(id+moment) / `objects` / `criterion` / `landing`（枚举字面值 + 变量名，不渲染运行时值）/ `requires`，加三值字面量 `hit` / `miss` / `na` 各一行 + `reason` 字段名（`spec:127`）；「禁止」每行 = `objects` + `criterion`（`spec:128`）；「本席清单」= `categories` label + `checkItems` 的 `id` + `criterion` 文字 + `check` 类型（`spec:130`）；「输出格式」从 `outputFormats[card.outputKind]` 渲结构化表（`spec:131`）；「边界」= `tools` + `boundaryBySeat`（`spec:132`）。
**零散文机械口径**（`spec:135`）：渲染前对 `card` 的所有文本字段跑 `PROSE_PROBES` 三类，命中即 `fail`（码沿用 S1 的 `PointerToElsewhere` / `HardcodedCount`，不新增码）；`rationale` 不参与扫描（它就是散文的合法落点）。

- [ ] **Step 3: `renderReadme.mjs`（README 投影 + index + 覆盖记录表）**

`renderReadme(card, overrides)`：每席一份，含 `rationale`（`MissingRationale` 若缺，S1 判）+ **覆盖记录表**（表头三列 `id` / `changed` / `reason`，行数 = `overrides` 条数，0 条时表头仍在，`S4-TC-B06`）。`reason` **取自本席 `own` 动作条目自身的 `reason`**（`merge.mjs:63` 的 `overrides[]` 只带 `{id, changed}`；无 `reason` 的覆盖已被 S1 `OverrideWithoutReason` 拒掉，`spec:119`）。`renderIndex(cards)`：五列（席名 / 职责一句 / 维度 / 输出类型 / 链接，`spec:54`）+ 每席一行。

- [ ] **Step 4: `cardPipeline.mjs`（唯一装配点）**

`buildCards()`：对每席 `seatEntry.card` 先用 `mergeActions(SHARED_MUST/NEVER 按 SHARED_USE 取, own)` 合并 → 填 `name` / `description`（= `trigger.when`）/ `tools`（= `toolsForSeat`）→ 返回 `[{ seat, card, overrides[] }]`；**12 键缺一 → 抛 S1 码并 exit 1**（`spec:98`）。
`buildEnv(seat, cards)`：11 键全派生（Global 6）。
`renderSeat(seat)`：内存里产 `{ card, readme }`；该席 `mergeActions` / `validateCardModel` 任一 errors → **零字节产出**（`spec:98`）。
`renderAll()`：15 席全量 → `{ cards[], readmes[], index }`（**内存产物、未写盘**）。
`writeAll(artifacts)`：全内存 → 逐文件 `.tmp-<pid>` → **全成功再 rename**；任一失败 → 清 tmp + `{ ok:false, wrote:false, errors }`（PRD §4.2 ④ `:319`）。`artifacts` 元素形状 = `{ path, bytes }`（spec 缺口 12，见 `K-6`；只作内部形状）。
**数据隔离**：本模块**不得** `readFileSync`、不得引用 `AGENTS_DIR`（`S4-TC-I04`）。

- [ ] **Step 5: `validateAgentData.mjs` 兼容双形态 + `renderByName` 分支**

① `BASE_KEYS`（`validateAgentData.mjs:117-118`）追加 `'card'`；`HANDWRITTEN_KEYS`（`:119`）随旧模板保留到收口。② 断言 8（`:66-79`，description 派生 + `domain` 包含）**改为只判未迁移席**（`!(a && a.card)`）；新卡走 `trigger.when` 直出（D3），由 `S4-TC-C01` 断。③ 断言 5（`sharedBlock` 枚举）与断言 15 的旧键校验保留到 Task 7（逐席滚动期新旧共存）。④ `renderByName.mjs`：`agent.card ? renderCard(buildEnv…, card) : renderAgent(旧模板)` —— 旧分支在 Task 7 删。
**为什么必须双形态**：`state.json` 15 席已全 `replaced`（`state.json:4-18`），若 T2 一次性改掉全部渲染式，14 张未迁移卡立刻 `Mismatch`（`tools/docgen/cli.mjs:104-112`），逐席滚动（spec §8 `:192`）就无从落地。

- [ ] **Step 6: `cli.mjs` 三处接线（授权链不变）**

① 新增 `dump`（`main` 的 sub 分支 + `cmdDump`）：`renderAll()` 后按 `--name` 取合并后全量 JSON，`console.log`，**不落盘、不调 `writeAll`**（`S4-TC-B07`）；未知旗标一律 `InvalidArgs`（沿用 `tools/docgen/cli.mjs:508-535` 的严格白名单形）。
② `generate` 加 `--readme --apply` 两旗标：只写 `docs/agents/**`（16 份：`README.md` + 15 席），走 `writeAll`；**无旗标时保持只比不写**（`S4-TC-F01` / `F02`）。
③ `collectGate()` 扩面：对 **15 卡 + 15 席 README + index（31 份）** 逐字节比对（缺文件 → `DanglingBaselineEntry`，不符 → `Mismatch`；`spec:181`）。**必须**以独立派生面实现（见「接口小节」的口径陷阱），`baseline 37/37` 不变。
④ `docs/agents/**` 不得触发 `UnregisteredHandwritten`（`tools/docgen/cli.mjs:120-124` 只扫 `agents/` 与 `rules/`，本段**不动**该扫描面，`S4-TC-J03`）。

- [ ] **Step 7: 测试（32 条）**

helper 补齐 `PIPE` / `renderCard` / `CM` / `checkStruct` / `TARGETS` / `RS` / `CARD` / `ALL` / `readmeOnDisk` / `TERM_RE` / `DERIVED_DESC_RE` / `WRITE_ALL` / `walkFiles` / `runNode` / `runCli` / `coldRepo` / `mutCard` / `INJECT_BAD` / `APPEND_ONE_BYTE`（`testcase:105-260` 逐字）。

| ID | 断言（判据出处） |
|---|---|
| A02 | `Card` **12 键**逐键删除 → 12 次均经 `CM.validateCardModel` 被拒（`testcase:385` / `spec:89`） |
| A03 | 段名 / 段序逐项 = `CARD_SEGMENTS`；多段 / 删第 4 段 / 换序各红（`testcase:415`） |
| A04 | `checkStruct(卡面)` → `findings: []`（A3–A7 全绿，`testcase:445`） |
| A05 | 四处变异（表头行定位）各只红一码（`testcase:466`） |
| A06 | `rationale` 文本不进卡面、进 README（`testcase:496`） |
| B01 | 同一 `renderSeat()` 的 card / readme / dump 对同一字段逐字一致（`testcase:577`） |
| B02 | 改数据 1 处 → README / dump 跟随、卡面按设计不变（`testcase:603`） |
| B04 | index 表头五列齐（`testcase:660`） |
| B05 | `overrides[]` 每条带非空 `reason`（`testcase:679`） |
| B06 | README 覆盖表行数 = `overrides` 条数（0 条时表头仍在，`testcase:715`） |
| B07 | `dump` stdout-only：可 `JSON.parse`、不落盘、不调 `writeAll`（`testcase:741`） |
| B08 | 覆盖 `reason` 取自 own（不 join 即红）；无 reason → `OverrideWithoutReason` 且拒绝渲染（`testcase:771`） |
| C01 | `description` = `trigger.when` 直出（不含 `DERIVED_DESC_RE`，`testcase:811`） |
| C02 | `notWhen.text` 两形态（有则附「不用于」，无则无，`testcase:837`） |
| C04 | 非议会席数据塞「主持人」→ 卡面命中即红（`testcase:878`） |
| C05 | 议会席混用两词必红、单用绿（`testcase:898`） |
| D03 | 输出格式块残留 `doc-taxonomy` 指针 → 卡面指针词红（`testcase:997`） |
| D05 | `outputFormats` 不复制进席数据；同 kind 席输出格式段逐字相等（`testcase:1047`） |
| E02 | 覆盖带 reason 且字段确有差异 → 合并绿 + README 有该行（`testcase:1099`） |
| E03 | 无 reason → `OverrideWithoutReason`；带 reason 零差异 → `PointlessOverride`（`testcase:1122`） |
| E04 | 绕共享层写全量 → `DuplicateStatement`（`testcase:1145`） |
| E05 | `use` 白名单：未声明不合并（`testcase:1165`） |
| G04 | 散文进 `rationale` 合法、进 `duty` 必红（`testcase:1569`） |
| G05 | `must` 行判 criterion + landing；`never` 行只判 objects + criterion（`testcase:1598`） |
| G06 | P-B 负例：删 must 的 landing / 置空 criterion 必红（`testcase:1637`） |
| G07 | 三类反例各只命中本类 + 「遇意见冲突 / 可见 / 参考周围人的意见」→ 指针词 0 命中（`testcase:1668`） |
| H02 | 全集口径 = 落地时点 `agents/*.md` 全集（派生 = 席集，不写死 15，`testcase:1728`） |
| I03 | `registeredIdsOf([本席 card])` = 本席 `checkItems[].id` 并集（`testcase:1817`） |
| I04 | `renderCard` / `cardPipeline` 无 `readFileSync` / `AGENTS_DIR`；变异即命中（`testcase:1841`） |
| J01 | 两次渲染逐字相等；无时间戳 / 绝对路径；产物无 CR、无 BOM（`testcase:1870`） |
| J02 | 写盘后无 `.part` / tmp 残留；`writeAll` 含 `.tmp-` 形态（`testcase:1914`） |

- [ ] **Step 8: 跑测试与仓门禁**

```powershell
node --test "tools/docgen/test/card-render.test.mjs"; "exit=$LASTEXITCODE"
node tools/docgen/cli.mjs gate; "exit=$LASTEXITCODE"
npm run check; "exit=$LASTEXITCODE"
```

Expected：`exit=0`、`# fail 0`；本文件 `test('S4-TC-` 累计 = **35**（3 + 32）；`gate` 首行 `baseline 37/37`；`check` 末行 `check 全部通过`。**本任务不迁移任何席** → 15 张卡逐字节不变，`gate` 不得出现 `Mismatch`。

---

## Task 3: 审计承接（`EXIT` 表 + A1/A2 锚点迁移，代码侧）

**Files:**
- Modify: `tools/docgen/components/validateAgentData.mjs`（`EXIT` 表）
- Modify: `tools/docgen/cli.mjs`（`touchedSemanticKeys` 段名表）
- Modify: `tools/execution-matrix/criteria.md`（A1 / A2 两行的「判定对象」）
- Modify: `tools/docgen/test/card-render.test.mjs`（补 import + 2 条）

**Interfaces:**
- Consumes: Task 2（`renderByName` 的新卡分支、`renderCard`）
- Produces: `exitCodeFor(S1 码)` = **1**（36 脚本码 + 3 合并码）；`touchedSemanticKeys` 认「职责」段

- [ ] **Step 1: `EXIT` 表新增 S1 码分组**

`validateAgentData.mjs:4-22` 是封闭映射表；把 S1 的 **36 个脚本码**（`CARD_MODEL_CODES`，`card-model/validateCardModel.mjs`）+ **3 个合并码**（`merge.mjs:6-10` 的 `DuplicateStatement` / `OverrideWithoutReason` / `PointlessOverride`）归 **exit 1**。`WeakReason` **不入表**（`check:'manual'`，PRD `:216`）→ 它会按 `validateAgentData.mjs:23-26` 抛「未知错误码」，`S4-TC-F10` 正断言这一点。**不动 S1 的码与判据**，只补本文件映射行；`Rotation` 类顺序 = 码名字面（不写行号）。

- [ ] **Step 2: `touchedSemanticKeys` 段名表加「职责」**

`tools/docgen/cli.mjs:271-274` 现只认 `你是谁` / `身份` → 追加 `职责`（`heading.includes('职责') → keys.add('A1')`）。`description` 行 → `A2` 的判定不变（`:271`）。**判据语义不变**（仍是「身份 / 职责与卡内容是否自洽」），只换锚点段名（spec §10-D11 `:224`）。

- [ ] **Step 3: `criteria.md` 的 A1 / A2 判定对象同批改**

`criteria.md:96-112`：A1「判定对象 = identity（「你是谁」声明段）」→ 「判定对象 = 卡「职责」段（`duty`：trigger + objects + action + constraint）；旧卡过渡期兼容「你是谁」段」；A2 的判定对象（frontmatter description 的 when）**不改**（它本来就锚 front matter）。**只改判定对象行**，判定方式 / 落位 / 名称逐字保留（`criteria.md:3` 的「名称 / 判定对象 / 判定方式不得另行改写」指的是**不得另改口径**；本次改判有 spec §10-D11 授权 + R8 回扫）。同批回扫：`node scripts/scope-sweep.mjs --check` 必须 exit 0（Global 15）。

- [ ] **Step 4: 测试 2 条 + 跑门禁**

| ID | 断言（判据出处） |
|---|---|
| S4-TC-A08 | `touchedSemanticKeys` 认「职责」：职责段三形态（改 / 删 / 换）都触发 `A1`；`description` 变化触发 `A2`；`cli.mjs` 源码含「职责」（`testcase:554` / `spec:224`） |
| S4-TC-F10 | 36 个 S1 码 + 3 合并码 → `exitCodeFor` 全返 **1**；`WeakReason` 抛「未知错误码」；既有 `DanglingBaselineEntry` 仍归 2（`testcase:1442` / `spec:225`） |

```powershell
node --test "tools/docgen/test/card-render.test.mjs"; "exit=$LASTEXITCODE"
node scripts/scope-sweep.mjs --check; "exit=$LASTEXITCODE"
npm run check; "exit=$LASTEXITCODE"
```

Expected：`# fail 0`；`test('S4-TC-` 累计 = **37**；`sweep ok（命中未超基线、清单齐、scope 齐）`；`check 全部通过`。

---

## Task 4: 上游文档同批（PRD 两处 + `docs-convention` 一行，文档侧）

**Files:**
- Modify: `docs/prd/20261026205821-agent-card-contract.md`（§3.7 段表**内插**一行 + `:239` 单源说明 + `:293` 省略号）
- Modify: `rules/docs-convention.md`（目录表补 `docs/agents/` 一行）
- Modify: `tools/docgen/test/card-render.test.mjs`（+ 2 条）

**Interfaces:**
- Consumes: 无（纯文档面；可与 Task 1–3 并行）
- Produces: PRD §3.7 段表 **6 → 7 段**（含「输出格式」）；`docs-convention` 有 `docs/agents/` 档

- [ ] **Step 1: PRD §3.7 段表内插「输出格式」行（D1）**

`PRD:229-237` 的表**最后一行（`:237` 的「边界」行）之后插一行**（**表内插行，不是表外追加**）：「输出格式 | `outputFormats[outputKind]`（结构化 `fields[]` + `checks[]`） | 必填字段表 + 校验命令」。同批对齐 `PRD:239` 的单源说明（仍指 `tools/docgen/card-model/vocab/card-must-fields.mjs`，补「段行数 7」）。**判据**：`S4-TC-K01` 断「表头 + 7 段」。**不做**：不删任何既有行、不改其余 6 段文字。

- [ ] **Step 2: PRD `:293` 省略号收敛（D5 / `O-4`）**

`PRD:293` 的 `subject: 'reviewer-detective.card'|'artifact.observation'|…,` → `|…` 去掉、改为「15 席 `<seat>.card` + 2 项产物侧（登记表，非封闭枚举；唯一来源 `tools/docgen/card-model/subjects.mjs`）」。**不改** `:294-304` 的字段形状。

- [ ] **Step 3: `rules/docs-convention.md` 目录表补一行（D2）**

「一张表」（`docs-convention.md:9-17`）补：`docs/agents/` = 「**生成物**（人读投影：index + 每席一份）；不由手写维护——改数据 → `generate --readme --apply`」；「什么时候搬走」= 不搬走（生成物随席迁移更新）。**只补一行**，不加小节、不改文件命名表（该目录不是新增文档类型，是生成物落点）。

- [ ] **Step 4: 测试 2 条 + 跑门禁**

| ID | 断言（判据出处） |
|---|---|
| S4-TC-K01 | `specTableStrict(/^### 3\.7/)` 段表 = 表头 + **7 段**（末行为「输出格式」）；`PRD:293` 行内 `…` 命中 0（`testcase:1951` / `spec:214`、`:218`） |
| S4-TC-J04 | `docs-convention.md` 含 `docs/agents/` 行；`node scripts/scope-sweep.mjs --check` exit 0（`testcase:1933` / `spec:215`） |

```powershell
node --test "tools/docgen/test/card-render.test.mjs"; "exit=$LASTEXITCODE"
node scripts/scope-sweep.mjs --check; "exit=$LASTEXITCODE"
npm run check; "exit=$LASTEXITCODE"
```

Expected：`# fail 0`；`test('S4-TC-` 累计 = **39**；`sweep ok`；`check 全部通过`（markdown 表数 +1 = 本任务补的那一行所在表未新增，计数按实际漂移记录）。

---

## Task 5: 试点（`detective-observer` 先行 + 对照稿 + 出数）

**Files:**
- Modify: `tools/docgen/components/agentData.mjs`（`detective-observer` 条目 → `card` 12 键）
- Modify: `tools/docgen/card-model/vocab/{predicates,landings,shared-actions}.mjs`（补该席所需条目）
- Modify: 引用该席数据的常驻测试（清单见 Step 1）
- Modify: `agents/detective-observer.md`（重生成）
- Create: `docs/agents/detective-observer.md` + `docs/agents/README.md`（生成物）
- Create: `docs/reports/2026-10-30-agent-card-s4-pilot-contrast.md`（**归档副本**）
- Create: `.session/reviews/<本次>/pilot-contrast.md`（工作副本，不进 git）
- Modify: `tools/docgen/test/card-render.test.mjs`（+ 4 条，含 `F02` 的单席原子半）

**Interfaces:**
- Consumes: Task 2（`renderSeat` / `writeAll` / `dump`）、Task 3（`EXIT` 表 + `touchedSemanticKeys` 认「职责」）
- Produces: 首张新卡 + 首份 README + index v1 + 对照稿（7 段逐段对照 + 差异清单）+ 单席改动行数（`git diff --numstat`）

- [ ] **Step 1: 取该席的测试影响面（先量再改）**

```powershell
Get-ChildItem tools\docgen\test -Filter *.test.mjs | Select-String -Pattern 'detective-observer' | Group-Object Filename | Select-Object Count,Name
```

把命中文件逐条读，判「该断言属**旧数据形态**（`identity` / `fixedList` / `sharedBlock`）→ 同批改；属**渲染式**（`renderAgent` + 旧模板）→ 留到 Task 7」。**不得**为了绿而删断言（删什么必须在 ④ 段缺口表登账）。

- [ ] **Step 2: 该席 `card` 12 键落数据 + 称谓统一**

按 spec §4「15 席内容迁移映射」，把该席旧卡 6 段迁进 `card`：`## 你是谁` → `duty`（identity 叙述进 `rationale`）；`## 共享特质` / `## 通用纪律` → 由 `SHARED_USE['detective-observer']` 取共享句（**卡面不留**）；`## 固定必问清单` → `checkItems`（类别 + 条目表）+ 对应 `must`；`## 自由探索` → 一条 `must`（每轮 ≥1 或显式「无 + 依据」）；`## 输出格式` → 走 `outputFormats.observation`（不复制进席数据）。
**称谓强制统一**：该席实测 8 行命中（议长 1 行 / 主持人 7 行，见 `K-7`），迁移后**卡面「议长」= 0、「主持人」在位**（`S4-TC-C06`）——原样搬即 `MixedTermInCard` 红（`spec:154`）。

- [ ] **Step 3: 出对照稿（工作副本 + 归档副本）**

`renderSeat('detective-observer')` → 与旧卡逐段对照（7 段 × 旧 6 段映射表 + 差异清单：删了什么、搬到 `rationale` 的什么、共享句上移了哪几条）。**工作副本**落 `.session/reviews/<本次>/pilot-contrast.md`（不跨机）；**归档副本**同步落 `docs/reports/2026-10-30-agent-card-s4-pilot-contrast.md`（`docs-convention`：`.session/` 不进 git，归档副本才是可跨机复核的，`spec:190`）。

- [ ] **Step 4: 落盘（授权链，`K-12`）**

```
1) node tools/docgen/cli.mjs diff --kind agent --name detective-observer   # 取新 sha256 与差异行
2) node tools/docgen/cli.mjs draft --kind agent --name detective-observer  # 草稿 = 渲染产物
3) 独立实例按新卡重判 A1 / A2，写回 rules/.inspector-annotations.json（DOCGEN_JUDGED_BY 记该实例名）
4) node tools/docgen/cli.mjs replace --kind agent --name detective-observer --draft <草稿路径> --yes --expect-change <新 sha256> --rejudge A1,A2
5) node tools/docgen/cli.mjs generate --readme --apply   # 落 docs/agents/detective-observer.md + README.md
```

失败码按 `EXIT` 表：`UnapprovedChange`（4）/ `DraftDrift`（1）/ `Mismatch`（1）——**不得**用 `--yes` 之外的旁路；**不得**改 `state.json`（`setAgentState` 由 `replace` 内部执行，`tools/docgen/cli.mjs` 的 `setAgentState(name, 'replaced')` 调用）。

- [ ] **Step 5: 出数（单席改动行数 + 剩余工期换算）**

```powershell
git diff --numstat -- agents/ tools/docgen/ docs/agents/
git log -1 --numstat -- agents/ tools/docgen/
```

把「单席改动行数」写进对照稿的「出数」节，并给「剩余 = 单席 × 14 + 20% 缓冲」的换算式（**数字由实测产生，本 plan 不填**，PRD D-07 `:502`）。

- [ ] **Step 6: 测试 4 条 + 跑门禁**

| ID | 断言（判据出处） |
|---|---|
| S4-TC-C06 | 该席卡面「议长」= 0 且「主持人」在位（`testcase:928` / `spec:154`） |
| S4-TC-H01 | `docs/reports/2026-10-30-agent-card-s4-pilot-contrast.md` 在位，且含 7 段逐段对照 + 差异清单（`testcase:1708` / `spec:190`） |
| S4-TC-H03 | `git log -1 --numstat -- agents/ tools/docgen/` 可跑且单席改动行数 > 0（`testcase:1747` / `spec:191`） |
| S4-TC-F02（单席原子半） | 构造该席坏卡 → 该席被拒（`renderSeat` 抛 S1 码）、其它席照常；`generate`（无 `--readme`）不写任何文件（`testcase:1216` / `spec:179`） |

```powershell
node --test "tools/docgen/test/card-render.test.mjs"; "exit=$LASTEXITCODE"
node tools/docgen/cli.mjs gate; "exit=$LASTEXITCODE"
npm run check; "exit=$LASTEXITCODE"
```

Expected：`# fail 0`；`test('S4-TC-` 累计 = **43**；`gate` 首行 `baseline 37/37` 且无 `Mismatch`（已迁移 1 席比对新卡，其余 14 席仍比旧卡）；`check 全部通过`（markdown 文件数 +3：`docs/agents/README.md`、`docs/agents/detective-observer.md`、`docs/reports/…`）。

---

## Task 6: 铺满其余 14 席（逐席一提交）

**Files:**
- Modify: `tools/docgen/components/agentData.mjs`（其余 14 席条目 → `card`）
- Modify: `tools/docgen/card-model/vocab/{predicates,landings,shared-actions}.mjs`（逐席补条目）
- Modify: 被该席打断的常驻测试（逐席清单）
- Modify: `agents/<seat>.md` ×14 + `docs/agents/<seat>.md` ×14（生成物）
- Modify: `docs/agents/README.md`（index 从 1 行涨到 15 行）
- Modify: `tools/docgen/test/card-render.test.mjs`（+ 1 条）

**Interfaces:**
- Consumes: Task 5（试点完成 = 迁移模式已验证、出数已知）
- Produces: 15 席全迁移；`docs/agents/**` = 16 份；`gate` 按「已迁移子集」绿

- [ ] **Step 1: 一席一轮（14 轮，同一套动作）**

每席 = Task 5 的 Step 1–5 原样（取影响面 → 落 `card` 12 键 → 输出格式走共享 kind → 落盘 `replace`（含独立实例重判 A1/A2）→ `generate --readme --apply`），**每席一个提交**。**籍此逐轮验收**：`gate` 只对「已迁移子集」比对新卡、未迁移席仍比旧卡；未迁移席**不得**出现在 `docs/agents/`（`spec:182` 的中期子集判据）。

- [ ] **Step 2: 每席的称谓与非议会席口径**

议会 13 席（除 `evidence-reader` / `senior-sdet`）：「主持人」可用、「议长」不得与之同现（`S4-TC-C05` 的构造面）；`evidence-reader` / `senior-sdet` 两词 0 命中（两席实测已 0，迁移后必须保持）；前者 `outputKind='evidence'`、后者 `outputKind='testcase'`，输出格式段分别走 `outputFormats.evidence` / `.testcase`。

- [ ] **Step 3: 测试 1 条 + 每席跑门禁**

| ID | 断言（判据出处） |
|---|---|
| S4-TC-F05 | 中期子集：删 `state.json` 一席 → 红；构造「未迁移席却有 README」→ 红；对照态（已迁移席 + 其 README）必绿（`testcase:1303` / `spec:182`） |

```powershell
node --test "tools/docgen/test/card-render.test.mjs"; "exit=$LASTEXITCODE"
node tools/docgen/cli.mjs gate; "exit=$LASTEXITCODE"
npm run check; "exit=$LASTEXITCODE"
```

Expected（逐席）：`# fail 0`；`test('S4-TC-` 累计 = **44**；`gate` `baseline 37/37` 无 `Mismatch`；`check 全部通过`。

---

## Task 7: 收口（`renderAll` + 豁免到期 + 旧模板退场 + gate 31 份 + 全集回归）

**Files:**
- Modify: `tools/observation-check/card-exempt.mjs`（`EXPIRY_LANDED` → `true`）
- Delete: `tools/docgen/templates/agent.md.tpl` / `agent-handwritten.md.tpl`
- Modify: `tools/docgen/components/renderByName.mjs`（删旧分支）
- Modify: `tools/docgen/components/agentData.mjs`（删 `identity` / `fixedList` / `sharedBlock` / `heading` / `sourceLine` 残留键）
- Modify: `tools/docgen/components/validateAgentData.mjs`（收窄 `BASE_KEYS` / 删断言 5 与断言 8 的旧分支）
- Modify: `tools/docgen/components/patternRegistry.mjs`（`description` 两分支：全仓无引用即删，`spec:234`）
- Modify: `tools/docgen/acceptance/render13-snapshot.mjs` + `tools/docgen/test/{evidence-reader,pilot-render,sdet-template,tool-tiers,e2e-final,pilot-data}.test.mjs`（9 处引用的等价面改写）
- Modify: `tools/docgen/test/card-render.test.mjs`（+ **17 条新增**（含 `E01`）；`F02` 的收口半追加进既有 test，不新增块 → 累计 44 + 17 = 61）

**Interfaces:**
- Consumes: Task 2（三投影 + `writeAll` + gate 扩面）、Task 4（PRD / `docs-convention`）、Task 6（15 席全迁）
- Produces: 全席重生成终态：`docs/agents/**` 16 份 + 15 卡 + `state` 完整性 + `EXPIRY_LANDED=true` + 旧模板零残留

- [ ] **Step 1: `renderAll()` 全量一次（内存产物 → 逐文件落盘）**

```
node -e "import('./tools/docgen/components/cardPipeline.mjs').then(m=>{const r=m.renderAll();console.log('cards',r.cards.length,'readmes',r.readmes.length,'index',typeof r.index)})"
```

Expected：`cards 15 readmes 15 index string`（**15 席全过才产字节**，`spec:179`）。任一席坏 → 31 份零写盘（`S4-TC-F02` 收口半）。

- [ ] **Step 2: 豁免到期（D7 / C-08）**

`tools/observation-check/card-exempt.mjs:24` 的 `EXPIRY_LANDED = false` → **`true`**（唯一开关，注释 `:23` 原文「S4 首次重生成落地时置 true」）。**唯一改动**：这一行 + 该注释时点不写行号。验证：`npm run check` 的 ⑥ 段输出**含** `[豁免窗口] … EXPIRY_LANDED=true`（该行在 ⑥ 段内、**非首行**，`check-all.mjs:418`）+ `disposeCardFindings([{file:'agents/x.md'}], { landed:true })` → `blockers ≥ 1`（`S4-TC-F07`）。

- [ ] **Step 3: 旧模板退场（`K-10` 的 9 处逐处）**

① 删两个 `.tpl`（`Test-Path` → `False`）；② `tools/docgen/components/renderByName.mjs:26-31` 的 template 读取与旧分支删；`tools/docgen/cli.mjs:40` 的 `readTemplate` 只留 rule 分支；`tools/docgen/components/agentData.mjs:247` 的 `sourceLine` 删键（`senior-sdet` 卡面 `agents/senior-sdet.md:9` 的模板名随旧模板一起消失）；③ 5 个测试文件与 `tools/docgen/acceptance/render13-snapshot.mjs` 的旧模板引用逐处改成**新渲染器等价面**（例：该脚本的 fixture 改用 `renderCard` + `agent-card.md.tpl`；`tools/docgen/test/sdet-template.test.mjs` 的 9 节断言改为「新卡 7 段 + 该席 `checkItems` 逐条在位」）——**删断言必须在 ④ 段缺口表登账**（不许删断言换绿）；④ 复扫：

```powershell
Get-ChildItem tools\docgen -Recurse -Filter *.mjs | Select-String -Pattern 'agent\.md\.tpl|agent-handwritten\.md\.tpl'
Test-Path tools\docgen\templates\agent.md.tpl; Test-Path tools\docgen\templates\agent-handwritten.md.tpl
```

Expected：首条命中 **0**；两条 `False`。

- [ ] **Step 4: state 完整性与 gate 31 份**

① `state.json` 的 `agents` 键集与 `agentData` 名字集**双向相等且逐席 `replaced`**（收口全集判据，`spec:182`）。② `gate` 比对面 = **31 份**（15 卡 + 15 README + index），缺文件 → `DanglingBaselineEntry`、不符 → `Mismatch`（沿用码，不新增）。③ `baseline 37/37` 一字不变（「接口小节」的口径陷阱）。

- [ ] **Step 5: 全集回归 18 项（17 条新增 test 块 + `F02` 收口半追加进既有块）**

| ID | 断言（判据出处） |
|---|---|
| A01 | 15 卡 7 段齐 + 每段必渲染字段在位（单源 = `card-must-fields.mjs`，`testcase:354`） |
| B03 | 落盘后 15 份 README + index 15 行且链接目标全在（`testcase:630`） |
| C03 | 非议会席卡面 `议长 / 主持人` 0 命中（`testcase:858`） |
| F01 | `generate` exit 0 且 15 卡逐字节 = 渲染产物；`writeAll` 与 `--readme` / `--apply` 旗标在位（`testcase:1190`） |
| F02（收口半） | 收口坏 1 席 → 31 份不变；`generate`（无旗标）→ 31 份不写（`testcase:1216`） |
| F03 | 改卡面 1 字节 → `gate` exit 1 且点名该路径（`testcase:1255`，现状已生效、防回退） |
| F04 | 改 README / index 1 字节 → 红；删一份 README → `DanglingBaselineEntry`；比对面 = `2×席数+1`（`testcase:1276`） |
| F06 | `state.agents` 键集 = 席集双向相等、值域合法、全部 `replaced`（`testcase:1342`） |
| F07 | `EXPIRY_LANDED === true`、豁免行非首行且插值、注入后 `blockers ≥ 1`（`testcase:1363`） |
| F08 | 两 `.tpl` 不存在 + 代码面 0 命中 + 新卡无 `sourceLine`（`testcase:1386`） |
| F09 | 旧模板探针判别力：往 `.mjs` 代码面注入 → 命中 ≥ 1；扫描集合不含 `agents/`（`testcase:1412`） |
| G01 | 15 卡过 S1 校验零 errors + 码表仍 36 + 15 席 subject 形态 `<seat>.card`（`testcase:1463`） |
| G02 | 15 卡过 `PROSE_PROBES` 三类探针 0 命中（词表不另写，`testcase:1496`） |
| G03 | 改共享层 1 处 → 含新串的席数 = `use` 引用该 id 的席数（`testcase:1539`） |
| I01 | D6 三条证据逐条可核（`registeredIds` 不提前切换，`testcase:1766`） |
| I02 | `registered-ids.mjs` 常量逐字不变 + `git diff --quiet HEAD` 无差异（`testcase:1795`） |
| J03 | `docs/agents/**` 不触发 `UnregisteredHandwritten`，且恰 = 席数 + index（`testcase:1914` 后段） |

- [ ] **Step 6: 收口门禁 + 五条命令**

```powershell
node --test "tools/docgen/test/card-render.test.mjs"; "exit=$LASTEXITCODE"
node tools/docgen/cli.mjs gate; "exit=$LASTEXITCODE"
node scripts/check-gate-record.mjs; "exit=$LASTEXITCODE"
node scripts/scope-sweep.mjs --check; "exit=$LASTEXITCODE"
npm run check; "exit=$LASTEXITCODE"
```

Expected：`# fail 0`；`test('S4-TC-` 累计 = **61**；`gate` 首行 `baseline 37/37`；`rows <现算> bad 0` + `gate-record ok`；`sweep ok`；`check 全部通过`（⑥ 段含 `EXPIRY_LANDED=true`）。

---

## 附录 A：testcase 61 条 → 落点映射表

> 口径：**61 = 正 23 / 负 20 / 边界 18**（`testcase:2140-2150` 实测输出 `titles 61 / rows 61 pos 23 neg 20 edge 18 dupe 0`）。**每条用例 = `tools/docgen/test/card-render.test.mjs` 里一个 `test('S4-TC-XX …')`**；「落点」列 = 该用例最后的断言写在哪。`S4-TC-F02` 分两半（单席原子 / 收口）→ 两个 Task 各一半，ID 只算一条。

| ID | 类型 | F | 落点 | 一句话场景 |
|---|---|---|---|---|
| S4-TC-A01 | 正 | F-09 | Task 7 | 15 卡 7 段齐 + 必渲染字段在位 |
| S4-TC-A02 | 负 | F-09 | Task 2 | `Card` 12 键逐键删除被拒 |
| S4-TC-A03 | 边界 | F-09 | Task 2 | 段名 / 段序逐项相等，三变异各红 |
| S4-TC-A04 | 正 | F-09 | Task 2 | A3–A7 结构项全绿 |
| S4-TC-A05 | 负 | F-09 | Task 2 | A3–A7 判别力（四变异各红一码） |
| S4-TC-A06 | 边界 | F-09 | Task 2 | `rationale` 只在 README |
| S4-TC-A07 | 边界 | F-09 | Task 1 | `vocab/` 导出面恰 8 名 |
| S4-TC-A08 | 正 | F-09 | Task 3 | `touchedSemanticKeys` 认「职责」 |
| S4-TC-B01 | 正 | F-10 | Task 2 | 三投影对同一字段逐字一致 |
| S4-TC-B02 | 正 | F-10 | Task 2 | 改数据 1 处 → README / dump 跟随 |
| S4-TC-B03 | 正 | F-10 | Task 7 | 15 份 README + index 15 行 |
| S4-TC-B04 | 边界 | F-10 | Task 2 | index 表头五列齐 |
| S4-TC-B05 | 负 | F-10 | Task 2 | `overrides[]` 每条带 reason |
| S4-TC-B06 | 边界 | F-10 | Task 2 | 覆盖表行数 = overrides 条数 |
| S4-TC-B07 | 边界 | F-23 | Task 2 | dump stdout-only、不调 `writeAll` |
| S4-TC-B08 | 负 | F-10 | Task 2 | reason 取自 own；无 reason 拒绝渲染 |
| S4-TC-C01 | 正 | F-12 | Task 2 | `description` = `trigger.when` 直出 |
| S4-TC-C02 | 边界 | F-12 | Task 2 | `notWhen.text` 两形态 |
| S4-TC-C03 | 正 | F-12 | Task 7 | 非议会席两词 0 命中 |
| S4-TC-C04 | 负 | F-12 | Task 2 | 非议会席数据塞「主持人」→ 红 |
| S4-TC-C05 | 负 | F-12 | Task 2 | 议会席混用两词必红 |
| S4-TC-C06 | 正 | F-12 | Task 5 | 试点席「议长」= 0、「主持人」在位 |
| S4-TC-D01 | 正 | F-09 | Task 1 | 5 个 kind 结构化（无散文无指针） |
| S4-TC-D02 | 正 | F-09 | Task 1 | `testcase` 块写可执行命令 |
| S4-TC-D03 | 负 | F-09 | Task 2 | 输出格式残留指针 → 卡面红 |
| S4-TC-D04 | 负 | F-09 | Task 2 | 声明句式残留 → 探针红 |
| S4-TC-D05 | 边界 | F-10 | Task 2 | 不复制进席数据（同 kind 逐字相等） |
| S4-TC-E01 | 正 | F-10 | Task 7 | 共享判据 id 源码出现 1 次（第三条断言要 15 卡渲染，故收口期落） |
| S4-TC-E02 | 正 | F-10 | Task 2 | 带 reason 的覆盖合法且记账 |
| S4-TC-E03 | 负 | F-10 | Task 2 | 无 reason / 零差异两码 |
| S4-TC-E04 | 负 | F-10 | Task 2 | 绕共享层 → `DuplicateStatement` |
| S4-TC-E05 | 边界 | F-10 | Task 2 | `use` 白名单 |
| S4-TC-F01 | 正 | F-23 | Task 7 | `generate` 只比不写；15 卡逐字节相等 |
| S4-TC-F02 | 负 | F-23 | Task 5（单席半）+ Task 7（收口半） | 单席原子 + 收口零写盘 |
| S4-TC-F03 | 负 | F-23 | Task 7 | 卡面手改 1 字节 → 红（防回退） |
| S4-TC-F04 | 负 | F-23 | Task 7 | README 手改 / 缺文件 → 红；比对面 31 |
| S4-TC-F05 | 负 | F-23 | Task 6 | 删一席 / 中期「未迁移席却有 README」→ 红 |
| S4-TC-F06 | 边界 | F-23 | Task 7 | state 键集双向相等 + 全 replaced |
| S4-TC-F07 | 正 | F-23 | Task 7 | 豁免行在输出中 + 注入 blockers ≥ 1 |
| S4-TC-F08 | 正 | F-11 | Task 7 | 旧模板退场：两文件不存在 + 代码面 0 |
| S4-TC-F09 | 负 | F-23 | Task 7 | 旧模板探针判别力 |
| S4-TC-F10 | 负 | F-23 | Task 3 | S1 码全 exit 1；`WeakReason` 不入表 |
| S4-TC-G01 | 正 | F-09 | Task 7 | 15 卡零 errors + 码表 36 + subject 形态 |
| S4-TC-G02 | 正 | F-09 | Task 7 | 三类探针 0 命中 |
| S4-TC-G03 | 边界 | F-10 | Task 7 | 改共享层 1 处 → 席数 = use 引用数 |
| S4-TC-G04 | 边界 | F-09 | Task 2 | 散文进 rationale 合法、进 duty 必红 |
| S4-TC-G05 | 正 | F-09 | Task 2 | must 判 criterion + landing；never 只判 objects + criterion |
| S4-TC-G06 | 负 | F-09 | Task 2 | P-B 负例：删 landing / 置空 criterion |
| S4-TC-G07 | 负 | F-09 | Task 2 | 三类反例各命中本类 + 指针词守卫 |
| S4-TC-H01 | 边界 | F-11 | Task 5 | 归档副本在位（`docs/reports/`），7 段对照 |
| S4-TC-H02 | 正 | F-11 | Task 2 | 全集口径 = 席集（派生不写死 15） |
| S4-TC-H03 | 边界 | F-11 | Task 5 | `git log -1 --numstat` 可跑且行数 > 0 |
| S4-TC-I01 | 正 | F-23 | Task 7 | D6 三条证据逐条可核 |
| S4-TC-I02 | 负 | F-23 | Task 7 | 常量值不变 + HEAD 无 diff |
| S4-TC-I03 | 正 | F-23 | Task 2 | `registeredIdsOf([本席 card])` = checkItems 并集 |
| S4-TC-I04 | 负 | F-23 | Task 2 | 渲染模块不读 `agents/`；变异即命中 |
| S4-TC-J01 | 边界 | F-10 | Task 2 | 幂等 + 无时间戳 / 绝对路径 + 无 CR/BOM |
| S4-TC-J02 | 边界 | F-23 | Task 2 | 无 `.part` / tmp 残留；`writeAll` 含 `.tmp-` |
| S4-TC-J03 | 正 | F-10 | Task 7 | `docs/agents/**` 不触发 `UnregisteredHandwritten` |
| S4-TC-J04 | 边界 | F-12 | Task 4 | docs-convention 一行 + `scope-sweep` exit 0 |
| S4-TC-K01 | 边界 | F-09 | Task 4 | PRD 段表 7 段 + `:293` 无省略号 |

**合计**：**61 行**（一条用例一行，无额外「F 对位」行——`K-4` 的 `O-15` 口径）；**常驻 61 / 验收 0**（本段无「一次性交付动作」型用例）。

---

## 附录 B：执行顺序与提交切分

| 提交 | Task | 内容 | 可否独立回滚 |
|---|---|---|---|
| 1 | Task 1 | 4 个 `vocab/` + `subjects` 扩席 + `outputFormats` 结构化 + 5 条测试 | 是（无调用方，`check` 仍绿） |
| 2 | Task 2（a） | `agent-card.md.tpl` / `renderCard` / `cardPipeline` + A / C 组测试 | 是（`renderByName` 尚未切分支） |
| 3 | Task 2（b） | `renderReadme` / `dump` / `generate --readme --apply` / `collectGate` 扩面 + B / D / E / G / H / I / J 组测试 | 是（`docs/agents/` 尚未生成） |
| 4 | Task 3 | `EXIT` 表 + `touchedSemanticKeys` 段名 + `criteria.md` A1/A2 + 2 条测试 | 是 |
| 5 | Task 4 | PRD 两处 + `docs-convention` 一行 + 2 条测试 | 是（纯文档） |
| 6 | Task 5 | 试点席迁移 + `docs/agents/` 头两份 + 对照稿（工作 + 归档）+ 4 条测试 | 是（单席回滚 = 该席数据 + 两个生成物） |
| 7–20 | Task 6 | 14 席逐席一提交（每席含该席的常驻测试改动 + 1 条中期子集测试） | 每席独立 |
| 21 | Task 7 | 收口：`EXPIRY_LANDED=true` + 删旧模板（9 处引用）+ state 完整性 + 18 项全集回归（17 新增 + `F02` 半） | 建议单独一支（不可与第 20 提交合并） |

> `②→③@S4-render` 门行在 **Task 1 开工前**单独签署，不随任何提交进入（与 S2 / S3 / S1 / S4 同形态）。
> **提交前留基线**（K-0）：本 plan 落盘后 `git add -N docs/superpowers/plans/2026-10-30-agent-card-s4-render.md`（intent-to-add，不 commit），使计划门的「改了几处」有字节级证明（S1 的 `②→③@S1` 行曾因 plan 未跟踪只能写「限度自知」）。

## Self-Review（写完即跑，逐条对照）

**1. spec 覆盖**：§3（落点 / 4 个 `vocab/` 导出面 / 依赖方向 / 装配与写盘入口 / 数据源单向）→ Global 1–4、8 + 文件结构表 + Task 1 Step 1–4 + Task 2 Step 3–6；§4（`Card` 12 键 / `seatEntry` / 6 个装配函数 / `env` 11 键 / 拒绝语义）→ Global 5–7 + Task 2 Step 4 + A02 / B01 / I03；§5（三投影 / 覆盖记录 `reason` / 卡面 7 段 × 必渲染字段 / `PROSE_PROBES` / 称谓）→ Global 9、12 + Task 1 Step 1、Task 2 Step 2–3 + A01–A07 / B05–B08 / C01–C06 / G02–G07；§6（`outputFormats` 结构化）→ Task 1 Step 5 + D01–D05；§7（写盘 ①–⑥ / 豁免到期 / 旧模板退场）→ Task 2 Step 4、Step 6 + Task 5 Step 4 + Task 7 Step 1–4 + F01–F09；§8（逐席滚动与出数门槛）→ Task 5 / Task 6 + H01–H03；§9 V-1～V-8 → 附录 A 逐条（V-1→A01–A07、V-2→B01–B03 / G03、V-3→B05 / B06 / B08 / E02–E05、V-4→G01 / G02 / G04 / G07、V-5→F02–F06 / F10、V-6→I04 / B07、V-7→G05 / G06、V-8→附录 A 的 F 列 + 核对一）；§10 D1–D12 → 逐条落 Task（D1/D2/D5→T4；D3→T2 Step 5；D4→T1；D6→K-2 / I01 / I02；D7→T7 Step 2；D8→T7 Step 3；D9→Global 1；D10→T1 Step 5；D11→T3 Step 2/3；D12→T3 Step 1）；§11 / §12 → K-2 / K-5 / K-13。**无缺口**。
**2. 占位扫描**：`TBD` / `TODO` / 「适当处理」= 0 处；「待定」= 0 处；「待签」只出现在计划门签行状态与附录 B（属**签字待办**，签行原文进 `gate-record.md`）。
**3. 类型 / 符号一致**：`renderCard` 在 T2 定义、T2/T3 消费；`buildEnv` 在 T2 定义、T5–T7 消费；`writeAll` 在 T2 定义、`draft`/`replace`/`generate --readme --apply` 三处共用；`PROSE_PROBES` 只在 T1 写一份、T2 消费（G02 / G07 断「不另写词表」）；`CARD_SEGMENTS` 只在 T1 写一份、T2 模板与 A01/A03 同源；`registeredIdsOf` 由 S1 提供、T2 消费（I03 断 `[本席 card]` 单元素入参）。
**4. R4（无新增设计）**：本文件**无** `## 新增设计决策` 节。三处「读法」均回指 spec、不是新决策：① `gate` 比对面用独立派生（spec §7③ `:181` 只写「扩到 31 份」，未指定实现载体；不改 `BASELINE_RULES` 是 `check-all.mjs:138/:148` 的既有派生断言**要求**，非我自定）；② 双形态兼容（spec §8 `:192` 逐席滚动 + `state.json` 15 席全 `replaced` 的**后果**）；③ 内部形状取最小（`K-6`，测试判据只断非空）。施工期若再发现 spec 未定义的东西 → **回 ② 段重审**（R4），不在本文件补。
**5. 命令符号可核**（`stage-2b-plan-gate.md:60` 常见漏项）：本 plan 引用的命令与 `path:line` 全部实跑或核过——`scripts/check-plan.mjs`（四子命令，`size` 已实跑得 `spec 245/350 tc 61/80 rounds 3/3 => ok`）、`PRD:544`（F→S 表实测在 `:544`）、`scripts/check-gate-record.mjs`（`rows 33 bad 0`）、`scripts/scope-sweep.mjs`（`sweep ok`，**以当次清单** `.session/reviews/2026-10-30-2233-agent-card-s4-render-plan-gate/impact-sheet.md` 承接）、`tools/docgen/cli.mjs`（`generate` / `gate` / `draft` / `replace` / `diff` 已在 `tools/docgen/cli.mjs:565-602` 注册；`dump` / `--readme` / `--apply` **施工后才存在**，见 Task 2 Step 6 的产出）、`tools/observation-check/card-exempt.mjs:24`（`EXPIRY_LANDED = false` 实测）、`tools/docgen/state.json:4-18`（15 席全 `replaced` 实测）、`Get-ChildItem tools\docgen -Recurse -Filter *.mjs | Select-String 'agent\.md\.tpl|agent-handwritten\.md\.tpl'` → **9** 实测。
**6. 施工后才存在的符号**：`buildCards` / `buildEnv` / `renderSeat` / `renderAll` / `writeAll` / `renderCard` / `renderReadme` / `renderIndex` / `PROSE_PROBES` 等均由**本 plan 的 Task 1–2** 定义为产出物，已在对应 Task 的 Interfaces 标出。
