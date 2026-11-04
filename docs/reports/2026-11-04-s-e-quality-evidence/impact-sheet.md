# S-E 批改判影响清单（impact-sheet）

> 状态：**执行中（2026-11-04 建，逐任务追加）**
> 用途：`node scripts/scope-sweep.mjs --check` 判红第 ③ 条（口径 ID / 命中文件必须在当次清单内）；R8 的 mtime 判据（本文件必须不早于被扫 scope 文件）。
> 落点说明：本文件在 `.session/reviews/2026-11-04-s-e/`（过程账，不进 git）；S-E 收口时整单迁 `docs/reports/2026-11-04-s-e-evidence/`。
> 本批范围（用户 2026-11-04 确认）：Task 0 清 S-D 遗留 P3 ／ `(e)` `senior-sdet` 补 `dimension='测试设计'` ／ G1（改 `rationale` 文案 + V9 加词面 + B04 每格非空断言）。

## 0 全貌确认

| 项 | 内容 |
|---|---|
| 本质 | 补一条数据键（S4-L4）+ 闭合一条判据漏检（G1）+ 迁一条过程账（S-D 残余 ③） |
| 同族 | `dimension` 校验面（`validateAgentData.mjs:111` 的可选键）、投影面（`docs/agents/**` 16 份 + README index）、V9 人设词三面（`data/seats/**` / `agents/*.md` / `docs/agents/*.md`）、`S4-TC-B04` 表头断言 |
| 边界 | 不动其余 14 席数据与 `agents/*.md` 源卡；已签 spec 只按「签后增量登记」动 §11.8 与 B04 判据 |
| 验收（可机械判） | `npm run check` 末行 `check 全部通过`；`node tools/docgen/cli.mjs gate` → `baseline 38/38`；三面人设词（`资深` / `20 年` / `十年`）计数 0；`docs/agents/README.md` 维度列 15 格非空；重生成后 `git status --porcelain` 0 行 |
| 影响面 | `data/seats/senior-sdet.json`、`sdet-data.test.mjs`、`sc-card-shape.test.mjs`、`card-render.test.mjs`、S-C spec §11.8 / testcase、S4 testcase B04 行、`docs/agents/**` 16 份、`references/gate-record.md`（门行 + `⑤@S-D` 残余 ③ 兑付）、本文件 |
| 联动四问·治本 | 加「维度每格非空」断言 + 词面加 `十年` 是判据侧堵漏；只改文案只补数据、同类句下次仍漏 |
| 联动四问·副作用 | 词面加 `十年` 的扫描面与 SC-TC-29/31 同宽（三面），改前现盘三面合计 **2** 处命中（`tools/docgen/data/seats/senior-sdet.json:143` + `docs/agents/senior-sdet.md:9`），改后须 0；若只加词面不改文案必红 |
| 联动四问·跨问题 | G1 / G3 / G11 同属「投影面判据」族，本批只做 G1；G3（用例计数锚点）与 G11（投影 0 diff 无机械判据）留观察 |
| 联动四问·跨页面 | `dimension` 只被 `renderReadme.mjs:17` 与 `:36` 两处消费，影响面可枚举 |

## 1 口径全集（**33 个口径 ID**，无一遗漏；编号到 `I34`，其中 `I8` 未登记）（第 34 号 `I34` 由本批 T4 新增）

