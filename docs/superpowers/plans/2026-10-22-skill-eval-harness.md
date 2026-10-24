# Skill 行为评测工装（skill-up 本地化）实施计划

> **⚠️ 2026-10-24 已停用：本功能已整体删除，本计划仅作历史记录，勿执行。** 下文步骤仍要求 `Create evals/…`、补 `eval:review-triage` script 等，这些对象已不存在；勾选框状态已无意义。停用理由、保留的校准值与恢复判据见 `docs/after/20261024154827-skill-eval-harness-parking.md`。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在仓库内落地一套「装技能 vs 不装技能」的技能行为评测工装：`evals/review-triage/` 两条用例、离线契约脚本、runner，全部零第三方依赖、不进 `npm run check`。

**Architecture:** 三层判据（L1 稳定性 / L2 断言可达性 / L3 差值）+ 三层闸门（启动前 ①–⑨ / 运行期汇总 / 验收）。判据数值单源在 `expected.md` 的机读块；runner 只做参数拼装、稳定性汇总与退出码，断言判分仍由外部 skill-up 完成。A1 离线契约脚本做「改判据必重跑」的快照闸门。

**Tech Stack:** Node ≥22（ESM、`node:test`、`node:assert/strict`）、PowerShell 5.1（Win 环境命令）、外部可选二进制 `skill-up`。

**Spec:** `docs/superpowers/specs/2026-10-21-skill-eval-harness-design.md`（已定稿，第 9 轮通过）
**Testcase:** `docs/superpowers/specs/2026-10-21-skill-eval-harness-design-testcase.md`（79 条，与本计划配套）

## Global Constraints

以下每条都是 spec 原文的硬约束，逐字生效；每个任务都隐含包含：

1. 不执行任何 git 写操作；改动留工作区，提交方式由用户决定。**例外**：`$env:TEMP` 下 fixture 的 `git init/add/apply`（必要时 `commit`）、runner 运行期在 `.session/eval/fixture/**` 内的 `git init/add/commit` —— 后者需用户确认后才执行。
2. 不改 `skills/` 下任何技能正文；用例不通过时先怀疑用例（spec §6-1）。
3. 不改 `scripts/check-all.mjs`；不把评测挂进 `npm run check`（spec §6-2）。
4. 不改 `tools/`；不把 skill-up 作为仓库运行依赖（spec §6-3）。
5. `evals/` 下不得出现 `*.test.mjs`（spec §6-8）。
6. A1 脚本不加 npm script、不引第三方依赖（spec §6-13）。
7. `oracle` 必须手写，不得由模型输出摘录、不得由试跑产出（spec §6-11）。
8. 断言词一律写 `expect`；`judge` 的关键词必须是 `expect` 的子集（spec §6-12）。
9. 路径基准单一：`cases.files` / `oracle` / `repo_fixture` / `apply_diff` 相对**技能根目录**（`skills/<技能名>/`）；`skills[].path` 相对**仓库根**，由 runner 解析成绝对值注入；`repoRoot = <eval.yaml 所在目录>/../..`，且 `<eval.yaml 所在目录>/..` 末级必须是 `evals`（spec §3.2.1）。
10. 结论必须带五要素边界（配置模型 / 引擎版本 / 真实后端未验证 / 覆盖范围 / 检出上限），dry-run 下引擎版本写 `n/a（dry-run 未执行工具）`（spec §3.3-7）。
11. 阈值取自 `expected.md` 机读块，不写死在其他地方（spec §3.2.2 示例：`with_skill.min_rate=1.0 / max_rate=1.0`、`without_skill.min_rate=0.0 / max_rate=0.0`、`delta.min=1.0`、`iteration_min=2`）。
12. 每条用例的 `expect.must_contain` 写死：01 = `["可直接提交","git diff","notes/plan.md"]`；02 = `["必须 review","机器判不了"]`（spec §4 步骤 1）。

## 文件结构（先定职责，再拆任务）

| 文件 | 职责 | 谁写 |
|---|---|---|
| `evals/review-triage/eval.yaml` | 工具入口配置（§3.2 固定值） | Task 1 |
| `evals/review-triage/cases/01-checkbox-mechanical.yaml` | 用例 01（probe，fixture 实跑） | Task 1 |
| `evals/review-triage/cases/02-command-swap-semantic.yaml` | 用例 02（gate，语义转移） | Task 1 |
| `evals/review-triage/fixtures/repos/checkbox-demo/notes/plan.md` | fixture 源目录（纯文件、不带 `.git`） | Task 1 |
| `evals/review-triage/fixtures/diffs/checkbox.patch` | 把 `[ ]` 翻成 `[x]` 的补丁 | Task 1 |
| `evals/review-triage/fixtures/oracle/*.md` | 两份手写标准答案（L2 唯一输入） | Task 2 |
| `evals/review-triage/fixtures/responses/**` | 7 份固化历史样本（只作人读证据） | Task 2 |
| `evals/review-triage/expected.md` | 机读块（阈值单源）+ 冒烟口径声明 + 人工核对区 | Task 3 |
| `evals/review-triage/frozen-ledger.json` | 冻结留痕（本轮为空对象 `{}`） | Task 3 |
| `scripts/eval-contract-core.mjs` | A1 的纯函数库（解析 / 白名单 / 哈希） | Task 4 |
| `scripts/check-eval-contract.mjs` | A1 CLI：核对 + 写 `CONTRACT.json` | Task 4 |
| `scripts/check-eval-contract.test.mjs` | A1 的单测 | Task 4 |
| `scripts/run-eval-core.mjs` | runner 纯函数（三态 / flaky / 率 / 取码 / 机读块） | Task 5 |
| `scripts/run-eval-core.test.mjs` | runner 纯函数单测 | Task 5 |
| `scripts/run-eval.mjs` | runner CLI（前置 ①–⑨ / 注入 / spawn / 汇总 / verdict.md） | Task 6 |
| `evals/review-triage/fixtures/RECORD.md` | 自查与取证记录（进 git） | Task 7 |
| `package.json` | 仅新增一条 `eval:review-triage` script | Task 6 |

---

### Task 1: 用例目录、两条用例与 fixture 源

**Files:**
- Create: `evals/review-triage/eval.yaml`
- Create: `evals/review-triage/cases/01-checkbox-mechanical.yaml`
- Create: `evals/review-triage/cases/02-command-swap-semantic.yaml`
- Create: `evals/review-triage/fixtures/repos/checkbox-demo/notes/plan.md`
- Create: `evals/review-triage/fixtures/diffs/checkbox.patch`

**Interfaces:**
- Produces: `eval.yaml` 的 `cases.files` 指向 `../../evals/review-triage/cases/<id>.yaml`；用例 01 的 `context.repo_fixture` = `../../.session/eval/fixture/review-triage/checkbox-demo`；`context.git.apply_diff` = `../../evals/review-triage/fixtures/diffs/checkbox.patch`（Task 4/5/6 依赖这些字面值）。

- [ ] **Step 1: 建目录并写 fixture 源文件**

```powershell
New-Item -ItemType Directory -Force evals/review-triage/cases, evals/review-triage/fixtures/repos/checkbox-demo/notes, evals/review-triage/fixtures/diffs | Out-Null
```

`evals/review-triage/fixtures/repos/checkbox-demo/notes/plan.md` 内容（**必须无 BOM、LF 换行、表格列数一致**，因为它会被 markdown 检查扫到）：

```markdown
# 实施计划

| # | 任务 | 状态 |
|---|---|---|
| 1 | 建评测目录 | [ ] |
| 2 | 写用例 | [ ] |
```

- [ ] **Step 2: 生成补丁**

