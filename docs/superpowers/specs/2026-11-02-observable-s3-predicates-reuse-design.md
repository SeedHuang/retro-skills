# 可观察判据与复用 · S3（判据与复用）设计

> 状态：**待议会 #2 第 2 轮复核（未签字）**｜创建 2026-11-02｜上游 PRD：`docs/prd/20261031202331-observable-criteria-rollout/index.md`（① 段已签 2026-10-31，签字件 SHA `40D63E3E…CE789`）
> 测试用例文件：`docs/superpowers/specs/2026-11-02-observable-s3-predicates-reuse-design-testcase.md`（独立 `senior-sdet` 编写；本文件不内联用例）
> 本块 = PRD §8 的 **S3**：F-07（8 条 label 改写）+ F-08（`validatePredicates` / substring）+ **F-02 后半**（清单扩到卡面与判据表）+ F-09（两 inspector 四处检查点）+ F-10（三写作流程引用，仓内两处）。承接 S1 / S2 终态，**不重开** S2 的 D1–D22。
> **第 1 轮议会修订**（22 张卡 → 12 族，全部承认）：C-4 判法改标记正则（F1）、8 条 observable 重写落到真实载体（F2）、label 恢复核心语义（F3）、⑨ 改判验证节标记（F4）、施工顺序重排 + 回退面（F5）、计数口径清单式枚举（F6）、R8 重取数（F7）、补 D-12/D-13（F8）；testcase 由 sdet 同批修订（F9）。台账见 `.session/reviews/2026-11-02-101312-observable-s3-spec/problems.md`。

## 1 范围

| 做（本块交付物，逐件带归属 F） | 不做（已签块 / 明确排除） |
|---|---|
| `tools/docgen/card-model/vocab/predicates.mjs` 8 条改写（F-07） | S1 已签件零改动：`observable-terms.json` / 豁免清单 / `check-observable.mjs` 的**判定实现与扫描根**（本块只 import 它的 `evaluateText` 作对照，不新增导出） |
| `tools/docgen/card-model/validatePredicates.mjs`（新建，F-08） | S2 已签件零改动：`card-contract` / `object-names` / `cardFaceIds` / `expectedBullet` / 15 卡形态（只做「同批重生成」这一派生动作） |
| `vocab/subjective-terms.mjs` 加 substring 判定单实现 + `validateCardModel.mjs` 改用它（F-08 / F-02 后半） | `SCAN_FIELDS`（8 键）与 `CARD_MODEL_CODES`（36 码）——**不动**（PRD §7 D-06）；`card-model/index.mjs` barrel 18 项不动 |
| `tools/docgen/cli.mjs` 的 `gateChecks()` 接线 `validatePredicates`（F-08） | `tools/docgen/policy/**`（S6 已签，零改动） |
| 15 卡同批重生成（F-07 派生；**不做 `baseline --write`**，D-15） | `check-observable` 新增扫描根（**不加** `agents/` 与 `docs/`，D-2） |
| `skills/rule-inspector` 的 `references/criteria.md` / `references/recipes.md` / `scripts/score.mjs` + `rules/skill-authoring-convention.md` 四处新增检查点（F-09） | 死路径串 / 档位枚举（C-3 归 S6） |
| `tools/execution-matrix/buckets.mjs` 登记 ⑨（归桶单源，F-09） | 全局 `skill-creator`（不进 git；缺口落 `docs/after/`，D-9） |
| `skills/rule-writer/SKILL.md` + `skills/dev-workflow/SKILL.md` 引用同一规则（F-10，仓内两处） | 存量 spec / testcase 追溯（S1、S2 已签，零改） |
| 新测试文件 `tools/docgen/test/s3-predicates.test.mjs` + 派生测试数字更新（§5 / §9） | 存量已签 spec 正文（历史保留） |

**依赖**：S1（清单 JSON + `evaluateText`）、S2（15 卡与渲染器）。**下游**：无。

## 2 术语

| 术语 | 定义 |
|---|---|
| label | `PREDICATES[<id>].label`，**判据句**（不是短名）：`核心语义——可判句` 两段，中间用破折号。`renderCard.mjs:34` 的 `criterionName` 直接取它渲染进 15 卡（`must` 前缀「要求」、`never` 前缀「不得」，见 `renderCard.mjs:50` / `:59`）。**第 1 轮修订**：原定义「中文名」与草案的整句形态冲突（AI Q5），现按「判据句」定死 |
| observable | 该判据在运行时**能逐条二值判**的断言数组（`length ≥ 1`）；每个元素必须**命中 ≥1 可观察标记**（C-4），且必须落在卡面 / 产物**已声明的字段**上（C-7 的落地侧） |
| negativeSample | 一个**具体**的不合格样例（非空） |
| residual | `{ who, sample }`：机器判不死的残余由谁抽样、抽几条；`who` 写成「角色（抽什么）」 |
| 可观察标记 | `tools/quality/observable-terms.json` 的 `markers[].pattern`（8 类）。本块只在**判据表面**直接跑这 8 条正则，不复制词面 |
| substring 判定 | 文本是否**包含**任一词面。`立场客观且按项目长远判断` 在 token 全等口径下不命中，在 substring 下命中「客观」 |
| 验证节 | 标题**恰为** `## 验证` 或 `### 验证`（正则 `^#{2,3}\s*验证$`）的小节；多处匹配取**第一个**；无该节 = 0 分（与 §5 ① 同一口径，第 3 轮 AI 指出 §2 旧写法 `/验证/` 会多算 2 份） |
| 依据条 | `evidence` 产物的一行（「原文摘句 / 文件 + 行号 / 用途」三列）；「依据条 计数」= 该产物的行数 |
| 英文术语 | 正文里连续 ≥3 个 ASCII 字母 / 下划线的串（正则 `[A-Za-z_]{3,}`）；「未解释」= 首现行无 ≥1 个汉字 |
| 判据级口径 | 会被跨文档引用、改一次要回扫的一类说法。本块触发三类：8 条 label（命名）、检查点数（计数口径）、V-9 / V-10 的验收口径 |

