# 复盘体系架构（architecture）

> 本文是 spec 的**上层视图**：描述"这套体系由哪些部分组成、各部分职责、数据怎么流、什么能动什么不能动"。
> 收拢自 2026-09-27 的体系设计对话，**不替代**已有 spec（`docs/superpowers/specs/2026-09-27-retro-suite-design.md`）。
> 本文**中立描述**，可被多个仓库引用（my-rules 的 README、项目交接词、KB 的索引都可能指向它）。
> 待验证项 / 隐患 / 评审 backlog 等**过程史**已拆至 `docs/architecture-history.md`（见 §9）。

## 1. 一句话

把「开发中踩的坑」变成「下次不再踩的规范」的闭环，**并且这个闭环能自我进化**。

## 2. 三件套定位（谁是核心）

核心不是某个项目，是**那条闭环本身**。按"谁被谁共享读写"拆开：

| 组件 | 角色 | 管什么 | 住在哪 |
|---|---|---|---|
| **KB（错题集）** | **心脏**——唯一被所有环节读写的公共数据层 | 所有教训（数据） | `D:\Seed\lessons`（**特意不做 git**） |
| **retro-skills** | **引擎**——驱动逻辑 | 发现 → 分析 → 落地的流程 | `D:\Seed\retro-skills`（git） |
| **my-rules** | **骨架**——规范的"源" | 全局规范（成品） | `D:\Seed\my-rules`（git） |
| 项目仓库（lpm 等） | **客户** | 项目规范（跟项目走） | 各自仓库 |

**关键**：KB 是纯数据，不能承载"体系该怎么运转"（那是逻辑）→ 所以**体系架构文档的家在 retro-skills**，不在 KB。

**两仓分工（2026-10-01）**：**lessons（KB）管「裁决」**——翻历史账、定频率与危害、决定"要不要落地、落成什么"；**retro-skills 管「施工」**——真正改 skill / 写 rule、过 git、可回滚。两仓只通过**条目 ID** 对接。**贯穿原则**：系统只"提醒收集 / 自动记账"，**「改」永远由用户在 lessons 发起**（详见 `docs/superpowers/specs/2026-10-01-retro-self-improvement-design.md`）。

## 3. 四层架构

```
L1 错题集层（数据在哪）
    D:\Seed\lessons\
    ├── index.md              全局索引 + 候选与推迟表
    ├── projects\<项目名>\    **session 目录** `<日期>-<sid>[-<摘要>]\`（内含 facts.md / userwords.md / moments.md，analyze 后加 retro.md）+ ledger.md / ledger-archive-<年>.md
    ├── skills\<技能名>\      技能教训（✅ 已建成 2026-09-28；multi-lens 已收编 2026-09-29）
    └── universal\            跨项目通用（已建成）
    + 指针 ~\.agents\lessons.config.json
    + lessons.mjs（sid / resolve / deferred / stats / migrate / moment add|resolve|drop / show / find）

L2 复盘层（怎么发现问题）——已建成
    using-retrospective（入口/路由）
    retro-collect（纯事实）
    retro-analyze（问题/根因/维度/优先级）

L3 载体进化层（怎么改它们）——✅ 已建成（2026-09-28）
    通用协议：先升级不新增 → 四归因 → 攒批 → 独立 agent 合并 → 体积守卫 → 验证
    ├── retro-institutionalize：落 rule / memory / 自动化（已建成；skill/修订类改动转发 evolving-skills）
    ├── evolving-skills：改 skill 本体（✅ 已建成 2026-09-28）
    └── 每种载体的"差异卡"（✅ 已建成 2026-09-28：card-rule / card-skill / card-automation）

L3.5 验证层（怎么知道改对了）——🆕 2026-10-01
    retro-verify：已落地载体的有效性（复发率 + 机会数 → 5 档；对账事前预期；无效 / 更差 → 回退 + 回炉，回退走用户确认）
    算数：lessons.mjs 的 `verify score|trend|expect`（KB 解析唯一处）

L4 仓库与安装层（东西放哪、怎么生效）——✅ 已通（见 §8.1）
    ├── 项目 rule：跟项目走（.trae\rules\）——零改动
    ├── 全局 rule：源 my-rules → 运行时 ~\.trae-cn\user_rules\（符号链接；条数见 §8.1）
    ├── 自有 skill：源 retro-skills → 运行时 ~\.trae-cn\skills\（junction）
    └── 第三方 skill：不进化，教训降级成 rule（【缺】闸门）
```

