# 测试用例：P4 零写席建模（首席 reviewer-product）

> 归属 spec：`docs/superpowers/specs/2026-11-11-agent-model-pipeline-p4-design.md`（§2 决策 / §3 代码面 / §4 模型映射 / §5 验收 G1–G7 / §6 风险）
> 编写者：senior-sdet 子代理｜**独立性声明**：编写者 ≠ spec 作者（主 agent）≠ 施工者；本文件只定义判据，不实现
> 状态：草稿（spec 评审前）｜最后更新：2026-11-11
> 命名与落点：与 spec 同目录；文件名 = spec 文件名去 `.md` 后 + `-testcase.md`
> **本轮声明**：只写本文件。未修改 spec，未改任何 `.mjs` / `.json` / `agents/**`，未新建仓内其他文件，未 `git commit`。探针脚本与 mock 模型只落 `$env:TEMP`，跑完已删（`tempCleaned=True`）。
>
> 读过的文件：本批 spec 全文；`docs/superpowers/specs/2026-11-11-agent-model-pipeline-p3-design-testcase.md`（格式样板，全文）；`agents/reviewer-product.md`（全文 76 行）；`tools/agent-model/types/base.mjs`；`tools/agent-model/types/derived.mjs`；`tools/agent-model/types/index.mjs`；`tools/agent-model/render/sections.mjs`；`tools/agent-model/render/index.mjs`；`tools/agent-model/verify-models.mjs`；`tools/agent-model/models/_shared-model.json`；`tools/agent-model/models/reviewer-actuary-model.json`；`tools/docgen/builders/agents/policy/seat-policy.mjs`；`tools/docgen/builders/agents/components/patternRegistry.mjs:1-30`；`tmp/agent-criteria-demo/test-p1.test.mjs`；`tmp/agent-criteria-demo/render-all.mjs`；`tmp/agent-criteria-demo/diff-report.mjs`；`tmp/agent-criteria-demo/update-baseline.mjs`；`tmp/agent-criteria-demo/sandbox/reviewer-actuary.md:1-22`；`package.json`；`scripts/check-all.mjs:80-140`。
>
> 跑过的只读命令（只打印，未改仓）：`node -v`；`node tools/agent-model/verify-models.mjs`；`node -e`（算 `tmp/agent-criteria-demo/sandbox/*.md` 的 sha256 与 md 数、静态数 `^test\(` 条数、`anyError` 表达式的项数、TC-12 共享层名单现状、TC-14 `git show HEAD:` 子集预检）；`node --input-type=module -e`（内存 `renderModel` 7 席并与 sandbox 逐字节比对；取 `reviewer-actuary` 的 must/outputs 行；打印 `BaseModel.fields` 键数；`BaseModel.validate` 对 `defaultLanding=5/true/删键` 的现状探针，得 M-12）；`node --test --test-reporter=tap --test-name-pattern="TC-044 verify" "**/*.test.mjs"`（探 `check-all.mjs:89` 的同款 glob 是否覆盖 `tmp/`，**跑后 sandbox 7 卡哈希未变**）；`scs check skills --root . --manifest skilldependencies/manifest.json --json`；`git status --short`；`node "$env:TEMP\p4-probe.mjs"` 与 `p4-probe2.mjs`（按 spec §4 映射在 TEMP 造 mock 模型 + 内存扩展共享层，探 `verify`/`render` 行为）。TC-10/11/13 的命令另外用现役 `reviewer-actuary` 做过一次同形预演，确认可粘贴、无引号/转义问题（预演输出不作 P4 结论）。
> **未实跑**：`npm run check`、P1 套件全量（二者耗时且会重写 `tmp/agent-criteria-demo/sandbox/`）。G6 末行判据的真相锚取源码 `scripts/check-all.mjs:575`。

**执行状态总说明**：P4 实现尚未落盘——`tools/agent-model/models/reviewer-product-model.json` 与 `models/_baseline/reviewer-product.json` 均不存在，`tools/agent-model/types/base.mjs:75` 仍是 `defaultLanding: ['string', true]`，`sections.mjs` 的三个分支未改。故本文件 18 条用例**全部为「定义」，无一条标「已通过」**；文中出现的数字均为 §0.1 的只读实测锚，用于校准判据，不构成通过声明。

**术语表（首次出现处的中文解释，后文沿用）**

| 术语 | 中文解释 |
|---|---|
| 零写席 | 只读、不写任何文件的席；本批指 `reviewer-product`（spec D1） |
| 落点 | 判定写回哪个产物；模型里由 `defaultLanding` + `outputs.items` 表达 |
| `landingLabel` | 零写席的展示用落点文本（`问题卡`），只作展示，不代表真的写盘 |
| 模型键 | `models/<seat>-model.json` 的顶层键；`BaseModel.fields` 是必填键全集 |
| 码 | `verify` 返回值里的非空错误面（`typeErr` / `cardRuleLeak` / `errs` …），任一非空即红 |
| 共享层 | `models/_shared-model.json`（`rules` / `predicates` / `perspectives` / `forms` / `records`） |
| `appliesWhen` | 共享层规则/谓词的作用席名单，`"*"` 表示全席 |
| 卡面 | `agents/reviewer-product.md`（现役 7 段角色卡） |
| 现役 7 席 | `detective-observer` / `evidence-reader` / `respondent-architect` / `respondent-dev` / `reviewer-actuary` / `reviewer-ai` / `reviewer-audit` |

## 0 测试设计结论（依据与判断）

