> split from `docs/prd/20261102212627-card-data-contract-and-proof/index.md`（2026-11-03）

# 11 S-C 卡面形状：三态承载 / 动作返回 / trigger 四型 / 长度约束 / 删人设 / `HOST_TERM`

> 本 spec 只覆盖 PRD §8 的 **S-C 段**。D1–D17 / Q1–Q8 / V1–V12 的正文只活在 PRD，本文只引用编号（PRD §9 双份真相禁令）。D16 / D17 只引用、不改写（PRD `:147`）。
> 前置（硬）：S-A 五段全闭环（`gate-record.md:81`–`:85`）、S-B 五段全闭环（同文件 `:89`–`:97`）；未闭环不得开工。
> 基线（2026-11-04 实跑）：`# tests 1481 / # pass 1476 / # fail 0 / # skipped 5` + `baseline 38/38` + `rows 68 bad 0` + `sweep ok` + `check-observable ok`。**PRD §8 的 `1405` 是历史值，不得引用**。

## 11.0 为什么

- 卡面把三态写成「一定会」段末 5 行常量：1 行中文解释 + `hit` / `miss` / `na` / `reason` 各一行。读者看到的是四个孤立词，**看不出它们属于哪一列、哪一条**（PRD §1 缺陷 1 的卡面侧）。D16 已裁定：判定面统一，卡面只在「本席清单」表头给一行取值。
- 15 席 `duty.action` 现状是**人设介绍**而非动作：`loadSeatData()` 里 `资深` 命中 22 次（data 面）、`agents/*.md` 10 次、`docs/agents/*.md` 12 次。D5 要求「明确返回」，D1 / D2 要求删身份重述与人设套话。
- 4 个 `duty` 字段共 **13 项**斜杠串（`触发` 11 + `动作` 2，2026-11-04 实测；按出现次数计 25），D3 要求同类枚举一律数组化。
- `trigger` 只有 `when` / `route`（+ 1 席 `notWhen`）**没有 `kind`**：S-A spec §10.1 R8 承诺「本段只留字段位」，实测未落——取数：`((Get-Content tools\docgen\data\seats\reviewer-ai.json -Raw | ConvertFrom-Json).trigger | Get-Member -MemberType NoteProperty).Name` → `route` / `when`。Q5 的四型因此无处可判。
- 「主持人」在席位数据里是**字面**（`Select-String tools/docgen/data/seats/*.json -Pattern '主持人'` → **17 行 / 18 次**），Q1 要求它是常量 `HOST_TERM`。

## 11.1 核心决定（不可违反）

