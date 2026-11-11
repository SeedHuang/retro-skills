> split from `docs/prd/20261111145723-agent-model-pipeline.md` §6 P1（2026-11-11）

# P1 渲染隔离产物 — 技术设计

> **范围**：PRD §6「P1 渲染隔离产物」全部内容；P2–P5 不在本 spec。
> **双份真相**：PRD 的 D1–D12 / Q1–Q5 只活在 PRD，本文件只引用编号，不抄写。
> **状态**：草稿（待用户评审三件套）｜**作者**：主 agent｜**日期**：2026-11-11
> **Testcase**：`docs/superpowers/specs/2026-11-11-agent-model-pipeline-p1-design-testcase.md`（由 `senior-sdet` 子代理独立编写）
> **Plan**：`docs/superpowers/plans/2026-11-11-agent-model-pipeline-p1.md`

## 1 为什么

P1 的目标不是重新设计卡面，而是把已建模的 7 张卡渲染成「可替换现役卡」的完整产物，落在隔离目录，让 P2 有可盲测的 B 组。

当前渲染器能出 7 张卡，但与现役卡存在 4 个已知缺口（PRD §6 P1 表），且「边界段」实为**三种形态并存**，不是所有席都走 15 槽。若按「统一 15 槽」实现，会给 5 张只读席凭空加上写作用域与命令白名单，属于语义造假。

### 1.1 实测事实（本 spec 全部结论的依据）

