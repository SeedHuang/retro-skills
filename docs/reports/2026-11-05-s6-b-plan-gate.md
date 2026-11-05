# S6-B 批计划门（②→③）审计报告

> 审计实例：**独立审计**（未参与 plan 撰写、未参与 ② 段 spec/testcase 写作）
> 日期：2026-11-05｜cwd = 仓根 `d:\Seed\retro-skills`｜Shell = PowerShell 5
> 被审对象：`docs/superpowers/plans/2026-11-05-s6-b-boundary-convergence.md`（SHA 前缀见 §0）
> 依据：`agents/reviewer-audit.md`（角色卡）+ `skills/dev-workflow/references/stage-2b-plan-gate.md`
> 判据出处：`docs/superpowers/specs/2026-11-04-s6-b-boundary-convergence-design.md`（下称 spec）+ 同目录 `-testcase.md`

## 0 落盘真实（先取基准）

| 核了什么 | 怎么核的（命令原文 / 首行） | 结论 |
|---|---|---|
| spec 路径与 SHA 前缀 `40D27610…308D` 在位 | `Get-FileHash docs\superpowers\specs\2026-11-04-s6-b-boundary-convergence-design.md -Algorithm SHA256` → `40D276107C9708D791F427B680FEF52FBFB56F1D1AA134FFEBEF54E65ECC308D` | 通过（前 8 位 `40D27610` 与末 4 位 `308D` 与 plan 头逐字对位） |
| testcase 路径与 SHA 前缀 `1758B127…90D9` 在位 | `Get-FileHash …-design-testcase.md -Algorithm SHA256` → `1758B12710DA7F0A83B9B7D6D5E6FA89DF5FFE7CFFDB2E8E4F13C801FEBB90D9` | 通过（`1758B127` / `90D9` 对位） |
| spec 行数 225 | `(Get-Content <spec>).Count` → `225` | 通过（与 §1 第 4 行的 `spec 225/350` 对位） |
| testcase 条数 52 | testcase §1.1 现算「正 21 / 负 18 / 边界 13 = 52」；`check-plan size` 报 `tc 52/80` | 通过 |

## 1 三条核心核对（本人实跑）

| 核了什么 | 怎么核的（命令原文首行） | 结论 |
|---|---|---|
| ① 功能点全覆盖 | `node scripts/check-plan.mjs coverage --plan docs\superpowers\plans\2026-11-05-s6-b-boundary-convergence.md --prd docs\prd\20261024073606-dev-workflow-mainline\index.md --stage S6` → `coverage: gap 0（prd 1 / plan 1）steps ok => ok`（exit 0） | 通过（缺口 0；F-24 有 Task 1–6） |
| ② 依赖无环 | `node scripts/check-plan.mjs deps --plan docs\superpowers\plans\2026-11-05-s6-b-boundary-convergence.md` → `deps: cycle 0 dangling 0（nodes 6 / edges 5） => ok`（exit 0） | 通过（6 节点 / 5 边，DAG） |
| ③ 功能块 ↔ testcase 映射 | `node scripts/check-plan.mjs map --plan docs\superpowers\plans\2026-11-05-s6-b-boundary-convergence.md` → `map: missing 0 dangling 0（cases 52 / mapped 52） => ok`（exit 0） | 通过（52 条用例逐条落 Task 1–6，附录 A 无悬空） |
| 版本与轮次（旁证） | `node scripts/check-plan.mjs size --spec docs\superpowers\specs\2026-11-04-s6-b-boundary-convergence-design.md --testcase docs\superpowers\specs\2026-11-04-s6-b-boundary-convergence-design-testcase.md --rounds 3` → `size: spec 225/350 tc 52/80 rounds 3/3 => ok`（exit 0） | 通过 |

## 2 R4 与变更范围