| # | 决定 | 为什么 |
|---|---|---|
| R1 | **删除** `TRISTATE`（常量 + 模板槽 + 渲染函数），改为「本席清单」**表头一行**承载三态取值（PRD D16 ③），**不加列**（列数仍 4） | 5 行常量与表头的「判据」列是同一件事的两处；留在段末则读者仍不知道「填哪一列」。D16 已定死「不新增逐项字段」 |
| R2 | 新常量名 `VERDICT_HINT`，住 `card-contract.mjs`（卡面契约唯一写死处），值 = **「判定取值：」+ 三值（由 `VERDICTS` 派生的「hit（命中）、miss（未命中）、na（不适用）」形态）+ 「；miss 与 na 须写 reason，缺 reason = 废卡；na 还须写明为何不适用」** | ① 三值必须**派生**自 `VERDICTS`（D16 ① 卡面侧唯一源）；② 被删那句里的「**缺 reason = 废卡**」与「na 合法条件」（D16 ⑤）不能随 5 行一起丢——丢了 AI 读者漏写 reason 时卡面不再告诉它后果（议会轮 1 的 A-1 正面抓到）；③ 必须点明这些是**取值**而非字段名（否则与「产物字段名只许：…」行形成两处互斥语义）；④ 契约字面不得长在模板 / 渲染器（`S2-TC-E07`），故只能住 `card-contract.mjs` |
| R3 | `card-contract.mjs` 导出面**仍恰 4 个**：`ALLOWED_PRODUCT_NAMES` / `FORMAT_CHECKS` / `TYPE_LABELS` / `VERDICT_HINT` | 导出数变化会让「四导出」这条已签判据失去判别力；换同类新常量可保住这条断言 |
| R4 | `enums.mjs` **零改动**：`VERDICTS` 仍 3 值、8 张封闭表不变；跨包重复（`tools/observation-check/checks.mjs:6` 的三值 `Set`）**加一条相等断言**（PRD D16 ①），做法 = 该文件把 `VERDICTS` 改为 `export`（**加性导出，无既有断言其导出面**，不会红），新测试 `deepEqual([...CHECK_VERDICTS].sort(), Object.keys(ENUMS.VERDICTS).sort())` | D16 ① 点名的就是这处跨包副本；不加断言 = 三值出现第三份真相且 V11 扫不到 |
| R5 | `cardFaceIds.mjs` 的**层① 豁免整层删除**（它只为逐行全等 `TRISTATE` 而存在） | 5 行不存在后该层恒不命中；留着是死代码。删后 `S2-TC-C01`–`C09` 逐条仍绿（三值已在 `ALLOWED_PRODUCT_NAMES` 的「许」集里，`card-contract.mjs:23-28`） |
| R6 | 冻结断言**同批改写**（PRD §5 点名 5 处 + 议会轮 1 的 B-1 补 3 处 + testcase 修订轮 3 补 2 处；逐条列在下文）：`s2-card-rewrite.test.mjs` 的 `A01`(`:74`) / `A04`(`:96-102`) / `A05`(`:105-113`) / `A10`(`:163-173`) / `B08`(`:253-264`) / `D04`(`:446-452`) / `D05`(`:454-461`) / `E05`(`NEW_TPLS`, `:545`) / **`F05`(`:734` 的 `CC.TRISTATE[0]` 探针)**；`sdet-render.test.mjs:21`（逐字表头）；`renderCard.mjs:95-96`/`:115`；`templates/agent-card.md.tpl:17`；`cardFaceIds.mjs:6`/`:14`/`:65`；**`sa-data-layer.test.mjs:47-48`（`shared.json` 恰 3 键 → 4 键）**；**`pilot-data.test.mjs:24-26`（`trigger` 键集恰 `route,when` → 加 `kind`；`when` 逐字断言**不变**）**；**`pilot-data.test.mjs:15`（逐字断言 `reviewer-audit` 的旧 `duty.action` → 换新文案）**；**`tool-tiers.test.mjs:623`（`S5-TC-C08` 的 `patchFile` 拿旧 action 子串当构造前提 → 换新文案片段）**；**`sdet-data.test.mjs:26`（`role` 逐字断言含 `资深` → 去前缀）** | 少改一处 = 该处判的是已不存在的对象（恒红）或恒真（失去判别力）。实测：漏改会直接 `# fail ≥6`，V3 不可归因 |
| R7 | 斜杠串：`duty.trigger` / `duty.action` / `duty.constraint` / `categories[].label` 四面的 `/` 与 `／` **计数 0**（现 13 项）（PRD D3 / V12） | V12 的字段路径已钉死在这四面上（PRD `:74` 备忘：扫 `entry.duty` 会恒 0 假绿）。改法只有一种 = 改文案（`PRD/spec/plan` → `PRD、spec、plan`），**不改 schema** |
| R8 | `duty.action` 15/15 重写为「对⟨对象⟩做⟨动作⟩，逐条给出判定与理由，结论写回⟨产物名⟩」；`rationale` 里的人设句同批删；可判四件 = ① 人设词 0（V9，三面）② 斜杠 0（V12）③ 每席含「写回」④ 「写回」后的产物名**不得是占位**（`本席产物` 命中 0）且 15 席的产物名**至少 3 种不同值** | 「返回」是最缺的一环（D6）；「写回」是它的最小可判形态。③④ 是议会轮 1 的 R-2 / A-3 补的：只判「含写回」会出「句式合格但内容空转」的卡（占位符 + 15 席同一句）。**动作行不得写三态词**（英文或中文都不写）：三值只在表头声明一处，动作行再写一遍就是第三种说法（A-2） |
| R9 | `trigger.kind` 落 `triggerTable[<seat>].kind`（**数据侧**，不进 `card.duty`、不进卡面渲染）；四值 = `dispatch` / `occasion` / `moment` / `need`，定义与中文判据住新脚本 `check-trigger-kind.mjs`（唯一写死处，含文件头注释） | S-A R8 已把位置定死（`triggerTable`），实测未落 → 本段补。不渲染：V10 的判定面是数据层，渲染会改「职责」段形态而 PRD §6「不改卡面七段结构」；kind 的判定**依据数据声明，不由句子形态推断**（脚本输出附每席 `when` 首 12 字供 `residual` 抽核） |
| R10 | 非议会席名单**用命令取**（席名不以 `reviewer-` / `detective-` 开头 = `evidence-reader` / `senior-sdet`），这两席**只许** `need`（PRD V10） | 写死名单 = 第 16 席出现时静默漏检 |
| R11 | `checkItem` **不加** `returns` 字段（PRD D16 ④）：每条的返回类型由 R1 的表头统一声明。连带的 `returns` 计数 0（V11 ①）靠**改 S-A 负例夹具键名**达成（用户 2026-11-04 裁定），不改 V11 判据 | 逐项字段既无码位、无消费者，又造第三份副本；夹具名不是 schema 字段，改名即可，不放松判据 |
| R12 | `HOST_TERM` 的落点 = `data/shared.json` 的 `hostTerm` 键；席位数据 18 处字面改 `${@hostTerm}`；**不新增 JS 常量** | `seatLoader` 的引用形态是 `^@([a-z][A-Za-z0-9]*)$`（键名首字符必须小写）；D10 的「常量」= 单一写死点，落数据层才与 `@` 展开机制同一条链 |

## 11.2 落点表

