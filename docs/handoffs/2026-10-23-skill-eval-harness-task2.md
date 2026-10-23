# Session 交接：retro-skills → 技能评测工装 plan 施工（Task 2–8）（2026-10-23）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-23 09:27（Asia/Shanghai） |
| 项目根 | d:\Seed\retro-skills |
| HEAD | 65b2702（feat(docgen): 实现变更段写盘通路及相关机制）；工作树：4 个修改 + 6 个未跟踪（明细见「现状 → 工作树异常」） |
| 验证基线 | 本仓无 typecheck / build（纯 Node 脚本仓，`engines.node >= 22`）；`node scripts/check-all.mjs` = **exit 0**，node --test **493/493 通过**、baseline **35/35**、**0 findings**、markdown **242 个文件 / 819 张表**（2026-10-23 09:27 实跑） |
| 继任自 | docs/handoffs/2026-10-22-skill-eval-harness-mutual-test.md |
| 状态 | 有 1 个开放问题（执行方式二选一，见「开放问题」节）——不影响开工前的只读核对 |

## 项目定位

d:\Seed\retro-skills —— 规则 / 技能 / 审查体系仓库；本次在其中新增「技能行为评测工装」（`evals/` + `scripts/` 两个脚本），用来对比「装技能 / 不装技能」时模型行为是否真的不同。

## 现状

- 已完成：
  - spec 定稿：[2026-10-21-skill-eval-harness-design.md](docs/superpowers/specs/2026-10-21-skill-eval-harness-design.md)（347 行，SHA256 `C25ED2C0149EE2F8477CA3DC5075D0D3CCC559A4B930D4EDA8D5002FACD3B977`），议会第 9 轮终判通过（P0=0、阻断=0）
  - testcase 同批定稿：[2026-10-21-skill-eval-harness-design-testcase.md](docs/superpowers/specs/2026-10-21-skill-eval-harness-design-testcase.md)（1278 行，SHA256 `D443700BB33DFB3447861597C63C39D73F549BF827323576B4EC6BB38EBE8464`；用例数实测 `Select-String '^### TC-\d'` = **79 条**）
  - plan 已写：[2026-10-22-skill-eval-harness.md](docs/superpowers/plans/2026-10-22-skill-eval-harness.md)（8 个任务；`Grep 'git (add|commit|push)'` = 0 命中，符合全局 Git 写禁令）
  - Task 1 已落盘（7 个文件，清单见「范围依据 → 勿重做」）
  - 仓库守卫修复：`skills/managing-lessons-store/scripts/lessons.test.mjs` 的 `makeScanner` 默认深度 4 → 6（原因见「工作树异常」）
- 提交状态：**全部未提交，由用户自行决定提交方式**（用户全局规则「全局 Git 写操作禁令」）
- 工作树异常：
  - `M skills/managing-lessons-store/scripts/lessons.test.mjs` —— `makeScanner(maxDepth = 4)` 改为 `6`。原因：Task 1 新增的 `evals/review-triage/fixtures/repos/checkbox-demo/notes/plan.md`，其所在 `notes/` 是第 6 层目录（`evals/1 → review-triage/2 → fixtures/3 → repos/4 → checkbox-demo/5 → notes/6`）。实测深度 5 仍报 `not ok 115 / 118`（`漏扫 …\checkbox-demo\notes`），提到 6 后 `check-all` 转绿（493/493）。
  - 其余未跟踪项：`docs/after/20261022113509-skill-eval-harness-open-decisions.md`、`docs/handoffs/2026-10-22-skill-eval-harness-{mutual-test,round4,round7}.md`、`docs/superpowers/plans/2026-10-22-skill-eval-harness.md`、`evals/`

## 过程记录

- `.session/reviews/2026-10-22-093735-skill-eval-harness/`（**先读 `progress.md` 尾部**拿第 9 轮终判）：
  - `progress.md`（48 KB，段零～段四 + 终判）
  - `clarify.md`（互测 3 轮 + 2 次补丁 + 双签）
  - `problems.md`（P0/P1 判定与五席复评关闭）
  - `cards.md`（20 张必修卡逐张落盘）
  - `round-check.md`（审计实例核对表）
  - `submission.md`（送审说明，含 spec/testcase 全量 SHA256）
  - `a1-assertions.md`（A1 契约脚本的断言依据，Task 4 直接用它）
- 历史交接词链：`docs/handoffs/2026-10-22-skill-eval-harness-round4.md` → `…-round7.md` → `…-mutual-test.md`（本份继任自最后一份）

## 本次任务

按 plan 执行 **Task 2 → Task 8**（Task 1 已完成）；流程：定执行方式（writing-plans 的 Execution Handoff）→ Task 2 手写 oracle → Task 3 `expected.md` 机读块 + 冻结账 → Task 4 A1 契约脚本与单测 → Task 5 runner 纯函数与单测 → Task 6 `run-eval.mjs` + npm script → Task 7 `RECORD.md` 取证与重跑 A1 → Task 8 全量验收；**起点：Task 2**。

## 范围依据

- 要读：
  - [plan](docs/superpowers/plans/2026-10-22-skill-eval-harness.md)：`### Task 2`（行 222–277）、`### Task 3`（行 278–347）、`### Task 4`（行 348–692）、`### Task 5`（行 693–811）、`### Task 6`（行 812–1067）、`### Task 7`（行 1068–1139）、`### Task 8`（行 1140 起）；以及开头 Global Constraints 第 7 条（oracle 必须手写）、第 9 条（路径基准单一）
  - [spec](docs/superpowers/specs/2026-10-21-skill-eval-harness-design.md)：§3.1（行 80，目录结构）、§3.2.1（行 136–149，用例字段与相对路径基准）、§3.2.2（行 151–218，`expected.md` 机读块 = 三层判据唯一单源）、§3.3（行 219–238，runner 七件事）、§3.5（行 255–263）、§5 验收（行 278–292）、§6 硬约束（行 293–308）
  - [testcase](docs/superpowers/specs/2026-10-21-skill-eval-harness-design-testcase.md)：oracle / 断言相关 TC（用 `Grep 'oracle'` 定位；共 79 条，覆盖总表在 §7 之前）
