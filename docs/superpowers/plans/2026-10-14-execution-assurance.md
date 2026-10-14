# 执行保障实现计划

> **For agentic workers:** 按此计划逐任务实现。步骤用 checkbox（`- [ ]`）跟踪。**本计划不含任何 git 写操作步骤**——每个任务收尾 = 改动留在工作区，最终交用户决定提交方式。

**Goal:** 让「定了的行动点」真正执行到——判据加执行保障维度（X1/X2/X3），认知动作产物化样板（同族清单），两条规则补执行保障声明。

**Architecture:** 执行保障是执行力度组的扩展（叠加轴，仅认知动作型规则适用）。判据权威在 criteria.md（§3 扩展），score.mjs 实现检查点，writing-guide 加自查；review-loop 加同族清单模板挂锁基线；两条规则补产物+必经绑定声明。

**Tech Stack:** Node.js（score.mjs，无外部依赖）、Markdown（判据/模板/规则）。

**Spec:** `docs/superpowers/specs/2026-10-14-execution-assurance-design.md`

## Global Constraints

- 判据单源：判据权威只在 `skills/rule-inspector/references/criteria.md`，writing-guide 不复制判据全文。
- 认知动作是叠加轴：AI 判「含认知动作」时执行力度组追加 X1/X2/X3（满分 +3）；纯机械动作不追加。
- 判定词归一：极性一律用表内词（禁止/不得/不要/必须/应/要/一律），不引入表外词。
- 无 git 写操作：每任务收尾改动留工作区，交用户决定提交。
- 检查点判定：X1/X2/X3 用正则（产物/清单/核销/必经/确认块/前置 等词）+ AI 判认知动作类型（同三检验模式）。

---

### Task 1: criteria.md 加执行保障维度

**Files:**
- Modify: `skills/rule-inspector/references/criteria.md`（§3 末尾加「执行保障维度」小节；§3.5 满分口径表加「认知动作」行）

**Interfaces:**
- Produces: 判据新增 3 检查点（X1/X2/X3）定义 + 认知动作判定 + 满分口径——Task 2 的 score.mjs 按此实现。

- [ ] **Step 1: 在 criteria.md §3.3 单判据之后、§3.4 之前插入「执行保障维度」小节**

插入内容（照抄 spec §3.1，转成判据格式）：

```markdown
### 3.3b 执行保障维度（叠加轴，仅认知动作型规则适用）

**认知动作 vs 机械动作判定（AI 判，同三检验模式）**：
- 机械动作：动作有外部行为触发、做了有可观测效果（跑命令/写文件/调用）——不适用本维度。
- 认知动作：动作是脑内活动、无外部产物（画全貌/深度思考/自省/追根/列同族/算账）——适用。

规则被 AI 判为「含认知动作」（任一关键动作是脑内活动、无外部产物）时，执行力度组**追加**以下 3 个检查点（满分 +3）；判为纯机械动作的规则不追加。

| # | 检查点 | 判定 | 处方 |
|---|---|---|---|
| X1 | 动作产物化 | 认知动作是否声明「可观测产物」（清单/确认块/spec 文件/输出块） | 补产物声明：动作完成后留下什么可查 |
| X2 | 必经路径绑定 | 动作是否声明挂进既有必经路径（skill 核销步骤/流程检查点） | 补绑定：挂进哪条核销步骤 |
| X3 | 触发前置 | 触发点是否在应激时刻（被质疑/出错时）；是则需「前置显式化」声明才给分 | 应激时刻触发 = 需前置显式化（任务开头先声明） |
```

- [ ] **Step 2: 更新 §3.5 满分口径表**

在满分表后加一行说明：

```markdown
> 认知动作叠加：规则被 AI 判为「含认知动作」时，执行力度组追加 X1/X2/X3（满分 +3）；纯机械动作不加。判定方式 = AI 标注（同三检验/单判据模式，脚本只接收）。
```

- [ ] **Step 3: 验证**——重读 criteria.md，确认插入位置正确、无 markdown 表格破损；`node skills/rule-inspector/scripts/score.mjs --file skills/rule-inspector/references/criteria.md --json`（判据文件本身不评分，跑通不报错即可）。

---

### Task 2: score.mjs 实现 X1/X2/X3 检查点

**Files:**
- Modify: `skills/rule-inspector/scripts/score.mjs`

**Interfaces:**
- Consumes: Task 1 的判据定义（X1/X2/X3 语义）。
- Produces: `opts.cognitiveAction`（AI 传入：规则是否含认知动作，布尔）；`X1/X2/X3` 三项进 findings/groups。

- [ ] **Step 1: 加正则常量**（在现有 `VERIFY_RE` 后）

```js
// 执行保障（X1/X2/X3）：认知动作的产物/必经路径/触发前置声明
const PRODUCT_RE = /产物|清单|确认块|输出块|spec 文件|spec文件/        // X1 动作产物化
const PATHBIND_RE = /必经|核销|锁基线|检查点|流程步骤|挂进|前置/       // X2 必经路径绑定（+ X3 前置）
```

- [ ] **Step 2: 加认知动作类型接收与 X1/X2/X3 检查**

