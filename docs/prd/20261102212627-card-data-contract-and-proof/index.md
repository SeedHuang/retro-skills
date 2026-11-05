# 卡面数据契约与证据形式（PRD，已裁定）

> 状态：**已裁定（需求侧）｜承载面待 ② 段议**　**载体已迁（2026-11-05）**：本文提到的 `skills/dev-workflow/references/gate-record.md` 已迁至 `docs/devworkflows/<YYYYMMDDHHmmss>-<任务名>/gate-record.md`；旧路径删除提交由 `git log --diff-filter=D -1 --format=%H -- skills/dev-workflow/references/gate-record.md` 取回。正文与结论不改（历史签字件）。｜创建 2026-11-02｜来源：2026-11-02 与用户的逐轮讨论（起点 = 「`agents/reviewer-actuary.md` 里 `hit`/`miss`/`na`/`reason` 四行是什么意思」）
> **去向**：拆成可施工 spec 进 `docs/superpowers/specs/`；本文件**保留不删**（PRD 生命周期 = 被取代时原文保留）。
> **与已签件的关系**：不改 `observable-criteria-rollout` PRD（S1/S2/S3 已签收口）；与 `agent-card-contract` / `agent-card-s4-render` 的冲突点在 §5 单列。
> **口径约定**：本文件所有字符数、处数均附取数命令；未标口径的数字一律不算证据。
> **路径约定**：未写全路径的模块名按首次出现处所在目录读——`policy/**`、`templates/**`、`components/**`（含 `agentData.mjs`、`cardPipeline.mjs`、`renderCard.mjs`、`renderBoundary.mjs`、`outputFormats.mjs`、`patternRegistry.mjs`）相对 `tools/docgen/`；`enums.mjs`、`validateCardModel.mjs` 相对 `tools/docgen/card-model/`；`card-contract.mjs` 相对 `tools/docgen/card-model/vocab/`；`cards.md` 相对当前评审账本。已写全路径者以全路径为准。

## 1 要解决什么

