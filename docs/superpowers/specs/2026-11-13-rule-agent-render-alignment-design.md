# 设计：rule 与 agent 文档体系拉齐（共享渲染 / CLI / 基线）

> 状态：定稿（2026-11-13）。依据 PRD `docs/prd/20261113160000-rule-agent-render-alignment.md` v0.5.1（4 轮三方评审，P0=0）。
> 范围：rule/agent 渲染、RuleModel 校验、CLI/gate、基线/golden、质量门；不改 rule 文案与评分口径，不激活休眠 rule。
> testcase：`docs/superpowers/specs/2026-11-13-rule-agent-render-alignment-design-testcase.md`（独立 senior-sdet 编写）。
> 代拟：主 agent（spec 作者）；testcase 作者不是本文件作者。

## 0 术语

| 术语 | 含义 |
|---|---|
| IR | 中间表示：两侧共用的块序列，不读领域字段 |
| block | 渲染块节点：`{kind,text|items|lines}` |
| golden | 冻结的基准副本；本 spec 用 M0a sha256 与 `render.test.mjs` 直调 |
| registered | `rules.json.rules` 内的 rule id |
| dormant | 有 model 但不在 `rules.json` 的 rule |
| 投影 | 由 rule json 渲染出的 md 副本，不是数据源 |
| M0a / M0b | M0a 只读冻结；M0b 授权写盘 |

## 1 设计目标

把两套文档投影收敛到一套共享块渲染与一套 CLI/基线，同时保持 18 席卡与 5 份 rule 投影逐字节不变。对应 PRD F1–F4、F6；F5 为候选，首期不做。

## 2 决策

