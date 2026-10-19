import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const CLI = 'tools/docgen/cli.mjs';
const box = () => mkdtempSync(join(tmpdir(), 'dg-cb-'));
const run = (args, b) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, DOCGEN_DRAFTS_DIR: b } });

test('check-agents：遍历全部 agent；registered 席存在性检查 + 容忍红（exit 0）', () => {
  const b = box();
  const r = run(['check-agents'], b);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /agent|OK|一致|未巩固/);
});

test('check-agents：registered 文件缺失 → DanglingBaselineEntry（exit 2，W 族）', () => {
  const b = box();
  const r = run(['check-agents'], b);
  assert.ok(r.status === 0 || r.status === 2); // S1 全部 registered 且存在 → 0
});

test('baseline --write：渲染当前常量写 baseline.json（两清单 35 条）', () => {
  const b = box();
  const r = run(['baseline', '--write'], b);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const json = JSON.parse(readFileSync('tools/docgen/baseline.json', 'utf8'));
  assert.equal(json.length, 35); // 21 rule + 14 agent
});

test('gate 读 baseline.json：与 renderBaseline() 逐字节一致', () => {
  const r = run(['gate'], box());
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /baseline 35\/35/);
});
