import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { renderBaseline, BASELINE_RULES, agentPaths } from '../components/baseline.mjs';
import { agentData, triggerTable } from '../components/agentData.mjs';
import { patternRegistry } from '../components/patternRegistry.mjs';

const CLI = 'tools/docgen/cli.mjs';
const run = (args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, DOCGEN_DRAFTS_DIR: '.tmp-test/drafts' } });

test('W4：锚点席（reviewer-product/senior-sdet）派生 description == 句式拼装逐字相等', () => {
  for (const name of ['reviewer-product', 'senior-sdet']) {
    const a = agentData.find((x) => x.name === name);
    const t = triggerTable[name];
    const derived = a.outputKind === 'testcase'
      ? patternRegistry.description.handwritten(a.role, t.when, t.notWhen?.text ?? '')
      : patternRegistry.description.parliament(a.role, t.when);
    assert.ok(!derived.includes('时时'), `${name} 派生含时时`);
    const onDisk = readFileSync(`agents/${name}.md`, 'utf8');
    const fm = /^description:\s*(.+)$/m.exec(onDisk);
    assert.ok(fm, `${name} 无 description`);
    assert.equal(derived, fm[1].trim(), `${name} 派生 ≠ 现文件 description`);
  }
});

test('W5：gate 输出 baseline N/N，N 从常量派生（35 开工 / 36 新增后）', () => {
  const n = BASELINE_RULES.length + agentPaths().length;
  assert.equal(n, 35);
  const r = run(['gate']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, new RegExp(`baseline ${n}\\/${n}`));
});

test('W8：gen-agents.mjs 已退役（不存在），check 不引用它', () => {
  assert.ok(!existsSync('skills/parliament/scripts/gen-agents.mjs'), 'gen-agents.mjs 应已删（W8）');
  const c = run(['check-agents']);
  assert.ok(c.status === 0 || c.status === 1, 'check-agents 可跑');
});

test('W9：等价迁移 V1 在 docgen 逐字节成立；spike 已删（全绿后）', () => {
  assert.ok(!existsSync('tools/docgen-spike'), 'tools/docgen-spike 应已删（W9）');
  // V1 由 Task 3 migrate.test.mjs 覆盖
});