```powershell
$repo = Join-Path $env:TEMP 'patch-gen'
Remove-Item -Recurse -Force $repo -ErrorAction SilentlyContinue
Copy-Item -Recurse evals/review-triage/fixtures/repos/checkbox-demo $repo
git -C $repo init -q
git -C $repo add -A
git -C $repo -c user.email=a@b -c user.name=c commit -qm baseline
$p = Join-Path $repo 'notes/plan.md'
(Get-Content $p -Raw) -replace '\| 1 \| 建评测目录 \| \[ \] \|','| 1 | 建评测目录 | [x] |' | Set-Content $p -NoNewline
git -C $repo diff > evals/review-triage/fixtures/diffs/checkbox.patch
Remove-Item -Recurse -Force $repo
Get-Content evals/review-triage/fixtures/diffs/checkbox.patch
```

Expected：补丁里出现 `-| 1 | 建评测目录 | [ ] |` 与 `+| 1 | 建评测目录 | [x] |` 两行。若为空 = 替换没命中，检查 `plan.md` 的字面值是否与正则逐字一致。

- [ ] **Step 3: 写 `eval.yaml`**

```yaml
schema_version: v1alpha1
name: review-triage
description: review-triage 技能的装/不装行为对比

environment:
  type: none

skills:
  - source: local_path
    path: skills/review-triage

engine:
  name: claude_code
  model:
    provider: "{provider}"
    name: "{name}"

cases:
  files:
    - ../../evals/review-triage/cases/01-checkbox-mechanical.yaml
    - ../../evals/review-triage/cases/02-command-swap-semantic.yaml
  defaults:
    timeout_seconds: 240
    max_turns: 8

benchmark:
  enabled: true

report:
  formats:
    - json
    - html
```

- [ ] **Step 4: 写用例 01**

```yaml
id: 01-checkbox-mechanical
title: 纯勾选改动应判为可直接提交
description: 工作区里有一处未提交改动，只把一个待办勾选框从空格改成 x；不粘贴 diff，须自行实跑核对

input:
  prompt: |
    提交前请对工作区里尚未提交的改动做分流（只分流，不要审查内容）。

    要求：只输出有内容的分档，空的分档不要写出来。

expect:
  must_contain:
    - "可直接提交"
    - "git diff"
    - "notes/plan.md"
  must_not_contain:
    - "纯文档"
    - "低风险"
    - "不涉及代码"
    - "不影响代码"

judge:
  type: rule_based
  success:
    - output_contains:
        all:
          - "可直接提交"
          - "git diff"
          - "notes/plan.md"

context:
  repo_fixture: ../../.session/eval/fixture/review-triage/checkbox-demo
  git:
    init: true
    apply_diff: ../../evals/review-triage/fixtures/diffs/checkbox.patch
```

- [ ] **Step 5: 写用例 02**

```yaml
id: 02-command-swap-semantic
title: 执行动作替换应判为必须 review
description: 把执行动作从一个脚本名换到另一个脚本名，语义未变但判据可能失效

input:
  prompt: |
    提交前请对工作区里尚未提交的改动做分流（只分流，不要审查内容）。

    要求：只输出有内容的分档，空的分档不要写出来。

expect:
  must_contain:
    - "必须 review"
    - "机器判不了"
  must_not_contain:
    - "纯文档"
    - "低风险"
    - "不涉及代码"
    - "不影响代码"

judge:
  type: rule_based
  success:
    - output_contains:
        all:
          - "必须 review"
          - "机器判不了"
```

- [ ] **Step 6: 自检两条用例的结构**

```powershell
Select-String -Path evals/review-triage/cases/*.yaml -Pattern '^\s*-\s+"' | Measure-Object | Select-Object -ExpandProperty Count
Select-String -Path evals/review-triage/cases/*.yaml -Pattern '\[.+,.*\]' 
```

Expected：第一条输出 ≥ 12（块列表逐项一行）；第二条**无输出**（不得出现行内数组——写成 `[a, b]` 会让 L2 抽取失败、判码 4）。

---

### Task 2: 手写 oracle 与固化样本

**Files:**
- Create: `evals/review-triage/fixtures/oracle/01-checkbox-mechanical.md`
- Create: `evals/review-triage/fixtures/oracle/02-command-swap-semantic.md`
- Create: `evals/review-triage/fixtures/responses/{01-with-skill.correct.md,01-with-skill.no-execution.md,01-with-skill.no-gitdiff-literal.md,01-without-skill.wrong.md,02-without-skill.run-verify.md}`
- Create: `evals/review-triage/fixtures/responses/flaky-evidence/{out3-iteration-1-benchmark.json,out3-iteration-2-benchmark.json}`

**Interfaces:**
- Produces: oracle 文本被 Task 4 的 ⑤⑥ 核对（`must_contain` 全命中、`must_not_contain` 全不命中、锚点 `notes/plan.md` 在 oracle 中 ≥1 命中）；`responses/` 只作人读证据与 A1 的「禁词反向留痕」材料。

- [ ] **Step 1: 写 oracle 01（手写，不许摘录模型输出）**

```markdown
## 可直接提交

- 改动文件：`notes/plan.md`
- 实跑证据：`git diff` 输出显示只有一行翻转（`-| 1 | 建评测目录 | [ ] |` → `+| 1 | 建评测目录 | [x] |`）
- 结论：纯勾选状态变更，无逻辑改动，可直接提交。
```

- [ ] **Step 2: 写 oracle 02**

```markdown
## 必须 review

- 改动把执行动作从 `npm run check` 换成了 `check:all`，属于命令语义迁移。
- 机器判不了：现有断言只校验输出文本，无法判断新命令是否等价。
- 结论：转人工 review，核对两个脚本的实际覆盖范围是否一致。
```

- [ ] **Step 3: 固化 5 份历史样本**

从 `.session/eval/trial/` 复制（该目录不进 git，复制后才是可审计材料）：

```powershell
$src = '.session/eval/trial'
$dst = 'evals/review-triage/fixtures/responses'
Get-ChildItem -Recurse $src -Include *.md | Select-Object -First 5 FullName
```

Expected：列出候选文件。按语义把 5 份分别落到上述 5 个文件名；**若 `.session/eval/trial/` 已被清理**（该目录不进 git），则不伪造——改为按文件名语义手写等价样本，并在 `RECORD.md`（Task 7）注明「原始样本已不可得，本文件为等价重写」。

- [ ] **Step 4: 固化 flaky 证据**

```powershell
New-Item -ItemType Directory -Force evals/review-triage/fixtures/responses/flaky-evidence | Out-Null
Copy-Item .session/eval/trial/out3/iteration-1/benchmark.json evals/review-triage/fixtures/responses/flaky-evidence/out3-iteration-1-benchmark.json
Copy-Item .session/eval/trial/out3/iteration-2/benchmark.json evals/review-triage/fixtures/responses/flaky-evidence/out3-iteration-2-benchmark.json
Select-String -Path evals/review-triage/fixtures/responses/flaky-evidence/*.json -Pattern '"passed"' | Measure-Object | Select-Object -ExpandProperty Count
```

Expected：两份文件都复制成功；`"passed"` 命中数 > 0（说明确是 `benchmark.json` 真身）。若源文件不存在，同样如实记录「不可得」，不得手工编造 `passed/total`。

---

### Task 3: `expected.md` 机读块与冻结账

**Files:**
- Create: `evals/review-triage/expected.md`
- Create: `evals/review-triage/frozen-ledger.json`

**Interfaces:**
- Produces: 机读块 JSON 被 Task 4 的 ①②③④ 与 Task 5 的阈值读取、Task 6 的 L3 对账使用；字段名与类型固定为 `schema / iteration_min / cases[].eval_name / cases[].role / cases[].origin / cases[].arms{if,without}.{min_rate,max_rate} / cases[].delta.min`。

- [ ] **Step 1: 写 `expected.md`（机读块 + 人读区）**