| # | 文件 | 动作 | 依据 |
|---|---|---|---|
| 1 | `tools/docgen/card-model/vocab/card-contract.mjs` | 删 `TRISTATE`，加 `VERDICT_HINT`（派生） | R1 / R2 / R3 |
| 2 | `tools/docgen/components/renderCard.mjs` | 删 `tristate()` 与 `{{TRISTATE}}` 填充；`checkTable()` 表头用 `VERDICT_HINT` | R1 / R6 |
| 3 | `tools/docgen/templates/agent-card.md.tpl` | 删 `{{TRISTATE}}` 行 | R1 / R6 |
| 4 | `tools/docgen/components/cardFaceIds.mjs` | 删层①（`TRISTATE` import + 逐行豁免） | R5 |
| 5 | `tools/docgen/data/shared.json` | 加 `hostTerm`（唯一写死处）→ 键数 3 → 4 | R12 / R6 |
| 6 | `tools/docgen/data/seats/*.json`（15 份） | ① `duty.action` 重写 + `rationale` 删人设句；② `trigger.when` 改斜杠串（**`reviewer-audit` 的 `when` 一字不动**，见 §11.5）；③ `trigger.kind` 新增；④ 18 处「主持人」→ `${@hostTerm}` | R7 / R8 / R9 / R12 |
| 7 | `tools/docgen/check-trigger-kind.mjs`（新） | 四值 + 非议会席只许 `need` + 名单现算 | R9 / R10 |
| 8 | `tools/docgen/check-tristate-header.mjs`（新） | 逐席「本席清单」表头**逐字含 `VERDICT_HINT`** → 15/15 | R1 / R2 |
| 9 | `scripts/check-all.mjs` | 新增第 ②.7 段调用上面两个脚本（**按退出码判**，不解析首行；`CHECK_BYPASS` 只跳 ⑥，不受影响） | R9 / R1 |
| 10 | `tools/observation-check/checks.mjs` | `VERDICTS` 改 `export`（零行为变化） | R4 |
| 11 | `agents/*.md`（15） | 重生成（命令细节见 §11.13） | §11.13 |
| 12 | `docs/agents/**`（16） | `generate --readme --apply` 重生成（`description` 随 `when` 变） | §11.13 |
| 13 | `tools/docgen/fixtures/*.evidence.json`（15） | `replace` 的 change 段会追加 `changes[]` + 更新 `renderSha256` / `lastWrittenHash` | §11.13 |
| 14 | `tools/docgen/test/sa-data-layer.test.mjs` + `2026-11-03-s-a-data-layer-design-testcase.md` | 夹具键 `returns` → `ghostField`；`shared.json` 键数断言 3 → 4 | R11 / R6 |
| 15 | `tools/docgen/test/pilot-data.test.mjs` / `tools/docgen/test/s2-card-rewrite.test.mjs` / `tools/docgen/test/tool-tiers.test.mjs` / `tools/docgen/test/sdet-data.test.mjs` | `trigger` 键集断言加 `kind`；`:15` 的旧 action 逐字断言换新文案；`F05` 的 `TRISTATE` 探针换 `VERDICT_HINT`；`tool-tiers.test.mjs:623` 的构造子串换新文案片段；`sdet-data.test.mjs:26` 的 `role` 逐字断言去 `资深` | R6 |

## 11.3 三态承载（R1–R6）

**改后卡面形态**（`## 本席清单` 段）：

```
| # | 条目 | 判据（判定取值：hit（命中）、miss（未命中）、na（不适用）；miss 与 na 须写 reason，缺 reason = 废卡；na 还须写明为何不适用） | 类型 |
|---|---|---|---|
```

- 括号内 = `VERDICT_HINT` 的值；`renderCard` 只做字符串拼接（不含三值字面，`S2-TC-E07` 仍绿）。
- 列数**仍 4**（`S2-TC-D03` 不动）；表头**偏长是刻意的**：D16 ⑤ 要求「无理由的 na 判废卡」必须留在卡面上，而 D16 ③ 又只允许「表头一行」，两者只能挤在同一处（议会轮 1 的 R-4 提过压缩，裁定 = 不压，理由记此）。
- `## 一定会` 段末 5 行**全部消失**：段内只剩 bullet 行与模板里那两行 `>` 引语。
- **卡面恰一处**把三值称为「判定取值」：`产物字段名只许：hit / miss / na / reason / evidence / verdict` 那行把它们列为「允许出现的名字」，不是第二处取值声明（新增一条断言把这一点钉死）。

**冻结断言的改后判据**（每条都要能红）：

| 原用例 | 原判什么 | 改后判什么 |
|---|---|---|
| `S2-TC-A01`(`:74`) | 导出集合含 `TRISTATE` | 导出集合**恰等** `ALLOWED_PRODUCT_NAMES / FORMAT_CHECKS / TYPE_LABELS / VERDICT_HINT` |
| `S2-TC-A04`(`:96`) | `TRISTATE` 长 5、`[1..3]` == `VERDICTS` | `VERDICT_HINT` **以「判定取值：」开头**、含 `Object.keys(VERDICTS).join(' / ')` 形态的三值、含 `reason` | 
| `S2-TC-A05`(`:105`) | 三态换序 / 多一行即红 | 喂「手写三值串（顺序反了）」/「缺 `na`」两个坏值必须抛 |
| `S2-TC-A10`(`:163`) | `export const TRISTATE` 定义恰 1 处 | `export const VERDICT_HINT` 定义恰 1 处，且全 `tools/` 内 `TRISTATE` 命中 **0**（现 47 处，其中非测试 10 处） |
| `S2-TC-B08`(`:253`) | 改 `TRISTATE[0]` 渲染跟随 | `VERDICT_HINT` 是**字符串、不可就地改**：副本内（`withRepoCopy`）在其值前插探针串 → 重渲必须跟随；真仓 15 卡探针 0 命中 |
| `S2-TC-D04`/`D05`(`:446`/`:454`) | 「一定会」段末 5 行逐字等于 `TRISTATE` | 段末**不得**出现孤立 `hit` / `miss` / `na` / `reason` 四行之一（负例：副本回填一行 → 红） |
| `S2-TC-F05`(`:734`) | 夹具内存构造里 `CC.TRISTATE[0]` 存还原 | 换成 `VERDICT_HINT` 存还原（字符串，不做就地改） |
| `sdet-render.test.mjs:21` | 逐字 `\| # \| 条目 \| 判据 \| 类型 \|` | 逐字 `\| # \| 条目 \| 判据（` + `VERDICT_HINT` + `） \| 类型 \|`（不写字面三值） |

**新脚本 `check-tristate-header.mjs`**（V11 ②）：

