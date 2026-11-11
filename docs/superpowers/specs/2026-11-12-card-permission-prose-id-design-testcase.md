# 测试用例：卡片权限叙述单源化（S3）

> 归属 spec：`docs/superpowers/specs/2026-11-12-card-permission-prose-id-design.md`（§3 决策 S3-D1–D5 / §4 不变量 I-1–I-6 / §5 迁移步骤 / §6 影响面 / §7 验收要点 1–6）
> 编写者：senior-sdet 子代理｜**独立性声明**：编写者 ≠ spec 作者（主 agent）≠ 施工者；本文件只定义判据，不实现
> 状态：草稿（spec 评审前）｜最后更新：2026-11-12
> 命名与落点：与 spec 同目录；文件名 = spec 文件名去 `.md` 后 + `-testcase.md`
> **本轮声明**：只写本文件。未修改 spec，未改任何 `.mjs` / `.json` / `agents/**`，未新建仓内其他文件，未 `git commit`。注入夹具只落 `$env:TEMP`，跑完已删（`tempCleaned=True`）。
>
> 读过的文件：本 spec 全文；`docs/superpowers/specs/2026-11-11-agent-model-pipeline-p4-design-testcase.md`（格式样板，全文）；`tools/docgen/builders/agents/components/cardKeys.mjs`；`components/cardPipeline.mjs`；`components/renderCard.mjs`；`components/seatLoader.mjs`；`components/agentData.mjs`；`components/validateAgentData.mjs`；`card-model/validateCardModel.mjs`；`card-model/enums.mjs`；`card-model/vocab/permission-claims.mjs`；`card-model/index.mjs`；`test/card-model.test.mjs`（相关段）；`test/card-render.test.mjs`（相关段）；`test/sa-data-layer.test.mjs:1-220`；`test/policy-pure-source.test.mjs:1120-1290`；`test/checkall.test.mjs`；`test/support/dev-workflow-checks.mjs:251-315`；`test/support/card-fixtures.mjs:72-78`；`tools/docgen/dsl/agents/seats/*.json`（抽查 `reviewer-actuary.json` + 全席 `constraint` 值）；`tools/docgen/dsl/agents/shared.json`；`scripts/check-all.mjs:1-60,160-200,279-410,540-576`；`scripts/scope-sweep.mjs`；`scripts/doc-name.mjs`；`package.json`；`tools/docgen/builders/agents/cli.mjs`（gate / main 错误面）；`tools/docgen/builders/agents/evidence.mjs`；`tools/docgen/builders/agents/fixtures/reviewer-actuary.evidence.json`；`docs/superpowers/reviews/2026-10-25-1723-s6-eval/capability-diff.md`。
>
> 跑过的只读命令（只打印，未改仓）：`Select-String -Path "tools/docgen/dsl/agents/seats/*.json" -Pattern '"constraint"'`；同命令按值分组（18/12/7）；`node -e` 遍历 18 席读 `card.duty` 键与值；`node -e` 扫 `tools/agent-model/models/*-model.json` 的 `duty` 键；`node --input-type=module -e` 读 `constraints`（迁移前不存在，预期失败）；`node --input-type=module -e` 渲染 18 席比对 `rationale` 是否进卡面 / 是否进 `docs/agents`；`node tools/docgen/builders/agents/cli.mjs gate`（`baseline 20/20`、`exit=0`）；`node tools/docgen/builders/agents/ledger.mjs`；`node scripts/scope-sweep.mjs --check`（`sweep ok`、`exit=0`）；`node -e` 比对 18 份 `fixtures/*.evidence.json` 的 `renderSha256` 与 `agents/*.md` 的 sha256；`node --input-type=module -e` 读 `CARD_MODEL_CODES` / `SCAN_FIELDS` / `CARD_KEYS` 键数；`node -v`；`git status --porcelain -- agents docs/agents tools/docgen/dsl/agents`；TEMP 内数据副本注入探针（验证 B 组夹具能拿到 `CardKeySetMismatch`）；TEMP 内仓副本探针（`collectCardFindings()` 基线段 `codes=[]`）。所有 TEMP 目录跑完即删。
> **未实跑**：A–E 组用例（S3 实现未落盘，多数在迁移前会按预期红）；其中 E02 的**迁移后**实跑同样未执行。自检段落另在本机跑过一次 `npm run check` 作为文档门禁，结果见文末「自检」。

**执行状态总说明**：S3 实现尚未落盘——`tools/docgen/builders/agents/policy/definitions/constraints.mjs` 不存在，18 席仍是 `duty.constraint`，`shared.json` 仍是 4 键（含 `dutyConstraintDefault`）。故本文件 25 条用例**全部为「定义」，无一条标「已通过」**；文中出现的数字均为 §0.1 的只读实测锚，用于校准判据，不构成通过声明。

**术语表（首次出现处的中文解释，后文沿用）**

| 术语 | 中文解释 |
|---|---|
| 登记表 | `policy/definitions/constraints.mjs` 导出的 `constraints` 对象：id → `{ text }`（S3-D1） |
| 席数据 | `tools/docgen/dsl/agents/seats/<seat>.json` 的 `card.duty` 段 |
| 约束行 | 卡面 `## 职责` 段里的 `约束：<文本>` 行（由 `renderCard.mjs:92` 今天渲染 `d.constraint`） |
| 码 | 校验器返回/抛出的 `code` 字符串；本批新增 4 个 `CONSTRAINT_*`（S3-D4） |
| 文本面 | 散文探针要扫的字段集合；今天是 `SCAN_FIELDS` 里的 `duty.constraint` 等（`enums.mjs:86-105`） |
| 迁移前提交 | 施工第 1 步记录的 `$BASE = git rev-parse HEAD`；C02 / A03 / A05 / E04 都以它为基线 |
| 副本 | 落到 `$env:TEMP` 的仓/数据目录拷贝；注入只改副本，不动工作区 |

## 用例来源

| 来源 | 取用内容 |
|---|---|
| 本 spec §3 S3-D1 | 登记表 7 条、id 谓词 `/^[a-z][a-z0-9.:-]*$/`、禁序号码、逐字照搬 |
| 本 spec §3 S3-D2 | `constraint: string` → `constraints: string[]`；12 席 `["duty.default"]`；删 `shared.json` 的 `dutyConstraintDefault` |
| 本 spec §3 S3-D3 | 渲染唯一路径：`约束：` = `ids.map(id => constraints[id].text).join('；')`；`duty` 子键白名单 |
| 本 spec §3 S3-D4 | 4 个新码 + 散文探针扫登记文本 |
| 本 spec §3 S3-D5 | `rationale` 只在 `docs/agents/`，不进卡面 |
| 本 spec §4 I-1–I-6 | 全部 6 条不变量各有用例承接（见 §0.4） |
| 本 spec §7 验收要点 1–6 | 逐条落到 A/B/C/D/E 组（见 §0.4） |
| 上游 `2026-11-11-agent-model-pipeline-p4-design.md` D6/D6b | 边界单源化的前置口径；本批只解决「边界之外的散文」 |

**不引入**：本文件**不新造**任何 spec 未定义的码或字段；遇到判不了的点（如 `duty` 未知子键无码）一律写进文末「spec 缺口（需评审）」。

## 落点分组

| 组 | 主题 | 条数 | 守什么 | 主要落点 |
|---|---|---|---|---|
| A | 数据形态 | 8 | 18 席数组化、登记表 7 条/id 合规/无重复、`shared.json` 退场、模型层无 `constraint`、`rationale` 定位、迁移全或无 | `dsl/agents/seats/*.json`、`dsl/agents/shared.json`、`policy/definitions/constraints.mjs`、`tools/agent-model/models/*.json` |
| B | 校验码负例 | 4 | 4 个 `CONSTRAINT_*` 各自可被注入触发，且**基线先绿** | `components/validateAgentData.mjs` / `card-model/**`（发射点由实现二选一） |
| C | 渲染与字节等价 | 4 | `约束：` 唯一路径、多 id 顺序、迁移前后 18 卡 sha256 全等 | `components/renderCard.mjs`、`components/cardPipeline.mjs`、`agents/*.md`、`fixtures/*.evidence.json` |
| D | 散文探针回归 | 4 | 登记表成了新文本面后，4 个探针仍命中**登记文本** | `card-model/validateCardModel.mjs` + `enums.mjs` 的扫描面 |
| E | 门禁与记账 | 5 | gate / `npm run check` / `scope-sweep` / capability-diff / 契约面不漂移 | `cli.mjs`、`scripts/check-all.mjs`、`scripts/scope-sweep.mjs`、`docs/superpowers/reviews/**` |

## §0 口径与取数

### 0.1 迁移前现状锚（只读实测：命令 + 首行 / 关键值）

