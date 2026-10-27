// 结构化产物：正反例 + 证据可解析（结构校验 / 读盘校验两种模式）
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateObservation, renderObservation, checkPrerequisites } from './checks.mjs';
import { MD_BANNER, MD_TITLE, MD_OPEN_SECTION, MD_NONE, MD_ITEMS_HEADER, MD_OPEN_HEADER } from './md-format.mjs';
import { IDS, docBase, evidenceLines, makeDir, rel } from './fixtures.mjs';

const tmp = makeDir();
test.after(() => tmp.dispose());

const EV = evidenceLines(tmp.dir, ['第一条真实观察行']);
const MISSING = `${rel(tmp.dir)}/does-not-exist.md`;

const ok = ({ items = null, ...over } = {}) => ({ ...docBase({ evidence: EV, items }), ...over });
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
  const d = ok({ open: [{ category: '判据口径', object: '§3.1', evidence: EV, impact: '不可判', suggestion: '改判据' }] });
  assert.ok(codes(d).includes('ContradictoryClosure'));
});

test('正例：open 非空 + closure=null → 无错误', () => {
  const d = ok({ open: [{ category: '判据口径', object: '§3.1', evidence: EV, impact: '不可判', suggestion: '改判据' }], closure: null });
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
  const fake = { path: MISSING, line: 1, quote: 'x' };
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
  assert.match(md, /覆盖度：已判 2 条 \/ 共 3 条/);
  assert.match(md, /§3\.1/);
  assert.doesNotMatch(md, /已覆盖全部/);
});

// —— 结构组：B01–B06 / B15 / B16（plan Task 10 Step 1；fixtures 已在文件顶部 import）——

const { dir, dispose } = makeDir();
test.after(dispose);
const ev = evidenceLines(dir, ['第一条真实观察行']);

const withItem = (patch) => docBase({ evidence: ev, items: [{ id: 'k01', verdict: 'hit', evidence: ev, ...patch }] });
const CASES = [
  ['B01 InvalidDocument', () => null, 'InvalidDocument'],
  ['B01 InvalidDocument 数组', () => [], 'InvalidDocument'],
  ['B01 InvalidDocument 字符串', () => 'x', 'InvalidDocument'],
  ['B02 MissingItems 缺失', () => ({ ...docBase({ evidence: ev }), items: undefined }), 'MissingItems'],
  ['B02 MissingItems 空数组', () => ({ ...docBase({ evidence: ev }), items: [] }), 'MissingItems'],
  ['B02 MissingItems 字符串', () => ({ ...docBase({ evidence: ev }), items: 'k01' }), 'MissingItems'],
  ['B03 MissingOpenField object', () => ({ ...docBase({ evidence: ev }), open: [{ category: '判据口径', impact: 'i', suggestion: 's', evidence: ev }] }), 'MissingOpenField'],
  ['B03 MissingOpenField impact', () => ({ ...docBase({ evidence: ev }), open: [{ category: '判据口径', object: 'o', suggestion: 's', evidence: ev }] }), 'MissingOpenField'],
  ['B03 MissingOpenField suggestion', () => ({ ...docBase({ evidence: ev }), open: [{ category: '判据口径', object: 'o', impact: 'i', evidence: ev }] }), 'MissingOpenField'],
  ['B04 MissingReason na 无 reason', () => docBase({ items: [{ id: 'k01', verdict: 'na' }] }), 'MissingReason'],
  ['B04 MissingReason na 空白', () => docBase({ items: [{ id: 'k01', verdict: 'na', reason: '  ' }] }), 'MissingReason'],
  ['B05 MissingReason miss 无 reason', () => docBase({ items: [{ id: 'k01', verdict: 'miss' }] }), 'MissingReason'],
  ['B06 UnknownClosure', () => ({ ...docBase({ evidence: ev }), closure: 'done' }), 'UnknownClosure'],
  ['B16 MissingEvidence', () => docBase({ items: [{ id: 'k01', verdict: 'hit' }] }), 'MissingEvidence', 'InvalidFieldType'],
  ['B16 InvalidFieldType', () => withItem({ evidence: 'not-an-object' }), 'InvalidFieldType', 'MissingEvidence'],
];

