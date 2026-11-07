# 阶段 2b 实现规格（spec）

> 上游：[stage-2b-rule-dsl-expressiveness.md](./stage-2b-rule-dsl-expressiveness.md)（需求）
> 验收合同：[stage-2b-testcase-sdet.md](./stage-2b-testcase-sdet.md)（170 条，R4 待同步 B-23）
> 状态：**待 SDET 复核（R2）**
> 本文件回答：怎么实现、每个字符串 / 每个 code 长什么样，使 170 条用例可逐条执行。

## 0 范围

做：判据数据契约、判定语义、渲染契约、校验契约、迁移步骤。
不做：阶段 3 的 skill 全面改造、发布侧 scope 过滤实现（V-2b-11 保持 BLOCKED）。

## 1 本 spec 相对需求文档的 10 条裁定

| # | 裁定 | 影响的用例 |
|---|---|---|
| S-1 | **嵌套组合节点不要求 label**；取消 `DeepExpressionUnlabeled`，只保留顶层 `AssertLabelMissing` | B-23 **须由 SDET 改成「嵌套无 label 合法」正例** |
| S-2 | `probe` 对**全部判据**必填（不再只限 `rules.json` 登记项） | E-10 翻红、H-06 |
| S-3 | 深度口径 = **组合节点层数**，顶层组合 = 1，叶子不计 | B-15 / B-16 |
| S-4 | `scope` = `global` 或 `project:<name>`，`<name>` 满足 `^[a-z0-9][a-z0-9-]*$` | A-07 / A-08 / A-09 |
| S-5 | `unless` 存在时 `unless.label` 必填（`UnlessLabelMissing`） | C-13 |
| S-6 | `name` 选填；组合子项回退顺序 = `name → field`（**不回退 label**） | C-10 / C-15 |
| S-7 | 新增 `ProbeSchema`：kind 四值、take 取值、必填键 | E-13 |
| S-8 | 叶子同时有 `label` 与 `name`：顶层用 `label`，组合子项用 `name`；并存不报错 | C-15 |
| S-9 | `LogicWordInLabel` 先报，`LabelShape` 报其余；同一命中不重复报两条 | C-03 / C-04 / I-06 |
| S-10 | 渲染拼接固定：`{label}：{probe 段}{谓词}`；manual 省略 probe 段与分号 | E-01 / E-02 / F-08 |

## 2 数据契约

### 2.1 顶层字段

| 字段 | 类型 | 必填 | 失败 code |
|---|---|---|---|
| `id` | string | 是 | `Schema` |
| `impl` | `"script"` | 是 | `Schema`（文案：本执行器只接受 impl=script） |
| `type` | `持续适用` / `条件触发` / `模式门控` | 是 | `TypeMissing` / `TypeInvalid` |
| `scope` | `global` / `project:<name>` | 是 | `ScopeMissing` / `ScopeInvalid` |
| `title` | string，不含「——」 | 是 | `Schema` |
| `when` | Cond 或 `{ "always": true }` | 是 | `Schema` |
| `assert` | Obligation[]，非空 | 是 | `Schema` |
| `residual` | `{who, sample≥1, fields[], objectivePath}` | 是 | `ResidualWhoMissing` / `ResidualSampleInvalid` / `ResidualObjectivePathMissing` / `FieldLabelMissing` |
| `refs` | string[] | 否 | `Schema`（类型错） |
| `landing` | string | 是 | `Schema` |

白名单外字段（含 `source` / `group` / `retry` / `order` / `rollback`）→ `Schema`，文案含「未登记字段 <名>」与「描述性字段不允许」。

**必填检查的例外**：`scope` 不参与泛化「缺字段」检查，缺 / 非法一律只报 `ScopeMissing` / `ScopeInvalid`（保证 A-06 能拿到目标 code，不被 `Schema` 吞掉）。

### 2.2 条件节点

```
Cond := Leaf | { anyOf: [Cond≥2] } | { allOf: [Cond≥2] } | { oneOf: [Cond≥2] } | { not: Cond }
Leaf := { field, op, value?, values?, pattern?, allow?, forbid?, conflict?, label?, name?, probe?, unless? }
```

