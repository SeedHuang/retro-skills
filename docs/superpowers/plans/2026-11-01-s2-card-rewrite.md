# 卡面重构 S2（可执行语句 / 中文名表 / 行序号对账 / 禁 id 守卫 / 单源注入）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务施工。步骤用 `- [ ]` 勾选。
>
> 状态：**待 `②→③` 计划门签字**（申报 = 主 agent；签字 = 审计；本门**不设议会**，`skills/dev-workflow/references/stage-2b-plan-gate.md`）。② 段门行先落（`②@S2-card-rewrite`），再落本门行（`②→③@S2-card-rewrite`）。

**Testcase:** `docs/superpowers/specs/2026-11-01-s2-card-rewrite-design-testcase.md`（**76 条 = 正 38 / 负 25 / 边界 13**；ID 前缀 `S2-TC-`；独立 `senior-sdet` 实例编写）

> **Spec:** `docs/superpowers/specs/2026-11-01-s2-card-rewrite-design.md`（**152 行**；议会 #2 已结项：审计 r4 = PASS，P0 0 / P1 0；含计划预备期两条增量 D14 接口正名 / D15 D3 层③ 回流，均已交独立审计复签）
> **PRD:** `docs/prd/20261031202331-observable-criteria-rollout/index.md`（S2 块 = F-03 / F-04 / F-05 / F-06；验收 V-6 / V-7 / V-9 / V-10 / V-11 / V-11-b）
> **引用口径**：`spec §N` 指上列 spec 的节；`S2-TC-xxx` 指 testcase 的用例 ID；`PRD :NN` 指 PRD 行号。**本 plan 正文不写任何 `.mjs` 的行号**（行号守卫会扫全仓 `.md`，命中即整门红），引用代码一律写符号名。

**Goal:** 把 15 张角色卡从「英文 id + 7 列表格」改成「中文可执行语句 + 行序号锚 + 三态行 + 中文类型列」，并把契约文本收敛到**一个数据层常量**（`card-contract.mjs`）经模板占位符注入，最后加一条**禁 id 守卫**（`cardFaceIds`）与三类常驻判别力夹具。

**Architecture:** 单源注入链 = `card-contract.mjs`（唯一写死处）→ `agent-card.md.tpl` 占位符 → `renderCard` 渲染 → `agents/*.md`（渲染产物，不得手改）→ 断言（A1 副本 0 处 / A2 常量探针 / A3 改一处即绿 / A4 占位符 0 残留）。禁 id 守卫 = `cardFaceIds(card, env)`，扫面复用既有 `SCAN_FIELDS.PointerToElsewhere`（= `CARD_TEXT_FIELDS`），禁集合 = 既有 env 键 `env.registeredIds`（生产者 `registeredIdsOf(cards)`），三层判定见 spec §4 D3。行序号对账 = `expectedBullet(card, i)` 是**唯一翻译点**，测试只逐字比对、不重写翻译规则。

**Tech Stack:** Node.js ≥ 22（ESM `.mjs`，只用 `node:` 标准库）；PowerShell（仓根执行）；测试统一 `node --test <单文件>`。无第三方依赖。

---

## 全貌确认（事前三步 · 第一步产物）

| 维度 | 结论 |
|---|---|
| **本质** | 不是「把卡写好看点」，而是把卡面从「人读的散文 + 机器要查表的 id」改成**机器可逐行对账的产物**：序号锚替代 id 锚、契约常量替代 60 份副本、守卫把「卡面出现 id」从口头约定变成退出码。 |
| **同族** | 同族已有 S4 卡面渲染（`renderCard` + `agent-card.md.tpl` + `gate` 比对）与 S1 文本判据校验器（`scripts/check-observable.mjs`，只扫 `rules/` + `skills/`）。本块**沿用同一套形态**：数据层常量 + 模板占位符 + `gate` 比对 + `node --test` 断言，不另造范式。 |
| **边界** | 只改卡面与其数据层（`tools/docgen/card-model/vocab/**`、`templates/**`、`components/renderCard.mjs`、`card-model/validateCardModel.mjs`、`test/**`、`agents/*.md`、`docs/agents/**`）。**不碰**：`predicates` 改写与 `validatePredicates`（S3）、校验器扩到卡面文本面（S3）、档位枚举 / 死路径串（C-3 归 S6）、`tools/docgen/policy/**`（S6 已签，零改动）、`rules/` 与 `skills/` 正文（首日不红的前提）。 |
| **验收** | ① `node --test tools/docgen/test/s2-card-rewrite.test.mjs` → 76 条全绿；② `node tools/docgen/cli.mjs gate` → `baseline N/N` 且 15 卡 disk == render；③ `npm run check` 末行 `check 全部通过` 且 `[observable]` 未豁免命中仍 0；④ `node scripts/scope-sweep.mjs --check` exit 0（R8）；⑤ V-11 三席复测过判据（`L_after ≤ ⌊L_before×0.5⌋` 且净减 ≥ 1）。 |
| **影响面** | 新建 3 个文件（`vocab/card-contract.mjs` / `vocab/object-names.mjs` / `test/s2-card-rewrite.test.mjs`）+ 修改 6 个（模板 / `renderCard.mjs` / `validateCardModel.mjs` / `card-render.test.mjs` / `vocab/landings.mjs` / `baseline.json`）+ 15 张 `agents/*.md` 重生成 + `docs/agents/**` 重生成 + 2 处只加注（S4 spec 的 C-7 块、卡面契约 PRD §3.4 日期注）。 |

