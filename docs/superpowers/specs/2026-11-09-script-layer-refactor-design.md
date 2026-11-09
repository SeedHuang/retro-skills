> split from `docs/prd/20261109211349-script-layer-refactor/index.md` (2026-11-09)

# 脚本分层与运行期收口 — 技术设计

> **范围**：PRD §10 的 F-01 ~ F-04（S1–S4）。S5 不在本 spec。
> **双份真相**：PRD 的 P1–P7 / D1–D16 / V1–V11 只活在 PRD，本文件只引用编号，不抄写。
> **状态**：草稿（待议会 #2）｜**作者**：主 agent｜**日期**：2026-11-09

## 1 为什么

用户 2026-11-09 两次纠偏，原话：

1. 「我没看到里面有哪些是需要迁移到 scs 里面的，也就是 `D:\Seed\skill-common-script`，这个是为什么？」——首版 PRD 只分了「住本仓哪一层」，没问「该不该住本仓」。
2. 「可以，但还是要建立 spec 和 testcase，和 plan，要按照这个来」——本 spec 是三件套的第一件。

已发生的事故：2026-11-08 两次迁移（`ed7b40c` 公共脚本迁出、`fa5f7eb` 判据 DSL 迁入 `tools/docgen/`）之后，`stage-2b-testcase-sdet.md` 的 170 条用例仍写着 `scripts/check-criteria-engine.mjs` 与 `tools/quality/criteria-engine/`，两路径实测均不存在（PRD §2-17~19）。本 spec 的第一目标不是「再迁一次」，而是**迁移不再打断测试**。

### 1.1 术语（中途进入也能读）

| 术语 | 一句话 |
|---|---|
| layer | 命令的生命周期层：`build` 构建期 / `dev` 开发期 / `run` 运行期 |
| verb | 命令组里的一条具体命令字符串（如 `scs time`） |
| 命令组 | 卡面授权单位；按 `commandGroups` 的组名授权，不按 verb 授权 |
| C2 / C5 | `scs ledger numbers` 的两项检查编号：C2 卡片实数校准、C5 终态对账 |
| landings | `scs check landings`：核对账本里的 `path:line` 是否真实存在 |
| refs / files | landings 输出里的引用条数 / 被扫描的账本文件数 |
| cwd | 当前工作目录 |
| baseline | 迁移前跑旧脚本存下的契约快照（`migration-baseline.json`） |
| fallback | 技能被拷走时使用的兜底实现（与单源同语义，有差分用例） |
| `RE_CARD` | `ledger-numbers.ts` 里识别卡片标题 `#### XX-1-01 【P0】` 的正则 |
| `RE_ARITH` | `ledger-numbers.ts` 里识别「N 张（卡级 P0 a / P1 b / P2 c）」声明的正则 |
| token | landings 从账本里抽出的 `path:line` 片段 |

## 2 核心决定（不可违反）

