# 待办与待决（open issues）

> 状态：只记录，不执行。
> 最后更新：2026-11-11

## A 需你决策

| # | 事项 | 现状 | 影响 |
|---|---|---|---|
| A1 | 5 席产物文件名 | **已定**：按 `outputKind` 统一文件；同类型多席共写一份，按 `outputs.items[].section` 分节。`seat-policy.artifacts` 已同步 | — |
| A2 | P 类 6 条错配 | **demo 已修**：`_shared-model.json` 里目标为 `issue.card.*` 的两条 never 收窄到真出问题卡的席（actuary / ai）；`no-fake-problem` 去掉 evidence-reader；新增校验码 `ISSUE_RULE_ON_NON_ISSUER`。现役 `SHARED_USE` 仍 `ALL_SHARED` → 见 B2 | 现役卡面仍带该冲突 |
| A3 | 5 个 `POLICY_DIFF` | **已修（选 B：卡面为准）**：`artifacts.mjs` 补 `evidence.md` / `defense.md` / `issue-card.md`；`seat-policy.mjs` 5 席补可写清单；`seats.mjs` 登记 evidence-reader / reviewer-actuary / reviewer-ai（此前走 `__default__`） | 7 张卡 `POLICY_DIFF` 清零 |
| A4 | 方法论抽成 skill | 结构见 `modeling-methodology.md` §12；三个条件未满足 | 抽之前只留 demo |

**A1 已定方案（A：单文件分节）**

| 席 | outputKind | 产物文件 | 分节 |
|---|---|---|---|
| evidence-reader | `evidence` | `evidence.md` | 取证 |
| respondent-architect | `defense` | `defense.md` | 架构答辩 |
| respondent-dev | `defense` | `defense.md` | 研发答辩 |
| reviewer-actuary | `issue-card` | `issue-card.md` | 精算 |
| reviewer-ai | `issue-card` | `issue-card.md` | AI |

**分节规则**

| 规则 | 内容 | 状态 |
|---|---|---|
| 分节来源 | `outputs.items[].section`，不是席名派生 | 已定 |
| 标题级别 | `### {section}`，与 interpreter-design 规则 38 一致 | 已定 |
| 文件首标题 | `# {outputKind 对应 label}`，如 `# 答辩记录` | 待定（label 来源未定） |
| 节排列顺序 | 按各席模型声明顺序 | 待定 |
| 空节 | 本轮无内容时是否输出空节 | 待定（输出「无」/ 省略） |
| 同节多席 | 两个答辩席各有自己的 section，不会写同一节 | 已定 |

分节与文件的对应关系：`defense.md` 两个节（架构答辩 / 研发答辩）、`issue-card.md` 两个节（精算 / AI）、`evidence.md` 一个节（取证）。

**A2 具体条目**

- evidence-reader 的 4 条 must、5 条 never
- respondent-architect / dev 的 1 条 must
- detective-observer 的 5 条 must、5 条 never

**A3 三选项**

| 选项 | 做法 |
|---|---|
| B | 卡面为准，补 `seat-policy.artifacts` |
| A | 策略为准，删 5 席 `outputs` |
| C | 只记录，不改 |

## B 待现役同步（不本轮执行）

| # | 位置 | 待改 |
|---|---|---|
| B1 | `tools/docgen/builders/agents/policy/seat-policy.mjs:9-11` | **已完成**：5 席 `artifacts` 补文件名；actuary / ai / evidence-reader 从 `__default__` 拆出登记（`seats.mjs` 同步） |
| B2 | `tools/docgen/builders/agents/card-model/vocab/shared-actions.mjs:88-102` | `SHARED_USE` 仍全席 `ALL_SHARED`；`shared.no-issue-without-fix` / `shared.no-perfunctory-fix` 应只发给出问题卡的席（回填 `agents/*.md` 才能过 gate） |

## C 解释器

| # | 项 | 状态 |
|---|---|---|
| C1 | 类型校验 `types/base.mjs` + `derived.mjs` + `index.mjs` | 已实现 |
| C2 | 语义校验 `verify-models.mjs` | 已实现 |
| C3 | 渲染 `render/sections.mjs` + `render/index.mjs` + `render-all.mjs` | 已实现，7 张全出卡 |
| C4 | 求值器（跑负例） | 未写；负例只做结构存在性检查 |
| C5 | 单元测试 | **未写，正式开发必补**（本轮只做集成验证） |

### C5 测试范围（今后必写）

| 模块 | 要覆盖 |
|---|---|
| `types/base.mjs` `checkValue` | `Map<X>` / `X[]` / `X\|null` 三分支 |
| `types/base.mjs` `VALUE_CHECKS` | 20 个值类型各一正一反 |
| `types/derived.mjs` `matches` | 三个类各自的正例与误判反例 |
| `types/derived.mjs` `extra` | 缺 `issue-without-solution` / 缺 `roundCheck` / 产出冲突 |
| `types/index.mjs` | 零命中 → `MODEL_TYPE_UNKNOWN`；多命中 → `MODEL_TYPE_CONFLICT` |
| `render/sections.mjs` | 9 个段函数各一条快照；空 `must` / 空 `never` / `null` escalation 返回 `[]` |
| `render/sections.mjs` `renderObs` | 20 个 op 各一条输出串断言 |
| `render/sections.mjs` `renderRule` | `ok` / `bad` / 带 `guard` 三种 |
| `render/index.mjs` | `typeOf` 判别；段装配顺序 |
| `verify-models.mjs` | 每个失败码一正一反（`TITLE_DRIFT` / `PATH_INVALID` / `ACTION_MISMATCH` 等） |