在 cli() 的 argv 解析加 `--cognitive` 开关：

```js
else if (argv[i] === '--cognitive') args.cognitive = true
```

在「执行力度」块（`if (isBan)` 之后、`if (hasCond)` ⑦ 之后）追加：

```js
if (args.cognitive) {
  g('执行力度', 'X1动作产物化', PRODUCT_RE.test(body),
    '认知动作未声明可观测产物', '补产物声明：动作完成后留下什么可查（清单/确认块/输出块）')
  g('执行力度', 'X2必经路径绑定', PATHBIND_RE.test(body),
    '认知动作未声明必经路径绑定', '补绑定：挂进哪条核销步骤（skill 检查点/锁基线）')
  g('执行力度', 'X3触发前置', PATHBIND_RE.test(body),
    '触发在应激时刻且未前置显式化', '应激时刻触发需前置显式化：任务开头先声明')
}
```

> 说明：X3 与 X2 共用 PATHBIND_RE（「前置」已在 PATHBIND_RE 内）；语义偏松（只查「有前置词」不查「触发是否在应激时刻」），**判定为候选简化**——触发信号：`--cognitive` 上线后 X3 误报 ≥ 2 次再拆独立正则精确化（判据语义不变）。

- [ ] **Step 3: 满分计算（核证：无需单独改）**——score.mjs 的 max 是 **g() 动态累加**（L146-147 `groups[gname].max += 1`，L260 `reduce` 求和），X1/X2/X3 用 Step 2 的 `g('执行力度', ...)` 注册即自动计入执行力度组 max（+3）——**不需要也不应该单独改 max 计算逻辑**（不存在「查表 +3」的结构）。实现后跑一次评分核对执行力度组 max 正确 +3。

- [ ] **Step 4: 验证**——构造临时认知动作型规则文件测评分：

```bash
node skills/rule-inspector/scripts/score.mjs --file <临时文件> --cognitive --json
```

临时文件内容：含认知动作（如「被质疑时必须先深度思考」）但不含产物/必经声明 → 预期 X1/X2/X3 各 0 分进 findings；补声明后 → 各 1 分。验证后删除临时文件。

### Task 2.5: 调用路径接线（X1/X2/X3 必须被流程触发，否则判据落空）

> 背景：X1/X2/X3 加进判据与脚本后，若没有流程在评分时传 `--cognitive`，它们永远不会被评估——正是「定了执行不到」的复现。本任务保证新检查点被既有流程强制经过。

**Files:**
- Modify: `skills/use-rule-skills/references/flows.md`（评分步骤）
- Modify: `skills/rule-inspector/SKILL.md`（执行顺序）

- [ ] **Step 1: use-rule-skills 评分步骤加认知动作判定**

在 flows.md 的「评分」步骤（新建/优化/拆分共用的 `score.mjs` 调用）补一句：

> 评分前先判「规则是否含认知动作」（任一关键动作是脑内活动、无外部产物：画全貌/深度思考/自省/追根/列同族/算账）→ 是则 `score.mjs` 传 `--cognitive`，否则不传。判据见 rule-inspector criteria §3.3b。

- [ ] **Step 2: rule-inspector 执行顺序加认知动作标注**

在 rule-inspector SKILL.md 执行顺序第 1 步（跑评分）补：

> 跑评分前先 AI 判规则是否含认知动作（判据 criteria §3.3b）→ 是则 `score.mjs` 传 `--cognitive`；并把「认知动作型 / 机械动作型」判定写进报告（可复算证据）。

- [ ] **Step 3: 验证**——按 flows.md 流程对 core-working-principles 评分，确认 X1/X2/X3 出现（认知动作型）；对 no-git-write（机械动作型）评分确认 X1/X2/X3 不出现。

---

### Task 3: writing-guide.md 加执行保障自查项

**Files:**
- Modify: `skills/rule-writer/references/writing-guide.md`

- [ ] **Step 1: 执行力度 8 项自查表后加执行保障自查**

在 §二 自查表末尾追加：

```markdown
### 执行保障自查（认知动作型必做；判据见 criteria §3.3b，不复制全文）

规则含认知动作（画全貌/深度思考/自省/追根/列同族/算账等脑内动作）时，写完后自查：

| # | 自查问题 |
|---|---|
| X1 | 每个认知动作是否声明了「可观测产物」（做完留下什么可查：清单/确认块/输出块）？ |
| X2 | 是否声明了「必经路径绑定」（挂进哪条核销步骤：skill 检查点/锁基线）？ |
| X3 | 触发点是否在应激时刻（被质疑/出错）？若是，是否声明了「前置显式化」（任务开头先声明）？ |

缺任一 = 该动作仍可能被静默跳过 = 草稿不合格，回写。
```

- [ ] **Step 2: 验证**——重读 writing-guide.md，确认表格完好、无判据全文复制（只给自查问题）。

---

### Task 4: review-loop 加修复前同族清单 + 核销

**Files:**
- Create: `skills/review-loop/assets/fix-checklist-template.md`
- Modify: `skills/review-loop/references/loop.md`（修复纪律 A1）

