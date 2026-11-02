# 测试用例：可观察判据与复用 S3（8 条 label 改写 + 判据表校验器 + substring 单实现 + 四处检查点 + 引用接线）

> **归属 spec**：`docs/superpowers/specs/2026-11-02-observable-s3-predicates-reuse-design.md`（**v3**：第 1 轮 12 族 + 第 2 轮 5 席意见已并入；状态：待第 2 轮复核）
> **上游 PRD**：`docs/prd/20261031202331-observable-criteria-rollout/index.md`（① 段已签 2026-10-31）
> **编写者**：`senior-sdet`（独立实例，全新上下文）
> **独立性声明**：本用例编写者**未参与**本 spec 的写作、也未参与任何实现或测试代码施工；全部结论仅依据 spec v3 正文、本仓实现读码与只读命令输出。编写者 ≠ spec 作者 ≠ 施工者。
> **编写日期**：2026-11-02（**v3.1** 对齐：§3 载体列与两条重写 label / C-8 / §4 **291 + 45 = 336** 实测 / §5 检查点 ⑨ 验证节口径 + 归桶**四处**（⑨·⑤ 各自独有 → 不进 `SHARED_MARKERS`、不触发 R7）+ 计数补 `:81` 四处 / §7 步 S1 **只报首条单行** / §8 取数 35·175 / 37·197 / 58·411 / D-17·D-18）
> **状态**：草稿（**定稿 = 五要素齐全 + 覆盖总表与 spec 全部验收项一一对应 + 负/边界 ≥ 正**）
> **用例总数**：**80**（正 **32** ／ 负 **27** ／ 边界 **21**）；负 + 边界 = **48 ≥ 正 32**
> **缺口状态**：GAP-1 / GAP-3 / GAP-5 / GAP-9 **已闭合**（载体见 §17）；GAP-2 的逐字样例改由 `renderCard` 实渲出具；GAP-3 指 `§10 D-12`；新增 GAP-10（`<S3-BASE>` 降级分支）与 GAP-11（载体列语义面）
> **ID 前缀与类型标记**：`S3-TC-`；每个用例一个 `### S3-TC-<组><序号> …【正｜负｜边界】` 标题块 —— **标题行末的 `【…】` 是该用例的类型**，标题即计数单位（`check-plan.mjs size` 按 `^#{3,4}\s+([A-Z][\w-]*?\d{2})\b` 收 ID）
> **命名与落点**：按 `rules/spec-testcase-gate.md` 判据 1 —— 与 spec 同目录、文件名 = spec 去掉 `.md` 后加 `-testcase.md`；spec 头部已外链本文件，本文件**不反向修改 spec**。
> **测试落点（建议）**：`tools/docgen/test/s3-predicates.test.mjs`（`node --test` 自动收；每个用例 = 一个 `test('S3-TC-<ID> …')` 块，函数名逐条写在「步骤」列首）

---

## 0 判据常量、helper 清单与测试约定

| 编号 | 常量 / 约定 | 取值与出处（可复核） |
|---|---|---|
| 常量 1 | **编号消歧** | spec §3 的 `C-1`～`C-8` = 结构约束；spec §4 的 `D1`～`D5` = `validatePredicates` 五条判定；spec §10 的 `D-1`～`D-18` = 差异清单。**本文件的用例 ID `S3-TC-D01`～`D06` 是组号，不是 `§4 D5`**；一律写全限定：`§3 C-8` / `§4 D5` / `§10 D-17` |
| 常量 2 | **一切集合派生，不手抄** | 8 个判据 id 从 `Object.keys(PREDICATES)` 派生；`MUST_IDS` / `NEVER_IDS` 从 `SHARED_MUST` / `SHARED_NEVER` 的 `criterion` 派生；真实宾语从 `SHARED_NEVER.find(a => a.criterion === id).objects` 派生、中文名查 `OBJECT_NAMES`；`terms` / `criterionTerms` / `markers` 从 `tools/quality/observable-terms.json` 派生；`SEATS` / `TOTAL` / `OLD_LABELS` 见常量 12 |
| 常量 3 | **helper 复用** | 沿用 `tools/docgen/test/support/card-fixtures.mjs` 的 `REPO` / `walkFiles` / `runNode` / `runCli` / `coldRepo` / `mutCard` / `appendOneByte`；`mutCard(seat, fn)` 返回还原函数（必须 `finally` 调）；`coldRepo({ mutate, args, verify })` 返回 `{ code, out }`。**测试侧 helper 一律在 §0.1 登记，每个只实现一次**；本文件「判据」列出现的每个 `assertXxx` / 读取函数都必须在 §0.1 有签名 + 实现要点（**不许留悬空符号**） |
| 常量 4 | **构造只在内存或 `mkdtemp` 副本** | 一切「必红构造」不写仓内文件；每条构造后必须断言「还原/副本隔离」，并用 sha256 内容锚证明仓内文件未变（**不断 `git status` 为空** —— 工作区常态脏，断干净会立跑即红） |
| 常量 5 | **词的判定面** | `subjectiveHit(text)` = **substring**（`text.includes(term)`）；`§3 C-3` 的判定面**只喂 8 条 `label`**（`observable[]` 不在主观词扫描面）；旧 token 全等口径只在本文件 F03 作对照构造 |
| 常量 6 | **标记口径（C-4 / C-8 同一判法）** | 判法 = **整串跑 `markers[].pattern`**：`markerKindsOf(s) = markers.filter((m) => new RegExp(m.pattern).test(s)).map((m) => m.kind)`；`hasMarker(s) = markerKindsOf(s).length >= 1`。**不用** `evaluateText` 的 verdict（它只在「含主观词且同块无标记」时 fail，对无词文本恒 pass）。`evaluateText` 只作**反向证据**，不作任何用例的判据本体 |
| 常量 7 | **`<S3-BASE>` 基准锚** | 优先 `process.env.S3_BASE`；缺失降级为「最后一次触及 `tools/quality/observable-terms.json` 的提交：工作区脏取它本身、干净取其父」并 `t.diagnostic` 点名。**不得 `t.skip`**，**不得 fail-closed** |
| 常量 8 | **markdown 安全** | 表格单元格内**禁 ASCII 竖线**；枚举并列用全角 `｜`；正则里的竖线写 `\x7C`。断言得分列用 `/有 1\s*[\/｜]\s*无 0/`（兼容仓内半角写法） |
| 常量 9 | **测试不自递归** | 任何用例的「步骤」列**不得执行门禁总脚本**（`npm run check` / `scripts/check-all.mjs`）；只允许单跑 `node --test <单文件>` / `node tools/docgen/cli.mjs <子命令>` / `node scripts/check-observable.mjs --check [--root <dir>]` / `node scripts/scope-sweep.mjs --check` / `node scripts/doc-name.mjs --check <dir>` |
| 常量 10 | **命令一律仓根可复跑** | 路径全写仓内相对形式；Windows 下统一 `node` 直接调脚本，不用 `npm run … -- --x`（PowerShell + npm 10.9 会吞 `--` 之后的参数） |
| 常量 11 | **错误码 + `path` 形态（spec §4 定死）** | `code` 只取两个既有码：D1 → `SubjectiveLabel`；D2/D3/D4/D5 → `UnverifiableOutput`（两者 `exitCodeFor` = 1）。`errors[].path` **无 `predicates[<id>]` 前缀**：`label` / `observable` / `observable[<i>]` / `negativeSample` / `residual.who` / `residual.sample`；`predicates[<id>].<path>：<message>` 由 `gate` 拼。码表与退出码集合一律从 `CARD_MODEL_CODES` / `exitCodeFor` 派生，**不新增码** |
| 常量 12 | **`S3_BASE` / `SEATS` / `TOTAL` / `OLD_LABELS` 绑定** | `S3_BASE` 见常量 7；`SEATS = buildCards().map((b) => b.seat)`；`TOTAL = BASELINE_RULES.length + agentPaths().length`；**`OLD_LABELS` 从 `.mjs` 源码按正则抽，不 `JSON.parse`**：<br>`const src = execFileSync('git', ['show', `${S3_BASE}:tools/docgen/card-model/vocab/predicates.mjs`], { cwd: REPO, encoding: 'utf8' })`<br>`const OLD_LABELS = [...src.matchAll(/label:\s*'([^']*)'/g)].map((m) => m[1])`<br>`assert.equal(OLD_LABELS.length, 8)`（少一条即本组多例红，暴露取数失败）。**不依赖本批新建的 `keywords.json` `I25`** |
| 常量 13 | **`§5 检查点 ⑨ 判据可观察` 的判定本体（v3 定死）** | 判定 = 该规则的**验证节**内 ≥1 行命中 `markers[].pattern`；**验证节 = 标题恰为 `## 验证` 或 `### 验证`**（正则 `^#{2,3}\s*验证$`）的小节（到下一个同级或更高级标题为止）；**多处匹配取第一个**（`§10 D-17`）。**不读豁免清单**；**不** import `evaluateText`（仅作口径参照写在注释里，同 §5③ D-24）。取分读 `scoreFile(...).checks.find((c) => c.check.includes('⑨')).pass` |
| 常量 14 | **圈号三种写法（一符三义消歧）** | ① 规则体检的第 9 项 → **`§5 检查点 ⑨`**；② 施工顺序 → **`§7 步 S1`–`S7`**（含 `S1a` / `S1b`）；③ `check-all` 的门禁段 → **`门禁段 ⑦`**（另 `门禁段 ⑤`）。本文件不再单写裸 `⑦` / `⑧` / `⑨` 指代其中任一种 |
| 常量 15 | **全量门禁不重跑（覆盖表口径）** | `§7 步 S4` / `S7` 的 `npm run check` 是施工与门禁动作，**由 `check-all` 自跑**，本文件不重跑（常量 9 / GAP-7）；§1 覆盖表的「未覆盖 0 项」**只对 spec 约束负责**，不代表用例跑过全量门禁。spec `§9.1` 明写同一句 |

### 0.1 测试侧 helper 清单（每个名字只实现一次；判据列不得出现未登记符号）

| # | 名字 | 签名 | 实现要点（可照抄） |
|---|---|---|---|
| 1 | `vp` | `(map) => validatePredicates(map)` | 直接别名；不改入参 |
| 2 | `markerKindsOf` / `hasMarker` | `(s) => string[]` / `(s) => boolean` | `markers.filter((m) => new RegExp(m.pattern).test(s)).map((m) => m.kind)`；`hasMarker = (s) => markerKindsOf(s).length >= 1` |
| 3 | `labelHitsOf` | `(map) => string[]` | `Object.values(map).map((p) => p.label).filter(subjectiveHit)` |
| 4 | `assertIds` | `(map) => void`（不满足则抛） | A01 的三断言：`keys.length === 8`；键序 `deepEqual` 8 个 id；`impl` 全 `'manual'` |
| 5 | `assertFields` | `(one) => void` | A03 的单条断言：`observable` 非空数组且元素非空字符串、`negativeSample` 非空、`residual.who` 非空、`sample` 正整数、`label` 非空且含 `——` |
| 6 | `renderNeverLine` / `renderMustLine` | `(id) => string` | `mutCard(SEATS[0], (card) => { card.must = []; card.never = [SHARED_NEVER.find((a) => a.criterion === id)] })` → `renderSeat(SEATS[0]).card` → 取 `## 禁止` / `## 一定会` 段首条 `- ` 行；`finally` 还原 |
| 7 | `CORE` | 常量对象 | spec §3「核心语义」列 8 条字面：不偏 / 可复算 / 听懂 / 全过、无问题 / 只提问题不给解法 / 越出职责自行处置 / 证据栏留空 / 代他人填写 |
| 8 | `assertCoreLabel` | `(map) => void` | 逐条 `p.label.includes(CORE[id])`，不满足即抛（列出缺词 id） |
| 9 | `assertLabelDash` | `(map) => void` | 逐条 `p.label.includes('——')` |
| 10 | `assertLabelMarker` | `(map) => void` | 逐条 `hasMarker(p.label.split('——')[1] ?? '')`（**C-8**；`——` 缺失时 `''` 必红） |
| 11 | `assertC8Mirror` | `(labelText) => void` | 单条 label 的 C-8 判定（`hasMarker(后段)`），供 D05 反例直接调 |
| 12 | `assertCarriers` | `(specText) => void` | 解析 spec §3 表 8 行「载体」列：① 非空；② 抽出其中反引号 / `「…」` 内的 token（`「A / B」` 按 ` / ` 再拆），逐个断 ∈ `ALLOWED_CARRIER`，任一越界即抛。**`ALLOWED_CARRIER` 从 `outputFormats` 的实际结构派生**：<br>`new Set([...Object.keys(outputFormats), ...Object.values(outputFormats).flatMap((f) => f.fields), '申报人', '签字人', 'git status --porcelain', '正文', 'outputKind'])`<br>（`outputKind` 键 = `evidence` / `audit` / `issue-card` / `observation` / `testcase`；`gate-record.md` 按**路径后缀**放行） |
| 13 | `assertNoLegacyTerms` | `(text) => void` | `['证据格','具体动作段','验收段','两栏'].filter((k) => text.includes(k)).length === 0`，否则抛 |
| 14 | `assertNoTermCopy` | `(src) => void` | `[...terms, ...criterionTerms].filter((w) => src.includes(w)).length === 0`，否则抛 |
| 15 | `assertCriteriaNine` | `(src) => void` | I01 断言组：`| ⑨` 行恰 1、检查点含「判据可观察」、判定含「验证节」且不含 `evaluateText`、得分列 `/有 1\s*[\/｜]\s*无 0/` |
| 16 | `assertCounts` | `(src) => void` | I02 的（a）～（f）：`criteria.md` 标题「25 检查点」/ 脚注「禁令类 9 项」「6 项」/ 计分式「执行力度 9」「现有 25 项」「20/25」/ §3 导语「25 检查点」/ `writing-guide:34`「6/6」/ `rule-skeleton:29`「6/6」 |
| 17 | `assertTwoTables` | `(src) => void` | I02 的（e）（f）：§3.4 六行 max、§3.5 六行满分逐行等于新值 |
| 18 | `blockOf` | `(src, titlePrefix) => string` | 从含 `test('<titlePrefix>` 的行起至下一条 `test(` 前的片段（块内断言，防全文件 `includes` 假绿） |
| 19 | `seven` / `eight` | `(r) => check 条目` | `r.checks.find((c) => c.check.includes('⑦'))` / `...includes('⑨')`（`scoreFile` 返回的 `checks` 条目形如 `{ group, check, pass, msg }`） |
| 20 | `assertSync` | `(repoDir) => void` | I13 的六项核销断言组（六落点各至少 1 处新增内容在位） |
| 21 | `assertFourEntries` | `(entries) => void` | K01 的四条结构断言（id 顺序 / title 非空 / words ≥1 / scope 无通配且文件存在）+ `I25.words` 等于 `OLD_LABELS` |
| 22 | `hunksOf` | `(diffText) => {oldStart, deleted[]}[]` | 解析 `git diff -U0` 的 `@@ -<oldStart>,<n> +… @@` 与随后的 `-` 行 |
| 23 | `escape` | `(s) => string` | 正则转义（`s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`） |
| 24 | `oldHits` | `(src) => number` | `OLD_LABELS.filter((l) => src.includes(l)).length`（K06 / K09 用） |
| 25 | `legacyTokenHit` | `(s) => boolean` | `s.split(/[、，,/\s]+/).some((t) => terms.includes(t))`（F03 的旧 token 全等口径对照，仅测试侧） |
| 26 | `findingCodes` | `(r) => string[]` | `(r.findings ?? []).map((f) => f.code)`（`checkBuckets` / `checkSharedChanges` 的返回值都带 `findings`） |
| 27 | **import 面（只引用、不新增实现）** | — | `PREDICATES` / `SHARED_MUST` / `SHARED_NEVER` / `OBJECT_NAMES` / `outputFormats` / `subjectiveHit` / `evaluateText` / `validatePredicates` / `CARD_MODEL_CODES` / `SCAN_FIELDS` / `exitCodeFor` / `buildCards` / `renderSeat` / `BASELINE_RULES` / `agentPaths` / `renderBaseline` / `SHARED_MARKERS` / `RULE_MARKER_ITEM` / `BUCKETS` / `checkBuckets` / `itemsFromCriteria` / `unknownMarkers` / `checkSharedChanges` / `parseLedger` / `splitRow` / `agentData` / `tmpdir` / `execFileSync` |

**断言语义**：本文件「判据」列一律写可直接照抄的 `assert.*` 表达式（或 §0.1 已登记的 helper 调用）；不存在「检查是否合理」「确保正确」这类不可判表述。

---

## 1 覆盖总表

> **读法**：右列是**裸组号**（`A01` … `L07`，全称 = `S3-TC-` + 该号）。左列 `§3 C-x` / `§4 Dx` / `§10 D-x` / `§5 检查点 ⑨` / `§7 步 S1` 是 **spec 自身的编号**，不是用例编号（圈号三义见常量 14）。

