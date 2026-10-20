# Session 交接：执行力度矩阵 spec 定稿 + testcase + plan 已就绪，待开工施工（2026-10-20）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-20 14:05（Asia/Shanghai） |
| 项目根 | d:\Seed\retro-skills |
| HEAD | 9d20fe5（docs: 新增线E三类文档执行力度检查项统一设计方案）；工作树：非 clean（见「工作树异常」） |
| 验证基线 | `npm run check` 全绿 @14:05 实跑：todo 0 / baseline 35/35 / 0 findings / markdown 检查 214 文件 726 表通过 |
| 继任自 | docs/handoffs/2026-10-20-docgen-p2-s2-task9-replace.md →（本 session） |
| 状态 | 有 1 个开放问题（开工第一问：plan 执行方式 + 4 条开放问题裁决确认） |

## 项目定位

d:\Seed\retro-skills —— 把议会评审 agent 的 markdown 生成物从手写改为代码生成（docgen），并建设「执行力度检查体系」。本阶段（线 E）为 agent/skill/rule 三类文档设计统一的执行力度检查项组织（归桶）+ agent 专属可执行性判据 + 置信度评级。

## 现状

- **已完成**（本 session）：
  - spec 定稿：`docs/superpowers/specs/2026-10-20-execution-assurance-matrix-design.md`（状态已改「已定稿」，议会 4 轮评审通过、18 项 P0/P1 全清零）
  - testcase：`docs/superpowers/specs/2026-10-20-execution-assurance-matrix-design-testcase.md`（50 条 = 正 18 / 负 29 / 边 3，senior-sdet 独立编写）
  - plan：`docs/superpowers/plans/2026-10-20-execution-assurance-matrix.md`（9 任务 TDD 串行，含前置裁决表）
  - 评审账本：`.session/reviews/2026-10-20-1239-execution-assurance-matrix/`（progress/problems/submission 三文件）
  - 线 E 素材（归桶/判据/模式表/评级草案）已由用户提交进 `docs/after/pending-work-overview.md`（commit 9d20fe5）
- **验证证据**：见元信息表「验证基线」（单源，勿重复）
- **提交状态**：spec/testcase/plan 三个文件均为 untracked，**未提交**，留在工作区由用户决定提交方式
- **工作树异常**：用户另有技能文件改动未提交——`skills/parliament/`（SKILL.md + assets/submission.md + 新增 assets/cards.md、problems.md、progress.md 账本三件套模板）、`skills/review-log/`（SKILL.md + review-progress-template.md + time.mjs）、`skills/review-loop/`（SKILL.md + loop.md）。这些不是我本 session 的产物，是用户/编辑器改动，交接时如实记录。

## 过程记录

- spec 定稿依据：议会评审 4 轮（第 1 轮 1 P0 + 9 P1 → 第 2 轮复查 8 项 → 第 3 轮复查 6 项 → 第 4 轮后端 PASS + 审计有条件通过→候选项已收口）；18 项 P0/P1 全清零；审计确认交付物达标（SHA256 一致、50 用例、spec 外链 0 内联）
- 评审账本：`.session/reviews/2026-10-20-1239-execution-assurance-matrix/`（progress.md 4 轮账 / problems.md 已修 18 项 + 卡映射 + 候选 4 项 / submission.md 送审说明）
- 关键修复：归桶⑦⑧双桶（P0）、A1/A2 机器查过度承诺、R5/R8 口径、annotations 布尔压扁、评级落点、判据单源、桶名统一、testcase 计数同步（TC-046/050）

## 本次任务

执行 `docs/superpowers/plans/2026-10-20-execution-assurance-matrix.md`（9 任务 TDD）落地执行力度矩阵体系：
- Task 1 归桶索引数据 + 零重复扫描脚本
- Task 2 agent 判据正文单源 criteria.md（A/B/C 15 项）
- Task 3 A 结构项机器检查脚本（check-agent.mjs）
- Task 4 annotations 三态 + 挂进 check-all
- Task 5 执行力度模式表（种子 ≥5）
- Task 6 置信度评级现算脚本（rating.mjs）
- Task 7 归桶指针挂 rule/skill + README 边界声明
- Task 8 pending-work-overview 线 E 瘦身
- Task 9 全量验收（testcase 落地）

起点：plan 已保存，等待选择执行方式。**执行方式：沿用 subagent-driven（推荐）/ 或 inline；开工前先确认 4 条开放问题裁决。**

## 范围依据