## 3 F-07：8 条 label 改写（`vocab/predicates.mjs`）

**目标形状**（四字段必填，`impl` 保留）：

```js
{
  label: '核心语义——可判句',                 // 不含主观词（substring 判）；核心语义不许被可判句替换
  impl: 'manual',                            // 8 条全 manual
  observable: ['……'],                       // ≥1；每个元素命中 ≥1 marker
  negativeSample: '……',                     // 非空；必须能被判红
  residual: { who: '角色（抽什么）', sample: 3 },
}
```

**8 条改写（`kind` = 该 id 在 `shared-actions.mjs` 的极性；`never` 渲染成「不得〈label〉」，故 label 必须是违规形态）**：

| id | kind | 旧 label | 新 label（核心语义 + 可判句） | 载体（已声明字段 / 命令输出） | observable | negativeSample | residual |
|---|---|---|---|---|---|---|---|
| `impartial-long-term` | must | 立场客观且按项目长远判断 | 立场不偏、按项目长期判断——结论段依据条 `计数 ≥ 2`，且各带 `path:line`、来自 ≥2 个不同文件 | `evidence` 产物「原文摘句 / 文件 + 行号」两列 | ① 依据条 计数 ≥ 2 ② 不同文件数 ≥ 2（各依据带 `path:line`） | 结论只写「综合判断可行」，依据 0 条 | reviewer-qa（抽 3 条结论核「是否只堆本席视角」） / 3 |
| `evidence-recomputable` | must | 结论附可复算证据（文件:行号 或 命令输出） | 结论附可复算证据——`path:line` 指向的文件存在，且该行含被引摘句；缺一 = 不合规 | `evidence` 产物「文件 + 行号」列 + 源文件该行 | ① 每条结论行含 `path:line` ② `path:line` 指向文件存在且该行含被引摘句 | 结论写「已核实」但无 `path:line` 与命令输出 | reviewer-audit（抽 3 条结论复跑 `path:line`） / 3 |
| `plain-expression` | must | 用非专业人员也能听懂的方式表达 | 非专业读者能听懂——英文术语首现行含中文解释，未解释术语 计数 = 0 | 交付物正文（任意 `outputKind`） | ① 英文 token（`[A-Za-z_]{3,}`）首现行含 ≥1 个汉字 ② 未解释英文 token 计数 = 0 | 正文直接写 `runtime` / `schema` 而无中文解释 | reviewer-reader（抽 3 段正文核读者可读性） / 3 |
| `no-fake-problem` | must | 无问题时显式声明「全过、无问题」 | 无问题时显式写「全过、无问题」——findings 集合为空时该行必须存在 | `audit` 产物「结论」列 + findings 集合 | ① `findings` 集合为空时正文含「全过」行 ② `findings` 非空时不得只写「全过」 | 没发现问题却只写「未发现问题」或干脆不写 | reviewer-audit（抽 3 轮收尾核「全过」行） / 3 |
| `issue-without-solution` | never | 只提问题不给解法 | 只提问题不给解法——问题卡「建议解法」栏为空 | `issue-card` 产物「建议解法」栏 | ① 问题卡「建议解法」栏非空 ② 问题卡三字段（证据 / 严重级别 / 建议解法）各非空 | 问题卡只有问题描述，「建议解法」栏空 | reviewer-qa（抽 3 张问题卡核解法可执行） / 3 |
| `out-of-scope-self-disposal` | never | 越出职责自行处置 | 越出职责自行处置——越界处置动作 计数 ≥1 且正文无「声明」行 | `git status --porcelain` 路径集 + 交付物正文 | ① 越界处置动作 计数 = 0 ② 越界时正文含「声明」行且带 `path:line`（「越界」集合不可机器枚举，判定由 residual 承担） | 发现越界后自行改文件，未声明 | reviewer-audit（抽 3 席：按卡面「边界」段逐条核交付路径是否越界） / 3 |
| `blank-evidence` | never | 证据栏留空 | 证据栏留空——结论行证据栏无 `path:line` 与命令首行 | `audit` / `issue-card` 的「证据」栏 | ① 结论行证据栏非空 ② 证据栏含 `path:line` 或命令首行原文 | 证据栏留空并写「待补」 | reviewer-audit（抽 3 条结论核证据栏） / 3 |
| `proxy-fill` | never | 代他人填写其本人应填的表 | 代他人填写其本人应填的表——签名字段所记名称 != 该实例名 | `skills/dev-workflow/references/gate-record.md` 的「申报人 / 签字人」两列 | ① 签名字段所记名称 == 该实例名 ② 不符行 计数 = 0 | 代他人填评审结论并签其名 | reviewer-audit（抽 3 个签名字段核落笔方） / 3 |

