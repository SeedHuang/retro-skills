import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('check-all.mjs：gate 调用已切到 tools/docgen/cli.mjs gate', () => {
  const src = readFileSync('scripts/check-all.mjs', 'utf8');
  assert.ok(!src.includes('docgen-spike'), 'check-all 仍引用 docgen-spike');
  assert.ok(src.includes('tools/docgen/cli.mjs') && /cli\.mjs['"]?\s*,?\s*['"]?gate/.test(src), 'check-all 未调用 docgen gate');
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