| ID | 标题（摘自 `tools/scope-sweep/keywords.json`） | 本批处置 |
|---|---|---|
| I1 | 卡面文字不要求一致 | 不触及（scope 内 0 改动） |
| I2 | 路径三数（数组 21 / 点名 22 / 卡面 23） | 不触及 |
| I3 | expanded 槽序 = 表行序 | 不触及 |
| I4 | 档位四档（含 command） | 不触及 |
| I5 | network.verbs 恰三项 | 不触及 |
| I6 | SEATS 契约（display / clause / escalationWriter） | 不触及 |
| I7 | 错误码后缀与读取失败口径 | 不触及 |
| I9 | 未登记席 / 保留键 | 不触及 |
| I10 | 纯结构行四类（含渲染器固定骨架行） | 不触及（基线命中 0） |
| I11 | 验收命令写法（仓根 + 带引号 glob，禁裸 glob 与无 cwd 的 cd 写法） | **本批须守**：`gate-record.md` 在 scope 内，新落门行严禁出现裸 glob 形态（命中数必须 ≤ 基线） |
| I12 | 计划门验收命令写法（`coverage` 必带 `--stage`） | 不触及 |
| I13 | `preScript` 不再是通过条件（字段保留、条件撤除） | 不触及 |
| I14 | 用例落盘载体 | 不触及（基线命中 0） |
| I15 | S4-TC-A02 的「12 键逐键删除全被拒」 | 不触及 |
| I16 | S4-TC-E01 的「判据 id 裸子串计数 = 1」 | 不触及 |
| I17 | S4-TC-F04 的「缺一份 README → exit 1」 | 不触及 |
| I18 | S4-TC-K01 的「PRD §3.7 段表 = 8 行」 | 不触及 |
| I19 | S4-TC-I02 的「零接触 = `git diff --quiet HEAD` 无差异」 | 不触及 |
| I20 | A3 必答清单存在 | 不触及 |
| I21 | A1 契约枚举扫描面 | 不触及 |
| I22 | 计数口径：检查点总数 24→25、执行力度 8→9 项 | 不触及（基线命中 0） |
| I23 | ⑨ 判据可观察的判定口径 | 不触及 |
| I24 | subjectiveHit 判定口径 | 不触及 |
| I25 | 8 条 predicates 旧 label 合集 | 不触及 |
| I26 | S6-TC-G01 卡面差异记账面 | 不触及 |
| I27 | S5-TC-B07 变更段重判 | 不触及 |
| I28 | 计数探针扫描面 | 不触及 |
| I29 | S2 本批判据的比对区间（旧 = `base..HEAD` / 现行 blob；S3 起收窄为 `base..S2 落地提交`） | 不触及（本批不改比对区间；`sc-card-shape.test.mjs` 只加词面数组元素） |
| I30 | S3 遗留 P2-1：`no-fake-problem` 的 observable 旧写法 | 不触及（基线命中 0） |
| I31 | S-A 计划门 P0-1：「12 键恰等」挂 loader 的旧口径 | 不触及 |
| I32 | S-A 计划门 P1-3：`@` 混用规则的旧写法 | 不触及 |
| I33 | S-A 计划门 P1-6：PRD §8 S-A 验收列旧写 V10 | 不触及（基线命中 0） |
| I34 | **V9 人设词面的旧口径**（旧 = 「`资深` + `20 年`」两词面；本批加严为三词面） | **本批新增并登记**：`keywords.json` 加 `I34`（words = 旧写法「两个词面 / 三条并列判据 / 只判两词面」，scope = S-C spec + 其 testcase + `sc-card-shape.test.mjs` + `senior-sdet.json`）；`--freeze` 后 `counts.I34 = 0`；复核见 §2 #1 |

## 2 本批判据级改动（逐条处置，随施工追加）