叶子规则：

- 必须且只能有一个 `op`，且在算子表内；否则 `Schema`（op 未注册）；
- `values` 类算子（`containsAny` / `notContains` / `startsWithAny` / `includesAll` / `includesAny`）必须有非空 `values`；
- `matches` / `notMatches` 必须有非空 `pattern`；
- `notForbiddenCommand` 必须有 `allow`、`forbid`，且 `conflict = "longestAllowWins"`；
- `field` 必填。

组合节点规则：

- 一个节点只许出现一种逻辑键 → `LogicConflict`；
- `anyOf` / `allOf` / `oneOf` 至少 2 项 → `LogicArity`；
- `not` 必须是单个 Cond；
- 组合层数 > 3 → `DepthExceeded`。

### 2.3 probe

| kind | 必填键 | take 允许值 |
|---|---|---|
| `command` | `run` | `exit` / `stdout` |
| `file` | `path` | `exists` / `content` |
| `glob` | `path` | `count` / `names` |
| `manual` | 无 | 无 |

任一不满足 → `ProbeSchema`，文案点名字段（`probe.kind "shell" 非法`、`probe.command 缺 run`）。

### 2.4 residual

- `who` 非空、`sample` 正整数、`objectivePath` 非空；
- `fields[]` 每项必须出现在**递归收集**的 `when/assert` 字段集合里，否则 `FieldLabelMissing`。

## 3 判定语义

### 3.1 算子语义（判定侧，逐字实现）

| op | 判定 | 备注 |
|---|---|---|
| `eq` | `v === value` 严格相等 | 布尔与数字同用 |
| `nonEmpty` | `String(v ?? '').trim() !== ''` | 空白算空 |
| `empty` | `String(v ?? '').trim() === ''` | |
| `containsAny` | `values.some(x => String(v ?? '').includes(x))` | 字面量包含，不 trim |
| `notContains` | `!values.some(...)` | 同上 |
| `startsWithAny` | `values.some(x => norm(s).startsWith(norm(x)))`，`s = String(v ?? '').trim()`，`norm = (x) => String(x ?? '').trim().toLowerCase()`（**两侧都规整**） | 大小写不敏感 |
| `matches` | `new RegExp(pattern).test(String(v ?? ''))` | 非法正则 → `Schema` |
| `notMatches` | `!matches` | |
| `gt` / `gte` / `lt` / `lte` | 数字比较，`v` 转 Number | 非数字 → fail（不是报错） |
| `countEq` / `countLte` / `countGte` | 同上，语义按值比较 | 计数由 probe 产出为数字 |
| `includesAll` | `values.every(x => Array.isArray(v) && v.includes(x))` | 非数组 → fail |
| `includesAny` | `values.some(...)` | 同上 |
| `notForbiddenCommand` | 见下 | |

`notForbiddenCommand`：命令 `trim + 空白折叠 + 小写`；allow / forbid 同样规整；命中 forbid 且 `longestAllowWins` 时，若最长 allow 前缀严格长于最长 forbid 前缀 → pass，否则 fail；未命中 forbid → pass。

### 3.2 组合与例外

```
evalCond(c, input):
  if c.unless && evalCond(c.unless, input): return true     // 例外先判，对任意节点生效
  if c.anyOf: return some(x => evalCond(x, input))
  if c.allOf: return every(x => evalCond(x, input))
  if c.oneOf: return count(x => evalCond(x, input)) === 1
  if c.not:   return !evalCond(c.not, input)
  if c.always === true: return true
  return OPS[c.op].fn(input[c.field], c)

judge(rule, input):
  if !evalCond(rule.when, input): return 'pass'
  for a of rule.assert: if !evalCond(a, input): return 'fail'
  return 'pass'
```

- `unless` **必须先于组合分支**判定，否则组合节点上的例外永远不生效（B-13/B-14）；
- `oneOf` 判「恰好一个」：0 真、≥2 真都 fail；
- 深度只数组合节点：顶层组合 = 1，`not` 也算 1 层，叶子 = 0。

## 4 渲染契约

### 4.1 模板

