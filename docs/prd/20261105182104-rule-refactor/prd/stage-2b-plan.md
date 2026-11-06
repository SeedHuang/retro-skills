# 阶段 2b 施工计划（rule DSL 表达力补齐）

> **给执行者**：本计划按任务顺序施工，每个任务末尾有可复现的验收命令。步骤用 `- [ ]` 勾选跟踪。
> **需求**：[stage-2b-rule-dsl-expressiveness.md](./stage-2b-rule-dsl-expressiveness.md)
> **实现规格**：[stage-2b-spec.md](./stage-2b-spec.md)（本文所有「逐字」内容以 spec 为准，二者必须同时在场）
> **验收合同**：[stage-2b-testcase-sdet.md](./stage-2b-testcase-sdet.md)（170 条，R5 已一致）
> **状态**：已完成（2026-11-06；170 条验收全 PASS，账见 `docs/reports/2026-11-06-rule-refactor-stage-2b/verification.md`）

**目标**：让 `rules/<id>.md` 只能由判据 json 经脚本渲染产出，使规则正文具备逻辑组合、算子谓词、判定动作与人读表述，手改即红。

**架构**：`schema.mjs`（数据契约 + 判定 + 渲染原语）→ `interpreters.mjs`（投影）→ `build.mjs`（编排）；`check-criteria-engine.mjs` 复用同一份 `check` / `judge` / `render`，不另写第二套。

**技术栈**：Node.js ESM（`.mjs`），零第三方依赖，PowerShell 5.1（读文件必须剥 UTF-8 BOM）。

## 全局约束

- 运行时 Node ESM `.mjs`，不引入 npm 依赖。
- 所有 json 读取前剥 BOM：`text.replace(/^\uFEFF/, '')`。
- 单条 `rules/*.md` 非空白字符 100–500；`rules/` 条数 ≤9；总量 ≤26,513（口径常量见 `scripts/check-criteria-engine.mjs` 顶部的 `BUDGET`）。
- 渲染正文**不得出现子串「来源」**。
- `judge` 是纯函数、单快照；不引入顺序 / 重试 / 回滚。
- 所有判红用例必须同时断言**退出码**与**目标 code**；派生红（由目标错误引起的连锁红）不计。
- 写范围：`tools/quality/criteria-engine/`、`scripts/`、`rules/`、`skills/rule-writer/`、`docs/prd/20261105182104-rule-refactor/rule-dsl/`。不改阶段 3 / 阶段 4 范围。
- **开工前须知（已实测）**：`node scripts\check-all.mjs` 当前 4 红，全部由 `scope-sweep --check` 引起 —— `.session/reviews/2026-11-05-2130-rule-refactor-stage-2/impact-sheet.md` 早于被扫文件。这与 2b 无关，但会污染后续提交，先补该清单再动工。
- **提交纪律**：任务 1–3 是同一原子迁移，中间态允许 `build` 红，但**不得提交红灯**；只在任务 4、5、6 的绿点提交。

## 文件结构

| 文件 | 职责 | 本计划中的变化 |
|---|---|---|
| `tools/quality/criteria-engine/schema.mjs` | 数据契约、18 算子、递归判定、校验、渲染原语 | 重写主体 |
| `tools/quality/criteria-engine/interpreters.mjs` | md / inject / rule 三种投影 | 改为消费渲染原语 |
| `tools/quality/criteria-engine/build.mjs` | 编排：校验 → 判定 → 渲染 → 落盘 | 适配 `check` 返回值 |
| `tools/quality/criteria-engine/rules.mjs` | rule 投影唯一入口 | 跟随解释器，不改逻辑 |
| `tools/quality/criteria-engine/*.json` / `*.testcase.json` | 5 份判据与样例 | 补槽 / 重写 |
| `scripts/check-criteria-engine.mjs` | 门禁 ⑨：code 输出、投影漂移、预算、结构闸 | 重写校验段 |
| `scripts/rule-audit-lite.mjs` | 说明层占比 | 去「来源」结构行 |
| `rules/evidence-before-conclusion.md` | 唯一部署物 | 重新渲染 |
| `skills/rule-writer/SKILL.md` + `references/criteria-dsl.md` | 写入侧 | 新增分支与细则 |
| `docs/prd/.../rule-dsl/` | pilot 副本 | 同步引擎 + 第 4 条判据 |

---

## 任务 1：引擎核心（schema + interpreters + build 适配）

**文件**
- 修改：`tools/quality/criteria-engine/schema.mjs`（整体重写）
- 修改：`tools/quality/criteria-engine/interpreters.mjs`（三种投影改调渲染原语）
- 修改：`tools/quality/criteria-engine/build.mjs`（`check` 调用与错误收集段）

**接口（本任务产出，后续任务依赖）**

```js
// schema.mjs 导出
ALLOWED_KEYS      // ['id','impl','type','scope','title','when','assert','residual','refs','landing']
CRITERION_TYPES   // ['持续适用','条件触发','模式门控']
OPS               // 18 个：eq nonEmpty empty containsAny notContains startsWithAny
                  //        matches notMatches gt gte lt lte countEq countLte countGte
                  //        includesAll includesAny notForbiddenCommand
LOGIC_LABELS      // { anyOf, allOf, oneOf, not }
PREDICATE         // 18 个谓词生成函数
PROBE_TEXT        // 6 个：command:exit/stdout、file:exists/content、glob:count/names
judge(rule, input) -> 'pass' | 'fail'
check(rule, file, out) -> void    // out 追加 { code, message }
renderTrigger(rule) -> string
renderObligation(node, index) -> string   // 含 `1. ` 编号前缀
```

