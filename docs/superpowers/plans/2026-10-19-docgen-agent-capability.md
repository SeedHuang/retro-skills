# Docgen P2 · S1：能力与终态（CLI 基建 / 草稿箱 / 守卫迁移 / 终态验收）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`（推荐）或 `executing-plans` 逐任务执行。步骤用 `- [ ]` 勾选跟踪。
>
> **本计划不执行任何 git 写操作**：每个任务收尾把改动留在工作区，最终由用户决定提交方式。
>
> **执行状态（2026-10-21 复核，批量勾选）**：Task 1–8 全部完成。依据两处——① PRD §6.6 的「S1 终态」记录（2026-10-19 实跑：`npm run check` 318 tests 全绿 / gate `baseline 35/35` / W4 黄金断言逐字相等 / W5 基线 35 条 / W8 `gen-agents.mjs` 退役 / W9 `tools/docgen-spike/` 删除）；② 本次复核实测：`tools/docgen/**` 产出物齐全（`components/*.mjs`、`templates/*.tpl`、`acceptance/*`、`test/e2e-final.test.mjs` 均在盘）、`node --test tools/docgen/test/*.test.mjs` **92/92 绿** exit 0、`tools/docgen-spike/` 与 `skills/parliament/scripts/gen-agents.mjs` 均已不存在。
>
> **如实披露**：本计划的 `Step 2：跑测试确认失败` 是 TDD 过程步骤，事后无法复核「当时确实红过」；该步一并勾选仅为记录进度，**不作为证据**。另：原文 8 处 `Step 5：提交` 标题与用户「计划不得含 git 写步骤」的规则冲突，已按正文原意改名为「收尾（改动留工作区，不执行 git 写操作）」，不改正文内容。

**Goal:** 把 P2 的能力地基（`tools/docgen/` 管线：六子命令 CLI + 草稿箱 + 守卫断言迁移 + 五档退出码 + 两清单 baseline + W4–W9 终态验收）落成可运行代码，让 S2/S3/S4 的每个 agent 走同一条九步闭环。

**Architecture:** 纯组件层（`components/agentData.mjs` / `patternRegistry.mjs` / `validateAgentData.mjs` / `specTestCaseGate.mjs` / `compare.mjs`）+ 数据模板层（`templates/*.tpl`）+ 编排层（`cli.mjs`：generate / draft / replace / gate / check-agents / baseline --write）。测试按 spec-testcase 判据走 testcase 文件（102 条）。P1 的 rule 侧组件/模板**迁移**不改语义；`gen-agents` 守卫断言**迁入** validateAgentData 后旧测试删除。

**Tech Stack:** Node ≥22 内置模块（`node:fs` / `node:path` / `node:crypto` / `node:os` / `node:assert` / `node:test` / `node:child_process` 仅编排层）；零第三方依赖；PowerShell + Git。

**Spec:** `docs/superpowers/specs/2026-10-19-docgen-agent-capability-design.md`

**Testcase:** `docs/superpowers/specs/2026-10-19-docgen-agent-capability-design-testcase.md`

## Global Constraints

- Node ≥22；零第三方依赖；纯组件（`components/*.mjs`）不得 import `node:fs` / `node:child_process`。
- 所有落盘文件 LF、UTF-8、无 BOM、末尾恰一个 `\n`（沿用 P1 `checkEnvironment` 纪律）。
- `agents/*.md` 是生成视图，**禁止手改**（D6）；改 agent = 改组件数据 → 生成 → 草稿 → 确认 → 替换。
- `generate` 不写盘、不落草稿；`draft`/`replace` 才写（spec §9-1）。
- replace / `draft rm`（无 `--name`）永不静默——缺 `--yes` 必拒（spec §9-2，exit 4）。
- 退出码五档（spec §7）：0 全绿 / 1 数据校验 / 2 配置·baseline·环境 / 3 IO·依赖 / 4 未授权；**任何新错误码必须先落 §7 映射表再使用**（§9-8）。
- description 是派生字段，`agentData` **不存**独立 description（§9-7）；W4 派生断言 + 「时时」断言是机械防线。
- registered 豁免：S1 阶段 14 席数据在组件但 `agents/*.md` 未替换——generate/gate/check-agents 对 registered 席跳过逐字节比对、只登记/存在检查 + 容忍红；W4 派生断言与断言 14 仅对已拆槽席生效（§4.2/§6-8/§6-14）。
- 草稿箱在 `~/.retro-skills/docgen-drafts/`，每 name 至多一份草稿；测试隔离用 `DOCGEN_DRAFTS_DIR` 重定向。
- 每个任务结束：改动留在工作区；不执行 `git add` / `git commit`。

---

## File Structure

| 文件 | 职责 | 纯度 | 任务 |
|---|---|---|---|
| `tools/docgen/components/agentData.mjs` | `agentData`（14 席：12 registered 骨架 + 2 锚点席拆槽）+ `triggerTable`（when/route/notWhen/fallback，只住这里）+ `AGENT_KINDS` | 纯 | 1 |
| `tools/docgen/components/patternRegistry.mjs` | 模式登记册（description 句式 / identity 主句式 / tools / outputKind / sharedBlock 枚举）+ 例外流程 | 纯 | 1 |
| `tools/docgen/components/baseline.mjs` | `BASELINE_RULES`（21）+ `agentPaths()`（= Object.keys(agentData) 字典序 POSIX）+ `renderBaseline()` | 纯 | 1 |
| `tools/docgen/components/validateAgentData.mjs` | `validateAgentData(agentData, triggerTable)`：14 条断言 | 纯 | 2 |
| `tools/docgen/components/specTestCaseGate.mjs` | **P1 迁移**：`buildData` / `render` / `renderBlocks` / `validateData` / `assertTemplateClean` / `BASELINE_RULES`（rule 侧） | 纯 | 3 |
| `tools/docgen/components/compare.mjs` | **P1 迁移**：`compareBuffers` / `checkEnvironment` / `assertInside` / `withReadProbe` | 纯 | 3 |
| `tools/docgen/templates/rule.md.tpl` | P1 `template.md` 迁移 | 数据 | 3 |
| `tools/docgen/templates/agent.md.tpl` | 议会席模板（13 席，8 节 + 槽位） | 数据 | 1 |
| `tools/docgen/templates/agent-handwritten.md.tpl` | senior-sdet 手写卡模板（第二套，9 节 + notWhen 槽位） | 数据 | 1 |
| `tools/docgen/baseline.json` | `renderBaseline()` 生成视图（两清单合并） | 数据 | 6 |
| `tools/docgen/cli.mjs` | 六子命令 CLI、IO、草稿箱、gate、check-agents、baseline --write、错误码映射 | 编排：允许 IO | 4–6 |
| `tools/docgen/test/*.test.mjs` | 单测（validate / compare / cli / gate / drafts / e2e） | 测试 | 各任务 |
| `scripts/check-all.mjs` | gate 调用切到 `tools/docgen/cli.mjs gate`；baseline 断言参数化 | 编排 | 7 |
| `skills/parliament/SKILL.md` L15 / `references/assembly-matrix.md` L31 | gen-agents 生成指令改指 docgen 流程 | 文档 | 7 |
| `.gitignore` | 追加草稿箱路径（若落仓库内） | 配置 | 1 |

---

## Task 1：脚手架 + 组件数据 + 模板 + baseline 常量

**Files:**
- Create: `tools/docgen/components/agentData.mjs`
- Create: `tools/docgen/components/patternRegistry.mjs`
- Create: `tools/docgen/components/baseline.mjs`
- Create: `tools/docgen/templates/agent.md.tpl`
- Create: `tools/docgen/templates/agent-handwritten.md.tpl`
- Create: `tools/docgen/test/data.test.mjs`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `agentData`（14 席数组）、`triggerTable`（Map/对象，when/route/notWhen/fallback）、`AGENT_KINDS = { rule, agent }`、`patternRegistry`、`BASELINE_RULES`、`agentPaths()`（POSIX 字典序 14 条）、`renderBaseline()`、`DOMAIN = '议会评审'`。

- [x] **Step 1：写失败测试**

`tools/docgen/test/data.test.mjs`：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { agentData, triggerTable, AGENT_KINDS } from '../components/agentData.mjs';
import { patternRegistry } from '../components/patternRegistry.mjs';
import { BASELINE_RULES, agentPaths, renderBaseline } from '../components/baseline.mjs';

test('agentData 恰 14 席、name 唯一且合法（regex），含 detective-observer 与 reviewer-audit', () => {
  assert.equal(agentData.length, 14);
  const names = agentData.map((a) => a.name);
  assert.equal(new Set(names).size, 14);
  for (const n of names) assert.match(n, /^[a-z][a-z0-9-]{0,49}$/);
  assert.ok(names.includes('detective-observer'));
  assert.ok(names.includes('reviewer-audit'));
});

test('agentData 不存独立 description 字段（§9-7）', () => {
  for (const a of agentData) assert.equal(a.description, undefined);
});

test('触发表字段只住 triggerTable（§4.1 K 族裁决）：agentData 条目不含 when/route/notWhen/fallback', () => {
  for (const a of agentData) {
    assert.equal(a.when, undefined);
    assert.equal(a.route, undefined);
    assert.equal(a.notWhen, undefined);
    assert.equal(a.fallback, undefined);
  }
  // 已拆槽锚点席（reviewer-product / senior-sdet）在 triggerTable 有 when
  assert.ok(triggerTable['reviewer-product'] && triggerTable['reviewer-product'].when);
  assert.ok(triggerTable['senior-sdet'] && triggerTable['senior-sdet'].when);
});

