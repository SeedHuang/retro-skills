import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const CLI = 'tools/docgen/cli.mjs';
const run = (args, env = {}) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, DOCGEN_DRAFTS_DIR: mkdtempSync(join(tmpdir(), 'dg-draft-')), ...env } });

test('generate 缺省 = rule + agent 两清单全遍历（NF-2）：已拆槽席渲染比对（锚点席文件未替换 → 红 exit 1）+ baseline 35/35', () => {
  const r = run(['generate']);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /baseline 35\/35/);
});

test('generate --kind agent --name reviewer-product：已拆槽席渲染比对，S1 手写文件未替换 → 不等 exit 1', () => {
  const r = run(['generate', '--kind', 'agent', '--name', 'reviewer-product']);
  assert.equal(r.status, 1, r.stdout + r.stderr);
});

test('generate --name ghost → MissingComponentData（exit 2）', () => {
  const r = run(['generate', '--kind', 'agent', '--name', 'ghost']);
  assert.equal(r.status, 2);
  assert.match(r.stdout + r.stderr, /MissingComponentData/);
});

test('gate：两清单基线 + 全量重建比对 + W4 派生断言 + baseline N/N', () => {
  const r = run(['gate']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /baseline 35\/35/);
  assert.ok(!/FAIL/.test(r.stdout));
});

test('generate --name reviewer-audit：渲染与黄金快照一致 → exit 0', () => {
  const r = run(['generate', '--kind', 'agent', '--name', 'reviewer-audit']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('generate --name reviewer-qa：registered 未拆槽席只做存在性检查 → exit 0', () => {
  const r = run(['generate', '--kind', 'agent', '--name', 'reviewer-qa']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('generate 全遍历：14 席中已拆槽席渲染比对、其余存在性检查 → 锚点席未替换 exit 1 + baseline 35/35', () => {
  const r = run(['generate']);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /baseline 35\/35/);
});
