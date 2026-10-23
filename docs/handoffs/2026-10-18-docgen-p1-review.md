# Session 交接：retro-skills → Docgen P1 五席评审（2026-10-18）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-18 21:45（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `202252a`；工作树：未提交（见下文「现状」） |
| 验证基线 | `npm run check` 全通过：0 findings / 183 文件 / 542 表 / exit 0（21:45 实跑）；仓库无 typecheck / build / unit / e2e 分项命令 |
| 继任自 | `docs/handoffs/2026-10-17-systematic-repair-mvp-spike.md` |
| 状态 | 有 2 个开放问题（均不阻塞开评，见「开放问题」节） |

## 项目定位

`d:\Seed\retro-skills` —— AI 规则 / 技能 / 智能体体系仓库；本 session 在做 Docgen（文档即组件）的 PRD 拆分与评审，当前工作件是 P1「一条 rule 的整文件生成」。

## 现状

- 已完成：
  - PRD v1/v2 两轮议会评审（105 卡 / 11 个 P0 族；127 卡 / 10 个新 P0 族，均不通过），账本在 `.session/reviews/2026-10-18-1653-prd-doc-as-component/`（`progress.md`、`problems.md`、`problems-2.md`、`cards.md`）。
  - 结论：停止“整份 PRD 反复改文字”，改为按完整功能拆 PRD；v2 的 387 行整份重写被判“未收敛”。
  - 现有 PRD 只有两份：`docs/prd/docgen-index.md`（共享决策 D1–D18 + 状态 + 评审规则）、`docs/prd/docgen-rule-whole-file.md`（P1，待评审）。
  - 旧的 `docs/prd/doc-as-component.md`（v3，223 行）与两份未批准的 spike 草稿（`docs/superpowers/specs/2026-10-18-docgen-spike-design.md`、`...-testcase.md`）已删除；它们从未被 git 跟踪（当时 `git status` 显示 `?? docs/prd/`），删除后无 git 历史可考古。
  - 已落地规则/技能：`rules/spec-testcase-gate.md`（spec 必带独立 testcase）；`agents/senior-sdet.md`（测试设计者，已 `aas sync` 到用户级）；`rules/docs-convention.md` 增加 `docs/prd/` 与审查账归档；`skills/review-log/SKILL.md` 改为“处置完归档不删”。
  - 清理：`.session/temp/` 已清空（删 7 个临时文件）；三份旧分析迁到 `docs/after/20261017210609-pending-work-overview.md`、`docs/after/20261012222428-review-loop-log-gap-analysis.md`、`docs/reports/2026-10-10-config-layering-review-accounting.md`。
  - testcase 命名已收敛到 `spec-testcase-gate` 规则判据 1（SKILL / 模板 / conventions / senior-sdet 全部改为引用，不再各写一份）。
- 验证证据：见元信息表「验证基线」（单源，勿重复）。
- 提交状态：全部未提交，由用户自行决定提交方式。
- 工作树异常（`git status --short` 实查）：
  - 已修改：`docs/superpowers/specs/2026-10-17-systematic-repair-design.md`、`rules/docs-convention.md`、`skills/managing-lessons-store/scripts/lessons.test.mjs`、`skills/prd-to-specs/SKILL.md`、`skills/prd-to-specs/assets/spec-template.md`、`skills/prd-to-specs/references/conventions.md`、`skills/review-log/SKILL.md`
  - 未跟踪：`agents/senior-sdet.md`、`docs/after/20261017210609-pending-work-overview.md`、`docs/after/20261012222428-review-loop-log-gap-analysis.md`、`docs/handoffs/2026-10-17-systematic-repair-mvp-spike.md`、`docs/prd/`、`docs/reports/2026-10-10-config-layering-review-accounting.md`、`docs/reports/2026-10-18-1-repair-non-convergence/`、`docs/superpowers/retro/`、`rules/spec-testcase-gate.md`、`skills/prd-to-specs/assets/testcase-template.md`

## 过程记录

- `.session/reviews/2026-10-18-1653-prd-doc-as-component/progress.md`（先读尾部：第 2 轮结果、元发现、下一步建议）
- `.session/reviews/2026-10-18-1653-prd-doc-as-component/problems.md`（第 1 轮 30 族 + 用户裁定）
- `.session/reviews/2026-10-18-1653-prd-doc-as-component/problems-2.md`（第 2 轮去重后的 10 个 P0 族 + 12 P1 + 8 P2）
- `.session/reviews/2026-10-18-1653-prd-doc-as-component/cards.md`（第 1 轮卡片）
- `docs/reports/2026-10-18-1-repair-non-convergence/problems.md`（六轮 256 卡 / 7 个 P0 的原始分账，PRD 数据源）
- `docs/superpowers/retro/2026-10-18-1653-prd-doc-as-component/retro-01-ledger-compression.md`（已归档复盘）
- 历史交接词：`docs/handoffs/2026-10-17-systematic-repair-mvp-spike.md` → 本文件

## 本次任务

