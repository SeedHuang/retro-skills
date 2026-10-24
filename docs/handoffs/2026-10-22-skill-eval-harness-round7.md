# Session 交接：retro-skills → skill-eval-harness 议会第 7 轮（2026-10-22）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-22 19:38（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `65b2702d2925614d6b41d6ceb6c6cf65ff702bde`（master）；工作树：M `docs/after/20261017210609-pending-work-overview.md`、M `docs/superpowers/specs/2026-10-21-skill-eval-harness-design.md`、M `docs/superpowers/specs/2026-10-21-skill-eval-harness-design-testcase.md`；未跟踪 `docs/after/20261022113509-skill-eval-harness-open-decisions.md`、`docs/handoffs/2026-10-22-skill-eval-harness-round4.md`、`docs/handoffs/2026-10-22-skill-eval-harness-round7.md`（本文件）、`evals/` |
| 验证基线 | `node scripts/check-all.mjs` → `# tests 493` / `# pass 493` / `# fail 0`；`baseline 35/35`；`0 findings`；`④ markdown 检查通过（239 个文件 / 815 张表）`；`check 全部通过`，EXIT=0（19:37:41 本文件落盘后实跑） |
| 继任自 | `docs/handoffs/2026-10-22-skill-eval-harness-round4.md` |
| 状态 | 可直开工（前置：用户在新 session 明确说「开第 7 轮」；本仓规矩不允许自动开评审轮次） |

## 项目定位

`d:\Seed\retro-skills` —— 个人 AI 工作流规则/技能/流程仓库：以用户全局规则 + 议会评审 + 复盘套件管理「agent 行为纪律」。

## 现状

- 已完成（全部在 2026-10-22 19:00–19:35）：
  - **spec 三层判据改造**（用户指令「站在全局角度、看关系逻辑是否闭环」）：L1 用例可用性（flaky）/ L2 断言可达性（手写 oracle）/ L3 技能有效性（`delta`），新增 §3.2.2 `expected.md` 机读块契约（`schema: eval-expectation/v2`）、verdict 五值（含 `INVALID_DELTA`）、run 级三态、`gate`/`probe` 分离、`origin` 状态迁移。落点：`docs/superpowers/specs/2026-10-21-skill-eval-harness-design.md`（334 行）§1.5 / §2 R5·R7·R8·R10 / §3.1 / §3.2.1 / §3.2.2 / §3.3-5~7 / §3.4 / §3.5 / §4 / §5 / §6 / §7。
  - **真 fixture 契约修正**（实测三条）：`apply_diff` 必须嵌在 `context.git` 下（顶层 `context.apply_diff` 被静默忽略）；`context.git.init` 真实存在；`git.init` 只建空仓库、不做基线提交 → fixture 须自带 baseline 提交。落点：spec §1.5 `fixture 仓库` 行、R5、§3.1、§3.2.1、§3.3-5⑥、§3.3-7 启动前失败清单、§4 步骤 0/1。
  - **用例 01 稳定性实测**（4 次真跑 × 每次 3 迭代，每臂 12 个 run）：装 12/12 全过、不装 0/12 全过、`flaky=否`、`delta=1.000`；按 R8 已达升级门槛，按用户裁定仍保持 `probe`。证据：`.session/eval/trial/case01-stability{3,4,5,6}/iteration-*/benchmark.json`（命令与汇总见送审说明 §6）。
  - **testcase 重写 + 修订**：68 条（正 20 / 负 34 / 边界 14），由 `senior-sdet` 子代理在全新上下文整体重写，再按 fixture 契约定向修订；新增 TC-066/067/068。路径同目录 `...-design-testcase.md`（1030 行）。
  - **送审说明已重写**：`.session/reviews/2026-10-22-093735-skill-eval-harness/submission.md`（第 7 轮版；含 §9 必审清单 A 组 15 项 + B 组 10 项）。
- 验证证据：见元信息表『验证基线』（单源，勿重复填写）。
- 提交状态：本次全部改动**未提交**，由用户自行决定提交方式（本仓规矩：不自动 commit）。
- 工作树异常：`evals/review-triage/` **只有** `fixtures/responses/`（5 份 md + `flaky-evidence/` 2 份 json）；`evals/review-triage/{eval.yaml,cases/,expected.md,fixtures/oracle/,fixtures/repos/,fixtures/diffs/}` 均不存在（`Test-Path` 实查为 False），即 spec §4 步骤 1–3 尚未施工；`scripts/run-eval.mjs` 不存在（`Test-Path scripts\run-eval.mjs` = False）；`package.json` 无 `eval:review-triage` script（`Select-String` 无命中）。

## 过程记录

- `.session/reviews/2026-10-22-093735-skill-eval-harness/submission.md`（第 7 轮送审说明；**先读 §9 必审清单**）
- `.session/reviews/2026-10-22-093735-skill-eval-harness/progress.md`（先读尾部：第 6 轮段已收尾，第 7 轮段尚未补）
- `.session/reviews/2026-10-22-093735-skill-eval-harness/problems.md`（族级台账，第 1–6 轮）
- `.session/reviews/2026-10-22-093735-skill-eval-harness/cards.md`（卡片全文；缺第 2/3 轮原始卡）
- `.session/reviews/2026-10-22-093735-skill-eval-harness/round-check.md`（侦探/审计轮间核对，第 6 轮段）
- `.session/eval/trial/case01-stability6/`（最新一次真跑的完整产物；`.session/` 不进 git）
- 历史交接词：`docs/handoffs/2026-10-22-skill-eval-harness-round4.md` → 本文件（第 4 轮 → 第 7 轮）

