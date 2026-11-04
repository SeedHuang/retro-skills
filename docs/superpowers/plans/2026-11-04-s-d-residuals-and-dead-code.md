# S-D 计划：S-C 残账收口 + 死代码清理（旁路批）

> 状态：**执行中（2026-11-04 起草，逐任务勾选）**
> 路线：**PRD §4.2 旁路**（无 PRD 增量、无 spec / testcase 增量；① ② 行签字人 = 审计）
> 起点 HEAD：`36d8e01`（工作树另带 2 件已暂存未提交，见 T0）
> `$BASE`（本批开工提交）= `36d8e01`；`$BASE_HEAD`（T1 冻结的闭区间上界）= T0 的提交哈希

## 0 全貌确认（事前三步，动笔前必经）

**本质**：本批不是新功能，而是两类**已签定执行项**的兑付：`⑤@S-C` 结论列残余 4 条（触发 = 「下一批开工」，谁兜 = 「下一批施工者」）+ `dev-workflow-mainline` PRD 线 G 的既定删除触发（两文件头部已写「删除触发 = 下一次清理死代码」）。因此出口判据不是「功能做对了没有」，而是「**已签的收口条件是否逐条兑付、且没有引入新债**」。

**同族**：本仓已有四类同族动作，本批必须对齐它们而不是重造 —— ① 证据账迁 `docs/reports/<主题>-evidence/`（先例 `c015673` V-11 证据迁移；S-B 的 P2-2 同款口径）；② 死代码删除前清行号引用（先例 `STRUCT_REPLACED`，2026-11-03 为 `agentData.mjs` 降级所建）；③ 一次性档改用例形态（先例 `SB-TC-06/25/32` 三条 `t.skip` + `SKIP_ALLOWLIST`）；④ 旁路批（`PRD §4.2`，本仓**从未用过**，本批是首例）。

**边界**：
- 不碰 S-A 数据层、S-B 契约层、S-C 卡面形状的任何实现（动它即返工）。
- 不改两份 PRD 的 §10 功能点集合（R5 的触发线）。
- 不改已签 S-C 的 spec / testcase / plan 正文（含 `:169` 的 `.session/…` 缩写指针 —— 改正文会让 `⑤@S-C` 记的 D1 hash `9B470C82…E7BA0` 当场失效，那是 ⑤ 证据不是指针）。
- 不改 `gate-record.md` 已签行的**结论与判断**，只改其中的路径字符串（`docs-convention` 硬约束 4 的整批迁移例外）。

**验收**（本批六条出口，全部可机械判）：
1. `npm run check` → `# fail 0` + 末行 `check 全部通过` + `# skipped 7`（G6 改 `t.skip` 后由 5 升 7）。
2. `node scripts/check-gate-record.mjs` → `rows N bad 0` + 末行 `gate-record ok`。
3. `node scripts/scope-sweep.mjs --check` → exit 0（`sweep ok`）。
4. `node scripts/check-observable.mjs --check` → 末行 `check-observable ok`、`stale 0`。
5. `docs/after/20261104101304-…md` §5 主表 10 行 → **9 行**（G6 移入 §5.1 已闭合）；§5.1 2 行 → **4 行**（+G6、+卡点）。
6. `renderAgent.mjs` / `sharedBlocks.mjs` 不存在于工作树；行号守卫 `missing 0` + `structSkipped` 由 37 升。

**影响面**（本批会动到的仓内面，共 13 处，见 §3 白名单）+ 两个**跨批**面：`SC-TC-62` 的窗口语义（影响所有后续批次的回退面判据）、`SKIP_ALLOWLIST`（影响 ② 段 skip 守卫）。