**Interfaces:**
- Produces: 修复流程新增「同族清单 + 逐项核销」检查点（挂锁基线前置）。

- [ ] **Step 1: 新建同族清单模板** `skills/review-loop/assets/fix-checklist-template.md`

```markdown
# 修复前同族清单（FIX CHECKLIST）

> 认知动作「列全同族」的产物化：修复任何 bug 前先列清单，修完逐项核销。
> 挂锁基线前置——没有清单 + 核销记录 = 修复不算完成，不锁基线。

## 同族清单（修复前填）

| 维度 | 受影响位置 | 判定 |
|---|---|---|
| 分支路径 | 该逻辑所有 if/else / switch / early return 分支 | 覆盖了吗 |
| 调用点 | 谁在调用这个函数/逻辑 | 每个调用方都影响吗 |
| 读写处 | 同一字段/参数的所有读写位置 | 都处理了吗 |
| 边界 | 空值 / 不存在 / 越界 / 取反 | 都枚举了吗 |

## 逐项核销（修复后填）

| # | 清单项 | 处置（已处理 / 不适用） | 理由（不适用必填） |
|---|---|---|---|
| 1 | 分支路径：… | | |
| 2 | 调用点：… | | |

**核销判据**：清单上有未标处置的项 = 修复未完成，不锁基线。
```

- [ ] **Step 2: loop.md A1 修复纪律加同族清单步骤**

在 A1「修复前列全失败面」处追加强制产物要求（接「读→产出」闭环，不写「读一下」类指令）：

> 修复前必须先按 `assets/fix-checklist-template.md` 填同族清单（分支路径/调用点/读写处/边界四维），修复后逐项核销（已处理/不适用+理由）——**缺清单或核销 = 修复不算完成，不锁基线**；锁基线时 checklist 产物随 commit 一起。

- [ ] **Step 3: 验证**——重读 loop.md，确认 A1 处已接「读→产出」闭环（读完模板必须产出清单+核销才合格）；check.mjs 对 assets/ 模板 0 findings。

---

### Task 5: core-working-principles 补执行保障声明

**Files:**
- Modify: `rules/core-working-principles.md`（事前三步节）

- [ ] **Step 1: 第一步画全貌补产物 + 必经绑定**

在「### 第一步：画全貌」末尾追加：

```markdown
**产物（前置必经）**：动手前必须先输出「全貌确认」块（本质/同族/边界/验收/影响面 + 联动四问答案）——该块是动笔前的前置检查点，未输出不得动笔；随任务记录可查。
```

> 说明：声明须含「前置」与「必经」语义（供 X2/X3 判定命中）——「前置」= 触发前置显式化（应激时刻触发时先声明）；「必经」= 必经路径绑定。

- [ ] **Step 2: 重评验证**

```bash
node skills/rule-inspector/scripts/score.mjs --file rules/core-working-principles.md --cognitive --json
```

预期：X1/X2/X3 各 1 分（产物声明「全貌确认块」命中 PRODUCT_RE、「必经」命中 PATHBIND_RE）。

---

### Task 6: how-i-must-reason 补执行保障声明

> ⚠️ **前置条件**：`rules/how-i-must-reason.md` 当前是旧版（「我的推理纪律」），优化草稿（24/25 健康）在草稿箱未定稿。本任务**前提 = how-i-must-reason 先定稿**（采纳草稿或重写落地）——补声明必须落在定稿版上，不能在旧版上补（否则优化内容与声明分离）。定稿动作由用户发起（草稿在箱中，用户未采纳）。

**Files:**
- Modify: `rules/how-i-must-reason.md`（定稿版，回答前验证自检节）

- [ ] **Step 1: 回答前验证自检补产物 + 必经绑定**

在「## 回答前验证自检」节末尾追加：

```markdown
**产物（必经）**：回答带断言的结论时，必须附可复核来源（文档位置 / 命令输出 / 源码行号）——产物缺失 = 未完成；验证自检是回答前必经。
```

- [ ] **Step 2: 重评验证**

```bash
node skills/rule-inspector/scripts/score.mjs --file rules/how-i-must-reason.md --cognitive --json
```

预期：X1/X2/X3 各 1 分。

---

### Task 7: 全量验证

**Files:** 无（只跑验证）

- [ ] **Step 1: 全量评分**

```bash
node skills/rule-inspector/scripts/score.mjs --dir rules --json
```

预期：认知动作型规则（core-working-principles / how-i-must-reason）X1/X2/X3 有分；机械动作型规则（如 no-git-write）不受影响。

- [ ] **Step 2: check.mjs**

```bash
node skills/review-loop/scripts/check.mjs
```

预期：0 findings。

- [ ] **Step 3: 相关测试**——跑 review-loop / rule-inspector 相关测试（如有）；受限环境 stuck 时按 `vitest-queued-alternative` 规则改用 tsc/GetDiagnostics 替代验证。

- [ ] **Step 4: tracked 案例回归**——按新清单流程口头走一遍 tracked 修复（分支路径维度 → 追加分支 + 创建分支两条路径都在清单上），确认创建分支不再漏。
