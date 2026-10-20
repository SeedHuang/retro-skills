# 测试用例：Docgen P2 · S3 senior-sdet 手写卡转录

> 归属 spec：`docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design.md`（split from `docs/prd/docgen-agent-generation.md` 2026-10-19）
> 编写者：`senior-sdet`（实例标识 `sdet-2026-10-19-docgen-p2-s3`）｜**独立性声明**：编写者 ≠ spec 作者（spec 作者 = prd-to-specs 拆分流程实例，未在本上下文出现），≠ 施工者（S3 施工 agent，未在本上下文出现）。本文件在全新上下文独立编写，仅依据 spec 全文、PRD §5 W2 / §6.1–6.4、S1 能力 spec（§6 校验断言 / §7 退出码）与转录对象现状 `agents/senior-sdet.md`，不从施工结果倒推判据。
> 状态：草稿（**定稿 = 每条用例五要素齐全，且覆盖总表与 spec 验收项一一对应**）｜最后更新：`2026-10-19`
> 命名与落点：按 `spec-testcase-gate` 规则判据 1（与 spec 同目录；文件名 = spec 文件名去掉 `.md` 后 + `-testcase.md`）。

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目 | 层级 | 正/负 | 判据类型 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|
| TC-001 | §4 步 1 入选 / R7 | 集成 | 正 | 机器 | `git hash-object` + SHA256 | P0 |
| TC-002 | §4 步 2 数据迁移（转录）/ R2 / §3 | 单元 | 正 | 机器 | `node --test <转录断言>` | P0 |
| TC-003 | R3 / §3 description 派生 / W2 专属 description | 集成 | 正 | 机器 | 渲染 + description `===` 断言 | P0 |
| TC-004 | R4 / §6 硬约束 3 / W2 notWhen 引用合法 / S1 §6 断言 10 | 单元 | 正 | 机器 | `node tools/docgen/cli.mjs gate` + refs 断言 | P0 |
| TC-005 | R5 / §6 硬约束 4 / §7 自评痕 | 单元 | 正 | 机器+人工 | `grep -n "translation-self-check"` | P0 |
| TC-006 | R1 / §3 模板 | 单元 | 正 | 机器 | 模板节标题断言 | P1 |
| TC-007 | §3 数据形状 / R1 tools / S1 §4.1 | 单元 | 正 | 机器 | agentData 逐字段断言 | P0 |
| TC-008 | R6 / S1 R13 / W4 | 集成 | 正 | 机器 | `node tools/docgen/cli.mjs gate` | P1 |
| TC-009 | §4 步 3 生成 / S1 R3 | 集成 | 正 | 机器 | `node tools/docgen/cli.mjs generate` | P0 |
| TC-010 | §4 步 4 逐字节比对 / R2 / W2 逐字节一致 / §7 | 集成 | 正 | 机器 | `generate` + diffSet 断言 | P0 |
| TC-011 | §4 步 6 落草稿 / R7 | 集成 | 正 | 机器 | `node tools/docgen/cli.mjs draft` + `git status --short agents/` | P0 |
| TC-012 | §4 步 7 替换 / 步 8 验收 / W2 五行 | e2e | 正 | 机器 | `replace ... --yes` + `npm run check` + `git status --short` | P0 |
| TC-013 | §4 步 9 巩固 / R7 / W2 巩固 | e2e | 正 | 机器+人工 | `gate` × 2（含隔目录冷跑）+ `draft ls` | P0 |
| TC-014 | R2 零改写 / W2 逐字节一致 / §7 转录润色 | 集成 | 负 | 机器 | diffSet 断言 | P0 |
| TC-015 | R2 / W2 来源声明行 / §7 | 集成 | 负 | 机器 | 来源行更新断言 | P0 |
| TC-016 | R2 / W2 唯一差异条款 / §7 | 集成 | 负 | 机器 | diffSet == {来源行} 断言 | P0 |
| TC-017 | R3 / W2 专属 description / S1 §6 断言 8 / §7 拼装错 | 单元 | 负 | 机器 | 派生 description vs 现卡原文黄金比对 | P0 |
| TC-018 | R4 / S1 §6 断言 10 / §7 notWhen | 单元 | 负 | 机器 | `validateAgentData` refs 断言 | P0 |
| TC-019 | R6 / S1 R13 词表例外 | 集成 | 负 | 机器 | gate 豁免断言 | P1 |
| TC-020 | R5 / §6 硬约束 4 | 单元 | 负 | 机器 | grep 缺失断言 | P0 |
| TC-021 | §3 identity / W2 逐字节一致 | 集成 | 负 | 机器 | diffSet 断言 | P1 |
| TC-022 | R1 / §3 模板 9 节 | 集成 | 负 | 机器 | 缺节渲染比对 | P1 |
| TC-023 | R4 / §6 硬约束 5 | 单元 | 负 | 机器 | 模板 grep 断言 | P1 |
| TC-024 | R2 / W2 逐字节一致 / §7 来源声明行 | 集成 | 负 | 机器 | 正文改写漏检断言 | P0 |
| TC-025 | §4 步 7 / S1 §5.3 拒红过滤 | 集成 | 负 | 机器 | `replace` 退出码 + 草稿保留检查 | P1 |
| TC-026 | §4 失败回退（停损）/ R7 | e2e | 负 | 机器 | 账本状态 + `git diff agents/` | P1 |
| TC-027 | PRD §5 通用前置（checkEnvironment）/ W2 逐字节一致 | 集成 | 边界 | 机器 | BOM / CR / 尾换行污染样本 | P1 |
| TC-028 | §4 步 9 巩固 / W2 巩固 | e2e | 负 | 机器 | 四情形巩固判定 | P1 |
| TC-029 | §4 步 7 / S1 §5.2 / S1 §7 exit 4 | 集成 | 负 | 机器 | `replace` 退出码 | P1 |

**覆盖核对**：spec 验收项共 **13 项**（核心决定 R1–R7 共 7 项 + W2 验收表五行 + §3 数据形状一项）；本表覆盖 **13 项**；未覆盖 **0 项**。九步闭环（§4 步 1–9）的执行细则由 TC-001/002/009/010/011/012/013（正）与 TC-014–TC-029（负）覆盖；§6 硬约束 1–5（转录零改写 / description 逐字 / notWhen refs / 自评 / 模板槽位仅手写卡）与 §7 测什么五行（逐字节一致性 / 专属 description / 来源声明行唯一差异 / notWhen 结构化 / 自评痕）在覆盖总表逐项可指回。负例与边界 **16 条** ≥ 正例 **13 条**。

## 2 用例明细

### TC-001 入选：锁定现产物基线（双哈希）

- **覆盖**：§4 步 1 / R7
- **前置**：`agents/senior-sdet.md` 为迁移前现产物（手写卡原文，未动）；仓库在迁移起点
- **步骤**：① 运行 `git hash-object agents/senior-sdet.md`；② 运行 SHA256 哈希；③ 记录两值到迁移账本（PRD §6.6）
- **预期**：双哈希值非空且可复算；账本记录两值 + 迁移日期 + 该席类型（手写转录）
- **判据**：机器——`git hash-object agents/senior-sdet.md` 退出码 0 且输出 40 位十六进制；`Get-FileHash -Algorithm SHA256 agents/senior-sdet.md` 输出 64 位十六进制；重跑两命令结果不变（确定性）；账本两值与命令输出逐字一致
- **红绿证据**：红 = 哈希值变化（基线漂移）或账本未记；绿 = 双哈希稳定且已记录
- **对应测试**：待 plan Task N（S3 迁移脚本内嵌账本写入）
- **不覆盖**：哈希算法本身（git/系统保证）；「迁移前现产物是否就是手写卡最后版本」（由人工确认，§5）

