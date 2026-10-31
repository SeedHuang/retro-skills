# S4-TC 缺口盘点（61 条验收清单 vs 现状 12 块，2026-10-31）

> **归档说明（2026-10-31 ④ 段）**：本文件原在 `.session/reviews/2026-10-31-1200-senior-sdet-migration/`（不进 git）。按 ③ 段 `gate-record.md` 的 `③@S4-render` 结论列 P2-③「缺口表在 `.session/`，④ 引用前须先迁 `docs/`」，本批把它**原样迁入本处（git 可核）**，副本即唯一正本；`.session/` 那份已删。迁入理由不写在原文里，见文末「增补」。
> 用途：③ 段收口前的**只读盘点**，结论供 ④ 段缺口表使用。判据全集 = 签字版 testcase（`docs/superpowers/specs/2026-10-29-agent-card-s4-render-design-testcase.md`，v4 = **61 条**）；落点约定 = 「每条 = `tools/docgen/test/card-render.test.mjs` 里一个 `test('S4-TC-XX …')` 块」。
> 现状实测（`Select-String -Path tools\docgen\test\card-render.test.mjs -Pattern "^test\('S4-TC-"`）：**12 块**（A07 / A08 / C06 / D01 / D02 / F10 / H01 / H03 / I04 / J02 / J04 / K01）——**这是 2026-10-31 13:0x 的盘点时点值**；④ 段收口后为 **61 块**（见文末增补）。
> 数字来源与可信度：61 = 已签 testcase 总数（最可信）；44 / 17 = plan 里的**预估**，被 git 史推翻（Task 1–6 实际只落 3→9→12 块，`git show <commit>:… | Select-String "^test\("` 可复算）；49 = 61 − 12（本盘点即按此展开）。

## 一、分类口径

| 类 | 含义 | 处置 |
|---|---|---|
| **A 可执行** | 按现实现，原判据能直接写成明确通过/失败的断言，只差 test 块 | 可补，风险低 |
| **B 前提已废** | 用例依赖的阶段状态已不存在（15 席全迁 / 旧模板已删），原判据失去对象 | 回 ② 改判或只保留仍有效的半条 |
| **C 需回 ② 改判** | 判据与现实现**互相矛盾**，照原判据写必红或写不出来 | **不得**在 ③ 段自定，须回 ② 重审 |
| **D 行为已覆盖但缺 ID 块** | 同行为已在其他测试文件有断言（带 `path:line`），只差没挂 S4-TC 的 ID | 可补薄壳块，或经 ② 同意并档 |

## 二、已落 12 块（对照）

`A07 / A08 / C06 / D01 / D02 / F10 / H01 / H03 / I04 / J02 / J04 / K01`（均在 `tools/docgen/test/card-render.test.mjs`）。

## 三、缺失 49 条逐条分类

