# Session 交接：retro-skills → Docgen P2 S2 Task9 replace 闭环（2026-10-20）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-20 09:57（Asia/Shanghai） |
| 项目根 | d:\Seed\retro-skills |
| HEAD | 3d4d1c6312a2d663d39ed5fb68922601938c0f41；工作树：clean |
| 验证基线 | unit 344/344 pass + baseline 35/35 + findings 0（npm run check @10:13，head 3d4d1c6） |
| 继任自 | docs/handoffs/2026-10-19-docgen-p2-s2-execute.md → docs/handoffs/2026-10-19-docgen-p2-s2-parliament.md |
| 状态 | 有 1 个开放问题（开工第一问：replace 是否执行） |

## 项目定位

d:\Seed\retro-skills —— 把议会评审 agent 的 markdown 生成物从手写改为代码生成（docgen），本阶段（P2 S2）试点把 `reviewer-audit` 一席转录成 docgen 组件数据并接入可校验的 replace 闭环。

## 现状

- 已完成：docgen P2 S2 施工 Task 1–8 全部 + 修复轮（TRAE-code-review 的 #1/#2/#3/#4/#6）；
  - Task1：`agents/reviewer-audit` 八键条目 + triggerTable + DOMAIN（components/agentData.mjs、patternRegistry.mjs）
  - Task2：sharedBlocks.AUDIT_RULES + outputFormats.audit（与黄金快照逐字一致）
  - Task3：渲染函数 + 全量模板（components/renderAgent.mjs、templates/agent.md.tpl，整文件逐字节等）
  - Task4：cli.mjs 导出 renderByName + cmdGenerate 渲染比对
  - Task5：EXIT 错误码五档表 + description 断言 1b（validateAgentData.mjs）
  - Task6：state.mjs/evidence.mjs/state.json + cmdCheckAgents 按 state 分流
  - Task7：collectGate 重构 + cmdReplace（判别子/TargetDrift/幂等）+ acceptance/replace-scenarios.mjs（6 场景全过）
  - Task8：golden-assert / init-evidence / cold-run（acceptance/*.mjs）+ fixtures/reviewer-audit.evidence.json
  - 修复轮：#1 writeEvidence 原子写（evidence.mjs）；#2 golden-assert 正则锚定闭合；#3 catch 只对带 code 错误 exit 2；#4 cli.mjs draft sub 归一；#6 target 缺失显式 DanglingBaselineEntry
- 验证证据：见元信息表「验证基线」（单源，勿重复）
- 提交状态：已 commit。`18a9489`（feat: 施工 Task1-8 + replace 闭环 + 修复轮，21 文件）；`3d4d1c6`（docs: 交接 + 拆 spec + 方案对比，7 文件）。未 push
- 工作树异常：无

## 过程记录

- 施工计划：docs/superpowers/plans/2026-10-19-docgen-agent-pilot.md（Task 9 在第 1471–1560 行附近，九步闭环）
- 交付审计交接：docs/handoffs/2026-10-19-docgen-p2-s2-parliament.md（先读尾部）
- 施工交接：docs/handoffs/2026-10-19-docgen-p2-s2-execute.md
- 历史交接词链：2026-10-19-docgen-p2-s2-parliament.md → 2026-10-19-docgen-p2-s2-execute.md → （本份）

## 本次任务

执行 docgen P2 S2 的 **Task 9 九步闭环**，把 `agents/reviewer-audit.md` 从手写替换为 docgen 渲染产物（内容逐字节相同，纯形式迁移）。
流程：①入选四值（commit/blob/hash-object/SHA256）→ ②evidence 基线校验 → ③generate 生成 → ④golden-assert 黄金断言+整文件比对 → ⑤state 接守卫 → ⑥落草稿 → **⑦replace（Step 7 必须先问用户确认，replace 会改 state.json/evidence/清草稿，且替换 agents 文件）** → ⑧验收（gate+check-agents+npm run check）→ ⑨替换后 diff 比对。
起点：Step 9 起（Step 1-6 已在前一 session 完成，见下方「范围依据→已完成」）。**执行方式：沿用 subagent-driven / 或 inline；replace 前必须停下来问用户确认，不自行执行 git 写操作。**

## 范围依据

- 要读：docs/superpowers/plans/2026-10-19-docgen-agent-pilot.md 的 Task 9 节（约 1471–1560 行，含九步细节与 Step 7 replace 确认要求）；执行前跑 node tools/docgen/acceptance/golden-assert.mjs reviewer-audit 确认仍未替换（agents/ 下 reviewer-audit 仍手写）
- 勿重做（已实现且通过）：agentData/patternRegistry/sharedBlocks/outputFormats/renderAgent（数据+渲染，逐字节相等）；state/evidence 模块；collectGate/cmdReplace 判别子；acceptance 三脚本；修复轮 5 处。Pilot 关键文件：tools/docgen/test/pilot-{data,render,gate}.test.mjs

## 开放问题

1. **开工第一问（当前正停在 Step 7）：replace 是否执行？** 前置（Step 1-6）已复核就绪：gate baseline 35/35、golden-assert「黄金断言通过：description 逐字相等 + 整文件逐字节相等」、草稿 `reviewer-audit--20261019-235607.md` 存在、`git status --short agents/` 为空。命令 `node tools/docgen/cli.mjs replace --kind agent --name reviewer-audit --draft <草稿> --yes` 会原子替换 `agents/reviewer-audit.md`（逐字节不变）、state.json 置 `replaced`、清草稿、更新 evidence。推断：应执行（纯形式迁移、逐字节等价，S2 试点闭环落地动作）；请用户：确认执行 / 纠正别执行

## 既定约束（不要重新讨论、不要重新选型）

- replace 前必须停下来问用户确认，不自行执行 git 写操作 —— 用户当场指令 + user rule「全局 Git 写操作禁令」
- Step 7 替换后 `agents/reviewer-audit.md` 内容不变（纯形式迁移），不得趁机改内容 —— 施工 plan Task 9 约定
- generate 全遍历对未替换已拆槽席（reviewer-product/senior-sdet）恒红是 S2 中间态诚实信号，#5 修复被用户明确跳过 —— 用户裁决「按方案修复 #1/#2/#3/#4/#6，跳过 #5」
- 状态化迁移：state.agents 只标记已 replace 席，collectGate 只比对 replaced 席；未接管席仍走存在性检查 —— spec/plan 既定
- 通用化方向已定：Task 9 收口后，开小 spec「渲染层按 outputKind 分派」（把 sharedBlock/outputFormats 隐式选择显式化为 outputKind→段模板 表，只实现 issue-card 一档样板，铺开时新增输出形态才扩）；先 Task 9 再通用化，不做过度抽象 —— 用户 2026-10-20 裁定「先 Task9 再小 spec（推荐）」

## 遗留裁决与留观项

- #5 cmdGenerate 全遍历 vs collectGate 口径不一致（generate 对未 replace 席也强比对）—— 来源：TRAE-code-review 上轮；收敛时机：S2 只在替换一席的中间态有意义，全席替换完成后自动消解—— source 中留档
- golden-assert 正则仍仅对「name→description→tools」三行结构 frontmatter 验证有效 —— 来源：修复轮 #2；收敛时机：下次触碰其它 agent 时

## 开工前先做

1. `git status --short` 确认工作树 clean；`npm run check` 复核基线（unit 344/344 + baseline 35/35，本次交接 10:13 实跑）
2. 读 docs/superpowers/plans/2026-10-19-docgen-agent-pilot.md 的 Task 9 节（1471–1560 行），核对九步闭环每步命令
3. 确认草稿存在：`node tools/docgen/cli.mjs draft ls --name reviewer-audit`（应列出 reviewer-audit--20261019-235607.md）
4. 确认 agents/ 下 reviewer-audit 仍手写（`git status --short agents/` 应为空，替换动作尚未发生）
5. 跑到 Step 7 替换前停下，向用户确认 replace 再执行；之后跑验收 gate + check-agents + npm run check

## 开场话术

读 docs/handoffs/2026-10-20-docgen-p2-s2-task9-replace.md，按交接词继续：执行 Docgen P2 S2 的 Task 9 九步闭环——replace 前先问用户确认，不自行执行 git 写操作。