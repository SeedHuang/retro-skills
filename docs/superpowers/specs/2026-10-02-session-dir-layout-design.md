# session 标识自足化 + KB 落点改「一 session 一目录」

> 来源：2026-10-02 设计对话（起因：用户执行 `retro-collect` 时发现 session 身份拿不到、同一天多 session 会互相覆盖）
> 上游：本 spec 是 `2026-10-01-retro-self-improvement-design.md` 的**修订增量**——覆盖其 §4.1 存储落点、§4.3 三钥匙、§4.6 格式、§5 文件结构；其余各节不变。
> 用户裁决（2026-10-02）：
> 1. session 标识用**本 session 首句的 hash（固定 8 位）**——自足、确定、重跑不变；
> 2. 落点用**目录**承载公共前缀，不用长文件名；
> 3. 摘要进目录名，但**永不改名**（只作可读性装饰，不承担标识职责）；
> 4. 旧产物**祖父不改**（除本仓库 3 个文件需迁移）。

## 1 范围

**做**：

1. **session 标识自足化**：`sid` = 首句逐字原文 → `sha256` 前 8 位。不再依赖 `~\.trae-cn\memory\**\session_memory_*.jsonl`。
2. **KB 落点改目录制**：`projects/<项目标识>/<YYYY-MM-DD>-<sid>-<摘要≤20字>/`，内含 `facts.md` / `userwords.md` / `moments.md`（analyze 后加 `retro.md`）。
3. **moment id 改形**：`M-<日期>-<N>` → `M-<sid>-<N>`。
4. **userwords 块键退场**：`S-<session_id>` 取消（文件即本 session，身份由目录表达）；**moments 的 `session` 字段保留、值改 `sid`**——理由见 §6.2（自描述锚点 vs 纯结构键）。
5. **脚本改造**：`lessons.mjs` 的定位 / 扫描 / 覆盖 / 新建。
6. **迁移**：`projects/retro-skills/` 下 3 个文件移入 session 目录；`index.md` 记一笔。

**不做**（YAGNI）：

- 不动 `ledger.md` / `effectiveness.md` / `rules-history/` 的位置；
- **不升 `schemaVersion`**（`checkStore` 只做等值校验、无按版本分支；升了会让现有库直接报「不受支持」）；
- **不重写历史产物里的旧 id / 旧路径**（`M-2026-09-30-1`、`s01`、`6abcf3ed…` 原样保留）；
- 不改历史文档（`docs/handoffs/*`、`2026-09-27` 的 spec/plan）——按既有规矩属历史记录；
- 不做"库内重排"工具（只 3 个文件，上锁手搬即可）。

## 2 session 标识（`sid`）

### 2.1 算法

| 项 | 取值 |
|---|---|
| **输入** | **本 session 用户发的第一条消息的逐字原文**（不截断、不改写） |
| **归一化** | `trim` → 连续空白（含换行）折成单个空格 → UTF-8 取字节 |
| **算法** | `sha256(utf8).slice(0, 8)`，**小写 hex** |
| **输出** | 8 位（32 bit） |

**实测例**（本次设计对话）：

```
首句：我发现一个问题，retro-skills不负责rule的同步和管理吗？
sid = 51e11408
```

复算命令（PowerShell，已实测）：

```powershell
$s = '我发现一个问题，retro-skills不负责rule的同步和管理吗？'
$h = [BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($s))).Replace('-','').ToLower()
$h.Substring(0,8)
```

Node 侧同算法（`crypto.createHash('sha256')`），两者必须同值——这也是验收项之一。

### 2.2 三条硬规则

1. **输入必须是逐字原文**——不得用摘要 / 概括 / 转述的措辞（换个说法就换 hash，标识就废了）。
   **拿不到逐字原文时（对话已被压缩 / 截断）→ 不许硬算 `sid`**：那算出来的是"摘要的 hash"，会漂。改为**从已有 session 目录名里读出 `sid`**（目录名 `<日期>-<sid>[-<摘要>]` 的第二段）；连目录都没有 → 问用户。
   > 注意：`findSessionDir` 里「`sid` 缺失 → 同日唯一目录兜底」那一支，在 CLI 路径下**不可达**（`validateMoment` / `momentDrop` 都强制 `--session`）——它只为**直调 / 防御**保留，别当成常规回退路径。