**联动四问**：
- **治本了吗**：本批最大的项是 `SC-TC-62` 的卡点。不治，下一批任一新增文件都会让 `# fail` 变 1（已实测两次）→ 只能靠「每批往 `NEW_PATHS` 补名单」续命，名单已攒 9 项且会无限长。治本 = 把判据从「开区间到工作树末尾」改成「闭区间 `$BASE..$BASE_HEAD`」，让 S-C 那批的回退面成为**永久可核的历史记录**，与后续批次解耦。**这正是用户 2026-11-04 选定的 B 方案。**
- **有副作用吗**：① 闭区间会让 `SC-TC-62` 不再约束本批自身的回退面 —— 本批的回退面改由本 plan 白名单 + ④ 段取证兜（每次改动仍受 `npm run check` 与 `git status` 约束）。② `t.skip` 会进 `SKIP_ALLOWLIST`，而 S3 spec §11.2 末段那句「现 2 条」**本来就与实况脱节**（实际 5 条），本批顺手改成实况值，不改判据语义。③ 迁 11 件进 `docs/reports/` 会让**行号守卫**首次扫到它们 —— 实测有 **12 处裸 `test.mjs:<N>`**，必须同批补全路径（`test.mjs:<N>` 指向不存在的文件，守卫判 `missing`）。
- **跨问题联动吗**：`SC-TC-62` 卡点、G6 空跑、G9（白名单比签字件宽）**同根**：三者都源自「一次性档的判据挂在 `$BASE` 的即时 diff 形态上」。本批只解前两者（用户授权的范围）；G9 仍按原文等 spec §11.14/§11.15 修订时回填。
- **跨项目吗**：不跨。全部改动只对本仓 `npm run check` 与后续批次生效；`rules/` / `skills/` 只在 `gate-record.md`（门行）与 `lessons.test.mjs`（豁免表）动，均属判据级改动 → 按 R8 同批回扫。

## 1 为什么走旁路（不立 PRD / 不写 spec）

`PRD §4.2 :317-320` 的两条，逐条取证：

| 判据 | 本批实况 | 结论 |
|---|---|---|
| **功能点集合不变**（§10 `F-xx` 集合 diff 为空） | 不触碰 `docs/prd/20261024073606-dev-workflow-mainline/index.md` 与 `docs/prd/20261102212627-card-data-contract-and-proof/index.md` 的 §10 表体 | **成立** |
| **不新增交付物**（不新增 spec / testcase / 载体文件） | 11 件证据账是「同内容换路径」搬迁（`git hash-object` 前后相等可核）；其余全是改 / 删既有文件；**无 spec、无 testcase、无脚本、无规则、无角色卡新增** | **成立** |

**已知代价（写清不藏）**：旁路的 ④ 判据是「既有回归 testcase 全过（不新增用例）」，于是三处判据级改动（`SC-TC-62` 窗口、G6 skip 语义、`STRUCT_REPLACED` 增员）只有「既有用例仍绿 + 注入式红绿取证」做证据，没有专用新用例。补偿 = §5 要求每处改判都在执行记录里写**注入前后两个实跑值**（红得出来、绿得回去），由 ④ / ⑤ 两席独立复核。

**首例风险声明**：旁路在本仓从未使用过（`gate-record.md` 全文只有规则条文、无实跑行）。因此 §5 把 ① / ② 两行当作首次演练，其证据栏按 §4.2 `:333` 的硬要求写两样：`F` 集合差集结论 + 变更清单。

## 2 任务表

