import test from 'node:test';
import assert from 'node:assert/strict';
import { renderByName } from '../cli.mjs';
import { agentData } from '../components/agentData.mjs';

test('渲染 tools 行 + notWhen 只出现 1 次且在 description 行', () => {
  const r = renderByName('senior-sdet').split('\n');
  assert.equal(r.find((l) => l.startsWith('tools:')), 'tools: Read, Glob, Grep, Write, Edit');
  const hits = r.filter((l) => l.includes('修改业务代码、写实现方案'));
  assert.equal(hits.length, 1);
  assert.ok(hits[0].startsWith('description:'));
});

test('固定清单整行直拼为 9 行（不重拼「必问/待答」）', () => {
  const r = renderByName('senior-sdet');
  assert.equal((r.match(/^\| \d+ \| [^|]+ \|$/gm) || []).length, 9);
  assert.equal(r.includes('| 待答 |'), false);
  assert.ok(r.includes('| # | 必答 |'));
});

test('产物无槽位残留 + testcase 席恰 [senior-sdet]', () => {
  const r = renderByName('senior-sdet');
  assert.equal([...r.matchAll(/\{\{[A-Z_]+\}\}/g)].length, 0);
  assert.deepEqual(agentData.filter((a) => a.outputKind === 'testcase').map((a) => a.name), ['senior-sdet']);
});
