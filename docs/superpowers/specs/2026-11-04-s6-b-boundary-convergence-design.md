# S6-B：边界句结构收敛（非评审席接入「数据 → 渲染」）设计

> 状态：**草案（待 ② 段议会 #2 评审）**｜创建：2026-11-04
> 功能点：**F-24** 的续作（`docs/prd/20261024073606-dev-workflow-mainline/index.md` §10）；不改功能点集合
> 前作：`docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design.md`（下称「S6 原文」；本 spec 只声明**现行判据**，不回改原文）
> 唯一入口：`docs/after/20261031111000-senior-sdet-boundary-conflict-open-decisions.md` §六
> 测试用例文件：`2026-11-04-s6-b-boundary-convergence-design-testcase.md`（同批由独立 `senior-sdet` 编写，本 spec 不内联用例）
> 用户裁定（2026-11-04）：机制 = **写作用域 + 项级排除**（不动配置层三键 closed-world）

## 1 全貌

| 维度 | 内容 |
|---|---|
| 本质 | 把 `senior-sdet` 的专用字面边界句收回「数据 → 渲染」：模板首句与写入范围句由**写作用域数据**渲染；禁写路径支持**按项排除**（不是按组整组放开） |
| 同族 | 边界句链（定义层 `paths` / `commands` / `artifacts` / `seats` → 配置层 `seat-policy` → `renderBoundary` → `patternRegistry.boundaryBySeat` → `agentData` → 卡）；S6 不变量 2 / 3 / 7；`fixtures/boundary-golden.json`；`policy-pure-source.test.mjs` 的 G03 与计数断言 |
| 边界 | 不改任何席的权限语义（允许写集合 / 禁写集合 / 允许命令集合，逐项集合 diff 判）；不动 `DEFAULT_BOUNDARY` 的 11 席与 `evidence-reader` 自有句；不手改卡 |
| 验收 | V-1～V-8（§4）：两评审席渲染**字节不变**；`senior-sdet` 改由渲染器产出且**允许 ± 禁止集合不减不宽**；槽集恰合 15；引用完整性三负例 |
| 影响面 | 定义层 3 个文件改（`paths.mjs` / `seats.mjs` / 新增 `writeScopes.mjs`）+ 模板 + 渲染器 + **`dumpPolicy.mjs`（1）** + 注册表 + 校验器 + **既有测试回归面 7 个文件**（`policy-pure-source.test.mjs` / `sb-contract-layer.test.mjs` / `sa-data-layer.test.mjs` / `tool-tiers.test.mjs` / `sdet-render.test.mjs` / `s3-predicates.test.mjs` / `check-observable.test.mjs`）+ **2 个 fixture**（`boundary-golden.json` / `senior-sdet.evidence.json`）+ `agents/senior-sdet.md` **一处**卡面 + 本 spec/testcase + impact-sheet（源文件合计 **8**） |
| 收益 | 可机械复核的两句（取数命令见括号）：① 非评审席边界句的**字面抄写数** 1 → **0**（`git show <BASE>:tools/docgen/components/patternRegistry.mjs` 含 `SDET_BOUNDARY` **1** 处；施工后同文件 `git grep -c 'SDET_BOUNDARY'` = **0**）；② 禁写路径的**点名项抄写数** 5 → **0**（旧卡 `git show <BASE>:agents/senior-sdet.md` 含 `rules/` / `skills/` / `agents/` 各 **1**（另两项为「业务代码」「spec / plan」）；施工后 `Select-String -Path agents/senior-sdet.md -Pattern 'rules/|skills/|agents/'` 命中 **0**）。**不声称「新增席只改数据」**——新增席仍需 `SEAT_POLICY` / `data/seats/<slug>.json` / `boundaryBySeat` 接线（本批不动接线面） |
| 联动四问·治本 | 只改 `senior-sdet` 一句文案 = 下次同类席再抄一句；收到渲染链才是 §六 要的形态 |
| 联动四问·副作用 | 改 `pathGroups` 形态会波及 `policy-pure-source.test.mjs` 的硬计数与纯度守卫 → 本批同批改判并登记 R8；改模板会波及两评审席渲染 → 用「黄金不变 + 卡面零 diff」限定 |
| 联动四问·跨问题 | `evidence-reader` 与 11 席默认句不动；`detective-observer` 的 `fixedList` 副本（S6 原文 §2 第 7 条）**不在本批**，触发信号未到 |
| 联动四问·跨页面 | `boundaryBySeat` 只被 `agentData` 消费；`renderBoundary` 只被注册表与测试消费 → 影响面可枚举 |

