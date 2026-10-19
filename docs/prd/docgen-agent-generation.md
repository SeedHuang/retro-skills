# P2：agent 的整文件生成 + description / 触发表 + gen-agents 收编（Docgen 第二份）

> 状态：草稿（待议会评审；第 1 轮修复中，2026-10-19）｜依赖：`docgen-index.md`（共享决策 D1–D18）｜前置：P1 验证通过（2026-10-18，13/13 PASS）
> 目标：把「组件 → 模板 → 生成 → 守卫」扩到 **agent 一类**生成物：收编 14 个 agent（议会 13 席数据搬家 + senior-sdet 手写转录），落地 description / 触发表，`gen-agents` 全家退役。**本次不做 skill、不做 rule 六骨架**（分别立项 P4 / P3）。
> 执行节奏：**agent 类统一迁移、逐个巩固**（D11 + 用户 2026-10-18）——同类放一起做，注意力集中；每个 agent 单独走完「生成 → 守卫 → 草稿 → 确认 → 替换 → 巩固」闭环，巩固一个再做下一个。
> 生成物写入纪律：**任何生成物不直接替换现有 agent**——一律先落草稿箱，用户确认后才替换（参考 rule 草稿机制，见 P2-4）。

## 1 为什么是这一份

> 术语：**docgen** = 本 PRD 系列的文档生成系统（「组件 → 模板 → 生成 → 守卫」）；**ROLES** = `gen-agents.mjs` 内 13 席议会角色的结构化数据（本份收编对象）；**baseline** = 生成物入口清单（P1 已定义，本份扩容）。

P1 用一条 rule 证明了整文件模型、入口基线、规则类型「枚举 + 5 格」成立；仓库里每天真实在改的生成物之一 = **agent 的 .md**（`gen-agents.mjs` 里 ROLES 硬编码 + 模板拼字符串 + 只有 `--check` 一条守卫）。P2 把链路扩到 agent，兑现 P1 留下的两笔账：

- **D14**：只保留一个生成来源——docgen 吸收 `gen-agents` 的 `ROLES` 与 `--check`，旧脚本退役；
- **D9**：`description` 只写触发条件，来源是触发表——P2 首次落地（见 P2-2 的 agent 侧解读）。

**为什么本次只做 agent**（用户 2026-10-18）：agent 是纯结构化数据（ROLES）→ 数据搬家的模型最干净、判别力最强；skill 是「frontmatter + 自由正文」混合体、rule 六骨架是新模型，混在一份里会稀释验收焦点。同类放一起，一次把 agent 这条路走扎实，skill / rule 再单独立项。

### 1.1 核心理念：doc → code → doc 闭环（第 1 轮评审 + 用户 2026-10-19 确认）

本份一切决策都建立在这条闭环上：

- **录入（doc → code）**：用户提要求（允许口语 / 成语 / 模糊——输入本来就可以模糊）→ **AI 按翻译规范延展成组件数据**（**未来加席机制，P2 内不执行，见下作用域声明**）。语义正确性在这一步靠**人机迭代**收敛（AI 翻译 → 用户审准不准 → 修正循环），不是机器一次判死。
- **生成（code → doc）**：组件数据 → 确定性渲染 → 生成物。同一个数据渲染出同一个文档，逐字节可复算（D6）。
- **校验（code 检查 doc）**：守卫重渲染比对——doc 与源逻辑一致 / 无手改漂移 / 符合模式（字段 / 句式 / 覆盖 / 引用）。
- **表达（doc 给 AI）**：生成物 = AI 读的指令，必须准确无误表达逻辑——**生成物是无歧义的规则语言**：固定句式 + 白话 + 无模糊词 + 有判据。禁用成语 / 修辞 / 模糊词（校验器强制）。

**责任边界**：**校验器打回的对象是 AI 的翻译产物，打回后由 AI 重新翻译，不推回用户**；用户只承担「提要求」和「最终语义确认」两个角色。翻译质量三标准——**详细**（不省略隐含语义）/ **逻辑化**（关系明确）由施工 AI 在翻译时自评并写入组件数据注释、人工抽查；**可测**（每句有判据）由校验器抽查（句子含可验证断言词）。

**抽象边界**：只做**形状抽象**（表 / 枚举 / 句式——有固定形状、提取后信息不掉的内容），不做**内容抽象**（叙述 / 推理——提取成表格后信息量掉的内容，保持自由正文常量转录）。

**P2 作用域声明（防翻译/转录混淆）**：**P2 本体 14 个 agent = 数据搬家 / 零改写转录，不涉及 AI 翻译**（§1.1 的「AI 按翻译规范延展」是**未来加席流程**的目标机制，P2 内不执行、不验收）；施工 AI 不得对转录对象做任何润色/改写（W2 逐字比对兜底）。完形填空翻译闭环（模板 = 题目、AI 填答案、校验器 = 判卷标准）是 P2 之后加席时的目标，本份只立规范不落地。

## 2 范围

**做**：

1. **agent 收编（13 席，数据搬家，内容零变化）**：议会 13 席的 ROLES 结构化数据迁入 docgen 组件；渲染产物与现 `agents/*.md` **除 description 字段外逐字节一致**（description 是派生字段，见 P2-2）；
2. **senior-sdet 转录（1 个文件）**：不在 ROLES 里的手写角色卡，转录成组件数据（第二套模板，P2-1）；顺带成为「手写 → 生成」的 agent 侧试点；
3. **description 派生（agent 侧）**：固定句式 + 触发表 when 逐字提取，见 P2-2；
4. **槽位模式抽象**：agent 卡 = 派生字段 + 手写数据字段 + 共享常量 + 枚举块；模式登记册 + 例外机制，见 P2-8；
5. **gen-agents 全家退役**：ROLES 与 DETECTIVE_RULES 等共享块迁入 docgen 组件；`gen-agents.mjs` 与 `gen-agents.test.mjs` 一双原子删；`--check` 由 docgen gate 的 `check-agents` 承接（P2-3）；
6. **草稿 → 确认 → 替换（agent 侧）**：生成不直接写 `agents/*.md`，先落草稿箱，用户确认后才替换；参考 rule 草稿机制（`use-rule-skills` 的 `drafts` 交互）；
7. **正式管线落位**：spike 按 P1 结论重写为 `tools/docgen/`（components / templates / cli）；P1 的 rule 生成能力一并迁移（spec-testcase-gate 继续由 docgen 守）；
8. **baseline 扩容**：rule（21）+ agent（14）= 35 条全收录；已生成子集做「重建 + 逐字节比对」。

