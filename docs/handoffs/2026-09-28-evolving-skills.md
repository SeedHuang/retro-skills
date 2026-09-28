# Session 交接：复盘体系 → evolving-skills（第 2 步 C2+A1）（2026-09-28）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-09-28 15:22（Asia/Shanghai） |
| 项目根 | `D:\Seed\retro-skills`（本体系主仓库）；另有两个参与仓库：`D:\Seed\my-rules`、`D:\Seed\lessons`（KB） |
| HEAD | **retro-skills 与 my-rules 都零提交**（`git log`：`your current branch 'master' does not have any commits yet`；远程已配 `git@github.com:SeedHuang/…`）。未提交面（取数：`git -C <仓库> status --porcelain -uall`，交接时实跑）：retro-skills **17 个未跟踪**、my-rules **10 个未跟踪**（均**全仓首发**）。`local-pack-manager` HEAD = `cb1e0e0`，另有 **19 条未提交**：其中 **9 个 M（5 个 `src/` + 4 个 `tests/`）+ 7 个 `??`** 是 **S8 并行 session 的在途改动**，不要动；**与本体系相关的只有 3 条**（S6 复盘的 `D` + 2 条 `.trae/rules/`） |
| 验证基线 | 脚本测试 **14/14**（`node --test scripts/sync.test.mjs`）+ 同步体检 **"全部一致"**（`node scripts/sync.mjs`：规则"已就位 9"、技能"已就位 5"）；`~\.trae-cn\user_rules\` 实测 **9 条**（**15:22 实跑**） |
| 继任自 | 无（本体系首份交接词）。上游入口是 S6 复盘 `s6-link-direct-retro.md`，已从 lpm 仓库移入 KB |
| 状态 | 可直开工（无阻塞性开放问题） |

## 项目定位

`D:\Seed\retro-skills` —— 复盘套件的主仓库（5 个技能 + 同步脚本 + 体系架构文档）；与 `D:\Seed\my-rules`（全局规则源）、`D:\Seed\lessons`（错题集 KB）一起构成"开发踩坑 → 变成规范"的闭环。

## 现状

- **已完成**：L1 数据层（KB + 指针 + `lessons.mjs`）｜L2 复盘层（`using-retrospective` / `retro-collect` / `retro-analyze` / `retro-institutionalize` / `managing-lessons-store`）｜L4 仓库与安装层（`my-rules` 建库 + `scripts/sync.mjs` + 9 条规则符号链接 + 5 个技能 junction，全部实测通过）。**L3 只做了 `retro-institutionalize` 那半**
- **本次新增**：`scripts/sync.mjs` + `scripts/sync.test.mjs`（14 用例）｜`docs/architecture.md`（经 4 轮 multi-lens 评审收敛）｜`my-rules` 两条新规则：`powershell-file-encoding.md`、`landing-sweep.md`
- **验证证据**：见元信息表『验证基线』（单源，不在此重复）
- **提交状态**：两个仓库**零提交**，全部文件待提交 —— **由用户自行 commit**
- **工作树异常**（两条，都会影响开工）：
  1. **retro-skills / my-rules 零 commit** → architecture §5 说的"可进化前提 = 有源仓库、改坏能回退"**还没真正满足**（没有历史可回退）。若要动技能本体，建议先让用户提交一次
  2. `local-pack-manager` 里有 **S8 并行 session 的在途改动**（6 个 `src/` M + 3 个 `tests/` M）—— 与本任务无关，**不要触碰**

## 过程记录

- **体系总图 + 全部裁决**：`D:\Seed\retro-skills\docs\architecture.md`（**先读 §8 执行顺序、§9 待验证、§10 隐患、§11 评审 backlog**）
- 套件设计 spec：`docs\superpowers\specs\2026-09-27-retro-suite-design.md`｜实施计划：`docs\superpowers\plans\2026-09-27-retro-suite.md`
- 复盘执行账本（L1/L2 建设过程）：`D:\Seed\lessons\index.md` + `D:\Seed\lessons\projects\local-pack-manager\`（`*-facts.md` / `*-retro.md` / `ledger.md`）
- 历史交接词：`local-pack-manager\docs\handoffs\2026-09-27-s8-status-repair.md`（lpm 产品线）→ **本文件**（新线：复盘体系）

## 本次任务

实现 **`evolving-skills`（第 2 步 = 架构文档 §8 的 C2 + A1）**：把 multi-lens 那套"技能自我进化"流程抽成**通用协议**、住进新技能、并给 `retro-institutionalize` 加**转发闸门**（决策树走到"载体 = 技能"时转发给它）；流程：**brainstorming 澄清 → spec 落盘 `docs/superpowers/specs/` → spec 自审 → 用户终审 → plan 落盘 `docs/superpowers/plans/` → 逐任务实施**（技能类任务按 `writing-skills` 走 RED-GREEN）；**起点：spec 阶段的 brainstorming（先澄清"开放问题"节三条）**

## 范围依据

- **要读**：`retro-skills\docs\architecture.md` 的 §3 L3、§5、§6（A1/A2/B2/C2）、§8 第 2 步、§10（H1/H2）
- **要读（抽离的原始素材）**：`~\.trae-cn\skills\multi-lens-review\SKILL.md` 的「复盘回流（评审飞轮）」节 + 同目录 `lessons.md`（11 条，含四归因与"已合并"标记）
- **要读（要改的对象）**：`retro-skills\skills\retro-institutionalize\SKILL.md`（加转发闸门）
- **勿重做**：L1/L2/L4 全部（architecture §8 里标 ✅ 的两项）；`scripts/sync.mjs`、`scripts/sync.test.mjs`、5 个技能、9 条规则

## 开放问题

1. **协议的家放哪**？推断：`evolving-skills\` 文件夹内（依据：architecture §6 注——安装的原子单位是 `skills\<名>\`，放仓库根的 `docs\` 会随安装丢失）。请用户确认
2. **差异卡分几张**？推断：3 张（rule / skill / 自动化；依据：architecture §3 L3 的"每种载体的差异卡"）。请用户确认或简化
3. **三要素在 rule 与 skill 之间是否全通用**？推断：约七成通用（骨架同：先升级不新增 / 四归因 / 攒批；生效机制不同：rule 开新对话生效、skill 需重装）。遗留待裁：`writing-skills` 的"失败场景先行"**要不要也用在 rule 上**。请用户裁决

## 既定约束（不要重新讨论、不要重新选型）

- **运行时目录只读**；唯一编辑点是源仓库；改完跑 `node scripts/sync.mjs` —— 出处：architecture §4（体系公理）
- **不要在 `~\.trae-cn\user_rules\` / `skills\` 手改**（会被同步冲掉 / 静默覆盖）—— 出处：architecture §4
- **不与 `npx skills add/update` 混用同一批技能** —— 出处：architecture §9 V3（会换掉链接）+ V5（实测：`update` 只动锁里的技能，不碰我们的）
- **技能改动必须走 RED-GREEN**（先有失败场景）—— 出处：`writing-skills` 的铁律（改既有技能同样适用）
- **零第三方依赖**（脚本现状只用 Node 内置）—— 出处：architecture §8.1 前置条件第 4 条
- **不在项目里留过程记录**：复盘产物进 KB、教训进 `my-rules` —— 出处：architecture §2 三件套定位

## 遗留裁决与留观项

- **R28**（spec 里 multi-lens「待定」）—— §4.4 与 §15 O3 **两处都已改**，只差把它从"候选"挪进"已关闭"；收敛时机：下次编辑 `architecture.md` 时顺手
- **R27**（补第 5 轮评审确认）—— 收敛时机：下次动这套体系时顺手跑一轮
- **V6**（"改了技能内容后新对话是否即时可见"未单独验）—— 收敛时机：本任务第一次改技能内容时**顺带观察**（规则侧已证实即时）
- **H1–H4**（无仓库的自建技能仍裸奔 / 技能目录里的 lessons / KB 无备份 / KB 缺并发写保护）—— 出处：architecture §10

## 开工前先做

1. `git -C D:\Seed\retro-skills status --porcelain -uall`、`git -C D:\Seed\my-rules status --porcelain -uall`（确认仍是零提交、未提交面未变）；`cd D:\Seed\retro-skills` 跑 `node --test scripts/sync.test.mjs`（应 **14/14**）与 `node scripts/sync.mjs`（应"全部一致"）
2. 读 `D:\Seed\retro-skills\docs\architecture.md`：先 §8（执行顺序）→ §11（已裁定的 backlog）→ §3/§5/§6（本任务的依据）
3. 读 `~\.trae-cn\skills\multi-lens-review\SKILL.md` 的「复盘回流（评审飞轮）」节 + 同目录 `lessons.md` 全文（要抽离的原始素材）
4. 读 `D:\Seed\retro-skills\skills\retro-institutionalize\SKILL.md` 全文（要加转发闸门的技能）
5. 进 brainstorming，先澄清"开放问题"节的三条

## 开场话术

读 D:\Seed\retro-skills\docs\handoffs\2026-09-28-evolving-skills.md，按交接词继续：实现 evolving-skills（第 2 步 C2+A1）。注意：两个仓库都还是零提交，先按"开工前先做"第 1 项处理。
