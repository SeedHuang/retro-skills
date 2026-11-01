# 测试用例：可观察判据与卡面表达重构 · S1（清单与校验器）

> **归属 spec**：`docs/superpowers/specs/2026-10-31-observable-criteria-rollout-design.md`（待议会 #2 评审，未签字）
> **上游 PRD**：`docs/prd/20261031202331-observable-criteria-rollout/index.md`（已定稿、① 段已签）
> **编写者**：senior-sdet（独立实例，全新上下文，未参与该 spec 写作与施工）
> **独立性声明**：本文件由独立实例编写，与 spec 作者、施工者不同人；只读 spec / PRD / `scripts/check-all.mjs` / `scripts/scope-sweep.mjs` / `tools/docgen/card-model/vocab/*` / `tools/docgen/components/baseline.mjs`，未改 spec / PRD / 代码 / 规则；对实现的观察只作「来源补充」，不放宽任何 spec 推导用例
> **状态**：待 ② 段议会 #2 与 spec 同批评审（未签字）；已按 spec §11 **Q6～Q24** 与 §10 **D9～D27** 逐条对齐（对齐记录见 §9，冲突登记见 §10）；**2026-11-01 改口径**：词表 **10 → 9**（剔 `完整`，D26）、**标题行不参与判定**（D27）、分诊基线 **77 → 21**；用例落点为 ③ 段实现产出的 `tools/quality/observable-terms.json` / `tools/quality/observable-exempt.json` / `scripts/check-observable.mjs` / `rules/observable-criteria.md` / `scripts/check-all.mjs` ⑦ 段，本文件只定用例与断言，不含实现
> **编写日期**：2026-10-31（2026-11-01 修订：9 词 / 标题不扫 / 21 行基线）｜**用例总数 78**（正 31 / 负 34 / 边界 13）｜ID 前缀 `OCR-S1-TC-`
> **命名与落点**：`rules/spec-testcase-gate.md` 判据 1 —— 与 spec 同目录，文件名 = spec 去掉 `.md` 后加 `-testcase.md`；spec §9.1 已外链本文件，spec 正文不内联用例

---

## 0 判据常量与测试约定

| 编号 | 常量 / 约定 | 取值与出处（可复核） |
|---|---|---|
| 常量 1 | 主观词 **9** 条（逐字；`完整` 已剔除） | `自省` / `客观` / `诚实` / `宽松` / `严格` / `清晰` / `准确` / `显著` / `良好`（spec §2 `:23`、§3 `:33`、D26 `:200`、Q22 `:235`） |
| 常量 2 | 判据词 6 条（逐字） | `处置` / `依据` / `充分` / `合理` / `及时` / `适当`（spec §2 `:24`、§3 `:34`） |
| 常量 3 | 标记 8 类（**已收窄**，逐字） | `compare`（含全角 `≥` `≤` `＝` 与 `>` `<`）/ `pathline`（只认 `path:line` 字面或「带扩展名 + `:行号`」）/ `exit`（`exit` `退出码` `退出状态` + 可选 `code`/`码` + 可选 `=`/`:`/`为`/`是` + 数字）/ `diff`（只认 `diff 命令` / `diff --` / `diff 输出` / `diff 检查`）/ `count`（`计数 = N`）/ `empty`（`(?<![不非假])为空`）/ `nonempty`（`(?<![不非假])非空`）/ `enum`（`枚举[：:]` 后必须至少 1 个字面量字符）（spec §3 `:36-43`、Q17 `:230` / Q18 `:231`、D2 `:183`）（**2026-11-01 增量注**：实际守卫为 `empty` / `nonempty` = `(?<![不非假])(?<!要求)`、`enum` = `[A-Za-z0-9_]`；两处都是**收窄**以对齐本文件 `C19④` / `C22②`，本行原文保留，现行值以 `tools/quality/observable-terms.json` 为唯一源） |
| 常量 4 | 禁止作 literal 的四词 + enum 形态 | 裸 `=` / `出现` / `命令` / `词表`；`enum` 的 `pattern` 只写 `枚举[：:]`（冒号后无字面量要求）也算红（spec §3 C-3 `:60`） |
| 常量 5 | 清单 / 豁免 / 校验器 / 规则文档 路径 | `tools/quality/observable-terms.json` / `tools/quality/observable-exempt.json` / `scripts/check-observable.mjs` / `rules/observable-criteria.md`（spec §1 `:11-14`） |
| 常量 6 | 退出码与末行 | `0` = `check-observable ok`；`1` = `check-observable fail（命中 N 行 / stale M 条）`；`2` = `check-observable error（<断言号>: <原因>）`，断言号含 **P-1～P-4**；**任何未捕获异常 → exit 2**（spec §4 `:94`） |
| 常量 7 | hit 输出格式（**按行**） | `path:line  term=<词1,词2…>  无结构化可观察标记`（spec §4 `:78`、D19 `:202`） |
| 常量 8 | **21 行**基线（9 词 + 排除标题行） | 9 词口径 23 行，减 2 行标题 = **21 行**（按行计）；取数命令见 spec §9.3 `:175`（spec §9.3 `:164-176`、D18 `:199`；**§5 `:116` / §1 `:13` / D8 / Q4 仍写 77，见 §10 冲突 4**） |
| 常量 9 | 测试构造禁令 | 一律在 `mkdtemp` 临时根或内存副本上构造，**不写仓内文件**；`--root` **只替换扫描根**，清单 / 豁免默认仍从仓根 `tools/quality/*.json` 读；要换数据源才用 `--terms <file>` / `--exempt <file>`（spec §4 `:69`、D22 `:205`） |
| 常量 10 | 判定纯函数（单点） | `export function evaluateText(text, { terms, markers })` → `{ verdict: 'pass' \| 'fail', matched: [{ term, index }] }`（`matched` **不去重**）；CLI 与 P-3 共用（spec §4 `:92`、D14 `:195`） |
| 常量 11 | 豁免违规归类 | 结构错（E-1 / E-3 / E-4 / E-5）→ **P-4 → exit 2**；stale（`contains` 0 命中）→ **exit 1**（spec §4 `:90`、§5 `:108-112`、D9 `:190`） |
| 常量 12 | ⑦ 段首行与计数单源 | `[observable] 扫描 <N> 个 .md / 未豁免命中 <H> 行 / 已豁免 <E> 行 / stale <S> 条`；数字单源 = `--json`（`N = scanned.length`、`H = hits.length`、`E = exemptedLines`、`S = stale.length`）；**不可经 `CHECK_BYPASS` 旁路**（spec §7 `:128-130`、D15 `:196`、D25 `:208`） |
| 常量 13 | 遍历口径（P-1） | **两次独立遍历**数相等；`rules/` 与 `skills/` 各 ≥1；仓根总数 = **两态允许 {106, 107}**（`rules/observable-criteria.md` 落地前 106、落地后 107；**既不在集合内才红**）；`.md` / `.MD` 大小写不敏感；symlink / junction 跳过；扫描根不存在或不可读 → exit 2（spec §4 `:87`、D13 `:194`、Q10 `:223`） |
| 常量 14 | 分诊表落点与表头 | `docs/reports/2026-10-31-observable-s1-triage.md`，表头 6 列 = `path:line` / `命中词` / `块内 marker（有/无）` / `分类（改文案 / 已合格 / 合法保留）` / `处置` / `豁免 reason`；对账 `M + P + L = 21`、`exemptedLines = L`、`stale = 0`；**合法保留只许术语引用 / 词表自身，预期 `L ≤ 8`**（spec §9.3 `:166-176`、Q14 `:227`（**仍写 77，见 §10 冲突 4**）、Q24 `:237`） |
| 常量 15 | `--json` 形态（**新口径**） | `{ scanned: string[], hits: [{ path, line, terms: [] }], exemptedLines, stale: [...], ok }`（spec §4 `:78`、D19 `:202`、D21 `:204`、Q5 `:218`） |
| 常量 16 | 自动测试禁自递归 | 用例**不得** spawn `npm run check` / `check-all.mjs`（会与 ② 段 `node --test '**/*.test.mjs'` 自递归）；只允许：单跑 `node scripts/check-observable.mjs`、源码静态断、`node --test <单文件>`（spec §11 Q21 `:234`） |
| 常量 17 | 「复制词表」唯一实现点 | 判定 5（规则文档专判）住在 `scripts/check-observable.mjs`；测试一律**黑盒调用 CLI**，不写测试侧 helper（spec §4 `:79`、§6 `:122`、D16 `:197`） |
| 常量 18 | **标题行不参与判定** | 命中行以 `^#+ `（`#` 后跟空格）起头时**不产出 hit**（标题是索引，不是判据正文）；正文里出现同词仍必判（spec §4 `:71`、D27 `:201`、Q23 `:236`） |

**断言语义**：本文件「判据」列一律写可直接照抄的 `assert.*` 表达式，或「命令 + 退出码 + 关键输出」；不存在「检查是否合理」「符合预期」这类不可判表述。

---

## 1 覆盖总表