| # | 任务 | 改动文件 | 依赖 |
|---|---|---|---|
| T0 | 落 ⑤ 收口 2 件（已暂存未提交） | `docs/handoffs/2026-11-04-next-batch-kickoff.md`、`tools/docgen/test/sc-card-shape.test.mjs` | — |
| T1 | 解卡点：`SC-TC-62` 改闭区间 + 冻结 `$BASE_HEAD` | `tools/docgen/test/sc-card-shape.test.mjs` | T0（需其提交哈希） |
| T2 | G6：`SC-TC-45` / `SC-TC-46` 改 `t.skip()` | `tools/docgen/test/sc-card-shape.test.mjs`、`scripts/test-skip-allowlist.mjs`、`docs/superpowers/specs/2026-10-27-s3-gate-wiring-design.md` | T1（同文件，顺序写） |
| T3 | 迁 11 件证据账 + 补 12 处裸指针 + 更新活指针 | 新建 `docs/reports/2026-11-04-s-c-card-shape-evidence/`（11 件 + `README.md`）；改 `skills/dev-workflow/references/gate-record.md`、`docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` | **T1 必须先完成**（否则 A 面超白名单，`# fail` 变 1） |
| T4 | 删死代码 2 件 + 行号豁免登记 + 闭合线 G | 删 `tools/docgen/components/renderAgent.mjs`、`tools/docgen/components/sharedBlocks.mjs`；改 `skills/managing-lessons-store/scripts/lessons.test.mjs`、`docs/after/20261024174253-dev-workflow-mainline-open-items.md` | — |
| T5 | 收口：四道门 + 六行门行 | `skills/dev-workflow/references/gate-record.md` | T1–T4 |

### T0 落 ⑤ 收口 2 件

- **Consumes:** 无（本批起点）
- **现状**：HEAD `36d8e01`，工作树有 2 件**已暂存未提交**：`A docs/handoffs/2026-11-04-next-batch-kickoff.md` + `M tools/docgen/test/sc-card-shape.test.mjs`（后者把该交接词补进 `NEW_PATHS`，注释在 `:976-977`）。交接词「工作树 clean」的记录与实况不符，本任务把它落库。
- **步骤**：① `git status --porcelain` 确认恰这 2 行；② `git commit`（消息：`docs(s-c): ⑤ 收尾交接词进库 + SC-TC-62 白名单登记`）；③ `git rev-parse HEAD` 记为新哈希。
- **Expected**：`git status --porcelain` **0 行**；`npm run check` → `# tests 1541 / # pass 1536 / # fail 0 / # skipped 5` + 末行 `check 全部通过`。
- **为什么必须先做**：T1 冻结的 `$BASE_HEAD` 必须指向「S-C 那批真正收口」的提交；若把 ⑤ 交接词排除在窗口外，它就必须从 `NEW_PATHS` 删掉（白名单少一项），反而丢掉现有注释里的裁定依据。

### T1 解卡点：`SC-TC-62` 改闭区间

- **Consumes:** Task 0
- **病根**：`BASE` 默认值硬编码 `eef963e`（`:38`），判据是 `git diff --name-status $BASE`（`:1015`）—— **开区间到工作树末尾**。任何本批之后的新文件都落 A 面 → `aOutside` 非空 → 红。这是时限炸弹，不是一次性偏差。
- **改法**（最小面）：`:38` 旁新增一条常量，`:1015` 把 diff 改成闭区间：
  ```js
  const BASE_HEAD = (process.env.SB_BASE_HEAD || '').trim() || '<T0 提交哈希>'
  // SC-TC-62 内：
  'git', ['-c','core.quotePath=false','diff','--name-status', BASE, BASE_HEAD]
  ```
- **Expected（绿）**：`node --test --test-name-pattern=SC-TC-62 --test-reporter=tap tools/docgen/test/sc-card-shape.test.mjs` → `# fail 0`；console 行 `name-status: rows N / A … / A-outside 0 / nonA-outside 0`。
- **Expected（红，两档，必须各真实跑一次）**：
  1. **新文件不再触发**（证明炸弹已拆）：在 `docs/reports/` 下新建一个探针文件 → 复跑 SC-TC-62 **仍绿** → 删探针。
  2. **白名单外仍红**（证明判据没被架空）：把 `NEW_PATHS` 里 `docs/handoffs/2026-11-04-s-c-card-shape-impl.md` 临时删掉 → 复跑必红（`A 面出现白名单外路径`）→ 恢复。
- **R8**：属**判据级**改动 → 收尾 touch 当次 `impact-sheet.md` + 跑 `node scripts/scope-sweep.mjs --check` exit 0。

