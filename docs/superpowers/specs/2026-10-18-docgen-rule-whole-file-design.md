# Docgen P1：一条 rule 的整文件生成（实现设计）

> 日期：2026-10-18｜状态：已定稿（内容评审通过；机械检查通过，2026-10-18）｜split from `docs/prd/docgen-rule-whole-file.md`（2026-10-18）
> PRD 状态：已定稿（五席三轮评审通过）｜本 spec 只写实现设计，不改 PRD 决策
> 测试用例文件：`docs/superpowers/specs/2026-10-18-docgen-rule-whole-file-design-testcase.md`

## 0 为什么

P1 的五个模型（整文件、入口基线、规则类型、纯度、可复跑）在 PRD 里已经定成 V1–V11，但 PRD 只回答「验什么」，不回答「怎么实现才验得过」。没有这份 spec，施工者会各自发明模板语法、baseline 语义和临时文件清理方式——上一轮评审已经证明，同一对象被两处不同口径约束时，验收必然假绿。

本 spec 只做一件事：把 V1–V11 落成**可编码的模块边界、数据形状、算法与错误优先级**。PRD 的决策原文不复制，引用见 `docs/prd/docgen-rule-whole-file.md` §2–§8。

**外部编号对照**（避免读者去翻 PRD）：

| 编号 | 含义 | 出处 |
|---|---|---|
| D6 | 生成物禁手改；`npm run check` 只读重渲染并逐字节比对 | 索引 §2 |
| P1-1 | 规则类型 = 适用方式 × 极性 | PRD §3 |
| P1-4 | golden 锁：target hash + SHA256；施工期 target diff 为空 | PRD §3 |
| D18 | v1 不做 spec 片段生成 | 索引 §2 |

## 1 全貌确认

| 维度 | 内容 |
|---|---|
| 本质 | 用「纯数据 + 纯 render + 内存比对 + 常量派生 baseline + 日常门」把整文件生成做成可复算的闭环 |
| 同族 | 同类失败面还有：模板贴全文假绿、baseline 手改绕过、EOL 归一化掩盖差异、临时文件残留导致第二遍不绿、测试改真文件不可逆——本 spec 用 V1–V11 逐条堵 |
| 边界 | 只做 `rules/spec-testcase-gate.md` 一条 rule；不做写回、六骨架、skill/agent、存量迁移、spec 片段 |
| 验收 | PRD §6 的 V1–V11 全绿；本 spec §8 只写测什么/为什么，具体用例在 testcase 文件 |
| 影响面 | `tools/docgen-spike/**`、`scripts/check-all.mjs`、`.gitattributes`；目标 rule 与模板只读 |

**联动四问**：

- **治本了吗**：把「验收」变成「可证伪的字节/错误码断言」，不是再写一段说明；治本。
- **有副作用吗**：`npm run check` 会多一条 gate 调用；gate 失败会挡住日常 check。这是设计目的，不是副作用。
- **跨问题联动吗**：EOL 检查面、baseline 判定顺序、临时文件生命周期三处互相牵连，必须同批实现（见 R8/R9/R11），否则 V2b/V7/V9 互相打架。
- **跨文件吗**：`scripts/check-all.mjs` 是全局入口；gate 接线只增加一条调用，不改既有四类检查。

## 2 核心决定（不可违反）

