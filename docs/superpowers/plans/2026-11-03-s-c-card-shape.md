# S-C 卡面形状 实施计划（③ 段）

> 段：③ 技术实现｜上游：`docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md`（270 行 / `9B470C82…E7BA0`）+ `docs/superpowers/specs/2026-11-03-s-c-card-shape-design-testcase.md`（1072 行 / 60 条 / `FC7E144A…B26697`）
> PRD：`docs/prd/20261102212627-card-data-contract-and-proof/index.md`（S-C 行 `:121` / `:137`；**D16 / D17 只引用编号，不改写**）
> 开工前置（硬）：`gate-record.md` 的 `②@S-C` 行六列齐 + 议会 #2 通过（P0 = 0）；本 plan 过计划门（`②→③`）
> 基线（施工第 0 步必须复现）：`npm run check` → `# tests 1481 / # pass 1476 / # fail 0 / # skipped 5`、`baseline 38/38`、末行 `check 全部通过`；`$BASE = git rev-parse HEAD`

**Testcase:** `docs/superpowers/specs/2026-11-03-s-c-card-shape-design-testcase.md`

## 区间总览

| 项 | 值 |
|---|---|
| 起点 | `$BASE` = 开工时 `git rev-parse HEAD`（施工前记入执行记录） |
| 终点 | 15 卡重生成 + 2 新脚本 + 3 个新/改测试文件 + `docs/agents` 重生成；`npm run check` 全绿 |
| 改动面 | `tools/docgen/**`（数据 / 契约 / 渲染 / 2 新脚本）、`tools/observation-check/checks.mjs`（1 行 `export`）、`scripts/check-all.mjs`（1 段）、`scripts/test-skip-allowlist.mjs`（一次性档名单）、`agents/*.md`（15）、`docs/agents/**`（16）、`tools/docgen/fixtures/*.evidence.json`（15） |
| 不改 | PRD 正文、S-B 三件、`policy/**`、`outputFormats`、`enums.mjs`、`SCAN_FIELDS`、`CARD_MODEL_CODES` |

## File Structure（施工前白名单，落点外一律不写）

| 文件 | 动作 | 说明 |
|---|---|---|
| `tools/docgen/card-model/vocab/card-contract.mjs` | 改 | 删 `TRISTATE` → 加 `VERDICT_HINT` |
| `tools/docgen/components/renderCard.mjs` | 改 | 删 `tristate()` 与槽填充；`checkTable()` 表头用 `VERDICT_HINT` |
| `tools/docgen/templates/agent-card.md.tpl` | 改 | 删 `{{TRISTATE}}` |
| `tools/docgen/components/cardFaceIds.mjs` | 改 | 删层① |
| `tools/docgen/data/shared.json` | 改 | 加 `hostTerm`（3 → 4 键） |
| `tools/docgen/data/seats/*.json`（15） | 改 | action / rationale / `role`（1 席）/ `when` 斜杠 / `kind` / `${@hostTerm}` |
| `tools/docgen/check-trigger-kind.mjs` | 新建 | 四值 + 非议会席 + 名单现算 + `when` 首 12 字 |
| `tools/docgen/check-tristate-header.mjs` | 新建 | 逐席表头逐字含 `VERDICT_HINT` |
| `tools/docgen/test/sc-card-shape.test.mjs` | 新建 | 本段 testcase 落点（`SC-TC-*` 一条一 `test(`） |
| `tools/docgen/test/s2-card-rewrite.test.mjs` | 改 | A01 / A04 / A05 / A10 / B08 / D04 / D05 / E05 / F05 |
| `tools/docgen/test/sdet-render.test.mjs` | 改 | `:21` 表头断言 |
| `tools/docgen/test/sa-data-layer.test.mjs` | 改 | 夹具名 `returns`→`ghostField`；`shared.json` 键数 3→4 |
| `docs/superpowers/specs/2026-11-03-s-a-data-layer-design-testcase.md` | 改 | TC-015 文案（夹具名） |
| `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md` | 改（就地加注） | §10.1 R8 补「字段位实际由 S-C 落」 |
| `tools/docgen/test/pilot-data.test.mjs` | 改 | `:15` 旧 action 断言；`:24-26` 键集加 `kind` |
| `tools/docgen/test/tool-tiers.test.mjs` | 改 | `:623` 构造子串换新文案片段 |
| `tools/docgen/test/sdet-data.test.mjs` | 改 | `:26` `role` 去 `资深` |
| `tools/docgen/test/sb-contract-layer.test.mjs` | 改 | 一次性档 `SB-TC-06/32/25④` 改判为 S-C 形态 / 或降为不变量（见 Task 5） |
| `scripts/check-all.mjs` | 改 | 新增 ②.7 段调用两个新脚本 |
| `scripts/test-skip-allowlist.mjs` | 改 | 一次性档名字同步 |
| `tools/observation-check/checks.mjs` | 改 | `VERDICTS` 加 `export` |
| `agents/*.md`（15） | 重生成 | `draft` → `diff` → `replace --expect-change … --rejudge … --yes` |
| `docs/agents/**`（16） | 重生成 | `generate --readme --apply` |
| `tools/docgen/fixtures/*.evidence.json`（15） | 由 `replace` 自动更新 | `changes[]` / `renderSha256` |

