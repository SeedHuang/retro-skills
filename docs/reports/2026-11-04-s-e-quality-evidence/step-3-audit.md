# S-E 批 ③ 技术实现段出口审计（2026-11-04）

> **判者标识** = `reviewer-audit@agents/reviewer-audit.md（角色卡贴入，独立实例）`，2026-11-04。本席未参与 S-E 范围起草 / plan 撰写 / T0–T5 施工，也未参与 S-D 任何段落申报。
> **声明**（角色卡「边界 / 禁止 2」）：本件是上级指派的**唯一**写入产物；本席**未改** `gate-record.md`、未改 plan、未改任何测试 / 数据 / spec（`③@S-E` 门行的签字原文由申报人转录，本席只核转录是否逐字一致）。写入只到临时副本内：`%TEMP%` 全仓副本内删一个数据键以复现 B04 红档，跑完即删（见 §5.3）。未执行 `git add` / `git commit` / `git checkout` / `git reset`。
> **审计对象**：S-E 批 ③ 段（T0–T5）与基线提交 `a495656` 之后的 19 件改动。基线当场确认：`git log --oneline -3` → `142c6b9`（HEAD）/ `4fa7bd7`（T1–T4 施工）/ `a495656`（基线）。
> **口径**：只认命令退出码与计数；`path:line` 一律当场 `Select-String` / js 行索引打印。**G10**：`gate-record.md`（`dev-workflow` 技能 `references/` 内唯一件）的 LF/CRLF 混用使行号可差 1——本件同时给两种数法。英文术语首现行附中文解释：`baseline`（基线计数）、`freeze`（重写基线）、`diff`（逐文件差异清单）、`sweep`（改判回扫）、`gate`（投影对账门）。

## 0 核对项速览表

