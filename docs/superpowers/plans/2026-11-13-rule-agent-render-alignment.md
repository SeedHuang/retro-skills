# rule / agent 文档体系拉齐 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 把 rule 与 agent 两套文档投影收敛到一套共享块渲染、一套 RuleModel 校验、一套 CLI/基线，同时保持 18 席卡与 5 份 rule 投影逐字节不变。

**Architecture:** 先做 M0a 只读冻结（记录 git SHA、6 份正文 sha256、5 份评分基线），再新增 `tools/docgen/render/index.mjs` 作为两侧唯一的「块 → 文本」层；rule 侧直接重写 `renderDoc`，agent 侧用 `raw` 垫片把 12 个段函数逐个接入，最后逐段替换为结构化块。RuleModel 只是在 `schema.mjs` 上补一个 `validate` 门面，不复制判定语义。CLI 与 baseline 只补非 registered 分支、目录参数与派生清单。

**Tech Stack:** Node 24 ESM、`node:test`、PowerShell 5.1（Windows）、`scs` CLI 0.1.0。

**Spec:** `docs/superpowers/specs/2026-11-13-rule-agent-render-alignment-design.md`（304 行，议会 #2 第 6 轮通过）
**Testcase:** `docs/superpowers/specs/2026-11-13-rule-agent-render-alignment-design-testcase.md`（59 条）
**Gate record:** `docs/devworkflows/20261113161413-rule-agent-render-alignment/gate-record.md`（② 已过）

## Global Constraints

- 18 份 `agents/*.md` 与 5 份 `tools/docgen/builders/rules/*.md` 必须逐字节不变；任何一步后跑 `npm run check`，出现 `Mismatch` 即回滚该步。
- 共享 IR 首期只含 `h1/h2/h3/para/notes/bullets/ordered/blank/raw`；不做 table、不做 Markdown 转义。
- `renderBlocks(blocks)` 以 `\n` 连接展开后的行，**不自动加尾换行**；rule 侧调用方自己补 `+ '\n'`。
- 不改 rule 文案、不改评分口径、不激活 dormant rule、不新增 `rules/*.md` 投影。
- M4（四维评分）不在本 plan；按 spec §11 另立 PRD。
- 所有测试夹具落 `tmp/`（gitignored）；不得在仓内留下未登记产物。
- M0a 只读；**M0b / M1 起需要 `gate-record.md` 的 `## D19 授权` 节有用户原话与日期**，否则 Task 2 起不得执行。
- 提交信息用 `feat:` / `fix:` / `test:` / `docs:` 前缀；每任务一次提交。

---

## File Structure

| 文件 | 责任 | 动作 |
|---|---|---|
| `scripts/rule-baseline.mjs` | M0a 基线报告：跑 `scs check rules --json`，写 `baseline.json` + `manifest.json` | 新建 |
| `scripts/rule-baseline.test.mjs` | 解析与落盘纯函数测试 | 新建 |
| `tools/docgen/render/index.mjs` | 共享块构造器 + `renderBlocks` | 新建 |
| `tools/docgen/render/render.test.mjs` | 块级单测 + 5 份 rule 逐字节 | 新建 |
| `tools/docgen/builders/rules/interpreters.mjs` | rule 侧 `renderDoc` 改用共享块 | 修改 |
| `tools/docgen/models/agents/render/index.mjs` | `renderModel` 收集 `Block[]` 后调 `renderBlocks` | 修改 |
| `tools/docgen/models/agents/render/sections.mjs` | `frontmatter/duty/must/never` 改返回 `Block[]` | 修改 |
| `tools/docgen/models/agents/test/render-sections.test.mjs` | 18 席逐字节断言 | 修改 |
| `tools/docgen/builders/rules/schema.mjs` | 增 `validate` 与 `RuleModel` | 修改 |
| `tools/docgen/builders/rules/schema.test.mjs` | 5 条负例 + 合法模型 0 条 | 新建 |
| `tools/docgen/builders/rules/rules.mjs` | 目录参数化（`dataDir`/`rulesDir`） | 修改 |
| `tools/docgen/builders/rules/build.mjs` | argv/env、建目录、缺 `rules.json` exit 2 | 修改 |
| `tools/docgen/builders/rules/build-dirs.test.mjs` | 目录参数与错误码 | 新建 |
| `tools/docgen/builders/agents/cli.mjs` | 非 registered `--check` 分支 + stderr 契约 | 修改 |
| `tools/docgen/builders/agents/test/rule-render.test.mjs` | dormant 漂移/缺件断言 | 修改 |
| `tools/docgen/builders/agents/components/baseline.mjs` | `BASELINE_RULES` 由 `rules.json` 派生 | 修改 |
| `scripts/check-observable.test.mjs` | F09 改派生断言 | 修改 |
| `tools/docgen/builders/agents/test/support/card-fixtures.mjs` | `coldRepo` 增 `keepGit` | 修改 |
| `scripts/check-all.mjs` | 子进程 env 清洗补 7 项 | 修改 |
| `docs/prd/docgen-index.md`、`README.md`、`skills/rule-writer/references/criteria-dsl.md` | M0b 后同步入口文档 | 修改（Task 11） |

---

## Task 0: D19 授权门（执行前置）

**Files:**
- Read: `docs/devworkflows/20261113161413-rule-agent-render-alignment/gate-record.md`

**Interfaces:**
- Consumes: 无
- Produces: 是否允许执行 Task 2 起的布尔判断

- [x] **Step 1: 读授权节**

Run: `Select-String -Path docs/devworkflows/20261113161413-rule-agent-render-alignment/gate-record.md -Pattern "## D19 授权" -Context 0,6`

- [x] **Step 2: 判定**

期望：节内同时有「用户原话」「日期」「M0b 前后 sha256」三项。缺任一项 → **停止**，只做 Task 1（M0a），Task 2 起全部不执行，并告知用户需要重启 D19。

- [x] **Step 3: 记录**

在 `gate-record.md` 的 `## D19 授权` 节补一行：`- 执行许可：<日期> 读取到用户原话「…」；本 plan Task 2+ 开始执行。`

---

## Task 1: M0a 只读基线（先于任何代码改动）

**Files:**
- Create: `scripts/rule-baseline.mjs`
- Create: `scripts/rule-baseline.test.mjs`
- Create: `docs/reports/2026-11-13-rule-baseline/baseline.json`（运行产物）
- Create: `docs/reports/2026-11-13-rule-baseline/manifest.json`（运行产物）

**Interfaces:**
- Consumes: `scs check rules --json` 的输出；`git rev-parse HEAD`
- Produces:
  - `export function toRecords(report) -> Array<{ruleId,score,max,rate,level,reds,exitCode,scsVersion,nodeVersion,annotationsSha256}>`
  - `export function buildManifest({gitSha, rules, builders, env}) -> object`
  - CLI：`node scripts/rule-baseline.mjs --check-only --out <dir>`

- [x] **Step 1: 写失败测试**

Create `scripts/rule-baseline.test.mjs`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { toRecords, buildManifest } from './rule-baseline.mjs'

const REPORT = {
  files: [{
    name: 'evidence-before-conclusion.md',
    total: 13,
    max: 23,
    rate: 0.5652173913043478,
    level: '不及格',
    findings: [{ group: '头部规范', check: '来源行三字段（类型/日期/落地）', msg: 'x', recipe: 'y' }],
  }],
}

