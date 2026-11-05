# 段③施工审计（S6-B 边界句结构收敛）

> 段标记：**③@S6-B**｜审计对象：`docs/superpowers/plans/2026-11-05-s6-b-boundary-convergence.md`（T1–T6 产出）｜spec：`docs/superpowers/specs/2026-11-04-s6-b-boundary-convergence-design.md`（`DDB9CE41…C1BE`，228 行）｜testcase：同目录 `-testcase.md`（`5D4B4268…DD7E`，53 条）
> 申报人：**开发（主 agent 执行）**｜签字人：**审计（`reviewer-audit` 独立实例，未参与 spec 写作、plan 撰写与 ③ 施工）**
> 取数：审计本人自跑 **2026-11-05 10:58~11:06**（cwd = 仓根；副本注入只在 `%TEMP%` 内，跑完即删），全部值来自本次命令输出，不采信转述。
> 判据来源：`skills/dev-workflow/references/stage-3-implementation.md` 四条出口判据 + `agents/reviewer-audit.md` 本席清单（卡片合规 / 级别匹配 / 答辩合规 / 计数一致 / 轮际对账 / 落点真实 / 证据复算）。

## 1 出口判据逐条

| # | 出口判据（原文口径） | 结果 | 证据 |
|---|---|---|---|
| 1 | plan 每条执行步骤都有对应产出（没有「计划里有、盘上没有」） | `hit` | T1 → `paths.mjs:9`（`id: 'code.src'` 项对象）/ `writeScopes.mjs:4-17` / `seats.mjs:20`；T2 → `boundary.md.tpl:3`（`{{WRITE_SCOPE}}`）/ `:5`（`{{HOST_RULE}}`）、`renderBoundary.mjs:24`（`SLOTS` 15）/ `:99`（`forbiddenPaths(seat)`）；T3 → `patternRegistry.mjs:30`（`SDET_BOUNDARY` 已删注释）、`validatePolicy.mjs:204-259`；T4 → 5 个测试文件 diff（`git diff --stat`：`policy-pure-source 100` / `sb-contract-layer 30` / `tool-tiers 7` / `sa-data-layer 4` / `sdet-render 4` 行）+ `boundary-golden.json`；T5 → `agents/senior-sdet.md`（边界段 = 渲染，见 §4）；T6 → 本文件 + `gate-record.md` 的 ②→③ 行（`gate-record.md:124`）。**T6 的 ③ 行待申报方按本文件转录**（auditor 不代填签名格） |
| 2 | 全仓检查绿：`npm run check` exit 0，`# fail 0`、`0 findings`、markdown 通过、gate 计数一致 | `hit` | 见 §2 #1–#2 |
| 3 | 每份改动可指回 spec 一节或 R 编号；plan 阶段新增设计决策为零 | `hit`（指回）/ `hit`（R4） | 指回抽 6 处见 §3；R4 = `^## 新增设计决策` 命中 **0**（`Select-String` 计数 0） |
| 4 | 交付物只落在 plan 声明的路径白名单内；白名单外改动必须在记录里写明理由 | **`miss`**（首轮）→ **`hit`**（复核轮，见 §5A / §8.2） | 首轮：27 行状态中 **24 行**落 plan §3，**3 行白名单外且无理由**：`tools/docgen/fixtures/senior-sdet.evidence.json`（M，工具写入台账）、`docs/reports/2026-11-05-s6-b-plan-gate.md`（未跟踪，② 段审计记录）、`docs/reports/2026-11-05-s6-b-step-3-audit.md`（未跟踪，本审计报告）；且 `gate-record.md:124` 的 ②→③ 行写「白名单外真实变更 0」→ 与实测冲突。复核轮：plan §3 补 #23–#25 后 **27/27 全落白名单、白名单外 0** |

## 2 命令实跑（首行 / 末行 / 退出码）

