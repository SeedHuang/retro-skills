# 测试用例：S-A 数据层（`agentData` 拆 JSON + `when` 唯一源）

> 归属 spec：`docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md`（split from `docs/prd/20261102212627-card-data-contract-and-proof/index.md` 2026-11-03）
> 编写者：`senior-sdet`（**修订轮次 6**，实例标识 `senior-sdet@s-a-data-layer-testcase-20261103-06`；此前轮次 1 `…-01`、2 `…-02`、3 `…-03`、4 `…-04`、5 `…-05`）｜**独立性声明**：本文件由 `senior-sdet` 在**全新上下文**编写，编写者 ≠ spec 作者（`main-agent@20261103-s-a-spec`），≠ 后续施工者；编写者只读 spec / PRD / 既有实现，未参与 spec 撰写，也未参与本段施工。
> 本轮范围（轮次 6）：只收**两段判改判**（spec §10.1 R2 `:20` / §10.2.5 第 6 步 `:128` / §10.2.6 `:133`·`:135`）——「`card` 全量 **12** 键的恰等断言」从 loader / `agentData[i].card` 移到 `buildCards()` 产物，loader 只判「席文件 `card` 恰等 8 键 + 派生四键拒载」；并收 `@` 混用**规则 4**（spec §10.2.3 `:103` + §10.2.4 `:109-117`）的新口径。改动面 = TC-003 / TC-012 / TC-013 / TC-015 + §0 / §1 / §3 / §4 对应行；用例条数与类型分布不变。此前各轮处置见文末 R3 / R4 / R5。
> 状态：**定稿**（每条用例五要素齐全、覆盖总表与 spec 验收项一一对应；随 `②@S-A` 门行签收，`2026-11-03`）｜最后更新：`2026-11-03`（修订轮次 6）
> 命名与落点：按 `spec-testcase-gate` 判据 1（与 spec 同目录；文件名 = spec 文件名去掉 `.md` 后 + `-testcase.md`）。

## 0 判据约定（全表复用，避免每条重写命令）

所有命令在**仓根**执行，Shell = PowerShell 5；`exit` 指命令退出码。

| 代号 | 命令 | 备注 |
|---|---|---|
| `GATE` | `node tools/docgen/cli.mjs gate` | spec R9 唯一验收命令；`exit 0` + stdout 末行 `baseline N/N` |
| `CHECK` | `npm run check` | 门禁总入口；②.5 段内部再跑一次 `GATE` |
| `REFS` | `node tools/docgen/check-shared-refs.mjs` | 引用完整性校验器；落点已定（spec §10.2.1），四个新码见 spec §10.2.6。**不进 `npm run check` 独立门禁段**（§10.2.6 末段），兜底由 TC-030 的 import 判据承担 |
| `REPLACE` | `node tools/docgen/cli.mjs replace --kind agent --name <seat> --draft <草稿路径> --yes` | 写盘替换；`--draft` 必填（缺 = `DraftNotFound`），`--yes` 必填（缺 = `NotAuthorized`，`tools/docgen/cli.mjs:458`）；判据锚 `tools/docgen/cli.mjs:484`（`EvidenceInvalid`）/ `tools/docgen/cli.mjs:534`（`TargetDrift`） |
| `DATA` | `node -e "<inline>"`（读 `tools/docgen/data/shared.json` / `tools/docgen/data/seats/<seat>.json`） | 坏值注入一律落在数据文件层（spec §10.2.1 的两个落点）；与 `COPY` 同规则，**不得在真仓就地注入** |
| `ESC` | `node --test tools/docgen/test/card-model.test.mjs` | 承载 `S1-TC-G09` 三条冻结断言的文件 |
| `TT` | `node --test tools/docgen/test/tool-tiers.test.mjs` | 承载 `...s` 置末（`S5-TC-D10`）与档位 `FROZEN` 断言的文件 |
| `COPY` | 仓副本注入坏值 | 用既有支撑 `tools/docgen/test/support/dev-workflow-checks.mjs` 的 `withRepoCopy(dst => …)`；**不得在真仓就地注入** |
| `PROBE` | `node -e "<inline>"` | 从 `tools/docgen/components/agentData.mjs` 读 `agentData` / `triggerTable`（公开入口不变；展开与装配实现落在 `tools/docgen/components/seatLoader.mjs`，spec §10.2.1 / §10.2.5）；**两段判的消费点取数**用 `import('./tools/docgen/components/cardPipeline.mjs')` 的 `buildCards()`（TC-003 段 B） |
| `SHA` | `node -e "<inline>"` | 15 席 `evidence.renderSha256` 与 `SHA256(agents/<seat>.md)` 逐席比对 |

**口径声明**（本文件出现的数字，全部可复算）：
- 15 席 = `(Get-ChildItem agents -File).Count`；
- **12 键 = 唯一源 `tools/docgen/components/cardPipeline.mjs:23` 的 `CARD_KEYS`**（spec §10.2.9 `:162` 要求加 `export`）；键名内容与 `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md:89` 逐字一致，本文件**不再内联第二份字面**；**判据落点 = `buildCards()` 产物**（`cardPipeline.mjs:82-90` 的 `buildOne` 派生 `seat`/`name`/`description`/`tools` 后才成立，实测 15/15 席恰 12 键），**不在 loader**（spec §10.2.5 第 6 步 `:128`、§10.2.6 `:135`）；
- **8 键（两种，勿混）**：① = `tools/docgen/card-model/enums.mjs:95-104` 的 `SCAN_FIELDS` 键数（TC-009 / TC-022 用）；② = loader 产出的 `agentData[i].card` 键数 = `CARD_KEYS` 去掉 `seat` / `name` / `description` / `tools` 四派生键（`duty` / `scenes` / `signals` / `must` / `never` / `categories` / `checkItems` / `rationale`；实测 15/15 席恰 8 键，spec §10.2.5 第 6 步 `:128`，TC-003 段 A / TC-014 / TC-015 用）；
- 卡面禁写项 23 = `agents/reviewer-audit.md` 中「逐项点名：」至「；兜底句」之间按 `、` 切分（实测 23），删 Q8 的 3 项后 = 20；
- `shared.json` 键集 3 = spec §10.2.2 的实测表（`dutyConstraintDefault` / `cardRationaleHead` / `cardRationaleTail`），判定口径 = 逐字重复 ≥2 次（§10.2.10 D-d）。

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目 | 层级 | 正/负 | 判据类型 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|
| TC-001 | 10.1 R1 / 10.2.1（落点）/ 10.2.2（D-d 键集）/ PRD D12·Q7 | 集成 | 正 | 机器 | 限定目录计数 + `PROBE` | P0 |
| TC-002 | 10.1 R2（纯函数）/ 10.2.4 / PRD D12 | 单元 | 正 | 机器 | `PROBE` 二次展开比对 | P0 |
| TC-003 | 10.1 R2（两段判：loader 8 键 / `buildCards()` 12 键）/ 10.4-1 / 10.2.5 第 6 步 / 10.2.6（`CardKeySetMismatch`（卡片键集不符码）住 loader；判定面③ 住 `buildCards()`）/ 10.2.9（`CARD_KEYS` 单源）/ PRD V5（「展开后键集齐全」面） | 单元 | 正 | 机器 | `PROBE` 双段键集断言（import `CARD_KEYS` + `buildCards()`） | P0 |
| TC-004 | 10.1 R3 / 10.2.5 第 3–4 步 / 10.4-3 ① / PRD D17 | 单元 | 正 | 机器 | `PROBE` 逐席等比 | P0 |
| TC-005 | 10.1 R9 / 10.4-2 / PRD V4 | e2e | 正 | 机器 | `GATE` | P0 |
| TC-006 | 10.1 R6（只删 `pathGroups.workspace` 三项）/ PRD Q8 | 集成 | 正 | 机器 | `GATE` + 逐项点名行计数 | P0 |
| TC-007 | 10.1 R7 / 10.2.5 第 5 步（装配点落 `seatLoader.mjs`） | 单元 | 正 | 机器 | 源码结构探针 | P1 |
| TC-008 | 10.1 R8 / PRD Q5 | 单元 | 正 | 机器 | `PROBE` 键位置断言 | P1 |
| TC-009 | 10.1 R5 / 10.4-4 / PRD D17 | 单元 | 正 | 机器 | `PROBE` + `ESC` | P0 |
| TC-010 | PRD V3（回归）/ 10.4-2 | e2e | 正 | 机器 | `CHECK` | P1 |
| TC-011 | 10.1 R2 / 10.2.3 规则 2 / 10.2.6 `DanglingSharedRef`（悬空引用码）/ PRD V5 | 单元 | 负 | 机器 | `COPY` + `REFS` | P0 |
| TC-012 | 10.1 R2 / 10.2.3 规则 1 / 10.2.6 `NestedSharedRef`（共享段嵌套引用码）/ PRD V5（「无环」） | 边界 | 负 | 机器 | `COPY` + `REFS` | P0 |
| TC-013 | 10.1 R2 / 10.2.3 规则 1（shared 侧）/ 10.2.3 规则 4（`@` 开头但非 `^@key$` 的整值+插值混用）/ 10.2.10 D-b（单层）/ PRD V5 | 边界 | 负 | 机器 | `COPY` + `REFS`（经加载器/校验器，不对纯函数 `expandRefs` 单点断言） | P1 |
| TC-014 | 10.1 R2（loader 段：席文件 `card` 8 键恰等的**缺键**面）/ 10.4-1 / 10.2.5 第 6 步 / 10.2.6 `CardKeySetMismatch` | 单元 | 负 | 机器 | `COPY` + `GATE` | P0 |
| TC-015 | 10.1 R2（loader 段：席文件 `card` 8 键恰等的**多键/派生键**面）/ 10.2.5 第 6 步 / 10.2.6 `CardKeySetMismatch` / PRD V11① | 边界 | 负 | 机器 | `COPY` + `GATE` | P1 |
| TC-016 | 10.1 R2 / 10.2.3 规则 3 / 10.2.6 `EmptySharedValue`（共享值空值码） | 边界 | 负 | 机器 | `COPY` + `REFS` | P0 |
| TC-017 | 10.1 R9 / 10.4-2 / PRD V4 | 边界 | 负 | 机器 | `COPY` + `GATE` | P0 |
| TC-018 | 10.1 R9 / 10.4-2 / PRD V4 | 集成 | 负 | 机器 | `COPY` + `GATE` | P0 |
| TC-019 | 10.1 R3 / 10.2.2（`duty.trigger` 恒空串）/ 10.2.10 D-a / 10.4-3 ② | 单元 | 负 | 机器 | `COPY` + `GATE` | P0 |
| TC-020 | 10.1 R4 / PRD D17 | 单元 | 负 | 机器 | `COPY` 半改态 + 行为探针 | P0 |
| TC-021 | 10.1 R4 / PRD D17 | 单元 | 负 | 机器 | `COPY` + `ESC` 断言 | P0 |
| TC-022 | 10.1 R5 / 10.4-4 | 边界 | 负 | 机器 | `COPY` + `ESC` | P1 |
| TC-023 | 10.1 R5 / PRD §5 `S1-TC-G09` 行 | 集成 | 负 | 机器 | `ESC` | P0 |
| TC-024 | 10.1 R6 / PRD Q8 | 集成 | 负 | 机器 | `COPY` + `GATE` | P0 |
| TC-025 | 10.1 R6（只删 `pathGroups.workspace` 三项；盲区保留）/ PRD Q8 | 边界 | 负 | 机器 | 逐项点名行内计数（三值各一） | P0 |
| TC-026 | 10.1 R7 / 10.2.5 第 5 步 | 边界 | 负 | 机器 | `COPY` + `TT` | P0 |
| TC-027 | 10.1 R8 / PRD Q5 | 单元 | 负 | 机器 | `COPY` + `GATE` | P1 |
| TC-028 | 10.2.7（两处基线）/ 10.5 第 5 行 / PRD Q8 | 集成 | 负 | 机器 | `SHA` + `DATA` + `COPY` + `REPLACE` | P1 |
| TC-029 | 10.1 R3 / 10.4-3 / PRD V4 | 边界 | 负 | 机器 | `COPY` + `GATE` | P1 |
| TC-030 | 10.2.6 末段（loader `import` 期 fail-closed）/ 10.5 第 5 行 / PRD V5 | 集成 | 负 | 机器 | `COPY` + 子进程 `import` 退出码 | P1 |

**覆盖核对**：spec 验收项共 18 条 = §10.1 R1–R9（9 条）+ §10.4 硬约束 1–4（4 条）+ 本段引用的 PRD 锚点 V4 / V5 / V10 / **V11①**（5 条；**V11② 不承接**——它是三态表头 `check-tristate-header.mjs` 的活，S-A 不动表头）。本表覆盖 18 条（17 条全量 + **V10 部分**：只覆盖「`kind` 字段位」一面，四值校验归 S-C，见 §6）；未覆盖 0 条。§10.4-5（回退演练）按 spec §10.5「只手动验证」登记在 §5，不计入机器覆盖。

**§10.2 机制节的承接**：10.2.1（落点）/ 10.2.2（键切分与 `duty.trigger` 恒空串）/ 10.2.3（`@` 语法）/ 10.2.4（展开算法）/ 10.2.5（加载时序、装配点、第 6 步键集断言）/ 10.2.6（四个新码 + 末段 fail-closed）/ 10.2.7（两处基线）不单列验收项，分别由 TC-001 / TC-019 / TC-011～TC-016 / TC-002 / TC-003·TC-004·TC-007·TC-014·TC-015 / TC-003·TC-011～TC-016·TC-019·TC-014·TC-015·TC-030 / TC-028 承接；10.2.8（斜杠串不在本段）、10.2.9（**2 件源码 + 9 个文件的 14 处测试侧断言**；T6 补登 `lessons.test.mjs` 后的终态，逐处处置见 spec §10.2.9 表头）、10.2.10（四条 D 口径）无独立用例，登记在 §6 / 各用例「覆盖」列。

## 2 用例明细

### TC-001 数据源按席拆成 `tools/docgen/data/seats/<seat>.json`（15 份）+ `data/shared.json`（1 份）

- **覆盖**：spec §10.1 R1 / §10.2.1（文件落点）/ §10.2.2（D-d：`shared.json` 键集恰 3 键）；PRD §2 D12 / §3 Q7
- **前置**：拆 JSON 已落地；`tools/docgen/data/` 下只有 `seats/` 与 `shared.json` 两处（spec §10.2.1 表）
- **步骤**：
  ① `(Get-ChildItem tools\docgen\data -Directory).Name` → `tools/docgen/data` 下一级目录清单（**限定目录，不做全仓递归扫**）；
  ② `(Get-ChildItem tools\docgen\data\seats -File -Filter *.json).Name` → 文件名清单，去 `.json` 后取主名集；
  ③ `(Get-ChildItem tools\docgen\data -File -Filter shared.json).Count`；
  ④ `PROBE` 取 `agentData` 各条目 `name` 集，与 ② 的主名集做集合比较；
  ⑤ `DATA` 读 `tools/docgen/data/shared.json` 取顶层键集