## 2 不做什么

1. **不放宽任何席的权限**：`senior-sdet` 的允许写集合不变（本次 spec 同目录的 `-testcase.md` 与同目录测试设计文档）；禁写集合只增不减。
2. **不按组整组放开**：排除粒度 = **项 ID**（`code.test`），不是组 ID（`code`）——后者会连带放开「代码」。
3. **不动配置层三键**：`SEAT_POLICY` 仍恰 `capabilities` / `allowGroups` / `artifacts`；closed-world（S6 不变量 2）不变。
4. 不动 `DEFAULT_BOUNDARY` 的 11 席、`evidence-reader` 自有边界句、`outputFormats` / `sharedBlocks`。
5. 不新增 CLI 错误码；引用错误复用 `UnknownPolicyRef`，模板错误复用 `TemplateImpure`。
6. 不改已签 S6 spec / testcase 原文；只加日期注与指针（现行判据 = 本 spec §3）。

## 3 设计

### 3.1 定义层：路径项改为「项对象」（`paths.mjs`）

```js
export const pathGroups = {
  code:       [{ id: 'code.src', text: '代码' }, { id: 'code.test', text: '测试' }],
  governance: [{ id: 'rules', text: 'rules/' }, { id: 'skills', text: 'skills/' }, { id: 'agents', text: 'agents/' }],
  'docs.input': [{ id: 'docs.prd', text: 'docs/prd/' }],
  build:      [{ id: 'tools', text: 'tools/' }, { id: 'scripts', text: 'scripts/' }, { id: 'config', text: '配置与依赖清单' }],
  ledger:     [{ id: 'docs.after', text: 'docs/after/' }, { id: 'docs.handoffs', text: 'docs/handoffs/' },
               { id: 'docs.reports', text: 'docs/reports/' }, { id: 'docs.retro', text: 'docs/superpowers/retro/' }],
  workspace:  [{ id: 'superpowers', text: '.superpowers/' }, { id: 'local-md', text: '*.local.md' },
               { id: 'ledger-md', text: '**/ledger.md' }, { id: 'trae', text: '.trae/' },
               { id: 'node-modules', text: 'node_modules/' }, { id: 'other-reviews', text: '其他评审目录' }],
};
```

- **只有一处形态变化**：原 `code: ['代码、测试']` 一项拆成 `code.src` / `code.test` 两项；其余项只加 `id` 不改 `text`。
- **卡面成员数不变**：`pathTokens()` 仍 = **20**（19 项 + `spec / plan`）。定义层数组元素 18 → **19**，定义层点名 19 → **20**（「原卡面已写作两项」是 S-A 前的旧论据，本批按**定义层按 `、` 再切**的现值算；`agents/*.md` 现为指针句，不再逐项列路径）。
- `id` 唯一、形如 `^[a-z][a-z0-9.-]*$`，且**禁原型链保留名**（`constructor` / `__proto__` / `prototype` / `toString` / `valueOf` / `hasOwnProperty`）；`text` 非空。禁止两组共用同一 `id`。成员判定一律 `Set` 或 `Object.hasOwn`，禁 `in` / 直接下标。
- **`policy --dump` 是只读契约，形状不变**：`dumpPolicy` 对 `paths.groups` 做**投影**（输出 `text` 字符串数组），不把项对象透传出去；需要 `id` 的消费者读定义层，不读 dump。

### 3.2 定义层：写作用域（新增 `tools/docgen/policy/definitions/writeScopes.mjs`）

```js
export const writeScopes = {
  'review.ledger': {
    roleKind: '评审席',
    label: '本次评审账本（`.session/reviews/<本次>/`；归档后 `docs/superpowers/reviews/<本次>/`）目录内的产物',
    hostRule: '不得写 `progress.md`（只由主持人写，段二 / 段三由主持人从责任席的产出转录）',
    excludePathItems: [],
  },
  'spec.testcase': {
    roleKind: '测试设计',
    label: '本次 spec 同目录的 `-testcase.md` 与同目录由你负责的测试设计文档',
    hostRule: '不得写 `progress.md`（只由主 agent 写）',
    excludePathItems: ['code.test'],
  },
};
```

