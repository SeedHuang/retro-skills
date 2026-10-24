# 开发工作流主干 S1：骨架落地（skill + rule + evidence-reader）

> 拆分自 `docs/prd/dev-workflow-mainline/20261024073606-dev-workflow-mainline.md` §12「S1 主干骨架」（2026-10-24）
> 日期：2026-10-24｜状态：待评审（spec + testcase 一起送议会）｜PRD 状态：**待评审（未定稿）**——PRD §11 已全部有结论，但 18 条为 `[已决·代裁]`，用户尚未逐条扫；用户 2026-10-24 裁定**路径 A**：允许 S1 带着「上游未过 §0」送审（送审说明须写明，见 §11）
> 测试用例文件：`docs/superpowers/specs/2026-10-24-dev-workflow-skeleton-design-testcase.md`
> 依赖：PRD §3.2 / §3.3（权力三分与三权分离）、§4 / §4.1（五段与功能块）、§5（两次议会与镜像判据）、§6（plan 门）、§8.4（图双判据）、§12（S1 范围）、F-17 / D-18 / D-19 / D-23

## 0 为什么

PRD 定了主干要长什么样，但**没有任何一份载体能让 agent 在真实任务里按它走**：五段只存在于 PRD 的表格里，「现在该进哪一段」「这段的出口齐了没有」每次都要人复述。S1 的唯一目的，是把主干从「PRD 里的一段描述」变成**每轮都能被读到的三件载体**：

1. 一份技能 `skills/dev-workflow/`——告诉 agent 五段的顺序、每段的出口判据、两个议会插点在哪；
2. 一条规则 `rules/dev-workflow-mainline.md`——把「不许跳段、不许自签出口、不许在 plan 阶段补 spec」变成每轮自动加载的约束；
3. 一个新角色 `agents/evidence-reader.md`——让长文（对话记录 / 评审账 / 规范）的取证有独立的人做，主 agent 不再既当读者又当引用者。

这三件全是**只读 / 文档**，不依赖 S5 的工具档位，因此能独立验收（这是 PRD §11 的 D-17「工具档位单列 S5」的理由）。

**术语（本文件首次出现即定义，避免读者中途进入时卡在词上）**：**功能块** = 一个功能完整、可独立验收、AI 在 1～1.5 小时内能做完的交付单位（PRD §4.1）；**功能点** = PRD 里带 `F-xx` 编号的需求单元（PRD §10）；**sdet** = `agents/senior-sdet.md` 那个测试开发子代理；**审计** = `agents/reviewer-audit.md` 那个独立核对子代理。

> 文中出现的 PRD 决策编号（D-17 / D-18 / D-19 / D-22 / D-23）均指 `docs/prd/dev-workflow-mainline/20261024073606-dev-workflow-mainline.md` §11 的待确认清单条目。

## 1 全貌确认

| 维度 | 内容 |
|---|---|
| 本质 | 把「五段 + 两插点 + 三权归属」落成三件可加载的载体，让主干可执行、可核对 |
| 同族 | 同类失败面：技能写了但没出口判据（变成口号）；规则与 PRD 各写一份判据（两处漂移）；新角色卡绕过生成器（`UnregisteredHandwritten`）；登记了却没进 state（A 组检查静默漏检）；description 与角色真实职责不符（路由骗人） |
| 边界 | 只做「骨架 + 判据 + 取证角色」。**不做**：议会内部改造（S3）、市场 / 产品经理卡与 PRD §0（S2）、功能块滚动拆与 plan 脚本（S4）、`producer` / `research` 档（S5） |
| 验收 | 三件载体落地且**进入运行时**；`npm run check` 全绿且 docgen gate 输出 `baseline 37/37`；新规则与技能 0 findings；`evidence-reader` 卡由生成器产出且与源逐字节一致 |
| 影响面 | `skills/dev-workflow/**`（新增）、`rules/dev-workflow-mainline.md`（新增）、`agents/evidence-reader.md`（新增）、`tools/docgen/components/{agentData,patternRegistry,outputFormats,validateAgentData,renderAgent,baseline}.mjs`、`tools/docgen/templates/agent.md.tpl`、`tools/docgen/{baseline,state}.json`、`rules/.inspector-annotations.json`、`tools/execution-matrix/criteria.md`、`scripts/check-all.mjs`、`tools/docgen/test/**`（**12 处**计数改派生）、`skilldependencies/{manifest,dev-workflow,validate.test}.json|mjs`、`README.md`、`docs/guide/skills/README.md`、`docs/guide/rules/README.md` |
| 联动四问 | 治本吗：治——出口判据与三权归属都进载体，不再靠复述；有副作用吗：动生成器数据会牵动 14 席渲染与 **12 处**硬编码计数（§7.5 逐行列出并一律派生化）；跨问题联动吗：D-19 命名、D-23 reader、D-18 顺序是同一组裁定，S1 是它们的第一处落地；跨项目吗：`patternRegistry` / `validateAgentData` / `agent.md.tpl` 是全仓共用，改动必须向后兼容（默认值不变） |

## 2 范围与交付物

| # | 交付物 | 类型 | 存在的理由 |
|---|---|---|---|
| P-1 | `skills/dev-workflow/SKILL.md` | 新增 | 主干入口：何时用、五段表、两插点、**三权总则**、**取证调度**、指针 |
| P-2 | `skills/dev-workflow/references/` 下 **6 份**：`stage-1-prd.md`、`stage-2-tech-design.md`、`stage-2b-plan-gate.md`、`stage-3-implementation.md`、`stage-4-quality.md`、`stage-5-delivery.md`，外加 `gate-record.md`（出口核对记录表，R1–R7 的唯一证据载体） | 新增 | 五段各一份 + 计划门单独一份（门有独立签字人与脚本判据，塞进段③的入口会把它埋掉）+ 一张记录表；SKILL.md 只留判据与指针（骨架不内联） |
| P-3 | `rules/dev-workflow-mainline.md` | 新增 | 把「不许跳段 / 不许自签 / 不许在 plan 补 spec / 引用长文必须取证」变成每轮加载的约束 |
| P-4 | `agents/evidence-reader.md` | 新增（生成物） | F-17 阅读取证角色，只交原文 + 行号，不出观点 |
| P-5 | 生成器与登记面 **11 处**（C1–C11） | 修改 | 让 P-3 / P-4 能过 `npm run check`（登记、渲染、枚举、断言、计数、漏登守卫、边界句与自由探索槽位、判据形态适配） |
| P-6 | 技能/规则登记与文档面 **4 处** | 修改 | 新技能漏登记会让 `npm run check` 直接红；新增规则不 `aas sync` 则运行时零加载 |
| P-7 | **运行时就位**：`aas sync` + `aas` 体检（需建链接 0） | 执行步骤 | 规则与技能只在仓内存在 = 从未生效（`rules/rules-single-source.md`）；S1 的目的就是「每轮被读到」 |