| # | 命令 | 首行 | 末行 | 退出码 |
|---|---|---|---|---|
| 1 | `npm run check` | `> check` → `> node scripts/check-all.mjs` | `check 全部通过`（汇总 `# tests 1541 / # pass 1534 / # fail 0 / # skipped 7`；中段 `0 findings`、`④ markdown 检查通过（436 个文件 / 1923 张表）`、`⑤ .session 结构检查通过`、`[observable] 扫 107 / 未豁免 0 / stale 0`、`baseline 38/38`） | **0** |
| 2 | `node tools/docgen/cli.mjs gate` | `baseline 38/38` | `baseline 38/38` | **0** |
| 3 | `node scripts/scope-sweep.mjs --check` | `counts {…"I35":2}` | `sweep ok（命中未超基线、清单齐、scope 齐）` | **0** |
| 4 | `node scripts/check-gate-record.mjs` | `rows 87 bad 0` | `gate-record ok（R1/R2/R6 全过；splitting 0）` | **0** |
| 5 | `node scripts/check-plan.mjs map --plan <plan>` | `map: missing 0 dangling 0（cases 53 / mapped 53） => ok` | 同左 | **0** |
| 6 | `node scripts/check-plan.mjs size --spec <spec> --testcase <testcase> --rounds 3` | `size: spec 228/350 tc 53/80 rounds 3/3 => ok` | 同左 | **0** |

## 3 改动 → spec 指回（抽查 6 处）

| # | 改动落点 | 指回 spec | 实测 |
|---|---|---|---|
| 1 | `tools/docgen/policy/definitions/paths.mjs`（项对象） | §3.1 | `paths.mjs:9`：`{ id: 'code.src', text: '代码' }` / `{ id: 'code.test', text: '测试' }` |
| 2 | `renderBoundary.mjs` 的 `forbiddenPaths(席)` 排除注 | §3.5 | `renderBoundary.mjs:99`（函数定义）/ `:162`（`FORBIDDEN_PATHS: forbiddenPaths(seat)`）；`gate` 绿且 `slotValues('senior-sdet')` 渲染含「排除「测试」」（由 38/38 卡面比对兜） |
| 3 | `validatePolicy.mjs` 不变量 10 / 13 / 14 | §3.7 | `validatePolicy.mjs:204-259` 含 `writeScope` / `excludePathItem` 判定（副本红档首行见 §4） |
| 4 | `HOST_RULE` 槽（第 15） | §3.4 槽 15 + §3.2 | `boundary.md.tpl:5`（`{{HOST_RULE}}`）、`renderBoundary.mjs:167`（`HOST_RULE: scopeOfSeat(seat)?.hostRule ?? ''`） |
| 5 | `dumpPolicy.mjs` 的 `paths.groups` 文本投影 | §3.1 末段 / §6 D1' | `dumpPolicy.mjs:31-33`（注释「投影为 text 字符串数组」+ `Object.entries(PTH.pathGroups).map(...)`） |
| 6 | 5 个测试文件的 D8 区块 | §6 D8 ①–⑩ | `git diff --stat`：`policy-pure-source` 100 行 / `sb-contract-layer` 30 / `tool-tiers` 7 / `sa-data-layer` 4 / `sdet-render` 4；另 `check-observable.test.mjs` 15 行、`s3-predicates.test.mjs` 5 行（plan §3 的 12' / 12''） |

## 4 红绿两档（副本注入，审计本人实跑）

副本 = `withRepoCopy`（`%TEMP%` 内复制 `tools/docgen` / `tools/execution-matrix` / `tools/quality` / `rules` / `agents` / `docs/agents`），跑完 `rmSync`。