- 输入 = `renderSeat(seat).card`（内存），**不扫整卡**（全文件扫会因「产物字段名只许：…」那行恒 15，负例失效——PRD V11 ② 原话）。
- 定位 `## 本席清单` 段 → 取首个 `|` 开头的行 → 该行须**逐字包含 `VERDICT_HINT`**（比「分别含三键」更强：只判三键时「手写串写全三值」仍绿）。
- 输出首行固定：`check-tristate-header: seats 15 / ok 15 / bad 0 => ok`；`bad > 0` → exit 1。
- **红态首行**（负例要判它）：`check-tristate-header: seats 15 / ok <k> / bad <n> => fail`；`n > 0` → exit 1。

## 11.4 斜杠串 / 动作返回 / 人设（R7 / R8）

**斜杠串改法（逐席，只改文案）**：

| 现文案 | 改后 |
|---|---|
| `当主持人调度对 PRD/spec/plan 做产品视角评审` | `当${@hostTerm}调度对 PRD、spec、plan 做产品视角评审` |
| `当主持人调度对 spec/plan/技术方案做后端视角评审` | `当${@hostTerm}调度对 spec、plan、技术方案做后端视角评审` |
| `当主持人调度对描述性/记录型/任意文档做读者视角评审` | `当${@hostTerm}调度对描述性、记录型、任意文档做读者视角评审` |
| `当需要通读长文并交出可核对的原文与行号（交接取证 / 事实基线回核）` | 括号内改 `交接取证、事实基线回核` |
| `当需要为 PRD/spec 设计并编写测试用例（testcase.md），或专门找出被忽视的边界与失败场景` | `当需要为 PRD、spec 设计并编写测试用例（testcase.md），或专门找出被忽视的边界与失败场景` |

**`duty.action` 重写（15 席）**：

- 统一句式：`对⟨本席评审对象⟩做⟨视角⟩评审，逐条给出判定与理由，结论写回⟨本席产物名⟩`。
  - **不写三态词**（不写 `hit/miss/na`，也不写「命中/未命中/不适用」）——三值只在表头声明一次（R8 / A-2）。
  - `⟨本席产物名⟩` 必须是**具体名**（如「问题卡」「观察记录」「testcase 文件」「交付物正文」「审计表」）：占位 `本席产物` 0 命中，且 15 席产物名至少 **3 种不同值**（R8 ③④）。
- 逐席文案由施工期定稿；定稿后须过 `validateCardModel` 的文本扫描面（`duty` 三字段在 `CARD_TEXT_FIELDS` 内）：禁指针词 + 章节号、禁硬编码数量、非议会席禁程序词。
- **`rationale` 同批删人设句**：现 11 席 `rationale` 以动作句开头（含 `资深`），而 `docs/agents/<seat>.md` 逐字投影它（`renderReadme.mjs:22`）。改法 = 开头那句人设换成「本席视角 + 拆卡依据」，保留其后「旧卡『你是谁』并入本段…」的结构化记录（那是设计依据，不是人设）。**改写时必须保住全部 `${@hostTerm}` 占位**：`detective-observer.json:90` 一行内有 2 处（一处引语、一处句末），`§11.7 ②` 的「18 次」判据会抓漏。

**人设词面**（V9 的并列判据，2026-11-04 S-E 批加严一条）：PRD V9 原词面 `资深` / `20 年经验` **必须 0**；再加严 `20 年` **必须 0**（覆盖 `深耕产品设计 20 年以上`，现盘 2 行）；**S-E 批（2026-11-04）再严一条 `十年` 必须 0**（覆盖「有十年以上经验的…」这类同义资历句；改前现盘三面合计 2，改文案 + 重生成后归 0）。**加严不放松**：PRD 判据的通过方向不变，故不回 PRD 改判据（PRD `:147` 的双份真相禁令只约束 D16 / D17 的**改写**，不禁止 spec 侧加严）。

- **`role` 也归人设面**（议会复核轮的 BB-1 抓出）：`senior-sdet` 的 `role` 现为「资深测试开发工程师（Senior SDET）」，是同一类资历套话。改法 = 去掉 `资深` 前缀（保留括号里的级别名），并同批改写 `sdet-data.test.mjs:26` 的逐字断言。三面清零 = `data/seats/**` / `agents/*.md` / `docs/agents/*.md`。

## 11.5 trigger 四型（R9 / R10）

| kind | 中文判据（住 `check-trigger-kind.mjs` 文件头） | 本段席数 |
|---|---|---|
| `dispatch` | 由主持人点名派活：说清对象 + 视角 + 动作 | 11（`reviewer-product` / `-interaction` / `-ui` / `-frontend` / `-backend` / `-ops` / `-qa` / `-ai` / `-security` / `-actuary` / `-reader`） |
| `occasion` | 某个评审场合需要才起：场合 + 该场合要核的东西 | 1（`reviewer-audit`，`when` 原文「当议会评审需要过程标准核对、轮际对账或交付审计」） |
| `moment` | 某个时机之后必做：时机 + 动作 | 1（`detective-observer`：每轮答辩结束后） |
| `need` | 当需要某项专门产出时才起：需要 + 产出 | 2（`evidence-reader` / `senior-sdet`，**非议会席只许本值**） |