```markdown
# review-triage 预期值（试跑校准 · 冒烟口径）

> 口径声明：本轮数值为试跑校准（`origin: calibrated`），**首轮验收降级为冒烟/回归测试，不代表独立验证**。
> 阈值单源就是下面这个 JSON 块；其他任何地方不复述数值。

```json
{
  "schema": "eval-expectation/v2",
  "iteration_min": 2,
  "cases": [
    {
      "eval_name": "纯勾选改动应判为可直接提交",
      "role": "probe",
      "origin": "calibrated",
      "arms": null,
      "delta": null
    },
    {
      "eval_name": "执行动作替换应判为必须 review",
      "role": "gate",
      "origin": "calibrated",
      "arms": {
        "with_skill": { "min_rate": 1.0, "max_rate": 1.0 },
        "without_skill": { "min_rate": 0.0, "max_rate": 0.0 }
      },
      "delta": { "min": 1.0 }
    }
  ]
}
```

## 人工核对区

- [ ] oracle 01 满足 01 的 `expect` 全部词
- [ ] oracle 02 满足 02 的 `expect` 全部词
- [ ] 锚点 `notes/plan.md` 在 01 的 oracle 中命中、在 01 的 prompt 中 0 命中
- [ ] 禁词双向留痕见 `fixtures/RECORD.md`
```

- [ ] **Step 2: 建空的冻结账**

```powershell
[System.IO.File]::WriteAllText("$PWD/evals/review-triage/frozen-ledger.json", "{}", (New-Object System.Text.UTF8Encoding $false))
Get-Content evals/review-triage/frozen-ledger.json
```

Expected：输出 `{}`（本轮无 `frozen` 用例；一旦有 `origin: frozen`，必须按 spec §3.2.2③ 填六字段）。

- [ ] **Step 3: 校验 JSON 可解析**

```powershell
node -e "const fs=require('fs');const t=fs.readFileSync('evals/review-triage/expected.md','utf8');const m=t.match(/```json\n([\s\S]*?)```/);const b=JSON.parse(m[1]);console.log(b.schema,b.iteration_min,b.cases.map(c=>c.eval_name).join('|'))"
```

Expected：`eval-expectation/v2 2 纯勾选改动应判为可直接提交|执行动作替换应判为必须 review`

---

### Task 4: A1 离线契约脚本

**Files:**
- Create: `scripts/eval-contract-core.mjs`
- Create: `scripts/check-eval-contract.mjs`
- Create: `scripts/check-eval-contract.test.mjs`

**Interfaces:**
- Produces（Task 6 的 ⑧ 依赖）：`scripts/check-eval-contract.mjs` 退出码 `0`（全过）/ `4`（任一 FAIL）/ `2`（读不了文件），并写 `evals/<技能名>/fixtures/CONTRACT.json`，形状 `{ schema:"eval-contract/v1", checked_at:string, exit:0, files:{ "<仓库根相对正斜杠路径>": "<sha256 小写十六进制>" } }`，键覆盖六类：`eval.yaml`、`cases/**`、`expected.md`、`frozen-ledger.json`、`fixtures/oracle/**`、`fixtures/responses/**`。

- [ ] **Step 1: 写 `scripts/eval-contract-core.mjs` 的解析函数与单测骨架**

```js
// eval-contract-core.mjs —— A1 的纯函数库（零依赖）
// 只做「文本 → 结构」的确定性抽取，不读跑分、不产 verdict
import { createHash } from 'node:crypto'

// 抽 expected.md 里的 ```json 机读块
export function extractMachineBlock(text) {
  const m = text.match(/```json\r?\n([\s\S]*?)```/)
  if (!m) return { ok: false, error: '未找到 ```json 机读块' }
  try { return { ok: true, block: JSON.parse(m[1]) } }
  catch (e) { return { ok: false, error: `机读块不是合法 JSON：${e.message}` } }
}

// 抽块列表形态的字符串数组：给字段名，返回其后的 `  - "x"` 项
export function extractBlockList(text, field) {
  const lines = text.split(/\r?\n/)
  const start = lines.findIndex((l) => new RegExp(`^\\s*${field}:\\s*$`).test(l))
  if (start < 0) return { ok: false, error: `缺少块列表字段 ${field}` }
  const out = []
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (/^\S/.test(line) && line.trim() !== '') break      // 回到顶层 = 该字段结束
    if (/^\s*#/.test(line) || line.trim() === '') continue
    const m = line.match(/^\s*-\s+"([^"]*)"\s*$/)
    if (!m) return { ok: false, error: `${field} 出现非块列表行：${line.trim()}` }
    out.push(m[1])
  }
  if (out.length === 0) return { ok: false, error: `${field} 为空` }
  return { ok: true, items: out }
}

// 内联数组探测（必须报错：写成 [a, b] 会让 L2 抽取失败）
export function hasInlineArray(text, field) {
  return new RegExp(`^\\s*${field}:\\s*\\[.*\\]`, 'm').test(text)
}

// 取顶层标量（只支持 id/title 这类单行值）
export function extractScalar(text, field) {
  const m = text.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'))
  return m ? m[1].trim() : null
}

// 取 context 下的路径字面值
export function extractContextPaths(text) {
  const pick = (re) => { const m = text.match(re); return m ? m[1].trim() : null }
  return {
    repo_fixture: pick(/^\s*repo_fixture:\s*(.+)$/m),
    apply_diff: pick(/^\s*apply_diff:\s*(.+)$/m),
    hasContextGit: /^\s*git:\s*$/m.test(text),
  }
}

export function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex')
}

// canonical JSON：键名升序、无多余空白
export function canonicalJson(value) {
  const walk = (v) => {
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') {
      return Object.keys(v).sort().reduce((acc, k) => { acc[k] = walk(v[k]); return acc }, {})
    }
    return v
  }
  return JSON.stringify(walk(value))
}
```

- [ ] **Step 2: 写单测（先失败）**

```js
// scripts/check-eval-contract.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractMachineBlock, extractBlockList, hasInlineArray, canonicalJson } from './eval-contract-core.mjs'

const MD = '```json\n{"schema":"eval-expectation/v2"}\n```'
const YAML_BLOCK = 'expect:\n  must_contain:\n    - "可直接提交"\n  must_not_contain:\n    - "低风险"\n'

test('extractMachineBlock 抽得出 JSON', () => {
  const r = extractMachineBlock(MD)
  assert.equal(r.ok, true)
  assert.equal(r.block.schema, 'eval-expectation/v2')
})

test('extractMachineBlock 无块时报错', () => {
  assert.equal(extractMachineBlock('# 空的').ok, false)
})

test('extractBlockList 抽得出块列表', () => {
  const r = extractBlockList(YAML_BLOCK, 'must_contain')
  assert.deepEqual(r.items, ['可直接提交'])
})

test('extractBlockList 对行内数组报错', () => {
  assert.equal(hasInlineArray('must_contain: ["a", "b"]', 'must_contain'), true)
})

test('canonicalJson 键名升序', () => {
  assert.equal(canonicalJson({ b: 1, a: 2 }), '{"a":2,"b":1}')
})
```

- [ ] **Step 3: 跑测试确认失败**

```powershell
node --test scripts/check-eval-contract.test.mjs
```

Expected：`ERR_MODULE_NOT_FOUND` 或 `Cannot find module './eval-contract-core.mjs'`。

- [ ] **Step 4: 写 `scripts/check-eval-contract.mjs`（CLI + 全部核对项）**

核对项按 spec §3.2 / §3.2.1 / §3.2.2 / §3.4 落地，**逐项独立累积 findings**（不 early-return，便于一次看全）：

```js
// check-eval-contract.mjs —— A1 离线契约脚本
// 退出码：0 全过 / 4 任一 FAIL / 2 读不了文件
// 用法：node scripts/check-eval-contract.mjs [<技能名>] [--json] [--deep]
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs'
import { join, dirname, resolve, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractMachineBlock, extractBlockList, hasInlineArray, extractScalar, extractContextPaths, sha256, canonicalJson } from './eval-contract-core.mjs'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const skill = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'review-triage'
const evalYaml = resolve(scriptDir, '..', 'evals', skill, 'eval.yaml')
// repoRoot 一律由 eval.yaml 位置推导（spec §3.3-1 / §4 步骤 9），不得从脚本位置推
const evalDir = dirname(evalYaml)
const repoRoot = resolve(evalDir, '..', '..')
const findings = []
const fail = (id, msg) => findings.push({ id, msg })