- 结论 1：**零写形态当前没有模型类型，`verify` 必红**。`ReviewerModel.matches` 要求 `outputs.items` 含 `artifact.issueCard`（`tools/agent-model/types/derived.mjs:8-10`），而 spec D1 要求 `outputs.items: []`；三型全不匹配 → `verify` 返回 `typeErr='TYPE_UNKNOWN'`（`verify-models.mjs:220-222`）→ `anyError` 为真（`verify-models.mjs:228-232`）→ CLI exit 1（`:264`）。实测：`modelType=null typeErr="TYPE_UNKNOWN"`。同时 `render/index.mjs:22` 会静默回落成 `RespondentModel`。要让 G2 的「exit 0」成立，必须动 `derived.mjs`，它不在 spec §3 的「唯一代码面」表内。
- 结论 2：**`seat.artifacts: []` 与「把 reviewer-product 加进 `shared.no-issue-without-fix`」互斥**。该 never 规则的目标是 `issue.card.suggestion`（`_shared-model.json:529-539`），`verify` 的 `cardRuleLeak` 判定是「规则打到问题卡某栏、但本席 `seat.artifacts` 里没有 `artifact.issueCard` 即算泄漏」（`verify-models.mjs:215-218`）。实测 `cardRuleLeak=["shared.no-issue-without-fix"]` → `anyError` 为真。补 `seat.artifacts` 又会连带 `writeScopeBad` / `policyDiff`（`verify-models.mjs:211`、`:145`）与 `__default__.artifacts=[]`（`seat-policy.mjs:14`）冲突。这一条是 spec §4 与 §5 G2 之间的口径冲突，必须在实施前裁决。
- 结论 3：**§4 的「4+4 条 `appliesWhen`」不足以渲染**。`renderRule` 取 `M.predicates[rule.criterion].ok`（`sections.mjs:57-58`），而 `expand` 只把「谓词自身 `appliesWhen` 命中本席」的谓词放进 `M.predicates`（`verify-models.mjs:86`）。实测：规则命中、谓词未命中时抛 `Cannot read properties of undefined (reading 'ok')`。故 8 条谓词（`impartial-long-term` / `evidence-recomputable` / `plain-expression` / `no-fake-problem` / `issue-without-solution` / `out-of-scope-self-disposal` / `blank-evidence` / `proxy-fill`）也要同步加 `reviewer-product`。
- 结论 4：**`defaultLanding: null` 在现状渲染下是崩溃，不是显示问题**。`sections.must` 直接 `h.F[M.defaultLanding].text`（`sections.mjs:122`），`null` 索引得到 `undefined`。实测 `mustRendered=THREW Cannot read properties of undefined (reading 'text')`；而 `sections.duty` 在 `outputs.items=[]` 时实测渲染出 `判定写回 。`（空落点），正是 spec 文件第 27–28 行（§3 表的第 2、3 行）要修的两处。
- 结论 5：**G2 的「8 行」需要改两处不在 §3 表里的文件**：`verify-models.mjs:236-237` 的 CLI 默认名单只有 7 席；`models/_baseline/reviewer-product.json` 不存在，且 `update-baseline.mjs:8` 的名单同样只有 7 席（`verify-models.mjs:103` 会无条件读该基线）。缺基线时 `verify` 直接 `ENOENT`。
- 结论 6：**G1 与 G3 互斥**：第 8 个模型会让 P1 套件的两处固定计数变红——`test-p1.test.mjs:258` 断言 `render-all` 产物为 7 个 md，`:291` 断言 sandbox 为 8 个 md（7 卡 + 报告）。而 `check-all.mjs:89` 的 `**/*.test.mjs` 确实会跑到 `tmp/` 下该文件（实测 `TC-044` 在全仓 glob 下执行、`# tests 73`）。即：G1「29/29」与 G6 都要同步改断言，spec 未写这一步。
- 结论 7：**G4 的「7 段」在现状下会是 8 段**。`sections.permissions` 恒返回 `## 权限`（`sections.mjs:194-203`），零写席会多一段「写文件：不得写任何文件」。要满足字面「7 段」必须额外给零写席裁掉权限段，spec §3 未要求；按 P1 的 K1 口径（产出/权限属「仅沙箱」）保留更一致。故用例判「卡面 7 段齐全、额外段 ⊆ {权限}」。
- 结论 8：**G5 的「6 段逐字相等」不可达**。按 §4 映射造 mock 模型渲染后与现役卡逐段比对，只有 `边界` 一致（delta=0）；`禁止` / `冲突裁决` / `本席清单` / `输出格式` 分别差 -35 / -25 / +106 / -232 字符（卡面的「人工判定」「采纳了哪一条」「产物字段名只许…」等散文在模型里没有同形来源，且 `outputs.items=[]` 后 `- 字段名只用 …` 那行随 `## 产出` 一起消失）。故「逐字相等」只能对 `边界` 做机器判，其余按「已知差异」人工归类（TC-17）。另：`diff-report.mjs:10` 硬编码 7 席，本席不会出现在该报告里，G5 的段级 diff 不能靠它产出。
- 结论 9：**原始类型在 `checkShape` 里静默放行，所以「拒绝非法类型」不是现状**。`checkShape` 对 `VALUE_CHECKS` 里没有的类型直接返回 `null`（`base.mjs:37-42`；`string` / `number` 均未登记）。实测对现役 `['string', true]`：`defaultLanding=5` 与 `=true` 都返回 `[]`（无错），只有删键才报 `MISSING`。故 spec §3「`checkValue` 增 null 分支」若只写「`v === null` 放行」而不加显式类型守卫，`5`/`true` 仍会被收下——TC-02 会红，且这正是本条要守的东西。

## 0.1 现状锚（只读实测：命令 + 首行）

| # | 锚 | 命令 | 实测输出（首行 / 关键值） | 用在哪 |
|---|---|---|---|---|
| M-1 | 现役 7 席校验全绿 | `node tools/agent-model/verify-models.mjs` | `evidence-reader  [RespondentModel]  must=3 never=3 pred=9 rec=20  EQUIVALENT`（共 7 行，末行 `reviewer-audit … EQUIVALENT`，`exit=0`） | TC-10 的基线对照 |
| M-2 | sandbox 7 卡哈希与 md 数 | `node -e "…readdirSync('tmp/agent-criteria-demo/sandbox')…sha256…"` | `mdCount=8`；7 卡哈希见下表 | TC-06 / TC-11 |
| M-3 | 内存渲染与 sandbox 逐字节相同 | `node --input-type=module -e "…renderModel…===disk…"` | 7 行全 `sameAsSandbox=true`（`reviewer-actuary` → `ReviewerModel 80 sameAsSandbox=true len=1786`） | TC-06 |
| M-4 | P1 用例条数（静态） | `node -e "…(t.match(/^test\(/gm)||[]).length"` | `p1Tests=29` | TC-07 |
| M-5 | 技能守卫现状 | `scs check skills --root . --manifest skilldependencies/manifest.json --json` | `{ "findings": [] }`，`scsExit=0` | TC-16 |
| M-6 | 全仓测试 glob 覆盖 `tmp/` | `node --test --test-reporter=tap --test-name-pattern="TC-044 verify" "**/*.test.mjs"` | `ok 14 - TC-044 verify 全绿且 exit 0`、`# tests 73`、`exit=0` | 结论 6 / TC-07 / TC-15 |
| M-7 | `defaultLanding:null` 现状崩溃 | TEMP 探针：`sections.must(M,sh,makeHelpers(M,sh))` | `mustRendered=THREW Cannot read properties of undefined (reading 'text')`（落点 `sections.mjs:122`） | 结论 4 / TC-04 |
| M-8 | 零写席的 `typeErr` / `cardRuleLeak` | TEMP 探针：`verify('reviewer-product',{modelPath:{TEMP},shared:{内存扩展副本},baseline:false})` | `modelType=null`、`typeErr="TYPE_UNKNOWN"`、`policyDiff=false`、`cardRuleLeak=["shared.no-issue-without-fix"]`、`tierBad=""` | 结论 1/2 / TC-09 |
| M-9 | 谓词未同步即崩 | TEMP 探针：规则命中、`predicates` 为空 | `THREW=Cannot read properties of undefined (reading 'ok')`（`sections.mjs:57`） | 结论 3 / TC-12 |
| M-10 | 运行时 | `node -v` | `v24.22.2` | 全部判据的机器口径 |
| M-11 | 现役 actuary 的非空分支锚 | `node --input-type=module -e "…sections.must/sections.outputs…"` | `mustLine=> 判定写回 \`issue-card.md\`。`、`outputsLines=4` | TC-04 / TC-05 |
| M-12 | 原始类型不被校验 | `node --input-type=module -e "…BaseModel.validate…defaultLanding=5/true…"`（对现役 actuary） | `missing=["MISSING:defaultLanding"] number=[] bool=[] str=[]` | 结论 9 / TC-02 |

**7 卡哈希锚（M-2，`tmp/agent-criteria-demo/sandbox/<seat>.md` 的 sha256，大写）**

