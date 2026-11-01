# 卡面重构 S2（可执行语句 + 中文名表 + 行序号对账 + 禁 id 守卫 + 单源注入）设计

> 状态：**议会 #2 已结项（2026-11-01，审计 r4 = PASS，P0 0 / P1 0）｜`②→③` 计划门已过（2026-11-01）｜③ 开工前增量 D17（A3 判据扩面）待独立审计复签**｜创建 2026-11-01｜修订 2026-11-01（第 1 轮 8 P0 后重写；第 2 轮审计复核后补 V-11 四条口径、Q6/Q7 裁定、落点 #12、§6.1 R8 回扫；结项后为过行号守卫把数字行号引用改为符号名，判据未变；**计划预备期增量修正 D14 接口正名**：`SCAN_FIELDS.PointerToElsewhere` / `env.registeredIds`；**③ 开工前增量 D17 / Q8**：执行力度矩阵 A3 判据扩面，连带落点 #13 / #14；**同批 D18**：A1 扫面收窄为卡面渲染链（排除 `*.test.mjs`），连带落点 #15 与 §4-A1 / §5 V-9 两处判法）
> 上游 PRD：`docs/prd/20261031202331-observable-criteria-rollout/index.md`（已定稿、① 已签）
> **测试用例文件**：`docs/superpowers/specs/2026-11-01-s2-card-rewrite-design-testcase.md`（独立 `senior-sdet` 实例编写；本文件**不内联用例**）
> 本块 = PRD §8 的 **S2**：F-03（卡面可执行语句 + `objects` / `repeats` 中文名表）、F-04（本席清单类型中文化 + 补三态行）、F-05（行序号对账替代 id 锚点）、F-06（卡面禁 id 守卫）。**上游依赖** = S1 已交付清单 JSON（已收口）。
> **不做**：`predicates` 改写与 `validatePredicates`（S3）；校验器扩到卡面（S3）；档位枚举 / 死路径串（C-3 归 S6）；`tools/docgen/policy/**`（S6 已签，零改动）。

## 1 范围

| 做 | 不做 |
|---|---|
| 新增 `card-model/vocab/card-contract.mjs`：`TYPE_LABELS`（键**派生自** `enums.mjs` 的 `CHECK_KINDS`，值中文）、`TRISTATE`（**新增**：由 `enums.mjs` 的 `VERDICTS` 的 3 值 + `reason` 派生）、`ALLOWED_PRODUCT_NAMES`（产物允许名：三态值与 `reason`/`evidence`/`verdict`）、`FORMAT_CHECKS`（三条判句） | 把上述四项**手写进 15 张卡**（会产生 60 份副本） |
| `agent-card.md.tpl` 的 `{{MUST_TABLE}}` / `{{NEVER_TABLE}}` 换 bullet 占位符；新增 `{{TRISTATE}}` / `{{PRODUCT_NAMES}}` / `{{FORMAT_CHECKS}}` | 在模板写死枚举字面（必须来自 `card-contract.mjs`） |
| `renderCard.mjs` 产出 `- <i>｜…`；新增 `expectedBullet(card, i)`（**唯一翻译点**） | 测试侧重写翻译规则（第二份真相） |
| 「本席清单」类型列中文化（`CHECK_KINDS` 键 → `TYPE_LABELS` 值）；「一定会」段末**新增**三态行（现 15 卡 0 命中：`Select-String '^\s*-\s*(hit\|miss\|na\|reason)$' agents\*.md` = 0） | 改三态语义（`VERDICTS` 是既有冻结枚举，本块不新增第四值） |
| `objects` / `repeats` 中文名表（数据层） | 卡面出现英文 id 或英文枚举 |
| `components/cardFaceIds.mjs` 新增 `cardFaceIds(card, env)`（落点见 §6-D19）：**扫面 = `renderCard(card, env)` 的渲染文本，逐行**（用户 2026-11-01 裁定，见 D16）；禁集合读 `env` 六个登记集合键（`registeredIds` / `predicates` / `landings` / `sharedScenes` / `seatScenes` / `seatSignals`，生产者 `registeredIdsOf(cards)` 等既有派生） | 手抄禁 id 词表（必须派生） |
| 执行力度矩阵 **A3**（必答清单存在）判据**扩面**：旧形态（表格列头）保留，新增「『一定会』节内 ≥1 行 `- <i>｜` bullet」形态（见 D17） | 删掉旧形态（PRD §2 明写「不降低判据强度：只加判据、不删」） |
| 15 卡 + `docs/agents/**` 重生成；`gate` baseline 重记（审计抽 3 席核） | 手改任何生成物 |
| **C-7**：`2026-10-29-agent-card-s4-render-design.md` 加「现行判据块 + 日期注」（原文一字不改） | 改 S4 spec 任何结论句 |
| **R8**：`docs/prd/20261026205821-agent-card-contract.md` 加日期注（实现唯一源 = `card-contract.mjs`，**落文末附录 C**，不动既有正文行号） | 改 PRD 任何判据字面 |

## 2 术语