开 **5 席正式评审**，只审 `docs/prd/docgen-rule-whole-file.md`（P1）+ `docs/prd/docgen-index.md`（索引）；名单 = 读者、审计、产品、后端、测试 + 侦探（用户 2026-10-18 已确认）。每席只回 **PASS / FAIL + 最多 5 个必须修项**，禁止铺开成百张卡；汇总后判 P1 能否定稿。

流程：读索引 + P1 → 5 席评审（并行）→ 汇总去重 → 若 FAIL 只修 P1 → 若 PASS 从 P1 拆 spec + 由 `senior-sdet` 独立写 testcase → spec 评审 → plan → 施工 V1–V5；起点：5 席评审。

## 范围依据

- 要读：
  - `docs/prd/docgen-index.md` §1（PRD 清单）、§2（D1–D18）、§4（评审规则）、§5（全局不做）
  - `docs/prd/docgen-rule-whole-file.md` §2（范围）、§3（本份决策）、§4（接口）、§5（错误码）、§6（V1–V5）、§8（退出与停损）
  - `.session/reviews/2026-10-18-1653-prd-doc-as-component/problems-2.md` §一（10 个 P0 族，确认 P1 是否已避开）
  - `docs/reports/2026-10-18-1-repair-non-convergence/problems.md` §一（六轮数据，只作背景，不再重审 PRD）
- 勿重做：
  - `docs/prd/doc-as-component.md` 已删除，不要再恢复或重写 v4
  - 两份 spike 草稿已删除，不要在 P1 通过前重建
  - v1/v2 的 232 张卡不再重审；只把 `problems-2.md` 的 10 个 P0 族当“已知雷区”核对
  - 不重新讨论 spec 片段（D18 已定：v1 不做）

## 开放问题

1. P1 的 spike 代码落点 `tools/docgen-spike/` 在 P1 通过后保留还是并入 `tools/docgen/`；推断：P1 用 spike 目录，P2 重写时并入正式目录（依据 `docgen-rule-whole-file.md` §7 注）；请用户：确认 / 纠正。
2. 5 席评审的产出是否要落盘到 `.session/reviews/<新目录>/`；推断：要，按 `review-log` 建目录，评审完归档（依据 `docs/prd/docgen-index.md` §4 第 4 条）；请用户：确认 / 纠正。

## 既定约束（不要重新讨论、不要重新选型）

- 只做整文件生成，不做 spec 片段 / region —— `docs/prd/docgen-index.md` D18 + §5 N2
- 一次只审一份 PRD + 索引；已通过且依赖未变的不重审 —— `docgen-index.md` §4
- 首战靶子 = `spec-testcase-gate` 整文件 —— `docgen-index.md` D12
- 规则类型 = 适用方式 × 极性（条件触发 × 义务）—— `docgen-rule-whole-file.md` P1-1；`rule-inspector` 判据
- 入口基线 = 冻结 `rules/*.md` 21 条；不引入 manifest —— `docgen-rule-whole-file.md` P1-2
- 生成物禁手改；叙述改组件源 —— `docgen-index.md` D6 / P1 §2
- testcase 由 `senior-sdet` 独立写，spec 必须外链 —— `rules/spec-testcase-gate.md` 判据 1–5
- 禁止主动执行 git 写操作；提交由用户决定 —— 用户全局规则

## 遗留裁决与留观项

- 第 2 轮 10 个 P0 族（G01 片段模型、G02 入口绕过、G03 规则类型、G04 出处、G05 依赖图、G06 gen-agents、G07 C2、G08 testcase、G09 停损、G10 manifest 手写）——来源：`problems-2.md` §一；P1 已收治 G01/G02/G03/G10（范围裁剪 + 基线 + 3×2 + 去 manifest），其余随 P2/P3 收敛。
- 2026-10-17 systematic-repair spec 审查已“停止打补丁”，等待独立复核；不要在本 session 重开 —— 来源：`.session/reviews/2026-10-17-2151-systematic-repair-spec/progress.md` L29–40。
- `.session/reviews/2026-10-17-2151-systematic-repair-spec/` 仍未归档；收敛时机：该审查全部处置完，按 `docs-convention.md` 迁 `docs/superpowers/reviews/`。

## 开工前先做

1. `git status --short` 与 `npm run check`，确认仍是 0 findings / 183 文件 / 542 表；工作树未提交属正常，不要 commit。
2. 读 `docs/prd/docgen-index.md` 全文 + `docs/prd/docgen-rule-whole-file.md` 全文。
3. 读 `.session/reviews/2026-10-18-1653-prd-doc-as-component/problems-2.md` §一，列出 P1 应避开的 10 个 P0 雷区。
4. 按名单开 5 席评审（读者、审计、产品、后端、测试 + 侦探），每席只回 PASS/FAIL + 最多 5 个必须修项；评审记录落 `.session/reviews/<YYYY-MM-DD-HHMM>-docgen-p1/`。
5. 汇总：P0 = 0 且必须修项 ≤ 5 → PASS；否则只改 `docgen-rule-whole-file.md`（必要时同步索引），不重写整份体系。

## 开场话术

读 `docs/handoffs/2026-10-18-docgen-p1-review.md`，按交接词继续：开 5 席评审 P1（docgen-rule-whole-file）与索引。
