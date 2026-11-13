# 设计：rule 与 agent 文档体系拉齐（共享渲染 / CLI / 基线）

> 状态：定稿（2026-11-13）。依据 PRD `docs/prd/20261113160000-rule-agent-render-alignment.md` v0.5.1（4 轮三方评审，P0=0）。
> 范围：rule/agent 渲染、RuleModel 校验、CLI/gate、基线/golden、质量门；不改 rule 文案与评分口径，不激活休眠 rule。
> testcase：`docs/superpowers/specs/2026-11-13-rule-agent-render-alignment-design-testcase.md`（独立 senior-sdet 编写）。
> 代拟：主 agent（spec 作者）；testcase 作者不是本文件作者。

## 1 设计目标

把两套文档投影收敛到一套共享块渲染与一套 CLI/基线，同时保持 18 席卡与 5 份 rule 投影逐字节不变。对应 PRD F1–F4、F6；F5 为候选，首期不做。

## 2 决策

| # | 决策 | 理由 |
|---|---|---|
| D1 | 共享 IR 落 `tools/docgen/render/index.mjs`；块类型 = `h1/h2/h3/para/notes/bullets/ordered/blank/raw`；`renderBlocks(blocks)` 以 `\n` 连接，不自动加尾换行 | 只抽两侧实际用到的块；尾换行由调用方控制，才能逐字节不变 |
| D2 | 首期不做 table/转义；`raw` 只给 agent 旧段做迁移垫片，rule 侧必须用结构化块 | 两侧当前都没有 table/转义实现，提前抽象会引入未验证路径 |
| D3 | agent 侧按段迁移：`sections.mjs` 的段函数逐段改为返回 `Block[]`，`renderModel` 最后统一调 `renderBlocks`；每迁一段跑 18 席逐字节回归 | 18 席卡是硬回归面；一次性重写风险不可控 |
| D4 | RuleModel 是门面，不是第二语义源：`tools/docgen/builders/rules/schema.mjs` 导出 `RuleModel.validate()`，委托同文件 `check()` / `checkTestcase()` | 判定语义已有唯一实现；门面只补类型入口与统一返回；不新增 `types.mjs`，避免第二入口 |
| D5 | `build.mjs` 增 `--data-dir` / `--out-dir` / `--rules-dir`（env `DOCGEN_RULES_DATA_DIR` / `DOCGEN_RULES_OUT_DIR` / `DOCGEN_RULES_DIR` 兜底）；默认仍为仓内目录 | 输入与输出都可重定向，负例与全量 build 测试才能不碰仓内文件 |
| D6 | CLI `--kind rule --check` 分两路：registered 比 `rules/<id>.md`；非 registered 比 `builders/rules/<id>.md`；漂移 exit 1、缺件 exit 2；preview 仍只对 registered | PRD F3 只补非 registered 的 check；preview 不在范围内 |
| D7 | `BASELINE_RULES` 由 `rules.json` 派生：`listRuleIds().map(id => 'rules/'+id+'.md')`；同步更新 `check-observable.test.mjs:575` 为派生断言（非空 + 条数 = `rules.json.rules.length`） | 注册唯一源；只删守卫会丢保护 |
| D8 | M0a 只读冻结（git SHA + sha256 + 基线报告，无需 D19 授权）；M0b 写盘验证（`build.mjs`，需 D19 授权 + 独立分支） | 只读基线可先做；写盘是 D19 约束点 |
| D9 | 5 份 rule 投影的逐字节比对沿用 `npm run check` 的 criteria-engine；新增 `tools/docgen/render/render.test.mjs` 直调新引擎做独立 golden | 现有 criteria-engine 已覆盖 5 份投影，不另立重复门 |
| D10 | 质量门：57% 为已知债；任一 active rule 降 ≥1 分或新增红点即中止；回滚三步（restore → clean 新建件 → status 白名单） | 结构拉齐不承诺提分；中止必须有可执行退路 |
| D11 | 文档联动：`docs/prd/docgen-index.md` D19/P3/P4 状态、`README.md` 的 baseline 说明、`skills/rule-writer/references/criteria-dsl.md` 随 M0b/M3 同步 | 避免代码改了、入口文档仍写旧口径 |
| D12 | F5 共享外壳首期不做；只保留「领域字段不进共享层」约束；触发 = 出现第二个消费 `sections`/`tests` 的模型 | 无第二消费者，提前抽象会漂移 |

