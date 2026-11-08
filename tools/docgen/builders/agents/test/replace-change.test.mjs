// 变更段写盘通路单测（spec 2026-10-21）：差异算法 / 触达映射 / machineChecks / evidence 留痕校验 / 参数与阶段边界
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { diffLines, formatDiff, touchedSemanticKeys, machineChecksOf } from '../cli.mjs';
import { readEvidence } from '../evidence.mjs';

const CLI = 'tools/docgen/cli.mjs';
const FIXTURE = 'tools/docgen/fixtures/senior-sdet.evidence.json';
const cli = (args, env = {}) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, ...env } });

// ── 差异算法（spec §3.2） ──

test('diffLines：前后缀剥离 + 中段行数 + 首处行号（k = P + 1）', () => {
  const d = diffLines('a\nb\nc\nd\n', 'a\nb\nX\nd\n');
  assert.equal(d.P, 2);
  assert.equal(d.S, 2);
  assert.equal(d.k, 3);
  assert.deepEqual(d.minus, ['c']);
  assert.deepEqual(d.plus, ['X']);
  assert.equal(d.rowsOld, 5); // split('\n') 元素数，末尾空串计入
  assert.equal(d.rowsNew, 5);
});

test('diffLines：两处分离的小改动合并成一个中段块（可读性取舍）', () => {
  // 末行相同 → 公共后缀至少吃掉末尾空串那一个元素；中间段仍把两处改动包成一块
  const d = diffLines('a\nb\nc\nd\ne\n', 'A\nb\nc\nd\nE\n');
  assert.equal(d.P, 0);
  assert.equal(d.S, 1);
  assert.deepEqual(d.minus, ['a', 'b', 'c', 'd', 'e']);
  assert.deepEqual(d.plus, ['A', 'b', 'c', 'd', 'E']);
});

test('formatDiff：契约行序 + 中段空行是「符号 + 一个空格」结尾（禁 trim）', () => {
  const lines = formatDiff('senior-sdet', 'a\nB\n\nC\nd\n', 'a\nX\n\nd\n');
  assert.match(lines[0], /^旧 agents\/senior-sdet\.md {2}sha256=[0-9A-F]{64}（6 行）$/);
  assert.match(lines[1], /^新 渲染 {12}sha256=[0-9A-F]{64}（5 行）$/);
  assert.match(lines[2], /^差异 - 3 \/ \+ 2（首处第 2 行）$/);
  assert.equal(lines[3], '- B');
  assert.equal(lines[4], '- '); // 被删的空行：符号 + 一个空格，行尾空格保留
  assert.equal(lines[5], '- C');
  assert.equal(lines[6], '+ X');
  assert.equal(lines[7], '+ ');
  assert.match(lines[8], /^凭证 --expect-change [0-9A-F]{64}$/);
});

test('formatDiff：无差异只输出 3 行且不含凭证行', () => {
  const lines = formatDiff('reviewer-audit', 'same\n', 'same\n');
  assert.equal(lines.length, 3);
  assert.match(lines[2], /^差异 - 0 \/ \+ 0（盘上 == 渲染，幂等，无需凭证）$/);
});

// ── 触达映射（spec §3.6 表 A） ──

const CARD = [
  '---',
  'name: senior-sdet',
  'description: 资深测试开发工程师。当需要设计并编写测试用例时调用。',
  'tools: Read',
  '---',
  '',
  '# Senior SDET',
  '',
  '> 来源：docgen 生成。',
  '',
  '## 你是谁',
  '',
  '你擅长从失败面倒推用例。',
  '',
  '## 你负责三件事',
  '',
  '1. 写用例',
  '',
  '## 边界',
  '',
  '不参与议会裁决。',
  '',
].join('\n');

test('touchedSemanticKeys：description 行差异 → A2', () => {
  const changed = CARD.replace('设计并编写测试用例', '设计并编写测试用例（testcase.md）');
  assert.deepEqual(touchedSemanticKeys(CARD, changed), ['A2']);
});

test('touchedSemanticKeys：identity 段差异 → A1', () => {
  const changed = CARD.replace('你擅长从失败面倒推用例。', '你擅长从失败面反推用例。');
  assert.deepEqual(touchedSemanticKeys(CARD, changed), ['A1']);
});

