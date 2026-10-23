# 执行力度矩阵施工计划（执行力度矩阵 spec 落地）

> 本计划实现 `docs/superpowers/specs/2026-10-20-execution-assurance-matrix-design.md`（已定稿）。测试用例文件：`docs/superpowers/specs/2026-10-20-execution-assurance-matrix-design-testcase.md`（50 条，TC-001~050）。
> 施工顺序：Task 1→9 串行；每任务收尾 = 改动留在工作区（全局规则「全局 Git 写操作禁令」，plan 不含 git 写操作）。

## 前置裁决（§6 开放问题，用户已确认方向）

| # | 开放问题 | 裁决 |
|---|---|---|
| 1 | 共享项载体落哪 | `tools/execution-matrix/` 脚本 + 文档索引双层（脚本机械查 A 结构项，AI 判 A 语义项/B/C 组走 annotations） |
| 2 | 实测记录/评级落点 | 模式表文件本身即登记处（每轮实测补行）；行结构含「实测记录数 / 最近 N 次零回归」字段；评级由记录数按固定映射现算 |
| 3 | reviewer-audit 初评 | 施工后先全判，存量 0 项记入模式表，不阻塞 S3/S4 |
| 4 | ⑦ 升格 + N 阈值 | ⑦ 暂留 skillAndRuleShared（agent `when` 是数据字段 vs rule/skill 是正文语义段，不同构，按 TC-046 判据）；N=3 |

## Global Constraints

- 判据正文单源：A/B/C 组判据正文在 `tools/execution-matrix/criteria.md`（单源文件），rule-inspector criteria.md / skill-authoring-convention 只加归桶索引（不复制判据）
- 共享项零重复：allShared / 两两 shared 定义一次、各 checklist 引用；同一检查项机械上恰有一处「当前归属」
- annotations 三态：`pass` / `fail: <理由>` / `pending`；禁止压成布尔；键命名 `agent 卡名:判定项名`；与 rule-inspector 共用 `rules/.inspector-annotations.json`
- 评级不持久化：每次按模式表记录数现算；高风险永不免验
- 模式表不复制进判据正文（R6）
- 共享项变更走「改前 vs 改后 + 用户确认」硬闸门（R7）
- A/B/C 组只查卡文本，不查运行时（R2）；运行时验证归 parliament/review-loop（R3）

## 文件结构

| 文件 | 职责 |
|---|---|
| `tools/execution-matrix/criteria.md` | agent 判据正文单源（A 结构 5 项 + A 语义 2 项 + B 4 项 + C 4 项，每项四要素） |
| `tools/execution-matrix/check-agent.mjs` | A 结构项机器检查脚本（A3-A7 可 grep 断言；A1/A2 走 annotations 接收） |
| `tools/execution-matrix/check-agent.test.mjs` | check-agent.mjs 的单元测试（副本内断言） |
| `tools/execution-matrix/buckets.mjs` | 归桶索引数据（五桶枚举 + 每项归属） |
| `tools/execution-matrix/check-buckets.mjs` | 归桶零重复扫描脚本（每检查项恰一处「当前归属」） |
| `tools/execution-matrix/check-buckets.test.mjs` | 归桶扫描的单元测试 |
| `tools/execution-matrix/pattern-table.md` | 执行力度模式表（种子 ≥5 行 + 记录数字段） |
| `tools/execution-matrix/rating.mjs` | 置信度评级现算脚本（读模式表记录数 → 档位） |
| `tools/execution-matrix/rating.test.mjs` | 评级脚本单元测试 |
| `tools/execution-matrix/README.md` | 与 parliament/review-loop 边界声明 + 使用说明 |
| `scripts/check-all.mjs` | 追加归桶断言 + check-agent 挂钩（改） |
| `skills/rule-inspector/references/criteria.md` | 追加归桶索引指针（不复制判据）（改） |
| `rules/skill-authoring-convention.md` | 追加归桶索引指针（不复制判据）（改） |
| `rules/.inspector-annotations.json` | 追加 agent 判定键（三态）（改） |
| `docs/after/20261017210609-pending-work-overview.md` | 线 E 瘦身：A/B/C 细节并入 criteria.md 后删重复（改） |
| `tools/docgen/README.md` 或 `docs/superpowers/plans/` | 归桶索引落地说明（⑦ 裁决 + N=3 记录） |

---

### Task 1: 归桶索引数据 + 零重复扫描脚本

