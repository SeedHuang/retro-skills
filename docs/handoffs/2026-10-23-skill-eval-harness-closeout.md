# Session 交接：retro-skills → skill-eval-harness 收尾（签字 / 提交 / 真跑取证）（2026-10-23）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-23 12:38（Asia/Shanghai） |
| 项目根 | d:\Seed\retro-skills |
| HEAD | `65b2702`；工作树：**不干净**（见「现状 → 提交状态」逐项） |
| 验证基线 | `node scripts/check-all.mjs` = `# tests 589 / # pass 589 / # fail 0`、`0 findings`、`247 个文件 / 822 张表`（写入本文后复跑为 `248 / 823`）、`check 全部通过`、exit 0；`node scripts/check-eval-contract.mjs review-triage` = `findings=0`、`CONTRACT.json 已写入（14 个文件）`、exit 0、无 SKIP（**12:38 实跑**） |
| 继任自 | `docs/handoffs/2026-10-23-skill-eval-harness-task2.md` |
| 状态 | 有 3 个开放问题（见「开放问题」节；第 1 问为开工第一问） |

## 项目定位

`d:\Seed\retro-skills` —— 规则 / 技能 / 复盘套件的源仓库；本次分支的工作是「技能行为评测工装」（skill-up 本地化），用来回答「一条技能对模型到底有没有约束力」。

## 现状

- 已完成（文件级，全部在工作树、**未提交**）：
  - `evals/review-triage/`：`eval.yaml`、`cases/01-checkbox-mechanical.yaml`、`cases/02-command-swap-semantic.yaml`、`expected.md`（机读块 `eval-expectation/v2`）、`frozen-ledger.json`（逐字 `{}`，2 字节）、`fixtures/oracle/01-*.md`、`fixtures/oracle/02-*.md`、`fixtures/repos/checkbox-demo/notes/plan.md`、`fixtures/diffs/checkbox.patch`、`fixtures/responses/`（5 份 md + `flaky-evidence/` 2 份 json，均在 HEAD 前的历史中已存在）、`fixtures/RECORD.md`（17,944 字节）、`fixtures/CONTRACT.json`（14 键哈希快照）
  - `scripts/eval-contract-core.mjs`、`scripts/check-eval-contract.mjs`（A1 离线契约闸门）、`scripts/run-eval-core.mjs`、`scripts/run-eval.mjs`（runner）；对应三个单测 `*.test.mjs`
  - `package.json` 新增一条 script：`"eval:review-triage": "node scripts/run-eval.mjs review-triage"`
  - `skills/managing-lessons-store/scripts/lessons.test.mjs`：`makeScanner(maxDepth = 4)` → `6`（上一 session 既有改动，最终 review 裁定为**收紧**守卫参数，见 Ruling 12）
  - `docs/after/20261022113509-skill-eval-harness-open-decisions.md`（已改写为「还没做完」的入口）、`docs/after/20261017210609-pending-work-overview.md` 线 H 状态已更新
- 验证证据：见元信息表『验证基线』（单源，勿重复）
- 提交状态：**全部未提交，由用户自行 commit**。`git status --short` 逐项：`M docs/after/20261017210609-pending-work-overview.md`、`M docs/superpowers/specs/2026-10-21-skill-eval-harness-design.md`、`M docs/superpowers/specs/2026-10-21-skill-eval-harness-design-testcase.md`、`M package.json`、`M skills/managing-lessons-store/scripts/lessons.test.mjs`；未跟踪 `docs/after/20261022113509-skill-eval-harness-open-decisions.md`、`docs/handoffs/2026-10-22-skill-eval-harness-mutual-test.md`、`docs/handoffs/2026-10-22-skill-eval-harness-round4.md`、`docs/handoffs/2026-10-22-skill-eval-harness-round7.md`、`docs/handoffs/2026-10-23-skill-eval-harness-task2.md`、`docs/superpowers/plans/2026-10-22-skill-eval-harness.md`、`evals/`、`scripts/check-eval-contract.mjs`、`scripts/check-eval-contract.test.mjs`、`scripts/eval-contract-core.mjs`、`scripts/run-eval-core.mjs`、`scripts/run-eval-core.test.mjs`、`scripts/run-eval.mjs`、`scripts/run-eval.test.mjs`
- 工作树异常：`.session/eval/fixture/` 存在（dry-run 冒烟物化出的临时仓库，已 gitignore；`.session/eval/out/` 已确认**不存在**，符合 dry-run 不产产物的口径）。无其它异常。

