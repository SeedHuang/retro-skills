# Docgen P2 · S3：senior-sdet 手写卡转录

> split from `docs/prd/docgen-agent-generation.md` (2026-10-19)
> 日期：2026-10-19｜修订：2026-10-20（补 heading 字段、数据槽/模板常量分配表、来源行逐字锁定、A 组结构项验收；见 §3.1 与 §5 末行）｜**修订 2（2026-10-20 议会第 1 轮答辩后）**：when/notWhen 收归 triggerTable（§3 + §6-3）、notWhen 不渲染进正文（R4 + §6-5）、§3.1 补表头/分隔行与 tools 槽位归属 + 模板纯度、九步补 evidence / generate 预期 exit 1 / 比对落点 / 崩溃恢复 / 干净口径、黄金值改为冻结快照（§5）、硬约束扩到 10 条｜**修订 3（2026-10-20 议会第 2/3 轮答辩后）**：§1④ 限定 `diffSet` 只服务步 4（generate/gate 仍整缓冲）、§4 新增「比对 helper 契约」`{raw, unallowed}`、步 3 补「替换后 exit 0」、步 7 崩溃恢复按实现重写、步 8 干净口径三项、§5 notWhen 行改为「除 `description:` 行外 + 全卡恰 1 次」、§3.1 新增「模板骨架」行并把纯度改为数据探针、§6-3 的 notWhen 必填限定 `outputKind='testcase'`、§6-9 改引用、§9 只留指针、§7 补取数命令｜状态：待评审（草稿，spec + testcase 一起送议会）｜PRD 状态：已定稿
> 测试用例文件：`docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design-testcase.md`
> 依赖：S1 spec `2026-10-19-docgen-agent-capability-design.md`（能力地基）+ S2 spec `2026-10-19-docgen-agent-pilot-design.md`（已跑通议会席模板的试点闭环）+ PRD §5 W2 + PRD §6.1–6.4

## 0 为什么

P2 的「真实内容转录工作量 = 1 个文件」（PRD §2 边界一句话）就是 senior-sdet。13 席是结构化数据搬家，senior-sdet 是**手写正文转录成组件数据**——它是 agent 侧的「手写 → 生成」试点，验证第二套模板（P2-1）和「来源声明行」唯一差异条款（W2）是否成立。转录错了，P3/P4 的 skill/rule 转录会带着同样的错搬。

本 spec 只做一件事：把 `agents/senior-sdet.md`（手写角色卡）转录成 docgen 组件数据（第二套模板），走完九步闭环到巩固，并落 W2 验收。PRD 决策原文不复制，引用见 `docs/prd/docgen-agent-generation.md` §3/§5/§6。

**外部编号对照**：

| 编号 | 含义 | 出处 |
|---|---|---|
| P2-1 | 双模板：议会席模板 + senior-sdet 手写卡模板（第二套，含专属节） | PRD §3 |
| P2-2 | senior-sdet 专属 description 句式含 notWhen 槽位 | PRD §3 |
| P2-8 | 字段映射：position := role；非必填未声明 = 合法值 | PRD §3 |
| W2 | senior-sdet 转录验收 | PRD §5 |
| P2-遗-9 | 翻译质量「详细/逻辑化」由施工 AI 自评写入组件数据注释 | `docs/prd/docgen-agent-generation.md` §责任边界（第 28 行）+ 序 2（第 270 行） |

## 1 全貌确认

| 维度 | 内容 |
|---|---|
| 本质 | 手写角色卡 → 组件数据 → docgen 生成，验证「手写 → 生成」在 agent 侧成立（P3/P4 的转录模型先例） |
| 同族 | 同类失败面：转录润色/改写（W2 逐字比对兜底）、来源声明行处理不当（该行是唯一允许差异）、专属 description 句式拼装错、**notWhen 被误渲染进正文**（现卡正文无此句，多一行即违反唯一允许差异） |
| 边界 | 只做 `senior-sdet` 一席转录；不做 13 席（S2/S4）、不做能力本身（S1）；转录后 `agents/senior-sdet.md` 变为 docgen 生成物 |
| 验收 | W2（PRD §5）：除来源声明行（唯一允许差异）外逐字节一致 + description 专属句式逐字复现现 description 原文（身份句 + when + `Do not use for` + notWhen） |
| 影响面 | ① `tools/docgen/components/agentData.mjs`（补 senior-sdet 条目的转录字段：heading / sourceLine / identity / fixedList；**不含 when / notWhen / route / fallback**——见 §3）；② `tools/docgen/components/renderAgent.mjs`（新增 `{{HEADING}}` / `{{SOURCE_LINE}}` 两个槽位的填充；且**按模板分流 fixedList 渲染**——见 §3「fixedList 粒度」末段）；③ `tools/docgen/templates/agent-handwritten.md.tpl`（由 5 节占位骨架重写为 9 节真模板，`tools` 行改 `{{TOOLS}}`）；④ `tools/docgen/components/compare.mjs`（**新增 `diffSet` helper**，只服务步 4 的验收比对；**generate / gate 仍走整缓冲 `compareBuffers`**——见 §4「比对 helper 契约」）；⑤ **`tools/docgen/acceptance/golden-assert.mjs`（必改两处）**：description 句式按 `agent.outputKind` 分流（`testcase` → `description.handwritten`）、整文件比较改用 `diffSet` 并豁免 `{改前文本, 改后文本}`——两处必须同批改，只改一处仍会恒 exit 1；⑥ `tools/docgen/acceptance/`（新增 13 席渲染快照脚本——见 TC-031）；⑦ `tools/docgen/fixtures/senior-sdet.evidence.json`（新建，replace 硬读——见 §4 步 1）；⑧ `agents/senior-sdet.md`（替换）；⑨ `tools/docgen/state.json`（senior-sdet 置 replaced，gate 才开始逐字节比对）。注：baseline agent 清单**已含** senior-sdet（14 席 = 13 议会席 + 本席），无需新增条目 |