| # | 决定 | 为什么 |
|---|---|---|
| R1 | `layer` 标在**命令组**上，一组只装一个 `layer`；混装组必须拆。缺标 / 混装 = 构建期红 | 卡面的授权单位是组名（`renderBoundary.mjs:72` 只渲染组名）。verb 级标注拦不住整组授权：`check.local` 5 条里 4 条开发期 + 1 条运行期，不拆就会把 `npm run check` 一起授给 agent |
| R2 | 组拆成 4 个：`repo.check`(dev, 4 条) / `tool.time`(run, 1 条) / `git.read`(run, 5 条) / `docgen.read`(build, 4 条) | 现有 `check.local` 是混装组（PRD §3.3 D7）；拆法按 `commands.mjs` 现有 14 条 verb 的实际用途 |
| R3 | 卡面只渲染 `layer=run` 的组；席位若配了非 run 组，**构建期抛错**，不静默过滤 | 静默过滤会让席位配置看起来生效、实际没生效；错误必须在生成卡之前暴露 |
| R4 | 席位配置：`reviewer-audit` / `detective-observer` / `speaker` = `git.read` + `tool.time`；`respondent-dev` = `git.read`；其余空 | PRD D4 / D6：仓内自检与生成命令不属本席权限 |
| R5 | `scs ledger numbers` 新增 C5：读 `round-check.md` 第 3 项证据栏一行 `已修=N 关闭=N 候选=N 升级=N 带往下轮=N`，求和与 `cards.md` 卡片数比对；**缺行只 WARN**，有行且不等才 FAIL | 模板现在只有散文（`round-check.md:14`），不可机判；旧账本没有该行，判红会造成历史账本批量假红 |
| R6 | C2 适配新增声明形态 `卡片数 N（P0 a / P1 b / P2 c）`；与原 `N 张（卡级 …）` 并存时按行去重，不双计 | 模板写的是「卡片数」，`ledger-numbers.ts:129` 只认「卡级」+「张」，原正则读不到 |
| R7 | `--root` 一律 = **项目根**；数据根用 `--data` / `--engine` / `--projection`；账本目录用 `--ledger` | sdet 的 170 条用例已因 `--root` 语义漂移失效一次（其 §1 说 `--root` 只改数据根，scs 的 `--root` 是项目根） |
| R8 | 迁移冻结三类契约：命令（exit code / 目标 code 串 / 首末行）、路径（数据根、产物路径）、参数语义；迁移交付物含「旧路径 → 新命令」映射表 | PRD D15；不冻结就会重演 `ed7b40c` 的断链 |
| R9 | #7 证据重放不实现；`scs` 只做 `path:line` 存在性 | 全局 CLI 不执行任意命令（PRD D13） |
| R10 | 新增门禁必须先有 testcase，本 spec 不拿验收项替代用例 | PRD D16；无 testcase 的门禁 = 假绿 |
| R11 | `scs` 命令的默认值不得指向具体仓布局；本仓必须在 `package.json` 显式传参 | `check-criteria-engine.ts:43-47` 的默认值就是旧仓布局，本仓迁走后已漂；默认值可覆盖但会静默错 |
| R12 | 本轮不改 `verbs` 的字符串形状（先加组级 `layer`）；verb 对象化另立 | 现有测试按字符串断言（`policy-pure-source.test.mjs:221` 等），改形状会制造大面积基线改动，与本轮目标无关 |
| R13 | `scs` 只接**命令形态**的工具；被 `import` 的库不迁 `scs`。`skill-dir.mjs` 保持本仓单源；`check.mjs` 迁走后，其兜底副本**随文件一并删除**（迁移前允许存在，是唯一例外） | 把同步函数调用改成 spawn CLI，会把「一次内存调用」变成「进程 + 解析 JSON」，增加延迟与失败面；库的单源问题用「删副本」解决，不用搬家 |

## 3 机制

### 3.1 命令组数据

`tools/docgen/builders/agents/policy/definitions/commands.mjs`：

```js
export const LAYERS = ['build', 'dev', 'run']

export const commandGroups = {
  'repo.check': {
    layer: 'dev',
    purpose: '本仓提交前自检：跑 check 与只读脚本，不改盘',
    verbs: ['npm run check', 'node scripts/check-all.mjs', 'node scripts/doc-name.mjs --check', 'node scripts/skill-dir.mjs'],
  },
  'tool.time': {
    layer: 'run',
    purpose: '平台工具链取数：只读，跨仓可用',
    verbs: ['scs time'],
  },
  'git.read': {
    layer: 'run',
    purpose: '只读 git 查询（status / diff / show / log / reflog show，禁 --output）',
    verbs: ['git --no-optional-locks status --porcelain', 'git --no-optional-locks diff', 'git --no-optional-locks show', 'git --no-optional-locks log', 'git --no-optional-locks reflog show'],
  },
  'docgen.read': {
    layer: 'build',
    purpose: 'docgen 只读子命令（gate / check-agents / diff / draft ls）',
    verbs: ['node tools/docgen/builders/agents/cli.mjs gate', 'node tools/docgen/builders/agents/cli.mjs check-agents', 'node tools/docgen/builders/agents/cli.mjs diff --kind agent --name <席>', 'node tools/docgen/builders/agents/cli.mjs draft ls'],
  },
}
```

校验（`validatePolicy.mjs`），条件与错误码一一对应：

| 条件 | 错误码 | 退出码 |
|---|---|---|
| 组缺 `layer` | `GroupLayerMissing` | 1 |
| `layer` 不在 `LAYERS` | `GroupLayerInvalid` | 1 |
| 同一组出现两个不同 `layer`（数据层写成数组时） | `GroupMixedLayer` | 1 |
| `verbs` 为空 | `GroupEmpty` | 1 |
| 同一 verb 出现在两个组 | `VerbDuplicated` | 1 |

