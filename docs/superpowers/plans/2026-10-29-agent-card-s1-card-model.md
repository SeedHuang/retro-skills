# agent-card S1 定义层（卡面内容模型 + 校验器，F-01～F-08）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.
>
> 状态：**已过计划门（`②→③@S1` 通过，2026-10-29）、待开工 ③**——签行原文在 `gate-record.md` 的 `②→③@S1` 行（本文不复抄，防两处维护漂移）。
> **单块**：本功能块**不再拆**——spec 301 行 ≤ 350、testcase 58 条 ≤ 80、议会 #2 已跑满 **3 轮**（`.session/reviews/2026-10-29-1501-agent-card-s1-parliament/round-check.md`）；再拆须按 `skills/dev-workflow/references/stage-2-tech-design.md:43` 对第二块重送议会 #2 并占 R6 名额，用户 2026-10-29 已确认「**plan 单块不再拆**」。

**Goal:** 把 PRD §4.4 B 表「S1 待实现」的 36 个脚本码从「已命名、零实现」落成 `tools/docgen/card-model/` 的 12 个 `.mjs` 定义层模块 + 1 个常驻测试文件：一份卡片数据进 `validateCardModel(card, env)` 出 `{ ok, errors[] }`，每个错误码有唯一触发条件、每个 `path` 至多一码；同批把 V-1～V-8 全部落成 `node --test` 可跑的断言。

**Architecture:** 新建 `tools/docgen/card-model/`（与 S6 `tools/docgen/policy/**` **零字节交集**，V-6 双向守卫）：`enums.mjs` 是**唯一写死字符串**的地方（8 张封闭表 + ID 谓词 + 文本扫描常量），其余模块各自只做一件事（落点解析 / 场景与信号对账 / 主语登记 / 开放项 scope 派生 / 表达式判定 / 合并 / 唯一发射点 `validateCardModel.mjs`），`index.mjs` 是对外 barrel（§3 `:48`）。校验器**纯函数、零 IO**，全部上下文经 `env` 的 11 键注入；36 码互斥靠 §8 的 8 组优先级表 + 不变量 M1/M2（M2 粒度 = **判定面**，`:226`）。**不渲染、不接门禁、不碰 S2/S6**。

**Tech Stack:** Node.js ≥ 22（ESM `.mjs`；只 import `node:assert/strict` 与 `node:fs` / `node:path` / `node:url`（测试侧）、零第三方依赖）；PowerShell（仓根执行）；测试统一 `node --test "tools/docgen/test/card-model.test.mjs"`。

**Spec:** `docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design.md`（**301 行 / v6.1**，SHA256 `2931C7D726055F655D579BF211789E145135141F2DDEA089AEFA50F13660064E`；已签 `②@S1`，本阶段**不改判据**）

**Testcase:** `docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design-testcase.md`（**2318 行 / v6.1**，SHA256 `03DA6675BFCFCC494FD08B5FFA1EE21260D6368182AEC84E1ACF12E06A76D6F5`，**58 条 = 正 14 / 负 22 / 边界 22**，前置 58；`S1-TC-A01`…`S1-TC-K04`；由独立 `senior-sdet` 6 轮全新上下文编写，本段只消费、不改写）

## Global Constraints

以下每一条对**每个任务**隐含生效（值逐字取自 spec §2 / §3 / §5 / §6 / §8 / §9）：

1. **落点与零接触**（spec §2 `:26-31` + §3 `:35-53` + V-6 `:252`）：只新建 `tools/docgen/card-model/**` 与 `tools/docgen/test/card-model.test.mjs`；`tools/docgen/policy/**`、`tools/observation-check/**`、`agents/*.md`、`scripts/check-all.mjs` **零改动**。
2. **依赖方向单向**（spec §3 `:52`）：`card-model/**` 只 import `node:` 标准库与自身；**禁止** `tools/docgen/policy/**`、`tools/docgen/components/**`、`tools/observation-check/**`；反向零 import（V-6 双向）。
3. **纯函数三点**（spec §6 `:151`）：零 IO（不读文件、不跑命令、不读环境变量）、零环境依赖（全部经 `env` 注入）、不改入参（V-4）。
4. **异常与缺键纪律**（spec §6 `:152-153`）：判定内部抛异常 → 收敛为 `UnverifiableOutput`（`message` = 异常首行）并**继续判后续条目**，不冒泡；`env` 缺任一键 → `UnverifiableOutput`（`path = env.<键名>`）并继续判，不 fail-fast、不 `undefined` 兜底。
5. **四入口 + 合并独立**（spec §6 `:137-147`）：`validateCardModel(card, env)` / `validateOpenItems(doc, env, cards)` / `compareVerdicts(docA, docB, env)` / `verdictAllowed(subject, objectType, verdict)` 一律返回 `{ ok, errors }`（**不是布尔**）；`mergeActions(shared, own)` 是第五个独立调用、**3 个合并码不入 `CARD_MODEL_CODES`**、`validateCardModel` **不执行合并**。
6. **码表唯一**（spec §6 `:147` + §7 `:164`）：`CARD_MODEL_CODES` 恰 **36 键**（35 = PRD `:361` S1 组脚本码 + 1 = A 表 `:346` 复用 `MissingCriterionImpl`）；键 = 码名、**值 = 判定面字段引用（不写行号）**；`WeakReason` 不在表内（V-5）。
7. **互斥与优先级**（spec §8 `:224-239`）：**M1** = 一次返回内同 `path` 只出现一个码；**M2** = 组内先命中先报、命中即停，**粒度 = 判定面**（`scenes` / `trigger` / `checkItems[].criterion`），`errors[].path` 仍输出带下标的定位串；不同判定面的多码同次返回属正常（如 `must[0].criterion` 与 `checkItems[0]`）。
8. **`env` 11 键与 `registeredIds` 单源**（spec §6 `:143-144` / `:154`）：11 键 = `seat` / `sharedScenes` / `seatScenes` / `seatSignals` / `predicates` / `landings` / `subjects` / `registeredIds` / `available` / `unboundVars` / `parliamentSeats`；`env.registeredIds` 必须由调用方以 `registeredIdsOf(本轮全部卡)` 构造，四入口**不自行派生、不回退常量**。
9. **开放世界**（spec §6 `:155`）：`Card` 上出现本 spec 未列的字段 → **忽略不判**；只判 §4 列出的字段（`cmd?` / `impl?` 已列，可注入）。
10. **本段测试是常驻回归测试，不是 testcase 文件**：编写者 = 施工者，**不受 `spec-testcase-gate` 的独立编写义务约束**（spec 的 testcase 已由独立 `senior-sdet` 单独交付，本段只消费它）；测试落点唯一 = `tools/docgen/test/card-model.test.mjs`（testcase 文件头 `:19` 已定）。**计数口径**：各 Task 末尾「`test('S1-TC-` 累计 = N」一律指**该文件内 `test(` 块个数**（一个用例 = 一个 `test()` 块；A05 / J02 / B03 / F03 / F05 / K02 的补断言写进既有块，**不新增块**）。它**不等于**按附录 A「落点」列逐 Task 去重数出的数（那是 3/13/13/21/33/54/58），两者并存不是矛盾——前者防「块漏写」，后者防「落点漏标」。
11. **仓门禁不红**：每个任务收尾 `npm run check` exit 0。基线（**2026-10-29 本 plan 落盘前实跑**）= `# tests 1039 / # pass 1037 / # fail 0 / # skipped 2`、`baseline 37/37`、`0 findings`、`④ markdown 检查通过（310 个文件 / 1365 张表）`、末行 `check 全部通过`。本 plan 落盘后文件数 / 表数 +1 / +N 属预期漂移，**不钉死**。
12. **R8 回扫只认裸命令**：`node scripts/scope-sweep.mjs --check` → `sweep ok`（exit 0）；**禁用** `npm run doc:sweep -- --check`（PowerShell + npm 10.9 吞掉 `--` 后参数、跑默认分支恒 exit 0 = 假绿）。**mtime 时序**：裸 `--check` 自动取 mtime 最新的 impact-sheet，若报「清单早于被扫文件」，就为本批新落一份当次清单（本计划门已落 `.session/reviews/2026-10-29-1813-agent-card-s1-plan-gate/impact-sheet.md`，先例 = `②→③@S3` 的增量登记节）；不要改写过早的旧清单去凑绿。
13. **V-13 / A/B 盲评不属本段**：本 plan 与后续 ④ / ⑤ 门行**不得**引用 `V-13`（`skills/dev-workflow/references/gate-record.md:13` 的 `②@S6` 增量登记）。
14. **夹具一律自建**：测试不得读仓内 `agents/*.md` 当夹具（J03 / J05 / J06 的静态扫描与 A04 / A05 / I04 的上游原文读取除外——那是**第三方通道**，见 testcase §4 `:2095`）。

## 文件结构

| 路径 | 动作 | 职责（spec §3 `:35-48`） |
|---|---|---|
| `tools/docgen/card-model/enums.mjs` | 新建 | 8 张封闭表 + ID 谓词 + 文本扫描常量 + `SCAN_FIELDS`（8 键）（**唯一写死处**） |
| `tools/docgen/card-model/vocab/subjective-terms.mjs` | 新建 | 主观词表数组物料（5 词，PRD `:270`） |
| `tools/docgen/card-model/vocab/criterion-terms.mjs` | 新建 | 未定义判据词表（起步 6 词，PRD `:202`） |
| `tools/docgen/card-model/landings.mjs` | 新建 | `LANDING_VARS` + `resolveLanding()`（最长已登记前缀，§7 `:180`） |
| `tools/docgen/card-model/scenes.mjs` | 新建 | `SHARED_SCENES` + `SEAT_SCENES`（空集）+ 场景三码对账 |
| `tools/docgen/card-model/signals.mjs` | 新建 | `SEAT_SIGNALS`（空集）+ 信号两码对账 |
| `tools/docgen/card-model/subjects.mjs` | 新建 | `SUBJECTS` + `SUBJECT_VALIDATORS` + `subjectMatches()` / `verdictAllowed()` / `compareVerdicts()` |
| `tools/docgen/card-model/open-items.mjs` | 新建 | `SCOPES` + `deriveScope()` + `validateOpenItems()`（三码） |
| `tools/docgen/card-model/expression.mjs` | 新建 | `ALLOWED_OPS` + `isJsonLogic()` + `operatorDepth()` + `scanCriterionText()` |
| `tools/docgen/card-model/merge.mjs` | 新建 | `OVERRIDABLE_FIELDS`（6 字段）+ `mergeActions()`（3 合并码） |
| `tools/docgen/card-model/validateCardModel.mjs` | 新建 | 唯一发射点：`CARD_MODEL_CODES`（36 键）+ `registeredIdsOf()` + 卡级四族判定（消费 `enums.SCAN_FIELDS`，**不另写一份**） |
| `tools/docgen/card-model/index.mjs` | 新建 | 对外 barrel（§3 `:48` 的 18 项出口） |
| `tools/docgen/test/card-model.test.mjs` | 新建 | 常驻测试：helper（testcase §0.3 逐字）+ 58 条用例 |

