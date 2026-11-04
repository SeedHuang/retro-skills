# S-E 批：`dimension` 补齐 + G1 人设句堵漏（+ S-D 残余 ③ 迁账）

> 状态：**草稿（① 段范围，待独立审计判旁路）**｜建 2026-11-04｜作者 = 主 agent｜本批 plan 同时是本批的完整施工记录
> 用户确认（2026-11-04）：范围 = Task 0 清 S-D 遗留 P3 ／ `(e)` `senior-sdet` 补 `dimension='测试设计'` ／ G1 改文案 + V9 加词面 + B04 每格非空。
> 口径：判据只认命令退出码与计数；`path:line` 一律当场 `Select-String` 打印（G10：`gate-record.md` LF/CRLF 混用，行号可差 1）。

## 0 全貌确认

| 项 | 内容 |
|---|---|
| 本质 | 补一条数据键（S4-L4）+ 闭合一条判据漏检（G1）+ 迁一条过程账（S-D 残余 ③） |
| 同族 | `dimension` 的校验面（`tools/docgen/components/validateAgentData.mjs:111` 的 `BASE_KEYS` 已含该键、可选、未要求非空）、投影面（`docs/agents/**` 16 份 = 15 席 + README）、V9 人设词三面（`data/seats/**` / `agents/*.md` / `docs/agents/*.md`）、`S4-TC-B04` 表头断言 |
| 边界 | 不动其余 14 席数据与 `agents/*.md` 源卡；已签 spec / testcase 只做「签后增量登记」，不改其它结论句 |
| 验收（可机械判） | ① `npm run check` 末行 `check 全部通过`；② `node tools/docgen/cli.mjs gate` → `baseline 38/38`；③ 三面人设词（`资深` / `20 年` / `十年`）计数 **0**；④ `docs/agents/README.md` 维度列 15 格**非空**；⑤ 重生成后 `git status --porcelain` 对 `docs/agents/**` **0 行**（= 盘上 == 渲染器输出） |
| 影响面 | `data/seats/senior-sdet.json`、`sdet-data.test.mjs`、`sc-card-shape.test.mjs`、`card-render.test.mjs`、S-C spec §11.8 / 其 testcase、S4 testcase 的 B04 行、`docs/agents/**` 16 份、`gate-record.md`（门行 + `⑤@S-D` 兑付）、两份 `docs/after`、本 plan、本批审计记录、`docs/reports/2026-11-04-s-d-evidence/` 2 件（Task 0） |
| 联动四问·治本 | 只改文案 = 补数据不补判据；**加断言才是堵漏**（V9 词面 + B04 非空） |
| 联动四问·副作用 | 词面加 `十年` 的扫描面与 `SC-TC-29/31` 同宽（三面）；改前现盘三面合计 **2**（`data` 1 + `docs/agents` 投影 1，实跑 `Select-String -Path tools/docgen/data/seats/*.json,agents/*.md,docs/agents/*.md -Pattern '十年'` → 2 命中），故 T2 必须与改文案 + 重生成**同一任务**，否则当场红（重生成后归 0） |
| 联动四问·跨问题 | G1 / G3 / G11 同属「投影面判据」族，本批只做 G1；G3（用例计数锚点自命中 61）、G11（投影 0 diff 无机械判据）留观察，不并入 |
| 联动四问·跨页面 | `dimension` 只被 `renderReadme.mjs:17`（单席文档头）与 `:36`（README 表格行）消费，影响面可枚举 |

## 1 旁路自证（审计实例出，主 agent 只转录）