| # | 改动 | 载体 | R8 处置 | 回扫结论 |
|---|---|---|---|---|
| 1 | **V9 人设词面由 `资深` + `20 年` 扩为 `资深` + `20 年` + `十年`**（判据加严，方向只收不放） | `tools/docgen/test/sc-card-shape.test.mjs`（`SC-TC-29` 词面数组 + `SC-TC-31` 循环字面量）+ `docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md` §11.8 两处 + 其 testcase 对应行 | **改**（同批 4 处）+ `keywords.json` 新增 `I34`（旧写法登记）并 `--freeze` | 同族回扫：三面扫描面与 `SC-TC-29` 同宽（`data/seats/**` 全文含外层 `role` / `agents/*.md` / `docs/agents/*.md`）；改前现盘三面合计 **2**（data 1 + `docs/agents` 投影 1）→ 改文案 + 重生成后归 **0**。上游 PRD 不动（V9 词面原词面 `资深` / `20 年经验` 仍 0，属「加严不放松」）。历史件 `docs/reports/2026-11-04-s-c-card-shape-evidence/**` 与 `④@S-C` / `⑤@S-C` 行记的是当时值 → **历史保留不改**。另两处含旧句 `十年` 的已定稿历史件同批登记：`docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design.md:64`（旧 `identity` 逐字转录）与 `docs/superpowers/specs/2026-10-21-docgen-replace-intent-change-design-testcase.md`（§3.3 `:855` 的注入夹具字符串；覆盖行 `:1039`）→ 二者**不在 V9 三面扫描面内**，按 `docs-convention` 硬约束 4 **历史保留不改**（改即重写历史） |
| 2 | **`S4-TC-B04` 增「README 维度列 15 格非空」断言**（既有用例块体内加断言，不新增用例块） | `tools/docgen/test/card-render.test.mjs` + `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design-testcase.md`（B04 行预期 + 覆盖列补锚到 S4 spec `:80`） | **改** | 同族：S4 spec 正文**逐字不动**（锚点 = 该件 `:80` 的 `seatEntry` 结构行，属既有判据，非新增需求）；`docs/after/20261031165047-…` 的 S4-L4 条随本批闭合删除 |
| 3 | **`senior-sdet` 的 `dimension` 键由「缺」→ `测试设计`**（补数据，并把「不得有该键」的断言翻转为「值 = 测试设计」） | `tools/docgen/data/seats/senior-sdet.json` + `tools/docgen/test/sdet-data.test.mjs` | **改** | 同族：`validateAgentData.mjs:111` 的 `BASE_KEYS` 本就含 `dimension`（可选、未要求非空）→ 不动校验器；`docs/agents/**` 16 份由 `generate` 重生成（内容差异只 2 份） |
| 4 | **G1 文案**：`rationale` 首句「有十年以上经验的测试开发工程师。」→「测试开发工程师。」 | `tools/docgen/data/seats/senior-sdet.json` | **改** | 与 #1 同批（只加词面不改文案 = 当场红）；`agents/` 源卡无该句（实跑 `Select-String -Pattern '十年'` 命中 0）→ 不动 |

## 3 命中文件全集（22 个 basename，无一遗漏）

| 文件 | 本批处置 |
|---|---|
| `2026-10-25-docgen-policy-single-source-design.md` | 不触及 |
| `2026-10-25-docgen-policy-single-source-design-testcase.md` | 不触及 |
| `2026-10-27-s2-observation-check.md` | 不触及 |
| `2026-10-27-s3-gate-wiring.md` | 不触及 |
| `2026-10-29-agent-card-s4-render-design-testcase.md` | **本批改**（B04 行加「每格非空」判据） |
| `2026-10-30-agent-card-s4-render.md` | 不触及 |
| `2026-10-31-agent-card-s4-quality.md` | 不触及 |
| `2026-11-01-s2-card-rewrite-design.md` | 不触及 |
| `2026-11-03-s-a-data-layer-design.md` | 不触及 |
| `criteria.md` | 不触及 |
| `dev-workflow-checks.mjs` | 不触及 |
| `dev-workflow-counts.test.mjs` | 不触及 |
| `gate-record.md` | **本批多次改**（Task 0 改 `⑤@S-D` 残余 ③ 路径串 + 本批五段门行）→ 每次改后 touch 本文件 |
| `index.md` | 不触及 |
| `patternRegistry.mjs` | 不触及 |
| `policy-pure-source.test.mjs` | 不触及 |
| `predicates.mjs` | 不触及 |
| `s2-card-rewrite.test.mjs` | 不触及（I29 scope 唯一条目，本批零改动） |
| `score.mjs` | 不触及 |
| `stage-2b-plan-gate.md` | 不触及 |
| `subjective-terms.mjs` | 不触及 |
| `tool-tiers.test.mjs` | 不触及 |