| 约束 / 节号 | spec 出处 | 用例 ID | 类型 |
|---|---|---|---|
| C-1（**9** 词逐字） | §3 `:58`、D26 `:200` | A01（正）/ A02（负）/ A03（边界） | 正 · 负 · 边界 |
| C-2（两表交集空） | §3 `:59` | A04（正）/ A05（负） | 正 · 负 |
| C-3（无裸 literal + enum 必须带字面量 + `pattern` 恰为 `=` 也红） | §3 `:60` | A06（正）/ A07（负）/ A08（边界） | 正 · 负 · 边界 |
| C-4（每词一条 samples + expect 值 + `residual` 键必在） | §3 `:61`、D10 `:191` | A09（正）/ A10（负） | 正 · 负 |
| C-5（`residual` 可为 null；非 null 时 who / sample；空壳红） | §3 `:62`、D10 `:191` | A12（正）/ A13（负） | 正 · 负 |
| C-6（无重复、无空串） | §3 `:63` | A14（正）/ A15（负） | 正 · 负 |
| P-1（两次独立遍历相等 + 各目录 ≥1 + 仓根 {106, 107} + 不存在/不可读 → exit 2） | §4 `:87`、D13 `:194`、Q10 `:223` | B01（正）/ B02（负）/ B12（负） | 正 · 负 |
| P-2（JSON 可解析 + 三表非空 + samples 全覆盖） | §4 `:88` | B04（正）/ B05（负）/ B06（负）/ B07（负） | 正 · 负 |
| P-3（正反例双向：verdict + `matched` 含该 term） | §4 `:89`、D14 `:195` | B08（正）/ B09（负）/ B10（边界）/ B13（负） | 正 · 负 · 边界 |
| P-4（豁免清单结构合法；结构错 → exit 2） | §4 `:90`、D9 `:190`、§5 `:108-112` | D01（正）/ D02（负）/ D06（负）/ D09（负）/ D11（负） | 正 · 负 |
| 判定 1-4（块内 marker / 豁免 / 红 / **hit 按行**） | §4 `:75-78`、D19 `:202` | C01（正）/ C02（正）/ C09（负）/ C10（负） | 正 · 负 |
| **标题行不参与判定**（`^#+ ` → 不产出 hit；正文同词必判） | §4 `:71`、D27 `:201`、Q23 `:236` | C23（正）/ C25（负） | 正 · 负 |
| 最小语义块四终止条件（含 `####` 不截断 / 围栏行不参与） | §2 `:26`、D3 `:184`、Q15 `:228` | C03（边）/ C04（边）/ C05（负）/ C06（负）/ C07（边）/ C08（边）/ C20（边，含围栏构造） | 边界 · 负 |
| 8 类标记（收窄后）逐类生效 | §3 `:36-43`、Q17 `:230`、Q18 `:231` | C11（正）/ C13（正）/ C19（负）/ C22（负）/ C24（边界） | 正 · 负 · 边界 |
| 输出顺序与 hit 粒度（按行聚合 `terms[]`） | §4 `:96`、D19 `:202` | C15（边界）/ C16（正，含顺序断言） | 正 · 边界 |
| `--json` 形态（`scanned` string[] / `hits[].terms` / `exemptedLines`） | §4 `:78`、D19 `:202`、D21 `:204` | C16（正） | 正 |
| 扫描面 + `--root` 语义（只换扫描根） | §4 `:69`、`:71`、D1 `:182`、D22 `:205` | C17（边界） | 边界 |
| E-1（四字段齐；违规 = P-4 → exit 2） | §5 `:108` | D01（正）/ D02（负） | 正 · 负 |
| E-2（path 存在 + `contains` ≥1 次；0 次 = stale → exit 1） | §5 `:109` | D03（负）/ D04（负） | 负 |
| E-3（`contains` 唯一；违规 = P-4 → exit 2） | §5 `:110` | D05（正）/ D06（负） | 正 · 负 |
| E-4（同 path 不重复 `contains`；违规 = P-4 → exit 2） | §5 `:111` | D08（正）/ D09（负） | 正 · 负 |
| E-5（`reviewed` 可解析 + 下界 2026-01-01；违规 = P-4 → exit 2） | §5 `:112` | D10（正）/ D11（负） | 正 · 负 |
| E-5b（365 天到期本块不判） | §5 `:113`、D12 `:193`、D20 `:203` | **无适用用例**（S1 无断言；触发日 **2027-11-01**，载体 `docs/after/<时刻>-observable-exempt-expiry-open-decisions.md`；源码静态断言见 D12） | 不适用 |
| E-6（新增豁免审计签字 / ④⑤ 门行条目数） | §5 `:114`、D24 `:207` | **无（人工兜 = G-3）**：本块不做机判、不挂空转用例 | 不适用（人工） |
| 豁免粒度（只摘命中行，不摘同文件其他） | §5 `:101-104`、D4 `:185` | D13（正） | 正 |
| 门禁 ⑦ 段（接入位置 / 首行计数单源 / 不吞 exit / 不可旁路） | §7 `:128-130`、D5 `:186`、D15 `:196`、D25 `:208`、Q21 `:234` | E01（正）/ E02（负） | 正 · 负 |
| ⑦ 的 `package.json` 入口 | §7 `:131` | E03（正）/ E04（负） | 正 · 负 |
| §6 规则文档结构（≤120 行 Node 口径 / 六锚结构断言 / 两句声明） | §6 `:120`、`:123`、Q19 `:232`、D7 `:188` | E05（正） | 正 |
| §6「不复制词表」（判定 5 黑盒：pattern ≥8 字符 / 同行 ≥2 词枚举 / 单词面绿） | §6 `:122`、§4 `:79`、D16 `:197`、Q13 `:226` | E06（负）/ E10（正）/ E11（负） | 正 · 负 |
| §9.3 分诊三分类对账（**21 行**）+ 两类蒙绿 | §9.3 `:166-176`、§5 `:116`（仍写 77，见 §10）、D17 `:198`、Q14 `:227` | E08（正）/ E09（负）/ E12（负） | 正 · 负 |
| §3 派生（subjective-terms / criterion-terms 不再写字面值） | §3 `:65`、§8 `:138-139` | F01（正）/ F02（负） | 正 · 负 |
| 新规则登记 baseline（`baseline` 37 → **38**） | §8 `:143`、D23 `:206` | F09（正） | 正 |
| `card-model.test.mjs` 同批改派生 | §8 `:141` | F04（正） | 正 |
| PRD `:271` 原文保留 + 日期注 + 5 词 ⊆ `J.terms` | §8 `:140` | F05（正）/ F06（负） | 正 · 负 |
| `tools/docgen/policy/**` 零改动 | §8 `:142` | F07（正） | 正 |
| R8（`scope-sweep --check` exit 0）+ **23 → 77 → 21 基线表述同批落**（D18） | §8 `:144`、D18 `:199`、PRD §5 `:224`、PRD §9.2 V-10 `:333` | F08（正） | 正 |
| V-10 全量门禁（本批由 ④ 段门行取证，测试不自递归） | §9.2 `:161`、Q21 `:234` | F09（正） | 正 |
| V-9 同一判据实现点恰 1（S1 面局部） | PRD §9.2 `:332` | F10（边界） | 边界 |

---

## 2 A 组：清单 JSON 约束（C-1～C-6）

