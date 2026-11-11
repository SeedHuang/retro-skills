# P4 技术设计：零写席建模（首席 reviewer-product）

> 来源：`docs/prd/20261111145723-agent-model-pipeline.md` §6 P4（行 220–232）
> 前序：P3（`skills/agent-modeling` + 引擎迁至 `tools/agent-model`，`eb6fec7`）
> 用户裁定：2026-11-11 选 **A**——扩 schema 支持零写席，再从 `reviewer-product` 起逐席建模

## 1 目标与非目标

**目标**：让模型/渲染器支持「只读、不写任何文件」的席（11 席中 9 张 `reviewer-*` 都是这一形态），并据此完成 P4 前两席 `reviewer-product` 与 `reviewer-interaction` 的建模、校验、渲染与段级对照。

**非目标**：不改 `agents/**`；不改 policy 层（`SEAT_POLICY` / `SEAT_NAMES`）；不给零写席虚拟落点；其余 9 席按同形态逐席继续，不在本轮一次做完。

## 2 决策

| # | 决策 | 依据 |
|---|---|---|
| D1 | 零写席 = `seat.artifacts: []` + `outputs.items: []` + `defaultLanding: null` + `permissions.write.allow: []`；duty 用 `duty.action.landingLabel`（display 文本，只作展示）说明「写回哪里」 | 现役卡 `agents/reviewer-product.md:75-76`「不得创建、修改、删除任何文件」；policy 未登记该席，走 `__default__`（artifacts=[]），与本形态一致 |
| D1a | 零写席无法靠 `outputs.items` 推断类型 → 新增**可选显式类型** `modelType`（仅接受三个已知类型名）；有它时优先于特征推断 | `types/derived.mjs:8-15` 的 `ReviewerModel.matches` 依赖 `outputs.items` 含 `artifact.issueCard`，零写席恒不匹配 → `TYPE_UNKNOWN` |
| D1b | 「出问题卡」按**数据**判：`seat.artifacts` 含 `issueCard` 或 `outputFormat.requiredFields` 含 `suggestion`；不看借用类型 | 按类型放行会让 sdet/speaker 永久绕过 `ISSUE_RULE_ON_NON_ISSUER`；sdet 因此移出 `no-issue-without-fix`（该禁令是评审席模板样板） |
| D2 | 5 条「一定会」与 4 条「禁止」直接复用共享层规则，只把 `reviewer-product` 追加进对应 `appliesWhen` | 共享 `rules.must` 的 4 条与 `rules.never` 的 4 条与卡面逐条对应（`no-perfunctory-fix` 不在卡面，不追加） |
| D3 | 7 条清单项共用同一判据形状（原文摘句非空），逐项差异只在「条目」列 | 卡面 7 项判据文字统一为「核对 X 并写出原文引句」；不为此发明第二套字段 |
| D4 | 其余 10 席按同一形态逐席串行，每席一闭环（建模 → verify → 渲染 → 段级 diff → 人工确认） | PRD:224-228 |
| D5 | 边界形态按固定顺序判定：卡面=默认句 → `default`；有写权限且 policy 能表达 → **必须 `policy`**；否则 `literal`（`text` 与卡面逐字相等）。禁止为「diff 一致」把 policy 席的边界抄成 literal | P1 spec S2；speaker 首次误用 literal，暴露出「不可测散文换字节一致」，已回退并加守卫 |
| D6 | **D5 的口径改按「模型写落点」判**：`seat.artifacts` / `write.allow` / `defaultLanding` / `landingMode:file` 任一非空 ⇒ 必须 `policy` 且档位含 `Write`；全空 ⇒ 必须 `default`；**模型不得再用 `literal`**（渲染器保留，供副本测试） | `literal` 只能手抄卡面散文，散文与模型数据可各改各的而不报警；5 席（取证/架构答辩/研发答辩/精算/AI）声明写产物却是 `readOnly`/`command` 档，边界文字无法由任何数据复算 |
| D6a | 补 `WRITE_TIER_MISMATCH` 校验码 + 给 5 席补 `write` capability（→ `sdet` / `producer`） | 「有落点却没有 Write 工具」是空头承诺；补档位后边界才能由 `renderBoundary` 派生 |

## 3 schema 与渲染器改动（唯一代码面）

