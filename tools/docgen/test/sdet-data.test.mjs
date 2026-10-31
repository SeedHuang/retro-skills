import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { agentData, triggerTable } from '../components/agentData.mjs';
import { patternRegistry } from '../components/patternRegistry.mjs';

const entry = () => agentData.find((a) => a.name === 'senior-sdet');
// S4 迁移后条目键集 = 外层派生键 + 注入的 tools / boundary + 新卡 `card`（旧模板键随 Task 7 删除）
const KEYS = ['name', 'role', 'dimension', 'tools', 'outputKind', 'boundary', 'card'];

test('TC-002(a)：新卡键集齐 + 四键互斥 + 9 条 checkItems + 档位/边界来自单源', () => {
  const e = entry();
  assert.deepEqual(Object.keys(e).sort(), [...KEYS].sort());
  for (const k of ['when', 'notWhen', 'route', 'fallback']) assert.equal(k in e, false, `条目不得含 ${k}`);
  assert.ok(e.card && typeof e.card === 'object', '必须已迁入新卡');
  assert.equal(e.card.checkItems.length, 9, '测试设计固定清单 9 条须逐条进 checkItems');
  assert.equal(e.dimension, undefined);
  assert.equal(e.outputKind, 'testcase');
  assert.deepEqual(e.tools, ['Read', 'Glob', 'Grep', 'Write', 'Edit']);
  assert.equal(e.boundary, patternRegistry.boundaryBySeat['senior-sdet']);
});

test('TC-007：role 逐字、when 不含尾随「时」、route === name', () => {
  const e = entry();
  const t = triggerTable['senior-sdet'];
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
