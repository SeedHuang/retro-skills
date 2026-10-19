# P2：agent 的整文件生成 + description / 触发表 + gen-agents 收编（Docgen 第二份）

> 状态：草稿（待议会评审）｜依赖：`docgen-index.md`（共享决策 D1–D18）｜前置：P1 验证通过（2026-10-18，13/13 PASS）
> 目标：把「组件 → 模板 → 生成 → 守卫」扩到 **agent 一类**生成物：收编 14 个 agent（议会 13 席数据搬家 + senior-sdet 手写转录），落地 description / 触发表，`gen-agents` 退役。**本次不做 skill、不做 rule 六骨架**（分别立项 P4 / P3）。
> 执行节奏：**agent 类统一迁移、逐个巩固**（D11 + 用户 2026-10-18）——同类放一起做，注意力集中；每个 agent 单独走完「生成 → 守卫 → 草稿 → 确认 → 替换 → 巩固」闭环，巩固一个再做下一个。
> 生成物写入纪律：**任何生成物不直接替换现有 agent**——一律先落草稿箱，用户确认后才替换（参考 rule 草稿机制，见 P2-4）。

## 1 为什么是这一份

P1 用一条 rule 证明了整文件模型、入口基线、规则类型「枚举 + 5 格」成立；仓库里每天真实在改的生成物之一 = **agent 的 .md**（`gen-agents.mjs` 里 ROLES 硬编码 + 模板拼字符串 + 只有 `--check` 一条守卫）。P2 把链路扩到 agent，兑现 P1 留下的两笔账：

- **D14**：只保留一个生成来源——docgen 吸收 `gen-agents` 的 `ROLES` 与 `--check`，旧脚本退役；
- **D9**：`description` 只写触发条件，来源是触发表——P2 首次落地。

**为什么本次只做 agent**（用户 2026-10-18）：agent 是纯结构化数据（ROLES）→ 数据搬家的模型最干净、判别力最强；skill 是「frontmatter + 自由正文」混合体、rule 六骨架是新模型，混在一份里会稀释验收焦点。同类放一起，一次把 agent 这条路走扎实，skill / rule 再单独立项。

## 2 范围

**做**：

1. **agent 收编（13 席，数据搬家，内容零变化）**：议会 13 席的 ROLES 结构化数据迁入 docgen 组件；渲染产物与现 `agents/*.md` 逐字节一致；
2. **senior-sdet 转录（1 个文件）**：不在 ROLES 里的手写角色卡，转录成组件数据；顺带成为「手写 → 生成」的 agent 侧试点；
3. **description / 触发表（agent 侧）**：从组件数据派生 agent 的 `description`（只写触发条件）；
4. **gen-agents 收编**：ROLES 与 DETECTIVE_RULES 等共享块迁入 docgen 组件；`gen-agents.mjs` 退役；`--check` 由 docgen gate 的 `check-agents` 承接；
5. **草稿 → 确认 → 替换（agent 侧）**：生成不直接写 `agents/*.md`，先落草稿箱，用户确认后才替换；参考 rule 草稿机制（`use-rule-skills` 的 `drafts` 交互）；
6. **正式管线落位**：spike 按 P1 结论重写为 `tools/docgen/`（components / templates / cli）；P1 的 rule 生成能力一并迁移（spec-testcase-gate 继续由 docgen 守）；
7. **baseline 扩容**：rule（21）+ agent（14）= 35 条全收录；已生成子集做「重建 + 逐字节比对」。

**不做**（本份边界）：

- **skill 整文件生成**（frontmatter + 正文转录）——立项为 P4；
- **rule 六组合骨架**（持续 / 条件触发 / 模式门控 × 义务 / 禁令）——立项为 P3；
- 其余手写 rule 的迁移（除 spec-testcase-gate 外均不动，P3 收）；
- spec 片段 / region（D18）；
- 跨组件引用语法 `comp:<Name>` 的解析器（P1 决定只写不解析，本份沿用）；
- PRD / plan / 过程记录类文档的生成（叙述正文，手写，见索引 §3）；
- skill / agent 的 `scripts/`、`assets/`、`references/`（手写源，不进生成范围）；
- description 多语言、触发表热更新。

