import test from 'node:test';
import assert from 'node:assert/strict';
import { agentData, triggerTable } from '../components/agentData.mjs';
import { patternRegistry } from '../components/patternRegistry.mjs';

const entry = () => agentData.find((a) => a.name === 'senior-sdet');
// S-A 数据层（T3）：条目键集 = 外层派生键 + 注入的 tools / boundary + 新卡 `card`。
// `dimension` 在该席本就是 undefined（JSON 存不下 undefined 键），故键集里不再列它，改用「不得有该键」判
const KEYS = ['name', 'role', 'tools', 'outputKind', 'boundary', 'card'];

test('TC-002(a)：新卡键集齐 + 四键互斥 + 9 条 checkItems + 档位/边界来自单源', () => {
  const e = entry();
  assert.deepEqual(Object.keys(e).sort(), [...KEYS].sort());
  for (const k of ['when', 'notWhen', 'route', 'fallback']) assert.equal(k in e, false, `条目不得含 ${k}`);
  assert.ok(e.card && typeof e.card === 'object', '必须已迁入新卡');
  assert.equal(e.card.checkItems.length, 9, '测试设计固定清单 9 条须逐条进 checkItems');
  assert.equal('dimension' in e, false);
  assert.equal(e.outputKind, 'testcase');
  assert.deepEqual(e.tools, ['Read', 'Glob', 'Grep', 'Write', 'Edit']);
  assert.equal(e.boundary, patternRegistry.boundaryBySeat['senior-sdet']);
});

test('TC-007：role 逐字、when 不含尾随「时」、route === name', () => {
  const e = entry();
  const t = triggerTable['senior-sdet'];
  assert.equal(e.role, '测试开发工程师（Senior SDET）');
  assert.ok(!t.when.endsWith('时'));
  assert.equal(t.route, 'senior-sdet');
});

test('TC-004：notWhen 结构化、文本逐字、refs 合法', () => {
  const t = triggerTable['senior-sdet'];
  assert.ok(Object.prototype.hasOwnProperty.call(t, 'notWhen'));
  assert.deepEqual(Object.keys(t.notWhen).sort(), ['refs', 'text']);
  assert.equal(t.notWhen.text, '修改业务代码、写实现方案、或只读的议会评审（那走 reviewer-qa）');
  assert.deepEqual(t.notWhen.refs, ['reviewer-qa']);
  assert.ok(agentData.some((a) => a.name === 'reviewer-qa'));
});
// TC-005（自评注释绑到条目）**随数据层退场**：JSON 装不下注释；该自评已按 spec §10.2.9 的处置
// 记进 spec §10.2.10 与 plan 的「执行记录」，不再作为源文本断言。