| ID | 类型 | 覆盖 | 前置 | 步骤 | 预期 | 判据 |
|---|---|---|---|---|---|---|
| OCR-S1-TC-A01 | 正 | §3 C-1 `:58`、D26 `:200` | `observable-terms.json` 已按 §3 落地；测试 `JSON.parse(readFileSync(...))` 读入 | 取 `J.terms` 与常量 1 逐字比对；打印 `J.terms.length` | **长度 9**、顺序与常量 1 完全一致；**不含 `完整`** | `assert.strictEqual(J.terms.length, 9); assert.deepStrictEqual(J.terms, TERMS9); assert(!J.terms.includes('完整'))` |
| OCR-S1-TC-A02 | 负 | §3 C-1 `:58` | 同 A01 | `c = structuredClone(J)`，`c.terms.splice(c.terms.indexOf('良好'),1)`，把 `c` 喂 A01 的断言函数 | 断言必须抛（长度 8 与逐字比对同时不成立） | `assert.throws(() => assertTerms(c, TERMS9))`；且运行前后 `tools/quality/` 文件清单不变（未落盘） |
| OCR-S1-TC-A03 | 边界 | §3 C-1 `:58` | 同 A01 | `c = structuredClone(J)`，把 `清晰` 与 `准确` 互换位置（长度仍 9、成员仍全） | 逐字比对必须红 —— 只断长度/集合的实现会被这一条抓住 | `assert.throws(() => assertTerms(c, TERMS9))` |
| OCR-S1-TC-A04 | 正 | §3 C-2 `:59` | 同 A01 | 求 `terms` 与 `criterionTerms` 的交集；打印 `criterionTerms.length` | 交集为空数组；判据词表恰 6 条 | `assert.deepStrictEqual(J.terms.filter(t => J.criterionTerms.includes(t)), []); assert.strictEqual(J.criterionTerms.length, 6)` |
| OCR-S1-TC-A05 | 负 | §3 C-2 `:59` | 同 A01 | `c = structuredClone(J)`，`c.terms.push('合理')`（判据词混入主观词表），跑 A04 断言 | 必须红（不交集的实现必然拦得住） | `assert.throws(() => assertNoOverlap(c))` |
| OCR-S1-TC-A06 | 正 | §3 C-3 `:60` | 同 A01 | 遍历 `J.markers`：取 `kind` 清单；检查 `literal` 是否属常量 4；检查每项 `pattern` 与 `literal` 恰有其一；检查 `enum` 的 `pattern` 冒号后带字面量字符类 | 8 类 kind 逐字齐；无禁用 literal；每项恰一个匹配字段；`enum` pattern 含冒号后的字面量要求 | `assert.deepStrictEqual(kinds, KINDS8); assert(!J.markers.some(m => ['=','出现','命令','词表'].includes(m.literal))); assert(J.markers.every(m => ('pattern' in m) !== ('literal' in m))); assert(/枚举\[：:\].*\[/.test(J.markers.find(m => m.kind==='enum').pattern))` |
| OCR-S1-TC-A07 | 负 | §3 C-3 `:60` | 同 A01 | `c = structuredClone(J)`，把 `empty` 项改为 `{ kind:'literal', literal:'出现' }`，跑 A06 断言 | 必须红 | `assert.throws(() => assertMarkers(c.markers))` |
| OCR-S1-TC-A08 | 边界 | §3 C-3 `:60` | 同 A01 | 三种构造：① 某 marker 同时带 `pattern` 与 `literal`；② 某 marker `pattern` 恰为裸 `=`；③ `enum` 的 `pattern` 只写 `枚举[：:]`（冒号后无字面量要求） | 三者各必红（结构冗余 = 判定面二义；裸等号作正则 = 逃逸；裸 `枚举：` = 空壳过门） | `assert.throws(() => assertMarkers(c1.markers)); assert.throws(() => assertMarkers(c2.markers)); assert.throws(() => assertMarkers(c3.markers))` |
| OCR-S1-TC-A09 | 正 | §3 C-4 `:61`、D10 `:191` | 同 A01 | 逐条检查 `samples`：`term` 集合与 `terms` 集合双向相等；`positive.expect==='pass'`；`negative.expect==='fail'`；两个 `input` `trim()` 非空；**`residual` 键必须存在**（值另由 A12/A13 判） | **9 条**全覆盖、expect 值逐字、input 非空、9 条都带 `residual` 键（含值为 `null` 的条目） | `assert.deepStrictEqual(new Set(J.samples.map(s=>s.term)), new Set(J.terms)); assert.strictEqual(J.samples.length, 9); assert(J.samples.every(s => s.positive.expect==='pass' && s.negative.expect==='fail' && s.positive.input.trim() && s.negative.input.trim() && 'residual' in s))` |
| OCR-S1-TC-A10 | 负 | §3 C-4 `:61`、§9.2 V-5 `:160` | 同 A01 | 四种构造各跑一次 A09 断言：① 删掉 `自省` 的 `negative`；② 同 `term` 出现两条 `samples`；③ `positive.input = '   '`；④ `expect: 'PASS'`（大小写变体） | 四者各必红（V-5「删任一 negative → 测试红」；「恰一条」是计数、非空是 trim 后、expect 是逐字枚举） | `assert.throws(() => assertSamples(c1)); assert.throws(() => assertSamples(c2)); assert.throws(() => assertSamples(c3)); assert.throws(() => assertSamples(c4))` |
| OCR-S1-TC-A12 | 正 | §3 C-5 `:62`、D10 `:191` | 同 A01；基线里 `residual` 既有对象也有 `null`（`null` = 该词全量可二值判） | 逐条按 C-5 断言：`null` 直接放行；非 `null` 时判 `who`（`trim()` 非空）与 `sample`（正整数） | 9 条全过（对象与 `null` 混合基线不误红） | `assert(J.samples.every(s => s.residual === null || (typeof s.residual === 'object' && s.residual.who.trim() && Number.isInteger(s.residual.sample) && s.residual.sample > 0)))` |
| OCR-S1-TC-A13 | 负 | §3 C-5 `:62`、D10 `:191` | 同 A01 | 七种构造各跑一次：① `who: ''`；② `sample: 0`；③ `sample: '3'`；④ `residual: {}`；⑤ `residual: ''`；⑥ `residual: []`；⑦ `residual: null`（对照） | ①—⑥ 各必红（非 `null` 的空壳缺 `who` / `sample` = 把「有残余」写成「无残余」）；⑦ 合格（`null` 是 C-5 明许的全量二值判标记） | `assert.throws(() => assertResidual(c1)); assert.throws(() => assertResidual(c2)); assert.throws(() => assertResidual(c3)); assert.throws(() => assertResidual(c4)); assert.throws(() => assertResidual(c5)); assert.throws(() => assertResidual(c6)); assert.doesNotThrow(() => assertResidual(c7))` |
| OCR-S1-TC-A14 | 正 | §3 C-6 `:63` | 同 A01 | 检查 `terms`：`new Set(...).size === length`；每个 `t` 满足 `t.length>0 && t.trim()===t` | 无重复、无空串、无首尾空格 | `assert.strictEqual(new Set(J.terms).size, J.terms.length); assert(J.terms.every(t => t.length>0 && t.trim()===t))` |
| OCR-S1-TC-A15 | 负 | §3 C-6 `:63` | 同 A01 | 三种构造：① `c.terms.push('自省')`（重复）；② 把某词替换为 `''`；③ 替换为 `' 自省'`（前导空格） | 三者各必红（重复 / 空串 / 首尾空格都是「静默漏判」入口） | `assert.throws(() => assertTermsUnique(c1)); assert.throws(() => assertTermsUnique(c2)); assert.throws(() => assertTermsUnique(c3))` |

## 3 B 组：前置断言（P-1～P-3，exit 2；P-4 用例落在 §5 D 组）

| ID | 类型 | 覆盖 | 前置 | 步骤 | 预期 | 判据 |
|---|---|---|---|---|---|---|
| OCR-S1-TC-B01 | 正 | §4 P-1 `:87`、D13 `:194`、Q10 `:223` | `rules/` 与 `skills/` 存在；测试内自备 Node 同口径遍历（跳过 symlink / junction，`.md` / `.MD` 均计） | ① `node scripts/check-observable.mjs --check --json` 取 `scanned`；② 用测试自己的 Node 遍历计同口径文件数（第二源）；③ 仓根再断「总数 ∈ {106, 107}」；④ 临时根放 `a.MD` 与指向外部目录的 junction，`--check --json --root <tmp>` | ① `scanned` 是 **`string[]`**（`json.scanned.length`）且 = ②；③ 两支目录各 ≥1、总数 ∈ {106, 107}；④ `.MD` 计入、junction 内文件不计入 | `assert(Array.isArray(json.scanned)); assert.strictEqual(json.scanned.length, nodeCount); assert([106, 107].includes(json.scanned.length)); assert(hasUpperMd === true); assert(junctionFilesCounted === 0)` |
| OCR-S1-TC-B02 | 负 | §4 P-1 `:87` | 用 `mkdtemp` 造临时根：`rules/` 与 `skills/` 均存在但为空 | `node scripts/check-observable.mjs --check --root <tmp>` | exit 2；末行 `check-observable error（P-1: <原因>）`；stdout 无任何 `term=` 行 | `assert.strictEqual(status, 2); assert(/check-observable error（P-1/.test(lastLine)); assert(!/term=/.test(stdout))` |
| OCR-S1-TC-B04 | 正 | §4 P-2 `:88` | 默认读仓根 `tools/quality/*.json`（不复制 JSON） | 跑 `node scripts/check-observable.mjs --check` | 前置过：输出不含 `error（P-2`；exit ∈ {0,1} | `assert(!/error（P-2/.test(stdout+stderr)); assert([0,1].includes(status))` |
| OCR-S1-TC-B05 | 负 | §4 P-2 `:88` | 临时根持有两份坏副本（测试用 `mkdtemp` 写） | ① `--terms <截断的 JSON 副本>`（语法错：删掉末尾 `}` 与 `]`）；② `--terms <terms: [] 的副本>` | 两者各 exit 2；末行含 `P-2`（语法错也必须收敛成 exit 2，不得抛栈） | `assert.strictEqual(s1, 2); assert.strictEqual(s2, 2); assert(/error（P-2/.test(last1) && /error（P-2/.test(last2))` |
| OCR-S1-TC-B06 | 负 | §4 P-2 `:88` | 同 B05 | `--terms <markers: [] 的副本>` | exit 2；末行含 `P-2` | `assert.strictEqual(status, 2); assert(/error（P-2/.test(lastLine))` |
| OCR-S1-TC-B07 | 负 | §4 P-2 `:88` | 同 B05 | `--terms <samples 删掉 `良好` 那一条的副本>` | exit 2；末行含 `P-2`（「samples 覆盖全部 terms」是前置，不是命中红） | `assert.strictEqual(status, 2); assert(/error（P-2/.test(lastLine))` |
| OCR-S1-TC-B08 | 正 | §4 P-3 `:89`、D14 `:195` | `scripts/check-observable.mjs` 导出 `evaluateText`（常量 10） | 测试 `import { evaluateText }`，对 9 条 samples 逐条**在内存**调用正例与反例 | 9/9 正例 `verdict === 'pass'` **且** `matched` 含该 `term`；9/9 反例 `verdict === 'fail'` 且 `matched` 含该 `term`；`matched` 不去重 | `assert(J.samples.every(s => evaluateText(s.positive.input,{terms,markers}).verdict==='pass' && evaluateText(s.positive.input,{terms,markers}).matched.some(m=>m.term===s.term) && evaluateText(s.negative.input,{terms,markers}).verdict==='fail' && evaluateText(s.negative.input,{terms,markers}).matched.some(m=>m.term===s.term)))` |
| OCR-S1-TC-B09 | 负 | §4 P-3 `:89` | 临时根持有 `--terms` 副本 | 把 `自省` 的 `negative.input` 改成「每轮收尾必须写自省结论：三性验证附 path:line」（含 marker 的合格句），跑 `--terms <副本> --check` | exit 2；末行含 `P-3`（反例写成合格句 = 前置不过，不是命中红） | `assert.strictEqual(status, 2); assert(/error（P-3/.test(lastLine))` |
| OCR-S1-TC-B10 | 边界 | §4 P-3 `:89`、Q21 `:234` | 同 B09 | ① 反例改成**不含该词**的句子（`三性验证逐条附 path:line`）——评分函数「无命中 = 合格」，与 `expect: fail` 冲突；② 连跑两次 `--check`，前后 `mkdtemp` 目录文件清单快照 | ① exit 2、末行含 `P-3`；② 前后清单逐字相等（P-3 在内存跑、不落盘） | `assert.strictEqual(s1, 2); assert.deepStrictEqual(listBefore, listAfter)` |
| OCR-S1-TC-B12 | 负 | §4 P-1 `:87`、D13 `:194` | 临时根三种 fail-closed 形态 | ① `--root <不存在的目录>`；② 临时根原有两个子目录，跑一次计数后**删掉 `skills/`** 再跑；③ 临时根仅 1 个合法 `.md`（对照：前置应过） | ① exit 2（扫描根不存在 → 不可当 0 文件放行）；② exit 2、末行含 `P-1`（两次遍历数不等）；③ exit 0、`scanned.length === 1`（**2026-11-01 增量注**：支 ③ 是 `--root` 例外口径的依据 —— spec P-1 的「各 ≥1」只在扫描仓根时强制，`--root` 指向非仓根时降为「两目录须存在 + 总数 ≥1」；两处已同批对齐） | `assert.strictEqual(s1, 2); assert.strictEqual(s2, 2); assert(/error（P-1/.test(last2)); assert.strictEqual(s3, 0); assert.strictEqual(len3, 1)` |
| OCR-S1-TC-B13 | 负 | §4 P-3 `:89`（正例空转） | 临时根持有 `--terms` 副本 | 把 `自省` 的 `positive.input` 改成**不含该词**的句子（`三性验证逐条附 path:line`），跑 `--terms <副本> --check` | exit 2；末行含 `P-3`（正例 `matched` 不含该 term = 空转） | `assert.strictEqual(status, 2); assert(/error（P-3/.test(lastLine))` |

