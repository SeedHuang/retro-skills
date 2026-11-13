# rule 与 agent 文档体系拉齐（PRD）

> 状态：草案 v0.5（2026-11-13），已按第四轮 3 组 P1 修订，待用户确认
> 来源：本次会话讨论 + 2026-11-13 三方评审（第 1 轮五项开放问题、第 2 轮增量、第 3 轮增量）；现状证据见 §1、§10
> 关联：rule-inspector 判据 `skills/rule-inspector/references/criteria.md`；agent 渲染 `tools/docgen/models/agents/render/`

## 0 谁、什么场景、什么价值

| 项 | 内容 |
|---|---|
| 谁 | 维护 `rules/` 与 `agents/` 的维护者；评审 rule / agent 产物的 reviewer-audit 与 senior-sdet |
| 场景 | 改 rule 或 agent 模型后重生成正文；新增 rule / 新增席；判断两套文档体系是否已同源 |
| 价值 | ① 一套渲染引擎、一套 CLI、一套基线，减少两套实现的漂移；② rule 已有 preview / registered check / gate，本 PRD 把覆盖扩到 5 个 model 并补类式类型校验；③ rule 质量分数在改造前后可对照，不靠感觉 |

## 1 背景：两套体系的五个代差

| # | 代差 | HEAD 现状（已交付/部分/缺失） | 后果 |
|---|---|---|---|
| 1 | **渲染器不同** | 两套渲染器并存：agent 用 `render/index.mjs` 按类型选段序 + `sections.mjs`；rule 用 `interpreters.mjs` 的硬编码 `renderDoc`；无共享 IR | 同一类「文档投影」有两套实现，模板/段序改动要改两处 |
| 2 | **模型类型缺失** | `schema.mjs` 的 `check()` 已覆盖字段白名单、18 算子、组合结构、probe；testcase 由 `checkTestcase()` 校验；缺的是类式类型与统一 `validate` 入口 | 缺字段、非法算子等已在 build 前失败；缺的是可复用类型 API 与 CLI 前统一入口 |
| 3 | **数据结构不同** | 无共享 IR：agent 是角色中心 JSON，rule 是判据中心 JSON；两侧均未实现 table/转义 | 段渲染无法复用；领域字段保持独立 |
| 4 | **CLI / gate 覆盖不对等** | rule 的 preview 已可用；`--check`/gate 只覆盖 `RENDERED_RULES`（1 条）；`npm run check` 经 criteria-engine 已覆盖 5 份投影与 testcase | 非 registered model 的 `--check` 无漂移判据；gate 与 check 分工未写明 |
| 5 | **质量度量不同** | agent 用四维（理解 / 执行 / token / 性能）；rule 用通用 17 + 执行力度 X1–X3 + 模式门控 M1–M6 | 两套分数不可直接比较；rule 没有历史四维基线 |

## 2 目标（功能点）

| # | 功能点 | 一句话判据 |
|---|---|---|
| F1 | **共享文档 IR 与渲染引擎**：只抽当前两侧实际用到的块（h1 / h2 / para / notes / bullets）与段序，落点 `tools/docgen/render/`；table / 转义等无第二消费者的能力不进首期；agent 与 rule 都编译到同一 IR | 同一份 rule model 经新引擎渲染，正文逐字节不变 |
| F2 | **RuleModel 类型系统**：为 rule 建类型与 `validate`，覆盖 type / impl / scope / when / assert / residual / refs / landing；testcase 必在由编排层保证 | 缺字段、非法算子、无 testcase 均在渲染前失败 |
| F3 | **统一 CLI（补残余缺口）**：rule 的 preview 与 registered rule 的 check/gate 已存在；本 PRD 补非 registered model 的 `--check` 漂移判据，并写清 gate 与 `npm run check` 的分工 | 非 registered model 的 `--check` 漂移即 exit 1；`gate` 按 §6.4 分工无遗漏 |
| F4 | **统一基线与 golden（已交付，补证据）**：5 份 rule 投影已由 `npm run check` 的 criteria-engine 逐字节比对；本 PRD 只补 5 个 model 的冻结 sha256 报告 | 手改 `rules/*.md`、改 model 未重生成均判红；5 份投影 sha256 与冻结值一致 |
| F5 | **数据结构共同外壳（候选，首期不做）**：共享 `id` / `kind` / `meta` / `sections` / `tests` 外壳；触发条件见 §9.2 | 首期不做；只保留“领域字段不进共享层”约束 |
| F6 | **质量不下降**：改造前冻结 `scs check rules` per-rule 分数；改造后同命令、同版本、同 annotations 复评 | 分数不下降、红点不新增；agent 四维与 gate 不回归 |

## 3 非目标

