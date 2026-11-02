# 可观察判据与复用 · S3 实施计划

> 状态：**待 ②→③ 计划门（未签字）**｜创建 2026-11-02｜上游 spec：`docs/superpowers/specs/2026-11-02-observable-s3-predicates-reuse-design.md`（v3.1，283 行 / `3B09FC7A3EC30DDD0C5B20C0FFC1D99FF35A811BC56E0CD6959C7D311BE3CF03`，② 段已签 `②@S3-predicates-reuse`）
> **Testcase:** `docs/superpowers/specs/2026-11-02-observable-s3-predicates-reuse-design-testcase.md`（80 条 / `BE8324078F21AFFB12CBA4AD8E0281E28A5ABEF8A0DAF25411F7132637C37826`）
> 本计划 = spec §7 的 **S1–S7** 施工顺序的排期形态；**不新增 spec 未定的设计**。

**Testcase:** `docs/superpowers/specs/2026-11-02-observable-s3-predicates-reuse-design-testcase.md`（80 条 / `BE8324078F21AFFB12CBA4AD8E0281E28A5ABEF8A0DAF25411F7132637C37826`）

## 全貌确认（事前三步 · 第一步产物）

| 维 | 内容 |
|---|---|
| 本质 | 把 S1 的清单接到另外两个载体（卡面数据层 / 判据登记表），并让两体检器引用而不复制；治「label 是形容词、判据面恒不命中」 |
| 同族 | `predicates.mjs` → `renderCard` → 15 卡 → `gate` → 2 个测试文件 → `skills/parliament/**` 3 处 → `execution-matrix/criteria.md` |
| 边界 | 不动 `SCAN_FIELDS` / 36 码 / barrel 18 项 / S1 判定实现 / S2 卡面形态；不加扫描根 |
| 验收 | PRD V-8 / V-9 / V-10；spec §9.2 |
| 影响面 | 旧 label 命中 35 文件 / 175 行；15 卡必同批重生成；substring 扩面实测 336 条文本 0 命中；计数口径 24→25 |
| 联动四问 | 治本（退出码判死）；副作用（20+ 条满分断言变值，只改数字）；跨问题（四功能同一根因）；跨项目（card-model 与 rules/skills 共用） |

## Global Constraints（对每个任务隐含生效）

- **禁止手改** `agents/*.md`：走 `draft` → 用户确认（改前 vs 改后两版对照）→ `replace --yes`。
- **必红期**：T1 之后 `npm run check` 必红（`gate` 报 `Mismatch`，**只报首条单行**）；禁止 cherry-pick 提交、禁止跳测试、禁止改断言凑绿（只许派生化）。
- **不新增**：`SCAN_FIELDS` 键、`CARD_MODEL_CODES` 码名、barrel 导出、门禁段、脚本文件、卡面字段。
- **不做** `baseline --write`（spec D-15）；`baseline 38/38` 是常量打印，不作判据。
- 判据级口径改动（8 条 label / 检查点数 / V-9·V-10）逐一进当次 `impact-sheet.md`。
- 每步命令一律仓根可粘贴；禁 `npm run x -- --flag`（PowerShell + npm 10.9 吞参）。

## 文件结构（交付白名单，③ 段只许动这些）