test('toRecords：10 字段与 reds', () => {
  const [r] = toRecords(REPORT, { exitCode: 0, scsVersion: '0.1.0', nodeVersion: 'v24.22.2', annotationsSha256: 'ABC' })
  assert.deepEqual(Object.keys(r).sort(), [
    'annotationsSha256', 'exitCode', 'level', 'max', 'nodeVersion', 'rate', 'reds', 'ruleId', 'score', 'scsVersion',
  ])
  assert.equal(r.ruleId, 'evidence-before-conclusion')
  assert.equal(r.score, 13)
  assert.equal(r.max, 23)
  assert.deepEqual(r.reds, ['头部规范/来源行三字段（类型/日期/落地）'])
})

test('buildManifest：三数组 + env', () => {
  const m = buildManifest({
    gitSha: 'abc', rules: [{ path: 'rules/a.md', sha: '1' }],
    builders: [{ path: 'builders/rules/b.md', sha: '2' }],
    env: { DOCGEN_RULES_DIR: '' },
  })
  assert.equal(m.gitSha, 'abc')
  assert.deepEqual(m.rulesSha256, [{ path: 'rules/a.md', sha: '1' }])
  assert.deepEqual(m.buildersSha256, [{ path: 'builders/rules/b.md', sha: '2' }])
  assert.equal(m.env.DOCGEN_RULES_DIR, '')
})
```

- [x] **Step 2: 运行测试确认失败**

Run: `node --test scripts/rule-baseline.test.mjs`
Expected: FAIL，`Cannot find module ... rule-baseline.mjs`

- [x] **Step 3: 写最小实现**

Create `scripts/rule-baseline.mjs`:

```js
#!/usr/bin/env node
// M0a 只读基线：跑 scs check rules --json，落 baseline.json + manifest.json。
// --check-only：只写 <out>/，不改任何被跟踪件；前置不满足即 exit 2 且不落文件。
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs'
import { join, resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '..')
const ANNOTATIONS = join(REPO, 'tools', 'quality', '.inspector-annotations.json')
const TERMS = join(REPO, 'tools', 'docgen', 'models', 'rules', 'vocab', 'observable-terms.json')
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex').toUpperCase()

export function toRecords(report, { exitCode, scsVersion, nodeVersion, annotationsSha256 }) {
  return (report.files ?? []).map((f) => ({
    ruleId: f.name.replace(/\.md$/, ''),
    score: f.total,
    max: f.max,
    rate: f.rate,
    level: f.level,
    reds: (f.findings ?? []).map((x) => `${x.group}/${x.check}`),
    exitCode,
    scsVersion,
    nodeVersion,
    annotationsSha256,
  }))
}

export function buildManifest({ gitSha, rules, builders, env }) {
  return { gitSha, rulesSha256: rules, buildersSha256: builders, env }
}

function parseArgs(argv) {
  const out = { checkOnly: false, out: null }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--check-only') { out.checkOnly = true; continue }
    if (argv[i] === '--out') {
      const v = argv[i + 1]
      if (!v || v.startsWith('--')) { console.error('InvalidArgs: --out 缺值'); process.exit(2) }
      out.out = v; i += 1; continue
    }
    console.error(`InvalidArgs: 未知旗标 ${argv[i]}`); process.exit(2)
  }
  if (!out.out) { console.error('InvalidArgs: 必须给 --out'); process.exit(2) }
  return out
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const outDir = resolve(process.cwd(), args.out)
  const baselineFile = join(outDir, 'baseline.json')
  const manifestFile = join(outDir, 'manifest.json')

  // 前置 1：被跟踪树干净（untracked 白名单不影响）
  const dirty = execFileSync('git', ['--no-optional-locks', 'status', '--porcelain', '--untracked-files=no'], { cwd: REPO, encoding: 'utf8' }).trim()
  if (dirty) { console.error(`DirtyWorkTree: ${dirty.split(/\r?\n/)[0]}`); process.exit(2) }
  // 前置 2：annotations 存在
  if (!existsSync(ANNOTATIONS)) { console.error(`InvalidInputPath: ${ANNOTATIONS}`); process.exit(2) }

  const r = spawnSync('scs', ['check', 'rules', '--root', '.', '--terms', TERMS, '--annotations', ANNOTATIONS, '--json'], { cwd: REPO, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, shell: true })
  if (r.status !== 0) { console.error(`scs check rules 退出码 ${r.status}`); process.exit(2) }
  const report = JSON.parse(r.stdout.replace(/^\uFEFF/, ''))

  const gitSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim()
  const scsVersion = execFileSync('scs', ['--version'], { cwd: REPO, encoding: 'utf8', shell: true }).trim()
  const listSha = (dir) => readdirSync(dir).filter((f) => f.endsWith('.md')).sort().map((f) => ({ path: relative(REPO, join(dir, f)).replace(/\\/g, '/'), sha: sha256(readFileSync(join(dir, f))) }))
  const env = {}
  for (const k of ['DOCGEN_RULES_DIR', 'DOCGEN_AGENTS_DIR', 'DOCGEN_BASELINE_PATH', 'DOCGEN_TMP_ROOT', 'DOCGEN_BUILD_DATA_DIR', 'DOCGEN_BUILD_OUT_DIR', 'DOCGEN_BUILD_RULES_DIR']) env[k] = process.env[k] ?? ''

  const records = toRecords(report, { exitCode: r.status, scsVersion, nodeVersion: process.version, annotationsSha256: sha256(readFileSync(ANNOTATIONS)) })
  const manifest = buildManifest({ gitSha, rules: listSha(join(REPO, 'rules')), builders: listSha(join(REPO, 'tools', 'docgen', 'builders', 'rules')), env })

  mkdirSync(outDir, { recursive: true })
  writeFileSync(baselineFile, JSON.stringify(records, null, 2) + '\n')
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`baseline ${records.length} 条；rules ${manifest.rulesSha256.length} 份；builders ${manifest.buildersSha256.length} 份`)
  return 0
}

const isMain = (() => {
  try { return resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url)) } catch { return false }
})()
if (isMain) process.exit(main())
```

- [x] **Step 4: 运行测试确认通过**

Run: `node --test scripts/rule-baseline.test.mjs`
Expected: `# fail 0`、`# pass 2`

- [x] **Step 5: 跑 M0a**

Run: `node scripts/rule-baseline.mjs --check-only --out docs/reports/2026-11-13-rule-baseline`
Expected: 首行 `baseline 1 条；rules 1 份；builders 5 份`

- [x] **Step 6: 核对产物**

Run: `node --input-type=module -e "import {readFileSync} from 'node:fs'; const b=JSON.parse(readFileSync('docs/reports/2026-11-13-rule-baseline/baseline.json','utf8')); const m=JSON.parse(readFileSync('docs/reports/2026-11-13-rule-baseline/manifest.json','utf8')); console.log(b.length, Object.keys(b[0]).sort().join(',')); console.log(m.rulesSha256.length, m.buildersSha256.length, Boolean(m.gitSha))"`
Expected: `1 annotationsSha256,exitCode,level,max,nodeVersion,rate,reds,ruleId,score,scsVersion` 与 `1 5 true`

- [x] **Step 7: 提交**

```bash
git add scripts/rule-baseline.mjs scripts/rule-baseline.test.mjs docs/reports/2026-11-13-rule-baseline
git commit -m "feat: add read-only rule baseline report (M0a)"
```

