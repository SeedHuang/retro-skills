# use-rule-skills 入口技能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 spec `docs/superpowers/specs/2026-10-09-use-rule-skills-design.md` 实现 use-rule-skills 入口技能 + rule-writer 纯粹化 + 单源收敛 + 草稿箱脚本 + score.mjs `--file`。

**Architecture:** use-rule-skills 入口编排（意图判定 + 两路径流程 + 草稿箱 + 报告）；rule-writer 纯粹化为只写作（去 inspector 步骤）；drafts.mjs 管草稿箱（用户目录）；score.mjs 加 `--file` 单文件评分；skilldependencies 注册 + aas sync。

**Tech Stack:** Node.js（`node:test`，无第三方依赖）、Markdown、PowerShell（aas）。

**Spec:** `docs/superpowers/specs/2026-10-09-use-rule-skills-design.md`（判据、流程、草稿箱交互、报告模板、单源、落位均以它为准）

## Global Constraints

- **不 commit（no-git-write）**：每个任务收尾 = 改动留在工作区。禁止 git add/commit/push。aas sync 不是 git，可跑。
- **判据单源在 `rule-inspector/references/criteria.md`**：判定词表 / 来源类型枚举 / 标题三句只在 criteria 定义，writing-guide / 报告模板只引用不复制（spec §7）。
- **rule-writer 不再跑 inspector**（spec §8）：SKILL.md 去掉步骤 4/6，明写"产出草稿，验收走 use-rule-skills"。
- **草稿箱**：`<用户目录>/.retro-skills/rule-drafts/`（`os.homedir()`）；命名 `<规则名>--<YYYYMMDD-HHMMSS>.md`；删除永不静默（spec §3）。
- **score.mjs `--file`**：单文件评分，输出与 scoreFile 一致；`--dir` 与 `--file` 互斥（spec §9.1 工具补强）。
- **aas**：`aas sync` 在 `D:\Seed\my-rules` 跑，只建缺失链接；新增技能后必须跑（L-020）。

---

### Task 1: score.mjs CLI `--file` 单文件评分（TDD）

**Files:**
- Modify: `skills/rule-inspector/scripts/score.mjs`
- Modify: `skills/rule-inspector/scripts/score.test.mjs`

**Interfaces:**
- Consumes: 现有 `scoreFile(filePath, rulesDir, opts)`。
- Produces: CLI 支持 `--file <path>`（单文件评分，输出与 scoreFile 一致）；`--file` 与 `--dir` 互斥。

- [ ] **Step 1: 写失败测试（红）**

在 `score.test.mjs` 顶部补 import（**ESM：不用 `require`/`__dirname`**）：
```js
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
```
末尾追加：
```js
test('CLI --file：单文件评分，输出 = scoreFile（与 --dir 互斥；--rules-dir 传入规则库）', () => {
  const dir = makeDir({ 'a.md': GOOD })
  const script = join(__dirname, 'score.mjs')
  const out = spawnSync(process.execPath, [script, '--file', join(dir, 'a.md'), '--rules-dir', dir, '--type', '条件触发', '--json'], { encoding: 'utf8' })
  assert.equal(out.status, 0, out.stderr)
  const got = JSON.parse(out.stdout.replace(/^\uFEFF/, ''))
  assert.equal(got.name, 'a.md')
  assert.equal(got.total, got.max)
  rmSync(dir, { recursive: true, force: true })
})
test('CLI --file 与 --dir 互斥：同给 → exit 非 0', () => {
  const script = join(__dirname, 'score.mjs')
  const out = spawnSync(process.execPath, [script, '--file', 'x.md', '--dir', 'D:\\Seed\\my-rules\\rules'], { encoding: 'utf8' })
  assert.notEqual(out.status, 0)
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test skills/rule-inspector/scripts/score.test.mjs`
Expected: 新 2 用例 FAIL（CLI 未支持 --file）。

- [ ] **Step 3: 实现**

