// 对抗用例（JSON 版）：结构化攻击 + 假证据
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitRow } from '../execution-matrix/markdown-rows.mjs';
import { validateArtifact, writeObservation } from './artifact.mjs';
import { validateObservation, checkPrerequisites, renderObservation, checkRendered } from './checks.mjs';
import { checkEvidence } from './evidence.mjs';
import { IDS, docBase, evidenceLines, makeDir } from './fixtures.mjs';

const tmp = makeDir();
test.after(() => tmp.dispose());

const EV_LINES = ['第一行真实观察内容', '第二行真实观察内容'];
const EV = evidenceLines(tmp.dir, EV_LINES);
// 越界行号以磁盘实际行数为基准（evidenceLines 末尾补一个换行，实际行数 = 内容行数 + 1）
const EV_FILE_LINES = readFileSync(join(tmp.dir, 'ev.md'), 'utf8').split(/\r?\n/).length;
const base = () => ({ ...docBase({ evidence: EV, items: [{ id: 'k01', verdict: 'na', reason: '本轮无卡' }] }) });
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
  d.open = [{ category: '判据口径', object: '§3.1', evidence: '   ', impact: 'x', suggestion: 'y' }];
  assert.ok(codes(d).includes('InvalidFieldType'));
});

test('A5 verdict 写成 "N/A" → UnknownVerdict', () => {
  const d = base(); d.items = [{ id: 'k01', verdict: 'N/A' }];
  assert.ok(codes(d).includes('UnknownVerdict'));
});

test('A6 open 非空 + closure 声明 no-findings → ContradictoryClosure', () => {
  const d = base();
  d.open = [{ category: '判据口径', object: '§3.1', evidence: EV, impact: 'x', suggestion: 'y' }];
  assert.ok(codes(d).includes('ContradictoryClosure'));
});

test('A7 判 hit 却不给 evidence → MissingEvidence', () => {
  const d = base(); d.items = [{ id: 'k01', verdict: 'hit' }];
  assert.ok(codes(d).includes('MissingEvidence'));
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
  d.items = [{ id: 'k01', verdict: 'hit', evidence: { path: EV.path, line: EV_FILE_LINES + 1, quote: EV.quote } }];
  assert.ok(codes(d, { resolveEvidence: {} }).includes('EvidenceLineOutOfRange'));
});