**P-6 明细**：

| # | 文件 | 改什么 | 判据 |
|---|---|---|---|
| D1 | `skilldependencies/manifest.json` | `skills` 数组加 `dev-workflow` | 目录与 manifest 一一对应（`validate.test.mjs`） |
| D2 | `skilldependencies/dev-workflow.json` | 新建：`{"schemaVersion":1,"skill":"dev-workflow","dependencies":{"skills":[{"name":"parliament"},{"name":"prd-to-specs"}]}}`；并在 `skilldependencies/validate.test.mjs` 加一条集合断言（删一个 / 多一个都红） | `skill` 字段 == 文件名；依赖集合**恰为** `parliament` + `prd-to-specs`（S1 只引用这两个技能：议会插点归 `parliament`、阶段②拆 spec 归 `prd-to-specs`）。只靠 schema 校验守不住「该依赖哪两个」 |
| D3 | `README.md` + `docs/guide/skills/README.md` + `docs/guide/rules/README.md` | 加 `dev-workflow` 一行；**技能与规则数量都不再写死**（现「十八个 / 二十条」→「清单见 `skilldependencies/manifest.json` / `rules/`」） | 人工核（无机器判据）+ TC-E23 禁词探针；写死数字＝下一次加技能/规则必漂——与 §7.5 同一条病。**实测现状已漂**：`README.md` 与 `docs/guide/rules/README.md` 都写「二十条」，而 `rules/*.md` 已是 21 条 |

**已知限制（不在 S1 修）**：`skilldependencies/validate.test.mjs:6` 用绝对路径 import 外部仓的校验模块，换机器即红，与本 spec 无关；只在送审说明里记一笔。

**不做什么**（对应 PRD 的 S2–S5）：不新增议会席位、不改两张矩阵、不动 `host-duties.md`、不建 `producer` / `research` 档、不写 `check-prd-graph.mjs`、不建市场 / 产品经理 / speaker 卡。

## 3 五段主干（P-1 / P-2 的内容判据）

### 3.1 段表（SKILL.md 必须有一张，内容 = PRD §4 的副本）

> **唯一真相 = PRD §4**。本表是它的逐字副本，**只多拆出「名称」「入口」两列**（PRD 把段名写在段标记后、不设「入口」列）。两者不一致时以 PRD 为准；施工以 PRD 为输入，不照抄本节。
> **为什么还留一份副本、而不是只放指针**（议会第 2 轮审计提过「少存一份」）：段表是 SKILL.md 每轮要读的核心判据，只写「见 PRD §4」会被跳过（`rules/reference-read-output-loop.md` 已在同类形态上踩过）；故保留可机读副本 + 用 V-3 / TC-A04 / TC-E21 逐格比对兜住漂移，**不采纳「只放指针」**——代价是每次改 PRD §4 要同批改这里，收益是每个读 SKILL.md 的人不必跳到 PRD。

| 段 | 名称 | 入口 | 出口判据 | 谁签 | 议会 |
|---|---|---|---|---|---|
| ① | PRD（需求产生 + 产品设计） | 用户给出想法 / 市场调研结论 | §0 四栏齐 + 依据可核；功能点清单与流程图**双向**一一对应 | 产品经理 + 用户；审计核 §0 | **议会 #1** |
| ② | 技术设计 | ①通过 | spec + testcase **一件**齐；差异清单留痕；内部对齐零未决 | 主 agent + sdet | **议会 #2** |
| ②→③ | 计划门 | ②通过 | 功能点全覆盖 / 依赖无环 / 功能块↔testcase 一一映射 | 脚本 + **审计本人读并签字** | **无议会** |
| ③ | 技术实现 | 计划门通过 | 施工完成、`npm run check` 绿 | 开发 | 无 |
| ④ | 质量保证 | ③完成 | testcase 全过；负例与边界条数 ≥ 正例 | sdet | 无 |
| ⑤ | 产品交付 | ④完成 | 交付审计（含数字签字项） | 审计 | 无 |

**为什么表里 6 行而叫「五段」**：`②→③` 是**门**不是段。SKILL.md 必须显式写这一句，否则读者会数出六段，与 PRD 术语脱钩。

**议会有条件（不通过怎么办）**：段表「议会」列非空的段，收口 = 出口判据齐 **且** 该议会通过（P0 = 0、必修项清零）。不通过 → 留在本段，按 `parliament` 技能的收敛规则循环，**不得带未收敛项进入下一段**；不通过的记录写在议会自己的评审账里，不另建第二处。SKILL.md 必须有一段同时写出「议会通过」与「不得进入下一段」。

**过渡口径（S2 前有效，产品经理卡落地即删）**：① 的签字人写「**用户**签字；产品经理一职由主 agent 代拟，PRD 头部注明『代拟：主 agent』——代拟者不签字」；「市场调研结论」入口标「S2 前由用户提供或省略」。SKILL.md 的 ① 段照抄同一句并写出失效条件——否则 S1 一落地，所有任务都会卡在第一段（产品经理卡要到 S2 才存在，而执行顺序是 S1→S3→S2）。

### 3.2 每份 `references/stage-*.md` 的必备小节

