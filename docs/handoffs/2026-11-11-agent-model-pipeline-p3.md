# Session 交接：agent 模型流水线 P3（建模 skill 化）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-11（Asia/Shanghai） |
| 项目根 | d:\Seed\retro-skills |
| HEAD | `ef1d4c7`（`fix(docgen): 引擎改迁 tools/agent-model，避开 docgen 口径计数面`） |
| 状态 | P3 完成，门禁全绿；等用户裁决是否进入 P4 |
| 继任自 | `docs/handoffs/2026-11-11-agent-model-pipeline-p2.md`（P2 报告 + 单席复测） |

## 本次任务

PRD §6 P3（行 190–218）：把「markdown 卡面 → 模型」拆解能力做成可复用 skill，产出草稿模型，不写正式仓；同时按用户裁定「彻底解决」把 P1 引擎迁出 `tmp/`。

## 现状

- 新增 `skills/agent-modeling/`：`SKILL.md`（七阶流程 + 触发/不触发 + 接口 + 硬约束）、`references/{grammar-gaps,checks,model-schema,permissions}.md`、`scripts/{verify,render}.mjs`（薄封装，import 引擎）。
- 引擎与 7 张模型迁至 `tools/agent-model/`（`models/` `types/` `render/` `verify-models.mjs`），`tmp/agent-criteria-demo/` 只留评测脚本与样本。
- 引擎新增导出 `verify(name, {modelPath, baseline})` 与 `anyError(r)`；`skillsRoot()` 改为向上找 `package.json`+`skills/`（副本目录也能解析）。
- 引用改齐 6 个文件：`render-all.mjs`、`diff-report.mjs`、`render-card.mjs`、`update-baseline.mjs`、`eval/raw/perf/render-bench.mjs`、`test-p1.test.mjs`（`--models` 参数 + 副本按仓内深度布置）。
- 顺带修复 P1 遗留：`rules/title-not-stronger-than-criterion.md` 未登记进 `BASELINE_RULES` 导致 gate 恒红（`tools/docgen/builders/agents/components/baseline.mjs:9` + `baseline.json`）。
- 登记与忽略：`skilldependencies/manifest.json` 增 `agent-modeling`、新增 `skilldependencies/agent-modeling.json`；`.gitignore` 增 `skills/agent-modeling/drafts/`。
- 文档：`docs/superpowers/specs/2026-11-11-agent-model-pipeline-p3-design.md`、`…-p3-design-testcase.md`（30 条，29 机器判）、`docs/superpowers/plans/2026-11-11-agent-model-pipeline-p3.md`；`docs/guide/skills/README.md` 增第 14 节。

## 验收证据（命令 + 首行）

| # | 命令 | 结果 |
|---|---|---|
| G1 | `node --test tmp/agent-criteria-demo/test-p1.test.mjs` | `ℹ pass 29` / `fail 0` |
| G2 | `node tools/agent-model/verify-models.mjs` | 7 行 `EQUIVALENT`，exit 0 |
| G3 | `node render-all.mjs && node diff-report.mjs`（tmp/agent-criteria-demo） | `sandbox/*.md` = 8 |
| G4 | `node skills/agent-modeling/scripts/verify.mjs skills/agent-modeling/drafts/reviewer-actuary-model.json --ref tools/agent-model/models/reviewer-actuary-model.json` | `reviewer-actuary  [ReviewerModel]  EQUIVALENT  REF_EQUIVALENT`，exit 0 |
| G4b | 同文件 `render.mjs` 后比对 `sandbox/reviewer-actuary.md` | `same=True` |
| G4c | 负例：`seat.tier=bogus` | `FAIL` + `TIER_MISMATCH model=bogus policy=readOnly`，exit 1 |
| G4d | 负例：`--ref` 指向 `reviewer-ai-model.json` | `REF_DIFF:…`，exit 1 |
| G5 | `npm run check` | 末行 `check 全部通过`，exit 0 |
| G6 | `scs check skills --root d:\Seed\retro-skills --manifest skilldependencies/manifest.json --json` | `{"findings": []}`，exit 0 |

## 迁移映射（新增/搬动）

| 旧 | 新 |
|---|---|
| `tmp/agent-criteria-demo/models/` | `tools/agent-model/models/` |
| `tmp/agent-criteria-demo/types/` | `tools/agent-model/types/` |
| `tmp/agent-criteria-demo/render/` | `tools/agent-model/render/` |
| `tmp/agent-criteria-demo/verify-models.mjs` | `tools/agent-model/verify-models.mjs` |
| — | `skills/agent-modeling/**`（新建） |

`git mv` 全部 R100（`verify-models.mjs` / `sections.mjs` 因改 import 深度为 R98/R97）。

## 开放问题

1. **P4 是否现在开始**：P3 验收是「1 张卡回放等价 + skill 体检通过」，已满足；11 席建模属 P4。
2. **历史文档路径**：P1/P2 的 spec/testcase 里仍写 `tmp/agent-criteria-demo/verify-models.mjs`，按「历史记录不改」保留；新入口以本文件与 P3 spec 为准。
3. **scope-sweep 依赖本机清单**：`npm run check` 的 R8 段要求 `.session/reviews/<批次>/impact-sheet.md` 不早于被扫文件；本批已生成 `2026-11-11-1941-agent-modeling-p3`，该目录不进 git。
4. **P2 遗留缺口未变**：任务时延未打点、token 无分词器复核。

## 下一步（P4 起点）

1. 读 PRD §6 P4（行 220–230）与 `skills/agent-modeling/SKILL.md`。
2. 逐席串行：skill 建模 → `verify.mjs` 全绿 → `render.mjs` 预览 → 与 `agents/<seat>.md` 段级 diff → 人工确认。
3. 18 席复评产出 `eval/report-round2.md`。