- **预期**：① 一级目录恰 1 个且名字 = `seats`（无第二个目录）；② = 15 且主名集与 ④ 的席名集**逐字相等**（不多席不少席）；③ = `1`；④ 集合差集大小 = 0；⑤ 键集恰 `{dutyConstraintDefault, cardRationaleHead, cardRationaleTail}`（3 键、键名逐字）
- **判据**：①②③ 三条命令 exit 0 且数值分别 = 1 目录 / 15 文件 / 1 文件；④ 集合差集 = 0；⑤ 键集与三键字面集恰等（差集为空且计数 = 3）。任一项不满足 → 判失败
- **红绿证据**：红 = 现状 `tools\docgen\data` 目录不存在（`Get-ChildItem tools\docgen\data -Directory` exit 非 0），席数据仍是 `tools/docgen/components/agentData.mjs` 里的 JS 字面 → ②③ 计数 0；绿 = 1 个 `seats` 目录、15 份 `<seat>.json`、1 份 `shared.json`、键集恰 3
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-001`（文件名由 plan 定稿，用例 ID 不变）
- **不覆盖**：「逐字重复 ≥2 次」的实测取证本身（spec §10.2.2 的 `node -e` 已给出 12 / 12 / 11 行三个数）；本用例只判键集恰 3 键，不重算重复行数

### TC-002 `@` 展开是装配前一次性纯函数：同一输入两次展开结果逐字节相等

- **覆盖**：spec §10.1 R2（「装配前一次性纯函数」）/ §10.2.4（`expandRefs(value, shared, seat)`：纯函数、无副作用、不读盘）；PRD §2 D12
- **前置**：`agentData.mjs` 仍导出 `agentData`（公开入口不变）；展开实现落在 `tools/docgen/components/seatLoader.mjs`
- **步骤**：① `PROBE` 在同一进程内 `JSON.stringify(agentData)` 两次（两次之间不改任何输入）；② `PROBE` 在两次之间记录 `tools/docgen/data/shared.json` 的 SHA256 与文件长度；③ 另起一个进程再取一次 `agentData`，与前一次比较
- **预期**：① 两次字符串逐字节相等；② 展开前后 `shared.json` 的 SHA256 与长度不变（展开器不就地改写共享段）；③ 跨进程结果与进程内结果逐字节相等（无时间/随机/环境依赖）
- **判据**：`PROBE` 输出三种比较均为 `true`，命令 exit 0；任一为 `false` 则 exit 1
- **红绿证据**：红 = 展开器把 `shared.json` 对象引用直接塞进结果、再被后续装配就地改写 → 第二次 `JSON.stringify` 与第一次不等（`false`）；绿 = 三次结果全等且 `shared.json` 哈希不变
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-002`
- **不覆盖**：展开器的内部算法（只判外部可观察的两条：确定性 + 无副作用）

### TC-003 两段判：席文件 `card` 恰等 **8** 键（loader 段）/ `buildCards()` 产物恰等 **12** 键（消费点段）

- **覆盖**：spec §10.1 R2 `:20`（`2026-11-03` 计划门 P0-1 改判：**全量 12 键的恰等断言不落 loader**）/ §10.4-1 `:198` / §10.2.5 第 6 步 `:128`（**段 A** = 席文件 `card` 恰等 8 键 = `CARD_KEYS` 去派生四键 + 派生四键拒载）/ §10.2.6 `:133`·`:135`（`CardKeySetMismatch` 住 loader；`check-shared-refs.mjs` 判定面③ = `buildCards()` 15 席键集与 `CARD_KEYS` 恰等（12 键全量））/ §10.2.9 `:162`（`CARD_KEYS` 加 `export`，内容与顺序不变）；PRD §4 V5（「展开后键集齐全」面 ⇒ 段 B）
- **前置**：`tools/docgen/components/cardPipeline.mjs:23-24` 的 `CARD_KEYS` 已 `export`（12 键唯一源）；`seatLoader.mjs` / `check-shared-refs.mjs` 均从它 import（loader 的 8 键子集必须由 `CARD_KEYS` **过滤**得到，不得自写 8 键字面）；`buildCards()` 的派生点在 `cardPipeline.mjs:82-90` 的 `buildOne`
- **步骤**（两条都可直接粘贴，仓根 PowerShell 5）：
  ① **段 A + 段 B 一条命令取证**：`node -e "Promise.all([import('./tools/docgen/components/agentData.mjs'),import('./tools/docgen/components/cardPipeline.mjs')]).then(([a,c])=>{const K=c.CARD_KEYS;if(!Array.isArray(K)){console.log('CARD_KEYS 未导出');process.exit(1)}const D=['seat','name','description','tools'],A=K.filter(k=>!D.includes(k)),keys=o=>Object.keys(o),bad=(o,s)=>keys(o).filter(k=>!s.includes(k)).concat(s.filter(k=>!keys(o).includes(k))),L=a.agentData.map(x=>bad(x.card,A)),B=c.buildCards().map(x=>bad(x.card,K)),dv=a.agentData.filter(x=>D.some(k=>k in x.card)).length;console.log('loaderKeys8',L.filter(z=>!z.length).length+'/'+a.agentData.length,'loaderDiff',L.filter(z=>z.length).length,'derivedInCard',dv,'consumedKeys12',B.filter(z=>!z.length).length+'/'+B.length,'consumedDiff',B.filter(z=>z.length).length);process.exit(L.some(z=>z.length)||B.some(z=>z.length)||dv?1:0)})"` —— 取数写法：段 A 读 `agentData[i].card`（loader 产物，实测恒 8 键），段 B 读 `buildCards()[i].card`（消费点产物，实测恒 12 键）；
  ② 15 席逐席在 ① 内完成（`map` 遍历全部条目，任一席差集非空即计入 `loaderDiff` / `consumedDiff`）；
  ③ **第二份 12 键名单探针**：`Select-String -Path tools\docgen\components\seatLoader.mjs,tools\docgen\check-shared-refs.mjs -Pattern "'seat'[\s\S]{0,200}?'rationale'"` 命中数（12 键字面序列在两文件内均应为 0）
- **预期**：段 A 15 席每席键数 = 8，且与 `CARD_KEYS.filter(k => !['seat','name','description','tools'].includes(k))` **恰等**（差集两向均空）；段 A 反面：四派生键在 `agentData[i].card` 内命中数 = 0；段 B 15 席每席键数 = 12，且与 `CARD_KEYS` **恰等**（既不多也不少）；③ 两文件内 12 键字面序列命中数 = 0（12 键只有 `CARD_KEYS` 一处）
- **判据**：① 输出 `loaderKeys8 15/15`、`loaderDiff 0`、`derivedInCard 0`、`consumedKeys12 15/15`、`consumedDiff 0`，exit 0；③ `secondList 0`。任一段差集非空、计数不符、或 `secondList` ≥ 1 → exit 1 并打印该席名与该段差集。**两段都断在「双向差集均空」这一档，不得降级为 `ok(长度)`、不得写成「≥」、不得删「恰等」**
- **红绿证据**：红 = 现状 `cardPipeline.mjs:23-24` 的 `CARD_KEYS` 未导出 → ① 打印 `CARD_KEYS 未导出` 并 exit 1（唯一源缺失，两段都判不了）；红（判据错位，本轮修的就是它）= 旧版把 12 键挂在 `agentData[i].card` 上，实测 15/15 席恒 **8** 键（`duty`/`scenes`/`signals`/`must`/`never`/`categories`/`checkItems`/`rationale`），该判据永红；红（多键漏判）= 只判「至少 12 键」会放过席文件多带一个 `role`——`...own`（`cardPipeline.mjs:83`）原样带进 `buildCards()` 产物 → 段 B 得 13 键、`consumedDiff` 非空；绿 = 段 A `15/15` 8 键恰等 + `derivedInCard 0`，段 B `15/15` 席键集与 `CARD_KEYS` 恰等（12 键全量），`secondList 0`
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-003`
- **不覆盖**：各键内部结构合法性（由 `validateCardModel` 既有码覆盖，本段不改）；键**顺序**（`CARD_KEYS` 顺序变化不报，只判键集恰等）；`buildOne` 对 `must` / `never` 的合并语义（归 S1 `merge.mjs`，TC-009 相邻但不同面）

### TC-004 `duty.trigger` 装配期注入后与 `triggerTable.when` 逐字相同（15/15）

- **覆盖**：spec §10.1 R3 / §10.2.5 第 3–4 步（拆出 `trigger` 后再写回 `card.duty.trigger`）/ §10.4-3 ①；PRD §2 D17（**不引 PRD V12**：V12 判的是四字段斜杠串计数，与「同源」无关，spec §10.4-3 已明写）
- **前置**：`when` 唯一源 = `triggerTable.when`；装配期按 §10.2.5 注入；`agentData` 与 `triggerTable` 均可从 `agentData.mjs` 取到
- **步骤**：① `PROBE` 逐席比较 `card.duty.trigger === triggerTable[seat].when`；② 反向断言：`agentData` 中不再有「第二份 trigger 字面」作源（即改 `triggerTable[seat].when` 一个字符后 `duty.trigger` 跟着变，`COPY` 内只改 `when`）
- **预期**：① 15/15 逐字相等（含尾随「时」的有无必须一致）；② 只改 `when` 时 `duty.trigger` 随之改变，无任何席保留旧值
- **判据**：① `PROBE` 输出 `same 15/15`、exit 0；② `COPY` 内改一席 `when` 后同一探针输出 `same 15/15` 且该席值等于新 `when`（证明注入真实生效，不是两份恰好相等）
- **红绿证据**：红 = 现状靠「两处恰好逐字相同」维持：`agentData.mjs` 的 `cardOf` 第 3 参数（如 `:79`、`:112`）与 `triggerTable[...].when`（如 `:303`、`:307`）各写一遍，改一处即不等；绿 = 只改 `when` 后两者仍 15/15 相等
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-004`
- **不覆盖**：`notWhen` 的拼接（TC-029 专管）；`description` 渲染形态（TC-005 逐字节兜底）

### TC-005 拆 JSON 后 15 席 `disk == render` 逐字节相等、`gate` exit 0

- **覆盖**：spec §10.1 R9 / §10.4-2；PRD §4 V4
- **前置**：`agents/*.md` 已按新数据源重生成（不是手工改）；`baseline 38/38` **不作判据**（PRD §5：同式自除恒真）
- **步骤**：① `GATE`；② 对 15 席逐席 `node tools/docgen/cli.mjs diff --kind agent --name <seat>`；③ 基线取数（spec §10.2.7 末段）：对每席同时取 ⅰ `git show HEAD:agents/<seat>.md` 的 SHA256、ⅱ `tools/docgen/fixtures/<seat>.evidence.json` 的 `renderSha256` 现值、ⅲ 盘上 `agents/<seat>.md` 的 SHA256 —— 判 ⅰ = ⅱ，且 ⅱ 与 ⅲ 的关系落在预期（13 席相等、2 席只差边界段）
- **预期**：① exit 0 且 stdout 末行为 `baseline N/N`；② 15 席全部输出「差异 - 0 / + 0」；③ `git show HEAD` 算出的 SHA256 与对应 `evidence.renderSha256` **逐席相等**（`gate` 已在判，本用例只复算一次）；13 席盘上哈希 = 基线，Q8 波及 2 席只差在禁写清单那一段
- **判据**：① `GATE` exit 0；② 15/15 席 `diff` exit 0 且含「差异 - 0 / + 0」；③ 15/15 席 `git-HEAD-sha == evidence.renderSha256`（差集 0），且盘上哈希与基线的不等席数恰为 2、其 `diff` 行只出现在边界段
- **红绿证据**：红 = 拆 JSON 时字段顺序变化 → `Mismatch` exit 1（`tools/docgen/cli.mjs:143-144` 逐席 `compareBuffers`）；绿 = exit 0 + 15/15 逐字节；③ 若无基线记录，`git show HEAD` 的 15 个哈希即基线，不靠人肉记忆
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-005`
- **不覆盖**：`renderCard` 的排版细节（spec §10.5 明写属 S-C）

### TC-006 policy 删 3 项后 2 张卡重生成、「逐项点名」行 23 → 20，`.gitignore` 兜底句仍在

- **覆盖**：spec §10.1 R6（删的范围 = **只删 `pathGroups.workspace` 的三项**；`DETECTION_BLIND_SPOTS` 的 `lessons/` 保留）；PRD §3 Q8
- **前置**：`tools/docgen/policy/definitions/paths.mjs:10-20` 的 `pathGroups.workspace` 已删 `skills-lock.json`、`lessons/`、`tools/docgen-spike/.tmp-test/` 三项；`tools/docgen/policy/definitions/paths.mjs:27` 的 `DETECTION_BLIND_SPOTS` 未动
- **步骤**：① 取 `agents\reviewer-audit.md` 中**含「逐项点名」的那一行**（`Select-String -Pattern '逐项点名'` 得该行原文），按 `、` 切分「逐项点名：」至「；兜底句」之间的项并计数（**只算这一行；「检测限度」段不计**）；② 对 `agents\detective-observer.md` 重复 ①；③ 两卡该行包含 `兜底句：凡 `.gitignore` 覆盖的路径一律视为禁止写入。`；④ `GATE`
- **预期**：① ② 两卡「逐项点名」行项数均 = 20（= 删前 23 − 3，只算该行）；③ 兜底句逐字在位；④ exit 0（两卡已重生成）
- **判据**：①② 计数命令 exit 0 且两卡均 `20`；③ `Select-String -Pattern '兜底句' -SimpleMatch` 两卡各 ≥1 命中；④ `GATE` exit 0
- **红绿证据**：红 = 现状两卡「逐项点名」行实测 23（`agents\reviewer-audit.md:96`、`agents\detective-observer.md:78`）；只删 policy 不重生成 → `GATE` `Mismatch` exit 1；绿 = 20 / 20、兜底句在位、`GATE` exit 0
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-006`
- **不覆盖**：policy 内容语义（哪三项该删属 ② 段 Q8 裁定，已裁定）；「检测限度」段的 `lessons/`（spec R6 明写保留，TC-025 的第二半判据专管）；其余 13 席边界段不变（TC-005 ③ 兜底）

### TC-007 装配顺序不变：`...s` 必须置末且恰一处（装配点落 `tools/docgen/components/seatLoader.mjs`）

