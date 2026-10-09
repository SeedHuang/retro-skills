# rule-optimizer skill 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 `rule-optimizer` 技能——对 `D:\Seed\my-rules\rules\` 的 14 条规则做形式层评分、头部规范化、冗余精简（判据驱动），并配硬闸门防越权。

**Architecture:** 一个纯 Node `.mjs` 脚本 `score.mjs` 做形式层评分（确定性、无 LLM、无网络），判据定义放 `references/criteria.md`（agent 读），改法处方放 `references/recipes.md`，头部模板放 `assets/rule-template.md`，`SKILL.md` 写触发与硬闸门。依赖 `evolving-skills`（修订载体）与 `managing-lessons-store`（推迟项轮询）。

**Tech Stack:** Node.js（`node:test` 单测，无第三方依赖）、PowerShell（取数命令）、Markdown。

**Spec:** `docs/superpowers/specs/2026-10-08-rule-optimizer-design.md`（本计划从 spec 论证，执行者需同读两份）

## Global Constraints

- **确定性硬要求**（spec §7.2）：同输入必同输出；不引 LLM、不引随机、不联网。
- **删判据 = 绝对禁止**（spec §0 B1 / §5.3 闸门 1）：脚本与报告都不得输出「可删判据」类建议。
- **体积不做上限**（spec §0 B2 / §6.2）：D4 是**参考维度，不计入总分**（总分 = D1+D2+D3+D5，满分 80）；D4 只查「H1 是否判据式」+ 超基线提示，不设总量/单条上限；超标只提示冗余审查，不强制砍。
- **语义判断不自动化**（spec §0 B6 / 闸门 4）：三检验 #1/#2 由 AI 判断，脚本只查形式。
- **不引入外部打分器**（spec §0 B7 / §9）：只用自研 `score.mjs`。
- 规则文件编码：读取时剥 UTF-8 BOM（spec §8 BOM 容错测试；既有 `powershell-file-encoding` 踩坑）。
- 落点：`D:\Seed\retro-skills\skills\rule-optimizer\`（本仓是用户指定的唯一官方 skill 仓库）。
- 依赖接入：`manifest.json` 的 `skills` 数组**追加**，不重写（spec §7.4）。

---

### Task 1: 建目录骨架 + SKILL.md

**Files:**
- Create: `skills/rule-optimizer/SKILL.md`

**Interfaces:**
- Produces: `SKILL.md` —— agent 读的入口，含触发条件（§5.1）、执行顺序（§5.2）、硬闸门（§5.3）、指向 references/assets/scripts。

- [ ] **Step 1: 建目录**

Run:
```powershell
New-Item -ItemType Directory -Force -Path 'd:\Seed\retro-skills\skills\rule-optimizer\references','d:\Seed\retro-skills\skills\rule-optimizer\assets','d:\Seed\retro-skills\skills\rule-optimizer\scripts'
```
Expected: 三个子目录已建（SKILL.md 由下一步写入）。

- [ ] **Step 2: 写 SKILL.md**

文件 `skills/rule-optimizer/SKILL.md`，frontmatter 仿照既有技能（`name` + `description`）：

```markdown
---
name: rule-optimizer
description: 优化 my-rules/rules/ 里的规则——统一头部格式、精简冗余措辞、量化评分、防劣化。当用户说「优化 rules / 用 rule-optimizer 改规则」时触发。不自动触发。Do not use for 新建规则（那走 skill-creator）、审查（那走 review-loop）。
---

# rule-optimizer：判据驱动的规则改稿器

## 触发条件（§5.1）

用户说「优化 rules / 用 rule-optimizer 改规则」时触发。**不自动触发**——优化活规则是高影响动作，按 `global-ask-before-acting` 必须先拿到指令。

## 不可越过（§5.3 硬闸门，写在此处供每轮加载）

> 1. **禁止删除行为边界规则的判据句** ——没有「问用户然后就能删」这一档。判据不可触碰（B1）。
> 2. **禁止改动判据措辞**，除非：报告「改前 vs 改后」两版 → **等用户确认** → 才落地。
> 3. **禁止为凑分数改规则** —— 分数是体检报告，不是验收标准。超标不要求砍到线下（B2）。
> 4. **禁止把语义判断交给脚本** —— 三检验里的 #1 #2 由 AI 逐条判断并写进报告，不能只写「已检查」（B6）。
> 5. **删冗余必须在报告里写出三检验的验证过程** —— 不能只报「已精简」。

