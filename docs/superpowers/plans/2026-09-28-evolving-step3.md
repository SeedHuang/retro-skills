# 第 3 步实施计划：KB 三区合一 + multi-lens 教训迁入（C3 + A2 + B1）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> 本计划按**内联执行**编写（迁移内容依赖执行者上下文中的原文；KB 无 git，小步内联改最稳）。

**Goal:** KB 建 `skills\` 区并迁入 11 条 multi-lens 教训 + L-RS-1，三区统一表结构与编号口径，技能引用与架构文档对账。

**Architecture:** 数据迁移按"权威到派生"顺序（原文存档 → ledger 行 → 存量改）保证 KB 无 git 下的中断可恢复；技能文本改动走 RED-GREEN（教训先进 KB 再动手）；最后文档对账 + 落地扫。

**Tech Stack:** 纯 Markdown 数据文件 + 两个技能文本文件；无代码改动。

**Spec:** `docs\superpowers\specs\2026-09-28-evolving-step3-design.md`

## Global Constraints

- **运行时目录只读**：`~\.trae-cn\*` 一律不改（含 multi-lens 的 `lessons.md`、`SKILL.md`）
- **KB 不建 git**；每次写 KB 前查 `D:\Seed\lessons\.migrating` 不存在
- 文件写入一律用 Write/Edit 工具；**禁止** PowerShell `Set-Content -Encoding UTF8`（BOM 规则）
- **commit 一律由用户执行**——本计划没有任何 git 写步骤
- 不跑 `npx skills add/update`；`aas` 零改动（收尾只读体检）
- 报告数字一律终态实测并附取数命令
- 收尾跑落地扫（rule-landing-sweep）
- 收尾提示用户：技能文本已改，开新对话亲验（V6 观察点）

---

### Task 1: KB skills 区建立 + multi-lens 11 条迁入（A2 主体）

**Files:**
- Create: `D:\Seed\lessons\skills\multi-lens-review\2026-09-28-migrated-lessons.md`
- Create: `D:\Seed\lessons\skills\multi-lens-review\ledger.md`
- Create: `D:\Seed\lessons\skills\evolving-skills\ledger.md`
- Create: `D:\Seed\lessons\skills\retro-institutionalize\ledger.md`（先空表，RED 行在 Task 3 写入）
- Create: `D:\Seed\lessons\universal\ledger.md`

**Interfaces:**
- Produces: 权威副本（存档）+ L-001–L-011 + L-RS-1；Task 2 的存量改、Task 3 的 RED 行都依赖本任务的编号与表头

- [ ] **Step 1: 前置检查**

Run: `Test-Path D:\Seed\lessons\.migrating`
Expected: `False`（存在则停手报告用户）

- [ ] **Step 2: 写原文存档（权威副本，一次写完）**

读运行时 `C:\Users\HuangChunhua\.trae-cn\skills\multi-lens-review\lessons.md` **全文逐字**复制，文件头插入以下说明块（其余原文一字不改）：

```markdown
# 评审复盘日志（Lessons）——迁移存档

> **本文件是权威副本**（2026-09-28 迁入 KB）。原件在 multi-lens-review 技能目录，
> 将于该技能收编（建源仓库 + aas 接管）时从运行时删除，届时以本文件为准。
> 迁移执行与逐条台账见同目录 `ledger.md`（L-001–L-011）。

---

```

（`---` 之后接原 lessons.md 从标题 `# 评审复盘日志（Lessons）` 起的全文。）

- [ ] **Step 3: 写 `skills\multi-lens-review\ledger.md`**

完整内容如下（11 行一次写齐；"问题/根因/修复"为原文压缩单行，完整细节以存档为准）：

