# 设计：Agent 卡边界三段化（权限 / 禁止事项 / 越界处置）v4

> 状态：立项草案 v4（2026-11-13）。已收口，准备开工。
> v4 修订依据：sdet 与审计对 v3 的复核（HEAD 基线翻转、B3 改键无效、标记位置悬空、任务不能分批、policy+null 未定义）。
> 范围：`tools/docgen` 渲染层与检查层；**模型 JSON 不改**。

## 1. 目标

1. 每个事实只出现在一个段，标题即可路由。
2. 不新增模型字段：三节由现有 `boundary.kind` + 策略数据派生。
3. 只读席保持两段：`## 权限` + `## 边界`。

## 2. 现状（v3 修正锚点）

| 事实 | 位置 |
|---|---|
| 段顺序数组 | `tools/docgen/models/agents/render/index.mjs:9-11` |
| 边界固定输出 `## 边界` | `tools/docgen/models/agents/render/sections.mjs:243-251` |
| `renderBoundary` 定义 | `tools/docgen/builders/agents/components/renderBoundary.mjs:277-285` |
| 边界正文调用点 | `tools/docgen/models/agents/render/sections.mjs:246` |
| `escalation` 三种 kind | `tools/docgen/models/agents/render/sections.mjs:234-239` |
| A6 现判「有 `## 边界`」 | `tools/execution-matrix/check-agent.mjs:139`、`criteria.md:82` |
| B3 判定对象 | `tools/execution-matrix/criteria.md:134-141` |
| 段序测试 | `tools/docgen/models/agents/test/c5-matrix.test.mjs:100-106` |
| 段函数非空测试 | `tools/docgen/models/agents/test/c5-matrix.test.mjs:92-98` |
| 边界来源测试 | `tools/docgen/models/agents/test/boundary-source.test.mjs:17-20` |
| `validatePolicy` 槽集校验 | `tools/docgen/builders/agents/components/validatePolicy.mjs:293-301` |
| `boundaryBySeat` 旧调用方 | `tools/docgen/builders/agents/components/patternRegistry.mjs:33-40` |
| 模型边界校验入口 | `tools/docgen/models/agents/verify-models.mjs:131-137` |

## 3. 决策

| # | 决策 | 理由 |
|---|---|---|
| D1 | 不改模型 JSON；模板 + `sections.mjs` 是事实生产者 | 三节是视图；`boundary.kind` 继续表达来源 |
| D2 | policy 席三段：`## 权限` / `## 禁止事项` / `## 越界处置` | 允许 / 禁止 / 事故 |
| D3 | default（及已废弃 literal）席两段：`## 权限` / `## 边界` | 只读席无写无命令 |
| D4 | 越界处置 = 模型 3 步 + 边界后处理正文；不扩 kind | 避免牵动类型系统与基线 |
| D5 | 模板只加标记；`renderBoundary` 剥离标记后**逐字节保持旧输出** | 旧调用方与既有测试零变化 |
| D6 | `boundary.kind` 为 default/literal 时 `escalation` 必须为 `null`；校验落 `verify-models` 的 `boundaryBad` | `validatePolicy` 拿不到模型 JSON |
| D7 | literal 与 default 同形；不新增 fixture | 现有测试禁止声明 literal |
| D8 | **不新增「判定索引」卡面文本** | 重复已有指针且不完整；审计依据索引写进本文附录，不进卡 |

### 3.1 事实唯一归属

| 事实 | 唯一归属 |
|---|---|
| 身份 / 档位事实 / 平台限制 | `## 权限`（模板第 1-3 行） |
| 允许写（文件 + 落点）/ 职责 / 允许跑 | `## 权限`（现有 bullet，位置不变） |
| 不裁决他人分歧 / 无中断评审权力（模板第 4 行） | `## 禁止事项` 首句（标记必须插在该行之前） |
| 禁止写 / 禁止命令 / 命令默认拒绝 | `## 禁止事项` |
| 模型 `escalation.steps` | `## 越界处置` 开头（保持原顺序与编号） |
| 越权记录与复算 / 复原 / 轮初快照 | `## 越界处置` 中段 |
| 检测限度（含检测命令与盲区） | `## 越界处置` 末尾 |

