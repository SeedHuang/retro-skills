# skill-authoring 体系实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 落地 rule `skill-authoring-convention`（写 skill 的 7 项硬判据）+ skill `skill-inspector`（体检/处方/优化现有 skill），并修复存量 4 处跨技能路径引用。

**Architecture:** rule 管「不能犯」（判据），skill 管「怎么查怎么改」（6 步流程 + check.mjs 可复算检查），与规则侧 use-rule-skills 体系对称。check.mjs 复用 skilldependencies/manifest.json 的技能名清单做跨技能引用判定。

**Tech Stack:** Node ESM（.mjs）、node:test、PowerShell（aas sync）

**Spec:** `docs/superpowers/specs/2026-10-09-skill-authoring-design.md`

## Global Constraints

- **无 git 写操作**：本计划所有任务收尾动作 = 改动留在工作区，最终交用户决定提交方式。禁止 `git add` / `git commit` / `git push`（用户规则 no-git-write）。
- **判据 ④ 引用不复制**：`skill-authoring-convention.md` 里目录语义只写一行指针指向 `skill-assets-convention`，不复制其内容。
- **守卫判据（判据③）已修完**：score.mjs / drafts.mjs 已 realpath 归一化（2026-10-09 完成），本计划只建检查防回归，不再改这两个文件。
- **rule 落地只建源仓库**：写 `my-rules/rules/skill-authoring-convention.md`，再跑 `aas sync`（在 `D:\Seed\my-rules`）。
- **check.mjs 检查点**：① 跨技能路径引用 ② 自引用带前缀 ③ 守卫路径字符串比较（①②③ 脚本可复算）；判据 ④ 目录语义 + ⑤⑥⑦ 写作要求 = AI 体检时人工判，不脚本化。
- **存量修复范围**：仅 `retro-collect`、`multi-lens-review` 共 4 处跨技能路径引用（spec §1.1 实测清单）。

---

### Task 1: 写 rule `skill-authoring-convention.md`

**Files:**
- Create: `D:\Seed\my-rules\rules\skill-authoring-convention.md`

**Interfaces:**
- Consumes: `D:\Seed\retro-skills\docs\superpowers\specs\2026-10-09-skill-authoring-design.md` §4（判据 7 项）
- Produces: 一条可被 rule-inspector 评分的规则（类型：条件触发·禁令）

- [ ] **Step 1: 起草 rule 正文**

按 spec §4 的 7 项判据落成规则文档，结构照 `rule-writer` 的 writing-guide（来源行 + 判据 + 防掠过 + 冲突裁决 + 例外 + 验证）：

```markdown
# 写 skill 禁止用路径指路，脚本守卫必须免疫路径

> 来源：实测/踩坑（2026-10-09）｜证据：跨技能路径引用 4 处残留（spec §1.1）；Node 守卫路径字符串比较在 Junction 下静默退出（spec §1.2）｜落地：2026-10-09

**写 skill（新建或修订）时，两条硬判据，缺一即不合格。**

## 判据 ①：跨技能引用用技能名，禁止写对方技能内部文件路径

跨技能引用一律用**技能名**（「调用 `rule-inspector` 技能」「判据以 rule-inspector 技能为准」），禁止写对方技能的内部文件路径（`rule-inspector/references/criteria.md` 这类）。

- 正例：「判据：调用 `rule-inspector` 技能」
- 反例：「判据：`rule-inspector/references/criteria.md`」（诱导 agent 去文件系统找路径，用错 Junction/运行时/源仓库）

## 判据 ②：本技能内自引用用相对路径

本技能自己的 `references/` `scripts/` `assets/` 文件用相对路径（`references/x.md`），禁止带自己技能名前缀（`retro-collect/assets/...`）。

## 判据 ③：脚本「直接运行 vs 被 import」判断禁止路径字符串比较

判断脚本是否直接运行，禁止 `process.argv[1] === fileURLToPath(import.meta.url)` 或 `import.meta.url === pathToFileURL(process.argv[1]).href`——Junction/symlink 下路径字符串必不等 → 静默退出（exit 0 无输出）。

- 正例：`realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))`（Windows 再归一大小写）；Python 用 `if __name__ == "__main__"`；或独立 CLI 入口文件

## 判据 ④：目录语义遵循 skill-assets-convention

目录语义（scripts/references/assets 三档）按 `skill-assets-convention` 规则执行，本规则不复制其内容。

## 判据 ⑤：防掠过（不因来源豁免）

以上判据**不因来源豁免**——写 skill 的 agent、子代理、脚本生成、模板产出，都不豁免。任何来源的 skill 产出都要过 check.mjs。

## 判据 ⑥：冲突裁决

与其他指令 / 模板 / 计划冲突时，以本规则为准；拿不准先停下说明，等用户确认。

## 判据 ⑦：验证闭环

写完（或改完）skill 后必须跑 `check.mjs`，0 findings 才算完成；有 findings 先修再交付。

## 验证

跑 `check.mjs --dir skills/ --json`，目标 0 findings；自检判据 ⑤⑥⑦ 在 SKILL.md 里是否成文。
```