**不做**（本份边界）：

- **skill 整文件生成**（frontmatter + 正文转录）——立项为 P4；
- **rule 六组合骨架**（持续 / 条件触发 / 模式门控 × 义务 / 禁令）——立项为 P3；
- 其余手写 rule 的迁移（除 spec-testcase-gate 外均不动，P3 收）；
- spec 片段 / region（D18）；
- 跨组件引用语法 `comp:<Name>` 的解析器（P1 决定只写不解析，本份沿用）；
- PRD / plan / 过程记录类文档的生成（叙述正文，手写，见索引 §3）；
- skill / agent 的 `scripts/`、`assets/`、`references/`（手写源，不进生成范围）；
- description 多语言、触发表热更新；
- **内容抽象**（叙述 / 推理段保持自由正文常量转录，不做句式化——P2-8 边界）。

> **边界一句话**：本份的真实内容转录工作量 = **1 个文件**（senior-sdet）；13 席 agent 是结构化数据搬家（description 字段派生，其余零变化）；skill、rule 六骨架、其余 rule 一律不动。抽象只做形状（表 / 枚举 / 句式），不做内容（叙述 / 推理）。

## 3 本份决策

| # | 决策 | 依据 |
|---|---|---|
| P2-1 | **agent 卡 = 骨架 + 槽位模式 + 枚举共享块**：骨架 = 固定节结构（frontmatter / 角色标题 / 你是谁 / 共享特质 / 固定清单 / 自由探索 / 输出格式 / 通用纪律 / 边界）；槽位模式 = 每槽位一条句式或枚举或常量；两套模板——议会席模板（13 席共用）+ senior-sdet 手写卡模板（第二套，含专属节）；tools：13 席 = 模板默认只读三元组 `Read, Glob, Grep`，senior-sdet = 数据字段（`Read, Glob, Grep, Write, Edit`） | D4；`agents/*.md` 实测结构 + 第 1 轮 F-01 |
| P2-2 | **description = 派生字段，固定句式 `在{domain}中担任{role}。{when}时调用`**：`domain`（**共享常量「议会评审」，13 席相同、写死于组件常量，不从各席提取**）/`role` 是设计期常量（role = ROLES 的 `zh`）；`when` 来自触发表**逐字提取**（含前导连接词「当 / 每轮」）；拼装禁引入新词；**W1–W3 比对范围排除 description**，description 单独由 W4 机械校验（== 句式拼装结果）；**agentData 不存独立 description 字段（组件内只存 domain/role/when 槽位，description 渲染时派生）**；**迁移期加一次性黄金断言「派生 description == 迁移前现 `agents/<name>.md` 的 frontmatter description 逐字相等」（**在替换前 6.2 步 7 之前执行，直接读现文件比对**；13 席句式本就复现原句，转录正确必然相等，错则拦截），when 槽位加格式约束（validateAgentData：不得含「在…中担任 / 时调用」字样）**；notWhen：**13 席本次迁移 notWhen 一律为空（未声明 = 合法值），边界节不渲染 notWhen 槽位、模板不加槽位**；senior-sdet 的 description 专属句式含 notWhen 槽位（手写卡模板例外），**专属句式完整形态 = `{身份句}。{when}时调用。Do not use for {notWhen}。`（身份句 / when / notWhen 均逐字取自现 description 原文，不引入新词，拼装结果逐字 == 现 description）** | D9 + 用户 2026-10-19「description 固化句式」+ 第 1 轮 F-A + 第 2 轮 F2-D/F2-E/F2-F |
| P2-3 | **gen-agents 全家退役**：ROLES 与 DETECTIVE_RULES 等共享块迁入 `tools/docgen/components/`；`gen-agents.test.mjs` 的 6 条守卫断言（name 唯一 / 占位符 / frontmatter 合法 / tools 只读 / 特质段一致 / 零漂移）**先迁入 docgen 组件校验（validateAgentData / check-agents）**——**该迁移 + 旧测试删除排在队列序 0（先于试点）**，再在 W8 与 `gen-agents.mjs` 完成剩余退役（删除时序：test 序 0 删、gen-agents.mjs W8 删）；`check-agents` 建在 docgen 组件之上（复用同一段 render+compare），是过渡命令，**仅在无「停损未迁」对象时** W8 后摘 CLI 别名；parliament `SKILL.md` L15 与 `assembly-matrix.md` L31 的生成指令改指 docgen 流程；`skilldependencies/*.json` 不动 | D14 + 第 1 轮 F-B + 第 2 轮 F2-B/F2-C |
| P2-4 | **草稿 → 确认 → 替换**：`docgen draft --kind agent --name <name>` 只把渲染结果落草稿箱 `~/.retro-skills/docgen-drafts/`（命名 `<name>--<YYYYMMDD-HHMMSS>.md`），**不碰 `agents/*.md`**；`docgen replace --kind agent --name <name> --draft <草稿>` 在用户确认后才替换原文件。交互参考 rule 草稿机制：**永不静默替换**、列出草稿带时间、采纳 = 授权替换 + 清该名下草稿；替换前先跑 gate，gate 红 → 拒绝替换（**拒红仅指与目标无关的漂移；目标对象自身预期差异不构成拒红，见 §4 / 6.4 / 6.5**）。白名单 = `agents/*.md` | D6（生成物禁手改）+ 用户 2026-10-18「生成新 agent/rule/skill 都应有草稿，不直接替换现有，参考 rule 草稿」 |
| P2-5 | baseline 两清单：rule（21，P1 沿用）+ agent（14）= 35 条全收录；**baseline 常量在 P2 开工即收录全部 35 条路径（满足「35 条全收录」），「增量演进」重定义为比对子集演进**——已巩固席进比对子集做重建比对、未迁席在常量内只做登记/存在检查（6.2 步 5）；**已生成子集**（终态，14 席全部巩固后：spec-testcase-gate rule + 14 agent）做「重建 + 逐字节比对」；**迁移期按 6.2 步 5 增量演进（未轮到席只登记/存在检查）**；清单外新文件 = `UnregisteredHandwritten`；重写 baseline.json 复用 P1 的 `--write-baseline` 受控变更机制 | P1-2/P1-3 延伸 + 第 1 轮 F-06/F-08 + 第 2 轮 F2-B |
| P2-6 | 正式管线落位 `tools/docgen/`：`components/`（数据 + 逻辑）、`templates/`（`.tpl`）、`cli.mjs`（命令行）；spike 保留至 P2 验收全绿后删除；P1 的 rule 生成能力迁移到正式管线（不等同重写语义） | P1 交付物「Spike 不进正式管线」 |
| P2-7 | **agent 类统一迁移、逐个巩固**：收编顺序 = 试点 1 席（数据搬家）→ senior-sdet（手写转录）→ 余下 12 席（逐个搬家）；**每个 agent 单独走完「生成 → 守卫 → 草稿 → 确认 → 替换 → 巩固」闭环，巩固一个再做下一个；同类不穿插其它类型**；**draft/replace 命令的实现是九步闭环的前置（先于试点落最小可用版），队列第 4 位是能力的验收节点而非实现节点** | 用户 2026-10-18「先不要管 skill 和 rule，相同类型放一起，注意力集中」+ 第 1 轮 F-03 |
| P2-8 | **槽位模式抽象 + 翻译闭环**：agent 卡 = 派生字段（description；负责/不负责列表主干 ← position + strengths 派生，**仅登记为模式，P2 内不对现有 14 个 agent 生效**——senior-sdet 的职责表按 W2 转录、13 席无职责表）+ 手写数据字段（固定清单 / 输入 / 协议 / 规则，转录成组件数据）+ 共享常量块 + 枚举块（outputKind / sharedBlock）；**字段映射：`position := ROLES.zh`（与 P2-2 的 role 同义，实现层统一用单字段 role），必填 name/position/when/route，非必填 workYears/likes/dislikes/strengths/weaknesses/notWhen（未声明 = 合法值；**13 席迁移一律缺省，为未来加席预留；senior-sdet 的 notWhen 按 P2-2 专属句式填充，逐字复现现卡 Do not use 内容**）**；**生成物 = 无歧义规则语言**（禁成语 / 模糊词，校验器强制，**词表只约束 AI 翻译 / 派生产出，不约束零改写转录字段**——13 席 identity 现含「经验直觉」等词属转录常量不受约束）；**模式登记册 + 例外机制**（新情况套不进模板 → 提出 → 裁决 → 进化模式，同字段第二次套不进 = 该模式必须进化）；**翻译 = 完形填空**（模板 = 题目、AI 按翻译规范填答案、校验器 = 判卷标准），校验器打回 AI 重翻、不推回用户；**翻译闭环是未来加席机制，P2 内不验收**（见 §1.1 作用域声明） | 用户 2026-10-19 多轮确认 + 第 1 轮 F-02 / F-10 + 第 2 轮 F2-G/F2-H/F2-I |

