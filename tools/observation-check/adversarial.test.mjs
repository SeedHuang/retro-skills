// 对抗用例（JSON 版）：结构化攻击 + 假证据
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateObservation, checkPrerequisites } from './checks.mjs';

const IDS = ['k01', 'k02'];
const EV = { path: 'agents/detective-observer.md', line: 7, quote: '# 角色：侦探' };
const base = () => ({
  round: 3,
  items: [{ id: 'k01', verdict: 'na', reason: '本轮无卡' }],
  open: [],
  coverage: { read: 4, total: 4, skipped: [] },
  closure: 'no-findings',
});
const codes = (d, opt = {}) => validateObservation(d, { registeredIds: IDS, ...opt }).errors.map((e) => e.code);

test('A1 coverage.read 伪装成字符串 "4" → InvalidCoverage', () => {
  const d = base(); d.coverage.read = '4';
  assert.ok(codes(d).includes('InvalidCoverage'));
});

test('A2 coverage.total = 0（空集伪装）→ InvalidCoverage', () => {
  const d = base(); d.coverage.total = 0;
  assert.ok(codes(d).includes('InvalidCoverage'));
});

test('A3 open 用对象代替数组 → InvalidFieldType', () => {
  const d = base(); d.open = { object: '§3.1' };
  assert.ok(codes(d).includes('InvalidFieldType'));
});

test('A4 open 项 evidence 全是空白 → InvalidFieldType', () => {
  const d = base();
  d.open = [{ object: '§3.1', evidence: '   ', impact: 'x', suggestion: 'y' }];
  assert.ok(codes(d).includes('InvalidFieldType'));
});

test('A5 verdict 写成 "N/A" → UnknownVerdict', () => {
  const d = base(); d.items = [{ id: 'k01', verdict: 'N/A' }];
  assert.ok(codes(d).includes('UnknownVerdict'));
});

test('A6 open 非空 + closure 声明 no-findings → ContradictoryClosure', () => {
  const d = base();
  d.open = [{ object: '§3.1', evidence: EV, impact: 'x', suggestion: 'y' }];
  assert.ok(codes(d).includes('ContradictoryClosure'));
});

test('A7 判 hit 却不给 evidence → InvalidFieldType', () => {
  const d = base(); d.items = [{ id: 'k01', verdict: 'hit' }];
  assert.ok(codes(d).includes('InvalidFieldType'));
});

test('A8 检查项 id 未登记 → UnknownItem', () => {
  const d = base(); d.items = [{ id: 'k99', verdict: 'na', reason: 'x' }];
  assert.ok(codes(d).includes('UnknownItem'));
});

test('A9 evidence 写成字符串 "a.md:12"（旧伪装）→ InvalidFieldType', () => {
  const d = base(); d.items = [{ id: 'k01', verdict: 'hit', evidence: 'a.md:12' }];
  assert.ok(codes(d).includes('InvalidFieldType'));
});

test('A10 假证据：行号越界 → EvidenceLineOutOfRange', () => {
  const d = base();
  d.items = [{ id: 'k01', verdict: 'hit', evidence: { path: 'agents/detective-observer.md', line: 9999, quote: 'x' } }];
  assert.ok(codes(d, { resolveEvidence: {} }).includes('EvidenceLineOutOfRange'));
});

test('A11 假证据：行号对但引用不符 → EvidenceQuoteMismatch', () => {
  const d = base();
  d.items = [{ id: 'k01', verdict: 'hit', evidence: { path: 'agents/detective-observer.md', line: 40, quote: '完全不在这行的句子' } }];
  assert.ok(codes(d, { resolveEvidence: {} }).includes('EvidenceQuoteMismatch'));
});

test('A12 requires 用 mustHave 拼错 → UnknownField', () => {
  const r = checkPrerequisites([{ id: 'x', mustHave: true }], []);
  assert.ok(r.errors.some((e) => e.code === 'UnknownField'));
});

test('A13 requires 的 must 写成字符串 "false" → InvalidFieldType', () => {
  const r = checkPrerequisites([{ id: 'x', must: 'false' }], []);
  assert.ok(r.errors.some((e) => e.code === 'InvalidFieldType'));
});