| 档 | 构造 | 首行 / 结果 | 退出码 |
|---|---|---|---|
| 绿档 | 真仓副本原样 `gate` | `baseline 38/38` | **0** |
| 红档 1 | 副本 `seats.mjs` 改 `writeScope: 'spec.unknown'` | `UnknownPolicyRef: senior-sdet:writeScope=spec.unknown`（**无 `TypeError`**） | **1** |
| 红档 2 | 副本 `writeScopes.mjs` 改 `excludePathItems: ['code.test', 'rules']` | `ForbiddenGroupGranted: writeScope=spec.testcase:excludePathItem=rules:not-allowed` | **1** |
| 红档 3 | 副本模板删 `{{HOST_RULE}}` | `TemplateImpure: tools/docgen/templates/boundary.md.tpl:HOST_RULE` | **1** |

渲染字节不变（真仓实算）：

- `sha(renderBoundary('reviewer-audit'))` = `aaa1ed1bab96abf4435321304efb4383634f5340f17257123f505432b02b4f96` ✓
- `sha(renderBoundary('detective-observer'))` = `a9bdacbaea83eb4a82e7f930d76abb43d83c96c0279002bbfb456ca28ccbe052` ✓
- `agents/senior-sdet.md` 的「## 边界」段与 `renderBoundary('senior-sdet')` **逐字相等**（`equal=true`，两侧各 1090 字符）；该席卡面「主持人」命中 **0**；`测试设计` 4 处。
- `SDET_BOUNDARY` 在 `tools agents skills` 内仅剩 1 处**已删注记**（`patternRegistry.mjs:30`）；无代码引用。

## 5 白名单核对（`git status --porcelain` 27 行 → plan §3）

| 状态行 | plan §3 行 |
|---|---|
| `M tools/docgen/policy/definitions/paths.mjs` | #1 |
| `?? tools/docgen/policy/definitions/writeScopes.mjs` | #2 |
| `M tools/docgen/policy/definitions/seats.mjs` | #3 |
| `M tools/docgen/templates/boundary.md.tpl` | #4 |
| `M tools/docgen/components/renderBoundary.mjs` | #5 |
| `M tools/docgen/components/dumpPolicy.mjs` | #5' |
| `M tools/docgen/components/patternRegistry.mjs` | #6 |
| `M tools/docgen/components/validatePolicy.mjs` | #7 |
| `M tools/docgen/test/policy-pure-source.test.mjs` | #8 |
| `M tools/docgen/test/tool-tiers.test.mjs` | #9 |
| `M tools/docgen/test/sa-data-layer.test.mjs` | #10 |
| `M tools/docgen/test/sb-contract-layer.test.mjs` | #11 |
| `M tools/docgen/test/sdet-render.test.mjs` | #12 |
| `M scripts/check-observable.test.mjs` | #12' |
| `M tools/docgen/test/s3-predicates.test.mjs` | #12'' |
| `M tools/docgen/fixtures/boundary-golden.json` | #13 |
| `M agents/senior-sdet.md` | #14 |
| `?? docs/superpowers/specs/…-design.md` | #15 |
| `?? docs/superpowers/specs/…-design-testcase.md` | #16 |
| `M docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design.md` | #17 |
| `?? docs/superpowers/plans/2026-11-05-s6-b-boundary-convergence.md` | #18 |
| `M tools/scope-sweep/keywords.json` | #19 |
| `M tools/scope-sweep/baseline.json` | #20 |
| `M skills/dev-workflow/references/gate-record.md` | #21 |
| **`M tools/docgen/fixtures/senior-sdet.evidence.json`** | **无（白名单外；工具写入台账）** |
| **`?? docs/reports/2026-11-05-s6-b-plan-gate.md`** | **无（白名单外；② 段审计记录）** |
| **`?? docs/reports/2026-11-05-s6-b-step-3-audit.md`** | **无（白名单外；本审计报告，审计实例产物）** |

> `.session/reviews/2026-11-04-2134-s6-b-boundary-convergence/impact-sheet.md`（§3 #22）不进 git（`.gitignore`），不出现在 porcelain，按登记视为在位。
> 归类：**施工交付物 = 24/24 落白名单**；白名单外 3 件均非 T1–T5 施工产物（1 件工具台账 + 2 件审计记录），但 plan §3 未登记、`gate-record.md:124` 又写「白名单外真实变更 0」→ 首轮出口判据 4 不成立（P1-1）。