- **D4 的处置**：`reviewer-audit` 的 `when` **一字不动**——那三个类目名是「**场合名**」，正是 `occasion` 判据要求的形态（「某个评审场合需要…」）；改句反而会撞 `pilot-data.test.mjs:26` 的逐字断言，并把 `occasion` 用光、逼出「四值只在册不用」。改成可执行动作的是它的 **`duty.action`**（§11.4）。
- `check-trigger-kind.mjs` 输出首行固定：`check-trigger-kind: seats 15 / kinds {dispatch:11,occasion:1,moment:1,need:2} / bad 0 => ok`；红态 `=> fail` + exit 1（并打印 `seat` + 实际值）。输出**附**每席 `when` 前 12 字供人工抽核（`residual`）。
- 非议会席名单**现算**（不以 `reviewer-` / `detective-` 开头的席），不写死。
- **第二处名单要加相等断言**：`cardPipeline.mjs:29` 另有写死的 `NON_PARL_SEATS = ['evidence-reader', 'senior-sdet']`（喂 `env.parliamentSeats`，是 S1 `ProceduralWordOutsideParliament` 的判定面）。本段**不改**它，但加一条断言：脚本现算集合 == `complement(buildEnv(<任席>).parliamentSeats)`。
- `kind` 不进 `card`（8 键不动）、不进渲染（R9）。**留观**：若将来要按 kind 调度，再议是否投影到 `docs/agents`（触发 = 首次出现「按 kind 选席」的需求）。

## 11.6 `needs` 槽与长度约束（Q4）

- **槽位现状**：`card` 8 键 + `duty` 4 键里没有 `needs` / `purpose` / `method`。取数（2026-11-04 实测，`tools/docgen` 的 `.mjs` + `.json`，**行口径** = `Select-String` 命中行数）：`needs` **0**；`purpose` **22 行**（`commands.mjs` 9 + `policy-pure-source.test.mjs` 13；出现次数另计 26，判据不引用）；`method` **1 行**（`card-model/expression.mjs:11`）。故 Q4 的「`needs` 槽删除」在本段 = **判据落「三词在卡模型键面 0 命中」**（防将来有人新加），不产生数据改动。
- **长度约束**：`categories[].label` 每项 ≤ **20 字**（15 席 97 项，现最大 13 字）。**口径声明**：这是 Q4「每项 ≤ 20 字」在**现存唯一同类槽**上的**替代目标**（不是 Q4 原文对象——原文对象是三个不存在的槽）。
- **`≤ 5 条` 不适用**：三槽都不存在；`categories` 现有 4–9 条，套 5 条上限会改 9 席的数据形状，超出「只动卡面形状」边界。**登记为不作红点，并挂触发条件**：若将来新增 `needs` / `purpose` / `method` 任一槽，`≤ 5 条` 与 `每项 ≤ 20 字` 同批生效（判据随槽一起落，不得只落其一）。

## 11.7 `HOST_TERM`（R12）

- `shared.json` 加 `"hostTerm": "主持人"`（唯一写死处）；席位数据 **17 行 / 18 次**字面全改 `${@hostTerm}`（12 行 `trigger.when` + `detective-observer` 的 `signals[].observer`、两条 label、两席 `rationale`；`detective-observer.json:90` 一行含 2 次）。
- 五条判据（**计数口径写死为「出现次数」**）：
  - ① `shared.json.hostTerm === '主持人'`；
  - ② `seats/*.json` 中「主持人」**0 次**，`${@hostTerm}` **18 次**；
  - ③ 渲染后 15 卡「主持人」总数 = **30**（12 席 × 2 + `detective-observer` 6；改后必须仍是 30——等价性证明）；
  - ④ 探针（**副本内** `withRepoCopy` 改 `hostTerm` 为 `议长`）：重渲 `议长` 必须出现、`主持人` 归零，真仓 15 卡不被写入；
  - ⑤ **大写形态兜底**：`seats/*.json` 中 `@HOST_TERM` / `${@HOST_TERM}` **0 次**，且展开后 15 卡 `${@` 残留 **0**。理由：`PART = /\$\{@([a-z][A-Za-z0-9]*)\}/g` 要求首字符小写，**大写不匹配也不抛错**（实测 `expandRefs('${@HOST_TERM}', …)` 原样返回）；而 `gate` 比的是「盘 == 渲染」同源产物，两边同错仍绿。
- `MixedTermInCard`（`议长` + `主持人` 同卡）不受影响：探针在副本里、真仓不写盘。

## 11.8 验收映射（PRD V 编号 → 本段判据）

| PRD V | 本段落点 | 可判形态 |
|---|---|---|
| V1 | 本行 + testcase 的 GATE 面 | PRD §2 / §3 行数与「依据」列空值数：`D 17 / Q 8 / empty 0`（S-C 不得改 PRD 功能点集合；R5 的回归锚） |
| V2 | plan 的 `check-plan map` | `map: missing 0 dangling 0`（归计划门） |
| V3 | `npm run check` | `# fail 0` 且 `# tests ≥ 1481 + 本批新增` |
| V9 | §11.4 | `资深` / `20 年经验` / `20 年` / `十年` 计数 **0**，三面同判（出现次数）：`data/seats/**`（`资深` 22）、`agents/*.md`（10）、`docs/agents/*.md`（12）；`十年` 由 S-E 批（2026-11-04）加严（改前三面合计 2 → 改后 0） |
| V10 | §11.5 | `check-trigger-kind` exit 0；`kinds {dispatch:11,occasion:1,moment:1,need:2}` |
| V11 | §11.3 / R11 | ① `tools/docgen` 下 `returns` **0 次**（现 3）；② `check-tristate-header` → `ok 15 / bad 0` |
| V12 | R7 | 四面斜杠串 **0 项**（现 13）；负例注入 1 项必红 |

## 11.9 硬约束（每条对应一个可判动作）