### 3.1 飞轮新增机制（2026-10-01）

| 机制 | 住哪 | 作用 |
|---|---|---|
| **情绪锚点（moment）** | `projects\<项目>\<日期>-<sid>[-<摘要>]\moments.md` | 当场自动记「用户不爽 / 认可 / 认知倾向」；带 session·message 锚点 + 自带快照（原话）；**只收集、不分析**；结案由用户触发；**collect 时按当前公式重扫覆盖本 session**（`moment drop` + `add`，不留旧版）。条目 id `M-<sid>-<N>` |
| **用户画像** | `~\.trae-cn\memory\user_profile.md` | 从情绪点 + 提问/回答提炼「在意什么、怎么判断」；每条结论**引原话证据**；提炼在 lessons 落地分析时做 |
| **体积治理** | 各区 ledger | 热冷分层（`open` 留主账 / `landed` 归档 `ledger-archive-<年>.md`）；主账超阈值（>100 行 或 open>20）时**提醒尽早复盘收口** |
| **巡检扩展** | `lessons.mjs deferred [--project]` | 会话开始报「推迟项 / 未结案情绪 N 条 / 画像 X 天未更新」——**只报告收集侧，绝不追问落地** |
| **验证环（`retro-verify`，🆕 2026-10-01）** | `retro-skills\skills\retro-verify\` | 已落地载体**有没有效**：复发率 + 机会数 → 5 档；对账事前预期；无效 / 更差 → 回退 + 回炉 |

> 情绪锚点与画像的详规见 `docs/superpowers/specs/2026-10-01-retro-self-improvement-design.md`；战略全图见 `docs/superpowers/specs/2026-10-01-retro-flywheel-blueprint.md`。

## 4. 单向数据流（体系公理）

> **运行时目录全是只读的。唯一的编辑点是源仓库。更新 = 改源 → 跑同步 → 运行时被刷新。**
>
> **CLI 化修订（2026-09-28，`aas`）**：运行时目录**禁止人手改**这条不变；新增的"安装形态"（`aas add` 从远端仓库装）由**工具写入**运行时，且在 `~\.aas\installed.json` 留账——一切写入都经工具、有账可查，公理的精神不变。
>
> **公理升格为规则（2026-10-02）**：本公理原先只写在文档里，而 agent 每次对话只被注入运行时那一侧、够不到源侧约束——实测已发生 `rule-global-ask-before-acting.md` 建在源里却长期未同步、一次都没生效。现由全局规则 **`my-rules\rules\rules-single-source.md`** 承载（新建只建源 / 改已有内容改源即生效不用同步 / 新增删除后必跑 `aas sync` / 收尾跑 `aas` 体检），KB 条目 `L-020`。

```
源仓库（唯一编辑点）                      运行时（只读，只被同步写入）
  my-rules            ──同步──►  ~\.trae-cn\user_rules\
  retro-skills        ──同步──►  ~\.trae-cn\skills\
  项目仓库            ──天然──►  <项目>\.trae\rules\   （本来就在项目里，零改动）
