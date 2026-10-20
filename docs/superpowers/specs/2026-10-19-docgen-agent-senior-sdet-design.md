# Docgen P2 · S3：senior-sdet 手写卡转录

> split from `docs/prd/docgen-agent-generation.md` (2026-10-19)
> 日期：2026-10-19｜状态：待评审（草稿，spec + testcase 一起送议会）｜PRD 状态：已定稿
> 测试用例文件：`docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design-testcase.md`
> 依赖：S1 spec `2026-10-19-docgen-agent-capability-design.md`（能力地基）+ S2 spec `2026-10-19-docgen-agent-pilot-design.md`（试点已验证双模板机制）+ PRD §5 W2 + PRD §6.1–6.4

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
| P2-遗-9 | 翻译质量三标准「详细/逻辑化」由施工 AI 自评写入组件数据注释 | problems.md |

## 1 全貌确认

| 维度 | 内容 |
|---|---|
| 本质 | 手写角色卡 → 组件数据 → docgen 生成，验证「手写 → 生成」在 agent 侧成立（P3/P4 的转录模型先例） |
| 同族 | 同类失败面：转录润色/改写（W2 逐字比对兜底）、来源声明行处理不当（该行是唯一允许差异）、专属 description 句式拼装错、notWhen 槽位未进边界节 |
| 边界 | 只做 `senior-sdet` 一席转录；不做 13 席（S2/S4）、不做能力本身（S1）；转录后 `agents/senior-sdet.md` 变为 docgen 生成物 |
| 验收 | W2（PRD §5）：除来源声明行（唯一允许差异）外逐字节一致 + description 专属句式逐字复现现 description 原文（身份句 + when + `Do not use for` + notWhen） |
| 影响面 | `tools/docgen/components/agentData.mjs`（加 senior-sdet 一条）、`tools/docgen/templates/agent-handwritten.md.tpl`（新建）、`agents/senior-sdet.md`（替换）、baseline agent 清单（senior-sdet 入比对子集） |

**联动四问**：

- **治本了吗**：转录模型（第二套模板 + 来源声明行差异条款）在此验证，P3/P4 直接复用；治本。
- **有副作用吗**：替换后 `agents/senior-sdet.md` 的「来源」行从「改动直接改本文件」变「docgen 生成」——这是设计意图（P2-1），但需确认该行变更不触发任何下游引用失效（senior-sdet 是 skill/agent 定义，无代码引用其来源行）。
- **跨问题联动吗**：专属 description 句式（P2-2）、notWhen 槽位（P2-8）、来源声明行差异（W2）三处互相牵连，必须同批做。
- **跨文件吗**：`agent-handwritten.md.tpl` 是新建模板；`agentData.mjs` 同时被 13 席条目占用，加 senior-sdet 条目需通过 validateAgentData（name 唯一断言）。

## 2 核心决定（不可违反）

