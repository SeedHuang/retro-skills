# Docgen P2 · S3：senior-sdet 手写卡转录 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`（推荐）或 `executing-plans` 逐任务执行。步骤用 `- [ ]` 勾选跟踪。
>
> **本计划不执行任何 git 写操作**：每个任务收尾把改动留在工作区，最终由用户决定提交方式（用户全局规则「全局 Git 写操作禁令」）。

**Goal:** 把 `agents/senior-sdet.md`（手写角色卡）转录成 docgen 组件数据，用第二套模板 `agent-handwritten.md.tpl` 渲染，除来源声明行外逐字节复现迁移前快照，走完九步闭环到「已巩固」，并落 W2 验收。

**Architecture:** 数据层（`agentData` 条目 + `triggerTable`）→ 模板层（`agent-handwritten.md.tpl` 九节 + 7 槽位）→ 纯渲染层（`renderAgent.mjs` 按 `outputKind` 分流）→ 比对层（`compare.mjs` 新增 `diffSet`）→ 编排层（`cli.mjs` generate / draft / replace）→ 证据层（`fixtures/senior-sdet.evidence.json`）→ 验收层（`acceptance/golden-assert.mjs` / `render13-snapshot.mjs`）。测试落点：纯数据/模板/渲染走 `tools/docgen/test/*.test.mjs`（进 `npm run check`）；需要真实替换、冷跑、`npm run check` 的验收用例走可复算命令，由本计划逐条执行并落记录。

**Tech Stack:** Node ≥22 内置模块；零第三方依赖；PowerShell 5.1 + Git（所有字节写盘用 `node writeFileSync`，禁用 PS `>` / `Out-File` / `git show --output`）。

**Spec:** `docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design.md`（**已定稿** 2026-10-20，议会 9 轮：四席 PASS + 审计 A/B 两节 PASS）

**Testcase:** `docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design-testcase.md`（revision6，31 条 / 正 15 / 负 15 / 边界 1）

## Global Constraints

- **转录零改写**：除来源声明行外逐字节保留；来源行逐字 = spec §3「改后」一行（spec 第 97 行，单源）。
- **四键归属**：`when` / `notWhen` / `route` / `fallback` 只住 `triggerTable`，`agentData` 条目一律不含。
- **notWhen 不进正文**：两套模板都不加 `{{NOT_WHEN}}`。
- **排除来源声明行只按行内容匹配**：不得按行号、不得按 `>` 前缀（`diffSet` 的判据）。
- **generate / gate 仍走整缓冲 `compareBuffers`**，`diffSet` 只服务步 4 验收与 golden-assert。
- **黄金值 = 步 1 冻结快照**（`evidence.commit` / `blob`），不是替换后的现卡；替换后禁止重跑 `init-evidence`。
- 落盘文件 LF / UTF-8 / 无 BOM / 末尾恰一个 `\n`。
- `agents/senior-sdet.md` 替换后是**生成视图**，禁止手改；差异回炉改组件或模板。
- 收尾干净口径：`git status --short rules/ skills/` 无输出 **且** `git diff --numstat -- agents/senior-sdet.md` 前两列 == `1 1`、第三列 == `agents/senior-sdet.md`。
- 每个任务结束：改动留在工作区，不执行 `git add` / `git commit` / `git push`。

---

## File Structure

| 文件 | 职责 | 任务 |
|---|---|---|
| `tools/docgen/fixtures/senior-sdet.evidence.json` | 步 1 锚点（commit / blob / sha256 / hashObject）与步 4 回填 | 1、7 |
| `tools/docgen/components/agentData.mjs` | senior-sdet 条目补 heading / sourceLine / identity / fixedList；自评注释 | 2 |
| `tools/docgen/templates/agent-handwritten.md.tpl` | 由 5 节占位骨架重写为 9 节真模板（7 槽位） | 3 |
| `tools/docgen/components/renderAgent.mjs` | 补 `{{HEADING}}` / `{{SOURCE_LINE}}` 填充；`testcase` 走整行直拼；残留槽位守卫 | 4 |
| `tools/docgen/components/compare.mjs` | 新增 `diffSet(actualBuf, expectedBuf, ignorable)` | 5 |
| `tools/docgen/test/diffset.test.mjs` | `diffSet` 判别力（内容匹配 vs 行号跳过 vs `>` 前缀跳过） | 5 |
| `tools/docgen/test/sdet-data.test.mjs` | 条目 10 键 / 四键互斥 / notWhen / 自评痕 / H1≠role | 2 |
| `tools/docgen/test/sdet-template.test.mjs` | 9 节逐字 / 7 槽位 / 模板纯度 / tools 行 / 无 `{{NOT_WHEN}}` | 3 |
| `tools/docgen/test/sdet-render.test.mjs` | 渲染 tools 行 / notWhen 恰 1 次 / 9 条整行直拼 / 无槽位残留 | 4 |
| `tools/docgen/acceptance/render13-snapshot.mjs` | 议会席 fixture 渲染快照（含脚本自检） | 4 |
| `tools/docgen/acceptance/golden-assert.mjs` | description 按 `outputKind` 分流 + 整文件比较改 `diffSet` | 6 |
| `tools/docgen/cli.mjs` | `cmdReplace` 补 `goldenAssertion !== 'pass'` 拒绝 | 6 |
| `tools/docgen/state.json` | senior-sdet 置 `replaced` | 8 |
| `agents/senior-sdet.md` | 由 docgen 替换（除来源行外与快照逐字节一致） | 8 |