| 约束 / 条目 | spec 出处 | 用例 ID |
|---|---|---|
| C-1（8 id 与顺序不变、`impl` 全 `manual`、键集恰 8） | §3 | A01 / A02 |
| C-2（四字段齐 + `observable ≥ 1` + `negativeSample` 非空 + `residual.who` 非空 / `sample` 正整数；label 为判据句） | §2 / §3 | A03 / A04 / A05 / E01 |
| C-3（8 条 `label` 不含 `terms`，substring；`observable[]` 不在扫描面） | §3 | B01 / B02 / B03 / B04 |
| C-4（每元素命中 ≥1 条 `markers` 正则；不用 `evaluateText` verdict） | §3 / §4 D5 | C01 / C02 / C03 / E07 |
| C-5（`never` 4 条 label 是违规形态；逐字样例由 `renderCard` 实渲出具，宾语取真实 `shared-actions.mjs`） | §3 | D01 / D02 / D03 |
| C-6（改后 15 卡与 `renderCard` 逐字节相等） | §3 | H01 / H02 / H03 / H04 / H05 / H06 / H07 |
| C-7（语义保真 + **载体在位**：`observable` 落 §3 载体列已声明载体，新增字段 = 不合格） | §3 / §10 D-16 | D04 / D05 |
| C-8（8 条 label **破折号后段**各含 ≥1 marker；与 C-4 同一判法） | §3 / §10 D-17 邻域 | D06 / D05 |
| §4 前提事实（`state.json` 15 席全 `replaced` → C-6 无「未接管席不比对」豁免面） | §4、§3 C-6 | H01 / H05 |
| §4 D1（`label` 命中 `terms` → 红，`observable` 写满不豁免） | §4 | E03 / F04 |
| §4 D2（`observable` 非数组 / 长度 0 / 含空串或非字符串 → 红） | §4 | E04 |
| §4 D3（`negativeSample` 缺 / 空 → 红） | §4 | E05 |
| §4 D4（`residual` 缺 / `who` 空 / `sample` 非正整数 → 红） | §4 | E06 |
| §4 D5（`observable[<i>]` 未命中任何 marker → 红；C-4 的运行时下沉） | §4 | C02 / E07 / E08 |
| §4 `path` 无前缀（5 形态）+ `gate` 拼 `predicates[<id>].<path>：` 报文 | §4、常量 11 | A04 / E03 / E04 / E05 / E06 / E08 / G02 |
| §4 纯函数（**函数体内**零 IO）/ 不改入参 / **0 新码** | §4、§10 D-3 邻域 | E02 / E08 |
| §4 错误码复用（D1 → `SubjectiveLabel`；D2–D5 → `UnverifiableOutput`；两者 `exitCodeFor` = 1） | §4、常量 11 | E02 / E03 / E04 / E05 / E06 / E07 / E08 / G02 |
| §4 substring 单实现点（唯一实现、`validateCardModel` 改用它、判定面扩大） | §4 | F01 / F02 / F03 / F07 |
| §4 卡面可行性（扫描三面 **291** + 超集 **45** = **336 条文本 / substring 0 / token 0**，数据在 `card` 键下） | §4、§9.3 ② | F05 / F06 |
| §4 接线（`gate` 调 `validatePredicates`；错 → exit 1 且报文含 `predicates[<id>]`；不进 `Mismatch`） | §4 | G01 / G02 / G03 |
| §4 `card-model/index.mjs` barrel 不加导出（18 项为自觉约束） | §4、§10 D-4 | G04 |
| §5 检查点 ①（`criteria.md` §2.4 新增 `§5 检查点 ⑨`，判定 = 验证节内 ≥1 行命中 markers） | §5 | I01 |
| §5 检查点 ②（`recipes.md` 新增 §R9 判据不可观察，三条改法） | §5 | I03 |
| §5 检查点 ③（`score.mjs` 新增 `§5 检查点 ⑨`：扫验证节 markers / 不读豁免清单 / **不** import `evaluateText`（仅口径参照）） | §5、§9.2 V-9（D-12 收窄） | I04 |
| §5 检查点 ⑨ 判别力三态（有标记 1 / 无标记 0 / 无验证节 0） | §5、§10 D-14 | I05 / I06 / I07 |
| §10 D-17（验证节口径写死 `^#{2,3}\s*验证$`、多处取第一个） | §10 D-17、§5 检查点 ①③ | I08 / I01 |
| §5 检查点 ④（`rules/skill-authoring-convention.md` 新增判据⑤） | §5 | I12 |
| §5 计数口径**清单**（`criteria.md:1`/`:81` 三处计数与「20/24」/`:85`、§3.4 六行、§3.5 六行、`SKILL.md:35`、`writing-guide:1,:19,:34`、`rule-writer/SKILL.md:3,:29,:36`、`rule-skeleton.md:29`、`rule-edit-checklist-template.md:75`、`score.test.mjs` 逐条 +1） | §5 | I02 / I10 / I11 / I14 |
| §5 归桶**四处**登记（`buckets.mjs` 的 `BUCKETS` 两桶 items / `RULE_MARKER_ITEM` / `SKILL_MARKER_ITEM` / `check-buckets.mjs` 注释）+ ⑨·⑤ 为各自独有 → **不进 `SHARED_MARKERS`、不触发 R7** | §5、§10 D-10 邻域 | I02 / I09 |
| §5 同步义务 6 项逐项核销（①②③④⑤⑥） | §5 | I12 / I13 / I14 |
| §6.1 `skills/rule-writer/SKILL.md` 自查第 3 步加判据可观察 | §6.1 | J01 / J02 |
| §6.1 `skills/dev-workflow/SKILL.md` 指针节加一行（不改段表） | §6.1 | J03 / J04 |
| §6.2 全局 `skill-creator` 缺口落 `docs/after/` 在册（四要素） | §6.2、§10 D-9 | J05 |
| §7 步 S1（改 8 条 label）后**必红期**：`gate` exit 1 且 `Mismatch` 出现 **1 次**（单行，点名 `agents/<席>.md`） | §7、§10 D-15 邻域 | H06 |
| §7 步 S1a（改旧 label 的测试与引用件）→ S1b（15 卡重生成）顺序可达 | §7 | H07 / H08 |
| §7 回退面（`git checkout <S3-BASE> -- predicates.mjs agents/` → 回 S2 终态） | §7 | H06 |
| §7 `门禁段 ⑦` 不动（扫描根仍 `rules/` + `skills/`）、不新增 `门禁段 ⑧` | §7、§10 D-2 / D-7 | L02 |
| §8 旧 label 命中面（`predicates.mjs` 8 / `agents/*.md` 135 / 测试与引用件）各面处置 | §8 | K04 / K05 / K06 / K09 |
| §8 `agents/*.md` 15 卡同批重生成 | §8 | H01 / H02 / H03 / K05 |
| §8 `pilot-render.test.mjs` 1 行 / `evidence-reader.test.mjs` **前缀子串** 3 行 → 改派生化 | §8 | K09 |
| §8 `skills/parliament/**` 3 处改引用（不复制新文案） | §8 | K06 |
| §8 `tools/execution-matrix/criteria.md` 1 行改 | §8 | K05 |
| §8 历史件「标历史保留」+ **过程账不改** + 本批两件自身引用 | §8、§9.3 ① | K07 |
| §8 `keywords.json` 补 `I22`–`I25` 并 `--freeze` 记改前值 | §8、§10 D-10 | K01 / K02 / K03 |
| §8 每个命中处进当次 `impact-sheet.md` 并写处置 | §8（清单缺文件必红；GAP-6） | K08 |
| §9.2 V-8（判据可观察 + 红探针 + 反向探针 `['ok']` → D5 红） | §9.2 | A03 / F04 / E07 |
| §9.2 V-9（复用不复制；收窄：只判「`score.mjs` 新增 `§5 检查点 ⑨` 块内」词面，D-12） | §9.2 / D-12 | F01 / F02 / F03 / F07 / I04 |
| §9.2 V-10（全量门禁 + `sweep` + 逐席 disk == render；审计抽核归 `§7 步 S4` 段门行，D-13；**不出** `baseline --write`，D-15） | §9.2 / D-13 / D-15 | K04 / L01 / G01 / H01 / H02 |
| §9.3 三条命令（①旧 label 命中面 ②卡面双口径 ③C-4 判别力） | §9.3 | K07 / F05 / C02 |
| §10 D-5（15 卡同批重生成；**不做** `baseline --write`） | §10 | H01 / H04 |
| §10 D-11（testcase ≤ 80） | §10 | L03 |
| §10 D-18（`never` 可判句必须是违规形态：`diff` 非空 / 代填行 ≥1） | §10 | D01 / D02 |
| 本文件自身（ID 同名 / 不内联 spec / 不自递归 / 计数自洽 / helper 复用 / 全量门禁不重跑） | 常量 3 / 9 / 15 | L03 / L04 / L05 / L06 / L07 |

**覆盖核对**：spec v3.1 验收项（`§3 C-1`～`C-8`、§4 前提事实与 `D1`～`D5` + 接线 + 错误码/path、`§5` 四处 + 计数清单 + 归桶四处（不触发 R7）+ 同步 6 项 + `§5 检查点 ⑨` 三态 + D-17、`§6.1` 两处、`§6.2`、`§7 步 S1`–`S7` + 必红期 + 回退面、`§8` 全表、`§9.2` V-8/V-9/V-10、`§10 D-18`）**已全部指派到用例**；未覆盖 0 项（**只对 spec 约束负责，不含全量门禁执行** —— 常量 15）。语义面（label 措辞好坏 / 载体列的自然语言是否贴切）见 §17 GAP-2 / GAP-8 / GAP-11。

---

## 2 A 组：8 条 predicates 的键集与四字段（§3 C-1 / C-2）

### S3-TC-A01 8 个 id 与顺序不变且 impl 全 manual（C-1 正例）【正】

- **覆盖**：`§3 C-1`
- **前置**：`predicates.mjs` 已改；`PREDICATES` 可 import；`assertIds`（§0.1 #4）可取
- **步骤**：`test('S3-TC-A01 8 id 键集与 impl')`：① 取 `Object.keys(PREDICATES)` 与 spec §3 表 8 个 id 顺序逐项比（**顺序也判** —— 渲染按数据序取 label）；② 逐条断 `impl === 'manual'`；③ 断大小恰 8
- **预期**：键序与 spec §3 表逐项相等；`impl` 8/8 `'manual'`；大小 8
- **判据**：`assertIds(PREDICATES)`；`assert.deepEqual(Object.keys(PREDICATES), ['impartial-long-term','evidence-recomputable','plain-expression','no-fake-problem','issue-without-solution','out-of-scope-self-disposal','blank-evidence','proxy-fill'])`；`assert.equal(Object.values(PREDICATES).map((p) => p.impl).every((x) => x === 'manual'), true)`

### S3-TC-A02 多一条 / 少一条 / impl 改 script 各红（C-1 反例）【负】

- **覆盖**：`§3 C-1`
- **前置**：同 A01
- **步骤**：`test('S3-TC-A02 键集漂移三构造')`：内存造三份副本 —— ① 追加第 9 个 id；② 删 `proxy-fill`；③ 把 `plain-expression` 的 `impl` 改 `'script'`；每份各跑一次 `assertIds`
- **预期**：三次都抛
- **判据**：`assert.throws(() => assertIds(withExtra))`；`assert.throws(() => assertIds(withoutOne))`；`assert.throws(() => assertIds(implChanged))`；`assert.equal(Object.keys(PREDICATES).length, 8)`（构造未落盘）

### S3-TC-A03 8 条四字段齐、label 为判据句（C-2 正例，V-8 结构面）【正】

- **覆盖**：`§3 C-2`、`§2` label 术语、`§9.2 V-8`
- **前置**：`PREDICATES` 可读；`assertFields`（§0.1 #5）可取
- **步骤**：`test('S3-TC-A03 四字段与判据句')`：对 8 条逐条跑 `assertFields`；另断 `observable` 元素总数 ≥ 条数（8）
- **预期**：8/8 全过（`observable` 非空且元素为非空字符串、`negativeSample` 非空、`residual.who` 非空、`sample` 正整数、`label` 含 `——`）；元素总数 ≥ 8
- **判据**：`Object.values(PREDICATES).forEach((p) => assertFields(p))`；`assert.ok(Object.values(PREDICATES).flatMap((p) => p.observable).length >= 8)`；`assert.equal(Object.values(PREDICATES).filter((p) => !p.label.includes('——')).length, 0)`

### S3-TC-A04 四字段各类缺形逐条红且 path 无前缀（C-2 反例）【负】

- **覆盖**：`§3 C-2`、`§4` path 形态
- **前置**：同 A03；`vp`（§0.1 #1）可取
- **步骤**：`test('S3-TC-A04 字段缺形五构造')`：① 删 `observable` 键；② `observable: []`；③ `observable: ['', '计数 = 1']`；④ `negativeSample: ''`；⑤ `residual: { who: '', sample: 3 }`
- **预期**：五次都红；`path` 无 `predicates[` 前缀：①`observable`、③`observable[0]`、④`negativeSample`、⑤`residual.who`
- **判据**：`[c1,c2,c3,c4,c5].forEach((c) => assert.throws(() => assertFields(c)))`；`assert.equal(vp(c1).errors[0].path, 'observable')`；`assert.equal(vp(c3).errors[0].path, 'observable[0]')`；`assert.equal(vp(c4).errors[0].path, 'negativeSample')`；`assert.equal(vp(c5).errors[0].path, 'residual.who')`；`assert.equal(vp(c1).errors[0].path.startsWith('predicates['), false)`

### S3-TC-A05 `residual.sample` 正整数边界（C-2 边界）【边界】

- **覆盖**：`§3 C-2`
- **前置**：同 A03；`vp` 可取；**不在 `map` 内调会抛的断言**（成对 doesNotThrow / throws）
- **步骤**：`test('S3-TC-A05 sample 边界')`：喂 `sample` = `1`（最小合法）、`0`、`-1`、`1.5`、`'3'`、`NaN` 各一次，逐值单独判
- **预期**：只有 `1` 过；其余五种全红（判据是 `Number.isInteger && > 0`，不是「大于 0」）
- **判据**：`assert.doesNotThrow(() => assertFields({ ...base, residual: { who: 'reviewer-audit', sample: 1 } }))`；`[0, -1, 1.5, '3', NaN].forEach((v) => assert.throws(() => assertFields({ ...base, residual: { who: 'reviewer-audit', sample: v } })))`；`assert.deepEqual([0, -1, 1.5, '3', NaN].map((v) => vp({ ...base, residual: { who: 'reviewer-audit', sample: v } }).ok), [false, false, false, false, false])`

---

## 3 B 组：8 条 label 不含主观词（§3 C-3，substring 口径；`observable` 面归 C-4）

### S3-TC-B01 8 条 label 对 terms 0 命中（C-3 正例）【正】

- **覆盖**：`§3 C-3`（判定面 = 8 条 `label`）
- **前置**：`terms` 从 JSON 派生；`subjectiveHit` 可 import；`labelHitsOf`（§0.1 #3）可取
- **步骤**：`test('S3-TC-B01 label 零命中')`：取 8 条 `label` 逐个跑 `subjectiveHit`，收集命中项
- **预期**：命中项 `[]`；`terms` 非空；扫描条数 == 8（防「词表为空 / 循环没跑」的恒真）
- **判据**：`assert.deepEqual(labelHitsOf(PREDICATES), [])`；`assert.ok(terms.length >= 5)`；`assert.equal(Object.values(PREDICATES).length, 8)`

### S3-TC-B02 红探针：旧 label 复原即命中（C-3 反例，V-8）【负】

- **覆盖**：`§3 C-3`、`§4 D1`、`§9.2 V-8`
- **前置**：`subjectiveHit` 已为 substring 口径；`OLD_LABELS` 由常量 12 的 `git show` 正则抽取（8 条）
- **步骤**：`test('S3-TC-B02 旧 label 红探针')`：在内存副本把 `impartial-long-term` 的 label 复原为 `OLD_LABELS[0]`，跑 `subjectiveHit` 与 `vp`
- **预期**：`subjectiveHit(旧 label) === true`（命中「客观」）；`vp` 必红、`code === 'SubjectiveLabel'`、`path === 'label'`；仓内 `vp(PREDICATES).ok === true`
- **判据**：`assert.equal(OLD_LABELS[0], '立场客观且按项目长远判断')`；`assert.equal(subjectiveHit(OLD_LABELS[0]), true)`；`assert.equal(vp(copy).ok, false)`；`assert.equal(vp(copy).errors[0].code, 'SubjectiveLabel')`；`assert.equal(vp(copy).errors[0].path, 'label')`；`assert.equal(vp(PREDICATES).ok, true)`

### S3-TC-B03 词表外的同义形容不判红（C-3 边界）【边界】

- **覆盖**：`§3 C-3`
- **前置**：同 B01；`terms` 已知为 9 词封闭表
- **步骤**：`test('S3-TC-B03 词表边界')`：喂 ①「依据公正且证据栏非空」（不含 `terms` 任一）；②「判断客观且证据栏非空」（含「客观」）
- **预期**：① `false`（词表封闭，只判 9 词）；② `true`（substring 命中即红，同句 marker 不豁免 label）
- **判据**：`assert.equal(subjectiveHit('依据公正且证据栏非空'), false)`；`assert.equal(subjectiveHit('判断客观且证据栏非空'), true)`；`assert.equal(terms.length, 9)`

### S3-TC-B04 C-3 扫描面只喂 label：observable 含词不判红、label 含词必红（C-3 反例）【负】

- **覆盖**：`§3 C-3`（`observable[]` 不在主观词扫描面，可判性归 C-4）
- **前置**：`subjectiveHit` / `vp` / `markerKindsOf` 可取；`terms` 派生（不写字面）
- **步骤**：`test('S3-TC-B04 只喂 label')`：内存造两份副本 —— ① `plain-expression` 的 `observable` 追加 `terms[0] + '；证据栏非空'`；② 同一文本写进 `plain-expression` 的 `label`。每份跑：ⓐ label 面扫描、ⓑ `vp`、ⓒ 标记面
- **预期**：① label 面命中 0、扫描条数 == 8、`vp(copy).ok === true`、该元素标记命中 ≥1；② 命中 ≥1、`vp(copy).ok === false` 且 `path === 'label'`；③ 仓内 `ok === true`
- **判据**：`assert.deepEqual(labelHitsOf(copyObservableTerm), [])`；`assert.equal(labelHitsOf(copyObservableTerm).length + 8, 8)`；`assert.equal(vp(copyObservableTerm).ok, true)`；`assert.ok(markerKindsOf(termWithMarker).length >= 1)`；`assert.ok(labelHitsOf(copyLabelTerm).length >= 1)`；`assert.equal(vp(copyLabelTerm).errors[0].path, 'label')`；`assert.equal(vp(PREDICATES).ok, true)`

