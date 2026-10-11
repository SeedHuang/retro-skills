# Session 交接：retro-skills → review-loop L3 落地（2026-10-10）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-10 23:10（Asia/Shanghai） |
| 项目根 | d:\Seed\retro-skills |
| HEAD | `5dd3f99`（`docs: 更新会审流程的重复判定过滤规则与模板`）；工作树：1 个已修改 + 2 个未跟踪（见下） |
| 验证基线 | 无构建/测试体系（纯 Markdown 仓库）。验证基 = 文件落盘核读（`git status` + `git diff` + `Get-Content` 行数实跑，23:05）。`git log --oneline -3` = `5dd3f99`/`fa13f94`/`099141d` |
| 继任自 | 无（本次为手写交接，无历史 handoff 链） |
| 状态 | 有 1 个开放问题（见「开放问题」） |

## 项目定位

d:\Seed\retro-skills —— agent 技能与规则的知识库（Markdown 主导）：`skills/` 18 个技能、`rules/` 15 条规则、`docs/superpowers/` spec 与 plan、`skilldependencies/` 校验脚本。本 session 的工作是优化 `review-loop` 技能（代码/文档审查循环），解决「review 不收敛、动辄十几轮」的问题。

## 现状

**本 session 的产出（L1/L2 已落地提交，L3 待落地）：**

- **L1 分支锁基线** —— 已落地并提交（commit `fa13f94`）。改了三处：`rules/no-git-write.md`（新增「review 分支例外」，git 写权限分两段放开）、`skills/review-loop/SKILL.md`（新增「分支前置」小节：当前分支检查→残留检查→建分支→记母分支，以及「收尾」小节：工作区检查→范围预检→展示确认→rebase→删分支）、`skills/review-loop/references/loop.md`（§3 硬约束「不 commit、不 push」翻转为「每轮 commit 锁基线」，§1 开场动作补分支确认）。
- **L2 重复判定过滤** —— 已落地并提交（commit `5dd3f99`）。改了：`skills/review-log/assets/review-problems-template.md`（「不改/误报」加锚点三要素：文件+行号+关键词）、`skills/review-loop/references/loop.md`（新增「处置前的重复判定过滤」小节：规则过滤→语义裁决；明确只过滤「不改/误报」，已修再报按新问题处置）、`skills/review-loop/SKILL.md`（摘要加「先过滤再处置」）。
- **L3 规则对症 OCR** —— **只有 spec，未落地**。spec 在 `docs/superpowers/specs/2026-10-10-review-loop-l3-project-type-design.md`（270 行，含实测验证记录、项目类型识别三层算法、B 计划、边界用例）。

**工作树状态（未提交，由用户决定是否 commit）：**

| 文件 | 状态 | 内容 |
|---|---|---|
| `rules/no-git-write.md` | M | 仅一处：spec 路径从 `.session/temp/2026-10-10-review-branch-design.md` 改为 `docs/superpowers/specs/2026-10-10-review-branch-design.md`（迁移 spec 后同步引用） |
| `docs/superpowers/specs/2026-10-10-review-branch-design.md` | ?? 未跟踪 | L1 分支方案 spec（172 行，从 temp 迁移来） |
| `docs/superpowers/specs/2026-10-10-review-loop-l3-project-type-design.md` | ?? 未跟踪 | L3 规则方案 spec（270 行，从 temp 迁移来） |

**遗留 temp 文件**：`.session/temp/2026-10-10-config-layering-review-accounting.md`（18 轮问题的分账分析，过程材料，留在 temp 合理）。

**过程证据链（本次 session 考古确认的根因）：** 18 轮审查问题分账在 `docs/superpowers/specs/2026-10-10-review-branch-design.md` 关联的分账分析里，L1-L4/A1-A3 归因见 `.session/temp/2026-10-10-config-layering-review-accounting.md`。

## 过程记录

- 本次 session 无 review-log 账本（本 session 是对 review-loop 技能本身的改造，不是一次 review）。改动验证靠：`git status` / `git diff` / `Get-Content` 行数核读（已实跑）。
- OCR 规则机制的事实证据：`ocr rules check` 实测输出、官方文档（open-codereview.ai/docs/review-rules 与 /docs/cli-reference）——结论已写进 L3 spec §二「实测验证记录」。
- 历史交接词：无。

## 本次任务

**下一任务一句话**：把 L3 spec（`docs/superpowers/specs/2026-10-10-review-loop-l3-project-type-design.md`）落地到 review-loop 技能。

**流程**（按用户已定的顺序）：
1. **落地 L3**（spec 第五节已定义三处改动：SKILL.md「分支前置」插项目类型识别步骤 + `ocr review` 命令统一带 `--background-file` + loop.md 开场动作加偏离探测；以及生成 `.opencodereview/project-profile.md` 与 `rule.json` 的约定）
2. **落地 A1-A3**（agent 纪律：A1 列全失败面再修、A2 样式级评论判不改、A3 修复后真实场景实测——本 session 只给出分析，未写进技能，需要新 session 设计后落地）
3. **实测一轮真实 review**：验证 L1/L2/L3/A1-A3 是否让循环收敛
4. **L4 不预先设计**：按用户裁定，L4 是「终极问题」，答案从第 3 步实测数据里长出来（轮数是否自然下降），不是人为阈值