2. **首次算出后，把首句原文连同 `sid` 一起落盘**（`facts.md` 头一行）——
   格式：`- session：<sid>｜首句：<原文>｜memory id：<可选，拿不到写 —>`
   理由：**这样 hash 才可复算、可校验**。落盘原文是它的"来源"，否则它只是个没人能验证的随机串。
3. **碰撞护栏**：
   - `sid` 命中已有目录、但目录内记录的**首句原文不同** → **报错**，不静默合并；
   - **首句完全相同**（两个 session 用同一句开场，如都以「继续」起头）→ 护栏无法区分，转为**已知风险**（§13）。**定位按 `<日期>-<sid>` 联合匹配**（§4.1）可挡掉跨天的那部分。
   - **best-effort**：`facts.md` 头里还没记首句时护栏会跳过，但 `moment add` 会打 `[warn]`（"碰撞护栏本次未生效"）——**不静默**。
   - **形态约束**：`--session` 只收 `^[0-9a-f]{8}$`（= `sessionId()` 的输出，实现见 `SID_RE`）——与生成端**同形即不变量**：拒 `-`（段匹配混淆）、拒正则元字符（`nextMomentSeq` 注入）、定长（目录名越界）、拒非 hex（误传 memory 的 `session_id` 之类"形态合法但不是 sid"的值）。`--project` 另拒 `.` / `..`（路径穿越）。

### 2.3 memory 的 session_id 降级

`~\.trae-cn\memory\**\session_memory_*.jsonl` **不再作为身份来源**（实测严重滞后：2026-10-02 停在 11:55 共 4 条摘要，其后数小时零新增）。

- 它的 `session_id` 降为**可选备注**（拿得到就记进 `facts.md` 头，拿不到不阻塞）；
- `retro-collect` 里"读 jsonl 校验 session_id"那条**删除**。

### 2.4 已经踩过的坑（为什么必须自足）

`projects/sound-control-tool/2026-10-02-s01-facts.md` §6 原文：

> session_id：无 `~\.trae-cn\memory\projects\sound-control-tool\2026-10-0*\session_memory_*.jsonl` 锚点文件可用（未检索），故 §4 的 session 字段以 `s01` 自定标识，非外部锚点。

即：**拿不到锚点时只能自己编**，而自编的 `s01` 与其它产物对不上（同一天第二个 session 也会叫 `s01`）。`sid` 方案从根上消除"找不到 / 得编"。

## 3 目录名与清洗

```
projects/<项目标识>/<YYYY-MM-DD>-<sid>-<摘要≤20字>/
```

| 段 | 规则 |
|---|---|
| `<YYYY-MM-DD>` | **session 起始日期**（定法见 `retro-collect/SKILL.md`「第 0 步」；**禁止用系统当天**） |
| `<sid>` | §2 的 8 位 hash——**唯一标识**（查找按 `<日期>-<sid>` 联合，见 §4.1） |
| `<摘要≤20字>` | 首句压到 ≤20 字，**纯装饰**（给人看）；**可省** |

**清洗**（比 `sanitizeProjectId` 更严，Windows 保留字符）：

1. 去 `< > : " / \ | ? *` 与控制字符；
2. 去首尾空白、**去结尾的点**（Windows 建不出以点结尾的目录）；
3. 空白（含中文全角空格）折成 `-`；
4. 截到 20 字——**按码点截断**（`[...s].slice(0,20)`），否则第 20 个码元落在 emoji 代理对中间会留下孤立代理项，落盘变 `U+FFFD`；
5. **清洗后为空 → 省略该段**，目录名退化为 `<YYYY-MM-DD>-<sid>`。

**永不改名**：目录名只在**创建那一次**定；此后所有路径（重跑 collect / resolve / add / summary）一律**按 `<日期>-<sid>` 找回**（§4.1），不重新拼名字。

**日期 / `sid` 以目录名为权威**：`facts.md` 头里也各记一遍（给人读），那些是**冗余锚点**、**不作为查找依据**——与首句原文、moment 条目里的 `session` 字段同性质（判据同 §6.2：自描述留、切块删）。

## 4 查找与覆盖语义

### 4.1 定位顺序