- `roleKind` + `label` 是**描述性文本**（不是权限授予）；排除项是**项 ID**，不是字面。
- `review.ledger` 的两项文本与现模板逐字相同 → 两评审席渲染不变（V-1）。

### 3.3 定义层：席位声明写作用域（`seats.mjs`）

```js
'senior-sdet': {
  display: '测试开发',
  writeScope: 'spec.testcase',
  clause: '不改别人的判定：spec 或实现有问题，写进「给开发的建议」，不代改、不参与议会裁决',
},
```

- `writeScope` 为**可选字段**；缺省 = `'review.ledger'`（与现模板行为一致）。显式 `undefined` / `null` / 空串 → `UnknownPolicyRef`（不静默回落缺省）。
- **渲染层对未知 `writeScope` 是全函数**：`ROLE_KIND` / `WRITE_SCOPE` 渲染为**空串**，不抛（与现 `TIER` 同款「渲染层不判配置错」）；成员 / 非空 / 显式 `undefined` 的判定与发码**全部在 `validatePolicy`**，且该校验必须排在 `slotValues` 全量循环**之前**，否则导入期先抛 `TemplateImpure`、`UnknownPolicyRef` 永远发不出来。
- `senior-sdet` 的 `clause` 承接旧专用句的第三段（「不改别人的判定…不参与议会裁决」），保证权限语义之外的行为约定不丢（V-5④）。
- 不变量 3 的允许字段集由 3 项扩为 4 项（`display` / `clause` / `escalationWriter` / `writeScope`）；后两者可选。**显示名扫描面追加 `writeScopes.mjs`**：单独一轮只判「`roleKind` / `label` 是否含任一席的 `display`」，不把该文件并入 `DEF_FILES`（避免误判席 slug）。

### 3.4 渲染层：槽集 12 → 15

| # | 槽 | 取值来源 | 两评审席渲染值（必须与今一致） |
|---|---|---|---|
| 1 | `{{SEAT}}` | `SEATS[slug].display` | 审计 / 侦探 |
| 2 | `{{TIER}}` | 不变 | producer |
| 3 | `{{CAPABILITIES}}` | 不变 | 六项工具 |
| 4 | `{{ARTIFACTS}}` | 不变 | 产物清单 |
| 5 | `{{SEAT_CLAUSE}}` | 不变 | 卡级子句 |
| 6 | `{{ESCALATION_WRITER}}` | 不变 | 本席写 / 交审计 |
| 7 | `{{ALLOW_GROUPS}}` | 不变 | 三组 |
| 8 | `{{DENY_GROUPS}}` | 不变 | 五组 |
| 9 | `{{ENV_FORMS}}` | 不变 | env 形态项 |
| 10 | `{{FORBIDDEN_PATHS}}` | **按席过滤**（§3.5） | 与今逐字相同 |
| 11 | `{{DETECTION_PATHS}}` | 不变 | 三盲区 |
| 12 | `{{DETECTION_CMD}}` | 不变 | status 项 |
| 13 | `{{ROLE_KIND}}` | `writeScopes[scope].roleKind` | 评审席 |
| 14 | `{{WRITE_SCOPE}}` | `writeScopes[scope].label` | 本次评审账本… |
| 15 | `{{HOST_RULE}}` | `writeScopes[scope].hostRule` | 不得写 `progress.md`（只由主持人写…） |

模板两处改动（其余字节不动）：

- 首句：`你是{{ROLE_KIND}}（{{SEAT}}）。`（两评审席渲染后仍为「你是评审席（审计）。」）
- 写入范围：`**只允许写**：{{WRITE_SCOPE}}。{{ARTIFACTS}}{{SEAT_CLAUSE}}`（两评审席渲染后逐字不变）

`expanded` 索引口径 = 上表行序（0–14）；旧 12 槽的位置 0–11 不动，新槽追加在末位。

### 3.5 禁写指针按席过滤

