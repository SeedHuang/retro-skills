# 卡片权限叙述单源化（S3）设计

- 日期：2026-11-12
- 状态：设计待评审（spec → 独立 senior-sdet 出 testcase → plan → 施工）
- 上游：`docs/superpowers/specs/2026-11-11-agent-model-pipeline-p4-design.md` 的 D6 / D6b（边界按写落点派生）
- 本 spec 解决 D6b 中列为「S3」的遗留项：**卡面上除 `## 边界` 之外的散文段，仍可用任意措辞陈述权限**

## 1. 背景

D6b 之后，「边界」段只能由 `renderBoundary(seat)` 生成（`tools/docgen/builders/agents/components/patternRegistry.mjs:33-41`），权限事实唯一来源是 `SEAT_POLICY`。但一张卡还有 5 个自由散文段，槽值直接来自 `tools/docgen/dsl/agents/seats/*.json`：

| 段 | 数据字段 |
|---|---|
| front matter `description` | `trigger.when` |
| `## 职责` | `card.duty.action` + `card.duty.constraint` |
| `## 一定会` / `## 禁止` | `card.must` / `card.never` |
| `## 本席清单` | `card.checkItems[]` |
| 职责缘由（docs 投影） | `card.rationale` |

2026-11-11 已用 S1 词表兜底（`tools/docgen/builders/agents/card-model/vocab/permission-claims.mjs` + `policy-pure-source.test.mjs` 的 `S6-TC-G03`）：写席在这三处出现「不得创建、修改、删除任何文件」等全称否定即红。但词表是 **denylist**——「不落盘」「只交事实不产生文件」照样漏。

现状取数（本 spec 写作时）：

```
Select-String -Path "tools/docgen/dsl/agents/seats/*.json" -Pattern '"constraint"'
→ total=18；default=12（值 = "@dutyConstraintDefault"）；distinct=7
```

## 2. 目标 / 非目标

**目标**

1. 席级数据**没有位置**可以写整句权限叙述：`card.duty.constraint` 退场，改为**登记 ID 列表**。
2. 登记表（唯一存放叙述文本的地方）自身受卡片散文探针 + 权限词表双重判据约束。
3. 迁移**零字节变化**：18 张卡 sha256 全等（这是与 D6b 的关键区别——D6b 允许改字，S3 只允许改「谁能写」）。

**非目标**

- 不改边界派生、不改 `SEAT_POLICY`、不改卡面用词（措辞优化另立）。
- 不 ID 化 `rationale`：它是 docs 投影的逐席长文，ID 化只是把散文搬个地方，不减少可写面；继续由 S1 词表扫（`S6-TC-G03` 已覆盖 `docs/agents/*.md`）。
- 不改模型层：`tools/agent-model/models/*-model.json` 的 `duty` 无 `constraint` 字段（`evidence-reader-model.json` 的 `duty` 只有 `trigger/action`），本 spec 不触及。

## 3. 决策

### S3-D1 登记表：`policy/definitions/constraints.mjs`

```js
export const constraints = {
  'duty.default':      { text: '按本席职责与边界执行；越出边界的动作只记录，不自行处置' },
  'duty.observe':      { text: '只记录不裁决；观察记录原文进最终报告，不得删改；每条记录必须引用真实卡号' },
  'duty.host':         { text: '不出观点、不写问题卡；两张审计表只由责任席填写。程序动作越出边界的只记录，不自行处置' },
  'duty.evidence':     { text: '取证通读：不出观点、不出问题卡、不参与评审、不判技术对错；只交可核对的原文与行号' },
  'duty.arch-defense': { text: '只核实与汇总，不改代码、不写评审结论；越出边界的动作只记录，不自行处置' },
  'duty.dev-defense':  { text: '只核实不改代码；可跑命令复现，命令输出首行须原文摘录；越出边界的动作只记录，不自行处置' },
  'duty.test-design':  { text: '只写本次 spec 同目录的 testcase 与测试设计文档；业务代码、spec、rule、skill、agent 只读；越出边界的动作只记录，不自行处置' },
};
```

- ID 归码沿用 `spec §3.4` 谓词 `/^[a-z][a-z0-9.:-]*$/`；命名按语义（`duty.<角色>`），禁 `duty.1` 这类序号码。
- 初始 7 条 = 当前 7 个 distinct 值**逐字**照搬（含议长那条里的 `。`），保证渲染字节不变。
- 条目粒度 = **整句**，本 spec 不做子句拆分（拆分会让 `；`/`。` 归并改变字节，属于措辞重构，另立）。

### S3-D2 席数据：`constraint: string` → `constraints: string[]`