> 检测限度留在 `## 越界处置`：它在模板中位于越权记录之后；这样三标记切分与「`renderBoundary` 逐字节不变」同时成立。

### 3.2 分类只用一种判据

- **渲染 / 校验 / 测试**统一用 `boundary.kind`（policy / default / literal）。
- **A6 不再按 frontmatter `tools` 分型**；它只判「形态自洽 + 互斥」，kind→形态的对应由 docgen 的 `boundary-source` 守卫和 gate 保证。

## 4. 目标结构

policy 席：

```markdown
## 权限
**身份**：…
**档位事实**：… 整档授予；档位授予 ≠ 许可范围。
**平台限制**：…
- 写文件：…
- 职责：…
- 跑命令：…

## 禁止事项
**禁止写**：…
**禁止命令**：…
**命令默认拒绝**：…
**本人限度**：不裁决他人分歧；无中断评审的权力。

## 越界处置
1. 停手。                        ← 仅模型有 escalation 的席
2. 越权信息报议长：…
3. 本轮结论作废，报用户。
**越权记录与复算**：…
**检测限度**：…
```

default 席：

```markdown
## 权限
- 写文件：不得写任何文件
- 跑命令：不跑任何命令

## 边界
你是只读评审角色：不得创建、修改、删除任何文件；…
```

> 结构示意，实现时不得据此改字；正文来自模板槽与模型字段。

## 5. 实现方案

### 5.1 模板与拆分

`templates/boundary.md.tpl` 插入三个标记，各独占一行：

```text
<!--part:authority-->
已知身份 / 档位 / 平台段落

<!--part:ban-->
**不裁决他人分歧；无中断评审的权力。**（原模板第 4 行，无标签改写）
禁止写 / 禁止命令 / 命令默认拒绝

<!--part:aftermath-->
越权记录与复算 / 检测限度
```

- `<!--part:ban-->` 必须插在模板第 4 行「不裁决…」**之前**；authority 只含第 1-3 行。
- 标记各独占一行；删除时只删标记行及其行尾换行，不删前导换行。

实现：

- `renderRaw(seat, M)`：现有 TPL 替换逻辑，**保留标记**。
- `boundaryParts(seat, M)`：`renderRaw` 按 `/\n?<!--part:([a-z]+)-->\n?/` 切分，`trim()` 每段；缺标记 → `TemplateImpure`（片段 = `part:<name>`，与现役 `<tpl>:<fragment>` 格式一致）。
- `renderBoundary(seat, M)`：删除三行标记（连同行尾换行）后返回完整正文 → **与改造前逐字节相同**。
- `renderAuthority` / `renderBan` / `renderAftermath`：分别返回三段，供 `sections` 消费。
- `patternRegistry.boundaryBySeat` 不变；加测试：逐席 `renderBoundary` 输出 == 改造前卡面 `## 边界` 正文（基线取 `git show HEAD:agents/<seat>.md`）。

### 5.2 段渲染

`sections.mjs`：

- `permissions(M)`：policy 席 = `renderAuthority` 行 + 现有写/职责/命令行；default 不变。
- 新增 `ban(M)`：policy → `['## 禁止事项', renderBan, '']`；default → `[]`。
- `escalation(M)`：
  - policy → 恒输出 `## 越界处置`：有 `escalation` 时先渲染 3 步，再追加 `renderAftermath`；无 `escalation` 时只输出 `renderAftermath`；
  - default/literal → `[]`。
- `boundary(M)`：policy → `[]`；default/literal → 原 `## 边界` 正文。
- 标题使用全等字符串；标题级别固定二级。

### 5.3 段序

`render/index.mjs:9-11`：

```js
['frontmatter','duty','must','never','conflict','checklist','outputFormat','outputs','permissions','ban','escalation','boundary']
```

### 5.4 A6（不依赖 tools）

A6 = 下列两种形态**恰好一种**成立：

| 形态 | 判据 |
|---|---|
| 只读 | 二级 `## 权限` 恰好 1 个、`## 边界` 恰好 1 个；无 `## 禁止事项`、无 `## 越界处置`；两节正文非空 |
| 写权限 | 二级 `## 权限`、`## 禁止事项`、`## 越界处置` 各恰好 1 个；无 `## 边界`；三节正文非空；顺序 `权限 < 禁止事项 < 越界处置` |

