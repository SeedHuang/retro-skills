# S5 工具档位 `producer` 实施计划

> 状态：**待计划门（未定稿）**｜创建：2026-10-24
> 来源 spec：`docs/superpowers/specs/2026-10-25-s5-tool-tiers-design.md`（v4-t3，SHA256 `974B477A…BDACD669`）
> 配套用例：`docs/superpowers/specs/2026-10-25-s5-tool-tiers-design-testcase.md`（51 条：22 正 / 16 负 / 13 边界，`C6E8F23B…CE61B242`）
> 功能点：**F-16**（`docs/prd/20261024073606-dev-workflow-mainline/index.md#L640`）
> 范围：**只做 `producer`**；`research` 交 S5-R，检测脚本 / CLI B3 机器门 / 账本模板改造交 S5-B（spec `#L282-L283`）

## 1 全貌

| 维度 | 内容 |
|---|---|
| 本质 | 把「按席名三元分派工具」改成「档位单源 + 按席映射」，让审计 / 侦探真的拿到写权与命令权（F-16 的 `producer` 部分） |
| 同族 | `patternRegistry`（档位定义）/ `agentData`（席位数据）/ `validateAgentData`（断言）/ `outputFormats`（卡面措辞）/ `agents/*.md`（生成物）/ 测试 / 流程文档 / 账本 |
| 边界 | 不改 PRD；不改 `command` 档的席位授予；不造检测脚本；不碰 `rules/`；`research` 不登记 |
| 验收 | spec V-1～V-10 全绿（`npm run check` + 新增 `tool-tiers.test.mjs` + `gate` 逐字节） |
| 影响面 | 15 席共用生成器：改档位映射会波及全部席位的 `tools:` 行；只 2 席变值（审计 / 侦探），其余必须零回归（V-6） |

**联动四问**：治本——分派逻辑从三处收成一处，以后加档只改 `patternRegistry`；副作用——`baseline` 计数会随席数 / 规则数派生，不得写死 37；跨问题——V-3 与 V-8 都依赖「边界句在 `agentData` 里」这同一落点；跨文件——生成器 / 卡 / 测试 / 文档四层必须同批。

## 2 依赖与顺序

```
T1 patternRegistry ──┬── T2 agentData ──┬── T5 草稿 → T6 对照确认 → T7 replace+B3
                     │                  │
                     └── T3 validate ───┘
T4 outputFormats ────────────────┘
T8 测试（四处旧断言 + 新 tool-tiers.test.mjs）   依赖 T1–T4
T9 流程文档三处                                 可并行
T7 ──→ T10 账本 P-8 ──→ T11 终局验证（gate + npm run check）
```

**硬顺序**（spec `#L200-L213`）：T1→T2→T3→T4 → T5（两席草稿都生成）→ T6（对照确认）→ T7（replace + B3 重判）→ T8 → T9 → T10 → T11。
**与 spec 次序的两处有意差异**：① spec 第 7 步（`gate`）与第 10 步（`npm run check`）在本 plan 合并为 **T11** 并排在 T10 之后，理由是账本改动也要过 `npm run check`；② spec 第 11 步（账本）在本 plan 前移到 **T10**。

## 3 任务

### T1 `patternRegistry.mjs`：档位单源（新增 `producer`）（P-1）

- **改**：`tools` 增 `producer`（`Read/Glob/Grep/Write/Edit/RunCommand`）；新增 `tierBySeat`（`senior-sdet→sdet`、`reviewer-audit→producer`、`detective-observer→producer`）、`defaultTier='readOnly'`、`tierOf()`（`Object.hasOwn`）、`toolsForSeat()`、`boundaryBySeat`、`BOUNDARY_PRODUCER_AUDIT`、`BOUNDARY_PRODUCER_DETECTIVE`
- **不登记** `research`（V-1）
- **验收**：`node -e "import('./tools/docgen/components/patternRegistry.mjs').then(m=>console.log(Object.keys(m.patternRegistry.tools)))"` → 含 `producer`、不含 `research`；`node -e "import('./tools/docgen/components/patternRegistry.mjs').then(m=>console.log(JSON.stringify(m.toolsForSeat('reviewer-audit'))))"` → producer 六元组
  （注：`tools` / `tierBySeat` 等都是 `patternRegistry` 的字段（`patternRegistry.mjs:23`），**没有**顶层 `export const tools`，命令必须走 `m.patternRegistry.tools`）
