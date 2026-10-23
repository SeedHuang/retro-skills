# 议会（parliament）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 multi-lens-review 进化为议会（parliament）：13 个只读子代理花名册（编译式单源生成）+ 点将组队 + 3 轮答辩 + 侦探观察 + 两档审计闸门 + aas 第三同步链路。

**Architecture:** 技能本体（SKILL.md + 5 references + 6 assets）承载流程与判据；`scripts/gen-agents.mjs` 以「角色数据 + 模板」单源生成 13 个子代理文件到仓库根 `agents/`；aas 以文件级 symlink 同步到 `~/.trae-cn/agents/`；主持人/答辩方由执行会话的主 agent 扮演，评委/侦探/审计走独立上下文子代理（Agent 模式点名调度 / Builder 模式 Task 工具贴角色卡，无调度能力降级串行并标注）。

**Tech Stack:** Markdown（技能文档）、Node ≥22（node:test，零新依赖）、aas CLI（agent-assets-sync）。

**Spec:** `docs/superpowers/specs/2026-10-17-parliament-design.md`（本计划从 spec 论证而来，执行者两个都读；角色数据、模板全文、判据表均在 spec）。

## Global Constraints

- **禁止一切 git 写操作**：本计划不含 `git add/commit/push`；每任务收尾动作固定为「改动留工作区，交用户决定提交方式」（用户全局规则 no-git-write，优先于 writing-plans 模板的 Commit 步骤）。
- 文件写入一律用 Write 工具（UTF-8 无 BOM）；禁止 PowerShell `Set-Content -Encoding UTF8`（会写 BOM，Trae 解析 frontmatter 报错）。
- SKILL.md 的 description 只写触发条件，不写流程摘要（写摘要会让 agent 照摘要办事、跳过正文）。
- 跨技能引用只写技能名（如「调用 evolving-skills 技能」），禁写对方技能内部路径；本技能内自引用用相对路径（`references/x.md` 全称）。
- 脚本判断「直接运行 vs 被 import」必须用 `realpathSync` 比较（Junction 下字符串比较必不等 → 静默退出）。
- SKILL.md 正文 <200 行；技能与文档正文用中文。
- 每任务收尾跑 `npm run check`（= `node scripts/check-all.mjs`，跑全仓 `*.test.mjs` 且防零用例静默）须全绿。
- 改动落地后旧文件按批删除；`agents/` 目录只准放 13 个生成物，禁放 README 等其它文件（aas 文件级全量同步会污染运行时）。

---

### Task 1: 技能目录改名 + 新 SKILL.md

**Files:**
- Rename: `skills/multi-lens-review/` → `skills/parliament/`
- Rewrite: `skills/parliament/SKILL.md`（全文如下）
- Delete（本任务暂不删，Task 3 删）: `skills/parliament/references/role-panels.md`

**Interfaces:**
- Consumes: spec §2/§3/§5/§8（流程骨架）
- Produces: 目录 `skills/parliament/`；frontmatter `name: parliament`；引用 5 个 references 与 6 个 assets 的文件名（Task 2/3 按名创建）

- [x] **Step 1: 目录改名（文件系统改名，非 git 命令）**

Run（PowerShell）: `Rename-Item -LiteralPath "d:\Seed\retro-skills\skills\multi-lens-review" -NewName "parliament"`
Expected: 目录变为 `d:\Seed\retro-skills\skills\parliament`（内含旧 SKILL.md 与 references/role-panels.md）。运行时 junction `~\.trae-cn\skills\multi-lens-review` 变悬空——Task 6 用 aas 清理，本任务不碰。

- [x] **Step 2: 覆写 SKILL.md（全文）**
> 2026-10-17 施工注（Ruling 1）：实际落盘为裁决版全文——在下方原文的 step 0 追加「→ 按 `references/host-duties.md` 定答辩组编制（架构师 7 方向选一、研发 4 人按文档类型换编制）」、step 1 追加「（审 rule/skill/agents 类文档时，另对照 `references/failure-modes.md` 13 病根表逐层核对）」，使 SKILL.md 真正引用全部 5 个 references（与本任务 Interfaces 声明一致；host-duties/failure-modes 原文无入口指针）。行数 32 <200。

用 Write 工具覆写 `skills/parliament/SKILL.md`：