**全局联动四问**：

1. **治本了吗** —— 治本。病根是「同一契约在 15 张卡里各写一份、且测试拿同一函数自证」，修法是**常量单源 + 占位符 + 独立断言**（A1 扫副本、A2 常量探针、F04 用 landing 中文名做独立断言），不是把卡改得更漂亮。
2. **有副作用吗** —— 四处已知，全部有承接：① 模板换占位符后 `cardTemplate.mjs` 模块加载即固化 → 一切「改副本再渲染」的构造必须走**子进程**（testcase 常量 6）；② 15 卡重生成会让 `gate` 比对与 `baseline` 计数变化 → 同批 `baseline --write`（Task 9）；③ `landings.mjs` 键改名会让写死旧键的断言红 → 同批 R8 回扫（Task 7，`scope-sweep --check` 判）；④ 旧断言（table 形态）会整片失败 → Task 6 同批改造，不留半红状态。
3. **跨问题联动吗** —— 与 S3 同根：S3 要把校验器扩到卡面文本面，本块的 `cardFaceIds` 就是它的落点入口，所以接口按「唯一契约」写死（`cardFaceIds(card, env) → string[]`），S3 只扩面不改签名。
4. **跨页面 / 跨项目吗** —— 共享面 = `card-model/vocab/**` 被 15 席渲染链与 `gate` 共用；`landings.mjs` 的键被 `cardPipeline` 的 `env` 集合与测试泛化取值共用 → 改名必须同批改测试，否则全席渲染链一起红。

**算账（第三步）**：打补丁式「只改模板 + 手改 15 卡」短期省事，但手改即违反 D2（15 卡不得手写），且下一次 S3 改 `predicates` 时 15 卡又要再手改一遍；治本式多两个常量文件与一个测试文件，摊到 S3 / S6 的每次改判都免掉 15 卡重写，收益线性增长。

---

## Global Constraints（对每个任务隐含生效）