| # | 缺陷 | 实测证据（命令 → 输出） |
|---|---|---|
| 1 | **卡面声明的三态与记录层不一致**：`hit`/`miss`/`na`/`reason` 四行孤立常量，读者不知填在哪；`na` 无门槛 | **声明层**：`outputFormats.mjs` 的五产物（`observation`/`audit`/`issue-card`/`evidence`/`testcase`）无一含 `verdict` 字段（`audit` 只到「结果」列且未定义取值）；**记录层**：`tools/observation-check/checks.mjs:92-99` 已强制 `items[].verdict ∈ VERDICTS`、`miss`/`na` 必带 `reason`（`UnknownVerdict` / `MissingReason`），并每次 `npm run check` 由 ⑥ 段执行。两层之间**没有任何指针** → 卡面读者不知要写进 `items[]` |
| 2 | **枚举被写成斜杠串，且 duty 面无判据管** | `node -e` 扫 `duty` 三字段含 `/` 的项 → **13 处**；`validateCardModel.mjs:280` 的 `FreeTextEnum` 只扫 `Action.trigger` |
| 3 | **证据形式用最贵且会漂的那一种** | 本轮 3 次漂移（三例均给脚本名与行号）：① `s3-predicates.test.mjs` 的 `:871`→`:880`；② `scripts/check-all.mjs:355` 的 ④ markdown 段门行 `375`→`376 个文件`；③ `scripts/check-gate-record.mjs:90` 的 `rows 53`→`rows 54`。②③ 的共同点：这两数是「仓内规模」的函数（`.md` 份数 / 门行数），**写死即漂**，故此处不抄现值。原始记录在 `.session/reviews/2026-11-02-101312-observable-s3-spec/impact-sheet.md` §十七/§十九（该目录不进 git，故改给脚本名） |
| 4 | **策略清单被整段渲染进卡面**：源已单份，产物是两份逐字相同的长清单 | 边界段由 `templates/boundary.md.tpl`（`{{FORBIDDEN_PATHS}}` 等槽位）+ `renderBoundary.mjs:193` 渲染；路径清单唯一源 `policy/definitions/paths.mjs`；两卡该行各 **371 字符、逐字相等**（`-eq` 实测 `True`），共 **23 项**路径（口径：该行「逐项点名：」至「；兜底句」之间按 `、` 切分 → 23 段；`(Get-Content agents\reviewer-audit.md)[95].Length` → 371）。**源层无第二份** |
| 5 | **agentData 是元数据却写成代码，共享部分靠字面复制** | `agentData.mjs` 中 `越出边界的动作只记录，不自行处置` **13 处**；`条 checkItem` **14 处**；`当主持人调度对…` **22 处** = **11 席 × 2**（`duty.trigger` 与 `triggerTable.when` 各一，故「11 席」不等于「11 处」）；`cardOf(` **13 次调用**（第 14 处是函数定义，`agentData.mjs:8`），全是搬运、无共享机制 |
| 6 | **同一事实两处存放**：`duty.trigger` 与 `triggerTable.when` 逐字相同；`description` 只由后者生成，而 8 键扫描面只含前者 → 斜杠串从 `description` 漏检 | `agentData.mjs:123` vs `:307`；`cardPipeline.mjs:59-64`；`enums.mjs:86-104` |
| 7 | **「做法」只写自由句，不指向已注册契约，既费 token 又不可测** | 卡面「并写出原文引句」类判据 **88 行 / 3832 字符**，占 15 卡去换行正文 **32517 字符的 11.8%**（`Get-Content -Raw` 含换行为 33730、11.4%）；而 `outputFormats.evidence` 已定义「摘句 / 文件+行号 / 用途」且 `tools/observation-check/evidence.mjs:76` 的 `checkEvidence()` 已实现「摘句能在源文件检索到且行号那行包含它」——88 条无一指向它 |
| 8 | **项目专属路径混进通用角色卡，且含已不存在的目录** | `policy/definitions/paths.mjs` 仍有 3 项本仓专属（`skills-lock.json`、`lessons/`、`tools/docgen-spike/.tmp-test/`，末者已不存在），且被渲染进 **2 张卡**（`reviewer-audit` / `detective-observer`）的禁止清单（`(Select-String agents\*.md -Pattern '逐项点名' -List).Count` → 2；其余 11 席走 `DEFAULT_BOUNDARY`、`senior-sdet` 走 `SDET_BOUNDARY`、`evidence-reader` 走自有句，15 = 2 + 11 + 1 + 1，`patternRegistry.mjs:36-40`） |

> **已移出本 PRD**：原「缺陷 4 · 位置型判据提交后必红」与「卡面数据契约」不同族（属 R8 回扫机制），落点 `docs/after/20261102222831-r8-mtime-criterion-open-decisions.md`。

## 2 已定结论（用户已裁定）