| 术语 | 定义 |
|---|---|
| 可执行语句 | 一句话给全「何时 / 对什么 / 满足什么 / 写回哪里（可选：前提）」，判读者无需再问「怎么算满足」；示例必须可二值判 |
| 行序号锚点 | bullet 行首 `- <i>｜`，`i` = 该段**数据序**（从 1 起、连续）；对账用它，不用登记表 id |
| 登记 id | **六类登记表的键**（动作 `shared.*` / 场景 / 时刻 / repeat / 判据 / 落点）∪ `registeredIdsOf(...)` 的元素（**该函数只收 `checkItems[].id`**，即判据类），如 `shared.impartial-long-term`、`deliverable.body`、`review.progress`——**卡面禁出现**（渲染文本面，见 D16） |
| 卡面文本 | **卡面 = `renderCard(card, env)` 的渲染文本**（用户 2026-11-01 裁定，D16）；`enums.mjs` 的 `CARD_TEXT_FIELDS` 只是**数据面**字段清单（说明哪些数据会进渲染），**不作扫面**——数据里合法存着 `shared.*` / `deliverable.*`，扫数据必假红 |
| 产物允许名（许） | ① 真实路径（`文件:行号`）② 可跑命令与平台工具名（`Read` / `Glob` / `Grep`…）③ **产物字段名**：三态值 `hit` / `miss` / `na`、`reason`、`evidence`、`verdict` ④ 卡片七字段中文名。**优先级最高，先剔除再判** |
| 三态行 | 「一定会」段末**新增** 5 行：1 行中文解释 + `hit` / `miss` / `na` / `reason` 各一行；常量 `TRISTATE` 由 `enums.VERDICTS`（3 值）+ `reason` 派生 |
| 单源注入 | 契约文本只写一次（数据层常量），由模板占位符注入卡面；卡面是**渲染产物**，不是手写副本 |

## 3 落点表（改哪、怎么改）

| # | 落点 | 动作 | 责任 / 验收锚 | 归属 |
|---|---|---|---|---|
| 1 | `tools/docgen/card-model/vocab/card-contract.mjs` | 新建 | 四导出：`TYPE_LABELS`（键派生自 `enums.mjs` 的 `CHECK_KINDS`）/ `TRISTATE`（派生自 `enums.mjs` 的 `VERDICTS` + `reason`）/ `ALLOWED_PRODUCT_NAMES` / `FORMAT_CHECKS` | F-03 / F-04 / F-06 |
| 2 | `tools/docgen/card-model/vocab/object-names.mjs` | 新建 | `OBJECT_NAMES` / `REPEAT_NAMES`（`{ id: 中文名 }`），键取自 `agentData` 实取值并集 + `enums.mjs` 的 `REPEATS` | F-03 数据层 |
| 3 | `tools/docgen/templates/agent-card.md.tpl` | 修改 | `{{MUST_TABLE}}`→`{{MUST_BULLETS}}`、`{{NEVER_TABLE}}`→`{{NEVER_BULLETS}}`；新增 `{{TRISTATE}}` / `{{PRODUCT_NAMES}}` / `{{FORMAT_CHECKS}}` | F-03 / F-04 |
| 4 | `tools/docgen/components/renderCard.mjs` | 修改 | 产出 `- <i>｜…`；新增 `expectedBullet(card, i)`；把 #1 常量注入占位符；**判据列沿用既有 `PREDICATES[id].label`（已是中文），本块不改其来源** | F-05 |
| 5 | `tools/docgen/components/cardFaceIds.mjs` | 新建 | 新增 `cardFaceIds(card, env)`：**扫面 = `renderCard(card, env)` 的渲染文本逐行**；禁集合 = `env` 六个登记集合键（既有 `ENV_KEYS`，生产者 `registeredIdsOf(cards)` / `Object.keys(PREDICATES)` / `Object.keys(LANDINGS)` / `Object.keys(SHARED_SCENES)` 等）；先剔「许」四类 → 再按 D3 层③ 判红。**落 `components/` 不落 `card-model/`**：扫渲染文本必须 import 渲染器，而 S1 §3 的依赖红线是「`card-model/**` 只 import `node:` 与自身」（见 D19） | F-06 |
| 6 | `tools/docgen/test/card-render.test.mjs` + `tools/docgen/test/evidence-reader.test.mjs` | 修改 | 断言「第 i 行逐字 == `expectedBullet(card,i)`」+ bullet 数 == 数据条数 + 序号连续 + 三类夹具 + A1/A2/A3/A4；**`evidence-reader.test.mjs` 里断言卡面含 `evidence-reader.free-explore` 的两处改为断言中文名**（否则中文化后必红） | F-05 |
| 7 | `agents/<seat>.md` × 15 | **两步写盘** | ⚠ `generate` **只比不写**（`tools/docgen/cli.mjs` 的 `cmdGenerate`，除 `--readme --apply` 只落 `docs/agents/**`）；`agents/*.md` 的写盘在 `cmdReplace` → 顺序 = ① `node tools/docgen/cli.mjs draft --kind agent --name <席>` → ② 对照确认 → ③ `node tools/docgen/cli.mjs replace --kind agent --name <席> --yes` | F-03 / F-04 / F-05 |
| 8 | `docs/agents/**` | 重生成 | `node tools/docgen/cli.mjs generate --readme --apply`（此命令**才**写这一面，即 `cmdGenerate` 的 `--readme` 分支） | 派生 |
| 9 | `tools/docgen/components/baseline.mjs` / `baseline.json` | 修改 | 15 卡重生成后 `baseline --write` | — |
| 10 | `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md` | 修改（只加） | **C-7**：加「现行判据块 + 日期注」，原文一字不改 | R8 |
| 11 | `docs/prd/20261026205821-agent-card-contract.md` | 修改（只加注） | §3.4 行末加日期注「实现唯一源 = `tools/docgen/card-model/vocab/card-contract.mjs`，原文保留不改」 | R8 |
| **12** | `tools/docgen/card-model/vocab/landings.mjs` | 修改（**Q6-b**） | 键 `'progress.md'` → `'review.progress'`；**值（渲染文本）保持 `'progress.md 正文'` 不变**。实测影响面：`agentData.mjs` **0 处**以 `progress.md` 作 `landing`（卡数据不用它），消费点仅 `cardPipeline.mjs` 里 `landings: new Set(Object.keys(LANDINGS))` 这一处 env 集合与测试里 `Object.keys(LANDINGS)` 的泛化取值 → 改名零业务影响 | F-06 / V-6 |
| **13** | `tools/execution-matrix/criteria.md` + `tools/execution-matrix/check-agent.mjs` | 修改（**D17 增量**） | A3 判据扩面：判定 = 「卡内任一表格的表头行含『必答』或『必问』**或** 『一定会』节内 ≥1 行匹配 `^- \d+｜`」（保留旧形态）。判据正文与唯一实现同批改；`check-agent.test.mjs` 加两条（bullet 形态过 / 围栏内 bullet 不过） | F-05 |
| **14** | `tools/docgen/test/pilot-render.test.mjs` | 修改（**D17 连带**） | 「一定会表 5 行」与「卡面含共享 must id」两处断言按新形态改：前者改 bullet 条数，后者改「卡面含该共享句的渲染文案」（PRD §2.1 已点名该行） | F-05 |
| **15** | `scripts/check-before-after.mjs` | 新建（**D9 载体**） | 「不得先改后记」的**可跑判据**：扫 `agents/*.md`（可加路径参数）命中「已代为」/「已代删」即 exit 1；卡面只写判据、不写散文（`S2-TC-H06` / `H07`）。`rules/` 与 `skills/` 正文零改动的前提下，这是该条判据的唯一可执行落点 | F-06 |

