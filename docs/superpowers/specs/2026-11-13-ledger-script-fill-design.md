# 设计：账本产物「脚本填充 + 行定位 + AI 判值」

> 状态：定稿（2026-11-13）。依据 PRD `docs/prd/20261113124838-ledger-script-fill.md` v3（三方终审一致）。
> 范围：产物层（账本文件）的生成、预填、定位与校验；不改 `agents/*.md` 卡面文本。
> 同类 testcase 由独立 senior-sdet 并行编写，见 `2026-11-13-ledger-script-fill-design-testcase.md`。

## 1 设计目标

把产物的**结构**与**可算值**交给脚本，把**语义判断**留给 AI；并让「读长产物」变成按行定位。对应 PRD F1–F8。

## 2 决策

| # | 决策 | 理由 |
|---|---|---|
| D1 | **列的唯一真相上移到 kind 级**：`outputFormats.mjs` 为每个 kind 定义列（`{id, label}` 双形态：产物表头渲 label，校验按 id 对齐）；席位 `templates.<id>` 只写 `kind`，不再存 `columns` | PRD §7 要求三源逐项相等；列若按席各存一份（现 9 条模板 6 种列集）必漂移；且同 kind 多席无法共享 |
| D2 | **行的唯一真相 = `checklist.items[].no`**；`skills/parliament-ledger/assets/*.md` 只保留表头与说明，不预置具体行 | 现资产 6 行 vs 模型 8 项不一致；预算行会与席位清单打架 |
| D3 | **三态前缀写进单元格**：`[机算]` / `[待判]` / `[人工]`；机算格证据栏格式固定为 `命令 → 退出码 → 输出首行 → 取数时刻（含时区）` | 可机械判定「谁填的、能否复算」，无需额外列 |
| D4 | **重跑幂等**：只补空（骨架列与 `[待判]` 空格），不改任何已填格（含其时刻） | 保证 §6.1-2 的错填归零与 F8 |
| D5 | **定位器只读、输出 JSON**，字段固定 `{matches[{line,row,context}], scanned, skipped}`；`line` 为文件物理行号（1-based） | 行号可回读；`skipped>0` 可判解析失败，避免「0 命中」混淆 |
| D6 | **校验由非本席复核**：`verify` 只输出判红清单，不改正内容；复核席在证据栏署名 | 破自证（PRD §5） |
| D7 | 落点：`tools/review-ledger/`（`fill.mjs` / `query.mjs` / `verify.mjs` + `lib/` + `test/`）；上移公共 CLI 后删除本仓实现 | PRD 要求落点由 spec 定且不得落 `.session`；避免双实现 |
| D8 | 脚本失败不得写值：写 `[待判]（脚本失败：<原因>）` 并 exit≠0 | 机算值必须是可信值 |

## 3 配置归属（解决 PRD §7 的 P0 blocker）

| 配置 | 归位 | 消费方 |
|---|---|---|
| kind 列表与列名（`id` + `label`） | `outputFormats.mjs` 的 `kinds.<kind>.columns` | `ledger.mjs`（生成 assets）、填充器、定位器、校验器；**不含卡面**（卡面取模型 `outputFormat`，`sections.mjs:191`） |
| 表正文块（标题 / 说明 / 取数命令节） | `outputFormats.mjs` 的 `kinds.<kind>.blocks` | `ledger.mjs` 生成 assets |
| 席位产物声明 | 模型 `outputs.items[]`（phase / artifact / kind / action / mode） | 卡面「产出」、填充器 |
| 落盘路径 | 模型 `forms[].path` | 填充器、校验器 |
| 行键与行内容 | 模型 `checklist.items[]`（`no` 为键） | 填充器、索引、校验器 |

**kind 枚举与映射**（`templates.<id>.kind` 必须命中下表；命中不了即构建期红）：

| kind | 现模板 id | 使用席 |
|---|---|---|
| `round-check` | `pl.round-check` | reviewer-audit |
| `delivery-audit` | `pl.delivery-audit` | reviewer-audit |
| `issue-card` | `pl.issue-card` | reviewer-actuary / reviewer-ai / reviewer-product / reviewer-interaction / reviewer-ui / reviewer-frontend / reviewer-backend / reviewer-ops / reviewer-qa / reviewer-reader / reviewer-security |
| `defense-record` | `pl.defense-record` | respondent-architect / respondent-dev |
| `detective` | `pl.detective` | detective-observer |
| `fact-summary` | `pl.fact-summary` | evidence-reader |
| `progress` | `pl.progress` | speaker |