```

**直接改运行时的三种真实后果**：

| 直接改哪里 | 后果 |
|---|---|
| `user_rules\` 里的规则 | 会生效，但不在任何 git 里 + 等同步一到就被冲掉 → **白改 + 丢改动** |
| `~\.trae-cn\skills\` 里的副本 | 同上：会生效，但重装/同步时**静默覆盖** |
| `~\.agents\rules\` | **真的不生效**（Trae 不读这个目录）——已实测，本项目有 2 条死规则就是这么来的 |

## 5. 可进化的前提（硬约束）

> **可进化的前提是有源仓库。没有 git = 改坏了退不回去 = 不许进化。**

由它直接推出三条：

1. **第三方技能不可进化**——就算改了本地文件，`skills update` 会按源重放、**静默覆盖**（锁文件里有每个技能的文件夹哈希）。第三方教训**降级成 rule**（rule 是我们自己的地盘，不会被冲掉）。
2. **无仓库的自建技能属于"裸奔"**——已无实例：`multi-lens-review`、`prd-to-specs` 均于 2026-09-29 收编进本仓库 `skills/`（无版本、无回滚、丢盘就没的风险已解除）。
3. **技能目录里不放 lessons**——隐私风险（技能发布 = 教训一起发布）+ 发布物应纯净。教训一律进 KB。

## 6. 处置盘点

### 抽离（2）

| # | 抽什么 | 从哪 → 到哪 |
|---|---|---|
| A1 | **通用进化协议** | multi-lens 的私有做法 + institutionalize 的骨架 → 住进 `evolving-skills` 的文件夹（协议的家）；institutionalize 只留决策树 + 转发 |
| A2 | **multi-lens 的 lessons（11 条）** | 它目录里的 `lessons.md` → KB 的 `skills\multi-lens-review\`（✅ 已迁 2026-09-28；运行时原文件已随收编删除 2026-09-29） |

> **为什么协议的家必须在技能文件夹里面**：安装的原子单位是 `skills\<名>\`，只有这个文件夹会跟着走。协议放仓库根的 `docs\` 会随安装丢失。所以别的技能用**技能名**引用它。

### 合并（3）

| # | 合什么 | 成什么样 |
|---|---|---|
| B1 | KB 三个区（projects / skills / universal） | 同一张表、同一套编号 → **一个巡检命令管全部**（✅ 表口径已统一 2026-09-28；2026-10-01 删除冗余「对象」列；巡检命令属 KB 候选 C2，信号未到） |
| B2 | multi-lens 的自记机制并入体系 | 它不再写自己的 `lessons.md`，改写 KB（其 SKILL.md 的指引随收编一起改） |
| B3 | 装侧漂移检查合成一个模式 | skills 和 rules 用同一套"清单 + 哈希 + 检查" |

### 新建（4）

| # | 建什么 | 说明 |
|---|---|---|
| C1 | **my-rules 仓库** | ✅ 已建（见 §8.1） |
| C2 | **evolving-skills** | retro-skills 第 6 个技能：协议的家 + skill 差异卡（✅ 已建成 2026-09-28；设计见 `docs\superpowers\specs\2026-09-28-evolving-skills-design.md`，实施见 `docs\superpowers\plans\2026-09-28-evolving-skills.md`） |
| C3 | **KB 的 skills\ 区** | B1 的落地（✅ 已建成 2026-09-28） |
| C4 | **同步 / 体检脚本** | ✅ 已建，**只有一份**，同时管 rules 与 skills。（原计划"各仓库写两份"，实际证明**一份足够**——它就是一张"源 → 目标"映射表）。**2026-09-28 已抽成独立项目 `agent-assets-sync`** 并改成配置驱动（`sync.config.json`），见 §8.1 |

### 不动（防过度重构）

项目 rule（跟项目走）、第三方 skill（教训降级成 rule）、retro 前三个技能、**第三方技能内部的 `rules\` 素材**（如 Vercel 的 react-best-practices，是技能按需读的字典，收编会让每次对话都吃一整本字典）。

## 7. 仓库清单

| 仓库 | 状态 | 放什么 |
|---|---|---|
| `retro-skills` | ✅ 已建（GitHub 远程） | 复盘技能套件 + 本文档 + evolving-skills（2026-09-28 建成，见 §6 C2）。**同步脚本已于 2026-09-28 搬出**（见下） |
| **`agent-assets-sync`** | ✅ 已建（git + GitHub 远程） | **同步 / 体检 / 安装 CLI `aas`**（独立项目、配置驱动：`sync.config.json` + 安装账本 `~\.aas\`；命令全集见 §8.1） |
| **`my-rules`** | ✅ 已建（git + GitHub 远程） | 全局 rule 的源（在**中立目录** `rules\` —— 目录名不含工具名，为"换编辑器"解耦；见 §8.1） |
| 项目仓库（lpm 等） | ✅ 已有 | 项目 rule 跟项目走，**不建新仓库** |
| **KB（`D:\Seed\lessons`）** | ⛔ **特意不建 git** | 数据层、含个人记录，不跟任何仓库走；备份挂账 |
| multi-lens / prd-to-specs 的收纳仓库 | ✅ 已收编 | multi-lens 收编 2026-09-29（入 `skills/multi-lens-review/` + junction）；prd-to-specs 收编 2026-09-29（入 `skills/prd-to-specs/` + junction） |

## 8. 执行顺序（按"哪个最疼"排）

```
✅ 0. ais 实测 → 已实测完成：ais 不可用（见 `architecture-history.md` §9.1），最后一公里自建
✅ 1. C1 my-rules bootstrap + C4 同步/体检脚本 → 已完成（见 §8.1）
✅ 1.5. C4 抽成独立项目 agent-assets-sync + 配置驱动 → 已完成（2026-09-28，见 §8.1）
✅ 2. C2 + A1（evolving-skills + 协议抽离 + institutionalize 加转发闸门）→ 已完成（2026-09-28，见 §6 C2）
✅ 3. C3 + A2 + B1（KB skills 区 + multi-lens 迁移 + 三区合一）→ 已完成（2026-09-28，spec：docs\superpowers\specs\2026-09-28-evolving-step3-design.md）；其中收编 multi-lens → ✅ 已完成（2026-09-29：反向建仓入本仓库 `skills/multi-lens-review/`（第 0 版 `7379a06`）+ SKILL.md 回流节替换为转发（`bb1e776`）+ aas 接管换 junction（体检已就位 8）+ 运行时 lessons.md 删除）
   4. B3 + 轮询规则改版（收口时机 + 没事不出声）
