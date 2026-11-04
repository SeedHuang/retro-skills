# ④ 段过程账（S-C 卡面形状质量门）

> 判者：`senior-sdet@sc-card-shape-quality4-20261104-01`｜角色卡 `agents/senior-sdet.md` 贴入｜独立实例（未参与 spec / testcase / plan / ③ 施工 / ③ 审计）
> 本文件是**过程账**（跑了什么、遇到什么、怎么处置）；结论唯一出口 = 同目录 `quality-4.md`。

## 时间线（命令 → 结论）

| # | 动作 | 结果 |
|---|---|---|
| 1 | 读角色卡 `agents/senior-sdet.md`；读 ④ 段判据源 `skills/dev-workflow/references/stage-4-quality.md`；读范本 `.session/reviews/2026-11-04-0712-s-b-quality/quality-4.md`（结构对号） | 六条判据与 9 节结构确认；角色卡「边界」段与本次授权冲突 → 按「用户 > 规则 > 本席」采纳用户指令，并在 `quality-4.md` 首段写明 |
| 2 | `git status --porcelain` + `git rev-parse --short HEAD` | 0 行 + `5ffe400` → 工作树 clean，与任务书一致，**无他人改动** |
| 3 | `node --test --test-reporter=tap tools/docgen/test/sc-card-shape.test.mjs` | `# tests 60 / # pass 60 / # fail 0 / # skipped 0`，exit 0 |
| 4 | 抓 TAP 的 `ok N - SC-TC-xx` 全表 | 60 行全 `ok`、无 `not ok`；**执行序 = 文件声明序**（逐条对齐，可据此建映射） |
| 5 | `$env:SB_SHAPE_ONESHOT='1'; node --test …; Remove-Item Env:SB_SHAPE_ONESHOT` | 同数 60/60/0/0，exit 0（现值型断言在一次性档真被判定） |
| 6 | **（自伤）** `npm run check` 并把日志写进 `.session/tmp/npmcheck-sc-quality.log` | 末行 `check 未通过` → 根因：⑤ 段判据「`.session/tmp` 为空」被本席自己的日志打红 |
| 7 | 处置：删除该日志，改写日志到 `%TEMP%`，重跑 `npm run check` | exit 0，末行 `check 全部通过`；`# tests 1541 / # pass 1536 / # fail 0 / # skipped 5` |
| 8 | `node tools/docgen/cli.mjs gate` | exit 0，末行 `baseline 38/38` |
| 9 | `node scripts/scope-sweep.mjs --check` | exit 0，末行 `sweep ok（命中未超基线、清单齐、scope 齐）` |
| 10 | `node scripts/check-observable.mjs --check` | exit 0，末行 `check-observable ok` |
| 11 | `node scripts/check-gate-record.mjs` | exit 0，`rows 71 bad 0` + `gate-record ok（R1/R2/R6 全过；splitting 0）` |
| 12 | 输入取证：5 件 `(Get-Content).Count` + `Get-FileHash -Algorithm SHA256` | spec 270 / testcase 1072 / plan 230 / 落点 1069 / 门账 122；spec 的 `9B470C827C6B2020…` 与 `gate-record.md:100` 记的值**相同**（② 门行数字独立复现） |
| 13 | 落点结构取证：`^\\s*test\\('SC-TC-` = **60**；无锚点 = **61**（`:3` 注释自命中）；`^\\s+assert\\.` **216**；子进程调用 **35**；`assert.throws(` **10**；`withRepoCopy(` **24**；`if (!SHAPE) return` **3** | 判据 4 / 判据 1 的量化依据；同时定出缺口 G3 / G6 |
| 14 | 覆盖总表现算（`^\\| SC-TC-\\d{2} \\|` 60 行，按列分组） | 正 21 / 负 17 / 边 22（39 ≥ 21）；**单元 30 / 集成 25 / e2e 5**（首次记 `32/23/5` 为错数，审计打回项 3 后二次复算更正）；P0 52 / P1 8；判据类型 60/60 = 机器 |
| 15 | **反向验证（仓外副本）**：`robocopy` 到 `$env:TEMP\scq-rev-copy1`，控制组两脚本 exit 0；注入 A（`trigger.kind` → `bogus`）→ exit 1（`bad 1 => fail`）→ 复原 exit 0；注入 B（删 `判据（${VERDICT_HINT}）`）→ exit 1（`ok 0 / bad 15 => fail`）→ 复原 exit 0 | 判据 4 有判别力（真仓零改动） |
| 16 | 收尾：删副本、`git status --porcelain` 复核 | 副本已删（`Test-Path` False）；真仓 **0 行**；`.session/tmp/` 为空 |
| 17 | 读 plan `执行记录 :212-220`、门行 `:100-102`、`docs/agents` 三席「职责缘由」首句、`spec:258-262`（§11.14 步 1 清单） | 缺口 G1 / G2 / G10 的 `path:line` 证据 |
| 18 | 取证完毕 → 写 `quality-4.md`（9 节）→ 本文件 | — |
| 19 | 复跑 `npm run check` 确认写盘后仍绿 | exit 0；`# tests 1541 / # pass 1536 / # fail 0 / # skipped 5`；`④ markdown 检查通过（402 个文件 / 1724 张表）`；`⑤ .session 结构检查通过（一级只含封闭清单档位；tmp/ 为空）`；末行 `check 全部通过` |
| 20 | ④ 核对席（独立审计实例）首轮核对 → **判不过**（P0 0 / P1 2 / P2 3 / P3 5），打回 **4 项，全部为记录层**（分级改判 / §1 判据编号归位 / §3 数字复算 / P3 补齐） | 打回件不涉及已签断言、实现、testcase、`gate-record.md` → 本席只改本目录两件 |
| 21 | 按 4 项逐条修订 `quality-4.md`：§1 六条按判据源原序归位并补判据 ③ 的对号结论（复核 plan `:215/:217/:218/:219`，红 3 = SC-TC-29/31/48，构造 = `withRepoCopy` + 单文件复跑）；§3 复算为 30/25/5、`PROBE` 26 / `COPY` 20 / `COUNT` 16，量词改「7 处 + 1 变体 = 8 个用例」；§5 重写为 12 条带级别列（G4/G5 → P1、G6 → P2）+ §5.1 承接核对表；§0 行 11 标「自述、不可复算」；§4.3 补 stderr 归属（`check-trigger-kind.mjs:38`） | 修订后级别计数：P0 0 / P1 2（G4、G5）/ P2 1（G6）/ P3 9；删除了修订时误留的旧版 G1–G10 重复块（表列数经竖线逐行比对一致） |
| 22 | 修订后回归三项复跑：单文件 TAP、`npm run check`（日志写 `%TEMP%`）、`git status --porcelain` | 见下「修订后回归」段 |
| 23 | ④ 段出口落账（提交 `68ff6ab`：sdet 结论表 + 核对席复核轮判过）→ 申报方（主 agent）随后**在工作树未提交**改 `tools/docgen/test/sc-card-shape.test.mjs` 申报「G4 / G5 已修」 | 本席读 `git diff` 核：1079 行 / SHA `6422FBD9…` / 块数仍 60；HEAD 已从 `5ffe400` 推进到 `68ff6ab`（§0 已加时点注） |
| 24 | G4/G5 闭合复核：`%TEMP%` 整仓副本做 4 组注入（A 删一块 → `:931` 先红 `expected 60 / actual 59`；A2 再移开 `:931` → `:934` 红 `expected 1541 / actual 1540`；C `BASELINE_TESTS` 1481→1482 → `1542 ≠ 1541` 红；D `rmSync` 换 `void 0` → SC-TC-56 红 `必须 exit 非 0`）+ 真仓正向回归（60/60/0/0、`# tests 1541`、`check 全部通过`、`git status` 1 行 `M`、`sweep ok`） | 两组均判死 → **G4 / G5 转「闭合」**；写入 `quality-4.md` **§8**（含联动修订：§5 级别列 + 计数、§6 四类 58/1/1/0、§1 ④/⑥ 解除附条件、§2 行号 +10 位移规则、§7 发现 3 加注） |

