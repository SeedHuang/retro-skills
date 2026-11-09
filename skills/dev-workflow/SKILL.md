---
name: dev-workflow
description: 当任务要走「需求 → 技术设计 → 计划门 → 实现 → 质量 → 交付」这条主干、需要判断现在该进哪一段或本段出口齐没齐时使用；也用于需要长文取证（只交原文 + 行号）的场合。签字账落 docs/devworkflows/<任务目录>/gate-record.md（一任务一份，模板在 references/gate-record-template.md）。不用于：单点代码修改或缺陷定位（走 systematic-debugging 等专用流程）、议会内部流程（走 parliament）、把 PRD 拆成 spec（走 prd-to-specs）。
---

# 开发工作流主干（五段 + 两插点）

本技能只做一件事：告诉你在主干上**现在该进哪一段、这段出口齐没齐、卡住了该回哪一段**。每段的具体判据在 `references/` 的段文档里，本文件只留段表、插点与三权。

## 段表（唯一真相 = PRD §4，此处是逐字副本）

| 段 | 名称 | 入口 | 出口判据 | 谁签 | 议会 |
|---|---|---|---|---|---|
| ① | PRD（需求产生 + 产品设计） | 开工前按 `references/stage-1-prd.md` 的出口判据逐条核，产出**已核清单**（`docs/devworkflows/<任务目录>/gate-record.md` 的表格行），缺清单不得进入下一段 | §0 四栏齐 + 依据可核；功能点清单与流程图双向一一对应 | **用户**（产品经理为申报人，不签）；审计核 §0 | **议会 #1** |
| ② | 技术设计 | 开工前按 `references/stage-2-tech-design.md` 的出口判据逐条核，产出**已核清单**（`docs/devworkflows/<任务目录>/gate-record.md` 的表格行），缺清单不得进入下一段 | spec + testcase 一件齐；差异清单留痕；内部对齐零未决 | **审计**（核议会 #2 放行 + 两条计数；主 agent / sdet 为申报人） | **议会 #2** |
| ②→③ | 计划门 | 开工前按 `references/stage-2b-plan-gate.md` 的三条核对逐条核，产出**已核清单**（`docs/devworkflows/<任务目录>/gate-record.md` 的表格行），缺清单不得进入下一段 | 功能点全覆盖 / 依赖无环 / 功能块↔testcase 一一映射 | 脚本 + **审计本人读并签字** | **无议会** |
| ③ | 技术实现 | 开工前按 `references/stage-3-implementation.md` 的出口判据逐条核，产出**已核清单**（`docs/devworkflows/<任务目录>/gate-record.md` 的表格行），缺清单不得进入下一段 | 施工完成、`npm run check` 绿 | **审计**（核 `npm run check` 输出；开发为申报人） | 无 |
| ④ | 质量保证 | 开工前按 `references/stage-4-quality.md` 的出口判据逐条核，产出**已核清单**（`docs/devworkflows/<任务目录>/gate-record.md` 的表格行），缺清单不得进入下一段 | testcase 全过；负例与边界条数 ≥ 正例 | **sdet**（开发为申报人） | 无 |
| ⑤ | 产品交付 | 开工前按 `references/stage-5-delivery.md` 的出口判据逐条核，产出**已核清单**（`docs/devworkflows/<任务目录>/gate-record.md` 的表格行），缺清单不得进入下一段 | 交付审计（含数字签字项） | **用户**（交付终验；审计是审计表作者，不签验收） | 无 |

**表里 6 行而叫「五段」**：`②→③` 是**门**不是段——它有独立签字人与脚本判据，塞进 ③ 的入口会把它埋掉。读表时数段请数 ①②③④⑤。

**「谁签」列只写定性人**：申报人见各段文档（① 产品经理 / ② 主 agent + sdet / ③ 开发 / ④ 开发 / ⑤ 主 agent）；判定 = **签字人集合 ∩ 申报人集合 = ∅**（任一交集 = 自签）。

**段表与 PRD §4 的关系**：本表是 PRD §4 段表的逐字副本，只多拆出「名称」「入口」两列。两者不一致时以 PRD §4 为准；改 PRD §4 必须同批改本表。

## 两个议会插点

议会只在两处插点：① 之后审 PRD（议会 #1）、② 之后审 spec + testcase 一件（议会 #2）。

- **计划门不设议会**：脚本能查的集合比对，人不比脚本准（PRD §6）。
- **议会有条件**：议会列的段，收口 = 出口判据齐 **且** 该议会通过（P0 = 0、必修项清零）。不通过 → 留在本段，按 `parliament` 技能的收敛规则循环，**不得带未收敛项进入下一段**；议会通过之前不得进入下一段。不通过的记录写在议会自己的评审账里，不另建第二处。
- **旁路（PRD §4.2）**：单点小改（功能点集合 diff 为空 + 无新增交付物）不进议会，任务目录下的 `gate-record.md` 的 ① / ② 行写「旁路 + 集合 diff 为空 + 无新增交付物」，**签字人 = 审计（单一签字）**，「核了什么」= F 集合差集结论（`git diff -U0` 的 §10 hunk）+ `git diff --name-only` 清单（缺 = 旁路无效）；其余出口判据按 PRD §4.2 的替换表执行。误判（集合变了却走旁路）按功能增删类漂移回 PRD 重签 §0。

