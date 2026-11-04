# S-D 改判影响清单（impact-sheet）

> 状态：**执行中（2026-11-04 建，逐任务追加）**
> 用途：`node scripts/scope-sweep.mjs --check` 的判红第 ③ 条（口径 ID / 命中文件必须在当次清单内）；R8 的 mtime 判据（本文件必须不早于被扫 scope 文件）。
> 落点说明：本文件在 `.session/reviews/2026-11-04-s-d/`（过程账，不进 git）；S-D 收口时整单迁 `docs/reports/2026-11-04-s-d-evidence/`。
> 本批只有 **3 处判据级改动**（见 §2），其余任务不触达改判词表 scope。

## 1 口径全集（33 个 ID，无一遗漏）

| ID | 标题（摘自 `tools/scope-sweep/keywords.json`） | 本批处置 |
|---|---|---|
| I1 | 卡面文字不要求一致 | 不触及（scope 内 0 改动） |
| I2 | 路径三数（数组 21 / 点名 22 / 卡面 23） | 不触及 |
| I3 | expanded 槽序 = 表行序 | 不触及 |
| I4 | 档位四档（含 command） | 不触及 |
| I5 | network.verbs 恰三项 | 不触及 |
| I6 | SEATS 契约（display / clause / escalationWriter） | 不触及 |
| I7 | 错误码后缀与读取失败口径 | 不触及 |
| I9 | 未登记席 / 保留键 | 不触及 |
| I10 | 纯结构行四类（含渲染器固定骨架行） | 不触及（基线命中 0） |
| I11 | 验收命令写法（仓根 + 带引号 glob，禁裸 glob 与无 cwd 的 cd 写法） | **本批须守**：`gate-record.md` 在 scope 内，新落门行严禁出现 `node --test *.test.mjs` 形态（命中数必须 ≤ 基线 7） |
| I12 | 计划门验收命令写法（`coverage` 必带 `--stage`） | 不触及（scope 不含本批文件） |
| I13 | `preScript` 不再是通过条件（字段保留、条件撤除） | 不触及 |
| I14 | 用例落盘载体 | 不触及（基线命中 0） |
| I15 | S4-TC-A02 的「12 键逐键删除全被拒」 | 不触及 |
| I16 | S4-TC-E01 的「判据 id 裸子串计数 = 1」 | 不触及 |
| I17 | S4-TC-F04 的「缺一份 README → exit 1」 | 不触及 |
| I18 | S4-TC-K01 的「PRD §3.7 段表 = 8 行」 | 不触及 |
| I19 | S4-TC-I02 的「零接触 = `git diff --quiet HEAD` 无差异」 | 不触及 |
| I20 | A3 必答清单存在 | 不触及 |
| I21 | A1 契约枚举扫描面 | 不触及 |
| I22 | 计数口径：检查点总数 24→25、执行力度 8→9 项 | 不触及（基线命中 0） |
| I23 | ⑨ 判据可观察的判定口径 | 不触及 |
| I24 | subjectiveHit 判定口径 | 不触及 |
| I25 | 8 条 predicates 旧 label 合集 | 不触及 |
| I26 | S6-TC-G01 卡面差异记账面 | 不触及 |
| I27 | S5-TC-B07 变更段重判 | 不触及 |
| I28 | 计数探针扫描面 | 不触及 |
| I29 | S2 本批判据的比对区间（旧 = `base..HEAD` / 现行 blob；S3 起收窄为 `base..S2 落地提交`） | **本批同族改判**：T1 把 `SC-TC-62` 的比对区间由「`$BASE`..工作树末尾」收窄为「`$BASE`..`$BASE_HEAD`（S-C 收口提交）」。I29 的词面 `base..HEAD` 与 scope（仅 `s2-card-rewrite.test.mjs`）均不受影响 —— 本批改在 `sc-card-shape.test.mjs`，且**不写** `base..HEAD` 字样 → 命中数不变 |
| I30 | S3 遗留 P2-1：`no-fake-problem` 的 observable 旧写法 | 不触及（基线命中 0） |
| I31 | S-A 计划门 P0-1：「12 键恰等」挂 loader 的旧口径 | 不触及 |
| I32 | S-A 计划门 P1-3：`@` 混用规则的旧写法 | 不触及 |
| I33 | S-A 计划门 P1-6：PRD §8 S-A 验收列旧写 V10 | 不触及（基线命中 0） |

