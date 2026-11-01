# 可观察判据 S1（清单 JSON / 校验器 / 21 行分诊 / 规则文档 / ⑦ 段）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> 状态：**已过计划门、已施工、④ 段已签（⑤ 交付待用户终签）**——计划门签行、③ 段出口行、④ 段出口行原文均在 `skills/dev-workflow/references/gate-record.md`（本文件不复抄，防两处维护漂移）。本门**不设议会**（`skills/dev-workflow/references/stage-2b-plan-gate.md:13`）。**步骤框已按 R10② 全部勾终态**（`- [ ]` = 0 / `- [x]` = 37）；勾选后本文件指纹重记见 `gate-record.md` 的 `②→③` 行「增量登记（勾选与指纹重记）」。
> **单块（R6）**：S1 不再拆——spec 237 行 ≤ 350、testcase 78 条 ≤ 80、议会 #2 已收口（`.session/reviews/2026-10-31-221813-observable-s1-spec/round-check.md`）。**S2 / S3 不得提前拆**（PRD §8 执行顺序 S1 → S2 → S3）。

**Goal:** 落「可观察判据」的判据面 S1：一份单源词表/标记表 JSON（9 词 + 8 类标记 + 9 条正反例）、一个只扫 `rules/` + `skills/` 的行级校验器（退出码 0/1/2、`--json` 单源计数）、一份 21 行基线逐行分诊（能改文案的改、只能作术语引用的入豁免）、一份 ≤120 行的规则文档（`rules/observable-criteria.md`，F-10 先行产物），并把 ⑦ 段接进 `npm run check`（不可旁路），新规则同批登记 `baseline.mjs` 使 `baseline 37 → 38`。

**Architecture:** 判定单点 = `scripts/check-observable.mjs` 的纯函数 `evaluateText`（CLI 与前置断言 P-3 共用，D14）；数据单源 = `tools/quality/observable-terms.json`（词表 / 标记表 / 正反例）与 `tools/quality/observable-exempt.json`（行级豁免）；`tools/docgen/card-model/vocab/subjective-terms.mjs` / `criterion-terms.mjs` 降级为**派生**（字面值 0）；门禁接入 = `scripts/check-all.mjs` ⑥ 之后新增 **⑦ 段**，计数单源 = `--json`（`scanned.length` / `hits.length` / `exemptedLines` / `stale.length`），check-all 不重算、不解析文本、不接 `CHECK_BYPASS`。

**Tech Stack:** Node.js ≥ 22（ESM `.mjs`；只用 `node:` 标准库，零第三方依赖）；PowerShell（仓根执行）；测试统一 `node --test "scripts/check-observable.test.mjs"`。

**Spec:** `docs/superpowers/specs/2026-10-31-observable-criteria-rollout-design.md`（**239 行 / SHA256 `B14978DA8C2AE06D4079CE184761B28EB29BC46A614C61B8FDC63574BFD0FE1B`**；`②@observable-criteria-rollout` 已签；本批增量：§4 P-1 两态 `∈ {106, 107}` + `--root` 例外注 + §3 / Q17 两处 pattern 收紧注，其余判据一字未动）

**Testcase:** `docs/superpowers/specs/2026-10-31-observable-criteria-rollout-design-testcase.md`（**248 行 / SHA256 `4E06C56603ED55D9A5F2336348EEFCF8487052C1F7255DEF2F17F7B7F7A205B5`**，**78 条 = 正 31 / 负 34 / 边界 13**，条数与 ID 零变动；`OCR-S1-TC-` 前缀；原由独立 `senior-sdet` 全新上下文编写，本批两态 / pattern / `--root` 例外的注由**独立 sdet 实例**同批改）

**PRD:** `docs/prd/20261031202331-observable-criteria-rollout/index.md`（**362 行 / SHA256 `E38B8BFF7FCCF7C41418A336C1B59EA5CF993D1A0750F6B3A610B8B1D0288B2A`** = 347 + 本批 `§8` 新增 **15 行**「机器可读 F→S 表」＝ 标题 1 + 表头 1 + 分隔 1 + 10 行 F + 2 空行；另加 `:116` / `:290` 两处日期注（`完整` 剔除→9 词，原文保留）；① 已签，本批不改功能点集合 → 不触发 R5）

> **引用口径**：`spec:NN` = 上列 spec 的行号；`testcase:NN` = 同名 `-testcase.md` 的行号；`PRD:NN` = 上列 PRD 的行号。**本 plan 自身行号不写进正文**，凡指向 plan 内部一律写「Task N / 附录 A / 附录 B」。

---

## 全貌确认（事前三步 · 第一步产物）

> 出处：`rules/core-working-principles.md`「事前三步：画全貌、写计划、算长远账」。本节是动手前必填的全貌块，缺失不得动笔。

| 维度 | 结论 |
|---|---|
| **本质** | 不是「加一个 lint」，而是把「判据里能不能用无法二值判的形容词」从**靠自觉**改成**靠退出码**：判定单点（`evaluateText`）+ 数据单点（两个 JSON）+ 门禁插点（⑦ 段）。三者缺一，规则就退化成一层文档。 |
| **同族** | 同族已有 `scripts/check-plan.mjs`（四条子命令 / exit 0-1-2 / 首行 ` => ok|fail`）与 `scripts/check-gate-record.mjs`（安 6 列 / 复用 `splitRow`）；本块**沿用同一套形态**（三档退出码、首行固定、末行固定），不另造范式。 |
| **边界** | 只扫 `rules/` + `skills/` 的 `.md`（PRD C-6 分期）；**不碰**卡面与 `predicates`（S3）、不碰 `tools/docgen/policy/**`（S6 已签零改动）、不做自动改写、不做 365 天到期判定（E-5b 只落 after 记录）。 |
| **验收** | ① `node scripts/check-observable.mjs --check` exit 0 且 `M+P+L=21` / `exemptedLines=L` / `stale=0`；② `npm run check` 绿且含 ⑦ 段；③ `node tools/docgen/cli.mjs gate` → `baseline 38/38`；④ `node scripts/scope-sweep.mjs --check` → `sweep ok`；⑤ testcase 78 条逐条有落点（附录 A）。 |
| **影响面** | 5 个新文件（JSON×2 / 校验器 / 常驻测试 / 规则文档）+ 6 个改文件（`check-all.mjs` / `package.json` / `baseline.mjs` / `baseline.json` / 两个 `vocab/` 派生）+ 上游同批件 2 处（`card-model.test.mjs:350-355`、`agent-card-contract:271`）+ 21 行命中处文案（M 类改文案散落 `rules/` `skills/`） |

**全局联动四问**：

1. **治本了吗** —— 治本。病根是「判据用主观词、靠人判断」，本块的修法是**把判定压成退出码**（退出码不为 0 就过不了门），不是加一层建议性检查；且判定只住一处（`evaluateText`），不会长出第二份判据。
2. **有副作用吗** —— 三处已知副作用，全部有承接：① 新规则进 `rules/` 即会被 ④ 段 markdown 检查与 `gate` 计数扫到 → 同批登记 `baseline.mjs` + `baseline --write`（否则 `gate` 报 `UnregisteredHandwritten`）；② ⑦ 段接进门禁后，任何 `rules/` `skills/` 文案再写主观词即红 → 用**豁免 + 改文案**先到 exit 0 再接 ⑦（spec §7 批内落地顺序）；③ 词表 JSON 化后 `subjective-terms.mjs` 从「字面值」变「派生」，`card-model.test.mjs:350-355` 的逐字断言会红 → 同批改「从 JSON 派生 + 交集空」（spec §8 `:141`）。
3. **跨问题联动吗** —— 与 S2 / S3 同根：S2 依赖本块 JSON（中文名表要复用词表判定）、S3 要在本块校验器上扩判定面。故本块把「导出面 / 判定面 / 计数形态」写成接口小节（唯一契约），S3 只扩面不重写。
4. **跨页面 / 跨项目吗** —— 共享面 = `tools/quality/*.json`（S2 / S3 / 三写作流程共用）+ 校验器（S3 扩面）；`tools/docgen/card-model/vocab/*` 被 15 席卡面渲染共享 → 派生改造必须**同批**改测试，否则全席渲染链跟着红。

**算账（第三步）**：打补丁式「先只加规则文档、校验器后补」短期省事，但规则文档没有退出码 = 靠自觉 = 必然漂移（本仓实测：`spec-testcase-gate` 只写进按需加载的技能时，25 份 spec 零 testcase）。治本式（校验器 + 门禁插点 + 单源 JSON）短期多两个文件，摊到每一条后续规则 / 技能文档都要过这道门，收益线性增长。

---

## Global Constraints

以下每一条对**每个任务**隐含生效（值逐字取自 spec / testcase / 仓内实测）：

