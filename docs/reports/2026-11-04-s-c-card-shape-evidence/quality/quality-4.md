# ④ 段质量门结论表（S-C 卡面形状）

> **判者标识**：`senior-sdet@sc-card-shape-quality4-20261104-01`（角色卡 `agents/senior-sdet.md` 全文贴入工作上下文后执笔）
> **独立性声明**：本实例为**全新上下文**，未参与 S-C 的 spec 撰写（`main-agent@20261103-s-c-spec`）、未参与 testcase 七轮编写（`senior-sdet@sc-card-shape-testcase-20261104-01…07`）、未参与 plan 撰写、**未参与 ③ 段施工**、未参与 ③ 段审计；本席只做三件事——读仓内只读件、跑只读 / 不落盘的验证命令、在**仓外副本**做反向注入。申报人 = 主 agent / 开发（plan `执行记录` §`docs/superpowers/plans/2026-11-03-s-c-card-shape.md:212-220`），签字人 = 本席，两者无交集（R2 满足）。
> **角色卡边界与本次授权的冲突说明**：`agents/senior-sdet.md` 的「边界」段默认把产物写进 spec 同目录 `-testcase.md`；本次由**用户当场指令**授权本席以 ④ 段签字席身份产出 `quality-4.md`。按优先级（用户 > 规则 > 本席）采纳**用户指令**，并在本文件首段写明此授权（不静默越界）。
> **本表性质**：④ 段的**定性权**（申报 / 定性 / 核对三权中的中间一格）。核对权由 ④ 审计实例另出 `quality-4-audit.md`，本席不代签；本表已把 60 条逐条表写成可抽查形态（§2 / §6）。
> **不写**：本表不改任何已签件（spec / testcase / plan / `gate-record.md`）、不改卡面 / 数据 / 渲染器 / 门禁脚本。

---

## 输入清单（行数 / 哈希均由本席自数，不抄自报）

| 件 | 路径 | 行数 | SHA256（前 16 位） | 本席如何核 |
|---|---|---|---|---|
| spec（已签） | `docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md` | **270** | `9B470C827C6B2020…` | `(Get-Content).Count` + `Get-FileHash`；**与 `gate-record.md:100` 记的 `9B470C827C6B2020…` 相同**（② 门行数字独立复现） |
| testcase（已签） | `docs/superpowers/specs/2026-11-03-s-c-card-shape-design-testcase.md` | **1072** | `FC7E144AE00D8197…` | 同上 |
| plan（已签） | `docs/superpowers/plans/2026-11-03-s-c-card-shape.md` | **230** | `6AD6CB6589D0D7D7…` | 同上；`- [x]` **45** / `- [ ]` **0**（现算） |
| 落点测试（**G4/G5 修订后重取**，见 §8） | `tools/docgen/test/sc-card-shape.test.mjs` | **1079** | `6422FBD9CC56415F…` | 同上；`^\s*test\('SC-TC-` 命中 **60**；`^\s+assert\.` **218**；`runNode(`/`runTest(`/`execFileSync(` **37**；`assert.throws(` **9**；`withRepoCopy(` **25**；`if (!SHAPE) return` **3** |
| 落点测试（**首轮基线**，前版记数用此值） | 同上 | 1069 | `EEB65F2137BF8236…` | 前版：`assert` 216 / 子进程 35 / `throws` 10 / `withRepoCopy` 24——**此四数已随 §8 修订失效**，保留仅作对照 |
| 门账（只读） | `skills/dev-workflow/references/gate-record.md` | **122** | `AE7A8EF38D2743FE…` | 本席核 ③ 门行在 **`:102`**（详见 §7 发现 1） |
| ④ 段判据源 | `skills/dev-workflow/references/stage-4-quality.md` | — | — | 六条出口判据的唯一定义处（本表 §1 逐条对号） |

---

## §0 实跑取证表

> 全部命令在**仓根** `d:\Seed\retro-skills` 执行，Shell = PowerShell 5。开工先自查 `git status --porcelain` = **0 行**（工作树 clean）、`HEAD = 5ffe400`，与任务书一致 → 无他人改动，可继续。
> **修订轮（§8）时点**：2026-11-04 复核 G4/G5 闭合时，`HEAD` 已推进到 **`68ff6ab`**（`docs(s-c): ④ 段出口落账（sdet 结论表 + 核对席复核轮判过）`），工作树带**一处未提交改动** `M tools/docgen/test/sc-card-shape.test.mjs`。下表 1–11 行是首轮（HEAD `5ffe400`）的实跑记录，**不改写**；§8 的实跑另立。

| # | 命令（原文） | 关键数（首行 / 摘要） | exit |
|---|---|---|---|
| 1 | `git status --porcelain`；`git rev-parse --short HEAD` | 输出 **0** 行；`5ffe400` | 0 |
| 2 | `node --test --test-reporter=tap tools/docgen/test/sc-card-shape.test.mjs` | `# tests 60` / `# pass 60` / `# fail 0` / `# skipped 0` | **0** |
| 3 | `$env:SB_SHAPE_ONESHOT='1'; node --test --test-reporter=tap tools/docgen/test/sc-card-shape.test.mjs; Remove-Item Env:SB_SHAPE_ONESHOT` | `# tests 60` / `# pass 60` / `# fail 0` / `# skipped 0`（一次性档同数） | **0** |
| 4 | `npm run check` | `① 语法检查通过`；`# tests 1541` / `# pass 1536` / `# fail 0` / `# skipped 5`；`baseline 38/38`；`check-tristate-header: seats 15 / ok 15 / bad 0 => ok`；`check-trigger-kind: seats 15 / kinds {dispatch:11,occasion:1,moment:1,need:2} / bad 0 => ok`；`④ markdown 检查通过（402 个文件 / 1724 张表）`；`⑤ .session 结构检查通过（一级只含封闭清单档位；tmp/ 为空）`；`⑥ 观察产物门禁：扫描 3 个子目录 / 归档 2 对 / 过程 0 对 / findings 0`；**末行 `check 全部通过`** | **0** |
| 5 | `node tools/docgen/cli.mjs gate` | 末行 `baseline 38/38` | 0 |
| 6 | `node scripts/scope-sweep.mjs --check` | 末行 `sweep ok（命中未超基线、清单齐、scope 齐）` | 0 |
| 7 | `node scripts/check-observable.mjs --check` | 末行 `check-observable ok` | 0 |
| 8 | `node scripts/check-gate-record.mjs` | `rows 71 bad 0` + 末行 `gate-record ok（R1/R2/R6 全过；splitting 0）` | 0 |
| 9 | 计数取证：`Select-String -Path tools\docgen\test\sc-card-shape.test.mjs -Pattern "^\s*test\('SC-TC-"` vs 无行首锚点 | 带锚点 **60**；无锚点 **61**（多出的 1 = 文件 `:3` 的注释自命中） | — |
| 10 | 反向验证（**仓外副本**，见 §4） | 注入 A（`trigger.kind` 非法值）→ `bad 1 => fail`，exit **1**；注入 B（删表头派生位）→ `ok 0 / bad 15 => fail`，exit **1**；两次复原后各 exit **0** | 见 §4 |
| 11 | 首跑自伤与处置（**自述、不可复算**：那次失败运行的日志已按 ⑤ 段判据删除，仓内与 `%TEMP%` 均无留存；可复算的只有「删日志后同命令 exit 0」这一步） | 首次 `npm run check` 把日志写进 `.session/tmp/`，末行 `check 未通过`；删除该日志（唯一变量）并把日志改写 `%TEMP%` 后同命令 exit **0** + `check 全部通过` → 推断 ⑤ 段「`tmp/` 为空」判据**有判别力**（推断，非实测对照） | — |

**TAP `ok` 号映射（本席核对：TAP 执行序 = 文件声明序，逐条一致）**：`ok 1…60` 依次对应 `SC-TC-01, 02, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 33, 34, 35, 36, 37, 38, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 43, 44, 45, 46, 47, 48, 49, 60, 39, 40, 41, 42, 50, 51, 52, 57, 53, 54, 55, 56, 59, 62, 58, 61`（60 条全部 `ok`、无 `not ok`）。

---

## §1 六条出口判据逐条结论

> **编号归位（审计打回项 2）**：本表前版用了自编顺序（把「通过率」「可机械判」单列为判据），现**按判据源原序原词**（`skills/dev-workflow/references/stage-4-quality.md:10-15`）归位，不自立条目。原「通过率」并入 ① 的证据、原「可机械判」并入 ④ 的证据。