- [x] **步骤 1：记录基线**

```powershell
node tools\quality\criteria-engine\build.mjs
node scripts\check-criteria-engine.mjs
```

期望：前者末行 `rule-dsl ok`、样例 34 条；后者首行 `判据 5 条 / 绿 34 / 红 0`、末行 `criteria-engine ok`。把两次输出粘到任务记录里，作为改动前基线。

- [x] **步骤 2：写失败测试（临时文件，不进仓）**

在 `$env:TEMP\s2b-schema.test.mjs` 写入：

```js
import assert from 'node:assert/strict'
const M = await import('file:///D:/Seed/retro-skills/tools/quality/criteria-engine/schema.mjs')

// 1) 算子表 18 个
assert.equal(Object.keys(M.OPS).length, 18)
for (const k of ['empty','notContains','startsWithAny','matches','notMatches','gt','gte','lt','lte','countEq','countLte','countGte','includesAll','includesAny']) {
  assert.ok(M.OPS[k], `缺算子 ${k}`)
}

const rule = (assertList) => ({
  id: 'x', impl: 'script', type: '持续适用', scope: 'global', title: 't',
  when: { always: true }, assert: assertList,
  residual: { who: 'reviewer-audit', sample: 3, fields: [], objectivePath: '无' },
  landing: '答案',
})

// 2) oneOf 恰好一个
const one = rule([{ label: '锚', anyOf: [], oneOf: [
  { field: 'a', op: 'nonEmpty', name: 'a' }, { field: 'b', op: 'nonEmpty', name: 'b' },
] }])
assert.equal(M.judge(one, { a: 'x' }), 'pass')
assert.equal(M.judge(one, { b: 'x' }), 'pass')
assert.equal(M.judge(one, {}), 'fail')
assert.equal(M.judge(one, { a: 'x', b: 'y' }), 'fail')

// 3) unless 先于组合分支（组合节点上的例外）
const ex = rule([{ label: '锚', anyOf: [
  { field: 'a', op: 'nonEmpty', name: 'a' }, { field: 'b', op: 'nonEmpty', name: 'b' },
], unless: { field: 'skip', op: 'eq', value: true, label: '跳过' } }])
assert.equal(M.judge(ex, { skip: true }), 'pass')
assert.equal(M.judge(ex, { skip: false }), 'fail')

// 4) 校验 code：深度 / label / probe
const deep = rule([{ label: '锚', anyOf: [
  { field: 'a', op: 'nonEmpty', name: 'a' },
  { allOf: [{ not: { field: 'b', op: 'nonEmpty', name: 'b' } }, { field: 'c', op: 'nonEmpty', name: 'c' }] },
] }])
deep.assert = [{ label: '锚', anyOf: [deep.assert[0], { field: 'd', op: 'nonEmpty', name: 'd' }] }]
const out = []
M.check(deep, 'x.json', out)
assert.ok(out.some((f) => f.code === 'DepthExceeded'), '缺 DepthExceeded')

const labelBad = rule([{ label: '以下任一', field: 'a', op: 'nonEmpty', probe: { kind: 'manual' } }])
const out2 = []
M.check(labelBad, 'x.json', out2)
assert.ok(out2.some((f) => f.code === 'LogicWordInLabel'))
assert.ok(!out2.some((f) => f.code === 'LabelShape'), '同一命中不得重复报 LabelShape')

const noProbe = rule([{ label: '锚', field: 'a', op: 'nonEmpty' }])
const out3 = []
M.check(noProbe, 'x.json', out3)
assert.ok(out3.some((f) => f.code === 'RuleWithoutProbe'))

const badProbe = rule([{ label: '锚', field: 'a', op: 'nonEmpty', probe: { kind: 'shell' } }])
const out4 = []
M.check(badProbe, 'x.json', out4)
assert.ok(out4.some((f) => f.code === 'ProbeSchema'))

// 5) 渲染逐字（E-01 / F-08 / B-29）
assert.equal(
  M.renderObligation({ label: '锚', probe: { kind: 'command', run: 'node scripts/x.mjs', take: 'exit' }, field: 'x', op: 'eq', value: 0 }, 0),
  '1. 锚：运行 `node scripts/x.mjs`，取退出码；必须等于 0',
)
assert.equal(
  M.renderObligation({ label: '锚', probe: { kind: 'manual' }, field: 'a', op: 'nonEmpty' }, 0),
  '1. 锚：必须非空',
)
assert.equal(
  M.renderObligation({ label: '锚', not: { anyOf: [
    { field: 'a', op: 'nonEmpty', name: 'path:line' },
    { field: 'b', op: 'nonEmpty', name: '命令 + 输出首行' },
  ] } }, 0),
  '1. 锚（不得（以下任一：path:line 或 命令 + 输出首行））',
)
console.log('schema 2b ok')
```