> 说明：`sc-card-shape.test.mjs` / `card-render.test.mjs` / `2026-11-03-s-c-card-shape-design.md` 不在本表 22 项内 —— 它们是**判据载体**，其口径以 I 编号登记（V9 词面属 I 系列未登记项，若 ② 段决定新登记会补进 §1 并 `--freeze`）。

## 4 touch 记录（每次改 scope 内文件后追加一行，取 mtime 判红用）

| 时点 | 因何 touch | `sweep --check` 结果 |
|---|---|---|
| 2026-11-04 Task 0 建单 | 建本文件（开口径全集 + 命中文件全集） | 见下行 |
| 2026-11-04 Task 0 迁账 | 改 `⑤@S-D` 残余 ③（兑付登记 + 新路径串）→ 本文件再 touch | 见下两行 |
| 2026-11-04 Task 0 收口 | `docs/reports/2026-11-04-s-d-evidence/` 建目录（`impact-sheet.md` 逐字复制 + `README.md` 映射），`.session/reviews/2026-11-04-s-d/` 整目录删 | `sweep ok`（exit 0） |
| 2026-11-04 ①② 段落行 | 落 `①@S-E` / `②@S-E` 两行 → 本文件 touch | `sweep ok`（exit 0） |
| 2026-11-04 ②→③ 返工 | 改 `②@S-E` 两处文字（去 `skills/` 前缀、`严格`→`逐字`）+ plan 四处（S4 spec 定位 / S-C testcase `:506` 例外 / B04 红档补重生成 / 门行 6 条）→ 本文件再 touch | `sweep ok`（exit 0） |
| 2026-11-04 ②→③ 落行 | 落 `②→③@S-E` 一行（审计复核轮判过）+ 复核轮 3 条 P3 的文案闭合（S-C spec 节号 / 历史件锚 / 六条门行）→ 本文件再 touch | `sweep ok`（exit 0） |
| 2026-11-04 T1+T2 | 改 `senior-sdet.json`（dimension + rationale）+ `sdet-data.test.mjs` + `sc-card-shape.test.mjs` + S-C spec 两处 + 其 testcase 四处 → 重生成 16 份 → 本文件再 touch | 见下两行 |
| 2026-11-04 T3+T4 | 改 `card-render.test.mjs`（B04 断言）+ S4 testcase 三处 + `keywords.json`（加 I34）→ `--freeze` 重写 `baseline.json` → 本文件再 touch | `sweep ok`（exit 0；`counts.I34 = 0`） |
| 2026-11-04 ③ 段落行 | 落 `③@S-E` 一行（审计判过）+ 按其 P2/P3 补 plan §5.1 / §6 第 5 行 / §7 T4 取证 / B04 红档 BOM 注 → 本文件再 touch | `sweep ok`（exit 0） |
| 2026-11-04 ④ 段落行 | 落 `④@S-E` 一行（sdet 判过 + 核对席复核 4/0）+ 改正本文件 §1 的「34 → 33 口径」→ 本文件再 touch | `sweep ok`（exit 0） |
| 2026-11-04 ⑤ 段准备 | 改 `③@S-E` 两处路径串（迁入 `…-s-e-quality-evidence/`）+ 写 `delivery-5-claim.md` 与 `delivery-5-audit.md` → 本文件再 touch | `sweep ok`（exit 0） |
| 2026-11-04 ⑤ 落行 + 收口 | 落 `⑤@S-E`（用户终签原话）+ plan §7 T5 完成 + 写交接词 `docs/handoffs/2026-11-04-next-batch-after-s-e.md` → 本文件再 touch | 见下行（末次门禁值见交接词元信息表） |