| 约束 | 判法 |
|---|---|
| 卡面 7 段结构、front matter、12 键契约不动 | `CARD_SEGMENTS` 断言 + `check-shared-refs` 的 8/12 键 |
| `CARD_MODEL_CODES` **36 码零新增**；`SCAN_FIELDS` 仍 8 键 | `card-model.test.mjs` 既有断言（不动） |
| `enums.mjs` 零改动 | `S2-TC-A10` 尾句 + `S1-TC-A01` 的 8 表计数 |
| 模板 / 渲染器 0 契约字面 | `S2-TC-E07`（`VERDICT_HINT` 只在 `card-contract.mjs`） |
| 双份真相禁令 | 只引用 D/Q/V 编号；PRD 正文 0 改动（加严只加严，不改 PRD 判据） |
| 15 席重生成走两步写盘 | `draft` → `diff` → `replace --draft … --expect-change <渲染 sha> --rejudge <触达键> --yes`（缺旗标即 `UnapprovedChange`；`touchedSemanticKeys` 漏报即拒） |
| 语义键变动须独立判者 | `DOCGEN_JUDGED_BY` 必须是**独立于施工者**的实例；`fixtures/*.evidence.json` 的 `changes[-1].judgedBy` ≠ 施工者 |
| 一次性 / 批次形态断言归 `SB_SHAPE_ONESHOT=1` | S-B testcase `:555`；S-C 改卡面后 `SB-TC-06` / `SB-TC-32` / `SB-TC-25④` 与**本批的现值型断言（13 项 / 18 次 / 30 次）**全归一次性档，`SB_BASE` 换本批 `$BASE`；常驻只留「改后 = 0」 |
| `# tests` 不得低于基线 | 1481 + 本批新增 |
| **本批必须自建 impact-sheet 且覆盖 33 个口径 ID + 全部命中文件** | 本批已建 `.session/reviews/2026-11-04-0840-…/impact-sheet.md`（33 ID + 18 命中文件）。漏写会让 `sweep` 报「清单缺口径」并把 4 条 sweep 用例一起带红（起草期实测踩过：`# fail 4`，不是 4 个独立缺陷） |
| **施工第 0 步先复现 `# fail 0` 并冻结 4 件基线** | `npm run check` 记 `# tests`；`git rev-parse HEAD` 记 `$BASE`；15 卡 `Get-FileHash` 记 SHA；`check-plan size` 记 `cases`（PRD §8「冻结基线」四件，本段承接；`1405` 不引用） |
| 判据命令一律禁 `node -e` | 计数 / 断言走 `node --test` 或只读脚本；`Select-String` / `git diff` 的退出码不作判据。**副本取数**允许子进程跑「写在副本里的探针脚本」，但判据的 `assert` 必须留在父测试里（不把子进程输出当唯一判据） |

## 11.10 测试

**测什么 / 为什么**：

1. **三态承载的单一性**：卡面只有一个地方说三值（表头），且它派生自 `VERDICTS`；`TRISTATE` 与 5 行常量在全仓 0 残留。
2. **表头可红的判别力**：删值 / **换手写串** / 挪出段三种坏形态都必红（`bad 15 / ok 0` 形态），且不得因整卡扫描而恒绿。
3. **四字段斜杠串清零**：13 项 → 0 的**同一命令**在改后仍能判红（注入一处 → 项数 1）。
4. **动作行**：每席含「写回」、产物名非占位、15 席产物名 ≥ 3 种；人设词清零；**动作行不含三态词**。
5. **trigger 四型**：四值全用上、非议会席只许 `need`、名单现算；第二处名单与 `env.parliamentSeats` 相等。
6. **长度与槽位**：`categories[].label` ≤ 20 字（注入 21 字 → 红）；三词槽计数 0。
7. **`HOST_TERM` 单源**：副本探针跟随、数据面 0 字面、渲染总数 30 不变；大写形态与 `${@` 残留 0。
8. **跨包三值相等**：`observation-check` 的三值 `Set` 与 `docgen` 的 `VERDICTS` 逐字相等。
9. **回归面**：`gate` exit 0 + 15 席 `disk == render` + `npm run check` 全绿 + V3 计数不低于基线 + 4 处漏项断言（R6）逐条仍绿。

**观测项（只记录，不设红点）**：15 卡「去换行总字符」与「本席清单段字符和 / 判据列字符和」的**前后两值**（PRD `:76` 的口径）；`trigger.kind` 与 `when` 的贴切度由审计席抽核 3 席。

**测试用例文件**：`2026-11-03-s-c-card-shape-design-testcase.md`（由 `senior-sdet` 在全新上下文编写；每条五要素齐、负例 + 边界合计 ≥ 正例）

**只手动验证**：`duty.action` 的「切题性」——机械判不了，归 `residual`。

**不测**：卡面排版美学；`trigger.kind` 分得「最合理」与否（只判在四值内 + 非议会席限制）；`≤ 5 条` 条数上限（槽不存在，见 §11.6）。

## 11.11 差异清单（与 PRD / S-A / S-B 的理解差异与裁定）

> ② 段出口判据之一。testcase 由独立 `senior-sdet` 实例编写，交付后逐条回填；**未决必须为 0** 才可送议会。