| 席 | sha256 |
|---|---|
| detective-observer | `41BAC14BD0E53E9CA6443EC3452AA6E70BED10D7BB85EC4EB0CF52FD28E3A856` |
| evidence-reader | `D72D92D932B9BCF5981C39CBE13A0902DB3BD39313910496C5E03A11C6D0DBB7` |
| respondent-architect | `DED7AC9B05C612D8DE7B9891E6E0114FEBEBDE4331A51BE7F9B16F57EA84634E` |
| respondent-dev | `78C022470A8AB7A34508B6A47209F253799270DBDA42395D9D5591B26136E143` |
| reviewer-actuary | `BC157078179A77C5E6BE0C22AF786716DEBE95F8855C2EBAD6A88DF6AB952C5B` |
| reviewer-ai | `52B6C6742B1C7D2DE50B35B34C7B924A56CDFD822F5E465241DB9DDFF286C791` |
| reviewer-audit | `876BA53EC96A21170A878CEC614BD610875EEFABCD4BF2B7BC219C5BA867E652` |

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目 | 类型 | 判据 | 优先级 |
|---|---|---|---|---|
| TC-01 | §3 第 1 行（`defaultLanding` 类型扩为 `string` 或 `null`）正例 | 单元 | 机器 | P0 |
| TC-02 | §3 第 1 行「仍必填、只允许值为 null」负例 | 负例 | 机器 | P0 |
| TC-03 | §3 第 2 行（duty 落点分支）+ D1 `landingLabel` | 单元 | 机器 | P0 |
| TC-04 | §3 第 3 行（must 段 null 分支）+ D1 | 单元 | 机器 | P0 |
| TC-05 | §3 第 4 行（outputs 空段返回 `[]`，不留空标题） | 单元 | 机器 | P0 |
| TC-06 | §5 G1 前半（7 席字节不变）+ §6 风险 2 | 集成 | 机器 | P0 |
| TC-07 | §5 G1 后半（P1 套件 `pass 29` / `fail 0`） | 集成 | 机器 | P0 |
| TC-08 | §4 全表（键完整性、零写四件套、7 项清单、9+3 输出格式） | 集成 | 机器 | P0 |
| TC-09 | §5 G2 的「无码」+ §4 `seat.tier`/`permissions` + §6 风险 4 | 集成 | 机器 | P0 |
| TC-10 | §5 G2（8 行 `EQUIVALENT`、exit 0）+ 基线存在性 | 集成 | 机器 | P0 |
| TC-11 | §5 G3 + G4（9 个 md、7 段、duty 句、无空落点） | 集成 | 机器 | P0 |
| TC-12 | §2 D2 + §4 `must`/`never`「仅共享层」+ §6 风险 3 | 单元 | 机器 | P0 |
| TC-13 | 负例：删 `landingLabel` 后判据必须能抓到（§3 第 2 行的抓取力） | 负例 | 机器 | P0 |
| TC-14 | §6 风险 3「共享层只增不改」 | 负例 | 机器 | P1 |
| TC-15 | §5 G6（`npm run check` 末行） | 集成 | 机器 | P0 |
| TC-16 | §5 G7（`scs check skills` findings 空） | 集成 | 机器 | P0 |
| TC-17 | §5 G5（段级对照 + 已知差异归类） | 集成 | 人工 | P1 |
| TC-18 | §2 D3 + §4 `checklist`/`checkCriteria`（7 项同形风险） | 集成 | 人工 | P2 |

**覆盖核对**：§2 D1 → TC-03/04/05/08/09；D2 → TC-12/14；D3 → TC-08（7 键）+ TC-18；D4（逐席串行流程）→ 未覆盖（见 §4）。§3 四行改动 → TC-01/02（base.mjs）、TC-03/04/05（sections.mjs 三分支）、TC-13（分支抓取力）。§4 十四行映射 → TC-08 逐键 + TC-09（`tier`/`permissions`）+ TC-11（`boundary` 渲染）。§5 G1–G7 → TC-06/07（G1）、TC-09/10（G2）、TC-11（G3/G4）、TC-17（G5）、TC-15（G6）、TC-16（G7）。§6 四个风险 → TC-06（风险 2）、TC-12/14（风险 3）、TC-09（风险 4）、TC-18（风险 1）。spec §2/§3/§4/§5/§6 的可判条目未覆盖数 **0**（G5 的「逐字相等」以人工承接，理由见结论 8 与 TC-17）。

**计数**：单元 **5** 条（TC-01/03/04/05/12）、集成 **10** 条（TC-06/07/08/09/10/11/15/16/17/18）、负例 **3** 条（TC-02/13/14），合计 **18**；其中**机器判 16** 条、**人工判 2** 条（TC-17/18）。

## 2 用例明细

### TC-01 `defaultLanding = null` 通过校验；字符串值不受影响

- **覆盖**：spec §3 第 1 行（`defaultLanding: ['string|null', true]` 的「值为 null 合法」一半）
- **目的**：证明 schema 扩到 `string|null` 后，零写席能通过「必填 + 类型」两关，且没有把原来允许的字符串值误禁。
- **前置**：`tools/agent-model/models/reviewer-product-model.json` 已落盘且 `defaultLanding` 为 `null`；`types/base.mjs:75` 已改。
- **步骤**：① 读正式模型；② 用 `BaseModel.validate` 分别校验「`defaultLanding=null`」与「`defaultLanding='artifact.issueCard'`」两份副本；③ 只看与 `defaultLanding` 相关的错误串。
- **判据（机器）**：
```powershell
node --input-type=module -e "import{BaseModel}from'./tools/agent-model/types/base.mjs';import{readFileSync}from'node:fs';const m=JSON.parse(readFileSync('tools/agent-model/models/reviewer-product-model.json','utf8'));const only=(fn)=>{const x=structuredClone(m);fn(x);return BaseModel.validate(x).filter(e=>e.includes('defaultLanding'))};console.log('null='+JSON.stringify(only(x=>{x.defaultLanding=null}))+' string='+JSON.stringify(only(x=>{x.defaultLanding='artifact.issueCard'})))"
```
→ 首行 `null=[] string=[]`。
- **对应测试/交付物**：`tools/agent-model/types/base.mjs:75` + `checkValue`（`:44-63`）的 null 分支；验收人 = 主 agent。
- **不覆盖**：不判 `null` 是否被渲染正确消费（TC-04 承接）。

### TC-02 负例：`defaultLanding` 缺键仍报 `MISSING`，非法类型仍报 `TYPE`

- **覆盖**：spec §3 第 1 行「仍必填（键必须在），只允许值为 null」
- **目的**：防「为了放行 null 把必填改成可选」或「类型写成 `any`」——这两种改法会让 TC-01 变绿而契约失效。
- **前置**：同 TC-01。
- **步骤**：① 读正式模型；② 分别造三份副本：删键、置 `5`、置 `true`；③ 各跑 `BaseModel.validate` 并筛 `defaultLanding` 相关错误。
- **判据（机器）**：
```powershell
node --input-type=module -e "import{BaseModel}from'./tools/agent-model/types/base.mjs';import{readFileSync}from'node:fs';const m=JSON.parse(readFileSync('tools/agent-model/models/reviewer-product-model.json','utf8'));const only=(fn)=>{const x=structuredClone(m);fn(x);return BaseModel.validate(x).filter(e=>e.includes('defaultLanding'))};console.log('missing='+JSON.stringify(only(x=>{delete x.defaultLanding}))+' number='+JSON.stringify(only(x=>{x.defaultLanding=5}))+' bool='+JSON.stringify(only(x=>{x.defaultLanding=true})))"
```
→ 首行 `missing=["MISSING:defaultLanding"] number=["TYPE:defaultLanding!=string|null"] bool=["TYPE:defaultLanding!=string|null"]`（串形状来自 `base.mjs:34` 的 `MISSING:` 与 `:40` 的 `TYPE:${p}!=${type}`；若实现另造串，需与 `base.mjs` 现有形态一致）。
- **对应测试/交付物**：同 TC-01；验收人 = 主 agent。
- **关键前提**：`number` / `bool` 两格**不是现状回归**。对现役 `['string', true]` 实测 `defaultLanding=5` 与 `=true` 均返回 `[]`——`checkShape` 对未登记类型静默放行（结论 9）。要满足本条，`checkValue` 必须显式判 `string|null`（而不是只加 `v === null` 放行）；只加 null 分支的实现会让本条红，这是有意的判别点。

### TC-03 零写席 duty 分支：落点用 `landingLabel`，不出现空落点

