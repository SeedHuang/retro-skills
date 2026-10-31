# Session 交接：retro-skills → S4 定稿 + 写 plan + 施工（2026-10-20）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-20 23:21（Asia/Shanghai） |
| 项目根 | d:\Seed\retro-skills |
| HEAD | `b9b1d10`（docs: 更新S4批量数据搬家spec和待办清单）；工作树：**clean**（`git status --short` 无输出，23:21 实查） |
| 验证基线 | `npm run check` → tests **470** / pass **470** / fail **0**；baseline **35/35**；skill 守卫 **0 findings**；markdown **223 文件 / 765 表**；exit 0（**23:21:30 实跑**；本交接文档落盘后为 **224 文件 / 766 表**，测试数不变）。typecheck/build 不适用（纯 Node 仓库，无构建步骤） |
| 继任自 | `docs/handoffs/2026-10-20-s3-plan.md` |
| 状态 | **可直开工，无开放问题**（4 条待决已记 `docs/after/20261017210609-pending-work-overview.md` 线 F，不阻塞） |

## 项目定位

d:\Seed\retro-skills —— 把议会评审 agent 的 markdown 生成物从手写改为 docgen 代码生成，并建设「执行力度检查体系」。当前阶段 Docgen P2：S3（senior-sdet）已闭环，S4 = 余下 12 席从迁移前现卡搬进 docgen。

## 现状

- **S3 已完成并巩固**：`agents/senior-sdet.md` 由 docgen 生成（除来源行外与迁移前逐字节一致）；A/B/C 十项注解已落 `rules/.inspector-annotations.json`，`checkAgentFile('senior-sdet')` = ok / 0 findings（提交 `eb51580`）。
- **S4 spec 已修订 3 并通过议会 5 轮评审**：`docs/superpowers/specs/2026-10-19-docgen-agent-batch-design.md`（修订 3，`(Get-Content).Count` = 217 行）；testcase 第 3 版 39 条（正 18 / 负 14 / 边界 7，`(Get-Content).Count` = 675 行），独立 `senior-sdet` 编写（实例 `sdet-2026-10-20-docgen-p2-s4-r3`）。**审计终审 PASS，明确「账本支持宣布交付」**——证据：`.session/reviews/2026-10-20-222621-s4-batch/progress.md:169-174` + 同目录 `delivery-audit.md` 终局节。
- **S4 设计要点（议会修出来的，施工必须照做）**：
  1. 数据源 = 迁移前现卡，不是 `gen-agents.mjs`（该文件已不存在，spec R2）。
  2. 12 席条目 8 键；`when`/`notWhen`/`route`/`fallback` 只住 `triggerTable`（11 席需新增条目，R3）。
  3. 补 4 个缺失常量：`sharedBlocks.SIX_METHODS` / `DETECTIVE_RULES`，`outputFormats['issue-card']` / `observation`（spec §3）。
  4. **空共享块修复**：`renderAgent` 对 `{{SHARED_BLOCK}}` 空值只删占位符、保留该行换行（不能把值写成 `\n`，会多一行）；B 组 9 席靠这条（spec §3 末注）。
  5. **双闸门**：replace 前必须 `goldenAssertion === 'pass'` **且** `compareResult === null`（R6；`cli.mjs` 待改）。
  6. 新增运行时守卫：`validateAgentData` 断言 15（条目不得含四键，按 outputKind 给允许集上界）。
  7. `check-all` 遍历 `state=replaced` 席跑 `checkAgentFile`，输出须含被检席名（§1-⑦ / §5-⑤）。
  8. **测试同步**（不是删断言）：`cli-gate.test.mjs` 的 `generate` 期望不得依赖迁移进度；`pilot-render.test.mjs` 三连空行断言收窄到「通用纪律末条 → `## 边界`」并新增「恰一空行」；`review-fixes.test.mjs` 用 `reviewer-qa` 当未拆槽样本须同批改（§1-⑫ / §6-12）。
  9. **前 3 席检查点**：`reviewer-product`（B）→ `reviewer-frontend`（A1）→ `detective-observer`（A2），过了才进余 9 席（§4.1）。
