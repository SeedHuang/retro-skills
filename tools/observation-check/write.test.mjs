// 写盘流程：校验不过一个字都不写；写过之后 md 与 json 天然一致
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderObservation } from './checks.mjs';
import { writeObservation, validateArtifact } from './artifact.mjs';

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

const dir = mkdtempSync(join(tmpdir(), 'write-'));
test.after(() => rmSync(dir, { recursive: true, force: true }));
const paths = (name) => ({ jsonPath: join(dir, `${name}.json`), mdPath: join(dir, `${name}.md`) });

test('正例：合法产物 → 两个文件都写，且 md 等于渲染结果', () => {
  const p = paths('ok');
  const r = writeObservation(doc(), { ...p, registeredIds: IDS });
  assert.equal(r.ok, true);
  assert.equal(r.wrote, true);
  assert.match(readFileSync(p.mdPath, 'utf8'), /命中/);
  assert.equal(readFileSync(p.mdPath, 'utf8'), renderObservation(doc()));
});

test('反例：缺 coverage → 不写盘（两个文件都不存在）', () => {
  const p = paths('nocov');
  const d = doc(); delete d.coverage;
  const r = writeObservation(d, { ...p, registeredIds: IDS });
  assert.equal(r.ok, false);
  assert.equal(r.wrote, false);
  assert.equal(existsSync(p.jsonPath), false);
  assert.equal(existsSync(p.mdPath), false);
});

test('反例：假证据 → 不写盘', () => {
  const p = paths('fakeev');
  const d = doc({ items: [{ id: 'k01', verdict: 'hit', evidence: { path: 'agents/nope.md', line: 1, quote: 'x' } }] });
  const r = writeObservation(d, { ...p, registeredIds: IDS });
  assert.equal(r.wrote, false);
  assert.ok(r.errors.some((e) => e.code === 'EvidenceNotFound'));
  assert.equal(existsSync(p.mdPath), false);
});

test('反例：单字 quote 走写盘入口 → 拒绝且零写盘', () => {
  writeFileSync(join(dir, 'ev.md'), '# 标题\n这是一段足够长的说明文字，用来验证单字引用被拒绝\n', 'utf8');
  const p = paths('shortq');
  const d = doc({ items: [{ id: 'k01', verdict: 'hit', evidence: { path: 'ev.md', line: 2, quote: '的' } }] });
  const r = writeObservation(d, { ...p, registeredIds: IDS, root: dir });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.code === 'EvidenceQuoteTooShort'));
  assert.equal(existsSync(p.jsonPath), false);
  assert.equal(existsSync(p.mdPath), false);
});

test('反例：证据路径逃出根目录 → 拒绝且零写盘', () => {
  const p = paths('outside');
  const d = doc({ items: [{ id: 'k01', verdict: 'hit', evidence: { path: '../outside.md', line: 1, quote: '这是一段足够长的引用文字' } }] });
  const r = writeObservation(d, { ...p, registeredIds: IDS, root: dir });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.code === 'EvidencePathOutside'));
  assert.equal(existsSync(p.jsonPath), false);
  assert.equal(existsSync(p.mdPath), false);
});

test('正例：重复写入幂等（第二次结果相同）', () => {
  const p = paths('idem');
  writeObservation(doc(), { ...p, registeredIds: IDS });
  const first = readFileSync(p.mdPath, 'utf8');
  writeObservation(doc(), { ...p, registeredIds: IDS });
  assert.equal(readFileSync(p.mdPath, 'utf8'), first);
});

test('联动：写完手改 md → 读时校验报 RenderMismatch', () => {
  const p = paths('tamper');
  writeObservation(doc(), { ...p, registeredIds: IDS });
  const md = readFileSync(p.mdPath, 'utf8').replace('命中', '未命中');
  writeFileSync(p.mdPath, md, 'utf8');
  const r = validateArtifact(p.jsonPath, { mdPath: p.mdPath, registeredIds: IDS });
  assert.ok(r.errors.some((e) => e.code === 'RenderMismatch'));
});

test('正例：中文与换行按 UTF-8 落盘，可回读', () => {
  const p = paths('utf8');
  writeObservation(doc({ items: [{ id: 'k01', verdict: 'na', reason: '本轮没有被审卡' }] }), { ...p, registeredIds: IDS });
  const md = readFileSync(p.mdPath, 'utf8');
  assert.match(md, /本轮没有被审卡/);
  assert.equal(md.includes('\r\n'), false, 'md 应为 LF');
});