`FORBIDDEN_PATHS` 的基准句（与今逐字相同，**任何席位都逐字节保留**）：

```
`pathGroups`（六组）与一项模式项（spec 与 plan 的两种写法）
```

写入作用域 `excludePathItems` 非空时，**在基准句整句之后追加**一条排除注（不插进原句内部，既有「基准句子串」断言因此不破）：

```
`pathGroups`（六组）与一项模式项（spec 与 plan 的两种写法）（本席按写作用域排除「测试」）
```

- 排除注的文本由**被排除项的 `text`** 现算（不在模板硬写字面）；无排除项时**一个字节都不加**。
- 排除只影响**禁写集合**，不影响 `pathGroups` 定义本身、不影响其他席。

### 3.6 纯度守卫与注册表

- `assertTemplatePure` 的清单类成员改为读 `pathGroups` 项对象的 `text`（与 S6 判定粒度「整项相等」一致）。
- 模板不再含 `.session/reviews/<本次>/` / `docs/superpowers/reviews/<本次>/` 两段字面 → 从 `TEMPLATE_ALLOWED_LITERALS` 删除；同批把 `sb-contract-layer.test.mjs` 的「白名单恰 12 项」断言改为**派生式**（不写死数字）。
- `patternRegistry.mjs`：删除 `SDET_BOUNDARY`；`boundaryBySeat['senior-sdet']` 改为 `renderBoundary('senior-sdet')`；同批改 `sb-contract-layer.test.mjs` 的注释命中。
- **卡面恢复路径**：`gate` 对 `senior-sdet` 的逐字节比对会报 `Mismatch` → 按仓库既有 **`draft` → 对照 → `replace`** 流程重出 `agents/senior-sdet.md`。**不用** `generate --readme --apply`（该命令的 `--apply` 只授权写 `docs/agents/**`，不改 `agents/*.md`）。
- `docs/agents/senior-sdet.md` 是**人读投影**，不含 `## 边界` 段（只写「边界见卡面「边界」段」）→ 本批**零改动**，并补一条断言「该投影与 `BASE` 零差异」。

### 3.7 不变量增补（沿用编号 10 起）

| # | 不变量 | 违反时 |
|---|---|---|
| 10 | 每个席位声明的 `writeScope`（含缺省解析结果）必须 ∈ `Object.keys(writeScopes)`；`excludePathItems` 每项必须 ∈ 全部路径项 `id`（成员判定用 `Set` / `Object.hasOwn`，禁 `in`）；同一 `id` 只许出现一次；`id` 禁原型链保留名；显式 `undefined` / `null` / 空串不许静默回落缺省 | `UnknownPolicyRef`（报文 `<席>:writeScope=<id>` / `writeScope=<scope>:excludePathItem=<id>`） |
| 11 | 槽集恰合 15（模板槽集 = `SLOTS` = §3.4 表行序）；每槽至少被引用一次；无多余槽 | `TemplateImpure` |
| 12 | `writeScopes` 的 `roleKind` / `label` / `hostRule` 非空；`excludePathItems` 只许引用已登记项 `id`（模式项没有 `id`，因此天然不可引用） | `UnknownPolicyRef` |
| 13 | **按 scope 的排除白名单**：`writeScopes` 键集**恰为** `review.ledger` / `spec.testcase` 两值；`review.ledger` 的 `excludePathItems` ⊆ `[]`；`spec.testcase` ⊆ `['code.test']`（**未用项不判红**，清空不判红） | `ForbiddenGroupGranted`（报文 `writeScope=<scope>:excludePathItem=<id>:not-allowed`） |
| 14 | **scope 引用绑定**：显式声明 `writeScope: 'spec.testcase'` 的席只许是 `senior-sdet`；其余席不得显式声明该 scope | `ForbiddenGroupGranted`（报文 `<席>:writeScope=spec.testcase:not-allowed`） |

### 3.8 与 S6 原文的关系（现行判据）

