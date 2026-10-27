// 入口函数：一次跑完 结构 / 证据 / 渲染一致
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderObservation } from './checks.mjs';
import { validateArtifact, validateArtifactExitCode } from './artifact.mjs';

const IDS = ['k01', 'k02'];
const EV = { path: 'agents/detective-observer.md', line: 7, quote: '# 角色：侦探' };
const doc = (over = {}) => ({
  round: 3,
  items: [{ id: 'k01', verdict: 'hit', evidence: EV }],
  open: [],
  coverage: { read: 4, total: 4, skipped: [] },
  closure: 'no-findings',
  ...over,
});

const dir = mkdtempSync(join(tmpdir(), 'art-'));
const write = (name, content) => {
  const p = join(dir, name);
  writeFileSync(p, typeof content === 'string' ? content : JSON.stringify(content, null, 2), 'utf8');
  return p;
};
test.after(() => rmSync(dir, { recursive: true, force: true }));

const codes = (r) => r.errors.map((e) => e.code);

test('正例：json 合法 + md 与渲染一致 → ok', () => {
  const d = doc();
  const j = write('ok.json', d);
  const m = write('ok.md', renderObservation(d));
  const r = validateArtifact(j, { mdPath: m, registeredIds: IDS });
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, []);
});

test('反例：json 文件不存在 → JsonNotFound', () => {
  const r = validateArtifact(join(dir, 'nope.json'));
  assert.deepEqual(codes(r), ['JsonNotFound']);
});

test('反例：JSON 语法坏掉 → InvalidJson', () => {
  const j = write('bad.json', '{ "round": 3, ');
  assert.deepEqual(codes(validateArtifact(j)), ['InvalidJson']);
});

test('反例：结构缺 coverage → MissingCoverage', () => {
  const d = doc(); delete d.coverage;
  const j = write('nocov.json', d);
  assert.ok(codes(validateArtifact(j, { registeredIds: IDS })).includes('MissingCoverage'));
});

test('反例：假证据（文件不存在）→ EvidenceNotFound', () => {
  const d = doc({ items: [{ id: 'k01', verdict: 'hit', evidence: { path: 'agents/nope.md', line: 1, quote: 'x' } }] });
  const j = write('fakeev.json', d);
  assert.ok(codes(validateArtifact(j, { registeredIds: IDS })).includes('EvidenceNotFound'));
});

test('反例：md 缺失 → MdMissing', () => {
  const d = doc();
  const j = write('nomd.json', d);
  const r = validateArtifact(j, { mdPath: join(dir, 'absent.md'), registeredIds: IDS });
  assert.ok(codes(r).includes('MdMissing'));
});

test('反例：md 被手改 → RenderMismatch（带行号）', () => {
  const d = doc();
  const j = write('tamper.json', d);
  const m = write('tamper.md', renderObservation(d).replace('命中', '未命中'));
  const r = validateArtifact(j, { mdPath: m, registeredIds: IDS });
  assert.ok(codes(r).includes('RenderMismatch'));
  assert.match(r.errors.find((e) => e.code === 'RenderMismatch').message, /第 \d+ 行/);
});

test('结构错时不跑渲染比对（避免级联噪声）', () => {
  const d = doc(); delete d.coverage;
  const j = write('cascade.json', d);
  const m = write('cascade.md', '# 完全不相干的文本');
  const c = codes(validateArtifact(j, { mdPath: m, registeredIds: IDS }));
  assert.ok(c.includes('MissingCoverage'));
  assert.ok(!c.includes('RenderMismatch'), '结构错时不应再报渲染不一致');
});

test('退出码：通过 0 / 失败 1', () => {
  const d = doc();
  const j = write('exit.json', d);
  const m = write('exit.md', renderObservation(d));
  assert.equal(validateArtifactExitCode(j, { mdPath: m, registeredIds: IDS }), 0);
  const bad = write('exit-bad.json', doc({ round: 0 }));
  assert.equal(validateArtifactExitCode(bad, { registeredIds: IDS }), 1);
});