> 引用口径：`spec:NN` = `docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design.md` 的行号；`testcase:NN` = 同名 `-testcase.md` 的行号；`PRD:NN` = `docs/prd/20261026205821-agent-card-contract.md` 的行号。**本 plan 自身的行号不写进正文**，凡指向本 plan 内部一律写「Task N / 附录 A」。

## 接口小节（模块导出面，唯一契约）

```text
enums.mjs            SHARED_SCENES / MOMENTS / REPEATS / SIGNALS / VERDICTS / CHECK_KINDS / SCOPES /
                     LANDING_VARS（8 张表，Object.freeze）/ ID_NAME_RE / VAGUE_TERMS /
                     HARDCODED_COUNT / POINTER_WORDS / PROC_WORDS / MIXED_PAIR / SCAN_FIELDS（8 键）
vocab/*.mjs          subjectiveTerms（5）/ criterionTerms（6）
landings.mjs         resolveLanding(landing, landings, unboundVars) → { ok, reason? }
scenes.mjs           SHARED_SCENES / SEAT_SCENES / duplicateScene() / promotionCheck() / unusedScene()
signals.mjs          SIGNALS / SEAT_SIGNALS（默认空集）/ unknownSignalType() / signalProliferation()
                     （`MultiMomentInOneEntry` 的判定在发射点 Task 5，不落 signals.mjs——spec `:40` 只给「信号两码对账」）
subjects.mjs         SUBJECTS / SUBJECT_VALIDATORS / subjectMatches() / verdictAllowed() / compareVerdicts()
open-items.mjs       SCOPES / deriveScope(object) → 'card'|'code'|'doc'|'process'|'repo' / validateOpenItems(doc, env, cards)
expression.mjs       ALLOWED_OPS / isJsonLogic() / operatorDepth() / scanCriterionText()
merge.mjs            OVERRIDABLE_FIELDS（6）/ mergeActions(shared, own) → { ok, errors }
validateCardModel.mjs CARD_MODEL_CODES（36）/ registeredIdsOf(cards) / validateCardModel(card, env) / 内部族判定
                     （`SCAN_FIELDS` **只在 `enums.mjs` 写一份**，本文件 import 消费——testcase:1486 冻结为 `EN.SCAN_FIELDS`）
index.mjs            8 张表 + SUBJECTS / SUBJECT_VALIDATORS + 四入口 + CARD_MODEL_CODES + SCAN_FIELDS +
                     mergeActions + registeredIdsOf（§3 `:48`）
```

- **表归属**：§5 的 8 张表**全部写死在 `enums.mjs`**（`:37` 写明「唯一写死处」）；§3 `:38` 的 `landings.mjs` 与 `:42` 的 `open-items.mjs` 分别 **re-export 并消费** `LANDING_VARS` / `SCOPES`（不做第二份字面）。两行合读即 §5 `:117-126` 的 8 张表，V-1 的断言在 `index.mjs` 出口面做。
- **消费既有面**（不改，只读）：无——本段零依赖仓内其它模块（V-6 的正向前提）。
- **`path` 形态**（spec §6 `:157`）：形如 `must[0].trigger` / `checkItems[2].audit` / `open[0].scope`；同一次返回内 path 唯一。

---

## 计划门（②→③，开工前签）

> 判据出处：`skills/dev-workflow/references/stage-2b-plan-gate.md`（三条核对 `:16-36`，三权 `:44-50`，收口 `:62-65`）。本门**不设议会**；**申报人 = 主 agent（plan 作者）**，**签字人 = 独立审计实例**（`agents/reviewer-audit.md` 角色卡 path B 贴入，未参与写 plan）——R2：主 agent 不得自签。
>
> 下列表格是**申报人预填**（供审计对照），**结论以审计本人读 plan 后独立复算为准**；审计只签字不读 = 不通过（`stage-2b-plan-gate.md:49`）。

### 核对一：功能点全覆盖（= 功能点 → 任务映射表）

| 功能点 | 一句话（PRD `:463-472`） | 本 plan 落点 | 覆盖用例（附录 A） |
|---|---|---|---|
| F-01 | 场景 / 信号模型（`scene` + `moment` + `repeat`；五类信号，无 merge） | Task 1、Task 5 | E02、E03、E04、E05、E06、J01 |
| F-02 | 动作五要素（触发 / 宾语 / 判据 id / 落点 / 前置 `requires`） | Task 4、Task 5 | F01、F02、F04 |
| F-03 | 同编号覆盖（同层报错 + `reason` 必填 + 无差异报错 + `overrides[]` 含全字段） | Task 3 | J02 |
| F-04 | 检查项两层（`CATEGORIES` + `CHECK_ITEMS`，含 `subject` / `criterion` / `check` 三类） | Task 6 | G01、G02、J01 |
| F-05 | 检查项三态 + `subject` 类型匹配 + 完备性判据 | Task 2、Task 6 | I01、I03 |
| F-06 | 开放项 `openItem`（基类五列 + 派生 `scope`；0 条须可核理由） | Task 2 | H01、H05、H06 |
| F-07 | 判据表达式化（「或」拆条、「且」留条；词表进数组、阈值进 `params`） | Task 3、Task 6 | G04、G05、C03 |
| F-08 | 落点枚举化 + 参数化（`LANDING_VARS`、`UnboundLanding`） | Task 1、Task 5 | E01、E07 |

- **PRD 侧集合**：`--stage S1` 命中 1 行 = `F-01～F-08`（`PRD:541-546` 的 F→S 覆盖表，S1 行在 `:543`），区间展开后 **8 个**。
- **取集合命令**（cwd = 仓根，脚本即判）：
  ```powershell
  node scripts/check-plan.mjs coverage --plan docs\superpowers\plans\2026-10-29-agent-card-s1-card-model.md --prd docs\prd\20261026205821-agent-card-contract.md --stage S1
  ```
- **Expected**：首行 `coverage: gap 0（prd 8 / plan 8）steps ok => ok`，exit 0。
- **第二半**（每个被覆盖的功能点至少一条执行步骤）：上表 8 行的「本 plan 落点」均为**存在的 Task**（Task 1–8），无悬空。

### 核对二：依赖无环

- **节点**：8 个（`## Task 1:` … `## Task 8:`）。
- **边集**（每个 Task 的 `Consumes:` 只指更小编号）：

| Task | 指向 | 边 |
|---|---|---|
| T1 | 无 | — |
| T2 | T1 | T1→T2 |
| T3 | T1 | T1→T3 |
| T4 | T1、T2、T3 | T1→T4、T2→T4、T3→T4 |
| T5 | T4、T1 | T1→T5、T4→T5（`VAGUE_TERMS` / `PROC_WORDS` 等文本常量来自 T1 的 `enums.mjs`） |
| T6 | T5、T3、T1、T2 | T1→T6、T2→T6、T3→T6、T5→T6（消费 T1 的 `subjectiveTerms` / `SCAN_FIELDS`、T2 的 `SUBJECTS`） |
| T7 | T1–T6 | T1→T7 … T6→T7（6 条） |
| T8 | T1–T7 | T1→T8 … T7→T8（7 条） |

- **拓扑序**：`T1, T2, T3, T4, T5, T6, T7, T8` 可完成；**回边 0**（**24** 条边全部指向更小号：T2 1 / T3 1 / T4 3 / T5 2 / T6 4 / T7 6 / T8 7）。
- **取命令**：
  ```powershell
  node scripts/check-plan.mjs deps --plan docs\superpowers\plans\2026-10-29-agent-card-s1-card-model.md
  ```
- **Expected**：首行 `deps: cycle 0 dangling 0（nodes 8 / edges 24） => ok`，exit 0。
- **R4 抽查**（本文件**无** `## 新增设计决策` 节）：
  ```powershell
  (Select-String -Path docs\superpowers\plans\2026-10-29-agent-card-s1-card-model.md -Pattern '^## 新增设计决策').Count
  ```
  期望 `0`。

### 核对三：功能块 ↔ testcase 一一映射

- **一个功能块**（S1）对应**一份** testcase：`docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design-testcase.md`（58 条）。
- **双向**：`map` 解析出的 **66 个 ID**（58 条用例 + 8 条 `F-01`…`F-08` 对位行，成因见附录 A 口径二 / 遗留 `M-1`）↔ 附录 A **66 行**，`missing` / `dangling` 均 0；逐 ID 落点见**附录 A**。
- **取命令**：
  ```powershell
  node scripts/check-plan.mjs map --plan docs\superpowers\plans\2026-10-29-agent-card-s1-card-model.md
  ```
- **Expected**：首行 `map: missing 0 dangling 0（cases 66 / mapped 66） => ok`，exit 0。
- **规模（同门附核，`size` 不计入三条核对）**：
  ```powershell
  node scripts/check-plan.mjs size --spec docs\superpowers\specs\2026-10-29-agent-card-s1-card-model-design.md --testcase docs\superpowers\specs\2026-10-29-agent-card-s1-card-model-design-testcase.md --rounds 3
  ```
  **Expected**：`size: spec 301/350 tc 66/80 rounds 3/3 => ok`，exit 0。`tc 66` 是 `map` 同一条 ID 载体口径（58 条用例 + 8 条 F 对位行）；**用例真值仍是 58 ≤ 80**（`testcase:2278-2282` 实测 `rows 58`）。`rounds` = 3 取自议会 #2 轮次账（`.session/reviews/2026-10-29-1501-agent-card-s1-parliament/round-check.md` 三轮时间线），不是目标值。

### 签行（待签，2026-10-29）

> 结论与证据原文由独立审计实例写入 `skills/dev-workflow/references/gate-record.md` 的 `②→③@S1` 行（本文件不复抄）。本门「过」= 可进 ③，不等于 ③ 已施工。

---

## 存量 spec 豁免点名（`spec-testcase-gate`，进 ③ 必点）

