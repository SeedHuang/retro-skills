# review-loop 进化实现计划

> **For agentic workers:** 按此计划逐任务实现。步骤用 checkbox（`- [ ]`）跟踪。**本计划不含任何 git 写操作步骤**——每个任务收尾 = 改动留在工作区，最终交用户决定提交方式。

**Goal:** 把 review-loop 的四个进化点落地：评论关联分析（A4）、每轮验证闸门、OCR 前置工程检测、package.json 固化检查入口。

**Architecture:** 四条进化都落 review-loop/review-log 技能文档 + 仓库根工具链。检查命令固化在根 `package.json` 的 `scripts.check`（内部调根 `scripts/check-all.mjs` 聚合：语法遍历 + 测试 + 技能守卫），review-loop 只调 `npm run check`，不重复命令文本。评论关联分析 = 修复纪律 A4（loop.md 定义判据）+ progress.md 本轮小节产物（review-log 模板）。

**Tech Stack:** Node.js（node --check / node --test，无外部依赖）、Markdown（技能文档）。

**Spec:** `docs/superpowers/specs/2026-10-14-review-loop-evolution-design.md`

## Global Constraints

- 无 git 写操作：每任务收尾改动留工作区，交用户决定提交（用户全局规则 `no-git-write`）。
- 检查命令单源：命令只在根 `package.json` 的 `scripts.check` 一处定义，review-loop 只调 `npm run check`，不在技能文档里复制命令全文（判据单源）。
- 零外部依赖：check-all.mjs 只用 Node 内置模块（fs / child_process / path），不引任何 npm 包。
- 不因来源豁免：OCR 前置工程检测对子代理/脚本同样生效。
- 写 skill 文档引用 reference 必须接「读→产出」闭环（loop.md A4 措辞不许写「读一下」类被动句）。
- 判定词归一：极性一律用表内词（禁止/不得/不要/必须/应/要/一律），不引入表外词。

## 已裁决的待决项（spec §5 全部裁决，executor 不重讨论）

1. **A4 落点**：修复纪律定义在 `loop.md` 修复纪律节（A3 之后），产物骨架加在 `review-log/assets/review-progress-template.md`「本轮改了什么」之前（「评论关联分析」小节）。
2. **check 脚本含显式 `node --check` 遍历**：实测 `node --test` 只编译测试文件及其 import 的模块，未被引用的脚本（如 `open-view.mjs`）语法错误会漏网；`node --check` 全仓遍历 7 个非测试 .mjs 仅 209ms，成本可忽略。check-all.mjs 必须先遍历所有非测试 .mjs 做语法检查，再跑测试，再跑技能守卫。
3. **验证闸门 vs 复查轮 OCR**：闸门抓「修坏了」（测试红/语法错），复查轮抓「逻辑错」（测试绿但行为错）。在 loop.md §1「整体停机」判据处显式补一句「进下一轮前验证闸门必须全绿」，防止闸门被跳过。
4. **package.json 两个层级**：skill 级（技能目录内，管该技能需要什么）与项目根级（仓库根，管工程基建）是两回事，本 plan 建的是**项目根级**（仅 scripts.check，零依赖），不影响任何 skill 级 package.json。`skills/use-rule-skills/scripts/package.json` = `{"type":"module"}` 是 ESM 声明，勿动。
5. **Agent-Skill 项目类型不细分**：17 技能同构，review-init 的「Agent Skill 项目」单类型够用，暂不细分；细分触发信号 = 出现异构技能（Python / 纯文档 / TS）。本 plan 不涉及 review-init 改动。

---

### Task 1: 根 package.json + check-all.mjs 固化检查入口

**Files:**
- Create: `package.json`（仓库根）
- Create: `scripts/check-all.mjs`（仓库根，新建 scripts/ 目录）

**Interfaces:**
- Produces: `npm run check`（聚合语法检查 + 测试 + 技能守卫）——Task 2/3/5 的验证闸门和 OCR 前置检测都调它。

- [ ] **Step 1: 新建仓库根 `package.json`**

内容（零依赖，只声明 name/private/scripts）：

```json
{
  "name": "retro-skills",
  "private": true,
  "scripts": {
    "check": "node scripts/check-all.mjs"
  }
}
```