| # | 结论 | 依据 |
|---|---|---|
| D1 | 卡面 `role` 与 `action` 重复，`action` 里的身份重述应删 | 用户 2026-11-02「L46 和 L39 是不是重复了」+「的确可以去掉」 |
| D2 | 「资深」「20 年经验」这类不带来额外技能的人设套话应删 | 用户「加上额外技能，如果不会，就没用」 |
| D3 | `PRD/spec/plan` 是三个枚举值；同类斜杠串一律数组化 | 用户「PRD/spec/plan 这也是三个选项」 |
| D4 | 「过程标准核对 / 轮际对账 / 交付审计」是类目名，不是动作；`trigger` 不应装类目名 | 用户「这三个动作是抽象的……主谓宾状语，结果是不明确的」 |
| D5 | 明确动作 = 主语 + 动作 + 宾语 + 条件 + **明确返回** | 用户给出的定义（全篇判据基石） |
| D6 | `hit`/`miss`/`na` 的本质 = **criterion 的返回类型** | 由 D5 推出；`checkItems` 7 条里 4 条「核对…是否…」缺返回 |
| D7 | 证据三档：命令锚 > 内容锚 > path:line；**只改偏好不改必填**（门行仍允许 path:line） | 本轮 3 次漂移 + 用户「path:line 真的容易漂移」「比打勾更耗 token」 |
| D8 | 打勾对 AI 不构成证明；补法 = 署名 + 不得自签（**已由 R2 覆盖**）+ 随机抽核：**执行者 = 审计席**；每轮抽 3 条；记录落账本 `cards.md` 的「抽核」节（固定 3 行）；**抽中不成立算 P1**、**抽核未做算 P2** | 用户「这个取决于写的人是否诚实」+ 议会 r2 AI 席 I-3（执行者无归属） |
| D9 | 最强证明 = 单元测试；链条 = 需求点可枚举 → 映射无缺 → 测试全过 | 用户「有对应的单元测试，你就能证明你做过，且做好了」 |
| D10 | 「主持人」做成 `HOST_TERM` 常量；将来议长成席位再升级为席位引用 | 用户「这个可以作为一个变量吗」+「先按照 A 来」 |
| D11 | 卡面「能写哪、能跑什么命令」属**策略**；归 `policy/**`，卡面只写「档位 + 指针」 | 用户「有些应该使用 skill 来解决的问题，都写在 hardcode 在 agent 文件内部」 |
| D12 | `agentData` 是元数据，拆独立 JSON（`shared.json` + `seats/<seat>.json` + `@` 引用 + 装配前一次性纯函数展开）；**加载器与展开器的文件名由 S-A 的 spec 定**（PRD 只定形状与时机：装配前一次性、纯函数、无副作用） | 用户「是不是应该分成独立的 json」+ 纠正「怎么复制 11 份呢？他只是把共享的独立的拆开了」 |
| D13 | 角色卡只装跨项目通用职责；项目专属路径不得进卡面 | 用户「作为一个通用场景的 agent，这些目录可能很多情况下都是没有用的」 |
| D14 | 卡面「做法」必须指向已注册契约或校验器；可执行部分由脚本判，**切题性**（`residual` = 机械判不了的残余项，首现即此处）归 `residual` 抽核 | 用户「如果这个动作是一个具体的 skill 是不是就可测的了」+「同意…… evidence 契约 + 校验器 方案」 |
| D15 | 不新建 5 个 skill（88 条已由 `cardOf` 一行模板生成，建 skill 的边际收益只是「起名字」） | 2026-11-02 精算结论 |
| **D16** | **三态承载面定死：不新增逐项字段** ① **卡面侧唯一源** = `VERDICTS`（`card-model/enums.mjs:47`，3 值；记录层 `tools/observation-check/checks.mjs:6` 另有一份三值字面，**属跨包重复，须加一条相等断言**，V11 扫 `tools/docgen` 覆盖不到它）；② **唯一判定面** = `tools/observation-check/checks.mjs:92-99`（`items[].verdict ∈ VERDICTS` + `miss`/`na` 必带 `reason`，`UnknownVerdict` / `MissingReason`；每次 `npm run check` 由 ⑥ 段执行）；③ **卡面** = 「一定会」段末 5 行 `TRISTATE` 删除，改由 `## 本席清单` 表头一行给出取值（由 `VERDICTS` 派生），**不加列**（列数仍 4）；④ **不新增 `checkItem.returns`**——逐项字段既无码位、无消费者，又会让取值出现第三份副本；`checkItems[].returns` 计数必须为 0（V11 判）；⑤ `na` 的合法条件 = 必须写明为何不适用（引上游件——本 PRD / spec / rule——的节号或行号），无理由的 `na` 判废卡 | 议会 r1 的 P0 + r2 产品席 P-8 / 后端席 B-1 + **r3 后端席 B-8** / 测试席 T-5 |
| **D17** | **`when` 唯一源 = `triggerTable.when`**；`duty.trigger` **一律改为装配期注入**（不取「删除」分支——删了 `duty.trigger` 后 V12 两面都无字段可判）；`description` 纳入文本扫描面，消除「`description` 里斜杠串漏检」。**实现点两处，缺一即静默空转**：`enums.mjs:86-93` 的 `CARD_TEXT_FIELDS` + `validateCardModel.mjs:102-121` 的 `surfaceTexts`。**同批必须改写三条冻结断言**：`card-model.test.mjs:1125` / `:1131`（现状 `green(description …)` 明确要求 `description` **不扫**）与 `:1141`（`SCAN_FIELDS` 恰 8 键） | 议会 r1 后端席 B-2 + r2 后端席 B-6 + r4 后端席 |