- [ ] **Step 2: 自查**（照 rule-writer 自查清单：四要素 / 执行力度 8 项 / 冗余度 / 来源行 / 层级）

- [ ] **Step 3: 验证落盘**

```powershell
# 核读文件内容与预期一致（必做，不信工具回执）
Get-Content 'D:\Seed\my-rules\rules\skill-authoring-convention.md' -Raw
```

---

### Task 2: 写 check.mjs（TDD：先写失败测试）

**Files:**
- Create: `D:\Seed\retro-skills\skills\skill-inspector\scripts\check.test.mjs`
- Create: `D:\Seed\retro-skills\skills\skill-inspector\scripts\check.mjs`

**Interfaces:**
- Consumes: `D:\Seed\retro-skills\skilldependencies\manifest.json`（技能名清单）
- Produces: `checkSkillDir(dir, { manifest })` → `{ findings: [{skill, check, line, text}] }`；CLI `--dir <skillsDir> --json` 输出该对象

- [ ] **Step 1: 写失败测试 `check.test.mjs`**

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { checkSkillDir } from './check.mjs'

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'check-'))
  for (const [rel, content] of Object.entries(files)) {
    const p = join(dir, rel)
    mkdirSync(require('node:path').dirname(p), { recursive: true })
    writeFileSync(p, content)
  }
  return dir
}

const MANIFEST = { skills: ['alpha', 'beta'] }

test('① 跨技能路径引用：命中', () => {
  const dir = fixture({
    'alpha/SKILL.md': '判据见 `beta/references/criteria.md`',
    'beta/SKILL.md': '# beta',
  })
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  assert.ok(findings.some(f => f.check === '跨技能路径引用' && f.skill === 'alpha'))
  rmSync(dir, { recursive: true })
})

test('① 自引用不算命中', () => {
  const dir = fixture({
    'alpha/SKILL.md': '见 `alpha/assets/x.md`',
  })
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  assert.ok(!findings.some(f => f.check === '跨技能路径引用'))
  rmSync(dir, { recursive: true })
})

test('② 自引用带技能名前缀：命中', () => {
  const dir = fixture({
    'alpha/SKILL.md': '见 `alpha/assets/x.md`',
  })
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  assert.ok(findings.some(f => f.check === '自引用带前缀'))
  rmSync(dir, { recursive: true })
})

test('③ 守卫路径字符串比较：命中', () => {
  const dir = fixture({
    'alpha/scripts/run.mjs': "if (process.argv[1] === fileURLToPath(import.meta.url)) { cli() }",
  })
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  assert.ok(findings.some(f => f.check === '守卫路径字符串比较'))
  rmSync(dir, { recursive: true })
})