- [x] **步骤 3：跑测试确认失败**

```powershell
node "$env:TEMP\s2b-schema.test.mjs"
```

期望：失败（当前 `OPS` 只有 4 个；`renderObligation` 不存在）。

- [x] **步骤 4：重写 `schema.mjs`**

按 spec 落实现，逐字内容照抄，不自行改写文案：

- 字段白名单与必填：spec §2.1（`stage-2b-spec.md:30-47`）；`scope` 不参与泛化缺字段检查，只报 `ScopeMissing` / `ScopeInvalid`。
- 条件语法与叶子约束：spec §2.2（`:49-69`）。
- `probe` 契约：spec §2.3（`:71-80`）。
- `residual`：spec §2.4（`:82-85`）。
- 18 个算子判定语义：spec §3.1（`:89-107`），逐条实现，尤其 `startsWithAny` 两侧 `trim().toLowerCase()`。
- 递归求值：spec §3.2（`:109-129`），`unless` 必须在组合分支**之前**判。
- 常量表：spec §4.4（`:178-216`），逐字照抄。
- 渲染：spec §4.1~§4.7（`:131-242`）。
- 校验 code 与优先顺序：spec §5.1~§5.3（`:244-308`）。

关键骨架（其余照 spec 填满）：

```js
const COMBO = ['anyOf', 'allOf', 'oneOf', 'not']

export function evalCond(c, input) {
  if (c.unless && evalCond(c.unless, input)) return true
  if (c.anyOf) return c.anyOf.some((x) => evalCond(x, input))
  if (c.allOf) return c.allOf.every((x) => evalCond(x, input))
  if (c.oneOf) return c.oneOf.filter((x) => evalCond(x, input)).length === 1
  if (c.not) return !evalCond(c.not, input)
  if (c.always === true) return true
  return OPS[c.op].fn(input[c.field], c)
}

export function judge(rule, input) {
  if (!evalCond(rule.when, input)) return 'pass'
  for (const a of rule.assert) if (!evalCond(a, input)) return 'fail'
  return 'pass'
}

export function check(rule, file, out) {
  const add = (code, message) => out.push({ code, message })
  // 白名单 → scope → 结构 → 组合 → label → probe → residual，顺序按 spec §5.3
}

const depthOf = (c) => {
  if (!c || typeof c !== 'object') return 0
  if (c.anyOf || c.allOf || c.oneOf) {
    return 1 + Math.max(...(c.anyOf ?? c.allOf ?? c.oneOf).map(depthOf))
  }
  if (c.not) return 1 + depthOf(c.not)
  return 0
}
```

- [x] **步骤 5：改写 `interpreters.mjs`**

三处 `render` 全部改为调用 `renderTrigger(rule)` / `renderObligation(a, i)`；模板逐字按 spec §4.1（`:135-146`）。`md` / `inject` / `rule` 都不再出现「来源」，不再渲染 `残余（抽检）`。

- [x] **步骤 6：适配 `build.mjs`**

把 `check` 调用改为结构化结果：

```js
const found = []
check(rule, name, found)
for (const f of found) errors.push(`${name}: ${f.code}：${f.message}`)
```

- [x] **步骤 7：跑临时测试**

```powershell
node "$env:TEMP\s2b-schema.test.mjs"
```

期望：输出 `schema 2b ok`。

- [x] **步骤 8：记录中间态（不提交）**

```powershell
node tools\quality\criteria-engine\build.mjs
```

期望：**红**——现有 5 份 json 缺 `scope` / `label` / `probe`，报 `Schema` / `RuleWithoutProbe` 等。这是已知中间态，由任务 3、4 修复；任务 1 不改数据、不提交。

---

## 任务 2：门禁与投影（rules.mjs + 两个脚本）

**文件**
- 修改：`scripts/check-criteria-engine.mjs`（校验段重写）
- 修改：`scripts/rule-audit-lite.mjs`（`STRUCT` 常量与 `SOURCE` 常量）
- 检查（不改逻辑）：`tools/quality/criteria-engine/rules.mjs`

**接口**
- 消费任务 1 的 `check()` 结构化输出、`renderTrigger` / `renderObligation`、`CRITERION_TYPES`。
- 产出 spec §5.1 的全部 code；成功行逐字按 spec §5.4（`:317-334`）。

- [x] **步骤 1：建临时绿夹具根**

用一个最小合法判据做门禁自测，不依赖现仓红灯数据：

