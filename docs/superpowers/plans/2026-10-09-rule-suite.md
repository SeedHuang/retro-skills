# rule 判据全集与技能套件实现计划（rule-inspector + rule-writer）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 Spec A（`docs/superpowers/specs/2026-10-09-rule-suite-design.md`）实现：判据全集改为「检查点 1 分制」，`rule-optimizer` 改造为 `rule-inspector`，新建 `rule-writer`，组成规则体检/编写套件。

**Architecture:** `score.mjs` 按 Spec A §2.4 的 24 个检查点评分（每项 1 分、满分=检查点数、级别按得分率）；判据与报告模板落在 `rule-inspector`；`rule-writer` 产出规则草稿后调 `rule-inspector` 评分。两个 skill 共享一份 `criteria.md`。

**Tech Stack:** Node.js（`node:test`，无第三方依赖）、PowerShell（取数/aas）、Markdown。

**Spec:** `docs/superpowers/specs/2026-10-09-rule-suite-design.md`（判据 §2、报告模板 §3、技能 §4——实现者需同读）

## Global Constraints

- **不 commit（no-git-write）**：每个任务收尾 = 改动留在工作区，最终统一交用户决定提交方式。**禁止 git add / git commit / git push。**
- **判据 = 检查点 1 分制**（Spec A §2.4）：满分 = 当前检查点总数（24）；得分/满分；级别按得分率（健康 ≥90% / 预警 70–89% / 超标 <70%）。
- **确定性**（score.mjs）：同输入必同输出；不引 LLM、不引随机、不联网。
- **不适用项不计入满分**（非禁令类规则省略④⑤⑥；禁令类判定见 Spec A §2.4 表尾）。
- **更名/新技能后必须 `aas sync`** 重建运行时链接（rule-optimizer 链接换指向、rule-writer 建链接）。
- 落点：`D:\Seed\retro-skills\skills\`（本仓）。

---

### Task 1: rule-optimizer → rule-inspector 更名

**Files:**
- Rename: `skills/rule-optimizer/` → `skills/rule-inspector/`
- Modify: `skills/rule-inspector/SKILL.md`（name: rule-inspector + description 更新：体检已有规则）
- Modify: `skilldependencies/rule-optimizer.json` → `skilldependencies/rule-inspector.json`（skill 名改）

**Interfaces:**
- Produces: `rule-inspector/` 目录就位（SKILL.md、references/、assets/、scripts/），后续任务的判据/模板/脚本都落在它的目录下。

- [ ] **Step 1: 更名目录与依赖清单**

用 PowerShell 重命名（保留文件）：
```powershell
Rename-Item 'd:\Seed\retro-skills\skills\rule-optimizer' 'd:\Seed\retro-skills\skills\rule-inspector'
Rename-Item 'd:\Seed\retro-skills\skilldependencies\rule-optimizer.json' 'd:\Seed\retro-skills\skilldependencies\rule-inspector.json'
```
Expected: 两个路径已更名（`Test-Path` 确认新路径存在）。

- [ ] **Step 2: 更新 SKILL.md frontmatter**

`skills/rule-inspector/SKILL.md` 的 frontmatter：`name: rule-optimizer` → `name: rule-inspector`；description 改为「体检 my-rules/rules/ 里的规则——按判据全集评分、出报告、给处方、防劣化。当用户说『体检 rules / 优化 rules』时触发。不自动触发。Do not use for 新建规则（那走 rule-writer）、审查（那走 review-loop）。」正文标题同步改「rule-inspector：判据驱动的规则检察员」。硬闸门/流程保留原文（内容在后续任务随判据更新）。

- [ ] **Step 3: 更新 rule-inspector.json 的 skill 名**

`skilldependencies/rule-inspector.json` 的 `"skill": "rule-optimizer"` → `"skill": "rule-inspector"`（保持 dependencies 不变）。

- [ ] **Step 4: 验证 manifest 暂不通过是可预期的**

此时 `manifest.json` 还写着 rule-optimizer——validate 测试会红。**这是预期的中间态**（Task 6 才更新 manifest）。跳过 validate，直接下一步。

- [ ] **Step 5: 不 commit（no-git-write）**

改动留在工作区。

---

### Task 2: 判据落地 criteria.md（检查点 1 分制）+ 报告模板

**Files:**
- Modify: `skills/rule-inspector/references/criteria.md`
- Create: `skills/rule-inspector/assets/rule-report-template.md`

**Interfaces:**
- Produces: `criteria.md` = 判据全集（Spec A §2 落地）；`rule-report-template.md` = 报告模板（Spec A §3 落地）。`score.mjs`（Task 3）按 criteria 的检查点实现。

- [ ] **Step 1: 重写 criteria.md 为检查点制**

按 Spec A §2 逐节重写 `skills/rule-inspector/references/criteria.md`，内容照抄 Spec A（§2.1 来源类型 / §2.2 层级 / §2.3 三检验 / §2.4 评分维度：硬性 8 检查点 + D4 参考 + 执行力度 8 + 冗余 4 + 标题 4 + 计分方式）。**必须逐字**——检查点清单、判定、得分列与 Spec A 一致（24 项）。

- [ ] **Step 2: 建报告模板**

`skills/rule-inspector/assets/rule-report-template.md` 照抄 Spec A §3 的代码块（检查点明细 /1、组 summary X/N、整体 X/N + 得分率 + 级别、问题明细、二次审查结论、验证）。

- [ ] **Step 3: 验证检查点对齐**

运行（PowerShell）：
```powershell
$c = Get-Content 'skills/rule-inspector/references/criteria.md' -Raw
@('来源类型','层级规范','三检验','极性明确','动作内容具体','适用条件精细','来源覆盖','冲突裁决','例外从严','触发机制','验证闭环','完全重复句','空泛引导段','历史叙述','三检验报告','判据式','关键前提','内容一致性','计分方式') | ForEach-Object { if($c -match [regex]::Escape($_)){"OK $_"}else{"MISS $_"} }
```
Expected: 全部 `OK`（19 个关键词都在）。

- [ ] **Step 4: 不 commit（no-git-write）**

改动留在工作区。

---

### Task 3: score.mjs 扩展为检查点评分（TDD）

**Files:**
- Modify: `skills/rule-inspector/scripts/score.mjs`
- Modify: `skills/rule-inspector/scripts/score.test.mjs`

**Interfaces:**
- Consumes: `criteria.md` 的 24 个检查点（Task 2）。
- Produces: `scoreFile(filePath, rulesDir, opts)` → `{ name, lines, chars, groups: {头部规范:{得分,满分}, …}, total, max, rate, level, findings }`；`scoreDir(dir)` 汇总；CLI `--json`。

- [ ] **Step 1: 写失败测试（TDD 红）**

在 `score.test.mjs` 追加用例（fixture 复用现有的 GOOD/NO_SOURCE/NO_LANDING/LONG_SOURCE/BROKEN_REF）：
- GOOD（合规）→ `total === 24`（24 检查点全过）且 `rate === 1`
- NO_SOURCE（无来源行）→ 头部规范组 3 项全 0（得分 0/3）
- BROKEN_REF（失效指针）→ 引用完整组 0/1
- 极性缺失（造一个无极性动词的规则）→ 执行力度①得 0
- 冗余重复句（造含重复句的规则）→ 冗余组「无完全重复句」得 0
- 标题漏前提（内容有明确前提但标题没体现）→ 标题「反映关键前提」得 0
- 非禁令类规则（纯「必须」类）→ 执行力度组满分 5（省略④⑤⑥），`groups['执行力度'].max === 5`

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test skills/rule-inspector/scripts/score.test.mjs`
Expected: 新用例 FAIL（score.mjs 还是旧判据）。