> 出处：`rules/dev-workflow-mainline.md`「例外」节——进 ③ 必须在 plan 或交接材料里点名两件事。

1. **豁免的存量 spec（2026-10-18 之前定稿，共 25 份）**：`2026-09-27-retro-suite-design.md`、`2026-09-28-evolving-skills-design.md`、`2026-09-28-evolving-step3-design.md`、`2026-09-28-l3-l4-promotion-design.md`、`2026-09-29-aas-skill-deps-design.md`、`2026-10-01-retro-flywheel-blueprint.md`、`2026-10-01-retro-self-improvement-design.md`、`2026-10-02-session-dir-layout-design.md`、`2026-10-07-moment-context-and-timeline-design.md`、`2026-10-08-rule-optimizer-design.md`、`2026-10-09-global-ask-rewrite-design.md`、`2026-10-09-rule-suite-design.md`、`2026-10-09-rule-type-scoring-design.md`、`2026-10-09-skill-authoring-design.md`、`2026-10-09-use-rule-skills-design.md`、`2026-10-10-review-branch-design.md`、`2026-10-10-review-loop-l3-project-type-design.md`、`2026-10-10-rules-migration-design.md`、`2026-10-11-type-rules-external-design.md`、`2026-10-14-execution-assurance-design.md`、`2026-10-14-review-loop-evolution-design.md`、`2026-10-15-cognitive-rule-landing-gate-design.md`、`2026-10-15-verification-audit-checklist-design.md`、`2026-10-17-parliament-design.md`、`2026-10-17-systematic-repair-design.md`（目录 `docs/superpowers/specs/`；取数 `Get-ChildItem docs\superpowers\specs\*.md | Where-Object { $_.Name -lt '2026-10-18' }` → 25）。
2. **升级时点（事件型，可核）**：上述任一份 spec **下一次被修订并进入 plan 的那一刻**——那一刻必须先补同目录 `<名>-testcase.md`，否则按 `spec-testcase-gate` 打回。**S1 自身的 spec / testcase 于 2026-10-29 定稿，不在豁免内**（本 plan 消费的两件均已过议会 #2）。

---

## 遗留与留观（登记，不单开任务、不改判据）

来源 = `docs/handoffs/2026-10-29-agent-card-s1-plan-gate.md` 的「遗留裁决与留观项」+ 议会 #2 候选（`.session/reviews/2026-10-29-1501-agent-card-s1-parliament/delivery-audit.md` §C）。**本段一律不改判据**；触及时只按触发信号处置。

| # | 项 | 现状 | 触发信号 / 收敛时机 |
|---|---|---|---|
| C-1 | 议会台账 v5 锚点不可逐字复算（`problems.md` §一/§二 用 v5 行号，v5 原文无快照） | 已登记，不阻断 | 下次改 `problems.md` §一/§二，或本计划门同批 |
| C-2 | `problems.md:83` 的「19 卡」排除理由口径错（不重复计 ≠ 减 1） | 已登记 | 下次改该文件 §三 |
| C-3 | `problems.md:97` 的 G7 锚 `v6:234` 应为 `:235` | 已登记 | 与 C-1 同批 |
| C-4 | 侦探观察 2 条未处置（被审基线无 git 快照 / DT-1-01 依据是散文） | 已登记 | 下次送议会 #2 前先 `git add` 留存基线 |
| C-5 | 版本标签残留（`spec:3` 仍写 v6、正文已 v6.1；`progress.md:14` 无具体时刻） | 已登记 | 下次触碰这三个文件时同批改 |
| L-1 | `CheckItem.criterion` 与 S6 `tools/execution-matrix/criteria.md` 三态可能交叉 | 未决 | ③ 段写 `CheckItem.criterion` 判据时判「复用还是另立词表」（本段按 spec §4.1 分形实现，若冲突即回 ② 段） |
| L-2 | `registeredIds` 单源切换（S2 `tools/observation-check/registered-ids.mjs:5` 仍是手写常量） | 已登记（spec §11-3 `:289`） | **S4 首次重生成**；本段只交 `registeredIdsOf()`、不改 S2 |
| L-3 | 15 卡豁免窗口（PRD C-08 `:121`） | 已登记 | 到期 = S4 首次重生成；本段不接线、不触发 |
| L-4 | testcase §7 缺口表剩余 6 条 P2（`S1-G-11` / `-12` 余项 / `-18` / `-19` / `-22` / `S1-G-4` 的 `scenes[].label` 归码） | 开（P2） | ③ 段逐条判「本段采纳 / 不采纳留痕」；**任何采纳 = 改用例须派新 sdet 实例，施工者不得代改 testcase** |
| L-5 | `ALLOWED_OPS` 的具体算子清单 spec `:191` 未枚举（只写「JSON Logic 算子集」），testcase `:868` 亦未登记为缺口 | 本段按 JSON Logic 规范取全集、写死在 `expression.mjs` 单源（plan 不复列，见 Task 3 Step 1） | ③ 段若发现「该算子集与仓内既有表达式用例不兼容」，**回 ② 段**补 spec 一行（不得在 ③ 段自行增删算子）；触发 = 写 `expression.mjs` 时与 `spec:191` 对不上 |
| M-1 | **机制缺陷**：`check-plan.mjs` 的 B 载体正则 `^\|\s*([A-Z][\w-]*?\d{2})\s*\|`（`scripts/check-plan.mjs:229`）把 testcase §1 末「F 对位」表的首列 `F-01`…`F-08` 当成用例 ID → `cases 66`（真值 58），任何带同类对位表的 testcase 都会虚高 8 条 | 已在本段用「附录 A 一并落点」对齐（不改 testcase、不改 S4 已签脚本） | **修法（择一，两侧必须同批，否则本段附录 A 会从 `mapped 66` 变 `dangling 8`）**：① **testcase 侧**（`scripts/check-plan.mjs:229` 的 B 载体）加排除表——值集 `^F-\d{2}$` 不计 ID，并产出一行 `[check-plan] map：排除 <n> 条功能点对位行`；**同批**在 plan 侧 `idRe`（`:370`）加同一排除，或删掉本 plan 附录 A 的 8 行 `F-` 落点。② 或把 B 载体收窄为「首列含 `-TC-` 或 `-` 且非 `F-`」（同样须两侧同批）。**取舍**：① 更保守（不动既有 ID 形态、S2/S3/S5 的双载体语义零变化），否掉 ② 的理由是 ② 会误伤 S5 的 `P01` 一类无前缀 ID。**验收**：`node --test "scripts/check-plan.test.mjs"` 全绿 + `coverage`/`deps` 不变 + `map` 得 `missing 0 dangling 0（cases 58 / mapped 58）`（**不是只验 `missing 0`**）。触发 = **下一次修订 `scripts/check-plan.mjs` 或本 testcase 时同批**（本段不改已签脚本） |

---

## Task 1: 定义层静态数据（`enums` + 2 个 vocab + `landings` / `scenes` / `signals`）+ `index` barrel v1

**Files:**
- Create: `tools/docgen/card-model/enums.mjs`
- Create: `tools/docgen/card-model/vocab/subjective-terms.mjs`
- Create: `tools/docgen/card-model/vocab/criterion-terms.mjs`
- Create: `tools/docgen/card-model/landings.mjs`
- Create: `tools/docgen/card-model/scenes.mjs`
- Create: `tools/docgen/card-model/signals.mjs`
- Create: `tools/docgen/card-model/index.mjs`（v1：只导出已建模块，T2–T7 增量补齐至 §3 `:48`）
- Create: `tools/docgen/test/card-model.test.mjs`（helper + A 组首 4 条）

**Interfaces:**
- Consumes: 无（判据全在 spec §5 `:115-133`、§7 `:168-190`、§4.2 `:101-112`）
- Produces: 8 张冻结表 + `ID_NAME_RE` + 文本扫描常量 + 两个词表数组 + `resolveLanding()` + `SEAT_SCENES` / `SEAT_SIGNALS`（空集）+ 场景/信号对账 helper（供 Task 5 / 6 调用）+ `index.mjs` 的可增长 barrel（供 Task 2–7 追加导出）

- [x] **Step 1: `enums.mjs` 的 8 张表逐项写死**

按 spec §5 `:117-126` 逐项（值一字不差）：`SHARED_SCENES` 8（`session` / `parliament.round` / `issue.card` / `defense` / `deliverable` / `command` / `handoff` / `criterion`）、`MOMENTS` 8、`REPEATS` 4、`SIGNALS` 5、`VERDICTS` 3、`CHECK_KINDS` 3、`SCOPES` 5、`LANDING_VARS` 2（`review.dir` / `round.no`）。带 label 的 3 张表（`SHARED_SCENES` / `MOMENTS` / `SIGNALS`）用 `{ id, label }` 数组形态，其余为 id 字符串数组（A02 按此口径断「只有 id 字面」）。全部 `Object.freeze`；**不得**出现「等 / 其他」这类开放条目（V-1）。

- [x] **Step 2: `enums.mjs` 的 ID 谓词与文本扫描常量**

`ID_NAME_RE = /^[a-z][a-z0-9.:-]*$/`（§5 `:130`，与 S6 spec §3.4 同形，仓内不引 S6 模块）。文本常量按 §7 逐行写死：`VAGUE_TERMS` 5（该内容 / 上述 / 相关 / 前述 / 该项，`:178`）、`HARDCODED_COUNT` 三条式（`共\s*N\s*[条项个]` / `缺一[条项]` / `全部[命中]*`，`:187`；`N` 的字符面 = 半角 + 全角 + 汉字数字）、`POINTER_WORDS` 5（见 / 详见 / 参见 / 参考 / `按 §`，`:188`）、`PROC_WORDS` 5（收卡 / 丢卡 / 压卡 / 点名 / 判结束，`:190`）、`MIXED_PAIR = ['议长','主持人']`（`:189`）。

**`SCAN_FIELDS` 也写在 `enums.mjs`**（8 键 = 8 个文本类码名、值 = 该码要扫的字段引用数组，§4.2 `:101-112`；**不按「扫描面相同」合并成 4 组键**，`:112`）。理由：§3 `:37` 把 `enums.mjs` 定为「文本扫描常量」的**唯一写死处**，且已签 testcase 直接断言 `EN.SCAN_FIELDS`（`testcase:1486-1494`）；写进 `validateCardModel.mjs` 会让 G09 ⑨ 必红。

- [x] **Step 3: 两个词表物料**

