# evolving-skills 实施计划（C2 + A1 + 转发闸门）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新建第 6 个技能 `evolving-skills`（载体进化施工手册：协议 + 三张差异卡），并把 `retro-institutionalize` 瘦身为纯分诊台 + 转发闸门。

**Architecture:** institutionalize 只留前置检查 / 决策树 / ledger 先行 / 冲突判定 / 新增落点（provenance 等）/ 结束动作；**修订既有载体（rule/skill/自动化）一律转发** evolving-skills 按对应卡实施；新增 rule/memory/自动化仍在 institutionalize 就地落（provenance 单一真相）；新增 skill 转发（card-skill 覆盖新建）；memory 修订就地（不设卡）。

**Tech Stack:** 纯 Markdown 技能（frontmatter + 正文）；同步经 `aas`（junction 活链）；测试 = RED-GREEN 失败场景 + `aas` 体检。

**Spec:** `docs/superpowers/specs/2026-09-28-evolving-skills-design.md`（§2 五裁决 / §3 分工 / §4 evolving-skills 规格 / §5 institutionalize 瘦身规格 / §6 验收）

## Global Constraints

- 改动只落 `D:\Seed\retro-skills` 仓库（skills\ 下）与 KB（`D:\Seed\lessons`）；**不碰 multi-lens 本体、不碰 `~\.trae-cn\`（运行时只读）、不碰 local-pack-manager**
- **commit 一律由用户执行**（本计划所有 commit 步骤都是用户动作，agent 只提示）
- 技能改动必须 RED-GREEN：先有失败场景（RED 证据落 KB ledger 教训行，不落项目仓库）
- evolving-skills 的 SKILL.md < 150 行；skill 体积守卫 < 500 行
- 教训内容进 KB（`projects\<触发项目>\ledger.md`），不进项目仓库、不进技能目录
- `aas` 侧测试 69/69 不回归（每个任务收尾跑一次）
- 完成后执行落地扫（architecture.md / retro-skills 与 my-rules 的 README / 源码注释）

---

### Task 1: RED 留账——KB ledger 教训行

**Files:**
- Create: `D:\Seed\lessons\projects\retro-skills\ledger.md`

**Interfaces:**
- Produces: 教训 ID `L-RS-1`（状态 open，载体=skill）——Task 7 的 GREEN 与销账都引用它

- [ ] **Step 1: 确认 KB 项目目录**

Run: `Test-Path D:\Seed\lessons\projects\retro-skills`
Expected: False（首个）→ 需创建

- [ ] **Step 2: 写 ledger（RED 证据）**

创建 `D:\Seed\lessons\projects\retro-skills\ledger.md`，内容（表头与 lpm ledger 同构）：

```markdown
# retro-skills 进化账本

| ID | 日期 | 项目 | 来源 | 问题 | 根因 | 维度 | 修复 | 载体 | 状态 |
|---|---|---|---|---|---|---|---|---|---|
| L-RS-1 | 2026-09-28 | retro-skills | 复盘 | institutionalize 决策树的修订分支（Step 1a/1b）与落 skill（Step 3）没有任何转发指令，agent 会就地按旧手法改载体——无攒批、无体积守卫、无独立合并，且修订手法即将搬空 | 流程缺失（修订与新增的归属未分开定义） | 健壮度 | 建 evolving-skills（协议+三卡）+ institutionalize 瘦身加闸门 | skill | open |
```

- [ ] **Step 3: 验证 RED 可读**

Run: `Select-String -Path D:\Seed\lessons\projects\retro-skills\ledger.md -Pattern 'L-RS-1'`
Expected: 命中 1 行（教训已入账，状态 open）

---

### Task 2: evolving-skills 骨架 + SKILL.md

**Files:**
- Create: `retro-skills\skills\evolving-skills\SKILL.md`

**Interfaces:**
- Consumes: Task 1 的 `L-RS-1`（open）
- Produces: `evolving-skills` 技能（junction 待 Task 8 建立后可被加载）；references\ 指针（Task 3–6 落地）

- [ ] **Step 1: 写 SKILL.md（完整内容如下）**

```markdown
---
name: evolving-skills
description: Use when 复盘结论指向"改某个载体本身"（修订既有 rule / skill / 自动化，或新建技能），或由 retro-institutionalize 决策树转发过来；按差异卡安全地实施载体进化（失败场景先行→攒批→独立合并→体积守卫→验证）。Do not use for 首次归置新增 rule / memory / 自动化（那走 institutionalize 决策树就地落）。
---