---

## Task 1：入选 —— 冻结迁移前快照 + 写 evidence（步 1）

**Files:**
- Create: `tools/docgen/fixtures/senior-sdet.evidence.json`（由 `init-evidence.mjs` 生成）

**Interfaces:**
- Produces: evidence 八字段（`commit` = `ef16f0e…`、`blob` = `3469455…`、`goldenAssertion='pending'`、`renderSha256='pending'`、`lastWrittenHash=旧卡 SHA256`）；临时冻结副本 `$w2/sdet-frozen-346945525357.md`。

- [x] **Step 1：确认工作区 == HEAD（冻结的才是迁移前最后版本）**

```powershell
$repo = (git rev-parse --show-toplevel).Trim(); Set-Location $repo
$w2 = Join-Path ([IO.Path]::GetTempPath()) 'sdet-w2'; New-Item -ItemType Directory -Force $w2 | Out-Null
$h1 = (git hash-object agents/senior-sdet.md).Trim(); $h2 = (git rev-parse HEAD:agents/senior-sdet.md).Trim()
"$h1`n$h2"; if ($h1 -ne $h2) { throw 'workspace != HEAD' }
```

- [x] **Step 2：按字节冻结（node 写盘，文件名带 blob 前 12 位）**

```powershell
$blob = (git rev-parse HEAD:agents/senior-sdet.md).Trim()
$frozen = Join-Path $w2 ('sdet-frozen-' + $blob.Substring(0,12) + '.md')
node -e "const fs=require('node:fs');const {execFileSync}=require('node:child_process');const rev=process.argv[1],out=process.argv[2];const buf=execFileSync('git',['show',rev+':agents/senior-sdet.md']);fs.writeFileSync(out,buf);console.log('wrote '+out+' bytes='+buf.length)" 'HEAD' "$frozen"
```

- [x] **Step 3：冻结自检（防 PS 重定向转码）**

```powershell
(git hash-object $frozen).Trim() -eq $blob
(Get-FileHash $frozen -Algorithm SHA256).Hash -eq (Get-FileHash agents/senior-sdet.md -Algorithm SHA256).Hash
```

- [x] **Step 4：初始化 evidence（只跑一次；替换后禁止重跑）**

```powershell
node tools/docgen/acceptance/init-evidence.mjs senior-sdet
node -e "const fs=require('node:fs');const e=JSON.parse(fs.readFileSync('tools/docgen/fixtures/senior-sdet.evidence.json','utf8'));console.log(JSON.stringify(e,null,2));process.exitCode=(e.renderSha256==='pending'&&e.lastWrittenHash===e.sha256)?0:1"
```

- [x] **Step 5：断言锚点**

`evidence.commit` == `git log -1 --format=%H -- agents/senior-sdet.md`；`evidence.blob` == `$blob`；`evidence.hashObject` == 旧卡 blob；`renderSha256 === 'pending'`。

> **三哈希不得同值**：本席 `lastWrittenHash`（旧卡）与 `renderSha256`（渲染）在步 7 之后必然不等；照抄 `reviewer-audit.evidence.json`（三项同值）会在步 7 得 `TargetDrift`。

---

## Task 2：数据迁移 —— agentData 条目 + 自评（步 2 数据部分）

**Files:**
- Modify: `tools/docgen/components/agentData.mjs:35`（senior-sdet 条目）与条目上方注释
- Test: `tools/docgen/test/sdet-data.test.mjs`

**Interfaces:**
- Produces: 条目 10 键全在（`dimension` / `sharedBlock` 显式 `undefined`）；`fixedList.length === 9`；`sourceLine` 逐字 == spec 第 97 行；`triggerTable['senior-sdet'].notWhen` 保持 `{ text, refs: ['reviewer-qa'] }`。

- [x] **Step 1：写失败测试 `tools/docgen/test/sdet-data.test.mjs`**

覆盖 TC-002(a)、TC-004、TC-005、TC-007（数据字段部分）：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { agentData, triggerTable } from '../components/agentData.mjs';

const entry = () => agentData.find((a) => a.name === 'senior-sdet');
const KEYS = ['name','heading','role','dimension','tools','identity','fixedList','sourceLine','outputKind','sharedBlock'];

test('TC-002(a)：10 键全在 + 四键互斥 + fixedList === 9', () => {
  const e = entry();
  for (const k of KEYS) assert.ok(Object.prototype.hasOwnProperty.call(e, k), `缺键 ${k}`);
  assert.deepEqual(Object.keys(e).sort(), [...KEYS].sort());
  for (const k of ['when','notWhen','route','fallback']) assert.equal(k in e, false);
  assert.equal(e.fixedList.length, 9);
  assert.equal(e.dimension, undefined);
  assert.equal(e.sharedBlock, undefined);
  assert.equal(e.outputKind, 'testcase');
  assert.deepEqual(e.tools, ['Read','Glob','Grep','Write','Edit']);
});

test('TC-007：heading !== role，when 不含尾随「时」，route === name', () => {
  const e = entry(); const t = triggerTable['senior-sdet'];
  assert.equal(e.heading, 'Senior SDET（测试设计与盲点猎手）');
  assert.equal(e.role, '资深测试开发工程师（Senior SDET）');
  assert.ok(!t.when.endsWith('时'));
  assert.equal(t.route, 'senior-sdet');
});

test('TC-004：notWhen 结构化、文本逐字、refs 合法', () => {
  const t = triggerTable['senior-sdet'];
  assert.ok(Object.prototype.hasOwnProperty.call(t, 'notWhen'));
  assert.deepEqual(Object.keys(t.notWhen).sort(), ['refs','text']);
  assert.equal(t.notWhen.text, '修改业务代码、写实现方案、或只读的议会评审（那走 reviewer-qa）');
  assert.deepEqual(t.notWhen.refs, ['reviewer-qa']);
  assert.ok(agentData.some((a) => a.name === 'reviewer-qa'));
});

test('TC-005：自评注释绑到条目（前 ≤15 行内含 translation-self-check + 详细 + 逻辑化）', () => {
  const lines = readFileSync('tools/docgen/components/agentData.mjs', 'utf8').split('\n');
  const i = lines.findIndex((l) => /name:\s*'senior-sdet'/.test(l));
  assert.ok(i >= 0);
  const hit = lines.slice(Math.max(0, i - 15), i + 1)
    .filter((l) => l.includes('translation-self-check') && l.includes('详细') && l.includes('逻辑化'));
  assert.ok(hit.length >= 1);
});
```

