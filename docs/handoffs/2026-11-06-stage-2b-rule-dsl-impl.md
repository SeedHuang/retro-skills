# Session 交接：retro-skills → 阶段 2b rule DSL 施工（2026-11-06）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-06 11:53（Asia/Shanghai） |
| 项目根 | `D:\Seed\retro-skills` |
| HEAD | `82fc41e50f48115ba89b09a5c016b4a6b38cb444`；工作树：**脏** —— 21 个已跟踪文件改动/删除 + 6 组未跟踪（明细见「现状」） |
| 验证基线 | `node tools\quality\criteria-engine\build.mjs` exit 0（5 判据 / 34 样例 / `rule-dsl ok`）+ `node scripts\check-criteria-engine.mjs` exit 0（`判据 5 条 / 绿 34 / 红 0`）+ `node scripts\rule-audit-lite.mjs` exit 0（`说明层 全仓 0.0%`）+ `node scripts\check-all.mjs` **exit 1（4 个测试红）**（11:53 实跑） |
| 继任自 | 无（本 session 直接承接阶段 2b 讨论稿；链上最近一份是 `docs/handoffs/2026-11-05-rule-refactor-stage-1.md`，非直接继任） |
| 状态 | 可直开工，但有 3 个开放问题（见「开放问题」），其中第 1 条是开工第一问 |

## 项目定位

`D:\Seed\retro-skills` —— rule / skill / agent 三种载体的仓库；本阶段要给 rule DSL 补齐逻辑组合、算子谓词与判定动作，使 `rules/<id>.md` **只能由判据 json 经脚本渲染产出**，手改即红。

## 现状

- 已完成：
  - 阶段 1（23 条 rule 退出 `rules/`，bak 留底）与阶段 2（判据引擎转正、触发声明上线、门禁第 ⑨ 段）——阶段 2 的收口改动**尚未提交**，见下条。
  - 阶段 2b 设计闭环：需求稿、实现规格、SDET 测试用例（170 条，R5 一致）、施工计划四份文档齐备（路径见「范围依据」）。
  - 引擎侧当前形态：`tools/quality/criteria-engine/` 有 5 条判据、34 条样例、3 个解释器（`md` / `inject` / `rule`），`rules.mjs` + `rules.json` 负责 rule 投影。
- 验证证据：见元信息表『验证基线』（单源，勿在此重复填写）。
- 提交状态：`82fc41e` 之后的所有工作**未提交**，由下个 session 或用户自行 commit；工作树即真实状态。
- 工作树异常（`git status --short` 实得）：
  - 已跟踪改动：`README.md`、`docs/prd/20261105182104-rule-refactor/criteria-engine/README.md`、`docs/prd/20261105182104-rule-refactor/prd/index.md`、`docs/reports/2026-11-05-rule-refactor-stage-2/verification.md`、`rules/evidence-before-conclusion.md`、`scripts/check-criteria-engine.mjs`、`scripts/check-criteria-engine.test.mjs`、`scripts/rule-audit-lite.mjs`、`skills/rule-inspector/references/criteria.md`、`skills/rule-inspector/references/recipes.md`、`skills/rule-inspector/scripts/score.mjs`、`tools/docgen/components/renderedAssets.mjs`、`tools/docgen/test/rule-render.test.mjs`、`tools/quality/criteria-engine/build.mjs`、`tools/quality/criteria-engine/interpreters.mjs`。
  - 已跟踪删除：`tools/quality/criteria-engine/anchor-present.*`、`materials-four.*`、`target-present.*`（三组共 12 文件）、`carriers.mjs`、`carriers/evidence-before-conclusion.json` —— 语义已并入 `evidence-before-conclusion`（13 条样例）。
  - 未跟踪：`tools/quality/criteria-engine/rules.mjs`、`rules.json`、`evidence-before-conclusion.json` / `.testcase.json` / `.md` / `.inject.md`、`docs/prd/20261105182104-rule-refactor/rule-dsl/`（整个 pilot 目录）、阶段 2b 四份文档。
  - `check-all` 的 4 红全部来自 `scope-sweep --check`：输出 `FAIL: impact-sheet 早于被扫文件（.session/reviews/2026-11-05-2130-rule-refactor-stage-2/impact-sheet.md）`；`scripts\scope-sweep.mjs --check` 单跑同报 exit 1。与 2b 设计无关，属阶段 2 收口未补清单。

## 过程记录

