# Docgen P2 · S2：试点 1 席（reviewer-audit 数据搬家）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`（推荐）或 `executing-plans` 逐任务执行。步骤用 `- [ ]` 勾选跟踪。
>
> **本计划不执行任何 git 写操作**：每个任务收尾把改动留在工作区，最终由用户决定提交方式。

**Goal:** 把 `reviewer-audit` 一席从「迁移前现文件（黄金快照）」转录成 docgen 组件数据，经模板渲染逐字节复现，走完九步闭环到「已巩固」，并落 W1 验收。

**Architecture:** 数据层（`agentData` / `triggerTable` / `patternRegistry` / `sharedBlocks` / `outputFormats`）+ 纯渲染层（`renderAgent.mjs`）+ 编排层（`cli.mjs`：generate / draft / replace / gate / check-agents / baseline）+ 状态与证据（`state.json` / `fixtures/<name>.evidence.json`）+ 验收脚本（`acceptance/*.mjs`）。测试按 `*-testcase.md` 的 77 条用例映射到单测与 acceptance 脚本；验收类用例不进 `*.test.mjs`，避免 `npm run check` 递归。

**Tech Stack:** Node ≥22 内置模块（`node:fs` / `node:path` / `node:crypto` / `node:os` / `node:assert` / `node:test` / `node:child_process` 仅编排与验收层）；零第三方依赖；PowerShell + Git。

**Spec:** `docs/superpowers/specs/2026-10-19-docgen-agent-pilot-design.md`（rev3+，已提交 `376d692`）

**Testcase:** `docs/superpowers/specs/2026-10-19-docgen-agent-pilot-design-testcase.md`（rev4，77 条）

## Global Constraints

- Node ≥22；零第三方依赖；`components/*.mjs` 不得 import `node:fs` / `node:child_process`（`compare.mjs` 的既有 Ruling 例外保持不动）。
- 所有落盘文件 LF、UTF-8、无 BOM、末尾恰一个 `\n`（沿用 `checkEnvironment` 纪律）。
- `agents/reviewer-audit.md` 是生成视图，**禁止手改**（D6）；任何差异回炉改组件/模板。
- description 是派生字段，`agentData` 不存独立 description；硬编码 → `DescriptionDerivation`（exit 1）。
- 黄金快照 = 步 1 记录提交号的 git blob（`git show <commit>:agents/reviewer-audit.md`）；不得读工作区活文件，不得在替换后读取。
- 转录只以黄金快照为源，不留第二份转录源。
- 九步顺序不可跳：入选 → 数据迁移 → 生成 → 逐字节比对 → 接守卫 → 落草稿 → 替换 → 验收 → 巩固。
- `state.json` 是「已接管」的唯一机器载体；只有 `replace` 写；写序 = 先 state 后目标；非法 version/值/键 → `StateFileInvalid`（exit 2）。
- evidence 每席一份：`tools/docgen/fixtures/<name>.evidence.json`；字段 `commit/blob/sha256/hashObject/goldenAssertion/compareResult/renderSha256/lastWrittenHash`。
- 测试执行模型：需要 `replace` / `npm run check` / 冷跑 / 真实仓库改写的验收用例一律放 `tools/docgen/acceptance/*.mjs`；`*.test.mjs` 内禁止 spawn `npm run check`。
- **W5 / dc-translator 不在本计划范围**：按 PRD §6.6 依赖图，新增席旅程在 S2/S3/S4 之后；本计划所有席位数按 14 席快照（余下 12 席、13 席共用模板、11 席未拆槽、baseline 35）。
- 每个任务结束：改动留在工作区；不执行 `git add` / `git commit`。

---

## File Structure

| 文件 | 职责 | 纯度 | 任务 |
|---|---|---|---|
| `tools/docgen/components/agentData.mjs` | `agentData` 的 reviewer-audit 完整条目 + `triggerTable` 的 reviewer-audit 条目 | 纯 | 1 |
| `tools/docgen/components/patternRegistry.mjs` | 导出 `DOMAIN`；`parliament(role, when, domain = DOMAIN)` 可注入 | 纯 | 1 |
| `tools/docgen/components/sharedBlocks.mjs` | 共享块正文；本试点只实现 `AUDIT_RULES` | 纯 | 2 |
| `tools/docgen/components/outputFormats.mjs` | 输出格式正文；本试点只实现 `audit` | 纯 | 2 |
| `tools/docgen/components/renderAgent.mjs` | 纯渲染函数（零 fs） | 纯 | 3 |
| `tools/docgen/templates/agent.md.tpl` | 全量议会席模板 + `{{TOOLS}}`，删除 `## 共享块` | 数据 | 3 |
| `tools/docgen/cli.mjs` | `renderByName`、agent 渲染/比对、`collectGate`/`gateChecks` 导出、replace、draft `wx`、check-agents 按 state 分流 | 编排 | 4–7 |
| `tools/docgen/state.mjs` | `state.json` 读写与校验（允许 IO） | 编排 | 6 |
| `tools/docgen/evidence.mjs` | evidence 读写与校验（允许 IO） | 编排 | 6 |
| `tools/docgen/state.json` | 接管状态（初始 `{version:1,agents:{}}`，进 git） | 数据 | 6 |
| `tools/docgen/fixtures/reviewer-audit.evidence.json` | 步 1/4 证据（运行期生成，进 git） | 数据 | 8–9 |
| `tools/docgen/acceptance/golden-assert.mjs` | 黄金断言 + 整文件比对 + 写 evidence | 验收 | 8 |
| `tools/docgen/acceptance/init-evidence.mjs` | 步 1 四值采集 + 写 evidence | 验收 | 8 |
| `tools/docgen/acceptance/cold-run.mjs` | 冷跑：交付清单复制 + gate | 验收 | 8 |
| `tools/docgen/acceptance/replace-scenarios.mjs` | replace/判别子/TargetDrift/幂等/中断的副本场景 | 验收 | 7 |
| `tools/docgen/test/pilot-data.test.mjs` | 数据形状 / description / DOMAIN | 测试 | 1 |
| `tools/docgen/test/pilot-render.test.mjs` | 渲染逐字节 / 模板纯度 / 数据变异 / 槽位 | 测试 | 2–3 |
| `tools/docgen/test/pilot-gate.test.mjs` | EXIT 码 / state / check-agents / collectGate | 测试 | 5–6 |
| `docs/prd/20261019093443-docgen-agent-generation.md` §6.6 | 迁移账本行（人读镜像） | 文档 | 9 |
| `agents/reviewer-audit.md` | 由 docgen 替换（字节不变） | 生成物 | 9 |

---

## Task 1：reviewer-audit 数据条目 + DOMAIN

**Files:**
- Modify: `tools/docgen/components/agentData.mjs:5-30`
- Modify: `tools/docgen/components/patternRegistry.mjs:1-8`
- Test: `tools/docgen/test/pilot-data.test.mjs`

**Interfaces:**
- Produces: `agentData` 中 `reviewer-audit` 条目含 `identity` / `fixedList`（7 条）；`triggerTable['reviewer-audit'] = { when, route }`；`patternRegistry.DOMAIN = '议会评审'`；`patternRegistry.description.parliament(role, when, domain = DOMAIN)`。

- [ ] **Step 1：写失败测试**

创建 `tools/docgen/test/pilot-data.test.mjs`：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { agentData, triggerTable } from '../components/agentData.mjs';
import { patternRegistry, DOMAIN } from '../components/patternRegistry.mjs';

const entry = () => agentData.find((a) => a.name === 'reviewer-audit');

test('reviewer-audit 八键齐，触发表四字段不混入 agentData', () => {
  const a = entry();
  assert.equal(a.role, '审计专员');
  assert.equal(a.dimension, '独立（标准核对）');
  assert.deepEqual(a.tools, ['Read', 'Glob', 'Grep']);
  assert.equal(
    a.identity,
    '资深审计专员，只审各项标准是否达到，不裁技术对错，不提新技术问题。',
  );
  assert.equal(a.fixedList.length, 7);
  assert.equal(a.fixedList[3], '计数一致：卡片数 = 已修 + 关闭 + 候选 + 升级 + 带往下轮');
  assert.equal(a.sharedBlock, 'AUDIT_RULES');
  assert.equal(a.outputKind, 'audit');
  assert.equal(a.description, undefined);
  assert.equal(a.when, undefined);
  assert.equal(a.route, undefined);
});

test('triggerTable reviewer-audit 只有 when/route，when 不含末尾「时」', () => {
  const t = triggerTable['reviewer-audit'];
  assert.deepEqual(Object.keys(t).sort(), ['route', 'when']);
  assert.equal(t.when, '当议会评审需要过程标准核对、轮际对账或交付审计');
  assert.ok(!t.when.endsWith('时'));
});