`vocab/subjective-terms.mjs` 导出 `subjectiveTerms` 数组 = **自省 / 客观 / 诚实 / 宽松 / 严格**（PRD `:270`，5 词，与 PRD 原文逐字）；`vocab/criterion-terms.mjs` 导出 `criterionTerms` = **处置 / 依据 / 充分 / 合理 / 及时 / 适当**（PRD `:202`，6 词）。**不 import 任何模块**（纯数组物料），`Object.freeze`。

- [x] **Step 4: `landings.mjs`**

`export { LANDING_VARS } from './enums.mjs'` + `resolveLanding(landing, landings, unboundVars) → { ok, reason? }`：实现 §7 `:180` 三档——① `landing` 缺/空 → 不通过；② 按**最长已登记前缀**匹配（登记集 = `landings` ∪ `LANDING_VARS`，允许 `<登记值>/<子段>` 形态，子段按 `/` 逐段判、任一段 ∈ `unboundVars` 即红）；③ 命中的**登记值本身** ∈ `unboundVars` → 红（`landing = 'review.dir'` 这一形态）。**`resolveLanding` 不发射错误码**（码由 Task 5 的发射点发），只给判定结果。

- [x] **Step 5: `scenes.mjs` / `signals.mjs` 与两张席局部登记表**

`scenes.mjs`：re-export `SHARED_SCENES`；`SEAT_SCENES = Object.freeze({})` —— **它只是默认空集**，已签 testcase 直接断它恒空（`testcase:524`「本轮必须是空集，内容由 S4 填」）；**判定的真实输入是 `env.seatScenes`**（`testcase:1087-1089` 三构造全部经 env 注入）。三个对账 helper 实现 §7 的场景码判据（`DuplicateScene` 两子面 `:168` / `ScenePromotionRequired` `:169` / `UnusedScene` `:170`），入参必须收 `env.seatScenes`。`signals.mjs`：`SIGNALS` re-export；`SEAT_SIGNALS = Object.freeze({})` 同为默认空集（`testcase:525`），**判定输入 = `env.seatSignals`**（`testcase:1059` / `:1071`）；`unknownSignalType()`（`:174`，只认「全局 5 类 ∪ 本席登记」）与 `signalProliferation()`（`:176`，局部 type 被 < 2 个场景引用即红）。**读模块常量而非 `env` 的实现在 E05 / E06 / C01 组 6 上必红**（`testcase:1073` 明写「不读 `env.seatSignals` → 被 `UnknownSignalType` 顶掉」）。

- [x] **Step 6: `index.mjs` v1（可增长 barrel）**

v1 只导出：8 张表 + `ID_NAME_RE` + 两个词表数组 + `resolveLanding` + `SUBJECTS` 之外的已建面。**头部注释写死**：最终出口面 = §3 `:48` 的 18 项，T2–T7 逐任务追加；**任何任务不得把 barrel 写成「先空后补占位函数」**。

- [x] **Step 7: 测试文件 helper（testcase §0.3 逐字）+ A 组 4 条**

按 `testcase:64-216` 逐字落 §0.3 的 helper（`codes` / `pathsOf` / `green` / `only` / `pickSubject` / `baseEnv` / `ENV_KEYS` / `baseCard` / `run` / `baseDoc` / `runDoc` / `openItem` / `deepFreeze` / `SPEC_LINES` / `specLine` / `UNIT_KEY` / `THRESHOLD_UNITS` / `cutList` / `PROC_WORDS` / `POINTER_WORDS`）——**import 段只列本任务已存在的模块**，T2–T7 逐任务补（末态必须等于 §0.3 的 11 条 card-model import（`M` + 10 个模块；`testcase:73-83` 实测 11 条），Task 7 核对）。`baseEnv()` / `baseCard()` 依赖 `M.SUBJECTS` / `registeredIdsOf`，本任务先以 `SUB.SUBJECTS` 与本任务已建的 8 表构造，`M.` 入口在 Task 2 / Task 4 各自到位后切回（见对应 Task 的 Step）。

| ID | 断言（判据出处） |
|---|---|
| A02 | 表内容逐项等于期望集合：塞一条「其他 / 等」即红；`REPEATS` / `VERDICTS` / `CHECK_KINDS` / `SCOPES` 只有 id 字面（`testcase:370` / V-1 `:247`） |
| A03 | id 谓词 5 类变异（大写 / 下划线 / 中文 / 含 `/` / 空串）逐项判不过（`testcase:371` / §5 `:130`） |
| A04 | 8 个 scene label / 8 个 moment label / 5 个 signal label 与 PRD 原文逐字相等（**第三方通道**：读 `PRD:249-259` 切分，`testcase:372` / §4 `:2099`） |
| A05① | 词表全成员对账：`PRD:270`（5 主观词）/ `PRD:202`（6 判据词）原文切词 `deepEqual` 到 `vocab/*` 两数组（逐条必红半在 Task 6，`testcase:373`） |

- [x] **Step 8: 跑测试与仓门禁**

```powershell
node --test "tools/docgen/test/card-model.test.mjs"; "exit=$LASTEXITCODE"
npm run check; "exit=$LASTEXITCODE"
```

Expected：`exit=0`、`# fail 0`、`# pass + # skipped === # tests`；本文件 `test('S1-TC-` 计数 = **4**；`check` 末行 `check 全部通过`。

---

## Task 2: 主语登记、三态入口与开放项（`subjects.mjs` + `open-items.mjs`）

**Files:**
- Create: `tools/docgen/card-model/subjects.mjs`
- Create: `tools/docgen/card-model/open-items.mjs`
- Modify: `tools/docgen/card-model/index.mjs`（追加 `SUBJECTS` / `SUBJECT_VALIDATORS` / 三入口 / `validateOpenItems`）
- Modify: `tools/docgen/test/card-model.test.mjs`（补 import + 10 条）

**Interfaces:**
- Consumes: Task 1（8 张表里的 `SCOPES`、`VERDICTS`、`ID_NAME_RE`）
- Produces: `SUBJECTS`（登记表，**不是第 9 张封闭枚举**，§5 `:131`）+ `SUBJECT_VALIDATORS`（`validator` 投影）+ `verdictAllowed` / `compareVerdicts`（`{ ok, errors }` 形状，spec §6 `:141`）+ `deriveScope()` + `validateOpenItems()`（只判三码）

- [x] **Step 1: `subjects.mjs` 登记表与三入口**

`SUBJECTS = { 'reviewer-detective.card': { display, validator }, 'artifact.observation': { display, validator } }`（迁移起点 = PRD `:293` 两项，S4 扩到 15 席——本段**只放这两项**，不预铺）；`SUBJECT_VALIDATORS = SUBJECTS 的 validator 投影`（precomputed，供 `UnverifiableOutput` 判「有没有校验器」）。`subjectMatches(subject, objectType)`（缺省 `objectType` 沿用 `subject`）；`verdictAllowed(subject, objectType, verdict) → { ok, errors }`（`SubjectMismatch` 只在 `verdict ∈ {hit, miss}` 且类型不符时报；`na` 允许，§7 `:200`）；`compareVerdicts(docA, docB, env) → { ok, errors }`（同 `id` 两实例 `verdict` 不同 → 一条 `DisagreementOpen`，不取多数、不改判，`:202`）。

- [x] **Step 2: `open-items.mjs` 的 `deriveScope()`**

re-export `SCOPES`；`deriveScope(object)` 按 §5 `:132-133` 实现：先 `object.replace(/\\/g, '/')` 归一，再按下表**自上而下**取首个命中的**最长前缀**——`docs/superpowers/reviews/`→`process`；`.session/`→`process`；`agents/`→`card`；`tools/`、`scripts/`→`code`；`docs/`→`doc`；其余→`repo`。映射表**写死在本文件**，不读配置。

- [x] **Step 3: `validateOpenItems(doc, env, cards)` 只判三码**

`EmptyOpenWithoutReason`（`open` 空且 `openEmptyReason` 缺/白空格，§7 `:197`）/ `OutOfScopeOpenItem`（`scope` ≠ `deriveScope(object)`，`:198`）/ `DuplicateAsOpen`（`object` 逐字等于任一 `registeredIds` 成员，`:199`）。**不复判缺列**（`MissingOpenField` 归 S2 `checks.mjs`，§7 `:208` + §10-D14 `:273`）；第三参 `cards` 必传（spec §6 `:139`），未传按 `env.registeredIds` 对账 fail-closed（`UnverifiableOutput`，与 Task 4 的缺键纪律同形）。**纯函数**：不改 `doc` / `cards`。

- [x] **Step 4: 写测试（10 条：A01 + I01、I02 + H01–H06 + K03）**

| ID | 断言（判据出处） |
|---|---|
| A01 | 8 张表数量 = 8/8/4/5/3/3/5/2、值全过 id 谓词、各表自 `index` 与各模块**同一引用**、`M.SUBJECTS === SUB.SUBJECTS` + 两投影键集相等（`testcase:369` / §5 `:131`） |
| I01 | `verdictAllowed(subject, objectType, verdict)` 三位置参：`hit`/`miss` + 类型不符 → 红；`na` → 绿；`objectType` 缺省 → 绿；`verdict = 'hit/miss'` → 只报 `FreeTextEnum`（`testcase:413` / §7 `:219`+`:241`） |
| I02 | `compareVerdicts`：同 id verdict 不同 → 一条开放项；相同 → 无；两实例同写含 `/` 的 verdict → 只报 `FreeTextEnum`（`testcase:414`） |
| H01 | `open` 空 + 理由缺/白空格 → 红；有理由 → 绿（`testcase:407`） |
| H02 | `deriveScope` 8 段映射逐项；`docs/superpowers/reviews/x/progress.md` → `process`（**不得**判 `doc`）、`docs/superpowers/specs/x.md` → `doc`（`testcase:408`） |
| H03 | `object` 逐字等于 `registeredIds` 成员 → 红（`testcase:409`） |
| H04 | Windows 反斜杠三条（`tools\x.mjs` → `code`、`docs\superpowers\reviews\x\progress.md` → `process`、`docs\superpowers\specs\x.md` → `doc`）与正斜杠同值（`testcase:410`） |
| H05 | 五列齐 + scope 一致 → 绿（0 条 / N 条两形态）（`testcase:411`） |
| H06 | 缺 `impact`/`suggestion` 在 S1 侧**不报任何码**；三码仍各报；`CARD_MODEL_CODES` 不含 `MissingOpenField`；S2 实现按**内容锚**定位（不锁行号）（`testcase:412`） |
| K03 | `open[].evidence` 写不可解析串 → 本段不报任何码（`testcase:425`） |