### TC-002 数据迁移：手写正文转录成组件数据（零改写 + 来源声明行更新）

- **覆盖**：§4 步 2 / R2 / §3
- **前置**：S1 序 0 完成（agentData.mjs / validateAgentData 可运行）；`agents/senior-sdet.md` 为迁移前原文
- **步骤**：① 对照现卡逐节转录进 `tools/docgen/components/agentData.mjs` 的 senior-sdet 条目：你是谁（两段）→ `identity`、你负责三件事 → 数据字段、三条铁律 → 数据字段、输入（四样，缺一不写）→ 数据字段、测试设计固定清单（9 条）→ `fixedList`、自由探索（必做）→ 数据字段、输出格式 → 数据字段、通用纪律 → 数据字段、边界 → 数据字段；② 来源声明行更新为生成声明（旧行「改动直接改本文件」→ 新行指示「改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换」）；③ 运行转录断言：除来源声明行外，各字段与现卡对应节**逐字相等**（措辞 / 标点 / 换行 / 段间空行零改写）
- **预期**：identity 含完整两段（「有十年以上经验…找出来。」+「你的名声来自两件事…为什么这里会炸。」）；fixedList 9 条逐字（含第 7 条「判别力」、第 8 条「盲点雷达」全行原文）；来源声明行含生成声明与四步指示；**零改写 = 逐字保留，不是语义等价**
- **判据**：机器——`node --test <转录断言>` 逐字段 `===`/`deepEqual` 退出码 0；任一字与现卡对应节不等即 fail；来源行断言：含「生成」且含「改组件数据 → 生成 → 草稿 → 确认 → 替换」（语义断言，见 §7 缺口 1）
- **红绿证据**：红 = 转录润色（如「找出被忽视的边界」改「发现被忽视的边界」）或来源行未更新 → 断言 fail；绿 = 逐字相等 + 来源行已更新
- **对应测试**：待 plan Task N（转录断言测试）
- **不覆盖**：description 拆槽拼装（TC-003）；渲染层逐字节比对（TC-010）；自评痕（TC-005）

### TC-003 专属 description 派生：句式拼装逐字 == 现 description 原文

- **覆盖**：R3 / §3 description 派生 / W2 专属 description
- **前置**：组件数据含 role / when / notWhen 槽位；现卡 frontmatter description 已知
- **步骤**：① 渲染 senior-sdet；② 提取渲染 frontmatter 的 description；③ 与现卡 description 原文逐字比较
- **预期**：渲染 description === `资深测试开发工程师（Senior SDET）。当需要为 PRD/spec 设计并编写测试用例（testcase.md）、评审测试策略、或专门找出被忽视的边界与失败场景时调用。Do not use for 修改业务代码、写实现方案、或只读的议会评审（那走 reviewer-qa）。`（身份句 + when 逐字 + `Do not use for` + notWhen 逐字，不引入新词）；拼装形态 `{身份句}。{when}时调用。Do not use for {notWhen}。` 的结果与现卡**逐字相等**
- **判据**：机器——`renderedDescription === '<现卡 description 全文>'` 为 true；`node --test` 退出码 0；判据来自现卡 frontmatter 原文（黄金值），**不用实现拼装结果当预期**（防自证循环，固定清单第 4 条）
- **红绿证据**：红 = 拼装引入错字/多余空格/漏标点（含「时时」叠字，见 TC-017）→ 断言 fail；绿 = 逐字相等
- **对应测试**：待 plan Task N
- **不覆盖**：13 席 description 句式（S1/S4）；词表断言（TC-008/019）

### TC-004 notWhen 结构化 + refs 引用合法

- **覆盖**：R4 / §6 硬约束 3 / W2 notWhen 引用合法 / S1 §6 断言 10
- **前置**：agentData 全 14 席键集可枚举（含 reviewer-qa）
- **步骤**：① 断言 notWhen 形状为 `{ text, refs: [route] }`；② 断言 text 逐字 === `修改业务代码、写实现方案、或只读的议会评审（那走 reviewer-qa）`（现卡 `Do not use` 内容）；③ 断言 refs = `['reviewer-qa']`；④ 跑 validateAgentData（或 gate），断言 refs ⊆ agentData 键集
- **预期**：形状合法、text 逐字、refs 合法（reviewer-qa ∈ 14 席键集）；validateAgentData 不报 `TriggerConflict`
- **判据**：机器——`node tools/docgen/cli.mjs gate` 退出码 0；断言脚本输出 `notWhen refs valid: PASS`；`.code === 'TriggerConflict'` 不出现
- **红绿证据**：红 = refs 指向不存在键 → `TriggerConflict`（exit 1）；绿 = PASS
- **对应测试**：待 plan Task N
- **不覆盖**：13 席 notWhen 缺省语义（S1 §4.1）；fallback 静态断言（S1 §6 断言 11）

### TC-005 自评痕存在（P2-遗-9）

- **覆盖**：R5 / §6 硬约束 4 / §7 自评痕
- **前置**：组件数据已转录
- **步骤**：① grep `translation-self-check` 于 `tools/docgen/components/agentData.mjs` 的 senior-sdet 条目注释；② 断言自评覆盖「详细（不省略隐含语义）」「逻辑化（关系明确）」两维；③ 人工抽查自评内容真实性
- **预期**：注释存在且两维齐全；缺自评 = 组件数据不合格（§6.4），不进入生成/替换
- **判据**：机器——`grep -n "translation-self-check" tools/docgen/components/agentData.mjs` 命中，输出含「详细」「逻辑化」字样；人工——评审者看自评是否具体反映转录取舍（见 §5 项 4）
- **红绿证据**：红 = 注释缺失或两维缺一 → 验收打回；绿 = 存在且两维齐全
- **对应测试**：待 plan Task N
- **不覆盖**：「可测（每句有判据）」维（由校验器抽查，S1）；自评内容的真实性（人工，§5）

### TC-006 第二套模板 9 节结构（agent-handwritten.md.tpl）

- **覆盖**：R1 / §3 模板
- **前置**：`tools/docgen/templates/agent-handwritten.md.tpl` 存在
- **步骤**：① 解析模板节标题（`##` 级）；② 断言 9 节齐全且顺序与现卡一致；③ 断言专属节在位（你负责三件事 / 三条铁律 / 输入（四样，缺一不写）/ 测试设计固定清单 / 输出格式 / 通用纪律 / 边界）；④ 断言不含议会席专用节（如共享特质节——13 席模板才有的内容）
- **预期**：9 节 = 你是谁 / 你负责三件事 / 三条铁律 / 输入（四样，缺一不写）/ 测试设计固定清单 / 自由探索（必做）/ 输出格式 / 通用纪律 / 边界，顺序一致
- **判据**：机器——断言脚本读模板节标题输出 `template sections: PASS`；退出码 0；缺节或顺序错即 fail
- **红绿证据**：红 = 缺「自由探索（必做）」节或专属节缺失 → FAIL；绿 = 9 节齐全
- **对应测试**：待 plan Task N
- **不覆盖**：模板占位符语法（S1 §6 断言 2 TemplateSyntaxError）；13 席模板结构（S1/S4）

### TC-007 §3 数据形状逐字段核对