| # | 决定 | 为什么 |
|---|---|---|
| R1 | `render(data, template)` 与 `renderBlocks(data)` 都是纯函数：不 import `fs`、不读环境、不取时间、不随机 | 一旦 render 能读 target，V1 会被「直接返回 target 内容」的作弊实现骗过（V6 的核心） |
| R2 | 模板只放结构：标题、节标题、表格头、列表前缀、空行、`{{key}}` 占位符；**不放任何业务原文** | 模板贴全文也能字节相等；V6②用 3 段 ≥20 字特征串把这条路堵死 |
| R3 | 块内容由组件渲染成字符串再注入：判据表、四要素、正例反例、触发时机、验证段 | PRD §4.1 只允许单层 `{{key}}`；块级循环若写进模板就变成第二套语法，V6③的数据增删也无法验 |
| R4 | 输出确定性：LF、UTF-8 无 BOM、单尾换行、baseline 路径字典序、无时间戳 | V1/V9 要求两遍逐字节一致；任何环境相关字节都会让 V1 随机红 |
| R5 | `baseline.json` 是生成视图：`JSON.stringify(BASELINE_RULES, null, 2) + '\n'`，启动时与常量逐字节比对 | 允许手改 baseline 就等于允许绕过入口强制；`BaselineDrift` 专门抓这一类 |
| R6 | `--gate` = 入口基线校验 + 对 target 的内存重建 + 逐字节比对 | 只做基线不做比对，手改 target 一个字节 `npm run check` 仍绿，违背 D6（V10/V10b） |
| R7 | target 与模板全程只读；所有变异只发生在 `.tmp-test/` 副本或内存数据 | 在真文件上做 V2/V3/V7/V8，一次断言失败或 Ctrl-C 就可能不可逆写坏 golden |
| R8 | `EnvironmentEOL` 按**输入角色**检查；`.tmp-test/` 下作为比对对象的 generated 副本不预检 | 预检 generated 副本会让 V2b 永远拿不到 `Mismatch`；不预检输入角色又会让 CRLF 被误诊成渲染差异（V2b vs V8 的分界） |
| R9 | 错误优先级固定：结构 baseline → 路径 → 悬空 → 漂移 → 基线外新增；只报第一个 | 同一份坏 baseline 可同时满足多个条件；顺序不定则 V7 的期望随实现红绿不定 |
| R10 | 退出码固定：0 全绿 / 1 用例未达预期 / 2 环境或基线前置失败 / 3 IO 或依赖失败 | CI 必须能区分「环境没准备好」与「代码写错了」，否则停损会把环境红算成模型不成立 |
| R11 | 清理：启动只清 `.tmp-test/` 并重建 ROOT；每例 `try/finally`；`process.on('exit')` 只覆盖正常返回与 `process.exit()`；Ctrl-C 用 SIGINT/SIGTERM 同步清理；SIGKILL 不可捕获，靠启动对 V4/V10 唯一临时文件的哨兵内容自愈 | 只靠 finally，`process.exit()` 会留下临时规则文件；SIGKILL 一定留下，第二遍必红（V9）；哨兵自愈是唯一不靠人工的恢复路径 |
| R12 | golden 的双保险：`TARGET_GIT_HASH` + `TARGET_SHA256` 常量；施工期 target diff 必须为空 | 只锁一个 hash 时，改目标文件迁就模板仍可能被另一种算法放过（P1-4） |
| R13 | 零第三方依赖；只用 Node ≥22 内置模块；`child_process` 仅允许 `run.mjs` 与 `test/`（V10 需要唤起 npm），`specTestCaseGate.mjs` / `compare.mjs` 禁止任何 IO 与子进程 | 仓库只有 Node；纯模块一旦能起子进程，fs 探针可被 `execSync('cat target')` 绕过 |
| R14 | `--template` / `--target` / `--baseline` / `--compare` / `--out` 覆盖只接受 `.tmp-test/**`；默认用仓库内文件 | 故障注入必须能指向副本，但不能让 CLI 成为改真文件的入口 |
| R15 | 施工顺序：先落 `.gitattributes` → 确认 target 为 LF → 计算 `TARGET_GIT_HASH` / `TARGET_SHA256` → 再接 gate | 顺序反了，Windows 克隆首跑必红；`git hash-object` 不做换行转换，CRLF 工作区的常量会与仓库 blob 不一致（TC-026/TC-059 会互相打架） |

## 3 模块与数据流

### 3.1 文件布局

| 文件 | 职责 | 纯度 |
|---|---|---|
| `tools/docgen-spike/specTestCaseGate.mjs` | `buildData()`、`validateData()`、`render(data, template)`、`renderBlocks(data)`、`TARGET_SIGNATURES`、`BASELINE_RULES`、`renderBaseline()` | 纯：无 IO、无环境、无时间 |
| `tools/docgen-spike/rule.md.tpl` | 结构骨架 + 单层 `{{key}}` | 数据 |
| `tools/docgen-spike/compare.mjs` | `compareBuffers()`、`checkEnvironment()` | 纯：只吃 Buffer 与路径字符串 |
| `tools/docgen-spike/baseline.json` | `BASELINE_RULES` 的生成视图（21 条） | 数据 |
| `tools/docgen-spike/run.mjs` | CLI、IO、fs 探针、用例编排、清理、gate | 编排层：允许 IO |
| `tools/docgen-spike/test/*.test.mjs` | 单元测试：validate / compare / baseline / cli；运行 `node --test tools/docgen-spike/test/` | 测试代码 |
| `tools/docgen-spike/fixtures/*.json` | V5/V7/V8/V11 的覆盖数据 | 数据 |
| `scripts/check-all.mjs` | 增加一条 `node tools/docgen-spike/run.mjs --gate` | 编排层 |
| `.gitattributes` | 强制 LF | 配置 |
| `.gitignore` | 追加 `tools/docgen-spike/.tmp-test/` | 配置 |