| 核了什么 | 怎么核的（命令原文首行） | 结论 |
|---|---|---|
| R4：plan 未藏「新增设计决策」 | 对 plan 全文 grep `^## 新增设计决策` → **0 命中** | 通过（无该节；plan 只承接 spec §3/§6，未自立设计决策） |
| 变更范围 ⊆ §3 白名单（22 行） | `git status --porcelain` → 7 行：`M docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design.md`（第 17 行）/ `M skills/dev-workflow/references/gate-record.md`（第 21 行）/ `M tools/scope-sweep/baseline.json`（第 20 行）/ `M tools/scope-sweep/keywords.json`（第 19 行）/ `?? docs/superpowers/plans/2026-11-05-s6-b-boundary-convergence.md`（第 18 行）/ `?? docs/superpowers/specs/2026-11-04-s6-b-boundary-convergence-design-testcase.md`（第 16 行）/ `?? docs/superpowers/specs/2026-11-04-s6-b-boundary-convergence-design.md`（第 15 行） | 通过：7/7 落白名单，**白名单外真实变更 0**（测量时点 = 落本报告之前；本报告为审计产物，不在 plan §3 白名单，属门后新增） |
| `git diff --name-only` 亦核 | `git diff --name-only` → `docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design.md` / `skills/dev-workflow/references/gate-record.md` / `tools/scope-sweep/baseline.json` / `tools/scope-sweep/keywords.json`（4 行） | 通过（4 行全在 §3 白名单第 17/21/20/19 行，且形态相符） |
| 逐件形态与白名单声明相符 | `git diff --stat` → `+16 / -3`：S6 原文 spec `1 +`（仅日期注，对第 17 行）/ `gate-record.md` `1 +`（`②@S6-B` 已落，对第 21 行）/ `baseline.json` `8 +5 -3`（`--freeze`，对第 20 行）/ `keywords.json` `9 +`（`I35` 在 `keywords.json:340`，对第 19 行） | 通过 |
| 第 22 行（impact-sheet，不进 git） | `Test-Path .session\reviews\2026-11-04-2134-s6-b-boundary-convergence\impact-sheet.md` → `True` | 通过（在位；因 `.gitignore` 覆盖故不出现在 `git status`） |

## 3 抽查任务小节（≥3，符号逐条 grep）

| 核了什么 | 怎么核的（命令 / path:line） | 结论 |
|---|---|---|
| T1 Consumes / 验收命令 / 产出符号 | `Consumes: 无`（plan:43）；`node tools/docgen/cli.mjs policy --dump` 实跑首行 `{`（JSON 正常输出）；`tools/docgen/policy/definitions/paths.mjs:6` = `export const pathGroups` | 通过。新建符号 `writeScopes.mjs` 施工前不存在（`Test-Path` = `False`），plan 已由 §1 任务表 / §2「产出」/ §3 第 2 行「由谁写 T1」指名产出任务；`flat().length = 19` 为 T1 自身验收（施工后才成立） |
| T3 Consumes / 验收命令 / 产出符号 | `Consumes: Task 2`（plan:53）；`tools/docgen/components/patternRegistry.mjs:31` = `export const SDET_BOUNDARY`、`:36` = `export const boundaryBySeat`；`tools/docgen/components/validatePolicy.mjs:27` = `const CONFIG_KEYS = ['capabilities', 'allowGroups', 'artifacts'];`（spec Q2 的 `:27` 引位对位） | 通过。两条负例验收（`spec.unknown` / `excludePathItems=['rules']`）所依赖的码 `UnknownPolicyRef` / `ForbiddenGroupGranted` 均在 spec §5 定义、校验器由 T3 改，属施工后核（产出任务已指名） |
| T4 / T5 Consumes / 验收命令 / 产出符号 | `Consumes: Task 3`（plan:58）/ `Consumes: Task 4`（plan:63）；`tools/docgen/test/policy-pure-source.test.mjs:133` = `const goldenKeyFor = …`、`:140` = `const goldenCurOf = …`；`tools/docgen/test/support/dev-workflow-checks.mjs:241/279/289` = `withRepoCopy` / `runCli` / `runEsm`；`agents/senior-sdet.md` 存在；`node tools/docgen/cli.mjs gate` 实跑 → `baseline 38/38`（exit 0）；`docs/agents/senior-sdet.md` grep `## 边界` → 0 命中（与 T5「投影不承载边界」一致） | 通过。`draft` / `replace` / `generate` / `gate` 子命令在 `tools/docgen/cli.mjs` 头部注释（六子命令统一入口）与实现中在位；`goldenKeyFor('senior-sdet') = senior-sdet@1` 为黄金追加后的态，属 T4 产出 |
| T6 收口命令可用性 | `npm run check`（`package.json` scripts 含 `check`）；`Test-Path scripts\scope-sweep.mjs` / `scripts\check-gate-record.mjs` → `True`、`True` | 通过（命令目标均有实体；T6 验收栏后两项只写输出片段 `sweep ok` / `bad 0`，见 §4 P3-2） |
| T2 Consumes / 产出符号 | `Consumes: Task 1`（plan:48）；`tools/docgen/components/renderBoundary.mjs:21` = `export const SLOTS`（现 12 名）、`:125` = `export function slotValues`、`:190` = `export function renderBoundary`、`:88` = `function forbiddenPaths()`（内部函数）、`:155` = `function listClassMembers()`、`:169` = `export function assertTemplatePure` | 通过（`SLOTS.length = 14` 与排除注内容属 T2 施工后态，产出已指名） |

## 4 发现（P0 0 / P1 0 / P2 0 / P3 2，不阻断）