**Files:**
- Create: `tools/execution-matrix/buckets.mjs`
- Create: `tools/execution-matrix/check-buckets.mjs`
- Create: `tools/execution-matrix/check-buckets.test.mjs`

**Interfaces:**
- Produces: `BUCKETS`（五桶枚举 + 每项「当前归属」）、`checkBuckets()`（返回 `{ok, findings[]}`）

- [ ] **Step 1: 写 failing test**

```js
// check-buckets.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { BUCKETS, checkBuckets } from './check-buckets.mjs';

test('五桶枚举齐全：allShared / 两两 shared ×3 / 独有', () => {
  const names = new Set(BUCKETS.map((b) => b.name));
  assert.ok(names.has('allShared'));
  assert.ok(names.has('agentAndSkillShared'));
  assert.ok(names.has('agentAndRuleShared'));
  assert.ok(names.has('skillAndRuleShared'));
});

test('每检查项机械上恰有一处「当前归属」', () => {
  const { findings } = checkBuckets();
  assert.equal(findings.filter((f) => f.code === 'DuplicateBucket').length, 0);
  const { ok } = checkBuckets();
  assert.equal(ok, true);
});

test('两两桶当前判定无交集：内容为空', () => {
  const empty = BUCKETS.filter((b) => b.name === 'agentAndSkillShared' || b.name === 'agentAndRuleShared');
  assert.ok(empty.every((b) => b.items.length === 0));
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tools/execution-matrix/check-buckets.test.mjs`
Expected: FAIL（`check-buckets.mjs` 不存在，Cannot find module）

- [ ] **Step 3: 实现 buckets.mjs + check-buckets.mjs**

```js
// buckets.mjs —— 归桶索引数据（§4 定稿）
export const BUCKETS = [
  { name: 'allShared', items: [] }, // ⑦ 候选升格目标，升格前不定义
  { name: 'agentAndSkillShared', items: [] }, // 已裁决无交集
  { name: 'agentAndRuleShared', items: [] }, // 已裁决无交集
  { name: 'skillAndRuleShared', items: ['来源覆盖④', '冲突裁决⑤', '例外从严⑥', '验证闭环⑧'] },
  { name: 'rule 独有', items: ['通用17', '执行力度①②③', 'X1/X2/X3'] },
  { name: 'skill 独有', items: ['跨技能路径引用', '脚本守卫', '目录语义'] },
  { name: 'agent 独有', items: ['A组7项', 'B组4项', 'C组4项'] },
];
```

```js
// check-buckets.mjs
import { BUCKETS } from './buckets.mjs';

export function checkBuckets() {
  const findings = [];
  const seen = new Map();
  for (const bucket of BUCKETS) {
    for (const item of bucket.items) {
      if (seen.has(item)) {
        findings.push({ code: 'DuplicateBucket', item, bucket: bucket.name, also: seen.get(item) });
      } else {
        seen.set(item, bucket.name);
      }
    }
  }
  return { ok: findings.length === 0, findings };
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test tools/execution-matrix/check-buckets.test.mjs`
Expected: PASS（3 个用例全绿）

- [ ] **Step 5: 改动留在工作区**

不执行 git 写操作。收尾跑 `npm run check`（此时新脚本未被 check-all 引用，不应引入红）。

---

### Task 2: agent 判据正文单源（criteria.md，A/B/C 三组 15 项）

**Files:**
- Create: `tools/execution-matrix/criteria.md`

**Interfaces:**
- Produces: `criteria.md`（15 项判据，每项四要素：名称/判定对象/判定方式（机器查 or AI 判）/落位）

- [ ] **Step 1: 起草判据正文（从 spec R5 + testcase 判例转写）**

写 `tools/execution-matrix/criteria.md`，15 项判据：

**A 结构项（机器查，可 grep）：**
- A3 必答清单存在：对象 = 卡「固定必问清单」节；判定 = 有固定清单表格且每条有「必答/必问」列头（兼容两种模板形态）；落位 = `check-agent.mjs`
- A4 必答闭环：对象 = 清单节；判定 = 含「缺答/只答固定清单 = 不合格」任一字样；落位 = `check-agent.mjs`
- A5 证据约束：对象 = 通用纪律节/核对项表；判定 = 含「证据可复算」或「证据栏」约束；落位 = `check-agent.mjs`
- A6 边界声明：对象 = 卡「边界」节；判定 = 渲染后含 `## 边界` 节；落位 = `check-agent.mjs`
- A7 输出格式指定：对象 = 卡「输出格式」节；判定 = 含 `## 输出格式` 块（outputKind 对应）；落位 = `check-agent.mjs`