> **边界一句话**：本份的真实内容转录工作量 = **1 个文件**（senior-sdet）；13 席 agent 是结构化数据搬家（零内容变化）；skill、rule 六骨架、其余 rule 一律不动。

## 3 本份决策

| # | 决策 | 依据 |
|---|---|---|
| P2-1 | agent 模板节结构：frontmatter（name / description / tools）+ 角色卡（身份 / 职责表 / 固定清单 / 输出形态）；14 个 agent 全量收编 | D4；`agents/*.md` 实测结构 |
| P2-2 | `description` 由「触发表」派生：每条目 = `when`（场景触发条件）+ `route`（调用对象）+ `notWhen`（明确不触发）；拼装只允许 when 条目原文 + 连接词，不引入新词；本次只对 agent 生效 | D9 |
| P2-3 | gen-agents 退役：ROLES 与 DETECTIVE_RULES 等共享块迁入 `tools/docgen/components/`；`skills/parliament/scripts/gen-agents.mjs` 删除；`gen-agents --check` 由 docgen gate 的 `check-agents` 承接；`skilldependencies/*.json` 不动 | D14 |
| P2-4 | **草稿 → 确认 → 替换**：`docgen draft --kind agent --name <name>` 只把渲染结果落草稿箱 `~/.retro-skills/docgen-drafts/`（命名 `<name>--<YYYYMMDD-HHMMSS>.md`），**不碰 `agents/*.md`**；`docgen replace --kind agent --name <name> --draft <草稿>` 在用户确认后才替换原文件。交互参考 rule 草稿机制：**永不静默替换**、列出草稿带时间、采纳 = 授权替换 + 清该名下草稿；替换前先跑 gate，gate 红 → 拒绝替换。白名单 = `agents/*.md` | D6（生成物禁手改）+ 用户 2026-10-18「生成新 agent/rule/skill 都应有草稿，不直接替换现有，参考 rule 草稿」 |
| P2-5 | baseline 扩容两清单：rule（21，P1 沿用）+ agent（14）= 35 条全收录；**已生成子集**（spec-testcase-gate rule + 14 agent）做「重建 + 逐字节比对」；清单外新文件 = `UnregisteredHandwritten` | P1-2/P1-3 延伸 |
| P2-6 | 正式管线落位 `tools/docgen/`：`components/`（数据 + 逻辑）、`templates/`（`.tpl`）、`cli.mjs`（命令行）；spike 保留至 P2 验收全绿后删除；P1 的 rule 生成能力迁移到正式管线（不等同重写语义） | P1 交付物「Spike 不进正式管线」 |
| P2-7 | **agent 类统一迁移、逐个巩固**：收编顺序 = 试点 1 席（数据搬家）→ senior-sdet（手写转录）→ 余下 12 席（逐个搬家）；**每个 agent 单独走完「生成 → 守卫 → 草稿 → 确认 → 替换 → 巩固」闭环，巩固一个再做下一个；同类不穿插其它类型** | 用户 2026-10-18「先不要管 skill 和 rule，相同类型放一起，注意力集中」 |

### P2-4 草稿机制（agent 侧，参考 rule 草稿箱）

- **草稿箱**：`~/.retro-skills/docgen-drafts/`（`os.homedir()` 解析；与 rule 草稿 `~/.retro-skills/rule-drafts/` 并列，按生成对象类型分区，防混删）。
- **命名**：`<agent名>--<YYYYMMDD-HHMMSS>.md`（时间戳区分版本、可排序）。
- **命令**：`docgen draft ls [name]` / `docgen draft rm <草稿>` / `docgen draft rm --name <name> [--keep <草稿>]`——语义与 `use-rule-skills` 的 `drafts.mjs` 一致。
- **交互纪律**：
  - 入口不自动认领草稿——列出带时间，由用户选续用 / 新建 / 取消；
  - 删除永不静默——有草稿必问；
  - **替换 = 已授权整组落地**（写 `agents/<name>.md` + 清该名下草稿），不再单独确认删除；
  - 不主动追问替换——草稿 + 报告给出后停住，报告末尾给「【替换】/【不替换】」两个文字选项。