**接口（唯一契约）**：

```text
card-contract.mjs   TYPE_LABELS / TRISTATE / ALLOWED_PRODUCT_NAMES / FORMAT_CHECKS   （新增）
object-names.mjs    OBJECT_NAMES / REPEAT_NAMES                                       （新增）
renderCard.mjs      renderCard(card, env) → string；expectedBullet(card, i) → string  （后者新增）
cardFaceIds.mjs     cardFaceIds(card, env) → string[]（空 = 过）                       （新增，落 components/；见 D19）
```

## 4 判定规则（逐条可机判）

| # | 规则 | 判法 | 违反归类 |
|---|---|---|---|
| D1 | 「一定会」「禁止」每条 = 一条 bullet，行首 `- <i>｜`，`i` 从 1 起连续 | 正则 `^\- (\d+)｜` 逐行；序号集合 == `1..n` | 测试红 |
| D2 | bullet 行**逐字等于** `expectedBullet(card,i)` | `assert.equal(line, expectedBullet(card,i))` | 测试红 |
| D3 | **禁 id 分三层**（层① 按行、层②③ 按 token）：<br>① 先按**行**排除「一定会」段末的三态常量行（4 行常量 + 1 解释行）<br>② **先剔路径 span**（含 `/` 的连续串与 `文件:行号` 形态，如 `.session/reviews/<本次>/`、`agents/x.md:31`），**再**按 token 切分（切分集写死：`/`、全角 `／`、空白、`、，,`）并剔除「许」四类（真实路径 / 工具名 / 产物字段名 / 卡片字段中文名）<br>③ 余下 token 命中下列**任一**即红（token 全等、禁子串）：**(a)** `env` 的六个登记集合键成员（`registeredIds` / `predicates` / `landings` / `sharedScenes` / `seatScenes` / `seatSignals`）；**(b)** `REPEATS` 键；**(c)** `CHECK_KINDS` 键；**(d)** 点分 id 形态 = 点分小写标识符且**末段不是文件扩展名**（`md` / `mjs` / `json` / `yml` / `yaml`）——(d) 是**形态判**，故点分近形（如 `xshared.impartial-long-term`）同样红；非点分形态仍按「全等」判。**不判红**：① `producer` / `S5-B` 等档位枚举与死路径串（PRD `:175` 明文不在本段扫描面，C-3 归 S6）；② **裸词时刻 id**（`start` / `end` / `before` / `after`）——卡面合法渲染「时刻：end」，本块不做时刻中文名表（实测 15 卡 **77 处** `end` / `after`），纳入即全席误红 → 归 §8 G-7 人工兜 | **扫面 = `renderCard(card, env)` 的渲染文本逐行**（D16）；顺序固定 ①②③，`cardFaceIds` 返回命中 token 数组 | 非空 → 红 |
| D4 | 「本席清单」类型列只许 `TYPE_LABELS` 的 3 个**中文值**；英文键 `script` / `ai` / `manual` 出现在类型列即红（这些键只在 `card-contract.mjs` 内部） | 逐格三值枚举 + 英文键 0 命中 | 测试红 |
| D5 | 三态行在位：**1 行中文解释 + 4 行常量**（`hit` / `miss` / `na` / `reason`），5 行逐字等于 `TRISTATE`（`TRISTATE` 由 `VERDICTS` 派生，**不得在别处字面写这 4 个值**） | 5 行逐字比对 | 测试红 |
| D6 | 卡面不得出现 `objects` / `repeats` 的英文键名（判定并入 D3 的第 ③ 步，键源 `enums.mjs` 的 `REPEATS`） | 同 D3 | `cardFaceIds` 非空 → 红 |
| D7 | `requires` 为空**不渲染**「前提：无」 | 卡面 `前提：无` 0 命中 | 测试红 |
| **A1** | 契约枚举只有一处：`TYPE_LABELS` 的中文值与 `TRISTATE` 的 4 个值，除 `card-contract.mjs` 外**字面数组 0 处**；阈值 = 一个 `[...]` 字面内含 ≥2 个上述值即计 1 处 | 扫**卡面渲染链**：`tools/docgen/{components,card-model,templates}` ∪ `scripts/` ∪ `agents/`，且排除 `*.test.mjs`（2026-11-01 **D18 收窄**；原「全仓扫 `tools/` + `scripts/` + `agents/`」因 HEAD 已有 3 处既有三态枚举用法而不再作为判定面，来龙见 §6-D18） | 测试红 |
| **A2** | 卡面与常量同源：**两个探针**（<br>① `gate` 重渲：disk ↔ render 一致（`collectGate` 比对）；<br>② **常量探针**：内存改 `TRISTATE[0]` 加探针串 → 重渲必须跟随，且磁盘 `agents/*.md` 探针 0 命中（未重生） | 两探针都要过；② 即原 tc `B08`，已升为本条判法 | `gate` Mismatch / 测试红 |
| **A3** | 无第二套白名单：新增一个未登记的合法产物名 → **只改 `card-contract.mjs` 一处**应绿；改别处应红 | 构造测试（内存） | 测试红 |
| **A4** | 占位符不残留：15 卡 `{{` 出现 **0 次** | `count(/\{\{/)==0` | 测试红 |