1. **单源注入**：契约文本只在 `card-contract.mjs` 写一次；模板只放占位符；`renderCard` 只 import 常量。模板 / 渲染器里出现 `脚本核对` / `AI 判定` / `人工判定` / `hit` / `miss` / `na` / `reason` / `废卡` 任一字面 = 违规（`S2-TC-E07`）。
2. **15 卡不得手改**：`agents/*.md` 只由 `draft → 确认 → replace --yes` 两步写盘产生；`generate` 只比不写（`S2-TC-E08` / `E09` / `E10` / `G05` / `G06`）。
3. **禁 id 三层判定顺序钉死**：① 按行排除三态常量行 → ② 按 token 剔除「许」四类 → ③ 余下命中 (a) `env.registeredIds` / (b) `CHECK_KINDS` 键 / (c) `REPEATS` 键 / (d) 登记 id 形态（点分小写、末段非 `md`/`mjs`/`json`/`yml`/`yaml`）任一即红；**`producer` / `S5-B` 不判红**（PRD `:175`，C-3 归 S6）。
4. **token 全等、禁子串**：`xshared.impartial-long-term` / `shared.impartial-longterm` 必须绿（`S2-TC-C05`）；真实路径整段剔除（`S2-TC-C06`）。
5. **扫面 = `SCAN_FIELDS.PointerToElsewhere`**（其值即 `CARD_TEXT_FIELDS`，`enums.mjs` 未直接导出该常量）；**禁集合 = `env.registeredIds`**（`ENV_KEYS` 已有键，生产者 `registeredIdsOf(cards)`）。不得另写禁表、不得改 `enums.mjs`。
6. **`expectedBullet(card, i)` 是唯一翻译点**：返回**含前缀**的一整行 `- <i>｜…`；测试只 `assert.equal(line, expectedBullet(card, i))`，不重写翻译。
7. **`enums.mjs` 零改动**：`TRISTATE` 新增在 `card-contract.mjs`，键源 = `VERDICTS`（3 值）+ `reason`；`VERDICTS` 仍 3 值、无 re-export（`S2-TC-A10`）。
8. **副本内重渲染一律子进程**：模板在 `cardTemplate.mjs` 模块加载即固化，本进程改副本后重渲恒绿 → `D02` / `E06` / `F03` / `F04` 必须 `runNode(['--input-type=module','-e', script], copy)` 让子进程重新 import 副本模块。
9. **构造不落盘、必还原**：一切「必红构造」只在内存或 `mkdtemp` 副本上做；每条构造后必须还原并断言回到基线（防「构造失效 → 假绿」）。
10. **测试不自递归**：用例不得执行 `npm run check` / `check-all.mjs`；只允许单跑 `node scripts/check-observable.mjs` / `node tools/docgen/cli.mjs <子命令>` / `node scripts/scope-sweep.mjs --check` / `node --test <单文件>`。
11. **「没改」用 sha 内容锚**：断「工作区干净」在脏树下立跑即红 → 一律断「指定文件内容 sha 不变」（`S2-TC-E09` / `I06`）。
12. **`S2_BASE` 缺失降级为 `HEAD`** 并打 `t.diagnostic`（不得 `t.skip`、不得 fail-closed）；取值命令 `git log -1 --format=%H -- docs/superpowers/specs/2026-11-01-s2-card-rewrite-design.md`。
13. **R8 回扫只认裸命令**：`node scripts/scope-sweep.mjs --check`（**禁用** `npm run doc:sweep -- --check`：PowerShell + npm 10.9 吞掉 `--` 后参数、恒 exit 0 = 假绿）。
14. **零接触**：`tools/docgen/policy/**` 一字不动；`rules/` 与 `skills/` 正文零改动（首日不红 = ⑦ 段 `[observable]` 命中仍 0）。
15. **门禁基线不钉死**：本 plan 落盘前实跑 = `# tests 1244` / `# pass 1242` / `# fail 0` / `# skipped 2`、`baseline 38/38`、`0 findings`、`④ markdown 通过（358 文件 / 1572 表）`、`[observable] 107 扫描 / 0 命中 / 6 豁免 / 0 stale`。每加一个文件 / 一张表，数字按实际漂移，**不钉死**。

---

## 文件结构

| 路径 | 动作 | 职责 |
|---|---|---|
| `tools/docgen/card-model/vocab/card-contract.mjs` | 新建 | `TYPE_LABELS`（键派生自 `CHECK_KINDS`，值 = `脚本核对` / `AI 判定` / `人工判定`）/ `TRISTATE`（5 行 = 1 中释 + `VERDICTS` 3 键 + `reason`）/ `ALLOWED_PRODUCT_NAMES`（三态值 + `reason` / `evidence` / `verdict`）/ `FORMAT_CHECKS`（3 条判句，各含 `废卡` 且含 `缺` 或 `空`） |
| `tools/docgen/card-model/vocab/object-names.mjs` | 新建 | `OBJECT_NAMES` / `REPEAT_NAMES` = `{ id: 中文名 }`，键集与 15 卡实际取值并集**双向相等** |
| `tools/docgen/templates/agent-card.md.tpl` | 修改 | `{{MUST_TABLE}}`→`{{MUST_BULLETS}}`、`{{NEVER_TABLE}}`→`{{NEVER_BULLETS}}`；新增 `{{TRISTATE}}` / `{{PRODUCT_NAMES}}` / `{{FORMAT_CHECKS}}` |
| `tools/docgen/components/renderCard.mjs` | 修改 | 产出 `- <i>｜…` bullet；新增导出 `expectedBullet(card, i)`；注入三个新占位符 |
| `tools/docgen/card-model/validateCardModel.mjs` | 修改 | 新增导出 `cardFaceIds(card, env)`（三层判定，空数组 = 过） |
| `tools/docgen/card-model/vocab/landings.mjs` | 修改 | 键 `'progress.md'` → `'review.progress'`，值 `'progress.md 正文'` 不变 |
| `tools/docgen/test/card-render.test.mjs` | 修改 | 旧「表格 / 英文 id」断言改为「bullet 逐行 == `expectedBullet`」；保留既有 helper（`walkFiles` / `runNode` / `runCli` / `coldRepo` / `mutCard`） |
| `tools/docgen/test/s2-card-rewrite.test.mjs` | 新建 | 承载 `S2-TC-*` 76 条：每个用例 = 一个 `test('S2-TC-<ID> …')` 块 |
| `agents/<seat>.md` × 15 | 重生成 | 两步写盘（`draft` → 确认 → `replace --yes`） |
| `docs/agents/**` | 重生成 | `generate --readme --apply` |
| `tools/docgen/baseline.json` | 修改 | 15 卡重生成后 `baseline --write` |
| `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md` | 修改（只加） | C-7：加「现行判据块 + 日期注」，原文一字不改 |
| `docs/prd/20261026205821-agent-card-contract.md` | 修改（只加注） | §3.4 行末加日期注「实现唯一源 = `card-contract.mjs`，原文保留不改」 |

