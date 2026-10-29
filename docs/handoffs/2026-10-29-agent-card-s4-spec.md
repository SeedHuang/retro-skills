# Session 交接：retro-skills → agent-card S4 渲染层（② spec + testcase）（2026-10-29）

## 元信息

| 键 | 值 |
|---|---|
| 交接时间 | 2026-10-29 22:15（Asia/Shanghai） |
| 项目根 | `d:\Seed\retro-skills` |
| HEAD | `4c04865`（`docs: 补充 agent-card S1 零差异字段面的决策记录`）；工作树：**clean**（`git status --porcelain` 空串，22:05 实测） |
| 验证基线 | `npm run check` → `# tests 1097` / `# pass 1095` / `# fail 0` / `# skipped 2`、`baseline 37/37`、`0 findings`、`④ markdown 检查通过（**315 个文件 / 1385 张表**，= 交接文档自身 +1 文件 / +1 表）`、末行 `check 全部通过`（exit 0）；`node --test "tools/docgen/test/card-model.test.mjs" --test-reporter=tap` → `# tests 58 / # pass 58 / # fail 0`；`node scripts/check-gate-record.mjs` → `rows 32 bad 0` / `gate-record ok（R1/R2/R6 全过；splitting 0）`；`node scripts/scope-sweep.mjs --check` → `sweep ok（命中未超基线、清单齐、scope 齐）`；`node scripts/doc-name.mjs --check docs` → `命名检查通过（docs）`；`check-plan` 的 `coverage` → `gap 0（prd 8 / plan 8）`、`map` → `missing 0 dangling 0（cases 66 / mapped 66）`、`size` → `spec 301/350 tc 66/80 rounds 3/3`（全部 exit 0，**22:05–22:13 实跑**） |
| 继任自 | `docs/handoffs/2026-10-29-agent-card-s1-impl.md` |
| 状态 | 可直开工（4 条开放问题，均不阻断；无「开工第一问」级阻断项） |

## 项目定位

`d:\Seed\retro-skills` —— AI 协作工作流的规则 / 技能 / 机械判据仓库（五段主干：PRD → spec+testcase → 计划门 → 实现 → 质量 → 交付；`npm run check` 是唯一总门禁）。

## 现状

- **已完成：agent-card S1 定义层整段收口**——五段门行齐（`skills/dev-workflow/references/gate-record.md` 的 `②@S1` / `②→③@S1` / `③@S1` / `④@S1` / `⑤@S1` 五行；`rows 32 bad 0` 实测）；②段 spec 301 行 / testcase 58 条（`docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design.md` 与其 `-testcase.md`，SHA256 `2931C7D7…3660064E` / `03DA6675…6A76D6F5`）；③交付 `tools/docgen/card-model/` 12 个 `.mjs` + `tools/docgen/test/card-model.test.mjs`（58 条，TAP `# tests 58 / # pass 58`）；④逐条结论 58/58（`.session/reviews/2026-10-29-2100-agent-card-s1-quality/quality-4.md`）；⑤交付审计（`.session/reviews/2026-10-29-2200-agent-card-s1-delivery/delivery-5-s1.md`，§8 增量节）。
- **plan 已全勾**：`docs/superpowers/plans/2026-10-29-agent-card-s1-card-model.md`（689 行 / `- [ ]` 0 / `- [x]` 42 / SHA256 `68B08AEB…78E279`，②→③ 行有「⑤ 交付收口」增量登记）。
- **S1 段内已判定的三处行为偏差**（`④@S1` 门行 P2）：B01 码数锚换派生载体、B02 前置放宽为 `mutate|fn|env`（成因 = `testcase:680` 与其 §0.4 `ScenePromotionRequired` 行自相矛盾）、`E03③` 未收录（与 spec §7 `:170` 冲突，用户 2026-10-29 裁定）。
- **验证证据**：见元信息表『验证基线』（单源，此处不重复）。
- **提交状态**：已全部 commit（HEAD 见元信息表；S1 的 8 个代码提交为 `44adba0`…`bfcc007`，另有 handoff `eb7a0c2`、门行 `1b9cfc3`、after+修复批 `b6b57a4`、`4c04865`）。
- **工作树异常**：无。

## 过程记录