- [x] **Step 2：跑测试确认红**

`node --test tools/docgen/test/sdet-data.test.mjs`

- [x] **Step 3：写条目（逐字转录，仅来源行按 spec 改后文本）**

在 `SKELETON` 的 senior-sdet 条目上方加自评注释，条目改为：

```js
  // translation-self-check: 详细——identity 两段与 7 节正文全量保留，不省略隐含语义；逻辑化——数据槽（heading/sourceLine/identity/fixedList）与模板常量按 spec §3.1 逐行归属，关系明确。
  {
    name: 'senior-sdet',
    heading: 'Senior SDET（测试设计与盲点猎手）',
    role: '资深测试开发工程师（Senior SDET）',
    dimension: undefined,
    tools: patternRegistry.tools.sdet,
    sourceLine: '> 来源：docgen 生成。本角色卡由 tools/docgen 生成（第二套模板 agent-handwritten.md.tpl）；改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换。',
    identity: '有十年以上经验的测试开发工程师（SDET）。……\n\n你的名声来自两件事：……',
    fixedList: [ /* 9 条整行原文，含 | 与行内加粗 */ ],
    sharedBlock: undefined,
    outputKind: 'testcase',
  },
```

`identity` 与 `fixedList` 的每个字都从冻结副本抄，**不重新措辞**（`identity` 两段之间是一个 `\n\n`）。

- [x] **Step 4：跑测试确认绿**

`node --test tools/docgen/test/sdet-data.test.mjs` → 全绿。

---

## Task 3：模板重写 —— 9 节 + 7 槽位（步 2 模板常量部分）

**Files:**
- Rewrite: `tools/docgen/templates/agent-handwritten.md.tpl`
- Test: `tools/docgen/test/sdet-template.test.mjs`

**Interfaces:**
- Produces: 模板含且仅含 `{{NAME}}` `{{DESCRIPTION}}` `{{TOOLS}}` `{{HEADING}}` `{{SOURCE_LINE}}` `{{IDENTITY}}` `{{FIXED_LIST}}`；9 个 `##` 节标题逐字；固定清单表头 + 分隔行为模板常量，紧贴 `{{FIXED_LIST}}` 上方。

- [x] **Step 1：写失败测试 `tools/docgen/test/sdet-template.test.mjs`**（TC-006 / TC-002(b)(c)(d) / TC-023）

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { agentData } from '../components/agentData.mjs';

const tpl = () => readFileSync('tools/docgen/templates/agent-handwritten.md.tpl', 'utf8');
const entry = () => agentData.find((a) => a.name === 'senior-sdet');

