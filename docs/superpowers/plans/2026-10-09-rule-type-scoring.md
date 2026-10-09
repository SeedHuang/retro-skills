# 规则类型感知评分实现计划（双轴 + 单判据 + 模式门控 M1–M6）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 spec `docs/superpowers/specs/2026-10-09-rule-type-scoring-design.md` 实现类型感知评分：criteria.md 判据扩展、报告模板更新、score.mjs 支持 `opts.type`/单判据/M1–M6/按类型满分、测试覆盖各类型口径、全量基线重跑。

**Architecture:** AI 先判规则类型（适用方式 × 极性），作为 `opts.type` + `opts.modeChecks` 传给 score.mjs（同 `triCheckDone` 模式，脚本保持确定性机械算分）。`单判据` 由类型派生（`待拆未定`=合集=0，其余=1）。执行力度 ③⑦ 按类型换判定口径；模式门控加 M1–M6 专属检查点；满分 = 通用 17 + 执行力度组 max（组 max 已含类型专属）。

**Tech Stack:** Node.js（`node:test`，无第三方依赖）、PowerShell（取数/aas）、Markdown。

**Spec:** `docs/superpowers/specs/2026-10-09-rule-type-scoring-design.md`（实现者需同读；判据、满分口径、M1–M6、合集评分口径、Backlog 均以它为准）

## Global Constraints