| # | 核对项 | 结果 | 证据（本席自跑） |
|---|---|---|---|
| 1 | ③① 执行步骤 ↔ 产出（T0） | 成立 | `docs/reports/2026-11-04-s-d-evidence/impact-sheet.md` 与同目录 `README.md` 均在；`git hash-object docs/reports/2026-11-04-s-d-evidence/impact-sheet.md` → `c9740b500df9db93d5310f08794afbfbabe85045`（与 plan §7 T0 宣称值逐字相等）；`Test-Path .session/reviews/2026-11-04-s-d` → `False`（§1.1） |
| 2 | ③① 执行步骤 ↔ 产出（T1） | 成立 | `tools/docgen/data/seats/senior-sdet.json:4` = `"dimension": "测试设计",`；`tools/docgen/test/sdet-data.test.mjs:9` 的 `KEYS` 含 `dimension`、`:17` = `assert.equal(e.dimension, '测试设计')`；`docs/agents/senior-sdet.md:4` = `- 维度：测试设计`、`docs/agents/README.md:19` 维度格 = `测试设计`；单跑 `ℹ tests 3 / pass 3 / fail 0`（§1.2） |
| 3 | ③① 执行步骤 ↔ 产出（T2） | 成立 | `tools/docgen/data/seats/senior-sdet.json:144` 的 `rationale` 首句 = 「测试开发工程师。」；`tools/docgen/test/sc-card-shape.test.mjs:605` = `const words = ['资深', '20 年', '十年']`、`:649` 同三词面；`docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md:108` 与 `:151` 已回填三词面；单跑 `ℹ tests 60 / pass 58 / fail 0 / skipped 2`（§1.3） |
| 4 | ③① 执行步骤 ↔ 产出（T3） | 成立 | `tools/docgen/test/card-render.test.mjs:619` 块名已含「每席维度格非空」、`:632` 为新增断言；`docs/superpowers/specs/2026-10-29-agent-card-s4-render-design-testcase.md:279` / `:710` / `:730` / `:2332` 四处同步；绿档单跑 `✔ S4-TC-B04 … / tests 1 / pass 1 / fail 0`；红档实复现（§1.4、§5.3） |
| 5 | ③① 执行步骤 ↔ 产出（T4） | 成立 | `tools/scope-sweep/keywords.json:329` 起为 `I34` 条目；`tools/scope-sweep/baseline.json:36` / `:71` 含 `I34`；`scope-sweep --check` 的 `counts` 含 `"I34":0` 且末行 `sweep ok（命中未超基线、清单齐、scope 齐）`、exit 0（§1.5） |
| 6 | ③① T5 只判「进行中 + 剩余项」 | 成立 | plan §7 第 135 行 = `\| T5 \| 进行中 \| 两份 docs/after 已闭…；门行 ③@S-E 起待独立审计 \|`；`gate-record.md` 现有 S-E 行 = ① / ② / ②→③ 三条（`:118` / `:119` / `:120`，js 索引 `116` / `117` / `118`），`③@S-E` 尚未落 → 与「剩余 = 门行 ③④⑤」一致（§1.6） |
| 7 | ③② `npm run check` | 成立 | 首行 `> check` / 次行 `> node scripts/check-all.mjs`；中段 `# tests 1541 / # pass 1534 / # fail 0 / # skipped 7`；`④ markdown 检查通过（423 个文件 / 1839 张表）`；末行 `check 全部通过`；exit 0（§2.1） |
| 8 | ③② `node tools/docgen/cli.mjs gate` | 成立 | 首行 `baseline 38/38`、exit 0（§2.2） |
| 9 | ③② `node scripts/scope-sweep.mjs --check` | 成立 | 首行 `counts {"I1":13,…,"I33":0,"I34":0}`；末行 `sweep ok（命中未超基线、清单齐、scope 齐）`；exit 0（§2.3） |
| 10 | ③② `node scripts/check-observable.mjs --check` | 成立 | 末行 `check-observable ok`、exit 0（§2.4） |
| 11 | ③② `node scripts/check-gate-record.mjs` | 成立 | `rows 82 bad 0` + `gate-record ok（R1/R2/R6 全过；splitting 0）`、exit 0（§2.5） |
| 12 | ③② `npm run doc:name` | 成立 | `命名检查通过（docs）`、exit 0（§2.6） |
| 13 | ③③ plan 零新增设计决策 | 成立 | `Select-String -Path <plan> -Pattern '^## 新增设计决策'` → 0 命中（§3.1） |
| 14 | ③③ 抽 3 处改动各自指回 spec 节 / R 编号 | 成立 | 三处全部有既有载体（§3.2 表） |
| 15 | ③④ 交付物全在白名单内 | 成立 | `git diff --name-status a495656..HEAD` = **19 行**，逐行落 plan §3 第 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9 / 10 / 11 / 12 / 13 / 14 / 15 / 16 / 17 / 18 / 19 行；白名单外真实变更 **0**（§4.1） |
| 16 | ③④ 工作树 clean | 成立 | `git status --porcelain -uall` → **0 行**（§4.3） |
| 17 | 自查 1 三面人设词清零 | 成立 | `资深` / `20 年` / `十年` 三面合计命中 **0**（§5.1） |
| 18 | 自查 2 `dimension` 落地 | 成立 | 三处实测见 §5.2；15 席 `dimension` 键计数 **15 / 15 件** |
| 19 | 自查 3 B04 断言的判别力（红档复现） | 成立 | 副本内 `✖ S4-TC-B04 …`、`AssertionError … index 席「senior-sdet」的「维度」格为空（spec :80 的 seatEntry 含 dimension）`、exit 1；副本 `cleaned=True`（§5.3） |
| 20 | 自查 4 `sweep` 的 `I34` 在位 | 成立 | `counts` 含 `"I34":0`（§5.4） |
| 21 | 问题计数 | 非空 | P0 0 / P1 0 / P2 1 / P3 4（共 5 条，见 §6） |

**缺答判据**：本表 21 行逐行有结果与证据，无空行；无 `miss` 行，故无 reason 项。

## 1 判据①：每条执行步骤都有对应产出（成立）

### 1.1 T0 S-D 残余 ③ 迁账

| 核什么 | 命令 | 输出 |
|---|---|---|
| 迁账件在 git 内 | `git diff --name-status a495656..HEAD` | `A docs/reports/2026-11-04-s-d-evidence/README.md`、`A docs/reports/2026-11-04-s-d-evidence/impact-sheet.md` |
| 逐字复制 | `git hash-object docs/reports/2026-11-04-s-d-evidence/impact-sheet.md` | `c9740b500df9db93d5310f08794afbfbabe85045`（与 plan §7 T0 写的同一串） |
| 源目录已删 | `Test-Path .session/reviews/2026-11-04-s-d` | `False` |
| `⑤@S-D` 兑付登记 | js 行索引定位后打印行尾 | 含「**（2026-11-04 S-E T0 已兑付：1 件 → …`impact-sheet.md` + `README.md` 映射；`git hash-object` 迁移前后相等 `c9740b50…`；`.session/reviews/2026-11-04-s-d/` 已删）**」 |

**判定：成立**（产出与 plan §2.1 T0 的「验收」三句逐条对上）。

### 1.2 T1 `dimension='测试设计'`