- **判据一（F 集合差集为空）**：**成立** —— `git diff -U0 -- <两份 PRD>` 输出 0 行、exit 0；两侧 48 行 / 24 个唯一 ID（`F-01`…`F-24`）与 0 行 / 0 个 ID，双向差集 0 / 0。
- **判据二（不新增交付物）**：**成立** —— 变更清单逐行落 §3 白名单、白名单外真实变更 0；新增 spec 0 / 新增 testcase 0 / 新增载体（规则 / 技能 / 角色卡 / 新脚本）0；三件 A 属纯流程文档（plan / 审计记录 / 证据迁账映射）。
- **审计的独立判断**：T2 / T3 的「既有判据内加严」**不构成**新增交付物、**也不构成**新增用例（用例块 1520 / 70 文件、`sc-card-shape` 60 块、`card-render` 61 块、testcase 行 60 / 122 均不变）。
- 全文与 7 条真问题见 `docs/reports/2026-11-04-s-e-bypass-audit.md`；计划门两轮见 `docs/reports/2026-11-04-s-e-plan-gate.md`（含 §7 复核轮）。

## 2 任务表

| # | 任务 | 产出（文件 / 命令） | 依赖 |
|---|---|---|---|
| T0 | S-D 残余 ③ 迁账 | `docs/reports/2026-11-04-s-d-evidence/{impact-sheet.md, README.md}`；删 `.session/reviews/2026-11-04-s-d/`；`gate-record.md` 的 `⑤@S-D` 残余 ③ 加兑付登记（只改路径串 + 加一句兑付） | — |
| T1 | `dimension='测试设计'` | `data/seats/senior-sdet.json` 加键；`sdet-data.test.mjs` 的 `KEYS` 与 `:17` 断言翻转；`generate --readme --apply` 重生成 16 份 | Consumes: Task 0 |
| T2 | G1：文案 + V9 词面 | `senior-sdet.json` 的 `rationale` 首句去资历表述；`sc-card-shape.test.mjs` 的 `SC-TC-29` / `SC-TC-31` 词面数组加 `十年`；S-C spec 的 §11.4 `:108` 与 §11.8 `:151` 两处 + 其 testcase 对应行同步；再重生成 16 份 | Consumes: Task 1 |
| T3 | B04 每格非空 | `card-render.test.mjs` 的 `S4-TC-B04` 块加「README 维度列 15 格非空」断言；S4 testcase 的 B04 行补预期 + **覆盖列补锚到 S4 spec 的结构行**（`seatEntry = { name, role, dimension, outputKind, tools, card }`，`docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md` 第 80 行） | Consumes: Task 2 |
| T4 | R8 登记与门禁 | `tools/scope-sweep/keywords.json` 加 `I34`（V9 人设词面旧写法）→ `--freeze` → `--check`；本批 `impact-sheet.md` §2 逐条填处置 | Consumes: Task 2 |
| T5 | 收口 | 六条段门行（`①@S-E` / `②@S-E` / `②→③@S-E` / `③@S-E` / `④@S-E` / `⑤@S-E`）；`docs/after/20261104101304-…` 的 G1 行移入 §5.1（闭合依据 = 本批）；`docs/after/20261031165047-…` 删 S4-L4 条；plan §7 执行记录 | Consumes: Task 3, Task 4 |

## 2.1 任务小节（`check-plan deps` 的机械证据位；缺本节则 `nodes 0 / edges 0 => fail`）

### T0 迁账（S-D 残余 ③）
- Consumes: 无
- 产出：`docs/reports/2026-11-04-s-d-evidence/impact-sheet.md`（逐字复制）+ `README.md`（映射与「不会被自动发现」说明）；删 `.session/reviews/2026-11-04-s-d/`；`gate-record.md` 的 `⑤@S-D` 残余 ③ 追加兑付登记。
- 验收：`git hash-object` 前后相等；`Test-Path .session/reviews/2026-11-04-s-d` = False；`sweep ok`。

### T1 `dimension='测试设计'`
- Consumes: Task 0
- 产出：`data/seats/senior-sdet.json` 加 `"dimension": "测试设计"`；`sdet-data.test.mjs` 的 `KEYS` 加 `'dimension'`、`:17` 由「不得有该键」翻转为「值 = `测试设计`」、`:8` 注释改写；`node tools/docgen/cli.mjs generate --readme --apply`。
- 验收：`gate` → `baseline 38/38`；`docs/agents/senior-sdet.md:4` = `- 维度：测试设计`；README 该格 = `测试设计`；`git diff --stat -- docs/agents` 只 2 份变。