| 小节 | 内容要求 | 缺了会怎样 |
|---|---|---|
| 入口条件 | 什么状态才算「上一段已收口」，可机械核对（有文件 / 有签字 / 有命令输出） | 段边界靠感觉，跳段无人发现 |
| 出口判据 | 每条都是可判定的句子（有 / 无、相等 / 不相等），不写「质量达标」 | 出口变成愿望 |
| 谁签 | 签字人 + 签字必须带的证据（读了哪几节 / 跑了什么命令） | 出现橡皮章 |
| 三权归属 | 本段「谁申报 / 谁定性 / 谁核对」各一行（PRD §3.3） | 当事人自己定性 |
| 常见漏项 | 3–5 条，来自本仓真实踩坑 | 同一个坑每轮重踩 |

**「读→产出」闭环（F14 修法）**：SKILL.md 的每个段行不得只写「判据见 `references/stage-N-*.md`」——那按 `rules/reference-read-output-loop.md` 等于没写。每个段行必须写成「开工前按 `references/stage-N-*.md` 的出口判据逐条核，产出**已核清单**（`references/gate-record.md` 的表格行：判据原文 + 证据：命令输出首行或 `path:line`），缺清单不得进入下一段」。

`stage-2b-plan-gate.md` 额外要求：把门的**三条脚本核对**（功能点全覆盖 / 依赖无环 / 功能块↔testcase 一一映射）逐条写清判据与核对方式，并写清「审计签字必须附哪几条输出」——只签字不读按不通过处理（PRD §6）。

**脚本未落地期的写法（重要）**：`check-plan.mjs` 归 S4，S1 阶段它**不存在**，因此这一节不得写成「跑这三条命令」了事。每一条都要写成「判据 + 二选一证据」：① 脚本上线后 = 命令 + 输出；② 脚本上线前 = 审计手工核对表（逐条填：核了什么 / 怎么核的 / 结论）+ 原始命令原文。**不许只写命令、让人以为现在就能跑**。

### 3.3 两个议会插点

SKILL.md 必须写清「议会只在两处插点」并给理由（PRD §4 / §5）：① 之后审 PRD；② 之后审 spec + testcase。**计划门不设议会**（PRD §6：脚本能查的集合比对，人不比脚本准）。

## 4 `skills/dev-workflow/` 的结构约束

| 约束 | 判据 |
|---|---|
| frontmatter | 必须有 `name: dev-workflow` 与 `description`；`description` 写「什么时候用 + 不用于什么」 |
| 不在 SKILL.md 内联骨架 | 五段的详细判据放 `references/`，SKILL.md 只留表 + 指针 + 一句话理由；**机器判据**：SKILL.md 内 `^## (入口条件\|出口判据\|谁签\|三权归属\|常见漏项)` 命中数必须为 0 |
| 每个段行带「读→产出」 | 段行必须同时出现 `references/stage-N-*.md` 与「已核清单」「缺…不得进入下一段」（见 §3.2） |
| 必须有「三权总则」节 | 单独一节写申报 / 定性 / 核对三权与「申报人不得自定性」；缺 = 不通过（此前无判据，见 F21） |
| 必须有「取证调度」节 | 凡引用长文（对话记录 / 评审账 / 规范）得出的结论，先由 `evidence-reader` 产出「原文 + 行号」，主 agent 不得直接以自读摘要作引用依据；写明「常驻 ≠ 每轮必跑」 |
| 自引用用相对路径 | `references/stage-1-prd.md`，禁止写 `dev-workflow/references/...`（`skill-authoring-convention` 判据 ②） |
| 跨技能引用只写技能名 | 「调用 `parliament` 技能」「判据以 `prd-to-specs` 技能为准」，禁止写对方技能内部文件路径（同规则判据 ①） |
| 不新增 scripts / assets | S1 无脚本、无模板；将来需要时另开 spec |

## 5 `rules/dev-workflow-mainline.md` 的判据要求（P-3）

规则文件必须按本仓 rule 五段结构写（适用范围 / 冲突裁决 / 例外 / 触发时机 / 验证），并含下列判据条目。**判据内容锚在 PRD，不复制 PRD 正文**（引用节号即可）。

**唯一证据载体**：`skills/dev-workflow/references/gate-record.md` 固定表头 = `段 | 出口判据（逐条） | 核了什么（命令输出首行 或 path:line） | 申报人 | 签字人 | 结论`。R1–R7 全部指它，**规则内不再自存任何名单或状态标记**（名单以 PRD §4 段表「谁签」列为唯一来源）。

| # | 判据（写成义务句） | 判定方式（可机械判的部分） | 出处 |
|---|---|---|---|
| R1 | 进入任一阶段前，必须确认上一段出口判据已齐；不齐不得开工 | `gate-record.md` 该段的行必须齐 6 列，且「核了什么」列不得为空、不得只写「已核」（须为命令输出首行或 `path:line`）；「议会」列非空的段额外核议会通过记录 | PRD §4 |
| R2 | 不得自签出口 | 该行「签字人」≠「申报人」；签字人必须是 PRD §4 段表该行「谁签」列所列角色；作者定义：PRD→产品经理、spec→主 agent、testcase→sdet、代码→开发、审计结论→审计 | PRD §3.3 |
| R3 | 议会只在两处插点；计划门不设议会 | `gate-record.md` 里「议会」列非空的行数 = 2；计划门行的「签字人」含「审计」且「核了什么」含命令输出 | PRD §4 / §6 |
| R4 | plan 阶段发现 spec 未定义的东西，必须回流 spec 重审 | plan 文件出现 `## 新增设计决策` 节，或触及 spec 标记「不改」的行 → 违规（位置型，不靠语感） | PRD §6 |
| R5 | 产品经理改动功能点集合 = 「功能增删」类漂移，必须回 PRD 重签 §0 | 功能点 ID 集合 diff 非空且 PRD §0 无重签记录 → 违规 | PRD §7.2 / D-22 |
| R6 | 功能块按块滚动拆，不提前批量拆 | `gate-record.md`（或计划表）中「状态 = 拆 spec 中」的行数 ≤ 1（计数型） | PRD §4.1 |
| R7 | 引用长文的结论必须来自 `evidence-reader` 的取证摘要 | 送审 / 交接材料里引用了对话记录、评审账、规范原文的结论，必须带 `path:line` 且能追到一份 `evidence` 产出；无出处 = 违规 | F-17（PRD §10） |

