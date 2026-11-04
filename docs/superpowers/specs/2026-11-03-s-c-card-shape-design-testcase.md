# 测试用例：S-C 卡面形状（三态承载 / 动作返回 / trigger 四型 / 长度约束 / 删人设 / `HOST_TERM`）

> 归属 spec：`docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md`（split from `docs/prd/20261102212627-card-data-contract-and-proof/index.md`，2026-11-03）
> 编写者：`senior-sdet`（实例标识 `senior-sdet@sc-card-shape-testcase-20261104-01`）
> 修订者：`senior-sdet`（实例标识 `senior-sdet@sc-card-shape-testcase-20261104-02`）；`senior-sdet`（实例标识 `senior-sdet@sc-card-shape-testcase-20261104-03`）；`senior-sdet`（实例标识 `senior-sdet@sc-card-shape-testcase-20261104-04`）；`senior-sdet`（实例标识 `senior-sdet@sc-card-shape-testcase-20261104-05`）；`senior-sdet`（实例标识 `senior-sdet@sc-card-shape-testcase-20261104-06`）；`senior-sdet`（实例标识 `senior-sdet@sc-card-shape-testcase-20261104-07`）
> **独立性声明**：本文件由 `senior-sdet` 在**全新上下文**编写（轮次 1，`…-01`），并由**另一个全新上下文**的 `senior-sdet`（轮次 2，`…-02`）按 spec §11.11 的 12 条裁定回填；第三轮（`…-03`）在又一全新上下文里按**议会轮 1 的 5 条 P0（Q-1…Q-5）+ 4 条 P1（A-2 / A-3·R-2 / B-2 / A-4）**与 spec 整篇重写后的新口径回填；第四轮（`…-04`）在又一全新上下文里按**议会复核轮的 3 条新发现（BB-1 / BB-2 / BB-3）+ 2 条残余（`${@hostTerm}` 占位保全 / `tool-tiers` 行号）**与 spec 收尾改动（§11.4 `role` 也归人设面、§11.4 `rationale` 保占位、§11.1 R6 `:623` + `sdet-data.test.mjs:26`、§11.14 回退面清单、§11.12 D6 延期落点实名）回填；第五轮（`…-05`）在又一全新上下文里按**审计打回的 3 条 P1（P1-1 `V2` 无用例 / P1-2 `SC-TC-62` 白名单与实测不符 / P1-3 `D-8` 前提失效）**回填（P1-1 并入 SC-TC-55 加一步、P1-2 改白名单与 §0.1 现状行、P1-3 把 D-8 标已消解；**三条都不新增用例**）；第六轮（`…-06`）在又一全新上下文里按**终核轮抓出的 1 条 P0（CC-1）**回填——`SC-TC-62` ②③ 把「`??` 面恰 N 项必现」写成**常驻断言**，施工后提交（或 `git add` 后变 `A `）即归零 → 恒红，且与 spec §11.9「现值型断言归 `SB_SHAPE_ONESHOT=1`」、plan Task 0「`porcelain` 空」互斥；改判为 `git diff --name-status $BASE`（**不新增用例**，条数仍 60）；第七轮（`…-07`）在又一全新上下文里按**审计复核抓出的 1 条 P0（P0-2）**回填——`SC-TC-62` 的 **M-面白名单**漏 `docs/superpowers/specs/2026-11-03-s-a-data-layer-design-testcase.md`（该件 `git ls-files` 命中 = **已跟踪**，plan Task 5 明写要改它的 `TC-015` 文案 → 施工后必以 `M` 出现，不在白名单即**恒红**、`# fail 0` 不可达，与 CC-1 同族）；把该件按 spec §11.14 步 1 的**现读 `git checkout` 清单**（该清单已含它）补进 M 面，并按 plan 的 File Structure 表**逐行**复核其余漏项（**不新增用例**，条数仍 60）。编写者 / 修订者 ≠ spec 作者（`main-agent@20261103-s-c-spec`）、≠ 施工者；七轮均**只读** spec / PRD / plan / 既有实现与既有测试，未参与 spec 撰写，未参与本段施工，未改动任何被读文件。
> 状态：**修订轮次 7（P0-2 回填：`SC-TC-62` 的 M-面白名单补 `2026-11-03-s-a-data-layer-design-testcase.md`；修订者 = `senior-sdet@sc-card-shape-testcase-20261104-07`）**｜最后更新：`2026-11-04`｜用例条数：**正 21 / 负 17 / 边界 22 = 60**（本轮条数**未变**：P0-2 **只改写 `SC-TC-62` 的 M-面白名单 + 步骤 / 预期 / 判据 / 红绿证据 + 依赖它的索引与台账格**，未新增条目，见 §1 末「计数核算」；硬上限 60，**已顶格**。轮次 6 的 CC-1 改判、轮次 5 的 3 条 P1 均为加步 / 改判据 / 改表格吸收；轮次 4 回填的 5 条里只有 BB-2/BB-3 合并成的新增 SC-TC-62 占位；轮次 3 已把 SC-TC-03 并入 SC-TC-02、SC-TC-19 并入 SC-TC-06）。
> 命名与落点：按 `spec-testcase-gate` 判据 1（与 spec 同目录；文件名 = spec 文件名去掉 `.md` 后 + `-testcase.md`）。
> **声明（纪律）**：本轮**未跑 `npm run check`**（其数值取 spec 头部作者 2026-11-04 的复跑结果，并标注来源）；本轮只跑了**两条只读命令**——`git status --porcelain`（取 `??` 面集合）与 `node scripts/check-plan.mjs map --plan docs/superpowers/plans/2026-11-03-s-c-card-shape.md`（V2 的落点，exit 0）；**未改 spec**（`2026-11-03-s-c-card-shape-design.md` 本轮零改动）、**未改 plan**、**未改任何代码 / 既有测试**；未改 `agents/`、`docs/agents/`、`tools/docgen/**`、`scripts/**`、任何已签 spec / testcase / plan。本文件内对 spec 的差异一律只在 §5 记录并标「已裁定 / 已消解」，不代改 spec。**轮次 6（CC-1）同样只读**：只跑三条只读命令——`git status --porcelain`（`??` 面仍 5 项，与轮次 5 同）、`git rev-parse HEAD`（现盘基线 `a18b56c`，证明 `$BASE` 可取）、`git diff --name-status HEAD`（**输出空**，证明「未跟踪件不进 `git diff`」→ 故 `SC-TC-62` ②-0 的前置断言不可省）；未改 spec / plan / 代码 / 既有测试。**轮次 7（P0-2）同样只读**：只跑只读取数命令——`git ls-files -- <File Structure 表里的 17 个文件实名 + 4 组目录>`（17/17 均已跟踪；`data/seats` 15 / `agents/*.md` 15 / `docs/agents` 16 / `fixtures` 18 均已跟踪）、`Test-Path` 复核 3 件新建件（**均 False** → 归 `A` 面）、`git status --porcelain`（`??` 面仍 5 项）、`git rev-parse HEAD`（`a18b56c`）；未改 spec / plan / 代码 / 既有测试。
> **未施行标记**：依赖施工后产物的用例（`VERDICT_HINT` / `hostTerm` / `check-trigger-kind.mjs` / `check-tristate-header.mjs` 尚未存在）在「红绿证据」栏显式标 `未施行（施工后核）` + 理由；本文件**不**在未施行处贴伪造输出。

## 0 判据约定（全表复用；所有命令在**仓根**执行，Shell = PowerShell 5，`exit` 指进程退出码）

| 代号 | 命令 / 形态 | 备注 |
|---|---|---|
| `GATE` | `node tools/docgen/cli.mjs gate` | spec §11.9「15 席重生成走两步写盘」的收口；判 `exit 0` + 15 席 `disk == render` |
| `CHECK` | `npm run check` | 门禁总入口；**本席本轮不跑**（纪律），V3 的 `# tests` 口径只认它 |
| `REF` | `node tools/docgen/check-shared-refs.mjs` | §11.9「8/12 键」的现存实现 |
| `TK` | `node tools/docgen/check-trigger-kind.mjs` | **施工后新建**（spec §11.2 #7）；现不存在 |
| `TH` | `node tools/docgen/check-tristate-header.mjs` | **施工后新建**（spec §11.2 #8）；现不存在 |
| `PROBE` | 落进 `tools/docgen/test/sc-card-shape.test.mjs` 的该条用例体，单跑：`node --test --test-name-pattern "SC-TC-NN" tools/docgen/test/sc-card-shape.test.mjs` | 断言一律 `node:assert/strict`；**禁止** `node -e` / `node --input-type=module -e` 当判据 |
| `COPY` | 仓副本注入坏值：`withRepoCopy(fn)`（`tools/docgen/test/support/dev-workflow-checks.mjs:241`）或 `coldRepo(...)`（`tools/docgen/test/support/card-fixtures.mjs:36`） | **不得在真仓就地注入**（真仓注入只在「语料/夹具」明确写出的场合） |
| `COPY-取数` | 副本内取数的**唯一合法形态**（spec §11.9 末条 / 本轮 Q-5）：父测试在副本里写一个**只打印观测值**的探针脚本（如 `<副本>/probe-xxx.mjs` 打印 15 席的表头行 / 计数），用 `runNode([<副本相对路径>], <副本>)`（`card-fixtures.mjs:28`）子进程跑它，**只把 stdout 当取数**；父测试再用 `assert` 判这些数 | 两件**都不许**：① 父测试 `import('<副本>/…')` 副本内模块——副本路径不在 ESM 解析面、且模板/契约在 **import 时即固化**（`card-fixtures.mjs:27` 的原话：同进程改副本后重渲恒绿），该写法**不可实现**；② 把子进程退出码当唯一判据（退出码只说明「探针脚本没崩」，不说明判据成立） |
| `COUNT` | 纯计数统一形态：`$c = <取数命令>; if ($c -ne 0) { Write-Host '<名> $c'; exit 1 }; exit 0`（「必须 ≥ N」处写 `-lt N`） | **不许**拿 `Select-String` / `git diff` / `git ls-files` 的**进程退出码**当判据（它们不设退出码 → 恒真）；落成 `node --test` 时等价 `assert.equal($c, 0)` |
| `BASE` | `git rev-parse HEAD`（**动模板之前**取，写进当次账本） | 一次性形态断言的比较基准（spec §11.9 末条） |
| `SHAPE` | 一次性 / 批次形态断言档位 `SB_SHAPE_ONESHOT=1` + `SB_BASE` 覆盖（S-B testcase `:555` / `:40`；**本批 `SB_BASE` 换本批 `$BASE`**） | 常驻档只跑不变量。本批的**现值型断言**（斜杠 **13 项** / `主持人` **18 次 / 17 行** / 渲染 **30**）一律归本档（《议会轮 1》Q-3 / spec §11.9）；常驻只留「改后 = 0」那几条，清单见 SC-TC-57 |

### 0.1 现状实测值（2026-11-04，本机，逐条可复算）

> **本表的「现值」不都是常驻判据**（《议会轮 1》Q-3）：`斜杠 13 项` / `主持人 18 次 · 17 行` / `渲染 30` 这三个**现值型**数字施工后即变，只能进 `SB_SHAPE_ONESHOT=1` + `SB_BASE=<本批 $BASE>` 的一次性档（清单见 SC-TC-57）；常驻档只跑「改后 = 0」与结构不变量。反之，`CARD_MODEL_CODES 36` / `SCAN_FIELDS 8` / `VERDICTS 3` / 席数 15 这类**不随本批变化**的数字仍是常驻判据。

| 项 | 现值 | 取数（首行可复算） |
|---|---|---|
| 席数 / 席 JSON | 15 / 15 | `(Get-ChildItem tools\docgen\data\seats -Filter *.json).Count` → `15` |
| 人设词三面（**出现次数**口径，词面 = `资深` + `20 年`） | `seats 资深 22 / 20 年 2`；`agents 资深 10 / 20 年 1`；`docs/agents 资深 12 / 20 年 1` | 逐文件 `[regex]::Matches($t,'资深').Count` / `…,'20 年')` 求和。**注意面宽**：`seats` 面取**全文**（`card` 之外的外层字段 `role` 也在面内，见下一行） |
| `role`（**外层字段**，不在 `card` 内） | `senior-sdet` 的 `role` = 「资深测试开发工程师（Senior SDET）」**含 `资深`**（`tools/docgen/data/seats/senior-sdet.json:3`） | 读该席 JSON 的**顶层** `role`；`tools/docgen/test/sdet-data.test.mjs:26` 现为逐字断言同一串（含 `资深`） |
| `tool-tiers` 行号 | `S5-TC-C08` 的构造前提在 **`tools/docgen/test/tool-tiers.test.mjs:623`**（行号已按 spec §11.1 R6 校正） | `Select-String -Path tools\docgen\test\tool-tiers.test.mjs -Pattern '只审各项标准是否达到，不裁技术对错'` → 命中行 **623**（旧 action 子串，须换新文案片段） |
| `git status --porcelain` 剩余项（现盘，**本批未提交**） | **5 项**（2026-11-04 轮次 5 现测）：`docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` / `docs/handoffs/2026-11-04-s-c-card-shape.md` / `docs/superpowers/plans/2026-11-03-s-c-card-shape.md` / 本 testcase / spec | `git status --porcelain`（**stdout 取集合**，退出码不作判据；条数用 `(git status --porcelain).Count`，现值 `5`）。spec §11.14 步 1 现已覆盖 handoff（「+ 交接词 …（回退前须先提交或移出）」）→ 原 `D-8` 的 handoff 面**已消解**；plan 仍不在 spec 白名单（步 1 的 `git checkout` 覆盖面不含 `plans/`）→ 由 **SC-TC-62 ② 的白名单按六类展开为 8 项**补齐（见 §5 D-8 / SC-TC-62）；**轮次 6（CC-1）起 `SC-TC-62` 改判 `git diff --name-status $BASE`，本行的「`??` 面」只作 D-8 的构造证据与「未跟踪件不进 `git diff`」的对照，不进任何判据** |
| 斜杠串（**项**口径，四字段） | **13**（`trigger.when` 11 + `duty.action` 2）——**现值，归 `SHAPE` 一次性档**（常驻只判「改后 = 0」，SC-TC-23；现值本身由 SC-TC-57 的清单核） | 见 §0.2 |
| 斜杠串（**出现次数**口径） | 25（`when` 21 + `action` 4）——现值，**不作判据** | 同上（口径差 12：一行可含 2 个 `/`） |
| `主持人` 字面（`seats/*.json`） | **17 行 / 18 处（出现次数口径）**——现值，归 `SHAPE` 一次性档（常驻只判「字面 = 0」，SC-TC-44） | `Select-String -Path tools\docgen\data\seats\*.json -Pattern '主持人' -AllMatches` |
| `主持人` 渲染面（`agents/*.md` 全文） | **30**（12 席 × 2 + `detective-observer` 6）——现值，归 `SHAPE` 一次性档（SC-TC-46 整条进一次性档） | 逐卡 `[regex]::Matches($t,'主持人').Count`，求和 |
| `needs` / `purpose` / `method` 全树（`tools/docgen` 的 `.mjs`+`.json`，**行口径**） | `needs` 0 / `purpose` **22 行**（出现次数另计 **26**，判据不引用）/ `method` 1 行（`card-model/expression.mjs:11`） | `Select-String` 命中行数逐词求和；口径见 §0.2 口径 3 |
| `categories[].label` | 97 项 / 最长 **13** 字（`fixture 多样性核对`） | `maxLabelLen 13` |
| `ret`+`urns`（`tools/docgen/**` 的 `.mjs`/`.json`） | **3**（全在 `tools/docgen/test/sa-data-layer.test.mjs`） | 逐文件正则求和 → 合计 3（本行刻意用拼接写法，见 SC-TC-51） |
| `TRISTATE`（`tools/**/*.mjs`，**区分大小写**） | **47** 处；其中**非测试文件** = **10**（`card-contract.mjs` 3 / `cardFaceIds.mjs` 3 / `renderCard.mjs` 4）；模板 `agent-card.md.tpl` 另 1 处 | 逐文件 `[regex]::Matches($t,'TRISTATE')` 求和 |
| `VERDICT_HINT` | **0** | 同上（`VERDICT_HINT_hits 0`） |
| `hostTerm`（`shared.json`） | **0**；`shared.json` 现 3 键 | `shared_keys dutyConstraintDefault,cardRationaleHead,cardRationaleTail` |
| `trigger` 键集 | `when+route`（14 席）/ `when+route+notWhen`（`senior-sdet` 1 席） | 逐席 `trigger.PSObject.Properties.Name` |
| `写回` 在 `duty.action` | **0 / 15** | `actionWriteback 0` |
| `kind` 卡面命中 / 段数 | 0 / `15 × 7 = 105` | 渲染后正则 |
| 「一定会」段末三态行 | `TRISTATE` 五行 = **75**（15×5）；其中**孤立四行**（整行 `hit`/`miss`/`na`/`reason`）= **60**（15×4，`reviewer-audit:4/5` 形态） | 渲染后逐卡取「一定会」段，整行 `trim()` 全等判定 |
| `CARD_MODEL_CODES` / `SCAN_FIELDS` / `VERDICTS` | **36 / 8 / 3**（`hit,miss,na`） | 见 SC-TC-58 |
| `check-shared-refs` | 首行 `check-shared-refs: seats 15 / dangling 0 / nested 0 / keySet8 15 / keySet12 15 => ok`，exit 0 | `REF` |
| `gate` | `exit=0`，末行 `baseline 38/38` | `GATE` |
| `check-plan map`（**V2 的落点**） | 首行 `map: missing 0 dangling 0（cases 60 / mapped 60） => ok`，`exit 0`（2026-11-04 轮次 5 实跑） | `node scripts/check-plan.mjs map --plan docs/superpowers/plans/2026-11-03-s-c-card-shape.md`（只读脚本；这里的退出码是**脚本自身的判定结果**，不属于 §0 `COUNT` 行禁的那类「`Select-String` / `git diff` 恒真退出码」） |
| `S2-TC-C01`–`C09`（禁 id 守卫） | `tests 9 / pass 9 / fail 0` | `node --test --test-name-pattern "S2-TC-C0" tools/docgen/test/s2-card-rewrite.test.mjs` |
| `sdet-render.test.mjs` | `tests 4 / pass 4 / fail 0` | `node --test tools/docgen/test/sdet-render.test.mjs` |
| 全量测试（= `CHECK` 的 ② 段同款 glob 与 env） | `# tests 1481 / # pass 1476 / # fail 0 / # skipped 5` | `npm run check`（**作者 2026-11-04 复跑**；本轮未跑，取自 spec 头部同一行）。上一版此格记 `# fail 4`，其根因 = 本批新建的 impact-sheet 漏写 33 个口径 ID（**已由本批 impact-sheet 补全 33 个口径 ID 而消解**），非 spec 基线错误，现 `# fail 0` |
| `scope-sweep`（R8 改判回扫） | `sweep ok`（exit 0） | `node scripts/scope-sweep.mjs --check`（同上，作者复跑；清单已含 33 个口径 ID + 18 个命中文件，见 §11.9 硬约束行） |
| `check` 末行 | `check 全部通过` | `npm run check` 末行（同上；与 `# fail 0` 同一份输出） |

**轮次 4 新增三行 + 一处面宽补注**：`role` 与 `tool-tiers` 行号两行是**结构 / 位置型**（不随本批变，可作常驻判据的取数依据）；`porcelain` 剩余项是**现值**（施工后与提交流程一变即变，**只作 §5 D-8 的构造证据、以及「未跟踪件不进 `git diff`」的对照，不进常驻档**；轮次 6 起 `SC-TC-62` 不再用它，见 CC-1）；`人设词三面` 那行只补了「面宽含外层 `role`」的说明，数值未变。

**轮次 5（审计 P1 回填）的两处改动**：① `porcelain` 行由「4 项」改为**现测 5 项**（补入 `docs/superpowers/plans/2026-11-03-s-c-card-shape.md`）并写明取数命令；② 新增 `check-plan map` 一行（V2 的落点，**今日实跑** `exit 0`），供 SC-TC-55 第 ④ 步引用。数值型判据的口径未变。

### 0.2 三个**必须钉死的计数口径**（写错就假绿 / 假红）

1. **斜杠串按「项」不按「次数」**：PRD V12 原话是「四字段含 `/` 的**项** → 0（现基线 13）」。按项计 = 13（`when` 11 + `action` 2）；按出现次数计 = 25。判据一律按**项**计，否则「一处 `PRD/spec/plan` 注入」的负例只能让计数 +2，无法与「新增 1 项」区分（SC-TC-24 / SC-TC-26）。
2. **人设词按「词面」不按「整句」**：spec §11.8 V9 原词面写 `20 年经验`，本仓现状 `20 年经验` **0** 命中，而 `深耕产品设计 20 年以上` 命中 → 词面**已裁定收窄为 `资深` + `20 年`**（spec §11.8 V9 已回填；裁定来源 = §4 建议 3 被采纳；落点 SC-TC-31）。整句比对不可判（措辞会漂），故只判两个词面的出现次数之和 = 0。
3. **`purpose` 按「行」不按「次数」**：spec §11.6 首段口径 = **行**（`Select-String` 命中行数）：`needs 0` / `purpose 22 行` / `method 1 行`；按出现次数另计 `purpose 26`。**判据只引用行口径 22**，出现次数 26 仅作「同一份语料的第二种数法」，写进本表只为防止后来者拿 26 去断 22（SC-TC-42 的四个 `assert.equal` 全部用行口径）。

### 0.3 口径分叉的处置（7 条异议**全部已裁定**，未决 = 0；裁定与回填位置见 §5）

- **D-1 基线 `# fail 4`** → **已裁定**：不成立为「spec 错误」，成立为「本批自建 impact-sheet 漏口径」；补全 33 个口径 ID + 18 个命中文件后 `sweep ok`、`# fail 0`（spec §11.9 新增两条硬约束；本文 §0.1 与 SC-TC-55 已按新值改写）。
- **D-2 `主持人`「17 处」** → **已裁定**：按**出现次数**，判据两条 = 字面出现次数 0 + `${@hostTerm}` 出现次数 18（spec §11.7 ② 已改；本文 SC-TC-44 / 45；**18 与 17 均为本批现值 → 归一次性档**，Q-3）。
- **D-3 渲染总数「28」** → **已裁定**：按 **30**（12 席 × 2 + `detective-observer` 6）= 改后必须仍为 30 的等价性判据（spec §11.7 ③ / §11.10-7 已改；本文 SC-TC-46；**30 是本批现值 → 整条归一次性档**，Q-3）。
- **D-4 第二处写死名单** → **已裁定**：**加相等断言、不改 `cardPipeline.mjs:29`**（它喂 `env.parliamentSeats`，改动波及 S1 判据面）。判据形态 = 现算集合 == `complement(buildEnv(<任席>).parliamentSeats)`（spec §11.5 新增第 3 行；本文 SC-TC-38）。
- **D-5 表头判据强度** → **已裁定**：取**更严**那条 = 逐字含 `VERDICT_HINT` 派生串（spec §11.3 新脚本判据第 2 行已改；本文 SC-TC-10 / 12）。
- **D-6 `purpose` 全树数（22 vs 26）** → **已裁定**：按**行口径 22**，出现次数 26 另计且判据不引用（spec §11.6 首段已注明口径；本文 §0.2 口径 3 与 SC-TC-42）。
- **D-7 大写**插值 `${@HOST_TERM}` **静默不展开** → **已裁定**：补判据 = `@HOST_TERM` / `${@HOST_TERM}` 出现 0 **且**展开后 15 卡 `${@` 残留 0（spec §11.7 ⑤ 新增；本文 SC-TC-49（纯函数面）+ SC-TC-60（数据面 / 渲染面））。

**7 条裁定之后无未决项**：本文件 §5 的每条异议都带「已裁定 + 落点」，禁止再把任何一条当「待施工方二选一」。

### 0.4 议会轮 1 的 9 条（5 P0 + 4 P1）→ 本轮落点（未决 = 0）

> 来源：spec §11.11「议会轮 1（5 席）的 12 条卡（裁定）」表（`Q-1`…`Q-5` / `A-2` / `A-3`·`R-2` / `B-2` / `A-4`）。本轮只改**本文件**（spec 已整篇回填）。

| 卡 | 级别 | 议会轮 1 抓到什么 | 本轮处置（落点用例） |
|---|---|---|---|
| Q-1 | P0 | 原 SC-TC-47 被拿来顶 `S2-TC-B08`（`VERDICT_HINT` 副本探针）的绿态，但它探的是 `hostTerm` → `S2-TC-B08` 实际上**无用例** | **新增 SC-TC-61**：副本内把 `VERDICT_HINT` 的值**前插探针串** → 15 卡重渲必须含探针、真仓 15 卡探针 0 命中；SC-TC-47 只判 `hostTerm`（spec §11.7 ④），不再兼差 |
| Q-2 | P0 | 「删表头一值」的负例期望写成 `ok 14 / bad 1`，而 `renderCard.mjs:66` 的 `checkTable()` 是 **15 席共用函数** → 一改即全席红 | **SC-TC-11 期望改 `ok 0 / bad 15`**；同源修正 SC-TC-12 的「挪出段」也按 `ok 0 / bad 15`（同一共用函数） |
| Q-3 | P0 | 现值型断言（斜杠 13 项 / `主持人` 18 次·17 行 / 渲染 30）施工后必翻红 | **全部归 `SHAPE` 一次性档**（`SB_SHAPE_ONESHOT=1` + `SB_BASE=<本批 $BASE>`）：SC-TC-23 / 26 / 44 / 45 / 46；常驻只留「改后 = 0」；清单总表见 **SC-TC-57** |
| Q-4 | P0 | 「手写串」负例缺失（spec §11.10-2 的正面要求） | **SC-TC-12 扩为三坏形态**：删值（SC-TC-11）/ **手写串**（副本把表头换成手写 `hit / miss / na` 全串 → `bad 15`）/ 挪出段（保留） |
| Q-5 | P1 | `COPY` 取数形态未定，旧写法「`coldRepo` 内 import 副本」**不可实现** | **§0 新增 `COPY-取数` 行**：子进程只取数（`runNode` 跑副本内探针脚本）、`assert` 必须留父测试；全部 `COPY` 用例按此形态落测试 |
| A-2 | P1 | 动作行写中文三态 = 与表头英文形成第三种说法 | **SC-TC-32 扩为「英 + 中」双面**（英文 `hit`/`miss`/`na` 与中文「命中 / 未命中 / 不适用」都算），并作为 **SC-TC-27 第四件**判据 |
| A-3 / R-2 | P1 | 只判「含写回」会出「句式合格但内容空转」（占位符 / 15 席同一句） | **SC-TC-27 ②③**：`本席产物` 0 次 + 15 席产物名 ≥ 3 种；**SC-TC-28** 补两条负例（回填占位 / 全席同名） |
| B-2 | P1 | `reviewer-audit` 的 `when` 若被改，既撞 `pilot-data.test.mjs:26` 的逐字断言，又把 `occasion` 用光 | **SC-TC-33 第 ⑤ 步**：`reviewer-audit` 的 `when` **逐字** = `当议会评审需要过程标准核对、轮际对账或交付审计`（**不变量**，改的是它的 `duty.action`）；本文件内凡「改 `when`」的表述已删 |
| A-4 | P1 | 「`when` 与 kind 句式对应」靠语感判不了 | **SC-TC-33**：kind 依据**数据声明**判（不由句子形态推断），且脚本输出**附**每席 `when` 前 12 字供 `residual` 抽核 |
| B-1（spec 已列 P0） | P0 | 漏 4 处既有断言：`shared.json` 恰 3 键、`pilot-data.test.mjs` 的 `trigger` 键集、`s2-card-rewrite.test.mjs:734` 的 `F05` 探针、`when` 逐字 | **并入既有用例的回归步**（不各占一条）：键数 3→4 → **SC-TC-43**；`trigger` 键集加 `kind` → **SC-TC-33**；`F05` 探针换 `VERDICT_HINT` → **SC-TC-06**；`when` 逐字不变 → **SC-TC-33** |