| # | 锚 | 命令 | 实测输出（首行 / 关键值） | 用在哪 |
|---|---|---|---|---|
| S3-A1 | `constraint` 出现数 / 默认值数 / 去重数 | `$m = Select-String -Path "tools/docgen/dsl/agents/seats/*.json" -Pattern '"constraint"\s*:\s*"(.*)"' \| ForEach-Object { $_.Matches[0].Groups[1].Value }; "total=$($m.Count) default=$(($m \| Where-Object { $_ -eq '@dutyConstraintDefault' }).Count) distinct=$(($m \| Sort-Object -Unique).Count)"` | `total=18 default=12 distinct=7` | A01 / A05 的分母 |
| S3-A2 | 6 个非默认值所属席 | `Select-String -Path "tools/docgen/dsl/agents/seats/*.json" -Pattern '"constraint"\s*:\s*"(.*)"' \| Where-Object { $_.Matches[0].Groups[1].Value -ne '@dutyConstraintDefault' } \| ForEach-Object { (Split-Path $_.Path -Leaf) + ' ' + $_.Matches[0].Groups[1].Value }` | 6 行：`detective-observer` / `evidence-reader` / `respondent-architect` / `respondent-dev` / `senior-sdet` / `speaker`，各带全文 | A05 / D04 的构造面 |
| S3-A3 | 模型层 `duty` 键集 | `node -e "const fs=require('fs');const d='tools/agent-model/models';const files=fs.readdirSync(d).filter(f=>f.endsWith('-model.json'));const hits=files.filter(f=>Object.hasOwn(JSON.parse(fs.readFileSync(d+'/'+f,'utf8')).duty||{},'constraint'));console.log('models='+files.length+' constraint='+JSON.stringify(hits))"` | `models=14 constraint=[]` | A06（I-6） |
| S3-A4 | 卡数 / docs 投影数 | `(Get-ChildItem agents -Filter *.md \| Measure-Object).Count; (Get-ChildItem docs/agents -Filter *.md \| Measure-Object).Count` | `18` / `19`（18 席 + README） | A07 / C02 |
| S3-A5 | gate 现状 | `node tools/docgen/builders/agents/cli.mjs gate; "exit=$LASTEXITCODE"` | `baseline 20/20`、`exit=0` | E01 的基线 |
| S3-A6 | `rationale` 的落面 | `node --input-type=module -e "import{readFileSync}from'node:fs';import{buildCards,buildEnv}from'./tools/docgen/builders/agents/components/cardPipeline.mjs';import{renderCard}from'./tools/docgen/builders/agents/components/renderCard.mjs';let cardHit=0,docsMiss=[];const bs=buildCards();for(const b of bs){if(renderCard(b.card,buildEnv(b.seat,[b.card])).includes(b.card.rationale))cardHit++;if(!readFileSync('docs/agents/'+b.seat+'.md','utf8').includes(b.card.rationale))docsMiss.push(b.seat)}console.log('seats='+bs.length+' cardHit='+cardHit+' docsMiss='+JSON.stringify(docsMiss))"` | `seats=18 cardHit=0 docsMiss=[]` | A07（S3-D5 / §7.6） |
| S3-A7 | evidence 与卡哈希一致 | `node -e "const fs=require('fs'),c=require('crypto');const seats=fs.readdirSync('agents').filter(f=>f.endsWith('.md')).map(f=>f.slice(0,-3));let bad=[];for(const s of seats){const h=c.createHash('sha256').update(fs.readFileSync('agents/'+s+'.md')).digest('hex').toUpperCase();const e=JSON.parse(fs.readFileSync('tools/docgen/builders/agents/fixtures/'+s+'.evidence.json','utf8'));if(e.renderSha256!==h)bad.push(s)}console.log('seats='+seats.length+' mismatch='+JSON.stringify(bad))"` | `seats=18 mismatch=[]` | C03 的交叉锚 |
| S3-A8 | 契约面键数 | `node --input-type=module -e "import{CARD_MODEL_CODES}from'./tools/docgen/builders/agents/card-model/validateCardModel.mjs';import{SCAN_FIELDS}from'./tools/docgen/builders/agents/card-model/enums.mjs';import{CARD_KEYS}from'./tools/docgen/builders/agents/components/cardKeys.mjs';console.log('codes='+Object.keys(CARD_MODEL_CODES).length+' scan='+Object.keys(SCAN_FIELDS).length+' cardKeys='+CARD_KEYS.length)"` | `codes=36 scan=8 cardKeys=12` | E05 / spec 缺口 1 |
| S3-A9 | 全仓 scope 现状 | `node scripts/scope-sweep.mjs --check; "exit=$LASTEXITCODE"` | `sweep ok（命中未超基线、清单齐、scope 齐）`、`exit=0` | E03 |
| S3-A10 | 运行时 | `node -v` | `v24.22.2` | 全部哈希 / 字节判据的机器口径 |

### 0.2 判据侧取数纪律（禁止手抄）

- **数量与名单一律现算**：18 / 12 / 7 只出现在 §0.1 的实测锚里；用例的期望串用命令输出比对，**不**在断言里写 `18`、`12`、`7` 字面。
- **7 条 id / 文本从定义层取**：`import { constraints } from '.../policy/definitions/constraints.mjs'`，`Object.keys()` / `Object.values()` 现算；不在本文件抄 id 清单。
- **迁移前值从 git 取**：`git show $BASE:tools/docgen/dsl/agents/seats/<seat>.json` + `$BASE:.../shared.json`，展开 `@dutyConstraintDefault` 后与新登记文本逐字比对（A03）；这样「7 条 = 旧 7 个 distinct 值」是机器结论，不是人工对照。
- **席名 / 非议会席不写死**：非议会席取 `NON_PARL_SEATS`（`components/cardPipeline.mjs:30` 的唯一源）；席集取 `readdirSync('agents')` 或 `buildCards()`。
- **哈希链**：`git show $BASE:agents/<seat>.md` 用 `execFileSync(..., { maxBuffer })` 取 **Buffer**，与 `readFileSync` 的 Buffer 做 `.equals()`；不经文本解码，避免换行归一造成假等。

### 0.3 注入夹具（B / D 组共用，只落 `$env:TEMP`）

**夹具 1：数据副本（B01–B03）** —— 与 `test/sa-data-layer.test.mjs:25-35` 同款（`copyData` + `rewrite`）。

```powershell
$T = Join-Path $env:TEMP ('s3-data-' + [guid]::NewGuid().ToString('N'))
Copy-Item -Recurse 'tools/docgen/dsl/agents' $T
```

**探针 1：席数据码观测（B01–B03）** —— 覆盖「码在 loader」与「码在 validateAgentData」两种落点；`code=` 为空即基线绿。

```powershell
node --input-type=module -e "import {loadSeatData} from './tools/docgen/builders/agents/components/seatLoader.mjs'; import {validateAgentData} from './tools/docgen/builders/agents/components/validateAgentData.mjs'; const dir=process.argv[1]; let code=''; try { const {agentData,triggerTable}=loadSeatData(dir); try { validateAgentData(agentData,triggerTable) } catch(e){ code=e.code } } catch(e){ code=e.code } console.log('code='+code)" $T
```

**夹具 2：仓副本（B04、D01–D04）** —— 复制清单与 `test/support/dev-workflow-checks.mjs:257-259` 的 `withRepoCopy` 同款，只多不少地覆盖 gate / `collectCardFindings` 的读盘面。

```powershell
$T = Join-Path $env:TEMP ('s3-repo-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $T | Out-Null
foreach ($r in 'tools/docgen','tools/execution-matrix','tools/quality','rules','agents','docs/agents') { New-Item -ItemType Directory -Path (Join-Path $T (Split-Path $r -Parent)) -Force | Out-Null; Copy-Item -Recurse (Join-Path '.' $r) (Join-Path $T $r) }
```

**探针 2：仓副本内的程序探针（B04、D01–D04）** —— 同时取 gate 与 `collectCardFindings()` 两个入口；任一入口命中指定码即算命中（发射点归实现，判据不绑死）。

```powershell
Push-Location $T
$all = @(node tools/docgen/builders/agents/cli.mjs gate 2>&1) + @(node --input-type=module -e "import{buildCards,collectCardFindings}from'./tools/docgen/builders/agents/components/cardPipeline.mjs';let codes;try{codes=[...new Set(collectCardFindings().map(x=>x.code))]}catch(e){codes=[e.code]};console.log('codes='+JSON.stringify(codes))" 2>&1)
"hit=" + [bool]($all | Select-String '<期望码>')
Pop-Location
```

**构造前提（B04、D01–D04 共用）**：注入前先在同一副本跑一次 `collectCardFindings()`，基线必须 `codes=[]`；非空说明副本清单漏了实现新引入的读盘面（如 `docs/agents/README.md` / `tools/quality`），此时判**「用例无效」**，不得当作被测失败。

```powershell
Push-Location $T
node --input-type=module -e "import{collectCardFindings}from'./tools/docgen/builders/agents/components/cardPipeline.mjs';let codes;try{codes=[...new Set(collectCardFindings().map(x=>x.code))]}catch(e){codes=[e.code]};console.log('codes='+JSON.stringify(codes))"
Pop-Location
```

> 硬规矩②（注入必须真的改到目标片段）：每个 B / D 用例在注入后都先跑一次 `Select-String`，命中注入串才继续；没命中即判「无效用例」，不得计为通过。
> 硬规矩③（G3 裁决）：登记表**不要求可变**；探针只允许在「加载期触发」或「副本注入」两种时机命中，不得断言 `constraints` 可写。

### 0.4 覆盖矩阵（I-1–I-6 × §7.1–7.6）

| spec 条目 | 承接用例 |
|---|---|
| I-1 渲染唯一路径 | A01、C01、C04 |
| I-2 席 JSON 无自由整句位 | A01、A08、B01 |
| I-3 登记文本过探针 + 词表 | B04、D01、D02、D03、D04 |
| I-4 迁移前后 18 卡 sha256 全等 | A03、C02、C03 |
| I-5 登记表 id 唯一 / 文本非空 / 无两条完全相同 | A02、A03 |
| I-6 模型层不含 `constraint` | A06 |
| §7.1（18 席数组化、登记表 7 条） | A01、A02、A03、A04、A05 |
| §7.2（负例四连） | B01、B02、B03、B04 |
| §7.3（探针不回退） | D01、D02、D03、D04 |
| §7.4（字节等价） | C02、C03 |
| §7.5（三项门禁） | E01、E02、E03 |
| §7.6（`rationale` 定位） | A07 |
| §5 步骤 1–3（迁移全或无，禁中间态） | A08 |
| S3-D1 / D2 / D3 / D4 / D5 | A02-A03 / A01+A04+A05+A08 / C01+C04+E05 / B01-B04+D01-D04 / A07 |