| # | 判据（`stage-4-quality.md:10-15` 原词） | 结论 | 依据（≥2 条、来自 ≥2 个文件） |
|---|---|---|---|
| ① | ① testcase 全部条目已执行，逐条有结论（通过 / 不通过 / 不适用的理由）；没有「未执行」且没有「略过」 | **成立（附条件）** | ① `sc-card-shape.test.mjs` 60 个 `test('SC-TC-` 块与 testcase §1 覆盖总表 60 行**逐条对上**（§2 现算）；② 两档 TAP 均 `# tests 60 / # pass 60 / # fail 0 / # skipped 0`（§0 行 2 / 行 3）→ 无「未执行」活体、也无「略过」；本批 `# skipped 0`，故「默认 skip 属 §0 许可」在本批**不适用**（`# skipped 5` 来自其它 suite）；③ 附条件 = testcase **签字件内**仍留 **8 个用例**的执行方式带未施行标注（**7 处**全宽形态 `（未施行）`：SC-TC-10/11/12/33/34/35/36；**1 处**变体：SC-TC-55 的 `CHECK`（`` `# tests` 步未施行 ``））+ 48 行「红绿证据」写 `未施行（施工后核）`——这是 ② 段态，已被实跑取代但**未回填**（签字件不改）→ 逐条结论以本表 §2 为准，登记为缺口 G7 |
| ② | ② 负例与边界条数 ≥ 正例条数（计数从 testcase 文件现算，不凭印象） | **成立** | ① 现算：正例 **21** / 负例 **17** / 边界 **22** = 60，负+边 **39 ≥ 21**（逐行名单见 §3，不抄自报）；② 同批现算层级：单元 **30** / 集成 **25** / e2e **5**（= 60）；③ 优先级 P0 52 / P1 8；④ 判据类型 60/60 = `机器` |
| ③ | ③ 每条失败过的用例都留下可重跑的构造方式（副本仓 / 环境变量 / 内存注入三者之一），不只留结论 | **成立** | ① 本席按 `Get-Content` 逐行打印 `docs/superpowers/plans/2026-11-03-s-c-card-shape.md:209-223` 复核：失败记录在 `:217`（`# tests 46 / # pass 43 / # fail 3`，**红 3 = SC-TC-29 / SC-TC-31 / SC-TC-48**，Task 3）、同红延续在 `:218`（Task 4，`# tests 50 / # pass 47 / # fail 3`）与 `:219`（Task 5，`# tests 54 / # pass 51 / # fail 3`）；`:215` 另记 gate / `disk == render` 家族 46 条已知红（非本文件用例）；② 三条各自的可重跑构造在位：SC-TC-29 / 31 的构造 = **环境变量档**（`SB_BASE=eef963e…`，`:214` 给值；`SB_SHAPE_ONESHOT=1` 应急态）+ **单文件复跑**（`node --test tools/docgen/test/sc-card-shape.test.mjs`，`:217` 首行即该命令）；SC-TC-48 的构造 = **副本仓**（落点 `:724-733` 的 `withRepoCopy` + `gate` 子进程）；③ 复位步骤在 `:220`（Task 6：15 席 `draft → diff → replace` → `generate --readme --apply` → `npm run check` `# tests 1541 / # fail 0` + SHAPE 档 `sc-card-shape` 60/60）；④ 本席今日在真仓复跑同一条命令即得 60/60（§0 行 2 / 行 3）→ 构造**可重跑**，不是只留结论 |
| ④ | ④ 反向验证至少一条：对守卫类判据做一次「注入坏数据必红」的构造，确认判据有判别力 | **成立**（首轮「成立（附条件）」已随 §8 解除） | ① 本席独立做 **2 条**（§4：`check-trigger-kind` 注入非法 `trigger.kind` → exit 1；`check-tristate-header` 删表头派生位 → exit 1；复原后各 exit 0），副本在仓外、真仓零改动；② 判别力的**形态**依据（修订后重取，§8）：落点 **218** 条 `assert`、**37** 处子进程调用（`runNode` / `runTest` / `execFileSync`）、**9** 处 `assert.throws`、**25** 处 `withRepoCopy`——全是退出码 / 计数 / 集合 / 首行正则；③ 附条件（首轮判定时）= `sc-card-shape.test.mjs:934` 恒真算术（G4，首轮 P1）、`:940-947` 本地算术替代真删（G5，首轮 P1）——两条守卫首轮**实际无守卫力**；**2026-11-04 修订轮已闭合**：申报方改为「`BASELINE_TESTS + 实际块数`」与「副本真删 + 真跑 + 真读数」，本席自跑 3 组注入全部判死（§8 判词 + 实测），故本条 ④ 现为**无条件成立**（不再挂附条件） |
| ⑤ | ⑤ 已知未覆盖的缺口写清楚（漏检哪类反例、由谁人工兜），不写成「暂无问题」 | **成立** | ① §5 共 **12** 条（G1–G12），四列全填 + 新增「级别」列，无「暂无」；② 来源分层：承接 ③ 门行 **4** 项（P2 计数锚点 1 + P3 三 项）与本任务书 3 项遗留，另本席新增 5 条；③ 每条带 `path:line` 或可复算命令（G3 `61 vs 60`、G1 `docs/agents/senior-sdet.md:9`、G11/G12 的 ③ 门行原文锚） |
| ⑥ | ⑥ 漂移定性结论（类型 + 三权签署）在位 | **成立**（首轮「成立（附条件）」已解除） | ① §6 逐条定性（**G4/G5 闭合后已重算**）：一致 **58** / 换载体 **1**（SC-TC-26）/ 判据放宽 **1**（SC-TC-62）/ 功能增删 **0**，和 = **60**；SC-TC-55 由「判据放宽」→**一致（附收紧）**、SC-TC-56 由「换载体」→**一致**，变更登记在 §8；② 三权：申报 = 主 agent（plan `:212-220`，Task 6 自陈 3 处偏差）/ 定性 = 本表（`senior-sdet@sc-card-shape-quality4-20261104-01`）/ 核对 = ④ 审计实例（**三轮已走完**：首轮判 **不过**（P1 2 / P2 3 / P3 5）→ 本席修订 4 项 → **复核轮判过**，落账于提交 `68ff6ab`）；③ 本席仍不代签核对件（`quality-4-audit.md` 由审计自署） |

---

## §2 60 条逐条表（TC / 明写执行方式 / 实际执行面 / 结论 / 证据）

> 执行面 = `tools/docgen/test/sc-card-shape.test.mjs:<块起行>` + TAP `ok <号>`。**结论分布：通过 60 / 不通过 0 / 不适用 0**。
> ⚠️ = 子判据缺口或载体差异（详见 §5 / §6）。
> **行号口径**：本表行号是**首轮基线**（SHA `EEB65F21…`，1069 行）。G5 重写（§8）在该块内多出 **10 行** → **`:949` 及之后的块统一 +10**（SC-TC-59 `949→959`、SC-TC-62 `997→1007`、SC-TC-58 `1033→1043`、SC-TC-61 `1045→1055`），块内子引用同幅位移；`SC-TC-55`（`:930`）与 `SC-TC-56`（`:940`）块起行未变。TAP `ok` 号不受影响（全 60 条一次未变）。

