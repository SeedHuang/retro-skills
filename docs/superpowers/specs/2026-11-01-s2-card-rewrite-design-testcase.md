# 测试用例：卡面重构 S2（可执行语句 + 中文名表 + 行序号对账 + 禁 id 守卫 + 单源注入）

> **归属 spec**：`docs/superpowers/specs/2026-11-01-s2-card-rewrite-design.md`（议会 #2 已结项，审计 r4 = PASS；`②→③` 计划门已过（2026-11-01））
> **上游 PRD**：`docs/prd/20261031202331-observable-criteria-rollout/index.md`（已定稿、① 段已签）
> **编写者**：senior-sdet（独立实例）
> **独立性声明**：本用例编写者未参与 S2 设计与实现，结论仅依据 spec 与实现读码
> **依据 spec**：`docs/superpowers/specs/2026-11-01-s2-card-rewrite-design.md`（第 2 轮审计复核版：Q6-b / Q7 已裁定）
> **编写日期**：2026-11-01
> **修订记录**：2026-11-01 议会 #2 第 1 轮打回后按新 spec 修订（G1–G7）；用例数 75（正 37 / 负 25 / 边界 13）
> **修订记录 2**：2026-11-01 Q6-b / Q7 裁定后同步（C10/C11 三分支、H01 公式、新增 E12）；用例数 76（正 38 / 负 25 / 边界 13）
> **修订记录 3**：2026-11-01 增量 K 组 3 条（承接 spec §6-D17 / §7 Q8：A3 判据扩面——旧表格列头形态保留 + 『一定会』bullet 形态新增）；用例数 79（正 39 / 负 26 / 边界 14）；同批修正三处判据缺陷（B07 判据改「剥前缀比正文 + 序号单比」（原「整行 == 逆序」在任何合规实现上不可满足）、A02 / A04 判据改表达式形态（`join` / 派生枚举）以与 §4-A1 数组字面阈值自洽，判据语义未变）；编写者 = 独立 senior-sdet 实例（未参与 S2 发现与实现）
> **状态**：已随 spec 送议会 #2 并结项（审计 r4 = PASS）；`②→③` 计划门已过（2026-11-01）；K 组为结项后增量（待随 D17 复签一并复核）｜**用例总数 79**（正 39 / 负 26 / 边界 14（含 3 条标「执行型」：H01 / H02 / I05）；负 + 边界 = 40 ≥ 正 39，见 §12 GAP-17）｜ID 前缀 `S2-TC-`
> **改动记录（第 0 轮，保留）**：2026-11-01 主持人核对发现计数声明 70/34/22/14 与实际 61/30/20/9 不符、I/J 组缺失；已于本文件补 I01–I06 / J01–J03 并改计数（编写者 senior-sdet，独立实例不变）
> **命名与落点**：`rules/spec-testcase-gate.md` 判据 1 —— 与 spec 同目录，文件名 = spec 去掉 `.md` 后加 `-testcase.md`；spec 头部已外链本文件，spec 正文不内联用例
> **测试落点（建议）**：`tools/docgen/test/s2-card-rewrite.test.mjs`（`node --test` 自动收；每个用例 = 一个 `test('S2-TC-<ID> …')` 块，函数名逐条写在「步骤」列首）

---

## 0 判据常量与测试约定

| 编号 | 常量 / 约定 | 取值与出处（可复核） |
|---|---|---|
| 常量 1 | **两套 D 编号消歧** | spec **§4** 是判定规则（`D1`–`D7` + `A1`–`A4`）；spec **§6** 是差异清单（**`D1`–`D16`**，其中 D13 = R8 改判登记、D14 = 接口正名、D15 = D3 层③ 回流、D16 = 扫面口径回流〔卡面 = 渲染文本〕）。本文件一律写全限定：`§4-D3` / `§6-D11`；只写 `D3` 时默认指 §4 |
| 常量 2 | 接口面（唯一契约，新 spec §3 的接口小节逐字） | `card-contract.mjs` → `TYPE_LABELS` / `TRISTATE` / `ALLOWED_PRODUCT_NAMES` / `FORMAT_CHECKS`；`object-names.mjs` → `OBJECT_NAMES` / `REPEAT_NAMES`；`renderCard(card, env)` + `expectedBullet(card, i)`；`cardFaceIds(card, env) → string[]`（空 = 过） |
| 常量 3 | 返回形态与签名 | `cardFaceIds` **双参** `(card, env)`（新 spec §3）、返回 `string[]`、元素为命中的 token；**扫面 = `renderCard(card, env)` 的渲染文本逐行**（spec D16，用户 2026-11-01 裁定）；禁集**不手抄**：读 `env` 六个登记集合键（`registeredIds` / `predicates` / `landings` / `sharedScenes` / `seatScenes` / `seatSignals`，生产者 `registeredIdsOf(cards)` / `Object.keys(...)`）再并 `REPEATS` / `CHECK_KINDS` 键与点分形态；`expectedBullet` 返回**含前缀**一整行（`- <i>｜…`）；两者各只导出 **1 处**（V-9） |
| 常量 4 | helper 复用口径 | 沿用 `tools/docgen/test/card-render.test.mjs` 既有 helper —— `walkFiles` / `runNode` / `runCli` / `coldRepo`（`mkdtemp` 副本）/ `mutCard`（内存改卡并还原）。**不另写第二套**；**不写它们的行号**（该文件本块要改，行号必漂） |
| 常量 5 | 构造禁令 | 一切「必红构造」只在内存或 `mkdtemp` 副本上做，**不写仓内文件**；每条构造必须「还原 + 断言还原后回到基线」（守构造有效性，防「构造失效 → 假绿」） |
| 常量 6 | **副本内重渲染一律走子进程**（G5-1） | 模板在模块加载即固化（`tools/docgen/components/cardTemplate.mjs`）→ **本进程**改副本模板/渲染器后重渲恒绿。凡「改副本再渲染」的构造（D02 / E06 / F03 / F04）必须 `runNode(['--input-type=module','-e', script], copy)` 子进程重新 `import` 副本模块（做法逐字参照 `card-render.test.mjs`：`pathToFileURL` + 独立 ESM 注册表） |
| 常量 7 | **词表一律派生，不手抄** | 禁集合代表 id 从六类登记表取（`vocab/shared-actions.mjs` / `enums.mjs` 的 `SHARED_SCENES` / `enums.mjs MOMENTS` / `enums.mjs REPEATS` / `vocab/predicates.mjs` / `vocab/landings.mjs`）第 1 个键；「许」四类只从实现常量读（`ALLOWED_PRODUCT_NAMES` + 工具名 + 真实路径形态 + 卡片七字段中文名）；名表期望 = 15 卡实际取值并集（`buildCards()`）；席数 / 条数 / baseline 分母全部派生，不写死 15 / 75 |
| 常量 8 | D3 的 token 切分集**由 spec D3 层② 写死**（先剔路径 span，再按 `/`、全角 `／`、空白、`、，,` 切） | 测试**只黑盒喂构造句**、断 `cardFaceIds` 返回数组；不复制切分实现，不写测试侧「第二份词表」；**路径 span 必须整体剔除**（`.session/reviews/<本次>/` 不得被切成裸词 `session`，否则撞 `SHARED_SCENES` 键） |
| 常量 9 | A1 的「同形数组」阈值 = spec §4-A1 逐字 | 一个 `[...]` 字面内含 **≥2 个**「契约枚举值」（`TYPE_LABELS` 中文值 ∪ `TRISTATE` 4 值）即计 1 处 |
| 常量 10 | markdown 安全 | 判据列内**禁 ASCII 竖线**（表格分隔符），正则一律用全角 `｜` 或字符类 |
| 常量 11 | 测试不自递归（G7） | 任何用例的「步骤」列**不得**执行门禁总脚本；只允许单跑 `node scripts/check-observable.mjs` / `node tools/docgen/cli.mjs <子命令>` / `node scripts/scope-sweep.mjs --check` / `node --test <单文件>`。全量门禁由 `scripts/check-all.mjs` 自己跑（见 GAP-13） |
| 常量 12 | 理解度用例标「执行型」 | `V-11` / `V-11-b` 靠「独立实例答题 + 判分」，**非 `node --test` 自动化**；用例里机判部分只核**报告文件与计分表的结构**，分数由人判 |
| 常量 13 | 三类常驻夹具（新 spec §4） | ① 宾语≠落点 ② 两行同值 ③ 共享句只 1 席渲染；**每类必须有一条「必红构造」**（构造后判据必红的证明），缺一即判别力为零 |
| 常量 14 | **`<S2-BASE>` 缺失记 skipped 并点名**（G5-3） | 基锚优先取 `process.env.S2_BASE`；**缺失时降级为「spec 最近一次提交；若它就等于 `HEAD`（本批已提交）则取它的父提交」**（D21：字面 `HEAD` 会让 `base..HEAD` 恒空）并 `t.diagnostic` 点名。不得 `t.skip`（`scripts/check-all.mjs` 只放行 `SKIP_ALLOWLIST` 的 2 个名字，名单外 skip 直接判红），也不得 fail-closed（`check-all.mjs` 的 `testEnv` 不注入本变量 → 恒红）。取值命令：`git log -1 --format=%H -- docs/superpowers/specs/2026-11-01-s2-card-rewrite-design.md` + `git rev-parse HEAD`（相等时再取 `HEAD^`） |
| 常量 15 | **「没改」一律用 sha 内容锚**（G5-2） | 断「工作区干净」在脏树下立跑即红（本轮 `skills/dev-workflow/references/gate-record.md` 有未提交行）→ 改判「指定文件内容不变」：跑前跑后各取 `createHash('sha256')` 或 `git hash-object`，断清单逐键相等 |

**断言语义**：本文件「判据」列一律写可直接照抄的 `assert.*` 表达式，或「命令 + 退出码 + 关键输出」；不存在「检查是否合理」「确保正确」这类不可判表述。

---

## 1 覆盖总表

> **读法**：右列「用例 ID」一律是**裸组号**（`A01` … `K03`，全称 = `S2-TC-` + 该号）；`§4-D3` / `§6-D10` 这类是 **spec 自身的条目编号**（§4 判定规则 / §6 差异清单），**不是用例 ID**——按用例 ID 解析时只认带 `S2-TC-` 前缀或裸组号的形态。
> **出处锚（G6）**：PRD 侧行号一律用实测新锚 **`:344` – `:349`**（V-6…V-11 共六行，V-8 归 S3）。**旧锚作废**：第 1 轮曾写 `:329` / `:330` / `:332` / `:333` / `:334`，与实测错位 15–18 行，已随 spec 一并改到新锚。**spec 侧只用节号与编号**（如 `§4-D3` / `§6-D12` / `落点 #5`）——spec 会随修订增删行，行号是第二份结构副本，一律不写。