```powershell
$T = Join-Path $env:TEMP 'r2b-root'
Remove-Item -Recurse -Force $T -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $T | Out-Null
Copy-Item -Recurse tools "$T\tools"
Copy-Item -Recurse scripts "$T\scripts"
Copy-Item -Recurse rules "$T\rules"
'{"rules": []}' | Set-Content -Encoding UTF8 "$T\tools\quality\criteria-engine\rules.json"
Remove-Item "$T\rules\*.md" -Force
Set-Content -Encoding UTF8 "$T\tools\quality\criteria-engine\r2b-base.json" @'
{
  "id": "r2b-base", "impl": "script", "type": "持续适用", "scope": "global",
  "title": "测试判据",
  "when": { "field": "flag", "op": "eq", "value": true, "label": "触发标记" },
  "assert": [
    { "label": "锚", "field": "anchor", "op": "nonEmpty", "probe": { "kind": "manual" } }
  ],
  "residual": { "who": "reviewer-audit", "sample": 3, "fields": ["anchor"], "objectivePath": "无" },
  "landing": "答案"
}
'@
Set-Content -Encoding UTF8 "$T\tools\quality\criteria-engine\r2b-base.testcase.json" @'
{
  "rule": "r2b-base",
  "cases": [
    { "input": { "flag": true, "anchor": "x" }, "expect": "pass" },
    { "input": { "flag": true, "anchor": "" }, "expect": "fail" },
    { "input": { "flag": false }, "expect": "pass" }
  ]
}
'@
node "$T\tools\quality\criteria-engine\build.mjs"
```

期望：末行 `rule-dsl ok`，生成 `r2b-base.md` / `r2b-base.inject.md`。

- [x] **步骤 2：确认门禁当前是红的**

```powershell
node "$T\scripts\check-criteria-engine.mjs" --root $T
```

期望：当前实现缺 `ScopeMissing` / `RuleWithoutProbe` 等 code，无法通过新夹具。把它作为本任务的失败测试。

- [x] **步骤 3：重写 `check-criteria-engine.mjs`**

按 spec §5 落实现，保持现有输出契约：

- 结构化 findings 映射：`check()` 返回的 `{code,message}` 直接进 findings，不再统一包成 `Schema`。
- 新增/保留 code：`TypeMissing`、`TypeInvalid`、`ScopeMissing`、`ScopeInvalid`、`LogicConflict`、`LogicArity`、`DepthExceeded`、`AssertLabelMissing`、`LabelShape`、`LogicWordInLabel`、`RuleWithoutProbe`、`ProbeSchema`、`UnlessLabelMissing`、`FieldLabelMissing`、`TestcaseMissing`、`CaseMismatch`、`RuleProjectionDrift`、`RuleProjectionMissing`、`RuleStructureIncomplete`、`RuleOverBudget` / `RuleUnderBudget`。
- 结构闸（`structureGate`）改为四件：`触发` / `义务` / `例外` / `判定动作`；**不得**再把「来源锚」算作缺件。判定动作判定词用：

```js
const ACTION_GATE = /(path:line|退出码|\bexit\b|命令|计数\s*=|非空|为空|枚举[：:]|diff|运行 `|检查 `|读取 `|统计 `|列出文件名)/
```

- 预算文案逐字：`chars=<实际值>` + `max: 500` / `min: 100`（spec §5.1 `:268`）。
- 成功行逐字按 spec §5.4：`判据 <N> 条 / 绿 <M> / 红 <K>` 与 `criteria-engine ok`。

- [x] **步骤 4：改 `rule-audit-lite.mjs`**

- `STRUCT` 删掉 `>\s*来源` 分支。
- 删除 `SOURCE` 常量与 `isExplain` 中的 `SOURCE.test(t)`。

改完的结构行只保留：标题行、`> 触发`、`残余（抽检）：`、`产物：`。

- [x] **步骤 5：临时夹具转绿**

```powershell
node "$T\scripts\check-criteria-engine.mjs" --root $T
```

期望：首行 `判据 1 条 / 绿 3 / 红 0`；末行 `criteria-engine ok`；exit 0。

- [x] **步骤 6：三条判红冒烟**

```powershell
# ① ScopeMissing
(Get-Content "$T\tools\quality\criteria-engine\r2b-base.json" -Raw).Replace('"scope": "global",', '') |
  Set-Content -Encoding UTF8 "$T\tools\quality\criteria-engine\r2b-base.json"
node "$T\tools\quality\criteria-engine\build.mjs"
node "$T\scripts\check-criteria-engine.mjs" --root $T
# 期望 exit 1，stderr 含 ScopeMissing
```

```powershell
# ② 手改投影
Copy-Item tools\quality\criteria-engine\r2b-base.json "$T\tools\quality\criteria-engine\r2b-base.json" -Force
node "$T\tools\quality\criteria-engine\build.mjs"
Add-Content -Encoding UTF8 "$T\tools\quality\criteria-engine\r2b-base.md" 'X'
node "$T\scripts\check-criteria-engine.mjs" --root $T
# 期望 exit 1，stderr 含 RuleProjectionDrift 与 r2b-base.md
```

```powershell
# ③ 结构闸不含来源锚
Set-Content -Encoding UTF8 "$T\rules\r2b-struct.md" @'
# 标题

> 触发：始终适用

义务（全部成立才合规；缺一件 = 不合格）：
1. 例外说明（例外：只许 X）
'@
node "$T\scripts\check-criteria-engine.mjs" --root $T
# 期望 exit 1，stderr 含 RuleStructureIncomplete、missing 含「判定动作」、不含「来源锚」
```

- [x] **步骤 7：跑校验器自测**

```powershell
node --test scripts\check-criteria-engine.test.mjs
```

期望：全部 pass。该用例（V-16）会把每条判据的第一条样例期望翻转后要求 exit 1 并点名 `<id>.testcase.json`；若新 code 让输出只剩 code 而无文件名，会在这里红——先修输出格式再继续。