## 4 C 组：判定规则、判定窗口与标记形态

| ID | 类型 | 覆盖 | 前置 | 步骤 | 预期 | 判据 |
|---|---|---|---|---|---|---|
| OCR-S1-TC-C01 | 正 | §4 判定 4 `:78` | 临时根：`rules/x.md` 第 1 行「本规则要求每轮收尾都要自省结论。」（无可观察标记、非标题）；另放 1 个合法 `skills/y/SKILL.md` 保证扫描面非空；JSON 默认读仓根 | `--check --root <tmp>` | exit 1；stdout 含 `rules/x.md:1  term=自省  无结构化可观察标记`；末行 `check-observable fail（命中 1 行 / stale 0 条）` | `assert.strictEqual(status,1); assert(out.includes('rules/x.md:1  term=自省  无结构化可观察标记')); assert(lastLine==='check-observable fail（命中 1 行 / stale 0 条）')` |
| OCR-S1-TC-C02 | 正 | §4 判定 2 `:76`、§4 `:71` | 同 C01，该行改为「本规则要求每轮收尾都要自省结论：交付物 `docs/a.md:12` 逐条可追」 | 同上 | exit 0；末行 `check-observable ok`；无 hit 行 | `assert.strictEqual(status,0); assert(lastLine==='check-observable ok'); assert(!/term=/.test(out))` |
| OCR-S1-TC-C03 | 边界 | §2 `:26`、D3 `:184` | 临时根 `rules/x.md` 两行：第 1 行「- 每轮收尾要写自省结论。」（bullet 首行、无标记），第 2 行「  计数 = 3 条逐条附依据。」（同一 bullet 续行，含 `计数 = 3`） | `--check` | exit 0（标记在同一块的续行 → 合格）；若实现按「同一行」判，本条必红 | `assert.strictEqual(status,0)` |
| OCR-S1-TC-C04 | 边界 | §2 `:26`（「紧随的连续表格」） | 临时根 `rules/x.md`：命中行「存在自省结论的要求如下：」，紧邻下一行起就是一张两列表格（表头 + 分隔行 + 1 行数据），单元格含「≥ 3 条」；命中行与表格之间无空行 | `--check` | exit 0（表格属同一最小语义块） | `assert.strictEqual(status,0)` |
| OCR-S1-TC-C05 | 负 | §2 `:26` 终止条件 ②（同级或更高级标题） | 临时根：命中 bullet → 空行 → `## 另一节` → 该节某行含 `exit=1` | `--check` | exit 1；命中 1 行（跨标题的标记不得救活上一块） | `assert.strictEqual(status,1); assert(/命中 1 行/.test(lastLine))` |
| OCR-S1-TC-C06 | 负 | §2 `:26` 终止条件 ③（同缩进下一条 bullet）、Q15 `:228` | 临时根：`- 要写自省结论。`（命中）+ 紧邻下一行 `- 验收：exit=1。`（同层兄弟 bullet，无空行、无缩进） | `--check` | exit 1（兄弟 bullet 另起一块；若实现把「相邻行」当同块，本条必红） | `assert.strictEqual(status,1)` |
| OCR-S1-TC-C07 | 边界 | §2 `:26`（「其缩进子块」） | 临时根：`- 要写自省结论。`（命中）→ 缩进子 bullet `    - 验收：exit=1。` | `--check` | exit 0（子块属同块） | `assert.strictEqual(status,0)` |
| OCR-S1-TC-C08 | 边界 | §2 `:26` 终止条件 ①（空行） | 临时根：命中行 → 空行 → 纯文字续段（无 marker） | `--check` | exit 1（空行已截断块） | `assert.strictEqual(status,1)` |
| OCR-S1-TC-C09 | 负 | §4 `:76`、§9.2 V-4③ `:159` | 临时根：`- 检查要客观 = 全部覆盖。`（裸 `=`、无比较结构；`完整` 已出词表，改用 `客观`） | `--check` | exit 1（裸 `=` 不算 marker；V-4③ 的指定反例） | `assert.strictEqual(status,1); assert(/term=客观/.test(out))` |
| OCR-S1-TC-C10 | 负 | §2 `:25`、§3 C-3 `:60` | 临时根三条各一文件：① `- 自省后要检查是否出现遗漏。`；② `- 自省结论按命令输出贴。`；③ `- 自省与词表口径一致。` | 分别 `--check --root <单文件根>` | 每条各 exit 1（`出现` / `命令` / `词表` 是自然语义词，不计合格） | `assert.deepStrictEqual([s1,s2,s3],[1,1,1])` |
| OCR-S1-TC-C11 | 正 | §3 `:36-43` 8 类标记、Q17 `:230` | 临时根 8 个文件，每个 = 命中行 + 同块一行含该类标记：`≥ 3 条` / `docs/a.md:12` / `exit=1` / `diff 命令` / `计数 = 3` / `为空` / `非空` / `枚举：hit/miss`；另加全角对照 `≤ 1 处`、`＝3 类` | 逐文件单独跑，再一并跑 | 10/10 单独 exit 0；一并跑未豁免命中 0、`exemptedLines` 0 | `assert(ten.every(s => s===0)); assert.strictEqual(combined.status,0); assert.strictEqual(combined.json.hits.length,0)` |
| OCR-S1-TC-C13 | 正 | §3 `:38`、D11 `:192`、§11 Q8 `:221` | 临时根四文件：① `- 自省后核对 exit 0。`；② `- 自省后核对 exit code 0。`；③ `- 自省后核对退出码为 0。`；④ `- 自省后核对退出状态是 0。` | 分别 `--check` | 四者各 exit 0（pattern 认 `exit` / `退出码` / `退出状态` + 可选 `code` / `码` + 可选 `=` `:` `为` `是` + 数字） | `assert.deepStrictEqual([s1,s2,s3,s4],[0,0,0,0])` |
| OCR-S1-TC-C15 | 边界 | §4 `:73-78`、D19 `:202`（hit 按行聚合） | 临时根一行同时含两个**不同**词：`要求自省且客观达标。`（含 `自省` 与 `客观`，块内无 marker） | `--check --json` | 该行只产出 **1** 条 hit；`terms` 长度 2（`自省`、`客观`），按行聚合不按词次、不按词数拆条 | `assert.strictEqual(json.hits.filter(h=>h.line===1).length,1); assert.strictEqual(json.hits[0].terms.length,2); assert.deepStrictEqual(json.hits[0].terms.sort(), ['客观','自省'].sort())` |
| OCR-S1-TC-C16 | 正 | §4 `:78`、`:96`、D19 `:202`、D21 `:204` | 临时根三文件的命中行按乱序写入：`skills/z/m.md:9`、`rules/a.md:20`、`rules/a.md:3`、`skills/z/m.md:2` | `--check --json --root <tmp>` | `JSON.parse` 成功；顶层键 = `scanned` / `hits` / `exemptedLines` / `stale` / `ok`；`scanned` 为 `string[]`；`hits[0]` 键 = `path` / `line` / `terms`；**顺序 = path 字典序 + 行号升序**（`rules/a.md:3` → `rules/a.md:20` → `skills/z/m.md:2` → `skills/z/m.md:9`）；`ok === false`；exit 1 | `assert.deepStrictEqual(Object.keys(r.json), ['scanned','hits','exemptedLines','stale','ok']); assert(Array.isArray(r.json.scanned)); assert.deepStrictEqual(r.json.hits.map(h=>h.path+':'+h.line), ['rules/a.md:3','rules/a.md:20','skills/z/m.md:2','skills/z/m.md:9']); assert(Array.isArray(r.json.hits[0].terms)); assert.strictEqual(status,1)` |
| OCR-S1-TC-C17 | 边界 | §4 扫描面 `:71`、§4 `:69`（`--root` 只换扫描根）、D1 `:182`、D22 `:205` | 临时根（**不放 `tools/quality`**，清单从仓根默认读）：同一「仅主观词」构造五份，分别在 `docs/tmp/x.md`、`README.md`、`skills/y/a.txt`、`skills/y/a.mjs`、`skills/y/references/z.md` | `--check --json --root <tmp>` | `scanned` 不含 `docs/` / `README.md` / `.txt` / `.mjs`；`skills/y/references/z.md` 在 `scanned` 且产出 1 条 hit；命中总数 1（`.md` 之外不扫，已知不覆盖见 §8 G-2） | `assert(!json.scanned.some(p => p.startsWith('docs/') || p==='README.md' || p.endsWith('.txt') || p.endsWith('.mjs'))); assert.strictEqual(json.hits.length,1); assert.strictEqual(json.hits[0].path,'skills/y/references/z.md')` |
| OCR-S1-TC-C19 | 负 | §3 `:38`、`:43`、D11 `:192`、Q17 `:230` | 临时根四文件：① `- 自省后核对 exit。`（只有词、无数字）；② `- 自省后核对退出码：见上。`（无数字）；③ `- 自省后核对退出码是 通过。`（数字位不是数字）；④ `- 自省后按枚举：核对。`（裸 `枚举：`，冒号后无字面量） | 分别 `--check` | 四者各 exit 1（`exit` 形态必须带数字；`枚举` 必须带字面量，否则不算可二值判） | `assert.deepStrictEqual([s1,s2,s3,s4],[1,1,1,1])` |
| OCR-S1-TC-C20 | 边界 | §2 `:26` 终止条件 ②（只截「同级或更高级」）+ 围栏行不参与、Q15 `:228` | 临时根两构造：① `- 要写自省结论。`（命中）→ 紧邻 `#### 细则`（更深标题）→ `  exit=1。`（同一 bullet 缩进子块）；② 文件里开围栏，围栏内一行 `本规则要求自省。`（无 marker），闭围栏后补一个合法行 | 各跑 `--check --json` | ① exit 0（更深标题**不**截断当前块）；② exit 0、`hits` 为空（围栏内行不参与命中） | `assert.strictEqual(s1,0); assert.strictEqual(s2,0); assert.strictEqual(json2.hits.length,0)` |
| OCR-S1-TC-C22 | 负 | §3 `:41-42`、Q17 `:230` | 临时根两文件：① `- 自省后顺手 diff 了一下。`（裸 `diff`，无 命令/`--`/输出/检查）；② `- 自省后不要求非空。`（`非空` 前有守卫词「不」） | 分别 `--check` | 两者各 exit 1（收窄后的 `diff` / `nonempty` 不认这两种写法） | `assert.deepStrictEqual([s1,s2],[1,1])` |
| OCR-S1-TC-C23 | 正 | §4 `:71` 标题行不参与、D27 `:201`、Q23 `:236` | 临时根 `rules/x.md`：第 1 行 `## 自省必须给长期方案`（标题、块内无 marker）；正文只放 1 个合法行（含 marker） | `--check --json` | exit 0；`hits` 为空（**标题行不产出 hit**） | `assert.strictEqual(status,0); assert.strictEqual(json.hits.length,0)` |
| OCR-S1-TC-C24 | 边界 | §3 `:37`、Q18 `:231`（`pathline` 收紧） | 临时根两文件：① `- 自省结论附 docs/a.md:12。`；② `- 自省结论在 20:23 前后。` | 分别 `--check` | ① exit 0（`带扩展名 + :行号` 算标记）；② exit 1（`20:23` 无扩展名、非 `path:line` 字面，不算标记） | `assert.strictEqual(s1,0); assert.strictEqual(s2,1)` |
| OCR-S1-TC-C25 | 负 | §4 `:71` 标题行不参与（**正文同词必判**）、D27 `:201` | 同 C23 | 把同一个词写进**正文**：`- 自省必须给长期方案。`（无 marker、非标题） | exit 1；hit 行含 `term=自省`（标题不扫不等于该词可逃；正文照判） | `assert.strictEqual(status,1); assert(/term=自省/.test(out))` |