- **覆盖**：§3 / R1 tools / S1 §4.1
- **前置**：agentData.mjs 的 senior-sdet 条目就位；patternRegistry 含 outputKind 枚举
- **步骤**：① 逐字段断言：name=`senior-sdet`、role=`资深测试开发工程师（Senior SDET）`、dimension=undefined、when=`当需要为 PRD/spec 设计并编写测试用例（testcase.md）、评审测试策略、或专门找出被忽视的边界与失败场景时`、notWhen=`{text, refs:['reviewer-qa']}`、route=`senior-sdet`、tools=`['Read','Glob','Grep','Write','Edit']`、identity=完整两段、fixedList=9 条、sharedBlock=undefined、outputKind=`testcase`、fallback=undefined；② 断言 tools 含写权限（Write/Edit——第二套模板数据字段，区别于 13 席只读三元组）；③ 断言 outputKind=`testcase` 已注册（patternRegistry 枚举存在，新枚举值）；④ 断言 agentData 不存独立 description 字段（S1 §4.1，防硬编码绕过派生）；⑤ 断言 when 不含「在…中担任 / 时调用」字样（S1 §6 断言 7）
- **预期**：全字段符合 §3 数据形状；tools 含 Write/Edit；outputKind 注册；无 description 字段；when 格式合法
- **判据**：机器——node 断言脚本输出 `agentData shape: PASS`；`grep -n "description:" tools/docgen/components/agentData.mjs` 无命中；`validateAgentData` 无 `ToolsViolation` / `WhenFormatViolation`
- **红绿证据**：红 = tools 缺 Write（回到只读三元组）→ `ToolsViolation`；或 outputKind 未注册 → 渲染缺块；绿 = PASS
- **对应测试**：待 plan Task N
- **不覆盖**：13 席条目形状（S1/S4）；description 派生内容（TC-003）

### TC-008 词表断言对转录字段豁免（R6）

- **覆盖**：R6 / S1 R13 / W4
- **前置**：gate 含 W4 派生断言（description == 句式拼装输出，全 14 席）
- **步骤**：① 跑 `node tools/docgen/cli.mjs gate`；② 断言 senior-sdet 的 description / identity / fixedList 等**转录字段**不被成语 / 模糊词词表断言打红（senior-sdet 属逐字复现，词表只约束 13 席句式派生产出）；③ 断言句式校验仍强制（description 派生断言对 senior-sdet 仍生效）
- **预期**：gate 全绿；转录字段含口语化/具体表述（如「找出来」「判别力」）不触发词表红；派生断言不因豁免而失效
- **判据**：机器——`node tools/docgen/cli.mjs gate` 退出码 0
- **红绿证据**：红 = 词表误套转录字段（假红）或派生断言对 senior-sdet 失效（假绿）；绿 = 豁免 + 派生断言双成立
- **对应测试**：待 plan Task N
- **不覆盖**：13 席词表约束生效面（S1 W4）；词表本身内容（S1）

### TC-009 生成：内存渲染，不写盘、不落草稿

- **覆盖**：§4 步 3 / S1 R3
- **前置**：组件数据就位
- **步骤**：① 运行 `node tools/docgen/cli.mjs generate --kind agent --name senior-sdet`；② 检查 `agents/senior-sdet.md` 的 mtime 与内容；③ 检查草稿箱无新增
- **预期**：命令输出渲染结果与比对结论；`agents/senior-sdet.md` 零改动；草稿箱 `~/.retro-skills/docgen-drafts/` 无新增文件
- **判据**：机器——命令退出码 0；`git status --short agents/` 无该文件行；`draft ls --name senior-sdet` 无新增
- **红绿证据**：红 = generate 写盘（git status 出现改动）或落草稿；绿 = 零改动且退出码 0
- **对应测试**：待 plan Task N（cli 测试）
- **不覆盖**：draft 的写草稿行为（TC-011）

### TC-010 逐字节比对：vs 现产物，唯一差异 = 来源声明行

- **覆盖**：§4 步 4 / R2 / W2 逐字节一致 / §7
- **前置**：S1 的 render + compare 可用；现产物（迁移前手写卡）未动
- **步骤**：① 内存渲染 senior-sdet；② 读 `agents/senior-sdet.md`（迁移前现产物）；③ 两 Buffer.compare 全文件 → 计算差异行集；④ 断言差异集 == {来源声明行}；⑤ 另与「转录后权威文本」（= 现产物 + 来源声明行替换为生成声明）全文件比对，断言 === 0
- **预期**：vs 现产物时唯一差异 = 来源声明行（旧行 → 新生成声明行）；其余字节（空行 / 标点 / 换行 / 尾换行）完全一致；vs 权威文本时全文件相等。**本席 description 非允许差异字段**（R3 逐字复现，与 13 席不同），必须参与逐字节比对
- **判据**：机器——diffSet 断言：`diffSet(render, target) === [来源声明行]`；`compare(render, 权威文本) === 0`；差异集 > 1 行即 fail，输出首个差异的 line/byte 位置
- **红绿证据**：红 = 任何额外差异（转录润色 / 空行缺失 / 尾换行变化）→ fail；绿 = 唯一差异 = 来源行
- **对应测试**：待 plan Task N（compare 测试）
- **不覆盖**：来源声明行自身内容（TC-015/016）；description 逐字（TC-003 单独断言）

### TC-011 落草稿：draft 进箱，agents/*.md 零改动

- **覆盖**：§4 步 6 / R7
- **前置**：TC-010 通过；草稿箱该名下无旧草稿
- **步骤**：① 运行 `node tools/docgen/cli.mjs draft --kind agent --name senior-sdet`；② 检查草稿箱新增 `<name>--<YYYYMMDD-HHMMSS>.md`；③ 检查 `agents/` 零改动
- **预期**：草稿写入 `~/.retro-skills/docgen-drafts/senior-sdet--<时间戳>.md`；草稿字节 === 内存渲染字节；`agents/senior-sdet.md` 字节不变
- **判据**：机器——`draft ls --name senior-sdet` 恰好 1 条且文件名含时间戳；`git status --short agents/` 无该文件行；`fc /b <草稿> <内存渲染临时文件>` 无差异
- **红绿证据**：红 = draft 改了 agents/ 或草稿字节 ≠ 渲染；绿 = 草稿入箱、agents/ 零改动
- **对应测试**：待 plan Task N（draft 测试）
- **不覆盖**：遇旧草稿时的拒绝行为（S1 R4 / W7，能力测试）；草稿箱生命周期全量（S1 R2）

### TC-012 替换 + W2 验收：replace --yes 后 W2 五断言 + check 全绿 + 后置干净