fixture 策略：

- 正向：`models/` 下 7 个文件直接复用
- 负向：由正 fixture **程序化改造**（删字段、改引用、换枚举值），断言具体错误码，不手写负例文件

验收：`node --test` 全绿，且每个失败码至少被触发一次。

## D 已知设计债

| # | 事项 | 说明 |
|---|---|---|
| D1 | `eachHas` / `guard` 各只有一个消费者 | 按 rule of two 暂不抽公共组件 |
| D2 | `path` 里的 `<本次>` 占位符 | 路径渲染规则未定（运行时替换 / 保留字面量） |
| D3 | `verdicts.onMiss` 的 `recheck` 值 | 只有 `next-round`，多轮重审规则未建 |
| D4 | `declaration.present` 自证 | **已修**：删记录，改 `deliverableText` + `lineAbsent`，pattern `^\s*声明[:：]` |
| D5 | actuary / ai 的 `fieldNonEmpty` 判据偏弱 | 「核对 X」只查非空，属判据强度问题，非真假问题，另议 |
| D6 | `evidence-reader` / `audit` 的触发已改术语型，其余 3 处要素型 | 两种形态共用填充器；新增席时按「要素优先、术语兜底」选 |
| D7 | `permissions.write.allow` 为空表示「不得写」 | 渲染规则已定，但 `seat-policy` 尚无对应表达，等 A3 一起改 |
| D8 | 3 席 `forbid` 无 `interrupt` | **已决（2026-11-11）：不补**。`agents/evidence-reader.md:12`、`respondent-architect.md:12`、`respondent-dev.md:12` 的约束行均无「无中断评审」；补上等于替源卡新增语义。`boundary.md.tpl:1` 那句是全席公共边界文案，要落模型需先统一 15 席 |
| D9 | evidence-reader 漏「不出问题卡」 | **已修**：`permissions.action.forbid` 补 `issue-card`，与源卡 4 条禁令（观点 / 问题卡 / 参与评审 / 技术对错）逐条对齐 |

## 已完成的语义修复

| 位置 | 原问题 | 现方案 |
|---|---|---|
| respondent-architect / dev `signature` | `traceable` 自证 | `recordRef` + `signer ∈ respondentSeats` + `eachCarries` |
| evidence-reader `evidence.secondhand` | `primary` 自证 | 删布尔，改 `quoteInLine` + `purpose` 非空 |
| reviewer-audit `audit.round` | `inRoundList` 自证 | 改 `setSubset`（承诺 ⊆ 本轮清单） |
| reviewer-audit `audit.card` | `cardField.present` 自证 | 改 `coversAll`（覆盖 9 个必填字段） |
| respondent 的 summary | 「四席」硬编码 | 改 `respondentSeats` 枚举 |
| 共享 `declaration` | `present` 自证 | 删记录，改 `deliverableText` + `lineAbsent`，扫 `^\s*声明[:：]` |
| 权限四处表达 | `constraint` / `bans` / `groups` / `artifacts` 各说各的 | 收敛成 `permissions.{action,write,command}` 一处 |
| 禁令无判据 | `bans.text` 写了 4 条，`signal` 只管 1 条 | `permissionGroups` 三态：有 signal / 有 residual / 都没有报错 |
| 评审结论形态未定义 | 答辩席可写「通过」「驳回」 | `defenseRow.verdict ∈ {确认存在, 确认不存在}`，`fieldNotIn` + `textMatches` |
| 产物按席命名 | `defense-record-architect.md` 等 5 个 | 按 `outputKind` 统一为 `evidence.md` / `defense.md` / `issue-card.md`，按 `section` 分节 |
| 问题卡规则错发 | 取证 / 侦探 / 审计席也背「不得留空建议解法栏」 | `appliesWhen` 收窄到 actuary / ai；校验码 `ISSUE_RULE_ON_NON_ISSUER` 兜底 |
| 策略侧产物为空 | `SEAT_POLICY.artifacts` 5 席为 `[]` | 补 `evidence.md` / `defense.md` / `issue-card.md`，并登记 3 席 |

## 验证工具

| 工具 | 用途 |
|---|---|
| `verify-models.mjs` | 展开 7 张模型，比对基线 + 产物归属 + 策略一致性 + 权限目标 |
| `render-card.mjs` | 从模型渲染 reviewer-audit 卡面到 `output/` |
| `update-baseline.mjs` | 把展开结果写入 `_baseline/`，作为下一次比对的基准 |