### P2-2 触发表的数据形状（agent 侧）

| 字段 | 含义 | 例子 |
|---|---|---|
| `when` | 什么场景触发（用户动作 / 事件） | 「主持人调度对 PRD/spec/plan 做产品视角评审时」 |
| `route` | 调用哪个代理 | `reviewer-product` |
| `notWhen` | 明确不触发的相邻场景（防误触发） | 「修改业务代码（那走 senior-sdet / 施工）」「只读议会评审（走 reviewer-qa）」 |

> 触发表数据落在组件里；`description` = 由 `when` 条目拼装的一句触发条件；`notWhen` 不进 description，进角色卡的「不做什么」节（若模板有）。

## 4 接口（与 P1 的差异）

- CLI 落位 `tools/docgen/cli.mjs`：
  - `node tools/docgen/cli.mjs generate --kind rule|agent [--name <name>]`：内存渲染 + 比对，**不写盘、不落草稿**（纯检查）；
  - `node tools/docgen/cli.mjs draft --kind agent --name <name>`：渲染结果落草稿箱（P2-4），**不碰 `agents/*.md`**；
  - `node tools/docgen/cli.mjs draft ls|rm [--name <name>]`：草稿箱管理；
  - `node tools/docgen/cli.mjs replace --kind agent --name <name> --draft <草稿>`：P2-4 替换（先 gate，红 → 拒）；
  - `node tools/docgen/cli.mjs gate`：两清单基线 + 全量重建比对（接管 `npm run check` 里的 gate 调用）；
  - `node tools/docgen/cli.mjs check-agents`：等价旧 `gen-agents --check`（迁移期兼容）。
- **替换白名单外 = `InvalidOutputPath`**（沿用 P1 码）；`replace` 未找到组件数据 → `MissingComponentData`（新码）；`--draft` 不存在 → `DraftNotFound`（新码）。
- 错误码沿用 P1 全表，新增：`MissingComponentData`（组件数据缺失）、`FrontmatterFieldMissing`（frontmatter 漏字段）、`DraftNotFound`（草稿不存在）。
- **前端文件不参与**：本份生成物仅 markdown（`agents/*.md`）。

## 5 验收（W1–W9，缺一不算过）

> 按 P2-7 串行：每个 agent 验收通过、巩固后才进入下一个；W1–W4 各对应「一个 agent 的完整闭环」。

| # | 场景 | 动作 | 预期 |
|---|---|---|---|
| W1 | agent 试点（数据搬家） | ROLES 迁入组件后渲染 1 席（如 `reviewer-audit`）vs 现 `agents/reviewer-audit.md` | 逐字节一致；`gen-agents.mjs` 该席产物 = docgen 产物 |
| W2 | senior-sdet 转录 | 手写卡转录成组件数据后渲染 vs 现 `agents/senior-sdet.md` | 逐字节一致 |
| W3 | 12 席余下 agent 逐个 | 逐个 ROLES 搬家 + 逐字节比对 | 每席渲染 = 现产物；逐个巩固后才下一个 |
| W4 | description 派生 | 任选 2 个已生成 agent 的触发表数据 → 派生 description | 只含触发条件；不出现能力宣传词；与 frontmatter 实际字段一致 |
| W5 | gate 扩容 | `gate` 跑两清单基线 + 重建比对 | 清单外新增任一类文件 → `UnregisteredHandwritten`；篡改任一已生成 agent → `Mismatch` |
| W6 | 草稿 → 替换 | `draft --name <临时>` 落草稿箱（`agents/` 零改动）；`replace` 后比对 | 草稿内容 = 内存渲染字节；替换前 `agents/` 无改动；替换后 = 草稿字节 |
| W7 | 草稿纪律 | `draft ls` 带时间列出；替换后清该名下草稿；替换前 gate 红 → 拒 | 永不静默替换；`replace` 前置 gate 红时拒绝并报 `Mismatch` / baseline 类错误 |
| W8 | gen-agents 退役 | 删除 `gen-agents.mjs` 后 `npm run check` 全绿 | `check-agents` 兼容命令输出与旧 `--check` 等价；`agents/*.md` 无漂移 |
| W9 | spike 退役 | 删除 `tools/docgen-spike/` 后全量验收 | `npm run check` 全绿；V1–V11 断言由 `tools/docgen/` 等价承接（等价迁移表见 spec） |