### T2 G6：`SC-TC-45` / `SC-TC-46` 改 `t.skip()`

- **Consumes:** Task 1
- **病根**：`:681` / `:699` 是 `if (!SHAPE) return` —— 默认档一条断言不跑却计 pass，`# skipped 0` 掩盖（G6，P2）。
- **改法**：两条用例签名加 `(t)`，非 SHAPE 分支改为 `return t.skip('一次性档未开（SB_SHAPE_ONESHOT≠1）')`；用例名保持原文（白名单按名核）。`SC-TC-13`（`:276-278`）**不动** —— 它在分支前有 `assert.equal(segs, 7 * N)` 真断言，不属空跑，G6 原文也只点了 45 / 46。
- **连带两处**（缺一即红）：
  - `scripts/test-skip-allowlist.mjs` 增 2 条（原文用例名逐字）：
    `'SC-TC-45 行口径 vs 次数口径（17 行 / 18 处）——整条归一次性档'`、
    `'SC-TC-46 渲染面「主持人」总数 = 30（等价性证明）——整条归一次性档'`
  - `docs/superpowers/specs/2026-10-27-s3-gate-wiring-design.md` 的计数口径**有两处**，必须同批改（只改一处会留下第二份旧值，属 R8 的「计数口径」漂移）：`:51`（§11.1 的 R9 行）与 `:132`（§11.2 末段）。两处「现 2 条」→ 改后实况值（`SKIP_ALLOWLIST` 实测现 5 条、改后 7 条）。该 spec 自己写明了「随批次同改该文件与本节」，故本处属**被授权的同改**，不是改已签结论。
- **Expected（绿）**：`npm run check` → `# skipped 7`、无 `[测试] 名单外 skip`、末行 `check 全部通过`；`node --test --test-name-pattern=SC-TC-45 tools/docgen/test/sc-card-shape.test.mjs` → `# skipped 1`。
- **Expected（红）**：把新增任一名字从 `SKIP_ALLOWLIST` 临时删掉 → `npm run check` 必打 `[测试] 名单外 skip：SC-TC-45 …` 并 `# fail` 非 0 → 恢复。
- **R8**：属判据级（skip 口径）→ 同 T1 的 sweep 要求。

### T3 迁 11 件证据账

- **Consumes:** Task 1
- **落点**（`⑤@S-C` 残余第 4 条的原文口径：`docs/reports/<主题>-evidence/`）：
  ```
  docs/reports/2026-11-04-s-c-card-shape-evidence/
    README.md            （映射表：原 .session 路径 → 新路径；迁移理由；12 处指针修法）
    quality/             （5 件：progress.md / quality-4.md / quality-4-audit.md / delivery-5-claim.md / delivery-5-audit.md）
    parliament/          （6 件：progress.md / cards.md / problems.md / detective-round1.md / submission.md / impact-sheet.md）
  ```
  **不迁 `.session/reviews/` 到 `docs/superpowers/reviews/`**：后者是 observation 归档面，非 observation 账本迁入会触发 `ArtifactMissing` / `UnclassifiedArtifact`（`gate-scan.mjs:23-25`）。
- **12 处裸指针必须同批补全路径**（实测值，守卫判 `missing` 的原因；下表「行号」列即裸 `test.mjs` 后跟的数值，补全后一律成为 `tools/docgen/test/sc-card-shape.test.mjs:<行号>`）：

  | 文件 | 行 | 裸指针行号 |
  |---|---|---|
  | `delivery-5-audit.md` | `:75` | 931 |
  | `delivery-5-audit.md` | `:97` | 550、890 |
  | `delivery-5-audit.md` | `:116` | 964、931、934 |
  | `quality-4.md` | `:71` | 87 |
  | `quality-4.md` | `:213` | 964 |
  | `quality-4.md` | `:214` | 931 |
  | `quality-4.md` | `:215` | 934 |
  | `quality-4.md` | `:216` | 943 |
  | `quality-4.md` | `:220` | 970 |

  目标文件全部是 `tools/docgen/test/sc-card-shape.test.mjs`（现有 1079 行，上述行号均未越界）。
  **本 plan 自身也不得出现裸 `<名>.test.mjs:<N>` 形态**（本 plan 初稿曾写 1 处裸 `test.mjs` + 行号，当场被行号守卫判 `missing` → 全仓 `# fail 1`）；引用一律写全路径或改写为「文件名 + 行号分列」。