# evolving-skills（载体进化施工手册）

## 它是什么 / 不是什么

- **是**：当教训的"修复方案"是**改载体本体**（改 rule 的表述、改 skill 的流程、给自动化加断言）时的标准施工手册——六步协议 + 三张差异卡。
- **不是**：教训仓库（教训住 KB，本目录不放任何教训内容）；也不是归置决策者（定载体是 institutionalize 的事，首次新增 rule/memory/自动化走它就地落）。

## 入口：三步

1. **识别载体**：这次改的是 rule / skill / 自动化？→ 读对应卡 `references/card-rule.md` / `card-skill.md` / `card-automation.md`，卡里有改前/改中/改后全流程
2. **对账**：教训应在 KB ledger 里（转发场景 institutionalize 已写入 `open`）。**直达触发而账里无记录 → 先建账再动手**（ledger 先行是通则）
3. **走协议**：六步速览见下表；逐步细则读 `references/protocol.md`

## 六步速览

| 步 | 一句话 |
|---|---|
| 0 失败场景先行 | 先写下"现状拦不住的具体场景"，再动手（skill=失败场景描述、rule=一行反例、自动化=失败断言） |
| 1 先升级不新增 | 改既有载体，新增须举证 |
| 2 四归因 | 流程缺失 / 知识缺失 / 修复引入 / 假设未显式化——归因决定改哪 |
| 3 攒批 | 教训先进账；同类一起改；动手时机用户定 |
| 4 独立 agent 合并 | 动手术用无偏见子代理；中断 = git 回退重跑 |
| 5 体积守卫 | skill <500 行；rule 可证伪；自动化不拖慢执行点 |
| 6 验证 + 销账 | 按卡验证；通过后 ledger 置 landed(→载体) |

## 从 institutionalize 转发过来的

转发时携带：教训 ID + 载体 + 归置结果行。教训已在 KB ledger（open）→ 直接从步 0 开始；按载体读卡实施。

## 结束动作

