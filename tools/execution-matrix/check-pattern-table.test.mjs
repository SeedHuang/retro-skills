// check-pattern-table.test.mjs —— 模式表守卫：种子数 ≥5、来源可复算、判据正文不含模式表行内容
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkPatternTable, parsePatternTable, parseSource, PATTERN_TABLE } from './check-pattern-table.mjs';

test('模式表种子 ≥5 行且全部检查通过', () => {
  const { ok, findings, rows } = checkPatternTable();
  assert.ok(rows.length >= 5, `种子行数 ${rows.length} < 5`);
  assert.equal(ok, true, JSON.stringify(findings));
});

test('每行来源 = 文件:行号 形态，可解析', () => {
  const { rows } = checkPatternTable();
  for (const row of rows) {
    const src = parseSource(row.source);
    assert.ok(src, `来源不可解析：${row.source}`);
    assert.ok(src.file.length > 0);
    assert.ok(src.start >= 1);
  }
});

// —— 负例：守卫读盘，必须真写临时模式表才能触发对应 finding（构造卡不可只测解析器）——

const REPO_COLON = '`tools/execution-matrix/pattern-table.md:1`';
const rowOf = (scenario, source) => `| ${scenario} | 好——${scenario} | 坏——${scenario} | ${source} | 3 | 3 |`;

function withTempTable(rows, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'pattern-table-'));
  try {
    const p = join(dir, 'pattern-table.md');
    writeFileSync(p, [
      '| 场景 | 好 | 不好 | 来源（文件:行号） | 实测记录数 | 最近 N 次零回归 |',
      '|---|---|---|---|---|---|',
      ...rows,
    ].join('\n'), 'utf8');
    return fn(p);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('parseSource 解析口径：`文件:行号` 与 `文件:起-止`', () => {
  assert.equal(parseSource('没有冒号的来源'), null);
  assert.equal(parseSource('`a/b.md:行号`'), null);
  assert.equal(parseSource('`a/b.md:0`'), null);
  assert.equal(parseSource('`a/b.md:20-12`'), null);
  assert.deepEqual(parseSource('`a/b.md:12`'), { file: 'a/b.md', start: 12, end: 12 });
  assert.deepEqual(parseSource('`a/b.md:12-20`'), { file: 'a/b.md', start: 12, end: 20 });
});

test('来源形态非法（冒号缺失）→ PatternSourceUnparsable', () => {
  const rows = [
    rowOf('甲场景', REPO_COLON),
    rowOf('乙场景', '没有冒号的来源'),
    rowOf('丙场景', REPO_COLON),
    rowOf('丁场景', REPO_COLON),
    rowOf('戊场景', REPO_COLON),
  ];
  withTempTable(rows, (p) => {
    const { findings } = checkPatternTable({ tablePath: p });
    const hit = findings.find((f) => f.code === 'PatternSourceUnparsable');
    assert.ok(hit, '来源不可解析必须报 PatternSourceUnparsable');
    assert.equal(hit.scenario, '乙场景');
    assert.equal(hit.source, '没有冒号的来源');
  });
});

test('来源行号超出文件行数 → PatternSourceLineMissing', () => {
  const rows = [
    rowOf('甲场景', REPO_COLON),
    rowOf('乙场景', '`tools/execution-matrix/pattern-table.md:99999`'),
    rowOf('丙场景', REPO_COLON),
    rowOf('丁场景', REPO_COLON),
    rowOf('戊场景', REPO_COLON),
  ];
  withTempTable(rows, (p) => {
    const { findings } = checkPatternTable({ tablePath: p });
    const hit = findings.find((f) => f.code === 'PatternSourceLineMissing');
    assert.ok(hit, '来源行号越界必须报 PatternSourceLineMissing');
    assert.equal(hit.scenario, '乙场景');
    assert.equal(hit.file, 'tools/execution-matrix/pattern-table.md');
    assert.equal(hit.line, 99999);
  });
});

test('种子不足 5 行 → PatternSeedTooFew；记录数非整数 → PatternBadCount', () => {
  const rows = [rowOf('甲场景', REPO_COLON), '| 乙场景 | 好——乙 | 坏——乙 | `tools/execution-matrix/pattern-table.md:1` | x | 3 |'];
  withTempTable(rows, (p) => {
    const { findings } = checkPatternTable({ tablePath: p });
    assert.ok(findings.some((f) => f.code === 'PatternSeedTooFew' && f.rows === 2 && f.min === 5));
    assert.ok(findings.some((f) => f.code === 'PatternBadCount' && f.field === 'records' && f.value === 'x'));
  });
});

test('判据正文（三个载体）不含模式表行内容', () => {
  const { findings } = checkPatternTable();
  assert.equal(findings.filter((f) => f.code === 'PatternCopiedIntoCriteria').length, 0);
});

test('负例：模式表行内容被复制进判据正文 → PatternCopiedIntoCriteria', () => {
  const { rows } = checkPatternTable();
  const row = rows[0];
  const carriers = { 'tools/execution-matrix/criteria.md': `## 抄进来的模式表行\n\n${row.good}\n` };
  const { findings } = checkPatternTable({ carriers });
  const hit = findings.find((f) => f.code === 'PatternCopiedIntoCriteria');
  assert.ok(hit, '模式表行内容复制进判据正文必须报 PatternCopiedIntoCriteria');
  assert.equal(hit.text, row.good);
  assert.equal(hit.file, 'tools/execution-matrix/criteria.md');
});

test('模式表解析：跳过表头与分隔行，取 6 列', () => {
  const text = [
    '| 场景 | 好 | 不好 | 来源 | 实测记录数 | 最近 N 次零回归 |',
    '|---|---|---|---|---|---|',
    '| 甲 | 好甲 | 坏甲 | `x.md:1` | 3 | 3 |',
  ].join('\n');
  const rows = parsePatternTable(text);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].scenario, '甲');
  assert.equal(rows[0].records, '3');
});

test('模式表文件存在', () => {
  assert.ok(PATTERN_TABLE.endsWith('pattern-table.md'));
});
