# P3 实施计划：建模 skill 化（agent-modeling）

> spec：`docs/superpowers/specs/2026-11-11-agent-model-pipeline-p3-design.md`
> testcase：`docs/superpowers/specs/2026-11-11-agent-model-pipeline-p3-design-testcase.md`（29 条，28 机器判）
> 施工顺序：T1 → T2 → T3 → T4 → T5 → T6；每步跑该步门禁，红则停在本步。

## T1 迁移引擎与模型（`git mv`，内容零改动）

- `tmp/agent-criteria-demo/{models,types,render,verify-models.mjs}` → `tools/agent-model/`
- 改 import 深度：
  - `agent-model/render/sections.mjs`：`../../../tools/docgen/builders/agents/components/*` → `../../docgen/builders/agents/components/*`
  - `agent-model/verify-models.mjs`：`../../tools/docgen/builders/agents/policy/*` → `../agents/policy/*`
- 改 `verify-models.mjs:172` 的 skills 查找：由固定 2 级上跳改为「向上找含 `package.json` + `skills/` 的仓根」（临时副本也能解析），保留 `MODEL_SKILLS_ROOT` 环境变量覆盖。
- 门禁：`node --check` 全部迁移文件；`cd tools/agent-model && node verify-models.mjs` → 7 行 EQUIVALENT。

## T2 更新依赖方（5 个脚本 + 1 个测试）

| 文件 | 改动 |
|---|---|
| `tmp/agent-criteria-demo/render-all.mjs` | `renderModel` import 与 `models/` 指向新位置 |
| `tmp/agent-criteria-demo/diff-report.mjs` | `expand` / `typeOf` / `models/` 指向新位置 |
| `tmp/agent-criteria-demo/render-card.mjs` | 同上（testcase 指出被漏掉） |
| `tmp/agent-criteria-demo/update-baseline.mjs` | 同上（被漏掉） |
| `tmp/agent-criteria-demo/eval/raw/perf/render-bench.mjs` | 同上（被漏掉） |
| `tmp/agent-criteria-demo/test-p1.test.mjs` | `MODEL_ROOT` / `ENGINE` 常量；`copyCase` 复制新 builder 目录；`run()` 传 `MODEL_SKILLS_ROOT` |

- 门禁：`node --test test-p1.test.mjs` → 29/29；`render-all.mjs && diff-report.mjs` → `sandbox/*.md` = 8。

## T3 引擎导出（唯一语义改动）

- `verify(name, opts = { modelPath, baseline })`：`modelPath` 覆盖单模型路径；`baseline:false` 跳过 `_baseline` 比对（草稿无基线）。
- 导出 `anyError(r)`。
- CLI 行为不变：7 行、exit 0/1 同 P1。
- 门禁：`node verify-models.mjs` 7 行 EQUIVALENT；单测 29/29（含 TC-044 退出码）。

## T4 建 skill

- `skills/agent-modeling/SKILL.md`：七阶流程表、触发/不触发、与两个脚本的接口、只写 `drafts/` 的硬约束、references 指针（每条写成「按 X 执行 → 产出 Y」）。
- `references/`：`grammar-gaps.md`、`checks.md`、`model-schema.md`、`permissions.md`（素材来自 `tmp/agent-criteria-demo/modeling-methodology.md` 与 `verify-models.mjs` 的码表）。
- `scripts/verify.mjs` / `scripts/render.mjs`：薄封装，import 引擎；CLI 语义按 spec §5。
- 登记：`skilldependencies/manifest.json` + 新建 `skilldependencies/agent-modeling.json`。
- 根 `.gitignore` 加 `skills/agent-modeling/drafts/`。
- 门禁：`scs check skills` → `{"findings":[]}`；`npm run check` → 末行 `check 全部通过`。

## T5 回放 reviewer-actuary

- 复制现模型到 `drafts/reviewer-actuary-model.json`。
- `verify.mjs --ref` → `REF_EQUIVALENT`，exit 0。
- `render.mjs` → `drafts/reviewer-actuary.md`，与 `sandbox/reviewer-actuary.md` 同 sha。
- 负例：tier 改 `bogus` → exit 1 且含 `TIER_MISMATCH`；`--ref` 指向别的模型 → `REF_DIFF`。

## T6 收口

- 跑 testcase 的 G1–G6 全量门禁，把输出首行抄进 `docs/handoffs/2026-11-11-agent-model-pipeline-p3.md`。
- `npm run doc:name -- --check docs`（新增文档命名合规）。
- 提交（含 spec / testcase / plan / skill / 迁移 / 引用改写）；停下等裁决，不进 P4。

## 回滚

T1 是纯 `git mv` + 路径改写：`git revert` 单提交即可；无数据变更。