在 score.mjs CLI 段（`cli()`）：
```js
else if (argv[i] === '--file') args.file = argv[++i]
else if (argv[i] === '--rules-dir') args.rulesDir = argv[++i]
...
if (args.file && args.dir) { console.error('--file 与 --dir 互斥，只给一个'); process.exit(2) }
if (args.file) {
  if (!existsSync(args.file)) { console.error(`文件不存在：${args.file}`); process.exit(1) }
  if (args.rulesDir && !existsSync(args.rulesDir)) { console.error(`规则库目录不存在：${args.rulesDir}`); process.exit(1) }
  const opts = { triCheckDone: args.triCheck, type: args.type }
  // rulesDir 用于跨规则引用检查（scoreFile → crossRuleMiss）：评分草稿时须指规则库（my-rules/rules），
  // 不能默认 dirname(file)（草稿在草稿箱，引用会全部误判）；评分现有规则时可不给（默认 dirname(file)=规则库）。
  const rulesDir = args.rulesDir ?? dirname(args.file)
  const r = scoreFile(args.file, rulesDir, opts)
  console.log(args.json ? JSON.stringify(r, null, 2) : `得分 ${r.total}/${r.max}（${Math.round(r.rate * 100)}%，${r.level}）`)
  return
}
```
（保持既有 `--dir` 分支不变；CLI 顶部 `const args = { ... file: null, rulesDir: null ... }` 加字段；`dirname` 从 `node:path` 引入。）

- [ ] **Step 4: 跑测试确认通过（绿）**

Run: `node --test skills/rule-inspector/scripts/score.test.mjs`
Expected: 全 pass（当前 score 45 + 新 2 = **47**）。

- [ ] **Step 5: 不 commit（no-git-write）**

改动留在工作区。

---

### Task 2: drafts.mjs 草稿箱脚本（TDD）

**Files:**
- Create: `skills/use-rule-skills/scripts/drafts.mjs`
- Create: `skills/use-rule-skills/scripts/drafts.test.mjs`
- Modify: `skills/use-rule-skills/scripts/package.json`（`"type": "module"`，若目录无则建）

**Interfaces:**
- Produces: `ensure(draftsDir)`、`ls(draftsDir, ruleName?)`（返回按时间倒序 `{name, rule, ts, created}`）、`rmFile(draftsDir, name)`、`rmRule(draftsDir, ruleName, keep?)`（默认删该规则全部；keep 存在则保留该文件删其余）；CLI 子命令 `ensure / ls [rule] / rm <draft> / rm --rule <rule> [--keep <draft>]`。

- [ ] **Step 1: 写失败测试（红）**

`drafts.test.mjs`（**注意：ESM 下禁止 `require`，一律用顶部 import 的 `existsSync`**）：
```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { ensure, ls, rmFile, rmRule } from './drafts.mjs'

function mkbox() { return mkdtempSync(join(tmpdir(), 'drafts-')) }
function w(box, name) { writeFileSync(join(box, name), '# x\n', 'utf8') }

test('ensure：目录存在则幂等返回；不存在则建', () => {
  const box = mkbox()
  ensure(box)   // 已存在 → 不报错
  ensure(box)
  const sub = join(box, 'sub')
  ensure(sub)   // 不存在 → 建
  assert.ok(existsSync(sub))
  rmSync(box, { recursive: true, force: true })
})
test('ls：按文件名时间戳倒序、可过滤、带 created 字段', () => {
  const box = mkbox()
  w(box, 'a--20261009-0800.md'); w(box, 'a--20261009-1000.md'); w(box, 'b--20261009-0900.md')
  const all = ls(box)
  assert.equal(all.length, 3)
  assert.equal(all[0].name, 'a--20261009-1000.md')   // 文件名时间戳倒序
  const a = ls(box, 'a')
  assert.equal(a.length, 2)
  assert.ok(a[0].created)
  rmSync(box, { recursive: true, force: true })
})
test('rmFile：删指定草稿；不存在 → 静默成功', () => {
  const box = mkbox(); w(box, 'a--1.md')
  rmFile(box, 'a--1.md')
  assert.ok(!existsSync(join(box, 'a--1.md')))
  rmFile(box, 'nope.md')
  rmSync(box, { recursive: true, force: true })
})
test('rmRule：默认删该规则全部；带 keep 保留指定', () => {
  const box = mkbox()
  w(box, 'a--1.md'); w(box, 'a--2.md'); w(box, 'b--1.md')
  rmRule(box, 'a')                       // 删 a 全部
  assert.ok(!existsSync(join(box, 'a--1.md')))
  assert.ok(!existsSync(join(box, 'a--2.md')))
  assert.ok(existsSync(join(box, 'b--1.md')))
  w(box, 'a--3.md'); w(box, 'a--4.md')
  rmRule(box, 'a', 'a--3.md')            // 保留 a--3，删其余
  assert.ok(existsSync(join(box, 'a--3.md')))
  assert.ok(!existsSync(join(box, 'a--4.md')))
  rmSync(box, { recursive: true, force: true })
})
```