test('DOMAIN 可注入且真被消费', () => {
  assert.equal(DOMAIN, '议会评审');
  assert.equal(
    patternRegistry.description.parliament('审计专员', '当X', '测试域'),
    '在测试域中担任审计专员。当X时调用',
  );
  assert.equal(
    patternRegistry.description.parliament('审计专员', '当X'),
    '在议会评审中担任审计专员。当X时调用',
  );
});
```

- [ ] **Step 2：运行测试确认失败**

Run: `node --test tools/docgen/test/pilot-data.test.mjs`
Expected: FAIL（`DOMAIN` 未导出 / `identity`、`fixedList` 为 `undefined` / `triggerTable['reviewer-audit']` 为 `undefined`）。

- [ ] **Step 3：写最小实现**

`agentData.mjs` 的 SKELETON 中 `reviewer-audit` 条目改为：

```js
{
  name: 'reviewer-audit',
  role: '审计专员',
  dimension: '独立（标准核对）',
  identity: '资深审计专员，只审各项标准是否达到，不裁技术对错，不提新技术问题。',
  fixedList: [
    '卡片合规：八字段齐（缺证据或建议解法 = 废卡）',
    '级别匹配：P0 需两处冲突证据；P1 需可复现触发序列；否则应降级',
    '答辩合规：判定（承认/反驳/部分承认）+ 依据 + 修法三字段齐',
    '计数一致：卡片数 = 已修 + 关闭 + 候选 + 升级 + 带往下轮',
    '轮际对账：上轮承诺与本轮开卷清单逐项相等（少 = 蒸发，多 = 无来源）',
    '落点真实：修复对照抽查 ≥3，文件:行号真实存在且内容相符',
    '证据可复算：任抽一条沿证据链能重现结果',
  ],
  sharedBlock: 'AUDIT_RULES',
  outputKind: 'audit',
},
```

`triggerTable` 增加：

```js
'reviewer-audit': {
  when: '当议会评审需要过程标准核对、轮际对账或交付审计',
  route: 'reviewer-audit',
},
```

`patternRegistry.mjs` 改为：

```js
export const DOMAIN = '议会评审';

export const patternRegistry = {
  description: {
    parliament: (role, when, domain = DOMAIN) => `在${domain}中担任${role}。${when}时调用`,
    handwritten: (identity, when, notWhen) => `${identity}。${when}时调用。Do not use for ${notWhen}。`,
  },
  identityMaster: '资深{role}，对{dim1}与{dim2}有经验直觉',
  tools: { readOnly: ['Read', 'Glob', 'Grep'], sdet: ['Read', 'Glob', 'Grep', 'Write', 'Edit'] },
  outputKind: new Set(['issue-card', 'observation', 'audit', 'testcase']),
  sharedBlock: new Set(['SIX_METHODS', 'DETECTIVE_RULES', 'AUDIT_RULES']),
};
```

- [ ] **Step 4：运行测试确认通过**

Run: `node --test tools/docgen/test/pilot-data.test.mjs`
Expected: PASS（3 tests）。

- [ ] **Step 5：回归既有数据测试**

Run: `node --test tools/docgen/test/data.test.mjs`
Expected: PASS（既有 14 席 / 宿主分离断言不被破坏）。

- [ ] **Step 6：改动留在工作区**

不执行 `git add` / `git commit`。检查 `git status --short tools/docgen/`，应只出现 `agentData.mjs` / `patternRegistry.mjs` 与新增测试。

---

## Task 2：共享块与输出格式数据

**Files:**
- Create: `tools/docgen/components/sharedBlocks.mjs`
- Create: `tools/docgen/components/outputFormats.mjs`
- Test: `tools/docgen/test/pilot-render.test.mjs`（先写共享块/格式的断言；渲染断言在 Task 3 补）

**Interfaces:**
- Produces: `sharedBlocks.AUDIT_RULES`（字符串，`### 审计铁律` 3 条，前后各一空行语义）；`outputFormats.audit`（字符串，轮间核对单 + 交付审计表两节）。

- [ ] **Step 1：写失败测试**

创建 `tools/docgen/test/pilot-render.test.mjs`：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { sharedBlocks } from '../components/sharedBlocks.mjs';
import { outputFormats } from '../components/outputFormats.mjs';

test('AUDIT_RULES 是 3 条审计铁律，逐字取自黄金快照 L89-91', () => {
  const s = sharedBlocks.AUDIT_RULES;
  assert.ok(s.startsWith('\n### 审计铁律\n- 轮间核对单与交付审计表必由你本人实例完成；主持人代填即违规\n'));
  assert.ok(s.includes('- 证据栏空 = 不通过，不是待补\n'));
  assert.ok(s.includes('- 你无中断评审权；不裁决技术分歧；机械绿 ≠ 语义真（限度自知并声明）\n'));
  assert.ok(s.endsWith('\n'));
});

test('audit 输出格式含核对项/A 节/B 节/两个结论，逐字取自黄金快照 L32-79', () => {
  const s = outputFormats.audit;
  for (const anchor of [
    '> 声明：本核对单必由审计专员本人实例完成；主持人代填即违规；证据栏空 = 不通过，不是待补。',
    '## 核对项',
    '## A 节 过程闭环',
    '## B 节 按 doc-taxonomy 完成判据逐交付物核对',
    '- 通过',
    '- 不通过（打回清单）：',
  ]) {
    assert.ok(s.includes(anchor), `缺锚点：${anchor}`);
  }
  assert.ok(s.startsWith('\n\n'));
  assert.ok(s.endsWith('\n'));
});
```

- [ ] **Step 2：运行测试确认失败**

Run: `node --test tools/docgen/test/pilot-render.test.mjs`
Expected: FAIL（模块不存在）。

- [ ] **Step 3：写最小实现**

创建 `tools/docgen/components/sharedBlocks.mjs`：

```js
// 共享块正文：本试点只实现 AUDIT_RULES；SIX_METHODS/DETECTIVE_RULES 由 S4 补。
export const sharedBlocks = {
  AUDIT_RULES: `\n### 审计铁律\n- 轮间核对单与交付审计表必由你本人实例完成；主持人代填即违规\n- 证据栏空 = 不通过，不是待补\n- 你无中断评审权；不裁决技术分歧；机械绿 ≠ 语义真（限度自知并声明）\n`,
};
```

创建 `tools/docgen/components/outputFormats.mjs`（逐字抄自 `agents/reviewer-audit.md` 第 32–79 行；注意开头两个空行、结尾一个换行由模板的占位符行补足）：

```js
export const outputFormats = {
  audit: `\n\n> 声明：本核对单必由审计专员本人实例完成；主持人代填即违规；证据栏空 = 不通过，不是待补。
> 机械计数项（第 3、5 项）证据栏必须写「取数命令 + 输出」，缺命令或输出 = 证据栏空 = 不通过（防主持人靠心算数数——心算必错，实测数错 3 次被拦）。

## 核对项

| 项 | 核对内容 | 结果 | 证据 |
|---|---|---|---|
| 第 0 项 轮际对账 | 上轮承诺 vs 本轮开卷清单（以送审说明 §2 为准）逐项相等 |  |  |
| 第 1 项 卡片字段齐 | 八字段，缺证据或建议解法 = 废卡 |  |  |
| 第 2 项 答辩字段齐 | 判定 + 依据 + 修法 |  |  |
| 第 3 项 本轮终态对账 | 卡片数 = 已修 + 关闭 + 候选 + 升级 + 带往下轮 |  |  |
| 第 4 项 侦探观察存在且卡号真实 |  |  |  |
| 第 5 项 汇总未丢卡 |  |  |  |

## 结论

过 / 不过+打回清单

> 机械计数由主持人跑命令、审计员核对并抽查 1-2 项语义。



> 声明：本审计表必由审计专员本人实例完成；主持人代填即违规；证据栏空 = 不通过，不是待补。

## A 节 过程闭环

| 项 | 核对内容 | 结果 | 证据 |
|---|---|---|---|
| A1 终态对账 |  |  |  |
| A2 P0P1 清零 |  |  |  |
| A3 落点抽查 ≥3 |  |  |  |
| A4 P2 三态齐（采纳/关闭/候选） |  |  |  |
| A5 数字一致 |  |  |  |
| A6 升级项有终裁 |  |  |  |

## B 节 按 doc-taxonomy 完成判据逐交付物核对

按 \`references/doc-taxonomy.md\` 的完成判据，逐交付物一行 + 证据栏：

| 交付物 | 完成判据核对 | 结果 | 证据 |
|---|---|---|---|
|  |  |  |  |

## 结论

- 通过
- 有条件通过（候选项 + 触发信号列明）：
- 不通过（打回清单）：
`,
};
```

> 注意：`outputFormats.audit` 的结尾是 `- 不通过（打回清单）：\n`；模板占位符行后的空行与 `## 通用纪律` 前空行由模板提供，不要在字符串里重复。

- [ ] **Step 4：运行测试确认通过**

Run: `node --test tools/docgen/test/pilot-render.test.mjs`
Expected: PASS（2 tests）。

- [ ] **Step 5：改动留在工作区**

不执行 git 写操作。

---

## Task 3：纯渲染函数 + 全量模板

**Files:**
- Create: `tools/docgen/components/renderAgent.mjs`
- Modify: `tools/docgen/templates/agent.md.tpl`（整体替换）
- Test: `tools/docgen/test/pilot-render.test.mjs`（追加）

**Interfaces:**
- Produces: `renderAgent({ agent, trigger, template, sharedBlocks, outputFormats }) → string`；模板槽位 `{{NAME}}` / `{{DESCRIPTION}}` / `{{TOOLS}}` / `{{ZH_NAME}}` / `{{DIMENSION}}` / `{{IDENTITY}}` / `{{FIXED_LIST}}` / `{{OUTPUT_FORMAT}}` / `{{SHARED_BLOCK}}`。

- [ ] **Step 1：写失败测试**

在 `pilot-render.test.mjs` 追加：