```markdown
---
name: parliament
description: 议会式多方评审。Use when 用户说「开议会」「议会评审」「评审团」「三方评审」，或要求评审/审查 PRD、spec、plan、rule、skill、agents、描述性或记录型文档、找逻辑漏洞、矛盾、盲点时。Do not use for code review or writing new docs.
---

# 议会（parliament）

## 它是什么
多方评审体系：主持人按「项目类型 × 文档类型」点将组队，评审团双清单提问（固定必问 + 自由探索），答辩方核实后作答，侦探观察三方行为，审计两档闸门收口；最多 3 轮答辩，未决项带双方摸查记录升级用户。

## 执行路径（开评前声明，报告必须标注实际走的路径）
- **A** Trae Agent / SOLO 会话：调度用户级子代理（`~/.trae-cn/agents/` 花名册，本仓 `agents/` 经 aas 同步），点名各成员。
- **B** Builder / IDE 会话：用 Task 工具派通用子代理，角色卡从 `agents/<角色>.md` 读取后逐字贴入任务提示词。
- **C** 无调度能力：主持人串行扮演各角色，报告醒目标注「降级模式」（第四层防线打折）。
- 角色卡由 gen-agents.mjs 单源生成；禁止手改 `agents/*.md`，改角色 = 改脚本数据 → 重新生成 → `--check`。

## 总流程
0. **组队**：读项目类型 → 按 `references/doc-taxonomy.md` 判文档类型 → 按 `references/assembly-matrix.md` 点将矩阵出提议名单 → 用户确认（覆盖矩阵零缺口 = 最低法定人数；侦探无条件常驻）
1. **评审**：被点评委并行独立出卡（每席：固定清单逐条作答 + 自由探索 3-5 问）→ 主持人汇总、去重、按族分组 → 追问轮发全体评委补视角
2. **答辩**：答辩方小组核实问题客观性 → leader 按 `references/debate-protocol.md` 逐卡作答（承认 / 反驳带依据 / 部分承认带修法）→ ≤3 轮
3. **侦探**：每轮答辩后行为核对（刁难 / 回避 / 丢卡），机械判据与处置表在 `references/debate-protocol.md`
4. **审计**：每轮填 `assets/round-check.md`（第 0 项轮际对账；不过 = 下一轮不得开始）；终局填 `assets/delivery-audit.md`（不过 = 不得宣布交付）
5. **升级**：3 轮未决按 `assets/escalation-report.md`（双方摸查记录与各自解法必填；无摸查 = 臆想争端，侦探驳回）
6. **修复纪律**：每修复带落点 → 重跑手法 3（跨章节一致性）→ 同族扫描 → 修复引入自查
7. **产出**：结论先行（X 矛盾 + Y 盲点 + Z 优化）→ 分级详述（`assets/issue-card.md` 格式）→ 自洽确认区 → 团队名单与轮间变更记录 → 实际执行路径标注

## 关键规矩
- 问题卡缺「证据」或「建议解法」= 废卡；无 P0 形态证据标 P0 = 级别不匹配
- 重提已关闭问题且无新证据 = 刁难；答辩反驳无依据 = 回避（侦探均按机械判据核）
- 审计两表必由审计专员本人实例完成，主持人代填即违规；证据栏空 = 不通过，不是待补
- 中断权与终裁权只在用户；技术分歧 3 轮内不升级
- 评审飞轮回流：使用中发现本应议会抓到却没抓到的问题 → 先记账进本技能 KB 账本，只告知「已记账」；「改」由用户在 lessons 发起后走 evolving-skills 技能
```

- [x] **Step 3: 验证**

Run: Grep 工具，pattern `^name: parliament$`，path `skills/parliament/SKILL.md` → 命中 1 行。
Run: PowerShell `(Get-Content "d:\Seed\retro-skills\skills\parliament\SKILL.md").Count` → 期望 <200。
（check.mjs 全量验收在 Task 3 references/assets 就位后跑——本任务引用了尚不存在的文件。）
收尾：改动留工作区。

---

### Task 2: references 五件（流程与判据知识层）

**Files:**
- Create: `skills/parliament/references/doc-taxonomy.md`
- Create: `skills/parliament/references/assembly-matrix.md`
- Create: `skills/parliament/references/host-duties.md`
- Create: `skills/parliament/references/debate-protocol.md`
- Create: `skills/parliament/references/failure-modes.md`

**Interfaces:**
- Consumes: spec §4/§5/§7.3/§8/§9（表全部逐字搬）
- Produces: 五个文件名被 SKILL.md 与 gen-agents.mjs（Task 4 读 assets）引用；host-duties.md 定义架构师 7 方向与研发 4 人编制表

- [x] **Step 1: doc-taxonomy.md**——正文 = spec §4 表逐字 + 每类型一段「评委关注点展开」（引用 spec §7.1 对应席清单，不重复抄全量，写「见该席生成卡」即可）。
- [x] **Step 2: assembly-matrix.md**——正文 = spec §5 表逐字 + 四条硬规矩逐字 + 「花名册常驻、按需点将」说明 + 轮间补点/自扩展（复制模板→填清单→aas sync）两节。
- [x] **Step 3: host-duties.md**——正文 = 主持人合规义务 6 条（不得代填审计两表 / 丢卡压卡留理由 / 名单变更留痕 / 跑机械计数贴输出 / 评审记录每轮落盘 / 宣布交付以审计通过为前提）+ 架构师 7 方向表 + 研发 4 人 × 文档类型编制表（审 rule 带规则工程背景、审 skill 带技能编写背景、审 agents 带提示词工程背景）。
- [x] **Step 4: debate-protocol.md**——正文 = spec §8 全部逐字（评审轮 / 答辩 / 升级协议 / 两档审计 / 修复纪律）+ 侦探机械判据与处置表（spec §7.2 逐字）+ 六手法全文（操作序列推演 / 字段生命周期 / 跨章节一致性 / 输入空间 / 假设显式化 / 可逆性——从旧 SKILL.md 技法段搬，作为技术维度评委与主持人追问轮的通用手法层）。
- [x] **Step 5: failure-modes.md**——正文 = spec §9 全部逐字（13 病根表 + 试金石 + 20 判据分配表 + 复盘回流）。
- [x] **Step 6: 验证**

Run: `node skills/skill-inspector/scripts/check.mjs` → 0 findings（若报「SKILL.md 引用了不存在的 assets」属预期——Task 3 补齐；引用类 findings 以 Task 3 收尾为准，其余 0）。
收尾：改动留工作区。

---

### Task 3: assets 六件模板 + 删旧面板 + 技能全量验收

**Files:**
- Create: `skills/parliament/assets/issue-card.md`（含问题卡 + 观察记录两节）
- Create: `skills/parliament/assets/defense-record.md`
- Create: `skills/parliament/assets/escalation-report.md`
- Create: `skills/parliament/assets/round-check.md`
- Create: `skills/parliament/assets/delivery-audit.md`
- Create: `skills/parliament/assets/agent-template.md`
- Delete: `skills/parliament/references/role-panels.md`（内容已并入 spec §7.1 各席清单）

**Interfaces:**
- Consumes: spec §6.1（模板全文）/§8（核对单与审计表）/§7.2（观察记录格式）
- Produces: `agent-template.md`（gen-agents.mjs 读它做占位替换，占位符 `{{NAME}} {{DESCRIPTION}} {{ZH_NAME}} {{DIMENSION}} {{IDENTITY}} {{FIXED_LIST}} {{OUTPUT_FORMAT}} {{SHARED_BLOCK}}`）；五张产出模板（流程与审计填卡用；gen 从 issue-card / round-check / delivery-audit 内联子代理输出格式）

- [x] **Step 1: agent-template.md**——正文 = spec §6.1 模板逐字（frontmatter 三行 + 七节结构）。
- [x] **Step 2: issue-card.md**——两节：`# 问题卡`八字段表（编号 Q-轮-序 / 提出角色 / 归属维度 / 问题描述 / 证据 / 严重级别 P0·P1·P2 / 建议解法【必填】/ 无问题时的显式声明格式）；`# 观察记录（侦探用）`五字段表（卡号 / 对象 / 行为类型 / 判定依据【引用原文】/ 处置建议）。
- [x] **Step 3: defense-record.md**——每卡一行表：问题编号 / 判定（承认·反驳·部分承认）/ 依据（实测证据）/ 修法或反驳理由 / 评审方是否接受。
- [x] **Step 4: escalation-report.md**——spec §8 升级协议字段逐字：争议焦点一句话 / 双方各自【立场·赞成原因·反对对方原因·摸查记录（查了什么+命令+结果）】/ 双方各自具体解法（必填）/ 侦探驳回记录 / 用户终裁栏（留空待填）。
- [x] **Step 5: round-check.md**——spec §8 轮间核对单：第 0 项轮际对账 + 五项机械核对（卡片字段齐 / 答辩字段齐 / 本轮终态对账 / 侦探观察存在且卡号真实 / 汇总未丢卡）+ 结论（过 / 不过+打回清单）+ 「审计员本人填写」声明行。
- [x] **Step 6: delivery-audit.md**——spec §8 交付审计表：A 节 6 项（A1 终态对账 / A2 P0P1 清零 / A3 落点抽查 ≥3 / A4 P2 三态齐 / A5 数字一致 / A6 升级项有终裁，各带证据栏）+ B 节按 doc-taxonomy 完成判据逐交付物核对 + 结论三态（通过 / 有条件通过【候选项+触发信号列明】/ 不通过【打回清单】）。
- [x] **Step 7: 删 role-panels.md**——DeleteFile 工具删除 `skills/parliament/references/role-panels.md`。
- [x] **Step 8: 验证（技能全量验收闸门）**
> 2026-10-17 施工注（Ruling 2）：`npm run check` 本次 268 pass / 1 fail——fail 为 `skilldependencies/validate.test.mjs`（skills/ 目录与 manifest 一一对应），根因 = Task 1 改名后 manifest 未跟随（spec §10 #4 属 Task 5 接线），预期中间态，Task 5 恢复全绿。

Run: `node skills/skill-inspector/scripts/check.mjs` → **0 findings**。
Run: `npm run check` → 全绿（此时 gen-agents.test.mjs 尚未存在，属预期）。
收尾：改动留工作区。

---

### Task 4: gen-agents.mjs + 守卫测试 + 生成 13 个子代理文件（TDD）

**Files:**
- Create: `skills/parliament/scripts/gen-agents.mjs`
- Test: `skills/parliament/scripts/gen-agents.test.mjs`
- Create（生成物）: `agents/` 下 13 个文件（reviewer-product / reviewer-interaction / reviewer-ui / reviewer-frontend / reviewer-backend / reviewer-ops / reviewer-qa / reviewer-ai / reviewer-security / reviewer-actuary / reviewer-audit / reviewer-reader / detective-observer）

**Interfaces:**
- Consumes: `assets/agent-template.md`、`assets/issue-card.md`、`assets/round-check.md`、`assets/delivery-audit.md`（读文件内联输出格式节）；spec §7.1/§7.2（ROLES 数据逐字源）
- Produces: 导出 `ROLES`（13 元素数组：`{ name, zh, dimension, description, identity, fixedList: string[], sharedBlock?: string, outputKind: 'issue-card' | 'observation' | 'audit' }`）、`buildAgent(role): string`、`renderAll(): { [name]: string }`、`checkAll(dir): string[]`、`AGENTS_DIR`；CLI：无参=生成、`--check`=校验不写、`--out <dir>`=写到指定目录

- [x] **Step 1: 写失败测试（全文）**

`skills/parliament/scripts/gen-agents.test.mjs`：

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { ROLES, buildAgent, renderAll, checkAll, AGENTS_DIR, TEMPLATE } from './gen-agents.mjs'

test('花名册 13 席：name 唯一、合法、含侦探与审计', () => {
  assert.equal(ROLES.length, 13)
  const names = ROLES.map((r) => r.name)
  assert.equal(new Set(names).size, 13)
  for (const n of names) assert.match(n, /^[a-z][a-z0-9-]{0,49}$/)
  assert.ok(names.includes('detective-observer'))
  assert.ok(names.includes('reviewer-audit'))
})

test('模板含全部占位符且特质节在位', () => {
  for (const ph of ['{{NAME}}', '{{DESCRIPTION}}', '{{ZH_NAME}}', '{{DIMENSION}}', '{{IDENTITY}}', '{{FIXED_LIST}}', '{{OUTPUT_FORMAT}}', '{{SHARED_BLOCK}}'])
    assert.ok(TEMPLATE.includes(ph), `模板缺占位符 ${ph}`)
  assert.ok(TEMPLATE.includes('## 共享特质'))
})

test('buildAgent：frontmatter 合法、tools 只读、占位符清零', () => {
  for (const r of ROLES) {
    const t = buildAgent(r)
    assert.ok(t.startsWith(`---\nname: ${r.name}\ndescription: `), `${r.name} frontmatter 不对`)
    assert.ok(t.includes('tools: Read, Glob, Grep'), `${r.name} tools 必须只读`)
    assert.ok(!t.includes('{{'), `${r.name} 有未替换占位符`)
    assert.ok(t.includes('## 固定必问清单'))
    assert.ok(t.includes('## 自由探索'))
  }
})

test('共享特质段 13 文件逐字一致（编译式单源）', () => {
  const seg = (t) => t.split('## 共享特质')[1].split('\n## ')[0]
  const first = seg(buildAgent(ROLES[0]))
  for (const r of ROLES) assert.equal(seg(buildAgent(r)), first)
})

test('生成物已落盘且与源零漂移', () => {
  for (const r of ROLES) {
    const onDisk = readFileSync(join(AGENTS_DIR, r.name + '.md'), 'utf8')
    assert.equal(onDisk, buildAgent(r), `${r.name}.md 与生成结果不一致（被手改或未重新生成）`)
  }
})

test('checkAll：一致报空、漂移报红', () => {
  const dir = mkdtempSync(join(tmpdir(), 'parliament-'))
  try {
    for (const [name, text] of Object.entries(renderAll())) writeFileSync(join(dir, name + '.md'), text)
    assert.equal(checkAll(dir).length, 0)
    writeFileSync(join(dir, ROLES[0].name + '.md'), buildAgent(ROLES[0]) + '\n手改一行\n')
    const diffs = checkAll(dir)
    assert.ok(diffs.length > 0 && diffs[0].includes(ROLES[0].name))
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
```

- [x] **Step 2: 跑测试确认红**

Run: `node --test skills/parliament/scripts/gen-agents.test.mjs`
Expected: FAIL（`./gen-agents.mjs` 不存在，Cannot find module）。

- [x] **Step 3: 写 gen-agents.mjs（骨架全文；ROLES 数据 reviewer-audit 为完整样例，其余 12 席按 spec §7.1 表与 §7.2 逐字转录成同构对象）**

```js
#!/usr/bin/env node
// 议会子代理生成器：角色数据（本文件 ROLES，唯一编辑点）+ assets/agent-template.md
// → 生成 13 个 agent 文件到 <仓库根>/agents/。改角色 = 改 ROLES → 重新生成 → --check。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { realpathSync } from 'node:fs'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const SKILL_DIR = resolve(HERE, '..')            // skills/parliament
const REPO_ROOT = resolve(HERE, '..', '..', '..') // 仓库根
export const AGENTS_DIR = join(REPO_ROOT, 'agents')
const ASSETS = join(SKILL_DIR, 'assets')
export const TEMPLATE = readFileSync(join(ASSETS, 'agent-template.md'), 'utf8')

// ── 共享块（唯一措辞处，编译进所有用到它的角色）──
const QUALITIES = TEMPLATE.split('## 共享特质（所有议会成员同一份措辞，禁止自行改写）\n')[1].split('\n## ')[0]
const SIX_METHODS = `
### 六手法全过（技术维度通用，每项必须有结论）
| # | 手法 | 一句话 |
|---|---|---|
| 1 | 操作序列推演 | 重复执行（幂等）/ 交叉执行 / 中断恢复 / 接管时刻（用户手动脏状态当合法输入推演） |
| 2 | 数据字段生命周期 | 谁写？谁读？何时失效？失效后残留会怎样？ |
| 3 | 跨章节一致性 | 表格×表格 / 文字×图 / 验收×现状 / 引用×定义 |
| 4 | 输入空间枚举 | 空 / 不存在 / 非法 / 含空格 / 多个 / 重复 / 异常结构 |
| 5 | 假设显式化 | 技术依赖 / 平台机制断言（逐条验真）/ 决策背后的隐含假设 |
| 6 | 可逆性与确认策略 | 破坏性操作按可逆性排序，不可逆必确认 |`
const AUDIT_RULES = `
### 审计铁律
- 轮间核对单与交付审计表必由你本人实例完成；主持人代填即违规
- 证据栏空 = 不通过，不是待补
- 你无中断评审权；不裁决技术分歧；机械绿 ≠ 语义真（限度自知并声明）`
const DETECTIVE_RULES = `
### 侦探处置表
- 评委废卡率 ≥ 1/3 → 该评委本轮产出全部复审；复审仍超 → 下轮只答固定清单
- 答辩同一问题连续 2 轮回避 → 该问题强制进升级报告
- 主持人无理由丢卡 / 代填审计表 → 记违规，直报用户（记录进最终报告）
- 你只记录不裁决；观察记录原文进最终报告，不得删改；每条记录必须引用真实卡号`

// ── 角色数据（唯一编辑点；其余 12 席按 spec §7.1 表 / §7.2 逐字转录，字段同构）──
export const ROLES = [
  {
    name: 'reviewer-audit', zh: '审计专员', dimension: '独立（标准核对）',
    description: '在议会评审中担任审计专员。当议会评审需要过程标准核对、轮际对账或交付审计时调用',
    identity: '资深审计专员，只审各项标准是否达到，不裁技术对错，不提新技术问题。',
    fixedList: [
      '卡片合规：八字段齐（缺证据或建议解法 = 废卡）',
      '级别匹配：P0 需两处冲突证据；P1 需可复现触发序列；否则应降级',
      '答辩合规：判定（承认/反驳/部分承认）+ 依据 + 修法三字段齐',
      '计数一致：卡片数 = 已修 + 关闭 + 候选 + 升级 + 带往下轮',
      '轮际对账：上轮承诺与本轮开卷清单逐项相等（少 = 蒸发，多 = 无来源）',
      '落点真实：修复对照抽查 ≥3，文件:行号真实存在且内容相符',
      '证据可复算：任抽一条沿证据链能重现结果',
    ],
    sharedBlock: AUDIT_RULES, outputKind: 'audit',
  },
  // …… 其余 12 席：reviewer-product / interaction / ui / frontend / backend /
  // ops / qa / ai / security / actuary / reader（fixedList = spec §7.1 对应清单逐字，
  // frontend/backend 的 sharedBlock = SIX_METHODS）+ detective-observer
  // （fixedList = spec §7.2 三类机械判据逐字，sharedBlock = DETECTIVE_RULES，outputKind = 'observation'）
]

// ── 输出格式内联（从 assets 模板读节，模板即格式权威）──
const section = (text, heading) => text.split(`# ${heading}`)[1].split('\n# ')[0]
const issueCard = () => section(readFileSync(join(ASSETS, 'issue-card.md'), 'utf8'), '问题卡')
const observation = () => section(readFileSync(join(ASSETS, 'issue-card.md'), 'utf8'), '观察记录（侦探用）')
const auditFormats = () =>
  section(readFileSync(join(ASSETS, 'round-check.md'), 'utf8'), '轮间核对单') +
  '\n' + section(readFileSync(join(ASSETS, 'delivery-audit.md'), 'utf8'), '交付审计表')
const OUTPUT_FORMATS = { 'issue-card': issueCard(), observation: observation(), audit: auditFormats() }

// ── 生成 ──
export function buildAgent(role) {
  const fixed = role.fixedList.map((q, i) => `| ${i + 1} | ${q} | 待答 |`).join('\n')
  return TEMPLATE
    .replaceAll('{{NAME}}', role.name)
    .replaceAll('{{DESCRIPTION}}', role.description)
    .replaceAll('{{ZH_NAME}}', role.zh)
    .replaceAll('{{DIMENSION}}', role.dimension)
    .replaceAll('{{IDENTITY}}', role.identity)
    .replaceAll('{{FIXED_LIST}}', `| # | 必问 | 回答 |\n|---|---|---|\n${fixed}`)
    .replaceAll('{{OUTPUT_FORMAT}}', OUTPUT_FORMATS[role.outputKind])
    .replaceAll('{{SHARED_BLOCK}}', role.sharedBlock ? role.sharedBlock + '\n' : '')
}
export const renderAll = () => Object.fromEntries(ROLES.map((r) => [r.name, buildAgent(r)]))
export function checkAll(dir = AGENTS_DIR) {
  const diffs = []
  for (const [name, text] of Object.entries(renderAll())) {
    const p = join(dir, name + '.md')
    try { if (readFileSync(p, 'utf8') !== text) diffs.push(`${name}.md 与源数据漂移`) }
    catch { diffs.push(`${name}.md 缺失`) }
  }
  return diffs
}

// ── CLI（realpath 判定直接运行；Junction/大小写安全）──
function isMain() {
  try {
    const a = realpathSync(process.argv[1]).toLowerCase()
    const b = realpathSync(fileURLToPath(import.meta.url)).toLowerCase()
    return a === b
  } catch { return false }
}
if (isMain()) {
  const check = process.argv.includes('--check')
  const outIdx = process.argv.indexOf('--out')
  const outDir = outIdx > -1 ? resolve(process.argv[outIdx + 1]) : AGENTS_DIR
  if (check) {
    const diffs = checkAll(outDir)
    if (diffs.length) { console.error('漂移：\n' + diffs.join('\n')); process.exit(1) }
    console.log(`OK：${ROLES.length} 个 agent 与源数据一致`); process.exit(0)
  }
  mkdirSync(outDir, { recursive: true })
  for (const [name, text] of Object.entries(renderAll())) writeFileSync(join(outDir, name + '.md'), text)
  console.log(`已生成 ${ROLES.length} 个 agent 文件 → ${outDir}`)
}
```

- [x] **Step 4: 跑生成 + 测试确认绿**

Run: `node skills/parliament/scripts/gen-agents.mjs` → 输出「已生成 13 个 agent 文件」
Run: `node --test skills/parliament/scripts/gen-agents.test.mjs` → 全绿（6 用例）
Run: `node skills/parliament/scripts/gen-agents.mjs --check` → OK（重跑确定性）
Run: PowerShell `Get-ChildItem "d:\Seed\retro-skills\agents" | Measure-Object` → Count = 13

- [x] **Step 5: 验证子代理文件形态抽查**

Run: Read `agents/reviewer-audit.md` 头 30 行 → frontmatter 三行齐（name/description/tools: Read, Glob, Grep）、共享特质节与模板逐字一致、固定清单表 7 行。
收尾：改动留工作区。

---

### Task 5: 接线——skilldependencies + 12 文件引用替换

**Files:**
- Rename + Modify: `skilldependencies/multi-lens-review.json` → `parliament.json`（`"skill": "parliament"`，依赖三条不变）
- Modify: `skilldependencies/manifest.json`（skills 数组 `multi-lens-review` → `parliament`）
- Modify: `skilldependencies/prd-to-specs.json`、`skilldependencies/review-loop.json`（依赖名替换）
- Modify（`multi-lens-review` → `parliament`，逐字替换；guide 段落描述同步为新体系一句话）: `README.md`、`docs/guide/skills/README.md`、`skills/prd-to-specs/SKILL.md`、`skills/prd-to-specs/references/quality-gates.md`、`skills/review-loop/SKILL.md`、`skills/review-loop/references/loop.md`、`skills/review-loop/references/project-type.md`、`skills/review-loop/references/mode-all.md`、`skills/review-log/assets/review-progress-template.md`、`skills/evolving-skills/references/review-flywheel.md`、`docs/after/20261015210914-review-ledger-mechanical-gate.md`

**Interfaces:**
- Consumes: Task 1-4 的目录与技能名
- Produces: 全仓活文件对 `parliament` 的统一引用；历史文档（specs/plans/handoffs/architecture、rules/skill-authoring-convention.md 来源行）**不改**

- [x] **Step 1: skilldependencies 四件**——Rename-Item json + 逐文件改 `"skill"`/`"name"` 字段；改完跑 `node scripts/check-all.mjs` 的依赖校验（若仓库有 deps 校验脚本则跑之）。
- [x] **Step 2: 12 文件引用替换**——每文件用 Grep 定位 `multi-lens-review` 全部命中行，逐处替换为 `parliament`；`docs/guide/skills/README.md` §7 的技能描述段改写为：「议会评审：按项目类型×文档类型点将组队，评审团双清单提问、答辩方作答、侦探观察、审计闸门，3 轮答辩未决升级用户」；`README.md` 表行同步。
> 2026-10-17 施工注（Ruling 3）：`skills/evolving-skills/references/protocol.md` 的 3 处 multi-lens-review 属 2026-09-28/29 迁移事件历史出处注记，按 spec §10 #3「历史证据不改」同性质处理，不改；验收排除清单加入该文件。Step 3 验收实际结果：活引用命中 0（残留仅受保护/历史类）。
- [x] **Step 3: 清零验证**

Run: Grep pattern `multi-lens-review`，path `d:\Seed\retro-skills`，排除 `docs/superpowers/`、`docs/handoffs/`、`docs/architecture*`、`docs/reports/`、`rules/`、`skilldependencies`（已改名）→ 活文件命中 0。
Run: `npm run check` → 全绿（含 gen-agents 守卫）。
Run: `node skills/skill-inspector/scripts/check.mjs` → 0 findings。
收尾：改动留工作区。

---

### Task 6: aas 第三链路 + 同步 + 实测调度（含用户手动闸门）

**Files:**
- Modify: `D:\Seed\agent-assets-sync\sync.config.json`（linkTargets 加第三条）
- Create（由 aas 生成，非手建）: `~\.trae-cn\agents\` 下 13 个 symlink

**Interfaces:**
- Consumes: Task 4 的 `agents/` 13 个文件；aas CLI（`D:\Seed\agent-assets-sync`）
- Produces: 用户级子代理花名册运行时就位；旧 `~\.trae-cn\skills\multi-lens-review` 悬空 junction 清理

- [x] **Step 1: 探测现有解析机制**

Run: PowerShell `Get-ChildItem Env: | Where-Object Name -like 'RETRO_*'` 与 `aas`（体检）。
判读：skills 条目走 env（RETRO_SKILLS_DIR）还是 repoRoot 相对解析 → agents 条目**镜像同款机制**（env 键名用 `RETRO_SKILLS_AGENTS` / `TRAE_AGENTS_DST`）。
> 2026-10-17 实测（Ruling 4）：env 未设置；`~/.aas/config.json` 有 repoRoot → skills 走 repoRoot 相对解析；agents 镜像同款，env 块保留未设变量。

- [x] **Step 2: 加第三条 linkTarget（在 skills 条目后追加）**

```json
{
  "label": "用户级子智能体",
  "srcDir": "agents",
  "dstDir": "~/.trae-cn/agents",
  "dstName": "{name}",
  "level": "file",
  "editor": "trae-cn",
  "env": { "srcDir": "RETRO_SKILLS_AGENTS", "dstDir": "TRAE_AGENTS_DST" }
}
```
（若 Step 1 判明 skills 条目靠 env 变量，则同步 `[Environment]::SetEnvironmentVariable('RETRO_SKILLS_AGENTS','D:\Seed\retro-skills\agents','User')` 并镜像 skills 现有 env 值的设置方式。）
> 2026-10-17 实测：已加；JSON 校验通过。

- [x] **Step 3: 同步 + 体检**

Run: `aas sync` → 期望新建 `~\.trae-cn\agents\` + 13 个文件级链接（缺失才建）。
Run: `aas` 体检 → 「需建链接 = 0」；旧 multi-lens-review junction 应报为孤儿/失效。
Run: `aas sync --rm-old` → 清理失效链接（**只删运行时链接，不动源仓库、非 git 操作**；删前核对体检输出确认只含预期孤儿）。
> 2026-10-17 实测：sync 建 14 链接；rm-old 清 multi-lens-review；体检 0 需建 0 残留；13 agent 链接为 SymbolicLink 实测。体检 exit 1 为预存 skill-creator 漂移（另事，未动）。

- [ ] **Step 4: 用户手动闸门（阻塞后续任务的验收，不可跳过）**

用户开一个新对话，@Agent 点名任一评委（如「用 reviewer-qa 评委评审 skills/rule-writer 的测试判据」）：
① 子代理被调度成功；② 回答呈现该席固定清单的领域内容（证明角色卡加载）；③ 与主对话上下文隔离（独立窗口）。
→ 通过：结果记入验收报告；不通过：回退路径 B（Builder 会话 Task 工具贴角色卡），`agents/` 保留作为 A 路径资产，SKILL.md 执行路径声明不变。
收尾：改动留工作区（sync.config.json 属另一仓库，同样只改不提交）。

---

### Task 7: 历史回归验收——用议会重审 rule-writer / rule-inspector

**Files:**
- Create: `.session/reviews/2026-10-17-1707-parliament-acceptance/`（`problems.md` 问题漏斗 + `progress.md` 过程账；2026-10-17 按 review-log 规矩修正落点——原计划误写 `docs/reports/.../acceptance.md`，docs/reports/ 只放分析数据）
- Modify: `D:\Seed\lessons\skills\parliament\ledger.md`（验收结论回填）

**Interfaces:**
- Consumes: 建成的议会技能（走路径 B：Builder 会话 Task 派子代理）；`docs/reports/2026-10-16-1-rule-writer-rule-inspector-深度评审报告/problems.md`（标准答案卷：P0-1/2/3、P1-1~5）
- Produces: 议会判据质量的实测证据；漏抓项回填判据

- [x] **Step 1: 走完整议会流程**——按新 SKILL.md 组队（纯文档仓库矩阵：读者代表+审计+测试+AI+后端，用户确认名单）审 `skills/rule-writer` + `skills/rule-inspector`，产出问题卡、答辩记录、两档审计表。
> 2026-10-17 实测：5 席并行出卡 52 张 → 41 族 → 答辩（承认 40/部分 1/反驳 0）→ 侦探抓到主持人账目错误 3 条 → 审计打回 3 项 → 修正后复审放行（轮间核对过、交付审计通过）。
- [x] **Step 2: 对标准答案**——acceptance.md 填复现对照表：10-16 报告的 P0-1（草稿评分链路断裂）/P0-2（「评审第 N 轮」字面匹配）/P0-3（词表三层漂移）/P1-1~5 各自「议会是否抓到 / 由哪席哪条判据抓到 / 未抓到的归因」。
> 2026-10-17 实测：P0 3/3、P1 4/5 + 1 部分、P2 2/2 复现（对照表与结论见 `.session/reviews/2026-10-17-1707-parliament-acceptance/progress.md`，问题漏斗见同目录 `problems.md`）。
- [x] **Step 3: token 实测**——记录本场评审子代理实例化与主会话消耗（以工具返回/会话统计为准，注明取数口径），对照判据：同等评审质量下总 token ≤ 旧体系漏审返工总成本（参照 10-16 报告 §2.3 的实测口径）。
> 2026-10-17 实测：8 次子代理调度（5 评委+侦探+审计+复审），Task 工具不返回逐子代理 token → 以调度计数+工作量代理为近似口径（`.session/reviews/2026-10-17-1707-parliament-acceptance/progress.md` §Token 实测），精确值待补。
- [x] **Step 4: 回流**——漏抓项：改 spec §7.1 对应席清单 + gen ROLES 数据 → 重新生成 → `--check`；KB 账本记新 open 条目。全抓：账本 L-001~L-003 状态改 `landed(→skill)`，议会验收通过。
> 2026-10-17 实测：漏抓 2 项（P1-1/P1-2）→ spec §7.1 补 reviewer-qa 第 9 条 + reviewer-ai 第 8 条 → gen-agents.mjs ROLES 同步 → 重新生成 13 agent + `--check` OK + 6 测试绿 + `npm run check` 275 全绿；KB 账本 L-001~L-003 改 landed(→skill)、新增 L-004/L-005 open。验收结论：**有条件通过**。
收尾：改动留工作区，交用户决定提交方式。

---

## Self-Review 记录

- **Spec 覆盖**：spec §3 布局→Task 1-4；§4/§5→Task 2；§6→Task 3/4；§7→Task 4（数据逐字源已注明）；§8→Task 2/3；§10→Task 5/6；§11 批 5→Task 7。无缺口。
- **占位符扫描**：唯一「按 spec §7.1 逐字转录」处为数据转录指令，内容在 spec 中完整存在（非 TBD）；无「适当处理」「后续补充」类空步骤。
- **类型一致**：`ROLES` 字段、`buildAgent/renderAll/checkAll` 签名在 Task 4 Step 1 测试与 Step 3 实现中逐字一致；`AGENTS_DIR` 导出名一致。
- **no-git-write**：全计划 0 个 git 步骤（模板 Commit 步骤按用户全局规则移除，收尾统一「改动留工作区」）。