**接口（唯一契约）**：

```text
card-contract.mjs   TYPE_LABELS / TRISTATE / ALLOWED_PRODUCT_NAMES / FORMAT_CHECKS        （新增，导出恰 4 个）
object-names.mjs    OBJECT_NAMES / REPEAT_NAMES                                           （新增，导出恰 2 个）
renderCard.mjs      renderCard(card, env) → string；expectedBullet(card, i) → string      （后者新增）
validateCardModel   cardFaceIds(card, env) → string[]（空 = 过）                           （新增）
```

---

## 功能点 → 任务映射

| 功能点 | 内容（PRD 口径） | 任务 | 验收锚 |
|---|---|---|---|
| F-03 | 卡面可执行语句 + `objects` / `repeats` 中文名表 | Task 1、Task 2、Task 3、Task 4、Task 8 | A 组全绿；`gate` disk == render |
| F-04 | 本席清单类型列中文化 + 补三态行 | Task 1、Task 3、Task 4、Task 8 | D 组全绿；类型列三中文值 |
| F-05 | 行序号对账替代 id 锚点 | Task 4、Task 6、Task 8 | B 组 + F 组全绿 |
| F-06 | 卡面禁 id 守卫 | Task 5、Task 7、Task 6 | C 组全绿；`cardFaceIds` 15 卡 0 命中 |

---

## Task 1：`card-contract.mjs`（四导出，单源起点）

- **Consumes:** 无
- [ ] 新建 `tools/docgen/card-model/vocab/card-contract.mjs`，只 import `enums.mjs` 的 `CHECK_KINDS` / `VERDICTS`，导出**恰四个**名字。
- [ ] `TYPE_LABELS`：键 = `Object.keys(CHECK_KINDS)`（不手抄），值逐字 `脚本核对` / `AI 判定` / `人工判定`（顺序与 `CHECK_KINDS` 同序）。
- [ ] `TRISTATE`：5 项数组 —— `[0]` = 一行中文解释（须同时含 `hit` / `miss` / `na` / `reason`）、`[1..3]` = `Object.keys(VERDICTS)`、`[4]` = `'reason'`。
- [ ] `ALLOWED_PRODUCT_NAMES`：数组，含三态值 `hit` / `miss` / `na` + `reason` / `evidence` / `verdict`；**不得含** `CHECK_KINDS` 的三个英文键。
- [ ] `FORMAT_CHECKS`：3 条中文判句，每条含 `废卡` 且含 `缺` 或 `空`（如「问题卡缺任一必填字段 = 废卡，不得只给结论」）。
- **验收**：`node -e "import('./tools/docgen/card-model/vocab/card-contract.mjs').then(m=>console.log(Object.keys(m).sort().join(',')))"` → `ALLOWED_PRODUCT_NAMES,FORMAT_CHECKS,TRISTATE,TYPE_LABELS`
- **交付物**：1 个新文件。

## Task 2：`object-names.mjs`（中文名表）

- **Consumes:** Task 1
- [ ] 从 `agentData.mjs` 取 15 卡 `must[].objects` ∪ `never[].objects` 的并集得 `ALL_OBJ`；`trigger.repeat` 并集得 `ALL_REPEAT`（键源 `enums.mjs` 的 `REPEATS`）。
- [ ] 新建 `tools/docgen/card-model/vocab/object-names.mjs`，导出 `OBJECT_NAMES` / `REPEAT_NAMES`，键集与上面两个并集**双向相等**（漏 = 渲染退化英文；多 = 名表漂移）。
- [ ] 值 = 中文名，去空白后非空且含汉字。
- **验收**：`node -e "import('./tools/docgen/card-model/vocab/object-names.mjs').then(m=>console.log(Object.keys(m.OBJECT_NAMES).length, Object.keys(m.REPEAT_NAMES).length))"` → 两个数与实取并集大小相等
- **交付物**：1 个新文件。

## Task 3：模板占位符

- **Consumes:** Task 1
- [ ] `agent-card.md.tpl`：`{{MUST_TABLE}}` → `{{MUST_BULLETS}}`、`{{NEVER_TABLE}}` → `{{NEVER_BULLETS}}`；在「一定会」段末加 `{{TRISTATE}}`、在「边界」段加 `{{PRODUCT_NAMES}}`、在「输出格式」段加 `{{FORMAT_CHECKS}}`。
- [ ] 模板**不得**出现任何契约字面（`脚本核对` / `AI 判定` / `人工判定` / `hit` / `miss` / `na` / `reason` / `废卡`）。
- [ ] 未填槽必须抛 `MissingSlot`（沿用 `cardTemplate.mjs` 既有行为，不改它的实现）。
- **验收**：`Select-String -Path tools/docgen/templates/agent-card.md.tpl -Pattern 'MUST_TABLE|NEVER_TABLE'` → 0 命中；`-Pattern '脚本核对|AI 判定|人工判定|废卡'` → 0 命中
- **交付物**：1 个改动文件。