**通用前置**：P1 的 V1–V11 在 `tools/docgen/` 等价重建后必须全绿（迁移不是重写语义）；每个 agent 闭环的后置断言 `git status --short rules/ skills/ agents/` 干净。

**停损**：沿用 P1（同一红项修复 2 次仍红 → 停止写复盘；环境/基线红不计入停损）。

## 6 逐步迁移方案（逐 agent 闭环，P2-7 的执行细则）

> 本方案回答「每个 agent 怎么从『现状』走到『由 docgen 生成并守住』」——不是一次全迁，是**一个一个过**，每过完一个就地巩固。

### 6.1 对象队列与推进顺序

按 P2-7 的顺序，每个 agent **必须**走完 6.2 的九步闭环、达到 6.3 的巩固定义，才允许把队列指针移到下一个；**不得越序批量、不得穿插其它类型**。

| 序 | 对象 | 类型 | 动作 | 对应验收 |
|---|---|---|---|---|
| 1 | 试点 agent（1 席，如 `reviewer-audit`） | 数据搬家 | ROLES 该席字段迁入组件 → 生成 → 草稿 → 比对 | W1 |
| 2 | `senior-sdet` | 手写转录 | 角色卡转录成组件数据 → 生成 → 草稿 → 比对 | W2 |
| 3 | 余下 12 席 agent | 数据搬家 | 逐个 ROLES 搬家 → 生成 → 草稿 → 比对，**逐个**巩固 | W3 |
| 4 | 草稿 → 替换能力 | 新能力 | `draft` / `replace` 落盘 + 幂等验证 | W6/W7 |

### 6.2 单 agent 闭环九步（每个都一样）

1. **入选**：确认对象、锁定现产物基线——记录 `git hash-object <产物>` 与 SHA256（双哈希，同 P1 R12）；
2. **数据迁移**：13 席 = ROLES 结构化字段搬家；senior-sdet = 手写正文转录成组件数据；**内容零改写**（措辞、标点、换行逐字保留）；
3. **生成**：`node tools/docgen/cli.mjs generate --kind agent --name <name>`（内存渲染，不写盘、不落草稿）；
4. **逐字节比对（内存）**：渲染结果 vs 现产物 `Buffer.compare`，**必须相等**；不等 = 模板/组件数据有缺陷 → 回炉改组件，**禁止改现产物**（D6）；
5. **接守卫**：对象加入 baseline 比对子集 + 生成清单；`npm run check` 的 gate 开始对该对象做重建比对；
6. **落草稿**：`node tools/docgen/cli.mjs draft --kind agent --name <name>`——草稿进箱，**`agents/*.md` 零改动**；
7. **替换**（用户确认后）：`node tools/docgen/cli.mjs replace --kind agent --name <name> --draft <草稿>`——先 gate，gate 红 → 拒；替换 = 草稿字节写入 `agents/<name>.md`；
8. **验收**：跑对应 W 行断言 + `npm run check` 全绿 + 后置断言 `git status --short rules/ skills/ agents/` 干净；
9. **巩固**：连续 2 次 gate 运行该对象无漂移（含一次隔目录冷跑），确认无副作用，才置「已巩固」。

### 6.3 巩固的定义（达到全部才算，缺一即未巩固）

