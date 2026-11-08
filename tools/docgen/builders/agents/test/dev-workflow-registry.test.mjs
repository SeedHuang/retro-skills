// S1 · 登记面：TC-B06 / B07 / C10 / E06 / E15 / E19 / E22
// 这七条守的是「登记了没有」——它们坏了不会让任何渲染报错，只会让检查静默少一席。
import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { agentData } from '../components/agentData.mjs';
import { readState } from '../state.mjs';
import { readAnnotations, checkSemantic } from '../../execution-matrix/check-agent.mjs';
import { listSkillDirs } from '../../../scripts/skill-dir.mjs';
import { ROOT, readRepo } from './support/dev-workflow-checks.mjs';

const KEYS = ['A1', 'A2', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4'];

test('TC-B06 state 登记 replaced，check-agents 报全量已接管 / 未迁移 0', () => {
  // 直接读盘上的 state.json（不经 env），保证断言对象始终是仓库真实状态
  const state = JSON.parse(readRepo('tools/docgen/state.json'));
  assert.equal(state.agents['evidence-reader'], 'replaced');

  // check-agents 会读 DOCGEN_STATE_PATH；剥掉它，使 E06 构造态下本条仍以仓库真实 state 为对象
  const env = { ...process.env };
  delete env.DOCGEN_STATE_PATH;
  const r = spawnSync(process.execPath, ['tools/docgen/cli.mjs', 'check-agents'], { cwd: ROOT, encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(r.stdout.includes(`${agentData.length} 个 agent`), r.stdout);
  assert.match(r.stdout, new RegExp(`已接管 ${agentData.length}，未迁移 0`));
});

test('TC-B07 annotations 十键全为 pass，checkSemantic 零 findings', () => {
  const ann = readAnnotations();
  assert.deepEqual(KEYS.filter((k) => ann[`evidence-reader:${k}`] !== 'pass'), []);
  assert.deepEqual(checkSemantic(ann, 'evidence-reader'), []);
});

test('TC-C10 C9 断言在位：check-all 同时读到 readState 与 agentData，且 state 覆盖全部席', () => {
  const src = readRepo('scripts/check-all.mjs');
  assert.match(src, /readState\(\)/);
  assert.ok(src.includes('agentData'), 'check-all 必须取到 agentData 的名字集');
  assert.ok(src.includes('state 覆盖不全'), 'C9 的缺键报错必须写在 check-all.mjs（不得下沉 readState）');

  const agents = JSON.parse(readRepo('tools/docgen/state.json')).agents;
  assert.deepEqual(agentData.map((a) => a.name).filter((n) => !(n in agents)), []);
});

test('TC-E06 state 缺一条键 / 整文件缺失 → 缺键集中点名 evidence-reader（C9 的 fail-closed 两条形态）', () => {
  // 端到端红（npm run check exit 1 且 # fail 0）在 T10 人工核：全量门内再 spawn 全量门会递归。
  // 这里直接压 C9 的两个输入形态，并核守卫确实写在 check-all.mjs。
  const src = readRepo('scripts/check-all.mjs');
  assert.ok(src.includes('state 覆盖不全'), '缺键形态的报错必须存在');
  assert.ok(src.includes('state 文件缺失'), '整文件缺失形态的报错必须存在');
  assert.match(src, /agentData\.map\(\(a\) => a\.name\)\.filter/, '必须真的比名字集，不是只打印');

  const dir = mkdtempSync(join(tmpdir(), 'dw-state-'));
  const saved = process.env.DOCGEN_STATE_PATH;
  try {
    const state = JSON.parse(readRepo('tools/docgen/state.json'));
    delete state.agents['evidence-reader'];
    const p = join(dir, 'state-missing-key.json');
    writeFileSync(p, `${JSON.stringify(state, null, 2)}\n`);
    process.env.DOCGEN_STATE_PATH = p;
    const missing = agentData.map((a) => a.name).filter((n) => !(n in readState().agents));
    assert.deepEqual(missing, ['evidence-reader'], '缺键必须被点名');

    process.env.DOCGEN_STATE_PATH = join(dir, 'not-exist.json');
    const absent = agentData.map((a) => a.name).filter((n) => !(n in readState().agents));
    assert.equal(absent.length, agentData.length, '整文件缺失必须全量报缺（不得按 registered 放行）');
  } finally {
    if (saved === undefined) delete process.env.DOCGEN_STATE_PATH;
    else process.env.DOCGEN_STATE_PATH = saved;
    rmSync(dir, { recursive: true, force: true });
  }
});

test('TC-E15 manifest 与 skills/ 一一对应且含 dev-workflow；少了它必红', () => {
  const m = JSON.parse(readRepo('skilldependencies/manifest.json'));
  const dirs = listSkillDirs(join(ROOT, 'skills')).sort();
  assert.deepEqual([...m.skills].sort(), dirs, 'manifest 与 skills/ 必须一一对应');
  assert.ok(m.skills.includes('dev-workflow'));
  assert.equal(existsSync(join(ROOT, 'skilldependencies', 'dev-workflow.json')), true);
  assert.notDeepEqual(m.skills.filter((x) => x !== 'dev-workflow').sort(), dirs, '缺 dev-workflow 时必须不再相等');
});

test('TC-E19 annotations 值为 pending / 缺键时 A 组必红', () => {
  const pending = checkSemantic({ 'evidence-reader:A1': 'pending' }, 'evidence-reader').map((f) => f.code);
  assert.equal(pending.length, KEYS.length, '缺键与 pending 一视同仁，十键全进 findings');
  assert.equal(pending[0], 'A1');
  assert.deepEqual(checkSemantic(readAnnotations(), 'evidence-reader'), []);
});

test('TC-E22 dev-workflow 依赖集合恰为 parliament + prd-to-specs（多一个 / 少一个必红）', () => {
  const dep = JSON.parse(readRepo('skilldependencies/dev-workflow.json'));
  assert.equal(dep.schemaVersion, 1);
  assert.equal(dep.skill, 'dev-workflow');
  const exp = ['parliament', 'prd-to-specs'];
  const got = dep.dependencies.skills.map((x) => x.name).sort();
  assert.deepEqual(got, exp);

  const same = (list) => JSON.stringify([...list].sort()) === JSON.stringify([...exp].sort());
  assert.equal(same(['parliament']), false, '少一个依赖必须不等');
  assert.equal(same([...exp, 'speaker']), false, '多一个依赖必须不等');
});