| TC | testcase 明写执行方式 | 实际执行面（文件:行 + TAP） | 结论 | 证据（关键断言 / 实跑） |
|---|---|---|---|---|
| SC-TC-01 | `PROBE` | `tools/docgen/test/sc-card-shape.test.mjs:87` ok 1 | 通过 | `:49-59` 派生串头部 / 三值顺序 / `reason` 三句；`assertHintShape` 形参是非字面串 |
| SC-TC-02 | `PROBE` | `:92` ok 2 | 通过 | 复用同一 `assertHintShape`（`:49-59`）；负例 = 值形态而非句形态 |
| SC-TC-04 | `PROBE` | `:105` ok 3 | 通过 | `:107-112` 导出 4 键 deepEqual + 第 4 导出非空且含 `reason` |
| SC-TC-05 | `COPY` + `COPY-取数` | `:115` ok 4 | 通过 | `:124` 副本导出 5 键；`:125` 4 键 deepEqual 在此副本上必抛 |
| SC-TC-06 | `PROBE` | `:129` ok 5 | 通过 | `:133` 定义恰 1；`:134/136/137/140` 旧名三面 0；`:142` `S2-TC-F05` exit 0 |
| SC-TC-07 | `COPY` + `PROBE` | `:145` ok 6 | 通过 | `:171-174` 副本命中 ≥1 且「0 命中」判据在该构造上必红 |
| SC-TC-08 | `PROBE` | `:178` ok 7 | 通过 | `:180` `isolatedVerdictLines` 空集（15 卡逐席） |
| SC-TC-09 | `COPY` + `PROBE` | `:184` ok 8 | 通过 | `:205-207` 回填一行 → 命中 ≥1 且判据必红 |
| SC-TC-10 | `TH`（未施行） | `:211` ok 9 | 通过 | `:214` exit 0；`:216` 首行整串正则；`:228-230` 15 席逐字含整串 / 派生声明恰 1 / 许名枚举行 0 |
| SC-TC-11 | `COPY` + `TH`（未施行） | `:233` ok 10 | 通过 | `:238` 注入点恰 1；`:242` **`ok 0 / bad 15 => fail`**（共用函数一改全席红）；`:243` exit≠0 旁证 |
| SC-TC-12 | `COPY` + `TH`（未施行） | `:247` ok 11 | 通过 | `:256` 手写串 `bad 15`；`:263/267` 挪出段 `bad 15` |
| SC-TC-13 | `PROBE` | `:271` ok 12 | 通过 | `:275` 七段 105 不动；`⚠ :276-277` 非 SHAPE 分支是 `assert.ok(true)`（空断言）；`:280/284` 一次性档段末 5 行消失 |
| SC-TC-14 | `node --test` | `:288` ok 13 | 通过 | `:290-292` `sdet-render` exit 0 + `# fail 0` + `# pass ≥1` |
| SC-TC-15 | `COPY` + `node --test` | `:299` ok 14 | 通过 | `:294` 源码不自造 `hit / miss`；`:296` 表头引用派生声明；`:307/308` 多一空格 → exit≠0 且 `# fail ≥1` |
| SC-TC-16 | `node --test` | `:312` ok 15 | 通过 | `:314-316` `S2-TC-C0` 9 pass / 0 fail |
| SC-TC-17 | `PROBE` | `:319` ok 16 | 通过 | `:323` `cardFaceIds` = `[]` |
| SC-TC-18 | `PROBE` | `:326` ok 17 | 通过 | `:331` 未登记 token 必命中 |
| SC-TC-20 | `PROBE` | `:334` ok 18 | 通过 | `:335-337` `CHECK_VERDICTS` ≡ `ENUMS.VERDICTS` 且各 3 |
| SC-TC-21 | `COPY` + `PROBE` | `:340` ok 19 | 通过 | `:350` 注入点恰 1；`:354/355` 副本多 1 值 → 集合必不等 |
| SC-TC-22 | `PROBE` | `:359` ok 20 | 通过 | `:360` 三键；`:363/364` 行首 `export` 恰 1 行 + `new Set` 形态 |
| SC-TC-33 | `TK`（未施行） | `:367` ok 21 | 通过 | `:370/372` exit 0 + 首行 kinds 字面正则；`:378` 15 席逐席附 `when` 前 12 字；`:380/382` `reviewer-audit` 的 `when` 逐字 + `pilot-data` 绿 |
| SC-TC-34 | `COPY` + `TK`（未施行） | `:385` ok 22 | 通过 | `:391` 注入点恰 1；`:395/396` 五值之外 → `=> fail` 且点名该席 |
| SC-TC-35 | `COPY` + `TK`（未施行） | `:400` ok 23 | 通过 | `:406/410/411` 非议会席非 `need` → `=> fail` 且点名 |
| SC-TC-36 | `COPY` + `TK`（未施行） | `:415` ok 24 | 通过 | `:419` 换席名构造；`:427-429` 席数现算 16 → `=> fail` 且点名 `archivist`（写死两席名单会假绿） |
| SC-TC-37 | `PROBE` | `:433` ok 25 | 通过 | `:436` 卡面 `kind` 0；`:439-441` 数据 `card` 8 键 / 无 `kind` / `triggerTable` 有 `kind` |
| SC-TC-38 | `PROBE` | `:445` ok 26 | 通过 | `:447/448` 现算 2 席 = `['evidence-reader','senior-sdet']`；`:451` 与 `cardPipeline` 写死名单 deepEqual |
| SC-TC-23 | `COUNT`（常驻）+ `SHAPE`（现值） | `:506` ok 27 | 通过 | `:507` 斜杠项 0（常驻）；`:511` 一次性档改前侧仍含 `/`（现值由 SC-TC-57 登记） |
| SC-TC-24 | `COPY` + `COUNT` | `:515` ok 28 | 通过 | `:521-523` 注入一处 → 恰 1 项且「=0」判据必红（**项口径**判别力） |
| SC-TC-25 | `COPY` + `COUNT` | `:527` ok 29 | 通过 | `:533/534` 全角形态同判 |
| SC-TC-26 | `COUNT`（常驻）+ `SHAPE`（现值） | `:538` ok 30 | 通过 | `:540` 错口径恒 0（故不可作判据）；`:542` 正口径改后 0；`⚠ :550` 只判「两侧不等」，`= 13` 的精确值由 **SC-TC-57** `:890` 承担 |
| SC-TC-27 | `PROBE` | `:553` ok 31 | 通过 | `:555-559` 15 席含「写回」/ 占位串 0 / 产物名 ≥3 种 / 无空名；`:563` 三态词双面 0；`:565/567` `S5-TC-C08` 绿 + 旧子串不再被当构造前提 |
| SC-TC-28 | `COPY` + `PROBE` | `:570` ok 32 | 通过 | `:582/588/596` 删一席 → 少一席 / 回填占位命中 / 全席同名只剩 1 种 |
| SC-TC-29 | `COUNT` | `:599` ok 33 | 通过 | `:602-606` 三面（seats 全文含外层 `role` / agents / docs/agents）× 词面 0；`:609` `TC-007` exit 0；`:610` 一次性档占位仍 18 |
| SC-TC-30 | `COPY` + `COUNT` | `:613` ok 34 | 通过 | `:621/622` 回填人设 → 投影面命中 ≥1；`:625` 前置断言；`:631` 改写后仍 18；`:638` 漏一处 → 17 |
| SC-TC-31 | `COUNT` | `:642` ok 35 | 通过 | `:644` `20 年经验` 与 `20 年` 在三面合计 0（面宽与 SC-TC-29 同宽） |
| SC-TC-32 | `COPY` + `PROBE` | `:647` ok 36 | 通过 | `:651/652` 英文 / 中文三态词都不出现；`:660` 注入两形态 → 产物名片段可见（构造有效性） |
| SC-TC-43 | `COUNT` | `:665` ok 37 | 通过 | `:667-670` `hostTerm === 主持人` / 键 4 / 键集 deepEqual / 同文件字面恰 1；`:672` `TC-001` exit 0 |
| SC-TC-44 | `COUNT`（常驻）+ `SHAPE`（现值 18） | `:675` ok 38 | 通过 | `:676` 席位字面 0；`:677` 一次性档占位 18 |
| SC-TC-45 | `SHAPE` | `:680` ok 39 | 通过 | `:681-695` `git show $BASE` 逐席：17 行 / 18 处 / 两值必不等 / 改后侧 0；⚠ 默认档 `:681 if (!SHAPE) return` **空跑**（G6） |
| SC-TC-46 | `SHAPE` | `:698` ok 40 | 通过 | `:701` 渲染面总数 30；⚠ 默认档 `:699 if (!SHAPE) return` **空跑**（G6） |
| SC-TC-47 | `PROBE` | `:704` ok 41 | 通过 | `:717-719` 副本改 `hostTerm` → 渲染跟随 / 原词归零；`:721` 真仓 15 卡探针 0 |
| SC-TC-48 | `COPY` + `GATE` | `:724` ok 42 | 通过 | `:729/730` 改数据不重生成 → exit≠0 + 输出含 `Mismatch`；`:733` 真仓 gate exit 0 |
| SC-TC-49 | `PROBE` | `:736` ok 43 | 通过 | `:738-741` 大写插值抛 `NestedSharedRef` / 静默不展开 / 小写展开正确 |
| SC-TC-60 | `PROBE` + `COUNT` | `:744` ok 44 | 通过 | `:746` 大写形态合计 0；`:748` 展开后 `${@` 残留 0；`:762/763` 副本注入后字面必留（判据有对象） |
| SC-TC-39 | `GATE` | `:779` ok 45 | 通过 | `:781-783` 97 项 / 每项 ≤20 / 最长 13（现值记录项）；`:792-794` 注入 21 字 → 必超 20 |
| SC-TC-40 | `COPY` + `PROBE` | `:786` ok 46 | 通过 | `:792/793/794` 同上（注入 21 字） |
| SC-TC-41 | `PROBE` | `:798` ok 47 | 通过 | `:805` 卡模型键面三词槽 0 |
| SC-TC-42 | `COUNT` | `:808` ok 48 | 通过 | `:812-814` `needs 0` / `purpose 22 行` / `method 1 行`（**行口径**）；`:815` 数据键面三词槽 0 |
| SC-TC-50 | `COUNT` | `:826` ok 49 | 通过 | `:827` 全树 `countBanned` = 0；`:832/833/835` 本文件不自含字面（两段拼接构造）+ 字面形态必被同一计数抓到 |
| SC-TC-51 | `PROBE` | `:830` ok 50 | 通过 | 同上三条（`:832/833/835`） |
| SC-TC-52 | `COPY` + `COUNT` | `:838` ok 51 | 通过 | `:860-862` 副本回填键名 → 命中 ≥1 且「=0」必红 |
| SC-TC-57 | `SHAPE` | `:866` ok 52 | 通过 | 默认档 `:871` 恰 3 条 skip；一次性档 `:890-898` 四个现值 13/17/18/30 + 改后 0/0/18/30；`:901-903` `sb-contract-layer` exit 0 / skip 0 / fail 0 |
| SC-TC-53 | `GATE` | `:912` ok 53 | 通过 | `:914` exit 0；`:915` `baseline 38/38` 正则（只作记录） |
| SC-TC-54 | `COPY` + `GATE` | `:919` ok 54 | 通过 | `:925/926` 改数据不重生成 → exit≠0 + `Mismatch` |
| SC-TC-55 | `CHECK`（`# tests` 步未施行）+ `check-plan.mjs map`（今日实跑 exit 0） | `:930` ok 55（修订后仍在 `:930`） | 通过 | `:931` `blockCount(SELF_PATH,'SC-TC-') === 60`（口径即「行首锚点」）；**`:934` 已修（G4 闭合，§8）**：`assert.equal(BASELINE_TESTS + blockCount(SELF_PATH,'SC-TC-'), 1541)` —— 常量漂移 → 红（注入 C 实测 `1542 ≠ 1541`），块数少一块 → `:931` 先红、`:934` 兜（`1540 ≠ 1541`，注入 A/A2 实测）；`:936/937` `check-plan map` exit 0 + `cases 60 / mapped 60` 首行正则 |
| SC-TC-56 | `COUNT`（构造） | `:940` ok 56（修订后仍在 `:940`；块体 `:941-957`） | 通过 | **已修（G5 闭合，§8）**：`withRepoCopy` 副本内真跑 `sdet-render.test.mjs` → `# tests` = 该文件实际块数（**4**）且 exit 0 → `rmSync` 真删 → 同命令再跑 → 断言 exit 非 0 且真实 `# tests` 低于删前（`Number.isFinite` 兜 NaN）；注入 D（把 `rmSync` 换成 `void 0`）→ 该条红（`副本内删文件后同一命令必须 exit 非 0`） |
| SC-TC-59 | `COUNT` | `:949` ok 57 | 通过 | `:954/955` D 编号 17 行 / Q 编号 8 行；`:957` 依据列与影响面列无空值 |
| SC-TC-62 | `COUNT`（真仓只读取 `git diff --name-status $BASE`）+ 静态断言 | `:997` ok 58 | 通过 | `:998/1002/1007/1008` `$BASE` 在位 / 白名单内新增件已跟踪 / A 面与 M 面无白名单外路径；`:1015/1018` A 面缺项 0 + docgen 侧新增恰 3 件；`:1020/1021` `sa-data` 与 `gate` exit 0；`:1024-1026` `docs/after/` 实名件含触发 / 下一次修订 / 谁兜；`:1029/1030` 负例集合非空。⚠ 白名单比签字件宽 2 项（G9 / §6） |
| SC-TC-58 | `PROBE` + `REF` | `:1033` ok 59 | 通过 | `:1037` 表头 4 列；`:1038/1039` `CARD_MODEL_CODES 36` / `SCAN_FIELDS 8`；`:1041/1042` `check-shared-refs` exit 0 + `keySet8 … keySet12 … => ok`。⚠「七段」子判据不在此块（由 SC-TC-13 `:275` 承担） |
| SC-TC-61 | `COPY` + `COPY-取数` | `:1045` ok 60 | 通过 | `:1061` 注入点恰 1；`:1064/1065` 15 席逐席取到表头行 / 重渲逐席跟随探针；`:1067` 真仓 15 卡探针 0（副本注入不落真仓） |

