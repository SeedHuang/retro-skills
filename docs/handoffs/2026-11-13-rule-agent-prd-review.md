# Session 交接：retro-skills → rule/agent 拉齐 PRD 三方评审（2026-11-13）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-13 15:31（Asia/Shanghai） |
| 项目根 | d:\Seed\retro-skills |
| HEAD | `e076908`；工作树：2 个未跟踪文档（PRD + 本交接文件） |
| 验证基线 | `npm run check`：语法检查通过 + node:test 779 / pass 777 / fail 0 / skipped 2 + `agents 18/18` + `baseline 19/19` + `tasks 5 rows 27 bad 0` + 末行 `check 全部通过`（15:31 实跑） |
| 继任自 | 无（本任务首份；上一任务收口见 `docs/handoffs/2026-11-13-ledger-script-fill-t8.md`） |
| 状态 | 可直开工；有 5 个开放问题（见「开放问题」节） |

## 项目定位

d:\Seed\retro-skills —— 把开发过程踩过的错沉淀成自动生效规范（rule / skill / agent 卡）的 Agent Skill 套件；本阶段在做「rule 与 agent 文档体系拉齐」的 PRD 评审。

## 现状

- 已完成：账本脚本填充 T0–T8 已收口并提交（HEAD 前序 `f43cdf8`）；根 README「定论」区、`measure-token-efficiency` / `reproduce-p2-eval` 复现脚本与守卫测试已提交（`890c857` / `e076908`）。
- 已完成：本任务 PRD 草案 v0.1 已落盘 `docs/prd/20261113160000-rule-agent-render-alignment.md`（未提交）。
- 验证证据：见元信息表「验证基线」（单源，勿重复）。
- 提交状态：PRD 由用户决定 commit；当前 HEAD 见元信息表。
- 工作树异常：无（仅 PRD 与本交接文件未跟踪）。

## 过程记录

- PRD：`docs/prd/20261113160000-rule-agent-render-alignment.md`（草案 v0.1，本次评审对象）
- 现状证据（agent 侧）：`tools/docgen/models/agents/render/index.mjs:11-31`、`tools/docgen/models/agents/types/base.mjs:69-119`、`tools/docgen/builders/agents/cli.mjs:51-160`
- 现状证据（rule 侧）：`tools/docgen/builders/rules/interpreters.mjs:8-29`、`tools/docgen/builders/rules/build.mjs:1-53`、`tools/docgen/builders/rules/schema.mjs:1-100`、`tools/docgen/models/rules/evidence-before-conclusion.json:1-38`、`tools/docgen/models/rules/rules.json:1-3`、`tools/docgen/builders/agents/components/baseline.mjs:10`
- rule 评分口径：`skills/rule-inspector/references/criteria.md:132-196`
- 基线命令出处：`docs/devworkflows/20261109211349-script-layer-refactor/migration-baseline.json:15`
- 历史交接词：`docs/handoffs/2026-11-13-ledger-script-fill-t8.md`（上一任务，已收口）

## 本次任务

对 PRD 做 **sdet + 产品 + 审计三方评审**，出问题卡、对账与裁决；流程：三席独立评审 → 合并去重 → 三方对账 → PRD 修订清单；起点：独立评审。评审只产出问题与裁决，不改代码、不改 PRD 正文（用户确认后再改）。

## 范围依据

- 要读：`docs/prd/20261113160000-rule-agent-render-alignment.md` 全篇，重点 §1（五个代差）、§2（F1–F6）、§3（非目标）、§6（验收）、§9（开放问题）。
- 要读：agent 渲染 `tools/docgen/models/agents/render/index.mjs:11-31` 与类型 `tools/docgen/models/agents/types/base.mjs:69-119`；rule 渲染 `tools/docgen/builders/rules/interpreters.mjs:8-29` 与 schema `tools/docgen/builders/rules/schema.mjs:1-100`。
- 要读：`tools/docgen/builders/agents/cli.mjs:51-160`（check / preview / apply / gate 语义）；`tools/docgen/models/rules/rules.json:1-3` 与 `tools/docgen/builders/agents/components/baseline.mjs:10`（当前 active rule 只有 1 条）。
- 要读：`skills/rule-inspector/references/criteria.md:132-196`（17 + X1–X3 + M1–M6 评分口径）。
- 勿重做：账本脚本填充 T0–T8（已提交，见 `f43cdf8`）；P2/P4 复现脚本与 README 定论（已提交，见 `890c857` / `e076908`）；不要重开这两条线。