**计数**：A 组 8 条、B 组 4 条、C 组 4 条、D 组 4 条、E 组 5 条，合计 **25** 条；**全部机器判**（E04 另附人读复核项，见该条说明）。

---

## §1 A 组：数据形态

**这一组守什么**：迁移后的**静态形状**——席数据没有自由整句位、登记表是真登记表（id 合规、文本非空且不重复）、旧默认引用退场、模型层不受牵连、`rationale` 定位不变。这一组绿了，B/C/D 才有意义。

| 编号 | 前置 | 构造/操作 | 期望（可机械判） | 落点文件 | 判据来源(spec 章节) |
|---|---|---|---|---|---|
| S3-TC-A01 | 迁移已落盘；工作区为迁移提交态 | 遍历 18 个席 JSON，读 `card.duty`：`Object.hasOwn(duty,'constraint')`、`Array.isArray(duty.constraints)`、数组长度 | `files=18 old=0 arr=18 empty=0` | `tools/docgen/dsl/agents/seats/*.json` | §3 S3-D2；§4 I-2；§7.1 |
| S3-TC-A02 | 同 A01；登记表已存在 | ① 读 `Object.keys(constraints)` 与 `Object.values(...).map(v=>v.text)` 双向查重；② 源文本键数只作**构造前提**（与 `Object.keys` 数量不等 → 用例无效，不计通过）；③ 按 id 谓词与序号码形态筛 | `n=7 badId=[] ordinal=[] srcKeys=7 precondition=true dupId=[] dupText=[]` | `policy/definitions/constraints.mjs` | §3 S3-D1；§4 I-5；§7.1 |
| S3-TC-A03 | 同 A01；`$BASE` = 迁移前提交 | ① 取登记表全部 `text`，判非空 / 去重；② 对每席：读 `$BASE` 版席 JSON 与 `shared.json`，展开旧 `constraint`（`@key` → shared 值），与新 `constraints[].text` 按 `；` 拼接后逐字比 | `n=7 nonEmpty=true dup=[] textMismatch=[]` | `policy/definitions/constraints.mjs`、`dsl/agents/seats/*.json`、`dsl/agents/shared.json` | §3 S3-D1「逐字照搬」；§4 I-4/I-5；§7.1 |
| S3-TC-A04 | 同 A01；`$BASE` 已记录 | ① 读 `shared.json` 判 `hasDefault`；② 把键集与 `$BASE` 版键集去 `dutyConstraintDefault` 后比；③ 全席 JSON 搜 `@dutyConstraintDefault` | `hasDefault=false keysEqBaseMinusDefault=true`；席 JSON 命中数 `0` | `dsl/agents/shared.json`、`dsl/agents/seats/*.json` | §3 S3-D2；§7.1 |
| S3-TC-A05 | 同 A01；`$BASE` 已记录 | 以 `$BASE` 版每席旧值判定「原为 `@dutyConstraintDefault`」的席集；这些席迁移后必须恰为 `["duty.default"]`；全席每个 id 必须可解析 | `defaultSeats=12 badDefault=[] unresolved=[]` | `dsl/agents/seats/*.json`、`policy/definitions/constraints.mjs` | §3 S3-D2；§4 I-2 |
| S3-TC-A06 | 无 | 扫 `tools/agent-model/models/*-model.json` 的 `duty` 键集，找 `constraint` | `models=14 constraint=[]` | `tools/agent-model/models/*-model.json` | §4 I-6；§2 非目标 |
| S3-TC-A07 | 无 | 逐席 `renderCard` 判卡面是否含 `card.rationale`；读 `docs/agents/<seat>.md` 判是否含 `card.rationale` | `seats=18 cardHit=0 docsMiss=[]` | `components/renderCard.mjs`、`agents/*.md`、`docs/agents/*.md` | §3 S3-D5；§7.6 |
| S3-TC-A08 | 工作区任意迁移中间态（含施工中） | 判 `constraints.mjs` 是否存在；逐席判 `old` / `arr`；要求「全或无」：登记表在 ⇒ 18 席全部已改；登记表不在 ⇒ 全部仍是旧字段 | `reg=true migratedAll=true legacyAll=false allOrNone=true` | `policy/definitions/constraints.mjs`、`dsl/agents/seats/*.json` | §5 步骤 1–3；§3 S3-D2 |

**判据命令（A 组）**

```powershell
# A01
node -e "const fs=require('fs');const d='tools/docgen/dsl/agents/seats';const f=fs.readdirSync(d).filter(x=>x.endsWith('.json'));const rows=f.map(x=>{const j=JSON.parse(fs.readFileSync(d+'/'+x,'utf8'));const duty=(j.card&&j.card.duty)||{};return{seat:x.slice(0,-5),old:Object.hasOwn(duty,'constraint'),arr:Array.isArray(duty.constraints),n:Array.isArray(duty.constraints)?duty.constraints.length:-1}});console.log('files='+rows.length+' old='+rows.filter(r=>r.old).length+' arr='+rows.filter(r=>r.arr).length+' empty='+rows.filter(r=>r.n===0).length)"

# A02（srcKeys 只作构造前提：数量不等 → 用例无效）
node --input-type=module -e "import{readFileSync}from'node:fs';import{constraints}from'./tools/docgen/builders/agents/policy/definitions/constraints.mjs';const ids=Object.keys(constraints);const texts=Object.values(constraints).map(v=>v.text);const RE=/^[a-z][a-z0-9.:-]*$/;const src=readFileSync('tools/docgen/builders/agents/policy/definitions/constraints.mjs','utf8');const srcKeys=[...src.matchAll(/['\x22](duty\.[a-z0-9.:-]+)['\x22]\s*:\s*\{/g)].map(m=>m[1]);const dupId=[...new Set(ids.filter((k,i)=>ids.indexOf(k)!==i))];const dupText=[...new Set(texts.filter((t,i)=>texts.indexOf(t)!==i))];console.log('n='+ids.length+' badId='+JSON.stringify(ids.filter(i=>!RE.test(i)))+' ordinal='+JSON.stringify(ids.filter(i=>/^duty\.[0-9]+$/.test(i)))+' srcKeys='+srcKeys.length+' precondition='+(ids.length===srcKeys.length)+' dupId='+JSON.stringify(dupId)+' dupText='+JSON.stringify(dupText))"

# A03（$BASE 由施工第 1 步记录）
node --input-type=module -e "import{constraints}from'./tools/docgen/builders/agents/policy/definitions/constraints.mjs';import{readFileSync,readdirSync}from'node:fs';import{execFileSync}from'node:child_process';const BASE=process.argv[1];const texts=Object.values(constraints).map(v=>v.text);const dup=[...new Set(texts.filter((t,i)=>texts.indexOf(t)!==i))];const sh=JSON.parse(execFileSync('git',['show',BASE+':tools/docgen/dsl/agents/shared.json'],{encoding:'utf8'}));const dir='tools/docgen/dsl/agents/seats';let bad=[];for(const f of readdirSync(dir).filter(x=>x.endsWith('.json'))){const old=JSON.parse(execFileSync('git',['show',BASE+':tools/docgen/dsl/agents/seats/'+f],{encoding:'utf8'}));const cur=JSON.parse(readFileSync(dir+'/'+f,'utf8'));const raw=String((old.card.duty||{}).constraint||'');const oldText=raw.startsWith('@')?(sh[raw.slice(1)]||''):raw;const ids=Array.isArray(cur.card.duty.constraints)?cur.card.duty.constraints:[];const newText=ids.map(id=>(constraints[id]||{}).text).join('；');if(oldText!==newText)bad.push(f)}console.log('n='+texts.length+' nonEmpty='+texts.every(t=>typeof t==='string'&&t.trim()!=='')+' dup='+JSON.stringify(dup)+' textMismatch='+JSON.stringify(bad))" $BASE

# A04（键集与 $BASE 版比，不写键名清单）
node -e "const fs=require('fs');const{execFileSync}=require('child_process');const BASE=process.argv[1];const cur=JSON.parse(fs.readFileSync('tools/docgen/dsl/agents/shared.json','utf8'));const base=JSON.parse(execFileSync('git',['show',BASE+':tools/docgen/dsl/agents/shared.json'],{encoding:'utf8'}));const want=Object.keys(base).filter(k=>k!=='dutyConstraintDefault').sort();const got=Object.keys(cur).sort();console.log('hasDefault='+Object.hasOwn(cur,'dutyConstraintDefault')+' keysEqBaseMinusDefault='+(JSON.stringify(want)===JSON.stringify(got)))" $BASE
(Select-String -Path "tools/docgen/dsl/agents/seats/*.json" -Pattern '@dutyConstraintDefault' | Measure-Object).Count

# A05
node --input-type=module -e "import{constraints}from'./tools/docgen/builders/agents/policy/definitions/constraints.mjs';import{readFileSync,readdirSync}from'node:fs';import{execFileSync}from'node:child_process';const BASE=process.argv[1];const dir='tools/docgen/dsl/agents/seats';let defSeat=[],unresolved=[],badDefault=[];for(const f of readdirSync(dir).filter(x=>x.endsWith('.json'))){const old=JSON.parse(execFileSync('git',['show',BASE+':tools/docgen/dsl/agents/seats/'+f],{encoding:'utf8'}));const cur=JSON.parse(readFileSync(dir+'/'+f,'utf8'));const ids=Array.isArray(cur.card.duty.constraints)?cur.card.duty.constraints:[];const wasDefault=String((old.card.duty||{}).constraint||'')==='@dutyConstraintDefault';if(wasDefault)defSeat.push(f);if(wasDefault&&!(ids.length===1&&ids[0]==='duty.default'))badDefault.push(f);for(const id of ids)if(!Object.hasOwn(constraints,id))unresolved.push(f+':'+id)}console.log('defaultSeats='+defSeat.length+' badDefault='+JSON.stringify(badDefault)+' unresolved='+JSON.stringify(unresolved))" $BASE

# A06
node -e "const fs=require('fs');const d='tools/agent-model/models';const files=fs.readdirSync(d).filter(f=>f.endsWith('-model.json'));const hits=files.filter(f=>Object.hasOwn(JSON.parse(fs.readFileSync(d+'/'+f,'utf8')).duty||{},'constraint'));console.log('models='+files.length+' constraint='+JSON.stringify(hits))"

# A07
node --input-type=module -e "import{readFileSync}from'node:fs';import{buildCards,buildEnv}from'./tools/docgen/builders/agents/components/cardPipeline.mjs';import{renderCard}from'./tools/docgen/builders/agents/components/renderCard.mjs';let cardHit=0,docsMiss=[];const bs=buildCards();for(const b of bs){if(renderCard(b.card,buildEnv(b.seat,[b.card])).includes(b.card.rationale))cardHit++;if(!readFileSync('docs/agents/'+b.seat+'.md','utf8').includes(b.card.rationale))docsMiss.push(b.seat)}console.log('seats='+bs.length+' cardHit='+cardHit+' docsMiss='+JSON.stringify(docsMiss))"

# A08（全或无迁移：登记表在 ⇒ 18 席全改；不在 ⇒ 全旧）
node -e "const fs=require('fs');const d='tools/docgen/dsl/agents/seats';const files=fs.readdirSync(d).filter(x=>x.endsWith('.json'));const reg=fs.existsSync('tools/docgen/builders/agents/policy/definitions/constraints.mjs');let migrated=0,legacy=0;for(const f of files){const j=JSON.parse(fs.readFileSync(d+'/'+f,'utf8'));const duty=(j.card&&j.card.duty)||{};const isArr=Array.isArray(duty.constraints);const old=Object.hasOwn(duty,'constraint');if(isArr&&!old)migrated++;if(!isArr&&old)legacy++}const ok=(reg&&migrated===files.length&&legacy===0)||(!reg&&migrated===0&&legacy===files.length);console.log('reg='+reg+' migratedAll='+(migrated===files.length)+' legacyAll='+(legacy===files.length)+' allOrNone='+ok)"
```