- [ ] **Step 2: 跑测试确认失败（红）**

Run: `node --test skills/use-rule-skills/scripts/drafts.test.mjs`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 drafts.mjs**

```js
import { mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

export function draftsDir() { return join(homedir(), '.retro-skills', 'rule-drafts') }
export function ensure(box = draftsDir()) {
  if (!existsSync(box)) mkdirSync(box, { recursive: true })
  return box
}
// 解析 <规则名>--<YYYYMMDD-HHMMSS>.md；无 -- 则整体当规则名（不显示 created）
export function parseName(name) {
  const m = name.match(/^(.+)--(\d{8}-\d{6})\.md$/)
  return m ? { rule: m[1], ts: m[2], created: m[2].replace(/(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})/, '$1-$2-$3 $4:$5') } : { rule: name.replace(/\.md$/, ''), ts: '', created: '' }
}
export function ls(box = draftsDir(), ruleName) {
  if (!existsSync(box)) return []
  return readdirSync(box).filter(f => f.endsWith('.md') && (!ruleName || f.startsWith(ruleName + '--')))
    .map(f => ({ name: f, ...parseName(f) }))
    .sort((x, y) => (y.ts || '').localeCompare(x.ts || ''))   // 文件名时间戳倒序（无 ts 的排最后，spec §3.1）
}
export function rmFile(box, name) { if (existsSync(join(box, name))) rmSync(join(box, name)) }
export function rmRule(box, ruleName, keep) {
  for (const f of ls(box, ruleName)) if (!keep || f.name !== keep) rmFile(box, f.name)
}

// CLI
const [,, cmd, ...rest] = process.argv
const box = draftsDir()
switch (cmd) {
  case 'ensure': ensure(box); console.log(`草稿箱：${box}`); break
  case 'ls': {
    const ruleName = rest[0]
    for (const f of ls(box, ruleName)) console.log(`${f.name}（创建 ${f.created || '未知'}）`)
    break
  }
  case 'rm': {
    if (rest[0] === '--rule') { const rule = rest[1]; const keep = rest[2] === '--keep' ? rest[3] : undefined; rmRule(box, rule, keep); console.log(`已删除 ${rule} 名下草稿${keep ? `（保留 ${keep}）` : ''}`) }
    else { rmFile(box, rest[0]); console.log(`已删除 ${rest[0]}`) }
    break
  }
  default: console.error('用法：drafts ensure | ls [规则名] | rm <草稿> | rm --rule <规则名> [--keep <草稿>]'); process.exit(2)
}
```

- [ ] **Step 4: 跑测试确认通过（绿）**

Run: `node --test skills/use-rule-skills/scripts/drafts.test.mjs`
Expected: 全 pass（4 用例）。

- [ ] **Step 5: 不 commit（no-git-write）**

改动留在工作区。

---

### Task 3: use-rule-skills SKILL.md + references + 报告模板（docs）

**Files:**
- Create: `skills/use-rule-skills/SKILL.md`
- Create: `skills/use-rule-skills/references/routing.md`
- Create: `skills/use-rule-skills/references/flows.md`
- Create: `skills/use-rule-skills/assets/report-template.md`