**联动四问**：

- **治本了吗**：转录模型（第二套模板 + 来源声明行差异条款）在此验证，P3/P4 直接复用；治本。
- **有副作用吗**：替换后 `agents/senior-sdet.md` 的「来源」行从「改动直接改本文件」变「docgen 生成」——这是设计意图（P2-1），但需确认该行变更不触发任何下游引用失效（senior-sdet 是 skill/agent 定义，无代码引用其来源行）。
- **跨问题联动吗**：专属 description 句式（P2-2）、notWhen 派生入参（P2-8）、来源声明行差异（W2）三处互相牵连，必须同批做。
- **跨文件吗**：`agent-handwritten.md.tpl` 是新建模板；`agentData.mjs` 同时被 13 席条目占用，加 senior-sdet 条目需通过 validateAgentData（name 唯一断言）。

## 2 核心决定（不可违反）

| # | 决定 | 为什么 |
|---|---|---|
| R1 | **第二套模板 `agent-handwritten.md.tpl`**：与议会席模板不同源——含「你负责三件事」「三条铁律」「输入（四样）」「测试设计固定清单」「输出格式」「通用纪律」「边界」等专属节；tools 数据字段 `Read, Glob, Grep, Write, Edit` | P2-1：本席 9 个 `##` 节，而 13 席卡节数为 8–12 不等（`reviewer-audit` 12 / `detective-observer` 8 / 其余 11 张各 9；取数口径 = `^## ` 行数，命令见 §7 执行环境），且 13 席**都不含**本席专属节（你负责三件事 / 三条铁律 / 输入四样 / 测试设计固定清单）；加上 tools 含写权限，单一模板装不下（F-01 教训） |
| R2 | **转录零改写**：正文措辞/标点/换行逐字保留；**唯一允许差异 = 来源声明行**，该行改后文本**逐字锁定**（见 §3「来源行改前 / 改后」的「改后」一行，**该处为唯一单源**，本文其它位置只引用不复制）；不得自行改措辞——「唯一允许差异」必须有可比对的确定值，否则该行怎么改都算过 | W2「除来源声明行外逐字节一致」；转录润色 = 违反零改写（PRD §1.1 作用域声明：P2 本体 = 数据搬家/零改写转录，不涉及 AI 翻译） |
| R3 | **专属 description 句式（P2-2）**：完整形态 = `{身份句}。{when}时调用。Do not use for {notWhen}。`——身份句 / when / notWhen 均**逐字取自现 description 原文**，不引入新词；**when 提取边界 = 触发子句不含末尾「时」（现卡「...失败场景时调用」中「时调用」由句式补），否则拼装出「时时调用」**；拼装结果逐字 == 现 description | W2 的核心判据；身份句 = 「资深测试开发工程师（Senior SDET）」，when = 「当需要为 PRD/spec 设计并编写测试用例（testcase.md）、评审测试策略、或专门找出被忽视的边界与失败场景」**（不含末尾「时」）**，notWhen = 「修改业务代码、写实现方案、或只读的议会评审（那走 reviewer-qa）」 |
| R4 | **notWhen 结构化**：`{ text, refs: [route] }`；refs ⊆ agentData 键集（senior-sdet 的 notWhen 逐字复现现卡 `Do not use` 内容）；**notWhen 只参与 description 派生，不渲染进角色卡任何正文节**（现卡边界节没有这段文字，渲染进去即多一行 → 违反 R2 唯一允许差异）。故**两套模板都不加 notWhen 槽位** | P2-8 + P2-2：notWhen 的本职是「description 派生入参 + 未来调度消费」；PRD §3 P2-2 只要求 description 专属句式含 notWhen，未要求正文重复 |
| R5 | **翻译质量自评（P2-遗-9）**：施工 AI 转录时自评「详细（不省略隐含语义）/ 逻辑化（关系明确）」两维，写入组件数据注释（`// translation-self-check: ...`），缺自评 = 该组件数据不合格。「可测（每句有判据）」维**P2 内不验**（PRD §1.1 作用域：不验收翻译闭环）——仓库里不存在「断言词校验器」，不得写成由它兜 | PRD P2-8 翻译规范 + P2-遗-9；P2 内不验收翻译闭环，但转录仍需留自评痕 |
| R6 | **转录后 description 不适用词表断言**：senior-sdet description 属逐字复现（转录性质），禁成语/模糊词词表断言不适用（但句式校验仍强制）。注：S1 已裁定 **P2 内没有词表实现**（description 全被句式锁定，无消费对象），故本席该条为「恒真豁免」，不作为可失败的验收项 | S1 R13 + PRD W4：词表只约束 13 席句式派生产出 |
| R7 | **九步闭环同 S2**：入选 → 数据迁移（转录）→ 生成 → 逐字节比对（除来源声明行）→ 接守卫 → 落草稿 → 替换 → 验收 → 巩固 | PRD 6.2 对每个 agent 相同；本席不涉及 ROLES 移除（senior-sdet 本就不在 ROLES）。注：旧生成器 `skills/parliament/scripts/gen-agents.mjs` **在当前仓库已不存在**（`Glob '**/gen-agents*'` 0 命中），故「不在 ROLES」的验收方式改为「断言该文件不存在（= 旧来源已退役）」 |