## 5 D 组：豁免清单（E-1～E-6 / E-5b；结构错 = P-4 → exit 2）

| ID | 类型 | 覆盖 | 前置 | 步骤 | 预期 | 判据 |
|---|---|---|---|---|---|---|
| OCR-S1-TC-D01 | 正 | §5 E-1 `:108`、E-2 `:109`、§5 `:101-104` 示例形态、P-4 `:90` | 临时根 `rules/x.md` 含**正文行** `本节结论必须自省后落笔（术语引用）。`（非标题、命中主观词、块内无 marker）；豁免条目 `{path:'rules/x.md', contains:'本节结论必须自省后落笔（术语引用）。', reason:'术语引用：这里是「自省」作为规则概念名，不是评价', reviewed:'2026-10-31'}`（`--exempt` 从仓根默认读，指向同路径） | `--check --json --root <tmp>` | exit 0；`hits` 不含该行；`exemptedLines === 1`；`stale` 为空；P-4 前置过（四字段齐、`contains` 唯一、`reviewed` 可解析） | `assert.strictEqual(status,0); assert.strictEqual(json.exemptedLines,1); assert.deepStrictEqual(json.stale,[])`；同时断言该条 reason 非空（E-6 的载体前提） |
| OCR-S1-TC-D02 | 负 | §5 E-1 `:108`、§4 P-4 `:90`、D9 `:190` | 临时根持有 `--exempt` 坏副本：删 `reason` 字段 | `--check --exempt <副本> --root <tmp>` | exit 2；末行 `check-observable error（P-4: …）`；stdout 无 `term=` hit 行（结构错 = 清单坏了，归前置） | `assert.strictEqual(status,2); assert(/check-observable error（P-4/.test(lastLine)); assert(!/term=/.test(out))` |
| OCR-S1-TC-D03 | 负 | §5 E-2 `:109`（path 存在；stale → exit 1） | 同 D01，但坏副本条目 `path: 'rules/nope.md'` | `--check --json --exempt <副本>` | exit 1；`stale` 含该条目；末行含 `stale 1 条` | `assert.strictEqual(status,1); assert.strictEqual(json.stale.length,1); assert(/stale 1 条/.test(lastLine))` |
| OCR-S1-TC-D04 | 负 | §5 E-2 `:109`（`contains` 0 命中 = stale → exit 1） | 坏副本条目 `contains: '本节结论必须自省后落笔（术语引用）（已删）'` | `--check --json --exempt <副本>` | exit 1；`stale` 含该条目；`exemptedLines` 0 | `assert.strictEqual(lastLine.includes('stale 1 条'), true); assert.strictEqual(json.exemptedLines,0)` |
| OCR-S1-TC-D05 | 正 | §5 E-3 `:110`（唯一） | 临时根 `rules/x.md` 该正文行 `contains` 在全文恰 1 处 | `--check --json` | exit 0；`exemptedLines` 1；`stale` 空 | `assert.strictEqual(status,0); assert.strictEqual(json.exemptedLines,1)` |
| OCR-S1-TC-D06 | 负 | §5 E-3 `:110`（≥2 处 = 锚点不精确）、P-4 `:90` | 临时根三种构造（均为**正文行**、非标题）：① `contains` 出现 2 处（同一正文行写两遍）；② 出现 3 处；③ 存在近似串（`本节结论必须自省后落笔（术语引用）（补）`）但 `contains` 仍恰 1 处 | 各跑 `--check --exempt <对应副本>` | ①② 各 exit 2、末行含 `P-4`（不得一键豁免多行）；③ exit 0（近似串不影响唯一性） | `assert.strictEqual(s1,2); assert.strictEqual(s2,2); assert(/error（P-4/.test(last1)); assert.strictEqual(s3,0)` |
| OCR-S1-TC-D08 | 正 | §5 E-4 `:111` | 同一 `path` 两条不同 `contains`（两条正文行各自命中主观词、均无 marker） | `--check --json --exempt <副本>` | exit 0；`exemptedLines` 2（按行）；`stale` 空 | `assert.strictEqual(json.exemptedLines,2); assert.strictEqual(status,0)` |
| OCR-S1-TC-D09 | 负 | §5 E-4 `:111`、P-4 `:90` | 同一 `path` + 同一 `contains` 写两条（仅 `reviewed` 不同） | `--check --exempt <副本>` | exit 2（P-4：去重失败会让计数虚高、对账 E08 失真） | `assert.strictEqual(status,2); assert(/error（P-4/.test(lastLine))` |
| OCR-S1-TC-D10 | 正 | §5 E-5 `:112` | 两个坏副本：① `reviewed:'2026-10-31'`；② `reviewed:'2026-01-01'`（恰下界） | 各跑 `--check --exempt <副本>` | 两者各 exit 0（可解析 + 不早于下界） | `assert.strictEqual(s1,0); assert.strictEqual(s2,0)` |
| OCR-S1-TC-D11 | 负 | §5 E-5 `:112`、P-4 `:90` | 三种构造：① `2025-12-31`（早于 2026-01-01 一天）；② `2026-13-45`（不可解析）；③ `昨天`（非日期） | 各跑 `--check --exempt <副本>` | 三者各 exit 2（P-4），末行含 `P-4` | `assert.deepStrictEqual([s1,s2,s3],[2,2,2]); assert(/P-4/.test(lastLine))` |
| OCR-S1-TC-D12 | 边界 | §5 E-5b `:113`、D12 `:193`、D20 `:203` | 坏副本 `reviewed:'2026-01-05'`（未满 365 天）；`scripts/check-observable.mjs` 已落地 | ① `--check --exempt <副本>`；② 读源码文本，静态断**不含 365 天判定分支** | ① exit 0（只判可解析 + 下界）；② 源码不含 `365` 相关判定（到期由 `docs/after/…expiry-open-decisions.md` 在 2027-11-01 升级，不属 S1） | `assert.strictEqual(s1,0); assert(!src.includes('365')); assert(!/到期\|过期/.test(src))` |
| OCR-S1-TC-D13 | 正 | §5 `:101-104`、D4 `:185`（行级粒度） | 同一文件两行**正文**命中（两处均无 marker、均非标题），只豁免第 1 行 | `--check --json` | exit 1；`hits` 1 行、`exemptedLines` 1（豁免只摘 `contains` 命中行，不整文件放行） | `assert.strictEqual(status,1); assert.strictEqual(json.hits.length,1); assert.strictEqual(json.exemptedLines,1)` |