## 过程记录

- `d:\Seed\retro-skills\.superpowers\sdd\2026-10-22-skill-eval-harness\progress.md`（**先读尾部**：含 Task 1–7 记录、最终整支 review、修复轮、Ruling 1–15）
- `d:\Seed\retro-skills\.superpowers\sdd\2026-10-22-skill-eval-harness\`：`task-N-brief.md` / `task-N-report.md`（N=1..8）、`preflight-scan.md`、`review-task-6.md`
- `d:\Seed\retro-skills\.session\reviews\2026-10-22-093735-skill-eval-harness\`（议会第 1–9 轮过程账：progress / problems / cards / round-check / clarify）
- 历史交接词链：`docs/handoffs/2026-10-22-skill-eval-harness-round4.md` → `docs/handoffs/2026-10-22-skill-eval-harness-round7.md` → `docs/handoffs/2026-10-23-skill-eval-harness-task2.md` → 本文

## 本次任务

收尾 skill-eval-harness：**用户签 `expected.md` 的 8 个人工核对项 → 决定提交方式 → （有凭据时）真跑取证**；流程：复核基线（已完成，见元信息表）→ 签字 → 提交 → 真跑取证 → 回写 `RECORD.md` / `docs/after/20261022113509-skill-eval-harness-open-decisions.md`；起点：**签字环节**。

## 范围依据

- 要读：`evals/review-triage/expected.md` 第 47–56 行（8 个待签项）与第 9–45 行（机读块，阈值唯一单源）；`docs/superpowers/specs/2026-10-21-skill-eval-harness-design.md` §5⑤（第 286 行，断言质量六项）、§3.4（禁词双向留痕）、§3.2.1 键白名单（第 145–146 行）、§3.2.2（机读块 ①–⑦）；`evals/review-triage/fixtures/RECORD.md` §四/§六；`.superpowers/sdd/2026-10-22-skill-eval-harness/progress.md` 尾部
- 勿重做（已实现，文件级）：`evals/review-triage/` 全套判据与样本；`scripts/eval-contract-core.mjs` / `check-eval-contract.mjs` / `run-eval-core.mjs` / `run-eval.mjs` 及其三个单测；`package.json` 的 `eval:review-triage`；Task 1–8 的全部施工与逐任务 review、最终整支 review + 修复轮（4/4 ADDRESSED）

## 开放问题

1. **开工第一问**：`expected.md` 的 8 个 `- [ ]` 是否按 2026-10-23 的机读核对结果打勾？推断：**8 项全部成立**（证据：oracle 01 `must_contain` 3/3、`must_not_contain` 4/4 不命中；oracle 02 2/2、4/4；锚点 `notes/plan.md` 在 oracle 命中且 prompt 0 命中；`must_not_contain` 与分档标题 `可直接提交 / 必须 review / 不提交` 交集为空；`judge` 词全在 `expect` 内；`expect` 只有 `must_contain/must_not_contain`、`judge` 只有 `type/success/output_contains.all`、禁用键零命中；两条 `title` 互异；A1 `findings=0`）。请用户：确认后由 agent 打勾（并在每行附核对依据）／或用户自己勾。
2. 提交方式：推断：**拆 3 批**更易审——① `evals/` + `scripts/`（主体，含三个单测）；② `docs/`（spec/testcase 的议会修订 + plan + handoff + after 两篇）；③ `skills/managing-lessons-store/scripts/lessons.test.mjs`（独立小改）。请用户：确定批次与 commit message 口径。
3. 真跑取证是否现在做？推断：**本机做不了**（无 `skill-up` 二进制、无模型凭据），保持「未取证」并在 RECORD 如实标注；等环境具备再做。请用户：确认是否先按未取证交付。

## 既定约束（不要重新讨论、不要重新选型）

- 阈值唯一单源 = `expected.md` 的 json 机读块，别处不复述数值 —— 出处：spec §3.2.2 / `expected.md` 第 4 行
- A1 不进 `npm run check`、不加 npm script，直接 `node scripts/check-eval-contract.mjs [<技能名>]` —— 出处：spec §1 影响面④ / §4 步骤 9（用户 2026-10-23 裁定纳入）
- `judge` 判定与禁用键白名单只有一份实现 `auditCaseKeys`（`scripts/eval-contract-core.mjs`），A1 与 runner 共用 —— 出处：Ruling 13 之前的 I-1 修复、`progress.md` 修复轮段
- `fixtures/RECORD.md` 不进 CONTRACT 六类快照；防删改靠 `REC-0` / `REC-6` / `REC-7` —— 出处：Ruling 13
- 裁决口径：`assert_hash` = `sha256(canonicalJson({assert, anchors, arms, delta}))`，runner 只比对不生成 —— 出处：spec §3.2.2③ / `eval-contract-core.mjs` 的 `assertHash`
- 全程不自动 commit / 任何 git 写操作 —— 出处：用户全局规则
- 文件编码 UTF-8 无 BOM、LF —— 出处：用户全局规则（录入即可生效）

## 遗留裁决与留观项

- Ruling 12（`maxDepth` 4→6 = 收紧，接受）—— 来源：`progress.md` Ruling 12；收敛时机：补一句魔数解释时（M11）
- Ruling 13（RECORD 不入快照）—— 来源：`progress.md` Ruling 13；收敛时机：若将来把「样本→用例」映射纳入契约
- Ruling 14（删死导出 `computeFlaky`）—— 来源：`progress.md` Ruling 14；收敛时机：已收敛（补了 1 条 `decideVerdict` 级并集测试）
- Ruling 15（`REC-6` 集合语义，不引入映射）—— 来源：`progress.md` Ruling 15；收敛时机：spec 授权新契约时
- deferred minors M1（机读块缺 `skill` 字段）/ M2（人工核对区复述派生计数 + 未写「为何扩到四词」）/ M9（`task-8-report.md` 计数为当时值 581）/ M10（8 个待签项，即本次签字）/ M11（`maxDepth` 魔数）—— 来源：`docs/after/20261022113509-skill-eval-harness-open-decisions.md`「还没做完」第 3 条；收敛时机：真跑取证那一轮或下次触碰对应文件时

## 开工前先做

1. `git status --short` 核对工作树与上文「提交状态」逐项一致；再跑 `node scripts/check-all.mjs`（期望 `# pass 589 / # fail 0`、`0 findings`、exit 0）与 `node scripts/check-eval-contract.mjs review-triage`（期望 `findings=0`、exit 0、无 SKIP）
2. 读 `.superpowers/sdd/2026-10-22-skill-eval-harness/progress.md` **尾部**（最终整支 review + 修复轮 + Ruling 12–15），确认没有未收敛的必修项
3. 读 `evals/review-triage/expected.md` 第 47–56 行，准备逐行打勾文案（每行后附「2026-10-23 核对：命令 + 结果」）
4. 读 `docs/after/20261022113509-skill-eval-harness-open-decisions.md` 的「还没做完（唯一入口）」5 条，确认要交付的「未取证」口径
5. 若环境具备 `skill-up` 与模型凭据，再读 `evals/review-triage/fixtures/RECORD.md` §一/§三/§六 与 spec §3.4，按真实输出回写

## 开场话术

读 `docs/handoffs/2026-10-23-skill-eval-harness-closeout.md`，按交接词继续：skill-eval-harness 收尾（用户签 8 个人工核对项 → 决定提交方式 → 真跑取证）。注意：先复核基线（`check-all` 应 589/589）、**不要自动 commit**。