---

## Task 2: 共享块渲染引擎

**Files:**
- Create: `tools/docgen/render/index.mjs`
- Create: `tools/docgen/render/render.test.mjs`

**Interfaces:**
- Consumes: 无
- Produces: `h1/h2/h3/para/notes/bullets/ordered/blank/raw(block 构造器)`、`renderBlocks(blocks) -> string`

- [x] **Step 1: 写失败测试**

Create `tools/docgen/render/render.test.mjs`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { h1, h2, h3, para, notes, bullets, ordered, blank, raw, renderBlocks } from './index.mjs'
import { renderRule } from '../builders/rules/rules.mjs'

test('块级渲染：标题/段落/引用/列表/空行/raw', () => {
  const text = renderBlocks([
    h1('一'), blank(), h2('二'), blank(), h3('三'), blank(),
    para('段落'), blank(), notes('注'), blank(),
    bullets(['甲', '乙']), blank(), ordered(['丙', '丁']), blank(), raw(['原样1', '原样2']),
  ])
  assert.equal(text, '# 一\n\n## 二\n\n### 三\n\n段落\n\n> 注\n\n- 甲\n- 乙\n\n1. 丙\n2. 丁\n\n原样1\n原样2')
})

test('renderBlocks 不自动加尾换行', () => {
  assert.equal(renderBlocks([para('x')]), 'x')
})

const IDS = ['evidence-before-conclusion', 'observable-criteria', 'import-guard', 'no-git-write', 'no-unverified-number']

test('5 份 rule 投影逐字节相等', () => {
  for (const id of IDS) {
    const onDisk = readFileSync(join('tools', 'docgen', 'builders', 'rules', `${id}.md`), 'utf8')
    assert.equal(renderRule(id), onDisk, `DIFF ${id}`)
  }
})
```

- [x] **Step 2: 运行测试确认失败**

Run: `node --test tools/docgen/render/render.test.mjs`
Expected: FAIL，`Cannot find module .../render/index.mjs`

- [x] **Step 3: 写最小实现**

Create `tools/docgen/render/index.mjs`:

```js
// 共享块渲染：两侧只共用「块 → 文本」，不读任何领域字段。
const s = (v) => String(v ?? '')
const list = (items) => items.map(s)

export const h1 = (text) => ({ kind: 'h1', text: s(text) })
export const h2 = (text) => ({ kind: 'h2', text: s(text) })
export const h3 = (text) => ({ kind: 'h3', text: s(text) })
export const para = (text) => ({ kind: 'para', text: s(text) })
export const notes = (text) => ({ kind: 'notes', text: s(text) })
export const bullets = (items) => ({ kind: 'bullets', items: list(items) })
export const ordered = (items) => ({ kind: 'ordered', items: list(items) })
export const blank = () => ({ kind: 'blank' })
// raw 只给 agent 侧迁移垫片与「已有整段字符串」；rule 侧必须用结构化块
export const raw = (lines) => ({ kind: 'raw', lines: list(lines) })

function expand(block) {
  switch (block?.kind) {
    case 'h1': return [`# ${block.text}`]
    case 'h2': return [`## ${block.text}`]
    case 'h3': return [`### ${block.text}`]
    case 'para': return [block.text]
    case 'notes': return [`> ${block.text}`]
    case 'bullets': return block.items.map((t) => `- ${t}`)
    case 'ordered': return block.items.map((t, i) => `${i + 1}. ${t}`)
    case 'blank': return ['']
    case 'raw': return block.lines
    default: throw new Error(`未知块类型 ${JSON.stringify(block?.kind)}`)
  }
}

/** 按行展开后以 \n 连接；不自动加尾换行 */
export function renderBlocks(blocks) {
  return blocks.flatMap(expand).join('\n')
}
```

- [x] **Step 4: 运行测试**

Run: `node --test tools/docgen/render/render.test.mjs`
Expected: `# fail 0`、`# pass 3`

- [x] **Step 5: 提交**

```bash
git add tools/docgen/render/index.mjs tools/docgen/render/render.test.mjs
git commit -m "feat: add shared block renderer"
```

---

## Task 3: rule 侧迁移到共享块

**Files:**
- Modify: `tools/docgen/builders/rules/interpreters.mjs:9-16`
- Test: `tools/docgen/render/render.test.mjs`（Task 2 已含 5/5 字节断言）

**Interfaces:**
- Consumes: `h1/para/notes/blank/renderBlocks`（Task 2）
- Produces: `renderDoc(rule) -> string`，输出与现状逐字节相同

- [x] **Step 1: 替换 `renderDoc`**

```js
import { h1, para, notes, blank, renderBlocks } from '../../render/index.mjs'
import { renderTrigger, renderObligation } from './schema.mjs'

/** §4.1 模板：标题 → 触发 → 编号义务 → 另见（可选）→ 落点 */
function renderDoc(rule) {
  const blocks = [
    h1(rule.title),
    blank(),
    notes(`触发：${renderTrigger(rule)}`),
    blank(),
    para('义务（全部成立才合规；缺一件 = 不合格）：'),
  ]
  // renderObligation 自带 `${index+1}. ` 与续行；必须用 para 原样承载，不能再包 ordered
  rule.assert.forEach((a, i) => blocks.push(para(renderObligation(a, i))))
  blocks.push(blank())
  if (Array.isArray(rule.refs) && rule.refs.length > 0) blocks.push(para(`另见：${rule.refs.join('、')}`))
  blocks.push(para(`落点：${rule.landing}`))
  return renderBlocks(blocks) + '\n'
}
```

- [x] **Step 2: 跑 rule 逐字节测试**

Run: `node --test tools/docgen/render/render.test.mjs`
Expected: `# fail 0`；5 份 rule 逐字节相等

- [x] **Step 3: 跑构建**

Run: `node tools/docgen/builders/rules/build.mjs`
Expected: 末行 `rule-dsl ok`

- [x] **Step 4: 确认 `renderDoc` 已无第二份实现**

Run: `rg -n "renderDoc" tools/docgen --glob "*.mjs" --glob "!*.test.mjs"`
Expected: 只命中 `interpreters.mjs` 的定义与两处 `render: renderDoc`

- [x] **Step 5: 提交**

```bash
git add tools/docgen/builders/rules/interpreters.mjs
git commit -m "refactor: render rule docs through shared block renderer"
```

---

## Task 4: agent 侧接入共享块

**Files:**
- Modify: `tools/docgen/models/agents/render/index.mjs:22-32`
- Modify: `tools/docgen/models/agents/render/sections.mjs:107-160`
- Test: `tools/docgen/models/agents/test/render-sections.test.mjs`

**Interfaces:**
- Consumes: `raw/renderBlocks/para/notes/bullets/h1/h2/blank`（Task 2）
- Produces: `renderModel(...) -> { type, text, lines }`，`text` 与现状逐字节相同

- [x] **Step 1: 写字节断言测试**

在 `render-sections.test.mjs` 现有 import 之后追加一个用例（`MODELS_DIR`、`listSeats` 已在第 5 行导入）：

```js
test('render/index：18 席渲染 = 盘上 agents/<seat>.md', () => {
  const REPO = join(MODELS_DIR, '..', '..', '..', '..', '..') // jsons → agents → models → docgen → tools → 仓根
  for (const seat of listSeats()) {
    const onDisk = readFileSync(join(REPO, 'agents', `${seat}.md`), 'utf8')
    assert.equal(renderModel(join(MODELS_DIR, seat, 'index.json'), shared).text, onDisk, `DIFF ${seat}`)
  }
})
```