| # | 事实 | 可核锚 |
|---|---|---|
| F1 | 7 张模型展开后与基线等价 | `cd tmp/agent-criteria-demo && node verify-models.mjs` → 7 行 `EQUIVALENT`（2026-11-11 复核） |
| F2 | 现役 18 张卡都有 `## 边界`，但只有 2 张走 15 槽 | `grep -c '^## 边界' agents/*.md` → 18 个文件各 1；[detective-observer.md](file:///d:/Seed/retro-skills/agents/detective-observer.md#L65-L80) 与 [reviewer-audit.md](file:///d:/Seed/retro-skills/agents/reviewer-audit.md#L83-L98) 为 15 槽；**本轮建模的 7 席中其余 5 席**为本席一句（如 [evidence-reader.md](file:///d:/Seed/retro-skills/agents/evidence-reader.md#L65-L66) 正文 60 字，2026-11-11 实测） |
| F3 | 2 张 15 槽卡与 `renderBoundary(seat)` **逐字节相等** | 2026-11-11 实跑：长度 1200 / 1240，`===` 为 true |
| F4 | 5 张短边界的来源分两类 | 3 张为席条目自带：[respondent-dev.json:86](file:///d:/Seed/retro-skills/tools/docgen/dsl/agents/seats/respondent-dev.json#L86)、[respondent-architect.json:86](file:///d:/Seed/retro-skills/tools/docgen/dsl/agents/seats/respondent-architect.json#L86)、[evidence-reader.json:115](file:///d:/Seed/retro-skills/tools/docgen/dsl/agents/seats/evidence-reader.json#L115)；2 张回落常量：[patternRegistry.mjs:13](file:///d:/Seed/retro-skills/tools/docgen/builders/agents/components/patternRegistry.mjs#L13) |
| F5 | `tools` 现在由策略反查，模型无该字段 | [sections.mjs:90-92](file:///d:/Seed/retro-skills/tmp/agent-criteria-demo/render/sections.mjs#L90-L92)；`grep '"tier"' tmp/agent-criteria-demo/models` → 0 处 |
| F6 | 6 张模型有 `outputFormat`，`reviewer-audit` 没有 | 6 个 `models/*-model.json` 各 1 处；[reviewer-audit.md:48-77](file:///d:/Seed/retro-skills/agents/reviewer-audit.md#L48-L77) 现役有 18 字段 + 4 校验 |
| F7 | 产物目录当前是 `output/` | [render-all.mjs:8](file:///d:/Seed/retro-skills/tmp/agent-criteria-demo/render-all.mjs#L8) |
| F8 | 越界处置编号写死 1/2/3 | [sections.mjs:200-204](file:///d:/Seed/retro-skills/tmp/agent-criteria-demo/render/sections.mjs#L200-L204) |
| F9 | 渲染段表只有 9 段，无 `outputFormat` / `boundary` | [index.mjs:9-13](file:///d:/Seed/retro-skills/tmp/agent-criteria-demo/render/index.mjs#L9-L13) |
| F10 | 现役 15 槽模板槽位 15 个 | [renderBoundary.mjs:22-24](file:///d:/Seed/retro-skills/tools/docgen/builders/agents/components/renderBoundary.mjs#L22-L24)、[boundary.md.tpl:1-15](file:///d:/Seed/retro-skills/tools/docgen/builders/agents/templates/boundary.md.tpl#L1-L15) |
| F11 | 当前渲染器的档位→工具表键名写错：表键是 `producer/reader/replayer`，实际档位名是 `readOnly/sdet/command/producer`，导致 5 席回落成 capability ID | [sections.mjs:92](file:///d:/Seed/retro-skills/tmp/agent-criteria-demo/render/sections.mjs#L92)；`tmp/agent-criteria-demo/output/evidence-reader.md:4` 为 `tools: read`，`respondent-dev.md:4` 为 `tools: read, exec` |

### 1.2 术语

| 术语 | 一句话 |
|---|---|
| 边界形态 | 一张卡的 `## 边界` 段由哪一种数据产出：`policy`（15 槽渲染）/ `literal`（席自带一句）/ `default`（公共只读句） |
| 段函数 | `render/sections.mjs` 里一个纯函数，产出一段 `##` 级 markdown |
| 派生文案 | 由模型字段 + 固定模板拼出的句子，渲染器内不存一次性手写句 |
| 沙箱 | `tmp/agent-criteria-demo/sandbox/`，P1 产物落点 |

## 2 范围

**做**：

1. 模型补 2 个字段：`seat.tier`、`boundary`。
2. 渲染器补 2 个段函数：`outputFormat`、`boundary`；修 1 处编号；改 `tools` 取值来源。
3. `render-all.mjs` 产物改落 `sandbox/`。
4. 新增 `diff-report.mjs`，机械生成 `sandbox/diff-report.md`。
5. 新增 1 个 `node:test` 测试文件 `tmp/agent-criteria-demo/test-p1.test.mjs`，承接 testcase 中机器可判的条目。
6. 回写 PRD §9 为「已定」，修正 §6 的「3 个缺口」笔误为 4。

**不做**（不可越界）：

- 不写 `agents/*.md`（PRD 页首硬纪律、D10）。
- 不改 `tools/docgen/**`（PRD §6 P1「边界」）；只 import，不修改。
- 不改类型体系 `types/*.mjs`（新增字段均为可选顶层字段，`BaseModel.fields` 不拒绝未知键）。
- 不补 `reviewer-audit` 的 `outputFormat` 建模（P4 范围，本 spec 记为缺失项）。
- 不清现役 6 + 9 个红测试（PRD Q4 → P5 前置门）。
- 不改 `models/_baseline/`：本轮只加 `seat.tier` / `boundary` / 不触碰 `must` / `never` / `predicates` / `records`，`verify-models.mjs` 的基线比对不涉及这两个字段。

## 3 关键决定

| # | 决定 | 为什么 |
|---|---|---|
| S1 | 边界三分形态：`policy` / `literal` / `default`，模型用 `boundary.kind` 声明 | F2–F4：5 张只读席套 15 槽会写出「只允许写…`evidence.md`」而工具档只有 Read/Glob/Grep，语义自相矛盾；三种形态才能逐字对齐现役卡 |
| S2 | `boundary.kind = policy` 只给 `detective-observer` / `reviewer-audit`；`literal` 给 `evidence-reader` / `respondent-architect` / `respondent-dev`；`default` 给 `reviewer-actuary` / `reviewer-ai` | F3/F4 实跑结果；与现役 `boundaryBySeat` + `DEFAULT_BOUNDARY` 的取法一一对应 |
| S3 | `literal` 的正文写进模型，`default` 只写 `kind`（正文取 `DEFAULT_BOUNDARY` 常量） | 前者是 P5 后唯一可留的真相；后者复制常量会造第二份真相 |
| S4 | `tools` 改读 `seat.tier`，并新增校验 `TIER_MISMATCH`（模型档位 ≠ 策略反查档位） | Q3 已定 A；策略仍在，双处表达必须有机械守卫，否则改错不报 |
| S5 | `outputFormat` 由模型配置派生：必填字段 = 表格，校验 = `observable` 经 `renderObs` 派生；**禁止** `checks[].text` | PRD §6 缺口 1 / I1；`verify-models.mjs:181` 已有 `OUTPUT_TEXT_HANDWRITTEN` 守卫 |
| S6 | `reviewer-audit` 本轮不出 `## 输出格式`，在差异报告列为「缺失项」 | PRD §6 缺口 1 验收只要求「6 张产物出现该段」；其 18 字段/4 校验尚无结构化模型，硬编 4 条 `text` 会破 I1 |
| S7 | 越界处置编号 = `steps` 序号（`index + 1`），不按 `kind` 写死 | PRD §6 缺口 4；现模型 3 步，改顺序或加步后编号必须跟变 |
| S8 | 段顺序：`frontmatter → duty → must → never → conflict → checklist → outputFormat → outputs → permissions → escalation → boundary` | 现役卡前 6 段相对顺序为 职责/一定会/禁止/冲突裁决/本席清单/输出格式（F2 同批实测），`边界` 恒为末段 |
| S9 | `render-all.mjs` 默认输出目录改为 `sandbox/`，支持 `--out <dir>` 覆盖 | P1 要求隔离产物；`output/` 保留为上一轮对照，不覆盖 |
| S10 | 差异报告由 `diff-report.mjs` 机械生成，禁手写；报告不含时间戳 | I2 同源要求：同输入同输出；手写报告会与产物漂移 |
| S11 | 模型里 `boundary.kind` 非三值、`literal` 缺 `text`、或 `text` 只含空白 → 校验期红（`BOUNDARY_KIND_UNKNOWN` / `BOUNDARY_TEXT_MISSING` / `BOUNDARY_TEXT_WHITESPACE`）。工序约定「先 `verify-models` 后 `render-all`」；`render-all` 自身不调校验入口（S15），渲染层只对未知 `kind` 抛错，缺失/空白 `text` 由校验期拦 | 流水线「校验失败即停」；渲染期再抛会把配置错误指向模板 |
| S12 | `kind=policy` 但 `TIERS[tier]` 不含 `Write` → 校验期红（`BOUNDARY_POLICY_NONWRITER`） | 15 槽含「只允许写」，只读席套用会造出假写权限；识别层必须在校验期，不能靠人看 |
| S13 | `literal.text` 原样渲染，不 trim；校验要求 `text === text.trim()` 且非空 | 「逐字对齐现役卡」要求不加工；trim 会让首尾空白静默消失 |
| S14 | `--out` 相对**脚本目录**解析（`resolve(here, dir)`），绝对路径原样 | 避免依赖 cwd；两种启动方式结果一致 |
| S15 | `verify-models.mjs` 任一错误码或非 `EQUIVALENT` → exit 1；`render-all.mjs` 渲染异常 → exit 1，正常 → exit 0；`render-all` 不调用校验入口（不 spawn、不调 `verify()`），但允许 `render/index.mjs` 与 `diff-report.mjs` 复用其导出的 `expand` | 现 `verify-models` 恒 exit 0（`verify()` 未导出、也无退出判定），不能作为门禁；`render/index.mjs:2` 已 import `expand`，属函数复用，不算调用校验 |
| S16 | 差异报告列名与列序冻结（见 §4.3），机器可判 | 报告是交付物，列名漂移会让 P2 无法对比两轮 |

## 4 机制

### 4.1 模型新增字段

```json
{
  "seat": { "tier": "producer" },
  "boundary": { "kind": "policy" }
}
```

| 席 | `seat.tier` | `boundary` |
|---|---|---|
| detective-observer | `producer` | `{"kind":"policy"}` |
| reviewer-audit | `producer` | `{"kind":"policy"}` |
| respondent-dev | `command` | `{"kind":"literal","text":"…"}` |
| evidence-reader | `readOnly` | `{"kind":"literal","text":"…"}` |
| respondent-architect | `readOnly` | `{"kind":"literal","text":"…"}` |
| reviewer-actuary | `readOnly` | `{"kind":"default"}` |
| reviewer-ai | `readOnly` | `{"kind":"default"}` |

档位值必须 ∈ `TIERS` 的键（[tiers.mjs:5-10](file:///d:/Seed/retro-skills/tools/docgen/builders/agents/policy/definitions/tiers.mjs#L5-L10)）。`literal.text` 逐字取自现役卡该段（F4 三处），不转述、不润色。

### 4.2 段函数

**`outputFormat(M)`**

```
## 输出格式
必填字段：

| # | 字段 |
|---|---|
| 1 | {requiredFields[0].label} |
...
校验：

- {renderObs(checks[i].observable)}
```

- 无 `M.outputFormat` → 返回 `[]`（跳过整段，不留空标题）。
- `checks` 的派生只允许读 `observable`；`observable.op` 为 `refExists` 时新增一条 OP 映射。现有 OP 共 **21** 条（`sections.mjs:15-37` 实测），加 `refExists` 后 **22** 条。
- `type` / `values` / `required` 不上卡面（现役卡只有「字段」一列，F6）。
- 段内**非空行**恒等于 `requiredFields.length + checks.length + 5`：标题 1 + 「必填字段：」1 + 表头 2 + 字段 N + 「校验：」1 + 校验 M。空行不计入判据。

**`boundary(M)`**

```
## 边界
{body}
```

- `kind=policy` → `renderBoundary(M.seat.id)`（F3 已证逐字节相等）。
- `kind=literal` → `M.boundary.text`。
- `kind=default` → `DEFAULT_BOUNDARY`（import 常量，不复制）。
- 其它 kind → 抛错（校验层本应已拦，渲染层不静默兜底）。

**`frontmatter` 的 `tools`**

- 由 `TIERS[M.seat.tier]` 取数组（同一引用，不复制），不再 `tierOfCapabilities(SEAT_POLICY…)`。
- `SEAT_POLICY` 仍被 `verify-models.mjs` 用于 `TIER_MISMATCH` 与 `POLICY_DIFF`。

**`escalation`**

- `for (const [i, s] of esc.steps.entries())` → `${i + 1}. …`；不再按 `kind` 写死 1/2/3。

### 4.3 产物与报告

- `render-all.mjs`：`outDir = join(here, 'sandbox')`；`--out <dir>` 由 `resolve(here, dir)` 解析（绝对路径原样），逐文件写 `<seat>.md`。
- `diff-report.mjs`：读 `sandbox/*.md` 与 `agents/<seat>.md`，按 `^## ` 切段。列名与列序冻结如下（S16）：

| 报告节 | 列（从左到右） |
|---|---|
| 总览 | `席` / `类型` / `沙箱行数` / `现役行数` / `沙箱字符` / `现役字符` / `段数（沙箱/现役）` / `边界形态` / `边界一致` / `输出格式` |
| 段级差异 | `席` / `段` / `状态`（一致 / 文本不同 / 仅沙箱 / 仅现役）/ `字符差` |
| 边界核对 | `席` / `形态` / `沙箱长度` / `现役长度` / `逐字节相等` |
| 缺失项 | `席` / `缺失项` / `原因` |
| 已知差异归类 | `#` / `差异` / `依据`（固定 K1–K5 五行） |

- 报告不含时间戳、不含绝对路径；同输入连跑两次报告字节差 0。

### 4.4 校验新增码与退出码

| 码 | 触发 |
|---|---|
| `TIER_MISMATCH` | `seat.tier` ≠ `tierOfCapabilities(SEAT_POLICY[seat].capabilities)` |
| `BOUNDARY_KIND_UNKNOWN` | `boundary.kind` ∉ `{policy, literal, default}` |
| `BOUNDARY_TEXT_MISSING` | `kind=literal` 且 `text` 不是非空字符串，或 `text.trim() === ''`（**空白串只发此码**） |
| `BOUNDARY_TEXT_WHITESPACE` | `kind=literal`、`text.trim() !== ''` 且 `text !== text.trim()`（**先判空、后判空白，同席只发一码**） |
| `BOUNDARY_POLICY_NONWRITER` | `kind=policy` 且 `TIERS[seat.tier]` 不含 `Write` |

退出码：`verify-models.mjs` 只要有任一非空错误字段（`errs` / `ownFail` / `policyDiff` / `outputTextHandwritten` / `writeScopeBad` / `outputUnwritable` / `cardRuleLeak` / 新增 5 码等）→ exit 1，否则 0。码串仍打印在每席同一行（stdout），exit code 是机器信号，不另起 stderr 码流。

`render-all.mjs`：逐席渲染，**遇首个抛错即停**（fail fast），exit 1；已写入的沙箱文件保留（沙箱可弃、可重跑），不尝试回滚。正常 7 席全出 → exit 0。

### 4.5 硬约束

1. 只改 `tmp/agent-criteria-demo/**` 与四份文档（spec / testcase / plan / PRD 回写）；`agents/**`、`tools/docgen/**` 一行不动（S1 验收第 9 条）。
2. 渲染层只允许 import 现役组件，不得复制 `boundary.md.tpl`、`DEFAULT_BOUNDARY`、`TIERS` 的文本或数组（S2 / S3 / F11）。机器判据：TC-016 断言 `render/sections.mjs` 以 `import { TIERS }` 引用档位表、源码不含 `['Read', 'Glob', 'Grep'` 这类工具名数组字面量。
3. `outputFormat.checks` 不得出现 `text` 键（S5）；`verify-models.mjs:181` 的 `OUTPUT_TEXT_HANDWRITTEN` 必须保持为空。
4. 模型新增字段只加 `seat.tier` 与顶层 `boundary`，不得改 `must` / `never` / `predicates` / `records`（否则须跑 `update-baseline.mjs`，超出 P1）。
5. 产物与报告必须确定性：无时间戳、无绝对路径、无随机顺序（S10）。

## 4.6 测试

| 测什么 | 为什么 |
|---|---|
| 7 席 `tools` = `TIERS[seat.tier]` | F11 现状 5 席输出 `read` / `read, exec`，只测「有 tools 行」会把错值当基线 |
| 2 张 `policy` 席边界与 `renderBoundary` 逐字节相等 | 这是 P1 唯一硬锚；重写模板会让 gate 全红（PRD R1） |
| 5 张非 `policy` 席边界与现役卡逐字节相等 | 三形态里最容易在迁移中被「统一」掉，需独立判 |
| `outputFormat` 段非空行公式 | 防止实现先输出空标题或漏掉表头；6 席全覆盖 |
| 5 个新校验码各自正反例 | 码是唯一机器门禁；无正例会把恒红当绿 |
| 两次渲染字节差 0 | I2 机械渲染，防隐式时间/环境依赖 |
| exit code | 现状恒 0，不收口就无法作为门禁（S15） |

**测试用例文件**：`docs/superpowers/specs/2026-11-11-agent-model-pipeline-p1-design-testcase.md`（46 条，由 senior-sdet 子代理独立编写；每条五要素齐全，负例 + 边界 23 ≥ 正例 23）

**测试代码**：`tmp/agent-criteria-demo/test-p1.test.mjs`，由 plan Task 2 先写红、再实现转绿；每条用例注明对应 TC 编号。

**只手动验证**：边界段与现役卡的「可读性」是否等价（P2 盲测接手）；差异报告中的「新增段是否该保留」（P2 四维评估）。

**不测**：`reviewer-audit` 的 `outputFormat`（P4 建模）；现役 6 + 9 个红测试（P5 前置门）；`renderBoundary` 内部 15 槽取值（现役测试已覆盖）。

### 4.6.1 与既有 spec 的关系

- **保留** `docs/superpowers/specs/2026-11-09-script-layer-refactor-design.md` 的命令组分层 —— 本 spec 不碰 `commands.mjs`。
- **保留** `tools/docgen/builders/agents/test/tool-tiers.test.mjs` 的 15 槽断言 —— 本 spec 只消费 `renderBoundary`，不改其实现。
- **取代** 无；P1 是 `docs/prd/20261111145723-agent-model-pipeline.md` §6 的第一次落地。

### 4.6.2 将来才会撞上的一件事

P5 要删 `seat-policy.mjs` / `boundary.md.tpl` / `outputFormats.mjs`，届时 `renderBoundary` 的 15 槽与 `outputFormats` 的散文必须迁进模型；P1 只让模型「声明引用」，未做迁移。若 P5 之前有人改这三个文件，P1 的逐字节验收会失效——本轮只点名，不定案。

## 5 验收锚

```
cd tmp/agent-criteria-demo
node verify-models.mjs         → exit 0；7 行 EQUIVALENT，无 POLICY_DIFF / TYPE_* / ISSUE_RULE_ON_NON_ISSUER / TIER_MISMATCH / BOUNDARY_*
node render-all.mjs            → exit 0；7 行，0 错误；sandbox/ 7 个 md（不含报告）
node diff-report.mjs           → exit 0；sandbox/diff-report.md 生成（5 节，列名冻结）
node render-all.mjs（第二次）  → exit 0；7 个文件 sha256 全同（字节差 0）
cd ../.. && git status --short agents/   → 空
```

补充逐条判据：

1. 2 张 `policy` 席的 `## 边界` 正文 === `renderBoundary(seat)`。
2. 5 张非 `policy` 席的 `## 边界` 正文 === 对应现役卡该段（逐字节）。
3. 6 张有 `outputFormat` 的产物含 `## 输出格式`，段内非空行数 = `requiredFields.length + checks.length + 5`；`reviewer-audit` 不含该段且报告已列缺失。
4. `frontmatter.tools` === `TIERS[seat.tier]` 逐项、同序。
5. `escalation` 编号 = 1…N，N = `steps.length`。
6. 产物内无绝对路径、无时间戳、字符串 `sandbox` 出现 0 次。
7. 校验失败时 `node verify-models.mjs` exit 1；正常 exit 0（S15）。
8. `--out rel-dir` 与 `--out <绝对路径>` 均落在预期目录；前者按脚本目录解析。
9. 开工快照：动工前执行 `git status --short > tmp/agent-criteria-demo/.p1-start-status`；完工后 `git status --short` 与快照相比，只允许新增 `tmp/agent-criteria-demo/**` 与四份文档（含 PRD 回写），`tools/docgen/**`、`agents/**` 必须一行不差。

## 6 已知差异与风险（P1 不修，P2 用数据判）

| # | 差异 | 影响 | 处置 |
|---|---|---|---|
| K1 | 沙箱卡比现役卡多 `## 产出` / `## 权限` / `## 越界处置` 三段 | 卡面变长、token 上升；权限与边界段有重复表述 | 差异报告单列「新增段」；P2 四维评估判去留 |
| K2 | `outputFormat` 校验文案由 observable 派生，措辞弱于现役散文 | 如 `card-exists` 由「卡号必须能在本轮卡片目录里找到」变为「卡号存在」 | 差异报告逐条列前后文；P2「AI 理解」维判定 |
| K3 | `reviewer-audit` 缺 `outputFormat` | 该卡少一段 | 报告「缺失项」；P4 建模时补 |
| K4 | 边界形态三套并存 | 卡面结构不统一 | 这是现役事实（F2–F4）；统一需改 `renderBoundary` 模板，属 P5 范围 |
| K5 | 模型新增 `seat.tier` 与策略档位并存 | 双处表达 | `TIER_MISMATCH` 守卫；P5 删策略后收敛 |

## 7 交付物清单

| 文件 | 动作 |
|---|---|
| `tmp/agent-criteria-demo/models/*-model.json` ×7 | 加 `seat.tier`、`boundary` |
| `tmp/agent-criteria-demo/render/sections.mjs` | 加 `outputFormat` / `boundary` 段、`refExists`、`tools` 改源、编号改序号 |
| `tmp/agent-criteria-demo/render/index.mjs` | 段表加 2 项并定位 |
| `tmp/agent-criteria-demo/render-all.mjs` | 默认落 `sandbox/` + `--out` |
| `tmp/agent-criteria-demo/verify-models.mjs` | 加 5 个校验码 + 失败退出码 |
| `tmp/agent-criteria-demo/diff-report.mjs` | 新增 |
| `tmp/agent-criteria-demo/sandbox/*.md` ×7 + `diff-report.md` | 生成物 |
| `docs/prd/20261111145723-agent-model-pipeline.md` | §9 改「已定」；§6「3 个缺口」→ 4 |
