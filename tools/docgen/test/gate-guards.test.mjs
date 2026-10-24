import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const CLI = 'tools/docgen/cli.mjs';
const run = (args, env = {}) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, DOCGEN_DRAFTS_DIR: mkdtempSync(join(tmpdir(), 'dg-g-')), ...env } });

test('gate：清单外新增 rules 文件 → UnregisteredHandwritten（exit 2）', () => {
  // 测试隔离：扫描目录重定向到临时目录（DOCGEN_RULES_DIR），不碰真实 rules/（防并行测试竞态）
  const dir = mkdtempSync(join(tmpdir(), 'dg-rules-'));
  writeFileSync(join(dir, 'zz-gate-guard-tmp.md'), '# 临时\n');
  try {
    const r = run(['gate'], { DOCGEN_RULES_DIR: dir });
    assert.ifError(r.error); // 子进程启动失败时 status 为 null，先报根因再断言
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.match(r.stdout + r.stderr, /UnregisteredHandwritten/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