- **活指针同批改**（`.session` 目录迁走后会成死链）：
  - `skills/dev-workflow/references/gate-record.md` `:106`（`⑤@S-C` 结论列残余 ④ 的三处 `.session/…` 路径）
  - `docs/after/20261104101304-…md` `:30`（议会卡原文路径）与 `:36`（`quality-4.md` 路径）
- **改写禁区**：只动路径字符串。任何结论、判断、实跑数字、`# tests` 值**逐字保留**；不得顺手「修正」账内旧数字。
- **落点闭合**：`docs/after/…-open-decisions.md` §5 主表的 G6 行移入 §5.1（已闭合），§5.1 增一行登记本批的**卡点闭合**（含 T1 的注入值）。
- **删源**：T3 提交后删 `.session/reviews/2026-11-04-1328-s-c-quality/` 与 `2026-11-04-0840-sc-card-shape-spec-parliament/` 两个目录（`.session/` 不进 git，不删会留下两份真相）。
- **Expected**：`node --test --test-name-pattern="行号必须仍有效" skills/managing-lessons-store/scripts/lessons.test.mjs` → `# fail 0`、`missing 0`；`npm run check` → ④ 文件数 / 表数按实际漂移（**不钉死**）、末行 `check 全部通过`；`SC-TC-62` **仍绿**（这是 T1 的兑付证明）。

### T4 删死代码 2 件

- **Consumes:** 无（与 T1–T3 无依赖）
- **前置确认**（实测）：两个 `.mjs` **零 import**（`grep 'from .*renderAgent|from .*sharedBlocks'` 无命中）；两文件头部已有停用横幅。
- **改法**：
  - 删 `tools/docgen/components/renderAgent.mjs`（3275 B）、`sharedBlocks.mjs`（1879 B）。
  - `skills/managing-lessons-store/scripts/lessons.test.mjs` 的 `STRUCT_REPLACED`（`:1768-1770`）增 2 条，每条带**生效日期 + 迁去哪**：
    `'tools/docgen/components/renderAgent.mjs': '<日期> S-D 死代码清理：整文件删除；旧模板渲染语义已由 card-model/cardPipeline 替代'`、
    `'tools/docgen/components/sharedBlocks.mjs': '<日期> S-D 死代码清理：整文件删除；共享块语义已上移 card-model/vocab/shared-actions.mjs'`
  - `docs/after/20261024174253-dev-workflow-mainline-open-items.md` 线 G 行：两件已删 → 按「做完即删条」整行移出。