## 遇到的问题与处置

| 问题 | 处置 |
|---|---|
| 角色卡「边界」段规定本席只写 spec 同目录 `-testcase.md`，与本次 ④ 段签字席产物冲突 | 按优先级（用户 > 规则 > 本席）采纳用户当场指令，在 `quality-4.md` 首段**写明授权与冲突**，不静默越界 |
| 首跑 `npm run check` 因自己把日志写进 `.session/tmp` 而红 | 删日志（唯一变量）+ 日志改写 `%TEMP%`；重跑绿。并把这件事记进 `quality-4.md` §7 发现 2（它本身就是 ⑤ 段判据有判别力的证据） |
| 任务书给的门行行号为 `:99 / :100 / :101`，与实际 `:100 / :101 / :102` 不符 | 逐行打印核（不凭记忆）；结论按**实际行号**写，登记为缺口 G10 |
| `String.Split('"kind": "need"')` 在 PowerShell 下按**字符**切分 → 注入点命中数报成 2100 | 改用 `[regex]::Matches(..., [regex]::Escape(...)).Count` 复核 → 命中 **1**；报告里只写复核后的数，不复述错误数 |
| 默认档 `# skipped 0` 但 `SC-TC-45/46` 实际 `if (!SHAPE) return`（一条断言都不跑）、`SC-TC-13` 非 SHAPE 分支是 `assert.ok(true)` | 不判「未执行」（一次性档已真判），但登记为缺口 G6（`# skipped 0` 掩盖空跑） |
| testcase 签字件内仍有 **8 个用例**的执行方式带未施行标注（`（未施行）` 全宽 **7 处**：SC-TC-10/11/12/33/34/35/36；SC-TC-55 的 1 处变体）+ 48 行「未施行（施工后核）」 | 按「签字件不改」不回填；逐条结论只写在本表 §2，登记缺口 G7（⑤ 审计引用本表而非 testcase 标注）。量词前版误写「8 处」，本轮纠正 |
| `.session/reviews/2026-11-04-1328-s-c-quality/` 起始为空 → ④ 核对件未在位 | 原记「核对权待补」；审计首轮已执行核对（判不过、打回 4 项）→ 改为「核对权已有执行记录」；**复核轮判过并落账于 `68ff6ab`** → 现记「三权 3/3 在位」（`quality-4-audit.md` 仍由审计自署，本席不代签） |
| G4 修好后与同块的 `:931`「块数 == 60」**重叠**：删一块时 `:931` 先红，`:934` 执行不到 | 未判缺陷，但在 §8.1 写明「`:934` 的独立判别面 = `BASELINE_TESTS` 常量漂移 + 块数被改仍配平的情形」，并做注入 A2（移开 `:931`）单独证明 `:934` 自身判死；不新立缺口（两条同为真断言、方向同向） |
| G5 改真删真跑后单文件耗时由秒级升到 **≈21 s**（两次副本 + 两次 `node --test`） | 只记录不立缺口（记入 §8.3 第 1 行，供 ⑤ / 下一批评估测试预算）；本席**不**以「慢」判红 |