### P2-2 触发表与 description 派生的数据形状（agent 侧）

| 字段 | 含义 | 例子 |
|---|---|---|
| `when` | 什么场景触发（用户动作 / 事件），**逐字提取自现 description 的触发子句，含前导连接词** | 「当主持人调度对 PRD/spec/plan 做产品视角评审」「每轮答辩结束后由主持人调度做行为核实」 |
| `route` | 调用哪个代理（**仅供生成辅助 / 未来调度消费预留；调度规则以 parliament 点将矩阵为唯一源**） | `reviewer-product` |
| `notWhen` | 明确不触发的相邻场景（防误触发）；**13 席本次迁移为空、不渲染（见 P2-2）；senior-sdet 的 description 专属句式含 notWhen 槽位** | （senior-sdet 形态）「修改业务代码（那走 senior-sdet / 施工）」「只读议会评审（走 reviewer-qa）」 |
| `fallback` | 兜底 route 声明位（布尔，配合断言 e：`fallback: true` 表示该 route 为未命中时的兜底；**仅供未来调度消费预留，P2 内仅静态断言其存在**） | `true` |

> description = 固定句式 `在{domain}中担任{role}。{when}时调用` 的确定性组装（domain/role/when 全是设计期常量或逐字提取），**不允许引入新词**；W4 = 机械比对「description == 句式拼装结果」逐字相等。

### P2-8 模式登记册与例外机制

- **登记册**（组件层 `tools/docgen/components/patternRegistry`，P3/P4 复用）：每个槽位一条模式定义 = 句式 / 枚举 / 常量 + 变量槽位 + 机械校验（不匹配 = 生成失败，D4 精神）。
- **已识别模式**：description 句式（13 席）；identity 主句式「资深{role}，对{dim1}与{dim2}有经验直觉」**仅作未来加席的目标句式——13 席现状全部视为已识别例外（常量转录不动，P2 内不套句式），登记册如实标注；后续加席时以主句式为目标，套不进则触发例外流程**；负责/不负责列表 ← position + strengths（主干派生，P2 内仅登记不生效）；tools（只读三元组 + 追加）；outputKind / sharedBlock（枚举）。
- **例外流程**：新情况套不进现有模式 → 先记录（提出，含原文与套不进的原因）→ 用户/评审裁决（接受为正式例外 or 进化模式）→ 若进化则更新模式定义 + 相关机械校验。**同字段第二次套不进 = 该模式必须进化**（一个例外是特性，两个例外是模式错了）。
- **翻译规范**：填槽内容 = 白话规则、详细、逻辑化、每条有判据；生成物禁成语 / 修辞 / 模糊词（校验器禁用词表 + 句式校验强制）。
- **触发表断言清单**（机器可判，进 spec 与 testcase）：a) 全量覆盖——每 agent ≥ 1 条 when；b) route 唯一且存在（route ∈ agentData 键集，悬空 → `TriggerMissingRoute`）；c) 同构场景区分度——when 集合两两不得完全相同（13 席六视角席因视角名不同天然两两不同；「可同时命中 = 议会多点将」由点将矩阵裁决，本份不断言）；d) notWhen 引用合法——**notWhen 结构化 `{ text, refs: [route] }`，断言 refs ⊆ agentData 键集**；e) 兜底——**静态层断言「存在声明为 fallback 的 route 且 fallback ∈ agentData 键集」（route 条目支持 `fallback: true` 声明位，数据形状表补该字段）；「未命中 any when 时真实路由」属未来调度（点将矩阵）职责，P2 不断言**。