- **覆盖**：§4 步 7 / 步 8 / W2 五行
- **前置**：TC-011 草稿在箱；用户已确认替换
- **步骤**：① 运行 `node tools/docgen/cli.mjs replace --kind agent --name senior-sdet --draft <草稿> --yes`；② 检查退出码；③ 替换后跑 W2 五断言：逐字节一致（TC-010 判据）/ 专属 description（TC-003 判据）/ 转录零改写抽查（人工，§5 项 2）/ notWhen 引用合法（TC-004 判据）/ 巩固前置（TC-013 判据）；④ `npm run check`；⑤ `git status --short rules/ skills/ agents/`
- **预期**：退出码 0；替换后 `agents/senior-sdet.md` = 草稿字节（临时文件 + rename 原子写）；W2 断言全过；`npm run check` 全绿（0 findings）；**git status 的语义对本席 ≠ S2**——来源声明行更新使 `agents/senior-sdet.md` 相对 git 基线必有一行差异（预期内），断言该差异 == 仅来源声明行，且 `rules/ skills/` 零改动
- **判据**：机器——replace 退出码 0；`fc /b <草稿> agents/senior-sdet.md` 无差异；`npm run check` 退出码 0；`git diff agents/senior-sdet.md` 的差异行集 == {来源声明行}；`git status --short rules/ skills/` 无输出
- **红绿证据**：红 = replace 失败 / 文件非草稿字节 / W2 任一断言 fail / git diff 出现来源行以外差异；绿 = 全部通过
- **对应测试**：待 plan Task N（W2 验收脚本）
- **不覆盖**：巩固的二次 gate 与隔目录冷跑（TC-013）；replace 失败路径（TC-025/029）；「干净」指提交后的状态（git 写操作由用户决定，不属本 spec）

### TC-013 巩固：gate 连续 2 次绿（含隔目录冷跑）+ 六要素全达标

- **覆盖**：§4 步 9 / R7 / W2 巩固
- **前置**：TC-012 通过
- **步骤**：① 跑 `node tools/docgen/cli.mjs gate` 第 1 次，确认绿；② 复制仓库（含 `.git`）到临时目录（排除 `.session/`、`node_modules/` 非 git 内容），副本跑 gate 第 2 次（隔目录冷跑）；③ 核对巩固六要素：gate × 2 绿（含冷跑）/ `npm run check` 全绿 / `git status --short rules/ skills/ agents/` 干净（本席口径 = agents 差异仅来源行 + rules/skills 零改动）/ 旧生成来源对该对象停止输出（senior-sdet 本就不在 ROLES，断言 `gen-agents.mjs` 无该席）/ 内容 = 组件渲染（人工抽查 1 处关键格，如「三条铁律」第 1 条）/ 草稿箱该名下已清
- **预期**：六要素全部达标才置「已巩固」；草稿箱 `draft ls --name senior-sdet` 为空
- **判据**：机器——两次 gate 退出码均 0；副本 gate 退出码 0；`npm run check` 0；`git diff agents/senior-sdet.md` 差异仅来源行 + `git status --short rules/ skills/` 无输出；`grep -n "senior-sdet" skills/parliament/scripts/gen-agents.mjs` 无匹配；`draft ls --name senior-sdet` 为空；人工——施工者抽查 1 处关键格与组件数据一致
- **红绿证据**：红 = 任一要素 fail（如冷跑 gate 红 = 本地缓存掩盖漂移）；绿 = 六要素全过
- **对应测试**：待 plan Task N（冷跑脚本）
- **不覆盖**：冷跑复制清单完备性（§7 缺口 6）；队列推进顺序（PRD 6.1）

### TC-014 转录润色/改写 → 逐字节红（零改写硬约束）

- **覆盖**：R2 / W2 逐字节一致 / §7 转录润色
- **前置**：基线绿（TC-010 通过）
- **步骤**：① 构造污染样本：组件数据里把「找出被忽视的边界」改「发现被忽视的边界」（同义改写，语义等价）；② 渲染并 diffSet 比对
- **预期**：任何非来源声明行的字节差异（措辞 / 标点 / 换行）→ 红；**「语义等价即放行」不允许**——零改写是逐字硬约束，不是语义等价（PRD §1.1 作用域声明：P2 本体 = 零改写转录，不涉及 AI 翻译）
- **判据**：机器——diffSet 断言输出 FAIL 并给出首个差异 line/byte；generate/比对报 Mismatch 族错误（exit 1，S1 §7 档位）
- **红绿证据**：红 = 润色样本被拦（FAIL）；绿 = 还原后 PASS
- **对应测试**：待 plan Task N
- **不覆盖**：来源声明行本身（TC-015/016）；description 值（TC-017）

### TC-015 来源声明行未更新（旧行保留）→ 红

- **覆盖**：R2 / W2 来源声明行 / §7
- **前置**：权威文本已含新来源行（生成声明）
- **步骤**：① 构造污染样本：渲染仍保留旧来源行（「改动直接改本文件」未更新）；② 比对权威文本
- **预期**：红——旧行未更新 = 转录未完成；来源声明行是 W2 唯一允许差异，该差异必须发生（旧 → 新），不发生也是不合格
- **判据**：机器——断言脚本输出 `source line updated: FAIL`；或逐字节比对（权威文本含新行、渲染含旧行 → 不等）
- **红绿证据**：红 = 旧行保留被拦；绿 = 新行在位
- **对应测试**：待 plan Task N
- **不覆盖**：新行措辞的逐字断言（spec 未锁定措辞 → §7 缺口 1，按语义断言）

### TC-016 来源声明行差异溢出（唯一差异条款）→ 红

- **覆盖**：R2 / W2 唯一差异 / §7
- **前置**：基线绿
- **步骤**：① 构造污染样本：除来源声明行外，正文另改一处（如「通用纪律」某句）；② diffSet 断言
- **预期**：差异集 ≠ {来源声明行} → 红；「唯一允许差异」是硬边界——差异溢出 = 改动不止来源行
- **判据**：机器——diffSet 断言输出 `diff-set == {source-line}: FAIL` 并列出第二处差异位置
- **红绿证据**：红 = 两行差异被拦；绿 = 仅一行差异 PASS
- **对应测试**：待 plan Task N
- **不覆盖**：—

### TC-017 专属 description 拼装错 → 派生 ≠ 现卡原文（黄金比对红）

- **覆盖**：R3 / W2 专属 description / S1 §6 断言 8 / §7 拼装错
- **前置**：构造两个污染样本
- **步骤**：① 样本 A：when 槽位含尾缀「时」（按 §3 数据形状字面值）且句式按 `{when}时调用` 拼装 → 派生得「……失败场景**时时**调用」；② 样本 B：notWhen 槽位换词（「那走 reviewer-qa」改「由 reviewer-qa 负责」）；③ 各取渲染 description 与现卡 description 原文逐字比对
- **预期**：任一拼装错 → 派生 ≠ 现卡 description → 红；身份句 / when / notWhen 均逐字取自现 description、不引入新词
- **判据**：机器——**黄金比对（渲染 description vs 现卡 frontmatter description 逐字）**为唯一裁决；不等 → fail（exit 1）。注意：S1 §6 断言 8（description == 句式拼装输出）对拼装错**自洽**——拼装输出与渲染同源，双双错仍相等，拦不住叠字；真正拦截在「vs 现卡原文」的黄金比对（判别力说明，防自证循环）
- **红绿证据**：红 = 叠字/换词样本被黄金比对拦下；绿 = 正确拼装逐字相等
- **对应测试**：待 plan Task N（黄金比对脚本）
- **不覆盖**：13 席句式；词表；when 格式约束（S1 §6 断言 7，见 TC-007 步 ⑤）

### TC-018 notWhen.refs 悬空 → TriggerConflict（exit 1）

- **覆盖**：R4 / S1 §6 断言 10 / §7 notWhen
- **前置**：构造污染样本：refs = `['reviewer-qa-typo']`（指向不存在的键）
- **步骤**：① 注入悬空 refs；② 运行 validateAgentData
- **预期**：返回 `TriggerConflict`，exit 1，错误消息指明 refs 悬空（S1 §6 断言 10：notWhen.refs ⊆ agentData 键集）
- **判据**：机器——`.code === 'TriggerConflict'`；`node tools/docgen/cli.mjs gate` 退出码 1
- **红绿证据**：红 = 悬空 refs 被拦；绿 = 合法 refs（TC-004）PASS
- **对应测试**：待 plan Task N
- **不覆盖**：fallback 静态断言（S1 §6 断言 11）；route 悬空（S1 §6 断言 9）