```markdown
# {title}

> 触发：{触发文案}

义务（全部成立才合规；缺一件 = 不合格）：
1. {义务行}
2. {义务行}

另见：{refs 以「、」连接}
落点：{landing}
```

- 标题行逐字 `# {title}`；其后 1 空行；
- 触发行后 1 空行；义务段后 1 空行；
- `refs` 缺省 / 空数组时整行 `另见：` 不出现；
- 全文不得出现「来源」。

### 4.2 触发文案

| when 形态 | 渲染 |
|---|---|
| `{always:true}` | `始终适用` |
| 有 `label` | 输出 `label` |
| 无 `label` | `renderNode(when)`，叶子例：`flag 等于 true` |

### 4.3 义务行

```
{label}：{probe 段}{谓词}
```

- `label`：assert 顶层 `label`（必填）；
- `probe 段`：`{probe 渲染}；`；`kind=manual` 时为空（不出现分号）；
- `谓词`：§4.4；
- 组合节点：`{label}（{head}：{子项}）`；
- `notForbiddenCommand` 的义务行后追加两行子项：

```
   - 允许：git status / git log / ...
   - 禁止：git commit / git push / ...
```

### 4.4 常量表（逐字照抄）

```js
LOGIC_LABELS = {
  anyOf: { head: '以下任一', sep: ' 或 ' },
  allOf: { head: '全部满足', sep: ' 且 ' },
  oneOf: { head: '恰好一个', sep: ' 或 ' },
  not:   { head: '不得' },
}

PREDICATE = {
  eq: (a) => a.value === true ? '必须成立' : a.value === false ? '必须不成立' : `必须等于 ${JSON.stringify(a.value)}`,
  nonEmpty: () => '必须非空',
  empty: () => '必须为空',
  containsAny: (a) => `必须包含以下任一：${a.values.join(' / ')}`,
  notContains: (a) => `不得包含以下任一：${a.values.join(' / ')}`,
  startsWithAny: (a) => `必须以以下任一项开头：${a.values.join(' / ')}`,
  matches: (a) => `必须匹配 \`${a.pattern}\``,
  notMatches: (a) => `不得匹配 \`${a.pattern}\``,
  gt: (a) => `必须大于 ${a.value}`,
  gte: (a) => `必须 ≥ ${a.value}`,
  lt: (a) => `必须小于 ${a.value}`,
  lte: (a) => `必须 ≤ ${a.value}`,
  countEq: (a) => `计数必须等于 ${a.value}`,
  countLte: (a) => `计数必须 ≤ ${a.value}`,
  countGte: (a) => `计数必须 ≥ ${a.value}`,
  includesAll: (a) => `必须包含全部：${a.values.join(' / ')}`,
  includesAny: (a) => `必须包含以下任一项：${a.values.join(' / ')}`,
  notForbiddenCommand: () => '必须不在禁止清单内',
}