**规则的边界**：R1–R7 只管「主干怎么走」。不写「怎么评审」（`parliament`）、不写「怎么拆 spec」（`prd-to-specs`）、不写「怎么写 testcase」（`spec-testcase-gate`）——那些已有载体，重复即漂移。

**「例外」节必写内容（F18 修法）**：① 本规则生效前已定稿的 spec 按 `spec-testcase-gate` 的存量例外处理；② 进 ③ 时必须点名「存量豁免 + 升级时点（具体日期或可核事件）」；③ 升级时点不得写「以后 / 下次」。**例外节只写「无例外」= 不通过**——本仓现有 25 份零 testcase 的存量 spec，一刀切会让规则上线第一天就大面积无法开工。

**「验证」节必须给两条自查命令**（可粘贴执行）：① 签字人 ≠ 申报人的行数 = 总行数；② 「拆 spec 中」行数 ≤ 1。

## 6 `agents/evidence-reader.md`（P-4）

### 6.1 定名：`evidence-reader`（不是 PRD 的暂名 `reader`）

PRD D-23 写的是**暂名** `reader`。S1 定为 `evidence-reader`，理由：`agents/reviewer-reader.md`（读者代表）已存在，裸 `reader` 会让「派 reader 还是 reviewer-reader」在主 agent 侧反复出错；`evidence-reader` 按**做的事**命名（取证），与 `reviewer-*`（第三方评审）、`respondent-*`（被告）天然分族（D-19 的三类前缀）。

### 6.2 角色定义（写进 `agentData` 与触发表）

| 字段 | 值 / 要求 |
|---|---|
| `name` | `evidence-reader` |
| `role` | `阅读取证员` |
| `dimension` | `取证` |
| `tools` | `Read, Glob, Grep`（**必须恰等于** `patternRegistry.tools.readOnly`） |
| `identity` | 通读长文（对话记录 / 评审账 / 规范），**只交「原文 + 行号 + 出处」**的事实摘要；不出观点、不出问题卡、不参与评审、不改任何文件 |
| `fixedList` | 5–7 条必办核对：每条摘要带文件 + 行号；区分「原文这么说」与「我的概括」；找不到的项要单列「未找到」而不是猜；不引用二手转述；长文超限要报「读了多少、跳了哪些」 |
| `outputKind` | `evidence`（**新增枚举值**，改动见 §7.1 C3；字段读法见 §7.2） |
| `boundary` | 「你是只读取证角色：不得创建、修改、删除任何文件；不出观点、不出问题卡、不参与评审、不判技术对错；只交可核对的原文与行号」（**新增槽位 `{{BOUNDARY}}`**，见 C10；默认句仍是原「只读评审角色」，14 席不受影响） |
| `explorePolicy` | `none`（**新增可选字段**，见 C11）：本角色不做自由提问，渲染为「本节不适用：本角色只交原文与行号，不出观点、不提问题」；默认 `full`（= 模板现句，14 席不受影响） |
| 触发 `when` | 「当需要通读长文并交出可核对的原文与行号（交接取证 / 事实基线回核）」（不含「时调用」、不以「时」结尾） |
| `domain` | `开发工作流`（**新增可选字段**，见 §7.3；议会席位默认 `议会评审`） |

### 6.3 与既有角色的边界

| 角色 | 交什么 | 不做什么 |
|---|---|---|
| `evidence-reader`（新增） | 原文摘句 + 文件 + 行号 + 未找到项 | 不出观点、不出问题卡、不判对错 |
| `reviewer-reader`（已有） | 问题卡（读者视角的可读性缺陷） | 不做取证 |
| `detective-observer`（已有） | 观察记录（评委 / 答辩 / 主持人的行为核对） | 不读长文取证 |

## 7 生成器与登记面（P-5，逐处列全）

### 7.1 必须改的 11 处