| 文件 | 动作 | 归属 |
|---|---|---|
| `tools/docgen/card-model/vocab/predicates.mjs` | 改（8 条 + 三字段） | F-07 |
| `tools/docgen/card-model/validatePredicates.mjs` | 新建 | F-08 |
| `tools/docgen/card-model/vocab/subjective-terms.mjs` | 改（加 `subjectiveHit`） | F-08 / F-02 |
| `tools/docgen/card-model/validateCardModel.mjs` | 改（改用共用 `subjectiveHit`） | F-02 后半 |
| `tools/docgen/cli.mjs` | 改（`gateChecks()` 接线） | F-08 |
| `tools/docgen/test/s3-predicates.test.mjs` | 新建（80 条） | 全部 |
| `tools/docgen/test/pilot-render.test.mjs` / `evidence-reader.test.mjs` | 改（断言派生化） | F-07 |
| `agents/*.md`（15）+ `docs/agents/**` | 重生成 | F-07 派生 |
| `skills/rule-inspector/references/criteria.md` / `references/recipes.md` / `scripts/score.mjs` / `scripts/score.test.mjs` / `assets/rule-edit-checklist-template.md` / `SKILL.md` | 改（⑨ + 计数 + 处方 + `:35` 的 24→25） | F-09 |
| `rules/skill-authoring-convention.md` | 改（判据⑤） | F-09 |
| `tools/execution-matrix/buckets.mjs` / `check-buckets.mjs` | 改（四处归桶登记） | F-09 |
| `skills/rule-writer/SKILL.md` / `references/writing-guide.md` / `assets/rule-skeleton.md` | 改（引用 + 计数） | F-10 |
| `skills/dev-workflow/SKILL.md` | 改（指针一行） | F-10 |
| `skills/review-log/assets/review-progress-template.md` | 改（查账 +1 行） | F-09 同步④ |
| `docs/after/<时刻>-skill-creator-observable-reference-open-decisions.md` | 新建 | F-10 缺口 |
| `tools/scope-sweep/keywords.json` / `baseline.json` | 改（`I22`–`I25` + 冻改前值） | R8 |
| `tools/execution-matrix/criteria.md`（A/B/C 判据正文） | 改（旧 label 引用） | R8 |
| `skills/parliament/**` 3 处 | 改引用 | R8 |
| `docs/prd/20261031202331-observable-criteria-rollout/index.md` | 只加日期注 | R8 |
| `skills/dev-workflow/references/gate-record.md` | 门行 | 流程 |

## 功能点 → 任务映射

| 功能点 | 任务 | 说明 |
|---|---|---|
| F-07 | Task 1、Task 4 | 8 条 label 改写（T1）+ 同批重生成与派生化（T4） |
| F-08 | Task 2、Task 3 | `validatePredicates` + D5（T2）+ `gate` 接线（T3） |
| F-02 | Task 2 | 后半：卡面 substring 扩面 + 判据表判定面（不新增扫描根） |
| F-09 | Task 5 | 两 inspector 四处 + 同步 6 项 + 归桶四处 |
| F-10 | Task 6 | 仓内两处引用 + 全局缺口在册 |

## Task 1：8 条 label 改写与新字段（数据层）

- **Consumes:** 无
- **产出**：`predicates.mjs` 8 条「核心语义——可判句」+ `observable` / `negativeSample` / `residual{who,sample}`（`who` 写「角色（抽什么）」）。
- 步骤：
  - [ ] 按 spec §3 表逐条改写；`never` 4 条必须是违规形态（`out-of-scope` 不含 `diff`、`proxy-fill` 用「所记名称」）
  - [ ] 自查 C-1～C-8（键集 / 四字段 / label 不含 terms / observable 每元素命中 markers / never 形态 / 载体在位 / label 后段含 marker）
  - [ ] 实跑：`node --input-type=module -e "…markers 正则…"` → 8 条 label 后段与 16 个 observable 元素全部命中 ≥1
- **验收**：`node --input-type=module` 打印 `labelOk 8 / obsOk 16`；`git diff --numstat` 只含该文件。

## Task 2：`validatePredicates` + D5 + substring 单实现

- **Consumes:** Task 1
- 产出：`validatePredicates.mjs`（新建，D1–D5、`path` 无前缀、码只复用 `SubjectiveLabel` / `UnverifiableOutput`）；`subjective-terms.mjs` 加 `subjectiveHit`；`validateCardModel.mjs` 改用它。
- 步骤：
  - [ ] D1–D5 落地；D5 = `observable[<i>]` 未命中任一 `markers[].pattern` → `UnverifiableOutput`
  - [ ] `subjectiveHit` 全仓恰 1 处定义（删本地 `tokensOf` 版）
  - [ ] 15 席扫描三面实跑 `texts 291` + 超集 45 → `substring 0 / token 0`
  - [ ] 新建 `tools/docgen/test/s3-predicates.test.mjs`，把 80 条用例逐条落成 `test('S3-TC-…')`
- **验收**：`node --test --test-reporter=tap tools/docgen/test/s3-predicates.test.mjs` → `# tests 80 / # fail 0`；`validateCardModel` 15 席 `errors 0`。

## Task 3：`gate` 接线 `validatePredicates`

