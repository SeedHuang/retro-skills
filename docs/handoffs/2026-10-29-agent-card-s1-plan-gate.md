# Session 交接：retro-skills → agent-card S1 的 plan 与 ②→③ 计划门（2026-10-29）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-29 17:55（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `88c4b0c`（`docs: S6 V-13 A/B盲评不在本期，转独立课题并更新验收口径`）；工作树：**5 项未提交** —— `M docs/prd/20261026205821-agent-card-contract.md`（四处词表路径）、`M skills/dev-workflow/references/gate-record.md`（`②@S1` 行）、`?? docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design.md`、`?? …-design-testcase.md`、`?? docs/handoffs/2026-10-29-agent-card-s1-spec.md` |
| 验证基线 | `npm run check` → `# tests 1039` / `# pass 1037` / `# fail 0` / `# skipped 2`、`baseline 37/37`、`0 findings`、`④ markdown 检查通过（310 个文件 / 1365 张表）`、末行 `check 全部通过`（exit 0）；`node scripts/check-gate-record.mjs` → `rows 28 bad 0` / `gate-record ok`；`node scripts/scope-sweep.mjs --check --impact .session/reviews/2026-10-29-1501-agent-card-s1-parliament/impact-sheet.md` → `sweep ok`（exit 0）；`node scripts/doc-name.mjs --check docs` → `命名检查通过（docs）`（**17:55:19–17:55:48 实跑**）。本交接文件落盘后复跑：`④ markdown 检查通过（311 个文件 / 1366 张表）`、末行仍 `check 全部通过`（**17:59 前后实跑**，增量 1 文件 / 1 表 = 本文件） |
| 继任自 | `docs/handoffs/2026-10-29-agent-card-s1-spec.md` |
| 状态 | 可直开工（**1 个开工第一问**，见「开放问题」第 1 条） |

## 项目定位

`d:\Seed\retro-skills` —— AI 协作工作流的规则 / 技能 / 机械判据仓库（五段主干：PRD → spec+testcase → 计划门 → 实现 → 质量 → 交付；`npm run check` 是唯一总门禁）。

## 现状

- **已完成（本窗口）**：
  - **S1 的 ② 段收口**：spec `docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design.md`（**301 行 / v6.1** / SHA256 `2931C7D726055F655D579BF211789E145135141F2DDEA089AEFA50F13660064E`）+ testcase 同名 `-testcase.md`（**2318 行 / 58 条**：正 14 / 负 22 / 边界 22 / 前置 58，`03DA6675BFCFCC494FD08B5FFA1EE21260D6368182AEC84E1ACF12E06A76D6F5`）。testcase 由独立 `senior-sdet` 子代理在**全新上下文**写了 6 轮（主 agent 未代写）。
  - **议会 #2 三轮**：账本 `.session/reviews/2026-10-29-1501-agent-card-s1-parliament/` —— 第 1 轮 4 席 20 卡（P0 6 / P1 8 / P2 6）→ 8 族全修（v4→v5）；第 2 轮 3 席 9 卡（P1 2 / P2 7）→ 全承认（v5→v6）；第 3 轮审计收口先打回 7 条**记录类**项，返工后判 **通过**（P0 0 / P1 0，5 条 P2 候选 C-1～C-5）。
  - **出口签字**：`skills/dev-workflow/references/gate-record.md:38` 的 `②@S1` 行（申报人 = 主 agent、sdet；签字人 = 审计；结论 = 过）。
  - **PRD 路径勘误**：`docs/prd/20261026205821-agent-card-contract.md` 四处词表路径改为 `tools/docgen/card-model/vocab/*.mjs`（`:202` / `:239` / `:270` / `:274`）；判据与功能点零变化 → **R5 不触发**；R8 `sweep ok`。
  - **R8 当次清单**：`.session/reviews/2026-10-29-1501-agent-card-s1-parliament/impact-sheet.md`（13 口径 + 9 命中文件，处置全「不改」）。
- **验证证据**：见元信息表『验证基线』（单源，此处不重复）。
- **提交状态**：**未提交**，由用户自行 commit（清单见元信息表『HEAD』行的「工作树」）。
- **工作树异常**：无异常。唯一需注意 —— 两份 spec 与上一份 handoff 仍为 `??`（未跟踪），**v4 / v5 的中间版本没有 git 快照**（议会候选 C-1 / C-4 已登记此风险）。

## 过程记录