| 核什么 | 命令 | 输出 |
|---|---|---|
| 数据键 | `Select-String -Path tools/docgen/data/seats/senior-sdet.json -Pattern 'dimension'` | `4: "dimension": "测试设计",` |
| 断言翻转 | `Select-String -Path tools/docgen/test/sdet-data.test.mjs -Pattern 'const KEYS\|e.dimension'` | `:9` 的 `KEYS` 含 `dimension`；`:17` = `assert.equal(e.dimension, '测试设计');` |
| 单席文档头 | `Select-String -Path docs/agents/senior-sdet.md -Pattern '维度'` | `4: - 维度：测试设计` |
| README 维度格 | `Select-String -Path docs/agents/README.md -Pattern 'senior-sdet'` | `19:` 行第 3 列 = `测试设计` |
| 投影对账 | `node tools/docgen/cli.mjs gate` | `baseline 38/38`（盘上 == 渲染器输出） |
| 单跑 | `node --test tools/docgen/test/sdet-data.test.mjs` | `ℹ tests 3 / pass 3 / fail 0` |

**判定：成立**。

### 1.3 T2 G1：文案 + V9 词面

| 核什么 | 命令 / 落点 | 输出 |
|---|---|---|
| 文案 | `tools/docgen/data/seats/senior-sdet.json:144` | `"rationale": "测试开发工程师。用例设计阶段只看 spec 与验收锚点…"`（改前首句「有十年以上经验的测试开发工程师。」已去资历表述） |
| 词面数组 | `tools/docgen/test/sc-card-shape.test.mjs:605` / `:649` | 两处均三词面 `资深` + `20 年` + `十年` |
| spec 回填 | `docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md:108`（§11.4）/ `:151`（§11.8 V9） | `:151` = 「`资深` / `20 年经验` / `20 年` / `十年` 计数 **0**，三面同判…`十年` 由 S-E 批（2026-11-04）加严（改前三面合计 2 → 改后 0）」 |
| testcase 同步 | `docs/superpowers/specs/2026-11-03-s-c-card-shape-design-testcase.md`（§0.2 口径 2 / SC-TC-29 / SC-TC-31 等） | `git diff` 显示 8 处 + 改动（含 `:506` 原「判据不追」改成词面已追） |
| 三面清零 | 见 §5.1 | 合计 0 |
| 单跑 | `node --test tools/docgen/test/sc-card-shape.test.mjs` | `ℹ tests 60 / pass 58 / fail 0 / skipped 2` |

**判定：成立**。

### 1.4 T3 B04 每格非空

| 核什么 | 落点 | 输出 |
|---|---|---|
| 断言体 | `tools/docgen/test/card-render.test.mjs:619` 与 `:632` | 块名「S4-TC-B04 index 表头五列齐 + 每席维度格非空」；`:632` = `assert.ok(parts[2], …席「${parts[0]}」的「维度」格为空（spec :80 的 seatEntry 含 dimension）…)` |
| testcase 四处 | `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design-testcase.md:279` / `:710` / `:730` / `:2332` | 表行覆盖列补锚 `:80`；用例块补预期、日期注与红档构造；覆盖总表同步 |
| 绿档 | `node --test --test-name-pattern "S4-TC-B04" tools/docgen/test/card-render.test.mjs` | `✔ S4-TC-B04 … / tests 1 / pass 1 / fail 0`、exit 0 |
| 红档 | §5.3 | `✖` + 点名席名与列名 |

**判定：成立**。

### 1.5 T4 R8 登记与门禁

| 核什么 | 命令 | 输出 |
|---|---|---|
| `I34` 登记 | `Select-String -Path tools/scope-sweep/keywords.json -Pattern '"I34"'` | `329:` 起新条目（words = `两个词面` / `三条并列判据` / `只判两词面`；scope 4 文件） |
| `freeze` 落盘 | `Select-String -Path tools/scope-sweep/baseline.json -Pattern '"I34"'` | `36:`（`counts` 内 `"I34": 0`）、`71:`（`entries` 内） |
| 门禁 | `node scripts/scope-sweep.mjs --check` | `sweep ok…`、exit 0 |

**同批下调的三个无关基线（核查，非问题）**：`baseline.json` 的 `diff` 显示 `I27 7→6`、`I31 10→0`、`I33 1→0`。本席独立取证：三者 scope 文件的最后一次改动分别是 `git log --oneline -1 -- docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md` → `5ffe400`（S-C ③ 段）、`-- tools/docgen/test/tool-tiers.test.mjs` → `9687281`（S-C Task 3）、`-- docs/prd/20261102212627-card-data-contract-and-proof/index.md` → `0a7cd63`，**均早于本批**，本批 19 件 `diff` 里不含它们 → plan §7 T4 写的「系实况下降」属实，`--freeze` 只是把积压的下降补登（方向 = 收紧，不弱化门禁）。可核性上仍建议补一句取证命令（见 §6 F-4）。