- 该 agent 已进 baseline 比对子集，`gate` 连续 2 次绿；
- `npm run check` 全绿（0 findings）；
- `git status --short rules/ skills/ agents/` 干净；
- 旧生成来源对该对象已停止输出（`gen-agents.mjs` 该席不再被引用）；
- 对象内容 = 组件数据渲染的字节，人工抽查 1 处关键格与组件数据一致；
- 草稿箱该名下草稿已清（替换完成后）。

### 6.4 失败与回退

- 比对不等（第 4 步）→ 只改组件/模板，现产物不动；同一对象修复 2 次仍不等 → **停止**，写复盘，对象标「未迁」，队列停在该对象；
- 守卫阶段发现对象与现产物在 gate 上漂移 → 回退 = 现产物保持原样，对象从比对子集移除，记复盘后重走；
- 替换前 gate 红 → **拒绝替换**，草稿保留，修组件后重走 4–7；
- 环境/基线类红（`EnvironmentEOL`、baseline 类）不计入停损，先修环境再继续；
- 任何对象「未迁」都不阻塞已巩固对象——已巩固的保持生成与守卫生效，未迁的继续手写管理（P3/P4 再收）。

### 6.5 迁移状态账本

随队列推进实时维护一张表（落 `docs/prd/docgen-agent-generation.md` 附录，评审时一并核对）：

| 对象 | 类型 | 状态 | 现产物双哈希 | 迁移日期 | 巩固证据 |
|---|---|---|---|---|---|
| `reviewer-audit`（试点） | agent | 未迁 / 迁移中 / 已巩固 | `git hash-object` + SHA256 | — | gate 连续 2 次绿输出 |
| `senior-sdet` | agent | 未迁 / 迁移中 / 已巩固 | … | — | … |
| 余下 12 席 | agent | 逐行登记 | … | — | … |

> 状态口径：`未迁` / `迁移中`（已入队，未过 6.3）/ `已巩固`（过 6.3）。全部 14 个 agent `已巩固` 才满足 P2-7 串行收口。

## 7 交付物

1. `tools/docgen/components/*.mjs`：specTestCaseGate（迁移）+ agentData（ROLES + senior-sdet）+ triggerTable；
2. `tools/docgen/templates/agent.md.tpl`（+ rule 模板迁移自 P1）；
3. `tools/docgen/cli.mjs`（generate / draft / replace / gate / check-agents）；
4. 草稿箱 `~/.retro-skills/docgen-drafts/`（`draft` 子命令建/列/删）；
5. baseline 两清单（35 条）+ `.gitignore` 更新；
6. `scripts/check-all.mjs` 的 gate 调用切换到 `tools/docgen/cli.mjs gate`；
7. 删除：`tools/docgen-spike/`（W9 后）、`skills/parliament/scripts/gen-agents.mjs`（W8 后）；
8. 本 PRD 拆出的 spec + 独立 testcase（spec 评审时齐）。

## 8 退出与下一份

- W1–W9 全绿 → 写回 `docgen-index.md` 的 P2 状态（**验证通过**）。
- **P3（rule 生成扩容）** 开卷前置：P2 验证通过——rule 六组合骨架 + 其余手写 rule 收编，复用 P2 的组件/模板/cli 基建 + 草稿机制。
- **P4（skill 生成）** 开卷前置：P2 验证通过——frontmatter + 正文转录，17 个手写 skill 按需收编（D16），复用 P2 基建 + 草稿机制。
- P3 / P4 依赖 P2 的 `tools/docgen/` 管线与草稿机制，立项时直接复用。

## 9 与 spec / testcase 的关系

本 PRD 不直接产生 testcase。由它拆出的 spec 必须同批产出独立 testcase（`spec-testcase-gate` 规则判据 1–5），否则 spec 不算定稿、不得进 plan。

> 拆分提示（给 prd-to-specs）：P2 因 P2-7 的串行节奏，spec 应按「agent 类一组」拆，内部按对象粒度分任务；每个对象任务的验收锚点 = 对应 W 行。