- [x] **Step 5: 跑测试与仓门禁**

```powershell
node --test "tools/docgen/test/card-model.test.mjs"; "exit=$LASTEXITCODE"
npm run check; "exit=$LASTEXITCODE"
```

Expected：`exit=0`、`# fail 0`；本文件 `test('S1-TC-` 累计 = **14**；`check` 末行 `check 全部通过`。

---

## Task 3: 表达式判定与合并（`expression.mjs` + `merge.mjs`）

**Files:**
- Create: `tools/docgen/card-model/expression.mjs`
- Create: `tools/docgen/card-model/merge.mjs`
- Modify: `tools/docgen/card-model/index.mjs`（追加 `ALLOWED_OPS` 相关面 + `mergeActions`）
- Modify: `tools/docgen/test/card-model.test.mjs`（补 import + 1 条）

**Interfaces:**
- Consumes: Task 1（`HARDCODED_COUNT` / `POINTER_WORDS` 一类文本常量、`criterionTerms`）
- Produces: `isJsonLogic()` / `operatorDepth()` / `scanCriterionText()`（供 Task 4–6 消费）+ `OVERRIDABLE_FIELDS`（6 字段）+ `mergeActions()`（3 合并码，**不入 `CARD_MODEL_CODES`**）

- [x] **Step 1: `expression.mjs` 的算子集与三个探针**

`ALLOWED_OPS` = JSON Logic 标准算子集（spec §7 `:191` 只写「键 ∉ `ALLOWED_OPS`（JSON Logic 算子集）」，**未枚举**）——**清单写死在 `expression.mjs` 一处、按 JSON Logic 规范取全集**，plan 不在此复列（复列即第二处口径，必漂）；`isJsonLogic(expr)`（出现 `&&` / `||` 串、对象节点键数 ≠ 1、键 ∉ `ALLOWED_OPS` → 不可读）；`operatorDepth(expr)`（算子嵌算子 = 深度 > 1）；`scanCriterionText(text)` 返回三个命中面（`termHits` / `thresholdHits` / `unitHits`），`UNIT_KEY` 映射写死七项（次→`times` / 条→`count` / 字→`chars` / 个→`items` / 轮→`rounds` / 处→`spots` / %→`percent`，§7 `:194`；映射外单位一律红）。**只做判定、不发码**（码在 Task 6）。

- [x] **Step 2: `merge.mjs` 的 6 字段与 3 合并码**

`OVERRIDABLE_FIELDS = ['kind','trigger','objects','criterion','landing','requires']`（§7 `:206`；PRD `:187` 要求含 `kind`；S2 `tools/observation-check/render.mjs:39` 的旧表缺 `kind`/`objects` 属 §11-1 已登记副本，**本段不修**）。`mergeActions(shared, own) → { ok, errors }`：`DuplicateStatement`（同层同 id）/ `OverrideWithoutReason`（跨层覆盖无 `reason`）/ `PointlessOverride`（覆盖后与原件逐字段无差异）。**三码不写进 `CARD_MODEL_CODES`**，`errors[].code` 用本文件局部常量。

- [x] **Step 3: 写测试（1 条：J02）**

| ID | 断言（判据出处） |
|---|---|
| J02 | `OVERRIDABLE_FIELDS` 精确集合（含 `kind`/`objects`）+ 三合并码各一构造；`mergeActions()` 返回 `{ ok, errors }`；三码**不在** `CARD_MODEL_CODES`；含覆盖动作的卡经 `validateCardModel` **不返回任何合并码**（`testcase:418` / §10-D19 `:278`） |

> J02 的第四半（`validateCardModel` 不返回合并码）依赖 Task 4 / 5 的发射点，本任务先写前三半，**Task 5 收尾时补齐第四半并复跑**（同一 `test()` 内追加断言，计数不变）。

- [x] **Step 4: 跑测试与仓门禁**

```powershell
node --test "tools/docgen/test/card-model.test.mjs"; "exit=$LASTEXITCODE"
npm run check; "exit=$LASTEXITCODE"
```

Expected：`exit=0`、`# fail 0`；本文件 `test('S1-TC-` 累计 = **15**；`check` 末行 `check 全部通过`。

---

## Task 4: `validateCardModel` 骨架 + 契约纪律 + `index.mjs` 完整出口

**Files:**
- Create: `tools/docgen/card-model/validateCardModel.mjs`（骨架：码表常量 + 契约层 + `registeredIdsOf` + 空族实现）
- Modify: `tools/docgen/card-model/index.mjs`（补到 §3 `:48` 的 18 项出口）
- Modify: `tools/docgen/test/card-model.test.mjs`（补 import + 9 条）

**Interfaces:**
- Consumes: Task 1（`enums.mjs` 全部常量）、Task 2（`subjects` / `open-items`）、Task 3（`expression` / `merge`）
- Produces: `CARD_MODEL_CODES`（36 键，值 = 判定面字段引用）、`registeredIdsOf(cards)`、`validateCardModel(card, env)`（本任务先只做契约层与顺序/纯性，族判定由 Task 5 / 6 填）+ `index.mjs` 完整 barrel。**`SCAN_FIELDS` 不是本任务产出**：只在 Step 2 里消费 Task 1 在 `enums.mjs` 写死的那一份（本文件不得重新定义）

- [x] **Step 1: 码表常量 `CARD_MODEL_CODES`（36 键）**

键 = §7 `:168-203` 的 36 个脚本码（35 = PRD `:361` S1 组去 `WeakReason` + `MissingCriterionImpl`），**值 = 该码的判定面字段引用**（如 `must[].criterion` / `checkItems[].label`，**不写行号**，spec §6 `:147` + §10-D21 `:280`）。三合并码与 `WeakReason` **不得**出现在本常量里。

- [x] **Step 2: `SCAN_FIELDS` 的消费（**不另写一份**）**

`SCAN_FIELDS` 已在 Task 1 Step 2 写死在 `enums.mjs`（8 键 = `SubjectiveLabel` / `InlineTermList` / `InlineThreshold` / `AmbiguousCriterion` / `PointerToElsewhere` / `HardcodedCount` / `MixedTermInCard` / `ProceduralWordOutsideParliament`）。本任务只 `import { SCAN_FIELDS } from './enums.mjs'` 并按它决定「每个文本码扫哪些字段」；**不得在本文件重新定义**（两种实现 = G09 ⑨ 的键集断言必红，且 `index.mjs` 会出现两份来源）。

- [x] **Step 3: `registeredIdsOf(cards)`**

= 入参全部卡的 `checkItems[].id` **并集去重**（§4 `:90`）；空集是**期望值**不是恒真（J04 的边界口径）。

- [x] **Step 4: 契约纪律（四入口共用）**

① `env` 11 键**逐键**在位检查：缺任一 → `UnverifiableOutput`（`path = env.<键名>`）并**继续判**；`card` / `doc` 非对象 → 同码（§6 `:153`）；② 判定内部抛异常 → 收敛 `UnverifiableOutput`（`message` = 异常首行）并继续判（`:152`）；③ open-world：`Card` 上未列字段忽略不判（`:155`）；④ `env.registeredIds` ≠ `registeredIdsOf(cards)` → `UnverifiableOutput`（`path = env.registeredIds`，`:154`）；⑤ `errors` 顺序固定：卡级 → `scenes` → `signals` → `must`/`never`（数组序）→ `checkItems`（`:156`）；⑥ 同一次返回内 `path` 唯一（`:157`）。

- [x] **Step 5: `index.mjs` 补到 §3 `:48` 的 18 项**

8 张表 + `SUBJECTS` / `SUBJECT_VALIDATORS` + **四入口** + `CARD_MODEL_CODES` + `SCAN_FIELDS` + `mergeActions` + `registeredIdsOf`。**只 re-export，不重新实现**（防两份实现）。

- [x] **Step 6: 写测试（9 条：B05 + C02 + D01–D04 + K01 / K02 / K04）**

| ID | 断言（判据出处） |
|---|---|
| B05 | 最小合法卡（`baseCard()`）→ `{ ok: true, errors: [] }`（红点对照绿基线，`testcase:378`） |
| C02 | 全部构造 + 一张多问题卡：同一次返回内 `path` 唯一（M1，`testcase:380` / §8 `:224`） |
| D01 | 深冻结 `card` + `env` 后调用成功；两次调用结果 `deepEqual`（`testcase:382` / V-4） |
| D02 | 调用前后入参结构化快照逐字相等（`testcase:383`） |
| D03 | 注入抛异常的 `predicates` → `UnverifiableOutput` 且**其余条目仍被判定**（`testcase:384` / §6 `:152`） |
| D04 | 字段声明顺序不同的等价卡 → `errors` 顺序一致且合 §6 固定序（`testcase:385` / §6 `:156`） |
| K01 | `baseEnv()` 键集与 11 键双向相等；缺任一键 → `UnverifiableOutput`（`path = env.<键>`）且继续判；`env.registeredIds` ≠ 派生 → `UnverifiableOutput`（`path = env.registeredIds`）（`testcase:423`） |
| K02 | `script` 条目带 `cmd` 或 `impl` → 绿；`Card` 上未列字段 → 忽略不判（open-world）；两者都缺 → 红（后者由 Task 6 的 `FalseScriptCheck` 断言，本任务先写前三半）（`testcase:424`） |
| K04 | 四入口各自只报自己那族码：非卡片数据字段一律不判；`validateOpenItems` 不报卡级码；`compareVerdicts` 不报 `SubjectMismatch`；`verdictAllowed` 不报卡级码；`validateCardModel` 不返回合并码（`testcase:426`） |

- [x] **Step 7: 跑测试与仓门禁**

```powershell
node --test "tools/docgen/test/card-model.test.mjs"; "exit=$LASTEXITCODE"
npm run check; "exit=$LASTEXITCODE"
```

Expected：`exit=0`、`# fail 0`；本文件 `test('S1-TC-` 累计 = **24**；`check` 末行 `check 全部通过`。

---

## Task 5: 场景 / 信号 / 动作 / 落点四族判定

**Files:**
- Modify: `tools/docgen/card-model/validateCardModel.mjs`（填场景 / 信号 / 动作三族 + 落点判定）
- Modify: `tools/docgen/test/card-model.test.mjs`（补 14 条 + J02 第四半）

