# <名称> — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** <一句话,讲清这个 plan 回答什么问题/打通什么链路>

**Architecture:** <架构边界。关键性质写清,如"X 目录可脱离一切外部依赖单测">

**Tech Stack:** <具体版本号,如 Node 22.12 / TypeScript 5.9 / vitest 3>

**Spec:** `docs/superpowers/specs/<spec 文件>`

## Global Constraints

- <版本红线,具体到警告,如"不要用 typescript 7,兼容性未验证">
- <架构红线,如"X 目录下的代码不许 import 任何 db/ 的东西">
- <依赖方向禁令、注入要求>
- 代码注释与 commit message 用 <语言>

## 已实测确认的前提(<日期>)

<!-- 没有实测前提就删掉本节,不许放猜测值 -->

| 项 | 值 |
|---|---|
| <已验证的黄金值/行为> | <值> |

## File Structure

<本次范围:只碰哪些目录,不建哪些(说明推迟原因)>

| 文件 | 职责 |
|---|---|
| `path` | <职责,标注"纯函数,无 IO"等性质> |

依赖方向:`a → b → c`。没有任何反向依赖。

---

### Task 1: <标题>

**Files:**
- Create: `path`
- Test: `path.test.ts`

**Interfaces:**
- Consumes: <…>
- Produces: <函数/接口签名级>

- [ ] **Step 1: 写失败的测试**

<完整可运行的测试代码,禁省略号>

- [ ] **Step 2: 跑测试确认失败**

Run: `<命令>`
Expected: FAIL —— <预期报错>

- [ ] **Step 3: 写实现**

<完整可运行的实现代码;设计取舍写在注释里>

- [ ] **Step 4: 跑测试确认通过**

Run: `<命令>`
Expected: PASS,N 个用例全绿

- [ ] **Step 5: Commit**

```bash
git add <文件列表>
git commit -m "<中文 message>"
```

---

## Self-Review

**1. Spec 覆盖**

| Spec 要求 | 对应任务 |
|---|---|
| <spec 节号/约束编号> | Task N |

**未覆盖且刻意如此**:<哪条没覆盖、为什么、归到哪个里程碑>

**2. 占位符扫描**:无 TBD / TODO / "稍后补充"。所有代码块完整可运行。

**3. 类型一致性**:<跨 Task 的接口名/签名逐一核对结论>

---

## 后续里程碑(各自独立成计划)

<!-- 不展开到步骤级——实测结果会改变细节,现在写就是猜 -->

| 里程碑 | 内容 | 主要文件 |
|---|---|---|
| <下一个> | <一段话> | <目录> |

## 执行交接

计划已保存到 `docs/superpowers/plans/<文件名>`。两种执行方式:

**1. Subagent 驱动(推荐)** —— 每个任务派一个全新 subagent,任务间 review

**2. 本会话内联执行** —— 用 executing-plans 带检查点批量执行

选哪种?