| # | 文件 | 改什么 | 不改会怎样 |
|---|---|---|---|
| C1 | `tools/docgen/components/agentData.mjs` | 新增 `evidence-reader` 条目（含 `boundary` 与 `explorePolicy: 'none'`）；`triggerTable` 新增同名条目 | gate 报 `UnregisteredHandwritten`（`agents/*.md` 不在登记表） |
| C2 | `tools/docgen/components/baseline.mjs` | `BASELINE_RULES` 追加 `rules/dev-workflow-mainline.md`（21 → 22 条） | 新规则进不了 gate，且 gate 报 `UnregisteredHandwritten` |
| C3 | `tools/docgen/components/patternRegistry.mjs` | `outputKind` 集合加 `evidence`；**三个默认常量只在这里存一份**：`DEFAULT_BOUNDARY` / `DEFAULT_EXPLORE` / `DEFAULT_EXPLORE_NONE`（`DEFAULT_EXPLORE_NONE` 是 C11 用的「本节不适用」句） | `InvalidOutputKind`；常量分散两处 = 下一次改默认句必漂 |
| C4 | `tools/docgen/components/outputFormats.mjs` | 新增 `evidence` 输出格式（取证摘要表） | 该节渲染为空字符串，而 A7 **只查节名存在**（`check-agent.mjs` L121）→ **全部机器检查仍绿**；唯一防线是 TC-B04 的内容探针（原写「A7 会红」是错的，见 F21） |
| C5 | `tools/docgen/components/validateAgentData.mjs` | ① `BASE_KEYS` 加 **`domain` 与 `boundary` 与 `explorePolicy`** 三键；② 断言 8 的 description 派生按 `domain` 取值（默认 `议会评审`，与现在逐字一致），并追加一致性：`domain` 存在时先 `trim`、非空，且派生出的 description 必须真的包含它（**不用 `includes('')` 这类恒真写法**）；③ 断言 15 白名单同步；④ `boundary` / `explorePolicy` 只允许出现在显式声明它们的席（当前仅 `evidence-reader`），否则报既有码 `DescriptionDerivation`（不新造错误码——`exitCodeFor` 对未知码会抛） | 新字段被判非法（`TriggerFieldMisplaced`）；或 15 席 description / 边界句全变；或字段成了不生效的死字段 |
| C6 | `tools/docgen/baseline.json` | 用 `node tools/docgen/cli.mjs baseline --write` 重生成（35 → **37** 条 = 22 rule + 15 agent） | `BaselineDrift` |
| C7 | `tools/docgen/state.json` | 加 `"evidence-reader": "replaced"`（**必须在 C1 之后**，否则 `readState` 抛 `StateFileInvalid`）。**新席不走上架 `replace` 的迁移段**：`cmdReplace` 在 `state ≠ replaced` 时要求 `evidence.renderSha256` / `goldenAssertion='pass'` / `compareResult=null` 三件，而 `golden-assert.mjs` 用 `description.parliament(role, when)`（**不传 domain**）派生 → 与 reader 的「开发工作流」description 恒不等，必然 `EvidenceInvalid`；且它还要求卡已在某个 commit 上（`git show <commit>:agents/...`），新席无旧版可保护。故新席通路 = `generate` 出草稿 → 人工对照确认 → 直接落 `agents/evidence-reader.md` → `setAgentState` 登记 `replaced`，**证据由 `gate` 逐字节比对代替**（旧版的「永不静默替换」约束在这里没有对象） | A 组 + 十键检查的覆盖集从 state 现算，漏了就是漏检；照 `replace` 走必被三件证据卡死 |
| C8 | `rules/.inspector-annotations.json` | 加 `evidence-reader:{A1,A2,B1..B4,C1..C4}` 共 10 键。每键的值按 `criteria.md` 三态写：合格填 `pass`；不合格填 `fail: <理由>` 并进打回清单——**不存在「只能填 pass」**，注入 pass 即自签 | 缺键即进 findings，`npm run check` 不会绿；只给 pass 一条路 = 逼人自签 |
| C9 | `scripts/check-all.mjs` | 在现有 `readState()` 之后加一条 fail-closed 断言：`state.agents` 的键集 ⊇ `agentData` 的名字集，缺键即 `failed = true` 并打印缺哪个；**state 文件整体缺失也一律报红**（不沿用「缺失 = 全量 registered」的宽松语义） | C7 靠自觉——将来再加席漏登 state 时，A 组检查静默跳过它，谁都不会红 |
| C10 | `tools/docgen/templates/agent.md.tpl` + `renderAgent.mjs` | 末节「边界」改槽位 `{{BOUNDARY}}`，`renderAgent` 用 `agent.boundary ?? DEFAULT_BOUNDARY`；14 席不带该字段 → 逐字节不变 | 现句是「你是只读**评审**角色……无中断评审的权力」——`evidence-reader` 不评审，照抄等于让卡自我描述错误 |
| C11 | `tools/docgen/templates/agent.md.tpl` + `patternRegistry.mjs` / `renderAgent.mjs` + `tools/execution-matrix/criteria.md` | ① 「自由探索（必做）…生成 3-5 个问题…只答固定清单 = 不合格」这一节改槽位 `{{EXPLORE}}`，`renderAgent` 用 `agent.explorePolicy === 'none' ? DEFAULT_EXPLORE_NONE : DEFAULT_EXPLORE`；② `criteria.md` 的「0.2 模板形态适配」补一条：`explorePolicy: none` 形态下 **B4（自由探索要求）按形态适配判 pass**，C2 同款，理由写「该形态已显式声明不提问」；③ 通用纪律里「只提问题不给解法 = 无效产出」同样按形态适配 | 保留模板句 → B3（职责动作被边界禁止）该判 fail；删掉模板句 → B4（无自由探索要求）该判 fail；两条路都到不了「10 键全 pass」→ 只能注入 pass |

**C8 的判者与证据**：10 个键各写判者与依据（谁判、哪几行卡文），判者不得是 `evidence-reader` 自己的施工者；建议由 `rule-inspector` 技能产出 A/B/C 判定后回填，并在送审说明里附判定输出。判不合格就走 `fail: <理由>` + 打回清单，**不许为了全绿改判 pass**——`criteria.md` §三态明确禁止把「已判过」与「判过且合格」压成布尔。

**C9 为什么不放进 `readState()`**（评审建议过的更彻底方案）：`readState()` 在 state 文件不存在时按既定语义返回空表（`pilot-gate.test.mjs` 依赖「state 缺失 = 全量 registered」），把断言下沉会改掉这条语义并波及多个测试；而生产路径上消费 repo 内 `state.json` 的只有 `check-all`，`check-agents` 直调时也会把缺键显示成「未迁移 ≥ 1」。故放在 `check-all`，并保留「未迁移 0」作为第二道可见信号。

**C10 / C11 的兼容硬约束**：14 席不带 `boundary` / `explorePolicy` → 走默认值，渲染必须逐字节不变；逐字节证据用 `node tools/docgen/cli.mjs gate`（它对 `state=replaced` 的每一席做 `compareBuffers`，14 席全 replaced）。

**接受的一处摩擦**：`evidence-reader` 的 `fixedList` 会渲染在「固定必问清单」表头下（模板常量）。不为它改列头——改列头会波及 13 席既有卡，收益不抵风险；卡正文会写明「本清单是取证必办项，不是提问」。

### 7.2 `evidence` 输出格式（C4 的内容要求）

只收三类内容，机械可核：

| 列 | 内容 | 判据 |
|---|---|---|
| 原文摘句 | 被引用的原句（可截断，但不得改写） | 能在源文件里 `grep` 到 |
| 文件 + 行号 | `path:line`（相对仓库根） | 行号指向的行包含该摘句 |
| 用途 / 交接给谁 | 这句支撑哪个结论 | 空 = 废条 |