## Task 4：`renderCard` 产出 bullet + `expectedBullet`

- **Consumes:** Task 1、Task 2、Task 3
- [ ] `renderCard` 的「一定会」「禁止」两段产 `- <i>｜…`（`i` = 该段数据序，从 1 起连续）；`objects` / `repeats` 用 `OBJECT_NAMES` / `REPEAT_NAMES` 译成中文名。
- [ ] 新增导出 `expectedBullet(card, i)`：返回**含前缀**的一整行，`renderCard` 内部就调它（唯一翻译点）。
- [ ] 「本席清单」类型列：`CHECK_KINDS` 键 → `TYPE_LABELS` 中文值（列数仍 4 列，不删列）。
- [ ] 注入 `{{TRISTATE}}` / `{{PRODUCT_NAMES}}` / `{{FORMAT_CHECKS}}`；`requires` 为空**不渲染**「前提：无」。
- **验收**：`node -e "import('./tools/docgen/components/renderCard.mjs').then(m=>console.log(typeof m.renderCard, typeof m.expectedBullet))"` → `function function`
- **交付物**：1 个改动文件。

## Task 5：`cardFaceIds`（禁 id 守卫）

- **Consumes:** Task 1、Task 2
- [ ] `validateCardModel.mjs` 新增导出 `cardFaceIds(card, env) → string[]`，扫面 = `SCAN_FIELDS.PointerToElsewhere`（不另抄字段表）。
- [ ] 三层：① 按行排除三态常量行（4 行常量 + 1 解释行）→ ② 按 token 剔除「许」四类（`ALLOWED_PRODUCT_NAMES` / 工具名 / 真实路径（含 `文件:行号`）/ 卡片七字段中文名）→ ③ 余下命中 (a) `env.registeredIds` / (b) `CHECK_KINDS` 键 / (c) `REPEATS` 键 / (d) 登记 id 形态（点分小写、末段 ∉ `{md,mjs,json,yml,yaml}`）任一即红。
- [ ] `producer` / `S5-B` 明确不判红（不写死排除名单，靠 (d) 的形态规则与 (a)(b)(c) 的键态自然放过）。
- [ ] 返回命中 token 数组（去重保序）；空数组 = 过；不改 `registeredIdsOf` 签名、不改 `enums.mjs`。
- **验收**：`node -e "import('./tools/docgen/card-model/validateCardModel.mjs').then(m=>console.log(typeof m.cardFaceIds, m.cardFaceIds.length))"` → `function 2`
- **交付物**：1 个改动文件。

## Task 6：测试面（既有断言改造 + 新建 76 条用例文件）

- **Consumes:** Task 3、Task 4、Task 5
- [ ] 改 `tools/docgen/test/card-render.test.mjs`：把「7 列表格 / 英文 id」断言换成「bullet 行逐字 == `expectedBullet(card, i)`」+ 条数 == 数据条数 + 序号连续；**保留**既有 helper（`walkFiles` / `runNode` / `runCli` / `coldRepo` / `mutCard`），不另写第二套。
- [ ] 同批改 `tools/docgen/test/evidence-reader.test.mjs`：该文件断言卡面含 `evidence-reader.free-explore` 的两处，改为断言对应中文名（否则卡面中文化后必红）。
- [ ] 新建 `tools/docgen/test/s2-card-rewrite.test.mjs`，内含 76 个 `test('S2-TC-<ID> …')` 块，逐条按 testcase 的「步骤 / 判据」列实现；四类构造（`D02` / `E06` / `F03` / `F04`）走子进程。
- [ ] 三类常驻夹具（宾语≠落点 / 两行同值 / 共享句只 1 席渲染）各至少一条「必红构造」+ 还原断言。
- [ ] `S2_BASE` 缺失 → 降级 `HEAD` + `t.diagnostic`（不 `t.skip`）。
- **验收**：`node --test tools/docgen/test/s2-card-rewrite.test.mjs` → `# tests 76` / `# fail 0`；`node --test tools/docgen/test/card-render.test.mjs` → 全绿
- **交付物**：1 个改动 + 1 个新增测试文件。

## Task 7：`landings.mjs` 键改名 + R8 回扫