### TC-019 词表断言误套转录字段 → 假红（豁免断言）

- **覆盖**：R6 / S1 R13
- **前置**：构造污染实现：「词表断言套到 senior-sdet 转录字段」（把词表作用域误扩到逐字复现字段）
- **步骤**：① 用污染实现跑 gate；② 断言结果
- **预期**：不得打红——若词表命中转录字段（如 identity「找出来」、fixedList「判别力」）→ 假红 = 实现错误（R6：词表只约束 13 席句式派生产出，不约束零改写转录字段）；豁免生效
- **判据**：机器——gate 退出码 0；词表扫描脚本对 senior-sdet 的 transcription 字段跳过（S1 R13 例外）
- **红绿证据**：红 = 词表误套产生假红；绿 = 豁免 + 句式校验仍强制（TC-008）
- **对应测试**：待 plan Task N
- **不覆盖**：13 席派生产出的词表约束（S1 W4 生效面）

### TC-020 自评痕缺失 → 组件数据不合格（验收打回）

- **覆盖**：R5 / §6 硬约束 4
- **前置**：构造污染样本：删除 senior-sdet 条目注释中的 `translation-self-check`
- **步骤**：① 删除自评注释；② grep 检查
- **预期**：缺自评 = 该组件数据不合格（§6.4 硬约束 4）——验收打回，不进入生成/替换；生成物不得以「没写自评」的状态被巩固
- **判据**：机器——`grep -n "translation-self-check" tools/docgen/components/agentData.mjs` 无命中 → 判不合格；验收账本该席状态 ≠ 已巩固
- **红绿证据**：红 = 缺失被查（打回）；绿 = 恢复注释后存在（TC-005）
- **对应测试**：待 plan Task N
- **不覆盖**：自评内容质量（人工，§5 项 4）；「可测」维抽查（S1）

### TC-021 identity 转录截断（第二段丢失）→ 逐字节红

- **覆盖**：§3 identity / W2 逐字节一致
- **前置**：构造污染样本：identity 只转录首段（「有十年以上经验…找出来。」），省略「你的名声来自两件事…」段
- **步骤**：① 注入截断 identity；② 渲染并 diffSet 比对
- **预期**：红——identity 必须含完整两段（含段间空行）；任何省略 → 逐字节红（§3 identity 是转录常量，逐字）
- **判据**：机器——diffSet 断言 FAIL，首个差异位于「你的名声来自两件事」段缺失处
- **红绿证据**：红 = 截断被拦；绿 = 完整两段 PASS（TC-002）
- **对应测试**：待 plan Task N
- **不覆盖**：fixedList 截断（同机制，TC-002 覆盖 9 条全量断言）

### TC-022 模板缺节（缺「自由探索」/「边界」节）→ 逐字节红 / MissingSlot

- **覆盖**：R1 / §3 模板 9 节
- **前置**：构造污染模板：`agent-handwritten.md.tpl` 删除「## 边界」节（或「## 自由探索（必做）」节）
- **步骤**：① 用缺节模板渲染；② 与现产物 diffSet 比对
- **预期**：红——缺节 → 渲染缺块 → 逐字节红；或模板槽位校验报 `MissingSlot` 族错误（exit 1，S1 §7 档位）
- **判据**：机器——diffSet FAIL（首个差异指向缺节处）；或 gate/validateAgentData 报 `MissingSlot`，exit 1
- **红绿证据**：红 = 缺节被拦；绿 = 9 节齐全 PASS（TC-006）
- **对应测试**：待 plan Task N
- **不覆盖**：占位符未闭合（S1 §6 断言 2 TemplateSyntaxError）；空行布局差异（§7 缺口 3）

### TC-023 13 席模板误加 notWhen 槽位 → 硬约束 5 红

- **覆盖**：R4 / §6 硬约束 5
- **前置**：`agent.md.tpl`（13 席）与 `agent-handwritten.md.tpl`（手写卡）均在位
- **步骤**：① grep notWhen 于 `tools/docgen/templates/agent.md.tpl`；② grep notWhen 于 `tools/docgen/templates/agent-handwritten.md.tpl`
- **预期**：13 席模板必须无 notWhen 槽位（§6.5：模板边界节渲染 notWhen 槽位仅限手写卡模板）；手写卡模板必须含该槽位（R4）
- **判据**：机器——`grep -n "notWhen" tools/docgen/templates/agent.md.tpl` 无命中（exit 1）；`grep -n "notWhen" tools/docgen/templates/agent-handwritten.md.tpl` 命中（exit 0）
- **红绿证据**：红 = 13 席模板含槽位 → FAIL（模板层死代码，渲染层 notWhen 缺省不渲染发现不了）；绿 = 无
- **对应测试**：待 plan Task N
- **不覆盖**：13 席渲染字节（S2/S4）；13 席 notWhen 缺省语义（S1 §4.1）

### TC-024 比对排除逻辑按行号 /「> 开头」过滤 → 假绿（判别力负例）

- **覆盖**：R2 / W2 逐字节一致 / §7 来源声明行
- **前置**：构造污染样本：正文第 9 行之后（来源声明行之后）的某行被改写，如「通用纪律」节「禁止凭印象断言」改「禁止凭记忆断言」
- **步骤**：① 注入正文改写；② 若实现按「行号 = 来源行」或「行以 `>` 开头」排除来源声明行 → 该改写可能被漏检；③ 断言必须红
- **预期**：任何正文差异必须红——排除逻辑只能按「行内容 = 来源声明行（旧行或新行）」匹配，不得按行号 / 前缀过滤（按行号 = 正文行偏移后漏检，按前缀 = 误放行其它引用行）
- **判据**：机器——断言脚本对污染样本必须报 FAIL（检测到差异）；输出 PASS = 漏检 = 实现缺陷
- **红绿证据**：红 = 按行号排除 → 正文改写漏检（假绿，正是本用例要防的）；绿 = 按内容匹配拦截
- **对应测试**：待 plan Task N（compare 排除逻辑测试）
- **不覆盖**：来源行内容本身（TC-015/016）

### TC-025 替换前 gate 红（与目标无关漂移）→ 拒绝替换，草稿保留

- **覆盖**：§4 步 7 / S1 §5.3 拒红过滤
- **前置**：构造与 senior-sdet 无关的漂移：篡改另一已巩固 agent 一个字节（或 baseline 类红）
- **步骤**：① 制造无关漂移；② 运行 `replace --kind agent --name senior-sdet --draft <草稿> --yes`
- **预期**：拒绝替换；返回与漂移对应的错误（`Mismatch` / baseline 类，exit 1/2，S1 §7 档位）；草稿保留；`agents/senior-sdet.md` 不变
- **判据**：机器——replace 退出码非 0；错误消息含漂移文件名（非 senior-sdet.md）；`git diff agents/senior-sdet.md` 为空；`draft ls --name senior-sdet` 仍 1 条
- **红绿证据**：红 = 无关漂移被拒；绿 = 漂移修复后可替换（TC-012）
- **对应测试**：待 plan Task N
- **不覆盖**：目标对象自身预期差异放行（S1 R6；正常路径 TC-012）；拒红过滤实现（S1 §5.3，能力测试）

