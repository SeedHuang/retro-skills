# 设计方案：数据 → 脚本投影（零人工翻译）

> 状态：**设计记录，未落地**。按用户要求，本次不改动正在运行的代码（`tools/docgen/builders/rules/*`）与任何 agent 卡，只在 `tmp/agent-criteria-demo/` 内演示。
> 关联：[result.md](result.md) §8.7–§8.9；判定样例与现状见该文件。

## 0 核心要求（用户原话要点）

1. 建模产物定稿后，**引擎机械产出** markdown 判据 / 卡面片段；
2. 产出物必须**AI 可理解、逻辑顺畅、不漂移**（逐字节可复现）；
3. 润色也走**固定 script**，不许在生成环节插人工/AI 翻译；
4. 同一套流程覆盖判据、skill、agent、rule 等所有产物。

## 1 现状缺口

| 环节 | 现在 | 问题 |
|---|---|---|
| 建模 | `{label, op:'notMatches', pattern:'…'}` | 人读语义在产物里**没有位置**，只剩一条正则 |
| 渲染 | `PREDICATE.notMatches` → 「不得匹配 `正则`」 | 字节确定，但 AI/人读不懂 |
| 翻译 | 由人把正则分支翻成「export VAR=…」等枚举 | 即「中间翻译」：慢、会漂（本次改了 3 版才对） |
| 防漂 | 靠人评审 | 无判据；text 与 pattern 可各说各话 |

根因：**`pattern` 是唯一真相，人读表述是它的副本且无来源**。

## 2 设计：一份数据，两个投影

### 2.1 通用形式：一条「轴」（所有场景共用）

一个受控面 = 一条轴：

```json
{ "subject": "command", "policy": "denyByDefault", "allow": ["<formId>"], "forbid": [] }
```

| 项 | 取值 | 说明 |
|---|---|---|
| `subject` | `command` / `writePath` / `paramForm` / `envForm` / … | 受控的是哪一类东西 |
| `policy` | `denyByDefault` / `allowByDefault` | **默认值必须显式写**，不靠口头约定 |
| `allow` / `forbid` | 登记过的 form ID 数组 | 只放 ID，不放裸字符串（守 closed-world） |

两条默认值对应两套判词与判定，**由同一个引擎提供**：

| policy | 判定 | 判据谓词（固定） | 卡面句式（固定） |
|---|---|---|---|
| `denyByDefault` | `allow` 至少命中一条 | 必须以以下任一项开头：A / B / … | 只许以下项（名单外一律禁止）：A / B / … |
| `allowByDefault` | `forbid` 全部不命中 | 不得出现以下任一：A / B / … | 默认允许；禁止任何 {集合名}：A / B / … |

句式由 `policy` 选词，不留手写空间：**对象唯一 → `禁止 X`；对象是集合 → `禁止任何 {集合名}：{枚举}`**；允许侧统一 `只许 …`。

显示面同样进数据：层级由 `groups[] → groups[].axes[]` 表达（`title` 即组标题），`forms[].group` 决定同组是否合并成一行——渲染器不按顺序猜分组。

「允许所有 X，除了 Y」不需要第五种句式：它就是 `allowByDefault + forbid:[Y]`，卡面写「默认允许；禁止任何 {集合名}：Y」——「默认允许」把 policy 显式说出来，避免读者把「没列出的」误读成禁止。

两条约束：① 同一条轴**不要同时给 `allow` 与 `forbid`**（同轴混合需要仲裁，且 `longestAllowWins` 只对首位前缀成立，对命令中段参数无效）；需要例外就把例外从 `forbid` 删掉。② `allowByDefault` 可判的前提是 subject 可观测：命令串可取到，所以形态轴可判；写入动作没有逐次记录时只能 `denyByDefault` 穷举。

不可机判的行为禁令（如「不得裁决他人分歧」「不得中断评审」）**已收敛进 `permissions.action.forbid`**，定义住在共享的 `permissionGroups`：能检测的挂 `signal`，不能检测的挂 `residual { sample, fields, objective }`，两者都没有则校验器报 `PermissionUnobservable`。`bans[]` 段已删除。

「任何」是全称量词，但判据只覆盖已登记的 form；未登记形态归 `<id>.testcase.json` 的 residual 人工抽检，**不得靠句子兜**。

场景只需给「轴清单 + ID + 默认值」，引擎零改动——这就是「通用形式」的落点。

```json
{
  "groups": [
    { "subject": "command", "title": "跑命令", "axes": [
      { "label": "命令白名单", "policy": "denyByDefault",  "allow": ["cmd.git.log", "cmd.scs.time"] },
      { "label": "写盘形态",   "policy": "allowByDefault", "forbid": ["form.fs.write"] },
      { "label": "变量赋值形态", "policy": "allowByDefault", "forbid": ["form.env.assign"] }
    ]},
    { "subject": "writePath", "title": "写文件", "axes": [
      { "label": "允许落点", "policy": "denyByDefault",  "allow": ["artifact.round-check", "artifact.delivery-audit"] },
      { "label": "路径形态", "policy": "allowByDefault", "forbid": ["path.parentEscape"] }
    ]}
  ]
}
```

