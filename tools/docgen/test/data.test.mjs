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
