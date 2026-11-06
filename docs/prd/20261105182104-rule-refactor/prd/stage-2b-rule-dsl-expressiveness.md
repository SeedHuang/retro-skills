# 阶段 2b：rule DSL 表达力补齐

> 所属项目：[rule 改造总纲](./index.md)｜前置：[阶段 2](./stage-2-new-mode-pilot.md) 完成
> 实现规格：[stage-2b-spec.md](./stage-2b-spec.md)｜验收合同：[stage-2b-testcase-sdet.md](./stage-2b-testcase-sdet.md)（170 条，R5 已一致）
> 状态：**讨论稿（2026-11-06）**，设计已与 SDET 达成一致，待施工
> 目标一句话：**rule 正文只能由判据 json 经脚本渲染产出；写散文这条路被机械封死。**

## 0 为什么要这一阶段

阶段 2 把「触发声明 rule」的正文从手写散文改成「判据 json → 渲染」。落地后发现三处结构性缺口：

| 缺口 | 实证 |
|---|---|
| **只表达「判定」，不表达「要求」** | `rules/evidence-before-conclusion.md` 渲染出的是 `anchor 非空 / numbersCommand 非空（例外：hasNumbers 等于 false 时豁免）`，读者不知道 `anchor` 是谁来填、`hasNumbers` 是什么状态 |
| **没有逻辑组合** | 算子表只有单字段算子，`assert` 数组只有隐式 AND；「path:line / 命令+输出首行 / 引用件路径 三选一」写不出来，只能拿 `containsAny [":", "exit", "命令"]` 去近似，`anchor = "abc:def"` 会被误判为通过 |
| **没有判定动作** | `observable-criteria.json` 把命令塞进 `landing` 字段（`landing` 的定义是「违规/合规记录落哪」），说明 DSL 少一个「这个值怎么取」的槽；读者拿到正文只知道「结果必须为 0」，不知道要跑哪条命令 |

本阶段补齐这三块，使「rule-writer 以后不能写散文」成为机械事实，而不是技能自觉。

## 1 本次讨论裁定（2026-11-06）

| # | 裁定 | 依据 |
|---|---|---|
| D-14 | 散文只能是渲染产物，不能是数据 | data + script 的目的是**防漂移 / 保执行力 / 可测**；散文进数据，三条全失效 |
| D-15 | 逻辑关系显式建模（`anyOf` / `allOf` / `oneOf` / `not`） | `assert` 数组天然是 AND，想写 OR 只能拆成多条 → 语义反转成「全部都要」，且测试仍绿 |
| D-16 | **同级不许混用逻辑键**，混用只能靠嵌套；不设优先级 | 优先级读者记不住、写错测试仍绿；嵌套是可读的唯一歧义消除法 |
| D-17 | 逻辑连接词唯一出处 = 结构树；`label` 只命名，不复述逻辑 | 否则 label 与结构树是两份逻辑表述，漂移无人拦 |
| D-18 | `label` 必须是**名词短语**（≤12 字符，不含逻辑词/情态词/标点） | 名词才能被模板当主语；动词句会让「label + 括号」语法不成立 |
| D-19 | **谓词由算子产出**，不由 label 承载 | 名词 label + 谓词 → `验证命令：必须非空`；否则正文只剩一个名词，读者不知道要求 |
| D-20 | **删掉「来源」**，正文不渲染来源 | 对判定零收益（`judge` 不读）；治理已有载体（git + PRD）；写进正文只增加每轮注入噪音，且指向部署后拿不到的文件 |
| D-21 | 判定动作进数据（`probe`），`landing` 只表示记录落点 | 见 §0 第三行实证 |
| D-22 | 时序 / 执行 / 重试 / 回滚**不进判据**，归 skill 骨架 | `judge` 是纯函数、单快照；引入顺序后不可重放、测试无法双向验证 |
| D-23 | 不设 `group` 这类展示分组 | 与 `label` 职责重叠，且会被误读成逻辑分组；改为「一个 assert 节点 = 一条义务 = 一个 label」 |

## 2 数据模型（rule json 全字段）

