# 测试用例：S-A 数据层（`agentData` 拆 JSON + `when` 唯一源）

> 归属 spec：`docs/superpowers/specs/2026-11-03-s-a-data-layer-design.md`（split from `docs/prd/20261102212627-card-data-contract-and-proof/index.md` 2026-11-03）
> 编写者：`senior-sdet`（实例标识 `senior-sdet@s-a-data-layer-testcase-20261103-01`）｜**独立性声明**：本文件由 `senior-sdet` 在**全新上下文**编写，编写者 ≠ spec 作者（`main-agent@20261103-s-a-spec`），≠ 后续施工者；编写者只读 spec / PRD / 既有实现，未参与 spec 撰写，也未参与本段施工。
> 状态：草稿（**定稿 = 每条用例五要素齐全，且覆盖总表与 spec 验收项一一对应**）｜最后更新：`2026-11-03`
> 命名与落点：按 `spec-testcase-gate` 判据 1（与 spec 同目录；文件名 = spec 文件名去掉 `.md` 后 + `-testcase.md`）。

## 0 判据约定（全表复用，避免每条重写命令）

所有命令在**仓根**执行，Shell = PowerShell 5；`exit` 指命令退出码。

| 代号 | 命令 | 备注 |
|---|---|---|
| `GATE` | `node tools/docgen/cli.mjs gate` | spec R9 唯一验收命令；`exit 0` + stdout 末行 `baseline N/N` |
| `CHECK` | `npm run check` | 门禁总入口；②.5 段内部再跑一次 `GATE` |
| `REFS` | `node tools/docgen/check-shared-refs.mjs` | PRD V5 定名的引用完整性校验器（脚本名由 PRD 定，落点见「附：给开发的建议」A-1） |
| `ESC` | `node --test tools/docgen/test/card-model.test.mjs` | 承载 `S1-TC-G09` 三条冻结断言的文件 |
| `TT` | `node --test tools/docgen/test/tool-tiers.test.mjs` | 承载 `...s` 置末（`S5-TC-D10`）与档位 `FROZEN` 断言的文件 |
| `COPY` | 仓副本注入坏值 | 用既有支撑 `tools/docgen/test/support/dev-workflow-checks.mjs` 的 `withRepoCopy(dst => …)`；**不得在真仓就地注入** |
| `PROBE` | `node -e "<inline>"` | 从 `tools/docgen/components/agentData.mjs` 读 `agentData` / `triggerTable`（既有公开入口，拆 JSON 后须保留） |
| `SHA` | `node -e "<inline>"` | 15 席 `evidence.renderSha256` 与 `SHA256(agents/<seat>.md)` 逐席比对 |

**口径声明**（本文件出现的数字，全部可复算）：
- 15 席 = `(Get-ChildItem agents -File).Count`；
- 12 键 = `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md:89` 那一行列出的键集；
- 8 键 = `tools/docgen/card-model/enums.mjs:95-104` 的 `SCAN_FIELDS` 键数；
- 卡面禁写项 23 = `agents/reviewer-audit.md` 中「逐项点名：」至「；兜底句」之间按 `、` 切分（实测 23），删 Q8 的 3 项后 = 20。

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目 | 层级 | 正/负 | 判据类型 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|
| TC-001 | 10.1 R1 / PRD D12·Q7 | 集成 | 正 | 机器 | 文件系统计数 + `PROBE` | P0 |
| TC-002 | 10.1 R2（纯函数）/ PRD D12 | 单元 | 正 | 机器 | `PROBE` 二次展开比对 | P0 |
| TC-003 | 10.1 R2 / 10.4-1 / PRD V5 | 单元 | 正 | 机器 | `PROBE` 键集断言 | P0 |
| TC-004 | 10.1 R3 / PRD D17·V12 | 单元 | 正 | 机器 | `PROBE` 逐席等比 | P0 |
| TC-005 | 10.1 R9 / 10.4-2 / PRD V4 | e2e | 正 | 机器 | `GATE` | P0 |
| TC-006 | 10.1 R6 / PRD Q8 | 集成 | 正 | 机器 | `GATE` + 项数计数 | P0 |
| TC-007 | 10.1 R7 | 单元 | 正 | 机器 | 源码结构探针 | P1 |
| TC-008 | 10.1 R8 / PRD Q5 | 单元 | 正 | 机器 | `PROBE` 键位置断言 | P1 |
| TC-009 | 10.1 R5 / 10.4-4 / PRD D17 | 单元 | 正 | 机器 | `PROBE` + `ESC` | P0 |
| TC-010 | PRD V3（回归）/ 10.4-2 | e2e | 正 | 机器 | `CHECK` | P1 |
| TC-011 | 10.1 R2 / 10.4-1 / PRD V5 | 单元 | 负 | 机器 | `COPY` + `REFS` | P0 |
| TC-012 | 10.1 R2 / 10.4-1 / PRD V5 | 边界 | 负 | 机器 | `COPY` + `REFS` | P0 |
| TC-013 | 10.1 R2（展开算法边界） | 边界 | 负 | 机器 | `COPY` + `REFS` | P2 |
| TC-014 | 10.1 R2 / 10.4-1 / PRD V5 | 单元 | 负 | 机器 | `COPY` + `REFS` | P0 |
| TC-015 | 10.1 R2 / PRD V5·V11① | 边界 | 负 | 机器 | `COPY` + `REFS` | P1 |
| TC-016 | 10.1 R2（空值不当兜底） | 边界 | 负 | 机器 | `COPY` + `REFS` | P0 |
| TC-017 | 10.1 R9 / 10.4-2 / PRD V4 | 边界 | 负 | 机器 | `COPY` + `GATE` | P0 |
| TC-018 | 10.1 R9 / 10.4-2 / PRD V4 | 集成 | 负 | 机器 | `COPY` + `GATE` | P0 |
| TC-019 | 10.1 R3 / 10.4-3 / PRD V12 | 单元 | 负 | 机器 | `COPY` + `GATE` | P0 |
| TC-020 | 10.1 R4 / PRD D17 | 单元 | 负 | 机器 | `COPY` 半改态 + 行为探针 | P0 |
| TC-021 | 10.1 R4 / PRD D17 | 单元 | 负 | 机器 | `COPY` + `ESC` 断言 | P0 |
| TC-022 | 10.1 R5 / 10.4-4 | 边界 | 负 | 机器 | `COPY` + `ESC` | P1 |
| TC-023 | 10.1 R5 / PRD §5 `S1-TC-G09` 行 | 集成 | 负 | 机器 | `ESC` | P0 |
| TC-024 | 10.1 R6 / PRD Q8 | 集成 | 负 | 机器 | `COPY` + `GATE` | P0 |
| TC-025 | 10.1 R6 / PRD Q8 | 边界 | 负 | 机器 | 逐项计数（三值各一） | P0 |
| TC-026 | 10.1 R7 | 边界 | 负 | 机器 | `COPY` + `TT` | P0 |
| TC-027 | 10.1 R8 / PRD Q5 | 单元 | 负 | 机器 | `COPY` + `GATE` | P1 |
| TC-028 | 10.5（policy 删项后「基线更新」）/ PRD Q8 | 集成 | 负 | 机器 | `SHA` | P1 |
| TC-029 | 10.1 R3 / 10.4-3 / PRD V4 | 边界 | 负 | 机器 | `COPY` + `GATE` | P1 |