另加一行**未找到清单**：找过但没找到的项必须写明「查了什么 + 为什么没找到」，不得留空、不得用推测填。

### 7.3 `domain` 字段（C5）

现状：`patternRegistry.description.parliament(role, when, domain = '议会评审')` 已支持 `domain` 参数，但 `renderAgent` 从不传 → 所有卡都写「在议会评审中担任…」。`evidence-reader` **不是议会席位**，沿用会给出一条误导路由的 description。

改法（最小）：`agentData` 条目可选 `domain`；`renderAgent` 取归一化后的值——`import { DOMAIN } from './patternRegistry.mjs'; const d = typeof agent.domain === 'string' ? agent.domain.trim() : ''; const domain = d || DOMAIN`（**`??` 拦不住空串**：`''` 会拼出「在中担任」，全空格会拼出「在  中担任」，非字符串会被隐式转换；**回落值必须引用 `DOMAIN` 常量、不得内联 `'议会评审'` 字面量**——否则改 `DOMAIN` 时卡面不变，TC-D06 会把这个冲突抓出来）；`validateAgentData` 断言 15 白名单加 `domain`，并把断言 8 的判据写成**等价性**（`derived === 同一函数(agent, when)`）+ 非空校验，**不用 `includes('')` 这类恒真写法**。**默认值不变 ⇒ 现有 14 席渲染逐字节不变**。

### 7.4 state 与 annotations 为什么单独强调

C7 / C8 在 §7.1 已列，这里只写它们**特别容易漏**的原因：

| 项 | 漏了会怎样 | 谁能发现 |
|---|---|---|
| `state.json` 缺 `evidence-reader` | A 组 + 十键检查的覆盖集从 state 现算 → 新席**静默不检**；gate 仍绿 | 只有 C9 的新断言与 `check-agents` 的「未迁移 N」能发现 |
| `.inspector-annotations.json` 缺键 | 缺键直接进 findings，`npm run check` 会红（这条不会静默） | 跑 check 即现 |

### 7.5 硬编码计数：**改为派生化**，不许只改字面量

实测（2026-10-24，`grep` 过 `tools/docgen/test/`）当前有 **12 处**写死了 14 / 35（11 处断言行 + 1 处同行注释）：

| 文件:行 | 现值 | 处置 |
|---|---|---|
| `tools/docgen/test/data.test.mjs:8` | `agentData.length, 14` | 改 `agentData.length === new Set(agentData.map(a=>a.name)).size` + 断言含 `evidence-reader` |
| `tools/docgen/test/data.test.mjs:10` | `new Set(names).size, 14` | 改 `new Set(names).size === names.length` |
| `tools/docgen/test/data.test.mjs:41` | `paths.length, 14` | 改 `paths.length === agentData.length` |
| **`tools/docgen/test/data.test.mjs:50`** | **同行注释 `// 21 + 14 = 35`** | **删掉注释里的数字**（改 `// rule 数 + agent 数`）——不删的话所有「全局 0 命中」型判据永远红 |
| `tools/docgen/test/check-baseline.test.mjs:30` | `json.length, 35` | 改 `BASELINE_RULES.length + agentPaths().length` |
| `tools/docgen/test/check-baseline.test.mjs:36` | `/baseline 35\/35/` | 改从共享常量拼正则 |
| `tools/docgen/test/e2e-final.test.mjs:29` | `n, 35` | 同上（注释里的「35 开工 / 36 新增后」同步改「35 开工 / 37 新增后」） |
| `tools/docgen/test/cli-gate.test.mjs:14` | `/baseline 35\/35/` | 同上 |
| `tools/docgen/test/cli-gate.test.mjs:31` | `/baseline 35\/35/` | 同上 |
| `tools/docgen/test/cli-gate.test.mjs:58` | `/baseline 35\/35/` | 同上 |
| `tools/docgen/test/review-fixes.test.mjs:45` | `/baseline 35\/35/` | 同上 |
| `tools/docgen/test/pilot-gate.test.mjs:38` | `/已接管 0，未迁移 14/` | 改 `未迁移 ${agentData.length}` |

**为什么不是「把 14 改成 15、35 改成 37」**：下次再加席要再改 12 处，漏一处就红一次（历史上这条已经踩过——`checkall.test.mjs` 的「不再硬编码 21/21」就是那次的产物）。计数断言应从 `baseline.mjs` / `agentData` 派生，字面量只允许留在测试标题里。

### 7.6 兼容性硬约束

| 约束 | 判据 |
|---|---|
| 现有 14 席渲染逐字节不变 | `node tools/docgen/cli.mjs gate` exit 0（它对 `state=replaced` 的每一席做 `compareBuffers`，14 席全 replaced）；**不要用 `render13-snapshot.mjs`**——它只渲染一个 `fixture-13`，不遍历 `agentData`，改前改后恒等（零判别力） |
| `description` 句式不变 | 现有 14 条不含 `domain` 字段 → 走默认分支，逐字不差 |
| `boundary` / `explorePolicy` 默认值不变 | 14 席不带这两个字段 → 走 `DEFAULT_*`，逐字不差（同上由 `gate` 兜） |
| `ToolsViolation` 不放松 | `evidence-reader` 的 tools 恰等于 readOnly 三元组，不改校验规则 |

## 8 失败面