| ID | 类型 | 场景（摘自附录 A） | 分类 | 证据 / 备注 |
|---|---|---|---|---|
| S4-TC-A01 | 正 | 15 卡 7 段齐 + 必渲染字段在位 | A | 段/字段单源仍在 `card-model/vocab/card-must-fields.mjs:4-7`，`renderCard` 逐段填充 |
| S4-TC-A02 | 负 | `Card` 12 键逐键删除被拒 | **C** | 矛盾：`cardPipeline.mjs:80-88` 对 `seat/name/description/tools` **派生覆盖**，删这四键会被自动补回、不报错；判据「12 键逐键被拒」对 4 键写不出来 |
| S4-TC-A03 | 边界 | 段名 / 段序逐项相等，三变异各红 | A | 段名单源 `card-must-fields.mjs:4`；模板 `templates/agent-card.md.tpl:9-33` |
| S4-TC-A04 | 正 | A3–A7 结构项全绿 | A | `checkStruct`（`tools/execution-matrix/check-agent.mjs`）可直接跑 15 卡 |
| S4-TC-A05 | 负 | A3–A7 判别力（四变异各红一码） | A | 同上；构造面需改渲染文本 |
| S4-TC-A06 | 边界 | `rationale` 只在 README | A | `renderCard.mjs` 不读 rationale；`renderReadme.mjs:22` 渲染它 |
| S4-TC-B01 | 正 | 三投影对同一字段逐字一致 | A | `renderSeat()` 返回 card + readme；`dump` 走同一 `buildCards` |
| S4-TC-B02 | 正 | 改数据 1 处 → README / dump 跟随 | A | `renderSeat`/`buildCards` 共享 `agentData` 输入 |
| S4-TC-B03 | 正 | 15 份 README + index 15 行 | A | 现状 `docs/agents/` 16 份（15 席 + index） |
| S4-TC-B04 | 边界 | index 表头五列齐 | A | `renderReadme.mjs:41` |
| S4-TC-B05 | 负 | `overrides[]` 每条带 reason | A | `cardPipeline.mjs:73-79` 取 own.reason |
| S4-TC-B06 | 边界 | 覆盖表行数 = overrides 条数 | A | `renderReadme.mjs:9-12` |
| S4-TC-B07 | 边界 | dump stdout-only、不调 `writeAll` | A | `tools/docgen/cli.mjs:214-221` 只 console.log |
| S4-TC-B08 | 负 | reason 取自 own；无 reason 拒绝渲染 | A | `merge.mjs` + `cardPipeline.mjs:73-79` |
| S4-TC-C01 | 正 | `description` = `trigger.when` 直出 | A | `cardPipeline.mjs:57-62` |
| S4-TC-C02 | 边界 | `notWhen.text` 两形态 | A | 同上（有/无 notWhen） |
| S4-TC-C03 | 正 | 非议会席「议长 / 主持人」0 命中 | A | 2 席名单 `cardPipeline.mjs:25` |
| S4-TC-C04 | 负 | 非议会席数据塞「主持人」→ 红 | A | `validateCardModel` 的 `ProceduralWordOutsideParliament` |
| S4-TC-C05 | 负 | 议会席混用两词必红 | A | `MixedTermInCard`（`enums.mjs:81`） |
| S4-TC-D03 | 负 | 输出格式残留指针 → 卡面红 | A | `PointerToElsewhere` |
| S4-TC-D04 | 负 | 声明句式残留 → 探针红 | A | `PROSE_PROBES.declaration` |
| S4-TC-D05 | 边界 | 不复制进席数据（同 kind 逐字相等） | A | `outputFormats` 按 kind 共享（`renderCard.mjs:47-54`） |
| S4-TC-E01 | 正 | 共享判据 id 源码出现 1 次 | A | `shared-actions.mjs` 唯一住处 |
| S4-TC-E02 | 正 | 带 reason 的覆盖合法且记账 | A | `mergeActions` + 覆盖表 |
| S4-TC-E03 | 负 | 无 reason / 零差异两码 | A | `OverrideWithoutReason` / `PointlessOverride` |
| S4-TC-E04 | 负 | 绕共享层 → `DuplicateStatement` | A | `merge.mjs` |
| S4-TC-E05 | 边界 | `use` 白名单 | A | `SHARED_USE`（`shared-actions.mjs:88-104`） |
| S4-TC-F01 | 正 | `generate` 只比不写；15 卡逐字节相等 | A | `cmdGenerate` 无 `--apply` 只比（`tools/docgen/cli.mjs:46-104`） |
| S4-TC-F02 | 负 | 单席原子 + 收口零写盘 | A | `renderSeat` / `renderAll` + `writeAll` |
| S4-TC-F03 | 负 | 改卡面 1 字节 → `gate` 红（防回退） | **D** | 已覆盖：`evidence-reader.test.mjs:126-142`（reviewer-qa）与 `:219-227`（reviewer-ai）追加 1 字节 → `Mismatch` |
| S4-TC-F04 | 负 | 改 README / 缺 README → 红；比对面 31 | A | `tools/docgen/cli.mjs:150-171`；「缺 README → DanglingBaselineEntry」「比对面 = 2×席数+1」无他处覆盖 |
| S4-TC-F05 | 负 | 删 state 一席 → 红；**中期「未迁移席却有 README」→ 红** | **B** | 后半前提已废：15 席全迁（`state.json` 全 `replaced`、`docs/agents` 16 份）；**前半（删 state 一席必红）仍有效** |
| S4-TC-F06 | 边界 | `state` 键集双向相等 + 全 `replaced` | A | `tools/docgen/state.json` 现状可断 |
| S4-TC-F07 | 正 | 豁免行在输出中 + 注入 `blockers ≥ 1` | A | `card-exempt.mjs` 的 `EXPIRY_LANDED`（已置 true）+ `disposeCardFindings` |
| S4-TC-F08 | 正 | 旧模板退场：两 `.tpl` 不存在 + 代码面 0 | A | 两个 `.tpl` 已删；`Select-String` 复扫现为 0 |
| S4-TC-F09 | 负 | 旧模板探针判别力（注入 → 命中 ≥ 1） | A | 扫描面 = `tools/docgen/**/*.mjs`，不含 `agents/` |
| S4-TC-G01 | 正 | 15 卡零 errors + 码表 36 + subject 形态 | A | `validateCardModel` + `CARD_MODEL_CODES`（36 键）；码数已由 F10 断 |
| S4-TC-G02 | 正 | 三类探针 0 命中 | A | `PROSE_PROBES`（`card-must-fields.mjs:11-15`） |
| S4-TC-G03 | 边界 | 改共享层 1 处 → 席数 = `use` 引用数 | A | `SHARED_USE` 全席全量（15/15） |
| S4-TC-G04 | 边界 | 散文进 rationale 合法、进 duty 必红 | A | `validateCardModel` 的扫描面 |
| S4-TC-G05 | 正 | must 判 criterion + landing；never 只判 objects + criterion | A | V-7 扫描面 = `card-must-fields.mjs` |
| S4-TC-G06 | 负 | P-B 负例：删 landing / 置空 criterion | A | `UnboundLanding` / `MissingCriterionImpl` |
| S4-TC-G07 | 负 | 三类反例各命中本类 + 指针词守卫 | A | `PROSE_PROBES` 三类 + `pointerHit` 同形判定 |
| S4-TC-H02 | 正 | 全集口径 = 席集（派生不写死 15） | A | `renderAll` 用 `agentData.length` |
| S4-TC-I01 | 正 | D6 三条证据逐条可核 | A | `docs/after/20261029204752-…open-decisions.md` 的 O-12 + `registered-ids.mjs` 未切换 |
| S4-TC-I02 | 负 | 常量值不变 + HEAD 无 diff | A | `git diff --quiet HEAD -- tools/observation-check/registered-ids.mjs` 可判 |
| S4-TC-I03 | 正 | `registeredIdsOf([本席 card])` = checkItems 并集 | A | `validateCardModel.mjs:65-73` |
| S4-TC-J01 | 边界 | 幂等 + 无时间戳 / 绝对路径 + 无 CR/BOM | A | 渲染纯函数；部分幂等行为在 `evidence-reader.test.mjs:25` / `tool-tiers.test.mjs:559-567`，但「无时间戳 / 无绝对路径 / 无 CR/BOM」无他处断言 |
| S4-TC-J03 | 正 | `docs/agents/**` 不触发 `UnregisteredHandwritten` | A | `tools/docgen/cli.mjs:172-183` 只扫 `rules/` 与 `agents/` |

