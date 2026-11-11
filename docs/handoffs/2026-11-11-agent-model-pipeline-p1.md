# Session 交接：retro-skills → agent 模型流水线 P1 渲染隔离产物（2026-11-11）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-11-11 15:05（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `89c079735533d8c375df93065415008957f8678a`（2026-11-10 10:41:17 +0800）；工作树：4 个已改文件 + 2 个未跟踪文件（见「现状」） |
| 验证基线 | demo：`verify-models.mjs` 7/7 `EQUIVALENT`、`types/index.mjs` 7/7 `OK`、连跑两次渲染字节差 0（15:02–15:05 实跑）；现役：`policy-pure-source.test.mjs` 65/71（6 红）、`tool-tiers.test.mjs` 38/47（9 红），15 红均为改动前既有（15:03–15:04 实跑） |
| 继任自 | 无 |
| 状态 | 可直开工（5 个开放问题已给推断，见「开放问题」节） |

## 项目定位

`d:\Seed\retro-skills` —— agent 角色卡 / rule / skill 的建模与文档生成仓；本次工作把 agent 卡改为「模型 JSON → 确定性渲染 → 卡面 markdown」，并最终替换现役 `cardPipeline`。

## 现状

- 已完成：
  1. 研究期 7 张卡抽成模型（`tmp/agent-criteria-demo/models/`），`extends` + `appliesWhen` + 浅合并，展开后与瘦身前等价
  2. 类型体系 `tmp/agent-criteria-demo/types/{base,derived,index}.mjs`（Base / Reviewer / Auditor / Respondent），判别按产出的 artifact id
  3. 渲染器 `tmp/agent-criteria-demo/render/sections.mjs`（9 段）+ `render/index.mjs`（按类型装配）+ `render-all.mjs`（批量 7 张）
  4. 校验器 `tmp/agent-criteria-demo/verify-models.mjs`，本轮新增 `WRITE_SCOPE_MISMATCH` / `OUTPUT_UNWRITABLE` / `ISSUE_RULE_ON_NON_ISSUER`
  5. A2 修复：目标为 `issue.card.*` 的共享 never 收窄到真出问题卡的席（`reviewer-actuary` / `reviewer-ai`）
  6. A3 修复（动了现役）：`policy/definitions/artifacts.mjs` 补 `evidence.md` / `defense.md` / `issue-card.md`；`policy/seat-policy.mjs` 5 席补可写清单；`policy/definitions/seats.mjs` 登记 `evidence-reader` / `reviewer-actuary` / `reviewer-ai`；`POLICY_DIFF` 清零
  7. PRD：`docs/prd/20261111145723-agent-model-pipeline.md`（五阶段 + 四维评估协议 + 9 项作废材料清单）
- 验证证据：见元信息表「验证基线」（单源，此处不重复）
- 提交状态：未提交，由用户自行 commit
- 工作树异常：无字节级异常。未提交项：
  - 改：`tools/docgen/builders/agents/policy/definitions/artifacts.mjs`
  - 改：`tools/docgen/builders/agents/policy/definitions/seats.mjs`
  - 改：`tools/docgen/builders/agents/policy/seat-policy.mjs`
  - 改：`tools/docgen/builders/agents/test/policy-pure-source.test.mjs`
  - 新增：`docs/prd/20261111145723-agent-model-pipeline.md`
  - 新增：`rules/title-not-stronger-than-criterion.md`

## 过程记录

- `tmp/agent-criteria-demo/open-issues.md`（先读尾部；A2/A3 已改「已修」，B2/C4/C5 仍开）
- `tmp/agent-criteria-demo/result.md`（先读 §8；§3 / §5 / §6 与 §10.1 规则 1–3 已作废）
- `tmp/agent-criteria-demo/interpreter-design.md`（规则 1–43，:98-117；开头状态行「仅 reviewer-audit 跑通」已过时）
- `tmp/agent-criteria-demo/modeling-methodology.md`（七阶 + 12 条从属原则 + 字段类型矩阵）
- `tmp/agent-criteria-demo/types.md`（§3 判别按 artifact id；§1 表首句「判别依据是记录集合」是笔误，勿引用）
- `tmp/agent-criteria-demo/deletions.md`（D/S/C/P 四类；P 类根因已定为 `SHARED_USE` 全量继承）
- `docs/prd/20261111145723-agent-model-pipeline.md`（本次依据；§3.4 列全部作废材料）
- 历史交接词：无

## 本次任务

按 PRD §6 的 P1，把 7 张模型渲染成「可替换现役卡」的完整卡面，落在 `tmp/agent-criteria-demo/sandbox/`，`agents/` 零改动；流程：`PRD §9 五问确认 → 补 4 个渲染缺口 → 渲染 sandbox → 出差异报告 → 用户确认`；起点：五问确认。

## 范围依据

