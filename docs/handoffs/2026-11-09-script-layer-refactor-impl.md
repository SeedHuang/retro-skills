# Session 交接：retro-skills → 脚本分层与运行期收口（S3 施工）（2026-11-09）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-09 22:20（Asia/Shanghai） |
| 项目根 | `D:\Seed\retro-skills` |
| HEAD | `376ab88`；工作树：5 个未跟踪项（见「现状」） |
| 验证基线 | `npm run check`：tests 1366 / pass 1359 / fail 0 / skipped 7；`check-plan map` 69/69、`deps` cycle 0、`size` 243/350 69/80；`check-gate-record` tasks 4 rows 18 bad 0；`doc-name --check docs` 通过（22:20 实跑）。typecheck / build / e2e：无（纯 JS 仓库，无独立段） |
| 继任自 | 无（本任务首份 handoff） |
| 状态 | 可直开工（0 个阻塞开放问题；2 个待确认项不阻塞 Task 1） |

## 项目定位

`D:\Seed\retro-skills` —— 规则 / 技能 / agent 卡与判据引擎的治理仓库；本轮做「脚本分层 + 运行期收口」，把卡面命令白名单改为组级单层、机械项落 `scs`、迁移不破契约。

## 现状

- 已完成：
  - PRD：`docs/prd/20261109211349-script-layer-refactor/index.md`（§10 功能点 F-01~F-04；V1–V11 验收）。
  - spec：`docs/superpowers/specs/2026-11-09-script-layer-refactor-design.md`（R1–R13；243/350 行）。
  - testcase：`docs/superpowers/specs/2026-11-09-script-layer-refactor-design-testcase.md`（69 条：正 26 / 负 33 / 边界 10）。
  - plan：`docs/superpowers/plans/2026-11-09-script-layer-refactor.md`（Task 1–7）。
  - 议会 #2：4 轮收敛，P0 = 0、P1 = 0，四席 PASS；账本 `.session/reviews/2026-11-09-215358-script-layer-refactor/`。
  - 签字账：`docs/devworkflows/20261109211349-script-layer-refactor/gate-record.md` 的 ① / ② 两行已落。
- 验证证据：见元信息表『验证基线』（单源，勿在此重复）。
- 提交状态：5 个未跟踪项由用户自行 commit（或按「开工前先做」第 5 条处理）。
- 工作树异常：无。未跟踪项 =
  - `docs/devworkflows/20261109211349-script-layer-refactor/`
  - `docs/prd/20261109211349-script-layer-refactor/`
  - `docs/superpowers/plans/2026-11-09-script-layer-refactor.md`
  - `docs/superpowers/specs/2026-11-09-script-layer-refactor-design.md`
  - `docs/superpowers/specs/2026-11-09-script-layer-refactor-design-testcase.md`
- 关键考古证据（防误判「不存在」）：
  - `scripts/check-criteria-engine.mjs` 现不存在，但历史存在：`git show ed7b40c^:scripts/check-criteria-engine.mjs` 首行 `#!/usr/bin/env node` / 第二行 `// check-criteria-engine.mjs —— 判据引擎校验器…`。
  - `tools/quality/criteria-engine/` 现不存在，但历史存在：`git log --oneline -- tools/quality/criteria-engine` 命中 `fa5f7eb` / `ed7b40c`。
  - 迁移提交：`ed7b40c 2026-11-08 13:29:27 +0800 refactor: 公共脚本迁出至 skill-common-script，门禁改调 scs`；`fa5f7eb 2026-11-08 14:59:30 +0800 refactor(docgen): rules 的 DSL 与编译器统一迁入 builders/rules 与 dsl/rules`。

## 过程记录

- `.session/reviews/2026-11-09-215358-script-layer-refactor/progress.md`（先读尾部「最终结论」）
- `.session/reviews/2026-11-09-215358-script-layer-refactor/submission.md`（送审说明 + 4 轮基线）
- `.session/reviews/2026-11-09-215358-script-layer-refactor/problems.md`（族级台账 F1–F12）
- `.session/reviews/2026-11-09-215358-script-layer-refactor/cards.md`（卡号 / 级别 / 处置汇总）
- `docs/devworkflows/20261109211349-script-layer-refactor/gate-record.md`（① / ② 签字行）
- 历史交接词：无（本任务首份）

## 本次任务

按 plan 执行 Task 1–7（S3 施工），把「组级 layer + 卡面只取 run」与「scs 承接账本计数 / 落点检查 / 两个 inspector」落地；流程：③ 实现（Task 1–6）→ ④ 质量（testcase 69 条）→ ⑤ 交付；起点：③-Task 1。

## 范围依据