test('TC-006：9 节逐字全等且顺序一致', () => {
  const got = [...tpl().matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(got, ['你是谁','你负责三件事','三条铁律','输入（四样，缺一不写）',
    '测试设计固定清单（每条必答，"没问题"也要写结论）','自由探索（必做）','输出格式','通用纪律','边界']);
});

test('TC-002(b)：槽位恰 7 种（字典序）', () => {
  const uniq = [...new Set([...tpl().matchAll(/\{\{[A-Z_]+\}\}/g)].map((x) => x[0]))].sort();
  assert.deepEqual(uniq, ['{{DESCRIPTION}}','{{FIXED_LIST}}','{{HEADING}}','{{IDENTITY}}','{{NAME}}','{{SOURCE_LINE}}','{{TOOLS}}']);
});

test('TC-002(c)：模板纯度（从数据取值做探针，命中 0）', () => {
  const e = entry(); const t = tpl();
  const probes = [e.heading, e.role, e.sourceLine,
    ...e.identity.split('\n').map((l) => l.trim()).filter((l) => l.length >= 8),
    ...e.fixedList];
  const hit = probes.filter((p) => p && t.includes(p));
  assert.deepEqual(hit, []);
});

test('TC-002(d)：tools 行逐字 == tools: {{TOOLS}}', () => {
  assert.equal(tpl().split('\n').find((l) => l.startsWith('tools:')), 'tools: {{TOOLS}}');
});

test('TC-023：两套模板均无 {{NOT_WHEN}} 与裸 notWhen', () => {
  for (const p of ['tools/docgen/templates/agent.md.tpl','tools/docgen/templates/agent-handwritten.md.tpl']) {
    const s = readFileSync(p, 'utf8');
    assert.equal(s.includes('{{NOT_WHEN}}'), false, p);
    assert.equal(s.includes('notWhen'), false, p);
  }
});
```

- [x] **Step 2：跑测试确认红**

- [x] **Step 3：重写模板（结构常量逐字取自冻结副本）**

骨架（`{{...}}` 之外的字都必须来自现卡，可逐字节对照）：

```
---
name: {{NAME}}
description: {{DESCRIPTION}}
tools: {{TOOLS}}
---

# 角色：{{HEADING}}

{{SOURCE_LINE}}

## 你是谁

{{IDENTITY}}

## 你负责三件事

<现卡 19–23 行表格，逐字>

## 三条铁律

<现卡 27–29 行，逐字>

## 输入（四样，缺一不写）

<现卡 33–38 行表格，逐字>

## 测试设计固定清单（每条必答，"没问题"也要写结论）

| # | 必答 |
|---|---|
{{FIXED_LIST}}

## 自由探索（必做）

<现卡 56 行，逐字>

## 输出格式

<现卡 60–68 行，逐字；含“给开发的建议”的代码块与反引号，不槽位化>

## 通用纪律

<现卡 72–76 行，逐字>

## 边界

<现卡 80–82 行，逐字>
```

- [x] **Step 4：跑测试确认绿**（`node --test tools/docgen/test/sdet-template.test.mjs`）

---

## Task 4：渲染层 —— 两个新槽位 + fixedList 分流 + 残留守卫（步 3 前提）

**Files:**
- Modify: `tools/docgen/components/renderAgent.mjs`
- Create: `tools/docgen/acceptance/render13-snapshot.mjs`
- Test: `tools/docgen/test/sdet-render.test.mjs`

**Interfaces:**
- Produces: `renderAgent` 填 `{{HEADING}}` / `{{SOURCE_LINE}}`；`outputKind === 'testcase'` 时 `fixedList` 走 `join('\n')`，其余分支保持单元格重拼；产物残留 `{{[A-Z_]+}}` → 抛 `MissingSlot`；`render13-snapshot.mjs --module <path> --out <file>`。

- [x] **Step 1：先取「改前」13 席快照（未提交态锚点）**

`evidence.commit`（`ef16f0e`）早于 docgen 建立，`renderAgent.mjs` 在该 commit 不存在 → 按 testcase TC-031 前置直接走「未提交态」兜底：

```powershell
$beforeHash = (git hash-object tools/docgen/components/renderAgent.mjs).Trim()
node tools/docgen/acceptance/render13-snapshot.mjs --module (Join-Path $repo 'tools/docgen/components/renderAgent.mjs') --out (Join-Path $w2 'render13-before.md')
```

账本记录：锚点 = 未提交态，基准 hash = `$beforeHash`。

- [x] **Step 2：写失败测试 `tools/docgen/test/sdet-render.test.mjs`**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderByName } from '../cli.mjs';
import { agentData } from '../components/agentData.mjs';

test('渲染 tools 行 + notWhen 只出现 1 次且在 description 行', () => {
  const r = renderByName('senior-sdet').split('\n');
  assert.equal(r.find((l) => l.startsWith('tools:')), 'tools: Read, Glob, Grep, Write, Edit');
  const hits = r.filter((l) => l.includes('修改业务代码、写实现方案'));
  assert.equal(hits.length, 1);
  assert.ok(hits[0].startsWith('description:'));
});

test('固定清单整行直拼为 9 行（不重拼「必问/待答」）', () => {
  const r = renderByName('senior-sdet');
  assert.equal((r.match(/^\| \d+ \| .+ \|$/gm) || []).length, 9);
  assert.equal(r.includes('| 待答 |'), false);
  assert.ok(r.includes('| # | 必答 |'));
});

test('产物无槽位残留 + testcase 席恰 ['senior-sdet']', () => {
  const r = renderByName('senior-sdet');
  assert.equal([...r.matchAll(/\{\{[A-Z_]+\}\}/g)].length, 0);
  assert.deepEqual(agentData.filter((a) => a.outputKind === 'testcase').map((a) => a.name), ['senior-sdet']);
});
```

- [x] **Step 3：改 `renderAgent.mjs`**

```js
function fixedListBlock(agent) {
  if (agent.outputKind === 'testcase') return (agent.fixedList ?? []).join('\n');
  return agent.fixedList && agent.fixedList.length
    ? `| # | 必问 | 回答 |\n|---|---|---|\n${agent.fixedList.map((q, i) => `| ${i + 1} | ${q} | 待答 |`).join('\n')}`
    : '| # | 必问 | 回答 |\n|---|---|---|';
}
```

- 增加 `fill(out, '{{HEADING}}', agent.heading ?? '')` 与 `fill(out, '{{SOURCE_LINE}}', agent.sourceLine ?? '')`；
- `{{FIXED_LIST}}` 改为填 `fixedListBlock(agent)`；
- 末尾残留守卫：`if (/\{\{[A-Z_]+\}\}/.test(out)) { const e = new Error('MissingSlot'); e.code = 'MissingSlot'; throw e; }`（`MissingSlot` 已在 exit 1 档）。

- [x] **Step 4：新建 `tools/docgen/acceptance/render13-snapshot.mjs`**

接口 `--module <renderAgent 模块绝对路径> --out <输出文件>`；固定 fixture：

```js
{ name:'fixture-13', role:'评审员', dimension:'技术实现', tools:['Read','Glob','Grep'],
  identity:'桩。', fixedList:['SDET_FIXTURE_ROW_1','SDET_FIXTURE_ROW_2'],
  outputKind:'issue-card', sharedBlock:'AUDIT_RULES' }