**判别力构造（三类常驻夹具）**：① 宾语≠落点 ② 两行同值（同一数据两处渲染）③ 共享句只 1 席渲染；每类必须有一条「构造后必红」的证明用例。

## 5 验收

> 出处锚一律指 PRD 实测行（`index.md:344`–`:349`，V-6…V-11 **共六行**，其中 V-8 归 S3，本块只承接其余五条 + V-11-b）。

| # | 验收项 | 可核方式 | 出处 |
|---|---|---|---|
| V-6 | 卡面零 id 且不误伤合法英文 | 15 卡**渲染面**对「六类登记键 ∪ `registeredIdsOf` 集合」0 命中（先剔路径 span，见 D3 层②）；塞回 1 个 id（如 `shared.impartial-long-term`）→ 红；反例必须绿：`evidence` / `reason` / `verdict`（产物字段名）与 `progress.md`（真实路径形态）、`.session/reviews/<本次>/`（路径 span）。**一词两用已按 Q6-b 根除**：落点 id 改名 `review.progress`，`progress.md` 只作渲染文本（见 §7 Q6） | PRD `:344` |
| V-7 | 行序号对账判别力 | 删一行 / 串一行 / 改一字 各红；数据层构造：丢 landing 槽 → 红；三类夹具各 ≥1 必红构造 | PRD `:345` |
| V-9 | 复用不复制 | A1 + A3；A1 的「副本 0」扫面 = **卡面渲染链 ∪ `scripts/` ∪ `agents/`（排除 `*.test.mjs`，D18 收窄，见 §4-A1 / §6-D18）**；`cardFaceIds` 复用 `renderCard` 与 `env` 既有集合键，**不新增禁表、不另写第二套渲染** | PRD `:347` |
| V-10 | 全量门禁 | `npm run check` 绿 + `node scripts/scope-sweep.mjs --check` exit 0 + `gate` baseline 重记有审计抽核 | PRD `:348` |
| **V-11** | **理解度（必选，执行型）** | **可执行口径（四条全给，缺一不可）**：<br>① **题面固定** = `docs/reports/2026-11-01-s2-card-comprehension-baseline.md` 的 5 题 × 每席 34 项「必须出现 / 不得出现」条目，逐条 0/1；<br>② **改前基线已落** = 同一文件（3 席**合计 59/102**：`reviewer-qa` 22/34、`reviewer-audit` 19/34、`detective-observer` 18/34；**目标形态合计 74/102**）；<br>③ **合成规则** = 两判分人**逐项取交集**（两人都判「达成」才算达成；分歧项不进交集、另记），**分歧 > 3 项即启动第三实例裁定**（裁决记录写进同一报告 `§裁定`）；<br>④ **判据（按 Q7-① 裁定）** = 交集漏项 `L_after ≤ ⌊L_before × 0.5⌋` **且** `L_before − L_after ≥ 1`（`L_before` = 改前同交集口径漏项数）；3 席全过才算过 | PRD `:349` |
| V-11-b | **测量隔离** | `V-11` 的答题实例**只给卡**、不给任何门禁提示；门禁（含「产出须含 `path:line`」若立项）**单独计**，不得混入 `V-11` 分数 | 本 spec §6 D7 |
| 首日不红 | 本块上线时 `npm run check` 绿，且 ⑦ 段 `[observable]` 的 `hits` 仍为 0（S2 不动 `rules/` 与 `skills/` 正文） | 命令输出 | — |

## 6 差异清单（D）