### TC-026 步 4 停损回退（修 2 次仍不等）→ 停损未迁，现产物不动

- **覆盖**：§4 失败回退 / R7
- **前置**：构造组件数据缺陷（如模板槽位拼装顺序错）致比对不等
- **步骤**：① 引入缺陷 → 比对红；② 修组件 1 次 → 仍红；③ 修组件 2 次 → 仍红 → 停止；④ 断言停损处理
- **预期**：全程只改组件/模板、**现产物不动**（D6）；2 次修复仍不等 → 停止、写复盘、对象标「停损未迁」、队列停在该对象
- **判据**：机器——迁移账本该席状态 = 停损未迁；`git diff agents/senior-sdet.md` 为空（现产物未被改迁就）；复盘文件在案（含 2 次修复尝试记录）
- **红绿证据**：红 = 停损前现产物被改（违规迁就模板）→ gate 红且 diff 非空；绿 = 现产物未动 + 停损账本在案
- **对应测试**：待 plan Task N（停损流程守卫）
- **不覆盖**：停损后 registered 态守卫（S1 §8.6）；「带未迁收口 ≤ 3」账目（PRD §8）

### TC-027 EOL / 尾换行 / BOM 边界 → checkEnvironment 拦截

- **覆盖**：PRD §5 通用前置（checkEnvironment）/ W2 逐字节一致
- **前置**：基线绿；污染样本按 checkEnvironment 顺序构造
- **步骤**：① 样本 A：权威文本行尾转 CRLF；② 样本 B：去掉文件尾换行；③ 样本 C：文件头加 BOM（EF BB BF）；④ 样本 D：非法 UTF-8 字节；⑤ 各跑 checkEnvironment 与 diffSet 比对
- **预期**：BOM / CR / 非法 UTF-8 / 尾换行差异均被拦（顺序沿用 P1 checkEnvironment）；转录产物须与现产物同 EOL / 同尾换行
- **判据**：机器——gate / checkEnvironment 输出 `EnvironmentEOL` 等对应错误（exit 2，S1 §7 档位）；diffSet 对 CRLF 样本 FAIL
- **红绿证据**：红 = 污染样本被拦；绿 = 同格式 PASS
- **对应测试**：待 plan Task N
- **不覆盖**：checkEnvironment 全量行为（S1 / P1 V8 等价迁移）

### TC-028 巩固判据缺一 → 未巩固（6.3 缺一不可）

- **覆盖**：§4 步 9 / W2 巩固
- **前置**：替换完成、基线绿
- **步骤**：① 情形 a：gate 第 2 次漂移（篡改 `agents/senior-sdet.md` 一个字节）；② 情形 b：草稿箱未清（人工放一条 senior-sdet 草稿）；③ 情形 c：`rules/` 或 `skills/` 出现未预期改动；④ 情形 d：`npm run check` 有 findings；⑤ 各情形跑巩固判定
- **预期**：任一判据缺 → 未巩固；不得推进队列（巩固定义缺一不可，6.3）
- **判据**：机器——各情形巩固判定脚本输出 `consolidated: false`；仅全部满足时 `consolidated: true`（TC-013）
- **红绿证据**：红 = 缺一被判未巩固；绿 = 全满足才 consolidated
- **对应测试**：待 plan Task N（巩固判定脚本）
- **不覆盖**：队列推进顺序（PRD 6.1）；「git status 干净」对本席的口径（TC-012 已定义：agents 差异仅来源行 + rules/skills 零改动）

### TC-029 replace 缺 --yes → NotAuthorized（exit 4）

- **覆盖**：§4 步 7 / S1 §5.2 / S1 §7 exit 4
- **前置**：草稿在箱
- **步骤**：① 运行 `replace --kind agent --name senior-sdet --draft <草稿>`（无 `--yes`）
- **预期**：返回 `NotAuthorized`，退出码 4（S1 §7 新增档位：未授权）；`agents/senior-sdet.md` 不变；草稿保留
- **判据**：机器——退出码 4；错误码 `NotAuthorized`；`git status --short agents/` 无该文件行；`draft ls --name senior-sdet` 仍 1 条
- **红绿证据**：红 = 无 --yes 仍替换（静默替换违规）→ 文件被改；绿 = 拒 + exit 4
- **对应测试**：待 plan Task N
- **不覆盖**：有 --yes 的成功路径（TC-012）；草稿纪律全量（S1 W7，能力测试）

## 3 负例与边界

| 用例 ID | 边界/负例是什么 | 为什么容易漏 | 期望行为 |
|---|---|---|---|
| TC-014 | 转录润色/改写（同义改写「找出」→「发现」） | 「语义等价」最像「没改」，但零改写是逐字硬约束，不是语义等价 | 逐字节红（diffSet FAIL），Mismatch 族（exit 1） |
| TC-015 | 来源声明行未更新（旧行「改动直接改本文件」保留） | 只盯「别改多」，忽略「该改的没改」——该差异必须发生 | 红；来源行必须更新为生成声明 |
| TC-016 | 来源声明行差异溢出（正文另改一处 = 两行差异） | 差异集只数行数不核内容，误以为「两行都是来源行相关」 | 红；差异集必须 == {来源声明行} |
| TC-017 | 专属 description 拼装错（when 尾缀「时」+ 句式「时调用」叠字 / notWhen 换词） | S1 断言 8 对拼装错自洽（拼装输出与渲染同源），拦不住；§3 when 字面值 + R3 句式字面值恰好叠字 | 黄金比对（渲染 vs 现卡 description 原文）红 |
| TC-018 | notWhen.refs 悬空 | refs 是「未来调度消费」预留，填错不立即报错 | `TriggerConflict`（exit 1） |
| TC-019 | 词表断言误套转录字段 | 实现者图省事把词表作用域扩到全字段，忘了 R6 例外 | 豁免生效（不得假红）；句式校验仍强制 |
| TC-020 | 自评痕缺失（P2-遗-9） | 自评是注释不是代码，「没写也能跑」最省事 | 组件数据不合格（§6.4），验收打回 |
| TC-021 | identity 转录截断（第二段丢失） | §3 数据形状用「…」示意，施工者误以为只转录首句 | 逐字节红 |
| TC-022 | 模板缺节（缺「自由探索」/「边界」） | 只比「语义内容」不看节完整性；9 节骨架靠人记 | 逐字节红 / `MissingSlot`（exit 1） |
| TC-023 | 13 席模板误加 notWhen 槽位 | 渲染层 notWhen 缺省不渲染发现不了（静默死代码） | 模板层 grep 断言：13 席模板无槽位 |
| TC-024 | 比对排除逻辑按行号/「> 开头」过滤 | 按行号排除 = 正文行偏移后漏检；按前缀 = 误放行其它引用行 | 正文任何差异必红；排除只能按行内容匹配 |
| TC-025 | 替换前 gate 红（与目标无关漂移） | 只盯目标文件，忽略别处漂移 | 拒绝替换，草稿保留 |
| TC-026 | 步 4 修复 2 次仍不等 → 停损 | 想快点过，违规改现产物迁就模板 | 停损未迁、现产物不动（D6） |
| TC-027 | EOL / 尾换行 / BOM / 非法 UTF-8 | 人看 markdown 看不出行尾差异；「看着一样」不是逐字节 | `EnvironmentEOL` 等拦截（exit 2） |
| TC-028 | 巩固判据缺一（gate 漂移 / 草稿残留 / git 脏 / check 红） | 只验「文件被替换」不看巩固六要素 | 未巩固，不得推进队列 |
| TC-029 | replace 缺 --yes | 忘记显式授权位 | `NotAuthorized`（exit 4），文件不变 |