报错格式：`<code>: <组名>[: <详情>]`，写 stderr 首个非空行；stdout 不得输出「看起来正常」的 dump。

### 3.2 卡面渲染

`renderBoundary.mjs` 的 `allowGroups(groups)`：

```js
// 渲染器只过滤、不判错（沿用 renderBoundary.mjs:60-61 既有分工：非法配置由 validatePolicy 统一发码）
const runGroups = groups.filter((g) => CMD.commandGroups[g]?.layer === 'run')
```

判错点改到 `validatePolicy()` 末尾：

```js
function validateSeatLayers() {
  for (const [seat, p] of Object.entries(SEAT_POLICY)) {
    for (const g of p.allowGroups ?? []) {
      if (CMD.commandGroups[g]?.layer !== 'run') fail('NonRunGroupGranted', `${seat}:${g}`)
    }
  }
}
```

- 六个新码（`GroupLayerMissing` / `GroupLayerInvalid` / `GroupMixedLayer` / `GroupEmpty` / `VerbDuplicated` / `NonRunGroupGranted`）必须登记进 `validateAgentData.mjs` 的 `EXIT` 表；未登记 → `exitCodeFor` 会抛「未知错误码」并被 CLI 兜底成 exit 2，冻结的 exit 1 失效。
- **所有会渲染或写盘的子命令**（`gate` / `draft` / `generate` / `replace` / `policy --dump`）必须先调 `validatePolicy()`，再渲染；只在 `gate` 校验会让 `draft` / `generate` 静默过滤后写盘。
- `draft` 的产物目录必须可由 `--drafts <dir>` 覆盖（不靠环境变量赋值；环境变量赋值在策略 `env.assign` 禁止组里，测试与 agent 都不得用）。
- 退出码：构建 CLI（`cli.mjs gate` / `draft` / `generate` / `replace` / `policy --dump`）统一 exit 1；错误写 stderr 首个非空行。
- stdout 不得输出「只少了该组」的 JSON；不允许把异常吞掉后继续渲染。
- 卡面句只列 `runGroups`；`dumpPolicy.mjs` 仍输出全量组 + `layer`，供审计核对。

### 3.3 席位配置

| 席 | allowGroups |
|---|---|
| `reviewer-audit` / `detective-observer` / `speaker` | `['git.read', 'tool.time']` |
| `respondent-dev` | `['git.read']` |
| 其余（含 `__default__`） | `[]` |

### 3.4 `scs ledger numbers` C5

- **输入**：`<ledger>/round-check.md` 中首列为「第 3 项」的表格行，其证据栏含一行：

```
已修=3 关闭=1 候选=0 升级=2 带往下轮=4
```

- **正则**：`/已修=(\d+)\s+关闭=(\d+)\s+候选=(\d+)\s+升级=(\d+)\s+带往下轮=(\d+)/`
- **算法**：五个数求和；与 `cards.md` 的卡片标题计数（沿用 C2 的 `RE_CARD`）比对。
- **失败面（文案逐字冻结）**：
  - `round-check.md` 缺失、或存在但没有第 3 项行 / 值不匹配正则 → `[WARN] C5 未取数（无第 3 项行）`，exit 0。
  - 有行且和不等 → `[FAIL] C5 终态对账不符：求和 S ≠ 卡片数 C`，exit 1。
  - `cards.md` 缺失 → `[WARN] 缺 cards.md（C5 已跳过）`，exit 0。
- **模板同步**：`outputFormats.mjs` 的 `round-check` docs 第 3 项证据栏加一句「写 `已修=N 关闭=N 候选=N 升级=N 带往下轮=N`」，`ledger.mjs --apply` 重生成 `skills/parliament-ledger/assets/round-check.md`。

### 3.5 C2 声明形态适配

新增正则 `RE_CARD_COUNT = /卡片数\s*(\d+)\s*[（(]\s*P0\s*(\d+)\s*\/\s*P1\s*(\d+)\s*\/\s*P2\s*(\d+)\s*[）)]/`，与原 `RE_ARITH` 的「卡级 + 张」分支并列；同一行只取第一个命中，不重复计数。