## 2 本批三处判据级改动的处置

| # | 改动 | 载体 | R8 处置 | 回扫结论 |
|---|---|---|---|---|
| 1 | `SC-TC-62` 比对区间：开区间（到工作树末尾）→ 闭区间（`$BASE..$BASE_HEAD`） | `tools/docgen/test/sc-card-shape.test.mjs` | **改**（唯一实现点） | 同族：I29 已登记同款口径（S3 把 S2 的 `base..HEAD` 收窄为 `base..落地提交`）→ 本批是同一处置的第二次应用，不新增词面。上游 / 同族文档**无需改**：`⑤@S-C` / `③@S-C` 两行记的是当时实跑值（历史证据，不改）；`docs/after/20261104101304-…md` §5 的 G6 行按本批闭合移入 §5.1 |
| 2 | G6：`SC-TC-45` / `SC-TC-46` 由 `if (!SHAPE) return` 改 `t.skip()`（默认档由「计 pass」改「计 skipped」） | `tools/docgen/test/sc-card-shape.test.mjs` + `scripts/test-skip-allowlist.mjs` + S3 spec 两处计数 | **改** | **计数口径同批回扫**：`docs/superpowers/specs/2026-10-27-s3-gate-wiring-design.md` 的 `:51`（§11.1 R9 行）与 `:132`（§11.2 末段）两处「现 2 条」→ 实况值（改前 5、改后 7）。该 spec 自写「随批次同改该文件与本节」= 预授权同改 |
| 3 | `STRUCT_REPLACED` 增员 2 条（`renderAgent.mjs` / `sharedBlocks.mjs`） | `skills/managing-lessons-store/scripts/lessons.test.mjs` | **改** | 该表自带约束「新增条目要在当次计划的执行记录里点名（防静默增员）」→ 本 plan §7 点名。上游：两文件头部的停用横幅属历史说明，文件删除后随之消失（整引删除，不改结论）；`docs/prd/20261026205821-agent-card-contract.md` 的「559 行」是当时快照 → 标历史保留 |
| 4 | **豁免判定前移**（T4 施工期新增）：`STRUCT_REPLACED` 的命中判定由「解析成功后」前移到「解析前」 | 同上 | **改** | 原实现表达不了「整文件删除」（删除后解析先落 `missing`，实测 6 处红）。前移后语义 = 「该文件已不再按原样存在」。**同族回扫**：`tools/docgen/components/agentData.mjs`（唯一既有条目）在新旧两种判定下都仍命中 → 行为不变；历史件里对两件的行号引用**逐条不改**（改写历史件违反 `docs-convention` 硬约束 4） |
| 5 | **`S3-TC-K07` 比对区间**由开区间改闭区间（`$S3_BASE..$S3_HEAD`，`S3_HEAD` 冻结在 `90083cd`） | `tools/docgen/test/s3-predicates.test.mjs` | **改** | 与 #1 同一根因（批内判据挂开区间）；实测 `b5e11aa..90083cd` 内历史类改/删 = 0 行 → 冻结后恒绿。同族：I29 已登记同款处置（`base..落地提交`），不新增词面 |
| 6 | **`S4-TC-H03` 的「改动行数」口径**：只累加 numstat 新增列 → 增 + 删两列 | `tools/docgen/test/card-render.test.mjs` | **改** | 原口径把「最近一次触及 `agents/` 或 `tools/docgen/` 的提交」隐性约束成「不能是删除型」——T4 的纯删除提交（0 增 / 77 删）当场判 0。判据原文本就写「改动行数 > 0」，取增+删更贴题；S4 已签 testcase 正文**不改**，按 S-B / S-C 的「签后增量登记（实施按判据方向修正）」先例登记到 `③@S-D` 行 |

