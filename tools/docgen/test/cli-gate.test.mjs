import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const CLI = 'tools/docgen/cli.mjs';
const run = (args, env = {}) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, DOCGEN_DRAFTS_DIR: mkdtempSync(join(tmpdir(), 'dg-draft-')), ...env } });

test('generate 缺省 = rule + agent 两清单全遍历（NF-2），registered 席容忍红', () => {
  const r = run(['generate']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /baseline 35\/35/);
});

test('generate --kind agent --name reviewer-product（锚点席已拆槽，S1 文件未替换 → 存在性检查通过 exit 0）', () => {
  const r = run(['generate', '--kind', 'agent', '--name', 'reviewer-product']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
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