// trigger = { when:'当需要评审某份 spec' }；template = agent.md.tpl 内容
```

- 动态 `import(pathToFileURL(module))` 调 `renderAgent`，共享块与输出格式从同仓 import；
- **脚本自检**：产物必须含 `role` / `dimension` / `tools[0]` / `SDET_FIXTURE_ROW_1` / `AUDIT_RULES` 展开文本，任一缺失 exit 1；
- 写盘用 `writeFileSync(out, buf)`，打印字节数与 sha256。

- [x] **Step 5：取「改后」快照并逐字节比对**

```powershell
node tools/docgen/acceptance/render13-snapshot.mjs --module (Join-Path $repo 'tools/docgen/components/renderAgent.mjs') --out (Join-Path $w2 'render13-after.md')
node -e "const fs=require('node:fs');const [a,b]=process.argv.slice(1);const x=fs.readFileSync(a),y=fs.readFileSync(b);console.log(x.equals(y)?'EQUAL':'DIFF');process.exitCode=x.equals(y)?0:1" (Join-Path $w2 'render13-before.md') (Join-Path $w2 'render13-after.md')
git hash-object tools/docgen/components/renderAgent.mjs   # 必须 != $beforeHash
```

- [x] **Step 6：跑新测试 + 既有黄金测试**

`node --test tools/docgen/test/sdet-render.test.mjs tools/docgen/test/pilot-render.test.mjs` 全绿。

---

## Task 5：`diffSet` —— 按行内容排除（步 4 的唯一新代码）

**Files:**
- Modify: `tools/docgen/components/compare.mjs`
- Test: `tools/docgen/test/diffset.test.mjs`

**Interfaces:**
- Produces: `diffSet(actualBuf, expectedBuf, ignorable = []) → { raw, unallowed }`；`line` 记**期望侧**内容，期望侧无该行时为 `null`；`index` 0 基；排除只看 `line` 内容。

- [x] **Step 1：写失败测试（TC-024 双样本 × 三实现）**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { diffSet } from '../components/compare.mjs';

const NL = '\n';
// content-match = 真实现；两个变异体是测试内局部函数
const indexSkip = (a, b, skipIdx) => diffSet(a, b, []) // 用真实现取 raw，再模拟「无条件跳过 skipIdx」
  .raw.filter((d) => d.index !== skipIdx);
const prefixSkip = (r) => r.raw.filter((d) => !(d.line || '').startsWith('>'));
const buf = (rows) => Buffer.from(rows.join(NL) + NL, 'utf8');
const srcOld = '> 来源：旧';
const srcNew = '> 来源：新';

test('样本 A：行号偏移 → 按 index 8 跳过必漏检', () => {
  const expected = ['---','name: x','description: d','tools: Read','---','','# 角色：x','','正文 A','> 来源：旧','尾'];
  const actual   = ['---','name: x','description: d','tools: Read','---','','# 角色：x','','正文 A 改','> 来源：新','尾'];
  const r = diffSet(buf(actual), buf(expected), [srcOld, srcNew]);
  assert.deepEqual(r.unallowed.map((d) => d.index), [8]);
  assert.equal(r.raw.length, 2);
  assert.equal(r.raw[1].line, srcOld);
  assert.deepEqual(indexSkip(buf(actual), buf(expected), 8).map((d) => d.index), [9]); // 漏检 8
});

test('样本 B：`>` 前缀跳过必漏检', () => {
  const expected = ['a','b','> 说明：手写','c','d','e','f','g','h','> 来源：旧','尾'];
  const actual   = ['a','b','> 说明：docgen','c','d','e','f','g','h','> 来源：新','尾'];
  const r = diffSet(buf(actual), buf(expected), [srcOld, srcNew]);
  assert.deepEqual(r.unallowed.map((d) => d.index), [2]);
  assert.deepEqual(prefixSkip(r).map((d) => d.index), []);  // 漏检 2
});
```

- [x] **Step 2：跑测试确认红**（`diffSet is not a function`）

- [x] **Step 3：实现 `diffSet`**（切 `\n`，两侧逐 index 比；`line` 取期望侧；`unallowed` 只按 `line` 是否在 `ignorable` 判定；`null` 视为不在）

- [x] **Step 4：跑测试确认绿**