- **覆盖**：spec §3 第 2 行（`outputs.items` 为空时用 `landingLabel`，文案 `<label>（只记入评审账本，不写文件）`）+ D1
- **目的**：`sections.duty` 现状用 `outputs.items.map(...).join(...)` 拼落点（`sections.mjs:104`），`items=[]` 时实测渲染出 `判定写回 。`（空落点，见结论 4）。本条锁定「零写席说清写回哪里」这一句。
- **前置**：模型已落盘；`sections.mjs:104` 已改。
- **步骤**：① 用共享层展开正式模型；② 取 `sections.duty` 的「动作：…」行；③ 判三个布尔：含规整落点句、无空落点、无 `undefined`/`null`。
- **判据（机器）**：
```powershell
node --input-type=module -e "import{readFileSync}from'node:fs';import{expand}from'./tools/agent-model/verify-models.mjs';import{makeHelpers,sections}from'./tools/agent-model/render/sections.mjs';const sh=JSON.parse(readFileSync('tools/agent-model/models/_shared-model.json','utf8'));const M={...sh,...expand('tools/agent-model/models/reviewer-product-model.json',sh)};const line=sections.duty(M,sh,makeHelpers(M,sh)).find(l=>l.startsWith('动作：'));console.log('hasLabel='+line.includes('问题卡（只记入评审账本，不写文件）')+' emptyWriteBack='+/写回\s*。/.test(line)+' hasUndef='+/undefined|null/.test(line))"
```
→ 首行 `hasLabel=true emptyWriteBack=false hasUndef=false`。
- **对应测试/交付物**：`tools/agent-model/render/sections.mjs:102-116`；验收人 = 主 agent。
- **不覆盖**：不冻结「写回」二字前后是否需要额外空格（spec 只冻结 `<label>（…）` 这一串）。

### TC-04 零写席 must 分支：`defaultLanding=null` 不崩、给出「只记入账本」句；非空分支逐字不变

- **覆盖**：spec §3 第 3 行（`null` → `> 判定只记入本轮评审账本，不写盘。`；否则保持现状）
- **目的**：现状 `sections.mjs:122` 直接 `h.F[M.defaultLanding].text`，`null` 实测抛 `TypeError…reading 'text'`（M-7）。本条同时守「非空分支不被这次改动带偏」——用 `reviewer-actuary` 的 sandbox 行做逐字锚。
- **前置**：模型已落盘；`sections.mjs:122` 已改。
- **步骤**：① 分别展开零写席与 `reviewer-actuary`；② 各取 must 段的「判定…」行；③ 零写席行必须逐字等于 spec 句；④ actuary 行必须与 `sandbox/reviewer-actuary.md` 里同位置行逐字相同。
- **判据（机器）**：
```powershell
node --input-type=module -e "import{readFileSync}from'node:fs';import{expand}from'./tools/agent-model/verify-models.mjs';import{makeHelpers,sections}from'./tools/agent-model/render/sections.mjs';const sh=JSON.parse(readFileSync('tools/agent-model/models/_shared-model.json','utf8'));const lineOf=(p)=>{const M={...sh,...expand(p,sh)};return sections.must(M,sh,makeHelpers(M,sh)).find(l=>l.startsWith('> 判定'))};const z=lineOf('tools/agent-model/models/reviewer-product-model.json');const a=lineOf('tools/agent-model/models/reviewer-actuary-model.json');const sand=readFileSync('tmp/agent-criteria-demo/sandbox/reviewer-actuary.md','utf8').split('\n').find(l=>l.startsWith('> 判定写回'));console.log('zero='+z+' nonZeroSame='+(a===sand))"
```
→ 首行 `zero=> 判定只记入本轮评审账本，不写盘。 nonZeroSame=true`。
- **对应测试/交付物**：`tools/agent-model/render/sections.mjs:118-132`；对照物 `tmp/agent-criteria-demo/sandbox/reviewer-actuary.md:18`（`> 判定写回 \`issue-card.md\`。`）。
- **不覆盖**：不判 must 段条目条数（由 TC-08 的规则名单与 TC-11 的段存在性承接）。

### TC-05 零写席 outputs 分支：`items=[]` 返回 `[]`，不留空标题；非空分支行数不变

- **覆盖**：spec §3 第 4 行（`items` 为空返回 `[]`，遵循 P1「空段跳过」）
- **目的**：现状 `sections.outputs` 无条件产出 `## 产出` 与 `- 字段名只用 …`（`sections.mjs:184-192`），零写席会留下一个没有条目的空段。本条同时守非空席的段行数不变（M-11 实测 4 行）。
- **前置**：模型已落盘；`sections.mjs:184` 已改。
- **步骤**：① 展开零写席与 `reviewer-actuary`；② 调 `sections.outputs`；③ 零写席必须 `deepEqual []`；④ actuary 行数必须仍是 4。
- **判据（机器）**：
```powershell
node --input-type=module -e "import{readFileSync}from'node:fs';import{expand}from'./tools/agent-model/verify-models.mjs';import{makeHelpers,sections}from'./tools/agent-model/render/sections.mjs';const sh=JSON.parse(readFileSync('tools/agent-model/models/_shared-model.json','utf8'));const outOf=(p)=>{const M={...sh,...expand(p,sh)};return sections.outputs(M,sh,makeHelpers(M,sh))};const z=outOf('tools/agent-model/models/reviewer-product-model.json');const a=outOf('tools/agent-model/models/reviewer-actuary-model.json');console.log('empty='+JSON.stringify(z)+' nonEmptyLen='+a.length)"
```
→ 首行 `empty=[] nonEmptyLen=4`。
- **对应测试/交付物**：`tools/agent-model/render/sections.mjs:184-192`；对照物 `tmp/agent-criteria-demo/sandbox/reviewer-actuary.md` 的 `## 产出` 段。
- **说明**：`items=[]` 后卡面第 73 行「产物字段名只许 …」在渲染产物中一并消失，属 G5 的已知差异（见结论 8、TC-17）。

### TC-06 现役 7 席渲染字节不变：内存渲染 = sandbox 文件 = 哈希锚

- **覆盖**：spec §5 G1 前半 + §6 风险 2（`defaultLanding` 改动影响 7 张现模型）
- **目的**：`base.mjs` / `sections.mjs` 的改动是全局的；用「同哈希」把「7 席没被新分支带偏」变成可核事实，而不是靠 G1 的一条计数。
- **前置**：`base.mjs` / `sections.mjs` 已改；`tmp/agent-criteria-demo/sandbox/*.md` 为改动前产物（哈希见 §0.1）。
- **步骤**：① 逐个内存渲染 7 席；② 与 sandbox 同席文件逐字节比对；③ 打印各自 sha256；④ 与 §0.1 的 7 个哈希逐一对照。
- **判据（机器）**：
```powershell
node --input-type=module -e "import{readFileSync}from'node:fs';import{createHash}from'node:crypto';import{renderModel}from'./tools/agent-model/render/index.mjs';const sh=JSON.parse(readFileSync('tools/agent-model/models/_shared-model.json','utf8'));const seats=['detective-observer','evidence-reader','respondent-architect','respondent-dev','reviewer-actuary','reviewer-ai','reviewer-audit'];let same=0;for(const s of seats){const t=renderModel('tools/agent-model/models/'+s+'-model.json',sh);const disk=readFileSync('tmp/agent-criteria-demo/sandbox/'+s+'.md','utf8');const ok=t.text===disk;if(ok)same++;console.log(s+' same='+ok+' sha='+createHash('sha256').update(t.text).digest('hex').toUpperCase())};console.log('total='+same+'/7')"
```
→ 7 行 `same=true` + 末行 `total=7/7`；7 个 sha 与 §0.1 表逐一相等。
- **对应测试/交付物**：`tmp/agent-criteria-demo/test-p1.test.mjs` 的既有断言（`TC-007` / `TC-006` / `TC-024`）为同源冗余；验收人 = 主 agent。
- **说明**：`reviewer-product` 不在 seats 名单内是刻意的——本条只判现役 7 席；第 8 席由 TC-11 判。

### TC-07 门禁 G1：P1 套件 `pass 29` / `fail 0`