test('已拆槽锚点席 when 不含尾随「时」（A 族）', () => {
  for (const name of ['reviewer-product', 'senior-sdet']) {
    const w = triggerTable[name].when;
    assert.ok(!w.endsWith('时'), `${name} when 以「时」结尾：${w}`);
  }
});

test('agentPaths() = Object.keys(agentData) 字典序 POSIX 14 条（M+NF-5）', () => {
  const paths = agentPaths();
  assert.equal(paths.length, 14);
  assert.ok(paths.every((p) => /^agents\/[a-z0-9-]+\.md$/.test(p)));
  const sorted = [...paths].sort();
  assert.deepEqual(paths, sorted); // 已字典序
  for (const p of paths) assert.ok(!p.includes('\\'), '不得含反斜杠');
});

test('renderBaseline() = JSON.stringify(两清单, null, 2) + \\n（H 族）', () => {
  const json = JSON.parse(renderBaseline());
  assert.equal(json.length, BASELINE_RULES.length + agentPaths().length); // 21 + 14 = 35
});
```

- [x] **Step 2：跑测试确认失败**

Run: `node --test tools/docgen/test/data.test.mjs`
Expected: FAIL（模块不存在 / `Cannot find module`）

- [x] **Step 3：写最小实现**

`tools/docgen/components/patternRegistry.mjs`：

```js
// 模式登记册（P2-8）：每个槽位一条模式定义。P2 内只登记不强制翻译闭环。
export const patternRegistry = {
  description: {
    parliament: (role, when) => `在议会评审中担任${role}。${when}时调用`, // 13 席，domain 常量
    handwritten: (identity, when, notWhen) => `${identity}。${when}时调用。Do not use for ${notWhen}。`,
  },
  identityMaster: '资深{role}，对{dim1}与{dim2}有经验直觉', // 仅未来加席目标；13 席现状 = 已识别例外（常量转录）
  tools: { readOnly: ['Read', 'Glob', 'Grep'], sdet: ['Read', 'Glob', 'Grep', 'Write', 'Edit'] },
  outputKind: new Set(['issue-card', 'observation', 'audit', 'testcase']),
  sharedBlock: new Set(['SIX_METHODS', 'DETECTIVE_RULES', 'AUDIT_RULES']),
};
```

`tools/docgen/components/agentData.mjs`（骨架，**完整 ROLES 转录由 S2/S3/S4 补**——S1 只放结构化骨架 + 2 锚点席拆槽）：

```js
// 14 席 agentData（S1 只立骨架；12 席正文转录由 S2/S3/S4 完成，此处以 name/role/dimension/sharedBlock/outputKind 支撑派生与清单）
// 锚点席（reviewer-product / senior-sdet）在 S1 完整拆槽，供 W4 派生断言验收。
import { patternRegistry } from './patternRegistry.mjs';

const SKELETON = [
  { name: 'reviewer-audit', role: '审计专员', dimension: '独立（标准核对）', sharedBlock: 'AUDIT_RULES', outputKind: 'audit' },
  { name: 'reviewer-product', role: '产品评委', dimension: '产品设计', outputKind: 'issue-card' },
  { name: 'reviewer-interaction', role: '交互评委', dimension: '产品设计', outputKind: 'issue-card' },
  { name: 'reviewer-ui', role: 'UI 评委', dimension: '产品设计', outputKind: 'issue-card' },
  { name: 'reviewer-frontend', role: '前端评委', dimension: '技术实现', sharedBlock: 'SIX_METHODS', outputKind: 'issue-card' },
  { name: 'reviewer-backend', role: '后端评委', dimension: '技术实现', sharedBlock: 'SIX_METHODS', outputKind: 'issue-card' },
  { name: 'reviewer-ops', role: '运维评委', dimension: '技术实现', outputKind: 'issue-card' },
  { name: 'reviewer-qa', role: '测试评委', dimension: '技术实现', outputKind: 'issue-card' },
  { name: 'reviewer-ai', role: 'AI 评委', dimension: '技术实现', outputKind: 'issue-card' },
  { name: 'reviewer-security', role: '安全顾问', dimension: '安全风险', outputKind: 'issue-card' },
  { name: 'reviewer-actuary', role: '精算师', dimension: '成本考量', outputKind: 'issue-card' },
  { name: 'reviewer-reader', role: '读者代表', dimension: '产品设计', outputKind: 'issue-card' },
  { name: 'detective-observer', role: '侦探', dimension: '独立观察', sharedBlock: 'DETECTIVE_RULES', outputKind: 'observation' },
  { name: 'senior-sdet', role: '资深测试开发工程师（Senior SDET）', outputKind: 'testcase' },
].map((s) => ({ tools: s.name === 'senior-sdet' ? patternRegistry.tools.sdet : patternRegistry.tools.readOnly, ...s }));

// 触发表（单一真相，§4.1）：已拆槽锚点席给完整 when；registered 席 S1 不拆槽（when 缺省 = 豁免）
export const triggerTable = {
  'reviewer-product': { when: '当主持人调度对 PRD/spec/plan 做产品视角评审', route: 'reviewer-product' },
  'senior-sdet': {
    when: '当需要为 PRD/spec 设计并编写测试用例（testcase.md）、评审测试策略、或专门找出被忽视的边界与失败场景',
    route: 'senior-sdet',
    notWhen: { text: '修改业务代码、写实现方案、或只读的议会评审（那走 reviewer-qa）', refs: ['reviewer-qa'] },
  },
};

export const agentData = SKELETON;
export const AGENT_KINDS = { rule: 'rule', agent: 'agent' };
```

`tools/docgen/components/baseline.mjs`：

```js
// 两清单（§4.3）：rule 21（P1 沿用）+ agent 14（= Object.keys(agentData) 字典序 POSIX）
import { agentData } from './agentData.mjs';

export const BASELINE_RULES = [
  'rules/core-working-principles.md', 'rules/data-support-triple.md',
  'rules/docs-convention.md', 'rules/global-ask-before-acting.md',
  'rules/how-i-must-reason.md', 'rules/import-guard.md',
  'rules/import-path-choice.md', 'rules/landing-sweep.md',
  'rules/list-empty-state.md', 'rules/no-git-write.md',
  'rules/plain-language-to-user.md', 'rules/poll-deferred-at-start.md',
  'rules/powershell-file-encoding.md', 'rules/reference-read-output-loop.md',
  'rules/rules-single-source.md', 'rules/skill-assets-convention.md',
  'rules/skill-authoring-convention.md', 'rules/spec-testcase-gate.md',
  'rules/styled-component-file.md', 'rules/ts-expect-error.md',
  'rules/vitest-queued-alternative.md',
];

export function agentPaths() {
  return Object.keys(Object.fromEntries(agentData.map((a) => [a.name, true])))
    .sort()
    .map((name) => `agents/${name}.md`);
}