### T2 G1：文案 + V9 词面
- Consumes: Task 1
- 产出：`senior-sdet.json` 的 `rationale` 首句「有十年以上经验的测试开发工程师。」→「测试开发工程师。」（其余逐字不动）；`sc-card-shape.test.mjs` 的 `SC-TC-29` / `SC-TC-31` 词面数组加 `十年`；S-C spec 的 §11.4 `:108` 与 §11.8 `:151` 两处 + 其 testcase 的 `:70` / `:506` 同步；再 `generate --readme --apply`。
- 验收：三面 `资深 0 / 20 年 0 / 十年 0`；`SC-TC-29` / `SC-TC-31` 单跑绿；`gate` 仍 `38/38`。

### T3 B04 每格非空
- Consumes: Task 2
- 产出：`card-render.test.mjs` 的 `S4-TC-B04` 块内加「README 维度列 15 格非空」断言；S4 testcase 的 B04 行补预期 + 覆盖列补锚（S4 spec 第 80 行的 `seatEntry`）。
- 验收：绿 = 15/15 非空；红 = 副本删 `dimension` 键 → 断言失败且错误信息点名席名与列名。

### T4 R8 登记与门禁
- Consumes: Task 2
- 产出：`tools/scope-sweep/keywords.json` 加 `I34`（V9 人设词面的旧写法）；`--freeze` 重写 `baseline.json`；本批 `impact-sheet.md` §2 逐条填处置。
- 验收：`node scripts/scope-sweep.mjs --check` exit 0（`counts` 含 `I34` 且与基线同值）。

### T5 收口
- Consumes: Task 3, Task 4
- 产出：六条段门行（`①@S-E` / `②@S-E` / `②→③@S-E` / `③@S-E` / `④@S-E` / `⑤@S-E`）；`docs/after/20261104101304-…` 的 G1 行移入 §5.1；`docs/after/20261031165047-…` 删 S4-L4 条；plan §7 执行记录。
- 验收：`node scripts/check-gate-record.mjs` → `bad 0`；`npm run check` 末行 `check 全部通过`。

## 3 白名单（变更清单，逐行可核）

| # | 路径 | 形态 | 由谁写 |
|---|---|---|---|
| 1 | `tools/docgen/data/seats/senior-sdet.json` | M | T1 + T2 |
| 2 | `tools/docgen/test/sdet-data.test.mjs` | M | T1 |
| 3 | `tools/docgen/test/sc-card-shape.test.mjs` | M | T2 |
| 4 | `tools/docgen/test/card-render.test.mjs` | M | T3 |
| 5 | `docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md` | M（§11.4 `:108` 与 §11.8 `:151` 两处词面） | T2 |
| 6 | `docs/superpowers/specs/2026-11-03-s-c-card-shape-design-testcase.md` | M（词面口径与两条用例预期） | T2 |
| 7 | `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design-testcase.md` | M（B04 行预期） | T3 |
| 8 | `docs/agents/senior-sdet.md` | M（重生成） | T1 + T2 |
| 9 | `docs/agents/README.md` | M（重生成） | T1 |
| 10 | `tools/scope-sweep/keywords.json` | M（加 I34） | T4 |
| 11 | `tools/scope-sweep/baseline.json` | M（`--freeze` 重写） | T4 |
| 12 | `skills/dev-workflow/references/gate-record.md` | M（T0 兑付 + 6 条段门行） | T0 / T5 |
| 13 | `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` | M（G1 闭合登记） | T5 |
| 14 | `docs/after/20261031165047-agent-card-s4-open-items.md` | M（删 S4-L4 条） | T5 |
| 15 | `docs/reports/2026-11-04-s-d-evidence/README.md` | A（Task 0 新建） | T0 |
| 16 | `docs/reports/2026-11-04-s-d-evidence/impact-sheet.md` | A（Task 0 迁移，逐字复制） | T0 |
| 17 | `docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md` | A（本件） | 主 agent |
| 18 | `docs/reports/2026-11-04-s-e-bypass-audit.md` | A（①② 旁路审计） | 审计实例 |
| 19 | `docs/reports/2026-11-04-s-e-plan-gate.md` | A（计划门） | 审计实例 |
| 20 | `docs/reports/2026-11-04-s-e-quality-evidence/`（① `quality-4.md` ② `quality-4-audit.md` ③ `step-3-audit.md`（③ 段审计记录，2026-11-04 由 `.session/reviews/2026-11-04-s-e/` 迁入） ④ `delivery-5-claim.md` ⑤ `delivery-5-audit.md`） | A（④ / ⑤ 账，进 git） | sdet / 审计 / 主 agent |
| 21 | `docs/handoffs/2026-11-04-next-batch-after-s-e.md` | A（收口交接词） | 主 agent |

