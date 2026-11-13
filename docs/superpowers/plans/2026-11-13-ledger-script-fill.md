# 实施计划：账本产物「脚本填充 + 行定位 + AI 判值」

> 依据：PRD `docs/prd/20261113124838-ledger-script-fill.md` v3.1；spec `docs/superpowers/specs/2026-11-13-ledger-script-fill-design.md`；testcase `2026-11-13-ledger-script-fill-design-testcase.md`（25 条）。
> 状态：待计划门（机械核对 + 独立审计签字）。
> 落点：`tools/review-ledger/`（spec D7）；不得落 `.session`。

## 1 前置（P0 blocker，未解除不得进 T2）

| # | 任务 | 改动 | 验收 |
|---|---|---|---|
| T0.1 | 建 kind 注册表 | `outputFormats.mjs` 增 `kinds.<kind>.{columns[{id,label}], blocks}`；列 label 按 spec §3 对照表 | 8 列 id/label 齐；每种 kind 可解析 |
| T0.2 | 席位 templates 去 columns | 18 席 `index.json` 的 `templates.<id>` 改为 `{skill, label, kind}` | `generate --check` 零漂移（卡面「产出」只读 label） |
| T0.3 | 生成器改列来源、行不预置 | `ledger.mjs` 从 `kinds` 取列；`skills/parliament-ledger/assets/*.md` 只留表头与说明 | assets 重生成；手改仍即红（`check-all` ledger 段） |
| T0.4 | 新增两条构建断言 | `check-all.mjs`：assets 表头 == kind labels；席位 `kind` 可解析 | `npm run check` 全绿 |
| T0.5 | 三源一致校验 | 一次性脚本或测试：`checklist.items[].no` 集合 == 表行键 == kind 列数口径 | 集合逐项相等；不等即阻断 T2（对应 TC-01/06/25） |

## 2 任务表

| # | 任务 | 依赖 | 改动文件 | 验收（命令 / 结果） | 覆盖 TC |
|---|---|---|---|---|---|
| T1 | 解析库 `lib/parse.mjs`：表格切分（复用 `markdown-rows.mjs`）、围栏掩码、CRLF/BOM、转义竖线、三态识别、`scanned/skipped` | T0 | `tools/review-ledger/lib/parse.mjs` | 单测：坏行计 skipped、围栏内不计、BOM/LF 输出一致 | TC-13/14/19/20/21 |
| T2 | 填充器 `fill.mjs`：骨架、三态、可算 op 取数、幂等、失败处理 | T0、T1 | `tools/review-ledger/fill.mjs` | 单测 + 夹具：骨架 8 列 label；机算格带 provenance；重跑 sha256 不变 | TC-01/02/03/04/08、TC-24 |
| T3 | 定位器 `query.mjs`：`index` / `show`、行号 1-based、`--context N`、`skipped` 与 exit 语义、只读 | T0、T1 | `tools/review-ledger/query.mjs` | 单测 + 夹具：固定 3 键行号一致；0 命中 exit 0；坏行 exit≠0；前后 sha256 相同 | TC-06/07/13/14/15/19/20/21/23/25 |
| T4 | 校验器 `verify.mjs`：表头/行集合/待判/空值/机算/red code 封闭集 | T2、T3 | `tools/review-ledger/verify.mjs` | 单测：6 类判红各有 code；无误时 `reds:[]` 且 exit 0 | TC-05/11/12/18/22/24 |
| T5 | 夹具集 | T1 | `tmp/fixtures/ledger-fill/{clean,round1..3,long,bad-row,dup-key,fenced,crlf,bom,escaped-pipe}` | 夹具清单与 sha256 冻结记录 | TC-09/10/16（作为输入） |
| T6 | 单测与集成测试 | T2、T3、T4、T5 | `tools/review-ledger/test/*.test.mjs` | `node --test tools/review-ledger/test` 全绿；`npm run check` 含入 | TC-01..25（可自动化部分） |
| T7 | 试点：reviewer-audit `round-check` 3 轮 | T6 | 记录落 `docs/reports/2026-11-13-ledger-script-fill-pilot/`（`baseline.md` / `after.md` / `observe.md`）；夹具副本仍在 `tmp/fixtures/ledger-fill/` | 基线/试点后各 3 轮 `errors=0`；观测项出数 | TC-09/10/16/17 |
| T8 | 收口 | T7 | 交接 `docs/handoffs/`（新文件，不改旧交接）；签字 `docs/devworkflows/20261113-ledger-script-fill/gate-record.md`；plan 勾选 | `npm run check` 全绿；工作树 clean | — |

## 3 依赖与无环

```
T0 → T1 → T2 ─┐
      └→ T3 ─┴→ T4 → T6 → T7 → T8
T1 → T5 → T6
```

- 无环：T2/T3 互不依赖；T5 只依赖 T1，T6 依赖全部实现任务。
- T2 与 T3 可并行；T5 可在 T1 完成后即开始。

## 4 功能点覆盖（PRD F1–F8）

| F | 任务 |
|---|---|
| F1 骨架生成 | T0.3、T2 |
| F2 可算项预填 | T2 |
| F3 待判留空 | T2、T4 |
| F4 三态 + provenance | T2、T4 |
| F5 写后校验 | T4 |
| F6 产物索引 | T3 |
| F7 行定位 | T3 |
| F8 重跑幂等 | T2 |

## 5 计划门核对

| 核对项 | 口径 | 状态 |
|---|---|---|
| 功能点全覆盖 | F1–F8 均有任务，见 §4 | 过（审计项 1，plan:43-52） |
| 任务与 TC 一一映射 | 25 条 TC 均有归属，见 §2 | 过（审计项 2，25/25） |
| 依赖无环 | §3 图 | 过（审计项 3） |
| 落点合规 | 代码 → `tools/review-ledger/`；夹具 → `tmp/fixtures/`；试点记录 → `docs/reports/2026-11-13-ledger-script-fill-pilot/`；交接 → `docs/handoffs/`；签字 → `docs/devworkflows/20261113-ledger-script-fill/gate-record.md`；**不落 `.session`** | 过（复审项 4，plan:27-28、:61） |
| 独立审计签字 | 由非本计划作者的 reviewer-audit 实例核对本表并签署 | 已签（reviewer-audit 独立实例，2026-11-13，计划门通过） |

## 6 风险

| 风险 | 缓解 |
|---|---|
| T0.2 改 templates 引发卡面漂移 | 先 `generate --check`；若漂移，按规则重生成 18 卡并跑 B3 独立重判 |
| 夹具生成依赖历史账本 | 用试点前 3 轮副本；副本 sha256 记录，缺失则阻断 T7 |
| 解析口径与既有账本不兼容 | T1 单测先行；负例覆盖围栏/CRLF/转义 |
| `scs` 版本差异 | 记录 `scs --version` 进夹具元信息；跨版本不比首行 |

## 7 进度

- [x] T0.1 kind 注册表
- [x] T0.2 席位 templates 去 columns
- [x] T0.3 ledger.mjs 列来源、行不预置
- [x] T0.4 check-all 两条断言
- [x] T0.5 三源一致校验
- [x] T1 解析库
- [ ] T2 填充器
- [ ] T3 定位器
- [ ] T4 校验器
- [ ] T5 夹具集
- [ ] T6 单测与集成
- [ ] T7 试点 3 轮
- [ ] T8 收口