---

## §3 负例 / 边界现算（不抄自报）

**算法**：`(Select-String -Path <testcase> -Pattern '^\| SC-TC-\d{2} \|')` 得 **60** 行，按第 4 列（`类型`）、第 3 列（`层级`）、第 6 列（`执行方式`）、第 7 列（`优先级`）分组计数。表头与分隔行不匹配该正则，故 60 = 用例条数本身（不是「表格行数含表头」）。
**复算声明（审计打回项 3）**：本表前版三个数（层级 32/23/5、`PROBE` 16、`COPY` 18、`COUNT` 14）是**错数**；审计独立复算与本席二次复算一致，现改为 **30/25/5、26/20/16**，并列出逐条名单供抽查。

| 维度 | 现算结果 | 判据 |
|---|---|---|
| 类型 | 正例 **21** / 负例 **17** / 边界 **22**（和 = **60**） | 负 + 边 = **39 ≥ 21** ✅（超出 18 条） |
| 层级 | 单元 **30** / 集成 **25** / e2e **5**（和 = **60**） | 补齐性记录：e2e 5 = SC-TC-53/54/55/56/57；单元 30 = SC-TC-01/02/04/05/06/07/14/15/17/18/20/21/22/24/25/26/28/30/31/32/37/38/40/41/42/43/47/49/51/52；集成 25 = SC-TC-08/09/10/11/12/13/16/23/27/29/33/34/35/36/39/44/45/46/48/50/58/59/60/61/62 |
| 优先级 | P0 **52** / P1 **8**（P1 = SC-TC-22/25/32/42/48/49/56/59） | 记录 |
| 判据类型 | `机器` **60** / 其余 **0** | 与判据 ④ 自洽（无一条写「人工目视」） |
| 执行方式（列 6 出现该关键词的用例数，一条可含多方式、故不相加为 60） | `PROBE` **26**（01/02/04/06/07/08/09/13/17/18/20/21/22/27/28/32/37/38/39/40/41/47/49/51/58/60）；`COPY` **20**（05/07/09/11/12/15/21/24/25/28/30/32/34/35/36/40/48/52/54/61）；`COUNT` **16**（23/24/25/26/29/30/31/42/43/44/50/52/56/59/60/62）；`SHAPE` **6**（23/26/44/45/46/57）；`GATE` **3**（48/53/54）；`TK` **4**（33–36）；`TH` **3**（10–12）；`CHECK` **1**（55） | 记录（审计已核 `SHAPE` / `GATE` / `TK` / `TH` / `CHECK` 五项，本席复算同值） |
| 未施行标注（量词纠正，审计打回项 4①） | 全宽形态 `（未施行）` **7 处**（SC-TC-10/11/12/33/34/35/36）+ SC-TC-55 的 1 处**变体**「`CHECK`（`# tests` 步未施行）」= **8 个用例**（不是「8 处」） | 前版 §1 / §5 把「8 个用例」写成「8 处」，本轮已改（G7） |

---

## §4 反向验证（判据 ④ 的判别力证据）——构造在**仓外副本**，真仓零改动

> **硬约束遵守**：注入全部发生在 `$env:TEMP` 下的独立副本；真仓内**没有任何文件被写入**（`git status --porcelain` 全程 0 行，见 §0 行 1 与本段复原核）。禁用 `node -e`，全部用 PowerShell 原生命令 + 子进程脚本。

### 4.1 副本创建（可重跑）

```powershell
$dst = Join-Path $env:TEMP 'scq-rev-copy1'
if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
robocopy d:\Seed\retro-skills $dst /E /XD .git node_modules .session .superpowers lessons /NFL /NDL /NJH /NJS /NP
Push-Location $dst
```

### 4.2 控制组（副本未注入必须绿）

```powershell
node tools/docgen/check-trigger-kind.mjs        # 期望 exit 0
node tools/docgen/check-tristate-header.mjs     # 期望 exit 0
```

### 4.3 注入 A：`trigger.kind` 非法值 → `check-trigger-kind` 必红

| 项 | 内容 |
|---|---|
| 注入点 | `tools/docgen/data/seats/senior-sdet.json` 的 `"kind": "need"` → `"kind": "bogus"`（命中 **1** 处，`[regex]::Matches(...)` 现算） |
| 命令原文 | `$p = Join-Path $dst 'tools\docgen\data\seats\senior-sdet.json'; $t = [IO.File]::ReadAllText($p); [IO.File]::WriteAllText($p, $t.Replace('"kind": "need"','"kind": "bogus"')); node tools/docgen/check-trigger-kind.mjs` |
| 期望 | 首行含 `bad 1 => fail`，输出点名 `senior-sdet: bogus`，**exit 1** |
| 实测 | 首行 `check-trigger-kind: seats 15 / kinds {dispatch:11,occasion:1,moment:1,need:1} / bad 1 => fail`（**stdout**）；明细 `senior-sdet: bogus（不在四值内…` 走 **stderr**（`tools/docgen/check-trigger-kind.mjs:38` 用 `console.error`，`:33-35` 的 stdout 次行是逐席 `名 + kind + 分隔符 + when 前 12 字`），**exit 1** ✅ |
| 复原 | `[IO.File]::WriteAllText($p, $t)`（写回原字节）→ 复跑 `check-trigger-kind` = `bad 0 => ok`，**exit 0** ✅ |