## 3 共享 IR 与渲染引擎（F1）

### 3.1 API

`tools/docgen/render/index.mjs` 导出：

| 导出 | 签名 | 输出 |
|---|---|---|
| `h1/h2/h3` | `(text) => Block` | `# text` / `## text` / `### text` |
| `para` | `(text) => Block` | `text` |
| `notes` | `(text) => Block` | `> text` |
| `bullets` | `(items) => Block` | 每项 `- item` |
| `ordered` | `(items) => Block` | 每项 `${i+1}. item` |
| `blank` | `() => Block` | `''` |
| `raw` | `(lines) => Block` | 原样行（仅 agent 迁移垫片） |
| `renderBlocks` | `(blocks) => string` | 按 `\n` 连接，不自动加尾换行 |

`Block = { kind, text? , items? , lines? }`；`renderBlocks` 只做拼接，不做 Markdown 转义。

### 3.2 rule 侧

`tools/docgen/builders/rules/interpreters.mjs` 的 `renderDoc` 改为：

```text
h1(title) · blank · notes("触发：" + renderTrigger(rule)) · blank ·
para("义务（全部成立才合规；缺一件 = 不合格）：") · ordered(assert 行) · blank ·
[para("另见：" + refs.join("、"))] · para("落点：" + landing)
```

`renderBlocks(blocks) + '\n'` 必须与现输出逐字节相等（`rules/evidence-before-conclusion.md` 与 5 份 `builders/rules/*.md`）。

### 3.3 agent 侧

`tools/docgen/models/agents/render/index.mjs` 的 `renderModel` 改为收集 `Block[]` 后调 `renderBlocks`。`sections.mjs` 的段函数逐段迁移：

- 先迁 `frontmatter`、`duty`、`must`、`never` 等纯标题/段落/列表段；
- 复杂段暂用 `raw(lines)`，但最终仍走同一 `renderBlocks`；
- 每迁一段跑 `npm run check` 与 18 席逐字节比对。

### 3.4 M1 出口

`tools/docgen/render/render.test.mjs` 直接调新引擎渲染 5 个 rule model，与 `builders/rules/*.md` 逐字节比；`tools/docgen/**/*.mjs`（排除 `*.test.mjs`）内 `renderDoc` 标识符 0 命中（`docs/**` 历史归档豁免）；删除 `tools/docgen/render/index.mjs` 必须使 `npm run check` 变红。测试文件可在负例描述中出现 `renderDoc` 字样，不计入扫描。

## 4 RuleModel 与校验（F2）

### 4.1 门面

`tools/docgen/builders/rules/schema.mjs` 增：

```text
RuleModel.typeName = 'RuleModel'
RuleModel.fields = { id, impl, type, scope, title, when, assert, residual, refs, landing }
RuleModel.validate(rule, { testcase, ruleIds }) => Finding[]
```

`validate` 只做两件事：调同文件 `check(rule, name, findings)`；有 `testcase` 时调同文件 `checkTestcase(testcase, name, ruleIds, errors)`。无 `testcase` 时返回 `MissingTestcase`。不复制算子/组合/深度判定；返回数组，不抛异常。

### 4.2 负例

`tools/docgen/builders/rules/schema.test.mjs`（新建）：

| 负例 | 期望 |
|---|---|
| 缺 `landing` | `check()` 返回 `code=Schema` |
| 非法 op | `code=Schema` 且 `message` 含 `op 未注册`，finding 条数 = 1 |
| `type` 越界 | `code=TypeInvalid` |
| 无 testcase | `RuleModel.validate` 返回 `MissingTestcase` |

`build.mjs --data-dir <tmp>` 跑「有 rule json、无 testcase」的临时目录：exit 1，输出含 `判据无 testcase`；临时目录不写 `rules/`。

## 5 CLI / gate / baseline（F3/F4/Q4）

### 5.1 CLI 行为