| # | 差异 / 取舍 | 出处 |
|---|---|---|
| D1 | 三态常量**新增**（现 15 卡 0 命中），键源 = `enums.mjs` 的 `VERDICTS` + `reason`；**不迁出、不复用 re-export** | 第 1 轮 F1 修正；`enums.mjs` 的 `VERDICTS` |
| D2 | 契约文本走「常量 → 占位符 → 渲染」，15 卡不得手写 | `rules/rules-single-source.md` |
| D3 | `expectedBullet` 是唯一翻译点 | PRD `:172` |
| D4 | 禁 id 匹配 = **token 全等**（禁子串，否则 `evidence` 误红） | PRD `:176` |
| D5 | 档位枚举（`producer` / `S5-B`）与死路径串**不在本块扫描面**（C-3 归 S6） | PRD `:175` |
| D6 | C-7 只**加**「现行判据块 + 日期注」 | PRD C-7 |
| D7 | 「产出须含 `path:line`」**不挂卡面**：卡面写不进去（实测 6 份答卷 4 份只写「要求对方补」）；若要做只能做成门禁/规则，且**不得计入 `V-11`** | 基线报告 §3④ / §5 |
| D8 | 「无问题也写结论」**不加**：目标形态该题已 21/21，窗口为 0 | 基线报告 §6 |
| D9 | 「不得先改后记」转**可跑判据**（grep `已代为` / `已代删`），不写成卡面散文 | 精算师评审 P4 |
| D10 | 类型三值并入 `ALLOWED_PRODUCT_NAMES` 同一白名单（键源 `CHECK_KINDS`），不单开一套口径 | 精算师评审 P5 |
| **D11** | **写盘两步**：`generate` 只比不写；`agents/*.md` 走 `draft → 确认 → replace --yes` | 第 1 轮 F4 修正；`tools/docgen/cli.mjs` 的 `cmdGenerate` / `cmdReplace` |
| **D12** | **禁集复用既有常量、不新增禁表**：`env` 六个登记集合键 + `REPEATS` / `CHECK_KINDS` 键（全部派生）。**扫面不用 `CARD_TEXT_FIELDS`**（那是数据面字段清单），改用渲染文本（见 D16） | 第 1 轮 F5 修正 + D16；`enums.mjs` 的 `SCAN_FIELDS` / `REPEATS` / `CHECK_KINDS`、`index.mjs` 的 barrel 导出 |
| **D13** | **R8 改判登记（本块两处，本批同回扫）**：① 落点 id `progress.md` → `review.progress`（§3 #12）；② V-11「绝对值 ≤1」解释定为读法①（§5 V-11④）。回扫面 = PRD `:344` / `:349`、S4 spec、`docs/reports/2026-11-01-s2-card-comprehension-baseline.md`；判据 = `node scripts/scope-sweep.mjs --check` exit 0 | 用户 2026-10-25 裁定（R8）；`rules/dev-workflow-mainline.md` R8 |
| **D14** | **接口正名（② 段内增量修正，2026-11-01 计划预备期发现）**：禁集合由**不存在的** `registeredIdsOf(card, env)` 改为既有派生（先 `env.registeredIds`，后经 D15 扩为 `env` 六集合键），生产者 `registeredIdsOf(cards)` / `Object.keys(...)`；扫面部分由 D16 改判。**判据、条数、落点数零改动**，只补可执行性 | 现盘实测：`registeredIdsOf` 单参；`cardPipeline.mjs` 的 `registeredIds: new Set(registeredIdsOf(cards))` 已把该键注入 env；`CARD_TEXT_FIELDS` 在 `enums.mjs` 未 `export` |
| **D15** | **D3 层③ 判据回流（② 段内增量，**判据扩面，需审计复签**；经 3 轮独立审计定型）**：原文只写「余下 token 与 `env.registeredIds` 全等」，与 testcase 三处期望不符：① `C03` 要 `script`/`ai`/`manual`/`per-round` 必红、`C07` 要 `trace.id`/`foo.bar` 必红，六者都不在 `registeredIds`（该集只收 `checkItems[].id`）→ 扩为 (a)–(d) 四类；② (d) 的形态判与 `C05`「子串不算命中」互斥 → (d) 明写「形态判，点分近形同样红」、`C05` 构造改**无点分**近形、`E03` 探针改 `rubric.score`；③ `C02` 的场景/时刻代表（`session`/`start`）无点分且不在 `registeredIds`，且现盘 15 卡有 **77 处** 裸词 `end`/`after` → (a) 扩为 `env` 六个登记集合键、**裸词时刻 id 明确不判红**（记 §8 G-7）、`C02` 由六类改**五类** | testcase `C02` / `C03` / `C05` / `C07` / `E03`；现盘实测：点分 token 去重 **38**、剔扩展名后 **24** 全是真 id（无误伤）；裸词 `end`/`after` **77** 处 |
| **D16** | **扫面口径回流（用户 2026-11-01 裁定，**判据级选型，需审计复签**）**：扫面定为 **`renderCard(card, env)` 的渲染文本逐行**，**不再**复用 `CARD_TEXT_FIELDS`（那是**数据面**字段清单）。理由：① 数据里合法存着 `shared.*` / `deliverable.*`（中文化发生在渲染期），扫数据会让 `C01`「15 卡零命中」恒红；② 层①「排除段末三态行」只对渲染行成立；③「卡面零 id」= 读者看到的面。**第 5 轮审计追加两条硬约束**：(i) 层② 必须**先剔除路径 span 再切 token**——`.session/reviews/<本次>/` 这类路径若被切成裸词 `session` 会撞 `SHARED_SCENES` 键（渲染面残留 4 处，`C01`/`C08` 恒红）；(ii) token 切分集写死为 `/`、全角 `／`、空白、`、，,`；路径 span = 含 `/` 的连续串与 `文件:行号` 形态。连带：`C09③` 六字段改「五个进渲染面的字段」、`C11①` 改塞 `duty.action` | 用户 2026-11-01 裁定（扫渲染文本 / 扫数据 / 双面 → 选①）；第 4 轮：`C11①` 恒红（`landing` 渲染成中文）；第 5 轮实跑 15 卡渲染面（1131 行 / 673 命中）：施工后残留 6 处 = `progress.md`×2 + `session`×4（后者来自 `renderCard` 的「边界」段路径句） |
| **D18** | **A1 扫面收窄（③ 施工期发现，同批随 D17 复签）**：§4-A1 原文「全仓扫 `tools/` + `scripts/` + `agents/`」，实测 HEAD 就有 3 处既有的三态枚举字面数组（`tools/docgen/test/card-model.test.mjs` 的 `'hit','miss','na'`、`tools/observation-check/checks.mjs`、`tools/observation-check/golden.test.mjs`）——它们是既有语义数据，不是本块要防的「契约副本」。按「只加判据、不删」不能把它们算成新副本 → 扫面收窄为**卡面渲染链**：`tools/docgen/{components,card-model,templates}` ∪ `scripts/` ∪ `agents/`，并排除 `*.test.mjs`。判据不变（仍防「契约枚举在别处再写一份」），只把误报面剔掉。 | 实测 HEAD 三处存量命中（`grep` 结果见 ④ 段抽核）；PRD `:107` 「不降低判据强度：只加判据、不删」 |
| **D17** | **A3 判据扩面（③ 开工前的 ② 增量；2026-11-01 用户裁定「A3 扩面，回 ② 增量复签」）**：执行力度矩阵 A3（必答清单存在）原判「卡内任一表格的表头行含『必答』或『必问』列头」；本块按 PRD §3.4 把「一定会」改 bullet（不渲染表格）→ 原判对 15 席**恒红**。实测取证：把 `reviewer-qa` 的「一定会」表换成 1 条 bullet，`checkStruct` 由 `{"findings":[]}` 变 `{"findings":[{"code":"A3"}]}`（A4–A7 仍绿）；而 `npm run check` ② 段对 15 席逐席执行该判（`scripts/check-all.mjs` 的 `checkAgentFile`），`dev-workflow-counts.test.mjs` 再扫一遍。**扩面口径（只加不删）**：A3 = 「卡内任一表格的表头行含『必答』或『必问』**或** 卡内『一定会』节内 ≥1 行匹配 `^- \d+｜`」——旧形态保留（`agents/senior-sdet.md` 现盘已随本块重生为 bullet 形态，旧表格形态继续由 `check-agent.test.mjs` 的两条存量用例覆盖）。**不动** A4 / A5 / A6 / A7（A4 的闭环字样与 A5 的证据字样留在模板骨架行，逐字未改）。落点：`tools/execution-matrix/criteria.md`（判据正文，R8 改）+ `tools/execution-matrix/check-agent.mjs`（唯一实现）+ `tools/execution-matrix/check-agent.test.mjs`（加两条：bullet 形态过 / 围栏内 bullet 不过）。R8 登记：`tools/scope-sweep/keywords.json` 加 `I20`（旧说法），`--freeze` 于改前取值。连带测试面（旧断言按表形态写，同批改形、判据不变）：`tools/docgen/test/card-render.test.mjs` 的 A01 / A04 / A05 / G03 / G05 与 `tools/docgen/test/pilot-render.test.mjs` 的「一定会表 5 行」「卡面含共享 must id」两处。 | 用户 2026-11-01 裁定；实测 `checkStruct` A3 判红；PRD `:107` 「不降低判据强度：只加判据、不删」；`tools/execution-matrix/criteria.md` 的 A3 判定对象；`scripts/check-all.mjs` 的 `checkAgentFile` 调用点 |
| **D19** | **`cardFaceIds` 落点修正（③ 施工期发现，**落点改判，需审计复签**）**：§3 #5 原把守卫落在 `tools/docgen/card-model/validateCardModel.mjs`，而 `S1-TC-J06` 的依赖方向判据（S1 spec §3：`card-model/**` 只 import `node:` 与自身，不 import `components/**`）实测直接判红（`S1-TC-J06 依赖方向` 报 `validateCardModel.mjs: 依赖 ../components/renderCard.mjs 越界`）。而守卫的扫面按 D16 已钉死为「渲染文本」（必须 import 渲染器），两条判据不可同时成立 → 取**保 S1 红线、改本块落点**：实现移到 `tools/docgen/components/cardFaceIds.mjs`（新建），签名 `cardFaceIds(card, env) → string[]` 与三层判定**逐字不变**；`validateCardModel.mjs` 与 `card-model/index.mjs` 的 barrel **不导出该函数**（避免跨层 import）。**判据强度零改动**：判据、条数（C01 等仍断「15 卡零命中」）、`S2-TC-G04` 的「定义数恰 1」都不变，只改文件落点。 | S1 spec §3 依赖方向 / S1 testcase `S1-TC-J06`；③ 段实跑 `node --test tools/docgen/test/card-model.test.mjs` 的 J06 报错原文；D16 的扫面裁定 |
| **D20** | **`I06` 判据对象澄清 + 签字载体白名单（③ 出口审计 P1，**判据口径澄清，需审计复签**）**：testcase `I06` 原写「两张 blob 清单**逐键相等**」，而 `skills/dev-workflow/references/gate-record.md` 是**门行账本**（R1/R3 要求每过一门必须落一行），必然每批都变 → 字面口径下 `I06` 恒红。澄清判据对象为「**`rules/` 与 `skills/` 正文**」：其余文件逐 blob 比对，`gate-record.md` 单列白名单（理由 = 签字载体不是正文）。实现同步（`S2-TC-I06` 改为 `git hash-object` 逐文件比 + 白名单 + 新增/删除键都判红）。**不降低判据强度**：原来只比路径集（内容变了也绿）= 假绿，现改为内容级。 | ③ 出口审计 P1（实测 `gate-record.md` 本轮 blob `fe69ad8 → f374fac` 已变，而旧实现只比路径集）；`rules/dev-workflow-mainline.md` R1 / R3（门行必须落） |
| **D21** | **`<S2-BASE>` 降级锚补充（③ 出口审计 P1，**测试基锚取值口径，需审计复签**）**：testcase 常量 14 原写「`S2_BASE` 缺失时降级为 `HEAD`」。本批**提交后**「spec 最近一次提交」就是 HEAD 本身 → `HEAD..HEAD` 恒空，`G05` 的提交面与 `I01`/`I03`/`I05` 的 `git diff <base>` 全部看不到东西（实测 `G05`/`I01` 转红）。补一条：降级锚取「spec 最近一次提交；**若它等于 HEAD（本批已提交），取它的父提交**」——语义仍是「本批**改前**基线」，判据（一次性全改 / 原文零删除）不变。 | 实测：`git log -1 -- spec` == `git rev-parse HEAD` == 本批提交；改锚后 `git log HEAD^..HEAD -- agents/` = 1 个提交 / 15 文件、S4 spec `+15 −0` |