## 3 裁定（用户 2026-11-02 逐条拍板）

| # | 问题 | 裁定 | 影响面 |
|---|---|---|---|
| Q1 | 「主持人 / 议长」口径冲突 | **保持「主持人」+ `HOST_TERM` 常量**；`docs/after/20261026164718-agent-card-composition-exploration.md` 的 D11（S3 后改议长）**标作废** | 13 张卡 / 29 处（`Select-String agents\*.md -Pattern '主持人'` → 29） |
| Q2 | `skills` 槽 | **不设**；由 D14 取代 | 1 席有值、14 席空 |
| Q3 | `categories` 复用为「关注点」 | **复用**；`action` 的关注点与 `categories` 同源 | 15 席渲染产物 |
| Q4 | `needs`/`purpose`/`method` 词表 | **不建全量词表**，改形状约束（条数 ≤ 5、每项 ≤ 20 字）+ **`needs` 槽删除**（依 D4） | 三类槽 |
| Q5 | 非议会席 `trigger` 形态 | **统一 4 种 `kind`**：`dispatch`（主持人调度 + 对象 + 视角 + 动作）/ `occasion`（某场合需要）/ `moment`（某时机后）/ `need`（当需要）；**每 kind 附一句中文判据**，非议会席（文件名不以 `reviewer-` / `detective-` 开头 = **2 席**：`evidence-reader`、`senior-sdet`）用 `need` | 2 席 |
| Q6 | policy 接线 | **已接线**（`renderBoundary` 从 policy 渲染），真问题是**渲染粒度**：卡面是否仍内联完整清单。裁定 = 改为「档位 + 指针」，清单留在 policy | 2 席边界段各 **2260 / 2220** 字符（口径：**不含** `## 边界` 标题行，从下一行起至下一个 `##` 前，逐行 `.Length` 求和，共 15 行；含标题则为 2265 / 2225、16 行） |
| Q7 | 数据拆分粒度 | **`shared.json` + `seats/<seat>.json`**（每席一文件） | 15 席 + 1 共享 |
| Q8 | policy 内历史/项目专属路径 | **删 3 项**（`skills-lock.json`、`lessons/`、`tools/docgen-spike/.tmp-test/`）→ 2 卡重渲染 + 基线更新；保留 `.gitignore` 兜底句 | `paths.mjs` 3 项 |

## 4 验收（每条都带退出码 + 负例）