1. 在 `projects/<项目标识>/` 下**按段匹配**：`^<日期>-<sid>$` 或 `^<日期>-<sid>-`（**不用"名字含 `-<sid>`"**——摘要里若恰好含同样的 8 位串会假命中）；
2. **命中 → 复用**（一个字都不改）；
3. **多个命中 → 报错**（不猜）；
4. **未命中**：
   - **仅当 `sid` 缺失**、且该 `<日期>` 下**恰好只有一个** session 目录 → 兜底复用（见 §2.2）；
   - **否则 → 新建**（此时才用摘要定名）。
   > `sid` **在场却不匹配**时**不得**复用同日目录——否则 `moment add` 会把新 session 折进旧目录、`moment drop` 会清错 session。缺 sid 的正确修法是**从已有目录名里读出 sid** 再传进来。

### 4.2 覆盖

- 重跑 `retro-collect` = **覆盖本 session 目录内的文件**（facts / userwords / moments）；
- moments 的覆盖仍走两步（`moment drop` → `moment add`），理由：复用既有写入路径与转义/原子写逻辑。

### 4.3 `moment drop` 语义简化

**文件即本 session**，因此 drop 不再需要按 `session` 字段过滤：

- `moment drop --project <标识> --session <sid>` → 清空该 session 目录 `moments.md` 的**条目区**（保留文件头）；
- **条目区边界（必须写死，否则会误删）**：
  - 清的是 **`^##\s+M-` 块**；**文件头** = 第一个 `^##\s+M-` 之前的内容，**原样保留**；
  - **非 moment 标题**（手加的 `## 备注` 等）**保留**——这是上一轮 OCR 评审专门修掉的 bug（`## 备注` 曾被并进前一块的删除区间），别在这里放回来；
  - 全文件**无 `## M-` 头**时 → 不动（返回 0）。
- `--date` **保留为护栏**：若传入，则校验目录名里的日期一致，不一致 → 报错（防找错目录）；
- 原「同日其他 session 一根不动」的表述删除——它现在由"目录隔离"天然保证。

## 5 文件结构（新旧对照）

```
旧：projects/<项目>/
      ├── <日期>-moments.md          ← 一天一个，内含多个 session
      ├── <日期>-userwords.md        ← 一天一个，内含多个 session 块
      ├── <日期>-<sesshort>-facts.md
      ├── <日期>-retro.md
      ├── ledger.md
      └── rules-history/

新：projects/<项目>/
      ├── <日期>-<sid>-<摘要>/            ← 一 session 一目录
      │     ├── facts.md
      │     ├── userwords.md
      │     ├── moments.md
      │     └── retro.md                ← analyze 后才有
      ├── ledger.md
      └── rules-history/
```

**被取代的设计**（随本 spec 作废）：

- 「moments / userwords **按天分文件**」——改为按 session；
- `<sesshort>`（来路不明的 `s01`）——由 `sid` 取代；
- userwords 块键 `S-<session_id>`——取消。

## 6 moment 的 id

| | 旧 | 新 |
|---|---|---|
| 形态 | `M-<日期>-<N>` | `M-<sid>-<N>` |
| 唯一性 | 同一天多 session 会撞号（`N` 是"当天文件内最大 +1"） | 文件即 session，`N` 在本 session 内递增，不撞 |
| 能否定位 | `resolve` 靠 id 里的日期反推文件——多 session 后**定位不了** | `sid` + `N` 唯一 |

### 6.1 「旧 id 不重写」的完整支撑

结论：**迁移时不批量改写 id**，靠"按标题找"的定位规则兼容。要让这条真正成立，下列**实施落点缺一不可**（缺了不是"兼容不了"，而是新 id 根本进不来）：

| # | 落点 | 改法 |
|---|---|---|
| **A** | `momentResolve` 的 **id 格式护栏**（现为 `^M-(\d{4}-\d{2}-\d{2})-\d+$`，不匹配直接报错） | 放宽为**同时接受两种形态**：`^M-[^\s-]+-\d+$`（新，sid 段不限死 8 hex——与 `momentAdd` 的宽松校验保持一致）｜ `^M-\d{4}-\d{2}-\d{2}-\d+$`（旧）；**不再靠它定位** |
| **B** | `nextMomentSeq(text, date)` 的 key 用的是**日期** | key 换成 **`sid`**（在新文件里生成/递增 `M-<sid>-<N>`） |
| **C** | `momentAdd` 里拼 id 的那行（现在用 `${date}`） | 换成 `${sid}`（拼出 `M-<sid>-<N>`） |
| **D** | `momentDrop` 现按 `- 极性：` 行里的 `session：` 单元格**过滤**并计 `unparsed` | **删除该过滤**（§4.3：文件即 session）。迁移后老文件的字段值是**旧 memory id**，若保留过滤会**对不上 → drop 不动** |
| **E** | 模板 `moments-template.md` 的 id 行 `## M-<日期>-<N>` 与字段行 `session：<session_id>` | id 行改 `## M-<sid>-<N>`；字段值改 `sid`（见 §6.2） |
| **F** | `momentResolve` 命中**多个**同名标题 | **报错（歧义）**，不静默取第一个 |