## 执行顺序（§5.2，一次一条）

1. **先确认可回滚**：`git -C D:\Seed\my-rules status --porcelain` 应为空（规则改动靠 git 回滚，工作区脏则先收口再优化）。
2. **先跑基线**：`node scripts/score.mjs --dir <rules目录>`，记录优化前总分与每条得分。
3. **按体积降序**排队（当前：`docs-convention` 129 → `how-i-must-reason` 114 → `code-style` 105 → `import-guard` 96）。
4. **一条一条改**，每条内部按 §3 头部 → §3.2 层级 → §4 三检验删冗余 的顺序。
5. **每条改完立刻跑一次脚本**，确认分数上升；分数没涨 → **回退这条（`git restore` 该文件）**。
6. **全部改完跑总验证**：脚本总分 + 人工过硬闸门 1–5 + 确认体积变化符合 B2（长大允许，只查新增是否冗余）。

## 判据与处方去哪读

- 判据全集（来源类型枚举 / 层级规范 / 三检验 / 评分维度 / 取数命令）：`references/criteria.md`
- 改法处方（每类违规 → 可复制的改法）：`references/recipes.md`
- 规范头部模板（输出用）：`assets/rule-template.md`
- 评分脚本（确定性、可复现）：`scripts/score.mjs`
```

- [ ] **Step 3: 验证 frontmatter 合法**

Run:
```powershell
node -e "const s=require('fs').readFileSync('skills/rule-optimizer/SKILL.md','utf8'); const m=s.match(/^---\r?\n([\s\S]*?)\r?\n---/); if(!m) throw new Error('缺 frontmatter'); const f={}; m[1].split(/\r?\n/).forEach(l=>{const i=l.indexOf(':'); if(i>0) f[l.slice(0,i).trim()]=l.slice(i+1).trim()}); if(!f.name||!f.description) throw new Error('缺 name/description'); console.log('OK', f.name)"
```
Expected: 输出 `OK rule-optimizer`。

- [ ] **Step 4: 不 commit（no-git-write）**

改动留在工作区，最终统一交用户决定提交方式。

---

### Task 2: assets/rule-template.md（头部模板）

**Files:**
- Create: `skills/rule-optimizer/assets/rule-template.md`

**Interfaces:**
- Produces: `rule-template.md` —— §3.1 的规范头部模板（输出用），`recipes.md` 引用它。

- [ ] **Step 1: 写模板**

文件 `skills/rule-optimizer/assets/rule-template.md`：

```markdown
# <标题：一句话可执行判据>

> 来源：<类型>（<YYYY-MM-DD>）｜[证据：<一句话，仅实测/踩坑类>]｜落地：<YYYY-MM-DD>
```

字段表（判据见 `references/criteria.md` §1）：

| 字段 | 必需 | 说明 |
|---|---|---|
| 标题 | ✅ | 必须是「可执行判据」，不是主题名。`# 测试踩坑笔记` ❌（是目录，且内含两条不相关规则） |
| 来源类型 | ✅ | 四类枚举，见 criteria §1.3。决定 AI 执行力度 |
| 日期 | ✅ | 一个就够，不写「补于 X、落地于 Y」两段 |
| 证据 | ⚠️ | **仅「实测/踩坑」类写一句话现象**，其余三类不写 |
| 落地 | ✅ | 来源行三要素之一（见 D1）：`来源类型 / 日期 / 落地` 必须齐全，缺一即 D1 扣分 |
| 来源行总长 | ⚠️ | **来源行 ≤ 2 渲染行**（D3 判据的归属定义，超 2 行每多 1 行 −3）。「渲染行」= 编辑器/终端 wrap 后的实际行数，依赖环境，不规定字符/行；操作锚点：来源行字符数 **> 200 即视为超 2 行**，不许用「物理 1 行」糊弄 |