| 命令 | 行为 | 退出码 |
|---|---|---|
| `generate --kind rule --name <id> --check`（registered） | 渲染 `rules/<id>.md` 逐字节比对 | 漂移 1 / 无漂移 0 |
| `generate --kind rule --name <id> --check`（非 registered） | 基准路径先分流到 `builders/rules/<id>.md`，再逐字节比对 | 漂移 1（`Mismatch`）/ 缺件 2（`DanglingBaselineEntry`） |
| `generate --kind rule --name <id> --preview` | 只写 `tmp/preview/rules/<id>.md`；仅 registered | 0 / 缺件 2 |
| `gate` | 18 席 + `BASELINE_RULES.length` 条 registered rule + 未登记手写扫描；`baseline N/N` 中 N = 18 + `BASELINE_RULES.length`，不得写死 19 | 漂移/缺件 1–2 |
| `npm run check` | criteria-engine 覆盖 5 份投影 + 5 份 testcase | 非 0 即红 |

### 5.2 注册派生（Q4）

`tools/docgen/builders/agents/components/baseline.mjs`：

```text
import { listRuleIds } from '../../rules/rules.mjs'
export const BASELINE_RULES = listRuleIds().map(id => `rules/${id}.md`)
```

`check-observable.test.mjs:575` 改为断言：`BASELINE_RULES` 非空；等于 `rules.json.rules.map(id => 'rules/'+id+'.md')`；条数等于 `rules.json.rules.length`。不得只删守卫。

### 5.3 基线报告

M0a 产出 `docs/reports/<日期>-rule-baseline/baseline.json`，字段固定：

```text
{ ruleId, score, max, rate, level, reds[], exitCode, scsVersion, nodeVersion, annotationsSha256 }
```

`exitCode` 记整次 `scs check rules` 进程退出码；per-rule 条目同值，不是单条独立分数。同时记录 `git rev-parse HEAD`、`rules/*.md` 与 `builders/rules/*.md` 的 sha256；`annotations` 缺失即失败。M0a 记录/清空 `DOCGEN_RULES_DIR`、`DOCGEN_AGENTS_DIR`、`DOCGEN_BASELINE_PATH`、`DOCGEN_TMP_ROOT` 四个环境变量。

## 6 质量门与回滚（F6）

- 基线：1 条 active rule，13 / 23（57%，不及格）；本 PRD 只做结构拉齐，不要求提升分数；分数意外 +1 不判红。
- 复评：同命令、同 `scs`/`node`、同 annotations；任一 active rule 降 ≥1 分或新增红点即中止。
- 回滚（用户执行）：`git restore --source=<M0a SHA> --staged --worktree -- rules/ tools/docgen/` → `git clean -fd -- tools/docgen/render tools/docgen/builders/rules/schema.test.mjs` → `git status` 只剩白名单。
- 白名单未跟踪件：本 PRD、handoff、`docs/reports/<日期>-rule-baseline/`、`docs/superpowers/specs/2026-11-13-rule-agent-render-alignment-design*.md`、`docs/devworkflows/20261113161413-rule-agent-render-alignment/`、`tmp/`（gitignored）。所有测试夹具落 `tmp/`，回滚不处理。
- D19：M0a 无需授权；M0b/M1 前需用户明确重启，并同步 `docgen-index.md:44` 的 D19 与 P3/P4 状态。

## 7 里程碑

| # | 出口 |
|---|---|
| M0a | §6.1 M0a 证据齐（git SHA、sha256、基线报告）；无需 D19 授权 |
| M0b | §6.1 M0b 在 D19 授权后、独立分支执行；前后 sha256 一致 |
| M1 | §3.4 全过；18 席 + 5 份 rule 投影逐字节不变 |
| M2 | §4 全过；`schema.test.mjs` 负例齐 |
| M3 | §5 全过；Q4 派生断言与 `check-observable.test.mjs:575` 更新完成 |
| M4 | 可选四维；另立 PRD，不阻塞 M0a–M3 |

## 8 验收映射（PRD §6 → testcase）

| PRD | 设计落点 | testcase |
|---|---|---|
| §6.1 M0a/M0b | §5.3、§6 | 见 testcase 覆盖矩阵「基线/授权」 |
| §6.2 逐字节 + 新引擎被消费 | §3 | 见「渲染/golden」 |
| §6.3 RuleModel/schema | §4 | 见「schema 负例」 |
| §6.4 CLI/gate | §5.1/§5.2 | 见「CLI/gate」 |
| §6.5 质量分数 | §6 | 见「质量门/回滚」 |
| §6.6 agent 不回归 | §3.3/§3.4 | 见「18 席回归」 |
| §6.7 可选四维 | §11 | 非目标；观测项 |

## 9 与 PRD 的差异