1. **判定单点**（spec §4 `:92`、D14 `:195`、testcase 常量 10）：`evaluateText(text, { terms, markers })` → `{ verdict: 'pass'|'fail', matched: [{ term, index }] }`（`matched` **不去重**）；CLI 与 P-3 **只走这一个**纯函数；不得在测试侧写判定 helper（testcase 常量 17）。
2. **数据单点**（spec §3 `:65`、§8 `:138-139`）：`tools/quality/observable-terms.json` 是词表 / 标记表 / 正反例的**唯一写死处**；`vocab/subjective-terms.mjs` / `criterion-terms.mjs` 只留派生（字面出现 0，含注释）；`tools/quality/` 之外不得再有一份同形数组（F10）。
3. **扫描面 = `rules/` + `skills/` 的 `.md`（递归）**（spec §4 `:71`、D1 `:182`）：扩展名大小写不敏感，symlink / junction 跳过；**标题行（`^#+ `）不参与判定**（D27 `:201`）；**围栏代码块内行不参与**（§2 `:26`，与 `check-all.mjs` ④ 段 `fenceMask` 同口径）。
4. **hit 单位 = 行**（D19 `:202`）：一行多词仍 1 条 hit，`terms` 为逗号串 / 数组；`exemptedLines` 按行、`stale` 按条；输出顺序 = `path` 字典序 + 行号升序（§4 `:96`）。
5. **退出码三档 + 末行固定**（spec §4 `:94`、testcase 常量 6）：`0` = `check-observable ok`；`1` = `check-observable fail（命中 N 行 / stale M 条）`；`2` = `check-observable error（<断言号>: <原因>）`；**任何未捕获异常都必须收敛成 exit 2**（parse 失败 / ENOENT 等，不许抛栈）。
6. **`--root` 只换扫描根**（D22 `:205`、testcase 常量 9）：清单 / 豁免默认从**仓根** `tools/quality/*.json` 读；换数据源才用 `--terms <file>` / `--exempt <file>`。
7. **⑦ 段不可旁路、不吞 exit**（spec §7 `:128-130`、D25 `:208`）：失败置 `failed = true`，不降级为 warning；`CHECK_BYPASS` 仍只跳 ⑥；⑦ 段计数**全部取 `--json`**，check-all 不重算、不解析文本。
8. **测试禁自递归**（spec Q21 `:234`、testcase 常量 16）：用例**不得** spawn `npm run check` / `check-all.mjs`；只允许单跑 `node scripts/check-observable.mjs`、源码静态断、`node --test <单文件>`；全量门禁由 ④ 段门行取证。
9. **测试不写仓内文件**（testcase 常量 9）：一律 `mkdtemp` 临时根或内存副本；跑完 `.session/tmp/` 与临时目录空。
10. **新规则必须登记 + 重记基线**（spec §8 `:143`、D23 `:206`）：`tools/docgen/components/baseline.mjs` 加 `rules/observable-criteria.md`，跑 `node tools/docgen/cli.mjs baseline --write`，`baseline N/N` 由 37 变 **38**（门行取证随本批更新）。
11. **批内落地顺序**（spec §7 `:132`，防中途恒红）：① 改文案 → ② 建 / 调豁免直到 `node scripts/check-observable.mjs --check` **exit 0** → ③ 填满分诊表 → ④ 接 ⑦ 段（前置 = ② 已绿）→ ⑤ 跑 `npm run check`。
12. **R8 回扫只认裸命令**：`node scripts/scope-sweep.mjs --check`（**禁用** `npm run doc:sweep -- --check`：PowerShell + npm 10.9 吞掉 `--` 后参数、跑默认分支恒 exit 0 = 假绿）。若因 mtime 时序判红 → **新落**当次 `impact-sheet.md`（`scripts/scope-sweep.mjs:88` 固定查该名），不得改写旧清单凑绿。
13. **零接触**（spec §8 `:142`）：`tools/docgen/policy/**` **一字不动**（S6 已签）；`tools/observation-check/**` 零改动。已签 spec / testcase 在 ③ 段**不得改判据**；要改必须回 ② 段**增量复签**（本批已按计划门 P1-1 做过一次：spec §4 `:87` 与 testcase 常量 13 / B01 的 `.md` 总数改为**施工期两态允许 `∈ {106, 107}`**，归因 = 本块 Task 6 新建 `rules/observable-criteria.md`；其余一字未动）。
14. **词表定稿 9 词**（PRD `:155` + spec §2 `:23`）：自省 / 客观 / 诚实 / 宽松 / 严格 / 清晰 / 准确 / 显著 / 良好；`完整` **已剔除**（D26），`合理` / `充分` 归 `criterionTerms`（6 条）。
15. **仓门禁基线不钉死**（本 plan 落盘前实跑 2026-11-01 11:5x）= `# tests 1166` / `# pass 1164` / `# fail 0` / `# skipped 2`、`baseline 37/37`、`0 findings`、`④ markdown 检查通过（349 个文件 / 1523 张表）`、`⑤`/`⑥` 在位、末行 `check 全部通过`。每加一个文件 / 一张表，文件数与表数按实际漂移，**不钉死**。

---

## 文件结构

| 路径 | 动作 | 职责 |
|---|---|---|
| `tools/quality/observable-terms.json` | 新建 | `terms`(9) / `criterionTerms`(6) / `markers`(8 类) / `samples`(9 条正反例 + `residual`)——**唯一写死处**（spec §3 `:29-52`） |
| `tools/quality/observable-exempt.json` | 新建 | `entries[]` = `{ path, contains, reason, reviewed }` 行级豁免（spec §5 `:98-104`） |
| `scripts/check-observable.mjs` | 新建 | `evaluateText` 纯函数 + 最小语义块 + 8 类 marker + CLI（扫描 / `--json` / `--root` / 退出码 / 前置 P-1～P-4）+ 判定 5「不复制词表」 |
| `scripts/check-observable.test.mjs` | 新建 | 常驻测试：78 条用例（附录 A 逐 ID 落点）；不 spawn 全仓 check |
| `rules/observable-criteria.md` | 新建 | ≤120 行规则文档（六锚：范围 / 条件 / 动作 / 宾语 / 触发时机 / 验证）+ 两句声明（F-10 先行产物） |
| `scripts/check-all.mjs` | 修改 | ⑥ 之后新增 **⑦ 段**（`check-observable --check --json`，失败置 `failed = true`，不接 `CHECK_BYPASS`） |
| `package.json` | 修改 | 新增脚本 `check:observable`（供 S3 两 inspector 调用） |
| `tools/docgen/card-model/vocab/subjective-terms.mjs` | 修改 | 改派生（`Object.freeze([...OBSERVABLE.terms])`，字面 0） |
| `tools/docgen/card-model/vocab/criterion-terms.mjs` | 修改 | 改派生（`Object.freeze([...OBSERVABLE.criterionTerms])`，字面 0） |
| `tools/docgen/test/card-model.test.mjs` | 修改 | `:350-355` 改「从 JSON 派生 + 交集空」（不再对 PRD 行逐字） |
| `docs/prd/20261026205821-agent-card-contract.md` | 修改 | `:271` 原文保留 + 日期注「词表自 2026-10-31 起以 `tools/quality/observable-terms.json` 为唯一源」 |
| `tools/docgen/components/baseline.mjs` | 修改 | 登记 `rules/observable-criteria.md`（`BASELINE_RULES`） |
| `tools/docgen/test/support/dev-workflow-checks.mjs` | 修改 | `withRepoCopy` 的副本清单补 `tools/quality`（否则副本内 `card-model/vocab/*` import 时 ENOENT） |
| `tools/docgen/test/cli-gate.test.mjs` | 修改 | 同上（最小仓副本补 `tools/quality`） |
| `tools/docgen/baseline.json` | 修改（`baseline --write` 产物） | 37 → **38** 条 |
| `docs/reports/2026-10-31-observable-s1-triage.md` | 新建 | 21 行分诊表（6 列表头，一次性产出、写完封存） |
| `docs/after/<时刻>-observable-exempt-expiry-open-decisions.md` | 新建 | `E-5b` 到期触发日 `2027-11-01`（D12 / D20） |
| `rules/**` / `skills/**` 的 21 行命中处 | 修改（M 类改文案） | 能换成可判表述的改文案，不入豁免（分诊表逐行记 `path:line`） |

**接口小节（模块导出面，唯一契约）**：

```text
tools/quality/observable-terms.json
  { terms: string[9], criterionTerms: string[6],
    markers: [{ kind, pattern }×8], samples: [{ term, positive:{input,expect}, negative:{input,expect}, residual }]×9 }
tools/quality/observable-exempt.json
  { entries: [{ path, contains, reason, reviewed }] }
scripts/check-observable.mjs
  export evaluateText(text, { terms, markers }) -> { verdict: 'pass'|'fail', matched: [{ term, index }] }
  CLI: node scripts/check-observable.mjs [--check] [--json] [--root <dir>] [--terms <file>] [--exempt <file>]
  --json -> { scanned: string[], hits: [{ path, line, terms: string[] }], exemptedLines: number, stale: [...], ok: boolean }
tools/docgen/card-model/vocab/subjective-terms.mjs   export subjectiveTerms（frozen，派生）
tools/docgen/card-model/vocab/criterion-terms.mjs    export criterionTerms（frozen，派生）
```

- **`stale` 元素形状**：spec 只定「按条计」（D19 `:202`）与 `--json` 键名（D21 `:204`），元素内部形状**未写死**。本段取**测试判据要求的最小形状** = `{ path, contains }`（D03 / D04 只断 `stale.length`）；**只作内部形状**，不改任何已签判据。
- **最小语义块**：spec §2 `:26` 已写死四终止条件 + 围栏排除；实现落在 `check-observable.mjs` 内（`blockOf(lines, i)`），**不导出**（testcase 常量 17 要求测试黑盒调 CLI）。

---

## 计划门（②→③，开工前签）

