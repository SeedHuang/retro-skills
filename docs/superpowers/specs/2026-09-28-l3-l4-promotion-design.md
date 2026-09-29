# L3-1 + L4-1 升格设计：KB 洞察统计与跨项目分析

> 上游：KB `index.md`「候选与推迟」L3-1/L4-1（原始意图：`2026-09-27-retro-suite-design.md` §11.1）
> 触发：2026-09-28 M1 修复（L-014）后推迟项轮询恢复真实计数，两条复活信号**双双命中**（实测：23 条 / 3 维度 / 2 项目）
> 用户裁决（2026-09-28）：两条均升格执行；L3-1 v1 只做当前分布快照（趋势后置）；L4-1 触发 = 手动 + 收口建议，报告落 KB `universal\` 区

## 1. 范围

**做**：L3-1 `lessons stats` 命令；L4-1 跨项目分析流程（路由 + reference + 收口建议）。

**不做**：时间趋势（无历史快照数据，YAGNI）、图表/导出、常驻规则自动触发（与 C6 候选方向相悖）、新建技能。

## 2. L3-1：`lessons stats`（维度分布快照）

- **CLI**：`node lessons.mjs stats`（managing-lessons-store），stdout 人读文本
- **输出**：总条目（open/landed 分计）｜三区条目数（项目 N / 技能 N / 通用 N）｜维度分布表（每维度 total/open/landed）｜薄弱维度提示（total 最少的维度，并列全列）。数字全部来自三区账本实时扫描，示意格式：
  ```
  KB 统计（D:\Seed\lessons）
  条目 23（open 14 / landed 9）｜项目 2 ｜技能 3 ｜通用 0
  维度分布：
    健壮度    13（open 7 / landed 6）
    用户体验   6（open 4 / landed 2）
    性能      4（open 3 / landed 1）
  薄弱面：性能（条目最少）
  ```
- **实现**：把 `countLedger` 的行扫描抽为共享 `scanLedgers(root, onRow)`（onRow 收 `region/维度/状态`），`countLedger` 与新 `statsLedger` 都基于它——**deferred 计数行为零变化**（现有 30 个测试守护）；`statsLedger` 聚合维度与三区分布
- **文档**：managing-lessons-store SKILL.md 命令表加 `stats` 行
- **测试**：stats 测试（fixture 覆盖三区、多维度、moved 不计）+ 全量回归
- 明确 **YAGNI**：趋势/日期聚合、导出、图表都不做

## 3. L4-1：跨项目分析流程

- **形态**：流程（非新命令）。分析由 **Task 起独立子代理**执行（独立 = 免主上下文偏见，套件既定手法）
- **触发**：手动（用户说"跨项目分析一下/看看跨项目模式"）+ 里程碑收口建议（收口且 L4-1 信号满足时建议一次，**只建议不强制**——沿用收口节既有做法）
- **步骤**：
  1. 前置：KB `resolve` 通过；`lessons stats` 显示 项目 ≥ 2 且条目 ≥ 20（L4-1 信号实测）
  2. Task 起独立子代理：输入 = 三区账本路径 + 分析指令模板；产出**跨项目模式报告**（重复出现的模式 / 跨项目共性根因 / 维度薄弱面 / 建议立为通用教训的候选清单）
  3. 报告落 `D:\Seed\lessons\universal\<日期>-cross-project-analysis.md`
  4. 报告中的候选教训 → 用户裁决 → 走正常复盘流程入账（retro-analyze → institutionalize / evolving-skills）
- **边界**：分析报告本身**不是** ledger 条目（不进统一表）；分析过程不改账本
- **载体**：`using-retrospective` 路由（SKILL.md 环节表后加"L4 跨项目分析"小节 + 收口建议节补一句）+ 新建 `skills/using-retrospective/references/cross-project-analysis.md`（步骤与指令模板全文）。不新建技能、不膨胀其他技能

## 4. KB 账目

- 候选与推迟表：L3-1/L4-1 两行**原行内**加注记"（✅ 已升格 2026-09-28，spec：docs\superpowers\specs\2026-09-28-l3-l4-promotion-design.md）"——行结构不动（该表无状态列，注记即处置记录）
- 实施过程若产生真实教训（RED 证据）→ 按纪律正常入账

## 5. 验证

1. `lessons stats` 输出与手工基准一致（手工 grep 三区行数 × 维度对照）
2. 全量 `node --test` 绿（含 stats 新测试与既有 30 个）
3. `deferred` 输出与修复后基线一致（23 条 / 命中 2——countLedger 行为零变化）
4. `aas` 体检"全部一致"（junction 面不回归）
5. 收尾落地扫：关键词「stats / 跨项目分析 / L3-1 / L4-1」全库扫，命中处逐条对现状