- 标题判定：`level === 2 && heading.trim() === '权限'`（全等，不用 `startsWith`）
- 围栏内伪标题由现有 `splitSections` 跳过
- `tools` 缺失 / 异常不影响 A6
- kind→形态的对应由 `boundary-source` 与 gate 判，不在 A6 重复判
- **policy + `escalation=null`**：`## 越界处置` 允许只有越权记录与检测限度；A6 只要求该节正文非空，不要求必须有编号步骤

### 5.5 B3（写全新判据）

`criteria.md:134-141` 改为：

| 类型 | 判定对象 | 失败条件（任一即 miss） |
|---|---|---|
| policy | 职责段 vs `## 权限` + `## 禁止事项` | 职责声明的写落点或命令不在 `## 权限` 的白名单 / 写作用域内；职责中的禁止性表述与 `## 禁止事项` 相反；职责承诺了 `## 越界处置` 未覆盖的处置动作（`escalation=null` 时职责不得承诺处置） |
| default / literal | 职责段 vs `## 权限` + `## 边界` | 职责声明任何写盘或命令；职责与 `## 边界` 的只读约束相反 |

同时：

- **直接覆写** `.inspector-annotations.json` 中现有 `:B3` 值为 `pending`（不改键；`check-agent.mjs:167` 只读 `:B3`）。
- 重判必须由独立实例完成，并留痕（`judgedBy` / `rejudge-<席>-B3.md` / `changes[]`）。
- 验收加一条：18 席 `:B3` 全部非 `pending`。
- `criteria.md` 文件头补一行改版记录，并注明本 spec 取代上游 R5 中 A6/B3 的对应句；`:45`、`:81-82`、`:194` 同步。

### 5.6 D6 校验

`verify-models.mjs` 的 `boundaryBad` 增加：

```text
const b = model.boundary
(b.kind === 'default' || b.kind === 'literal') && model.escalation != null
→ BOUNDARY_DEFAULT_WITH_ESCALATION
```

### 5.7 回归清单

| 文件 | 改动 |
|---|---|
| `test/c5-matrix.test.mjs:92-98` | 「每段非空」改为按 kind 分支：policy 的 `boundary` 期望 `[]` |
| `test/c5-matrix.test.mjs:100-106` | 段序数组改为 `… permissions → ban → escalation → boundary` |
| `test/render-sections.test.mjs:34` | 补 `boundary.kind` 分支：default + null → `[]`；policy + null → `## 越界处置` |
| `test/boundary-source.test.mjs` | 改为围栏感知切段；policy 断言 `禁止事项` + `越界处置`（步骤 + aftermath）；default 断言 `边界` |
| `test/boundary-write-policy.test.mjs` | 依赖完整 `renderBoundary`（D5 保证），应保持绿 |
| `test/command-single-source.test.mjs` | 检测句现在应在 `越界处置`；补位置断言 |
| `execution-matrix/check-agent.test.mjs:169-255` | A6 新形态正反例；手写卡无 `tools` 不再影响 |
| `components/patternRegistry.mjs:33-40` | `boundaryBySeat` 值不变（逐字节测试） |
| `components/dumpPolicy.mjs` | 槽集未变，应保持绿 |
| `components/validatePolicy.mjs:293-301` | 槽集校验未变；D6 不在本文件 |

## 6. 验收（v3 可机械判定）

1. **结构**（A6 同款）：上述「恰好一种形态」；标题二级、全等、各 1 个、正文非空。
2. **`renderBoundary` 逐字节不变**：逐席 `renderBoundary(seat, M)` == **冻结 golden**（`test/fixtures/boundary-baseline.json`，改造前从 `agents/<seat>.md` 抓取并入库）；**不使用 `git show HEAD`**（合入后会翻转）。default 席改为读 `agents/<seat>.md` 的正文与 `DEFAULT_BOUNDARY` 比对，不以渲染函数自证。
3. **块级映射**（仅 policy；从**渲染后的新卡**切节，不用 `boundaryParts` 自证）：
   - `## 权限` 的 **authority 段**（从节首到第一条 `- ` 之前，`trim()`）== `boundaryParts.authority`
   - `## 禁止事项` 正文 == `boundaryParts.ban`
   - `## 越界处置` 正文 == `旧 ## 越界处置 步骤正文（有则加） + '\n' + boundaryParts.aftermath`
   - 每块缺失或出现 >1 次均红；正文按原字符串精确比较（含段内空行）