## 6.1 R8 回扫清单（D13 / D17 / D18 / D19 / D20 / D21 的改判，逐项给处置）

| 口径 | 命中处 | 处置 |
|---|---|---|
| 落点 id `progress.md` → `review.progress` | `landings.mjs` 的 `LANDINGS`（唯一写死处） | **改** |
| 同上 | `cardPipeline.mjs` 的 `landings: new Set(Object.keys(LANDINGS))`（泛化取键） | 不改（自动跟随） |
| 同上 | `card-model.test.mjs` / `card-render.test.mjs`（均 `Object.keys(LANDINGS)` 泛化） | 不改（自动跟随）；若 ③ 段出现写死 `'progress.md'` 的断言 → 同批改 |
| 同上 | PRD `:344`（反例原文） | **不改**（Q6-b 的目标就是不动 PRD）；本 spec §5 V-6 已注「`progress.md` 只作渲染文本」 |
| V-11「绝对值 ≤1」 | PRD `:349`（原文保留） | **不改**；解释落在本 spec §5 V-11④ |
| 同上 | `docs/reports/2026-11-01-s2-card-comprehension-baseline.md` | **加注**：`L_before` 口径 = 读法①（净减少 ≥1），原文分数不改 |
| A3 必答清单存在（D17 扩面） | `tools/execution-matrix/criteria.md` 的 A3 判定对象 / 判定方式两行（判据正文唯一处） | **改**（③ 段 Task 5 同批：旧形态原句保留为前半句，后半句加 bullet 形态） |
| 同上 | `tools/execution-matrix/check-agent.mjs` 的 `checkStruct`（唯一实现） | **改**（叠一条「一定会节含 `^- \d+｜`」分支） |
| 同上 | `tools/execution-matrix/check-agent.test.mjs`（A3 三条 + F2 两条断言） | **改**（加 bullet 形态的两条用例；既有五条断言保持） |
| 同上 | `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md`（`:134` 的「A3（表头含『必问』）」判据面声明） | **不改**（C-7 只加「现行判据块 + 日期注」，原文一字不改；现行口径记在 C-7 块与本 spec D17） |
| 同上 | `tools/docgen/test/pilot-render.test.mjs`（「一定会表 5 行」按表形态写） | **改**（③ 段 Task 6：改 bullet 条数断言，PRD §2.1 已点名该行） |
| A1 扫面（D18 收窄） | 本 spec §4-A1「判法」格 + §5 V-9 | **改**（同上批已改：两处都写明「卡面渲染链 ∪ `scripts/` ∪ `agents/`，排除 `*.test.mjs`」并指向 §6-D18） |
| 同上 | `tools/docgen/test/s2-card-rewrite.test.mjs` 的 `copyScanRoots` / `filesWithEnumCopies` | **改**（实现面：按 D18 收窄，阈值不变） |
| 同上 | `tools/docgen/test/card-model.test.mjs` / `tools/observation-check/checks.mjs` / `tools/observation-check/golden.test.mjs`（HEAD 既有 3 处三态枚举字面） | **不改**（既有语义数据；D18 收窄的正是这三处误报面） |
| 同上 | `docs/superpowers/specs/2026-11-01-s2-card-rewrite-design-testcase.md` 的 `E01` 前置 + §1 覆盖总表 | **改**（同上批已改：两处同步为新面） |
| `cardFaceIds` 落点（D19 改判） | 本 spec §3 落点 #5 + §3 的「接口（唯一契约）」块 | **改**（同批已改：落点 = `components/cardFaceIds.mjs`） |
| 同上 | `tools/docgen/card-model/validateCardModel.mjs`（S2 新增的守卫块与其 `../components/renderCard.mjs` import） | **改**（同批：整块移出到 `components/`，跨层 import 删除） |
| 同上 | `tools/docgen/card-model/index.mjs`（barrel 多导出一项 `cardFaceIds`） | **改**（同批：barrel 恢复 18 项，不再导出该函数） |
| 同上 | `tools/docgen/test/s2-card-rewrite.test.mjs` 的两处引用（顶部 import 与 `D02` 子进程脚本的 `modVal`） | **改**（同批：改从 `components/cardFaceIds.mjs` 取；判据不动） |
| 同上 | S1 spec §3 依赖方向 / S1 testcase `S1-TC-J06` | **不改**（本块按它改自己的落点，不动上游判据） |
| `I06` 判据对象（D20） | 本 spec §5 首日不红行 | **不改**（原句已写「S2 不动 `rules/` 与 `skills/` **正文**」，白名单理由见 §6-D20） |
| 同上 | testcase `S2-TC-I06` 前置/判据 | **改**（白名单入前置；判据从「路径集相等」改为「逐 blob 相等 + 唯一豁免」） |
| 同上 | `tools/docgen/test/s2-card-rewrite.test.mjs` 的 `S2-TC-I06` | **改**（路径集比对 → `git hash-object` 逐 blob + 白名单 + 新增/删除键都判红；判据**加强**） |
| `<S2-BASE>` 降级锚（D21） | testcase 常量 14 + plan 约束 12 | **改**（补「若 spec 最近提交 == HEAD 则取父提交」） |
| 同上 | `tools/docgen/test/s2-card-rewrite.test.mjs` 的 `s2Base` | **改**（降级锚实现 + 诊断串同步） |