- **覆盖**：spec §10.1 R7 / §10.2.5 第 5 步（装配形态逐字不变，位置从 `agentData.mjs:295` 迁到加载器）/ §10.2.9 测试侧第 1 处
- **前置**：装配层已在 `tools/docgen/components/seatLoader.mjs`；`agentData.mjs:295` 的形态原样搬过去；`S5-TC-D10`（`tools/docgen/test/tool-tiers.test.mjs:706-712`）的 `readRepo` 目标已同批改到 `seatLoader.mjs`（spec §10.2.9）
- **步骤**：① 在 `seatLoader.mjs` 源码上用正则 `tools:\s*toolsForSeat\(\s*s\.name\s*\)` 取命中数 `n` 与首个命中的索引 `i`；② 取 `j = src.indexOf('...s', i)`，断言 `j > i && j - i < 400`；③ 取 `b = src.indexOf('boundaryBySeat', i)`，断言 `b > i && b < j`；④ 在 `tools/docgen/components/agentData.mjs`（薄壳）上跑同一正则，命中数 `m`
- **预期**：① `n = 1`（恰一处，不认「等价写法」）；② `...s` 在 `tools` 之后且距离 < 400 字符；③ `boundaryBySeat` 的展开夹在 `tools` 与 `...s` 之间；④ `m = 0`（装配表达式只在 `seatLoader.mjs` 一处）
- **判据**：源码探针输出 `tools-hit 1`、`s-after 1`、`boundary-between 1`、`shell 0`，exit 0；`n ≠ 1`、`j ≤ i`、`j - i ≥ 400`、`b` 不在 `(i, j)` 内、或 `m ≠ 0` → exit 1。运行时等价判据 = `TT` exit 0（`S5-TC-D10` 已钉同一形态：`tools` 恰 1 处 + `...s` 在其后且 < 400 字符）
- **红绿证据**：红 = `COPY` 内把条目展开提前 → `S5-TC-D10` 第二/三条断言（`tool-tiers.test.mjs:710-712`）exit 非 0；绿 = `seatLoader.mjs` 内形态 `{ tools: …, ...(boundary…), ...s }`（现 `tools/docgen/components/agentData.mjs:295` 原样），`TT` exit 0
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-007`
- **不覆盖**：档位表内容（归 S6 / `tiers.mjs`）

### TC-008 `trigger.kind` 只住 `triggerTable[<seat>]`，数据条目顶层不得出现

- **覆盖**：spec §10.1 R8；PRD §3 Q5（本段只留字段位）
- **前置**：`triggerTable` 仍由 `agentData.mjs` 导出且 15 席键齐
- **步骤**：① `PROBE` 取每席 `Object.keys(triggerTable[seat])`；② 断言键集 ⊆ `{when, route, notWhen, fallback, kind}`；③ 断言 `kind` 若存在则为字符串（**不校验四值**，见 §6）；④ 断言 `agentData` 各条目顶层键不含 `kind`
- **预期**：15/15 席 `triggerTable[seat]` 键集落在白名单内；`kind` 字段位就在该对象里；条目顶层 `kind` 命中数 = 0
- **判据**：`PROBE` 输出 `kindSlot 15/15`、`kindAtEntry 0`，exit 0；任一席键集越界或条目顶层出现 `kind` → exit 1
- **红绿证据**：红 = 把 `kind` 挂到 `seats/<seat>.json` 顶层 → `validateAgentData` 断言 15 的白名单（`BASE_KEYS`，`tools/docgen/components/validateAgentData.mjs:105`）不含它 → `TriggerFieldMisplaced`（TC-027 为同一判据的负例）；绿 = `kind` 只在 `triggerTable` 内
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-008`
- **不覆盖**：四值 `{dispatch, occasion, moment, need}` 的校验与非议会席只许 `need`（PRD V10 整条归 S-C）

### TC-009 `SCAN_FIELDS` 仍 8 键，且 `description` 落在 4 个文本码的扫描面里

- **覆盖**：spec §10.1 R5 / §10.4-4；PRD §2 D17
- **前置**：`enums.mjs` 的 `CARD_TEXT_FIELDS` 已加 `description`；`surfaceTexts` 已加 `description` 分支（后者由 TC-020/TC-021 行为验）
- **步骤**：① `PROBE` 读 `SCAN_FIELDS` 键数；② 对 `PointerToElsewhere` / `HardcodedCount` / `MixedTermInCard` / `ProceduralWordOutsideParliament` 四码，把扫描面 `flat()` 后查是否含 `description`；③ 对 `SubjectiveLabel` / `InlineTermList` / `InlineThreshold` / `AmbiguousCriterion` 四码查不含 `description`；④ `ESC`
- **预期**：① 键数 = 8（仍是逐码一项，不合并、不新增键）；② 四码全部含 `description`；③ 另外四码全部不含；④ `ESC` exit 0
- **判据**：`PROBE` 输出 `keys 8`、`codesWithDescription 4/4`、`codesWithoutDescription 4/4`，exit 0；任一不等于 → exit 1
- **红绿证据**：红 = 现状 `enums.mjs:86-93` 的 `CARD_TEXT_FIELDS` 六项无 `description`，四码都扫不到它；绿 = 8 键不变且四码含 `description`（字段列表扩展，不是新键）
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-009`
- **不覆盖**：`rationale` / `scenes[].why` 的既有豁免面（`S1-TC-G09` 其余条目仍在 `ESC` 内）

### TC-010 全仓门禁回归：`npm run check` exit 0 且 `# tests` 不低于基线

- **覆盖**：PRD §4 V3（回归资产）；spec §10.4-2
- **前置**：本批改动已全部落地；`npm run check` 是测试计数的**唯一口径**（PRD V3：裸跑 `node --test` 发现集不同，两数不可混用）
- **步骤**：① `CHECK`；② 读末段 `# tests` 与 `# fail`
- **预期**：① exit 0；② `# fail 0` 且 `# tests ≥ 1405 + 本批新增用例数`（1405 为 PRD V3 记录的 `npm run check` 基线）
- **判据**：`CHECK` exit 0，输出含 `# fail 0`；`# tests` 数值 ≥ 1405
- **红绿证据**：红 = 删掉/跳过任一既有测试文件 → `# tests` 低于基线或 ② 段 skip 守卫红；绿 = exit 0 且计数只增不减
- **对应测试**：本用例即命令本身（不另落测试文件）
- **不覆盖**：各段内部规则正确性（各段自有判据）

### TC-011 悬空引用：`@` 指向不存在的 shared 键 → `DanglingSharedRef`（悬空引用码）exit 1 并点名键与席