### 0.5 议会**复核轮**的 3 条新发现 + 2 条残余 → 本轮落点（未决 = 0）

> 来源：spec 收尾改动（§11.4「`role` 也归人设面」/ §11.4 `rationale` 保 `${@hostTerm}` 占位 / §11.1 R6 `:623` + `sdet-data.test.mjs:26` / §11.2 #15 / §11.14 回退面清单 / §11.12 D6 延期落点实名）。本轮只改**本文件**；**条数已顶格 60**，故 5 条里只有 BB-2 + BB-3 合并成 1 条新增（SC-TC-62），其余全部**加步 / 改写扫描面**吸收。

| 项 | 复核轮抓到什么 | 本轮处置（落点用例 / 步骤） | 新增还是加步 |
|---|---|---|---|
| **BB-1** | V9 的「三面清零」只在 `data/seats/**`、`agents/*.md`、`docs/agents/*.md` 三面判；但 `role` 属 `data/seats/<seat>.json` 的**外层字段**（**不在 `card` 内**），只扫 `card.duty` / `card.rationale` 会漏；同批须改 `sdet-data.test.mjs:26` 的逐字断言 | **SC-TC-29**：① 扫描面写明「`seats` 面取全文、**含外层 `role`**」+ ③ 回归步 `node --test --test-name-pattern "TC-007" tools/docgen/test/sdet-data.test.mjs` exit 0；**SC-TC-31** 同步把扫描面写成同宽（词面边界的取数面必须与 SC-TC-29 同宽，否则两处口径分叉） | **加步**（不新增条） |
| **QA 残余** | `rationale` 改写时**必须保住全部 `${@hostTerm}` 占位**：`detective-observer.json:90` 一行内 2 处（一处引语「主持人失职」、一处句末「过渡期称谓统一为「主持人」」），漏一处 → `§11.7 ②` 的「18 次」判据到 17 | **SC-TC-30 ④⑤**：④ 只换开头人设句 → `hostRefs` 仍 **18**（与 SC-TC-44 ④ / SC-TC-45 同源、同属 `SHAPE` 一次性档）；⑤ 漏写 1 处 → `hostRefs` = **17** 必红。**SC-TC-29 / 30 的「不覆盖」各加一句「`rationale` 文采不判」** | **加步** |
| **行号残余** | `tool-tiers.test.mjs:624` → **`:623`**（spec §11.1 R6 / §11.2 #15 已更正）；正文凡引该行号须同步 | 本轮 `grep` 复核：正文引用已**全部**改为 `:623`（仅本格作为改动台账保留旧号一次），故无「改号」动作；把 `:623` 的**回归步**落到 **SC-TC-27 ⑤**（`S5-TC-C08` 的 `patchFile` 构造前提已换新 action 片段） | **加步**（无改名） |
| **BB-2** | `§11.14` 的回退复验没有任何用例断言「它真做得到」 | **新增 SC-TC-62**：② `git status --porcelain` 剩余项按**六类白名单（展开 8 项实体路径）**判——交接词 + spec + testcase + `docs/after/20261104101304-…` + **plan `docs/superpowers/plans/2026-11-03-s-c-card-shape.md`** + 施工期新增 3 件（两个新脚本 + `tools/docgen/test/sc-card-shape.test.mjs`）；**施工后剩 8 项（handoff 留盘）/ 7 项（handoff 已提交或移出）**，步 2 后剩 5 / 4 项（轮次 5 按实测 5 项 porcelain 改写，原「六项」漏 handoff 与 plan）；③ 步 2 执行后 `tools/docgen` 侧为空 | **新增 1 条**（与 BB-3 共用） |
| **BB-3** | 「D6 延期落 `docs/after/`」只是目录名，不可核 | **SC-TC-62 ⑤** 改为**实名文件** `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md`，断言「存在 + 含触发条件 + 含签字人 / 谁兜」；§5 **D-8 的 handoff 面已消解**（spec §11.14 步 1 已写「+ 交接词 …（回退前须先提交或移出）」，spec mtime 晚于本 testcase），残余只在 **plan 面**（由 SC-TC-62 ② 白名单补入） | 同上 |

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目（或 PRD V 编号） | 层级 | 类型 | 判据类型 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|
| SC-TC-01 | spec §11.3 表第 2 行（`S2-TC-A04` 改后）/ §11.1 R2（`VERDICT_HINT` = 「判定取值：」开头 + 三值中文对照 + `reason` + 两句约束）；PRD §2 D16 ① | 单元 | 正例 | 机器 | `PROBE` | P0 |
| SC-TC-02 | spec §11.3 表第 3 行（`S2-TC-A05` 改后，手写串 / 缺值两坏值）/ §11.1 R2（**已合并 SC-TC-03**：缺 `na` 坏值作第二步） | 单元 | 负例 | 机器 | `PROBE` | P0 |
| SC-TC-04 | spec §11.3 表第 1 行（`S2-TC-A01` 改后）/ §11.1 R3；PRD §2 D16 ① | 单元 | 正例 | 机器 | `PROBE` | P0 |
| SC-TC-05 | spec §11.3 表第 1 行（多一导出即红）/ §11.1 R3 | 单元 | 负例 | 机器 | `COPY` + `COPY-取数` | P0 |
| SC-TC-06 | spec §11.3 表第 4 行（`S2-TC-A10` 改后）/ §11.1 R1 R6（**已合并 SC-TC-19**：`cardFaceIds` 全文计数作第 ④ 步；并并入 `S2-TC-F05` 的 `VERDICT_HINT` 探针回归）；PRD §4 V11 ② | 单元 | 正例 | 机器 | `PROBE` | P0 |
| SC-TC-07 | spec §11.3 表第 4 行（`TRISTATE` 命中须 0）/ §11.1 R6 | 单元 | 负例 | 机器 | `COPY` + `PROBE` | P0 |
| SC-TC-08 | spec §11.3 表第 5 行（`S2-TC-D04` 改后）/ §11.1 R1 | 集成 | 正例 | 机器 | `PROBE` | P0 |
| SC-TC-09 | spec §11.3 表第 5 行（`S2-TC-D05` 改后，四行之一回填即红）/ §11.1 R1 | 集成 | 负例 | 机器 | `COPY` + `PROBE` | P0 |
| SC-TC-10 | spec §11.3 新脚本判据**第 2 行**（该行须**逐字包含 `VERDICT_HINT` 整串**）+ §11.3「**卡面恰一处**把三值称『判定取值』」/ §11.2 #8；PRD §4 V11 ② | 集成 | 正例 | 机器 | `TH`（未施行） | P0 |
| SC-TC-11 | spec §11.3 新脚本（删表头一值 → **`ok 0 / bad 15`**，`checkTable()` 是 15 席共用）/ PRD §4 V11 ② 负例 | 集成 | 负例 | 机器 | `COPY` + `TH`（未施行） | P0 |
| SC-TC-12 | spec §11.3 新脚本（**手写串**必红 `bad 15` + 表头挪出段必红 `bad 15`）/ §11.10-2；PRD §4 V11 ② | 集成 | 边界 | 机器 | `COPY` + `TH`（未施行） | P0 |
| SC-TC-13 | spec §11.3「`## 一定会` 段末 5 行全部消失」/ §11.1 R1 | 集成 | 边界 | 机器 | `PROBE` | P0 |
| SC-TC-14 | spec §11.3 表第 7 行（`sdet-render.test.mjs:21` 改后）/ §11.1 R6 | 单元 | 正例 | 机器 | `node --test` | P0 |
| SC-TC-15 | spec §11.3 表第 7 行（表头漂移即红）/ §11.1 R6 | 单元 | 负例 | 机器 | `COPY` + `node --test` | P0 |
| SC-TC-16 | spec §11.1 R5 / §11.3 「删后 `S2-TC-C01`–`C09` 逐条仍绿」 | 集成 | 正例 | 机器 | `node --test` | P0 |
| SC-TC-17 | spec §11.1 R5（三值仍在「许」集）/ §11.4 末条 | 单元 | 边界 | 机器 | `PROBE` | P0 |
| SC-TC-18 | spec §11.1 R5（层① 删除后守卫仍非空转） | 单元 | 负例 | 机器 | `PROBE` | P0 |
| SC-TC-20 | spec §11.1 R4；PRD §2 D16 ① | 单元 | 正例 | 机器 | `PROBE` | P0 |
| SC-TC-21 | spec §11.1 R4（改任一侧即红）；PRD §2 D16 ① | 单元 | 负例 | 机器 | `COPY` + `PROBE` | P0 |
| SC-TC-22 | spec §11.1 R4（`export` 形态 + `enums.mjs` 零改动） | 单元 | 边界 | 机器 | `PROBE` | P1 |
| SC-TC-23 | spec §11.1 R7（**常驻只判「改后 = 0」**；现值 13 项归 `SHAPE` 一次性档，见 SC-TC-57）；PRD §4 V12 / §2 D3 | 集成 | 正例 | 机器 | `COUNT`（常驻）+ `SHAPE`（现值） | P0 |
| SC-TC-24 | spec §11.1 R7（注入一处必红）；PRD §4 V12 负例 | 单元 | 负例 | 机器 | `COPY` + `COUNT` | P0 |
| SC-TC-25 | spec §11.1 R7（全角 `／` 同判）；PRD §4 V12 | 单元 | 边界 | 机器 | `COPY` + `COUNT` | P1 |
| SC-TC-26 | PRD §4 V12「字段路径必须钉死，扫 `entry.duty` 会恒 0 假绿」/ spec §11.1 R7（现值 13 归 `SHAPE` 一次性档；常驻判「错口径 = 0 且改后正口径 = 0」） | 单元 | 边界 | 机器 | `COUNT`（常驻）+ `SHAPE`（现值） | P0 |
| SC-TC-27 | spec §11.1 R8 ③④ + §11.4「动作行不写三态词」+ §11.1 R6 的 **`tool-tiers.test.mjs:623`** 回归（`S5-TC-C08` 的 `patchFile` 构造前提换新 action 片段，第 ⑤ 步）；PRD §2 D5 D6（**四件**：含「写回」/ 产物名非占位 / ≥3 种产物名 / 不含三态词） | 集成 | 正例 | 机器 | `PROBE` | P0 |
| SC-TC-28 | spec §11.1 R8 ③④（删一席「写回」→ 14/15；回填占位 → 红；全席同名 → 红） | 单元 | 负例 | 机器 | `COPY` + `PROBE` | P0 |
| SC-TC-29 | spec §11.1 R8 ① / §11.8 V9 / §11.4「**`role` 也归人设面**」（扫描面须含 `data/seats/<seat>.json` 的**外层 `role`**；同批改 `sdet-data.test.mjs:26`，第 ③ 步回归）；PRD §2 D2 / §4 V9 | 集成 | 正例 | 机器 | `COUNT` | P0 |
| SC-TC-30 | spec §11.1 R8 ①（回填人设一句即红）/ §11.4 末句「**改写时必须保住全部 `${@hostTerm}` 占位**」（④ 改后仍 18、⑤ 漏 1 处 → 17 必红）；PRD §4 V9 负例 | 单元 | 负例 | 机器 | `COPY` + `COUNT` | P0 |
| SC-TC-31 | spec §11.8 V9（人设词表词面）/ §0.2 口径 2（扫描面与 SC-TC-29 **同宽**：含外层 `role`）；PRD §4 V9 | 单元 | 边界 | 机器 | `COUNT` | P0 |
| SC-TC-32 | spec §11.4「动作行**不写**三态词：英文 `hit`/`miss`/`na` **与中文「命中 / 未命中 / 不适用」都不写**」/ §11.1 R8 | 单元 | 边界 | 机器 | `COPY` + `PROBE` | P1 |
| SC-TC-33 | spec §11.5 首行格式 / §11.2 #7 + spec §11.1 R9「kind 依据**数据声明**、输出附 `when` 前 12 字」+ **不变量**：`reviewer-audit` 的 `when` 逐字不动 / `pilot-data.test.mjs:25` 键集加 `kind`；PRD §3 Q5 / §4 V10 | 集成 | 正例 | 机器 | `TK`（未施行） | P0 |
| SC-TC-34 | spec §11.5「任一席值不在四值 → exit 1」；PRD §4 V10 负例 | 集成 | 负例 | 机器 | `COPY` + `TK`（未施行） | P0 |
| SC-TC-35 | spec §11.5「非议会席非 `need` → exit 1」；PRD §4 V10 负例 | 集成 | 负例 | 机器 | `COPY` + `TK`（未施行） | P0 |
| SC-TC-36 | spec §11.1 R10「名单用命令取」/ §11.5「不写死」 | 集成 | 边界 | 机器 | `COPY` + `TK`（未施行） | P0 |
| SC-TC-37 | spec §11.5「`kind` 不进 `card`、不进渲染」/ §11.1 R9 | 单元 | 边界 | 机器 | `PROBE` | P0 |
| SC-TC-38 | spec §11.5 新增第 3 行（「第二处名单要加相等断言」）：现算集合 == `complement(buildEnv(<任席>).parliamentSeats)`；§11.1 R10 | 单元 | 边界 | 机器 | `PROBE` | P0 |
| SC-TC-39 | spec §11.6「长度约束」/ §11.10-6；PRD §3 Q4 | 集成 | 正例 | 机器 | `PROBE` | P0 |
| SC-TC-40 | spec §11.6（注入 21 字 → 红）；PRD §3 Q4 负例 | 单元 | 负例 | 机器 | `COPY` + `PROBE` | P0 |
| SC-TC-41 | spec §11.6 首段「三词在卡模型键面 0 命中」；PRD §3 Q4 | 单元 | 正例 | 机器 | `PROBE` | P0 |
| SC-TC-42 | spec §11.6 首段（判据对象 = 卡模型键面，不是全树；全树取数用**行口径** `needs 0 / purpose 22 / method 1`）；PRD §3 Q4 | 单元 | 边界 | 机器 | `COUNT` | P1 |
| SC-TC-43 | spec §11.7 ①「`shared.json.hostTerm === '主持人'`」/ §11.2 #5（并含 **`shared.json` 键数 3 → 4** 的回归步，`sa-data-layer.test.mjs:47`）；PRD §3 Q1 | 单元 | 正例 | 机器 | `COUNT` | P0 |
| SC-TC-44 | spec §11.7 ②（**常驻：字面出现次数 0**；`${@hostTerm}` 出现次数 **18** 为现值 → `SHAPE` 一次性档，D-2 已裁定取次数）/ §11.1 R12；PRD §3 Q1 | 集成 | 正例 | 机器 | `COUNT`（常驻）+ `SHAPE`（现值 18） | P0 |
| SC-TC-45 | spec §11.7 ② + Q-3（行口径 17 / 次数口径 18 **均为现值 → 整条归 `SHAPE` 一次性档**；常驻不留 `= 18`）；D-2 已裁定取次数 | 集成 | 边界 | 机器 | `SHAPE` | P0 |
| SC-TC-46 | spec §11.7 ③「渲染后 15 卡总数 = **30**（12 席 × 2 + `detective-observer` 6；改后必须仍是 30）」/ §11.10-7（**现值 → 整条归 `SHAPE` 一次性档**，Q-3）；PRD §3 Q1 | 集成 | 正例 | 机器 | `SHAPE` | P0 |
| SC-TC-47 | spec §11.7 ④「内存探针 + 不落盘」/ §11.10-7 | 单元 | 边界 | 机器 | `PROBE` | P0 |
| SC-TC-48 | spec §11.7 ③（副本改常量不重生 → `Mismatch`）；PRD §4 V4 | 集成 | 负例 | 机器 | `COPY` + `GATE` | P1 |
| SC-TC-49 | spec §11.1 R12「`@HOST_TERM` 非法（键名首字符须小写）」/ §11.2 #5（纯函数面：整值抛 / 插值静默留字面）；本条只判 `expandRefs` 行为，数据面与渲染面残留归 SC-TC-60 | 单元 | 边界 | 机器 | `PROBE` | P1 |
| SC-TC-50 | spec §11.1 R11 / §11.8 V11 ①；PRD §2 D16 ④ | 集成 | 正例 | 机器 | `COUNT` | P0 |
| SC-TC-51 | spec §11.1 R11（判据实现须拼接构造该词，否则测试文件自身命中） | 单元 | 边界 | 机器 | `PROBE` | P0 |
| SC-TC-52 | spec §11.1 R11（回填键名即红）；PRD §4 V11 ① 负例 | 单元 | 负例 | 机器 | `COPY` + `COUNT` | P0 |
| SC-TC-53 | spec §11.9「`gate` exit 0 且 15 席 `disk == render`」；PRD §4 V3/V4 | e2e | 正例 | 机器 | `GATE` | P0 |
| SC-TC-54 | spec §11.9 同条（不重生即 `Mismatch`）；PRD §4 V4 负例 | e2e | 负例 | 机器 | `COPY` + `GATE` | P0 |
| SC-TC-55 | spec §11.8 V3「`# fail 0` 且 `# tests ≥ 1481 + 本批新增`」+ **§11.8 V2「plan 的 `check-plan map`：`map: missing 0 dangling 0`」**（轮次 5 按审计 P1-1 补入第 ④ 步）；PRD §4 V3 / **V2** | e2e | 正例 | 机器 | `CHECK`（`# tests` 步未施行）+ `check-plan.mjs map`（**今日实跑 exit 0**） | P0 |
| SC-TC-56 | spec §11.9「`# tests` 不得低于基线」；PRD §8「删用例凑绿 = 做坏」 | e2e | 边界 | 机器 | `COUNT`（构造） | P1 |
| SC-TC-57 | spec §11.9 末条「一次性 / 批次形态断言归 `SB_SHAPE_ONESHOT=1`」+ **本批现值断言清单（13 项 / 18 次 / 17 行 / 30 次）**；S-B testcase `:555` | e2e | 边界 | 机器 | `SHAPE` | P0 |
| SC-TC-58 | spec §11.9 前三行（7 段 / 36 码 / 8 键 / 列数 4 不动）/ §11.12 | 集成 | 边界 | 机器 | `PROBE` + `REF` | P0 |
| SC-TC-59 | spec §11.8 V1 / §11.12「`check-prd-rows.mjs` 不在本段建」 | 集成 | 边界 | 机器 | `COUNT` | P1 |
| SC-TC-60 | spec §11.7 ⑤（大写形态兜底：`seats/*.json` 内 `@HOST_TERM` / `${@HOST_TERM}` 出现 0，且展开后 15 卡 `${@` 残留 0）；§11.10-7 | 集成 | 正例 | 机器 | `PROBE` + `COUNT` | P0 |
| SC-TC-61 | spec §11.3 表第 6 行（`S2-TC-B08` 改后：`VERDICT_HINT` 副本探针 → 重渲跟随、真仓 0 命中）/ §11.10-1；**Q-1 的新增承接**（原 SC-TC-47 只判 `hostTerm`，不兼差） | 集成 | 边界 | 机器 | `COPY` + `COPY-取数` | P0 |
| SC-TC-62 | spec §11.14 步 1–4（回退复验**真做得到**：`git diff --name-status $BASE` 的 **`A` 面**按**六类新增白名单（展开 8 项实体路径）**判、其余状态面（`M` / `D` / `R…`）按**修改白名单**判（**5 前缀 + 2 实名 = 7 项**：`docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md` + **`…-s-a-data-layer-design-testcase.md`**，后者 = 轮次 7 P0-2 补入），含 **plan `docs/superpowers/plans/2026-11-03-s-c-card-shape.md`**；**不比 `??` 面计数**——与是否提交无关）+ §11.12 D6 延期落点**实名**（`docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` 存在且含触发 / 签字人）；**BB-2 + BB-3 合并承接**；轮次 5 按实测白名单改写（P1-2）、**轮次 6 改判 `diff $BASE`（CC-1）** | 集成 | 边界 | 机器 | `COUNT`（真仓**只读**取 `git diff --name-status $BASE` 的 stdout 集合）+ 静态断言（**按集合比**） | P0 |

**计数核算（现算，修订轮次 5）**：`正例` = SC-TC-01/04/06/08/10/14/16/20/23/27/29/33/39/41/43/44/46/50/53/55/**60** → **21**；`负例` = SC-TC-02/05/07/09/11/15/18/21/24/28/30/34/35/40/48/52/54 → **17**；`边界` = SC-TC-12/13/17/22/25/26/31/32/36/37/38/42/45/47/49/51/56/57/58/59/**61**/**62** → **22**。合计 **60 ≤ 60（硬上限，已顶格）**，且「负 + 边 = 39 ≥ 正 = 21」成立。**轮次 4 只新增 1 条**（SC-TC-62，BB-2 + BB-3 合并在同一条的多步里）；BB-1（`role`）、QA 残余（`${@hostTerm}` 占位）、`tool-tiers:623` 三条全部**加步 / 改写扫描面**吸收，未新增条目。**轮次 5 未新增任何条目**：P1-1 并进 SC-TC-55 第 ④ 步、P1-2 改写 SC-TC-62 ② 的白名单与 §0.1 现状行、P1-3 只改 §5 D-8 的裁定，三值仍为 **正 21 / 负 17 / 边 22 = 60**。**轮次 6（CC-1）未新增任何条目**：只把 SC-TC-62 ②③ 的判据形态由「`??` 面恰 N 项必现」改判为「`git diff --name-status $BASE` 的 `A` 面 ⊆ 六类新增白名单 + 其余状态面 ⊆ 修改白名单」，三值仍为 **正 21 / 负 17 / 边 22 = 60**。**轮次 7（P0-2）未新增任何条目**：只把 SC-TC-62 的 **M-面白名单**由「5 前缀 + 1 实名」补成「**5 前缀 + 2 实名 = 7 项**」（补 `docs/superpowers/specs/2026-11-03-s-a-data-layer-design-testcase.md`）+ 加一条「M-面逐行比对（plan File Structure 24 行 → 21 已跟踪 / 3 新建）」+ 补一组「漏一个已跟踪的改动路径 → 红」的红态，三值仍为 **正 21 / 负 17 / 边 22 = 60**。**轮次 3 已合并**：SC-TC-03 → SC-TC-02（缺 `na` 坏值作第二步）、SC-TC-19 → SC-TC-06（`cardFaceIds` 全文计数作第 ④ 步）；判别力与负例内容都保留在多步里，未删。

## 2 用例明细

> **全节 `COPY` 用例的取数形态统一**（Q-5 / spec §11.9 末条，唯一权威 = §0 的 `COPY-取数` 行）：父测试在副本里写**只打印观测值**的探针脚本 → `runNode([<副本相对路径>], <副本>)` 子进程取数 → **父测试自己 `assert`**。下文凡写「副本内跑 X → exit 非 0」的，均按此改写成「子进程只打印 + 父测试断言」；**子进程退出码只作旁证**（它只说明探针脚本没崩）。**禁止**父测试 `import('<副本>/…')` 副本内模块（副本路径不在 ESM 解析面，且模板 / 契约 import 时即固化 → 同进程改副本后重渲恒绿，`card-fixtures.mjs:27`）。

### SC-TC-01 `VERDICT_HINT` 以「判定取值：」开头、含三值中文对照、含 `reason` 与两句约束

- **覆盖**：spec §11.3 表第 2 行（`S2-TC-A04` 改后）/ §11.1 R2（值 = 「判定取值：」+ 派生三值 + 中文对照 + 「缺 reason = 废卡」+「na 还须写明为何不适用」）；PRD §2 D16 ① ⑤
- **前置**：`card-contract.mjs` 已删 `TRISTATE`、新增 `VERDICT_HINT`（施工态）。`VERDICTS` 仍 3 值（`enums.mjs:47` 零改动）
- **步骤**：① `PROBE` 取 `CC.VERDICT_HINT`（字符串）与 `ENUMS.VERDICTS`；② 断言 `hint.startsWith('判定取值：')`（R2 要求的主语，不能只判三值）；③ 按 `Object.keys(VERDICTS)` 的**顺序**逐个断言其值在 `hint` 中出现（派生构造，不写字面数组），且每个值后紧跟中文对照（`命中` / `未命中` / `不适用`，同样按派生顺序）；④ 断言 `hint.includes('reason')` **且** `hint.includes('缺 reason = 废卡')` **且** `hint.includes('na 还须写明为何不适用')`（后两句是议会轮 1 的 A-1 补回的约束，丢了 AI 读者就不知道后果）；⑤ 断言 `typeof hint === 'string'`（**不得**是数组——数组可被就地改，正是 `S2-TC-B08` 原形态；字符串形态的探针见 SC-TC-61）
- **预期**：② ③ ④ ⑤ 全真；`hint` 的派生段逐字 = `hit（命中）、miss（未命中）、na（不适用）`（分隔符与顿号形状由施工期定稿，本用例只判「三值按序 + 中文对照在位」）
- **判据**：`node --test --test-name-pattern "SC-TC-01" tools/docgen/test/sc-card-shape.test.mjs` **exit 0**（四组 `assert` 各扣一次仍可分别抛）
- **红绿证据**：**未施行（施工后核）**——本机 `VERDICT_HINT` 命中 **0**（`VERDICT_HINT_hits 0`），此刻跑该断言是 `undefined.startsWith` 抛 TypeError，属「未施工」而非「判红」。施工后绿态 = 断言全过；红态 = 值退化成手写串 / 缺「判定取值：」主语 / 丢两句约束（构造见 SC-TC-02）
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-01`
- **不覆盖**：`VERDICT_HINT` 的**逐字措辞**（只判四个子串在位，不判整句与 §11.3 逐字一致——那属文档措辞，落 §11.10「只手动验证」的邻域）；表头拼接（SC-TC-14）；「恰一处称判定取值」（SC-TC-10 第 ④ 步）

### SC-TC-02 手写三值串（顺序反 / 缺 `na` / 错字）喂给断言函数必须抛（已合并 SC-TC-03）

- **覆盖**：spec §11.3 表第 3 行（`S2-TC-A05` 改后）；PRD §2 D16 ①。**已合并 SC-TC-03**（原「缺一值（缺 `na`）必抛」——同一条断言函数的第二个坏值，判别力不减）
- **前置**：SC-TC-01 已绿（断言函数已存在）
- **步骤**：① `PROBE` 构造坏值 `['miss / hit / na', 'hit / na / miss', 'hit / miss / n']`（顺序反、`na` 缺、错字）；② 另按**派生构造**再造一个缺 `na` 的坏值（`取 Object.keys(VERDICTS) 去掉 na 后拼成 'hit / miss'`，不写字面数组）；③ 四个坏值逐个喂给同一断言函数（与 SC-TC-01 同一实现，不另写第二份）；④ 断言四个**各自** `assert.throws`
- **预期**：四个坏值全部抛；不允许「只有一个抛」——那样说明断言只判「含三词」而非「派生顺序 + 中文对照 + 两句约束」；缺 `na` 那条必须由「派生串不等于前缀」触发，**不得**靠字面黑名单触发
- **判据**：`node --test --test-name-pattern "SC-TC-02" …` **exit 0**；若任一坏值不抛 → `assert.throws` 自身抛 `Missing expected exception` → exit 1
- **红绿证据**：**未施行（施工后核）**——现无 `VERDICT_HINT`；施工后红态 = 断言函数退化为 `hint.includes('hit')` 之类的弱判（此时候选坏值 `'hit / miss / n'` 会不抛）
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-02`
- **不覆盖**：`VERDICT_HINT` 全串是否与 §11.3 中文句逐字相同（同上，属措辞）；多一个值（`pass`）的形态（归 `S2-TC-A06`/`A07` 的邻域，S-C 未改该断言）；`duty.action` 里的三态词（SC-TC-32）