| # | 验收项 | 命令 / 判据 | 改坏应红（负例） |
|---|---|---|---|
| V1 | 需求点无缺（本阶段 = 计数型） | 新脚本 `check-prd-rows.mjs <本 PRD>` → `D 17 / Q 8 / empty 0`（§2 恰 17 行 D、§3 恰 8 行 Q，「依据」列与「影响面」列 0 空；**该脚本必须容粗体行号**，行首正则为 `^\| \*{0,2}D\d+` / `^\| Q\d+`，否则 `**D16**` / `**D17**` 会漏数成 15）；拆出 spec/plan 后另跑 `check-plan.mjs coverage --plan <plan> --prd <带 F→S 表的新 PRD> --stage S-x` → `gap 0`。**本 PRD 不得作 `coverage` 的 `--prd` 输入**（无 F→S 表，实测 exit 2） | 删 §2 任一 D 行 → `D 16` → 红；清空任一「依据」格 → `empty 1` → 红 |
| V2 | 映射无悬空 | `check-plan.mjs map` → `missing 0 / dangling 0`；空心用例判据见 V7 | 删一条映射 → `missing 1` → 红 |
| V3 | 测试全过且**非零用例** | `npm run check` 的 `# fail 0` **且** `# tests ≥ 冻结基线 + 本批新增数`；**基线口径只认 `npm run check`**（现 `1405`）——裸跑 `node --test` 另报 `1409`（发现集不同），两数不可混用 | 删掉一个测试文件 → `# tests` 低于基线 → 红 |
| V4 | 渲染不变（数据层改造的硬约束） | 拆 JSON 后 `node tools/docgen/cli.mjs gate` → **exit 0**，且 15 席 `disk == render` 逐字节相等（`tools/docgen/cli.mjs:143-144` 逐席比对）。**`baseline 38/38` 不作判据**——它是同一表达式自除自的常量打印（`tools/docgen/cli.mjs:102`/`:228`），恒真 | 改任一 `seats/*.json` 值不重生成 → `Mismatch` → exit 1 |
| V5 | `@` 引用完整性 | 新脚本 `check-shared-refs.mjs`：悬空键 0、无嵌套、键集齐全（loader 产出的席文件 `card` 恰等 8 键；`buildCards()` 产物与 `CARD_KEYS` 恰等，12 键全量）——键名以 `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md:89` 为唯一源（`seat / name / description / tools / duty / scenes / signals / must / never / categories / checkItems / rationale`） | 写一个不存在的 `@` 键 → exit 1；少一个顶层键 → exit 1 |
| V6 | 引句真实性（D14） | 新脚本 `check-quotes.mjs`（复用 `checkEvidence()`）；**语料 = 真实产物 `docs/superpowers/reviews/**/observation-*.json` 的 `items[].evidence`**（**不用 `tools/observation-check/golden/*`**——自证是渲染夹具、禁止用于校验，见 `tools/observation-check/golden.test.mjs:1-5`）；**S-B 必须先落 1 份含 ≥2 条 `evidence` 的真实观察记录**，否则语料为 0；任一摘句不在源文件、或行号那行不含它 → exit 1；**fail-closed：扫到 0 条也 exit 1** | 把任一 `quote` 改一个字 → exit 1；语料清空 → exit 1（不是绿） |
| V7 | 映射用例非空心（原「token 降幅」已降级，见下） | 新脚本 `check-case-assert.mjs`：映射表引用的每个用例 ID，其用例体须含 ≥1 条**非** `assert.ok(true)` 的断言 → `hollow 0` | 把某用例体改成 `assert.ok(true)` → `hollow 1` → 红 |
| V8 | 卡面不再内联策略清单（Q6 / D11） | `(Select-String agents\*.md -Pattern '逐项点名' -List).Count` → `0`（卡面只留「档位 + 指针」） | 任一卡恢复内联清单 → 计数 ≥1 → 红 |
| V9 | 人设套话清零（D1 / D2） | `(Select-String agents\*.md -Pattern '资深','20 年经验').Count` → `0` | 回填一句人设 → 计数 ≥1 → 红 |
| V10 | `trigger.kind` 四值归一（Q5） | 新脚本 `check-trigger-kind.mjs`，校验 15 席 `trigger.kind ∈ {dispatch, occasion, moment, need}`；**「非议会席」名单用命令取**（`Get-ChildItem agents\*.md` 中文件名不以 `reviewer-` / `detective-` 开头的席），这批席只许 `need` | 某席写第五个 kind → exit 1；把非议会席写成 `dispatch` → exit 1 |
| V11 | 不新增逐项 `returns`（D16 ④） | ① `Get-ChildItem tools/docgen -Recurse -File` 过滤 `.mjs` 与 `.json` 后 `Select-String -Pattern 'returns'` → `0`；② 新脚本 `check-tristate-header.mjs`：逐席定位 `## 本席清单` 段，判该段**表头行**含 `hit` / `miss` / `na` 三值 → `15/15`（**不得全文件扫**：卡内另有「产物字段名只许：hit / miss / na …」一行，全文件扫会恒 15、负例失效） | 任一 `seats/*.json` 或 `.mjs` 出现 `returns` → ① ≥1 → 红；删某席表头三值 → ② `14/15` → 红 |
| V12 | 斜杠串数组化（D3） | `node -e` 扫 **`card.duty.trigger / categories / action / constraint`** 四字段含 `/` 的项 → `0`（现基线 **13**：`trigger` 11 + `action` 2；**字段路径必须钉死，扫 `entry.duty` 会恒 0 假绿**）；D17 后 `agentData` 与 `seats/*.json` 两面都必须为 0 | 某席回填 `PRD/spec/plan` 式斜杠串 → 计数 ≥1 → 红 |