- [x] **Step 2: 运行确认基线**

Run: `node --test tools/docgen/models/agents/test/render-sections.test.mjs`
Expected: `# fail 0`。当前 `renderModel` 直接 `lines.join('\n')`，该断言应已通过；它是 Step 3 重构后的逐字节护栏，不是「先红后绿」用例。

- [x] **Step 3: 改 `renderModel` 为块装配**

```js
import { raw, renderBlocks } from '../../../render/index.mjs'

// 已迁到 Block[] 的段；未迁的段整体走 raw 垫片
const BLOCK_SECTIONS = new Set()

export function renderModel(ownPath, shared) {
  const M = { ...shared, ...expand(ownPath) }
  const h = makeHelpers(M, shared)
  const t = typeOf(M)
  if (!t && M.modelType) throw new Error('MODELTYPE_UNKNOWN:' + M.modelType)
  const type = t || 'RespondentModel'
  const blocks = []
  for (const k of TYPE_SECTIONS[type]) {
    const out = sections[k](M, shared, h)
    if (BLOCK_SECTIONS.has(k)) blocks.push(...out)
    else blocks.push(raw(out))
  }
  const text = renderBlocks(blocks)
  return { type, text, lines: text.split('\n').length }
}
```

路径核对：`tools/docgen/models/agents/render/index.mjs` → `../../../render/index.mjs` = `tools/docgen/render/index.mjs`。

- [x] **Step 4: 跑 18 席逐字节**

Run: `node --test tools/docgen/models/agents/test/render-sections.test.mjs`
Expected: `# fail 0`；18 席全部相等

- [x] **Step 5: 迁 `frontmatter`**

把 `sections.frontmatter` 改为返回块：

```js
frontmatter(M, shared, h) {
  return [
    raw(['---']),
    para(`name: ${M.seat.id}`),
    para(`description: ${h.seatDesc}`),
    para(`tools: ${h.tools.join(', ')}`),
    raw(['---']),
    blank(),
    h1(`角色卡：${M.seat.id}`),
    blank(),
  ]
}
```

在 `BLOCK_SECTIONS` 加 `'frontmatter'`；在 `sections.mjs` 顶部 import `{ h1, para, blank, raw }`。

- [x] **Step 6: 跑一次回归**

Run: `node --test tools/docgen/models/agents/test/render-sections.test.mjs`
Expected: 18 席仍全等

- [x] **Step 7: 迁 `duty`**

```js
duty(M, shared, h) {
  const a = M.duty.action
  const subject = typeof a.landingSubject === 'string' ? a.landingSubject : a.emit[a.landingSubject.index]
  const land = landingOf(M, h, subject)
  const landingText = M.outputs.items.length
    ? M.outputs.items.map((i) => `${h.F[i.artifact].text}（${i.phase}）`).join(a.landingJoiner || '与 ')
    : land.kind === 'ledger' ? `${land.text}（只记入评审账本，不写文件）` : land.text
  const pm = M.permissions
  const allow = pm.action.allow.map((x) => shared.actions[x]).join('、')
  const forbids = pm.action.forbid.map((x) => '不' + (M.permissionGroups[x]?.label || shared.actions[x] || x)).join('，')
  return [
    h2('职责'),
    para(`触发：${h.seatDesc}`),
    para(`动作：对${a.objects.join('与')}做${a.scope}${a.verb}，逐条给出${a.emit.join('与')}，${subject}写回 ${landingText}。`),
    para(`约束：只${allow}，${forbids}。`),
    blank(),
  ]
}
```

在 `BLOCK_SECTIONS` 加 `'duty'`；import 补 `h2`。

- [x] **Step 8: 迁 `must`**

```js
must(M, shared, h) {
  if (!M.must?.length) return []
  const blocks = [h2('一定会'), notes(`时机：${h.timingText}。`)]
  for (const g of M.globalRules) blocks.push(notes(g.text))
  const land = landingOf(M, h)
  blocks.push(notes(land.kind === 'ledger'
    ? '判定只记入本轮评审账本，不写盘。'
    : `判定写回 ${land.text}。`), blank())
  const items = []
  let n = 0
  for (const rule of M.must) {
    for (const target of rule.targets) {
      n += 1
      items.push(`${n}｜${M.vocab.object[target.object]}｜${h.renderRule({ ...rule, targets: [target] }, true)}。`)
    }
  }
  blocks.push(bullets(items), blank())
  return blocks
}
```

在 `BLOCK_SECTIONS` 加 `'must'`；import 补 `notes`、`bullets`。

- [x] **Step 9: 迁 `never`**

```js
never(M, shared, h) {
  if (!M.never?.length) return []
  const items = []
  let n = 0
  for (const rule of M.never) {
    for (const target of rule.targets) {
      n += 1
      items.push(`${n}｜${h.renderRule({ ...rule, targets: [target] }, false)}（针对${M.vocab.object[target.object]}）；出现即违反。`)
    }
  }
  return [h2('禁止'), bullets(items), blank()]
}
```

在 `BLOCK_SECTIONS` 加 `'never'`。

- [x] **Step 10: 全量回归**

Run: `npm run check`
Expected: `check 全部通过`；`agents 18/18`

- [x] **Step 11: 提交**

```bash
git add tools/docgen/models/agents/render/index.mjs tools/docgen/models/agents/render/sections.mjs tools/docgen/models/agents/test/render-sections.test.mjs
git commit -m "refactor: route agent cards through shared block renderer"
```

---

## Task 5: RuleModel.validate 门面

**Files:**
- Modify: `tools/docgen/builders/rules/schema.mjs:343` 后追加
- Create: `tools/docgen/builders/rules/schema.test.mjs`

**Interfaces:**
- Consumes: `check`、`checkTestcase`（同文件）
- Produces: `validate(rule, { testcase, ruleIds } = {}) -> Finding[]`；`RuleModel = { typeName, fields, validate }`

- [x] **Step 1: 写失败测试**

Create `tools/docgen/builders/rules/schema.test.mjs`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { validate, RuleModel } from './schema.mjs'

const read = (p) => JSON.parse(readFileSync(join('tools', 'docgen', 'models', 'rules', p), 'utf8').replace(/^\uFEFF/, ''))
const validRule = () => read('evidence-before-conclusion.json')
const validTc = () => read('evidence-before-conclusion.testcase.json')

test('合法模型 + 合法 testcase → 0 条', () => {
  const r = validRule()
  assert.deepEqual(validate(r, { testcase: validTc(), ruleIds: new Set([r.id]) }), [])
})

test('无 testcase → 先跑 check，再追加 MissingTestcase', () => {
  const f = validate(validRule())
  assert.equal(f.length, 1)
  assert.equal(f[0].code, 'MissingTestcase')
})

test('缺 landing → Schema', () => {
  const r = validRule(); delete r.landing
  const f = validate(r, { testcase: validTc(), ruleIds: new Set([r.id]) })
  assert.ok(f.some((x) => x.code === 'Schema' && x.message.includes('缺字段 landing')))
})