**砍掉的（对照现状）**：合并记录（「合并 no-unverified-claims.md」）、多段用户原话、补记日期。
**依据**（B4）：来源行的功能是权限标记 + 可审计，不参与运行期约束力；保留类型和日期即可，历史归 git。
```

- [ ] **Step 2: 验证模板与 spec §3.1 一致**

Run:
```powershell
Select-String -Path 'skills/rule-optimizer/assets/rule-template.md' -Pattern '来源类型|落地|来源行总长' | Measure-Object -Line | Select-Object -ExpandProperty Lines
```
Expected: `3`（模板含 来源类型 / 落地 / 来源行总长 三字段，对应 spec §3.1 表格）。

- [ ] **Step 3: 不 commit（no-git-write）**

改动留在工作区，最终统一交用户决定提交方式。

---

### Task 3: references/criteria.md（判据全集）

**Files:**
- Create: `skills/rule-optimizer/references/criteria.md`

**Interfaces:**
- Produces: `criteria.md` —— score.mjs 的实现依据 + agent 读的判断指引。score.mjs 的评分逻辑、正则、枚举全部照此实现。

- [ ] **Step 1: 写判据全集**

文件 `skills/rule-optimizer/references/criteria.md`，逐字落实 spec 以下章节（内容直接抄 spec，保证单源一致）：

1. **来源类型**（spec §3.3 表格）：`用户当场指令` / `评审第 N 轮` / `实测/踩坑` / `项目约定` 四类。约束力 = 措辞强度（criteria §1.2，客观判定），不看来源类型。
2. **层级规范**（spec §3.2 表格）：`#` 规则名=一句话判据（恰一个）；`##` 大节（核心判据必须由 H2 或列表承载）；`###` 小节（不用 emoji）；`**加粗**` 仅句内强调、不承担结构职责。
3. **三检验**（spec §4.1 表格）：①判据本身不变 ②边界例子不变 ③引用关系不变（#3 可脚本化，#1 #2 需 AI）。
4. **评分维度 D1–D5**（spec §6.1 表格，逐字）。
5. **D4 体积维度**（spec §6.2）与**健康分级**（spec §6.3 表格）。
6. **基线取数命令**（spec §7.1，逐字）与**基线口径**（spec §6.2：单条中位数 ≈ 25 行；总量 665 行；随优化重取）。

**实现决策（D4 第二检查项的脚本化边界）**：spec §6.2 第二项「超预算时是否触发过废话审查」依赖优化流程的**报告产出**，无状态的 `score.mjs` 无法验证「审查做了没」。实现为：脚本对**超单条基线 ×1.5（≈37 行）**的规则在 `findings` 里生成一条「体积超基线，需冗余审查」提示（不计入 D4 扣分）；D4 分数只由第一项（H1 是否判据式）决定；「冗余审查是否做了」作为 §5.2 第 6 步的人工流程检查点（含在「人工过硬闸门」里）。

- [ ] **Step 2: 验证判据覆盖 spec 必查项**

Run:
```powershell
$s = Get-Content 'skills/rule-optimizer/references/criteria.md' -Raw; @('来源类型','层级规范','三检验','D1','D2','D3','D4','D5','健康分级','取数命令','约束力') | ForEach-Object { if($s -match [regex]::Escape($_)){"OK $_"}else{"MISS $_"} }
```
Expected: 全部 `OK`（10 项都在）。

- [ ] **Step 3: 不 commit（no-git-write）**

改动留在工作区，最终统一交用户决定提交方式。

---

### Task 4: references/recipes.md（改法处方）

**Files:**
- Create: `skills/rule-optimizer/references/recipes.md`

**Interfaces:**
- Produces: `recipes.md` —— B5 要求「每类违规配可复制的改法」；score.mjs 的 findings 里 `recipe` 字段指向它的 `§R<n>` 段落。

- [ ] **Step 1: 写处方**

文件 `skills/rule-optimizer/references/recipes.md`。每一类违规一节（`§R1` 起），每节给「判据 → 具体改法 → 例子」。至少覆盖：

- `§R1 来源行超长`：来源行 > 200 字符。改法：保留 `来源：<类型>（<日期>）｜[证据]｜落地：<日期>`，删合并记录/多段用户原话/补记日期（对照 `rule-template.md`）。
- `§R2 无来源行`：头部缺 `> 来源：`。改法：补来源行；来源类型按 criteria §1.3 四类判定；**来源不明时如实写「来源：未记录」，不编造用户原话**。
- `§R3 来源行错位在文末`（如 `import-guard.md`）：把文末来源行移到标题下第 2 行。
- `§R4 标题是目录式`（如原 `testing-pitfalls`）：标题改为「一句话可执行判据」；目录内含多条不相关规则时拆条。
- `§R5 层级混用`：核心判据用 `**加粗**` 承载 → 改为 H2 或列表（对照 criteria §1.2）。
- `§R6 项目事实混入全局规则`：`import-guard` 的编译错误清单、`code-style` 全篇 → 项目特定事实移出全局规则（移到项目内文档或标注「仅适用于 X 项目」）；**涉及跨仓搬移需用户确认**（spec §5.4）。
- `§R7 规则矛盾`（`import-guard` 禁 GetDiagnostics vs `vitest-queued-alternative` 用 GetDiagnostics）：人工判「真矛盾」还是「范围不同没写清」；真矛盾按 `landing-sweep` 改两处 + 报告；范围不同则各自补一句范围说明（spec §5.4）。