- `.session/reviews/2026-10-29-1501-agent-card-s1-parliament/progress.md`（**先读尾部 §3–§5**：三轮时间线 + 收口返工 7 条）
- 同目录：`cards.md`（29 卡原始全文，含 AU 表与侦探观察）、`problems.md`（8 族台账 + 逐条答辩 + 全轮终态）、`round-check.md` / `delivery-audit.md`（审计两表，结论「通过」）、`detective.md`（行为观察）、`submission.md`（送审说明，含 v4/v5/v6/v6.1 四版基线留痕）、`impact-sheet.md`
- 历史交接词链：`docs/handoffs/2026-10-28-s4-plan-gate.md` → `docs/handoffs/2026-10-29-agent-card-s1-spec.md` → **本文件**

## 本次任务

写 **agent-card S1 的 plan** 并通过 **②→③ 计划门**；plan 落盘约定：`docs/superpowers/plans/2026-10-29-agent-card-s1-card-model.md`。流程：**②→③ 计划门 → ③ 施工 → ④ 质量 → ⑤ 交付**；起点：**②→③**（plan 撰写 + `coverage` / `deps` / `map` 三核对 + 审计签字）。

> 事实基线：`tools/docgen/card-model/` 与上述 plan 文件**当前都不存在**（`Test-Path` 均 `False`，17:55 实测）——12 个 `.mjs` 与 1 个测试文件由 ③ 段落。

## 范围依据

- **要读**：
  - `docs/prd/20261026205821-agent-card-contract.md`：§3.8 `:243-284`（字段形状唯一权威）、§4.4 B 表 S1 组 `:361`（36 个码名）、§6 F-01～F-08 `:463-472`、§8 S1 行 `:516`
  - `docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design.md`：§3 目录 `:35-53`、§4 + §4.1 + §4.2 `:55-113`、§5 `:115-133`、§6 `:135-159`（四入口 + 码表常量 + 7 条约束）、§7 `:161-219`（36 码判据 + 合并 3 码 + 入口对照表）、§8 `:221-240`（八组优先级 + M1/M2）、§9 `:241-251`（V-1～V-8）、§10 `:256-281`（D1–D22）、§11 `:282-289`、§12 `:291-301`
  - `docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design-testcase.md`：§0（9 条事实 + 共用 helper）、§1 覆盖总表（58 行）、§7 缺口表（`S1-G-1…23`）、§9 计数声明
  - `skills/dev-workflow/references/stage-2b-plan-gate.md:6-36`（三条结构必备项、三条核对、「`exit 2` = 结构缺项」）
  - `.session/reviews/2026-10-29-1501-agent-card-s1-parliament/delivery-audit.md`（C-1～C-5 候选与触发信号）
  - `docs/superpowers/plans/2026-10-28-s4-plan-gate.md`（plan 体例样例：Task / Step / `- Consumes:` / 附录 A / 功能点→任务映射表）
- **勿重做**：
  - PRD 四处词表路径**已改**（勿再动 `docs/prd/20261026205821-agent-card-contract.md`）
  - spec + testcase **已过议会 #2**（勿再送议会、勿改判据；testcase 只能由**新的 sdet 实例**修改，spec 作者不得代改）
  - `tools/docgen/policy/**`（S6 单一来源）、`tools/observation-check/**`（S2 已签交付）、`agents/*.md`（15 卡，S4 重生成）—— **零改动**

## 开放问题

1. **开工第一问**：S1 的 plan 是否**单块**（不再拆）？推断：**单块**——spec 301 行 ≤ 350、testcase 58 条 ≤ 80、议会已跑满 **3 轮**（`round-check.md` 三轮时间线）；再拆块须按 `skills/dev-workflow/references/stage-2-tech-design.md:43` 对第二块**重新送议会 #2**，且会在 plan 侧占 R6「拆 spec 中 ≤ 1」的名额。依据：同文件 `:25-35` 阈值表 + 本批议会轮次。请用户：**确认或纠正**。
2. plan 里是否把这 5 条 P2 候选登记成待办？推断：**登记进 plan 的「遗留」节并带触发信号**，不单开任务、不改判据。依据：`delivery-audit.md` 结论列的 C-1～C-5（每条已带触发信号）+ `problems.md` §五。请用户：**确认**。
3. 是否**先 commit 再开新 session**？推断：**先 commit**——两份 spec 与上一份 handoff 均 `??` 未跟踪，议会候选 C-1 / C-4 已登记「v4/v5 无快照、基线不可逐字复算」。请用户：**确认**（或说明由你自行 commit）。

## 既定约束（不要重新讨论、不要重新选型）