> 说明：本仓 `skills/use-rule-skills/scripts/package.json` 已有 `{"type": "module"}`（ESM 声明），与根 package.json 职责不同、不冲突，**不要动它**。根 package.json 只做检查入口。

- [ ] **Step 2: 新建仓库根 `scripts/check-all.mjs`**

内容（Node 内置模块，零依赖；聚合三步：语法遍历 → 测试 → 技能守卫）：

```js
// check-all.mjs —— 仓库级检查入口（npm run check 的执行体）
// 职责：① 全仓非测试 .mjs 语法检查（node --check 遍历，防未被子进程 import 的脚本语法错漏网）
//       ② 全仓测试（node --test，glob 由 Node 22 自己展开）
//       ③ 技能规范守卫（skill-inspector check.mjs）
// 零外部依赖：只用 Node 内置模块。失败任一 → 非零退出（供脚本化调用拿失败信号）。
import { readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// 收集 skills/**/*.mjs（排除 *.test.mjs——测试文件由 node --test 编译）
function collectMjs(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) collectMjs(p, out)
    else if (entry.endsWith('.mjs') && !entry.endsWith('.test.mjs')) out.push(p)
  }
  return out
}

let failed = false

// ① 语法检查：node --check 逐个（只查语法，不执行）
for (const file of collectMjs(join(root, 'skills'))) {
  const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' })
  if (r.status !== 0) {
    failed = true
    console.error(`[语法] ${file}\n${r.stderr}`)
  }
}
if (!failed) console.log('① 语法检查通过')

// ② 测试：node --test（glob 由 Node 展开，引号包住防 shell 展开差异）
const t = spawnSync(process.execPath, ['--test', 'skills/**/scripts/*.test.mjs'], { cwd: root, encoding: 'utf8' })
console.log(t.stdout)
if (t.status !== 0) {
  failed = true
  if (t.stderr) console.error(t.stderr)
}

// ③ 技能守卫
const c = spawnSync(process.execPath, ['skills/skill-inspector/scripts/check.mjs'], { cwd: root, encoding: 'utf8' })
console.log(c.stdout)
if (c.status !== 0) {
  failed = true
  if (c.stderr) console.error(c.stderr)
}

if (failed) {
  console.error('check 未通过')
  process.exit(1)
}
console.log('check 全部通过')
```

- [ ] **Step 3: 验证 `npm run check`**

Run: `npm run check`
Expected: 三节输出（① 语法检查通过 / ② node --test 的 226 用例全过 / ③ 0 findings），末尾 `check 全部通过`，exit 0。

- [ ] **Step 4: 反向验证——故意引入语法错误，确认 check 会拦**

把 `scripts/check-all.mjs` 临时加一行 `const broken = ;` → `npm run check` 应报语法错误、exit 非 0 → 删掉该行 → 再跑恢复全绿。（验证闸门能拦「修坏了」，不是摆设。）

---

### Task 2: review-loop SKILL.md 加「OCR 前置工程检测」步骤

**Files:**
- Modify: `skills/review-loop/SKILL.md`（「先读范围规则」与「三种模式」之间，或「三段流程」段一之前——加「OCR 前置工程检测」小节）

**Interfaces:**
- Consumes: Task 1 的 `npm run check`。
- Produces: OCR 前强制先跑工程检测的流程步骤——Task 3/5 的验证闸门与其呼应（前置检测 = 每轮开头，验证闸门 = 每轮收尾）。

- [ ] **Step 1: 读 SKILL.md 确定插入位置**

读 `skills/review-loop/SKILL.md`，「先读范围规则」（L29-39）与「三种模式」（L41-49）之间插入新小节「## OCR 前置工程检测（每次触发必跑，先于段一）」。

- [ ] **Step 2: 插入小节**

在「先读范围规则」表之后、「三种模式」之前插入：