| # | 会怎么坏 | 怎么发现 | 怎么防 |
|---|---|---|---|
| F1 | SKILL.md 写成口号（有段名、无出口判据） | 读到「出口判据」列全是形容词 | §3.2 要求每条判据是「有 / 无 / 相等」型；testcase 逐条断言小节存在 |
| F2 | references 七份里漏一份（尤其漏 `stage-2b-plan-gate.md` 或 `gate-record.md`） | 文件数 ≠ 7，或缺计划门 / 记录表 | 验收项 V-2 逐名核对 |
| F3 | 新规则复制 PRD 判据正文，PRD 改了它不跟 | 两处措辞不一致 | 规则只写义务句 + 节号引用，不抄 PRD |
| F4 | 新 agent 只写卡、不进 `agentData` | gate 报 `UnregisteredHandwritten` | C1 先行，卡由生成器产出 |
| F5 | 进了 `agentData` 但没进 `state.json` | A 组检查覆盖不到它（无报错，静默） | C7；且 §7.4 把它列为独立验收项 |
| F6 | `domain` / `boundary` / `explorePolicy` 改动波及 14 席 | `gate` 出现 `Mismatch` | §7.6：默认值分支不变，由 `gate` 逐字节兜 |
| F7 | `evidence` 输出格式退化成问题卡 | 卡里出现「级别 / 建议解法」字段 | §7.2 三类列 + 明令不写级别 |
| F8 | 计数断言只改一处 | `npm run check` 红（常量 37 vs 字面量 35） | §7.5 **12 处**逐一列出 |
| F9 | 技能里写了跨技能文件路径 | skill-inspector findings | §4 约束 + `npm run check` 0 findings |
| F10 | 规则进了 `BASELINE_RULES` 但文件不存在 | `DanglingBaselineEntry`（exit 2） | C2 与 P-3 同批落地 |
| F11 | 新技能没登记 `skilldependencies` | `npm run check` 红（`skills/` 与 manifest 一一对应） | P-6 与 P-1 同批；V-7 |
| F12 | 段表与 PRD §4 措辞不一致 | 人眼 / TC-A04 的 `diff cells` | 以 PRD §4 为唯一真相（§3.1 已改两格：`无议会`、`；`），V-3 只比三列 + 段顺序 |
| F13 | 计数只改字面量、下次再加席又红 | 下次改动的红项 | §7.5 一律派生化 |
| F14 | 新卡照抄模板的「只读评审角色」边界句 | 读卡发现角色自我描述与职责不符 | C10 的 `boundary` 槽位；V-11 |
| F15 | 计划门文件写了三条命令，但 `check-plan.mjs` 到 S4 才有 | 有人照着跑，报「文件不存在」 | §3.2 要求写成「判据 + 二选一证据」 |
| F16 | 规则与技能只在仓内、运行时没链接 | `npm run check` 全绿但下轮不加载 | P-7 + V-12（`aas sync` + 体检需建链接 0） |
| F17 | SKILL.md 只写「判据见 references/…」（纯指针） | agent 跳过 references 直接跳段 | §3.2 的「已核清单」要求 + V-13 + TC-A11/E28 |
| F18 | `evidence-reader` 造出来没人派 | F-17 收益为 0（主 agent 仍自读） | SKILL.md「取证调度」节 + R7 + V-13 |
| F19 | 议会有 P0 未清却进了下一段 | 出口判据齐但评审未过 | §3.1「议会有条件」+ R1 判定方式 + TC-E30 |
| F20 | 规则一上线就把存量 spec 全判违规 | 25 份零 testcase 的存量 spec 无法开工 | §5「例外」节必写内容 + TC-E31 |
| F21 | 三处判据各自成立却互相矛盾（本轮的 P0 就是这类） | 交叉读两处才发现 | §9 的每条验收都写「证据是哪条命令」；本轮 6 席抓到 4 个同源 P0 即此模式 |
| F22 | ① 段「过渡口径」只写进 spec 却漏进 SKILL.md | 落地后所有任务卡在第一段（无产品经理可签） | §3.1 过渡口径 + **V-14** + TC-A14（正例）/ TC-E33（删代拟句必红） |

## 9 验收

| # | 验收项 | 判据（可机械核对） |
|---|---|---|
| V-1 | 三件载体存在 | `skills/dev-workflow/SKILL.md`、`rules/dev-workflow-mainline.md`、`agents/evidence-reader.md` 三个路径都存在 |
| V-2 | references 七份齐 | `skills/dev-workflow/references/` 下恰有 7 个文件：`stage-1-prd.md` / `stage-2-tech-design.md` / `stage-2b-plan-gate.md` / `stage-3-implementation.md` / `stage-4-quality.md` / `stage-5-delivery.md` / `gate-record.md` |
| V-3 | 段表与 PRD 一致 | `SKILL.md` 段表六行与 PRD §4 的**三列**（出口判据 / 谁签 / 议会）逐格一致 + 段标记顺序为 `①②②→③③④⑤`（拆出的「名称」列与「入口」列不进比对，理由：SKILL.md 允许把段名拆列，PRD 写在同一格） |
| V-4 | 规则结构齐 | `rules/dev-workflow-mainline.md` 含五段（适用范围 / 冲突裁决 / 例外 / 触发时机 / 验证）、R1–R7 七条判据、非空「例外」节（含存量豁免与时点）、验证节两条自查命令 |
| V-5 | reader 卡是生成物 | `node tools/docgen/cli.mjs gate` 渲染 `evidence-reader` 与磁盘文件逐字节一致；description 含 `开发工作流` 且不含「在议会评审中担任」；「边界」节为取证句；不含「现场生成 3-5 个…问题」 |
| V-6 | gate 计数 | `node tools/docgen/cli.mjs gate` 输出 `baseline 37/37`（37 = 22 rule + 15 agent，从 `BASELINE_RULES.length + agentPaths().length` 派生） |
| V-7 | 全仓检查 | `npm run check` exit 0；skill-inspector `0 findings`；markdown 检查通过 |
| V-8 | 现有席位零回归 | `gate` exit 0（逐字节比对 14 席）；且**注入一字节**（副本仓给 `agents/reviewer-qa.md` 末尾加一个空格）→ `gate` 必报 `Mismatch` 且 exit 1 |
| V-9 | 登记面齐 | `skilldependencies/manifest.json` 含 `dev-workflow`；`skilldependencies/dev-workflow.json` 的 `skill` 字段 == 文件名、依赖集合恰为 `parliament` + `prd-to-specs`；`README.md`、`docs/guide/skills/README.md`、`docs/guide/rules/README.md` 已加行且**技能与规则数量都不写死**（人工核 + TC-E23 禁词探针） |
| V-10 | state 覆盖齐 | `check-agents` 输出「未迁移 0」；C9 的断言在 `npm run check` 中生效（人为删一条 state 键 或 整文件缺失 → 必红） |
| V-11 | 新卡不自我描述错误 | `agents/evidence-reader.md` 的「边界」节不含「只读评审角色」；「自由探索」节为「本节不适用…」形态（C10 / C11 两个槽位） |
| V-12 | 运行时就位 | `aas sync` 后跑 `aas` 体检：`需建链接 0`；`Test-Path ~/.trae-cn/user_rules/dev-workflow-mainline.md` 与 `Test-Path ~/.trae-cn/skills/dev-workflow/SKILL.md` 均为 True（**本机环境验，不进 `npm run check`**） |
| V-13 | SKILL.md 结构齐 | 有独立的「三权总则」节与「取证调度」节；每个段行同时含 `references/stage-N-*.md` 与「已核清单」「缺…不得进入下一段」；`^## (入口条件\|出口判据\|谁签\|三权归属\|常见漏项)` 命中 0 |
| V-14 | 过渡口径在正文里 | `SKILL.md` 的 ① 段正文含「用户签字」「代拟」「代拟者不签字」三要素，且写明失效条件（含「S2」字样）——只写在 spec 不算（F22） |