```js
import { readFileSync } from 'node:fs';
import { agentData, triggerTable } from '../components/agentData.mjs';
import { renderAgent } from '../components/renderAgent.mjs';

const agent = () => agentData.find((a) => a.name === 'reviewer-audit');
const tpl = () => readFileSync('tools/docgen/templates/agent.md.tpl', 'utf8');

test('渲染结果与黄金快照整文件逐字节相等', () => {
  const actual = renderAgent({
    agent: agent(),
    trigger: triggerTable['reviewer-audit'],
    template: tpl(),
    sharedBlocks,
    outputFormats,
  });
  const expected = readFileSync('agents/reviewer-audit.md', 'utf8');
  assert.equal(Buffer.compare(Buffer.from(actual), Buffer.from(expected)), 0);
});

test('模板纯度：不含本席 identity/fixedList/角色名/审计铁律/## 共享块', () => {
  const t = tpl();
  assert.ok(!t.includes('资深审计专员'));
  assert.ok(!t.includes('卡片合规：'));
  assert.ok(!t.includes('审计专员'));
  assert.ok(!t.includes('### 审计铁律'));
  assert.ok(!t.includes('## 共享块'));
  assert.ok(t.includes('{{TOOLS}}'));
});

test('数据变异：改 identity 只改该行；7 条 fixedList 逐条变异各只改一行', () => {
  const base = renderAgent({
    agent: agent(), trigger: triggerTable['reviewer-audit'], template: tpl(), sharedBlocks, outputFormats,
  });
  const mutated = renderAgent({
    agent: { ...agent(), identity: agent().identity + '（变异）' },
    trigger: triggerTable['reviewer-audit'], template: tpl(), sharedBlocks, outputFormats,
  });
  const diff = mutated.split('\n').filter((line, i) => line !== base.split('\n')[i]);
  assert.equal(diff.length, 1);
  assert.ok(diff[0].includes('（变异）'));

  for (let i = 0; i < 7; i += 1) {
    const fixedList = [...agent().fixedList];
    fixedList[i] += '（变异）';
    const m = renderAgent({
      agent: { ...agent(), fixedList },
      trigger: triggerTable['reviewer-audit'], template: tpl(), sharedBlocks, outputFormats,
    });
    const d = m.split('\n').filter((line, j) => line !== base.split('\n')[j]);
    assert.equal(d.length, 1, `fixedList[${i}] 变异影响了 ${d.length} 行`);
    assert.ok(d[0].includes('（变异）'));
  }
});

test('固定必问清单渲染为 7 行表格 + tools 渲染为逗号空格', () => {
  const s = renderAgent({
    agent: agent(), trigger: triggerTable['reviewer-audit'], template: tpl(), sharedBlocks, outputFormats,
  });
  assert.match(s, /^tools: Read, Glob, Grep$/m);
  assert.equal((s.match(/^\| \d+ \| .* \| 待答 \|$/gm) || []).length, 7);
});
```

- [ ] **Step 2：运行测试确认失败**

Run: `node --test tools/docgen/test/pilot-render.test.mjs`
Expected: FAIL（`renderAgent.mjs` 不存在；模板仍为 S1 骨架）。

- [ ] **Step 3：写最小实现**

创建 `tools/docgen/components/renderAgent.mjs`：

```js
import { patternRegistry } from './patternRegistry.mjs';

function fill(template, key, value) {
  return template.replaceAll(key, () => value);
}

export function renderAgent({ agent, trigger, template, sharedBlocks = {}, outputFormats = {} }) {
  const description = agent.outputKind === 'testcase'
    ? patternRegistry.description.handwritten(agent.role, trigger.when, trigger.notWhen?.text ?? '')
    : patternRegistry.description.parliament(agent.role, trigger.when);

  const fixedList = agent.fixedList && agent.fixedList.length
    ? `| # | 必问 | 回答 |\n|---|---|---|\n${agent.fixedList.map((q, i) => `| ${i + 1} | ${q} | 待答 |`).join('\n')}`
    : '| # | 必问 | 回答 |\n|---|---|---|';

  let out = template;
  out = fill(out, '{{NAME}}', agent.name);
  out = fill(out, '{{DESCRIPTION}}', description);
  out = fill(out, '{{TOOLS}}', (agent.tools ?? []).join(', '));
  out = fill(out, '{{ZH_NAME}}', agent.role);
  out = fill(out, '{{DIMENSION}}', agent.dimension ?? '');
  out = fill(out, '{{IDENTITY}}', agent.identity ?? '');
  out = fill(out, '{{FIXED_LIST}}', fixedList);
  out = fill(out, '{{OUTPUT_FORMAT}}', outputFormats[agent.outputKind] ?? '');
  out = fill(out, '{{SHARED_BLOCK}}', sharedBlocks[agent.sharedBlock] ?? '');
  return out;
}
```

将 `tools/docgen/templates/agent.md.tpl` 整体替换为（复制 `skills/parliament/assets/agent-template.md`，只把第 4 行 `tools: Read, Glob, Grep` 改为 `tools: {{TOOLS}}`）：

```markdown
---
name: {{NAME}}
description: {{DESCRIPTION}}
tools: {{TOOLS}}
---

# 角色：{{ZH_NAME}}（{{DIMENSION}}）

## 你是谁
{{IDENTITY}}

## 共享特质（所有议会成员同一份措辞，禁止自行改写）
包容、客观、理性、自省、诚实；眼光长远，做正确的事；用最简单、容易理解的方式表达，让非专业人员也能听懂；不空谈，善于把所有事情按极高标准落地；不满足于现状，执行中主动发现问题、判断重要性、给出最合适的判断与处置；采纳周围人的意见，也基于项目长远发展保持自己的主见。

## 固定必问清单（每条必答，"问过，无问题"也要显式记录；缺答 = 不合格）
{{FIXED_LIST}}

## 自由探索（必做，与固定清单同等重要）
固定清单之外，针对这份文档和这个项目的具体情况，现场生成 3-5 个你认为最值得问的问题（先写出来，再逐条回答）。只答固定清单 = 不合格。

## 输出格式
{{OUTPUT_FORMAT}}