- [ ] **Step 2: 验证处方可被 score 引用**

Run:
```powershell
Select-String -Path 'skills/rule-optimizer/references/recipes.md' -Pattern '^### §R' | Measure-Object -Line | Select-Object -ExpandProperty Lines
```
Expected: 输出 `7`（§R1–§R7 各一节）。

- [ ] **Step 3: 不 commit（no-git-write）**

改动留在工作区，最终统一交用户决定提交方式。

---

### Task 5: scripts/score.test.mjs（测试先行，TDD）

**Files:**
- Create: `skills/rule-optimizer/scripts/score.test.mjs`

**Interfaces:**
- Consumes: `score.mjs`（Task 6 实现）的 `scoreFile(filePath, rulesDir)` / `scoreDir(dir)` / `cli(argv)`。
- Produces: 测试套件，对应 spec §8 的六项要求。

- [ ] **Step 1: 写测试文件**

文件 `skills/rule-optimizer/scripts/score.test.mjs`，用 `node:test` + `assert/strict`，fixture 用临时目录（`fs.mkdtempSync`）动态构造，不依赖真实 rules 目录：

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { scoreFile, scoreDir } from './score.mjs'

function makeDir(files) {
  const dir = mkdtempSync(join(tmpdir(), 'ro-test-'))
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body, 'utf8')
  return dir
}
function score(dir, name) { return scoreFile(join(dir, name), dir) }

// 合规文件：来源行三字段齐全、H1 判据式、来源行 ≤ 200 字符、无原话引用 → 硬性四维全满分（D4 参考）
const GOOD = `# 有想法先沟通，拿到授权再动手

> 来源：用户当场指令（2026-10-02）｜落地：2026-10-02

## 核心约束
先沟通，拿到授权，才有写权限。`

const NO_SOURCE = `# 测试踩坑笔记

## 说明
无来源行。`

const NO_LANDING = `# 引用完整

> 来源：项目约定（2026-10-02）

## 核心约束
落地字段缺失。`

const LONG_SOURCE = `# 长来源行

> 来源：用户当场指令（2026-10-02）｜证据：${'用户原话'.repeat(60)}｜落地：2026-10-02

## 核心约束
来源行超 200 字符。`

const BROKEN_REF = `# 有引用

> 来源：项目约定（2026-10-02）｜落地：2026-10-02

## 核心约束
参考 missing-rule.md 处理。`

test('D1 无来源行扣分', () => {
  const dir = makeDir({ 'a.md': NO_SOURCE })
  assert.ok(score(dir, 'a.md').scores.D1 < 20)
  rmSync(dir, { recursive: true, force: true })
})

test('D1 缺落地字段扣分', () => {
  const dir = makeDir({ 'a.md': NO_LANDING })
  assert.ok(score(dir, 'a.md').scores.D1 < 20)
  rmSync(dir, { recursive: true, force: true })
})

test('D3 来源行超长扣分', () => {
  const dir = makeDir({ 'a.md': LONG_SOURCE })
  assert.ok(score(dir, 'a.md').scores.D3 < 20)
  rmSync(dir, { recursive: true, force: true })
})

test('D4 目录式标题 0 分 / 判据式标题满分（参考维度，不计入 total）', () => {
  const dir = makeDir({ 'bad.md': NO_SOURCE, 'good.md': GOOD })
  assert.equal(score(dir, 'bad.md').d4.score, 0)
  assert.equal(score(dir, 'good.md').d4.score, 20)
  assert.equal(score(dir, 'good.md').total, 80)   // 四维满分，D4 是参考维度不计入
  rmSync(dir, { recursive: true, force: true })
})

