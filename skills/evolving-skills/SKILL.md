---
name: evolving-skills
description: Use when 要"改某个载体本身"（修订既有 rule / skill / 自动化，或新建技能）——由**用户在 lessons 发起落地分析派工**，或经 retro-institutionalize 决策树转发；用户说「改一下这条规则」「把这个技能改改」「更新 skill」「这条规则要修订」也算；按差异卡安全地实施载体进化（失败场景先行→攒批→独立合并→体积守卫→验证）。Do not use for 首次归置新增 rule / memory / 自动化（那走 institutionalize 决策树就地落）。
---

# evolving-skills（载体进化施工手册）

## 它是什么 / 不是什么

- **是**：当教训的"修复方案"是**改载体本体**（改 rule 的表述、改 skill 的流程、给自动化加断言）时的标准施工手册——六步协议 + 三张差异卡。
- **不是**：教训仓库（教训住 KB，本目录不放任何教训内容）；也不是归置决策者（定载体是 institutionalize 的事，首次新增 rule/memory/自动化走它就地落）。

## 触发：由 lessons 落地分析派工

本技能**不由复盘 session 自动衔接**。启动方式是：**用户在 lessons 发起一次落地分析**（一次一个技能 / 一类问题）→ 读账本 + 历史复盘 + moments（锚点） + 用户画像出方案 → 用户判断合理 → 才到本技能施工。

技能复盘的「发现即记」由 `references/review-flywheel.md` 负责（**只记账、不追问**）；**「改」永远归用户发起**。

## 技能账本（分层 + 体积守卫）

技能教训落 `<KB>/skills/<技能名>/ledger.md`——**不写进技能目录**（目录保持发布纯净）。
账本遵守分层：`open` 留主账、`landed` 过量后归档到 `ledger-archive-<年>.md`；主账超阈值（>100 行 或 open>20）时**提醒用户「尽早复盘收口」**——否则每次读它都白烧 token。

## 入口：三步

1. **识别载体**：这次改的是 rule / skill / 自动化？→ 读对应卡 `references/card-rule.md` / `references/card-skill.md` / `references/card-automation.md`，卡里有改前/改中/改后全流程（差异卡是「agent 读的指引文档」，按官方语义属 references；`assets/` 放输出用模板）
2. **对账**：教训应在 KB ledger 里（转发场景 institutionalize 已写入 `open`）。**直达触发而账里无记录 → 先建账再动手**（ledger 先行是通则）
3. **走协议**：六步速览见下表；逐步细则读 `references/protocol.md`；**Trae 差异 / 仓库落地约定见 `references/trae-adapter.md`**

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