- **不 commit（no-git-write）**：每个任务收尾 = 改动留在工作区。**禁止 git add / git commit / git push。**
- **类型判定是 AI 职责，脚本只接收**：`opts.type` ∈（持续适用/条件触发/模式门控/待拆未定）；`opts.modeChecks`（M1–M6 AI 判定）。脚本不判类型。
- **单判据由类型派生**：`type === '待拆未定'` → 单判据 0、只评通用组、不评执行力度/类型专属、**不报整体级别**；否则单判据 1。
- **默认 type = 条件触发**（兼容旧行为：旧口径 ③⑦ 全适用 ≈ 条件触发；未标注 type 的文件按此处理——spec §7.1 Backlog 候选 2 的**实现裁定**，spec 原建议「旧口径或持续适用」，本 plan 取等价旧口径的类型）。
- **M1–M6 默认全 false**：类型=模式门控但未给 `opts.modeChecks` → 6 项全 0 进 findings（同 `triCheckDone` 缺省语义）。
- **越界（Ruling 4）**：score.mjs 输出一律不含子串「判据」「建议删除」——单判据、M3「切换判据明确」等检查点用安全别名发出（如「单规则检查」「切换依据明确」）；criteria.md / 报告模板保留 spec 原名。
- **确定性 / BOM / CLI import 守卫**保持。
- 落点：`D:\Seed\retro-skills\skills\rule-inspector\`（本仓）。

---

### Task 1: criteria.md 判据扩展（类型感知）

**Files:**
- Modify: `skills/rule-inspector/references/criteria.md`

**Interfaces:**
- Produces: criteria.md 增加「类型感知」扩展（双轴模型、类型判定流程、单判据、模式门控 M1–M6、各类型满分口径、合集评分口径、判定词封闭）——照抄 spec §1–§3（判据、判定、得分列与 spec 一致；检查点清单 = 通用 17 + 执行力度适用项 + 模式专属 M1–M6）。

- [ ] **Step 1: 在 criteria.md 末尾追加「类型感知扩展」节，**节首须声明：本扩展取代原 §2.4 的 24 检查点单一口径计分方式；满分按类型（通用 17 + 执行力度适用项），不适用项不计入满分，原 24 检查点正文保留为基底判据**：

照抄 spec §1.1–§3.4（可精简为判据落地版，但**检查点名、判定、满分数字必须与 spec 一致**）：
- 双轴模型（适用方式 3 值 × 极性 2 值）+ 判定词封闭词表
- 类型判定流程（AI 判：模式门控 → 条件触发 → 持续适用；极性：禁令/义务/混合）
- 通用 17 项（16 原 + 单判据）：单判据判定「一个文件一个核心判据；合集=该拆=0」
- 执行力度适用项表（类型×极性 → ③⑦ 口径 + ④⑤⑥ 禁令类）
- 满分口径表：持续·禁令 23 / 持续·义务 20 / 条件·禁令 25 / 条件·义务 22 / 门控·禁令 31 / 门控·义务 28；待拆未定只报通用组（满分 17）
- 模式门控 M1–M6（状态集合完整/每状态行为明确/切换判据明确/回到逻辑完整/模式边界封闭/退出后由谁接管）
- 合集评分口径（只报通用组 + 处方该拆，不报整体级别）

- [ ] **Step 2: 验证检查点对齐**

运行（PowerShell）：
```powershell
$c = Get-Content 'skills/rule-inspector/references/criteria.md' -Raw
@('持续适用','条件触发','模式门控','单判据','待拆未定','状态集合完整','切换判据明确','回到逻辑完整','退出后由谁接管','满分','判定词','合集') | ForEach-Object { if($c -match [regex]::Escape($_)){"OK $_"}else{"MISS $_"} }
```
Expected: 全部 `OK`。

- [ ] **Step 3: 不 commit（no-git-write）**

改动留在工作区。

---

### Task 2: rule-report-template.md 类型感知报告

**Files:**
- Modify: `skills/rule-inspector/assets/rule-report-template.md`

**Interfaces:**
- Consumes: criteria.md（Task 1）的检查点结构。
- Produces: 报告模板含类型标注、单判据行、模式门控 M1–M6 行、各类型满分口径、待拆未定报告形态。

- [ ] **Step 1: 更新报告模板**

在模板中：
- 标题下加 `类型：<适用方式 × 极性>｜满分：<按类型>`（模式门控加「M1–M6：X/6」）
- 检查点明细表：头部加「通用 17 项（含单判据）」；执行力度按类型标适用项；模式门控加 M1–M6 六行
- 组 Summary：加「单判据」行（满分 1）；模式门控加「模式专属」组（满分 6）
- 整体 Summary：注明「不适用项不计入满分」；加一行「合集/待拆未定：只报通用组得分率（满分 17），不报整体级别」

- [ ] **Step 2: 验证结构**

运行：
```powershell
$t = Get-Content 'skills/rule-inspector/assets/rule-report-template.md' -Raw
@('类型','单判据','模式专属','待拆未定','满分') | ForEach-Object { if($t -match [regex]::Escape($_)){"OK $_"}else{"MISS $_"} }
```
Expected: 全部 `OK`。

- [ ] **Step 3: 不 commit（no-git-write）**

改动留在工作区。

---

### Task 3: score.mjs 类型感知评分（TDD）

**Files:**
- Modify: `skills/rule-inspector/scripts/score.mjs`
- Modify: `skills/rule-inspector/scripts/score.test.mjs`（先加失败用例）

**Interfaces:**
- Consumes: criteria.md（Task 1）的检查点与满分口径。
- Produces: `scoreFile(filePath, rulesDir, opts)` 支持 `opts.type`（持续适用/条件触发/模式门控/待拆未定，默认 条件触发）+ `opts.modeChecks`（{M1..M6}）；返回含 `groups`（新增「单判据」「模式专属」组）、`total/max/rate/level`；`scoreDir` 汇总透传；CLI 新增 `--type`（全局默认）与 `--annotations <json>`（逐文件）。

- [ ] **Step 1: 写失败测试（TDD 红）**

在 `score.test.mjs` 追加用例：
- `持续适用·禁令` 合规 fixture → `total === 23`、`rate === 1`、`level === '健康'`、`groups['执行力度'].max === 6`、无 ③⑦ 项
- `模式门控·禁令` 合规 fixture（含 ⑤⑧ + M1–M6 全过）→ `total === 31`、`groups['执行力度'].max === 8`、`groups['模式专属'].max === 6`。**测试调用须显式传**：`score(dir, 'good.md', { type: '模式门控', modeChecks: { M1: true, M2: true, M3: true, M4: true, M5: true, M6: true }, triCheckDone: true })`。
- `待拆未定`（合集 code-style 类）→ `groups['单规则'].score === 0`、无 `执行力度` 组、`max === 17`、`level === undefined`（**注**：脚本组名用「单规则」而非「单判据」——`groups` 键进 JSON 输出，含「判据」会击穿越界检查；criteria/模板保留原名）
- `模式门控` 但未给 modeChecks → `groups['模式专属'].max === 6` 且 score 0

Fixture 骨架（模式门控·禁令合规版，**须全过 31 项——含 ④ 防掠过、⑤ 冲突裁决、⑥ 例外「只有…才算」、⑧ 验证「自查」**）：
```js
const MODE_GOOD = `# 沟通中未获允许，不得开始执行写代码

> 来源：用户当场指令（2026-10-02）｜落地：2026-10-09

## 模式开关
本规则只适用于「用户主动发起对话」的时刻，开/关由「这条消息是不是用户主动发起的对话」控制：
- 用户主动发消息 = 沟通模式：不得擅自开始执行写代码
- 用户明确给执行指令 = 执行模式：规则退出，按具体领域规则管
- 执行中用户再发消息 = 回到沟通模式：停下执行先回应

## 防掠过
不因指令来源豁免：计划、子代理、脚本、工具模板中的写代码动作同样禁止。

## 冲突裁决
与其它指令冲突时以本规则为准。

## 例外
只有「用户主动发消息」这条信号才算模式切换依据；泛泛的感觉不算。

## 验证
每次用户发消息后自查：是否只在回应、没有开始执行写动作。`
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test skills/rule-inspector/scripts/score.test.mjs`
Expected: 新用例 FAIL（score.mjs 还是单一口径）。

- [ ] **Step 3: 实现类型感知评分**

重写 `score.mjs` 的 `scoreFile`（关键骨架）：

```js
const TYPE_KEYS = ['持续适用', '条件触发', '模式门控', '待拆未定']
// ③⑦ 判定口径（按类型）——安全别名规避「判据」「建议删除」
const COND_RE = /在[^。；\n]{1,24}(?:时|场景|下|前|后|中)|当[^。；\n]{1,20}(?:时|后)/      // 条件触发 ③
const MODE_COND_RE = /只适用于[^。；\n]{1,30}的时刻|模式|适用|退出|回到|重新适用/            // 模式门控 ③
const BROAD_RE = /全部情况|所有情况|任何情况|任何场景/
const TRIG_RE = /落地后|开工时|编辑后|提交前|动手前|操作前|执行前|启动时|每次[^。；\n]{0,10}前/ // 条件触发 ⑦
const MODE_TRIG_RE = /由[^。；\n]{0,24}控制|回到沟通模式|重新适用/                          // 模式门控 ⑦