```markdown
# multi-lens-review 教训账本

> 迁自 `~\.trae-cn\skills\multi-lens-review\lessons.md`（2026-09-28，收编推迟前迁移；运行时原文件保留待收编时删）。
> 原文权威副本：同目录 `2026-09-28-migrated-lessons.md`。维度为就近映射（原日志无维度字段）；
> open 条的"固化"是否已并入技能正文，留待收编删除原文件前逐条核对。

| ID | 日期 | 归属 | 来源 | 问题 | 根因 | 维度 | 修复 | 对象 | 载体 | 状态 |
|---|---|---|---|---|---|---|---|---|---|---|
| L-001 | 2026-09-25 | multi-lens-review | 迁移(评审复盘日志) | 手动改 `link:` 后跑 lpm link，original 被记为 link 路径，unlink"恢复"出另一个 link，用户误以为已切回远端 | 知识缺失 + 同族未扫（没把"用户绕过工具的手动操作"当序列输入） | 健壮度 | 手法 1 加"接管时刻"条目；开发必问第 2 条 | skill | 未定 | open |
| L-002 | 2026-09-25 | multi-lens-review | 迁移(评审复盘日志) | `lstat().isSymbolicLink()` 对 junction 返回 false（pnpm Windows 无特权回退建 junction），三方核对全盘误报"非软链" | 知识缺失（手法 5 只扫 PRD 写出的假设，未下潜到机制断言的平台真伪） | 健壮度 | 手法 5 加"平台机制断言"扫描；开发必问第 1 条 | skill | 未定 | open |
| L-003 | 2026-09-25 | multi-lens-review | 迁移(评审复盘日志) | 新 lib 未 publish 时 `pnpm add` 失败而 lpm 不代写依赖——首次接入无路可走 | 假设未显式化（"不代写新依赖"隐含"所有 lib 都发布过"） | 用户体验 | 手法 5 加"决策背后的隐含假设"扫描；产品必问第 1 条 | skill | 未定 | open |
| L-004 | 2026-09-25 | multi-lens-review | 迁移(评审复盘日志) | 直通模式仍在执行中途停下询问，与交互模式（预览阶段询问）不一致 | 知识缺失（手法 6 只覆盖确认策略，没覆盖打断时机） | 用户体验 | 交互必问第 1 条 | skill | 未定 | open |
| L-005 | 2026-09-25 | multi-lens-review | 迁移(评审复盘日志) | 崩溃测试默认"install 中途 kill 进程"，不可重复、不稳定 | 知识缺失（走查了行为，没走查行为的可测性） | 健壮度 | 测试必问第 3 条 | skill | 未定 | open |
| L-006 | 2026-09-25 | multi-lens-review | 迁移(评审复盘日志) | 给 S11 加 S9 依赖后，执行顺序"S9/S10/S11 可并行"没同步修改 | 修复引入（修复 diff 没有自审交叉引用点） | 健壮度 | 修复纪律加"修复 diff 自审"；收敛协议定为连续 2 轮 | skill | 未定 | open |
| L-007 | 2026-09-25 | multi-lens-review | 迁移(评审复盘日志) | 四角色评审裁决的 5 个 P2 处置结果只存在于对话中，产出物无留痕——建议流失、存在重复讨论风险 | 流程缺失（"P2 只记录不阻塞"没定义记录到哪、如何处置，"记录"被执行成"口头裁决"） | 用户体验 | SKILL.md 输出格式加"P2 处置协议"（三态处置 + 落点）；产出物以 Backlog 章节承载 | skill | 未定 | open |
| L-008 | 2026-09-25 | multi-lens-review | 迁移(评审复盘日志) | SP0 用"渲染正常 + hooks 不炸 + console 无报错"判"无双实例"，实际是 antd 双实例（context 级静默失败）；chunk 名与结论矛盾未深挖 | 知识缺失 + 证据矛盾未追（判定方法只覆盖爆炸式失败，未覆盖静默式） | 健壮度 | 验证"X 不存在"前列全 X 的失败模式逐个取证；产物与结论矛盾是复检信号；已修 lpm S13 终版 | skill | skill | landed(→multi-lens 技能正文) |
| L-009 | 2026-09-25 | multi-lens-review | 迁移(评审复盘日志) | PRD §14 承接列引用评审编号（B1-B8/O1-O5/P1-P2）但全文无定义，读者搜"B6"一无所获 | 知识缺失（默认"自己记得编号"，忽略无对话记忆的读者；一致性检查缺"引用×定义"对） | 用户体验 | 评审编号入产出物须就地标注或附对照表；手法 3 增"引用×定义"检查；已在 lpm PRD 附录 A 落地 | skill | skill | landed(→multi-lens 技能正文) |
| L-010 | 2026-09-26 | multi-lens-review | 迁移(评审复盘日志) | better-sqlite3 被 electron-rebuild 改写为 Electron ABI 后，dev 态 tsx server（Node ABI）加载报 NODE_MODULE_VERSION；spec 的 D2（rebuild 验证）与 D5（dev 态独立跑 server）经 ABI 机制互相矛盾 | 知识缺失（"选型库已知坑"只查了 rebuild 用法，没查"同一依赖被多个运行时消费"；手法 5 未推演多运行时消费矩阵） | 健壮度 | 开发必问 6 增"运行时×产物矩阵"子项；发现互斥时决策点前移到最早任务 | skill | skill | landed(→multi-lens 技能正文) |
| L-011 | 2026-09-26 | multi-lens-review | 迁移(评审复盘日志) | CORS 白名单放行 `Origin: null` 不可区分 file:// 与 sandboxed iframe/data:/blob:——恶意网页沙箱 iframe 仍可跨站 `PUT /api/settings` 改写 `bin_ffmpeg` 致 RCE | 知识缺失（角色面板缺"安全边界有效性"透镜：判据能否被攻击者伪造） | 健壮度 | 手法 5 平台机制断言增补"信任判据抗伪造性"（Origin/Referer/UA/端口作判据须问能否伪造；能则升级为不可伪造凭证：随机 token/自定义头）；开发必问新增"安全边界抗伪造性" | skill | 未定 | open |
```