| S6 原文位置 | 原文口径 | 本批起的现行判据 |
|---|---|---|
| §3.2 `definitions/paths.mjs` | 数组元素（字符串） | 项对象 `{id, text}`；`代码、测试` 拆两项（§3.1） |
| §3.2 `definitions/seats.mjs` | `display` / `clause` / `escalationWriter` | 增可选 `writeScope`（§3.3） |
| §3.4 槽集 | 恰 12 槽 | 恰 **15** 槽，新槽追加末位（§3.4） |
| §3.4 槽 10 | `pathGroups` 六组展开 ∪ 模式项 | 同上，另按席追加排除注（§3.5） |
| §3.5 #7 / §3.6 收口范围 | 2 producer 席接模板；`senior-sdet` 走手写模板 | **3 席**接模板（`reviewer-audit` / `detective-observer` / `senior-sdet`）；仍 11 席 `DEFAULT_BOUNDARY` + `evidence-reader` 自有句 |
| §8 V-1③ | 禁写路径集（数组元素 21 / 定义层点名 22 / 卡面成员 23） | 现值为数组 **19** / 点名 **20** / 卡面 **20**（`spec / plan` 模式项另计）；Q8 前的旧三数只作历史 |

> S6 原文与本表冲突处，**以本表为准**；原文按「签后增量只加日期注 + 现行判据块」保留不改。

## 4 验收 V-1～V-8

| # | 验收项 | 判据（可机械复核） |
|---|---|---|
| V-1 | **两评审席渲染字节不变 + 投影不承载边界** | `sha(renderBoundary('reviewer-audit'))` == `sha(批次起点卡面 agents/reviewer-audit.md 的「## 边界」节)`；`detective-observer` 同；两人 `git diff -- <agents/reviewer-audit.md> <agents/detective-observer.md>` 为 **0 行**；`git diff -- docs/agents/senior-sdet.md` 为 **0 行**（投影不承载边界）。黄金 `reviewer-audit` / `reviewer-audit@2` 与现卡本就不相等（属历史定位线索，S6 原文 §3.6 明写不作判据）→ **不作判据** |
| V-2 | **`senior-sdet` 接入渲染** | `agentData` 中该席 `boundary === renderBoundary('senior-sdet')`；`git grep -l SDET_BOUNDARY -- tools/ agents/ skills/` 命中 **0**（扫描面 = 三个载体目录；`docs/` 历史件不在面内） |
| V-3 | **写作用域数据化** | **扫描面 = 模板文件** `tools/docgen/templates/boundary.md.tpl`：`评审席` 与 `本次评审账本` 命中 0（卡面本就含这两词，扫卡面必然假红）；`slotValues('senior-sdet').ROLE_KIND` / `WRITE_SCOPE` 分别等于 `writeScopes['spec.testcase']` 的两字段 |
| V-4 | **项级排除生效且不整组放开** | `slotValues('senior-sdet').FORBIDDEN_PATHS` 含「排除「测试」」；`pathGroups.code` 仍含 `code.src` 项（禁写集合仍禁「代码」）；`slotValues('reviewer-audit')` 的该值**不含**「排除」 |
| V-5 | **权限语义不减不宽** | 四组逐项：① **允许写**：新旧均为「本次 spec 同目录的 `-testcase.md` 与同目录**由你负责的**测试设计文档」（逐字以 §3.2 `label` 为准，本条只判两侧全等）；② **禁写**：旧句点名集 {业务代码 / `spec / plan` / `rules/` / `skills/` / `agents/`} 在新集合中逐项仍有覆盖（`代码` ⊇ `业务代码`），差集为空；③ **同一件事两种判**：（a）本席 `excludePathItems` 的项级移除恰为 `code.test`（对 **S6B-TC-16/17**）；（b）新旧定义层按**元素文本** diff：移除 `代码、测试`、新增 `代码` + `测试`，按 token 级 20 → 20 集合不变（对 **S6B-TC-24/25**）——两条各自独立判死，不混写；④ **行为约定**：旧句第三段「不代改、不参与议会裁决」在 `seats.mjs` 的 `clause` 中有逐字落点；⑤ **落点外仍禁**：排除注不改变模板「除上述落点外，任何写文件或重定向一律禁止」 |
| V-6 | **槽集恰合 15** | 模板槽集 == `SLOTS`；长度 15；`dump.expanded` 数组长度 15 且逐项等于表行序 |
| V-7 | **引用完整性三负例** | 副本内把 `writeScope` 改成未登记 ID → `gate` exit 1 且报文 `UnknownPolicyRef: <席>:writeScope=…`（**首行不得含 `TypeError` / `TemplateImpure`**）；副本内把 `excludePathItems` 改成未登记项 ID → `UnknownPolicyRef: writeScope=<scope>:excludePathItem=…`；副本内把 `excludePathItems` 改成白名单外的已登记项（如 `rules`）→ `ForbiddenGroupGranted: writeScope=<scope>:excludePathItem=rules:not-allowed` |
| V-8 | **全仓门禁绿** | `npm run check` 末行 `check 全部通过` + `# fail 0`；`node tools/docgen/cli.mjs gate` → `baseline 38/38`；`node scripts/scope-sweep.mjs --check` → `sweep ok` |