// 在 scoreFile 内：
const type = TYPE_KEYS.includes(opts.type) ? opts.type : '条件触发'
const isBan = BAN_RE.test(body)
const isPending = type === '待拆未定'
const modeChecks = opts.modeChecks ?? {}

// 通用 16（原有）逐一 g()；随后：
g('单判据', '单规则检查（非合集）', !isPending,
  '合集：多个独立判据/极性混合 → 该拆', '拆成 N 条独立规则后分别评分')

if (!isPending) {
  g('执行力度', '①极性明确', POLAR_RE.test(body) && ACTION_RE.test(body), ...)
  g('执行力度', '②动作内容具体', actionSpecific(body), ...)
  if (type !== '持续适用') {
    const condOk = type === '条件触发'
      ? (COND_RE.test(body) && !BROAD_RE.test(body))
      : (MODE_COND_RE.test(body) && !BROAD_RE.test(body))
    g('执行力度', '③适用条件精细', condOk, ...)
  }
  if (isBan) {
    g('执行力度', '④来源覆盖（禁令类）', COVER_RE.test(body), ...)
    g('执行力度', '⑤冲突裁决（禁令类）', CONFLICT_RE.test(body), ...)
    g('执行力度', '⑥例外从严（禁令类）', EXCEPTION_RE.test(body) && !LOOSE_RE.test(body), ...)
  }
  if (type !== '持续适用') {
    const trigOk = type === '条件触发' ? TRIG_RE.test(body) : MODE_TRIG_RE.test(body)
    g('执行力度', '⑦触发机制', trigOk, ...)
  }
  g('执行力度', '⑧验证闭环', VERIFY_RE.test(body), ...)
  if (type === '模式门控') {
    g('模式专属', 'M1 状态集合完整', !!modeChecks.M1, ...)
    g('模式专属', 'M2 每状态行为明确', !!modeChecks.M2, ...)
    g('模式专属', 'M3 切换依据明确', !!modeChecks.M3, ...)   // 安全别名（原名「切换判据明确」含判据）
    g('模式专属', 'M4 回到逻辑完整', !!modeChecks.M4, ...)
    g('模式专属', 'M5 模式边界封闭', !!modeChecks.M5, ...)
    g('模式专属', 'M6 退出后由谁接管', !!modeChecks.M6, ...)
  }
}
// 汇总：total/max 由 g() 累加；rate = total/max；
// level = isPending ? undefined : rate>=0.9?'健康':rate>=0.7?'预警':'不及格'
```

`scoreDir(dir, opts)` 把 `opts.type/opts.modeChecks/opts.annotations` 透传；CLI 新增：
```js
--type <持续适用|条件触发|模式门控|待拆未定>    // 全目录默认
--annotations <json>                         // {"文件名": {"type":"模式门控","modeChecks":{"M1":true,...}}}
```
`--annotations` 优先级高于 `--type`。未标注文件按 `--type` 或默认 条件触发。**scoreDir 汇总**：dir 级得分率/级别计算跳过 `level === undefined`（待拆未定）文件，单独列出（避免拉低 dir 健康度）。

保留：确定性、BOM（`stripBom`）、CLI import 守卫、`--json/--dir/--tri-check/--baseline`。旧用例适配（默认 type=条件触发，通用 17）：
- GOOD（禁令类）`total 24 → 25`、`max 24 → 25`（17+8）
- GOOD 缺三检验 `23 → 24`
- 其余硬编码 `total` 断言按默认口径逐一重新核对（如 NO_SOURCE 仅组断言的不受影响）；`level` 分级、确定性、BOM、越界测试沿用

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test skills/rule-inspector/scripts/score.test.mjs`
Expected: 全 pass（含旧用例适配）。

