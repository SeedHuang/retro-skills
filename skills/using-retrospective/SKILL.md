---
name: using-retrospective
description: Use when 阶段/里程碑收口、session 即将结束、用户说「复盘/回顾/总结一下这个过程」「这段是不是可以沉淀一下」、或要判断一条教训该进全局还是项目规则时。Do not use for 代码审查（走 open-code-review）、bug 定位（走 systematic-debugging）、或仅要一份过程时间线（那是 retro-collect 单独可做）。
---

# 复盘套件入口（using-retrospective）

## 这个套件是什么

四个环节，一环扣一环，**每个环节也可单独调用**：

| 环节 | 技能 | 何时进 |
|---|---|---|
| ① 采集事实 | `retro-collect` | 还没有事实包 |
| ② 分析 | `retro-analyze` | 已有事实包，要出问题/根因/优先级 |
| ③ 归置落地 | `retro-institutionalize` | 已有复盘，要把教训写回规范 |
| ④ 库维护 | `managing-lessons-store` | 库未建 / 要迁移 / 要轮询推迟项 |

**路由规则**：先看手上已有什么产物——无产物从 ①；有事实包从 ②；有复盘从 ③。**不得跳环**（没有事实包就做分析 = 凭印象，禁止）。

## 产物关系图

```
多源输入（OCR 原文 / multi-lens 结论 / session 总结 / 用户的复盘请求）
      │
      ▼
  事实包  <日期>-facts.md        ← 本次过程的证据集（纯事实、零判断），由 retro-collect 产出
      │
      ▼
  复盘    <日期>-retro.md        ← 本次过程的分析（只引条号 + 加判断），由 retro-analyze 产出；做薄
      │
      ├────────► KB 条目         ← 跨 session 累积索引（一行一条，稳定 ID）
      │                            由 retro-analyze 写入，retro-institutionalize 更新状态
      └────────► 落地载体        ← 生效物（自动化 / rule / skill / memory），由 retro-institutionalize 产出

引用方向：复盘引事实包的条号；KB 条目与落地载体引复盘的产物；规则 provenance 引 KB 条目 ID
反方向不存在——永不把下游内容回抄到上游（防第二份真相）
```

## 推迟项三要素（缺任一 → 不是「推迟」，是「丢弃」）

① 编号（可引用）② 动机锚（挂在 KB 的一条 `open` 条目上）③ **可观测复活信号**（可 grep，不是日期）

不用日期：日期到点会诱使「为做而做」；信号到点才是真需求。**动机锚为空（如「—」）的候选不合格，登记时补齐或直接丢弃。**

## 前置未满足时：拒绝并给下一步

| 场景 | 行为 |
|---|---|
| 要分析但无事实包 | 拒绝；建议先跑 `retro-collect` |
| 要归置但无复盘文件 | 拒绝；建议先跑 `retro-analyze` |
| KB 未初始化 | 拒绝；转 `managing-lessons-store` 引导 bootstrap |
| `resolve` 校验失败 | 拒绝；按提示引导重建/迁移 |

**为什么拒绝而非降级**：降级会产出「看起来对但依据缺失」的产物，污染 KB——污染比中断贵得多。

## 里程碑收口时主动建议

当一次交付被提交、或一个 spec 阶段收口时，**建议**（不强制）用户复盘：「刚交付 X，要不要复盘一下？」——只建议，用户说不做就停。

## 会话开始时的固定动作

先跑 `managing-lessons-store` 的推迟项轮询（`deferred`）。有命中则先向用户提出：命中项编号 + 信号证据，并说明是否升格为独立 spec。