## 6 E 组：门禁 ⑦ 段与规则文档

| ID | 类型 | 覆盖 | 前置 | 步骤 | 预期 | 判据 |
|---|---|---|---|---|---|---|
| OCR-S1-TC-E01 | 正 | §7 `:128-130`、D15 `:196`、D25 `:208`、Q21 `:234` | 本块已落地；**不 spawn** `npm run check` / `check-all`（常量 16） | ① 读 `scripts/check-all.mjs` 源码：含 `check-observable` 调用、该调用在 ⑥ 段（`runObservationGate` / `[豁免窗口]`）之后、失败分支置 `failed = true`、该段不在 `CHECK_BYPASS` 分支内；② 单跑 `node scripts/check-observable.mjs --check` | ① 四项静态断言各成立（不吞 exit、不降级 warning、不可旁路）；② exit 0、末行 `check-observable ok` | `assert(src.includes('check-observable')); assert(src.indexOf('check-observable') > src.indexOf('runObservationGate')); assert(/check-observable[\s\S]{0,400}failed = true/.test(src)); assert(!/CHECK_BYPASS[\s\S]{0,300}check-observable/.test(src)); assert.strictEqual(run.status,0)` |
| OCR-S1-TC-E02 | 负 | §7 `:128`（不吞 exit code、不降级为 warning） | 临时根 + 仓内源码 | ① 临时根放「仅主观词」行 → `node scripts/check-observable.mjs --check --root <tmp>`；② 静态查源码有无 `console.warn('[observable]'` 降级行、有无把非零状态忽略的分支 | ① exit 1、末行 fail；② 无 warn 降级、且存在把非零状态收敛为 `failed = true` 的语句 | `assert.strictEqual(s1,1); assert(hasWarnFallback === false); assert(hasFailedAssign === true)` |
| OCR-S1-TC-E03 | 正 | §7 `:131` | `package.json` 已加脚本 | 断言键存在且取值匹配正则；再单跑其等价命令 `node scripts/check-observable.mjs --check`（不经 npm，避免自递归） | 取值 = `node scripts/check-observable.mjs`（可带 `--check`）；实跑 exit 0 | `assert(/^node scripts\/check-observable\.mjs( --check)?$/.test(pkg.scripts['check:observable'])); assert.strictEqual(runStatus,0)` |
| OCR-S1-TC-E04 | 负 | §7 `:131` | 同 E03 | `c = structuredClone(pkg)`：① 删 `check:observable` 键；② 改值为 `node scripts/check-observable.mjs --fix`（不存在的能力） | 两者各必红（键缺失 / 值不合规格） | `assert.throws(() => assertPkgScript(c1)); assert.throws(() => assertPkgScript(c2))` |
| OCR-S1-TC-E05 | 正 | §6 `:120`、`:123`、Q19 `:232`、D7 `:188` | `rules/observable-criteria.md` 已落地 | ① Node 读文本 `readFileSync(...).split(/\r?\n/)` 计行（末尾换行 / BOM 不计）；② 六锚用结构断言 `/^##\s*(范围|条件|动作|宾语|触发时机|验证)/m`；③ 两句声明字面断言；④ 边界：恰好 120 行 → 合格、追加 1 空行（121）→ 红 | 行数 ≤ 120（Node 口径）；六锚各命中；两句声明各命中；120/121 边界按 ≤ 判定 | `assert(lineCount <= 120); assert(['范围','条件','动作','宾语','触发时机','验证'].every(k => new RegExp('^##\\\\s*'+k,'m').test(text))); assert(text.includes('不因来源豁免') && text.includes('豁免清单')); assert.strictEqual(ok120,true); assert.strictEqual(ok121,false)` |
| OCR-S1-TC-E06 | 负 | §6 `:122`、§4 `:79`（判定 5 黑盒）、D16 `:197`、Q13 `:226` | 临时根放**规则文档副本**（仓内原文 + 追加一段 `markers[].pattern` 原文，≥8 字符）；豁免从仓根默认读 | `node scripts/check-observable.mjs --check --root <tmp>` | exit 1、末行 `check-observable fail`（pattern 原文 = 第二份判定源；红由校验器判定 5 产出，测试不写 helper） | `assert.strictEqual(status,1); assert(/check-observable fail/.test(lastLine))` |
| OCR-S1-TC-E08 | 正 | §9.3 `:166-176`、D17 `:198`、Q14 `:227`、Q24 `:237` | 分诊表 `docs/reports/2026-10-31-observable-s1-triage.md` 已填满（6 列表头） | ① 读分诊表：表头恰 6 列（常量 14）；统计 `改文案` M / `已合格` P / `合法保留` L 的行数；② 单跑 `node scripts/check-observable.mjs --check --json` | **`M + P + L === 21`**；`json.exemptedLines === L`；`json.stale.length === 0`；`L <= 8`（Q24 预期）；`hits` 去重后为空（`new Set(hits.map(h=>h.path+':'+h.line))`） | `assert.strictEqual(M+P+L, 21); assert.strictEqual(json.exemptedLines, L); assert.strictEqual(json.stale.length, 0); assert(L <= 8); assert.strictEqual(new Set(json.hits.map(h=>h.path+':'+h.line)).size, 0)` |
| OCR-S1-TC-E09 | 负 | §5 `:116`「不得用全部豁免蒙绿」、Q24 `:237` | 同 E08 | 构造：分诊表 21 行全填「合法保留」（`L === 21`、`M = P = 0`）喂 E08 对账断言 | 必红（全豁免 = 假绿；且 `L ≤ 8` 上界同时破） | `assert.throws(() => assertTriage({M:0,P:0,L:21}))` |
| OCR-S1-TC-E10 | 正 | §6 `:122`、§4 `:79`、D16 `:197`（单词面叙述 → 绿） | 同 E06 | 规则文档副本再追加一行 `按本规则判「自省」时，看它所在块有没有可观察标记。`（单词面叙述），`--check --root <tmp>` | exit 0（单测黑盒：单词面不算复制词表） | `assert.strictEqual(status,0)` |
| OCR-S1-TC-E11 | 负 | §6 `:122`、§4 `:79`、D16 `:197`、Q20 `:233`（同行 ≥2 词枚举 → 红） | 同 E06 | 规则文档副本追加一行 `本规则覆盖 自省、客观、诚实、宽松 四类。`（同一行连续枚举 ≥2 个 `terms`），`--check --root <tmp>` | exit 1、末行 fail（枚举即复制词表） | `assert.strictEqual(status,1); assert(/check-observable fail/.test(lastLine))` |
| OCR-S1-TC-E12 | 负 | §9.3 `:173`、D17 `:198`（「已合格」档防假绿） | 同 E08 | 构造：分诊表 21 行全填「改文案」（`M === 21`、`P = L = 0`），但校验器实跑仍有未豁免 hit（`hits` 非空），喂 E08 对账断言 | 必红（全改文案但 hit 未清 = 分类不实；`hits` 去重后为 0 是硬判据） | `assert.throws(() => assertTriage({M:21,P:0,L:0,hits:1}))` |