**结构约束**：

| # | 约束 | 判法 |
|---|---|---|
| C-1 | 8 个 id 与顺序不变、`impl` 全 `'manual'`、键集恰 8 | 键集合比对 |
| C-2 | 每条四字段齐；`observable` 为数组且非空、元素非空字符串；`negativeSample` 非空；`residual.who` 非空；`residual.sample` 为正整数 | `validatePredicates`（D2/D3/D4） |
| C-3 | 8 条 `label` 均**不含** `terms` 任一词（substring）。`observable[]` 不在主观词扫描面（PRD §3.5 只扫 `label` / `criterion`） | `subjectiveHit` 只喂 label |
| C-4 | **每个 `observable` 元素命中 ≥1 条 `markers[].pattern` 正则**（直接跑正则，**不用 `evaluateText` 的 verdict**——它只在含主观词时 fail，对无词文本恒 pass，第 1 轮 P0） | `markers.some((m) => new RegExp(m.pattern).test(item))`；同一判在 D5 下沉到 `gate` |
| C-5 | `never` 类 4 条 label 必须是「违规形态」：渲染后「不得〈label〉（针对〈宾语中文名〉）；出现即违反」通顺；逐字样例由 `renderCard` 实渲出具，不手抄 | 实渲 + 人工回读 |
| C-6 | 改后 15 卡必须与 `renderCard` 逐字节相等（15 席 `state=replaced`，前提见 §4） | `gate` exit 0；反证 = `Mismatch agents/<席>.md` |
| C-7 | **语义保真 + 载体在位**：每条新 label 的核心语义词（不偏 / 可复算 / 听懂 / 全过、无问题 / 只提问题不给解法 / 越出职责自行处置 / 证据栏留空 / 代他人填写）保留，可判句只许**追加**不许替换；`observable` 必须落到 §3 表「载体」列指名的**已声明**载体（`outputFormats.mjs:5-61` 字段 / `gate-record.md` 列 / 仓内命令输出），**要求卡面新增字段 = 不合格**（新增字段属 S2 已签件） | 人工回读 + testcase 固定样例；「载体」列为空或指向不存在字段 = 不合格 |
| C-8 | 8 条 label 的**破折号后段**各含 ≥1 可观察标记（与 C-4 同一判法）——label 印在卡面上，必须有可判锚点 | `markers.some((m) => new RegExp(m.pattern).test(label.split('——')[1] ?? ''))` |

## 4 F-08：判定实现（`validatePredicates` + substring 单实现点）

**新文件** `tools/docgen/card-model/validatePredicates.mjs`：

- 纯函数 `validatePredicates(predicates)` → `{ ok, errors: [{ code, path, message }] }`；**函数体内零 IO、零环境依赖**（模块加载时读 `observable-terms.json` 与 `validateCardModel` 同形，属 S1 既有形态）；不改入参。
- `path` 形态定死（**无 `predicates[<id>]` 前缀前缀写在报文里**）：`label` / `observable[<i>]` / `negativeSample` / `residual.who` / `residual.sample`；报文行由 `gate` 拼成 `predicates[<id>].<path>：<message>`。
- **0 新码**：不进 `CARD_MODEL_CODES`、不改 `SCAN_FIELDS`；`code` 只复用既有 36 码中的两个：`SubjectiveLabel`（D1）、`UnverifiableOutput`（D2–D5）——两者都在 `exitCodeFor` 的 exit 1 集合（`validateAgentData.mjs:34-36`）。

**五条判定**：

| # | 判定 | 报文 `path` | 复用码 |
|---|---|---|---|
| D1 | `label` 命中 `terms`（substring）→ 红；`observable` 写满**不豁免** label | `label` | `SubjectiveLabel` |
| D2 | `observable` 非数组、长度为 0、含空串或非字符串 → 红 | `observable[<i>]` / `observable` | `UnverifiableOutput` |
| D3 | `negativeSample` 缺 / 空 → 红 | `negativeSample` | `UnverifiableOutput` |
| D4 | `residual` 缺、`who` 空、`sample` 非正整数 → 红 | `residual.who` / `residual.sample` | `UnverifiableOutput` |
| D5 | `observable[<i>]` **未命中任何 `markers[].pattern`** → 红（C-4 的运行时下沉，防「填 `['ok']` 过关」） | `observable[<i>]` | `UnverifiableOutput` |

**substring 单实现点**：

- `vocab/subjective-terms.mjs` 追加 `export const subjectiveHit = (text) => subjectiveTerms.some((t) => typeof text === 'string' && text.includes(t))`。
- `validateCardModel.mjs` 删本地 `tokensOf` / `subjectiveHit`（`:76-78`），改 import 同一个；三处 `SubjectiveLabel` 发射点（`:351` / `:391` / `:405`）**判定面扩大**（substring ⊇ token，只增不减），不写「判定面不变」。
- 词表来源仍是 `observable-terms.json`，**无第二份词面**。