- 要读：
  - `docs/prd/20261111145723-agent-model-pipeline.md` §6「P1」（4 个缺口表）、§9（待确认 5 问）、§7（四维评估协议，P2 才用）
  - `tmp/agent-criteria-demo/interpreter-design.md` 规则 26–43（行 98–117）
  - `tmp/agent-criteria-demo/render/sections.mjs`（9 个段函数；行 92 `tools` 取自现役策略、行 201 越界编号写死 `1.`）
  - `tmp/agent-criteria-demo/render/index.mjs`（`TYPE_SECTIONS` 段表，行 7–11；无 `outputFormat` 段）
  - `tmp/agent-criteria-demo/models/_shared-model.json`（`rules.{must,never}[].appliesWhen`）
  - `agents/detective-observer.md` 的「## 边界」段（15 槽现役形态；D9 要求逐字对齐）
  - `tools/docgen/builders/agents/policy/definitions/tiers.mjs`（四档工具集，Q3 要引）
- 勿重做：
  - `tmp/agent-criteria-demo/models/` 7 张 + `models/_baseline/`（已 7/7 等价；改模型后须跑 `update-baseline.mjs`）
  - `tmp/agent-criteria-demo/types/*.mjs`（7/7 判别通过）
  - `tmp/agent-criteria-demo/verify-models.mjs` 已有校验码（`WRITE_SCOPE_MISMATCH` / `OUTPUT_UNWRITABLE` / `ISSUE_RULE_ON_NON_ISSUER` / `TYPE_*` / `POLICY_DIFF`）
  - 现役 policy 三文件的本轮改动（`artifacts.mjs` / `seats.mjs` / `seat-policy.mjs`）

## 开放问题

1. 新产物是否保留现役「## 边界」15 槽段？；推断：A 保留（依据：`tool-tiers.test.mjs` 的 `MARKS` 含「整档授予 / 平台无参数级授权 / 不裁决他人分歧 / 无中断评审」，现役 7 处测试钉住该段，重写成本高于复用）；请用户：确认 / 纠正。**开工第一问**
2. `outputFormat` 段补渲染还是把配置删掉？；推断：A 补渲染（依据：6 张模型配了 `outputFormat`，`output/` 下「## 输出格式」0 处）；请用户：确认 / 纠正
3. `tools` 放 `seat.tier` 还是 `seat.capabilities`？；推断：A `seat.tier`（依据：`tiers.mjs` 已是四档单一来源，现役 `tierBySeat` 由它派生）；请用户：确认 / 纠正
4. P5 切换前是否必须先清 6 + 9 个既有红测试？；推断：A 必须先清（依据：gate 判定依赖绿基线，红着切无法证明「切换成功」）；请用户：确认 / 纠正
5. 评估 fixture 由谁写？；推断：A 我写、你审（依据：PRD §7.2 已定义 3 件 fixture 形态）；请用户：确认 / 纠正

## 既定约束（不要重新讨论、不要重新选型）

- P1–P4 不得写 `agents/*.md` —— `docs/prd/20261111145723-agent-model-pipeline.md` 页首硬纪律
- P1 不得改 `tools/docgen/**` —— 同 PRD §6 P1「边界」
- 类型判别按产出的 artifact id，不按字段存在性 / records —— `tmp/agent-criteria-demo/types.md:127`
- 共享规则按 `appliesWhen` 按席过滤，不得全量继承 —— PRD D3；根因 `tools/docgen/builders/agents/card-model/vocab/shared-actions.mjs:88-102`
- 判定方必须具名（`本席` / 命令原文 / `抽检：{who}`），不写「机判 / 半机判」 —— `interpreter-design.md` 规则 32
- 标题不得强于判据 —— `rules/title-not-stronger-than-criterion.md`（未跟踪）
- `evidence-reader` / `respondent-architect` / `respondent-dev` 不补 `interrupt` —— `open-issues.md` D8（源卡约束行无此禁令）
- 权限只表达一处：`permissions.{action,write,command}` —— PRD D4
- 写权限白名单 = `seat.artifacts` —— PRD D5；校验码 `WRITE_SCOPE_MISMATCH`

## 遗留裁决与留观项

- 现役 `SHARED_USE` 仍全席 `ALL_SHARED`，`agents/*.md` 里取证/侦探/审计席仍背问题卡条款 —— 来源：`open-issues.md` B2；收敛时机：P5（须回填 18 张卡）
- 判据求值器未写、单元测试未写 —— 来源：`open-issues.md` C4 / C5；收敛时机：P5 前置门
- 方法论抽成 skill —— 来源：`open-issues.md` A4；收敛时机：P3

## 开工前先做

1. `git status --short` 确认工作树仍是「4 改 + 2 未跟踪」；若用户已提交，把新 HEAD 记入本文件元信息表
2. `cd tmp/agent-criteria-demo && node verify-models.mjs`，确认 7 行 `EQUIVALENT`
3. 读 `docs/prd/20261111145723-agent-model-pipeline.md` §9，把 5 个问题的答案写回 PRD 并把状态改为「已定」
4. 读 `agents/detective-observer.md` 的「## 边界」段（约从该标题起 12 行），确认 15 槽形态与 D9 的对齐口径
5. 建 `tmp/agent-criteria-demo/sandbox/`，跑一次 `node render-all.mjs`，确认产物仍是 7 个、行数分别为 60 / 56 / 46 / 45 / 58 / 61 / 65

## 开场话术

读 `docs/handoffs/2026-11-11-agent-model-pipeline-p1.md`，按交接词继续：agent 模型流水线 P1（渲染隔离产物）。注意：先回答「开放问题」5 条，其中第 1 条（是否保留边界 15 槽）是开工第一问。