## 7 F 组：与既有件一致性 / R8 / baseline

| ID | 类型 | 覆盖 | 前置 | 步骤 | 预期 | 判据 |
|---|---|---|---|---|---|---|
| OCR-S1-TC-F01 | 正 | §3 `:65`、§8 `:138-139` | 两个 vocab 文件都已改派生 | 读两份源码：常量 1（9 词）/ 常量 2（6 词）的字面出现次数；`import` 后取值 | 两文件字面出现均 0（含注释也不写词面）；`subjectiveTerms === J.terms` 且 frozen；`criterionTerms === J.criterionTerms`；两表交集空 | `assert.strictEqual(litA,0); assert.strictEqual(litB,0); assert.deepStrictEqual(mod.subjectiveTerms, J.terms); assert.deepStrictEqual(mod.criterionTerms, J.criterionTerms); assert(Object.isFrozen(mod.subjectiveTerms)); assert.deepStrictEqual(overlap,[])` |
| OCR-S1-TC-F02 | 负 | §3 `:65` | 同 F01 | 内存构造旧形态源码文本 `export const subjectiveTerms = Object.freeze(['自省','客观','诚实','宽松','严格'])`，跑 F01 的字面断言 | 必须红（「不得再写字面值」的判别力证明） | `assert.throws(() => assertNoLiteral(oldSource))` |
| OCR-S1-TC-F04 | 正 | §8 `:141` | `card-model.test.mjs` 已改「从 JSON 派生 + 交集空」 | `node --test tools/docgen/test/card-model.test.mjs`；静态检查该文件**不含旧五词字面数组形态**（`export const subjectiveTerms = Object.freeze(['自省'`） | exit 0、`# fail 0`；旧字面数组形态命中 0（不再对 PRD 行逐字） | `assert.strictEqual(status,0); assert(/# fail 0/.test(out)); assert(!/export const subjectiveTerms = Object\.freeze\(\['自省'/.test(testSrc))` |
| OCR-S1-TC-F05 | 正 | §8 `:140` | PRD `docs/prd/20261026205821-agent-card-contract.md` 在位 | ① 读 `:271` 该行原文；② 从该行切出 5 词（按 `、` / `，` 拆）；③ 查文件内日期注与指针 | 5 词原文仍逐字在；**切出的 5 词逐个 ⊆ `J.terms`**（9 词表仍含这 5 个）；同文件出现 `2026-10-31` 与 `tools/quality/observable-terms.json` | `assert(line.includes('自省') && line.includes('严格')); assert(five.every(w => J.terms.includes(w))); assert(text.includes('2026-10-31') && text.includes('tools/quality/observable-terms.json'))` |
| OCR-S1-TC-F06 | 负 | §8 `:140` | 同 F05 | `c = text.replace('2026-10-31', '')`（删日期注），跑 F05 第 ③ 段断言 | 必须红（原文保留不等于「加注」） | `assert.throws(() => assertDateNote(c))` |
| OCR-S1-TC-F07 | 正 | §8 `:142` | `tools/docgen/policy/**` 在位 | `git diff --stat <base> -- tools/docgen/policy`；`git status --porcelain tools/docgen/policy` | 两命令输出均为空（S6 已签，零改动） | `assert.strictEqual(diffStat.trim(),''); assert.strictEqual(porcelain.trim(),'')` |
| OCR-S1-TC-F08 | 正 | §8 `:144`、D18 `:199`、PRD §5 `:223`、PRD §9.2 V-10 `:332` | `tools/scope-sweep/keywords.json` 与 baseline 在位 | ① `node scripts/scope-sweep.mjs --check`；② 读 PRD `:223` 与 `:300`，断「23 → 77 → 21」的基线表述已同批加日期注 | ① exit 0（`sweep ok`）；② 两行各含 `2026-10-31` 与 `21`（原文不改、只加注） | `assert.strictEqual(status,0); assert(out.includes('sweep ok')); assert(/2026-10-31/.test(l223) && /21/.test(l223)); assert(/2026-10-31/.test(l300) && /21/.test(l300))` |
| OCR-S1-TC-F09 | 正 | §9.2 V-10 `:161`、§8 `:143`、D23 `:206`、Q21 `:234` | 本块已落地；**不 spawn** `npm run check` / `check-all` | ① 单跑 `node scripts/check-observable.mjs --check`；② `node tools/docgen/cli.mjs gate`；③ 读 `tools/docgen/baseline.json` 与 `tools/docgen/components/baseline.mjs` | ① exit 0、末行 ok；② stdout 含 `baseline 38/38`；③ 两处均含 `rules/observable-criteria.md`（新规则已登记，`UnregisteredHandwritten` 不再触发） | `assert.strictEqual(s1,0); assert(/baseline 38\/38/.test(out2)); assert(baselineJson.includes('rules/observable-criteria.md')); assert(baselineMjs.includes('observable-criteria'))` |
| OCR-S1-TC-F10 | 边界 | PRD §9.2 V-9 `:331`（S1 面：同一判据实现点恰 1） | 全仓 `tools/` + `scripts/` 已落地 | ① 静态扫常量 1 九词的字面数组形态（`['自省'` 起头）：`Get-ChildItem tools,scripts -Recurse -Include *.mjs,*.json` + `Select-String`；② 内存构造在 `tools/quality/` 外再放一份同形数组的文件路径清单（不落盘），喂同一断言函数 | ① 命中恰 1 处 = `observable-terms.json`、派生文件 0 处；② 副本数 >1 必红 | `assert.strictEqual(hits.length,1); assert(hits[0].path.endsWith('tools/quality/observable-terms.json')); assert.throws(() => assertSingleCopy([jsonPath, copyPath]))` |

---

## 8 § 缺口（已知未覆盖）

| # | 漏检哪类 | 为什么脚本/用例接不住 | 由谁人工兜 | 触发信号 |
|---|---|---|---|---|
| G-1 | 「这条判据翻译得对不对」（语义正确性） | 校验器只报位置、不判语义（spec §4 `:79`；PRD §5 `:227` 明写「判据不得自证」） | 议会测试评委（独立实例）做 §3.2 步 5 回读；无独立实例时按降级模式只出草稿 | 出现「译文与意图不符」的 review 卡 |
| G-2 | 非 `.md` 载体里的主观词（`.mjs` 字符串 / JS 注释 / `.json` 文案） | 扫描面按 spec 只含 `rules/` + `skills/` 的 `.md`（§4 `:71`），C17 只证明「不扫」 | 代码评审（review 卡）人工看；S3 扩面时再议 | `.mjs` 里出现主观词做判据的 commit |
| G-3 | **E-6「新增豁免须审计签字 + ④/⑤ 门行条目数」** | spec §5 `:114` / D24 `:207` 明写**不做机判**（门行在 ② 段之后才写；不引入 `approvedBy`）；校验器扫描面也不含 `gate-record.md` | 审计席按 R1/R2 核 ④/⑤ 行「核了什么」列是否写「豁免条目数」；**覆盖总表已标「无（人工兜）」** | `observable-exempt.json` 条目数变化但对应段门行无备注 |
| G-4 | 分诊表**内容**是否与 **21 行**实命中逐行对得上 | E08 能核 `M+P+L=21` / `exemptedLines=L` / `stale=0` / `L≤8`，但「某行该归哪类」仍是判断；表未填满前 E08 无法跑 | ③ 段申报人填表 + ④ 段按 R1 抽核 3 行（`path:line` 与 `contains` 同指、`块内 marker` 与实扫一致） | E08 的 `M+P+L` ≠ 21，或抽核 3 行有 1 行对不上 |
| G-5 | ⑦ 段「吞 exit / 被旁路」的真实注入 | `check-all.mjs` 无段级开关（`CHECK_BYPASS` 只跳 ⑥），自动测试只能源码静态断 + 单跑脚本（E01/E02，Q21 禁自递归） | ④ 段在一次真实红上验（临时改 JSON 后再还原），并在门行记 `[observable]` 首行 | ⑦ 段打印 fail 但 `npm run check` 仍 exit 0；或 `CHECK_BYPASS=1` 时 ⑦ 段也消失 |
| G-6 | 豁免行是否「该豁免」 | `reason` 只要非空就过（E-1 只判字段齐），内容合理性不入机判 | 议会 / 审计抽 3 条核 `reason` 与 `contains` 是否同指 | reason 写「暂不处理」「以后再说」 |
| G-7 | 规则文档自身过 ⑦（Q16 的两条：示例自带 marker / 叙述行入豁免） | E05 只断言结构与行数；「`exemptedLines ≤ 文档内叙述行数`」没有机判源（叙述行数无口径） | ④ 段跑 `--check` 看该文件 `hits = 0`，人工核豁免条数是否异常偏多 | `rules/observable-criteria.md` 出现 hit，或该文件豁免条目数 > 叙述行数 |