## 7 未决（Q，已裁定）

| # | 问题 | 裁定 |
|---|---|---|
| Q1 | 15 卡逐席滚动还是一次性 | **一次性全改 + 一次提交**（第 1 轮修正：`state.json` 标 `replaced` 后单席比对不可行，见 `tools/docgen/cli.mjs` 的 `collectGate` 与 state 判定） |
| Q2 | `docs/agents/**` 是否同批 | **同批**（`generate --readme --apply`） |
| Q3 | 词序可否调整 | **可调语序与连接词，不可改语义** |
| Q4 | `card-contract.mjs` 放哪 | **`vocab/`**（与登记表同域；`card-model/**` 依赖红线不破） |
| Q5 | 三态常量从哪来 | **新增**于 `card-contract.mjs`，键源 `enums.VERDICTS`；`enums.mjs` 本身零改动（无 re-export） |
| **Q6** | ~~`progress.md` 一词两用~~ | **已裁定 = Q6-b（2026-11-01 用户「按这个方案」）**：改落点 id 为 `'review.progress'`，渲染文本仍 `'progress.md 正文'`；PRD `:344` 原文不动。落点见 §3 #12；R8 登记见 §6 D13 |
| **Q7** | ~~V-11「绝对值 ≤1」~~ | **已裁定 = 读法①（2026-11-01 同批）**：`L_after ≤ ⌊L_before × 0.5⌋` **且** `L_before − L_after ≥ 1`。已写进 §5 V-11④，testcase `H01` 同批对齐 |
| **Q8** | ~~执行力度矩阵 A3 与新卡 bullet 形态互斥（③ 开工第一日实测 `checkStruct` 判 A3 红）~~ | **已裁定 = 扩面（2026-11-01 用户三选一取第一档）**：A3 保留旧表格形态并新增 bullet 形态（只加不删，PRD `:107`）；判据正文 + 唯一实现 + 测试同批改；R8 登记 `I20`；须独立审计复签后方可进 Task 8。落点见 §3 #13 / #14、差异见 §6 D17、回扫见 §6.1 |
| **Q9** | ~~`cardFaceIds` 落 `card-model/` 还是 `components/`（S1 依赖红线 vs §3 #5 原落点）~~ | **已裁定 = 落 `components/`（③ 施工期实跑判红后定）**：`S1-TC-J06` 明写 `card-model/**` 不得 import `components/**`，而守卫扫渲染文本必须 import 渲染器 → 两条判据不可兼得时保上游红线、改本块落点；签名与判定零改动。落点见 §3 #5 / §3 的「接口（唯一契约）」块、差异见 §6 D19、回扫见 §6.1 |
| **Q10** | ~~`I06` 的「`rules/` 与 `skills/` 零改动」遇 `gate-record.md` 必变（门行账本）~~ | **已裁定 = 判据对象澄清为「正文」+ 白名单（③ 出口审计 P1 后定）**：其余文件逐 blob 比、`gate-record.md` 豁免（它是签字载体，R1/R3 要求每过一门落一行）；同时把「只比路径集」的假绿实现改成内容级。见 §6-D20 / §6.1 |
| **Q11** | ~~`<S2-BASE>` 降级为 `HEAD` 在本批提交后恒空（看不到提交面与 diff）~~ | **已裁定 = 降级锚取「spec 最近提交；等于 HEAD 时取父提交」**：语义仍是「本批改前基线」，G05/I01/I03/I05 判据不变。见 §6-D21 / §6.1 |