### 5A 复核轮白名单（2026-11-05 11:20，`git status --porcelain` 27 行 → plan §3）

| 复核项 | 实测 | 结论 |
|---|---|---|
| plan §3 登记条数 | **28 条**（#1–#22 + `5'` / `12'` / `12''` + **#23 `senior-sdet.evidence.json`** / **#24 `plan-gate.md`** / **#25 `step-3-audit.md`**），实取 `rows=28` | 3 件已补登记（plan `:101-103`） |
| 状态行 vs 白名单 | 27 行（21 `M` + 6 `??`）逐行命中 §3；差集 = §3 的 #22（`impact-sheet.md`，`.gitignore` 不进 git） | **27/27 落白名单** |
| 白名单外真实变更 | **0** | 出口判据 4 **闭合** |

## 6 不改清单核对（plan §4）

| 项 | 结果 | 证据 |
|---|---|---|
| `docs/agents/**` 零改动 | `hit` | `git diff -- docs/agents` = **0 行** |
| `agents/reviewer-audit.md` / `agents/detective-observer.md` 渲染字节不变 | `hit` | `git diff -- <两件>` = **0 行**；两席 SHA = `aaa1ed1b…` / `a9bdacba…` |
| `evidence-reader` 自有句 / 11 席 `DEFAULT_BOUNDARY` | `hit` | `gate` 38/38 全绿（含 11 席默认句与 `evidence-reader` 的逐字节比对） |
| 配置层 `seat-policy.mjs` 三键（closed-world） | `hit` | 该文件不在 `git status`（零改动） |
| S6 原文与 S6 testcase 结论句（只许日期注 + 指针） | `hit` | S6 原文仅 `M`（日期注 + §3.8 指针，见 spec §2.6）；S6 testcase 未出现在状态行 |

## 7 发现项与打回清单

| # | 级别 | 发现 | 建议解法 | 复核轮（2026-11-05 11:20） |
|---|---|---|---|---|
| P1-1 | **P1** | 白名单外 3 件未登记且无理由（`senior-sdet.evidence.json` M / `docs/reports/2026-11-05-s6-b-plan-gate.md` ?? / `docs/reports/2026-11-05-s6-b-step-3-audit.md` ??），与 `gate-record.md:124` 的「白名单外真实变更 0」矛盾 → 出口判据 4 不成立 | plan §3 补 3 行（`senior-sdet.evidence.json` 标「工具写出的证据台账」、两份 `docs/reports/*.md` 标「审计记录」+ 各自理由）；同批在 ②→③ 行「核了什么」格追加本轮复算（白名单外 = 3 且已登记）。**不得改结论格** | **已闭合**：plan §3 新增 #23 / #24 / #25（plan `:101-103`），实测 27/27 落白名单、白名单外 **0**（§5A） |
| P2-1 | P2 | 槽数口径残留 3 处与「15」冲突：spec `:17`「槽集恰合 14」、spec `:189`「槽集 ≠ 14」、plan `:13`「槽集 14」 | 三处改成 15（spec 属已签件？——本 spec 尚未终签，可直接改；plan 同步） | **已闭合（三验）**：plan `:13` / spec D8 `:206` 已改 15；三验 spec `:17` / `:189` 也已改——两文件「槽集 14 / ≠ 14 / 恰合 14 / 12→14」命中 **0**，`槽集 15` 式 **6** 处 |
| P2-2 | P2 | 53 条 testcase 尚无对应测试块：`test('S6B-TC-` 在 `tools/docgen/test/*.test.mjs` 命中 **0**；`# tests` 仍 1541（施工前同值）→ ③ 红绿只能靠审计副本构造 | ④ 段入口前由 sdet 落地 53 块（本批不改判据极性；本条只登记为 ④ 的前置） | **改判为候选**：testcase §0 已把判据定义为 `PROBE` / `COPY` / `COUNT` / `DUMP` 命令形态（不要求 53 个 `test(` 块），用例由 ④ 段逐条执行并留结论。**触发 = ④ 段逐条结论**（届时若某条无结论或无命令输出，才升级） |
| P2-3 | P2 | plan SHA 与 ② 增量复签声明不符（`10D6F99E…4BC7` vs 实测 `DCE7C33A…7670`） | 见 `delivery-audit.md`「签后增量复签」A-6：以盘上现值重取并重签 | **已闭合**：该笔误值已撤回；三验现值 = `CEAEAA17…5C2B`（见 A-6，声明 `D32A99BB…` 需同步为该值） |
| P2-4 | P2 | spec 身份漂移：复核轮实测 `2DD222D3…67C8` ≠ ② 声明 `DDB9CE41…C1BE`（因 D8「12→15」与 §3.2 等增补所致），228 行 / 15 槽不变 | 用现值重取 spec SHA 并更新 `②@S6-B` 与增量复签（A 项） | **已闭合（三验）**：spec 现 `E0276855…DCA3`（228 行），与 ② 声明一致 |