- **对应用例**：见 §5 的 T1 行（映射单源，本节不复述 ID）
- **依据**：spec §3.1 / §3.2（`#L68-L116`）

### T2 `agentData.mjs`：按席映射 + 侦探固定清单（P-2）

- **改**：尾部 `map` 改 `tools: toolsForSeat(s.name)` + `boundaryBySeat[s.name]`；`...s` 放最后；侦探 `fixedList[3]` 的裸 `git status --porcelain` → `git --no-optional-locks status --porcelain`
- **验收**：`node -e "import('./tools/docgen/components/agentData.mjs').then(m=>console.log(JSON.stringify(m.agentData.find(a=>a.name==='reviewer-audit').tools)))"` → producer 六元组；`Grep 'git status --porcelain' tools/docgen/components/agentData.mjs` → 0 命中（裸形态已清）
  （注：`agentData.mjs` **无 default export**，只有 `export const agentData`（`:294`），命令必须走 `m.agentData`）
- **对应用例**：见 §5 的 T2 行
- **依据**：spec §5（`#L186-L196`）+ T-4（`#L171`）

### T3 `validateAgentData.mjs`：断言 4 单源 + 缺边界报错（P-3）

- **改**：断言 4 用 `toolsForSeat(a.name)`；`producer` 席 `boundary` 缺失 / 为空 → `DescriptionDerivation`；`DECLARED_SLOT_SEATS` 由 `boundaryBySeat` 派生
- **验收**：`node -e "import('./tools/docgen/components/validateAgentData.mjs').then(m=>console.log(typeof m.validateAgentData))"`；负例用注入桩（readOnly 席注入 `Write`）→ `ToolsViolation`
- **对应用例**：见 §5 的 T3 行
- **依据**：spec §5（`#L191-L196`）

### T4 `outputFormats.mjs`：审计卡输出格式改口径（P-4）

- **改**：「已授 `command` 档」→「已授 `producer` 档」（仅审计席那句）
- **验收**：`Grep '已授 producer 档' tools/docgen/components/outputFormats.mjs` → 1；`Grep '已授 command 档'` → 0
- **对应用例**：见 §5 的 T4 行
- **依据**：spec P-4（`#L48`）

### T5 生成两席草稿（不写 `agents/`；草稿落仓外 `DRAFTS_DIR`）

- **命令**：`node tools/docgen/cli.mjs draft --kind agent --name reviewer-audit` / `--name detective-observer`
- **硬约束**：**两席草稿都生成后**才能做第一次 `replace`（旁席 `Mismatch` 只在草稿在位时放行，`cli.mjs:396-413`）
- **验收**：`node tools/docgen/cli.mjs draft ls` 列出两条
- **注**：草稿会写仓外目录 `DRAFTS_DIR`（`cli.mjs:179` / `:341`），「不落盘」仅指**不写 `agents/`**——④ 段核写盘时要按这个口径
- **依据**：spec §6 第 2 步（`#L202`）

### T6 两版对照 → 用户确认

- **命令**：`git diff --no-index agents/reviewer-audit.md <草稿路径>`（侦探同）
- **动作**：把两版差异展示给用户，**确认替换内容本身**后才进 T7（禁手改卡：`skills/parliament/SKILL.md:15`）
- **验收**：用户明确「可替换」；差异里工具行、边界句、固定清单三处与 spec 一致
- **依据**：spec §6 第 3 步（`#L203`）

### T7 B3 独立重判 + replace（两席各一次）