test('非法 op → 恰 1 条 Schema', () => {
  const r = validRule()
  const idx = r.assert.findIndex((a) => a.op && !a.anyOf && !a.allOf && !a.not)
  r.assert = [{ ...r.assert[idx], op: 'equals' }]
  const f = validate(r, { testcase: { rule: r.id, cases: [{ input: {}, expect: 'pass' }, { input: {}, expect: 'fail' }] }, ruleIds: new Set([r.id]) })
  assert.equal(f.length, 1)
  assert.equal(f[0].code, 'Schema')
  assert.ok(f[0].message.includes('op 未注册'))
})

test('type 越界 → TypeInvalid', () => {
  const r = validRule(); r.type = '持续'
  const f = validate(r, { testcase: validTc(), ruleIds: new Set([r.id]) })
  assert.ok(f.some((x) => x.code === 'TypeInvalid'))
})

test('testcase 缺反例 → Testcase，message 含原文', () => {
  const r = validRule()
  const f = validate(r, { testcase: { rule: r.id, cases: [{ input: {}, expect: 'pass' }] }, ruleIds: new Set([r.id]) })
  assert.equal(f.length, 1)
  assert.equal(f[0].code, 'Testcase')
  assert.ok(f[0].message.includes('缺反例（防漏判无验证）'))
})

test('默认 ruleIds 不抛', () => {
  const r = validRule()
  const f = validate(r, { testcase: validTc() })
  assert.ok(Array.isArray(f))
  assert.ok(!f.some((x) => x.message.includes('引用的 rule 不存在')))
})

test('RuleModel 导出形状', () => {
  assert.equal(RuleModel.typeName, 'RuleModel')
  assert.equal(typeof RuleModel.validate, 'function')
  assert.deepEqual(RuleModel.fields, ['id', 'impl', 'type', 'scope', 'title', 'when', 'assert', 'residual', 'refs', 'landing'])
})
```

- [x] **Step 2: 运行确认失败**

Run: `node --test tools/docgen/builders/rules/schema.test.mjs`
Expected: FAIL，`validate is not a function`

- [x] **Step 3: 实现 `validate`**

在 `schema.mjs` 末尾追加：

```js
/**
 * 门面：schema 判定 + testcase 校验，统一返回 Finding[]，不抛。
 * checkTestcase 产字符串，这里包成 {code:'Testcase'}；无 testcase 追加 MissingTestcase。
 */
export function validate(rule, { testcase, ruleIds } = {}) {
  const findings = []
  const name = rule?.id ?? 'rule'
  check(rule, name, findings)
  if (!testcase || Object.keys(testcase).length === 0) {
    findings.push({ code: 'MissingTestcase', message: `缺 testcase：${name}.testcase.json` })
    return findings
  }
  const raw = []
  checkTestcase(testcase, name, ruleIds ?? new Set([rule.id]), raw)
  for (const message of raw) findings.push({ code: 'Testcase', message })
  return findings
}

export const RuleModel = {
  typeName: 'RuleModel',
  fields: ['id', 'impl', 'type', 'scope', 'title', 'when', 'assert', 'residual', 'refs', 'landing'],
  validate,
}
```

- [x] **Step 4: 运行测试**

Run: `node --test tools/docgen/builders/rules/schema.test.mjs`
Expected: `# fail 0`、`# pass 8`

- [x] **Step 5: 提交**

```bash
git add tools/docgen/builders/rules/schema.mjs tools/docgen/builders/rules/schema.test.mjs
git commit -m "feat: add RuleModel.validate facade"
```

---

## Task 6: rules.mjs 目录参数化 + build.mjs argv/env

**Files:**
- Modify: `tools/docgen/builders/rules/rules.mjs:13-41`
- Modify: `tools/docgen/builders/rules/build.mjs:10-52`
- Create: `tools/docgen/builders/rules/build-dirs.test.mjs`

**Interfaces:**
- Consumes: `renderRuleData`（同文件）
- Produces:
  - `DEFAULT_DATA_DIR`、`DEFAULT_RULES_DIR`
  - `listRuleIds(dataDir = DEFAULT_DATA_DIR)`
  - `loadRule(id, dataDir = DEFAULT_DATA_DIR)`
  - `renderRule(id, dataDir = DEFAULT_DATA_DIR)`
  - `writeRule(id, { dataDir = DEFAULT_DATA_DIR, rulesDir = DEFAULT_RULES_DIR } = {})`
  - `build.mjs --data-dir/--out-dir/--rules-dir`（env 兜底）

- [x] **Step 1: 写失败测试**

Create `tools/docgen/builders/rules/build-dirs.test.mjs`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'

const REPO = process.cwd()
const BUILD = join(REPO, 'tools', 'docgen', 'builders', 'rules', 'build.mjs')
const RULE = {
  id: 'fixture-rule', impl: 'script', type: '持续适用', scope: 'global',
  title: '夹具判据', when: { field: 'g', op: 'eq', value: true },
  assert: [{ label: '断言值', field: 'v', op: 'eq', value: 1, probe: { kind: 'manual' } }],
  residual: { who: 'rule-writer', sample: 1, objectivePath: 'tmp/x.json' },
  refs: [], landing: 'tmp/x.md',
}
const TC = { rule: 'fixture-rule', cases: [{ input: { g: true, v: 1 }, expect: 'pass' }, { input: { g: true, v: 0 }, expect: 'fail' }] }

function dataDir({ withRules = true, withTc = true } = {}) {
  const d = mkdtempSync(join(tmpdir(), 'rule-dirs-'))
  writeFileSync(join(d, 'fixture-rule.json'), JSON.stringify(RULE))
  if (withTc) writeFileSync(join(d, 'fixture-rule.testcase.json'), JSON.stringify(TC))
  if (withRules) writeFileSync(join(d, 'rules.json'), JSON.stringify({ rules: ['fixture-rule'] }))
  return d
}
const run = (args) => spawnSync(process.execPath, [BUILD, ...args], { cwd: REPO, encoding: 'utf8' })

test('缺 testcase → exit 1 + 判据无 testcase', () => {
  const d = dataDir({ withTc: false })
  const r = run(['--data-dir', d])
  assert.equal(r.status, 1)
  assert.match(r.stdout, /判据无 testcase/)
  rmSync(d, { recursive: true, force: true })
})

test('缺 rules.json → exit 2 + InvalidInputPath', () => {
  const d = dataDir({ withRules: false })
  const r = run(['--data-dir', d])
  assert.equal(r.status, 2)
  assert.match(r.stderr, /InvalidInputPath:/)
  assert.match(r.stderr, /rules\.json/)
  rmSync(d, { recursive: true, force: true })
})

test('未知旗标 → exit 2 + InvalidArgs', () => {
  const d = dataDir()
  const r = run(['--data-dir', d, '--bogus'])
  assert.equal(r.status, 2)
  assert.match(r.stderr, /InvalidArgs:/)
  rmSync(d, { recursive: true, force: true })
})

test('三目录：自动建 out/rules，只写临时目录', () => {
  const d = dataDir()
  const out = join(d, 'out')
  const rules = join(d, 'rules')
  const r = run(['--data-dir', d, '--out-dir', out, '--rules-dir', rules])
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.ok(existsSync(join(out, 'fixture-rule.md')))
  assert.ok(existsSync(join(rules, 'fixture-rule.md')))
  assert.ok(readFileSync(join(rules, 'fixture-rule.md'), 'utf8').includes('夹具判据'))
  rmSync(d, { recursive: true, force: true })
})
```

- [x] **Step 2: 运行确认失败**

Run: `node --test tools/docgen/builders/rules/build-dirs.test.mjs`
Expected: FAIL（`--data-dir` 未被识别，仍写仓内或报错）

- [x] **Step 3: 改 `rules.mjs`**

```js
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { interpreters } from './interpreters.mjs'