---

## 9 § 已裁定（18 条逐条指到 spec Q6～Q24）

> 无悬空反问。下表 = 「原问题 → 裁定出处 → 本文件落点」。

| 原问题 | 裁定出处 | 本文件的落点 | 残项 |
|---|---|---|---|
| CQ-1 `samples.residual` 是否必填 | **Q6** `:219` / D10 `:191` | A09（`residual` 键必在）、A12（`null` 放行）、A13（缺字段 / `{}` / `''` / `[]` 空壳红；`null` 对照绿） | 无 |
| CQ-2 E-5 的 365 天到期 | **Q7** `:220` / D12 `:193` / E-5b `:113` | D12 改 `2026-01-05` → exit 0，并加**源码静态断言**（不含 365 天分支） | 无（S1 无到期用例，覆盖总表标「不适用」） |
| CQ-3 `exit code 0` 算不算标记 | **Q8** `:221` / D11 `:192` | 常量 3 记 pattern；C13 四形态（含 `为` / `是`）全绿；C19 四反例（含裸 `枚举：`）全红 | 无 |
| CQ-4 豁免结构错的退出码 | **Q9** `:222` / D9 `:190` / P-4 `:90` | 常量 11；D02 / D06 / D09 / D11 → exit 2（P-4）；D03 / D04 stale 仍 exit 1；覆盖总表 P-4 行含 D01 正例 | 无 |
| CQ-5 P-1 在 `--root` / symlink / 大小写 | **Q10** `:223` / D13 `:194` | 常量 13；B01（两次遍历 + 各目录 ≥1 + {106, 107} + `.MD` + junction）；B12 补三 fail-closed 构造 | 无 |
| CQ-6 评分函数导出名 | **Q11** `:224` / D14 `:195` | 常量 10；B08 加「正反例 `matched` 均含该 term」；B13 补正例空转负例 | 无 |
| CQ-7 ⑦ 首行 `H` 含不含已豁免 | **Q12** `:225` / D15 `:196` | 常量 12；E01 静态断源码 + 单跑；首行按 `未豁免命中 H 行 / 已豁免 E 行 / stale S 条` 断言 | 无 |
| CQ-8「复制词表」机械判据 | **Q13** `:226` / D16 `:197` | E06（pattern 原文）/ E11（同行枚举）/ E10（单词面绿），全部**黑盒调 CLI** | 无 |
| CQ-9 分诊表落点与表头 | **Q14** `:227` / D17 `:198` | 常量 14（6 列表头 / **21** 行对账 / `L ≤ 8`）；E08 三分类；E09 / E12 两类蒙绿红例 | **Q14 本行仍写 `M + P + L = 77` → 见 §10 冲突 4，本文件按 §9.3 的 21 写** |
| Q15 最小语义块四终止条件 | **Q15** `:228` | C05 / C06 / C08（三条件负例）、C07 / C20（子块不截断 + 围栏不参与） | 无 |
| Q16 规则文档自身过 ⑦ | **Q16** `:229` | E05（结构 + 行数）、E06/E10/E11（复制判据）；「叙述行入豁免」由 ④ 段门行取证（G-7） | **有：`exemptedLines ≤ 叙述行数` 无机判源 → G-7 人工兜** |
| Q17 marker 守卫（`为空` / `非空` / 裸 `diff`） | **Q17** `:230` | 常量 3；C22 两反例（裸 `diff` / 「不要求非空」）；C11 正例用 `diff 命令` | 无 |
| Q18 `pathline` 收紧 | **Q18** `:231` | C24 正反（`docs/a.md:12` 绿 / `20:23` 红）；C11 正例保留 `docs/a.md:12` | 无 |
| Q19 规则文档「行」口径 | **Q19** `:232` | E05 用 Node `split(/\r?\n/)`（末尾换行 / BOM 不计），含 120/121 边界 | 无 |
| Q20「同行 ≥2 词」不设上限 | **Q20** `:233` | E11（4 词枚举 → 红）；C15（同行 2 词 → 1 条 hit、`terms.length = 2`） | 无 |
| Q21 禁 spawn 全仓 check | **Q21** `:234` | 常量 16；E01 / E03 / F09 全部改为「源码静态断 + 单跑 `check-observable` / `docgen gate`」；删掉所有「仓根干净」前置 | 无 |
| **Q22 `完整` 出表、C-1 怎么改** | **Q22** `:235` / D26 `:200` | 常量 1 改 9 词；A01 断 `length = 9` 且不含 `完整`；A02「删一词 → 长度 8 必红」；A03 互换 `清晰` / `准确`；A09/A12/B08 由 10 条改 **9 条**；C09 构造改用 `客观`；C15 用 `自省` + `客观` | 无 |
| **Q23 标题行不扫会不会漏判** | **Q23** `:236` / D27 `:201` | 常量 18；C23（`## 自省必须给长期方案` → 不产出 hit）；C25（同词写进正文 → 必 hit） | 无 |
| **Q24 21 行最后能不能到 L = 0** | **Q24** `:237` / D12 `:193` | 常量 14 / E08 加 `L <= 8` 上界断言；E09（全豁免 L=21 → 红，同时破 `L ≤ 8`） | 无 |

---

## 10 § 与 spec 的冲突登记（**五条已全部闭合**；原文保留）

> **闭合说明（2026-10-31）**：冲突 1 → spec §11 Q5 `:218` 已改为 `scanned: string[]` / `hits[].terms` / `exemptedLines`；冲突 2 → spec §9.2 `:162` 已改为 `exemptedLines = L` 行口径；冲突 3 → 分工保留（`N` = 扫到 `.md` 数，命中行数单列）。
> **闭合说明（2026-11-01）**：词表 **10 → 9** + **标题行不扫**，基线 **77 → 21**（D26 / D27）。**冲突 4**（spec §1/§5/D8/Q4/Q14 仍写 10 词 / 77 行）→ 已随本轮全节对齐（`§1 :13`、`§5 :116`、`D8 :189`、`Q4 :217`、`Q14 :227`）；**冲突 5**（示例豁免锚挂标题行 → 空转豁免）→ spec §5 `:102` 已改正文行 `被指出问题先自省…`。**本文件 D01～D13 的豁免构造一律用正文行锚点**。

| # | spec 位置 | 冲突 | 本文件的处置 |
|---|---|---|---|
| 冲突 1（已闭合） | §11 Q5 vs §4 `:78` / D19 `:202` / D21 `:204` / §7 `:129` | Q5 曾写 `hits:[{path,line,term}]` 与 `exempted` | 已由 Q5 `:218` 自身修正；常量 15、C16 / C15 / E08 均用新形态 |
| 冲突 2（已闭合） | §9.2 基线 `:162` vs §9.3 `:173` | 「豁免条目数」vs `exemptedLines`（行口径） | 已统一为行口径；E08 断 `exemptedLines = L` |
| 冲突 3（已闭合） | §7 `:129` 与 §5 `:116` | 首行 `N`（扫到 `.md` 数）与基线（命中行数）易混 | 常量 12 分开说明；E01 只断首行四字段形状，不提 `N = 基线` |
| **冲突 4（未闭合，2026-11-01）** | **§5 `:116` / §1 `:13` / D8 `:189` / Q4 `:217` / Q14 `:227`** | 这 5 处仍写「**10 词 / 77 行**」：§5 初始基线「10 词口径的 77 行」、§1 范围「77 行基线」、D8「77 行基线首日落豁免」、Q4「77 行里…」、Q14 对账式「`M + P + L = 77`」；与 §9.3 `:173` / §9.2 `:162` / D18 `:199` / Q22～Q24 的 **9 词 / 21 行**直接冲突 | 本文件一律按 **9 词 / 21 行**（常量 1 / 8 / 14，A01，E08～E12，F08）；**请 ② 段同批回改上述 5 处**（R8 回扫面：PRD 基线表述 + spec 自身）；`Q4` 的「77 行」可在改口径时一并改 21，结论（不改名、入豁免）不变 |
| **冲突 5（未闭合，2026-11-01）** | §5 `:102` 示例（`contains: "### 自省必须给长期方案"`）vs §4 `:71` / D27 `:201` | 示例豁免锚在**标题行**；而 D27 规定标题行不产出 hit → 该条豁免永远不计 `exemptedLines`（`contains` 在文件里存在、E-2 不 stale），形成「**空转豁免**」——与 §9.3「已合格档防空转豁免」相反 | 本文件 D01～D13 一律改用**正文行**锚点（`本节结论必须自省后落笔（术语引用）。`），并在 D01 的 reason 写「术语引用 + 出处」；**建议 ② 段把 §5 `:102` 示例锚点改成正文行**（例：`本节结论必须自省后落笔。（术语引用）`），否则 ③ 段照抄示例会得到一条空转豁免 |
