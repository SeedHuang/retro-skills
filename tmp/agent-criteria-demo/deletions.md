# 删除账（6 张现役卡）

> 判据：result §2（唯一标准）、§4（结构冗余）、methodology §5（三种修辞）+ P0（归位）
> 每条只回答一件事：删掉这句，执行结果会不会变。
> 对象：`agents/` 下 6 张卡；模型现状指 `models/<name>-model.json`

## 判据速查

| # | 判据 | 来源 |
|---|---|---|
| 1 | 删掉这句，执行结果会不会变 | result L26 |
| 2 | 「我读着像废话」不能当判据 | result L30 |
| 3 | 「字面重复」不能当判据 | result L31 |
| 4 | 可删两类：别处已有 / 指向不存在 | result L33-35 |
| 5 | 一个信息只出现一次 | result L124 |
| 6 | 白名单与黑名单二选一 | result L126 |
| 7 | 只凭阅读判断不了，得看删后行为 | result L130 |
| 8 | 对仗 / 口号 / 俗语必须删或重写 | methodology L150-156 |
| 9 | 归不进任何维 → 下沉 skill | methodology L26 |

## D 类：可删（删了行为不变）

| # | 卡 | 位置 | 原文 | 依据 | 模型现状 |
|---|---|---|---|---|---|
| D1 | 6 张 | 本席清单上方 | 「类别：A、B、C」 | 5（清单表已有条目列） | 未建，无需回改 |
| D2 | actuary / ai | 输出校验 L67-72 | 与 L63-69 重复的三条（缺字段=废卡 / 证据三列 / 建议解法空） | 5 | 已合并为 3 条 |
| D3 | detective | L68 | 「归档后 `docs/superpowers/reviews/<本次>/`」 | 4（归档不由本席执行） | 未建 |
| D4 | detective | L70 | 「（只由议长写，段二 / 段三由议长从责任席的产出转录）」 | 4（解释别人怎么干活） | 未建 |
| D5 | detective | L70 | 「以及 ③ 所列全部路径」 | 4（卡上没有 ③） | 未建 |
| D6 | detective | L72 | 「兜底句：凡 `.gitignore` 覆盖的路径一律禁止写入」 | 6（与白名单冲突：白名单已排他） | 未建 |
| D7 | detective | L74 | 「（逐条命令不在本卡重复）」 | 4（说了去哪找也没说） | 未建 |
| D8 | detective | L76 | 「其中 `draft`（生成）只指生成动作；白名单里 `draft` 带子命令的那条只读形态不在此列」 | 4（白名单已限定，无需解释） | 未建 |
| D9 | detective | L80 | 「检测门强化归 S5-B」 | 9（开发待办，不是执行规则） | 未建，应转 issue |
| D10 | detective | L66 | 「不假装白名单」 | 8（口号，无观测面） | 未建 |

## S 类：下沉（内容对，但不属于本席）

| # | 卡 | 位置 | 原文 | 去向 |
|---|---|---|---|---|
| S1 | detective | L78 | 「交审计在 `round-check.md` 独立复算」 | 审计席卡 / 流程文档 |
| S2 | detective | L80 | 「复算由独立于越权者的核验席完成，结论记入核签行」 | 流程文档 |
| S3 | detective | L80 | 「可复原 → 复原命令由你给出、用户执行（禁 agent 自跑 `checkout` / `restore`）」 | 流程文档（含一条禁令，可回卡） |

## C 类：转注（保留信息，改成字段说明）

| # | 卡 | 位置 | 原文 | 去向 |
|---|---|---|---|---|
| C1 | detective | L66 | 「档位事实：本卡实际权限 = `producer` 档：Read / Glob / Grep / Write / Edit / RunCommand 整档授予」 | `seat.capabilityLimit` |
| C2 | detective | L66 | 「平台无参数级授权」 | `seat.capabilityLimit.rule` |
| C3 | detective | L80 | 「`DETECTION_BLIND_SPOTS` 被 gitignore、草稿目录在仓外、已提交写与写后还原都看不见」 | `escalation.detectionLimit.blindSpots` |

## P 类：疑似错配（删了行为会变，不能擅自删）

| # | 卡 | 位置 | 原文 | 为什么可疑 | 处置 |
|---|---|---|---|---|---|
| P1 | evidence-reader | L18-22 | 「一定会」5 行：要求检查交付物立场、证据、术语 | 只读取证席不产出交付物 | 待确认：是交叉校验设计，还是模板误套 |
| P2 | evidence-reader | L25-28 | 「禁止」4 行：不得只提问题不给解法等 | 该席不写文件、不给解法 | 待确认 |
| P3 | respondent-architect | L18 | 「无问题时显式写全过、无问题」 | 答辩席是核实方，不是交付方 | 待确认 |
| P4 | respondent-dev | L18 | 同上 | 同上 | 待确认 |
| P5 | detective | L18-22 | 「一定会」5 行 | 观察席不产出交付物正文 | 待确认 |
| P6 | detective | L25-28 | 「禁止」4 行 | 该席只写 detective.md，不给解法、不填表 | 待确认 |

## 结论

- D 类：10 条，删了行为不变；其中只有 D2 已在模型里处理，其余 9 条本来就没建进模型
- S 类：3 条，应下沉，模型里未建（正确）
- C 类：3 条，已转字段
- P 类：6 条，**根因已定位**

### 后续轮次已处理

| 事项 | 处置 |
|---|---|
| 6 张卡全部建模 + 瘦身（extends + 共享块） | 7 张 `EQUIVALENT` |
| 权限四处表达 | 收敛为 `permissions.{action,write,command}` 一处 |
| 判据摘要手写 | 删除，由 `observable` 派生（规则 40） |
| 自证型布尔 | 5 处改外部事实，`declaration` 改 `lineAbsent` |
| 产物按席命名 | 按 `outputKind` 统一 + 分节 |
| reviewer-audit 手写 draft | 删除，改由 `render-card.mjs` 渲染到 `output/` |

### P 类的根因

[shared-actions.mjs:88-102](file:///d:/Seed/retro-skills/tools/docgen/builders/agents/card-model/vocab/shared-actions.mjs#L88-L102)：

```js
export const SHARED_USE = Object.freeze({
  'reviewer-audit': ALL_SHARED,
  ...
  'detective-observer': ALL_SHARED,
  'evidence-reader': ALL_SHARED,
})
```

14 席全部 = `ALL_SHARED`。所以：

- 不是模板误套，是**机制设计成了全量继承**
- 白名单形式存在，实际没有一席裁剪
- 取证席检查「交付物立场不偏」这类条目，是机制的必然产物

要修这一条，必须改 `SHARED_USE` 按席裁剪，属于现役运行代码。本轮不动，只记录。

### 待决策

| 选项 | 做法 | 影响面 |
|---|---|---|
| A | 只记录，不动代码 | 模型继续背着 6 条错配 |
| B | 按席裁剪 `SHARED_USE`，另立共享组（如 `READ_ONLY_SHARED` / `RESPONDENT_SHARED`） | 动现役代码 + 15 席卡面 |
| C | 在模型层加 `appliesWhen` 条件，让共享条目按席过滤 | 改 schema，不动 SHARED_USE |

D/S/C 三类不需要再动模型。