- `docs/prd/20261105182104-rule-refactor/prd/index.md` —— 总纲与四阶段导航（2b 行已挂 plan 链接）。
- `docs/prd/20261105182104-rule-refactor/prd/stage-2b-rule-dsl-expressiveness.md` —— 需求稿（裁定 D-14~D-23、数据模型、渲染规格、校验闸、迁移与出品边界）。
- `docs/prd/20261105182104-rule-refactor/prd/stage-2b-spec.md` —— 实现规格（逐字文案、18 算子语义、求值与渲染契约、16+ 个 code、13 条 evidence 样例的新字段）。
- `docs/prd/20261105182104-rule-refactor/prd/stage-2b-testcase-sdet.md` —— 验收合同 170 条（A~K 组）；先读 §7（执行与判定口径）与 §6（OD-1~OD-13 已裁定项）。
- `docs/prd/20261105182104-rule-refactor/prd/stage-2b-plan.md` —— **施工计划**，6 任务 3 绿点，逐步骤带命令。
- `docs/reports/2026-11-05-rule-refactor-stage-2/verification.md` —— 阶段 2 交付账（先读尾部）。
- `.session/reviews/2026-11-05-2130-rule-refactor-stage-2/impact-sheet.md` —— 4 红对应的改判清单，需刷新。
- 历史交接词链：`docs/handoffs/2026-11-05-rule-refactor-stage-1.md` → 本文件。

## 本次任务

按 `stage-2b-plan.md` 的 6 个任务施工，使 170 条用例可逐条执行；流程：需求 → spec → testcase（三方 R5 已闭环）→ plan（已写）→ 落代码 → 绿点提交；起点：任务 1（引擎核心）。

## 范围依据

- 要读：
  - `docs/prd/20261105182104-rule-refactor/prd/stage-2b-plan.md` 全文（任务 1~6）。
  - `docs/prd/20261105182104-rule-refactor/prd/stage-2b-spec.md` §2（数据契约）、§3（判定语义）、§4（渲染契约与常量表）、§5（校验契约与 code 优先级）、§7（迁移与具体 json）。
  - `docs/prd/20261105182104-rule-refactor/prd/stage-2b-testcase-sdet.md` §2（三夹具 R-BASE / R-COMBO / PILOT）、§4 各组用例、§7（判定口径）。
  - `tools/quality/criteria-engine/schema.mjs`（现行 8 字段白名单 + 4 算子 + 非递归 judge）、`interpreters.mjs`（3 解释器）、`build.mjs`（编排）、`rules.mjs` + `rules.json`（rule 投影）。
  - `scripts/check-criteria-engine.mjs`（`BUDGET` 常量、结构闸、投影逐字节）、`scripts/rule-audit-lite.mjs`（`STRUCT` 与 `SOURCE`）。
- 勿重做：需求稿、spec、170 条 testcase 的三方评审已闭环（R5「无冲突，可定稿」）；阶段 1 / 2 的正文与门禁已落地，不再改其业务观点。`docs/prd/20261105182104-rule-refactor/rule-dsl/` 的 3 份旧 testcase 必须字节不变。

## 开放问题

1. **（开工第一问）工作树里阶段 2 的收口改动（21 个已跟踪 + 6 组未跟踪）怎么处置？** 推断：先单独 commit 一个「阶段 2 收口 v2」提交再动 2b（依据：`build.mjs` / `check-criteria-engine.mjs` / `rule-audit-lite.mjs` 三条命令当前全绿，工作树是一个可运行整体；若不先提交，任务 4 的分阶段 commit 会把阶段 2 的改动混进 2b 提交里）。请用户确认或纠正。
2. **spec §7.3 的新 json 丢了「锚形态」语义。** 旧 `evidence-before-conclusion.json` 有第二条 assert `anchor containsAny [":", "exit", "命令"]`，新模型换成三个类型化锚字段后没有任何形态校验，`anchorPathLine: "我记得是这样"` 会判 pass。推断：这属于 spec 的语义回退，应在 `anyOf` 三个分支各自加 `matches` / `containsAny`（旧样例「我记得是这样」的等价反例就能保留）。代价：spec 已 R5 定稿，改动要重开一轮 SDET review，并改 H-06b 的样例清单。请用户裁定是「接受语义放宽」还是「回写 spec 加形态校验」。
3. **pilot 副本 `docs/prd/20261105182104-rule-refactor/rule-dsl/` 的长期处置。** 推断：改造为「只读基线 + 指针到 `tools/quality/criteria-engine/`」，避免第二份真相（依据：目录里是与引擎重复的 schema/interpreters/build 三件套）。请用户确认。

## 既定约束（不要重新讨论、不要重新选型）