const DIR = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(DIR, '..', '..', '..', '..')
export const DEFAULT_DATA_DIR = join(REPO, 'tools', 'docgen', 'models', 'rules')
export const DEFAULT_RULES_DIR = join(REPO, 'rules')
const strip = (t) => t.replace(/^\uFEFF/, '')
const RULE_PROJECTION = () => interpreters.find((i) => i.id === 'rule')

export function listRuleIds(dataDir = DEFAULT_DATA_DIR) {
  const p = join(dataDir, 'rules.json')
  if (!existsSync(p)) return []
  return JSON.parse(strip(readFileSync(p, 'utf8'))).rules ?? []
}

export function loadRule(id, dataDir = DEFAULT_DATA_DIR) {
  return JSON.parse(strip(readFileSync(join(dataDir, `${id}.json`), 'utf8')))
}

export function renderRuleData(rule) {
  const it = RULE_PROJECTION()
  if (!it) throw new Error('解释器 rule 未注册')
  return it.render(rule)
}

export function renderRule(id, dataDir = DEFAULT_DATA_DIR) {
  return renderRuleData(loadRule(id, dataDir))
}

export function writeRule(id, { dataDir = DEFAULT_DATA_DIR, rulesDir = DEFAULT_RULES_DIR } = {}) {
  const p = join(rulesDir, `${id}.md`)
  writeFileSync(p, renderRule(id, dataDir), 'utf8')
  return p
}
```

- [x] **Step 4: 改 `build.mjs` 顶部与写盘**

替换 `build.mjs` 第 10–20 行与环境准备段：

```js
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { judge, check, checkTestcase } from './schema.mjs'
import { interpreters } from './interpreters.mjs'
import { listRuleIds, writeRule, DEFAULT_DATA_DIR, DEFAULT_RULES_DIR } from './rules.mjs'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const FLAGS = { '--data-dir': 'dataDir', '--out-dir': 'outDir', '--rules-dir': 'rulesDir' }

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 1) {
    const key = FLAGS[argv[i]]
    if (!key) { console.error(`InvalidArgs: 未知旗标 ${argv[i]}`); process.exit(2) }
    const v = argv[i + 1]
    if (v === undefined || v.startsWith('--')) { console.error(`InvalidArgs: ${argv[i]} 缺值`); process.exit(2) }
    out[key] = v; i += 1
  }
  return out
}

const argv = parseArgs(process.argv.slice(2))
const DATA_DIR = path.resolve(argv.dataDir ?? process.env.DOCGEN_BUILD_DATA_DIR ?? DEFAULT_DATA_DIR)
const OUT_DIR = path.resolve(argv.outDir ?? process.env.DOCGEN_BUILD_OUT_DIR ?? DIR)
const RULES_DIR = path.resolve(argv.rulesDir ?? process.env.DOCGEN_BUILD_RULES_DIR ?? DEFAULT_RULES_DIR)
if (!existsSync(DATA_DIR)) { console.error(`InvalidInputPath: ${DATA_DIR}`); process.exit(2) }
if (!existsSync(path.join(DATA_DIR, 'rules.json'))) { console.error(`InvalidInputPath: ${path.join(DATA_DIR, 'rules.json')}`); process.exit(2) }
mkdirSync(OUT_DIR, { recursive: true })
mkdirSync(RULES_DIR, { recursive: true })
const errors = []
```

把投影写盘改为：

```js
for (const it of interpreters) if (it.ext) writeFileSync(path.join(OUT_DIR, `${rule.id}.${it.ext}`), it.render(rule), 'utf8')
```

把注册正文写盘改为：

```js
if (errors.length === 0) {
  for (const id of listRuleIds(DATA_DIR)) {
    try { writeRule(id, { dataDir: DATA_DIR, rulesDir: RULES_DIR }) } catch (err) { errors.push(`rule 正文渲染失败 ${id}: ${err.message}`) }
  }
}
console.log(`rule 正文投影 ${listRuleIds(DATA_DIR).length} 份（${RULES_DIR}）`)
```

- [x] **Step 5: 跑新测试**

Run: `node --test tools/docgen/builders/rules/build-dirs.test.mjs`
Expected: `# fail 0`、`# pass 4`

- [x] **Step 6: 跑默认路径回归**

Run: `node tools/docgen/builders/rules/build.mjs`
Expected: `rule-dsl ok`，且 `git status --porcelain` 无 `builders/rules` / `rules` 改动

- [x] **Step 7: 提交**

```bash
git add tools/docgen/builders/rules/rules.mjs tools/docgen/builders/rules/build.mjs tools/docgen/builders/rules/build-dirs.test.mjs
git commit -m "feat: parameterize rule build dirs and argv"
```

---

## Task 7: CLI 非 registered `--check` 与 stderr 契约

**Files:**
- Modify: `tools/docgen/builders/agents/cli.mjs:96-114`
- Test: `tools/docgen/builders/agents/test/rule-render.test.mjs`

**Interfaces:**
- Consumes: `renderRenderedRule`、`compareBuffers`
- Produces: 非 registered `--check` 走 `builders/rules/<id>.md`；漂移/缺件写 stderr

- [x] **Step 1: 写失败测试**

在 `rule-render.test.mjs` 追加：

```js
test('dormant rule --check：与 builders/rules 逐字节一致 → exit 0', () => {
  const r = runCli(['generate', '--kind', 'rule', '--name', 'import-guard', '--check'])
  assert.equal(r.code, 0, r.out)
  assert.doesNotMatch(r.out, /Mismatch/)
})

test('dormant rule --check：手改 builders/rules → stderr Mismatch + exit 1', () => {
  const r = coldRepo({
    mutate: (c) => appendFileSync(join(c, 'tools', 'docgen', 'builders', 'rules', 'import-guard.md'), '手改一行\n'),
    args: ['generate', '--kind', 'rule', '--name', 'import-guard', '--check'],
  })
  assert.equal(r.code, 1)
  assert.match(r.out, /Mismatch: builders\/rules\/import-guard\.md/)
})

test('dormant rule --check：删 builders/rules → DanglingBaselineEntry + exit 2', () => {
  const r = coldRepo({
    mutate: (c) => rmSync(join(c, 'tools', 'docgen', 'builders', 'rules', 'import-guard.md')),
    args: ['generate', '--kind', 'rule', '--name', 'import-guard', '--check'],
  })
  assert.equal(r.code, 2)
  assert.match(r.out, /DanglingBaselineEntry: builders\/rules\/import-guard\.md/)
})
```

把第 6 行 import 改为：

```js
import { readFileSync, writeFileSync, rmSync, appendFileSync } from 'node:fs'
```

- [x] **Step 2: 运行确认失败**

Run: `node --test tools/docgen/builders/agents/test/rule-render.test.mjs`
Expected: FAIL（dormant 仍先查 `rules/import-guard.md` 或报 `MissingComponentData`）

- [x] **Step 3: 加分流分支**

在 `cmdGenerate` 的 `const objs = ...` 之前插入：