`node --test tools/docgen/test/diffset.test.mjs` → 输出 `content-match` 双样本检出、两个变异体各自漏检。

---

## Task 6：golden-assert 分流 + replace 黄金断言校验（步 4 回填入口）

**Files:**
- Modify: `tools/docgen/acceptance/golden-assert.mjs`
- Modify: `tools/docgen/cli.mjs`（`cmdReplace` evidence 校验处）

**Interfaces:**
- Produces: `golden-assert` 对 `outputKind='testcase'` 用 `description.handwritten`；整文件比较改 `diffSet` 并豁免 `{快照来源行, agent.sourceLine}`；`compareResult` 写 `null` 或 `{ code:'Mismatch' }`；`cmdReplace` 在 `goldenAssertion !== 'pass'` 时 `EvidenceInvalid`（exit 2）。

- [x] **Step 1：改 `golden-assert.mjs`**

- `derived` 按 `agent.outputKind` 分流；
- `cmp` 改为 `diffSet(renderedBytes, snapshotBytes, [snapshotSourceLine, agent.sourceLine])`：`unallowed.length === 0 && raw.length <= 1` → `compareResult = null`，否则 `{ code: 'Mismatch' }`；
- `snapshotSourceLine` = 快照中以 `> 来源：` 开头那一行；
- 保留 `renderSha256` 写盘时序（早于退出）；
- 退出码语义不变：`goldenOk === false` 或 `compareResult !== null` → exit 1。

- [x] **Step 2：改 `cmdReplace`**

在 `evidence.renderSha256` 校验之后补：

```js
if (evidence.goldenAssertion !== 'pass') {
  fail('EvidenceInvalid', { name, reason: '黄金断言未通过（W2-② 未过不得替换）' });
}
```

- [x] **Step 3：回归既有测试**

`node --test tools/docgen/test/pilot-gate.test.mjs tools/docgen/test/review-fixes.test.mjs` → 全绿（缺 evidence 仍 exit 2；reviewer-audit 路径不受影响）。

---

## Task 7：生成 + 逐字节比对 + 落草稿（步 3–6）

**Files:**
- Modify: `tools/docgen/fixtures/senior-sdet.evidence.json`（步 4 回填 `renderSha256` / `compareResult`）
- Create: 草稿箱临时文件（`$env:DOCGEN_DRAFTS_DIR`）

- [x] **Step 1：`generate` —— 替换前必然 exit 1（预期，不是失败）**

```powershell
$env:DOCGEN_DRAFTS_DIR = Join-Path $w2 'drafts'
node tools/docgen/cli.mjs generate --kind agent --name senior-sdet; "exit=$LASTEXITCODE"
```

判据：exit **1**；stdout 恰一行 `baseline N/N`；stderr 空；`git status --short agents/senior-sdet.md` 无输出。

- [x] **Step 2：`diffSet` 判「唯一差异 = 来源行」（TC-010 `exact1`）**

```powershell
node --input-type=module -e "const fs=await import('node:fs');const u=await import('node:url');const NL=String.fromCharCode(10),BT=String.fromCharCode(96);const root=process.argv[1],golden=process.argv[2];const cli=await import(u.pathToFileURL(root+'/tools/docgen/cli.mjs').href);const cmp=await import(u.pathToFileURL(root+'/tools/docgen/components/compare.mjs').href);const S=fs.readFileSync(root+'/docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design.md','utf8').split(NL);const OLD=S[95].slice(S[95].indexOf('：'+BT+BT)+3,-2);const NEW=S[96].slice(S[96].lastIndexOf('：'+BT)+2,-1);const a=Buffer.from(cli.renderByName('senior-sdet'),'utf8');const b=fs.readFileSync(golden);const r=cmp.diffSet(a,b,[OLD,NEW]);console.log('raw='+r.raw.length+' unallowed='+r.unallowed.length);for(const d of r.raw)console.log('  idx='+d.index+' line='+JSON.stringify(d.line));const ok=(r.unallowed.length===0&&r.raw.length===1&&r.raw[0].line===OLD&&r.raw[0].index===b.toString('utf8').split(NL).indexOf(OLD));console.log('diffset-mode->'+(ok?'PASS':'FAIL'));process.exitCode=ok?0:1" . "$frozen"
```

- [x] **Step 3：归一化复验（TC-010 步⑤）**

先用 node 把冻结副本的来源行 OLD 换成 NEW 写成 `$w2/sdet-normalized.md`，把渲染按字节写成 `$w2/sdet-render.md`，再做【字节比较】→ 必须 `EQUAL`。

- [x] **Step 4：回填 evidence**

```powershell
node tools/docgen/acceptance/golden-assert.mjs senior-sdet; "exit=$LASTEXITCODE"
```

判据：exit **0**；打印「黄金断言通过」；evidence 的 `goldenAssertion='pass'`、`compareResult=null`、`renderSha256` = 渲染 SHA256（≠ `lastWrittenHash`）。

- [x] **Step 5：落草稿并留副本（TC-011）**

```powershell
node tools/docgen/cli.mjs draft --kind agent --name senior-sdet
$draft = Join-Path $env:DOCGEN_DRAFTS_DIR (@(node tools/docgen/cli.mjs draft ls --name senior-sdet)[0])
node -e "const fs=require('node:fs');fs.copyFileSync(process.argv[1],process.argv[2]);console.log('draft-copy ok')" "$draft" (Join-Path $w2 'sdet-draft-copy.md')
```