- **覆盖**：spec §10.1 R2 / §10.2.3 规则 2 / §10.2.6（`DanglingSharedRef` 登记在 `validateAgentData.mjs` 的 `EXIT[1]`）；PRD §4 V5
- **前置**：`COPY`；引用语法按 spec §10.2.3 —— 整值引用 = 字符串**整体**匹配 `^@[a-z][A-Za-z0-9]*$`，片段插值 = 字符串内 `${@<key>}`
- **步骤**：① `COPY` 内改某席 `tools/docgen/data/seats/<seat>.json` 的一处**整值引用**为 `"@noSuchKey"`（键不存在）；② 跑 `REFS`；③ 复原后再跑 `REFS`；④ 另把某席的**片段插值**改成 `${@noSuchKey}` 再跑 `REFS`；⑤ 复原
- **预期**：②④ 均 exit 1，输出含 `DanglingSharedRef`、键名 `noSuchKey` 与引用它的席名；两种写法任何一种都不得退化成 exit 0，也不得展开成空值后继续；③⑤ exit 0
- **判据**：②④ `REFS` exit 1 且 stdout/stderr 同时含 `DanglingSharedRef`、`noSuchKey` 与席名（三个字符串各 ≥1 命中）；③⑤ 复原后 exit 0。任一条件缺一 → 判失败
- **红绿证据**：红 = 现状无 `check-shared-refs.mjs`（`REFS` 不存在，命令 exit 非 0 且提示模块找不到）；且 `DanglingSharedRef` 尚未登记进 `tools/docgen/components/validateAgentData.mjs:13-33` 的 `EXIT[1]`（未登记时 `exitCodeFor` 抛「未知错误码」而不是 exit 1）；绿 = 两种写法都 exit 1 并点齐三样
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-011`
- **不覆盖**：渲染期是否报错（本段要求的是**装配前**报错，渲染期报错已太晚）

### TC-012 环引用：共享段 A ↔ B 互引 / A 自引 → 前置拒绝 `NestedSharedRef` exit 1，10 秒内返回（不得栈溢出）

- **覆盖**：spec §10.1 R2 / §10.2.3 规则 1（`shared.json` 值内不得再含 `@` 或 `${@`）/ §10.2.6（`NestedSharedRef`，中文释义：共享段嵌套引用码）；PRD §4 V5（「无环」）
- **前置**：`COPY`；`tools/docgen/data/shared.json` 至少两段可被 `@` 引用；**取数路线必须是加载器 / 校验器**（`REFS` = `check-shared-refs.mjs`，或直接 `import` 加载器 `seatLoader.mjs` 触发的临盘校验），**不得**写成对纯函数 `expandRefs` 的单点断言——实现里 shared 侧的拒嵌套落在 `loadSeatData` 的前置检查（spec §10.2.3 规则 1 `:100` + §10.2.4 `:109-117` 的算法前置），单点调纯函数会绕开「数据一落盘就拒」这条语义
- **步骤**：① 在 A 段字符串值内写 `${@B}`、在 B 段值内写 `${@A}`（互引）；② 跑 `REFS`（设 10 秒超时；该脚本走 `buildCards()` 一圈，覆盖 loader + 消费点两段）；③ 另造 A 段值内写 `${@A}`（自引），再跑一次；④ 去掉 A 段引用后再跑
- **预期**：②③ 均 exit 1，输出含 `NestedSharedRef` 且点名被拒的键（A 或 B）；**不得** `Maximum call stack` 崩溃、不得挂起、不得超时；④ exit 0
- **判据**：②③ `REFS` exit 1 且输出含 `NestedSharedRef` 与至少一个键名；命令在 10 秒内返回（超时或栈溢出 = 判失败）；④ exit 0。**判据只认 `REFS` 的退出码与输出，不认「纯函数单测绿」**（`expandRefs` 单独调通不能代替本条的通过）
- **红绿证据**：红 = 实现先做递归展开（或先写环检测）→ `shared.json` 侧的引用被递归跟进 → 进程栈溢出（exit ≠ 1）或超时；绿 = 由 §10.2.3 规则 1 在展开前拒绝、快速失败并点键
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-012`
- **不覆盖**：环检测算法本身（spec §10.2.3 明写「环在数据形态上无法构造，不另写递归环检测」）；本用例判「构造环 ⇒ 被前置拒绝且不崩」，不是「环检测正确」

### TC-013 嵌套引用 / 整值-插值混用：共享段内再写引用、或字符串 `@` 开头却不整体匹配 → `NestedSharedRef` exit 1 并点名该键（**单分支：不取「递归展开到底」**）

- **覆盖**：spec §10.1 R2 / §10.2.3 规则 1 `:100`（shared 侧）/ §10.2.3 规则 4 `:103`（**`@` 开头但不整体匹配 `^@key$`** ⇒ 同码；含 `@a ${@b}` 这类整值与插值混用；**不含**旧口径——该判定在实现里不可达，整值匹配成功时整串不可能含 `$`）/ §10.2.4 `:111-112`（算法两分支）/ §10.2.6（`NestedSharedRef`）/ §10.2.10 D-b（`@` 只允许单层：`seats/*.json` → `shared.json`）
- **前置**：`COPY`；`tools/docgen/data/shared.json` 的 X 段当前**不含**任何 `@` 或 `${@`；断言走加载器 / 校验器路线（`REFS`，**不得**对纯函数 `expandRefs` 单点断言）
- **步骤**：① 三种写法逐次造，每次只留一种：ⅰ shared 侧 X 段值写对 Y 段的**整值** `"@Y"`；ⅱ shared 侧 X 段值写**插值** `${@Y}`；ⅲ **seat 侧**把某席一处普通字符串改成整值与插值混用 `"@cardRationaleHead ${@cardRationaleTail}"`（以 `@` 开头但不整体匹配 `^@key$`，spec §10.2.3 规则 4）；② 每种写法各跑一次 `REFS`；③ 若某席引用了 X，同批跑 `GATE`
- **预期**：② 三种写法均 exit 1，输出含 `NestedSharedRef` 且点名键 `X` / `Y`（ⅲ 点名该席与被混用的键）；③ `GATE` 不得因「引用已展开」而 exit 0；**不许**出现「exit 0 且 X 段里的 `@` 原文残留」，也**不许**出现「exit 0 且已递归展开到底」，更**不许**把 `"@a ${@b}"` 当合法的「整值 + 追加文本」放行
- **判据**：`REFS` 在三种写法下均 exit 1 且输出含 `NestedSharedRef` 与键名 `X`/`Y` 之一；③ `GATE` exit 非 0（或同一前置校验点已由 `REFS` 拦下）；出现任何一次 exit 0 → 判失败
- **红绿证据**：红 = 只展开一层后 exit 0（X 里留 `@Y` 原文却静默放过）；红（ⅲ）= 把「以 `@` 开头的整值」当普通字符串处理后只替换其中的 `${@…}` → 混用形态 exit 0；绿 = 三种写法都明示拒绝并点键。**反例（不许实现）**：把「递归展开到底」当成可接受分支 —— 与 D-b 相悖，实现即判失败
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-013`
- **不覆盖**：嵌套深度上限（**已定：不存在**，只允许单层，见 spec §10.2.10 D-b）；「整值展开后结果内仍含 `@` 或 `${` ⇒ 同码」（规则 4 后半句）属同一实现点的纵深，与 ⅰ 的 shared 侧注入同码同报，不另立用例以免重复计负例

### TC-014 装配后 `card` 少一个键（删 `rationale`）→ `CardKeySetMismatch` exit 1，点名缺的键

- **覆盖**：spec §10.1 R2 / §10.4-1 / §10.2.5 第 6 步 / §10.2.6（`CardKeySetMismatch`）；PRD §4 V5「少一个顶层键 → exit 1」
- **前置**：`COPY`；席数据落点 `tools/docgen/data/seats/<seat>.json`（spec §10.2.1）
- **步骤**：① 在某一席的 `seats/<seat>.json` 的 `card` 里删掉 `rationale`（`card` 只许 8 键，spec §10.2.2）；② `GATE`；③ 复原后 `GATE` 对照
- **预期**：② exit 1，stderr 首行以 `CardKeySetMismatch:` 开头，输出点名缺失键 `rationale` 与席名；不得退化成 `cardPipeline.mjs` 的「缺键即 undefined」通用报错（那是第二道，不得作为唯一防线）；③ exit 0
- **判据**：注入态 `GATE` exit 1 且输出同时含 `CardKeySetMismatch`、`rationale`、席名；复原态 exit 0
- **红绿证据**：红 = 只靠 `cardPipeline.mjs:91-95` 的缺键检查（抛 `UnverifiableOutput` 类通用码）→ 拿不到 `CardKeySetMismatch`；绿 = 第 6 步断言先报该码
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-014`
- **不覆盖**：键值内容合法性（归 `validateCardModel`）

### TC-015 席文件 `card` 多一个键（`ghostField`）/ 写了派生四键之一（`tools`）→ 二者都在 loader 的 8 键恰等处报 `CardKeySetMismatch`

- **覆盖**：spec §10.1 R2 `:20`（loader 只判「席文件 `card` 恰等 8 键 + 派生四键拒载」；全量 12 键的恰等判在 `buildCards()`，见 TC-003 段 B）/ §10.2.2 `:84`（派生四键不得写）/ §10.2.5 第 6 步 `:128` / §10.2.6 `:133`（`CardKeySetMismatch`）；交叉 PRD §4 V11①（`tools/docgen` 内该词计数 = 0；**S-C 起夹具键名用 `ghostField`**，见 spec §11.2 #14 / V11 ① 改判）
- **前置**：`COPY`；席文件 `card` 只许 8 键（spec §10.2.2 `:84`、§10.2.5 第 6 步 `:128`）
- **步骤**：① 形态 A —— 在某一席 `tools/docgen/data/seats/<seat>.json` 的 `card` 内加 `"ghostField": []`（第 9 键 → loader 8 键恰等**当场报**，不等 `buildCards()`）；② `GATE`；③ 复原；④ 形态 B —— 在同一席 `card` 内加 `"tools": []`（派生键，若放行会被 `...s` 静默覆盖）；⑤ `GATE`；⑥ 复原；⑦ `Get-ChildItem tools/docgen -Recurse -File` 过滤 `.mjs` / `.json` 后按该词计数
- **预期**：② exit 1、`CardKeySetMismatch` 点席并点多余键 `ghostField`（该码在 loader 第 6 步触发，消费点那一圈不必跑到）；⑤ exit 1、同一码点名被拒的派生键 `tools`（**不得静默覆盖后 exit 0**——该形态若放行，渲染结果与正确数据逐字节相同，V4 抓不到）；③⑥ exit 0；⑦ 注入态计数 ≥1、复原态 = 0
- **判据**：②⑤ `GATE` 各 exit 1 且输出同时含 `CardKeySetMismatch`、席名与对应键名（`ghostField` / `tools`）；③⑥ exit 0；⑦ 注入态 ≥1、复原态 = 0。**两形态都不得只拿 `UnverifiableOutput` 顶替**：`cardPipeline.mjs:91-95` 的 12 键检查只查「缺」不查「多」（多键经 `...own`（`:83`）原样进产物，`buildOne` 只会看到 13 键而不是报码），故本条只能由 loader 的 8 键恰等判死
- **红绿证据**：红 = 「至少 8 键」/「至少 12 键」式判据放过多键（多键在 `buildCards()` 端变成 13 键，若无人判就静默进卡面）；派生键写进 `card` 被 `...s` 覆盖后渲染逐字节相同 → `gate` exit 0；绿 = 两种形态都在 loader 的 8 键恰等处各报同一码
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-015`
- **不覆盖**：`checkItem.returns` 的整条 D16④（归 S-C）

### TC-016 引用存在但值为 `""` / `null` / 全空白 / 非字符串却用于插值 → `EmptySharedValue`（共享值空值码）exit 1

- **覆盖**：spec §10.1 R2 / §10.4-1（R2 的「无悬空」含「指向空」）/ §10.2.3 规则 3 / §10.2.6（`EmptySharedValue`）
- **前置**：`COPY`；被引用的 shared 键存在（`tools/docgen/data/shared.json`）
- **步骤**：① 把被引用段的值改成 `""`；② `REFS`；③ 改为 `null` 再跑；④ 改为 `"   "`（全空白）再跑；⑤ 改为 `["x"]`（数组）但由**片段插值** `${@该键}` 引用，再跑；⑥ 复原后再跑
- **预期**：②③④⑤ 四次均 exit 1，输出含 `EmptySharedValue` 与键名；任何一种都不得 exit 0（空白 / 空值一律不当「合法空段」）；⑥ exit 0
- **判据**：四种注入下 `REFS` 均 exit 1 且输出同时含 `EmptySharedValue` 与键名；⑥ exit 0。四次里任一次 exit 0 → 判失败
- **红绿证据**：红 = 展开器只判「键是否存在」→ 空串被展开成空文本，卡面静默少一句，`GATE` 可能仍绿；绿 = 四种空形态都在装配前被拒
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-016`
- **不覆盖**：整值引用指向数组 / 对象（**合法**，spec §10.2.3 明写「可为字符串 / 数组 / 对象」）——本用例只判「空值与非字符串被插值」这一面

### TC-017 值类型漂移（句子被改成数字）→ `gate` exit 1 `Mismatch`

- **覆盖**：spec §10.1 R9 / §10.4-2；PRD §4 V4 负例
- **前置**：`COPY`；不改任何渲染器
- **步骤**：① 把某席 `card.duty.action`（原本是中文句）改成数字 `1` —— 卡面文本必随之改变；② `GATE`；③ 还原后 `GATE`
- **预期**：① exit 1 且 stderr 首行 `Mismatch:` 点名该席卡；② **不接受**「数字被隐式 `String()` 抹平后 exit 0」：本仓无类型校验码（`validateCardModel.mjs` 只用 `blank()` 归一，不产码），故类型漂移只能靠「渲染字节变化」这一条判死，注入值必须选**渲染会变**的（句子 → `1`）；③ 还原后 exit 0
- **判据**：① `GATE` exit 1 且输出同时含 `Mismatch` 与 `agents/<seat>.md`；③ 还原后 `GATE` exit 0。**只认这两条退出码**；`GATE` exit 0 = 判失败（本条无第二兜底）
- **红绿证据**：红 = 数字被隐式转成 `"1"` 而原句被替换 → 卡面文本漂移但无码（静默改语义）→ 若实现吞掉差异则 exit 0 = 本用例红；绿 = exit 1 + `Mismatch`
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-017`
- **不覆盖**：JSON 解析失败（语法错由 `JSON.parse` 自带报错，无需另立用例）；类型码本身（本仓无此码，若需要须先回 PRD 立码）

### TC-018 改了 `seats/*.json` 未重生成 `agents/*.md` → `gate` exit 1

- **覆盖**：spec §10.1 R9 / §10.4-2；PRD §4 V4 负例（「改任一 `seats/*.json` 值不重生成 → `Mismatch` → exit 1」）
- **前置**：`COPY`
- **步骤**：① 改某席 `duty.action` 一个字；② 直接 `GATE`；③ `node tools/docgen/cli.mjs diff --kind agent --name <seat>`
- **预期**：① exit 1，stderr 含 `Mismatch:` 与 `agents/<seat>.md`；② `diff` 报出非 0 差异行
- **判据**：`GATE` exit 1 且输出同时含 `Mismatch` 与该卡路径；`diff` exit 0 但输出差异行数 > 0（`diff` 只读、不因差异改变退出码这一行为以实测为准，判据取「差异行数 > 0」）
- **红绿证据**：红 = 数据改了却没重生成 → `compareBuffers` 不等（`tools/docgen/cli.mjs:143-144`）；绿 = 重生成后 `GATE` exit 0
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-018`
- **不覆盖**：`docs/agents/**` 投影面（属 `--readme` 面，本段不涉）

### TC-019 `card.duty.trigger` 写回非空串 → 拒载 `TriggerFieldMisplaced` exit 1 并点席

- **覆盖**：spec §10.1 R3 / §10.2.2（`card.duty.trigger` 必须留键、值恒为空串）/ §10.2.10 D-a / §10.4-3 ②（**不引 PRD V12**：V12 是四字段斜杠串计数，spec §10.4-3 已明写不引它）
- **前置**：`COPY`；席文件 `tools/docgen/data/seats/<seat>.json` 里 `card.duty.trigger` 现值为 `""`（空串，spec §10.2.2）
- **步骤**：① 在 `card.duty` 里把 `trigger` 改回非空串 `"<旧 when 句子>"`；② `GATE`；③ 复原为 `""` 后 `GATE`
- **预期**：① exit 1，stderr 含 `TriggerFieldMisplaced` 且点名该席；② 不得 exit 0，不得出现「静默剔除 + 只留 `dropped` 类留痕」；③ 复原后 exit 0
- **判据**：注入态 `GATE` exit 1 且输出同时含 `TriggerFieldMisplaced` 与席名；复原态 exit 0。**「exit 0 + 任何剔除留痕字样」= 判失败**（该分支不许实现，见「不覆盖」）
- **红绿证据**：红 = 现状 `validateAgentData` 不看 `card.duty.trigger`（`tools/docgen/components/validateAgentData.mjs:105` 的 `BASE_KEYS` 只管条目顶层键），数据里写回一份完全不报；绿 = exit 1 + `TriggerFieldMisplaced` + 席名
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-019`
- **不覆盖**：合法值（空串）与注入值逐字相等（TC-004 管）。**反例（不许实现）**：加载期「剔除该字段并留痕」——D-a 明写不取该分支，实现即判失败

### TC-020 `description` 半改态：只改 `CARD_TEXT_FIELDS` 不补 `surfaceTexts` → `/description/` 命中条数 1 → 0（静默空转）

- **覆盖**：spec §10.1 R4（「两处同批改，缺一即静默空转」）；PRD §2 D17
- **前置**：`COPY`；**注入面 = `triggerTable['senior-sdet'].notWhen.text`**（全仓唯一有 `notWhen` 的席，也是唯一「只进 `description`、不进 `duty.trigger`」的面）
- **机理（写清，免得下轮再报）**：`CARD_TEXT_FIELDS` 首项是 `'duty.trigger'`（`tools/docgen/card-model/enums.mjs:87`），`surfaceTexts` 按该序 push（`tools/docgen/card-model/validateCardModel.mjs:102-121`），而 `PointerToElsewhere` 的循环**首个命中即 `break`**（`validateCardModel.mjs:187-193`）；S-A 落地后 `duty.trigger === when`，因此往 `when` 注入只会拿到 `path = duty.trigger`，`/description/` 永不命中——故本用例只能注入 `notWhen.text`
- **步骤**：① 在 `triggerTable['senior-sdet'].notWhen.text` 里写指针词句（如 `详见 §3 的口径`，经 `descriptionOf` 进入 `description`）；② 跑 `validateCardModel` 探针取 `errors`，统计 `path` 命中 `/description/i` 的条数 `c1`；③ 在 `COPY` 内删掉 `surfaceTexts` 的 `description` 分支（模拟半改态）后重跑 ②，得 `c2`；④ 复原 ③
- **预期**：完整态 `c1 ≥ 1` 且 `errors` 含 `PointerToElsewhere`；半改态 `c2 = 0`（**不是**「`errors` 长度 = 0」——`duty.trigger` 等其它面仍可能报其它码，errors 非空不影响本条）；复原后 `c1 ≥ 1`
- **判据**：完整态：`errors` 含 `PointerToElsewhere` 且 `c1 ≥ 1`，探针 exit 0；半改态：`c2 = 0`（同一探针、只看 `/description/i` 的 path 计数），命令 exit 0；复原态 `c1 ≥ 1`。三条都成立才算通过
- **红绿证据**：红 = 只改 `CARD_TEXT_FIELDS` 不加 `surfaceTexts` 分支 → `description` 不进扫描面，`c2 = c1 = 0`（完整态即 0 = 红）；绿 = 完整态 `c1 ≥ 1` 而半改态 `c2 = 0`（这条差值就是判别力）
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-020`
- **不覆盖**：`description` 的派生公式本身（归 `cardPipeline.mjs:59-64`，由 TC-005 逐字节兜底）；`when` 面的违规词（那是 `duty.trigger`，不属本用例）

### TC-021 `description` 命中硬编码数量 / 程序词 → 两个不同码都必须在 `/description/` 上报出

- **覆盖**：spec §10.1 R4；PRD §2 D17（防「只为某一个码特判加分支」）
- **前置**：`COPY`；注入面同样只用 `triggerTable['senior-sdet'].notWhen.text`（机理同 TC-020；`senior-sdet` 是非议会席，故 `ProceduralWordOutsideParliament` 对它适用）
- **步骤**：① `notWhen.text` 写成含 `共 3 条` 的句子（经 `descriptionOf` 进入 `description`）；② 跑 `validateCardModel` 探针；③ 改成含 `收卡` 的句子再跑；④ 复原
- **预期**：① `errors` 含 `HardcodedCount` 且对应 `path` 含 `description`；③ `errors` 含 `ProceduralWordOutsideParliament` 且 `path` 含 `description`；④ 复原后两码均 0
- **判据**：两次探针各命中对应码，且**该条的 `path` 命中 `/description/i`**；任一码未报、或报在别的 path（如 `duty.trigger`）→ exit 1；复原态两码条数 = 0
- **红绿证据**：红 = 只给 `PointerToElsewhere` 加 `description` 分支 → ③ 报 0 码；绿 = 两个不同码都落在 `description` 上
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-021`
- **不覆盖**：`MixedTermInCard` 在 `description` 上的同判（与 ①③ 同一实现点，不另立用例以免重复计正例）

### TC-022 若新增第 9 个 `SCAN_FIELDS` 键（如 `Description`）→ `ESC` exit 非 0

- **覆盖**：spec §10.1 R5 / §10.4-4（键数仍 8）
- **前置**：`COPY`
- **步骤**：① 在 `SCAN_FIELDS` 里新增一个键（值 `['description']`）；② `ESC`；③ 删掉该键后 `ESC`
- **预期**：① exit 非 0，报错文本含 `SCAN_FIELDS` 与「8」；② 复原后 exit 0
- **判据**：注入态 `ESC` exit 非 0 且输出含 `SCAN_FIELDS`；复原态 `ESC` exit 0
- **红绿证据**：红 = 现状 `card-model.test.mjs:1141` 钉 `Object.keys(SF).length === 8`；绿 = 复原后 exit 0
- **对应测试**：`tools/docgen/test/card-model.test.mjs::S1-TC-G09`（既有断言，本段只要求其保留 8 键口径）
- **不覆盖**：`CARD_MODEL_CODES` 36 码零新增（归 S-C 的 V11）

### TC-023 三条冻结断言未同批改写 → `ESC` exit 非 0（改已签件必须落齐）

- **覆盖**：spec §10.1 R5；PRD §5 的 `S1-TC-G09` 行（`:1125` / `:1131` / `:1141`）
- **前置**：R4 已落地（`description` 已进扫描面）
- **步骤**：① `ESC`；② 读 `card-model.test.mjs` 三条断言所在行（`description` 两条的当前口径、`SCAN_FIELDS` 8 键一条），核对是否已按新口径改写；③ `COPY` 内把 `:1125` 那条恢复成 `green(...)` 后再跑 `ESC`
- **预期**：① exit 0；② 两条 `description` 断言不再是 `green`（而是「必报码」口径），8 键断言仍在且值 8；③ 恢复旧口径后 exit 非 0（证明该断言与新口径确实相互约束）
- **判据**：① `ESC` exit 0；③ 注入旧口径后 `ESC` exit 非 0；② 以源码探针（对 `description` 的断言行正则计数 = 2 且不含 `green`）为附加证据
- **红绿证据**：红 = 只改实现不改断言 → `ESC` 在 `:1125`/`:1131` 处红（`green` 期望「不报」，实现已报）；绿 = 三条同批改写后 `ESC` exit 0
- **对应测试**：`tools/docgen/test/card-model.test.mjs::S1-TC-G09`
- **不覆盖**：其余四条（`:74` / `:96-102` / `:163-166` / `sdet-render.test.mjs:21` 三态断言）——那是 S-C 的 D16

### TC-024 policy 删 3 项但不重生成 2 卡 → `gate` exit 1 `Mismatch`

- **覆盖**：spec §10.1 R6；PRD §3 Q8
- **前置**：`COPY`
- **步骤**：① 在 `policy/definitions/paths.mjs` 删 `lessons/`（只删 1 项）；② 不重生成直接 `GATE`；③ 重生成 2 卡后 `GATE`
- **预期**：① exit 1，stderr 含 `Mismatch:` 且点名 `agents/reviewer-audit.md` 与 `agents/detective-observer.md` 中受影响的席（可能只报首个；判据只要求至少点名其中一张）；② 重生成后 exit 0
- **判据**：① `GATE` exit 1 且输出含 `Mismatch` 与 `reviewer-audit` 或 `detective-observer` 之一；③ exit 0
- **红绿证据**：红 = 删 policy 不重生成（现状两卡含 `lessons/`）；绿 = 重生成后 exit 0
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-024`
- **不覆盖**：其余 13 席（它们走 `DEFAULT_BOUNDARY`，不带该清单）

### TC-025 「逐项点名」行三项均 0 命中；「检测限度」段的 `lessons/` 保留、命中数 = 2

- **覆盖**：spec §10.1 R6（删的范围 = 只删 `pathGroups.workspace` 三项；`DETECTION_BLIND_SPOTS` 的 `lessons/` **保留**）；PRD §3 Q8
- **前置**：Q8 已落地；两卡已重生成
- **步骤**：① 取「逐项点名」行原文：`$named = (Select-String -Path agents\*.md -Pattern '逐项点名').Line`；② 在该行内逐值计数：`foreach($w in @('skills-lock.json','lessons/','tools/docgen-spike/.tmp-test/')){ ($named | Select-String -Pattern $w -SimpleMatch).Count }`；③ 全卡 `lessons/` 计数：`(Select-String -Path agents\*.md -Pattern 'lessons/' -SimpleMatch).Count`；④ 全卡「检测限度」行内的 `lessons/` 计数：`((Select-String -Path agents\*.md -Pattern '检测限度').Line | Select-String -Pattern 'lessons/' -SimpleMatch).Count`
- **预期**：② 输出 `0 / 0 / 0`（三项在「逐项点名」行内全部清掉）；③ = `2`（从删前 4 降到 2，**这 2 处属预期保留**：`agents/reviewer-audit.md` 与 `agents/detective-observer.md` 的「检测限度」段，由 `DETECTION_BLIND_SPOTS` 注入）；④ = `2`（与 ③ 相等 → 说明剩下的命中全部落在盲区段，没有一个漏在禁写行）
- **判据**：② 三个数均 = 0；③ = 2 且 ④ = 2；③ 若 > 2 → 有残留落进禁写行（判失败）；③ 若 = 0 → 盲区段被误删（判失败，撞 spec R6）
- **红绿证据**：红 = 现状删前 `skills-lock.json` / `lessons/` / `.tmp-test/` 全卡命中 `2 / 4 / 2`，禁写行内含这三项；绿 = 逐项点名行 `0 / 0 / 0` 且全卡 `lessons/` 恰 2 且都在检测限度行
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-025`
- **不覆盖**：检测盲区里的 `.session/` / `.superpowers/`（那不是禁写清单，`paths.mjs:27` 另有说明）；盲区段是否该整体改版（归 S5-B）

### TC-026 装配顺序 `...s` 前置 → `tools` 被条目覆盖，`TT` 的冻结断言红

- **覆盖**：spec §10.1 R7 负例
- **前置**：`COPY`
- **步骤**：① 在装配模块把对象展开顺序改成 `{ ...s, tools: …, boundary: … }`；② `TT`；③ 复原后 `TT`
- **预期**：① `TT` exit 非 0（`S5-TC-D10` 判「`...s` 必须在 tools 之后」）；② 若条目自带 `tools`，`validateAgentData` 另报 `ToolsViolation`（等价红，二者任一成立即可）
- **判据**：注入态 `TT` exit 非 0；复原态 `TT` exit 0
- **红绿证据**：红 = 现状 `agentData.mjs:295` 正文注释「`...s` 必须在最后 —— 条目自带 tools / boundary 会静默覆盖档位」；绿 = 复原后 exit 0
- **对应测试**：`tools/docgen/test/tool-tiers.test.mjs::S5-TC-D10`
- **不覆盖**：档位表内容（`tiers.mjs`）

### TC-027 `trigger.kind` 写进条目顶层 → `TriggerFieldMisplaced` exit 1

- **覆盖**：spec §10.1 R8 负例；PRD §3 Q5
- **前置**：`COPY`
- **步骤**：① 在 `seats/<seat>.json` 条目顶层加 `"kind": "dispatch"`；② `GATE`；③ 删掉后 `GATE`
- **预期**：① exit 1，stderr 首行 `TriggerFieldMisplaced:` 且点名该席；② 不得静默忽略
- **判据**：注入态 `GATE` exit 1 且输出含 `TriggerFieldMisplaced`；复原态 exit 0
- **红绿证据**：红 = 白名单 `BASE_KEYS`（`validateAgentData.mjs:105`）不含 `kind`；绿 = 复原 exit 0
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-027`
- **不覆盖**：`kind` 取值合法性（S-C 的 V10 四值）

### TC-028 「基线更新」两处同批落盘：`baseline.json` + 2 席 `evidence.json`，缺一即下一次 `replace` 红

- **覆盖**：spec §10.2.7（D-c 细化：两处文件的字段与写入方式 + 末段「两个码各自依赖段」）/ §10.5 第 5 行；PRD §3 Q8
- **前置**：`tools/docgen/baseline.json` 在位；`tools/docgen/fixtures/<seat>.evidence.json` 15 份在位；`tools/docgen/state.json` 15 席全 `replaced`（= `change` 相位；**④ 就用这个相位，不改 `state.json`**）
- **机理（两码归不同段，写清免得再踩）**：`TargetDrift`（`tools/docgen/cli.mjs:534`）要「**盘上 ≠ 渲染**」才有机会触发——`tools/docgen/cli.mjs:525-532` 的幂等分支在 `phase === 'change' && targetBytes.equals(rendered)` 时先 `return 0`；所以既不能让盘上等于渲染，也**不能先清 `state.json`**（清空会被 `tools/docgen/cli.mjs:131-132` 的接管完整性检查截成 `Mismatch: state.json 缺席 <seat>`，不是 `TargetDrift`）。`EvidenceInvalid` 只在 `phase === 'migration'` 分支（`tools/docgen/cli.mjs:483-494`），且该码住 `EXIT` 的 **exit 2** 档（`tools/docgen/components/validateAgentData.mjs:30`）——故 ⑤ 断「exit 非 0」，不写死 1
- **步骤**：① `SHA`：逐席比较 `evidence.renderSha256` 与 `SHA256(agents/<seat>.md)`（hex 大写）；② 对 `reviewer-audit` / `detective-observer` 两张，额外比 `lastWrittenHash`；③ `DATA` 读 `tools/docgen/baseline.json`，断言它只装路径清单（无 `sha256` / `hash` 类字段）；④ **形态 A（`change` 相位，不动 `state.json`）**：`COPY` 内仅在 `agents/reviewer-audit.md` 末尾追加 1 字节，跑 `node tools/docgen/cli.mjs replace --kind agent --name reviewer-audit --draft <该席草稿路径> --yes`；⑤ **形态 C（迁移段）**：`COPY` 内把 `state.json` 写成 `{"version":1,"agents":{}}` **并把** `reviewer-audit.evidence.json` 的 `renderSha256` 改成与草稿不等（64 个 `0`），再跑同一条命令
- **预期**：① 15/15 席 `renderSha256` == 文件哈希；② 2 席 `lastWrittenHash` 同值；③ 路径清单在位且无哈希字段；④ exit **1** 且 stderr 首行 `TargetDrift:`（目标漂移码，`tools/docgen/cli.mjs:534`）——盘中字节 ≠ 渲染 → 跳过幂等分支 → 旧哈希 ≠ `lastWrittenHash`；⑤ exit **非 0**（实测 **2**）且 stderr 首行 `EvidenceInvalid:`（凭证不符码，`tools/docgen/cli.mjs:484`，先于 `collectGate`）
- **判据**：① 探针输出 `sha 15/15`、exit 0；③ 哈希字段命中数 = 0；④ `REPLACE` exit **1** 且输出含 `TargetDrift`；⑤ `REPLACE` exit **非 0** 且输出含 `EvidenceInvalid`（**不写死 1**）。两形态的相位必须如上（④ 保持 `change`、不得清 `state.json`；⑤ 必须迁移段）——写反即分别拿到 `Mismatch: state.json 缺席` 与「不进迁移分支、两码皆空」= 判失败
- **红绿证据**：红 = 重生成卡却不更新 evidence → ① 少于 15/15；红（实测到的两种错构造）= ④ 先清 `state.json` → 报 `Mismatch: state.json 缺席 <seat>`（`tools/docgen/cli.mjs:131-132` 截胡）、⑤ 用 `change` 段 → 不进 `tools/docgen/cli.mjs:483-494`，两码皆空；绿 = ④ 报 `TargetDrift`（exit 1）、⑤ 报 `EvidenceInvalid`（exit 2）；新 SHA 的写入式见 `tools/docgen/cli.mjs:521-527`
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-028`
- **不覆盖**：`baseline.json` 路径清单的具体条目增减（属产物集，由 `GATE` 的 `BaselineDrift` 兜底）；`baseline 38/38` 的打印值（PRD §5：同式自除恒真，不作判据）

### TC-029 `notWhen` 拼接丢失：`senior-sdet` 的 `description` 缺「不用于：…」→ `gate` exit 1

- **覆盖**：spec §10.1 R3（注入实现边界）；PRD §4 V4
- **前置**：`COPY`；`triggerTable['senior-sdet'].notWhen` 在位（`agentData.mjs:322`）
- **步骤**：① 在 `COPY` 内让注入只取 `when`、丢掉 `notWhen` 拼接（改装配点，不改数据）；② `GATE`；③ 复原后 `GATE`
- **预期**：① exit 1 `Mismatch`，`agents/senior-sdet.md` 的 description 行少「；不用于：修改业务代码…」；② 复原后 exit 0
- **判据**：注入态 `GATE` exit 1 且输出含 `senior-sdet`；复原态 exit 0
- **红绿证据**：红 = `descriptionOf` 的 `notWhen` 分支丢失（`cardPipeline.mjs:62-63`）；绿 = 复原 exit 0
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-029`
- **不覆盖**：`notWhen` 的语义是否正确（归 PRD / 既有 `ValidateAgentData` 断言 12）

### TC-030 坏数据在 `import` 期 fail-closed：悬空引用注入后 `import agentData.mjs` 必 exit 1

- **覆盖**：spec §10.2.6 末段（`check-shared-refs.mjs` 不进总门禁的唯一理由 = loader `import` 期 fail-closed）/ §10.5 第 5 行；PRD §4 V5
- **前置**：`COPY`；按 spec §10.2.3 在 `tools/docgen/data/seats/<seat>.json` 内造一处悬空引用 `"@noSuchKey"`
- **步骤**：① `COPY` 内注入；② 在同目录下跑 `node -e "import('./tools/docgen/components/agentData.mjs').then(()=>process.exit(0),e=>{console.error(e.code);process.exit(1)})"`；③ 复原后再跑同一条命令
- **预期**：② **exit 1**（本用例的通过条件就是「该命令非 0」）且 stderr 含码名 `DanglingSharedRef`；不得 exit 0（exit 0 = 说明校验被挪到渲染期，fail-closed 不成立，§10.2.6 末段的裁决随之失效）；③ exit 0
- **判据**：② exit 1 且 stderr 命中 `DanglingSharedRef`；③ exit 0。两次退出码是唯一判据，不看日志措辞
- **红绿证据**：红 = 实现把校验推迟到 `renderCard` / `collectGate` 才做 → `import` 本身成功、exit 0，坏数据全绿（这正是 AI-1-04 指出的「口头保证」）；绿 = `import` 即抛、exit 1 且带码名
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-030`（在 `node --test` 内用 `child_process.spawnSync` 跑上述 `node -e`，断言 `status === 1` 且 stderr 含码名）
- **不覆盖**：各码的具体判定条件（TC-011～TC-016 管）；`REFS` 脚本自身的退出码（`REFS` 是 PRD V5 的验收命令，落点见 §0）

## 3 负例与边界

> 本节与第 2 节的负/边界用例一一对应（20 条，TC-011～TC-030）；条数 20 ≥ 第 2 节的 10 条正例。

| 用例 ID | 边界/负例是什么 | 为什么容易漏 | 期望行为 |
|---|---|---|---|
| TC-011 | 整值 / 片段引用指向不存在的 shared 键 | 渲染期拿到空值是「长得像正常」的失败，最隐蔽（spec §10.5 第 1 行） | 两种写法 `REFS` 均 exit 1 报 `DanglingSharedRef`，点名键与席 |
| TC-012 | 两段互引成环 / 单段自引 | 递归展开 → 栈溢出，错误信息完全跑偏 | 10 秒内报 `NestedSharedRef` exit 1 并点名键（不崩栈、不挂起） |
| TC-013 | 共享段内再引用共享段 / seat 侧 `@a ${@b}` 整值与插值混用 | 容易「只展开一层」后 exit 0，留下 `@` 原文进卡面；混用形态还容易被当「整值 + 追加文本」放行（spec §10.2.3 规则 4 `:103`） | 三种写法都 `NestedSharedRef` exit 1 并点名该键/该席；不许半展开，也不许递归展开到底 |
| TC-014 | 装配后 `card` 少一个键（删 `rationale`） | 缺键检查在 `cardPipeline` 是通用报错、无码 | `CardKeySetMismatch` exit 1，点名缺键与席 |
| TC-015 | 席文件 `card` 多一个键（`ghostField`）/ 写了派生键 `tools` | 多键被忽略（`buildOne` 只查缺键、不查多键）；派生键被 `...s` 静默覆盖后渲染与正确数据逐字节相同（V4 抓不到） | 两种形态都在 loader 的 8 键恰等处各报 `CardKeySetMismatch`；写 `tools` 的形态是派生键拒载的唯一判据 |
| TC-016 | 引用存在但值为 `""` / `null` / `"   "` / 非字符串被插值 | 只判「键在不在」→ 空串展开成空文本，卡面静默少一句 | 四种形态一律报 `EmptySharedValue` exit 1 |
| TC-017 | 句子被改成数字 | 隐式 `String()` 会把语义漂移抹平成「渲染恰好相同」；本仓无类型码可兜 | `GATE` exit 1 且首行 `Mismatch`（无第二兜底） |
| TC-018 | 改数据不重生成 | `gate` 是唯一逐字节防线，漏跑即漂移 | exit 1 `Mismatch` |
| TC-019 | `card.duty.trigger` 写回非空串（第二来源） | 两处「恰好相等」时完全看不出病（PRD 缺陷 6 本体） | 拒载：`TriggerFieldMisplaced` exit 1 点名席；剔除留痕分支判失败 |
| TC-020 | 只改 `CARD_TEXT_FIELDS` 不补 `surfaceTexts` | 改了表、仍然不扫，并且没有任何验收能判出（spec R4 明写）；注入面若用 `when` 只会报 `duty.trigger` | 完整态 `/description/` 命中 ≥1 + 半改态 = 0（差值即判别力） |
| TC-021 | 只给某一个码加分支 | 用单一码验证会放过其余三个文本码 | 两个不同码都落在 `description` 的 path 上 |
| TC-022 | 新增第 9 个 `SCAN_FIELDS` 键 | 「加个键更清楚」是最自然的错误改法 | `ESC` exit 非 0，键数仍 8 |
| TC-023 | 只改实现、不改三条冻结断言 | 断言期望「不扫」，实现已「扫」→ 落地即红，容易被当成实现错 | 三条同批改写后 `ESC` exit 0 |
| TC-024 | 删 policy 不重生成 2 卡 | 2 卡走的是 `boundaryBySeat` 分支（其余 13 席不受影响），容易只跑一张 | `GATE` exit 1 点名 |
| TC-025 | 三项只删两项 / 或把盲区段的 `lessons/` 一起删 | 三项分属不同组（`workspace` 组），漏一项仍会渲染；盲区段那一份属「检测限度」，删它改写另一段语义 | 逐项点名行 `0 / 0 / 0`；全卡 `lessons/` 恰 2（都在检测限度行） |
| TC-026 | `...s` 移到前面 | 条目自带 `tools` 会静默覆盖档位，卡面看不出来 | `TT` exit 非 0 |
| TC-027 | `kind` 写进条目顶层 | 结构「看起来更顺」的写法，且字段位未定死时最容易发生 | `TriggerFieldMisplaced` exit 1 |
| TC-028 | 重生成卡不更新 evidence 哈希 | 下一次 `replace` 才炸，离改动很远；两码还归不同段（④ 要盘上 ≠ 渲染，⑤ 只在迁移段），构造写反就拿不到码 | `sha 15/15` + ④ `TargetDrift`（exit 1）/ ⑤ `EvidenceInvalid`（exit 2） |
| TC-029 | 注入只取 `when` 丢 `notWhen` | 只有 1 席有 `notWhen`，15 席里最易被整体判据放过 | `GATE` exit 1 点名 `senior-sdet` |
| TC-030 | 校验被推迟到渲染期（`import` 期不抛） | `check-shared-refs.mjs` 不进总门禁的唯一理由就是 import 期 fail-closed；挪到渲染期则坏数据全绿 | `import agentData.mjs` exit 1 且 stderr 含码名 |

## 4 回归清单

| 如果改了 | 必须重跑 | 为什么 |
|---|---|---|
| `tools/docgen/data/shared.json` 任一段 | TC-002、TC-003、TC-004、TC-005、TC-011、TC-012、TC-013、TC-016 | 共享段被 15 席引用，一处改动波及全量渲染 |
| 任一 `tools/docgen/data/seats/<seat>.json` | TC-003、TC-005、TC-014、TC-015、TC-018、TC-019 | 三条防线都在装配边界上：席文件 `card` 恰等 8 键（loader，§10.2.5 第 6 步）/ `buildCards()` 产物的 12 键键集恰等（消费点）/ 渲染逐字节 |
| `@` 展开器 / 加载器（`tools/docgen/components/seatLoader.mjs`） | TC-002、TC-003、TC-011～TC-016、TC-019、TC-030 | 展开器是本段唯一新增逻辑点，负例全在它身上；import 期 fail-closed 也在这里（TC-030） |
| `components/cardPipeline.mjs` 的 `CARD_KEYS`（12 键唯一源） | TC-003、TC-005、TC-014、TC-015 | 两段判的唯一源：loader 用它**过滤**出 8 键子集（段 A）、`buildCards()` 用它判 12 键键集恰等（段 B）；它一变，两段与渲染契约同时动 |
| `triggerTable`（含 `kind` 字段位） | TC-004、TC-008、TC-027、TC-029 | `when` 唯一源 + 字段位置 + `notWhen` 拼接三件事共用一处 |
| `CARD_TEXT_FIELDS` 或 `surfaceTexts` 任一处 | TC-009、TC-020、TC-021、TC-022、TC-023 | 两处实现点缺一即空转（spec R4） |
| `card-model.test.mjs` 的 `S1-TC-G09` | TC-009、TC-022、TC-023、TC-010 | 三条冻结断言与扫描面口径互锁 |
| `policy/definitions/paths.mjs` | TC-006、TC-024、TC-025、TC-028，**外加 `tools/docgen/test/policy-pure-source.test.mjs`**（`workspace` 9→6 项、计数 21/22/23→18/19/20，spec §10.2.9 测试侧第 7 处） | 删项 → 2 卡重生成 → evidence 哈希三步连坐；该测试直接 `deepEqual` 了 `pathGroups` 与被展开长度，不改数值即红 |
| `agents/<seat>.md`（重生成后） | **`tools/docgen/test/support/capability-baseline.test.mjs`**（spec §10.2.9 测试侧第 8 处：硬断 `forbiddenPaths.length === 23`；Q8 后当前卡是 20，须改读冻结来源 `tools/docgen/fixtures/capability-baseline.golden.json` 或 `git show <commit>` 的旧卡） | 该测试的名字就是「旧卡 23 项基线」，它读的是**当前卡**——卡一重生成就红，且不许改读当前卡再断言 23 |
| `components/agentData.mjs` 薄壳形态 | **`tools/docgen/test/card-render.test.mjs`**（spec §10.2.9 测试侧第 9 处：`INJECT_BAD` 把语句追加到文件尾，要求模块作用域内有 `agentData` 本地绑定） | 薄壳必须先 `import` 再 `export`；纯再导出会让追加语句 `ReferenceError`，S4 多个用例整片红 |
| 装配末尾的对象展开（`...s` 位序） | TC-007、TC-026、TC-005 | 顺序一乱档位漂，`gate` 与 `TT` 同时会红 |
| 任一 `agents/*.md` | TC-005、TC-006、TC-018、TC-028、TC-029 | 卡是生成物，盘上改动必须能被 `GATE` 抓出 |

## 5 只手动验证

| 项 | 为什么机器验不了 | 谁验、看什么 |
|---|---|---|
| `git stash -u` 回退演练（spec §10.4-5 / PRD §8 S-A 行） | 依赖真实工作区状态（含未跟踪新文件），在测试进程里造不出来；`git checkout -- tools/docgen/` 不删新建文件，残留与否只能看真实工作区 | 施工者：`git stash -u` 后 `node tools/docgen/cli.mjs gate` 回到改前状态；或 `git checkout -- tools/docgen/` 后 `git status --porcelain tools/docgen` 输出为空，再重跑 `gate` |

## 6 不测（带理由）

| 不测什么 | 为什么 |
|---|---|
| `renderCard` 的排版细节（列宽、换行、段序） | spec §10.5 明写属 S-C；本段只以「逐字节不变」兜（TC-005） |
| `policy` 内容语义（哪三项该删、为什么） | 属 PRD Q8 的 ② 段裁定，已裁定；本段只验删后产物（TC-006/024/025） |
| `git stash -u` 回退演练 | spec §10.5 明写「只手动验证」，登记在 §5 |
| `trigger.kind` 四值校验与非议会席只许 `need`（PRD V10 整条） | spec §10.1 R8 只留字段位、§10.6 明写四值与卡面渲染归 S-C；本段只验字段位置（TC-008/027） |
| `baseline 38/38` 是否等于 38 | PRD §5 / spec R9：同一表达式自除自的常量打印，恒真，不作判据（`tools/docgen/cli.mjs:102`、`tools/docgen/cli.mjs:228`） |
| `checkItem.returns` 计数的 D16④ 整条 | 归 S-C 的 V11；本文件只在 TC-015 借它作「多余顶层键」的交叉证据 |
| `description` 的派生公式（`when` + `notWhen` 拼接形态） | 实现细节不拘（`cardPipeline.mjs:59-64`），本段只判结果：TC-004 等比 + TC-005 逐字节 + TC-029 缺 `notWhen` 即红 |
| **V12 斜杠串清零**（`PRD/spec/plan` 式文案从 `when` 里消失） | spec §10.2.8 明写：本段**不改** `when` 文案（注入后原样进 `duty.trigger`，要保 V4 逐字节不变），清零归 S-C 的 D3；本段只判「两面同一源」（TC-004 / TC-019） |

## 7 缺口与判别力水位

| 缺口 | 漏检哪类反例 | 至少 1 个样例 | 语义由谁兜 |
|---|---|---|---|
| `trigger.kind` 的第五个取值在本段无人拦 | S-C 迟迟不开工时，数据里出现第五个 `kind` 而全仓仍绿 | `COPY` 内给某席 `triggerTable.kind = "fifth"` 跑 `GATE`（本段预期 exit 0 = 已知缺口） | spec §10.7 已点名；S-C 的 V10 兜 |
| `@` 展开的「纯函数」只由两次等比证明，不是代数性质证明 | 依赖环境变量 / 时间 / `Math.random()` 的隐蔽副作用（两次同进程可能同值） | TC-002 ③ 的跨进程比较 | TC-002 ③ 跨进程即兜；无更多本段可测手段 |

**判别力水位**：正例 10 条全部能红（每条都给了「改坏即红」的构造）；负/边界 20 条**全部单分支判死**——TC-013 由 spec §10.2.3 规则 1 与 §10.2.10 D-b 钉死为「拒绝嵌套」、TC-019 由 D-a 钉死为「拒载」、TC-014/TC-015 少键·多键·派生键三种形态都断在同一码 `CardKeySetMismatch`（loader 的 8 键恰等处，spec §10.2.5 第 6 步）、TC-030 只认 `import` 退出码，20 条中已无「未定口径故只能判不许静默」的条目。TC-020 的判别力靠「完整态 `/description/` 命中 ≥1 + 半改态 = 0」两面对照；TC-017 只留 `Mismatch` 一条（本仓无类型码，第二兜底已删）。

**真缺口计数**：上表剩 2 行（`trigger.kind` 第五值、纯函数两次等比）。`REFS` 与门禁的接线已由 spec §10.2.6 末段定死——**不建第二个门禁入口**：loader 在 `import` 期即 fail-closed，`agentData.mjs` 的 29 处 `import` 保证「数据坏了必有一次 import 抛错」→ 门禁自然红；该脚本只作 PRD V5 的验收命令与施工期定点复核，故不在缺口表。

## 附：给开发的建议（A-1～A-5 均已有 spec §10.2 的答复）

| # | 建议（原提法） | 触发用例 | 处置（已采纳写结论，未决写解法） |
|---|---|---|---|
| A-1 | 开工前把 spec §10.2 填实（键切分表 / `@` 语法 / 加载器与校验器的文件名与落点） | TC-001、TC-007、TC-011～TC-016 | **已采纳（spec §10.2.1–10.2.6）**：落点 = `tools/docgen/data/shared.json` + `tools/docgen/data/seats/<seat>.json`；加载器 = `components/seatLoader.mjs`；校验器 = `check-shared-refs.mjs`；`@` 语法见 §10.2.3；四个新码见 §10.2.6（含 `CardKeySetMismatch`）。本文件命令已按该落点改写，无需再替换 |
| A-2 | 给「数据里残留 `duty.trigger`」定一条处置口径 | TC-019 | **已采纳为「拒载」（spec §10.2.10 D-a）**：非空串 → `TriggerFieldMisplaced` exit 1 并点席；「加载期剔除并留痕」不取，实现即判失败 |
| A-3 | 「基线更新」未指到具体文件 | TC-028 | **已采纳（spec §10.2.7）**：两处同批 —— `tools/docgen/baseline.json`（`cli baseline --write`）+ `fixtures/<seat>.evidence.json` 的 `renderSha256` / `lastWrittenHash`；阈值锚 `tools/docgen/cli.mjs:484`（`EvidenceInvalid`）/ `tools/docgen/cli.mjs:521-527`（写新 SHA）/ `tools/docgen/cli.mjs:534`（`TargetDrift`） |
| A-4 | 共享段嵌套引用（多层 `@`）未声明 | TC-013 | **已采纳为「不支持」（spec §10.2.10 D-b）**：`shared.json` 值内再现 `@` 或 `${@` → `NestedSharedRef` exit 1；不另写递归环检测（§10.2.3 规则 1） |
| A-5 | **（新）** `check-shared-refs.mjs` 与门禁的接线 | TC-011～TC-016 | **已采纳（spec §10.2.6 末段）**：**不建第二个门禁入口** —— loader 在 `import` 期即 fail-closed，`agentData.mjs` 的 29 处 `import` 保证数据坏了必有一次抛错 → 门禁自然红；该脚本只作 PRD V5 的验收命令与施工期定点复核，不进 `npm run check` 的独立段 |

## 修订说明（轮次 2，`2026-11-03`）

**一句话**：本轮只把「按 §10.2 未定口径写」的**落点 / `@` 语法 / 错误码 / 基线两处**收紧到已定口径；用例数 29、10 正 / 19 负、七节结构、每条五要素（覆盖 / 前置 / 步骤 / 预期 / 判据 / 红绿证据 / 对应测试 / 不覆盖）全部未变。

### R2-1 用例改动（11 条）

| 用例 | 改前 | 改后（依据） |
|---|---|---|
| TC-001 | 全仓 `Get-ChildItem -Recurse -Directory -Filter seats` | 限定 `tools\docgen\data`；15 个文件名去扩展名 = 席名；新增第 ⑤ 步「`shared.json` 键集恰 3 键」（spec §10.2.1 / §10.2.2 D-d） |
| TC-007 | 装配点指 `agentData.mjs:295` | 改指 `tools/docgen/components/seatLoader.mjs`，并加断言「薄壳内不得再有该装配表达式」（spec §10.2.5 第 5 步） |
| TC-011 | 引用写成 `@shared.<键>` 式点号写法；判据只判「exit 1 点名」 | 按 spec §10.2.3 的两种形态（整值 `^@[a-z][A-Za-z0-9]*$` / 片段 `${@<key>}`）各造一次；判据断言 `DanglingSharedRef` + 键 + 席 |
| TC-012 | 判「环检测报错」（`cycle` 字样） | 单分支：共享段内造环 → 前置拒绝 `NestedSharedRef`；**保留**「10 秒内返回、不得栈溢出/挂起」（该用例的真实价值） |
| TC-013 | 两分支（支持嵌套 / 不支持嵌套） | 单分支：`NestedSharedRef` exit 1 并点键；「递归展开到底」列为**不许实现**的反例 |
| TC-014 | 注入未写落点 | 落点 = `tools/docgen/data/seats/<seat>.json` 的 `card`（8 键内，§10.2.2） |
| TC-015 | 注入写在「席文件顶层」 | 改写在 `card` 内第 9 键（→ 展开后 13 键），并修正预期/判据的编号歧义 |
| TC-016 | `""` / `null` / 全空白三形态 | 加第四形态「非字符串却用于插值」；判据断言 `EmptySharedValue` |
| TC-017 | 判据含「或…或…」两条含混表述 | 拆成三条，全部断在退出码上；明确「`GATE` exit 0 且无任何报码 = 不接受」 |
| TC-019 | 两分支（拒载 / 加载期剔除留痕） | 单分支：`card.duty.trigger` 写回非空串 → `TriggerFieldMisplaced` exit 1 点席；剔除留痕 = 判失败 + 反例 |
| TC-028 | 只比 evidence 哈希 | 两处文件：`tools/docgen/baseline.json`（路径清单）+ 2 席 `evidence.json`；两注入分别断 `TargetDrift`（`tools/docgen/cli.mjs:534`）/ `EvidenceInvalid`（`tools/docgen/cli.mjs:484`） |

### R2-2 §6 / §7 / 附 的删改

- **§6 不测**：**增 1 行** —— V12 斜杠串按 spec §10.2.8 登记为「本段不改 `when` 文案（要保 V4 逐字节不变），清零归 S-C 的 D3」；其余 7 行未动。
- **§7 缺口**：**删 3 行**（「spec §10.2 尚未填」「`duty.trigger` 处置未定」「嵌套是否允许 / 深度上限」）；**保留 2 行**（`trigger.kind` 第五值无人拦、纯函数只由两次等比证明）；新增过的 `REFS` 接线那一行已在轮次 3 删去（spec §10.2.6 末段定死为「不建第二个门禁入口」）。判别力水位改写为「19 条负/边界全部单分支判死，已无『未定口径故只能判不许静默』的条目」。
- **附**：A-1～A-4 从「待处置建议」改为「**已采纳** + 采纳结论」（A-1 → §10.2.1–10.2.6；A-2 → 拒载 + `TriggerFieldMisplaced`；A-3 → §10.2.7 两处同批；A-4 → 不支持嵌套 + `NestedSharedRef`）；**新增 A-5**（`REFS` 接线；轮次 3 已由 spec §10.2.6 末段定死为「不建第二个门禁入口」）。

### R2-3 自检（本轮实跑，仓根 PowerShell 5）

| # | 命令 | 输出（首行/关键数） | 结论 |
|---|---|---|---|
| 1 | `node tools/docgen/cli.mjs gate` | `baseline 38/38`，`EXIT=0` | exit 0 —— 本轮未改代码，门禁仍绿 |
| 2 | `(Select-String -Path docs\superpowers\specs\2026-11-03-s-a-data-layer-design-testcase.md -Pattern '^### TC-' -AllMatches).Count` | `29` | 用例数未变 |
| 3 | ID 集合比较（§1 vs §2 vs §3，按 `^\| TC-\d{3}` / `^### TC-` 取） | `S1=29 S2=29 S3=19`；`DIFF12=0`；`S2_MINUS_S3=TC-001…TC-010` | §1 与 §2 差集为空；§3（只装负/边界）⊆ §2，差集恰 10 条 = 全部正例（与 `POS=10 NEG=19` 一致） |
| 4 | `$L|Select-String -Pattern '<任务书禁用词>'`（该词为「两分支择一」的俗写，此处不复述） | `BANNED=0` | 文件内无该禁用词残留 |

### R2-4 本席必答（`senior-sdet` 一定会 1–5）

| # | 判定 | 证据（path:line，均含所引摘句） | reason |
|---|---|---|---|
| 1 | hit | `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md:93`（「整值引用：字符串**整体**匹配 `^@[a-z][A-Za-z0-9]*$`」）、`docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md:100`（「`shared.json` 的任何字符串值内**不得再出现** `@` 或 `${@`」）、`tools/docgen/cli.mjs:484`（「if (evidence.renderSha256 !== sha256Hex(rendered))」） | 结论 3 条、来自 3 个文件，且已写回正文：`@` 语法落在 TC-011/TC-013 的前置、嵌套拒绝落在 TC-012/TC-013 判据、两处基线落在 TC-028 步骤④⑤ |
| 2 | hit | 同上三条 path:line 均存在、且该行含上表所引摘句；`tools/docgen/cli.mjs:534`（「if (oldSha !== evidence.lastWrittenHash) fail('TargetDrift'」）亦在位 | 引句与源行逐字对得上，可复算 |
| 3 | hit | 新增的四个错误码首现行均带中文释义（`DanglingSharedRef`（悬空引用码）／`NestedSharedRef`（共享段嵌套引用码）／`EmptySharedValue`（共享值空值码）／`CardKeySetMismatch`（卡片键集不符码））；`TargetDrift`（目标漂移码）／`EvidenceInvalid`（凭证不符码）在 TC-028 首现行加释义 | 本轮新增术语未解释计数 = 0；文件内既有码名（`Mismatch` / `CARD_KEYS` / `SCAN_FIELDS`）是 spec 定义名，本轮未新增、未改含义 |
| 4 | hit | 本文件正文 —— **全过、无问题**（findings 集合为空） | 本轮改的是口径对齐，未留下未处置发现 |
| 5 | hit | 本文件附录（附 A-1～A-5）—— **全过、无问题**（findings 集合为空） | A-5 已由 spec §10.2.6 末段答复（不建第二个门禁入口），不是本文件缺陷 |

**本轮修订后已无登记歧义（0 项）**：上一轮登记的「`check-shared-refs.mjs` 是否进 `npm run check`」已由 spec `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md` §10.2.6 末段裁决 —— 不进独立门禁段，**不建第二个门禁入口**：loader 在 `import` 期即 fail-closed，`agentData.mjs` 的 29 处 `import` 保证数据坏了必有一次抛错 → 门禁自然红；该脚本只作 PRD V5 的验收命令与施工期定点复核。

## 修订说明（轮次 3，`2026-11-03`）

**一句话**：收议会第 1 轮 8 张 testcase 侧卡。用例 **29 → 30**（新增 TC-030），正例 10 / 负例+边界 **20**；七节结构、五要素、用例 ID 连续（TC-001…TC-030）全部保持。

### R3-1 逐项处置（对任务书 1–8）

| # | 卡 | 处置 |
|---|---|---|
| 1 | F1（RD-1-01 / AU-1-01 / QA-1-02） | TC-006 的 23→20 口径限定在**「逐项点名」那一行**（`reviewer-audit.md:96` / `detective-observer.md:78`）；TC-025 重写为两半判据：逐项点名行三项 `0 / 0 / 0`，全卡 `lessons/` 恰 **2** 且都落在「检测限度」行（删前实测 `2 / 4 / 2`），`0` = 盲区被误删、`>2` = 有残留漏进禁写行，两头都判失败 |
| 2 | QA-1-01 | TC-020 / TC-021 注入面改为 `triggerTable['senior-sdet'].notWhen.text`（`tools/docgen/components/agentData.mjs:322` 是全仓唯一 `notWhen`），也是唯一「只进 `description`、不进 `duty.trigger`」的面；并在用例里写清机理（`enums.mjs:87` 首项 `duty.trigger` + `validateCardModel.mjs:187-193` 首个命中即 `break`）。TC-020 判据改为「完整态 `/description/` 命中 `c1 ≥ 1`、半改态 `c2 = 0`」，不再用「`errors` 长度 = 0」 |
| 3 | QA-1-03 | TC-017 删掉类型码兜底（本仓无类型码，`validateCardModel` 只用 `blank()` 归一）；注入值改为「中文句 → 数字 `1`」（渲染必变），判据只留 `GATE` exit 1 + 输出含 `Mismatch` |
| 4 | QA-1-04 | §0 新增 `REPLACE` 代号：`node tools/docgen/cli.mjs replace --kind agent --name <seat> --draft <草稿路径> --yes`（`--draft` 缺 = `DraftNotFound`、`--yes` 缺 = `NotAuthorized`，`tools/docgen/cli.mjs:458`）；TC-028 步骤④⑤ 写全参数，预期改为「stderr 首行 `TargetDrift:` / `EvidenceInvalid:`」 |
| 5 | AI-1-04 | **新增 TC-030**：注入 `"@noSuchKey"` 后子进程 `import ./tools/docgen/components/agentData.mjs` 必 exit 1 且 stderr 含 `DanglingSharedRef`；复原后 exit 0。通过条件就是「该命令非 0」 |
| 6 | AI-1-05 | TC-007 删掉「等价物」式措辞，钉死四条：`tools:\s*toolsForSeat\(\s*s\.name\s*\)` 命中恰 1、`...s` 在其后且距离 < 400 字符、`boundaryBySeat` 夹在两者之间、薄壳 `agentData.mjs` 命中 0；并注明 `S5-TC-D10`（`tools/docgen/test/tool-tiers.test.mjs:706-712`）的 `readRepo` 目标随施工改到 `seatLoader.mjs` |
| 7 | BE-1-02 / BE-1-05 / QA-1-05 | TC-003 的 12 键改为 `import { CARD_KEYS }`（`cardPipeline.mjs:23`，不再手写字面）+ 第二份名单探针 `secondList 0`；TC-014（少键）/ TC-015（多键）判据改断 `CardKeySetMismatch`；TC-015 增第二形态 `card` 里写 `"tools": []`（派生键会被 `...s` 静默覆盖、V4 抓不到，只能靠该码） |
| 8 | AI-1-03 / AI-1-02 / RD-1-07 | TC-005③ 基线取数钉到文件锚：`git show HEAD:agents/<seat>.md` 的 SHA256 与 `tools/docgen/fixtures/<seat>.evidence.json` 的 `renderSha256` 须逐席相等；TC-004 覆盖列 `PRD V12 → PRD D17 + §10.4-3 ①`（TC-019 覆盖列同改——同一错配，一并收）；§1 覆盖核对把 `V11②` 改为只承接 `V11①` |

### R3-2 自检（本轮实跑，仓根 PowerShell 5）

| # | 命令 | 输出（关键数） | 结论 |
|---|---|---|---|
| 1 | `node tools/docgen/cli.mjs gate` | `baseline 38/38`，`GATE_EXIT=0` | exit 0 |
| 2 | `(Select-String -Path docs\superpowers\specs\2026-11-03-s-a-data-layer-design-testcase.md -Pattern '^### TC-' -AllMatches).Count` | `30` | 与新增 TC-030 一致 |
| 3 | ID 集合比较（§1 / §2 / §3） | `S1=30 S2=30 S3=20`；`DIFF12=0`；`S2_MINUS_S3=TC-001…TC-010`；`POS=10 NEG=20` | §1=§2；§3 ⊆ §2 且差集恰 10 条 = 全部正例 |
| 4 | 三条禁用措辞（任务书列出的那三串，此处不复述）逐条全文 `Select-String` | 各 `0` | 无残留 |
| 5 | `npm run check` | `# tests 1405`、`# fail 0`、`check 全部通过`、`CHECK_EXIT=0` | 未改代码，测试全绿；`[observable]` 未豁免命中 0 |

### R3-3 本席必答（`senior-sdet` 一定会 1–5）

| # | 判定 | 证据（path:line，均含所引摘句） | reason |
|---|---|---|---|
| 1 | hit | `tools/docgen/card-model/enums.mjs:87`（「'duty.trigger',」）、`tools/docgen/card-model/validateCardModel.mjs:191`（「break;」，在 `187-193` 的 `PointerToElsewhere` 循环内）、`tools/docgen/components/agentData.mjs:322`（「notWhen: { text: '修改业务代码…' }」）、`tools/docgen/policy/definitions/paths.mjs:27`（「DETECTION_BLIND_SPOTS = ['.session/', '.superpowers/', 'lessons/']」） | 结论 4 条、来自 3 个不同文件，均已写回正文：注入面落 TC-020/021 前置、`lessons/` 保留落 TC-006/025、单层拒绝落 TC-012/013 |
| 2 | hit | 同上四条 path:line 均存在且含所引摘句；`tools/docgen/cli.mjs:458`（「if (!args.yes) fail('NotAuthorized', {})」）与 `tools/docgen/test/tool-tiers.test.mjs:706`（「readRepo('tools/docgen/components/agentData.mjs')」）亦在位 | 引句与源行逐字对得上，可复算 |
| 3 | hit | 本轮新增的唯一码名 `CardKeySetMismatch`（卡片键集不符码）在 §1 首现行即带中文释义；其余（`DanglingSharedRef` / `EmptySharedValue` / `NestedSharedRef` / `TargetDrift` / `EvidenceInvalid`）沿用轮次 2 已加的释义 | 本轮新增术语未解释计数 = 0 |
| 4 | hit | 本文件正文 —— **全过、无问题**（findings 集合为空） | 8 项处置全部落在用例正文，无未处置发现 |
| 5 | hit | 本文件附录（附 A-1～A-5）—— **全过、无问题**（findings 集合为空） | 附录无需改动：A-1～A-5 已是已采纳结论 |

**分歧**：0 条 —— 8 张卡逐条与源码核对后均成立（`duty.trigger` 位首、`notWhen` 唯一性、无类型码、`replace` 必填 `--draft`/`--yes`、`readRepo` 目标、`DETECTION_BLIND_SPOTS` 保留、`CARD_KEYS` 未导出、基线无文件锚），故全部照改，无「不成立」条目。

## 修订说明（轮次 4，`2026-11-03`）

**一句话**：收议会第 2 轮 2 项 —— TC-028 ④⑤ 改为**按段构造**（QA-R2-01），文末 spec 行号随 spec 修订重核（审计 P2）；用例 30 条、10 正 / 20 负、七节结构不变。

### R4-1 QA-R2-01：TC-028 ④⑤ 不可达 → 改按「迁移段 + 三样摆好」构造

| 项 | 改前（不可达） | 改后 |
|---|---|---|
| ④ `TargetDrift` | 起点假设为 `change` 相位，只改 `lastWrittenHash` 再跑 `replace` | **（本行已被轮次 5 更正）** 当时写成「迁移相位 + 清 `state.json`」；实测该路走不通（见 R5-1 形态 A） |
| ⑤ `EvidenceInvalid` | 同上一路（`change` 段根本不进 `tools/docgen/cli.mjs:483-494` 分支） | 迁移段 + 把该席 `evidence.json` 的 `renderSha256` 改成与草稿不等 → 跑 `REPLACE` → 预期输出含 `EvidenceInvalid:`（**exit 非 0**，实测 2；轮次 5 已把判据从「非 0」收紧为「非 0 且不写死 1」） |

**机理已写进用例正文**：`EvidenceInvalid` 只在 `phase === 'migration'` 分支（`tools/docgen/cli.mjs:483-494`）；`TargetDrift`（`tools/docgen/cli.mjs:534`）排在幂等分支（`tools/docgen/cli.mjs:525-532`）之后，触发条件是「**盘上 ≠ 渲染**」——幂等分支只在 `change` 且盘上 == 渲染时先 `return 0`，所以构造 ④ 既不能清 `state.json`、也不能让盘上等于渲染（详见 R5-1）。

### R4-2 审计 P2：spec 行号重核

`R2-4` 表的两条 S-A spec 引用随 spec 修订移位，已改：旧 `:84` → **`:93`**（10.2.3 整值引用行）、旧 `:89` → **`:100`**（10.2.3 规则 1）。逐条核过（按行号取行，均含所引摘句）：

| 文件:行 | 该行实际内容（首段） | 判定 |
|---|---|---|
| `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md:93` | 「整值引用 / 字符串**整体**匹配 `^@[a-z][A-Za-z0-9]*$`（如 `"@dutyConstraintDefault"`）」 | 与所引摘句一致 |
| `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md:100` | 「1. `shared.json` 的任何字符串值内**不得再出现** `@` 或 `${@` → `NestedSharedRef`」 | 与所引摘句一致 |
| `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md:89` | 「`seatEntry.card` / S1 `Card` **12 键**齐（`seat` / `name` / `description` / `tools` / …）」 | 另一份 spec，仍为 12 键；无需改 |

漂移引用命中：S-A spec 的旧锚点 `:84` / `:89` 按全名扫 = **0**；本文件另有 1 次「`:89`」命中，属上表第三行那份 2026-10-29 spec 的 12 键表（已核在位），与本轮漂移无关。

### R4-3 顺带（已做）：§4 回归清单加一行

`policy/definitions/paths.mjs` 那一行补「外加 `tools/docgen/test/policy-pure-source.test.mjs`（`workspace` 9→6 项、计数 21/22/23→18/19/20）」，理由锚 spec §10.2.9 测试侧第 7 处。

### R4-4 自检（本轮实跑）

| # | 命令 | 输出 | 结论 |
|---|---|---|---|
| 1 | `node tools/docgen/cli.mjs gate` | `baseline 38/38`，`GATE_EXIT=0` | exit 0 |
| 2 | `^### TC-` 计数 | `TC_HEAD=30`；`POS=10 NEG=20` | 30 条不变，负+边界 ≥ 正例 |
| 3 | spec 行号核对（见 R4-2 表） | 三行内容均与所引摘句一致 | 通过 |
| 4 | 漂移引用扫描（按 S-A spec 全名） | 旧 `:84` = 0、旧 `:89` = 0 | 通过 |

### R4-5 本席必答（`senior-sdet` 一定会 1–5）

| # | 判定 | 证据 | reason |
|---|---|---|---|
| 1 | hit | `tools/docgen/cli.mjs:525`（幂等分支起点 `if (phase === 'change' && targetBytes.equals(rendered))`）与 `tools/docgen/cli.mjs:534`（`if (oldSha !== evidence.lastWrittenHash) fail('TargetDrift'`） | 结论 2 条、来自同文件两处独立锚点；已写回 TC-028 的「机理」与步骤④⑤（`tools/docgen/acceptance/replace-scenarios.mjs` 实测 9/11 红，属既有债，**不作正例**） |
| 2 | hit | 同上两处 path:line 均存在且含所引摘句；`docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md:145`（「但这两个码各自依赖「段」…」）亦在位 | 引句与源行逐字对得上，可复算 |
| 3 | hit | 本轮未引入新术语（`TargetDrift` / `EvidenceInvalid` 已在 TC-028 首现行带中文释义） | 未解释术语计数 = 0 |
| 4 | hit | 本文件正文 —— **全过、无问题**（findings 集合为空） | 2 项处置均落到用例正文 |
| 5 | hit | 本文件附录（附 A-1～A-5）—— **全过、无问题**（findings 集合为空） | 附录无需改动 |

## 修订说明（轮次 5，`2026-11-03`）

**一句话**：只改 TC-028 ④⑤ 的构造（第 3 轮复核 QA-R3-01）——④ 回到**形态 A**（`change` 相位 + 盘上追加 1 字节），⑤ 保持**形态 C**（迁移段 + `renderSha256` 不等，判据改「exit 非 0，实测 2」）；引用的「正例」从 `replace-scenarios.mjs` 撤下。用例仍 30 条。

### R5-1 三分支实测结论（测试席在副本上跑出，本轮采信）

| 形态 | 构造 | 结果 | 归因（源码行） |
|---|---|---|---|
| A ✅ | `change` 相位（`state.json` 15 席全 `replaced`，**不动**）+ `agents/<seat>.md` 末尾追加 1 字节 + `replace` | `exit 1`，首行 `TargetDrift:` | 盘上 ≠ 渲染 → 跳过 `tools/docgen/cli.mjs:525-532` 幂等分支 → `tools/docgen/cli.mjs:534` 旧哈希 ≠ `lastWrittenHash` |
| B ❌ | 迁移段 + 清空 `state.json` | `exit 1`，`Mismatch: state.json 缺席 <seat>` | `tools/docgen/cli.mjs:131-132` 的接管完整性检查先截胡（轮次 4 写的就是这一路，故不可达） |
| C ✅ | 迁移段（**`state.json` 须同时置 `{"version":1,"agents":{}}`**）+ `renderSha256` 置 64 个 `0` | `exit 2`，首行 `EvidenceInvalid:` | `tools/docgen/cli.mjs:484` 的 `migration` 分支先于 `collectGate`；该码住 `EXIT` 的 exit 2 档（`tools/docgen/components/validateAgentData.mjs:30`） |

**用例改动**：④ 改形态 A（判据 = exit 1 且含 `TargetDrift`）；⑤ 保持形态 C、判据改「exit 非 0 且含 `EvidenceInvalid`」（**不写死 1**）；机理栏改成正确方向（`TargetDrift` 要盘上 ≠ 渲染；`EvidenceInvalid` 只在迁移段）；红绿证据补「清 `state.json` → 报 `Mismatch:`」这一实测错构造。**不再引 `tools/docgen/acceptance/replace-scenarios.mjs:116-125` 作正例**（该脚本实测 9/11 红，属既有债）。

### R5-2 自检（本轮实跑）

| # | 命令 / 动作 | 输出 | 结论 |
|---|---|---|---|
| 1 | `node tools/docgen/cli.mjs gate` | `baseline 38/38`，`GATE_EXIT=0` | exit 0 |
| 2 | `^### TC-` 计数 / 正负 | `TC_HEAD=30`；`POS=10 NEG=20` | 30 条不变，负+边界 ≥ 正例 |
| 3 | 读 `tools/docgen/cli.mjs:131-132` | 131 行 = `if (!Object.prototype.hasOwnProperty.call(state.agents, a.name)) {`；132 行 = `drifts.push({ code: 'Mismatch', path: 'state.json', message: 'state.json 缺席 <席名>…' })` | 与用例「清 `state.json` → `Mismatch:`」对得上 |
| 4 | 读 `tools/docgen/cli.mjs:483-494` | `  if (phase === 'migration') {` 起、`    if (evidence.renderSha256 !== sha256Hex(rendered)) {` … `  }` 止 | 与「`EvidenceInvalid` 只在迁移段」对得上 |
| 5 | 读 `tools/docgen/cli.mjs:525-532` | `  if (phase === 'change' && targetBytes.equals(rendered)) {` … `    return 0;` / `  }` | 与「盘上 == 渲染 → 幂等返回」对得上 |
| 6 | 读 `tools/docgen/cli.mjs:534` | `  if (oldSha !== evidence.lastWrittenHash) fail('TargetDrift', { name, path: target });` | 与形态 A 的 `exit 1` 对得上 |

### R5-3 本席必答（`senior-sdet` 一定会 1–5）

| # | 判定 | 证据 | reason |
|---|---|---|---|
| 1 | hit | `tools/docgen/cli.mjs:525`（幂等分支起点）与 `tools/docgen/cli.mjs:534`（`fail('TargetDrift'`）；`tools/docgen/components/validateAgentData.mjs:30`（`EvidenceInvalid` 在 exit 2 档） | 结论 3 条、来自 2 个文件；已写回 TC-028 的机理/步骤/判据 |
| 2 | hit | 同上三处 path:line 均存在且含所引摘句（R5-2 第 5/6 行给出原行首） | 引句与源行逐字对得上，可复算 |
| 3 | hit | 本轮未引入新术语（`TargetDrift` / `EvidenceInvalid` 已在 TC-028 首现行带中文释义） | 未解释术语计数 = 0 |
| 4 | hit | 本文件正文 —— **全过、无问题**（findings 集合为空） | 唯一改动已落到 TC-028 |
| 5 | hit | 本文件附录（附 A-1～A-5）—— **全过、无问题**（findings 集合为空） | 附录无需改动 |

## 修订说明（轮次 6，`2026-11-03`）

**一句话**：收 S-A plan 门审计 **P0**（判据错位）——「`card` 全量 12 键的恰等断言」从 loader / `agentData[i].card` 改判到 `buildCards()` 产物，loader 只判「席文件 `card` 恰等 **8** 键 + 派生四键拒载」；同批收 `@` 混用**规则 4**（`@` 开头但不整体匹配 `^@key$` → `NestedSharedRef`）。用例 **30 条不变**、类型分布 **正 10 / 负+边界 20 不变**、七节结构不变；判据强度**只收紧不平移**（两段都断「双向差集均空」，未出现 `ok(长度)`、未出现「≥」、未删「恰等」）。

### R6-1 逐项处置（改了哪几处 / 为什么 / spec 行号）

| # | 位置（改后行号） | 改前 | 改后 | 依据 |
|---|---|---|---|---|
| 1 | TC-003 标题 / 覆盖 / 前置 / 步骤 / 预期 / 判据 / 红绿（`:101-113`） | 单段判：`Object.keys(agentData[i].card)` 须与 12 键集合**恰等** | **两段判**：段 A `agentData[i].card` 恰等 **8** 键（= `CARD_KEYS` 去 `seat` / `name` / `description` / `tools`）+ 四派生键命中 0；段 B `buildCards()[i].card` 与 **12** 键集合恰等（`CARD_KEYS` 唯一源）；① 给一条可直接粘贴的取证命令（`import` 两模块 → 逐席双向差集 → 打印 5 个计数 + exit code） | spec §10.1 R2 `:20`（P0-1 实测改判）；§10.2.5 第 6 步 `:128`；§10.2.6 `:133`·`:135`；§10.4-1 `:198` |
| 2 | TC-003 ③ 第二份名单探针 | 只查 12 键字面 | 保留（`secondList 0`），并补「loader 的 8 键子集必须由 `CARD_KEYS` **过滤**得到，不得自写 8 键字面」 | 同上 + §10.2.9 `:162` |
| 3 | TC-015 覆盖 / 前置 / 步骤① / 预期 / 判据 / 红绿（`:236-245`） | 「第 9 键 → 展开后 13 键」 | 「第 9 键 → loader 8 键恰等**当场报**，不等 `buildCards()`」；覆盖列改指 loader 的 8 键恰等（12 键面转指 TC-003 段 B）；判据补「两形态不得只拿 `UnverifiableOutput` 顶替——`buildOne` 只查缺、不查多」 | spec §10.1 R2 `:20`；§10.2.2 `:84`；§10.2.5 第 6 步 `:128`；`cardPipeline.mjs:83` / `:91-95` |
| 4 | TC-013 覆盖 / 步骤 / 预期 / 判据 / 红绿 / 不覆盖（`:214-223`） | 两种写法（shared 侧整值 `"@Y"` / 插值 `${@Y}`） | **三种写法**：ⅰ ⅱ 保留 shared 侧两形态（规则 1 `:100`），ⅲ 新增 **seat 侧** `"@cardRationaleHead ${@cardRationaleTail}"` 混用（规则 4 `:103`）；覆盖列去掉旧口径措辞 | spec §10.2.3 规则 4 `:103` + §10.2.4 `:111-112` |
| 5 | TC-012 前置 / 步骤② / 判据（`:206-209`） | 路线没写明 | 明确「取数路线必须是加载器 / 校验器（`REFS` 或 import 加载器触发的临盘校验），**不得**对纯函数 `expandRefs` 单点断言」；判据补「只认 `REFS` 的退出码与输出，纯函数单测绿不能代替本条」 | 任务书第 4 条；spec §10.2.3 规则 1 `:100` + §10.2.4 `:109-117` |
| 6 | §0 口径声明（`:28-29`） | 12 键只写唯一源；8 键只写 `SCAN_FIELDS` | 12 键补「判据落点 = `buildCards()` 产物，不在 loader」；8 键拆两条（① `SCAN_FIELDS` 键数；② `agentData[i].card` = `CARD_KEYS` 去派生四键，实测 15/15 席恰 8 键） | spec §10.2.5 `:128`；本轮实测 `Object.keys(agentData[0].card)` |
| 7 | §1 覆盖总表 4 行（TC-003 / TC-013 / TC-014 / TC-015；**行数不变 30 行**） | TC-003 泛引 R2；TC-014 / 015 只写「第 6 步」 | TC-003 = 两段判 + 判定面③ 住 `buildCards()` + V5 键齐面；TC-014 = loader 段的缺键面；TC-015 = loader 段的多键 / 派生键面；TC-013 补规则 4 与执行路线 | 同 1–5 |
| 8 | §3 两行（TC-013 / TC-015） | 旧表述 | TC-013 补混用形态；TC-015 改「都在 loader 的 8 键恰等处」 | 同 3–4 |
| 9 | §4 两行（`seats/*.json` 行 / `CARD_KEYS` 行） | 「12 键与逐字节两条防线」 | 三条防线写明：loader 8 键 / 消费点全量 12 键 / 渲染逐字节；`CARD_KEYS` 行写「loader 过滤出 8 键子集 + `buildCards()` 判全量 12 键」 | 同 1 |
| 10 | §7 判别力水位（`:484`） | 「TC-014 / TC-015 双形态」 | 「少键·多键·派生键三种形态，断在 loader 的 8 键恰等处」 | 同 3 |

### R6-2 未改什么（逐条给理由）

- **TC-011**（悬空引用，规则 2）：与键集两段判无关；`DanglingSharedRef` 的触发面是「键不存在」，且本例已走 `COPY` + `REFS` 路线 → 一字未动。
- **TC-016**（空值，规则 3）：第四形态「数组用于插值」属规则 3；规则 4 管「形态非法」不管「值空」，两者不同码，不并入 → 一字未动。
- **TC-014**（少键）：席文件 `card` 少一个键**本来就在** loader 第 6 步报 `CardKeySetMismatch`，与改判后口径一致（标题「装配后」即 spec §10.2.5 第 6 步的原词）→ 正文一字未动。
- **TC-001 / 002 / 004–010、TC-017–TC-030**：与键集两段判、`@` 规则 4 均无关 → 一字未动（TC-028 的轮次 5 结论保持）。
- **文末 R2 / R3 / R4 / R5 修订说明**：属历史记录，**不改**（改了即重写历史）；其中「第 9 键 → 展开后 13 键」等旧表述由本节 R6-1 第 3 行明确取代。
- **不动 spec / plan / PRD / 源码 / `gate-record.md`**：本轮只改本文件。

### R6-3 自检（本轮实跑，仓根 PowerShell 5）

| # | 命令 / 动作 | 输出 | 结论 |
|---|---|---|---|
| 1 | `node tools/docgen/cli.mjs gate` | `baseline 38/38`、`GATE_EXIT=0` | 未改代码，门禁仍绿 |
| 2 | `^### TC-` 计数 + 正/负两列计数 | `TC_HEAD=30`；`POS=10`；`NEG=20` | 条数与类型分布不变 |
| 3 | ID 集合比较（§1 / §2 / §3） | `S1=30 S2=30 S3=20`；`DIFF12=0`；`S2_MINUS_S3=TC-001…TC-010` | §1 = §2；§3 ⊆ §2 且差集恰 10 条正例 |
| 4 | TC-003 ① 的粘贴命令（现状态实跑） | `CARD_KEYS 未导出`、`PROBE_EXIT=1` | 红绿证据的「红」实锤：`CARD_KEYS` 未 `export` → 探针按唯一源缺失 exit 1 |
| 5 | 段 B 判面单独对照（临时代入 12 键字面，**不进本文件**） | `consumed12 15/15` | 消费点确实 15/15 席恰 12 键——施工后段 B 应为绿 |
| 6 | `Object.keys(agentData[0].card)` | `counts 8`、`duty/scenes/signals/must/never/categories/checkItems/rationale` | 段 A 的 8 键口径与实测一致（15/15 席同值） |
| 7 | 读 `cardPipeline.mjs:23-24` / `:82-90` / `:91-95` | `const CARD_KEYS = [...12 项]`（未 `export`）/ `buildOne` 派生 `seat`·`name`·`description`·`tools` / 缺键循环只报 `UnverifiableOutput`、不查多键 | 两段判的源码依据在位 |
| 8 | `npm run check` | `# pass 1399`、`# fail 4`、`[observable]` 未豁免命中 0 行；4 条 fail 全在 `scope-sweep` 段（`OCR-S1-TC-F08` / `S4-TC-J04` / `S2-TC-G01` / `S3-TC-K04`） | 未改代码，4 条红均属本批改判的 R8 口径账（见下条），与本文件改动无因果 |
| 9 | `node scripts/scope-sweep.mjs --check` | `I31=11 > 基线 10`；`清单缺口径 I31/I32/I33`；`清单缺文件：2026-11-03-s-a-data-layer-design.md, 2026-11-03-s-a-data-layer.md` | **本文件对 I31 / I32 / I33 词表的命中已清零（`I31=0 I32=0 I33=0`，本轮为此改了 8 处措辞）**；余下红项落在 spec（7）/ plan（4）/ PRD（1），需在当次 `impact-sheet.md` 登记 → 不属本席改动范围，已随本报告转主 agent |

### R6-4 本席必答（`senior-sdet` 一定会 1–5）

| # | 判定 | 证据（path:line，均含所引摘句） | reason |
|---|---|---|---|
| 1 | hit | `tools/docgen/components/cardPipeline.mjs:23-24`（「const CARD_KEYS = ['seat', 'name', 'description', 'tools', …]」，未 `export`）、`tools/docgen/components/cardPipeline.mjs:82-90`（`const card = { ...own, seat: entry.name, name: entry.name, description: descriptionOf(entry.name), tools: toolsForSeat(entry.name), … }`）、`tools/docgen/components/cardPipeline.mjs:91-95`（`if (card[k] === undefined) … UnverifiableOutput`，只查缺不查多） | 结论 3 条、来自 1 个文件的 3 处独立锚点；已写回 TC-003 前置 / 红绿与 TC-015 判据（两段判的落点与「多键无人判」的根因） |
| 2 | hit | 同上三处 path:line 均存在且含所引摘句；另 `docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md:128`（「`seats/<seat>.json` 的 `card` 键集**恰等 8 键**」）、`:135`（「③ `buildCards()` 15 席 `card` 键集…（`CARD_KEYS` 唯一源）」）、`:103`（「以 `@` 开头但不整体匹配 `^@key$`」）逐行核过 | 引句与源行逐字对得上，可复算 |
| 3 | hit | 本轮未引入新术语（`CardKeySetMismatch`（卡片键集不符码）/ `NestedSharedRef`（共享段嵌套引用码）/ `DanglingSharedRef` / `EmptySharedValue` 均沿用在先释义） | 未解释术语计数 = 0 |
| 4 | hit | 本文件正文 —— **全过、无问题**（findings 集合为空） | 10 项处置全部落到用例正文与对应表 |
| 5 | hit | 本文件附录（附 A-1～A-5）—— **全过、无问题**（findings 集合为空） | 附录无需改动：A-1 / A-4 的结论与规则 4 新口径不冲突（A-4 判的是「不支持嵌套」，规则 4 判的是「混用形态同码」） |

