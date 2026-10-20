// rating.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { rateFromRecords } from './rating.mjs';

test('记录 ≥3 且零回归 → high', () => {
  assert.equal(rateFromRecords({ records: 3, zero: 3 }).level, 'high');
});
test('有记录但不全 → mid', () => {
  assert.equal(rateFromRecords({ records: 1, zero: 1 }).level, 'mid');
});
test('无记录 → low（必须完整验收）', () => {
  assert.equal(rateFromRecords({ records: 0, zero: 0 }).level, 'low');
});
test('N 阈值 = 3（§6 裁决）', () => {
  const N = 3;
  assert.equal(rateFromRecords({ records: 2, zero: 2 }).level, 'mid'); // 2 < 3 不足 high
});
