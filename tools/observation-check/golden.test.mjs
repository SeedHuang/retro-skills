// ⚠️ 本夹具 golden/observation-r3.json 是【渲染夹具】，不是合法产物：
//   - 其 evidence.path/line/quote 与真实文件内容不对应（例如 docs/prd/…:337 实际是「**A 表：已实现（测试状态见下注）**」而非「§4.4 A 表」）；
//   - coverage.total（= 4）与 REGISTERED_IDS 长度（= 3，见 registered-ids.mjs:5）不等。
//   因此【禁止】把 observation-r3.json 用于 validateObservation / validateArtifact / CLI 校验模式：
//   那样会得到 EvidenceQuoteMismatch / CoverageMismatch —— 这是夹具构造使然，不是缺陷。
//   本文件只做渲染比对（checkRendered），不读盘校验。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkRendered } from './checks.mjs';

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'golden');
const DOC = JSON.parse(readFileSync(join(DIR, 'observation-r3.json'), 'utf8'));
const EXPECTED = readFileSync(join(DIR, 'observation-r3.expected.md'), 'utf8');

test('D05 golden 全文断言：renderObservation === expected.md', () => {
  const r = checkRendered(DOC, EXPECTED);
  assert.equal(r.ok, true, r.detail);
});

test('D06 golden 形态覆盖判别力（三态 + open + skipped）', () => {
  const verdicts = new Set(DOC.items.map((i) => i.verdict));
  const missing = [];
  if (!['hit', 'miss', 'na'].every((v) => verdicts.has(v))) missing.push(`verdict 缺：${[...verdicts].join(',')}`);
  if (!(DOC.open.length >= 1)) missing.push('open 为空');
  if (!(DOC.coverage.skipped.length >= 1)) missing.push('skipped 为空');
  assert.deepEqual(missing, []);
  assert.ok(EXPECTED.includes('未找到对应判据行'));
  assert.ok(EXPECTED.includes('C07 码名归属'));
  assert.ok(EXPECTED.includes('跳过 1：k04'));
});

test('D07 golden 判别力反例：expected 改一字必红且定位到行号', () => {
  const lines = EXPECTED.split(/\r?\n/);
  const i = lines.findIndex((l) => l.includes(':337'));
  assert.ok(i >= 0, 'expected.md 无 :337 行');
  lines[i] = lines[i].replace(':337', ':338');
  const r = checkRendered(DOC, lines.join('\n'));
  assert.equal(r.ok, false);
  assert.ok(r.detail.includes(`第 ${i + 1} 行`), r.detail);
});