### 3.2 数据流（每步标注成本属性）

| 步 | 动作 | 成本属性 |
|---|---|---|
| ① | `run.mjs` 解析参数，确定 target / template / baseline / fixture / out | 0 token |
| ② | 读输入角色文件，先做 `checkEnvironment()` | 实跑（文件 IO） |
| ③ | 读 baseline，按 R9 顺序校验；扫 `rules/*.md` | 实跑 |
| ④ | `buildData()` + fixture 浅覆盖 | 0 token |
| ⑤ | `validateData()` | 0 token |
| ⑥ | 在 fs 读取探针下调用 `render(data, template)` | 0 token（纯函数） |
| ⑦ | 与 target 做 `Buffer.compare()`；需要落盘时只写 `.tmp-test/` | 实跑 |
| ⑧ | 输出 PASS/FAIL 汇总；`finally` 与退出钩子清理 | 实跑 |

## 4 数据模型

### 4.1 `buildData()` 的形状

```js
{
  applicability: 'conditional',   // sustained | conditional | mode-gated
  polarity: 'obligation',         // obligation | prohibition
  title: '<H1 原文>',
  sourceLine: '> <来源行原文>',
  fourElements: {
    scope: '<范围（在哪）的值>',
    condition: '<条件（何时）的值>',
    action: '<动作（极性 = 义务）的值>',
    object: '<宾语（对什么）的值>'
  },
  criteriaIntro: '<核心判据的引导句>',
  criteria: [
    { id: '<稳定键，默认取 name>', no: 1, name: '<判据名>', pass: '<怎么算合格>' }
    // 目标规则当前 5 条；顺序即输出顺序；id 必须唯一
  ],
  examples: {
    positive: ['<正例行，不含 "- " 前缀>'],
    negative: ['<反例行，不含 "- " 前缀>']
  },
  why: '<为什么正文>',
  scope: '<适用范围正文>',
  conflict: '<冲突裁决正文>',
  exceptions: '<例外正文>',
  trigger: ['<触发时机条目，不含 "- " 前缀>'],
  verification: ['<验证段 1>', '<验证段 2>']
}
```

- 所有字符串必须非空、非纯空白、非 `TODO`；目标规则当前文本原样转录，不改写（V1 逐字节证明）。
- `criteria` 的 `name` 是表格第二列的加粗文本；`pass` 是第三列文本；`id` 是稳定寻址键（默认取 `name`，必须唯一）。
- `sourceLine` 含 `> ` 前缀；`examples` / `trigger` 的条目不含 `- ` 前缀，由组件统一加。

**占位符 → 来源**（模板 key 的封闭白名单）：

| 占位符 | 来源 |
|---|---|
| `title` / `sourceLine` / `criteriaIntro` / `why` / `scope` / `conflict` / `exceptions` | `buildData()` 标量字段直取 |
| `fourElements` / `criteriaTable` / `examples` / `trigger` / `verification` | `renderBlocks(data)` 产出的块字符串 |

> 与 PRD §4.1 的偏离：PRD 用 `sections: {...}` 容器；本实现把 `sections` 展平为 `fourElements` / `examples` / `trigger` / `verification`，`criteria.id` 保留为稳定键。属实现细化，待 PRD 下次同步。

### 4.2 `BASELINE_RULES`

- 字符串数组，元素是相对仓库根的 POSIX 路径（`rules/xxx.md`），**字典序**。
- v1 固定 21 条；施工时从 `rules/*.md` 取当前集合，排序后写入常量。
- `renderBaseline()` 返回 `JSON.stringify(BASELINE_RULES, null, 2) + '\n'`。

### 4.3 fixture

```json
{ "polarity": "ban" }
```

- 只做顶层浅覆盖；只允许覆盖 `buildData()` 已声明的键。
- **浅覆盖 = 整键替换**：嵌套对象必须给全子键（`{"fourElements":{"scope":"x"}}` 会丢掉另外三项并触发 `MissingSlot`）。
- 不含逻辑、不含表达式、不含模板；未知键直接抛 `Error`（用例自身缺陷，不走产品错误码）。
- fixture 读取失败或非 JSON → 退出码 `3`（IO / 依赖层）；不分配产品错误码（属用例输入缺陷）。

### 4.4 目标哈希常量

- `TARGET_GIT_HASH`：`git hash-object rules/spec-testcase-gate.md` 的输出。
- `TARGET_SHA256`：文件字节的 SHA256。
- 两者写死在 `specTestCaseGate.mjs`；施工开始时计算，之后 target 的 `git diff` 必须为空。

## 5 渲染与校验算法

### 5.1 模板语法