## ① 的过渡口径（S2 前有效，产品经理卡落地即删）
① 的签字人写「用户签字」；产品经理一职由主 agent 代拟，PRD 头部注明「代拟：主 agent」——代拟者不签字。「市场调研结论」入口在 S2 前由用户提供或省略。

**失效条件**：S2 落地（产品经理角色卡 `agents/reviewer-product.md` 之外的专职产品经理卡存在）后，本节整段删除，① 改由产品经理签字。过渡期内代拟者一律不签字，否则三权分离在第一天就失效。

## 三权总则

每段的三件事必须分给不同的人（PRD §3.3），申报人不得自定性：

- **申报**：产物作者申报本段出口已齐，并给出证据（命令输出首行或 `path:line`）。
- **定性**：由该段「谁签」列的角色定性合格与否；申报人不得给自己定性。
- **核对**：审计或独立核对者核证据本身；核对者与申报人不得是同一实例。

作者定义（与签字账 R2 同源）：PRD→产品经理、spec→主 agent、testcase→sdet、代码→开发、审计结论→审计。

## 义务边界（原规则承接）

- **适用范围**：PRD、spec、plan、代码实现与交付审计五类主线产物都要过本主干；不因子代理、脚本、模板或 AI 生成而豁免。本技能只管主干顺序与签字归属，段内做法归各段文档与对应技能。
- **冲突裁决**：与「先快速交付、回头补 spec」「先写代码再补 PRD」「签字人顺手代签」冲突时，以本技能为准；拿不准先停下说明，等用户确认再动。
- **例外一（存量 spec 不追溯）**：本技能生效（2026-10-24）前已定稿的存量 spec 不追溯。进 ③ 时必须点名豁免的文件名，并写出升级时点（该 spec 下一次修订并进入 plan 的那一刻，或用户给出的具体日期）；禁止写「看情况」。
- **例外二（技改免议会，2026-11-05 用户裁定）**：功能点 ID 集合 diff 为空的技术改造，经用户在 ① 入口点名「本任务按技改走」，可免议会 #1 / #2；同批允许新增交付物，只不准新增功能点。豁免只免议会、不免签字：① 行签字人仍按段表，② 行签字人 = 审计，并同批附 `senior-sdet` 与 `reviewer-audit` 两份审查结论（落 `docs/reports/<批次>/`，账内写 `path:line`）。入口未点名不得事后追认；集合 diff 非空 → 回 PRD 重签 §0（R5）。
- **触发时机**：进入任一段之前；写改任务账任一行时；送议会或 plan 阶段想新增 spec 未写的设计时；引用对话记录 / 评审账 / 规范原文下结论时；改任一判据级口径时（R8）；交接、复盘或审计发现「未签就进下一段」时。

**验证**（两条自查命令）：

`node scripts/check-gate-record.mjs`

`node scripts/scope-sweep.mjs --check`

判据：前者 `tasks N rows R bad 0` 且末行 `gate-record ok`；后者 exit 0（`sweep ok`）。任一不满足 = 本技能未过，不得进入下一段。

## 取证调度

凡引用长文（对话记录 / 评审账 / 规范原文）得出的结论，先由 `evidence-reader` 产出「原文 + 行号」，主 agent 不得直接以自读摘要作引用依据；送审 / 交接材料里每条引用都要能追到那份取证产出。

**常驻 ≠ 每轮必跑**：该角色常驻在册，只在需要给长文结论取证时派；不要为每个任务默认起一个，也不要让它出观点或问题卡。

## 指针

- 每段判据：`references/stage-1-prd.md`、`references/stage-2-tech-design.md`、`references/stage-2b-plan-gate.md`、`references/stage-3-implementation.md`、`references/stage-4-quality.md`、`references/stage-5-delivery.md`
- 出口核对记录表（R1–R9 的唯一证据载体）：`docs/devworkflows/<YYYYMMDDHHmmss>-<任务名>/gate-record.md`（进 ① 时建目录，格式复制 `references/gate-record-template.md`）
- 签字账模板（格式唯一源）：`references/gate-record-template.md`
- 判据类文本的可观察判据：已并入 `carrier-conventions` 技能，按该技能「判据必须写成可观察形态」节执行；机判 = `npm run check:observable`（末行 `check-observable ok` 且 exit 0）
- 元工作方法（改 rule / skill / 脚本、落地待办、评审修复轮之前）：按 `references/meta-working-principles.md` 执行，产出「全貌确认」块；缺块不得动笔
- 落地后回扫（建脚本 / 加规则 / 完成待办之后）：按 `references/landing-sweep.md` 执行，逐条处置四类声明处；缺处置不得宣布完成
- 强制约束：本技能段表 + `references/gate-record-template.md` 的 R1–R9