## 3 数据形状：senior-sdet 的 agentData 条目

```js
{
  name: 'senior-sdet',
  heading: 'Senior SDET（测试设计与盲点猎手）',  // H1 整行「# 角色：{{HEADING}}」的内容，逐字转录自现卡第 7 行
  role: '资深测试开发工程师（Senior SDET）',   // description 身份句来源（≠ heading，两者文字不同，不可混用）
  dimension: undefined,                    // 非议会席，无评审维度（不拿它冒充 heading 的后半段）
  tools: ['Read', 'Glob', 'Grep', 'Write', 'Edit'],  // 数据字段（要写 testcase）；模板必须用 {{TOOLS}} 渲染，禁硬编码
  // 来源声明行：现卡第 9 行的整行替换目标（逐字值见下方「来源行改前 / 改后」的「改后」一行——单源，此处不复制）
  sourceLine: /* 逐字值见 §3「改后」一行 */,
  identity: '有十年以上经验的测试开发工程师（SDET）。...',   // 逐字转录「你是谁」节（完整两段，含段间空行）
  fixedList: [/* 测试设计固定清单 9 条数据行，逐字；表头与分隔行进模板常量——见下方「粒度」与 §3.1 */],
  sharedBlock: undefined,                  // 非议会席
  outputKind: 'testcase',                  // 已在 patternRegistry.outputKind 枚举内
  // 注意：when / notWhen / route / fallback 四键**不在本条目**，全部住 triggerTable（见下）
}
```

**when / notWhen / route / fallback 四键的归属（唯一落点 = triggerTable）**：S1 §4.1 已裁决「触发表字段只住 `triggerTable`，agentData 条目不含」，现行实现也是这么写的——`validateAgentData` 的断言 7（when 格式）/ 8（description 派生）/ 10（when 唯一）/ 12（notWhen.refs）/ 14（每席 when）全部遍历触发表，`renderAgent` 也读 `trigger.when` / `trigger.notWhen`，且既有测试 `tools/docgen/test/data.test.mjs` 明令条目不含这四键。故本席的写入位置是：

```js
// triggerTable['senior-sdet']（既有条目，本席补齐 notWhen）
{
  when: '当需要为 PRD/spec 设计并编写测试用例（testcase.md）、评审测试策略、或专门找出被忽视的边界与失败场景',  // 逐字提取触发子句（不含末尾「时」，句式补「时调用」）
  route: 'senior-sdet',
  notWhen: {
    text: '修改业务代码、写实现方案、或只读的议会评审（那走 reviewer-qa）',
    refs: ['reviewer-qa'],                 // 引用合法断言（S1 §6 断言 12）
  },
}
```

**heading 字段为什么必须单列**：现卡 H1 是 `# 角色：Senior SDET（测试设计与盲点猎手）`，而 `role` 必须是 `资深测试开发工程师（Senior SDET）`（description 身份句要用它）。两者**文字不同、用途不同**——若沿用议会席模板的 `# 角色：{{ZH_NAME}}（{{DIMENSION}}）`，`{{ZH_NAME}}=role` 且 `dimension=undefined`，会渲染出 `# 角色：资深测试开发工程师（Senior SDET）（）`，与现卡不等 → W2 必红。故手写卡模板的 H1 改成 `# 角色：{{HEADING}}`（转录常量），**不借用 dimension 字段**（dimension 语义是评审维度，借用会误导后续 13 席实现）。