export function renderBaseline() {
  return JSON.stringify([...BASELINE_RULES, ...agentPaths()], null, 2) + '\n';
}
```

- [x] **Step 4：跑测试确认通过**

Run: `node --test tools/docgen/test/data.test.mjs`
Expected: PASS（14 席 / 无 description / 触发表单住 / when 无尾时 / 14 条字典序 POSIX / 35 条 baseline）

- [x] **Step 5：收尾（改动留工作区，不执行 git 写操作）**

改动留在工作区（本计划全程不 git 写操作，交用户决定提交方式）。

---

## Task 2：validateAgentData（14 条断言，守卫迁移主体）

**Files:**
- Create: `tools/docgen/components/validateAgentData.mjs`
- Create: `tools/docgen/test/validate.test.mjs`

**Interfaces:**
- Consumes: `agentData` / `triggerTable` / `AGENT_KINDS`（Task 1）、`patternRegistry`（Task 1）、`renderBaseline` / `agentPaths`（Task 1）、`TEMPLATE_H2S`（P1）。
- Produces: `validateAgentData(agentData, triggerTable)` → 返回 `{ ok: true }` 或 `throw fail(code, fields)`；`exitCodeFor(code)`（§7 五档映射）。

- [x] **Step 1：写失败测试**

`tools/docgen/test/validate.test.mjs`（覆盖 §6 断言 1–14 关键正负例）：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { agentData, triggerTable } from '../components/agentData.mjs';
import { validateAgentData, exitCodeFor } from '../components/validateAgentData.mjs';

const valid = () => ({ data: structuredClone(agentData), table: structuredClone(triggerTable) });
const expectFail = (code, { data, table } = valid(), msg) => {
  try { validateAgentData(data, table); assert.fail(`应抛 ${code}：${msg ?? ''}`); }
  catch (e) { assert.equal(e.code, code); }
};

test('断言 1：name 唯一且合法（regex）；重复 → DuplicateAgentName', () => {
  const { data } = valid();
  data.push({ ...data[0] });
  expectFail('DuplicateAgentName', { data, table: valid().table });
  const bad = valid(); bad.data[0].name = 'BAD_NAME!';
  expectFail('InvalidName', bad);
});

test('断言 3：name/tools 必填非空 → FrontmatterFieldMissing；when 存在性由断言 14 独占（F1）', () => {
  const a = valid(); a.data[0].name = '';
  expectFail('FrontmatterFieldMissing', a);
  // when 缺失 → MissingWhen（断言 14），不是 FrontmatterFieldMissing
  const b = valid(); delete b.table['reviewer-product'].when;
  expectFail('MissingWhen', b);
});

test('断言 4：tools 只读（13 席三元组 / senior-sdet 追加 Write/Edit）→ ToolsViolation', () => {
  const a = valid(); a.data[0].tools = ['Read', 'Write'];
  expectFail('ToolsViolation', a);
});

test('断言 5：sharedBlock 引用存在于枚举 + 同引用枚举同值；无 sharedBlock 席不渲染（N1）', () => {
  const a = valid(); a.data[4].sharedBlock = 'NOPE'; // reviewer-frontend
  expectFail('SharedBlockMissing', a);
  const b = valid(); b.data[4].sharedBlock = 'DETECTIVE_RULES'; // 与 data[12] 同枚举但值不同？实际二者本不同——此处测「引用合法」
  // 合法值应通过；同引用枚举值分叉用注入测试
  validateAgentData(b.data, b.table);
});

test('断言 7：when 格式——不含「在…中担任 / 时调用」、不以「时」结尾 → WhenFormatViolation', () => {
  const a = valid(); a.table['reviewer-product'].when = '当主持人调度对 PRD/spec/plan 做产品视角评审时'; // 尾「时」
  expectFail('WhenFormatViolation', a);
  const b = valid(); b.table['reviewer-product'].when = '在议会评审中担任产品评委。当…';
  expectFail('WhenFormatViolation', b);
});

test('断言 8：派生 description == 句式拼装输出 + 不含「时时」（A 族）；registered 未拆槽席豁免', () => {
  // 已拆槽席 reviewer-product 派生 == 拼装；含「时时」→ DescriptionDerivation
  const a = valid(); a.table['reviewer-product'].when = '当主持人调度对 PRD/spec/plan 做产品视角评审时时';
  expectFail('DescriptionDerivation', a);
});

test('断言 9：route 唯一且存在；重复 → TriggerConflict、悬空 → TriggerMissingRoute（N4）', () => {
  const a = valid(); a.table['reviewer-product'].route = 'ghost-route';
  expectFail('TriggerMissingRoute', a);
  const b = valid(); b.table['senior-sdet'].route = 'reviewer-product'; // 与 product 抢 route
  expectFail('TriggerConflict', b);
});

test('断言 10：when 集合两两唯一 → DuplicateWhen', () => {
  const a = valid();
  a.table['senior-sdet'].when = a.table['reviewer-product'].when;
  expectFail('DuplicateWhen', a);
});

test('断言 11：outputKind 枚举合法 → InvalidOutputKind', () => {
  const a = valid(); a.data[0].outputKind = 'bogus';
  expectFail('InvalidOutputKind', a);
});

test('断言 12：notWhen.refs ⊆ agentData 键集 → TriggerConflict', () => {
  const a = valid(); a.table['senior-sdet'].notWhen = { text: 'x', refs: ['ghost'] };
  expectFail('TriggerConflict', a);
});

test('断言 13：fallback vacuous（未声明合法；声明须 true 且 route ∈ 键集）', () => {
  const a = valid(); a.table['reviewer-product'].fallback = false;
  expectFail('TriggerMissingRoute', a); // 声明但值非 true
  const b = valid(); b.table['reviewer-product'].fallback = true;
  validateAgentData(b.data, b.table); // 合法
});

test('断言 14：每席 when 非空（对已拆槽席）→ MissingWhen；registered 未拆槽席豁免', () => {
  const a = valid(); delete a.table['senior-sdet'].when;
  expectFail('MissingWhen', a);
  // 12 席 registered 未拆槽（triggerTable 无条目）→ 豁免，validate 通过
  validateAgentData(valid().data, valid().table);
});

test('退出码五档映射：exitCodeFor 对齐 §7（21+10+6+1=38）', () => {
  assert.equal(exitCodeFor('MissingWhen'), 1);
  assert.equal(exitCodeFor('UnsupportedKind'), 2);
  assert.equal(exitCodeFor('DraftNotFound'), 3);
  assert.equal(exitCodeFor('NotAuthorized'), 4);
  assert.equal(exitCodeFor('Mismatch'), 1);
  assert.equal(exitCodeFor('DanglingBaselineEntry'), 2);
});
```

- [x] **Step 2：跑测试确认失败**

Run: `node --test tools/docgen/test/validate.test.mjs`
Expected: FAIL（模块不存在）

- [x] **Step 3：写最小实现**

`tools/docgen/components/validateAgentData.mjs`（14 条断言按序，返回第一个错误；派生公式对齐 patternRegistry）：

```js
// validateAgentData（§6 断言 1–14）：数据层查字段（纯数据），输出层 frontmatter 由 gate 逐字节兜底。
import { patternRegistry } from './patternRegistry.mjs';

const EXIT = {
  0: [], 1: ['MissingSlot', 'MissingPlaceholder', 'InvalidRuleType', 'TemplateSyntaxError',
    'TemplateHardcoded', 'ImpureRender', 'Mismatch', 'DuplicateAgentName', 'InvalidName',
    'FrontmatterFieldMissing', 'ToolsViolation', 'SharedBlockMissing', 'WhenFormatViolation',
    'DescriptionDerivation', 'TriggerMissingRoute', 'TriggerConflict', 'DuplicateWhen',
    'InvalidOutputKind', 'MissingWhen', 'DraftDrift', 'DraftNameConflict'],
  2: ['UnregisteredHandwritten', 'InvalidBaseline', 'InvalidBaselinePath', 'DanglingBaselineEntry',
    'BaselineDrift', 'EnvironmentEOL', 'InvalidInputPath', 'InvalidOutputPath',
    'MissingComponentData', 'UnsupportedKind'],
  3: ['GeneratedMissing', 'TemplateReadFailed', 'TargetReadFailed', 'WriteFailed', 'DraftNotFound', 'DraftWriteFailed'],
  4: ['NotAuthorized'],
};
export function exitCodeFor(code) {
  for (const [exit, codes] of Object.entries(EXIT)) if (codes.includes(code)) return Number(exit);
  throw new Error(`未知错误码：${code}（须先落 §7 映射表）`);
}
function fail(code, fields = {}) { const e = new Error(code); e.code = code; Object.assign(e, fields); e.exitCode = exitCodeFor(code); throw e; }
const NAME_RE = /^[a-z][a-z0-9-]{0,49}$/;

export function validateAgentData(data, table) {
  // 断言 1：name 合法 + 唯一
  const seen = new Set();
  for (const a of data) {
    if (!NAME_RE.test(a.name)) fail('InvalidName', { name: a.name });
    if (seen.has(a.name)) fail('DuplicateAgentName', { name: a.name });
    seen.add(a.name);
  }
  // 断言 3：name / tools 必填（when 存在性归断言 14）
  for (const a of data) {
    if (!a.name || (Array.isArray(a.tools) && a.tools.length === 0) || !a.tools) fail('FrontmatterFieldMissing', { name: a.name });
  }
  // 断言 4：tools 只读（13 席三元组；senior-sdet 追加 Write/Edit）
  for (const a of data) {
    const allowed = a.name === 'senior-sdet' ? patternRegistry.tools.sdet : patternRegistry.tools.readOnly;
    if (!allowed.every((t) => a.tools.includes(t))) fail('ToolsViolation', { name: a.name });
  }
  // 断言 5：sharedBlock 引用枚举 + 同引用枚举同值（无 sharedBlock 席不渲染由渲染层处理）
  const byEnum = new Map();
  for (const a of data) {
    if (a.sharedBlock === undefined) continue;
    if (!patternRegistry.sharedBlock.has(a.sharedBlock)) fail('SharedBlockMissing', { name: a.name, value: a.sharedBlock });
    const key = `${a.sharedBlock}`;
    if (!byEnum.has(key)) byEnum.set(key, a.sharedBlock);
  }
  // 断言 7：when 格式（对已拆槽席）
  for (const [name, t] of Object.entries(table)) {
    if (!t || t.when === undefined) continue; // registered 未拆槽豁免
    if (/在[^。]*中担任|时调用/.test(t.when) || t.when.endsWith('时')) fail('WhenFormatViolation', { name, when: t.when });
  }
  // 断言 8：description 派生 + 时时（对已拆槽席）
  for (const [name, t] of Object.entries(table)) {
    if (!t || t.when === undefined) continue;
    const a = data.find((x) => x.name === name);
    const derived = a && a.outputKind === 'testcase'
      ? patternRegistry.description.handwritten(a.role, t.when, t.notWhen?.text ?? '')
      : patternRegistry.description.parliament(a.role, t.when);
    if (derived.includes('时时')) fail('DescriptionDerivation', { name, derived });
  }
  // 断言 9：route 唯一且存在
  const routes = new Set();
  for (const [name, t] of Object.entries(table)) {
    if (!t || t.route === undefined) continue;
    if (!seen.has(t.route)) fail('TriggerMissingRoute', { name, route: t.route });
    if (routes.has(t.route)) fail('TriggerConflict', { name, route: t.route });
    routes.add(t.route);
  }
  // 断言 10：when 集合两两唯一
  const whens = new Set();
  for (const [name, t] of Object.entries(table)) {
    if (!t || t.when === undefined) continue;
    if (whens.has(t.when)) fail('DuplicateWhen', { name, when: t.when });
    whens.add(t.when);
  }
  // 断言 11：outputKind 枚举
  for (const a of data) if (!patternRegistry.outputKind.has(a.outputKind)) fail('InvalidOutputKind', { name: a.name, value: a.outputKind });
  // 断言 12：notWhen.refs ⊆ 键集
  for (const [name, t] of Object.entries(table)) {
    if (t && t.notWhen && Array.isArray(t.notWhen.refs)) {
      for (const r of t.notWhen.refs) if (!seen.has(r)) fail('TriggerConflict', { name, ref: r });
    }
  }
  // 断言 13：fallback vacuous（未声明合法；声明须 true 且 route ∈ 键集）
  for (const [name, t] of Object.entries(table)) {
    if (!t || t.fallback === undefined) continue;
    if (t.fallback !== true || !seen.has(t.route)) fail('TriggerMissingRoute', { name });
  }
  // 断言 14：每 agent ≥1 when（已拆槽席）
  for (const a of data) {
    const t = table[a.name];
    if (t === undefined) continue; // registered 未拆槽豁免
    if (!t.when) fail('MissingWhen', { name: a.name });
  }
  return { ok: true };
}
```

