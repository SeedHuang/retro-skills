# 第 3 步设计：KB 三区合一 + multi-lens 教训迁入（C3 + A2 + B1；收编移出）

> 上游：`docs\handoffs\2026-09-28-evolving-step3-c3-a2-b1.md`（交接词）+ `docs\architecture.md` §8 第 3 步
> 本 session 用户裁决（2026-09-28，brainstorming 收敛）：**multi-lens 收编整体移出本次**，用户后续单独处理；本 spec 只覆盖 C3 + A2 + B1 及随之的引用对齐与文档对账。

## 1. 背景与目标

architecture §8 第 3 步原含四项：C3（KB 建 `skills\` 区）、A2（multi-lens 11 条 lessons 迁 KB）、B1（三区合一）、收编 multi-lens（反向建仓 + `aas` 接管 + SKILL.md 转发替换）。第 4 项经用户裁决移出，本 spec 覆盖其余三项。

完成判据：

1. KB 有 `skills\` 区；11 条 multi-lens 教训与 L-RS-1 各就各位
2. projects / skills / universal 三区同表结构、统一编号口径
3. 引用 KB 结构的技能文本（evolving-skills protocol 步 3、retro-institutionalize 查五处/写入顺序）与新结构一致
4. architecture.md 与 KB index.md 的声明面与实际一致（收尾落地扫零过时声明）

## 2. 用户裁决记录（2026-09-28）

| # | 问题 | 裁决 |
|---|---|---|
| 1 | multi-lens 源仓库归属 | **移出本次**，用户单独处理（建仓 / aas / SKILL.md 替换 / 运行时 lessons.md 删除均随之推迟） |
| 2 | KB 编号方案 | 全库统一 L- 编号；已有编号（`L-2026-09-27-*`、`L-RS-1`）不追溯改名 |
| 3 | 运行时 `lessons.md` 处置 | 不动（符合"运行时只读"公理；删除归收编时一并做） |
| 4 | 11 条迁移取舍 | 全迁：已合并 3 条记 landed，未合并 8 条记 open |
| 5 | 操作顺序 | lessons 迁移提前（在引用对齐与文档对账之前） |

## 3. KB 目标结构（B1）

```
D:\Seed\lessons\
├── index.md                                改：增 skills/universal 区说明 + 编号规则与计数器 + moved 状态约定
├── projects\<项目>\ledger.md               表头统一（除 L-RS-1 状态改 moved 外，既有 9 条行内容不动，仅补"对象"值）
├── skills\multi-lens-review\ledger.md      新建：L-001–L-011 + 原文存档
├── skills\evolving-skills\ledger.md        新建：L-RS-1 迁入 + 本次 RED 行
├── skills\retro-institutionalize\ledger.md 新建：本次 RED 行
└── universal\ledger.md                     新建：空表（目录现不存在；建齐后 architecture §3 L1 "已建成"声明成真）
```

### 3.1 统一表头（三区一致，11 列）

```
| ID | 日期 | 归属 | 来源 | 问题 | 根因 | 维度 | 修复 | 对象 | 载体 | 状态 |
```

- 原"项目"列更名"归属"：projects 区填项目名，skills 区填技能名，universal 填"通用"
- 新增"**对象**"列 = 教训落在哪类载体：rule / skill / automation / memory
- 既有 9 条（lpm 8 + retro-skills 1）只补对象值，行内容不动（L-RS-1 仅状态改 moved，见 §4.2）；对象值按行内载体列取（载体=`未定` → 对象=`未定`）

### 3.2 编号规则

- 全库统一 `L-NNN`（连续三位，自 L-001 起）；与既有 `L-2026-09-27-*` / `L-RS-1` 无碰撞
- 计数器写 index.md「维护约定」节：`当前已用至 L-0XX`，附取数方法（全库 grep ledger 表行取最大 N+1）防漂移
- 迁移发放：11 条 = L-001–L-011（按原 lessons.md 的 L1→L11 顺序）；本次两条 RED 行接着从 L-012 发
- L-RS-1 迁移**不改编号**（编号全库唯一、与区无关）

### 3.3 状态流转约定（写入 index.md）

- `moved(→<新位置>)`：条目迁移后原位注记，防断链——作为"只增不删"约定的迁移补丁

## 4. 迁移明细（A2，提前执行）

### 4.1 multi-lens 11 条 → `skills\multi-lens-review\`

**ledger.md 行**：

| 原条目 | 新 ID | 日期 | 维度 | 状态 |
|---|---|---|---|---|
| L1 | L-001 | 2026-09-25 | 健壮度 | open |
| L2 | L-002 | 2026-09-25 | 健壮度 | open |
| L3 | L-003 | 2026-09-25 | 用户体验 | open |
| L4 | L-004 | 2026-09-25 | 用户体验 | open |
| L5 | L-005 | 2026-09-25 | 健壮度 | open |
| L6 | L-006 | 2026-09-25 | 健壮度 | open |
| L7 | L-007 | 2026-09-25 | 用户体验 | open |
| L8 | L-008 | 2026-09-25 | 健壮度 | landed(→multi-lens 技能正文) |
| L9 | L-009 | 2026-09-25 | 用户体验 | landed(→multi-lens 技能正文) |
| L10 | L-010 | 2026-09-26 | 健壮度 | landed(→multi-lens 技能正文) |
| L11 | L-011 | 2026-09-26 | 健壮度 | open |

- 各列填法：归属=multi-lens-review；对象=skill；来源=迁移(评审复盘日志)；根因=原文"为什么当初没想到"的归因（保留原文措辞，如"知识缺失 + 同族未扫"）；问题/修复=原文"发现/固化"压缩为单行
- **原文逐字存档** `skills\multi-lens-review\2026-09-28-migrated-lessons.md`：头部加迁移说明，正文 = 原 lessons.md 全文。理由：运行时 lessons.md 将在（推迟的）收编时删除，届时此存档是唯一权威副本，单行 ledger 装不下 11 条的完整细节
- ledger 表尾 provenance 注记：迁自 `~\.trae-cn\skills\multi-lens-review\lessons.md`（2026-09-28 收编推迟前迁移；运行时原文件保留待收编时删）

### 4.2 L-RS-1 → `skills\evolving-skills\ledger.md`

- 行内容照抄，补 对象=skill，加 provenance 注记"迁自 projects\retro-skills\ledger.md（2026-09-28 随三区合一）"
- 原位（`projects\retro-skills\ledger.md`）该行状态改 `moved(→skills\evolving-skills)`，其余列不动

### 4.3 中断恢复（KB 无 git，必须自兜底）

KB 不建 git，中断 = 半迁移态。实施顺序定为**由权威到派生**：

1. **先写原文存档**（`2026-09-28-migrated-lessons.md`，权威副本，一次写完）
2. 再写 ledger 行（从存档派生，可重放）
3. 最后做存量改（表头统一 / L-RS-1 注记 / index.md）

任一步中断：**重跑前先对账**（grep 三区行数与编号，对照存档数出缺口），按存档补齐后继续。KB 每次写前查 `.migrating` 锁（既有纪律）；全部 KB 改动靠"存档 + 小步编辑"兜底可逆，不依赖 git。

## 5. 引用对齐（技能改动，RED-GREEN，改源仓库）

| 文件 | 改什么 | RED（现状拦不住的场景） |
|---|---|---|
| evolving-skills `references\protocol.md` 步 3 | 删"本期落点 projects\…"过渡语 → 三区落点表述（项目教训→projects；技能教训→skills；跨项目→universal；三区同表同编号，见 KB index.md） | agent 拿到技能教训，按旧文本写进 `projects\<触发项目>\`——skills 区已建成但协议不认识，教训落错区，三区巡检扫不到 |
| retro-institutionalize `SKILL.md` | ① "查五处"的"错题集 KB"补一句三区同表说明 ② 「写入顺序」指明 rule/memory/automation 教训落 projects 或 universal | 写入时只知"错题集 KB"四字，不知进哪个区哪张表 → 落点随机 |

- RED 证据各记一条 KB 行（教训先进账再动手）：evolving-skills 行进 `skills\evolving-skills\ledger.md`（L-012）、institutionalize 行进 `skills\retro-institutionalize\ledger.md`（L-013，目录随之新建）；改完验证过置 `landed(→skill)`
- 改动在 `retro-skills\skills\...` 源仓库进行，junction 即时生效；收尾照例提示开新对话（V6 顺带观察：本次改了技能文本，新对话可亲验）

## 6. 文档对账（声明面落地扫对象）

| 文件 | 位置 | 改成 |
|---|---|---|
| architecture.md | §3 L1 skills 行 | 【缺】待建 → ✅ 已建成 2026-09-28（注"multi-lens 收编推迟"） |
| architecture.md | §6 A2 / B1 / C3 三行 | 置 ✅（A2 注"运行时原文件待收编时删"；B1 注"巡检命令属 KB 候选 C2，信号未到，本次只统一表口径"） |
| architecture.md | §7 multi-lens 收纳仓库行 | 注"multi-lens 收编 2026-09-28 推迟，用户单独处理；prd-to-specs 仍挂账" |
| architecture.md | §8 第 3 步行 | 拆分标注：C3+A2+B1 ✅；收编两项（H1 解禁 / D4 兑现 + SKILL.md 替换）推迟，用户单独处理 |
| architecture.md | §10 H1 / H2 | H1 注推迟；H2 改"11 条已迁 KB（2026-09-28）；运行时原文件待收编时删" |
| KB index.md | 区域说明 / 维护约定 | 增 skills、universal 两区；增编号规则与计数器；增 moved 状态约定 |

历史 spec（`2026-09-28-evolving-skills-design.md`）**不回溯**——其 §4.3 "C3 建成后随 A2/B1 迁移"承诺由本 spec 兑现，原文保留。

## 7. 明确不做（本次边界）

- multi-lens 源仓库收编全套（建仓 / `aas` linkTarget / `sync --replace` / 体检转正）
- multi-lens SKILL.md「复盘回流（评审飞轮）」节替换为转发
- 运行时 `lessons.md` 删除（H2 只完成 KB 侧一半，剩余归收编）
- prd-to-specs 收编、KB 备份（H3）、KB 并发写保护（H4）维持挂账
- `aas` 零改动（69/69 测试与体检"全部一致"基线不触碰）

## 8. 验证（终态实测，附取数方法）

1. 三区表头一致：grep `| ID | 日期 | 归属`（固定字符串匹配，PowerShell 用 `-SimpleMatch`）于三区 ledger 全命中
2. 迁移完整：`skills\multi-lens-review\ledger.md` 含 L-001–L-011 共 11 行；`skills\evolving-skills\ledger.md` 含 L-RS-1；原文存档 11 条逐条与 ledger 行对应
3. L-RS-1 原位注记：`projects\retro-skills\ledger.md` 该行状态列 = `moved(→skills\evolving-skills)`
4. 编号计数器自洽：index.md 计数器值 = 全库 grep ledger 表行最大 N
5. `aas` 体检仍"全部一致"（本任务不改 aas 管理面；技能文本改动经 junction 生效，不影响链接形态）
6. 收尾落地扫：按 `rule-landing-sweep.md` 的扫描命令，关键词「skills 区 / 对象列 / L-001 / 本期落点 / 待建」全库扫，命中处逐条对照现状改掉