**Interfaces:**
- Produces: 入口技能运行指引（SKILL.md 触发 + 路由 + 引用 references）；routing.md（意图判定）；flows.md（两路径流程 + 草稿箱交互）；report-template.md（spec §6）。

- [ ] **Step 1: 写 SKILL.md**

frontmatter（name: use-rule-skills；description: 入口：新建/优化规则——判定意图 → 路由 rule-writer 起草 / rule-inspector 评分 → 草稿箱管理 → 报告。触发「新建 rule / 优化这个 rule / 裸调用」；依赖 rule-inspector + rule-writer）。正文：触发条件 + 入口路由（引用 references/routing.md）+ 两路径流程（引用 references/flows.md）+ 草稿箱（drafts.mjs 用法）+ 报告（引用 assets/report-template.md）+ 落地（写 my-rules + aas sync + 删草稿）。

- [ ] **Step 2: 写 references/routing.md**

spec §2 意图判定表：显式新建 → 新建；带路径/优化 → 优化；裸调用 → 默认新建。路径指向 `my-rules/rules/<name>.md`。

- [ ] **Step 3: 写 references/flows.md**

spec §4（新建流程 8 步）+ §5（优化流程 6 步）+ §3.3/§3.4（草稿箱交互与生命周期）逐字落地，含 drafts 命令用法。

- [ ] **Step 4: 写 assets/report-template.md**

spec §6 报告模板全文（骨架 + 对比段 + 改动清单类型列 + 落地结论）。

- [ ] **Step 5: 验证**

Run（PowerShell）：
```powershell
@('skills/use-rule-skills/SKILL.md','skills/use-rule-skills/references/routing.md','skills/use-rule-skills/references/flows.md','skills/use-rule-skills/assets/report-template.md') | ForEach-Object { if(Test-Path $_){"OK $_"}else{"MISS $_"} }
```
Expected: 全 OK。`node skills/use-rule-skills/scripts/drafts.mjs ensure` 实测建目录（Task 2 产物）。

- [ ] **Step 6: 不 commit（no-git-write）**

改动留在工作区。

---

### Task 4: rule-writer 纯粹化 + 单源收敛（docs）

**Files:**
- Modify: `skills/rule-writer/SKILL.md`
- Modify: `skills/rule-writer/references/writing-guide.md`

**Interfaces:**
- Produces: rule-writer 不再含 inspector 步骤、注明"产出草稿"；writing-guide 自查表含冗余度 4 项；判据表改引用 criteria。

- [ ] **Step 1: 改 SKILL.md 写作流程**

原步骤 4（inspector 评分）与步骤 6（二次审查重跑）**删除**；流程改为「1 需求澄清/处方确认 → 2 起草（四要素+判定词归一）→ 3 自查（执行力度 8 + 冗余度 4 + 来源行 + 层级 + 判定词表内）→ 4 标题一致性三句 → 5 交付草稿」。末尾加一段：「产出是**草稿**（写在 use-rule-skills 草稿箱），合规以 rule-inspector 评分为准，验收/循环走 use-rule-skills；不经入口直用本技能 = 产出未验收草稿。」删除「报告模板见 rule-inspector/…」中对 report-template 的引用（报告归入口）。

- [ ] **Step 2: 改 writing-guide.md 单源 + 冗余度**

- 顶部声明：「判据权威在 `rule-inspector/references/criteria.md`；本文表格若与 criteria 冲突以 criteria 为准，不再复制判据表格全文，只写写作落地提示。」
- §二 自查表补「冗余度 4 项」行（无完全重复句 / 无空泛引导段 / 无来源行历史叙述 / 三检验报告），并注明判据见 criteria §2.4。
- §三 来源行模板 / §四 标题三句：保留写作提示，删掉与 criteria 重复的判定表述，改为「判据见 criteria §2.x」。

- [ ] **Step 3: 验证**