| 约束 / 条目 | spec 出处 | 用例 ID |
|---|---|---|
| §4-D1（bullet 行首 `- <i>｜`、`i` 从 1 连续） | §4 | B01 / B02 / B03 / B06 |
| §4-D2（逐字等于 `expectedBullet(card,i)`） | §4 | B04 / B05 / B07 |
| §4-D3（禁 id 三层：① 排除段末三态行 → ② 剔「许」四类 → ③ 余下 token 命中 (a) env 六集合键 / (b) `REPEATS` 键 / (c) `CHECK_KINDS` 键 / (d) 点分 id 形态 任一即红；裸词时刻 id 不判；**扫面 = 渲染文本**；**D15 / D16 回流后为准**） | §4 | C01 / C02 / C03 / C04 / C05 / C06 / C07 / C08 / C09 / C10 / C11 |
| §4-D4（类型列只许 `TYPE_LABELS` 三中文值；英文键即红） | §4 | D01 / D02 / D03 |
| §4-D5（三态 = 1 解释行 + 4 常量行，逐字等于 `TRISTATE`） | §4 | D04 / D05 / E11 |
| §4-D6（禁 `objects` / `repeats` 英文键名，并入 D3 第 ③ 步） | §4 | C03 / C08 |
| §4-D7（`requires` 空则不渲染「前提：无」） | §4 | D06 / D07 |
| §4-A1（契约枚举只有一处，卡面渲染链〔排除 `*.test.mjs`，见 §6-D18〕） | §4 | E01 / E02 / E04 / E11 |
| §4-A2（两探针：`gate` 重渲 + 常量探针） | §4 | B08 / G02 |
| §4-A3（无第二套白名单：改一处应绿、改别处应红） | §4 | E03 / E04 |
| §4-A4（占位符不残留，`{{` 0 次） | §4 | E05 / E06 |
| §5 V-6（零 id 且不误伤合法英文；反例 = 产物字段名 + `progress.md` 真实路径形态） | §5、PRD `:344` | C02 / C04 / C08 / C09 / C10 / C11 / E12 |
| §5 V-7（行序号对账判别力 + 三类夹具） | §5、PRD `:345` | B03 / B04 / F01 / F02 / F03 / F04 / F05 |
| §5 V-9（复用不复制） | §5、PRD `:347` | E01 / E03 / G03 / G04 |
| §5 V-10（全量门禁 + R8 回扫 + baseline 审计抽核） | §5、PRD `:348` | G01 / G02 / G07（门禁自跑部分见 GAP-13） |
| §5 V-11④（理解度，执行型；Q7 读法①：`L_after ≤ ⌊L_before × 0.5⌋` 且 `L_before − L_after ≥ 1`） | §5、PRD `:349` | H01 |
| §5 V-11-b（测量隔离，执行型） | §5、PRD `:349` | H02 |
| §5 首日不红（`rules` / `skills` 零改动 + `[observable] hits` 仍 0） | §5 | G07 / I06 |
| §6-D1（三态常量**新增**、键源 `VERDICTS`、无 re-export） | §6 | A10 |
| §6-D2（数据层常量 → 占位符 → 渲染，15 卡不得手写） | §6 | E07 / E08 |
| §6-D3（`expectedBullet` 唯一翻译点） | §6、PRD `:172` | B05 / G03 |
| §6-D4（禁 id 匹配 = token 全等，禁子串） | §6、PRD `:176` | C05 / C06 |
| §6-D5（档位枚举 / 死路径串不在本块扫描面，C-3 归 S6） | §6、PRD `:175` | **无断言**（口径张力 → GAP-11） |
| §6-D6（C-7 只加不改） | §6 | I01 / I02 |
| §6-D7（`产出须含 path:line` 不挂卡面、不计入 V-11） | §6 | H03 |
| §6-D8（「无问题也写结论」不加） | §6 | H04 / H05 |
| §6-D9（「不得先改后记」转可跑判据） | §6 | H06 / H07 |
| §6-D10（类型三值并入同一白名单口径） | §6 | A02 / A03 |
| §6-D11（写盘两步：`generate` 只比不写；`draft → 确认 → replace --yes`） | §6、`cli.mjs` 的 `cmdGenerate` / `cmdReplace` | E09 / E10 / G05 |
| §6-D12（禁集复用既有常量、不新增禁表：`env` 六集合键 + `REPEATS` / `CHECK_KINDS`；**扫面不用 `CARD_TEXT_FIELDS`**，见 D16） | §6、`enums.mjs`、`index.mjs` | C09 / G03 |
| §6-D13（R8 改判登记：落点 id 改名 + V-11 读法①，判据 = `scope-sweep --check` exit 0） | §6、§6.1 | E12 / C10 / C11 / H01 / G01 |
| §6-D14（接口正名：禁集改 `env` 既有派生，扫面部分由 D16 改判；只补可执行性） | §6 | C01 / C09 / G03 |
| §6-D15（D3 层③ 判据回流：(a)–(d) 四类命中 + 不判红清单） | §6、§4 | C03 / C07 / C09 / E03 |
| §6-D16（扫面口径回流：卡面 = `renderCard` 渲染文本，逐行；数据面 `CARD_TEXT_FIELDS` 不作扫面） | §6、§4 | C01 / C08 / C09 / C11 / D02 |
| §6-D17（A3 判据扩面：表格列头形态 + 『一定会』bullet 形态） | §6、§7 Q8 | K01 / K02 / K03 |
| 落点 #1 `card-contract.mjs` | §3 | A01 / A02 / A03 / A04 / A05 / A06 / A07 |
| 落点 #2 `object-names.mjs` | §3 | A08 / A09 |
| 落点 #3 模板占位符 | §3 | E05 / E06 / E07 |
| 落点 #4 `renderCard` / `expectedBullet` | §3 | B05 / B07 / B08 |
| 落点 #5 `cardFaceIds` | §3 | C01 / C09 |
| 落点 #6 测试断言改造（本块） | §3 | B01 / B02 / B03 / B04 / B05 / B06 / B07 / B08 |
| 落点 #7 15 卡两步写盘（不得手改） | §3 | E08 / E09 / E10 / G05 |
| 落点 #8 `docs/agents/**` 同批重生成 | §3 | G02 |
| 落点 #9 `baseline` 重记 | §3 | G02 |
| 落点 #10 C-7 加现行判据块 | §3 | I01 / I02 |
| 落点 #11 PRD §3.4 加日期注（R8） | §3 | I03 / I04 / I05 |
| 落点 #12 落点 id 改名（`progress.md` → `review.progress`，渲染文本不变） | §3 | E12 / C10 / C11 |
| 落点 #13 A3 判据扩面（`criteria.md` + `check-agent.mjs`） | §3、§6-D17 | K01 / K02 / K03 |
| 落点 #14 pilot-render.test.mjs 断言改形（测试侧改造，非功能项） | §3 | **无独立用例**（GAP-18） |
| §7 Q1（一次性全改 + 一次提交） | §7 | G05 / G06 |
| §7 Q2（`docs/agents/**` 同批重生成） | §7 | G02 |
| §7 Q3（可调语序不可改语义） | §7 | **无自动化用例**（语义不可机判）→ GAP-7 |
| §7 Q4（`card-contract` 放 `vocab/`、依赖红线） | §7 | A01 |
| §7 Q5（三态新增于 `card-contract.mjs`、`enums.mjs` 零改动、无 re-export） | §7 | A10 |
| §8 G-1 / G-2 / G-3 / G-4（已知缺口） | §8  | **无自动化用例**（人工兜）→ GAP-3 / GAP-4 / GAP-5 / GAP-6；G-3 的机判部分由 I05 |
| §8 G-5（占位符替换的语义正确性） | §8 | **只判形态与缺失抛错** → E05 / E06 + GAP-14 |
| §8 G-6（`generate` 与 `replace` 之间的人工确认） | §8 | **只判顺序与 draft 存在** → E10 + GAP-12 |
| 本文件自身（ID 与 `test` 名同名 / 不自递归 / 计数自洽） | 常量 3 / 常量 11 / 常量 14 | J01 / J02 / J03 |

---

## 2 A 组：数据层契约与中文名表（落点 #1 / #2；§6-D1 / D10 / D11；Q4 / Q5）

| ID | 类型 | 覆盖 | 前置 | 步骤 | 预期 | 判据 |
|---|---|---|---|---|---|---|
| S2-TC-A01 | 正 | §3 #1、Q4 | `card-contract.mjs` 已落；可 `import * as CC from '../card-model/vocab/card-contract.mjs'` | `test('S2-TC-A01 契约四导出与形状')`：断导出面与四种形状；断文件在 `vocab/`；打印 `Object.keys(CC)` | 导出**恰四个**名字（多一 / 少一 / 改名即红）；`TYPE_LABELS` 对象、`TRISTATE` 数组、`ALLOWED_PRODUCT_NAMES` 数组、`FORMAT_CHECKS` 数组；文件在 `tools/docgen/card-model/vocab/`（Q4 / ） | `assert.deepEqual(Object.keys(CC).sort(), ['ALLOWED_PRODUCT_NAMES','FORMAT_CHECKS','TRISTATE','TYPE_LABELS'])`；`assert.ok(existsSync(join(REPO,'tools/docgen/card-model/vocab/card-contract.mjs')))`；`assert.ok(Array.isArray(CC.ALLOWED_PRODUCT_NAMES) && Array.isArray(CC.FORMAT_CHECKS) && Array.isArray(CC.TRISTATE) && typeof CC.TYPE_LABELS === 'object')` |
| S2-TC-A02 | 正 | §3 #1、§6-D10、§4-D4 上游（**G2 分层**） | 同 A01；`import * as ENUMS from '../card-model/enums.mjs'` | `test('S2-TC-A02 TYPE_LABELS 三键中文值且键不进许')`：键集与 `Object.keys(ENUMS.CHECK_KINDS)` 比（派生，不手抄）；三值逐字比；断三键**不在** `ALLOWED_PRODUCT_NAMES` | 键集 == `CHECK_KINDS` 的 3 键（`script` / `ai` / `manual`，`enums.mjs`）；值逐字 `脚本核对` / `AI 判定` / `人工判定`；**三个英文键 0 个出现在 `ALLOWED_PRODUCT_NAMES`**（类型键只在 `card-contract.mjs` 内部，进「许」= 与 D4 互斥）。**用 `join` 比较是为与 §4-A1 的数组字面阈值自洽（测试文件本身在 E01 扫描面内，写数组字面会让 E01 恒红），逐字性不变** | `assert.deepEqual(Object.keys(CC.TYPE_LABELS).sort(), Object.keys(ENUMS.CHECK_KINDS).sort())`；`assert.equal(Object.values(CC.TYPE_LABELS).join('｜'), '脚本核对｜AI 判定｜人工判定')`；`assert.equal(Object.keys(CC.TYPE_LABELS).filter(k => CC.ALLOWED_PRODUCT_NAMES.includes(k)).length, 0)` |
| S2-TC-A03 | 负 | §6-D10、§4-D4 上游 | A02 的断言抽成 `assertTypeLabels(map)` | `test('S2-TC-A03 类型值漂移即红')`：喂 ① `{...TYPE_LABELS, ai:'AI判定'}`（去空格）② `{...TYPE_LABELS, manual:'人工'}`（截短） | 两次都抛（判据是逐字相等，不是「包含」） | `assert.throws(() => assertTypeLabels(c1))`；`assert.throws(() => assertTypeLabels(c2))` |
| S2-TC-A04 | 正 | §3 #1、§4-D5 上游（**G1 派生**） | 同 A01；`ENUMS.VERDICTS` 可读 | `test('S2-TC-A04 TRISTATE 由 VERDICTS 派生的 5 行')`：断长度、断 `${1,4}` 段 == `Object.keys(VERDICTS)`、断第 5 行 == `reason`、断首行含四词 | 恰 5 行（1 行中文解释 + 4 行常量）；第 2–4 行 == `VERDICTS` 三键（`enums.mjs` 只 3 值）；第 5 行 == `reason`；**`reason` 不在 `VERDICTS` 内**，故只能由 `TRISTATE` 自带 | `assert.equal(CC.TRISTATE.length, 5)`；`assert.deepEqual(CC.TRISTATE.slice(1,4), Object.keys(ENUMS.VERDICTS))`；`assert.equal(CC.TRISTATE[4], 'reason')`；`assert.equal(Object.keys(ENUMS.VERDICTS).includes('reason'), false)`；`assert.ok([...Object.keys(ENUMS.VERDICTS), 'reason'].every(t => CC.TRISTATE[0].includes(t)))` |
| S2-TC-A05 | 负 | §3 #1 | A04 断言抽成 `assertTristate(list)` | `test('S2-TC-A05 三态形态破坏即红')`：① 追加 `pass` 行；② 交换 `miss` 与 `na` | 两次都抛（多一行 = 6 行；换序 = 逐行不等） | `assert.throws(() => assertTristate([...CC.TRISTATE, 'pass']))`；`assert.throws(() => assertTristate([T[0],T[1],T[3],T[2],T[4]]))` |
| S2-TC-A06 | 正 | §3 #1 | 同 A01 | `test('S2-TC-A06 FORMAT_CHECKS 三条可二值判')`：断条数；逐条扫「废卡」与「缺/空」 | 恰 3 条；每条含 `废卡` 且含 `缺` 或 `空`（= 判句，不是形容词） | `assert.equal(CC.FORMAT_CHECKS.length, 3)`；`assert.ok(CC.FORMAT_CHECKS.every(s => /废卡/.test(s) && /[缺空]/.test(s)))` |
| S2-TC-A07 | 负 | §3 #1 | A06 断言抽成 `assertFormatChecks(list)` | `test('S2-TC-A07 判句写成散文即红')`：喂 `['字段要写全','证据要清楚','建议要给']` | 抛（0 处 `废卡`、0 处可判形态 = 判不了） | `assert.throws(() => assertFormatChecks(['字段要写全','证据要清楚','建议要给']))` |
| S2-TC-A08 | 正 | §3 #2、§4-D3/D6 上游 | `buildCards()` 可取 15 卡；`object-names.mjs` 已落 | `test('S2-TC-A08 名表键集与卡数据双向相等')`：派生 `ALL_OBJ`（must + never 的 objects 并集）/ `ALL_REPEAT`（trigger.repeat 并集，键源 `enums.mjs REPEATS`）；双向比键集；断值形态 | 两表键集与派生集**双向相等**（漏一个 = 渲染退化英文；多一个 = 名表漂移）；值去空白非空且含汉字 | `assert.deepEqual(Object.keys(ON.OBJECT_NAMES).sort(), ALL_OBJ.sort())`；`assert.deepEqual(Object.keys(ON.REPEAT_NAMES).sort(), ALL_REPEAT.sort())`；`assert.ok(Object.values(ON.OBJECT_NAMES).every(v => v.trim() !== '' && /\p{Script=Han}/u.test(v)))` |
| S2-TC-A09 | 负 | §3 #2 | A08 断言抽成 `assertNameTables(obj, rep, wantObj, wantRep)` | `test('S2-TC-A09 名表漏登记 / 多登记各红')`：① 删 `deliverable.body`；② 增 `foo.bar` | 两次都抛（双向相等是判据；`⊇` 的松实现会被这两条抓住） | `assert.throws(() => assertNameTables(omitOne, REP, ALL_OBJ, ALL_REPEAT))`；`assert.throws(() => assertNameTables(withExtra, REP, ALL_OBJ, ALL_REPEAT))` |
| S2-TC-A10 | 正 | §6-D1、Q5、§4-D5 上游（**G1 前提修正**） | `card-contract.mjs` 已落；`enums.mjs` 可读 | `test('S2-TC-A10 三态单源且由 VERDICTS 派生')`：扫 `export const TRISTATE` 定义数；断派生关系与 `enums` 零改动；**不断** `card-must-fields.mjs` 有 `TRISTATE` | 定义**恰 1 处**（`card-contract.mjs`）；`TRISTATE.slice(1,4) == Object.keys(VERDICTS)`；`VERDICTS` 仍 3 值（`enums.mjs` 零改动、无 re-export）；`vocab/card-must-fields.mjs` **不含** `TRISTATE`（实测 `Select-String TRISTATE tools/docgen -Recurse` = 0，故本块**不得**要求该文件提供它）；副本把 4 行常量字面复制回另一模块 → 定义数 2 → 抛 | `assert.equal(defCount, 1)`；`assert.deepEqual(CC.TRISTATE.slice(1,4), Object.keys(ENUMS.VERDICTS))`；`assert.equal(Object.keys(ENUMS.VERDICTS).length, 3)`；`assert.equal(MF_SRC.includes('TRISTATE'), false)`；`assert.throws(() => assert.equal(countDefIn(copy), 1))` |