4. **负例必须红**：① 把 `禁止写` 首行挪到 authority 末尾；② 删除 `禁止命令` 与 `命令默认拒绝` 之间的空行；③ 重复一行命令；④ 在 policy 卡保留 `## 边界`。
5. **回归**：`gate` 18/18、`baseline 19/19`；`npm run check` 全绿；B3 重判后全绿。

## 7. 风险

| # | 风险 | 缓解 |
|---|---|---|
| R1 | 改字/丢行/空行 | 验收 2/3/4：逐字节 + 块级精确 + 负例 |
| R2 | A6 假绿 | 二级全等 + 计数 + 互斥 + 正文非空 |
| R3 | 其他 `## 边界` 引用 | `tools/observation-check/render.mjs:96` 是 demo，不改；`skills/parliament/assets/agent-template.md:30` 在 T3 决定是否同步；`tools/execution-matrix/README.md:16` 是说明节，不动 |
| R4 | 双生产者漂移 | 验收 3 的 authority 段 == `boundaryParts.authority`（精确，不排序） |
| R5 | default + escalation | D6 校验码 |
| R6 | B3 旧注解假绿 | 重置 `pending` 后重判 |

## 8. 任务拆分

| # | 任务 | 独立验收 |
|---|---|---|
| T1 | 模板三标记 + `renderRaw` / `boundaryParts` / `renderBoundary` 剥离 + 冻结 golden | 可独立：golden 逐字节 + 标记测试 |
| T2–T5 | `sections` 改动、段序、A6/B3、测试更新、重生成 18 卡 | **同一集成批次**：A6、sections、卡、B3 注解必须同批落地，否则中间态必红 |
| T6 | B3 重判：覆写 `:B3 = pending` → 独立实例重判 → 写回 `:B3`，18 席非 pending | 与 T2–T5 同批收口 |

## 9. 新增测试

1. A6 正例：只读两段 → 过。
2. A6 正例：写权限三段 → 过。
3. A6 反例：policy 保留 `## 边界` → 红。
4. A6 反例：只读出现 `禁止事项` → 红。
5. A6 反例：`### 权限`（三级）→ 红。
6. A6 反例：空 `## 越界处置` → 红。
7. A6 反例：围栏内伪标题 → 红。
8. 标记：恰好 3 个、顺序固定；缺一 → `TemplateImpure`。
9. 残留：渲染后无 `<!--part:`、无 `{{`。
10. `renderBoundary` 逐席逐字节 == HEAD 旧卡边界正文。
11. 块级映射（§6.3）+ 四个负例（§6.4）。
12. default + escalation → `BOUNDARY_DEFAULT_WITH_ESCALATION`。
13. `boundaryBySeat` 值无标记且与 `renderBoundary` 相等。

## 10. 附录：审计依据索引（不进卡面）

| 判定需要 | 来源 |
|---|---|
| 允许写哪些文件 / 落在哪 | 卡面 `## 权限` + `permissions.write.allow` |
| 允许跑哪些命令 | 卡面 `## 权限` + `permissions.command.allow` |
| 禁写集合 | `tools/docgen/builders/agents/policy/definitions/paths.mjs`（`pathGroups` / `spec-plan` / `SIGNOFF_LEDGER`）+ `writeScopes.mjs`（`hostRule`） |
| 禁止命令组 | `tools/docgen/builders/agents/policy/definitions/commands.mjs`（`forbiddenGroups`） |
| `.gitignore` 兜底 | 仓库 `.gitignore` + `components/ignoredPaths.mjs` |
| 越权记录字段与落点 | 卡面 `## 越界处置` 的「越权记录与复算」 |
| 检测盲区 | 卡面 `## 越界处置` 的「检测限度」 |

## 11. 非目标

- 不扩 `escalation.steps` 的 kind 集合。
- 不改模型 JSON、不改 `_baseline.json`。
- 不验证运行时是否真的遵守（归平台审计）。