- `.session/reviews/2026-10-29-1813-agent-card-s1-plan-gate/`（**先读** `plan-gate.md` 尾部「终态轮」与 `impl-3.md` §3–§4：L-4 六条处置 + 偏差留痕）
- `.session/reviews/2026-10-29-2100-agent-card-s1-quality/`（`quality-4.md` §5 缺口 11 条 + `quality-4-audit.md`）
- `.session/reviews/2026-10-29-2200-agent-card-s1-delivery/`（`delivery-5-s1.md` §8 增量 + 条件 C1/C2/C3）
- 历史交接词：`docs/handoffs/2026-10-28-s4-plan-gate.md` → `docs/handoffs/2026-10-29-agent-card-s1-spec.md` → `docs/handoffs/2026-10-29-agent-card-s1-plan-gate.md` → `docs/handoffs/2026-10-29-agent-card-s1-impl.md` → **本文件**

## 本次任务

开 agent-card **S4 渲染层**（PRD `docs/prd/20261026205821-agent-card-contract.md:516` 行 = `S4` 渲染层：**F-09～F-12、F-23**「三投影 + 覆盖记录 + 全席重生成（侦探先行）」）；流程：**② spec + testcase（一件交付）→ ②→③ 计划门 → ③ 施工 → ④ 质量 → ⑤ 交付**；起点：**② 段**（S4 尚未有 spec；`docs/superpowers/specs/` 内目前**没有** S4 的 spec 或 testcase，已用 `Get-ChildItem docs\superpowers\specs -Filter "*s4*"` 核对为空）。

## 范围依据

- **要读**：
  - `docs/prd/20261026205821-agent-card-contract.md#L511-L518`（§8 交付拆分：S4 行 + 「执行顺序 S2 → S3 → S1 → S4」）；F-09～F-12、F-23 的正文在 §6 的 F 表
  - `docs/prd/20261026205821-agent-card-contract.md#L219-L241`（§3.7 一份数据 → 三投影 + 卡面契约）；`#L121`（C-08 15 卡豁免窗口，到期 = **S4 重生成落地**）；`#L124`（C-11 数据源 = `tools/docgen/components/agentData.mjs` + `triggerTable`；`agents/*.md` 是生成物）；`#L293`（`SUBJECTS` 枚举起点）
  - `docs/superpowers/specs/2026-10-29-agent-card-s1-card-model-design.md`（§3 目录与依赖、§5 `SUBJECTS` 登记表、§11-3 `registeredIds` 单源切换时机 = **S4 首次重生成**、§12 R4「当前无人调用」）与其 `-testcase.md`
  - `docs/after/20261029204752-agent-card-s1-open-items-open-decisions.md`（**O-12 / O-13 即 S4 触发项**；O-4 = PRD `:293` 省略号随 S4 扩席收敛）
  - `tools/docgen/components/agentData.mjs` 与 `tools/observation-check/data.mjs`（现数据源真值）、`scripts/check-all.mjs`（门禁接入形态）
- **勿重做（零改动）**：
  - `tools/docgen/card-model/**`（S1 已签交付；S4 **只消费**其 18 项出口面，不得改判据）
  - `tools/observation-check/**`（S2 已签交付）、`agents/*.md`（S4 首次重生成前允许过渡期手改，见 PRD `:124`）
  - S1 的 spec / testcase / plan / 门行（已签，原文不改）

## 开放问题

1. S4 是否按五段主干**另立 spec + testcase**（而不是直接写代码）？推断：**是**——`rules/dev-workflow-mainline.md` 要求 S1 之后新任务一律走五段；且 ② 段必须有独立 `senior-sdet` 编写的 testcase（`rules/spec-testcase-gate.md`）。请用户：确认 / 纠正。
2. S4 是否**含 F-23**（PRD `:516` 写法为「F-09～F-12、F-23」）？推断：**是**，F-23 与三投影/覆盖记录同批；若用户希望拆出，需在 ② 段开工前说明。请用户：确认 / 纠正。
3. 本段是否**顺手处理 O-1 / O-2**（S1 testcase 的两处自相矛盾：`E03③`、`testcase:680`）？推断：**不顺手**——两者须派**新 sdet 实例**改 S1 的 testcase，属 S1 账；S4 段只继承结论（`E03③` 记「不适用带理由」）。请用户：确认 / 纠正。
4. S1 的 ③/④ 段遗留 P2（`dev-workflow-counts.test.mjs` 的 35/36/37 文本探针误伤 `card-model.test.mjs`）是否本段处理？推断：**不处理**——触发已登记为「下次修订该探针时按文件排除」，本段不动该文件。请用户：确认。

## 既定约束（不要重新讨论、不要重新选型）