- **覆盖**：spec §5 G1 后半
- **目的**：P1 的 29 条是渲染器的既有回归网；P4 只应改动「空段/空落点」相关分支，任何一条变红都说明动到了别席。
- **前置**：`base.mjs` / `sections.mjs` 改动完成；若为第 8 席改过 `test-p1.test.mjs` 里的固定计数（结论 6），改动已落盘。
- **步骤**：① 从仓根对 P1 文件跑 TAP 报告器；② 取 `# tests` / `# pass` / `# fail` 三行。
- **判据（机器）**：
```powershell
node --test --test-reporter=tap tmp/agent-criteria-demo/test-p1.test.mjs | Select-String '^# (tests|pass|fail)'
```
→ 三行 `# tests 29`、`# pass 29`、`# fail 0`（M-4 的静态条数锚 = 29）。
- **对应测试/交付物**：`tmp/agent-criteria-demo/test-p1.test.mjs`；该文件同时被 `npm run check` 的测试段收入（M-6），故与 TC-15 互为冗余。
- **说明**：该套件自建自删 `tmp/p1-case-<pid>` 副本目录，并会重写 `tmp/agent-criteria-demo/sandbox/`；跑完须复核 TC-06 的哈希未变。

### TC-08 模型键完整性：19 键、零写四件套、7 项清单、9+3 输出格式

- **覆盖**：spec §4 整张映射表（`seat` / `duty` / `checklist` / `checkCriteria` / `outputFormat` / `templates` / `forms` / `outputs` / `defaultLanding` / `permissions` / `escalation` / `boundary`）
- **目的**：把「模型照 §4 建全」变成一次可数；零写四件套（`seat.artifacts=[]`、`outputs.items=[]`、`permissions.write.allow=[]`、`defaultLanding=null`）是 D1 的硬形态，缺一件就会走回写分支。
- **前置**：`tools/agent-model/models/reviewer-product-model.json` 已落盘。
- **步骤**：① 读模型；② 以 `BaseModel.fields` 的 18 键 + `boundary` 为期望键集（共 19）求差；③ 打印零写四件套与 7/7/9+3 计数。
- **判据（机器）**：
```powershell
node --input-type=module -e "import{BaseModel}from'./tools/agent-model/types/base.mjs';import{readFileSync}from'node:fs';const m=JSON.parse(readFileSync('tools/agent-model/models/reviewer-product-model.json','utf8'));const need=[...Object.keys(BaseModel.fields),'boundary'];const missing=need.filter(k=>!(k in m));const extra=Object.keys(m).filter(k=>!need.includes(k));console.log('keys='+Object.keys(m).length+' missing='+JSON.stringify(missing)+' extra='+JSON.stringify(extra));console.log('artifacts='+JSON.stringify(m.seat.artifacts)+' outputs='+JSON.stringify(m.outputs.items)+' writeAllow='+JSON.stringify(m.permissions.write.allow)+' landing='+JSON.stringify(m.defaultLanding));console.log('checklist='+m.checklist.items.length+' criteria='+Object.keys(m.checkCriteria).length+' ofFields='+m.outputFormat.requiredFields.length+' ofChecks='+m.outputFormat.checks.length+' templates='+Object.keys(m.templates).length+' forms='+Object.keys(m.forms).length+' escalation='+JSON.stringify(m.escalation))"
```
→ 三行：
`keys=19 missing=[] extra=[]`
`artifacts=[] outputs=[] writeAllow=[] landing=null`
`checklist=7 criteria=7 ofFields=9 ofChecks=3 templates=0 forms=0 escalation=null`
- **对应测试/交付物**：`tools/agent-model/models/reviewer-product-model.json`；判据源 `agents/reviewer-product.md:35-46`（7 项）、`:49-61`（9 字段）、`:65-67`（3 条校验）、`:75-76`（零写边界）。
- **说明**：若实现额外显式写 `never: []`，`extra=["never"]` 属可接受变体（`never` 不在 `BaseModel.fields` 内）；`must` 必须存在（`BaseModel.fields:84` 标必填），故 19 键是正解、20 键是唯一合法变体。

### TC-09 `verify('reviewer-product')` 无码、`policyDiff=false`、tier 由 policy 推导

- **覆盖**：spec §5 G2 的「无码」侧 + §4 `seat.tier`/`permissions` 两行 + §6 风险 4（policy 未登记，走 `__default__`）
- **目的**：把 `anyError` 的 20 个错误面逐个摊开（`verify-models.mjs:228-232` 的 `r.*` 逐项计数 = 20；判据里的 `pools` 覆盖其中 19 个 + 单独打印 `policyDiff`），防「只看 `errs` 为空就判绿」。本条会直接暴露结论 1（`TYPE_UNKNOWN`）与结论 2（`cardRuleLeak`）。
- **前置**：模型已落盘；`models/_baseline/reviewer-product.json` 已存在（否则 `ENOENT`）。
- **步骤**：① 调 `verify('reviewer-product')`（走默认基线）；② 汇总所有非空错误面；③ 打印 `policyDiff`、`anyError`、`tier`、`modelType`。
- **判据（机器）**：
```powershell
node --input-type=module -e "import{verify,anyError}from'./tools/agent-model/verify-models.mjs';const r=verify('reviewer-product');const pools={typeErr:[r.typeErr],tierBad:[r.tierBad],boundaryBad:[r.boundaryBad],errs:r.errs,ownFail:r.ownFail,pathUndefined:r.pathUndefined,actionConflict:r.actionConflict,unknownAction:r.unknownAction,permOrphan:r.permOrphan,permUnobservable:r.permUnobservable,titleDrifts:r.titleDrifts,pathBad:r.pathBad,skillBad:r.skillBad,triggerBad:r.triggerBad,actionBad:r.actionBad,outputTextHandwritten:r.outputTextHandwritten,writeScopeBad:[r.writeScopeBad],outputUnwritable:r.outputUnwritable,cardRuleLeak:r.cardRuleLeak};const codes=Object.entries(pools).flatMap(([k,v])=>v.filter(Boolean).map(x=>k+':'+x));console.log('codes='+JSON.stringify(codes)+' policyDiff='+r.policyDiff+' anyError='+Boolean(anyError(r))+' tier='+r.tier+' modelType='+r.modelType)"
```
→ 首行 `codes=[] policyDiff=false anyError=false tier=readOnly modelType=<非 null>`。
- **对应测试/交付物**：`tools/agent-model/verify-models.mjs:95-225`（`verify` 全量错误面）与 `:228-232`（`anyError`）；验收人 = 主 agent。
- **不覆盖**：不冻结 `modelType` 的具体类型名（spec §4 未写；`ReviewerModel` 是 §5 报告里的观测值，不是契约）。若实现新增类型名，本条只要求非 `null`。
- **失败含义**：`codes=["typeErr:TYPE_UNKNOWN"]` → 结论 1；`codes=["cardRuleLeak:shared.no-issue-without-fix"]` → 结论 2。

### TC-10 门禁 G2：CLI 8 行 `EQUIVALENT`、exit 0、基线在