**说明 / 不覆盖**

- A01 只判「无旧键 + 是数组 + 非空」，不判 id 是否可解析（A05 判）与文本是否正确（A03 判）。
- A02 的 `ordinal` 只按 `/^duty\.[0-9]+$/` 识别 spec 点名的 `duty.1` 形态；更宽的「序号码」无法从谓词推出（第 1 轮裁决 G2 只把 `duty` 白名单违例并入 `CONSTRAINT_NOT_IDS`，未扩「序号码」定义）。
- A02 的 `srcKeys` 只作构造前提：`precondition=false` 说明源文本正则没覆盖该写法，本用例**判「用例无效」**，不得当作通过或被测失败。
- A07 的 `cardHit=0` 是**卡面文本**口径；`docs/agents/README.md` 不在本判据内（它按下标汇总，不是逐席长文）。
- A08 是**防火线**：它不新增迁移语义，只禁止「登记表已建、席数据却只改了一半」的中间态被提交（spec §5 步骤 1–3 的顺序风险）。

---

## §2 B 组：校验码负例

**这一组守什么**：4 个新增码不是「写了就算」，而是**注入到目标片段后必须被点名**。每条都先证明基线为绿（`code=` 为空），再注入，再证明注入串真的落在目标文件里（`Select-String` 命中），最后要求 `code=<指定码>`。

| 编号 | 前置 | 构造/操作 | 期望（可机械判） | 落点文件 | 判据来源(spec 章节) |
|---|---|---|---|---|---|
| S3-TC-B01 | 夹具 1；探针 1 基线 `code=` 空 | 在副本某席 `card.duty` 注入字符串键 `constraint`（保留 `constraints`），`Select-String '"constraint"'` 命中后跑探针 1 | 注入前 `code=`；注入后 `code=CONSTRAINT_NOT_IDS` | `components/seatLoader.mjs` 或 `components/validateAgentData.mjs` | §3 S3-D4；§4 I-2；§7.2 |
| S3-TC-B02 | 同 B01 | 把副本某席 `card.duty.constraints` 改为 `['duty.not-registered']`；`Select-String 'duty.not-registered'` 命中后跑探针 1 | 注入前 `code=`；注入后 `code=CONSTRAINT_ID_UNKNOWN` | 同上 | §3 S3-D4；§4 I-2；§7.2 |
| S3-TC-B03 | 同 B01 | 两个变体：① `constraints=[]`；② `constraints='duty.default'`（非数组）。各自注入并跑探针 1 | 注入前 `code=`；变体① `code=CONSTRAINT_LIST_EMPTY`；变体② `code=CONSTRAINT_LIST_EMPTY` | 同上 | §3 S3-D4（非数组或长度 0）；§7.2 |
| S3-TC-B04 | 夹具 2；探针 2 基线 `hit=False` | 在副本 `constraints.mjs` 的 `duty.default` 文本前注入 `不改任何文件；`；`Select-String '不改任何文件'` 命中后跑探针 2 | 注入前 `hit=False`；注入后 `hit=True`（`CONSTRAINT_TEXT_PERMISSION`） | `policy/definitions/constraints.mjs`、`card-model/vocab/permission-claims.mjs` | §3 S3-D4；§4 I-3；§7.2 |

**判据命令（B 组）**

```powershell
# 夹具 1 + 探针 1 的基线（B01–B03 共用；先跑一次，必须 code= 空）
$T = Join-Path $env:TEMP ('s3-data-' + [guid]::NewGuid().ToString('N'))
Copy-Item -Recurse 'tools/docgen/dsl/agents' $T
node --input-type=module -e "import {loadSeatData} from './tools/docgen/builders/agents/components/seatLoader.mjs'; import {validateAgentData} from './tools/docgen/builders/agents/components/validateAgentData.mjs'; const dir=process.argv[1]; let code=''; try { const {agentData,triggerTable}=loadSeatData(dir); try { validateAgentData(agentData,triggerTable) } catch(e){ code=e.code } } catch(e){ code=e.code } console.log('code='+code)" $T

# B01：注入旧字段（字符串形态）
node -e "const fs=require('fs');const p=process.argv[1];const j=JSON.parse(fs.readFileSync(p,'utf8'));j.card.duty.constraint='只记录不裁决';fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n')" "$T\seats\reviewer-actuary.json"
Select-String -Path "$T\seats\reviewer-actuary.json" -Pattern '"constraint"' -SimpleMatch
node --input-type=module -e "import {loadSeatData} from './tools/docgen/builders/agents/components/seatLoader.mjs'; import {validateAgentData} from './tools/docgen/builders/agents/components/validateAgentData.mjs'; const dir=process.argv[1]; let code=''; try { const {agentData,triggerTable}=loadSeatData(dir); try { validateAgentData(agentData,triggerTable) } catch(e){ code=e.code } } catch(e){ code=e.code } console.log('code='+code)" $T

# B02：未知 id（先重建副本，避免 B01 的旧字段先命中）
$T = Join-Path $env:TEMP ('s3-data-' + [guid]::NewGuid().ToString('N'))
Copy-Item -Recurse 'tools/docgen/dsl/agents' $T
node -e "const fs=require('fs');const p=process.argv[1];const j=JSON.parse(fs.readFileSync(p,'utf8'));j.card.duty.constraints=['duty.not-registered'];fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n')" "$T\seats\reviewer-actuary.json"
Select-String -Path "$T\seats\reviewer-actuary.json" -Pattern 'duty.not-registered' -SimpleMatch

# B03：空数组 / 非数组（每个变体都重建副本，避免前一次违规先命中）
$T = Join-Path $env:TEMP ('s3-data-' + [guid]::NewGuid().ToString('N'))
Copy-Item -Recurse 'tools/docgen/dsl/agents' $T
node -e "const fs=require('fs');const p=process.argv[1];const j=JSON.parse(fs.readFileSync(p,'utf8'));j.card.duty.constraints=[];fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n')" "$T\seats\reviewer-actuary.json"
$T = Join-Path $env:TEMP ('s3-data-' + [guid]::NewGuid().ToString('N'))
Copy-Item -Recurse 'tools/docgen/dsl/agents' $T
node -e "const fs=require('fs');const p=process.argv[1];const j=JSON.parse(fs.readFileSync(p,'utf8'));j.card.duty.constraints='duty.default';fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n')" "$T\seats\reviewer-actuary.json"

# B04：登记文本塞权限断言（仓副本）
$T = Join-Path $env:TEMP ('s3-repo-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $T | Out-Null
foreach ($r in 'tools/docgen','tools/execution-matrix','tools/quality','rules','agents','docs/agents') { New-Item -ItemType Directory -Path (Join-Path $T (Split-Path $r -Parent)) -Force | Out-Null; Copy-Item -Recurse (Join-Path '.' $r) (Join-Path $T $r) }
$F = Join-Path $T 'tools\docgen\builders\agents\policy\definitions\constraints.mjs'
node -e "const fs=require('fs');const p=process.argv[1];const id=process.argv[2];const ins=process.argv[3];const A=String.fromCharCode(39),Q=String.fromCharCode(34);let s=fs.readFileSync(p,'utf8');const at=s.indexOf(id);if(at<0)throw new Error('构造前提失败：未找到 '+id);let q=s.indexOf('text:',at);if(q<0)throw new Error('构造前提失败：未找到 text:');q=q+5;while(/\s/.test(s[q]))q++;if(s[q]!==A&&s[q]!==Q)throw new Error('构造前提失败：text: 后不是引号');s=s.slice(0,q+1)+ins+s.slice(q+1);fs.writeFileSync(p,s)" $F 'duty.default' '不改任何文件；'
Select-String -Path $F -Pattern '不改任何文件' -SimpleMatch
Push-Location $T
$all = @(node tools/docgen/builders/agents/cli.mjs gate 2>&1) + @(node --input-type=module -e "import{buildCards,collectCardFindings}from'./tools/docgen/builders/agents/components/cardPipeline.mjs';let codes;try{codes=[...new Set(collectCardFindings().map(x=>x.code))]}catch(e){codes=[e.code]};console.log('codes='+JSON.stringify(codes))" 2>&1)
"hit=" + [bool]($all | Select-String 'CONSTRAINT_TEXT_PERMISSION')
Pop-Location
```

