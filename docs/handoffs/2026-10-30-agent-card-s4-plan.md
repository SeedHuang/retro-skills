# Session 交接：retro-skills → agent-card S4 渲染层（②→③ 计划门 + ③ 施工）（2026-10-30）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-30 22:06（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `3c6f67a`（`docs: 更新 gate-record.md 新增 S4-render 段记录`）；工作树：**clean**（`git status --porcelain` 空串，22:05 实跑） |
| 验证基线 | 2026-10-30 22:05–22:10 **本次实跑**：`npm run check` → `# tests 1097` / `# pass 1095` / `# fail 0` / `# skipped 2`、`baseline 37/37`、`0 findings`、`④ markdown 检查通过（**318 个文件 / 1416 张表**；22:05 时为 317 / 1415，+1 文件 / +1 表 = 本交接文档自身）、`⑤ .session 结构检查通过`、`⑥ 观察产物门禁：扫描 2 个子目录 / 归档 1 对 / 过程 0 对 / findings 0`、末行 `check 全部通过`（exit 0）；`node scripts/check-gate-record.mjs` → `rows 33 bad 0` + `gate-record ok`（exit 0）；`node scripts/scope-sweep.mjs --check` → `sweep ok（命中未超基线、清单齐、scope 齐）`（exit 0）；`node scripts/doc-name.mjs --check docs` → `命名检查通过（docs）`；spec **245 行 / `6AB157AC…9CE706`**、testcase **2246 行 / 61 条 / `7D8FD7BF…3A17A8A`**（`Get-FileHash` 实算） |
| 继任自 | `docs/handoffs/2026-10-29-agent-card-s4-spec.md` |
| 状态 | 可直开工（3 个开放问题，**其中 1 条为「开工第一问」**；均不阻断起草，但第 1 问影响 plan 结构） |

## 项目定位

`d:\Seed\retro-skills` —— AI 协作工作流的规则 / 技能 / 机械判据仓库（五段主干：PRD → spec+testcase → 计划门 → 实现 → 质量 → 交付；`npm run check` 是唯一总门禁）。

## 现状

- **已完成：agent-card S4 渲染层 ② 段收口**——spec + testcase 一件交付，议会 #2 两轮（第 1 轮 4 席 20 张必修全闭合、第 2 轮审计「有条件通过」且 2 条件已闭合），`②@S4-render` 门行已签（`skills/dev-workflow/references/gate-record.md:42`）。
- **本段产物**：spec `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md`（245 行 / `6AB157ACE3FA509262FC31D37D6BD9C97DAF0EA1AAB82FA5B68380BA509CE706`）+ testcase 同目录 `2026-10-29-agent-card-s4-render-design-testcase.md`（2246 行 / **61 条** = 正 23 / 负 20 / 边界 18 / `7D8FD7BFCDE92E819B0885E7E010F7A9CAC0135C3DAC918AD8EC0E0923A17A8A`）。
- **验证证据**：见元信息表『验证基线』（单源，此处不重复）。
- **提交状态**：已 commit——`3c6f67a` 含 spec（245 行）+ testcase（2246 行）+ `gate-record.md` 的 `②@S4-render` 行（`git show --stat 3c6f67a` 实核，3 files / 2492 insertions）。
- **工作树异常**：无。
- **能力边界（写 plan 时必须装进去）**：本段**尚未施工**——`tools/docgen/` 里没有任何 S4 代码；`docs/agents/` 目录不存在；`state.json` 15 席已全 `replaced`（旧卡已全由旧模板生成）；`EXPIRY_LANDED` 仍 `false`。

## 过程记录

- 议会账本：`.session/reviews/2026-10-30-000104-agent-card-s4-render-spec/`（**先读** `progress.md` 尾部「收口实测」与 `delivery-audit.md` 的结论行；另有 `submission.md` / `problems.md` / `cards.md` / `defense-record.md` / `round-check.md` / `impact-sheet.md`）
- S1 段历史账（只作先例，勿重读全量）：`.session/reviews/2026-10-29-1813-agent-card-s1-plan-gate/plan-gate.md`（计划门三轮核对长什么样）、`.session/reviews/2026-10-29-2100-agent-card-s1-quality/quality-4.md`（④ 段结论表形态）
- 历史交接词：`docs/handoffs/2026-10-28-s4-plan-gate.md` → `docs/handoffs/2026-10-29-agent-card-s1-spec.md` → `docs/handoffs/2026-10-29-agent-card-s1-plan-gate.md` → `docs/handoffs/2026-10-29-agent-card-s1-impl.md` → `docs/handoffs/2026-10-29-agent-card-s4-spec.md` → **本文件**

## 本次任务

写 agent-card **S4 渲染层的 plan**（覆盖 F-09～F-12、F-23），过 **②→③ 计划门**，再进 **③ 施工**（含 15 席内容迁移与全席重生成）；流程：**写 plan → ②→③ 计划门（审计手工核对，不设议会）→ ③ 施工 → ④ 质量 → ⑤ 交付**；起点：**写 plan**（`docs/superpowers/plans/2026-10-30-agent-card-s4-render.md`）。

## 范围依据

- **要读（按顺序，精确到节）**：
  - spec `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md`：§3 `:33-72`（落点与 4 个 `vocab/` 导出面 + 写盘授权链）、§4 `:74-106`（`Card` **12 键**、`renderSeat` 单席原子、`env` 11 键、拒绝语义）、§5 `:106-156`（三投影、卡面 7 段 × 必渲染字段、`PROSE_PROBES` 三类、称谓）、§6 `:157-172`（`outputFormats` 结构化）、§7 `:174-190`（写盘 ①–⑥、豁免到期、旧模板退场）、§8 `:185-194`（逐席滚动与出数门槛）、§9 `:196-207`（V-1～V-8）、§10 `:209-224`（**D1–D12**，每条差异带上游位置）
  - testcase 同目录 `-testcase.md`：§0.3（共用 helper 的符号名与调用形态）、§1 覆盖总表、**附录 A（61 行，plan 的附录 A 必须逐 ID 映射）**、§7（6 条仍开 P2 缺口，触发时机）
  - 计划门判据：`skills/dev-workflow/references/stage-2b-plan-gate.md`（三核：覆盖 / 依赖 / 映射；`profile` 与 Expected 写法）
  - 计划门脚本：`scripts/check-plan.mjs:23-45`（**子命令与必传参**：`coverage --plan --prd --stage`、`deps --plan`、`map --plan`、`size --spec --testcase --rounds`；`map` 还要求 plan 内有 `**Testcase:**` 行与「附录 A」节，附录 A 首列必须是用例 ID——见 `:347-372`）
  - 上游：PRD `docs/prd/20261026205821-agent-card-contract.md` §3.7 `:219-241`（段清单与单源）、§6 F 表 `:473-487`、§8 S4 行 `:519`、§9.2 P-A/P-B `:571-577`、C-08 `:121`、C-11 `:124`、`:293`（SUBJECTS 省略号）
  - 只消费件：S1 spec `docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design.md` §3 `:35-53` / §4 `:55-92` / §6 `:136-159` / §7 `:161-204`；S1 plan `docs/superpowers/plans/2026-10-29-agent-card-s1-card-model.md`（**8 Task 结构 + 附录 A 的写法模板**）
  - 现状链（写 plan 的 Files/Interfaces 必读）：`tools/docgen/cli.mjs`（`cmdGenerate` / `collectGate` / `cmdGate` / `draft` / `replace` / `cmdBaselineWrite` 的原子写）、`tools/docgen/components/{agentData,validateAgentData,outputFormats,patternRegistry,renderByName,renderAgent}.mjs`、`templates/agent.md.tpl` 与 `agent-handwritten.md.tpl`、`tools/docgen/state.json`、`tools/execution-matrix/check-agent.mjs`（A3–A7 与 `touchedSemanticKeys`）、`tools/observation-check/card-exempt.mjs`、`scripts/check-all.mjs`（②.5 段 `:134-152`、⑥ 段 `:406-418`）
- **勿重做（零改动或指定唯一例外）**：
  - `tools/docgen/card-model/**`（S1 已签交付；本段**只增** `vocab/` 4 个登记表 + `subjects.mjs` 的 15 席登记项，**不改任何码与判据**）— spec §2-1 / §3
  - `tools/observation-check/**`（S2/S3 已签；**唯一例外** = `card-exempt.mjs` 的 `EXPIRY_LANDED` 置 `true`）— spec §7-⑤ / §10-D7
  - `tools/docgen/policy/**`（S6 已签）— spec §2-3
  - S1 的 spec / testcase / plan / 门行（已签，原文不改）
  - `tools/execution-matrix/criteria.md` 的 **A3–A7** 判定面（逐字保留；只改 A1/A2 的锚点段 = D11）

## 开放问题

1. **【开工第一问】plan 的 Task 粒度按「块」还是「一席一 Task」？**；推断：**按块**，建议 6–8 个 Task —— T1 数据层骨架（4 个 `vocab/` + `subjects` 扩席）、T2 装配与三投影（`cardPipeline`/`renderCard`/`renderReadme`/`dump`）、T3 审计承接（`EXIT` 表 D12 + A1/A2 锚点 D11）、T4 上游文档同批（PRD 两处 + `docs-convention` 一行）、T5 试点（侦探席 + 对照稿 + `git diff --numstat` 出数）、T6 铺满 14 席（逐席一提交）、T7 收口（`renderAll` + `EXPIRY_LANDED=true` + 删旧模板 + gate 扩面 31 份 + `state` 完整性）。依据：S1 plan 是 8 Task（`docs/superpowers/plans/2026-10-29-agent-card-s1-card-model.md`）；`check-plan coverage` 按 F 计不按席计；testcase 61 条的覆盖总表按 V/F 分组，块粒度映射更自然。请用户：确认 / 纠正。
2. **D11 / D12 与「上游文档同批改」要不要拆 Task？**；推断：**拆两个**——代码侧承接（`validateAgentData.mjs` 的 `EXIT` 表 + `check-agent.mjs` 的 `touchedSemanticKeys` + `criteria.md` 的 A1/A2 行）与文档侧（PRD §3.7 表内插「输出格式」行 + `:293` 省略号 + `docs-convention` 一行）各自可独立验收；依据 = spec §10-D11/D12 与 §10-D1/D2/D5 的落点分工。请用户：确认 / 纠正。
3. **plan 落盘后是否立刻 `git add`（不 commit）留基线？**；推断：**是**——S1 的 `②→③@S1` 行曾因 plan 未跟踪导致「只改 N 处」无字节级证明（`gate-record.md:39` 的「限度自知」），`C-4` 已登记该风险。请用户：确认。

## 既定约束（不要重新讨论、不要重新选型）

- **执行顺序 S2 → S3 → S1 → S4 已定，S4 是最后一格** —— PRD `:518` / `:521`。
- **卡面 = PRD 6 段 + 第 7 段「输出格式」**（用户 2026-10-29 裁定）；7 段单源 = `tools/docgen/card-model/vocab/card-must-fields.mjs` —— spec §5.1 / §10-D1。
- **README 落点 = `docs/agents/`**（`docs/agents/README.md` + 15 席各一份；用户 2026-10-29 裁定）—— spec §3 / §10-D2；`docs-convention` 须同批补一行。
- **写盘授权链不变**：`generate` 保持「只比不写」；角色卡内容变更仍走 `draft` → 用户确认 → `replace --yes`；`docs/agents/**` 由 `generate --readme --apply` 落盘；`writeAll` 只是这三处的共用实现 —— spec §3 `:70-71`。
- **单席原子**：`renderSeat` 一次只产 1 卡 + 1 README，坏则该席零写盘；15 席全过是收口步 `renderAll()` 的语义 —— spec §7-①。
- **`Card` = S1 全量 12 键**；`name`/`description`/`tools` 由 `seatEntry` 派生填入，不另存 —— spec §4 `:77-90`。
- **`description` = `trigger.when` 直出**（不再派生「在议会评审中担任…」）—— spec §5.2 / §10-D3。
- **数据源单向**：渲染输入只来自 `agentData.mjs`（+ `triggerTable`）；`agents/*.md` 只被 gate 读来比对 —— spec §3 末行 / §9-V-6（F-23）。
- **15 卡豁免窗口到期 = 本段**：`card-exempt.mjs` 的 `EXPIRY_LANDED` 置 `true` —— PRD C-08 `:121` / spec §10-D7。
- **`registeredIds` 派生切换不在本段做**（集合不同域 / 无 `CHECK_ITEMS` 载体 / 反向 import 禁令）—— spec §10-D6；S1 §11-3 的触发器原文不改，现行口径 = D6。
- **S2 的合并副本不删**（S2 零改动 + 209 条测试；触发 = S2 被修订）—— spec §10-D9。
- **旧模板与小节散文铺满后删**（`templates/agent.md.tpl` / `agent-handwritten.md.tpl` / `renderAgent.mjs` 旧分支）—— PRD D-05 `:500` / spec §10-D8。
- **`V-13`（A/B 盲评）不在本期**，任何 S4 材料不得引用 —— `gate-record.md:13`。
- **plan 不得有 `## 新增设计决策` 节**（R4，位置型判据）。
- **R8 回扫用裸命令** `node scripts/scope-sweep.mjs --check`；若报「清单早于被扫文件」，为当批**新落**一份 `impact-sheet.md`，不得改写旧清单凑绿；**禁用** `npm run doc:sweep -- --check`（PowerShell + npm 10.9 吞 `--` 后参数、恒 exit 0）。

## 遗留裁决与留观项

- `O-4`（PRD `:293` 的 `'…'` 省略号）—— 来源：`docs/after/20261029204752-…open-decisions.md` §1；收敛时机：**本次 ③ 段与 SUBJECTS 扩席同批**（spec §10-D5）。
- `O-12`（`registeredIds` 单源切换）—— 同上 §3；**本段不做**（spec §10-D6），收敛时机改为 S2/S3 修订时。
- `O-13`（15 卡豁免窗口）—— 同上 §3；收敛时机：**本段**（`EXPIRY_LANDED=true`）。
- `O-15`（`scripts/check-plan.mjs:229` 的 B 载体正则会数 F 对位行）—— 触发 = 下次修订该脚本或 testcase 时**两侧同批**；**写本次 plan 时**：附录 A 首列只放用例 ID，不得混入 `F-09` 这类行（否则 `map` 的 cases 数会虚高）。
- `O-16`～`O-19`（`ALLOWED_OPS` 无封闭表 / `id`+`label` 混写 / `HARDCODED_COUNT` 收窄 / `mergeActions` 零差异字段面）—— 均为 spec 侧空白；S4 若触碰 `mergeActions` / `HARDCODED_COUNT` 相关渲染面，须同批带这四条看。
- testcase §7 的**缺口 10–15（P2，6 条）**—— 含 `writeAll(artifacts)` / `buildEnv(seat, cards)` / `checks[]` / `changed` 的形状与试点时序、副本计数命令；触发 = **③ 段首次构造该形状时同批写死**（plan 里应把它们挂到对应 Task 的「落地时写死」）。
- `C-1`～`C-5`（S1 议会候选，全 P2）—— 非 S4 阻断项；`C-4`（基线快照）已由本交接「开放问题 3」承接。

## 开工前先做

1. `git status --porcelain`（应空串）+ `git log --oneline -1`（应 `3c6f67a`）；复跑元信息表『验证基线』的六条命令，数值应逐项相同（`npm run check` / `check-gate-record` / `scope-sweep` / `doc-name` / 两件 `Get-FileHash` + 行数）。
2. 读 spec 全文（245 行）：**先 §3 / §4 / §5 / §7 / §10**（落点、12 键、三投影与探针、写盘门禁、D1–D12），再 §8 / §9。
3. 读 testcase 的 §1 覆盖总表 + 附录 A 61 行（plan 的映射表要逐 ID 对位），并读 `skills/dev-workflow/references/stage-2b-plan-gate.md` 与 `scripts/check-plan.mjs:23-372` 的四个子命令/必传参/`**Testcase:**` 行与附录 A 的结构前提。
4. 读 15 席现状与数据（`agents/*.md`、`tools/docgen/components/agentData.mjs`、`outputFormats.mjs`、`validateAgentData.mjs`、`tools/docgen/state.json`），按席估算迁移面（试点席 = `detective-observer`，实测是唯一「议长 ×1 + 主持人 ×7」混用卡，迁移必须统一为「主持人」）。
5. 写 plan 到 `docs/superpowers/plans/2026-10-30-agent-card-s4-render.md`，自跑 `node scripts/check-plan.mjs coverage --plan <plan> --prd docs/prd/20261026205821-agent-card-contract.md --stage S4`、`deps --plan <plan>`、`map --plan <plan>`、`size --spec <spec> --testcase <testcase> --rounds <n>`（四条全 exit 0 且无 `## 新增设计决策` 节）；随后 `git add -N` 本 plan 留存基线（开放问题 3）。

## 开场话术

读 `docs/handoffs/2026-10-30-agent-card-s4-plan.md`，按交接词继续：写 agent-card S4 渲染层的 plan（覆盖 F-09～F-12、F-23），过 ②→③ 计划门后进 ③ 施工。