- [x] **步骤 8：不提交**

任务 2 结束时现仓仍红（数据未补槽），保持工作区，不创建 commit。

---

## 任务 3：现仓 4 份判据补槽（不含 evidence）

**文件**
- 修改：`tools/quality/criteria-engine/import-guard.json`
- 修改：`tools/quality/criteria-engine/no-git-write.json`
- 修改：`tools/quality/criteria-engine/no-unverified-number.json`
- 修改：`tools/quality/criteria-engine/observable-criteria.json`
- 不改：上述 3 份旧 `.testcase.json`（字节不变）；`observable-criteria.testcase.json` 仅在字段名变更时同步（本任务不改字段名）。

**接口**：消费任务 1 的 schema；产出物供任务 4 与门禁使用。

- [x] **步骤 1：补 `import-guard.json`**

```json
{
  "id": "import-guard",
  "impl": "script",
  "type": "条件触发",
  "scope": "global",
  "title": "编辑代码后必须真实验证且 import 不丢",
  "when": { "field": "edited", "op": "eq", "value": true, "label": "编辑代码后" },
  "assert": [
    { "label": "验证命令", "field": "verifyCommand", "op": "nonEmpty", "probe": { "kind": "manual" } },
    { "label": "验证输出", "field": "verifyOutput", "op": "nonEmpty", "probe": { "kind": "manual" } },
    { "label": "import 未丢失", "field": "importTogether", "op": "eq", "value": true, "probe": { "kind": "manual" } },
    { "label": "回读证据", "field": "reread", "op": "eq", "value": true, "probe": { "kind": "manual" } }
  ],
  "residual": { "who": "reviewer-audit", "sample": 3, "fields": ["verifyOutput", "importTogether"], "objectivePath": "验证输出可解析后可压回机判；import 完整性由编译器兜底" },
  "landing": "edit-record"
}
```

- [x] **步骤 2：补 `no-git-write.json`**

```json
{
  "id": "no-git-write",
  "impl": "script",
  "type": "持续适用",
  "scope": "global",
  "title": "Git 写操作必须用户当面点名",
  "when": { "field": "command", "op": "nonEmpty", "label": "命令执行" },
  "assert": [
    {
      "label": "Git 写操作",
      "op": "notForbiddenCommand",
      "field": "command",
      "probe": { "kind": "manual" },
      "allow": ["git status", "git log", "git diff", "git show", "git branch", "git remote -v"],
      "forbid": ["git commit", "git push", "git pull", "git merge", "git rebase", "git reset", "git revert", "git cherry-pick", "git checkout", "git restore", "git clean", "git stash", "git tag", "git add", "git config", "git remote"],
      "conflict": "longestAllowWins",
      "unless": { "field": "userNamed", "op": "eq", "value": true, "label": "用户点名" }
    }
  ],
  "residual": { "who": "reviewer-audit", "sample": 3, "fields": ["userNamed"], "objectivePath": "「当面点名」由对话原文可查后压回机判" },
  "landing": "command-record"
}
```

- [x] **步骤 3：补 `no-unverified-number.json`**

```json
{
  "id": "no-unverified-number",
  "impl": "script",
  "type": "条件触发",
  "scope": "global",
  "title": "项目统计数字必须附取数命令",
  "when": { "field": "hasStatistic", "op": "eq", "value": true, "label": "含统计数字" },
  "assert": [
    { "label": "取数命令", "field": "command", "op": "nonEmpty", "probe": { "kind": "manual" } },
    { "label": "命令形态", "field": "command", "op": "containsAny", "values": ["node ", "Get-ChildItem", "grep", "rg "], "probe": { "kind": "manual" } }
  ],
  "residual": { "who": "reviewer-audit", "sample": 3, "fields": ["command"], "objectivePath": "取数命令格式可枚举化后压回机判" },
  "landing": "answer"
}
```