### 3.6 `scs check landings`

- **命令**：`scs check landings --root <项目根> --ledger <账本目录>`
- **参数语义**：`--ledger` **必填**，但由命令自行校验（不用 commander `requiredOption`），缺失 → exit 2，stderr 一行用法（含 `--ledger`）；`--root` 选填，默认当前目录；两者都按 **cwd** 解析（`--ledger` 不相对 `--root`）。
- **输入**：`<ledger>/round-check.md`（必需；缺失 → exit 2，报文 `不是账本目录（缺 round-check.md）：<dir>`）、`<ledger>/delivery-audit.md`（可选；缺失 → **stderr** `[WARN] 缺 delivery-audit.md`；stdout 只留计数行与 `landings ok`）。
- **token 正则**：`/([A-Za-z0-9_./\\-]+\.[A-Za-z0-9]+):(\d+)/g`；匹配前若紧邻 `://` 则跳过（URL 不是落点）。
- **判定**：路径按 `--root` 解析；文件不存在 → 缺失；文件行数 < N → 越界；两类都进 `missing`。
- **输出（单一冻结口径）**：
  - 首行恒为 `landings: missing N（files M / refs K）`；`M` = 被扫描的账本文件数（1 或 2，去重），`K` = 引用条数（去重）。
  - `N = 0` 时**第二行**（末行）输出 `landings ok`，exit 0；`N > 0` 时后续逐条列缺失，exit 1。
  - 参数错 / `--ledger` 指向的目录不存在 → exit 2，stderr 一行用法或带目录名的报文。
- **与 #7 的边界**：只判 `path:line`，不执行证据栏命令（R9）。

### 3.7 迁移映射

| 旧位置 | 新命令（名待 scs 仓定） | 冻结的契约（以旧脚本实测为准） | 已登记的契约变化 |
|---|---|---|---|
| `skills/skill-inspector/scripts/check.mjs` | `scs check skills --root <dir>` | exit **0 / 1**（旧脚本无 2）；报告 code 串逐字不变；stdout 首末行不变 | `--dir`（skills 父目录）→ `--root`（项目根）；迁移后旧文件、`check.test.mjs` 与兜底副本一并删除 |
| `skills/rule-inspector/scripts/score.mjs` | `scs check rules --root <dir>` | exit 0 / 1 / 2（按旧脚本实测登记）；code 串；首末行不变 | `--dir` / `--repo-root` → `--root`；其余 flag 名保留 |
| `scripts/skill-dir.mjs` | **不迁**；scs 新增 `list skills --json` 仅供外部仓 | 纯函数语义（输出目录名数组、错误文本不变） | 无 CLI，不占迁移基线条目；用静态用例锁单源 |

迁移时先落映射表，再改调用方；映射表交 `stage-2b-testcase-sdet.md` 加日期注（不改原文）。**本仓不新建计数脚本**：账本计数一律走 `scs ledger numbers`，新增 `count-ledger.mjs` / `function countLedger` = 违规（PRD V7）。

**迁移前基线**：改调用方之前，对每个旧脚本跑同一组固定样本，存到 `docs/devworkflows/20261109211349-script-layer-refactor/migration-baseline.json`，形状冻结为：

```json
{
  "generatedAt": "2026-11-09T21:30:00+08:00",
  "entries": [
    { "oldCommand": "node skills/skill-inspector/scripts/check.mjs --dir <sample>/skills", "sample": "<项目根相对路径>", "exit": 0, "stdoutFirst": "…", "stdoutLast": "…", "codes": [] }
  ]
}
```

`sample` 一律记**项目根**；旧命令的 `--dir` 实参由 `<sample>/skills` 拼出，新命令用 `--root <sample>`。这样同一个 `sample` 能同时喂两边。

迁移后用新命令跑同一样本，逐项 diff `exit / stdoutFirst / stdoutLast / codes`。差异只有两种合法结局：① 无差异；② 差异已写进映射表的「契约变化」列并说明理由。**基线条目 = 2 条**（两个 CLI：`check.mjs` / `score.mjs`）；`skill-dir.mjs` 是库、无 `exit/stdout`，不占条目，由静态用例锁单源。