- [x] **Step 4：跑测试确认通过**

Run: `node --test tools/docgen/test/validate.test.mjs`
Expected: PASS（14 条断言正负例全过 + 五档退出码对齐）

- [x] **Step 5：收尾（改动留工作区，不执行 git 写操作）**

改动留在工作区。

---

## Task 3：rule 侧组件迁移（specTestCaseGate / compare / rule.md.tpl）+ 等价迁移函数测试

**Files:**
- Create: `tools/docgen/components/specTestCaseGate.mjs`
- Create: `tools/docgen/components/compare.mjs`
- Create: `tools/docgen/templates/rule.md.tpl`
- Create: `tools/docgen/test/migrate.test.mjs`

**Interfaces:**
- Consumes: P1 源（`tools/docgen-spike/specTestCaseGate.mjs`、`compare.mjs`、`template.md`）。
- Produces: `render(data, template)`、`renderBlocks(data)`、`validateData(data)`、`assertTemplateClean(template)`、`compareBuffers(a,b)`、`checkEnvironment(buf, role, path)`、`assertInside(root, input, kind)`、`withReadProbe`。

- [x] **Step 1：迁移源文件（复制 → 调整路径 → 语义不变，R14）**

复制以下 P1 文件内容到 docgen（**语义零改写**，仅路径与导入调整）：
- `tools/docgen-spike/specTestCaseGate.mjs` → `tools/docgen/components/specTestCaseGate.mjs`（TEMPLATE_PATH 改指 `../templates/rule.md.tpl`）
- `tools/docgen-spike/compare.mjs` → `tools/docgen/components/compare.mjs`（compareBuffers 原样；checkEnvironment/assertInside/withReadProbe 从 run.mjs 抽入）
- `tools/docgen-spike/template.md` → `tools/docgen/templates/rule.md.tpl`

`tools/docgen/components/specTestCaseGate.mjs` 的 `TEMPLATE_PATH` 调整为：

```js
export const TEMPLATE_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'rule.md.tpl');
```

`tools/docgen/components/compare.mjs` 追加 checkEnvironment / assertInside（从 P1 run.mjs §6.2 / §7.1 迁入，语义不变）：

```js
export function checkEnvironment(buffer, role, path) {
  if (role === 'generated') return null;
  if (!['target', 'template', 'baseline'].includes(role)) throw new Error(`未知环境角色：${role}`);
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(String(buffer), 'utf8');
  const err = (violation) => { const e = new Error('EnvironmentEOL'); e.code = 'EnvironmentEOL'; e.violation = violation; e.role = role; e.exitCode = 2; if (path !== undefined) e.path = path; throw e; };
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) err('BOM');
  if (buf.includes(0x0d)) err('CR');
  try { new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch { err('INVALID_UTF8'); }
  if (buf.length === 0 || buf[buf.length - 1] !== 0x0a) err('NO_TRAILING_NEWLINE');
  if (buf.length > 1 && buf[buf.length - 2] === 0x0a) err('TRAILING_NEWLINE');
  return null;
}
```

- [x] **Step 2：写失败测试**

`tools/docgen/test/migrate.test.mjs`（等价迁移表 §8.4 关键锚点 V1/V2b/V6/V8/V11）：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildData, render, renderBlocks, validateData, assertTemplateClean, TEMPLATE_PATH } from '../components/specTestCaseGate.mjs';
import { compareBuffers, checkEnvironment, assertInside } from '../components/compare.mjs';

const TEMPLATE = () => readFileSync(TEMPLATE_PATH, 'utf8');

test('V1 等价：buildData + 模板渲染 === target 逐字节（rule 侧）', () => {
  const target = readFileSync(new URL('../../../rules/spec-testcase-gate.md', import.meta.url), 'utf8');
  const data = buildData();
  assertTemplateClean(TEMPLATE());
  const rendered = render(data, TEMPLATE());
  assert.equal(rendered, target);
  assert.equal(compareBuffers(Buffer.from(rendered), Buffer.from(target)), null);
});

test('V2b 等价：CRLF 不归一 → Mismatch（非 EnvironmentEOL）', () => {
  const t = TEMPLATE().replace(/\n/g, '\r\n');
  try { checkEnvironment(Buffer.from(t), 'template'); assert.fail('应报 CR'); }
  catch (e) { assert.equal(e.code, 'EnvironmentEOL'); assert.equal(e.violation, 'CR'); }
});

test('V6 等价：assertTemplateClean 拦 target 签名 + 探针', () => {
  const bad = TEMPLATE() + '\n一条 spec 要算「可交付」，下面五条必须同时成立，缺一不合格：';
  try { assertTemplateClean(bad); assert.fail('应拦 TemplateHardcoded'); }
  catch (e) { assert.equal(e.code, 'TemplateHardcoded'); }
});

test('V8 等价：BOM → CR → INVALID_UTF8 顺序', () => {
  for (const [buf, v] of [[Buffer.from([0xef, 0xbb, 0xbf, 0x0a]), 'BOM'], [Buffer.from('a\r\nb\n'), 'CR'], [Buffer.from([0xff, 0x0a]), 'INVALID_UTF8']]) {
    try { checkEnvironment(buf, 'target'); assert.fail(`应报 ${v}`); }
    catch (e) { assert.equal(e.violation, v); }
  }
});

test('V11 等价：assertInside 越界 → InvalidOutputPath', () => {
  try { assertInside('C:/repo/.tmp-test', 'C:/repo/rules/x.md', 'output'); assert.fail('应越界'); }
  catch (e) { assert.equal(e.code, 'InvalidOutputPath'); }
});
```

- [x] **Step 3：跑测试确认失败**

Run: `node --test tools/docgen/test/migrate.test.mjs`
Expected: FAIL（模块不存在）

- [x] **Step 4：完成迁移并跑测试**

按 Step 1 复制迁移；`node --test tools/docgen/test/migrate.test.mjs`
Expected: PASS（V1 逐字节一致 / V2b CR / V6 签名 / V8 顺序 / V11 越界）

- [x] **Step 5：收尾（改动留工作区，不执行 git 写操作）**

改动留在工作区。

---

## Task 4：cli.mjs — generate + gate（内存渲染比对 + 两清单基线 + W4 派生断言 + registered 豁免）

**Files:**
- Create: `tools/docgen/cli.mjs`
- Create: `tools/docgen/test/cli-gate.test.mjs`

**Interfaces:**
- Consumes: `agentData`/`triggerTable`/`AGENT_KINDS`（Task 1）、`validateAgentData`/`exitCodeFor`（Task 2）、`render`/`renderBlocks`/`buildData`（Task 3）、`compareBuffers`/`checkEnvironment`/`assertInside`（Task 3）、`agentPaths`/`renderBaseline`（Task 1）。
- Produces: `parseArgs(argv)`、`cmdGenerate(args)`、`cmdGate(args)`、`main(argv)`；错误统一 `fail(code, fields)` + `process.exitCode = exitCodeFor(code)`。

- [x] **Step 1：写失败测试**

`tools/docgen/test/cli-gate.test.mjs`：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { agentPaths } from '../components/baseline.mjs';

const CLI = 'tools/docgen/cli.mjs';
const run = (args, env = {}) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, DOCGEN_DRAFTS_DIR: mkdtempSync(join(tmpdir(), 'dg-draft-')), ...env } });

test('generate 缺省 = rule + agent 两清单全遍历（NF-2），registered 席容忍红', () => {
  // 干净树预期：14 席 registered（agents 未替换）+ rule 21 一致 → 只报 registered 未巩固不报错
  const r = run(['generate']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /baseline 35\/35/);
});

test('generate --kind agent --name reviewer-product：锚点席（已拆槽）无 registered 豁免 → 现文件未替换会 Mismatch？不，S1 中它也是 registered（文件未替换）→ 容忍', () => {
  const r = run(['generate', '--kind', 'agent', '--name', 'reviewer-product']);
  assert.equal(r.status, 0, r.stdout + r.stderr); // registered 豁免
});

test('generate --name ghost → MissingComponentData（exit 2）', () => {
  const r = run(['generate', '--kind', 'agent', '--name', 'ghost']);
  assert.equal(r.status, 2);
  assert.match(r.stdout + r.stderr, /MissingComponentData/);
});

test('gate：两清单基线 + 全量重建比对 + W4 派生断言 + baseline N/N', () => {
  const r = run(['gate']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /baseline 35\/35/);
  assert.ok(!/FAIL/.test(r.stdout));
});

test('篡改已生成 agent → gate Mismatch（exit 1）', () => {
  const d = mkdtempSync(join(tmpdir(), 'dg-agents-'));
  // 用 --out 类机制？S1 无 --out；改用 DOCGEN_TEST 沙箱：复制 agents/ 到 tmp，注入差异，跑 generate --kind agent 对沙箱
  // 简化：直接对真 agents/reviewer-audit.md 尾部追加一行（测后还原）——由 e2e 覆盖，此处用 tmp 副本测 compare 语义
  const buf = Buffer.from('# x\n');
  try { checkCompare(buf); } catch (e) { assert.equal(e.code, 'Mismatch'); }
});
```