卡内验证全过 → ledger 置 `landed(→载体)` → 提示用户"技能/规则改动建议开新对话生效"。
```

- [ ] **Step 2: 验证体积与 frontmatter**

Run: `(Get-Content retro-skills\skills\evolving-skills\SKILL.md).Count`（应 < 150）；确认 frontmatter 含 name/description

---

### Task 3: references/protocol.md（施工手册正文）

**Files:**
- Create: `retro-skills\skills\evolving-skills\references\protocol.md`

**Interfaces:**
- Consumes: 无（自包含；素材出处标注 multi-lens / institutionalize）
- Produces: 六步细则（SKILL.md 速览表引用"步 N"）

- [ ] **Step 1: 写 protocol.md（完整内容如下）**

````markdown
# 载体进化协议（六步详解）

> 素材出处：multi-lens-review 的 11 条实战教训（lessons.md）+ retro-institutionalize 的既有做法。
> 六步对所有载体通用；载体差异见三张卡（card-rule / card-skill / card-automation）。

## 步 0：失败场景先行（总则）

**动手前，先写下"现状拦不住的具体场景"**，落 KB ledger 教训行。写法按载体：

- skill → 一段可检验的场景描述（改完后按它走一遍验证）
- rule → 一行反例（旧表述拦不住的具体违反形态）
- 自动化 → 一个会失败的断言

为什么：防止"改宽一点""补一下"式含糊修改。规则自身要求可证伪，改规则却没有可证伪的依据，是同一类病。

## 步 1：先升级不新增

查五处既有承载（user_rules / 项目 .trae\rules / memory / KB / 既有 skills），有相似的 → 改它。
升级是默认动作，新增是必须举证的例外。（继承 institutionalize 决策树 Step 1）

## 步 2：四归因

每条教训回答"当初为什么没想到"，四选一：

| 归因 | 改哪 |
|---|---|
| 流程缺失 | 把缺的检查路径固化进载体流程 |
| 知识缺失 | 固化为必问条目 / 清单 / 反例集 |
| 修复引入 | 修复纪律补检查点（修复 diff 自审交叉点） |
| 假设未显式化 | 把隐含假设显式写出来（前置条件/边界） |

归因决定改哪里——答不出归因，说明还没理解教训。

## 步 3：攒批

- 教训**先进 KB ledger**（状态 open）——账先行，动手在后
- 同类教训（同载体、同归因）攒一起改；动手时机由用户裁决（现在 / 阶段收口）
- **本期落点**：`projects\<触发项目>\ledger.md`；KB 的 skills\ 区建成后迁入

## 步 4：独立 agent 合并

动手术用 Task 起无偏见子代理：输入 = 教训清单 + 目标文件路径；输出 = 变更摘要（改了什么、为什么）供确认。
**中断恢复 = git 回退**（retro-skills 已提交，可退回合并前状态）后重跑。不在当前会话顺手改——自改自验没有防线。

## 步 5：体积守卫

- skill：SKILL.md **< 500 行**（multi-lens 实战线）；超了 → 拆 references
- rule：不设行数，但必须可证伪（能想象违反的具体形态）
- 自动化：不拖慢执行点（性能闸门见 card-automation.md）

## 步 6：验证 + 销账

按对应卡的验证节走完 → ledger 状态置 `landed(→载体)` → 提示开新对话生效。
验证不过 → 回对应步重做；教训保持 open。

## 附：本协议的出处

multi-lens-review 的 lessons.md（11 条，含"已合并"标记）是其私有形态；本协议是其通用化。
multi-lens 本体的改造等它被收编进源仓库后进行（架构 §10 H1 / 第 3 步 A2）。
````

- [ ] **Step 2: 验证**

Run: 确认文件存在、六步齐全（grep '步 0' 与 '步 6' 各命中）

---

### Task 4: references/card-rule.md

**Files:**
- Create: `retro-skills\skills\evolving-skills\references\card-rule.md`

- [ ] **Step 1: 写 card-rule.md（完整内容如下）**

````markdown
# 差异卡：修订 rule（全局 / 项目）

> 全局规则与项目规则通用本卡；两者差异已标注。protocol.md 的六步为前置流程。

## 改前

- **失败场景先行（轻量版）**：一行反例——"旧表述拦不住的具体违反形态"，写进 ledger 教训行
- 查五处防重复（institutionalize 决策树 Step 1 已做，此处复核）
- **备份旧版**：复制到 `<KB>\projects\<项目标识>\rules-history\<规则名>-<YYYYMMDD-HHmmss>.md`
  - **备份失败 → 中止修订**（不得无备份覆盖）

## 改中

- 展示"旧 → 新"各一行摘要，等用户 y/n（**仅修订触发**；新增规则不走本卡）
- provenance 按 institutionalize 的格式定义：`> 来源：<KB 条目 ID>｜证据：<原始证据>｜落地：<日期>`
  - 来源只能用 KB 条目 ID（文件路径会在 KB 迁移后失效）
- 全局规则：**纯 markdown，无 frontmatter**（写了 alwaysApply/globs 无效）
- 项目规则：可用 `alwaysApply` / `globs` / `description`

## 改后生效

- **开新对话生效**（全局规则每次对话全量注入）；收尾必须提醒用户

## 验证

- 反例场景：旧表述拦不住的形态，新表述能拦住（对照 ledger 教训行逐条核）
- `aas` 体检：该规则"已就位"、链接完好

## 常见错误

| 错误 | 纠正 |
|---|---|
| 覆盖旧规则不备份 | 备份失败即中止修订 |
| 全局规则写 frontmatter | 无效且污染 |
| provenance 缺失或用文件路径 | 只用 KB 条目 ID |
| 改成不可证伪的表述 | 回步 0 重写反例 |
````

- [ ] **Step 2: 验证**（文件存在、五节齐全）

---

### Task 5: references/card-skill.md

**Files:**
- Create: `retro-skills\skills\evolving-skills\references\card-skill.md`

- [ ] **Step 1: 写 card-skill.md（完整内容如下）**

````markdown
# 差异卡：修订 / 新建 skill

> RED-GREEN 细则遵循 writing-skills；本卡是它在"进化既有技能"场景下的执行要点。

## 改前

- **失败场景（RED）**：写成可检验的场景描述——"按现在的技能走这个场景，会得到错误结果 X"，落 ledger 教训行
- 查五处防重复；确认目标技能有源仓库（裸奔技能先收编，见架构 §10 H1）

## 改中

- 改 `SKILL.md` / `references\`；**同类教训一起合并**（攒批；合并由独立 agent 执行，见 protocol 步 4）
- **体积守卫**：SKILL.md < 500 行；超了 → 把可按需加载的内容拆进 references\
- **发布纯净**：技能目录内不放 lessons / 过程记录 / 项目内部细节（教训进 KB）

## 改后生效

- junction 活链：**源改即生效**，不需要跑 aas sync（链接已存在）
- 生效时机未单独验证（V6）：改完请用户新对话观察并反馈
- **新建技能**（首次）才需要 `aas sync` 建 junction

## 验证

- RED 转 GREEN：按失败场景重走，得到正确结果
- 体积 < 500 行；`aas` 体检 junction 就位

## 常见错误

| 错误 | 纠正 |
|---|---|
| 直接改运行时副本 `~\.trae-cn\skills\` | 只改源仓库；运行时是 junction |
| SKILL.md 超限不拆 | 拆 references，按需加载 |
| 当前会话自改自验 | 独立 agent 合并 + 场景验证 |
| 技能目录里塞教训 | 教训进 KB；目录保持纯净 |
````

- [ ] **Step 2: 验证**（文件存在、五节齐全）

---

### Task 6: references/card-automation.md

**Files:**
- Create: `retro-skills\skills\evolving-skills\references\card-automation.md`

- [ ] **Step 1: 写 card-automation.md（完整内容如下）**

````markdown
# 差异卡：修订 / 新增自动化（tests / lint / 校验脚本）

## 改前

- **失败断言（RED）**：先写一个会失败的断言（现状跑它必红）
- **性能闸门（继承 institutionalize Step 2）**：回答两个问题——**跑在哪个执行点？单次成本多少？** 答不出 → 不许加（自动化优先 ≠ 自动化无预算）

## 改中

- 写进 tests / lint / 校验脚本——**不写成文档**（能机械判定的不落人读规范）
- 与既有断言去重（同一执行点同类的检查只留一份）

## 改后生效

- 执行点强制（测试随 CI/运行触发；lint 随编辑触发）

## 验证

- 断言转绿；在执行点实际跑一遍确认接入

## 常见错误

| 错误 | 纠正 |
|---|---|
| 没有执行点的"自动化" | 答不出执行点就不做（降级为 rule） |
| 拖慢主流程 | 性能闸门复核执行点与成本 |
````

- [ ] **Step 2: 验证**（文件存在）

---

### Task 7: institutionalize 瘦身 + 转发闸门

**Files:**
- Modify: `retro-skills\skills\retro-institutionalize\SKILL.md`

**Interfaces:**
- Consumes: Task 2–6 的 evolving-skills（转发目标必须已存在）
- Produces: 分诊台形态的 institutionalize

- [ ] **Step 1: 确认 RED（失败场景已在 Task 1 入账）**

Run: `Select-String -Path D:\Seed\retro-skills\skills\retro-institutionalize\SKILL.md -Pattern 'evolving-skills'`
Expected: **无命中**（RED 成立——修订分支无转发指令）

- [ ] **Step 2: 决策树 Step 1 加转发（a/b 分支）**

把决策树 Step 1 的三行分支改为：

```
        ┌ 有 → 【升级，不新增】为什么既有没拦住？
        │        a. 触发面未覆盖（新场景） → 扩既有触发面（globs/description/作用域）
        │           ⇒ 既有是 rule / skill / 自动化 → REQUIRED SUB-SKILL: evolving-skills（读对应卡；memory 就地改）
        │        b. 既有约束本身有问题     → 修既有（太宽/太窄/判据错）
        │           ⇒ 同上转发（memory 就地改）
        │        c. 载体选错了             → 换载体（goto Step 2）
        └ 无 ↓