- **覆盖**：spec §5 G2
- **目的**：CLI 是 `npm run check` 之外最常用的手工门禁；本条同时守「默认名单加席」（结论 5）与「基线文件存在」两件 spec 未写但 G2 必需的事。
- **前置**：TC-09 已绿（否则本条的 `eq` 计数会红）；`_baseline/reviewer-product.json` 已生成。
- **步骤**：① 不带参跑 CLI（走默认名单）；② 数行数、以 `EQUIVALENT` 结尾的行数、`reviewer-product` 开头的行数；③ 记退出码；④ 判基线文件存在。
- **判据（机器）**：
```powershell
$o = @(node tools/agent-model/verify-models.mjs)
$eq = ($o | Select-String 'EQUIVALENT$').Count
$rp = ($o | Select-String '^reviewer-product').Count
"lines=$($o.Count) eq=$eq rp=$rp exit=$LASTEXITCODE"
"baseline=$([bool](Test-Path tools/agent-model/models/_baseline/reviewer-product.json))"
```
→ 首行 `lines=8 eq=8 rp=1 exit=0`，次行 `baseline=True`（改动前 M-1 为 7 行）。
- **对应测试/交付物**：`tools/agent-model/verify-models.mjs:234-264`（CLI 段与默认名单 `:236-237`）、`models/_baseline/reviewer-product.json`；验收人 = 主 agent。
- **说明**：若某行带尾随错误面（如 `… EQUIVALENT  ISSUE_RULE_ON_NON_ISSUER …`），`EQUIVALENT$` 不会命中，`eq` 会小于 8——这正是本条要抓的形态。

### TC-11 门禁 G3/G4：`sandbox/reviewer-product.md` 的 9 个 md、7 段、duty 句、无空落点、边界逐字

- **覆盖**：spec §5 G3 + G4
- **目的**：把 spec 明确冻结的几处渲染结果一次判完：卡面 7 段齐全且有序、duty 句含规整落点、全文无 `写回 。`、无 `## 产出` 空标题、边界正文与 `DEFAULT_BOUNDARY` 逐字相等。
- **前置**：模型已落盘；TC-03/04/05 已绿（否则渲染可能崩或出空段）。
- **步骤**：① 跑 `render-all.mjs`（它会先清空 `sandbox/*.md` 再按 `models/` 逐席渲染）；② 跑 `diff-report.mjs`；③ 读产物做五项检查。
- **判据（机器）**：
```powershell
node tmp/agent-criteria-demo/render-all.mjs
"renderExit=$LASTEXITCODE"
node tmp/agent-criteria-demo/diff-report.mjs
"reportExit=$LASTEXITCODE"
node --input-type=module -e "import{readFileSync,readdirSync}from'node:fs';import{DEFAULT_BOUNDARY}from'./tools/docgen/builders/agents/components/patternRegistry.mjs';const t=readFileSync('tmp/agent-criteria-demo/sandbox/reviewer-product.md','utf8');const secs=t.split(/\n## /).slice(1).map(x=>x.slice(0,x.indexOf('\n')));const need=['职责','一定会','禁止','冲突裁决','本席清单','输出格式','边界'];const idx=need.map(n=>secs.indexOf(n));const body=(n)=>{const s=t.split(/\n## /).find(x=>x.startsWith(n+'\n'));return s?s.slice(s.indexOf('\n')+1).replace(/\s+$/,''):''};const duty=t.split('\n').find(l=>l.startsWith('动作：'))||'';const md=readdirSync('tmp/agent-criteria-demo/sandbox').filter(f=>f.endsWith('.md')).length;console.log('mdCount='+md+' has7='+idx.every(i=>i>=0)+' ordered='+idx.every((v,i)=>v>=0&&(i===0||v>idx[i-1])));console.log('extra='+JSON.stringify(secs.filter(s=>!need.includes(s)))+' dutyLabel='+duty.includes('问题卡（只记入评审账本，不写文件）')+' emptyWriteBack='+/写回\s*。/.test(t)+' outputsSec='+secs.includes('产出')+' boundaryEq='+(body('边界')===DEFAULT_BOUNDARY)"
```
→ `renderExit=0`、`reportExit=0`，随后：
`mdCount=9 has7=true ordered=true`
`extra=["权限"] dutyLabel=true emptyWriteBack=false outputsSec=false boundaryEq=true`
（`extra=[]` 也接受——见结论 7；`mdCount=9` = 8 卡 + 1 报告）
- **对应测试/交付物**：`tmp/agent-criteria-demo/sandbox/reviewer-product.md`、`tmp/agent-criteria-demo/sandbox/diff-report.md`；渲染入口 `render-all.mjs:21-22`、`render/index.mjs:19-26`；验收人 = 主 agent。
- **不覆盖**：不判 `## 权限` 段的内容措辞（K1 已知「仅沙箱」）；`## 产出` 的**缺失**是因为 `items=[]`，其内容（`- 字段名只用 …`）丢失记入 TC-17。

### TC-12 共享层：4 条 must + 4 条 never 含本席，且**不在** `no-perfunctory-fix`；8 条谓词同步

- **覆盖**：spec §2 D2 + §4「`must`/`never` 仅共享层」+ §6 风险 3
- **目的**：卡面 5 条「一定会」= 共享 4 条 must（`no-fake-problem` 两目标出 2 条）；卡面 4 条「禁止」= 共享 4 条 never（排除卡面没有的 `no-perfunctory-fix`）。谓词不同步会让渲染在 `sections.mjs:57` 抛错（M-9），故一并判。
- **前置**：`models/_shared-model.json` 已改。
- **步骤**：① 读共享层；② 按 4+4 名单判 `reviewer-product` 是否在 `appliesWhen`；③ 判 `no-perfunctory-fix` 不在；④ 判 8 条谓词命中（`"*"` 视为命中）；⑤ 判 `perspectives.product` 存在。
- **判据（机器）**：
```powershell
node -e "const s=require('./tools/agent-model/models/_shared-model.json');const has=(a,id)=>a==='*'||(Array.isArray(a)&&a.includes(id));const g=(arr,id)=>arr.find(r=>r.id===id).appliesWhen;const must4=['shared.impartial-long-term','shared.evidence','shared.plain-expression','shared.no-fake-problem'];const never4=['shared.no-issue-without-fix','shared.no-self-disposal','shared.no-blank-evidence','shared.no-proxy-fill'];const predNeed=['impartial-long-term','evidence-recomputable','plain-expression','no-fake-problem','issue-without-solution','out-of-scope-self-disposal','blank-evidence','proxy-fill'];console.log('must4='+must4.every(id=>has(g(s.rules.must,id),'reviewer-product'))+' never4='+never4.every(id=>has(g(s.rules.never,id),'reviewer-product'))+' notPerf='+!has(g(s.rules.never,'shared.no-perfunctory-fix'),'reviewer-product')+' persp='+s.perspectives.product+' predMissing='+JSON.stringify(predNeed.filter(k=>!has(s.predicates[k].appliesWhen,'reviewer-product'))))"
```
→ 首行 `must4=true never4=true notPerf=true persp=产品视角 predMissing=[]`。
- **对应测试/交付物**：`tools/agent-model/models/_shared-model.json` 的 `rules.must`（`:459-526`）、`rules.never`（`:527-603`）、`predicates`（`:276-458`）、`perspectives`（`:1331-1334`）；验收人 = 主 agent。
- **说明**：`predMissing` 不在 spec §4 字面里，但渲染依赖它（结论 3）；本条把它与 4+4 一起判，避免「校验绿、渲染崩」。

### TC-13 负例：删掉 `landingLabel` 后，TC-03 的判据必须能抓到