### 4.4 注入 B：删掉卡表头的派生位 → `check-tristate-header` 必红

| 项 | 内容 |
|---|---|
| 注入点 | `tools/docgen/components/renderCard.mjs` 的 `判据（${VERDICT_HINT}）` → `判据（判定取值）`（命中 **1** 处） |
| 命令原文 | `$q = Join-Path $dst 'tools\docgen\components\renderCard.mjs'; $s = [IO.File]::ReadAllText($q); [IO.File]::WriteAllText($q, $s.Replace('判据（${VERDICT_HINT}）','判据（判定取值）')); node tools/docgen/check-tristate-header.mjs` |
| 期望 | 首行 `ok 0 / bad 15 => fail`，**exit 1** |
| 实测 | 首行 `... ok 0 / bad 15 => fail`（15 席全红——`renderCard.mjs` 的表头是**15 席共用**函数，故不是 `bad 1`），**exit 1** ✅ |
| 复原 | `[IO.File]::WriteAllText($q, $s)` → 复跑 = `ok 15 / bad 0 => ok`，**exit 0** ✅ |

### 4.5 复原与收尾（不留痕）

```powershell
Pop-Location
Remove-Item (Join-Path $env:TEMP 'scq-rev-copy1') -Recurse -Force
git status --porcelain          # 期望 0 行（真仓未被触碰）
```

**实测**：副本已删（`Test-Path` = False）；`git status --porcelain` = **0 行**；`.session/tmp/` 收尾为**空**（日志全部写 `%TEMP%`，见 §7 发现 2）。

**结论**：两条门禁脚本对被注入的坏数据**都判死**（exit 1）且复原后回绿——判据 ④ 的「可机械判」不是自称，有判别力实测。

> **修订轮追加（§8）**：G4 / G5 两条「守卫失效」的闭合复核另做 **4 组注入**（A / A2 针对 `SC-TC-55` 的 `# tests` 断言、C 针对 `BASELINE_TESTS` 常量漂移、D 针对 `SC-TC-56` 的「真删」），同法在 `%TEMP%` 副本做、真仓零改动，实测**全部判死**——判词与失败首行见 **§8**。

---

## §5 缺口表（漏检哪类反例 / 触发信号 / 该做 / 谁兜 / **级别**）

> **级别口径（审计打回项 1）**：`P0` = 阻断出段；`P1` = 守卫失效（判据失去判别力，本批无法靠它挡回退）；`P2` = 覆盖账虚高 / 记录失真（判据源 `stage-4-quality.md:47-51`「常见漏项」）；`P3` = 记录层或文档层残余；**`闭合`** = 曾判 P1 / P2 且已在 2026-11-04 修订轮用实跑证明判别力恢复（判词与注入实测在 §8），**不再计入未闭合缺口**。首轮按审计裁定重判 **3 条**（G4 P2→**P1**、G5 P3→**P1**、G6 P3→**P2**）；修订轮将 **G4 / G5 转为「闭合」**，其余沿用。

| # | 漏检哪类反例（缺口） | 触发信号（怎么发现） | 该做 | 谁兜 | 级别 |
|---|---|---|---|---|---|
| **G1** | 「人设身份句」类的**同义资历表述**漏检：V9 词面只有 `资深` + `20 年`，`十年以上经验` 不在词表 → `docs/agents/senior-sdet.md:9` 首句「有十年以上经验的测试开发工程师。」**逃过**门禁。（另两席首句是**角色定位句**：`evidence-reader.md:9`「通读长文的取证角色：…」/ `reviewer-reader.md:9`「目标读者代表，替…发言。」——不含资历词面，但同样不是「职责 / 动作句」） | 按「首句是否身份句」人工读 `docs/agents/*.md` 的「职责缘由」段；`countWord` 口径只认两个词面，改个说法即绕开 | 把 V9 判据改成**位置型**（首句须为主语 + 动作，禁「有…经验 / 是…角色」句式）+ 词表补同义资历词面；两件都要与 spec §11.8 同批改 | 用户（改判授权的唯一来源）+ 下一批（S-D）施工；④ 只登记不改 | **P3** |
| **G2** | `spec §11.14 步 1` 的 `git checkout` 清单**未点名** ③ 交接词：清单只列 `docs/handoffs/2026-11-04-s-c-card-shape.md`（`spec:260` 附近），缺 `docs/handoffs/2026-11-04-s-c-card-shape-impl.md` → 该件在 A 面白名单里（`tools/docgen/test/sc-card-shape.test.mjs:964-965`），属「落点比签字件宽 1 项」 | 复核 `SC-TC-62` 白名单 vs `spec §11.14 步 1` 清单，差集 = 1（+ impl 交接词，用户 2026-11-04 裁定补入，见 plan `:220` 的「偏差登记」） | spec 下一次修订时把该实名写进步 1 清单（签字件本批不改） | 主 agent（spec 修订者）；④ 已登记，⑤ 交付审计复核差集 | **P3** |
| **G3** | 用例计数命令**缺行首锚点**会自命中：`test('SC-TC-` 无 `^` 锚 → 命中 **61**（多出的 1 是 `tools/docgen/test/sc-card-shape.test.mjs:3` 注释里的示例串）；带 `^\s*test\('SC-TC-` → **60** | 任何临时「数 test 块」的命令；本席实测两值（§0 行 9）。**承接 ③ 门行残留 P2**（原文：「用例计数命令若无行首锚点会把本文件 `:3` 注释自命中成 61 —— 现用 `^\s*test\('SC-TC-` 锚点得 60」） | 计数一律用带锚点形态；或复用落点常量 `blockCount(SELF_PATH,'SC-TC-')`（`tools/docgen/test/sc-card-shape.test.mjs:931`） | ④ / ⑤ 审计（每次复算用带锚点命令；本批已按 60 口径核算）。③ 已给处置口径 → ④ 降为残余 **P3**（无守卫失效：口径已在用） | **P3** |
| **G4** | `SC-TC-55` 的 `# tests ≥ 1481 + 本批新增` 首轮**无真实断言**：原 `tools/docgen/test/sc-card-shape.test.mjs:934` 写成 `assert.equal(BASELINE_TESTS + BATCH_CASES, 1541)`——常量自洽即恒真，改 `BASELINE_TESTS` 不会红 | 读断言即可见（算术恒等式）；对照实跑 `# tests 1541`（数值巧合相等，**不代表判据有效**） | **已按建议修**：`BATCH_CASES`（写死 60）→ `blockCount(SELF_PATH,'SC-TC-')`（实际块数），见现 `:934` 与 `:932-933` 注释 | ⑤ 交付审计（仍须逐批重核 `# tests` 并写进其门行「核了什么」列；本条已不再是无判别力守卫） | **闭合**（首轮 P1 → §8 判词：常量漂移必红 + 块数缺失必红，注入 C / A / A2 实测） |
| **G5** | `SC-TC-56` 首轮用**纯算术构造**替代「副本内删一个测试文件 → COUNT 必红」：原 `tools/docgen/test/sc-card-shape.test.mjs:943-946` 只构造 `afterDelete = floor - victim` 并断言「≥floor」必抛，不实删文件、不跑 COUNT | 读断言 + 无 `withRepoCopy`（首轮该块内 0 次副本调用；现为 1 次） | **已按建议修**：`withRepoCopy` 副本真跑（`:946-948`）→ `rmSync` 真删（`:949`）→ 同命令再跑 → 断言 exit 非 0 且计数掉落（`:951-955`） | ⑤ 交付审计（同 G4 控点；COUNT 若换实现须重核） | **闭合**（首轮 P1 → §8 判词：删真发生才判死，注入 D 实测） |
| **G6** | 默认档 **空跑**但计 pass：`SC-TC-45`（`:681 if (!SHAPE) return`）、`SC-TC-46`（`:699` 同）在默认档**一条断言都不跑**，`# skipped 0` 掩盖了它；`SC-TC-13` 的非 SHAPE 分支是 `assert.ok(true)`（`:277`，恒真空断言） | 默认档 `# tests 60 / # pass 60 / # skipped 0` 与「这三条默认不判」自相矛盾 → 60 个绿里 2 个是空壳。**正撞判据源 `stage-4-quality.md:50`「把『不适用』当『通过』→ 覆盖账虚高」** | 改为 `t.skip()`（进入 `# skipped` 计数）或把空跑改成「提前返回 + 显式 skip 名」；**本批不改已签断言** | 下一批（S-D 收口统一改；本批由 §4 的一次性档实跑兜住真判，⑤ 审计须注明「默认档 2 条为空壳」） | **P2**（审计裁定：P3 → P2） |
| **G7** | testcase **签字件未回填执行结论**：**8 个用例**的执行方式带未施行标注（**7 处**全宽 `（未施行）`：SC-TC-10/11/12/33/34/35/36；**1 处**变体：SC-TC-55 的 `CHECK`（`` `# tests` 步未施行 ``））+ **48** 行「红绿证据」写 `未施行（施工后核）`（`Select-String` 现数）→ 直接读 testcase 会看到「未执行」字样 | 逐条读 testcase 的「执行方式 / 红绿证据」列 | 本批按「签字件不改」原则不回填；结论唯一出口 = 本表 §2；⑤ 交付审计以本表为执行面 | ⑤ 交付审计（引用 §2 而非 testcase 的 `未施行` 标注） | **P3**（量词已改：**8 个用例** / 7 处 + 1 变体，不再写「8 处」） |
| **G8** | **跨条子判据**：`SC-TC-26` 判据行的「改前 = 13 项」由 `SC-TC-57`（`:890`）承担；`SC-TC-58` 判据行的「七段」由 `SC-TC-13`（`:275`）承担 → 单跑其中一条会缺该子判据 | 按判据行逐条对照单块断言（本席 §6 逐条做的就是这件事） | 保留（总表口径下已全覆盖）；文档层面在 testcase 各条写明「该子判据由 SC-TC-xx 承担」 | ④ / ⑤ 复跑者（一律跑整文件，不单跑） | **P3** |
| **G9** | `SC-TC-62` 白名单比签字件宽 **2 项**（A 面 +`docs/handoffs/2026-11-04-s-c-card-shape-impl.md`、M 面 +`skills/dev-workflow/references/gate-record.md`），且 B 面判定由「`A ⊇ 7 项` 写死」改为 `git ls-tree $BASE` 现算 | 对照 testcase SC-TC-62 ⑩–⓺（8 项）/ M 面（5 前缀 + 2 实名 = 7 项）与 `tools/docgen/test/sc-card-shape.test.mjs:970-990`（9 项 / 3 实名） | 已在 plan `:220` 自陈（用户 2026-11-04 裁定）；spec §11.14 步 1 与 §11.15 需在下次修订回填实名 | 主 agent（spec 修订）+ ④ 已定性为「判据放宽」并计数（§6） | **P3** |
| **G10** | **path:line 引用漂移**：任务书把 ② 门行记为 `:99`、计划门 `:100`、③ 门行 `:101`；实为 `:100`（②@S-C）/ `:101`（②→③）/ `:102`（③@S-C），`:99` 是空行 | 本席按行号打印核（§7 发现 1） | 任何「门行在哪一行」的引用一律**当场打印核对**（或引 `check-gate-record` 的 `rows` 数） | ④ / ⑤（引用门行者）；本批不改 `gate-record.md` | **P3** |
| **G11** | **投影面 0 diff 无判据**：`docs/agents/**` 16 份中 2 份 0 diff，③ 门行判定为「投影面所致、非漏生成」（`gate-record.md:102` 的「P3②」原文：「`docs/agents/**` 16 份中 2 份 0 diff 属投影面所致、非漏生成」）——但**「0 diff 何时是正常、何时是漏生成」没有机械判据**，靠读 ③ 结论 | 复算 `git diff --name-status eef963e..HEAD` 与 `docs/agents/` 文件清单，数出 0 diff 份数；再与 ③ 门行文字比对（本席核过：门行只说「属投影面所致」，未给判据） | 在 docgen 侧加一条「投影面 2 份不变 ⇒ 该两席卡面本批未被改」的**正向断言**（现落点仅断言「生成物 == 渲染器输出」，见 `:53` 段），或由 ⑤ 抽 1 份 0 diff 文件核其内容与渲染器一致 | 主 agent（下一批 S-D 的 docgen 断言候选）；⑤ 交付审计抽核 1 份 | **P3** |
| **G12** | **④ 落行后的 impact-sheet mtime**：③ 门行 P3③ 原文「本行落盘后须再 touch 当次 `impact-sheet.md`（R8 mtime）」——本席本批**只动 `.session/` 两份**（不在 scope 内），故**不必** touch；但 **④ 门行落盘时若同时改了 `gate-record.md`，R8 mtime 判据**同样要求 touch 一次（`stage-4-quality.md:57`） | `node scripts/scope-sweep.mjs --check` 若报 `FAIL: impact-sheet 早于被扫文件` 即命中；本批 `sweep ok`（因未碰 scope 文件） | ④ 门行由主 agent 落盘那一刻：若该批 diff 含 `gate-record.md`，同批 touch `.session/reviews/2026-11-04-1328-s-c-quality/impact-sheet.md`（本目录尚无该文件时须先建），再跑 `sweep --check` 必须 exit 0 | 主 agent（落 ④ 门行者）+ ⑤ 交付审计复核 `sweep ok` | **P3** |

