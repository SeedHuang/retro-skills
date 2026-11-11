# P4 实施计划：零写席建模（首席 reviewer-product）

> spec：`docs/superpowers/specs/2026-11-11-agent-model-pipeline-p4-design.md`
> testcase：`docs/superpowers/specs/2026-11-11-agent-model-pipeline-p4-design-testcase.md`（18 条，16 机器判）
> 顺序：T1 代码面 → T2 共享层 → T3 模型 → T4 基线/名单 → T5 回归与对照 → T6 提交

## T1 代码面（4 个文件）

- `types/base.mjs`：`defaultLanding` 允许 `null`；新增可选 `modelType`（三已知类型名）。
- `render/index.mjs`：`typeOf` 先读 `modelType`。
- `render/sections.mjs`：duty 零写分支（`landingLabel`）、must 零写分支、outputs 空段返回 `[]`。
- `verify-models.mjs`：`issuesCard` 认 `modelType === ReviewerModel`；`modelType` 与特征推断结果合并。
- 门禁：`node --test tmp/agent-criteria-demo/test-p1.test.mjs` 29/29（7 席字节不变）。

## T2 共享层（只增不改）

- `models/_shared-model.json`：`perspectives` 增 `product`（产品视角）；4 条 `rules.must` + 4 条 `rules.never` 的 `appliesWhen` 追加 `reviewer-product`（**不含** `no-perfunctory-fix`）。
- 门禁：`node tools/agent-model/verify-models.mjs` 仍 7 行 `EQUIVALENT`。

## T3 reviewer-product 模型

- 以 `reviewer-actuary-model.json` 为骨架生成 `reviewer-product-model.json`：19 键按 spec §4 映射；`modelType: "ReviewerModel"`；`defaultLanding: null`；`templates/forms/outputs` 为空；7 条清单 + 7 键判据；`predicates.issue-without-solution` 本地定义。
- 门禁：`node -e` 展开后键齐全；`expand()` 不抛。

## T4 基线、名单、报告

- 生成 `models/_baseline/reviewer-product.json`（由 `expand` 首次落基线）。
- `verify-models.mjs` CLI 默认名单追加 `reviewer-product`。
- `diff-report.mjs` `SEATS` 追加该席；`test-p1.test.mjs` 的 7/8 计数改 8/9。
- 门禁：`node tools/agent-model/verify-models.mjs` → 8 行 `EQUIVALENT`。

## T5 渲染与段级对照

- `render-all.mjs` + `diff-report.mjs` → `sandbox/*.md` = 9；`sandbox/reviewer-product.md` 七段齐、无「写回 。」、边界句与现役卡逐字相等。
- 与 `agents/reviewer-product.md` 段级 diff：差异只剩已知 K1（多产出/权限段）与 K2（outputFormat 措辞派生）。
- 门禁：`npm run check` 末行 `check 全部通过`；`scs check skills` 0 findings。

## T6 提交

- 提交代码面 + 共享层 + 模型 + 基线 + 报告 + P4 spec/testcase/plan；停下等人工确认（PRD:227 的「人工确认」是本阶段出口）。

## 回滚

T1–T4 均可 `git revert`；新增模型/基线是纯新增，删除即回到 P3 末态。