**起点**：环节 1（L3 落地）。

## 范围依据

**要读（开工前）**：
- `docs/superpowers/specs/2026-10-10-review-loop-l3-project-type-design.md`（全文 270 行，特别是 §三落点、§四识别算法、§五落进技能的三处改动、§七 B 计划）
- `skills/review-loop/SKILL.md`（当前「分支前置」4 步 + 「必须遵守」摘要）
- `skills/review-loop/references/loop.md`（§1 开场动作、§3 硬约束、§「处置前的重复判定过滤」——L3 要往这些地方插步骤）
- `skills/review-log/assets/review-problems-template.md`（L2 已加的锚点，L3 不要动它）
- `rules/no-git-write.md`（review 分支例外，L3 落地时确认不冲突）

**勿重做**（已实现，别重复）：
- L1 分支前置 4 步（SKILL.md 已写）——L3 是「在现有第 3 步（建分支）之后插新步骤」，不是重写
- L2 重复判定过滤（loop.md 已写）——L3 的偏离探测与它不冲突，但要确认两者在每轮开场动作里的先后
- OCR 机制的事实结论（规则四层链、`--background-file` 注入范围）——已实测并写进 L3 spec §二，直接引用，别重测

## 开放问题

1. **L3 的 B 计划触发条件未定**（开工第一问）：L3 spec §七说「`merge_system_rule: true` 的实际遵从度未实测」，需要第一次真实 review 后看 low 评论数是否下降。但「下降到多少算有效」没有阈值。推断：以「接入后 low 评论占比明显下降（如 <50%）」为有效，若仍大量报 React 项则按 B1（改措辞）→ B2（换 false 替换）阶梯走。请用户确认这个判据。

## 既定约束（不要重新讨论、不要重新选型）

- **git 写操作默认禁止**，唯一例外是 review 分支内流程（commit 带 【review】标记、rebase 回母分支）——来源：`rules/no-git-write.md`「review 分支例外」段，用户 2026-10-10 裁定
- **问提交的边界**：循环中 commit 是流程动作不许问；唯一允许问「是否提交/合并」= 收尾合并回母分支——来源：`rules/no-git-write.md` §问提交的边界，用户裁定
- **重复判定过滤只过滤「不改/误报」，已修再报必须按新问题处置**（回归信号不许吞）——来源：`loop.md` §处置前的重复判定过滤，本 session 用户拍板
- **L1 合并用 rebase 不用 merge**；不支持并行 review；残留分支不删则终止 review——来源：`docs/superpowers/specs/2026-10-10-review-branch-design.md`，用户裁定
- **项目类型识别**：有清单文件按依赖判不问用户；无清单文件二分分不清就问用户；每次 review 偏离探测，问一次确认后同类不再问——来源：L3 spec §四，用户裁定
- **L4 不预先设计**，先验证 L1-L3 + A1-A3 后从实测数据定——来源：本 session 用户裁定
- **spec 落盘位置**：`docs/superpowers/specs/`（命名 `YYYY-MM-DD-主题-design.md`）；temp 只放过程材料——来源：本 session 用户指正

## 遗留裁决与留观项

- **`merge_system_rule` 遵从度未实测**——来源：L3 spec §十未决；收敛时机：第一次真实 review 落地后看 low 数
- **多语言项目 path pattern 未写**——来源：L3 spec §十；收敛时机：落地时按项目实际语言补
- **偏离探测的「新增信号」清单可能不全**（目前 4 个：react 依赖/.tsx/server 目录/清单文件）——来源：L3 spec §十；收敛时机：实际漏判一次再补

## 开工前先做

1. `git status --porcelain` 确认工作树：应见 1 个 M（no-git-write.md）+ 2 个 ??（两个 spec）；确认无其他改动混入
2. 读 `docs/superpowers/specs/2026-10-10-review-loop-l3-project-type-design.md` §五（三处落地改动）和 §四（识别算法），这是 L3 落地的主执行依据
3. 读 `skills/review-loop/SKILL.md` 当前「分支前置」小节（确认现有 4 步），确认 L3 新步骤插在第 3 步（建分支）之后、第 4 步（记母分支）之前
4. 读 `skills/review-loop/references/loop.md` §1「每一轮的开场动作」——L3 的偏离探测要加在这里，与现有「分支确认」「处置前过滤」对齐先后
5. 确认用户对「开放问题 1」（B 计划触发判据）的回答，再决定落地时是否要写阈值

## 开场话术

读 docs/handoffs/2026-10-10-review-loop-l3-landing.md，按交接词继续：把 L3 spec（docs/superpowers/specs/2026-10-10-review-loop-l3-project-type-design.md）落地到 review-loop 技能，然后做 A1-A3，最后实测一轮真实 review 验证收敛。