## 4 接口（与 P1 的差异）

- CLI 落位 `tools/docgen/cli.mjs`：
  - `node tools/docgen/cli.mjs generate --kind rule|agent [--name <name>]`：内存渲染 + 比对，**不写盘、不落草稿**（纯检查）；
  - `node tools/docgen/cli.mjs draft --kind agent --name <name>`：渲染结果落草稿箱（P2-4），**不碰 `agents/*.md`**；**遇该名下旧草稿 → 列出并要求先 `draft rm`，不自动生成**（与 W7「入口不自动认领」一致）；
  - `node tools/docgen/cli.mjs draft ls|rm [--name <name>]` / `draft ensure`：草稿箱管理（含幂等 ensure，语义与 `use-rule-skills` 的 `drafts.mjs` 一致）；
  - `node tools/docgen/cli.mjs replace --kind agent --name <name> --draft <草稿> [--yes]`：P2-4 替换（先 gate，红 → 拒）；**`--yes` 为显式授权位（无则拒绝，对应 exit 4 未授权），约束"永不静默替换"可机械判**；**写入 = 临时文件 + rename 原子替换**；**校验草稿字节 === 组件内存渲染，不等 → 拒绝（DraftDrift）**；**gate 前置检查排除目标对象自身的预期差异**（稳态合法改组件后 gate 红属预期信号——草稿 == 组件渲染即绑定判据，允许替换；拒红只针对与目标无关的漂移）；**同一组件改动引发的多目标差异视为同源预期差异，允许逐目标替换收敛**（覆盖 patternRegistry 等共享模式改动的多 agent 影响）；`--draft` 读取路径不受 ROOT 白名单约束（草稿箱在 homedir）；
  - `node tools/docgen/cli.mjs gate`：两清单基线 + 全量重建比对（接管 `npm run check` 里的 gate 调用）；
  - `node tools/docgen/cli.mjs check-agents`：等价旧 `gen-agents --check` 的**检查语义**（遍历 baseline 清单内**全部 agent 对象**（含已巩固与 registered 态）；**已巩固对象做逐字节比对**、exit 0=一致 / 1=漂移、漂移消息含文件名；**registered 态对象跳过逐字节比对、做存在性检查 + 标注未巩固 + 容忍红**，与 6.4 / §8(b) 同口径），建在 docgen 组件之上；过渡命令，**仅在无「停损未迁」对象时** W8 后摘 CLI 别名；
  - `node tools/docgen/cli.mjs baseline --write`：承接 P1 的 `--write-baseline` 语义（**渲染当前常量两清单并写 baseline 文件**，非固定 35 条），**合法新增 agent 的入口**（加组件数据 → 生成 → 草稿 → 确认 → 替换 → 刷新 baseline）。
- **替换白名单外 = `InvalidOutputPath`**（沿用 P1 码，只约束替换目标 `agents/*.md`）；`replace` 未找到组件数据 → `MissingComponentData`（新码）；`--draft` 不存在 → `DraftNotFound`（新码）；草稿 ≠ 渲染 → `DraftDrift`（新码）；触发表冲突 / 悬空 route → `TriggerConflict` / `TriggerMissingRoute`（新码）。
- **错误码退出码档位**（沿用 P1 三档，新增码落位）：`DraftNotFound` → exit 3（IO / 依赖层，文件不存在）；`DraftDrift` → exit 1（数据校验缺陷，同 MissingSlot 家族）；`MissingComponentData` → exit 2（配置 / baseline 层）；`FrontmatterFieldMissing` / `TriggerConflict` / `TriggerMissingRoute` → exit 1（渲染数据缺陷层）；**`NotAuthorized`（replace 缺 `--yes`）→ exit 4（新增档，未授权）**。**分界**：frontmatter 字段缺失 → `FrontmatterFieldMissing`；正文块 / 格缺失 → `MissingSlot`（P1 已有）；组件数据缺失 → `MissingComponentData`；草稿与组件渲染不一致 → `DraftDrift`；replace 无授权位 → `NotAuthorized`。
- **前端文件不参与**：本份生成物仅 markdown（`agents/*.md`）。
- **退出码覆盖声明**：P2 将退出码扩展为 0/1/2/3/4 五档（新增 exit 4 = 未授权）；P1 spec 的 0/1/2/3 码表为历史定义保留，P2 spec 拆分时定义五档完整映射并在 testcase 覆盖 exit 4。

## 5 验收（W1–W9，缺一不算过）

> 按 P2-7 串行：每个 agent 验收通过、巩固后才进入下一个；W1–W3 各对应「一个 agent 的完整闭环」，W4 为 description 派生能力验收。