**说明 / 不覆盖**

- 探针 1 同时尝试 `loadSeatData` 与 `validateAgentData`，是为了兼容 spec §6「`validateAgentData.mjs` 或 card-model 校验层」二选一；第 1 轮裁决 G1 已定「只进 `validateAgentData.mjs` 的 `EXIT`（exit 1）」，探针 1 仍保留双入口以防落点漂移，判据只认 `code=` 串。
- B 组**不**断言进程退出码：G1 已裁决 exit 1，但退出码由 E01 的总门禁兜底；本组只判「指定码被点名」。
- 每个变体都要**重建副本**或还原后再注入；连续注入会让前一次违规先命中，造成「码对了但根因不是本条」的假绿。
- B04 的扫描范围按第 1 轮裁决 G5 = **登记表全表**（未使用条目也算），故注入 `duty.default` 即可触发。

---

## §3 C 组：渲染与字节等价

**这一组守什么**：`约束：` 只有一条生成路径（I-1 / S3-D3），且整批迁移**零字节漂移**（I-4 / §7.4）。C02 用 `git show` 的 Buffer 逐字节比，禁止人工目测；C03 用 `fixtures/*.evidence.json` 的 `renderSha256` 做第二锚，防「git 基线取错提交」时整条判据失真。

| 编号 | 前置 | 构造/操作 | 期望（可机械判） | 落点文件 | 判据来源(spec 章节) |
|---|---|---|---|---|---|
| S3-TC-C01 | 迁移已落盘；登记表已存在 | 逐席：取 `duty.constraints`，按登记表求 `ids.map(id => constraints[id].text).join('；')`，与卡面 `约束：` 行逐字比；同时判 `duty` 键集 ⊆ `{trigger, action, constraints}`，输出**违规键集** | `seats=18 bad=[] violatingDutyKeys=[]` | `components/renderCard.mjs`、`components/cardPipeline.mjs` | §3 S3-D3；§4 I-1 |
| S3-TC-C02 | `$BASE` = 迁移前提交；迁移已提交（或工作区即迁移态） | 逐席 `git show $BASE:agents/<seat>.md` 取 Buffer，与工作区 `agents/<seat>.md` 的 Buffer `.equals()` | `cards=18 changed=[]` | `agents/*.md` | §4 I-4；§7.4；§5 步骤 5「0 差异」 |
| S3-TC-C03 | 迁移已落盘；`fixtures/*.evidence.json` 18 份齐全 | 逐席算 `agents/<seat>.md` 的 sha256（大写），与 `evidence.renderSha256` 比 | `seats=18 mismatch=[]` | `agents/*.md`、`fixtures/*.evidence.json` | §4 I-4；§6「证据目录记 sha」 |
| S3-TC-C04 | 迁移已落盘；登记表 ≥2 条 | 构造：取登记表前 2 个 id（现算，不写死），在内存把某席 `duty.constraints` 改为这两条；只调 `renderCard` 取 `约束：` 行 | `lineEq=true`（= `text1；text2`，顺序 = 数组序） | `components/renderCard.mjs` | §3 S3-D2「数组顺序 = 渲染顺序；多条用；连接」；§3 S3-D3 |

**判据命令（C 组）**

```powershell
# C01
node --input-type=module -e "import{constraints}from'./tools/docgen/builders/agents/policy/definitions/constraints.mjs';import{buildCards,buildEnv}from'./tools/docgen/builders/agents/components/cardPipeline.mjs';import{renderCard}from'./tools/docgen/builders/agents/components/renderCard.mjs';let bad=[],extra=[];const bs=buildCards();for(const b of bs){const ids=Array.isArray(b.card.duty.constraints)?b.card.duty.constraints:[];const want=ids.map(id=>(constraints[id]||{}).text).join('；');const line=renderCard(b.card,buildEnv(b.seat,[b.card])).split('\n').find(l=>l.startsWith('约束：'))||'';if(line!=='约束：'+want)bad.push(b.seat);const ek=Object.keys(b.card.duty||{}).filter(k=>!['trigger','action','constraints'].includes(k));if(ek.length)extra.push(b.seat+':'+ek.join(','))}console.log('seats='+bs.length+' bad='+JSON.stringify(bad)+' violatingDutyKeys='+JSON.stringify(extra))"

# C02（$BASE 由施工第 1 步记录）
node -e "const{execFileSync}=require('child_process');const{readFileSync,readdirSync}=require('fs');const BASE=process.argv[1];const seats=readdirSync('agents').filter(f=>f.endsWith('.md')).map(f=>f.slice(0,-3));let bad=[];for(const s of seats){const old=execFileSync('git',['show',BASE+':agents/'+s+'.md'],{maxBuffer:1e8});if(!old.equals(readFileSync('agents/'+s+'.md')))bad.push(s)}console.log('cards='+seats.length+' changed='+JSON.stringify(bad))" $BASE

# C03
node -e "const fs=require('fs'),c=require('crypto');const seats=fs.readdirSync('agents').filter(f=>f.endsWith('.md')).map(f=>f.slice(0,-3));let bad=[];for(const s of seats){const h=c.createHash('sha256').update(fs.readFileSync('agents/'+s+'.md')).digest('hex').toUpperCase();const e=JSON.parse(fs.readFileSync('tools/docgen/builders/agents/fixtures/'+s+'.evidence.json','utf8'));if(e.renderSha256!==h)bad.push(s)}console.log('seats='+seats.length+' mismatch='+JSON.stringify(bad))"

# C04
node --input-type=module -e "import{constraints}from'./tools/docgen/builders/agents/policy/definitions/constraints.mjs';import{buildCards,buildEnv}from'./tools/docgen/builders/agents/components/cardPipeline.mjs';import{renderCard}from'./tools/docgen/builders/agents/components/renderCard.mjs';const ids=Object.keys(constraints).slice(0,2);const b=buildCards()[0];const card={...b.card,duty:{...b.card.duty,constraints:ids}};const line=renderCard(card,buildEnv(b.seat,[card])).split('\n').find(l=>l.startsWith('约束：'))||'';console.log('ids='+JSON.stringify(ids)+' lineEq='+(line==='约束：'+ids.map(i=>constraints[i].text).join('；')))"
```

**说明 / 不覆盖**

- C01 的 `violatingDutyKeys` 只判「`duty` 出现白名单外子键」的**违规键集**；码的归属按第 1 轮裁决 G2 并入 `CONSTRAINT_NOT_IDS`（语义扩写），本用例**不绑死码名**，避免 spec §9 落定前把判据写死。
- C02 的 `$BASE` 必须在**施工第 1 步**记录；若迁移已提交，可用 `$BASE = git rev-parse "$(git log -1 --format=%H -- tools/docgen/dsl/agents/seats)^"` 反推。取错提交时 C03 会兜底报 `mismatch`。
- C04 是**内存构造**，不写盘、不改工作区；它只证明「渲染公式对多 id 成立」，不证明真实数据有多 id（现数据 18 席均为单元素，见 S3-A1）。
- C02 的「0 差异」是 §5 步骤 5 的硬口径；若出现 `changed`，按 spec 视为迁移失败，不得用 `draft → replace` 掩盖。

---

## §4 D 组：散文探针回归

**这一组守什么**：ID 化之后，登记文本是**新的文本面**；`PointerToElsewhere` / `HardcodedCount` / `MixedTermInCard` / `ProceduralWordOutsideParliament` 不能因为 `duty.constraint` 退场而失去判别力。每条都：① 在副本登记表注入；② `Select-String` 证明注入落到目标文件；③ 渲染受影响席证明注入串真的进了卡面；④ 要求指定码出现。