- [ ] **Step 3: 实现检查点评分**

重写 `score.mjs` 的 `scoreFile`：按 24 检查点逐项判定（判定逻辑照 Spec A §2.4 各检查点的「判定」列，逐条机械实现）。关键骨架：

```js
// 返回结构
// { name, lines, chars, groups: { 头部规范:{score,max}, 层级规范:{}, 来源精简:{}, 引用完整:{}, 冗余度:{}, 执行力度:{}, 标题:{} }, total, max, rate, level, findings }

// 检查点判定示例（执行力度①极性明确，其余 23 项同理照 Spec A §2.4 判定列）：
const POLAR_RE = /禁止|不得|不要|必须|应|要/         // ①极性
const d = { 极性明确: POLAR_RE.test(text) ? 1 : 0, /* …其余 23 项… */ }

// 计分：total = Σ检查点得分；max = 适用检查点数（非禁令类执行力度组 max=5，省略④⑤⑥）；
// rate = total / max；level = rate >= 0.9 ? '健康' : rate >= 0.7 ? '预警' : '超标'
// findings：每个 0 分检查点 → { group, check, msg, recipe }
```

组内得分累加进 `groups`；保留确定性、BOM（`stripBom`）、CLI import 守卫。

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test skills/rule-inspector/scripts/score.test.mjs`
Expected: 全 pass（含旧用例适配——旧的 total=80/level 断言改为 rate/level 断言）。

- [ ] **Step 5: 不 commit（no-git-write）**

改动留在工作区。

---

### Task 4: score.test.mjs 覆盖全部新检查点

**Files:**
- Modify: `skills/rule-inspector/scripts/score.test.mjs`

**Interfaces:**
- Consumes: score.mjs（Task 3）。
- Produces: 覆盖 24 检查点的测试套件（每个 0 分路径至少一个用例）。

- [ ] **Step 1: 补齐测试用例**

每个检查点至少一个「不得分」用例 + GOOD 全过用例 + 非禁令类 max=5 用例 + 确定性 + BOM + 不越界（输出不含「判据」「建议删除」）。已有用例（Task 3）保留，补齐其余检查点。

- [ ] **Step 2: 跑全套测试**

Run: `node --test skills/rule-inspector/scripts/score.test.mjs`
Expected: 全 pass。

- [ ] **Step 3: 不 commit（no-git-write）**

改动留在工作区。

---

### Task 5: rule-writer 建好

**Files:**
- Create: `skills/rule-writer/SKILL.md`
- Create: `skills/rule-writer/references/writing-guide.md`
- Create: `skills/rule-writer/assets/rule-skeleton.md`

**Interfaces:**
- Consumes: `rule-inspector/references/criteria.md`（判据）；`rule-inspector` 评分流程（产出后调用）。
- Produces: 写新规则的完整技能（SKILL.md 触发+流程、writing-guide 四要素+8 项自查、rule-skeleton 产出骨架）。

- [ ] **Step 1: 写 SKILL.md**

`skills/rule-writer/SKILL.md`，frontmatter（name: rule-writer；description: 从需求写一条合规规则——按判据四要素 + 执行力度 8 项 + 来源行 + 分层级；触发「写一条规则」；不自动触发）+ 写作流程（Spec A §4.3 步骤 1-8）+ 硬闸门（不自动改判据措辞、删冗余须三检验）+ 引用判据（`rule-inspector/references/criteria.md`）。

- [ ] **Step 2: 写 writing-guide.md**

四要素写作指引（范围/条件/动作/宾语）+ 执行力度 8 项自查表 + 标题一致性收尾三句（Spec A §2.4 标题第 4 项）+ 例子（对照 `no-git-write` 的防掠过写法）。

- [ ] **Step 3: 写 rule-skeleton.md**

`assets/rule-skeleton.md` 照抄 Spec A §4.3 的产出骨架代码块（含「非禁令类省略④⑤⑥、满分按适用项」注）。

- [ ] **Step 4: 验证文件齐 + frontmatter 合法**

Run:
```powershell
Test-Path 'skills/rule-writer/SKILL.md','skills/rule-writer/references/writing-guide.md','skills/rule-writer/assets/rule-skeleton.md'
```
Expected: 三个 True。

- [ ] **Step 5: 不 commit（no-git-write）**

改动留在工作区。

---

### Task 6: skilldependencies 接入

**Files:**
- Modify: `skilldependencies/manifest.json`
- Modify: `skilldependencies/rule-inspector.json`（skill 名已在 Task 1 改；确认依赖 evolving-skills + managing-lessons-store）
- Create: `skilldependencies/rule-writer.json`

**Interfaces:**
- Consumes: `validate.test.mjs` 的 4 个断言（manifest 与文件/目录一一对应）。

- [ ] **Step 1: 建 rule-writer.json**

```json
{
  "schemaVersion": 1,
  "skill": "rule-writer",
  "dependencies": {
    "skills": [
      { "name": "rule-inspector" }
    ]
  }
}
```

- [ ] **Step 2: 更新 manifest.json**

`skills` 数组：移除 `"rule-optimizer"`，追加 `"rule-inspector"` + `"rule-writer"`（保持其他项）。

- [ ] **Step 3: 跑 validate**

Run: `node --test skilldependencies/validate.test.mjs`
Expected: 4/4 pass（skills 目录有 rule-inspector + rule-writer，json 对应，manifest 对应）。

- [ ] **Step 4: aas sync 重建运行时链接**

Run（在 `d:\Seed\my-rules`）: `aas sync`
Expected: rule-inspector 链接换指向、rule-writer 链接建立、rule-optimizer 旧链接清理。

- [ ] **Step 5: 不 commit（no-git-write）**

改动留在工作区。

---

### Task 7: 总验证（全量基线报告）

**Files:**
- 无新增。

- [ ] **Step 1: 跑全套测试**

Run: `node --test skilldependencies/validate.test.mjs skills/rule-inspector/scripts/score.test.mjs`
Expected: 全 pass。

- [ ] **Step 2: 跑全量基线报告**

Run: `node skills/rule-inspector/scripts/score.mjs --dir D:\Seed\my-rules\rules --json`
Expected: 输出含每规则 `total/max/rate/level`；`no-git-write` 执行力度 8 项全过（max=8、得分 8）；`global-ask-before-acting` 按现状评分（重写是 Spec B 的事，此处记录基线）。**把基线报告（得分/满分/级别）逐条记下**——这是新基线，写进 `docs/superpowers/handoffs/` 的交付说明（进 git），不写 `.session/`（成果不进 .session/，docs-convention）。

- [ ] **Step 3: 确认无越界输出**

Run: `node skills/rule-inspector/scripts/score.mjs --dir D:\Seed\my-rules\rules --json | Select-String -Pattern '判据|建议删除'`
Expected: 无输出。

- [ ] **Step 4: 不 commit（no-git-write）**

改动留在工作区。

---

## Self-Review 记录

**Spec coverage**：§2.4 判据（24 检查点）→ Task 2/3/4；§3 报告模板 → Task 2；§4.2 inspector 更名+评分 → Task 1/3；§4.3 writer → Task 5；§4.5 skilldependencies → Task 6；§4.7 验收 → Task 7（全量基线 + no-git-write 8 项全过）。✓

**无占位符**：所有判定逻辑引用 Spec A §2.4 具体检查点；score 实现步骤给出接口签名与用例清单。

**类型一致性**：`scoreFile` 输出 `groups/total/max/rate/level` 在 Task 3 定义、Task 4 测试、Task 7 验证一致；`rate` 阈值 0.9/0.7 与 Spec A §2.4 一致。