```json
{
  "id": "<id>",
  "impl": "script",
  "type": "持续适用 | 条件触发 | 模式门控",
  "scope": "global | project:<name>",
  "title": "<义务标题>",
  "when": <Cond> | { "always": true },
  "assert": [ <Obligation>, ... ],
  "residual": { "who": "...", "sample": 3, "fields": [...], "objectivePath": "..." },
  "refs": ["skills/<skill>/references/<file>.md"],
  "landing": "<记录落点>"
}
```

| 字段 | 必填 | 作用 | 渲染 |
|---|---|---|---|
| `title` | 是 | 义务标题 | `# {title}` |
| `type` | 是 | 判据类型（三值枚举） | 不渲染（元数据） |
| `scope` | 是 | 发布去向：`global` / `project:<name>` | 不渲染（元数据） |
| `when` | 是 | 触发条件；持续适用写 `{always:true}` | `> 触发：{when.label}`，缺省回退 `renderCond` |
| `assert` | 是 | 义务列表（隐式 AND） | 编号义务，每条一个 |
| `residual` | 是 | 机器判不死的部分 | 不渲染（留 json，供抽检台账） |
| `refs` | 否 | 操作细则指针 | `另见：…` |
| `landing` | 是 | 记录落点 | `落点：{landing}` |

**不设字段**：`source`（见 D-20）、`group`（见 D-23）、任何描述性散文字段。

## 3 条件语法（递归）

```
Cond   := Leaf | { anyOf: [Cond, ...] } | { allOf: [Cond, ...] }
        | { oneOf: [Cond, ...] } | { not: Cond }

Leaf   := { field, op, value?, values?, allow?, forbid?, conflict?,
            label?, name?, probe?, unless? }

Obligation := Cond 的顶层节点（必须带 label）
```

- `anyOf`：任一成立即成立（`||`），至少 2 项
- `allOf`：全部成立才成立（`&&`），至少 2 项
- `oneOf`：恰好一个成立（互斥分支）
- `not`：取反
- `unless`：例外，任意 Cond 节点；成立时该节点豁免
- **一个节点只许出现一种逻辑键**；混用一律判红（`LogicConflict`）
- **嵌套深度 ≤ 3**（`MAX_DEPTH`）：只数组合节点层数，顶层组合 = 1，`not` 也算 1 层，叶子不计
- `when: { always: true }` 表示持续适用，渲染为「触发：始终适用」，不需要 `label`

## 4 命名与表述层

| 键 | 位置 | 规则 | 渲染来源 |
|---|---|---|---|
| `label` | `when` / `assert[i]` / `unless` | **名词短语**：≤12 字符，不含逻辑词 / 情态词 / 标点 | 直接输出 |
| `name` | 叶子节点 | 被检查对象的名词短语（`path:line`、`取数命令`）；**选填**，缺省回退 `field`（不回退 `label`） | `anyOf/allOf` 子项 |
| `LOGIC_LABELS` | `schema.mjs` 常量表 | `以下任一` / `全部满足` / `恰好一个` / `不得` | 由结构树类型取 |
| `PREDICATE` | `schema.mjs` 常量表 | 由算子产出谓词（见 §5） | 叶子节点 |

`label` 禁词表（机判，见 §8 `LabelShape`）：
- 逻辑词：`或 / 且 / 任一 / 全部 / 至少 / 恰好 / 之一`
- 情态与祈使词：`必须 / 须 / 应当 / 应 / 要 / 不得 / 不许 / 请 / 需要 / 给出 / 写出 / 附上 / 贴出 / 执行 / 跑 / 确认`
- 标点：`，。；：、！？/`
- 长度 > 12 字符

> 「是否真的是名词短语」不可机判（`验证`、`回读` 是动名兼类词），登记 `residual` 由 `reviewer-audit` 抽 3 条核。

## 5 算子表（完整）

### 5.1 现有算子（沿用，语义不变）