| # | 决定 | 为什么 |
|---|---|---|
| R1 | **第二套模板 `agent-handwritten.md.tpl`**：与议会席模板不同源——含「你负责三件事」「三条铁律」「输入（四样）」「测试设计固定清单」「输出格式」「通用纪律」「边界」等专属节；tools 数据字段 `Read, Glob, Grep, Write, Edit` | P2-1：9 节 vs 13 席 8 节、tools 含写权限，单一模板装不下（F-01 教训） |
| R2 | **转录零改写**：正文措辞/标点/换行逐字保留；**唯一允许差异 = 来源声明行**（`> 来源：用户 2026-10-18 指定新建。本角色卡不属于议会 13 席花名册，也**不由** gen-agents.mjs 生成……改动直接改本文件` → 更新为生成声明，指示改为「改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换」） | W2「除来源声明行外逐字节一致」；转录润色 = 违反零改写（PRD §1.1 作用域声明：P2 本体 = 数据搬家/零改写转录，不涉及 AI 翻译） |
| R3 | **专属 description 句式（P2-2）**：完整形态 = `{身份句}。{when}时调用。Do not use for {notWhen}。`——身份句 / when / notWhen 均**逐字取自现 description 原文**，不引入新词；**when 提取边界 = 触发子句不含末尾「时」（现卡「...失败场景时调用」中「时调用」由句式补），否则拼装出「时时调用」**；拼装结果逐字 == 现 description | W2 的核心判据；身份句 = 「资深测试开发工程师（Senior SDET）」，when = 「当需要为 PRD/spec 设计并编写测试用例（testcase.md）、评审测试策略、或专门找出被忽视的边界与失败场景」**（不含末尾「时」）**，notWhen = 「修改业务代码、写实现方案、或只读的议会评审（那走 reviewer-qa）」 |
| R4 | **notWhen 结构化**：`{ text, refs: [route] }`；refs ⊆ agentData 键集（senior-sdet 的 notWhen 逐字复现现卡 `Do not use` 内容）；模板边界节渲染 notWhen 槽位（手写卡模板例外，13 席模板不加此槽位） | P2-8 + P2-2：13 席 notWhen 缺省不渲染，senior-sdet 例外填充并进边界节 |
| R5 | **翻译质量三标准自评（P2-遗-9）**：施工 AI 转录时自评「详细（不省略隐含语义）/ 逻辑化（关系明确）」并写入组件数据注释（`// translation-self-check: ...`）；「可测（每句有判据）」由校验器抽查（句子含可验证断言词） | PRD P2-8 翻译规范 + P2-遗-9；P2 内不验收翻译闭环，但转录仍需留自评痕 |
| R6 | **转录后 description 不适用词表断言**：senior-sdet description 属逐字复现（转录性质），禁成语/模糊词词表断言不适用（但句式校验仍强制） | S1 R13 + PRD W4：词表只约束 13 席句式派生产出 |
| R7 | **九步闭环同 S2**：入选 → 数据迁移（转录）→ 生成 → 逐字节比对（除来源声明行）→ 接守卫 → 落草稿 → 替换 → 验收 → 巩固 | PRD 6.2 对每个 agent 相同；本席不涉及 ROLES 移除（senior-sdet 本就不在 ROLES） |

## 3 数据形状：senior-sdet 的 agentData 条目

```js
{
  name: 'senior-sdet',
  role: '资深测试开发工程师（Senior SDET）',   // = position，来自标题/description 身份句
  dimension: undefined,                    // 非议会席，无 dimension
  when: '当需要为 PRD/spec 设计并编写测试用例（testcase.md）、评审测试策略、或专门找出被忽视的边界与失败场景',  // 逐字提取触发子句（不含末尾「时」，句式补「时调用」）
  notWhen: {
    text: '修改业务代码、写实现方案、或只读的议会评审（那走 reviewer-qa）',
    refs: ['reviewer-qa'],                 // 引用合法断言
  },
  route: 'senior-sdet',
  tools: ['Read', 'Glob', 'Grep', 'Write', 'Edit'],  // 数据字段（要写 testcase）
  identity: '有十年以上经验的测试开发工程师（SDET）。...',   // 逐字转录「你是谁」节
  fixedList: [/* 测试设计固定清单 9 条，逐字 */],
  sharedBlock: undefined,                  // 非议会席
  outputKind: 'testcase',                  // 新枚举值（patternRegistry 注册）
  fallback: undefined,
}
```

- **description 派生**：`资深测试开发工程师（Senior SDET）。当需要为 PRD/spec 设计并编写测试用例（testcase.md）、评审测试策略、或专门找出被忽视的边界与失败场景时调用。Do not use for 修改业务代码、写实现方案、或只读的议会评审（那走 reviewer-qa）。`（专属句式拼装：身份句 + when + 「时调用」 + `Do not use for` + notWhen，逐字 == 现 description 原文）。
- **模板**：`agent-handwritten.md.tpl`（第二套），节结构与现 `agents/senior-sdet.md` 对齐（9 节）。

## 4 九步闭环执行细则（PRD 6.2 落地，转录版）

| 步 | 动作 | 本席具体执行 | 失败回退 |
|---|---|---|---|
| 1 入选 | 锁定现产物基线 | `git hash-object agents/senior-sdet.md` + SHA256 | — |
| 2 数据迁移 | 手写正文转录成组件数据（第二套模板）+ 来源声明行更新 | 按 §3 数据形状；**转录零改写，仅来源声明行差异**；自评写组件数据注释 | — |
| 3 生成 | `docgen generate --kind agent --name senior-sdet` | 内存渲染，不写盘 | — |
| 4 逐字节比对 | 渲染 vs 现产物，排除来源声明行 | `Buffer.compare` 除来源声明行外必须相等 | 只改组件/模板，现产物不动；修 2 次仍不等 → 停损 |
| 5 接守卫 | 该席入 baseline agent 清单比对子集 | gate 开始重建比对 | 漂移 → 回退 registered 态 |
| 6 落草稿 | `docgen draft --kind agent --name senior-sdet` | 草稿进箱，`agents/*.md` 零改动 | — |
| 7 替换 | 用户确认后 `docgen replace ... --yes` | 先 gate，红 → 拒 | 拒红 → 草稿保留，修组件重走 4–7 |
| 8 验收 | W2 断言 + `npm run check` 全绿 + 后置干净 | 见 §5 | — |
| 9 巩固 | 连续 2 次 gate 绿（含隔目录冷跑） | — | — |