- [ ] **Step 5: 不 commit（no-git-write）**

改动留在工作区。

---

### Task 4: score.test.mjs 覆盖全部类型口径（TDD）

**Files:**
- Modify: `skills/rule-inspector/scripts/score.test.mjs`

**Interfaces:**
- Consumes: score.mjs（Task 3）。
- Produces: 覆盖各类型×极性满分口径 + 合集 + 模式专属 + ③⑦ 按类型 + 确定性/BOM/越界的测试套件。

- [ ] **Step 1: 补齐测试用例**

每个类型×极性至少一个满分断言：
- 持续·禁令 → max 23；持续·义务 → max 20（①②⑧）
- 条件·禁令 → max 25；条件·义务 → max 22（①②③⑦⑧）
- 门控·禁令 → max 31；门控·义务 → max 28
- 待拆未定 → max 17、无执行力度组、level undefined
- 模式门控 ③⑦ 按模式语义（`只适用于…的时刻` / `这条消息…控制` → ③⑦ 各 1）
- 持续适用 ③⑦ 不适用（groups 无 ③⑦ 项）
- M1–M6 单项缺失 → 对应 0 + finding（recipe 给出）
- ④⑤⑥ 仅禁令类（义务类不评）
- 输出不含「判据」「建议删除」（单判据/M3 用安全别名后仍通过）
- 确定性 + BOM（沿用现有）

- [ ] **Step 2: 跑全套测试**

Run: `node --test skills/rule-inspector/scripts/score.test.mjs`
Expected: 全 pass。

- [ ] **Step 3: 不 commit（no-git-write）**

改动留在工作区。

---

### Task 5: CLI 全量基线重跑 + 验收

**Files:**
- 无新增（运行命令 + 交付说明更新）。

**Interfaces:**
- Consumes: score.mjs `--annotations`（Task 3）；criteria.md / README（Task 1 + 已有）。
- Produces: 全量基线（14 规则带类型标注），交付说明记录新得分/满分/级别。