> 判据出处：`skills/dev-workflow/references/stage-2b-plan-gate.md`（三条核对 `:16-36`，三权 `:44-50`，收口 `:62-65`）。本门**不设议会**；**申报人 = 主 agent（plan 作者）**，**签字人 = 独立审计实例**（`agents/reviewer-audit.md` 角色卡 path B 贴入，未参与写 plan）——R2：主 agent 不得自签。
>
> 下表是**申报人预填**（供审计对照），**结论以审计本人读 plan 后独立复算为准**；审计只签字不读 = 不通过（`stage-2b-plan-gate.md:49`）。

**计划门前置（结构件，属本门入口而非功能任务）**：PRD `§8` 原只有一行散文 `F → S 覆盖`（`PRD:309`），`coverage` 子命令要求「首列含 `F` / 次列含 `S`」的**表**。已在 `PRD:311-324` **补建机器可读 F→S 表**（10 行 = F-01～F-10），**原文 `PRD:309` 保留不改**；功能点集合零增删 → **不触发 R5**（依据 = 用户 2026-10-29 对 S6 的同类裁定「只加分期说明、未删功能点」）。

### 核对一：功能点全覆盖（= 功能点 → 任务映射表）

| 功能点 | 一句话（PRD `:235-236` / `:244`） | 本 plan 落点 | 覆盖用例（附录 A） |
|---|---|---|---|
| F-01 | 主观词 / 可观察标记 / 正反例清单（单源 JSON） | Task 1 | A01–A15、F10 |
| F-02 | 校验器（S1 扫 `rules/` + `skills/`）：列 `path:line`、只认退出码（前置不过 exit 2） | Task 2、Task 3、Task 4、Task 6、Task 7 | A01–F10 全组（逐条见附录 A 的 F 列） |
| F-10 | 三写作流程引用同一规则（不复制）；先行产物 = `rules/observable-criteria.md` | Task 6 | E05、E06、E10、E11 |

- **PRD 侧集合**：`--stage S1` 命中 3 行 = `F-01` / `F-02` / `F-10`（`PRD:315-316`、`PRD:324`），集合 = **3 个**。
- **取集合命令**（cwd = 仓根，脚本即判）：

  ```powershell
  node scripts/check-plan.mjs coverage --plan docs\superpowers\plans\2026-11-01-observable-s1.md --prd docs\prd\20261031202331-observable-criteria-rollout\index.md --stage S1
  ```

- **Expected**：首行 `coverage: gap 0（prd 3 / plan 3）steps ok => ok`，exit 0。
- **第二半**（每个被覆盖的功能点至少一条执行步骤）：上表 3 行的「本 plan 落点」均为**存在的 Task**（Task 1 / 2 / 3 / 4 / 6 / 7，Task 5 不直接挂 F 但承载 F-02 的基线绿），无悬空。

### 核对二：依赖无环

- **节点**：7 个（`## Task 1:` … `## Task 7:`）。
- **边集**（每条 `Consumes:` 只指已完成的上游任务）：

| Task | 指向 | 边 |
|---|---|---|
| T1 | 无 | — |
| T2 | T1 | T1→T2 |
| T3 | T1、T2 | T1→T3、T2→T3 |
| T4 | T3 | T3→T4 |
| T5 | T4 | T4→T5 |
| T6 | T5 | T5→T6 |
| T7 | T6 | T6→T7 |

- **拓扑序**：`T1, T2, T3, T4, T5, T6, T7` 可完成；**回边 0**（**7** 条边：T2 1 / T3 2 / T4 1 / T5 1 / T6 1 / T7 1）。
- **取命令**：

  ```powershell
  node scripts/check-plan.mjs deps --plan docs\superpowers\plans\2026-11-01-observable-s1.md
  ```

- **Expected**：首行 `deps: cycle 0 dangling 0（nodes 7 / edges 7） => ok`，exit 0。
- **R4 抽查**（本文件**无**「新增设计决策」节）：

  ```powershell
  (Select-String -Path docs\superpowers\plans\2026-11-01-observable-s1.md -Pattern '^## 新增设计决策').Count
  ```

  期望 `0`。

### 核对三：功能块 ↔ testcase 一一映射

- **一个功能块**（S1）对应**一份** testcase：`docs/superpowers/specs/2026-10-31-observable-criteria-rollout-design-testcase.md`（78 条）。
- **双向**：testcase 的 78 个 ID ↔ 附录 A **78 行**，`missing` / `dangling` 均 0；逐 ID 落点见**附录 A**。
- **取命令**：

  ```powershell
  node scripts/check-plan.mjs map --plan docs\superpowers\plans\2026-11-01-observable-s1.md
  ```

- **Expected**：首行 `map: missing 0 dangling 0（cases 78 / mapped 78） => ok`，exit 0。
- **规模（同门附核，`size` 不计入三条核对）**：

  ```powershell
  node scripts/check-plan.mjs size --spec docs\superpowers\specs\2026-10-31-observable-criteria-rollout-design.md --testcase docs\superpowers\specs\2026-10-31-observable-criteria-rollout-design-testcase.md --rounds 3
  ```

  **Expected**：`size: spec 237/350 tc 78/80 rounds 3/3 => ok`，exit 0（`rounds` = 3 取自议会 #2 轮次账 4 轮 → 按块计法取 3 ≤ 3；见「遗留与留观」L-6）。

### 签行（待签，2026-11-01）

> 结论与证据原文由独立审计实例写入 `skills/dev-workflow/references/gate-record.md` 的 `②→③@observable-criteria-rollout` 行（本文件不复抄）。本门「过」= 可进 ③，不等于 ③ 已施工。

---

## 存量 spec 豁免点名（`spec-testcase-gate`，进 ③ 必点）

> 出处：`rules/dev-workflow-mainline.md`「例外」节——进 ③ 必须在 plan 或交接材料里点名两件事。

1. **豁免的存量 spec（2026-10-18 之前定稿，共 25 份）**：`2026-09-27-retro-suite-design.md`、`2026-09-28-evolving-skills-design.md`、`2026-09-28-evolving-step3-design.md`、`2026-09-28-l3-l4-promotion-design.md`、`2026-09-29-aas-skill-deps-design.md`、`2026-10-01-retro-flywheel-blueprint.md`、`2026-10-01-retro-self-improvement-design.md`、`2026-10-02-session-dir-layout-design.md`、`2026-10-07-moment-context-and-timeline-design.md`、`2026-10-08-rule-optimizer-design.md`、`2026-10-09-global-ask-rewrite-design.md`、`2026-10-09-rule-suite-design.md`、`2026-10-09-rule-type-scoring-design.md`、`2026-10-09-skill-authoring-design.md`、`2026-10-09-use-rule-skills-design.md`、`2026-10-10-review-branch-design.md`、`2026-10-10-review-loop-l3-project-type-design.md`、`2026-10-10-rules-migration-design.md`、`2026-10-11-type-rules-external-design.md`、`2026-10-14-execution-assurance-design.md`、`2026-10-14-review-loop-evolution-design.md`、`2026-10-15-cognitive-rule-landing-gate-design.md`、`2026-10-15-verification-audit-checklist-design.md`、`2026-10-17-parliament-design.md`、`2026-10-17-systematic-repair-design.md`（目录 `docs/superpowers/specs/`）。
2. **升级时点（事件型，可核）**：上述任一份 spec **下一次被修订并进入 plan 的那一刻**——那一刻必须先补同目录 `<名>-testcase.md`，否则按 `spec-testcase-gate` 打回。**S1 自身的 spec / testcase 于 2026-10-31 定稿（2026-11-01 增量复签），不在豁免内**。

---

## 遗留与留观（登记，不单开任务、不改判据）

来源 = `docs/handoffs/2026-11-01-observable-s1-plan-gate.md`「遗留裁决与留观项」+ `skills/dev-workflow/references/gate-record.md` 的 `②@observable-criteria-rollout` 行 P2 + 本批实测。

| # | 项 | 现状 | 触发信号 / 收敛时机 |
|---|---|---|---|
| L-1 | 侦探未开（② 段 P2-①） | **用户 2026-11-01 裁定「不补，顺延到 ④ 段」** | ④ 段 sdet + 独立审计实跑复算 + 行为核对时一并核；门行如实记「侦探未开 → ④ 段已核」 |
| L-2 | `agent-card-contract` PRD `:271` 的 5 词锚 | 开 | **Task 1**：原文保留 + 日期注（spec §8 `:140`） |
| L-3 | `card-model.test.mjs:350-355` 逐字断言 | 开 | **Task 1** 同批改「从 JSON 派生 + 交集空」（spec §8 `:141`） |
| L-4 | 豁免审批写入门行备注的**具体格式** | 未定 | **Task 4 首次新增豁免时**定：④ / ⑤ 门行「核了什么」列写「豁免条目数 = N（新增 k / 删除 j）」 |
| L-5 | `E-5b` 到期（365 天） | 本块不实现（E-5b） | **Task 5** 落 `docs/after/<时刻>-observable-exempt-expiry-open-decisions.md`，触发日写死 `2027-11-01` |
| L-6 | 议会 #2 轮数 4 vs `size` 上限 3 | 该块实际 4 轮（`progress.md`），按 S4 先例「超限照判 + 门行附裁定，不许改小」 | 本门 `--rounds 3` 只作规模附核；如审计要求按 4 记，则门行写 `rounds 4/3 => fail` + 附裁定（同 `③@S4` 先例） |
| L-7 | PRD `:301` S1 行的「23 行 / 77 行 / 21 行」三口径并存 | 已有 2026-11-01 日期注（② 段增量），原文保留 | 本块不改；若 S1 收口时需写入实测 `M/P/L`，只加注 |
| L-8 | 分诊表落 `docs/reports/` 是否算本块交付物 | **算**（交接词开放问题 2 推断 + spec §9.3 `:166` 明写「③ 段申报件」） | **Task 5**；④ 段对账源 = 分诊表 + 门行 `exemptedLines` |
| L-9 | `rules/observable-criteria.md` 由谁写 | **本块直接写**（spec Q3 `:216` 已裁定；不用 `rule-writer` 起草再体检两遍） | **Task 6**；写后按 `rule-inspector` 的六锚自查 |
| L-10 | S4 渲染 spec 的「现行判据块 + 日期注」 | 不在本块（PRD C-7） | S2 |