**判定：成立**。

### 1.6 T5 收口（只判「进行中 + 剩余项」）

- plan §7 第 135 行明标 `T5 | 进行中`，余项写「门行 `③@S-E` 起待独立审计」。
- 实测 `gate-record.md` 的 S-E 段现有行 = ① / ② / ②→③ 三条；`③@S-E` / `④@S-E` / `⑤@S-E` 未落 → 与「剩余 = 门行 ③④⑤」一致。
- 两份 `docs/after` 已改（`docs/after/20261031165047-agent-card-s4-open-items.md` 删 S4-L4 条、`docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` 的 G1 行移入 §5.1）→ T5 的两项已完成产出在位。
- **核过但记入 §6 F-3**：§7 的「进行中」没有点明 plan §3 第 20 行（4 件质量证据账）与第 21 行（交接件）同样未产出（19 / 21 行已实现）。

**判定：成立**（判据只要求「进行中 + 剩余项 = 门行 ③④⑤」，此项满足）。

## 2 判据②：全仓检查绿（成立）

| # | 命令 | 首行 / 关键行（原样） | 末行 / 退出码 |
|---|---|---|---|
| 2.1 | `npm run check` | `> check`、`> node scripts/check-all.mjs` | 中段 `# tests 1541 / # pass 1534 / # fail 0 / # skipped 7`；`④ markdown 检查通过（423 个文件 / 1839 张表）`；`⑥ 观察产物门禁：扫描 3 个子目录 / 归档 2 对 / 过程 0 对 / findings 0`；`[observable] 扫描 107 个 .md / 未豁免命中 0 行 / 已豁免 6 行 / stale 0 条`；末行 `check 全部通过`；**exit 0** |
| 2.2 | `node tools/docgen/cli.mjs gate` | `baseline 38/38` | exit 0 |
| 2.3 | `node scripts/scope-sweep.mjs --check` | `counts {"I1":13,…,"I32":1,"I33":0,"I34":0}` | `sweep ok（命中未超基线、清单齐、scope 齐）`；exit 0 |
| 2.4 | `node scripts/check-observable.mjs --check` | （无输出行，静默通过） | `check-observable ok`；exit 0 |
| 2.5 | `node scripts/check-gate-record.mjs` | `rows 82 bad 0` | `gate-record ok（R1/R2/R6 全过；splitting 0）`；exit 0 |
| 2.6 | `npm run doc:name` | `> node scripts/doc-name.mjs --check docs` | `命名检查通过（docs）`；exit 0 |

**判定：成立**（六条全绿、六条都一样 `# fail 0` / exit 0）。六条的首行原样一并留档，便于 ④ 段复算比对。

## 3 判据③：每份改动可指回 spec 一节或一个 R 编号 + plan 零新增设计决策（成立）

### 3.1 plan 零新增设计决策

```
Select-String -Path docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md -Pattern '^## 新增设计决策'
```
输出为空，命中 **0**。

### 3.2 抽 3 处改动 → 载体

| # | 改动 | 指回的 spec 节 / 判据锚 | 判定 |
|---|---|---|---|
| 1 | `tools/docgen/data/seats/senior-sdet.json:4` 的 `dimension` | `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md:80`——`seatEntry = { name, role, dimension, outputKind, tools, card }`（`dimension` 是结构必含字段；值 `测试设计` 与 `docs/agents/senior-sdet.md:4` 的岗位面一致） | 成立 |
| 2 | `tools/docgen/data/seats/senior-sdet.json:144` 的 `rationale` | `docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md:108`（§11.4「`rationale` 同批删人设句」+ 人设词面段） | 成立 |
| 3 | `tools/docgen/test/sc-card-shape.test.mjs:605` / `:649` 的词面数组 | `docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md:151`（§11.8 V9 行：四词面计数 0）+ `:108`（加严出处） | 成立 |
| 4 | `tools/docgen/test/card-render.test.mjs:632` 的 B04 断言 | `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md:80`（结构锚）+ `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design-testcase.md:279` / `:710`（用例行） | 成立（题面要求的 3 处中的第 3 处，另多核 1 处） |
| 5 | `tools/scope-sweep/keywords.json:329` 的 `I34` | 规则 R8（改判回扫登记表）——`docs/prd/20261024073606-dev-workflow-mainline/index.md` 的 R8 行与 plan §2.1 T4 | 成立 |