## 功能点→任务映射表

| 功能点 | 内容（PRD 编号） | 任务落点 | 验收 |
|---|---|---|---|
| F-01 | 三态承载（D16 ③）：删 5 行 + 表头派生（R1 / R2 / R3） | Task 1 | V11 ② / `SC-TC-04`…`SC-TC-13` |
| F-02 | 十处冻结断言同批改写（R6 / PRD §5） | Task 1 / Task 5 | `SC-TC-01`…`SC-TC-19` |
| F-03 | 跨包三值相等断言（D16 ① / R4） | Task 2 | `SC-TC-20`…`SC-TC-22` |
| F-04 | 斜杠串清零（D3 / V12 / R7） | Task 3 | `SC-TC-23`…`SC-TC-26` |
| F-05 | 动作返回 + 删人设（D1/D2/D5/D6 / R8 / V9） | Task 3 | `SC-TC-27`…`SC-TC-32` |
| F-06 | `trigger.kind` 四型（Q5 / V10 / R9 / R10） | Task 2 | `SC-TC-33`…`SC-TC-38` |
| F-07 | `needs` 槽与长度约束（Q4 / R-§11.6） | Task 4 | `SC-TC-39`…`SC-TC-42` |
| F-08 | `HOST_TERM`（Q1 / R12） | Task 3 | `SC-TC-43`…`SC-TC-49`、`SC-TC-60` |
| F-09 | `returns` 计数 0（D16 ④ / V11 ① / R11） | Task 5 | `SC-TC-50`…`SC-TC-52` |
| F-10 | 15 卡重生成 + 15 份 evidence + 不变量回归 | Task 6 | `SC-TC-53`…`SC-TC-59`、`SC-TC-61` |
| F-11 | 回退面与延期落点（§11.14 / §11.12） | Task 0 / Task 6 | `SC-TC-62` |

## Task 0：开工基线 + 前置复核

**Consumes:** 无

- [ ] `git status --porcelain` 空（或只剩交接词 `docs/handoffs/2026-11-04-s-c-card-shape.md` 未跟踪，先由用户决定提交）
- [ ] `git rev-parse HEAD` → 记入「执行记录」的 `$BASE`
- [ ] `npm run check` → 记 `# tests / # pass / # fail / # skipped` + `baseline 38/38` + 末行
- [ ] 15 卡 `Get-FileHash` → 与 `docs/reports/2026-11-03-s-b-card-sha-baseline.md` 逐行比对（应 15/15 相等）
- [ ] `node scripts/check-plan.mjs size --spec … --testcase … --rounds 3` → `spec 270/350 tc 60/80 rounds 3/3 => ok`
- [ ] `node scripts/check-plan.mjs map --plan docs/superpowers/plans/2026-11-03-s-c-card-shape.md` → `map: missing 0 dangling 0（cases 60 / mapped 60） => ok`（V2 的开工侧基线）
- [ ] `docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` 存在且含「触发 / 谁兜」

## Task 1：三态承载（`VERDICT_HINT`）

**Consumes:** Task 0