- 只允许 `{{key}}`：`key` 匹配 `[A-Za-z][A-Za-z0-9]*`，单层、无表达式、无空格。
- 扫描规则：模板中每个 `{{` 必须被一个合法占位符消费；未闭合、嵌套 `{{`、表达式、空 key → `TemplateSyntaxError`，`line` = 该 `{{` 之前 `\n` 的数量 + 1。
- 未知 key（既不是 `buildData()` 标量键，也不是 `renderBlocks()` 的块键）→ `MissingPlaceholder`，`key` = 原文。
- 合法占位符替换为对应字符串；同一 key 可出现多次。fixture 覆盖结构化字段后必须重算块。

### 5.2 模板结构（只列结构，不含业务原文）

```text
# {{title}}

{{sourceLine}}

## 四要素声明

{{fourElements}}

## 核心判据

{{criteriaIntro}}

{{criteriaTable}}

## 正例 / 反例

{{examples}}

## 为什么

{{why}}

## 适用范围（不因来源豁免）

{{scope}}

## 冲突裁决

{{conflict}}

## 例外

{{exceptions}}

## 触发时机

{{trigger}}

## 验证

{{verification}}
```

- 节与节之间恰好一个空行；文件末尾恰好一个 `\n`。
- 本模板共 **9 个 H2**：核心判据 + 其余 8 个；与 target 一致（PRD P1-5 的「另有 8 个」是「除核心判据外还有 8 个」，合计 9）。
- `fourElements`：四行 `- **范围（在哪）**：…` / `- **条件（何时）**：…` / `- **动作（极性 = 义务）**：…` / `- **宾语（对什么）**：…`。
- `criteriaTable`：表头 `| # | 判据 | 怎么算合格 |` + 分隔行 + 每行 `| <no> | **<name>** | <pass> |`。
- `examples`：正例行 `- **正例**：…`，反例行 `- **反例**：…`，按数据顺序。
- `trigger`：每行 `- <条目>`。
- `verification`：段与段之间一个空行。

### 5.3 `validateData(data)`

按固定顺序检查，返回第一个错误：

1. `applicability` 不在三值集合，或 `polarity` 不在二值集合 → `InvalidRuleType`（`field` / `value`）。
2. `title` / `sourceLine` / `criteriaIntro` / `why` / `scope` / `conflict` / `exceptions` 为空、纯空白或 `TODO` → `MissingSlot`（`slot` = 字段名）。
3. `fourElements` 四个字段同上 → `MissingSlot`（`slot` = `fourElements.<key>`）。
4. `criteria` 为空 → `MissingSlot`（`slot` = `criteria`）；每一行的 `name` / `pass` 为空 → `MissingSlot`（`slot` = `criteria.<name>.pass`；`name` 为空时用 `criteria.<index>.pass`）。
5. `examples.positive` / `examples.negative` / `trigger` / `verification` 为空数组 → `MissingSlot`（`slot` = 对应字段）；条目为空 → `MissingSlot`（`slot` = `<字段>.<index>`）。

### 5.4 `assertTemplateClean(template)`

- `TARGET_SIGNATURES` = 3 段 ≥20 字的 target 原文（施工时从目标文件取，存为常量）。
- 哨兵串 `SENTINEL_V4` / `SENTINEL_V10` 从 `specTestCaseGate.mjs` 导出；V4/V10 与测试引用同一常量，禁止猜字符串。
- 模板包含任一签名 → `TemplateHardcoded`（`snippet` = 命中的签名）。
- 目的：模板只能有结构，不能把判据原文抄进去。

### 5.5 fs 读取探针

- `withReadProbe(fn, forbiddenPaths)`：在调用 `fn` 前替换 `fs.readFileSync` / `fs.promises.readFile` / `fs.openSync` / `fs.open` / `fs.createReadStream`（或对 `node:fs` 导出做 Proxy），解析每个路径；命中 `forbiddenPaths`（target）→ 抛 `ImpureRender`（`path`）。
- 静态约束：`specTestCaseGate.mjs` / `compare.mjs` 不得出现 `node:fs` 或 `child_process`；`child_process` 仅允许 `run.mjs` 与 `test/`（R13）。这条静态断言与探针互为补充——探针可能漏 API，静态约束把「纯模块根本不该有 IO」钉死。
- `finally` 恢复原函数；探针只包住 `render()` 调用，不包模板读取与比较。
- 真实 `render` 不 import `fs`；探针主要服务于 V6① 的故意违规替身。

## 6 比对、环境与基线

### 6.1 `compareBuffers(actual, expected)`