**卡面可行性（实测，第 3 轮更正口径）**：按 `SCAN_FIELDS` 的扫描三面（`duty.categories[]` + `checkItems[].label` + `checkItems[].criterion`）= **291 条**；再加超集面 `duty.trigger` / `action` / `constraint` = **45 条**，合计 **336 条文本 / substring 0 / token 0**（命令见 §9.3②；数据在 `agentData` 的 `card` 键下，第 2 轮发现原命令扫空 → 假绿）。故扩面不会把 S2 已签卡面判红；③ 段仍须贴「15 席 `validateCardModel` errors 0」输出。

**接线**：

- `tools/docgen/cli.mjs` 的 `gateChecks()` 在「运行时唯一防线」之前调 `validatePredicates(PREDICATES)`：有错先逐条 `console.error`（`predicates[<id>].<字段>：<message>`），再 `fail(首条.code, { path, message })` → `exitCodeFor` 得 exit 1；**不进** `Mismatch` 分支。`stderr` 只保证首行 `码: predicates[…]…`（`tools/docgen/cli.mjs:694-696`）。
- `card-model/index.mjs` **不加导出**（barrel 18 项为自觉约束，无既有断言兜——第 1 轮 Q4 更正）。
- 前提事实（实查）：`state.json` 15 席全 `replaced`（`check-all` ②.6 段实跑列出 15 席），C-6 对全部 15 席成立。

## 5 F-09：两 inspector 四处新增检查点（只加不删）

| # | 落点 | 新增内容 | 怎么判 |
|---|---|---|---|
| ① | `skills/rule-inspector/references/criteria.md` §2.4「执行力度」表 | 追加 **⑨ 判据可观察**：判定 = **验证节**内 ≥1 行命中 `markers[].pattern`。**验证节的口径写死**：标题**恰为** `## 验证` 或 `### 验证`（正则 `^#{2,3}\s*验证$`）的小节；无该节 = 0 分；多处匹配取**第一个**（第 2 轮 AI 实测曾出现 6/23 与 4/23 两个 N，根因即节定位未定死，D-17） | 有/无 1 分 |
| ② | `skills/rule-inspector/references/recipes.md` | 追加 **§R9 判据不可观察**：三条改法（改比较式 / 加 `path:line` 或退出码 / 进豁免并写术语出处） | 处方可复制 |
| ③ | `skills/rule-inspector/scripts/score.mjs` | 新增 `g('执行力度', '⑨判据可观察', …)`：import `evaluateText` **仅作对照**，判定本体 = 用 `observable-terms.json` 的 `markers` 正则扫**验证节**；**不读豁免清单**（不建第二套豁免判定） | 有/无 1 分 |
| ④ | `rules/skill-authoring-convention.md` | 追加 **判据⑤：写 skill 时判据句必须可观察**（验证 = `node scripts/check-observable.mjs --check` exit 0）；`skill-inspector` 的判据权威 = 该规则，经此继承 | 命令退出码 |

**⑨ 为什么不是 ⑦ 的复读**（第 1 轮 F4）：第 1 轮草案用 `evaluateText` 判 → 与 ⑦ 同构，23 份规则里 22 份恒 pass、1 份靠豁免 ⇒ 23/23 恒得 1 分（实测）。现改判**验证节内的标记覆盖**：① 与 ⑦ 的判定面不同（⑦ 看含主观词的行，⑨ 看验证节）；② 不进口豁免清单（无第二实现点）；③ 对今天的库存**不是恒 1**——③ 段须贴实测「23 份规则里 ⑨ 得分 N/23」，若发现恒 1 立即按 D-14 回 ② 重议。

**④ 为什么不改 `skills/skill-inspector/**`**：PRD 行 121 把四处落点写死；`skill-inspector` 的判据权威本来就是该规则（其 `SKILL.md:14`），加判据⑤即完成接线，机判由全局 ⑦ 兜。

**计数口径变更（判据级，进 R8）**——**清单式枚举，缺一即漏**：

| 落点 | 现值 → 新值 |
|---|---|
| `criteria.md:1` | 「24 检查点」→ **25** |
| `criteria.md` §2.4 计分式（`:81`） | 「执行力度 8」→ **9**；「现有 24 项」→ **25**；「20/24」→ **20/25** |
| `criteria.md` §2.4 脚注（`:81` 组满分句） | 「禁令类 8 项 / 非禁令类省略 3 = 5 项」「组满分 5/5」→ **9 / 6** |
| `skills/rule-writer/references/writing-guide.md:1` / `:19` / `:34` | 「执行力度 8 项」→ **9**；`:34` 的组满分「5/5」→ **6/6** |
| `skills/rule-writer/assets/rule-skeleton.md:29` | 组满分「5/5」→ **6/6** |
| `criteria.md` §3.4 适用项表六行 | `6 / 3 / 8 / 5 / 14 / 11` → `7 / 4 / 9 / 6 / 15 / 12` |
| `criteria.md` §3.5 满分表六行（`:174-184`） | `23 / 20 / 25 / 22 / 31 / 28` → `24 / 21 / 26 / 23 / 32 / 29` |
| `criteria.md` §3 导语（`:85`） | 「原 §2.4 的 24 检查点单一口径」→ **25** |
| `skills/rule-inspector/SKILL.md:35` | 「24 检查点」→ **25** |
| `skills/rule-writer/SKILL.md:3` / `:29` / `:36` | 「执行力度 8 项」→ **9** |
| `skills/rule-inspector/assets/rule-edit-checklist-template.md:75` | E2-5 的「8 项」→ **9** |
| **归桶登记（第 3 轮更正：三处键名 + 一处 `BUCKETS`）** | ① `tools/execution-matrix/buckets.mjs:8` 的 `BUCKETS` → `rule 独有.items` 加 `执行力度⑨`；`skill 独有.items` 加 `判据可观察⑤` ② `check-buckets.mjs:35-44` 的 `RULE_MARKER_ITEM` 加 `'⑨': ['执行力度⑨','rule 独有']` ③ `check-buckets.mjs:46-51` 的 `SKILL_MARKER_ITEM` 加 `'⑤': ['判据可观察⑤','skill 独有']` ④ `check-buckets.mjs:32` 注释改「①-⑨」。**⑨ / ⑤ 登记为各自独有 → 不进 `shared-items.mjs:23` 的 `SHARED_MARKERS`，故不触发 R7 共享项硬闸门**；若议会裁定为共享，则须同批进 `SHARED_MARKERS` 并走 R7（改前 vs 改后 + 用户确认） |
| `score.test.mjs` 全部满分 / 组 max 断言 | 逐条 `+1`（**只改数字、不放宽断言**） |