---

## 4 C 组：observable 每元素命中 ≥1 可观察标记（§3 C-4，**直接跑 markers 正则**）

### S3-TC-C01 8×N 条 observable 全命中标记（C-4 正例）【正】

- **覆盖**：`§3 C-4`
- **前置**：`markers` 从 JSON 派生；常量 6 两个 helper 可取
- **步骤**：`test('S3-TC-C01 observable 全命中标记')`：对 `Object.values(PREDICATES).flatMap((p) => p.observable)` 逐元素算 `markerKindsOf`，收集零命中元素
- **预期**：零命中元素 `[]`；`markers.length === 8`；元素总数 ≥ 8；用到的标记种类 ≥ 5（防「只靠一种标记凑数」）
- **判据**：`assert.deepEqual(noMarkerItems, [])`；`assert.equal(markers.length, 8)`；`assert.ok(elements.length >= 8)`；`assert.deepEqual([...new Set(elements.flatMap((e) => markerKindsOf(e)))].sort(), ['compare','count','empty','nonempty','pathline'].sort())`

### S3-TC-C02 `['ok']` / `'写得好'` 零标记（C-4 反例）【负】

- **覆盖**：`§3 C-4`、`§4 D5`、`§9.3 ③`
- **前置**：同 C01；`evaluateText` 可 import（**只作反向证据**，同 §9.3 ③）
- **步骤**：`test('S3-TC-C02 空转探针')`：对 `'ok'` / `'写得好'` 各算 `markerKindsOf`；再跑 `evaluateText('ok')` 记录 verdict
- **预期**：两者标记命中 `[]`（C-4 必红）；`evaluateText('ok')` 的 verdict 仍 `'pass'` —— 反向证据：旧判法（用 verdict 代替「含标记」）对 `'ok'` 空转，C-4 不得回退到它
- **判据**：`assert.deepEqual(markerKindsOf('ok'), [])`；`assert.deepEqual(markerKindsOf('写得好'), [])`；`assert.equal(evaluateText('ok', { terms, markers }).verdict, 'pass')`（仅钉「verdict ≠ 含标记」）

### S3-TC-C03 标记命中矩阵 + 整串口径（C-4 边界，D-17 邻域）【边界】

- **覆盖**：`§3 C-4`、`§3 C-3`（两面不重叠）、常量 6
- **前置**：同 C01；`subjectiveHit` 可 import
- **步骤**：`test('S3-TC-C03 矩阵与整串')`：① 四条构造各算 `markerKindsOf`：`计数 = 2` / `计数 ≥ 2` / `依据 scripts/check-observable.mjs:12` / `退出码 exit 0`；② 整串对照：`判断客观稳妥`（无标记）与 `对照 scripts/check-observable.mjs:12\n判断客观稳妥`（标记只在第 1 行）
- **预期**：① 四类各命中各的（`count` / `compare` / `pathline` / `exit`）；② 前者 `[]`、后者 `['pathline']`（标记按**整串**判，不按 `evaluateText` 的分块语义）；任取含主观词文本 `subjectiveHit` 真而标记非空 ⇒ 两面不互替
- **判据**：`assert.deepEqual(markerKindsOf('计数 = 2'), ['count'])`；`assert.deepEqual(markerKindsOf('计数 ≥ 2'), ['compare'])`；`assert.deepEqual(markerKindsOf('依据 scripts/check-observable.mjs:12'), ['pathline'])`；`assert.deepEqual(markerKindsOf('退出码 exit 0'), ['exit'])`；`assert.deepEqual(markerKindsOf('判断客观稳妥'), [])`；`assert.deepEqual(markerKindsOf('对照 scripts/check-observable.mjs:12\n判断客观稳妥'), ['pathline'])`；`assert.equal(subjectiveHit(terms[0] + '；证据栏非空'), true)`；`assert.ok(hasMarker(terms[0] + '；证据栏非空'))`

---

## 5 D 组：`never` 违规形态、语义保真与 C-8（§3 C-5 / C-7 / C-8、§10 D-18）

### S3-TC-D01 4 条 never label 的实渲逐字行（宾语取真实 `shared-actions.mjs`）（C-5 正例，D-18 正）【正】

- **覆盖**：`§3 C-5`、`§10 D-18`
- **前置**：`PREDICATES` 已改；`renderNeverLine`（§0.1 #6）可取；`SHARED_NEVER` / `OBJECT_NAMES` 可 import；`SEATS[0]` 取自常量 12
- **步骤**：`test('S3-TC-D01 never 逐字行')`：对 `NEVER_IDS`（4 条）逐条渲染取 `## 禁止` 段首条 bullet；并断两条违规形态措辞（`out-of-scope` 用「越界处置动作 计数 ≥1 且正文无「声明」行」、`proxy-fill` 用「签名字段所记名称 != 该实例名」）
- **预期**：4 行逐字等于「`- 1｜不得` + `PREDICATES[id].label` + `（针对` + 真实宾语中文名 + `）；出现即违反。」`；宾语来自 `SHARED_NEVER` 真值（`issue-without-solution` 的 `issue.card.suggestion` → **问题卡「建议解法」栏**）；`out-of-scope` 的可判句是**计数 ≥1 且无「声明」行**、`proxy-fill` 的可判句是**所记名称 != 该实例名**（通过态写进「不得」句 = D-18 违规）
- **判据**：`assert.equal(NEVER_IDS.length, 4)`；`assert.equal(OBJECT_NAMES['issue.card.suggestion'], '问题卡「建议解法」栏')`；`assert.deepEqual(lines, NEVER_IDS.map((id) => \`- 1｜不得${PREDICATES[id].label}（针对${SHARED_NEVER.find((a) => a.criterion === id).objects.map((o) => OBJECT_NAMES[o]).join('、')}）；出现即违反。\`))`；`assert.equal(/计数 ≥1/.test(PREDICATES['out-of-scope-self-disposal'].label), true)`；`assert.equal(/所记名称 != 该实例名/.test(PREDICATES['proxy-fill'].label), true)`
- **逐字样例（实渲出具，供人工回读；草案改字时同批更新）**：
  1. `- 1｜不得只提问题不给解法——问题卡「建议解法」栏为空（针对问题卡「建议解法」栏）；出现即违反。`
  2. `- 1｜不得越出职责自行处置——越界处置动作 计数 ≥1 且正文无「声明」行（针对交付物正文）；出现即违反。`
  3. `` - 1｜不得证据栏留空——结论行证据栏无 `path:line` 与命令首行（针对交付物证据）；出现即违反。 ``
  4. `- 1｜不得代他人填写其本人应填的表——签名字段所记名称 != 该实例名（针对交付物正文）；出现即违反。`

### S3-TC-D02 never 写成 must 形态 / 把通过态写进 never → 各红（C-5 + D-18 反例）【负】

- **覆盖**：`§3 C-5`、`§10 D-18`
- **前置**：同 D01；`mutCard` 可构造独立卡
- **步骤**：`test('S3-TC-D02 never 形态两构造')`：① 内存把 `issue-without-solution` 的 label 改成「须给具体动作与验收」（义务形态）→ 重渲；② 把 `out-of-scope-self-disposal` 的 label 后段改成通过态「越界处置动作 计数 = 0 且正文含「声明」行」→ 跑 D-18 断言
- **预期**：① 渲染行同时含「不得」与「须」→「不得须给…」双否定，判红；还原后不含「须」；② D-18 的 `/计数 ≥1/` 断言抛（通过态不得写进「不得」句）；仓内 4 条 never 行 0 处双极性
- **判据**：`assert.equal(/不得/.test(mutLine) && /须/.test(mutLine), true)`；`assert.equal(/须/.test(restoredLine), false)`；`assert.throws(() => assert.equal(/计数 ≥1/.test(copyOutOfScopeLabel), true))`；`assert.equal(NEVER_IDS.map((id) => /不得[^。]*[须必须]/.test(renderNeverLine(id))).filter(Boolean).length, 0)`

### S3-TC-D03 must 侧形态边界：4 条 must 行无「不得」且 label 可承载 `path:line`（C-5 边界）【边界】

- **覆盖**：`§3 C-5`
- **前置**：同 D01；must 侧走 `expectedBullet`（`要求<label>，`）
- **步骤**：`test('S3-TC-D03 must 侧')`：对 `MUST_IDS`（4 条）渲 `## 一定会` 段，扫「不得」前缀；取 `evidence-recomputable` 的渲染行
- **预期**：4 行 0 处「不得」；`evidence-recomputable` 的行里 `path:line` 字面原样出现
- **判据**：`assert.equal(MUST_IDS.map((id) => /不得/.test(renderMustLine(id))).filter(Boolean).length, 0)`；`assert.equal(renderMustLine('evidence-recomputable').includes('path:line'), true)`；`assert.equal(MUST_IDS.length, 4)`

### S3-TC-D04 语义保真 + 载体列在位（C-7 正例）【正】

- **覆盖**：`§3 C-7`、`§10 D-16`
- **前置**：`PREDICATES` 可读；`CORE`（§0.1 #7）/ `assertCoreLabel` / `assertLabelDash` / `assertNoLegacyTerms` / `assertCarriers` 可取；spec 正文可读（`assertCarriers` 解析其 §3 表）
- **步骤**：`test('S3-TC-D04 语义保真与载体')`：① `assertCoreLabel(PREDICATES)`；② `assertLabelDash(PREDICATES)`；③ 8 条 `label + observable + negativeSample` 拼成全文跑 `assertNoLegacyTerms`；④ 对 spec §3 表跑 `assertCarriers`
- **预期**：8/8 核心语义词在位、8/8 有破折号；旧术语（`证据格` / `具体动作段` / `验收段` / `两栏`）命中 `0`；载体列 8/8 非空，且其中的 token（`outputKind` 键 / `outputFormats` 字段名 / `申报人`·`签字人` 列名 / `git status --porcelain` / `gate-record.md`）**全部落在 `ALLOWED_CARRIER`**（该集合从 `Object.keys(outputFormats)` + 各 `fields` 派生）；全文出现 `问题卡「建议解法」栏`（术语对齐卡面）
- **判据**：`assertCoreLabel(PREDICATES)`；`assertLabelDash(PREDICATES)`；`assertNoLegacyTerms(allText)`；`assertCarriers(specSrc)`；`assert.ok(allText.includes(OBJECT_NAMES['issue.card.suggestion']))`

### S3-TC-D05 核心语义被替换 / 载体指向未声明字段 / C-8 后段无标记 → 各红（C-7 + C-8 反例）【负】

- **覆盖**：`§3 C-7`、`§3 C-8`、`§10 D-16`
- **前置**：同 D04；内存副本
- **步骤**：`test('S3-TC-D05 三条反例')`：① 把 `no-fake-problem` 的 label 换成只留可判句的 `findings 集合为空时该行必须存在`；② spec 副本的 `blank-evidence` 载体格改成 `「两栏」`；③ 把 `proxy-fill` 的 label 后段换成无 marker 的通过态 `签名字段所记名称与本实例名一致`
- **预期**：① `assertCoreLabel` 抛（缺「全过、无问题」）且 `assertLabelDash` 抛；② `assertCarriers` 抛（`「两栏」` 不在 `ALLOWED_CARRIER`）且 `assertNoLegacyTerms` 抛；③ `assertC8Mirror` 抛（后段零 marker）
- **判据**：`assert.throws(() => assertCoreLabel(copy1))`；`assert.throws(() => assertLabelDash(copy1))`；`assert.throws(() => assertCarriers(specCopy))`；`assert.throws(() => assertNoLegacyTerms('两栏依据'))`；`assert.throws(() => assertC8Mirror(PREDICATES['proxy-fill'].label.replace(/——.*$/, '——签名字段所记名称与本实例名一致')))`；`assert.equal(repoShaAfter, repoShaBefore)`

### S3-TC-D06 8 条 label 破折号后段各含 ≥1 marker（C-8 正例）【正】

- **覆盖**：`§3 C-8`
- **前置**：`PREDICATES` 已改；`markerKindsOf` / `hasMarker` 可取；`assertLabelMarker`（§0.1 #10）可取
- **步骤**：`test('S3-TC-D06 label 后段可判')`：逐条取 `label.split('——')[1] ?? ''`，算 `markerKindsOf`；并断 8 条后段的标记种类并集 ≥ 3（防「全都靠 `非空` 一个词」）
- **预期**：8/8 后段命中 ≥1 marker；并集种类 ≥ 3；缺 `——` 的条目也会红（`''` 零命中）
- **判据**：`assertLabelMarker(PREDICATES)`；`assert.equal(Object.values(PREDICATES).filter((p) => !p.label.includes('——')).length, 0)`；`assert.ok(new Set(Object.values(PREDICATES).flatMap((p) => markerKindsOf(p.label.split('——')[1] ?? ''))).size >= 3)`

---

## 6 E 组：`validatePredicates` 五条判定与纯函数面（§4 D1–D5）

### S3-TC-E01 五条判定全过 → `{ ok: true, errors: [] }`（D1–D5 正例）【正】

- **覆盖**：`§4 D1`、`§4 D2`、`§4 D3`、`§4 D4`、`§4 D5`、`§3 C-2`
- **前置**：`tools/docgen/card-model/validatePredicates.mjs` 已建；`vp` 可取
- **步骤**：`test('S3-TC-E01 仓内 8 条全过')`：`vp(PREDICATES)` 跑一次
- **预期**：`ok === true`；`errors.length === 0`；`Object.keys(result)` 恰 `['ok','errors']`
- **判据**：`assert.deepEqual(vp(PREDICATES), { ok: true, errors: [] })`；`assert.deepEqual(Object.keys(vp(PREDICATES)), ['ok', 'errors'])`

### S3-TC-E02 纯函数（函数体零 IO）、0 新码、码只取两个 exit 1 码【正】

- **覆盖**：`§4` 纯函数面、`§4` 0 新码、`§4` 错误码复用
- **前置**：`validatePredicates.mjs` 源码可读；`CARD_MODEL_CODES` / `SCAN_FIELDS` / `exitCodeFor` 可 import
- **步骤**：`test('S3-TC-E02 纯函数与 0 新码')`：① 取**函数体**源码（`export function validatePredicates` 到配平右括号）扫 `readFileSync` / `writeFileSync` / `process.env` 命中 0（模块加载时读 JSON 属既有形态）；② 函数体内大写驼峰字符串字面量取集与 `{SubjectiveLabel, UnverifiableOutput}` 求差集；③ `CARD_MODEL_CODES` 键数 36；④ `SCAN_FIELDS` 键数 8；⑤ `exitCodeFor` 两码各 1
- **预期**：五条全过（不得为加新码改 `SCAN_FIELDS` 键集或扩码表）
- **判据**：`assert.equal(/readFileSync|writeFileSync|process\.env/.test(fnSrc), false)`；`assert.deepEqual([...codeLiterals].filter((c) => !['SubjectiveLabel','UnverifiableOutput'].includes(c)), [])`；`assert.equal(Object.keys(CARD_MODEL_CODES).length, 36)`；`assert.equal(Object.keys(SCAN_FIELDS).length, 8)`；`assert.deepEqual([exitCodeFor('SubjectiveLabel'), exitCodeFor('UnverifiableOutput')], [1, 1])`

### S3-TC-E03 label 命中 terms 即红且 `observable` 写满不豁免（D1 反例）【负】

- **覆盖**：`§4 D1`、`§4` path 形态、`§9.2 V-8`
- **前置**：同 E01
- **步骤**：`test('S3-TC-E03 D1 不豁免')`：把 `impartial-long-term` 的 label 改成「判断客观且依据条 计数 ≥ 2」（observable 保持原样全满），跑 `vp`
- **预期**：`ok === false`；恰 1 条 error；`code === 'SubjectiveLabel'`；`path === 'label'`
- **判据**：`assert.equal(vp(copy).ok, false)`；`assert.equal(vp(copy).errors.length, 1)`；`assert.equal(vp(copy).errors[0].code, 'SubjectiveLabel')`；`assert.equal(vp(copy).errors[0].path, 'label')`

### S3-TC-E04 `observable` 四种非形各红且 path 带下标（D2 反例）【负】

- **覆盖**：`§4 D2`、`§4` path 形态
- **前置**：同 E01
- **步骤**：`test('S3-TC-E04 D2 四形态')`：① `observable: '计数 = 1'`（非数组）；② `observable: []`；③ `observable: ['计数 = 1', '']`；④ `observable: ['计数 = 1', 3]`
- **预期**：四次都红且 `code` 均 `UnverifiableOutput`；① `path === 'observable'`；③④ `path === 'observable[1]'`
- **判据**：`assert.deepEqual([c1,c2,c3,c4].map((c) => vp(c).ok), [false,false,false,false])`；`assert.deepEqual([c1,c2,c3,c4].map((c) => vp(c).errors[0].code), Array(4).fill('UnverifiableOutput'))`；`assert.equal(vp(c1).errors[0].path, 'observable')`；`assert.equal(vp(c3).errors[0].path, 'observable[1]')`

### S3-TC-E05 `negativeSample` 缺或空即红（D3 反例）【负】

- **覆盖**：`§4 D3`、`§4` path 形态
- **前置**：同 E01
- **步骤**：`test('S3-TC-E05 D3 两形态')`：① 删键；② 值 = `'   '`
- **预期**：两次都红且 `code` 均 `UnverifiableOutput`，`path` 均 `negativeSample`
- **判据**：`assert.deepEqual([vp(c1).ok, vp(c2).ok], [false, false])`；`assert.deepEqual([vp(c1).errors[0].code, vp(c2).errors[0].code], ['UnverifiableOutput','UnverifiableOutput'])`；`assert.deepEqual([vp(c1).errors[0].path, vp(c2).errors[0].path], ['negativeSample','negativeSample'])`

