# agent 卡解释器设计（草稿）

> 状态：**单卡渲染已跑通**（reviewer-audit），其余 6 卡未渲染；校验器仍为脚本形态。
> 关联：[models/](models/)、[output/reviewer-audit.md](output/reviewer-audit.md)、[result.md](result.md) §8.14–§8.15
> 范围：先跑通 reviewer-audit 一张卡，再谈推广。

## 0 结论

现役解释器不能消费 `models/` 的格式，必须新写。已写出 `render-card.mjs`（单卡渲染）与 `verify-models.mjs`（展开 + 等价性 + 权限校验），reviewer-audit 的卡面已由模型生成，旧手写 draft 已删除。

## 1 现役为什么不能用

| 证据 | 内容 |
|---|---|
| [cardKeys.mjs:5-6](../tools/docgen/builders/agents/components/cardKeys.mjs) | 卡对象必须有 12 键：`seat / name / description / tools / duty / scenes / signals / must / never / categories / checkItems / rationale` |
| [cardPipeline.mjs:94-98](../tools/docgen/builders/agents/components/cardPipeline.mjs) | 缺任一键 → `UnverifiableOutput`，拒绝渲染 |
| [cardPipeline.mjs:69-90](../tools/docgen/builders/agents/components/cardPipeline.mjs) | 数据源是内存 `agentData`，不是任意 JSON |

`models/` 只命中 3 键（`seat` / `must` / `never`），且 `name` / `description` / `tools` 嵌在 `seat` 下；`duty` / `scenes` / `signals` / `categories` / `checkItems` / `rationale` 全无。

`models/` 新增的结构，现役与 §10.1 都不认识：

| 新结构 | 用途 |
|---|---|
| `timing` + `defaultLanding` | 时机与落点提到外层 |
| `predicates.ok` / `bad` | 区分「要求 X」与「不得 X」 |
| `guard` | 主判据 + 触发前提 |
| `eachHas` | 集合内每项匹配正则 |
| `definitions` | 抽象谓词 → 判据指针 |
| `reasonCodes` | 机械化缺口的原因闭集 |
| `enums` | `action` / `mode` / `coverage` 闭集 |
| `noteTemplate` | 表头注由数据渲染 |
| `conflict.domains` | 比较变量的值域 |

## 2 校验器与渲染器是两件东西

| | 校验器 | 渲染器 |
|---|---|---|
| 输入 | `model2.json` | 已通过校验的模型 |
| 输出 | 错误码列表 + 退出码 | 卡面 markdown |
| 失败含义 | 模型本身不合法 | 规则未覆盖该结构 |
| 能否单独跑 | 能，纯静态为主 | 不能，依赖校验通过 |

两者分开的理由：模型错误不应表现为渲染差异，否则无法判断「是数据错还是规则错」。

## 3 管线

```
models/*.json + _shared-model.json
  ├─ 展开      extends 合并：must/never 按 appliesWhen 过滤，records/forms 浅合并
  ├─ 结构校验  引用/闭集/条件必填/权限目标/摘要手写
  ├─ 语义校验  负例、objective、产物归属、策略一致性
  ├─ 渲染      按段装配
  └─ 输出      output/<seat>.md
```

任一阶段失败即停，不进入下一阶段。

## 4 模块划分

| 模块 | 职责 | 状态 |
|---|---|---|
| `verify-models.mjs` | 展开 / 等价性 / 权限 / 策略一致性校验 | **已实现** |
| `render-card.mjs` | 单卡渲染（段装配 + 派生） | **已实现**（reviewer-audit） |
| `update-baseline.mjs` | 把展开结果写入 `_baseline/` | **已实现** |
| `schema.mjs` | 字段闭集、必填、类型、引用完整性 | 待从脚本抽出 |
| `render/sections.mjs` | 每段一个纯函数 `(model) => string` | 待抽 |
| `diff.mjs` | 渲染产物与上一版逐字节比对 | 未写 |
| `cli.mjs` | `check` / `render` / `diff` 三个子命令 | 未写 |