| # | 场景 | 动作 | 预期 |
|---|---|---|---|
| W1 | agent 试点（数据搬家） | ROLES 迁入组件后渲染 1 席（如 `reviewer-audit`）vs 现 `agents/reviewer-audit.md` | **除 description 字段外逐字节一致**；description == 句式拼装结果且**迁移前黄金断言通过（P2-2：派生 == 迁移前现文件 description 逐字相等）**；`gen-agents.mjs` 该席产物 = docgen 产物 |
| W2 | senior-sdet 转录 | 手写卡转录成组件数据后渲染 vs 转录后权威文本（来源声明行已更新为生成声明） | **除来源声明行（唯一允许差异）外逐字节一致**；description 按专属句式**逐字复现现 description 原文**（身份句 + when 逐字 + `Do not use for` + notWhen 逐字，不引入新词，形态见 P2-2） |
| W3 | 12 席余下 agent 逐个 | 逐个 ROLES 搬家 + 逐字节比对 | 每席渲染 = 现产物（除 description）+ **迁移前 description 黄金断言通过**；逐个巩固后才下一个 |
| W4 | description 派生 | **固定锚点 `reviewer-product` + `senior-sdet` 各 1 个**的触发表数据 → 派生 description | description == 句式拼装结果**逐字相等**；**gate 增加断言 `description == 句式拼装输出`（全 14 席，防组件硬编码 description 绕过派生）**；不出现成语 / 模糊词（**词表只约束 13 席句式派生产出；senior-sdet description 属逐字复现（转录性质），词表断言不适用**） |
| W5 | gate 扩容 + 新增入口 | `gate` 跑两清单基线 + 重建比对；**新增 1 席受控变更旅程**（加组件数据 → 生成 → 草稿 → 确认 → 替换 → `baseline --write` → gate 绿） | 清单外新增任一类文件 → `UnregisteredHandwritten`；篡改任一已生成 agent → `Mismatch`；新增旅程走完最终 gate 绿 |
| W6 | 草稿 → 替换 | `draft --name <已收编 agent 名>` 落草稿箱（`agents/` 零改动）；`replace --yes` 后比对 | 草稿内容 = 内存渲染字节；替换前 `agents/` 无改动；替换后 = 草稿字节且 `gate` 全绿（**目标对象自身预期差异已被 gate 前置排除**）；替换后该名下草稿已清 |
| W7 | 草稿纪律 | `draft ls` 带时间列出；入口不自动认领（有旧草稿时列出不自动生成）；`replace` 缺 `--yes`；替换前 gate 红（与目标无关漂移）→ 拒；同一草稿 replace 两次；草稿 ≠ 渲染时 replace | 永不静默替换；`replace` 缺 `--yes` → `NotAuthorized`（exit 4）；与目标无关的 gate 红 → 拒绝并报 `Mismatch` / baseline 类错误；同一草稿二次 replace → `DraftNotFound`（exit 3）且 `agents/<name>.md` 不变；草稿 ≠ 渲染 → `DraftDrift` 拒绝 |
| W8 | gen-agents 退役 | `gen-agents.test.mjs` 已在序 0 删（断言迁入 docgen 校验）；W8 删 `gen-agents.mjs` 后 `npm run check` 全绿 | `check-agents` 检查语义与旧 `--check` 等价（**遍历全部 agent 对象**：已巩固对象逐字节 / exit 0=一致、1=漂移 / 漂移消息含文件名，输出文本允许 13→14 计数变化；**registered 态对象跳过逐字节比对、做存在性检查 + 标注未巩固 + 容忍红**）；`agents/*.md` 无漂移；parliament 技能目录无 gen-agents 残留引用；**存在停损未迁对象时 check-agents 别名保留** |
| W9 | spike 退役 | 删除 `tools/docgen-spike/` 后全量验收 | `npm run check` 全绿；V1–V11 断言由 `tools/docgen/` 等价承接（等价迁移表由 P2 spec 定义并落位，W9 验收时须在 spec 里） |

**通用前置**：P1 的 V1–V11 在 `tools/docgen/` 等价重建后必须全绿（迁移不是重写语义）；每个 agent 闭环的后置断言 `git status --short rules/ skills/ agents/` 干净；agent 侧比对沿用 P1 checkEnvironment（BOM / CR / 非法 UTF-8 / 尾换行）。

**停损**：沿用 P1（同一红项修复 2 次仍红 → 停止写复盘；环境/基线红不计入停损）。

## 6 逐步迁移方案（逐 agent 闭环，P2-7 的执行细则）

> 本方案回答「每个 agent 怎么从『现状』走到『由 docgen 生成并守住』」——不是一次全迁，是**一个一个过**，每过完一个就地巩固。

### 6.1 对象队列与推进顺序

按 P2-7 的顺序，每个 agent **必须**走完 6.2 的九步闭环、达到 6.3 的巩固定义，才允许把队列指针移到下一个；**不得越序批量、不得穿插其它类型**。`draft`/`replace`/`baseline --write` 的实现是队列前置（先于试点落最小可用版，序 4 是能力完备 + W6/W7 验收节点）。

| 序 | 对象 | 类型 | 动作 | 对应验收 |
|---|---|---|---|---|
| 0 | 能力前置（draft/replace/baseline 最小可用版 + 守卫迁移） | 能力实现 + 守卫迁移 | 命令落位（不幂等验证）；**gen-agents.test.mjs 的 6 条守卫断言迁入 validateAgentData / check-agents 后删旧测试**（ROLES 递减前先移走硬编码 13 席断言，P2-3） | 前置 |
| 1 | 试点 agent（1 席，如 `reviewer-audit`） | 数据搬家 | ROLES 该席字段迁入组件 → 生成 → 草稿 → 比对 → **替换 → 巩固** | W1 |
| 2 | `senior-sdet` | 手写转录 | 角色卡转录成组件数据（第二套模板）→ 生成 → 草稿 → 比对 → **替换 → 巩固** | W2 |
| 3 | 余下 12 席 agent | 数据搬家 | 逐个 ROLES 搬家 → 生成 → 草稿 → 比对 → **替换 → 巩固**，**逐个**巩固 | W3 |
| 4 | 草稿 → 替换能力完备 | 能力完备 | `draft`/`replace` 幂等 + 纪律验证 | W6/W7 |
| 5 | 终态验收 | 全量 | description 派生锚点（W4）、gate 扩容终态（W5，14 席全入 baseline + 新增旅程）、gen-agents 退役（W8，`gen-agents.mjs` 删）、spike 退役（W9，全部验收后） | W4/W5/W8/W9 |