**8 列 `id → label` 对照**（产物表头渲 label，校验按 id 对齐；label 为本设计定版）：

| id | label |
|---|---|
| `no` | 项 |
| `item` | 核对内容 |
| `criterion` | 判据 |
| `kind` | 类型 |
| `verdict` | 结果 |
| `reason` | 理由 |
| `applicability` | 适用性 |
| `evidence` | 证据 |

**同步改动**：席位 `templates.columns` 删除，改为 `{skill, label, kind}`；`ledger.mjs` 从 `kinds` 取列、不再写死表行；`check-all` 增加「assets 表头 == kind.columns」「席位 kind 可解析」两条断言。

## 4 填充器（`fill.mjs`）

输入：`--seat` `--phase`（每轮/终局）`--dir`（评审目录）`--deliverable`（被审文档）。
流程：

1. 解析席位模型 → 取该 phase 的 `outputs.item` → kind 与落盘路径；
2. 生成骨架：表头 = kind columns 的 `label`（校验用 `id`）；行 = `checklist.items[]`（`no` 升序），初始一律写 `[人工]`（必带前缀，不留空格）；
3. 逐行逐判据：`checkCriteria[criterion].observable` 中可机判 op（`fieldNonEmpty` / `fieldEnumIn` / `lineExists` / `quoteInLine` / `countGte` / `fieldsEq`）→ 取数、写 `[机算]` 结果与证据；**未列入的 op（如 `coversAll` / `setSubset` / `allExist`）一律按 `[待判]`，不猜**；
4. 不可机判 → `[待判]`，附 `residual.reason`；
5. 写盘：仅新增/补空，不改已填（D4）；失败按 D8。

**夹具**：`tmp/fixtures/ledger-fill/round{1,2,3}/round-check.md`，来源 = 试点前 3 轮副本；首次生成后记录 sha256 作为冻结值，后续只读比对。

## 5 定位器（`query.mjs`）

| 子命令 | 输入 | 输出 |
|---|---|---|
| `index` | 产物文件 + kind | `{rows:[{key,line,status}], scanned, skipped}` |
| `show` | 产物文件 + `--row <键>` 或 `--where <列>=<值>` + `--fields` + `--context N`（默认 1，上限 5） | `{matches:[{line,row,context}], scanned, skipped}` |

规则：多命中按 `line` 升序；跨节时在 `context` 中标 `section` 边界；`skipped>0` → exit 1；不写盘。

## 6 校验（`verify.mjs`）

| 检查 | 判红条件 |
|---|---|
| 表头 | 表头 label 序列 ≠ kind.columns 的 label 序列（按 id 对齐） |
| 行集合 | 行键集合 ≠ `checklist.items[].no` |
| 待判 | 格内有三态前缀但无判定值；`skipped>0` 视为解析失败 |
| 空值 | 违反 PRD §6.3 空值合法清单（`hit` 可空证据；`miss`/`na` 必须 reason/applicability） |
| 机算 | `[机算]` 格为空或与证据栏 provenance 不匹配（命令 / 首行 / 时刻 / 退出码缺失） |
| 只读 | 由调用方用 Node `crypto.createHash('sha256')` 比对前后值（Windows 无 `sha256sum`；`verify` 自身不写盘） |

`verify` 只产出 `{reds:[{line,col,code,reason}]}`，不改内容；复核席据此签署。

**red code 封闭集**：`header_mismatch` / `row_keys_mismatch` / `pending_unmarked` / `pending_unfilled` / `machine_empty` / `machine_overwritten` / `missing_reason` / `missing_applicability` / `duplicate_keys` / `parse_failed`。

## 7 与既有件的关系

- `tools/docgen/builders/agents/ledger.mjs`：生成器改为「列取 kind、行不预置」；手改即红纪律不变。
- `tools/execution-matrix/markdown-rows.mjs`：表格切分/围栏掩码的唯一实现，`query` 与 `verify` 共用。
- `scs ledger numbers` / `check landings` / `ledger gate`：作为 `fill` 的取数源；`query` 不重复实现。**契约**：最低版本以 `scs --version` 实测记录进夹具元信息；「输出首行」= stdout 第一行，逐字节比对；版本不同以记录版本为准，不跨版本比对。
- `check-all.mjs`：新增两条断言（见 §3 同步改动）。