- [ ] `card-contract.mjs`：删 `TRISTATE`；加 `VERDICT_HINT`（「判定取值：」+ 三值派生 + 中文对照 + reason/na 条款）
- [ ] `renderCard.mjs`：删 `tristate()` 与 `fill({{TRISTATE}})`；`checkTable()` 表头 = `| # | 条目 | 判据（${VERDICT_HINT}） | 类型 |`
- [ ] `agent-card.md.tpl`：删 `{{TRISTATE}}` 行
- [ ] `cardFaceIds.mjs`：删层①（`TRISTATE` import + 逐行豁免）
- [ ] 新脚本 `tools/docgen/check-tristate-header.mjs`（逐席渲染后判表头逐字含 `VERDICT_HINT`；`ok / bad` 首行 + 红态 `=> fail`）
- [ ] `s2-card-rewrite.test.mjs`：A01 / A04 / A05 / A10 / B08 / D04 / D05 / E05 / F05 逐条改写（每条仍可红）
- [ ] `sdet-render.test.mjs:21` 改派生串
- [ ] **新建 `tools/docgen/test/sc-card-shape.test.mjs` 骨架**（`test(` 块名 = `SC-TC-<NN>` 前缀；按附录 A 分批落，本任务落 `SC-TC-01`…`SC-TC-19` 与 `SC-TC-58`、`SC-TC-61`）
- [ ] **验收**：`node tools/docgen/check-tristate-header.mjs` → `seats 15 / ok 15 / bad 0 => ok`；`node --test tools/docgen/test/s2-card-rewrite.test.mjs` 全绿

## Task 2：`trigger.kind` + 跨包三值断言

**Consumes:** Task 1

- [ ] 15 席 `trigger` 对象加 `kind`（`dispatch` 11 / `occasion` 1 / `moment` 1 / `need` 2）；`reviewer-audit` 的 `when` **一字不动**
- [ ] `pilot-data.test.mjs:24-26`：键集加 `kind`；`when` 逐字断言保留
- [ ] 新脚本 `tools/docgen/check-trigger-kind.mjs`（四值 + 非议会席只许 `need` + 名单现算 + 输出附 `when` 前 12 字 + 红态 `=> fail`）
- [ ] `tools/observation-check/checks.mjs`：`VERDICTS` 加 `export`
- [ ] `scripts/check-all.mjs`：新增 ②.7 段（调两个新脚本，按退出码判）
- [ ] **验收**：`node tools/docgen/check-trigger-kind.mjs` → `kinds {dispatch:11,occasion:1,moment:1,need:2} / bad 0 => ok`；`node --test tools/docgen/test/pilot-data.test.mjs` 全绿

## Task 3：数据文案（斜杠串 / 动作 / 人设 / `HOST_TERM`）

**Consumes:** Task 2

- [ ] 5 条 `when` 斜杠串改顿号（`PRD/spec/plan` 等）；`senior-sdet` / `evidence-reader` 的括号内斜杠同改
- [ ] 15 席 `duty.action` 按统一句式重写（禁三态词、产物名非占位、≥3 种）
- [ ] 11 席 `rationale` 开头人设句改「本席视角 + 拆卡依据」；**保住全部 `${@hostTerm}` 占位**（`detective-observer.json:90` 一行 2 处）
- [ ] `senior-sdet` 的 `role` 去 `资深` 前缀；`sdet-data.test.mjs:26` 同批改
- [ ] `shared.json` 加 `hostTerm`；席位数据 18 次「主持人」→ `${@hostTerm}`
- [ ] `pilot-data.test.mjs:15` 换新 action 文案；`tool-tiers.test.mjs:623` 换新文案片段
- [ ] **验收**：四字段斜杠 **0 项**；`资深` / `20 年` 三面 **0**；`${@hostTerm}` **18 次**；渲染 15 卡「主持人」**30 次**；`gate` exit 0

## Task 4：长度约束与槽位计数

**Consumes:** Task 3

- [ ] 断言 `categories[].label` 每项 ≤ 20 字（现 max 13）＋注入 21 字负例
- [ ] 断言 `needs` / `purpose` / `method` 在 card 8 键 + duty 4 键面 **0 命中**
- [ ] **验收**：`node --test --test-name-pattern "SC-TC-39|SC-TC-40|SC-TC-41|SC-TC-42" tools/docgen/test/sc-card-shape.test.mjs` 全绿

## Task 5：`returns` 归零 + 一次性档重算

**Consumes:** Task 3