**Interfaces:**
- Consumes: Task 4（骨架 / 契约层 / 码表 / 落点接入）、Task 1（`enums.mjs` 的 `VAGUE_TERMS` / `PROC_WORDS` / `MOMENTS` 等文本与枚举常量）——`SCAN_FIELDS` 由 `enums.mjs` 写死（Task 4 只 import 转手），本任务不新增来源
- Produces: 场景 5 码、信号 5 码、动作 5 码（含 `MissingCriterionImpl` 的 `Action` 面）的实际发射逻辑；`resolveLanding` 接入

- [x] **Step 1: 场景族（5 码）**

`DuplicateScene`（同 id 在 `card.scenes` 出现 2 次；**或** 同 id 已在 `SHARED_SCENES` 又出现在 **`env.seatScenes[seat]`**）/ `ScenePromotionRequired`（同席局部 id 出现 ≥2 席登记表，读 `env.seatScenes`）/ `UnusedScene`（**只判本席声明过**的场景，共用 8 个未声明者不判，§10-D5 `:264`）/ `MissingSceneRationale`（非共用 id 缺 `why` 或去空白为空）/ `FreeTextEnum`（`scene.id` / `trigger.moment` / `trigger.repeat` / `signals[].type` / `check` 的取值含 `/`）。

- [x] **Step 2: 信号族（5 码）**

`MissingSignal`（`trigger` 缺三键任一；或信号条目缺 `observer` / `match`，path 区分两处）/ `UnknownSignalType`（`type` ∉ `SIGNALS` 且 ∉ **`env.seatSignals[seat]`**）/ `UnobservableSignal`（`check === 'manual'` 且 `declarer` 缺/白空格）/ `SignalProliferation`（局部 type 被 < 2 个场景引用，§10-D6 `:265`）/ `MultiMomentInOneEntry`（`moment` 数组长 > 1，或字符串同时命中 ≥2 个 `MOMENTS` 成员 id 或 label）。

- [x] **Step 3: 动作族（5 码）+ 落点**

`VagueReferent`（`objects` 缺/空或任一项 ∈ `VAGUE_TERMS`）/ `MissingPrerequisite`（`requires` 中 `must:true` 的 id ∉ `env.available`，报文固定「缺 `<id>`，未开始」）/ `UnboundLanding`（调 `resolveLanding`，三档见 §7 `:180`）/ `MissingCriterionImpl`（`Action` 面：`criterion` 缺/空 **或** id ∉ `env.predicates`；**动作条目没有 `check` 字段 → 无 `manual` 豁免**，`CheckItem` 面在 Task 6）/ 带 `never` 同口径。

- [x] **Step 4: 写测试（14 条：B02 / B03 + E01–E07 + F01–F05）**

| ID | 断言（判据出处） |
|---|---|
| B02 | 场景族 + 信号族 **10 码**各一条最小红点（含 path 前缀）（`testcase:375`） |
| B03 | 动作族 + 检查项族 **13 码**各一条最小红点（检查项族的发射点在 Task 6，本任务先跑动作族 5 条，Task 6 收尾补齐至 13 条并复跑）（`testcase:376`） |
| E01 | `UnboundLanding` **五个子面**各一例：缺 / 最长已登记前缀无命中 / 登记值 + 子段绿 / 子段 ∈ `unboundVars` 红 / **登记值本身 ∈ `unboundVars`** 红；写明「首段比较」会在 `deliverable.body` 误报（`testcase:386` / §7 `:180`） |
| E02 | 共用 8 场景未声明不判红；本席声明未用必红（`testcase:387` / §10-D5） |
| E03 | 共用 id 省 label/why 合法；局部 id `why` 去空白为空必红（`testcase:388`） |
| E04 | 单命中子串合法 / 双命中必红 / 数组长 1 合法 / 长 2 必红（`testcase:389`） |
| E05 | 局部 type 被 2 个场景引用 → 绿；1 个 → 红（阈值 2）（`testcase:390`） |
| E06 | 同卡同 id 重复 / 共用 + 席局部双处 / 跨两席登记（`testcase:391`） |
| E07 | `deliverable.body` 绿、`deliverable.body/row` 绿、`review.dir/x` 绿、`no.such.landing` 红；两种错误实现（首段比较 / 整串相等）各红在哪逐条写明（`testcase:392`） |
| F01 | `must:true` 不在 `available` → 红且报文含「缺 X，未开始」；`must:false` 未满足 → 绿（`testcase:393`） |
| F02 | 5 个模糊词逐个 + 缺/空 `objects` 全部必红（`testcase:394`） |
| F03 | `Action.criterion` 与 `CheckItem.criterion` 两处 path 不同、各报一次、互不抑制；`CheckItem` 面与 manual 豁免对照（**⑥⑦ 两半归 Task 6**，本任务先写 ①–③）（`testcase:395` / §7 `:181`） |
| F04 | 六字段齐 + `requires: []` + landing ∈ 并集 → 绿（`testcase:396`） |
| F05 | 3 个词表词放 `Action.criterion` → 只报 `MissingCriterionImpl`、**不报** `InlineTermList`；同文本放 `CheckItem.criterion` → 只报 `InlineTermList`（后半归 Task 6）（`testcase:397`） |

- [x] **Step 5: 补齐 J02 第四半并跑测试与仓门禁**

```powershell
node --test "tools/docgen/test/card-model.test.mjs"; "exit=$LASTEXITCODE"
npm run check; "exit=$LASTEXITCODE"
```

Expected：`exit=0`、`# fail 0`；本文件 `test('S1-TC-` 累计 = **38**；`check` 末行 `check 全部通过`。

---

## Task 6: 检查项 / 判据文本 / 审计族 + 互斥优先级（M1 / M2）

**Files:**
- Modify: `tools/docgen/card-model/validateCardModel.mjs`（检查项族 + 表达式族 + 审计族 + §8 优先级抑制）
- Modify: `tools/docgen/test/card-model.test.mjs`（补 16 条 + A05② / B03 / F03 / F05 / K02 的剩余半）

**Interfaces:**
- Consumes: Task 5（场景 / 信号 / 动作族的发射点与 `errors` 顺序骨架）、Task 3（`expression` / `merge`）、Task 1（`subjectiveTerms` / `criterionTerms` / `SCAN_FIELDS` / `HARDCODED_COUNT`）、Task 2（`SUBJECTS` / `SUBJECT_VALIDATORS`）
- Produces: 检查项 8 码 + 表达式 5 码 + 审计 3 码的实际发射逻辑；§8 的 8 组抑制表接入；`CARD_MODEL_CODES` 的 36 键全部可达

- [x] **Step 1: 检查项族（8 码）**

`MissingSubject`（`subject` 缺/空；或 `label` 不含 `SUBJECTS[subject].display`；**`subject` ∉ `SUBJECTS` → 只报 `UnverifiableOutput`**，§7 `:183`）/ `DuplicateCheckItem` / `CrossSubjectSharedItem` / `SubjectiveLabel`（按 `、`/`，`/`/`/空格 切分后有整项 ∈ `subjectiveTerms`）/ `HardcodedCount`（按 §4.2 扫描面 + `N` 三字符面）/ `PointerToElsewhere` / `MixedTermInCard` / `ProceduralWordOutsideParliament`（席 ∉ `env.parliamentSeats` 且命中程序词）。

- [x] **Step 2: 表达式族（5 码）+ 审计族（3 码）**

`UnreadableExpression` / `NestingTooDeep`（调 `expression.mjs`）；`InlineTermList`（`criterion-terms` 命中**不同**词 ≥ 3）/ `InlineThreshold`（命中单位式且 `params` 无对应键，映射外单位一律红）/ `AmbiguousCriterion`（命中 1–2 词且无 `definitions`）；`MissingRationale`（`rationale` 缺/白空格）；`MissingAiAudit`（`check === 'ai'` 且 rubric 三组任一组 < 1 条，或任一条无 `path:line`，或 `audit.sample` / `audit.command` 缺；**rubric 缺 `source` 归本码**，§10-D16 `:275`）；`UnverifiableOutput`（`subject` ∉ `SUBJECT_VALIDATORS` 或异常收敛）。

- [x] **Step 3: 接入 §8 的 8 组抑制（M2 粒度 = 判定面）**

按 `:230-237` 的组序表实现「同组内先命中先报、命中即停」；**同组多个码落在同一判定面**时按组序抑制，`errors[].path` 仍按 §6 输出带下标的定位串（`:226` / §10-D20 `:279`）。组 6 的两个码定义互斥（`UnknownSignalType` ∉ 席局部表、`SignalProliferation` ∈ 席局部表），**必须读 `env.seatSignals` 才判得出**（模块常量 `SEAT_SIGNALS` 恒空，只作默认值）。

- [x] **Step 4: 写测试（16 条：A05② / B01 / B04 / C01 / C03 / G01–G09 / I03 / I04 / J01）**