### 6.2 单 agent 闭环九步（每个都一样）

1. **入选**：确认对象、锁定现产物基线——记录 `git hash-object <产物>` 与 SHA256（双哈希，同 P1 R12）；
2. **数据迁移**：13 席 = ROLES 结构化字段搬家 + **description 拆槽**（domain/role 常量 + when 逐字提取进触发表）+ **同步从 gen-agents.mjs ROLES 移除该席**（数据搬走即删，不留双源）；senior-sdet = 手写正文转录成组件数据（第二套模板，来源声明行更新为生成声明）；**除来源声明行（唯一允许差异）与 description（已定义例外：13 席句式复现原文 / senior-sdet 专属句式复现原文，均逐字相等，见 P2-2）外，内容零改写**（措辞、标点、换行逐字保留）；
3. **生成**：`node tools/docgen/cli.mjs generate --kind agent --name <name>`（内存渲染，不写盘、不落草稿）；
4. **逐字节比对（内存）**：渲染结果 vs 现产物 `Buffer.compare`，**除规定例外字段外必须相等**；不等 = 模板/组件数据有缺陷 → 回炉改组件，**禁止改现产物**（D6）；
5. **接守卫**：对象加入 baseline 比对子集 + 生成清单；`npm run check` 的 gate 开始对该对象做重建比对（**未轮到席在 baseline 常量内只做登记/存在检查（P2-5），已巩固席进比对子集做重建比对**；未轮到席由 gen-agents --check 守至 W8，**停损未迁席由 gate registered 态 + check-agents 守（见 6.4 / §8b）**）；
6. **落草稿**：`node tools/docgen/cli.mjs draft --kind agent --name <name>`——草稿进箱，**`agents/*.md` 零改动**；
7. **替换**（用户确认后）：`node tools/docgen/cli.mjs replace --kind agent --name <name> --draft <草稿>`——先 gate，gate 红 → 拒；替换 = 草稿字节原子写入 `agents/<name>.md`（临时文件 + rename）；
8. **验收**：跑对应 W 行断言 + `npm run check` 全绿 + 后置断言 `git status --short rules/ skills/ agents/` 干净；
9. **巩固**：连续 2 次 gate 运行该对象无漂移（含一次**隔目录冷跑**：将仓库复制到临时目录后跑一次 gate，排除本地缓存/工作区残留影响），确认无副作用，才置「已巩固」。

### 6.3 巩固的定义（达到全部才算，缺一即未巩固）

- 该 agent 已进 baseline 比对子集，`gate` 连续 2 次绿（含一次隔目录冷跑）；
- `npm run check` 全绿（0 findings）；
- `git status --short rules/ skills/ agents/` 干净；
- 旧生成来源对该对象已停止输出（`gen-agents.mjs` 该席已从 ROLES 移除）；
- 对象内容 = 组件数据渲染的字节，人工抽查 1 处关键格与组件数据一致；
- 草稿箱该名下草稿已清（替换完成后）。

### 6.4 失败与回退

- 比对不等（第 4 步）→ 只改组件/模板，现产物不动；同一对象修复 2 次仍不等 → **停止**，写复盘，对象标「停损未迁」，队列停在该对象；**停损席同样纳入 baseline（registered 态，与 gate 漂移回退同构）**，避免落盘旧文件触发 `UnregisteredHandwritten`；
- 守卫阶段发现对象与现产物在 gate 上漂移 → 回退 = 现产物保持原样，对象从比对子集移除，降级为 **registered 态（baseline 清单内不比对）**；**registered 态手改检测语义 = gate 的存在性/登记检查**（文件仍须存在、不可新增清单外文件，逐字节比对豁免、标注未巩固）；
- 替换前 gate 红（**与目标无关的漂移**）→ **拒绝替换**，草稿保留，修组件后重走 4–7；**目标对象自身的预期差异（草稿 == 组件渲染为绑定判据）不构成拒红理由**（§4 / 6.5）；
- 草稿 ≠ 组件渲染 → **拒绝替换**（DraftDrift），提示「草稿被改过，改组件数据重 draft」；
- 环境/基线类红（`EnvironmentEOL`、baseline 类）不计入停损，先修环境再继续；
- **任何对象「停损未迁」都不阻塞已巩固对象**——已巩固的保持生成与守卫生效，未迁对象守卫载体 = 组件数据在 docgen 内 + gate registered 态 + check-agents（遍历排除逐字节比对、标注未巩固、容忍红；存在未迁对象时别名保留）；P2 收口允许「带未迁收口」，条件见 §8。

### 6.5 稳态修改旅程（P2 交付后的日常维护）

迁移完成后，用户改一个已生成 agent 的合法路径（≤10 行）：

1. 改组件数据（agentData / triggerTable / patternRegistry）；
2. `docgen generate --kind agent --name <name>` 内存比对——差异即预期；
3. `docgen draft --kind agent --name <name>` 落草稿箱（`agents/*.md` 零改动）；
4. 用户确认 → `docgen replace --kind agent --name <name> --draft <草稿> --yes` → gate 绿（**目标对象自身预期差异已被 gate 前置排除**，见 §4）。

> **gate 红 ≠ 事故**，而是「有新版本待落盘」的信号：差异来自步骤 1 的改动即预期，走完 2–4 即收敛；若差异非预期（未改组件却红）或红来自与目标无关的漂移，按 6.4 回退排查。**多目标场景（共享模式如 patternRegistry 改动）：逐目标重复 2–4，每步替换仅收敛当前目标（其余目标红 = 同源预期差异，§4 放行），全部目标替换后 gate 才绿**。

### 6.6 迁移状态账本

随队列推进实时维护一张表（本 PRD §6.6，评审时一并核对）：

