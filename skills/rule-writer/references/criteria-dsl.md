# 判据引擎 rule DSL 细则（写入侧）

> 适用：在 `tools/docgen/models/rules/` 下新建或修改 `<id>.json` + `<id>.testcase.json` 时。
> 设计源头：`docs/prd/20261105182104-rule-refactor/prd/stage-2b-spec.md`；本文只给可执行规则，不复制需求论证。

## 1 字段表

顶层只认 10 个键，多一个即 `Schema`（描述性字段不允许）。

| 字段 | 必填 | 形态 | 失败 code |
|---|---|---|---|
| `id` | 是 | 小写连字符 | `Schema` |
| `impl` | 是 | 固定 `"script"` | `Schema`（本执行器只接受 impl=script） |
| `type` | 是 | `持续适用` / `条件触发` / `模式门控` | `TypeMissing` / `TypeInvalid` |
| `scope` | 是 | `global` 或 `project:<name>`（name `^[a-z0-9][a-z0-9-]*$`） | `ScopeMissing` / `ScopeInvalid` |
| `title` | 是 | 不含 `——` | `Schema` |
| `when` | 是 | 条件节点或 `{ "always": true }` | `Schema` |
| `assert` | 是 | 非空数组，每项是条件节点 | `Schema` |
| `residual` | 是 | `{who, sample≥1, fields[], objectivePath}` | `Residual*` / `FieldLabelMissing` |
| `refs` | 否 | 字符串数组；`scope: global` 的规则必须写技能名（如 `assertion-quality`），不得写路径 | `Schema` |
| `landing` | 是 | 记录落点 | `Schema` |

## 2 条件语法

```
Cond := Leaf | { anyOf: [Cond≥2] } | { allOf: [Cond≥2] } | { oneOf: [Cond≥2] } | { not: Cond }
Leaf := { field, op, value?, values?, pattern?, allow?, forbid?, conflict?, label?, name?, probe?, unless? }
```

- 同一节点只能出现一种逻辑键 → 否则 `LogicConflict`；
- `anyOf` / `allOf` / `oneOf` 至少 2 项 → 否则 `LogicArity`；
- 组合层数 ≤3（顶层组合 = 1，`not` 也计 1 层，叶子不计）→ 否则 `DepthExceeded`；
- 叶子必须有 `field` 与已注册 `op`；
- `values` 类算子必须给非空 `values`；`matches` / `notMatches` 必须给非空 `pattern`；
- `notForbiddenCommand` 必须给 `allow` / `forbid`，且 `conflict: "longestAllowWins"`；
- `unless` 对任意节点生效，判定先于组合分支；有 `unless` 就必须有 `unless.label`。

## 3 label

- `assert` 顶层必须带 `label`；`unless` 必须带 `label`；
- 只写名词短语：≤12 字符，不含逻辑词、情态/祈使词、标点；
- 逻辑词（先报 `LogicWordInLabel`）：或 / 且 / 任一 / 全部 / 至少 / 恰好 / 之一；
- 情态/祈使词（报 `LabelShape`）：必须 / 须 / 应当 / 需要 / 不得 / 不许 / 请 / 给出 / 写出 / 附上 / 贴出 / 执行 / 跑 / 确认；
- 标点（报 `LabelShape`）：，。；：、！？ 与半角 , . ; : ! ? /；
- 连接词由结构树产出（`以下任一` / `全部满足` / `恰好一个` / `不得`），谓词由算子产出，`label` 只命名；
- 组合子项用 `name ?? field`，不回退 `label`；嵌套组合节点不要求 `label`。

固定修法（`LabelShape` / `LogicWordInLabel` 都按此改）：

```
label 只许名词短语（≤12 字符、不含逻辑词/情态词/标点）；谓词由算子产出
```

## 4 算子表

