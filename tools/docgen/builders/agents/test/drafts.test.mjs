import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const CLI = 'tools/docgen/cli.mjs';
const draftBox = () => mkdtempSync(join(tmpdir(), 'dg-box-'));
const run = (args, box) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, DOCGEN_DRAFTS_DIR: box } });

test('draft：落草稿箱（agents/ 零改动）+ 遇旧草稿 → DraftNameConflict（exit 1）', () => {
  const box = draftBox();
  const r1 = run(['draft', '--kind', 'agent', '--name', 'reviewer-product'], box);
  assert.equal(r1.status, 0, r1.stdout + r1.stderr);
  const files = readdirSync(box);
  assert.equal(files.length, 1);
  assert.match(files[0], /^reviewer-product--\d{8}-\d{6}\.md$/);
  const r2 = run(['draft', '--kind', 'agent', '--name', 'reviewer-product'], box);
  assert.equal(r2.status, 1);
  assert.match(r2.stdout + r2.stderr, /DraftNameConflict/);
});

test('draft ls：带时间列出 + --name 过滤', () => {
  const box = draftBox();
  run(['draft', '--kind', 'agent', '--name', 'reviewer-product'], box);
  const r = run(['draft', 'ls', '--name', 'reviewer-product'], box);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /reviewer-product/);
});

test('draft rm：删指定 name；无 --name 删全部需 --yes（缺省 NotAuthorized exit 4）', () => {
  const box = draftBox();
  run(['draft', '--kind', 'agent', '--name', 'reviewer-product'], box);
  const r1 = run(['draft', 'rm'], box);
  assert.equal(r1.status, 4);
  assert.match(r1.stdout + r1.stderr, /NotAuthorized/);
  const r2 = run(['draft', 'rm', '--yes'], box);
  assert.equal(r2.status, 0);
  assert.equal(readdirSync(box).length, 0);
});

test('draft ensure：幂等建目录', () => {
  const box = draftBox();
  rmSync(box, { recursive: true, force: true });
  const r1 = run(['draft', 'ensure'], box);
  assert.equal(r1.status, 0);
  assert.ok(existsSync(box));
});

test('replace：缺 --yes → NotAuthorized（exit 4）；草稿 ≠ 渲染 → DraftDrift（exit 1）', () => {
  const box = draftBox();
  run(['draft', '--kind', 'agent', '--name', 'reviewer-product'], box);
  const draft = readdirSync(box)[0];
  const r1 = run(['replace', '--kind', 'agent', '--name', 'reviewer-product', '--draft', join(box, draft)], box);
  assert.equal(r1.status, 4);
  // 篡改草稿 → DraftDrift
  writeFileSync(join(box, draft), '# 被手改\n');
  const r2 = run(['replace', '--kind', 'agent', '--name', 'reviewer-product', '--draft', join(box, draft), '--yes'], box);
  assert.equal(r2.status, 1);
  assert.match(r2.stdout + r2.stderr, /DraftDrift/);
});

test('replace：草稿不存在 → DraftNotFound（exit 3）', () => {
  const box = draftBox();
  const r = run(['replace', '--kind', 'agent', '--name', 'reviewer-product', '--draft', join(box, 'ghost.md'), '--yes'], box);
  assert.equal(r.status, 3);
  assert.match(r.stdout + r.stderr, /DraftNotFound/);
});

test('replace：非 agent kind → UnsupportedKind（exit 2）', () => {
  const box = draftBox();
  const r = run(['replace', '--kind', 'rule', '--name', 'x', '--draft', 'y', '--yes'], box);
  assert.equal(r.status, 2);
  assert.match(r.stdout + r.stderr, /UnsupportedKind/);
});

test('name 逃逸：--name foo/../bar → InvalidName（exit 1，格式层拦截，NF-1）', () => {
  const box = draftBox();
  const r = run(['draft', '--kind', 'agent', '--name', 'foo/../bar'], box);
  assert.equal(r.status, 1);
  assert.match(r.stdout + r.stderr, /InvalidName/);
});