### S3-TC-E06 `residual` 缺 / who 空 / sample 非正整数各红（D4 反例）【负】

- **覆盖**：`§4 D4`、`§4` path 形态
- **前置**：同 E01
- **步骤**：`test('S3-TC-E06 D4 四形态')`：① 删 `residual` 键；② `{ who: '', sample: 3 }`；③ `{ who: 'reviewer-audit', sample: 0 }`；④ `{ who: 'reviewer-audit', sample: '3' }`
- **预期**：四次都红且 `code` 均 `UnverifiableOutput`；①② `path === 'residual.who'`；③④ `path === 'residual.sample'`
- **判据**：`assert.deepEqual([c1,c2,c3,c4].map((c) => vp(c).ok), [false,false,false,false])`；`assert.deepEqual([c1,c2,c3,c4].map((c) => vp(c).errors[0].code), Array(4).fill('UnverifiableOutput'))`；`assert.deepEqual([vp(c1).errors[0].path, vp(c2).errors[0].path], ['residual.who','residual.who'])`；`assert.deepEqual([vp(c3).errors[0].path, vp(c4).errors[0].path], ['residual.sample','residual.sample'])`

### S3-TC-E07 `observable` 元素无标记 → D5 必红（V-8 反向探针）【负】

- **覆盖**：`§4 D5`、`§3 C-4`、`§9.2 V-8`
- **前置**：同 E01；`markers` 派生
- **步骤**：`test('S3-TC-E07 D5 反向探针')`：把 `no-fake-problem` 的 `observable` 换成 `['ok']` 与 `['写得好']` 两份副本各跑 `vp`，并算 `markerKindsOf`
- **预期**：两副本都红；`code === 'UnverifiableOutput'`；`path === 'observable[0]'`；`markerKindsOf` 均 `[]`
- **判据**：`assert.deepEqual([vp(c1).ok, vp(c2).ok], [false, false])`；`assert.deepEqual([vp(c1).errors[0].code, vp(c2).errors[0].code], ['UnverifiableOutput','UnverifiableOutput'])`；`assert.deepEqual([vp(c1).errors[0].path, vp(c2).errors[0].path], ['observable[0]','observable[0]'])`；`assert.deepEqual([markerKindsOf('ok'), markerKindsOf('写得好')], [[], []])`

### S3-TC-E08 一回列全（不短路）+ path 无前缀 + 不改入参（D1–D5 边界）【边界】

- **覆盖**：`§4 D1`–`D5`、`§4` 不改入参、`§4` path 形态
- **前置**：同 E01；`structuredClone` 可取快照
- **步骤**：`test('S3-TC-E08 全列与不可变')`：构造一条同时违 D1（label 含 term）+ D3（`negativeSample: ''`）+ D4（`sample: 0`）+ D5（`observable: ['ok']`）的记录，跑一次；跑前跑后各取 `JSON.stringify(PREDICATES)` 快照
- **预期**：`errors.length >= 4`；`path` 覆盖四类且**全部无 `predicates[` 前缀**；`code` 集恰 `{SubjectiveLabel, UnverifiableOutput}`；每条 error 键集恰 `code / path / message`；入参快照逐字相等
- **判据**：`assert.ok(vp(copy).errors.length >= 4)`；`assert.deepEqual([...new Set(vp(copy).errors.map((e) => e.path.replace(/\[\d+\]/g, '[]'))].sort(), ['label','negativeSample','observable[]','residual.sample'].sort())`；`assert.equal(vp(copy).errors.some((e) => e.path.startsWith('predicates[')), false)`；`assert.deepEqual([...new Set(vp(copy).errors.map((e) => e.code))].sort(), ['SubjectiveLabel','UnverifiableOutput'])`；`assert.deepEqual(Object.keys(vp(copy).errors[0]).sort(), ['code','message','path'])`；`assert.equal(before, after)`

---

## 7 F 组：substring 单实现点与卡面可行性（§4、§9.2 V-8 / V-9）

### S3-TC-F01 `subjectiveHit` 定义恰 1 处且 `validateCardModel` 改用它（V-9 正例）【正】

- **覆盖**：`§4` substring 单实现点、`§9.2 V-9`
- **前置**：全仓可扫（`walkFiles` 口径，跳 `node_modules` / `.git`）
- **步骤**：`test('S3-TC-F01 单实现点')`：① 扫 `export const subjectiveHit` / `export function subjectiveHit` 定义数；② 扫 `card-model/` 内 `const subjectiveHit =` 与 `const tokensOf =` 本地定义数；③ 断 `validateCardModel.mjs` 源码含 `from './vocab/subjective-terms.mjs'` 且含 `subjectiveHit`
- **预期**：导出定义恰 1；`card-model/` 内本地定义 0；`validateCardModel.mjs` 确实 import 同一实现
- **判据**：`assert.equal(defCount, 1)`；`assert.equal(localDefs, 0)`；`assert.equal(vcmSrc.includes('subjectiveHit'), true)`

### S3-TC-F02 副本复原本地实现即红（V-9 反例）【负】

- **覆盖**：`§4` substring 单实现点、`§9.2 V-9`
- **前置**：`coldRepo` 可用；sha256 内容锚（常量 4）
- **步骤**：`test('S3-TC-F02 第二实现点')`：副本在 `validateCardModel.mjs` 复原 `const tokensOf = …` + `const subjectiveHit = …`，重跑 F01 的定义数扫描；仓内该文件跑前跑后取 sha256
- **预期**：副本定义数 2 → F01 断言抛；仓内 sha256 前后相等
- **判据**：`assert.throws(() => assert.equal(defCountInCopy, 1))`；`assert.equal(repoShaAfter, repoShaBefore)`

### S3-TC-F03 substring 与 token 全等口径的判别力对照（V-9 正例）【正】

- **覆盖**：`§4` substring 单实现点、`§10 D-3`
- **前置**：`subjectiveHit` 可 import；旧口径只作对照函数写在测试侧
- **步骤**：`test('S3-TC-F03 口径切换实证')`：对 `OLD_LABELS[0]`（`立场客观且按项目长远判断`）跑 ① `subjectiveHit`；② 测试侧 `legacyTokenHit`（按 `/[、，,/\s]+/` 切 token 再全等）
- **预期**：① `true`；② `false` —— 不等即证明口径真的切了
- **判据**：`assert.equal(subjectiveHit(s), true)`；`assert.equal(legacyTokenHit(s), false)`；`assert.notEqual(subjectiveHit(s), legacyTokenHit(s))`

### S3-TC-F04 旧 8 条 label 逐条复原后 `vp` 必红且只红含词那条（V-8 红探针）【负】

- **覆盖**：`§9.2 V-8`、`§4 D1`
- **前置**：`OLD_LABELS` 由常量 12 派生；`vp` 可取
- **步骤**：`test('S3-TC-F04 红探针')`：内存把 8 条 label 逐条替换为 `OLD_LABELS` 对应项（按 key 顺序配对），跑一次 `vp`
- **预期**：`ok === false`；`errors.length === 1`（只有含「客观」那条命中词表；8 条全红 = 过度判红）；`code === 'SubjectiveLabel'`；`path === 'label'`
- **判据**：`assert.equal(vp(copy).ok, false)`；`assert.equal(vp(copy).errors.length, 1)`；`assert.equal(vp(copy).errors[0].code, 'SubjectiveLabel')`；`assert.equal(vp(copy).errors[0].path, 'label')`；`assert.equal(OLD_LABELS.length, 8)`

### S3-TC-F05 15 席扫描三面 substring + token 双口径 0 / 0（V-8 正例）【正】

- **覆盖**：`§4` 卡面可行性、`§9.3 ②`
- **前置**：`agentData` 可 import（**数据在 `card` 键下**，第 2 轮假绿根因）；扫描面 = `card.duty.categories[]` + `card.checkItems[].label` + `card.checkItems[].criterion`（超集再加 `duty.trigger/action/constraint`），与 §9.3 ② 命令同一口径
- **步骤**：`test('S3-TC-F05 15 席 0/0')`：逐席逐字段跑 substring 与 token 两种口径，统计命中与文本数（`t.diagnostic` 记 `texts N`；spec §4 实测 = 扫描三面 **291** + 超集 **45** = **336**）
- **预期**：`substringHits === 0` 且 `tokenHits === 0`；扫描文本数 > 0 且 ≥ `SEATS.length × 3`（防「扫到空集所以恒 0」）
- **判据**：`assert.equal(substringHits, 0)`；`assert.equal(tokenHits, 0)`；`assert.ok(scannedTexts >= SEATS.length * 3)`；`t.diagnostic('texts ' + scannedTexts + '（spec §4 实测 291 + 45 = 336）')`

### S3-TC-F06 塞一个词进某席 `card.duty.action` 即命中（判别力反证）【负】

- **覆盖**：`§4` 卡面可行性
- **前置**：同 F05；`mutCard` 可构造独立卡
- **步骤**：`test('S3-TC-F06 判别力')`：`mutCard(SEATS[0], (card) => { card.duty.action += '（' + terms[0] + '）' })` 后重跑同一扫描（`finally` 还原）
- **预期**：命中 ≥ 1 且点名该席；未改的席仍 0；仓内原样再扫为 0
- **判据**：`assert.ok(hitsMut >= 1)`；`assert.equal(hitsOtherSeats, 0)`；`assert.equal(substringHitsRepo, 0)`

### S3-TC-F07 词表唯一源仍是 JSON（无第二份词面）【边界】

- **覆盖**：`§4` substring 单实现点、`§10 D-3`
- **前置**：`subjective-terms.mjs` 源码可读；`terms` 派生
- **步骤**：`test('S3-TC-F07 无第二份词面')`：扫 `subjective-terms.mjs` 源码（含注释）对 9 个 `terms` 字面命中数；并断该文件从 `observable-terms.json` 派生
- **预期**：字面命中 `0`；JSON 读取恰 1 处
- **判据**：`assert.equal(termLiteralHits, 0)`；`assert.equal(src.includes('observable-terms.json'), true)`；`assert.equal((src.match(/readFileSync/g) ?? []).length, 1)`

---

## 8 G 组：`gate` 接线（§4）

### S3-TC-G01 仓内 `gate` 绿（`baseline 38/38` **不作判据**，D-15）【正】

- **覆盖**：`§4` 接线、`§7 步 S1b`–`S3`、`§9.2 V-10`、`§10 D-15`
- **前置**：8 条 label 已改、`validatePredicates` 已落、15 卡已重生成（**没跑 `baseline --write`**）
- **步骤**：`test('S3-TC-G01 gate 绿')`：`runCli(['gate'])`
- **预期**：`code === 0`；输出无 `Mismatch`；`baseline` 行只作 `t.diagnostic`（常量打印，不作判据）
- **判据**：`assert.equal(r.code, 0)`；`assert.equal(/Mismatch/.test(r.out), false)`；`t.diagnostic('baseline 行（不判）: ' + (r.out.match(/baseline \d+\/\d+/) ?? [''])[0])`

### S3-TC-G02 判据表坏 → `gate` exit 1 且首行 `predicates[<id>].label`，不进 `Mismatch`【负】

- **覆盖**：`§4` 接线、`§4` path 无前缀 + gate 拼报文
- **前置**：`coldRepo` 可用（`args=['gate']`）；卡面已与判据表同步（只坏判据表这一处）
- **步骤**：`test('S3-TC-G02 判据表坏')`：副本把 `impartial-long-term` 的 label 复原为旧文案 → 子进程跑 `gate`
- **预期**：`code === 1`；`stderr` 首行 = `SubjectiveLabel: predicates[impartial-long-term].label：…`；`stderr` **不含** `Mismatch`
- **判据**：`assert.equal(r.code, 1)`；`assert.match(r.out.split(/\r?\n/)[0], /^SubjectiveLabel: predicates\[impartial-long-term\]\.label/)`；`assert.equal(r.out.includes('Mismatch'), false)`

### S3-TC-G03 两错并存时先报判据表后报卡面（接线顺序边界）【边界】

- **覆盖**：`§4` 接线、`§7 步 S1` → `S1b`
- **前置**：同 G02
- **步骤**：`test('S3-TC-G03 顺序')`：副本同时做两件事 —— ① 复原 label；② **不**重生成 15 卡
- **预期**：仍 `exit 1`，且 `stderr` 首条是 `predicates[` 而不是 `Mismatch`
- **判据**：`assert.equal(r.code, 1)`；`assert.equal(/Mismatch/.test(r.out.split(/\r?\n/)[0]), false)`；`assert.match(r.out.split(/\r?\n/)[0], /predicates\[/)`

### S3-TC-G04 barrel 仍 18 项、`gate` 直接按文件路径 import（D-4 正例）【正】

- **覆盖**：`§4`、`§10 D-4`
- **前置**：`card-model/index.mjs` 可 import；`cli.mjs` 源码可读
- **步骤**：`test('S3-TC-G04 barrel 不加导出')`：① 数 `Object.keys(CM)`；② 扫 `cli.mjs` 是否 import `card-model/validatePredicates.mjs`
- **预期**：导出恰 18 项且不含 `validatePredicates`；`cli.mjs` 从文件路径 import
- **判据**：`assert.equal(Object.keys(CM).length, 18)`；`assert.equal(Object.keys(CM).includes('validatePredicates'), false)`；`assert.equal(cliSrc.includes('card-model/validatePredicates.mjs'), true)`

---

## 9 H 组：15 卡重生成、必红期、回退面与 S1a/S1b 顺序（§3 C-6、§7、§10 D-5）

### S3-TC-H01 15 席 disk 逐字节 == render（C-6 正例）【正】

- **覆盖**：`§3 C-6`、`§10 D-5`、`§7 步 S1b`、`§4` 前提事实
- **前置**：15 卡已走 `draft → 确认 → replace --yes` 落盘；前提事实（spec §4 写死）：`state.json` 的 `agents` 15 席**全为 `replaced`**
- **步骤**：`test('S3-TC-H01 disk == render')`：① 读 `state.json`，断值集 = `{'replaced'}` 且键集与 `SEATS` 双向相等；② 逐席 `readFileSync('agents/<席>.md')` 与 `renderSeat(<席>).card` 比字节
- **预期**：15/15 `replaced`、键集无双缺；不等席 `0`，比对席数 == `SEATS.length`（无跳过）
- **判据**：`assert.deepEqual([...new Set(Object.values(state.agents))], ['replaced'])`；`assert.deepEqual(Object.keys(state.agents).sort(), SEATS.slice().sort())`；`assert.equal(mismatch, 0)`；`assert.equal(compared, SEATS.length)`

### S3-TC-H02 卡面改 1 字节 → `gate` exit 1 含 `Mismatch`（C-6 反例；D-13 抽核的一半）【负】

- **覆盖**：`§3 C-6`、`§7` 禁止手改、`§9.2 V-10`（D-13）
- **前置**：`coldRepo` 可用；`appendOneByte` 可取
- **步骤**：`test('S3-TC-H02 手改即红')`：副本对某席卡追加 1 字节后跑 `gate`
- **预期**：`code === 1`；输出含 `Mismatch` 且点名该席（与 H01 组成 D-13 的「改一字节必红 / 还原转绿」抽核）
- **判据**：`assert.equal(r.code, 1)`；`assert.match(r.out, /Mismatch/)`；`assert.match(r.out, new RegExp(escape(SEATS[0])))`

### S3-TC-H03 15 卡新 label 每席命中、旧 label 0 命中（§7 步 S1b 后）【正】

- **覆盖**：`§3 C-6`、`§8` 15 卡、`§7 步 S1b`
- **前置**：`PREDICATES` 已改；`OLD_LABELS` 派生（常量 12）
- **步骤**：`test('S3-TC-H03 卡面文案')`：① 每席渲染文本中凡 `must` / `never` 项 `criterion` 在 `PREDICATES` → 断该行含 `PREDICATES[criterion].label`；② 15 席全文扫 `OLD_LABELS`
- **预期**：① 缺 label 的行数 `0`；② 旧 label 命中 `0`
- **判据**：`assert.equal(missingLabelLines, 0)`；`assert.equal(oldLabelHits, 0)`；`assert.equal(OLD_LABELS.length, 8)`

### S3-TC-H04 卡面无「不得不得」且 baseline == renderBaseline（本块不改 baseline，D-15）【边界】

- **覆盖**：`§3 C-5`、`§3 C-6`、`§10 D-5` / `D-15`
- **前置**：`baseline.json` 已存在（**本块未 `--write`**）；`BASELINE_RULES` / `agentPaths()` / `renderBaseline` 可 import
- **步骤**：`test('S3-TC-H04 边界')`：① 15 席扫 `不得不得`；② `readFileSync('tools/docgen/baseline.json','utf8')` 与 `renderBaseline()` 逐字相等；③ `baseline` 条目数 == `TOTAL`
- **预期**：① 0 命中；② 相等；③ 相等
- **判据**：`assert.equal(doubleNegation, 0)`；`assert.equal(readFileSync('tools/docgen/baseline.json', 'utf8'), renderBaseline())`；`assert.equal(JSON.parse(readFileSync('tools/docgen/baseline.json', 'utf8')).length, TOTAL)`

### S3-TC-H05 「未接管席不比对」是 spec 已排除情形（前提破裂探针）【边界】

- **覆盖**：`§4` 前提事实、`§3 C-6`
- **前置**：`coldRepo` 可用；sha256 内容锚；席名从 `SEATS` 派生
- **步骤**：`test('S3-TC-H05 前提破裂探针')`：① 仓内断前提（15 席全 `replaced`）；② 副本把首席值改成 `'registered'` 跑 `gate`；③ 另一份未改副本跑 `gate` 作对照
- **预期**：① 成立（证明 H01 没有豁免面）；② `exit 1` 且点名「未接管席 …（state=registered）不得带人读投影」，`agents/<首席>.md` 的比对被跳过；③ 对照副本 `exit 0`
- **判据**：`assert.deepEqual([...new Set(Object.values(state.agents))], ['replaced'])`；`assert.equal(rMut.code, 1)`；`assert.match(rMut.out, new RegExp('未接管席 ' + SEATS[0] + '（state=registered）'))`；`assert.equal(rMut.out.includes('Mismatch: agents/' + SEATS[0] + '.md'), false)`；`assert.equal(rCtrl.code, 0)`；`assert.equal(repoShaAfter, repoShaBefore)`