**Q6 三个候选**（已选 b；a / c 作历史保留，不再采用）：

| 候选 | 做法 | 判定 |
|---|---|---|
| Q6-a | 改 PRD `:344` 反例为带路径形态 | **不采用**：要改 PRD 判据字面 |
| **Q6-b** | 落点 id 改名 `'progress.md'` → `'review.progress'`，PRD 原文不动 | **采用**：零业务影响（§3 #12 实测） |
| Q6-c | D3 加「只在 landing 槽位判红」 | **不采用**：一词两义保留，长期必再撞 |

## 8 缺口（已知未覆盖，人工兜）

| # | 漏检哪类 | 为什么机器判不了 | 由谁兜 | 触发信号 |
|---|---|---|---|---|
| G-1 | 判据翻译的语义正确性 | 机器只判形态与词表 | 议会测试评委独立回读 | 出现「译文与 `predicates.mjs` 原意不符」 |
| G-2 | 行为类要求（如「无问题也写结论」） | 实测：卡上写了模型也不照做 | ④ 段 sdet 抽核 | 产出里出现空结论行 |
| G-3 | PRD §3.4 与 `card-contract.mjs` 的语义同义性 | 只能比字面 | 审计抽核 + R8 回扫 | 改任一处 |
| G-4 | `V-11` 判分噪声 | 同卷跨人差 6 项 | 双判分 + 第三人裁定 | 两判分人分歧 > 3 项 |
| **G-5** | **`{{}}` 占位符替换的语义正确性** | 只判「无残留」，判不了「填进去的句子对不对」 | 议会回读 + ④ 段 | 出现「占位符被替换成空串」 |
| **G-6** | **`generate` 与 `replace` 之间的人工确认是否真做** | 机器只能核最终字节 | 审计抽核 `state.json` 与 `git diff` | `state.json` 标 `replaced` 但无 draft 记录 |
| **G-7** | **裸词时刻 id（`start` / `end` / `before` / `after`）在卡面出现时判不了** | 卡面合法渲染「时刻：end」（现盘 15 卡 **77 处**），纳入禁集即全席误红；而 F-03 只给 `objects` / `repeats` 名表，不做时刻中文名表 | ④ 段 sdet 抽核；S3 扩判定面时补名表 | 卡面出现「时刻：<英文词>」且该词与 `MOMENTS` 键全等 |