**合计**：A **46** / B **1**（F05）/ C **1**（A02）/ D **1**（F03）。

## 四、需要回 ② 改判的清单

1. **S4-TC-A02**：判据「12 键逐键删除被拒」与实现矛盾——`seat` / `name` / `description` / `tools` 四键由 `seatEntry` 派生填充，删除会被自动补回。可选两条：① 判据改为「8 个非派生键逐键删除被拒 + 4 个派生键删后仍由派生值恢复」；② 若坚持 12 键全拒，须改 `buildOne` 行为（属实现改判，代价更大）。**建议 ①**，只改 testcase 措辞，不动实现。
2. **S4-TC-F05**：只保留前半「删 `state` 一席 → `gate` 红」；后半「中期未迁移席有 README → 红」的前提（存在未迁移席）已随 15 席全迁消失。**建议**在 testcase 标注「后半：2026-10-31 收口后不可构造，历史保留」。

## 五、建议先补的 10 条（风险最低、直接可写）

`F08`（旧模板 0 残留，可直接复跑）→ `F06`（state 全集）→ `B03`（README 16 份）→ `A01`（7 段 + 字段）→ `G01`（零 errors + 36 码）→ `C03`（非议会席两词 0）→ `F07`（`EXPIRY_LANDED` + 注入）→ `H02`（全集 = 席集）→ `I02`（常量无 diff）→ `I03`（`registeredIdsOf` 并集）。

## 六、结论

- 缺口是 **49 条**（不是 plan 的 17 条）；其中 **46 条可直接补**、**1 条已被他处覆盖**（F03）、**1 条只剩半条有效**（F05）、**1 条与实现矛盾须回 ②**（A02）。
- ③ 段出口判据是「施工完成 + 收口门禁绿」，**不要求 61 条全部执行**（后者属 ④ 段）；本盘点结果交 ④ 段缺口表，A02/F05 两条回 ② 处理后再补。

## 增补（2026-10-31 ④ 段复核，不改动上文任何结论）

> 上文是 ③ 段盘点时点的原始记录（原文一字未改）。④ 段实测后对下列分类**有新结论**，以 ④ 的裁决件为准：

| 原分类 | ④ 段实测结论 | 落点 |
|---|---|---|
| `S4-TC-A02`「C 需回 ②」 | 回 ② 改判后**可执行**：数据层逐键删除 → **6 非结构键被拒 + 6 结构键由派生 / 合并值恢复**（原文的「8 + 4」推断经实测修正） | testcase A02 日期注；`quality-4.md` 的 D-1 |
| `S4-TC-F05`「B 前提已废」 | **前提未废**：改构造值 `registered` → `suspended` 后仍必红（原写法是被 `StateFileInvalid` 先拦） | testcase F05 日期注；`quality-4.md` 的 D-4 |
| `S4-TC-F03`「D 他处覆盖」 | 已落薄壳块（改 1 字节 → `gate` exit 1 且点名），61 块全执行 | `card-render.test.mjs` 的 `S4-TC-F03` 块 |
| `S4-TC-E01`「A 可执行」 | 需改判计数口径（裸子串 → `criterion:` 赋值）；已登记 `I16` | testcase E01 日期注 |
| `S4-TC-K01`「A 可执行」 | 需改判计数口径（段表 8 → 9 行，含 front matter）；已登记 `I18` | testcase K01 日期注 |

④ 段收口实测：`card-render.test.mjs` = **61 块 / `# pass 61 / # fail 0`**，与 testcase 总表 61 行双向差集空。