---

## Task 1: 清单 JSON 单源 + 两个 `vocab/` 派生 + 上游同批件

**Files:**
- Create: `tools/quality/observable-terms.json`
- Modify: `tools/docgen/card-model/vocab/subjective-terms.mjs`、`tools/docgen/card-model/vocab/criterion-terms.mjs`
- Modify: `tools/docgen/test/card-model.test.mjs`（`:350-355`）
- Modify: `docs/prd/20261026205821-agent-card-contract.md`（`:271`）

**Interfaces:**
- Consumes: 无
- Produces: `observable-terms.json`（`terms` 9 / `criterionTerms` 6 / `markers` 8 类 / `samples` 9 条）+ 两个冻结派生模块

- [x] **Step 1: 建 `tools/quality/observable-terms.json`**

逐字照 spec §3 `:31-51` 落地：`terms` = 9 词（`自省` / `客观` / `诚实` / `宽松` / `严格` / `清晰` / `准确` / `显著` / `良好`，**不含 `完整`**）；`criterionTerms` = 6 词（`处置` / `依据` / `充分` / `合理` / `及时` / `适当`）；`markers` = 8 类（`compare` / `pathline` / `exit` / `diff` / `count` / `empty` / `nonempty` / `enum`），pattern 逐字照 `spec:36-43`；`samples` = **每词恰一条**，`positive.expect = "pass"`、`negative.expect = "fail"`，`residual` **键必在**（可为 `null`；非 `null` 时 `who` 非空 + `sample` 正整数）。

**正例句必须自带 marker、反例句必须含该词且无 marker**（P-3 双向断言靠它，B08 / B09 / B13 逐条验）。示例（`自省` 一条，其余 8 条同形各写一句）：

```json
{ "term": "自省",
  "positive": { "input": "每轮收尾必须写自省结论：三性验证逐条附 path:line；缺一条 == 不合格。", "expect": "pass" },
  "negative": { "input": "每轮收尾要自省，想清楚有没有长期方案。", "expect": "fail" },
  "residual": { "who": "reviewer-qa", "sample": 3 } }
```

- [x] **Step 2: 两个 `vocab/` 改派生**

`subjective-terms.mjs` → `export const subjectiveTerms = Object.freeze([...OBSERVABLE.terms])`；`criterion-terms.mjs` → `export const criterionTerms = Object.freeze([...OBSERVABLE.criterionTerms])`。读 JSON 的写法：`import { readFileSync } from 'node:fs'` + `JSON.parse(readFileSync(new URL('../../../quality/observable-terms.json', import.meta.url), 'utf8'))`——**只 import `node:` 与目录内相对路径**（S1 的 `card-model.test.mjs:1249-1256` 断言 `card-model/**` 无反向 import，Global 13）。**文件内字面值 0 处**（含注释也不写词面，F01）。

- [x] **Step 3: `card-model.test.mjs:350-355` 改「从 JSON 派生 + 交集空」**

不再对 `agent-card-contract` PRD `:271` 逐字；改为：① 两模块导出值 = `observable-terms.json` 的两表（`deepStrictEqual`）；② 两表交集为空；③ `Object.isFrozen`。**不删断言换绿**——逐字断言换成值相等断言（判别力不降）。

- [x] **Step 4: PRD `:271` 原文保留 + 日期注**

在 `docs/prd/20261026205821-agent-card-contract.md` 的 `:271` 行**行末**追加：`（2026-10-31 注：词表自本日起以 \`tools/quality/observable-terms.json\` 为唯一源；本行 5 词为该源的子集，原文保留不改）`。**不改任何 5 词字面**（F05 断「5 词 ⊆ `J.terms`」+「含 `2026-10-31`」+「含 `tools/quality/observable-terms.json`」）。

- [x] **Step 5: 验收**

```powershell
node --test --test-reporter=tap tools/docgen/test/card-model.test.mjs
node tools/docgen/cli.mjs gate
```

**Expected**：`# tests 58` / `# pass 58` / `# fail 0`；`baseline 37/37`（本任务未加规则，仍 37）。

---

## Task 2: 判定内核（`evaluateText` + 最小语义块 + 8 类 marker）+ 建常驻测试

**Files:**
- Create: `scripts/check-observable.mjs`（本任务只落**纯函数面**）
- Create: `scripts/check-observable.test.mjs`（helper + 21 条用例）

**Interfaces:**
- Consumes: Task 1（`observable-terms.json`）
- Produces: `evaluateText(text, { terms, markers }) → { verdict, matched: [{ term, index }] }`；内部 `blockOf(lines, i)`（**不导出**）

- [x] **Step 1: `evaluateText` 纯函数**

对入参 `text` 按行切分，返回 `verdict` + `matched`（`matched` **不去重**：每次出现一条 `{ term, index }`，`index` = 该词在该行内的字符下标）。判定语义 = spec §4 判定 1–2：命中行的**最小语义块**内至少一个 marker → `pass`，否则 `fail`。**此步先实现 `terms` 子串匹配 + markers 正则匹配 + 最小语义块 + 标题行 / 围栏排除**。

- [x] **Step 2: 最小语义块（四终止条件 + 围栏）**

`blockOf(lines, i)`：bullet → 该 bullet 续行 + 其缩进子块；段落 → 连续非空行；另加**紧随的连续表格**。终止：① 空行 ② 同级或更高级标题 ③ 同缩进级别的下一条 bullet ④ 表格结束后的下一个非表格行。围栏（```）内行不参与命中，围栏开闭用与 `scripts/check-all.mjs` ④ 段同口径的 `fenceMask`（**复用**：`tools/execution-matrix/markdown-rows.mjs` 已导出 `fenceMask`，不另写第二份）。标题行 `^#+ ` 直接跳过（D27）。

- [x] **Step 3: 建 `scripts/check-observable.test.mjs`（helper + 21 条）**

helper 全部按 testcase §0 常量展开（`TERMS9` / `KINDS8` / `assertTerms` / `assertNoOverlap` / `assertMarkers` / `assertSamples` / `assertResidual` / `assertTermsUnique`）；读文件一律 `readFileSync`，**不写仓内文件**（常量 9）。

| ID | 断言（判据出处） |
|---|---|
| OCR-S1-TC-A01 | `J.terms.length === 9` 且逐字等于 9 词常量、不含 `完整`（`testcase:89`） |
| OCR-S1-TC-A02 | 内存删一词 → 断言必抛（`testcase:90`） |
| OCR-S1-TC-A03 | 内存互换 `清晰` / `准确` 位置 → 必抛（逐字比对，不是长度 / 集合） |
| OCR-S1-TC-A04 | `terms ∩ criterionTerms === []`、`criterionTerms.length === 6` |
| OCR-S1-TC-A05 | 把 `合理` 塞进 `terms` → 必抛 |
| OCR-S1-TC-A06 | `kinds` 8 类逐字齐、无禁用 literal（`=` / `出现` / `命令` / `词表`）、每项 `pattern` 与 `literal` 恰有其一、`enum` 冒号后带字面量 |
| OCR-S1-TC-A07 | `empty` 改成 `literal:'出现'` → 必抛 |
| OCR-S1-TC-A08 | pattern+literal 双带 / pattern 恰为 `=` / `enum` 无字面量 → 三者各必抛 |
| OCR-S1-TC-A09 | `samples` 覆盖 9 词、条数 9、`expect` 逐字、`input.trim()` 非空、`residual` 键必在 |
| OCR-S1-TC-A10 | 删 negative / 同 term 两条 / `input='   '` / `expect='PASS'` → 四者各必抛 |
| OCR-S1-TC-A12 | `residual` 为 `null` 放行；对象形态 `who` 非空 + `sample` 正整数 |
| OCR-S1-TC-A13 | `who:''` / `sample:0` / `sample:'3'` / `{}` / `''` / `[]` 六者各必抛；`null` 对照合格 |
| OCR-S1-TC-A14 | `terms` 无重复、无空串、无首尾空格 |
| OCR-S1-TC-A15 | 重复词 / 空串 / 前导空格三构造各必抛 |
| OCR-S1-TC-B08 | 9 条 samples 双向：正例 `pass` 且 `matched` 含该 term；反例 `fail` 且 `matched` 含该 term；`matched` 不去重（`testcase:114`） |
| OCR-S1-TC-F01 | 两 `vocab/` 字面 0 处；导出值 = JSON 两表；`Object.isFrozen`；交集空 |
| OCR-S1-TC-F02 | 内存旧形态源码（字面数组）→ 必抛（「不得再写字面值」的判别力） |
| OCR-S1-TC-F04 | `node --test card-model.test.mjs` 绿 + 该文件不含旧五词字面数组形态 |
| OCR-S1-TC-F05 | PRD `agent-card-contract:271` 5 词仍在、逐个 ⊆ `J.terms`、文件含 `2026-10-31` 与 `tools/quality/observable-terms.json` |
| OCR-S1-TC-F06 | 删日期注 → F05 第 ③ 段断言必抛 |
| OCR-S1-TC-F10 | `tools/` + `scripts/` 扫九词字面数组形态恰 1 处 = `tools/quality/observable-terms.json`；内存副本 >1 → 必抛 |

