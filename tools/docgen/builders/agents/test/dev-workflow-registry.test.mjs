// S1 · 登记面：TC-B06 / B07 / C10 / E15 / E19 / E22
// 这些条守的是「登记了没有」——它们坏了不会让任何渲染报错，只会让检查静默少一席。
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { listSeats } from '../../../models/agents/source.mjs';
import { readAnnotations, checkSemantic } from '../../../../execution-matrix/check-agent.mjs';
import { listSkillDirs } from '../../../../../scripts/skill-dir.mjs';
import { ROOT, readRepo } from './support/dev-workflow-checks.mjs';

const KEYS = ['A1', 'A2', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4'];

test('TC-B06 check-agents 逐席由模型渲染：全席已检查且逐字节一致', () => {
  const r = spawnSync(process.execPath, ['tools/docgen/builders/agents/cli.mjs', 'check-agents'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(r.stdout.includes(`${listSeats().length} 个 agent`), r.stdout);
  assert.match(r.stdout, /全部由模型渲染/);
});

test('TC-B07 annotations 十键全为 pass，checkSemantic 零 findings', () => {
  const ann = readAnnotations();
  assert.deepEqual(KEYS.filter((k) => ann[`evidence-reader:${k}`] !== 'pass'), []);
  assert.deepEqual(checkSemantic(ann, 'evidence-reader'), []);
});

test('TC-C10 check-all A 组覆盖集直接取 listSeats（18 席全量）', () => {
  const src = readRepo('scripts/check-all.mjs');
  assert.ok(src.includes('listSeats'), 'check-all 必须取到模型席列表的名字集');
  assert.match(src, /const seats = listSeats\(\)/, 'A 组覆盖集必须直接用 listSeats');
  assert.equal(src.includes('readState'), false, 'state 账本已退场，check-all 不得再读');
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
