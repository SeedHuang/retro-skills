# 可观察判据与卡面表达重构 · S1（清单与校验器）设计

> 状态：**待议会 #2 评审（未签字）**｜创建 2026-10-31｜上游 PRD：`docs/prd/20261031202331-observable-criteria-rollout/index.md`（已定稿，SHA `40D63E3E…CE789`，① 段已签）
> 测试用例文件：`docs/superpowers/specs/2026-10-31-observable-criteria-rollout-design-testcase.md`（独立 `senior-sdet` 编写；本文件不内联用例）
> 本块 = PRD §8 的 **S1**：F-01（清单单源）+ F-02（校验器，**只扫 `rules/` + `skills/`**，按 PRD C-6 分期）+ F-10 的先行产物 `rules/observable-criteria.md`。**不碰**卡面（S2）、`predicates`（S3）。

## 1 范围

| 做 | 不做 |
|---|---|
| `tools/quality/observable-terms.json`（唯一词表 / 标记表 / 正反例） | 卡面重构、15 卡重生成（S2） |
| `scripts/check-observable.mjs`（扫 `rules/`+`skills/`，退出码 0/1/2） | `predicates` 改写与 `validatePredicates`（S3） |
| `tools/quality/observable-exempt.json` + **21 行**基线逐行分诊 | 两 inspector 接线、三写作流程（S3） |
| `rules/observable-criteria.md`（≤120 行，怎么用 + 去哪查） | 自动改写、扩扫描面到 `docs/**`、动 S6 边界物料 |
| `subjective-terms.mjs` / `criterion-terms.mjs` 改为从 JSON 派生；`check-all.mjs` 新增 ⑦ 段 | 改已签 S4 spec 正文（C-7 只加现行判据块，S2 落） |

**依赖**：无（本块开工）。**下游**：S2 依赖本块的清单 JSON；S3 依赖本块校验器脚本（扩判定面）。

## 2 术语（首次出现处给定义，供中途读者）