- [ ] **Step 4: 写 `skills\evolving-skills\ledger.md`**

```markdown
# evolving-skills 教训账本

| ID | 日期 | 归属 | 来源 | 问题 | 根因 | 维度 | 修复 | 对象 | 载体 | 状态 |
|---|---|---|---|---|---|---|---|---|---|---|
| L-RS-1 | 2026-09-28 | evolving-skills | 复盘 | institutionalize 决策树的修订分支（Step 1a/1b）与落 skill（Step 3）没有任何转发指令，agent 会就地按旧手法改载体——无攒批、无体积守卫、无独立合并，且修订手法即将搬空 | 流程缺失（修订与新增的归属未分开定义） | 健壮度 | 建 evolving-skills（协议+三卡）+ institutionalize 瘦身加闸门 | skill | skill | landed(→skill) |

> L-RS-1 迁自 `projects\retro-skills\ledger.md`（2026-09-28 随三区合一；原位留 moved 注记）。
> 归属列按 skills 区语义填技能名（原值 retro-skills 为项目名），其余列照抄原行。
```

- [ ] **Step 5: 写 `skills\retro-institutionalize\ledger.md`（空表）**

```markdown
# retro-institutionalize 教训账本

| ID | 日期 | 归属 | 来源 | 问题 | 根因 | 维度 | 修复 | 对象 | 载体 | 状态 |
|---|---|---|---|---|---|---|---|---|---|---|
```

- [ ] **Step 6: 写 `universal\ledger.md`（空表）**

```markdown
# 通用教训账本（universal）

> 跨项目通用经验落此区。三区同表同编号，规则见 `index.md`「维护约定」。

| ID | 日期 | 归属 | 来源 | 问题 | 根因 | 维度 | 修复 | 对象 | 载体 | 状态 |
|---|---|---|---|---|---|---|---|---|---|---|
```