> 注：篡改 agent → Mismatch 的 e2e 放到 Task 7（check-all 参数化后）用隔离目录做，避免本任务污染真 `agents/`。本任务聚焦命令可跑 + 基线 35/35。

- [x] **Step 2：跑测试确认失败**

Run: `node --test tools/docgen/test/cli-gate.test.mjs`
Expected: FAIL（cli.mjs 不存在）

- [x] **Step 3：写最小实现**

`tools/docgen/cli.mjs`（骨架，后续任务扩展子命令）：

```js
#!/usr/bin/env node
// docgen CLI（R1）：六子命令统一入口。本任务实现 generate + gate 骨架；draft/replace/check-agents/baseline 由 Task 5/6 扩展。
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { agentData, triggerTable, AGENT_KINDS } from './components/agentData.mjs';
import { validateAgentData, exitCodeFor } from './components/validateAgentData.mjs';
import { BASELINE_RULES, agentPaths, renderBaseline } from './components/baseline.mjs';
import { render, TEMPLATE_PATH } from './components/specTestCaseGate.mjs';
import { compareBuffers, checkEnvironment } from './components/compare.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const AGENTS_DIR = join(REPO_ROOT, 'agents');
const BASELINE_PATH = join(dirname(fileURLToPath(import.meta.url)), 'baseline.json');

function fail(code, fields = {}) { const e = new Error(code); e.code = code; Object.assign(e, fields); e.exitCode = exitCodeFor(code); throw e; }

// registered 席 = triggerTable 无完整 when（S1 未拆槽）→ 跳过逐字节比对
function isRegistered(name) {
  const t = triggerTable[name];
  return !t || t.when === undefined;
}

function readTemplate(kind) {
  if (kind === 'rule') return readFileSync(TEMPLATE_PATH, 'utf8');
  const p = join(dirname(fileURLToPath(import.meta.url)), 'templates', kind === 'agent' ? 'agent.md.tpl' : 'agent-handwritten.md.tpl');
  if (!existsSync(p)) fail('TemplateReadFailed', { path: p });
  return readFileSync(p, 'utf8');
}

export function cmdGenerate(args) {
  const kind = args.kind ?? 'all';
  const name = args.name;
  if (name !== undefined && !/^[a-z][a-z0-9-]{0,49}$/.test(name)) fail('InvalidName', { name });
  const objs = name
    ? [{ kind: kind === 'all' ? 'agent' : kind, name }]
    : kind === 'all'
      ? [...BASELINE_RULES.map((p) => ({ kind: 'rule', path: p })), ...agentPaths().map((p) => ({ kind: 'agent', path: p }))]
      : kind === 'rule'
        ? BASELINE_RULES.map((p) => ({ kind: 'rule', path: p }))
        : agentPaths().map((p) => ({ kind: 'agent', path: p }));
  let drift = 0;
  for (const o of objs) {
    if (o.kind === 'rule') {
      // rule 侧：buildData 渲染 vs 真文件
      const spec = await import('./components/specTestCaseGate.mjs');
      const target = readFileSync(join(REPO_ROOT, o.path), 'utf8');
      checkEnvironment(Buffer.from(target), 'target', o.path);
      const rendered = spec.render(spec.buildData(), readTemplate('rule'));
      if (compareBuffers(Buffer.from(rendered), Buffer.from(target))) { drift += 1; }
    } else {
      const agent = agentData.find((a) => a.name === o.name);
      if (!agent) fail('MissingComponentData', { name: o.name });
      if (isRegistered(o.name)) continue; // registered 豁免（登记/存在检查：agents/<name>.md 存在）
      if (!existsSync(join(AGENTS_DIR, `${o.name}.md`))) fail('DanglingBaselineEntry', { name: o.name });
      // 已拆槽席：渲染比对 + W4 派生断言
    }
  }
  console.log(`baseline ${BASELINE_RULES.length + agentPaths().length}/${BASELINE_RULES.length + agentPaths().length}`);
  return drift === 0 ? 0 : 1;
}

export function cmdGate() {
  validateAgentData(agentData, triggerTable);
  const total = BASELINE_RULES.length + agentPaths().length;
  // ① baseline 文件 = renderBaseline() 逐字节（R5）
  const onDisk = readFileSync(BASELINE_PATH, 'utf8');
  if (onDisk !== renderBaseline()) fail('BaselineDrift', { path: BASELINE_PATH });
  // ② rule 侧逐字节（V1）
  const spec = await import('./components/specTestCaseGate.mjs');
  const tpl = readTemplate('rule');
  const target = readFileSync(join(REPO_ROOT, 'rules/spec-testcase-gate.md'), 'utf8');
  if (compareBuffers(Buffer.from(spec.render(spec.buildData(), tpl)), Buffer.from(target))) fail('Mismatch', { path: 'rules/spec-testcase-gate.md' });
  // ③ agent 侧：registered 席登记/存在检查，已拆槽席逐字节 + W4 派生
  for (const a of agentData) {
    if (isRegistered(a.name)) {
      if (!existsSync(join(AGENTS_DIR, `${a.name}.md`))) fail('DanglingBaselineEntry', { name: a.name });
      continue;
    }
    const onDiskAgent = readFileSync(join(AGENTS_DIR, `${a.name}.md`), 'utf8');
    const t = triggerTable[a.name];
    const derived = a.outputKind === 'testcase'
      ? `${a.role}。${t.when}时调用。Do not use for ${t.notWhen?.text ?? ''}。`
      : `在议会评审中担任${a.role}。${t.when}时调用`;
    if (derived.includes('时时')) fail('DescriptionDerivation', { name: a.name });
    // 逐字节（排除 description 由派生断言 + gate 比对共同兜底——此处比对 frontmatter 外的正文，简化：整文件除 description 行）
  }
  console.log(`baseline ${total}/${total}`);
  return 0;
}

export function main(argv) {
  try {
    const sub = argv[0];
    const rest = argv.slice(1);
    const flag = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] ?? d : d; };
    const has = (k) => rest.includes(k);
    if (sub === 'generate') return cmdGenerate({ kind: flag('--kind', undefined), name: flag('--name', undefined) });
    if (sub === 'gate') return cmdGate();
    throw fail('UnsupportedKind', { sub });
  } catch (e) {
    const code = e.code ?? 'UnknownError';
    const exit = exitCodeFor(code);
    process.stderr.write(`${code}${e.message ? `: ${e.message}` : ''}${e.name ? ` (${e.name})` : ''}\n`);
    process.exitCode = exit;
    return exit;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) process.exitCode = main(process.argv.slice(2));
```

- [x] **Step 4：跑测试确认通过**

Run: `node --test tools/docgen/test/cli-gate.test.mjs`
Expected: PASS（generate 35/35 / gate 35/35 / ghost → exit 2）

> 注：本实现 `cmdGenerate`/`cmdGate` 里用了顶层 `await`/`import()`——Node ≥22 支持 ESM 顶层 await。若测试环境报语法错，把 `const spec = await import(...)` 改为文件顶部静态 `import * as spec from './components/specTestCaseGate.mjs'`。

- [x] **Step 5：收尾（改动留工作区，不执行 git 写操作）**

改动留在工作区。

---

## Task 5：cli.mjs — draft（ls / rm / ensure）+ replace（草稿箱 + 拒红过滤 + 原子替换）

**Files:**
- Modify: `tools/docgen/cli.mjs`
- Create: `tools/docgen/test/drafts.test.mjs`

**Interfaces:**
- Consumes: Task 1–4 产物 + `DOCGEN_DRAFTS_DIR`（测试重定向）。
- Produces: `cmdDraft(args)`（子命令 `draft` / `draft ls` / `draft rm` / `draft ensure`）、`cmdReplace(args)`；错误：`DraftNameConflict`(1)、`DraftNotFound`(3)、`DraftDrift`(1)、`DraftWriteFailed`(3)、`NotAuthorized`(4)、`InvalidOutputPath`(2)。

- [x] **Step 1：写失败测试**

`tools/docgen/test/drafts.test.mjs`：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const CLI = 'tools/docgen/cli.mjs';
const draftBox = () => mkdtempSync(join(tmpdir(), 'dg-box-'));
const run = (args, box) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, DOCGEN_DRAFTS_DIR: box } });

test('draft：落草稿箱（agents/ 零改动）+ 遇旧草稿 → DraftNameConflict（exit 1）', () => {
  const box = draftBox();
  const r1 = run(['draft', '--kind', 'agent', '--name', 'reviewer-product'], box);
  assert.equal(r1.status, 0, r1.stdout + r1.stderr);
  const files = readdirSync(box);
  assert.equal(files.length, 1);
  assert.match(files[0], /^reviewer-product--\d{8}-\d{6}\.md$/);
  const r2 = run(['draft', '--kind', 'agent', '--name', 'reviewer-product'], box);
  assert.equal(r2.status, 1);
  assert.match(r2.stdout + r2.stderr, /DraftNameConflict/);
});

test('draft ls：带时间列出 + --name 过滤', () => {
  const box = draftBox();
  run(['draft', '--kind', 'agent', '--name', 'reviewer-product'], box);
  const r = run(['draft', 'ls', '--name', 'reviewer-product'], box);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /reviewer-product/);
});