| op | 语义 | 值类型 | 渲染谓词 |
|---|---|---|---|
| `eq` | 等于 | 标量 | 值 `true` → 「必须成立」；`false` → 「必须不成立」；其他 → 「必须等于 X」 |
| `nonEmpty` | 非空 | 标量 | 「必须非空」 |
| `containsAny` | 含任一字面量 | 标量 | 「必须包含以下任一：A / B」 |
| `notForbiddenCommand` | 命令前缀白名单，最长允许优先 | 标量 | 「必须不在禁止清单内」+ 允许 / 禁止清单 |

### 5.2 本次新增算子

| op | 语义 | 值类型 | 渲染谓词 | 服务的判定动作形态 |
|---|---|---|---|---|
| `empty` | 为空 | 标量 | 「必须为空」 | 分支条件（“b 为空则…”） |
| `notContains` | 不含任一字面量 | 标量 | 「不得包含以下任一：A / B」 | 禁令类（“不得只写需要你定”） |
| `startsWithAny` | 以任一项开头 | 标量 | 「必须以以下任一项开头：A / B」 | 命令 / 路径形态（可选的收紧） |
| `matches` | 匹配正则 | 标量 | 「必须匹配 `pattern`」 | 内容形态（BOM、注释标记） |
| `notMatches` | 不匹配正则 | 标量 | 「不得匹配 `pattern`」 | 内容禁令 |
| `gt` / `gte` | 大于 / 大于等于 | 数字 | 「必须大于 / ≥ X」 | 阈值上限类 |
| `lt` / `lte` | 小于 / 小于等于 | 数字 | 「必须小于 / ≤ X」 | 阈值下限类 |
| `countEq` | 计数等于 | 数字（probe 产出） | 「计数必须等于 X」 | “命中数 = N” |
| `countLte` / `countGte` | 计数 ≤ / ≥ | 数字（probe 产出） | 「计数必须 ≤ / ≥ X」 | “≤ N 处” |
| `includesAll` | 数组包含全部指定项 | 数组 | 「必须包含全部：A / B」 | 清单齐备（“扫四类”） |
| `includesAny` | 数组包含任一指定项 | 数组 | 「必须包含以任一项：A / B」 | 清单命中 |

> 文件 / 目录存在、命令退出码**不新增算子**：由 `probe` 取布尔或数字，再用 `eq true` / `eq 0` 判。

### 5.3 算子不负责的事

- 不负责取数（取数归 `probe`）；
- 不负责表述（表述归 `PREDICATE` 常量表）；
- 不负责时序（时序归 skill）。

## 6 判定动作（probe）

`probe` 描述「这个字段的值怎么取」，渲染进正文，使执行者知道要跑什么。

```json
"probe": { "kind": "command", "run": "node scripts/check-observable.mjs --check", "take": "exit" }
```

| kind | 含义 | `take` 可选值 | 渲染 |
|---|---|---|---|
| `command` | 跑一条命令 | `exit` / `stdout` | 运行 `run`，取退出码 / 取输出首行 |
| `file` | 检查一个路径 | `exists` / `content` | 检查 `path` 是否存在 / 读取 `path` 内容 |
| `glob` | 列匹配文件 | `count` / `names` | 统计 `path` 的文件数 / 列出文件名 |
| `manual` | 人工或从本轮回答中读取 | — | 从本轮回答中读取 |

**硬约束**：**全部判据**的每个 `assert` 顶层节点必须带 `probe`（`RuleWithoutProbe`），否则正文会出现「有义务、无判定动作」的半条规则。

`landing` 与 `probe` 职责分离：

| 字段 | 回答的问题 | 例 |
|---|---|---|
| `probe` | 这个值**怎么取** | `node scripts/check-observable.mjs --check` |
| `landing` | 合规 / 违规**记在哪** | `check-observable 输出` |

## 7 渲染规格（正文只由数据产出）

```markdown
# {title}

> 触发：{when.label}

义务（全部成立才合规；缺一件 = 不合格）：
1. {label}：{probe 渲染}，{谓词}
2. ...

另见：{refs}
落点：{landing}
```

规则：