## 4 回归清单

| 如果改了 | 必须重跑 | 为什么 |
|---|---|---|
| `tools/docgen/components/agentData.mjs`（senior-sdet 条目） | TC-002、TC-003、TC-004、TC-007、TC-010、TC-014、TC-017、TC-018、TC-021 | 转录数据是全部比对的前提；改一条即牵动逐字节与 description 派生 |
| `tools/docgen/templates/agent-handwritten.md.tpl` | TC-006、TC-010、TC-014、TC-022、TC-024 | 模板决定渲染字节与 9 节骨架 |
| `tools/docgen/templates/agent.md.tpl`（13 席模板） | TC-023 | 硬约束 5：notWhen 槽位仅限手写卡模板 |
| `tools/docgen/components/validateAgentData.mjs` | TC-004、TC-007、TC-008、TC-017、TC-018、TC-019 | 守卫断言（notWhen refs / when 格式 / 派生断言）全在它身上 |
| `tools/docgen/components/patternRegistry.mjs`（outputKind 注册） | TC-007 | outputKind=`testcase` 是新枚举值，注册缺失 = 渲染缺块 |
| `tools/docgen/cli.mjs`（generate） | TC-009、TC-010、TC-027 | 内存渲染 + 比对 + checkEnvironment 入口 |
| `tools/docgen/cli.mjs`（replace） | TC-012、TC-025、TC-029 | replace 是九步闭环第 7 步，拒红过滤与授权位在它身上 |
| `tools/docgen/cli.mjs`（draft） | TC-011 | 草稿箱生命周期 |
| `agents/senior-sdet.md`（替换后） | TC-001（重锁基线）、TC-010、TC-012、TC-013、TC-028 | 现产物变更后基线与比对基准全要重对 |
| `scripts/check-all.mjs` / baseline agent 清单 | TC-008、TC-012、TC-013、TC-028 | gate 比对范围与断言入口 |
| `skills/parliament/scripts/gen-agents.mjs` | TC-013 | senior-sdet 本不在 ROLES，任何改动不得引入该席（R7） |
| 13 席任一 agentData 条目（键集变化） | TC-004、TC-018 | notWhen.refs ⊆ agentData 键集断言依赖全量键集 |

## 5 只手动验证

| 项 | 为什么机器验不了 | 谁验、看什么 |
|---|---|---|
| 转录后角色卡「读起来还是同一张 senior-sdet」的语义观感（spec §7 明示） | 机器只验字节，不验「语义无漂移」——身份、语气、三条铁律的约束力、边界权限是语义层 | 评审者 / spec 作者：通读转录后卡，确认与现卡读感一致（身份句、铁律措辞、输入四样、固定清单 9 条、输出格式、边界权限） |
| W2 转录零改写抽查（你是谁 / 三条铁律 / 固定清单 / 边界 四节） | spec W2 明示「人工抽查 + Buffer 比对」；Buffer 部分 TC-010 已兜底，人工部分确认语义无漂移 | 评审者：四节逐节对照现卡通读，记录抽查结论（无漂移 / 有疑问） |
| 来源声明行新措辞的语义 | spec 未锁定新行逐字措辞，只锁「生成声明 + 四步指示」；机器只能断语义，不能断「措辞读起来对」 | spec 作者 / 评审者：确认新行表达了「改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换」，且不再说「改动直接改本文件」 |
| 自评痕内容的真实性（P2-遗-9） | 存在性可机器查（TC-005），「是否真自评而非敷衍填词」需人看 | 评审者：看 `translation-self-check` 内容是否具体反映转录取舍（详细 / 逻辑化两维有实质描述，非「详细：是。逻辑化：是。」空话） |

## 6 不测（带理由）

| 不测什么 | 为什么 |
|---|---|
| 能力地基本身（CLI 六子命令 / 草稿箱生命周期 / 退出码五档全映射 / 拒红过滤实现 / W4–W9 终态验收） | S1 覆盖；本 spec 只引用 S1 的断言号与错误码档位（shared-退出码，P2-遗-6），不重复定义 |
| 13 席迁移（S2/S4） | 本 spec 只做 senior-sdet 一席；13 席键集仅作为 notWhen refs 断言的输入被引用（TC-004/018） |
| description 翻译闭环（完形填空） | PRD §1.1 作用域声明：P2 本体 = 数据搬家 / 零改写转录，不涉及 AI 翻译、不验收翻译闭环 |
| 词表对 13 席派生产出的约束 | S1 W4 生效面；本 spec 只断言 senior-sdet 转录字段豁免（TC-008/019），不测词表本身 |
| 能力完备（W6/W7 草稿纪律全量） | S1 序 4；本 spec 只覆盖本席闭环触达的 replace 失败路径（TC-025/029），草稿纪律全量属 S1 |
| gen-agents ROLES 递减 | senior-sdet 本就不在 ROLES（R7），本席无删除动作；只需断言 gen-agents 无该席（TC-013） |
| 逐字节比对「排除来源声明行」的底层实现细节 | 属 S1 gate 实现；本 spec 通过 TC-024 以黑盒方式约束其行为（按行内容匹配，不得按行号/前缀） |
| 跨组件引用 / 触发表热更新 / 多语言 | PRD §2 边界 |

## 7 缺口与判别力水位

| 缺口 | 漏检哪类反例 | 至少 1 个样例 | 语义由谁兜 |
|---|---|---|---|
| 来源声明行新文本的逐字措辞未锁定（spec 只给「生成声明 + 四步指示」语义） | 合法措辞被逐字断言判红的**假阳性**（测试设计自身判别力缺陷） | 新行写成「> 来源：docgen 生成。改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换。」——合理措辞，若测试逐字断言会假红 | TC-015/016 按语义断言（含生成声明 + 四步指示）；措辞确认 = spec 作者 / 评审（§5 项 3） |
| 自评痕真实性（存在可机器查、真实不可查） | 敷衍自评（占位式「详细：是。逻辑化：是。」） | 自评注释存在但无实质描述，两维全是「是」 | 人工抽查（§5 项 4）；机器只兜存在性（TC-005/020） |
| 空行/空白布局的字节级复现是否完整 | 模板漏复现连续空行、表格前后空行数不齐 → 逐字节红（机器会红，但**归因**靠人看 diff） | 现卡「你是谁」两段之间、fixedList 表格前后空行；模板只复现一个空行 → compare 在第二个空行处红 | 施工者对照现卡逐行核对；评审抽查 diff 归因 |
| fixedList 9 条存储形态未定义（数组元素 = 整行 markdown vs 单元格文本） | 模板重建表格时管道符/行结构漂移，字节可能「看着对」实则错位 | 现卡 fixedList 是 `\| # \| 必答 \|` 表头 + 9 行数据；若元素只存单元格文本，模板需重拼管道符 → 漂移 | 建议表 #4 提请 spec 明确元素粒度；评审核对渲染表格（TC-010 逐字节兜底） |
| when 提取边界（尾缀「时」）未决 | §3 when 字面值含尾缀「时」+ R3 句式 `{when}时调用` → 叠字「时时调用」，若实现照字面拼装则静默错 | when = 「……失败场景时」+ 句式「时调用」→ 「……失败场景时时调用」≠ 现卡 description | TC-017 黄金比对机器兜底；建议表 #1 提请裁决（P0） |
| 隔目录冷跑的复制完整性 | 副本缺文件/缺 .git 导致 gate 判据失真（假绿或假红） | 复制时漏掉 `tools/docgen/**` 或漏掉 `.git` → 副本 gate 结论不可信 | 施工者核对复制清单（排除 `.session/`、`node_modules/`，保留全部 git 跟踪文件）；评审抽查 |
| 「git status 干净」对本席的口径易被误读 | 把「干净」当「agents/ 无改动」——本席来源行更新后 agents/ 必有一行差异，字面照搬 S2 判据会假红 | 替换后 `git status --short agents/` 显示 `M`（来源行变更）——预期内，不是事故 | TC-012/013 已把判据改写成「agents 差异仅来源行 + rules/skills 零改动」；建议表 #2 提请 spec 修订措辞 |