```markdown
## OCR 前置工程检测（每次触发必跑，先于段一）

**跑 OCR 之前，先跑 `npm run check`**——把可机械判定的问题（语法 / 测试 / 技能规范守卫）用工程工具先修掉，**不进入 OCR 范围**（OCR 是 LLM，审这类问题是浪费 token）。

1. `npm run check` 全绿 → 直接进「三种模式」选段跑。
2. 有红 → **先修**：语法错改语法、测试红改代码、守卫 findings 改技能文档——修完重跑 `npm run check` 直到全绿，才进 OCR。
3. 机械问题修完的改动，**在 OCR 之前的收尾一并锁基线**（同一轮 commit，message 按 `references/loop.md` §3 格式）。
4. 机械问题**不算 OCR 评论**——不喂给 OCR 重复审，也不进 problems.md 的 OCR 处置流程。

**不因来源豁免**：子代理、脚本执行本技能时同样先过 `npm run check`。

**为什么前置**：机械问题用工程工具查得又快又准（实测全仓语法检查 209ms + 测试 866ms vs OCR 单次 ~74 万 token / 4m39s）；把机械层剥离后，OCR 只审它真正擅长的逻辑 / 语义 / 跨文件一致性。
```

- [ ] **Step 3: 验证**

Run: `node skills/skill-inspector/scripts/check.mjs` → 0 findings（新小节无跨技能路径引用、无守卫违规）。重读 SKILL.md 确认小节位置正确、无 markdown 破损。

---

### Task 3: loop.md 修复纪律加 A4 评论关联分析 + 收尾加验证闸门

**Files:**
- Modify: `skills/review-loop/references/loop.md`（修复纪律节 A3 之后加 A4；§1 收尾表加验证闸门行；§1「整体停机」判据补闸门句）

**Interfaces:**
- Consumes: Task 1 的 `npm run check`。
- Produces: A4 判据（评论关联分析）——Task 4 在 review-log progress.md 模板加对应产物小节。

- [ ] **Step 1: 读 loop.md 确认插入位置**

读 `skills/review-loop/references/loop.md`：「修复纪律」节（A1/A2/A3，约 L105-112）与「§1 收尾表」（约 L55-64）与「§1 整体停机」（约 L33-45）。

- [ ] **Step 2: 修复纪律节 A3 之后插入 A4**

在 A3 条目之后追加：

```markdown
4. **A4 · 修复前先做评论关联分析**：把「本轮要修的评论」当一个整体，动手前先输出「评论关联分析」块（填进 progress.md 本轮小节，见 review-log 模板）：
   - **同文件/相邻代码**：哪些评论改同一文件、相邻区域 → **合并修**（一次 SearchReplace 覆盖，防并行编辑互相覆盖）；
   - **先后依赖**：有没有 A 改签名 → B 改调用点的链 → **先契约后消费**（按依赖顺序修，A 先落地、B 对齐 A 的新签名）；
   - **契约影响**：哪些评论动函数签名 / 返回 / CLI 参数 / 共享常量 → **列调用方数 + 影响面**，逐个调用方确认是否需要同步改；
   - **预期返回**：修完后这个函数/CLI 的预期返回变不变 → **写清**（变了要同步改文档/测试断言）。
   **分级**：解法被 OCR 判明（带建议/diff）+ 单文件 → 关联分析写一行直接修；解法未判明 + 有设计决策（签名/契约变更）→ 写修复 plan（关联表 + 解法 + 调用方影响面）并对 plan 做 md-review；解法未判明 + 跨文件 + 高影响 → 写 plan + 明确预期返回/调用方清单，plan 做 md-review + 修复后真实场景实测。
   **验收**：动手修前 progress.md 有「评论关联分析」块；同文件评论已合并；契约链已按依赖排序。缺关联分析 = 本轮修复不算数（对齐「必须逐项填满」语义）。
```

- [ ] **Step 3: §1 收尾表加「验证闸门」行**

在「收尾」表（建/更新过程账、扫声明它的地方、跑一次全量测试、合并、报结论、收尾审计）中，把「**跑一次全量测试**」行改写为「**跑一次验证闸门**」：

```markdown
| **跑一次验证闸门** | `npm run check`（语法 + 测试 + 守卫）全绿才 commit 锁基线、才进下一轮；有红先修再跑，直到全绿——这是进下一轮的前置，不是可选项 |
```

- [ ] **Step 4: §1「整体停机」判据处补闸门句**

在「整体停机」小节的「修复轮 + 复查轮，两轮都干净才停」之后补一句：

```markdown
**进下一轮的前置**：上一轮 commit 锁基线前，`npm run check` 必须全绿（验证闸门）；没跑或没全绿 = 那轮不算数，先补跑、修完、再进下一轮。
```