## 通用纪律
- 证据可复算：引用文件:行号或命令输出，禁止凭印象断言
- 没问题不制造问题：没问题时显式写「固定 N 条全过，自由 M 条，均无问题」
- 只提问题不给解法 = 无效产出
- 超出职责的事：记录进产出，不自行处置
{{SHARED_BLOCK}}
## 边界
你是只读评审角色：不得创建、修改、删除任何文件；不裁决他人分歧；无中断评审的权力。
```

- [ ] **Step 4：运行测试确认通过**

Run: `node --test tools/docgen/test/pilot-render.test.mjs`
Expected: PASS（6 tests；整文件 `Buffer.compare === 0`）。

- [ ] **Step 5：模板空块边界（边界用例）**

用一个无 `sharedBlock` 的桩席验证空块不留下多余空行：

```js
test('无 sharedBlock 席：共享块整段消失，不出现连续三空行', () => {
  const stub = {
    name: 'stub', role: '桩', dimension: '测试', tools: ['Read'], identity: '桩。',
    fixedList: ['一'], outputKind: 'issue-card',
  };
  const s = renderAgent({
    agent: stub, trigger: { when: '当测试' }, template: tpl(), sharedBlocks, outputFormats,
  });
  assert.ok(!s.includes('\n\n\n'));
  assert.ok(s.includes('## 通用纪律'));
});
```

Run: `node --test tools/docgen/test/pilot-render.test.mjs`
Expected: PASS（7 tests）。

- [ ] **Step 6：改动留在工作区**

不执行 git 写操作。

---

## Task 4：CLI 渲染入口与 generate

**Files:**
- Modify: `tools/docgen/cli.mjs`（import、`renderByName`、`cmdGenerate`）
- Test: `tools/docgen/test/cli-gate.test.mjs`（追加）

**Interfaces:**
- Produces: `export function renderByName(name) → string`；`generate --kind agent --name <name>` 对已拆槽席渲染并比对（0=一致 / 1=不等）；不带 `--name` 的全遍历中，未拆槽席只做存在性检查，已拆槽席渲染 + 比对。

- [ ] **Step 1：写失败测试**

在 `tools/docgen/test/cli-gate.test.mjs` 追加：

```js
test('generate --name reviewer-audit：渲染与黄金快照一致 → exit 0', () => {
  const r = run(['generate', '--kind', 'agent', '--name', 'reviewer-audit']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('generate --name reviewer-qa：registered 未拆槽席只做存在性检查 → exit 0', () => {
  const r = run(['generate', '--kind', 'agent', '--name', 'reviewer-qa']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('generate 全遍历：14 席中已拆槽席渲染比对、其余存在性检查 → exit 0 + baseline 35/35', () => {
  const r = run(['generate']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /baseline 35\/35/);
});
```

- [ ] **Step 2：运行测试确认失败**

Run: `node --test tools/docgen/test/cli-gate.test.mjs`
Expected: FAIL（`generate --name reviewer-audit` 目前只做存在性检查，不会渲染；若模板/数据未就绪也会失败）。

- [ ] **Step 3：写最小实现**

`cli.mjs` 顶部补 import：

```js
import { renderAgent } from './components/renderAgent.mjs';
import { sharedBlocks } from './components/sharedBlocks.mjs';
import { outputFormats } from './components/outputFormats.mjs';
```

把私有 `renderAgent(name)` 替换为导出的 `renderByName`：

```js
export function renderByName(name) {
  const agent = agentData.find((a) => a.name === name);
  if (!agent) fail('MissingComponentData', { name });
  const t = triggerTable[name];
  if (!t || t.when === undefined) {
    fail('MissingComponentData', { name, reason: 'registered 未拆槽席不可渲染（S2+ 拆槽后可用）' });
  }
  const tplName = agent.outputKind === 'testcase' ? 'agent-handwritten.md.tpl' : 'agent.md.tpl';
  const template = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'templates', tplName), 'utf8');
  return renderAgent({ agent, trigger: t, template, sharedBlocks, outputFormats });
}
```

`cmdDraft` / `cmdReplace` 中的 `renderAgent(name)` 调用全部改为 `renderByName(name)`。

`cmdGenerate` 的 agent 分支改为：

```js
} else {
  const agent = agentData.find((a) => a.name === o.name);
  if (!agent) fail('MissingComponentData', { name: o.name });
  const p = join(AGENTS_DIR, `${o.name}.md`);
  if (!existsSync(p)) fail('DanglingBaselineEntry', { name: o.name });
  const t = triggerTable[o.name];
  if (!t || t.when === undefined) continue; // registered 未拆槽席：存在性检查
  const rendered = Buffer.from(renderByName(o.name), 'utf8');
  if (compareBuffers(rendered, readFileSync(p))) drift += 1;
}
```

- [ ] **Step 4：运行测试确认通过**

Run: `node --test tools/docgen/test/cli-gate.test.mjs`
Expected: PASS（既有 4 条 + 新增 3 条）。

- [ ] **Step 5：回归既有 CLI 测试**

Run: `node --test tools/docgen/test/drafts.test.mjs tools/docgen/test/review-fixes.test.mjs`
Expected: PASS（`reviewer-product` 的 draft 仍可用；registered 席仍被拒）。

- [ ] **Step 6：改动留在工作区**

不执行 git 写操作。

---

## Task 5：错误码登记 + description 数据断言

**Files:**
- Modify: `tools/docgen/components/validateAgentData.mjs:4-19,23-31`
- Test: `tools/docgen/test/pilot-gate.test.mjs`

**Interfaces:**
- Produces: `exitCodeFor('TargetDrift') === 1`；`exitCodeFor('StateFileInvalid' | 'GoldenSnapshotUnavailable' | 'EvidenceInvalid' | 'InvalidArgs') === 2`；`validateAgentData` 对含 `description` 字段的条目抛 `DescriptionDerivation`。

- [ ] **Step 1：写失败测试**

创建 `tools/docgen/test/pilot-gate.test.mjs`：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { agentData, triggerTable } from '../components/agentData.mjs';
import { validateAgentData, exitCodeFor } from '../components/validateAgentData.mjs';

test('新增错误码档位：TargetDrift=1，其余四码=2', () => {
  assert.equal(exitCodeFor('TargetDrift'), 1);
  for (const code of ['StateFileInvalid', 'GoldenSnapshotUnavailable', 'EvidenceInvalid', 'InvalidArgs']) {
    assert.equal(exitCodeFor(code), 2, code);
  }
});

test('agentData 条目含独立 description → DescriptionDerivation', () => {
  const data = agentData.map((a) => (a.name === 'reviewer-audit' ? { ...a, description: '硬编码' } : a));
  assert.throws(() => validateAgentData(data, triggerTable), /DescriptionDerivation/);
});

test('when 以「时」结尾 → WhenFormatViolation', () => {
  const table = { ...triggerTable, 'reviewer-audit': { when: '当X时', route: 'reviewer-audit' } };
  assert.throws(() => validateAgentData(agentData, table), /WhenFormatViolation/);
});
```

- [ ] **Step 2：运行测试确认失败**

Run: `node --test tools/docgen/test/pilot-gate.test.mjs`
Expected: FAIL（未知错误码；`description` 未拦）。

- [ ] **Step 3：写最小实现**

`validateAgentData.mjs` 的 EXIT 表改为：

```js
const EXIT = {
  0: [],
  1: ['MissingSlot', 'MissingPlaceholder', 'InvalidRuleType', 'TemplateSyntaxError',
    'TemplateHardcoded', 'ImpureRender', 'Mismatch', 'DuplicateAgentName', 'InvalidName',
    'FrontmatterFieldMissing', 'ToolsViolation', 'SharedBlockMissing', 'WhenFormatViolation',
    'DescriptionDerivation', 'TriggerMissingRoute', 'TriggerConflict', 'DuplicateWhen',
    'InvalidOutputKind', 'MissingWhen', 'DraftDrift', 'DraftNameConflict', 'TargetDrift'],
  2: ['UnregisteredHandwritten', 'InvalidBaseline', 'InvalidBaselinePath', 'DanglingBaselineEntry',
    'BaselineDrift', 'EnvironmentEOL', 'InvalidInputPath', 'InvalidOutputPath',
    'MissingComponentData', 'UnsupportedKind', 'StateFileInvalid', 'GoldenSnapshotUnavailable',
    'EvidenceInvalid', 'InvalidArgs'],
  3: ['GeneratedMissing', 'TemplateReadFailed', 'TargetReadFailed', 'WriteFailed', 'DraftNotFound', 'DraftWriteFailed'],
  4: ['NotAuthorized'],
};
```

在断言 1 之后加：

```js
// 断言 1b：数据层不得含独立 description（S2 §3 / S1 R13）
for (const a of data) if ('description' in a) fail('DescriptionDerivation', { name: a.name });
```

- [ ] **Step 4：运行测试确认通过**

Run: `node --test tools/docgen/test/pilot-gate.test.mjs`
Expected: PASS（3 tests）。

- [ ] **Step 5：回归既有验证测试**

Run: `node --test tools/docgen/test/validate.test.mjs tools/docgen/test/review-fixes.test.mjs`
Expected: PASS（既有断言与错误码未回退）。

- [ ] **Step 6：改动留在工作区**

不执行 git 写操作。

---

## Task 6：state / evidence 模块 + check-agents 按 state 分流

**Files:**
- Create: `tools/docgen/state.mjs`
- Create: `tools/docgen/evidence.mjs`
- Create: `tools/docgen/state.json`（`{ "version": 1, "agents": {} }`）
- Modify: `tools/docgen/cli.mjs`（`cmdCheckAgents`、replace 前置）
- Test: `tools/docgen/test/pilot-gate.test.mjs`（追加）

**Interfaces:**
- Produces: `readState()` / `writeState(state)` / `setAgentState(name, value)`；`readEvidence(name)` / `writeEvidence(name, data)` / `evidencePath(name)`；`check-agents` 输出 `OK：14 个 agent 已检查（已接管 X，未迁移 Y）`。
- 测试隔离：`state.mjs` 支持 `DOCGEN_STATE_PATH`，`evidence.mjs` 支持 `DOCGEN_EVIDENCE_DIR`；默认路径为 `tools/docgen/state.json` / `tools/docgen/fixtures/`。

- [ ] **Step 1：写失败测试**

在 `pilot-gate.test.mjs` 追加：

```js
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const CLI = 'tools/docgen/cli.mjs';
const stateFile = () => join(mkdtempSync(join(tmpdir(), 'dg-state-')), 'state.json');
const run = (args, env = {}) => spawnSync(process.execPath, [CLI, ...args], {
  encoding: 'utf8',
  env: { ...process.env, DOCGEN_STATE_PATH: stateFile(), ...env },
});

test('state 缺失 = 全量 registered；check-agents 输出 0 已接管 / 14 未迁移', () => {
  const r = run(['check-agents']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /已接管 0，未迁移 14/);
});

test('state version≠1 → StateFileInvalid（exit 2）', () => {
  const p = stateFile();
  writeFileSync(p, '{"version":2,"agents":{}}\n');
  const r = run(['check-agents'], { DOCGEN_STATE_PATH: p });
  assert.equal(r.status, 2);
  assert.match(r.stdout + r.stderr, /StateFileInvalid/);
});

test('state 键不在 agentData → StateFileInvalid（exit 2）', () => {
  const p = stateFile();
  writeFileSync(p, '{"version":1,"agents":{"ghost":"replaced"}}\n');
  const r = run(['check-agents'], { DOCGEN_STATE_PATH: p });
  assert.equal(r.status, 2);
  assert.match(r.stdout + r.stderr, /StateFileInvalid/);
});
```

- [ ] **Step 2：运行测试确认失败**

Run: `node --test tools/docgen/test/pilot-gate.test.mjs`
Expected: FAIL（check-agents 仍输出旧的「未巩固 14」；无 state 模块）。

- [ ] **Step 3：写最小实现**

创建 `tools/docgen/state.mjs`：

```js
import { readFileSync, writeFileSync, existsSync, renameSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { agentData } from './components/agentData.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
export const statePath = () => process.env.DOCGEN_STATE_PATH || join(ROOT, 'state.json');
const NAMES = new Set(agentData.map((a) => a.name));
const VALUES = new Set(['replaced', 'suspended']);

function fail(code, fields = {}) {
  const e = new Error(code);
  e.code = code;
  Object.assign(e, fields);
  e.exitCode = 2;
  throw e;
}

export function readState() {
  const p = statePath();
  if (!existsSync(p)) return { version: 1, agents: {} };
  let s;
  try {
    s = JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    fail('StateFileInvalid', { path: p, reason: 'JSON 解析失败' });
  }
  if (s.version !== 1 || typeof s.agents !== 'object' || s.agents === null || Array.isArray(s.agents)) {
    fail('StateFileInvalid', { path: p, reason: 'version/agents 形状非法' });
  }
  for (const [name, value] of Object.entries(s.agents)) {
    if (!NAMES.has(name)) fail('StateFileInvalid', { path: p, name, reason: '键不在 agentData' });
    if (!VALUES.has(value)) fail('StateFileInvalid', { path: p, name, value, reason: '值非法' });
  }
  return s;
}

export function writeState(state) {
  const p = statePath();
  mkdirSync(dirname(p), { recursive: true });
  const tmp = `${p}.tmp-${process.pid}`;
  try {
    writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`);
    renameSync(tmp, p);
  } catch (e) {
    rmSync(tmp, { force: true });
    throw e;
  }
}