- **Expected**：`node --test skills/managing-lessons-store/scripts/lessons.test.mjs` → `# fail 0`，`structSkipped` 由 37 升（打印值当场记）；`Test-Path` 两文件 = False；`npm run check` 末行 `check 全部通过`。
- **施工期实情 1（计划外但必须做）·豁免判定前移**：原计划只写「`STRUCT_REPLACED` 增 2 条」。实跑发现**不够** —— 该豁免检查在「目标文件解析成功之后」才生效（`abs` 非空后 `hasOwnProperty`），整文件删除时解析先落 `missing` → 直接红（实测 6 处历史引用全落 `missing`：`2026-10-24-dev-workflow-skeleton-testlanding.md`、`2026-10-30-agent-card-s4-render.md`、`2026-10-19-docgen-agent-batch-design-testcase.md`（2 处）、`2026-10-19-docgen-agent-senior-sdet-design-testcase.md`（2 处，含 1 处全路径写法）、`2026-10-25-docgen-policy-single-source-design-testcase.md`）。处置 = 把豁免判定**前移到解析之前**（全路径相等 或 裸名 == basename 即计 `structSkipped`），复用同一张表、不新增第二份登记。**为什么这样修而不是留墓碑文件**：留墓碑等于「清理死代码」没做成（两件仍占位），且把「删除」这种合法终态排除在豁免语义之外；前移后语义统一为「该文件已不再按原样存在」。**已知风险**：裸名按 basename 匹配，若将来出现同名新文件会误豁免 —— 当前 3 条 basename 各自唯一，已在代码注释写明「新增条目须确认 basename 仍唯一」。
- **施工期实情 2（计划外但必须做）· 同根第二枚炸弹**：`T4` 按 `docs-convention`「做完即删条」动了一份 `docs/after` 既有件 → 撞 `S3-TC-K07 不改面`（`tools/docgen/test/s3-predicates.test.mjs`）。该用例按 `git diff --name-status $S3_BASE`（**开区间到工作树末尾**）判「历史件不许改」——与 T1 的 `SC-TC-62` **同一根因**（批内判据挂在开区间上）。按「同根则一次修好」处置：给它加 `S3_HEAD` 并冻结在 S3 收口提交 `90083cd`（实测 `git diff --name-status b5e11aa 90083cd` = 72 行、其中历史类改/删 **0** 行 → 冻结后恒绿且永久正确）。
- **不动的面**（写明为什么）：`docs/prd/20261026205821-agent-card-contract.md:90` 的「559 行」是 PRD 的**当时实测快照**，不是活判据 → 历史保留；`docs/superpowers/specs/2026-10-19-*` 里对两文件的行号引用由 `STRUCT_REPLACED` 豁免兜住，不逐条改写。

### T5 收口

- **Consumes:** Task 1、Task 2、Task 3、Task 4
- 四道门：`npm run check` / `node scripts/check-gate-record.mjs` / `node scripts/scope-sweep.mjs --check` / `node scripts/check-observable.mjs --check`（+ `npm run doc:name`）。
- 落六行门行：`①@S-D`（旁路，无需求变更；签字 = 审计）、`②@S-D`（无 spec/testcase 增量；签字 = 审计）、`②→③@S-D`（依赖无环 + 白名单；另两条写「不适用（无功能块）」；签字 = 审计）、`③@S-D`（`npm run check` 绿；签字 = 审计）、`④@S-D`（既有回归全过；签字 = sdet）、`⑤@S-D`（交付审计 + 用户终签）。
- **R2 自查**：每行「申报人」∩「签字人」= ∅（按 `、+＋，,/` 拆词求交集）。

## 3 白名单（②→③ 判据：变更范围必须在表内）

| # | 路径 | 变更 | 任务 |
|---|---|---|---|
| 1 | `docs/handoffs/2026-11-04-next-batch-kickoff.md` | A | T0 |
| 2 | `tools/docgen/test/sc-card-shape.test.mjs` | M | T0/T1/T2 |
| 3 | `scripts/test-skip-allowlist.mjs` | M | T2 |
| 4 | `docs/superpowers/specs/2026-10-27-s3-gate-wiring-design.md` | M | T2 |
| 5 | `docs/reports/2026-11-04-s-c-card-shape-evidence/README.md` | A | T3 |
| 6–16 | `docs/reports/2026-11-04-s-c-card-shape-evidence/{quality,parliament}/*.md`（11 件） | A（搬迁） | T3 |
| 17 | `skills/dev-workflow/references/gate-record.md` | M | T3/T5 |
| 18 | `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` | M | T3 |
| 19 | `docs/superpowers/plans/2026-11-04-s-d-residuals-and-dead-code.md` | A | 本件 |
| 20 | `skills/managing-lessons-store/scripts/lessons.test.mjs` | M | T4 |
| 21 | `docs/after/20261024174253-dev-workflow-mainline-open-items.md` | M | T4 |
| 22 | `tools/docgen/components/renderAgent.mjs` | D | T4 |
| 23 | `tools/docgen/components/sharedBlocks.mjs` | D | T4 |
| 24 | `docs/reports/2026-11-04-s-d-bypass-audit.md` | A（审计记录，非交付物） | ① / ② 段 |
| 25 | `tools/docgen/test/s3-predicates.test.mjs` | M（T4 施工期新增：`S3-TC-K07` 加 `S3_HEAD` 冻结上界） | T4 |
| 26 | `tools/docgen/test/card-render.test.mjs` | M（T5 收口期新增：`S4-TC-H03` 的「改动行数」取增+删两列） | T5 |

