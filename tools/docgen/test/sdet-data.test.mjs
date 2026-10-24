import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { agentData, triggerTable } from '../components/agentData.mjs';

const entry = () => agentData.find((a) => a.name === 'senior-sdet');
const KEYS = ['name', 'heading', 'role', 'dimension', 'tools', 'identity', 'fixedList', 'sourceLine', 'outputKind', 'sharedBlock'];

test('TC-002(a)：10 键全在 + 四键互斥 + fixedList === 9', () => {
  const e = entry();
  for (const k of KEYS) assert.ok(Object.prototype.hasOwnProperty.call(e, k), `缺键 ${k}`);
  assert.deepEqual(Object.keys(e).sort(), [...KEYS].sort());
  for (const k of ['when', 'notWhen', 'route', 'fallback']) assert.equal(k in e, false, `条目不得含 ${k}`);
  assert.equal(e.fixedList.length, 9);
  assert.equal(e.dimension, undefined);
  assert.equal(e.sharedBlock, undefined);
  assert.equal(e.outputKind, 'testcase');
  assert.deepEqual(e.tools, ['Read', 'Glob', 'Grep', 'Write', 'Edit']);
});

test('TC-007：heading !== role，when 不含尾随「时」，route === name', () => {
  const e = entry();
  const t = triggerTable['senior-sdet'];
  assert.equal(e.heading, 'Senior SDET（测试设计与盲点猎手）');
  assert.equal(e.role, '资深测试开发工程师（Senior SDET）');
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

test('TC-005：自评注释绑到条目（前 ≤15 行内含 translation-self-check + 详细 + 逻辑化）', () => {
  const lines = readFileSync('tools/docgen/components/agentData.mjs', 'utf8').split('\n');
  const i = lines.findIndex((l) => /name:\s*'senior-sdet'/.test(l));
  assert.ok(i >= 0, '找不到 senior-sdet 条目行');
  const hit = lines
    .slice(Math.max(0, i - 15), i + 1)
    .filter((l) => l.includes('translation-self-check') && l.includes('详细') && l.includes('逻辑化'));
  assert.ok(hit.length >= 1, '条目上方窗口内缺自评注释');
});