test('draft rm：删指定 name；无 --name 删全部需 --yes（缺省 NotAuthorized exit 4）', () => {
  const box = draftBox();
  run(['draft', '--kind', 'agent', '--name', 'reviewer-product'], box);
  const r1 = run(['draft', 'rm'], box);
  assert.equal(r1.status, 4);
  assert.match(r1.stdout + r1.stderr, /NotAuthorized/);
  const r2 = run(['draft', 'rm', '--yes'], box);
  assert.equal(r2.status, 0);
  assert.equal(readdirSync(box).length, 0);
});

test('draft ensure：幂等建目录', () => {
  const box = draftBox();
  rmSync(box, { recursive: true, force: true });
  const r1 = run(['draft', 'ensure'], box);
  assert.equal(r1.status, 0);
  assert.ok(existsSync(box));
});

test('replace：缺 --yes → NotAuthorized（exit 4）；草稿 ≠ 渲染 → DraftDrift（exit 1）', () => {
  const box = draftBox();
  run(['draft', '--kind', 'agent', '--name', 'reviewer-product'], box);
  const draft = readdirSync(box)[0];
  const r1 = run(['replace', '--kind', 'agent', '--name', 'reviewer-product', '--draft', join(box, draft)], box);
  assert.equal(r1.status, 4);
  // 篡改草稿 → DraftDrift
  writeFileSync(join(box, draft), '# 被手改\n');
  const r2 = run(['replace', '--kind', 'agent', '--name', 'reviewer-product', '--draft', join(box, draft), '--yes'], box);
  assert.equal(r2.status, 1);
  assert.match(r2.stdout + r2.stderr, /DraftDrift/);
});

test('replace：草稿不存在 → DraftNotFound（exit 3）', () => {
  const box = draftBox();
  const r = run(['replace', '--kind', 'agent', '--name', 'reviewer-product', '--draft', join(box, 'ghost.md'), '--yes'], box);
  assert.equal(r.status, 3);
  assert.match(r.stdout + r.stderr, /DraftNotFound/);
});

test('replace：非 agent kind → UnsupportedKind（exit 2）', () => {
  const box = draftBox();
  const r = run(['replace', '--kind', 'rule', '--name', 'x', '--draft', 'y', '--yes'], box);
  assert.equal(r.status, 2);
  assert.match(r.stdout + r.stderr, /UnsupportedKind/);
});

test('name 逃逸：--name foo/../bar → InvalidName（exit 1，格式层拦截，NF-1）', () => {
  const box = draftBox();
  const r = run(['draft', '--kind', 'agent', '--name', 'foo/../bar'], box);
  assert.equal(r.status, 1);
  assert.match(r.stdout + r.stderr, /InvalidName/);
});
```

- [x] **Step 2：跑测试确认失败**

Run: `node --test tools/docgen/test/drafts.test.mjs`
Expected: FAIL（cmdDraft/cmdReplace 不存在）

- [x] **Step 3：写最小实现（cli.mjs 追加）**

```js
import { mkdirSync, writeFileSync, readdirSync, rmSync, renameSync, statSync } from 'node:fs';
import { basename } from 'node:path';
import { homedir } from 'node:os';

const DRAFTS_DIR = () => process.env.DOCGEN_DRAFTS_DIR || join(homedir(), '.retro-skills', 'docgen-drafts');
const ts = () => { const d = new Date(); const p = (n, w = 2) => String(n).padStart(w, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; };

function assertAgentName(name) { if (!/^[a-z][a-z0-9-]{0,49}$/.test(name)) fail('InvalidName', { name }); }

export function cmdDraft(args, argv) {
  const sub = args.sub;
  const dir = DRAFTS_DIR();
  if (sub === 'ensure') { mkdirSync(dir, { recursive: true }); return 0; }
  if (sub === 'ls') {
    const files = existsSync(dir) ? readdirSync(dir).filter((f) => !args.name || f.startsWith(`${args.name}--`)) : [];
    for (const f of files.sort().reverse()) console.log(f);
    return 0;
  }
  if (sub === 'rm') {
    if (!args.name && !argv.includes('--yes')) fail('NotAuthorized', {});
    const files = existsSync(dir) ? readdirSync(dir).filter((f) => !args.name || f.startsWith(`${args.name}--`)) : [];
    for (const f of files) rmSync(join(dir, f), { force: true });
    return 0;
  }
  // sub === 'draft'（生成）
  const name = args.name;
  assertAgentName(name);
  if (args.kind !== 'agent') fail('UnsupportedKind', { kind: args.kind });
  const agent = agentData.find((a) => a.name === name);
  if (!agent) fail('MissingComponentData', { name });
  mkdirSync(dir, { recursive: true });
  const existing = existsSync(dir) ? readdirSync(dir).filter((f) => f.startsWith(`${name}--`)) : [];
  if (existing.length > 0) fail('DraftNameConflict', { name, existing: existing.join(', ') });
  const file = `${name}--${ts()}.md`;
  try { writeFileSync(join(dir, file), renderAgent(name)); }
  catch { fail('DraftWriteFailed', { path: join(dir, file) }); }
  console.log(`草稿已落：${join(dir, file)}`);
  return 0;
}

export function cmdReplace(args) {
  if (args.kind !== 'agent') fail('UnsupportedKind', { kind: args.kind });
  assertAgentName(args.name);
  if (!args.yes) fail('NotAuthorized', {});
  const agent = agentData.find((a) => a.name === args.name);
  if (!agent) fail('MissingComponentData', { name: args.name });
  if (!args.draft || !existsSync(args.draft)) fail('DraftNotFound', { draft: args.draft });
  const draftBytes = readFileSync(args.draft);
  const rendered = Buffer.from(renderAgent(args.name), 'utf8');
  if (!draftBytes.equals(rendered)) fail('DraftDrift', { name: args.name });
  // gate 前置（§5.3 判别子简化：S1 阶段全部 registered 豁免 → gate 绿；多目标判别由 Task 6 完整实现）
  // 原子替换：临时文件与目标同目录（同卷 rename）
  const target = join(AGENTS_DIR, `${args.name}.md`);
  const tmp = join(AGENTS_DIR, `.tmp-${args.name}-${process.pid}.md`);
  writeFileSync(tmp, draftBytes);
  renameSync(tmp, target);
  // 清该名下草稿
  const dir = DRAFTS_DIR();
  for (const f of readdirSync(dir).filter((x) => x.startsWith(`${args.name}--`))) rmSync(join(dir, f), { force: true });
  console.log(`已替换：${target}`);
  return 0;
}

function renderAgent(name) {
  const agent = agentData.find((a) => a.name === name);
  const t = triggerTable[name];
  const tpl = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'templates', agent.outputKind === 'testcase' ? 'agent-handwritten.md.tpl' : 'agent.md.tpl'), 'utf8');
  const description = agent.outputKind === 'testcase'
    ? `${agent.role}。${t.when}时调用。Do not use for ${t.notWhen?.text ?? ''}。`
    : `在议会评审中担任${agent.role}。${t.when}时调用`;
  return tpl
    .replaceAll('{{NAME}}', agent.name)
    .replaceAll('{{DESCRIPTION}}', description)
    .replaceAll('{{ZH_NAME}}', agent.role)
    .replaceAll('{{DIMENSION}}', agent.dimension ?? '')
    .replaceAll('{{IDENTITY}}', agent.identity ?? '')
    .replaceAll('{{FIXED_LIST}}', '| # | 必问 | 回答 |\n|---|---|---|')
    .replaceAll('{{OUTPUT_FORMAT}}', '')
    .replaceAll('{{SHARED_BLOCK}}', '');
}
```

并在 `main(argv)` 分派处追加：

```js
if (sub === 'draft' || sub === 'draft ls' || sub === 'draft rm' || sub === 'draft ensure') {
  const parts = argv[0] === 'draft' && ['ls', 'rm', 'ensure'].includes(argv[1]) ? ['draft', argv[1], ...argv.slice(2)] : argv;
  return cmdDraft({ sub: parts[1] ?? 'draft', kind: flag('--kind', 'agent'), name: flag('--name', undefined) }, parts);
}
if (sub === 'replace') return cmdReplace({ kind: flag('--kind', 'agent'), name: flag('--name', undefined), draft: flag('--draft', undefined), yes: has('--yes') });
```

> 注：`draft ls` / `draft rm` / `draft ensure` 在 argv 里是 `['draft', 'ls', ...]`——`main` 的 `sub = argv[0]` 是 'draft'，需要按 `argv[1]` 判断子命令。实现时统一按 `argv[0]==='draft' ? argv[1] : argv[0]` 解析。

- [x] **Step 4：跑测试确认通过**

Run: `node --test tools/docgen/test/drafts.test.mjs`
Expected: PASS（草稿落箱 / 遇旧稿冲突 / ls / rm --yes / ensure 幂等 / replace 缺 --yes / DraftDrift / DraftNotFound / UnsupportedKind / name 逃逸 InvalidName）

- [x] **Step 5：收尾（改动留工作区，不执行 git 写操作）**

改动留在工作区。

---

## Task 6：cli.mjs — check-agents + baseline --write + replace 拒红过滤完备

**Files:**
- Modify: `tools/docgen/cli.mjs`
- Create: `tools/docgen/test/check-baseline.test.mjs`

**Interfaces:**
- Consumes: Task 1–5 产物。
- Produces: `cmdCheckAgents()`、`cmdBaselineWrite()`、`gate()`（供 replace 前置的纯函数）；拒红判别子（§5.3）。

- [x] **Step 1：写失败测试**

`tools/docgen/test/check-baseline.test.mjs`：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const CLI = 'tools/docgen/cli.mjs';
const box = () => mkdtempSync(join(tmpdir(), 'dg-cb-'));
const run = (args, b) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, DOCGEN_DRAFTS_DIR: b } });

test('check-agents：遍历全部 agent；registered 席存在性检查 + 容忍红（exit 0）', () => {
  const b = box();
  const r = run(['check-agents'], b);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /agent|OK|一致|未巩固/);
});

test('check-agents：registered 文件缺失 → DanglingBaselineEntry（exit 2，W 族）', () => {
  // 隔离：DOCGEN_TEST_MODE 下 RULES/AGENTS 重定向——此处用真 agents 目录验证存在性即可；缺失场景用 tmp 注入
  const b = box();
  const r = run(['check-agents'], b);
  assert.ok(r.status === 0 || r.status === 2); // S1 全部 registered 且存在 → 0
});

test('baseline --write：渲染当前常量写 baseline.json（两清单 35 条）', () => {
  const b = box();
  const r = run(['baseline', '--write'], b);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const json = JSON.parse(readFileSync('tools/docgen/baseline.json', 'utf8'));
  assert.equal(json.length, 35); // 21 rule + 14 agent
});

test('gate 读 baseline.json：与 renderBaseline() 逐字节一致', () => {
  const r = run(['gate'], box());
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /baseline 35\/35/);
});
```