放置：先放 `tmp/agent-criteria-demo/interp/`；跑通后再按 §8.12 抽到 `tools/docgen/builders/agents/`。

## 4.1 合并规则（extends）

卡模型首行写 `"extends": "_shared-model.json"`，解释器按下列规则展开。

| 键 | 合并方式 |
|---|---|
| `must` / `never` | 取共享 `rules` 池中 `appliesWhen` 命中本席的条目，再叠加本席同名条目 |
| `predicates` | 取 `appliesWhen` 命中的条目；本席可覆盖同名项 |
| `records` | 浅合并 `{...shared, ...own}`，本席只写差异字段 |
| `forms` | 浅合并 |
| `checklist.columns` | 取共享 `checklistColumns`，本席可在 `checklist.columns` 覆盖 |
| `outputs.keys` | 取共享 `outputKeys` |
| `timing` | 取 `timing.default`，本席可覆盖 |
| 其余顶层键 | 本席值优先；未写则取共享 |

`appliesWhen` 取值两种：`"*"`（全席）或席 id 数组。

**等价性验收**：展开后的 `must` / `never` / `predicates` / `records` 必须与瘦身前基线逐字节一致，不一致即回退。

基线存放：`models/_baseline/<seat>.json`，7 张验证完可删。

## 5 渲染规则

沿用 result §10.1 的规则 1–25，新增下列规则。编号从 26 起，避免与旧规则冲突。

| # | 规则 | 输入键 | 输出 |
|---|---|---|---|
| 26 | 时机与落点缺省 | `timing` / `defaultLanding` | 「一定会」段首注；条目不再逐行写时机 |
| 27 | 判据极性 | `predicates.ok` / `bad` | `must` 用「要求 {ok}」，`never` 用「不得 {bad}」 |
| 28 | 触发前提 | `predicates.guard` | 主槽句后接「，且 {guard 句}」 |
| 29 | 集合内匹配 | `eachHas` | 「{ofRef} 任一行缺 `{pattern 描述}`」 |
| 30 | 表头注 | `verdicts.noteTemplate` | 清单第 3 列括号内文字 |
| 31 | 枚举渲染 | `enums` | `action` + `mode` 拼「逐项填写」/「填写」 |
| 32 | 判定方 | `objective` + `residual.who` | 具名执行主体：有 `machineCmd` → 写命令原文；`target=manual` → `抽检：{who}`；其余 → `本席`。不写「机判 / 半机判 / 人工判定」这类无主语或无定义的值 |
| 33 | 定义指针 | `definitions` | 不渲染，仅供校验器解析 |
| 34 | 比较变量值域 | `conflict.domains` | 校验 3×3 全覆盖 |
| 35 | 身份派生 | `seat.triggers` / `description` | 两种形态共用填充器：**要素型**（`timing` / `schedule` / `objects` / `perspective` / `scope` / `action`）或**术语型**（`id` → `triggerPhrases`）；无自由 `text` |
| 36 | 职责三槽 | `duty` + `permissions.action` | 触发=`seat.description`；动作=`duty.action`；约束由 `permissions.action` 派生：`只{allow}，不{forbid}`，不手写 |
| 37 | 全局注 | `globalRules` | 「一定会」段的两条注 |
| 38 | 分节 | `outputs.items[].section` | 同类型多席写同一文件时，以 `### {section}` 分节 |
| 39 | 动作互斥 | `permissions.action` | `allow ∩ forbid = ∅`，否则 `ActionConflict` |
| 40 | 判据摘要派生 | `checkCriteria.{action, observable, mode}` | `{actionLabel}：{observable 短语用「、」连接}（{modeSuffix}）`；**不存 summary** |
| 41 | 权限段 | `permissions.{action,write,command}` + 共享 `permissionGroups` | `action.allow` → 「只{...}」；`action.forbid` → 逐条「不得{label}」；`write.allow` 空 → 「不得写任何文件」，非空 → 「只许写{...}」；`command` 同理；forbid 的组无 signal → `PermissionUnobservable` |
| 42 | 路径模板 | 共享 `placeholders` + `forms[].path` + `records[].source` | 占位符统一 `{name}`，必须登记在 `placeholders`；`source` 分两类：`{kind:"path",template}` 与 `{kind:"description",text}` |
| 43 | 规则目标与产物归属对齐 | `_shared-model.json` 的 `rules.{must,never}[].targets[].object` | 目标以 `issue.card.` 开头的规则，只许 `appliesWhen` 到 `seat.artifacts` 含 `artifact.issueCard` 的席；否则本席既「不得出问题卡」又要「建议解法栏非空」，同卡互斥 → `ISSUE_RULE_ON_NON_ISSUER` |