**不在白名单**：`.session/**`（过程账，不进 git；`findImpactSheet` 只扫此处与 `docs/superpowers/reviews/`，故本批 `impact-sheet.md` 落 `.session/reviews/2026-11-04-s-e/`，不落 `docs/`）。

## 4 不改清单（动了即返工）

- `agents/*.md` 15 张源卡（本批零改动；G1 的句子只在 `docs/agents` 投影面与数据 `rationale`）
- 其余 14 席 `data/seats/*.json`
- **S-C spec 与 S4 testcase** 的结论句与数字：只许给 §11.8 词面加 `十年`、给 B04 行补预期与覆盖列锚点，其它逐字不动。**例外（T2 必改）**：S-C testcase 的 `:506` 原写「不覆盖：更长的人设句（「有十年以上经验的…」）——它不含这两个词面，判据不追」，与加严后的 V9 互斥 → 同批改为「已覆盖（词面新增 `十年`）」；同节 `:70` 的词面口径「已裁定收窄为 `资深` + `20 年`」改为三词面。
- **S4 spec 正文逐字不动**（`docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md` 只被**引用**、不被修改；「维度列非空」的 spec 锚点 = 该件第 80 行的 `seatEntry` 结构行，属既有判据，不新增需求）
- `tools/docgen/card-model/**`、`tools/docgen/policy/**`、`tools/docgen/test/sc-card-shape.test.mjs:43` 的 `BASE_HEAD`（S-D 冻结值，本批不回改）
- S-D 已关闭的三处改判（`SC-TC-62` 闭区间 / `S3-TC-K07` 闭区间 / `S4-TC-H03` 增删两列）

## 5 每处改判的红绿取证要求

| 改判 | 绿档（必须实跑） | 红档（必须可重跑构造） |
|---|---|---|
| V9 词面加 `十年` | 三面计数 `资深 0 / 20 年 0 / 十年 0`，`SC-TC-29` / `31` 单跑绿 | 副本把 `rationale` 首句改回「有十年以上经验的测试开发工程师。」→ 三面 `十年` ≥ 1 → 用例必红 |
| B04 每格非空 | **T1 前 14/15**（`senior-sdet` 是唯一缺 `dimension` 键的席）→ **T1 后 15/15** → `S4-TC-B04` 绿 | 副本在 T1 后状态上删 `senior-sdet.json` 的 `dimension` 键，**并在副本内跑 `node tools/docgen/cli.mjs generate --readme --apply`** → README 该格空 → 断言红（错误信息须点名席名与列名）。**写回必须无 BOM**（用 `fs.writeFileSync(path, text, 'utf8')`）；PowerShell 5 的 `Set-Content -Encoding UTF8` 会写入 BOM → JSON 解析当场 `SyntaxError`，红档会失真成「加载失败红」而非「断言红」（2026-11-04 ③ 段审计 F-5 实测） |
| `dimension` 键值 | `sdet-data` TC-002(a) 绿（键集含 `dimension`、值 = `测试设计`） | 副本改值 → 断言红；副本删键 → 断言红 |
| Task 0 迁账 | `git hash-object` 迁移前后相等（已跑：`c9740b50…`） | 不适用（纯搬迁，无判据）；`.session/reviews/2026-11-04-s-d/` 已删（`Test-Path` → False） |