PROBE_TEXT = {
  'command:exit': (p) => `运行 \`${p.run}\`，取退出码`,
  'command:stdout': (p) => `运行 \`${p.run}\`，取输出首行`,
  'file:exists': (p) => `检查 \`${p.path}\` 是否存在`,
  'file:content': (p) => `读取 \`${p.path}\` 内容`,
  'glob:count': (p) => `统计 \`${p.path}\` 的文件数`,
  'glob:names': (p) => `列出文件名（\`${p.path}\`）`,
}
```

逐字样例（E-01）：

```
1. 锚：运行 `node scripts/x.mjs`，取退出码；必须等于 0
```

### 4.5 组合节点与括号

- `{label}（{head}：{子项按 sep 连接}）`；
- `not`：`{label}（不得（{子节点的 body}））`，`body` 指子节点**不带自身 label、不加额外括号**的渲染；因此 `not{anyOf[A,B]}` 逐字为 `{label}（不得（以下任一：A 或 B））`，不得出现 `且`，也不得出现双层 `（（`；
- 子节点是组合节点且**与父类型不同**时，子节点整体加 `（）`（`not` 的括号由 `不得（…）` 自带，不再叠加）；
- 同类型嵌套不加额外括号；
- 嵌套子节点**不渲染 label**（S-1），只渲染 `{head}：{子项}`。

### 4.6 叶子在组合里的名字

| 位置 | 取什么 |
|---|---|
| assert 顶层 | `label`（必填） |
| 组合子项 | `name ?? field`（**不回退 label**） |

### 4.7 例外

`unless` 渲染为 `（例外：{unless.label}）`，追加在该义务行末尾、子项行之前。

## 5 校验契约

### 5.1 闸与 code

| code | 触发条件 | 文案必须包含 |
|---|---|---|
| `Schema` | 白名单外字段 / 缺必填（scope 除外）/ impl≠script / op 未注册 / values 空 / pattern 空 / 非法正则 | 字段名 + 「未登记字段」或「缺字段」 |
| `TypeMissing` / `TypeInvalid` | 缺 type / 非法值 | `type` 与三值枚举；非法值逐字含 `type 非法枚举` |
| `ScopeMissing` / `ScopeInvalid` | 缺 scope / 正则不匹配 | `scope` 与 `global / project:<name>` |
| `LogicConflict` | 同节点 ≥2 逻辑键 | 冲突键名 |
| `LogicArity` | 组合 <2 项 | 键名与「至少 2 项」 |
| `DepthExceeded` | 组合层数 >3 | 深度与上限 |
| `AssertLabelMissing` | assert 顶层缺 label | assert 序号 |
| `LabelShape` | label 命中禁词表 / >12 字符 / 含标点 | 命中词 + 固定修法 |
| `LogicWordInLabel` | label 含逻辑连接词 | 命中词 |
| `RuleWithoutProbe` | 任一判据的 assert 顶层缺 probe | 判据 id + assert 序号 |
| `ProbeSchema` | kind/take/必填键非法 | 具体字段 |
| `UnlessLabelMissing` | 有 unless 但无 label | assert 序号 |
| `FieldLabelMissing` | residual.fields 指向未知字段 | 字段名 |
| `TestcaseMissing` | 判据无 testcase | 判据 id |
| `CaseMismatch` | 样例期望≠实得 | case 序号 + expect + got |
| `RuleProjectionDrift` | 渲染物与磁盘不一致 | 文件路径 + 「手改 rule 正文」 |
| `RuleProjectionMissing` | 登记判据的 `rules/<id>.md` 缺失 | 文件路径 |
| `RuleStructureIncomplete` | 缺触发 / 义务 / 例外 / 判定动作 | missing 数组，不得含「来源锚」 |
| `RuleOverBudget` / `RuleUnderBudget` | `rules/*.md` 非空白字符 >500 / <100 | 文件 + `chars=<实际值>` + `max: 500` / `min: 100`（逐字，K-01 断言 `max: 500`） |

`TestcaseMissing` 同时要求 build 侧逐字输出：

```
判据无 testcase（<id>.testcase.json）→ 未验证，不得渲染
```

固定修法文案（`LabelShape` / `LogicWordInLabel`）：

```
label 只许名词短语（≤12 字符、不含逻辑词/情态词/标点）；谓词由算子产出
```

### 5.2 label 判定算法（逐字集，C-03~C-09 / I-06）

```
s = label.trim()
1) 逻辑词（子串命中任一）→ LogicWordInLabel，报命中的词，不再走 2)：
   或 / 且 / 任一 / 全部 / 至少 / 恰好 / 之一
2) 否则按 LabelShape，命中任一条即报：
   a) 情态/祈使词：必须 / 须 / 应当 / 需要 / 不得 / 不许 / 请 /
      给出 / 写出 / 附上 / 贴出 / 执行 / 跑 / 确认
   b) 标点：， 。 ； ： 、 ！ ？ / 与半角 , . ; : ! ? /
   c) s.length > 12（UTF-16 码元；中文按 1）
3) 都不命中 → 通过
```

说明：单字「要」「应」**不单独禁**（误杀率高，如「要点」「应用」）；「是否需要名词短语」的残余判定归 `reviewer-audit` 抽检。

### 5.3 优先级

1. `Schema`（结构不合法则后续不判；`scope` 除外）
2. `ScopeMissing` / `ScopeInvalid`
3. `LogicConflict` / `LogicArity` / `DepthExceeded`
4. `LogicWordInLabel`
5. `LabelShape`（不与上一条重复报同一命中）
6. `AssertLabelMissing` / `UnlessLabelMissing` / `RuleWithoutProbe` / `ProbeSchema`
7. `FieldLabelMissing`
8. `TestcaseMissing` / `CaseMismatch`
9. 投影与预算：`RuleProjectionDrift` / `RuleProjectionMissing` / `RuleStructureIncomplete` / `RuleOverBudget`

### 5.4 输出约定

- **收集口径**：只有 `Schema`（结构不可继续）会终止该判据的后续检查；其余 finding **全部收集后在末尾统一输出**，保证 G-04 能同时看到 `ScopeMissing` 与 `LabelShape`；
- 每条 finding 一行，含文件名与 code；
- 有 finding → exit 1；
- 全绿末行 `criteria-engine ok`。

成功行（逐字，供 A-01 / I-01 / I-03 / H-06b 断言）：

```
<id>: <n> 条样例已判（测试在 <id>.testcase.json）
解释器 <k> 个（<ids>），样例 <m> 条，错误 0 条
rule-dsl ok
```

```
判据 <N> 条 / 绿 <M> / 红 <K>
criteria-engine ok
```

`evidence-before-conclusion` 的成功行逐字为：

```
evidence-before-conclusion: 13 条样例已判（测试在 evidence-before-conclusion.testcase.json）
```

## 6 文件、目录与出品

### 6.1 目录

| 位置 | 内容 | 发布 |
|---|---|---|
| `tools/quality/criteria-engine/<id>.json` + `<id>.testcase.json` | 判据与测试 | 否 |
| `tools/quality/criteria-engine/<id>.md` + `<id>.inject.md` | 引擎目录投影 | 否 |
| `rules/<id>.md` | 部署物 | 是（按 `scope`） |
| `skills/rule-writer/` | 生产工具 | 否 |

`rules.json` 只登记「额外产出 `rules/<id>.md`」的判据 id；未登记判据仍产出引擎目录 `md` / `inject.md`。

### 6.2 出品判据（可机判）

- 用户目录搜索：在 `~/.trae-cn/**` 与 `~/.aas/**` 搜 5 条判据的 `<id>.json` / `<id>.testcase.json` / `rules.json`（排除 `installed.json`），命中数必须 = 0；
- `~/.aas/installed.json` 中 name / path 含 `rule-writer` 的条目数必须 = 0；
- `~/.trae-cn/skills/rule-writer` 三态：不存在 → 合规；存在且解析目标 = 本仓 `skills/rule-writer`（活链）→ fail；存在但为副本 / 断链 / 他处 → fail。

## 7 迁移步骤与具体数据

### 7.1 代码

1. `schema.mjs`：白名单 + 18 个算子（沿用 4 + 新增 14）+ 递归 `evalCond` / `checkCond` + 三张常量表 + `renderNode`。
2. `interpreters.mjs`：`md` / `inject` 消费 label / name / probe；删来源行。
3. `rules.mjs`：rule 投影复用同一渲染函数。
4. `scripts/check-criteria-engine.mjs`：递归字段收集 + §5 全部 code + 结构闸 V-4 去「来源锚」。
5. `scripts/rule-audit-lite.mjs`：删 `> 来源` 的 STRUCT / SOURCE 特判。

### 7.2 现仓 5 份判据

补 `scope` / `label` / `name` / `probe` / `refs`。`observable-criteria`：

```json
{
  "id": "observable-criteria",
  "impl": "script",
  "type": "持续适用",
  "scope": "global",
  "title": "判据正文不得留不可观察评价",
  "when": { "always": true },
  "assert": [
    {
      "label": "可观察检查",
      "name": "check-observable 退出码",
      "probe": { "kind": "command", "run": "node scripts/check-observable.mjs --check", "take": "exit" },
      "field": "checkObservableExit",
      "op": "eq",
      "value": 0
    }
  ],
  "residual": { "who": "reviewer-audit", "sample": 3, "fields": ["checkObservableExit"], "objectivePath": "已是脚本判定，无残余" },
  "refs": ["skills/carrier-conventions/references/observable.md"],
  "landing": "check-observable 输出"
}
```

### 7.3 evidence-before-conclusion 的新字段名（供 H-06b）

| 旧字段 | 新字段 |
|---|---|
| `writesConclusion` | `claimsEvidence` |
| `anchor`（非空 + 形态） | `anchorPathLine` / `anchorCommandOutput` / `anchorReference`（`anyOf`） |
| `scope`（适用范围，原字段） | `applicability`（避免与顶层发布 `scope` 同名混淆） |
| `target` | `target` |
| `numbersCommand` + `hasNumbers` | 同名（**保留原名**） |
| `lookupReport` + `lookupHit` | `missReport` + `lookupHit` |
| `source` / `chain` / `boundary` + `isCompoundDerivation` | 删除（复杂推导归 `assertion-quality`） |

H-06b 的旧名禁查清单 = `lookupReport`、`isCompoundDerivation`，**按键名精确匹配**（不得用子串匹配，否则 `anchorPathLine` 会误命中 `anchor`）。

完整 json：

```json
{
  "id": "evidence-before-conclusion",
  "impl": "script",
  "type": "持续适用",
  "scope": "global",
  "title": "说出口的结论必须有可核出处",
  "when": { "field": "claimsEvidence", "op": "eq", "value": true, "label": "输出结论前" },
  "assert": [
    {
      "label": "可核查锚",
      "probe": { "kind": "manual" },
      "anyOf": [
        { "field": "anchorPathLine", "op": "matches", "pattern": ":\\d+", "name": "path:line" },
        { "field": "anchorCommandOutput", "op": "containsAny", "values": ["exit", "退出码", "→"], "name": "命令 + 输出首行" },
        { "field": "anchorReference", "op": "containsAny", "values": ["/", "\\"], "name": "引用件路径" }
      ]
    },
    { "label": "适用范围", "field": "applicability", "op": "nonEmpty", "probe": { "kind": "manual" } },
    { "label": "回答目标", "field": "target", "op": "nonEmpty", "probe": { "kind": "manual" } },
    {
      "label": "数字取数命令", "field": "numbersCommand", "op": "nonEmpty",
      "probe": { "kind": "manual" },
      "unless": { "field": "hasNumbers", "op": "eq", "value": false, "label": "不含统计数字" }
    },
    {
      "label": "查无记录", "field": "missReport", "op": "nonEmpty",
      "probe": { "kind": "manual" },
      "unless": { "field": "lookupHit", "op": "eq", "value": true, "label": "已查到结果" }
    }
  ],
  "residual": {
    "who": "reviewer-audit", "sample": 3,
    "fields": ["anchorPathLine", "anchorCommandOutput", "anchorReference", "applicability", "target"],
    "objectivePath": "锚四件套可形式化后压回机判；范围/目标同题性由判例库样本收敛"
  },
  "refs": ["assertion-quality"],
  "landing": "答案 / 交付账"
}
```

渲染逐字（F-17 的判据）：

```markdown
# 说出口的结论必须有可核出处

> 触发：输出结论前

义务（全部成立才合规；缺一件 = 不合格）：
1. 可核查锚（以下任一：path:line 或 命令 + 输出首行 或 引用件路径）
2. 适用范围：必须非空
3. 回答目标：必须非空
4. 数字取数命令：必须非空（例外：不含统计数字）
5. 查无记录：必须非空（例外：已查到结果）

另见：assertion-quality
落点：答案 / 交付账
```

13 条样例按新字段名重写，语义保持：正例（有锚 / 有取数命令 / 查得时免记录）、反例（无有效锚 / 范围空 / 目标空 / 有数字无命令 / 查不到无记录 / 不触发）。

锚形态校验落在 `anyOf` 三个分支的算子里（`matches` / `containsAny`），**不用 `nonEmpty` + 形态的嵌套 `allOf`**：组合子项按 `name` 渲染，故 §7.3 的义务行逐字不变；空串天然不匹配，「三锚全空」与「形态非法」由同一条反例覆盖（样例取旧例「我记得是这样」的等价输入 `anchorPathLine: "我记得是这样"`）。

### 7.4 anchor-forms（pilot 与现仓都落这份）

> 2026-11-07 复核：该判据与 `evidence-before-conclusion` 的锚义务重复。现仓判据（json / testcase / md / inject）与发布物已删除，现仓回到 5 条 / 34 样例；pilot 副本保留用于 K-03。下方 json 仅作历史设计记录。

```json
{
  "id": "anchor-forms",
  "impl": "script",
  "type": "条件触发",
  "scope": "global",
  "title": "结论必须带可核查的锚",
  "when": { "field": "writesConclusion", "op": "eq", "value": true, "label": "输出结论前" },
  "assert": [
    {
      "label": "可核查锚",
      "probe": { "kind": "manual" },
      "anyOf": [
        { "field": "anchorPathLine", "op": "nonEmpty", "name": "path:line" },
        { "field": "anchorCommandOutput", "op": "nonEmpty", "name": "命令 + 输出首行" },
        { "field": "anchorReference", "op": "nonEmpty", "name": "引用件路径" }
      ]
    },
    {
      "label": "有效锚",
      "probe": { "kind": "manual" },
      "field": "anchorText",
      "op": "notContains",
      "values": ["见上文", "同上"]
    }
  ],
  "residual": { "who": "reviewer-audit", "sample": 3, "fields": ["anchorPathLine", "anchorCommandOutput", "anchorReference"], "objectivePath": "锚四件套可形式化后压回机判" },
  "landing": "答案"
}
```

4 条 testcase（字段名必须与上面 json 一致）：

| case | 输入 | expect |
|---|---|---|
| H-02 | `writesConclusion:true`，仅 `anchorCommandOutput:"npm run check → exit 0"`，其余空，`anchorText` 合法 | pass |
| H-03 | `writesConclusion:true`，三个锚字段全空 | fail |
| H-04 | `writesConclusion:true`，`anchorText:"见上文"` | fail |
| H-05 | `writesConclusion:false`，其余全空 | pass |

> testcase 的 H-02~H-05 输入需由 SDET 同步为 `anchorPathLine` / `anchorCommandOutput` / `anchorReference` / `anchorText`，禁词为 `见上文` / `同上`（原 `我记得` 改为 `见上文`）。

### 7.5 pilot 根

`docs/prd/20261105182104-rule-refactor/rule-dsl/`，文件：`schema.mjs` / `interpreters.mjs` / `build.mjs` / 4 份 `<id>.json` / 4 份 `<id>.testcase.json` / 生成物 `<id>.md` + `<id>.inject.md`。旧 3 份 testcase 字节不变。

### 7.6 文档与技能

- `criteria-engine/README.md` §六追加三串：`逻辑关系显式建模`、`label 只命名`、`判定动作与记录落点分离`。
- `skills/rule-writer/references/criteria-dsl.md` 必含八主题：`字段表`、`条件语法`、`label`、`算子表`、`probe`、`渲染`、`校验闸`、`验收命令`。
- `rule-writer` 2b 交付 = 本仓 `tools/quality/criteria-engine/` 下 `<id>.json` + `<id>.testcase.json` 两个文件；不进 `.md` 草稿箱。

## 8 验收映射

| spec 节 | testcase 组 |
|---|---|
| §2 | A 组 15 条 + G 组 4 条 |
| §3 | B 组 31 条 |
| §4 | C 组 15 条 + E 组 13 条 + F 组 17 条 |
| §5 | A / B / C / E / G 的判红行 |
| §6 | H 组 12 条 + J 组 4 条 |
| §7 | H 组 + I 组 |
| 全量 | I 组 13 条 + K 组 3 条 |

## 9 未决

| # | 项 | 状态 |
|---|---|---|
| X-1 | V-2b-11（scope 发布过滤） | BLOCKED：依赖发布侧实现 |
| X-2 | F-16 逐字节样例 | 本文档 §4.3 定稿后同步 PRD §7 示例，再激活 |
| X-3 | `matches` 正则复杂度 | 归 residual（reviewer-audit 抽检） |
| X-4 | 「label 是否真名词短语」 | 归 residual（禁词表 + 长度只能拦大部分） |
| X-5 | 阶段 3 的 rule-inspector / 草稿箱改造 | 不在本阶段 |