for (const [name, make, want, absent = null] of CASES) {
  test(name, () => {
    const codes = validateObservation(make(), { registeredIds: IDS }).errors.map((e) => e.code);
    assert.ok(codes.includes(want), `期望 ${want}，实得 ${JSON.stringify(codes)}`);
    // F011：两形态各补「不含另一码」——只钉「有目标码」时，两码互相顶替也能混过
    for (const a of absent ? [].concat(absent) : []) {
      assert.ok(!codes.includes(a), `不应出现 ${a}，实得 ${JSON.stringify(codes)}`);
    }
  });
}

// F001 同批变体：open 五列缺 category / 缺 evidence 都必须归 MissingOpenField，不得混进 InvalidFieldType
test('B03 变体：open 缺 category → MissingOpenField（且不报 InvalidFieldType）', () => {
  const d = { ...docBase({ evidence: ev }), closure: null, open: [{ object: 'o', impact: 'i', suggestion: 's', evidence: ev }] };
  const codes = validateObservation(d, { registeredIds: IDS }).errors.map((e) => e.code);
  assert.ok(codes.includes('MissingOpenField'), JSON.stringify(codes));
  assert.ok(!codes.includes('InvalidFieldType'), JSON.stringify(codes));
});

test('B03 变体：open 缺 evidence → MissingOpenField（且不报 InvalidFieldType）', () => {
  const d = { ...docBase({ evidence: ev }), closure: null, open: [{ category: '判据口径', object: 'o', impact: 'i', suggestion: 's' }] };
  const codes = validateObservation(d, { registeredIds: IDS }).errors.map((e) => e.code);
  assert.ok(codes.includes('MissingOpenField'), JSON.stringify(codes));
  assert.ok(!codes.includes('InvalidFieldType'), JSON.stringify(codes));
});

test('B15 UnregisteredIdsMissing（不传 registeredIds）', () => {
  const codes = validateObservation(docBase({ evidence: ev })).errors.map((e) => e.code);
  assert.ok(codes.includes('UnregisteredIdsMissing'), JSON.stringify(codes));
});

// —— 契约补齐：instance 枚举 / requires 非对象项 / 结论由 open 派生 ——

test('instance 枚举：C 与数字 → InvalidFieldType（PRD §4.1）', () => {
  assert.ok(codes(ok({ instance: 'C' })).includes('InvalidFieldType'));
  assert.ok(codes(ok({ instance: 123 })).includes('InvalidFieldType'));
});

test('instance 枚举正例：null / A / B → 零错误', () => {
  for (const instance of [null, 'A', 'B']) {
    assert.deepEqual(codes(ok({ instance })), [], `instance=${String(instance)}`);
  }
});

test('requires 非对象项（null / 字符串）→ InvalidFieldType，且不抛 TypeError', () => {
  for (const bad of [[null], ['x'], [[]]]) {
    const r = checkPrerequisites(bad, []);
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => e.code === 'InvalidFieldType'), JSON.stringify(r.errors));
  }
});

test('渲染：open 为空 + closure=null → 结论不得声称「有补充项」', () => {
  const md = renderObservation(docBase({ evidence: EV, open: [], closure: null }));
  assert.match(md, /结论：无补充项/);
  assert.doesNotMatch(md, /有补充项/);
});

test('closure=blocked + open 非空 → 零错误（阻塞态正例）', () => {
  const d = ok({ open: [{ category: '判据口径', object: '§3.1', evidence: EV, impact: 'x', suggestion: 'y' }], closure: 'blocked' });
  assert.deepEqual(codes(d), []);
});

// 骨架单一来源的漂移守卫：渲染输出必须真的用到这些常量——否则「改格式忘改常量」时，
// 校验侧会一直拿旧常量去匹配（假绿），而这条会先红。
test('骨架常量与渲染输出同源（改格式必须同批改 md-format.mjs）', () => {
  const closed = renderObservation(docBase({ evidence: EV, open: [], closure: null }));
  for (const line of [MD_BANNER, MD_TITLE, MD_OPEN_SECTION, MD_NONE, MD_ITEMS_HEADER]) {
    assert.ok(closed.includes(line), `渲染输出缺骨架行：${line}`);
  }
  const withOpen = renderObservation(docBase({ evidence: EV, open: [{ category: 'c', object: 'o', impact: 'i', suggestion: 's', evidence: EV }], closure: null }));
  assert.ok(withOpen.includes(MD_OPEN_HEADER), `渲染输出缺骨架行：${MD_OPEN_HEADER}`);
});
