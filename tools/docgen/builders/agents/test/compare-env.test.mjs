import test from 'node:test';
import assert from 'node:assert/strict';
import { checkEnvironment } from '../components/compare.mjs';

// TC-027 单测落点：五个 violation 各一个只含单一违规的样本（顺序 = BOM → CR → INVALID_UTF8 → 尾换行）。
const SAMPLES = [
  ['CR', Buffer.from('a\r\nb\n', 'utf8')],
  ['NO_TRAILING_NEWLINE', Buffer.from('a', 'utf8')],
  ['BOM', Buffer.from([0xef, 0xbb, 0xbf, 0x0a])],
  ['INVALID_UTF8', Buffer.from([0xff, 0x0a])],
  ['TRAILING_NEWLINE', Buffer.from('a\n\n', 'utf8')],
];

test('TC-027：五个 violation 各命中一次（含 TRAILING_NEWLINE）', () => {
  for (const [violation, buf] of SAMPLES) {
    assert.throws(
      () => checkEnvironment(buf, 'target', 'agents/senior-sdet.md'),
      (e) => e.code === 'EnvironmentEOL' && e.violation === violation,
      `样本应命中 ${violation}`,
    );
  }
});

test('TC-027：generated 角色不预检（比对对象）', () => {
  for (const [, buf] of SAMPLES) assert.equal(checkEnvironment(buf, 'generated'), null);
});
