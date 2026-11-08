import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { agentData } from '../components/agentData.mjs';
import { CARD_SEGMENTS } from '../card-model/vocab/card-must-fields.mjs';
import { renderByName } from '../cli.mjs';

// S4 Task 7：旧手写卡模板已退场，本席断言改为新卡等价面（7 段 + 9 条 checkItems 逐条在位）
const tpl = () => readFileSync('tools/docgen/templates/agent-card.md.tpl', 'utf8');
const entry = () => agentData.find((a) => a.name === 'senior-sdet');

test('TC-006：新卡 7 段齐且顺序 = CARD_SEGMENTS 单源', () => {
  const got = [...renderByName('senior-sdet').matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(got, [...CARD_SEGMENTS]);
});

test('TC-002(b)(d)：新卡模板槽位化（tools 行为槽、无 {{NOT_WHEN}} / 裸 notWhen）', () => {
  const t = tpl();
  assert.equal(t.split('\n').find((l) => l.startsWith('tools:')), 'tools: {{TOOLS}}');
  assert.equal(t.includes('{{NOT_WHEN}}'), false, '新卡模板含 {{NOT_WHEN}}');
  assert.equal(t.includes('notWhen'), false, '新卡模板含裸 notWhen');
});

test('TC-002(c)：卡数据不进模板（本席 9 条核对面与职责句在模板 0 命中）', () => {
  const e = entry();
  const t = tpl();
  const probes = [
    ...e.card.checkItems.map((x, i) => [`checkItems[${i}]`, x.label]),
    ['duty.action', e.card.duty.action],
  ];
  const hit = probes.filter(([, v]) => v && t.includes(v));
  assert.deepEqual(hit.map((p) => p[0]), []);
});

test('TC-002(e)：该席 9 条 checkItems 逐条在位（id / subject / manual 宣告者）', () => {
  const e = entry();
  assert.equal(e.card.checkItems.length, 9);
  for (const it of e.card.checkItems) {
    assert.match(it.id, /^senior-sdet\.\d+$/, it.id);
    assert.equal(it.subject, 'senior-sdet.card');
    assert.equal(it.check, 'manual');
    assert.ok(typeof it.declarer === 'string' && it.declarer.trim() !== '', `缺宣告者：${it.id}`);
  }
});