**`rule-inspector` 硬闸门 7 的 6 项同步义务**：

| 同步项 | 本批处置 |
|---|---|
| ① `score.mjs` 常量 ↔ `criteria.md` | 同批改（⑨ + 计数 25） |
| ② `criteria.md` 检查点 ↔ `recipes.md` 处方 | 同批改（新增 §R9） |
| ③ 判据 ↔ `rule-writer` 三层 | 同批改：`SKILL.md` 自查第 3 步 + `references/writing-guide.md` 自查表 + `assets/rule-skeleton.md`（F-10 同批） |
| ④ 检查项 ↔ review 账本模板 | 同批改：`skills/review-log/assets/review-progress-template.md` 增 1 行「改规则正文 → 判据可观察」；议会模板**不适用**（其查账表无规则编辑行） |
| ⑤ 删检查项反向扫 | 本批 0 删除，声明即核销 |
| ⑥ `assets/rule-edit-checklist-template.md` | 同批改：E2 段增 1 行 + 该段计数 9 |

## 6 F-10：三写作流程引用（仓内两处 + 全局缺口在册）

### 6.1 仓内两处（只引用，不复制判据）

| 落点 | 新增内容 |
|---|---|
| `skills/rule-writer/SKILL.md` | 自查第 3 步加「判据可观察」：跑 `node scripts/check-observable.mjs --check`，末行 `check-observable ok` 且 exit 0 才算过；判据全文只指 `observable-criteria` 规则 |
| `skills/dev-workflow/SKILL.md` | 「指针」节加一行：判据类文本的可观察判据以 `observable-criteria` 规则为准，机判 = `npm run check:observable`；**不改段表**（段表是 PRD §4 逐字副本） |

### 6.2 全局缺口在册

`skill-creator` 实际载体是 `C:\Users\HuangChunhua\.trae-cn\skills\skill-creator\SKILL.md`（不在本仓、不进 git、无审计签字）。处置：新建 `docs/after/<创建时刻>-skill-creator-observable-reference-open-decisions.md`，四要素写清（现状 / 该做 / 触发 / 谁兜）。本块验收**不要求**该全局文件被改。

## 7 门禁接入与施工顺序

- **⑦ 段不动**：扫描根仍 `rules/` + `skills/`，判定实现不变。
- **新入口**：`validatePredicates` 由 `gate` 调用（`check` 的 ②.5 段会跑到）；不新增门禁段、不新增脚本（D-7）。
- **施工顺序（重排；第 1 轮 F5）**：

| 步 | 动作 | 该步之后的预期状态 |
|---|---|---|
| S1 | 改 8 条 label + 三新字段（`predicates.mjs`） | `gate` 必红：`replaced` 席逐字节比对（`tools/docgen/cli.mjs:140-142`）报 `Mismatch agents/<席>.md`；**只报首条（单行）**，不是 15 条独立输出——第 3 轮 AU 实跑更正（`tools/docgen/cli.mjs:694-696` 只 `stderr.write` 一行）——**这是预期红，不是故障** |
| S1a | 同批改旧 label 的**测试与引用件**：`tools/docgen/test/pilot-render.test.mjs:73`、`tools/docgen/test/evidence-reader.test.mjs:90`/`:214`（改从 `PREDICATES[id].label` 派生）、`tools/execution-matrix/criteria.md:16`、`skills/parliament/assets/agent-template.md` / `escalation-report.md` / `references/debate-protocol.md`（改引用） | 两个测试文件 fail 0（旧字面断言已派生化） |
| S1b | 15 卡 `draft` → 确认 → `replace --yes` 重生成 | `gate` 转绿（15 席 disk == render） |
| S2 | `validatePredicates` + D5 + substring 单实现 + 新测试文件 | `node --test tools/docgen/test/s3-predicates.test.mjs` fail 0 |
| S3 | `gateChecks()` 接线 | 人为写坏一条 label → `gate` exit 1 且首行 `SubjectiveLabel: predicates[…]…` |
| S4 | `npm run check`（**施工/门禁用例，不由 testcase 重跑**——testcase 常量 9 禁测试内跑全量） | 末行 `check 全部通过` |
| S5 | F-09 四处 + 同步 6 项 + `buckets.mjs` 三登记面 + R7 硬闸门 | `node --test skills/rule-inspector/scripts/score.test.mjs` fail 0；`npm run check` 仍绿 |
| S6 | F-10 两处 + `docs/after/` 缺口 | `check:observable` 仍 exit 0（新增文本自身可观察） |
| S7 | 全量门禁 + `sweep` + `doc-name` | 三条命令 exit 0 |