- **覆盖**：spec §3 第 2 行的**抓取力**（不是新契约）
- **目的**：TC-03 的 `hasLabel` 是正向断言；若实现把缺失值兜成空串（`写回 （只记入…`），正向断言会红——本条证明这条红线真的存在，而不是「恰好写了字面量」。
- **前置**：TC-03 已绿（正例 `hasLabel=true`）；`$env:TEMP` 可写。
- **步骤**：① 把正式模型复制到 TEMP 并删 `duty.action.landingLabel`；② 分别渲染正例与坏例并取「动作：…」行；③ 用 TC-03 的三个布尔判两行。
- **判据（机器）**：
```powershell
$M = Join-Path $env:TEMP 'p4-nolelabel.json'
node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('tools/agent-model/models/reviewer-product-model.json','utf8'));delete m.duty.action.landingLabel;fs.writeFileSync(process.argv[1],JSON.stringify(m,null,2))" $M
node --input-type=module -e "import{readFileSync}from'node:fs';import{renderModel}from'./tools/agent-model/render/index.mjs';const sh=JSON.parse(readFileSync('tools/agent-model/models/_shared-model.json','utf8'));const line=(p)=>renderModel(p,sh).text.split('\n').find(l=>l.startsWith('动作：'))||'';const probe=(l)=>'hasLabel:'+l.includes('问题卡（只记入评审账本，不写文件）')+',empty:'+/写回\s*。/.test(l)+',undef:'+/undefined|null/.test(l);console.log('pos='+probe(line('tools/agent-model/models/reviewer-product-model.json'))+' neg='+probe(line(process.argv[1])))" $M
Remove-Item $M
```
→ 首行 `pos=hasLabel:true,empty:false,undef:false neg=hasLabel:false,empty:<任一>,undef:<任一>`；判据是 **`neg` 段必须与 `pos` 段不同**（`hasLabel` 至少一处翻假，或 `empty`/`undef` 翻真）。
- **对应测试/交付物**：`sections.mjs` 的 duty 分支（`landingLabel` 消费点）；验收人 = 主 agent。
- **说明**：负例模板只落 `$env:TEMP` 并在命令末尾删除，不写仓。

### TC-14 负例：「共享层只增不改」——无规则/谓词/视角被删或被缩小

- **覆盖**：spec §6 风险 3（只增不改）
- **目的**：`appliesWhen` 追加是手工编辑，容易在重排 JSON 时把某条名单改小或整个文件重排；一旦变小，7 席里某席的 must/never 条数会变，但 `verify` 的基线比对（`errs`）会报 `must`/`never`——本条在 `verify` 之前先给出「谁被动了」。
- **前置**：`models/_shared-model.json` 已改且未提交（`git show HEAD:` 取到改动前版本）。
- **步骤**：① 取 HEAD 版与工作区版；② 逐条判旧 `appliesWhen` 是否仍是新名单的子集（`"*"` 视为全集）；③ 判旧 rule/predicate/perspective 未丢；④ 打印新增视角。
- **判据（机器）**：
```powershell
node -e "const{execSync}=require('child_process');const fs=require('fs');const old=JSON.parse(execSync('git show HEAD:tools/agent-model/models/_shared-model.json',{encoding:'utf8'}));const cur=JSON.parse(fs.readFileSync('tools/agent-model/models/_shared-model.json','utf8'));const sub=(a,b)=>a==='*'||b==='*'||(Array.isArray(a)&&a.every(x=>b.includes(x)));const byId=(arr,id)=>arr.find(x=>x.id===id);const lost=[];for(const r of old.rules.must){const c=byId(cur.rules.must,r.id);if(!c||!sub(r.appliesWhen,c.appliesWhen))lost.push('must:'+r.id)}for(const r of old.rules.never){const c=byId(cur.rules.never,r.id);if(!c||!sub(r.appliesWhen,c.appliesWhen))lost.push('never:'+r.id)}for(const[k,p]of Object.entries(old.predicates)){const c=cur.predicates[k];if(!c||!sub(p.appliesWhen,c.appliesWhen))lost.push('pred:'+k)}for(const k of Object.keys(old.perspectives))if(!(k in cur.perspectives))lost.push('persp:'+k);console.log('lost='+JSON.stringify(lost)+' mustN='+cur.rules.must.length+' neverN='+cur.rules.never.length+' newPersp='+(Object.keys(cur.perspectives).filter(k=>!(k in old.perspectives)).join(',')||'none'))"
```
→ 首行 `lost=[] mustN=4 neverN=5 newPersp=product`。
- **对应测试/交付物**：`tools/agent-model/models/_shared-model.json` 的 diff；验收人 = 主 agent。
- **不覆盖**：不判 JSON 格式/键序（若整文件被重新序列化，diff 会很大，但语义子集判据仍成立）。
- **锚点说明**：本文件编写时 `_shared-model.json` 无改动（`git status --porcelain` 只有 spec 与本文件两条未跟踪项），故 `HEAD` 即「P4 改动前」。若改动已提交，把命令里的 `HEAD` 换成 P4 改动前的提交（如 P3 收尾提交），否则 `lost=[]` 会退化成恒真。

### TC-15 门禁 G6：`npm run check` 末行 `check 全部通过`、exit 0

- **覆盖**：spec §5 G6
- **目的**：全仓总门禁，覆盖语法段、全仓 `node --test`（含 P1 套件，M-6）、技能守卫、markdown 机械检查等；本条只判 spec 的口径（末行 + 退出码）。
- **前置**：TC-07/08/10/11/16 全绿（任一红都会传导到末行）。
- **步骤**：① 在仓根跑并合并流；② 取最后一个非空行；③ 记退出码。
- **判据（机器）**：
```powershell
$o = npm run check 2>&1
($o | Where-Object { $_.Trim() -ne '' })[-1]
"exit=$LASTEXITCODE"
```
→ 首行 `check 全部通过`，次行 `exit=0`（字面锚 `scripts/check-all.mjs:575`；失败路径打 `check 未通过` 并置退出码 1，`:572`）。
- **对应测试/交付物**：整仓门禁；验收人 = 主 agent。
- **未执行理由**：本文件编写阶段 P4 未实现，实跑必红；且该命令会重写 `tmp/agent-criteria-demo/sandbox/`。

### TC-16 门禁 G7：`scs check skills` findings 为空、exit 0

- **覆盖**：spec §5 G7
- **目的**：本轮只动 schema/渲染器/模型，不新增技能；但 `base.mjs` 若被 `skills/**` 引用会连带影响守卫面，须确认仍是 0 findings。
- **前置**：全部改动落盘。
- **步骤**：① 跑 scs 并把 stdout 存 TEMP；② 记退出码；③ 解析 JSON 取 `findings.length`；④ 删临时文件。
- **判据（机器）**：
```powershell
scs check skills --root . --manifest skilldependencies/manifest.json --json > "$env:TEMP\p4-scs.json"
"scsExit=$LASTEXITCODE"
node -e "console.log('findings='+JSON.parse(require('fs').readFileSync(process.argv[1],'utf8').replace(/^\uFEFF/,'')).findings.length)" "$env:TEMP\p4-scs.json"
Remove-Item "$env:TEMP\p4-scs.json"
```
→ `scsExit=0`、`findings=0`（M-5 现状即 0）。
- **对应测试/交付物**：技能守卫面；验收人 = 主 agent。
- **说明**：`--json` 是多行缩进输出，不能拿 spec 里的字面 `{"findings":[]}` 去 grep（P3 结论 8 已踩过）。

### TC-17 人工判：段级对照——7 段齐全，差异逐条落到已知归类

- **覆盖**：spec §5 G5
- **目的**：G5 要求「6 段逐字相等（除已知 K2 差异）」，但结论 8 实测只有 `边界` 真逐字相等；其余段的差异来自「卡面散文 vs 模型派生」的结构性差别。机器只能判「段在、边界等、无空落点」（TC-11），剩下必须人判「每处差异是否有归属、是否可接受」。
- **前置**：TC-11 已绿（产物已重建）。
- **步骤**：① 打开 `tmp/agent-criteria-demo/sandbox/reviewer-product.md` 与 `agents/reviewer-product.md`；② 逐段对照 职责 / 一定会 / 禁止 / 冲突裁决 / 本席清单 / 输出格式 / 边界；③ 每处差异标注归属（下表）。
- **判据（人工）**：