其余 14 件（`docs/agents/**` 2 件属重生成派生、S4 / S-C testcase 2 件、`baseline.json`、`gate-record.md`、两份 `docs/after`、plan 本体、4 件审计记录）逐件都能指回：`docs/agents/**` → S4 spec §3（`:54` 五列）投影面；`gate-record.md` → R1 / R2；两份 `docs/after` → S4 spec `:80`（S4-L4 闭合依据）与 `:108`（G1 闭合依据）；审计记录与 plan → 本段自身流程（R1–R8）。

**判定：成立**（无一处需要回流 spec 重审）。

## 4 判据④：交付物只落在 plan §3 白名单内（成立）

### 4.1 全量 `diff`（19 行）↔ §3 白名单 21 行，逐行比（非抽样）

```
git diff --name-status a495656..HEAD   → 19 行
```

| # | 变更件（形态实测） | 对应 plan §3 行 | 判定 |
|---|---|---|---|
| 1 | `M docs/after/20261031165047-agent-card-s4-open-items.md` | 第 14 行（M） | 白名单内 |
| 2 | `M docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` | 第 13 行（M） | 白名单内 |
| 3 | `M docs/agents/README.md` | 第 9 行（M） | 白名单内 |
| 4 | `M docs/agents/senior-sdet.md` | 第 8 行（M） | 白名单内 |
| 5 | `A docs/reports/2026-11-04-s-d-evidence/README.md` | 第 15 行（A） | 白名单内 |
| 6 | `A docs/reports/2026-11-04-s-d-evidence/impact-sheet.md` | 第 16 行（A） | 白名单内 |
| 7 | `A docs/reports/2026-11-04-s-e-bypass-audit.md` | 第 18 行（A） | 白名单内 |
| 8 | `A docs/reports/2026-11-04-s-e-plan-gate.md` | 第 19 行（A） | 白名单内 |
| 9 | `A docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md` | 第 17 行（A） | 白名单内 |
| 10 | `M docs/superpowers/specs/2026-10-29-agent-card-s4-render-design-testcase.md` | 第 7 行（M） | 白名单内 |
| 11 | `M docs/superpowers/specs/2026-11-03-s-c-card-shape-design-testcase.md` | 第 6 行（M） | 白名单内 |
| 12 | `M docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md` | 第 5 行（M） | 白名单内 |
| 13 | `M gate-record.md`（`dev-workflow` 技能 `references/` 内） | 第 12 行（M） | 白名单内 |
| 14 | `M tools/docgen/data/seats/senior-sdet.json` | 第 1 行（M） | 白名单内 |
| 15 | `M tools/docgen/test/card-render.test.mjs` | 第 4 行（M） | 白名单内 |
| 16 | `M tools/docgen/test/sc-card-shape.test.mjs` | 第 3 行（M） | 白名单内 |
| 17 | `M tools/docgen/test/sdet-data.test.mjs` | 第 2 行（M） | 白名单内 |
| 18 | `M tools/scope-sweep/baseline.json` | 第 11 行（M） | 白名单内 |
| 19 | `M tools/scope-sweep/keywords.json` | 第 10 行（M） | 白名单内 |

- **白名单外真实变更 = 0**（19 行 100% 命中 §3 行号）。
- 形态与 §3 声明逐件相符：§3 这 19 行声明 M 14 / A 5；实测 M **14**（上表第 1 / 2 / 3 / 4 / 10 / 11 / 12 / 13 / 14 / 15 / 16 / 17 / 18 / 19 行）、A **5**（上表第 5 / 6 / 7 / 8 / 9 行），无「声明 M 实为 A」的不一致。
- §3 尚未兑现的 2 行 = 第 20 行（`docs/reports/2026-11-04-s-e-quality-evidence/` 4 件，属 ④ / ⑤ 段）与第 21 行（`docs/handoffs/2026-11-04-next-batch-after-s-e.md`，属 T5 收口）——与 plan §7 T5「进行中」一致，不是漏项（同 §6 F-3 的可核性建议）。
- **协作边界（审计须写明）**：本判只成立到「此刻已发生的变更 + §3 声明的白名单」。④ / ⑤ 段落件后，若出现第 20 / 21 行以外的文件，须按 `docs/prd/20261024073606-dev-workflow-mainline/index.md:328` 第②条在 `④@S-E` 前重核一遍。

### 4.2 `.session` 过程账不计入变更清单

`git check-ignore -v .session/reviews/2026-11-04-s-e/impact-sheet.md` → `.gitignore` 的 `.session/` 规则；与 plan §3 末行（第 97 行）「`.session/**` 不在白名单」一致。

### 4.3 工作树 clean

`git status --porcelain -uall | Measure-Object -Line` → **0 行**。

**判定：成立**。

## 5 四道自查（本批性质决定）