| 术语 | 定义 |
|---|---|
| 主观词 | 无法二值判的形容词 / 评价词（`terms` 内）。本块定稿 **9 词**：自省 / 客观 / 诚实 / 宽松 / 严格 / 清晰 / 准确 / 显著 / 良好。**`完整` 已剔除**（2026-11-01 实测：10 词口径 77 行里 56 行是「完整逻辑闭环 / 完整内容 / 完整性 / 完整可运行」这类**具体属性**，不作质量评价 → 进词表只会误伤） |
| 判据词 | 用于「判据表达式」的词（`criterionTerms`，处置 / 依据 / 充分 / 合理 / 及时 / 适当）；**不进 `terms`**，两表交集必须为空 |
| 可观察标记 | 能二值判的**结构化形态**（比较式 / `path:line` / `exit 码` / `diff` / `计数 = N` / `为空` / `非空` / 带字面量枚举）；自然语义词（裸 `=`、`出现`、`命令`、`词表`）**不算** |
| 最小语义块 | 命中行所在的**同一容器节点**：bullet = 该 bullet 的续行 + 其缩进子块；段落 = 连续非空行；另加**紧随的连续表格**。**终止条件**（任一命中即结束）：① 空行 ② 同级或更高级标题 ③ **同缩进级别的下一条 bullet** ④ 表格结束后的下一个非表格行。**围栏代码块（```）内的行不参与命中**（与 `check-all.mjs` ④ 段的 `fenceMask` 同口径） |
| 豁免 | 行级白名单条目，把「命中主观词但合法」的行摘出；必须带锚点原文与理由 |

## 3 清单 JSON（`tools/quality/observable-terms.json`）

```json
{
  "terms": ["自省","客观","诚实","宽松","严格","清晰","准确","显著","良好"],
  "criterionTerms": ["处置","依据","充分","合理","及时","适当"],
  "markers": [
    { "kind": "compare", "pattern": "(>=|<=|==|===|!=|≥|≤|＝|>|<)\\s*[^，。；\\s]+" },
    { "kind": "pathline", "pattern": "(path:line|[A-Za-z0-9_./\\\\-]+\\.(md|mjs|js|json|ts|tsx|yml|yaml|tpl):\\d+)" },
    { "kind": "exit", "pattern": "(exit|退出码|退出状态)\\s*(code|码)?\\s*([=:：]|为|是)?\\s*[0-9]+" },
    { "kind": "diff", "pattern": "diff\\s*(命令|--|输出|检查)" },
    { "kind": "count", "pattern": "计数\\s*=\\s*[0-9]+" },
    { "kind": "empty", "pattern": "(?<![不非假])为空" },
    { "kind": "nonempty", "pattern": "(?<![不非假])非空" },
    { "kind": "enum", "pattern": "枚举[：:]\\s*[A-Za-z0-9_一-龥]" }
  ],
  "samples": [
    { "term": "自省",
      "positive": { "input": "每轮收尾必须写自省结论：三性验证逐条附 path:line；缺一条 == 不合格。", "expect": "pass" },
      "negative": { "input": "每轮收尾要自省，想清楚有没有长期方案。", "expect": "fail" },
      "residual": { "who": "reviewer-qa", "sample": 3 } }
  ]
}
```

> **2026-11-01 增量注（上面 JSON 里的三处 pattern 已在实现中收紧，本块原文保留不改）**：① `empty` / `nonempty` 的守卫由 `(?<![不非假])` 扩为 `(?<![不非假])(?<!要求)`（否则「不要求非空」被当成标记，与 testcase `C22②` 冲突）；② `enum` 的冒号后由「任意汉字 / 字母数字」收窄为 `[A-Za-z0-9_]`（否则「枚举：核对」被当成标记，与 testcase `C19④` 冲突）。**两条都是收窄**：它们只会把原先被误判为「已合格」的行改判为 hit（**合格面只会变小，命中面可能变大**），不会反过来把未命中的行变成命中；实测本仓 `hits = 0`、18 口径零新增（`counts` 与 `baseline.json` 逐项相同）。现行值以 `tools/quality/observable-terms.json` 为唯一源。

**结构约束（验收项见 testcase）**：

| # | 约束 | 判法 |
|---|---|---|
| C-1 | `terms.length` = **9** 且逐字等于上表 | 逐字比对 |
| C-2 | `terms` 与 `criterionTerms` 交集为空 | 集合交集 |
| C-3 | `markers` 的 `literal` 不含裸 `=` / `出现` / `命令` / `词表`；**据 `pattern` 原文恰为 `=` 也红**；`enum` 的 `pattern` 必须要求冒号后至少 1 个字面量字符（防「裸 `枚举：`」过关） | 遍历 literal + 正则形态 |
| C-4 | 每个 `term` 恰一条 `samples`；`positive.expect = "pass"`、`negative.expect = "fail"`、两个 `input` 非空；`residual` **键必须存在**（可为 `null`） | 结构断言 |
| C-5 | `residual` 非 `null` 时：`who` 非空、`sample` 为正整数；`null` = 该词可全量二值判（不得为 `{}` / `""` 蒙混） | 结构断言 |
| C-6 | 无重复 `term`、无空串 | 去重计数 |

`subjective-terms.mjs` 只留派生（`export const subjectiveTerms = Object.freeze([...OBSERVABLE.terms])`），`criterion-terms.mjs` 同理；**不得再写字面值**。`agent-card-contract` PRD `:271` 与 `card-model.test.mjs:350-355` 同批改为「从 JSON 派生」（PRD §2.1）。

## 4 校验器（`scripts/check-observable.mjs`）

**CLI**：`node scripts/check-observable.mjs --check`（默认即 check）；`--json` 结构化输出；`--root <dir>` **只替换扫描根**（清单与豁免默认仍从仓根的 `tools/quality/*.json` 读）；要换数据源再加 `--terms <file>` / `--exempt <file>`。

**扫描面**：`rules/` 与 `skills/` 下全部 `.md`（递归），按行扫 `terms`（**子串匹配**，不做分词；与 S3 的 `predicates` 面口径一致）。**标题行（`^#+ `）不参与判定**——标题是索引，不是判据正文（规则名 / 小节名里的字不该被判成「写不清」）。

**判定（hit 单位 = 行）**：

1. 对每一行求「该行命中的 `terms` 集合」（可能 0 个 / 多个）；
2. 命中行所在**最小语义块**内至少一个 marker → 合格（分类 = `已合格`，不产出 hit）；
3. 否则若该行在豁免清单里（`path` + `contains` 命中该行）→ 合格（分类 = `已豁免`，计 `exemptedLines`）；
4. 否则 → **红**，**每行一条 hit**：`path:line  term=<词1,词2…>  无结构化可观察标记`；
5. **规则文档专判**：`rules/observable-criteria.md` 另走 §6 的「不复制词表」三条判据，命中即红（同样的 exit 1）。

> 为什么 hit 按行而不是按词：PRD §0.3-6 的 **23** 是**行数**口径（一行含 3 词仍算 1 行；10 词口径的 77 / 定稿 21 同理）；按词计会让分诊表与门禁计数分叉（实测 77 行 / 81 词-行对）。

**前置断言**（不过即 `exit 2`，不判红绿、不输出 hit）：

| # | 断言 | 触发场景 |
|---|---|---|
| P-1 | **两次独立遍历**（① 目录递归收集路径 ② 对收集结果数文件）得到的 `.md` 数相等，且 `rules/` 与 `skills/` 各 ≥1；扫描仓根时另断「总数 = 仓基线上限」（**施工期两态允许**：本块新建 `rules/observable-criteria.md` 之前 = **106**，建之后 = **107**，故前置接受 `∈ {106, 107}`，**既不是 106 也不是 107** 才红；**2026-11-01 增量**：原口径 106，本块 Task 6 落规则文档后终态 107；此后基线变更须同批改本节）（**2026-11-01 增量（`--root` 例外，代码审查 #1 闭合）**：**「各 ≥1」只在扫描仓根时强制**；`--root <dir>` 指向非仓根时降为「`rules/` 与 `skills/` 目录须都在 + 总数 ≥1 个 `.md`」——成因 = 已签 testcase `OCR-S1-TC-B12` 第 ③ 支要求「临时根仅 1 个 `.md`（对照）→ exit 0」，与「各 ≥1」不可同时成立；本句原文保留不改，例外以本注为准）。扫描根下 0 个 `.md` = 空转红。**遍历口径**：扩展名大小写不敏感；**符号链接与 junction 跳过**（与 `check-all.mjs` ④ 段同口径）；扫描根不存在 / 不可读 → exit 2 | glob 写错 / 目录被移走 / 测试根 `--root` |
| P-2 | `JSON.parse` 成功；`terms` 非空、`criterionTerms` 非空、`markers` 非空、`samples` 覆盖全部 `terms` | JSON 语法错 / 被清空 / 结构损坏 |
| P-3 | 每个 `samples` 可执行且**双向**：正例喂 `evaluateText` → `pass` **且** `matched` 含该 `term`；反例 → `fail` **且** `matched` 含该 `term`（在内存里跑，不落盘） | 反例写成合理例句 / 正例里根本没写该词（空转） |
| P-4 | 豁免清单结构合法：四字段齐、`contains` 非空、同一 `path` 内 `contains` 不重复、`reviewed` 可解析 | 豁免条目写坏（结构错 **不归 exit 1**，它是「清单本身坏了」→ exit 2） |

**导出**：`export function evaluateText(text, { terms, markers })` → `{ verdict: 'pass' \| 'fail', matched: [{ term, index }] }`（**不去重**，每次出现一条）；CLI 与 P-3 都走这一个纯函数（**只有一处判定实现**）。

**退出码**：`0` = 无未豁免 hit 且无 stale；`1` = 有未豁免 hit / 有 stale（豁免写了但 `contains` 在文件里 0 命中）/ 规则文档复制词表；`2` = 前置不过（P-1～P-4）。**末行**：`check-observable ok`（0）/ `check-observable fail（命中 N 行 / stale M 条）`（1）/ `check-observable error（<断言号>: <原因>）`（2）。**任何未捕获异常都必须收敛成 exit 2**（parse 失败 / ENOENT 等）。

**输出顺序**：按 `path` 字典序、行号升序，稳定可复算。

## 5 豁免清单（`tools/quality/observable-exempt.json`）

```json
{ "entries": [
  { "path": "rules/core-working-principles.md", "contains": "被指出问题先自省（缺陷先算在我头上，不得说「机制必然」）", "reason": "「自省」在本仓是规则概念名（术语引用，不是评价）；同段正文已给可判载体（三性验证 / 判据树 / 长期方案落点）", "reviewed": "2026-10-31" }
] }
```

| # | 规则 | 判法 | 违规归类 |
|---|---|---|---|
| E-1 | 四字段齐（`path` / `contains` / `reason` / `reviewed`）；缺任一 | 结构断言 | **P-4 → exit 2** |
| E-2 | `path` 必须存在且在该文件内 `contains` 出现**恰 ≥1 次**（0 次 = `stale`） | 读文件 | **stale → exit 1** |
| E-3 | `contains` 在该文件内**唯一**（≥2 处 = 锚点不精确） | 计数 | **P-4 → exit 2** |
| E-4 | 同一 `path` 的条目按 `contains` 不重复 | 去重 | **P-4 → exit 2** |
| E-5 | `reviewed` 可解析为日期且不早于 `2026-01-01` | 日期解析 | **P-4 → exit 2** |
| E-5b | **到期（超过 365 天）本块不判**——触发 = 首个 `reviewed` 满 365 天时由 ④ 段升级为规则 | 不实现 | 不适用 |
| E-6 | 新增豁免须审计签字：变更该文件时 `gate-record.md` 对应段行须写「豁免条目数」 | 人工 + 门行 | ④/⑤ 段核（**不做机判**：门行在 ② 段之后才写；不引入 `approvedBy` 字段——它没有可比对的机判源，只增字段不减自签风险） |

**初始基线**：S1 落地时 `--check` 必须 **exit 0**。做法 = 对 9 词口径的 **21 行**正文命中逐行分诊：能改文案的改（落本块 diff），只能作术语引用保留的进豁免（带 `reason` + 术语出处，`L ≤ 8`）。分诊表见 §9.3，**不得用「全部豁免」蒙绿**（验收要求 `exemptedLines` 与分诊结论一致）。

## 6 规则文档（`rules/observable-criteria.md`，F-10 先行产物）

- **≤120 行**；按 `rule-writer` 的四要素（范围 / 条件 / 动作 / 宾语）+ 触发时机 + 验证节。
- **judgment 只住一处**：词表与标记表在 JSON、判定在 `scripts/check-observable.mjs`；规则文档只写「什么时候跑、红了怎么看、豁免怎么走、去哪查词表」——**不复制任何词表 / 正则 / 词面**（否则第二份真相）。
- **「复制」的机械判据**（实现点 = §4 判定 5，不另写第二份）：① 出现任一 `markers[].pattern` 原文（≥8 字符）→ 红；② 出现 `terms` 里 **≥2 个词**在同一行 / 同一表行里连续枚举 → 红；③ 单个词面单独出现在叙述句里（如「按本规则判『自省』」）→ **绿**（不算复制词表）。
- 声明「本规则不因来源豁免」与「与 §5 豁免冲突时以豁免清单为准」。
- **自身可过 ⑦ 段**（本文件在 `rules/` 下，必然被扫）：示例句必须自带 marker；正文叙述词面的行按 §5 入豁免（`reason` 写「元文档」），验收 = `hits = 0`。

## 7 门禁接入（`scripts/check-all.mjs`）

- 在现末段 ⑥ 之后新增 **⑦ 段**：跑 `node scripts/check-observable.mjs --check --json`，失败即 `check` 非 0（不吞 exit code、不降级为 warning）。
- ⑦ 段输出首行固定 `[observable] 扫描 <N> 个 .md / 未豁免命中 <H> 行 / 已豁免 <E> 行 / stale <S> 条`；**数字单源 = `--json`**（`N = scanned.length`、`H = hits.length`、`E = exemptedLines`、`S = stale.length`），check-all **不重算、不解析文本**。
- **⑦ 段不可旁路**：`CHECK_BYPASS` 仍只跳 ⑥（与现有 `check-all.mjs:49-56` 一致）；不得把新段接进旁路分支。
- 新增 `package.json` 脚本 `check:observable`（供 S3 的两 inspector 调用）。
- **本批落地顺序**（防中途恒红）：① 改文案 → ② 建/调豁免直到 `node scripts/check-observable.mjs --check` **exit 0** → ③ 填满分诊表 → ④ 接 ⑦ 段（前置 = ② 已绿）→ ⑤ 跑 `npm run check`。

## 8 与既有件的关系（R8）

| 既有件 | 处置 | 落点 |
|---|---|---|
| `tools/docgen/card-model/vocab/subjective-terms.mjs` | 改为派生（删字面值） | 本块 |
| `tools/docgen/card-model/vocab/criterion-terms.mjs` | 改为派生（删字面值） | 本块 |
| `docs/prd/20261026205821-agent-card-contract.md:271` | 原文保留 + 日期注「词表自 2026-10-31 起以 `tools/quality/observable-terms.json` 为唯一源」 | 本块 |
| `tools/docgen/test/card-model.test.mjs:350-355` | 改为「从 JSON 派生 + 交集空」（不再对 PRD 行逐字） | 本块 |
| `tools/docgen/policy/**` | **零改动**（S6 已签）（**2026-11-05 注**：S6-B 放宽为 3 个登记文件 `paths` / `seats` / `writeScopes`；**2026-11-07 注**：review 三技能归档、`definitions/commands.mjs` 入集，扩为 4 个；**2026-11-08 注**：该文件里的取时命令改为公共 CLI `scs time`，`scripts/review-ledger/` 已迁出本仓） | — |
| `tools/docgen/components/baseline.mjs` + `tools/docgen/baseline.json` | **必须登记新规则**：`rules/observable-criteria.md` 属手写规则，未进 `BASELINE_RULES` → `node tools/docgen/cli.mjs gate` 报 `UnregisteredHandwritten`；登记后跑 `node tools/docgen/cli.mjs baseline --write`，`baseline N/N` 由 37 变 **38**（门行取证随本块更新） | 本块 |
| `scripts/scope-sweep/keywords.json` | 本块不改口径；**改 23→77→21 基线表述**（D18）须同批落当次 `impact-sheet.md` 并跑 `--check` | 本块按需 |

## 9 验收

### 9.1 指向测试用例

- 用例文件：`docs/superpowers/specs/2026-10-31-observable-criteria-rollout-design-testcase.md`（本文件不内联）。
- 覆盖要求：本块每条约束（C-1～C-6 / P-1～P-4 / E-1～E-6 / §6 复制判据 / 门禁 ⑦）至少 1 正例 + 1 反例；**负例与边界条数 ≥ 正例**。
- **例外（不做机判的约束）**：E-6（门行人工项，见 `testcase` 的缺口 G-3）——覆盖总表须标「人工兜」，不得挂一条并不含该断言的正/负用例；E-5b（到期）——S1 无适用用例，触发见 D20。
- **语义回读（翻译对不对）**：由议会测试评委（独立实例）做；无独立实例时按 §3.1 降级条款只出草稿、不作 ② 出口证据。

### 9.2 产品级

| # | 验收项 | 可核方式 |
|---|---|---|
| V-4 | 校验器真红 / 真绿 / 前置红 | 构造「仅主观词」→ exit 1；合格行 → exit 0；空扫描面 / 坏 JSON → exit 2 |
| V-5 | 清单不空转 | 删任一 `negative` → 测试红；`samples` 反例喂进去必红 |
| V-10 | 全量门禁 | `npm run check` 绿（含 ⑦ 段）+ `sweep ok`（R8） |
| 基线 | 首日不红 | `--check` exit 0，且 **`exemptedLines` = §9.3 分诊表里的「合法保留」行数 L**；`M + P + L = 21`、`stale = 0` |

### 9.3 S1 分诊表（**21 行**逐行结论）

**落点**：`docs/reports/2026-10-31-observable-s1-triage.md`（一次性产出，写完封存；表头固定 `| path:line | 命中词 | 块内 marker（有/无） | 分类（改文案 / 已合格 / 合法保留） | 处置 | 豁免 reason |`）。它是 ③ 段的申报件；**对账源双轨**：分诊表 + ④ 段门行「**豁免行数**（= `exemptedLines`）」。取数口径同 §7：`exemptedLines` 按行、`stale` 按条、`hits` 按行。

| 分类 | 条数 | 处置 |
|---|---|---|
| 改文案（能把主观词换成可判表述） | 实现期核定（记为 **M**） | 直接改，不入豁免 |
| 已合格（最小语义块内已有 marker，按 §4 判定 2 不产出 hit） | 实现期核定（记为 **P**） | 不改不豁免（**这一档保证「不为本来合格的行补空转豁免」**） |
| 合法保留（**只许术语引用 / 词表自身**，如「自省」作规则概念名、「宽松词」作 `rule-inspector` 术语） | 实现期核定（记为 **L**，**预期 ≤ 8**） | 入豁免，每条 `reason` 必须写明「这是术语引用，不是评价」+ 该术语的出处 |
| 合计 | **21 行（实测；按行计）** | **M + P + L = 21**，且 `exemptedLines = L`、`stale = 0` |

> 取数命令（9 词 + 排除标题行）：`((Get-ChildItem rules,skills -Recurse -Filter *.md) \| Select-String -Pattern '自省\|客观\|诚实\|宽松\|严格\|清晰\|准确\|显著\|良好') \| Where-Object { $_.Line -notmatch '^\s*#' } \| Select-Object -Unique Path,LineNumber \| Measure-Object).Count` → **21**。
> **为什么不是 77**：77 = 10 词口径（含 `完整` 56 行具体属性）且未排除标题行；剔除后按 9 词 + 正文行 = 23 行，再减去 2 行标题 = **21**。

## 10 差异清单（D，逐条带 PRD 出处）

| # | 差异 / 取舍 | 出处 |
|---|---|---|
| D1 | 本块只扫 `rules/`+`skills/`，卡面与 `predicates` 延到 S3 | PRD C-6 / §8 |
| D2 | 标记表从 PRD 的 **10 项**收窄为 **8 类**（3 个比较形态合为 `compare`；剔除裸 `=` / `出现` / `命令` / `词表`；枚举须带字面量） | PRD §3.3 / F5 族 |
| D3 | 判定窗口 = 最小语义块（非「同一行」） | PRD §3.3 / F5 族 |
| D4 | 豁免锚点只认 `contains`（行号只作报错定位），并要求 `contains` 唯一 | PRD §3.3 / F13 族 |
| D5 | 前置断言用 `exit 2`（与「命中 exit 1」区分） | PRD §4 / F12 族 |
| D6 | `samples.expect` 取 `pass` / `fail` 而非退出码字面量（校验器内部复用同一评分函数，避免第二份判定） | 本 spec |
| D7 | 规则文档 ≤120 行 + 「不复制词表」 | PRD §4 / F16 族 |
| D8 | **21 行**基线首日落豁免（不引入 `--warn` 过渡） | PRD `①` 门行 P2-① / F13 族 |
| D9 | 豁免**结构错**归 `P-4 → exit 2`；只有 sticky（`contains` 0 命中）归 exit 1 | 本 spec §4/§5（回答 CQ-4） |
| D10 | `samples.residual` 键必填、可为 `null`（`null` = 全量可机判） | PRD `:213`（PRD 写 `residual?` **可选**）+ 本 spec §3 C-4/C-5；本块收紧为「键必填」，理由 = 防 `{}` / `''` 空壳蒙混 |
| D11 | `exit` 标记 pattern 放宽为 `(exit\|退出码\|退出状态) … [0-9]+` | 本 spec §3（回答 CQ-3） |
| D12 | 到期（365 天）**本块不判**（E-5b）；触发日载体 = `docs/after/<时刻>-observable-exempt-expiry-open-decisions.md`（S1 施工时同批建，触发日写死 `2027-11-01`） | PRD `:159`（PRD 明列「过期未重审必红」——本块降级，故同批给 PRD `:159` 加日期注）+ 本 spec §5 |
| D13 | 遍历口径：扩展名大小写不敏感、symlink / junction 跳过 | 本 spec §4 P-1（回答 CQ-5） |
| D14 | 判定实现只一个纯函数 `evaluateText`（CLI 与 P-3 共用） | 本 spec §4（回答 CQ-6） |
| D15 | ⑦ 首行 `未豁免命中 H`（`H=0` 才是首日绿），`已豁免 E` 单列 | 本 spec §7（回答 CQ-7） |
| D16 | 「复制词表」机械判据 = pattern 原文 ≥8 字符 / 同行 ≥2 词枚举；单词面叙述绿 | 本 spec §6（回答 CQ-8） |
| D17 | 分诊表落 `docs/reports/2026-10-31-observable-s1-triage.md` | 本 spec §9.3（回答 CQ-9） |
| D18 | **基线口径链**：PRD §4 `:224` / §8 `:301` 的「23 行基线」= 5 词口径；D-04 扩到 10 词后 77 行；**2026-11-01 定稿 9 词（剔 `完整`）+ 标题行不参与 = 21 行**。S1 以 **21** 为基线，PRD 三处同批加日期注（原文不改） | PRD `:57`（6b 77/81）+ 本 spec §9.3 |
| D26 | **剔除 `完整`**（10 → 9 词）：实测 77 行里 56 行是「完整逻辑闭环 / 完整内容 / 完整性 / 完整可运行 / 完整可见」——具体属性，非质量评价 | 本 spec §2/§3（回答用户 2026-11-01「为什么要豁免」） |
| D27 | **标题行（`^#+ `）不参与判定**：标题是索引不是判据正文；`## 自省必须给长期方案`、`### 问提交的边界（严格限定）` 这类不该被判「写不清」 | 本 spec §4 |
| D19 | **hit 单位 = 行**（一行多词仍 1 条 hit；`term` 列输出逗号串）；`exemptedLines` 按行、`stale` 按条 | 本 spec §4（回答 qa 卡 11 / backend 卡 01） |
| D20 | `E-5b` 到期触发日 `2027-11-01` 落 `docs/after/`（S1 施工同批建） | 本 spec §5（回答 qa 卡 02 / ai 卡 10） |
| D21 | `--json.scanned` = **路径数组**（`string[]`）；`hits = [{path,line,terms:[]}]` | 本 spec §4（回答 qa 卡 03） |
| D22 | `--root` 只换扫描根；清单 / 豁免默认从仓根读，否则用 `--terms` / `--exempt` | 本 spec §4（回答 qa 卡 05 / ai Q5） |
| D23 | 新规则须登记 `baseline.mjs` / `baseline.json` 并 `baseline --write`（`baseline` 37 → 38） | 本 spec §8（回答 ai 卡 01） |
| D24 | E-6 不做机判、不引入 `approvedBy`；覆盖总表标「人工兜」 | 本 spec §5/§9.1（回答 ai 卡 06 / audit 卡 05） |
| D25 | ⑦ 段计数单源 = `--json`；⑦ 不可经 `CHECK_BYPASS` 旁路；给出批内落地顺序 | 本 spec §7（回答 backend 卡 06/08） |

## 11 未决（Q，逐条给裁定或带触发）

| # | 问题 | 裁定 / 触发 |
|---|---|---|
| Q1 | `markers` 是否含中文全角比较符（`≥` `≤` `＝`） | **含**（D2 已写进 pattern 的字符类） |
| Q2 | 豁免 `reviewed` 过期阈值（365 天）是否可配置 | **本块不实现到期判定，故不存在该常量**（E-5b）；将来实现时阈值写常量 + 同批改本节 |
| Q3 | 规则文档由 `rule-writer` 起草还是本块直接写 | 本块直接写（`rule-writer` 是技能，起草产物仍需过 rule 体检；S1 内不重复走两遍） |
| Q4 | 21 行里「自省」作规则概念名 / 术语这类是否改名 | **不改名**（改名会连锁破引用：规则标题 + 4 处技能文档）；入豁免，`reason` 写「术语引用 + 出处」 |
| Q5 | `--json` 的字段名 | `{ scanned: string[], hits: [{path, line, terms: string[]}], exemptedLines, stale: [...], ok }`（与 D19/D21/§7 一致）；S3 复用 |
| Q6 | （CQ-1）`samples.residual` 是否每条必填 | **键必填、值可为 `null`**；`null` = 该词全量可二值判；非 null 时 `who` 非空 + `sample` 正整数 |
| Q7 | （CQ-2）E-5 的「365 天到期」是否本块实现 | **不实现**（E-5b）；触发 = 首个 `reviewed` 满 365 天时由 ④ 段升级为规则 |
| Q8 | （CQ-3）「exit code 0」算不算可观察标记 | **算**；pattern 放宽为 `(exit\|退出码\|退出状态) … [0-9]+` |
| Q9 | （CQ-4）豁免清单结构错用哪个退出码 | **exit 2（P-4）**；stale 才是 exit 1 |
| Q10 | （CQ-5）`--root` 下 P-1 怎么复核；symlink / 大小写 | 实现内**同一次遍历两源自洽**（目录遍历数 = 文件计数）；`--root` 时代替仓根同一函数生效；symlink / junction 跳过；扩展名大小写不敏感；测试用 Node 同序遍历做第二源 |
| Q11 | （CQ-6）评分函数导出名 | `evaluateText(text, { terms, markers })` → `{ verdict, matched }`；CLI 与 P-3 共用 |
| Q12 | （CQ-7）⑦ 首行 `命中 H` 含不含已豁免 | **不含**；首行分列 `未豁免命中 H` 与 `已豁免 E`；首日 `H = 0` |
| Q13 | （CQ-8）规则文档「复制词表」怎么机械判 | pattern 原文 ≥8 字符出现 → 红；同行 ≥2 个 `terms` 词连续枚举 → 红；单词面叙述 → 绿 |
| Q14 | （CQ-9）分诊表落点与表头 | `docs/reports/2026-10-31-observable-s1-triage.md`；表头 6 列（`path:line` / 命中词 / 块内 marker / 分类 / 处置 / 豁免 reason）；对账式 `M + P + L = 21` |
| Q15 | 最小语义块的终止条件是否含「同缩进下一条 bullet」 | **含**（§2 已改四条件枚举）；围栏内行不参与命中；与 testcase C06 对齐 |
| Q16 | 规则文档自己会被 ⑦ 扫，怎么过 | **两条**：① 文档内示例句必须自带 marker（如「结论附 `path:line`;」）；② 正文必须叙述某个词面时，该行入豁免（`reason` = 「元文档，词表源头在 JSON」）。验收 = `--check` 对该文件 `hits = 0` 且 `exemptedLines ≤ 文档内叙述行数` |
| Q17 | marker 的守卫（`为空` / `非空` 前有「不 / 非 / 假」；`diff` 裸词） | **已收窄**：`(?<![不非假])为空` / `(?<![不非假])非空`；`diff` 只认 `diff 命令 / -- / 输出 / 检查`；`compare` 补 `>` `<` （**2026-11-01 增量注**：`empty` / `nonempty` 的实际守卫为 `(?<![不非假])(?<!要求)`，`enum` 收窄为 `[A-Za-z0-9_]`；本行原文保留，现行值见 JSON 单源与 §3 的增量注） |
| Q18 | `pathline` 既误红（`path:line` 字面不算）又误绿（`20:23` 算） | **pattern 收紧**：只认 `path:line` 字面或「带扩展名 + `:行号`」；`20:23` / `版本 1:1` 不算 |
| Q19 | 规则文档 ≤120 行的「行」口径 | **`readFileSync(...).split(/\r?\n/)`，末尾换行与 BOM 不计**；测试用例一律用 Node 数，不许 PowerShell `Get-Content` 当断言源 |
| Q20 | 判定与枚举的「同行 ≥2 词」上限 | 不设上限；hit 仍按行聚合（D19）；「连续枚举」= 同一行 / 同一表行里 ≥2 个 `terms` 词之间只隔分隔符（`、` / `，` / `/` / 空格） |
| Q21 | 用例里能否 spawn 全仓 `npm run check` / `check-all` | **不能**（会与 ② 段 `node --test '**/*.test.mjs'` 自递归）；自动测试只做「源码静态断 ⑦ 段接入 + 不吞 exit」与单跑 `check-observable`；全量门禁由 ④ 段门行取证 |
| Q22 | `完整` 为什么出表、`C-1` 怎么改 | **出表**（D26，56/77 是具体属性）；`terms.length` 10 → **9**；`samples` 同步删该条 |
| Q23 | 标题行不扫会不会漏掉「标题里写的主观判据」 | 不会：标题只作索引；若标题里真写了判据，正文必然复述（否则标题本身不可执行，属另一类问题，由 `rule-inspector` 的标题一致性检查兜） |
| Q24 | 21 行最后能到 L = 0 吗 | **不追求 0**：`自省` 作规则概念名、`宽松词` 作术语名属**术语引用**，改名会连锁破引用（规则标题 + 4 处技能文档）；预期 `L ≤ 8`，每条 `reason` 写「术语引用 + 出处」 |