### S3-TC-H06 必红期（S1 后「只报首条（单行）」）与回退面都可达（§7 边界）【边界】

- **覆盖**：`§7 步 S1` / `S1b` / 回退面、`§3 C-6`
- **前置**：`coldRepo` 可用；`<S3-BASE>` 已取（常量 7）
- **步骤**：`test('S3-TC-H06 必红期与回退')`：① 副本只改 `predicates.mjs` 的 label、**不**重生成卡 → 跑 `gate`；② 同副本再 `git checkout <S3-BASE> -- tools/docgen/card-model/vocab/predicates.mjs agents/` → 跑 `gate`
- **预期**：① `exit 1`；**只报首条单行**（`Mismatch: agents/<席>.md`；不出现 N 条独立输出）；② `exit 0`（回退面可达，回到 S2 终态）
- **判据**：`assert.equal(rBefore.code, 1)`；`assert.match(rBefore.out.trim().split(/\r?\n/)[0], /Mismatch: agents\/.+\.md/)`；`assert.equal((rBefore.out.match(/Mismatch/g) ?? []).length, 1)`（**只报首条单行**）；`assert.equal(rAfter.code, 0)`；`assert.equal(/Mismatch/.test(rAfter.out), false)`

### S3-TC-H07 S1a → S1b 顺序可走通：先改测试/引用件（fail 0）再重生成（gate 绿）（§7 正例）【正】

- **覆盖**：`§7 步 S1a` → `S1b`、`§8` 引用件处置
- **前置**：`runNode` 可用；仓内 S1a / S1b 已按顺序完成
- **步骤**：`test('S3-TC-H07 S1a→S1b')`：① `node --test tools/docgen/test/pilot-render.test.mjs` 与 `evidence-reader.test.mjs`；② `runCli(['gate'])`；③ 断两测试文件里旧 label 已派生化（K09 的静态面在此不重复）
- **预期**：① 两文件 `exit 0`（S1a 完成：旧字面断言已改为 `PREDICATES[id].label` 派生）；② `gate` `exit 0`（S1b 完成：15 席 disk == render）；③ 顺序成立 = 先 S1a 后 S1b 没有中途恒红残留
- **判据**：`assert.deepEqual([r1.code, r2.code], [0, 0])`；`assert.equal(rGate.code, 0)`；`assert.equal(/Mismatch/.test(rGate.out), false)`

### S3-TC-H08 跳过 S1a 直接 S1b → 两测试文件必红（S1a 不可省）（§7 反例）【负】

- **覆盖**：`§7 步 S1a` 不可跳过
- **前置**：`coldRepo` 可用；`<S3-BASE>` 已取
- **步骤**：`test('S3-TC-H08 跳过 S1a')`：副本只做 ① 改 label ② 重生成 15 卡（`draft` → `replace --yes`），**不回改**两个测试文件与三处引用件 → 子进程跑两个测试文件
- **预期**：两个测试文件各 `exit != 0`（仍断言旧 label 字面 / 旧前缀子串）；`gate` 绿但测试红 ⇒ S1a 不能省
- **判据**：`assert.deepEqual([r1.code, r2.code].map((c) => c !== 0), [true, true])`；`assert.equal(repoShaAfter, repoShaBefore)`

---

## 10 I 组：F-09 检查点、计数清单、归桶四处与 `§5 检查点 ⑨` 判别力（§5）

### S3-TC-I01 `criteria.md` §2.4 新增 `§5 检查点 ⑨` 行（判定 = 验证节标记；得分列照抄仓内写法）【正】

- **覆盖**：`§5 检查点 ①`、`§10 D-17` 邻域
- **前置**：`criteria.md` 已改；`splitRow` 可 import；`assertCriteriaNine`（§0.1 #15）可取
- **步骤**：`test('S3-TC-I01 criteria ⑨ 行')`：取 `#### 新增维度` 到下一个 `####`/`##` 之间的表格行，定位以 `| ⑨` 开头那行取四列；并取 `| ⑦` / `| ⑧` 两行作格式对照
- **预期**：`assertCriteriaNine` 全过：`§5 检查点 ⑨` 恰 1 行；检查点列含「判据可观察」；判定列含「验证节」且不含 `evaluateText`；得分列 `/有 1\s*[\/｜]\s*无 0/`；`§5 检查点 ⑦` / `⑧` 两行同形
- **判据**：`assertCriteriaNine(criteriaSrc)`；`assert.deepEqual([sevenRow[3], eightRow[3]].map((s) => /有 1\s*[\/｜]\s*无 0/.test(s)), [true, true])`

### S3-TC-I02 计数口径清单全改 + 归桶四处登记（R7 不触发，正例）【正】

- **覆盖**：`§5` 计数口径清单、`§5` 归桶**四处**登记、R7 不触发（正）
- **前置**：清单各处均已改；`assertCounts` / `assertTwoTables` / `findingCodes` 可取；归桶按**结构**读（`import { BUCKETS } from '../execution-matrix/buckets.mjs'`；`import { RULE_MARKER_ITEM, itemsFromCriteria, checkBuckets } from '../execution-matrix/check-buckets.mjs'`；`import { SHARED_MARKERS } from '../execution-matrix/shared-items.mjs'`）——**不用跨行正则、不用行号**
- **步骤**：`test('S3-TC-I02 计数与归桶四处')`：① `assertCounts(criteriaSrc)`（标题「25 检查点」/ 脚注「禁令类 9 项」「6 项」/ 计分式「执行力度 9」「现有 25 项」「20/25」/ §3 导语「25 检查点」/ `writing-guide:34`「6/6」/ `rule-skeleton:29`「6/6」）；② `assertTwoTables(criteriaSrc)`；③ 其余四处按**行号**取（`SKILL.md:35` / `writing-guide:1,:19` / `rule-writer/SKILL.md:3,:29,:36` / `rule-edit-checklist-template.md:75`）；④ 归桶四处按结构：`bucket('rule 独有').items` 含 `执行力度⑨`、`bucket('skill 独有').items` 含 `判据可观察⑤`；`RULE_MARKER_ITEM['⑨']`、`itemsFromCriteria(carriers)` 含 `执行力度⑨` 与 `判据可观察⑤`；`checkBuckets().ok === true`；源码含 `①-⑨` 注释形态
- **预期**：`assertCounts` / `assertTwoTables` 全过（§3.4 = `7/4/9/6/15/12`，§3.5 = `24/21/26/23/32/29`）；七行各含新值（`25 检查点` ×1、`执行力度 9 项` ×5、`9 项` ×1）；`RULE_MARKER_ITEM['⑨']` = `['执行力度⑨','rule 独有']`；`BUCKETS` 两个各自独有桶各含 1 项；`checkBuckets()` 无 `BucketMarkerUnknown` / `MissingBucket`；**`SHARED_MARKERS` 不含 `'⑨'` / `'⑤'`**（⑨ / ⑤ 登记为各自独有 → 不进共享项 → 不触发 R7）
- **判据**：`assertCounts(criteriaSrc)`；`assertTwoTables(criteriaSrc)`；`assert.match(skillLine35, /25 检查点/)`；`assert.deepEqual([wg1, wg19, wg34, rw3, rw29, rw36].map((s) => /执行力度 9 项/.test(s)), [true,true,true,true,true,true])`；`assert.match(checklistLine75, /9 项/)`；`assert.match(wg34, /6\/6/)`；`assert.match(rs29, /6\/6/)`；`assert.deepEqual(RULE_MARKER_ITEM['⑨'], ['执行力度⑨', 'rule 独有'])`；`assert.equal(BUCKETS.find((b) => b.name === 'rule 独有').items.includes('执行力度⑨'), true)`；`assert.equal(BUCKETS.find((b) => b.name === 'skill 独有').items.includes('判据可观察⑤'), true)`；`assert.ok(['执行力度⑨','判据可观察⑤'].every((it) => [...itemsFromCriteria({ 'skills/rule-inspector/references/criteria.md': criteriaSrc, 'rules/skill-authoring-convention.md': skillSrc }).keys()].includes(it)))`；`assert.equal(findingCodes(checkBuckets()).length, 0)`；`assert.ok(/①\s*[-–—]\s*⑨/.test(checkBucketsSrc))`；`assert.deepEqual(SHARED_MARKERS.filter((m) => ['⑨','⑤'].includes(m)), [])`

### S3-TC-I03 `recipes.md` 新增 §R9 且三条改法齐（§5 检查点 ② 正例）【正】

- **覆盖**：`§5 检查点 ②`
- **前置**：`recipes.md` 已改
- **步骤**：`test('S3-TC-I03 R9')`：定位 `### §R9` 标题块取块内正文
- **预期**：标题含「判据不可观察」；块内含 ①「比较」②「path:line」③「豁免」各 ≥1；块内不含 `evaluateText`（处方不把 verdict 当判定）
- **判据**：`assert.equal(r9Blocks.length, 1)`；`assert.match(r9.title, /判据不可观察/)`；`assert.equal(['比较','path:line','豁免'].filter((k) => r9.body.includes(k)).length, 3)`；`assert.equal(/\bevaluateText\b/.test(r9.body), false)`

### S3-TC-I04 `score.mjs` 新增 `§5 检查点 ⑨`（扫验证节 markers / 不读豁免清单 / **不** import `evaluateText`）且块内零词面【正】

- **覆盖**：`§5 检查点 ③`、`§9.2 V-9`（D-12 收窄）
- **前置**：`score.mjs` 已改；`<S3-BASE>` 已取；`terms` / `criterionTerms` 派生（15 词，不写字面）
- **步骤**：`test('S3-TC-I04 ⑨ 接线与块内零词面')`：① 数 `g('执行力度', '⑨判据可观察'` 出现次数；② 取「`§5 检查点 ⑨` 块」行集 = 该调用行按括号配平到闭合行 ∪ `git diff --unified=0 <S3-BASE> -- skills/rule-inspector/scripts/score.mjs` 的新增行；③ 块内必有 `markers` 与 `observable-terms.json` 与「验证」；④ 块内**不得**有 `observable-exempt`（不读豁免清单）、`LOOSE_RE` / `VERIFY_RE`（不照抄 `§5 检查点 ⑥` / `§5 检查点 ⑧` 判法）；⑤ 对块行集跑 `terms ∪ criterionTerms` 字面命中；⑥ 既有常量定义行不在块内（`LOOSE_RE` 定义行号 < 块首行号）；⑦ 探针：副本在块末行拼入 `terms[0]` → 同一扫描命中 ≥1
- **预期**：① 恰 1；② 块非空；③ 三项齐；④ 均无；⑤ 命中 `0`（D-12）；⑥ 成立；(7) 探针命中 ≥1；仓内 sha256 前后相等
- **判据**：`assert.equal((src.match(/g\('执行力度', '⑨判据可观察'/g) ?? []).length, 1)`；`assert.ok(blockLines.some((l) => l.includes('markers')) && blockLines.some((l) => l.includes('observable-terms.json')) && blockLines.some((l) => l.includes('验证')))`；`assert.equal(/observable-exempt/.test(block), false)`；`assert.equal(/LOOSE_RE|VERIFY_RE/.test(block), false)`；`assert.equal([...terms, ...criterionTerms].filter((w) => blockLines.some((l) => l.includes(w))).length, 0)`；`assert.ok(blockFirstLine > looseReLine)`；`assert.ok(probeHits >= 1)`；`assert.equal(repoShaAfter, repoShaBefore)`

### S3-TC-I05 `§5 检查点 ⑨` 判别力（一）：验证节内 ≥1 行命中 marker → 1 分【正】

- **覆盖**：`§5 检查点 ③⑨`、`§10 D-14`、常量 13
- **前置**：`scoreFile(filePath, rulesDir, opts)` 可 import；`mkdtemp`；`seven` / `eight`（§0.1 #19）可取
- **步骤**：`test('S3-TC-I05 有标记得 1')`：临时写一份规则，含 `## 验证` 小节、小节内一行 `node scripts/check-observable.mjs --check，exit 0`；`scoreFile(该文件, 临时rulesDir, { type: '持续适用', polarity: '禁令' })`
- **预期**：`eight(r).pass === true`；`groups['执行力度'].max` 已含 `§5 检查点 ⑨`（≥ 9）；临时文件不进仓
- **判据**：`assert.equal(eight(okScore).pass, true)`；`assert.ok(okScore.groups['执行力度'].max >= 9)`；`assert.equal(okRule.startsWith(tmpdir()), true)`

### S3-TC-I06 `§5 检查点 ⑨` 判别力（二）：验证节存在但无 marker → 0 分【负】

- **覆盖**：`§5 检查点 ③⑨`、`§10 D-14`、常量 13
- **前置**：同 I05
- **步骤**：`test('S3-TC-I06 无标记得 0')`：临时写一份规则，`## 验证` 小节内只有「请认真确认，务必做到位」；跑 `scoreFile`；再在该小节加一行 `exit 0` 重跑
- **预期**：`§5 检查点 ⑨` `pass === false` 且 `findings` 含该检查项（处方可达）；加 marker 后转 `true`（构造有效性）
- **判据**：`assert.equal(eight(noMarker).pass, false)`；`assert.ok(noMarkerScore.findings.some((f) => f.check.includes('⑨')))`；`assert.equal(eight(noMarkerFixed).pass, true)`

### S3-TC-I07 `§5 检查点 ⑨` 判别力（三）：无验证节 → 0 分（与 `§5 检查点 ⑦` 不同面）【边界】

- **覆盖**：`§5 检查点 ③⑨`、`§5 检查点 ⑦` 不同面
- **前置**：同 I05
- **步骤**：`test('S3-TC-I07 无验证节')`：临时写一份规则，正文含 marker（`计数 = 3`）**且有**触发句（`编辑后…`）但**没有** `## 验证` 小节；跑 `scoreFile`
- **预期**：`§5 检查点 ⑨` `pass === false`（判的是验证节，不是全文标记）；同文件 `§5 检查点 ⑦` 因有触发句 `pass === true` → 两面不同、不是复读
- **判据**：`assert.equal(eight(noSection).pass, false)`；`assert.equal(eight(noSection).group, '执行力度')`；`assert.equal(seven(noSection).pass, true)`

### S3-TC-I08 验证节定位口径（D-17）：`## 验证` / `### 验证` 都识别，多处取第一个【边界】

- **覆盖**：`§10 D-17`、`§5 检查点 ①③`
- **前置**：同 I05
- **步骤**：`test('S3-TC-I08 验证节定位')`：① 三级标题 `### 验证` 小节内放 `exit 0` → 跑 `scoreFile`；② 一份规则含**两个**验证节：第一个（`## 验证`）只有「认真确认」、第二个（`## 验证`）有 `exit 0` → 跑 `scoreFile`
- **预期**：① `eight(三级验证).pass === true`（`### 验证` 也认）；② `eight(两节).pass === false`（取**第一个**，不因后一节有标记而绿）
- **判据**：`assert.equal(eight(h3Verify).pass, true)`；`assert.equal(eight(twoVerify).pass, false)`；`assert.equal(twoVerifySrc.split(/^## 验证$/m).length, 3)`（确有 2 个 `## 验证`）

### S3-TC-I09 归桶出现未登记标记 / 台账登记非共享项 / R7 缺用户确认 → 各红（四处 + R7 反例）【负】

- **覆盖**：`§5` 归桶**四处**登记、R7 反向（⑨ / ⑤ 为各自独有 → 不得进共享项）
- **前置**：`unknownMarkers` / `checkBuckets`（`tools/execution-matrix/check-buckets.mjs`）；`checkSharedChanges` / `parseLedger`（`tools/execution-matrix/shared-changes/check-shared-changes.mjs`）可 import；仓内台账 `shared-changes/changes.md` 可读
- **步骤**：`test('S3-TC-I09 登记与台账缺口')`：① 注入一份含未登记标记的 skill 载体（`'### 判据 ⑨：x'`）→ `unknownMarkers`；② 台账副本**加一行**非共享项 `执行力度⑨`（改前 / 改后 / 用户确认 三格齐）→ `checkSharedChanges({ ledgerText })`；③ 台账副本把 `④来源覆盖` 那条记录的「用户确认」格删空 → `checkSharedChanges({ ledgerText })`
- **预期**：① `BucketMarkerUnknown`（判据正文新增标记但映射表未登记 → 红，守卫不是空转）；② `SharedDefinitionMismatch`（reason「台账登记了非共享项」—— ⑨ 若被当共享项登记，R7 必红）；③ `SharedChangeIncomplete`（共享项变更必须「改前 + 改后 + 用户确认」三件齐）；仓内 `checkBuckets().ok` 与 `checkSharedChanges().ok` 均 true
- **判据**：`assert.ok(unknownMarkers({ 'rules/skill-authoring-convention.md': '### 判据 ⑨：x' }).some((f) => f.code === 'BucketMarkerUnknown'))`；`assert.ok(findingCodes(checkSharedChanges({ ledgerText: ledgerWithNine })).includes('SharedDefinitionMismatch'))`；`assert.ok(findingCodes(checkSharedChanges({ ledgerText: ledgerMissingConfirm })).includes('SharedChangeIncomplete'))`；`assert.equal(checkBuckets().ok, true)`；`assert.equal(checkSharedChanges().ok, true)`

### S3-TC-I10 `score.test.mjs` 满分断言逐条 +1 且**块标题绑定**（防改前改后都绿）【负】

