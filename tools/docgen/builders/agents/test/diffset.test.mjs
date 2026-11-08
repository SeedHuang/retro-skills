import test from 'node:test';
import assert from 'node:assert/strict';
import { diffSet } from '../components/compare.mjs';

const NL = '\n';
const buf = (rows) => Buffer.from(rows.join(NL) + NL, 'utf8');
const OLD = '> 来源：旧';
const NEW = '> 来源：新';
const IGN = [OLD, NEW];

// 两个「缺陷实现」只在本测试内存在，不改产品代码：
// index-skip = 把某个行号无条件当来源行跳过（不比较内容）；prefix-skip = 所有 `>` 开头行一律放行。
const indexSkip = (a, b, ignorable, skipIdx) =>
  diffSet(a, b, ignorable).raw.filter((d) => d.index !== skipIdx && !ignorable.includes(d.line));
const prefixSkip = (a, b, ignorable) =>
  diffSet(a, b, ignorable).raw.filter((d) => !ignorable.includes(d.line) && !(d.line ?? '').startsWith('>'));

test('样本 A：正文在 index 8 → content-match 检出；index-skip 漏检', () => {
  const expected = ['---', 'name: x', 'description: d', 'tools: Read', '---', '', '# 角色：x', '', '正文 A', OLD, '尾'];
  const actual = ['---', 'name: x', 'description: d', 'tools: Read', '---', '', '# 角色：x', '', '正文 A 改', NEW, '尾'];
  const r = diffSet(buf(actual), buf(expected), IGN);
  assert.deepEqual(r.raw.map((d) => d.index), [8, 9]);
  assert.equal(r.raw[1].line, OLD); // line 记期望侧（快照）
  assert.deepEqual(r.unallowed.map((d) => d.index), [8]);
  assert.deepEqual(indexSkip(buf(actual), buf(expected), IGN, 8), []); // 漏检 → 该缺陷实现不可接受
  assert.deepEqual(prefixSkip(buf(actual), buf(expected), IGN).map((d) => d.index), [8]); // 本样本不针对 prefix
});

test('样本 B：`>` 开头的说明行在 index 2 → content-match 检出；prefix-skip 漏检', () => {
  const expected = ['a', 'b', '> 说明：手写', 'c', 'd', 'e', 'f', 'g', 'h', OLD, '尾'];
  const actual = ['a', 'b', '> 说明：docgen', 'c', 'd', 'e', 'f', 'g', 'h', NEW, '尾'];
  const r = diffSet(buf(actual), buf(expected), IGN);
  assert.deepEqual(r.unallowed.map((d) => d.index), [2]);
  assert.deepEqual(prefixSkip(buf(actual), buf(expected), IGN), []); // 漏检 → 该缺陷实现不可接受
  assert.deepEqual(indexSkip(buf(actual), buf(expected), IGN, 8).map((d) => d.index), [2]); // 本样本不针对 index
});

test('line 口径：期望侧无该行时记 null（实际侧多行）', () => {
  const expected = Buffer.from(['a', 'b'].join(NL), 'utf8');
  const actual = Buffer.from(['a', 'b', '多出来的一行'].join(NL), 'utf8');
  const r = diffSet(actual, expected, []);
  assert.deepEqual(r.raw, [{ index: 2, line: null }]);
  assert.deepEqual(r.unallowed, [{ index: 2, line: null }]);
});