## 8 验收映射（PRD §6 → testcase）

| PRD | 设计落点 | testcase |
|---|---|---|
| §6.1-1 试点与基线 | `fill.mjs` + 固定 3 轮夹具 | 见 testcase 覆盖矩阵 |
| §6.1-2 错填归零 | D8 + `verify` | 同 |
| §6.1-3 防覆盖 | `verify` 机算格检查 + 复核席 | 同 |
| §6.1-4 防漏判 | `verify` 待判/空值检查 | 同 |
| §6.1-5 可复算 | D3 provenance 格式 | 同 |
| §6.1-6 定位准确 | `query show` 行号 | 同 |
| §6.1-7 零命中≠解析失败 | `scanned/skipped` + exit code | 同 |
| §6.1-8 只读 | `query` 不写盘 | 同 |
| §6.1-9 键同源 | D2 | 同 |
| §6.2-1/2 观测 | 运行记录 | 同 |

## 9 与 PRD 的差异（需在差异清单中确认）

1. **D1 细化**：PRD §7 写「列 = `templates.columns`」，本设计把列真相上移到 kind 级，席位只引用 kind。理由：同 kind 多席共享一份列，按席各存必漂移。三源一致的目标不变。
2. **资产不再预置具体行**：PRD 未规定资产行数来源；本设计取「行 = checklist」，资产只留表头与说明。
3. **provenance 不新开列**：时刻与命令写在证据栏内，避免加列破坏既有模板。

## 10 风险

| 风险 | 缓解 |
|---|---|
| `outputFormats` 改动被误认为牵动 18 席卡面 | 卡面取模型 `outputFormat`（`sections.mjs:191`），不消费 `outputFormats`；本设计只改进产物侧与 assets，卡面不重生成（PRD §3） |
| 解析器要兼容既有账本写法 | 共用 `markdown-rows` 口径；差异写进负例 |
| 公共 CLI 上移造成双实现 | D7：上移同批删除本仓实现 |

## 11 非目标

- 不做语义判断、不做语义检索、不改评审流程、不新增产物类型。
- 不在本设计内改卡面文本；卡面与列的派生属独立前置需求。

## 12 与 testcase 的对账决议（D1–D9）

> 来源：独立 senior-sdet 的 testcase §3 提出 9 处歧义，本节逐条定版；差异留档见 `2026-11-13-ledger-script-fill-design-testcase-diff.md`。

| # | 议题 | 决议 |
|---|---|---|
| D1 | 行键基准（0 起 vs 1 起；8 项 vs 资产 6 行） | 行键 = `checklist.items[].no`（1 起，共 8 项）；资产行由 checklist 生成，「第 0 项」命名随之废止；PRD §6.1-6 已同步为第 1/4/6 项 |
| D2 | 表头按 4 列还是 8 列 | 以 kind 级 `columns`（8 列）为准；现有 4 列资产属待修复缺陷，P0 blocker 未解除前不得开工 |
| D3 | 三态按列还是按节 | 表格内按格标注；独立小节（结论 / 打回清单）在节标题前缀 `[人工]` |
| D4 | 「待判允许空」与「必须带标记」字面冲突 | 「空」= 无判定值；物理上写 `[待判]`（非空）。PRD §6.3 已按此澄清 |
| D5 | `skipped` 语义与判红依据 | `skipped` = 解析失败的数据行数；判红依据 = 退出码 ≠ 0（由 `skipped > 0` 触发）；0 命中 = `hits=0 && skipped=0 && exit 0` |
| D6 | 上下文 N 的行数口径 | `--context N` = 命中行前后**各** N 行（不含本行），默认 1；跨节时在 `context` 内标 `section` 与边界行号 |
| D7 | 取数时刻的粒度 | 每个机算格各写一次（命令 + 输出首行 + 时刻含时区） |
| D8 | 幂等与表头 / 节重写的相容 | 首次生成完整骨架；骨架已存在则只补 `[待判]` 位，不重建表头 / 节、不改已填格（含时刻） |
| D9 | `scanned` 是否含表头 | 只计数据行（不含表头、说明、小节行）；仅表头时 `scanned=0` |