判据：`draft ls` 恰 1 条、名称匹配 `^senior-sdet--\d{8}-\d{6}\.md$`；草稿字节 == 渲染字节；`agents/senior-sdet.md` 零改动。

---

## Task 8：替换 + W2 验收 + A 组结构项（步 7–8）

**Files:**
- Modify: `agents/senior-sdet.md`（由 replace 写）
- Modify: `tools/docgen/state.json`（senior-sdet → `replaced`）

- [x] **Step 1：替换**

```powershell
node tools/docgen/cli.mjs replace --kind agent --name senior-sdet --draft $draft --yes; "exit=$LASTEXITCODE"
```

判据：exit 0；`state.agents['senior-sdet'] === 'replaced'`；草稿箱该名下已清。

- [x] **Step 2：替换后文件 == 替换前草稿副本（必须拿步 6 的副本比）**

【字节比较】`$w2/sdet-draft-copy.md` 与 `agents/senior-sdet.md` → `EQUAL`。

- [x] **Step 3：W2 三查（锚点 = 冻结副本，不读现卡）**

- `diffSet` 复跑（同 Task 7 步 2）→ `exact1` PASS；
- `generate --kind agent --name senior-sdet` → **exit 0**（替换后同一条命令的两个状态）；
- description 逐字 == 冻结副本 description 行（TC-003 命令）。

- [x] **Step 4：TC-001b 重锁断言**

`evidence.lastWrittenHash === sha256(agents/senior-sdet.md)`（大写 64 位）；冻结副本 SHA256 与 Task 1 记录一致；`commit` / `blob` / `sha256` / `hashObject` **未变**。

- [x] **Step 5：A 组结构项（TC-030，手工命令，不在 `npm run check` 内）**

```powershell
node --input-type=module -e "const m=await import('./tools/execution-matrix/check-agent.mjs');const r=m.checkAgentFile('senior-sdet');const codes=r.findings.map(f=>f.code);const bad=codes.filter(c=>['CardNotFound','InvalidAnnotation'].includes(c));const s=codes.filter(c=>['A3','A4','A5','A6','A7'].includes(c));console.log('codes='+JSON.stringify(codes));console.log('fake-green='+JSON.stringify(bad));console.log('struct-red='+s.length);process.exitCode=(bad.length||s.length)?1:0"
node -e "const s=require('node:fs').readFileSync('agents/senior-sdet.md','utf8');const m=[...s.matchAll(/\{\{[A-Z_]+\}\}/g)].map(x=>x[0]);console.log('residue='+JSON.stringify(m));process.exitCode=m.length?0:1"
```

判据：`struct-red=0`、`fake-green=[]`、`residue=[]`。

---

## Task 9：巩固（步 9）+ 全仓验收

**Files:** 无新增（只跑守卫与账本记录）

- [x] **Step 1：gate 连续 2 次绿**

`node tools/docgen/cli.mjs gate` 两次（第二次前可 `Set-Location` 到子目录再跑，验证路径无关），均 exit 0 且 stdout `baseline N/N`。

- [x] **Step 2：隔目录冷跑 + 崩溃恢复（复用既有脚本）**

```powershell
node tools/docgen/acceptance/cold-run.mjs; "exit=$LASTEXITCODE"
node tools/docgen/acceptance/replace-scenarios.mjs; "exit=$LASTEXITCODE"   # 末行 PASS 6/6
```

- [x] **Step 3：`npm run check` 全绿**

判据：tests 全 pass（原 452 + 新增 diffset/sdet-data/sdet-template/sdet-render 用例）、baseline 35/35、0 findings、markdown 通过、exit 0。

- [x] **Step 4：干净口径三项**

```powershell
git status --short rules/ skills/          # 无输出
git diff --numstat -- agents/senior-sdet.md  # 1<TAB>1<TAB>agents/senior-sdet.md
node tools/docgen/cli.mjs draft ls --name senior-sdet   # 无输出
```

- [x] **Step 5：旧来源退役 + 人工抽查**

`test -e skills/parliament/scripts/gen-agents.mjs` → 不存在；人工通读替换后的卡与冻结副本，确认语义无漂移（§5 只手动验证第 1 项）。

- [x] **Step 6：账本记录**

- W2 人工抽查记录（你是谁 / 三条铁律 / 固定清单 / 边界 四节，逐字 + 语义结论）；
- 冻结副本路径、旧卡 SHA256、TC-031 锚点（未提交态 + 基准 hash）；
- 自评痕内容与真实性结论。

---

## 验收映射（testcase → plan 任务）

