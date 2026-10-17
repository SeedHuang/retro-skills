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
0. **组队**：读项目类型 → 按 `references/doc-taxonomy.md` 判文档类型 → 按 `references/assembly-matrix.md` 点将矩阵出提议名单 → 按 `references/host-duties.md` 定答辩组编制（架构师 7 方向选一、研发 4 人按文档类型换编制）→ 用户确认（覆盖矩阵零缺口 = 最低法定人数；侦探无条件常驻）
1. **评审**：被点评委并行独立出卡（每席：固定清单逐条作答 + 自由探索 3-5 问）→ 主持人汇总、去重、按族分组 → 追问轮发全体评委补视角（审 rule/skill/agents 类文档时，另对照 `references/failure-modes.md` 13 病根表逐层核对）
2. **答辩**：答辩方小组核实问题客观性 → leader 按 `references/debate-protocol.md` 逐卡作答（承认 / 反驳带依据 / 部分承认带修法）→ ≤3 轮
3. **侦探**：每轮答辩后行为核对（刁难 / 回避 / 丢卡），机械判据与处置表在 `references/debate-protocol.md`
4. **审计**：每轮填 `assets/round-check.md`（第 0 项轮际对账；不过 = 下一轮不得开始）；终局填 `assets/delivery-audit.md`（不过 = 不得宣布交付）
5. **升级**：3 轮未决按 `assets/escalation-report.md`（双方摸查记录与各自解法必填；无摸查 = 臆想争端，侦探驳回）
6. **修复纪律**：每修复带落点 → 重跑手法 3（跨章节一致性）→ 同族扫描 → 修复引入自查
7. **产出**：结论先行（X 矛盾 + Y 盲点 + Z 优化）→ 分级详述（`assets/issue-card.md` 格式）→ 自洽确认区 → 团队名单与轮间变更记录 → 实际执行路径标注 → **评审产物落点按 review-log 规矩**进 `.session/reviews/<YYYY-MM-DD-HHMM>-<kebab 名字>/`（`problems.md` 问题漏斗 + `progress.md` 过程账）；`docs/reports/` 只放分析数据，不放评审结论（2026-10-17 落地，原因见本技能 KB 账本验收回填）

## 关键规矩
- 问题卡缺「证据」或「建议解法」= 废卡；无 P0 形态证据标 P0 = 级别不匹配
- 重提已关闭问题且无新证据 = 刁难；答辩反驳无依据 = 回避（侦探均按机械判据核）
- 审计两表必由审计专员本人实例完成，主持人代填即违规；证据栏空 = 不通过，不是待补
- 中断权与终裁权只在用户；技术分歧 3 轮内不升级
- 评审飞轮回流：使用中发现本应议会抓到却没抓到的问题 → 先记账进本技能 KB 账本，只告知「已记账」；「改」由用户在 lessons 发起后走 evolving-skills 技能
