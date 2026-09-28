# Session 交接：复盘体系 → 抽取独立同步 CLI（agent-assets-sync）（2026-09-28）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-09-28 15:48（Asia/Shanghai） |
| 项目根 | `D:\Seed\retro-skills`（**新 session 的工作区也选它**）。参与仓库：`D:\Seed\my-rules`、`D:\Seed\lessons`（KB）、`local-pack-manager`（仅旁观，勿动） |
| HEAD / 未提交面 | **以开工时实跑 `git -C <仓库> status --porcelain -uall` 为准**（本文档写完后又新建了本交接词，条数必然已变）。写作时（15:48）为：`retro-skills` = `fb439a0`（已提交）+ 3 条未提交（`architecture.md` / 旧交接词 / `sync.mjs`）；`my-rules` = **零提交**（10 条）；`local-pack-manager` = `cb1e0e0` + 21 条（其中 18 条是 **S8 在途，勿动**）。**新增：`D:\Seed\agent-assets-sync` = 零提交、空目录**（本次任务的目标仓库，用户 2026-09-28 已建好，远程 `SeedHuang/agent-assets-sync`） |
| 验证基线 | **本仓库非代码库**，基线 = 脚本测试 **14/14**（`node --test scripts/sync.test.mjs`）+ 同步体检 **"全部一致"**（`node scripts/sync.mjs`：规则"已就位 9"、技能"已就位 5"）（**15:48 实跑**） |
| 继任自 | `docs/handoffs/2026-09-28-evolving-skills.md`（那份把 `evolving-skills` 当本次任务；本条**改序**：先做 CLI 抽取） |
| 状态 | 有 **1 个**开放问题（走轻量还是完整流程）—— 不阻塞开工 |

## 项目定位

`D:\Seed\retro-skills` —— 复盘套件的主仓库（5 个技能 + 同步脚本 + 体系架构文档）；与 `D:\Seed\my-rules`（全局规则源）、`D:\Seed\lessons`（错题集 KB）一起构成"开发踩坑 → 变成规范"的闭环。**本次把其中的同步脚本抽成独立项目。**

## 现状

- **已完成**：L1 数据层（KB）｜L2 复盘层（5 技能）｜L4 仓库与安装层（规则 9 条符号链接 + 技能 5 个 junction，全部实测一致）
- **布局刚变更（R29）**：规则源从 `.trae\rules\` 改成**中立的 `my-rules\rules\`**（为"换编辑器"解耦）；运行时 9 条链接已自动重建 ✓
- **验证证据**：见元信息表『验证基线』（单源，不在此重复）
- **提交状态**：`retro-skills` 已提交（`fb439a0`）+ 少量未提交；`my-rules` 零提交（详见元信息表）—— **全部由用户自行 commit**
- **工作树异常**（两条）：
  1. `my-rules` **零 commit** → architecture §5 的"可进化前提＝改坏能回退"对它**还没成立**（建议顺手提交一次）
  2. `local-pack-manager` 有 **S8 并行 session 的在途改动**（条数见元信息表）—— 与本任务无关，**不要触碰**

## 过程记录

- **体系总图 + 全部裁决**：`D:\Seed\retro-skills\docs\architecture.md`（先读 **§8.1** 同步脚本现状与用法 → **§11** backlog R1–R35 → §4 公理 → §9 待验证）
- **上一份交接词**：`docs\handoffs\2026-09-28-evolving-skills.md`（本次任务的动因、以及 `evolving-skills` 的全部待办都在那份里）
- 套件 spec / plan：`docs\superpowers\specs\2026-09-27-retro-suite-design.md`、`docs\superpowers\plans\2026-09-27-retro-suite.md`
- 复盘账本：`D:\Seed\lessons\index.md`、`D:\Seed\lessons\projects\local-pack-manager\`

## 本次任务

**把同步脚本从 `retro-skills\scripts\` 抽成独立项目 `agent-assets-sync`（仓库已建好），并改造成"配置驱动"**。
流程：写文件 → 跑测试 → **在新项目里跑真实同步，必须报"全部一致"** → 删 `retro-skills\scripts\` + 改文档指路 → 用户提交。
起点：确认"开放问题"第 2 条（走轻量还是完整流程）。

## 范围依据

- **要读（要搬的主体）**：`D:\Seed\retro-skills\scripts\sync.mjs`（**先通读全文**）+ `scripts\sync.test.mjs`（14 个用例，一并搬）
- **要读**：`architecture.md` §8.1（用法 / 前置条件 / 运行时形态）+ §11（R11 已落地；R29/R30/R33/R35 待办）
- **要读**：`my-rules\README.md`（已写好的「安装与同步」一节 —— 搬完要同步改其中的脚本路径）
- **勿重做**：布局中立化（R29 已完成）；规则 9 条与技能 5 个的链接（已就位、体检一致）

### 设计（已与用户讨论定型，照此实施——**目的：换编辑器只改配置，不碰代码**）

```
D:\Seed\agent-assets-sync\
├── README.md
├── sync.config.json      ← 默认配置（把现在硬编码在脚本里的两个 TARGET 移进来）
├── src\sync.mjs          ← 从 retro-skills 搬来 + 改成配置驱动
├── test\sync.test.mjs    ← 14 用例平移 + 补 CLI 参数解析测试（顺带结掉 R33）
└── docs\design.md        ← 轻量设计记录
```

`sync.config.json` 形状（`dstName` 用模板串，`{name}` 代源文件名）：

```json
{ "targets": [
  { "label": "全局规则", "srcDir": "D:/Seed/my-rules/rules", "dstDir": "~/.trae-cn/user_rules", "dstName": "rule-{name}", "level": "file" },
  { "label": "技能", "srcDir": "D:/Seed/retro-skills/skills", "dstDir": "~/.trae-cn/skills", "dstName": "{name}", "level": "dir" } ] }