| # | 决策 | 理由 |
|---|---|---|
| D1 | 共享 IR 落 `tools/docgen/render/index.mjs`；块类型 = `h1/h2/h3/para/notes/bullets/ordered/blank/raw`；`renderBlocks(blocks)` 以 `\n` 连接，不自动加尾换行 | 只抽两侧实际用到的块；尾换行由调用方控制，才能逐字节不变 |
| D2 | 首期不做 table/转义；`raw` 只给 agent 旧段做迁移垫片，rule 侧必须用结构化块 | 两侧当前都没有 table/转义实现，提前抽象会引入未验证路径 |
| D3 | agent 侧按段迁移：`sections.mjs` 的段函数逐段改为返回 `Block[]`，`renderModel` 最后统一调 `renderBlocks`；每迁一段跑 18 席逐字节回归 | 18 席卡是硬回归面；一次性重写风险不可控 |
| D4 | RuleModel 是门面，不是第二语义源：`tools/docgen/builders/rules/schema.mjs` 导出 `RuleModel.validate()`，委托同文件 `check()` / `checkTestcase()` | 判定语义已有唯一实现；门面只补类型入口与统一返回；不新增 `types.mjs`，避免第二入口 |
| D5 | `build.mjs` 增 `--data-dir` / `--out-dir` / `--rules-dir`（env `DOCGEN_BUILD_DATA_DIR` / `DOCGEN_BUILD_OUT_DIR` / `DOCGEN_BUILD_RULES_DIR` 兜底）；默认仍为仓内目录；`DOCGEN_RULES_DIR` 保留给 gate 扫描，不承载 build 写盘 | 输入与输出都可重定向；env 不与既有 gate 扫描同名双义 |
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
para("义务（全部成立才合规；缺一件 = 不合格）：") ·
...rule.assert.map((a, i) => para(renderObligation(a, i))) · blank ·
[para("另见：" + refs.join("、"))] · para("落点：" + landing)
```

`renderObligation` 自带 `${index+1}. ` 前缀，`notForbiddenCommand` 还会内嵌 `\n   - 允许/禁止` 续行；因此 assert 段必须用 `para(renderObligation(a,i))`，不得再包 `ordered`。`ordered` 只用于“不含编号、无内嵌换行”的纯项。

`renderBlocks(blocks) + '\n'` 必须与现输出逐字节相等（`rules/evidence-before-conclusion.md` 与 5 份 `builders/rules/*.md`）。

### 3.3 agent 侧

`tools/docgen/models/agents/render/index.mjs` 的 `renderModel` 改为收集 `Block[]` 后调 `renderBlocks`。`sections.mjs` 的段函数逐段迁移：

- 先迁 `frontmatter`、`duty`、`must`、`never` 等纯标题/段落/列表段；
- 复杂段暂用 `raw(lines)`，但最终仍走同一 `renderBlocks`；
- 每迁一段跑 `npm run check` 与 18 席逐字节比对。

### 3.4 M1 出口

`tools/docgen/render/render.test.mjs` 直接调新引擎渲染 5 个 rule model，与 `builders/rules/*.md` 逐字节比；**5/5 字节相等必须写成显式断言**（不能只看 TAP 计数）。`tools/docgen/**/*.mjs`（排除 `*.test.mjs`）内 `renderDoc` 标识符 0 命中（`docs/**` 历史归档豁免）；删除 `tools/docgen/render/index.mjs` 必须使 `npm run check` 变红。测试文件可在负例描述中出现 `renderDoc` 字样，不计入扫描。

## 4 RuleModel 与校验（F2）

### 4.1 门面

`tools/docgen/builders/rules/schema.mjs` 增：

```text
function validate(rule, { testcase, ruleIds } = {}) { /* returns Finding[] */ }
export const RuleModel = { typeName: 'RuleModel', fields: [...], validate }
```

`validate` 的实现顺序与返回契约（统一 `Finding[] = {code, message}[]`，不抛异常）：

1. `const name = rule?.id ?? 'rule'`；**先**调 `check(rule, name, findings)`（schema 错永远先被收进来，不因缺 testcase 早退）。
2. 有 `testcase`（非 `undefined` 且非空对象）→ 调 `checkTestcase(testcase, name, ruleIds ?? new Set([rule.id]), rawErrors)`（**4 参**，与现签名一致）；把 `rawErrors` 每条字符串包成 `{ code: 'Testcase', message }`（保留原字符串，含 `<name>: ` 前缀），按 `check` → `Testcase` 顺序拼接。
3. 无 `testcase` → 追加 `{ code: 'MissingTestcase', message: '缺 testcase：<id>.testcase.json' }`，不调 `checkTestcase`。

不复制算子/组合/深度判定；`schema.mjs` 同时导出命名函数 `validate` 与 `RuleModel`（`fields` 为字段名数组）；TC-16/18 的 `import {validate}` 成立。

### 4.2 负例

`tools/docgen/builders/rules/schema.test.mjs`（新建）：

| 负例 | 期望 |
|---|---|
| 缺 `landing` | `check()` 返回 `code=Schema` |
| 非法 op | `code=Schema` 且 `message` 含 `op 未注册`，finding 条数 = 1 |
| `type` 越界 | `code=TypeInvalid` |
| 无 testcase | `RuleModel.validate` 返回 `[{ code: 'MissingTestcase', message }]`（先跑 `check`，合法模型时仅此 1 条） |
| testcase 缺反例 | `validate` 返回 `[{ code: 'Testcase', message }]`，message **含** `缺反例（防漏判无验证）` |

`build.mjs --data-dir <tmp>` 跑「含 `<id>.json` + `rules.json`、无 `<id>.testcase.json`」的临时目录：exit 1，输出含 `判据无 testcase`；临时目录不写 `rules/`。夹具基地一律取附录 A 骨架（`residual` 不带 `fields`），避免继承 5 份模型的字段引用而多报 `FieldLabelMissing`。

## 5 CLI / gate / baseline（F3/F4/Q4）

### 5.1 CLI 行为

| 命令 | 行为 | 退出码 |
|---|---|---|
| `generate --kind rule --name <id> --check`（registered） | 渲染 `rules/<id>.md` 逐字节比对 | 漂移 1 / 无漂移 0 |
| `generate --kind rule --name <id> --check`（非 registered） | 在 `o.path=rules/<id>.md` 存在性检查之前分流：用 `renderRule(id)` 渲染，基准 `builders/rules/<id>.md`；不得再受 `RENDERED_RULES.includes` 限制 | 漂移 1（`Mismatch`）/ 缺件 2（`DanglingBaselineEntry`） |
| `generate --kind rule --name <id> --preview` | 只写 `tmp/preview/rules/<id>.md`；仅 registered | 0 / 缺件 2（`MissingComponentData`） |
| `gate` | 18 席 + `BASELINE_RULES.length` 条 registered rule + 未登记手写扫描；`baseline N/N` 中 N = 18 + `BASELINE_RULES.length`，不得写死 19 | 漂移/缺件 1–2；未登记 `UnregisteredHandwritten` 2 |
| `npm run check` | criteria-engine 覆盖 5 份投影 + 5 份 testcase | 非 0 即红 |

错误码沿用现状：非 registered 漂移 `Mismatch`（1）、缺件 `DanglingBaselineEntry`（2）；preview 缺件 `MissingComponentData`（2）；未登记手写 `UnregisteredHandwritten`（2）。**输出契约**：漂移/缺件/未登记错误写 stderr，格式 `Mismatch: <path>` / `DanglingBaselineEntry: <path>` / `UnregisteredHandwritten: <path>`；stdout 只保留 `baseline N/N` 等汇总。TC-23/25/26/30/31 断言 stderr。

`build.mjs` 的目录参数按三元组 `dirs = { dataDir, outDir, rulesDir }` 透传，三者语义唯一、不得互换：

| 参数 | 语义 | 默认值 |
|---|---|---|
| `dataDir` | **平铺数据目录**，必须同时含 `<id>.json` 与 `rules.json`（同目录；不再接受仓根） | 仓内 `tools/docgen/models/rules` |
| `outDir` | **解释器投影目录**：写 `<id>.<ext>` | 仓内 `tools/docgen/builders/rules` |
| `rulesDir` | **注册正文目录**：写 `<id>.md` | 仓内 `rules` |

`rules.mjs` 的默认值与上表一致：`loadRule(id, dataDir = DATA_DIR)` 读 `join(dataDir, id+'.json')`；`listRuleIds(dataDir = DATA_DIR)` 读 `join(dataDir,'rules.json')`；`writeRule(id, { dataDir = DATA_DIR, rulesDir = DEFAULT_RULES_DIR } = {})` 内部 `renderRuleData(loadRule(id, dataDir))` 后写 `<rulesDir>/<id>.md`；`renderRule(id, dataDir = DATA_DIR)` 同步。`DATA_DIR`/`DEFAULT_RULES_DIR` 可用 `REPO` 或 `DIR` 相对拼出，但必须解析到上表路径。

`build.mjs` 读 `<dataDir>` 扫描 `<id>.json`（排除 `rules.json` 与 `*.testcase.json`）及 `*.testcase.json`，投影写 `<outDir>`，注册正文写 `<rulesDir>`；`listRuleIds()`/`writeRule()` 的调用点必须显式传 `dataDir`/`rulesDir`，不得依赖默认值。

落地细节（实现前定版，不留二选一）：

- **建目录**：`outDir` / `rulesDir` 不存在时由 `build.mjs` `mkdirSync(..., { recursive: true })`；`dataDir` 必须已存在。
- **argv**：`build.mjs` 自建严格白名单解析（同 `cli.mjs` 的 `parseArgs` 范式）；未知旗标或旗标缺值 → `InvalidArgs` 写 stderr、exit 2。相对路径以 `process.cwd()` 为基准 `path.resolve`。
- **缺 `rules.json`**：`<dataDir>/rules.json` 不存在 → `InvalidInputPath: <dataDir>/rules.json` 写 stderr、exit 2；不得静默按空清单继续。
- **env 解析层**：`DOCGEN_BUILD_DATA_DIR` / `DOCGEN_BUILD_OUT_DIR` / `DOCGEN_BUILD_RULES_DIR` 只在 `build.mjs` 的 main 段读取；`rules.mjs` 的 `DATA_DIR`/`DEFAULT_RULES_DIR` 只由 `REPO`/`DIR` 拼出、**不读 `process.env`**，避免 `RENDERED_RULES` / `BASELINE_RULES` 两个导入期快照随环境漂移。

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

`exitCode` 记整次 `scs check rules` 进程退出码；per-rule 条目同值，不是单条独立分数。同时记录 `git rev-parse HEAD`、`rules/*.md` 与 `builders/rules/*.md` 的 sha256；`annotations` 缺失即失败。M0a 记录/清空 `DOCGEN_RULES_DIR`、`DOCGEN_AGENTS_DIR`、`DOCGEN_BASELINE_PATH`、`DOCGEN_TMP_ROOT`，以及 D5 的三个新 env（`DOCGEN_BUILD_DATA_DIR` / `DOCGEN_BUILD_OUT_DIR` / `DOCGEN_BUILD_RULES_DIR`）。

**可执行入口**：`scripts/rule-baseline.mjs`（新建）负责解析 `scs check rules` 文本为 10 字段 JSON、写 `<out>/baseline.json` 与 `<out>/manifest.json`、记录 git SHA/sha256/env；`--check-only` 只写 `<out>/`，不改任何被跟踪件；前置（被跟踪树干净、annotations 存在）不满足即 exit 2 且不落文件。`baseline.json` 顶层为数组（每元素 10 键）；`manifest.json = {gitSha, rulesSha256[], buildersSha256[], env{...}}`。M0a 用 `node scripts/rule-baseline.mjs --check-only --out docs/reports/<日期>-rule-baseline`；M0b 由 `build.mjs --data-dir/--out-dir/--rules-dir` 执行，前后 sha256 由同一脚本比对。

## 6 质量门与回滚（F6）

- 基线：1 条 active rule，13 / 23（57%，不及格）；本 PRD 只做结构拉齐，不要求提升分数；分数意外 +1 不判红。
- 复评：同命令、同 `scs`/`node`、同 annotations；任一 active rule 降 ≥1 分或新增红点即中止。
- 回滚（用户执行）：`git restore --source=<M0a SHA> --staged --worktree -- rules/ tools/docgen/ README.md skills/rule-writer/references/criteria-dsl.md docs/prd/docgen-index.md` → `git clean -fd -- tools/docgen/render tools/docgen/builders/rules/schema.test.mjs` → `git status` 只剩白名单；回滚后三份文档 `git diff` 必须为空。
- 白名单未跟踪件：本 PRD、handoff、`docs/reports/<日期>-rule-baseline/`、`docs/superpowers/specs/2026-11-13-rule-agent-render-alignment-design*.md`、`docs/devworkflows/20261113161413-rule-agent-render-alignment/`、`tmp/`（gitignored）。所有测试夹具落 `tmp/`，回滚不处理。
- D19：M0a 无需授权；M0b/M1 前需用户明确重启，并同步 `docgen-index.md:44` 的 D19 与 P3/P4 状态。

### 6.1 D19 授权记录

- **位置**：`gate-record.md` 的 `## D19 授权` 节；不复用 ① 行。
- **字段**：用户原话、日期、M0b 前后 sha256、`docgen-index.md` D19/P3/P4 改动。
- **未授权时**：该节写“未获授权（<日期>）”；TC-45 判该节，不判 ①。

## 7 里程碑

| # | 出口 |
|---|---|
| M0a | §5.3 证据齐（git SHA、sha256、基线报告）；无需 D19 授权 |
| M0b | §5.3 在 D19 授权后、独立分支执行；前后 sha256 一致 |
| M1 | §3.4 全过；18 席 + 5 份 rule 投影逐字节不变 |
| M2 | §4 全过；`schema.test.mjs` 负例齐 |
| M3 | §5 全过；Q4 派生断言与 `check-observable.test.mjs:575` 更新完成 |
| M4 | 可选四维；另立 PRD，不阻塞 M0a–M3 |

## 8 验收映射（PRD §6 → testcase）

| PRD | 设计落点 | testcase |
|---|---|---|
| §6.1 M0a/M0b | §5.3、§6 | TC-40–45、TC-51–53 |
| §6.2 逐字节 + 新引擎被消费 | §3 | TC-01–09、TC-44 |
| §6.3 RuleModel/schema | §4 | TC-10–21 |
| §6.4 CLI/gate | §5.1/§5.2 | TC-22–39 |
| §6.3 build 目录参数（dataDir/outDir/rulesDir） | §5.1 | TC-14/15/21 |
| §6.5 质量分数 | §6 | TC-46–50 |
| §6.6 agent 不回归 | §3.3/§3.4 | TC-02 |
| §6.7 可选四维 | §11 | 非目标；观测项 |
| PRD §3 非目标 | §11 | TC-54–59 |

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
| 18 席逐字节回归 | 按段迁移；每段跑 `npm run check`；`render.test.mjs` 直调新引擎，5/5 硬断言 |
| 5 份 rule 投影漂移 | criteria-engine 已逐字节比对；M0a 冻结 sha256 |
| 57% 质量债 | 只做结构拉齐；降分即中止回滚 |
| D19 授权未获 | M0a 可先做；M0b/M1 前必须用户重启 |
| `renderDoc` 口径过宽 | 只查 `tools/docgen/**/*.mjs`，`docs/**` 豁免 |
| coldRepo 无 `.git` | 定版：`coldRepo` 增 `keepGit=false` 参数；`true` 时 `cpSync(REPO/.git, copy/.git, {recursive:true})`（`git ls-files` 不含 `.git/`，不能靠过滤行放行），列入 M1 出口；TC-05/32 用它，TC-39 不依赖 `.git` |
| 新 env 继承 | `DOCGEN_RULES_*` 静默改 build；`check-all.mjs:89` 删除清单补齐 7 个：`DOCGEN_RULES_DIR`、`DOCGEN_AGENTS_DIR`、`DOCGEN_BASELINE_PATH`、`DOCGEN_TMP_ROOT`、`DOCGEN_BUILD_DATA_DIR`、`DOCGEN_BUILD_OUT_DIR`、`DOCGEN_BUILD_RULES_DIR`；M0a 记录/清空 |

## 11 非目标

- 不改 rule 文案、评分维度、满分口径；不激活休眠 rule；不做四维；不做 table/转义；不做 F5 共享外壳。
- 不改 agent 卡文本；18 席输出逐字节不变。

## 12 与 testcase 的对账决议

testcase 独立编写（明细 59 条；`size` 计数 62/80；正 21 / 负 25 / 边界 9 / 观测 4），本 spec 对 testcase §3 的 TD1–TD12 逐条定版：

| # | 议题 | 决议 |
|---|---|---|
| DQ1 | 非 registered `--check` 基准 | 在 `rules/<id>.md` 存在性检查之前分流：用 `renderRule(id)` 渲染，基准 `builders/rules/<id>.md`；不得再受 `RENDERED_RULES.includes` 限制；漂移 `Mismatch` exit 1，缺件 `DanglingBaselineEntry` exit 2；registered 仍用 `rules/<id>.md` |
| DQ2 | `renderDoc` 0 命中范围 | 只扫 `tools/docgen/**/*.mjs` 且排除 `*.test.mjs`；`docs/**` 与测试负例描述豁免；新引擎导出名是 `renderBlocks`，不保留 `renderDoc` |
| DQ3 | `validate` 契约 | 返回 `Finding[] = {code,message}[]`，不抛；`check` 原样并入，`checkTestcase` 的字符串逐条包成 `{code:'Testcase',message}`，无 testcase 返回 `[{code:'MissingTestcase',message}]`（§4.1）；放在 `schema.mjs` 并导出命名函数 `validate`（默认 `{}` 参数）；`RuleModel.validate` 是别名；TC-16/18 的命名导入成立 |
| DQ4 | 5 份 sha256 vs dormant 无 golden | 5 份 sha256 是基线证据；dormant 逐字节比对沿用 criteria-engine，不建独立 golden 文件 |
| DQ5 | per-rule `exitCode` | 记整次命令退出码，per-rule 同值；不断言单条独立退出码 |
| DQ6 | F6 与“不提升” | F6 判据是“不下降”；“不提升”改为“不要求提升”，意外 +1 不判红 |
| DQ7 | gate 19 的计数 | `N = 18 + BASELINE_RULES.length`；不写死 19；rules.json 增长时 N 随之变 |
| DQ8 | 回滚白名单全集 | 生产新建件只清 `tools/docgen/render` 与 `builders/rules/schema.test.mjs`；回滚同时 restore 三份联动文档；夹具全落 `tmp/`；白名单见 §6 |
| DQ9 | 额外 env | M0a 同时记录/清空 `DOCGEN_BASELINE_PATH`、`DOCGEN_TMP_ROOT` 与 D5 三个新 env（`DOCGEN_BUILD_DATA_DIR` / `DOCGEN_BUILD_OUT_DIR` / `DOCGEN_BUILD_RULES_DIR`） |
| DQ10 | `BASELINE_RULES` 字面量 | 不再保留 `export const BASELINE_RULES = [` 字面量；测试改派生断言（非空 + 条数 + 等式） |
| DQ11 | M0a 白名单目录 | 见 §6：PRD / handoff / `docs/reports/...-rule-baseline/` / spec+testcase / 本任务 gate-record / `tmp/` |
| DQ12 | M0a 只写报告 | M0a 只新建 `docs/reports/...-rule-baseline/`；M0b 才写 `rules/*.md` 与 `builders/rules/*.md` |

testcase 侧已同步全部命令级改动（逐条见 `2026-11-13-rule-agent-render-alignment-design-testcase-diff.md`）。

## 附录 A：18 算子与必填参数

| op | 必填参数 |
|---|---|
| `eq` | `value` |
| `nonEmpty` / `empty` | 无 |
| `containsAny` / `notContains` / `startsWithAny` | `values[]`（非空） |
| `matches` / `notMatches` | `pattern`（合法正则） |
| `gt` / `gte` / `lt` / `lte` / `countEq` / `countLte` / `countGte` | `value` |
| `includesAll` / `includesAny` | `values[]`（非空） |
| `notForbiddenCommand` | `allow[]`、`forbid[]`、`conflict='longestAllowWins'` |

### 最小合法 rule 骨架（TC-18 按此生成 18 份）

把 `<op>` 与该 op 在表中的必填参数换入 `assert[0]`；`assert[0].label` 只许名词短语（≤12 字符，不含逻辑词/情态词/标点）：

```json
{
  "id": "<op>-probe",
  "impl": "script",
  "type": "持续适用",
  "scope": "global",
  "title": "<op> 最小判据",
  "when": { "field": "g", "op": "eq", "value": true },
  "assert": [
    { "label": "断言值", "field": "v", "op": "<op>", "probe": { "kind": "manual" } }
  ],
  "residual": { "who": "rule-writer", "sample": 1, "objectivePath": "tmp/fixtures/op/<op>.json" },
  "refs": [],
  "landing": "tmp/fixtures/op/<op>.md"
}
```

必填参数并进 `assert[0]`：`eq` → `"value": 1`；`containsAny`/`notContains`/`startsWithAny`/`includesAll`/`includesAny` → `"values": ["x"]`；`matches`/`notMatches` → `"pattern": "^x$"`；`gt`/`gte`/`lt`/`lte`/`countEq`/`countLte`/`countGte` → `"value": 1`；`notForbiddenCommand` → `"allow": ["ls"]`、`"forbid": ["rm"]`、`"conflict": "longestAllowWins"`；`nonEmpty`/`empty` → 无额外参数。`probe.kind = "manual"` 无必填参数，`check` 只验形状、不跑命令。

## 附录 B：TC-18 最小 testcase 模板

```json
{ "rule": "<id>", "cases": [ { "input": {}, "expect": "pass" }, { "input": {}, "expect": "fail" } ] }
```

每份最小 rule 配 1 份上述 testcase，`rule` 指向自身 id；`checkTestcase` 需同时看到 `pass` 与 `fail` 才不报“缺正例/缺反例”。