**⑨ 与既有 fixture 的关系（第 2 轮 BE-2-02）**：`score.test.mjs` 的 8 份 fixture 若没有 `## 验证` 节或节内无 marker → ⑨ 恒 0。处置 = **给 fixture 补一行带 marker 的验证句**（或按新口径重写该 fixture 的期望值到「旧值 + 0」并写明理由）；**不许**为了让旧期望值继续绿而放宽 ⑨。

- **必红期声明**：S1 → S1b 期间 `npm run check` 必红（`gate` 报 `Mismatch`，**只报首条单行**）。**禁止**在此期间 cherry-pick 提交、禁止跳测试、禁止为凑绿改 `SCAN_FIELDS` / 扩豁免清单 / 改断言（改断言只许「派生化」）。
- **回退面（第 1 轮 F12）**：`git checkout <S3-BASE> -- tools/docgen/card-model/vocab/predicates.mjs agents/` 即回到 S2 终态；`draft` 不落盘（`cli.mjs` 的 `cmdDraft` 只写草稿目录），失败可重跑；`baseline.json` 本块不改（D-15），无需回滚。
- **不做 `baseline --write`**：`renderBaseline()` 只由「rules 清单 + 15 席路径」组成（`components/baseline.mjs:30-32`），不含 label；实跑 `baseline.json == renderBaseline()` 为真 ⇒ `--write` 是空转，`baseline 38/38` 是常量打印（`tools/docgen/cli.mjs:212`），**不作判据**（D-15）。

## 8 与既有件的关系（R8 回扫）

**触发三条判据级口径**：① 8 条 label（命名）；② 检查点数 `24→25` / 执行力度 max `8→9`·`5→6`（计数口径）；③ V-9 / V-10 的验收口径（D-12 / D-13）。

**前置**：`node scripts/scope-sweep.mjs --check` → exit 0（开工前实跑 `sweep ok`）。本批须在当次 `impact-sheet.md` 给每个命中处处置。

**取数（第 4 轮 AU 复算）**：8 条**完整**旧 label 命中 = **35 文件 / 175 行**（排除 `.session/`、`.superpowers/` 与本批两件）；含本批两件（spec 13 行 + testcase 9 行）= **37 文件 / 197 行**；含过程账 = **62 文件 / 442 处**。逐面相加 = `8 + 135 + 1 + 3 + 3 + 1 + 2 + 22` = **175**。

| 命中面 | 行数 | 处置 |
|---|---|---|
| `tools/docgen/card-model/vocab/predicates.mjs` | 8 | 改（label 源） |
| `agents/*.md` 15 卡 | 135（15×9） | 改（①b 同批重生成，**不手改**） |
| `tools/docgen/test/pilot-render.test.mjs` | 1 行（含 4 条旧 label） | 改（改从 `PREDICATES[id].label` 派生） |
| `tools/docgen/test/evidence-reader.test.mjs` | 3 行（**前缀子串** `无问题时显式声明`，完整 label 扫为 0） | 改（同上派生化）——**第 1 轮新增行**：AU 按完整字面扫为 0，但该文件的断言用的是前缀子串，改 label 后必红 |
| `skills/parliament/references/debate-protocol.md` / `assets/agent-template.md` / `assets/escalation-report.md` | 3（各 1） | 改引用（指向 `predicates` 登记表），不复制新文案 |
| `tools/execution-matrix/criteria.md` | 1 | 改（判据正文里的旧 label 引用） |
| `docs/prd/20261031202331-observable-criteria-rollout/index.md` | 2 | 标历史保留（已签件，加日期注、原文不改） |
| `docs/superpowers/specs|plans`、`docs/reports`、`docs/after`（12 文件） | 22 | 标历史保留（已签 / 一次性产出，不改） |
| `.session/**`、`.superpowers/**`（过程账） | 未计入 175（含则 62/442） | **不改**：gitignore 过程账，改它等于改写运行记录（与 docs-convention 硬约束 4「运行产物不改」同一判据） |
| 本批两件（spec + testcase） | 13 + 9 | 自身引用；`testcase` 的旧 label 派生源改由 `git show <S3-BASE>` 取，不依赖本批新建的 `I25` |

**其他判据级口径处置**：`skills/rule-inspector/references/criteria.md` 的 `24` / `8` / `6` / 各类满分（见 §5 清单）→ 改；`keywords.json` → 补登记 `I22`（D20 旧说法）/ `I23`（D21）/ `I24`（D22）/ `I25`（8 条旧 label 合集），并用 `--freeze` 记**改前值**（handoff「遗留裁决」的收敛时点 = 本批）。

## 9 验收

### 9.1 指向测试用例

