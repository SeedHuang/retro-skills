import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, appendFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const CLI = 'tools/docgen/cli.mjs';
const run = (args, env = {}) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, DOCGEN_DRAFTS_DIR: mkdtempSync(join(tmpdir(), 'dg-draft-')), ...env } });

test('generate 缺省 = rule + agent 两清单全遍历（NF-2）：14 席全部拆槽且渲染 == 现卡 → exit 0 + baseline 35/35', () => {
  const r = run(['generate']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /baseline 35\/35/);
});

test('generate --kind agent --name reviewer-product：渲染 == 现卡 → exit 0', () => {
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

test('generate --name reviewer-audit：渲染与黄金快照一致 → exit 0', () => {
  const r = run(['generate', '--kind', 'agent', '--name', 'reviewer-audit']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('generate --name reviewer-qa：拆槽后渲染 == 现卡 → exit 0', () => {
  const r = run(['generate', '--kind', 'agent', '--name', 'reviewer-qa']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('字节反例：副本仓注入一字节 → generate 判漂移 exit 1（不依赖工作区）', () => {
  const dst = mkdtempSync(join(tmpdir(), 'dg-copy-'));
  try {
    cpSync('tools/docgen', join(dst, 'tools/docgen'), { recursive: true });
    cpSync('agents', join(dst, 'agents'), { recursive: true });
    const target = join(dst, 'agents', 'reviewer-qa.md');
    appendFileSync(target, ' ');
    const r = spawnSync(process.execPath, ['tools/docgen/cli.mjs', 'generate', '--kind', 'agent', '--name', 'reviewer-qa'], {
      cwd: dst, encoding: 'utf8', env: { ...process.env, DOCGEN_DRAFTS_DIR: join(dst, '.drafts') },
    });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /baseline 35\/35/);
  } finally {
    rmSync(dst, { recursive: true, force: true });
  }
});