**A 语义项（AI 判 + annotations 三态）：**
- A1 职责单一定位：对象 = identity；判定 = 单一职责（非多主体）；落位 = `rules/.inspector-annotations.json`（键 `agent:A1`）
- A2 触发信号可判：对象 = description when；判定 = 含具体触发条件枚举（非「需要时/酌情」）；落位 = annotations（键 `agent:A2`）

**B 组（AI 判 + annotations 三态）：**
- B1 identity 真实 / B2 fixedList 判据可判 / B3 职责边界一致 / B4 自由探索触发；落位 = annotations（键 `agent:B1`~`agent:B4`）

**C 组（AI 判 + annotations 三态）：**
- C1 固定清单逐条自证 / C2 自由探索逐条自证 / C3 结论可复算 / C4 自证贯穿不只在开头；落位 = annotations（键 `agent:C1`~`agent:C4`）

- [ ] **Step 2: 核对与 spec R5 一致**

自查：15 项名称/判定对象/判定方式与 spec R5 逐字一致；A 结构项 vs A 语义项划分正确；模板形态适配已含（A3/A4 判定词兼容两模板）。

- [ ] **Step 3: 改动留在工作区**

收尾跑 `npm run check` 确认无红。

---

### Task 3: A 结构项机器检查脚本（check-agent.mjs）

**Files:**
- Create: `tools/execution-matrix/check-agent.mjs`
- Create: `tools/execution-matrix/check-agent.test.mjs`

**Interfaces:**
- Consumes: `tools/docgen/components/renderAgent.mjs`（`renderByName`）
- Produces: `checkAgent(name)` → `{ok, findings[]}`（A3-A7 结构断言 + A1/A2 annotations 接收）

- [ ] **Step 1: 写 failing test**

```js
// check-agent.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAgent } from './check-agent.mjs';

test('reviewer-audit 渲染卡：A 结构项 A3-A7 全过', () => {
  const { ok, findings } = checkAgent('reviewer-audit');
  assert.equal(ok, true, JSON.stringify(findings));
});

test('缺必答清单卡 → A3 判失败', () => {
  const card = '---\nname: x\n---\n\n# 角色：X\n\n## 你是谁\nX。\n';
  const { findings } = checkAgentFromText(card);
  assert.ok(findings.some((f) => f.code === 'A3'));
});

test('A1/A2 走 annotations 接收（非脚本内机器判）', () => {
  const { a1a2From } = checkAgent('reviewer-audit');
  assert.equal(a1a2From, 'annotations'); // 必须读 .inspector-annotations.json，不得脚本自判
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tools/execution-matrix/check-agent.test.mjs`
Expected: FAIL（check-agent.mjs 不存在）

- [ ] **Step 3: 实现 check-agent.mjs**

```js
// check-agent.mjs —— A 组检查：结构项 A3-A7 机器查，语义项 A1/A2 走 annotations 接收
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderByName } from '../docgen/cli.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ANNOTATIONS = join(ROOT, 'rules', '.inspector-annotations.json');

function section(card, heading) {
  const lines = card.split('\n');
  const idx = lines.findIndex((l) => l.trim().startsWith(heading));
  return idx >= 0 ? lines.slice(idx).join('\n') : '';
}

// A3-A7 结构断言（兼容两种模板形态）
export function checkStruct(card) {
  const findings = [];
  const fixedList = section(card, '## 固定必问清单');
  if (!fixedList || !/^\| # \| (必答|必问) \|/m.test(fixedList)) findings.push({ code: 'A3' });
  if (!/(缺答|只答固定清单)[^。]*= 不合格/.test(card)) findings.push({ code: 'A4' });
  if (!/(证据可复算|证据栏)/.test(card)) findings.push({ code: 'A5' });
  if (!section(card, '## 边界')) findings.push({ code: 'A6' });
  if (!section(card, '## 输出格式')) findings.push({ code: 'A7' });
  return findings;
}

export function readAnnotations() {
  if (!existsSync(ANNOTATIONS)) return {};
  return JSON.parse(readFileSync(ANNOTATIONS, 'utf8'));
}

// A1/A2 从 annotations 接收（三态非 pending）；不得脚本自判
export function checkAgent(name) {
  const card = renderByName(name);
  const struct = checkStruct(card);
  const ann = readAnnotations();
  const a1 = ann[`${name}:A1`] ?? 'pending';
  const a2 = ann[`${name}:A2`] ?? 'pending';
  const semantic = [
    { key: `${name}:A1`, code: 'A1', state: a1 },
    { key: `${name}:A2`, code: 'A2', state: a2 },
  ];
  const semanticFail = semantic.filter((s) => s.state === 'pending' || s.state.startsWith('fail'));
  return {
    ok: struct.length === 0 && semanticFail.length === 0,
    findings: [...struct, ...semanticFail.map((s) => ({ code: s.code, state: s.state }))],
    a1a2From: 'annotations',
  };
}

export function checkAgentFromText(card) {
  const struct = checkStruct(card);
  return { ok: struct.length === 0, findings: struct };
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test tools/execution-matrix/check-agent.test.mjs`
Expected: PASS（3 用例；第 1 个依赖 reviewer-audit 卡结构，第 2 个用文本构造）