- [ ] **Step 7: 验证**

Run: `Get-ChildItem D:\Seed\lessons\skills -Recurse -Filter *.md | Select-String -SimpleMatch '| L-0' | Measure-Object | Select-Object -ExpandProperty Count`
Expected: `11`（L-001–L-011）
Run: `Select-String -SimpleMatch 'L-RS-1' D:\Seed\lessons\skills\evolving-skills\ledger.md | Measure-Object`
Expected: 命中 ≥ 1

---

### Task 2: 存量账本统一（B1 表头 + 对象值 + L-RS-1 原位注记）

**Files:**
- Modify: `D:\Seed\lessons\projects\local-pack-manager\ledger.md`
- Modify: `D:\Seed\lessons\projects\retro-skills\ledger.md`

**Interfaces:**
- Consumes: Task 1 的表头与编号约定
- Produces: 三区同表头；L-RS-1 原位 moved 注记

- [ ] **Step 1: 前置检查**（同 Task 1 Step 1）

- [ ] **Step 2: lpm ledger 表头与 8 行**

表头两行改为（插入"对象"列于"载体"前；"项目"更名"归属"）：

```
| ID | 日期 | 归属 | 来源 | 问题 | 根因 | 维度 | 修复 | 对象 | 载体 | 状态 |
```

8 行各自在"载体"列前插入对象值（按行内载体取）：

| 行 | 载体（原） | 插入对象值 |
|---|---|---|
| L-2026-09-27-001 | rule(项目) | rule |
| -002 | 未定 | 未定 |
| -003 | 未定 | 未定 |
| -004 | 未定 | 未定 |
| -005 | 未定 | 未定 |
| -006 | rule(全局) | rule |
| -007 | rule(项目) | rule |
| -008 | 未定 | 未定 |

其余单元格一字不改。

- [ ] **Step 3: retro-skills ledger**

表头同 Step 2 改法。L-RS-1 行：插入对象值 `skill`；状态列 `landed(→skill)` 改为 `moved(→skills\evolving-skills)`；其余列一字不改。

- [ ] **Step 4: 验证**

Run: `Get-ChildItem D:\Seed\lessons -Recurse -Filter ledger.md | Select-String -SimpleMatch '| ID | 日期 | 归属 |'`
Expected: 6 个文件命中（projects 两个 + skills 三个 + universal 一个）

---

### Task 3: 技能引用对齐（RED-GREEN，改源仓库）

**Files:**
- Modify: `D:\Seed\retro-skills\skills\evolving-skills\references\protocol.md`（步 3 节）
- Modify: `D:\Seed\retro-skills\skills\retro-institutionalize\SKILL.md`（两处）

**Interfaces:**
- Consumes: Task 1 建好的两个 skills ledger（RED 行落点）
- Produces: 技能文本与 KB 三区结构一致；L-012/L-013 置 landed

- [ ] **Step 1: RED 行先进账**（教训先行，再动手）

`skills\evolving-skills\ledger.md` 追加：

```
| L-012 | 2026-09-28 | evolving-skills | 复盘 | protocol 步 3 的落点写死过渡态"projects\<触发项目>\ledger.md；skills 区建成后迁入"——skills 区已建成，技能教训按旧文本落错区，三区巡检扫不到 | 流程缺失（KB 结构演进，技能引用未跟） | 健壮度 | 步 3 改三区落点表述：项目教训→projects、技能教训→skills、跨项目→universal | skill | skill | open |
```

`skills\retro-institutionalize\ledger.md` 追加：

```
| L-013 | 2026-09-28 | retro-institutionalize | 复盘 | "查五处"与「写入顺序」只写"错题集 KB"，未指明区与表——KB 现有三区，写入落点随机 | 流程缺失（KB 结构演进，技能引用未跟） | 健壮度 | 查五处补"三区 projects/skills/universal 同表"；写入顺序指明 rule/memory/automation 落 projects 或 universal | skill | skill | open |
```