## 本次任务

开议会**第 7 轮**：五席并行复查「三层判据改造 + fixture 契约修正版」spec 与 testcase，出卡 → 汇总 → 判定 → 不过则修 → 过则定稿并更新 `docs/after/20261017210609-pending-work-overview.md` 线 H；流程：① 读送审说明 §9 → ② 五席并行派卡（审计/测试/后端/读者/AI）→ ③ 汇总 `cards.md` 与 `problems.md` 族级台账 → ④ 判「P0=0 且必须修项 ≤5」→ ⑤ 不过则修并复跑 check；过则定稿 + 更新线 H → ⑥ 侦探 + 审计本人实例轮间核对（`round-check.md` 加第 7 轮段）；起点：环节 ①。

## 范围依据

- 要读：
  - `.session/reviews/2026-10-22-093735-skill-eval-harness/submission.md` 全文（重点 §1 被审对象与 SHA256、§6 机器证据、§7 已知雷区、§9 必审清单）
  - `docs/superpowers/specs/2026-10-21-skill-eval-harness-design.md` §1.5（三层判据 / flaky / run 三态 / 全过率 / delta / oracle / gate·probe / fixture 仓库）、§2 R5/R7/R8/R10、§3.2.2（机读块 ①–⑦）、§3.3-5~7、§3.5、§4
  - `docs/superpowers/specs/2026-10-21-skill-eval-harness-design-testcase.md` 覆盖总表 + TC-022 / TC-039 / TC-047 / TC-049 / TC-050 / TC-051 / TC-052 / TC-066 / TC-067 / TC-068
  - `.session/reviews/2026-10-22-093735-skill-eval-harness/problems.md` 第 6 轮段（15 族 F1–F15 的处置）
- 勿重做：testcase 整体重写（已完成）、三层判据改造（已完成）、fixture 契约修正（已完成）、用例 01 稳定性实验（已完成，4 次真跑）；**不要**把 `evals/` 与 `scripts/run-eval.mjs` 当成已存在。

## 开放问题

1. 第 7 轮是否现在开？推断：用户已完成送审说明并在上一轮问「要提交议会了吗」，推断意图是「准备开、等自己一句话」——依据：`submission.md` 头部状态写「待用户指令开始第 7 轮」。请用户：在新 session 直接说「开第 7 轮」即可。

## 既定约束（不要重新讨论、不要重新选型）

- 不自动执行任何 git 写操作（add/commit/push 等）—— 用户全局规则；改动留工作区由用户决定提交方式。
- 评审轮次必须由用户明确指令开始，不得自动开 —— 上一轮已确立的流程约束（`submission.md` 头部状态行）。
- 本轮只审 spec + testcase，不审施工 —— `submission.md` §3。
- 用例 01 保持 `probe`（不进 L3）—— 用户 2026-10-22 当场裁定；证据已够 R8 升级，但迁移动作留给施工期（`submission.md` §7-8）。
- 结论只对 `claude_code` + CCR 转发（实际模型 GLM）成立，不得外推 —— spec R9 与 `submission.md` §7-2。
- `.session/` 证据不进 git、只作定稿前依据 —— `.gitignore` + `submission.md` §2-3。
- 判据单源：flaky 只在 §1.5 / §3.3-6 定义，达标只在 §3.2.2 机读块定义 —— spec §6-10；不得另起第二套口径。

## 遗留裁决与留观项

- 用例 01 升 `gate` 的时机 —— 来源：spec R8/R10 + 用户 2026-10-22 裁定；收敛时机：施工期首跑 `calibrated` 通过、且 `expected.md` 写入 `with_skill.min_rate=1.0` / `without_skill.max_rate=0.0` / `delta.min=1.0` 之后。
- `delta.min` 中间取值（如 0.6）未校准 —— 来源：testcase §8 建议 10；收敛时机：启用第二个技能时先跑一次 `calibrated` 记录分布再定阈值。
- `anchors: []` 与「主锚点必须存在」的张力 —— 来源：testcase §7 缺口表；收敛时机：第 7 轮议会若提，按「无主锚点的用例只能当 probe」收口。
- 账本 `cards.md` 缺第 2/3 轮原始卡、`progress.md`/`problems.md` 缺第 2/3 轮详细段 —— 来源：`submission.md` 文末「已知账本缺口」；收敛时机：本任务收尾前清账。

## 开工前先做

1. 复核基线：`git status --short`（期望同元信息表所列 6 项）+ `node scripts/check-all.mjs`（期望 `# pass 493`、`0 findings`、EXIT=0）。
2. 读 `.session/reviews/2026-10-22-093735-skill-eval-harness/submission.md` §1 / §6 / §9，确认被审件 SHA256 与清单未变（spec `A649DBB0…D2AC51` / testcase `80C699B7…C1379`）。
3. 读 spec §1.5 与 §3.2.2 全文（三层判据与机读块是第 7 轮最主要的审查面）。
4. 读 `problems.md` 第 6 轮段与 `round-check.md` 第 6 轮段，拿到 15 族落点与上轮核对结论。
5. 若要复跑真 fixture 实验：先确认 CCR 在跑 —— `Get-NetTCPConnection -LocalPort 3456 -State Listen`（未监听时 `claude` 报 `Connection refused`，run 级 `passed/total` 为空 → 会误判 `INVALID_ENV`）。

## 开场话术

读 `docs/handoffs/2026-10-22-skill-eval-harness-round7.md`，按交接词继续：开议会第 7 轮复查 skill-eval-harness spec。注意：第 7 轮需我明确说「开第 7 轮」；不要自动 commit。