| 编号 | 前置 | 构造/操作 | 期望（可机械判） | 落点文件 | 判据来源(spec 章节) |
|---|---|---|---|---|---|
| S3-TC-D01 | 夹具 2；探针 2 基线 `hit=False` | 在副本 `duty.default` 文本前注入 `见 §3；`；`Select-String '见 §3'` 命中；渲染受影响席且取校验码 | 注入前 `hit=False`；注入后 `inText=true` 且 `hit=True`（`PointerToElsewhere`） | `policy/definitions/constraints.mjs`、`card-model/validateCardModel.mjs`、`card-model/enums.mjs` | §3 S3-D4 末段；§4 I-3；§7.3 |
| S3-TC-D02 | 同 D01 | 在副本 `duty.default` 文本前注入 `共 3 条；`；注入证明同上 | 注入后 `inText=true` 且 `hit=True`（`HardcodedCount`） | 同上 | 同上 |
| S3-TC-D03 | 同 D01 | 在副本 `duty.default` 文本前注入 `议长派发、主持人转录；`；注入证明同上 | 注入后 `inText=true` 且 `hit=True`（`MixedTermInCard`） | 同上 | 同上 |
| S3-TC-D04 | 同 D01 | 现算 `$ID` = `NON_PARL_SEATS` 中某席的 `constraints[0]`（不写死 id）；该席无条目 → **构造前提失败**；在副本 `$ID` 文本前注入 `收卡；`；注入证明同上 | 注入后 `affected>0`、`nonParlHit=true`、`inText=true` 且 `hit=True`（`ProceduralWordOutsideParliament`） | 同上 | §3 S3-D4；§7.3 |

**判据命令（D 组；以 D01 为模板，其余只换注入串与目标 id）**

```powershell
# 夹具 2
$T = Join-Path $env:TEMP ('s3-repo-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $T | Out-Null
foreach ($r in 'tools/docgen','tools/execution-matrix','tools/quality','rules','agents','docs/agents') { New-Item -ItemType Directory -Path (Join-Path $T (Split-Path $r -Parent)) -Force | Out-Null; Copy-Item -Recurse (Join-Path '.' $r) (Join-Path $T $r) }
$F = Join-Path $T 'tools\docgen\builders\agents\policy\definitions\constraints.mjs'

# 注入（D01；D02/D03 只替换 '见 §3；'；D04 见下方“D04 专项”）
node -e "const fs=require('fs');const p=process.argv[1];const id=process.argv[2];const ins=process.argv[3];const A=String.fromCharCode(39),Q=String.fromCharCode(34);let s=fs.readFileSync(p,'utf8');const at=s.indexOf(id);if(at<0)throw new Error('构造前提失败：未找到 '+id);let q=s.indexOf('text:',at);if(q<0)throw new Error('构造前提失败：未找到 text:');q=q+5;while(/\s/.test(s[q]))q++;if(s[q]!==A&&s[q]!==Q)throw new Error('构造前提失败：text: 后不是引号');s=s.slice(0,q+1)+ins+s.slice(q+1);fs.writeFileSync(p,s)" $F 'duty.default' '见 §3；'
Select-String -Path $F -Pattern '见 §3' -SimpleMatch

Push-Location $T
$o = @(node --input-type=module -e "import{buildCards,buildEnv,collectCardFindings}from'./tools/docgen/builders/agents/components/cardPipeline.mjs';import{renderCard}from'./tools/docgen/builders/agents/components/renderCard.mjs';const id=process.argv[1];const aff=buildCards().filter(x=>(x.card.duty.constraints||[]).includes(id));const b=aff[0];const t=renderCard(b.card,buildEnv(b.seat,[b.card]));console.log('affected='+aff.length+' inText='+t.includes('见 §3'));let codes;try{codes=[...new Set(collectCardFindings().map(x=>x.code))]}catch(e){codes=[e.code]};console.log('codes='+JSON.stringify(codes))" 'duty.default' 2>&1)
$o
"hit=" + [bool]($o | Select-String 'PointerToElsewhere')
Pop-Location
```

`D04` 专项：目标 id 由 `NON_PARL_SEATS` 现算，不写死；无条目即构造前提失败。

```powershell
$ID = node --input-type=module -e "import{buildCards,NON_PARL_SEATS}from'./tools/docgen/builders/agents/components/cardPipeline.mjs';const b=buildCards().find(x=>NON_PARL_SEATS.includes(x.seat)&&(x.card.duty.constraints||[]).length);if(!b){console.log('构造前提失败：非议会席无 constraints');process.exit(1)}console.log(b.card.duty.constraints[0])"
if ($LASTEXITCODE -ne 0) { throw '构造前提失败：无法现算非议会席的 constraint id' }
"ID=$ID"
node -e "const fs=require('fs');const p=process.argv[1];const id=process.argv[2];const ins=process.argv[3];const A=String.fromCharCode(39),Q=String.fromCharCode(34);let s=fs.readFileSync(p,'utf8');const at=s.indexOf(id);if(at<0)throw new Error('构造前提失败：未找到 '+id);let q=s.indexOf('text:',at);if(q<0)throw new Error('构造前提失败：未找到 text:');q=q+5;while(/\s/.test(s[q]))q++;if(s[q]!==A&&s[q]!==Q)throw new Error('构造前提失败：text: 后不是引号');s=s.slice(0,q+1)+ins+s.slice(q+1);fs.writeFileSync(p,s)" $F "$ID" '收卡；'
Select-String -Path $F -Pattern '收卡' -SimpleMatch
Push-Location $T
$o = @(node --input-type=module -e "import{buildCards,buildEnv,collectCardFindings,NON_PARL_SEATS}from'./tools/docgen/builders/agents/components/cardPipeline.mjs';import{renderCard}from'./tools/docgen/builders/agents/components/renderCard.mjs';const id=process.argv[1];const aff=buildCards().filter(x=>(x.card.duty.constraints||[]).includes(id));const np=aff.filter(x=>NON_PARL_SEATS.includes(x.seat));const b=np[0]||aff[0];const t=b?renderCard(b.card,buildEnv(b.seat,[b.card])):'';console.log('affected='+aff.length+' nonParlHit='+(np.length>0)+' inText='+t.includes('收卡'));let codes;try{codes=[...new Set(collectCardFindings().map(x=>x.code))]}catch(e){codes=[e.code]};console.log('codes='+JSON.stringify(codes))" $ID 2>&1)
$o
"hit=" + [bool]($o | Select-String 'ProceduralWordOutsideParliament')
Pop-Location
```

**说明 / 不覆盖**

- 探针 2 同时看 gate 与 `collectCardFindings()`：前者覆盖「码在 loader/validateAgentData」的落点，后者覆盖「码在 `validateCardModel` 扫描文本面」的落点；判据取并集（G1 已定 code 归 `validateAgentData` 的 `EXIT`，并集只作防御）。
- `MixedTermInCard` 的判别条件是「同一文本面同时出现两词」（`enums.mjs:81`）；D03 把两词注入**同一条**登记文本，避免分散到两席造成假阴性。
- `ProceduralWordOutsideParliament` 对议会席不生效（`validateCardModel.mjs:177`）；D04 的目标 id 运行时从 `NON_PARL_SEATS` 席现算（不写死），取不到条目即判「用例无效」，注入 `duty.default` 不会报该码。
- 本组不判「登记文本措辞是否通顺」，只判探针判别力不丢。

---

## §5 E 组：门禁与记账

**这一组守什么**：迁移的**收口面**。单点用例全绿不等于可交付：gate 必须 `baseline N/N` 且零 `Mismatch`、全仓 `check` 末行通过、scope-sweep 不回退、卡面 0 变化有账、契约面键集与迁移前一致（不得新增 `CONSTRAINT_*`、`SCAN_FIELDS` / `CARD_KEYS` 键集不变）。

| 编号 | 前置 | 构造/操作 | 期望（可机械判） | 落点文件 | 判据来源(spec 章节) |
|---|---|---|---|---|---|
| S3-TC-E01 | 迁移已落盘；A/B/C 组已绿 | 跑 `cli.mjs gate`；取末行与非空输出中的 `Mismatch`；同时现算 `N` | 末行 `baseline N/N`（`N = BASELINE_RULES.length + agentPaths().length`）；`exit=0`；`mismatch=False` | `components/cli.mjs`、`components/baseline.mjs` | §5 步骤 5；§7.5 |
| S3-TC-E02 | E01 已绿；依赖已安装 | 跑 `npm run check`，取最后一个非空行与退出码 | 末行 `check 全部通过`；`exit=0` | `scripts/check-all.mjs:575` | §7.5 |
| S3-TC-E03 | 迁移已落盘 | 跑 `node scripts/scope-sweep.mjs --check` | 非空输出含 `sweep ok（命中未超基线、清单齐、scope 齐）`；`exit=0` | `scripts/scope-sweep.mjs:165` | §7.5 |
| S3-TC-E04 | `$BASE` 已记录；本批评审目录已建 | ① `git diff --stat $BASE -- agents/` 必须空；② 取最新 `capability-diff.md`，判含 `agents/` 与字面锚 `卡面 0 变化` | ① 输出为空；② `agents=True zeroAnchor=True` | `docs/superpowers/reviews/<本批>/capability-diff.md` | §6 影响面末行（锚串由主 agent 同批落 spec）；§4 I-4 |
| S3-TC-E05 | 迁移已落盘；`$BASE` 已记录 | ① `CARD_MODEL_CODES` 键集中不得出现任何 `CONSTRAINT_*`；② `SCAN_FIELDS` / `CARD_KEYS` 的键集与 `$BASE` 版逐项相同 | `constraintCodes=[] scanEqBase=true cardKeysEqBase=true` | `card-model/validateCardModel.mjs`、`card-model/enums.mjs`、`components/cardKeys.mjs` | §3 S3-D3；§3 S3-D4；第 1 轮裁决 G1 |