Run：`node --test skilldependencies/validate.test.mjs`（不应因本任务新增红——rule-writer 结构未动，只改内容）；grep `writing-guide.md` 确认无 `判定词表` 复制表格（单源核销）。
```powershell
$g = Get-Content 'skills/rule-writer/references/writing-guide.md' -Raw
if($g -match '见 criteria'){"OK 引用"}else{"MISS 引用"}
```
Expected: OK。

- [ ] **Step 4: 不 commit（no-git-write）**

改动留在工作区。

---

### Task 5: skilldependencies 注册 + aas sync + 全量验证

**Files:**
- Create: `skilldependencies/use-rule-skills.json`
- Modify: `skilldependencies/manifest.json`
- Modify: `skills/use-rule-skills/scripts/drafts.mjs`（如需按 validate 要求调整 package.json / 目录结构）

**Interfaces:**
- Consumes: Task 2 drafts.mjs；Task 1 score.mjs `--file`。
- Produces: manifest 登记 use-rule-skills；validate 全绿；aas sync 建运行时链接。

- [ ] **Step 1: 建 use-rule-skills.json**

照 `rule-writer.json` 结构（schemaVersion 1），dependencies.skills = [{name: rule-inspector}, {name: rule-writer}]。

- [ ] **Step 2: 改 manifest.json**

`skills` 数组加 `use-rule-skills`（观察现有条目格式照抄）。若 manifest 含 `references`/路径字段，一并补。

- [ ] **Step 3: 跑 validate**

Run: `node --test skilldependencies/validate.test.mjs`
Expected: 4/4 pass（新增技能登记后目录与 manifest 一一对应成立）。

- [ ] **Step 4: aas sync 建运行时链接**

Run（在 `D:\Seed\my-rules`）: `aas sync`
Expected: use-rule-skills 运行时链接出现（`~\.trae-cn\skills\use-rule-skills` 指向 `D:\Seed\retro-skills\skills\use-rule-skills`）。

- [ ] **Step 5: 全量测试 + 越界复检**

Run: `node --test skilldependencies/validate.test.mjs skills/rule-inspector/scripts/score.test.mjs skills/use-rule-skills/scripts/drafts.test.mjs`
Expected: 全 pass（validate 4 + score 47 + drafts 4 = **55**）。
越界：`node skills/rule-inspector/scripts/score.mjs --file D:\Seed\my-rules\rules\global-ask-before-acting.md --json | Select-String -Pattern '判据|建议删除'` → 无输出。

- [ ] **Step 6: 草稿箱实测（冒烟）**

Run（PowerShell）：
```powershell
node skills/use-rule-skills/scripts/drafts.mjs ensure
node skills/use-rule-skills/scripts/drafts.mjs ls
```
Expected: ensure 建目录；ls 列出（当前可能为空）。

- [ ] **Step 7: 不 commit（no-git-write）**

改动留在工作区。

---

## Self-Review 记录

**Spec coverage**：§1 职责三分 → Task 4（writer 纯粹化）；§2 路由 → Task 3 references/routing；§3 草稿箱 → Task 2 drafts.mjs + Task 3 flows；§4/§5 两路径流程 → Task 3 flows；§6 报告模板 → Task 3 report-template；§7 单源 → Task 4；§8 writer 纯粹化 → Task 4；§9.1 落位 + --file 工具补强 → Task 1 + Task 5；§9.2 打包 → 交付物 = 整个仓库（Task 5 aas）；§10 验收 1-8 → Task 2/3/4/5。✓

**无占位符**：drafts.mjs 实现代码、测试用例、score.mjs `--file` 改法均给全；命令可复算。

**类型一致性**：`ensure/ls/rmFile/rmRule` 签名在 Task 2 定义、Task 2 测试、Task 5 冒烟一致；`--file` 输出 = scoreFile 在 Task 1 测试钉死；manifest/use-rule-skills.json 结构与既有 rule-writer.json 一致。

**交付物**：skills/use-rule-skills/（SKILL.md + references/ + assets/ + scripts/）+ rule-writer 改造 + score.mjs `--file` + skilldependencies + aas sync。