- **Consumes:** Task 2
- 步骤：
  - [ ] `gateChecks()` 在「运行时唯一防线」之前调 `validatePredicates(PREDICATES)`；先逐条 `console.error`，再 `fail(首条.code)` → exit 1；不进 `Mismatch`
  - [ ] 构造：把一条 label 写入旧文案 → `gate` stderr 首行 `SubjectiveLabel: predicates[...].label…`（**只一行**）
  - [ ] `card-model/index.mjs` 零改动（barrel 18 项）
- **验收**：`node tools/docgen/cli.mjs gate` exit 1（构造时）/ exit 0（还原后）；`barrel 18`。

## Task 4：测试与引用件派生化 + 15 卡重生成

- **Consumes:** Task 1
- 步骤（顺序不可换，spec §7 S1a → S1b）：
  - [ ] S1a：`pilot-render.test.mjs:73`、`evidence-reader.test.mjs:90/:214` 改从 `PREDICATES[id].label` 派生；`execution-matrix/criteria.md:16`、`skills/parliament/**` 3 处改引用
  - [ ] S1a 验收：`node --test tools/docgen/test/pilot-render.test.mjs tools/docgen/test/evidence-reader.test.mjs` fail 0
  - [ ] S1b：15 卡 `draft` → 确认（改前 vs 改后对照展示）→ `replace --yes`；`docs/agents/**` 重生成
  - [ ] S1b 验收：`node tools/docgen/cli.mjs gate` exit 0（15 席 disk == render；反证 = 改 1 字节后 `Mismatch`）
- **验收**：`gate` exit 0 + `H01/H02/H03/H07/H08` 绿。

## Task 5：F-09 四处 + 同步 6 项 + 归桶四处

- **Consumes:** 无
- 步骤：
  - [ ] `criteria.md` §2.4 加 **⑨**（判定 = 验证节 `^#{2,3}\s*验证$` 内 ≥1 行命中 markers；无该节 0 分）
  - [ ] `recipes.md` 加 **§R9**（三条改法）
  - [ ] `score.mjs` 加 `g('执行力度','⑨判据可观察',…)`；不读豁免清单；块内零词面
  - [ ] `rules/skill-authoring-convention.md` 加 **判据⑤**
  - [ ] 计数清单逐处改（`criteria.md:1/:61/:81/:85`、§3.4 六行、§3.5 六行、`SKILL.md:35`、`writing-guide:1/:19/:34`、`rule-writer/SKILL.md:3/:29/:36`、`rule-edit-checklist:75`、`rule-skeleton:29`）
  - [ ] 归桶四处：`buckets.mjs:8` 两桶 items、`check-buckets.mjs:35-44` `RULE_MARKER_ITEM`、`:46-51` `SKILL_MARKER_ITEM`、`:32` 注释（⑨/⑤ 各自独有 → 不动 `SHARED_MARKERS`）
  - [ ] 同步 6 项（① score↔criteria ② criteria↔recipes ③ rule-writer 三层 ④ review 查账 +1 行 ⑤ 0 删除声明 ⑥ checklist E2）
  - [ ] `score.test.mjs` 8 份 fixture 补带 marker 的验证句（**不放宽 ⑨**）；20+ 条满分断言逐条 +1
- **验收**：`node --test skills/rule-inspector/scripts/score.test.mjs` fail 0；⑨ 实测 `N/23`（不恒 0 / 不恒 1）；`check-buckets` 绿；`npm run check` 仍绿（末行 `check 全部通过`）。

## Task 6：F-10 两处引用 + 全局缺口在册

- **Consumes:** 无
- 步骤：
  - [ ] `rule-writer/SKILL.md` 自查第 3 步加「判据可观察」（跑 `check:observable`，只引用规则不复制词表）
  - [ ] `dev-workflow/SKILL.md` 指针节加一行（段表零改动）
  - [ ] 新建 `docs/after/<创建时刻>-skill-creator-observable-reference-open-decisions.md`（四要素：现状 / 该做 / 触发 / 谁兜）
- **验收**：`node scripts/check-observable.mjs --check` exit 0；`node scripts/doc-name.mjs --check docs` 通过。

## Task 7：R8 回扫与收口门禁