| 用例 | 落点 |
|---|---|
| TC-001a / 001b | Task 1 / Task 8 步 4 |
| TC-002 (a)(b)(c)(d)(e)(f) | Task 2 / Task 3 / Task 4 / Task 7 步 2 |
| TC-003 / TC-004 / TC-005 / TC-006 / TC-007 | Task 7 步 3 / Task 2 / Task 2 / Task 3 / Task 2 |
| TC-008 / TC-009 / TC-010 / TC-011 / TC-012 / TC-013 | Task 9 / Task 7 步 1 / Task 7 步 2–3 / Task 7 步 5 / Task 8 / Task 9 |
| TC-014 / TC-016 / TC-021 | 副本仓注入（`diffSet --mode fail/overflow1/truncated`，Task 5 落地后执行） |
| TC-015 / TC-017 / TC-018 / TC-019 / TC-020 | 内存变异或单文件副本（Task 2/3/5 落地后执行） |
| TC-022 / TC-023 | Task 3（TC-023 已进单测；TC-022 走副本仓） |
| TC-024 / TC-025 / TC-026 / TC-027 / TC-028 / TC-029 | Task 5 / Task 9 / 副本仓停损 / 单测 + 端到端 / Task 9 步 4 / Task 8（负例） |
| TC-030 / TC-031 | Task 8 步 5 / Task 4 步 1、5 |

## 不测（与 testcase §6 一致）

- 13 席真卡字节（S4）；翻译闭环；词表实现；senior-sdet 专属崩溃恢复（复用代表席 `reviewer-audit`）；`§3.1` 模板复用定性（文档约定）。

---

## 执行记录（2026-10-20 实跑）

| 项 | 结果 |
|---|---|
| 迁移前快照 | `git show HEAD:agents/senior-sdet.md` → `$w2/sdet-frozen-346945525357.md`，blob `346945525357`、SHA256 `4D78162D…CDF27`；工作区 == HEAD |
| evidence | `commit ef16f0e` / `blob 346945525357` / `goldenAssertion=pass` / `compareResult=null` / `renderSha256=717803BE…E7BF` / `lastWrittenHash=717803BE…E7BF` |
| 步 3 生成 | 替换前 `generate` exit **1**（stderr 空）；替换后 exit **0**（`baseline 35/35`） |
| 步 4 比对 | `diffSet(render, frozen, [OLD,NEW])` → `raw=1`（`idx=8`，`line=OLD`）、`unallowed=0` → `exact1 PASS`；归一化后整文件 `EQUAL` |
| 步 6 草稿 | 草稿字节 == 渲染字节；`agents/` 零改动 |
| 步 7 替换 | `replace --yes` exit 0；替换后卡 == 替换前草稿副本 `EQUAL`；`state.agents['senior-sdet']='replaced'`；草稿箱已清 |
| 步 8 验收 | `git diff --numstat` = `1 1 agents/senior-sdet.md`（定向核 `-`/`+` 恰为来源行）；`checkAgentFile('senior-sdet')` → `struct-red=0`、`fake-green=[]`、槽位残留 `[]`；`npm run check` **470/470 pass**、baseline 35/35、0 findings、markdown 223/760 |
| 步 9 巩固 | `gate` ×2 `baseline 35/35`；`cold-run` exit 0；`replace-scenarios` `PASS 6/6`；`git status --short rules/ skills/` 无输出；`gen-agents.mjs` 不存在 |
| 负例（已跑） | TC-024 单测三实现对照；TC-014 / 016 / 021 以**内存变异**喂 `diffSet`（`fail` / `overflow1` / `truncated` 均 PASS，未走副本仓端到端）；TC-025 `BaselineDrift` exit 2 + 草稿保留 + 还原后 gate 绿；TC-029 缺 `--yes` exit 4；TC-027 五 violation 单测（新增 `compare-env.test.mjs`） |
| 未执行 | TC-022（副本仓删节）、TC-026（停损态，替换成功后已不可复现）、TC-028 的三种污染注入；TC-030 的 N1–N5 负例方向。这些属「用例判别力复核」，不影响本次 W2 正向验收结论 |
| S3 尾巴（2026-10-20 补） | 独立子代理判 A1/A2/B1–B4/C1–C4 十项 → **全 pass**，已落 `rules/.inspector-annotations.json`；`checkAgentFile('senior-sdet')` 由 10 项 pending 转为 **ok=true / 0 findings**（check-agent 测试同步改为「缺键 → pending」+「注解就位 → 全绿」两条）｜TC-030 N1–N5 以**内存变异**跑通（`checkAgentFromText` 同一实现）：删闭环字样→A4、改证据字样→A5、改表头→A3、改边界节名→A6、删输出格式标题→A7 全红｜TC-022 内存删「边界」节→`unallowed=7` 红；未填充槽位→`MissingSlot`｜TC-026 停损态已不可复现、TC-028 无巩固判定脚本（三项口径直接执行），均只记录不补造 |
| 独立判定发现 | ① 卡内 description 的「评审测试策略」触发没有对应职责/输出位（转录自旧手写卡，零改写约束下本轮不动）；② `criteria.md` C 组缺「模板形态适配」条款（§0.2 只覆盖 A 组）——两条均记入 `docs/after/20261017210609-pending-work-overview.md` |
| 与计划的偏差 | 新增 `tools/docgen/test/compare-env.test.mjs`（TC-027 五 violation，原有测试只覆盖 BOM/CR/UTF-8，缺 `TRAILING_NEWLINE`） |
| 来源证明（TC-031） | 锚点 = **未提交态**（`evidence.commit` 早于 docgen 建立，`renderAgent.mjs` 在该 commit 不存在）；改前 hash `7c9eb66…`、改后 `548292b…`；13 席 fixture 快照改前后 `EQUAL` |

