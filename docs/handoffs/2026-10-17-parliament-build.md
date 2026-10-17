# Session 交接：retro-skills → 子代理驱动落地议会（parliament）技能（2026-10-17）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-17 15:15（本机时区 Asia/Shanghai） |
| 项目根 | d:\Seed\retro-skills |
| HEAD | fb165f0；工作树：2 个未跟踪新文件（docs/superpowers/specs/2026-10-17-parliament-design.md、docs/superpowers/plans/2026-10-17-parliament.md），已跟踪文件零改动 |
| 验证基线 | `npm run check`：unit 269/269 全绿 + skill-inspector 0 findings + markdown 检查 146 文件/463 表通过，exit 0（2026-10-17 15:13 实跑） |
| 继任自 | 无（本 session 从用户口述立项议会设计，非 handoff 继任） |
| 状态 | 可直开工 |

## 项目定位

d:\Seed\retro-skills —— 个人「规则 + 技能 + 复盘」自我改进体系仓库：rules/（全局规则源，aas 同步到 Trae 运行时）、skills/（技能源仓库）、docs/superpowers/（spec 与 plan）、KB 错题集在 D:\Seed\lessons。

## 现状

- 已完成：议会（parliament）技能的**完整设计**——本 session 与用户多轮收敛后定稿：
  - Spec：`docs/superpowers/specs/2026-10-17-parliament-design.md`（13 病根表、8 类文档分类学、点将矩阵、13 席角色全量固定清单、agent 模板全文与生成契约、3 轮答辩 + 两档审计协议、接线清单，均已落盘并读回验证）
  - Plan：`docs/superpowers/plans/2026-10-17-parliament.md`（7 任务：骨架 → references → assets → TDD 生成器 → 接线 → aas 同步 + 实测闸门 → 历史回归验收；全步骤带验证命令）
  - 设计已由用户逐项拍板：技能名=parliament（中文「议会」）、子代理走用户级（aas 第三条 linkTarget）、双清单（固定必问+自由探索）、编译式单源（gen-agents.mjs 生成 13 个 agent 文件）、侦探三权分立、按项目类型点将组队、两档审计（轮间核对单/交付审计表）
- 验证证据：见元信息表『验证基线』（单源，勿在此重复填写）
- 提交状态：spec 与 plan 均未提交，由用户自行 commit（本仓库全局规则禁止 agent 主动 git 写操作）
- 工作树异常：无（仅上述 2 个有意新增的未跟踪文件）
- KB 账本：`D:\Seed\lessons\skills\parliament\ledger.md` 当前**未落盘**；三条立项教训（L-001 单 agent 演全角色致覆盖漂移 / L-002 无文档分类学 / L-003 有角色无流程）的失败场景与根因已完整记录在 spec §0 与 §1，如需按 evolving-skills 协议补账，先向用户确认后按 spec 内容落盘，勿凭记忆重写

## 过程记录

- 设计与裁决全文：`docs/superpowers/specs/2026-10-17-parliament-design.md`（先读全文——角色数据唯一权威）
- 执行书：`docs/superpowers/plans/2026-10-17-parliament.md`（先读全文 + Self-Review 记录节）
- 历史交接词：与议会相关的历史 handoff 无（本仓 docs/handoffs/ 既有文件均属其它主题）

## 本次任务

用**子代理驱动方式**执行议会技能落地（用户已选定该方式并明确「开始落地」）；流程：Task 1 目录改名+SKILL.md → Task 2 references 五件 → Task 3 assets 六件+删旧面板+全量验收 → Task 4 gen-agents.mjs+守卫测试+生成 13 agent → Task 5 接线（skilldependencies+12 文件引用替换）→ Task 6 aas 第三链路+同步+用户实测闸门 → Task 7 历史回归验收；起点：**Task 1**（施工 0%，本 session 仅落了 spec/plan，未动任何技能文件）。

## 范围依据