- 不合并 `AgentModel` 与 `RuleModel` 的领域语义；不做一份「万能模型」。
- 不改 rule 评分维度与满分口径（17 + X/M 仍由 rule-inspector 定义）。
- 不改 agent 四维评估协议；本 PRD 不重跑理解 / 执行 / token / 性能。
- 不在本 PRD 内改 rule 文案内容；第一阶段要求渲染逐字节不变，文案变更另走 rule-inspector 硬闸门。
- 不强行激活 `rules.json` 之外的 4 个 rule 模型；激活属独立决策，见 §9。
- 不做 rule 的四维评分；若需要，另立 PRD 与协议。
- 不提升 rule 的质量分数；本 PRD 只做结构拉齐，现有 57% 基线作为已知债登记。
- 首期不做 F5 共享外壳；触发条件见 §9.2。

## 4 适用范围

| 范围 | 内容 | 本 PRD 是否改 |
|---|---|---|
| rule 渲染 | `tools/docgen/builders/rules/interpreters.mjs` 的 `renderDoc` → `tools/docgen/render/` 共享段渲染（首期只抽实际使用块） | 是 |
| rule 模型 | `tools/docgen/models/rules/*.json`（5 份）+ `*.testcase.json` | 只加类型/校验，不改判据语义 |
| rule 注册 | `rules.json` 为唯一激活清单；`BASELINE_RULES` 由它派生（当前同为 1 条） | 只改派生关系，不新增激活 |
| agent 渲染 | `tools/docgen/models/agents/render/index.mjs` + `sections.mjs` | 抽共享块，输出不变 |
| agent 模型 | 18 席 JSON + 3 个模型类型 | 不改语义，仅接共享块 |
| CLI / gate | `tools/docgen/builders/agents/cli.mjs` | 补非 registered `--check` 漂移判据；写清 gate 与 `npm run check` 分工 |
| 质量度量 | `scs check rules`（17 + X/M） | 只做基线/复评，不改口径 |
| 文档联动 | `docs/prd/docgen-index.md` 的 D19 / P3 / P4 状态、`README.md` 的 baseline 说明、`skills/rule-writer/references/criteria-dsl.md` | 随 M0a/M3 同步（仅文档） |

## 5 权责

| 角色 | 职责 | 禁止 |
|---|---|---|
| 维护者（主 agent） | 抽共享引擎、迁移 rule 段、补类型与 CLI | 不得在同一批改 rule 文案与评分口径 |
| reviewer-audit | 核对 baseline、diff、gate 证据，签署「逐字节一致 / 分数不降」；独立复跑并留命令 + 输出 | 不得自证自己改的渲染器；改动者与签核者不得同一实例 |
| senior-sdet | 设计 golden / schema / 负例测试，独立复评 | 不得只测正例 |
| 用户 | 决定 dormant rule 是否激活、是否追加 4 维 | 不参与逐行实现 |

## 6 验收

### 6.1 基线冻结（改造前必做）

**M0a 只读冻结（无需 D19 授权；仅新建报告文件，不得改任何被跟踪件）**

- 记录 `git rev-parse HEAD`，要求无被跟踪改动（`git status --porcelain` 为空，或只含本 PRD / handoff / `docs/reports/` 基线报告等预期未跟踪件）；记录 `scs --version` 与 `node -v`。
- 清空 `DOCGEN_RULES_DIR` / `DOCGEN_AGENTS_DIR`（或记录其显式值），在仓库根执行。
- 跑 `scs check rules --root . --terms tools/docgen/models/rules/vocab/observable-terms.json --annotations tools/quality/.inspector-annotations.json`，保存逐 rule 分数、红点与退出码到 `docs/reports/<日期>-rule-baseline/baseline.json`；字段固定为 `{ruleId,score,max,rate,level,reds[],exitCode,scsVersion,nodeVersion,annotationsSha256}`；annotations 缺失即失败，不记“替代命令”。
- 记录 `rules/*.md` 与 `builders/rules/*.md` 的 sha256（`Get-FileHash ... -Algorithm SHA256`）。
- 跑 `npm run check`，记录 `agents 18/18`、`baseline 19/19`、末行 `check 全部通过`；该命令已包含 criteria-engine 的 5 份判据、testcase 与投影比对。

**M0b 写盘验证（需 D19 重启授权）**

- `node tools/docgen/builders/rules/build.mjs` 只在 D19 重启授权后、独立分支执行；执行前后 sha256 必须一致；未获授权不执行。

### 6.2 渲染逐字节一致