```

- [ ] **Step 3: 决策树 Step 3 加转发**

把 `是 → 【skill】` 行改为：

```
Step 3  是多步过程 / 技法吗？（有步骤、判断点、反例集）
        是 → 【skill】⇒ REQUIRED SUB-SKILL: evolving-skills（新建/重写按 card-skill.md；教训先入 ledger）
        否 ↓
```

- [ ] **Step 4: Step 2 性能闸门附注改为指针**

把

```
**Step 2 的性能闸门**：新增自动化前必须回答「跑在哪个执行点？单次成本多少？」——答不出则不许加。自动化优先 ≠ 自动化无预算。
```

改为

```
**Step 2 的性能闸门**：新增自动化前必须回答「跑在哪个执行点？单次成本多少？」——答不出则不许加。实施细则见 evolving-skills `card-automation.md`。
```

- [ ] **Step 5: 「修订既有规则」节替换为指针**

把「## 修订既有规则：先备份，再一行式确认」整节（3 条列表）替换为：

```
## 修订既有 rule：走 evolving-skills

修订的实施（失败场景先行 / 备份到 rules-history / 一行式确认）按 `evolving-skills` 的 `card-rule.md` 执行；本技能只负责分诊与 ledger 先行。
```

- [ ] **Step 6: 结束动作加只读校验**

「结束时的固定动作」改为：

```
落置完成后：① 在复盘文件的「归置结果」表补落点；② **转发项：确认 evolving-skills 已把 ledger 置 landed(→载体)**；③ 提示用户「**Trae 规则/技能改动建议开新对话才完全生效**」；④ 输出一行「本环节完成——教训已落回规范」。
```

- [ ] **Step 7: 验证 GREEN + 瘦身效果**

Run: `Select-String -Path retro-skills\skills\retro-institutionalize\SKILL.md -Pattern 'evolving-skills'`（应 ≥ 4 命中：Step1a/1b/3/修订节）
Run: `Select-String -Path retro-skills\skills\retro-institutionalize\SKILL.md -Pattern '备份失败 → 中止修订'`（应**无命中**——手法已搬去 card-rule，且有指针）

---

### Task 8: 同步 + 验收 + 落地扫

**Files:**
- Modify: `retro-skills\docs\architecture.md`（§3 L3 / §6 C2 / §8 第 2 步）
- retro-suite spec：核实 R28 相关行均已终态、无残留悬空（实测已结清，无需编辑）

- [ ] **Step 1: 建 evolving-skills 的 junction**

Run（agent-assets-sync 下）: `aas sync`
Expected: 技能区"需建链接 1"→ 建 junction；报告"全部一致"；**6 个技能全部就位**

- [ ] **Step 2: 验收清单（spec §6）**

- [ ] `aas` 体检 6 junction 全就位【自动】
- [ ] institutionalize 含 evolving-skills 转发 ≥ 4 处【自动】
- [ ] card-rule 含备份/确认；card-skill 含 RED-GREEN/体积；card-automation 含性能闸门【自动 grep】
- [ ] `aas` 侧 69/69 不回归【自动】
- [ ] KB ledger L-RS-1 置 `landed(→skill)`【自动】
- [ ] 【人工·用户】新对话触发验证 + V6 观察

- [ ] **Step 3: 落地扫**

- architecture.md：§3 L3「evolving-skills：【缺】待建」→ ✅；§6 C2 → ✅（指向 spec/plan）；§8 第 2 步 → ✅
- retro-suite spec：核实 R28 相关行均已终态、无残留悬空（实测已结清，无需编辑）
- 源码/技能注释：`retro-institutionalize` 头部如提及自身职责范围，对齐分诊台定位
- retro-skills\README.md 与 my-rules\README.md：技能计数与命令指路对齐现状

- [ ] **Step 4: 提示用户 commit（三个仓库各自提交，由用户执行）**

---

## Self-Review 记录

- Spec 覆盖：§4.1→Task 2–6；§4.2→Task 2；§4.3→Task 3；§4.4→Task 4–6；§5→Task 7；§6→Task 8；§8 落地扫→Task 8 ✓
- 占位符：无（所有产物全文内嵌）✓
- 类型/命名一致性：L-RS-1、evolving-skills、card-*.md 全文一致 ✓