**观测项（不作验收，只记录）**：每席「`## 本席清单` 段字符和」与「判据列字符和」（现状 245–522 / 65–136；取数：逐行 `.Length` 求和，`split('|')[3]` 求和）。D14 落地后记录前后对比，**不设红点**——原 V7「降幅 ≥ 改造前 × 25%」实测不可达（判据列仅占段 22%–28%），按「判不了就别留」从验收表撤下，token 收益改由缺陷 7 的描述承担。

**残余（不假装可测）**：映射是否「映对了题」、引句是否「切题」——两类进 `residual`：**执行者 = 审计席**；每轮抽 3 条 / 记录落 `cards.md` 的「抽核」节 / **抽中不成立算 P1** / **抽核未做算 P2**（与 D8 同源）。

## 5 与已签件的冲突点（须回 ② 段，不在本 PRD 内解决）

| 冲突 | 现状 | 本 PRD 的立场 |
|---|---|---|
| `agent-card-contract` 三态 5 行 | 「一定会」段末逐行全等 `TRISTATE`（`card-contract.mjs:16-20`、`s2-card-rewrite.test.mjs:446-458`）；另撞 `s2-card-rewrite.test.mjs:74`（四导出含 `TRISTATE`）、`:96-102`（长度 5）、`:163-166`（定义恰一次）与 `sdet-render.test.mjs:21`（逐字断言表头） | D16 决定**删除** 5 行 + 改表头 → 必须回 ② 段并重写这五处断言 |
| `agent-card-s4-render:154` 称谓裁定 | 统一为「主持人」 | 与 Q1 同解 |
| `SCAN_FIELDS`（8 键）/ `CARD_MODEL_CODES`（36 码） | 不许新增 | D16 **不新增 `checkItem.returns`**（三值只在 `VERDICTS` 一处，卡面表头一行由它派生）→ `CARD_MODEL_CODES` 36 码零新增；D17 要把 `description` 纳入扫描面 = 改 `SCAN_FIELDS` → 与本表下一行直接冲突，回 ② 段 |
| `card-model.test.mjs` 的 `S1-TC-G09` | `:1125`/`:1131` 两条 `green(description …)` **明确要求 `description` 不扫**；`:1141` 钉 `SCAN_FIELDS` 恰 8 键 | D17 与这三条断言正面对撞 → 回 ② 段，同批改写这三条后 D17 才可落地 |
| `baseline 38/38`（`tools/docgen/cli.mjs:102`/`:228`） | 同一表达式自除自的**常量打印**，恒真 | **不作判据**（已签 S3 D-15）；V4 只认 `gate` exit 0 + 15 席逐字节 |
| `policy/**` | S6 已签「零改动」 | Q6 只改**渲染粒度**（卡面不内联），policy 内容仅 Q8 删 3 项 → 仍属改已签件，回 ② 段 |
| `outputFormats['issue-card'].fields` | 7 列，证据为单栏 | D14 要求证据栏改三列（摘句 / 文件+行号 / 用途）→ 改已签件，回 ② 段 |
| `gate-record.md` 各列口径 | 「命令输出首行 **或** path:line」 | D7 **只改偏好不改必填**，§5 登记不再动该文件 |
| `renderCard` 卡面列数 | 「本席清单」固定 4 列（`s2-card-rewrite.test.mjs:436-443` 的 `S2-TC-D03`） | D16 定**不加列**、取值改由表头一行给出 → 不撞该冻结断言 |