**fixedList 粒度**：数组元素 = **整行 markdown 原文**（数据行，含 `|` 与行内加粗，如 `| 1 | **输入空间**：有效 / 无效 / …？ |`），不拆单元格；**表头 `| # | 必答 |` 与分隔行 `|---|---|` 不进数据、进模板常量**（见 §3.1），故 `fixedList.length === 9`。理由：模板直接按行拼接即可逐字节复现，避免「拆单元格再重拼」时管道符/空格漂移。

> **渲染必须按模板分流**（施工前必读）：现行 `renderAgent.mjs` 把 `fixedList` **按单元格重拼**成 `| # | 必问 | 回答 |` + `| N | 问题 | 待答 |`——这套形态服务 13 席，但与本席现卡的 `| # | 必答 |` 表头 + 整行原文**不兼容**，照旧会渲染成另一张表 → W2 必红。故 `renderAgent` 须按 `outputKind` 分流：`testcase`（手写卡）走「整行直拼」（`fixedList.join('\n')`，不重拼管道符与「待答」列）；其余仍走原单元格重拼。
>
> **13 席渲染字节不得因此改动——但本轮能兜的锚点只有一席，必须写实**：gate 只对 `state.json` 里 `replaced` 的席做逐字节比对（当前仅 `reviewer-audit`）。`triggerTable` 现有 **3 条**（`reviewer-audit` / `reviewer-product` / `senior-sdet`）；其余 12 席仍为 `registered`，其中 **11 席无 `triggerTable.when`**（`renderByName` 抛 `MissingComponentData`），剩 1 席 `reviewer-product` 虽可渲染，但它是骨架数据、代表不了议会席模板的通用形态。故本轮的可验锚点是 ① `reviewer-audit` 的 gate 逐字节比对 + `pilot-render` 黄金测试；② **新增「议会席模板渲染快照」用例**（改 `renderAgent` 前用固定议会席 fixture 存渲染字节，改后逐字节相等——见 §7 测试表「13 席渲染不回归」行）；③ 机器可判的分流边界断言：`agentData.filter(a => a.outputKind === 'testcase').map(a => a.name)` 恰等于 `['senior-sdet']`。其余 12 席的字节锁待 S4 迁移后由 baseline 兜。

**来源行改前 / 改后**（W2 唯一允许差异的完整定义；**「改后」一行是全文唯一单源**，其它位置只引用不复制）：

- 改前（现卡第 9 行，逐字；反引号属原文、共 2 个，不得删也不得加转义反斜杠）：``> 来源：用户 2026-10-18 指定新建。本角色卡不属于议会 13 席花名册，也**不由** `skills/parliament/scripts/gen-agents.mjs` 生成（那个生成器只管议会席）；改动直接改本文件。``
- 改后（`sourceLine` 字段值，逐字；含行首 `> 来源：`，模板里该槽位独占一行、**不得再补 `>`**）：`> 来源：docgen 生成。本角色卡由 tools/docgen 生成（第二套模板 agent-handwritten.md.tpl）；改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换。`
- 判据：渲染卡中该行逐字 == 改后文本；除该行外全文件与「现卡 + 该行替换」逐字节相等。
- 比对实现口径：排除该行**只能按行内容匹配**（行内容 == 改前文本 或 == 改后文本），**不得按行号、也不得按「以 `>` 开头」过滤**——按行号会在正文行偏移后漏检，按前缀会误放行其它引用行。

### 3.1 数据槽 vs 模板常量（哪块内容放哪）

零改写的实现方式是「能数据化的是数据、固定散文进模板」。分配如下（**这是本 spec 的施工契约，TC-002 按此表断言**）。**判据：现卡的每一处「内容」（非空行、非 `---` 分隔符）都必须在本表里恰好出现一次；空行与 `---` 归「模板骨架」，按冻结副本逐字复现**：