- [ ] `sa-data-layer.test.mjs` 夹具名 `returns` → `ghostField`（`:120` / `:122` / `:559`）；`shared.json` 键数断言 3 → 4
- [ ] S-A testcase `TC-015` 文案同改（**签后增量登记**）
- [ ] `sb-contract-layer.test.mjs` 的一次性档 `SB-TC-06` / `SB-TC-32` / `SB-TC-25④`：改写为 S-C 形态（或降为「每席都变 + 每席一个路径」类不变量）；`SB_BASE` 默认常量换成 S-C 的 `$BASE`
- [ ] `scripts/test-skip-allowlist.mjs`：一次性档名字同步（新名字必须白名单，否则「名单外 skip」判红）
- [ ] **验收**：`(Select-String -Path tools/docgen -Recurse -Pattern 'returns' -Include *.mjs,*.json).Count` → **0**；`SB_SHAPE_ONESHOT=1 node --test tools/docgen/test/sb-contract-layer.test.mjs` 全绿

## Task 6：15 卡重生成 + 收口

**Consumes:** Task 1、Task 2、Task 3、Task 4、Task 5

- [ ] 逐席 `draft --kind agent --name <seat>` → `diff` → `replace --draft … --expect-change <渲染 sha> --rejudge <触达键> --yes`（`DOCGEN_JUDGED_BY` = 独立于施工者的实例）
- [ ] `node tools/docgen/cli.mjs generate --readme --apply`（`docs/agents/**` 16 份）
- [ ] `node tools/docgen/cli.mjs gate` → exit 0 + 15 席 `disk == render`
- [ ] `npm run check` → `# fail 0`、`# tests ≥ 1481 + 本批新增`、末行 `check 全部通过`
- [ ] 观测项记录：15 卡去换行总字符、`## 本席清单` 段字符和、判据列字符和的前后两值（只记录，不设红点）
- [ ] **用例账对齐**：`tools/docgen/test/sc-card-shape.test.mjs` 的 `test(` 块数 = 附录 A 行数 = **60**（缺一即该条未落）
- [ ] 回退面演练复核：§11.14 四步的复验项在当前盘面成立
- [ ] **验收**：`gate-record.md` 的 `③@S-C` 行可填（施工完成 + 门禁绿）

## 附录 A：用例 → 任务落点