**计数**：首轮 **P0 0 / P1 1 / P2 3**；复核轮 **P0 0 / P1 0 / P2 2 + 候选 1**；三验 **P0 0 / P1 0 / P2 0 + 候选 1**。

## 8 结论

### 8.1 首轮（保留原记录，2026-11-05 11:06）

**不通过（③ 出口未齐）**：四条出口判据 **成立 3 / 不成立 1**（第 4 条白名单）；P1 = 1、P2 = 3。放行条件 = P1-1 闭合（白名单 3 件登记后重跑 `check-gate-record` 仍 `bad 0`）。

### 8.2 复核轮（2026-11-05 11:20，改判；三验 11:21 更新 P2 状态）

**通过（③ 出口齐）**：四条出口判据 **成立 4 / 不成立 0**；**P0 0 / P1 0 / P2 0**（+ 候选 1）。

复核轮实跑（本席本次，非转述）：

| 项 | 实测 | 判据 |
|---|---|---|
| `git status --porcelain` | 27 行（21 `M` + 6 `??`）→ plan §3 28 条登记中命中 27（差集 = #22 `impact-sheet.md`，不进 git） | 出口判据 4 **成立**，白名单外 **0** |
| plan | `CEAEAA17…5C2B`（189 行；与 ② 声明的 `D32A99BB…B7FD` 不符 → 见 A-6，属 ② 声明值过期）；`map: cases 53 / mapped 53 => ok`；`size: spec 228/350 tc 53/80 rounds 3/3 => ok` | — |
| spec | `E0276855…DCA3`（228 行；15 槽；§3.2 两条 `hostRule` 在位；「槽集 14 / ≠ 14 / 恰合 14」命中 **0**） | 三验：身份与声明一致，P2-1 / P2-4 **已闭合** |
| testcase | `5D4B4268…DD7E`；53 = 22/18/13；五要素 53/53 | — |
| 命令 | `npm run check` → `# tests 1541 / # pass 1534 / # fail 0 / # skipped 7` + 末行 `check 全部通过`（exit 0）；`gate` → `baseline 38/38`（exit 0）；`sweep ok`（exit 0，I35=2）；`check-gate-record` → `rows 87 bad 0` / `gate-record ok`（exit 0） | 出口判据 2 **成立** |
| 红绿两档 | 绿 `baseline 38/38`(0)；`writeScope='spec.unknown'` → `UnknownPolicyRef: senior-sdet:writeScope=spec.unknown`(1)；`excludePathItems=['rules']` → `ForbiddenGroupGranted: writeScope=spec.testcase:excludePathItem=rules:not-allowed`(1)；删 `HOST_RULE` → `TemplateImpure: tools/docgen/templates/boundary.md.tpl:HOST_RULE`(1) | 红绿两档齐 |
| 渲染 / 不改清单 | 两席 SHA `aaa1ed1b…` / `a9bdacba…`；`senior-sdet` 卡面边界段 = 渲染；`docs/agents` 0 行、两评审席卡 0 行 | 出口判据 1/3 **成立** |