| 现卡内容 | 归属 | 理由 |
|---|---|---|
| **模板骨架**：frontmatter 两条 `---`、`name:` / `description:` / `tools:` 字段标签、`# 角色：` 前缀、9 个节标题行、节间空行、文件尾恰 1 个 LF | **模板常量**（随块原样） | 结构不随 agent 变；漏掉任何一个都会逐字节红 |
| frontmatter `name` 的值 | 数据（`name`） | 既有数据字段 |
| frontmatter `description` 的值 | 派生（`role` + when + notWhen，R3；后两者来自 triggerTable） | 专属句式拼装，逐字还原 |
| frontmatter `tools` 的值 | 数据（`tools`）→ **模板槽位 `tools: {{TOOLS}}`**，禁在模板里硬编码 | 硬编码 = 数据改了产物不变（假绿） |
| H1 内容 | 数据（`heading`）→ 模板槽位 `# 角色：{{HEADING}}` | 见上「heading 字段为什么必须单列」 |
| 来源声明行 | 数据（`sourceLine`，R2 锁定文本）→ 模板槽位**独占一行** `{{SOURCE_LINE}}`（不补 `>`） | 唯一允许差异，需可比对 |
| `## 你是谁` 两段正文 | 数据（`identity`） | 每个 agent 各不相同 |
| `## 测试设计固定清单` 的 **表头 `\| # \| 必答 \|` + 分隔行**（节标题归模板骨架） | **模板常量**（紧贴 `{{FIXED_LIST}}` 上方） | 结构行不随 agent 变；进数据会撞 `length === 9` |
| `## 测试设计固定清单` 的 **9 条数据行** | 数据（`fixedList`，整行原文） | 每个 agent 各不相同 |
| `## 你负责三件事` / `## 三条铁律` / `## 输入（四样，缺一不写）` / `## 自由探索（必做）` / `## 输出格式` / `## 通用纪律` / `## 边界` 的正文 | **模板常量**（原样写进 `agent-handwritten.md.tpl`） | 本席专属、且不与其它席共享 |
| notWhen 文本 | **不渲染进正文**——只住 triggerTable、只参与 description 派生（R4） | 现卡正文无此句；渲染即多一行，违反 R2 |

> 说明：模板常量的内容也参与逐字节比对（模板里的字和现卡不一致就红），所以「常量」不等于「可以不逐字」。
> **模板纯度**：除「上表归模板常量的文字」+「模板骨架」+「7 个槽位」之外，模板**不得出现任何数据字段的值**（`identity` / `heading` / `fixedList` 各行 / `sourceLine` 的正文）。判据要用**从数据取值做探针**（拿 `entry.identity` 等去模板里搜，命中数必须为 0），不得只硬编码几个字符串——数据变了探针要自动跟随。

**模板**：`agent-handwritten.md.tpl`（第二套），9 节结构与现 `agents/senior-sdet.md` 对齐：
`你是谁 / 你负责三件事 / 三条铁律 / 输入（四样，缺一不写）/ 测试设计固定清单（每条必答，"没问题"也要写结论）/ 自由探索（必做）/ 输出格式 / 通用纪律 / 边界`。
当前仓库里该文件只是 5 节占位骨架（你是谁/固定清单/输出格式/共享块/边界），本席须**重写**为上述 9 节，且**必须且只必须**含这 7 个槽位（每个 ≥1 次）：

`{{NAME}}` / `{{DESCRIPTION}}` / `{{TOOLS}}` / `{{HEADING}}` / `{{SOURCE_LINE}}` / `{{IDENTITY}}` / `{{FIXED_LIST}}`

**不复用**议会席模板的 `{{ZH_NAME}}` / `{{DIMENSION}}` / `{{OUTPUT_FORMAT}}` / `{{SHARED_BLOCK}}`，**也不加** `{{NOT_WHEN}}`（R4）。

> **模板复用定性与能力边界**：`agent-handwritten.md.tpl` = **本席专用模板**；手写席的规则是「**同形态、不同文件**」（每席一份 tpl，判据 = 专属节标题不同即新模板），不是一个 tpl 装多席。另：`outputKind` 目前同时决定「模板选择 / description 句式 / fixedList 渲染模式」三件事——本轮**不拆分**（字段化属能力层 S1 范围），但必须知悉其限制：**一项能力只允许由一个条件决定**；出现第二席 `outputKind='testcase'` 且需复用议会席模板时，须先做字段化（触发信号已登记于账本候选）。

**description 派生**：`资深测试开发工程师（Senior SDET）。当需要为 PRD/spec 设计并编写测试用例（testcase.md）、评审测试策略、或专门找出被忽视的边界与失败场景时调用。Do not use for 修改业务代码、写实现方案、或只读的议会评审（那走 reviewer-qa）。`（专属句式拼装：身份句 + when + 「时调用」 + `Do not use for` + notWhen，逐字 == 现 description 原文）。

## 4 九步闭环执行细则（PRD 6.2 落地，转录版）