- [ ] **Step 5: 验证**

Run: `node skills/skill-inspector/scripts/check.mjs` → 0 findings。重读 loop.md 确认 A4 无「读一下」类被动措辞（全部接「读→产出」闭环）、收尾表与整体停机句位置正确。

---

### Task 4: review-log progress.md 模板加「评论关联分析」小节

**Files:**
- Modify: `skills/review-log/assets/review-progress-template.md`（「本轮改了什么」之前加「评论关联分析」小节）
- Modify: `skills/review-log/SKILL.md`（「必须逐项填满的」表加 A4 产物行）

**Interfaces:**
- Consumes: Task 3 的 A4 判据（本任务给产物落点）。
- Produces: progress.md 的「评论关联分析」小节骨架。

- [ ] **Step 1: 读 review-progress-template.md 确认插入位置**

读 `skills/review-log/assets/review-progress-template.md`：「### 本轮改了什么」小节（约 L42）之前插入「### 评论关联分析（修复前填）」。

- [ ] **Step 2: 插入小节**

在「### 本轮改了什么」之前插入：

```markdown
### 评论关联分析（修复前填，A4）

**动手修前先填这张表**（把本轮要修的评论当一个整体；判据见 review-loop loop.md 修复纪律 A4）：

| # | 评论 | 同文件/相邻代码 | 先后依赖 | 契约影响（签名/返回/CLI/常量 + 调用方数） | 预期返回变不变 | 处置（合并/排序/独立） |
|---|---|---|---|---|---|---|
| 1 | <OCR 第 N 条 / 段二 P2> | <改哪个文件> | <依赖谁 / 被谁依赖> | <影响面> | <是/否 + 说明> | <合并修 / 先修 / 独立修> |

**分级**：解法被 OCR 判明 + 单文件 → 本表一行 + 直接修；解法未判明 + 有设计决策 → 另行写修复 plan 并对 plan 做 md-review；未判明 + 跨文件 + 高影响 → plan + 预期返回/调用方清单 + 真实场景实测。
```

- [ ] **Step 3: review-log SKILL.md「必须逐项填满的」表加行**

在 `skills/review-log/SKILL.md` 的「必须逐项填满的」表（约 L52-61）加一行：

```markdown
| **评论关联分析**（本轮要修的评论 ≥1 条时） | 评论被孤立修，A 改签名 B 漏改调用点 → 中间态损坏；没有整体设计 = 修一半 |
```

- [ ] **Step 4: 验证**

Run: `node skills/skill-inspector/scripts/check.mjs` → 0 findings。重读两文件确认表格无破损、小节位置正确。

---

### Task 5: 全量验证

**Files:** 无（只跑验证）

- [ ] **Step 1: 全量检查**

Run: `npm run check`
Expected: ① 语法检查通过 ② node --test 226 用例全过 ③ 技能守卫 0 findings，末尾 `check 全部通过`。

- [ ] **Step 2: 关联分析产物实测**

读 `.session/reviews/2026-10-14-1706-execution-assurance-all/progress.md` 第 1 轮小节——按新模板标准走查：本轮 5 条修复（OCR 3 + 段二 2）的「评论关联分析」应如何填（⑤ 布尔化是契约定义者、③ 测试是消费者、④ JSDoc 是记录者 → 合并/排序），确认模板能承载本次案例（不要求补写旧账本，只验证模板够用）。

- [ ] **Step 3: 验证闸门拦截场景实测**

在 `scripts/check-all.mjs` 临时加一行 `const broken = ;` → `npm run check` 应报语法错误、exit 非 0 → 删掉该行 → 再跑恢复全绿。确认闸门能拦住「修坏了」。

- [ ] **Step 4: 落地扫引用（landing-sweep）**

`Get-ChildItem docs,skills,rules -Recurse -File -Include *.md | Select-String -Pattern '跑一次全量测试|全量测试'`——命中「验证闸门」改写前旧说法的位置，逐个对照新口径更新（A3「修复后真实场景实测」保留，它是单条修复实测，不是全量闸门，不冲突）。注意：旧说法可能同时存在于 loop.md（skills/）与 docs/ 的文档里，**两个目录都要扫**，别只扫 docs/。