| 段 | 允许的差异 | 不可接受的差异 |
|---|---|---|
| 职责 | `objects` 由模型字段派生（卡面写 `PRD、spec、plan`）；零写落点句替换为 `问题卡（只记入评审账本，不写文件）`；约束行由 `permissions` 派生 | 出现空落点、`undefined`、或把落点写成真实路径 |
| 一定会 | 5 条 → 5 条；措辞由共享谓词 `ok` + 槽位派生（P1 登记的 K2 同源差异） | 条数 ≠ 5；出现「写回 <文件>」句 |
| 禁止 | 4 条 → 4 条；措辞由谓词 `bad` 派生 | 条数 ≠ 4；出现 `no-perfunctory-fix` 对应条目（卡面无此条） |
| 冲突裁决 | 「采纳依据」vs 卡面「采纳了哪一条」 | 缺「采纳/不采纳」任一分支 |
| 本席清单 | 判定方列由 `residual.who` 派生（`抽检：reviewer-product`）vs 卡面「人工判定」；判据列按 D3 同形 | 行数 ≠ 7；条目名与卡面 7 项不能一一对应 |
| 输出格式 | 9 字段同名同序；3 条校验由 `observable` 派生；卡面第 73 行「产物字段名只许 …」随 `## 产出` 跳过而缺失 | 字段数 ≠ 9；校验条数 ≠ 3 |
| 边界 | 无（必须逐字相等，TC-11 已机判） | 任何字符差异 |

- **为什么必须人工**：spec 未冻结这 6 段的逐字文案（只有 `边界` 有常量源）；把「职责/清单」的派生措辞写成正则会误伤（同一语义多种合法写法），而 G5 的实质要求是「差异有归属、不出现未建模内容」。
- **对应测试/交付物**：`agents/reviewer-product.md` 与 `tmp/agent-criteria-demo/sandbox/reviewer-product.md`；评审人 = 非作者席（senior-sdet / reviewer-audit 任一）。

### TC-18 人工判：7 项清单判据同形是否为可接受缺口

- **覆盖**：spec §2 D3 + §4 `checklist`/`checkCriteria` + §6 风险 1
- **目的**：7 项共用 `fieldNonEmpty issueCardFull.quote`，渲染后 7 行判据文本完全相同（TC-03 探针实测 7 行同字），只能靠「条目」列区分；spec 承认这是已知缺口但不打算在本轮修。本条确认「卡面 7 项语义没有被丢」并且缺口已登记。
- **前置**：TC-08 已绿（7 项齐全、7 键共用）。
- **步骤**：① 读 `sandbox/reviewer-product.md` 的本席清单表；② 与卡面 7 项（`agents/reviewer-product.md:40-46`）逐行对条目名；③ 对判据文本判「是否 7 行同形」；④ 判是否已登记在 spec §6 风险 1 / `report-round2`。
- **判据（人工）**：7 个「条目」名与卡面 7 项一一对应且顺序一致；7 行判据文本同形这一事实在 spec §6 或 `report-round2` 有登记（不得当成新缺陷重复报）；若选择给 criterion 增 per-item scope，则本条转为「7 行判据可区分」。
- **为什么必须人工**：这是「可接受性」判断，不是事实判断；机器只能判「7 行文本相同」这一现象，判不了「本批是否接受」。
- **对应测试/交付物**：`checklist.items` + `checkCriteria`；评审人 = spec 作者（主 agent）。

## 3 反例与边界

| 用例 ID | 反例/边界是什么 | 为什么容易漏 | 期望 |
|---|---|---|---|
| TC-02 | 为放行 `null` 把 `defaultLanding` 改成可选/`any`；或只加 `v===null` 放行而不加类型守卫 | 原始类型在 `checkShape` 里静默放行（M-12 实测 `5`/`true` 无错），TC-01 会变绿而契约失效 | `missing=["MISSING:defaultLanding"]` 且 `number`/`bool` 均报 `TYPE` |
| TC-03 | 零写席渲染出 `判定写回 。` | 不崩、不影响其他段，肉眼易放过 | `emptyWriteBack=false` |
| TC-04 | `null` 时 `h.F[null].text` 崩 | 只在渲染零写席时触发，7 席回归看不见 | must 段返回 `> 判定只记入本轮评审账本，不写盘。` |
| TC-05 | 留 `## 产出` 空标题 | 段不多，字符差只几十 | `empty=[]` 且产物无 `## 产出` |
| TC-06 | 改 `sections.mjs` 时动到非空分支 | P1 用例可能只判「有这段」 | 7 席 `same=true` 且哈希同 §0.1 |
| TC-07 | 为第 8 席改 P1 固定计数时把条数删了 | 少一条仍 `fail 0` | `# tests 29` |
| TC-08 | 少了 `must: []` 键 | `verify` 不报，`BaseModel.validate` 才报 | `keys=19 missing=[]` |
| TC-09 | 只看 `errs` 为空就判绿 | `typeErr`/`cardRuleLeak` 不在 `errs` 里 | `codes=[]` 且 `anyError=false` |
| TC-10 | CLI 名单没加席但手工跑单席绿 | 手工 `node verify-models.mjs reviewer-product` 只出 1 行 | `lines=8 eq=8` |
| TC-11 | 权限段导致「8 段」被误判成失败 | spec 写「7 段」，实际恒有权限段 | `has7=true` 且 `extra ⊆ ["权限"]` |
| TC-12 | 只加规则不加谓词 | `verify` 全绿，渲染在 `sections.mjs:57` 崩 | `predMissing=[]` |
| TC-13 | 缺失 `landingLabel` 被兜成空串 | 正例仍「看起来正常」，只是括号前少字 | `neg` 与 `pos` 不同 |
| TC-14 | 重排共享层 JSON 时改小某条名单 | `lost` 只在条数变化时才被发现 | `lost=[]` |
| TC-15 | 全仓 glob 漏掉 `tmp/` 的 P1 套件 | 以为门禁没跑它（M-6 实测会跑） | 末行 `check 全部通过` |
| TC-16 | 拿 `{"findings":[]}` 去 grep 多行 JSON | 假红/假绿 | `findings=0` |

## 4 未覆盖与理由

| 不测什么 | 为什么 |
|---|---|
| spec D4「其余 10 席逐席串行、每席一闭环」 | 那是流程与时序，不是产物；本批只交付首席。判它只能人工复述，无法给「命令 + 期望首行」 |
| G5「6 段逐字相等」的字面成立 | 结论 8 实测只有 `边界` 逐字相等；其余差异源于「卡面散文 vs 模型派生」，spec 未冻结文案。机器只判 `边界`（TC-11），其余转人工归类（TC-17） |
| `diff-report.mjs` 里出现 `reviewer-product` 行 | 该脚本硬编码 7 席（`diff-report.mjs:10`），spec §3 未要求改它，G3 只要求 sandbox md 数=9（TC-11 判） |
| `modelType` 的具体类型名（如 `ReviewerModel`） | spec §4 未冻结零写席的类型名；TC-09 只要求 `typeErr` 为空、`modelType` 非 `null`。若要冻结，需先决定是否新增 `ZeroWriteModel` |
| 结论 1/2 的「修法」 | 本文件只定义判据：`TYPE_UNKNOWN` 与 `cardRuleLeak` 会由 TC-09 抓出；改 `derived.mjs` / `verify-models.mjs` / policy 属实施决策，不在 testcase 范围 |
| `policy` 层（`SEAT_POLICY` / `SEAT_NAMES`）不改的验证 | spec §1 非目标明确「不改 policy」；`git status` / diff 面即可，不单独设用例（TC-09 的 `tier=readOnly` 已间接证明走 `__default__`） |
| 跨机器 / 跨 Node 版本的同哈希 | 无第二台基线；本机 `node -v` = `v24.22.2`（M-10），哈希锚与字符数均为本机实测值 |
| `npm run check` 的 9 个分段逐段断言 | TC-15 只判末行与退出码（spec §5 G6 的口径）；分段各有既有测试与 `check-all.mjs` 自身保证，重复判会让本文件变成 check-all 的镜像 |
| 7 席以外其他席的零写建模 | spec §1 非目标：本轮只做 `reviewer-product` |