| # | 差异点 | spec 原口径 | testcase 指出 | 裁定（回填位置） |
|---|---|---|---|---|
| D-a | S-A R8 承诺「`trigger.kind` 字段位由 S-A 落」 | 本段补落 | 14 席 `when+route` / 1 席 `when+route+notWhen`，`kind` 0 席 | **按「S-C 补落」**：R9 / §11.5；`notWhen` 席不另设规则 |
| D-b | `HOST_TERM` 命名 | 数据键 `hostTerm`，不建 JS 常量 | `WHOLE = /^@([a-z][A-Za-z0-9]*)$/` 首字符须小写 | **按数据键**：R12 不变；补 §11.7 ⑤ 大写插值兜底 |
| D-c | `≤ 5 条` 条数上限 | 不适用，不作红点 | 同意（判「三词槽 0」，不判条数） | **按不适用 + 挂触发条件**：§11.6 第三段 |
| D-d | V11 ① 与 S-A 夹具冲突 | 改夹具键名，判据不动（用户 2026-11-04） | 3 处命中全在测试夹具 | **按改夹具**：R11 / §11.2 #14 |
| D-e | 三态中文释义是否保留 | 并入 `VERDICT_HINT` | 仍可判（只判派生前缀 + `reason`） | **按并入**：R2（并补回「缺 reason = 废卡」） |

**testcase 的 7 条异议（裁定）**：D-1（`# fail 4`）→ 根因 = 本批 impact-sheet 漏 33 个口径 ID，已补全 → `sweep ok` / `# fail 0`（落 §11.9 两条硬约束）；D-2（17 处）→ **18 次**（§11.7 ②）；D-3（28）→ **30**（§11.7 ③）；D-4（`cardPipeline.mjs:29` 第二处名单）→ 加相等断言、不改名单（§11.5）；D-5（表头判据强度）→ 取「逐字含 `VERDICT_HINT`」（§11.3 脚本判据）；D-6（`purpose` 22 vs 26）→ 行口径 22（§11.6）；D-7（大写插值静默）→ 补判据（§11.7 ⑤）。

**议会轮 1（5 席）的 23 张卡（逐张裁定）**：

| 卡 | 席 | 级别 | 裁定 | 回填位置 |
|---|---|---|---|---|
| R-1 | 读者 | P0 | **承认**：表头缺「判定取值」主语 | R2（`VERDICT_HINT` 以「判定取值：」开头 + 中文对照） |
| R-2 | 读者 | P1 | **承认**：动作行可空转 | R8 ③④（产物名非占位 + ≥3 种） |
| R-3 | 读者 | P2 | **部分承认**：四值中文判据住脚本文件头（已在 §11.5 表 + 脚本头）；不投影到卡面 | R9 留观段 |
| R-4 | 读者 | P2 | **不压表头**（与 D16 ⑤ 冲突：压掉就得挪走 na 条件，而卡面只许表头一行） | §11.3 「偏长是刻意的」 |
| Q-1 | 测试 | P0 | **承认**：`S2-TC-B08` 的副本探针被错指到 `hostTerm` 用例 → 须补一条 `VERDICT_HINT` 探针用例 | testcase 修订（待回填） |
| Q-2 | 测试 | P0 | **承认**：删表头一值是全局共用函数 → 应 `bad 15`，不是 `bad 1` | testcase 修订 |
| Q-3 | 测试 | P0 | **承认**：现值型断言（13 / 18 / 30）施工后必翻红 → 归 `SB_SHAPE_ONESHOT=1` | §11.9 + testcase 修订 |
| Q-4 | 测试 | P0 | **承认**：「手写串」负例缺失（D-5 的正面要求） | §11.10-2 + testcase 修订 |
| Q-5 | 测试 | P1 | **承认**：`COPY` 取数形态未定 → 补口径（子进程只取数，`assert` 留父测试） | §11.9 末行 |
| B-1 | 后端 | P0 | **承认（本轮最实质）**：漏 4 处既有断言（`shared.json` 恰 3 键、`trigger` 键集、`F05` 探针、`when` 逐字） → 补进 R6 / §11.2 | R6 / §11.2 #14·#15 |
| B-2 | 后端 | P1 | **承认**：`§11.4` 改 `reviewer-audit` 的 `when` 与 `occasion` 语义冲突 → 改为**不改 when**（§11.5 D4 处置） | §11.5 |
| B-3 | 后端 | P1 | **承认**：`replace` 旗标缺、`fixtures/*.evidence.json` 未列落点 | §11.9 / §11.2 #13 / §11.13 |
| B-4 | 后端 | P1 | **同 Q-3**（testcase 现值断言） | §11.9 |
| A-1 | AI | P0 | **承认**：三值在卡上被两处互斥命名（字段名 vs 取值）+「缺 reason = 废卡」丢失 | R2 + §11.3「恰一处称判定取值」断言 |
| A-2 | AI | P1 | **承认**：动作行的中文三态与表头英文形成第三种说法 → 动作行禁写三态 | R8 |
| A-3 | AI | P1 | **同 R-2** | R8 ③④ |
| A-4 | AI | P1 | **部分承认**：kind 不渲染（留观）；「`when` 与 kind 句式对应」判据属语感 → 改为输出 `when` 首 12 字供抽核 | R9 / §11.5 |
| A-5 | AI | P2 | **承认**：无 token 记录 → 加观测项（只记录不设红点） | §11.10 观测项 |
| P-1 | 产品 | P0 | **部分承认**：D6 的 4 条逐项缺返回**不在本段处置**（D16 ④ 禁逐项字段）→ 登记延期并写明理由与判据替代 | §11.12 |
| P-2 | 产品 | P0 | **承认**：无回退节 | §11.14（新增） |
| P-3 | 产品 | P1 | **部分承认**：不就地改 PRD 判据（加严不改原文）；PRD `:147` 的禁令只约束 D16/D17 的改写 | §11.4 人设词面段 |
| P-4 | 产品 | P1 | **承认**：PRD §8 冻结基线未承接 | §11.9「施工第 0 步」 |
| P-5 | 产品 | P2 | **同 D-c**（Q4 降级）→ 挂触发条件 + 注明替代目标 | §11.6 |