### SC-TC-04 `card-contract.mjs` 导出面**恰等**四名（多一 / 少一 / 改名即红）

- **覆盖**：spec §11.3 表第 1 行（`S2-TC-A01` 改后）/ §11.1 R3；PRD §2 D16 ①
- **前置**：施工后 `TRISTATE` 已删、`VERDICT_HINT` 已加
- **步骤**：① `PROBE` 取 `Object.keys(CC).sort()`；② `assert.deepEqual(..., ['ALLOWED_PRODUCT_NAMES','FORMAT_CHECKS','TYPE_LABELS','VERDICT_HINT'])`；③ 断言四名的**类型**（前三个数组 / 第四字符串）；④ 断言第四导出的**值形态**：以「判定取值：」开头、含三值中文对照、含 `reason`（整串判据归 SC-TC-01，此处只防「加了个同名常量但值是空串 / 旧三值串」）
- **预期**：导出名集合逐字相等且长度 = 4；④ 三项全真
- **判据**：`node --test --test-name-pattern "SC-TC-04" …` **exit 0**
- **红绿证据**：**未施行（施工后核）**——现盘导出名为 `ALLOWED_PRODUCT_NAMES / FORMAT_CHECKS / TRISTATE / TYPE_LABELS`（`card-contract.mjs:16-35`），改后断言对现盘必红（`TRISTATE` vs `VERDICT_HINT` 不等）。这就是「施工前红、施工后绿」的**方向证据**：断言不是恒真
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-04`
- **不覆盖**：导出项的内部值（分别由 SC-TC-01 / `S2-TC-A02` / `A06` 判）

### SC-TC-05 副本多导出一个（`TRISTATE` 回填）→ 断言必红

- **覆盖**：spec §11.3 表第 1 行（多一即红）/ §11.1 R3
- **前置**：SC-TC-04 的断言已落进测试文件；副本取数按 §0 的 `COPY-取数` 形态
- **步骤**：① `COPY`（`withRepoCopy`）内给 `card-contract.mjs` 末尾追加 `export const TRISTATE = []`；② 父测试在**副本内**写探针脚本（打印 `Object.keys(CC).sort()` 的 JSON），`runNode([<副本相对路径>], <副本>)` 子进程跑它（**只取数**）；③ 父测试对自己读到的 stdout 做 `assert.deepEqual`（与 SC-TC-04 同形断言），断言不等且长度 = 5
- **预期**：副本内导出名长度 5、集合与四名不等 → `deepEqual` 抛；**父测试的 `assert` 必须自己抛**（不能只看子进程退出码——子进程只负责打印）
- **判据**：`node --test --test-name-pattern "SC-TC-05" …` **exit 0**（断言抛即失败）；真仓不得就地注入
- **红绿证据**：**未施行（施工后核，依赖 SC-TC-04 断言）**；构造有效性可在现盘先证：现盘 `TRISTATE` 在位使 `S2-TC-A01` 今天为绿（`card-contract.mjs:16`），即该断言对「多一个」确有判别力
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-05`
- **不覆盖**：改名（`VERDICT_HINT` → `TRISTATE`）的形态——同一 `deepEqual` 已覆盖，不单列

### SC-TC-06 `export const VERDICT_HINT` 定义恰 1 处，且 `tools/` 内 `TRISTATE` 命中 0（已合并 SC-TC-19，并入 `S2-TC-F05` 探针回归）