test('touchedSemanticKeys：来源声明行 / 其它节差异 → 无键', () => {
  assert.deepEqual(touchedSemanticKeys(CARD, CARD.replace('> 来源：docgen 生成。', '> 来源：docgen 生成（改）。')), []);
  assert.deepEqual(touchedSemanticKeys(CARD, CARD.replace('不参与议会裁决。', '不参与议会表决。')), []);
});

test('touchedSemanticKeys：整节删除也要认出 A1（两侧行号并集，不只看新侧）', () => {
  const changed = CARD.replace('## 你是谁\n\n你擅长从失败面倒推用例。\n\n', '');
  assert.ok(touchedSemanticKeys(CARD, changed).includes('A1'));
});

// ── machineChecks（spec §3.4） ──

test('machineChecksOf：五键齐全且值为 pass / fail', () => {
  const mc = machineChecksOf('## 边界\n\n无。\n');
  assert.deepEqual(Object.keys(mc).sort(), ['A3', 'A4', 'A5', 'A6', 'A7']);
  assert.equal(mc.A6, 'pass');
  assert.equal(mc.A7, 'fail'); // 没有输出格式节
  for (const v of Object.values(mc)) assert.ok(['pass', 'fail'].includes(v));
});

// ── evidence 留痕校验（spec §3.4） ──