- [ ] **Step 2: 改 protocol.md 步 3**

old_str：

```
- 教训**先进 KB ledger**（状态 open）——账先行，动手在后
- 同类教训（同载体、同归因）攒一起改；动手时机由用户裁决（现在 / 阶段收口）
- **本期落点**：`projects\<触发项目>\ledger.md`；KB 的 skills\ 区建成后迁入
```

new_str：

```
- 教训**先进 KB ledger**（状态 open）——账先行，动手在后
- 同类教训（同载体、同归因）攒一起改；动手时机由用户裁决（现在 / 阶段收口）
- **落点（三区同表同编号，规则见 KB `index.md` 维护约定）**：
  - 项目教训 → `projects\<项目>\ledger.md`
  - 技能教训 → `skills\<技能名>\ledger.md`
  - 跨项目通用 → `universal\ledger.md`
```

- [ ] **Step 3: 改 retro-institutionalize SKILL.md（两处，同一文件一次编辑会话内逐个改）**

处 1（Step 1 决策树内，行 26）old_str：

```
        （查五处：user_rules/ + <项目>/.trae/rules/ + memory/*.md + 错题集 KB + 既有 skills）
```

new_str：

```
        （查五处：user_rules/ + <项目>/.trae/rules/ + memory/*.md + 错题集 KB（三区 projects/skills/universal 同表）+ 既有 skills）
```

处 2（「防重复检查」节，行 106）old_str：