- **不渲染来源**（D-20）；
- `label` 在前、谓词在后，谓词只由 `PREDICATE` 产出；
- `probe.kind = manual` 时不渲染「运行 …」前缀，只渲染「{label}：{谓词}」；
- 组合节点渲染为 `{label}（{LOGIC_LABELS.head}：{子项}）`；
- 子节点与父节点逻辑类型不同时，子节点整体加 `（）`；
- `unless` 渲染为 `（例外：{unless.label}）`。

示例（`observable-criteria`）：

```markdown
# 判据正文不得留不可观察评价

> 触发：始终适用

义务（全部成立才合规；缺一件 = 不合格）：
1. 可观察检查：运行 `node scripts/check-observable.mjs --check`，退出码必须等于 0

另见：skills/carrier-conventions/references/observable.md
落点：check-observable 输出
```

## 8 校验闸（全部机判，落 `schema.mjs` + 门禁 ⑨）

| 闸 | 判红条件 | 防什么 |
|---|---|---|
| `Schema` | 未登记字段 / 缺必填 / `impl != script` / `type` 非法 | 散文混入数据 |
| `ScopeMissing` / `ScopeInvalid` | 缺 `scope`，或不是 `global` / `project:<name>` | 发布去向不明（会把项目规则污染进全局） |
| `LogicConflict` | 同一节点出现 ≥2 种逻辑键 | 优先级歧义 |
| `LogicArity` | `anyOf/allOf/oneOf` 少于 2 项 | 单项组合伪装 |
| `DepthExceeded` | 嵌套 > 3 层 | 判据写成解析树 |
| `AssertLabelMissing` | `assert[i]` 缺 `label` | 渲染不出人话义务 |
| `UnlessLabelMissing` | 有 `unless` 但缺 `label` | 例外句无法渲染 |
| `ProbeSchema` | `probe.kind` / `take` / 必填键非法 | 判定动作不可执行 |
| `LabelShape` | `label` 命中 §4 禁词表 / 超 12 字符 / 含标点 | label 变成句子 |
| `LogicWordInLabel` | `label` 复述逻辑连接词 | 第二份逻辑表述 |
| `RuleWithoutProbe` | 任一判据的 assert 顶层缺 `probe` | 半条规则（有义务无动作） |
| `FieldLabelMissing` | `residual.fields` 指向 `when/assert` 之外的字段 | 残余悬空 |

递归要求：`knownFields` 必须**递归收集**嵌套节点里的字段，否则 `residual.fields` 指向嵌套字段会被误判。

## 9 边界：什么不进判据

按 [criteria-engine/README §四](../criteria-engine/README.md)：

| 内容 | 去哪 | 为什么 |
|---|---|---|
| 语义判断（讲透 / 合理 / 真伪） | `residual` + skill | 不可机判 |
| 时序 / 执行 / 重试 / 回滚 | skill 骨架 | 单快照纯函数表达不了；引入后不可重放 |
| 模板 / 知识样例 | references（`refs` 指针） | 无违规形态 |

**分支与顺序的分界**：

- 「b 为空做 A、b 非空做 B」= 分支，可判：`oneOf [ allOf[not(b非空), opA非空], allOf[b非空, opB非空] ]`
- 「先判 a、a 操作完、再判 b」= 顺序，不可判：归 skill；每个时刻单独成一条判据，各自单快照

## 10 迁移与兼容

| 对象 | 处置 |
|---|---|
| pilot `rule-dsl/` 三份 json | 补 `label` / `name` / `probe` / `always` / `refs`；**18 条旧样例一条不改**，新引擎必须 18/18 绿（语义等价证明） |
| pilot 新增第 4 条 `anchor-forms` | 演示 `anyOf` + `notContains`；4 条样例（任一非空 pass、全空 fail、含禁词 fail、不触发 pass） |
| `tools/quality/criteria-engine/` 5 份 json | 同上补槽；`observable-criteria` 的 `landing` 命令迁到 `probe` |
| `rules/evidence-before-conclusion.md` | 重新渲染：无来源行；四站用 `label` + `anyOf` / `unless` |
| `check-criteria-engine.mjs` 结构闸 V-4 | 必检件由「触发 / 义务 / 例外 / **来源锚** / 判定动作」改为「触发 / 义务 / 例外 / 判定动作」 |
| `rule-audit-lite.mjs` | `STRUCT` 与 `SOURCE` 去掉 `> 来源` |
| `criteria-engine/README.md` §六 | 追加第 5、6、7 条裁定：逻辑关系显式建模；label 只命名、谓词由算子产出；判定动作与记录落点分离 |
| `rule-writer` 技能 | 新增「判据引擎 rule」输出分支 + `references/criteria-dsl.md`；散文 rule 分支收窄为历史 |