- **覆盖**：`§5` 计数口径、`§5` 同步义务 ①、`§7` ⑨ 与 fixture 关系（BE-2-02）
- **前置**：`score.test.mjs` 已同步；`blockOf`（§0.1 #18）可取
- **步骤**：`test('S3-TC-I10 满分断言 +1')`：`node --test skills/rule-inspector/scripts/score.test.mjs`；按**块标题前缀**取 4 块（`合规基准：GOOD` / `持续适用·禁令` / `条件触发·义务` / `模式门控·禁令`），块内逐字取断言；每块再判该 fixture 走了哪条路 —— 块内含 `{ score: M, max: M }` = 补了 marker（⑨ 得 1 分）、含 `{ score: M-1, max: M }` = 按「旧值 + 0」重写期望（⑨ 得 0 分）
- **预期**：单测 `exit 0`；四块 `max` 严格为新值（26 / 24 / 23 / 32）、`执行力度'].max` 严格为新值（9 / 7 / 6 / 9）；**两条路各自自洽**：⑨ pass → `total === max` 且 `{ score: M, max: M }`；⑨ fail → `total === max − 1` 且 `{ score: M−1, max: M }`；每块内有 `§5 检查点 ⑨` 的处置说明（BE-2-02）
- **判据**：`assert.equal(r.code, 0)`；`assert.equal(blocks.length, 4)`；`[['合规基准：GOOD', 26, 9], ['持续适用·禁令', 24, 7], ['条件触发·义务', 23, 6], ['模式门控·禁令', 32, 9]].forEach(([title, N, M]) => { const b = blockOf(T, title); const pass = b.includes(\`{ score: \${M}, max: \${M} }\`); assert.ok(b.includes(\`{ score: \${pass ? M : M - 1}, max: \${M} }\`), title); assert.equal(Number((b.match(/assert\\.equal\\(r\\.max, (\\d+)\\)/) ?? [])[1]), N, title); assert.equal(Number((b.match(/assert\\.equal\\(r\\.total, (\\d+)\\)/) ?? [])[1]), pass ? N : N - 1, title); assert.ok(/\⑨/.test(b), title) })`

### S3-TC-I11 漏改任一处计数即红（构造反例）【负】

- **覆盖**：`§5` 计数口径、`§5` 同步义务 ①
- **前置**：`coldRepo` 或内存副本；`assertCriteriaNine` / `assertCounts` / `assertTwoTables` 可取
- **步骤**：`test('S3-TC-I11 漏改一处')`：副本只在 `score.mjs` 加 `§5 检查点 ⑨`（`max` 自然 +1）但**不改** `criteria.md` 的标题 / 计分式 / 脚注 / 两张表
- **预期**：`assertCriteriaNine` / `assertCounts` / `assertTwoTables` 在副本上各抛
- **判据**：`assert.throws(() => assertCriteriaNine(copyCriteria))`；`assert.throws(() => assertCounts(copyCriteria))`；`assert.throws(() => assertTwoTables(copyCriteria))`；`assert.equal(repoShaAfter, repoShaBefore)`

### S3-TC-I12 `skill-authoring-convention.md` 新增判据⑤ 可观察（§5 检查点 ④ 正例）【正】

- **覆盖**：`§5 检查点 ④`
- **前置**：`rules/skill-authoring-convention.md` 已改
- **步骤**：`test('S3-TC-I12 判据⑤')`：定位 `### 判据 ⑤` 块
- **预期**：块标题含「可观察」；正文含 `scripts/check-observable.mjs` 与 `exit 0`；该文件**不含**任何 `terms` 字面
- **判据**：`assert.equal(fiveBlocks.length, 1)`；`assert.match(five.title, /可观察/)`；`assert.ok(five.body.includes('scripts/check-observable.mjs') && /exit 0/.test(five.body))`；`assertNoTermCopy(src)`（§0.1 #14 抛出即红，故用 `assert.doesNotThrow(() => assertNoTermCopy(src))`）

### S3-TC-I13 同步 6 项逐项核销缺一即红（§5 同步义务反例）【负】

- **覆盖**：`§5` 同步 6 项
- **前置**：六落点均已改（`score.mjs` / `criteria.md` / `recipes.md` / `rule-writer` 三层 / `review-progress-template.md` / `rule-edit-checklist-template.md`）；`assertSync`（§0.1 #20）可取
- **步骤**：`test('S3-TC-I13 六项核销')`：构造六个「缺一项」副本（各删一处新增内容），逐个跑同一断言组；再跑仓内一次
- **预期**：六个副本各红一项且点名；仓内一次全绿
- **判据**：`[c1,c2,c3,c4,c5,c6].forEach((c) => assert.throws(() => assertSync(c)))`；`assert.doesNotThrow(() => assertSync(REPO))`

### S3-TC-I14 `#36` / E2 行各 1、编号连续，且 `criteria.md` 只允许计分四处与两表被改写（条目级不减）【边界】

- **覆盖**：`§5` 同步 ④⑥、`§5` ⑤ 零删除（条目级）
- **前置**：`review-progress-template.md` 与 `rule-edit-checklist-template.md` 已改；`<S3-BASE>` 已取；`hunksOf`（§0.1 #22）可取
- **步骤**：`test('S3-TC-I14 两模板与删除面')`：① 取 `review-progress-template.md` 编号列，断 `1..36` 无缺号；② 取 `rule-edit-checklist-template.md` 的 E2 段，断含 1 行「判据可观察」且该段含「9 项」；③ `git diff -U0 <S3-BASE> -- skills/rule-inspector/references/criteria.md` 的每个删除 hunk，按**改后文件**定位其所属小节标题
- **预期**：① 36 连续；② 恰 1 行；③ 删除 hunk 所属小节 ⊆ {文件标题行, `#### 新增维度`, `### 3.4 执行力度适用项表`, `### 3.5 满分口径`, §3 导语行}，其它小节删除行 `0`；④ §2.4 执行力度表行数 +1（条目不减）
- **判据**：`assert.equal(maxNo, 36)`；`assert.equal(missingNos, 0)`；`assert.equal(e2Rows.length, 1)`；`assert.match(e2, /9 项/)`；`assert.deepEqual(outOfScopeDeleted, [])`；`assert.equal(rowsAfter.length, rowsBefore.length + 1)`

---

## 11 J 组：F-10 两处引用与 `docs/after/` 缺口（§6）

### S3-TC-J01 `rule-writer` 自查第 3 步加可观察判据且不复制词表（§6.1 正例）【正】

- **覆盖**：`§6.1`、`§5` 同步 ③
- **前置**：`skills/rule-writer/SKILL.md` 已改；`assertNoTermCopy` 可取
- **步骤**：`test('S3-TC-J01 rule-writer 指针')`：取「写作流程」第 3 步段落
- **预期**：段内含 `scripts/check-observable.mjs` 与 `check-observable ok` 末行判据；全文件 `terms` 字面命中 0
- **判据**：`assert.ok(step3.includes('scripts/check-observable.mjs'))`；`assert.ok(step3.includes('check-observable ok'))`；`assert.doesNotThrow(() => assertNoTermCopy(src))`

### S3-TC-J02 把词表复制进 skill 即红（§6.1 反例）【负】

- **覆盖**：`§6.1`、`§3 C-3` 邻域
- **前置**：同 J01；内存副本
- **步骤**：`test('S3-TC-J02 复制词表')`：副本在第 3 步追加 `主观词表：` + `terms.join('、')`（**派生拼入，不写字面**）
- **预期**：`assertNoTermCopy` 抛；仓内 sha 不变
- **判据**：`assert.throws(() => assertNoTermCopy(copySrc))`；`assert.equal(repoShaAfter, repoShaBefore)`

### S3-TC-J03 `dev-workflow` 指针节加一行且段表零改动（§6.1 正例+边界）【正】

- **覆盖**：`§6.1`
- **前置**：`skills/dev-workflow/SKILL.md` 已改；`<S3-BASE>` 已取
- **步骤**：`test('S3-TC-J03 dev-workflow 指针')`：① 取「## 指针」节内行找含 `observable-criteria` 的行；② `git diff --numstat <S3-BASE> -- skills/dev-workflow/SKILL.md`；③ 取该文件「段表」区域行集与 `<S3-BASE>` 版本逐行比
- **预期**：① 恰 1 行且含 `npm run check:observable`；② 新增行 ≥1、删除行 = 0；③ 段表逐行不变
- **判据**：`assert.equal(pointerLines.length, 1)`；`assert.ok(pointerLines[0].includes('npm run check:observable'))`；`assert.equal(deletedCol, 0)`；`assert.deepEqual(segTableAfter, segTableBefore)`

### S3-TC-J04 指针行写死词表即红（§6.1 反例）【负】

- **覆盖**：`§6.1`
- **前置**：同 J03；内存副本
- **步骤**：`test('S3-TC-J04 指针行复制')`：副本把指针行改成把 9 个词面（`terms` 派生）写进 `SKILL.md`
- **预期**：`assertNoTermCopy` 抛
- **判据**：`assert.throws(() => assertNoTermCopy(copySrc))`；`assert.equal(repoShaAfter, repoShaBefore)`

### S3-TC-J05 `docs/after/` 缺口四要素在册且命名合规（`--check docs/after`）【正】

- **覆盖**：`§6.2`、`§10 D-9`
- **前置**：`docs/after/` 下已新建缺口文件
- **步骤**：`test('S3-TC-J05 缺口在册')`：① 扫 `docs/after/` 找文件名含 `skill-creator` 的文件，断恰 1 份；② 断该文件含「现状 / 该做 / 触发 / 谁兜」各 ≥1；③ `runNode(['scripts/doc-name.mjs', '--check', 'docs/after'])`
- **预期**：① 1 份；② 四项齐；③ `exit 0`（**必须带 `--check`**：无旗标 `doc-name.mjs` 恒 exit 2）
- **判据**：`assert.equal(files.length, 1)`；`assert.equal(['现状','该做','触发','谁兜'].filter((k) => src.includes(k)).length, 4)`；`assert.equal(nameCheck.code, 0)`；`assert.match(nameCheck.out, /命名检查通过/)`

---

## 12 K 组：R8 改判回扫（§8）

> **本组统一口径**：旧 8 条 label 从 `git show <S3-BASE>:tools/docgen/card-model/vocab/predicates.mjs` 按正则抽取（常量 12），**不 `JSON.parse` `.mjs`**、**不经本批新建的 `I25`**。「历史保留 / 过程账」用 diff 与 sha 判「没改」，**不断 `git status` 为空**。

### S3-TC-K01 `keywords.json` 补 `I22`–`I25` 且结构合规（§8 正例）【正】

- **覆盖**：`§8`、`§10 D-10`
- **前置**：`keywords.json` 已改；`OLD_LABELS` 派生；`assertFourEntries`（§0.1 #21）可取
- **步骤**：`test('S3-TC-K01 I22–I25 登记')`：解析 `entries`，取 `I22` / `I23` / `I24` / `I25` 跑 `assertFourEntries`
- **预期**：四条齐且顺序固定；每条 `title` 非空 / `words` ≥1 / `scope` ≥1、**无通配**、所指文件全部存在；`I25.words` 与 `OLD_LABELS` 逐字相等（8 条）
- **判据**：`assertFourEntries(entries)`；`assert.deepEqual(entries.filter((e) => /^I2[2-5]$/.test(e.id)).map((e) => e.id), ['I22','I23','I24','I25'])`；`assert.deepEqual(entries.find((e) => e.id === 'I25').words, OLD_LABELS)`

### S3-TC-K02 `baseline.json` 含四个口径且为改前值（§8、D-10 正例）【正】

- **覆盖**：`§8`、`§10 D-10`
- **前置**：`node scripts/scope-sweep.mjs --freeze` 已跑
- **步骤**：`test('S3-TC-K02 冻结改前值')`：读 `baseline.json` 的 `counts` 与 `entries`
- **预期**：`counts` 含 `I22`–`I25` 且均为 number；`generatedAt` 不早于本批开工日 `2026-11-02`
- **判据**：`assert.deepEqual(['I22','I23','I24','I25'].map((id) => typeof baseline.counts[id]), ['number','number','number','number'])`；`assert.equal(baseline.generatedAt.slice(0, 10) >= '2026-11-02', true)`

### S3-TC-K03 漏登记一条口径即红（§8 反例）【负】

- **覆盖**：`§8`
- **前置**：同 K01；内存副本
- **步骤**：`test('S3-TC-K03 漏登记')`：副本从 `entries` 删 `I25`，重跑 K01 的断言组
- **预期**：断言抛（点名缺 `I25`）；仓内 `keywords.json` sha 不变
- **判据**：`assert.throws(() => assertFourEntries(copyEntries))`；`assert.equal(repoShaAfter, repoShaBefore)`

### S3-TC-K04 改判回扫绿（`scope-sweep --check` exit 0）【正】

- **覆盖**：`§8`、`§9.2 V-10`
- **前置**：`impact-sheet.md` 已在位（GAP-6）；`keywords.json` 与 `baseline.json` 同批
- **步骤**：`test('S3-TC-K04 sweep 绿')`：`runNode(['scripts/scope-sweep.mjs', '--check'])`
- **预期**：`code === 0`；stdout 含 `sweep ok`
- **判据**：`assert.equal(r.code, 0)`；`assert.match(r.out, /sweep ok/)`

### S3-TC-K05 旧 label 源与 `execution-matrix/criteria.md` 命中归零（§8 正例）【正】

- **覆盖**：`§8`、`§9.3 ①`
- **前置**：`OLD_LABELS` 派生；两文件可读
- **步骤**：`test('S3-TC-K05 源与矩阵改完')`：扫 `predicates.mjs` 与 `tools/execution-matrix/criteria.md`，统计 8 条旧 label 命中
- **预期**：两文件各 `0`；`OLD_LABELS.length === 8`（防「派生为空所以恒 0」）
- **判据**：`assert.equal(predHits, 0)`；`assert.equal(matrixHits, 0)`；`assert.equal(OLD_LABELS.length, 8)`

### S3-TC-K06 `skills/parliament/**` 3 处改引用不复制新文案（§8 正例）【正】

- **覆盖**：`§8`
- **前置**：三文件已改：`references/debate-protocol.md` / `assets/agent-template.md` / `assets/escalation-report.md`
- **步骤**：`test('S3-TC-K06 议会引用')`：逐文件扫旧 label 命中；再扫是否含指向登记表的指针；再扫是否复制新 label 全文
- **预期**：旧 label 命中 0（每文件）；每文件 `predicates` ≥1；三文件都不含任何新 label 全文
- **判据**：`assert.deepEqual([f1,f2,f3].map((s) => oldHits(s)), [0,0,0])`；`assert.deepEqual([f1,f2,f3].map((s) => s.includes('predicates')), [true,true,true])`；`assert.equal(newLabelCopyHits, 0)`

### S3-TC-K07 不该改的都没改、该改的命中已归零（历史件 / 过程账 / 本批两件）（§8 边界）【边界】

- **覆盖**：`§8`、`§9.3 ①`、`§10` 历史保留口径、`docs-convention` 硬约束 4（运行产物不改）
- **前置**：`<S3-BASE>` 已取；历史类清单从 `scripts/scope-sweep.mjs` 的 `HISTORY_PREFIXES` 派生
- **步骤**：`test('S3-TC-K07 不改面')`：① `git diff --numstat <S3-BASE>` 取改动文件集；排除本批两件（`2026-11-02-observable-s3` 前缀）与 `.session/`、`.superpowers/`；② 对**历史类**路径求交；③ 按 §9.3 ① 现算旧 label 命中面（同样排除过程账与本批两件），断剩余命中文件集 == 历史类文件集；④ 断历史件内旧 label 仍 ≥1（标保留 ≠ 悄悄改了）
- **预期**：按**跑时现算**判：① 排除后改动文件集里的历史类文件数 `0`；② 历史件旧 label 命中 ≥1；③ 175 口径里过程账文件 `0` 条（**不硬编码 35 / 175 / 12 / 22** —— 这些是 spec §8 的改前取数，只作 `t.diagnostic`）
- **判据**：`assert.deepEqual(changedHistory, [])`；`assert.ok(historyOldLabelHits >= 1)`；`assert.equal(counted.filter((p) => /^\.session[\\/]|^\.superpowers[\\/]|2026-11-02-observable-s3/.test(p)).length, 0)`；`t.diagnostic('spec §8 v3.1 取数：35 文件 / 175 行（排除过程账与本批两件）；含本批两件 37/197；含过程账 58/411（仅记录，不作判据）')`

### S3-TC-K08 命中处未进当次 `impact-sheet.md` 即红（§8 反例）【负】

- **覆盖**：`§8`、`§4` R8 判据
- **前置**：`mkdtemp` 副本
- **步骤**：`test('S3-TC-K08 清单缺口')`：副本删掉 `impact-sheet.md` 中某一个命中文件名 → `runNode(['scripts/scope-sweep.mjs', '--check', '--impact', <副本清单>])`
- **预期**：`exit != 0` 且 stdout 含 `清单缺文件`
- **判据**：`assert.notEqual(r.code, 0)`；`assert.match(r.out, /清单缺文件/)`

### S3-TC-K09 两处测试断言改派生化，且 `evidence-reader` 的**前缀子串**断言已处理（§8 边界）【边界】

- **覆盖**：`§8`（子串断言件）
- **前置**：`tools/docgen/test/pilot-render.test.mjs` 与 `evidence-reader.test.mjs` 已改
- **步骤**：`test('S3-TC-K09 测试断言改形')`：两文件扫 8 条旧 label 命中；断每文件含 `PREDICATES` 引用 ≥1；`evidence-reader` 再扫前缀子串 `无问题时显式声明`；`node --test` 两文件
- **预期**：旧 label 完整字面命中 `0`（两文件）；`PREDICATES` 引用 ≥1（每文件）；前缀子串 `0` 命中；两文件 `exit 0`
- **判据**：`assert.deepEqual([pilotSrc, evidenceSrc].map((s) => oldHits(s)), [0,0])`；`assert.equal([pilotSrc, evidenceSrc].filter((s) => s.includes('PREDICATES')).length, 2)`；`assert.equal(evidenceSrc.includes('无问题时显式声明'), false)`；`assert.deepEqual([r1.code, r2.code], [0,0])`