- 勿重做（Task 1 已落盘，7 个文件）：
  - `evals/review-triage/eval.yaml`
  - `evals/review-triage/cases/01-checkbox-mechanical.yaml`
  - `evals/review-triage/cases/02-command-swap-semantic.yaml`
  - `evals/review-triage/fixtures/repos/checkbox-demo/notes/plan.md`
  - `evals/review-triage/fixtures/diffs/checkbox.patch`
- 盘上已存在、Task 2 只需**按 plan 步骤核对内容**（不要重写）：
  - `evals/review-triage/fixtures/responses/01-with-skill.correct.md`（16 行）
  - `…/responses/01-with-skill.no-execution.md`、`…/01-with-skill.no-gitdiff-literal.md`、`…/01-without-skill.wrong.md`、`…/02-without-skill.run-verify.md`
  - `…/responses/flaky-evidence/out3-iteration-1-benchmark.json`、`…/out3-iteration-2-benchmark.json`
- 尚未存在（Task 4/5/6 产出）：`evals/review-triage/fixtures/oracle/*.md`、`scripts/eval-contract-core.mjs`、`scripts/check-eval-contract.mjs`、`scripts/run-eval-core.mjs`、`scripts/run-eval.mjs`

## 开放问题

1. **Task 2–8 用哪种执行方式？** 推断：**子代理驱动**（`subagent-driven-development`，每任务一个全新子代理 + 任务间两段 review）；依据：plan 头部已写「REQUIRED SUB-SKILL: use superpowers:subagent-driven-development (recommended)」，且 Task 4（行 348–692）与 Task 6（行 812–1067）是大段脚本，单会话一次性写完难以逐任务验收。请用户：确认子代理驱动 / 改为本会话内 `executing-plans`。

## 既定约束（不要重新讨论、不要重新选型）

- 不执行任何 git 写操作（add / commit / push / branch / rebase），改动留工作区 —— 用户全局规则「全局 Git 写操作禁令」
- plan 内不出现 commit 步骤 —— 同上；writing-plans 模板的 Commit 步与本规则冲突时以本规则为准
- oracle 必须手写，不得由模型输出摘录、不得由试跑产出 —— plan Global Constraints 第 7 条 + spec §6-11
- 路径基准单一：`cases.files` / `oracle` / `context.repo_fixture` / `context.git.apply_diff` 相对**技能根目录**（`skills/<技能名>/`）；`skills[].path` 相对**仓库根**并由 runner 注入绝对值；`repoRoot = <eval.yaml 所在目录>/../..`，且 `<eval.yaml 所在目录>/..` 末级必须为 `evals` —— spec §3.2.1 行 148（**这是第 9 轮 QA 复评修正后的版本**，勿按旧稿把「末级 = evals」挂到 `../..` 上）
- 键白名单：`expect` 只许 `must_contain` / `must_not_contain`；`judge` 只许 `rule_based` + `output_contains.{all,any}`；禁 `cases.defaults.expect`；`judge ⊆ expect` —— spec §3.2.1 行 145
- spec 与 testcase 已定稿，不重开议会 —— `.session/reviews/2026-10-22-093735-skill-eval-harness/progress.md` 第 9 轮终判（P0=0、阻断=0）
- 收工线：`node scripts/check-all.mjs` 必须 **exit 0 且 0 findings** —— `scripts/check-all.mjs` 四段检查；本次基线 493/493

## 遗留裁决与留观项

- 真实模型实测未取证（无凭据）：spec 以 `verdict=INVALID_ENV` 兜底，不据此断言技能有效 —— 来源 `.session/reviews/2026-10-22-093735-skill-eval-harness/clarify.md`；收敛时机：Task 7 若拿到凭据则补 `fixtures/calibration/<eval_name>/`
- A1 脚本的断言依据已落 `…/a1-assertions.md`（ORACLE-1..3 / EXPECT-1..等），Task 4 以它为准 —— 收敛时机：Task 4
- 互测新规则「双向拒绝权」（拒绝须给依据 / 认输判据 / 替代方案，且不得存心拒绝合理建议）已写进 `docs/after/20261017210609-pending-work-overview.md` 线 I 第 2.1 条，**尚未落进 skill 正文** —— 收敛时机：下次触碰 senior-sdet 或互测流程时

## 开工前先做

1. `git status --short` 对照「现状 → 工作树异常」；再跑 `node scripts/check-all.mjs` 复核 **exit 0 / 493 通过 / 0 findings**（若报 truncated，先查 `skills/managing-lessons-store/scripts/lessons.test.mjs` 的 `makeScanner` 默认深度）
2. 读 plan 的 Global Constraints（12 条）+ `### Task 2`（行 222–277）
3. 读 spec §3.2.2（行 151–218）与 §3.5（行 255–263），确认 oracle 要覆盖哪些断言词
4. 读 `.session/reviews/2026-10-22-093735-skill-eval-harness/a1-assertions.md`（Task 4 直接使用）
5. 就「开放问题 1」向用户确认执行方式，再动手

## 开场话术

读 docs/handoffs/2026-10-23-skill-eval-harness-task2.md，按交接词继续：执行 skill-eval-harness plan 的 Task 2–8。
