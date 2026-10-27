// md 与 json 分叉校验：md 必须等于 json 的渲染结果
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderObservation, checkRendered, findBrokenTable } from './checks.mjs';
import { writeObservation, validateArtifact } from './artifact.mjs';
import { docBase, evidenceLines, makeDir, IDS } from './fixtures.mjs';
import { splitRow } from '../execution-matrix/markdown-rows.mjs';

const tmp = makeDir();
test.after(() => tmp.dispose());

const EV = evidenceLines(tmp.dir, ['第一条真实观察行']);
const doc = () => docBase({
  evidence: EV,
  items: [
    { id: 'k01', verdict: 'na', reason: '本轮没有被审卡' },
    { id: 'k02', verdict: 'hit', evidence: EV },
  ],
  open: [{ object: '§3.1', evidence: EV, impact: '不可判', suggestion: '改判据' }],
  closure: null,
});

test('正例：md 就是渲染结果 → ok', () => {
  const d = doc();
  const r = checkRendered(d, renderObservation(d));
  assert.equal(r.ok, true);
});

test('正例：CRLF 与行尾空格不误报', () => {
  const d = doc();
  // F013：原写法 replace(/。$/m,'。   ') 在本 md 上没有「。结尾行」→ 空格从未注入，等于空转。
  // 改为逐行真注入（同时保留 CRLF 归一意图）：去行尾空白的归一失效时本条必红。
  const md = renderObservation(d).split('\n').map((l) => l + '   ').join('\r\n');
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
  const md = renderObservation(d).replace('已判 2 条', '已判 1 条');
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

// ── D 组：渲染最小信息集与竖线转义（D01–D04 / D08）──
const rdir = makeDir();
test.after(rdir.dispose);

// 产物里有**两张列数不同的表**（items 3 列 / open 4 列）：按「连续 | 行块」分组，每组与本块首行比
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

test('D01 hit 行含 path:line、全 md 无 [object Object]', () => {
  const md = renderObservation(docBase({ evidence: { path: 'fixtures/ev.md', line: 3, quote: '真实引用' } }));
  assert.match(md, /fixtures\/ev\.md:3/);
  assert.ok(!md.includes('[object Object]'));
});

test('D02 open 行含 evidence 的 path 与 line', () => {
  const ev = { path: 'fixtures/open.md', line: 9, quote: '真实引用' };
  const md = renderObservation(docBase({ evidence: evidenceLines(rdir.dir, ['第一条真实观察行']), open: [{ object: '甲乙结论句', impact: 'i', suggestion: 's', evidence: ev }] }));
  const row = md.split('\n').find((l) => l.includes('甲乙结论句'));
  assert.ok(row.includes(ev.path) && row.includes(String(ev.line)), row);
});

test('D03 竖线转义后表格行列数 = 表头列数', () => {
  const md = renderObservation(docBase({
    evidence: evidenceLines(rdir.dir, ['第一条真实观察行']),
    items: [{ id: 'k01', verdict: 'na', reason: 'A || B' }],
    open: [{ object: '筛 | 关键', impact: 'i', suggestion: 's', evidence: evidenceLines(rdir.dir, ['第一条真实观察行'], { name: 'o.md' }) }],
  }));
  assert.ok(md.includes('筛 \\| 关键'));
  for (const block of splitBlocks(md)) {
    const w = splitRow(block[0]).length;
    assert.ok(block.every((l) => splitRow(l).length === w), block.join('\n'));
  }
});

test('D09 多行字段不断表：reason / impact 的换行渲染为 <br>，列数不变', () => {
  const md = renderObservation(docBase({
    evidence: evidenceLines(rdir.dir, ['第一条真实观察行']),
    items: [{ id: 'k01', verdict: 'miss', reason: '第一句\n第二句' }],
    open: [{ object: 'o', evidence: evidenceLines(rdir.dir, ['第一条真实观察行'], { name: 'multi.md' }), impact: '影响一\n影响二', suggestion: 's' }],
    closure: null,
  }));
  assert.ok(md.includes('第一句<br>第二句'), md);
  assert.ok(md.includes('影响一<br>影响二'), md);
  // 换行若未转义会留下孤行（不以 | 开头、也不属于骨架行）——逐块比列数看不出它，故单独钉
  const orphans = md.split('\n').filter((l) => l.trim() && !l.startsWith('|') && !/^(#|<!--|覆盖度：|结论：|无。)/.test(l));
  assert.deepEqual(orphans, []);
  for (const block of splitBlocks(md)) {
    const w = splitRow(block[0]).length;
    assert.ok(block.every((l) => splitRow(l).length === w), block.join('\n'));
  }
});

// D10 / D11：转义必须与 splitRow 互逆——反斜杠与反引号漏转义时，合法字段会被切出多余列
const BS = String.fromCharCode(92);
const colsOk = (md) => {
  const rows = md.split('\n').filter((l) => l.startsWith('|'));
  const w = splitRow(rows[0]).length;
  assert.deepEqual(rows.filter((l) => splitRow(l).length !== w), [], md);
};

test('D10 反斜杠 + 竖线（a\\|b）转义可逆：列数 = 表头列数', () => {
  const reason = `a${BS}|b`;
  const doc = docBase({ evidence: evidenceLines(rdir.dir, ['第一条真实观察行']), items: [{ id: 'k01', verdict: 'miss', reason }], closure: null });
  const md = renderObservation(doc);
  colsOk(md);
  assert.equal(checkRendered(doc, md).ok, true);
});

test('D11 反引号字段不吞列：列数 = 表头列数', () => {
  const doc = docBase({ evidence: evidenceLines(rdir.dir, ['第一条真实观察行']), items: [{ id: 'k01', verdict: 'miss', reason: '见 `a|b` 片段' }], closure: null });
  colsOk(renderObservation(doc));
});

test('D12 findBrokenTable 判别力：手造多一列 → 定位到行号', () => {
  assert.deepEqual(findBrokenTable(['| a | b |', '|---|---|', '| 1 | 2 | 3 |'].join('\n')), { line: 3, want: 2, got: 3 });
  assert.equal(findBrokenTable(['| a | b |', '|---|---|', '| 1 | 2 |'].join('\n')), null);
});

test('D13 findBrokenTable 不吃围栏内的表骨架，且认行首空格的表（与 check-all 同口径）', () => {
  const fenced = ['```', '| a | b |', '|---|---|', '| 1 |', '```'].join('\n');
  assert.equal(findBrokenTable(fenced), null);
  assert.deepEqual(findBrokenTable(['  | a | b |', '  |---|---|', '  | 1 | 2 | 3 |'].join('\n')), { line: 3, want: 2, got: 3 });
});

test('D04 含 \\| 的合法产物全链路绿', () => {
  const d = makeDir();
  try {
    const doc = docBase({ evidence: evidenceLines(d.dir, ['第一条真实观察行']), closure: null, open: [{ category: '判据口径', object: '筛 | 关键', impact: 'i', suggestion: 's', evidence: evidenceLines(d.dir, ['第一条真实观察行'], { name: 'o.md' }) }] });
    const w = writeObservation(doc, { jsonDir: d.dir, registeredIds: IDS });
    assert.equal(w.ok, true, JSON.stringify(w));
    const r = validateArtifact(join(d.dir, 'observation-r3.json'), { registeredIds: IDS });
    assert.deepEqual(r.errors, []);
    assert.ok(readFileSync(join(d.dir, 'observation-r3.md'), 'utf8').includes('筛 \\| 关键'));
  } finally { d.dispose(); }
});

test('D08 覆盖度文案：已判 N 条 / 共 M 条（跳过 K：…）', () => {
  const md = renderObservation(docBase({ evidence: evidenceLines(rdir.dir, ['第一条真实观察行']) }));
  assert.ok(md.includes('已判 2 条 / 共 3 条'));
  assert.ok(md.includes('跳过 1：k03'));
});