| 用例 ID | 覆盖 | 任务 |
|---|---|---|
| SC-TC-01 | `VERDICT_HINT` 派生形态 | Task 1 |
| SC-TC-02 | 手写串 / 缺 `na` 坏值必抛 | Task 1 |
| SC-TC-04 | 四导出恰等 | Task 1 |
| SC-TC-05 | 多一导出即红 | Task 1 |
| SC-TC-06 | `VERDICT_HINT` 定义恰 1 处 + `cardFaceIds` 计数 + F05 探针 | Task 1 |
| SC-TC-07 | `TRISTATE` 命中须 0 | Task 1 |
| SC-TC-08 | 「一定会」段末 5 行已消失 | Task 1 |
| SC-TC-09 | 回填一行三态即红 | Task 1 |
| SC-TC-10 | `check-tristate-header` 绿态 | Task 1 |
| SC-TC-11 | 删表头一值 → `ok 0 / bad 15` | Task 1 |
| SC-TC-12 | 手写串 / 挪出段 → 必红 | Task 1 |
| SC-TC-13 | 段末无孤立三态行 | Task 1 |
| SC-TC-14 | `sdet-render:21` 派生串 | Task 1 |
| SC-TC-15 | 表头漂移即红 | Task 1 |
| SC-TC-16 | 删层① 后 `S2-TC-C01`–`C09` 仍绿 | Task 1 |
| SC-TC-17 | 三值仍在「许」集 | Task 1 |
| SC-TC-18 | 层① 删除后守卫非空转 | Task 1 |
| SC-TC-20 | 跨包三值相等 | Task 2 |
| SC-TC-21 | 改任一侧即红 | Task 2 |
| SC-TC-22 | `export` 形态 + `enums.mjs` 零改动 | Task 2 |
| SC-TC-23 | 斜杠串 0 项（常驻） | Task 3 |
| SC-TC-24 | 注入一处必红 | Task 3 |
| SC-TC-25 | 全角 `／` 同判 | Task 3 |
| SC-TC-26 | `entry.duty` 错口径恒 0（判别力） | Task 3 |
| SC-TC-27 | 动作行四件（写回 / 非占位 / ≥3 种 / 无三态词） | Task 3 |
| SC-TC-28 | 注入 1 席缺「写回」即红 | Task 3 |
| SC-TC-29 | 人设三面 0（含外层 `role`） | Task 3 |
| SC-TC-30 | 回填人设即红 + `${@hostTerm}` 18 次 | Task 3 |
| SC-TC-31 | 人设词面 `20 年` | Task 3 |
| SC-TC-32 | 英文/中文三态不得进动作行 | Task 3 |
| SC-TC-33 | `check-trigger-kind` 绿态 | Task 2 |
| SC-TC-34 | 第五个 kind → exit 1 | Task 2 |
| SC-TC-35 | 非议会席非 `need` → exit 1 | Task 2 |
| SC-TC-36 | 名单现算（第 16 席注入） | Task 2 |
| SC-TC-37 | `kind` 不进 `card` / 不进渲染 | Task 2 |
| SC-TC-38 | 与 `env.parliamentSeats` 相等 | Task 2 |
| SC-TC-39 | `categories[].label` ≤ 20 字 | Task 4 |
| SC-TC-40 | 注入 21 字 → 红 | Task 4 |
| SC-TC-41 | 三词槽 0 命中 | Task 4 |
| SC-TC-42 | 判据对象 = 卡模型键面 | Task 4 |
| SC-TC-43 | `shared.json.hostTerm` | Task 3 |
| SC-TC-44 | 字面 0 + `${@hostTerm}` 18 次 | Task 3 |
| SC-TC-45 | 行口径 vs 次数口径 | Task 3 |
| SC-TC-46 | 渲染总数 30 不变 | Task 3 |
| SC-TC-47 | 副本探针跟随（`hostTerm`） | Task 3 |
| SC-TC-48 | 副本改常量不重生 → `Mismatch` | Task 3 |
| SC-TC-49 | `@HOST_TERM` 非法（整值形态） | Task 3 |
| SC-TC-50 | `returns` 计数 0 | Task 5 |
| SC-TC-51 | 判据实现须拼接构造该词 | Task 5 |
| SC-TC-52 | 回填该词即红 | Task 5 |
| SC-TC-53 | `gate` exit 0 + 15 席 `disk == render` | Task 6 |
| SC-TC-54 | `# tests` ≥ 1481 + 新增 | Task 6 |
| SC-TC-55 | `# fail 0` 复现（施工第 0 步） | Task 0 |
| SC-TC-56 | `docs/agents` 重生成 16 份 | Task 6 |
| SC-TC-57 | 一次性档清单与 `SB_BASE` | Task 5 |
| SC-TC-58 | 36 码 / 8 键 / 3 值不变 | Task 1 |
| SC-TC-59 | 本批 diff 形态（一次性） | Task 6 |
| SC-TC-60 | 大写形态 / `${@` 残留 0 | Task 3 |
| SC-TC-61 | `VERDICT_HINT` 副本探针（B08） | Task 1 |
| SC-TC-62 | 回退面复验 + 延期落点实名 | Task 0 / Task 6 |

## 执行记录