- 散文只能是渲染产物，不能进数据 —— 需求稿 D-14。
- 逻辑关系必须显式建模（`anyOf` / `allOf` / `oneOf` / `not`）；`assert` 数组是隐式 AND —— D-15。
- 同级不许混用逻辑键，混用只能靠嵌套，不设优先级 —— D-16。
- 逻辑连接词唯一出处 = 结构树（`LOGIC_LABELS`）；`label` 只命名 —— D-17 / D-19。
- `label` 必须是名词短语（≤12 字符，不含逻辑词/情态词/标点）；单字「要」「应」不单独禁 —— D-18 与 spec §5.2。
- 正文不渲染来源，`source` 字段不设 —— D-20。
- 判定动作进数据（`probe`），`landing` 只表示记录落点 —— D-21。
- 时序 / 执行 / 重试 / 回滚不进判据，归 skill 骨架 —— D-22。
- 不设 `group` 这类展示分组 —— D-23。
- 嵌套组合节点不要求 `label`（只保留顶层 `AssertLabelMissing`）—— spec S-1。
- `probe` 对**全部判据**必填 —— S-2。
- 深度 = 组合节点层数，顶层组合 = 1，`not` 也 1 层，叶子不计 —— S-3。
- `scope` = `global` 或 `project:<name>`，`<name>` 匹配 `^[a-z0-9][a-z0-9-]*$`；`scope` 不参与泛化「缺字段」检查，只报 `ScopeMissing` / `ScopeInvalid` —— S-4。
- `unless` 存在时 `unless.label` 必填 —— S-5。
- 组合子项名回退顺序 = `name → field`（不回退 `label`）—— S-6。
- `LogicWordInLabel` 先报，`LabelShape` 报其余，同一命中不重复报 —— S-9。
- `judge` 是纯函数、单快照；`unless` 必须先于组合分支判定 —— spec §3.2。
- 扁平预算：单条 100–500 非空白字符、条数 ≤9、总量 ≤26,513 —— `scripts/check-criteria-engine.mjs` 的 `BUDGET`。
- `rule-writer` 不出品到用户目录，判据数据留本仓 —— 需求稿 §14。

## 遗留裁决与留观项

- `V-2b-11` 发布侧 `scope` 过滤 —— 来源：需求稿 §11 与 spec §9 X-1；状态 BLOCKED，依赖发布侧实现，不在本阶段施工。
- `F-16` `observable-criteria` 逐字节样例 —— 来源：spec §9 X-2；需把 spec §4.3 逐字文案回写需求稿 §7 示例后激活，当前为弱断言。
- `matches` 正则复杂度不可机判 —— 来源：spec §9 X-3；归 `residual`，`reviewer-audit` 抽检。
- 「label 是否真为名词短语」不可机判 —— 来源：spec §9 X-4；禁词表 + 长度只能拦大部分，其余归 `reviewer-audit` 抽检。
- 阶段 2 遗留：`V-12` 签收窗、`V-20` 复发点清单 —— 来源：`docs/reports/2026-11-05-rule-refactor-stage-2/verification.md`；收敛时机：2b 结束后一并收口。

## 开工前先做

1. 复核基线：`git status --short` 与 `node tools\quality\criteria-engine\build.mjs`、`node scripts\check-criteria-engine.mjs`、`node scripts\rule-audit-lite.mjs` —— 期望 5 判据 / 34 样例 / 全绿，与元信息表一致；`node scripts\check-all.mjs` 的 4 红应仍只来自 `scope-sweep`。
2. 补 `.session/reviews/2026-11-05-2130-rule-refactor-stage-2/impact-sheet.md`（或按当次改判新建一份同日 `impact-sheet.md`），使 `node scripts\scope-sweep.mjs --check` exit 0，否则任务 4~6 的提交一直带红。
3. 确认开放问题 1（阶段 2 收口是否先单独 commit）。
4. 读 `docs/prd/20261105182104-rule-refactor/prd/stage-2b-plan.md` 的「全局约束」与任务 1「接口」块，再开始任务 1 步骤 1（记录基线）。
5. 确认开放问题 2（锚形态语义是否回写 spec）—— 它影响任务 4 的 13 条样例内容，若裁定「回写」，任务 4 需等 spec 重开后再做。

## 开场话术

读 docs/handoffs/2026-11-06-stage-2b-rule-dsl-impl.md，按交接词继续：按 stage-2b-plan.md 施工阶段 2b（从任务 1 起）。注意：先答开工第一问（工作树里阶段 2 收口改动是否先单独 commit），并先补 scope-sweep 的 impact-sheet 才能让 check-all 转绿。