- **覆盖**：spec §11.3 表第 4 行（`S2-TC-A10` 改后）/ §11.1 R1 R6 / §11.2 #4；PRD §4 V11 ②。**已合并 SC-TC-19**：原「`cardFaceIds.mjs` 内 `TRISTATE` / `tristate` 命中 0」作第 ④ 步（同一判据的逐文件面，判别力不减）；另并入 **`S2-TC-F05`（`s2-card-rewrite.test.mjs:734`）的探针回归**：该处 `CC.TRISTATE[0]` 已换 `VERDICT_HINT`（字符串，不做就地改），作第 ⑤ 步
- **前置**：施工后 `renderCard.mjs` / `cardFaceIds.mjs` / 模板三处的 `TRISTATE` 引用已全删（spec §11.2 #2 #3 #4）
- **步骤**：① `PROBE` 用 `countDefIn` 同形（行首 `^export const VERDICT_HINT`，跳过 `*.test.mjs`）数定义数；② 断言 = 1；③ 断言 `walkFiles('tools').filter(.mjs&&!.test.mjs)` 里 `TRISTATE` 子串命中 = 0；④ 取 `tools/docgen/components/cardFaceIds.mjs` 全文，断言 `TRISTATE` 与 `tristate`（层① 的局部变量名）各 0 命；⑤ `node --test --test-name-pattern "S2-TC-F05" tools/docgen/test/s2-card-rewrite.test.mjs` **exit 0**，且该用例源码已不含 `CC.TRISTATE`、只含 `VERDICT_HINT`
- **预期**：① 1；③ 0；④ 两个词各 0；⑤ exit 0 且源码里 `TRISTATE` 0 命
- **判据**：`node --test --test-name-pattern "SC-TC-06" …` **exit 0**（①–④ 各扣一次）；⑤ 单跑 **exit 0**
- **红绿证据**：现盘实测（区分大小写）：`TRISTATE` 非测试面 **10** 处（`card-contract.mjs` 3 / `cardFaceIds.mjs` 3 / `renderCard.mjs` 4），加测试文件 37 处合计 47 → ③ 今天必红；④ 现盘 `cardFaceIds.mjs` 命中 **3**（`:6` 注释 / `:14` import / `:65` 使用）→ 今天红；⑤ 现盘 `s2-card-rewrite.test.mjs:734` 仍是 `CC.TRISTATE[0]` → 今天红。施工后三者归 0 / 换成 `VERDICT_HINT` 即绿。**未施行（施工后核）**——理由：① 需 `VERDICT_HINT` 存在才不抛 TypeError；⑤ 需 `s2-card-rewrite.test.mjs:734` 同批改写后才绿
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-06` + 既有 `tools/docgen/test/s2-card-rewrite.test.mjs::S2-TC-F05`（同批改写）
- **不覆盖**：`TRISTATE` 在 `docs/**` 的残留（spec §11.1 R6 的扫描面是 `tools/`；文档残留由 §11.13「就地加注」管）；`renderCard.mjs` 侧的 `tristate()` 删除由 ③ 的全仓 0 兜

### SC-TC-07 副本把 `TRISTATE` 定义回填 1 处 → 定义数 2 / 命中 ≥1 必红

- **覆盖**：spec §11.3 表第 4 行（`TRISTATE` 须 0）/ §11.1 R6
- **前置**：SC-TC-06 断言已落
- **步骤**：① `COPY` 内新建 `tools/docgen/components/tristate-copy.mjs` 写 `export const TRISTATE = ['x'];`（与 `S2-TC-A10:169` 同构）；② 副本内跑 SC-TC-06 同形断言；③ 断言抛
- **预期**：副本内定义数 = 2、`TRISTATE` 命中 ≥1 → 两条各抛
- **判据**：副本内 `PROBE` **exit 非 0**；真仓不得就地写文件
- **红绿证据**：**未施行（施工后核）**；构造有效性可先证：现盘 `S2-TC-A10:169-173` 就是同一构造，今天绿（因为真仓定义数 1）
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-07`
- **不覆盖**：`VERDICT_HINT` 定义 0 处（少一）——同一 `assert.equal(defs,1)` 覆盖

### SC-TC-08 15 卡「一定会」段末**不得**出现孤立的 `hit` / `miss` / `na` / `reason` 任一行

- **覆盖**：spec §11.3 表第 5 行（`S2-TC-D04` 改后）/ §11.1 R1
- **前置**：15 卡已用 `draft` + `replace --yes` 重生成（spec §11.9「两步写盘」）
- **步骤**：① `PROBE` 逐席取 `agents/<seat>.md` 的「一定会」段；② 段末非空行集合里筛「整行 trim 后**全等**四词之一」的行；③ 断言该集合为空（15 席合计 0）
- **预期**：0 行；段末只剩 bullet 行与模板两行 `>` 引语（spec §11.3 末句）
- **判据**：`node --test --test-name-pattern "SC-TC-08" …` **exit 0**；若把「含某词」当命中（`.includes`）会因正文引用而假红，故断言**必须**用整行 `trim() ===` 全等
- **红绿证据**：现盘实测「一定会」段末**孤立四行** = **60** 行（15×4，逐席 `4/5`）、`TRISTATE` 五行合计 **75** 行（15×5）→ 今天该断言必红；施工后孤立四行归 0 即绿。**未施行（施工后核）**（重生成未发生）
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-08`
- **不覆盖**：段内行数是否恰好减少 5（SC-TC-13）；表头三值（SC-TC-10）

### SC-TC-09 副本把一行 `hit` 放回「一定会」段末 → 必红

- **覆盖**：spec §11.3 表第 5 行（`S2-TC-D05` 改后）；PRD §2 D16 ③
- **前置**：SC-TC-08 断言已落；`COPY` 内副本可改 `agents/<seat>.md`
- **步骤**：① `COPY` 内在某卡「一定会」段末追加一行 `hit`；② 副本内跑 SC-TC-08 同形断言；③ 断言抛并点名该席
- **预期**：命中 1 行、席名可定位
- **判据**：副本内 `PROBE` **exit 非 0**
- **红绿证据**：**未施行（施工后核）**；构造有效性今天可证：现盘每卡「一定会」段末确有孤立 `hit` / `miss` / `na` / `reason`（合计 **60** 行，逐席 `4/5`），故「追加一行 → 必红」与「不追加 → 绿」两侧都被现盘形态印证
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-09`
- **不覆盖**：换序（`hit`/`miss` 互换）——S-C 后不再有这 5 行，换序形态已不存在对象

### SC-TC-10 `check-tristate-header` 绿态：首行固定格式、15 席 `ok 15 / bad 0`，表头**逐字含 `VERDICT_HINT`**，且**卡面恰一处**称「判定取值」

- **覆盖**：spec §11.3「新脚本 `check-tristate-header.mjs`」**判据第 2 行**（「该行须逐字包含 `VERDICT_HINT`」+ spec §11.3 末条「**卡面恰一处**把三值称『判定取值』」，D-5 已裁定取更严的这条）/ §11.2 #8；PRD §4 V11 ②
- **前置**：脚本已建；输入 = `renderSeat(seat).card`（**内存**，不扫整卡，spec §11.3 明写理由）；15 席已重生成
- **步骤**：① `TH`；② 用正则校验首行 `^check-tristate-header: seats 15 / ok 15 / bad 0 => ok$`；③ 逐席在内存里定位 `## 本席清单` 段首个 `|` 行，断言它**逐字包含** `VERDICT_HINT`（整串 `includes(hint)` 为真；只判「含三键」会被手写串骗过）；④ **恰一处**「判定取值」：逐卡数全文 `判定取值` 出现次数，断言 **15 卡 × 恰 1 = 15**，且 `产物字段名只许：hit / miss / na / reason / evidence / verdict` 那行**不含**「判定取值」（那行是「允许出现的名字」枚举，不是第二处取值声明）
- **预期**：① exit 0；② 首行逐字匹配；③ 15/15 含 `VERDICT_HINT`；④ 合计 15 且列举行 0 命
- **判据**：`TH` **exit 0** 且 ② 正则命中（计数形态 `COUNT`：不匹配即 exit 1）；③④ 由 `PROBE` 断言
- **红绿证据**：**未施行（施工后核）**——`check-tristate-header.mjs` 现不存在（`Test-Path` = False）。此刻跑是 `MODULE_NOT_FOUND`（非 0，但那是「没脚本」不是「判红」）；④ 现盘 `判定取值` 命中 **0**（旧表头是 `| # | 条目 | 判据 | 类型 |`）→ 今天红，施工后 15 即绿。红态判别力由 SC-TC-11 / SC-TC-12 承担（删值 / 手写串 / 挪出段 → 必红）
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-10`
- **不覆盖**：`VERDICT_HINT` 的措辞（SC-TC-01）；段末 5 行（SC-TC-08）；「产物字段名只许」行本身的枚举正确性（归 `S2-TC-*` 既有）

### SC-TC-11 副本删表头的一个值（`na`）→ **`ok 0 / bad 15`** 必红

- **覆盖**：spec §11.3 新脚本 / PRD §4 V11 ② 负例。**Q-2 的修正**：`renderCard.mjs:66` 的 `checkTable(card)` 是**15 席共用的同一个渲染函数**，改它的表头 = 15 张卡同时缺该值，故期望是 `ok 0 / bad 15`（原写 `ok 14 / bad 1` 是把「共用函数」误当「单席数据」）
- **前置**：SC-TC-10 已绿；`COPY` 内可改 `renderCard.mjs` 的 `checkTable()` 表头
- **步骤**：① 副本内把 `checkTable()` 表头里的 `VERDICT_HINT` 拼接改成不含 `na` 的串（构造 = `Object.keys(VERDICTS).filter(k=>k!=='na')`）；② 子进程在副本内跑 `TH`，打印首行（只取数）；③ 父测试断言该首行 = `check-tristate-header: seats 15 / ok 0 / bad 15 => fail` 形态（`bad 15` 而非 `bad 1`）
- **预期**：`ok 0`、`bad 15`
- **判据**：父测试 `assert.match(<首行>, /ok 0 \/ bad 15 => fail/)` + 子进程 exit 1 作旁证
- **红绿证据**：**未施行（施工后核）**——`check-tristate-header.mjs` 现不存在；构造有效性由 `renderCard.mjs:66` 的函数签名（`checkTable(card)` 被 15 席逐席调用，表头行在 `:69` 硬写）现盘可证
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-11`
- **不覆盖**：全 15 席都缺（`0/15`）——那正是本例的期望形态，不再单列

### SC-TC-12 换手写串 / 挪出段 → 全席必红（不得整卡扫描而恒绿）

- **覆盖**：spec §11.3 新脚本（「定位 `## 本席清单` 段 → 取首个 `|` 行」）/ §11.10-2「删值 / **换手写串** / 挪出段三种坏形态都必红」；PRD §4 V11 ② 原话「不得全文件扫」。**Q-4 的补出**：原版只有「挪出段」，缺 spec §11.10-2 点名的「手写串」
- **前置**：SC-TC-10 已绿
- **步骤**：① `COPY` 内把 `checkTable()` 的表头 `VERDICT_HINT` **换成人手写的三值全串**（形如 `| # | 条目 | 判据（hit / miss / na） | 类型 |`，三值写全、顺序正确，但**不是** `VERDICT_HINT` 派生值）→ 子进程跑 `TH` 打印首行；② 父测试断言首行 `ok 0 / bad 15 => fail`（手写串**必须**红，否则「逐字含 `VERDICT_HINT`」这条判据就退化成了「含三键」）；③ 另在**另一个副本**里把表头行移到「## 职责」段之后（仍在卡内、但不在「本席清单」段）→ 子进程跑 `TH`；④ 父测试断言同样 `ok 0 / bad 15 => fail`，且脚本**没有**因整卡别处仍有三值字样而放行（卡内 `产物字段名只许：…` 那行即现成反例，`renderCard.mjs:98`）
- **预期**：② 手写串 → `bad 15`；④ 挪出段 → `bad 15`（两次都是 15，因为表头来自 15 席共用的 `checkTable()`）
- **判据**：父测试两次 `assert.match(<首行>, /ok 0 \/ bad 15 => fail/)`；子进程 exit 1 仅作旁证
- **红绿证据**：**未施行（施工后核）**；构造有效性现盘可证：`renderCard.mjs:98` 的 `productNames()` 行恒含三值 → 若脚本改成整卡扫描，两种坏形态都会 15/15 恒绿（这正是 PRD 点名的失败形态）
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-12`
- **不覆盖**：表头三值顺序（已由 SC-TC-02 在断言层判）；删值形态（SC-TC-11）

### SC-TC-13 「`## 一定会`」段末 5 行消失，但段数与七段结构不变

- **覆盖**：spec §11.3「段末 5 行全部消失」/ §11.9 第 1 行（7 段结构不动）；PRD §2 D16 ③
- **前置**：15 卡已重生成
- **步骤**：① `PROBE` 逐席数「一定会」段的非空行数；② 与 `BASE`（`SC_BASE` = 本批改前提交）的同段行数比，差 = **恰 5**；③ 断言每卡 `^## ` 段数 = 7（15 卡合计 105）
- **预期**：② 逐席 `after = before − 5`；③ 105
- **判据**：`node --test --test-name-pattern "SC-TC-13" …` **exit 0**（差 != 5 或段数 != 7 即抛）
- **红绿证据**：现盘段数实测 **105**（15×7，§0.1 的 `segments_total 105`）→ ③ 今天已可跑（绿）。② 需 `SC_BASE`（未施工 → **未施行（施工后核）**）；现盘「一定会」段末 `TRISTATE` 五行 = 75 行（5 行/席）即 before 值，改后应 0 → 差恰 5/席
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-13`
- **不覆盖**：七段**名字**不变（`CARD_SEGMENTS` 既有断言 `S2-TC-*` 兜，见 SC-TC-58）

### SC-TC-14 `sdet-render.test.mjs` 的表头断言与 `renderCard` 实际表头逐字一致

- **覆盖**：spec §11.3 表第 7 行（`sdet-render.test.mjs:21` 改后）/ §11.1 R6
- **前置**：`sdet-render.test.mjs:21` 已改写为「`| # | 条目 | 判据（` + `VERDICTS` 派生串 + `） | 类型 |`」（不写字面三值）
- **步骤**：① `node --test tools/docgen/test/sdet-render.test.mjs`；② 断言 exit 0；③ `PROBE` 断言该断言源码里**不含**三值字面（只引用派生）
- **预期**：① 4 tests / 4 pass / 0 fail（现盘实测同值）；③ 字面命中 0
- **判据**：`node --test tools/docgen/test/sdet-render.test.mjs` **exit 0** + `PROBE` exit 0
- **红绿证据**：现盘实测 `tests 4 / pass 4 / fail 0`（§0.1）——**今天绿**是因为第 21 行断的是现盘字面 `| # | 条目 | 判据 | 类型 |`；施工后该行不改就会红（表头会变成含派生的形态），故本用例的绿态**只有在改写后**才成立 → 改写动作本身：**未施行（施工后核）**
- **对应测试**：`tools/docgen/test/sdet-render.test.mjs`（既有文件，逐字断言行）+ `tools/docgen/test/sc-card-shape.test.mjs::SC-TC-14`（③）
- **不覆盖**：`senior-sdet` 卡其余 9 行（既有 4 条已覆盖）

### SC-TC-15 副本让表头多一个空格 → 该逐字断言必红

- **覆盖**：spec §11.3 表第 7 行（表头漂移即红）
- **前置**：SC-TC-14 的改写已落
- **步骤**：① `COPY` 内把 `renderCard.mjs` 的 `checkTable()` 表头 `| ` 后加一个空格；② 副本内跑 `sdet-render.test.mjs`；③ 断言 exit 非 0
- **预期**：逐字断言抛、退出码非 0
- **判据**：副本内 `node --test tools/docgen/test/sdet-render.test.mjs` **exit 非 0**（`assert.notEqual(code,0)`）
- **红绿证据**：**未施行（施工后核）**；构造有效性：现盘该断言是 `assert.ok(r.includes('| # | 条目 | 判据 | 类型 |'))`（`sdet-render.test.mjs:21`），加空格必然不命中 → 判别力现成
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-15`
- **不覆盖**：卡面其余段（同 SC-TC-14）

### SC-TC-16 删层① 后 `S2-TC-C01`–`C09` 逐条仍绿（9/9）

- **覆盖**：spec §11.1 R5「删后 `S2-TC-C01`–`C09` 逐条仍绿」/ §11.3 R5 列；PRD §2 D16
- **前置**：`cardFaceIds.mjs` 已删层①（`TRISTATE` import + 逐行豁免，spec §11.2 #4）
- **步骤**：① `node --test --test-name-pattern "S2-TC-C0" tools/docgen/test/s2-card-rewrite.test.mjs`；② 断言 `9 pass / 0 fail`
- **预期**：9 条全绿（三值已由 `ALLOWED_PRODUCT_NAMES` 的「许」集承担，`card-contract.mjs:23-28`）
- **判据**：上述命令 **exit 0**，且 stdout 含 `ℹ pass 9` / `ℹ fail 0`（用正则取数后比较，不用命令退出码以外的信号）
- **红绿证据**：**现盘已实跑** → `tests 9 / pass 9 / fail 0`（施工前同一命令同结果；说明删除层① 不会把 C 组拖红——但本用例的绿**含义**在施工后才成立：删前绿是靠层①，删后绿是靠许集）
- **对应测试**：`tools/docgen/test/s2-card-rewrite.test.mjs`（既有，不改）
- **不覆盖**：层① 删除本身（**SC-TC-06 第 ④ 步**的源码断言；原 SC-TC-19 已并入）；`C10` 之外的新守卫（不在本段）

### SC-TC-17 层① 删除后，含三态的 `duty.action` 仍 0 命中（三值在「许」集）

- **覆盖**：spec §11.1 R5（「三值已在 `ALLOWED_PRODUCT_NAMES` 的『许』集里」）/ §11.4 末条
- **前置**：`ALLOWED_PRODUCT_NAMES` 仍含 `Object.values(VERDICTS)`（`card-contract.mjs:24`，零改动）
- **步骤**：① `PROBE` 把某席 `duty.action` 临时改写成 `产物字段名 hit / miss / na / reason`（内存，不写盘）；② 跑 `cardFaceIds(card, env)`；③ 断言返回 `[]`
- **预期**：`[]`（三值 + reason 均在许集）
- **判据**：`node --test --test-name-pattern "SC-TC-17" …` **exit 0**（`assert.deepEqual(hits, [])`）
- **红绿证据**：**现盘已可跑且应绿**（`S2-TC-C07:328-330` 已用同形句子证明只含许名不误红）；删层① 后同断言仍绿。**未施行（施工后核：需在删层① 后复跑一次）**
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-17`
- **不覆盖**：许集本身是否该扩充（属 §11.1 R3 的边界，不在 S-C）

### SC-TC-18 删层① 后守卫仍非空转：未登记 token 必红

- **覆盖**：spec §11.1 R5（删层不能把守卫弄成空转）
- **前置**：同 SC-TC-17
- **步骤**：① `PROBE` 把 `duty.action` 改成含 `foo.bar`（点分未登记 id）；② `cardFaceIds` 必须返回含 `foo.bar` 的数组
- **预期**：命中 ≥1 且命中项 = `foo.bar`
- **判据**：`node --test --test-name-pattern "SC-TC-18" …` **exit 0**
- **红绿证据**：**现盘已可跑且应绿**（`S2-TC-C07:331-334` 同形）；删层① 后复跑 → **未施行（施工后核）**
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-18`
- **不覆盖**：五类 id 各塞 1 个（`S2-TC-C02` 既有）

### ~~SC-TC-19~~（已并入 SC-TC-06 第 ④ 步）

原用例「`cardFaceIds.mjs` 内 `TRISTATE` 命中 0（层① 彻底删除）」的步骤与判据**逐条并入 SC-TC-06 第 ④ 步**（同一判据的逐文件面）：现盘 `cardFaceIds.mjs` 命中 **3**（`:6` 注释 / `:14` import / `:65` 使用）、`tristate` 局部变量名（`:65` / `:71`）同判；施工后两词各 0。**合并理由**：与 SC-TC-06 的第 ③ 步（`tools/` 非测试面 `TRISTATE` 全仓 0）同一个判据，只是取数面更窄；单列会让两条用例在同一个洞上重复计分。判别力未减——第 ④ 步仍然是「副本里回填一处 → 红」的现盘证据面（构造由 SC-TC-07 承担）。

### SC-TC-20 跨包三值相等：`observation-check` 的 `Set` 与 `enums.VERDICTS` 逐字相等

- **覆盖**：spec §11.1 R4；PRD §2 D16 ①（「属跨包重复，须加一条相等断言」）
- **前置**：`tools/observation-check/checks.mjs:6` 的 `VERDICTS` 已改 `export`
- **步骤**：① `PROBE` import 两侧；② `assert.deepEqual([...CHECK_VERDICTS].sort(), Object.keys(ENUMS.VERDICTS).sort())`；③ 断言两侧长度均 3
- **预期**：逐字相等（同为 `['hit','miss','na']` 排序后）
- **判据**：`node --test --test-name-pattern "SC-TC-20" …` **exit 0**
- **红绿证据**：**未施行（施工后核）**——现盘 `checks.mjs:6` 是 `const VERDICTS = new Set([...])`（**未 export**，`checks.mjs:6` 原文 `const VERDICTS = new Set(['hit', 'miss', 'na']);`）→ import 侧取到 `undefined`，此刻跑是「取不到」而非「判红」
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-20`
- **不覆盖**：判定面本身（`miss`/`na` 必带 reason 的 ⑥ 段行为归 `tools/observation-check` 既有测试）

### SC-TC-21 副本改一侧（增 `pass`）→ 相等断言必红

- **覆盖**：spec §11.1 R4「改任一侧 → 红」
- **前置**：SC-TC-20 已绿
- **步骤**：① `COPY` 内把 `checks.mjs` 的 `Set` 加 `'pass'`；② 副本内跑 SC-TC-20 同形断言；③ 断言抛
- **预期**：长度 4 vs 3 → `deepEqual` 抛
- **判据**：副本内 `PROBE` **exit 非 0**
- **红绿证据**：**未施行（施工后核）**
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-21`
- **不覆盖**：改 `enums.mjs` 一侧（`enums` 零改动由 SC-TC-22 的「3 值」与 `S2-TC-A10:166` 兜）

### SC-TC-22 `checks.mjs` 的三值仍 3 个且确为 `export`（不得就地改 enums 凑相等）

- **覆盖**：spec §11.1 R4（「`enums.mjs` 零改动」）/ §11.9 第 3 行
- **前置**：施工完成
- **步骤**：① `PROBE` 断言 `Object.keys(ENUMS.VERDICTS).length === 3`；② 断言 `checks.mjs` 源码含 `export const VERDICTS` 行（行首声明）；③ 断言该行右侧仍是 `new Set` 形态（不是数组 → 保持原语义）
- **预期**：① 3；② 1 行；③ 是
- **判据**：`node --test --test-name-pattern "SC-TC-22" …` **exit 0**
- **红绿证据**：现盘实测 `verdicts hit,miss,na`（3 值，§0.1）；② 现盘 0 行（`checks.mjs:6` 无 `export`）→ 今天红；③ 现盘是 `new Set` 形态。**未施行（施工后核）**
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-22`
- **不覆盖**：相等性（SC-TC-20）

### SC-TC-23 四字段斜杠串清零（项口径）：**常驻 = 改后 0**（现值 13 归一次性档）

- **覆盖**：spec §11.1 R7 / §11.4 改法表 / §11.9 末条（**现值型断言归 `SB_SHAPE_ONESHOT=1`**）；PRD §4 V12 / §2 D3；议会轮 1 的 Q-3
- **前置**：15 席数据已改文案（`PRD/spec/plan` → `PRD、spec、plan`，`H5/小程序/Electron` → 顿号）
- **步骤**：① 装配后（`agentData`）逐席取 `card.duty.trigger` / `duty.action` / `duty.constraint` / `categories[].label` 四字段；② 逐字段判 `/[/／]/`；③ **常驻档**断言计数 = 0（改后必须是 0，不随基线变）；④ **一次性档**（`SB_SHAPE_ONESHOT=1` + `SB_BASE=<本批 $BASE>`）另记改前 13 项，用于 SC-TC-57 的现值清单核对——常驻档**不**断言 13
- **预期**：③ 0（常驻）；④ 改前 13（一次性档，仅登记不改判）
- **判据**：`$c = <逐席逐字段 `-match '[/／]'` 计数>; if ($c -ne 0) { Write-Host "slash-items $c"; exit 1 }; exit 0`
- **红绿证据**：现盘实测 **13**（`when 11 + action 2`，§0.1）→ 今天红（今天红的值属改前基线，施工后 0 即绿）；**未施行（施工后核）**
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-23`
- **不覆盖**：全角 `／` 单列（SC-TC-25）；口径判别力（SC-TC-26）；现值 13 本身的判据（SC-TC-57 ⑤ 登记）

### SC-TC-24 副本注入一处 `a/b` → 计数 1 必红

- **覆盖**：spec §11.4「改法只有一种 = 改文案」/ §11.10-3（「13 → 0 的同一命令在改后仍能判红」）；PRD §4 V12 负例
- **前置**：SC-TC-23 已绿
- **步骤**：① `COPY` 内把某席 `duty.action` 结尾追加 `（PRD/spec）`；② 副本内跑 SC-TC-23 同形计数；③ 断言 = 1
- **预期**：1（**不是 2**——按项计，一行两个 `/` 仍算 1 项）
- **判据**：副本内 `COUNT` 形态 **exit 1** 且打印 `slash-items 1`
- **红绿证据**：**未施行（施工后核）**；构造有效性：现盘 13 项中确有 `reviewer-frontend` 的 action 1 项、`evidence-reader` 的 action 1 项（§0.1 的逐席清单）
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-24`
- **不覆盖**：注入 2 项（同上判据，不重复）

### SC-TC-25 全角 `／` 同判（注入 `PRD／spec` → 红）

- **覆盖**：spec §11.1 R7（「`/` 与 `／` 计数 0」）；PRD §4 V12
- **前置**：SC-TC-23 已绿
- **步骤**：① `COPY` 内把某席 label 改成含全角 `／`；② 副本内跑计数；③ 断言 ≥1
- **预期**：≥1（若判据只写半角 `/` 则漏检 → 假绿）
- **判据**：副本内 `COUNT` 形态 **exit 1**
- **红绿证据**：**未施行（施工后核）**（需拷贝注入）。判据实现上易漏的半角写法可在现盘先验：`cardFaceIds.mjs:19` 的 `FACE_SPLIT = /[/／\s、，,]+/` 就是本仓既有的「半角 + 全角」写法，可直接复用该字符类
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-25`
- **不覆盖**：半角形态（SC-TC-24）

### SC-TC-26 口径判别力：扫 `entry.duty` 容器 = 0（假绿）vs 扫四字段 = 13（**现值 13 归一次性档**）

- **覆盖**：PRD §4 V12 原话「字段路径必须钉死，扫 `entry.duty` 会恒 0 假绿」/ spec §11.1 R7 + §11.9 末条（**现值型断言归 `SB_SHAPE_ONESHOT=1`**）；议会轮 1 的 Q-3
- **前置**：**常驻档**只跑「错口径 = 0」；「正口径 = 13」需 `SB_SHAPE_ONESHOT=1` + `SB_BASE=<本批 $BASE>`
- **步骤**：① 用「把 `String(entry.duty)` 强制串化后正则」的**错口径**计数 → 断言 0（常驻）；② 用四字段**正口径**计数，**在一次性档**断言改前 `$BASE` 侧 = 13、改后侧 = 0；③ 断言「错口径恒 0」与「正口径有值」两值在 `$BASE` 侧不相等
- **预期**：① 0（常驻）；② 改前 13 / 改后 0（一次性档）——两值不等即证明「错口径恒 0 假绿」
- **判据**：常驻 `PROBE` 断言 `wrong === 0`；一次性档断言 `rightBefore === 13 && rightAfter === 0`；`node --test --test-name-pattern "SC-TC-26" …` **exit 0**
- **红绿证据**：**现盘已实跑**：正口径 13（`whenItems 11 actItems 2 total 13`，即 `$BASE` 侧值）；错口径 `[object Object]` 无 `/` → 0（常驻侧今天已绿）。改后侧 `rightAfter = 0` **未施行（施工后核）**
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-26`
- **不覆盖**：`agentData` 与 `seats/*.json` 两面（PRD 说 D17 后两面都须 0；本用例只判装后面，原始面由 SC-TC-23 的同构命令对 `seats/*.json` 复跑一次即可，落测试时两处都断）

### SC-TC-27 `duty.action` 四件齐：含「写回」/ 产物名非占位 / 15 席产物名 ≥ 3 种 / 不含三态词

- **覆盖**：spec §11.1 R8 ③④ + §11.4「动作行**不写三态词**」+ §11.1 R6 的「`tool-tiers.test.mjs:**623**（`S5-TC-C08` 的 `patchFile` 拿旧 action 子串当构造前提 → 换新文案片段）」；PRD §2 D5 D6。**四件成组**（议会轮 1 的 R-2 / A-2 / A-3 回填：只判「含写回」会出「句式合格但内容空转」的卡）。**复核轮的「行号残余」**：正文引该行号一律 `:623`（旧号只在 §0.5 的改动台账里保留一次），并以第 ⑤ 步把该处回归钉住
- **前置**：15 席 `duty.action` 已重写为「对⟨对象⟩做⟨动作⟩，逐条给出判定与理由，结论写回⟨本席产物名⟩」；`tool-tiers.test.mjs:623` 的构造前提已同批换成新 action 片段
- **步骤**：① 逐席取装配后 `card.duty.action`，判是否含 `写回`，计数命中席数；② 取每席「写回」之后的产物名片段（到句末 / 标点止），断言占位串 `本席产物` 全 15 席 **0 次**（`本席产物` 是模板占位，不是产物名）；③ 收集 15 个产物名，断言不同值 **≥ 3 种**（`new Set(names).size >= 3`）；④ 逐席断言 action 内不含任何三态词：英文按 `Object.keys(VERDICTS)` **派生**取值（不写字面数组），中文按 `命中` / `未命中` / `不适用` 三个词面（**英文与中文都不许写**——三值只在表头声明一处）；⑤ **R6 连带改写回归**：`node --test --test-name-pattern "S5-TC-C08" tools/docgen/test/tool-tiers.test.mjs` **exit 0**，且该用例源码 `:623` 的 `patchFile` 实参**不含**旧 action 子串 `只审各项标准是否达到，不裁技术对错`（已换成新文案片段）——不改则该构造打不到漂移点、`replace` 先撞幂等短路 → 该用例红
- **预期**：① 15/15；② 0；③ ≥ 3；④ 0 席命中；⑤ exit 0 且旧子串 0 命中
- **判据**：`$c = <① 命中席数>; if ($c -ne 15) { Write-Host "writeback $c/15"; exit 1 }; <②③④ 各一条 assert>; <⑤ exit 0 + 旧子串计数 0>; exit 0`（落测试 = 五条 `assert`，各扣一次）
- **红绿证据**：现盘实测 **0/15**（`actionWriteback 0`）→ ① 今天红；②③ 今天不可判（产物名还不存在，施工后才有对象）；④ 现盘 15 席无三态词（本段未加过）→ ④ 今天绿、防回退；⑤ **现盘可核**：`tool-tiers.test.mjs:623` 的 `patchFile` 实参正是旧 action 子串（`Select-String` 命中行 **623**；旧记录的行号差 1 行，已按 spec R6 校正）→ 该用例今天绿，**施工后若不同批换片段即红**。**未施行（施工后核）**
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-27` + 既有 `tools/docgen/test/tool-tiers.test.mjs::S5-TC-C08`（同批改写构造前提）
- **不覆盖**：句式「对…做…」是否真的切题（属 `residual`，spec §11.10「只手动验证」）；产物名是否「语义贴切」（只判非占位 + 种类数）；`tool-tiers.test.mjs` 其余用例（S5 其余归 S5 既有覆盖）

### SC-TC-28 副本三坏形态必红：删「写回」/ 回填占位 / 全席同名

- **覆盖**：spec §11.1 R8 ③④（「每席 `action` 含『写回』15/15」+ 占位 0 + ≥3 种）；议会轮 1 的 A-3 / R-2
- **前置**：SC-TC-27 已绿
- **步骤**：① `COPY` 内把某席 `duty.action` 的「写回」改为「写到」→ 子进程取数打印命中席数，父测试断言 = 14（判据是「= 15」，少一席即红）；② 另一个副本里把某席产物名换成占位 `本席产物` → 父测试断言 `本席产物` 命中 ≥ 1（红）；③ 另一个副本里把 15 席产物名统一成同一个名 → 父测试断言不同值 = 1（< 3 → 红）
- **预期**：① 14 → 红；② ≥ 1 → 红；③ 1 → 红
- **判据**：三处父测试 `assert` 各扣一次（`node --test --test-name-pattern "SC-TC-28" …` **exit 0`）；子进程 exit 码仅作旁证
- **红绿证据**：**未施行（施工后核）**；构造有效性可先证：现盘 15 席 action 里 `写回` **0** 次、产物名 0 个 → 三个坏值都能被造出来，但「绿态」只有在重写后才存在，故整条属施工后核
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-28`
- **不覆盖**：同义替换是否算通过（「写回」是**最小可判形态**，spec 明写语义切题性归 `residual`）；动作行三态词的负例（SC-TC-32）

### SC-TC-29 人设词三面清零：`seats/**`（**含外层 `role`**）/ `agents/*.md` / `docs/agents/*.md`（词面 = `资深` + `20 年`，口径 = 出现次数）

- **覆盖**：spec §11.1 R8 ① / §11.8 V9（词面**已裁定**为 `资深` + `20 年`，口径 = 出现次数）/ §11.4「`rationale` 同批删人设句」/ §11.4「**`role` 也归人设面**」（议会复核轮 **BB-1**：`senior-sdet` 的 `role` = 「资深测试开发工程师（Senior SDET）」须去 `资深` 前缀，并同批改 `sdet-data.test.mjs:26`）；PRD §2 D2 / §4 V9
- **前置**：15 席数据与 15 卡、16 份 `docs/agents` 均已重生成（spec §11.5）；`sdet-data.test.mjs:26` 的 `role` 逐字断言已同批去掉 `资深`
- **步骤**：① **扫描面（BB-1 的要点）**：`data/seats/**` 面取**文件全文**——`role` 是 `data/seats/<seat>.json` 的**外层字段**（**不在 `card` 内**；实测 `senior-sdet.json:3`，`card` 里没有它），只扫 `card.duty` / `card.rationale` 会把它漏成「三面清净」；另两面 = `agents/*.md` / `docs/agents/*.md` 全文。三面 × 两词按**出现次数**数（词面见 §0.2 口径 2）；② 逐面 × 逐词断言 0；③ **回归步（BB-1 同批改）**：`node --test --test-name-pattern "TC-007" tools/docgen/test/sdet-data.test.mjs` **exit 0**——该用例 `:26` 的 `assert.equal(e.role, …)` 已去掉 `资深`（保留括号里的级别名 `（Senior SDET）`），**未同批改则恒红**；④ **连带约束（QA 残余）**：删人设句**不得连带删** `${@hostTerm}` 占位——`SHAPE` 档断言 `seats/*.json` 的 `${@hostTerm}` 出现次数仍 **18**（取数与 SC-TC-44 ④ 同源；正负两式的完整写法见 SC-TC-30 ④⑤）
- **预期**：三面 × 两词 全 0（改前基线：`seats 资深 22 / 20 年 2`；`agents 资深 10 / 20 年 1`；`docs/agents 资深 12 / 20 年 1`，见 §0.1；`seats` 的 22 里**含 `role` 的 1 处**）；③ exit 0；④ 18
- **判据**：`$c = <三面 × 两词的合计出现次数>; if ($c -ne 0) { Write-Host "persona $c"; exit 1 }; exit 0` + ③ `node --test --test-name-pattern "TC-007" tools/docgen/test/sdet-data.test.mjs` **exit 0** + ④ `SHAPE` 档 `assert.equal(hostRefs, 18)`
- **红绿证据**：现盘三面实测 `资深 22 / 10 / 12`、`20 年 2 / 1 / 1`（§0.1）→ 今天必红；③ 现盘 `sdet-data.test.mjs:26` 逐字断言**含 `资深`**、且 `senior-sdet.json:3` 的 `role` 同串 → 今天绿（因为盘上也含 `资深`），**去前缀后不同批改该断言即红**——这正是 BB-1 的可判形态。施工后 0 + ③ 绿 + ④ 18。**未施行（施工后核）**
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-29` + 既有 `tools/docgen/test/sdet-data.test.mjs::TC-007`（同批改写 `role` 逐字断言）
- **不覆盖**：别的套话词（词表外的一律不判，spec 只钉这两个词面）；`role` 的措辞是否切题（只判两词面 0）；`rationale` 的**文采 / 措辞切题性**（机械判不了，spec §11.10「只手动验证」邻域；本用例只判人设词 0 与 `${@hostTerm}` 占位保全）

### SC-TC-30 副本回填一句人设 → 三面之一命中 ≥1 必红；且改 `rationale` 不得弄丢 `${@hostTerm}` 占位（④ 仍 18 / ⑤ 漏 1 处 → 17 必红）

- **覆盖**：spec §11.1 R8 ①「人设词 0」/ §11.4 末段（`rationale` 也删，因为 `docs/agents/<seat>.md` 会投影它，`renderReadme.mjs:22`）/ §11.4 末段末句「**改写时必须保住全部 `${@hostTerm}` 占位**：`detective-observer.json:90` 一行内有 2 处（一处引语、一处句末），`§11.7 ②` 的『18 次』判据会抓漏」（**复核轮 QA 残余**）
- **前置**：SC-TC-29 已绿；`detective-observer.json:90` 的 `rationale` 现含 2 处字面 `主持人`（一处引语「主持人失职」、一处句末「过渡期称谓统一为「主持人」」），改后须各为 `${@hostTerm}`
- **步骤**：① `COPY` 内只改某一席 `card.rationale` 的**开头一句**为「资深审阅者……」；② 副本内跑 SC-TC-29 同形计数；③ 断言 `agents` 面仍 0、`docs/agents` 面（重生成后）≥1；④ **占位保全（正）**：副本内把 `detective-observer` 的 `rationale` **开头人设句换掉但不动其 `${@hostTerm}`**，子进程取数打印 `seats/*.json` 的 `${@hostTerm}` 出现次数，父测试断言仍 = **18**（`SHAPE` 一次性档，与 SC-TC-44 ④ / SC-TC-45 同源）；⑤ **占位保全（负）**：另一个副本里把 `detective-observer.json:90` 的**一处** `${@hostTerm}` 写成字面 `主持人`（模拟「改写时顺手把引语里的占位换回中文」）→ 父测试断言出现次数 = **17**，即 §11.7 ② 的「18 次」判据必红
- **预期**：`docs/agents` 面 ≥1 → ③ 整体红；④ 18；⑤ 17 → 红（差 1 正是 §11.4 末句点名要抓的「漏一处」）
- **判据**：副本内 `COUNT` 形态 **exit 1**（③）+ ④ 父测试 `assert.equal(hostRefs, 18)` + ⑤ 父测试 `assert.equal(hostRefs, 17)`（构造侧；子进程 exit 码仅作旁证，按 §0 `COPY-取数`）
- **红绿证据**：**未施行（施工后核）**；构造依据可核：`renderReadme.mjs:22` 逐字投影 `card.rationale` → 只改数据不改卡面也能让 `docs/agents` 面红（这正是 D2「不只管卡面」的可判形态）；④⑤ 的取数面今天可核——`Select-String tools\docgen\data\seats\*.json -Pattern '主持人' -AllMatches` 合计 **18 次**、其中 `detective-observer.json:90` 一行 **2 处**（§0.1）→ 「换掉开头句不动占位 = 仍 18」「弄丢一处 = 17」两侧都被现盘形态印证
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-30`
- **不覆盖**：`rationale` 后半段结构化记录（spec §11.4 明写「保留」，删它会撞既有结构断言，不在本用例）；`rationale` 的**文采 / 措辞切题性**（机械判不了，spec §11.10「只手动验证」邻域）

### SC-TC-31 人设词面边界：`20 年经验` 漏检 `20 年以上`（词面已裁定取 `20 年`）

- **覆盖**：spec §11.8 V9 词表词面（**已回填为 `资深` + `20 年`**）/ §0.2 口径 2 / **§11.4「`role` 也归人设面」**（扫描面必须与 SC-TC-29 **同宽**：`data/seats/**` 取全文、**含 `card` 之外的外层 `role`**）；PRD §4 V9
- **前置**：无（现盘即可跑）
- **步骤**：① 按出现次数分别数 `20 年经验` 与 `20 年`（三面合计；`seats` 面**取全文含外层 `role`**，另两面 = `agents/*.md` / `docs/agents/*.md` 全文——面宽与 SC-TC-29 第 ① 步逐字一致，否则两处口径分叉）；② **记录**现盘取值 `20 年经验 0` / `20 年 4`（`seats 2` + `agents 1` + `docs/agents 1`）作改前基线，**不作通过条件**；③ 判据只认「两者都 = 0」（施工后绿、施工前因 b = 4 而红）
- **预期**：现盘 `20 年经验 0 / 20 年 4`；若判据只写 `20 年经验`，`深耕产品设计 20 年以上`（`reviewer-product.json:9` 的 `action`、`:120` 的 `rationale`）会漏检 → 假绿。词面已由 spec §11.8 V9 回填为 `20 年`，本用例即该裁定的可判形态
- **判据**：`$a = <'20 年经验' 出现次数>; $b = <'20 年' 出现次数>; if ($a -ne 0) { Write-Host "p-a $a"; exit 1 }; if ($b -ne 0) { Write-Host "p-b $b"; exit 1 }; exit 0`（两句合并即「旧词面 0 + 新词面 0」）
- **红绿证据**：**现盘已实跑**：`twentyYears 0` / `erShiNian 2`（`seats` 面）；三面合计 `20 年` = 4（§0.1）→ 现盘 b 项必红（施工前），a 项恒绿（旧词面本就不存在）
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-31`
- **不覆盖**：更长的人设句（「有十年以上经验的…」）——它不含这两个词面，判据不追（由 `duty.action` 全量重写覆盖）

### SC-TC-32 动作行**不写三态词**：英文 `hit`/`miss`/`na` 与中文「命中 / 未命中 / 不适用」都不许（注入即红）

- **覆盖**：spec §11.4「动作行**不写三态词**（英文或中文都不写）——三值只在表头声明一处」/ §11.1 R8；议会轮 1 的 A-2
- **前置**：施工完成（15 席 action 重写）
- **步骤**：① 逐席断言 `duty.action` 不含**英文**三值（用 `Object.keys(VERDICTS)` 派生取值，不写字面数组）；② 逐席断言不含**中文**三态（`命中` / `未命中` / `不适用` 三个词面，用常量数组 `['命中','未命中','不适用']` 遍历）；③ `COPY` 内某席 action 尾部注入英文 `hit` → 父测试断言命中 ≥ 1（红）；④ 另一个副本注入中文「命中」→ 父测试断言命中 ≥ 1（红）
- **预期**：①② 0 席命中；③④ 注入后各 ≥ 1（**中文形态也必须红**，否则「只写英文黑名单」会漏掉第三种说法）
- **判据**：`node --test --test-name-pattern "SC-TC-32" …` **exit 0**（四条 `assert` 各扣一次）
- **红绿证据**：**未施行（施工后核，①② 需重写后的数据）**；判别力现盘可证：`cardFaceIds` 的「许」集含三值（SC-TC-17），故注入 `hit` **不会**被禁 id 守卫拦——只能靠本用例这条 action 面断言拦，两者互补；中文形态的漏检风险同理（禁 id 守卫不认识中文三态）
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-32`
- **不覆盖**：中文三态在**表头**里的出现（那是 `VERDICT_HINT` 的法定位置，SC-TC-01 / 10）；同类词的其它措辞（如「通过 / 不适用」）不在 spec 词面内

### SC-TC-33 `check-trigger-kind` 绿态：四值全用上、计数恰 `{dispatch:11,occasion:1,moment:1,need:2}`，输出附 `when` 前 12 字，`reviewer-audit` 的 `when` 逐字不动

- **覆盖**：spec §11.5 首行固定格式 + §11.1 R9「kind **依据数据声明**，不由句子形态推断；输出附每席 `when` 前 12 字供 `residual` 抽核」+ **不变量**：`reviewer-audit` 的 `when` **一字不动**（§11.5 D4 处置）/ §11.2 #7 / R6 的 `pilot-data.test.mjs:25` 键集回归；PRD §3 Q5 / §4 V10；议会轮 1 的 A-4 / B-2 / B-1
- **前置**：`check-trigger-kind.mjs` 已建；15 席 `triggerTable[<seat>].kind` 已落（**数据侧**，不进 `card.duty`、不进卡面）
- **步骤**：① `TK`；② 首行正则 `^check-trigger-kind: seats 15 / kinds \{dispatch:11,occasion:1,moment:1,need:2\} / bad 0 => ok$`；③ 逐席断言 `kind ∈ {dispatch,occasion,moment,need}`（**判 kind 看数据声明，不看 `when` 的句式**）；④ 断言 stdout **附** 15 席各自 `when` 的前 12 字（每席一行可定位，供 `residual` 抽核 3 席贴切度）；⑤ **不变量**：读 `seats/reviewer-audit.json` 的 `trigger.when`，断言**逐字** = `当议会评审需要过程标准核对、轮际对账或交付审计`（`reviewer-audit` 的 `when` 一字不动，改的是它的 `duty.action`），并跑 `node --test --test-name-pattern "triggerTable reviewer-audit" tools/docgen/test/pilot-data.test.mjs` **exit 0**（该处键集断言已加 `kind`、`when` 逐字断言未改）
- **预期**：① exit 0；② 正则命中；③ 15/15 在四值内；④ 15 行 `when` 前 12 字齐；⑤ 逐字相等且该既有用例绿
- **判据**：`TK` **exit 0** 且 ② 正则命中；④⑤ 由 `PROBE` 断言 + 既有用例 exit 0
- **红绿证据**：**未施行（施工后核）**——脚本现不存在（`Test-Path tools\docgen\check-trigger-kind.mjs` = False）；现状 `trigger` 键集 = `when+route`（14 席）/ `when+route+notWhen`（1 席）→ `kind` 字段 0 席；⑤ 的「逐字」现盘可核：`pilot-data.test.mjs:26` 就是这句原文（今天绿，施工后必须仍绿——它是本段的**不变量**，不是待改项）
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-33` + 既有 `tools/docgen/test/pilot-data.test.mjs:23-28`（键集断言加 `kind`，`when` 逐字断言不动）
- **不覆盖**：`kind` 的「分得最合理」（spec §11.10「不测」明写，抽核归 `residual`）；`when` 与 kind 的**句式对应**（spec R9 明写「不由句子形态推断」）

### SC-TC-34 副本某席写第五个 kind → `TK` 红态首行 `=> fail`

- **覆盖**：spec §11.5「任一席值不在四值 → 红态首行 `=> fail` + exit 1」；PRD §4 V10 负例
- **前置**：SC-TC-33 已绿
- **步骤**：① `COPY` 内把某席 `kind` 改成 `when`（四值之外）；② 子进程在副本内跑 `TK`，打印首行（只取数）；③ 父测试断言首行匹配 `=> fail` 且含 `ok <k> / bad <n>`（`n ≥ 1`），并断言输出点名该 `seat` + 实际值
- **预期**：首行 `check-trigger-kind: seats 15 / kinds {...} / ok <k> / bad <n> => fail`（`n ≥ 1`），席名可定位
- **判据**：父测试 `assert.match(<首行>, /=> fail/)` + `assert.match(<输出>, /<seat>/)`；子进程 exit 1 作旁证
- **红绿证据**：**未施行（施工后核）**
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-34`
- **不覆盖**：空值 / 缺字段（同判据，spec 未单列）

### SC-TC-35 副本把非议会席写成 `dispatch` → `TK` 红态首行 `=> fail`

- **覆盖**：spec §11.5「非议会席非 `need` → 红态首行 `=> fail` + exit 1」；PRD §4 V10 负例
- **前置**：SC-TC-33 已绿
- **步骤**：① `COPY` 内把 `senior-sdet` 的 `kind` 改成 `dispatch`；② 子进程在副本内跑 `TK`，打印首行；③ 父测试断言首行含 `=> fail` 且席名 `senior-sdet` 出现在输出里
- **预期**：`=> fail`，`bad ≥ 1`
- **判据**：父测试 `assert.match(<首行>, /=> fail/)`；子进程 exit 1 作旁证
- **红绿证据**：**未施行（施工后核）**
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-35`
- **不覆盖**：`evidence-reader` 的同一形态（同判据，不重复）

### SC-TC-36 名单现算：新增第 16 席（前缀非 `reviewer-`/`detective-`）写 `dispatch` → `TK` exit 1

- **覆盖**：spec §11.1 R10「名单用命令取，写死名单 = 第 16 席出现时静默漏检」/ §11.5「不写死」
- **前置**：SC-TC-33 已绿
- **步骤**：① `COPY` 内新增 `tools/docgen/data/seats/reviewer-observer.json` 之外的**非议会席**（如 `archivist`），并在 `SEAT_ORDER` 与 `seats/` 同批加；② 给它 `kind = dispatch`；③ 子进程跑 `TK` 打印首行
- **预期**：`seats 16` 且该席进 `bad` → 首行 `=> fail`
- **判据**：父测试断言首行含 `seats 16` 与 `=> fail`；子进程 exit 1 作旁证
- **红绿证据**：**未施行（施工后核）**；同时注意：新增席会先撞 `check-shared-refs` 的 `keySet8/12` 与 `gate`，故本用例的前置要同步造齐（否则红因错误码无关 → 构造无效）。**风险登记**：若脚本写死两席名单，本例会假绿——这正是本用例存在的理由
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-36`
- **不覆盖**：现算名单的实现方式（`Get-ChildItem` 还是 `SEAT_ORDER` 过滤，spec 只要求「不写死」）

### SC-TC-37 `kind` 不进 `card`、不进渲染（8 键不动 + 卡面 `kind` 命中 0）

- **覆盖**：spec §11.5「`kind` 不进 `card`（8 键不动）、不进渲染」/ §11.1 R9
- **前置**：施工完成
- **步骤**：① `PROBE` 断言每席席文件 `card` 键集仍 8 键（无 `kind`）；② 断言 15 卡渲染全文 `kind` 命中 0；③ 断言 `triggerTable[seat]` 上**有** `kind`
- **预期**：① 8 键；② 0；③ 有
- **判据**：`node --test --test-name-pattern "SC-TC-37" …` **exit 0**
- **红绿证据**：**现盘已实跑两项**：② `kind_hits 0`（§0.1）；① `REF` 首行 `keySet8 15`（8 键 15 席，现盘已成立且本段不动它）。③ **未施行（施工后核）**
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-37`
- **不覆盖**：`kind` 的中文判据文本（住脚本内，由 SC-TC-33 的首行格式间接兜）

### SC-TC-38 非议会席现算集合 **==** `complement(buildEnv(<任席>).parliamentSeats)`（第二处名单的相等断言）

- **覆盖**：spec §11.5 **新增第 3 行**（「第二处名单要加相等断言」）/ §11.1 R10；本条即 §5 D-4 的可判形态（不裁「该改哪一处」，只强制两处不得漂移）
- **前置**：无（现盘可跑）
- **步骤**：① 现算集合 = 席名不以 `reviewer-` / `detective-` 开头的席（与 `check-trigger-kind` 同一取法）；② 断言长度 2、逐字 = `['evidence-reader','senior-sdet']`；③ **相等断言**：`assert.deepEqual([...现算].sort(), complement(buildEnv(<任席>).parliamentSeats).sort())`——`complement` = 15 席全集中减去 `parliamentSeats` 后剩下的席
- **预期**：① 2；② 逐字相等；③ 两侧集合逐字相等（`cardPipeline.mjs:29` 的写死名单 `NON_PARL_SEATS` 与现算结果**暂未漂移**）
- **判据**：`node --test --test-name-pattern "SC-TC-38" …` **exit 0**（三条 `assert.deepEqual` 各扣一次；③ 是 spec 新增的那条，缺它本用例不算覆盖 D-4）
- **红绿证据**：**现盘可跑**：现算得 2 席（`evidence-reader` / `senior-sdet`），`cardPipeline.mjs:29` 写死同一对 → ③ 今天绿（说明两份暂未漂移）。判别力：一旦出现第 16 席（前缀非 `reviewer-`/`detective-`），现算集合会 +1 而写死名单不变 → ③ 必红（这正是本条存在的理由；`TK` 那侧因现算会自动跟随，只有本条能抓到分叉）
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-38`
- **不覆盖**：`TK` 内部的现算实现（SC-TC-36）；`cardPipeline.mjs:29` 是否该被删（spec §11.5 明写本段**不改**它）

### SC-TC-39 `categories[].label` 每项 ≤ 20 字（97 项，现最长 13）

- **覆盖**：spec §11.6「长度约束」/ §11.10-6；PRD §3 Q4
- **前置**：15 席 `categories` 保持现有条数（4–9 条，spec §11.6 明写不套 5 条上限）
- **步骤**：① 逐席逐项取 `label` 的 `.Length`；② 断言 `max ≤ 20` 且总项数 = 97（条数不变）
- **预期**：97 项、max 13
- **判据**：`node --test --test-name-pattern "SC-TC-39" …` **exit 0**（`assert.ok(max <= 20)` + `assert.equal(count, 97)`）
- **红绿证据**：**现盘已实跑**：`labelItems 97 maxLabelLen 13`（§0.1）→ 本用例现盘即绿，且绿是「有内容」的绿（97 项非空）
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-39`
- **不覆盖**：`checkItems[].label` 与 `checkItems[].criterion` 的长度（Q4 只点名 `categories` 这一现存同类槽）

### SC-TC-40 副本注入 21 字 label → 必红

- **覆盖**：spec §11.6 / §11.10-6「注入 21 字 → 红」；PRD §3 Q4 负例
- **前置**：SC-TC-39 已绿
- **步骤**：① `COPY` 内把某席首个 label 改成 21 个汉字（用 `'核'.repeat(21)` 构造，避免手数）；② 跑 SC-TC-39 同形断言；③ 断言抛且打印 `21`
- **预期**：max = 21 → 抛
- **判据**：副本内 `PROBE` **exit 非 0**
- **红绿证据**：**未施行（施工后核）**；构造有效性：`'核'.repeat(21).length` 在 .NET / JS 均为 21（汉字为单码位），不依赖字面手数
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-40`
- **不覆盖**：恰好 20 字（边界内侧，判据 `<= 20` 自然覆盖，不另造用例）

### SC-TC-41 三词槽在**卡模型键面**0 命中（`needs` / `purpose` / `method`）

- **覆盖**：spec §11.6 首段「判据落『三词在卡模型键面 0 命中』」；PRD §3 Q4
- **前置**：施工完成（本段不产生数据改动，判据只防将来新增）
- **步骤**：① 取 15 席席文件的 `card` 键集 ∪ `card.duty` 键集（∪ `CARD_KEYS`）；② 断言三词命中 0
- **预期**：0（现盘键集 = `action,categories,checkItems,constraint,duty,must,never,rationale,scenes,signals,trigger`）
- **判据**：`node --test --test-name-pattern "SC-TC-41" …` **exit 0`（`assert.equal(hits, 0)`）
- **红绿证据**：**现盘已实跑**：`badSlots 0`（§0.1 的 `cardModelKeys` 列表里无三词）→ 今天绿；施工不改数据，故施工后仍绿（**这是「防将来」型判据：绿是常态，红只在有人新加槽时出现**）
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-41`
- **不覆盖**：`needs` 槽「删除」动作（槽本不存在，无删除可判）

### SC-TC-42 口径判别力：全树 `purpose` **22 行**（出现次数 26）/ `method` 1 行，扫全树即假红

- **覆盖**：spec §11.6 首段（判据对象 = **卡模型键面**，不是全树；全树取数口径 = **行**，D-6 已裁定）/ PRD §3 Q4
- **前置**：无（现盘可跑）
- **步骤**：① 全树（`tools/docgen` 的 `.mjs`+`.json`，`Select-String` **命中行数**口径）数 `purpose` / `method` / `needs`；② 断言全树**行数** = `22 / 1 / 0`（现盘）；③ 断言卡模型键面 = 0
- **预期**：两组数不等 → 证明「全树口径会把命令组字段算成命中」（`policy/definitions/commands.mjs` **9 行** + `test/policy-pure-source.test.mjs` **13 行** = 22；`method` 1 行在 `card-model/expression.mjs:11`）。出现次数口径另计 `purpose 26`（**判据不引用**，见 §0.2 口径 3）
- **判据**：`node --test --test-name-pattern "SC-TC-42" …` **exit 0**（四个 `assert.equal`，全部用行口径：`22 / 1 / 0` + 卡模型键面 `0`）
- **红绿证据**：**现盘已实跑**：`needs 0 purpose 22 method 1`（行口径；逐文件 `expression.mjs method=1` / `commands.mjs purpose=9` / `policy-pure-source.test.mjs purpose=13`）；出现次数同语料另计 26，仅作口径对照
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-42`
- **不覆盖**：三词在 `docs/**` 的出现（不在判据面）

### SC-TC-43 `shared.json.hostTerm === '主持人'`（唯一写死处），且 `shared.json` 键数 3 → 4

- **覆盖**：spec §11.7 ① / §11.2 #5 / §11.1 R12 + **R6 的 `sa-data-layer.test.mjs:47` 回归步**（该处断言 `shared.json` 恰 3 键，加 `hostTerm` 后必须同批改成 4 键，否则 `# fail ≥1`）；PRD §3 Q1；议会轮 1 的 B-1
- **前置**：`data/shared.json` 已加 `"hostTerm": "主持人"`
- **步骤**：① 读 `shared.json`；② 断言 `hostTerm` 键存在且值**逐字** `主持人`；③ 断言该字面在 `shared.json` 内**恰 1 处**（防止同文件出现第二份）；④ 断言键数 = **4**，且键集 = 原 3 键（`cardRationaleHead` / `cardRationaleTail` / `dutyConstraintDefault`）+ `hostTerm`；⑤ `node --test --test-name-pattern "TC-001" tools/docgen/test/sa-data-layer.test.mjs` **exit 0**（`sa-data-layer.test.mjs:47` 的键数断言已同批改为 4）
- **预期**：② 相等；③ 1；④ 4 且键集逐字相等；⑤ exit 0
- **判据**：`$c = (Select-String -Path tools\docgen\data\shared.json -Pattern '主持人' -AllMatches | ForEach-Object { $_.Matches.Count } | Measure-Object -Sum).Sum; if ($c -ne 1) { Write-Host "shared-host $c"; exit 1 }; exit 0`
- **红绿证据**：现盘 `hostTerm` 命中 **0**、`shared.json` 3 键（§0.1）→ 今天红；施工后键数 4 且 `主持人` 恰 1 处。**未施行（施工后核）**
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-43`
- **不覆盖**：`shared.json` 别的键（本段不动）

### SC-TC-44 席位数据「主持人」字面 **出现次数 0**（常驻）；`${@hostTerm}` 出现次数 **18**（一次性档，Q-3）

- **覆盖**：spec §11.7 ②（口径写死为**出现次数**：字面 = 0、`${@hostTerm}` = 18）/ §11.1 R12 / §11.9 末条（**现值型断言归 `SB_SHAPE_ONESHOT=1`**）；PRD §3 Q1；议会轮 1 的 Q-3
- **前置**：17 行 / 18 处字面已改 `${@hostTerm}`（改前基线：字面 18 次、`hostRef 0`，记进当次账本）
- **步骤**：① 数 `seats/*.json` 里 `主持人` 的**出现次数**；② **常驻档**断言 0（改后必须 0，不随基线变）；③ 数 `${@hostTerm}` 的**出现次数**；④ **一次性档**（`SB_SHAPE_ONESHOT=1` + `SB_BASE=<本批 $BASE>`）断言 = **18**——这是本批的现值，只有拿 `SB_BASE` 比才有意义；常驻档**不跑** ④（否则下一批改文案就假红）
- **预期**：② 0（常驻）；④ 18（一次性档）
- **判据**：`$a = <出现次数>; if ($a -ne 0) { Write-Host "host-occs $a"; exit 1 }; exit 0`（常驻）；一次性档另跑 `$b = <出现次数>; if ($b -ne 18) { Write-Host "hostref $b"; exit 1 }`
- **红绿证据**：现盘 `hostLiteral 18` 出现 / 17 行 且 `hostRef 0` → 今天两句都红；施工后应为 `0 / 18`。**未施行（施工后核）**
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-44`
- **不覆盖**：渲染面总数（SC-TC-46，同属一次性档）；大写形态（SC-TC-60）

### SC-TC-45 行口径 vs 次数口径：`17` 行 / `18` 处——**整条归一次性档**（两值都是本批现值）

- **覆盖**：spec §11.7 ②（计数口径已写死为**出现次数**，D-2 已裁定）/ §0.3 / §11.9 末条（**现值型断言归 `SB_SHAPE_ONESHOT=1`**）；议会轮 1 的 Q-3
- **前置**：`SB_SHAPE_ONESHOT=1` + `SB_BASE=<本批 $BASE>`（常驻档**不跑**本条——两值施工后即变，留常驻必假红）
- **步骤**：① 逐文件列 `主持人` 的「行数」与「出现次数」；② 断言改前（`$BASE`）行数 = 17、次数 = 18；③ 断言两者**不相等**（若相等则说明口径描述已变，须回填 §5）；④ 同一命令对改后工作区再跑一次，只记录「改后字面 0」，**不**断言仍为 17/18
- **预期**：改前 17 / 18；差值 1 来自 `detective-observer.json:90`（同一行 2 处）——这正是「按行断会漏第 2 处」的可判证据
- **判据**：一次性档 `node --test --test-name-pattern "SC-TC-45" …` **exit 0**（三个 `assert.equal`，含 `assert.notEqual(lines, occs)`）；**常驻档跳过本条**（由 SC-TC-57 的清单登记）
- **红绿证据**：**现盘已实跑**：`hostLiteral 18` 与逐行清单（`detective-observer.json:90 x2`）→ 行数 17、次数 18（即 `$BASE` 侧的值）；改后侧尚未产生 → ④ **未施行（施工后核）**
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-45`
- **不覆盖**：改后取哪个口径（**已裁定：出现次数**，见 §5 D-2 与 §0.3；执行面归 SC-TC-44）

### SC-TC-46 渲染面「主持人」总数 = **30**（12 席 × 2 + `detective-observer` 6）——**整条归一次性档**

- **覆盖**：spec §11.7 ③（「渲染后 15 卡『主持人』出现总数 = 30……改后必须仍是 30」）/ §11.10-7 / §11.9 末条（**现值型断言归 `SB_SHAPE_ONESHOT=1`**）；PRD §3 Q1；议会轮 1 的 Q-3
- **前置**：`SB_SHAPE_ONESHOT=1` + `SB_BASE=<本批 $BASE>`；15 卡已重生成；改前基线值 30 已记进账本
- **步骤**：① 逐卡数 `agents/<seat>.md` 全文 `主持人` 出现次数并求和；② **在一次性档**断言改前 = **30**、改后仍 = **30**（等价性证明：`${@hostTerm}` 展开后字面数不变）；③ 断言构成可解释：12 席 × 2 + `detective-observer` 的 6 = 30
- **预期**：改前 30、改后 30（**不是**上一版引用的 28）
- **判据**：一次性档 `$c = <15 卡合计>; if ($c -ne 30) { Write-Host "host-render $c"; exit 1 }; exit 0`；**常驻档不跑本条**（30 是本批现值，本批之后卡面文案再变即漂移；常驻对「字面 0 / `${@` 残留 0」的判据由 SC-TC-44 / SC-TC-60 承担）
- **红绿证据**：**现盘已实跑**：`host_render 30`（渲染面 probe）与 `agents_host_occurrences 30`（盘面）两路同值；改后侧**未施行（施工后核）**
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-46`
- **不覆盖**：注入链路等价性的**语义**（只判总数不变，不判每处位置不变；位置变化属「同值不同位」，本段未要求）

### SC-TC-47 内存探针：`hostTerm` 改「议长」→ 渲染跟随、磁盘 0 命中（不落盘；**不兼差 `S2-TC-B08`**）

- **覆盖**：spec §11.7 ④ / §11.10-7 / §11.7 末句「`MixedTermInCard` 不受影响：探针只在内存」；PRD §3 Q1。**Q-1 的边界声明**：本条**只**判 `hostTerm`；`S2-TC-B08`（`VERDICT_HINT` 副本探针）**已移交给 SC-TC-61**——上一版把本条当 B08 的绿态，是「一条用例顶两个判据」，两个洞各差一半
- **前置**：施工完成（`hostTerm` 已被 `${@hostTerm}` 全量引用）
- **步骤**：① `PROBE` 在**内存**里把 `shared` 对象的 `hostTerm` 改成 `议长`，调 `loadSeatData` 的等价展开（或直接改内存 shared 引用）后重渲某席；② 断言渲染文本含 `议长`、且该席 `主持人` = 0；③ 断言磁盘 `agents/<seat>.md` 与 `data/**` 都不含探针串（不落盘）
- **预期**：② 议长出现且主持人归零；③ 磁盘 0
- **判据**：`node --test --test-name-pattern "SC-TC-47" …` **exit 0**（含 `assert.equal(diskHits, 0)`）
- **红绿证据**：**未施行（施工后核）**——现盘 `hostTerm` 不存在，探针无对象。构造参照：`S2-TC-B08:253-264` 的「改值 → 渲染跟随 + 磁盘 0」同构（**只借构造手法，不承接它的判据**；B08 自己的判据见 SC-TC-61），`finally` 还原写法可复用（本用例不落盘，无需还原）
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-47`
- **不覆盖**：`VERDICT_HINT` 的副本探针（SC-TC-61）；`MixedTermInCard` 校验面（`enums.mjs:81` 的 `MIXED_PAIR`）——探针不落盘故不触发，spec 明写不受影响

### SC-TC-48 副本改 `shared.json` 的 `hostTerm` 不重生成 → `gate` `Mismatch` exit 1

- **覆盖**：spec §11.7 ③（注入链路等价）/ §11.9 末行「`gate` exit 0 且 15 席 `disk == render`」；PRD §4 V4 负例
- **前置**：施工完成；`GATE` 已绿
- **步骤**：① `COPY` 内把 `hostTerm` 改成 `议长`；② 副本内跑 `GATE`；③ 断言 exit 1 且输出含 `Mismatch`
- **预期**：exit 1
- **判据**：副本内 `GATE` **exit 1**；真仓 `GATE` **exit 0**（两侧都断，防「恒红」构造）
- **红绿证据**：真仓侧现盘已实跑 `gate`：`exit=0`，末行 `baseline 38/38`；副本侧 **未施行（施工后核）**
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-48`
- **不覆盖**：`baseline 38/38`（PRD §5 明写「不作判据」，恒真）

### SC-TC-49 `@HOST_TERM`（整值）抛错、`${@HOST_TERM}`（大写插值）**静默不展开** — 键名必须小写

- **覆盖**：spec §11.1 R12（「`@` 引用形态是 `^@([a-z][A-Za-z0-9]*)$`，键名首字符必须小写；`@HOST_TERM` 非法」）/ §11.2 #5；本条 = D-7 裁定中的**纯函数面**（数据面 0 命中 + 展开后 `${@` 残留 0 归 **SC-TC-60**，spec §11.7 ⑤）
- **前置**：无（`expandRefs` 是纯函数，可现盘直接调：`seatLoader.mjs:35-61`）
- **步骤**：① 调 `expandRefs('@HOST_TERM', {hostTerm:'主持人'}, 'x')` → 断言抛 `NestedSharedRef`；② 调 `expandRefs('$'+'{@HOST_TERM}', …)` → 断言**不抛**、返回值**仍含** `${@HOST_TERM}` 字面（即静默留字面 = 为什么必须另补 SC-TC-60）；③ 调 `expandRefs('@hostTerm', …)` 与 `expandRefs('当$'+'{@hostTerm}调度', …)` → 断言分别得 `主持人` / `当主持人调度`
- **预期**：① 抛；② 不抛且残留字面；③ 正常展开
- **判据**：`node --test --test-name-pattern "SC-TC-49" tools/docgen/test/sc-card-shape.test.mjs` → **exit 0**（三条断言；①② 各扣一次）
- **红绿证据**：**现盘已实跑**（纯函数直调，无写盘）：`whole_upper throws NestedSharedRef` / `part_upper => "${@HOST_TERM}"`（**未抛、原样返回**）/ `whole_lower => "主持人"` / `part_lower => "当主持人调度"` → 三条全部可跑且绿；本条**无未施行项**
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-49`
- **不覆盖**：数据面 / 渲染面的残留（SC-TC-60）；`@` 展开的其余错误码（归 S-A 既有测试）；`loadSeatData` 的端到端装载（同一条链，落测试时用 ①–③ 的纯函数面即可，端到端由 SC-TC-53 的 `gate` 兜）

### SC-TC-50 `ret`+`urns` 在 `tools/docgen/**` 计数 0（现 3）

- **覆盖**：spec §11.1 R11 / §11.8 V11 ①；PRD §2 D16 ④
- **前置**：`sa-data-layer.test.mjs` 的负例夹具键已改名（`ret`+`urns` → `ghostField`，spec §11.2 #13）
- **步骤**：① 遍历 `tools/docgen` 的 `.mjs` 与 `.json`；② 用**拼接构造**的词（`'ret' + 'urns'`，见 SC-TC-51）统计；③ 断言 0
- **预期**：0
- **判据**：`$w = 'ret' + 'urns'; $c = <逐文件含该词的文件数/次数>; if ($c -ne 0) { Write-Host "ret+urns $c"; exit 1 }; exit 0`
- **红绿证据**：现盘实测 **3**（全在 `tools/docgen/test/sa-data-layer.test.mjs:120` / `:122` / `:559`）→ 今天红；改夹具键名后 0。**未施行（施工后核）**
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-50`
- **不覆盖**：`checkItem` 上的 `ret`+`urns` 字段本身是否存在（同一条计数即是判据，见 PRD D16 ④）

### SC-TC-51 判据实现必须拼接构造该词（直接写字面 → 测试文件自身命中 = 假红）

- **覆盖**：spec §11.1 R11（「`ret`+`urns` 计数 0 靠改 S-A 负例夹具键名达成」）/ 本条同时是 SC-TC-50 的**构造有效性**证明
- **前置**：SC-TC-50 已落
- **步骤**：① 断言 SC-TC-50 的取数表达式里该词是**两段拼接**（源码正则：`'ret'` 与 `'urns'` 同现、且该词**不**以完整字面出现）；② 反证：把词写成完整字面后，扫描集合会包含 `sc-card-shape.test.mjs` 自身 → 计数 ≥1
- **预期**：① 拼接形态成立、完整字面 0 处；② 反证成立（说明必须拼接）
- **判据**：`node --test --test-name-pattern "SC-TC-51" …` **exit 0**（源码文本断言 + 构造反证两条）
- **红绿证据**：**构造可现盘验**：现盘 3 命中全在 `sa-data-layer.test.mjs`（一个**测试文件**）——正是「测试文件自己命中」的实例，故本用例的构造在仓内已有先例
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-51`
- **不覆盖**：仓库其它目录（`docs/**` 不在 V11 ① 扫描面）

### SC-TC-52 副本回填该键名 → 计数 ≥1 必红

- **覆盖**：spec §11.1 R11；PRD §4 V11 ① 负例
- **前置**：SC-TC-50 已绿
- **步骤**：① `COPY` 内给某席 JSON 加一个 `ret`+`urns` 拼接出来的键（或用 `ghostField` 之外的原名回填）；② 跑 SC-TC-50 同形计数；③ 断言 ≥1
- **预期**：≥1
- **判据**：副本内 **exit 1**
- **红绿证据**：**未施行（施工后核）**
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-52`
- **不覆盖**：加进 `.mjs` 源码的形态（同一计数覆盖两个扩展名）

### SC-TC-53 `gate` exit 0 且 15 席 `disk == render` 逐字节

- **覆盖**：spec §11.9「15 席重生成走两步写盘：`draft` → `replace --yes`；`gate` exit 0 且 15 席 `disk == render`」；PRD §4 V3 / V4
- **前置**：15 卡已按两步写盘重生成；语义键变动的席已带独立判者的 `evidence.json`
- **步骤**：① `GATE`；② 断言 exit 0；③ 断言末行 `baseline 38/38` **只作记录不作判据**（PRD §5 明写恒真）
- **预期**：exit 0
- **判据**：`GATE` **exit 0**（`$LASTEXITCODE -ne 0` → exit 1）
- **红绿证据**：**现盘已实跑**：`baseline 38/38` / `exit=0`（§0.1）→ 今天绿；施工后须复跑保持绿
- **对应测试**：`tools/docgen/cli.mjs gate`（既有入口）+ `tools/docgen/test/sc-card-shape.test.mjs::SC-TC-53`（把 exit code 断言化）
- **不覆盖**：`draft` / `replace` 的内部流程（归 S4 / S-A 既有覆盖）

### SC-TC-54 副本改一席数据不重生成 → `gate` `Mismatch` exit 1

- **覆盖**：spec §11.9 同条；PRD §4 V4 负例（「改任一 `seats/*.json` 值不重生成 → `Mismatch` → exit 1」）
- **前置**：SC-TC-53 已绿
- **步骤**：① `COPY` 内改某席 `duty.constraint` 一个字；② 副本内跑 `GATE`；③ 断言 exit 1 且输出含 `Mismatch`
- **预期**：exit 1
- **判据**：副本内 `GATE` **exit 1**
- **红绿证据**：**未施行（施工后核）**
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-54`
- **不覆盖**：`gate` 的其它错误码（`EvidenceInvalid` / `TargetDrift` 归 S-B 既有用例）

### SC-TC-55 `npm run check`：`# fail 0` 且 `# tests ≥ 1481 + 本批新增`；plan 的 `check-plan map` 无缺口 / 无悬空（V2）

- **覆盖**：spec §11.8 V3 / §11.9 末行；PRD §4 V3；**spec §11.8 V2（「plan 的 `check-plan map`」→ `map: missing 0 dangling 0`，归计划门）/ PRD §4 V2**（轮次 5 按审计 **P1-1** 补入第 ④ 步：原稿全文 `V2` 零命中，等于这条验收项没有用例）
- **前置**：本段施工完成；本批新增 = 本文件用例落成后的 `test()` 块数（以测试文件实际块数为准，不写死）；④ 需 `docs/superpowers/plans/2026-11-03-s-c-card-shape.md` 已在盘且其 `**Testcase:**` 行指向本文件
- **步骤**：① `CHECK`；② 从输出取 `# tests N` 与 `# fail M`；③ 断言 `M = 0` 且 `N ≥ 1481 + 本批新增`；**④ `node scripts/check-plan.mjs map --plan docs/superpowers/plans/2026-11-03-s-c-card-shape.md` → 断言首行逐字含 `missing 0 dangling 0`、`cases` 与 `mapped` 两值均 = **60**（= 本文件 §1 末「计数核算」的条数；两处同源，条数一改则此处必红，防「附录 A 少登记一条也绿」），且退出码 0**
- **预期**：`M = 0`；`N` 不低于基线；④ 首行 `map: missing 0 dangling 0（cases 60 / mapped 60） => ok`，`exit 0`
- **判据**：③ `$t = <'# tests N' 取数>; $f = <'# fail M' 取数>; if ($f -ne 0) { Write-Host "fail $f"; exit 1 }; if ($t -lt <1481 + 本批新增>) { Write-Host "tests $t"; exit 1 }; exit 0`；④ `node scripts/check-plan.mjs map --plan docs/superpowers/plans/2026-11-03-s-c-card-shape.md` 的**退出码**（只读脚本自身判定 → 可作判据；不属于 §0 `COUNT` 行禁的「`Select-String` / `git diff` 恒真退出码」）+ 落成测试时对首行做**字符串断言**（`assert.match(first, /map: missing 0 dangling 0（cases 60 \/ mapped 60） => ok/)`）。**禁 `node -e`**
- **红绿证据**：③ **未施行（按纪律本轮不跑 `npm run check`）**——理由：本席只读边界，且全量门禁会把 ⑥ 段写入的产物算进账；本席改引**作者 2026-11-04 复跑**的结果（与 §0.1 同一行）：`# tests 1481 / # pass 1476 / # fail 0 / # skipped 5` + `baseline 38/38` + 末行 `check 全部通过`。上一版旁证 `# fail 4` 的根因 = 本批新建 impact-sheet 漏写 33 个口径 ID（**已由本批 impact-sheet 补全 33 个口径 ID 而消解**，`node scripts/scope-sweep.mjs --check` → `sweep ok`），故 V3 的「施工后 `# fail 0`」现在有可归因的绿态起点（§5 D-1 已裁定）。**施工后仍须自行复跑一次**，本条不把作者的复跑当施工后绿态。**④ 今日实跑（2026-11-04 轮次 5，只读命令）**：首行 `map: missing 0 dangling 0（cases 60 / mapped 60） => ok`、`exit 0`（见 §0.1 的 `check-plan map` 行）；施工后复跑仍须逐字相同（用例条数固定 60、plan 附录 A 不增删 → 应稳定）
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-55`（把取数 + 比较写成断言，**不**在测试里 spawn `npm run check`——会自递归，参照 `s2-card-rewrite.test.mjs:4-5` 的禁令；④ 同理不 spawn `npm run`，直接跑 `check-plan.mjs` 的 `map` 子命令）
- **不覆盖**：`# skipped 5` 的名单（归 `scripts/test-skip-allowlist.mjs` 既有覆盖）；`check-plan coverage --stage`（PRD §11.12 明写本段不适用，见 SC-TC-59）

### SC-TC-56 做坏判据：删一个测试文件 → `# tests` 低于基线必红

- **覆盖**：spec §11.9 末行「`# tests` 不得低于基线（删用例凑绿 = 做坏）」；PRD §8「做坏判据」
- **前置**：SC-TC-55 的断言形态已落
- **步骤**：① `COPY` 内删除一个既有测试文件（选一个用例数已知的，如 `tools/docgen/test/sdet-render.test.mjs`，4 条）；② 副本内取 `# tests`；③ 断言 `< 1481 + 本批新增` → 红
- **预期**：副本计数 = 基线 −4 → 红
- **判据**：副本内 `COUNT` 形态 **exit 1**
- **红绿证据**：**未施行（施工后核）**；构造有效性现盘可证：`sdet-render.test.mjs` 现盘 4 条（§0.1），删它必然让总数 −4
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-56`
- **不覆盖**：把某条改成 `assert.ok(true)` 的空心形态（归 PRD V7 / S-B `check-case-assert`）

### SC-TC-57 一次性 / 批次形态断言归 `SB_SHAPE_ONESHOT=1`，`SB_BASE` 换成本批 `$BASE`（**本批现值断言清单登记在此**）

- **覆盖**：spec §11.9 倒数第 2 行「一次性 / 批次形态断言归 `SB_SHAPE_ONESHOT=1`」+ 「本批的现值型断言（13 项 / 18 次 / 30 次）」；S-B testcase `:40` / `:555`；议会轮 1 的 Q-3 / B-4
- **前置**：`SB_BASE` 由环境变量覆盖；默认冻结为**本批**提交（不是 S-B 那批）
- **步骤**：① 记录 `$BASE = git rev-parse HEAD`（动模板前，写进当次账本）；② 设 `SB_SHAPE_ONESHOT=1`、`SB_BASE=$BASE`，先跑 S-B 的 `SB-TC-06` / `SB-TC-32` / `SB-TC-25④`（它们是对**批次**形态的断言）；③ 断言三条按新 BASE 重算后仍绿；④ 断言不设 `SB_SHAPE_ONESHOT` 时这些条目**不跑**（常驻档只跑不变量）；⑤ **本批现值断言清单**（同一档、同一 `$BASE`，一条不少）：斜杠 **13 项**（SC-TC-23 / 26）、`主持人` 字面 **18 次 / 17 行**（SC-TC-44 ④ / SC-TC-45 / **SC-TC-30 ④（`rationale` 改写侧，与 44 ④ 同一取数）**）、渲染面 **30**（SC-TC-46）；断言这四个现值在 `$BASE` 侧成立、在改后侧重算得 0 / 0 / 0 / 30
- **预期**：③ 绿；④ 不跑；⑤ 四个现值在两侧各有明确取值，且常驻档**从不**断言现值
- **判据**：`node --test --test-name-pattern "SB-TC-06|SB-TC-32|SB-TC-25"`（带 env）**exit 0**；不带 env 时按 `skip` 计数断言（`COUNT` 形态，且 skip 名单须在 `scripts/test-skip-allowlist.mjs` 白名单内）；⑤ 的四个现值按 ② 的 env 同批复算
- **红绿证据**：**未施行（施工后核）**——理由：`SB_SHAPE_ONESHOT` / `SB_BASE` 的落实现状须先核（S-B testcase 只声明档位，未见执行体），且新 BASE 尚未产生；⑤ 的 `$BASE` 侧四个现值已由 §0.1 现盘实测给出（13 / 18 / 17 / 30），可作 `$BASE` 侧的构造证据
- **对应测试**：`tools/docgen/test/sb-contract-layer.test.mjs`（S-B 那三条）+ `tools/docgen/test/sc-card-shape.test.mjs::SC-TC-57`（③④⑤ 的断言化）
- **不覆盖**：S-B 常驻不变量（归 S-B 既有用例）

### SC-TC-58 硬约束不动：列数 4 / 七段 / 36 码 / 8 键 / 12 键

- **覆盖**：spec §11.9 前三行 / §11.12；PRD §5「`renderCard` 卡面列数」行
- **前置**：施工完成
- **步骤**：① `PROBE` 逐卡数「本席清单」表头列数 = 4（`S2-TC-D03` 同形）；② 数每卡 `^## ` 段 = 7；③ 断言 `CARD_MODEL_CODES` = 36、`SCAN_FIELDS` = 8；④ `REF` 首行 `keySet8 15 / keySet12 15`
- **预期**：① 4；② 7（105 总）；③ 36 / 8；④ ok
- **判据**：`node --test --test-name-pattern "SC-TC-58" …` **exit 0** + `REF` **exit 0**
- **红绿证据**：**现盘已实跑**：列数 4（`header "| # | 条目 | 判据 | 类型 |"`）、段数 105、`codes 36 scanFields 8`、`REF` 首行 `... keySet8 15 / keySet12 15 => ok`
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-58`（②③ 的断言化；①④ 复用既有 `S2-TC-D03` / `REF`）
- **不覆盖**：`CARD_SEGMENTS` 段**名**（既有 `S2-TC-*` 兜）

### SC-TC-59 防回退：PRD 行数 `D 17 / Q 8 / empty 0` 不得因 S-C 变动

- **覆盖**：spec §11.8 V1 / §11.12「`check-prd-rows.mjs` 不在本段建」；PRD §4 V1 / §8 S-C 行
- **前置**：S-C 只改卡面，不得改 PRD 功能点集合
- **步骤**：① 数 PRD §2 的 `D<n>` 行与 §3 的 `Q<n>` 行（行首正则 `^\| \*{0,2}D\d+` / `^\| Q\d+`，容忍粗体行号）；② 断言 17 / 8；③ 扫「依据」列与「影响面」列的空格数 → 0
- **预期**：17 / 8 / 0
- **判据**：`$d = <D 行数>; $q = <Q 行数>; $e = <空值格数>; if ($d -ne 17) { Write-Host "D $d"; exit 1 }; if ($q -ne 8) { Write-Host "Q $q"; exit 1 }; if ($e -ne 0) { Write-Host "empty $e"; exit 1 }; exit 0`
- **红绿证据**：**未施行（施工后核：本用例是对「本批 diff 不碰 PRD」的防回退断言，须在 diff 产生后跑）**；口径依据现盘可核：PRD §2 确有 `D16` / `D17` 两行**粗体**（`index.md:43-44` 以 `| **D16** |` 起头）→ 严格 `^\| D\d+` 正则会漏数成 15，故正则必须容忍粗体（PRD §4 V1 原话）
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-59`
- **不覆盖**：`check-plan coverage --stage`（PRD §11.12 明写本段不适用）

### SC-TC-60 大写形态兜底：`seats/*.json` 内 `@HOST_TERM` / `${@HOST_TERM}` 出现 0 **且**展开后 15 卡 `${@` 残留 0

- **覆盖**：spec §11.7 ⑤（新增判据）/ §11.10-7（第 7 条末句）；本条即 §5 D-7 裁定的**数据面 + 渲染面**（纯函数面归 SC-TC-49）
- **前置**：`shared.json` 已加 `hostTerm`；15 席数据已改 `${@hostTerm}`；15 卡已重生成
- **步骤**：① 逐份数 `seats/*.json` 内 `@HOST_TERM` 与 `${@HOST_TERM}` 的**出现次数**（两种形态各一次，含混合写法）；② 断言两者合计 = 0；③ 取 15 卡渲染全文，数 `${@` 的**出现次数**；④ 断言 = 0（任何一处残留都说明有人写了大写形态或键名拼错，而 `expandRefs` 不会报错）
- **预期**：② 0；④ 0
- **判据**：`$u = <seats 内两种大写形态合计>; if ($u -ne 0) { Write-Host "upper $u"; exit 1 }; $r = <15 卡 `${@` 合计>; if ($r -ne 0) { Write-Host "residual $r"; exit 1 }; exit 0`（落测试 = 两条 `assert.equal`，各扣一次）
- **红绿证据**：**未施行（施工后核）**——理由：③ 的「展开后卡面」对象只有在 `${@hostTerm}` 真正落位后才存在（现盘 `hostRef 0`）；① 现盘同为 0（大写形态本就没人写），故本条红态须靠**构造**证明：`COPY` 内把某席的 `${@hostTerm}` 改成 `${@HOST_TERM}` → 渲染后 `${@` 残留 ≥1（② 或 ④ 必红）。构造有效性由 SC-TC-49 现盘实测「`part_upper` 原样返回 `${@HOST_TERM}`」直接支撑（该纯函数行为今天已可跑）
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-60`
- **不覆盖**：`expandRefs` 对整值大写抛哪种错误码（SC-TC-49）；`MixedTermInCard` 面（探针不落盘，SC-TC-47）

### SC-TC-61 `VERDICT_HINT` 副本探针：值前插探针串 → 15 卡重渲**跟随**，真仓 15 卡探针 **0** 命中（承接 `S2-TC-B08` 改后）

- **覆盖**：spec §11.3 表第 6 行（`S2-TC-B08` 改后：「`VERDICT_HINT` 是**字符串、不可就地改**：副本内（`withRepoCopy`）在其值前插探针串 → 重渲必须跟随；真仓 15 卡探针 0 命中」）/ §11.10-1；**议会轮 1 的 Q-1**（上一版由 SC-TC-47 顶着，但它探的是 `hostTerm` → B08 实际无用例）
- **前置**：施工完成（`VERDICT_HINT` 已住 `card-contract.mjs`、`renderCard.mjs` 的 `checkTable()` 已用它拼表头）；`PROBE` 落进 `tools/docgen/test/sc-card-shape.test.mjs`
- **步骤**：① `COPY`（`withRepoCopy`）内把 `card-contract.mjs` 的 `VERDICT_HINT` **值前插**探针串（如 `const VERDICT_HINT = 'PROBE-Q1-' + <原派生表达式>`，不改派生逻辑、只前插）；② 父测试在副本内写探针脚本（打印 15 席「本席清单」段的表头行，**只取数**），`runNode([<副本相对路径>], <副本>)` 子进程跑它；③ 父测试断言 stdout 里 **15/15** 行都含 `PROBE-Q1-`（渲染**跟随**了字符串值，说明它真的是渲染的数据源而不是被内联的死字面）；④ 父测试读**真仓** `agents/<seat>.md` 15 份，断言探针串 **0** 命中（副本注入不落真仓）
- **预期**：③ 15/15 含探针；④ 真仓 0
- **判据**：`node --test --test-name-pattern "SC-TC-61" tools/docgen/test/sc-card-shape.test.mjs` **exit 0**（③④ 各一条 `assert`，各扣一次；子进程 exit 码仅作旁证，按 §0 `COPY-取数`）
- **红绿证据**：**未施行（施工后核）**——理由：`VERDICT_HINT` 现盘命中 **0**（§0.1），副本里没东西可前插；红态 = 渲染器把三值**内联死字面**（此时前插 `VERDICT_HINT` 不跟随 → ③ 必红），这正是 spec「不可就地改」那句要拦的形态
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-61`（同批改写的既有件 = `tools/docgen/test/s2-card-rewrite.test.mjs::S2-TC-B08:253-264`）
- **不覆盖**：`hostTerm` 的内存探针（SC-TC-47）；`VERDICT_HINT` 值本身的形态（SC-TC-01）

### SC-TC-62 回退面复验**真做得到**：`git diff --name-status $BASE` 的 `A` 面落在**六类新增白名单（展开 8 项实体路径）**、其余状态面落在修改白名单（**5 个前缀 + 2 项实名 = 7 项**，**不比 `??` 面计数**）；D6 延期落点按**实名文件**可核（BB-2 + BB-3 合并承接；轮次 6 改判 CC-1；轮次 7 补 M 面漏项 P0-2）

- **覆盖**：spec §11.14 步 1 的复验（「`git status --porcelain` 只剩本段**新增**文件（两个新脚本、`tools/docgen/test/sc-card-shape.test.mjs`、spec、testcase、`docs/after/20261104101304-…`）+ 交接词 `docs/handoffs/2026-11-04-s-c-card-shape.md`」）/ 步 2（「删两个新脚本与新增测试后 `git status --porcelain tools/docgen` 为空」）/ 步 3–4 的复验入口 + spec §11.12「D6 的『逐项返回文案重写』延后」的**延期落点实名** = `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md`（触发 = PRD 下一次修订或出现「逐项判定」的真实消费者；签字人 = 用户）。**议会复核轮 BB-2（回退面无用例）与 BB-3（延期落点只是目录名、不可核）合并成这一条**；**轮次 5 按审计 P1-2 改写**：原白名单照抄 spec 的六项、漏 handoff 与 plan，与实测 5 项 porcelain 不符；**轮次 6（CC-1）改判**：spec 步 1 的「`git status --porcelain` 只剩新增文件」在本条按 **`git diff --name-status $BASE`** 判（只答「相对开工基线改 / 增了哪些路径」，与是否已提交无关）。原写法把「`??` 面恰 N 项必现」当**常驻**断言 → 施工后提交（`git add` 后 `??` 变 `A `）即归零、恒红，且与 spec §11.9「现值型断言归 `SB_SHAPE_ONESHOT=1`」、plan Task 0「`porcelain` 空」互斥；**轮次 7（P0-2）补漏**：M-面白名单原只照抄 `tools/docgen` / `tools/observation-check` / `scripts` / `agents` / `docs/agents` 五个前缀 + 1 项实名（S-A 的 spec），漏了同批要改文案的 **`docs/superpowers/specs/2026-11-03-s-a-data-layer-design-testcase.md`**（plan Task 5 第 2 条「S-A testcase `TC-015` 文案同改」、File Structure 表第 `改` 行）——**已跟踪件 + 前缀外 → 施工后必以 `M` 出现 → M-面断言恒红、`# fail 0` 不可达**（与 CC-1 同族）。修法 = 按 **spec §11.14 步 1 的现读 `git checkout` 清单**同步（该清单已含它，与 S-A 的 spec 并列两个实名），M 面 → **5 前缀 + 2 实名 = 7 项**；并按 plan 的 File Structure 表**逐行复核其余漏项**（结论见 ② 的「M-面逐行比对」bullet）
- **前置**：本段施工完成（两个新脚本、`tools/docgen/test/sc-card-shape.test.mjs`、spec、testcase、`docs/after/20261104101304-…` 均已在盘）；`$BASE` 已按 spec §11.9 施工第 0 步取到（`git rev-parse HEAD`，写进当次账本；与 SC-TC-57 ① 同一值）；**本批新增件已 `git add` 进索引**（**不必提交**——`git diff <$BASE>` 对「只进索引」与「已提交」两态给出同一个 `A`，唯独对**未跟踪**件不可见，故 ②-0 自带一条前置断言兜这个盲区）；`tools/docgen/fixtures/*.evidence.json` / `agents/*.md` / `docs/agents/**` / `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md` / **`docs/superpowers/specs/2026-11-03-s-a-data-layer-design-testcase.md`** 属步 1 的 `checkout` 覆盖面或已跟踪，只会以 `M` 出现（归 ② 的 M-面；**轮次 7 补入最后一项** = P0-2）
- **取数形态（轮次 6 改判，CC-1；轮次 5「副本无 `.git` → 走真仓只读」的结论保留）**：本条的取数**不走 `COPY`**——`withRepoCopy` 的复制清单只有 `tools/docgen` / `tools/execution-matrix` / `tools/quality` / `rules` / `agents` / `docs/agents`（`tools/docgen/test/support/dev-workflow-checks.mjs:246`），`coldRepo` 也**过滤掉** `.git`（`card-fixtures.mjs:21` / `:39`）→ **两者都没有 `.git`、也没有 `docs/**` / `scripts/`**，副本里既跑不了 `git diff` 也跑不了 `git checkout`。改为：**真仓只读取数 + 父测试按集合判**——`execFileSync('git', ['-c','core.quotePath=false','diff','--name-status', BASE], { cwd: REPO })`（只读，不改仓、不落盘；`core.quotePath=false` 保证中文路径不被转义成 `"…"`），与 `card-fixtures.mjs:38` 同一形态。理由：回退的**实质**是「步 1 的 `checkout` 抹掉已跟踪改动 + 步 2 删掉 3 件新建文件」，而「本批到底改 / 增了哪些路径」由 `diff --name-status <$BASE>` 一次答完，**不必真跑一遍 checkout**（`git checkout` 的复原效果本身不在此条判，见「不覆盖」）。**为什么不用 `git status --porcelain` 的 `??` 面**：`??` 只描述「未跟踪」，施工后提交（或 `git add` 后变 `A `）即归零 → 任何「`??` 面恰 N 项」的**常驻**断言都必恒红（CC-1）；`diff --name-status <$BASE>` 只答「本批相对基线改 / 增了哪些路径」，`$BASE` 之后的提交同样计入，**与提交状态无关**。**为什么必须带 `$BASE`**：不带基线的 `git diff` 比的是「索引 ↔ 工作树」，仍依赖暂存 / 提交状态，判不出「本批」。**盲区**：`git diff` **看不见未跟踪件**（现盘实证：`git diff --name-status HEAD` 输出空，而 `??` 面有 5 项）→ 由 ②-0 的前置断言兜住
- **步骤**（编号从 ② 起、与原文及本文其他节的引用一致：① 原「副本内跑 `git checkout`」已由上面的「取数形态」行取代，不再真跑）：② 真仓只读取数 `git diff --name-status $BASE`（**只取 stdout 集合，不解析退出码**），把每行按 `\t` 拆成 `(状态, 路径)`（`A` = 相对基线**新增**；`M` = 修改；`D` = 删除；`R…` = 改名，多一列旧路径、**两列都进判定**）。父测试按**五条断言**判（②-0 / A / B / C / M-面；新增白名单按 **六类**组织、展开为 **8 项实体路径**）+ 一条「M-面逐行比对」自核（见末 bullet，轮次 7 加）：
  - **白名单六类**：⓵ 交接词 `docs/handoffs/2026-11-04-s-c-card-shape.md`；⓶ spec `docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md`；⓷ testcase `docs/superpowers/specs/2026-11-03-s-c-card-shape-design-testcase.md`；⓸ `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md`；⓹ **plan `docs/superpowers/plans/2026-11-03-s-c-card-shape.md`**（spec §11.14 步 1 的白名单**未列**它，而步 1 的 `git checkout` 覆盖面**不含** `plans/` → 它必然以 `A` 面出现，故本席按判据侧补入，**不改 spec**）；⓺ 施工期新增 3 件 = `tools/docgen/check-trigger-kind.mjs` / `tools/docgen/check-tristate-header.mjs` / `tools/docgen/test/sc-card-shape.test.mjs`
  - **②-0（盲区前置：新增件必须对 `git diff` 可见）**：上列 8 项**不许**任一项出现在 `git ls-files --others --exclude-standard -- <该 8 项>` 的输出里（为空 = 全部已进索引 / 已跟踪）——否则 `git diff` 看不见它们，B 会假红、A（不许多）会假绿
  - **A（不许多：`A` 面 ⊆ 六类）**：状态为 `A` 的路径集合**必须 ⊆ 白名单**（8 项实体路径）；白名单外出现任一 `A` 路径 → 抛并**逐个点名**，不得默认放行
  - **B（不许少：`A` 面 ⊇ 7 项）**：⓶⓷⓸⓹ + ⓺ 的 3 件共 **7 项**必须都在 `A` 面（缺一即抛）——**与提交状态无关**：`$BASE` 之后提交的同样按 `A` 计
  - **C（⓵ 的两种合法形态）**：⓵ 在 `A` 面中 → 合法（在白名单内）；⓵ 不在 `A` 面 → 只可能「`$BASE` 之前就提交 / 已移出」，账本必须有对应处置记录（记该提交哈希），否则抛
  - **M-面（不许多：其余状态 ⊆ 修改白名单）**：非 `A` 的路径必须 ⊆ 修改白名单 = spec §11.14 步 1 的 `git checkout` 覆盖面，**按现读清单落 7 项**：5 个前缀 `tools/docgen/`、`tools/observation-check/`、`scripts/`、`agents/`、`docs/agents/` + 2 项实名 `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md`、**`docs/superpowers/specs/2026-11-03-s-a-data-layer-design-testcase.md`**（后者 = 轮次 7 的 P0-2 补入，与前者并列）∪ 上面 8 项新增白名单（它们在施工中可能被再改）；前缀 / 实名之外出现任一 `M` / `D` / `R…` 路径 → 抛并点名（= 动到了「回退抹不掉」的已跟踪件）
  - **M-面逐行比对（轮次 7 的复核结论，施工者照此可自核）**：把 plan `docs/superpowers/plans/2026-11-03-s-c-card-shape.md` 的 **File Structure 表 24 行**逐行过一遍（该表是「施工前白名单，落点外一律不写」→ 落点外的文件**不属本批**，不进本条的 M / A 面）：`改` **18 行** + `重生成` / `由 replace 自动更新` **3 行** = **21 行已跟踪件**，`新建` **3 行** = `A` 面。21 项的归属：**19 项落在 5 个前缀内**（`tools/docgen` **14 行**（13 个 `改` + 1 个 `fixtures` 自动更新）+ `tools/observation-check` 1 行 + `scripts` 2 行 + `agents` 1 行 + `docs/agents` 1 行），**2 项在前缀外、须实名**（`docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md`、`docs/superpowers/specs/2026-11-03-s-a-data-layer-design-testcase.md`）。施工者自核命令（**只取 stdout、不看退出码**）：`git ls-files -- <这 21 项>`（相对本表应 **21/21 命中**；本席现测 17 个文件实名 + 4 组目录 = `17/17` + `data/seats 15` / `agents/*.md 15` / `docs/agents 16` / `fixtures 18` 全命中）；`Test-Path` 复核 3 件新建件应 **False**（现测 False → 归 `A` 面）。**本席复核结论 = 除本轮补入的这一项外无其他漏项**（唯一前缀外的两项，一项早已在 M 面、一项即本轮补入）
  - **本条不比计数**：「施工后剩 8 / 7 / 5 / 4 项」那套数字**随 CC-1 删除**——只比集合，不比长度（长度随提交状态变，集合不变）
- ③ 断言「步 2 之后 `tools/docgen` 侧回到基线」的等价形态（**改判 `A` 面、不比计数**）：`git diff --name-status $BASE -- tools/docgen` 里状态为 `A` 的路径**恰等于** ⓺ 的 3 件（按集合相等判，多一 / 少一即抛）——这 3 件删掉后该前缀下的 `A` 面 = ∅，即回到「只剩已跟踪件的 `M`」；`M` 面归步 1 的 `checkout`（步 4 的 `GATE` 会判「盘 == 渲染」同源）；④ 断言步 3–4 的复验**有可执行入口**：`node --test tools/docgen/test/sa-data-layer.test.mjs` exit 0 与 `GATE` exit 0；⑤ 断言延期落点是**实名文件**：`docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` **存在**，且正文同时含**触发条件**栏（「触发」/「下一次修订」字样）与**谁兜 / 签字人**栏（「签字人」/「用户」字样）——两栏缺一即抛
- **预期**：②-0 输出为空；② `A` 面 ⊆ 六类（7 项必现、白名单外 `A` = 0）、其余状态面 ⊆ **修改白名单（5 前缀 + 2 实名 = 7 项）∪ 8 项新增白名单**（集合外非 `A` = 0，顺序无关；**S-A 的 testcase 与 spec 两个实名都必须在列**）；② 的「M-面逐行比对」21/21 命中、3 件新建件 `Test-Path` False；③ `tools/docgen/` 前缀的 `A` 面恰 3 件；④ 两条命令 exit 0；⑤ 文件存在且两栏在位。**本条不含任何「`??` 面恰 N 项 / 剩余项 = N」类计数断言**（CC-1）；**提交前与提交后是同一套期望值**（`A` 面按 `$BASE` 比，与是否已提交无关）
- **判据**：`node --test --test-name-pattern "SC-TC-62" tools/docgen/test/sc-card-shape.test.mjs` **exit 0**（②-0 / ② / ③ / ④ / ⑤ 各扣一次）。**取数与比较方式**：`execFileSync('git', ['-c','core.quotePath=false','diff','--name-status', BASE], { cwd: REPO, encoding: 'utf8' }).toString()` 取 **stdout** → `split('\n')` 去空行 → 每行 `split('\t')` 得 `(status, path…)`（`R…` 取第 2、3 列）；父测试把「`A` 路径集合」与「非 `A` 路径集合」分别与白名单**按集合比**：判「不许多」用 `assert.deepEqual(outside.sort(), [])`（并将 `outside` 逐个点名输出），判「不许少」用集合包含（`want.every((p) => aSet.has(p))`），判「恰等」用 `assert.deepEqual([...aSet].sort(), [...want].sort())`。**`git` 的退出码不作判据**（`git diff` 不设「有无差异」的退出码——按 §0 `COUNT` 行禁令；`execFileSync` 的退出码仅作旁证，只在脚本自身崩溃时暴露环境问题）。**禁 `node -e`**
- **红绿证据**：**未施行（施工后核），红 / 绿 / 漏项红三组构造已定**——理由：白名单里 ⓺ 的两个新脚本与 `tools/docgen/test/sc-card-shape.test.mjs` 现盘**不存在** → B 断言（7 项）缺 3 件、③ 的「`tools/docgen/` 前缀 `A` 面恰 3 件」现为 0 件 → 今天**必红**（成因是施工未做，不是构造缺陷）。三组：
  - **红态（注入白名单外路径）**：判定体写成纯函数 `judgeNameStatus(rows)`（`rows` = `(状态, 路径)` 对数组，父测试喂真仓取数、构造用例喂伪造行）——① 喂 `['A\ttools/docgen/rogue-new.mjs', 'M\ttools/docgen/card-contract.mjs']`（首行是白名单外 `A`）→ **A 断言必红并点名**；② 喂 `['M\tagents/detective-observer.md', 'M\tREADME.md']`（次行落在修改白名单外）→ **M-面断言必红并点名**。**不在真仓注入**（副本无 `.git`，`COPY` 用不了；真仓只能只读）
  - **红态（漏一个已跟踪的改动路径 → 红；P0-2 的直接反证，轮次 7 补）**：同一纯函数，先取**轮次 6 的旧 M 面白名单**（只 5 前缀 + `2026-11-03-s-a-data-layer-design.md` 一项实名），喂真仓施工后必然会有的那一行 `['M\tdocs/superpowers/specs/2026-11-03-s-a-data-layer-design-testcase.md']` → **M-面断言必红并点名该路径**（这正是不补白名单时的形态：施工必改它的 `TC-015` → `M` 必现 → 本条恒红、`# fail 0` 不可达）；再把该实名补进白名单（= 本轮修法），**同一输入 → 绿**（两跑之差 = 判别力证明：白名单每漏一项已跟踪改动件，都恰好红在这一行）
  - **绿态（提交后仍绿）**：施工完成、`$BASE` 已取后，先把本批 8 项 `git add`，再把整批**提交**，两次都跑本条 → 都应 exit 0（`A` 面按 `$BASE` 比，进索引 / 已提交两态同值）。**现盘先验已做**：`git diff --name-status HEAD` 现输出**空**，而 `??` 面有 5 项（§0.1）→ 证明「未跟踪件不进 `git diff`」，故 ②-0 的前置断言不可省（否则新件未 `git add` 时 B 会假红、A 会假绿）
  - 现盘可证三点（未变）：① `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` **已存在**（`Test-Path` = True），故 ⑤ 的「存在性」半条今天可跑；② `git status --porcelain` 现盘 `??` 面 = **5 项**（`docs/after/…` / handoff / **plan** / testcase / spec；`(git status --porcelain).Count` = 5，§0.1）——**只作 D-8 的构造证据与上面的盲区对照，不进本条判据**（CC-1）；③ spec §11.14 步 1 已覆盖 handoff（`D-8` 的 handoff 面**已消解**，spec mtime 晚于本 testcase），残余的 plan 面由本条的 ⓹ 承
- **对应测试**：`tools/docgen/test/sc-card-shape.test.mjs::SC-TC-62`
- **不覆盖**：`git checkout --` 的**复原效果本身**（判「改动是否真被抹掉」归步 4 的 `GATE` / `npm run check`，本条的 ④ 只判这两条复验入口 exit 0）；§11.14 步 3 的 S-A 夹具名复原**动作本身**（只判该步的复验命令可跑）；`docs/after` 文件正文的**文案质量**（只判触发 / 谁兜两栏在位）；`git checkout` 覆盖面之外的产物（归 S-B 既有回退面）；「未跟踪件不进 `git diff`」的盲区本身（由 ②-0 的前置断言兜，不在此条判）

## 3 覆盖核对（spec 验收面逐条 → 用例）

**A. spec §11.10「测什么」9 条**（spec 自己列的可测项）：
1 三态承载单一性（含 `S2-TC-B08` 的「字符串值 → 重渲跟随」）→ SC-TC-01 / 04 / 06 / 08 / 17 / **61**；2 表头可红的判别力（删值 / **手写串** / 挪出段三种坏形态）→ SC-TC-10 / 11 / 12（+ 02 的断言层）；3 四字段斜杠清零同一命令仍可红 → SC-TC-23 / 24 / 25 / 26（现值 13 归 SC-TC-57）；4 动作行四件（含「写回」/ 产物名非占位 / ≥3 种 / 不含三态词）+ 人设清零（**含 §11.4 `role` 也归人设面**）→ SC-TC-27 / 28 / 29 / 30 / 31 / 32；5 trigger 四型（含注入第 16 席 / 改一席 kind / 第二处名单相等 / `when` 前 12 字）→ SC-TC-33 / 34 / 35 / 36 / 37 / 38；6 长度与槽位（注入 21 字 + 三词计数）→ SC-TC-39 / 40 / 41 / 42；7 `HOST_TERM` 单源（探针 / 数据面 0 / 总数 30 不变（一次性档）/ 大写形态 0 + `${@` 残留 0 / **`rationale` 改写保占位** 18）→ SC-TC-43 / 44 / 45 / 46 / 47 / 48 / 49 / 60 / **30 ④⑤**；8 跨包三值相等 → SC-TC-20 / 21 / 22；9 回归面（gate + 15 席逐字节 + check 全绿 + 计数不低于基线 + **4 处漏项**，后者并入 06 / 33 / 43 + **回退面复验**）→ SC-TC-53 / 54 / 55 / 56 / 57 / **62**。**未覆盖 0 条。**

**B. spec §11.3 表 7 行改写断言「各自仍可红」**（任务点名的硬要求）：

| §11.3 表行 | 改后判据 | 绿态用例 | 「仍可红」用例 | 取值 |
|---|---|---|---|---|
| `S2-TC-A01` | 导出集合恰等四名（+ 第四导出值形态） | SC-TC-04 | SC-TC-05（多一） | 覆盖 |
| `S2-TC-A04` | 「判定取值：」开头 + 三值中文对照 + `reason` + 两句约束 | SC-TC-01 | SC-TC-02（顺序反 / 缺 `na` / 错字，含已合并的 SC-TC-03） | 覆盖 |
| `S2-TC-A05` | 坏值必须抛 | SC-TC-02（负例即绿态反面） | 同左 | 覆盖 |
| `S2-TC-A10` | 定义恰 1 + `TRISTATE` 0（+ `F05` 探针换值） | SC-TC-06 | SC-TC-07（回填） | 覆盖 |
| `S2-TC-D04` / `D05` | 段末无孤立四行 + 表头含 `VERDICT_HINT` + 恰一处「判定取值」 | SC-TC-08 / 10 | SC-TC-09 / 11（删值 → `bad 15`）/ 12（手写串 + 挪出段 → `bad 15`） | 覆盖 |
| `S2-TC-B08` | 副本内**前插** `VERDICT_HINT` 值 → 重渲跟随；真仓 0 命中 | SC-TC-61 | SC-TC-61 的真仓 0 断言 + 红态（内联死字面时不跟随） | 覆盖（**Q-1**：不再由 SC-TC-47 兼差） |
| `sdet-render.test.mjs:21` | 派生表头逐字 | SC-TC-14 | SC-TC-15（多空格） | 覆盖 |

**C. 任务点名的 15 项必覆盖面**（逐项 → 用例，含「未施行」）：

| # | 面 | 用例 | 状态 |
|---|---|---|---|
| 1 | 三态承载（5 行删除 + 表头含 `VERDICT_HINT` + 7 条改写断言各自仍可红 + 恰一处「判定取值」） | SC-TC-08 / 09 / 13 / 10 / 11 / 12 + 上表 B | 混合（16 实跑 / 其余未施行） |
| 2 | `VERDICT_HINT` 派生与单源（含 `S2-TC-F05` 探针换值） | SC-TC-01 / 02 / 04 / 05 / 06 / 07 | 未施行 |
| 3 | `cardFaceIds` 层① 删除后 `S2-TC-C01`–`C09` 不误红（`cardFaceIds` 计数已并入 SC-TC-06 第 ④ 步） | SC-TC-16（实跑 9/9）+ 17 / 18 / **06 ④** | 16 实跑，余未施行 |
| 4 | 跨包三值相等断言 | SC-TC-20 / 21 / 22 | 未施行 |
| 5 | 四字段斜杠串清零（改后 0 常驻 + 现值 13 一次性档 + 注入负例） | SC-TC-23 / 24 / 25 / 26（现值归 SC-TC-57） | 26 实跑，余未施行 |
| 6 | `duty.action` **四件**（含写回 15/15 / 产物名非占位 / ≥3 种 / 不含英中三态词）+ 人设 0 + 斜杠 0 | SC-TC-27 / 28 / 29 / 30 / 31 / 32 | 31 实跑（口径证据），余未施行 |
| 7 | `rationale` 人设句（`docs/agents` 三面 0） | SC-TC-29 / 30（`renderReadme.mjs:22` 投影面） | 未施行 |
| 8 | `trigger.kind` 四值 + 非议会席只许 `need`（名单现算含负例 + 第二处名单相等 + `when` 前 12 字 + `when` 逐字不动 + 键集加 `kind`） | SC-TC-33 / 34 / 35 / 36 / 38 | 38 实跑（③ 相等断言今天绿），余未施行 |
| 9 | `categories[].label` ≤ 20（含 21 字负例） | SC-TC-39（实跑 97/13）+ SC-TC-40 | 39 实跑 |
| 10 | `needs` / `purpose` / `method` 槽计数（**行口径 0 / 22 / 1**；出现次数 26 不引用） | SC-TC-41（实跑 0）+ SC-TC-42（实跑 22/1/0） | 实跑 |
| 11 | `HOST_TERM` 五条判据（① `shared.json` 值 + 键数 4 / ② 数据面字面 0（常驻）+ 18（一次性档）/ ③ 渲染 30（一次性档）/ ④ 副本探针不落盘 / ⑤ 大写形态 0 + `${@` 残留 0） | SC-TC-43 / 44 / 45 / 46 / 47 / 48 / 49 / **60** | 45 / 46 / 49 实跑（45/46 归一次性档），60 未施行 |
| 12 | `ret`+`urns` 计数 0（判据实现须拼接） | SC-TC-50 / 51 / 52 | 未施行（51 的构造有先例实据） |
| 13 | `gate` exit 0 + 15 席 `disk == render` | SC-TC-53（实跑 exit 0）+ 54 | 53 实跑 |
| 14 | `# tests ≥ 1481 + 本批新增` + **plan 的 `check-plan map`（V2：`missing 0 dangling 0`，`cases`/`mapped` 均 = 60）** | SC-TC-55（③ `# tests` + **④ `check-plan map`**）/ 56 | ④ **今日实跑 exit 0**；③ 未施行（纪律） |
| 15 | `SB_SHAPE_ONESHOT=1` 一次性档按新 BASE 重算（**含本批 4 个现值**） | SC-TC-57 + 23 / 26 / 44④ / 45 / 46 | 未施行 |

**D. spec §11.1 R1–R12 → 用例**：R1（08/09/10/11/12/15）、R2（01/02）、R3（04/05）、R4（20/21/22）、R5（16/17/18 + **06 ④**，原 SC-TC-19 已并入）、R6（06/07/14/15 + **43 ④⑤ / 33 ⑤ / 61 / 27 ⑤（`tool-tiers:623`）/ 29 ③（`sdet-data:26`）**）、R7（23/24/25/26）、R8（27/28/29/30/31/32 —— **29 的面宽含外层 `role`、30 含 `${@hostTerm}` 占位保全**）、R9（33/37）、R10（36/38）、R11（50/51/52）、R12（43/44/45/46/47/48/49/60 + **30 ④⑤**）。**无悬空 R**；新增的 **§11.7 ⑤**（不在 R 编号里）同样有用例（60），§11.14 的回退面与 §11.12 的 D6 延期落点同样有用例（**62**），故「spec 验收面 → 用例」无空档。

**E. 议会复核轮的 3 条新发现 + 2 条残余 → 用例**（本轮新表；逐条对应 §0.5）：

| 项 | 面 | 用例 / 步骤 | 状态 |
|---|---|---|---|
| BB-1 | `role` 属 `data/seats/<seat>.json` 的**外层字段**（不在 `card` 内）→ V9 三面清零的面宽必须含它；同批改 `sdet-data.test.mjs:26` | **SC-TC-29 ①（面宽）+ ③（`TC-007` 回归）**；**SC-TC-31 ①（面宽同宽）** | 未施行（施工后核） |
| QA 残余 | `rationale` 改写须保住全部 `${@hostTerm}`（`detective-observer.json:90` 一行 2 处） | **SC-TC-30 ④（仍 18）/ ⑤（漏 1 → 17 必红）**；**SC-TC-29 ④** 作连带约束；SC-TC-29 / 30 的「不覆盖」写明「`rationale` 文采不判」 | 未施行（施工后核；现盘 18 次 / `:90` 2 处可作构造证据） |
| 行号残余 | `tool-tiers.test.mjs` 的行号由复核轮校正为 `:623`（spec R6 / §11.2 #15 已同步） | 正文引用全部为 `:623`（旧号只在 §0.5 的改动台账里保留一次）；`:623` 的回归步落在 **SC-TC-27 ⑤** | 未施行（施工后核；现盘 `Select-String` 命中行 623 可证） |
| BB-2 | §11.14 回退复验「真做得到」无用例 | **SC-TC-62 ②③④**（`git diff --name-status $BASE` 的 `A` 面落六类新增白名单（8 项实体路径，含 **plan**）、其余状态面落**修改白名单（5 前缀 + 2 实名 = 7 项）** / `tools/docgen/` 前缀 `A` 面恰 3 件 / 步 3–4 复验入口可跑）；取数形态 = 真仓**只读**（副本无 `.git` 跑不了 git）；**轮次 6 改判（CC-1）——不再比 `??` 面计数**；**轮次 7 按 P0-2 补第 2 项实名（S-A testcase）+ 加「M-面逐行比对」** | 未施行（施工后核；B 缺 3 件故必红；提交前后同一套期望值） |
| BB-3 | D6 延期落点只是 `docs/after/` 目录名，不可核 | **SC-TC-62 ⑤**（实名文件存在 + 触发 / 谁兜两栏在位） | 存在性半条现盘可跑（`Test-Path` True）；两栏在位 **未施行** |

## 4 给开发的建议（8 条**全部已采纳**；每条标「改哪里 / 怎么改 / 为什么这里会炸 / spec 落点」）

> 本节不是「请施工方二选一」：8 条均已由 spec 作者裁定并回填 spec（§11.11 末段「testcase 的 8 条施工建议处置」）。施工方按 spec 落点施工，不再做选择。

1. **`check-tristate-header` 的判据要「逐字含派生串」，不能只判「含三键」**（`tools/docgen/check-tristate-header.mjs` 施工时）
   **状态 = 采纳（同 D-5）**，spec 落点 = **§11.3 新脚本判据第 2 行**（已改为此口径）。
   改哪里：判据行。怎么改：`const hint = VERDICT_HINT`，判 `headerLine.includes(hint)`（而不是三个键各 `includes` 一次）。为什么炸：只判三键时「手写串」只要写全三值就绿，而 spec §11.10-2 明确要求「改成手写串必须红」。落点用例 SC-TC-02 / 10 / 12。
2. **`check-trigger-kind` 的非议会席名单与 `cardPipeline.mjs:29` 的 `NON_PARL_SEATS` 必须有相等断言**
   **状态 = 采纳（同 D-4）**，spec 落点 = **§11.5 新增第 3 行**（「现算集合 == `complement(buildEnv(<任席>).parliamentSeats)`」，且**明写本段不改** `cardPipeline.mjs`）。
   改哪里：新脚本 + 一条测试。怎么改：脚本内现算（spec R10 已要求），测试里做上述相等断言。为什么炸：`NON_PARL_SEATS` 是**写死**的两席（`cardPipeline.mjs:29`），第 16 席出现时它不会更新 → `env.parliamentSeats` 与脚本判据分叉，而两处都「绿」。落点用例 SC-TC-38。
3. **人设词面收窄到 `20 年`（不能停在 `20 年经验`）**
   **状态 = 采纳**，spec 落点 = **§11.8 V9**（词面已回填 `资深` + `20 年`，口径 = 出现次数）。
   改哪里：判据常量（测试文件内一个 `PERSONA_TERMS` 数组）。怎么改：`['资深', '20 年']`。为什么炸：现盘 `20 年经验` **0** 命中，而 `深耕产品设计 20 年以上` 有命中（`reviewer-product.json:9` / `:120`）→ 用旧词面会漏检，施工后仍绿 = 假绿。落点用例 SC-TC-29 / 31。
4. **`HOST_TERM` 的计数要写「出现次数」并用 spec 已定的基线值（18 / 30）—— 两者都归一次性档（Q-3）**
   **状态 = 采纳（同 D-2 / D-3 / Q-3）**，spec 落点 = **§11.7 ②（18，出现次数口径）+ §11.7 ③（30）+ §11.9 末条（现值型断言归 `SB_SHAPE_ONESHOT=1`）**。
   改哪里：SC-TC-44 / 46 的期望值 + 它们的执行档。怎么改：口径统一为出现次数；18 / 30 都是**本批现值**，只能拿 `SB_BASE=<本批 $BASE>` 比（清单见 SC-TC-57），**常驻档只留「字面 0」**——否则下一批改文案就假红（这是 Q-3 的实质）。为什么炸：按行断会漏 `detective-observer.json:90` 的第 2 处；而写 28 会恒红；把 18 / 30 写进常驻档则会让后续批次集体假红。落点用例 SC-TC-44 / 45 / 46 / 57。
5. **`# tests` 的基线口径只能认 `npm run check`，施工第 0 步先复现 `# fail 0`**
   **状态 = 采纳（同 D-1）**，spec 落点 = **§11.9 两条硬约束**（「本批必须自建 impact-sheet 覆盖 33 个口径 ID」「施工第 0 步先复现 `# fail 0`」）。
   改哪里：施工第 0 步。怎么改：先跑一次 `npm run check` 并把 `# tests / # fail` 记进账本；若 `# fail ≠ 0`，先定位再动卡面（现态已 `# fail 0`，见 §0.1）。为什么炸：若带着红进施工，V3 的「`# fail 0`」在施工后无法归因（本批改坏 vs 本来就红）。落点用例 SC-TC-55。
6. **`sdet-render.test.mjs:21` 改写时不要内联三值字面**
   **状态 = 采纳（已在 spec 就有）**，spec 落点 = **§11.3 表末行**（「逐字 `\| # \| 条目 \| 判据（` + `VERDICTS` 派生串 + `） \| 类型 \|`，不写字面三值」）。
   改哪里：该行断言。怎么改：写成 `` `| # | 条目 | 判据（${VERDICT_HINT}） | 类型 |` `` 或用派生片段拼；理由同 `S2-TC-A01` 的「字面数组即第二份真相」。为什么炸：直接写字面 `hit / miss / na` 会让「卡面契约唯一写死处」变成两处（`S2-TC-E07` 的判别力下降）。落点用例 SC-TC-14 / 58。
7. **施工第 −1 步：让 `scope-sweep --check` 保持绿（4 条 fail 的共同根因）**
   **状态 = 采纳（同 D-1）**，spec 落点 = **§11.9 硬约束行**（impact-sheet 覆盖 33 ID）+ **§11.9 判据命令禁 `node -e`**。
   改哪里：本批开工前。怎么改：跑 `node scripts/scope-sweep.mjs --check`，现态应为 `sweep ok`（exit 0）；若红，按 R8 把本次改判（`VERDICT_HINT` / `hostTerm` / `trigger.kind` 三个口径名）登记进 `tools/scope-sweep/keywords.json` 的清单与 `impact-sheet.md`。为什么炸：4 条 fail（`OCR-S1-TC-F08` / `S4-TC-J04` / `S2-TC-G01` / `S3-TC-K04`）都在断言 sweep 绿；不保持绿，S-C 的 `npm run check` 会红，而施工者会误判成「本段改坏了」。落点用例 SC-TC-55。
8. **`hostTerm` 的大小写是「静默失败」边界，判据要兜住「写错大小写」的插值形态**
   **状态 = 采纳（同 D-7，新增判据）**，spec 落点 = **§11.7 ⑤**（大写形态 0 + 展开后 `${@` 残留 0），并在 §11.10-7 末句同步。
   改哪里：`check-shared-refs`（S-A 既有）或本段新增一条断言。怎么改：断言 `seats/*.json` 里 `@HOST_TERM` / `${@HOST_TERM}` 命中 0，**且**展开后的卡面不含 `${@` 残留。为什么炸：`expandRefs` 的插值正则要求首字符 `[a-z]`（`seatLoader.mjs:18`），大写**不匹配也不会抛错**——现盘实测 `expandRefs('${@HOST_TERM}', …)` 原样返回 `${@HOST_TERM}`。后果：数据面写了 `@` 引用却留下字面，渲染与盘上**同源同错**，`gate` 仍绿 → 只有这条判据能抓到。落点用例 SC-TC-49 / 60。

## 5 差异清单（对 spec 的**异议**；四段式：spec 原文口径 / 本席读法 / 为什么分叉 / **已裁定（处置 + 落点）**）

> 13 条（D-1…D-8 + D-a…D-e）**全部已有裁定，未决 = 0**（D-1…D-7 由 spec §11.11 逐条回填；**D-8 已消解**——spec §11.14 步 1 现已覆盖 handoff，见该格；残余只在 plan 面，由 SC-TC-62 ② 的 ⓹ 判据侧补齐，本席仍不代改 spec）。本节只记录「异议是什么 / 裁定是什么 / 落在了哪」，不代改 spec。

| # | 差异点 | spec 原文口径（提异议时） | 本席读法 / 可核证据 | **已裁定：处置 + 落点** |
|---|---|---|---|---|
| **D-1** | 基线 `# fail 0` | spec 头部记 `# tests 1481 / # pass 1476 / # fail 0 / # skipped 5`，而本席起草期实跑得 `# fail 4`（4 条 = `OCR-S1-TC-F08` / `S4-TC-J04` / `S2-TC-G01` / `S3-TC-K04`，根因同一条 = `scope-sweep --check` exit 1） | 4 条**同一根因**，不是 4 个独立缺陷。**根因归属 = 本批自建 impact-sheet 漏写 33 个口径 ID**（起草期只写了 K1–K3），不是 spec 基线写错 | **已裁定（不成立为 spec 错误，成立为 impact-sheet 漏口径）**：补全 33 个口径 ID + 18 个命中文件 → `sweep ok`（exit 0）、`# fail 0`（2026-11-04 作者复跑）。处置 = 不回改 spec 基线，改为**加硬约束**。落点 = **spec §11.9 新增两条硬约束**（impact-sheet 覆盖 33 ID / 施工第 0 步复现 `# fail 0`）+ **本文件 §0.1**（全量测试、`scope-sweep`、`check` 末行三行按新值改写）+ **SC-TC-55**（引作者复跑值，标注来源） |
| **D-2** | `HOST_TERM` 的「17 处」 | spec §11.7 ② 原文「席位数据 17 处字面全改 `${@hostTerm}`」 | 实测 **17 行 / 18 处**（差 1 = `detective-observer.json:90` 一行内 2 处）。按行断会把第 2 处漏成「已改」 | **已裁定（按出现次数）**：判据两条 = 字面出现次数 0 + `${@hostTerm}` 出现次数 18。落点 = **spec §11.7 ②**（已改 18 并写死口径）+ **本文件 §0.1 / §0.2 / SC-TC-44 / SC-TC-45** |
| **D-3** | 渲染面「总数 28」 | spec §11.7 ③ 原文「渲染后 15 卡『主持人』总数 = **28**」 | 实测 **30** = 12 席 × 2 + `detective-observer` 6（盘面与内存 `renderSeat` 两路同值） | **已裁定（按 30）**：改后必须**仍是 30**（等价性证明，不多不少）。落点 = **spec §11.7 ③ + §11.10-7**（已改）+ **本文件 §0.1 / SC-TC-46** |
| **D-4** | 非议会席名单「现算」的落点 | spec §11.1 R10 / §11.5 只写「名单现算、不写死」 | `cardPipeline.mjs:29` 另有一份写死的 `NON_PARL_SEATS = ['evidence-reader','senior-sdet']`（喂 `env.parliamentSeats`），spec 未点名它 → 两处不同源 | **已裁定（加相等断言、不改该名单）**：断言形态 = 现算集合 == `complement(buildEnv(<任席>).parliamentSeats)`；`cardPipeline.mjs` 本段**不改**（改会波及 S1 判据面）。落点 = **spec §11.5 新增第 3 行** + **本文件 SC-TC-38（③ 即该相等断言）** |
| **D-5** | 表头判据强度 | spec §11.3 原文「该行须**同时含 `VERDICTS` 三键**」；§11.10-2 要求「改成手写串必红」 | 两条不同强度：只判三键时「手写串写全三值」仍绿，与 §11.10-2 互斥 | **已裁定（取更严那条）**：逐字包含 `VERDICT_HINT` 的派生串。落点 = **spec §11.3 新脚本判据第 2 行**（已改）+ **本文件 SC-TC-10 / SC-TC-12**（不再有「施工方二选一」） |
| **D-6** | `purpose` 全树现值 | spec §11.6 原文「`purpose` 22（`commands.mjs` 9 + `policy-pure-source.test.mjs` 13）」 | 行口径确为 **22 行**（9 + 13）；按出现次数另计 **26**（`policy-pure-source.test.mjs` 17 + `commands.mjs` 9）。本席上一版误把 26 当行口径 | **已裁定（按行口径 22）**：出现次数 26 另计且**判据不引用**。落点 = **spec §11.6 首段**（已注明口径）+ **本文件 §0.1（新增三词行）/ §0.2 口径 3 / SC-TC-42** |
| **D-7** | 大写**插值**形态的静默失败 | spec §11.1 R12 只写「`@HOST_TERM` 非法」；§11.7 当时的四条判据都不覆盖「写错大小写的插值」 | 实测 `expandRefs('${@HOST_TERM}', …)` **不抛错、原样返回**该字面；插值正则 `PART = /\$\{@([a-z][A-Za-z0-9]*)\}/g`（`seatLoader.mjs:18`）要求首字符小写 → 既不匹配也不报错，而 `gate` 比「盘 == 渲染」同源产物仍绿 | **已裁定（补判据）**：`seats/*.json` 内 `@HOST_TERM` / `${@HOST_TERM}` 出现 0 **且**展开后 15 卡 `${@` 残留 0。落点 = **spec §11.7 ⑤（新增）+ §11.10-7 末句** + **本文件 SC-TC-49（纯函数面）/ SC-TC-60（数据面 + 渲染面，本轮拆分新增）** |
| **D-8**（轮次 4 新增 → **已消解**） | §11.14 步 1 的回退复验白名单**只列六项**，未列本批另一件新增交付物 | spec §11.14 步 1 原文（**提异议时**）：只列「两个新脚本、`tools/docgen/test/sc-card-shape.test.mjs`、spec、testcase、`docs/after/20261104101304-…`」；**现读 spec（2026-11-04 10:32:43，晚于本 testcase 10:31:54）该行已改为**「…+ 交接词 `docs/handoffs/2026-11-04-s-c-card-shape.md`（开工前就在跟踪外，回退前须先提交或移出）」 | 现盘 `git status --porcelain` = **5 项**（`docs/after/…` / handoff / **plan `docs/superpowers/plans/2026-11-03-s-c-card-shape.md`** / testcase / spec，`(git status --porcelain).Count` = 5）；其中 **handoff 已被 spec 覆盖**，**plan 仍未被 spec 白名单列出**（步 1 的 `git checkout` 覆盖面不含 `plans/` → 它必然留在 `??` 面）；`tools/docgen/fixtures/*.evidence.json` / `agents/*.md` / `docs/agents/**` 属 `git checkout` 覆盖面或**已跟踪**，不会以 `??` 出现 | **已消解（handoff 面）**：原异议「spec 侧未改」**不成立**——spec §11.14 步 1 已写进交接词与其处置（回退前提交或移出），且 spec mtime 晚于本 testcase，故本席撤回该条异议，不再要求 spec 补句。**残余（plan 面）由判据侧补齐**：SC-TC-62 ② 白名单按**六类**展开为 **8 项实体路径**（⓵ handoff / ⓶ spec / ⓷ testcase / ⓸ `docs/after/…` / **⓹ plan** / ⓺ 施工期新增 3 件），判定按 `git diff --name-status $BASE` 的 `A` 面（**轮次 6 CC-1 已删「施工后剩 8 项 / 7 项」那套计数断言**——它依赖未提交状态，提交后恒红）；**本席不改 spec**（往 spec 白名单塞 plan 等于改 spec 口径）。落点 = **SC-TC-62 前置 / 取数形态 / ② / 预期 + 本文件 §0.1 的 porcelain 行**（轮次 5 按审计 P1-2 / P1-3 改写、轮次 6 按 CC-1 改判） |

**§11.11 前五行（D-a…D-e）的「testcase 指出」列与裁定**（spec 侧已逐条回填，本席不代改 spec）：

| spec §11.11 # | 本席指出的内容 | 落点用例 | **已裁定（spec 回填位置）** |
|---|---|---|---|
| D-a | 现状 `trigger` 键集实测 = `when+route`（14 席）/ `when+route+notWhen`（1 席 `senior-sdet`），`kind` 0 席 → S-C 须补落，且 `notWhen` 席不影响 `kind` 判据 | SC-TC-33 / 37 | **已裁定（按「S-C 补落」）**：spec §11.1 R9 / §11.5 不变，`notWhen` 席不另设规则 |
| D-b | `hostTerm` 键名合法性的**机械理由**已核：`seatLoader.mjs:17` 的 `WHOLE = /^@([a-z][A-Za-z0-9]*)$/` 首字符必须小写，`@HOST_TERM` 会走到 `:46` 的 `NestedSharedRef` | SC-TC-49 / 60 | **已裁定（按数据键）**：spec §11.1 R12 不变，另补 §11.7 ⑤ 大写插值兜底 |
| D-c | 「`≤ 5 条` 不适用」本席同意，且判据落「卡模型键面三词 0」，不判条数（现 `categories` 4–9 条） | SC-TC-41 / 42 | **已裁定（按不适用）**：spec §11.6 第三段与 §11.10「不测」保留 |
| D-d | 改夹具键名可行：现盘 3 处命中全在 `sa-data-layer.test.mjs:120/122/559`，均为**测试夹具**而非 schema；改后判据不动 | SC-TC-50 / 51 / 52 | **已裁定（按改夹具）**：spec §11.1 R11 / §11.2 #13 不变 |
| D-e | 三态中文释义并入 `VERDICT_HINT` 后**仍可判**（只判含 `reason` 字样与派生前缀；措辞逐字比属文档域） | SC-TC-01 / 04 | **已裁定（按并入）**：spec §11.1 R2 不变 |

**未决 = 0**：D-1…D-8 与 D-a…D-e 共 13 条，逐条有「处置 + 落点」。作业性表述（「请施工方选一条后回填」「待 spec 作者裁定后再说」）已全部清除；本文件里仍出现「二选一」字样的三处均为**说明「该表述已被废止」的元陈述**（本行、§0.3 末句、§5 D-5 格），不指向任何待办。**D-8 的处置不需要 spec 改文**（轮次 5 改口径）：handoff 面**已被 spec §11.14 步 1 覆盖**（该格已撤回异议）；plan 面由 **SC-TC-62 ② 的六类白名单（8 项实体路径）**判，本条判据自成闭环——「spec 再补一句」**不再登记为建议**（撤回，无待办遗留）。

**议会轮 1 的 9 条（5 P0 + 4 P1）不在本表**：它们是评审对**本文件**的裁定，逐条落点见 §0.4（含 Q-1…Q-5 / A-2 / A-3·R-2 / B-2 / A-4 与 B-1 的 4 处漏项），此表只记「本席对 spec 的异议」。两张表都不含待办——本轮回填后**未决 = 0**。

**本节的一处口径变化（B-2）**：D-3 格与 D-4 格原先没有「`when` 该不该改」的表述；spec 整篇重写后已明确 **`reviewer-audit` 的 `when` 一字不动**（改的是它的 `duty.action`），本文件此前的任何「改 `when`」措辞已全部删除，只在 SC-TC-33 第 ⑤ 步留一条**逐字不变量断言**。

## 6 本席自检（角色卡「一定会」5 条 + 本席清单 9 条；`hit` / `miss` / `na` + `reason` + `evidence`）

**「一定会」5 条**

| # | 取值 | reason | evidence |
|---|---|---|---|
| 1（结论段依据计数 ≥ 2、各带 path:line、来自 ≥2 文件） | hit | — | §5 D-2 引 `tools/docgen/data/seats/detective-observer.json:90`；§5 D-3 引 `tools/docgen/components/renderCard.mjs:69`（表头行）与 `agents/reviewer-product.md` 的渲染面；§5 D-4 引 `tools/docgen/components/cardPipeline.mjs:29`；§5 D-1 引 `npm run check` 输出行与 `node scripts/scope-sweep.mjs --check` 首行（§0.1 两行） |
| 2（path:line 指向的文件存在且该行含被引摘句） | hit | — | `cardPipeline.mjs:29` 该行原文 `const NON_PARL_SEATS = ['evidence-reader', 'senior-sdet']`；`seatLoader.mjs:17` 原文 `const WHOLE = /^@([a-z][A-Za-z0-9]*)$/`；`renderReadme.mjs:22` 原文 `String((card && card.rationale) || '')` |
| 3（英文术语首现行含中文解释） | hit | — | §0 代号表对 `PROBE` / `COPY` / `COPY-取数` / `COUNT` / `BASE` / `SHAPE` 逐个给了中文释义；`PROBE` 首现行写明「落进……该条用例体，单跑」；`COPY-取数` 首现行写明「子进程只取数、`assert` 留父测试」 |
| 4（findings 集合为空时须写「全过、无问题」） | na | findings 集合**非空**（§4 八条建议（均已采纳）+ §5 十二条异议（均已裁定）+ §0.4 九条议会卡（均已落点）），故不适用该句 | §4 / §5 / §0.4 段落本身即证据 |
| 5（附录 findings 集合为空时须写「全过、无问题」） | na | 本文件无独立附录节；findings 已全部落在 §0.4 / §4 / §5 | 同上 |

**本席清单 9 条**

| # | 条目 | 取值 | reason | 原文引句（evidence） |
|---|---|---|---|---|
| 1 | 输入空间核对 | hit | 输入空间 = 15 席 + 15 卡 + 16 份 `docs/agents`（15 席 + README）+ 5 处冻结断言（PRD §5 点名）+ **议会轮 1 的 B-1 补出 4 处**（`shared.json` 键数 / `trigger` 键集 / `F05` 探针 / `when` 逐字）+ **复核轮补 2 处**（`role` 外层字段 / `tool-tiers.test.mjs:623`）+ 4 处连带引用点 + 2 个新脚本 + 本批新增测试 + 延期落点文件 | spec §11.2 落点位表（15 行）与 §11.3 表（7 行）——引 `docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md:38`（`删 TRISTATE，加 VERDICT_HINT`） |
| 2 | 状态与转移核对 | hit | 三处状态转移全落用例：`TRISTATE` → `VERDICT_HINT`（01/06/61）、层① → 许集（16/17）、`when` 之外**新增** `kind`（33/37；`when` 本身不动） | spec §11.3「5 行常量与表头的『判据』列是同一件事的两处」（同文件 `:21`） |
| 3 | 失败面核对 | hit | 失败面 17 条负例 + **22** 条边界，覆盖「多一 / 少一 / 顺序反 / 缺值 / 手写串 / 挪出段 / 注入斜杠 / 21 字 / 第五 kind / 第 16 席 / 回填键名 / 回填占位 / 全席同名 / 中英三态词 / 不重生 / **弄丢 `${@hostTerm}` 一处（30 ⑤）/ 回退后 `A` 面出现白名单外一项（62 ② A）/ 白名单内缺一项（62 ② B）/ `check-plan map` 出现 missing / dangling（55 ④）**」 | PRD §4 的每个 V 项都带「改坏应红」列，逐条已对号（§3 表 A/B/C/E） |
| 4 | 判据来源核对 | hit | 每条用例的「覆盖」栏指回 spec 节号 / R 编号或 PRD V 编号；无一条只写「spec 说」而不给编号 | 本文件 §2 各条首行 + §3 表 D（R1–R12 全覆盖） |
| 5 | 确定性核对 | hit | 所有判据的取数命令可复算且不依赖时间 / 随机 / 网络；探针类明确「内存、不落盘」；副本取数统一走 `COPY-取数`（子进程只打印、父测试断言）；**`git status --porcelain` / `git diff --name-status $BASE` 类取数走真仓只读**（两个副本构造函数都不含 `.git`，见 SC-TC-62「取数形态」） | SC-TC-47 / 61 的「不落盘 / 真仓 0」断言 + SC-TC-51 的「拼接构造」反证 + §0 `COPY-取数` 行 + SC-TC-62 的「取数形态」行（引 `dev-workflow-checks.mjs:246` / `card-fixtures.mjs:21`） |
| 6 | 回归资产核对 | hit | 回归面 = 既有 `S2-TC-C01`–`C09`（实跑 9/9）+ `sdet-render`（4/4）+ `gate`（exit 0 + `baseline 38/38`）+ `REF`（ok）+ `npm run check`（作者复跑 `# fail 0`、末行 `check 全部通过`）+ 7 条改写断言（§3 表 B）+ **4 处漏项的回归步（06 ⑤ / 33 ⑤ / 43 ④⑤）** + **本轮补入：`sdet-data.test.mjs:26`（`role`，29 ③）/ `tool-tiers.test.mjs:623`（27 ⑤）/ §11.14 回退复验（62）** | §0.1 的实跑行（`tests 9 / pass 9 / fail 0`、`tests 4 / pass 4 / fail 0`、`gate exit=0`、`REF` 首行、`# tests 1481 / # fail 0`、`check 全部通过`、`sweep ok`）+ §0.1 的 `role` / `tool-tiers` 行号行 |
| 7 | 判别力核对 | hit | 每条「必须是判据」的用例都给了负例或现盘必红证据；SC-TC-26 / 42 / 45 / 60 专判「口径与构造判别力」（错口径 → 假绿 / 假红）；现值型数字（13 / 18 / 17 / 30）一律进一次性档（SC-TC-57） | SC-TC-26 现盘 0 vs 13；SC-TC-42 现盘 **行口径 22 行 vs 卡模型键面 0**（出现次数 26 仅作对照）；SC-TC-45 现盘 17 vs 18；SC-TC-60 的构造由 SC-TC-49 的 `part_upper` 实测兜 |
| 8 | 盲点雷达核对 | hit | 本轮回填的盲点：`VERDICT_HINT` 探针被错指（SC-TC-61）、共用函数导致的 `bad 1` 误判（SC-TC-11）、现值断言会随批次假红（SC-TC-44/45/46/57）、手写串负例缺失（SC-TC-12）、动作行「空转」与中文三态（SC-TC-27/28/32）、`when` 被误改的风险（SC-TC-33 ⑤）；**复核轮再补**：`role` 在 `card` 之外易被面宽漏掉（29 ①/③）、`rationale` 改写会顺手弄丢 `${@hostTerm}`（30 ④⑤）、回退面「说得做得到」但无用例（62）、延期落点只有目录名不可核（62 ⑤）、`tool-tiers` 行号漂移（27 ⑤）；**审计轮（轮次 5）再补 3 处**：`V2` 整条验收项零命中（并入 **55 ④**）、白名单照抄 spec 而漏 handoff / plan 且与实测 5 项不符（**62 ②**）、`D-8` 前提失效（spec 已改）却仍称「spec 侧未改」（**§5 D-8 已消解**）；**附带修正**：`SC-TC-62` 原用 `COPY` 取 `git status` 而副本无 `.git`（不可实现）→ 改真仓只读；**复核轮（轮次 7）再补 1 处**：M-面白名单漏一项**已跟踪**的改动件（S-A testcase：plan Task 5 要改其 `TC-015` 文案 → 施工后必以 `M` 出现 → 恒红），已按 spec §11.14 步 1 现读清单补入并加「M-面逐行比对」（**62 ② / 红绿证据 ③**） | §0.4 九条 + §0.5 五条 + §5 D-2 / D-3 / D-4 / D-7 / **D-8（已消解）**（均带裁定与落点） |
| 9 | 覆盖账核对 | hit | 覆盖账四张表（§3 A/B/C/**E**）+ 计数核算（正 21 / 负 17 / 边界 **22** = **60**，= 硬上限 60）；每条依赖未施工产物的用例都在「红绿证据」栏标了 `未施行（施工后核）` + 理由 | §1 末「计数核算」与 §3 表 C / E 的「状态」列 |

**修订轮次 2 的回填核对（按 spec §11.11 的 12 条裁定）**

| 核对项 | 结果 | 证据 |
|---|---|---|
| 12 条裁定全部回填、未决 = 0 | hit | §0.3（7 条 + 落点）+ §5（D-1…D-7、D-a…D-e 各带「已裁定：处置 + 落点」）+ §5 末「未决 = 0」句 |
| §0.1 事实与 spec 同值（`# fail 0` / `17 行 18 处` / 渲染 30 / `purpose 22 行`·26 次 / 人设词三面） | hit | §0.1 前 9 行与 spec 头部 / §11.7 / §11.8 V9 / §11.6 首段逐字同值 |
| §4 八条不再写「二选一」 | hit | §4 每条带「状态 = 采纳 + spec 落点」；本节标题下的提示句明写不再做选择 |
| 用例条数 ≤ 60 且负 + 边 ≥ 正 | hit | 59（≤ 60）；正 21 / 负 17 / 边 21；38 ≥ 21（修订轮次 3 后现算） |
| 未改 spec / 未改代码 / 未跑 `npm run check` | hit | 文件头「声明（纪律）」；本轮 diff 仅落在本文件 |

**修订轮次 3 的回填核对（按议会轮 1 的 5 条 P0 + 4 条 P1）**

| 核对项 | 结果 | 证据（落点用例） |
|---|---|---|
| Q-1 补出独立用例（承接 `S2-TC-B08`） | hit | **SC-TC-61**（副本内前插 `VERDICT_HINT` 值 → 15/15 跟随、真仓 0）；SC-TC-47 已声明「不兼差」 |
| Q-2 删值负例期望改 `ok 0 / bad 15` | hit | **SC-TC-11**（并同源修正 SC-TC-12 的挪出段期望） |
| Q-3 现值型断言全归 `SB_SHAPE_ONESHOT=1` | hit | **SC-TC-23 / 26 / 44④ / 45 / 46** 执行档改 `SHAPE`；清单登记在 **SC-TC-57 ⑤**；§0 SHAPE 行与 §0.1 抬头同步 |
| Q-4 补「手写串」负例 | hit | **SC-TC-12** 第 ① 步（手写 `hit / miss / na` 全串 → `bad 15`），挪出段作第 ③ 步保留 |
| Q-5 `COPY` 取数形态改「子进程只取数、`assert` 留父测试」 | hit | §0 **`COPY-取数` 行** + §2 抬头声明；「`coldRepo` 内 import 副本」的不可实现写法已从 SC-TC-05 删除 |
| A-2 动作行禁三态词（英 + 中） | hit | **SC-TC-27 ④** + **SC-TC-32**（英文 / 中文各一个注入负例） |
| A-3·R-2 产物名非占位 + ≥3 种 | hit | **SC-TC-27 ②③** + **SC-TC-28**（回填占位 / 全席同名两条负例） |
| B-2 `reviewer-audit` 的 `when` 一字不动 | hit | **SC-TC-33 ⑤**（逐字不变量 + `pilot-data.test.mjs:23-28` 绿）；本文件其他「改 `when`」表述已删 |
| A-4 `kind` 依据数据声明 + 输出附 `when` 前 12 字 | hit | **SC-TC-33 ③④**；红态首行 `=> fail` 落在 **SC-TC-34 / 35 / 36** |
| B-1 4 处漏项回归（不各占一条） | hit | `shared.json` 键数 3→4 → **SC-TC-43 ④⑤**；`trigger` 键集加 `kind` → **SC-TC-33 ⑤**；`F05` 探针换值 → **SC-TC-06 ⑤**；`when` 逐字 → **SC-TC-33 ⑤** |
| 条数 ≤ 60：新增与同主题旧条合并 | hit | 已合并 SC-TC-03 → 02、SC-TC-19 → 06；新增 1 条（SC-TC-61）；净 59 |
| 判据纪律（禁 `node -e` / 不拿 `Select-String`·`git diff` 退出码当判据 / `ret`+`urns` 拼接） | hit | §0 的 `PROBE` / `COUNT` 行 + SC-TC-50 / 51 的拼接构造未改 |
| 未改 spec / 未改代码 / 未跑 `npm run check` | hit | 文件头「声明（纪律）」；本轮 diff 仅落在本文件 |

**修订轮次 4 的回填核对（按议会复核轮的 BB-1 / BB-2 / BB-3 + 2 条残余）**

| 核对项 | 结果 | 证据（落点用例 / 步骤） |
|---|---|---|
| BB-1 `role` 属**外层字段**、面宽须含它 | hit | **SC-TC-29 ①**（扫描面写明「`seats` 面取全文、含 `card` 之外的 `role`」，引 `senior-sdet.json:3`）；**SC-TC-31 ①**（面宽与 29 同宽） |
| BB-1 同批改 `sdet-data.test.mjs:26` 的回归步 | hit | **SC-TC-29 ③**（`node --test --test-name-pattern "TC-007" tools/docgen/test/sdet-data.test.mjs` exit 0；该断言 `:26` 已去 `资深`） |
| QA 残余：`rationale` 改写保全部 `${@hostTerm}` | hit | **SC-TC-30 ④⑤**（④ 仍 **18**；⑤ 漏 1 处 → **17** 必红；`detective-observer.json:90` 一行 2 处作构造证据）；**SC-TC-29 ④** 作连带约束 |
| QA 残余：`rationale` 文采不判 | hit | **SC-TC-29 / 30** 的「不覆盖」各写明「`rationale` 文采 / 措辞切题性机械判不了」 |
| 行号：`tool-tiers.test.mjs` 校正为 `:623` | hit | 正文引用已全为 `:623`（旧号仅 §0.5 台账保留一次）；`:623` 的回归步落 **SC-TC-27 ⑤**（`S5-TC-C08` 构造前提换新 action 片段）；§0.1 新增行号行 |
| BB-2 回退面复验可做 | hit | **SC-TC-62 ②③④**（`??` 面落六类白名单（8 项实体路径，含 **plan**）/ `tools/docgen/` 前缀恰 3 件 / 步 3–4 复验入口 exit 0）；**轮次 5 已按实测 5 项 porcelain 与 P1-2 重写**（原「恰六项」漏 handoff 与 plan）；**轮次 6 按 CC-1 再改判为 `git diff --name-status $BASE`（见文末「修订轮次 6 的回填核对」）** |
| BB-3 延期落点实名 + 可核 | hit | **SC-TC-62 ⑤**（`docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` 存在 + 触发 / 谁兜两栏在位）；§11.12 的「`docs/after/` 目录名」表述改为实名 |
| BB-2 / BB-3 之外的 3 条均为**加步**，条数顶格 60 | hit | §1 末「计数核算」：正 21 / 负 17 / 边 22 = 60；新增仅 SC-TC-62 |
| 未改 spec / 未改代码 / 未跑 `npm run check` | hit | 文件头「声明（纪律）」；本轮 diff 仅落在本文件；§5 **D-8** 的 spec 侧口径已在轮次 5 撤回（spec §11.14 已改，见该格） |

**修订轮次 5 的回填核对（按审计打回的 3 条 P1：P1-1 / P1-2 / P1-3）**

| 核对项 | 结果 | 证据（落点用例 / 步骤） |
|---|---|---|
| P1-1 `V2` 无用例（spec §11.8 V2 = plan 的 `check-plan map`，本文件 `V2` 原 **0 命中**） | hit | **SC-TC-55 第 ④ 步**：`node scripts/check-plan.mjs map --plan docs/superpowers/plans/2026-11-03-s-c-card-shape.md` → `map: missing 0 dangling 0（cases 60 / mapped 60） => ok`、`exit 0`；SC-TC-55 的「覆盖」栏补 **spec §11.8 V2 / PRD §4 V2**；§0.1 新增 `check-plan map` 行；§1 覆盖总表 SC-TC-55 行 + §3 表 C 第 14 项同步。**未新增用例** |
| P1-2 `SC-TC-62` ② 白名单与实测不符（实测 porcelain **5 项**，原白名单漏 handoff 与 plan） | hit | **SC-TC-62 ②** 改为**六类白名单（展开 8 项实体路径）**：⓵ handoff / ⓶ spec / ⓷ testcase / ⓸ `docs/after/…` / **⓹ plan `docs/superpowers/plans/2026-11-03-s-c-card-shape.md`** / ⓺ 施工期新增 3 件；写死「施工后剩 **8 项**（⓵ 留盘）/ **7 项**（⓵ 已提交或移出），步 2 后 5 / 4 项」；A/B/C 三条断言；§0.1 现状行 **4 项 → 现测 5 项** + 取数命令 `(git status --porcelain).Count` |
| P1-2 附带：`COPY` 取 `git status` 不可实现（两个副本构造函数都不含 `.git`） | hit | **SC-TC-62 新增「取数形态」行**：引 `tools/docgen/test/support/dev-workflow-checks.mjs:246`（复制清单无 `.git` / `docs/**` / `scripts`）与 `card-fixtures.mjs:21`/`:39`（过滤 `.git`）→ 改**真仓只读**取 stdout 集合 + 父测试静态判；§1 执行方式列同步改 `COUNT`（真仓只读）+ 静态断言；「不覆盖」写明 `git checkout` 复原效果归步 4 |
| P1-3 `D-8` 前提失效（spec §11.14 步 1 已覆盖 handoff，原格仍称「spec 侧未改」） | hit | **§5 D-8** 标 **已消解**（handoff 面撤回异议，写明 spec mtime `10:32:43` 晚于本 testcase `10:31:54`）；残余只在 **plan 面**，由 SC-TC-62 ② ⓹ 承担；§5 引言与「未决 = 0」段同步（不再登记「spec 补一句」的建议） |
| `tool-tiers.test.mjs:624` 残留 | hit | 全文复核：正文引用均为 `:623`；`:624` 只在 §0.5 的改动台账里作为**旧号**出现 **1 次**（该格明确写「改动台账保留旧号一次」） |
| 条数上限 / 三值 | hit | §1 末「计数核算」：**正 21 / 负 17 / 边 22 = 60**（轮次 5 未新增条目，`V2` 走加步） |
| 判据纪律（禁 `node -e`；不拿 `Select-String` / `git diff` 退出码当判据） | hit | SC-TC-55 ④ 与 SC-TC-62 判据行各写明：`check-plan.mjs` / `git status` **只取 stdout 或脚本自身判定**，`git status` / `execFileSync` 的退出码不作判据 |
| 未改 spec / 未改代码 / 未改 plan / 未跑 `npm run check` | hit | 文件头「声明（纪律）」；本轮 diff 只落在本文件；只跑了**只读**命令 `git status --porcelain` 与 `node scripts/check-plan.mjs map` |

**修订轮次 6 的回填核对（按终核轮的 1 条 P0：CC-1）**

| 核对项 | 结果 | 证据（落点 / 改判形态） |
|---|---|---|
| CC-1：`SC-TC-62` ②③ 把「`??` 面恰 N 项必现」写成**常驻**断言 → 施工后提交（`git add` 后变 `A `）即归零、恒红，且与 spec §11.9 / plan Task 0 互斥 | hit | ② / ③ / 预期 / 判据 / 红绿证据全部改判为 `git diff --name-status $BASE`（`$BASE` = 施工第 0 步 `git rev-parse HEAD`，SC-TC-57 ① 同值）：**`A` 面 ⊆ 六类新增白名单（8 项）+ 其余状态面 ⊆ 修改白名单 + ③ 的 `tools/docgen/` 前缀 `A` 面恰 3 件**；「施工后剩 8 / 7 / 5 / 4 项」与「`??` 面恰 N 项」类计数**整段删除**（② 末 bullet「本条不比计数」） |
| 常驻档不再依赖未提交状态 | hit | 本条判据与提交状态无关（`$BASE` 之后的提交同样计为 `A`）；`??` 面只留在 §0.1 的现值行与 §5 D-8 的构造证据里，**已明标不进本条判据** |
| ② 「判据」栏写明取数与比较方式 | hit | 判据行：`execFileSync('git', [... 'diff','--name-status', BASE])` 取 stdout → `split('\n')` → `split('\t')` → 两集合按 `assert.deepEqual` / 集合包含比；**`git` 退出码不作判据**；**禁 `node -e`** |
| ③ 「红绿证据」两态 | hit | **红态** = 纯函数 `judgeNameStatus(rows)` 喂伪造行（`A\t tools/docgen/rogue-new.mjs` → A 断言红；`M\t README.md` → M-面断言红）；**绿态** = `git add` 后与**提交后**两次跑均 exit 0；并附现盘实证「未跟踪件不进 `git diff`」（故 ②-0 前置断言不可省） |
| 条数 / 三值不变、未新增用例 | hit | §1 末「计数核算」追加轮次 6 一句：**正 21 / 负 17 / 边 22 = 60**；本轮只改 SC-TC-62 的步骤 / 预期 / 判据 / 红绿证据 + 依赖它的索引（§1 行、§3 BB-2 行、§5 D-8、§0.1 porcelain 行与 §0.1 抬头注） |
| 未改 spec / 未改代码 / 未改 plan / 未跑 `npm run check` | hit | 文件头「声明（纪律）」轮次 6 段：只跑 `git status --porcelain` / `git rev-parse HEAD` / `git diff --name-status HEAD` 三条只读命令；diff 只落在本文件 |

**修订轮次 7 的回填核对（按审计复核抓出的 1 条 P0：P0-2）**

| 核对项 | 结果 | 证据（落点 / 复核结论） |
|---|---|---|
| P0-2：`SC-TC-62` 的 **M-面白名单**漏 `docs/superpowers/specs/2026-11-03-s-a-data-layer-design-testcase.md`（已跟踪 + 前缀外 + plan Task 5 明写要改 → 施工后必以 `M` 出现 → M-面恒红、`# fail 0` 不可达，与 CC-1 同族「恒红」） | hit | **SC-TC-62 ②「M-面」bullet** 改为「5 前缀 + **2 实名** = 7 项」（与 `2026-11-03-s-a-data-layer-design.md` 并列），依据 = **spec §11.14 步 1 的现读 `git checkout` 清单**（`…-s-a-data-layer-design.md …-s-a-data-layer-design-testcase.md` 两个实名已在列，本席只按判据侧同步，**不改 spec**）；同批同步「覆盖 / 前置 / 预期 / 判据 / 红绿证据」与索引（§1 SC-TC-62 行、§3 BB-2 行、§6 盲点雷达 8、本台账） |
| M-面是否还有别的已跟踪漏项 | hit（**无其他漏项**） | **plan File Structure 表 24 行逐行比**（`docs/superpowers/plans/2026-11-03-s-c-card-shape.md:21-46`）：`改` 18 行 + `重生成 / replace 自动更新` 3 行 = **21 行已跟踪件**、`新建` 3 行 = `A` 面。21 项中 **19 项落在 5 个前缀内**、**2 项前缀外**（S-A 的 spec 早已在 M 面 + S-A 的 testcase = 本轮补入）；实测 `git ls-files` 对 17 个文件实名 **17/17** 命中 + `tools/docgen/data/seats` 15 / `agents/*.md` 15 / `docs/agents` 16 / `tools/docgen/fixtures` 18 全命中；3 件新建件 `Test-Path` **均 False** → 归 `A` 面。结论写进 **② 的「M-面逐行比对」bullet**，施工者可照同一命令自核 |
| 「漏一个已跟踪的改动路径 → 红」有证据 | hit | **红绿证据**新增第三组：用**轮次 6 的旧 M 面白名单**喂 `['M\tdocs/superpowers/specs/2026-11-03-s-a-data-layer-design-testcase.md']` → M-面断言必红并点名；补入该实名 → 同一输入变绿（两跑之差即判别力证明）。判据纪律照旧：`split('\t')` + `assert`（集合比）、**禁 `node -e`**、**`git` 退出码不作判据** |
| 条数 / 三值不变、未新增用例 | hit | §1 末「计数核算」追加轮次 7 一句：**正 21 / 负 17 / 边 22 = 60**（本轮只补白名单 + 加一条比对 bullet + 加一组红态，未新增条目） |
| 未改 spec / 未改代码 / 未改 plan / 未跑 `npm run check` | hit | 文件头「声明（纪律）」轮次 7 段：只跑 `git ls-files` / `Test-Path` / `git status --porcelain` / `git rev-parse HEAD` 四类只读命令；diff 只落在本文件 |