**定位规则**：在 `projects/<项目>/*/moments.md` 里找标题 `## <id>`（新旧 id 同一套逻辑）——因此**迁移后旧 id 依然可 resolve**，不改写、不断旧引用。

### 6.2 moments 的 `session` 字段：**保留**，值改 `sid`

与 userwords 块键的删除**不矛盾**，因为两者性质不同：

| | 性质 | 处置 |
|---|---|---|
| moments 的 `session` 字段 | **自描述锚点**——条目被摘出去引用（进 `retro.md`、进规则）后，仍能自己说明来自哪个 session（承 §4.4「自带快照」） | **留**，值改 `sid` |
| userwords 的块键 `S-<session_id>` | **切块用的结构键**（功能性）——目录已承担该功能 | **删** |

即：**自描述 → 留；纯切块 → 删。**

> 权威仍是**目录名**；该字段是冗余锚点，**不作为查找依据**。

## 7 脚本改造（`lessons.mjs`）

| 函数 | 改法 |
|---|---|
| `momentAdd` | 路径 → `<项目>/<日期>-<sid>[-<摘要>]/moments.md`；`id` 用 `sid`（§6.1-C）；新增 `--summary`（**仅创建时用**，已存在目录则忽略） |
| `nextMomentSeq` | key 从 `date` 换成 **`sid`**（§6.1-B） |
| `momentResolve` | 定位 → §6.1「按标题找」；**格式护栏放宽、同时接受新旧两种 id**（§6.1-A）；多命中 → 报错（§6.1-F） |
| `momentDrop` | 定位 → 按 `sid` 找目录；**删除按 `session` 字段的过滤与 `unparsed` 计数**（§6.1-D）；`--date` 转护栏校验 |
| `momentsSummary` | 扫描 → `projects/<项目>/*/moments.md`（原为 `readdirSync` + `^\d{4}-\d{2}-\d{2}-moments\.md$` 正则） |
| CLI | `moment add/drop` 帮助串与输出文案同步 |
| **新增** | 目录名清洗函数（§3，比 `sanitizeProjectId` 严）；`sid` 计算 + 查目录/复用逻辑 |

**保持不变**：`.migrating` 锁、原子写、无 BOM、`--project` 清洗、`schemaVersion`（=1）。

## 8 技能与模板改造

| # | 文件 | 改什么 |
|---|---|---|
| 1 | `skills/retro-collect/SKILL.md` | 唯三产出落点；**「第 0 步」扩成"定 session"（日期 + sid + 摘要）并写死识别判据**；重扫节删「按天文件」表述；常见错误表更新；**删除"读 jsonl 校验 session_id"** |
| 2 | `skills/retro-collect/assets/facts-template.md` | 落点；头部加「首句原文」行；去 `<sesshort>`；§2/§4 的文件引用 |
| 3 | `skills/retro-collect/assets/userwords-template.md` | 落点；**块键 `S-` 退场**（4 处）；"与同目录并列"表述 |
| 4 | `skills/managing-lessons-store/assets/moments-template.md` | 落点；"按天分文件" → "一 session 一目录"；重扫节 + 条目区边界（§4.3）；**id 行 `## M-<日期>-<N>` → `## M-<sid>-<N>`、`session：` 字段值改 `sid`**（§6.1-E / §6.2） |
| 5 | `skills/managing-lessons-store/SKILL.md` | 命令表（`--session` 语义、`--summary`） |
| 6 | `skills/retro-analyze/SKILL.md` + `assets/retro-template.md` | `retro.md` 落点 |
| 7 | `skills/using-retrospective/SKILL.md` | KB 结构示意图 |
| 8 | `skills/retro-institutionalize/SKILL.md` | 读 `<日期>-moments.md` → 新路径 |
| 9 | `skills/retro-verify/SKILL.md` + `assets/effectiveness-template.md` | "认可 P"取数口径的文件名 |