- **P2（三验已全部闭合）**：P2-1（spec `:17` / `:189` 两处「14」）与 P2-4（spec 身份）均已在三验闭合——spec 现 `E0276855…DCA3`（228 行，与声明一致），两文件「槽集 14 / ≠ 14 / 恰合 14 / 12→14」命中 **0**。
- **候选（带触发）**：P2-2 → 「53 用例零 `test(` 块」，触发 = **④ 段逐条结论**（testcase §0 已定 `PROBE` / `COPY` / `COUNT` / `DUMP` 命令形态，不要求 53 个测试块）。
- **本段「通过」= 可进 ④**，不等于 ④ 已过（验收项复核归 ④ 的 sdet）。
- 本席边界：只核「计划步骤是否都落地 + 检查是否真绿 + 白名单」，不定性「是否符合 spec」；未改任何施工产物；副本注入只在 `%TEMP%` 且已删除。
- 本文件落盘后由申报方转录 `gate-record.md` 的 `③@S6-B` 行（六列齐、签字人 = 审计、申报人 = 开发）；本席不代填签名格。

## 9 本席自检（角色卡「一定会」5 条 + 本席清单 7 条）

| # | 条目 | 判定 | 证据 |
|---|---|---|---|
| 一定会-1 | 结论依据 ≥ 2 条、各带 `path:line`、来自 ≥ 2 文件 | `hit` | §7 与 §1 依据跨 `gate-record.md:124`、`tools/docgen/test/*`（0 块）、`plan:13`、`spec:17/:189`、`writeScopes.mjs:4-17` → 5 个文件 |
| 一定会-2 | 证据可复算：`path:line` 存在且含被引摘句 | `hit` | §2 六条命令逐条给首/末行与退出码；§4 四档首行逐字 |
| 一定会-3 | 英文术语首现行含中文解释 | `hit` | 文首已释 `spec`（设计文档）/ `gate`（卡面一致性门）/ 副本注入（`%TEMP%` 全仓复制）；`hit / miss / na` 为规定词表；代码符号按字面引用 |
| 一定会-4 | 无问题时显式写「全过、无问题」 | `na`｜reason：findings 非空（复核轮 P2 2 + 候选 1） | — 本条只在 findings 为空时适用 |
| 一定会-5 | 附录无问题时显式写「全过、无问题」 | `na`｜reason：本文件不设附录 | — 无可判对象 |
| 本席-1 卡片合规核对 | — | `na`｜reason：③ 段无评审卡（问题卡属议会段），本条无判对象 | — 同上 |
| 本席-2 级别匹配核对 | — | `na`｜reason：同上 | — 同上 |
| 本席-3 答辩合规核对 | — | `na`｜reason：③ 段无答辩记录 | — 同上 |
| 本席-4 计数一致核对 | 卡片数 = 各类去向之和 | `hit` | 数字项：首轮 `27 = 24 + 3`（§5）/ 复核轮 `27/27 落白名单`（§5A）、`53 = 22+18+13`、`# tests 1541` 均复算一致 |
| 本席-5 轮际对账核对 | 上轮承诺 vs 本轮清单 | `hit` | ②→③ 门行承诺「白名单外 0」：首轮实测 3（差异 = P1-1）、复核轮实测 **0**（闭合） |
| 本席-6 落点真实核对 | 抽查落点真实 | `hit` | §3 六处 + §5 27 行 + §5A 28 条逐行实取 |
| 本席-7 证据复算核对 | 重放并写出命令首行 | `hit` | §2 六条 + §4 四档，均为本席本次实跑 |