- [ ] **Step 5: 改动留在工作区**

收尾 `npm run check`。注意：`checkAgent('reviewer-audit')` 依赖 `renderByName`——先确认 reviewer-audit 是已拆槽席（state=replaced），可渲染。

---

### Task 4: annotations 三态写入 + 挂进 check-all

**Files:**
- Modify: `rules/.inspector-annotations.json`（追加 agent 判定键示例，三态）
- Modify: `scripts/check-all.mjs`（追加归桶断言 + check-agent 挂钩）

**Interfaces:**
- Consumes: `check-buckets.mjs` 的 `checkBuckets()`、`check-agent.mjs` 的 `checkAgent()`

- [ ] **Step 1: annotations 追加 agent 键（三态）**

`rules/.inspector-annotations.json` 追加（示例，A1/A2 对 reviewer-audit 的初判）：

```json
{
  "core-working-principles.md": { "cognitive": true, "x3Done": true },
  "how-i-must-reason.md": { "cognitive": true, "x3Done": true, "x2Carrier": true },
  "data-support-triple.md": { "cognitive": true, "x3Done": true, "x2Carrier": true },
  "reviewer-audit:A1": "pass",
  "reviewer-audit:A2": "pass"
}
```

- [ ] **Step 2: check-all.mjs 追加归桶断言 + check-agent 挂钩**

在 `scripts/check-all.mjs` 追加一段（对齐既有 docgen gate 模式）：

```js
// ③ 执行力度矩阵：归桶零重复 + A 结构项
import { checkBuckets } from '../tools/execution-matrix/check-buckets.mjs';
import { checkAgent } from '../tools/execution-matrix/check-agent.mjs';

const bucketRes = checkBuckets();
if (!bucketRes.ok) {
  console.error(`[execution-matrix] 归桶零重复失败：${JSON.stringify(bucketRes.findings)}`);
  process.exitCode = 1;
}
const agentRes = checkAgent('reviewer-audit');
if (!agentRes.ok) {
  console.error(`[execution-matrix] reviewer-audit A 组检查失败：${JSON.stringify(agentRes.findings)}`);
  process.exitCode = 1;
}
```

- [ ] **Step 3: 验证**

Run: `npm run check`
Expected: exit 0（全绿；新增归桶/agent 断言通过）；baseline N/N 仍绿

- [ ] **Step 4: 改动留在工作区**

---

### Task 5: 执行力度模式表（种子 ≥5 行 + 记录数字段）

**Files:**
- Create: `tools/execution-matrix/pattern-table.md`

**Interfaces:**
- Produces: `pattern-table.md`（模式表，行结构 = 场景/好/不好/来源/实测记录数/最近 N 次零回归）

- [ ] **Step 1: 写模式表（种子 ≥5 行）**

从仓库已有正反例提取 ≥5 行种子，每行含「实测记录数 / 最近 N 次零回归」字段（评级取数对象）：