// 读文件：失败也返回文本（空串），由调用方按结构检查兜住；同时记 IO finding
function read(p) {
  try { return readFileSync(p, 'utf8') } catch (e) { fail('IO', `读不到 ${p}：${e.message}`); return '' }
}

if (!existsSync(evalYaml)) { console.log(JSON.stringify({ exit: 2, findings: [{ id: 'IO', msg: `读不到 ${evalYaml}` }] })); process.exit(2) }
const evalsParent = evalDir.split(/[\\/]/).slice(-2, -1)[0]
if (evalsParent !== 'evals') fail('BASE-1', `<eval.yaml 所在目录>/.. 末级名为 ${evalsParent}，必须是 evals`)

const yaml = read(evalYaml)
const casesFiles = [...yaml.matchAll(/^\s*-\s+(\.\.\/\.\.\/evals\/[^\s]+\.yaml)\s*$/gm)].map((m) => m[1])
if (casesFiles.length === 0) fail('YAML-1', 'cases.files 未找到合法相对路径（必须 ../../evals/<技能>/cases/*.yaml）')

const titles = []
const caseTexts = []
for (const rel of casesFiles) {
  const abs = resolve(repoRoot, 'skills', skill, rel)
  if (!existsSync(abs)) { fail('PATH-1', `cases.files 解析后不存在：${rel} → ${abs}`); continue }
  const text = read(abs)
  caseTexts.push({ rel, abs, text })
  const title = extractScalar(text, 'title')
  if (!title) fail('CASE-1', `${rel} 缺 title`)
  else titles.push(title)
  if (hasInlineArray(text, 'must_contain') || hasInlineArray(text, 'must_not_contain')) {
    fail('CASE-2', `${rel} 的 expect 用了行内数组（必须块列表）`)
  }
}

// ② title 多重集唯一
const dup = titles.filter((t, i) => titles.indexOf(t) !== i)
if (dup.length) fail('CASE-3', `title 重名：${[...new Set(dup)].join(' / ')}`)

// ③ 机读块结构
const expectedPath = join(evalDir, 'expected.md')
if (!existsSync(expectedPath)) fail('EXP-1', 'expected.md 不存在')
const mb = extractMachineBlock(read(expectedPath))
if (!mb.ok) fail('EXP-2', mb.error)
const block = mb.block || {}
if (block.schema !== 'eval-expectation/v2') fail('EXP-3', `schema 必须是 eval-expectation/v2，实际 ${block.schema}`)
const minDup = [...new Set(titles)].filter((t) => !(block.cases || []).some((c) => c.eval_name === t))
const extra = (block.cases || []).filter((c) => !titles.includes(c.eval_name)).map((c) => c.eval_name)
if (minDup.length) fail('EXP-4', `机读块缺用例：${minDup.join(' / ')}`)
if (extra.length) fail('EXP-5', `机读块多出用例：${extra.join(' / ')}`)

for (const c of block.cases || []) {
  if (!['gate', 'probe'].includes(c.role)) fail('EXP-6', `${c.eval_name} 的 role 非法：${c.role}`)
  if (!['calibrated', 'frozen'].includes(c.origin)) fail('EXP-7', `${c.eval_name} 的 origin 非法：${c.origin}`)
  if (c.role === 'probe' && (c.arms !== null || c.delta !== null)) fail('EXP-8', `${c.eval_name} 是 probe，arms/delta 必须为 null`)
  if (c.role === 'gate') {
    const w = c.arms?.with_skill, wo = c.arms?.without_skill
    for (const [n, v] of [['with_skill', w], ['without_skill', wo]]) {
      if (!v) { fail('EXP-9', `${c.eval_name} 缺 arms.${n}`); continue }
      if (!(v.min_rate >= 0 && v.min_rate <= 1 && v.max_rate >= 0 && v.max_rate <= 1)) fail('EXP-10', `${c.eval_name} 的 ${n} 数值域越界`)
    }
    if (w && w.min_rate < 0.8) fail('EXP-11', `${c.eval_name} 的 with_skill.min_rate 必须 ≥ 0.8`)
    if (!(c.delta?.min > 0 && c.delta.min <= 1)) fail('EXP-12', `${c.eval_name} 缺合法 delta.min`)
  }
  if (c.origin === 'frozen') {
    const ledgerPath = join(evalDir, 'frozen-ledger.json')
    const ledger = existsSync(ledgerPath) ? JSON.parse(read(ledgerPath)) : {}
    const rec = ledger[c.eval_name]
    if (!rec) fail('FROZEN-1', `${c.eval_name} 是 frozen 但 ledger 无记录`)
    else {
      for (const k of ['frozen_since', 'verified_at', 'arms_snapshot', 'delta_at_verify', 'assert_hash', 'verified_snapshot']) {
        if (!(k in rec)) fail('FROZEN-2', `${c.eval_name} 的 ledger 缺字段 ${k}`)
      }
      if (rec.verified_at && !rec.verified_at.includes(`fixtures/calibration/`)) {
        fail('FROZEN-3', `${c.eval_name} 的 verified_at 未指向进 git 的 fixtures/calibration/：${rec.verified_at}`)
      }
      if (rec.arms_snapshot && canonicalJson(rec.arms_snapshot) !== canonicalJson(c.arms)) {
        fail('FROZEN-4', `${c.eval_name} 的 arms_snapshot 与当前 arms 不一致（需重新校准）`)
      }
    }
  }
}

// ④ 键白名单 + judge ⊆ expect
for (const { rel, text } of caseTexts) {
  for (const banned of ['exit_code', 'files_exist', 'files_not_exist', 'file_contains', 'golden_file', 'tool_called', 'output_matches']) {
    if (new RegExp(`^\\s*${banned}:`, 'm').test(text)) fail('KEYS-1', `${rel} 使用了本轮禁止的键 ${banned}`)
  }
  if (/^\s*output_contains:[\s\S]{0,80}?\n\s+not:/m.test(text)) fail('KEYS-2', `${rel} 使用了 output_contains.not（本轮禁止）`)
  if (/^cases:[\s\S]*?^\s+defaults:/m.test(yaml) && /^\s+expect:/m.test(yaml)) fail('KEYS-3', 'eval.yaml 不得使用 cases.defaults.expect')
  const mc = extractBlockList(text, 'must_contain')
  const mn = extractBlockList(text, 'must_not_contain')
  if (!mc.ok) fail('KEYS-4', `${rel}：${mc.error}`)
  if (!mn.ok) fail('KEYS-5', `${rel}：${mn.error}`)
  const allowed = new Set([...(mc.items || []), ...(mn.items || [])])
  for (const field of ['all', 'any']) {
    for (const m of text.matchAll(new RegExp(`^\\s+${field}:\\s*\\n((?:\\s+-\\s+"[^"]*"\\s*\\n)+)`, 'gm'))) {
      for (const w of [...m[1].matchAll(/"([^"]*)"/g)].map((x) => x[1])) {
        if (!allowed.has(w)) fail('KEYS-6', `${rel} 的 judge.${field} 含 expect 未声明的词「${w}」`)
      }
    }
  }
}