- [x] **Step 4: 验收**

```powershell
node --test --test-reporter=tap scripts/check-observable.test.mjs
```

**Expected**：`# tests 21` / `# pass 21` / `# fail 0`（Step 3 的 21 条全绿）。

---

## Task 3: CLI 外壳（扫描面 / `--json` / `--root` / 退出码 / 前置 P-1～P-3）

**Files:**
- Modify: `scripts/check-observable.mjs`（加 CLI 与前置断言）
- Modify: `scripts/check-observable.test.mjs`（+31 条）

**Interfaces:**
- Consumes: Task 1、Task 2（`evaluateText`）
- Produces: CLI 面（`--check` / `--json` / `--root` / `--terms` / `--exempt`）+ 退出码 0/1/2 + 末行三形态 + P-1/P-2/P-3

- [x] **Step 1: 扫描面 + 两次独立遍历（P-1）**

扫描 `rules/` 与 `skills/` 下全部 `.md`（递归，扩展名大小写不敏感，symlink / junction 跳过）；`--root <dir>` **只换扫描根**。P-1 = 两次独立遍历（① 目录递归收集路径 ② 对收集结果数文件）数相等，且 `rules/` 与 `skills/` 各 ≥1；扫描仓根时另断「总数 **∈ {106, 107}**」（**施工期两态**：`rules/observable-criteria.md` 由 Task 6 创建——落地前 106、落地后 107；既不在集合内才红。spec §4 `:87` 已同批改为该口径）；扫描根不存在 / 不可读 / 0 个 `.md` → `exit 2`。

- [x] **Step 2: 判定 3–4（豁免前置位）+ hit 输出**

`--exempt` 在 Task 4 才接线；本步先留「豁免读入」的**空实现**（`entries: []`）+ 判定 4 红输出：每行一条 `path:line  term=<词1,词2…>  无结构化可观察标记`；顺序 = `path` 字典序 + 行号升序。

- [x] **Step 3: `--json` 与末行**

`--json` 输出 `{ scanned: string[], hits: [{path,line,terms:string[]}], exemptedLines, stale: [...], ok }`（键序照 D21 / Q5）；末行三形态逐字（常量 6）。`ok === false` 当且仅当 exit 1。

- [x] **Step 4: 前置 P-2 / P-3**

P-2：`JSON.parse` 成功；`terms` / `criterionTerms` / `markers` 非空；`samples` 覆盖全部 `terms`。P-3：每条 sample **在内存**跑 `evaluateText`——正例 `pass` 且 `matched` 含该 term、反例 `fail` 且 `matched` 含该 term；不过 → `exit 2`（不落盘，B10 断前后目录清单相等）。任何未捕获异常收敛成 `exit 2`。

- [x] **Step 5: 补 31 条用例（C 组 21 + B 组 10）**

| ID | 断言（判据出处） |
|---|---|
| OCR-S1-TC-B01 | `scanned` 是 `string[]` 且 = 测试侧 Node 同口径遍历数；仓根总数 ∈ {106,107}（两态）；`.MD` 计入；junction 内文件不计（`testcase:108`） |
| OCR-S1-TC-B02 | 空扫描根 → exit 2 + 末行 `P-1` + 无 `term=` 行 |
| OCR-S1-TC-B04 | 默认读仓根 JSON：无 `P-2` 错、exit ∈ {0,1} |
| OCR-S1-TC-B05 | 截断 JSON / `terms:[]` → 两者各 exit 2 + `P-2`（语法错也收敛，不抛栈） |
| OCR-S1-TC-B06 | `markers:[]` → exit 2 + `P-2` |
| OCR-S1-TC-B07 | `samples` 删 `良好` → exit 2 + `P-2` |
| OCR-S1-TC-B09 | 反例改成带 marker 的合格句 → exit 2 + `P-3` |
| OCR-S1-TC-B10 | 反例改成不含该词 → exit 2 + `P-3`；连跑两次前后临时目录清单逐字相等 |
| OCR-S1-TC-B12 | 不存在根 / 删 `skills/` 后重跑 → exit 2（含 `P-1`）；单文件根对照 → exit 0 且 `scanned.length===1` |
| OCR-S1-TC-B13 | 正例改成不含该词 → exit 2 + `P-3` |
| OCR-S1-TC-C01 | 仅主观词行 → exit 1 + 该 hit 行逐字 + 末行 `fail（命中 1 行 / stale 0 条）` |
| OCR-S1-TC-C02 | 同块带 `docs/a.md:12` → exit 0 + 末行 `ok` + 无 `term=` |
| OCR-S1-TC-C03 | bullet 续行带 `计数 = 3` → exit 0（跨行同块） |
| OCR-S1-TC-C04 | 紧随连续表格 → exit 0 |
| OCR-S1-TC-C05 | 跨同级标题 → exit 1（命中 1 行） |
| OCR-S1-TC-C06 | 同缩进兄弟 bullet → exit 1 |
| OCR-S1-TC-C07 | 缩进子 bullet → exit 0 |
| OCR-S1-TC-C08 | 空行截断 → exit 1 |
| OCR-S1-TC-C09 | 裸 `=` → exit 1 + `term=客观` |
| OCR-S1-TC-C10 | `出现` / `命令` / `词表` 三句各 exit 1 |
| OCR-S1-TC-C11 | 8 类 marker + 全角 `≤` / `＝` 共 10 文件单独各 exit 0；并跑 hits 0 |
| OCR-S1-TC-C13 | `exit 0` / `exit code 0` / `退出码为 0` / `退出状态是 0` 四者各 exit 0 |
| OCR-S1-TC-C15 | 同行两词 → 1 条 hit、`terms.length===2`、按行聚合 |
| OCR-S1-TC-C16 | `--json` 顶层键序逐字；`scanned` 为数组；`hits` 顺序 = path 字典序 + 行号升序；exit 1 |
| OCR-S1-TC-C17 | `--root` 只换扫描根：`docs/` / `README.md` / `.txt` / `.mjs` 不扫；`skills/y/references/z.md` 在 `scanned` 且产 1 条 hit |
| OCR-S1-TC-C19 | `exit` 无数字 / `退出码：见上` / `退出码是 通过` / 裸 `枚举：` 四者各 exit 1 |
| OCR-S1-TC-C20 | 更深标题不截断 → exit 0；围栏内命中行不参与 → exit 0 且 `hits` 空 |
| OCR-S1-TC-C22 | 裸 `diff` / 「不要求非空」→ 两者各 exit 1 |
| OCR-S1-TC-C23 | 标题行 `## 自省必须给长期方案` → exit 0、`hits` 空 |
| OCR-S1-TC-C24 | `docs/a.md:12` → exit 0；`20:23` → exit 1 |
| OCR-S1-TC-C25 | 同词写进正文 → exit 1 + `term=自省`（标题不扫 ≠ 该词可逃） |

- [x] **Step 6: 验收**

```powershell
node --test --test-reporter=tap scripts/check-observable.test.mjs
```

**Expected**：`# tests 52` / `# pass 52` / `# fail 0`（21 + 31）。

---

## Task 4: 豁免清单（`observable-exempt.json`）+ E-1～E-5 + stale + P-4

**Files:**
- Create: `tools/quality/observable-exempt.json`（初始 `{"entries": []}`）
- Modify: `scripts/check-observable.mjs`（豁免读入 / `exemptedLines` / `stale` / P-4）
- Modify: `scripts/check-observable.test.mjs`（+12 条）

**Interfaces:**
- Consumes: Task 3（CLI + 扫描）
- Produces: `--exempt` 数据源 + 判定 3（`已豁免`）+ E-1～E-5 结构校验（P-4 → exit 2）+ stale（exit 1）

- [x] **Step 1: 豁免读入 + 判定 3**

`entries[]` 的 `{ path, contains, reason, reviewed }` 四字段齐；`contains` 在 `path` 文件内命中该行 → 分类 `已豁免`（计 `exemptedLines`，**不产出 hit**）；豁免粒度 = 只摘 `contains` 命中行，不整文件放行（D4 `:185`）。

- [x] **Step 2: 结构校验（P-4）与 stale（exit 1）**

P-4（→ exit 2）：四字段齐 / `contains` 非空 / 同一 `path` 内 `contains` 不重复 / `contains` 在该文件**唯一**（E-3）/ `reviewed` 可解析为日期且不早于 `2026-01-01`（E-5）。stale（→ exit 1）：`path` 不存在或 `contains` 在该文件 0 命中。**E-5b（365 天到期）不实现**——源码**不得含** `365` / 「到期 / 过期」判定分支（D12 源码静态断言）。

- [x] **Step 3: 补 12 条用例（D 组）**