```js
// 非 registered 的 rule --check：基准是 builders/rules/<id>.md，不走 rules/<id>.md 存在性检查
if (check && kind === 'rule' && typeof name === 'string' && !RENDERED_RULES.includes(name)) {
  const rel = `builders/rules/${name}.md`
  const p = join(REPO_ROOT, rel)
  if (!existsSync(p)) fail('DanglingBaselineEntry', { message: rel, path: rel })
  let rendered
  try { rendered = renderRenderedRule(name) } catch (e) { fail('MissingComponentData', { message: `${name}: ${e.message}` }) }
  if (compareBuffers(Buffer.from(rendered, 'utf8'), readFileSync(p))) fail('Mismatch', { message: rel, path: rel })
  console.log(`baseline ${BASELINE_RULES.length + agentPaths().length}/${BASELINE_RULES.length + agentPaths().length}`)
  return 0
}
```

- [x] **Step 4: 修 registered 漂移与缺件的 stderr**

把 `if (!existsSync(p)) fail('DanglingBaselineEntry', { name: o.path, path: p })` 改为：

```js
if (!existsSync(p)) fail('DanglingBaselineEntry', { message: o.path, path: o.path })
```

把 registered 漂移分支改为：

```js
else if (RENDERED_RULES.includes(o.name)) {
  if (compareBuffers(Buffer.from(renderRenderedRule(o.name), 'utf8'), Buffer.from(target, 'utf8'))) {
    drift += 1
    process.stderr.write(`Mismatch: ${o.path}\n`)
  }
}
```

`fail` 的统一输出已是 `${code}: ${message}`，因此 `message` 传路径即可得到 `Mismatch: rules/<id>.md`。

- [x] **Step 5: 跑测试**

Run: `node --test tools/docgen/builders/agents/test/rule-render.test.mjs`
Expected: `# fail 0`

- [x] **Step 6: 跑 gate**

Run: `node tools/docgen/builders/agents/cli.mjs gate`
Expected: `baseline 19/19`；exit 0

- [x] **Step 7: 提交**

```bash
git add tools/docgen/builders/agents/cli.mjs tools/docgen/builders/agents/test/rule-render.test.mjs
git commit -m "feat: check dormant rules against builders projections"
```

---

## Task 8: BASELINE_RULES 派生 + F09 断言

**Files:**
- Modify: `tools/docgen/builders/agents/components/baseline.mjs:8-10`
- Modify: `scripts/check-observable.test.mjs:574-575`
- Test: `node --test scripts/check-observable.test.mjs --test-name-pattern "F09"`

**Interfaces:**
- Consumes: `listRuleIds`
- Produces: `BASELINE_RULES` 只由 `rules.json` 派生

- [x] **Step 1: 改 `baseline.mjs`**

```js
import { listSeats } from '../../../models/agents/source.mjs';
import { listRuleIds } from '../../rules/rules.mjs';

export const BASELINE_RULES = listRuleIds().map((id) => `rules/${id}.md`);
```

- [x] **Step 2: 改 F09**

在 `check-observable.test.mjs` 顶部加：

```js
import { BASELINE_RULES } from '../tools/docgen/builders/agents/components/baseline.mjs'
```

把 574–575 行替换为：

```js
const rulesJson = JSON.parse(readText(join(REPO, 'tools', 'docgen', 'models', 'rules', 'rules.json')).replace(/^\uFEFF/, ''))
const ids = rulesJson.rules ?? []
assert.ok(BASELINE_RULES.length >= 1, 'BASELINE_RULES 必须非空（由 rules.json 派生）')
assert.deepStrictEqual(BASELINE_RULES, ids.map((i) => `rules/${i}.md`), 'BASELINE_RULES 必须由 rules.json 派生')
assert.strictEqual(BASELINE_RULES.length, ids.length, 'BASELINE_RULES 条数必须等于 rules.json.rules.length')
```

- [x] **Step 3: 跑 F09**

Run: `node --test --test-name-pattern "F09" scripts/check-observable.test.mjs`
Expected: `# fail 0`

- [x] **Step 4: 负例自检**

Run: `node --test --test-name-pattern "F09" scripts/check-observable.test.mjs`（在临时副本里把 `rules.json` 改成 `{"rules":[]}`、删 `rules/evidence-before-conclusion.md`、`cli.mjs baseline --write` 后重跑）
Expected: F09 not ok，失败信息含 `非空`

- [x] **Step 5: 提交**

```bash
git add tools/docgen/builders/agents/components/baseline.mjs scripts/check-observable.test.mjs
git commit -m "refactor: derive BASELINE_RULES from rules.json"
```

---

## Task 9: coldRepo keepGit + env 清洗

**Files:**
- Modify: `tools/docgen/builders/agents/test/support/card-fixtures.mjs:21-38`
- Modify: `scripts/check-all.mjs:89`
- Create: `tools/docgen/builders/agents/test/support/card-fixtures.test.mjs`

**Interfaces:**
- Consumes: 无
- Produces: `coldRepo({ keepGit = false, ... })`

- [x] **Step 1: 写失败测试**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { coldRepo } from './card-fixtures.mjs'

test('coldRepo keepGit=true 复制 .git', () => {
  coldRepo({ keepGit: true, verify: (copy) => assert.ok(existsSync(join(copy, '.git', 'HEAD'))) })
})

test('coldRepo 默认不含 .git', () => {
  coldRepo({ verify: (copy) => assert.ok(!existsSync(join(copy, '.git'))) })
})
```

- [x] **Step 2: 运行确认失败**

Run: `node --test tools/docgen/builders/agents/test/support/card-fixtures.test.mjs`
Expected: FAIL（`.git/HEAD` 不存在）

- [x] **Step 3: 加 `keepGit`**

```js
export const coldRepo = ({ mutate = null, args = ['gate'], verify = null, env = null, keepGit = false } = {}) => {
  // ...原复制逻辑不变...
  if (keepGit) cpSync(join(REPO, '.git'), join(copy, '.git'), { recursive: true })
  if (mutate) mutate(copy)
  // ...rest unchanged...
}
```

- [x] **Step 4: 补 `check-all.mjs` env 清洗**

把第 89 行改为：

```js
for (const key of ['DOCGEN_TMP_ROOT', 'DOCGEN_RULES_DIR', 'DOCGEN_AGENTS_DIR', 'DOCGEN_BASELINE_PATH', 'DOCGEN_BUILD_DATA_DIR', 'DOCGEN_BUILD_OUT_DIR', 'DOCGEN_BUILD_RULES_DIR', 'DOCGEN_TEST_MODE', 'DOCGEN_NESTED', 'NODE_TEST_CONTEXT']) delete testEnv[key]
```

- [x] **Step 5: 跑测试**

Run: `node --test tools/docgen/builders/agents/test/support/card-fixtures.test.mjs`
Expected: `# fail 0`、`# pass 2`

- [x] **Step 6: 提交**

```bash
git add tools/docgen/builders/agents/test/support/card-fixtures.mjs tools/docgen/builders/agents/test/support/card-fixtures.test.mjs scripts/check-all.mjs
git commit -m "test: add keepGit cold repo fixture and env cleanup"
```

---

## Task 10: 全量验收（M1–M3 出口）

**Files:**
- Read: `tools/docgen/render/index.mjs`、`tools/docgen/builders/rules/*.md`、`agents/*.md`

