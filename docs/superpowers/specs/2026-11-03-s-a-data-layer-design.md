> split from `docs/prd/20261102212627-card-data-contract-and-proof/index.md`（2026-11-03）

# 10 S-A 数据层：`agentData` 拆 JSON + `when` 唯一源

> 本 spec 只覆盖 PRD §8 的 **S-A 段**。D1–D17 / Q1–Q8 / V1–V12 的正文只活在 PRD，本文只引用编号（PRD §9 双份真相禁令）。
> 前置（硬）：PRD §5 的 `SCAN_FIELDS` 行、`S1-TC-G09` 行、`policy/**` 行已在 ② 段签收（`skills/dev-workflow/references/gate-record.md` 对应行）；未签不得开工。

## 10.0 为什么

- 现状 `tools/docgen/components/agentData.mjs` 是**纯 JS 字面**（`:326` 导出 `SKELETON`），15 席的共享片段靠**字面复制**：`越出边界的动作只记录，不自行处置` 13 处、`条 checkItem` 14 处、`当主持人调度对…` 22 处（= 11 席 × 2）——PRD §1 缺陷 5。
- 同一句话在两处存放：`agentData.mjs:123`（`duty.trigger`）与 `:307`（`triggerTable[…].when`）逐字相同，而 `cardPipeline.mjs:59-64` 的 `descriptionOf` 只读后者、8 键扫描面只含前者 → 斜杠串从 `description` 漏检——PRD §1 缺陷 6。
- policy 里还留着 3 项本仓专属路径（`skills-lock.json`、`lessons/`、`tools/docgen-spike/.tmp-test/`，末者已不存在），被渲染进 2 张卡的禁止清单——PRD §1 缺陷 8 / Q8。
- 用户原话（2026-11-02）：「是不是应该分成独立的 json」「怎么复制 11 份呢？他只是把共享的独立的拆开了」——所以拆分的正当性不是「好看」，而是**首次真正实现共享**（PRD D12）。

## 10.1 核心决定（不可违反）

| # | 决定 | 为什么 |
|---|---|---|
| R1 | 数据源拆为 `seats/<seat>.json`（15 份，一席一文件）+ `shared.json`（1 份），靠 `@` 引用共享段（PRD D12 / Q7） | 不拆 → 共享片段继续靠字面复制，改一处要改 13 处；这正是 PRD §1 缺陷 5 的根因 |
| R2 | `@` 展开 = **装配前一次性纯函数**，展开后顶层键必须 **12 键齐**、无悬空键、无环（PRD D12 / V5） | 展开若散落在渲染期，每次渲染都要判一次引用，且环检测没处放；12 键齐是渲染器 `renderCard` 的输入契约（键名见 PRD V5） |
| R3 | `when` 唯一源 = `triggerTable.when`；`duty.trigger` **一律装配期注入**，不取「删除」分支（PRD D17 / r4 后端席） | 两处真相是缺陷 6 本体；取「删除」分支则 V12 两面都无字段可判，等于把判据删了 |
| R4 | `description` 纳入文本扫描面：`CARD_TEXT_FIELDS` **与** `surfaceTexts` 两处同批改，缺一即静默空转（PRD D17） | 只改前者会让「改了表、仍然不扫」原样保留，且 §4 没有一条验收能判出它 |
| R5 | 同批改写三条冻结断言：`card-model.test.mjs:1125` / `:1131`（现状 `green(description …)` 要求 `description` **不扫**）与 `:1141`（`SCAN_FIELDS` 恰 8 键） | 不改这三条 → R4 落地即红；PRD §5 `S1-TC-G09` 行已登记这是改已签件，须回 ② 段 |
| R6 | policy 删 3 项本仓专属路径（PRD Q8），保留 `.gitignore` 兜底句 | 那是「通用角色卡」里的项目专属内容（PRD D13）；兜底句删了会让卡面失去最后一道提醒 |
| R7 | 装配顺序不变：`...s` 必须置末（`agentData.mjs:294` 注释是硬约束、`:295` 是唯一实现） | 条目自带的 `tools` / `boundary` 会静默覆盖档位；顺序一乱，`tool-tiers` 的 `FROZEN` 断言与渲染都会漂 |
| R8 | `trigger.kind` 落在 `triggerTable[<seat>].kind`（PRD Q5 / §8 S-C） | 本段只**留字段位**，四值校验与卡面渲染归 S-C；字段位置现在不定死，S-C 会再造一个第二来源 |
| R9 | 本段产物硬约束：`node tools/docgen/cli.mjs gate` → **exit 0** 且 15 席 `disk == render` 逐字节相等（PRD V4）；`baseline 38/38` 不作判据（PRD §5） | 数据层改造若让渲染漂了一格，S-B / S-C 的所有验收都建立在错基线上 |