---

## 3 B 组：行形态与逐字对账（§4-D1 / D2 / A2；落点 #4 / #6 / #7）

| ID | 类型 | 覆盖 | 前置 | 步骤 | 预期 | 判据 |
|---|---|---|---|---|---|---|
| S2-TC-B01 | 正 | §4-D1、落点 #6 | 15 卡已两步写盘落盘；`CARD(s)` 可渲染 | `test('S2-TC-B01 一定会段序号 1..n 且条数相等')`：取「一定会」段行，筛 `^\- \d+｜` 行，比序号集合与条数 | bullet 数 == `card.must.length`；序号集合 == `1..n`（15 席全过，0 例外） | `assert.equal(bullets.length, b.card.must.length)`；`assert.deepEqual(idxs, [...Array(b.card.must.length).keys()].map(i => i + 1))` |
| S2-TC-B02 | 正 | §4-D1 | 同 B01 | `test('S2-TC-B02 禁止段同形')`：对「禁止」段跑 B01 同构断言（`never` 侧） | `never` 段同形：条数 == `card.never.length`、序号 `1..n` | `assert.equal(bullets.length, b.card.never.length)`；`assert.deepEqual(idxs, [...Array(b.card.never.length).keys()].map(i => i + 1))` |
| S2-TC-B03 | 负 | §4-D1、V-7（删一行 / 串一行） | B01 基线绿 | `test('S2-TC-B03 删一行与串一行各红')`：对渲染文本做两种构造（删第 2 个 bullet 行 / 交换第 1、2 行）后跑同一断言组 | ① 条数 n → n−1 → 条数断言抛；② 序号集合仍 `1..n` 但 D2 逐字断言抛（两判不互替） | `assert.throws(() => assertBulletCount(dropped, card))`；`assert.throws(() => assertEqualLines(swapped, card))` |
| S2-TC-B04 | 负 | §4-D2、V-7（改一字） | 同 B03 | `test('S2-TC-B04 改一字只被 D2 抓到')`：第 3 行 `须` → `必须` | 该行仍匹配 D1 正则（说明 D1 抓不到形态内改字），但逐字断言抛 | `assert.match(mutLine, /^- \d+｜/)`；`assert.throws(() => assert.equal(mutLine, expectedBullet(card, 2)))` |
| S2-TC-B05 | 正 | §4-D2、§6-D3、落点 #4 | `expectedBullet` 已导出 | `test('S2-TC-B05 15 卡逐行等于 expectedBullet')`：15 卡 × 每条 must 逐行 `assert.equal(line, expectedBullet(card, i))` | mismatch 计数 0（`expectedBullet` 是唯一翻译点，测试不重写翻译） | `assert.equal(mismatchCount, 0)` |
| S2-TC-B06 | 边界 | §4-D1（空数据边界） | 可构造独立 card 对象传给 `renderCard` | `test('S2-TC-B06 零条 must/never 不残留表头')`：`renderCard({...card, must: [], never: []}, env)` | 两段 bullet 数 0；段内 `｜` 表头行 0；不抛 | `assert.equal(bullets.length, 0)`；`assert.equal(pipes.length, 0)`；`assert.doesNotThrow(() => renderCard(empty, env))` |
| S2-TC-B07 | 正 | §4-D1（数据序口径）、§4-D2 | 至少 1 席 `must.length >= 2` | `test('S2-TC-B07 序号跟随数据序而非 id 序')`：把 `must` 整体反转后渲染，取反转前后两段的 bullet 行；两段都先剥掉行首 `- <i>｜` 前缀再比**正文**，序号另比 | 反转后条数不变；剥掉前缀后正文序列 == 原正文的逆序（**正文跟数据走**）；**序号**仍从 1 重新编号（`1..n`，spec §4-D1「`i` = 该段数据序，从 1 起连续」——故整行不等是预期行为，不得拿整行逐字比）；两序**不等**（n ≥ 2 时 = 序号是数据序，不是 id 序） | `assert.equal(linesRev.length, lines.length)`；`const strip = l => l.replace(/^- \d+｜/, '')`；`assert.deepEqual(linesRev.map(strip), [...lines].reverse().map(strip))`；`assert.deepEqual(prefixIdxRev, [...Array(n).keys()].map(i => i + 1))`；`assert.notDeepEqual(linesRev, lines)` |
| S2-TC-B08 | 正 | §4-A2 探针②、§4-D5、落点 #4 | `TRISTATE` 为可变数组（同模块实例内可改元素） | `test('S2-TC-B08 常量探针：改 TRISTATE[0] 渲染即跟随')`：① `TRISTATE[0]` 加探针串 → 重渲；② 扫磁盘 `agents/*.md`；③ 还原后重渲 | 探针串**出现在渲染卡面**（单源）；磁盘 15 卡探针 **0 命中**（未重生）；还原后卡面归零（构造有效） | `assert.ok(cardText.includes(PROBE))`；`assert.equal(diskHits, 0)`；`assert.equal(cardTextAfterRestore.includes(PROBE), false)` |

---

## 4 C 组：禁 id 守卫（§4-D3 / D6、V-6、§6-D4 / D12；落点 #5）

> **§4-D3 的三层顺序钉死**：① 按**行**排除「一定会」段末三态常量行（4 行常量 + 1 解释行）→ ② 按 **token** 剔除「许」四类 → ③ 余下 token 命中 **(a)** `env` 六个登记集合键（`registeredIds` / `predicates` / `landings` / `sharedScenes` / `seatScenes` / `seatSignals`）/ **(b)** `REPEATS` 键 / **(c)** `CHECK_KINDS` 键 / **(d)** 点分 id 形态（点分小写、末段非 `md`/`mjs`/`json`/`yml`/`yaml`）**任一**才红（spec D15 回流后的口径）。**不判红**：`producer` / `S5-B`（PRD `:175`）与**裸词时刻 id**（`start` / `end` / `before` / `after`，现盘 77 处合法渲染，归 spec §8 G-7）。**扫面 = `renderCard` 的渲染文本逐行**（spec D16）——故本组凡「塞」一律塞进 `duty.action`（渲染原样、可见）；`Action.objects[]` / `landing` 会被译成中文，塞它们测不到。本组逐层给探针。