- 共享引擎落地后，5 个 rule model 的渲染结果与 §6.1 冻结的 md 逐字节相等；差异集合必须为空，不接受人工逐行确认豁免。
- 不允许借「模板优化」顺带改标题、义务编号、落点措辞。
- M1 出口另证新引擎确实被消费：`tools/docgen/render/index.mjs` 存在；`tools/docgen/models/agents/render/index.mjs` 与 `tools/docgen/builders/rules/interpreters.mjs` 均 import 它；`tools/docgen/**/*.mjs` 内 `renderDoc` 标识符 0 命中（`docs/**` 历史归档豁免）；`tools/docgen/render/render.test.mjs` 直接调新引擎渲染 5 model，与 `builders/rules/*.md` 逐字节比；删除新引擎文件必须使 `npm run check` 变红。
- M1 出口注明：4 条 dormant 投影的逐字节比对沿用 criteria-engine 既有判据，不另立 golden。

### 6.3 RuleModel 与 schema

- `RuleModel.validate` 覆盖：必填字段、type 枚举、18 算子白名单、anyOf/allOf/oneOf/not 结构；testcase 必在由编排层（`build.mjs:31`）保证。
- 负例落在 `tools/docgen/builders/rules/schema.test.mjs`（新建）：缺 `landing`、非法 op、type 越界各一条，断言 `check()` 的 finding code（非法 op 另断言 `message.includes('op 未注册')` 且 finding 条数为 1）；「无 testcase」由 `build.mjs:31` 编排层抛，需先给 `build.mjs` 加 `--data-dir`（或 env）注入，再用临时目录跑 build 并断言该文案。用例清单引用 `docs/prd/20261105182104-rule-refactor/prd/stage-2b-testcase-sdet.md` 的 A/B/C/E 组并标注已落地/未落地。
- `*.testcase.json` 的 cases 全过；新增算子须同时补正例与负例。

### 6.4 CLI / gate 对称

| 层 | 命令 | 覆盖面 | 漂移退出码 |
|---|---|---|---|
| gate | `node tools/docgen/builders/agents/cli.mjs gate` | 18 席 + 1 条 registered rule + 未登记手写扫描 | 1 |
| criteria-engine | `npm run check`（`scs check criteria-engine ...`） | 5 份 rule 投影 + 5 份 testcase | 1 |

- `generate --kind rule --name <id> --check`：registered model 漂移 exit 1、无漂移 exit 0。
- 非 registered model 的 `--check`：以 `builders/rules/<id>.md` 为基准逐字节比对；漂移 exit 1、缺件 exit 2。
- `generate --kind rule --name <id> --preview`：只写 `tmp/preview/rules/`。
- `gate`：rule 与 agent 同一道门；手改 `rules/*.md`、未注册 md、缺件均判红。
- `BASELINE_RULES` 派生断言：必须等于 `rules.json.rules.map(id => 'rules/'+id+'.md')`，且非空、条数等于 `rules.json.rules.length`；M3 同步更新 `scripts/check-observable.test.mjs:575`，不得只删守卫。

### 6.5 质量分数不下降

- 用 §6.1 完全相同的命令、`scs` / `node` 版本、annotations 重跑。
- 基线现状：1 条 active rule，13 / 23（57%，不及格）；本 PRD 只做结构拉齐，不承诺提升分数，该基线作为已知债登记。
- 每条 active rule 的分数不低于基线；无新增红点。
- 若任一 active rule 分数下降 ≥1 分或新增红点，立即中止并回滚到 M0a（用户执行）：① `git restore --source=<M0a SHA> --staged --worktree -- rules/ tools/docgen/`；② `git clean -fd -- tools/docgen/render tools/docgen/builders/rules/schema.test.mjs` 清新建未跟踪件；③ `git status --porcelain` 只剩白名单未跟踪件；再用 `docs/reports/<日期>-rule-baseline/baseline.json` 复核。按 rule-inspector 处方修复后再评，不得只修 core。

### 6.6 agent 不回归

- `agents 18/18`、`baseline 19/19`、`npm run check` 全绿。
- agent 卡逐字节不变；agent 四维分数不在本 PRD 内重测。

### 6.7 可选：rule 四维

- 若用户要求 rule 四维对比，另立 PRD，先定义理解 / 执行 / token / 性能协议并冻结基线；本 PRD 不把 rule-inspector 分数当四维。

## 7 依赖与风险