| ID | 断言（判据出处） |
|---|---|
| OCR-S1-TC-D01 | 正文行豁免生效：exit 0、`exemptedLines===1`、`stale===[]`、`reason` 非空（`testcase:150`） |
| OCR-S1-TC-D02 | 删 `reason` → exit 2 + `P-4` + stdout 无 `term=` |
| OCR-S1-TC-D03 | `path: rules/nope.md` → exit 1 + `stale.length===1` + 末行 `stale 1 条` |
| OCR-S1-TC-D04 | `contains` 0 命中 → exit 1 + `stale 1 条` + `exemptedLines===0` |
| OCR-S1-TC-D05 | `contains` 恰 1 处 → exit 0 + `exemptedLines===1` |
| OCR-S1-TC-D06 | `contains` 出现 2 / 3 处 → 各 exit 2 + `P-4`；近似串不影响唯一性 → exit 0 |
| OCR-S1-TC-D08 | 同 path 两条不同 `contains` → exit 0 + `exemptedLines===2` |
| OCR-S1-TC-D09 | 同 path 同 `contains` 两条 → exit 2 + `P-4` |
| OCR-S1-TC-D10 | `reviewed:'2026-10-31'` / `'2026-01-01'`（恰下界）→ 两者各 exit 0 |
| OCR-S1-TC-D11 | `2025-12-31` / `2026-13-45` / `昨天` → 三者各 exit 2（P-4） |
| OCR-S1-TC-D12 | `reviewed:'2026-01-05'` → exit 0；源码**不含** `365` / 「到期」「过期」 |
| OCR-S1-TC-D13 | 同文件两命中行只豁免第 1 行 → exit 1、`hits.length===1`、`exemptedLines===1` |

- [x] **Step 4: 验收**

```powershell
node --test --test-reporter=tap scripts/check-observable.test.mjs
```

**Expected**：`# tests 64` / `# pass 64` / `# fail 0`（52 + 12）。

---

## Task 5: 21 行逐行分诊（改文案 / 豁免 / 分诊表）+ `E-5b` 到期记录

**Files:**
- Create: `docs/reports/2026-10-31-observable-s1-triage.md`
- Create: `docs/after/<时刻>-observable-exempt-expiry-open-decisions.md`
- Modify: `tools/quality/observable-exempt.json`（L 类入豁免）
- Modify: `rules/**` / `skills/**` 的 M 类命中行（改文案）
- Modify: `scripts/check-observable.test.mjs`（+3 条）

**Interfaces:**
- Consumes: Task 4
- Produces: 真实仓 `--check` **exit 0**（`M + P + L = 21`、`exemptedLines = L`、`stale = 0`）；分诊表 6 列 × 21 行

- [x] **Step 1: 逐行取命中（21 行，按行计）**

```powershell
((Get-ChildItem rules,skills -Recurse -Filter *.md | Select-String -Pattern '自省|客观|诚实|宽松|严格|清晰|准确|显著|良好') | Where-Object { $_.Line -notmatch '^\s*#' } | Select-Object -Unique Path,LineNumber | Measure-Object).Count
```

**Expected**：`21`（= spec §9.3 `:175` 的取数口径）。**注意**：本代码块里的 `|` 是**真交替**（PowerShell 单引号内 `|` 交给 `Select-String` 作正则交替）；`spec:175` 表格单元格里写的是展示转义 `\|`（不转义会破表），**不要抄那个形态**（抄了会变成「匹配字面竖线」→ 实跑恒 0）。**若实跑不等于 21**：不改基线数，先核是否本批已改过文案 / 是否新增命中，如实记入分诊表并在门行写实测值（**不许凑数**）。

- [x] **Step 2: 三分类逐行定档**

| 分类 | 处置 |
|---|---|
| **M**（改文案） | 把主观词换成可判表述（如「严格」→「逐条判 `pass` / `fail`」），**不入豁免** |
| **P**（已合格） | 最小语义块内已有 marker → 不改不豁免（**这一档保证「不为本来合格的行补空转豁免」**） |
| **L**（合法保留） | **只许术语引用 / 词表自身**（如「自省」作规则概念名、「宽松词」作术语）→ 入豁免，`reason` 必须写「这是术语引用，不是评价」+ **该术语出处**（`path:line`）；预期 **L ≤ 8** |

- [x] **Step 3: 落分诊表 `docs/reports/2026-10-31-observable-s1-triage.md`**

表头**固定 6 列**：`| path:line | 命中词 | 块内 marker（有/无） | 分类（改文案 / 已合格 / 合法保留） | 处置 | 豁免 reason |`；每行一条命中；文末写对账行 `M + P + L = 21`、`exemptedLines = L`、`stale = 0`、`L ≤ 8`。**写成一次性产出，写完封存**（不被后续课题续写，故落 `docs/reports/` 而非 `docs/research/`）。

- [x] **Step 4: 豁免到 exit 0**

先把 M 类文案改完 → 再把 L 类入 `observable-exempt.json`（每条带 `contains` + `reason` + `reviewed`）→ 反复跑到：

```powershell
node scripts/check-observable.mjs --check
```

**Expected**：末行 `check-observable ok`，exit 0；`--json` 的 `exemptedLines` = 分诊表 L、`stale` 空、`hits` 空。

- [x] **Step 5: `E-5b` 到期记录落 `docs/after/`**

新建 `docs/after/<YYYYMMDDHHmmss>-observable-exempt-expiry-open-decisions.md`（前缀 = **创建时刻**）：四要素（现状 = S1 不判到期；触发日写死 `2027-11-01`；触发条件 = 首个 `reviewed` 满 365 天；兜底 = 由 ④ 段升级为规则 / 或同批改 spec §5 E-5b）。文件头写「状态：未决（等待到期触发）」与「何时搬走」= 2027-11-01 由该段实现并迁出。

- [x] **Step 6: 补 3 条用例（E08 / E09 / E12）**

| ID | 断言（判据出处） |
|---|---|
| OCR-S1-TC-E08 | 分诊表表头恰 6 列、`M+P+L===21`、`json.exemptedLines===L`、`json.stale.length===0`、`L <= 8`、`hits` 去重后为 0（`testcase:173`） |
| OCR-S1-TC-E09 | 构造 `{M:0,P:0,L:21}` → `assertTriage` 必抛（全豁免 = 假绿，同时破 `L ≤ 8`） |
| OCR-S1-TC-E12 | 构造 `{M:21,P:0,L:0,hits:1}` → 必抛（全改文案但 hit 未清 = 分类不实） |

- [x] **Step 7: 验收**

```powershell
node --test --test-reporter=tap scripts/check-observable.test.mjs
node scripts/check-observable.mjs --check --json
```

**Expected**：`# tests 67` / `# pass 67` / `# fail 0`（64 + 3）；`--check` exit 0、`hits` 空、`stale` 空、`exemptedLines` = L。

---

## Task 6: `rules/observable-criteria.md`（≤120 行）+ 判定 5「不复制词表」

**Files:**
- Create: `rules/observable-criteria.md`
- Modify: `scripts/check-observable.mjs`（判定 5）
- Modify: `scripts/check-observable.test.mjs`（+4 条）

**Interfaces:**
- Consumes: Task 5
- Produces: 规则文档 + 判定 5（`rules/observable-criteria.md` 专判）+ 该文件 `hits = 0`

- [x] **Step 1: 写规则文档（≤120 行）**

六锚小节按 `rule-writer` 四要素 + 触发时机 + 验证：`## 范围` / `## 条件` / `## 动作` / `## 宾语` / `## 触发时机` / `## 验证`；正文只写「什么时候跑、红了怎么看、豁免怎么走、去哪查词表」，**不复制任何词表 / 正则 / 词面枚举**（judgment 只住 JSON + 校验器，spec §6 `:121`）。两句声明必在：`不因来源豁免` + `与豁免清单冲突时以豁免清单为准`。示例句**必须自带 marker**（如「结论附 `path:line`;」）；**该文件不得新增任何豁免条目**：确需提及词面时，改写为自带 marker 的可判句（或指向 `tools/quality/observable-terms.json` 而不复述词面），最终使该文件 `hits = 0` 且 `exemptedLines` 不因它变化——否则 E08 的 `exemptedLines = L`（`testcase:173`，L = 21 行分诊表的「合法保留」数）会红。

- [x] **Step 2: 判定 5（复制判据）**

落在 `scripts/check-observable.mjs`（**唯一实现点**，测试黑盒调 CLI、不写 helper）：① 出现任一 `markers[].pattern` 原文（≥8 字符）→ 红；② 同一行 / 同一表行里 ≥2 个 `terms` 词连续枚举（只隔 `、` / `，` / `/` / 空格）→ 红；③ 单个词面单独出现在叙述句里 → 绿。命中即 `exit 1`。

- [x] **Step 3: 规则文档自身过 ⑦ 段**

`--check` 对该文件 `hits = 0`；`exemptedLines` 仍 = 分诊表 L（**未因规则文档增加**）；豁免条目数 ≤ 该文件叙述行数（G-7 人工兜，④ 段核）。

- [x] **Step 4: 补 4 条用例**