const withEvidenceDir = (mutate) => {
  const dir = mkdtempSync(join(tmpdir(), 'dg-ev-'));
  const base = JSON.parse(readFileSync(FIXTURE, 'utf8'));
  mutate(base);
  writeFileSync(join(dir, 'senior-sdet.evidence.json'), `${JSON.stringify(base, null, 2)}\n`);
  return { dir, run: () => readEvidence('senior-sdet'), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
};
const prevDir = process.env.DOCGEN_EVIDENCE_DIR;
test('changes：字段缺省合法（历史 evidence 不因新增校验被判坏）', () => {
  const h = withEvidenceDir((e) => { delete e.changes; });
  process.env.DOCGEN_EVIDENCE_DIR = h.dir;
  try {
    assert.equal(h.run().changes, undefined);
  } finally {
    if (prevDir === undefined) delete process.env.DOCGEN_EVIDENCE_DIR; else process.env.DOCGEN_EVIDENCE_DIR = prevDir;
    h.cleanup();
  }
});

const changesCases = [
  ['非法 from/to/at', (e) => { e.changes = [{ from: 'abc', to: 'XYZ', at: '', rejudged: [] }]; }],
  ['changes 非数组', (e) => { e.changes = {}; }],
  ['rejudged 含 A3', (e) => {
    e.changes = [{ from: e.sha256, to: e.lastWrittenHash, at: new Date().toISOString(), rejudged: ['A2', 'A3'], judgeMode: 'subagent', judgedBy: 'x', judged: [{ key: 'A2', verdict: 'pass', basis: 'b' }, { key: 'A3', verdict: 'pass', basis: 'b' }], machineChecks: { A3: 'pass', A4: 'pass', A5: 'pass', A6: 'pass', A7: 'pass' } }];
  }],
  ['缺 machineChecks', (e) => {
    e.changes = [{ from: e.sha256, to: e.lastWrittenHash, at: new Date().toISOString(), rejudged: [], judgeMode: 'none', judged: [] }];
  }],
  ['machineChecks 缺一键', (e) => {
    e.changes = [{ from: e.sha256, to: e.lastWrittenHash, at: new Date().toISOString(), rejudged: [], judgeMode: 'none', judged: [], machineChecks: { A3: 'pass', A4: 'pass', A6: 'pass', A7: 'pass' } }];
  }],
  ['多报的键缺 judged 记录', (e) => {
    e.changes = [{ from: e.sha256, to: e.lastWrittenHash, at: new Date().toISOString(), rejudged: ['A2', 'B1'], judgeMode: 'subagent', judgedBy: 'x', judged: [{ key: 'A2', verdict: 'pass', basis: 'b' }], machineChecks: { A3: 'pass', A4: 'pass', A5: 'pass', A6: 'pass', A7: 'pass' } }];
  }],
  ['rejudged 非空但 judgedBy 缺失', (e) => {
    e.changes = [{ from: e.sha256, to: e.lastWrittenHash, at: new Date().toISOString(), rejudged: ['A2'], judgeMode: 'subagent', judged: [{ key: 'A2', verdict: 'pass', basis: 'b' }], machineChecks: { A3: 'pass', A4: 'pass', A5: 'pass', A6: 'pass', A7: 'pass' } }];
  }],
  ['rejudged=[] 但 judgeMode 不是 none', (e) => {
    e.changes = [{ from: e.sha256, to: e.lastWrittenHash, at: new Date().toISOString(), rejudged: [], judgeMode: 'subagent', judged: [], machineChecks: { A3: 'pass', A4: 'pass', A5: 'pass', A6: 'pass', A7: 'pass' } }];
  }],
];

for (const [label, mutate] of changesCases) {
  test(`changes 校验：${label} → EvidenceInvalid`, () => {
    const h = withEvidenceDir(mutate);
    process.env.DOCGEN_EVIDENCE_DIR = h.dir;
    try {
      assert.throws(() => h.run(), (e) => e.code === 'EvidenceInvalid');
    } finally {
      if (prevDir === undefined) delete process.env.DOCGEN_EVIDENCE_DIR; else process.env.DOCGEN_EVIDENCE_DIR = prevDir;
      h.cleanup();
    }
  });
}

test('changes 校验：rejudged=[] + judgeMode none + judged [] + 五键 machineChecks → 合法', () => {
  const h = withEvidenceDir((e) => {
    e.changes = [{ from: e.sha256, to: e.lastWrittenHash, at: new Date().toISOString(), rejudged: [], judgeMode: 'none', judged: [], machineChecks: { A3: 'pass', A4: 'pass', A5: 'pass', A6: 'pass', A7: 'pass' } }];
  });
  process.env.DOCGEN_EVIDENCE_DIR = h.dir;
  try {
    assert.equal(h.run().changes.length, 1);
  } finally {
    if (prevDir === undefined) delete process.env.DOCGEN_EVIDENCE_DIR; else process.env.DOCGEN_EVIDENCE_DIR = prevDir;
    h.cleanup();
  }
});

// ── 参数白名单 / 阶段边界（spec §3.3 / R6） ──

test('未知旗标 / 拼错旗标 → InvalidArgs（exit 2，首行以码冒号开头）', () => {
  const r = cli(['replace', '--kind', 'agent', '--name', 'senior-sdet', '--draft', 'x.md', '--expect-cange', 'x', '--yes']);
  assert.equal(r.status, 2);
  assert.match(r.stderr.split(/\r?\n/).find((l) => l.trim()), /^InvalidArgs: /);
});

test('--expect-change 值非法（非 hex / 长度不对）与缺值 → InvalidArgs', () => {
  for (const extra of [['--expect-change', 'G' + '0'.repeat(63)], ['--expect-change', 'A'.repeat(63)], ['--expect-change']]) {
    const r = cli(['replace', '--kind', 'agent', '--name', 'senior-sdet', '--draft', 'x.md', ...extra, '--yes']);
    assert.equal(r.status, 2, extra.join(' '));
    assert.match(r.stderr, /^InvalidArgs: /m);
  }
});

test('--rejudge 含 A3（非 10 语义键）→ InvalidArgs，且 stderr 列出合法键', () => {
  const r = cli(['replace', '--kind', 'agent', '--name', 'senior-sdet', '--draft', 'x.md', '--rejudge', 'A2,A3', '--yes']);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /^InvalidArgs: /m);
  assert.match(r.stderr, /A3/);
  assert.match(r.stderr, /A1 A2 B1/);
});

test('init-evidence：非法名 → InvalidName（exit 1），已迁席 → MigrationPhaseClosed（exit 2）', () => {
  const bad = spawnSync(process.execPath, ['tools/docgen/acceptance/init-evidence.mjs', '../../evil'], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /^InvalidName: /m);

  const dir = mkdtempSync(join(tmpdir(), 'dg-phase-'));
  writeFileSync(join(dir, 'senior-sdet.evidence.json'), `${readFileSync(FIXTURE, 'utf8')}`);
  const phase = spawnSync(process.execPath, ['tools/docgen/acceptance/init-evidence.mjs', 'senior-sdet'], {
    encoding: 'utf8',
    env: { ...process.env, DOCGEN_EVIDENCE_DIR: dir },
  });
  rmSync(dir, { recursive: true, force: true });
  assert.equal(phase.status, 2);
  assert.match(phase.stderr, /^MigrationPhaseClosed: /m);
  assert.match(phase.stderr, /diff/);
});