```
查五处既有承载（`user_rules/` / `<项目>/.trae/rules/` / `memory/*.md` / 错题集 KB / 既有 skills），有同义规则 → **改既有，不新增**。
```

new_str：

```
查五处既有承载（`user_rules/` / `<项目>/.trae/rules/` / `memory/*.md` / 错题集 KB（三区 projects/skills/universal 同表） / 既有 skills），有同义规则 → **改既有，不新增**。
```

处 3（「写入顺序」节，行 74）old_str：

```
① 先在 ledger 确保该条目的存在且为 open（含拟载体与拟落点）
```

new_str：

```
① 先在 ledger 确保该条目的存在且为 open（含拟载体与拟落点；rule/memory/automation 教训落 `projects\<项目>\` 或 `universal\`，技能教训由 evolving-skills 落 `skills\<技能名>\`）
```

- [ ] **Step 4: GREEN 验证后销账**

验证：① 改后的 protocol.md 步 3 不再含"本期落点"字样：`Select-String -SimpleMatch '本期落点' D:\Seed\retro-skills\skills\evolving-skills\references\protocol.md` → 无命中；② institutionalize SKILL.md 三处均含"三区"或三区落点：`Select-String -SimpleMatch '三区' <SKILL.md>` → ≥ 3 命中；③ `aas` 体检仍"全部一致"（junction 形态不受影响）。
验证过后把 L-012、L-013 状态 `open` 改为 `landed(→skill)`。

---

### Task 4: KB index.md 更新（三区说明 + 编号规则 + 计数器 + moved 约定）

**Files:**
- Modify: `D:\Seed\lessons\index.md`

- [ ] **Step 1: 前置检查**（同 Task 1 Step 1）

- [ ] **Step 2: 「## 项目」节后插入「## 技能」「## 通用」两节**

```markdown
## 技能

各技能的教训账本见 `skills/<技能名>/`：

- `skills/multi-lens-review/` —— ledger.md（L-001–L-011，迁自技能目录 lessons.md）｜`2026-09-28-migrated-lessons.md`（原文权威存档）
- `skills/evolving-skills/` —— ledger.md（L-RS-1 迁自 projects/retro-skills；L-012）
- `skills/retro-institutionalize/` —— ledger.md（L-013）

## 通用

跨项目通用经验落 `universal/ledger.md`（暂空，首条跨项目教训落入时启用）。
```

- [ ] **Step 3: 「维护约定」节追加三行**

```markdown
- 三区（projects / skills / universal）同表同列，表头：`ID | 日期 | 归属 | 来源 | 问题 | 根因 | 维度 | 修复 | 对象 | 载体 | 状态`；"对象"列 = 教训落在哪类载体（rule / skill / automation / memory），值跟随行内载体列（未定 → 未定）。
- 全库统一编号 `L-NNN`（连续三位）。**编号计数器：当前已用至 L-013**。取数方法：全库 ledger 表行 grep `| L-0` 与 `L-RS-` 取最大 N + 1；既有编号（`L-2026-09-27-*`、`L-RS-1`）不追溯改名。
- 迁移状态 `moved(→<新位置>)`：条目迁走后原位留注记防断链（"只增不删"约定的迁移补丁）。
```

（计数器值以终态实测为准：写此行前先跑取数命令确认最大 N = 13，不一致则以实测为准。）

---

### Task 5: architecture.md 对账（声明面）

**Files:**
- Modify: `D:\Seed\retro-skills\docs\architecture.md`

逐处 old → new（六处）：

1. §3 L1 行：
   old: `    ├── skills\<技能名>\      技能教训（【缺】待建）`
   new: `    ├── skills\<技能名>\      技能教训（✅ 已建成 2026-09-28；multi-lens 收编推迟，用户单独处理）`
2. §6 A2 行尾 `（挂账，随首次进化一起做）` → `（✅ 已迁 2026-09-28；运行时原文件待收编时删）`
3. §6 B1 行尾追加 `（✅ 表口径已统一 2026-09-28；巡检命令属 KB 候选 C2，信号未到）`
4. §6 C3 行 `B1 的落地（【缺】待建）` → `B1 的落地（✅ 已建成 2026-09-28）`
5. §7 行：`| multi-lens / prd-to-specs 的收纳仓库 | ⏸ 挂账 | 待"首次要进化它们时"再定 |` → `| multi-lens / prd-to-specs 的收纳仓库 | ⏸ 挂账 | multi-lens 收编 2026-09-28 推迟（用户单独处理）；prd-to-specs 待首次要进化时再定 |`
6. §8 行 `   3. C3 + A2 + B1（KB skills 区 + multi-lens 迁移 + 三区合一）` → `✅ 3. C3 + A2 + B1（KB skills 区 + multi-lens 迁移 + 三区合一）→ 已完成（2026-09-28，spec：docs\superpowers\specs\2026-09-28-evolving-step3-design.md）；其中收编 multi-lens（H1 解禁/D4 兑现 + SKILL.md 替换）推迟，用户单独处理`
7. §10 H1 行状态列 → `挂账：收编（multi-lens 2026-09-28 推迟，用户单独处理；prd-to-specs 随首次要进化时）`
8. §10 H2 行状态列 → `半解决：11 条已迁 KB（2026-09-28）；运行时原文件待收编时删`

（共八处；历史 spec 不回溯。）

---

### Task 6: 终验证 + 落地扫 + 收尾

- [ ] **Step 1: spec §8 六条验证全跑**（表头一致 / L-001–L-011 齐 / L-RS-1 注记 / 计数器=实测最大 N / `aas` 体检"全部一致" / 落地扫）
- [ ] **Step 2: 落地扫**

Run: `Get-ChildItem D:\Seed\retro-skills,D:\Seed\lessons -Recurse -File -Include *.md | Select-String -Pattern '本期落点|待建|L-001|lessons\.md'`
命中处逐条对照现状：过时描述改掉，历史记录（如交接词、旧 spec、存档头部）标注保留。architecture §3 L4 的"【缺】闸门"（第三方技能教训降级）是**真实未做项**，保留。

- [ ] **Step 3: 报告收尾**

向用户报告：完成项清单（带终态数字与取数命令）+ 提示"技能文本已改，开新对话亲验（V6）" + 提请 commit（用户执行）。