## 9 文档同步

| 文件 | 改什么 |
|---|---|
| `docs/architecture.md` | KB 树（L1 层）；命令清单；moment 机制行 |
| `README.md` | `retro-collect` / `retro-analyze` 产出行；示例文件名 |
| `docs/superpowers/specs/2026-10-01-...md` | §4.1 存储、**§4.3 三钥匙表（重写）**、§4.6 格式、§5 表与文件结构、§11 载体、§12 验证第 3 条、§15 候选（"legacy 单文件接管"的**状态保持候选**——本 spec 只取代布局，不取代"扁平文件静默不可见"这个风险） |
| KB `index.md` | 项目结构行；facts 命名约定；情绪记录约定；**新增「历史留档」一行**声明旧 id 口径 |

## 10 数据迁移

- **只迁 `projects/retro-skills/` 下 3 个文件**（`2026-09-30-s01-facts.md` / `2026-09-30-userwords.md` / `2026-09-30-moments.md`）→ `2026-09-30-6abcf3ed-<摘要>/`。
  - 该目录的 `sid` 按其首句计算；同时把**旧 memory id `6abcf3ed99647070cc770d27` 记进 facts 头**的"memory id"栏（保链）。
- **其余项目祖父不改**（依据：`facts` / `userwords` 无任何脚本读；`moments` 全库仅 retro-skills 有 1 份）。
- 迁移流程（上锁 / 复制 / 校验 / 删原件 / 解锁）**以 §12 步骤 3 为准**，此处不复述；另在 `index.md`「历史留档与路径变动」记一笔。
- 旧 id（`M-2026-09-30-1..9`）**不重写**（§6.1 的定位规则已兼容）。

## 11 验证

【自动】

1. `sid` 计算：同输入两次 → 同值；PowerShell 与 Node 两侧同值；实测例 `51e11408` 一致。
2. `sid` 归一化 fixture 覆盖：首句含 **emoji / 换行 / 全角空格 / 多行** → 归一化后 hash 与手工复算一致。
3. 目录名清洗：含 `<>:"/\|?*`、结尾点、全角空格 → 清洗后建得出目录；清洗后为空 → 目录名退化为 `<日期>-<sid>`。
4. 目录名总长在 Windows 260 限制内（最坏情形：`D:\Seed\lessons\projects\<最长项目名>\<日期>-<sid>-<20 中文字>`）。
5. 定位按**段匹配**：摘要里恰好含同样 8 位串 → **不假命中**；命中多个目录 → **报错**；**`sid` 在场却不匹配 → 不复用同日目录**（`moment add` 新建、`moment drop` 报 `fileMissing`）。
6. `moment add`：目录不存在 → 自建；已存在 → 复用（名字不变）；`--summary` 在已存在时被忽略。
7. `moment add`：同一 session 第二次写入 → 落同一目录、`N` 递增。
8. `moment resolve`：**新旧两种 id（`M-<sid>-<N>` / `M-<日期>-<N>`）都能定位**（含格式护栏放宽）；找不到 → 报错、不改文件。
9. `moment drop`：清空本 session 的 `moments.md` **条目区**；**`## 备注` 块不被误删**；在**字段值是旧 memory id** 的老文件上同样有效；`--date` 与目录名不符 → 报错；文件不存在 → `fileMissing`。
10. `sid` 碰撞护栏：命中目录但首句不同 → 报错。
11. `momentsSummary`：跨 session 目录聚合统计正确。
12. 迁移后全库扫 `projects/*/????-??-??-moments.md`（扁平形态）= **零命中**。
13. 全部现有测试 `node --test` 全绿（含改写后的跨天 / 跨 session 用例）。
14. CLI 实测：`moment add` / `resolve` / `drop` 三条路径在新布局下跑通。

【文档】