## 6 不做

- 不做全仓证据形式改造（只改门行与审计表的证据列**偏好**）
- 不改卡面七段结构与 front matter
- 不重开 `observable-criteria-rollout` 的已签结论
- 不动 `agents/*.md` —— 15 卡是生成物，一切改动走 `draft` → 对照 → `replace --yes`
- 不新建 5 个 skill（D15）

## 7 本轮讨论中被否的方案

| 方案 | 否因 |
|---|---|
| 全量结构化 60 个自由文本槽 | 只防格式漂移、治不了内容写错；当期成本高、收益不可证伪 |
| 用 `split("label: '")` 类字面计数做断言 | 与既有正则双实现且格式微调即假红 |
| 让 agent 用 path:line 作复算证据 | 会漂、token 成本高一个数量级（D7） |
| 「纯 JSON 会丢复用」 | **判断错误已撤回**：现状 11 席是字面复制，`cardOf` 无共享机制；拆 JSON + `@` 引用才是首次真正实现共享（D12） |
| 「策略文本写了两份」 | **判断错误已撤回**（议会 r1 三席指出）：源已单份（模板 + policy），产物重复不等于源重复。真问题是渲染粒度（缺陷 4 / Q6） |
| 建 5 个新 skill | D15：88 条已由一行模板生成，边际收益只是「起名字」 |

## 8 分期与回退面（议会 r1 要求）

**三段顺序**（每段独立验收 + 独立回退）：

| 段 | 前置（可核，未签则本段不得开工） | 内容 | 验收 | 回退 |
|---|---|---|---|---|
| **S-A 数据层** | §5 的 `SCAN_FIELDS` 行、`S1-TC-G09` 行与 `policy/**` 行已在 ② 段签收（`gate-record.md` 对应行）——D17 落在本段，三条断言必须同批改写 | D12 拆 JSON + `@` 引用 + 加载器 + D17 `when` 唯一源 + Q8 删 3 项 | V4（渲染逐字节不变）+ V5（`@` 完整性）+ V10（本段只落 `kind` 字段位 15/15；四值校验归 S-C） | 开工前 `git stash -u`（含未跟踪新文件）；或 `git checkout -- tools/docgen/` 后**复验 `git status --porcelain tools/docgen` 为空**（`git checkout` 不删新建文件，残留 = 回退未完成），再重跑 `gate` |
| **S-B 契约层** | §5 的 `outputFormats['issue-card'].fields` 行已签收 | D14 证据栏三列 + `check-quotes.mjs` + **造 V6 语料：tool 产出的观察记录先落 `.session/`，再手工归档到 `docs/superpowers/reviews/<round>/` 并 `git add`（该目录对写盘工具只读：`tools/observation-check/artifact.mjs:45-46`；未入索引会被 `gate-run.mjs:126-135` 判 `UntrackedArtifact` 连带 V3 红），≥2 条 `evidence`** + Q6 卡面改指针 + Q3 复用 | V6（引句真实性）+ V7（用例非空心）+ V8（不再内联清单） | 同上；`policy` 与 `outputFormats` 改前存副本 |
| **S-C 卡面形状** | §5 的「三态 5 行」行与 `card-model.test.mjs` 的 `S1-TC-G09` 行、列数行已签收 | D16 三态承载 + D3 斜杠串数组化 + D6/D5 返回声明 + Q5 trigger 四型（`kind` 住 `triggerTable`）+ Q4 长度约束 + D1/D2 删人设 + Q1 `HOST_TERM` | V1/V2/V3 + V9（人设清零）+ V10（`trigger.kind` 四值校验，S-A 只落字段位）+ V11（无逐项 `returns`）+ V12（斜杠串 0）+ 15 卡重生成 | `git checkout -- agents/` 后 `replace --yes` 重生成 |

**冻结基线（改前必存）**：15 卡 SHA256 + `# tests` 计数（`npm run check` 口径 `1405`）+ `check-plan` 的 `cases 80` + **观测项基线：逐席 `## 本席清单` 段字符和（245–522）与判据列字符和（65–136）**。

