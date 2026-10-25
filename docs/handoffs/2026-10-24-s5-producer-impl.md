# Session 交接：retro-skills → S5 工具档位 `producer` 施工（T1 起）（2026-10-24）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-24 22:06（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `b039474`；工作树：2 处未提交修改 —— `docs/superpowers/plans/2026-10-25-s5-tool-tiers.md`（M）、`skills/dev-workflow/references/stage-2b-plan-gate.md`（M） |
| 验证基线 | `npm run check` → tests **608** / pass **606** / fail **0** / skipped **2**；`baseline 37/37`；`0 findings`；`④ markdown 264 文件 / 1063 表`；`⑤ .session 结构通过`；`check 全部通过`（22:06 实跑） |
| 继任自 | `docs/handoffs/2026-10-24-s5-tool-tier-spec.md` |
| 状态 | 可直开工（③ 未启动，从 T1 起） |

## 项目定位

`d:\Seed\retro-skills` —— 以 rule / skill / agent 卡为载体的 AI 协作流程仓库；本阶段在把「开发工作流五段主干（①PRD → ②技术设计 → 计划门 → ③实现 → ④质量 → ⑤交付）」落成可执行的门与工具档位。

## 现状

- 已完成（逐项带出处）：
  - **① PRD 出口已签** —— `skills/dev-workflow/references/gate-record.md` 第 11 行（申报人「产品经理（代拟：主 agent）」/ 签字人「用户」）。
  - **② spec + testcase 已定稿并过议会 #2** —— spec `docs/superpowers/specs/2026-10-25-s5-tool-tiers-design.md`（v4-t3，307 行，SHA256 `974B477A…BDACD669`）+ testcase `docs/superpowers/specs/2026-10-25-s5-tool-tiers-design-testcase.md`（51 条：22 正 / 16 负 / 13 边界，`C6E8F23B…CE61B242`）。8 轮议会：第 8 轮审计 `PASS`（P0 0 / P1 0 / P2 3）、第 7 轮测试 `PASS`（P0 0）。签署见 `gate-record.md` 第 12 行。
  - **②→③ 计划门已签** —— plan `docs/superpowers/plans/2026-10-25-s5-tool-tiers.md`（11 个任务块 T1–T11）；签署见 `gate-record.md` 第 13 行（申报人「主 agent、sdet」/ 签字人「审计」/ 结论「过」）。
  - **③ 尚未开始** —— 无任何 `tools/docgen/` 代码改动（`git --no-optional-locks status --porcelain` 无 `tools/` 条目）。
- 验证证据：见元信息表『验证基线』（单源，勿在此重复）。
- 提交状态：spec / testcase / plan / gate-record 已随 commit `b039474` 提交；**上表 2 处修改仍未提交**，按用户规则由用户自行 commit（本 session 不擅自 commit）。
- 工作树异常：无（除上述 2 处未提交修改；`.session/` 在 `.gitignore` 内，账本不在 git 里）。

## 过程记录

- 议会 #2 账本（9 件，**先读 `progress.md` 尾部与 `problems.md` 尾部**）：`.session/reviews/2026-10-24-184309-s5-tool-tiers-spec/`
  - `progress.md`（8 轮轮次账 + 最终结论）、`problems.md`（第 1/6/7/8 轮族表与答辩）、`cards.md`（第 1/6/7/8 轮卡原文；第 2–5 轮标注「原文未落账」）、`round-check.md` / `delivery-audit.md`（审计两表，最终结论见「第 8 轮（最终）」节）、`detective.md`（侦探观察，降级形态）、`escalation-report.md`（第 3 轮升级与用户裁定）、`submission.md`（送审说明 + SHA256 版本轨迹）、`plan-gate.md`（计划门两轮核对明细）
- 历史交接词链：`docs/handoffs/2026-10-24-s5-tool-tier-spec.md` → `docs/handoffs/2026-10-24-s5-producer-impl.md`（本份）

## 本次任务

按 plan 执行 S5 的 ③ 实现，把 `producer` 档落地；流程：T1 `patternRegistry` → T2 `agentData` → T3 `validateAgentData` → T4 `outputFormats` → 中间 `npm run check` → T5 生成两席草稿 → T6 两版对照交用户确认 → T7 B3 独立重判 + `replace` → T8 四处旧断言 + 新增 `tool-tiers.test.mjs` → T9 三处流程文档 → T10 账本收口 → T11 终局 `gate` + `npm run check`；起点：**T1**。

## 范围依据

