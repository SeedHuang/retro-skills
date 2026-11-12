# Session 交接：agent 模型流水线 → P5 切换与清理（2026-11-12）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-12 11:16（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `fa67454e54833bfb8f635649388a94212aafcfb4`（`fa67454` P4 收口：8 席对象与视角对齐现役卡）；工作树：clean（11:13 `git status --short` 空） |
| 验证基线 | 无 typecheck/build（纯 Node 脚本仓）；`npm run check` exit 0（11:14 实跑）：`# pass 1341` / `# fail 0` / `# skipped 7`；docgen gate `baseline 20/20`；A 组 18 席；`check-tristate-header: seats 18 / ok 18 / bad 0`；`check-trigger-kind: ... / bad 0`；`node tools/agent-model/verify-models.mjs` 18 行全 `EQUIVALENT`、exit 0（11:13 实跑） |
| 继任自 | `docs/handoffs/2026-11-11-agent-model-pipeline-p3.md`（P4 无独立 handoff：`Get-ChildItem docs/handoffs/*p4*` 无结果，11:14 实查） |
| 状态 | 有 2 个开放问题（见「开放问题」节，均为开工第一问） |

## 项目定位

`d:\Seed\retro-skills` —— 把 18 张 agent 角色卡从「旧模板装配」迁到「模型 JSON →（`tools/agent-model`）确定性渲染」的仓库；P1–P4 已完成建模与复评，P5 负责一次性切换并清掉旧链。

## 现状

- 已完成 P1–P4：
  - 18 席模型 + 共享层 + 渲染基线在 `tools/agent-model/models/*-model.json`、`tools/agent-model/models/_shared-model.json`、`tools/agent-model/models/_baseline/*.json`。
  - 沙箱产物 `tmp/agent-criteria-demo/sandbox/<seat>.md` 共 18 份，2026-11-12 11:13 由 `node tmp/agent-criteria-demo/render-all.mjs` 重出（输出 18 行、exit 0）。
  - 现役 `agents/*.md` 仍由旧链渲染：入口 `tools/docgen/builders/agents/components/cardPipeline.mjs:102-135`（`buildCards` / `renderSeat`）、`:165-190`（`expectedDocs` / `renderAll`）。
- 沙箱 vs 现役：18 席 SHA256 全部 DIFF（11:13 逐席 `Get-FileHash` 比对）；差异不止措辞，含段落结构（新产物多 `权限` 段、`一定会` 改 bullet 形态）。
- 验证证据：见元信息表「验证基线」（单源，勿重复）。
- 提交状态：无未提交改动；本 session 未产生代码改动（仅按现有模型重出了 tmp 沙箱）。
- 工作树异常：`tmp/agent-criteria-demo/sandbox/diff-report.md` 曾被 `render-all.mjs:17-18` 的「清空 outDir 下 *.md」删掉（该文件已 tracked）；已 `git checkout -- tmp/agent-criteria-demo/sandbox/diff-report.md` 还原，现工作树 clean。

## 过程记录

- PRD：`docs/prd/20261111145723-agent-model-pipeline.md`（§6 P5 行 242–267；§7 四维评估协议行 268 起；抬头硬纪律行 5）
- P4 技术设计：`docs/superpowers/specs/2026-11-11-agent-model-pipeline-p4-design.md`（§2 D6/D6a/D6b 行 23–26；§3 schema 改动清单行 28–41；§5 验收 G1–G8 行 62–73）
- P1 技术设计：`docs/superpowers/specs/2026-11-11-agent-model-pipeline-p1-design.md`（S2 `boundary.kind` 取法行 67）
- 历史交接链：`docs/handoffs/2026-11-11-agent-model-pipeline-p1.md` → `…-p2.md` → `…-p3.md`（P4 无文件）
- 评测报告（均在 tmp，**P5 清理前须决定去留**）：`tmp/agent-criteria-demo/eval/report.md`（tracked）、`report-p2-v2.md`（tracked）、`report-round2.md`（**untracked**）、`eval/raw/**`（11:14 `git ls-files tmp/agent-criteria-demo | Measure-Object -Line` = 286 个 tracked 文件）
- 建模 skill：`skills/agent-modeling/SKILL.md` + `references/` + `scripts/{verify,render}.mjs`

## 本次任务

P5 切换与清理（PRD §6 P5，行 242–267）；流程：① 补描述缺口 → ② 模型数据源适配层 → ③ gate/CLI 收口 → ④ 18 卡重出 → ⑤ 旧链模块与专属测试退场 → ⑥ 守卫脚本改新基线 → ⑦ 文档收口 → ⑧ 清理 tmp；起点：环节①。

## 范围依据

- 要读：
  - `docs/prd/20261111145723-agent-model-pipeline.md` §6 P5 行 242–267（替换面 8 条 + 验收 4 条）
  - `docs/superpowers/specs/2026-11-11-agent-model-pipeline-p4-design.md:26`（D6b：边界派生单源）
  - `tools/docgen/builders/agents/components/cardPipeline.mjs:102-135`、`:165-190`
  - `tools/docgen/builders/agents/cli.mjs:115-197`（`collectGate`）、`:238-242`（`cmdGate`）
  - `tools/docgen/builders/agents/components/{renderByName.mjs:18-29, agentData.mjs:4-9, seatLoader.mjs:70-131, renderCard.mjs:103-139}`
  - `tools/docgen/builders/agents/check-tristate-header.mjs:9-27`、`check-trigger-kind.mjs:13-37`
  - `scripts/check-all.mjs:161-179`（docgen gate 段）、`:235-241`（A 组）、`:253-265`（S-C 两守卫）
  - `tools/agent-model/render/index.mjs:22-31`、`tools/agent-model/render/sections.mjs`、`tools/agent-model/verify-models.mjs:253-268`