export function setAgentState(name, value) {
  const state = readState();
  state.agents[name] = value;
  writeState(state);
}
```

创建 `tools/docgen/evidence.mjs`：

```js
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
export const evidenceDir = () => process.env.DOCGEN_EVIDENCE_DIR || join(ROOT, 'fixtures');
export const evidencePath = (name) => join(evidenceDir(), `${name}.evidence.json`);

const HEX40 = /^[0-9a-f]{40}$/;
const SHA = /^[0-9A-F]{64}$/;
const PENDING = 'pending';

function fail(code, fields = {}) {
  const e = new Error(code);
  e.code = code;
  Object.assign(e, fields);
  e.exitCode = 2;
  throw e;
}

export function readEvidence(name) {
  const p = evidencePath(name);
  if (!existsSync(p)) fail('EvidenceInvalid', { path: p, reason: '缺失' });
  let e;
  try {
    e = JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    fail('EvidenceInvalid', { path: p, reason: 'JSON 解析失败' });
  }
  const ok = e
    && HEX40.test(e.commit)
    && HEX40.test(e.blob)
    && SHA.test(e.sha256)
    && HEX40.test(e.hashObject)
    && ['pass', 'fail', PENDING].includes(e.goldenAssertion)
    && (e.compareResult === null || (typeof e.compareResult === 'object' && 'code' in e.compareResult))
    && (e.renderSha256 === PENDING || SHA.test(e.renderSha256))
    && SHA.test(e.lastWrittenHash);
  if (!ok) fail('EvidenceInvalid', { path: p, reason: '字段缺失或类型非法' });
  return e;
}