| ID | 断言（判据出处） |
|---|---|
| A05② | `InlineThreshold` **7 个单位**逐条必红、程序词 5 个逐条必红、指针词 5 个逐条必红（三组常量从 spec `:194` / `:190` / `:188` 原文切，改 spec 即红）（`testcase:373`） |
| B01 | `TABLE` / `S1_CODES` / `CARD_MODEL_CODES` **三方双向集相等（36）**、无重复行、每行执行恰 1 次；`WeakReason` 与 3 合并码不在三方任一集合；**每个值必须是字段引用形态且不含 `:` 行号**（写成 `:180` 即红）（`testcase:374` / §6 `:147`） |
| B04 | 表达式 + 开放项 + 三态 + 审计 **13 码**各一条最小红点（`testcase:377`） |
| C01 | §8 **八组**逐组「多码候选构造」→ 只返回该组最上方那一码（组 1 `FreeTextEnum` / 2 `MissingSignal` / 3 `SubjectiveLabel`（另两构造断 `InlineThreshold` / `AmbiguousCriterion`）/ 4 `UnreadableExpression` / 5 `DuplicateScene` / 6 `SignalProliferation`（误实现对位）/ 7 `DuplicateAsOpen` / 8 `UnverifiableOutput`；**7 组真双命中 + 组 6 误实现对位**）（`testcase:379` / §8 `:226`+`:230-237`） |
| C03 | 表达式族两码分工：键非法 → 只报 `UnreadableExpression`；可读但深度 2 → 只报 `NestingTooDeep`；单层可读 → 绿（`testcase:381`） |
| G01 | `subject` 缺 / `label` 不含 `display` 必红；含 `display` 则绿（`testcase:398`） |
| G02 | 同 subject + criterion 两次必红；同 id 两 subject 必红；同 id 同 subject 不报后者（`testcase:399`） |
| G03 | 5 个主观词逐个 + 4 种分隔符（`、`/`，`/`/`/空格）逐项必红（`testcase:400`） |
| G04 | `MissingAiAudit` **6 形态**必红且只报本码；合法 ai 条目绿；末条收口断言：缺 `source` 不得报成 `AmbiguousCriterion`（`testcase:401` / §10-D16） |
| G05 | `definitions` + 数字进 `params` → 三码均不报；**7 单位配齐逐个绿**且映射从 spec `:194` 切（改成 `处→sites` 即红）（`testcase:402`） |
| G06 | 真实合法句「遇意见冲突」不判红（假阳性守卫）；「见 3」式指针必红（`testcase:403` / PRD `:223`） |
| G07 | `HardcodedCount` **五形态**必红（`共 3 条` / `共３条` / `共三条` / `缺一项` / `全部命中`），全角与汉字形态在 `duty.constraint` / `CheckItem.label` 上也必红；`rationale` 里的「全部」「共３条」不判红（`testcase:404`） |
| G08 | 两词同卡必红；议会席（∈ `parliamentSeats`）同文本豁免（`testcase:405`） |
| G09 | 违规词塞进 `rationale` / `description` / `scenes[].why` → 该码**不响**；塞进 `duty.constraint` / `CheckItem.label` → **必响**；`rationale` 命中「收卡」「主持人」→ 两码必响；`SCAN_FIELDS` **键数恰 8、逐码一项**（`testcase:406` / §4.2 `:112`） |
| I03 | `subject` ∉ `SUBJECT_VALIDATORS` → 红（与 D03 的异常面分开记账）（`testcase:415`） |
| I04 | `CARD_MODEL_CODES` 不含 `WeakReason`；注入副本码表即红（**第三方**：PRD `:216` 原文对账）（`testcase:416` / V-5 `:251`） |
| J01 | 全字段卡（局部 scene 带 label+why、三型 checkItem、categories、signals）→ 绿（`testcase:417` / F-01 / F-04） |

- [x] **Step 5: 补齐 Task 3–5 的剩余半并跑测试与仓门禁**

补齐：`A05②`（本任务 Step 4）、`B03` 的检查项族 8 条、`F03` 的 ④–⑦、`F05` 的后半、`K02` 的 `FalseScriptCheck` 半。

```powershell
node --test "tools/docgen/test/card-model.test.mjs"; "exit=$LASTEXITCODE"
npm run check; "exit=$LASTEXITCODE"
```

Expected：`exit=0`、`# fail 0`；本文件 `test('S1-TC-` 累计 = **54**；`check` 末行 `check 全部通过`。

---

## Task 7: 出口面收口 + 静态守卫（V-6 / V-8）

**Files:**
- Modify: `tools/docgen/card-model/index.mjs`（核对 §3 `:48` 的 18 项逐项在位）
- Modify: `tools/docgen/test/card-model.test.mjs`（补 4 条 + 核对 import 段与 testcase §0.3 逐字一致）

**Interfaces:**
- Consumes: Task 1–6（全部模块与测试）
- Produces: 出口面终态、`registeredIdsOf` 的边界断言、与 S6 的**双向零耦合**静态守卫

- [x] **Step 1: `index.mjs` 出口面逐项核**

按 §3 `:48` 核 18 项：8 张表 + `SUBJECTS` / `SUBJECT_VALIDATORS` + 四入口 + `CARD_MODEL_CODES` + `SCAN_FIELDS` + `mergeActions` + `registeredIdsOf`。**只 re-export**；`Object.keys(M)` 不得出现多余导出（对应 testcase §0.3 的 11 条 card-model import 只消费这 18 项）。

- [x] **Step 2: import 段与 testcase §0.3 逐字对齐**

`testcase:73-83` 的 11 条 card-model import（`M` + `EN` / `LD` / `SC` / `SIG` / `SUB` / `OI` / `EX` / `MG` / `ST` / `CT`；另 4 条为 `node:` 标准库）必须逐条在位且路径一致；helper 的函数体与 `:84-216` 逐字（`SPEC_LINES` / `cutList` 等从 spec 原文切的常量不得改成字面常量）。

- [x] **Step 3: 写测试（4 条：J03 / J04 / J05 / J06）**

| ID | 断言（判据出处） |
|---|---|
| J03 | `registeredIdsOf()` = 入参全卡 `checkItems[].id` 并集且去重；`baseEnv().registeredIds` 与之集合相等（**单源**）；S2 的 `REGISTERED_IDS` 未被改（静态：`tools/observation-check/registered-ids.mjs` 内容对比 `['k01','k02','k03']`）（`testcase:419` / §11-3 `:289`） |
| J04 | 三边界：单卡 / 无 `checkItems` / 重复 id（空集为**期望值**，不是空集上 `every`）（`testcase:420`） |
| J05 | `card-model/**` 无 `policy/` 引用，`policy/**` 无 `card-model` 引用（双向，前置两目录非空）（`testcase:421` / V-6 `:252`） |
| J06 | `card-model/**` 只 import `node:` 标准库与自身（不 import `observation-check/**` / `components/**`）（`testcase:422` / §3 `:52`） |

- [x] **Step 4: 跑测试与仓门禁**

```powershell
node --test "tools/docgen/test/card-model.test.mjs"; "exit=$LASTEXITCODE"
npm run check; "exit=$LASTEXITCODE"
node tools/docgen/cli.mjs gate; "gate=$LASTEXITCODE"
```

Expected：`exit=0`、`# fail 0`；本文件 `test('S1-TC-` 累计 = **58**（= testcase 条数，附录 A 逐行对得上）；`gate` 首行 `baseline 37/37`。

---

## Task 8: 验收与收口（一次性交付命令 + 遗留处置留痕）

**Files:**
- Create: `.session/reviews/2026-10-29-1813-agent-card-s1-plan-gate/impl-3.md`（该目录现只有 `plan-gate.md` / `impact-sheet.md`；本文件是本段 ③ 的验收输出，最后写）

**Interfaces:**
- Consumes: Task 1–7（全部产物已落地）
- Produces: `③@S1` 门行的全部证据（本任务只取数，签行由审计在 ④ 前另签）

- [x] **Step 1: 四条计划门命令复跑（结构零位移）**

```powershell
node scripts/check-plan.mjs coverage --plan docs\superpowers\plans\2026-10-29-agent-card-s1-card-model.md --prd docs\prd\20261026205821-agent-card-contract.md --stage S1; "exit=$LASTEXITCODE"
node scripts/check-plan.mjs deps --plan docs\superpowers\plans\2026-10-29-agent-card-s1-card-model.md; "exit=$LASTEXITCODE"
node scripts/check-plan.mjs map --plan docs\superpowers\plans\2026-10-29-agent-card-s1-card-model.md; "exit=$LASTEXITCODE"
node scripts/check-plan.mjs size --spec docs\superpowers\specs\2026-10-29-agent-card-s1-card-model-design.md --testcase docs\superpowers\specs\2026-10-29-agent-card-s1-card-model-design-testcase.md --rounds 3; "exit=$LASTEXITCODE"
```

Expected：`coverage: gap 0（prd 8 / plan 8）steps ok => ok`（exit 0）/ `deps: cycle 0 dangling 0（nodes 8 / edges 24） => ok`（exit 0）/ `map: missing 0 dangling 0（cases 66 / mapped 66） => ok`（exit 0）/ `size: spec 301/350 tc 66/80 rounds 3/3 => ok`（exit 0）。

- [x] **Step 2: 全仓门禁与 R8 回扫**

```powershell
node --test "tools/docgen/test/card-model.test.mjs"; "exit=$LASTEXITCODE"
npm run check; "exit=$LASTEXITCODE"
node scripts/scope-sweep.mjs --check; "sweep=$LASTEXITCODE"
node scripts/check-gate-record.mjs; "gate=$LASTEXITCODE"
```

Expected：`# tests ≥ 1039 + 58`、`# pass + # skipped === # tests`、`# fail 0`；`check` 末行 `check 全部通过`（本段只产 `.mjs`，**`④ markdown` 的文件 / 表数应与基线持平**——若涨了，说明多写了文档，属越界，须清掉）；`sweep ok`（exit 0）；`gate-record ok`（行数 = 本段门行写入后的现值，**不写死**）。

- [x] **Step 3: 遗留处置留痕（不单开任务）**

逐条判：`L-4` 的 6 条 P2 缺口 → 本段**采纳 / 不采纳**各写一句（采纳 = 改用例须派**新 sdet 实例**，施工者不得代改 testcase；不采纳 = 写明理由与触发信号）；`L-1` → 若 `CheckItem.criterion` 与 S6 `criteria.md` 三态冲突，**回 ② 段**（不得在 ③ 段改判据）。

- [x] **Step 4: 收口证据落盘**

把 Step 1–3 的命令与输出首行写进 `.session/reviews/2026-10-29-1813-agent-card-s1-plan-gate/impl-3.md`（**最后写**，mtime 必须晚于所有被扫文件），供 ③ 门行引用。

---

## 附录 A：testcase 58 条 → 落点映射表

> 口径一（用例）：**58 = 正 14 / 负 22 / 边界 22**（`testcase:2278-2282` 实测输出 `rows 58 pos 14 neg 22 edge 22 dupe 0`）。**每条用例 = 测试文件里一个 `test('S1-TC-XX …')`**（A05 在 Task 1 建立、Task 6 补断言，计数不变）；「落点」列 = 该用例最后的断言写在哪。
>
> 口径二（`check-plan map` 的 ID 集合）：**66 = 58 条用例 + 8 条 F 对位行**。testcase §1 末「F 对位」表的首列是 `F-01`…`F-08`（`testcase:441-450`），`map` 的 B 载体正则（`^\|\s*([A-Z][\w-]*?\d{2})\s*\|`）会把它当用例 ID 收进来 → 本表必须一并落点，否则 `missing 8`。这 8 行**不是用例**（类型 / 执行列写 `—`），落点与上文「功能点 → 任务映射表」**同源**（唯一来源是该表，本处只做 ID 对齐）。根因与修法见「遗留与留观」的 `M-1`。