1. `Buffer.compare(actual, expected) === 0` → `{ ok: true }`。
2. 否则找首个不同字节：`index =` 两个 Buffer 第一个不同位置；若一个是另一个的前缀，`index = min(length)`。
3. `line` = `actual.subarray(0, index)` 中 `0x0A` 的数量 + 1；`byte` = `index`。`line` 按 `0x0A` 计数，`0x0D` 不单独成行（与 V2b 的期望一致）。
4. 返回 `{ code: 'Mismatch', line, byte }`。

`Mismatch` 的消息必须包含一行：「`rules/spec-testcase-gate.md` 是生成视图，内容源在 `tools/docgen-spike/specTestCaseGate.mjs::buildData()`」。否则第一次手改生成物的人只会看到字节偏移，不知道源在哪、该改哪一边。

不设字段长度上限；不设超时（Node 默认）；大文件按内容处理。

### 6.2 `checkEnvironment(buffer, path)`

按顺序返回第一个：

1. 前 3 字节为 `EF BB BF` → `EnvironmentEOL`（`violation: 'BOM'`）。
2. 含 `0x0D` → `EnvironmentEOL`（`violation: 'CR'`）。
3. `new TextDecoder('utf-8', { fatal: true }).decode(buffer)` 抛错 → `EnvironmentEOL`（`violation: 'INVALID_UTF8'`）。

只对输入角色（`--target` / `--template` / `--baseline` 指向的文件）调用；`.tmp-test/` 下作为比对对象的 generated 副本不调用。

### 6.3 baseline 校验（R9 的顺序）