**规则 40 的派生表**

| 键 | 映射 |
|---|---|
| `verify` / `recount` / `spotCheck` / `replay` / `compare` | 核对 / 复算 / 抽查 / 重放 / 比对 |
| `fieldNonEmpty` | `{field.label}非空` |
| `fieldEmpty` | `{field.label}为空` |
| `fieldEnumIn` | `{field.label}取值` |
| `fieldsEq` | `{left.label} = {right.label}` |
| `eachCarries` | `{ofRef.label}各带{field.label}` |
| `allExist` | `{field.label}全在` |
| `coversAll` | `{field.label}覆盖必填` |
| `setSubset` | `{field.label}全部在本轮清单` |
| `lineExists` | `{ofRef.label}行存在` |
| `lineAbsent` | `{ofRef.label}无声明行` |
| `quoteInLine` | `{ofRef.label}摘句行号` |
| `countGte` | `{ofRef.label} 计数 ≥ {value}` |
| `distinctGte` | `{ofRef.label} 来自 ≥ {value} 个不同{byLabel}` |
| `whenEq` | `{field.label} = {value} 时` |
| `mode: all` | `全部成立 = hit` |
| `mode: any` | `任一成立 = hit` |

示例：

- `audit.card` → 「核对：必填字段覆盖必填、建议解法非空、原文引句非空（全部成立 = hit）」
- `actuary.citation` → 「核对：取数命令非空（全部成立 = hit）」
- `evidence.line` → 「核对：证据三元组摘句行号（全部成立 = hit）」

`checkCriteria` 出现 `summary` 字段 → `SummaryHandwritten`，拒绝渲染。
`outputFormat.checks[]` 出现 `text` 字段 → `OutputTextHandwritten`，校验描述由 `observable` 派生。

**本次新增算子（各 1 个消费者，先建后用）**

| 算子 | 语义 | 用途 |
|---|---|---|
| `setSubset` | 集合 A 的某字段值全部出现在集合 B 的某字段中 | `audit.round`：上轮承诺 ⊆ 本轮清单 |
| `coversAll` | 集合内某字段覆盖 `required` 列出的全部值 | `audit.card`：卡片字段覆盖 9 个必填项 |
| `lineAbsent` | 字段文本中不存在匹配 `pattern` 的行 | `out-of-scope-self-disposal` 的 guard：正文无「声明：」行 |
| `fieldNotIn` | 字段取值不在给定集合内 | `permissionGroups.review-verdict`：核实结论只能是「确认存在 / 确认不存在」 |
| `textMatches` | 文本中存在匹配 `pattern` 的片段 | `permissionGroups.review-verdict`：答辩全文出现评审结论词 |

`fieldEnumIn` 扩展 `valuesRef`：值域引用共享 `enums`，不再内联数组。

`eachHas` 支持 `hint`：渲染时用人类可读描述代替正则原文（如 `path:line`）。

## 6 校验清单

静态（不渲染即可判）