每个 form ID 在定义层登记 `{id, text, pattern}`：渲染取 `text`，判定取 `pattern` / 前缀。**本仓已有三对同构结构，可被这套形式统一**：`commandGroups` + `forbiddenGroups`（命令轴）、`pathGroups`（路径轴）、`artifacts`（写文件轴）、`env.assign`（envForm 轴）。

### 2.2 产物模型：`forms`

```json
{
  "label": "变量赋值",
  "op": "notMatchAnyOf",
  "field": "command",
  "probe": { "kind": "manual" },
  "forms": [
    { "text": "export VAR=…",      "pattern": "export\\s+\\w+\\s*=" },
    { "text": "set VAR=…",         "pattern": "set\\s+\\w+\\s*=" },
    { "text": "setx VAR …",        "pattern": "setx\\s+\\w+" },
    { "text": "env VAR=… <命令>",  "pattern": "env\\s+\\w+=" },
    { "text": "$env:VAR=…",        "pattern": "\\$env:\\w+\\s*=" },
    { "text": "VAR=… <命令> 前缀", "pattern": "^\\s*(\\w+=\\S*\\s+)+(\\S)" },
    { "text": "整行 VAR=…",        "pattern": "^\\s*\\w+=\\S*\\s*$" }
  ]
}
```

- `text`：给人/AI 读的形态；`pattern`：机器判的片段。**同一条 form 内两者绑定**，改一处必须改另一处。
- 引擎只读这一份数组，两个投影都由它生成。

### 2.3 新算子 `notMatchAnyOf`

| 面 | 实现 |
|---|---|
| 判定 | `!(forms.some(f => new RegExp(f.pattern).test(String(v ?? ''))))` |
| 谓词渲染 | `不得出现以下任一：${forms.map(f => f.text).join(' / ')}` |
| 结构校验 | `forms` 非空；每项 `text`/`pattern` 非空且 `pattern` 可编译；`text`、`pattern` 各自去重 |

新增算子 = 改 DSL 本体（`OPS` 18→19 + `PREDICATE` + 校验 + 算子数断言），**不是**改建模。

### 2.4 双投影同源

```
forms[] ──┬─ 判据正文：不得出现以下任一：export VAR=… / set VAR=… / …（AI 可读）
          ├─ 判定：任一 pattern 命中即 fail（机器确定）
          └─ 卡面句：同数组裁剪成一句（与判据逐字同源）
```

同一个数组、同一个渲染器 → 不存在「卡面与判据不同步」。

### 2.5 防漂判据 `FormUncovered`

每个 `form` 必须在 `<id>.testcase.json` 里有 **≥1 条 fail 样例**；缺一条即红。

- 这条门把 `text` 与 `pattern` 钉在一起：`text` 声称 `setx VAR 1` 是违规，而 `pattern` 没覆盖它 → 样例 pass → 红。
- 不靠人评审、不靠 AI 自查。

## 3 通则：所有产物同构

| 产物 | 数据 | 投影器 | 现状 |
|---|---|---|---|
| 判据正文 | `dsl/rules/<id>.json` | `builders/rules/build.mjs` | 已有，缺 `forms` |
| agent 卡 | `agentData` + 策略数据 | `renderByName` + `cli.mjs` | 已有 |
| 账本模板 | `outputFormats.docs` | `ledger.mjs` | 已有 |
| skill / rule 正文 | 各自数据源 | 各自生成器 | 部分手工 |

约定写成硬规则：**给人读的句子必须有数据字段来源；数据表达不了就先加字段，不许在生成环节写句子。**

上表四类产物共用同一套「轴 + 默认值 + 同源投影」：判据判命令轴/形态轴，卡面渲染同一批轴，模板渲染写文件轴，规则正文渲染自己的轴。场景差异只在数据，引擎不分支。

## 4 本轮边界

- 不改 `tools/docgen/**` 与 `agents/*.md`（现役卡与自动提交都不碰）；
- 只在 `models/` 建模、`output/` 渲染；
- 权限模型已从 `groups + constraint + bans` 收敛为 `permissions`，本文 §2.1 的轴设计是其前身。

## 5 在现役落地的清单（未执行）

1. `schema.mjs`：加 `notMatchAnyOf`（`OPS` + `PREDICATE` + `forms` 校验 + `FormUncovered`）。
2. `builders/rules/build.mjs`：样例覆盖门接 `FormUncovered`。
3. 把现有 `no-git-write` 等规则按需迁到 `forms`（可选，迁移才用，不强制）。
4. 更新算子数断言与 `criteria-dsl.md`。
5. 验证：`node tools/docgen/builders/rules/build.mjs` → `rule-dsl ok`；`npm run check:criteria` → `criteria-engine ok`；正反例各 ≥1。

## 6 验收（设计层自检）

- [ ] 判据正文不含正则原文，只含 `text` 枚举；
- [ ] 每个 `text` 都有对应 fail 样例（`FormUncovered` 为 0）；
- [ ] 同一数组重复渲染两次逐字节相同；
- [ ] 卡面句与判据句来自同一数组，无手写差异。