- **提交状态**：本 session 的 S4 spec / testcase / `docs/after` 已由用户提交到 `b9b1d10`。
- **工作树异常**：无。

## 过程记录

- `.session/reviews/2026-10-20-222621-s4-batch/progress.md`（**先读 169–174 行第 5 轮终审结论**；轮次账在 14–22 行）
- 同目录 `problems.md`（第 1 轮 17 个 F 族 + 第 2 轮 17 个 G 族；答辩统计在 §四）、`cards.md`（47 张卡；第 2 轮起为最小字段集）、`round-check.md`、`delivery-audit.md`（终局 PASS）
- `.session/reviews/2026-10-20-192002-s3-senior-sdet/`（S3 9 轮，只看尾部结论即可）
- `docs/after/20261017210609-pending-work-overview.md` 线 F（4 条待决：S4 前置、senior-sdet 卡内容缺陷、criteria C 组、agent 来源行）
- 历史交接词链：`2026-10-19-docgen-p2-spec-split.md` → `2026-10-19-docgen-p2-s2-parliament.md` → `2026-10-20-docgen-p2-s2-task9-replace.md` → `2026-10-20-execution-matrix-execute.md` → `2026-10-20-s3-parliament.md` → `2026-10-20-s3-plan.md` →（本文件）

## 本次任务

S4 定稿 → 写 plan → 施工；流程：① 把 spec 头行状态由「待评审（草稿）」改为「已定稿（2026-10-20，议会 5 轮：QA/AI/AU PASS + 审计两表 PASS）」并记录轮次 → ② 写 plan 到 `docs/superpowers/plans/2026-10-20-docgen-agent-batch.md`（含前 3 席检查点、四常量、双闸门、evidence、注解、测试同步）→ ③ 施工（按 plan 逐席走九步闭环）；起点：**环节 ①**。

## 范围依据

- **要读（定稿/写 plan 前）**：
  - `docs/superpowers/specs/2026-10-19-docgen-agent-batch-design.md`：§1 影响面（第 31 行，①–⑫）、§2 R1–R8（44–53）、§3 数据形状与四常量/空共享块（55–123）、§4 九步与 §4.1（125–147）、§5 验收①–⑦（149–159）、§6 硬约束 1–13（161–177）、§7 测试 1–8（179–198）
  - `docs/superpowers/specs/2026-10-19-docgen-agent-batch-design-testcase.md`：§1 覆盖总表 + TC-003（四常量）、TC-005/006/007（三组合）、TC-008（检查点）、TC-017/018（空行/白名单）、TC-106（双闸门）、TC-113（check-all）、TC-114（cli-gate）、TC-206（ROWS 判别）、TC-207（pilot-render）
  - `.session/reviews/2026-10-20-222621-s4-batch/{progress.md:169-174,problems.md,delivery-audit.md}`（终审结论与记录项）
  - 实现现状：`tools/docgen/components/renderAgent.mjs`（`fill` 第 3–6 行、`{{SHARED_BLOCK}}` 第 35 行）、`tools/docgen/cli.mjs`（`cmdReplace` 218–224）、`tools/docgen/components/validateAgentData.mjs`（33–34 只拦 description）、`scripts/check-all.mjs:119`（只跑 reviewer-audit）、`tools/docgen/components/{sharedBlocks,outputFormats,agentData}.mjs`
  - 既有测试：`tools/docgen/test/pilot-render.test.mjs:1-82`（原 91-101 的三连空行断言已随 S4 旧模板退场重写，行号按 2026-10-31 迁移后文件）、`tools/docgen/test/cli-gate.test.mjs:11-20,45-49`、`tools/docgen/test/review-fixes.test.mjs:18-26`
- **勿重做**：5 轮议会评审与 spec/testcase 全部修订（已 PASS）；S3 全链路（`b53f408` / `eb51580`）；线 E 执行力度矩阵产物（`tools/execution-matrix/**`）。

## 开放问题

无。