// ⑤⑥ oracle 与锚点
for (const { rel, text } of caseTexts) {
  const id = extractScalar(text, 'id')
  const oraclePath = join(evalDir, 'fixtures', 'oracle', `${id}.md`)
  if (!existsSync(oraclePath)) { fail('ORACLE-1', `缺 oracle：fixtures/oracle/${id}.md`); continue }
  const oracle = read(oraclePath)
  for (const w of extractBlockList(text, 'must_contain').items || []) {
    if (!oracle.includes(w)) fail('ORACLE-2', `${id} 的 oracle 未命中 must_contain「${w}」`)
  }
  for (const w of extractBlockList(text, 'must_not_contain').items || []) {
    if (oracle.includes(w)) fail('ORACLE-3', `${id} 的 oracle 命中了禁用词「${w}」`)
  }
  const { repo_fixture, apply_diff, hasContextGit } = extractContextPaths(text)
  if (apply_diff && !hasContextGit) fail('FIX-1', `${id} 的 apply_diff 未写在 context.git 下`)
  if (repo_fixture) {
    const base = repo_fixture.split('/').pop()
    if (!existsSync(join(evalDir, 'fixtures', 'repos', base))) fail('FIX-2', `${id} 的 repo_fixture basename 无对应源目录：fixtures/repos/${base}`)
    if (!repo_fixture.includes('.session/eval/fixture/')) fail('FIX-3', `${id} 的 repo_fixture 未指向物化路径`)
  }
  if (apply_diff) {
    const patchAbs = resolve(repoRoot, 'skills', skill, apply_diff)
    if (!existsSync(patchAbs)) fail('FIX-4', `${id} 的 apply_diff 不存在：${apply_diff}`)
  }
}

// ⑦ 六类文件哈希快照
const classes = [
  [join(evalDir, 'eval.yaml'), 'eval.yaml'],
  [join(evalDir, 'expected.md'), 'expected.md'],
  [join(evalDir, 'frozen-ledger.json'), 'frozen-ledger.json'],
]
for (const [abs, label] of classes) {
  if (!existsSync(abs)) fail('SNAP-1', `快照缺文件：${label}`)
}
function walk(dir, ext, out = []) {
  if (!existsSync(dir)) return out
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, ext, out)
    else if (e.name.endsWith(ext)) out.push(p)
  }
  return out
}
const snapshotTargets = [
  ...classes.map(([abs]) => abs),
  ...walk(join(evalDir, 'cases'), '.yaml'),
  ...walk(join(evalDir, 'fixtures', 'oracle'), '.md'),
  ...walk(join(evalDir, 'fixtures', 'responses'), '.md'),
  ...walk(join(evalDir, 'fixtures', 'responses', 'flaky-evidence'), '.json'),
]

const files = {}
for (const abs of snapshotTargets) {
  if (!existsSync(abs)) continue
  const relPath = relative(repoRoot, abs).split(sep).join('/')
  if (relPath.includes('..') || /^[A-Za-z]:/.test(relPath)) { fail('SNAP-2', `快照键非法：${relPath}`); continue }
  files[relPath] = sha256(readFileSync(abs))
}

const exit = findings.length === 0 ? 0 : 4
const contract = { schema: 'eval-contract/v1', checked_at: new Date().toISOString(), exit, files: exit === 0 ? files : {} }
writeFileSync(join(evalDir, 'fixtures', 'CONTRACT.json'), JSON.stringify(contract, null, 2) + '\n', 'utf8')

if (process.argv.includes('--json')) console.log(JSON.stringify({ exit, findings }, null, 2))
else {
  console.log(`A1 契约核对：${skill}｜findings=${findings.length}｜CONTRACT.json ${exit === 0 ? '已写入（' + Object.keys(files).length + ' 个文件）' : '未写入（有 FAIL）'}`)
  for (const f of findings) console.log(`  [${f.id}] ${f.msg}`)
}
process.exit(exit)
```

- [ ] **Step 5: 跑单测（应全绿）**

```powershell
node --test scripts/check-eval-contract.test.mjs
```

Expected：`# pass 5`、`# fail 0`。

- [ ] **Step 6: 首跑 A1（生成 CONTRACT.json）**

```powershell
node scripts/check-eval-contract.mjs review-triage
```

Expected：`findings=0`、`CONTRACT.json 已写入（N 个文件）`、EXIT=0。若报 `ORACLE-2`，说明 Task 2 的 oracle 没覆盖断言词——改 oracle，不要改断言。

- [ ] **Step 7: 反向验证（改坏了能被拦）**

```powershell
$p = 'evals/review-triage/cases/02-command-swap-semantic.yaml'
$orig = Get-Content $p -Raw
[System.IO.File]::WriteAllText((Resolve-Path $p), ($orig -replace '  must_contain:\r?\n    - "必须 review"', "  must_contain:`n    - `"允许直接提交`""), (New-Object System.Text.UTF8Encoding $false))
node scripts/check-eval-contract.mjs review-triage
[System.IO.File]::WriteAllText((Resolve-Path $p), $orig, (New-Object System.Text.UTF8Encoding $false))
node scripts/check-eval-contract.mjs review-triage
```

Expected：第一次 EXIT=4 且出现 `ORACLE-2`/`KEYS-6`；恢复后再次 EXIT=0（证明闸门灵敏且可复原）。

---

### Task 5: runner 纯函数与单测

**Files:**
- Create: `scripts/run-eval-core.mjs`
- Create: `scripts/run-eval-core.test.mjs`

**Interfaces:**
- Produces（Task 6 依赖）：`classifyRun(run) → 'full'|'partial'|'undetermined'`、`computeArmRate(runs) → {determined, undetermined, full, rate|null}`、`computeFlaky(runs) → '是'|'否'|'未判定'`、`decideVerdict(ctx) → {verdict, flaky, rate, delta}`、`pickExitCode(lines, toolCode) → number`、`loadExpectation(text) → block`。

- [ ] **Step 1: 写 `scripts/run-eval-core.mjs`**

```js
// run-eval-core.mjs —— runner 的纯函数层（零依赖、无 IO）
import { extractMachineBlock } from './eval-contract-core.mjs'

// run 三态：字段路径写死 runs[].result.passed / .total（spec §1.5）
export function classifyRun(run) {
  const r = run?.result
  const p = r?.passed, t = r?.total
  if (typeof p !== 'number' || typeof t !== 'number') return 'undetermined'
  if (!(t > 0) || p > t || p < 0) return 'undetermined'      // 0/0、5/3 一律 undetermined
  return p === t ? 'full' : 'partial'
}

export function computeArmRate(runs) {
  const tally = { determined: 0, undetermined: 0, full: 0, partial: 0 }
  for (const run of runs) {
    const k = classifyRun(run)
    if (k === 'undetermined') { tally.undetermined++; continue }
    tally.determined++
    tally[k]++
  }
  const rate = tally.determined === 0 ? null : tally.full / tally.determined
  return { ...tally, rate }
}

// flaky：同组内 full 与 partial 并存 → 是；determined=0 → 未判定；否则 否
export function computeFlaky(runs) {
  const { full, partial, determined } = computeArmRate(runs)
  if (determined === 0) return '未判定'
  return full > 0 && partial > 0 ? '是' : '否'
}

// 跨行取码：只取 role=gate 的行，2 > 3 > 1 > 0；表外码优先
export function pickExitCode(gateLines, toolCode) {
  if (typeof toolCode === 'number' && ![0, 1, 2, 3, 4].includes(toolCode)) return toolCode
  const prio = { INVALID_ENV: 2, INVALID_FLAKY: 3, INVALID_ASSERT: 1, INVALID_DELTA: 1, VALID: 0 }
  let best = 0
  const rank = { 0: 0, 1: 1, 2: 3, 3: 2 }        // 数值越大越优先：2 > 3 > 1 > 0
  for (const line of gateLines) {
    const code = prio[line.verdict] ?? 0
    if (rank[code] > rank[best]) best = code
  }
  return best
}