15. 三个模板 + 三个技能 + `architecture.md` / `README.md` 全库 grep 旧形态（`<日期>-moments.md`、`<日期>-userwords.md`、`<sesshort>`、`S-<session_id>`）= **零命中**。
16. `retro-collect/SKILL.md`「第 0 步」含：日期定法 + **sid 算法与首句判据 + 拿不到怎么办**。
17. **输入校验**：`--session` 非 **8 位小写 hex**（含 `-` / 空格 / 正则元字符 / 长度不对 / 24 位 memory `session_id`）→ **拒收**；`--project` 为 `.` / `..` → **拒收**，且 session 目录**永不写到 `projects/` 之外**。

## 12 落地节奏

1. **定稿本 spec**（含 id 算法与目录名规则）。
2. **改脚本 + 测试**（保证 `node --test` 全绿）——先让工具支持新布局。
3. **迁 3 个文件**：
   - **先复制 → 校验一致 → 再删原件**（KB 无 git，移动不可逆，复制留后路）；
   - 全程 **try/finally 释放 `.migrating` 锁**（照现有 `migrate` 的写法；锁残留会让**所有写入被拒**）；
   - **校验定义**：逐个文件比对"内容哈希一致"**且**"旧位置已不存在"；
   - 在 `index.md`「历史留档与路径变动」记一笔，**写清原路径 → 新路径**。
4. **改模板 / 技能 / 文档**（§8 / §9）。
5. **跑本次 `retro-collect`**（用新布局产出本 session 的三样产物）。

**硬约束：步骤 2、3、4 必须同批完成，中间不留窗口。**

- **2 与 3 之间**：扫描器一旦改成 `projects/<项目>/*/moments.md`，**迁移前那个扁平老文件就不可见了**（`summary` / `resolve` / `drop` 全找不到它）；此时跑 collect 会误报 `fileMissing`、新建一个 session 目录，老文件变孤儿。
- **3 与 4 之间**：`facts` / `userwords` 的落点是 **agent 照技能文本手工落的、不经过脚本**。只改脚本不改技能 → agent 继续往**旧路径**写 facts，而 moments 已进新目录 → **同一次 collect 的产物裂在两处**。

## 13 未决与 Backlog

| 状态 | 项 | 说明 |
|---|---|---|
| 待定 | 摘要「≤20 字」如何计数 | 中英混排时"字符数"还是"视觉宽度"未定；当前按字符数截断 |
| 候选 | `sid` 碰撞的实际护栏强度 | 8 hex = 32 bit；个人库规模下风险极低。触发信号：真发生一次碰撞 → 扩到 12 位 |
| 关闭 | ~~`sid` 非 8-hex（含 `-` 等）会与段匹配前缀 `<日期>-<sid>-` 混淆~~ | **2026-10-02 已修**：`--session` 加形态校验 `SID_RE = ^[0-9a-f]{8}$`（与 `sessionId()` 输出同形）——拒 `-`（段匹配混淆）、拒正则元字符（`nextMomentSeq` 注入）、定长（目录名越界）、拒非 hex（误传 memory `session_id`）。`--project` 另拒 `.` / `..`（路径穿越）
| 取舍（已接受） | **同日 + 同首句**（两个 session 在同一天用同一句话开场）→ `sid` 相同、首句也相同，护栏不响 → 静默合并 | 结论：**接受**——跨天的已被 `<日期>-<sid>` 联合匹配挡住（§4.1），只剩同日这一种。真发生了：手工拆目录 |
| 候选 | `moments.md` 头部的「触发」描述 | 现在同时讲"当场记 + collect 重扫"，跨天/跨 session 语义待实测后收紧 |
| 取舍（已接受） | **历史 session 若被重扫**：旧 id 条目被新 id 覆盖，老 `facts.md` §4 表引的 `M-2026-09-30-1..9` 会悬空 | 结论：**接受**（该 session 已完成、不会再重扫）。若将来确需重扫历史 session，须把其 facts 的引用一并更新 |
| 候选 | legacy 单文件 `moments.md` 接管（2026-10-01 spec §15 候选） | **本 spec 只取代了布局，没取代这个风险**：`resolve` / `drop` / `summary` 只扫 session 目录，遇扁平 `<日期>-moments.md` 一律**静默忽略**。**2026-10-02 复评：从「关闭」改回「候选」**，与 2026-10-01 §15 状态保持一致。触发信号：任何 store 再现扁平 `<日期>-moments.md` |
| 关闭 | `<sesshort>`（`s01`） | 由 `sid` 取代；旧产物里的 `s01` 祖父不改 |