**第 24 行的来历**：独立审计实例在本批 ①② 判据产出中生成（`PRD §4.2 :333` 强制要求 ①② 行带两样证据，落成文件才可核）。它属**审计记录**，不属「spec / testcase / 载体文件」→ 不破坏旁路判据二；已由该审计实例在 `docs/reports/2026-11-04-s-d-bypass-audit.md` §2.3 里计数留痕。

**白名单外一律不做**。尤禁：`docs/prd/**`（F 集合）、S-A/S-B/S-C 已签件正文、`agents/**` 与 `docs/agents/**`（只能经 `generate --readme --apply` 生成，本批不触发生成）。

## 4 依赖与顺序

```
T0 ──► T1 ──► T2
              └──► T3 ──► T5
T4（独立，可与 T1/T2 并行，但与 T3 不相干）──► T5
```
- **T1 必须在 T3 之前**：否则 T3 新增的 12 件落 A 面超白名单，`SC-TC-62` 红。
- **T1 → T2 顺序写**：同一文件（`sc-card-shape.test.mjs`），不并发。
- **依赖无环**（②→③ 判据）：上图为 DAG，无回边。

## 5 每处改判的取证要求（④ / ⑤ 复核用）

三处判据级改动，执行记录里必须各写**注入前后两个实跑值**（不许只写「已验证」）：

| 改判 | 红（注入后必红） | 绿（恢复后必绿） |
|---|---|---|
| `SC-TC-62` 闭区间 | 删 `NEW_PATHS` 一项 → `A 面出现白名单外路径` | 恢复 → `A-outside 0` |
| `SC-TC-62` 闭区间（炸弹已拆） | — | 新建探针文件 → 仍绿 → 删探针 |
| G6 `t.skip` | 白名单删一名 → `[测试] 名单外 skip：…`、`# fail` 非 0 | 恢复 → `# skipped 7`、`# fail 0` |
| `STRUCT_REPLACED` 增员 | 删登记 → 行号守卫 `missing`/`assert` 非 0 | 恢复 → `# fail 0`、`structSkipped` 上升 |
| **豁免判定前移**（T4 施工期新增） | **实跑即红**：登记后删两文件 → 守卫报 `有 6 处行号引用找不到目标文件` exit 1（先于前移的原始版本，本批当场实测） | 前移后 → `structSkipped 37 → 43`（+6）、`# fail 0` |
| **`S3-TC-K07` 闭区间**（T4 施工期新增） | **实跑即红**：删 `docs/after` 旧行 → `not ok 1043 - S3-TC-K07 不改面`、全仓 `# fail 1` | 加 `S3_HEAD=90083cd` → 单跑 `# fail 0`、全仓 `# fail 0`；`git diff --name-status b5e11aa 90083cd` 的历史类改/删 = **0** 行 |

## 6 已知限制（本批不闭合，带触发与谁兜）

