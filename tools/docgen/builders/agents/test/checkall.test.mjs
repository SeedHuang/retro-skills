import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { agentData } from '../components/agentData.mjs';
import { buildCards, collectCardFindings } from '../components/cardPipeline.mjs';

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

test('check-all.mjs：卡面 findings 实算（K-8/K-9 接线），旧「非达标证据」句已删', () => {
  const src = readFileSync('scripts/check-all.mjs', 'utf8');
  assert.ok(src.includes('collectCardFindings('), '⑥ 段必须调用实算入口（不得保留硬编码空数组）');
  assert.equal(src.includes('const cardFindings = []'), false, '卡面 findings 不得再硬编码空数组（K-9）');
  assert.equal(src.includes('S1 未上线：非达标证据'), false, '行末旧句在置 true 后已失效，必须删除（K-8）');
  assert.ok(src.includes('阻断 ${disposed.blockers.length}'), 'n/w/b 必须取自实跑值（不写字面量）');
  assert.ok(src.includes('if (disposed.blockers.length > 0) failed = true'), '阻断非空必须让 check 变红（否则只是装饰）');
});

test('collectCardFindings：缺席 → 每席一条 MissingComponentData；装配错误即停（不叠加 S1 码）', () => {
  // 分支 (a)：built 为空 = 全席无 card 数据（「新席未迁移」最该红的场景）
  const none = collectCardFindings([]);
  assert.equal(none.length, agentData.length, `缺席时必须每席一条（实得 ${none.length} / ${agentData.length}）`);
  assert.deepEqual([...new Set(none.map((f) => f.code))], ['MissingComponentData'], '缺席分支只许报 MissingComponentData');
  assert.deepEqual(
    none.map((f) => f.file).sort(),
    agentData.map((a) => `agents/${a.name}.md`).sort(),
    'finding.file 必须逐席指向该席角色卡（与 EXEMPT_CARDS 同域）',
  );

  // 分支 (b) + 层序：装配错误即停，与 renderSeat 一致（同一根因只报一条，代码审查 R2）
  const built = buildCards();
  const first = built[0];
  const assembly = [{ code: 'UnverifiableOutput', path: 'card', message: '缺 rationale 键（夹具）' }];
  const bad = { ...first, errors: assembly, card: { ...first.card, rationale: undefined } };
  const got = collectCardFindings([bad, ...built.slice(1)]);
  const mine = got.filter((f) => f.file === `agents/${first.seat}.md`);
  assert.deepEqual(mine.map((f) => f.code), ['UnverifiableOutput'],
    `装配错误即停：该席只许报装配码（实得 ${mine.map((f) => f.code).join('|') || '(空)'}）`);
});

test('collectCardFindings：当前卡零 findings，S1 错误映射到该席角色卡路径', () => {
  const built = buildCards();
  assert.equal(built.length, agentData.length, `前置：${agentData.length} 席全可装配（实得 ${built.length}）`);
  assert.deepEqual(collectCardFindings(), [], '当前卡必须零 findings（真实值，不是硬编码）');
  // 注入坏卡：摘掉 rationale（`''` 不触发装配层缺键）→ S1 的 MissingRationale 必须落到该席 file
  const seat = built[0].seat;
  const bad = { ...built[0], card: { ...built[0].card, rationale: '' } };
  const got = collectCardFindings([bad, ...built.slice(1)]);
  const hit = got.find((f) => f.code === 'MissingRationale');
  assert.ok(hit, `摘掉 rationale 必须报 MissingRationale（实得 ${got.map((f) => f.code).join('|') || '(空)'}）`);
  assert.equal(hit.file, `agents/${seat}.md`, `finding.file 必须是该席角色卡路径（实得 ${hit.file}）`);
});