test('干净 skill：0 findings', () => {
  const dir = fixture({
    'alpha/SKILL.md': '判据：调用 `beta` 技能\n见 `references/x.md`',
    'alpha/scripts/run.mjs': "if (realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) cli()",
    'beta/SKILL.md': '# beta',
  })
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  assert.equal(findings.length, 0)
  rmSync(dir, { recursive: true })
})
```

- [ ] **Step 2: 跑测试确认失败**

```powershell
node --test skills/skill-inspector/scripts/check.test.mjs
```

Expected: FAIL（`Cannot find module './check.mjs'`）

- [ ] **Step 3: 写最小实现 `check.mjs`**

```js
import { readFileSync, readdirSync, existsSync, realpathSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const CROSS_SKILL_RE = /`([a-z][a-z0-9-]*)\/(?:references|assets|scripts)\//g
const SELF_PREFIX_RE = /`([a-z][a-z0-9-]*)\/(?:references|assets|scripts)\//g
const GUARD_RE = /process\.argv\[1\]\s*===\s*fileURLToPath\(import\.meta\.url\)|import\.meta\.url\s*===\s*pathToFileURL\(process\.argv\[1\]\)\.href/

export function checkSkillDir(dir, { manifest }) {
  const skills = manifest?.skills ?? readdirSync(dir).filter(d => existsSync(join(dir, d, 'SKILL.md')))
  const findings = []
  for (const skill of skills) {
    const skillDir = join(dir, skill)
    const skillMd = join(skillDir, 'SKILL.md')
    if (existsSync(skillMd)) {
      const text = readFileSync(skillMd, 'utf8')
      // ① 跨技能路径引用：出现 <别的技能名>/references|assets|scripts/
      for (const m of text.matchAll(CROSS_SKILL_RE)) {
        if (m[1] !== skill) findings.push({ skill, check: '跨技能路径引用', line: lineOf(text, m.index), text: m[0] })
      }
      // ② 自引用带前缀：出现 <自己名>/xxx
      for (const m of text.matchAll(SELF_PREFIX_RE)) {
        if (m[1] === skill) findings.push({ skill, check: '自引用带前缀', line: lineOf(text, m.index), text: m[0] })
      }
    }
    // ③ 守卫路径字符串比较：scripts 目录下 .mjs
    const scriptsDir = join(skillDir, 'scripts')
    if (existsSync(scriptsDir)) {
      for (const f of readdirSync(scriptsDir).filter(f => f.endsWith('.mjs'))) {
        const s = readFileSync(join(scriptsDir, f), 'utf8')
        if (GUARD_RE.test(s)) findings.push({ skill, check: '守卫路径字符串比较', line: 0, text: f })
      }
    }
  }
  return { findings }
}

function lineOf(text, index) {
  return text.slice(0, index).split(/\r?\n/).length
}

// 仅直接运行时执行 CLI（realpath 归一化免疫 Junction，见 rule skill-authoring-convention 判据③）
if (process.argv[1]) {
  const self = realpathSync(fileURLToPath(import.meta.url))
  const arg = realpathSync(process.argv[1])
  const same = process.platform === 'win32' ? self.toLowerCase() === arg.toLowerCase() : self === arg
  if (same) cli()
}
function cli() {
  const argv = process.argv.slice(2)
  const dir = argv[argv.indexOf('--dir') + 1] ?? join(import.meta.dirname ?? dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'skills')
  const manifestFile = argv.includes('--manifest') ? argv[argv.indexOf('--manifest') + 1] : join(dir, '..', 'skilldependencies', 'manifest.json')
  const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : undefined
  const result = checkSkillDir(dir, { manifest })
  console.log(argv.includes('--json') ? JSON.stringify(result, null, 2) : `${result.findings.length} findings`)
}
```

- [ ] **Step 4: 跑测试确认通过**

```powershell
node --test skills/skill-inspector/scripts/check.test.mjs
```

Expected: PASS 5/5

---

### Task 3: 写 skill-inspector 的 SKILL.md + recipes + 报告模板

**Files:**
- Create: `D:\Seed\retro-skills\skills\skill-inspector\SKILL.md`
- Create: `D:\Seed\retro-skills\skills\skill-inspector\references\recipes.md`
- Create: `D:\Seed\retro-skills\skills\skill-inspector\assets\report-template.md`

**Interfaces:**
- Consumes: Task 2 的 `check.mjs`（CLI `--dir --json`）；spec §5 流程、§6 检查点
- Produces: 一个可被 Skill 工具加载、触发「体检 skills / 优化 skill」的技能

- [ ] **Step 1: 写 `SKILL.md`**（frontmatter + 流程 + 判据指针，不内联模板）

```markdown
---
name: skill-inspector
description: 体检 skills/ 里的技能——按 skill-authoring-convention 判据评分、出报告、给处方、修复优化。当用户说『体检 skills / 优化 skill / 检查技能』时触发。不自动触发。Do not use for 新建规则（那走 use-rule-skills）、改载体施工（那走 evolving-skills）。
---

# skill-inspector：判据驱动的技能检察员

## 触发条件

用户说「体检 skills / 优化 skill」时触发。**不自动触发**——体检活技能是高影响动作，按 `global-ask-before-acting` 必须先拿到指令。

## 判据权威

写 skill 的 7 项硬判据在 `skill-authoring-convention` 规则（每轮加载）；本技能只按它执行。

## 执行顺序（检查路径闭环，一次一条）

1. **跑检查**：`node <this-skill-dir>/scripts/check.mjs --dir <skills目录> --json`，记录每 skill 命中。
2. **出报告**：按 `assets/report-template.md` 逐 skill 出「findings + 处方」。
3. **给处方**：对照 `references/recipes.md`，把每类命中映射到修法。
4. **处方确认**：把清单列给用户，用户勾选改哪些（按 skill 或按类别批）。
5. **修复**：按处方一条一条改；每条过硬闸门（判据措辞不动 / 删冗余过三检验 / 不凑分）。
6. **复检**：改完重跑 check.mjs，确认 0 findings。
7. **最终报告**：分数 + findings 明细 + 修复清单 + 残留（用户接受）。

## 写新 skill 的前置自查

写 skill 之前先读 `skill-authoring-convention` 规则；写完后跑 `node <this-skill-dir>/scripts/check.mjs --dir <skills目录> --json`，0 findings 才交付。

## 判据与处方去哪读

- 判据权威：`skill-authoring-convention` 规则（每轮加载）
- 修法处方（每类命中 → 可复制的改法）：`references/recipes.md`
- 报告模板（输出用）：`assets/report-template.md`
- 检查脚本（确定性、可复现）：`scripts/check.mjs`
```

- [ ] **Step 2: 写 `references/recipes.md`**（每类问题的修法处方）

```markdown
# skill-inspector 处方：每类命中 → 修法

## ① 跨技能路径引用

**症状**：SKILL.md 写了 `<别的技能名>/references/xxx.md` 或 `<别的技能名>/assets/xxx.md`。

**修法**：改成技能名调用。三步：
1. 引用方写「判据/指引以 `<技能名>` 技能为准」；
2. 确需读对方文件时，Skill 调用该技能，由对方 SKILL.md 指引加载；
3. 删除路径写法，保留技能名。

**例子**：
- 改前：`判据见 rule-inspector/references/criteria.md`
- 改后：`判据以 rule-inspector 技能为准（Skill 调用加载）`

## ② 自引用带技能名前缀

**症状**：SKILL.md 写了 `<自己名>/xxx`（如 `retro-collect/assets/x.md`）。

**修法**：去掉技能名前缀，改相对路径。
- 改前：`见 retro-collect/assets/userwords-template.md`
- 改后：`见 assets/userwords-template.md`

## ③ 守卫路径字符串比较

**症状**：scripts 匹配 `process.argv[1] === fileURLToPath(import.meta.url)` 或 `import.meta.url === pathToFileURL(process.argv[1]).href`。

**修法**：换 realpath 归一化（照 score.mjs 已修复样板）：

```js
import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
if (process.argv[1]) {
  const self = realpathSync(fileURLToPath(import.meta.url))
  const arg = realpathSync(process.argv[1])
  const same = process.platform === 'win32' ? self.toLowerCase() === arg.toLowerCase() : self === arg
  if (same) cli()
}
```

或 Python `if __name__ == "__main__"`；或独立 CLI 入口文件。

## ④ 目录语义（AI 判）

**症状**：SKILL.md 内联大段模板代码块，或文件放错档（模板进 references、指引进 assets）。

**修法**：按 `skill-assets-convention` 规则：模板 → `assets/`；流程/口径/差异卡 → `references/`；可执行 → `scripts/`。SKILL.md 只留指针。
```

- [ ] **Step 3: 写 `assets/report-template.md`**（体检报告骨架）

```markdown
# skill-inspector 体检报告 · <日期>

## 总览
| 技能 | 命中数（①跨技能路径 ②自引用前缀 ③守卫） | 判据 ⑤⑥⑦ 自查 | 状态 |
|---|---|---|---|

## 明细（按技能）
### <技能名>
| # | 检查点 | 位置（文件:行） | 命中 | 处方 |
|---|---|---|---|---|

## 修复
- 用户确认修复范围：<skill 列表 / 类别>
- 已修复：<# 处>
- 残留（用户接受）：<清单>

## 复检
`check.mjs --dir skills/ --json` → findings：<N> → <M>（复检后）
```

- [ ] **Step 4: 验证**：核读三个文件落盘；`node --check` 语法校验 SKILL.md 无要求（markdown），确认 frontmatter 完整。

---

### Task 4: 登记依赖 + manifest + 校验测试

**Files:**
- Create: `D:\Seed\retro-skills\skilldependencies\skill-inspector.json`
- Modify: `D:\Seed\retro-skills\skilldependencies\manifest.json`（skills 数组加 `"skill-inspector"`）

**Interfaces:**
- Consumes: 现有 `validate.test.mjs`（校验 manifest 与 skills/ 一一对应）
- Produces: 新 skill 进入依赖体系

- [ ] **Step 1: 写 `skill-inspector.json`**

```json
{
  "schemaVersion": 1,
  "skill": "skill-inspector",
  "dependencies": {
    "skills": [
      { "name": "rule-inspector" }
    ]
  }
}
```

- [ ] **Step 2: manifest.json skills 数组追加 `"skill-inspector"`**（保持字母序：插在 `skill` 相关位置，实际按现有排序规则放到 `rule-writer` 与 `use-rule-skills` 之间）。

- [ ] **Step 3: 跑校验测试**

```powershell
node --test skilldependencies/validate.test.mjs
```

Expected: PASS 4/4

---

### Task 5: 修复存量 4 处跨技能路径引用

**Files:**
- Modify: `D:\Seed\retro-skills\skills\retro-collect\SKILL.md` L72, L93
- Modify: `D:\Seed\retro-skills\skills\multi-lens-review\SKILL.md` L71, L81

**Interfaces:**
- Consumes: Task 2 的 check.mjs（复检）
- Produces: 0 findings

- [ ] **Step 1: 修 `retro-collect/SKILL.md` L72**

改前：`| 情绪记录（重扫） | `managing-lessons-store/assets/moments-template.md`（结构 + 判定公式；重扫写入用） |`
改后：`| 情绪记录（重扫） | 调用 `managing-lessons-store` 技能，其 `assets/moments-template.md` 提供结构 + 判定公式；重扫写入用 |`

- [ ] **Step 2: 修 `retro-collect/SKILL.md` L93**

改前：`判定公式见 `retro-collect/assets/userwords-template.md``
改后：`判定公式见 `assets/userwords-template.md``

- [ ] **Step 3: 修 `multi-lens-review/SKILL.md` L71**

改前：`施工层同一套归因见 `evolving-skills/references/protocol.md` 步 2 的一般化版本，施工以那边为准`
改后：`施工层同一套归因以 `evolving-skills` 技能为准（其 protocol 步 2 的一般化版本，施工调用该技能）`

- [ ] **Step 4: 修 `multi-lens-review/SKILL.md` L81**

改前：`按`evolving-skills/references/review-flywheel.md` 执行，**本文件不复制那三步**`
改后：`按 `evolving-skills` 技能的 review-flywheel 执行，**本文件不复制那三步**`

- [ ] **Step 5: 复检**

```powershell
node skills/skill-inspector/scripts/check.mjs --dir skills --json
```

Expected: 0 findings（跨技能路径引用全清）

---

### Task 6: aas sync + 终验

**Files:**
- Modify: `D:\Seed\my-rules\rules\skill-authoring-convention.md`（Task 1 产物，已被 aas sync 链接）

**Interfaces:**
- Consumes: Task 1–5 全部产物
- Produces: 最终验收

- [ ] **Step 1: 跑 aas sync**

```powershell
# 在 D:\Seed\my-rules 下
aas sync
```

Expected: 只建缺失链接，`skill-authoring-convention` 已就位。

- [ ] **Step 2: aas 体检确认**

```powershell
aas
```

Expected: 「需建链接」应为 0。

- [ ] **Step 3: 全量测试**

```powershell
node --test skilldependencies/validate.test.mjs skills/skill-inspector/scripts/check.test.mjs skills/rule-inspector/scripts/score.test.mjs skills/use-rule-skills/scripts/drafts.test.mjs
```

Expected: 全 PASS。

- [ ] **Step 4: 用 skill-inspector 对现有 skills 跑一次真体检**，产出报告给用户看（首次体检 + 存量修复后应接近 0 findings）。