**共 12 条**（G1–G12），五列全填，无「暂无」。
**级别计数（G4/G5 闭合后，本席自判）**：**P0 0 / P1 0 / P2 1（G6）/ P3 9（G1、G2、G3、G7、G8、G9、G10、G11、G12）/ 已闭合 2（G4、G5）**——共 12 条，和 = 12。首轮为 P0 0 / P1 2 / P2 1 / P3 9。

### §5.1 承接核对（③ 门行带入项 × ④ 是否承接）

| ③ 门行（`gate-record.md:102`）带入项 | 原级别 | ④ 是否承接 | 承接落点 |
|---|---|---|---|
| 残留 P2：用例计数命令无行首锚点 → `:3` 注释自命中成 61（现用 `^\s*test\('SC-TC-` 锚得 60） | P2 | **承接** | **G3**（④ 复算得同一对 61 / 60；③ 已有处置口径 → 降 P3） |
| P3①：`spec §11.14 步 1` 的 `git checkout` 清单未名 ③ 交接词（偏差已按用户 2026-11-04 裁定补入 SC-TC-62 白名单，建议下批回名） | P3 | **承接** | **G2**（并叠加到 G9 的「白名单宽 2 项」定性） |
| P3②：`docs/agents/**` 16 份中 2 份 0 diff 属投影面所致、非漏生成 | P3 | **承接（但判据缺位）** | **G11**（新增：该判定全靠 ③ 文字，无机械判据） |
| P3③：本行落盘后须再 touch 当次 `impact-sheet.md`（R8 mtime） | P3 | **承接（本批不触发）** | **G12**（本席未碰 scope 文件故不 touch；④ 落行时同规则适用） |

---

## §6 漂移定性逐条（口径：只认 testcase **判据**行 vs 落点断言；四类和必须 = 60）

| 类别 | 计数 | 条目 |
|---|---|---|
| **一致** | **58** | 除下列 2 条外全部 58 条（其中 SC-TC-55 / 56 于 G4/G5 闭合后由「放宽 / 换载体」回归「一致」，见 §8） |
| **换载体** | **1** | SC-TC-26（`= 13` 精确值判在 SC-TC-57 同一 suite 的另一块） |
| **判据放宽** | **1** | SC-TC-62（白名单比签字件宽 2 项 + B 面改判为 `ls-tree` 现算） |
| **功能增删** | **0** | 无：60 条编号与 testcase 一致（`SC-TC-03` 已并入 02、`SC-TC-19` 已并入 06，属 ② 段既有裁定，不是本段增删） |
| 和 | **60** ✅ | 58 + 1 + 1 + 0 = 60 |

**逐条定性表**（`判据行摘` → `落点断言`）：