## 8 给开发的建议

> 来源 = 实现观察（`agents/senior-sdet.md` 现卡、spec §2/§3/§5、S1 spec §4/§6/§7）。以下建议**不修改本 testcase 的任何用例**（铁律 2/3），仅指出实现层与 spec 自身最可能出事、但用例表未必能单独暴露的角落，供施工者与评审参考。

| # | 位置（文件:行 / spec 节号） | 风险或盲点 | 为什么会被忽略 | 具体改法 | 优先级 |
|---|---|---|---|---|---|
| 1 | spec §3 `when` 字段字面值 + §2 R3 句式 `{when}时调用` | **叠字矛盾**：§3 when 字面含尾缀「时」（`……失败场景时`），R3 句式再拼「时调用」→ 派生得「……失败场景**时时**调用」，与现卡 description 不逐字相等，W2 必红、可致停损 | 两处措辞各自读都成立（when 逐字提取 vs 句式固定），合起来才暴露；施工 AI 照字面拼装最省事 | 明确 when 提取边界二选一：① when 不含尾缀「时」+ 句式 `{when}时调用`；② when 含尾缀「时」+ 句式 `{when}调用`。裁决判据 = P2-2 原文「拼装结果逐字 == 现 description」；TC-017 黄金比对已兜底 | P0 |
| 2 | spec §5 W2 逐字节一致行 + §4 步 8 / §6 硬约束（「git status …干净」） | 本席替换后来源声明行必有一行差异，「git status --short agents/ 干净」按字面跑必「脏」——与 S2（试点席字节全等）含义不同，照搬 S2 判据 = 假红 | 「干净」在 S2 语境 = 字节全等；施工者与评审易把通用判据直接套到本席，忽略唯一差异条款的反向效应 | 判据改写为「`git diff agents/senior-sdet.md` 差异 == 仅来源声明行，`rules/ skills/` 零改动」；「干净」指提交后状态（提交由用户决定，与 git 写操作禁令衔接）；TC-012/013 已按此落地 | P0 |
| 3 | spec §2 R2 来源声明行 | 新行逐字措辞未锁定，只给语义；施工者可自由措辞 | 测试只能语义断言（§7 缺口 1），措辞漂移无人把关 | plan 里给建议文本：`> 来源：docgen 生成。本角色卡由 tools/docgen 生成（第二套模板 agent-handwritten.md.tpl）；改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换。`；措辞最终由 spec 作者确认 | P1 |
| 4 | spec §3 `fixedList: [/* 9 条，逐字 */]` | 存储形态未定义（数组元素 = 整行 markdown 行 vs 单元格文本）→ 模板重建表格易漂移；字节可能「看着对」实则错位 | 数据形状只写「9 条逐字」，没说元素粒度；施工者自由发挥 | 明确元素粒度：建议**整行逐字**（含表头 `\| # \| 必答 \|` 与管道符），模板直接拼接，不做单元格级解析；TC-002/010 兜底 | P1 |
| 5 | spec §3 模板 / 现卡「输出格式」节 | 「给开发的建议」代码块（反引号 + 管道符表格）若被槽位化，模板转义易丢反引号 → 逐字节红且难归因 | 反引号在 markdown 模板里最易被「顺手清理」 | 该节与「你是谁」「通用纪律」「边界」同处理：整块常量转录（同 identity），不做槽位化；模板里原样输出 | P2 |
| 6 | S1 §4.1 / §3 `when` 格式约束（断言 7） | senior-sdet 的 when 以「时」结尾但**不含**「时调用」子串，断言 7 放行——若施工者误以为「when 以时结尾必违规」而改写 when（如去掉尾「时」），会同时破坏 R3 逐字复现 | 断言 7 的约束词是「时调用」子串，不是「以时结尾」；两者区别不写出来就会被误读 | 在 validateAgentData 注释与 plan 里写明：断言 7 只禁「在…中担任 / 时调用」子串，不禁尾缀「时」；尾缀问题走建议 #1 的句式裁决 | P2 |
| 7 | W2 转录零改写抽查（你是谁 / 三条铁律 / 固定清单 / 边界） | spec 只列抽查节，未定义抽查记录格式与判据落点 | 人工抽查无记录 = 无法复核（判据要求证据可复算） | plan 里加「抽查记录表」（每节：逐字比对结论 + 语义无漂移结论 + 抽查人），送议会时随 W2 验收一并核对 | P2 |

---

**完成回报**：

- **用例总数**：29（TC-001 ~ TC-029，编号一经分配不改号；无作废）
- **正例数**：13（TC-001 ~ TC-013）
- **负例与边界数**：16（TC-014 ~ TC-029）
- **覆盖的 spec 验收项**：13/13
  - R 编号：R1（TC-006/TC-022）、R2（TC-002/TC-010/TC-014/TC-015/TC-016/TC-024）、R3（TC-003/TC-017）、R4（TC-004/TC-018/TC-023）、R5（TC-005/TC-020）、R6（TC-008/TC-019）、R7（TC-001/TC-009/TC-011/TC-012/TC-013/TC-026）全部覆盖
  - W2 锚点：逐字节一致（TC-010/TC-014/TC-021/TC-024/TC-027）、专属 description（TC-003/TC-017）、转录零改写抽查（TC-002/TC-010 + §5 人工项）、notWhen 引用合法（TC-004/TC-018）、巩固（TC-012/TC-013/TC-028）全部覆盖
  - §3 数据形状（TC-002/TC-003/TC-007）、§4 九步闭环（TC-001/002/009/010/011/012/013 正 + TC-014–TC-029 负逐步覆盖）、§6 硬约束 1–5（TC-002/010/014/015/016/024 → 1；TC-003/017 → 2；TC-004/018 → 3；TC-005/020 → 4；TC-023 → 5）
- **未覆盖项及理由**：无。能力地基本身（CLI / 草稿箱 / 退出码五档 / 拒红过滤实现 / W4–W9 终态）属 S1 范围，本 spec 以「引用 S1 错误码与断言号」方式覆盖（TC-017/018/019/025/027/029 均落到 S1 的错误码与退出码档位上）
- **发现的盲点数**：7 条（见 §8 给开发的建议；其中 3 条来自 spec 自身矛盾/含糊——叠字句式、git status 干净口径、when 断言 7 误读，4 条来自转录对象与实现观察）——包括：§3 when 尾缀「时」与 R3 句式叠字、本席替换后 git status 必有一行差异、来源声明行新措辞未锁定、fixedList 存储形态未定义、输出格式节代码块转义、when 断言 7 子串 vs 尾缀误读、W2 人工抽查无记录格式
