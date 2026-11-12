---
name: agent-modeling
description: 把 agent 卡面 markdown 拆成模型 JSON、再由确定性渲染回卡面的七阶建模流程；产出草稿模型与预览，不写 agents/。当用户要「给某席建模 / 把卡面拆成模型 / 从一句话生成 agent 草稿 / 校验模型等价」时使用。Do not use for 评测席卡质量（走 parliament）、起草规则（走 rule-writer）。
---

# agent-modeling：卡面 ↔ 模型

把一张 `agents/<seat>.md`（或用户口述的职责）拆成 `jsons/<seat>/index.json`，再用引擎渲染回卡面；拆解中的每个缺口都要落到可判字段，落不下就回退改文案。

## 触发条件

- 用户给一份卡面/职责描述，要产出或修订模型 JSON。
- 用户要对某个模型做等价校验（展开后是否与基线一致）或单卡渲染预览。
- 用户要为 P4 的未建模席先出草稿。

**不触发**：评审席卡写得好不好（走 `parliament`）；写规则文件（走 `rule-writer`）；只改渲染器代码（直接改 `tools/docgen/models/agents/render/`）。

## 七阶流程

按 `references/grammar-gaps.md` 的拆解算子执行，每一阶做完核对门，门不过停在本阶：

| 阶 | 做什么 | 门（不过即停） |
|---|---|---|
| P0 归位 | 判断这句话属于哪个维度 | 归不进任何维 → 它不属于 agent，下沉到 skill |
| P1 拆解 | 句 → 子句 → 要素 → 叶子 | 拆不动的叶子必须标 `NeedTranslate` 或 `NeedDef`，不许留自由字符串 |
| P2 定义 | 抽象谓词用「属加种差」展开 | 给不出定义 → 交人，不许自造 |
| P3 判据化 | 属性落成 `observable[]` + `verify` | 落不到字段 → 回 P2 |
| P4 重写 | 用要素重述文案 | 新文案必须能反推回同一判据 |
| P5 验证 | 负例必失败、渲染字节不变、命令可判 | 任一不成立 → 回 P3 |
| P6 收口 | 卡面零手写逻辑，文案由引擎出 | 还有手写逻辑 → 未收口 |

字段键、`extends` / 浅合并、展开顺序见 `references/model-schema.md`；权限三维见 `references/permissions.md`。

## 与引擎的接口

引擎在 `tools/docgen/models/agents/`（本 skill 只调用，不复制实现）。

```powershell
# 以下命令在技能目录（含 scripts/ 的那一层）下执行
# 校验单个模型：展开 + 类型 + 权限 + 标题；带 --ref 时追加等价比对
node scripts/verify.mjs <model.json> [--ref <model.json>] [--shared <shared.json>]

# 渲染单卡到 drafts/<seat>.md
node scripts/render.mjs <model.json> [--out <dir>] [--shared <shared.json>]
```

状态词：`EQUIVALENT` = 该席有 `_baseline` 且展开后与基线相等；`CHECKS_PASS` = 无基线可比的草稿只过了全部校验码；`FAIL` = 有码。`--shared` 会真正替换共享层参与展开与比对（可用于验证共享层改动的影响）。

退出码：`verify` 无码且（若给 `--ref`）等价 → 0，否则 1；`render` 成功 → 0，抛错 → 1。逐码含义与复现手法见 `references/checks.md`。

## 硬约束

1. **只写 `drafts/`**：草稿模型与预览落 `drafts/`（该目录不进 git）；禁止写 `agents/**`。
2. **不改引擎**：渲染/校验逻辑只有 `tools/docgen/models/agents/` 一份；发现要改，先改引擎再回到本流程。
3. **不手写派生文本**：`outputFormat.checks[].text`、`checkCriteria.summary` 这类派生文本禁止手写，由 `observable` 派生（否则引擎报 `OUTPUT_TEXT_HANDWRITTEN` / `TitleDrift`）。

## 做完核对（缺一不合格）

1. 跑 `verify.mjs`，首行含 `EQUIVALENT`，退出码 0。
2. 跑 `render.mjs`，`drafts/<seat>.md` 生成且 `## ` 段顺序与现役卡一致。
3. 若本席已建模，加 `--ref` 指向现模型，首行含 `REF_EQUIVALENT`。

## 参考文件

- `references/grammar-gaps.md`：八类语法部件、缺口四元组、四型断点、四态终止。拆解前按它判定叶子态，产出「缺口四元组清单」。
- `references/checks.md`：校验码全集与每码的最小复现。校验失败时按码定位，产出「码 → 修法」对照。
- `references/model-schema.md`：模型键与展开规则。写新模型前按它列键，产出完整键表。
- `references/permissions.md`：权限三维与 `permissionGroups`。动权限前按它核对三维，产出与 `seat.artifacts` 一致的写清单。