- [x] **步骤 4：补 `observable-criteria.json`（probe 迁移）**

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
  "residual": { "who": "reviewer-audit", "sample": 3, "fields": ["checkObservableExit"], "objectivePath": "已是脚本判定，无残余；词表扩充由 tools/quality/observable-terms.json 单一维护" },
  "refs": ["skills/carrier-conventions/references/observable.md"],
  "landing": "check-observable 输出"
}
```

- [x] **步骤 5：确认旧样例语义未变**

```powershell
git diff --stat -- tools/quality/criteria-engine/import-guard.testcase.json tools/quality/criteria-engine/no-git-write.testcase.json tools/quality/criteria-engine/no-unverified-number.testcase.json tools/quality/criteria-engine/observable-criteria.testcase.json
```

期望：输出为空（4 份 testcase 字节不变）。

- [x] **步骤 6：跑构建，确认只剩 evidence 红**

```powershell
node tools\quality\criteria-engine\build.mjs
```

期望：`import-guard` / `no-git-write` / `no-unverified-number` / `observable-criteria` 均输出 `N 条样例已判`；只剩 `evidence-before-conclusion.json` 报缺字段 / `RuleWithoutProbe` / 缺 testcase 字段名不匹配。这是任务 4 的输入。

---

## 任务 4：evidence 重写 + 13 条样例 + 重新渲染（绿点 A）

**文件**
- 修改：`tools/quality/criteria-engine/evidence-before-conclusion.json`（整体覆盖为 spec §7.3 `:409-446`）
- 修改：`tools/quality/criteria-engine/evidence-before-conclusion.testcase.json`（13 条重写）
- 生成：`tools/quality/criteria-engine/evidence-before-conclusion.md` / `.inject.md`
- 生成：`rules/evidence-before-conclusion.md`

**接口**：消费任务 1 的 `anyOf` / `unless` / `manual`；产出 H-06b 要求的 13/13。

- [x] **步骤 1：覆盖 json**

把 `evidence-before-conclusion.json` 整体替换为 spec §7.3 的完整 json（`:409-446`）。字段顺序、字段名逐字照抄，尤其：

- 锚三选一用 `anyOf`：`anchorPathLine` / `anchorCommandOutput` / `anchorReference`；
- 原适用范围字段改名 `applicability`；
- `missReport` 的例外是 `lookupHit eq true`；
- 删除 `source` / `chain` / `boundary` / `isCompoundDerivation`。

- [x] **步骤 2：重写 13 条 testcase**

按下面 13 条逐条写入，字段名必须与 json 完全一致：

| # | 输入 | expect | 覆盖 |
|---|---|---|---|
| 1 | `claimsEvidence:true`，`anchorPathLine:"docs/a.md:12"`，`applicability:"适用于本仓"`，`target:"要不要拆"`，`hasNumbers:false`，`lookupHit:true` | pass | path:line 形态 |
| 2 | `claimsEvidence:true`，`anchorCommandOutput:"npm run check → exit 0"`，其余同 1 | pass | 命令 + 输出首行 |
| 3 | `claimsEvidence:true`，`anchorReference:"skills/x/SKILL.md"`，其余同 1 | pass | 引用件路径 |
| 4 | `claimsEvidence:true`，`anchorPathLine:"我记得是这样"`、`anchorCommandOutput:""`、`anchorReference:""`，其余同 1 | fail | 无有效锚（形态非法；空串同判 fail，兼覆盖三锚全空） |
| 5 | `claimsEvidence:true`，锚同 1，`applicability:""` | fail | 范围空 |
| 6 | `claimsEvidence:true`，锚同 1，`target:""` | fail | 目标空 |
| 7 | `claimsEvidence:true`，锚同 1，`hasNumbers:true`，`numbersCommand:""` | fail | 有数字无命令 |
| 8 | `claimsEvidence:true`，锚同 1，`hasNumbers:true`，`numbersCommand:"node -e ..."` | pass | 有数字有命令 |
| 9 | `claimsEvidence:true`，锚同 1，`hasNumbers:false` | pass | 无数字豁免 |
| 10 | `claimsEvidence:true`，锚同 1，`lookupHit:false`，`missReport:""` | fail | 查不到无记录 |
| 11 | `claimsEvidence:true`，锚同 1，`lookupHit:false`，`missReport:"查了 a.md:12，exit 1，首行 X"` | pass | 查不到有记录 |
| 12 | `claimsEvidence:true`，锚同 1，`lookupHit:true`，`missReport:""` | pass | 查得免记录 |
| 13 | `claimsEvidence:false` | pass | 不触发 |

> 旧样例 10–12 的 `source` / `chain` / `boundary` 三例随字段删除而退出；其「复杂推导」语义按 spec §7.3 归 `assertion-quality`，不在本判据内。新模型用三个类型化锚字段表达形态，且每个 `anyOf` 分支带形态算子（`anchorPathLine` 须含 `:行号`，`anchorCommandOutput` 须含 `exit` / `退出码` / `→`，`anchorReference` 须含路径分隔符），故「锚形态非法」保留为第 4 条反例；空串天然不匹配同一分支，三锚全空由同一语义覆盖。

- [x] **步骤 3：构建并重渲染**

```powershell
node tools\quality\criteria-engine\build.mjs
```

期望：

```
evidence-before-conclusion: 13 条样例已判（测试在 evidence-before-conclusion.testcase.json）
...
解释器 3 个（md / inject / rule），样例 34 条，错误 0 条
rule 正文投影 1 份（rules/<id>.md）
rule-dsl ok
```

- [x] **步骤 4：核渲染逐字**

```powershell
Get-Content rules\evidence-before-conclusion.md -Raw
```

期望：与 spec §7.3 的渲染逐字一致（`:451-465`），全文无「来源」，含 `（以下任一：` 与两处 `（例外：`。

- [x] **步骤 5：核旧字段名已清**

```powershell
Select-String -Path tools\quality\criteria-engine\evidence-before-conclusion.testcase.json -Pattern 'lookupReport|isCompoundDerivation' -SimpleMatch
```

期望：无输出（退出码 1）。

- [x] **步骤 6：全量门禁 + 预算**

```powershell
node scripts\check-criteria-engine.mjs
node scripts\rule-audit-lite.mjs
```

期望：前者首行 `判据 5 条 / 绿 34 / 红 0`、末行 `criteria-engine ok`；后者末行 `rule-audit-lite ok`。

- [x] **步骤 6b：docgen 渲染物基线**

`rules/<id>.md` 同时是 docgen 的渲染物（`tools/docgen/components/renderedAssets.mjs` 调 `rules.mjs` 的 `renderRule`），两个消费面必须同一份字节：

```powershell
node tools\docgen\cli.mjs gate
```

期望：exit 0。若报 `Mismatch: .*evidence-before-conclusion\.md`，按基线重生成：

```powershell
node tools\docgen\cli.mjs generate --kind rule --name evidence-before-conclusion --apply
node tools\docgen\cli.mjs gate
```

再跑渲染物回归：

```powershell
node --test tools\docgen\test\rule-render.test.mjs
```

期望：全部 pass。

- [x] **步骤 7：提交（绿点 A）**

```powershell
git add tools/quality/criteria-engine/schema.mjs tools/quality/criteria-engine/interpreters.mjs tools/quality/criteria-engine/build.mjs tools/quality/criteria-engine/*.json tools/quality/criteria-engine/*.md scripts/check-criteria-engine.mjs scripts/rule-audit-lite.mjs rules/evidence-before-conclusion.md
git commit -m "feat(criteria-engine): 补齐 rule DSL 逻辑组合、算子与判定动作"
```

期望：提交后 `git status` 干净（不含计划文件时）。

---

## 任务 5：anchor-forms + pilot 同步（绿点 B）

**文件**
- 新增：`tools/quality/criteria-engine/anchor-forms.json` + `.testcase.json`
- 修改：`tools/quality/criteria-engine/rules.json`（登记 `anchor-forms`，使其产出 `rules/anchor-forms.md`，K-03 需要该文件）
- 新增：`docs/prd/20261105182104-rule-refactor/rule-dsl/anchor-forms.json` + `.testcase.json`
- 修改：pilot `schema.mjs` / `interpreters.mjs` / `build.mjs`（同步引擎实现）
- 修改：pilot 3 份 json（补 `scope` / `label` / `name` / `probe`）
- 不改：pilot 3 份旧 `.testcase.json`（字节不变）

**接口**：消费任务 1~4 的引擎；产出 V-2b-1 的 22 条口径与现仓 38 条口径。

- [x] **步骤 1：新增现仓 `anchor-forms`**

json 逐字照抄 spec §7.4（`:471-498`）；testcase 按 spec §7.4 的 4 行（`:500-507`）落成：

```json
{
  "rule": "anchor-forms",
  "cases": [
    { "input": { "writesConclusion": true, "anchorCommandOutput": "npm run check → exit 0", "anchorText": "有锚" }, "expect": "pass" },
    { "input": { "writesConclusion": true, "anchorPathLine": "", "anchorCommandOutput": "", "anchorReference": "", "anchorText": "有锚" }, "expect": "fail" },
    { "input": { "writesConclusion": true, "anchorReference": "skills/x/SKILL.md", "anchorText": "见上文" }, "expect": "fail" },
    { "input": { "writesConclusion": false, "anchorText": "" }, "expect": "pass" }
  ]
}
```

- [x] **步骤 2：跑现仓构建**

```powershell
node tools\quality\criteria-engine\build.mjs
```

期望：`anchor-forms: 4 条样例已判`；样例总数 `38`；末行 `rule-dsl ok`；同时生成 `rules/anchor-forms.md`（`rules.json` 已登记，K-03 依赖该文件）。

> 新增登记后 `RENDERED_RULES` 变为 2 条（`RENDERED_RULES = listRuleIds()`），docgen 基线需同步：`node tools\docgen\cli.mjs generate --kind rule --name anchor-forms --apply`，再 `node tools\docgen\cli.mjs gate`。

- [x] **步骤 3：同步 pilot 引擎**

```powershell
Copy-Item tools\quality\criteria-engine\schema.mjs docs\prd\20261105182104-rule-refactor\rule-dsl\schema.mjs -Force
Copy-Item tools\quality\criteria-engine\interpreters.mjs docs\prd\20261105182104-rule-refactor\rule-dsl\interpreters.mjs -Force
```

再改 pilot `build.mjs`：`check` 调用改为结构化适配（同任务 1 步骤 6）；解释器写盘循环加 `if (!it.ext) continue`。

- [x] **步骤 4：补 pilot 3 份 json**

按任务 3 同样的方式补 `scope:"global"`、`when.label`、`assert[i].label`、`assert[i].probe`（3 份都是 `manual`，`no-git-write` 的 `unless` 补 `label:"用户点名"`）。**判据语义与样例输入不得改**。

- [x] **步骤 5：pilot 复制 anchor-forms**

```powershell
Copy-Item tools\quality\criteria-engine\anchor-forms.json docs\prd\20261105182104-rule-refactor\rule-dsl\ -Force
Copy-Item tools\quality\criteria-engine\anchor-forms.testcase.json docs\prd\20261105182104-rule-refactor\rule-dsl\ -Force
```

- [x] **步骤 6：核 pilot 旧样例字节不变**

```powershell
git diff --stat -- docs/prd/20261105182104-rule-refactor/rule-dsl/import-guard.testcase.json docs/prd/20261105182104-rule-refactor/rule-dsl/no-git-write.testcase.json docs/prd/20261105182104-rule-refactor/rule-dsl/no-unverified-number.testcase.json
```

期望：输出为空。

- [x] **步骤 7：跑 pilot 构建**

```powershell
node docs\prd\20261105182104-rule-refactor\rule-dsl\build.mjs
```

期望：4 条判据各输出样例数（3 旧 = 18 条，新 = 4 条），总计 `样例 22 条，错误 0 条`，末行 `rule-dsl ok`。

- [x] **步骤 8：跑 pilot 门禁 + 预算**

```powershell
node scripts\check-criteria-engine.mjs --root docs\prd\20261105182104-rule-refactor\rule-dsl
```

期望：`rules/` 下只有 anchor-forms 时 exit 0；若 pilot 无 `rules/` 目录，先在 pilot 建 `rules/` 并写入 `anchor-forms.md`。逐条核 K-03：`anchor-forms.md` 非空白字符在 100–500。

- [x] **步骤 9：提交（绿点 B）**

```powershell
git add tools/quality/criteria-engine/anchor-forms.json tools/quality/criteria-engine/anchor-forms.testcase.json tools/quality/criteria-engine/*.md docs/prd/20261105182104-rule-refactor/rule-dsl/
git commit -m "test(criteria-engine): 新增 anchor-forms 判据并同步 pilot"
```

---

## 任务 6：文档与写入侧（绿点 C）

**文件**
- 修改：`tools/quality/criteria-engine/README.md` §六
- 新增：`skills/rule-writer/references/criteria-dsl.md`
- 修改：`skills/rule-writer/SKILL.md:33-36`（加一行指针）

**接口**：无代码接口；产物是 `rule-writer` 的判据引擎分支说明与细则。

- [x] **步骤 1：README §六追加三条裁定**

逐条追加（标题逐字）：

```
逻辑关系显式建模（anyOf / allOf / oneOf / not；同级不混用，只能嵌套）
label 只命名（名词短语；连接词由结构树产出，谓词由算子产出）
判定动作与记录落点分离（probe 回答「怎么取」，landing 回答「记在哪」）
```

- [x] **步骤 2：写 `references/criteria-dsl.md`**

必含八节，标题逐字：`字段表`、`条件语法`、`label`、`算子表`、`probe`、`渲染`、`校验闸`、`验收命令`。内容来源是 spec §2~§8 的操作版；不复制 spec 全文，只给可执行规则与两个验收命令：

```powershell
node tools\quality\criteria-engine\build.mjs
node scripts\check-criteria-engine.mjs
```

- [x] **步骤 3：SKILL.md 加指针**

在 `## 判据与写作指引去哪读` 的列表末尾加一行：

```
- 判据引擎 rule（`<id>.json` + `<id>.testcase.json`）的字段、算子、probe、渲染与校验闸：`references/criteria-dsl.md`
```

- [x] **步骤 4：全量验收**

```powershell
node tools\quality\criteria-engine\build.mjs
node scripts\check-criteria-engine.mjs
node scripts\rule-audit-lite.mjs
node docs\prd\20261105182104-rule-refactor\rule-dsl\build.mjs
```

期望：全部 exit 0；现仓 `判据 6 条 / 绿 38 / 红 0`；pilot `样例 22 条，错误 0 条`。

- [x] **步骤 5：出品核对（J-01 / J-02 / J-03）**

```powershell
Get-ChildItem -Path "$HOME\.trae-cn","$HOME\.aas" -Recurse -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -in @('evidence-before-conclusion.json','evidence-before-conclusion.testcase.json','import-guard.json','import-guard.testcase.json','no-git-write.json','no-git-write.testcase.json','no-unverified-number.json','no-unverified-number.testcase.json','observable-criteria.json','observable-criteria.testcase.json','anchor-forms.json','anchor-forms.testcase.json','rules.json') -and $_.Name -ne 'installed.json' } |
  Measure-Object | Select-Object -ExpandProperty Count
```

期望：`0`。

```powershell
Test-Path "$HOME\.trae-cn\skills\rule-writer"
```

期望：`False`（若为 `True` 且指向本仓活链，按 J-03 记 fail）。

- [x] **步骤 6：提交（绿点 C）**

```powershell
git add tools/quality/criteria-engine/README.md skills/rule-writer/SKILL.md skills/rule-writer/references/criteria-dsl.md
git commit -m "docs(rule-writer): 增加判据引擎 rule 分支与 DSL 细则"
```

---

## 自检（写完计划后已执行）

- **spec 覆盖**：§2→任务 1/3/4；§3→任务 1/5；§4→任务 1/2/4；§5→任务 2；§6→任务 4/6；§7→任务 4/5；§8→任务 2。无遗漏。
- **未决项**：V-2b-11（发布侧 scope 过滤）与 F-16（逐字节样例）保持 BLOCKED，不在本计划内施工。
- **类型一致性**：`check(rule, file, out)` 的 `{code,message}` 契约在任务 1 定义，任务 1/2/5 三处调用一致；`renderObligation(node,index)` 与 `renderTrigger(rule)` 在任务 1 定义并由任务 2/5 消费。
- **红灯纪律**：任务 1–3 中间态不提交；绿点 A/B/C 对应任务 4/5/6 的提交步骤。