## 修订后回归（审计打回后复跑三项）

| # | 命令 | 结果 |
|---|---|---|
| R1 | `node --test --test-reporter=tap tools/docgen/test/sc-card-shape.test.mjs`（日志写 `%TEMP%`，跑完即删） | **`# tests 60 / # pass 60 / # fail 0 / # skipped 0`**，`not ok` 计数 **0**，exit **0** |
| R2 | `npm run check`（日志写 `%TEMP%`，跑完即删） | `# tests 1541 / # pass 1536 / # fail 0 / # skipped 5`；`④ markdown 检查通过（402 个文件 / 1724 张表）`；`⑤ .session 结构检查通过（一级只含封闭清单档位；tmp/ 为空）`；**末行 `check 全部通过`**，exit **0** |
| R3 | `git status --porcelain` | **0 行**（会话目录不进 git；未改任何已签件 / 卡面 / 数据 / 渲染器 / 门禁脚本） |
| R4 | `node scripts/scope-sweep.mjs --check`（附带核，R8 用） | exit **0**，末行 `sweep ok（命中未超基线、清单齐、scope 齐）` |

**回归结论**：三项（R1–R3）全绿，附带 R4 亦绿。本轮只改本目录 `quality-4.md` 与 `progress.md` 两件（`.session/` 不在 `scope-sweep` scope 内）→ 按 R8 **不需** touch `impact-sheet.md`（R4 实测 exit 0 佐证，非推断）。

## 收尾复核

- 仓内唯一新增 = 本目录两份 md（`progress.md` / `quality-4.md`）；**未**改 spec / testcase / plan / `gate-record.md` / 卡面 / 数据 / 渲染器 / 门禁脚本 / 已签断言。
- 未动 `scope-sweep` scope 内任何文件 → 按 R8 不需刷新 `impact-sheet.md` 的 mtime（`sweep` 已复跑 exit 0 佐证）。
- `.session/tmp/` 为空；`%TEMP%` 下无残留副本；未 commit（由主 agent 提交）。