| 步 | 动作 | 本席具体执行 | 失败回退 |
|---|---|---|---|
| 1 入选 | 锁定现产物基线 + 写 evidence | `git hash-object agents/senior-sdet.md` + SHA256；**同批写 `tools/docgen/fixtures/senior-sdet.evidence.json`**（字段见 `tools/docgen/evidence.mjs`：commit / blob / sha256 / hashObject / goldenAssertion；照 S2 的 `reviewer-audit.evidence.json` 抄结构）。**缺该文件 → 步 7 必 `EvidenceInvalid`（exit 2）** | — |
| 2 数据迁移 | 手写正文转录成组件数据（第二套模板）+ 来源声明行更新 | 按 §3 数据形状（**条目 10 键** + 触发表补齐 notWhen）；按 §3.1 表**逐行**决定「进数据 vs 进模板」；**转录零改写，仅来源声明行差异**（该行用 §3「改后」逐字文本）；自评写组件数据注释 | — |
| 3 生成 | `node tools/docgen/cli.mjs generate --kind agent --name senior-sdet` | **内存渲染 + 与磁盘整缓冲比对**（不排除来源行）。**替换前必然 exit 1**（磁盘上还是旧来源行）、**替换后必然 exit 0**——这是同一条命令的两个状态，是「除来源行外无其它漂移」的证据；逐字节结论取步 4 | — |
| 4 逐字节比对 | 渲染 vs 迁移前现卡快照，排除来源声明行 | 用新增 helper（接口见下方「比对 helper 契约」）：**`unallowed` 必须为空**、**`raw` 必须恰为 1 行且等于来源行**；再把 `renderSha256` 与比对结论写回 evidence。**「迁移前现卡」指步 1 冻结的快照，不得在替换后现读** | 只改组件/模板，现产物不动；修 2 次仍不等 → 停损 |
| 5 接守卫 | 确认该席在 baseline agent 清单内 | **registered 阶段不做逐字节比对**（同 S2 §4 步 5）：本步只确认 `senior-sdet` 在 `agentPaths()` 的 14 条内；**替换成功后**才进 gate 比对子集 | 漂移 → 回退 registered 态 |
| 6 落草稿 | `node tools/docgen/cli.mjs draft --kind agent --name senior-sdet` | 草稿进箱，`agents/*.md` 零改动；**落草稿后立刻把草稿复制一份到临时文件**（步 7 之后草稿会被清，见下） | — |
| 7 替换 | 用户确认后 `node tools/docgen/cli.mjs replace --kind agent --name senior-sdet --draft <草稿> --yes` | 命令内先 gate，红 → 拒。**成功路径会 `clearDrafts` 删掉草稿**，故「替换后文件 == 草稿字节」必须拿步 6 的临时副本比 | 拒红 → 草稿保留，修组件重走 4–7；**崩溃恢复（按实现写，不按愿望写）**：① `state` 已置 replaced 而目标仍是旧卡 → 重跑 replace 走**常规写路径**（`sha256(target) == lastWrittenHash` 后重写），不是幂等分支；② rename 已成功但 evidence 未写完 → 草稿已被 `clearDrafts` 删掉，**重跑会先撞 `DraftNotFound`（exit 3）**，故必须用步 6 的临时副本重走 `--draft`；③ 启动时会清理 `.part` 残留。**若实现侧愿意，可加一条「`state==='replaced' && target==rendered` 时允许无 `--draft` 直接收敛并补写 evidence」——属代码改动，须在 §1 影响面登记** |
| 8 验收 | W2 断言 + `npm run check` 全绿 + 后置口径 | 见 §5。**注意 A 组结构项（§5 末行）是手工命令，不在 `npm run check` 内**——check-all 的 agent 挂钩只跑 reviewer-audit（`scripts/check-all.mjs` ②.6 段），本席须人工执行 `checkAgentFile('senior-sdet')`。**「后置干净」口径 = §5 巩固行的三项**：① `git status --short rules/ skills/` 无输出；② `git diff --numstat -- agents/senior-sdet.md` 恰为 `1	1	agents/senior-sdet.md`（本席来源行必变，这一行差异属预期）；③ 草稿箱该名下已清 | — |
| 9 巩固 | 连续 2 次 gate 绿（含隔目录冷跑） | — | — |

**比对 helper 契约**（步 4 的唯一新代码，必须按此实现，供单测与验收共用）：