**未决 = 0**（12 条异议 + 23 张卡全部有裁定与回填位置；testcase 侧的 5 条待 sdet 修订轮 3 回填）。

## 11.12 不在这一轮

- 卡面七段结构、front matter、`SCAN_FIELDS`（8 键）、`CARD_MODEL_CODES`（36 码）、12 键契约 → 不动
- `outputFormats` / `policy/**` / `renderBoundary` → S-B / S6 已签，只引用
- `check-prd-rows.mjs`（PRD V1 点名的脚本）→ **不在 S-C 建**：V1 的实质（`D 17 / Q 8 / empty 0`）已由 ① 行签收（`gate-record.md:87`）；本段只加防回退断言（§11.8 V1）
- `check-plan coverage --stage` 对 `S-A/S-B/S-C` 形态 PRD 结构性 exit 2（无 F→S 表）→ 沿用 S-A / S-B 的手工核对表
- **D6 的「逐项返回文案重写」延后**：PRD §9③ 的宾语是 `checkItem`，但 D16 ④ 明令不得新增逐项字段；97 条 criterion 文案重写也超出「只动卡面形状」边界。**本段判据替代** = 表头一处声明三态（R1）+ 动作行「写回」（R8）；**延期落点** = `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md`（触发 = PRD 下一次修订或出现「逐项判定」的真实消费者）；**签字人** = 用户（D16 是用户裁定，改它必须回 PRD 重签）
- **`trigger.kind` 投影到卡面 / `docs/agents`** 留观：触发 = 首次出现「按 kind 选席」的需求
- 议长 / 席位化谓称升级（Q1 的「将来」）→ 只留 `hostTerm` 一个改动点

## 11.13 施工命令与产物

- 逐席：`node tools/docgen/cli.mjs draft --kind agent --name <seat>` → `node tools/docgen/cli.mjs diff --kind agent --name <seat>` → `node tools/docgen/cli.mjs replace --kind agent --name <seat> --draft <草稿路径> --expect-change <渲染 sha256> --rejudge <触达的语义键> --yes`
  - 缺 `--expect-change` / `--rejudge` 漏报 `touchedSemanticKeys` → `UnapprovedChange`（`tools/docgen/cli.mjs:543-558`）；判者标识由 `DOCGEN_JUDGED_BY` 提供（`tools/docgen/cli.mjs:560`），**必须是独立于施工者的实例**。
- `replace` 的 change 段会更新 `tools/docgen/fixtures/<seat>.evidence.json`（`renderSha256` / `lastWrittenHash` / `changes[]`）；这些文件属本批产物。
- 15 席重生成后：`node tools/docgen/cli.mjs generate --readme --apply` 落 `docs/agents/**`（16 份）。

## 11.14 回退面（议会轮 1 的 P-2 补出）

| 步 | 动作 | 复验 |
|---|---|---|
| 1 | `git checkout -- tools/docgen tools/observation-check scripts agents docs/agents docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md docs/superpowers/specs/2026-11-03-s-a-data-layer-design-testcase.md` | `git status --porcelain` 只剩本段**新增**文件（两个新脚本、`tools/docgen/test/sc-card-shape.test.mjs`、spec、testcase、`docs/after/20261104101304-…`）+ 交接词 `docs/handoffs/2026-11-04-s-c-card-shape.md`（开工前就在跟踪外，回退前须先提交或移出） |
| 2 | 删两个新脚本 `tools/docgen/check-trigger-kind.mjs` / `check-tristate-header.mjs` **与**本段新增测试 `tools/docgen/test/sc-card-shape.test.mjs`（`git checkout` 不删新建文件，残留 = 回退未完成） | `git status --porcelain tools/docgen` 为空 |
| 3 | S-A 夹具名复原（`ghostField` → `returns`）与其 testcase 文案复原 | `node --test tools/docgen/test/sa-data-layer.test.mjs` 全绿 |
| 4 | 复跑 `node tools/docgen/cli.mjs gate` + `npm run check` | `gate` exit 0 且 15 席 `disk == render`；`# fail 0`；末行 `check 全部通过` |

## 11.15 与已签件的关系

- **改写**（已签测试断言的同批改写，共 5 个测试文件）：`s2-card-rewrite.test.mjs`（A01 / A04 / A05 / A10 / B08 / D04 / D05 / E05 / **F05**）、`sdet-render.test.mjs:21`、`sa-data-layer.test.mjs`（TC-015 夹具名 + `shared.json` 键数）、`pilot-data.test.mjs`（**`:15` 的旧 action 逐字断言** + `:24-26` 的 `trigger` 键集）、`tool-tiers.test.mjs:623`（构造子串）、`sdet-data.test.mjs:26`（`role` 去 `资深`）—— 属改已签件，须在 `gate-record.md` 的 `②@S-A` 行做「签后增量登记」（S-B 做过三次，样式见 `:89`）；`tool-tiers` 属 S5 已签件、`sdet-data` 属 S1 已签件，一并登记
- **就地加注**：`2026-11-03-s-a-data-layer-design.md` §10.1 R8 补一句「字段位实际由 S-C 落」，不改结论
- **不改**：S-B 的 spec / testcase / plan；PRD 正文
- **保留**：PRD 全部 D/Q/V 正文；**取代** 无