- **Consumes:** Task 3、Task 4、Task 5、Task 6
- 步骤：
  - [ ] `keywords.json` 补 `I22`–`I25`，`--freeze` 记改前值；`scope-sweep --check` exit 0
  - [ ] 当次 `impact-sheet.md` 逐面处置（改 / 改引用 / 标历史保留）
  - [ ] `npm run check` 末行 `check 全部通过`；`gate` exit 0；`doc-name` 通过
  - [ ] ③ 段门行落 `gate-record.md`
- **验收**：四条命令全绿 + 门行 `rows N bad 0`。

## 附录 A：80 条用例 → 任务落点

| 用例 | 摘要 | 任务 |
|---|---|---|
| S3-TC-A01 | 8 id 与顺序不变、impl manual | Task 1 |
| S3-TC-A02 | 多/少/改 impl 各红 | Task 1 |
| S3-TC-A03 | 四字段齐、label 为判据句 | Task 1 |
| S3-TC-A04 | 四字段缺形各红、path 无前缀 | Task 2 |
| S3-TC-A05 | `residual.sample` 正整数边界 | Task 1 |
| S3-TC-B01 | 8 条 label 对 terms 0 命中 | Task 1 |
| S3-TC-B02 | 旧 label 复原即命中（红探针） | Task 7 |
| S3-TC-B03 | 词表外同义形容不判红 | Task 1 |
| S3-TC-B04 | 扫描面只喂 label | Task 2 |
| S3-TC-C01 | 8×N 条 observable 全命中标记 | Task 1 |
| S3-TC-C02 | `['ok']` / `写得好` 零标记 | Task 1 |
| S3-TC-C03 | 标记命中矩阵 + 整串口径 | Task 1 |
| S3-TC-D01 | 4 条 never 实渲逐字行 | Task 4 |
| S3-TC-D02 | never 写成 must / 通过态写进 never 各红 | Task 1 |
| S3-TC-D03 | must 侧形态边界 | Task 4 |
| S3-TC-D04 | 语义保真 + 载体列在位 | Task 1 |
| S3-TC-D05 | 语义被替换 / 载体未声明 / C-8 无标记各红 | Task 1 |
| S3-TC-D06 | 8 条 label 后段各含 ≥1 marker | Task 1 |
| S3-TC-E01 | 五条判定全过 | Task 2 |
| S3-TC-E02 | 纯函数 / 0 新码 / 两码 exit 1 | Task 2 |
| S3-TC-E03 | label 命中 terms 即红且不豁免 | Task 2 |
| S3-TC-E04 | observable 四种非形各红 | Task 2 |
| S3-TC-E05 | negativeSample 缺或空即红 | Task 2 |
| S3-TC-E06 | residual 三类各红 | Task 2 |
| S3-TC-E07 | observable 无标记 → D5 必红 | Task 2 |
| S3-TC-E08 | 一回列全 + path 无前缀 + 不改入参 | Task 2 |
| S3-TC-F01 | `subjectiveHit` 恰 1 处且被改用 | Task 2 |
| S3-TC-F02 | 副本复原本地实现即红 | Task 2 |
| S3-TC-F03 | substring vs token 判别力对照 | Task 2 |
| S3-TC-F04 | 旧 8 条复原后仅含词那条红 | Task 2 |
| S3-TC-F05 | 15 席三面双口径 0 / 0 | Task 2 |
| S3-TC-F06 | 塞一个词进 action 即命中 | Task 2 |
| S3-TC-F07 | 词表唯一源仍是 JSON | Task 2 |
| S3-TC-G01 | 仓内 gate 绿（baseline 不作判据） | Task 3 |
| S3-TC-G02 | 判据表坏 → exit 1 首行 predicates | Task 3 |
| S3-TC-G03 | 两错并存先报判据表 | Task 3 |
| S3-TC-G04 | barrel 18 项、按路径 import | Task 3 |
| S3-TC-H01 | 15 席 disk == render | Task 4 |
| S3-TC-H02 | 改 1 字节 → Mismatch | Task 4 |
| S3-TC-H03 | 新 label 每席命中、旧 label 0 | Task 4 |
| S3-TC-H04 | 无「不得不得」+ baseline 不变 | Task 4 |
| S3-TC-H05 | 未接管席属已排除情形 | Task 4 |
| S3-TC-H06 | 必红期只报首条 + 回退面 | Task 4 |
| S3-TC-H07 | S1a → S1b 顺序可走通 | Task 4 |
| S3-TC-H08 | 跳过 S1a 直接 S1b 必红 | Task 4 |
| S3-TC-I01 | criteria §2.4 新增 ⑨ 行 | Task 5 |
| S3-TC-I02 | 计数清单全改 + 归桶四处 | Task 5 |
| S3-TC-I03 | recipes 新增 §R9 | Task 5 |
| S3-TC-I04 | score 新增 ⑨ 且块内零词面 | Task 5 |
| S3-TC-I05 | 验证节有 marker → 1 分 | Task 5 |
| S3-TC-I06 | 验证节无 marker → 0 分 | Task 5 |
| S3-TC-I07 | 无验证节 → 0 分 | Task 5 |
| S3-TC-I08 | 验证节定位口径（D-17） | Task 5 |
| S3-TC-I09 | 归桶未登记 / 非共享 / 缺确认各红 | Task 5 |
| S3-TC-I10 | score.test 满分 +1 且块绑定 | Task 5 |
| S3-TC-I11 | 漏改任一处计数即红 | Task 5 |
| S3-TC-I12 | skill-authoring 判据⑤ | Task 5 |
| S3-TC-I13 | 同步 6 项缺一即红 | Task 5 |
| S3-TC-I14 | 查账 #36 / E2 行各 1、条目级不减 | Task 5 |
| S3-TC-J01 | rule-writer 自查第 3 步 | Task 6 |
| S3-TC-J02 | 复制词表进 skill 即红 | Task 6 |
| S3-TC-J03 | dev-workflow 指针一行、段表零改 | Task 6 |
| S3-TC-J04 | 指针行写死词表即红 | Task 6 |
| S3-TC-J05 | docs/after 四要素 + 命名合规 | Task 6 |
| S3-TC-K01 | keywords 补 I22–I25 | Task 7 |
| S3-TC-K02 | baseline 四口径为改前值 | Task 7 |
| S3-TC-K03 | 漏登记一条即红 | Task 7 |
| S3-TC-K04 | 回扫绿（sweep exit 0） | Task 7 |
| S3-TC-K05 | 旧 label 源与 criteria 命中归零 | Task 4 |
| S3-TC-K06 | parliament 3 处改引用 | Task 4 |
| S3-TC-K07 | 不改的没改、该改的归零 | Task 7 |
| S3-TC-K08 | 命中处未进 impact-sheet 即红 | Task 7 |
| S3-TC-K09 | 两测试断言派生化 | Task 4 |
| S3-TC-L01 | 新测试单跑绿 | Task 2 |
| S3-TC-L02 | ⑦ 扫描根不变、不加 ⑧、仍绿 | Task 7 |
| S3-TC-L03 | ID 唯一 / 覆盖表双向 / ≤80 | Task 7 |
| S3-TC-L04 | spec 不内联用例 | Task 7 |
| S3-TC-L05 | 本文件不自递归跑全量门禁 | Task 7 |
| S3-TC-L06 | 声明计数 == 实测 | Task 7 |
| S3-TC-L07 | 不另写第二套 helper、无悬空符号 | Task 7 |

## 附录 B：提交分组与收口清单

| 组 | 内容 | 提交前必须绿 |
|---|---|---|
| B1 | T1 + T2 + T3（数据层 / 校验器 / 接线） | `node --test s3-predicates.test.mjs`、`validateCardModel` errors 0 |
| B2 | T4（派生化 + 15 卡重生成） | `gate` exit 0、两个旧测试 fail 0 |
| B3 | T5（inspector 四处 + 计数 + 归桶） | `score.test.mjs` fail 0、`check-buckets` 绿 |
| B4 | T6 + T7（引用 / 缺口 / R8 / 收口） | `check:observable`、`scope-sweep`、`npm run check`、`doc-name` |
| 收口 | `gate-record.md` 的 `③@S3-predicates-reuse` 与 `④` / `⑤` 行 | `rows N bad 0` |

- 未完成项落点：`docs/after/`（当前 2 条候选：GAP-10 / GAP-11）。
- 限度：testcase 已到 **80/80** 上限，若 ③ 段需新增用例，按 spec D-11 回 ② 或拆 spec。