| 事项 | 触发 | 谁兜 |
|---|---|---|
| 本批自身的回退面不再由 `SC-TC-62` 约束（闭区间后它只核 S-C 那批） | 任何后续批次 | 各批 plan 的白名单 + `git status` + ④ 取证（本批即按此办） |
| G9：`SC-TC-62` 白名单仍比签字件宽（A 面 +③ 交接词、M 面 +门行；本批再 +① 交接词） | spec §11.14 / §11.15 修订时 | 主 agent（spec 修订），回填实名 |
| G1 / G2 / G3 / G7 / G8 / G10 / G11 / G12 | 见 `docs/after/20261104101304-…md` §5 各自「触发」列 | 同表「谁兜」列 |
| 旁路首例：`①@S-D` / `②@S-D` 两行是本仓第一次实跑旁路 | 后续旁路批 | 若本批两行在 ④ / ⑤ 被指「证据不足」，按「旁路无效」回 PRD §10 核对并重走 |

## 7 执行记录（施工时逐条填，由施工者写）

| # | 任务 | 状态 | 实跑证据 |
|---|---|---|---|
| T0 | 落 ⑤ 收口 2 件 | **完成** | 提交 `cda896f`（2 files / +92）；落库后 `npm run check` → `# tests 1541 / # pass 1536 / # fail 0 / # skipped 5` + 末行 `check 全部通过`；`git status --porcelain` 0 行 |
| T1 | `SC-TC-62` 闭区间 | **完成** | 提交 `e153d33`；`BASE_HEAD` 默认 = `cda896f`。绿 = `name-status: rows 85 / A 5 / A-outside 0 / nonA-outside 0`；拆炸弹取证 = 新建 `docs/reports/2026-11-04-probe/rogue.md` 后复跑仍 `rows 85 / A 5 / A-outside 0`（随后删探针，`probe-removed=True`）；判据未架空 = 临时删 `NEW_PATHS` 一项 → `A 面出现白名单外路径：docs/handoffs/2026-11-04-s-c-card-shape-impl.md`、exit 1 |
| T2 | G6 `t.skip` | **完成** | 提交 `93c78cd`；单文件 `# tests 60 / # pass 58 / # skipped 2`；全仓 `# skipped 5 → 7`。红档 = 抽掉 `SKIP_ALLOWLIST` 一条 → `[测试] 名单外 skip：SC-TC-45 行口径 vs 次数口径（17 行 / 18 处）——整条归一次性档` + `check 未通过` + exit 1 |
| T3 | 迁 11 件证据账 | **完成** | 提交 `148f82c`（14 files / +1492 −4）；另修 **2 处 `cli.mjs` ambiguous**（`tools/docgen/cli.mjs` vs `tools/observation-check/cli.mjs`，判据 = 被引上下文 `replace --yes` + 行号 543 只在 685 行那份内）与 **1 处表格列数**（`splitRow` 在「反引号内再转义反引号」处吞竖线，改「」引号，语义不变）；行号守卫 `校对 1061 / missing 0`；`npm run check` → `④ markdown 417 文件 / 1808 表`、末行 `check 全部通过`；`SC-TC-62` 仍绿（T1 兑付证明）；`.session` 两目录已删 |
| T4 | 删死代码 2 件 | **完成** | 提交 `9f83862` + `42705fa`（−77）；`structSkipped 37 → 43`（+6）；`# fail 0`。**两处计划外修正见 §2 的「施工期实情 1 / 2」**（豁免判定前移、`S3-TC-K07` 闭区间） |
| T5 | 收口 + 六行门行 | **完成（③ / ④ / ⑤ 行见门账）** | 第三枚同根炸弹 `S4-TC-H03`（纯删除提交判 0）→ 改「改动行数 = 增+删」，提交 `67154a5`；**红档实跑首行** = `not ok 581 - S4-TC-H03 出数门槛：git log -1 --numstat 可跑且单席改动行数 > 0`（改前口径、commit `42705fa` = `0 增 / 53 删` + `0 增 / 24 删` → 旧「只累加增列」= 0 → 断言红）；绿档 = 全仓 `# fail 0`、末行 `check 全部通过`。收口四道门见 `③@S-D` 行 |