| ID | 断言（判据出处） |
|---|---|
| OCR-S1-TC-E05 | Node 口径 `lineCount <= 120`；六锚各命中；两句声明各命中；120 / 121 边界按 ≤ 判（`testcase:171`） |
| OCR-S1-TC-E06 | 副本追加 pattern 原文（≥8 字符）→ exit 1（判定 5 红，测试不写 helper） |
| OCR-S1-TC-E10 | 副本追加单词面叙述句 → exit 0（单测黑盒：单词面不算复制词表） |
| OCR-S1-TC-E11 | 副本追加同行 ≥2 词枚举 → exit 1 + 末行 fail |

- [x] **Step 5: 验收**

```powershell
node --test --test-reporter=tap scripts/check-observable.test.mjs
node scripts/check-observable.mjs --check --json
```

**Expected**：`# tests 71` / `# pass 71` / `# fail 0`；`--check` exit 0。

---

## Task 7: ⑦ 段接入 + `package.json` + baseline 登记 37 → 38 + R8 回扫

**Files:**
- Modify: `scripts/check-all.mjs`（⑥ 之后新增 ⑦ 段）
- Modify: `package.json`（`check:observable`）
- Modify: `tools/docgen/components/baseline.mjs` + `tools/docgen/baseline.json`
- Modify: `scripts/check-observable.test.mjs`（+7 条）

**Interfaces:**
- Consumes: Task 6
- Produces: ⑦ 段（首行 `[observable] 扫描 N 个 .md / 未豁免命中 H 行 / 已豁免 E 行 / stale S 条`）+ `npm run check` 绿 + `baseline 38/38`

- [x] **Step 1: 接 ⑦ 段（前置 = Task 5 Step 4 已 exit 0）**

在 `scripts/check-all.mjs` 的 **⑥ 段之后**新增：跑 `node scripts/check-observable.mjs --check --json`，解析其 `--json` 取 `scanned.length` / `hits.length` / `exemptedLines` / `stale.length` 打印首行；非 0 状态置 `failed = true`（**不降级 warning、不接 `CHECK_BYPASS`**，该开关仍只跳 ⑥）。check-all **不重算、不解析校验器的文本输出**（数字单源 = `--json`）。

- [x] **Step 2: `package.json` 加 `check:observable`**

值 = `node scripts/check-observable.mjs`（可带 `--check`），供 S3 的两 inspector 调用。

- [x] **Step 3: baseline 登记 + 重记**

`tools/docgen/components/baseline.mjs` 的 `BASELINE_RULES` 加 `rules/observable-criteria.md`（不登记 → `gate` 报 `UnregisteredHandwritten`）→

```powershell
node tools/docgen/cli.mjs baseline --write
node tools/docgen/cli.mjs gate
```

**Expected**：`baseline 38/38`（由 37 变 38）。

- [x] **Step 4: 补 7 条用例（E01–E04 + F07–F09）**

| ID | 断言（判据出处） |
|---|---|
| OCR-S1-TC-E01 | 源码静态四断言（含 `check-observable`、位置在 `runObservationGate` 之后、失败分支置 `failed = true`、不在 `CHECK_BYPASS` 分支内）+ 单跑 exit 0（`testcase:167`） |
| OCR-S1-TC-E02 | 临时根仅主观词 → exit 1；源码无 `console.warn('[observable]'` 降级、有置 `failed = true` 的语句 |
| OCR-S1-TC-E03 | `pkg.scripts['check:observable']` 匹配 `/^node scripts\/check-observable\.mjs( --check)?$/`；等价命令 exit 0 |
| OCR-S1-TC-E04 | 删键 / 改值为 `--fix` → 两构造各必抛 |
| OCR-S1-TC-F07 | `git diff --stat <base> -- tools/docgen/policy` 与 `git status --porcelain tools/docgen/policy` 均空 |
| OCR-S1-TC-F08 | `node scripts/scope-sweep.mjs --check` exit 0 + `sweep ok`；PRD `:224` / `:300`-系行含 `2026-10-31` 与 `21`（原文不改只加注） |
| OCR-S1-TC-F09 | `--check` exit 0；`node tools/docgen/cli.mjs gate` → `baseline 38/38`；`baseline.json` 与 `baseline.mjs` 均含 `rules/observable-criteria.md` |

- [x] **Step 5: R8 回扫 + 全仓门禁**

```powershell
node scripts/scope-sweep.mjs --check
npm run check
```

**Expected**：`sweep ok`（exit 0）；`npm run check` → `# fail 0`、`baseline 38/38`、`0 findings`、含 `[observable] …` 首行、末行 `check 全部通过`。若 `sweep` 因 mtime 时序判红 → **新落**当次 `impact-sheet.md`（`.session/reviews/<本次>/impact-sheet.md`）后重跑，不改旧清单。

- [x] **Step 6: 验收**

```powershell
node --test --test-reporter=tap scripts/check-observable.test.mjs
```

**Expected**：`# tests 78` / `# pass 78` / `# fail 0`（= testcase 78 条一一对应）。

---

## 附录 A：testcase 78 条 → 落点映射表

> 口径：**78 = 正 31 / 负 34 / 边界 13**（testcase `:8`）；每条用例 = `scripts/check-observable.test.mjs` 里一个 `test('OCR-S1-TC-XX …')`。`E-5b`（到期）与 `E-6`（审计签字）**无适用用例**（覆盖总表标「不适用」/「人工兜 G-3」），故不计入 78。`F02` / `F05` / `F06` 分两半（JSON 侧 / 派生侧同批）→ 单 Task 内两段断言，ID 只算一条。