| 文件 | 改动 | 约束 |
|---|---|---|
| `tools/agent-model/types/base.mjs:75` | `defaultLanding: ['string', true]` → `['string|null', true]`；`checkValue` 增 null 分支 | 仍必填（键必须在），只允许值为 null |
| `tools/agent-model/types/base.mjs:68-87` | 增可选 `modelType: ['string', false]`，取值仅限 `ReviewerModel` / `AuditorModel` / `RespondentModel` | 不写时退回特征推断，7 张现模型不受影响 |
| `tools/agent-model/render/index.mjs:16-22` | `typeOf()` 优先读 `m.modelType`，再退回 `CLASSES.matches` | 非法类型名 → 视为 null（由 verify 报 `TYPE_UNKNOWN`） |
| `tools/agent-model/verify-models.mjs:215-221` | `issuesCard` 判据扩为 `seatArts 含 issueCard || modelType === 'ReviewerModel'`；`modelType` 也接受显式值 | 其余席语义不变 |
| `tools/agent-model/verify-models.mjs:236-240` | CLI 默认席名单追加 `reviewer-product`；`_baseline/reviewer-product.json` 首次生成 | 8 行输出，顺序按名单 |
| `tools/agent-model/render/sections.mjs:104` | duty 落点分支：`outputs.items` 为空时用 `landingLabel`，文案 `<label>（只记入评审账本，不写文件）`；非空时行为不变 | 非空分支字面与现状逐字一致 |
| `tools/agent-model/render/sections.mjs:122` | must 段：`defaultLanding` 为 null 时渲染 `> 判定只记入本轮评审账本，不写盘。`；否则保持 `> 判定写回 <file>。` | 同上 |
| `tools/agent-model/render/sections.mjs:184` | outputs 段：`items` 为空返回 `[]`（不留空标题，遵循 P1「空段跳过」） | 与 P1 现有空段约定一致 |
| `tmp/agent-criteria-demo/test-p1.test.mjs:246-281` | 卡片数 7→8、`sandbox/*.md` 8→9（新增席后必须同步，否则回归假红） | 断言仍是「文件数 = 模型数 + 1」 |
| `tmp/agent-criteria-demo/diff-report.mjs:10` | `SEATS` 追加 `reviewer-product` | 报告 8 行 + K 表 |

## 4 reviewer-product 模型映射

| 模型键 | 取值来源（`agents/reviewer-product.md`） |
|---|---|
| `seat.id/display` | `reviewer-product` / `产品` |
| `seat.triggers` | 卡面「当议长调度对 PRD、spec、plan 做产品视角评审」→ 新增共享 perspective `product`（`产品视角`）+ objects 复用 `any-document` |
| `seat.artifacts` | `[]`（零写） |
| `seat.tier` | `readOnly`（policy `__default__` 推导一致） |
| `duty` | verb 评审 / scope 产品视角 / objects 任意交付文档 / emit 判定、理由 / `landingLabel: 问题卡` |
| `checklist` | 7 项：用户旅程、边界场景、交付节奏、逃生路径、隐含前置、成功指标、非目标 |
| `checkCriteria` | 7 键共用 `fieldNonEmpty issueCardFull.quote`（含 negative） |
| `outputFormat` | 卡面 9 字段 + 3 条校验（证据三列、建议解法非空、P0 需两处证据） |
| `must` / `never` | 仅共享层（D2） |
| `templates` / `forms` / `outputs` | `{}` / `{}` / `[]` |
| `defaultLanding` | `null` |
| `permissions` | action allow `review,record`，forbid `adjudicate,interrupt,self-disposal`；write/command 皆空 |
| `escalation` | `null` |
| `boundary` | `default`（渲染结果与卡面边界句逐字相同，`patternRegistry.mjs:13`） |

## 5 验收

| # | 命令 | 通过判据 |
|---|---|---|
| G1 | `node --test tmp/agent-criteria-demo/test-p1.test.mjs` | `pass 29` / `fail 0`（P1 原有 7 席渲染字节不变；卡片/报告计数改为按模型数派生） |
| G2 | `node tools/agent-model/verify-models.mjs` | N 行 `EQUIVALENT`（N = `models/*-model.json` 数，本轮 11），exit 0 |
| G3 | `node tmp/agent-criteria-demo/render-all.mjs && node tmp/agent-criteria-demo/diff-report.mjs` | `sandbox/*.md` = N + 1（本轮 12） |
| G4 | 渲染产物 `sandbox/reviewer-product.md` | 无 `产出` 段（零写）、有 `权限` 段；无 `写回 。` / 无空标题；duty 行含 `问题卡（只记入评审账本，不写文件）` |
| G5 | 段级 diff vs `agents/reviewer-product.md` | 段数 8/7（沙箱多 `权限`，无 `产出`）；边界段逐字相等；其余段差异仅限 K1（多权限段）与 K2（判据/措辞由 observable 派生）；无 `写回 。`、无空标题 |
| G6 | `npm run check` | 末行 `check 全部通过` |
| G7 | `scs check skills ... --json` | `findings` 为空（schema 改动不引入技能违规） |
| G8 | `node --test tools/agent-model/test/boundary-source.test.mjs` | 3 条全过：渲染正文 = 声明来源；有写权限席必须 `policy`；`default` 仅当卡面 = 默认句 |

## 6 风险与留观

| 风险 | 处置 |
|---|---|
| 7 条清单判据渲染后同形（D3） | 记入 `report-round2` 缺口；若要逐项差异，需给 criterion 增 per-item scope，单独立项 |
| `defaultLanding: null` 影响 7 张现模型 | G1 字节回归兜底；现有模型全是 string，不进新分支 |
| 共享层加 `product` perspective 与 4+4 条 `appliesWhen` | 只增不改；`verify` 的 `TRIGGER_UNKNOWN`/`POLICY_DIFF` 会拦住拼错 |
| policy 未登记 reviewer-product | 本轮不改 policy；`__default__` 的 readOnly + artifacts=[] 与卡面一致 |