test('D5 失效指针扣分 / 无引用满分', () => {
  const dir = makeDir({ 'a.md': BROKEN_REF, 'good.md': GOOD })
  assert.ok(score(dir, 'a.md').scores.D5 < 20)
  assert.equal(score(dir, 'good.md').scores.D5, 20)
  rmSync(dir, { recursive: true, force: true })
})

test('确定性：同一 fixture 连跑两次输出一致', () => {
  const dir = makeDir({ 'good.md': GOOD, 'a.md': BROKEN_REF })
  const a = JSON.stringify(scoreDir(dir, { json: true }))
  const b = JSON.stringify(scoreDir(dir, { json: true }))
  assert.equal(a, b)
  rmSync(dir, { recursive: true, force: true })
})

test('不越界：输出不含「判据」「建议删除」（走 D4=0 finding 路径）', () => {
  const dir = makeDir({ 'bad.md': NO_SOURCE })
  const out = JSON.stringify(scoreDir(dir, { json: true }))
  assert.ok(!out.includes('判据'))
  assert.ok(!out.includes('建议删除'))
  rmSync(dir, { recursive: true, force: true })
})

test('合规基准：GOOD 四维满分 total=80', () => {
  const dir = makeDir({ 'good.md': GOOD })
  assert.equal(score(dir, 'good.md').total, 80)
  rmSync(dir, { recursive: true, force: true })
})

test('level 分级（80 分制）：GOOD 健康 / NO_LANDING 预警 / NO_SOURCE 超标', () => {
  const dir = makeDir({ 'good.md': GOOD, 'mid.md': NO_LANDING, 'bad.md': NO_SOURCE })
  assert.equal(score(dir, 'good.md').level, '健康')      // total 80 ≥ 72
  assert.equal(score(dir, 'mid.md').level, '预警')       // total 70：56–71
  assert.equal(score(dir, 'bad.md').level, '超标')       // total 40 < 56
  rmSync(dir, { recursive: true, force: true })
})

