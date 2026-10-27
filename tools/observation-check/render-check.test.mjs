// md 与 json 分叉校验：md 必须等于 json 的渲染结果
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderObservation, checkRendered } from './checks.mjs';

const EV = { path: 'agents/detective-observer.md', line: 7, quote: '# 角色：侦探' };
const doc = () => ({
  round: 3,
  items: [
    { id: 'k01', verdict: 'na', reason: '本轮没有被审卡' },
    { id: 'k02', verdict: 'hit', evidence: EV },
  ],
  open: [{ object: '§3.1', evidence: EV, impact: '不可判', suggestion: '改判据' }],
  coverage: { read: 4, total: 4, skipped: [] },
  closure: null,
});

test('正例：md 就是渲染结果 → ok', () => {
  const d = doc();
  const r = checkRendered(d, renderObservation(d));
  assert.equal(r.ok, true);
});

test('正例：CRLF 与行尾空格不误报', () => {
  const d = doc();
  const md = renderObservation(d).replace(/\n/g, '\r\n').replace(/。$/m, '。   ');
  assert.equal(checkRendered(d, md).ok, true);
});

test('反例：手改一个结论字 → RenderMismatch', () => {
  const d = doc();
  const md = renderObservation(d).replace('不适用', '未命中');
  const r = checkRendered(d, md);
  assert.equal(r.code, 'RenderMismatch');
});

test('反例：手改覆盖度数字 → RenderMismatch', () => {
  const d = doc();
  const md = renderObservation(d).replace('读 4 部分', '读 1 部分');
  assert.equal(checkRendered(d, md).code, 'RenderMismatch');
});

test('反例：手删一行补充项 → RenderMismatch', () => {
  const d = doc();
  const md = renderObservation(d)
    .split('\n')
    .filter((l) => !l.includes('§3.1'))
    .join('\n');
  assert.equal(checkRendered(d, md).code, 'RenderMismatch');
});

test('反例：md 为空 → RenderMismatch', () => {
  assert.equal(checkRendered(doc(), '').code, 'RenderMismatch');
});

test('报错要能定位到行号', () => {
  const d = doc();
  const md = renderObservation(d).replace('不适用', '未命中');
  const r = checkRendered(d, md);
  assert.match(r.detail, /第 \d+ 行/);
});