- **Consumes:** Task 5
- [ ] `vocab/landings.mjs`：键 `'progress.md'` → `'review.progress'`，**值 `'progress.md 正文'` 一字不改**；不得两键并存。
- [ ] 回扫 spec §6.1 列出的四处：`cardPipeline.mjs` 的 `landings: new Set(Object.keys(LANDINGS))`（自动跟随，不改）、两个测试文件里 `Object.keys(LANDINGS)` 的泛化取值（自动跟随；若出现写死 `'progress.md'` 的断言 → 同批改）、PRD `:344` 原文（不改）。
- [ ] 跑 `node scripts/scope-sweep.mjs --check` 与 `node tools/docgen/cli.mjs gate`。
- **验收**：`node scripts/scope-sweep.mjs --check` → `sweep ok`（exit 0）；`node tools/docgen/cli.mjs gate` → `baseline N/N` 且无 `Mismatch`
- **交付物**：1 个改动文件（必要时加测试断言）。

## Task 8：15 卡两步写盘 + `docs/agents/**` 重生成

- **Consumes:** Task 4、Task 6、Task 7
- [ ] 逐席（15 席）：`node tools/docgen/cli.mjs draft --kind agent --name <席>` → 对照 `.drafts/` 产物确认无误 → `node tools/docgen/cli.mjs replace --kind agent --name <席> --yes`。**一次全改、一次提交**（Q1）。
- [ ] `node tools/docgen/cli.mjs generate --readme --apply` 重生成 `docs/agents/**`。
- [ ] 逐卡核 `disk === renderCard`（15/15 逐字节相等）；核 15 卡 `{{` 计数 = 0。
- **验收**：`node tools/docgen/cli.mjs generate` → exit 0 且输出 `baseline N/N`、无 `Mismatch`；`Select-String -Path agents\*.md -Pattern '\{\{'` → 0 命中
- **交付物**：15 张 `agents/*.md` + `docs/agents/**` 全量重生成。

## Task 9：`baseline --write`

- **Consumes:** Task 8
- [ ] 跑 `node tools/docgen/cli.mjs baseline --write` 重记 `tools/docgen/baseline.json`；条数 = rule 清单 + agent 清单之和（派生，不写死）。
- [ ] 审计抽 3 席核 disk ↔ render 一致。
- **验收**：`node tools/docgen/cli.mjs gate` → `baseline N/N`，N = 两清单之和；`node --test tools/docgen/test/cli-gate.test.mjs` → 全绿
- **交付物**：1 个改动文件（`baseline.json`）。

## Task 10：C-7 只加块 + PRD 日期注 + 首日不红复核

- **Consumes:** Task 8
- [ ] `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md`：**只加**「现行判据块 + 日期注」，原文一字不改；删掉该块即应用例 `I02` 变红。
- [ ] `docs/prd/20261026205821-agent-card-contract.md` §3.4 行末加日期注（实现唯一源 = `tools/docgen/card-model/vocab/card-contract.mjs`，原文保留）。
- [ ] 核 `rules/` 与 `skills/` 正文零改动：`node scripts/check-observable.mjs --check` → `check-observable ok` 且命中仍 0。
- [ ] `npm run check` 全绿；`node scripts/scope-sweep.mjs --check` exit 0。
- **验收**：`npm run check` 末行 `check 全部通过`；`node scripts/check-observable.mjs --check` → `check-observable ok`
- **交付物**：2 个只加注文件。

## Task 11：V-11 改后复测（3 席 + 双判分）与 G-1–G-6 兜底登记

- **Consumes:** Task 8、Task 10
- [ ] 3 席（`reviewer-qa` / `reviewer-audit` / `detective-observer`）各派**独立答题实例**：只给新卡面，不给门禁提示（V-11-b 测量隔离）；同 5 题 × 34 项计分表。
- [ ] 每席**双判分**（两个独立判分实例），逐项取交集；分歧 > 3 项 → 启第三实例裁定，裁决写进基线报告 `§裁定`。
- [ ] 判据：交集漏项 `L_after ≤ ⌊L_before × 0.5⌋` **且** `L_before − L_after ≥ 1`（`L_before` 见基线报告第三章：3 席合计 59/102）；3 席全过才算过。
- [ ] spec §8 G-1–G-6 逐条登记「谁兜 + 触发信号」（G-1 议会回读 / G-2 ④ 段 sdet 抽核 / G-3 审计 + R8 / G-4 双判分 + 第三人 / G-5 议会回读 + ④ 段 / G-6 审计核 `state.json` 与 `git diff`）。
- **验收**：基线报告新增「改后」节，3 席都写 `L_before` / `L_after` / 分歧项数 / 结论；判据逐席打勾
- **交付物**：基线报告追加节 + 裁定记录（这是 ④ 段 sdet 的输入件）。

---