### 10.1 rule-writer 改造规格（本阶段只加分支，不重写旧流程）

**为什么必须在 2b 落地**：不改写入侧，「只能由 json 渲染」就只剩校验器在拦——AI 仍会写散文，然后被门禁打回，来回空转。

| 改动 | 内容 |
|---|---|
| **输出形态** | 「写 rule」先定形态：判据引擎 rule（`<id>.json` + `<id>.testcase.json`）是唯一可写形态；散文 rule 分支标记为**只读历史**（仅供优化 bak / 旧文档时参考） |
| **硬闸门** | ① 禁止把散文正文写进 `rules/`；② 交付前必须跑 `node tools/quality/criteria-engine/build.mjs` 与 `node scripts/check-criteria-engine.mjs`，两者绿才算草稿合格；③ 缺 `label` / `probe` / testcase 任一 = 草稿不合格 |
| **新增 references/criteria-dsl.md** | 本文档 §2–§8 的操作版：字段表、条件语法、`label` 规则与禁词表、算子表、`probe` 表、渲染规则、校验闸、验收命令 |
| **SKILL.md 指引行** | 「判据与写作指引去哪读」加一行：判据引擎 rule 形态 → `references/criteria-dsl.md`（细则只此一处，其他技能只放指针） |

### 10.2 同链的其他技能（本阶段不动，阶段 3 收口）

| 技能 | 现状 | 为什么不在 2b 改 |
|---|---|---|
| `rule-inspector` | 按散文 9 项打分（执行力度 / 标题一致性 / 冗余度…） | 对 json 规则不适用；2b 期间 json 规则以 `check-criteria-engine` 为唯一验收，**不走 inspector 评分** |
| `use-rule-skills` | 草稿箱收 `.md` | 草稿形态要从 `.md` 改成 `.json` + `.testcase.json`，牵动入口流程与草稿命名，归阶段 3 |
| `carrier-conventions` | 正文写作规范 | 只加一行指针（见上表），细则不复制，避免第二份真相 |

**过渡期判定**：2b 期间，判据引擎 rule 的验收 = `build.mjs` + `check-criteria-engine.mjs` 双绿；`rule-inspector` 评分只对旧散文规则适用，**不得用 inspector 分数去改 json 规则**。

## 11 验收

| # | 判据 | 阈值 |
|---|---|---|
| V-2b-1 | `node tools/quality/criteria-engine/build.mjs` | 末行 `rule-dsl ok`，exit 0；样例 18 + 4 = 22 |
| V-2b-2 | 旧 18 条样例 | 一条不改、18/18 绿（语义等价） |
| V-2b-3 | `node scripts/check-criteria-engine.mjs` | 全绿；首行 `判据 N 条 / 绿 M / 红 K` |
| V-2b-4 | `node scripts/check-all.mjs` | 全绿（含 ⑨ 段、说明层占比、observable） |
| V-2b-5 | 手改 `rules/evidence-before-conclusion.md` 1 字节 | `RuleProjectionDrift`，exit 1 |
| V-2b-6 | 把 `label` 改成「附上取数命令」 | `LabelShape` 判红，报错含修法 |
| V-2b-7 | 把 `anyOf` 改成三条平铺 assert | 原「任一非空 pass」样例转红（证明结构在控语义） |
| V-2b-8 | 删掉 `probe` 后跑门禁 | `RuleWithoutProbe` 判红 |
| V-2b-9 | 对 `rule-writer` 说「写一条规则」 | 产出仅 `<id>.json` + `<id>.testcase.json`，不含散文正文；`build.mjs` 与 `check-criteria-engine.mjs` 双绿 |
| V-2b-10 | 查 `~/.aas/installed.json` | 不含 `rule-writer` 条目（生产工具不出品） |
| V-2b-11 | 构造一条 `scope: "project:x"` 的规则后跑发布 | 其 `<id>.md` 不进入 `~/.trae-cn/user_rules`；`global` 规则正常进入 |

