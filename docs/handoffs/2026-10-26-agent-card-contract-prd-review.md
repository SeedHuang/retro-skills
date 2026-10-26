# Session 交接：retro-skills → 送议会 #1 审 agent 卡契约化 PRD（2026-10-26）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-26 21:19（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `4faa190`；工作树：仅 3 个未跟踪新文件（无已跟踪文件改动） |
| 验证基线 | `npm run check` → `# tests 736 / # pass 734 / # fail 0 / # skipped 2` + `check 全部通过`（21:19 实跑）；仓库外草稿 `node --test C:\Users\HuangChunhua\.retro-skills\observation-check-draft\*.test.mjs` → `71/71`（21:19 实跑） |
| 继任自 | `docs/handoffs/2026-10-25-s6-policy-impl.md` |
| 状态 | 有 1 个开放问题（见「开放问题」節，构成开工第一问） |

## 项目定位

`d:\Seed\retro-skills` —— 面向 AI 编码的规范仓库：`rules/` 条文约束 + `skills/` 流程方法 + `agents/` 子代理角色卡 + `tools/docgen/` 角色卡生成器 + `skills/parliament/` 议会式评审。

## 现状

- 已完成（本 session）：
  - 产物校验实现跑通并从临时目录迁出：`C:\Users\HuangChunhua\.retro-skills\observation-check-draft\`（11 文件 / 888 行 / 71 测试绿）。迁出原因：`npm run check` ⑤ 段要求 `.session/tmp/` 收尾为空，而未定稿代码不能进 `tools/`（证据：留在 `.session/tmp` 时 check 报 11 个文件残留、exit 1）。
  - 探索稿新增 §14：`docs/after/20261026164718-agent-card-composition-exploration.md`（§14.1 为何改 json、§14.2 四段校验链、§14.3 产物契约、§14.4 错误码、§14.5 引用最小长度与路径白名单、§14.6 71/71 数据、§14.7 三条残余缺口结论、§14.8 门禁时点与验法、§14.9 状态与前置）。
  - 新 PRD：`docs/prd/20261026205821-agent-card-contract.md`。§0 四栏：精算师已签（事后复核，有条件通过）、市场 / 产品经理**留空**（用户裁定）、用户已签（2026-10-26）。见该文件 §0.0。
  - 精算师评审 8 个问题（P0×2 / P1×3 / P2×3）已全部处置，原文转录在该 PRD 附录 B；其中 P0-01 是本 PRD 自身的事实错误（把 233/240 写成 240/240、把 C01 单例 0/4 写成整类 0/4），已改 §0.3。
  - 跨 PRD 边界已裁：本 PRD 优先，`tools/docgen` 模型改造与「全席重生成」归本 PRD；mainline 需重优化（待办已登记）。
- 验证证据：见元信息表『验证基线』（单源，勿在此重复）。
- 提交状态：3 个未跟踪新文件未提交，由用户自行 commit。
- 工作树异常：无。

## 过程记录

- `docs/prd/20261026205821-agent-card-contract.md`（PRD 本体；先读 §0.0 / §0.4 / §5 / §7 / §8 / §9）
- `docs/after/20261026164718-agent-card-composition-exploration.md`（探索稿；§11 形态实验、§13 D10 重测、§14 工程化实测是全部数字的来源）
- `docs/after/20261026211515-mainline-prd-reoptimize-open-decisions.md`（跨 PRD 待办：mainline 重优化并重签 §0）
- 外部草稿：`C:\Users\HuangChunhua\.retro-skills\observation-check-draft\`（11 文件，含 `checks.mjs` / `evidence.mjs` / `artifact.mjs` / `render.mjs` / `data.mjs` 与 6 个 `*.test.mjs`）
- 历史交接词：`docs/handoffs/2026-10-25-s6-policy-impl.md` → 本份

## 本次任务

送议会 #1 审 `docs/prd/20261026205821-agent-card-contract.md`；流程：议会 #1（出问题卡 → 议长收敛 → 结论）→ PRD 定稿 → 拆 S2 的 spec（同批由 `senior-sdet` 在独立上下文出 testcase）→ 议会 #2 → 写 plan 并过计划门（审计本人读并签字）→ 施工 S2 → S3；起点：议会 #1。
若用户改选「先开工 S2」，则起点改为 S2 的 spec，议会 #1 后移到 spec 阶段合并审。

## 范围依据

- 要读：`docs/prd/20261026205821-agent-card-contract.md` §0.0（四栏与签字口径、留空两栏的引用限制）、§0.4（成本与收益基线 7 行）、§4（产物合同）、§5（门禁与追责、5.3 拦不住什么）、§7（D-01～D-08）、§8（S1–S4 与执行顺序）、§9（V-1～V-11）。
- 要读：`docs/after/20261026164718-agent-card-composition-exploration.md` §14.1–§14.9（已实现细节与残余缺口的唯一记录）。
- 勿重做：校验实现（888 行 / 11 文件 / 71 测试，已在草稿区，见元信息表验证基线）；精算师评审（已签，8 问题已处置，见 PRD §0.5 / 附录 B）；§0 四栏（已按用户裁定定稿，见 PRD §0.0）。

## 开放问题

1. **开工第一问**：先送议会 #1，还是先开工 S2（把已绿的 888 行收进 `tools/observation-check/`）？推断：先送议会 #1。依据：`rules/` 的主干规则 R1 要求「上一段出口判据未齐不得开工」，而 PRD 段① 的出口是议会 #1（`gate-record.md` 的 ① 行，本 session 未签）；`dev-workflow-mainline` 的「路径 A（带 §0 未过送审）」只针对该 PRD 的 S1，不构成通用先例。请用户：确认或纠正。

## 既定约束（不要重新讨论、不要重新选型）

- 市场 / 产品经理两栏留空，**不得**被引用为「市场已评审」「产品已评审」—— 出处：PRD §0.0 引用限制 + 用户 2026-10-26 原话「先空着 就说是我通过了」。
- 一份数据 → 三投影（卡面 / README 每席一份 + 自动 index / dump）；同编号覆盖 + `reason` 必填 + merge 输出 `overrides[]`—— 出处：PRD §0.2 A-1 / A-3。
- json 为权威、md 只是渲染视图；产物只能由 `writeObservation` 写出，校验不过零写盘—— 出处：PRD §0.2 A-6 / §4.5。
- 强制度 = 归档目录强制：`docs/superpowers/reviews/` 下必须过校验 + 被 git 跟踪 + 无未提交改动；`.session/` 只校验不追—— 出处：PRD §0.2 A-8 / §5.2。
- 执行顺序 S2 → S3 → S1 → S4—— 出处：PRD §8（`[已决·代裁]`，用户可推翻）。
- 本 PRD 优先于 `dev-workflow-mainline` 的 docgen / 全席重生成归属—— 出处：PRD §0.2 A-9 / §7 D-08 + 用户 2026-10-26 裁定。
- 定稿前不得再往 `observation-check-draft` 添加新实现—— 出处：探索稿 §14.9（加得越多，迁入时返工越多）。

## 遗留裁决与留观项

- mainline PRD 需重优化并重签 §0（让出「全席重生成」）—— 来源：`docs/after/20261026211515-mainline-prd-reoptimize-open-decisions.md`；收敛时机：mainline 下一次被触碰时。
- D-07 的工期数字必须由试点实测产生（禁止手填），用 `git diff --numstat agents/ tools/docgen/` 量单席 ×14 + 20% 缓冲—— 来源：PRD §7 D-07 / §9 V-10；收敛时机：S4 试点席完成后。

## 开工前先做

1. `git status --porcelain`（应只有 3 个未跟踪新文件）+ `npm run check`（应为 736 tests / 734 pass / 0 fail / `check 全部通过`；数字不一致先查，不要往下走）。
2. 读 `docs/prd/20261026205821-agent-card-contract.md` §0.0、§0.4、§7、§8、§9（这是本任务的全部依据）。
3. 确认草稿区在位：`Get-ChildItem C:\Users\HuangChunhua\.retro-skills\observation-check-draft -File | Measure-Object` → 11；再跑 `node --test C:\Users\HuangChunhua\.retro-skills\observation-check-draft\*.test.mjs` → 71/71。
4. 回答「开放问题 1」（议会 #1 vs 先开工 S2），未得到用户答复前不要选路。

## 开场话术

读 `docs/handoffs/2026-10-26-agent-card-contract-prd-review.md`，按交接词继续：送议会 #1 审 agent 卡契约化 PRD（先处理「开放问题 1」）。注意：本 session 新写的 3 份文档未提交，由我自行 commit。