## 附录 A：76 条用例 → 任务落点

| 用例 ID | 类型 | 归属任务 | 一句话落点 |
|---|---|---|---|
| S2-TC-A01 | 正 | Task 1 | 四导出面与形状（多一 / 少一即红） |
| S2-TC-A02 | 正 | Task 1 | `TYPE_LABELS` 三键派生自 `CHECK_KINDS`、三中文值逐字 |
| S2-TC-A03 | 负 | Task 1 | 类型值去空格 / 截短即红 |
| S2-TC-A04 | 正 | Task 1 | `TRISTATE` 5 行，`[1..3]` == `VERDICTS` 键 |
| S2-TC-A05 | 负 | Task 1 | 三态多一行 / 换序即红 |
| S2-TC-A06 | 正 | Task 1 | `FORMAT_CHECKS` 恰 3 条且各含 `废卡` + `缺`/`空` |
| S2-TC-A07 | 负 | Task 1 | 判句写成散文即红 |
| S2-TC-A08 | 正 | Task 2 | 名表键集与卡数据双向相等 |
| S2-TC-A09 | 负 | Task 2 | 名表漏登记 / 多登记各红 |
| S2-TC-A10 | 正 | Task 1 | `TRISTATE` 定义恰 1 处、`enums.mjs` 零改动 |
| S2-TC-B01 | 正 | Task 6 | 「一定会」序号 `1..n` 且条数相等 |
| S2-TC-B02 | 正 | Task 6 | 「禁止」段同形 |
| S2-TC-B03 | 负 | Task 6 | 删一行 / 串一行各红 |
| S2-TC-B04 | 负 | Task 6 | 改一字只被逐字断言抓到 |
| S2-TC-B05 | 正 | Task 4 | 15 卡逐行 == `expectedBullet` |
| S2-TC-B06 | 边界 | Task 6 | 零条 `must` / `never` 不残留表头 |
| S2-TC-B07 | 正 | Task 4 | 序号跟随数据序而非 id 序 |
| S2-TC-B08 | 正 | Task 4 | 常量探针：改 `TRISTATE[0]` 渲染即跟随、磁盘 0 命中 |
| S2-TC-C01 | 正 | Task 5 | 15 卡卡面零命中 + 双参签名 |
| S2-TC-C02 | 负 | Task 5 | 六类登记 id 各塞 1 个必红 |
| S2-TC-C03 | 负 | Task 5 | 四个英文键必红、三中文值必须仍绿 |
| S2-TC-C04 | 正 | Task 5 | 「许」四类不误红 |
| S2-TC-C05 | 边界 | Task 5 | 子串不算命中 |
| S2-TC-C06 | 边界 | Task 5 | 真实路径与 id 同行只判 id |
| S2-TC-C07 | 负 | Task 5 | 未登记 token（`trace.id` / `foo.bar`）必红且守卫非空转 |
| S2-TC-C08 | 正 | Task 5 | 15 席磁盘与渲染面全量 0 命中 |
| S2-TC-C09 | 负 | Task 5 | `rationale` 不在扫面（面边界） |
| S2-TC-C10 | 负 | Task 7 | `review.progress` 必红 / 裸 `progress.md` 绿 |
| S2-TC-C11 | 边界 | Task 7 | 层① 只剔段末 5 行，数据行不整行豁免 |
| S2-TC-D01 | 正 | Task 4 | 类型列只许三个中文值 |
| S2-TC-D02 | 负 | Task 4 | 类型未翻译时 D01 与 `cardFaceIds` 同红（子进程） |
| S2-TC-D03 | 边界 | Task 4 | 四列不减、列不空 |
| S2-TC-D04 | 正 | Task 3 | 三态 5 行逐字且在段末 |
| S2-TC-D05 | 负 | Task 3 | 三态缺行 / 换序即红 |
| S2-TC-D06 | 正 | Task 4 | 「前提：无」0 命中 |
| S2-TC-D07 | 负 | Task 4 | `requires` 非空才出现「前提：」 |
| S2-TC-E01 | 正 | Task 6 | 契约枚举全仓只有一处 |
| S2-TC-E02 | 负 | Task 6 | 别处再加一份即红（副本） |
| S2-TC-E03 | 正 | Task 6 | 新增许名只改一处即绿 |
| S2-TC-E04 | 负 | Task 6 | 改别处不生效且白名单副本即红 |
| S2-TC-E05 | 正 | Task 3 | 占位符不残留且新占位符在位 |
| S2-TC-E06 | 负 | Task 3 | 未填槽抛 `MissingSlot`（子进程） |
| S2-TC-E07 | 正 | Task 3 | 契约字面不长在模板 / 渲染器 |
| S2-TC-E08 | 负 | Task 8 | 15 卡逐字节等于渲染、手改即红 |
| S2-TC-E09 | 正 | Task 8 | `generate` 只比不写（三次 sha 相等） |
| S2-TC-E10 | 边界 | Task 8 | 两步写盘：`draft` 先落、无 draft 的 `replace` 必拒 |
| S2-TC-E11 | 负 | Task 1 | 三态四值字面副本即红 |
| S2-TC-E12 | 正 | Task 7 | 落点 id 改名连带核对（值不变） |
| S2-TC-F01 | 正 | Task 6 | 夹具①：宾语≠落点 |
| S2-TC-F02 | 正 | Task 6 | 夹具②：两行同值 |
| S2-TC-F03 | 正 | Task 6 | 夹具③：共享句只 1 席渲染（子进程） |
| S2-TC-F04 | 负 | Task 6 | 丢 landing 槽 → 红（D2 自洽陷阱的独立断言） |
| S2-TC-F05 | 边界 | Task 6 | 夹具常驻 / 构造不落盘（sha 内容锚） |
| S2-TC-G01 | 正 | Task 10 | R8 回扫 `scope-sweep --check` exit 0 |
| S2-TC-G02 | 正 | Task 9 | `baseline` 重记 + `gate` 探针① |
| S2-TC-G03 | 正 | Task 6 | 同一判据实现点恰 1 |
| S2-TC-G04 | 负 | Task 6 | V-9 反证（副本即红） |
| S2-TC-G05 | 正 | Task 8 | 一次性全改 + 一次提交 |
| S2-TC-G06 | 负 | Task 8 | 分批改 / 手改的判别力 |
| S2-TC-G07 | 正 | Task 10 | 首日不红（门禁绿 + ⑦ 段命中 0） |
| S2-TC-H01 | 边界（执行型） | Task 11 | V-11 判据（Q7 读法①） |
| S2-TC-H02 | 边界（执行型） | Task 11 | V-11-b 测量隔离 |
| S2-TC-H03 | 边界 | Task 6 | 「产出须含 `path:line`」不挂卡面 |
| S2-TC-H04 | 正 | Task 6 | 「无问题也写结论」不加 |
| S2-TC-H05 | 负 | Task 6 | D8 判别力 |
| S2-TC-H06 | 正 | Task 6 | 「不得先改后记」转可跑判据（grep `已代为` / `已代删`） |
| S2-TC-H07 | 边界 | Task 6 | D9 的边界（0 命中） |
| S2-TC-I01 | 正 | Task 10 | C-7 只加不改 |
| S2-TC-I02 | 负 | Task 10 | 删 C-7 块即红 |
| S2-TC-I03 | 正 | Task 10 | PRD §3.4 只加注 |
| S2-TC-I04 | 负 | Task 10 | 注指死路径即红 |
| S2-TC-I05 | 边界（执行型） | Task 10 | 日期注的语义面（G-3 机判部分） |
| S2-TC-I06 | 正 | Task 10 | `rules/` 与 `skills/` 正文 sha 不变 |
| S2-TC-J01 | 正 | Task 6 | 用例 ID 与 `test()` 名同名 |
| S2-TC-J02 | 正 | Task 6 | 不自递归（不跑总门禁） |
| S2-TC-J03 | 边界 | Task 6 | 本文件计数自洽（抓「声明 ≠ 实际」） |