- 用例文件：`docs/superpowers/specs/2026-11-02-observable-s3-predicates-reuse-design-testcase.md`（本文件不内联）。
- 覆盖要求：C-1～C-8 / §4 D1～D5 / §5 四处 + 计数清单 + 同步 6 项 / §6 两处 / §7 的 S1–S7（含 S1a / S1b）+ 回退面 / §8 回扫 / §9.2 V-8～V-10，每条至少 1 正 + 1 反；**负例与边界条数 ≥ 正例**。
- 预算：testcase ≤ 80 条（`check-plan.mjs size` 上限）；超限则拆两份 spec（回 ② 重议）。
- **全量门禁不重跑**：§7 的 S4 / S7（`npm run check`）是施工与门禁动作，由 `check-all` 自跑；testcase 只断单命令（常量 9），覆盖表的「未覆盖 0 项」只对 **spec 约束**负责，不代表用例跑过全量门禁。

### 9.2 产品级（对应 PRD §9.2）

| # | 验收项 | 可核方式 |
|---|---|---|
| V-8 | 判据可观察 | 8 条逐条断言 `observable.length ≥ 1` + `negativeSample` 非空 + `residual.who` 非空；**红探针**：把 `impartial-long-term` 的 label 复原为「立场客观且按项目长远判断」→ `validatePredicates` 必红（substring 命中「客观」）；**反向探针**：把任一 `observable` 元素改成 `['ok']` → D5 必红（无 marker） |
| V-9 | 复用不复制 | 静态扫：`validateCardModel` / `validatePredicates` 只 import 同一 `subjectiveHit` 与同一 JSON；`score.mjs` **新增的 ⑨ 代码块内**不出现 `terms` / `criterionTerms` 的任何词面（既有常量如 `LOOSE_RE` 的「宽松」属体检词表，不判红）——**收窄理由见 D-12**；副本 0 |
| V-10 | 全量门禁 | `npm run check` 末行 `check 全部通过`（exit 0）+ `node scripts/scope-sweep.mjs --check` → `sweep ok` + `gate` 逐席 disk == render（反证 = `Mismatch`）。**审计抽核**：PRD 原文要求「`gate` baseline 重记有审计抽核记录」，本块不做 `baseline --write`（D-15），其等价抽核 = ④ 段 sdet 抽 2 席「改一字节必红 / 还原转绿」，归属见 D-13 |

### 9.3 取数命令（可整段粘贴，第 1 轮 F11）

```powershell
# ① 8 条完整旧 label 的命中面（排除过程账与本批两件）
$pat = '立场客观且按项目长远判断|结论附可复算证据|用非专业人员也能听懂的方式表达|无问题时显式声明|只提问题不给解法|越出职责自行处置|证据栏留空|代他人填写其本人应填的表'
$hit = Get-ChildItem -Recurse -File -Include *.md,*.mjs | Where-Object { $_.FullName -notmatch '\\node_modules\\|\\.session\\|\\.superpowers\\|2026-11-02-observable-s3' } | Select-String -Pattern $pat
"files=$((($hit | Select-Object Path -Unique).Count)) occ=$((($hit | Measure-Object).Count))"
$hit | Group-Object { $_.Path.Replace((Get-Location).Path + '\','') } | Sort-Object Count -Descending | Format-Table Count, Name

# ② 卡面 substring / token 双口径（15 席扫描三面；数据在 card 键下，别扫到空集）
node --input-type=module -e "import {agentData} from './tools/docgen/components/agentData.mjs'; import {subjectiveTerms} from './tools/docgen/card-model/vocab/subjective-terms.mjs'; const hits=[]; let n=0,s=0,t=0; const scan=(p,x)=>{if(typeof x!=='string'||!x)return;n++; if(subjectiveTerms.some(w=>x.includes(w))){s++;hits.push(p)} if(x.split(/[、，,/\s]+/).some(y=>subjectiveTerms.includes(y)))t++}; for(const it of agentData){const d=(it.card&&it.card.duty)||{}; (d.categories||[]).forEach((x,i)=>scan(it.name+'.categories['+i+']',x)); const ci=(it.card&&it.card.checkItems)||[]; ci.forEach((c,i)=>{scan(it.name+'.checkItems['+i+'].label',c.label); scan(it.name+'.checkItems['+i+'].criterion',c.criterion)}); [d.trigger,d.action,d.constraint].forEach((x,i)=>scan(it.name+'.extra['+i+']',x))} console.log('texts',n,'substringHits',s,'tokenHits',t, hits.join(' | '))"

# ③ C-4 判法判别力（8 条 observable 全过 / 'ok' 必红）
node --input-type=module -e "import {readFileSync} from 'node:fs'; const d=JSON.parse(readFileSync('tools/quality/observable-terms.json','utf8')); const mk=(s)=>d.markers.filter(m=>new RegExp(m.pattern).test(s)).map(m=>m.kind); for (const p of ['ok','写得好','依据条 计数 ≥ 2']) console.log(JSON.stringify({p,markerKinds:mk(p)}))"
```

## 10 差异清单（D，逐条带出处）