---

## 13 L 组：全量门禁面与本文件自核（§9.2 V-10、§7、D-11）

### S3-TC-L01 新测试文件单跑绿（`§7 步 S2` 单测落地）【正】

- **覆盖**：`§7 步 S2`、`§9.2 V-10`
- **前置**：`tools/docgen/test/s3-predicates.test.mjs` 已随施工落盘
- **步骤**：`test('S3-TC-L01 单跑')`：`node --test tools/docgen/test/s3-predicates.test.mjs`
- **预期**：`exit 0`；输出里 `S3-TC-` 测试块数 == 本文件用例总数（派生自本文件标题行）
- **判据**：`assert.equal(r.code, 0)`；`assert.equal(r.count, casesInTestcaseFile)`

### S3-TC-L02 `门禁段 ⑦` 扫描根仍 `rules/` + `skills/`（行为断言）、不新增 `门禁段 ⑧`、`check-observable` 仍绿（§7 边界）【边界】

- **覆盖**：`§7`、`§10 D-2` / `D-7`
- **前置**：`runNode` 可用；`mkdtemp` 临时根（含 `rules/` / `skills/` / `docs/` / `agents/` 四个子目录）
- **步骤**：`test('S3-TC-L02 门禁面未扩')`：① 临时根 `rules/a.md`、`skills/b.md` 各写一行可观察文本，`docs/c.md` 与 `agents/d.md` 各写一行含主观词无标记的文本 → `--check --root <tmp>`；② 再往 `rules/a.md` 追加同一行 → 重跑；③ 扫 `check-all.mjs` 段编号注释最大值；④ 仓根 `--check`
- **预期**：① `exit 0`（`docs/` 与 `agents/` **不在扫描面**）；② `exit 1` 且报 `rules/a.md`；③ 最大段号仍 7（未加 `门禁段 ⑧`）；④ `exit 0` 且末行 `check-observable ok`
- **判据**：`assert.equal(rClean.code, 0)`；`assert.equal(rDirty.code, 1)`；`assert.match(rDirty.out, /rules[\\/]a\.md/)`；`assert.equal(maxSectionNo, 7)`；`assert.equal(rRepo.code, 0)`；`assert.match(rRepo.out.trim().split(/\r?\n/).pop(), /check-observable ok/)`

### S3-TC-L03 本文件 ID 唯一、覆盖表列出的 ID 与标题块双向相等、条数 ≤ 80（D-11 边界）【边界】

- **覆盖**：`§10 D-11`、本文件自核
- **前置**：本文件可读
- **步骤**：`test('S3-TC-L03 ID 与上限')`：① 解析 `^### S3-TC-([A-L]\d{2})` 取标题 ID 集；② 解析 §1 覆盖总表末列取形如 `^[A-L]\d{2}$` 的裸组号（排除 `I22`–`I25` 这类改判口径编号）；③ 两集合双向比
- **预期**：双向相等（无缺号、无孤立用例）；ID 无重复；总数 ≤ 80
- **判据**：`assert.deepEqual([...headingIds].sort(), [...coverageIds].sort())`；`assert.equal(new Set(headingIds).size, headingIds.length)`；`assert.ok(headingIds.length <= 80)`；`assert.equal(coverageIds.filter((id) => /^I2\d/.test(id)).length, 0)`

### S3-TC-L04 spec 不内联用例（五条判据之四）【边界】

- **覆盖**：本文件自核、`§9.1`
- **前置**：spec 与本文件均可读
- **步骤**：`test('S3-TC-L04 不内联')`：扫 spec 正文是否出现 `S3-TC-` 用例块；再断 spec 含本文件路径外链
- **预期**：spec 内 `S3-TC-` 次数 ≤ 1（只允许外链文件名一次）；外链在位且文件存在
- **判据**：`assert.equal((specSrc.match(/S3-TC-/g) ?? []).length <= 1, true)`；`assert.ok(specSrc.includes('2026-11-02-observable-s3-predicates-reuse-design-testcase.md'))`；`assert.equal(existsSync(join(REPO, TC_PATH)), true)`

### S3-TC-L05 本文件不自递归跑全量门禁（常量 9 / 15）【边界】

- **覆盖**：本文件自核、常量 15
- **前置**：本文件可读
- **步骤**：`test('S3-TC-L05 不自递归')`：只对**步骤列**扫 `npm run check` / `scripts/check-all.mjs` 的命令形态；再断散文里有「由 `check-all` 自跑」的声明 ≥1
- **预期**：步骤列命中 `0`；声明 ≥1；覆盖表的「未覆盖 0 项」只对 spec 约束负责
- **判据**：`assert.equal(stepColumnHits, 0)`；`assert.ok(proseMentions >= 1)`

### S3-TC-L06 本文件声明计数 == 实测计数【边界】

- **覆盖**：本文件自核
- **前置**：本文件可读；`splitRow` 可 import
- **步骤**：`test('S3-TC-L06 计数自洽')`：① 从头部声明行解析「用例总数 / 正 / 负 / 边界」；② 逐 `^### S3-TC-` 标题取行末 `【…】` 分组计数；③ 逐键比
- **预期**：四项逐项相等；类型标记只出现三值；「负 + 边界 ≥ 正」成立
- **判据**：`assert.equal(actual.total, declared.total)`；`assert.deepEqual({正: actual.正, 负: actual.负, 边界: actual.边界}, declared)`；`assert.deepEqual(Object.keys(actual).sort(), ['正','负','边界'])`；`assert.ok(actual['负'] + actual['边界'] >= actual['正'])`

### S3-TC-L07 本文件不新增第二套 helper、且判据列无悬空符号（常量 3 / §0.1 边界）【边界】

- **覆盖**：本文件自核、常量 3、§0.1
- **前置**：`tools/docgen/test/` 目录可扫；本文件可读
- **步骤**：`test('S3-TC-L07 helper 与悬空符号')`：① 扫 `s3-predicates.test.mjs` 是否 `import` 自 `./support/card-fixtures.mjs`；② 扫该文件内 `function walkFiles` / `function coldRepo` 本地定义；③ 从本文件「判据」列抽出所有 helper 调用名（`assertXxx(` / `markerKindsOf(` / `hasMarker(` / `labelHitsOf(` / `vp(` / `blockOf(` / `hunksOf(` / `seven(` / `eight(` / `escape(` / `oldHits(` / `legacyTokenHit(` / `findingCodes(` / `renderNeverLine(` / `renderMustLine(`），与 §0.1 登记名集 + 第 27 行 import 面求差
- **预期**：import 自 `card-fixtures.mjs`；本地 helper 定义 `0`；③ 差集 `[]`（**不许留悬空符号**）
- **判据**：`assert.ok(newSrc.includes("from './support/card-fixtures.mjs'"))`；`assert.equal(localHelperDefs, 0)`；`assert.deepEqual([...calledNames].filter((n) => !HELPER_NAMES.has(n)), [])`

---

## 14 负例与边界汇总（便于评审一眼看出有没有只测 happy path）

| 用例 ID | 边界 / 负例是什么 | 为什么容易漏 | 期望行为 |
|---|---|---|---|
| S3-TC-A02 | 8 id 多一 / 少一 / `impl` 漂 | 「加字段」看着像增强，实为新增判据 id | 三构造全红 |
| S3-TC-A04 | 四字段五类缺形 | 只测「有键」不测「值合格」 | 五次全红且 path 无前缀 |
| S3-TC-A05 | `sample` = 0 / -1 / 1.5 / `'3'` / `NaN` | 用 `> 0` 会放过 `1.5` 与 `'3'` | 只 `1` 过 |
| S3-TC-B02 | 旧 label 复原 | 只测「当前干净」不测「判别力」 | `subjectiveHit` 真、D1 红且 path = `label` |
| S3-TC-B03 | 词表外同义形容（「公正」） | 把 C-3 读成「不许形容词」会把对的判红 | 不红；含词表词必红 |
| S3-TC-B04 | term 塞进 `observable` vs 塞进 `label` | 把 C-3 读成「两面都扫」 | observable 不判红（归 C-4）；label 必红 |
| S3-TC-C02 | `['ok']` / `'写得好'` | 旧判法 `evaluateText('ok')` 恒 pass（P0 根因） | 标记命中 `[]`；verdict pass 只作反向证据 |
| S3-TC-C03 | 四类标记措辞 / 整串 vs 分块 | 沿用 `evaluateText` 分块会误判；以为一元素只命中一类 | 四类各命中各的；别行有标记即命中 |
| S3-TC-D02 | never 写成 must 形态 / 把通过态写进 never | 「不得须…」双否定与「不得 diff 为空」都最易被忽略 | 两构造各红 |
| S3-TC-D03 | must 侧误判「须」为违规形态 | 过度判红 | 4 条 must 行 0 处「不得」 |
| S3-TC-D05 | 核心语义被换成更小判据 / 载体指向未声明字段 / C-8 后段无标记 | 三件事都像「写得更精确」 | 三构造各红 |
| S3-TC-E03 | label 含词但 observable 写满 | 以为 observable 全满可豁免 | 仍红（D1） |
| S3-TC-E04 | D2 四形态 | 只测「非空」不测「元素类型」 | 四次全红且 path 带下标 |
| S3-TC-E05 | `negativeSample` 缺键 / 空白串 | 空白串最易当「有值」放过 | 两形态都红 |
| S3-TC-E06 | `residual` 四形态 | `1.5` / `'3'` 会被 `> 0` 放过 | 四形态都红 |
| S3-TC-E07 | `['ok']` 过 D5 | 填 `['ok']` 曾能全过（F2 族根因） | 必红且 path = `observable[0]` |
| S3-TC-E08 | 多错并存 + 入参可变 + path 前缀 | 短路只报首条；顺手加前缀 | `errors ≥ 4`、无前缀、入参相等 |
| S3-TC-F02 | 复活本地 `subjectiveHit` | 「留着旧实现兜底」正是第二实现点 | 定义数 2 即红 |
| S3-TC-F04 | 旧 8 条逐条复原（过度判红探针） | 若实现把 8 条全判死，说明误伤 | 只 1 条红 |
| S3-TC-F06 | 只在数据层塞词 | 「0 命中」可能是没扫到（v2 曾扫空集） | 命中 ≥1 且点名该席 |
| S3-TC-F07 | 词表被复制成字面 | 「写死更直观」= 第二份词面 | 字面命中 0 |
| S3-TC-G02 | 判据表坏报成 `Mismatch` | 两件事混用同一码会失去定位 | exit 1 且首行 `predicates[` |
| S3-TC-G03 | 两错并存报错顺序 | 顺序反了会被误读成「卡面手改」 | 首条为 `predicates[` |
| S3-TC-H02 | 卡面追加 1 字节 | 手改卡最隐蔽 | `Mismatch` + 点名 |
| S3-TC-H04 | 卡面「不得不得」/ baseline 漂移 | never label 拼进「不得」即双否定 | 0 命中且 baseline == renderBaseline() |
| S3-TC-H05 | 前提破裂（某席 `state` ≠ `replaced`） | 前提只写正文、不进断言会悄悄失效 | 篡改副本 exit 1、对照 exit 0 |
| S3-TC-H06 | 必红期写成「N 条独立输出」/ 无回退面 | `gate` 只报首条单行；只写推进不写回退 | 首行即 `Mismatch: agents/…` 且 `Mismatch` 出现 1 次；回退后 exit 0 |
| S3-TC-H08 | 跳过 S1a 直接 S1b | 「测试回头再改」= 门禁先红后绿不可达 | 两测试文件必红 |
| S3-TC-I06 | 验证节在但无 marker | 「写了验证节」≠「写了怎么判」 | 0 分且出 findings |
| S3-TC-I07 | 正文有 marker 但无验证节 | 以为 `§5 检查点 ⑨` 是全文扫（那就成 `§5 检查点 ⑦` 复读） | 仍 0 分 |
| S3-TC-I08 | 节定位不定死（6/23 vs 4/23） | `### 验证` 漏认 / 多处取错 | 三级标题认；两节取第一个 |
| S3-TC-I09 | 未登记标记 / 台账登记非共享项 / R7 缺用户确认 | 归桶单源被绕过；⑨ 若被当共享项登记则 R7 必红 | 三种缺口各红、仓内两守卫均 ok |
| S3-TC-I10 | 只改 `max` 不改 `total`；块外命中 | 全文件 `includes` 改前改后都绿（假绿） | 单测绿 + 四块内断言都是新值 |
| S3-TC-I11 | 只改脚本不改文档 | 计数口径最常见的半改 | 三组断言各红 |
| S3-TC-I13 | 同步 6 项缺一项 | 「其余都改了」= 只差一处 | 六个副本各红一项 |
| S3-TC-I14 | 编号断号 / E2 漏行 / 越界删除 | 「只加不删」需条目数不减兜 | 36 连续、E2 恰 1 行、越界删除 0 |
| S3-TC-J02 | 词表复制进 skill | 复制词表面上看是「写清楚」 | 红 |
| S3-TC-J04 | 指针行写死词表 | 同上，且更隐蔽（只一行） | 红 |
| S3-TC-K03 | 漏登记一个口径 | 只登记一部分 `--check` 也绿（未登记不扫） | 红 |
| S3-TC-K07 | 历史 / 过程账被悄悄改 | 「标保留」只写报告等于没做；改前值被当判据 | 历史 0 改动；过程账不计入；现算不硬编码 |
| S3-TC-K08 | 清单缺一个文件 | 自动发现清单时最易漏一个文件名 | exit != 0 且含「清单缺文件」 |
| S3-TC-K09 | `evidence-reader` 用**前缀子串**断言 | 完整 label 扫为 0，改 label 后子串断言必红 | 子串 0 命中、改从 `PREDICATES` 派生 |
| S3-TC-L02 | 顺手加 `门禁段 ⑧` / 扩扫描根到 `docs`·`agents` | 「多一个门禁面」其实多一处漂移源 | `--root` 行为断言：docs/agents 不入面、段号仍 7 |
| S3-TC-L03 | 用例数 > 80 / 重号 | 重号会让历史引用悬空 | 唯一且 ≤ 80 |
| S3-TC-L04 | spec 内联用例 | 两处维护必漂移 | 外链 ≤ 1 处 |
| S3-TC-L05 | 用例步骤里跑全量门禁 | 自递归会让门禁卡死 | 步骤列命中 0 |
| S3-TC-L06 | 声明计数与实测不符 | 手抄计数最易漂 | 四项逐项相等 |
| S3-TC-L07 | 新测试另写 helper / 判据列有悬空符号 | 双份实现；照抄即 `ReferenceError` | 本地定义 0；差集 `[]` |

---

## 15 回归清单（改了 X 必须重跑哪些用例）

| 如果改了 | 必须重跑 | 为什么 |
|---|---|---|
| `vocab/predicates.mjs`（label / 三新字段） | A01–A05、B01–B04、C01–C03、D01–D06、E01–E08、H01–H08、K05、L01 | 判据表是 15 卡渲染与校验证的共同输入 |
| `validatePredicates.mjs` | E01–E08、F04、G02–G03 | 判定与 `path` 形态的唯一实现点 |
| `vocab/subjective-terms.mjs` / `validateCardModel.mjs` | B01–B04、C01–C03、F01–F03、F07 | substring 单实现点，改一处两面同时变 |
| `components/renderCard.mjs` / `vocab/object-names.mjs` | C01–C03、D01–D06、H01–H08 | 渲染是 C-6 的比对基准；宾语中文名从名表取 |
| `cli.mjs`（`gate` 接线） | G01–G04、H06、H08 | 错误码、报文前缀、只报首条单行与顺序在此 |
| `tools/docgen/state.json`（接管状态） | H01、H05 | C-6 的「15 席全比对」以 15 席全 `replaced` 为前提 |
| `tools/docgen/baseline.json` | H04、G01 | D-15：本块不改；`baseline` 数字不作判据 |
| `criteria.md` / `recipes.md` / `score.mjs` / `score.test.mjs` | I01–I11、I13、I14 | 计数口径与 `§5 检查点 ⑨` 判定的同一批落点 |
| `buckets.mjs` / `shared-items.mjs` / `check-buckets.mjs` / `shared-changes/changes.md` | I02、I09 | 归桶四处 + R7 反向 |
| `rules/skill-authoring-convention.md` | I12、I13、L02 | `门禁段 ⑦` 扫 `rules/`，改正文会连带 `check-observable` |
| `skills/rule-writer/SKILL.md` / `skills/dev-workflow/SKILL.md` | J01–J04、L02 | `门禁段 ⑦` 扫 `skills/` |
| `tools/scope-sweep/keywords.json` / `baseline.json` | K01–K04、K07–K08 | 改判回扫的唯一判据面 |
| `agents/*.md`（重生成） | H01–H08 | 逐字节比对面 |
| `tools/docgen/test/pilot-render.test.mjs` / `evidence-reader.test.mjs` | H07、H08、K09 | 旧 label 子串断言的派生化面 |

---

## 16 冲突登记（本文件与 spec / 既有件之间的口径张力，逐条给处置）