| 场景 | 好（什么情况下有效） | 不好（什么情况下失效） | 来源（文件:行号） | 实测记录数 | 最近 N 次零回归 |
|---|---|---|---|---|---|
| 宾语可枚举 | 对象能被数出来时直接匹配不掠过 | 对象是抽象类别需归类时掠过 | `rules/no-git-write.md` 防掠过节 | 3 | 3 |
| 「只有…才算例外」 | 例外能框死时 | 例外无法枚举时硬框误伤 | rule-inspector criteria.md §2.4 ⑥ | 2 | 2 |
| 触发信号可观测 | 有明确时机词时 | 触发需语义归类时 | criteria.md §2.4 ⑦ | 3 | 3 |
| 认知动作带去处 | 动作有自然产物时 | 产物是会话载体时应标 x2Carrier | criteria.md §3.3b X1/X2 | 2 | 2 |
| 证据栏空=不通过 | 机械可查项 | 语义判断项须 AI 判+判据化 | 审计铁律 / 本 spec C 组 | 1 | 1 |

- [ ] **Step 2: 核对种子 ≥5 行 + 来源可复算**

自查：行数 ≥5；每行「来源」列含文件路径（可 `Test-Path` 验证）。

- [ ] **Step 3: 改动留在工作区**

---

### Task 6: 置信度评级现算脚本（rating.mjs）

**Files:**
- Create: `tools/execution-matrix/rating.mjs`
- Create: `tools/execution-matrix/rating.test.mjs`

**Interfaces:**
- Consumes: `pattern-table.md`（读记录数）
- Produces: `rate(scenario)` → `{level: 'high'|'mid'|'low', records, zeroRegression}`

- [ ] **Step 1: 写 failing test**

```js
// rating.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { rateFromRecords } from './rating.mjs';

test('记录 ≥3 且零回归 → high', () => {
  assert.equal(rateFromRecords({ records: 3, zero: 3 }).level, 'high');
});
test('有记录但不全 → mid', () => {
  assert.equal(rateFromRecords({ records: 1, zero: 1 }).level, 'mid');
});
test('无记录 → low（必须完整验收）', () => {
  assert.equal(rateFromRecords({ records: 0, zero: 0 }).level, 'low');
});
test('N 阈值 = 3（§6 裁决）', () => {
  const N = 3;
  assert.equal(rateFromRecords({ records: 2, zero: 2 }).level, 'mid'); // 2 < 3 不足 high
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tools/execution-matrix/rating.test.mjs`
Expected: FAIL（rating.mjs 不存在）

- [ ] **Step 3: 实现 rating.mjs**

```js
// rating.mjs —— 置信度评级现算（N=3，不持久化）
export const N = 3;
export function rateFromRecords({ records, zero }) {
  if (records <= 0) return { level: 'low', records, zeroRegression: zero };
  if (records >= N && zero === records) return { level: 'high', records, zeroRegression: zero };
  return { level: 'mid', records, zeroRegression: zero };
}
// 高风险永不免验由调用方强制：rate() 只出档位，高风险场景调用方不得降档
export const HIGH_RISK_NEVER_SKIP = true;
```

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test tools/execution-matrix/rating.test.mjs`
Expected: PASS（4 用例）

- [ ] **Step 5: 改动留在工作区**

---

### Task 7: 归桶索引指针挂进 rule/skill 载体 + 落地说明

**Files:**
- Modify: `skills/rule-inspector/references/criteria.md`（追加归桶索引指针，不复制判据）
- Modify: `rules/skill-authoring-convention.md`（追加归桶索引指针，不复制判据）
- Create: `tools/execution-matrix/README.md`（边界声明 R2/R3 + ⑦ 裁决/N=3 落地说明）

- [ ] **Step 1: criteria.md 追加归桶索引指针**

在 `skills/rule-inspector/references/criteria.md` 追加（不复制判据正文）：

```markdown
## 归桶索引