- 18 席全部改写；12 席 `@dutyConstraintDefault` → `["duty.default"]`，6 席各取其 id。
- `shared.json` 的 `dutyConstraintDefault` 删除（constraint 上的 `@` 引用机制退场；其他字段的 `@` 引用不动）。
- 数组顺序 = 渲染顺序；单元素是常态，多条用 `；` 连接。

### S3-D3 渲染唯一路径

`renderCard` 的「约束：」行只做一件事：

```
约束：<ids.map(id => constraints[id].text).join('；')>
```

**施工期裁决（2026-11-12）**：派生点放在 `components/seatLoader.mjs`（与 `duty.trigger` / `duty.categories` 同法）——loader 读 `duty.constraints` 查表、把结果写回 `duty.constraint`；渲染器与散文探针扫描面（`SCAN_FIELDS` 的历史键名 `duty.constraint`）都不改，卡面因此逐字节不变。等价性由 I-1 的判据守住（`S3-TC-C01` 断言「派生文本 = 按序连接」，`C04` 断言多 id 顺序）。

禁止席级拼接模板串、禁止在 `seat` 上再加第二个自由文本槽。`CARD_KEYS`/深校验同步：`duty` 下只允许 `trigger? / action / constraints`。

### S3-D4 校验码（新增 4 个）

| 码 | 触发条件 |
|---|---|
| `CONSTRAINT_NOT_IDS` | 席 JSON 仍出现 `duty.constraint`（字符串形态），或 `duty` 出现白名单外子键（见 §9-G2） |
| `CONSTRAINT_ID_UNKNOWN` | `constraints[]` 元素不在登记表 |
| `CONSTRAINT_LIST_EMPTY` | `constraints` 非数组或长度 0 |
| `CONSTRAINT_TEXT_PERMISSION` | 登记文本命中 `WRITE_DENIAL_PHRASES`（复用 S1 词表，登记层同样不许谈权限；扫描面 = **登记表全表**，见 §9-G5） |

**发射点（§9-G1）**：4 码只进 `validateAgentData.mjs` 的 `EXIT` 表（exit 1），**不进** `CARD_MODEL_CODES`——后者的键数与 `S1_CODES`/PRD 脚本码表联动，扩表代价与收益不成比例。

另外复用现有卡片散文探针扫**登记文本**（不是 id）：`PointerToElsewhere` / `HardcodedCount` / `MixedTermInCard` / `ProceduralWordOutsideParliament`——即「先上表，再校验文本」，探针判别力不因 ID 化而丢失。

### S3-D5 `rationale` 明确定位为叙述层

- 只在 `docs/agents/<席>.md` 投影，不进卡面、不进边界派生（现状即如此，本次写进不变量固化）。
- 继续受 `S6-TC-G03` 三面扫描（席 JSON / docs 投影 / 模型数据）。

## 4. 不变量

| # | 不变量 | 机械判据 |
|---|---|---|
| I-1 | 卡面「约束：」= 登记文本按序 `；` 连接，无第三种来源 | 渲染函数唯一 + 逐字节比对 |
| I-2 | 席 JSON 无自由整句位：`duty.constraint` 出现即红 | `CONSTRAINT_NOT_IDS` |
| I-3 | 登记文本全部通过散文探针 + 权限词表 | `CONSTRAINT_TEXT_PERMISSION` + 探针用例 |
| I-4 | 迁移前后 18 卡 sha256 全等 | 基线快照对照（证据目录记 sha） |
| I-5 | 登记表 id 唯一、文本非空、无两条完全相同 | 登记表自检用例 |
| I-6 | 模型层不含 constraint | 扫 `tools/agent-model/models/*-model.json` 的 `duty` 键集 |

## 5. 迁移步骤

1. 新建 `constraints.mjs`（7 条，逐字照搬）。
2. 改 `loadSeatData` / 渲染：读 `constraints[]` → 查表 → `；` 连接；`duty` 键白名单更新。
3. 18 席 JSON 改字段；删 `shared.json` 的 `dutyConstraintDefault`。
4. 校验器接 4 个新码 + 探针扫登记文本。
5. 跑 `cli.mjs gate`：期望 **0 差异**（`baseline 20/20` 且无 Mismatch）。出现差异即视为迁移失败——不允许用 `draft → replace` 掩盖，除非差异原因已单独评审。
6. 更新既有引用 `duty.constraint` 的测试（至少 `card-model.test.mjs`、`card-render.test.mjs` 两处），并补 I-1…I-5 的机械用例。

## 6. 影响面