| TC | 定性 | 依据（判据行 → 落点） |
|---|---|---|
| 01 / 02 / 04 / 05 / 06 / 07 / 08 / 09 | 一致 | 判据行的派生串三句 / 4 键 / 5 键 / 旧名 0 命中 / 副本必红 / 孤立行空集，逐条对 `:49-59, 107-112, 124-125, 133-142, 171-174, 180, 205-207` |
| 10 / 11 / 12 | 一致 | exit 0 + 首行整串 / `ok 0 / bad 15`（共用函数故全席红）/ 手写串 + 挪出段 → `:214-230, 238-243, 256-267` |
| 13 | 一致（附空断言标注） | 七段 105 + 段末 5 行 → `:275-284`；非 SHAPE 分支 `assert.ok(true)`（G6） |
| 14 / 15 / 16 | 一致 | `sdet-render` 三数 / 源码自体字面 0 + 派生引用 + 多空格必红 / C 组 9 pass → `:290-292, 294-308, 314-316` |
| 17 / 18 / 20 / 21 / 22 | 一致 | `cardFaceIds` 空 / 未登记 token / `CHECK_VERDICTS` ≡ 三键 / 副本第 4 值必不等 / 行首 export 恰 1 → `:323, 331, 335-337, 350-355, 360-364` |
| 33 / 34 / 35 / 36 | 一致 | TK exit 0 + 首行 kinds + 逐席 when 前 12 字 + 三坏形态 → `:370-382, 391-396, 406-411, 419-429` |
| 37 / 38 | 一致 | 卡面 `kind` 0 / 8 键 / 无双名单漂移 → `:436-441, 447-451` |
| 23 | 一致 | 常驻 `= 0` + 一次性「改前仍含 `/`」→ `:507-511` |
| 24 / 25 | 一致 | 项口径注入恰 1 / 全角同判 → `:521-523, 533-534` |
| 26 | **换载体** | 判据行要「一次性档 `rightBefore === 13`」；本块只判 `notEqual(before, right)`（`:550`）→ 精确值判在 SC-TC-57 `:890` |
| 27 / 28 | 一致 | 写回 / 占位 0 / 名 ≥3 种 / 三态词双面 0 / 三坏形态 → `:555-567, 582-596` |
| 29 / 30 / 31 / 32 | 一致 | 三面（含外层 `role`）× 词面 0 / `TC-007` / 18-17 占位 / 词面边界同宽 / 英中双面 → `:602-610, 621-638, 644, 651-660` |
| 39 / 40 | 一致 | 97 项 + `≤20` + 注 21 字必红 → `:781-783, 792-794` |
| 41 / 42 | 一致 | 卡模型键面 0 / 行口径 0-22-1 → `:805, 812-815` |
| 43 / 44 | 一致 | `hostTerm` 唯一 / 键 4 / 由 `TC-001` 兜 / 字面 0 + 一次性 18 → `:667-672, 676-677` |
| 45 / 46 | 一致（默认档空跑） | 17 行 / 18 处 / 必不等 / 30 → `:681-695, 699-701`（G6） |
| 47 / 48 / 49 / 60 | 一致 | 副本改 `hostTerm` 跟随 + 真仓 0 / 改数据不重生成必红 / 大写三形态 / `${@` 残留 0 → `:717-721, 729-733, 738-741, 746-763` |
| 50 / 51 / 52 | 一致 | 全树 0 / 拼接构造 + 字面必被抓 / 副本回填必红 → `:827-835, 860-862` |
| 53 / 54 | 一致 | gate exit 0 + `38/38` 只作记录 / 副本必红 → `:914-915, 925-926` |
| 55 | **一致（附收紧，G4 闭合后改判）** | 判据行要「`# tests` 取现实数并比 floor（本批新增 = 实际块数，不写死）」；落点现 `:934` = `assert.equal(1481 + blockCount(SELF_PATH,'SC-TC-'), 1541)` → **与判据行同口径**（改前是写死 `BATCH_CASES=60` 的恒真算术）；`=` 比 `≥` 严，属**收紧**非放宽（变更登记见 §8） |
| 56 | **一致（G5 闭合后改判）** | 判据行要「副本内删一个测试文件 → COUNT 形态 exit 1」；落点现 `:940-957` = `withRepoCopy` + 真跑 + `rmSync` 真删 + 再跑 + 断言 exit 非 0 且计数掉落 → **判据面与判据行对齐**（改前是纯算术构造） |
| 57 | 一致 | 默认 3 skip + 一次性四现值 + sb 三件 → `:871, 890-903` |
| 58 | 一致（跨条） | 4 列 / 36 / 8 / REF exit 0 → `:1047-1052`；「七段」由 13 承担（G8） |
| 59 | 一致 | D 17 行 / Q 8 行 / 两列无空 → `:964-967` |
| 61 | 一致 | 副本注入 → 15 席跟随 + 真仓 0 → `:1071-1077` |
| 62 | **判据放宽** | 判据行 8 项白名单 / M 面 7 项；落点 9 项 / 8 项（`:970-990`）→ 集合约束放松（G9） |

**三权在位情况**：申报 = 主 agent（plan `执行记录 :212-220`，Task 6 自陈 3 处偏差；**G4/G5 的修由主 agent 申报**，本席只复核）；定性 = 本表（`senior-sdet@sc-card-shape-quality4-20261104-01`）；核对 = ④ 审计实例（**已走完**：首轮判 **不过**（P1 2 / P2 3 / P3 5）→ 本席修订 4 项 → **复核轮判过**，④ 段出口落账于提交 `68ff6ab`；`quality-4-audit.md` 由审计自署，本席不代签）。三权 = **3/3 在位**，故判据 ⑥ 记为「成立」。

---

## §7 其他发现（不影响六条判据结论，但值得记）

1. **门行行号漂移**：任务书给 ②/计划门/③ 门行为 `:99 / :100 / :101`，实测为 **`:100 / :101 / :102`**（`:99` 是空行、`:103` 是空行）。本席按 `Get-Content` 逐行打印核对（`gate-record.md` 122 行 / `rows 71`）。→ 缺口 G10。引用门行时必须当场打印，不凭记忆。
2. **本席首跑自伤（并因此得到第 3 条判别力证据）**：第一次 `npm run check` 把日志写到 `.session/tmp/npmcheck-sc-quality.log`，末行 `check 未通过`；删该日志（唯一变量）并把日志改写 `%TEMP%` 后，同命令 exit 0 + `check 全部通过`（⑤ 段判据即「`tmp/` 为空」）。→ ⑤ 段的 `.session/tmp` 判据确有判别力；同时说明**审计岗自己也会制造红**，故本席此后所有中间产物一律写 `%TEMP%`。
3. **「数字相等」不等于「判据有效」**：`SC-TC-55` 首轮的常量 `1481 + 60 = 1541` 与实跑 `# tests 1541` 恰好相等——若只用「数对上了」作证据，会把恒真断言当成绿。按三性（真实 / 合理 / 有效）：真实（1541 是本席复跑的输出）✅、合理（算术恒等式，不是取数）❌ → 首轮定性为**判据放宽**（G4）。**修订轮已闭合（§8）**：改成 `1481 + 实际块数` 后，左值随文件内容变，「合理」这一性转为 ✅。
4. **一次性档的现值断言确实被判过**：`SC-TC-57` 在 `SB_SHAPE_ONESHOT=1` 下断言 BASE 侧 `斜杠 13 / 行 17 / 次 18 / 渲染 30`、改后 `0 / 0 / 18 / 30`，且 `sb-contract-layer` exit 0 / skip 0 / fail 0（`:890-903`）——与 testcase §0.1 登记的现值逐项一致（本席复跑，非抄表）。
5. **`.session/tmp` 收尾干净**：本席全部中间件写 `%TEMP%`，仓内唯一新增产物 = 本次审查目录下两份 md（`progress.md` / `quality-4.md`）；`git status --porcelain` 全程 0 行（产物未提交，由主 agent 提交）。

---

## §8 G4/G5 闭合复核（2026-11-04 修订轮）

> **轮次与角色**：申报方（主 agent）在 ④ 段落账（提交 `68ff6ab`）之后，于**工作树未提交**状态下修订 `tools/docgen/test/sc-card-shape.test.mjs`，申报「G4 / G5 已修」。本席以**同一 sdet 实例**（`senior-sdet@sc-card-shape-quality4-20261104-01`）做**闭合复核**：读 diff、在 `%TEMP%` 整仓副本做 4 组注入、在真仓跑正向回归。**本席未改任何仓内文件**（`git status --porcelain` 只有申报方那一行 `M`）。
> **复核对象**：`git diff -- tools/docgen/test/sc-card-shape.test.mjs`（1069 → 1079 行，SHA `EEB65F21…` → `6422FBD9…`，块数仍 **60**）。

### 8.1 两处改动判词

| 缺口 | 改动（diff 原文） | 判别力判词 |
|---|---|---|
| **G4** | `assert.equal(BASELINE_TESTS + BATCH_CASES, 1541)` → `assert.equal(BASELINE_TESTS + blockCount(SELF_PATH, 'SC-TC-'), 1541)`（`blockCount` = 按 `^\s*test\('<prefix>` 逐块计数，见 `:931` 同一函数的既有用法） | **恒真已解除**：左值从「两个常量」变成「常量 + 文件实际块数」，输入随文件内容变化 → ① `BASELINE_TESTS` 字面漂移必红（注入 C：`1482 + 60 = 1542 ≠ 1541`）；② 块数少一块必红（注入 A2：`1481 + 59 = 1540 ≠ 1541`）。<br>**但有一条重叠须写明**：同一块内 `:931` 已把「块数 == 60」钉死，故**删一块时 `:931` 先红**（注入 A 实测 `expected 60 / actual 59`），`:934` 根本执行不到 → **`:934` 的独立判别面 = 「`BASELINE_TESTS` 常量漂移」+「块数被改但仍配平的情形（如删一块同时把常量改 1482）」**，不是新增一条独立判据面。属**可接受的双保险**（两条同为真断言、方向同向），**不构成新恒真**。<br>方向：`=` 严于判据行 `≥ floor`，是**收紧**（与 G9 式的「放宽」相反）。 |
| **G5** | 原 `:943-946` 纯算术（`afterDelete = floor - victim` + 「≥floor 必抛」）→ 现 `:940-957`：`withRepoCopy` 副本内先跑 `node --test ... tools/docgen/test/sdet-render.test.mjs`（`:946-948` 断言 `# tests` == 该文件实际块数 **4** 且 exit 0）→ `rmSync` **真删**该文件（`:949`）→ 同命令**再跑**（`:951`）→ 断言 **exit 非 0**（`:952`）且真实 `# tests` 低于删前（`:953-955`，`Number.isFinite` 兜 NaN） | **判别力已恢复**：判死条件是「删真发生了」——注入 D 把 `rmSync(...)` 换成 `void 0`（跳过删除）→ 该条**必红**（`error: '副本内删文件后同一命令必须 exit 非 0'`）。<br>**方向与判据行一致**（testcase SC-TC-56 判据 = 副本内删一个测试文件 → COUNT 形态 **exit 1**），且**回归 testcase 原文**：判据行本就写「本批新增 = 实际块数，不写死」，旧实现的写死常量 `BATCH_CASES` 反而是偏离。<br>**残余说明（不新增缺口）**：`Number.isFinite` 兜底把「没打印计数行」视为 0 —— 该情形只在**文件已被删**时出现，语义即「该文件不再产生用例」，且与「exit 非 0」断言合判，**不构成假绿**。 |