export function loadExpectation(text) {
  const mb = extractMachineBlock(text)
  if (!mb.ok) throw new Error(mb.error)
  return mb.block
}
```

- [ ] **Step 2: 写单测**

```js
// scripts/run-eval-core.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyRun, computeArmRate, computeFlaky, pickExitCode } from './run-eval-core.mjs'

const R = (passed, total) => ({ result: { passed, total } })

test('classifyRun：full / partial / undetermined 三态', () => {
  assert.equal(classifyRun(R(3, 3)), 'full')
  assert.equal(classifyRun(R(1, 3)), 'partial')
  assert.equal(classifyRun(R(null, null)), 'undetermined')
  assert.equal(classifyRun(R(0, 0)), 'undetermined')
  assert.equal(classifyRun(R(5, 3)), 'undetermined')
})

test('classifyRun：字段写在顶层 → undetermined', () => {
  assert.equal(classifyRun({ passed: 3, total: 3 }), 'undetermined')
})

test('computeArmRate：undetermined 不进分母', () => {
  const r = computeArmRate([R(3, 3), R(3, 3), R(null, null)])
  assert.equal(r.determined, 2)
  assert.equal(r.undetermined, 1)
  assert.equal(r.rate, 1)
})

test('computeFlaky：full 与 partial 并存 = 是', () => {
  assert.equal(computeFlaky([R(3, 3), R(1, 3)]), '是')
  assert.equal(computeFlaky([R(3, 3), R(3, 3)]), '否')
  assert.equal(computeFlaky([R(null, null)]), '未判定')
})

test('pickExitCode：2 > 3 > 1 > 0', () => {
  assert.equal(pickExitCode([{ verdict: 'INVALID_FLAKY' }, { verdict: 'INVALID_ENV' }], 1), 2)
  assert.equal(pickExitCode([{ verdict: 'INVALID_FLAKY' }, { verdict: 'INVALID_ASSERT' }], 1), 3)
  assert.equal(pickExitCode([{ verdict: 'VALID' }], 0), 0)
})

test('pickExitCode：表外码透传优先', () => {
  assert.equal(pickExitCode([{ verdict: 'INVALID_ENV' }], 5), 5)
})
```

- [ ] **Step 3: 跑测试**

```powershell
node --test scripts/run-eval-core.test.mjs
```

Expected：`# pass 6`、`# fail 0`。

---

### Task 6: runner CLI 与 npm script

**Files:**
- Create: `scripts/run-eval.mjs`
- Modify: `package.json`（`scripts` 增加一行）
- Create（运行期）：`.session/eval/out/<技能名>/`、`.session/eval/fixture/<技能名>/<repo>/`

**Interfaces:**
- Consumes: Task 5 的 `classifyRun/computeArmRate/computeFlaky/pickExitCode/loadExpectation`；Task 4 的 `CONTRACT.json`；`expected.md` 机读块。
- Produces: `<output-dir>/verdict.md`；stdout 每用例一行；退出码 0/1/2/3/4（表外透传）。

- [ ] **Step 1: 写 `scripts/run-eval.mjs` 骨架（前置闸门 + dry-run）**

按 spec §3.3-5 的 ①–⑨ 顺序实现，**任一不过立即按其码退出、不产 verdict 行**：

```js
// run-eval.mjs —— 评测 runner（零依赖）
// 职责：前置闸门 → 注入模型 → 调工具 → 汇总 flaky/差值 → 写 verdict.md → 退出码
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, cpSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { computeArmRate, computeFlaky, pickExitCode, loadExpectation } from './run-eval-core.mjs'
import { sha256 } from './eval-contract-core.mjs'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRootFromScript = resolve(scriptDir, '..')       // 仅用于找默认 eval.yaml
const skill = process.argv[2] || 'review-triage'
const args = process.argv.slice(3)
const dryRun = args.includes('--dry-run')
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt }

const evalYaml = resolve(opt('--eval-yaml', join(repoRootFromScript, 'evals', skill, 'eval.yaml')))
const evalDir = dirname(evalYaml)
const repoRoot = resolve(evalDir, '..', '..')            // 基准只从 eval.yaml 推（spec §3.3-1）
const skillRoot = join(repoRoot, 'skills', skill)
const outputDir = resolve(opt('--output-dir', join(repoRoot, '.session', 'eval', 'out', skill)))
const iteration = Number(opt('--iteration', '2'))

const EXIT = { ENV: 2, CONFIG: 4, NO_CASE: 3 }
function bail(code, reason, detail) {
  console.log(`exit=${code} reason=${reason} ${detail}`)
  process.exit(code)
}

// ①–⑨
if ((evalDir.split(/[\\/]/).slice(-2, -1)[0]) !== 'evals') bail(EXIT.CONFIG, '配置错误', 'BASE-1 eval.yaml 不在 evals/<技能名>/ 下')
const bin = process.env.SKILL_UP_BIN || 'skill-up'
const hasBin = process.env.SKILL_UP_BIN
  ? existsSync(process.env.SKILL_UP_BIN)
  : spawnSync(bin, ['--version'], { encoding: 'utf8' }).status === 0
if (!hasBin) bail(EXIT.ENV, '环境不可用', '① 二进制定位失败（设 SKILL_UP_BIN 或装 skill-up）')
let yamlText
try { yamlText = readFileSync(evalYaml, 'utf8') } catch { bail(EXIT.CONFIG, '配置错误', '② eval.yaml 不可读') }
const caseFiles = [...yamlText.matchAll(/^\s*-\s+(\.\.\/\.\.\/evals\/[^\s]+\.yaml)\s*$/gm)].map((m) => m[1])
if (caseFiles.length === 0) bail(EXIT.NO_CASE, '无可用用例', '③ cases.files 为空')
if (existsSync(outputDir)) bail(EXIT.CONFIG, '配置错误', '④ 产物目录已存在')
if (!(iteration >= 2)) bail(EXIT.CONFIG, '配置错误', '⑤ --iteration 必须 ≥ 2')
if (!existsSync(join(skillRoot, 'SKILL.md'))) bail(EXIT.CONFIG, '配置错误', `⑥-4 skills[].path 下无 SKILL.md：${skillRoot}`)
if (/benchmark:\s*\n\s*enabled:\s*false/.test(yamlText)) bail(EXIT.CONFIG, '配置错误', '⑦ benchmark.enabled 非 true')

// ⑥-1 源目录存在 → ⑥-2 物化（先删后建）→ ⑥-5 baseline + apply --check
const fixtureRoot = join(evalDir, 'fixtures', 'repos')
const materialized = join(repoRoot, '.session', 'eval', 'fixture', skill)
if (existsSync(fixtureRoot)) {
  const repos = readdirSync(fixtureRoot, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
  if (repos.length > 0) {
    rmSync(materialized, { recursive: true, force: true })
    for (const repoName of repos) {
      const dst = join(materialized, repoName)
      cpSync(join(fixtureRoot, repoName), dst, { recursive: true })
      const g = (a) => spawnSync('git', ['-C', dst, ...a], { encoding: 'utf8' })
      g(['init', '-q'])
      g(['add', '-A'])
      g(['-c', 'user.email=eval@local', '-c', 'user.name=eval', 'commit', '-qm', 'baseline'])
      if (g(['rev-parse', 'HEAD']).status !== 0) bail(EXIT.CONFIG, '配置错误', `⑥-5 fixture 缺 baseline：${repoName}`)
    }
  }
}

// ⑥-3 物化后核对 repo_fixture 存在；⑥-4 apply_diff 必须在 context.git 下且存在
for (const rel of caseFiles) {
  const abs = resolve(skillRoot, rel)
  if (!existsSync(abs)) bail(EXIT.CONFIG, '配置错误', `⑥-3 cases.files 不存在：${rel}`)
  const caseText = readFileSync(abs, 'utf8')
  const mFixture = caseText.match(/^\s*repo_fixture:\s*(.+)$/m)
  if (mFixture) {
    const fixtureAbs = resolve(skillRoot, mFixture[1].trim())
    if (!existsSync(fixtureAbs)) bail(EXIT.CONFIG, '配置错误', `⑥-3 repo_fixture 不存在：${mFixture[1].trim()}`)
  }
  const mPatch = caseText.match(/^\s*apply_diff:\s*(.+)$/m)
  if (mPatch) {
    if (!/^\s{2}git:\s*$/m.test(caseText)) bail(EXIT.CONFIG, '配置错误', '⑥-4 apply_diff 层级错（必须写在 context.git 下）')
    const patchAbs = resolve(skillRoot, mPatch[1].trim())
    if (!existsSync(patchAbs)) bail(EXIT.CONFIG, '配置错误', `⑥-4 apply_diff 不存在：${mPatch[1].trim()}`)
    const repoName = (mFixture?.[1] || '').split('/').pop()
    if (repoName) {
      const check = spawnSync('git', ['-C', join(materialized, repoName), 'apply', '--check', patchAbs], { encoding: 'utf8' })
      if (check.status !== 0) bail(EXIT.CONFIG, '配置错误', `⑥-5 git apply --check 失败：${patchAbs}`)
    }
  }
}
```