| 文件 | 变更 |
|---|---|
| `tools/docgen/builders/agents/policy/definitions/constraints.mjs` | 新增（登记表） |
| `tools/docgen/dsl/agents/seats/*.json` | 18 席 `constraint` → `constraints` |
| `tools/docgen/dsl/agents/shared.json` | 删 `dutyConstraintDefault` |
| `tools/docgen/builders/agents/components/cardKeys.mjs` 及深校验 | `duty` 子键白名单 |
| `tools/docgen/builders/agents/components/cardPipeline.mjs`（渲染） | 查表 + `；` 连接 |
| `tools/docgen/builders/agents/components/validateAgentData.mjs` 或 card-model 校验层 | 4 个新码 |
| `tools/docgen/builders/agents/test/card-model.test.mjs`、`card-render.test.mjs` | 字段名与断言同步 + 新用例 |
| `tools/docgen/builders/agents/test/sc-card-shape.test.mjs`、`s3-predicates.test.mjs`、`sa-data-layer.test.mjs`、`s2-card-rewrite.test.mjs` | 直接读写 `duty.constraint` 与 `shared.json` 键数，需同步（§9-G4，testcase 缺口 4） |
| `docs/superpowers/reviews/.../capability-diff.md` | 记账，锚串固定为 **`卡面 0 变化`**（testcase E04 按此字面串判） |

## 7. 验收要点（交给独立 senior-sdet 的输入）

1. 18 席全部 `constraints` 数组、无 `constraint`；登记表 7 条、id 合规。
2. 负例四连：旧字段出现 / 未知 id / 空数组 / 登记文本塞「不改任何文件」——各自命中对应码。
3. 探针不回退：登记表塞「见 §3」→ `PointerToElsewhere`；塞「共 3 条」→ `HardcodedCount`。
4. 字节等价：迁移前后 18 卡 sha256 全等（不允许人工目测）。
5. 门禁：`gate baseline 20/20`、`npm run check` 末行 `check 全部通过`、`scope-sweep --check` 为 `sweep ok`。
6. `rationale` 仍只出现在 `docs/agents/`，卡面 0 处。

## 8. 风险与回退

| 风险 | 处置 |
|---|---|
| 登记表变成「新的自由文本层」 | 文本被词表 + 散文探针双锁；渲染路径唯一；I-4 保证迁移零漂移 |
| 条目膨胀 / 同义复制 | I-5 禁完全相同的两条；新增条目必须过探针与词表，评审可见 diff |
| 迁移时顺手改措辞导致卡面漂移 | I-4 硬约束；步骤 5 明令「0 差异，出现即失败」 |
| 后续仍需「一句话说权限」 | 不允许写进 constraint；只能进 `SEAT_POLICY`（边界段自动派生） |

回退：删除 `constraints.mjs`、18 席恢复 `constraint` 字段即可，单次提交可逆，不涉及卡面字节。

## 9. 评审裁决（主 agent ↔ 独立 senior-sdet，2026-11-12）

testcase 编写者（独立 senior-sdet）读完本 spec 后提出 5 处缺口，主 agent 裁决如下；裁决同时反向修正了 testcase 的 8 处判据（见其文末「交叉评审记录（第 1 轮）」，25 条用例：A8 / B4 / C4 / D4 / E5）。

| # | 缺口 | 裁决 |
|---|---|---|
| G1 | 4 个新码的发射点与退出码归属 | 只进 `validateAgentData.mjs` 的 `EXIT`（exit 1）；**不进** `CARD_MODEL_CODES`（36 码表与 `S1_CODES` / PRD 脚本码联动），见 §3 S3-D4 |
| G2 | `duty` 子键白名单无对应码 | 并入 `CONSTRAINT_NOT_IDS`，语义扩写为「旧字段 `constraint` 或白名单外子键」；不新增第 5 个码 |
| G3 | 登记表是否必须可注入 | 不要求可变（允许 `Object.freeze` / 加载期快照）；探针可在加载期或副本注入，测试不得断言 `constraints` 可写 |
| G4 | 影响面漏列既有测试 | 已补进 §6：`sc-card-shape` / `s3-predicates` / `sa-data-layer` / `s2-card-rewrite` |
| G5 | `CONSTRAINT_TEXT_PERMISSION` 扫全表还是本席条目 | **全表**：登记表是唯一文本面，未被引用的条目也会被将来引用 |

**对 testcase 的反向修正（已落地）**：E05 去掉写死的 `36/8/12`，改结构判据「`CARD_MODEL_CODES` 键集不得出现任何 `CONSTRAINT_*`」；D04 改为运行时从 `NON_PARL_SEATS` 现算注入目标；A02 的源码正则降级为构造前提；A04 改为「键集 = `$BASE` 键集 − `dutyConstraintDefault`」；新增 A08 守「迁移全或无」；记账锚串固定为 `卡面 0 变化`。

**一致性口径**：本 spec 与 testcase 的冲突以本节为准；若施工时发现二者仍冲突，先改本节（需评审），不得单方面迁就实现。