| 项 | 风险 | 缓解 |
|---|---|---|
| `scs check rules` | 外部 CLI 版本变化、annotations 不同导致分数不可比 | 冻结 `scs --version` 与 annotations；记录完整命令 |
| rule 文案评分敏感 | 通用模板可能改标题/义务结构，17 项掉分 | 第一阶段逐字节不变；第二阶段 diff + 分数门 |
| 只有 1 条 active rule | 改造覆盖面小，休眠模型未验证 | 本 PRD 不激活休眠模型；5 个 model 只做渲染 golden；激活另立 PRD |
| 领域 schema 被强行合并 | rule 的 `assert` 语义与 agent 的 `checkCriteria` 不同 | 共享 IR 只做块渲染；领域字段各留各的 |
| rule 四维无基线 | 无法直接说「四维不下降」 | 明确本 PRD 用 17+X/M 作硬门；四维另立 |
| `builders/rules/*.md` 投影 | 误当历史产物删除会打断 criteria-engine | 已确认有消费者（`package.json:12` 与 `scripts/check-all.mjs:549` 的 `--projection`）；禁删禁移，换落点须同步两处命令 |
| 中止/回滚 | 改造中途分数下降或新增红点，无退路 | M0a 记 `git rev-parse HEAD` + 基线报告；中止三步（用户执行）：`git restore --source=<M0a SHA> --staged --worktree -- rules/ tools/docgen/` → `git clean -fd -- tools/docgen/render tools/docgen/builders/rules/schema.test.mjs` → `git status` 只剩白名单 |

## 8 里程碑

| # | 里程碑 | 出口 |
|---|---|---|
| M0a | 只读冻结 | §6.1 M0a 证据齐（git SHA、sha256、基线报告）；无需 D19 授权 |
| M0b | 写盘验证 | §6.1 M0b 在 D19 重启授权后、独立分支执行；执行前后 sha256 一致 |
| M1 | 共享块 + 引擎 + rule 段渲染 | §6.2 逐字节一致；新引擎被消费（`tools/docgen` 内 `renderDoc` 0 命中、`render.test.mjs` 直调、删引擎即红）；dormant 沿用 criteria-engine；agent 不回归 |
| M2 | RuleModel + schema | §6.3 全过；负例测试文件齐 |
| M3 | CLI / gate / baseline 对称 | §6.4 全过；Q4 派生断言与 `check-observable.test.mjs:575` 更新完成；`npm run check` 含 rule |
| M4 | 可选四维 | 另立 PRD，不阻塞 M0a–M3 |

## 9 已决项与遗留开放项

### 9.1 已决（2026-11-13 三方评审）

1. **激活范围**：本 PRD 不激活 `rules.json` 之外的 4 个 rule 模型；只用 5 个 model 做渲染 golden 与基线冻结，激活另立 PRD。
2. **共享 IR 落点**：`tools/docgen/render/`（新建）；F1 首期只抽两侧实际使用块，table / 转义待第二个消费者出现再评估。
3. **投影消费者**：`builders/rules/*.md` 是 criteria-engine 的 `--projection` 输入（`package.json:12`、`scripts/check-all.mjs:549`）；禁删禁移，换落点须同步两处命令。
4. **注册唯一源**：`rules.json` 为唯一激活清单，`BASELINE_RULES` 由它派生；当前同为 1 条，不新增激活。
5. **rule 四维**：本 PRD 不做；§3 与 §6.7 口径不变，若需要另立 PRD 并先冻结协议与基线。

### 9.2 遗留开放项

- **D19 授权前置**：本 PRD 涉及 rule 生成链改动。M0a 只读冻结无需授权；M0b 写盘与后续实现需用户明确重启，并同步 `docs/prd/docgen-index.md:44` 的 D19 与 P3 / P4 状态；未获授权前不得进入 M0b / M1。
- **F5 共享外壳（候选）**：首期不做；触发 = 出现第二个消费 `sections` / `tests` 的模型，届时另立设计并补“领域字段不进共享层”单测。

## 10 证据锚

- agent 段序与类型：`tools/docgen/models/agents/render/index.mjs:11-31`；类型校验 `tools/docgen/models/agents/types/base.mjs:69-119`
- agent CLI：`tools/docgen/builders/agents/cli.mjs:51-160`
- rule 渲染：`tools/docgen/builders/rules/interpreters.mjs:8-29`；编排 `tools/docgen/builders/rules/build.mjs:1-53`
- rule schema：`tools/docgen/builders/rules/schema.mjs:288-352`（`check()`）；testcase 校验 `:345-352`
- rule 数据：`tools/docgen/models/rules/evidence-before-conclusion.json:1-38`
- active rule：`tools/docgen/builders/agents/components/baseline.mjs:10`；注册 `tools/docgen/models/rules/rules.json:1-3`
- 投影消费者：`package.json:12`（`check:criteria --projection tools/docgen/builders/rules`）；`scripts/check-all.mjs:549`
- rule 评分维度：`skills/rule-inspector/references/criteria.md:132-196`
- 基线命令：§6.1 的 `scs check rules ...`；历史出处 `docs/devworkflows/20261109211349-script-layer-refactor/migration-baseline.json:15`（terms 路径已迁至 `tools/docgen/models/rules/vocab/`）