**Interfaces:**
- Consumes: Task 2–9
- Produces: ⑥ 组证据

- [x] **Step 1: 5 份 rule 逐字节**

Run: `node --input-type=module -e "import {readFileSync} from 'node:fs'; import {renderRule} from './tools/docgen/builders/rules/rules.mjs'; const ids=['evidence-before-conclusion','observable-criteria','import-guard','no-git-write','no-unverified-number']; for (const id of ids) console.log(id, renderRule(id)===readFileSync('tools/docgen/builders/rules/'+id+'.md','utf8'))"`
Expected: 5 行 `true`

- [x] **Step 2: 18 席逐字节**

Run: `node tools/docgen/builders/agents/cli.mjs gate`
Expected: `agents 18/18`、`baseline 19/19`

- [x] **Step 3: 引擎被消费 + `renderDoc` 0 命中**

Run: `rg -n "render/index.mjs" tools/docgen/models/agents/render/index.mjs tools/docgen/builders/rules/interpreters.mjs`；`rg -n "renderDoc" tools/docgen --glob "*.mjs" --glob "!*.test.mjs"`
Expected: 前者 2 文件各 ≥1；后者只 3 处（定义 + 两次 `render:`）

- [x] **Step 4: 全量检查**

Run: `npm run check`
Expected: `check 全部通过`；`agents 18/18`；`baseline 19/19`；`判据 5 条 / 绿 34 / 红 0`

- [x] **Step 5: 删引擎负例（冷仓副本）**

在 `tmp/` 副本内删 `tools/docgen/render/index.mjs` 后跑 `node scripts/check-all.mjs`：
Expected: 退出码非 0，输出含 `ERR_MODULE_NOT_FOUND` 或 `Cannot find module` 且点名 `render`；复原后退出码 0。

- [x] **Step 6: 质量不降**

Run: `scs check rules --root . --terms tools/docgen/models/rules/vocab/observable-terms.json --annotations tools/quality/.inspector-annotations.json`
Expected: 首行仍为 `共 1 文件 / 13 行 / 205 字符，平均得分率 57%（不及格）`；与 M0a 的 `baseline.json`（`score 13 / max 23`）逐字段相等。降 ≥1 分或新增红点即按 spec §6 回滚。

- [x] **Step 7: 写 gate 证据**

在 `gate-record.md` 追加 ③ 行：上述三条命令的输出首行 + `docs/superpowers/specs/...design.md` 的 TC 区间映射。

---

## Task 11: M0b 写盘与入口文档同步（D19 授权后）

**Files:**
- Modify: `docs/prd/docgen-index.md:44`
- Modify: `README.md:129`
- Modify: `skills/rule-writer/references/criteria-dsl.md:134`
- Modify: `docs/devworkflows/20261113161413-rule-agent-render-alignment/gate-record.md`（D19 节与 ③ 行）

**Interfaces:**
- Consumes: Task 10 全绿；`## D19 授权` 已填
- Produces: 入口文档与代码同口径；M0b 前后 sha256 证据

- [x] **Step 1: 重跑 M0a 脚本记录写盘前 sha256**

Run: `node scripts/rule-baseline.mjs --check-only --out docs/reports/2026-11-13-rule-baseline-after`
Expected: `baseline 1 条；rules 1 份；builders 5 份`

- [x] **Step 2: 对比前后 sha256**

Run: `node --input-type=module -e "import {readFileSync} from 'node:fs'; const a=JSON.parse(readFileSync('docs/reports/2026-11-13-rule-baseline/manifest.json','utf8')); const b=JSON.parse(readFileSync('docs/reports/2026-11-13-rule-baseline-after/manifest.json','utf8')); console.log(JSON.stringify(a.rulesSha256)===JSON.stringify(b.rulesSha256), JSON.stringify(a.buildersSha256)===JSON.stringify(b.buildersSha256))"`
Expected: `true true`

- [x] **Step 3: 同步 `docgen-index.md`**

把第 44 行 D19 的「**暂停 rule / skill 文件生成**…」改为：

```markdown
| D19 | **rule / skill 文件生成恢复（2026-11-13 用户批准）**：P3、P4 启动范围限于 `docs/superpowers/plans/2026-11-13-rule-agent-render-alignment.md` 的 M0a–M3；`rules/*.md` 仍由判据 json 渲染，手改即红；M4 四维另立 PRD | 用户 2026-11-13（原话见 `docs/devworkflows/20261113161413-rule-agent-render-alignment/gate-record.md` 的 `## D19 授权`） |
```

- [x] **Step 4: 同步 README**

把 `README.md:129` 的 `baseline 19/19` 改为：

```markdown
| `npm run agents:verify` | `gate`：18 席逐字节 + `baseline N/N`（N 由 `rules.json` 派生，不写死；只读） |
```

- [x] **Step 5: 同步 criteria-dsl**

在 `skills/rule-writer/references/criteria-dsl.md:134` 后补一行：

```markdown
- `--data-dir` 必须是平铺数据目录（同目录含 `<id>.json` 与 `rules.json`）；`--out-dir` 写解释器投影，`--rules-dir` 写 `rules/<id>.md`；三者缺目录会自动创建，缺 `rules.json` 即 `InvalidInputPath` exit 2。
```

- [x] **Step 6: 提交**

```bash
git add docs/prd/docgen-index.md README.md skills/rule-writer/references/criteria-dsl.md docs/reports/2026-11-13-rule-baseline-after docs/devworkflows/20261113161413-rule-agent-render-alignment/gate-record.md
git commit -m "docs: sync D19 status and build dir contract"
```

---

## 覆盖对照（PRD F → task）

| 功能点 | 任务 |
|---|---|
| F1 共享 IR 与渲染引擎 | Task 2、Task 3、Task 4 |
| F2 RuleModel 类型系统 | Task 5 |
| F3 统一 CLI 补缺口 | Task 7 |
| F4 统一基线与 golden 证据 | Task 1、Task 8 |
| F5 数据结构共同外壳（首期不做） | 全局约束（不做） |
| F6 质量不下降 | Task 10 Step 6、Task 11 |

## 覆盖对照（spec → task）

| spec 章节 | 落点 |
|---|---|
| §3 共享 IR | Task 2 |
| §3.2 rule 侧 | Task 3 |
| §3.3 agent 侧 | Task 4 |
| §3.4 M1 出口 | Task 10 |
| §4 RuleModel / validate | Task 5 |
| §5.1 CLI/baseline/目录 | Task 6、Task 7 |
| §5.2 BASELINE_RULES 派生 | Task 8 |
| §5.3 M0a 报告 | Task 1 |
| §6 质量门/回滚/D19 | Task 0、Task 11 |
| §10 风险（coldRepo、env） | Task 9 |
| §11 非目标 | 全局约束 |
| PRD §6.1–6.6 | Task 1、3、4、5、6、7、8、10 |

## 回滚

任一步 `npm run check` 变红或 18 席/5 份 rule 出现 `Mismatch`，按 spec §6 三步回滚：

```bash
git restore --source=<M0a SHA> --staged --worktree -- rules/ tools/docgen/ README.md skills/rule-writer/references/criteria-dsl.md docs/prd/docgen-index.md
git clean -fd -- tools/docgen/render tools/docgen/builders/rules/schema.test.mjs tools/docgen/builders/rules/build-dirs.test.mjs
git status
```

回滚后三份联动文档 `git diff` 必须为空。