| 对象 | 类型 | 状态 | 现产物双哈希 | 迁移日期 | 巩固证据 |
|---|---|---|---|---|---|
| `reviewer-audit`（试点） | agent | 未入队 / 迁移中 / 已巩固 / 停损未迁 | `git hash-object` + SHA256 | — | gate 连续 2 次绿输出 |
| `senior-sdet` | agent | 未入队 / 迁移中 / 已巩固 / 停损未迁 | … | — | … |
| 余下 12 席 | agent | 逐行登记 | … | — | … |

> 状态口径：`未入队`（还没轮到）/ `迁移中`（已入队，未过 6.3）/ `已巩固`（过 6.3）/ `停损未迁`（停损放弃，附停损轮次与复盘指针）。**全部 14 个 agent 无「停损未迁」才满足理想收口；带未迁按 §8 例外收口条款（≤3）收口**。

> **S1 终态（2026-10-19，能力与终态里程碑）**：14 席组件数据已入 docgen（`agentData` 骨架 + `triggerTable` 2 锚点席拆槽）；`agents/*.md` 均未由 docgen 替换 → 全部「未入队（registered 态）」；守卫载体 = gate/check-agents 的 registered 存在性检查 + W4 派生断言（锚点席）+ UnregisteredHandwritten 清单外拦截 + 两清单 baseline 35 条。验收证据（2026-10-19 实跑）：`npm run check` 318 tests 全绿 / gate `baseline 35/35` / W4 黄金断言逐字相等 / W5 基线 35 条 / W8 `gen-agents.mjs` 退役 / W9 `tools/docgen-spike/` 删除。S2/S3/S4 将逐个把 14 席从「未入队」推进到「已巩固」。

## 7 交付物

1. `tools/docgen/components/*.mjs`：specTestCaseGate（迁移）+ agentData（ROLES + senior-sdet）+ triggerTable + patternRegistry（模式登记册）+ validateAgentData（承接 gen-agents.test.mjs 守卫断言）；
2. `tools/docgen/templates/agent.md.tpl`（议会席）+ `agent-handwritten.md.tpl`（senior-sdet）+ rule 模板迁移自 P1；
3. `tools/docgen/cli.mjs`（generate / draft / replace / gate / check-agents / baseline --write）；
4. 草稿箱 `~/.retro-skills/docgen-drafts/`（`draft` 子命令建/列/删/ensure）；
5. baseline 两清单（35 条，**常量 P2 开工即收录、比对子集随迁移演进**，见 P2-5）+ `.gitignore` 更新；
6. `scripts/check-all.mjs` 的 gate 调用切换到 `tools/docgen/cli.mjs gate`，**baseline 断言参数化**（从共享常量派生 `baseline N/N`，不再硬编码 21/21）；**切换与守卫迁移同批（序 0）完成**（否则迁移期巩固判据「gate 连续 2 次绿」在 spike gate 下不含 agent 重建比对而空转）；
7. 删除：`tools/docgen-spike/`（W9 后）；`skills/parliament/scripts/gen-agents.test.mjs`（**序 0**，守卫断言迁入 validateAgentData / check-agents 后即删）；`gen-agents.mjs`（**W8**）；parliament `SKILL.md` 与 `assembly-matrix.md` 的生成指令更新为 docgen 流程（序 0 / W8 一并）；
8. 本 PRD 拆出的 spec + 独立 testcase（spec 评审时齐）。

## 8 退出与下一份

- **收口两层**：**理想收口** = W1–W9 全绿且 14 席无「停损未迁」，写回 `docgen-index.md` 的 P2 状态（**验证通过**）；**例外收口** = 带未迁 ≤ 3（满足下 a/b/c），此时 W3/W8 对未迁对象以 §8(b) 条件替代判据。
- **带未迁收口**：若存在「停损未迁」对象，P2 例外收口允许 ≤ 3 个未迁对象，条件是 (a) 明确登记在 6.6 账本（含停损轮次与复盘指针）、(b) 未迁对象守卫载体 = 组件数据在 docgen 内 + gate registered 态（6.4）+ check-agents（跳过逐字节比对、做存在性检查 + 标注未巩固 + 容忍红；存在未迁对象时别名保留，W8 不摘）、(c) 写清后续收口时机（随 P3 开工批次补迁或用户裁定）。
- **例外收口下的未入队席处置**：W8 删 `gen-agents.mjs` 前，先把队列中「未入队」席的 ROLES 数据**迁入 docgen 组件并置 registered 态**（数据源不随退役丢失）；未入队席守卫 = baseline 登记/存在检查 + check-agents（并入 registered 豁免口径）；§8(c) 补迁数据源 = 已迁入 docgen 的 registered 数据，P3 开工时从 registered 态转比对子集。
- **P3（rule 生成扩容）** 开卷前置：P2 验证通过——rule 六组合骨架 + 其余手写 rule 收编，复用 P2 的组件/模板/cli 基建 + 草稿机制 + 模式登记册。
- **P4（skill 生成）** 开卷前置：P2 验证通过——frontmatter + 正文转录，17 个手写 skill 按需收编（D16），复用 P2 基建 + 草稿机制 + 模式登记册。
- P3 / P4 依赖 P2 的 `tools/docgen/` 管线与草稿机制，立项时直接复用。

## 9 与 spec / testcase 的关系

本 PRD 不直接产生 testcase。由它拆出的 spec 必须同批产出独立 testcase（`spec-testcase-gate` 规则判据 1–5），否则 spec 不算定稿、不得进 plan。

> 拆分提示（给 prd-to-specs）：P2 因 P2-7 的串行节奏，spec 应按「agent 类一组」拆，内部按对象粒度分任务；每个对象任务的验收锚点 = 对应 W 行；description 派生（P2-2/P2-8）、迁移期数据所有权（6.2 步 2）、带未迁收口（§8）须在 testcase 中独立覆盖。

## 10 Spec 路线图