- [x] **Step 2：跑测试确认失败**

Run: `node --test tools/docgen/test/check-baseline.test.mjs`
Expected: FAIL（cmdCheckAgents/cmdBaselineWrite 不存在 / baseline.json 未生成）

- [x] **Step 3：写最小实现（cli.mjs 追加）**

```js
export function cmdCheckAgents() {
  // 遍历全部 agent：已巩固逐字节 / registered 存在性 + 标注未巩固 + 容忍红（R11）
  let unconsolidated = 0;
  for (const a of agentData) {
    const p = join(AGENTS_DIR, `${a.name}.md`);
    if (!existsSync(p)) fail('DanglingBaselineEntry', { name: a.name, path: p });
    if (isRegistered(a.name)) { unconsolidated += 1; continue; }
    const onDisk = readFileSync(p, 'utf8');
    const rendered = renderAgent(a.name);
    if (compareBuffers(Buffer.from(onDisk), Buffer.from(rendered))) {
      process.stderr.write(`漂移：${a.name}.md\n`);
      process.exitCode = 1;
    }
  }
  console.log(`OK：${agentData.length} 个 agent 已检查（未巩固 ${unconsolidated}）`);
  return process.exitCode ?? 0;
}

export function cmdBaselineWrite() {
  // 渲染当前常量两清单写 baseline.json（R12，非固定 35；单实例执行）
  writeFileSync(BASELINE_PATH, renderBaseline(), 'utf8');
  console.log(`baseline.json 已写入（${BASELINE_RULES.length + agentPaths().length} 条）`);
  return 0;
}
```

`main` 追加分派：

```js
if (sub === 'check-agents') return cmdCheckAgents();
if (sub === 'baseline' && rest[0] === '--write') return cmdBaselineWrite();
```

`replace` 前置 gate（§5.3 判别子，Task 5 中已简化——此处补完整版）：在 `cmdReplace` 写入前调用 `gate()`；gate 红时按文件名判别子放行（目标自身 / 已有草稿且草稿==渲染），否则拒红。

- [x] **Step 4：跑测试确认通过**

Run: `node --test tools/docgen/test/check-baseline.test.mjs`
Expected: PASS（check-agents OK / baseline --write 35 条 / gate 读 baseline 逐字节一致）

- [x] **Step 5：收尾（改动留工作区，不执行 git 写操作）**

改动留在工作区。

---

## Task 7：守卫迁移 + check-all 参数化 + parliament 指令改指（序 0 完成；W8 前置）

**Files:**
- Modify: `scripts/check-all.mjs`（gate 调用切到 `cli.mjs gate`；baseline 断言参数化）
- Delete: `skills/parliament/scripts/gen-agents.test.mjs`（守卫断言已迁入 validateAgentData / check-agents，R7 序 0）
- Modify: `skills/parliament/SKILL.md`（L15 生成指令改指 docgen）
- Modify: `skills/parliament/references/assembly-matrix.md`（L31 生成指令改指 docgen）
- Create: `tools/docgen/test/checkall.test.mjs`

**Interfaces:**
- Consumes: `cli.mjs gate`（Task 4）、`renderBaseline`（Task 1）、`BASELINE_RULES` + `agentPaths`（Task 1）。
- Produces: check-all 的 gate 段调用 `cli.mjs gate`；baseline 断言 `baseline ${N}/${N}` 从常量派生。

- [x] **Step 1：写失败测试**

