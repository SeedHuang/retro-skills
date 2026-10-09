# global-ask-before-acting 重写实现计划（模式开关语义）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 Spec B（`docs/superpowers/specs/2026-10-09-global-ask-rewrite-design.md`）重写 `my-rules/rules/global-ask-before-acting.md`——表达「模式开关」语义（沟通模式适用/执行模式退出/再对话重新适用），补回沟通三步操作，标题带「沟通中」前提。

**Architecture:** 直接改 `my-rules` 仓库的规则正文（走 `rules-single-source`：只建源仓库）+ `aas sync` 同步运行时 + 用 rule-inspector（Spec A 产物）验证报告。

**Tech Stack:** Markdown（规则正文）、PowerShell（aas sync）。

**Spec:** `docs/superpowers/specs/2026-10-09-global-ask-rewrite-design.md`（实现者需同读）｜**依赖**：rule-inspector 已建（Spec A 的 plan 完成后）——重写后用 inspector 出报告验证。

## Global Constraints

- **不 commit（no-git-write）**：任务收尾 = 改动留在工作区。**禁止 git add / git commit / git push。**
- **只改 `my-rules/rules/global-ask-before-acting.md`**（规则正文）+ `aas sync`（运行时）——不碰其他规则文件。
- **来源行格式**：`> 来源：用户当场指令（2026-10-02）｜落地：2026-10-09`（B4：类型+日期，不写历史叙述）。
- **标题**：`# 沟通中未获允许，不得开始执行写代码`（含前提「沟通中」+ 极性「不得」+ 动作「开始执行」+ 对象「写代码」）。

---

### Task 1: 重写规则正文

**Files:**
- Modify: `D:\Seed\my-rules\rules\global-ask-before-acting.md`

**Interfaces:**
- Produces: 重写后的规则正文（Spec B §3 逐字）。

- [ ] **Step 1: 重写文件**

`D:\Seed\my-rules\rules\global-ask-before-acting.md` 整体替换为 Spec B §3 的内容（逐字）：

```markdown
# 沟通中未获允许，不得开始执行写代码

> 来源：用户当场指令（2026-10-02）｜落地：2026-10-09

## 模式开关（本规则的核心判据）

本规则只适用于「用户主动发起对话」的时刻，开/关由「这条消息是不是用户主动发起的对话」控制：

- **用户主动发消息**（提问 / 讨论 / 给意见 / 等决策）= 沟通模式 → 本规则适用：我只回应沟通，**不擅自开始执行写代码**。
- **用户明确给执行指令**（「开始吧 / 按这个来 / 继续执行」）= 执行模式 → 本规则退出：执行阶段开始，写动作不再逐个授权，按具体领域规则管（如 `no-git-write` 管 git）。
- **执行中用户再次发消息** = 回到沟通模式 → 本规则重新适用：**停下执行，先回应**；除非用户说「继续」，否则不推进写代码。

## 沟通流程（沟通模式下的操作步骤）

沟通时按三步走：

1. **有想法 → 用大白话讲清楚 + 给出我的倾向**（先结论后理由，不堆行话）
2. **等用户的结论或授权**——没得出结论、没拿到授权之前，禁止开始执行
3. **拿到授权才动手**

## 主动给新角度

沟通时，我的价值在于**给出用户没想到角度的意见**——不是闷头开写，也不是干等指令。用户问「有没有更简单的实现」时，先说结论和建议，不擅自下载运行。

## 什么不算授权

- 用户「选择了某个执行方式」（如 SSD / 子代理执行一个计划）**不算**授权了计划里所有写动作的豁免——执行模式的写动作仍按具体领域规则（如 `no-git-write`）管。
- 「我自己觉得没问题」不算授权——那是我的判断，不是用户的点头。

## 唯一豁免

只读探查不用问：读文件、搜代码、查系统信息、跑 `--version`、看目录列表。
```

- [ ] **Step 2: 落盘核对**

Read `D:\Seed\my-rules\rules\global-ask-before-acting.md`，确认与 Spec B §3 逐字一致（标题、来源行、五个小节）。

- [ ] **Step 3: 不 commit（no-git-write）**

改动留在工作区。

---

### Task 2: aas sync + rule-inspector 验证

**Files:**
- 无（运行命令）。

**Interfaces:**
- Consumes: rule-inspector（Spec A 产物）——出报告验证重写后规则。

- [ ] **Step 1: aas sync 同步运行时**

Run（在 `d:\Seed\my-rules`）: `aas sync`
Expected: `rule-global-ask-before-acting.md` 已就位（运行时 `~\.trae-cn\user_rules\` 里为新版）。

- [ ] **Step 2: 跑 rule-inspector 报告**

Run（在 `d:\Seed\retro-skills`）: `node skills/rule-inspector/scripts/score.mjs --dir D:\Seed\my-rules\rules --json | Select-String -Pattern 'global-ask-before-acting' -Context 0,20`
Expected: `global-ask-before-acting` 的标题检查点（判据式/含极性动作对象/反映关键前提/内容一致性）全过；极性（执行力度①）过；执行力度 8 项里适用的项过。

- [ ] **Step 3: 确认标题不丢前提**

核对报告：标题检查点「反映关键前提」= 1（标题「沟通中未获允许…」带「沟通中」前提，与正文模式开关范围一致）。

- [ ] **Step 4: 不 commit（no-git-write）**

改动留在工作区。

---

## Self-Review 记录

**Spec coverage**：Spec B §2 新标题 → Task 1 Step 1；§3 新正文 → Task 1；§4 配套（删原「不得推进到下一步」小节——已并入模式开关段；aas sync）→ Task 1/2；§5 验收 1-4 → Task 1 Step 2 + Task 2 Step 2/3。✓

**无占位符**：正文在 Task 1 Step 1 逐字给出；验证命令给出。

**类型一致性**：标题/来源行/小节结构与 Spec B §3 一致；rule-inspector 检查点名与 Spec A §2.4 一致（「反映关键前提」「极性明确」）。
