import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { listSeats, collectModelFindings } from '../../../models/agents/source.mjs';

test('check-all.mjs：gate 调用已切到 tools/docgen/builders/agents/cli.mjs gate', () => {
  const src = readFileSync('scripts/check-all.mjs', 'utf8');
  assert.ok(!src.includes('docgen-spike'), 'check-all 仍引用 docgen-spike');
  assert.ok(src.includes('tools/docgen/builders/agents/cli.mjs') && /cli\.mjs['"]?\s*,?\s*['"]?gate/.test(src), 'check-all 未调用 docgen gate');
});

test('check-all.mjs：baseline 断言参数化（不再硬编码 21/21）', () => {
  const src = readFileSync('scripts/check-all.mjs', 'utf8');
  assert.ok(!/baseline 21\/21/.test(src), '仍硬编码 21/21');
  assert.ok(/baseline\s+\$\{/.test(src) || /N\/N/.test(src), 'baseline 断言未参数化');
});

test('gen-agents.test.mjs 已删（守卫断言迁入 validate/check-agents，R7 序 0）', () => {
  assert.ok(!existsSync('skills/parliament/scripts/gen-agents.test.mjs'), 'gen-agents.test.mjs 应已删除');
});

test('parliament SKILL.md / assembly-matrix.md 生成指令已改指 docgen', () => {
  const s = readFileSync('skills/parliament/SKILL.md', 'utf8');
  assert.ok(!s.includes('gen-agents.mjs 单源生成'), 'SKILL.md 仍指 gen-agents');
  const a = readFileSync('skills/parliament/references/assembly-matrix.md', 'utf8');
  assert.ok(!a.includes('gen-agents.mjs'), 'assembly-matrix.md 仍指 gen-agents');
});

test('check-all.mjs：卡面 findings 实算已切模型源（collectModelFindings）', () => {
  const src = readFileSync('scripts/check-all.mjs', 'utf8');
  assert.ok(src.includes('collectModelFindings('), '⑥ 段必须调用模型 findings 实算入口');
  assert.equal(src.includes('collectCardFindings('), false, '旧卡管线 findings 入口必须退场');
  assert.equal(src.includes('const cardFindings = []'), false, '卡面 findings 不得再硬编码空数组（K-9）');
  assert.ok(src.includes('阻断 ${disposed.blockers.length}'), 'n/w/b 必须取自实跑值（不写字面量）');
  assert.ok(src.includes('if (disposed.blockers.length > 0) failed = true'), '阻断非空必须让 check 变红（否则只是装饰）');
});

test('collectModelFindings：当前 18 席模型零 findings，席名与角色卡一一对应', () => {
  assert.equal(listSeats().length, 18);
  assert.deepEqual(collectModelFindings(), [], '当前模型必须零 findings（真实值，不是硬编码）');
  for (const seat of listSeats()) assert.ok(existsSync(`agents/${seat}.md`), `缺角色卡 agents/${seat}.md`);
});