| ID | 类型 | 覆盖 | 前置 | 步骤 | 预期 | 判据 |
|---|---|---|---|---|---|---|
| S2-TC-C01 | 正 | §4-D3、落点 #5、V-6 基线 | 15 卡可 `buildCards()`；`cardFaceIds` 已导出（双参） | `test('S2-TC-C01 15 卡卡面零命中')`：逐席 `cardFaceIds(b.card, env)` | 返回数组、空（空数组 = 过）；**层① 生效**：三态常量行若漏排除，本用例即红 | `assert.ok(Array.isArray(cardFaceIds(b.card, env)))`；`assert.deepEqual(cardFaceIds(b.card, env), [])`；`assert.equal(cardFaceIds.length, 2)` |
| S2-TC-C02 | 负 | §4-D3 ③ **五类** id、V-6「塞回 1 个 → 红」（**时刻类不判 → spec §8 G-7**） | 五类各取该表**第 1 个键**（派生：`shared-actions` 的 `shared.*` / `SHARED_SCENES` 的 `session` / `REPEATS` / `predicates` / `vocab/landings`）；**不含 `MOMENTS`**（裸词时刻 id 不判，见 D15 / G-7）；**依赖落点 #12 已改**（`vocab/landings.mjs` 键 `'progress.md'` → `'review.progress'`，值仍 `'progress.md 正文'`） | `test('S2-TC-C02 五类 id 各塞 1 个必红')`：逐次塞进 `duty.action` 后调 `cardFaceIds` | 5 次各非空且含该 id（动作 `shared.*` 走 (d) 点分形态 / 场景 `session` 走 (a) / repeat 走 (b) / 判据走 (a) `env.predicates` / 落点走 (a) `env.landings`）；落点类代表 = `Object.keys(LANDINGS)` 的派生取值（**不写死字面**；改名后为 `review.progress`） | `assert.equal(ID_CLASSES.length, 5)`；`assert.deepEqual(ID_CLASSES.map(id => cardFaceIds(cardWith(id), env).includes(id)), [true,true,true,true,true])`；`assert.equal(ID_CLASSES[4], Object.keys(LANDINGS)[0])` |
| S2-TC-C03 | 负 | §4-D4 上游 + §4-D6（**G2 互斥消解**） | 同 C02；`CHECK_KINDS` / `REPEATS` 键可派生 | `test('S2-TC-C03 类型英文键与 repeat 键名塞进卡面必红')`：塞 `script` / `ai` / `manual` / `per-round` 各一次（进 `duty.action` 与 `checkItems[].label` 各一次） | 全部非空：`script` / `ai` / `manual` 是 `CHECK_KINDS` 键，只许活在 `card-contract.mjs` 内部，卡面出现即红（D4 同向）；`per-round` 是 `REPEATS` 键（D6）；**反证**：`TYPE_LABELS` 三**中文值**塞进卡面必须仍空（否则「中文化」被判红 = 误伤） | `assert.deepEqual(['script','ai','manual','per-round'].map(t => cardFaceIds(cardWith(t), env).length > 0), [true,true,true,true])`；`assert.deepEqual(Object.values(CC.TYPE_LABELS).map(v => cardFaceIds(cardWith(v), env).length), [0,0,0])` |
| S2-TC-C04 | 正 | §4-D3 层②（先剔许四类）、V-6 反例（不误伤合法英文）、落点 #5 | 同 C01；`ALLOWED_PRODUCT_NAMES` 可读；**依赖落点 #12 已改** | `test('S2-TC-C04 许的四类不误红')`：构造一句同时含产物字段名（`evidence` / `reason` / `verdict` / `ALLOWED_PRODUCT_NAMES` 三态值）/ 真实路径 `agents/reviewer-qa.md:31` / 可跑命令 `node --test tools/docgen/test/s2-card-rewrite.test.mjs` / 工具名 `Read`、`Glob`、`Grep` / 卡片七字段中文名 | 返回空数组（许优先级最高，先剔除再判）；**本句刻意不含任何落点 id**（改名后 id 为 `review.progress`；`progress.md` 已降为渲染文本 / 真实路径形态，其三分支见 C10） | `assert.deepEqual(cardFaceIds(cardWith(ALLOWED_SENTENCE), env), [])`；`assert.equal(ALLOWED_SENTENCE.includes('review.progress'), false)` |
| S2-TC-C05 | 边界 | §4-D3 层③ 非点分形态按「全等」判、§6-D4（禁子串） | 同 C01 | `test('S2-TC-C05 无点分近形不算命中')`：三构造 `xsharedimpartial-long-term` / `impartial-long-term-x` / `sharedXimpartial-long-term`（**都刻意不带点**——点分近形由 (d) 形态判必红，见 C07） | 三者都空（非点分形态下命中必须 token 全等；含子串不红） | `assert.deepEqual([A,B,C].map(t => cardFaceIds(cardWith(t), env).length), [0,0,0])` |
| S2-TC-C06 | 边界 | §4-D3 层② 剔除顺序、§6-D4 | 同 C01 | `test('S2-TC-C06 真实路径与 id 同行只判 id')`：一句同时含 `tools/docgen/cli.mjs` 与 `shared.impartial-long-term` | 非空且**只**含该 id 一项（路径整段被剔除，不得把路径碎片当命中） | `assert.deepEqual(cardFaceIds(cardWith(MIXED), env), ['shared.impartial-long-term'])` |
| S2-TC-C07 | 负 | §4-D3 层②③ 判别力（**G2 未登记 token 必红**） | 同 C01 | `test('S2-TC-C07 未登记 token 必红且守卫非空转')`：① 只含许四类的句子；② 同句把某一许换成未登记 token `trace.id`；③ 再换 `foo.bar` | ① 空；② 非空且含 `trace.id`；③ 非空——证明「不误红」不是因为守卫根本没生效；**`producer` / `S5-B` 不在此列**（PRD `:175` 明文「不在本段扫描面」，口径张力记 GAP-11） | `assert.deepEqual(cardFaceIds(cardWith(OK), env), [])`；`assert.ok(cardFaceIds(cardWith(TRACE), env).includes('trace.id'))`；`assert.ok(cardFaceIds(cardWith(FOOBAR), env).length >= 1)` |
| S2-TC-C08 | 正 | V-6 全量、§4-D3 / D6 | 词表派生（env 六集合键 ∪ `CHECK_KINDS` 键 ∪ `REPEATS` 键 ∪ 名表键 ∪ 点分形态正则；**不含 `MOMENTS`** → G-7） | `test('S2-TC-C08 15 席磁盘与渲染面全量 0 命中')`：对磁盘卡面 + 渲染卡面逐文件扫派生词表 | 0 命中；且扫描集合非空（席数 ≥ 1、词表 ≥ 20）——防「词表为空则恒 0」 | `assert.equal(hits, 0)`；`assert.ok(SEATS.length >= 1 && TERMS.length >= 20)` |
| S2-TC-C09 | 负 | V-6 判别力、§6-D12 / D16 面边界（`rationale` 不渲染） | 同 C01；扫面 = 渲染文本（`renderCard` 输出） | `test('S2-TC-C09 只红被塞的那席且 rationale 不可见')`：① 给 1 席塞 id（进 `duty.action`），统计红席集；② 把同一 id 塞进 `card.rationale`；③ 逐个**进渲染面的**字段塞（`duty.trigger` / `duty.categories[]` / `duty.action` / `duty.constraint` / `CheckItem.label`） | ① 恰好 1 席红并点名；② 仍 0（`rationale` 不进渲染面，卡面看不见 = 不是「卡面 id」）；③ 5 个进渲染面的字段**各 1 次非空**（漏扫任一 = 该字段在渲染面上恒绿，本步即红）；`Action.objects[]` 塞英文 id 会被 `OBJECT_NAMES` 译成中文、`landing` 同理译成中文 → **不纳入**本步（见 D16） | `assert.deepEqual(redSeats, [S])`；`assert.deepEqual(cardFaceIds(cardWithRationale(S), env), [])`；`assert.deepEqual(VISIBLE_FIELDS.map(f => cardFaceIds(cardWithIn(f, ID), env).length > 0), [true,true,true,true,true])` |
| S2-TC-C10 | 负 | V-6 反例改判（**Q6-b / G3**）、`vocab/landings.mjs` 落点 id（§3 #12） | 同 C01；**依赖落点 #12 已改**：`LANDINGS` 键 `'progress.md'` → `'review.progress'`，**值仍 `'progress.md 正文'`** | `test('S2-TC-C10 progress.md 三分支：落点 id 红 / 正文名绿 / 带路径绿')`：① 塞落点 id `review.progress`；② 塞裸 `progress.md`；③ 塞 `docs/superpowers/reviews/x/progress.md` | ① **非空且含 `review.progress`**（改名后它是唯一落点 id，卡面禁出现）；② **空**（`progress.md` 已不是 id，只作渲染文本形态）；③ **空**（`目录/文件` 形态 = 许① 真实路径，防「路径一律判红」的错实现）；另断**落点表键集**不含 `progress.md`（改名后唯一写死处是 `vocab/landings.mjs`，实现若两键并存 → 本用例红） | `assert.ok(cardFaceIds(cardWith('review.progress'), env).includes('review.progress'))`；`assert.deepEqual(cardFaceIds(cardWith('progress.md'), env), [])`；`assert.deepEqual(cardFaceIds(cardWith('docs/superpowers/reviews/x/progress.md'), env), [])`；`assert.equal(Object.keys(LANDINGS).includes('progress.md'), false)` |
| S2-TC-C11 | 边界 | §4-D3 层① 的排除边界（**新增**，依赖 #12 / D16） | 同 C01；**塞法按 D16 统一进 `duty.action`**（渲染原样、可见）；层① 只该剔「段末 5 行三态」，不该剔「含三态 token 的任意行」 | `test('S2-TC-C11 层①只剔段末 5 行，正文行不整行豁免')`：① 一条 must 的 `duty.action` 写成同时含 `hit` 与 `review.progress`（渲染后同一 bullet 行里两个 token 都在）；② 同一条的 `duty.action` 只含 `hit` | ① 非空且含 `review.progress`（若层① 按「行内含三态 token 就整行放过」→ 0 → 本用例即红）；② 空（`hit` 在层②「许」里被剔除，不得误红） | `assert.ok(cardFaceIds(cardWith({action:'hit 与 review.progress 同行'}), env).includes('review.progress'))`；`assert.deepEqual(cardFaceIds(cardWith({action:'hit'}), env), [])` |

---

## 5 D 组：类型列中文化 + 三态行 + 前提（§4-D4 / D5 / D7）

| ID | 类型 | 覆盖 | 前置 | 步骤 | 预期 | 判据 |
|---|---|---|---|---|---|---|
| S2-TC-D01 | 正 | §4-D4 | 15 卡已两步写盘落盘 | `test('S2-TC-D01 本席清单类型列只许三值')`：取「本席清单」表每行类型列格 | 格集 ⊆ `脚本核对` / `AI 判定` / `人工判定`；空格 0；`script` / `ai` / `manual` 命中 0 | `assert.ok(cells.every(c => TY3.includes(c)))`；`assert.equal(cells.filter(c => c === '').length, 0)`；`assert.equal(cells.filter(c => ['script','ai','manual'].includes(c)).length, 0)` |
| S2-TC-D02 | 负 | §4-D4 + §4-D3（双判同向；**常量 6 子进程**） | `coldRepo` 副本可用；子进程重渲工具在位 | `test('S2-TC-D02 类型未翻译时两判同红')`：副本把 `card-contract.mjs` 里 `TYPE_LABELS.ai` 的值改成英文 `ai` → **子进程** `import` 副本模块重渲，输出类型列与 `cardFaceIds` 结果 | 类型列出现英文 `ai` → D01 断言抛；同一次输出的 `cardFaceIds` 非空（同一处走形被两条判据同时抓到）；子进程必须 exit 0（否则是「跑不通」不是「判红」） | `assert.equal(r.code, 0)`；`assert.throws(() => assertTypeCells(parsed.typeCells))`；`assert.ok(parsed.ids.length >= 1)` |
| S2-TC-D03 | 边界 | §4-D4「不删任何一列」 | 同 D01 | `test('S2-TC-D03 四列不减')`：① 断表头列数 == 4 且四列全非空；② 构造删「类型」列 | ① 15 席全过；② 抛（删列 = 判据消失，不是「简化」） | `assert.equal(cols, 4)`；`assert.ok(colNonEmpty.every(n => n >= 1))`；`assert.throws(() => assert.equal(colsAfterDelete, 4))` |
| S2-TC-D04 | 正 | §4-D5 | 同 D01 | `test('S2-TC-D04 三态 5 行逐字且在段末')`：断「一定会」段末 5 行 == `TRISTATE` | 逐行相等；且三态在**段末**（`slice(-5)`），不得插在段中 | `assert.deepEqual(segLines.slice(-5), CC.TRISTATE)` |
| S2-TC-D05 | 负 | §4-D5 | D04 断言抽成 `assertTristateLines(lines)` | `test('S2-TC-D05 三态缺行 / 换序即红')`：① 删 `na` 行；② 交换 `miss` 与 `na` | 两次都抛（4 行 ≠ 5 行；逐行不等） | `assert.throws(() => assertTristateLines(withoutNa))`；`assert.throws(() => assertTristateLines(swapped))` |
| S2-TC-D06 | 正 | §4-D7 | `requires` 全空的条数可派生（本基线 15 卡全空） | `test('S2-TC-D06 前提：无 0 命中')`：15 卡扫 `前提：` 与 `前提：无` 计数 | 两计数都 0（`requires` 为空**不渲染**该行，而不是渲染「前提：无」） | `assert.equal((t.match(/前提：/g) ?? []).length, 0)`；`assert.equal(t.includes('前提：无'), false)` |
| S2-TC-D07 | 负 | §4-D7 判别力 | 可 `renderCard` 直渲构造卡（绕过 S1 校验门） | `test('S2-TC-D07 requires 非空才出现前提')`：构造 `must[0].requires = [{ id: 'probe', must: true }]` | 卡面出现 `前提：` ≥ 1；且 `前提：无` 仍 0（若实现把「无」当兜底渲染 → 抛） | `assert.ok((mut.match(/前提：/g) ?? []).length >= 1)`；`assert.equal(mut.includes('前提：无'), false)` |