| op | 判定 | 渲染谓词 |
|---|---|---|
| `eq` | 严格相等 | `必须成立` / `必须不成立` / `必须等于 <值>` |
| `nonEmpty` | trim 后非空 | `必须非空` |
| `empty` | trim 后为空 | `必须为空` |
| `containsAny` | 含任一 values | `必须包含以下任一：A / B` |
| `notContains` | 不含任一 values | `不得包含以下任一：A / B` |
| `startsWithAny` | 两侧 trim + 小写后前缀命中 | `必须以以下任一项开头：A / B` |
| `matches` | 正则命中 | ``必须匹配 `<pattern>` `` |
| `notMatches` | 正则不命中 | ``不得匹配 `<pattern>` `` |
| `gt` / `gte` / `lt` / `lte` | 数值比较，非数字判 fail | `必须大于` / `必须 ≥` / `必须小于` / `必须 ≤` |
| `countEq` / `countLte` / `countGte` | 计数比较 | `计数必须等于` / `计数必须 ≤` / `计数必须 ≥` |
| `includesAll` | 数组含全部 values | `必须包含全部：A / B` |
| `includesAny` | 数组含任一 values | `必须包含以下任一项：A / B` |
| `notForbiddenCommand` | 命中 forbid 且无更长 allow 前缀则 fail | `必须不在禁止清单内` |

## 5 probe

每个 `assert` 顶层必须带 `probe`（含组合节点）→ 否则 `RuleWithoutProbe`。

| kind | 必填 | take 允许值 |
|---|---|---|
| `command` | `run` | `exit` / `stdout` |
| `file` | `path` | `exists` / `content` |
| `glob` | `path` | `count` / `names` |
| `manual` | 无 | 无 |

任一不满足 → `ProbeSchema`。组合节点与人工判断用 `{ "kind": "manual" }`。

## 6 渲染

`rules/<id>.md` 与 `<id>.md` 共用同一模板：

```markdown
# {title}

> 触发：{when.label；always → 始终适用；缺 label → 紧凑条件}

义务（全部成立才合规；缺一件 = 不合格）：
1. {label}：{probe 段}{谓词}

另见：{refs 以「、」连接，缺省不出现}
落点：{landing}
```

- `probe.kind = manual` 不渲染 probe 段与分号；
- 组合节点：`{label}（以下任一|全部满足|恰好一个：{子项 或/且 连接}）`；
- `not`：`{label}（不得（{子节点 body}））`；
- 子节点与父类型不同才加 `（）`；`not` 的括号由 `不得（…）` 自带；
- `unless`：`（例外：{unless.label}）` 追加在义务行末；
- 正文不渲染来源、不渲染 residual、不渲染 `scope` / `type`。

## 7 校验闸

| code | 触发 |
|---|---|
| `Schema` | 白名单外字段 / 缺必填 / impl≠script / op 未注册 / values 或 pattern 非法 |
| `TypeMissing` / `TypeInvalid` | 缺 type / 非法枚举 |
| `ScopeMissing` / `ScopeInvalid` | 缺 scope / 不匹配 `global` 或 `project:<name>` |
| `LogicConflict` / `LogicArity` / `DepthExceeded` | 组合键冲突 / 少于 2 项 / 超过 3 层 |
| `AssertLabelMissing` / `UnlessLabelMissing` | 顶层 assert 缺 label / unless 缺 label |
| `LogicWordInLabel` / `LabelShape` | label 含逻辑词 / 含情态词·标点·超长 |
| `RuleWithoutProbe` / `ProbeSchema` | 顶层 assert 缺 probe / probe 形态非法 |
| `FieldLabelMissing` | `residual.fields` 指向 when/assert 之外的字段 |
| `TestcaseMissing` / `CaseMismatch` | 判据无 testcase / 样例期望与实得不等 |
| `RuleProjectionDrift` / `RuleProjectionMissing` | 手改正文 / 登记判据缺 `rules/<id>.md` |
| `RuleStructureIncomplete` | 缺触发 / 义务 / 例外 / 判定动作（不再要求来源锚） |
| `RuleOverBudget` / `RuleUnderBudget` | `rules/*.md` 非空白字符 >500 / <100 |

## 8 验收命令

```powershell
node tools\docgen\builders\rules\build.mjs
npm run check:criteria
```

- 前者末行 `rule-dsl ok`、逐条输出 `N 条样例已判`；
- 后者首行 `判据 N 条 / 绿 M / 红 K`、末行 `criteria-engine ok`；
- 只有 `rules.json` 登记的 id 才额外产出 `rules/<id>.md`；正文手改即红，改 json 后重跑 `build.mjs`。