| ID | 类型 | 执行 | 落点 |
|---|---|---|---|
| S1-TC-A01 | 正 | 常驻 | Task 2 |
| S1-TC-A02 | 负 | 常驻 | Task 1 |
| S1-TC-A03 | 负 | 常驻 | Task 1 |
| S1-TC-A04 | 边界 | 常驻 | Task 1 |
| S1-TC-A05 | 负 | 常驻 | Task 1（词表对账）+ Task 6（逐条必红） |
| S1-TC-B01 | 边界 | 常驻 | Task 6 |
| S1-TC-B02 | 负 | 常驻 | Task 5 |
| S1-TC-B03 | 负 | 常驻 | Task 5（动作族 5 条）+ Task 6（检查项族 8 条） |
| S1-TC-B04 | 负 | 常驻 | Task 6 |
| S1-TC-B05 | 正 | 常驻 | Task 4 |
| S1-TC-C01 | 边界 | 常驻 | Task 6 |
| S1-TC-C02 | 边界 | 常驻 | Task 4 |
| S1-TC-C03 | 边界 | 常驻 | Task 6 |
| S1-TC-D01 | 正 | 常驻 | Task 4 |
| S1-TC-D02 | 正 | 常驻 | Task 4 |
| S1-TC-D03 | 边界 | 常驻 | Task 4 |
| S1-TC-D04 | 边界 | 常驻 | Task 4 |
| S1-TC-E01 | 负 | 常驻 | Task 5 |
| S1-TC-E02 | 边界 | 常驻 | Task 5 |
| S1-TC-E03 | 边界 | 常驻 | Task 5 |
| S1-TC-E04 | 边界 | 常驻 | Task 5 |
| S1-TC-E05 | 正 | 常驻 | Task 5 |
| S1-TC-E06 | 负 | 常驻 | Task 5 |
| S1-TC-E07 | 正 | 常驻 | Task 5 |
| S1-TC-F01 | 负 | 常驻 | Task 5 |
| S1-TC-F02 | 负 | 常驻 | Task 5 |
| S1-TC-F03 | 负 | 常驻 | Task 5（①–③）+ Task 6（④–⑦） |
| S1-TC-F04 | 正 | 常驻 | Task 5 |
| S1-TC-F05 | 边界 | 常驻 | Task 5（假阳性半）+ Task 6（假阴性半） |
| S1-TC-G01 | 负 | 常驻 | Task 6 |
| S1-TC-G02 | 负 | 常驻 | Task 6 |
| S1-TC-G03 | 负 | 常驻 | Task 6 |
| S1-TC-G04 | 负 | 常驻 | Task 6 |
| S1-TC-G05 | 正 | 常驻 | Task 6 |
| S1-TC-G06 | 边界 | 常驻 | Task 6 |
| S1-TC-G07 | 边界 | 常驻 | Task 6 |
| S1-TC-G08 | 边界 | 常驻 | Task 6 |
| S1-TC-G09 | 边界 | 常驻 | Task 6 |
| S1-TC-H01 | 负 | 常驻 | Task 2 |
| S1-TC-H02 | 负 | 常驻 | Task 2 |
| S1-TC-H03 | 负 | 常驻 | Task 2 |
| S1-TC-H04 | 边界 | 常驻 | Task 2 |
| S1-TC-H05 | 正 | 常驻 | Task 2 |
| S1-TC-H06 | 边界 | 常驻 | Task 2 |
| S1-TC-I01 | 负 | 常驻 | Task 2 |
| S1-TC-I02 | 负 | 常驻 | Task 2 |
| S1-TC-I03 | 负 | 常驻 | Task 6 |
| S1-TC-I04 | 负 | 常驻 | Task 6 |
| S1-TC-J01 | 正 | 常驻 | Task 6 |
| S1-TC-J02 | 正 | 常驻 | Task 3（①–③）+ Task 5（④） |
| S1-TC-J03 | 正 | 常驻 | Task 7 |
| S1-TC-J04 | 边界 | 常驻 | Task 7 |
| S1-TC-J05 | 正 | 常驻 | Task 7 |
| S1-TC-J06 | 正 | 常驻 | Task 7 |
| S1-TC-K01 | 边界 | 常驻 | Task 4 |
| S1-TC-K02 | 边界 | 常驻 | Task 4（open-world 半）+ Task 6（`FalseScriptCheck` 半） |
| S1-TC-K03 | 边界 | 常驻 | Task 2 |
| S1-TC-K04 | 边界 | 常驻 | Task 4 |
| F-01 | — | — | Task 1、Task 5 |
| F-02 | — | — | Task 4、Task 5 |
| F-03 | — | — | Task 3 |
| F-04 | — | — | Task 6 |
| F-05 | — | — | Task 2、Task 6 |
| F-06 | — | — | Task 2 |
| F-07 | — | — | Task 3、Task 6 |
| F-08 | — | — | Task 1、Task 5 |

**合计**：**66 行**（58 条用例 + 8 条 F 对位行）；**常驻 58 / 验收 0**（本段无「一次性交付动作」型用例——testcase §5 `:2110` 的 3 条手动验证项不属 V 组用例，不进本表）。

## 附录 B：执行顺序与提交切分

| 提交 | Task | 内容 | 可否独立回滚 |
|---|---|---|---|
| 1 | Task 1 | `enums` / 2 vocab / `landings` / `scenes` / `signals` / `index.v1` + 4 条测试 | 是（无调用方，`check` 仍绿） |
| 2 | Task 2 | `subjects` / `open-items` + 10 条测试 | 是 |
| 3 | Task 3 | `expression` / `merge` + 1 条测试 | 是 |
| 4 | Task 4 | `validateCardModel` 骨架 + `index` 完整出口 + 9 条测试 | 是 |
| 5 | Task 5 | 场景 / 信号 / 动作三族 + 14 条测试 | 是 |
| 6 | Task 6 | 检查项 / 表达式 / 审计族 + M1/M2 + 16 条测试 | 是 |
| 7 | Task 7 | 出口面收口 + 4 条静态守卫 | 是 |
| 8 | Task 8 | 验收输出落 `.session/reviews/…/impl-3.md`（不进 git） | 是 |

> `②→③@S1` 门行在 **Task 1 开工前**单独签署，不随任何提交进入（与 S2 / S3 / S4 同形态）。

## Self-Review（写完即跑，逐条对照）

**1. spec 覆盖**：§3（文件与依赖方向）→ Global 1/2 + 文件结构表 + T1–T4 各 Step；§4 / §4.1 / §4.2（形状 / 两个 `criterion` 分形 / `SCAN_FIELDS`）→ T1 Step 2（`SCAN_FIELDS` 写死）+ T4 Step 2–3 + T5 Step 3 + T6 Step 1–2 + G09 / F05；§5（8 张表 / id 谓词 / `SUBJECTS` / `deriveScope`）→ T1 Step 1–2、T2 Step 1–2、A01–A05、H02 / H04；§6（接口 / 纯性 / 异常 / 缺键 / open-world / 顺序 / path / 入口分工）→ Global 3–5/8–9 + T4 Step 4 + D01–D04 / K01 / K02 / K04；§7（36 码判据）→ T4 Step 1 + T5 Step 1–3 + T6 Step 1–3 + B01–B04；§8（M1/M2）→ Global 7 + T6 Step 3 + C01 / C02 / C03；§9 V-1～V-8 → 附录 A 逐条（V-1→A01–A05、V-2→B01–B05、V-3→C01–C03 + K04、V-4→D01–D04、V-5→I04、V-6→J05 / J06、V-7→J01 与 F 对位、V-8→J03 / J04 / K01）；§10 D1–D22 → 逐条在对应 Task 内点名（D4 `:263`→F03；D5 `:264`→E02；D6 `:265`→E05；D7 `:266`→H02；D9 `:268`→J02；D13 `:272`→F05/G09；D14 `:273`→H06；D15 `:274`→G07/F03；D16 `:275`→G04；D17 `:276`→H04；D18/D21 `:277`/`:280`→E01/E07；D19 `:278`→J02；D20 `:279`→C01；D22 `:281`→K02）；§11 / §12 → L-2 / L-3 与 Global 13。**无缺口**。

**2. 占位扫描**：`TBD` / `待定` / 「适当处理」= 0 处；`TODO` 0 处；「待签」只出现在计划门签名状态行与附录 B（属**签字待办**，签行原文进 `gate-record.md`，本文件不复抄）。

**3. 类型一致**：`resolveLanding` 在 T1 定义、T5 消费；`scanCriterionText` 在 T3 定义、T6 消费；`registeredIdsOf` 在 T4 定义、T2（`baseEnv` 后续半）与 T7 消费；`SCAN_FIELDS` 在 T1 定义（`enums.mjs`，`testcase:1486` 冻结为 `EN.SCAN_FIELDS`）、T4 import 消费、T6（G09 ⑨）断言——**同一实现、不复制第二份**；`index.mjs` 是**纯 barrel**，`CARD_MODEL_CODES` 只在 `validateCardModel.mjs` 写一份。

**4. R4（无新增设计）**：本文件**无** `## 新增设计决策` 节。两处「读法」已逐条回指 spec，不是新决策：① 8 张表全写死在 `enums.mjs`（`:37`「唯一写死处」），`landings` / `open-items` 只 re-export + 消费（`:38` / `:42`）；② `index.mjs` 是**可增长 barrel**，终态 = §3 `:48` 的 18 项。施工期若再发现 spec 未定义的东西 → **回 ② 段重审 spec**（R4），不在本文件补。

**5. 命令符号可核（`stage-2b-plan-gate.md:60` 常见漏项）**：本 plan 引用的命令与路径全部实跑或 `path:line` 核过——`scripts/check-plan.mjs`（四子命令，`coverage` 已实跑得 `gap 0（prd 8 / plan 8）`）、`PRD:541-546`（F→S 表实测在 `:543`）、`scripts/check-gate-record.mjs`（`rows 28 bad 0`）、`scripts/scope-sweep.mjs`（`sweep ok`，**以当次清单** `.session/reviews/2026-10-29-1813-agent-card-s1-plan-gate/impact-sheet.md` 承接：裸 `--check` 会自动取 mtime 最新的清单，该清单落盘后即绿）、`tools/docgen/cli.mjs gate`（`baseline 37/37`）、`tools/observation-check/registered-ids.mjs:5`（`['k01','k02','k03']`，J03 的对照面）。**施工后才存在的符号**（`resolveLanding` / `scanCriterionText` / `registeredIdsOf` / `CARD_MODEL_CODES` / `SCAN_FIELDS`）均在对应 Task 内定义为产出物并标明由哪个 Task 产出。