- **执行顺序** S2 → S3 → S1 → S4 已定（S2/S3/S1 均收口，S4 是最后一格）—— PRD `:518`。
- **S4 交付面** = `tools/docgen/templates/**` + `agents/*.md` + README 生成物（PRD `:516` 的「涉及文件」列）。
- **数据源** = `tools/docgen/components/agentData.mjs`（+ `triggerTable`）；`agents/*.md` 是**生成物**，不得当数据源 —— PRD `:124`（C-11）。
- **15 卡豁免窗口到期事件 = S4 首次重生成**（`npm run check` 的 `EXPIRY_EVENT=s4-first-regeneration / EXPIRY_LANDED=false` 现值即证据）—— PRD `:121`（C-08）。
- **`registeredIds` 单源切换时点 = S4 首次重生成**（切到派生、断言集合相等后删 S2 常量文件）—— S1 spec §11-3 `:289` + `docs/after/…open-decisions.md` 的 O-12（**本段只交 `registeredIdsOf()` 之外的接线，不提前删常量**）。
- **S1 定义层只消费不改**：`tools/docgen/card-model/**` 的 18 项出口面与 36 码判据已签（S1 五段门行齐），S4 **不得**在其中增删码或改判据（要改即回 S1 的 ② 段重审）。
- **`V-13`（A/B 盲评）不在本期**，任何 S 份门行不得引用 —— `gate-record.md:13` 的 `②@S6` 增量登记。
- **R8 回扫用裸命令** `node scripts/scope-sweep.mjs --check`；若报「清单早于被扫文件」，为当批**新落**一份 impact-sheet，不得改写旧清单凑绿；**禁用** `npm run doc:sweep -- --check`（PowerShell + npm 10.9 会吞 `--` 后参数、恒 exit 0 = 假绿）。

## 遗留裁决与留观项

- `O-12` `L-2` `registeredIds` 单源切换 —— 触发：**S4 首次重生成**（`docs/after/20261029204752-…open-decisions.md` §3）。
- `O-13` `L-3` 15 卡豁免窗口 —— 触发：同 S4 首次重生成。
- `O-4` `S1-G-12` 余项（PRD `:293` 的省略号）—— 触发：S4 扩 15 席时同批收敛 PRD。
- `O-15` `M-1`（`scripts/check-plan.mjs:229` 把 F 对位 8 行当用例，`cases 66` ≠ 真值 58）—— 触发：下次修订该脚本或 S1 testcase 时**两侧同批**（本段若再写 testcase，不改 S1 那份）。
- `O-16`～`O-19`（`ALLOWED_OPS` 无封闭表 / `id`+`label` 混写计数 / `HARDCODED_COUNT` 收窄 / `mergeActions` 零差异字段面）—— 均为 **spec 侧空白**，触发 = 各自「修订 spec 对应行」时；S4 若触碰 `mergeActions`/`HARDCODED_COUNT` 相关渲染面，须同批带着这四条看。
- `C-1`～`C-5`（S1 议会 #2 台账候选，全 P2）—— 非 S4 阻断项，触发见 `②@S1` 门行结论列。

## 开工前先做

1. `git status --porcelain`（应空串）+ `git log --oneline -1`（应 `4c04865`）；复跑元信息表『验证基线』的七条命令，数值应逐项相同。
2. 读 PRD **§8 的 S4 行与 F-09～F-12、F-23 正文** + `#L219-L241`（三投影 / 卡面契约）+ `#L121` / `#L124`（C-08 / C-11）。
3. 读 S1 spec 的 §3 `:35-53`（目录与依赖方向）与 §11-3 `:289`（`registeredIds` 切换时机），确认 S4 **只消费** S1 的 18 项出口面。
4. 读 `docs/after/20261029204752-agent-card-s1-open-items-open-decisions.md` 的 O-12 / O-13 / O-4 / O-15 / O-16～O-19（S4 触发的四条 + spec 侧空白四条）。
5. 读 `tools/docgen/components/agentData.mjs` 与 `tools/observation-check/data.mjs` 现状数据源，确认「`agents/*.md` 是生成物」的实际生成链路（`node tools/docgen/cli.mjs generate` / `gate` 的用法见 `tools/docgen/cli.mjs`）。
6. 按五段主干**先落 ② 段 spec**（`docs/superpowers/specs/2026-10-29-agent-card-s4-*-design.md`），并**同批**派独立 `senior-sdet` 子代理产出 `-testcase.md`（`rules/spec-testcase-gate.md` 五条判据），两件一起送议会 #2（②段：议会列非空，须有通过记录）。

## 开场话术

读 `docs/handoffs/2026-10-29-agent-card-s4-spec.md`，按交接词继续：开 agent-card S4 渲染层的 ② 段（F-09～F-12、F-23；先写 spec，并同批派独立 senior-sdet 产出 testcase，两件一起送议会 #2）。