**时序**：scs 命令未发布前，不得先把调用方切过去（禁止半迁移：旧脚本已删、新命令还不可用）。

**库与命令的分界（R13）**：`check.mjs` / `score.mjs` 是 CLI 形态（有 argv、有退出码）→ 可迁；`skill-dir.mjs` 是库形态（被 import、无 argv）→ 不迁，只删副本。判据不是「文件在 skills/ 下」，是「调用方要的是进程结果还是函数返回值」。

## 4 硬约束

1. 不改 `verbs` 字符串形状（R12）。
2. 卡面不得出现 `repo.check` / `docgen.read` 组名（R3 / R4）。
3. `scs` 不新增具体仓默认路径；本仓 `package.json` 显式传 `--engine` / `--data` / `--projection`（R11）。
4. 迁移前后三类契约逐项比对；差异必须进映射表（R8）。
5. 新门禁必须有 testcase（R10）。
6. 不手改 `agents/*.md`：卡是生成物，走 `draft → 对照 → replace`。
7. 迁移前必须先存 `migration-baseline.json`；没有基线不得改调用方（§3.7）。

## 5 测试

| 测什么 | 为什么 |
|---|---|
| 组混装 → 构建期红 | 最易漏：只测「单组 layer 存在」，漏测「一组装两层」 |
| 席位配 dev / build 组 → 构建期抛 `NonRunGroupGranted` | 最易漏：静默过滤会让错误配置长期潜伏 |
| 卡面 0 个非 run 组名 | 这是 F-01 的唯一用户可见结果 |
| C5 缺行只 WARN、有行且不等 FAIL | 旧账本没有该行；判红会批量假红 |
| C2 新旧两种声明各命中一次、不双计 | 同一事实两种写法，双计会误报 |
| landings：不存在 / 行号越界 / URL 跳过 | URL 与真实 `path:line` 混在同一格 |
| 迁移后 exit code / code 串 / 首末行不变 | 这是 sdet 170 条用例的依赖面 |
| 只拷 scs + `--root` 在临时目录可跑 | 证明「不绑本仓」不是口号 |
| 本仓 `package.json` 的 scs 调用 0 处依赖默认值（显式传 `--engine` / `--data` / `--projection`） | 默认值已漂过一次（§3.1 R11）；scs 源码默认值归 scs 仓，不在本轮 |

**测试用例文件**：`docs/superpowers/specs/2026-11-09-script-layer-refactor-design-testcase.md`（由 `senior-sdet` 独立编写；本 spec 不内联用例）。

**只手动验证**：`scs` 全局安装后的真实调用（`scs --version` 与 `scs help`）；生成卡的人工可读性。

**不测**：`scs` 命令的内部实现细节（由 scs 仓自己的 vitest 覆盖）；Git 读命令本身的行为（平台保证）。

## 6 不在这一轮

- S5 校验器接 `outputFormats.docs`：阻塞于 result.md §8.5 的 `S4-TC-D01` / `D03` / `D04`，另立 spec。
- #7 证据重放：R9，不实现。
- `verbs` 对象化：R12，另立。
- 重命名 `scs` 现有默认值：R11 只要求「不新增 + 本仓显式传参」，不要求改动 scs 默认值（那是 scs 仓的兼容问题）。
- 改 `stage-2b-testcase-sdet.md` 原文：只加映射表与日期注。

## 7 将来才会撞上的一件事

`scs` 是独立仓、独立发布。本 spec 冻结的「新命令名」要等 scs 仓接受；若 scs 仓改名，映射表要同批改，但**契约（exit code / code 串 / 首末行）不变**。

## 8 与既有 spec 的关系

- **保留** `stage-2b-testcase-sdet.md` —— 它是 2026-11-05 快照，作为历史记录；本 spec 只提供「旧路径 → 新命令」映射表，不改其正文。
- **保留** `2026-11-03-s-a-data-layer-design.md` / `s-b` / `s-c` —— 本 spec 不碰卡面七段结构与数据层拆分。
- **取代** PRD D3 的「verb 级 layer」说法 —— 已在 PRD 同批改为「组级 layer」（PRD D3），本 spec 按组级实现。
- **收窄** PRD D14 的 `skill-dir.mjs` 迁移 —— 按 R13 改为「删副本、保持单源」；F-ID 集合不变，只改 F-04 的措辞。