| # | 张力 | 本文件处置 | 谁最终定 |
|---|---|---|---|
| 冲突 1 | `§5 检查点 ④` 只改 `rules/skill-authoring-convention.md` 而**不改** `skills/skill-inspector/**`（`§10 D-6`），但 inspector 文件在 `skills/` 下会被 `门禁段 ⑦` 扫到 | 只判「规则文件新增判据⑤ + inspector 文件 0 新增判据行」（I12 / I13），**不要求改 inspector 文件** | ② 段议会（`D-6` 已定） |
| 冲突 2 | `§9.2 V-9`「`score.mjs` 不出现词面」与既有 `LOOSE_RE`（含「宽松」）冲突 | **已闭合（载体 = `§10 D-12`）**：只判「新增 `§5 检查点 ⑨` 块内」；I04 用块行集 + `blockFirstLine > looseReLine` 反证 | spec `§10 D-12` |
| 冲突 3 | `§3 C-5`「通顺」是语义判定，不能机判 | D01 用**实渲逐字行**（4 条，宾语取真实 `shared-actions.mjs`）+ D02 用双极性 / 通过态两构造作机械代理；语义回读仍归审计 → GAP-2 | 议会测试评委 + 审计 |
| 冲突 4 | `§7`「不得手改 `agents/*.md`」但 `replace --yes` 由人跑 | 只判最终字节（H01 / H02 / H07），不判「谁按了确认」 | 审计（`state.json` + `git diff` 抽核） |
| 冲突 5 | 8 条 label 是**草案**（`§10 D-1`），② 段可能改字 | 所有「新文案」断言从 `PREDICATES` / `OLD_LABELS` / `CORE` **派生**，不硬编码新 label 字面；D01 的逐字样例随草案同批更新 | ② 段复签（`D-1` / `Q2`） |
| 冲突 6 | `§3 C-3` 曾要求 `observable[]` 也不含词，而 `§4 D1` 只判 `label` | **已闭合（载体 = spec `§3 C-3`）**：C-3 只判 8 条 label；B04 只断「substring 只喂 label」 | spec `§3 C-3` |
| 冲突 7 | C-4 条文（「含 ≥1 标记」）与旧判法（`evaluateText` verdict）不等价（第 1 轮 P0） | **已闭合（载体 = spec `§3 C-4` + `§4 D5`）**：C01/C02/C03 一律跑 `markers.some(...)`；`evaluateText` 只留作反向证据 | spec `§3 C-4` |
| 冲突 8 | `path` 无前缀（`§4`）与 `stderr` 报文带前缀（`tools/docgen/cli.mjs:694-696`）看似矛盾 | 两层：`errors[].path` 无前缀（A04 / E03–E06 / E08），`predicates[<id>].<path>：` 由 `gate` 拼（G02 断首行） | spec `§4` |
| 冲突 9 | 同一圈号三种含义（`§5 检查点 ⑨` / `§5 检查点 ⑦` / `§7 步`） | `§5 检查点 ⑨` 判**验证节内**标记覆盖（I05–I08），`§5 检查点 ⑦` 判全文含主观词行；I07 用「正文有 marker 但无验证节仍 0 分」钉开两面 | spec `§5 检查点 ③` + `§10 D-14` |
| 冲突 10 | `§7` 与 `§5 检查点 ⑨` 的 fixture 关系：`score.test.mjs` 8 份 fixture 无验证节 → `§5 检查点 ⑨` 恒 0，`total` 可能不等于新 `max` | I10 断 `max` 严格 +1，`total` 允许「新 max」或「新 max − 1」（spec 允许「补 marker」或「按新口径重写期望」两条路），并要求每块有 `§5 检查点 ⑨` 处置说明；**不许为此放宽 `§5 检查点 ⑨`** | spec `§7`（BE-2-02 已定） |
| 冲突 11 | `§3` 载体列是自然语言，`observable` 文本里不一定出现字面字段名 | **机判只到「载体列非空 + 字段名 token ⊆ 已声明集」**（D04 的 `assertCarriers`）；「贴不贴切」归人工回读 → GAP-11 | 审计 + ② 段复签 |

### 16.1 第 1 / 2 轮点名项的处置（逐条落到用例）

| 点名项 | 原问题 | 本文件处置 |
|---|---|---|
| QA-1-01（P0）C-4 无判别力 | `evaluateText` 对无词文本恒 pass | C01 断 `markers.some`；C02 断 `'ok'` 零标记；C03 整串口径；E07 `['ok']` → D5 红 |
| QA-1-02 / QA-2-03 删除列与改写互斥 | 「删除列 = 0」与改写既有行冲突 | I14 改「删除 hunk 所属小节 ⊆ 允许清单 + 表行数 +1」 |
| QA-1-03 I01 全角竖线 | 与仓内 `有 1 / 无 0` 不符 | I01 判据 `/有 1\s*[\/｜]\s*无 0/`，并用 `§5 检查点 ⑦` / `⑧` 行作格式对照 |
| QA-1-04 J05 缺 `--check` | `doc-name.mjs` 无旗标恒 exit 2 | J05 改 `--check docs/after` 并断 `命名检查通过` |
| QA-1-05 / AU P2 两表 + `:81` 漏登记 | 12 个数字无断言；全文件 `includes` 假绿 | I02 断 `criteria.md:1/:81`（三处计数 + 20/24）/`:85` + 两表 12 值 + `writing-guide:34`·`rule-skeleton:29` 的 6/6；I10 改**块标题绑定 + 两路自洽** |
| **QA-2-01** 9 个 `assertXxx` 悬空 | 判据列出现未定义符号 | §0.1 登记 23 个 helper（签名 + 实现要点）；L07 把「判据列调用名 vs 登记名集差集」做成断言 |
| **QA-2-02** `OLD_LABELS` 用 `JSON.parse` 解 `.mjs` | 解析必失败 | 常量 12 改 `git show` + 正则 `label:\s*'([^']*)'` 抽取（附可跑代码） |
| **BE-2-02 / AI-2-03 / AU** D04 期望过时 | v3 新增 C-8；`out-of-scope` / `proxy-fill` label 已改 | D04/D05 按 spec 逐字改；新增 D06（C-8 正）+ D05 补 C-8 反（**第 3 轮再按 v3.1 改两条 label**：`out-of-scope` 去 `diff`、`proxy-fill` 改「所记名称 != 该实例名」） |
| **QA-2-03** K07 硬编码 35/175 | 改前值被当判据 | K07 改**跑时现算**：diff 排除本批两件与过程账 → 历史件 0 改动；35/175 降为 `t.diagnostic` |
| **BE-2-02** I08 期望值错 | 沿用旧 ⑨ 口径 | I 组按 `^#{2,3}\s*验证$` + 取第一个重算；I08 专测节定位（`### 验证` 也认 / 两节取第一个） |
| **AU P0** H06「Mismatch × 15」 | `gate` 只报首条单行 | H06 改「首条 `Mismatch: agents/<席>.md`」（第 3 轮再改：`gate` 只报首条单行，`Mismatch` 出现次数 = 1） |
| **RD P1** 圈号一符三义 | `⑦/⑧/⑨` 同时指检查点 / 门禁段 / 步骤 | 常量 14 定三种写法：`§5 检查点 ⑨` / `§7 步 S1–S7` / `门禁段 ⑦`；全文按此改写 |
| **RD P1** 全量门禁与「1 正 1 反」 | 用例不跑全量门禁，覆盖声明易被误读 | 常量 15 + §1 明写：S4/S7 由 `check-all` 自跑；「未覆盖 0 项」只对 spec 约束负责（L05 判） |
| 第 1 轮 AI Q3 旧 label 派生源 | 依赖本批新建的 `I25` = 用产物测产物 | 常量 12：`git show <S3-BASE>:…predicates.mjs` |

### 16.2 第 3 轮 4 条点名项的处置（**不新增用例 ID**，全部改在既有 ID 内）

| 点名项 | 原问题 | 本文件处置（落在哪个既有 ID） |
|---|---|---|
| **QA/AI/AU-3-01** I02 假绿 | `/SKILL_MARKER_ITEM[\s\S]*?⑨/` 在未改仓里就 true；`split(/\r?\n/)[31]` 行号硬绑定 | **I02**：归桶四处全部改**结构读**（`BUCKETS` 两桶 items / `RULE_MARKER_ITEM['⑨']` / `itemsFromCriteria(carriers)` / `①-⑨` 注释形态），并加「`SHARED_MARKERS` 不含 ⑨·⑤」反向断言；**I09** 补 `unknownMarkers` 与台账三构造 |
| **-3-02** D04 `ALLOWED_CARRIER` 与 §3 载体列不兼容 | `evidence` / `audit` / `issue-card` 是 `outputKind` 键、不是 `fields`；`gate-record.md` 是全路径 | **D04**（含 `assertCarriers` 定义）：允许集改从 `Object.keys(outputFormats)` + 各 `fields` 派生，另放行 `申报人`·`签字人`·`git status --porcelain`·`正文`·`outputKind` 与 `gate-record.md` 路径后缀；**D05** 用 `「两栏」` 反证 |
| **-3-03** 计数补断 | `:81` 的三处计数、`writing-guide:34`、`rule-skeleton:29` 漏断 | **I02**（`assertCounts` + `wg34` / `rs29` 的 `/6\/6/`）与 **I11**（漏改即红） |
| **-3-04** I10 只认一条 fixture 路 | 走「旧值 + 0」时 `{score:9,max:9}` 必红 | **I10** 改**两路各自自洽**：`max` 严格 +1；`pass` 时 `total === max` 且 `{M,M}`；`fail` 时 `total === max − 1` 且 `{M−1,M}` |
| 同步 A：§3 两条 label 逐字 | `out-of-scope` 去 `diff`；`proxy-fill` 改「所记名称 != 该实例名」 | **D01**（判据 + 4 条逐字样例）、**D02**（通过态反例改为「计数 = 0 且含声明行」）、**D05** ③（无 marker 的通过态） |
| 同步 B：§7 步 S1 只报首条单行 | `H06` 原断言按旧口径写，在新口径下必红 | **H06** 改 `(match(/Mismatch/g) ?? []).length === 1`，并断言首行即 `Mismatch: agents/…` |
| 同步 C：§8 数字 | 取数改为 35/175、37/197、58/411 | **K07** 的 `t.diagnostic` 记三组数（判据仍为跑时现算） |

---

## 17 GAP：spec 项未被用例覆盖 / 只能在用例之外判（含「谁兜 + 触发信号」）

| # | 未被覆盖或在用例之外 | 归属 spec 项 | 谁兜 + 触发信号 |
|---|---|---|---|
| **GAP-1** | ~~`gate` 的 exit 1 错误码未指定~~ → **已闭合（载体 = spec §4）**：D1 → `SubjectiveLabel`、D2–D5 → `UnverifiableOutput`，两者 `exitCodeFor` = 1 | `§4` 接线、`§10 D-3` 邻域 | E02（码表 / 退出码单源）、E03 / B02 / F04（D1）、E04–E07（D2–D5）、E08（码集 + 键集）、G02（首行报文）。**触发信号**：出现第三个码 → E02 差集断言红 |
| **GAP-2** | **C-5「通顺性」不可机判**（「不得〈label〉（针对…）」读起来是否通顺） | `§3 C-5`、`§9.2 V-8` | **审计 / 议会测试评委**。逐字样例已改由 `renderCard` **实渲出具**（D01），机判只到「双否定 0 命中」（D02 / H04）。**触发信号**：`gate-record.md` 该段「核了什么」未出现「逐字回读 4 条 never 行」→ 视为未核 |
| **GAP-3** | ~~V-9「`score.mjs` 不出现词面」与既有 `LOOSE_RE` 冲突~~ → **已闭合（载体 = `§10 D-12`）**：收窄为「只判新增 `§5 检查点 ⑨` 块内」 | `§9.2 V-9`、`§10 D-12`、`§5 检查点 ③` | I04 按收窄口径断言（块行集 ∪ 新增行，15 词派生，`blockFirstLine > looseReLine` 反证）。**触发信号**：`§5 检查点 ⑨` 块里写词面字面 → I04 红；把口径扩回全文件 → 既有 4 处命中即红，须回 ② 段 |
| **GAP-4** | `docs/after/` 缺口文件名的「创建时刻」无法预知 | `§6.2` | **施工方**。触发信号：`node scripts/doc-name.mjs --check docs/after` 报前缀不合规 → 按创建时刻改名（J05 判） |
| **GAP-5** | ~~「15 席 disk == render」只在 `replaced` 席上成立~~ → **已闭合（载体 = spec §4）**：15 席**全为 `replaced`**，无「未接管席不比对」豁免面 | `§3 C-6`、`§4` 前提事实、`§10 D-5` | H01 逐席断言（`compared === SEATS.length`）+ H05 边界探针。**触发信号**：H01 的 `replaced` 前提断言红 = 接管状态变了，须回 ② 段补前提 |
| **GAP-6** | 「当次 `impact-sheet.md`」靠 mtime 自动发现，机器判不了「是不是这一批的」 | `§8`、`§10 D-10` | **审计**。触发信号：`scope-sweep --check` 报「impact-sheet 早于被扫文件」→ 用 `--impact` 显式指定并记入 `gate-record.md`（K08 判缺口形态） |
| **GAP-7** | **全量门禁（`npm run check`）不在本文件执行**：spawn 门禁总脚本会与 `node --test` 自递归 | `§9.2 V-10`、常量 9 / 15 | **门禁自身**（`check-all.mjs`：`门禁段 ②` 测试 + `门禁段 ②.5` gate + `门禁段 ⑦`）。触发信号：本文件步骤列出现全量门禁 → L05 红 |
| **GAP-8** | 8 条新 label 的**措辞质量**（写得准不准）不可机判 | `§3 C-7`、`§10 D-1` | **② 段议会复签**（`Q2`）。机判已钉「核心语义词在位 + 破折号 + 后段含标记」（D04 / D06）。**触发信号**：复签改字后 D01 逐字样例 / D04 的 `CORE` 未同批更新 → D01 / D04 红 |
| **GAP-9** | ~~`observable[]` 词面由谁判未定~~ → **已闭合（载体 = spec `§3 C-3`）**：C-3 只判 8 条 `label`；`observable` 可判性由 C-4 承担 | `§3 C-3`、`§3 C-4`、`§4 D1` | B04 只断「substring 只喂 label」；B01 收窄为 8 条 label。**触发信号**：实现把 D1 扩到 `observable` 面 → B04 的 `vp(copyObservableTerm).ok === true` 先红 |
| **GAP-10** | **`<S3-BASE>` 降级分支无用例**（门禁 `testEnv` 不注入 `S3_BASE`，K01 / K05 / K07 / K09 / F04 / I04 / I10 / I14 恒走降级分支） | 常量 7 / 12 | **`§7 步 S5` 施工方**（第 1 轮 QA 候选 C-1）。**触发信号**：降级分支被覆盖后须补 1 条边界用例（env 缺失 → `git log -1` 取值成功；git 不可用 → 不得 fail-closed） |
| **GAP-11** | **载体列「贴不贴切」不可机判**（机判只到「非空 + 字段名 token ⊆ 已声明集」） | `§3 C-7`、`§10 D-16` | **审计 + ② 段复签**。**触发信号**：D04 的 `assertCarriers` 绿，但人工回读发现 `observable` 与载体列指名的字段对不上（例如判「结论」列却只提 `path:line`）→ 记入 ② 段复签清单 |

**spec 必需项的覆盖缺口**：**无** —— `§3 C-1`–`C-8`、§4 前提事实 + `D1`–`D5` + 接线 + 错误码/path、`§5` 四处 + 计数清单 + 归桶四处（不触发 R7）+ `§5 检查点 ⑨` 三态 + D-17 + 同步 6 项、`§6.1` 两处、`§6.2`、`§7 步 S1`–`S7` + 必红期 + 回退面、`§8` 全表、`§9.2` V-8/V-9/V-10、`§10 D-18` 均已指派。上表 11 项是「spec 已声明但机器判不了」与「spec 未定义、需作者 / 施工方定」两类（GAP-1 / 3 / 5 / 9 已由 spec 修订闭合），**不是漏指派**。

---

## 18 计数与落点核对（写完自检的实测值）

| 项 | 值 | 可核方式 |
|---|---|---|
| 用例总数 | **80** | `(Select-String -Path <本文件> -Pattern '^### S3-TC-').Count` |
| 正 | **32** | 标题行末 `【正】` 计数；L06 逐键自核 |
| 负 | **27** | 标题行末 `【负】` 计数；L06 逐键自核 |
| 边界 | **21** | 标题行末 `【边界】` 计数；L06 逐键自核 |
| 负 + 边界 vs 正 | **48 ≥ 32 成立** | 27 + 21 = 48；`rules/spec-testcase-gate.md` 判据 3 因此满足 |
| 各组条数 | A 5 / B 4 / C 3 / D 6 / E 8 / F 7 / G 4 / H 8 / I 14 / J 5 / K 9 / L 7 = **80** | 按 ID 首字母分组计数 |
| 覆盖总表列出的用例 ID == 标题块 | **80 == 80** | L03 做成双向断言（排除 `I22`–`I25` 口径编号）；无缺号 / 无重号 |
| 判据列的 helper 名 == §0.1 登记名 | **全集相等** | L07 ③ 的差集断言 |
| 测试文件（建议） | `tools/docgen/test/s3-predicates.test.mjs` | 一个用例一个 `test('S3-TC-<ID> …')` 块（L01 / L03 判） |
| 运行方式 | `node --test tools/docgen/test/s3-predicates.test.mjs`（全量门禁不在此列，常量 9 / 15 / GAP-7） | L01 判 |
| 设计容量 | `node scripts/check-plan.mjs size --spec <spec> --testcase <本文件> --rounds 2` → `tc 80/80` | ≤ 80（`§10 D-11`） |

**本文件自核结论**：五要素 80/80 齐；负 + 边界 48 ≥ 正 32；覆盖总表列出的 80 个用例 ID 与 80 个标题块双向相等；≤ 80 条上限；spec 未内联用例（只有外链 1 处）；判据列无悬空符号（§0.1 23 个 helper 全覆盖，L07 判）。**11 项缺口全部登记「谁兜 + 触发信号」于 §17**（GAP-1 / 3 / 5 / 9 已由 spec 修订闭合，GAP-10 / 11 为本轮新增），无 TBD / 无「稍后补充」。