- 要读：
  - `docs/superpowers/specs/2026-11-09-script-layer-refactor-design.md` §3.1–§3.7 与 R1–R13（`#L35-L195`）。
  - `docs/prd/20261109211349-script-layer-refactor/index.md` §4 V1–V11（`#L160-L180`）与 §10 F-01~F-04（`#L230-L250`）。
  - `docs/superpowers/plans/2026-11-09-script-layer-refactor.md` Task 1–7 与附录 A。
  - testcase 分组：Task 1–2 读 TC-001~TC-018/064；Task 3 读 TC-019~TC-031/069；Task 4 读 TC-032~TC-042/062/063/065/066；Task 5–6 读 TC-043~TC-059/067/068。
- 勿重做：PRD / spec / testcase / plan 四件（已过议会 #2 与计划门）；`gate-record.md` 的 ① / ② 行；不要重新讨论「组级 layer vs verb 级」「scs 只接 CLI、skill-dir 不迁」等已裁事项。

## 开放问题

1. 5 个未跟踪产物是否先 commit 再开工？推断：先 commit（依据：plan 每个 Task 末尾都有 commit；产物未入库会让 Task 1 的 commit 混入评审文档）；请用户确认或纠正。**开工第一问**。
2. `scs` 新命令名未定（spec §3.7「名待 scs 仓定」）。推断：Task 1/2 不受影响；Task 3/4 开工前在 `D:\Seed\skill-common-script` 定名并回填映射表；请用户确认是否本轮定名。
3. 多条件同时触发时的报码优先级未冻结（testcase §7 缺口 5）。推断：按 spec §3.1 表顺序 `Missing → Invalid → Mixed → Empty → Duplicated` 先报；请在 Task 1 的测试里冻结。
4. `stage-2b-testcase-sdet.md` 历史原文是否改（PRD §8-8 待用户裁定）。推断：不改原文，只加「旧路径 → 新命令」映射表与日期注；请确认。

## 既定约束（不要重新讨论、不要重新选型）

- `layer` 标在命令组上，一组只装一个 layer；混装组必须拆 —— 出处：PRD D3；spec R1。
- 卡面只渲染 `layer=run` 的组；席位配非 run 组由 `validatePolicy()` 报 `NonRunGroupGranted` —— 出处：spec §3.2。
- `scs` 只接命令形态；`skill-dir.mjs` 保持本仓单源、不迁；`check.mjs` 迁走后旧文件 + `check.test.mjs` + 兜底副本一并删除 —— 出处：PRD D14；spec R13 / §3.7。
- `--root` = 项目根；数据根走 `--data` / `--engine` / `--projection`；`--ledger` 必填 —— 出处：spec §3.6。
- 迁移冻结三类契约（exit / code 串 / 首末行 + 路径 + 参数语义）并先存 `migration-baseline.json` —— 出处：PRD D15；spec §3.7。
- 新门禁必须先有 testcase —— 出处：PRD D16；spec R10。
- 不手改 `agents/*.md`，走 `draft → 对照 → replace` —— 出处：PRD §4 硬约束 6。
- 议会 #2 已 4 轮收敛（用户授权 N 轮），P0 = 0、P1 = 0 —— 出处：`.session/reviews/2026-11-09-215358-script-layer-refactor/progress.md` 尾部。

## 遗留裁决与留观项

- 报码优先级：来源 testcase §7 缺口 5；收敛时机 = Task 1 开工时冻结。
- `scs` 默认值改造（`tools/quality/...`）：归 scs 仓，不在本任务 —— 来源 spec §6/§7；收敛时机 = scs 仓另立。
- S5 校验器接 `outputFormats.docs`：阻塞于 result.md §8.5 的 `S4-TC-D01` / `D03` / `D04`，另立 spec —— 来源 PRD §10「不在本清单」。
- `stage-2b-testcase-sdet.md` 原文不改：来源 PRD §8-8；收敛时机 = 用户裁定。

## 开工前先做

1. `git status --porcelain` 确认 5 个未跟踪项；重跑 `npm run check` 复核 `tests 1366 / pass 1359 / fail 0 / skipped 7`。
2. 读 `docs/superpowers/plans/2026-11-09-script-layer-refactor.md` 的 Task 1 与 `spec §3.1 / §3.2`、`PRD §10 F-01`；读 testcase TC-001~TC-018/064。
3. 读 `tools/docgen/builders/agents/policy/definitions/commands.mjs`、`components/validatePolicy.mjs`、`components/validateAgentData.mjs` 的 `EXIT` 表，确认六个新码的登记位置。
4. 在 Task 1 的测试里冻结报码优先级（`Missing → Invalid → Mixed → Empty → Duplicated`）。
5. 若开放问题 1 确认「先 commit」：提交上述 5 个未跟踪路径，再开 Task 1。

## 开场话术

读 `docs/handoffs/2026-11-09-script-layer-refactor-impl.md`，按交接词继续：执行 script-layer-refactor 的 Task 1–7（从 Task 1 组级 layer 开工）。