## 开放问题

1. `rules.json` 之外的 4 个 rule 模型（import-guard / no-git-write / no-unverified-number / observable-criteria）是否激活、是否纳入本次拉齐范围？推断：先用 5 个 model 做渲染 golden，激活另立决策；依据 PRD §4/§9 与 `rules.json` 仅 1 条。请用户：确认或纠正（评审第一问）。
2. 共享 IR 落点用 `tools/docgen/render/`（新建）还是 `tools/docgen/builders/shared/`？推断：`tools/docgen/render/`，因为 models 与 builders 两侧都要消费；依据当前 `models/agents/render` 与 `builders/rules` 分居。请用户：确认或纠正（评审第一问）。
3. `builders/rules/*.md` 是历史投影还是仍有消费者？无消费者是否随迁移删除？推断：先 grep 消费者，再列为待删；依据 PRD §7 风险表。请用户：确认。
4. 注册唯一源：`rules.json` 与 `BASELINE_RULES` 是否合并为一处视图？推断：以 `rules.json` 为激活清单，`BASELINE_RULES` 由它派生；依据当前两者 1:1（1 条）但两处维护。请用户：确认。
5. rule 是否要做四维评估？推断：本 PRD 不做，另立协议；依据 PRD §3/§6.7 与 rule-inspector 现有 17+X/M 口径。请用户：确认或纠正。

## 既定约束（不要重新讨论）

- 共享投影层，不合并 AgentModel / RuleModel 领域 schema —— 出处：PRD §3。
- rule 质量硬门 = 通用 17 + X1–X3 + M1–M6，不是 agent 四维 —— 出处：PRD §3/§6.5、`criteria.md:132-196`。
- Phase 1 渲染逐字节不变，不在同一批改 rule 文案 —— 出处：PRD §3/§6.2。
- 不重开账本 T0–T8 与 P2/P4 复现 —— 出处：HEAD 前序提交与上一份 handoff。
- 三方评审只出问题卡与裁决，不改代码 —— 出处：本次用户指令。

## 遗留裁决与留观项

- rule 基线尚未取数：当前仓库没有 per-rule 的 rule-inspector 分数报告；PRD §6.1 要求实施前跑 `scs check rules` 冻结分数 —— 来源：PRD §6.1、`migration-baseline.json:15`；收敛时机：评审后、实施前。
- P4 原始样本不可恢复，P4 只能读报告聚合表 —— 来源：`docs/reports/2026-11-12-agent-model-p4-eval/README.md`；收敛时机：若评审要引用四维对比时。
- 账本试点基线 M=0（8 列重建夹具） —— 来源：`docs/handoffs/2026-11-13-ledger-script-fill-t8.md`；与本次 PRD 无直接关系，不列为评审输入。

## 开工前先做

1. 跑 `git --no-optional-locks status --porcelain`（应只剩 PRD 与本交接文件未跟踪）与 `git --no-optional-locks log -1 --oneline`（应为 `e076908`）。
2. 跑 `npm run check`，复核 `# tests 779 / # pass 777 / # fail 0 / # skipped 2`、`agents 18/18`、`baseline 19/19`、末行 `check 全部通过`。
3. 读 PRD 的 §1–§3、§6、§9，列出三席各自要挑战的判据。
4. 读 agent/rule 两侧渲染与 CLI 证据（见「过程记录」）。
5. 跑 `scs check rules --help`，如可用则跑 `scs check rules --root . --terms tools/docgen/models/rules/vocab/observable-terms.json --annotations tools/quality/.inspector-annotations.json` 取当前分数；不可用则记录错误，不阻塞评审。

## 开场话术

读 `docs/handoffs/2026-11-13-rule-agent-prd-review.md`，按交接词继续：对 rule/agent 拉齐 PRD 做 sdet + 产品 + 审计三方评审。
