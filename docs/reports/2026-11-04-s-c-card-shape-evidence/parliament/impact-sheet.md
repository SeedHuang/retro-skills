# 当次改判影响清单：S-C 卡面形状（R8 用）

> 判据来源：`rules/dev-workflow-mainline.md` 的 R8 ｜ 扫描器：`node scripts/scope-sweep.mjs --check`
> 本文件是 **S-C 批次自己的当次清单**（G7：此前 R8 的绿靠 S-A 旧批次清单的 mtime，属取证链缺陷）。
> 核验时优先显式传入（不依赖 mtime）：
> `node scripts/scope-sweep.mjs --check --impact .session/reviews/2026-11-04-0840-sc-card-shape-spec-parliament/impact-sheet.md`
> **本文件必须在每次改完 scope 内文件后 touch 一次**（同 `gate-record.md` 落行后的要求）。

## 1 本批真正改到的判据级口径（3 条）

| # | 口径 | 旧说法 / 旧载体 | 新说法 / 新载体 | 出处 |
|---|---|---|---|---|
| K1 | **三态取值的卡面载体** | 「一定会」段末 5 行常量：`card-contract.mjs` 的 `TRISTATE`（1 行解释 + `hit`/`miss`/`na`/`reason`），逐行渲染进 15 卡 | `card-contract.mjs` 的 `VERDICT_HINT`（由 `VERDICTS` 派生），只在「本席清单」**表头一行**出现；5 行与 `TRISTATE` 全删 | S-C spec §11.1 R1–R3 / PRD D16 ③ |
| K2 | **`trigger.kind` 的落地归属** | S-A spec §10.1 R8 写「本段只留字段位」，实测未落（`trigger` 键集 = `when,route`） | 由 S-C 补落（`triggerTable[<seat>].kind`）+ 四值校验（`check-trigger-kind.mjs`） | S-C spec §11.1 R9 / PRD Q5 / V10 |
| K3 | **V11 ① 的 `returns` 判定对象** | 全 `tools/docgen` 的 `.mjs`/`.json` 字面扫描（3 处命中 = S-A 负例夹具名） | 判据一字不改；改夹具键名（`returns` → `ghostField`），使计数归 0 | S-C spec §11.1 R11 / PRD D16 ④ / V11 ① |

## 2 改判后受影响文件与处置（逐文件）

| 文件 | 命中口径 | 处置 |
|---|---|---|
| `tools/docgen/card-model/vocab/card-contract.mjs` | K1 | 改：删 `TRISTATE`，加 `VERDICT_HINT` |
| `tools/docgen/components/renderCard.mjs` | K1 | 改：删 `tristate()` 与槽填充；`checkTable()` 表头改派生串 |
| `tools/docgen/components/cardFaceIds.mjs` | K1 | 改：删层①（`TRISTATE` 逐行豁免） |
| `tools/docgen/templates/agent-card.md.tpl` | K1 | 改：删 `{{TRISTATE}}` |
| `tools/docgen/test/s2-card-rewrite.test.mjs` | K1 | 改：`A01` / `A04` / `A05` / `A10` / `B08` / `D04` / `D05` / `E05`（`NEW_TPLS`） |
| `tools/docgen/test/sdet-render.test.mjs` | K1 | 改：`:21` 逐字表头 → 派生串 |
| `tools/docgen/test/sa-data-layer.test.mjs` | K3 | 改：2 处夹具键名 |
| `docs/superpowers/specs/2026-11-03-s-a-data-layer-design-testcase.md` | K3 | 改：`TC-015` 的用例文案（夹具名） |
| `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md` | K2 | 就地加注：§10.1 R8 补「字段位实际由 S-C 落」，**不改结论** |
| `docs/prd/20261102212627-card-data-contract-and-proof/index.md` | K2 / K3 | **不改**（D/Q/V 正文是唯一真相；`:119` 与 `:137` 的旧说法已由 `I33` 登记） |

## 3 33 条口径逐条处置（本批**未触碰**的 30 条 + 改到的 3 条）

> 判据：`scope-sweep` 要求当次清单里**每个口径 ID 都出现**（否则报「清单缺口径」）。下表逐条声明处置，未触碰=不改该口径的旧说法载体。