---

## 附录 B：提交分组与收口清单

**提交分组（一次提交，按依赖顺序写提交说明）**：

1. `feat(docgen): card-contract / object-names 数据层单源`
2. `feat(docgen): 模板占位符 + renderCard bullet + expectedBullet`
3. `feat(docgen): cardFaceIds 禁 id 守卫 + landings 键改名（R8）`
4. `test(docgen): S2 76 条用例 + 既有断言改造`
5. `chore(docgen): 15 卡两步写盘 + docs/agents 重生成 + baseline 重记`
6. `docs: S4 spec 现行判据块（C-7）+ 卡面契约 PRD 日期注`

**收口清单（③ 段出门前逐条打勾）**：

- [ ] `node --test tools/docgen/test/s2-card-rewrite.test.mjs` → 76 条全绿
- [ ] `node tools/docgen/cli.mjs gate` → `baseline N/N`、无 `Mismatch`
- [ ] `npm run check` 末行 `check 全部通过`（`# fail 0`、`0 findings`、`④ markdown 通过`）
- [ ] `node scripts/scope-sweep.mjs --check` → `sweep ok`
- [ ] `node scripts/check-observable.mjs --check` → `check-observable ok`（首日不红）
- [ ] V-11 三席复测结论已写进基线报告（判据逐席打勾）
- [ ] `agents/*.md` 与 `docs/agents/**` 均无手改痕迹（`generate` 复跑 exit 0）
