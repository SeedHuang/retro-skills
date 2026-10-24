import test from 'node:test';
import assert from 'node:assert/strict';
import { agentData, triggerTable } from '../components/agentData.mjs';
import { patternRegistry, DOMAIN } from '../components/patternRegistry.mjs';

const entry = () => agentData.find((a) => a.name === 'reviewer-audit');

test('reviewer-audit 八键齐，触发表四字段不混入 agentData', () => {
  const a = entry();
  assert.equal(a.role, '审计专员');
  assert.equal(a.dimension, '独立（标准核对）');
  assert.deepEqual(a.tools, ['Read', 'Glob', 'Grep', 'RunCommand']);
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

test('detective-observer tools = command 档（Read/Glob/Grep/RunCommand）', () => {
  const d = agentData.find((a) => a.name === 'detective-observer');
  assert.deepEqual(d.tools, ['Read', 'Glob', 'Grep', 'RunCommand']);
});