- [ ] **Step 2: 补 ⑧ 与 dry-run 出口**

```js
const contractPath = join(evalDir, 'fixtures', 'CONTRACT.json')
if (!existsSync(contractPath)) bail(EXIT.CONFIG, '配置错误', '⑧ CONTRACT.json 缺失（先跑 A1）')
const contract = JSON.parse(readFileSync(contractPath, 'utf8'))
if (contract.exit !== 0) bail(EXIT.CONFIG, '配置错误', '⑧ CONTRACT.json 的 exit 非 0')
for (const [rel, want] of Object.entries(contract.files)) {
  const abs = join(repoRoot, rel)
  const got = existsSync(abs) ? sha256(readFileSync(abs)) : null
  if (got !== want) bail(EXIT.CONFIG, '配置错误', `⑧ 文件已改但未重跑 A1：${rel}`)
}

const expectation = loadExpectation(readFileSync(join(evalDir, 'expected.md'), 'utf8'))
if (iteration < expectation.iteration_min) bail(EXIT.CONFIG, '配置错误', `⑦ --iteration(${iteration}) < iteration_min(${expectation.iteration_min})`)

if (dryRun) {
  console.log(`eval:${skill} dry-run 通过 ①–⑨`)
  console.log('engine_version=n/a（dry-run 未执行工具）')
  console.log(`eval-yaml=${evalYaml}`)
  console.log(`output-dir=${outputDir}`)
  console.log(`fixture-dir=${materialized}`)
  process.exit(0)
}
```

- [ ] **Step 3: 注入模型 + spawn + 汇总 + verdict.md**

```js
const provider = process.env.EVAL_MODEL_PROVIDER
const name = process.env.EVAL_MODEL_NAME
if (!provider || !name) bail(EXIT.ENV, '环境不可用', `模型变量缺失：${!provider ? 'EVAL_MODEL_PROVIDER ' : ''}${!name ? 'EVAL_MODEL_NAME' : ''}`)

const original = readFileSync(evalYaml, 'utf8')
const injected = original
  .replace('"{provider}"', JSON.stringify(provider))
  .replace('"{name}"', JSON.stringify(name))
  .replace(/^(\s*path:\s*)skills\//m, `$1${join(repoRoot, 'skills')}/`)
let toolResult
try {
  writeFileSync(evalYaml, injected, 'utf8')
  toolResult = spawnSync(
    bin.endsWith('.mjs') ? process.execPath : bin,
    bin.endsWith('.mjs')
      ? [bin, 'run', evalYaml, '--output-dir', outputDir, '--iteration', String(iteration)]
      : ['run', evalYaml, '--output-dir', outputDir, '--iteration', String(iteration)],
    { cwd: repoRoot, encoding: 'utf8' },
  )
} finally {
  writeFileSync(evalYaml, original, 'utf8')      // try/finally：spawn 失败也还原
}

const toolCode = toolResult.status ?? null
const benchFiles = []
for (let i = 1; i <= iteration; i++) {
  const p = join(outputDir, `iteration-${i}`, 'benchmark.json')
  if (existsSync(p)) benchFiles.push(p)
}
if (benchFiles.length === 0) console.log('flaky 未判定（无产物）')
const runsByCase = new Map()
for (const p of benchFiles) {
  const data = JSON.parse(readFileSync(p, 'utf8'))
  for (const run of data.runs || []) {
    const key = run.eval_name
    if (!runsByCase.has(key)) runsByCase.set(key, { with: [], without: [] })
    const arm = run.configuration === 'with_skill' ? 'with' : 'without'
    runsByCase.get(key)[arm].push(run)
  }
}

mkdirSync(outputDir, { recursive: true })        // 运行期失败也要能写 verdict.md（在 ④ 之后）
const lines = []
const verdictLines = []
for (const c of expectation.cases) {
  const got = runsByCase.get(c.eval_name) || { with: [], without: [] }
  const w = computeArmRate(got.with), wo = computeArmRate(got.without)
  const flaky = computeFlaky([...got.with, ...got.without])
  const n = benchFiles.length
  const rate = `${w.rate === null ? '未判定' : w.rate}/${wo.rate === null ? '未判定' : wo.rate}`
  let verdict, delta
  if (c.role === 'probe') {
    verdict = flaky === '是' ? 'INVALID_FLAKY' : (n === 0 || w.determined === 0 || wo.determined === 0 || n < expectation.iteration_min ? 'INVALID_ENV' : 'VALID')
    delta = 'n/a'
  } else if (n < expectation.iteration_min || w.determined < expectation.iteration_min || wo.determined < expectation.iteration_min) {
    verdict = 'INVALID_ENV'; delta = '未判定'
  } else if (flaky === '是') {
    verdict = 'INVALID_FLAKY'; delta = '未判定'
  } else {
    const d = w.rate - wo.rate
    delta = d >= c.delta.min ? d : '未达'
    const armsOk = w.rate >= c.arms.with_skill.min_rate && w.rate <= c.arms.with_skill.max_rate
      && wo.rate >= c.arms.without_skill.min_rate && wo.rate <= c.arms.without_skill.max_rate
    verdict = (armsOk && delta !== '未达') ? 'VALID' : (c.origin === 'frozen' ? 'INVALID_DELTA' : 'INVALID_ASSERT')
  }
  verdictLines.push({ verdict })
  lines.push(`${c.eval_name}: role=${c.role} iteration=${n === 0 ? 'n/a' : n} runs=${w.determined}/${wo.determined} undet=${w.undetermined}/${wo.undetermined} flaky=${flaky} rate=${rate} delta=${delta} verdict=${verdict} exit=${toolCode ?? 'n/a'} timeout=否`)
}

const exitCode = pickExitCode(verdictLines.filter((_, i) => expectation.cases[i].role === 'gate'), toolCode)

let engineVersion = 'n/a（未读到 iteration-1/result.json）'
const resultJson = join(outputDir, 'iteration-1', 'result.json')
if (existsSync(resultJson)) {
  try { engineVersion = JSON.parse(readFileSync(resultJson, 'utf8')).observed_configuration?.version || 'n/a（result.json 无 version 字段）' }
  catch { engineVersion = 'n/a（result.json 解析失败）' }
}

const md = [
  '# 评测结论',
  '',
  `- 配置模型（请求值）：${provider} / ${name}`,
  `- 引擎版本：${engineVersion}`,
  '- 真实后端未验证：需在转发侧人工确认',
  `- 覆盖范围：1 技能 / ${expectation.cases.length} 用例`,
  `- 稳定性检出上限：n=${benchFiles.length}，两次一致 ≠ 已验证稳定`,
  '',
  ...lines,
].join('\n')
writeFileSync(join(outputDir, 'verdict.md'), md + '\n', 'utf8')
for (const l of lines) console.log(l)
process.exit(exitCode)
```