| # | 差异 | 理由 |
|---|---|---|
| 1 | IR 只含 h1/h2/h3/para/notes/bullets/ordered/blank/raw；不含 table/转义 | 两侧当前都无实现；首期不预造 |
| 2 | `build.mjs` 增 `--data-dir` / env 注入 | 「无 testcase」负例在编排层，单测需可注入目录 |
| 3 | `BASELINE_RULES` 派生并同步测试 | Q4 注册唯一源；防止只改实现丢了守卫 |
| 4 | preview 仍只对 registered；非 registered 只补 `--check` | PRD F3 的范围 |
| 5 | M0 拆 M0a/M0b | 只读冻结与授权写盘分离 |

## 10 风险

| 风险 | 缓解 |
|---|---|
| 18 席逐字节回归 | 按段迁移；每段跑 `npm run check`；`render.test.mjs` 直调新引擎 |
| 5 份 rule 投影漂移 | criteria-engine 已逐字节比对；M0a 冻结 sha256 |
| 57% 质量债 | 只做结构拉齐；降分即中止回滚 |
| D19 授权未获 | M0a 可先做；M0b/M1 前必须用户重启 |
| `renderDoc` 口径过宽 | 只查 `tools/docgen/**/*.mjs`，`docs/**` 豁免 |

## 11 非目标

- 不改 rule 文案、评分维度、满分口径；不激活休眠 rule；不做四维；不做 table/转义；不做 F5 共享外壳。
- 不改 agent 卡文本；18 席输出逐字节不变。

## 12 与 testcase 的对账决议

testcase 独立编写（明细 59 条；`size` 计数 62/80；正 21 / 负 25 / 边界 9 / 观测 4），本 spec 对 §3 的 12 条疑点逐条定版：

| # | 议题 | 决议 |
|---|---|---|
| D1 | 非 registered `--check` 基准 | 在 `rules/<id>.md` 存在性检查之前分流：非 registered 用 `builders/rules/<id>.md`；漂移 `Mismatch` exit 1，缺件 `DanglingBaselineEntry` exit 2；registered 仍用 `rules/<id>.md` |
| D2 | `renderDoc` 0 命中范围 | 只扫 `tools/docgen/**/*.mjs` 且排除 `*.test.mjs`；`docs/**` 与测试负例描述豁免；新引擎导出名是 `renderBlocks`，不保留 `renderDoc` |
| D3 | `validate` 契约 | 返回 `Finding[]`，不抛；放在 `schema.mjs`，不新增 `types.mjs`；TC-15/16 的 `schema.mjs` 导入成立 |
| D4 | 5 份 sha256 vs dormant 无 golden | 5 份 sha256 是基线证据；dormant 逐字节比对沿用 criteria-engine，不建独立 golden 文件 |
| D5 | per-rule `exitCode` | 记整次命令退出码，per-rule 同值；不断言单条独立退出码 |
| D6 | F6 与“不提升” | F6 判据是“不下降”；“不提升”改为“不要求提升”，意外 +1 不判红 |
| D7 | gate 19 的计数 | `N = 18 + BASELINE_RULES.length`；不写死 19；rules.json 增长时 N 随之变 |
| D8 | 回滚白名单全集 | 生产新建件只清 `tools/docgen/render` 与 `builders/rules/schema.test.mjs`；夹具全落 `tmp/`；白名单见 §6 |
| D9 | 额外 env | M0a 同时记录/清空 `DOCGEN_BASELINE_PATH`、`DOCGEN_TMP_ROOT` |
| D10 | `BASELINE_RULES` 字面量 | 不再保留 `export const BASELINE_RULES = [` 字面量；测试改派生断言（非空 + 条数 + 等式） |
| D11 | M0a 白名单目录 | 见 §6：PRD / handoff / `docs/reports/...-rule-baseline/` / spec+testcase / 本任务 gate-record / `tmp/` |
| D12 | M0a 只写报告 | M0a 只新建 `docs/reports/...-rule-baseline/`；M0b 才写 `rules/*.md` 与 `builders/rules/*.md` |

testcase 侧需同步 3 处命令（差异见 `2026-11-13-rule-agent-render-alignment-design-testcase-diff.md`）：TC-04 扫描排除 `*.test.mjs`；TC-21 的 build 测试加 `--out-dir`/`--rules-dir`；TC-43 的 env 清单补两个变量。