---

## 6 E 组：复用不复制 + 占位符 + 写盘两步（§4-A1 / A3 / A4、§6-D2 / D11；落点 #3 / #7）

| ID | 类型 | 覆盖 | 前置 | 步骤 | 预期 | 判据 |
|---|---|---|---|---|---|---|
| S2-TC-E01 | 正 | §4-A1、V-9 | 扫描面 = **卡面渲染链**：`tools/docgen/components` ∪ `tools/docgen/card-model` ∪ `tools/docgen/templates` ∪ `scripts/` ∪ `agents/`（`walkFiles` 同口径，跳过 `node_modules` / `.git`），并排除 `*.test.mjs`（spec §6-D18 收窄；阈值 = 常量 9 不变） | `test('S2-TC-E01 契约枚举全仓只有一处')`：对每文件取所有 `[...]` 数组字面；统计含 ≥2 个契约枚举值的数组 | 除 `card-contract.mjs` 外 0 处；且 `card-contract.mjs` 内 ≥ 1 处（**防恒真**：若扫描器写错面则为 0） | `assert.deepEqual(copyFiles, [])`；`assert.ok(copyFilesAll.length >= 1)` |
| S2-TC-E02 | 负 | §4-A1 反证、V-9 | `coldRepo` 副本 | `test('S2-TC-E02 故意别处再加一份即红')`：副本新增 `tools/docgen/components/type-labels-copy.mjs`（含 `脚本核对` + `AI 判定` 二字面） | 扫描命中 1 且点名该文件 → 断言抛 | `assert.deepEqual(copyFiles, ['tools/docgen/components/type-labels-copy.mjs'])`；`assert.throws(() => assertNoCopy(copyFiles))` |
| S2-TC-E03 | 正 | §4-A3、V-9（**G2 换构造**） | 同 C01；`ALLOWED_PRODUCT_NAMES` 同模块实例可 push | `test('S2-TC-E03 新增一个许名只改一处即绿')`：① 基线空；② 塞 `rubric.score`（**点分形态 → (d) 必红**、未在许）；③ 内存把 `rubric.score` 加进 `ALLOWED_PRODUCT_NAMES`（**只此一处**）；④ 还原 | 四态成立：空 → 红 → 只改 `card-contract.mjs` 这一处即绿 → 还原回空。证明「无第二套白名单、改一处生效」，且**不用 `trace.id`**（它是未登记 token 的必红探针，归 C07） | `assert.deepEqual(cardFaceIds(base, env), [])`；`assert.ok(cardFaceIds(probe, env).length >= 1)`；`assert.deepEqual(cardFaceIds(probeWithAllowed, env), [])`；`assert.deepEqual(cardFaceIds(base, env), [])` |
| S2-TC-E04 | 负 | §4-A3 反证（源码静态扫；**GAP-16**） | 同 C01；`components/cardFaceIds.mjs`（**D19 落点**）+ `components/renderCard.mjs` + `validateCardModel.mjs` 源码可读 | `test('S2-TC-E04 许表只有一处：实现文件里没有第二份许值数组')`：读上述三处源码，取所有 `[...]` 数组字面；断其中**不含** `ALLOWED_PRODUCT_NAMES` 的任何元素字面（如 `'evidence'` / `'verdict'` / `'reason'`） | 命中 0 处（许只认 `card-contract.mjs` 的一处导出）；副本在 `cardFaceIds.mjs` 写入 `const CARD_FACE_EXTRA = ['evidence','verdict']` → 命中 ≥ 1 → 抛（构造有效性） | `assert.deepEqual(extraArrays, [])`；`assert.throws(() => assert.deepEqual(extraArraysCopy, []))` |
| S2-TC-E05 | 正 | §4-A4、落点 #3 | 15 卡已落盘；模板已改占位符 | `test('S2-TC-E05 占位符不残留且新占位符在位')`：15 卡扫 `{{`；模板扫新旧占位符 | 15 卡 `{{` **0 次**；`{{MUST_BULLETS}}` `{{NEVER_BULLETS}}` `{{TRISTATE}}` `{{PRODUCT_NAMES}}` `{{FORMAT_CHECKS}}` 各 ≥ 1；旧名 `{{MUST_TABLE}}` `{{NEVER_TABLE}}` 0 次 | `assert.equal(count(t, /{{/g), 0)`；`assert.ok(NEW_TPLS.every(p => tpl.includes(p)))`；`assert.equal(OLD_TPLS.filter(p => tpl.includes(p)).length, 0)` |
| S2-TC-E06 | 负 | §4-A4（**G5-1 子进程**） | 副本模板可改；子进程工具在位 | `test('S2-TC-E06 未填占位符即抛 MissingSlot')`：① 副本**不追加**时子进程渲一次（基线应 exit 0）；② 副本模板追加 `{{PROBE_UNFILLED}}` 后子进程重渲；③ 子进程脚本 `catch` 到 `code === 'MissingSlot'` 时 `process.exit(3)` | ① 基线 exit 0（防「恒非 0」= 构造无效）；② 改后 exit **3** 且 stderr 含 `MissingSlot`（**必须子进程**：本进程模板在 `cardTemplate.mjs` 加载即固化，改副本后本进程重渲恒绿） | `assert.equal(base.code, 0)`；`assert.equal(mut.code, 3)`；`assert.match(mut.out, /MissingSlot/)` |
| S2-TC-E07 | 正 | §6-D2、落点 #3 | 模板与 `renderCard.mjs` 可读 | `test('S2-TC-E07 契约字面不得长在模板/渲染器')`：两文件扫 `脚本核对` / `AI 判定` / `人工判定` / `hit` / `miss` / `na` / `reason` / `废卡` | 两文件命中 0（模板只有占位符、渲染器只 import 常量）；副本把 4 行常量写进模板 → 命中 ≥ 1 → 抛 | `assert.equal(countAll, 0)`；`assert.throws(() => assert.equal(countAllCopy, 0))` |
| S2-TC-E08 | 负 | §6-D2「15 卡不得手写」、落点 #7（两步写盘已落） | 15 卡已走 `draft → 确认 → replace --yes` 落盘；`coldRepo` 可用 | `test('S2-TC-E08 15 卡逐字节等于渲染且手改即红')`：逐卡 `disk === CARD(s)`；副本追加 1 字节后跑 `gate` | 基线 15/15 逐字节相等；副本 → 不等，`gate` exit 1 且输出含 `Mismatch` | `assert.equal(disk, CARD(s))`；`assert.notEqual(mutatedDisk, CARD(s))`；`assert.equal(gate.code, 1)`；`assert.match(gate.out, /Mismatch/)` |
| S2-TC-E09 | 正 | §6-D11、落点 #7（**G4 新增**） | 15 卡已落盘；`agents/*.md` 的 sha 清单可取 | `test('S2-TC-E09 generate 只比不写')`：① 取 `agents/*.md` 全量 sha256 清单；② 跑 `node tools/docgen/cli.mjs generate`；③ 再取清单；④ 跑 `node tools/docgen/cli.mjs generate --readme --apply` 后再取 `agents/` 清单 | 三次清单**逐键相等**（`generate` 只比不写；`--readme --apply` 只落 `docs/agents/**`，`cli.mjs`）；`agents/` 一个字节都不动（G4） | `assert.deepEqual(after1, before)`；`assert.deepEqual(after2, before)`；`assert.ok(before.length === SEATS.length)` |
| S2-TC-E10 | 边界 | §6-D11 写盘顺序（**G4 新增**） | `coldRepo` 副本；`DOCGEN_DRAFTS_DIR` 指向副本 | `test('S2-TC-E10 两步写盘：draft 先落、无 draft 的 replace 必拒')`：① 副本取某席 `agents/<席>.md` sha → 跑 `draft --kind agent --name <席>` → 再取 sha；② 不带 `--draft` 跑 `replace --kind agent --name <席> --yes` | ① `.drafts/<席>--*.md` 存在且 `agents/<席>.md` sha **不变**（写盘不在 draft 这一步）；② exit ≠ 0 且含 `DraftNotFound`（`cli.mjs`）→ 顺序颠倒即红；`replace` 成功那一跳的人工确认不机判（GAP-12 / spec §8 G-6） | `assert.equal(draftFiles.length, 1)`；`assert.equal(shaAfterDraft, shaBefore)`；`assert.notEqual(noDraft.code, 0)`；`assert.match(noDraft.out, /DraftNotFound/)` |
| S2-TC-E11 | 负 | §4-A1 三态枚举类、§4-D5「不得在别处字面写这 4 个值」（**新增**） | `coldRepo` 副本；扫描阈值 = 常量 9 | `test('S2-TC-E11 三态四值字面副本即红')`：副本在 `components/renderCard.mjs` 追加 `const TRISTATE_COPY = ['hit','miss','na','reason']`；扫描器跑副本与仓内各一次 | 副本命中 1 处并点名该文件 → A1 断言抛；仓内仍 0 处（构造不落盘） | `assert.deepEqual(copyFiles, ['tools/docgen/components/renderCard.mjs'])`；`assert.throws(() => assertNoCopy(copyFiles))`；`assert.deepEqual(repoCopyFiles, [])` |
| S2-TC-E12 | 正 | §3 #12、§5 V-6（**Q6-b 连带核对**） | `vocab/landings.mjs` 已按 §3 #12 改名；可 `import { LANDINGS as L } from '../card-model/vocab/landings.mjs'`；15 卡可渲染 | `test('S2-TC-E12 落点 id 改名连带核对')`：① 断键集含 `review.progress`、不含 `progress.md`；② 断该键渲染文本仍是 `progress.md 正文`；③ 15 卡渲染文本里凡出现 `progress.md 正文` 处逐字等于 `L['review.progress']` | ① 键集双向：含新 id、0 个旧 id（只改键、不许两键并存）；② 值**一字不改**（改名只动 id，不动渲染文本）；③ 15 卡该串 0 处出现也算过，出现则字面必须等于常量（渲染文本不受改名影响） | `assert.ok(Object.keys(L).includes('review.progress'))`；`assert.equal(Object.keys(L).includes('progress.md'), false)`；`assert.equal(L['review.progress'], 'progress.md 正文')`；`assert.deepEqual(renderedHits.filter(t => t !== L['review.progress']), [])`；`assert.ok(Object.keys(L).length >= 1)` |

---

## 7 F 组：判别力夹具（新 spec §4 三类常驻夹具、V-7）