## 12 未决与风险

| # | 项 | 现状 |
|---|---|---|
| 风险-1 | 「label 是不是名词短语」不可机判 | 禁词表 + 长度 + 标点拦得住大部分；动名兼类词（验证 / 回读）留 `residual` 抽检 |
| 风险-2 | `no-unverified-number` 的 `containsAny` → `startsWithAny` 是**收紧语义**（假阳性变少） | 旧 4 样例仍全绿，但判定变严，需用户单独签 |
| 风险-3 | 删「来源」后，部署侧无溯源 | 溯源在 git（`git log -p -- rules/<id>.md`）与 PRD；若确需随部署走，放 aas 账本 / manifest，不进正文 |
| 风险-4 | `matches` 正则可表达力过强（可写出任意判定） | 登记时限定用途：内容形态；复杂度由 `reviewer-audit` 抽检 |
| 风险-5 | 阶段 3（skill 全面改造）未做，`rule-writer` 双分支是过渡态 | 阶段 3 收口时删除散文分支 |
| 风险-6 | 过渡期双轨：`rule-inspector` 仍按散文 9 项评分 | 2b 明确「json 规则不走 inspector」；阶段 3 把评分维度迁到判据完备性（算子选择 / 结构合法 / testcase 双向） |
| 风险-7 | 发布侧若按 `rules/` 目录全量同步，项目级规则会污染全局 | 发布必须按 json 的 `scope` 过滤，不能按目录扫；V-2b-11 是这条的回归用例 |

## 13 与既有 PRD 的关系

本阶段修正 [stage-2 §1.6 / §2](./stage-2-new-mode-pilot.md) 的一处自相矛盾：

- §2 把触发声明 rule 的成品文案**手写**为 387 字符的散文；
- §1.6 / P-4 又要求「生成物手改即红、单一真相」。

两者不可能同时成立。本阶段的解法：**§2 的文案降级为「渲染目标形态」**，实现路径改为本文档的 json + 算子 + probe + 渲染器。字符数会变（`label` 与谓词由数据产出），387 这个数字不再作为验收值。

## 14 出品边界（authoring ≠ published）

**唯一创作仓 = 本仓**。所有规则（`global` 与 `project:<name>`）都在本仓编写；判据数据与生成物都留在本仓；用户目录只放发布后的只读副本或链接。

| 层 | 位置 | 是否发布 |
|---|---|---|
| 判据数据 | `tools/quality/criteria-engine/<id>.json` + `<id>.testcase.json` | **否**（留仓，是「手改即红」的前提） |
| 生成物 | `rules/<id>.md` | **是**（按 `scope` 分发） |
| 生产工具（`rule-writer`） | `skills/rule-writer/` | **否**（工具不是产品） |

**按 `scope` 分发**：

| scope | 去向 |
|---|---|
| `global` | `~/.trae-cn/user_rules`（现有 aas 全局规则通道） |
| `project:<name>` | 目标仓的 `rules/`；**不得**进入 `user_rules` |

**三条硬约束**：

1. 任何判据数据不得写在用户目录（`~/.trae-cn/`、`~/.aas/` 数据区）；用户目录只允许只读副本或链接。
2. `rule-writer` 不出品；验收 = `~/.aas/installed.json` 无该条目（V-2b-10）。
3. 别的仓要自己的规则 → **由本仓代写**，写进本仓 `criteria-engine/`，按 `scope: project:<name>` 发布；不在对方仓装 writer，也不在对方仓建第二份判据数据。

> 与 §10.2 的关系：数据落点不随「技能是否全局化」改变——技能全局化只改调用方式，不改数据的家。