test('BOM 容错：带 BOM 与不带 BOM 结果一致', () => {
  const dir = makeDir({ 'with.md': '\uFEFF' + GOOD, 'without.md': GOOD })
  assert.equal(score(dir, 'with.md').total, score(dir, 'without.md').total)
  rmSync(dir, { recursive: true, force: true })
})
```

- [ ] **Step 2: 跑测试验证失败（TDD 红）**

Run:
```powershell
node --test skills/rule-optimizer/scripts/score.test.mjs
```
Expected: FAIL——`Cannot find module './score.mjs'`（Task 6 才实现）。

- [ ] **Step 3: 不 commit（no-git-write）**

改动留在工作区，最终统一交用户决定提交方式。

---

### Task 6: scripts/score.mjs（实现评分脚本）

**Files:**
- Create: `skills/rule-optimizer/scripts/score.mjs`

**Interfaces:**
- Consumes: `criteria.md` 的 D1–D5 判定规则；`recipes.md` 的 `§R<n>` 引用。
- Produces:
  - `scoreFile(filePath, rulesDir)` → `{ name, lines, chars, scores: {D1,D2,D3,D5}, d4: {score, ref}, total, level, findings: [{dim, msg, recipe}] }`（total = 硬性四维和，满分 80；d4 参考不计入）
  - `scoreDir(dir, opts)` → 汇总对象（含 totals / currentBaseline / files[] / total / level / previous / diff）
  - CLI：`node scripts/score.mjs --dir <dir> [--json] [--baseline <file>]`

- [ ] **Step 1: 写实现（关键逻辑如下）**

```js
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const SOURCE_TYPES = ['用户当场指令', '评审第 N 轮', '实测/踩坑', '项目约定']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const DIR_HEADING_HINTS = /笔记|规范|说明|踩坑/   // 目录式标题特征（D4）
const REF_MD_RE = /([A-Za-z0-9_-]+\.md)/g          // 跨规则指针（D5）
const BASELINE_X15 = 1.5
const LINE_OVER_LEN = 200                           // 来源行 >200 字符 = 超 2 渲染行（D3）
const DOC_DIR_RE = /(?:^|[`"'(\s|])(docs|specs|plans|handoffs|session|assets|references|scripts)[/\\]/  // D5 文档路径前缀（docs/after/xxx.md 等外部文档引用）

function stripBom(s) { return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s }

function parseHeader(text) {
  // 找 `> 来源：` 行；判断错位（是否出现在前 10 行之外 → 错位在文末）
  const lines = text.split(/\r?\n/)
  const idx = lines.findIndex(l => l.trim().startsWith('> 来源：'))
  const sourceLine = idx >= 0 ? lines[idx] : ''
  return {
    sourceLine, inHead: idx >= 0 && idx < 10, idx,
    hasSource: idx >= 0,
    hasType: SOURCE_TYPES.some(t => sourceLine.includes(t)),
    hasDate: DATE_RE.test(sourceLine.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? ''),
    hasLanding: sourceLine.includes('落地'),
    hasQuote: /「|」|"|'/.test(sourceLine.replace(/来源：.*?（\d{4}-\d{2}-\d{2}）/, '')),
    len: sourceLine.length,
    type: SOURCE_TYPES.find(t => sourceLine.includes(t)) ?? null,
  }
}

export function scoreFile(filePath, rulesDir, medianLines = 25) {
  const raw = readFileSync(filePath, 'utf8')
  const text = stripBom(raw)
  const lines = text.replace(/\r?\n$/, '').split(/\r?\n/).length
  const chars = text.length
  const name = filePath.split(/[\\/]/).pop()
  const h = parseHeader(text)
  const h1 = text.match(/^# (.+)$/m)?.[1] ?? ''

  // D1 头部规范：三字段齐全(来源类型/日期/落地) + 类型在枚举 + 日期合法 = 20；缺必填 −10；来源行错位文末 −5
  let D1 = 20
  if (!h.hasSource) D1 = 0                      // 无来源行 = 0（三字段全缺）
  else {
    if (!h.hasType || !h.hasDate || !h.hasLanding) D1 -= 10
    if (h.hasType && SOURCE_TYPES.includes(h.type)) {} else D1 -= 10
    if (!DATE_RE.test(h.sourceLine.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? '')) D1 -= 10
    if (!h.inHead) D1 -= 5                       // 错位在文末
  }

  // D2 层级规范：H1 唯一；H3 无 emoji。注：`**加粗**` 与 `# 标题` 不冲突——`#` 管分节、`**` 管句内强调（如 global-ask-before-acting 的加粗总结句），加粗不参与 D2 扣分（2026-10-08 用户裁决）
  let D2 = 20
  if ((text.match(/^# /gm) ?? []).length !== 1) D2 -= 5
  if (/(^|\n)### .*[^\w\s，。：:（）()\-—_]/.test(text)) D2 -= 5   // H3 含 emoji/装饰符号

  // D3 来源精简：来源行 >200 字符即视为超 2 渲染行（spec §3.1 锚点），每多约 80 字符多 1 行，每行 −3；含原话引用 −5
  let D3 = 20
  if (h.hasSource) {
    if (h.len > LINE_OVER_LEN) {
      const extraRows = Math.ceil((h.len - LINE_OVER_LEN) / 80) + 1
      D3 -= 3 * extraRows
    }
    if (h.hasQuote) D3 -= 5
  } else D3 = 0

  // D4 参考维度（不计入总分）：目录式标题 = 0（提示）；超单条基线×1.5 → 提示需冗余审查。用户裁决：D4 是「说清楚要多大」的自然结果，非质量硬指标，只参考
  const d4 = { score: DIR_HEADING_HINTS.test(h1) ? 0 : 20, ref: false }
  const findings = []

  // D5 引用完整：跨规则指针 = 正文出现的「规则名（不带 .md，用 rulesDir 文件名集合匹配）」或「不带路径分隔符的纯文件名 .md 引用」，必须在 rulesDir 存在
  let D5 = 20
  const ruleNames = new Set(readdirSync(rulesDir).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, '')))
  const refs = new Set()
  for (const m of text.matchAll(REF_MD_RE)) {
    const raw = m[1]
    if (/[/\\]/.test(raw) || (m.index > 0 && /[/\\]/.test(text[m.index - 1]))) continue
    const before = text.slice(Math.max(0, m.index - 120), m.index)
    if (DOC_DIR_RE.test(before)) continue
    const stem = raw.replace(/\.md$/, '')
    if (/^xxx-/.test(stem) || stem === 'SKILL' || stem === 'README') continue
    refs.add(stem)
  }
  for (const rn of ruleNames) if (rn && rn !== name.replace(/\.md$/, '') && text.includes(rn)) refs.add(rn)
  const miss = [...refs].filter(r => r !== name.replace(/\.md$/, '') && !ruleNames.has(r))
  if (miss.length) D5 -= 5 * miss.length
  D5 = Math.max(0, D5)                       // D5 下限 0，避免扣成负数

  const total = D1 + D2 + D3 + D5
  const level = total >= 72 ? '健康' : total >= 56 ? '预警' : '超标'
  if (D1 < 20) findings.push({ dim: 'D1', msg: `头部不规范（来源行：${h.hasSource ? '有' : '无'}）`, recipe: '见 references/recipes.md §R2/§R3' })
  if (D3 < 20) findings.push({ dim: 'D3', msg: `来源行超长（${h.len} 字符）`, recipe: '见 references/recipes.md §R1' })
  if (d4.score === 0) findings.push({ dim: 'D4', msg: `标题「${h1}」含目录式特征词（笔记/规范/说明/踩坑），D4 参考计 0`, recipe: '见 references/recipes.md §R4' })
  if (lines > medianLines * BASELINE_X15) {
    d4.ref = true
    findings.push({ dim: 'D4', msg: `体积超单条基线（${lines} 行 > 中位数 ${medianLines}×1.5），需人工冗余审查（D4 只参考不计分）`, recipe: '见 references/recipes.md §R1' })
  }
  if (miss.length) findings.push({ dim: 'D5', msg: `失效指针：${miss.join('、')}`, recipe: '见 references/criteria.md §3 检验#3' })

  return { name, lines, chars, scores: { D1, D2, D3, D5 }, d4, total, level, findings }
}

function median(nums) {
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

export function scoreDir(dir, opts = {}) {
  const files = readdirSync(dir).filter(f => f.endsWith('.md')).sort()
  // 先算全库单条行数中位数（criteria §6.1：单条行数基线），再传给每个 scoreFile 做超基线提示
  const lineCounts = files.map(f => {
    const t = stripBom(readFileSync(join(dir, f), 'utf8'))
    return t.replace(/\r?\n$/, '').split(/\r?\n/).length
  })
  const medianLines = median(lineCounts)
  const scored = files.map(f => scoreFile(join(dir, f), dir, medianLines))
  const linesTotal = scored.reduce((a, f) => a + f.lines, 0)
  const charsTotal = scored.reduce((a, f) => a + f.chars, 0)
  const currentBaseline = { totalLines: linesTotal, medianLines, x1_5: Math.round(linesTotal * BASELINE_X15 * 10) / 10 }
  let previous = null, diff = null
  if (opts.baselineFile) {
    const prev = JSON.parse(readFileSync(opts.baselineFile, 'utf8'))
    previous = prev.totals ?? prev.currentBaseline
    diff = { lines: linesTotal - previous.lines, chars: charsTotal - previous.chars }
  }
  const total = Math.round(scored.reduce((a, f) => a + f.total, 0) / Math.max(1, scored.length))
  const level = total >= 72 ? '健康' : total >= 56 ? '预警' : '超标'
  const out = { dir, measuredAt: new Date().toISOString().slice(0, 10), totals: { files: scored.length, lines: linesTotal, chars: charsTotal }, currentBaseline, previous, diff, files: scored, total, level }
  return out
}

export function cli(argv = process.argv.slice(2)) {
  const args = { dir: 'D:\\Seed\\my-rules\\rules', json: false, baselineFile: null }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dir') args.dir = argv[++i]
    else if (argv[i] === '--json') args.json = true
    else if (argv[i] === '--baseline') args.baselineFile = argv[++i]
  }
  if (!existsSync(args.dir)) { console.error(`目录不存在：${args.dir}`); process.exit(1) }
  if (args.baselineFile && !existsSync(args.baselineFile)) { console.error(`基线文件不存在：${args.baselineFile}，先不带 --baseline 跑一次`); process.exit(1) }
  const out = scoreDir(args.dir, { baselineFile: args.baselineFile })
  console.log(args.json ? JSON.stringify(out, null, 2) : `共 ${out.totals.files} 文件 / ${out.totals.lines} 行 / ${out.totals.chars} 字符，平均分 ${out.total}（${out.level}）`)
}

// 仅当作为命令行直接运行时才执行 CLI（import 进测试/其他模块时不触发）
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) cli()
```

- [ ] **Step 2: 跑测试验证通过（TDD 绿）**

Run:
```powershell
node --test skills/rule-optimizer/scripts/score.test.mjs
```
Expected: 全部 pass（含确定性、不越界、BOM 三项）。

- [ ] **Step 3: 跑真实目录冒烟**

Run:
```powershell
node skills/rule-optimizer/scripts/score.mjs --dir D:\Seed\my-rules\rules --json | Select-Object -First 5
```
Expected: 输出 JSON 头部含 `"totals": { "files": 14, "lines": 673, "chars": 22283 }`。

- [ ] **Step 4: 不 commit（no-git-write）**

改动留在工作区，最终统一交用户决定提交方式。

---

### Task 7: skilldependencies 接入

**Files:**
- Create: `skilldependencies/rule-optimizer.json`
- Modify: `skilldependencies/manifest.json:3`（skills 数组追加）

**Interfaces:**
- Consumes: `validate.test.mjs` 的 4 个断言（manifest 与文件一一对应 / schema 合法且 skill 名=文件名 / 跨技能依赖在套件内 / skills 目录与 manifest 一一对应）。

- [ ] **Step 1: 建依赖清单**

文件 `skilldependencies/rule-optimizer.json`：

```json
{
  "schemaVersion": 1,
  "skill": "rule-optimizer",
  "dependencies": {
    "skills": [
      { "name": "evolving-skills" },
      { "name": "managing-lessons-store" }
    ]
  }
}
```

- [ ] **Step 2: manifest 追加**

编辑 `skilldependencies/manifest.json` 的 `skills` 数组，在末尾追加 `"rule-optimizer"`（只追加，不重写整个数组）。

- [ ] **Step 3: 跑 validate 确认全 pass**

Run:
```powershell
node --test skilldependencies/validate.test.mjs
```
Expected: 4/4 pass（含新增技能后 manifest / json / skills 目录三方一致）。

- [ ] **Step 4: 不 commit（no-git-write）**

改动留在工作区，最终统一交用户决定提交方式。

---

### Task 8: 总验证

**Files:**
- 无新增。

- [ ] **Step 1: 跑全套测试**

Run:
```powershell
node --test skilldependencies/validate.test.mjs skills/rule-optimizer/scripts/score.test.mjs
```
Expected: 全部 pass（validate 4 项 + score 8 项）。

- [ ] **Step 2: 跑分并核对基线**

Run:
```powershell
node skills/rule-optimizer/scripts/score.mjs --dir D:\Seed\my-rules\rules --json
```
Expected: `totals.files === 14`、`totals.lines === 673`、`totals.chars === 22283`；`currentBaseline.medianLines === 25`；`how-i-must-reason` 的 `D3 < 20`（来源行 329 字符超长，findings 含 §R1 处方）。

- [ ] **Step 3: 确认无越界输出**

Run:
```powershell
node skills/rule-optimizer/scripts/score.mjs --dir D:\Seed\my-rules\rules --json | Select-String -Pattern '判据|建议删除'
```
Expected: 无输出（空）——脚本不输出语义判断或删判据建议（闸门 4 / spec §8 不越界）。

---

## Self-Review 记录

**Spec coverage 检查**：
- §0 B1–B7 → Global Constraints + SKILL.md 硬闸门（Task 1）✅
- §2 目录结构 → Task 1 建目录 + Task 7 依赖 ✅
- §3.1 头部模板 → Task 2 ✅
- §3.2 层级规范 / §3.3 来源枚举 → Task 3（criteria）✅
- §4 三检验 → Task 3（criteria，AI 判断部分由 SKILL.md 流程承载）✅
- §5 触发 / 执行顺序 / 硬闸门 → Task 1（SKILL.md）✅
- §6 评分 / 分级 → Task 3 + Task 6（score.mjs）✅
- §7 脚本规格 / CLI / 输出 / 依赖 → Task 6 + Task 7 ✅
- §8 测试要求 → Task 5（六项 + BOM）✅
- §9 明确不做 → Global Constraints ✅
- §10 未决 → 已全部确认（.mjs / 后续独立指令 / 拆条已执行），本计划不含实际优化 ✅

**Placeholder 检查**：Task 5 已含 8 个用例的完整测试代码（fixture + 断言），Task 6 给出 score.mjs 完整实现；无「TBD / 实现细节补全」类占位。

**Type/名称一致性**：`scoreFile` / `scoreDir` / `cli` 三处签名一致；`currentBaseline` / `previous` / `diff` 字段名与 spec §7.3 一致；`scores.{D1..D5}` 与 §6.1 一致；`recipe` 引用 `§R1–§R7` 与 Task 4 一致。