> 拆分决策（2026-10-19，用户确认「按对象拆多份」）：P2 拆 **4 份 spec** + 每份独立 testcase（`spec-testcase-gate` 判据 1–5）。拆分依据 = 对象粒度（能力与终态 / 试点 / senior-sdet / 余下 12 席），每个对象任务的验收锚点 = 对应 W 行。

### 依赖图

```text
S1（能力与终态，序 0+4+5，先行）
└──→ S2（试点 1 席，序 1，W1）      [依赖 S1]
      └──→ S3（senior-sdet 转录，序 2，W2）[依赖 S1 + S2]
            └──→ S4（余下 12 席，序 3，W3）[依赖 S1 + S2]
S1 终态任务（W4/W5/W8/W9）依赖 S2/S3/S4 完成后再验收
```

> **串行链（非并行）**：S2/S3/S4 都写 `tools/docgen/components/agentData.mjs` 与 `agents/*.md`、共享 baseline 扩容——变更半径重叠，**严格按队列序 1→2→3 串行执行**（PRD 6.1），不可并行开发。S1 的序 0 能力先行落位，序 4/5 终态依赖对象迁移完成。

### S1 · docgen-agent-capability — 能力与终态（依赖：无，先行）

- **边界**：序 0（CLI 基建 `tools/docgen/`、草稿箱、守卫迁移、check-all 参数化、baseline 两清单 35 条）+ 序 4（draft/replace 幂等完备）+ 序 5（W4 派生 / W5 扩容+新增旅程 / W8 退役 / W9 spike 退役）；**不做**任何单席数据搬家（那是 S2/S3/S4）。
- **大纲**：
  - 落位 `tools/docgen/` 组件 / 模板 / CLI 与草稿箱机制（P2-4/P2-6）
  - gen-agents.test.mjs 守卫断言迁入 validateAgentData / check-agents（P2-3）
  - baseline 两清单 35 条常量 + check-all 参数化（P2-5）
  - W4 description 派生锚点 + gate 全 14 席断言
  - W5 gate 扩容 + 新增 1 席受控变更旅程
  - W8 gen-agents 退役 / W9 spike 退役（等价迁移表）
- **验收锚点**：W4 / W5 / W6 / W7 / W8 / W9（PRD §5）+ 退出码五档（PRD §4）+ P2-遗-1/2/3/6/8

### S2 · docgen-agent-pilot — 试点 1 席（依赖：S1）

- **边界**：`reviewer-audit`（试点）数据搬家走完九步闭环（6.2）到巩固（6.3）；**不做**其它席、不做 senior-sdet。
- **大纲**：
  - ROLES 该席字段迁入组件 + description 拆槽（6.2 步 2）
  - 生成 → 逐字节比对（排除 description）→ 落草稿 → 替换 → 验收
  - 迁移前黄金断言「派生 description == 现文件 frontmatter」（P2-遗-7）
  - W1 验收（含 gen-agents 该席产物 = docgen 产物，黄金快照时序）
- **验收锚点**：W1（PRD §5）+ P2-遗-7（黄金快照时序）

### S3 · docgen-agent-senior-sdet — senior-sdet 转录（依赖：S1 + S2）

- **边界**：`senior-sdet` 手写卡转录成组件数据（第二套模板，P2-1）；**不做** 13 席、不做草稿能力本身。
- **大纲**：
  - 手写正文转录 + 来源声明行更新（W2 唯一允许差异）
  - 专属 description 句式（身份句 + when + `Do not use for` + notWhen，P2-2）
  - 翻译质量三标准自评写入组件数据注释（P2-遗-9）
  - 转录九步闭环到巩固
- **验收锚点**：W2（PRD §5）+ P2-遗-9

### S4 · docgen-agent-batch — 余下 12 席（依赖：S1 + S2）

- **边界**：余下 12 席逐个 ROLES 搬家，逐个走九步闭环、逐个巩固（P2-7 / 6.1 序 3）；**不做**试点已迁席、不做能力。
- **大纲**：
  - 12 席逐个：ROLES 搬家 + description 拆槽 → 生成 → 比对 → 草稿 → 替换 → 巩固
  - 逐席迁移前黄金断言（P2-遗-7）
  - 每席巩固后才下一席（W3）
- **验收锚点**：W3（PRD §5）+ P2-遗-7

### 你要做的事 → 读这些

| 你要做 | 必读 |
|---|---|
| 实施 S1 | S1 spec + 本 PRD §3/§4/§5/§7/§8 |
| 实施 S2 | S2 spec + S1 spec（能力前置）+ 本 PRD §6.1–6.4 |
| 实施 S3 | S3 spec + S1 spec + S2 spec（试点模板已验证）+ 本 PRD §6.1–6.4 |
| 实施 S4 | S4 spec + S1 spec + S2 spec（试点模板已验证）+ 本 PRD §6.1–6.4 |

### 跨文件关键设计决定（2026-10-19 定）

- **shared-退出码**：五档退出码完整映射（0/1/2/3/4）在 S1 定义并落 testcase；S2/S3/S4 的 testcase 引用 S1 码表，不重复定义（P2-遗-6）。
- **shared-迁移闭环**：九步闭环（6.2）+ 巩固定义（6.3）+ 失败回退（6.4）在 S1 落地为组件/CLI 能力；S2/S3/S4 引用 PRD §6，不复制正文（双份真相禁令）。
- **shared-黄金断言**：迁移前「派生 description == 现文件 frontmatter」断言口径由 S2 首次落 testcase；S4 复用（P2-遗-7）。
- **shared-registered**：未入队 registered 席的计数 / 守卫 / 收口口径在 S1 定义，S2/S4 迁移期引用（P2-遗-1/2/3）。

### 注意

- spec 首行保留追溯标记 `> split from docs/prd/docgen-agent-generation.md (2026-10-19)`。
- 每份 spec 必须同批产出独立 testcase（senior-sdet 全新上下文编写），一起送议会；缺 testcase 不得送议会、不得进 plan（`spec-testcase-gate`）。
- shared 文件在第一个引用它的 spec 开工时创建，内容用引用指向 PRD，不抄写。