> 不阻塞的待决项（已记 `docs/after/20261017210609-pending-work-overview.md` 线 F，施工时不改，等用户拍板）：senior-sdet 卡「评审测试策略」无对应职责（#2）、`criteria.md` C 组缺模板形态适配（#3）、agent 来源行只写维护来源（#4；触发信号 = 14 席 replaced 后统一来源行时）。

## 既定约束（不要重新讨论、不要重新选型）

- **一份 spec + 前 3 席代表检查点**，余 9 席机械复制 —— 用户 2026-10-20 裁定；§4.1。
- **数据源 = 迁移前现卡**，不是 `gen-agents.mjs`（已不存在）—— spec R2。
- **四键只住 `triggerTable`**，条目 8 键 —— spec R3。
- **议会席卡字节不变**：替换后 `git diff -- agents/<名>.md` 必须为空（与 S3 的 `1 1` 不同）—— spec R7。
- **replace 双闸门**：`goldenAssertion === 'pass'` 且 `compareResult === null` —— spec R6。
- **干净口径 = 预期产物之外无改动**（允许 `M rules/.inspector-annotations.json`；state/evidence 属预期）—— spec §4 步 9 / §6-10。
- **12 席十键注解由独立子代理判定**（对象 = 替换后卡、时点 = 步 8、判者与依据落账；无子代理只能 pending）—— spec R5 / §6-9、§6-13。
- **testcase 不得由 spec 作者/施工者改写** —— 用户规则「写或修改 spec 时必须同批产出 testcase」。
- **全局 Git 写操作禁令**：agent 不执行 git add/commit/push，改动留工作区由用户提交 —— 用户全局规则。

## 遗留裁决与留观项

- **testcase 模板行号 27-29 应为 28-30**（实测：28=末条 / 29=`{{SHARED_BLOCK}}` / 30=`## 边界`）—— 来源：`delivery-audit.md` 终局记录项 R1；收敛时机：施工前顺手改（或下次改该文件时）。
- **`cards.md`「见文末」应为「见 §附观察」** —— 来源：同上 R3；收敛时机：下次改 `cards.md` 时。
- **senior-sdet 卡内容缺陷**（description 的「评审测试策略」无职责）—— 来源：`docs/after` 线 F #2；收敛时机：用户拍板后重走 W2 基线。
- **criteria C 组缺模板形态适配** —— 来源：线 F #3；收敛时机：线 E 判据下次修订。
- **agent 来源行权威/维护拆分** —— 来源：线 F #4；收敛时机：14 席 replaced 后统一来源行时。
- **F26 `outputKind` 兼任三职** —— 来源：S3 review `problems.md` 候选；收敛时机：出现第二席 `outputKind='testcase'` 或 S4 之后。
- **`review-fixes.test.mjs` 必须同批改** —— 来源：S4 spec §1-⑫；收敛时机：施工到 `reviewer-qa` 拆槽时。

## 开工前先做

1. `git status --short`（应无输出，HEAD 应为 `b9b1d10`）；`npm run check` 复核基线（应 **470/470 pass、baseline 35/35、0 findings、markdown 223/765**）
2. 读 `docs/superpowers/specs/2026-10-19-docgen-agent-batch-design.md` §1（31 行）、§2 R1–R8、§3（重点「无共享块分支」）、§4.1、§5、§6
3. 读 `.session/reviews/2026-10-20-222621-s4-batch/progress.md:169-174` + `delivery-audit.md` 终局节 + `problems.md` 第 1/2 轮结论
4. 读 testcase §1 覆盖总表与 TC-003/005/006/007/008/017/018/106/113/114/206/207
5. 把 spec 头行状态改为「已定稿（2026-10-20，议会 5 轮：QA/AI/AU PASS + 审计两表 PASS）」——**这是本 session 定的下一步动作，不需要再征询**
6. 写 plan 到 `docs/superpowers/plans/2026-10-20-docgen-agent-batch.md`（按 S3 plan 的格式：Global Constraints / File Structure / 九步任务 / 验收映射；含前 3 席检查点）

## 开场话术

读 docs/handoffs/2026-10-20-s4-finalize-plan.md，按交接词继续：S4 定稿 + 写 plan + 施工（不自行执行 git 写操作）。