| # | 问题 | 证据 | 建议解法 | 级别 |
|---|---|---|---|---|
| P3-1 | plan 未出现字面标记「施工后核」 | plan 全文 grep `施工后核` / `施工后` → 0 命中（对照 `stage-2b-plan-gate.md` 常见漏项「施工后才存在的符号标「施工后核」并写明由哪个任务产出」） | 在 §2 各小节「产出」行末尾对新建符号（`writeScopes.mjs` / `SLOTS` 14 / `senior-sdet@1` / `boundaryBySeat['senior-sdet']`）加四字标记「（施工后核，产出 = Tn）」。当前未标不构成实质风险：产出任务已在 §1 任务表、§2「产出」、§3「由谁写」三处逐条指名，无「命令引用不存在符号」的实例 | P3 |
| P3-2 | T6 验收栏两条只写输出片段、未写全命令 | plan:70 `…；sweep ok；check-gate-record → bad 0`（缺 `node scripts/scope-sweep.mjs --check` 与 `node scripts/check-gate-record.mjs` 全命令） | 落行前补全命令原文（spec §4 V-8 与 plan §0 验收行已各写一次全命令，此处补齐即一致） | P3 |

## 5 本席自检（角色卡「一定会」5 条 / 禁止 4 条 / 本席清单 7 条）

| # | 条目 | 判定 | 证据 |
|---|---|---|---|
| 一定会-1 | 结论依据 ≥ 2 条、来自 ≥ 2 文件 | hit | ① `stage-2b-plan-gate.md:16-36` 三条核对定义；② `docs/superpowers/plans/2026-11-05-s6-b-boundary-convergence.md:25-70` 任务表与验收；③ `tools/docgen/policy/definitions/paths.mjs:6` 等符号行 |
| 一定会-2 | 证据可复算（path:line / 命令首行） | hit | 见 §1–§3 每行「怎么核的」；八条命令首行均贴原文 |
| 一定会-3 | 非专业读者能听懂 | hit | `coverage`（功能点覆盖）、`deps`（依赖无环）、`DAG`（有向无环图）、`白名单`（plan §3 变更清单）、`SHA 前缀`（哈希前 8 位 / 末 4 位）均在首现行给中文解释；未解释术语 0 |
| 一定会-4 | 无问题时写「全过、无问题」 | na | reason：findings 非空（2 条 P3），故不写该句；P3 均在 §4 给出解法与落点 |
| 一定会-5 | 附录无问题时写「全过、无问题」 | na | reason：本报告不设附录 |
| 禁止-1 | 不只提问题不给解法 | hit | §4 两行均有「建议解法」 |
| 禁止-2 | 不越界处置 | hit | 本报告是唯一写入产物；未改 plan / spec / testcase / 规则 / 代码；实跑期间产生的`.session/tmp/` 临时中转文件已当场删除（`policy --dump` 重定向产物，已 `DeleteFile`） |
| 禁止-3 | 证据栏不留空 | hit | §0–§3 每行证据位非空 |
| 禁止-4 | 不代他人填签名栏 | hit | 本报告只有本席签名行，未填申报人 / 其他席 |
| 本席-1 | 审计席卡：卡片合规核对 | na | reason：本门不设议会、无席卡；plan 门只有核对表（`stage-2b-plan-gate.md:41` 「本门不设议会」） |
| 本席-2 | 级别匹配核对 | na | reason：无席卡级别栏；本报告自评级别（P3 × 2）见 §4 |
| 本席-3 | 答辩合规核对 | na | reason：无答辩环节（本门无议会） |
| 本席-4 | 计数一致核对 | hit | `map` 的 `cases 52 / mapped 52` 与 testcase §1.1「21 + 18 + 13 = 52」相等；`deps` `nodes 6` 与 plan §1 六个任务行相等；`coverage` `prd 1 / plan 1` |
| 本席-5 | 轮际对账核对 | na | reason：本门为单轮签字，无上轮承诺清单；`②@S6-B` 行已在 `gate-record.md:123` 落，本门只加 `②→③@S6-B`（plan T6） |
| 本席-6 | 落点真实核对 | hit | §3 抽查 T1/T2/T3/T4/T5/T6 六节，符号均 `path:line` 在位；`writeScopes.mjs` 现 `False` 且已由 T1 指名产出 |
| 本席-7 | 证据复算核对 | hit | §1 四条命令本人实跑、exit 0；§3 `gate` 实跑 `baseline 38/38` |

## 6 结论

**通过（P0 0 / P1 0 / P2 0 / P3 2，两条 P3 不阻断）**

- 三条核心核对：`gap 0` / `cycle 0 dangling 0` / `missing 0 dangling 0（cases 52 / mapped 52）`，全部 exit 0。
- R4：`^## 新增设计决策` 0 命中。
- 变更范围：7 项全落 §3 白名单（22 行内），白名单外真实变更 **0**。
- 落盘真实：spec / testcase SHA 前缀逐字对位，spec 225 行、testcase 52 条、rounds 3/3 与 `size` 输出一致。

签名：`reviewer-audit@s6-b-plan-gate-2026-11-05`