| 任务 | 提交 | 完成判据（命令首行） | 状态 |
|---|---|---|---|
| Task 0 | 收口时回填 | `$BASE=eef963e96c0a2c309c83789e13da5b195b1d4e0c`；`npm run check` → `# tests 1481 / # pass 1476 / # fail 0 / # skipped 5` + `baseline 38/38` + 末行 `check 全部通过`；15 卡 `Get-FileHash` vs `docs/reports/2026-11-03-s-b-card-sha-baseline.md` → `15/15` 相等；`check-plan size` → `spec 270/350 tc 60/80 rounds 3/3 => ok`；`check-plan map` → `cases 60 / mapped 60`；`check-plan deps` → `nodes 7 / edges 10`；`docs/after/20261104101304-s-c-checkitem-returns-deferral-open-decisions.md` 存在且含「触发 / 谁兜」 | 完成 |
| Task 1 | 收口时回填 | `node tools/docgen/check-tristate-header.mjs` → `check-tristate-header: seats 15 / ok 15 / bad 0 => ok`；`node --test tools/docgen/test/sc-card-shape.test.mjs` → `# tests 19 / # pass 19 / # fail 0`（SC-TC-01…18 + 58 + 61）；9 条冻结断言（A01/A04/A05/A10/B08/D04/D05/E05/F05）+ `sdet-render` 4/4 全绿；**已知红** = `gate` / `disk == render` 家族 46 条（15 卡尚未重生成，Task 6 收敛） | 完成 |
| Task 2 | 收口时回填 | `node tools/docgen/check-trigger-kind.mjs` → `check-trigger-kind: seats 15 / kinds {dispatch:11,occasion:1,moment:1,need:2} / bad 0 => ok`；`node --test tools/docgen/test/pilot-data.test.mjs` → `# tests 4 / # pass 4 / # fail 0`；`node --test tools/docgen/test/sc-card-shape.test.mjs` → `# tests 28 / # pass 28 / # fail 0`（新增 SC-TC-20/21/22、33…38）；`check-shared-refs` → `keySet8 15 / keySet12 15 => ok`；`scripts/check-all.mjs` 已接 ②.7 段（两脚本按退出码判） | 完成 |
| Task 3 | 收口时回填 | 取数（`node .session/tmp/probe-s-c.mjs`，实跑）：`slashItems 0` / `persona {"资深":0,"20 年":0}` / `hostLiteral 0 hostRefs 18 upper 0` / `renderHost 30 residual 0 actionWriteback 15/15 names 5`；15 席 `duty.action` 全改「…结论写回⟨产物名⟩」，`role` 去「资深」，`shared.json` 加 `hostTerm`（键数 4）；`node --test tools/docgen/test/sc-card-shape.test.mjs` → `# tests 46 / # pass 43 / # fail 3`（**红 3 = SC-TC-29 / 31 / 48，均为「15 卡未重生成」**，Task 6 收敛）；`pilot-data` / `sdet-data` / `dev-workflow-counts` 全绿 | 完成 |
| Task 4 | 收口时回填 | `node --test --test-name-pattern "SC-TC-39|SC-TC-40|SC-TC-41|SC-TC-42" tools/docgen/test/sc-card-shape.test.mjs` → `# tests 4 / # pass 4 / # fail 0`；`labels 97 / max 13`（≤ 20 判据绿）+ 副本注入 21 字 → `max 21` 红；三词槽卡模型键面 0；全树行口径 `0 / 22 / 1` 与键面 0 不相等（口径判别力成立）；整文件 `# tests 50 / # pass 47 / # fail 3`（红 3 仍为「15 卡未重生成」） | 完成 |
| Task 5 | 收口时回填 | `(Get-ChildItem tools\docgen -Recurse -File -Include *.mjs,*.json \| Select-String -Pattern ('ret' + 'urns') \| Measure-Object -Line).Lines` → **0**（夹具名已改 `ghostField`）；S-A testcase `TC-015` 文案同批改并登记 `gate-record.md` 的 `②@S-A` 签后增量；`sb-contract-layer.test.mjs` 的 `SB_BASE` 默认换 `eef963e96c0a2c309c83789e13da5b195b1d4e0c`、`SB-TC-32` 改判为 S-C 位置型三段（skip 名单同步）；`node --test sa-data-layer + sb-contract-layer` → `# tests 77 / # pass 69 / # fail 5 / # skipped 3`（红 5 全为 gate / disk==render 家族）；`sc-card-shape` → `# tests 54 / # pass 51 / # fail 3`（同族）；`check-gate-record` → `rows 70 bad 0` + `gate-record ok` | 完成 |
| Task 6 | — | — | 未开工 |

## 风险与回落

| 风险 | 触发信号 | 回落 |
|---|---|---|
| `s2-card-rewrite` 改写后判据恒真 | 注入坏值仍绿 | 回 Task 1 重写断言（每条必须给负例） |
| `kind` 加进 `trigger` 撞既有键集断言 | `pilot-data` / `check-shared-refs` 红 | 回 Task 2 同批改断言（不放松） |
| `${@hostTerm}` 占位在 rationale 改写时丢失 | 18 次判据变 17 | 回 Task 3 补回占位 |
| 一次性档 BASE 未换 | `SB_SHAPE_ONESHOT=1` 全红 | 回 Task 5 换 `SB_BASE` / 改判为不变量 |
| 重生成失败（`UnapprovedChange`） | `replace` 拒 | 检查 `--expect-change` 是否取「即将写盘字节」的 sha；`--rejudge` 是否漏键 |