## 5.1 R8 处置摘要（进 git 的可核副本；正本 = 当次 `impact-sheet.md`，⑤ 段整目录迁入 `docs/reports/`）

| # | 改动 | R8 处置 | 回扫结论（可复算） |
|---|---|---|---|
| 1 | V9 人设词面由两词面扩为三词面（加 `十年`） | 同批改 4 处（`sc-card-shape.test.mjs:605` / `:649`、S-C spec `:108` / `:151`、其 testcase 四处）+ 新登记 `I34` + `--freeze` | 改前三面合计 2（`data` 1 + `docs/agents` 1）→ 改后 0（实跑 `Select-String -Path tools\docgen\data\seats\*.json,agents\*.md,docs\agents\*.md -Pattern '十年'` → 0）；上游 PRD 不动；历史件 `2026-10-19-…-design.md:64` / `2026-10-21-…-testcase.md:855` 历史保留 |
| 2 | `S4-TC-B04` 加「每席维度格非空」 | 同批改 `card-render.test.mjs` + S4 testcase 三处（`:279` / `:712` / `:729`） | S4 spec 正文逐字不动（锚 = `:80`）；断言红档已实跑 |
| 3 | `senior-sdet` 补 `dimension` 并翻转「不得有该键」断言 | 同批改 `sdet-data.test.mjs` 的 `KEYS` / `:17` / `:8` 注释 | `validateAgentData` 的 `BASE_KEYS` 本就含该键 → 校验器不动 |
| 4 | G1 文案：`rationale` 首句去资历表述 | 与 #1 同批（只加词面不改文案即当场红） | `agents/` 源卡无该句（`Select-String -Pattern '十年'` → 0） |

## 6 已知限制（触发 / 谁兜）

| # | 限制 | 触发 | 谁兜 |
|---|---|---|---|
| 1 | 人设词面仍是**词面枚举**（`资深` / `20 年` / `十年`），同义表述（如「十余年」「多年」）仍漏检 | 出现新的同义资历句时 | 下一批把 V9 改位置型（人设面禁「资历年限表述」）时一并处置 |
| 2 | B04 只判 `README.md` 的**维度列**非空，不判 `docs/agents/<席>.md:4` 单席头 | 单席头被写成空 `- 维度：` 而 README 有值时 | ④ 段抽核或下一批加「单席头同值」断言 |
| 3 | 本批是旁路批（**① / ② 段独立审计已确认成立 2 / 0**）：④ 段不新增用例，改判只有「既有回归 + 注入取证」 | 后续批复核本批改判时 | 复核者按 §5 逐处复算红绿两档 |
| 4 | `docs/agents/**` 重生成会刷新全部 16 份文件的 mtime，但内容差异只 2 份（`senior-sdet.md` + `README.md`） | 任何依赖 mtime 的判据 | 判「是否漏生成」用 `gate`（`baseline 38/38`），不用 mtime |
| 5 | 本批 R8 正本（`impact-sheet.md`）住 `.session/reviews/2026-11-04-s-e/`（不进 git）；迁入 `docs/reports/2026-11-04-s-e-quality-evidence/` 后**不会被 `findImpactSheet()` 自动发现**（脚本只扫 `.session/reviews/` 与 `docs/superpowers/reviews/`） | 换机 / 重新克隆；或后续批次想自动复用本批清单 | **修正（2026-11-04，⑤ 段实情）**：`impact-sheet.md` 必须**留在 `.session` 直到本批最后一次 `npm run check`**——迁走后 `findImpactSheet()` 返回 null，`scope-sweep --check` 会报「找不到当次 impact-sheet.md」并连带 4 条 sweep 类用例红（与 S-D 同）。故迁移时点 = **S-E+1 批开工时**（同 S-D 口径），迁入本批在盘目录 `docs/reports/2026-11-04-s-e-quality-evidence/`，迁移 README 写明「复算需 `--impact` 显式指定」；R8 的可核副本已在 git 内 = 本 plan §5.1 |