## 10.2 数据模型 / 机制

<开工时填充：`shared.json` 与 `seats/*.json` 的键切分表、`@` 语法与展开算法、加载器文件名与调用点>

**本节已定、不留到开工的四条**（testcase 作者提出的四处歧义，此处给答复，免得施工时各猜一份）：

| # | 已定口径 | 为什么 |
|---|---|---|
| D-a | `duty.trigger` **保留字段名**，但字面值一律清空、由装配期写入 `triggerTable[<seat>].when` | 字段删掉会让 `renderCard` 与既有断言拿不到该键；保留字段名 + 装配期赋值，才能既消两处真相又不改渲染契约 |
| D-b | `@` 只允许**单层**引用（`seats/*.json` → `shared.json`），不支持嵌套 | 嵌套会引入环检测的复杂度，而当前共享片段只有一层需要 |
| D-c | 「基线更新」= 重跑 `tools/docgen/cli.mjs` 的 baseline 相关子命令后，把新的 15 卡 SHA 与 `baseline` 清单落盘 | 只重生成卡面、不更新 baseline，下一次 `gate` 会拿旧基线判 `Mismatch` |
| D-d | `shared.json` 的键集合 = 当前 15 席里**逐字重复 ≥2 次**的片段（13 处 `越出边界的动作…`、14 处 `条 checkItem`、11 席 × 2 处 `当主持人调度对…`） | 判据是「真的重复」，不是「看起来通用」；PRD §9 的 shared 判定同此口径 |

## 10.3 界面

不适用（数据层，不改卡面）。

## 10.4 硬约束

1. 12 键齐 / 无悬空 / 无环（R2，判据见 PRD V5）
2. 渲染逐字节不变、`gate` exit 0（R9，判据见 PRD V4）
3. `duty.trigger` 与 `triggerTable.when` 不得同时为源（R3，判据见 PRD V12 两面为 0）
4. `SCAN_FIELDS` 键数仍 8（R5，判据见 `card-model.test.mjs:1141`）
5. 回退：开工前 `git stash -u`；或 `git checkout -- tools/docgen/` 后复验 `git status --porcelain tools/docgen` 为空（PRD §8 S-A 行）

## 10.5 测试

| 测什么 | 为什么 |
|---|---|
| `@` 展开的悬空 / 环 / 12 键齐 | 引用一断，渲染期拿到的是空值而不是报错，最隐蔽 |
| 拆分前后 15 席渲染逐字节相等 | 拆 JSON 最容易把字段顺序 / 类型悄悄改掉 |
| `duty.trigger` 注入后与 `triggerTable.when` 逐字相同 | 同一事实两处的老病，注入写错不会报错、只会让斜杠串漏检 |
| `description` 进扫描面后能报出斜杠串 | R4 的两处实现点缺一即空转，必须用「写一个斜杠串能报码」来验 |
| policy 删 3 项后 2 张卡重生成 + 基线更新 | 删了不重生成 → `gate` 报 `Mismatch`；基线不更新 → 下次改不动 |

**测试用例文件**：`2026-11-03-s-a-data-layer-design-testcase.md`（由 `senior-sdet` 在全新上下文编写；每条用例五要素齐、负例 ≥ 正例）

**只手动验证**：`git stash -u` 回退演练（真实工作区状态，脚本测不出）

**不测**：`renderCard` 的排版细节（属 S-C）、`policy` 内容语义（属 Q8 的 ② 段裁定）

## 10.6 不在这一轮

- 卡面形状改造（三态 / trigger 四型 / 删人设）→ S-C
- 证据栏三列与引句校验器 → S-B
- 本仓专属路径之外的历史路径清理 → 无依据，不做

## 10.7 将来才会撞上的一件事

`trigger.kind` 的四个取值（PRD Q5）在 S-A 只留字段位、不校验；若 S-C 迟迟不开工，数据里可能出现第五个 kind 而无人拦。本轮只在这里点名，以免靠撞上才发现。

## 10.8 与既有 spec 的关系

- **改写** `2026-10-29-agent-card-s4-render-design.md` §5 相关的 `S1-TC-G09` 三条断言（PRD §5 已登记，须 ② 段签收）
- **保留** `2026-10-29-agent-card-s4-render-design.md` 的七段结构、12 键输入契约、渲染列数（4 列）
- **取代** 无