- [ ] **Step 4: 加 npm script**

`package.json` 的 `scripts` 增加一行（**只加这一条**）：

```json
"eval:review-triage": "node scripts/run-eval.mjs review-triage"
```

- [ ] **Step 5: dry-run 冒烟**

```powershell
$env:SKILL_UP_BIN = 'C:\path\to\skill-up.exe'   # 换成真实路径
npm run eval:review-triage -- --dry-run
```

Expected：`dry-run 通过 ①–⑨`、`engine_version=n/a（dry-run 未执行工具）`、EXIT=0，且 `.session/eval/out/review-triage` **不存在**。
若报 `⑧ CONTRACT.json 缺失` → 先跑 Task 4 Step 6；若报 `④ 产物目录已存在` → 删掉 `.session/eval/out/review-triage` 再跑。

- [ ] **Step 6: 直接跑一次（无凭据则跳过）**

```powershell
npm run eval:review-triage
```

Expected（有凭据）：产生 `iteration-1/`、`iteration-2/` 与 `verdict.md`，每用例一行，退出码按二维表。
Expected（无凭据）：`exit=2 reason=环境不可用`，**不产生** `verdict.md` 之外的行——如实记录「未取证」，不得写成通过。

---

### Task 7: 离线预检与取证记录

> 对应 spec §4 **步骤 0**。注意 spec 已注明它「在步骤 1–3 的产物与步骤 3.5 的 A1 首跑之后执行」——所以本任务排在 Task 1–6 之后，**编号与执行顺序故意不同**，别按编号提前做（提前做只会得到一堆「未预检」）。

**Files:**
- Create: `evals/review-triage/fixtures/RECORD.md`

**Interfaces:**
- Produces: `RECORD.md` 是 A1 的「禁词双向留痕」材料来源（Task 4 核对项已引用其结构）；也是 Task 8 验收的证据清单。

- [ ] **Step 1: 写 `RECORD.md` 模板并逐项填**

```markdown
# 取证记录（review-triage）

> 本文件进 git。不得把答案暗示写进 yaml 的 description / prompt。

## 一、离线预检（2026-10-22）

| 项 | 结果 | 证据 |
|---|---|---|
| `skill-up validate` | 待填 | 命令 + 退出码 |
| `--dry-run` 返回 0 | 待填 | 命令 + stdout 首行 |
| 机读块 ①–④ 自洽 | 待填 | A1 输出 |
| oracle 断言全过（⑤） | 待填 | A1 输出 |
| 锚点双向（⑥） | 待填 | A1 输出 |
| ⑧ CONTRACT.json 半边 | 待填 | A1 输出 + 文件哈希 |

## 二、fixture 四件自查

| # | 项 | 结果 |
|---|---|---|
| 1 | `apply_diff` 在 `context.git` 下 | 待填 |
| 2 | 物化副本有 baseline 提交 | 待填 |
| 3 | 实测 ` M notes/plan.md` + diff 翻转 | 待填 |
| 4 | `git apply --check` 退出 0 | 待填 |

## 三、路径基准正向观测

- `../../` 相对技能根目录的解析：待填（判据 = 工具真加载到用例；不得以「没报错」通过）

## 四、禁词双向留痕

| 断言集哈希 | 样本文件 | 行号 | 命中词 |
|---|---|---|---|
| 待填 | 待填 | 待填 | 待填 |

## 五、阈值来源

| 用例 | 字段 | 值 | 来源（声明值 / 实测） | 样本路径 |
|---|---|---|---|---|
| 执行动作替换应判为必须 review | with_skill.min_rate | 1.0 | 声明值 | — |
| 执行动作替换应判为必须 review | without_skill.max_rate | 0.0 | 声明值 | — |
| 执行动作替换应判为必须 review | delta.min | 1.0 | 声明值 | — |

## 六、A1 运行记录

| 时间 | 命令 | 退出码 | findings |
|---|---|---|---|
| 待填 | `node scripts/check-eval-contract.mjs review-triage` | 待填 | 待填 |
```

- [ ] **Step 2: 填完后重跑 A1 刷新快照**

```powershell
node scripts/check-eval-contract.mjs review-triage
```

Expected：EXIT=0，`CONTRACT.json` 的 `files` 已含 `evals/review-triage/fixtures/RECORD.md`（若未含，说明 `RECORD.md` 不在六类枚举内——按 spec §3.4 它属「自查记录」，可不入快照；此时在 `RECORD.md` 注明即可，不改 A1 的枚举）。

---

### Task 8: 全量验收与收尾

**Files:**
- Modify: （无新增；只做验证与记录）

- [ ] **Step 1: 跑仓库检查**

```powershell
npm run check
```

Expected：`# fail 0`、`0 findings`、`④ markdown 检查通过（N 个文件 / M 张表）`、`check 全部通过`。
markdown 文件数 = 开跑前基数 240 + 本次新增 `.md` 份数（逐份点清：`expected.md`、2 份 oracle、5+2 份 responses、`RECORD.md`、fixture 内 `notes/plan.md`）。

- [ ] **Step 2: 逐条对 §5 验收 ①–⑩**

```powershell
Select-String -Path docs/superpowers/specs/2026-10-21-skill-eval-harness-design.md -Pattern '^\| [①-⑩] \|' | ForEach-Object { $_.Line.Substring(0, 40) }
Get-ChildItem -Recurse evals | Where-Object { $_.Name -like '*.test.mjs' } | Measure-Object | Select-Object -ExpandProperty Count
git status --porcelain
```

Expected：`*.test.mjs` 命中 **0**；`git status` 里新增文件全在 `evals/` 与 `scripts/`（外加 `package.json` 一行改动）。

- [ ] **Step 3: 收尾（不提交）**

改动全部留在工作区。向用户报告：新增文件清单、`check` 输出、dry-run 与真跑的实际结果（含「未取证」项）、以及 spec §5 ①–⑩ 的逐条结论。

---

## 自检（写完本计划后对照 spec 复核）

**1. spec 覆盖**：§3.1 目录结构 → Task 1/2/3/7；§3.2 eval.yaml → Task 1；§3.2.1 用例契约 → Task 1 + Task 4 核对；§3.2.2 机读块 → Task 3 + Task 4；§3.3 runner → Task 5/6；§3.4 写作规矩 → Task 4 + Task 7；§3.5 判据对照 → Task 6；§4 步骤 0–9 → Task 1（步骤 1）、2（步骤 2）、3（步骤 3）、4（步骤 3.5+9）、5/6（步骤 4、6）、7（步骤 0 与 7）、8（步骤 8）；§5 ①–⑩ → Task 8；§6 13 条 → Global Constraints + 各任务；§7 1–11 → Task 5/6/8 的验证步。**无缺口。**

**2. Placeholder 扫描**：全文无「TBD / 待实现 / 类似 Task N」；Task 7 的 `RECORD.md` 模板里「待填」是**交给执行者现场填写的表格单元**（每格对应左侧一条必须实跑的命令），不是未定义的实现占位。Task 6 的 `md` 组装、`bail()` 单行格式、`pickExitCode` 调用均已给出完整代码。

**3. 类型一致性**：`classifyRun` / `computeArmRate` / `computeFlaky` / `pickExitCode` / `loadExpectation` 在 Task 5 定义、Task 6 按同名同签名调用；`extractMachineBlock` / `sha256` / `canonicalJson` 在 Task 4 定义、Task 5/6 复用；`CONTRACT.json` 的形状在 Task 4 的 Interfaces 与 Task 6 的 ⑧ 读取一致（`schema/checked_at/exit/files`）。