| ID | 口径标题 | 本批处置 |
|---|---|---|
| I1 | 卡面文字不要求一致 | 未触碰（S-C 不改「逐字节」口径；`gate` 仍判 disk==render） |
| I2 | 路径三数（数组 21 / 点名 22 / 卡面 23） | 未触碰 |
| I3 | `expanded` 槽序 = 表行序 | 未触碰 |
| I4 | 档位四档（含 `command`） | 未触碰（`patternRegistry.mjs` 不改） |
| I5 | `network.verbs` 恰三项 | 未触碰 |
| I6 | `SEATS` 契约（display / clause / escalationWriter） | 未触碰 |
| I7 | 错误码后缀与读取失败口径 | 未触碰（S-C 不新增错误码；36 码零新增） |
| I9 | 未登记席 / 保留键 | 未触碰（`__default__` / `SEAT_NAMES` 无改动） |
| I10 | 纯结构行四类 | 未触碰（计数 0，基线同值） |
| I11 | 验收命令写法 | 未触碰（S-C 的判据命令沿用「仓根 + 带引号 glob」写法） |
| I12 | 计划门验收命令写法 | 未触碰（本段 plan 会照 `--stage` 口径回避结构性 exit 2） |
| I13 | `preScript` 不再是通过条件 | 未触碰 |
| I14 | 用例落盘载体 | 未触碰（testcase 用 `### SC-TC-NN` 形态，落在两种合法载体之一） |
| I15 | S4-TC-A02 的 12 键逐键删除 | 未触碰 |
| I16 | S4-TC-E01 的判据 id 计数 | 未触碰 |
| I17 | S4-TC-F04 的「缺一份 README」 | 未触碰 |
| I18 | S4-TC-K01 的段表行数 | 未触碰 |
| I19 | S4-TC-I02 的零接触 | 未触碰 |
| I20 | A3 必答清单存在 | 未触碰（S-C 仍留「一定会」bullet 形态，A3 判据不变） |
| I21 | A1 契约枚举扫描面 | 未触碰（S-C 不扩 A1 扫描面；`VERDICT_HINT` 在 `card-contract.mjs` 内） |
| I22 | rule-inspector 计数口径 | 未触碰 |
| I23 | ⑨ 判据可观察的判定口径（`evaluateText`） | 未触碰 |
| I24 | `subjectiveHit` 判定口径 | 未触碰 |
| I25 | 8 条 predicates 旧 label 合集 | 未触碰（`predicates.mjs` 不改；新 `duty.action` 文案不得回填这 8 条旧 label） |
| I26 | S6-TC-G01 卡面差异记账面 | 未触碰 |
| I27 | S5-TC-B07 变更段重判 | 未触碰（S-C 的 `replace` 走 `--rejudge`，判者独立） |
| I28 | 计数探针扫描面 | 未触碰 |
| I29 | S2 本批判据的比对区间 | 未触碰（S-C 不改 S2 的 `base..S2 落地提交` 区间） |
| I30 | `no-fake-problem` 的 observable 旧写法 | 未触碰 |
| I31 | S-A P0-1「12 键恰等」 | 未触碰（12 键断言位置不变） |
| I32 | S-A P1-3 `@` 混用规则 | 未触碰 |
| I33 | S-A P1-6「V10（`kind` 四值）」旧说法 | 未触碰（PRD `:119` / `:137` 不改；S-A spec 只**就地加注**，不引入该旧说法） |
| **K1** | 三态载体（本批新增口径，对应 `I21` 家族的卡面契约面） | **改**（见 §2） |
| **K2** | `trigger.kind` 归属（沿用 `I33` 的旧说法登记） | **改**（见 §2） |
| **K3** | `returns` 判定对象（沿用 `I25`/`I31` 同族的「字段名即判据」面） | **改**（见 §2） |

## 4 命中文件逐文件处置（当前盘面 18 个命中文件，全部「本批不改」）

| 文件（basename） | 处置 |
|---|---|
| `2026-10-25-docgen-policy-single-source-design.md` | 不改（历史已签件） |
| `2026-10-25-docgen-policy-single-source-design-testcase.md` | 不改（历史已签件） |
| `patternRegistry.mjs` | 不改（`policy` 面 S6 已签） |
| `2026-10-27-s2-observation-check.md` | 不改（历史 plan） |
| `2026-10-27-s3-gate-wiring.md` | 不改（历史 handoff） |
| `stage-2b-plan-gate.md` | 不改（规则段文档） |
| `dev-workflow-checks.mjs` | 不改（测试支撑） |
| `2026-10-29-agent-card-s4-render-design-testcase.md` | 不改（历史已签件） |
| `2026-10-30-agent-card-s4-render.md` | 不改（历史 plan） |
| `2026-10-31-agent-card-s4-quality.md` | 不改（历史 handoff） |
| `criteria.md` | 不改（执行力度矩阵） |
| `2026-11-01-s2-card-rewrite-design.md` | 不改（已签 spec） |
| `score.mjs` | 不改（rule-inspector） |
| `subjective-terms.mjs` | 不改（主观词表） |
| `predicates.mjs` | 不改（判据词表） |
| `policy-pure-source.test.mjs` | 不改（S6 测试） |
| `tool-tiers.test.mjs` | 不改（S5 测试） |
| `dev-workflow-counts.test.mjs` | 不改（计数测试） |

## 5 回扫结论

- 本批不新增任何口径 ID 的命中数（K1–K3 的词面不在 `keywords.json` 里）→ `sweep ok` 的前提是**本清单覆盖 33 个 ID + 18 个命中文件**（已覆盖）。
- 判绿口径 = `node scripts/scope-sweep.mjs --check` exit 0（`sweep ok`）。
