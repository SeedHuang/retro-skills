// 结构化产物：正反例 + 证据可解析（结构校验 / 读盘校验两种模式）
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateObservation, renderObservation, checkPrerequisites } from './checks.mjs';

const IDS = ['k01', 'k02'];
const EV = { path: 'agents/detective-observer.md', line: 7, quote: '# 角色：侦探' };

const ok = (over = {}) => ({
  round: 3,
  items: [
    { id: 'k01', verdict: 'na', reason: '本轮没有被审卡' },
    { id: 'k02', verdict: 'na', reason: '同上' },
  ],
  open: [],
  coverage: { read: 4, total: 4, skipped: [] },
  closure: 'no-findings',
  ...over,
});
const codes = (doc, opt = {}) => validateObservation(doc, { registeredIds: IDS, ...opt }).errors.map((e) => e.code);

test('正例：合法产物 → 无错误', () => {
  assert.deepEqual(codes(ok()), []);
});

test('反例：缺 coverage → MissingCoverage', () => {
  const d = ok(); delete d.coverage;
  assert.ok(codes(d).includes('MissingCoverage'));
});

test('反例：coverage 写成字符串「无」→ MissingCoverage', () => {
  assert.ok(codes(ok({ coverage: '无' })).includes('MissingCoverage'));
});

test('反例：open 有 1 条却声明 no-findings → ContradictoryClosure', () => {
  const d = ok({ open: [{ object: '§3.1', evidence: EV, impact: '不可判', suggestion: '改判据' }] });
  assert.ok(codes(d).includes('ContradictoryClosure'));
});

test('正例：open 非空 + closure=null → 无错误', () => {
  const d = ok({ open: [{ object: '§3.1', evidence: EV, impact: '不可判', suggestion: '改判据' }], closure: null });
  assert.deepEqual(codes(d), []);
});

test('正例：判 hit 且带结构化证据 → 无错误', () => {
  const d = ok({ items: [{ id: 'k01', verdict: 'hit', evidence: EV }] });
  assert.deepEqual(codes(d), []);
});

test('正例：接上读盘校验后，真实证据仍通过', () => {
  const d = ok({ items: [{ id: 'k01', verdict: 'hit', evidence: EV }] });
  assert.deepEqual(codes(d, { resolveEvidence: {} }), []);
});

test('反例：读盘校验下，假证据（文件不存在）→ EvidenceNotFound', () => {
  const fake = { path: 'agents/does-not-exist.md', line: 1, quote: 'x' };
  const d = ok({ items: [{ id: 'k01', verdict: 'hit', evidence: fake }] });
  assert.ok(codes(d, { resolveEvidence: {} }).includes('EvidenceNotFound'));
});

test('反例：requires 用 mustHave 拼错 → UnknownField', () => {
  const r = checkPrerequisites([{ id: 'x', mustHave: true }], []);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.code === 'UnknownField'));
});

test('反例：must 写成字符串 "false" → InvalidFieldType', () => {
  const r = checkPrerequisites([{ id: 'x', must: 'false' }], []);
  assert.ok(r.errors.some((e) => e.code === 'InvalidFieldType'));
});

test('正例：requires 齐 → ok=true 且无错误', () => {
  const r = checkPrerequisites([{ id: 'a', must: true }, { id: 'b', must: false }], ['a']);
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, []);
});

test('渲染：覆盖度与结论由数据派生（不手写）', () => {
  const md = renderObservation(ok({ open: [{ object: '§3.1', evidence: EV, impact: 'x', suggestion: 'y' }], closure: null }));
  assert.match(md, /覆盖度：读 4 部分 \/ 共 4 部分/);
  assert.match(md, /§3\.1/);
  assert.doesNotMatch(md, /已覆盖全部/);
});