- 要读：
  - `docs/superpowers/plans/2026-10-17-parliament.md` 全文（含 Global Constraints 节——no-git-write 等铁律）
  - `docs/superpowers/specs/2026-10-17-parliament-design.md` 全文（尤其 §6.1 模板逐字、§7.1/7.2 角色数据逐字源、§10 接线清单）
  - `skills/multi-lens-review/SKILL.md` 全文（Task 1 的改名对象、六手法原文在其中的「六个手法」节——Task 2 debate-protocol.md 要搬）
  - `skills/multi-lens-review/references/role-panels.md` 全文（旧必问清单，已并入 spec §7.1，Task 3 删除该文件）
  - `D:\Seed\agent-assets-sync\sync.config.json`（Task 6 改它的 linkTargets）
- 勿重做：spec 与 plan 已定稿，勿重新设计、勿另立方案、勿改技能名；本 session 已完成的调研（Trae 子代理官方机制、aas 文件级同步代码核实、17 处引用清单）结论已写进 spec §3/§10，勿重复调研

## 开放问题

无（所有设计决策均由用户拍板：名字、用户级同步、双清单、模板、13 席、侦探处置、组队、审计两档、历史回归标准）。两个**流程内**确认点已在 plan 中内置闸门，无需提前问：Task 6 Step 4 子代理调度实测（用户手动）、Task 7 历史回归对照（走完评审后对答案）。

## 既定约束（不要重新讨论、不要重新选型）

- 禁止一切 git 写操作，每任务收尾 = 改动留工作区交用户 —— 用户全局规则 no-git-write（plan Global Constraints 第 1 条）
- 目录改名用 Rename-Item（文件系统操作），不用 git mv —— plan Task 1 Step 1
- 文件写入用 Write 工具（UTF-8 无 BOM）；禁 PowerShell `Set-Content -Encoding UTF8` —— 用户全局规则 powershell-file-encoding
- SKILL.md description 只写触发条件、不写流程摘要 —— spec §6.2 / 用户既有规则（写摘要会导致 agent 跳过正文）
- 跨技能引用只写技能名，禁写对方内部路径；脚本自引用相对路径；直接运行判定用 realpathSync —— rules/skill-authoring-convention.md
- SKILL.md 正文 <200 行 —— spec §3
- `agents/` 目录只准放 13 个生成物（aas 文件级全量同步会污染运行时）—— spec §3
- 每任务收尾 `npm run check` 全绿 —— plan Global Constraints
- specs/plans/handoffs/architecture 及 rules 来源行里的 `multi-lens-review` 历史引用**不改** —— spec §10 第 3 条

## 遗留裁决与留观项

- KB 账本未落盘 —— 来源：本 handoff「现状」节；收敛时机：Task 7 验收回填时（或用户明示不需要账本）
- aas 现有 skills 条目靠 env 变量还是 repoRoot 相对解析，未定 —— Task 6 Step 1 探测后镜像同款机制即可，无需提前定
- Task 6 实测失败时的回退路径已预定：Builder 会话 Task 工具贴角色卡（路径 B），`agents/` 保留作 A 路径资产 —— spec §3 执行路径表

## 开工前先做

1. `git status --porcelain` 确认仅 2 个未跟踪新文件（spec/plan）在位；跑 `npm run check` 复核基线应为 269/269 全绿（与本 handoff 元信息表一致；若数字变动，以实跑为准并注明）
2. 读 `docs/superpowers/plans/2026-10-17-parliament.md` 全文 + `docs/superpowers/specs/2026-10-17-parliament-design.md` 全文
3. 确认 `skills/multi-lens-review/`（含 SKILL.md 与 references/role-panels.md）仍在原位 —— Task 1 改名、Task 3 删面板的执行对象
4. 加载 superpowers:subagent-driven-development 技能，按其流程逐任务派子代理、任务间两段式审查
5. 从 plan Task 1 开始执行；Task 6 Step 4（子代理调度实测）是用户手动闸门，到达时显式请用户开新对话验证，勿跳过

## 开场话术

读 docs/handoffs/2026-10-17-parliament-build.md，按交接词继续：用子代理驱动方式执行 docs/superpowers/plans/2026-10-17-parliament.md，落地议会（parliament）技能（从 Task 1 开始）。注意：全程禁止 git 写操作，改动留工作区交我决定提交方式。