- 要读：`docs/superpowers/plans/2026-10-20-execution-assurance-matrix.md`（9 任务 + 前置裁决表 + Global Constraints）；`docs/superpowers/specs/2026-10-20-execution-assurance-matrix-design.md`（定稿，R1-R8 + §4 归桶 + §5 验收 + §6 开放问题）；`docs/superpowers/specs/2026-10-20-execution-assurance-matrix-design-testcase.md`（50 条 TC 映射）
- 勿重做（已定稿）：归桶命名 R1、边界 R2/R3、评级 R4、判据拆层 R5、模式表 R6、硬闸门 R7、annotations 三态 R8；§4 归桶草案（skillAndRuleShared 当前归属 + ⑦ 候选升格 + 两两桶无交集）；§5 验收 6 锚点；§6 开放问题 4 条（已给裁决建议）
- 评审过程账：`.session/reviews/2026-10-20-1239-execution-assurance-matrix/`（problems.md「已修」18 项是施工必避坑清单）

## 开放问题

1. **开工第一问：plan 执行方式**——subagent-driven（推荐，每任务全新子代理 + 任务间复查）vs inline（executing-plans 批量 + 检查点）。请用户选。
2. **§6 开放问题裁决确认**（plan 已按以下建议写入前置裁决表，需用户点头）：
   - ① 共享项载体 = `tools/execution-matrix/` 脚本 + 文档索引双层
   - ② 实测记录/评级落点 = 模式表文件即登记处，行结构含「实测记录数 / 最近 N 次零回归」字段，评级现算
   - ③ reviewer-audit 初评 = 存量 0 项记模式表，不阻塞 S3/S4
   - ④ ⑦ 暂留 skillAndRuleShared（agent `when` 是数据字段 vs rule/skill 是正文语义段，不同构，按 TC-046）；N=3
3. **线 E 素材瘦身时点**：Task 8 会把 pending-work-overview 线 E 的 A/B/C 判据细节表删掉改为指针——执行到该 Task 时需确认（防两处漂移，对齐 R6）。

## 既定约束（不要重新讨论、不要重新选型）

- **全局 Git 写操作禁令**：plan 不含任何 git 写操作；每任务收尾 = 改动留在工作区，由用户决定提交方式——用户规则「全局 Git 写操作禁令」，与 writing-plans 模板的 Commit 步骤冲突时以用户规则为准
- **spec 已定稿**：R1-R8 与 §4 归桶是定稿，施工不得改（要改走「改前 vs 改后 + 用户确认」硬闸门 R7）
- **判据正文单源**：A/B/C 判据在 `tools/execution-matrix/criteria.md`（spec §7 交付物 2），rule-inspector criteria.md / skill-authoring-convention 只加归桶指针不复制
- **annotations 三态**：pass / fail:理由 / pending，禁止压成布尔（评审共识）
- **评级不持久化**：每次按模式表记录数现算；高风险永不免验
- **A/B/C 组只查卡文本**：不查运行时（R2），运行时归 parliament/review-loop（R3）
- **共享项变更硬闸门**：allShared/两两 shared 变更必须两版对照 + 用户确认（R7）
- **testcase 是验收执行清单**：施工 Task 9 按 50 条 TC 逐项过（机器可判的对应脚本测试，人工/AI 的走 AI 判 + annotations + README 声明）

## 遗留裁决与留观项

- spec §6 开放问题 4 条待用户确认裁决（见「开放问题」②——已给推断，待点头）
- testcase 缺口表 6 条（判别力边界账，spec §6-3 存量处置口径）——施工时按「存量记模式表、不阻塞 S3/S4」执行
- TC-050（第二模板存量盘点）与 TC-048（同主题拆层）是新增用例，施工时须按 spec R5 模板适配落地
- 议会评审账本 4 项候选项已收口（送审 §5 数字、progress 轮次账、problems 候选节、卡映射表头）——无需再处理

## 开工前先做

1. `git status --short` 确认工作树状态（注意：用户另有技能文件改动未提交——parliament/review-log/review-loop，那些不是本任务范围，不要动）
2. 读 `docs/superpowers/plans/2026-10-20-execution-assurance-matrix.md`（9 任务 + 前置裁决 + Global Constraints）
3. 读 spec §3 R1-R8 + §4 归桶 + §5 验收 + §6 开放问题（施工依据）
4. 读 `.session/reviews/2026-10-20-1239-execution-assurance-matrix/problems.md`「已修」18 项（施工必避坑清单）
5. 向用户确认：plan 执行方式（subagent-driven / inline）+ §6 开放问题 4 条裁决 → 确认后开工 Task 1

## 开场话术

读 docs/handoffs/2026-10-20-execution-matrix-execute.md，按交接词继续：执行执行力度矩阵 plan（9 任务 TDD）——开工前先确认执行方式与 §6 开放问题裁决，不自行执行 git 写操作。