## 7 执行记录

| 任务 | 状态 | 证据 |
|---|---|---|
| T0 | **完成（2026-11-04）** | 迁 1 件 → `docs/reports/2026-11-04-s-d-evidence/`；`git hash-object` 前后相等 `c9740b500df9db93d5310f08794afbfbabe85045`；`.session/reviews/2026-11-04-s-d/` `Test-Path` False；`sweep ok` + `npm run check` 末行 `check 全部通过`（420 文件 / 1814 表） |
| T1 | **完成（2026-11-04）** | `senior-sdet.json` 加 `"dimension": "测试设计"`；`sdet-data.test.mjs` 的 `KEYS` 含该键、`:17` 改 `assert.equal(e.dimension, '测试设计')`；`generate --readme --apply` → `docs/agents` 只 2 份变；`gate` → `baseline 38/38`；`sdet-data.test.mjs` 单跑 `# tests 3 / # pass 3 / # fail 0`；`docs/agents/senior-sdet.md:4` = `- 维度：测试设计` |
| T2 | **完成（2026-11-04）** | `rationale` 首句 →「测试开发工程师。」；`SC-TC-29` / `SC-TC-31` 词面数组加 `十年`；S-C spec §11.4 `:108` / §11.8 `:151` 与 testcase §0.2 口径 2 / `:70` / `:475` / `:477` / `:479-482` / `:497` / `:499` / `:501` / `:503` / `:506` 同步；重生成后三面 `资深 0 / 20 年 0 / 十年 0`（实跑 `Select-String` 三面合计 0）；`sc-card-shape.test.mjs` 单跑 `# tests 60 / # pass 58 / # fail 0 / # skipped 2` |
| T3 | **完成（2026-11-04）** | `S4-TC-B04` 加「数据行 15 + 每席维度格非空」；S4 testcase 三处（表行 / 覆盖行 / 日期注与红档构造）同步；绿 = 单跑 `ok 1 - S4-TC-B04 …`；**红档实跑**（`%TEMP%` 全仓副本删 `dimension` 键 + 副本内 `generate`）→ `not ok 1 …`、错误信息 `index 席「senior-sdet」的「维度」格为空（spec :80 的 seatEntry 含 dimension）`、`# fail 1`；副本已删（`cleaned=True`） |
| T4 | **完成（2026-11-04）** | `keywords.json` 加 `I34`（words = `两个词面` / `三条并列判据` / `只判两词面`）；`--freeze` 重写 `baseline.json`（`counts.I34 = 0`）；`sweep --check` → `sweep ok`（exit 0）。**另三项下调的取证**（③ 段审计 F-4 要求）：`I27 7→6` ← `git log --oneline -1 -- tools/docgen/test/tool-tiers.test.mjs` → `9687281`；`I31 10→0` ← `git log --oneline -1 -- docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md` → `5ffe400`；`I33 1→0` ← `git log --oneline -1 -- docs/superpowers/plans/2026-11-03-s-a-data-layer.md` → `e147ecd`；三者均早于本批基线 `a495656`，本批对这三个 scope 文件零改动 |
| T5 | **完成（2026-11-04）** | 两份 `docs/after` 已闭（G1 移入 §5.1 / S4-L4 删条）；六条段门行全落（`①@S-E`–`⑤@S-E`，`⑤@S-E` 结论 = 用户原话「通过（按审计结论终签）」）；③ 段审计记录迁 `docs/reports/2026-11-04-s-e-quality-evidence/step-3-audit.md`（`git hash-object` 前后相等 `a872d6fd…`）；本批 `impact-sheet.md` 按 §6 第 5 行口径**留 `.session` 至 S-E+1 开工时迁**；收口交接词 `docs/handoffs/2026-11-04-next-batch-after-s-e.md` |