### 5.1 三面人设词清零

```
Select-String -Path tools/docgen/data/seats/*.json,agents/*.md,docs/agents/*.md -Pattern '资深|20 年|十年' -AllMatches | Measure-Object → 0
```
命中 **0**（三面 = `data/seats/**` / `agents/*.md` / `docs/agents/*.md` 全宽）。旁证：`docs/agents/senior-sdet.md` 里已无 `十年`（全仓三面唯一改前命中 = 该件 `:9` 与 `tools/docgen/data/seats/senior-sdet.json:144`，两处均已清）。

### 5.2 `dimension` 落地

| 口径 | 实测 |
|---|---|
| `docs/agents/senior-sdet.md:4` | `- 维度：测试设计` |
| `docs/agents/README.md:19` 维度格 | `测试设计` |
| 15 席 `dimension` 非空计数 | `tools/docgen/data/seats/*.json` 含 `"dimension"` 的件数 = **15**（文件总数 15） |

### 5.3 B04 断言的判别力（红档实复现）

构造：`%TEMP%` 全仓副本 → 用 node 删 `tools/docgen/data/seats/senior-sdet.json` 的 `dimension` 键（`stripped= true`）→ 副本内 `node tools/docgen/cli.mjs generate --readme --apply`（`GEN_EXIT=0`、`docs/agents 已写入（16 份…）`）→ 副本内单跑。

```
✖ S4-TC-B04 index 表头五列齐 + 每席维度格非空 (1.2988ms)
AssertionError [ERR_ASSERTION]: index 席「senior-sdet」的「维度」格为空（spec :80 的 seatEntry 含 dimension）
TEST_EXIT=1
```

- 错误信息**点名席名（senior-sdet）与列名（维度）**，且引用了 spec `:80` 的锚 → 与 plan §5 的红档要求逐条相符。
- 副本已删：`cleaned=True`（`Test-Path` → `False`）。
- **一处构造细节（供 ④ 段复算）**：用 PowerShell 5 的 `Set-Content` 改该 JSON 会写入 UTF-8 BOM，随即 `SyntaxError: Unexpected token '﻿'` 把「断言红」伪装成「加载失败红」（本席首次构造即如此，`GEN_EXIT=1`）。必须用 node 的 `fs.writeFileSync(path, text, 'utf8')`（无 BOM）改写；plan §5 与 S4 testcase 的红档构造没写这一步。已记为 §6 F-5。

### 5.4 `sweep` 的 `I34` 在位

`node scripts/scope-sweep.mjs --check` 的 `counts` 内含 `"I34":0`（末两个键 `"I33":0,"I34":0`）。

## 6 问题表

共 **5 条**：P0 0 / P1 0 / P2 1 / P3 4。每条带证据与建议解法（角色卡「禁止 1」：不得只提问题不给解法）。