1. `node tools/docgen/cli.mjs diff --kind agent --name <席>` 取新 sha256
2. `<席>:B3` 置 `"pending"`（只改这一个键）
3. 派**独立子代理**按 `tools/execution-matrix/criteria.md:134-141` 重判，**只返回**四字段原文
4. 主持人逐字转录进 `.session/reviews/<本次>/rejudge-<席>-B3.md`（含「转录人」），并在 `progress.md` 派工节记同一判者标识
5. 执行 replace（**本机 OS = windows，`VAR=… node …` 是 POSIX 写法、cmd / PowerShell 都不认**，按所在 shell 二选一）：
   - PowerShell：`$env:DOCGEN_JUDGED_BY='<判者标识>'; node tools/docgen/cli.mjs replace --kind agent --name <席> --draft <草稿> --expect-change <sha> --rejudge B3 --yes`
   - cmd：`set "DOCGEN_JUDGED_BY=<判者标识>" && node tools/docgen/cli.mjs replace --kind agent --name <席> --draft <草稿> --expect-change <sha> --rejudge B3 --yes`
     （cmd 的 `set` 必须写成 `set "VAR=值"` 带引号；不带引号时 `&&` 前的空格会并入值，判者标识带尾随空格 → 与 V-8 三处「逐字相等」对不上）
- **断点**：**无子代理 → 停，不得 replace**（spec `#L205` 第 5 步 / V-8）；同时清理草稿（`draft rm --name <席> --yes`），报告首行标「降级模式（B3 未独立重判）」，S5 不标完成
- **验收**：两席 `replace` exit 0；evidence `changes[]` 中 `to === renderSha256` 的最新条四字段齐
- **对应用例**：见 §5 的 T7 行
- **依据**：spec §4（`#L174-L184`）+ §6 第 4–6 步

### T8 测试：四处旧断言 + 新增 `tool-tiers.test.mjs`（P-6）

- **改**：`pilot-data` / `pilot-render` / `validate` / `review-fixes` 四处旧断言按 spec D7 / D8 改（不得写死档位数量、用例总数、baseline 计数）
- **新增**：`tools/docgen/test/tool-tiers.test.mjs` —— 按 testcase 的「1.1 共用前提（P0 前置）」先落 helper，再落 A/B/C/D/E 五组
- **验收**：`node --test tools/docgen/test/tool-tiers.test.mjs` —— **T7 完成后必须全绿**；若在 T7 之前跑必红（卡面未重生成），那是预期内的红，不得当作验收通过
- **对应用例**：见 §5 的 T8 行（本任务负责把 §5 全部用例落成代码）
- **依据**：spec §6 第 8 步 + testcase §1.1

### T9 流程文档三处同步（P-7）

- **改**：`skills/` 下三处「已授 `command` 档」→「已授 `producer` 档」
- **验收**：`Grep '已授 .command. 档' skills/` → 0；三处含新句（V-9）
- **对应用例**：见 §5 的 T9 行

### T10 账本收口（P-8 / V-10）

- **改**：`docs/after/20261024174253-dev-workflow-mainline-open-items.md`：删除 `| B-5 |` 行；B-1 替换为**三条**接班条目（`research` → S5-R / 精算师取数权 → S2 / S5-B）；仍标「未决」
- **验收**：`grep -cF '| B-5 |' <该文件>` → 0；三条接班条目在位；`grep -cE 'S5 剩余|S5 部分完成' <该文件>` → 0（B-1 旧句必须被三条完全吸收，不留以「S5 整体」为对象的活账）

### T11 终局验证

- `node tools/docgen/cli.mjs gate` → exit 0 + `baseline N/N`（N 派生，当前 37）
- `npm run check` → `# fail 0`、`0 findings`、覆盖席数 = `state.json` 中 `replaced` 席数
- 席位零回归：非两席的 `tools:` 行逐字节不变（V-6）

## 4 中途不得