```

- `--config <路径>` 指定别的配置（别人可带自己的）；环境变量仍可覆盖（`MY_RULES_SRC` / `RETRO_SKILLS_DIR` / `TRAE_RULES_DST` / `TRAE_SKILLS_DST`）
- **先不发布 npm**（`git clone` + `node` 即可用）；"发 npm 一键装"见 R31 / R35
- **命名必须中性**：它同时管 rules 与 skills，叫 `my-rules-cli` 名不副实

## 开放问题

1. **项目名 → 已定（2026-09-28）：`agent-assets-sync`** ✓ —— 用户已按此名建好仓库：`D:\Seed\agent-assets-sync`（git 已初始化、分支 `master`、远程 `git@github.com:SeedHuang/agent-assets-sync.git`、**零提交、空目录**）。**不必再问** ✓
2. **走轻量走法，还是完整 spec → plan → SDD**？推断：**轻量**（依据：本次是"搬家 + 配置化"、**零新逻辑**，行为应保持不变——而"新项目跑出全部一致"就是它的验收）。请用户确认
3. **（已定，不要再问）** 先 CLI 抽取、后 `evolving-skills` —— 用户 2026-09-28 拍板；理由：`scripts` 要搬家，先做 evolving-skills 会让文档改两次

## 既定约束（不要重新讨论、不要重新选型）

- **运行时目录只读**；唯一编辑点是源仓库；改完跑同步 —— architecture §4（体系公理）
- **搬运期间行为必须不变**：验收 = **新项目跑出"全部一致"**（运行时状态一个字不该变）+ 14 用例全绿 —— 依据：本次是零新逻辑的抽取
- **必须"先在新项目里跑通并确认全部一致"，才允许删 `retro-skills\scripts\`**（顺序不能反）
- **不与 `npx skills add` / `update` 混用**同一批技能 —— architecture §9 V3 / V5
- **零第三方依赖**（继续只用 Node 内置）—— architecture §8.1 前置条件第 4 条
- **不碰 `local-pack-manager`**（那里有 S8 并行 session 的在途改动）

## 遗留裁决与留观项

- **R33**（CLI 参数解析缺测试）—— 本次**顺带结掉**（搬测试时补）
- **R30 / R35**（`add`·`import`·`remove`；独立项目本身）—— 触发信号见 architecture §11
- **R20（重开）**（编号可读性，信号已触发）—— 收敛时机：本次若编辑 §11 便顺手
- **V6**（"改了技能内容后新对话是否即时可见"未单独验）—— 本次**不涉及技能内容**，留给 `evolving-skills` 那次顺带观察
- **H1–H4** —— architecture §10

## 开工前先做

1. `git -C D:\Seed\retro-skills status --porcelain -uall`、`git -C D:\Seed\my-rules status --porcelain -uall`（确认未提交面，别照抄元信息表里的旧数字）；`cd D:\Seed\retro-skills` 跑 `node --test scripts/sync.test.mjs`（应 **14/14**）与 `node scripts/sync.mjs`（应"全部一致"）
2. 读 `D:\Seed\retro-skills\scripts\sync.mjs` **全文** + `scripts\sync.test.mjs` 全文（要搬的主体）
3. 读 `D:\Seed\retro-skills\docs\architecture.md` 的 §8.1 与 §11（重点 R29 / R30 / R33 / R35 行）
4. 读 `D:\Seed\my-rules\README.md`（搬完要改它的「安装与同步」一节里的脚本路径）
5. 向用户确认"开放问题"第 2 条（走法），然后在 `D:\Seed\agent-assets-sync`（**已建好：git 已初始化、`master`、远程已配、零提交、空目录**）里直接写文件 —— 不必再建目录、不必再问名字

## 开场话术

读 D:\Seed\retro-skills\docs\handoffs\2026-09-28-agent-assets-sync.md，按交接词继续：把同步脚本抽成独立的 agent-assets-sync 项目并改成配置驱动。先按"开工前先做"第 1 项核基线，然后问我"开放问题"第 2 条（走轻量还是完整流程）。