| # | 差异 / 取舍 | 出处 |
|---|---|---|
| D-1 | 8 条 label 由本 spec 出草案，条文措辞以 ② 段议会复签为准 | 用户 2026-11-02 裁定（单份 spec + 我出草案） |
| D-2 | 「F-02 后半」= 清单判定能力扩到卡面（`validateCardModel`，substring）与判据表（`validatePredicates`），**不新增 `check-observable` 扫描根** | PRD §3.6「同一判据只允许一个实现点」+ §8 的 ② 行字面 |
| D-3 | `subjectiveHit` 从「token 全等」改「substring」，在 `subjective-terms.mjs` 收敛为唯一实现；**判定面扩大**（substring ⊇ token），今日 0 命中不改变包含关系 | PRD §3.5 + §7 D-06（第 1 轮 F5 更正措辞） |
| D-4 | `card-model/index.mjs` barrel **不加导出**（18 项为自觉约束，无既有断言兜）；`gate` 直接按文件路径 import | 第 1 轮 Q4 实测（grep `恰 18` = 0 命中） |
| D-5 | 8 条 label 改后 15 卡**同批重生成**；**不做 `baseline --write`**（该文件不含 label，`--write` 空转） | 用户 2026-11-02 确认 + 第 1 轮 BE-1-05 |
| D-6 | F-09 ④ 只改 `rules/skill-authoring-convention.md`，不改 `skills/skill-inspector/**` | PRD 行 121 的四处落点写死 |
| D-7 | 判据表门禁挂在 `gate`（`check` ②.5 段跑到），不新增 ⑧ 段 | PRD §3.6 只把「每轮」放在 ⑦ 段 |
| D-8 | （**第 1 轮作废**）原「⑨ 对豁免清单直接放行」——实测导致 23/23 恒 1 分且构成第二实现点，改由 ⑨ 新判定取代 | 第 1 轮 AI-1-05 / AU O-1·O-2 |
| D-9 | F-10 第三处（`skill-creator`）改为「缺口在册」，不改全局文件 | 用户 2026-11-02 裁定 |
| D-10 | R8 口径登记补 `I22`–`I25` 并冻改前值 | handoff「遗留裁决」收敛时点 |
| D-11 | testcase 上限 80，超限则拆两份 spec | `check-plan.mjs size` 既有口径 |
| D-12 | **V-9 收窄**：`score.mjs` 的词面静态扫只判「新增 ⑨ 代码块内」；既有 `LOOSE_RE` 的「宽松」等属体检词表，不判红 | PRD §9.2 V-9 + 既有词面实测（`LOOSE_RE` 4 处） |
| D-13 | **V-10 的「审计抽核记录」归属**：本块无 `baseline --write`，等价抽核 = ④ 段 sdet 抽 2 席「改一字节必红 / 还原转绿」，记在 ④ 段门行「核了什么」列 | PRD §9.2 V-10 |
| D-14 | ⑨ 判定 = 验证节内 ≥1 行命中 markers（**不用** `evaluateText`）；对全库不恒 1，③ 段须贴 `N/23` 实测 | 第 1 轮 F4 |
| D-15 | 删 `baseline --write`；`baseline 38/38` 只是常量打印，不作判据 | 第 1 轮 BE-1-05 |
| D-16 | 8 条 observable 落 §3 表「载体」列的**已声明**载体（`outputFormats` 字段 / `gate-record.md` 列 / 仓内命令输出），**不新增字段**（新增字段 = 回 S2 已签件） | 第 1 轮 AI-1-02 + `outputFormats.mjs:5-61` |
| D-17 | ⑨ 的「验证节」口径写死为 `^#{2,3}\s*验证$`、多处取第一个——第 2 轮实测曾因节定位未定死出现 `6/23` 与 `4/23` 两个 N | 第 2 轮 AI-2-01 |
| D-18 | `never` 类 label 的可判句必须是**违规形态**（`out-of-scope` 的 `diff` 改为「非空」），不得把通过态写进「不得」句 | 第 2 轮 RD-2-01 / AI-2-02 |

## 11 未决（Q，逐条给裁定）

| # | 问题 | 裁定 |
|---|---|---|
| Q1 | S3 拆几份 spec | **一份**（用户 2026-11-02 裁定）；testcase > 80 条才按 D-11 回退 |
| Q2 | 8 条 label 文案归属 | 本 spec 出草案 → ② 段议会复签定稿（用户 2026-11-02 裁定） |
| Q3 | 15 卡是否同批重生成 | **必须**（`renderCard.mjs:34` 直取 label） |
| Q4 | `skill-creator` 落点 | 不改全局文件；缺口落 `docs/after/`（用户 2026-11-02 裁定） |
| Q5 | 判据表要不要新码 | 不要：`path` 定位 + 复用 `SubjectiveLabel` / `UnverifiableOutput`（0 新码） |
| Q6 | ⑨ 放通用还是执行力度 | 执行力度组（与 ⑧验证闭环 相邻）；通用 17 不变 |
| Q7 | 子串匹配会不会误伤 15 卡 | 实测 0 命中（§9.3 ②）；③ 段仍须贴 `errors 0` |
| Q8 | label 是短名还是判据句 | **判据句**（核心语义——可判句）；§2 术语已定死（第 1 轮 AI Q5） |
| Q9 | observable 判不着的内容怎么办 | 移入 `residual`（`who` 写成「角色（抽什么）」），**不许**留成 `计数 = 0` 的空壳 |
| Q10 | ⑨ 上线后全库分数会不会普遍下降 | 允许下降（体检分数是报告不是验收）；若 ⑨ 实测恒 1 或恒 0，按 D-14 回 ② 重议 |