| # | 级别 | 问题 | 证据 | 建议解法 |
|---|---|---|---|---|
| F-1 | P2 | **R8 的处置证明只在 `.session/`（不进 git、不在本批 `diff` 内）**：R8 要求「必须在本批 `diff` 内给出该口径在上游签字件与同族文档中的全部命中的处置」。本批 V9 词面加严触到两处**既有** `十年` 命中，处置（「历史保留不改」+ 理由）只写在本批 `impact-sheet.md` §2 第 1 行；该件在 `.session/reviews/2026-11-04-s-e/`，`git check-ignore` 命中 `.session/` → ③ 出口时刻**不满足「在 `diff` 内」** | `.session/reviews/2026-11-04-s-e/impact-sheet.md:64`（登记两处 + 「历史保留不改」理由）；两处实体仍在：`docs/superpowers/specs/2026-10-19-docgen-agent-senior-sdet-design.md:64`、`docs/superpowers/specs/2026-10-21-docgen-replace-intent-change-design-testcase.md:1047`；`tools/scope-sweep/keywords.json:329` 的 `I34.scope` 4 文件**不含**这两件 → 机械面无覆盖 | ⑤ 段收口时把 `impact-sheet.md` 迁进 `docs/superpowers/reviews/2026-11-04-s-e/`（`findImpactSheet` 认该根，进 git 即在 `diff` 内），并在 `⑤@S-E` 的「核了什么」写明「两处历史件的处置见该件 §2 #1」；不要只迁到 `docs/reports/…-evidence/`（脚本不扫该根，见 F-2） |
| F-2 | P3 | **改判证据的收口落点与回扫脚本的搜索根不一致（计划门 P3-B 仍 OPEN）**：`impact-sheet.md` 第 5 行写「收口时整单迁 `docs/reports/2026-11-04-s-e-evidence/`」，而 `findImpactSheet` 只扫 `.session/reviews/` 与 `docs/superpowers/reviews/` → 迁后对 `sweep --check` 不可见，复核退化为人工读；plan §3 末行（第 97 行）只说明「不落 `docs/`」，未写收口去向 | `.session/reviews/2026-11-04-s-e/impact-sheet.md:5`；`docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md:97`；`scripts/scope-sweep.mjs` 的 `findImpactSheet` 两根（计划门 §7.1 已复算） | plan §3 末行补一句「收口去向 = `docs/superpowers/reviews/2026-11-04-s-e/`（脚本搜索根内）」，或保留 `docs/reports/` 但在 `⑤@S-E` 行明写「不在脚本搜索根内，靠人工读该件」。二选一，落 plan 后再收口 |
| F-3 | P3 | **plan §7 的「T5 进行中」未点明剩余项全貌**：§3 21 行里第 20 行（`docs/reports/2026-11-04-s-e-quality-evidence/` 4 件）与第 21 行（`docs/handoffs/2026-11-04-next-batch-after-s-e.md`）同样未产出，§7 只写「门行 `③@S-E` 起待独立审计」 | `docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md:135`（T5 行）与 `:94-95`（§3 第 20 / 21 行）；`git diff --name-status a495656..HEAD` 19 行里无这两项 | T5 行余项改为「门行 `③④⑤` + §3 第 20 / 21 行两件（质量证据账 4 件 / 交接件）」，让 ④ / ⑤ 段照单收口、不靠记忆补 |
| F-4 | P3 | **`--freeze` 同批下调 3 个无关基线，plan §7 未留取证命令**：`I27 7→6`、`I31 10→0`、`I33 1→0` 只写「系实况下降」，无「这三处 scope 文件本批零改动」的证据。本席已独立复算属实（最后一次改动早于本批），但这句断言本身在 ③ 出口时刻**不可复算** | `tools/scope-sweep/baseline.json` 的 `diff`（`I27` / `I31` / `I33` 三行）；plan §7 第 134 行原文「另 `I27 7→6` / `I31 10→0` / `I33 1→0` 系实况下降」；本席取证：`git log --oneline -1 -- docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md` → `5ffe400`、`-- tools/docgen/test/tool-tiers.test.mjs` → `9687281` | plan §7 T4 行补三行取证（每个下调项一条 `git log --oneline -1 -- <scope 文件>`），落进 `④@S-E` 前的复核证据位；不改数字，只补「为什么降」的可复算依据 |
| F-5 | P3 | **B04 红档构造缺「无 BOM 写回」一步**：plan §5 与 S4 testcase 的红档写法只写「删 `dimension` 键」，实际用 PowerShell 5 `Set-Content` 写回会带 UTF-8 BOM → 数据解析当场 `SyntaxError`，红档变成「加载失败红」而非「断言红」，判别力被旁路 | 本席首次构造 `GEN_EXIT=1` + `SyntaxError: Unexpected token '﻿'`；改 node `fs.writeFileSync(…, 'utf8')` 后才得到 `AssertionError … 席「senior-sdet」的「维度」格为空`；落点：`docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md:113` 与 `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design-testcase.md:730` 的红档注 | 两处红档写法各补半句「键删改必须用无 BOM 写回（`fs.writeFileSync(path, text, 'utf8')`）；用 `Set-Content` 会引入 BOM 使红档失真」；④ 段按此复算即可拿到「断言红」而非「解析红」 |

**核过但不列为问题（留痕备查）**：

1. **T0 改了一条已终签的 `⑤@S-D` 行**（只改路径串 + 加兑付句）：plan §2.1 T0、计划门 §5 R7 已把它登记为 ⑤ 段事项，本段不作判。
2. **`baseline` 的三个下调值方向是收紧**：`hits > baseline` 才红，基线降到实况值不会放行新的超限 → 不构成「门禁被削弱」，只留可核性建议（F-4）。
3. **`docs/after/20261031165047-agent-card-s4-open-items.md:3` 前向引用 `gate-record.md` 的 `③@S-E` 行**（该行此刻未落）：属 T5 的同批落行，本段判 ③ 时只核「引用目标将在同批出现」，故不单列问题；若 `③@S-E` 最终判不成立，该引用会变成假锚——请申报人在落行时同步复核。
4. **`docs/agents/**` 重生成刷新了 16 份 mtime、内容只 2 份变**：`gate` → `baseline 38/38` 证明盘上 == 渲染器输出，不属漏生成。
5. **六条命令全绿**（§2）：无「skip 掩盖红」（`npm run check` 的 `# skipped 7` 是既有一次性档名单，`bad 0` 已由 `SC` 档守卫覆盖）。

