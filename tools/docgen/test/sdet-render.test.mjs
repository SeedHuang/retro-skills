import test from 'node:test';
import assert from 'node:assert/strict';
import { renderByName } from '../cli.mjs';
import { agentData } from '../components/agentData.mjs';
import { patternRegistry } from '../components/patternRegistry.mjs';

test('渲染 frontmatter：tools 行 + notWhen 只在 description 出现 1 次', () => {
  const r = renderByName('senior-sdet').split('\n');
  assert.equal(r.find((l) => l.startsWith('tools:')), 'tools: Read, Glob, Grep, Write, Edit');
  const hits = r.filter((l) => l.includes('修改业务代码、写实现方案'));
  assert.equal(hits.length, 1);
  assert.ok(hits[0].startsWith('description:'));
});

test('新卡「本席清单」9 行，且逐行带该席核对面', () => {
  const r = renderByName('senior-sdet');
  assert.equal((r.match(/^\| \d+ \| SDET 席卡：/gm) || []).length, 9, '固定清单 9 条须逐条渲染');
  for (const face of ['输入空间', '状态与转移', '失败面', '判据来源', '确定性', '回归资产', '判别力', '盲点雷达', '覆盖账']) {
    assert.ok(r.includes(`${face}核对`), `缺核对面：${face}`);
  }
  assert.ok(r.includes('| # | 条目 | 判据 | 类型 |'), '新卡表头应为「条目 / 判据 / 类型」');
});

test('产物无槽位残留 + testcase 席恰 [senior-sdet]', () => {
  const r = renderByName('senior-sdet');
  assert.equal([...r.matchAll(/\{\{[A-Z_]+\}\}/g)].length, 0);
  assert.deepEqual(agentData.filter((a) => a.outputKind === 'testcase').map((a) => a.name), ['senior-sdet']);
});

test('边界段 = 该席专用句（允许写 testcase），不是只读评审角色', () => {
  const r = renderByName('senior-sdet');
  const sec = r.slice(r.lastIndexOf('## 边界'));
  assert.equal(sec.includes('你是只读评审角色'), false, '边界不得退回默认只读句（B3 裁定 2026-10-31）');
  assert.ok(sec.includes('只写'), '边界必须写「只写」清单');
  assert.equal(sec.includes(patternRegistry.boundaryBySeat['senior-sdet']), true, '边界必须是 boundaryBySeat 的单源句');
});