| 步 | 检查 | 失败码 |
|---|---|---|
| 1 | 文件可读、JSON 合法、是数组、非空、无重复 | `InvalidBaseline` |
| 2 | 每个条目是字符串，匹配 `^rules/[^/\\]+\.md$`，不含 `..` 或 `\` | `InvalidBaselinePath` |
| 3 | 每个条目指向的文件存在 | `DanglingBaselineEntry` |
| 4 | 文件原始字节 === `renderBaseline(BASELINE_RULES)` | `BaselineDrift` |
| 5 | `rules/*.md` 的每个文件都在 baseline 中 | `UnregisteredHandwritten` |

只报第一个；第 4 步必须在第 2/3 步之后，否则 V7 的路径/悬空用例不可达。

`UnregisteredHandwritten` 的消息必须包含可操作指引：「规则新增属受控变更：把路径并入 `BASELINE_RULES`，重跑 `renderBaseline()` 覆盖 `baseline.json`」。否则使用者会把正常的受控变更当成 gate 坏了。

## 7 CLI、门与用例编排

### 7.1 CLI

```text
node tools/docgen-spike/run.mjs
  [--case <V1..V11|V2b|V10b>] [--gate] [--write-baseline] [--no-clean]
  [--template <path>] [--target <path>] [--compare <path>] [--fixture <path>]
  [--out <path>] [--baseline <path>] [--raw]
```

- 省略 `--case` = 跑全部（13 例）；`--gate` 只跑 gate；`--write-baseline` 只写 baseline；`--no-clean` 跳过启动清理与哨兵自愈。
- `--gate` / `--case` / `--write-baseline` / `--compare` 四者互斥；同给 → exit 2 + stderr 提示；`--case` 非 `V1..V11|V2b|V10b` → exit 2 + usage。
- `--write-baseline`：把 `renderBaseline(BASELINE_RULES)` 写到 `tools/docgen-spike/baseline.json`；不碰 target / template；用于合法新增 rule；与 `--baseline` 同给 → exit 2（只写默认 baseline.json）。
- `--compare <path>`：把 `path`（只接受 `.tmp-test/**`）当作待比对生成物，与 target 比对；不存在 → `GeneratedMissing`（exit 3）。
- **路径根**：`ROOT = <仓库根>/tools/docgen-spike/.tmp-test`（绝对路径）；`--template` / `--target` / `--baseline` / `--out` 的覆盖都必须落在它下面。
- **路径合法性算法 `assertInside(root, p)`**：① `abs = path.resolve(p)`；② `rel = path.relative(path.resolve(root), abs)`，若 `rel === ''`、`rel.startsWith('..')` 或 `path.isAbsolute(rel)` → 越界；③ **realpath 复判**：从 `abs` 向上找到最近的已存在祖先 `probe`，取 `realRoot = realpathSync(root)`、`realProbe = realpathSync(probe)`，再对 `path.join(realProbe, path.relative(probe, abs))` 做一次 ② 的包含判断（防 junction / symlink / 大小写）。这样输出文件尚不存在时也能复判，不会被 `realpathSync` 的 ENOENT 抢在 `TemplateReadFailed` / `GeneratedMissing` 之前。
- 输入侧越界 → `InvalidInputPath`（`path`，退出码 2）；输出侧越界 → `InvalidOutputPath`（`path`，退出码 2）。
- `InvalidInputPath` 是本 spec 在 PRD §5 之外新增的实现细化码（PRD 只列了 `InvalidOutputPath`）；不改变 PRD 既有码，待 PRD 下次同步。
- `--raw`：错误原文冒泡，固定 exit 2；自动化只认断言模式。
- 退出码按 R10；禁止 `process.exit()`，用 `process.exitCode`。

**断言模式与前置错误**：前置错误只在「它不是本例的期望结果」时使用自己的退出码——`EnvironmentEOL`、baseline 类、`InvalidInputPath`、`InvalidOutputPath` → 2；`GeneratedMissing`、`TemplateReadFailed`、`TargetReadFailed`、`WriteFailed` → 3。**当这个码正是本例的期望结果时（V3/V4/V5/V7/V8/V11 等），按命中处理：`PASS V<n>` + exit 0**。只有「用例期望未命中」才 exit 1。每例输出一行 `PASS V<n>` / `FAIL V<n>`，末行 `<n>/<total> PASS`；省略 `--case` 跑 V1–V11 + V2b + V10b = **13** 个用例；任一 FAIL 整轮 exit 1。

**退出码逐码映射**（R10 的细化）：

| 退出码 | 错误码 |
|---|---|
| 0 | 无错误 |
| 1 | `MissingSlot`、`MissingPlaceholder`、`InvalidRuleType`、`TemplateSyntaxError`、`TemplateHardcoded`、`ImpureRender`、`Mismatch` |
| 2 | `UnregisteredHandwritten`、`InvalidBaseline`、`InvalidBaselinePath`、`DanglingBaselineEntry`、`BaselineDrift`、`EnvironmentEOL`、`InvalidInputPath`、`InvalidOutputPath` |
| 3 | `GeneratedMissing`、`TemplateReadFailed`、`TargetReadFailed`、`WriteFailed`（fixture 读取/解析失败也归 3，不分配码名） |

`TargetReadFailed`（`path`，exit 3）：`--target` 读失败；PRD §5 未列，属实现细化，待 PRD 下次同步。

### 7.2 gate

```text
① checkEnvironment(target / template / baseline)
② checkBaseline(baseline)
③ read template → TemplateReadFailed
③.5 assertTemplateClean(template) → TemplateHardcoded exit 1
④ validateData → 失败则 exit 1
⑤ render(data, template)（探针下）
⑥ compareBuffers(rendered, target) → Mismatch exit 1
⑦ 打印「baseline 21/21」→ exit 0
```

`scripts/check-all.mjs` 增加一条 `node tools/docgen-spike/run.mjs --gate`；非 0 即 check 失败。

**防自递归**：`tools/docgen-spike/test/*.test.mjs` 禁止调用 `npm run check` / `check-all.mjs`；V10/V10b 只由 `run.mjs` 编排（e2e），不放进 `node --test`。`check-all.mjs` 调 `--gate` 时设置 `DOCGEN_CHECK_ACTIVE=1`；`run.mjs` 看到该变量时跳过任何 `npm run check` 子调用。

**涉及 check 的 e2e**（V10/V10b 及 TC-049/051/057/070）只由 `run.mjs` 串行编排；`node --test` 在 `DOCGEN_CHECK_ACTIVE=1` 下对这些用例显式 `t.skip()`，不得靠隐式约定。

### 7.3 用例编排（实现级）

| 用例 | 前置 | 动作 | 期望 |
|---|---|---|---|
| V1 | 干净树 | 内存 render + compare | 逐字节一致；不写盘；打印 baseline 21/21 |
| V2 | `.tmp-test/V2/` 不存在 | 渲染到 `generated.md`，固定位置改 1 个 ASCII 字节 | `Mismatch`，`line`/`byte` 非空；target hash 不变 |
| V2b | `.tmp-test/V2b/` 不存在 | 渲染后把中部一个 `\n` 换成 `\r\n` | `Mismatch`（未做 EOL 归一） |
| V3 | 默认数据 | 克隆数据，按内容定位第 3 条判据的 `pass`，依次置 `''` / `'   '` / `'TODO'` | `MissingSlot`，`slot` 指向该格；无输出文件 |
| V4 | `rules/tmp-new-rule-V4.md` 不存在 | 创建该文件 | `UnregisteredHandwritten`；finally 删除 |
| V5 | 默认数据 | 两次 fixture：`polarity:'ban'`、`applicability:'sometimes'` | `InvalidRuleType` + `field`/`value` |
| V6 | 无 | ① 写 `.tmp-test/V6/impureStub.mjs`（读 target 的 render 替身），探针下调用；② 查模板 3 段签名；③ 增删一条判据 | ① `ImpureRender`；② 均不含；③ 输出同步增删 |
| V7 | 复制 baseline 到 `.tmp-test/V7/` | 分别：删一条；加重复；加不存在；置空；含 `..` / `\` | `BaselineDrift` / `InvalidBaseline` / `DanglingBaselineEntry` / `InvalidBaseline` / `InvalidBaselinePath` |
| V8 | 复制模板与 target 到 `.tmp-test/V8/` | 模板 CRLF；target 加 `\r`；target 加 BOM | `EnvironmentEOL` + `path`/`violation`；本体 hash 不变 |
| V9 | 全部用例已实现 | 连跑两遍全部用例 | 两遍结果逐字一致；`rules/` 与 `tools/docgen-spike/` 的 git status 为空；无 `.tmp-test/` 残留；`git check-ignore -q tools/docgen-spike/.tmp-test/x` 退出 0 |
| V10 | `rules/tmp-new-rule-V10.md` 不存在 | V10 自建该文件 → `npm run check` → 删除；只由 `run.mjs` 编排，不在 `*.test.mjs` 内调用 | 退出非 0，输出含 `UnregisteredHandwritten`；只断言最终退出码与关键输出，不断言子进程链路 |
| V10b | 干净树 | target 副本改 1 个可打印 ASCII 字节，`--target` 跑 `--gate`；再 `--case V10b` 跑干净树 check；只由 `run.mjs` 编排 | 前者 `Mismatch`；后者 exit 0；计入全量 13 |
| V11 | 无 | 六个故障注入：未知占位符 / 未闭合 / `--compare` 缺生成物 / `--out rules/x.md` / 模板不存在 / `--out` 指向目录 | 依次 `MissingPlaceholder` / `TemplateSyntaxError` / `GeneratedMissing` / `InvalidOutputPath` / `TemplateReadFailed` / `WriteFailed`，必带字段非空 |

V2/V2b/V3/V6/V7/V8/V10b/V11 只操作 `.tmp-test/` 副本或内存数据，禁止触碰 target 与模板本体；V4/V10 的临时文件由每例 `try/finally` 与退出钩子删除；启动只对内容等于哨兵串的唯一临时文件自愈，不无条件删除。

副本归属分两种：① `--case Vn` 内的副本由用例代码在启动清理后自建；② `--gate` / `--compare` 等非 `--case` 模式的副本，测试可在 spawn 前预置在 ROOT 内，但**必须带 `--no-clean`**，并在 spawn 前断言文件存在。**不带 `--no-clean`** 的 spawn 不得预置 ROOT 内文件（会被启动清理删掉）。**唯一例外（无 `--no-clean` 的预置）**：TC-057 要验「启动先删 ROOT」，允许在 spawn 前预置 `.tmp-test/stale/x.md`；除此之外不得预置其他 ROOT 内文件。

V10 允许嵌套调用 gate（`run.mjs(V10) → check-all → run.mjs(gate)`）；不引入 `DOCGEN_GATE_DISABLED`，因为 gate 的失败正是 V10 要断言的对象。V10 只认最终退出码与 `UnregisteredHandwritten` 输出。

`--write-baseline` 的正例：新增第 22 条 → 跑 `--write-baseline` → gate 绿 → 撤销；不新增 V 编号，由 testcase 的 `§7.1 > write-baseline` 覆盖。

### 7.4 清理

- 启动：只删 `tools/docgen-spike/.tmp-test/`，随后 `mkdirSync(ROOT, { recursive: true })`；对 V4/V10 的唯一临时文件做哨兵自愈：内容等于各自写入的固定串 → 删除并打印「已清理上次中断残留」，否则按 `UnregisteredHandwritten` fail-closed。`--no-clean` 跳过本步。
- **ROOT 归属**：只有顶层 owner 进程清 ROOT / 做哨兵自愈；嵌套 check、测试侧 spawn 一律带 `--no-clean`，不得清外层正在使用的 ROOT 或临时文件。
- **临时文件唯一名**：V4 用 `rules/tmp-new-rule-V4.md`，V10 用 `rules/tmp-new-rule-V10.md`；避免嵌套 check 时互相删除。baseline 扫描把任何 `rules/*.md` 都视为新增。

> PRD §4 的 `rules/tmp-new-rule.md` 在本实现按用例加后缀（`-V4` / `-V10`），属实现细化，待 PRD 下次同步。
- 每例：`try/finally` 删除本用例目录与它创建的唯一临时文件。
- `process.on('exit')`：只覆盖正常返回与 `process.exit()`；SIGKILL 不可捕获。
- SIGINT / SIGTERM：同步删除本进程创建的临时文件（覆盖 Ctrl-C）。
- 退出钩子：删除本次创建的 `.tmp-test/`；删除失败则保留，由下次启动清理。
- 每条用例后置断言：`git status --short rules/` 为空（V4/V10 仅在其用例内允许临时文件）、target 与模板 SHA256 不变。

### 7.5 交付节点与结论落点

| 节点 | 用例 | 可下的结论 | 落点 |
|---|---|---|---|
| 1 | V1 / V2b / V6 | 整文件模型成立/不成立 | 写节点账（本 spec / 评审账本） |
| 2 | V4 / V7 / V10 / V10b | 入口基线模型成立/不成立 | 写节点账 |
| 3 | V5 / V8 / V11 | 规则类型（枚举 + 5 格）+ 健壮性 | 写节点账 |
| 全量收口 | V9 | 可复跑（两遍一致、无残留、git 干净） | PRD §8 表 + 索引 P1 状态，**全绿后一次性写** |

每节点绿先记节点账，不必等 V1–V11 全绿；**PRD §8 表与索引 P1 状态仍在全量收口（V1–V11 + V2b + V10b）全绿后一次性写**，避免与 PRD「全绿才写」冲突。任一节点红按 PRD §8 停损（同一红项修 2 次仍红 → 停；环境/基线红先修环境）。

## 8 测试

| 测什么 | 为什么 |
|---|---|
| render 的纯度 | 读 target 的实现能让 V1 永远零差异，是最隐蔽的假绿 |
| 模板是否硬编码 | 把目标全文抄进模板，字节比对照样过 |
| baseline 是否可被手改 | 手改 baseline 是入口强制最直接的绕过路径 |
| EOL / BOM / UTF-8 | Windows 环境最容易把编码问题误诊成渲染差异 |
| 临时文件与可复跑 | 失败路径留下的文件会让第二遍不再绿 |
| target 与模板不被改写 | 一次失败或 Ctrl-C 可能造成不可逆损坏 |
| 退出码区分 | CI 需要区分环境失败与用例失败 |

**测试用例文件**：`docs/superpowers/specs/2026-10-18-docgen-rule-whole-file-design-testcase.md`（由 `senior-sdet` 独立编写；每条用例五要素、负例 ≥ 正例、覆盖总表指回本 spec 的 R 编号与 V 锚点）

**定稿核对（2026-10-18，人工 + Grep 计数；`testcase-check.mjs` 尚未落地）**：71 条用例；正例 13 / 负例与边界 58（负 ≥ 正）；覆盖 V1–V11 11/11、R1–R15 15/15、错误码 19/19、退出码 0/1/2/3 四档；编写者 `senior-sdet`（全新上下文，独立性声明在位）；本 spec 全文无内联用例（`^### TC-` 命中 0）。

**只手动验证**：模板结构是否只含结构、不含业务原文（机器只能查 3 段签名，不能证明全部）；由评审人对照 §5.2 与目标文件抽查。

**不测**：写回命令（P2）、六骨架（P2）、skill/agent（P2）、存量迁移（P3）、spec 片段（D18）——这些不在本 spec 范围。

## 9 不在这一轮

- 写回 `rules/*.md` 的命令：P2 做；本 spec 用内存重建证明可重建。
- 六种规则类型组合的骨架：P2 做；本 spec 只做枚举 + 5 格义务模板。
- skill / agent 模板与 description / 触发表：P2。
- 存量迁移与迁移后的同步：P3。
- spec 片段 / region：D18 明确不做。
- 通用 rule 模板：本 spec 的 `rule.md.tpl` 只服务目标 rule；通用化 P2/P3 再验。

## 10 将来才会撞上的一件事

P2 做六骨架时，`rule.md.tpl` 的「一套结构」假设会被打破：不同组合需要不同的节集合。届时不能靠给模板加 `if` 或给 render 加分支硬塞，否则 D1（逻辑进组件）会被模板逻辑污染。正确方向是**每种组合一套模板 + 一份数据形状**，组件只负责选模板。本轮只点名，不定案。

## 11 与既有 spec 的关系

- **不取代**任何既有 spec；本 spec 是 Docgen P1 的首份实现设计。
- **引用** `docs/prd/docgen-rule-whole-file.md` §2–§8 作为决策源；不复制其决策原文。
- **不触碰** `2026-10-17-systematic-repair-design.md`（它管修复流程，与本生成器无重叠）。