| ID | 类型 | 覆盖 | 前置 | 步骤 | 预期 | 判据 |
|---|---|---|---|---|---|---|
| S2-TC-F01 | 正 | 夹具① 宾语≠落点、V-7 | `buildCards()` 可取 | `test('S2-TC-F01 夹具①宾语≠落点 + 必红构造')`：派生 objects ≠ landing 的条数；断言该行同时含两中文名且两串不等；再构造把该条 landing 改成 objects 同值 | 基线条数 ≥ 1；构造后该条数 **0**（证明夹具是构造出来的，不是恒真） | `assert.ok(n >= 1)`；`assert.ok(line.includes(objName) && line.includes(landName))`；`assert.notEqual(objName, landName)`；`assert.equal(nBroken, 0)` |
| S2-TC-F02 | 正 | 夹具② 两行同值、V-7 | 同 F01 | `test('S2-TC-F02 夹具②两行同值 + 必红构造')`：找同一中文名在同一行出现 ≥2 次的行（objects 与 landing 同值）；再构造把该条 objects 换名 | 基线行数 ≥ 1；构造后 0（同名额同行的重复渲染是渲染槽丢失的探针） | `assert.ok(rows >= 1)`；`assert.ok(countIn(line, name) >= 2)`；`assert.equal(rowsBroken, 0)` |
| S2-TC-F03 | 正 | 夹具③ 共享句只 1 席渲染、V-7（**G5-1 子进程**） | `coldRepo` 副本可改 `vocab/shared-actions.mjs` 的 `SHARED_USE`；子进程工具在位 | `test('S2-TC-F03 夹具③共享句只 1 席 + 必红构造')`：① 子进程渲未改副本 → 统计含该共享句中文译文的席数；② 副本把 `SHARED_USE` 只留 1 席 → 子进程重渲 → 再统计 | 基线 == 席数；构造态 == 1（两者不等 → 夹具真在构造，不是恒 1）；两次子进程都 exit 0 | `assert.equal(seatsAll, SEATS.length)`；`assert.equal(seatsOne, 1)`；`assert.equal(r1.code, 0 && r2.code, 0)` |
| S2-TC-F04 | 负 | V-7「丢 landing 槽 → 红」、落点 #4（**G5-1：D2 自洽陷阱的唯一独立断言**） | 副本可改 `renderCard.mjs`；`vocab/landings.mjs` 中文值可读；子进程工具在位 | `test('S2-TC-F04 渲染器丢 landing 槽必红')`：① 子进程渲未改副本 → 断言「每条 must 行必含其 landing 的中文名（`LANDINGS[landing]` 或 `LANDING_VARS` 变量名）」（**不经 `expectedBullet`**）；② 副本删 `renderCard.mjs` 里 must 行的 landing 输出段 → 子进程重渲 → 同一条独立断言 | 基线命中 == must 条数；构造后 < 条数 → 抛。**必须子进程**：本进程既缓存模板、且 `expectedBullet` 与 `renderCard` 会在自洽丢槽时**同时**丢 → 「行 == expectedBullet」恒绿，本用例是唯一能独立变红的断言 | `assert.equal(hitsBase, total)`；`assert.ok(hitsBase > 0)`；`assert.equal(r1.code, 0 && r2.code, 0)`；`assert.throws(() => assert.equal(hitsBroken, total))` |
| S2-TC-F05 | 边界 | 夹具常驻 / 构造不落盘（**G5-2 sha 内容锚**） | 跑完 F01–F04 | `test('S2-TC-F05 夹具只读不写仓（sha 锚）')`：对「构造会触及的源文件」（`components/renderCard.mjs` / `templates/agent-card.md.tpl` / `vocab/shared-actions.mjs` / `vocab/card-contract.mjs`）与 `agents/*.md` 全量，跑 F01–F04 前后各取 sha256 清单 | 前后清单**逐键相等**（构造全在内存或 `mkdtemp`）；**不断 `git status` 为空**（本轮工作区实测脏：`skills/dev-workflow/references/gate-record.md` 有未提交行，断干净会立跑即红） | `assert.deepEqual(after, before)`；`assert.ok(before.length >= 4 + SEATS.length)` |

---

## 8 G 组：门禁与单源实现点（V-10 / V-9、§3 #9、Q1 / D11）

| ID | 类型 | 覆盖 | 前置 | 步骤 | 预期 | 判据 |
|---|---|---|---|---|---|---|
| S2-TC-G01 | 正 | V-10（R8） | `scripts/scope-sweep.mjs` 在位 | `test('S2-TC-G01 改判回扫绿')`：`node scripts/scope-sweep.mjs --check` | exit 0 且末行含 `sweep ok`（只认退出码与末行） | `assert.equal(code, 0)`；`assert.match(out, /sweep ok/)` |
| S2-TC-G02 | 正 | V-10、§3 #7 / #8 / #9、§4-A2 探针①、Q2 | 15 卡已两步写盘落盘、`generate --readme --apply` 已跑、`baseline --write` 已跑 | `test('S2-TC-G02 gate 绿且生成物与 baseline 齐')`：`node tools/docgen/cli.mjs gate`；读 `tools/docgen/baseline.json` 与 `components/baseline.mjs` 的 `BASELINE_RULES` / `agentPaths()`；数 `docs/agents/*.md` 并逐行核 README 链接目标；副本删 1 份 README 再跑 `gate` | exit 0；`baseline N/N` 且 N == `BASELINE_RULES.length + 席数`（派生，不写死）；`baseline.json` 条目集与派生全集**双向相等**，其中 `agents/` 条目 == 席数；`docs/agents` 文件数 == 席数 + 1 且链接目标缺失 0；构造删 1 份 → exit 2 且含 `DanglingBaselineEntry` | `assert.equal(code, 0)`；`assert.match(out, new RegExp('baseline ' + TOTAL + '/' + TOTAL))`；`assert.deepEqual([...baseline].sort(), [...BASELINE_RULES, ...agentPaths()].sort())`；`assert.equal(baseline.filter(p => p.startsWith('agents/')).length, SEATS.length)`；`assert.equal(docsFiles.length, SEATS.length + 1)`；`assert.equal(missingLinks, 0)`；`assert.equal(gone.code, 2)`；`assert.match(gone.out, /DanglingBaselineEntry/)` |
| S2-TC-G03 | 正 | V-9「同一判据实现点恰 1」、§6-D3 / D12 | 全仓可扫 | `test('S2-TC-G03 两个判定函数各只定义一处')`：扫 `export function cardFaceIds` 与 `export function expectedBullet` 定义数；断 `cardFaceIds` 只消费既有常量（`CARD_TEXT_FIELDS` 等价面 + `registeredIdsOf`），文件内无第二份禁表字面 | 各恰 1 处（`validateCardModel.mjs` / `renderCard.mjs`）；`validateCardModel.mjs` 内 0 个新禁表字面数组 | `assert.equal(defOf('cardFaceIds'), 1)`；`assert.equal(defOf('expectedBullet'), 1)`；`assert.equal(newForbiddenLiteralsIn('validateCardModel.mjs'), 0)` |
| S2-TC-G04 | 负 | V-9 反证 | 副本可用 | `test('S2-TC-G04 第二实现点即红')`：副本在 `renderCard.mjs` 再写一份 `export function cardFaceIds` | 定义数 2 → 抛 | `assert.throws(() => assert.equal(defOf('cardFaceIds', copy), 1))` |
| S2-TC-G05 | 正 | Q1（**已改「一次性全改 + 一次提交」**，）、D11 | 本块提交已存在（`<S2-BASE>` 起算） | `test('S2-TC-G05 一次性全改 + 一次提交')`：`git log <S2-BASE>..HEAD --numstat --format=%H｜%s -- agents/` | 触及 `agents/*.md` 的提交数 == **1**；该提交触及的 `agents/*.md` 数 == 席数（派生）；`--numstat` 两列都 > 0（有增有删 = 卡面真被改写）；message 含 S2 标识 | `assert.equal(commits.length, 1)`；`assert.equal(filesInCommit, SEATS.length)`；`assert.ok(added > 0 && deleted > 0)` |
| S2-TC-G06 | 负 | Q1 反证 | 同上 | `test('S2-TC-G06 拆成多次提交即红')`：对断言函数喂「2 次提交各触及 1 席」的构造 diff 集 | 抛（一次性全改才可核：`state.json` 标 `replaced` 后单席比对不可行，`cli.mjs`） | `assert.throws(() => assertOneShotAllSeats(twoCommits))` |
| S2-TC-G07 | 正 | §5 首日不红、V-10 | `scripts/check-observable.mjs` 在位 | `test('S2-TC-G07 observable hits 仍 0')`：`node scripts/check-observable.mjs --check --json` | `hits.length === 0` 且 `ok === true`；exit 0（S2 不改 `rules/` / `skills/` 正文） | `assert.equal(json.hits.length, 0)`；`assert.equal(json.ok, true)`；`assert.equal(code, 0)` |

---

## 9 H 组：理解度与「不加」类差异（V-11 / V-11-b、§6-D7 / D8 / D9）

| ID | 类型 | 覆盖 | 前置 | 步骤 | 预期 | 判据 |
|---|---|---|---|---|---|---|
| S2-TC-H01 | 边界（**执行型**） | §5 V-11④（**Q7 读法①**） | ① `L_before` 取 `docs/reports/2026-11-01-s2-card-comprehension-baseline.md` 的**同交集口径**（= 该报告总条目 − 达成数，派生不写死：基线记 3 席合计 `59/102` → `L_before = 43`）② 题面与计分表冻结 ③ 双判分**逐项取交集**（两人都判「达成」才算达成；分歧项不进交集、另记），**分歧 > 3 项启动第三实例裁定**，**裁定记录写进该报告 `§裁定`** | `test('S2-TC-H01 V-11 理解度复测（人工执行）')`：3 席（`reviewer-qa` / `reviewer-audit` / `detective-observer`）用**同题面同计分表**复测新卡；逐条 0/1，按交集记漏项数 `L_after` | 读法①双条件**同时**成立：`L_after ≤ ⌊L_before × 0.5⌋`（基线 `L_before = 43` → 上限 21）**且** `L_before − L_after ≥ 1`（净减少至少 1 项，防「分母变了也算过」）；3 席全过才算过；机判部分只核报告结构（基线报告含 `59/102`、新报告含「未达成 `L_after`」一行、分歧项清单在位、`§裁定` 节在位） | `assert.equal(L_after <= Math.floor(L_before * 0.5) && L_before - L_after >= 1, true)`；`assert.ok(BASELINE.includes('59/102'))`；`assert.ok(NEW_ROWS.some(r => r.includes('未达成')))`；`assert.ok(NEW_SRC.includes('§裁定'))`；**执行方式：人工 / 独立实例，非自动化** |
| S2-TC-H02 | 边界（**执行型**） | V-11-b | 答题实例的输入清单与计分表冻结 | `test('S2-TC-H02 V-11 测量隔离（人工执行）')`：核答题实例输入 = 只有 `agents/<seat>.md` 一份；核计分表未含门禁题 | 输入清单长度 == 1（0 份规则 / PRD / 门禁提示）；计分表条目数 == 基线 34 项且门禁类题数 0；门禁若立项单独计，不进 V-11 分数 | `assert.equal(inputList.length, 1)`；`assert.equal(scoreItems, 34)`；`assert.equal(gateItems, 0)`；**执行方式：人工 / 独立实例，非自动化** |
| S2-TC-H03 | 边界 | §6-D7、V-11-b | 15 卡已落盘 | `test('S2-TC-H03 产出须含 path:line 不挂卡面')`：15 卡扫 `/产出须含/` 与 `/必须自给/`；计分表扫同类题 | 两处都 0（该约束只许进规则 / 门禁，不进卡面、不计入 V-11） | `assert.equal(cardHits, 0)`；`assert.equal(scoreHits, 0)` |
| S2-TC-H04 | 正 | §6-D8 | 同 H03 | `test('S2-TC-H04 无问题也写结论不加')`：15 卡扫 `/无问题也写结论/`；派生 must bullet 总数 | 0 命中；bullet 总数 == 派生条数（未因该题新增条） | `assert.equal(hits, 0)`；`assert.equal(bulletTotal, derivedTotal)` |
| S2-TC-H05 | 负 | §6-D8 判别力 | 副本可用 | `test('S2-TC-H05 加一条即红')`：副本给某席 must 追加一条「无问题也写结论」型句 | H04 的同构断言抛（证明「不加」是可判的，不是没人管） | `assert.throws(() => assert.equal(hitsConstructed, 0))` |
| S2-TC-H06 | 正 | §6-D9 | 15 卡已落盘；`scripts/` ∪ `rules/` 可扫 | `test('S2-TC-H06 不得先改后记转可跑判据')`：15 卡扫 `/已代为/` `/已代删/`；全仓扫同类字面判据载体 | 卡面 0 命中；`scripts/` ∪ `rules/` 内有 ≥ 1 处可执行检索（字面串 + 退出码判据），不写成卡面散文 | `assert.equal(cardHits, 0)`；`assert.ok(carriers.length >= 1)` |
| S2-TC-H07 | 边界 | §6-D9 | 同 C01 | `test('S2-TC-H07 写进卡面才红且与禁 id 不互替')`：构造把该句写进 `duty.action` | 卡面命中 ≥ 1 → H06 抛；同时 `cardFaceIds` 仍空（禁 id 只管登记 id，不管散文 → 两条判据互不替代） | `assert.ok(count(constructed) >= 1)`；`assert.deepEqual(cardFaceIds(constructedCard, env), [])` |