## 5 失败面与错误码

| 码 | 新增触发 | 退出码 | 报文首行 |
|---|---|---|---|
| `UnknownPolicyRef` | `writeScope` 未登记 / 显式 `undefined` / `null` / 空串 / 排除项未登记 / 同一排除项重复 / `roleKind` 或 `label` / `hostRule` 为空 | 1 | `UnknownPolicyRef: <席>:writeScope=<id>` 或 `UnknownPolicyRef: writeScope=<scope>:excludePathItem=<id>` |
| `ForbiddenGroupGranted` | `excludePathItems` 出现**白名单外**的已登记项（不变量 13）；`writeScopes` 键集多出第三值（不变量 13）；非 `senior-sdet` 席显式声明 `spec.testcase`（不变量 14） | 1 | `ForbiddenGroupGranted: writeScope=<scope>:excludePathItem=<id>:not-allowed` / `writeScope=<scope>:not-allowed` / `<席>:writeScope=spec.testcase:not-allowed` |
| `SeatNameInDefinition` | `writeScopes.mjs` 的 `roleKind` / `label` 含任一席 `display`（不变量 3 的显示名扫描面） | 1 | `SeatNameInDefinition: tools/docgen/policy/definitions/writeScopes.mjs` |
| `TemplateImpure` | 槽集 ≠ 15 / 槽值 `undefined` / 纯度违反 | 1 | `TemplateImpure: tools/docgen/templates/boundary.md.tpl:<片段>` |
| `LiteralInConfig` | 配置层三键不变，本批无新增触发 | 1 | 同 S6 原文 |

不新增错误码；报文路径仍为仓内 POSIX 相对路径。**`writeScope` 数据错必须由 `validatePolicy` 发 `UnknownPolicyRef`，不得在导入期抛 `TypeError` / `TemplateImpure`**（§3.3 的渲染全函数 + 校验排序保证）。

## 6 差异清单