test('A11 假证据：行号对但引用不符 → EvidenceQuoteMismatch', () => {
  const d = base();
  d.items = [{ id: 'k01', verdict: 'hit', evidence: { path: EV.path, line: 1, quote: '完全不在这行的句子' } }];
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

// ============ H 组：对抗与边界钉 ============
const DIR = dirname(fileURLToPath(import.meta.url));
const hdir = makeDir();
test.after(hdir.dispose);
const hEv = evidenceLines(hdir.dir, ['第一条真实观察行', '第二条真实观察行']);
const codesH = (doc, opt = {}) => validateObservation(doc, { registeredIds: IDS, ...opt }).errors.map((e) => e.code);
const hBase = () => docBase({ evidence: hEv });
const V = (id, name, testName, expect, run, named = false) => ({ id, name, testName, expect, run, named });

// 对抗分母唯一取数源（PRD §0.5 Q-A-05 闭合载体）：8 具名 + 13 迁入 + 9 新增 = 30
const ATTACK_VECTORS = [
  // ① 具名 8 条（探索稿 :666 原清单的结构化映射）
  V('n01', '代码块藏字段', 'B02 MissingItems', ['MissingItems'], () => codesH({ ...hBase(), items: undefined }), true),
  V('n02', '覆盖度写「无」（两构造）', 'A1 coverage.read 伪装成', ['MissingCoverage', 'InvalidCoverage'], () => {
    const s = hBase(); s.coverage = '无';
    const t = hBase(); t.coverage.read = '4';
    return [...codesH(s), ...codesH(t)];
  }, true),
  V('n03', '列表式补充项（两构造）', 'A3 open 用对象代替数组', ['InvalidFieldType'], () => {
    const s = hBase(); s.open = { object: '§3.1' };
    const t = hBase(); t.open = [{ category: '判据口径', object: 'o', impact: 'i', suggestion: 's', evidence: '   ' }];
    return [...codesH(s), ...codesH(t)];
  }, true),
  V('n04', '标题变体（id 换未登记变体 k09）', 'A8 检查项 id 未登记', ['UnknownItem'], () => {
    const d = hBase();
    d.items = [{ id: 'k09', verdict: 'na', reason: 'x' }, { id: 'k01', verdict: 'na', reason: 'y' }];
    d.coverage = { read: 2, total: 3, skipped: ['k02', 'k03'] };
    return codesH(d);
  }, true),
  V('n05', '全角竖线（内容不转义、不破列）', 'D03 竖线转义后表格行列数', [], () => {
    const d = hBase();
    d.open = [{ category: '判据口径', object: '筛｜关键', impact: 'i', suggestion: 's', evidence: hEv }];
    d.closure = null;
    return codesH(d);
  }, true),
  V('n06', '结论换说法（verdict N/A）', 'A5 verdict 写成', ['UnknownVerdict'], () => {
    const d = hBase();
    d.items = [{ id: 'k01', verdict: 'N/A' }];
    d.coverage = { read: 1, total: 3, skipped: ['k02', 'k03'] };
    return codesH(d);
  }, true),
  V('n07', 'mustHave 拼错', 'A12 requires 用 mustHave 拼错', ['UnknownField'], () => checkPrerequisites([{ id: 'x', mustHave: true }], []).errors.map((e) => e.code), true),
  V('n08', 'must 写成字符串', 'A13 requires 的 must 写成字符串', ['InvalidFieldType'], () => checkPrerequisites([{ id: 'x', must: 'false' }], []).errors.map((e) => e.code), true),

  // ② 迁入 13 条（A1–A13 结构化对抗）
  V('m01', 'coverage.read 字符串伪装', 'A1 coverage.read 伪装成', ['InvalidCoverage'], () => { const d = hBase(); d.coverage.read = '4'; return codesH(d); }),
  V('m02', 'coverage.total = 0 空集伪装', 'A2 coverage.total = 0', ['InvalidCoverage'], () => { const d = hBase(); d.coverage.total = 0; return codesH(d); }),
  V('m03', 'open 用对象代替数组', 'A3 open 用对象代替数组', ['InvalidFieldType'], () => { const d = hBase(); d.open = { object: '§3.1' }; return codesH(d); }),
  V('m04', 'open 项 evidence 全空白', 'A4 open 项 evidence', ['InvalidFieldType'], () => { const d = hBase(); d.open = [{ category: '判据口径', object: '§3.1', impact: 'x', suggestion: 'y', evidence: '   ' }]; return codesH(d); }),
  V('m05', 'verdict 写成 N/A', 'A5 verdict 写成', ['UnknownVerdict'], () => { const d = hBase(); d.items = [{ id: 'k01', verdict: 'N/A' }]; d.coverage = { read: 1, total: 3, skipped: ['k02', 'k03'] }; return codesH(d); }),
  V('m06', 'open 非空 + closure no-findings', 'A6 open 非空 + closure 声明', ['ContradictoryClosure'], () => { const d = hBase(); d.open = [{ category: '判据口径', object: '§3.1', impact: 'x', suggestion: 'y', evidence: hEv }]; return codesH(d); }),
  V('m07', '判 hit 却不给 evidence', 'A7 判 hit 却不给 evidence', ['MissingEvidence'], () => { const d = hBase(); d.items = [{ id: 'k01', verdict: 'hit' }]; d.coverage = { read: 1, total: 3, skipped: ['k02', 'k03'] }; return codesH(d); }),
  V('m08', '检查项 id 未登记', 'A8 检查项 id 未登记', ['UnknownItem'], () => { const d = hBase(); d.items = [{ id: 'k99', verdict: 'na', reason: 'x' }]; d.coverage = { read: 1, total: 3, skipped: ['k01', 'k02', 'k03'].filter((x) => x !== 'k99') }; return codesH(d); }),
  V('m09', 'evidence 写成字符串', 'A9 evidence 写成字符串', ['InvalidFieldType'], () => { const d = hBase(); d.items = [{ id: 'k01', verdict: 'hit', evidence: 'a.md:12' }]; d.coverage = { read: 1, total: 3, skipped: ['k02', 'k03'] }; return codesH(d); }),
  V('m10', '假证据：行号越界', 'A10 假证据：行号越界', ['EvidenceLineOutOfRange'], () => { const d = hBase(); d.items = [{ id: 'k01', verdict: 'hit', evidence: { ...hEv, line: 9999 } }]; d.coverage = { read: 1, total: 3, skipped: ['k02', 'k03'] }; return codesH(d, { resolveEvidence: true }); }),
  V('m11', '假证据：引用不符', 'A11 假证据：行号对但引用不符', ['EvidenceQuoteMismatch'], () => { const d = hBase(); d.items = [{ id: 'k01', verdict: 'hit', evidence: { ...hEv, line: 1, quote: '文件里没有这句' } }]; d.coverage = { read: 1, total: 3, skipped: ['k02', 'k03'] }; return codesH(d, { resolveEvidence: true }); }),
  V('m12', 'requires 用 mustHave 拼错', 'A12 requires 用 mustHave 拼错', ['UnknownField'], () => checkPrerequisites([{ id: 'x', mustHave: true }], []).errors.map((e) => e.code)),
  V('m13', 'must 写成字符串', 'A13 requires 的 must 写成字符串', ['InvalidFieldType'], () => checkPrerequisites([{ id: 'x', must: 'false' }], []).errors.map((e) => e.code)),

  // ③ 新增 9 条（C 组 3 + B 组 6）
  V('x01', '敏感路径 .env', 'C01 EvidenceSensitivePath', ['EvidenceSensitivePath'], () => [checkEvidence(evidenceLines(hdir.dir, ['内容足够长的真实观察行'], { name: '.env' })).code]),
  // override O1：夹具名不得用 secrets.md（会先命中第 6 道敏感路径判据，走不到第 7 道引用内容判据）
  V('x02', '敏感内容 AKIA', 'C04 EvidenceQuoteSensitive', ['EvidenceQuoteSensitive'], () => [checkEvidence(evidenceLines(hdir.dir, ['AKIAIOSFODNN7EXAMPLE'], { name: 'quotes.md' })).code]),
  V('x03', '纯结构行', 'C07 纯结构行不可作证据', ['EvidenceStructuralRow'], () => [checkEvidence(evidenceLines(hdir.dir, ['| --- | --- | --- |'], { name: 'struct.md' })).code]),
  V('x04', 'items.id 重复', 'B07 DuplicateItem', ['DuplicateItem'], () => { const d = hBase(); d.items = [...d.items, { id: 'k01', verdict: 'na', reason: '重了' }]; d.coverage = { read: 3, total: 3, skipped: [] }; return codesH(d); }),
  V('x05', 'items.length ≠ read', 'B08 CoverageMismatch', ['CoverageMismatch'], () => { const d = hBase(); d.coverage.read = 1; return codesH(d); }),
  V('x06', 'total ≠ registeredIds.length', 'B09 CoverageMismatch', ['CoverageMismatch'], () => { const d = hBase(); d.coverage.total = 2; return codesH(d); }),
  V('x07', 'read + skipped ≠ total', 'B10 CoverageMismatch', ['CoverageMismatch'], () => { const d = hBase(); d.coverage.skipped = []; return codesH(d); }),
  V('x08', 'skipped 含未登记 id', 'B11 CoverageMismatch', ['CoverageMismatch'], () => { const d = hBase(); d.coverage.skipped = ['k99']; return codesH(d); }),
  V('x09', 'items ∩ skipped ≠ ∅', 'B12 CoverageMismatch', ['CoverageMismatch'], () => {
    const d = hBase();
    d.items = [{ id: 'k01', verdict: 'hit', evidence: hEv }];
    d.coverage = { read: 1, total: 3, skipped: ['k01', 'k02'] };
    return codesH(d);
  }),
];

// F014：`expect: []` 时 every() 恒 true → missed 恒 false，分母虚胖（n05 从未参与判定）。
// 空 expect 的语义是「此向量不该出现任何码」：出现任何码即「漏拦/虚胖」。非空 expect 保持原逻辑。
const missed = (v) => {
  const c = v.run();
  if (v.expect.length === 0) return c.length !== 0;
  return !v.expect.every((code) => c.includes(code));
};

// 按连续 `|` 行块分组（override O2）：渲染产物有两张列数不同的表（items 3 列 / open 4 列），
// 逐块与本块首行比列数，不能拿第一张表的表头宽去要求全 md
const splitBlocks = (md) => {
  const out = [];
  let cur = [];
  for (const l of md.split('\n')) {
    if (l.startsWith('|')) cur.push(l);
    else if (cur.length) { out.push(cur); cur = []; }
  }
  if (cur.length) out.push(cur);
  return out;
};

test('H01 八条具名攻击的结构化映射（0/8 绕过）', () => {
  const named = ATTACK_VECTORS.filter((v) => v.named);
  assert.equal(named.length, 8);
  assert.deepEqual(named.filter(missed).map((v) => v.id), [], '绕过的向量');
  // 第 5 行姊妹断言：全角竖线是内容，不转义且不破列
  const d = hBase();
  d.open = [{ object: '筛｜关键', impact: 'i', suggestion: 's', evidence: hEv }];
  d.closure = null;
  const md = renderObservation(d);
  const rows = md.split('\n').filter((l) => l.startsWith('|'));
  assert.ok(rows.some((l) => l.includes('筛｜关键')));
  for (const block of splitBlocks(md)) {
    const w = splitRow(block[0]).length;
    assert.ok(block.every((l) => splitRow(l).length === w), block.join('\n'));
  }
});

test('H02 对抗分母唯一口径：30 条登记向量 + 承接可检索 + 0 绕过', () => {
  assert.equal(ATTACK_VECTORS.length, 30);
  assert.equal(new Set(ATTACK_VECTORS.map((v) => v.id)).size, 30);
  // 承接检索：全部 *.test.mjs；本文件只剔除 ATTACK_VECTORS 表本身（以 `V('` 开头的行），
  // 保留本文件里 A1–A13 的 test 声明——否则常量里的字符串自匹配会让检查空转，
  // 而排除整文件又会把 13 条迁入向量的承接测试一起排除（同样空转）。
  const selfSrc = readFileSync(join(DIR, 'adversarial.test.mjs'), 'utf8')
    .split('\n')
    .filter((l) => !l.includes("V('"))
    .join('\n');
  const others = readdirSync(DIR)
    .filter((f) => f.endsWith('.test.mjs') && f !== 'adversarial.test.mjs')
    .map((f) => readFileSync(join(DIR, f), 'utf8'));
  const corpus = [selfSrc, ...others].join('\n');
  assert.deepEqual(ATTACK_VECTORS.filter((v) => !corpus.includes(v.testName)).map((v) => v.id), [], '承接测试检索不到');
  assert.deepEqual(ATTACK_VECTORS.filter(missed).map((v) => v.id), [], '绕过的向量');
});

test('H03 边界钉：json+md 一起改成一致 → 校验过（本机无锚）', () => {
  const t = makeDir();
  try {
    const d = docBase({ evidence: hEv });
    assert.equal(writeObservation(d, { jsonDir: t.dir, registeredIds: IDS }).ok, true);
    const jp = join(t.dir, 'observation-r3.json');
    const mp = join(t.dir, 'observation-r3.md');
    const doc = JSON.parse(readFileSync(jp, 'utf8'));
    doc.items[1] = { id: 'k02', verdict: 'miss', reason: '改口径后未命中' };
    writeFileSync(jp, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
    writeFileSync(mp, renderObservation(doc), 'utf8');
    assert.deepEqual(validateArtifact(jp, { registeredIds: IDS }).errors, []);
    assert.equal(checkRendered(doc, readFileSync(mp, 'utf8')).ok, true);
  } finally { t.dispose(); }
});

test('H04 边界钉：quote 真实但不支撑结论 → 校验过（语义归审计人）', () => {
  const f = makeDir();
  const t = makeDir();
  try {
    const e = evidenceLines(f.dir, ['角色设定', '边界声明'], { name: 'ctx.md', line: 1 });
    assert.equal(writeObservation(docBase({ evidence: e }), { jsonDir: t.dir, registeredIds: IDS }).ok, true);
    assert.deepEqual(validateArtifact(join(t.dir, 'observation-r3.json'), { registeredIds: IDS }).errors, []);
  } finally { f.dispose(); t.dispose(); }
});