**判据命令（E 组）**

```powershell
# E01
$o = @(node tools/docgen/builders/agents/cli.mjs gate 2>&1)
"gateExit=$LASTEXITCODE"
($o | Where-Object { $_.Trim() -ne '' })[-1]
"mismatch=" + [bool]($o | Select-String 'Mismatch')
node --input-type=module -e "import{BASELINE_RULES,agentPaths}from'./tools/docgen/builders/agents/components/baseline.mjs';console.log('N='+(BASELINE_RULES.length+agentPaths().length))"

# E02
$o = npm run check 2>&1
($o | Where-Object { $_.Trim() -ne '' })[-1]
"exit=$LASTEXITCODE"

# E03
$o = @(node scripts/scope-sweep.mjs --check 2>&1)
"exit=$LASTEXITCODE"
"ok=" + [bool]($o | Select-String 'sweep ok')

# E04
git diff --stat $BASE -- agents/
node -e "const fs=require('fs'),path=require('path');const bases=['.session/reviews','docs/superpowers/reviews'].filter(b=>fs.existsSync(b));const files=[];for(const b of bases)for(const d of fs.readdirSync(b)){const p=path.join(b,d,'capability-diff.md');if(fs.existsSync(p))files.push({p,m:fs.statSync(p).mtimeMs})}files.sort((a,b)=>b.m-a.m);if(!files.length){console.log('ledger=missing');process.exit(0)}const t=fs.readFileSync(files[0].p,'utf8');console.log('ledger='+files[0].p+' agents='+/agents[\\/]/.test(t)+' zeroAnchor='+t.includes('卡面 0 变化'))"

# E05（结构判据：不写 36/8/12；scan / cardKeys 与 $BASE 版键集比）
node --input-type=module -e "import{execFileSync}from'node:child_process';import{readFileSync}from'node:fs';import{CARD_MODEL_CODES}from'./tools/docgen/builders/agents/card-model/validateCardModel.mjs';const BASE=process.argv[1];const cur=(p)=>readFileSync(p,'utf8');const base=(p)=>execFileSync('git',['show',BASE+':'+p],{encoding:'utf8'});const OBJ=(src,name)=>{const i=src.indexOf('export const '+name+' = Object.freeze({');if(i<0)throw new Error('未找到 '+name);const j=src.indexOf('\n})',i);if(j<0)throw new Error('未闭合 '+name);return [...src.slice(i,j).matchAll(/^\s{2}([A-Za-z][A-Za-z0-9]*):/gm)].map(x=>x[1]).sort()};const ARR=(src,name)=>{const i=src.indexOf('export const '+name+' = [');if(i<0)throw new Error('未找到 '+name);const j=src.indexOf(']',i);return [...src.slice(i,j).matchAll(/'([A-Za-z][A-Za-z0-9]*)'/g)].map(x=>x[1]).sort()};const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);const scanCur=OBJ(cur('tools/docgen/builders/agents/card-model/enums.mjs'),'SCAN_FIELDS');const scanBase=OBJ(base('tools/docgen/builders/agents/card-model/enums.mjs'),'SCAN_FIELDS');const keyCur=ARR(cur('tools/docgen/builders/agents/components/cardKeys.mjs'),'CARD_KEYS');const keyBase=ARR(base('tools/docgen/builders/agents/components/cardKeys.mjs'),'CARD_KEYS');console.log('constraintCodes='+JSON.stringify(Object.keys(CARD_MODEL_CODES).filter(k=>k.startsWith('CONSTRAINT_')))+' scanEqBase='+eq(scanCur,scanBase)+' cardKeysEqBase='+eq(keyCur,keyBase))" $BASE
```

**说明 / 不覆盖**

- E01 的 `N` 一律现算；本文件只在 §0.1 记录迁移前实测 `20/20`，不在断言里写 `20`（`policy-pure-source.test.mjs:1168-1175` 已立此规）。
- E04 的 `zeroAnchor` 只判「账上有 spec §6 固定的字面锚 `卡面 0 变化`」；锚串由主 agent 同批落 spec（第 1 轮意见 T5），本文件不自行发明格式。声明的**充分性**（是否逐项解释）由人读复核，不机判。
- E05 是**结构防线**：`CONSTRAINT_*` 只许进 `validateAgentData.mjs` 的 `EXIT`（G1），`CARD_MODEL_CODES` 键集出现任何 `CONSTRAINT_*` 即红；`SCAN_FIELDS` / `CARD_KEYS` 只判「键集与 `$BASE` 相同」，不写数量。这样既守住 G1，也不再手抄 36/8/12。
- E02 会重写仓库内的临时产物（如 `docs/agents` 不写盘；`tmp/agent-criteria-demo/sandbox` 由既有测试重建）；跑完须复核 C02/C03 未变。

---

## §6 反例与边界

| 用例 ID | 反例/边界是什么 | 为什么容易漏 | 期望 |
|---|---|---|---|
| S3-TC-A01 | 只把 `constraint` 改名成 `constraints` 但值仍是字符串 | JSON 通过、卡面可能仍渲染，`Array.isArray` 才抓得住 | `arr=18` |
| S3-TC-A02 | 登记表用 `duty.1` / `duty.2` 占位 | 谓词 `/^[a-z][a-z0-9.:-]*$/` 允许数字开头于点后，光靠谓词放行 | `ordinal=[]` |
| S3-TC-A03 | 迁移时顺手润色一个字 | 卡面 gate 能抓字节，但若同时重写 registry 与席数据，文本层会「自洽地错」 | `textMismatch=[]` |
| S3-TC-A04 | 删了 `dutyConstraintDefault` 但某席仍写 `@dutyConstraintDefault` | loader 会抛 `DanglingSharedRef`，但错误码不是本批要的，容易被当成「反正红了」 | 席 JSON 命中数 `0` |
| S3-TC-A08 | 登记表先落、席数据只改一半（半迁移态） | 分两次提交时最容易出现；卡面 gate 只比字节，半迁移仍可能「看起来对」 | `reg=true migratedAll=true allOrNone=true` |
| S3-TC-B01 | 只删旧字段不报错（兼容两种形态） | 「能渲染」不等于「契约生效」 | `code=CONSTRAINT_NOT_IDS` |
| S3-TC-B02 | 未知 id 被 `constraints[id]?.text ?? ''` 静默兜成空串 | 卡面只少一段字，肉眼易放过 | `code=CONSTRAINT_ID_UNKNOWN` |
| S3-TC-B03 | 空数组被当成「本席无约束」合法 | 空数组会让 `约束：` 整行消失，但 gate 只比字节 | `code=CONSTRAINT_LIST_EMPTY` |
| S3-TC-B04 | 登记文本写「不改任何文件」被当成「描述职责」 | 词表是 denylist，但这条恰在表内，必须抓住 | `hit=True` |
| S3-TC-C01 | 渲染时用 `ids.join('；')`（漏查表）或席级再拼模板 | 卡面看起来仍是中文句子 | `bad=[]` 且 `violatingDutyKeys=[]` |
| S3-TC-C02 | 用 `Out-String` / 文本解码比哈希 | 换行归一后「看起来相等」 | `changed=[]`（Buffer `.equals`） |
| S3-TC-C03 | 迁移后重跑 `replace` 写了新 evidence | `renderSha256` 会变，但卡面字节没变 | `mismatch=[]` |
| S3-TC-C04 | 多条 id 用逗号 / 空格连接 | 单元素数据下永远测不出 | `lineEq=true` |
| S3-TC-D01 | 探针只扫 `duty.constraints` 的 id 字符串 | id 是 `duty.default`，永远不含「见」 | `hit=True` |
| S3-TC-D04 | 把 `收卡` 注入 `duty.default` | 12 席全是议会席，该码不触发，用例会假绿 | `nonParlHit=true` 且 `hit=True` |
| S3-TC-E01 | gate 输出 `baseline 20/20` 但伴随 `Mismatch` 行 | 只 grep 末行会漏 | `mismatch=False` |
| S3-TC-E04 | 卡面确实 0 变化，但账上不写 | 下一位读者无法区分「没变」与「没查」 | `agents=True zeroAnchor=True` |

## 未覆盖项与理由

| 不测什么 | 为什么 |
|---|---|
| 跨机器 / 跨 Node 版本的同哈希 | 无第二台基线；本机 `node -v` = `v24.22.2`（S3-A10）。C02 的 Buffer 比对与 C03 的 evidence 锚均在本机口径内成立 |
| 登记表**措辞质量 / 可读性** | 属文字评审，不是机械判据；本批 spec §2 非目标明确「不改卡面用词」 |
| 回退演练（删 `constraints.mjs` + 恢复 `constraint`） | 流程性操作，不是产物；C02/E04 已给出回退前后同一判据，回退后重跑即可自证 |
| `rationale` 是否应 ID 化 | spec §2 非目标：ID 化只是把散文搬家，不减少可写面 |
| 登记条目**子句拆分**后的字节影响 | spec S3-D1 明令本条不做子句拆分（会改字节，属措辞重构） |
| `@` 引用机制对其余字段（`cardRationaleHead` / `cardRationaleTail` / `hostTerm`）不动的证明 | 既有 `sa-data-layer.test.mjs` 已覆盖引用四形态；本批只删 `dutyConstraintDefault`，A04 判该键退场即可 |
| `duty` 下未知子键的**独立码** | 第 1 轮裁决 G2 已并入 `CONSTRAINT_NOT_IDS`；C01 判违规键集形态、B01 判旧字段形态，不再单独设码断言（避免重复） |
| 多元素 `constraints` 的**真实数据**正例 | 现数据 18 席全为单元素（S3-A1）；C04 用内存构造覆盖公式与顺序，不伪造席数据 |
| `docs/agents/README.md` 的汇总行是否随迁移变化 | 迁移零字节，README 不在 C02 的 18 卡范围内；gate 的 `docs/agents/**` 逐字节比对（`cli.mjs:173-183`）已兜底 |
| `npm run check` 的 9 个分段逐段断言 | E02 只判末行与退出码（§7.5 的口径）；分段各有既有测试，重复判会让本文件变成 `check-all.mjs` 的镜像 |