| # | 差异 | 为什么必须 |
|---|---|---|
| D1 | `pathGroups` 由字符串数组改为项对象数组；`代码、测试` 拆两项 | 项级排除需要稳定 `id`；拆项使「测试」可单独排除而不放开「代码」 |
| D1' | `policy --dump` 的 `paths.groups` **仍输出 `text` 字符串数组**（dump 做投影，契约形状不变） | 避免把只读 CLI 契约一并改形；需要 `id` 的消费者读定义层 |
| D2 | 新增 `writeScopes.mjs` + `seats.mjs` 可选 `writeScope` | 首句与写入范围句回到数据 → 渲染；缺省值保证两评审席逐字不变 |
| D3 | 槽集 12 → 15（`ROLE_KIND` / `WRITE_SCOPE` / `HOST_RULE`） | 模板去「评审席」化，三值由数据提供 |
| D4 | `FORBIDDEN_PATHS` 按席过滤 + 句尾追加排除注 | 「按席排除禁写组」的落点；无排除时零改动；基准句子串保留 |
| D5 | 删除 `SDET_BOUNDARY`；`agents/senior-sdet.md` **一处**卡面按 `draft` → `replace` 重出 | 常量收回单源；`generate --apply` 只写 `docs/agents/`，不能重出卡面 |
| D6 | 黄金追加 `senior-sdet@1`（旧键不删） | 换代规则：只追加、旧键留作历史；当前比对键 = 轮次最大者 |
| D7 | S6 原文加日期注 + 指针（原文不删） | 已签件不许重写；现行判据只在 §3.8 一处 |
| D8 | **既有测试回归面（按测试块定位，不写裸行号）**：① 4 文件派生 helper 改读 `item.text`（`policy-pure-source` 的 `pathItems` / `pathTokens` / `exported` / `probeDict`；`tool-tiers` 的 `FORBIDDEN_PATHS` / `pathTokens`；`sa-data-layer` 的 `pathTokens`；`sb-contract-layer` 的 `paths`）且 `dumpPolicy` 做 text 投影；② `S6-TC-A04`：`pathTokens = pathItems + 1` → `pathTokens = pathItems`，且 `deepEqual(P.code, ['代码、测试'])` → 比两项对象 `text`（`['代码','测试']`）；③ `S6-TC-H02` 的 `dump items ↔ PTH.pathGroups` 改比 `text` 投影；④ 槽集 12→15 的 4 块：`S6-TC-C06` / `S6-TC-C08` / `S6-TC-F01` / `S6-TC-F02`；⑤ `S6-TC-F02` 的 `expanded[4] === ''` → `=== SEATS.SEATS['senior-sdet'].clause`；⑥ `S6-TC-G03` 的 `includes('只写')` → `'只允许写'`、`goldenOf('senior-sdet-boundary')` → `goldenCurOf('senior-sdet')`；⑦ `S6-TC-E02` 的 ①「已登记席加组 → gate 仍绿」（探针席 = `senior-sdet`）在 3 席接模板后必红 → 改为「gate 报 `Mismatch`（exit 1）+ 副本内按渲染重写该卡后 exit 0」；② 的「12 席不接渲染层」文案改「11 席默认句 + `evidence-reader` 自有句」；⑧ `SB-TC-05` / `SB-TC-25` / `SB-TC-40` 的判定面：**指针席 2→3**（`POINTER_SEATS` 含 `senior-sdet`），但「有组席」子断言仍为 2 席（按 `allowGroups.length > 0` 过滤），`senior-sdet` 单列「空组 → 无白名单命令」分支；⑨ `SB-TC-13` 的 `TEMPLATE_ALLOWED_LITERALS.size === 12` → 派生式 `size === 结构化文本常数 + POINTER_SYMBOLS.length − 2`；⑩ `sdet-render.test.mjs` 的「边界段 = 该席专用句」块：`includes('只写')` → `'只允许写'`，标题改「走渲染」 | 不改则 V-8 必红且红点指不到真因（首轮议会 P0） |

## 7 测试

测什么 / 为什么见 §4 的 V-1～V-8；具体用例、前置、步骤、预期、判据与红绿证据一律在测试用例文件：

`2026-11-04-s6-b-boundary-convergence-design-testcase.md`

## 8 不测

1. 不测卡片「读者能否读懂」这类可用性判断（人工评审，不判红）。
2. 不测 `detective-observer` 的 `fixedList` 命令副本（S6 原文 §2 第 7 条，触发未到）。
3. 不测 `evidence-reader` 自有句与 11 席默认句（本批不动，只断言不变）。
4. 不测模板 / 配置读取失败的稳定错误面（S6 原文 §7 表后注，仍留后续）。

## 9 裁决记录

| # | 问题 | 裁定 | 依据 |
|---|---|---|---|
| Q1 | 「按席排除禁写组」的机制 | **写作用域 + 项级排除**；不动配置层三键 | 用户 2026-11-04 选定（三选一）；唯一入口 `docs/after/20261031111000-senior-sdet-boundary-conflict-open-decisions.md` §六 |
| Q2 | `writeScope` 声明放哪层 | 定义层 `seats.mjs` 可选字段；排除项 ID 放 `writeScopes.mjs` | `tools/docgen/components/validatePolicy.mjs:27`（`CONFIG_KEYS` 恰三键）；避免扩配置层 closed-world（不变量 2 不改） |
| Q3 | `代码、测试` 是否拆项 | 拆（`code.src` / `code.test`） | `tools/docgen/policy/definitions/paths.mjs:7`；不拆则无法单独排除「测试」，整组排除会放开「代码」 |
| Q4 | `senior-sdet` 卡面文本变化可否接受 | 可（能力等价，不要求字节等价） | S6 原文 §1 验收行与 §3.6「等价迁移不是字节等价」；字节相等只作定位线索 |