- 要读：
  - `docs/superpowers/plans/2026-10-25-s5-tool-tiers.md` §3 全部任务（T1 在第 38–46 行；§5 映射表在第 138–150 行；§6 自检在第 158 行起）
  - `docs/superpowers/specs/2026-10-25-s5-tool-tiers-design.md` §3.1（第 68–95 行）、§3.2（第 96–116 行）、§3.3（第 117–152 行）、§4（第 174–182 行）、§5（第 186–196 行）、§6（第 199–211 行）、§8 V-1～V-10、§11.1 Q1–Q4（第 280–283 行）、§11.3 D1–D11（第 293–307 行）
  - `docs/superpowers/specs/2026-10-25-s5-tool-tiers-design-testcase.md` §1.1「共用前提（P0 前置）」+ A 组（A01/A02/A04/A06–A10）与 D02/D05/D09
  - `skills/dev-workflow/references/gate-record.md` 第 11–13 行（确认入口三行已签）
- 勿重做：spec / testcase / plan 三件已定稿并签字（改它们要走回流）；`gate-record.md` 三行已签；**不改 PRD**（spec §2「不做什么」）。

## 开放问题

无。

（T6 需要用户当场确认两版差异、T7 需要独立子代理做 B3 重判 —— 两者是流程断点，不是待决问题，见「既定约束」。）

## 既定约束（不要重新讨论、不要重新选型）

- **只做 `producer`**；`research` 交 S5-R，检测脚本 / CLI B3 机器门 / 账本模板改造交 S5-B —— 出处：spec §11.1 Q3/Q4（第 282–283 行），依据用户 2026-10-24「把 producer 和 research 分开，减少范围」。
- **首批只给两席**：`reviewer-audit` + `detective-observer` 升 `producer`；`senior-sdet` 保持 `sdet` —— 出处：spec §11.1 Q2（第 281 行，用户确认）。
- **不擅自 commit** —— 出处：用户全局规则；`b039474` 即由用户提交，本轮 2 处修改同样留给用户。
- **禁手改 `agents/*.md`**：卡必须经 docgen 生成 + B3 重判 —— 出处：`skills/parliament/SKILL.md:15`；plan §4「中途不得」。
- **无子代理 → 停，不得 `replace`**：报降级模式（B3 未独立重判），S5 不标完成 —— 出处：spec §4 降级行（第 183 行）、plan T7 断点（第 94 行）。
- **Windows 环境变量写法**：PowerShell `$env:VAR='…'`；cmd `set "VAR=值"`（必须带引号，否则尾随空格污染判者标识）—— 出处：plan T7 第 90–94 行。
- **计划门脚本不存在**：`scripts/check-plan.mjs` 归 S4 未开工，计划门按 PRD `:724` 走审计手工核对表 —— 已签，**不要重开**（明细见账本 `plan-gate.md`）。

## 遗留裁决与留观项

- 议会 #2 第 2–5 轮卡原文未落账（上下文已滚出，补写＝伪造）—— 来源：账本 `problems.md` F6-3、`cards.md` 该节；用户已裁定接受该口径；**收敛时机：不再补**。
- 测试 P2 候选 3 条：`mdFilesUnder('skills')` 无单源实现；`readCounterFiles()` 只扫 `tools/docgen/test/*.test.mjs`；`validate.test.mjs` 的 `data[0]` 语义漂移未纳入 E06 —— 来源：`problems.md` F6-8；收敛时机：施工到 E08 / E06 时。
- 「同源硬约束」口径宽于实现：spec 写「本 spec 内凡要求两席执行的 `git` 命令」，B06 只实现三处（证据表 / §4 判者表 / V-8）—— 来源：第 8 轮审计附注；收敛时机：下次在 spec 其他节新增两席命令时。

## 开工前先做

1. `git --no-optional-locks status --porcelain`（应为 2 处 M：plan、`stage-2b-plan-gate.md`）+ `npm run check`（应 = 元信息表基线：606 pass / 0 fail / `baseline 37/37` / `0 findings`）；有差异先查清再动手。
2. 读 `docs/superpowers/plans/2026-10-25-s5-tool-tiers.md` §3 T1（第 38–46 行）与 §2 依赖图（第 24–34 行）。
3. 读 `docs/superpowers/specs/2026-10-25-s5-tool-tiers-design.md` §3.1 / §3.2（第 68–116 行）—— 四档定义与 `tierBySeat` / `tierOf` / `toolsForSeat` 的实现口径（`Object.hasOwn`）。
4. 读 `tools/docgen/components/patternRegistry.mjs`：确认 `export const patternRegistry`（第 23 行）、`tools` 字段（第 30 行起现为 readOnly/sdet/command 三档）、`BOUNDARY_COMMAND`（第 10 行）—— T1 只加 `producer` 与 4 个新导出，**不改既有三档的键与值**。
5. 读 testcase §1.1「共用前提（P0 前置）」：`assertBoundaryClean` / `writeScopeHalves` / `FORBIDDEN_PATHS` 要在 `T8` 新建的 `tool-tiers.test.mjs` 模块顶层先落，再写各组用例。

## 开场话术

```text
读 docs/handoffs/2026-10-24-s5-producer-impl.md，按交接词继续：执行 S5 的 ③ 实现，从 T1（patternRegistry 增 producer 档 + tierBySeat/tierOf/toolsForSeat/boundaryBySeat）开始。
```