本判据所属检查项的归桶归属（allShared / 两两 shared / 独有）见 `tools/execution-matrix/buckets.mjs`（单源，不在此复制）。共享项变更走「改前 vs 改后 + 用户确认」硬闸门（spec R7）。
```

- [ ] **Step 2: skill-authoring-convention.md 追加归桶索引指针**

同理追加一行指针（指向 buckets.mjs）。

- [ ] **Step 3: README.md 写边界声明 + 落地说明**

`tools/execution-matrix/README.md`：
- 本目录职责（归桶索引 + A 结构检查 + 模式表 + 评级）
- R2/R3 边界声明（A/B/C 组只查卡文本，运行时归 parliament/review-loop）
- ⑦ 裁决记录（暂留 skillAndRuleShared，理由：agent `when` 是数据字段 vs rule/skill 是正文语义段，不同构，按 TC-046）
- N=3 记录

- [ ] **Step 4: 改动留在工作区**

收尾 `npm run check` 确认无红。

---

### Task 8: pending-work-overview 线 E 瘦身（判据细节并入 criteria.md 后删重复）

**Files:**
- Modify: `docs/after/20261017210609-pending-work-overview.md`（线 E 的 A/B/C 判据细节表删除，改为指向 `tools/execution-matrix/criteria.md`）

- [ ] **Step 1: 线 E 判据细节瘦身**

`20261017210609-pending-work-overview.md` 线 E 中 A/B/C 三组 15 项判据的完整判定表（「agent 专属可执行性判据（草案 v2）」一节）删除，改为一行指针：判据正文单源 = `tools/execution-matrix/criteria.md`（spec §7 交付物 2）。保留：盘点表、模式表、评级、职责分离等仍活的内容。

- [ ] **Step 2: 核对「探索稿不是第二份真相」**

自查：判据细节只留一处（criteria.md）；pending-work-overview 不再含 A/B/C 判定表（防两处漂移，对齐 R6）。

- [ ] **Step 3: 改动留在工作区**

---

### Task 9: 全量验收（testcase 落地）

**Files:**
- Test: 全仓 `npm run check`
- 验收: `tools/execution-matrix/` 全部脚本

- [ ] **Step 1: 全量单测**

Run: `npm run check`
Expected: exit 0（全部绿；归桶断言 + check-agent 挂钩已生效）；baseline N/N 绿

- [ ] **Step 2: 归桶验收（TC-001~008 对应）**

Run: `node --test tools/execution-matrix/check-buckets.test.mjs`
Expected: PASS（3 用例 = TC-001/002/003 归桶零重复 + TC-004 负例语义）

- [ ] **Step 3: A 组验收（TC-009~016 对应）**

Run: `node --test tools/execution-matrix/check-agent.test.mjs`
Expected: PASS（TC-009 结构项全过 + TC-010~012 缺清单/边界/格式判失败 + TC-013/014 A1/A2 走 annotations）

- [ ] **Step 4: 评级验收（TC-030~035 对应）**

Run: `node --test tools/execution-matrix/rating.test.mjs`
Expected: PASS（TC-030/031 三档+硬约束 + TC-032/033 低评/高风险不豁免 + TC-034 可复算 + TC-035 取数一致）

- [ ] **Step 5: 模式表验收（TC-036~040 对应）**

Run: `node -e "const t=require('fs').readFileSync('tools/execution-matrix/pattern-table.md','utf8'); const rows=t.split('\n').filter(l=>l.startsWith('|')).length-1; if(rows<5) throw new Error('种子<5'); console.log('模式表种子行数:', rows)"`
Expected: 输出 ≥5

- [ ] **Step 6: 边界验收（TC-028/029/041~043 对应）**

自查 README.md R2/R3 边界声明在（TC-028 越界判定 = 检查对象是卡文本非运行时）；「我检查过了」不算证据声明在（TC-042）。

- [ ] **Step 7: 改动留在工作区，交付验收报告**

汇总：npm run check 全绿 + 4 个脚本测试全过 + 模式表种子 ≥5。报告写进当次任务记录。**不执行 git 写操作。**

---

## Self-Review 核对

- **Spec 覆盖**：R1（归桶命名→Task1）、R2/R3（边界/职责分离→Task7 README）、R4（评级→Task6）、R5（A/B/C 判据→Task2/3）、R6（模式表不复制→Task5）、R7（共享项硬闸门→Task7 指针）、R8（annotations 三态→Task4）全部有任务。§5 验收 6 锚点全有对应验收（Task9）。§7 交付物 5 件全产出。§6 开放问题 4 条全裁决（前置裁决表）。✓
- **Placeholder 扫描**：无 TBD/TODO；每步含具体代码/命令。✓
- **Type 一致性**：`checkBuckets()` / `checkAgent()` / `rateFromRecords()` 在 Task1/3/6 定义、Task4/9 引用，签名一致。✓
- **testcase 映射**：机器可判用例（TC-001~008 归桶、TC-009~016 A 组、TC-030~035 评级、TC-036~040 模式表）对应脚本测试；人工/AI 用例（TC-017~027 B/C 组、TC-028/029/041~043 边界）由施工时 AI 判 + annotations + README 声明覆盖。✓