| ID | 类型 | F | 落点 | 一句话场景 |
|---|---|---|---|---|
| OCR-S1-TC-A01 | 正 | F-01 | Task 2 | 9 词逐字、长度 9、不含 `完整` |
| OCR-S1-TC-A02 | 负 | F-01 | Task 2 | 删一词 → 必抛 |
| OCR-S1-TC-A03 | 边界 | F-01 | Task 2 | 互换 `清晰` / `准确` → 必抛 |
| OCR-S1-TC-A04 | 正 | F-01 | Task 2 | 两表交集空、判据词恰 6 |
| OCR-S1-TC-A05 | 负 | F-01 | Task 2 | 判据词混入主观词表 → 必抛 |
| OCR-S1-TC-A06 | 正 | F-01 | Task 2 | 8 类 kind + 无禁用 literal + enum 带字面量 |
| OCR-S1-TC-A07 | 负 | F-01 | Task 2 | `literal:'出现'` → 必抛 |
| OCR-S1-TC-A08 | 边界 | F-01 | Task 2 | 双带 / 裸 `=` / 裸 `枚举：` 三构造各必抛 |
| OCR-S1-TC-A09 | 正 | F-01 | Task 2 | 9 条 samples 覆盖 + expect 逐字 + residual 键在 |
| OCR-S1-TC-A10 | 负 | F-01 | Task 2 | 删 negative / 重复 / 空白 input / 大写 expect 四构造必抛 |
| OCR-S1-TC-A12 | 正 | F-01 | Task 2 | `residual` 混合（对象 + null）不误红 |
| OCR-S1-TC-A13 | 负 | F-01 | Task 2 | 空壳 residual 六构造必抛、`null` 对照合格 |
| OCR-S1-TC-A14 | 正 | F-01 | Task 2 | 无重复 / 无空串 / 无首尾空格 |
| OCR-S1-TC-A15 | 负 | F-01 | Task 2 | 重复 / 空串 / 前导空格三构造必抛 |
| OCR-S1-TC-B01 | 正 | F-02 | Task 3 | 两次独立遍历同值 + 仓根 ∈ {106,107} + `.MD` 计 + junction 不计 |
| OCR-S1-TC-B02 | 负 | F-02 | Task 3 | 空扫描根 → exit 2（P-1） |
| OCR-S1-TC-B04 | 正 | F-02 | Task 3 | 默认数据源前置过（exit ∈ 0/1） |
| OCR-S1-TC-B05 | 负 | F-02 | Task 3 | 截断 JSON / 空 terms → exit 2（P-2） |
| OCR-S1-TC-B06 | 负 | F-02 | Task 3 | `markers:[]` → exit 2（P-2） |
| OCR-S1-TC-B07 | 负 | F-02 | Task 3 | samples 缺一词 → exit 2（P-2） |
| OCR-S1-TC-B08 | 正 | F-02 | Task 2 | 9 条 samples 双向 + `matched` 不去重（P-3） |
| OCR-S1-TC-B09 | 负 | F-02 | Task 3 | 反例写成合格句 → exit 2（P-3） |
| OCR-S1-TC-B10 | 边界 | F-02 | Task 3 | 反例不含该词 → exit 2；P-3 不落盘 |
| OCR-S1-TC-B12 | 负 | F-02 | Task 3 | 不存在根 / 删 `skills/` → exit 2；单文件根对照 exit 0 |
| OCR-S1-TC-B13 | 负 | F-02 | Task 3 | 正例空转 → exit 2（P-3） |
| OCR-S1-TC-C01 | 正 | F-02 | Task 3 | 仅主观词 → exit 1 + hit 行逐字 + 末行 |
| OCR-S1-TC-C02 | 正 | F-02 | Task 3 | 同块 `docs/a.md:12` → exit 0 |
| OCR-S1-TC-C03 | 边界 | F-02 | Task 3 | bullet 续行 marker 救活（跨行同块） |
| OCR-S1-TC-C04 | 边界 | F-02 | Task 3 | 紧随连续表格属同块 |
| OCR-S1-TC-C05 | 负 | F-02 | Task 3 | 跨同级标题不救 |
| OCR-S1-TC-C06 | 负 | F-02 | Task 3 | 同缩进兄弟 bullet 另起块 |
| OCR-S1-TC-C07 | 边界 | F-02 | Task 3 | 缩进子 bullet 属同块 |
| OCR-S1-TC-C08 | 边界 | F-02 | Task 3 | 空行截断块 |
| OCR-S1-TC-C09 | 负 | F-02 | Task 3 | 裸 `=` 不算标记 |
| OCR-S1-TC-C10 | 负 | F-02 | Task 3 | `出现` / `命令` / `词表` 不算标记 |
| OCR-S1-TC-C11 | 正 | F-02 | Task 3 | 8 类标记逐类生效（含全角） |
| OCR-S1-TC-C13 | 正 | F-02 | Task 3 | `exit` 四形态全绿 |
| OCR-S1-TC-C15 | 边界 | F-02 | Task 3 | 同行两词聚合为 1 条 hit |
| OCR-S1-TC-C16 | 正 | F-02 | Task 3 | `--json` 键序 + 输出顺序（path 字典序 / 行号升序） |
| OCR-S1-TC-C17 | 边界 | F-02 | Task 3 | `--root` 只换扫描根、非 `.md` 不扫 |
| OCR-S1-TC-C19 | 负 | F-02 | Task 3 | `exit` 无数字 / 裸 `枚举：` 不算标记 |
| OCR-S1-TC-C20 | 边界 | F-02 | Task 3 | 更深标题不截断 + 围栏内行不参与 |
| OCR-S1-TC-C22 | 负 | F-02 | Task 3 | 裸 `diff` / 「不要求非空」不算标记 |
| OCR-S1-TC-C23 | 正 | F-02 | Task 3 | 标题行不产出 hit |
| OCR-S1-TC-C24 | 边界 | F-02 | Task 3 | `pathline` 收紧（`20:23` 不算） |
| OCR-S1-TC-C25 | 负 | F-02 | Task 3 | 正文同词必判（标题不扫 ≠ 可逃） |
| OCR-S1-TC-D01 | 正 | F-02 | Task 4 | 正文行豁免生效（`exemptedLines` 1） |
| OCR-S1-TC-D02 | 负 | F-02 | Task 4 | 缺 `reason` → exit 2（P-4） |
| OCR-S1-TC-D03 | 负 | F-02 | Task 4 | 不存在的 `path` → stale → exit 1 |
| OCR-S1-TC-D04 | 负 | F-02 | Task 4 | `contains` 0 命中 → stale → exit 1 |
| OCR-S1-TC-D05 | 正 | F-02 | Task 4 | `contains` 恰 1 处 |
| OCR-S1-TC-D06 | 负 | F-02 | Task 4 | `contains` 2 / 3 处 → exit 2；近似串不误红 |
| OCR-S1-TC-D08 | 正 | F-02 | Task 4 | 同 path 两条不同 `contains` → `exemptedLines` 2 |
| OCR-S1-TC-D09 | 负 | F-02 | Task 4 | 同 path 同 `contains` 重复 → exit 2 |
| OCR-S1-TC-D10 | 正 | F-02 | Task 4 | `reviewed` 可解析 + 下界 |
| OCR-S1-TC-D11 | 负 | F-02 | Task 4 | 早于下界 / 不可解析 / 非日期 → exit 2 |
| OCR-S1-TC-D12 | 边界 | F-02 | Task 4 | 未满 365 天 exit 0 + 源码无 365 分支 |
| OCR-S1-TC-D13 | 正 | F-02 | Task 4 | 行级粒度（只摘命中行） |
| OCR-S1-TC-E01 | 正 | F-02 | Task 7 | ⑦ 段源码四静态断言 + 单跑 exit 0 |
| OCR-S1-TC-E02 | 负 | F-02 | Task 7 | 不吞 exit / 不降级 warning |
| OCR-S1-TC-E03 | 正 | F-02 | Task 7 | `package.json` 入口值合规格 |
| OCR-S1-TC-E04 | 负 | F-02 | Task 7 | 删键 / `--fix` → 必抛 |
| OCR-S1-TC-E05 | 正 | F-10 | Task 6 | 规则文档 ≤120 行 + 六锚 + 两句声明 |
| OCR-S1-TC-E06 | 负 | F-10 | Task 6 | 副本含 pattern 原文 → exit 1（判定 5） |
| OCR-S1-TC-E08 | 正 | F-02 | Task 5 | 分诊表对账 `M+P+L=21` / `exemptedLines=L` / `stale=0` / `L≤8` |
| OCR-S1-TC-E09 | 负 | F-02 | Task 5 | 全豁免 `L=21` → 必抛 |
| OCR-S1-TC-E10 | 正 | F-10 | Task 6 | 单词面叙述 → 绿（不算复制词表） |
| OCR-S1-TC-E11 | 负 | F-10 | Task 6 | 同行 ≥2 词枚举 → exit 1 |
| OCR-S1-TC-E12 | 负 | F-02 | Task 5 | 全改文案但 hit 未清 → 必抛 |
| OCR-S1-TC-F01 | 正 | F-01 | Task 2 | 两 `vocab/` 派生 + 字面 0 + frozen + 交集空 |
| OCR-S1-TC-F02 | 负 | F-01 | Task 2 | 旧字面形态源码 → 必抛 |
| OCR-S1-TC-F04 | 正 | F-01 | Task 2 | `card-model.test.mjs` 改派生后绿 + 旧字面数组 0 |
| OCR-S1-TC-F05 | 正 | F-01 | Task 2 | PRD `:271` 5 词 ⊆ 9 词 + 日期注在位 |
| OCR-S1-TC-F06 | 负 | F-01 | Task 2 | 删日期注 → 必抛 |
| OCR-S1-TC-F07 | 正 | F-02 | Task 7 | `tools/docgen/policy/**` 零改动 |
| OCR-S1-TC-F08 | 正 | F-02 | Task 7 | R8 `sweep ok` + 基线表述日期注在位 |
| OCR-S1-TC-F09 | 正 | F-02 | Task 7 | `baseline 38/38` + 新规则两处登记 |
| OCR-S1-TC-F10 | 边界 | F-01 | Task 2 | 九词字面数组全仓恰 1 处（副本 >1 必抛） |

---

## 附录 B：提交切分（施工期滚动，由用户 commit）

| # | 提交内容（**按第四节交付审计核对后的实际面重写**） | 前置 |
|---|---|---|
| 1 | 词表单源与派生：`tools/quality/observable-terms.json` / `observable-exempt.json`(初版空) + 两 `vocab/` 派生 + `tools/docgen/test/card-model.test.mjs` + `docs/prd/20261026205821-agent-card-contract.md:271` 日期注 | `card-model.test.mjs` 58/58 + `gate 37/37` |
| 2 | 校验器与常驻测试：`scripts/check-observable.mjs` + `scripts/check-observable.test.mjs`（**终态 78 条**；施工中曾为 52 条的中间态，该中间态**不单独成提交、不可复现**，一律以 78 条为准） | `node --test --test-reporter=tap scripts/check-observable.test.mjs` → `# tests 78 / # pass 78 / # fail 0` |
| 3 | 分诊与豁免：`tools/quality/observable-exempt.json`（6 条）+ 8 处 M 类改文案（`skills/parliament/assets/agent-template.md` / `skills/parliament/references/host-duties.md` / `skills/retro-collect/SKILL.md`×2 / `skills/retro-collect/assets/facts-template.md` / `skills/retro-collect/assets/userwords-template.md` / `skills/review-loop/references/loop.md` / `skills/writing-after-docs/assets/after-template.md`）+ `docs/reports/2026-10-31-observable-s1-triage.md` + `docs/after/` 的两份记录（`…exempt-expiry…` / `…s1-open-items…`） | 真实仓 `node scripts/check-observable.mjs --check` exit 0 |
| 4 | 规则文档与接线：`rules/observable-criteria.md` + `scripts/check-all.mjs`（⑦ 段）+ `package.json`（`check:observable`）+ `tools/docgen/components/baseline.mjs` / `baseline.json`（37→38）+ `tools/docgen/test/support/dev-workflow-checks.mjs` / `tools/docgen/test/cli-gate.test.mjs`（最小仓副本补 `tools/quality`） | `npm run check` 绿 + `sweep ok` + `gate 38/38` |
| 5 | 流程与文档面（可与任一提交合并）：`docs/superpowers/plans/2026-11-01-observable-s1.md` + `docs/superpowers/specs/2026-10-31-observable-criteria-rollout-design.md`（P-1 两态 + 两处 pattern 增量注）+ 其 `-testcase.md`（两态 4 处 + 常量 3 增量注）+ `docs/prd/20261031202331-observable-criteria-rollout/index.md`（§8 F→S 表 + 两处日期注）+ `skills/dev-workflow/references/gate-record.md`（② 行增量登记 + ②→③ / ③ / ④ 三行） | `node scripts/check-gate-record.mjs` → `rows 42 bad 0` |

> **为什么改成 5 组**：原 4 组漏点名了 `gate-record.md`、两个 docgen 测试支撑文件与 8 处 M 类改文案（交付审计 C-4），且第 2 组的「52 条」是施工中间态、无法从终态复现（现值为 78 条）。本表按**终态工作区实际 diff 面**重写，提交顺序仍建议 1→2→3→4（第 5 组可拆可并）。