**无问题时显式声明**：`findings` 集合**非空**（5 条），故正文与 §6 附录均**不适用**「全过、无问题」；本件 §0 的 21 项核对全部「成立」，问题只出在可核性层面（1 条 P2 + 4 条 P3），无一条推翻四条判据。

## 7 结论

**四条判据：成立 4 / 不成立 0。** 问题计数 **P0 0 / P1 0 / P2 1 / P3 4（共 5 条）**，无一条驳回本段出口。

**依据（≥2 条，均带 `path:line`，取自 4 个不同文件）**

1. `docs/prd/20261024073606-dev-workflow-mainline/index.md` 的 R8 行——改判回扫「只认命令退出码」，本席据此把 F-1 / F-2 判为「机械面 / 可核性缺口」而非口径错误。
2. `docs/superpowers/plans/2026-11-04-s-e-dimension-and-persona-wordface.md:73-95`——§3 白名单 21 行，19 件变更逐行比对（§4.1）。
3. `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md:80`——`seatEntry = { name, role, dimension, outputKind, tools, card }`，是 `dimension` 与 B04 断言的共同 spec 锚。
4. `docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md:151`——§11.8 V9 四词面计数 0，是词面加严的判据出处。
5. `.session/reviews/2026-11-04-s-e/impact-sheet.md:64`——两处历史件的处置登记，是 F-1 的取数来源（该件不进 git 即问题本体）。

**建议落进 `③@S-E` 门行「核了什么」的一行证据句（可直接转录；本席不代填签字）**

`独立审计实例本人自跑（cwd = 仓根，2026-11-04）——① 步骤↔产出 = T0 迁账件 git hash-object c9740b500df9db93d5310f08794afbfbabe85045 与 plan §7 逐字相等、.session/reviews/2026-11-04-s-d 已删（Test-Path False）；T1 senior-sdet.json:4 = dimension 测试设计 + docs/agents/senior-sdet.md:4 = - 维度：测试设计 + README:19 维度格 = 测试设计；T2 rationale 首句 = 测试开发工程师。/ sc-card-shape.test.mjs:605 + :649 三词面 / spec :108 + :151 已回填；T3 card-render.test.mjs:632 断言 + S4 testcase :279 / :710 / :730 同步；T4 keywords.json:329 的 I34 + baseline.json:36 的 I34:0；T5 进行中（余 = 门行 ③④⑤）；② 全仓绿 = npm run check → # tests 1541 / # fail 0 / 末行 check 全部通过（exit 0）；node tools/docgen/cli.mjs gate → baseline 38/38（exit 0）；node scripts/scope-sweep.mjs --check → sweep ok（counts 含 I34:0，exit 0）；node scripts/check-observable.mjs --check → check-observable ok（exit 0）；node scripts/check-gate-record.mjs → rows 82 bad 0（exit 0）；npm run doc:name → 命名检查通过（exit 0）；③ 零新增设计决策 = plan 内 ^## 新增设计决策 0 命中，抽 4 处改动全部指回 S4 spec :80 / S-C spec :108 + :151 / 规则 R8；④ 白名单 = git diff --name-status a495656..HEAD 19 行逐行落 plan §3 第 1-19 行、白名单外真实变更 0，git status --porcelain -uall 0 行；四道自查 = 三面人设词 资深/20 年/十年 合计 0、dimension 15/15 件、B04 红档副本内复现（AssertionError 点名席名 senior-sdet 与列名 维度、exit 1、副本已删 cleaned=True）、counts I34:0；四条核对成立 4 / 不成立 0；问题 P0 0 / P1 0 / P2 1 / P3 4（P2 = R8 处置只在不进 git 的 .session 过程账内、未落在本批 diff；P3 四条 = 收口落点不在 sweep 搜索根 / §7 余项未列 §3 行 20-21 / --freeze 下调 3 项缺取证命令 / B04 红档缺无 BOM 写回一步）；审计记录 .session/reviews/2026-11-04-s-e/step-3-audit.md`

**本段「过」的边界**：＝「③ 段可按 T5 收口」。不等于 ④ / ⑤ 段已完成，也不为 §3 第 20 / 21 行以后的产物背书；④ 段开工后若出现白名单外文件（含 `.session` 外的任何新增件），`④@S-E` 须按 `docs/prd/20261024073606-dev-workflow-mainline/index.md:328` 第②条重核一遍。F-1 / F-2 须在 `⑤@S-E` 前闭合（R8 的「在 `diff` 内」与「脚本能看见」两处），否则 R8 的机械面在 S-E 批上不成立。