```js
// tools/docgen/components/compare.mjs 新增（不改现有 compareBuffers）
// ignorable：允许差异的行内容集合（逐字相等；本席 = {改前文本, 改后文本}）
export function diffSet(actualBuf, expectedBuf, ignorable = []) {
  // 返回 { raw: [{index, line}], unallowed: [{index, line}] }
  // raw       = 全部逐行差异（未过滤）
  // unallowed = raw 中「行内容不在 ignorable 里」的那些（过滤后）
  // line      = **期望侧（expectedBuf）**该 index 的内容；期望侧没有该行时记 null
  // index     = 0 基行号
  // 排除判定**只看行内容**：不得按行号、不得按前缀（>` 开头）过滤
}
```

- **generate / gate 仍走整缓冲 `compareBuffers`，不用这个 helper**（步 3 的「替换前 exit 1 / 替换后 exit 0」靠整缓冲比对得出）。
- 验收脚本调 `diffSet` 的用例：**TC-010 / TC-014 / TC-016 / TC-021**（TC-024 单测 helper 本体）。判据：`unallowed` 为空 **且** `raw` 恰 1 行 == 来源行，两个条件同时成立才算过。
- **写回 evidence 的 `compareResult` 形状**（`readEvidence` 要求：非 `null` 时必须含 `code` 字段，否则 `EvidenceInvalid` exit 2）：比对通过 → 写 `null`；不通过 → 写 `{ code: 'Mismatch' }`。**不得**把 `{raw, unallowed}` 原样写进 `compareResult`。

## 5 W2 验收（本 spec 的验收锚点）

| 检查 | 判据 |
|---|---|
| 逐字节一致 | **比对对象 = 步 1 冻结的迁移前快照**（锚点 = `evidence.commit` 下该文件的 blob；**不是替换后的现卡**——替换后现卡即渲染产物，再比等于自己比自己 = 恒绿）。用步 4 的 `diffSet`：`unallowed` 为空 **且** `raw` 恰 1 行 == 来源行 |
| 专属 description | 渲染 description 逐字复现**快照里**的 description 原文（身份句 + when 逐字 + `Do not use for` + notWhen 逐字，不引入新词） |
| 转录零改写抽查 | 正文节（你是谁 / 三条铁律 / 固定清单 / 边界）逐字 vs 快照，人工抽查 + Buffer 比对 |
| notWhen 引用合法 | notWhen.refs ⊆ agentData 键集（`reviewer-qa` ∈ 14 席键集；判据在 `validateAgentData` 断言 12，遍历 triggerTable） |
| notWhen 不进正文 | **除 frontmatter `description:` 行外**，正文节不出现 notWhen 文本；全卡命中**恰 1 次**且该命中行以 `description:` 开头（现卡正文没有该句，出现第二处即多一行） |
| 巩固 | 替换后 gate 连续 2 次绿（含隔目录冷跑）+ `npm run check` 全绿 + **干净口径（与 §4 步 8 三项一致）**：① `git status --short rules/ skills/` 无输出；② `git diff --numstat -- agents/senior-sdet.md` 恰为 `1	1	agents/senior-sdet.md`；③ 草稿箱该名下已清 |
| 13 席渲染不回归 | 见 §3「13 席渲染字节不得因此改动」段的三条可验锚点（reviewer-audit gate + pilot-render；改 `renderAgent` 前后的 13 席渲染快照逐字节相等；`outputKind='testcase'` 的席恰为 `['senior-sdet']`） |
| A 组结构项不回归 | 替换后 `checkAgentFile('senior-sdet')`（`tools/execution-matrix/check-agent.mjs`）的 A 结构项 A3-A7 **0 红**：A3 必答清单（含「必答/必问」列头的真实表格）、A4 必答闭环（含「只答固定清单 = 不合格」）、A5 证据约束（含「证据可复算」）、A6 边界节、A7 输出格式节——模板重写不得把这些关键字样弄丢（2026-10-20 线 E 新增的守卫，S3 写于其前，故在此补列） |

## 6 硬约束

1. 转录零改写：除来源声明行外逐字保留（R2）；来源行改后文本按 §3「改后」一行逐字使用，不得自行改措辞。
2. 专属 description 逐字复现原文，不引入新词（R3）。
3. **when / notWhen / route / fallback 四键只住 `triggerTable`**，agentData 条目一律不含（S1 §4.1）；notWhen 结构化 `{ text, refs }`。**「notWhen 必填」只约束本席（`outputKind === 'testcase'`）**：`text` 非空并逐字等于快照 description 里 `Do not use for` 之后、句末「。」之前那段；`refs ⊆ agentData 键集`。13 席议会席**仍允许缺省 notWhen**（S1 §4.1 语义不变）——**议会席的 description 分支不消费 notWhen**（`renderAgent` 只在 `outputKind==='testcase'` 时读 `trigger.notWhen`），故缺省对 13 席字节无影响；只有 testcase 席缺省时会静默派生出 `Do not use for 。`，所以「非空」只写成 testcase 席的硬要求（R4）。
4. 自评（P2-遗-9）写入组件数据注释（**位置 = 该席条目的上方或同一行注释**），缺自评 = 该组件数据不合格（R5）。
5. **notWhen 不渲染进角色卡正文**：两套模板都**不加** `{{NOT_WHEN}}` 槽位（R4）；现卡边界节无该句，渲染进去即违反唯一允许差异。
6. 数据槽与模板常量的分配按 §3.1 表**逐处**执行，不得把模板常量塞进数据字段（或反向），也不得把该进数据的正文内联进模板（内联 = 数据字段成摆设）。
7. H1 用 `heading` 字段逐字转录，**不得**借用 `dimension` 冒充（见 §3「heading 字段为什么必须单列」）。
8. 手写卡模板的 `tools` 行必须写成 `tools: {{TOOLS}}`，**不得硬编码**（硬编码 = 数据改了产物不变）。
9. 模板必须且只必须含 **§3.1 列出的 7 个槽位**（该清单以 §3.1 为唯一单源，此处不复述）。
10. 「排除来源声明行」只能**按行内容**匹配（== 改前文本 或 == 改后文本），不得按行号、不得按 `>` 前缀过滤。

## 7 测试

| 测什么 | 为什么 |
|---|---|
| 逐字节一致性（除来源声明行，vs 冻结快照） | W2 核心；转录润色/改写是最隐蔽的假绿；用现卡当黄金在替换后会退化为自比 |
| 专属 description 逐字复现 | 句式拼装错 = W2 必红（P2-2 硬约束） |
| 来源声明行唯一差异 | 该行处理不当（改成多行差异/动了正文）会假绿或假红；差异集必须恰为一行 |
| notWhen 结构化 + 引用合法 + 不进正文 | P2-8 断言 12；refs 悬空 = TriggerConflict；进正文 = 多一行 |
| 自评痕存在 | P2-遗-9：翻译质量自评是 P3/P4 转录的先例 |
| H1 与 role 不混用 | 沿用议会席模板会渲染成 `…（SDET）（）`——这类「看着像渲染对了」的错最容易被放过 |
| 数据槽/模板常量分配符合 §3.1（含表头/分隔行、tools 槽位、模板纯度） | 分配错了数据形状与 TC-002 互相矛盾；模板内联正文会让数据字段失效（假绿） |
| 比对排除逻辑的判别力 | 「按行号 / 按 `>` 前缀」两种缺陷实现都必须被判红——否则用例恒绿 |
| 13 席渲染不回归 | 改 `renderAgent` 的分流分支，可能顺手改到 13 席的单元格重拼路径 |
| 替换后 A 组结构项不回归 | 模板重写可能弄丢 A3-A5 的关键字样（必答列头/只答固定清单=不合格/证据可复算），线 E 守卫会红但归因不明显 |

**测试用例文件**：`docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design-testcase.md`（由 `senior-sdet` 独立编写；每条用例五要素、负例 ≥ 正例、覆盖总表指回本 spec 的 R 编号与 W2 锚点）

**执行环境**：本仓开发/评审机为 **Windows + PowerShell**。用例里的判据命令必须在该 shell 下可直接执行（用 `Get-FileHash` / `fc.exe /b` / `Select-String` 或仓库内 `node` 脚本；不要混用 POSIX `grep` 与 cmd `fc`）。

**取数命令**（R1 引用的节数计数）：`Get-ChildItem agents/*.md | ForEach-Object { [pscustomobject]@{ Name = $_.Name; Sections = @(Select-String -Path $_.FullName -Pattern '^## ').Count } }`

**只手动验证**：转录后角色卡「读起来还是同一张 senior-sdet」的语义观感（机器验字节，人验语义无漂移）。

**不测**：能力地基本身（S1）；13 席迁移（S2/S4）；翻译闭环（PRD §1.1 作用域，P2 内不验收）；词表豁免（P2 内无词表实现，恒真，见 R6）。

## 8 不在这一轮

- 13 席迁移——S2/S4。
- 翻译闭环（完形填空）——PRD §1.1 作用域声明，P2 内不验收。
- 词表对 transcription 字段生效——只约束派生产出（R6）。
- 能力完备（W6/W7）——S1 序 4。

## 9 将来才会撞上的一件事

senior-sdet 是本仓库第一个「非议会席」的 docgen 生成 agent。P3/P4 转录 skill/rule 时，「来源声明行」条款会复用到大量文件——届时需验证：多个生成物的来源声明行形态是否统一（还是各自历史措辞）。本轮只点名，不定案。

**手写席的模板边界**：`agent-handwritten.md.tpl` 是**本席专用**模板；手写席规则见 §3.1 末段（同形态、不同文件），此处不复述判据。

## 10 与既有 spec 的关系

- **不取代**任何既有 spec。
- **引用** `docs/prd/docgen-agent-generation.md` §5 W2 + §6.1–6.4 作为验收与流程源；不复制决策原文。
- **依赖** S1 spec `2026-10-19-docgen-agent-capability-design.md`（能力地基）+ S2 spec `2026-10-19-docgen-agent-pilot-design.md`（已跑通**议会席模板**的试点闭环）。
- **校正（2026-10-20 复核）**：S2 只验证了一套模板（议会席 `agent.md.tpl`）；`agent-handwritten.md.tpl` 至今仍是 5 节占位骨架，**第二套模板的真实性由本席首次验证**——不要把「双模板机制已验证」当既成事实，本席才是它的验证点。
- **衔接** `docs/after/dc-translator-design.md` §7：dc-translator 是 P2 管线建成后第一个新增 agent（W5 受控变更旅程），其转录形态参照本 spec 的组件数据模式。
- **衔接** `docs/superpowers/specs/2026-10-20-execution-assurance-matrix-design.md`（线 E）：替换后的卡须过 A 组结构项检查（§5 末行）；两者无判据冲突（线 E 查卡文本结构，本 spec 查转录逐字节）。