export function writeEvidence(name, data) {
  const p = evidencePath(name);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);
}
```

创建 `tools/docgen/state.json`：

```json
{
  "version": 1,
  "agents": {}
}
```

`cmdCheckAgents` 改为：

```js
export function cmdCheckAgents() {
  const state = readState();
  let replaced = 0;
  let unconsolidated = 0;
  for (const a of agentData) {
    const p = join(AGENTS_DIR, `${a.name}.md`);
    if (!existsSync(p)) fail('DanglingBaselineEntry', { name: a.name, path: p });
    const s = state.agents[a.name];
    if (s === 'replaced') {
      replaced += 1;
      const rendered = Buffer.from(renderByName(a.name), 'utf8');
      if (compareBuffers(rendered, readFileSync(p))) fail('Mismatch', { name: a.name, path: p });
    } else {
      unconsolidated += 1;
    }
  }
  console.log(`OK：${agentData.length} 个 agent 已检查（已接管 ${replaced}，未迁移 ${unconsolidated}）`);
  return 0;
}
```

`cli.mjs` 顶部补 `import { readState, writeState, setAgentState, statePath } from './state.mjs';` 与 `import { readEvidence, writeEvidence, evidencePath } from './evidence.mjs';`。

- [ ] **Step 4：运行测试确认通过**

Run: `node --test tools/docgen/test/pilot-gate.test.mjs`
Expected: PASS（6 tests）。

- [ ] **Step 5：回归既有 check-agents 测试**

Run: `node --test tools/docgen/test/e2e-final.test.mjs`
Expected: PASS（旧断言若依赖「未巩固 14」需同步为新输出；若测试读取旧文本，改为匹配 `已接管 0，未迁移 14`）。

- [ ] **Step 6：改动留在工作区**

不执行 git 写操作。

---

## Task 7：gate 收集/导出 + replace 判别子 / TargetDrift / 幂等

**Files:**
- Modify: `tools/docgen/cli.mjs`（`gateChecks` → `collectGate` + `gateChecks`；`cmdReplace`；`cmdDraft` 的 `wx`）
- Create: `tools/docgen/acceptance/replace-scenarios.mjs`
- Test: `tools/docgen/test/pilot-gate.test.mjs`（collectGate 收集）
- 验收脚本: `tools/docgen/acceptance/replace-scenarios.mjs`

**Interfaces:**
- Produces: `export function collectGate() → { code, path }[]`；`export function gateChecks()`（收集后按优先级抛）；replace 判别子、`TargetDrift`、幂等恢复、先 state 后 rename、清 tmp、draft `wx`。

- [ ] **Step 1：写失败测试（collectGate 收集）**

在 `pilot-gate.test.mjs` 追加：

```js
import { collectGate } from '../cli.mjs';
```

> 若从测试文件 import `cli.mjs` 触发入口守卫，`isMain()` 为 false，不会执行 CLI；可直接 import。

```js
test('collectGate 收集漂移而不抛：人为制造清单外 agent 文件', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dg-agents-'));
  writeFileSync(join(dir, 'ghost.md'), '# ghost\n');
  const prev = process.env.DOCGEN_AGENTS_DIR;
  process.env.DOCGEN_AGENTS_DIR = dir;
  try {
    const d = collectGate();
    assert.ok(d.some((x) => x.code === 'UnregisteredHandwritten' && x.path.includes('ghost.md')));
  } finally {
    if (prev === undefined) delete process.env.DOCGEN_AGENTS_DIR; else process.env.DOCGEN_AGENTS_DIR = prev;
    rmSync(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2：运行测试确认失败**

Run: `node --test tools/docgen/test/pilot-gate.test.mjs`
Expected: FAIL（`collectGate` 未导出）。

- [ ] **Step 3：写最小实现（collectGate / gateChecks）**

在 `cli.mjs` 中把 `gateChecks` 重写为：

```js
export function collectGate() {
  const drifts = [];
  validateAgentData(agentData, triggerTable);
  const onDisk = readFileSync(BASELINE_PATH, 'utf8');
  if (onDisk !== renderBaseline()) drifts.push({ code: 'BaselineDrift', path: BASELINE_PATH });
  const tpl = readTemplate('rule');
  const target = readFileSync(join(REPO_ROOT, GENERATED_RULE), 'utf8');
  if (compareBuffers(Buffer.from(spec.render(spec.buildData(), tpl)), Buffer.from(target))) {
    drifts.push({ code: 'Mismatch', path: GENERATED_RULE });
  }
  for (const p of BASELINE_RULES) {
    if (p === GENERATED_RULE) continue;
    const rp = join(REPO_ROOT, p);
    if (!existsSync(rp)) { drifts.push({ code: 'DanglingBaselineEntry', path: p }); continue; }
    try { checkEnvironment(Buffer.from(readFileSync(rp, 'utf8')), 'target', p); }
    catch (e) { drifts.push({ code: e.code ?? 'EnvironmentEOL', path: p }); }
  }
  let state;
  try { state = readState(); }
  catch (e) { drifts.push({ code: e.code ?? 'StateFileInvalid', path: statePath() }); state = { agents: {} }; }
  for (const a of agentData) {
    const p = join(AGENTS_DIR, `${a.name}.md`);
    if (!existsSync(p)) { drifts.push({ code: 'DanglingBaselineEntry', path: `agents/${a.name}.md` }); continue; }
    if (state.agents[a.name] === 'replaced') {
      if (compareBuffers(Buffer.from(renderByName(a.name), 'utf8'), readFileSync(p))) {
        drifts.push({ code: 'Mismatch', path: `agents/${a.name}.md` });
      }
    }
  }
  const scanRulesDir = process.env.DOCGEN_RULES_DIR || join(REPO_ROOT, 'rules');
  const scanAgentsDir = process.env.DOCGEN_AGENTS_DIR || join(REPO_ROOT, 'agents');
  for (const f of readdirSync(scanRulesDir)) {
    if (f.endsWith('.md') && !BASELINE_RULES.includes(`rules/${f}`)) {
      drifts.push({ code: 'UnregisteredHandwritten', path: `rules/${f}` });
    }
  }
  for (const f of readdirSync(scanAgentsDir)) {
    if (f.endsWith('.md') && !agentPaths().includes(`agents/${f}`)) {
      drifts.push({ code: 'UnregisteredHandwritten', path: `agents/${f}` });
    }
  }
  return drifts;
}

const BASELINE_CLASS = new Set(['BaselineDrift', 'UnregisteredHandwritten', 'DanglingBaselineEntry', 'StateFileInvalid', 'EnvironmentEOL', 'InvalidBaseline', 'InvalidBaselinePath']);
const PRIORITY = (d) => (BASELINE_CLASS.has(d.code) ? 0 : 1);

export function gateChecks() {
  const drifts = collectGate();
  if (drifts.length === 0) return;
  const first = [...drifts].sort((a, b) => PRIORITY(a) - PRIORITY(b))[0];
  fail(first.code, first);
}
```

- [ ] **Step 4：写最小实现（replace / draft）**

`cmdDraft` 的写草稿改为 `wx`：

```js
  const file = `${name}--${ts()}.md`;
  const content = renderByName(name);
  mkdirSync(dir, { recursive: true });
  try { writeFileSync(join(dir, file), content, { flag: 'wx' }); }
  catch (e) {
    if (e.code === 'EEXIST') fail('DraftNameConflict', { name, existing: file });
    fail('DraftWriteFailed', { path: join(dir, file) });
  }
```

`cmdReplace` 改为：

```js
export function cmdReplace(args) {
  if (args.kind !== 'agent') fail('UnsupportedKind', { kind: args.kind });
  assertAgentName(args.name);
  if (!args.yes) fail('NotAuthorized', {});
  const name = args.name;
  const agent = agentData.find((a) => a.name === name);
  if (!agent) fail('MissingComponentData', { name });
  if (!args.draft || !existsSync(args.draft)) fail('DraftNotFound', { draft: args.draft });

  const evidence = readEvidence(name);
  const draftBytes = readFileSync(args.draft);
  const rendered = Buffer.from(renderByName(name), 'utf8');
  if (!draftBytes.equals(rendered)) fail('DraftDrift', { name });
  if (evidence.renderSha256 !== sha256Hex(rendered)) {
    fail('EvidenceInvalid', { name, reason: 'renderSha256 与草稿不等，须重跑步 4' });
  }

  const drifts = collectGate();
  const allowed = (d) => {
    if (d.path === `agents/${name}.md`) return true;
    const m = /^agents\/([a-z0-9-]+)\.md$/.exec(d.path);
    if (!m) return false;
    const other = m[1];
    const st = readState();
    if (st.agents[other] !== 'replaced') return false;
    const box = DRAFTS_DIR();
    if (!existsSync(box)) return false;
    const f = readdirSync(box).find((x) => x.startsWith(`${other}--`));
    if (!f) return false;
    return readFileSync(join(box, f)).equals(Buffer.from(renderByName(other), 'utf8'));
  };
  const blocked = drifts.filter((d) => !allowed(d));
  if (blocked.length > 0) {
    const first = [...blocked].sort((a, b) => PRIORITY(a) - PRIORITY(b))[0];
    fail(first.code, first);
  }

  const target = join(AGENTS_DIR, `${name}.md`);
  const targetBytes = readFileSync(target);
  const current = readState();
  const idempotent = current.agents[name] === 'replaced' && targetBytes.equals(rendered);
  if (idempotent) {
    evidence.lastWrittenHash = sha256Hex(rendered);
    writeEvidence(name, evidence);
    clearDrafts(name);
    console.log(`已替换（幂等恢复）：${target}`);
    return 0;
  }

  if (sha256Hex(targetBytes) !== evidence.lastWrittenHash) fail('TargetDrift', { name, path: target });
  setAgentState(name, 'replaced');
  const tmp = join(AGENTS_DIR, `.tmp-${name}-${process.pid}.part`);
  try {
    writeFileSync(tmp, draftBytes);
    renameSync(tmp, target);
  } catch {
    rmSync(tmp, { force: true });
    fail('WriteFailed', { path: target });
  }
  clearDrafts(name);
  evidence.lastWrittenHash = sha256Hex(rendered);
  writeEvidence(name, evidence);
  console.log(`已替换：${target}`);
  return 0;
}

function clearDrafts(name) {
  const dir = DRAFTS_DIR();
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir).filter((x) => x.startsWith(`${name}--`))) rmSync(join(dir, f), { force: true });
}
```

在 `cli.mjs` 顶部加：

```js
import { createHash } from 'node:crypto';
function sha256Hex(buf) { return createHash('sha256').update(buf).digest('hex').toUpperCase(); }
```

启动清理：

```js
for (const f of readdirSync(AGENTS_DIR).filter((x) => x.startsWith(`.tmp-${name}-`) && x.endsWith('.part'))) {
  rmSync(join(AGENTS_DIR, f), { force: true });
}
```

放在 `cmdReplace` 开头（在读取目标之前）。

- [ ] **Step 5：写 acceptance 场景脚本**

创建 `tools/docgen/acceptance/replace-scenarios.mjs`：

```js
#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { renderByName } from '../cli.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const sha = (b) => createHash('sha256').update(b).digest('hex').toUpperCase();
const stateFile = (c) => join(c, 'tools/docgen/state.json');
const evidenceFile = (c) => join(c, 'tools/docgen/fixtures/reviewer-audit.evidence.json');
const evidence = (c) => JSON.parse(readFileSync(evidenceFile(c), 'utf8'));

function copyRepo() {
  const dst = mkdtempSync(join(tmpdir(), 'dg-rep-'));
  const files = execFileSync('git', ['ls-files'], { cwd: REPO, encoding: 'utf8' }).trim().split('\n');
  const extra = [
    'tools/docgen/state.json',
    'tools/docgen/components/sharedBlocks.mjs',
    'tools/docgen/components/outputFormats.mjs',
    'tools/docgen/components/renderAgent.mjs',
  ];
  for (const f of [...new Set([...files, ...extra])]) {
    if (!f || f.startsWith('.git/')) continue;
    const out = join(dst, f);
    mkdirSync(dirname(out), { recursive: true });
    cpSync(join(REPO, f), out);
  }
  mkdirSync(join(dst, '.drafts'), { recursive: true });
  return dst;
}

function run(copy, args) {
  return spawnSync(process.execPath, [join(copy, 'tools/docgen/cli.mjs'), ...args], {
    cwd: copy,
    encoding: 'utf8',
    env: {
      ...process.env,
      DOCGEN_DRAFTS_DIR: join(copy, '.drafts'),
      DOCGEN_STATE_PATH: stateFile(copy),
      DOCGEN_EVIDENCE_DIR: join(copy, 'tools/docgen/fixtures'),
    },
  });
}

function seedEvidence(copy) {
  const file = 'agents/reviewer-audit.md';
  const commit = execFileSync('git', ['log', '-1', '--format=%H', '--', file], { cwd: REPO, encoding: 'utf8' }).trim();
  const blob = execFileSync('git', ['rev-parse', `${commit}:${file}`], { cwd: REPO, encoding: 'utf8' }).trim();
  const hashObject = execFileSync('git', ['hash-object', '--no-filters', file], { cwd: REPO, encoding: 'utf8' }).trim();
  const target = readFileSync(join(copy, file));
  const rendered = Buffer.from(renderByName('reviewer-audit'), 'utf8');
  writeFileSync(evidenceFile(copy), `${JSON.stringify({
    commit, blob, sha256: sha(target), hashObject,
    goldenAssertion: 'pass', compareResult: null, renderSha256: sha(rendered), lastWrittenHash: sha(target),
  }, null, 2)}\n`);
}

function draft(copy, name = 'reviewer-audit') {
  const r = run(copy, ['draft', '--kind', 'agent', '--name', name]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const f = readdirSync(join(copy, '.drafts')).find((x) => x.startsWith(`${name}--`));
  assert.ok(f, `草稿未生成：${name}`);
  return join(copy, '.drafts', f);
}

function scenario(name, fn) {
  const copy = copyRepo();
  try {
    fn(copy);
    console.log(`PASS ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}: ${e.message}`);
    process.exitCode = 1;
  } finally {
    rmSync(copy, { recursive: true, force: true });
  }
}

scenario('S1 首次替换成功', (c) => {
  seedEvidence(c);
  const d = draft(c);
  const r = run(c, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', d, '--yes']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(JSON.parse(readFileSync(stateFile(c), 'utf8')).agents['reviewer-audit'], 'replaced');
  assert.ok(readFileSync(join(c, 'agents/reviewer-audit.md')).equals(Buffer.from(renderByName('reviewer-audit'))));
  assert.equal(readdirSync(join(c, '.drafts')).length, 0);
  assert.equal(evidence(c).lastWrittenHash, sha(readFileSync(join(c, 'agents/reviewer-audit.md'))));
});

scenario('S2 TargetDrift', (c) => {
  seedEvidence(c);
  const p = join(c, 'agents/reviewer-audit.md');
  writeFileSync(p, `${readFileSync(p, 'utf8')}x`);
  const d = draft(c);
  const r = run(c, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', d, '--yes']);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout + r.stderr, /TargetDrift/);
});

scenario('S3 幂等恢复（rename 后崩溃）', (c) => {
  seedEvidence(c);
  const e = evidence(c);
  e.lastWrittenHash = '0'.repeat(64);
  writeFileSync(evidenceFile(c), `${JSON.stringify(e, null, 2)}\n`);
  writeFileSync(stateFile(c), `${JSON.stringify({ version: 1, agents: { 'reviewer-audit': 'replaced' } }, null, 2)}\n`);
  const d = draft(c);
  const r = run(c, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', d, '--yes']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(evidence(c).lastWrittenHash, sha(readFileSync(join(c, 'agents/reviewer-audit.md'))));
  assert.equal(readdirSync(join(c, '.drafts')).length, 0);
});

scenario('S4 rename 前崩溃后重跑收敛', (c) => {
  seedEvidence(c);
  writeFileSync(stateFile(c), `${JSON.stringify({ version: 1, agents: { 'reviewer-audit': 'replaced' } }, null, 2)}\n`);
  const d = draft(c);
  const r = run(c, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', d, '--yes']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(readFileSync(join(c, 'agents/reviewer-audit.md')).equals(Buffer.from(renderByName('reviewer-audit'))));
});

scenario('S5 非目标漂移：无草稿拒 / 有草稿放行', (c) => {
  seedEvidence(c);
  const rule = join(c, 'rules/spec-testcase-gate.md');
  writeFileSync(rule, `${readFileSync(rule, 'utf8')}x`);
  const d = draft(c);
  const r1 = run(c, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', d, '--yes']);
  assert.notEqual(r1.status, 0, '非目标漂移无草稿应拒');
  assert.match(r1.stdout + r1.stderr, /Mismatch/);

  const c2 = copyRepo();
  try {
    seedEvidence(c2);
    writeFileSync(stateFile(c2), `${JSON.stringify({ version: 1, agents: { 'reviewer-product': 'replaced' } }, null, 2)}\n`);
    const d2 = draft(c2, 'reviewer-product');
    const p2 = join(c2, 'agents/reviewer-product.md');
    writeFileSync(p2, `${readFileSync(p2, 'utf8')}x`);
    const d1 = draft(c2);
    const r2 = run(c2, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', d1, '--yes']);
    assert.equal(r2.status, 0, r2.stdout + r2.stderr);
    assert.ok(readFileSync(d2));
  } finally {
    rmSync(c2, { recursive: true, force: true });
  }
});

scenario('S6 错误路径：缺 --yes=4 / 草稿被改=1 / 草稿缺失=3 / 非法 name=1 / ghost=2', (c) => {
  seedEvidence(c);
  const d = draft(c);
  const a = run(c, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', d]);
  assert.equal(a.status, 4); assert.match(a.stdout + a.stderr, /NotAuthorized/);
  writeFileSync(d, '# 手改\n');
  const b = run(c, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', d, '--yes']);
  assert.equal(b.status, 1); assert.match(b.stdout + b.stderr, /DraftDrift/);
  const e = run(c, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', join(c, 'ghost.md'), '--yes']);
  assert.equal(e.status, 3); assert.match(e.stdout + e.stderr, /DraftNotFound/);
  const f = run(c, ['replace', '--kind', 'agent', '--name', 'Bad/Name', '--draft', d, '--yes']);
  assert.equal(f.status, 1); assert.match(f.stdout + f.stderr, /InvalidName/);
  const g = run(c, ['replace', '--kind', 'agent', '--name', 'ghost', '--draft', d, '--yes']);
  assert.equal(g.status, 2); assert.match(g.stdout + g.stderr, /MissingComponentData/);
});

console.log(process.exitCode ? 'FAIL' : 'PASS 6/6');
```

- [ ] **Step 6：运行单测与验收**

Run: `node --test tools/docgen/test/pilot-gate.test.mjs`
Expected: PASS。

Run: `node tools/docgen/acceptance/replace-scenarios.mjs`
Expected: `PASS 6/6`，exit 0。

- [ ] **Step 7：回归既有 replace 测试**

Run: `node --test tools/docgen/test/drafts.test.mjs tools/docgen/test/review-fixes.test.mjs`
Expected: PASS。

- [ ] **Step 8：改动留在工作区**

不执行 git 写操作。

---

## Task 8：黄金断言 / evidence 初始化 / 冷跑脚本

**Files:**
- Create: `tools/docgen/acceptance/init-evidence.mjs`
- Create: `tools/docgen/acceptance/golden-assert.mjs`
- Create: `tools/docgen/acceptance/cold-run.mjs`
- Test: `tools/docgen/test/pilot-gate.test.mjs`（脚本退出码）
- 运行: 三个脚本

**Interfaces:**
- `init-evidence.mjs <name>`：读 `git log` / `git rev-parse` / SHA256 / `git hash-object --no-filters`，写 evidence（`goldenAssertion:'pending'`、`compareResult:null`、`renderSha256:'pending'`、`lastWrittenHash:sha256`）。
- `golden-assert.mjs <name>`：读 evidence.commit → `git show <commit>:agents/<name>.md` → 派生 description 比对 + 整文件 `compareBuffers` → 更新 `goldenAssertion` / `compareResult` / `renderSha256` → exit 0/1/2。
- `cold-run.mjs`：复制 `git ls-files` + 本轮新增文件（`state.json`、`sharedBlocks.mjs`、`outputFormats.mjs`、`renderAgent.mjs`、`fixtures/*.evidence.json`）到临时目录（不含 `.git`），设 `DOCGEN_DRAFTS_DIR`，跑 `gate`，清理。

- [ ] **Step 1：写失败测试**

在 `pilot-gate.test.mjs` 追加：

```js
test('golden-assert 在缺 evidence 时 exit 2（EvidenceInvalid）', () => {
  const r = spawnSync(process.execPath, ['tools/docgen/acceptance/golden-assert.mjs', 'ghost'], {
    encoding: 'utf8', env: { ...process.env, DOCGEN_EVIDENCE_DIR: mkdtempSync(join(tmpdir(), 'dg-ev-')) },
  });
  assert.equal(r.status, 2);
  assert.match(r.stdout + r.stderr, /EvidenceInvalid/);
});
```

- [ ] **Step 2：运行测试确认失败**

Run: `node --test tools/docgen/test/pilot-gate.test.mjs`
Expected: FAIL（脚本不存在）。

- [ ] **Step 3：写 `init-evidence.mjs`**

```js
#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { writeEvidence } from '../evidence.mjs';

const name = process.argv[2];
if (!name) { console.error('用法：node tools/docgen/acceptance/init-evidence.mjs <name>'); process.exit(2); }
const file = `agents/${name}.md`;
const commit = execFileSync('git', ['log', '-1', '--format=%H', '--', file], { encoding: 'utf8' }).trim();
const blob = execFileSync('git', ['rev-parse', `${commit}:${file}`], { encoding: 'utf8' }).trim();
const hashObject = execFileSync('git', ['hash-object', '--no-filters', file], { encoding: 'utf8' }).trim();
const bytes = readFileSync(file);
const sha256 = createHash('sha256').update(bytes).digest('hex').toUpperCase();
writeEvidence(name, {
  commit, blob, sha256, hashObject,
  goldenAssertion: 'pending', compareResult: null, renderSha256: 'pending', lastWrittenHash: sha256,
});
console.log(`evidence 已写入：${name}（commit ${commit.slice(0, 7)} / blob ${blob.slice(0, 7)}）`);
```

- [ ] **Step 4：写 `golden-assert.mjs`**

```js
#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readEvidence, writeEvidence } from '../evidence.mjs';
import { renderByName } from '../cli.mjs';
import { agentData, triggerTable } from '../components/agentData.mjs';
import { patternRegistry } from '../components/patternRegistry.mjs';

const name = process.argv[2];
if (!name) { console.error('用法：node tools/docgen/acceptance/golden-assert.mjs <name>'); process.exit(2); }

const evidence = readEvidence(name);
const snapshot = execFileSync('git', ['show', `${evidence.commit}:agents/${name}.md`], { encoding: 'utf8' });
const snapshotDescription = /^---\n(?:.*\n)*?description: (.*)\n(?:.*\n)*?---\n/.exec(snapshot)?.[1];
const agent = agentData.find((a) => a.name === name);
const t = triggerTable[name];
const derived = patternRegistry.description.parliament(agent.role, t.when);
const goldenOk = snapshotDescription === derived;

const rendered = renderByName(name);
const renderedBytes = Buffer.from(rendered, 'utf8');
const snapshotBytes = Buffer.from(snapshot, 'utf8');
const cmp = renderedBytes.equals(snapshotBytes) ? null : { code: 'Mismatch', byte: 0, line: 1 };

evidence.goldenAssertion = goldenOk ? 'pass' : 'fail';
evidence.compareResult = cmp;
evidence.renderSha256 = createHash('sha256').update(renderedBytes).digest('hex').toUpperCase();
writeEvidence(name, evidence);
if (!goldenOk) {
  console.error(`黄金断言失败：快照 description=${snapshotDescription}`);
  console.error(`                  派生 description=${derived}`);
  process.exit(1);
}
if (cmp) {
  console.error('整文件比对失败：渲染与快照不一致');
  process.exit(1);
}
console.log('黄金断言通过：description 逐字相等 + 整文件逐字节相等');
```

- [ ] **Step 5：写 `cold-run.mjs`**

```js
#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const copy = mkdtempSync(join(tmpdir(), 'dg-cold-'));
try {
  const files = execFileSync('git', ['ls-files'], { cwd: REPO, encoding: 'utf8' }).trim().split('\n');
  const extra = [
    'tools/docgen/state.json',
    'tools/docgen/components/sharedBlocks.mjs',
    'tools/docgen/components/outputFormats.mjs',
    'tools/docgen/components/renderAgent.mjs',
  ];
  const all = [...new Set([...files, ...extra])].filter((f) => f && !f.startsWith('.git/'));
  for (const f of all) {
    const src = join(REPO, f);
    const dst = join(copy, f);
    mkdirSync(dirname(dst), { recursive: true });
    cpSync(src, dst);
  }
  const drafts = join(copy, '.drafts');
  mkdirSync(drafts, { recursive: true });
  const r = spawnSync(process.execPath, ['tools/docgen/cli.mjs', 'gate'], {
    cwd: copy, encoding: 'utf8',
    env: { ...process.env, DOCGEN_DRAFTS_DIR: drafts, DOCGEN_STATE_PATH: join(copy, 'tools/docgen/state.json'), DOCGEN_EVIDENCE_DIR: join(copy, 'tools/docgen/fixtures') },
  });
  process.stdout.write(r.stdout);
  process.stderr.write(r.stderr);
  process.exit(r.status ?? 1);
} finally {
  rmSync(copy, { recursive: true, force: true });
}
```

- [ ] **Step 6：运行脚本验证**

Run: `node tools/docgen/acceptance/init-evidence.mjs reviewer-audit`
Expected: 输出 `evidence 已写入`。

Run: `node tools/docgen/acceptance/golden-assert.mjs reviewer-audit`
Expected: `黄金断言通过`，exit 0；`fixtures/reviewer-audit.evidence.json` 的 `goldenAssertion='pass'`、`compareResult=null`、`renderSha256` 为 64 位大写。

Run: `node tools/docgen/acceptance/cold-run.mjs`
Expected: `baseline 35/35` / exit 0。

Run: `node --test tools/docgen/test/pilot-gate.test.mjs`
Expected: PASS（含缺 evidence exit 2）。

- [ ] **Step 7：改动留在工作区**

不执行 git 写操作。

---

## Task 9：九步闭环（真实迁移）

**前置：** Task 1–8 全绿；工作树只含本计划改动；`git status --short agents/` 为空。

- [ ] **Step 1：入选（记录四值 + evidence）**

Run:

```powershell
git log -1 --format=%H -- agents/reviewer-audit.md
git rev-parse "$(git log -1 --format=%H -- agents/reviewer-audit.md):agents/reviewer-audit.md"
Get-FileHash agents/reviewer-audit.md -Algorithm SHA256
git hash-object --no-filters agents/reviewer-audit.md
node tools/docgen/acceptance/init-evidence.mjs reviewer-audit
```

Expected: 四值为 40/40/64/40 位；evidence 写入 `fixtures/reviewer-audit.evidence.json`。

- [ ] **Step 2：数据迁移（已在 Task 1–3 完成）**

核对 `agentData` 八键与 `triggerTable` 两字段；不重复写入。

- [ ] **Step 3：生成**

Run: `node tools/docgen/cli.mjs generate --kind agent --name reviewer-audit`
Expected: exit 0；`agents/reviewer-audit.md` 零改动。

- [ ] **Step 4：黄金断言 + 整文件比对**

Run: `node tools/docgen/acceptance/golden-assert.mjs reviewer-audit`
Expected: `黄金断言通过`；evidence 的 `goldenAssertion='pass'`、`compareResult=null`。

- [ ] **Step 5：接守卫（登记待接管）**

Run:

```powershell
node -e "import('./tools/docgen/components/baseline.mjs').then(m => console.log(m.agentPaths().includes('agents/reviewer-audit.md')))"
node -e "import('./tools/docgen/state.mjs').then(m => console.log(JSON.stringify(m.readState())))"
```

Expected: `true`；`{"version":1,"agents":{}}`（registered）。

- [ ] **Step 6：落草稿**

Run:

```powershell
node tools/docgen/cli.mjs draft --kind agent --name reviewer-audit
git status --short agents/
```

Expected: 草稿箱出现 `reviewer-audit--<YYYYMMDD-HHMMSS>.md`；`git status --short agents/` 无输出。

记录草稿路径：`$draft = (Get-ChildItem "$env:USERPROFILE\.retro-skills\docgen-drafts" -Filter "reviewer-audit--*.md" | Select-Object -First 1).FullName`。

- [ ] **Step 7：替换（必须先获得用户确认）**

> **停在这里问用户**：「草稿已生成，替换会原子覆盖 `agents/reviewer-audit.md`（字节不变），是否执行 `replace --yes`？」用户明确回答「是」后才继续。

Run:

```powershell
node tools/docgen/cli.mjs replace --kind agent --name reviewer-audit --draft $draft --yes
Get-Content tools/docgen/state.json
node tools/docgen/cli.mjs draft ls --name reviewer-audit
```

Expected: exit 0；`state.json` = `{"version":1,"agents":{"reviewer-audit":"replaced"}}`；`draft ls` 为空；`git status --short agents/` 无输出（字节不变）。

- [ ] **Step 8：验收**

Run:

```powershell
node tools/docgen/cli.mjs gate
npm run check
git status --short rules/ skills/ agents/
```

Expected: gate `baseline 35/35`；`npm run check` 全绿（0 findings）；`git status` 无输出。**不要**在替换后重跑 `golden-assert`（自证循环）；W1 的逐字节结论以步 4 的 evidence 为准。

- [ ] **Step 9：巩固（两次 gate + 冷跑）**

Run:

```powershell
node tools/docgen/cli.mjs gate
node tools/docgen/acceptance/cold-run.mjs
node tools/docgen/cli.mjs draft ls --name reviewer-audit
npm run check
git status --short rules/ skills/ agents/
```

Expected: 两次 gate 绿（含冷跑）；草稿箱空；`npm run check` 全绿；`git status` 无输出。

更新 `docs/prd/20261019093443-docgen-agent-generation.md` §6.6 的 `reviewer-audit` 行：状态 `已巩固`、双哈希（四值中的 SHA256/blob）、迁移日期、巩固证据（gate ×2 + 冷跑 + check 输出摘要）。

- [ ] **Step 10：改动留在工作区**

不执行 git 写操作。把 `state.json` / `fixtures/reviewer-audit.evidence.json` / `agents/reviewer-audit.md`（字节不变）/ PRD §6.6 的改动留给用户提交。

---

## Task 10：全量回归与交付清单

**Files:**
- Test: 全仓
- 验收: `tools/docgen/acceptance/*.mjs`

- [ ] **Step 1：全量单测**

Run: `npm run check`
Expected: 323+ tests 全绿 / baseline 35/35 / 0 findings / markdown 检查通过 / exit 0。

- [ ] **Step 2：验收脚本**

Run:

```powershell
node tools/docgen/acceptance/replace-scenarios.mjs
node tools/docgen/acceptance/golden-assert.mjs reviewer-audit
node tools/docgen/acceptance/cold-run.mjs
```

Expected: 全部 exit 0；`replace-scenarios` 打印 `PASS 6/6`。

- [ ] **Step 3：W1 五条逐条核对**

| W1 检查 | 证据 |
|---|---|
| 逐字节一致 | `fixtures/reviewer-audit.evidence.json` 的 `compareResult === null`（步 4 产出） |
| description 派生 | `goldenAssertion === 'pass'` |
| 迁移前黄金断言 | 同上（`git show` 的 blob） |
| 黄金快照 = docgen 产物 | 步 4 的整文件比对 `null` |
| 巩固六项 | state=replaced / gate×2 含冷跑 / npm run check / git status 干净 / 内容=渲染 + 人工抽查 fixedList 第 4 条 / 草稿箱空 |

- [ ] **Step 4：人工抽查**

打开 `agents/reviewer-audit.md`，对照 `agentData.fixedList[3]`（「计数一致：…」）确认逐字一致；再通读一遍，确认 8 节骨架、固定清单、AUDIT_RULES、双格式可读性未变。

- [ ] **Step 5：改动留在工作区**

不执行 git 写操作；向用户报告：改动文件清单 + `npm run check` 输出摘要 + 待用户决定的提交方式。

---

## Testcase 覆盖映射（77 条 → 任务/文件）

| 用例区间 | 主题 | 落点 |
|---|---|---|
| TC-001～004 | 入选 / 数据形状 / description | Task 1、8（init-evidence）；`pilot-data.test.mjs` |
| TC-005～008、014～017、019、028～033 | 模板 / 渲染 / 黄金断言 | Task 3、8；`pilot-render.test.mjs`、`golden-assert.mjs` |
| TC-009、034、045、050、055 | 已接管比对 / 回退 | Task 6、7；`pilot-gate.test.mjs`、`replace-scenarios.mjs` |
| TC-010～013、018、046～049、071、072 | 草稿 / 替换 / 巩固 / 冷跑 | Task 7–9；`replace-scenarios.mjs`、`cold-run.mjs`、手动 |
| TC-020、051、063、064 | 转录源唯一 / 共享块 / 输出格式 | Task 2、3；`pilot-render.test.mjs` |
| TC-021～027、052 | description 格式 / 派生 / 硬编码 | Task 1、5；`pilot-data.test.mjs`、`pilot-gate.test.mjs` |
| TC-035～044 | 判别子 / 草稿与替换错误路径 | Task 7；`replace-scenarios.mjs` |
| TC-053～059、076 | state / 证据 / 错误码 / collectGate | Task 5–7；`pilot-gate.test.mjs`、`replace-scenarios.mjs` |
| TC-060～062、065～067、077 | 纯渲染 / 模板纯度 / 数据变异 / 槽位 | Task 3；`pilot-render.test.mjs` |
| TC-068～070、073～075、078 | 冷跑 / tmp / 幂等 / generate 覆盖 | Task 7、8；`replace-scenarios.mjs`、`cold-run.mjs` |

---

## Self-Review

**1. Spec coverage**
- R1–R12：Task 1（数据）、Task 2–3（渲染）、Task 4（generate）、Task 5（错误码/description）、Task 6（state/check-agents）、Task 7（replace/gate）、Task 8（证据/黄金断言/冷跑）、Task 9（九步）。
- §5 W1 五行：Task 8（1–4）+ Task 9（巩固六项）。
- §6 硬约束 1–8：Global Constraints + Task 7/8/9。
- §11 修订清单：Task 5（错误码）、Task 4（generate 覆盖）、Task 6/7（state/replace）；S1 待回写项不在本计划执行范围（用户裁决）。

**2. Placeholder scan**
- 无 TBD/TODO；所有代码步骤给出可执行片段；`replace-scenarios.mjs` 已给出完整 harness 与 6 个场景的实际断言（复制仓库、seed evidence、draft、replace、退出码与字节断言）。

**3. Type consistency**
- `renderAgent({ agent, trigger, template, sharedBlocks, outputFormats })` 在 Task 3 定义，Task 4/8 一致引用。
- `renderByName(name)` 在 Task 4 导出，Task 6/7/8 一致引用。
- `collectGate() → {code,path}[]` 在 Task 7 定义，Task 6/7 测试一致引用。
- `readState()/setAgentState()` 在 Task 6 定义，Task 6/7 一致引用。
- `readEvidence()/writeEvidence()` 在 Task 6 定义，Task 7/8 一致引用。
- 错误码在 Task 5 落表，Task 6/7 使用。

**已知边界（不在本计划内）**
- W5 / dc-translator 新增席旅程：按 PRD §6.6 依赖图延后至 S2/S3/S4 之后；本计划所有席位数按 14 席快照。
- S1 §5.2 `InvalidOutputPath` 分支不可达、`check-all.mjs:63` 未剥离 `DOCGEN_DRAFTS_DIR`：S1 后续项，不阻塞本计划。
- `state.json` / `fixtures/*.evidence.json` 的最终提交由用户决定（本计划不执行 git 写操作）。