## 3 命中文件全集（22 个 basename，无一遗漏）

| 文件 | 本批处置 |
|---|---|
| `2026-10-25-docgen-policy-single-source-design.md` | 不触及 |
| `2026-10-25-docgen-policy-single-source-design-testcase.md` | 不触及 |
| `2026-10-27-s2-observation-check.md` | 不触及 |
| `2026-10-27-s3-gate-wiring.md` | 不触及 |
| `2026-10-29-agent-card-s4-render-design-testcase.md` | 不触及 |
| `2026-10-30-agent-card-s4-render.md` | 不触及 |
| `2026-10-31-agent-card-s4-quality.md` | 不触及 |
| `2026-11-01-s2-card-rewrite-design.md` | 不触及 |
| `2026-11-03-s-a-data-layer-design.md` | 不触及 |
| `criteria.md` | 不触及 |
| `dev-workflow-checks.mjs` | 不触及 |
| `dev-workflow-counts.test.mjs` | 不触及 |
| `gate-record.md` | **本批多次改**（落 6 行门行 + ③ 段改 `⑤@S-C` 残余 ④ 的路径字符串）→ 每次改后 touch 本文件 |
| `index.md` | 不触及 |
| `patternRegistry.mjs` | 不触及 |
| `policy-pure-source.test.mjs` | 不触及 |
| `predicates.mjs` | 不触及 |
| `s2-card-rewrite.test.mjs` | 不触及（I29 scope 唯一条目，本批零改动） |
| `score.mjs` | 不触及 |
| `stage-2b-plan-gate.md` | 不触及 |
| `subjective-terms.mjs` | 不触及 |
| `tool-tiers.test.mjs` | 不触及 |

## 4 touch 记录（每次改 scope 内文件后追加一行，取 mtime 判红用）

| 时点 | 因何 touch | `sweep --check` 结果 |
|---|---|---|
| 2026-11-04 建单 | 落 `①@S-D` / `②@S-D` 两行门行前建单 | 见下行 |
| 2026-11-04 建单后 | 已落 `①@S-D` / `②@S-D` 两行 → 本文件随之 touch | `sweep ok` |
| 2026-11-04 计划门 | 已落 `②→③@S-D` 一行 → 本文件再 touch | `sweep ok` |
| 2026-11-04 T2 | 改 S3 spec 两处计数（`:51` / `:132`）→ 本文件再 touch（G12 mtime） | `sweep ok` |
| 2026-11-04 T2 修 | ②@S-D 行内 `skills/` 前缀改写（撞 skill-inspector 自引用守卫）→ 本文件再 touch | `sweep ok` |
| 2026-11-04 T3 | 改 `⑤@S-C` 行残余 ④ 路径串 + 迁 11 件 → 本文件再 touch | `sweep ok` |
| 2026-11-04 T4 | 删死代码 + 豁免前移 + `S3-TC-K07` 闭区间 → 本文件再 touch | 待跑 |
| 2026-11-04 ③ 段落行 | 落 `③@S-D` 一行 → 本文件 touch | 待跑 |
| 2026-11-04 ④ 段落行 | 落 `④@S-D` 一行 + plan §6 补两行 → 本文件 touch | 待跑 |
| 2026-11-04 ⑤ 前修 P3 | 补 ④ 行收尾竖线 + plan §7 现值注 → 本文件 touch | 待跑 |
| 2026-11-04 ⑤ 终签 | 落 `⑤@S-D` 行（用户终签）→ 本文件 touch | 待跑 |
| 2026-11-04 ⑤ 行修 | ⑤ 行内 `skills/` 前缀改写后 再 touch | 待跑 |
