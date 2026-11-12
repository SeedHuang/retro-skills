import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { renderBaseline, BASELINE_RULES, agentPaths } from '../components/baseline.mjs';
import { modelWithShared, renderSeatText } from '../../../../agent-model/source.mjs';

const CLI = 'tools/docgen/builders/agents/cli.mjs';
const run = (args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, DOCGEN_DRAFTS_DIR: '.tmp-test/drafts' } });
const descriptionOf = (seat) => /^description:\s*(.+)$/m.exec(readFileSync(`agents/${seat}.md`, 'utf8'))?.[1]?.trim();

test('W4：锚点席 description 形态（P5 后 = 模型 description 渲染直出）', () => {
  for (const name of ['reviewer-product', 'senior-sdet']) {
    const onDisk = descriptionOf(name);
    const rendered = /^description:\s*(.+)$/m.exec(renderSeatText(name))?.[1]?.trim();
    assert.ok(onDisk, `${name} 无 description`);
    assert.equal(onDisk, rendered, `${name} description 必须 = 模型渲染结果`);
    assert.equal(onDisk.includes('在议会评审中担任'), false, `${name} 不得再派生旧句式`);
  }
  // senior-sdet 的「不用于」必须来自模型 template，而不是散落在卡面
  const sdet = modelWithShared('senior-sdet');
  assert.ok(sdet.seat.description.template.includes('不用于：'), 'senior-sdet 模型 template 必须含「不用于」');
  assert.ok(descriptionOf('senior-sdet').endsWith('（那走 reviewer-qa）'), '卡面 description 必须保留结尾');
});

test('W5：gate 输出 baseline N/N，N 从常量派生（不写死条数）', () => {
  const n = BASELINE_RULES.length + agentPaths().length;
  const r = run(['gate']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, new RegExp(`baseline ${n}\\/${n}`));
});

test('W8：gen-agents.mjs 已退役（不存在），check 不引用它', () => {
  assert.ok(!existsSync('skills/parliament/scripts/gen-agents.mjs'), 'gen-agents.mjs 应已删（W8）');
  const c = run(['check-agents']);
  assert.equal(c.status, 0, c.stdout + c.stderr);
});

test('W9：等价迁移 V1 在 docgen 逐字节成立；spike 已删（全绿后）', () => {
  assert.ok(!existsSync('tools/docgen-spike'), 'tools/docgen-spike 应已删（W9）');
  // V1 由 migrate.test.mjs 覆盖
});
