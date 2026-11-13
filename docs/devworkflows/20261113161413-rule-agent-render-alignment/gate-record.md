# 出口签字账

> 任务：rule 与 agent 文档体系拉齐｜PRD：`docs/prd/20261113160000-rule-agent-render-alignment.md` v0.5.1｜spec：`docs/superpowers/specs/2026-11-13-rule-agent-render-alignment-design.md`｜testcase：`docs/superpowers/specs/2026-11-13-rule-agent-render-alignment-design-testcase.md`｜plan：待写

## 出口签字表

| 段 | 出口判据（逐条） | 核了什么（命令输出首行 或 path:line） | 申报人 | 签字人 | 结论 |
|---|---|---|---|---|---|
| ① | §0 四栏（问题/用户/依据/边界）齐；F1–F6 与 §0.1 流程图双向差集为空；每 F 有验收判据；非目标含假设 | `docs/prd/20261113160000-rule-agent-render-alignment.md:9-16`、`:18-23`、`:39-44`、`:46-55` | 主 agent（代拟） | 用户 | 过（2026-11-13 指令“开始写spec 和 testcase”；4 轮三方评审 P0=0） |
| ② | spec + testcase 一件齐；互审 3 轮一致；spec 207/350、tc 62/80（明细 59）；负+边界 34 ≥ 正 21；差异清单 10 条；内部对齐 0 未决；待议会 #2 | `size:spec 207/350 tc 62/80=>ok`；`.../specs/2026-11-13-rule-agent-render-alignment-design.md:1-207`；`...-testcase.md:10-177`；`...-testcase-diff.md:1-37`；`.../devworkflows/20261113161413-rule-agent-render-alignment/mutual-review.md:7-14` | 主 agent、senior-sdet | 审计 | 不过（互审已一致；待议会 #2） |