**做坏判据**：`gate` 报 `Mismatch` = 渲染漂移；`# tests` 低于基线 = 删用例凑绿；V5/V6 exit 1 = 引用或引句断裂。

## 9 Spec 路线图（JIT：只定边界与大纲，细节开工时写）

> 拆分自本 PRD（2026-11-03）。**双份真相禁令**：D1–D17 / Q1–Q8 / V1–V12 的正文只活在本文件，spec 一律**引用编号**，不抄写。

**依赖图**：`S-A → S-B → S-C`（S-B 的「卡面改指针」要在 S-A 的 JSON 数据源上做；S-C 的表头三值行要在 S-B 的证据栏契约定稿后才能渲染）。

| 段 | spec 文件（建议名） | 边界（一句话） | 大纲要点 | 依赖 | 验收锚点 |
|---|---|---|---|---|---|
| **S-A** | `2026-11-03-s-a-data-layer-design.md` | 只动数据源与装配：把 `agentData` 拆成 `shared.json` + `seats/<seat>.json` 并用 `@` 引用展开，**渲染产物逐字节不变** | ① 定 `shared.json` / `seats/*.json` 切分与 `@` 语法；② 加载器 + 展开器（装配前一次性纯函数，文件名本节定）；③ `when` 唯一源改 `triggerTable`（D17）；④ policy 删 3 项（Q8）；⑤ 三条冻结断言同批改写（`S1-TC-G09`）；⑥ 回退与 `git stash -u` | 无（须先过 §5 的 `SCAN_FIELDS` / `S1-TC-G09` / `policy/**` 三行 ② 段签收） | V4 / V5 / V10；§8 S-A 行 |
| **S-B** | `2026-11-03-s-b-contract-layer-design.md` | 只动契约与证据形式：`issue-card` 证据栏改三列 + 引句校验器接上 + 卡面策略清单击针化 | ① `outputFormats['issue-card']` 三列（D14）；② `check-quotes.mjs`（复用 `checkEvidence()`）+ 语料生成与归档（V6）；③ 卡面「档位 + 指针」（Q6 / D11）；④ `categories` 复用为关注点（Q3）；⑤ 映射用例非空心（V7） | S-A | V6 / V7 / V8；§8 S-B 行 |
| **S-C** | `2026-11-03-s-c-card-shape-design.md` | 只动卡面形状：三态承载、动作返回、trigger 四型、长度约束、删人设、`HOST_TERM` | ① 删 5 行 `TRISTATE`、表头一行给三值（D16，五处冻结断言）；② 斜杠串数组化（D3 / V12）；③ `checkItem` 返回声明（D5 / D6）；④ `trigger.kind` 四值（Q5 / V10）；⑤ `needs` 槽删除与长度约束（Q4）；⑥ 删人设套话（D1 / D2 / V9）；⑦ `HOST_TERM`（Q1） | S-A、S-B | V1 / V2 / V3 / V9 / V11 / V12；§8 S-C 行 |

**你要做哪段 → 读这些**

| 你要做 | 必读 |
|---|---|
| S-A | 本 PRD §2 D12·D17、§3 Q8、§4 V4·V5·V10（字段位）、§5 `SCAN_FIELDS` 行 + `S1-TC-G09` 行 + `policy/**` 行、§8 S-A 行 + 该 spec 的 `-testcase.md` |
| S-B | 本 PRD §2 D11·D14、§3 Q3·Q6、§4 V6·V7·V8、§5 `outputFormats` 行、§8 S-B 行 + testcase |
| S-C | 本 PRD §2 D1–D6·D16、§3 Q1·Q4·Q5、§4 V1–V3·V9·V11·V12、§5 全表、§8 S-C 行 + testcase |

**跨文件关键设计决定（2026-11-03 定）**：D16（三态不新增逐项字段）与 D17（`when` 唯一源）两处会被三份 spec 反复引用——**只引用编号，不改写**；任何要改它们的提案必须回本 PRD，不在 spec 里就地改。