| 检查 | 失败码 |
|---|---|
| `must`/`never` 的 `criterion` 已登记 | `PredicateUnknown` |
| `targets[].object` ∈ `vocab.object` | `ObjectUnknown` |
| `defaultLanding` ∈ `forms` | `LandingUnknown` |
| `checklist.items[].criterion` ∈ `checkCriteria` | `CriterionUnknown` |
| `observable[].ofRef` ∈ `records`，`field` ∈ shape | `RecordFieldUnknown` |
| `shape[].id` 唯一 | `FieldDuplicated` |
| `shape[].when.field` ∈ 同记录 | `ConditionFieldUnknown` |
| `residual.fields` 形如 `record.field` 且可解析 | `ResidualFieldInvalid` |
| `objective`：`full` 有 `machineCmd`、`partial` 有 `reason`、`manual` 有 `reason` | `ObjectiveInvalid` |
| `machineCmd` 命中白名单 prefix | `ObjectiveCmdUnknown` |
| 同一 verdict 不同时 `requireReason` 与 `requireApplicability` | `VerdictDualRequire` |
| `enums` 的 `values` 与 `labels` 键集相等 | `EnumLabelMissing` |
| `checklist.summary` 的名词 ⊆ `observable` 主语 | `SummaryDrift` |
| 标题（`category` / `ok` / `bad`）的断言词必须有对应 op | `TitleDrift` |
| `checkCriteria.action` 必须被 observable 的算子支撑（`recount`→`fieldsEq`，`compare`/`replay`→`fieldsEq`/`quoteInLine`） | `ActionMismatch` |
| 路径里的 `{name}` 必须在 `placeholders` 登记 | `PlaceholderUndeclared` |
| 路径不得以 `/` 开头 | `PathAbsolute` |
| 路径不得含 `..` | `PathEscape` |
| `records[].source` 必须是 `{kind, template\|text}` | `SourceUnstructured` |

需要求值器（第二阶段）

| 检查 | 失败码 |
|---|---|
| `negative` 必须判 fail 且 `failsOn` 对位 | `NegativeNotFailing` |
| `conflict.decision` 3×3 全覆盖、无重叠 | `DecisionGap` / `DecisionOverlap` |
| `definitions.criterion` 能被该判据判定 | `DefinitionUnbound` |

## 7 验收

1. 渲染两次，`output/<seat>.md` 逐字节相同
2. 8 条 `negative` 全部触发失败
3. 故意改一个字段，校验器报出对应错误码
4. 删掉 `duty`，渲染器报「职责段无数据源」而不是输出空段

## 7.1 已跑通时暴露的三个 bug

手写卡面永远发现不了，只有真渲染才会出现：

| bug | 现象 | 原因 |
|---|---|---|
| `landingSubject` 未求值 | 输出 `[object Object]` | 数据是 `{from:"emit",index:0}`，渲染器当字符串用了 |
| 段落缺空行 | `## 一定会` 紧跟正文 | 漏了段间分隔 |
| `whenEmpty` 丢 then | 「问题项为空时。」句子没说完 | 只渲染条件，没渲染后果 |

教训：渲染器必须有「跑一遍看输出」的步骤，不能只看代码。

## 8 未决

| # | 事项 | 影响 |
|---|---|---|
| 1 | 求值器未实现 | 负例只做结构检查 |
| 2 | 其余 6 卡未渲染 | 渲染器目前只覆盖 reviewer-audit 用到的段 |
| 3 | 现役 12 键与新模型的映射 | 若走适配路线，需要一张字段映射表 |

## 9 与现役的关系

- 先并行，不替换：现役卡继续由 `cardPipeline` 生成
- 新解释器只负责 `models/`，产物与现役卡并存比对
- 复用点：table、enumText、spacing、criterionRef（result §8.12 的抽取顺序）
- 切换条件：7 卡全部渲染成功，且 `verify-models.mjs` 全绿
