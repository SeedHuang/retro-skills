// 入口函数：一次跑完 结构 / 证据 / 渲染一致
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateArtifact, validateArtifactExitCode, writeObservation } from './artifact.mjs';
import { IDS, docBase, evidenceLines, makeDir, rel } from './fixtures.mjs';

const tmpDirs = [];
const makeTmp = (prefix = 'test-obs-check-artifact-') => {
  const d = makeDir(prefix);
  tmpDirs.push(d);
  return d.dir;
};
test.after(() => { for (const d of tmpDirs) d.dispose(); });

const EV = evidenceLines(makeTmp(), ['第一条真实观察行']);
const doc = ({ items = null, ...over } = {}) => ({ ...docBase({ evidence: EV, items }), ...over });

// 手造文件（绕过写盘入口，用于制造「本来就不合格」的产物）
const writeFile = (dir, name, content) => {
  const p = join(dir, name);
  writeFileSync(p, typeof content === 'string' ? content : JSON.stringify(content, null, 2), 'utf8');
  return p;
};
const art = (dir, name = 'observation-r3') => join(dir, `${name}.json`);

const codes = (r) => r.errors.map((e) => e.code);

test('正例：json 合法 + md 与渲染一致 → ok', () => {
  const dir = makeTmp();
  writeObservation(doc(), { jsonDir: dir, registeredIds: IDS });
  const r = validateArtifact(art(dir), { registeredIds: IDS });
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, []);
});

test('反例：json 文件不存在 → JsonNotFound', () => {
  const dir = makeTmp();
  const r = validateArtifact(art(dir));
  assert.deepEqual(codes(r), ['JsonNotFound']);
});

test('反例：JSON 语法坏掉 → InvalidJson', () => {
  const dir = makeTmp();
  const j = writeFile(dir, 'observation-r3.json', '{ "round": 3, ');
  assert.deepEqual(codes(validateArtifact(j)), ['InvalidJson']);
});

test('反例：结构缺 coverage → MissingCoverage', () => {
  const dir = makeTmp();
  const d = doc(); delete d.coverage;
  const j = writeFile(dir, 'observation-r3.json', d);
  assert.ok(codes(validateArtifact(j, { registeredIds: IDS })).includes('MissingCoverage'));
});

test('反例：假证据（文件不存在）→ EvidenceNotFound', () => {
  const dir = makeTmp();
  const d = doc({ items: [{ id: 'k01', verdict: 'hit', evidence: { path: `${rel(dir)}/nope.md`, line: 1, quote: 'x' } }] });
  const j = writeFile(dir, 'observation-r3.json', d);
  assert.ok(codes(validateArtifact(j, { registeredIds: IDS })).includes('EvidenceNotFound'));
});

test('反例：md 缺失 → MdMissing', () => {
  const dir = makeTmp();
  const j = writeFile(dir, 'observation-r3.json', doc());
  const r = validateArtifact(j, { registeredIds: IDS });
  assert.ok(codes(r).includes('MdMissing'));
});

test('反例：md 被手改 → RenderMismatch（带行号）', () => {
  const dir = makeTmp();
  writeObservation(doc(), { jsonDir: dir, registeredIds: IDS });
  const mdPath = join(dir, 'observation-r3.md');
  writeFileSync(mdPath, readFileSync(mdPath, 'utf8').replace('命中', '未命中'), 'utf8');
  const r = validateArtifact(art(dir), { registeredIds: IDS });
  assert.ok(codes(r).includes('RenderMismatch'));
  assert.match(r.errors.find((e) => e.code === 'RenderMismatch').message, /第 \d+ 行/);
});

test('结构错时不跑渲染比对（避免级联噪声）', () => {
  const dir = makeTmp();
  const d = doc(); delete d.coverage;
  const j = writeFile(dir, 'observation-r3.json', d);
  const m = writeFile(dir, 'observation-r3.md', '# 完全不相干的文本');
  const c = codes(validateArtifact(j, { registeredIds: IDS }));
  assert.ok(c.includes('MissingCoverage'));
  assert.ok(!c.includes('RenderMismatch'), '结构错时不应再报渲染不一致');
});

test('退出码：通过 0 / 失败 1', () => {
  const dir = makeTmp();
  writeObservation(doc(), { jsonDir: dir, registeredIds: IDS });
  const j = art(dir);
  assert.equal(validateArtifactExitCode(j, { registeredIds: IDS }), 0);
  const bad = writeFile(dir, 'observation-r0.json', doc({ round: 0 }));
  assert.equal(validateArtifactExitCode(bad, { registeredIds: IDS }), 1);
});

// ── B17 / B18 / C06：双实例成对与 md 读失败（现造产物 → 入口校验）──
const evi = makeDir();
test.after(evi.dispose);
const ev = evidenceLines(evi.dir, ['第一条真实观察行']);

// k03 带 check:'ai'（PRD §4.1 双实例口径：ai 条目必须有 -a / -b 成对文件）
const aiItems = (evidence) => [
  { id: 'k01', verdict: 'hit', evidence },
  { id: 'k02', verdict: 'na', reason: '不适用' },
  { id: 'k03', check: 'ai', verdict: 'hit', evidence },
];

test('B17 InstanceMissing：ai 条目无 -a/-b 成对文件', () => {
  const t = makeDir();
  try {
    const w = writeObservation(docBase({ evidence: ev, items: aiItems(ev) }), { jsonDir: t.dir, registeredIds: IDS });
    assert.equal(w.ok, true, JSON.stringify(w.errors));
    const r = validateArtifact(join(t.dir, 'observation-r3.json'), { registeredIds: IDS });
    assert.ok(r.errors.map((e) => e.code).includes('InstanceMissing'), JSON.stringify(r.errors));
  } finally { t.dispose(); }
});

test('B18 instance 成对正例：-a / -b 双双零错', () => {
  const t = makeDir();
  try {
    for (const instance of ['A', 'B']) {
      const w = writeObservation(docBase({ evidence: ev, items: aiItems(ev), instance }), { jsonDir: t.dir, registeredIds: IDS });
      assert.equal(w.ok, true, `写 ${instance} 失败：${JSON.stringify(w.errors)}`);
    }
    for (const instance of ['A', 'B']) {
      const r = validateArtifact(join(t.dir, `observation-r3-${instance.toLowerCase()}.json`), { registeredIds: IDS });
      assert.deepEqual(r.errors, [], `${instance}：${JSON.stringify(r.errors)}`);
    }
  } finally { t.dispose(); }
});

test('C06 MdUnreadable：md 被同名目录占位（IO 异常收敛为码，不冒泡）', () => {
  const t = makeDir();
  try {
    const w = writeObservation(docBase({ evidence: ev }), { jsonDir: t.dir, registeredIds: IDS });
    assert.equal(w.ok, true, JSON.stringify(w.errors));
    const mp = join(t.dir, 'observation-r3.md');
    rmSync(mp, { force: true });
    mkdirSync(mp, { recursive: true });          // 用目录占住 md 路径 → readFileSync 抛 EISDIR
    const r = validateArtifact(join(t.dir, 'observation-r3.json'), { registeredIds: IDS });
    assert.equal(r.ok, false);
    assert.deepEqual(r.errors.map((e) => e.code), ['MdUnreadable'], JSON.stringify(r.errors));
  } finally { t.dispose(); }
});