**覆盖核对**：spec 验收项共 18 条 = §10.1 R1–R9（9 条）+ §10.4 硬约束 1–4（4 条）+ 本段引用的 PRD 锚点 V4 / V5 / V10 / V11② / V12 两面（5 条）。本表覆盖 18 条（17 条全量 + **V10 部分**：只覆盖「`kind` 字段位」一面，四值校验归 S-C，见 §6）；未覆盖 0 条。§10.4-5（回退演练）按 spec §10.5「只手动验证」登记在 §5，不计入机器覆盖。

## 2 用例明细

### TC-001 数据源按席拆成 15 份 `seats/<seat>.json` + 1 份 `shared.json`

- **覆盖**：spec §10.1 R1；PRD §2 D12 / §3 Q7
- **前置**：拆 JSON 已落地；仓根存在 `seats/` 目录（路径前缀由 plan 依 §10.2 定，本用例只钉「唯一 seats 目录 + 15 份 + 席名逐字」）
- **步骤**：① `(Get-ChildItem -Recurse -Directory -Filter seats).Count`；② `(Get-ChildItem -Recurse -File -Filter seats\*.json).Count` 与文件名清单；③ `(Get-ChildItem -Recurse -File -Filter shared.json).Count`；④ `PROBE` 取 `agentData` 的 `name` 集，与 ② 的 `<seat>.json` 取主名集做集合比较
- **预期**：① = 1（全仓只有一个 seats 目录）；② = 15 且文件名去扩展名后与 `agentData` 席名集**逐字相等**（不多席不少席）；③ = 1；无 `seats/` 之外的散落席数据文件
- **判据**：上述四条中 ①②③ 计数命令 exit 0 且数值分别 = 1 / 15 / 1，④ 集合差集大小为 0
- **红绿证据**：红 = 现状 `(Get-ChildItem -Recurse -Directory -Filter seats).Count` → `0`（数据仍在 `tools/docgen/components/agentData.mjs` 字面里）；绿 = 1 个 seats 目录、15 份 `<seat>.json`、1 份 `shared.json`
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-001`（文件名由 plan 定稿，用例 ID 不变）
- **不覆盖**：键在 `shared.json` 与 `seats/*.json` 之间如何切分（spec §10.2 未填，见「附：给开发的建议」A-1）

### TC-002 `@` 展开是装配前一次性纯函数：同一输入两次展开结果逐字节相等

- **覆盖**：spec §10.1 R2（「装配前一次性纯函数」）；PRD §2 D12
- **前置**：`agentData.mjs` 仍导出 `agentData`（公开入口不变）
- **步骤**：① `PROBE` 在同一进程内 `JSON.stringify(agentData)` 两次（两次之间不改任何输入）；② `PROBE` 在两次之间记录 `shared.json` 的 SHA256 与文件长度；③ 另起一个进程再取一次 `agentData`，与前一次比较
- **预期**：① 两次字符串逐字节相等；② 展开前后 `shared.json` 的 SHA256 与长度不变（展开器不就地改写共享段）；③ 跨进程结果与进程内结果逐字节相等（无时间/随机/环境依赖）
- **判据**：`PROBE` 输出三种比较均为 `true`，命令 exit 0；任一为 `false` 则 exit 1
- **红绿证据**：红 = 展开器把 `shared.json` 对象引用直接塞进结果、再被后续装配就地改写 → 第二次 `JSON.stringify` 与第一次不等（`false`）；绿 = 三次结果全等且 `shared.json` 哈希不变
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-002`
- **不覆盖**：展开器的内部算法（只判外部可观察的两条：确定性 + 无副作用）

### TC-003 展开后每席 12 键齐、键名逐字、无多余键

- **覆盖**：spec §10.1 R2 / §10.4-1；PRD §4 V5；键名唯一源 `docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md:89`
- **前置**：同 TC-002
- **步骤**：① `PROBE` 逐席取 `Object.keys(card)` 的键数；② 与 12 键字面集（`seat / name / description / tools / duty / scenes / signals / must / never / categories / checkItems / rationale`）做集合比较；③ 对 15 席逐席重复 ①②
- **预期**：15 席每席键数 = 12；键集与 12 键字面集**恰等**（既不多也不少）；无 `undefined` 值的顶层键
- **判据**：`PROBE` 断言 `15/15` 席 `keys.length === 12` 且集合恰等，exit 0；差集非空或任一席键数 ≠ 12 → exit 1 并打印该席名与差集
- **红绿证据**：红 = 现状 `cardPipeline.mjs:23-24` 的 `CARD_KEYS` 只在装配末尾查「缺键」（`undefined` 即报），多键不报；拆 JSON 时多带一个 `role` 会静默通过 → 断言不等；绿 = 12 键恰等 15/15
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-003`
- **不覆盖**：各键内部结构合法性（由 `validateCardModel` 既有码覆盖，本段不改）

### TC-004 `duty.trigger` 装配期注入后与 `triggerTable.when` 逐字相同（15/15）

- **覆盖**：spec §10.1 R3；PRD §2 D17 / §4 V12
- **前置**：`when` 唯一源 = `triggerTable.when`；`agentData` 与 `triggerTable` 均可从 `agentData.mjs` 取到
- **步骤**：① `PROBE` 逐席比较 `card.duty.trigger === triggerTable[seat].when`；② 反向断言：`agentData` 中不再有「第二份 trigger 字面」作源（即改 `triggerTable[seat].when` 一个字符后 `duty.trigger` 跟着变，`COPY` 内只改 `when`）
- **预期**：① 15/15 逐字相等（含尾随「时」的有无必须一致）；② 只改 `when` 时 `duty.trigger` 随之改变，无任何席保留旧值
- **判据**：① `PROBE` 输出 `same 15/15`、exit 0；② `COPY` 内改一席 `when` 后同一探针输出 `same 15/15` 且该席值等于新 `when`（证明注入真实生效，不是两份恰好相等）
- **红绿证据**：红 = 现状靠「两处恰好逐字相同」维持：`agentData.mjs` 的 `cardOf` 第 3 参数（如 `:79`、`:112`）与 `triggerTable[...].when`（如 `:303`、`:307`）各写一遍，改一处即不等；绿 = 只改 `when` 后两者仍 15/15 相等
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-004`
- **不覆盖**：`notWhen` 的拼接（TC-029 专管）；`description` 渲染形态（TC-005 逐字节兜底）

### TC-005 拆 JSON 后 15 席 `disk == render` 逐字节相等、`gate` exit 0

- **覆盖**：spec §10.1 R9 / §10.4-2；PRD §4 V4
- **前置**：`agents/*.md` 已按新数据源重生成（不是手工改）；`baseline 38/38` **不作判据**（PRD §5：同式自除恒真）
- **步骤**：① `GATE`；② 对 15 席逐席 `node tools/docgen/cli.mjs diff --kind agent --name <seat>`；③ 记录 15 席卡面 SHA256 与冻结基线（PRD §8）比对
- **预期**：① exit 0 且 stdout 末行为 `baseline N/N`；② 15 席全部输出「差异 - 0 / + 0」；③ 15 席 SHA256 与拆 JSON 前记录的基线**逐席相等**（除 Q8 涉及的 2 席，其变化必须只落在禁写清单那一段）
- **判据**：① `GATE` exit 0；② 15/15 席 `diff` exit 0 且含「差异 - 0 / + 0」；③ 13 席 SHA256 不变、2 席 diff 只出现在边界段行
- **红绿证据**：红 = 拆 JSON 时字段顺序变化 → `Mismatch` exit 1（`tools/docgen/cli.mjs:143-144` 逐席 `compareBuffers`）；绿 = exit 0 + 15/15 逐字节
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-005`
- **不覆盖**：`renderCard` 的排版细节（spec §10.5 明写属 S-C）

### TC-006 policy 删 3 项后 2 张卡重生成、禁写项 23 → 20，`.gitignore` 兜底句仍在

- **覆盖**：spec §10.1 R6；PRD §3 Q8
- **前置**：`tools/docgen/policy/definitions/paths.mjs` 已删 `skills-lock.json`、`lessons/`、`tools/docgen-spike/.tmp-test/` 三项
- **步骤**：① `Select-String agents\reviewer-audit.md -Pattern '逐项点名'` 取该行，按 `、` 切分「逐项点名：」至「；兜底句」之间的项并计数；② 对 `agents\detective-observer.md` 重复 ①；③ 两卡该行包含 `兜底句：凡 `.gitignore` 覆盖的路径一律视为禁止写入。`；④ `GATE`
- **预期**：① ② 两卡项数均 = 20（= 删前 23 − 3）；③ 兜底句逐字在位；④ exit 0（两卡已重生成）
- **判据**：①② 计数命令 exit 0 且两卡均 `20`；③ `Select-String -Pattern '兜底句' -SimpleMatch` 两卡各 ≥1 命中；④ `GATE` exit 0
- **红绿证据**：红 = 现状两卡项数实测 23（`agents\reviewer-audit.md` 该行按 `、` 切分）；只删 policy 不重生成 → `GATE` `Mismatch` exit 1；绿 = 20 / 20、兜底句在位、`GATE` exit 0
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-006`
- **不覆盖**：policy 内容语义（哪三项该删属 ② 段 Q8 裁定，已裁定）；其余 13 席边界段不变（TC-005 ③ 兜底）

### TC-007 装配顺序不变：`...s` 必须置末且恰一处

- **覆盖**：spec §10.1 R7（`agentData.mjs:294` 注释为硬约束、`:295` 为唯一实现）
- **前置**：装配层（原 `agentData.mjs` 末尾的 `.map(...)`，拆 JSON 后落在加载器/装配模块）
- **步骤**：① 在装配模块源码中定位 `toolsForSeat(` 与 `boundaryBySeat` 的对象展开点；② 统计 `...s`（或等价的「条目整体展开」）出现次数与相对位置
- **预期**：条目整体展开**恰 1 处**且位于 `tools` 与 `boundary` 之后（条目自带 `tools` / `boundary` 处于「覆盖档位」的位序 = 交付缺陷）
- **判据**：源码探针输出 `expand 1 @ after tools/boundary`（正则命中数 = 1 且索引大于 `toolsForSeat(` 与 `boundaryBySeat` 两者的索引），exit 0；命中数 ≠ 1 或位置在前 → exit 1。运行时等价判据 = `TT` exit 0（其 `S5-TC-D10` 已钉同一形态）
- **红绿证据**：红 = `COPY` 内把条目展开提前 → `TT` 的 `S5-TC-D10` 断言「`...s` 必须在 tools 之后」exit 非 0；绿 = 现状 `agentData.mjs:295` 形态：`{ tools: …, ...(boundary…), ...s }`，`TT` exit 0
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

### TC-011 悬空引用：指向不存在的 shared 键 → 校验器 exit 1 并点名

- **覆盖**：spec §10.1 R2 / §10.4-1；PRD §4 V5
- **前置**：`COPY`；按 spec §10.2 定的 `@` 语法，把某一席对共享段的引用改成指向 `shared.json` 中**不存在**的键
- **步骤**：① `COPY` 内改 1 处引用为不存在的键名（如 `@shared.<不存在的键>`）；② 跑 `REFS`；③ 复原后再跑一次作对照
- **预期**：① `REFS` exit 1，输出含**该不存在的键名**与**引用它的文件/席**；② 不得静默展开成空值后继续（不得 exit 0）；③ 复原后 exit 0
- **判据**：`REFS` exit 1 且 stdout/stderr 同时含键名与文件名（两个字符串各 ≥1 命中）；复原场景 `REFS` exit 0
- **红绿证据**：红 = 现状无校验器（`REFS` 不存在，命令 exit 非 0 且提示模块找不到）；绿 = 坏引用 exit 1 点名、复原 exit 0
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-011`
- **不覆盖**：渲染期是否报错（本段要求的是**装配前**报错，渲染期报错已太晚）

### TC-012 环引用：共享段 A ↔ B 互引 → 校验器 exit 1（不得栈溢出/死循环）

- **覆盖**：spec §10.1 R2 / §10.4-1；PRD §4 V5（「无环」）
- **前置**：`COPY`；`shared.json` 中至少两段可被 `@` 引用
- **步骤**：① 在 A 段内加对 B 的引用、B 段内加对 A 的引用；② 跑 `REFS`（设 10 秒超时）；③ 去掉 A 段那一条引用后再跑
- **预期**：① `REFS` 在超时内 exit 1，输出点名环上的键（不得 `Maximum call stack` 崩溃、不得挂起）；② 验证错误是**环检测**而非偶发异常
- **判据**：`REFS` exit 1，且输出含 `cycle` 或环上两个键名之一；命令在 10 秒内返回；去环后 exit 0
- **红绿证据**：红 = 展开器递归无环检测 → 进程栈溢出（exit ≠ 1 或超时）；绿 = 指名环、快速失败
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-012`
- **不覆盖**：自环（单段引用自己）——并入本用例同一判据，作为 ① 的第二形态（`A` 引用 `A`）各跑一次

### TC-013 嵌套引用边界：共享段内再引用共享段

- **覆盖**：spec §10.1 R2（展开算法边界；spec 未声明是否允许多层）
- **前置**：`COPY`
- **步骤**：① 在 `shared.json` 的 X 段里写一个对 Y 段的引用；② 跑 `REFS`；③ 再让某席引用 X，跑 `GATE`
- **预期**：二选一且**行为须显式**——(a) 支持嵌套：`REFS` exit 0 且该席展开后 X 段内容已含 Y 的展开结果（探针 `PROBE` 断言字符串含 Y 的内容）；(b) 不支持嵌套：`REFS` exit 1 并报「不支持嵌套引用」。**不许**出现「exit 0 但 Y 未被展开」的静默半展开
- **判据**：`REFS` + `PROBE` 输出落在 (a) 或 (b) 之一；出现「exit 0 且 X 段里的引用字符串原样残留」→ exit 1
- **红绿证据**：红 = 静默半展开（`X` 里留着 `@shared.Y` 原文却 exit 0）；绿 = (a) 展开到底 或 (b) 明示拒绝
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-013`
- **不覆盖**：嵌套深度上限（spec 未定，登记在 §7 缺口）

### TC-014 展开后少一个顶层键（删 `rationale`）→ exit 1，点名缺的键

- **覆盖**：spec §10.1 R2 / §10.4-1；PRD §4 V5「少一个顶层键 → exit 1」
- **前置**：`COPY`
- **步骤**：① 在某一席的 `seats/<seat>.json` 里删掉 `rationale`；② `REFS`；③ 复原后 `REFS` 对照
- **预期**：① exit 1，输出点名缺失键 `rationale` 与席名；② 不得退化成渲染期缺键才报（`cardPipeline.mjs:91-94` 的 12 键检查属第二道，不得作为唯一防线）
- **判据**：`REFS` exit 1 且输出含 `rationale` 与席名；复原后 exit 0
- **红绿证据**：红 = 只靠 `CARD_KEYS` 检查 → 报码时机在装配末尾而非展开校验，`REFS` exit 0（缺 12 键齐的机器判据）；绿 = `REFS` 先报
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-014`
- **不覆盖**：键值内容合法性（归 `validateCardModel`）

### TC-015 展开后多一个顶层键（加 `returns`）→ exit 1，且与 V11① 的 `returns` 探针一致

- **覆盖**：spec §10.1 R2（12 键 = 恰等）；交叉 PRD §4 V11①（`tools/docgen` 内 `returns` 计数 = 0）
- **前置**：`COPY`
- **步骤**：① 在某一席 `seats/<seat>.json` 顶层加 `"returns": []`；② `REFS`；③ `Get-ChildItem tools/docgen -Recurse -File` 过滤 `.mjs` / `.json` 后 `Select-String -Pattern 'returns'` 计数
- **预期**：① exit 1，点名多余键；② 计数 = 0（本用例注入后必须 ≥1，证明 V11① 有判别力；复原后 = 0）
- **判据**：注入态 `REFS` exit 1 且 `returns` 计数 ≥1；复原态 `REFS` exit 0 且计数 = 0
- **红绿证据**：红 = 「至少 12 键」式判据放过多键（多键会被渲染器忽略或悄悄进卡面）；绿 = 恰等 12 键
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-015`
- **不覆盖**：`checkItem.returns` 的整条 D16④（归 S-C）

### TC-016 引用存在但值为空串 / `null` → exit 1，不得当空值兜底

- **覆盖**：spec §10.1 R2 / §10.4-1（R2 的「无悬空」含「指向空」）
- **前置**：`COPY`；被引用的 shared 键存在
- **步骤**：① 把被引用段的值改成 `""`；② `REFS`；③ 改为 `null` 再跑；④ 复原后再跑
- **预期**：① ② 两次均 exit 1，点名该键与「空值」；③ 不得 exit 0（空白/空值一律不当「合法空段」）；④ 复原后 exit 0
- **判据**：`REFS` 在 `""` 与 `null` 两种注入下均 exit 1，输出含键名；复原 exit 0
- **红绿证据**：红 = 展开器只判「键是否存在」→ 空串被展开成空文本，卡面静默少一句，`GATE` 可能仍绿；绿 = 空值在装配前被拒
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-016`
- **不覆盖**：全空白字符串（`"   "`）——并入本用例 ① 作第三形态

### TC-017 值类型漂移（字符串被改成数字）→ `gate` exit 1 `Mismatch`

- **覆盖**：spec §10.1 R9 / §10.4-2；PRD §4 V4 负例
- **前置**：`COPY`；不改任何渲染器
- **步骤**：① 把某席某文本字段改成数字（如 `constraint: 1`）；② `GATE`；③ 还原后 `GATE`
- **预期**：① exit 1 且 stderr 首行 `Mismatch:` 点名该席卡；② 类型漂移不得被隐式 `String()` 抹平到「渲染恰好相同」（若渲染相同则不报，但此时应有一条校验器报类型错，二者必居其一）
- **判据**：① `GATE` exit 1 且输出含 `Mismatch` 与 `agents/<seat>.md`；或（渲染未变时）`REFS`/校验器 exit 1 且报类型；③ 还原后 `GATE` exit 0
- **红绿证据**：红 = 数字被隐式转成 `"1"` 且无任何报码（静默改语义）；绿 = exit 1 有码
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-017`
- **不覆盖**：JSON 解析失败（语法错由 `JSON.parse` 自带报错，无需另立用例）

### TC-018 改了 `seats/*.json` 未重生成 `agents/*.md` → `gate` exit 1

- **覆盖**：spec §10.1 R9 / §10.4-2；PRD §4 V4 负例（「改任一 `seats/*.json` 值不重生成 → `Mismatch` → exit 1」）
- **前置**：`COPY`
- **步骤**：① 改某席 `duty.action` 一个字；② 直接 `GATE`；③ `node tools/docgen/cli.mjs diff --kind agent --name <seat>`
- **预期**：① exit 1，stderr 含 `Mismatch:` 与 `agents/<seat>.md`；② `diff` 报出非 0 差异行
- **判据**：`GATE` exit 1 且输出同时含 `Mismatch` 与该卡路径；`diff` exit 0 但输出差异行数 > 0（`diff` 只读、不因差异改变退出码这一行为以实测为准，判据取「差异行数 > 0」）
- **红绿证据**：红 = 数据改了却没重生成 → `compareBuffers` 不等（`tools/docgen/cli.mjs:143-144`）；绿 = 重生成后 `GATE` exit 0
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-018`
- **不覆盖**：`docs/agents/**` 投影面（属 `--readme` 面，本段不涉）

### TC-019 `seats/<seat>.json` 自带 `duty.trigger`（第二来源）→ 拒载并报错

- **覆盖**：spec §10.1 R3 / §10.4-3；PRD §4 V12「两面都必须为 0」
- **前置**：`COPY`
- **步骤**：① 在 `card.duty` 里写回 `"trigger": "<旧 when 句子>"`；② `GATE`；③ 把 `triggerTable[<seat>].when` 改一个字符后再跑（判断究竟是哪一份在生效）
- **预期**：① exit 非 0，报错含 `duty.trigger`（第二来源必须被拒，不得静默覆盖）；② 若实现选择「加载期剔除」，则输出必须含剔除留痕（`dropped` 类字样）——**不许**「无报错 + 静默选一份」
- **判据**：`GATE` exit 非 0 且输出含 `duty.trigger`；或（剔除分支）`GATE` exit 0 且输出含 `duty.trigger` 的剔除留痕。两分支取其一；「exit 0 且无任何 duty.trigger 字样」→ 判失败
- **红绿证据**：红 = 现状 `validateAgentData` 不管 `card.duty.trigger`（`tools/docgen/components/validateAgentData.mjs:105` 的白名单只管条目顶层键），数据里写回一份完全不报；绿 = 拒载或留痕剔除
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-019`
- **不覆盖**：哪一分支算合格（spec 未定，见「附：给开发的建议」A-2）

### TC-020 `description` 半改态：只改 `CARD_TEXT_FIELDS` 不补 `surfaceTexts` → 违规词报 0 码（静默空转）

- **覆盖**：spec §10.1 R4（「两处同批改，缺一即静默空转」）；PRD §2 D17
- **前置**：`COPY`；`triggerTable[<seat>].when` 可写（`description` 由它派生）
- **步骤**：① 在 `when` 里写一个指针词句（如 `详见 §3 的口径`）；② 直接跑 `validateCardModel` 探针取 `errors`；③ 在 `COPY` 内把 `surfaceTexts` 的 `description` 分支删掉（模拟半改态）后重跑 ②；④ 复原 ③
- **预期**：① `errors` 必须含 `PointerToElsewhere` 且 `errors[].path` 含 `description`；② 半改态下报 0 码（证明该分支是必需的，且探针有判别力，不是恒绿）；③ 复原后再次有码
- **判据**：完整态：`errors` 含 `PointerToElsewhere` 且至少一条 `path` 命中 `/description/i`，探针 exit 0；半改态：`errors` 长度 = 0，命令 exit 0（说明「删一处即空转」成立）；两者都成立才算本用例通过
- **红绿证据**：红 = 现状 `validateCardModel.mjs:102-121` 的 `else-if` 链无 `description` 分支，`description` 违规词一条也报不出；绿 = 完整态有码、半改态必空转（两条一起构成判据）
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-020`
- **不覆盖**：`description` 的派生公式本身（归 `cardPipeline.mjs:59-64`，由 TC-005 逐字节兜底）

### TC-021 `description` 命中硬编码数量 → 必须报 `HardcodedCount`，第二个码同样接通

- **覆盖**：spec §10.1 R4；PRD §2 D17（防「只为某一个码特判加分支」）
- **前置**：`COPY`
- **步骤**：① 把某席 `when` 写成含 `共 3 条` 的句子（经注入后进入 `description`）；② 跑 `validateCardModel` 探针；③ 换成 `收卡` 再跑（验 `ProceduralWordOutsideParliament`，选非议会席 `evidence-reader`）
- **预期**：① `errors` 含 `HardcodedCount`，`path` 含 `description`；② `errors` 含 `ProceduralWordOutsideParliament`，`path` 含 `description`
- **判据**：两次探针各命中对应码，且 `path` 均命中 `/description/i`；任一码未报 → exit 1
- **红绿证据**：红 = 只给 `PointerToElsewhere` 加分支 → ② ③ 报 0 码；绿 = 两个不同码都在 `description` 上报出
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-021`
- **不覆盖**：`MixedTermInCard` 在 `description` 上的同判（与 ①② 同一实现点，不另立用例以免重复计正例）

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

### TC-025 卡面残留三项之一 → 逐项计数 ≥ 1（三个值各判一次）

- **覆盖**：spec §10.1 R6；PRD §3 Q8（删的是这三项）
- **前置**：Q8 已落地
- **步骤**：① `Select-String agents\*.md -Pattern 'skills-lock.json' -List`；② 同法查 `lessons/`；③ 同法查 `tools/docgen-spike/.tmp-test/`
- **预期**：三项各自的命中数均为 **0**；且 `lessons/` 不得因为 `DETECTION_BLIND_SPOTS`（`policy/definitions/paths.mjs:27`）另有留用而出现在卡面
- **判据**：三条 `Select-String` 的输出行数均 = 0，命令 exit 0（无命中时 PowerShell 返回 0 行）；任一项 ≥1 → 判定失败
- **红绿证据**：红 = 现状两卡该行含 `lessons/`、`skills-lock.json`、`tools/docgen-spike/.tmp-test/`；绿 = 三项 0 命中
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-025`
- **不覆盖**：检测盲区里的 `.session/` / `.superpowers/`（那不是禁写清单，`paths.mjs:27` 另有说明）

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

### TC-028 2 卡重生成后 evidence 哈希未更新 → 下一次 `replace` 判 `TargetDrift`

- **覆盖**：spec §10.5「policy 删 3 项后 2 张卡重生成 + 基线更新」；PRD §3 Q8
- **前置**：`tools/docgen/fixtures/<seat>.evidence.json` 15 份在位
- **步骤**：① `SHA`：逐席比较 `evidence.renderSha256` 与 `SHA256(agents/<seat>.md)`（hex 大写）；② 对 `reviewer-audit` / `detective-observer` 两张，额外比 `lastWrittenHash`；③ `COPY` 内把 `reviewer-audit.evidence.json` 的 `lastWrittenHash` 改回旧值，跑一次 `replace` 流程
- **预期**：① 15/15 席 `renderSha256` == 文件哈希；② 2 席 `lastWrittenHash` 同值；③ 旧值注入后 `replace` exit 非 0 且报 `TargetDrift`（证明「基线不更新 → 下次改不动」确实会红）
- **判据**：① 探针输出 `sha 15/15`、exit 0；③ 注入态 `replace` exit 非 0 且输出含 `TargetDrift`
- **红绿证据**：红 = 重生成卡却不更新 evidence → ① 少于 15/15 或 ③ 不报；绿 = 15/15 且 ③ 报 `TargetDrift`
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-028`
- **不覆盖**：`baseline.json`（它只装路径清单，由 `GATE` 的 `BaselineDrift` 兜底，不在本用例内）

### TC-029 `notWhen` 拼接丢失：`senior-sdet` 的 `description` 缺「不用于：…」→ `gate` exit 1

- **覆盖**：spec §10.1 R3（注入实现边界）；PRD §4 V4
- **前置**：`COPY`；`triggerTable['senior-sdet'].notWhen` 在位（`agentData.mjs:322`）
- **步骤**：① 在 `COPY` 内让注入只取 `when`、丢掉 `notWhen` 拼接（改装配点，不改数据）；② `GATE`；③ 复原后 `GATE`
- **预期**：① exit 1 `Mismatch`，`agents/senior-sdet.md` 的 description 行少「；不用于：修改业务代码…」；② 复原后 exit 0
- **判据**：注入态 `GATE` exit 1 且输出含 `senior-sdet`；复原态 exit 0
- **红绿证据**：红 = `descriptionOf` 的 `notWhen` 分支丢失（`cardPipeline.mjs:62-63`）；绿 = 复原 exit 0
- **对应测试**：建议 `tools/docgen/test/sa-data-layer.test.mjs::TC-029`
- **不覆盖**：`notWhen` 的语义是否正确（归 PRD / 既有 `ValidateAgentData` 断言 12）

## 3 负例与边界

> 本节与第 2 节的负/边界用例一一对应（19 条，TC-011～TC-029）；条数 19 ≥ 第 2 节的 10 条正例。

| 用例 ID | 边界/负例是什么 | 为什么容易漏 | 期望行为 |
|---|---|---|---|
| TC-011 | 引用指向不存在的 shared 键 | 渲染期拿到空值是「长得像正常」的失败，最隐蔽（spec §10.5 第 1 行） | `REFS` exit 1，点名键与席 |
| TC-012 | 两段互引成环 / 单段自引 | 递归无环检测 → 栈溢出，错误信息完全跑偏 | 10 秒内 exit 1 并点名环上键 |
| TC-013 | 共享段内再引用共享段 | 容易「只展开一层」后 exit 0，留下 `@` 原文进卡面 | 展开到底 或 明示拒绝，不许半展开 |
| TC-014 | 少一个顶层键 | `CARD_KEYS` 检查在装配末尾，装配前无判据 | `REFS` 先报，点名缺键 |
| TC-015 | 多一个顶层键（`returns`） | 「至少 12 键」式判据会放过多键，多键静默进卡面或被忽略 | 恰等 12；与 V11① 计数一致 |
| TC-016 | 引用存在但值为 `""` / `null` / `"   "` | 只判「键在不在」→ 空串展开成空文本，卡面静默少一句 | 三种空形态一律 exit 1 |
| TC-017 | 字符串被改成数字 | 隐式 `String()` 会把语义漂移抹平成「渲染恰好相同」 | 报码（`Mismatch` 或类型码，二者必居其一） |
| TC-018 | 改数据不重生成 | `gate` 是唯一逐字节防线，漏跑即漂移 | exit 1 `Mismatch` |
| TC-019 | 数据里残留 `duty.trigger` 第二来源 | 两处「恰好相等」时完全看不出病（PRD 缺陷 6 本体） | 拒载或留痕剔除，不许静默选一份 |
| TC-020 | 只改 `CARD_TEXT_FIELDS` 不补 `surfaceTexts` | 改了表、仍然不扫，并且没有任何验收能判出（spec R4 明写） | 完整态有码 + 半改态必空转（判别力对） |
| TC-021 | 只给某一个码加分支 | 用单一码验证会放过其余三个文本码 | 两个不同码都在 `description` 上报出 |
| TC-022 | 新增第 9 个 `SCAN_FIELDS` 键 | 「加个键更清楚」是最自然的错误改法 | `ESC` exit 非 0，键数仍 8 |
| TC-023 | 只改实现、不改三条冻结断言 | 断言期望「不扫」，实现已「扫」→ 落地即红，容易被当成实现错 | 三条同批改写后 `ESC` exit 0 |
| TC-024 | 删 policy 不重生成 2 卡 | 2 卡走的是 `boundaryBySeat` 分支（其余 13 席不受影响），容易只跑一张 | `GATE` exit 1 点名 |
| TC-025 | 三项只删两项 | 三项分属不同组（`workspace` 组 3 个元素），漏一项仍会渲染 | 三项各 0 命中 |
| TC-026 | `...s` 移到前面 | 条目自带 `tools` 会静默覆盖档位，卡面看不出来 | `TT` exit 非 0 |
| TC-027 | `kind` 写进条目顶层 | 结构「看起来更顺」的写法，且字段位未定死时最容易发生 | `TriggerFieldMisplaced` exit 1 |
| TC-028 | 重生成卡不更新 evidence 哈希 | 下一次 `replace` 才炸，离改动很远（定位成本高） | `sha 15/15` + 注入态 `TargetDrift` |
| TC-029 | 注入只取 `when` 丢 `notWhen` | 只有 1 席有 `notWhen`，15 席里最易被整体判据放过 | `GATE` exit 1 点名 `senior-sdet` |

## 4 回归清单

| 如果改了 | 必须重跑 | 为什么 |
|---|---|---|
| `shared.json` 任一段 | TC-002、TC-003、TC-004、TC-005、TC-011、TC-016 | 共享段被 15 席引用，一处改动波及全量渲染 |
| 任一 `seats/<seat>.json` | TC-003、TC-005、TC-014、TC-018 | 12 键与逐字节两条防线都在装配边界上 |
| `@` 展开器 / 加载器 | TC-002、TC-003、TC-011～TC-016、TC-019 | 展开器是本段唯一新增逻辑点，负例全在它身上 |
| `triggerTable`（含 `kind` 字段位） | TC-004、TC-008、TC-027、TC-029 | `when` 唯一源 + 字段位置 + `notWhen` 拼接三件事共用一处 |
| `CARD_TEXT_FIELDS` 或 `surfaceTexts` 任一处 | TC-009、TC-020、TC-021、TC-022、TC-023 | 两处实现点缺一即空转（spec R4） |
| `card-model.test.mjs` 的 `S1-TC-G09` | TC-009、TC-022、TC-023、TC-010 | 三条冻结断言与扫描面口径互锁 |
| `policy/definitions/paths.mjs` | TC-006、TC-024、TC-025、TC-028 | 删项 → 2 卡重生成 → evidence 哈希三步连坐 |
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
| `baseline 38/38` 是否等于 38 | PRD §5 / spec R9：同一表达式自除自的常量打印，恒真，不作判据（`tools/docgen/cli.mjs:102`、`:228`） |
| `checkItem.returns` 计数的 D16④ 整条 | 归 S-C 的 V11；本文件只在 TC-015 借它作「多余顶层键」的交叉证据 |
| `description` 的派生公式（`when` + `notWhen` 拼接形态） | 实现细节不拘（`cardPipeline.mjs:59-64`），本段只判结果：TC-004 等比 + TC-005 逐字节 + TC-029 缺 `notWhen` 即红 |

## 7 缺口与判别力水位

| 缺口 | 漏检哪类反例 | 至少 1 个样例 | 语义由谁兜 |
|---|---|---|---|
| spec §10.2 尚未填：`shared.json` / `seats/*.json` 的键切分表、`@` 语法、加载器与校验器文件名/落点全为占位 | TC-001 的目录根、TC-011～TC-016 的「按 §10.2 语法造引用」若 §10.2 写错，本表命令会跑偏 | 本表按 PRD V5 定名脚本 `check-shared-refs.mjs`、按 `seats/` + `shared.json`（PRD D12/Q7 的形态）落命令；plan 若改落点，必须同批改本表命令 | spec 作者（开工前填 §10.2）+ plan 落点；`REFS` 的退出码口径由本表钉死 |
| 数据里残留 `duty.trigger` 的处置未定（拒载 vs 加载期剔除留痕） | 两种实现都能让 TC-019 的「无报错静默选一份」漏过一半 | `COPY` 内写回 `duty.trigger` 并只改 `when` 一个字符 | spec 作者补一句处置口径（见「附：给开发的建议」A-2） |
| 共享段嵌套引用（`@` 嵌套）是否允许、深度上限 | 只展开一层的静默半展开 | TC-013 的 `COPY` 构造 | spec / plan 明确「允许并展开到底」或「不支持并拒绝」 |
| `trigger.kind` 的第五个取值在本段无人拦 | S-C 迟迟不开工时，数据里出现第五个 `kind` 而全仓仍绿 | `COPY` 内给某席 `triggerTable.kind = "fifth"` 跑 `GATE`（本段预期 exit 0 = 已知缺口） | spec §10.7 已点名；S-C 的 V10 兜 |
| `@` 展开的「纯函数」只由两次等比证明，不是代数性质证明 | 依赖环境变量 / 时间 / `Math.random()` 的隐蔽副作用（两次同进程可能同值） | TC-002 ③ 的跨进程比较 | TC-002 ③ 跨进程即兜；无更多本段可测手段 |

**判别力水位**：正例 10 条全部能红（每条都给了「改坏即红」的构造）；负/边界 19 条中，TC-013 / TC-019 / TC-020 属「两分支取其一」的判据，其判别力依赖 plan 按 §10.2 与 A-2 定口径——未定之前这三条只能判「不许静默」，不能判「选哪条」。

## 附：给开发的建议（不改判定，供 plan 与 spec 作者处置）

| # | 建议 | 触发用例 | 建议解法 |
|---|---|---|---|
| A-1 | 开工前把 spec §10.2 填实（键切分表 / `@` 语法 / 加载器与校验器的文件名与落点） | TC-001、TC-011～TC-016 | 在 §10.2 写死三件：`shared.json` 的键表、`@` 的字面语法、`check-shared-refs.mjs` 的落点；填完后本表命令一次替换即可 |
| A-2 | 给「数据里残留 `duty.trigger`」定一条处置口径（拒载并给码，或加载期剔除并留痕） | TC-019 | 二选一写进 §10.2 / R3 注释；若选拒载，在 `validateAgentData` 或加载器加一条断言并复用既有 `TriggerFieldMisplaced` 类别 |
| A-3 | 「基线更新」在 §10.5 是自然语言，未指到具体文件 | TC-028 | 在 §10.5 写明「基线 = `tools/docgen/fixtures/<seat>.evidence.json` 的 `renderSha256` / `lastWrittenHash`」，否则施工者可能只重生成卡、不动 evidence |
| A-4 | 共享段嵌套引用（多层 `@`）未声明 | TC-013 | 在 §10.2 写一句「支持/不支持」；若要支持，环检测须同时覆盖跨段嵌套 |