- 勿重做：
  - 边界派生单源：`tools/docgen/builders/agents/components/patternRegistry.mjs:33-40` 已按 `capabilities` 含 `write` 派生 `boundaryBySeat`，席 JSON 已无 `boundary`（commit `6516faa` / `c59bf88`）
  - S3 权限叙述单源：`tools/docgen/builders/agents/policy/definitions/constraints.mjs` + `seatLoader.mjs:106-118` 派生 `duty.constraint`
  - P1–P4 模型与基线：18 席 verify 全 `EQUIVALENT`（11:13 实跑）

## 开放问题

1. **`docs/agents/**` 人读投影怎么处理**；推断：随旧链删除（`components/renderReadme.mjs:7-31` 依赖旧卡的 `role` / `dimension` / `outputKind` / `rationale`，模型无对应字段，无法忠实重建；该目录现有 19 份文件 = 18 席 + `README.md`）；请用户：确认 / 纠正。**开工第一问**。
2. **旧卡管线专属测试怎么处理**；推断：删除只测退役模块的用例，另按 PRD 面 6 补模型/渲染/校验单测；依据：`tools/docgen/builders/agents/test/card-render.test.mjs` 共 1300+ 行，全部 import `cardPipeline` 的 `buildCards` / `renderSeat` / `renderCard`，模块退场后无被测对象；同形态还有 `sc-card-shape` / `sa-data-layer` / `sb-contract-layer` / `s2-card-rewrite` / `s3-predicates` / `sdet-*` / `pilot-*`；请用户：确认 / 纠正。**开工第一问**。

## 既定约束（不要重新讨论、不要重新选型）

- 除 P5 切换阶段外不得写 `agents/*.md` —— `docs/prd/20261111145723-agent-model-pipeline.md:5`
- 切换只做一次，不做半量替换 —— PRD §5 D12
- 模型是唯一真相，markdown 是视图 —— PRD §5 D1
- 共享规则按 `appliesWhen` 按席过滤，不按全席继承 —— PRD §5 D3
- 权限只写一处 `permissions.{action,write,command}` —— PRD §5 D4
- 不重定义 `pathGroups` / `commandGroups` / `capabilities` 的内容 —— PRD §2 非目标
- 提交规范：中文标题 + 一两句 why；PowerShell 无 heredoc，路径逐条列 —— `git log -5` 既有提交形态
- `tmp/` 下部分文件被 `git add -f` 跟踪；`S4-TC-J02` 会把含 `tmp` 的脏路径判红，改 tmp 须同批提交 —— `tools/docgen/builders/agents/test/card-render.test.mjs:244-247`

## 遗留裁决与留观项

- `senior-sdet` / `speaker` 描述缺口：沙箱缺「当」前缀，`senior-sdet` 另缺「；不用于：…（那走 reviewer-qa）」—— 来源：11:13 逐席 description 行比对；收敛时机：P5 环节①（改 `tools/agent-model/models/_shared-model.json:1499-1500` 两处 `triggerPhrases`；`senior-sdet` 的「不用于」需进 `tools/agent-model/models/senior-sdet-model.json:14-16` 的 `seat.description.template`）
- P2 遗留：任务时延未打点、token 无分词器复核 —— 来源：`docs/handoffs/2026-11-11-agent-model-pipeline-p3.md` 开放问题 4；收敛时机：暂不收敛
- P4 复评报告 `tmp/agent-criteria-demo/eval/report-round2.md` 未入库 —— 来源：11:14 `git ls-files --error-unmatch` 判 UNTRACKED；收敛时机：P5 清理 tmp 前先迁 `docs/superpowers/reviews/`
- `render-all.mjs` 会删除 outDir 下所有 `*.md`（含 tracked 的 `sandbox/diff-report.md`）—— 来源：`tmp/agent-criteria-demo/render-all.mjs:17-18` + 本次实测；收敛时机：P5 清理 tmp 时整体删除，不再单独跑

## 开工前先做

1. `git status --short` + `git log -1` 确认工作树干净；跑 `npm run check` 复核末行 `check 全部通过`（约 55s）
2. 读 PRD §6 P5（行 242–267）与 P4 设计 §2 D6b（行 26）
3. 读 `tools/docgen/builders/agents/components/cardPipeline.mjs` 全文 + `cli.mjs:110-200`，列出「改哪几处」清单
4. 核对 `tmp/agent-criteria-demo/sandbox/*.md` 18 份与 `tools/agent-model/models/*-model.json` 的对应关系（`git ls-files tmp/agent-criteria-demo | Measure-Object -Line` 应为 286）
5. 先回答「开放问题」1/2，再动代码

## 开场话术

读 `docs/handoffs/2026-11-12-agent-model-pipeline-p5.md`，按交接词继续：agent 模型流水线 P5（切换与清理）。