- 手改 `agents/*.md`（必须经 docgen）
- 跳过 B3 重判；用旧 `--expect-change` 凭证重试
- 把 `evidence.json` 手工改哈希
- 把「盘上 == 渲染」时 `replace` 的 exit 0 当作「拒写盘」（幂等短路在三道门之前）
- 在 plan 里新增 spec 未定义的设计（有则回流 spec 重审，R4）

**中断重试**：已有草稿时先 `node tools/docgen/cli.mjs draft rm --name <席> --yes`，否则 `DraftNameConflict`。

## 5 功能点 ↔ 任务 ↔ 用例映射（计划门判据，本节是映射的唯一来源）

| 任务 | 覆盖用例（逐条） | 条数 | 功能点 |
|---|---|---|---|
| T1 `patternRegistry` | A01 A02 A04 A06 A07 A08 A09 A10 D02 D09 | 10 | F-16 `producer` |
| T2 `agentData` | A05 B02 B03 B05 B06 B08 B13 B14 D10 | 9 | F-16 `producer` |
| T3 `validateAgentData` | A03 D01 D03 D04 D05 D06 D07 D08 | 8 | F-16 `producer` |
| T4 `outputFormats` | B04 | 1 | F-16 `producer` |
| T5 生成两席草稿 | C08 | 1 | F-16 `producer` |
| T6 两版对照确认 | —（人工确认，机器用例不覆盖；见 §3 T6） | 0 | — |
| T7 B3 重判 + `replace` | B01 B07 B09 B10 B11 B12 | 6 | F-16 `producer` |
| T8 测试改造 + 新增用例文件 | E01 E02 E03 E04 E05 E06 E07 | 7 | F-16 `producer` |
| T9 流程文档同步 | E08 | 1 | F-16 `producer` |
| T10 账本收口 | E09 | 1 | F-16 `producer` |
| T11 终局验证 | C01 C02 C03 C04 C05 C06 C07 | 7 | F-16 `producer` |
| **合计** | 51 条（每条恰属一个任务，无重复、无遗漏） | **51** | — |
| F-16（`research` 部分） | —（不实现） | 0 | **不在本 plan，交 S5-R（spec `#L282`）** |

**核对法（可复算）**：`grep -cE '^[|] S5-TC-[A-E][0-9]{2} [|].*[|] P[012] [|]$' docs/superpowers/specs/2026-10-25-s5-tool-tiers-design-testcase.md` → **51**（实测；用 `[|]` 字符类是为了在 grep -E 与 ripgrep 下同义、且不打断 Markdown 表格。PowerShell 等价写法：`(Select-String -Path <该文件> -Pattern '^[|] S5-TC-[A-E][0-9]{2} [|].*[|] P[012] [|]$').Count` → 51，已实测）。注意更宽松的 `^[|] S5-TC-` 会命中 80 行 —— 多出的 29 行是 §3「负例与边界（汇总裁定表）」；与上表 ID 集合求对称差 → 应为空集。

**依赖无环**：T1→T2→T3→T4 为链；T5 依赖 T1–T4；T6 依赖 T5；T7 依赖 T6；T8 依赖 T1–T4；T9 无前置（可并行）；T10 依赖 T7（收尾）；T11 依赖 T10。无回边。

## 6 计划门自检（交审计前逐条打勾）

- [x] 功能点 `F-16` 全覆盖（`producer` 部分 51 条用例逐条落点；`research` 有明确去向 S5-R）
- [x] 依赖无环（§2 图无回边）
- [x] 功能块 ↔ testcase 一一映射（§5 表 51 条，每条恰属一个任务）
- [x] 每步有可复算验收命令（§3 各任务「验收」行）
- [x] 无 `## 新增设计决策` 节（R4）
- [x] 未写死 baseline 计数或档位数量（V-5）

> 上列勾选由申报人（主 agent + sdet）填；**签字仍须审计独立核对**（计划门判据「审计本人读并签字」）。