### 8.2 反向验证实测（4 组，全部在 `%TEMP%` 副本；真仓零改动）

副本创建（可重跑，与 §4.1 同法）：

```powershell
$dst = Join-Path $env:TEMP 'scq-g4g5-copy1'
if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
robocopy d:\Seed\retro-skills $dst /E /XD .git node_modules .session .superpowers lessons /NFL /NDL /NJH /NJS /NP
```

| 注入 | 注入点（副本内） | 命令原文 | 期望 | 实测（失败首行 / 关键行） |
|---|---|---|---|---|
| **A**：删掉**最后一个** `test('SC-TC-` 块（SC-TC-61，基线 `:1045`～文件末），块数 **60 → 59** | `tools\docgen\test\sc-card-shape.test.mjs`；用 `[IO.File]::ReadAllLines` + 找最后一个 `^\s*test\('SC-TC-` 的 0-based 行号 `$idx`，保留 `$lines[0..($idx-1)]` 后 `WriteAllText`（保持语法完整：前一块已在 `:1053` 闭合） | `node --test --test-reporter=tap "--test-name-pattern=SC-TC-55" tools/docgen/test/sc-card-shape.test.mjs`（cwd = 副本根） | **必须红**，失败信息含 `1540`（或 `1541`）对比 | `not ok 1 - SC-TC-55 用例账对齐（60 块）+ plan 的 check-plan map 无缺口 / 无悬空`；`expected: 60` / `actual: 59`；`# pass 0 / # fail 1`；**exit 1** ✅（`:931` 先红，`:934` 未执行） |
| **A2**：在 A 基础上再把 `:931` 那一行（`assert.equal(blockCount(SELF_PATH, 'SC-TC-'), BATCH_CASES)`）从副本删掉，让执行流到达 `:934` | 同上（同一副本原地二改） | 同 A | **必须红**且含 `1540 / 1541` 对比 | `not ok 1 - SC-TC-55 …`；**`expected: 1541` / `actual: 1540`**；`# pass 0 / # fail 1`；**exit 1** ✅（→ `:934` 自身有判别力，任务书要求的 1540 对比在此取得） |
| **C**：`BASELINE_TESTS` 常量漂移 `1481 → 1482`（命中 **1**，`[regex]::Matches` 现算） | `tools\docgen\test\sc-card-shape.test.mjs`（新副本 `scq-g4g5-copy3`，块数保持 60） | 同 A 的 S-C-TC-55 单跑命令 | **必须红**（原 G4 的核心抱怨即「改常量不红」） | `not ok 1 - SC-TC-55 …`；**`expected: 1541` / `actual: 1542`**；`# pass 0 / # fail 1`；**exit 1** ✅ |
| **D**：把**真删**改成空操作 `rmSync(join(copy, victim), { force: true })` → `void 0 // 注入D：跳过真删`（命中 **1**） | `tools\docgen\test\sc-card-shape.test.mjs`（copy3 恢复原文后再注入） | `node --test --test-reporter=tap "--test-name-pattern=SC-TC-56" tools/docgen/test/sc-card-shape.test.mjs` | **必须红**（若删不真发生却仍绿 = G5 没修） | `not ok 1 - SC-TC-56 做坏判据：副本真删 sdet-render.test.mjs → 同一命令真实计数归零且 exit 非 0`；`error: '副本内删文件后同一命令必须 exit 非 0'`；`# pass 0 / # fail 1`；**exit 1** ✅ |

**复原步骤**（每组跑完即做）：`Pop-Location` → `Remove-Item (Join-Path $env:TEMP 'scq-g4g5-copyN') -Recurse -Force` → 真仓 `git status --porcelain` 复核（全程只有申报方那一行 `M`）。**实测**：三个副本均已删（`Test-Path` = False、`%TEMP%` 下 `scq-*` 计数 = **0**）；日志一律写 `%TEMP%` 并就地删除，`.session/tmp` 文件数 = **0**。

### 8.3 正向回归（真仓，2026-11-04 修订轮实测）

| # | 命令 | 结果 |
|---|---|---|
| 1 | `node --test --test-reporter=tap tools/docgen/test/sc-card-shape.test.mjs` | **`# tests 60` / `# pass 60` / `# fail 0` / `# skipped 0`**；`not ok` 计数 **0**；exit **0**；单跑耗时 **≈21 s**（G5 真删真跑 + 两次副本子进程所致，从原先秒级上升；记为 ⑤ 段可评估的耗时增量，不立缺口） |
| 2 | `node --test --test-reporter=tap "--test-name-pattern=SC-TC-55\|SC-TC-56" …`（单跑两条） | 两绿、`not ok` 0、exit **0**；SC-TC-56 `duration_ms ≈ 416`（= 副本建 → 真跑 → 真删 → 再跑两趟） |
| 3 | `npm run check`（日志写 `%TEMP%`，跑完即删） | `# tests 1541` / `# pass 1536` / `# fail 0` / `# skipped 5`；`④ markdown 检查通过（402 个文件 / 1724 张表）`；`⑤ .session 结构检查通过`；**末行 `check 全部通过`**；exit **0** |
| 4 | `git status --porcelain` | **1 行**：`M tools/docgen/test/sc-card-shape.test.mjs`（申报方改动）；**无** `quality-4.md` / `progress.md`（在 `.session/`，不进 git）；已签三件（spec / testcase / plan）与 `gate-record.md` **均无改动** |
| 5 | `node scripts/scope-sweep.mjs --check`（R8 附带核） | exit **0**，末行 `sweep ok（命中未超 baseline、清单齐、scope 齐）` |

**关键对照**：`# tests 1541` 与修前一致 → 本次修订**没有增删用例块**（块数仍 60），只是把两条断言的**取数方式**从「常量 / 算术」换成「实际块数 / 真删真跑」。

### 8.4 计数更新（本席自判）

| 档 | 首轮 | 修订轮（修 G4/G5 后） |
|---|---|---|
| P0 | 0 | 0 |
| P1 | 2（G4、G5） | **0** |
| P2 | 1（G6） | 1（G6，未动） |
| P3 | 9 | 9（G1、G2、G3、G7、G8、G9、G10、G11、G12，未动） |
| **已闭合** | — | **2（G4、G5）** |
| 和 | 12 | **12**（0 + 0 + 1 + 9 + 2） |

**联动修订**（同一轮已同步，避免两处真相）：§5 两条 G4/G5 的「级别」列与计数行、级别口径段新增「`闭合`」档；§6 四类计数 **58 / 1 / 1 / 0 = 60**（SC-TC-55「判据放宽」→**一致（附收紧）**、SC-TC-56「换载体」→**一致**）；§1 判据 ④ / ⑥ 由「成立（附条件）」改「成立」；输入清单与 §2 行号口径按新 SHA 重取并标 +10 位移规则；§7 发现 3 加「已闭合」注。

### 8.5 结论

**G4、G5 闭合**（两条 P1 归零，剩余未闭合最高级别 = **P2（G6）**）。**本席（sdet）确认修订未改判据方向、未改已签三件、未改 `gate-record.md`**——判据方向：G4 由 `≥ floor`（下界）收紧为 `= 1541`（精确，且 `1481 + 实际块数`），G5 与 testcase「副本内删文件 → COUNT exit 1」同向；已签件：`git status` 无 spec / testcase / plan / 门账改动（见 8.3 第 4 行）。G6 仍为未闭合 P2，处置归 ⑤ 交付审计（须在其门行注明「默认档 `SC-TC-45/46` 为空壳、真判在一次性档」）。