## spec 缺口（第 1 轮已裁决）

第 1 轮交叉评审对下列 5 项给出裁决；本文件已按裁决更新判据，缺口表保留原始事实锚供追溯。

| # | 缺口 | 事实锚（可核） | 第 1 轮裁决 |
|---|---|---|---|
| G1 | **4 个新码的发射点与退出码归属未定**：§6 写「`validateAgentData.mjs` 或 card-model 校验层」，但若进 `CARD_MODEL_CODES` 会破坏「36 码」硬约束 | `card-model/validateCardModel.mjs:17-62` 是 36 键；`card-model.test.mjs:891` 断言键数 == `S1_CODES.length`；`validateAgentData.mjs:11-36` 另有 `EXIT` 表，S-A/S-B 先例是「新码只进 `EXIT`、不进 36 码」 | **接受**：4 码只进 `validateAgentData.mjs` 的 `EXIT`（exit 1），**不改** `CARD_MODEL_CODES` |
| G2 | **`duty` 子键白名单没有对应码**：S3-D3 说 `duty` 只允许 `trigger? / action / constraints`，S3-D4 只给「`duty.constraint`（字符串形态）」的 `CONSTRAINT_NOT_IDS` | `cardKeys.mjs:5-6` 只定义 12 个 `CARD_KEYS`；`seatLoader.mjs:105-112` 只判 `card` 的 8 键，不判 `duty` 子键 | **接受**：并入 `CONSTRAINT_NOT_IDS`，语义扩写为「旧字段 / `duty` 白名单外子键」；码名不变 |
| G3 | **登记表的测试注入面未写明**：`constraints` 是否必须保持可注入（普通对象）？若实现 `Object.freeze` 或在加载时快照文本，B04/D 组的「登记文本面」注入只能走仓副本 | spec S3-D1 只给对象字面量形态；B04/D 组已提供仓副本夹具，不依赖可变性 | **接受**：不要求可变；允许「加载期触发」或「副本注入」两种时机，测试不得断言可写 |
| G4 | **迁移影响面漏列仍引用 `duty.constraint` 的既有测试**：§5 步骤 6 只写「至少 `card-model.test.mjs`、`card-render.test.mjs` 两处」 | `sc-card-shape.test.mjs:479/489/561/899`、`s3-predicates.test.mjs:600/619/631`、`sa-data-layer.test.mjs:107/216/503/537`、`s2-card-rewrite.test.mjs:415` 均直接读写 `duty.constraint`；`sa-data-layer.test.mjs:48` 与 `sc-card-shape.test.mjs:683` 断言 `shared.json` 4 键 | **接受**：spec §6 补列 `sc-card-shape` / `s3-predicates` / `sa-data-layer` / `s2-card-rewrite`；本文件无需改用例 |
| G5 | **`CONSTRAINT_TEXT_PERMISSION` 的扫描范围未写明**：是「登记表全表」还是「本席实际用到的条目」？ | S3-D4 只写「登记文本命中 `WRITE_DENIAL_PHRASES`」；B04 现按「全表」构造（注入 `duty.default` 即触发） | **接受**：定「**全表**」；B04 构造不变 |

## 交叉评审记录（第 1 轮）

> 证据中的 `本文件:N` = 本文件（`docs/superpowers/specs/2026-11-12-card-permission-prose-id-design-testcase.md`）第 N 行；其余为仓内 `path:line` 或命令。

| 意见 | 判定(接受/反对) | 处置或理由 | 证据(file:line 或命令) |
|---|---|---|---|
| T1 E05 三个数字违反「判据侧禁止手抄数量」 | 接受 | E05 改为结构判据：`CARD_MODEL_CODES` 键集不得出现任何 `CONSTRAINT_*`；`SCAN_FIELDS` / `CARD_KEYS` 只判「键集与 `$BASE` 版相同」，不再写 36/8/12 | 本文件:359、本文件:385 |
| T2 D04 目标 id 写死 `duty.test-design` | 接受 | D04 改为运行时从 `NON_PARL_SEATS` 席取 `constraints[0]`；取不到即「构造前提失败」，不跳过 | 本文件:303、本文件:328 |
| T3 A02 `srcKeys` 正则只认单引号形态，`dups` 可能假绿 | 接受 | `srcKeys` 降级为构造前提（数量不等 → 用例无效）；`dups` 改为 `dupId` + `dupText` 双向查重 | 本文件:151、本文件:165 |
| T4 A04 硬编码键名清单 | 接受 | 改为两条机械断言：`hasDefault=false`；键集 = `$BASE` 版键集 − `{dutyConstraintDefault}` | 本文件:171 |
| T5 E04 记账锚文本在猜格式 | 接受（条件） | 期望改为 spec 拟固定的字面锚 `卡面 0 变化`；条件 = 主 agent 同批把它落进 spec §6，否则以 spec 最终字面为准 | 本文件:358 |
| T6 仓副本清单可能漏读盘面 | 接受 | 保留 6 目录；新增共用构造前提：注入前 `collectCardFindings()` 必须 `codes=[]`，非空判「用例无效」 | 本文件:110 |
| T7 C01 只判键集，码归属未定 | 接受 | 结果列改为「违规键集」`violatingDutyKeys`；码归属按 G2 并入 `CONSTRAINT_NOT_IDS`，用例不绑死码名 | 本文件:264、本文件:287 |
| T8 缺「迁移前禁提前施工」用例 | 接受 | 新增 `S3-TC-A08`：登记表存在 ⇒ 18 席全部已改；只允许「全或无」中间态 | 本文件:157、本文件:184 |
| G1 4 码落点 | 接受 | 只进 `validateAgentData.mjs` 的 `EXIT`（exit 1），不改 `CARD_MODEL_CODES`；B 组与 E05 已按此更新 | 本文件:251、本文件:359 |
| G2 `duty` 子键白名单 | 接受 | 并入 `CONSTRAINT_NOT_IDS`（语义扩写：旧字段 / 白名单外子键），码名不变；C01 只判违规键集 | 本文件:287、本文件:430 |
| G3 登记表可注入性 | 接受 | 不要求可变；允许「加载期 / 副本注入」两时机，测试不得断言 `constraints` 可写 | 本文件:119 |
| G4 影响面补列 | 接受 | spec §6 补列四个既有测试文件；本文件无需改用例（B/C/D/E 已覆盖行为面） | 本文件:444；`sc-card-shape.test.mjs:479`、`s3-predicates.test.mjs:600`、`sa-data-layer.test.mjs:107`、`s2-card-rewrite.test.mjs:415` |
| G5 权限词表扫描范围 | 接受 | 定「登记表全表」；B04 构造不变（注入 `duty.default` 即触发） | 本文件:254 |

## 自检

> 本节在写完文档后由编写者实跑回填；命令与末行输出如下（均为本机 `v24.22.2`、仓根 `d:\Seed\retro-skills`）。

| # | 检查 | 命令 | 末行 / 关键输出 | 结果 |
|---|---|---|---|---|
| 1 | 文档命名 | `node scripts/doc-name.mjs --check` | `命名检查通过（docs）`（`exit=0`） | 通过 |
| 2 | 全仓门禁（含 ④ markdown 表格列数） | `npm run check` | ④ 段 `markdown 检查通过`；末行 `check 全部通过`（`exit=0`） | 通过 |
| 3 | 单文件表格列数（本仓无独立 `check-markdown-tables.mjs`，改用 `check-all` 同一单源切分器） | `node --input-type=module -e "…import{splitRow,fenceMask}from'./tools/execution-matrix/markdown-rows.mjs'…"` | `tables=15 findings=[]` | 通过 |

**说明**

- 第 2 项末次为**单进程重跑**（`check 全部通过`、`exit=0`）。此前一次并发重跑与上一轮后台 check 同时重写 `tmp/agent-criteria-demo/sandbox/`，触发 `S4-TC-I04` / `S4-TC-J02` 的 `ENOENT`；单进程重跑即绿，与本文件无关。
- 第 2 项跑完后 `git status --porcelain` 仅见本文件与 spec 两条未跟踪项；未改动任何实现 / 数据 / 卡面文件。
- 第 3 项用的是 `scripts/check-all.mjs` 与 `card-model` 共用的 `tools/execution-matrix/markdown-rows.mjs`（单源），因此与门禁口径一致，而不是另写一套切分。
- 本文件编写阶段 S3 实现尚未落盘，故 A–E 组命令**未逐条实跑**（多数在迁移前会按预期红）；已实跑的是 §0.1 的只读锚与「负例夹具可用性」预演（数据副本注入 `CardKeySetMismatch`、仓副本 `collectCardFindings()` 基线 `codes=[]`）。
