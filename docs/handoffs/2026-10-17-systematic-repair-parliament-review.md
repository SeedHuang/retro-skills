# Session 交接：retro-skills → 送 systematic-repair 设计 spec 过议会（2026-10-17）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-17 21:43（本机时区 Asia/Shanghai） |
| 项目根 | d:\Seed\retro-skills |
| HEAD | 20355aa；工作树：1 个未跟踪新文件（`docs/superpowers/specs/2026-10-17-systematic-repair-design.md`，229 行），已跟踪文件零改动 |
| 验证基线 | `npm run check`：unit 275/275 全绿 + check.mjs 0 findings + markdown 检查 171 文件/514 表，exit 0（2026-10-17 21:43 实跑）；typecheck/build/e2e：无（本仓无此配置） |
| 继任自 | `docs/handoffs/2026-10-17-parliament-build.md`（链式：parliament-build → 本文件） |
| 状态 | 可直开工（1 个待用户确认项，见「开放问题」；不构成开工先决条件） |

## 项目定位

d:\Seed\retro-skills —— 个人「规则 + 技能 + 复盘」自我改进体系仓库：`rules/`（全局规则源，aas 同步到 Trae 运行时）、`skills/`（技能源仓库）、`docs/superpowers/`（spec 与 plan）、KB 错题集在 `D:\Seed\lessons`。

## 现状

- 已完成（本 session）：
  - 写出 systematic-repair 设计 spec：`docs/superpowers/specs/2026-10-17-systematic-repair-design.md`（12 节 / 229 行）——把「一批已发现问题 → 系统化修掉 → 复查」固化成六环管道（聚簇诊断 → 失败面全貌 → 方案成文 → 过议会审批 → 施工 → 复查）。
  - 更新活账本 `.session/temp/2026-10-17-待办总览.md`：线 C 状态改为「spec 已写，待过议会」，「现在的下一步」节改为「送 spec 过议会」。
- 验证证据：见元信息表『验证基线』（单源，勿在此重复填写）
- 提交状态：工作树里那 1 个 spec 文件是未跟踪新文件，**未提交，由用户自行 commit**（本仓全局规则禁止 agent 主动 git 写操作）
- 工作树异常：无（仅上述 1 个有意新增的未跟踪文件）
  - ⚠️ 注意：`.session/temp/2026-10-17-待办总览.md`（不进 git）里「线 A 改动留工作区未提交」是**过时描述**——`git log` 证实 `host-duties.md`、`round-check.md` 的最后改动已在 `20355aa` 提交。本报告以 git 为准。

## 过程记录

- 活账本（四条线现状 + 下一步）：`.session/temp/2026-10-17-待办总览.md`（**先读**——不进 git，本机可见）
- 议会验收过程账（41 族问题来源）：`.session/reviews/2026-10-17-1707-parliament-acceptance/progress.md` + `problems.md`
- 41 问题清单与修复方案：`docs/reports/2026-10-16-1-rule-writer-rule-inspector-深度评审报告/problems.md` + `soluation.md`（§〇「六个修复簇与依赖顺序」）
- 历史交接词：`docs/handoffs/2026-10-17-parliament-build.md` → 本文件

## 本次任务

把 `docs/superpowers/specs/2026-10-17-systematic-repair-design.md` 送**议会**审批，通过后按 spec §10 继续落地 systematic-repair 技能；流程：**批1 spec 过议会**（组队 → 评审出卡 → 答辩 ≤3 轮 → 侦探 → 审计 → 结论）→ 批2 写 plan（`docs/superpowers/plans/2026-10-17-systematic-repair.md`）→ 批3 技能骨架（SKILL.md + references 4 + assets 3）→ 批4 `verify-cache.mjs` + test → 批5 接线 + `aas sync` → 批6 拿 41 问题首场实战；**起点：批1**（批0「账本 + spec 落盘」半完成——spec 已落盘，账本未建，见「开放问题」）。

## 范围依据

- 要读：
  - `docs/superpowers/specs/2026-10-17-systematic-repair-design.md` 全文（**被审对象**；12 节）
  - `skills/parliament/SKILL.md` 全文（总流程 0–7 + 执行路径 A/B/C + 关键规矩）
  - `skills/parliament/references/doc-taxonomy.md`（spec 行：主责评委 = 前端/后端/审计）
  - `skills/parliament/references/assembly-matrix.md`（纯文档仓库行：必选 读者代表+审计；按需 产品/后端/测试/AI）
  - `skills/parliament/references/host-duties.md`（主持人 6 项义务 + 架构师 7 方向 + 答辩编制）
  - `skills/parliament/references/debate-protocol.md`（评审轮 + 答辩 ≤3 轮 + 侦探机械判据 + 两档审计 + 六手法）
  - `skills/parliament/assets/issue-card.md`、`round-check.md`、`delivery-audit.md`、`escalation-report.md`