## 10 测试（测什么 / 为什么）

| 测什么 | 为什么 | 用例出处 |
|---|---|---|
| 三件载体存在且结构齐（V-1～V-4、V-13、V-14） | 载体缺一件，主干就有一段无法执行；结构缺一节（三权 / 取证调度 / 已核清单 / 过渡口径），判据就落不了地 | testcase 文件 TC 组 A |
| `evidence-reader` 卡的生成一致性、tools 恰等、description 不含「议会评审」、边界与自由探索两处形态（V-5、V-11） | 卡与源不一致＝改源无效；含「议会评审」＝路由骗人；保留「自由探索必做」＝角色自相矛盾 | TC 组 B |
| 计数与 baseline（V-6、§7.5 **12 处**） | 字面量是历史踩点：漏一处必红；只改字面量则下次再加席重犯 | TC 组 C |
| 兼容性（V-8、§7.6） | 全仓 15 席共用生成器，任何一处默认值漂移都是群体事故；`gate` 注入一字节必红是唯一硬证据 | TC 组 D |
| 失败面 F1–F21 的负例 + 登记面 / 运行时就位（V-9 / V-10 / V-12、P-6 / P-7、C9 / C10 / C11） | 只测「做了」不测「做错」＝守卫只在顺利路径有效；漏登 state、漏登记 manifest、没 sync 到运行时是三条静默红 | TC 组 E |

**测试用例文件**：`docs/superpowers/specs/2026-10-24-dev-workflow-skeleton-design-testcase.md`（由 `senior-sdet` 在全新上下文独立编写；本 spec 只写「测什么 / 为什么」，不内联用例）

## 11 依赖与顺序

| 项 | 说明 |
|---|---|
| 上游 | PRD §11 的 18 条代裁（尤其 D-18 / D-19 / D-23）；PRD §12 的 S1 范围 |
| 上游状态（送审前置，2026-10-24 用户裁定路径 A） | 本 spec 的决策源 PRD **§0 硬门未过**（市场栏与精算师签字缺）。用户允许 S1 在此状态下送审，因此**送审说明必须显式写**「决策源 = `docs/prd/dev-workflow-mainline/20261024073606-dev-workflow-mainline.md`，§0 未过门，18 条 `[已决·代裁]` 待用户扫」——不写＝送审材料不齐（审计按缺件处理） |
| 下游 | S3（议会改造）等 S1 的 `evidence-reader` 与技能骨架先落地；S2 / S4 复用 `references/stage-*.md` 的段结构。**S2 / S5 的开工前置**：PRD §0 复核通过（市场依据 + 精算师签字），不在 S1 内解决 |
| **施工顺序（必须照此序，否则中间态必红）** | ① C2（登记规则）→ **C6a（`baseline --write` 一次，把 rule 增量先落盘，否则 `BaselineDrift` 会挡住后面每一步）** → ② C1 → C3 → C4 → C5 → C10 → C11（数据与生成器就位）→ ③ **`draft --kind agent --name evidence-reader` 出草稿**（`generate` 只比对、要求目标已存在；写草稿的是 `draft`）→ 人工对照 → **直接落盘（新席不走 `replace` 迁移段，见 C7）** → ④ C7（**必须在 C1 之后**：`readState` 对未知键抛 `StateFileInvalid`）→ C8 → ⑤ C6b（再 `baseline --write`，得 37 条）→ C9 → ⑥ **12 处**计数派生化 → ⑦ P-7 `aas sync` + 体检 → ⑧ **写测试文件**（testcase 的 79 条落成断言，见 testlanding 文档；否则 V-1～V-14 没有执行体）→ ⑨ 收尾双向验证（`gate` 正常态绿 + 注入一字节必红）。**每步后跑一次 `node tools/docgen/cli.mjs gate`**，让任何中断点都能收敛 |
| **与 S3 的交接** | S1 已改 `patternRegistry` / `validateAgentData` / `agent.md.tpl` / `state.json` / `check-all.mjs`，与 S3 的「`tools/docgen` 生成源 + 卡重生成」文件面重叠：**S3 不得与 S1 并行改同一批文件**；且 PRD §12 里 S3 的「13 张卡重生成」口径在 S1 后已是 **15 席**（含 `evidence-reader`），S3 spec 必须改这一处 |
| 阻塞风险 | 若用户推翻 `evidence-reader` 的定名、或否决 `domain` / `boundary` / `explorePolicy` 三字段设计，§7 的 C5 / C10 / C11 需重做——动的是全仓共用生成器 |
| 不在本 spec 内 | 议会两张矩阵、`speaker` 卡、`producer` / `research` 档、`check-prd-graph.mjs`、功能块滚动拆的执行细则 |