---

## 10 I 组：上游同批与「不改正文」面（§3 #10 / #11、§5 首日不红）

> **本组统一前置**：`<S2-BASE>` 取值见常量 14——优先 `process.env.S2_BASE`，**缺失时降级为「spec 最近一次提交；若等于 `HEAD`（本批已提交）则取父提交」并 `t.diagnostic` 点名**（不 skip、不 fail-closed，G5-3；D21）。「只加不改」用 `git diff --numstat <S2-BASE> -- <file>`（**比工作区，不加 `..HEAD`**，否则未提交改动算不进去）；「没改」用 sha 内容锚（常量 15）。构造一律在 `mkdtemp` 副本，不写仓内。

| ID | 类型 | 覆盖 | 前置 | 步骤 | 预期 | 判据 |
|---|---|---|---|---|---|---|
| S2-TC-I01 | 正 | §3 #10、§6-D6（C-7 只加不改） | S4 spec 可读；`<S2-BASE>` 已取（或降级并点名） | `test('S2-TC-I01 S4 spec 有现行判据块且原文零删除')`：扫该文件「现行判据」节标题与日期串；跑 `git diff --numstat <S2-BASE> -- <S4 spec>` | 含「现行判据」节 + `2026-11-01` 日期注；numstat **新增行 > 0 且删除行 = 0**（除新增块外逐字未变） | `assert.ok(/^## .*现行判据/m.test(src))`；`assert.ok(src.includes('2026-11-01'))`；`assert.ok(added > 0)`；`assert.equal(deleted, 0)` |
| S2-TC-I02 | 负 | §6-D6 反证（删块即红） | 同上；副本可用 | `test('S2-TC-I02 删掉 C-7 判据块即红且仓内锚不变')`：副本里删掉「现行判据」整节（含日期注）后跑 I01 的断言函数；仓内该文件跑前跑后取 sha256 | 副本上 I01 断言抛；仓内该文件 sha256 **前后相等**（构造没落盘；不断 `git status` 为空，常量 15） | `assert.throws(() => assertC7Block(copySrc))`；`assert.equal(repoShaAfter, repoShaBefore)` |
| S2-TC-I03 | 正 | §3 #11、R8（PRD 只加注） | 该 PRD 可读；`<S2-BASE>` 已取 | `test('S2-TC-I03 PRD §3.4 日期注指向唯一源')`：**定位文末「附录 C 日期注」行**（D19 后注落在文末，§3.4 不留行内注）；跑 `git diff --numstat <S2-BASE> -- <PRD>` | 行内正则命中 `card-contract.mjs` ≥ 1（且路径存在）；含 `2026-11-01`；numstat 删除行 **0** | `assert.ok((src.match(/card-contract\.mjs/g) ?? []).length >= 1)`；`assert.ok(existsSync(join(REPO, 'tools/docgen/card-model/vocab/card-contract.mjs')))`；`assert.ok(noteLine.includes('2026-11-01'))`；`assert.equal(deleted, 0)` |
| S2-TC-I04 | 负 | §3 #11 反证（注指死路径即红） | 同 I03；副本可用 | `test('S2-TC-I04 日期注指向不存在路径即红')`：副本把注里的路径改成 `tools/docgen/card-model/vocab/card-contract-v2.mjs`（不存在）后跑 I03 的断言函数 | 副本上 I03 的 `existsSync` 断言抛；仓内该文件 sha256 不变 | `assert.equal(existsSync(join(REPO, NOTE_PATH)), true)`；`assert.throws(() => assert.equal(existsSync(join(copy, NOTE_PATH_BAD)), true))`；`assert.equal(repoShaAfter, repoShaBefore)` |
| S2-TC-I05 | 边界（**执行型**） | §3 #11 语义面、§8 G-3 | 同 I03 | `test('S2-TC-I05 原文未改 + 注在位（语义同义交审计）')`：机判部分只核「PRD §3.4 原文一字未改 + 日期注在位 + 注指向的路径存在」；**语义同义性（PRD 原句 = 常量的意思）不写自动化断言** | 机判：删除行 0、注在位、路径存在三项全过；语义同义 = 审计抽核并记入 `gate-record.md`（人工，不进 `node --test`） | `assert.equal(deleted, 0)`；`assert.ok(noteInPlace)`；`assert.ok(existsSync(join(REPO, NOTE_PATH)))`；**执行方式：语义同义由审计抽核，人工，非自动化** |
| S2-TC-I06 | 正 | §5 首日不红（S2 不改 `rules/` 与 `skills/` 正文；**G5-2 sha 内容锚**） | `<S2-BASE>` 已取；`scripts/check-observable.mjs` 在位；**D20 白名单** = `skills/dev-workflow/references/gate-record.md`（签字载体，不是正文） | `test('S2-TC-I06 rules/skills 零改动且 observable hits 仍 0')`：① `git ls-tree -r <S2-BASE> -- rules skills` 取 blob 清单；② 对 `rules/` ∪ `skills/` 每个工作区文件跑 `git hash-object`；③ `node scripts/check-observable.mjs --check --json` | 两张 blob 清单**逐键相等**（新增 / 删除键都算改动）；**唯一豁免** `gate-record.md`（门行账本，每过一门必落行，R1/R3 要求）；`json.hits.length === 0` 且 `json.ok === true`；exit 0。**不断 `git status` 为空**（脏树会立跑即红） | `assert.deepEqual(changed, [])`（除白名单）；`assert.deepEqual(missing, [])`；`assert.equal(json.hits.length, 0)`；`assert.equal(json.ok, true)`；`assert.equal(code, 0)` |

---

## 11 J 组：本文件自核（ID 同名 / 不自递归 / 计数自洽）

| ID | 类型 | 覆盖 | 前置 | 步骤 | 预期 | 判据 |
|---|---|---|---|---|---|---|
| S2-TC-J01 | 正 | 常量 3（ID 前缀与函数名同名）、本文件 §1 / §2–§11 | 本文件可读（`readFileSync` testcase 路径） | `test('S2-TC-J01 ID 与步骤列首的 test 名逐条同名')`：解析用例表第 1 列的 ID，与每行「步骤」列首那个 `test` 调用所挂的 `S2-TC-<ID>` 前缀比对（本行自身只出现 1 次 `test` 调用，防自指误报） | 两集合**双向相等**；每行恰 1 个 test 名（0 个或多个都算红）；ID 无重复 | `assert.deepEqual([...idsInTable].sort(), [...idsInSteps].sort())`；`assert.equal(rowsWithoutTestName, 0)`；`assert.equal(new Set(idsInTable).size, idsInTable.length)` |
| S2-TC-J02 | 正 | 常量 11（不自递归，**G7**） | 本文件可读 | `test('S2-TC-J02 全文不得 spawn 门禁')`：① 只对**调用形态行**扫（含 `spawnSync` / `execFileSync` / `execSync` / `runNode(` 且同行为门禁总脚本或其 npm 别名）；② 只对**「步骤」列**扫门禁命令字面 | ① 调用形态命中 **0**（散文里写「不得跑」不算违规，故按调用形态判）；② 步骤列命中 **0**（用例步骤不许真的跑门禁总脚本）；③ 散文声明句 ≥ 1（守「扫描器没写错面」） | `assert.equal(callFormHits, 0)`；`assert.equal(stepColumnHits, 0)`；`assert.ok(proseMentions >= 1)` |
| S2-TC-J03 | 边界 | 本文件计数自洽（能抓住「声称 70 实际 61」这类错，**G7**） | 本文件可读；`tools/execution-matrix/markdown-rows.mjs` 的 `splitRow` 可 import | `test('S2-TC-J03 声明计数 == 实测计数')`：从文件头解析两处声明（状态行 `**用例总数 N**` 与**最后一条**修订记录行「用例数 X（正 A / 负 B / 边界 C）」——旧修订记录行属历史、不参与比对）；再用 `splitRow` 逐行切单元格，取第 1 列匹配 `/^S2-TC-[A-K]\d\d$/` 的行数与三类计数（`边界（**执行型**）` 归入边界） | 实测行数 == 两处声明的总数（逐处相等）；三类实测值 == 两处声明的三类值（逐键相等）；类型列不出现「正 / 负 / 边界」之外的值 | `assert.equal(actualRows, declaredTotal)`；`assert.equal(actualRows, declaredTotalInRevision)`；`assert.deepEqual(actualTypes, declaredTypes)`；`assert.deepEqual(actualTypes, declaredTypesInRevision)`；`assert.deepEqual(Object.keys(actualTypes).sort(), ['正','负','边界'])` |

---

## 11.1 K 组：A3 判据扩面（spec §6-D17）

> **本组只测形态判定，不测业务语义**：A3 判的是「卡里有没有一处必答清单载体」——载体形态二选一（表格表头含『必答』或『必问』**或**『一定会』节内 ≥1 行匹配 `^- \d+｜`，取并集，spec §6-D17「只加不删」）。**不判**「这份必答清单是否真的问全了」（业务语义不可机判 → §12 GAP-17，归 ④ 段 sdet 抽核）。
> **统一前置**：三条一律**只 import `tools/execution-matrix/check-agent.mjs` 的 `checkAgentFromText`**（`node --test` 单文件可跑），**不 spawn 门禁总脚本**（常量 11 / J02）；三个构造卡全在内存里拼（常量 5），不写仓内文件。
> **判据列形式约定**：断言 ASCII 竖线一律用正则转义 `\x7C`（字符类 / 字面竖线都会破坏本 markdown 表格，常量 10）。
> **断言面只覆盖 `A3`**：三个构造卡都是最小卡（不含闭环 / 证据字样），故 `A4` / `A5` 会红——与 A3 无关，不作断言；K01 另带 `A6` / `A7` 各 0 条（证明构造卡两节在位，红项不被缺节掩盖）。