- 勿重做：
  - **议会技能本体**（`skills/parliament/` 全套 + `agents/*.md` 13 个生成物）——已随 `20355aa` 落地并验收通过，勿重建
  - **线 A 两处加固**（`skills/parliament/references/host-duties.md` 第 4 条 + `skills/parliament/assets/round-check.md` 证据栏必填）——已随 `20355aa` 落地
  - **本 spec 的 12 节结构**——已定稿；议会若提修改走「修复纪律」增量修订，不是重写

## 开放问题

1. 技能中文显示名「系统化修复」是否拍板？；推断：**沿用**（spec 第 5 行标注「待用户确认」，正文全用「系统化修复」，技能 id 固定为 `systematic-repair`、命令 `repair-to-death`）；请用户：确认 / 纠正。
2. 批0 的账本尚未落盘（`D:\Seed\lessons\skills\systematic-repair\ledger.md` 实测 `Test-Path` = False；`D:\Seed\lessons\skills\` 下现有 8 个技能目录不含 systematic-repair）——是先补账本再开评，还是随施工一并建？；推断：**先不建，等 spec 过议会定稿后再建**（spec 若被议会改动，账本内容需跟着变，早建会漂移）；请用户：确认 / 纠正。

（两问均不构成议会评审的先决条件——评审对 spec 只读，不依赖账本。）

## 既定约束（不要重新讨论、不要重新选型）

- 全程**不许自动 git 写操作**（不 commit / add / push），改动留工作区由用户决定提交方式 —— 出处：用户全局规则「全局 Git 写操作禁令」
- 议会**审计两表必由审计专员本人实例完成**，主持人代填即违规；证据栏空 = 不通过，不是待补 —— 出处：`skills/parliament/references/debate-protocol.md`「两档审计」
- 议会**固定清单/角色数据单源**在 `skills/parliament/scripts/gen-agents.mjs`；**禁止手改 `agents/*.md`**（改角色 = 改脚本数据 → 重新生成 → `--check`）—— 出处：`skills/parliament/SKILL.md`「执行路径」节
- 每步收尾跑 `npm run check` 全绿才算完 —— 出处：`.session/temp/2026-10-17-待办总览.md`「收尾提醒」
- 评审产物落 `.session/reviews/<YYYY-MM-DD-HHMM>-<kebab 名字>/`（`problems.md` + `progress.md`）；`docs/reports/` 只放分析数据 —— 出处：`skills/parliament/SKILL.md`「产出」节
- 新技能体量上限：SKILL.md <500 行；机械脚本 ≤150 行 + test —— 出处：spec §3 / §6（防「套娃」副作用）

## 遗留裁决与留观项

- 议会审计的机械计数可脚本化 —— 来源：`.session/temp/2026-10-17-待办总览.md` 线 D.1 + spec §12 Backlog；收敛时机：议会跑满 ≥3 场后
- systematic-repair 建成后拿 41 问题首场实战 —— 来源：`.session/temp/2026-10-17-待办总览.md` 线 D.2 + spec §10 批6；收敛时机：批5 接线完成、`npm run check` 全绿后

## 开工前先做

1. `git status --short` 确认工作树仍是「1 个未跟踪 spec 文件、已跟踪文件零改动」；跑 `npm run check` 复核基线应 275 pass / 0 fail。
2. 读 `docs/superpowers/specs/2026-10-17-systematic-repair-design.md` 全文（被审对象）。
3. 读 `skills/parliament/SKILL.md` 全文 + `references/doc-taxonomy.md` + `references/assembly-matrix.md`（判文档类型 → 出提议名单）。
4. 出提议名单：按「纯文档仓库 + spec 类」——**读者代表 + 审计 + 后端 + 测试 + AI**（侦探无条件常驻）→ **交用户确认**（覆盖矩阵零缺口 = 最低法定人数）。
5. 用户确认名单后，按 `skills/parliament/SKILL.md` 总流程 1→7 开跑：评审出卡 → 汇总去重按族分组 → 答辩 ≤3 轮 → 侦探行为核对 → 每轮 `round-check.md` 审计 → 终局 `delivery-audit.md` → 结论三态；过程账落 `.session/reviews/`。

## 开场话术

读 docs/handoffs/2026-10-17-systematic-repair-parliament-review.md，按交接词继续：把 systematic-repair 设计 spec 送去过议会。
注意：先跑 git status 与 npm run check 复核基线；点将名单出好后先交我确认再开评；全程不许自动 git 提交。