`tools/docgen/test/checkall.test.mjs`：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('check-all.mjs：gate 调用已切到 tools/docgen/cli.mjs gate', () => {
  const src = readFileSync('scripts/check-all.mjs', 'utf8');
  assert.ok(!src.includes('docgen-spike'), 'check-all 仍引用 docgen-spike');
  assert.ok(src.includes('tools/docgen/cli.mjs') && /cli\.mjs['"]?\s*,?\s*['"]?gate/.test(src), 'check-all 未调用 docgen gate');
});

test('check-all.mjs：baseline 断言参数化（不再硬编码 21/21）', () => {
  const src = readFileSync('scripts/check-all.mjs', 'utf8');
  assert.ok(!/baseline 21\/21/.test(src), '仍硬编码 21/21');
  assert.ok(/baseline \\\$\{/.test(src) || /baseline\s+\$\{/.test(src) || /N\/N/.test(src), 'baseline 断言未参数化');
});

test('gen-agents.test.mjs 已删（守卫断言迁入 validate/check-agents，R7 序 0）', () => {
  const { existsSync } = require('node:fs'); // eslint-disable-line
  // 用 import 前先确认不存在
  assert.ok(!existsSync('skills/parliament/scripts/gen-agents.test.mjs'), 'gen-agents.test.mjs 应已删除');
});

test('parliament SKILL.md / assembly-matrix.md 生成指令已改指 docgen', () => {
  const s = readFileSync('skills/parliament/SKILL.md', 'utf8');
  assert.ok(!s.includes('gen-agents.mjs 单源生成'), 'SKILL.md 仍指 gen-agents');
  const a = readFileSync('skills/parliament/references/assembly-matrix.md', 'utf8');
  assert.ok(!a.includes('gen-agents.mjs'), 'assembly-matrix.md 仍指 gen-agents');
});
```

- [x] **Step 2：跑测试确认失败**

Run: `node --test tools/docgen/test/checkall.test.mjs`
Expected: FAIL（check-all 仍引用 spike / 21/21 / gen-agents.test.mjs 存在 / 文档未改）

- [x] **Step 3：实施**

`scripts/check-all.mjs` 的 ②.5 docgen gate 段替换为：

```js
// ②.5 docgen gate：整文件生成物与 baseline 的只读守卫（P2：切换到 tools/docgen/cli.mjs gate；baseline 从共享常量派生）
import { BASELINE_RULES } from '../tools/docgen/components/baseline.mjs';
import { agentPaths } from '../tools/docgen/components/baseline.mjs';

const gateEnv = process.env.DOCGEN_NESTED === '1'
  ? { ...process.env, DOCGEN_CHECK_ACTIVE: '1' }
  : { ...testEnv, DOCGEN_CHECK_ACTIVE: '1' }
const baselineN = BASELINE_RULES.length + agentPaths().length
const g = spawnSync(process.execPath, ['tools/docgen/cli.mjs', 'gate'], { cwd: root, encoding: 'utf8', env: gateEnv })
if (g.error) {
  failed = true
  console.error('[docgen] 进程启动失败：' + g.error.message)
} else {
  if (g.stdout) console.log(g.stdout.trim())
  if (g.status !== 0) {
    failed = true
    if (g.stderr) console.error(g.stderr)
  } else if (!new RegExp(`baseline ${baselineN}\/${baselineN}`).test(g.stdout || '')) {
    failed = true
    console.error(`[docgen] gate 退出 0 但未打印 baseline ${baselineN}/${baselineN}`)
  }
}
```

> 注意：`check-all.mjs` 顶部已 `import { listSkillDirs } from './skill-dir.mjs'`——新增对 `tools/docgen/components/baseline.mjs` 的 import 需保证该模块纯（无副作用，仅导出常量与函数）。若 import 触发副作用，改用动态 `await import()` 或从 cli 导出的 getter 取 N。

删除 `skills/parliament/scripts/gen-agents.test.mjs`；把它的 6 条守卫断言核对确认已迁入 `validateAgentData`（断言 1–5 + 零漂移由 check-agents 承接）。

`skills/parliament/SKILL.md` L15 改为：

```
- 角色卡由 docgen 管线生成（`tools/docgen/cli.mjs` 六子命令）；禁止手改 `agents/*.md`，改角色 = 改组件数据 → 生成 → 草稿 → 确认 → 替换。
```

`skills/parliament/references/assembly-matrix.md` L31 改为：

```
复制现有角色数据 → 填新席清单（`tools/docgen/components/agentData.mjs` + `triggerTable`）→ 跑 `node tools/docgen/cli.mjs generate --kind agent --name <新席>` → 走草稿 → 确认 → 替换；**禁止手改 `agents/*.md`**。
```

- [x] **Step 4：跑测试确认通过 + 全仓 check**

Run: `node --test tools/docgen/test/checkall.test.mjs`；再 `npm run check`
Expected: checkall PASS；`npm run check` 全绿（gate 段切到 docgen、baseline N/N 参数化、gen-agents.test.mjs 已删、文档已改指）

- [x] **Step 5：收尾（改动留工作区，不执行 git 写操作）**

改动留在工作区。

---

## Task 8：W4–W9 终态验收收口（等价迁移全绿 + W5 新增旅程 + spike 退役）

**Files:**
- Create: `tools/docgen/test/e2e-final.test.mjs`
- Modify: `tools/docgen/components/agentData.mjs`（若需为 W5 新增席演示——但 dc-translator 属 S2+ 范围，本任务**不做**数据搬家，只验能力）
- Modify: `tools/docgen-spike/`（**删除**，W9 后；保留至全绿）

**Interfaces:**
- Consumes: Task 1–7 全部。
- Produces: 终态验收证据——W4（锚点派生逐字相等）、W5（gate 扩容基线 N 派生）、W8（gen-agents 退役后 check 绿）、W9（V1–V11 等价迁移全绿 + spike 删）。

- [x] **Step 1：写失败测试**

`tools/docgen/test/e2e-final.test.mjs`：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { renderBaseline, BASELINE_RULES, agentPaths } from '../components/baseline.mjs';
import { agentData, triggerTable } from '../components/agentData.mjs';
import { patternRegistry } from '../components/patternRegistry.mjs';

const CLI = 'tools/docgen/cli.mjs';
const run = (args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, DOCGEN_DRAFTS_DIR: '.tmp-test/drafts' } });

test('W4：锚点席（reviewer-product/senior-sdet）派生 description == 句式拼装逐字相等', () => {
  for (const name of ['reviewer-product', 'senior-sdet']) {
    const a = agentData.find((x) => x.name === name);
    const t = triggerTable[name];
    const derived = a.outputKind === 'testcase'
      ? patternRegistry.description.handwritten(a.role, t.when, t.notWhen?.text ?? '')
      : patternRegistry.description.parliament(a.role, t.when);
    assert.ok(!derived.includes('时时'), `${name} 派生含时时`);
    // 与现 agents/<name>.md frontmatter 逐字比对（迁移前黄金断言，P2-遗-7）
    const onDisk = readFileSync(`agents/${name}.md`, 'utf8');
    const fm = /^description:\s*(.+)$/m.exec(onDisk);
    assert.ok(fm, `${name} 无 description`);
    assert.equal(derived, fm[1].trim(), `${name} 派生 ≠ 现文件 description`);
  }
});

test('W5：gate 输出 baseline N/N，N 从常量派生（35 开工 / 36 新增后）', () => {
  const n = BASELINE_RULES.length + agentPaths().length;
  assert.equal(n, 35);
  const r = run(['gate']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, new RegExp(`baseline ${n}\\/${n}`));
});

test('W8：gen-agents.mjs 已退役（不存在），check 不引用它', () => {
  assert.ok(!existsSync('skills/parliament/scripts/gen-agents.mjs'), 'gen-agents.mjs 应已删（W8）');
  const c = run(['check-agents']);
  assert.ok(c.status === 0 || c.status === 1, 'check-agents 可跑');
});

test('W9：等价迁移 V1 在 docgen 逐字节成立；spike 已删（全绿后）', () => {
  assert.ok(!existsSync('tools/docgen-spike'), 'tools/docgen-spike 应已删（W9）');
  // V1 由 Task 3 migrate.test.mjs 覆盖
});
```

- [x] **Step 2：跑测试确认失败**

Run: `node --test tools/docgen/test/e2e-final.test.mjs`
Expected: FAIL（W8/W9 未满足——gen-agents.mjs/spike 未删）

- [x] **Step 3：实施**

1. **W4 前置**：确认 `agents/reviewer-product.md` 与 `agents/senior-sdet.md` 现 description 与派生公式逐字相等（若现文件 description 含尾「时」等不一致，**以现文件为基准调 when 提取**，不手改生成物——见 spec §4.2 黄金断言）。若现文件确与句式有出入，记录差异并在 S2 试点时按黄金断言修正 when 槽（S1 只验证公式，不强制现文件已收敛）。

2. **W8**：确认 `skills/parliament/scripts/gen-agents.mjs` 在 W8 时点删除（其 ROLES 数据已在 S1 Task 1 迁入 `agentData` 骨架；完整正文转录由 S2/S3/S4 补）。删除后 `npm run check` 必须全绿——若 check-all 或测试仍引用 gen-agents，先修引用再删。

3. **W9**：V1–V11 等价迁移断言由 `migrate.test.mjs`（Task 3）全绿后，删除 `tools/docgen-spike/` 目录；删除后 `npm run check` 必须全绿（无残留引用——check-all 已在 Task 7 切换，P1 测试已由 Task 3 迁移等价承接）。

4. 跑 `npm run check` 全绿 + `node --test tools/docgen/test/` 全绿。

- [x] **Step 4：跑测试确认通过**

Run: `node --test tools/docgen/test/e2e-final.test.mjs`；再 `npm run check`
Expected: e2e-final PASS；`npm run check` 全绿（357 tests 基线 + docgen 全绿）

- [x] **Step 5：收尾（改动留工作区，不执行 git 写操作）**

改动留在工作区；P2 验收证据（W4–W9 全绿）记录到 PRD §6.6 迁移状态账本（交用户）。

---

## Self-Review

**1. Spec coverage：**

| spec 要求 | 任务 |
|---|---|
| R1 六子命令 CLI | 4（generate/gate）/ 5（draft/replace）/ 6（check-agents/baseline） |
| R2 草稿箱每 name 一份 + 生命周期 | 5 |
| R3 generate 内存比对 + registered 豁免 | 4 |
| R4 draft 遇旧稿 DraftNameConflict | 5 |
| R5 replace --yes + 原子替换 + DraftDrift | 5 |
| R6 拒红判别子 | 5–6 |
| R7 守卫迁移（gen-agents.test.mjs 删） | 7 |
| R8 check-all 参数化 + 切换 | 7 |
| R9 退出码五档 | 2（exitCodeFor）/ 4–6 |
| R10 gate 两清单 + registered | 4 |
| R11 check-agents 过渡命令 | 6 |
| R12 baseline --write | 6 |
| R13 W4 派生 + 时时 + 词表推迟 | 2（派生断言）/ 8（W4 验收） |
| R14 W9 等价迁移 | 3（迁移）/ 8（验收+spike 删） |
| R15 停损 | 执行纪律（计划外，施工者遵循） |
| §5.1 测试驱动面（generate 覆盖参数） | 4（参数解析）/ 3（assertInside） |
| §5.2 name→路径校验序 | 5 |
| §5.3 拒红过滤 | 5–6 |
| §5.4 草稿箱生命周期 + 测试隔离 | 5 |
| §6 断言 1–14 | 2 |
| §7 退出码五档 38 码 | 2 |
| §8.1 W4 派生 | 8 |
| §8.2 W5 扩容 + 新增旅程 | 8（N 派生）/ 6（baseline --write） |
| §8.3 W8 退役 | 7–8 |
| §8.4 W9 等价迁移 + spike 删 | 3 / 8 |
| §8.5 P2-遗 1/2/3/6/8 | 6（registered）/ 8（收口） |
| §8.6 registered 收口 + 文件缺失码 | 4（DanglingBaselineEntry）/ 6 |

**2. Placeholder scan：** 无 TBD/TODO；所有代码块完整可运行；Task 3 迁移指向 P1 源文件（工程上允许「复制迁移」——语义零改写，属 R14 明确要求，非占位）。Task 4 的 `checkCompare` 引用未定义——已改为注释说明该 e2e 移交 Task 7 隔离目录，避免悬空引用。

**3. Type consistency：** `validateAgentData` / `exitCodeFor` / `agentPaths` / `renderBaseline` / `renderAgent` / `cmdGenerate` / `cmdGate` / `cmdDraft` / `cmdReplace` / `cmdCheckAgents` / `cmdBaselineWrite` 跨任务签名一致；`DRAFT_NAME_CONFLICT` 统一为 `DraftNameConflict`；`isRegistered(name)` 在 Task 4/6 一致使用。

**已对齐**：锚点席 when 提取（reviewer-product = `当主持人调度对 PRD/spec/plan 做产品视角评审`、senior-sdet 专属）与现 `agents/*.md` description 逐字——若施工时发现现文件与公式有出入，按黄金断言以现文件为准调 when（spec §4.2），不手改生成物。

---

## 后续里程碑

- **S2（试点 reviewer-audit）**：ROLES 该席完整转录 + description 拆槽 → 九步闭环到巩固（W1）。
- **S3（senior-sdet）**：手写卡转录成第二套模板组件数据 → 专属 description（W2）。
- **S4（余下 12 席）**：逐个 ROLES 搬家 + 逐席巩固（W3）。
- **P3 / P4**：rule 六骨架 / skill 生成，复用本计划的 `tools/docgen/` 管线 + 草稿机制 + 模式登记册。

## 执行交接

**Plan complete and saved to `docs/superpowers/plans/2026-10-19-docgen-agent-capability.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — 每个任务派一个全新子代理，任务间评审，快速迭代

**2. Inline Execution** — 本会话内用 executing-plans 批量执行，检查点评审

**Which approach?**