## 5 W2 验收（本 spec 的验收锚点）

| 检查 | 判据 |
|---|---|
| 逐字节一致 | `docgen generate --kind agent --name senior-sdet` 渲染 vs 转录后权威文本（来源声明行已更新为生成声明），`Buffer.compare` **除来源声明行（唯一允许差异）外** === 0 |
| 专属 description | 渲染 description 逐字复现现 description 原文（身份句 + when 逐字 + `Do not use for` + notWhen 逐字，不引入新词） |
| 转录零改写抽查 | 正文节（你是谁 / 三条铁律 / 固定清单 / 边界）逐字 vs 现卡，人工抽查 + Buffer 比对 |
| notWhen 引用合法 | notWhen.refs ⊆ agentData 键集（`reviewer-qa` ∈ 14 席键集） |
| 巩固 | 替换后 gate 连续 2 次绿（含隔目录冷跑）+ `npm run check` 全绿 + `git status --short rules/ skills/ agents/` 干净 + 草稿箱已清 |

## 6 硬约束

1. 转录零改写：除来源声明行外逐字保留（R2）。
2. 专属 description 逐字复现原文，不引入新词（R3）。
3. notWhen 结构化 `{ text, refs }`，refs ⊆ agentData 键集（R4）。
4. 自评（P2-遗-9）写入组件数据注释，缺自评 = 该组件数据不合格（R5）。
5. 模板边界节渲染 notWhen 槽位仅限手写卡模板；13 席模板不加此槽位（R4）。

## 7 测试

| 测什么 | 为什么 |
|---|---|
| 逐字节一致性（除来源声明行） | W2 核心；转录润色/改写是最隐蔽的假绿 |
| 专属 description 逐字复现 | 句式拼装错 = W2 必红（P2-2 硬约束） |
| 来源声明行唯一差异 | 该行处理不当（改成多行差异/动了正文）会假绿或假红 |
| notWhen 结构化 + 引用合法 | P2-8 断言 d；refs 悬空 = TriggerConflict |
| 自评痕存在 | P2-遗-9：翻译质量三标准自评是 P3/P4 转录的先例 |

**测试用例文件**：`docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design-testcase.md`（由 `senior-sdet` 独立编写；每条用例五要素、负例 ≥ 正例、覆盖总表指回本 spec 的 R 编号与 W2 锚点）

**只手动验证**：转录后角色卡「读起来还是同一张 senior-sdet」的语义观感（机器验字节，人验语义无漂移）。

**不测**：能力地基本身（S1）；13 席迁移（S2/S4）；翻译闭环（PRD §1.1 作用域，P2 内不验收）。

## 8 不在这一轮

- 13 席迁移——S2/S4。
- 翻译闭环（完形填空）——PRD §1.1 作用域声明，P2 内不验收。
- 词表对 transcription 字段生效——只约束派生产出（R6）。
- 能力完备（W6/W7）——S1 序 4。

## 9 将来才会撞上的一件事

senior-sdet 是本仓库第一个「非议会席」的 docgen 生成 agent。P3/P4 转录 skill/rule 时，「来源声明行」条款会复用到大量文件——届时需验证：多个生成物的来源声明行形态是否统一（还是各自历史措辞）。本轮只点名，不定案。

## 10 与既有 spec 的关系

- **不取代**任何既有 spec。
- **引用** `docs/prd/docgen-agent-generation.md` §5 W2 + §6.1–6.4 作为验收与流程源；不复制决策原文。
- **依赖** S1 spec `2026-10-19-docgen-agent-capability-design.md`（能力地基）+ S2 spec `2026-10-19-docgen-agent-pilot-design.md`（试点已验证双模板机制）。
- **衔接** `docs/after/dc-translator-design.md` §7：dc-translator 是 P2 管线建成后第一个新增 agent（W5 受控变更旅程），其转录形态参照本 spec 的组件数据模式。