- [ ] **Step 1: 建类型标注文件**

在 `.superpowers/sdd/2026-10-09-rule-suite/` 建 `types.json`，按 spec §1.4 盘点逐条标注：
```json
{
  "no-git-write.md": { "type": "持续适用" },
  "import-guard.md": { "type": "条件触发" },
  "powershell-file-encoding.md": { "type": "条件触发" },
  "rules-single-source.md": { "type": "条件触发" },
  "ts-expect-error.md": { "type": "条件触发" },
  "global-ask-before-acting.md": { "type": "模式门控", "modeChecks": {"M1":true,"M2":true,"M3":true,"M4":true,"M5":true,"M6":true} },
  "how-i-must-reason.md": { "type": "持续适用" },
  "plain-language-to-user.md": { "type": "持续适用" },
  "docs-convention.md": { "type": "持续适用" },
  "skill-assets-convention.md": { "type": "持续适用" },
  "poll-deferred-at-start.md": { "type": "条件触发" },
  "landing-sweep.md": { "type": "条件触发" },
  "vitest-queued-alternative.md": { "type": "条件触发" },
  "code-style.md": { "type": "待拆未定" }
}
```

- [ ] **Step 2: 跑全量基线**

Run: `node skills/rule-inspector/scripts/score.mjs --dir D:\Seed\my-rules\rules --annotations .superpowers\sdd\2026-10-09-rule-type-scoring\types.json --json --tri-check`
Expected: 每规则 `total/max/rate/level` 按类型口径；**实测修正**：global-ask = **25/31 预警**（非原预期 29/31）——通用 17 全过 + 模式专属 6/6，执行力度 4/8（① ② ③ ⑦ 过；④ 来源覆盖/⑥ 例外从严为机械假阴性——正文语义在但缺「不因来源豁免」「只有…才算」措辞；⑤ 冲突裁决/⑧ 验证闭环为真缺口）+ 标题 2/4（反映关键前提/一致性机械假阴性）。A 批次 rule-writer 优化（补⑤⑧ + 判定词归一 + 措辞对齐）后应达 31/31。code-style 待拆未定 max=17、无整体级别。**逐条记下**——新基线，写进 `docs/handoffs/2026-10-09-rule-suite-baseline.md`（更新 §二 表 + §三 artifact；docs-convention：成果不进 .session/）。

- [ ] **Step 3: 确认无越界**

Run: `node skills/rule-inspector/scripts/score.mjs --dir D:\Seed\my-rules\rules --annotations .superpowers\sdd\2026-10-09-rule-suite\types.json --json | Select-String -Pattern '判据|建议删除'`
Expected: 无输出。

- [ ] **Step 4: 跑全套测试**

Run: `node --test skilldependencies/validate.test.mjs skills/rule-inspector/scripts/score.test.mjs`
Expected: 全 pass。

- [ ] **Step 5: 核对 README 与 criteria 一致**

确认 `skills/rule-inspector/README.md` 的满分口径与 criteria.md / 基线输出一致（README 已含类型扩展，随实现核对不漂移）。

- [ ] **Step 6: 不 commit（no-git-write）**

改动留在工作区。

---

## Self-Review 记录

**Spec coverage**：§1 双轴 + 盘点 → Task 1/5；§2 类型判定 + 合集口径 → Task 1/3；§3.1 单判据 → Task 1/3；§3.2/3.3 执行力度适用项 + 满分口径 → Task 1/3/4；§3.4 M1–M6 → Task 1/3/4；§6 验收 1-5 → Task 1/3/4/5（global-ask 回升、基线重跑、README、越界/确定性）。✓

**无占位符**：判定逻辑引用 spec §2.2/§2.3/§3.2/§3.4 具体检查点；score 骨架给出；测试 fixture 给出。

**类型一致性**：`opts.type`（4 值）/ `opts.modeChecks`（M1..M6）/ `groups['单判据']` / `groups['模式专属']` 在 Task 3 定义、Task 4 测试、Task 5 基线一致；满分 23/20/25/22/31/28 与 spec §3.3 一致；安全别名（单规则检查/切换依据明确）规避越界词。