- **落点 = `tools/docgen/card-model/`**（12 个 `.mjs` + 1 个测试文件），与 `tools/docgen/policy/**` 零字节交集 —— 用户 2026-10-29 裁定 **A**；S6 spec §3.1 `:36-46` 的权限轴不可混入。
- **S1 范围 = F-01～F-08（定义层），不渲染**：`agents/*.md` 一字不动，15 卡散文迁移归 S4 —— PRD `docs/prd/20261026205821-agent-card-contract.md:516` + 用户 2026-10-29 确认。
- **执行顺序 S2 → S3 → S1 → S4**（S2/S3 已收口）—— 同 PRD `:521`。
- **议会 ≤ 3 轮已用满**（`round-check.md`）；plan 阶段若发现 spec 未定义的东西 → 按 **R4 回流 spec**，**不得在 plan 里新增设计决策**（`rules/dev-workflow-mainline.md` R4）。
- **`npm run check` 是唯一总门禁**，任何改动须 exit 0 —— `scripts/check-all.mjs` + `package.json`。
- **`V-13`（A/B 盲评）不在本期**，plan 与后续验收不得引用 —— `skills/dev-workflow/references/gate-record.md:13` 的 `②@S6` 增量登记。

## 遗留裁决与留观项

- **议会候选 C-1～C-5** —— 来源：`.session/reviews/2026-10-29-1501-agent-card-s1-parliament/delivery-audit.md` 结论列；收敛时机：C-1 / C-3 下次改 `problems.md` §一/§二 或进计划门时同批；C-2 下次改 §三；C-4 下次送议会前先 `git add` 留存基线；C-5 下次改 spec / testcase 头部时统一版本标签（`spec:3` 仍写 v6、正文已是 v6.1）。
- **`CheckItem.criterion` 与 S6 `tools/execution-matrix/criteria.md` 三态可能交叉** —— 来源：`docs/after/20261025145953-s6-policy-open-items-open-decisions.md` 的 D1；收敛时机：③ 段写 `CheckItem.criterion` 用例时判「复用还是另立词表」。
- **`registeredIds` 单源切换 / S2 `tools/observation-check/render.mjs:29-46` 合并副本收敛** —— 来源：spec §11-1 / §11-3；收敛时机：**S4 首次重生成**（S1 不触发）。
- **15 卡豁免窗口（PRD C-08）** —— 到期 = S4 首次重生成；S1 只交校验器、不接线，本段不触发（spec §12 R4 已登记「当前无人调用」）。
- **testcase §7 缺口表的剩余 P2 开项** —— 来源：testcase §7「状态」列；收敛时机：③ 段施工逐条采纳 / 不采纳并留痕（采纳 = 改用例须派**新 sdet 实例**）。

## 开工前先做

1. `git status --porcelain`（确认 5 项未提交；若用户已 commit 则应为空）+ 复跑三基线：`npm run check`（应 `1039 / 1037 / 0 / 2` + `check 全部通过`）、`node scripts/check-gate-record.mjs`（应 `rows 28 bad 0`）、`node scripts/scope-sweep.mjs --check --impact .session/reviews/2026-10-29-1501-agent-card-s1-parliament/impact-sheet.md`（应 `sweep ok`）。
2. 读 spec §3 `:35-53` + §7 `:161-219` + §8 `:221-240` + §9 `:241-251`，据此划 Task；同时读 testcase §1 覆盖总表（58 行）与 §9 计数声明。
3. 读 `skills/dev-workflow/references/stage-2b-plan-gate.md:6-36`（三条结构必备项 + 三条核对 + `exit 2` 语义），确认 plan 必须具备：`**Testcase:**` 行、「附录 A」节（首列即用例 ID）、「功能点→任务映射表」。
4. 读 `docs/superpowers/plans/2026-10-28-s4-plan-gate.md` 的骨架（Task / Step / `- Consumes:` / 附录 A / 映射表），照同一体例写 plan。
5. 写完先自检结构：`node scripts/check-plan.mjs map --plan docs/superpowers/plans/2026-10-29-agent-card-s1-card-model.md`（**exit 2 = 结构缺项**，补结构后重跑），再跑 `coverage --prd docs/prd/20261026205821-agent-card-contract.md --stage S1` 与 `deps --plan <同上>`。

## 开场话术

读 `docs/handoffs/2026-10-29-agent-card-s1-plan-gate.md`，按交接词继续：写 agent-card S1 的 plan 并过 ②→③ 计划门。注意：开工第一问是「plan 是否单块（不再拆）」，先与我确认再动手。