| ID | 类型 | 覆盖 | 前置 | 步骤 | 预期 | 判据 |
|---|---|---|---|---|---|---|
| S2-TC-K01 | 正 | §6-D17（A3 扩面的新形态：『一定会』bullet）、§7 Q8、落点 #13 | `checkAgentFromText` 可 import（只 import 它）；D17 的 `checkStruct` 分支已落（`^- \d+｜` 形态，见 `criteria.md` 的 A3 判定方式） | `test('S2-TC-K01 A3 扩面：只有 bullet 也过')`：构造最小卡 = front matter + `## 一定会` 节内 1 行 `- 1｜做某事` + `## 边界` + `## 输出格式`（**无任何表头含『必答』或『必问』的表格**）→ 调一次 `checkAgentFromText(card)` | `findings` 里 **0 条 `A3`**（旧形态缺、新形态在 → 扩面生效）；构造有效性三项同批断：`^- \d+｜` 行数 == 1（bullet 真写进去了，不是空节）、ASCII 竖线开头行数 == 0（确实没有表格形态）、`A6` / `A7` 各 0 条（两个节在位，红项不被无关缺节掩盖） | `assert.equal(checkAgentFromText(card).findings.some(f => f.code === 'A3'), false)`；`assert.equal(card.split('\n').filter(l => /^- \d+｜/.test(l)).length, 1)`；`assert.equal(card.split('\n').filter(l => /^\s*\x7C/.test(l)).length, 0)`；`assert.equal(checkAgentFromText(card).findings.filter(f => ['A6','A7'].includes(f.code)).length, 0)` |
| S2-TC-K02 | 边界 | §6-D17（旧形态保留 = 存量兼容边界）、§7 Q8、落点 #13 | 同 K01 前置；`criteria.md` 的 A3 旧判句（表头含『必答』或『必问』）未被删 | `test('S2-TC-K02 A3 扩面：旧表格形态仍过')`：构造最小卡 = front matter + `## 一定会` 节内 1 张表（表头 `# / 必问 / 回答` + 1 行数据）+ `## 边界` + `## 输出格式`，**节内 0 条 bullet** → 调一次 `checkAgentFromText(card)` | `findings` 里 **0 条 `A3`**（旧形态未因扩面失效，存量手写卡不断）；构造有效性两项：该表头行在文本里**恰 1 行**（防「表根本没写进去 → 本用例其实在测空卡」）、`^- \d+｜` 行数 == 0（本卡确实只有表形态，不靠新形态蒙过） | `assert.equal(checkAgentFromText(card).findings.some(f => f.code === 'A3'), false)`；`assert.equal(card.split('\n').filter(l => /^\s*\x7C # \x7C 必问 \x7C 回答 \x7C\s*$/.test(l)).length, 1)`；`assert.equal(card.split('\n').filter(l => /^- \d+｜/.test(l)).length, 0)` |
| S2-TC-K03 | 负 | §6-D17 判别力（两形态皆无 → 必红；**围栏内 bullet 不算**）、`check-agent.mjs` 的 `fenceMask` 口径（围栏内内容对 A3–A7 一律不看）、§7 Q8 | 同 K01 前置；围栏识别口径 = `markdown-rows.mjs` 的 `fenceMask` | `test('S2-TC-K03 A3 两形态皆无必红且围栏内 bullet 不算')`：两个构造各调一次 `checkAgentFromText`——① 纯文本卡（`## 一定会` 内写 `- 不做某事`（不匹配 `^- \d+｜`）、全卡 0 张表）；② 同构卡但把 `- 1｜…` 写进 `## 一定会` 节内的代码围栏块（围栏外仍是 0 条 bullet、0 个含『必问』的表头） | ① `findings` **含 `A3`**（证明扩面后判别力没降）；② `findings` **仍含 `A3`**（围栏内的 bullet 被掩掉、不算清单）；且 ② 的文本里**确实出现** `- 1｜`（证明是围栏隔离生效，不是「没写进去」而红） | `assert.equal(checkAgentFromText(plain).findings.some(f => f.code === 'A3'), true)`；`assert.equal(plain.split('\n').filter(l => /^- \d+｜/.test(l)).length, 0)`；`assert.ok(fenced.includes('- 1｜'))`；`assert.equal(fenced.split('\n').filter(l => /^- \d+｜/.test(l)).length, 1)`；`assert.equal(checkAgentFromText(fenced).findings.some(f => f.code === 'A3'), true)` |

---

## 12 GAP：spec 项未被用例覆盖 / 只能在用例之外判

| # | 未被覆盖或在用例之外 | 归属 spec 项 | 处置 |
|---|---|---|---|
| **GAP-1** | **「禁止」段的逐字对账签名未定义**：spec §3 只写 `expectedBullet(card, i)`，未说 never 侧怎么取行（同签名换 list？加第三参？） | §4-D1 / D2、§3 #4 | 本文件 B02 / B03 用「D1 正则 + 条数 + 数据序」判 never 侧，**逐字性只对 must 侧执行**；建议 spec 补一句 never 侧签名，否则 B02 的实现方式二义 |
| **GAP-2** | **「gate baseline 重记有审计抽 3 席核」**：抽核是签字动作，无机器判面 | V-10、§3 #9 | 人工（审计抽 3 席，记入 `gate-record.md`）；自动化侧只判 baseline 分母（G02） |
| **GAP-3** | **译文语义正确性**（「这条判据翻译得对不对」）：机器只判形态与词表 | §8 G-1  | 议会测试评委独立实例回读（不进本文件） |
| **GAP-4** | **行为类要求**（如「无问题也写结论」模型是否照做） | §8 G-2  | ④ 段 sdet 抽核 + 规则层（若立项） |
| **GAP-5** | **PRD §3.4 与 `card-contract.mjs` 的语义同义性**：只能比字面 | §8 G-3  | 审计抽核 + R8 回扫；I03 / I04 / I05 只判「日期注在位 + 注指向的路径存在 + 原文删除行 0」，语义同义由 I05 标「执行型」交审计 |
| **GAP-6** | **`V-11` 分数的判分噪声**（同一卷跨判分人差 6 项） | §8 G-4 、V-11 | 双判分 + 第三人裁定（H01 的判据已含该前置，但噪声本身不可机判） |
| **GAP-7** | **Q3「可调语序与连接词，不可改语义」**：语义不可机判 | §7 Q3  | 并入 GAP-3 同一人工口径；本文件只判形态（`expectedBullet` 逐字 + 六类 id 零命中） |
| **GAP-8** | **PRD §4 的体积守卫（15 卡净增 ≤ 改前 +40%）** 未进 spec §5 | PRD §4 `:218` | 本块无对应用例；若要求，须先在 spec §5 补判据（逐字节 baseline 比对口径） |
| **GAP-9** | **§4-D3 的 token 切分字符集未写死**（只说「切 token 后全等」） | §4-D3、§6-D4、§6-D16 | 本文件 C05 / C06 / C07 用黑盒构造句判「禁子串」语义，切分集由 `cardFaceIds` 实现负责（常量 8）；D16 定扫面 = 渲染文本后，切分须覆盖全角 `／`（卡面用全角分隔）——实现须在 spec ③ 段补一句切分定义，测试侧不复制 |
| **GAP-10** | **§4-A1 的「同形数组」阈值**由本文件按 spec 逐字钉死（≥2 个契约枚举值计 1 处） | §4-A1  | 常量 9；E01 / E02 / E04 按该阈值判，若 spec 改口径须同批改该常量 |
| **GAP-11** | **`producer` / `S5-B` 该红还是该绿**（原口径张力）：PRD `:175` 明文「档位枚举与死路径串不在本段扫描面」→ 不判；而层③ (d) 的形态判会把「未登记点分 token」判红（`trace.id` / `foo.bar`）。二者**已由 spec D15 消解**：不判红清单显式列 `producer` / `S5-B`，形态判只收「点分且末段非扩展名」 | §6-D5 / §6-D15 / §4-D3 、PRD `:175` | **本文件不为这两个 token 写断言**（C07 只用 `trace.id` / `foo.bar` 作「未登记必红」代表，另用「`producer` 不红」做反向探针）；张力已在 ② 段由 D15 裁定，无需再上议会 |
| **GAP-12** | **`generate` 与 `replace` 之间的人工确认是否真做**：机器只能核最终字节 | §8 G-6  | E10 只判「draft 先落 + 无 draft 的 replace 必拒 + draft 不动 `agents/`」；人工确认由审计抽核 `state.json` 与 `git diff` |
| **GAP-13** | **「全量门禁绿」不在本文件执行**：spawn 门禁总脚本会与 ② 段 `node --test` 自递归 | V-10 、常量 11 | 由门禁自身（② 段测试 + ②.5 段 `gate`）跑；本文件只跑单条可独跑的命令（G01 / G02 / G07） |
| **GAP-14** | **`{{}}` 占位符替换的语义正确性**（填进去的句子对不对） | §8 G-5  | E05 判「无残留 + 新占位符在位」、E06 判「未填即抛 `MissingSlot`」；语义正确由议会回读 + ④ 段 |
| **GAP-15** | **裸词时刻 id（`start` / `end` / `before` / `after`）零判别力**：它们与 `MOMENTS` 键全等，但卡面**合法**渲染「时刻：end」（现盘 15 卡 77 处）；本块不做时刻中文名表（F-03 只给 `objects` / `repeats`） | §8 G-7 / §4-D3 不判红② | C02 由「六类」改「五类」（时刻类不判）、C08 的派生词表不含 `MOMENTS`；缺口由 ④ 段 sdet 抽核「时刻：<英文>」兜，S3 扩判定面时补名表 |
| **GAP-16** | **「许值副本」不被 A1 抓**：A1 只统计「≥2 个**契约枚举值**」的数组字面（`TYPE_LABELS` 中文值 ∪ `TRISTATE` 4 值），所以别处抄一份 `['evidence','verdict']` 这类**许值**数组不会红 | §4-A1 / §4-A3 | E02 只覆盖契约枚举副本；E03 / E04 覆盖「许表只认 `card-contract.mjs`」的**生效性**（改别处不生效），但「多一份许值数组」本身不判红 → ④ 段 sdet 抽核 / S3 扩 A1 阈值时补 |
| **GAP-17** | **K 组覆盖 A3 的形态判定面；A3 的业务语义不可机判** | §6-D17 / §7 Q8、`criteria.md` 的 A3 判定对象 | ④ 段 sdet 抽核 |
| **GAP-18** | **落点 #14 只改既有测试断言、不新增被测功能** | spec §3 #14 / §6-D17 | 改形是否正确由 ④ 段 sdet 复核，不进本文件自动化面 |

**spec 必需项的覆盖缺口（D1–D7 / A1–A4 / §6-D1–D17 / V-6 / V-7 / V-9 / V-10 / V-11 / V-11-b）**：**无**——逐条已在 §1 覆盖总表指派到用例（`§6-D5` 一项按 PRD `:175` 明文**不写断言**，见 GAP-11）；上表 **18** 项是「spec 内已声明但机器判不了」与「spec 未定义、本文件钉了口径」两类，不是漏指派。

---

## 13 计数与落点核对

| 项 | 值 | 可核方式 |
|---|---|---|
| 用例总数 | **79** | 用例表行数（`S2-TC-` ID 数）；J03 判 |
| 正 | **39** | 类型列计数 |
| 负 | **26** | 类型列计数 |
| 边界 | **14** | 类型列计数（含 3 条标「执行型」：H01 / H02 / I05） |
| 负 + 边界 vs 正 | **40 ≥ 39 成立**（负 26 + 边界 14 = 40） | 上两行相加；`rules/spec-testcase-gate.md` 判据 3「负例与边界 ≥ 正例」因此满足 |
| 各组条数 | A 10 / B 8 / C 11 / D 7 / E 12 / F 5 / G 7 / H 7 / I 6 / J 3 / K 3 = **79** | 按 ID 首字母分组计数 |
| 复算方式 | 逐行用 `splitRow`（`tools/execution-matrix/markdown-rows.mjs`）取第 1 列，匹配 `^S2-TC-[A-K]\d\d$` 的行按首字母分组计数；类型列计数时把 `边界（执行型）` 归入「边界」 | J03 已把「声明值 vs 实测值」做成自动化断言（逐键相等），本条不需要人肉复算 |
| 负例面说明（K 组） | K 组新增以正例为主；K02 归边界后 40 ≥ 39，判据 3 成立；负例面由 K03 + 原 25 条负例承载；A3 语义面不可机判已在 §12 记 **GAP-17**（④ 段 sdet 抽核） | 与上一行算式同一份实测（J03 的类型列计数） |
| 测试文件（建议） | `tools/docgen/test/s2-card-rewrite.test.mjs` | 一个用例一个 `test('S2-TC-<ID> …')` 块；ID 前缀 == 函数名首 token（J01 判） |
| 组 → 函数名 | A 契约与名表 / B 行形态与逐字 / C 禁 id / D 类型列与三态与前提 / E 复用与占位符与写盘两步 / F 夹具 / G 门禁与单源 / H 理解度与「不加」/ I 上游同批与「不改正文」/ J 自核 / K A3 判据扩面（形态面） | 逐条函数名见各表「步骤」列首；I 组统一前置 `<S2-BASE>`（常量 14） |
| 运行方式 | `node --test tools/docgen/test/s2-card-rewrite.test.mjs`（门禁总脚本不在此列，常量 11 / GAP-13） | J02 判 |