```

### 8.1 已完成：my-rules + 同步脚本 + 测试（2026-09-28；脚本当晚搬入独立项目 `agent-assets-sync` 并 CLI 化为 `aas`）

| 落地物 | 位置 |
|---|---|
| 全局规则源 | `D:\Seed\my-rules\rules\`（**中性名，不带工具名**；条数以体检输出为准，见下） |
| 源仓库说明 | `D:\Seed\my-rules\README.md` |
| **同步 / 体检 / 安装 CLI（独立项目）** | `D:\Seed\agent-assets-sync`（命令 `aas`；**配置驱动**：源 / 目标 / 命名规则 / 编辑器适配器在项目根的 `sync.config.json`；安装账本在 `~\.aas\installed.json`；设计见其 `docs\design.md` 与 `docs\cli-design.md`） |
| **CLI 的测试** | `D:\Seed\agent-assets-sync\test\`（`node --test` 全套 69 个，全绿） |

**用法**（`npm link` 或 `npm run localg` 注册命令后，任意目录可跑；细节见 `agent-assets-sync\README.md`）：

```
aas                        体检：链接形态 + aas 安装形态一起查（默认，绝不改动任何东西）
aas sync [--replace] [--rm-old]   同步：只建"缺失的链接"；删类动作要显式 flag；账本条目受豁免不删
aas add <源> [名...]        从远端/本地源安装规则/技能（多选标注已装；记录原名→运行时名映射）
aas update [名] [--all]     按账本刷新已装条目（也是缓存漂移的修复入口）
aas remove <名> [--purge]   按账本摘除并销账（非交互必须 --yes）
aas import <名>             把编辑器里手建的条目收编进源仓库（接管需再跑 aas sync --replace）
aas list / aas editors      只读：列条目 / 列编辑器
```

**安全默认（重要）**：`aas sync` **只建缺失的链接**；`add/update` 静默执行但撞已存在条目时非交互默认跳过；`remove` 删东西必须显式（交互确认或 `--yes`）。退出码 0/1/2 全命令统一。

**前置条件（换机器时照这个清单核）**：

1. **Windows 开发者模式**——**只有"规则"这一侧需要它**（规则是 file symlink，靠它）；**技能侧用的是 junction，不需要**。本机已开
2. Node ≥ 20（aas 的 engines 要求；本机 v22.12.0 已验证）+ git 在 PATH + npm（装命令用）
3. 路径**全在配置里，不用改代码**：默认见 `D:\Seed\agent-assets-sync\sync.config.json`（源 `D:\Seed\my-rules\rules` ＋ `D:\Seed\retro-skills\skills`；编辑器适配器与源登记也在里面）；换机器 / 别处 clone 时用环境变量覆盖 —— `MY_RULES_SRC` / `RETRO_SKILLS_DIR` / `TRAE_RULES_DST` / `TRAE_SKILLS_DST`（变量名与路径的绑定写在配置的 `env` 字段里，换编辑器可一并换名）
   - **仓库搬家** → 改配置里的 `srcDir`（或设 `MY_RULES_SRC`）
   - **换编辑器** → 改/加配置里 `editors` 的适配条目（目录 + 命名模板），**源文件一个字不用动**
   - **添新的源仓库**（如将来收编 multi-lens）→ 在配置的 `linkTargets` 里**加一条**
4. 依赖（2026-09-28 放开零依赖，用户拍板）：Node 内置之外只引 **commander**（子命令）+ **@inquirer/prompts**（交互问询），另用系统 **git** 做远端 clone；`package.json` `private: true`（不发 npm 仓库，R31）

**运行时的实际形态（已实测，条数取脚本输出）**：

| 目标 | 形态 |
|---|---|
| `~\.trae-cn\user_rules\rule-<名字>.md` | 全部是 **SymbolicLink** → `my-rules\rules\<名字>.md`（取数：跑 `aas` 体检的"已就位"数，**不在此写死数字**；另有 **aas 安装**形态条目——经 `aas add` 从远端仓库装的，账本豁免不计入孤儿） |
| `~\.trae-cn\skills\<技能名>\` | 本仓库自有技能 **Junction** → `retro-skills\skills\<技能名>\`（条数取 `aas` 体检输出；`ais`/`skills` 装的第三方技能不在本脚本管理面内，报告里列为"孤儿(不动)"） |

**所以"改源即生效"**：改 `my-rules` 里的规则，下次对话就是新的；改 `retro-skills` 里的技能同理。**不要在运行时目录里改**（那会丢）。

> **证据边界（别扩大理解）**：实测确认过"链接**能被读到**"（规则侧更强：新加的规则**在当前会话内就被注入**了——2026-09-28 亲历）。**"改了技能内容后是否即时可见"已验（2026-09-29，见 `architecture-history.md` §9 V6）**：新对话正常触发 managing-lessons-store，其正文含 `7e8a1e5` 新增的 stats 命令说明。

**回滚怎么做**：

- **想撤销某条链接**：直接删掉 `~\.trae-cn\user_rules\` 或 `skills\` 里那一项即可（删链接不会碰源）
- **想把运行时恢复成"真实文件副本"**：从源仓库复制回去，再删链接
- **同步出错后**：脚本是幂等的，**重跑一次就收敛**（不会卡在中间态）

**如果误跑了 `npx skills add` / `skills update`（混用）怎么办**：

1. **怎么发现**：跑 `aas` 体检 —— 它会报"真实副本（内容已过时/一致）"，那就是链接被换成了副本
2. **怎么修**：`aas sync --replace` 换回链接
3. 为什么禁止混用：见 `architecture-history.md` §9 V3
4. ⚠️ **混用的真实风险（2026-09-28 已实测，比原先的担心轻）**：
   - **实测结论**：`skills update` **只动它锁（`.skill-lock.json`）里的技能**。我们那 5 个是**手工 junction 接的、不在锁里** → 它**根本不碰**（实测：跑完 `Updated 18 skill(s)`，全是第三方远端技能；我们 5 个的**源聚合哈希未变**、junction 仍是 junction（当时 5 个）
   - **附带发现**：**本地路径**安装**不写锁**（所以那类安装也不被 `update` 管）；**远端**安装会写锁、且用 **junction**（指向 `~\.agents\skills\<名>` 这个"总库"）
   - **残余风险（精确版）**：将来你把 retro-skills 发到 GitHub、再用 `skills add` 装它 → 会产生锁条目 → 之后 `update` 可能把我们的 junction **换成"指向它总库"的链接**（= 不再指向你的源、失去即时同步）。**可检测**（`sync.mjs` 会报"链接指向别处"）**可恢复**（`--replace`）→ **不是不可逆**
   - **仍然建议**：别对同一批技能混用两套机制（两套都在管 = 第二份真相）

**什么时候该跑这个脚本**（否则它会变成"想不起来跑"的摆设）：

- **阶段收口时**跑一次（你本来就在看全局，成本摊没）
- **感觉"规则/技能行为不对"时**跑一次（它就是诊断入口）
- 候选：做成一条常驻规则、由"收口"触发（触发信号：忘记跑导致真的踩坑 ≥ 1 次）

**评审记录**：2026-09-28 用 `multi-lens-review` 审过本文档，**已跑 4 轮**（第 1 轮 2 矛盾 + 8 盲点 + 10 优化 → 第 2 轮零新增 P0/P1 → 第 3 轮 1 盲点 + 7 优化，归因"修复引入" → 第 4 轮 1 矛盾 + 3 优化，归因"流程缺失"，已加检查点规则）。处置见 `architecture-history.md` §11。

## 9. 历史记录（已拆出）

§9 待验证项（V1–V6）、§9.1 ais 实测、§10 已知隐患（H1–H5）、§11 评审 backlog（R1–R34，4 轮）的完整记录已拆至 **`docs/architecture-history.md`**（2026-09-29 拆分，内容原样保留）。

本文档只保留体系设计（§1–§8）与关键裁决；追查某条验证 / 隐患 / 评审结论的来龙去脉时读史档。
