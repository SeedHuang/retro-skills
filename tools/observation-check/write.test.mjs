// 写盘流程：校验不过一个字都不写；写过之后 md 与 json 天然一致
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderObservation } from './checks.mjs';
import { repoRoot } from './evidence.mjs';
import { writeObservation, validateArtifact } from './artifact.mjs';
import { IDS, docBase, evidenceLines, makeDir, rel } from './fixtures.mjs';

const tmpDirs = [];
const makeTmp = (prefix = 'test-obs-check-write-') => {
  const d = makeDir(prefix);
  tmpDirs.push(d);
  return d.dir;
};
test.after(() => { for (const d of tmpDirs) d.dispose(); });

const EV = evidenceLines(makeTmp(), ['第一条真实观察行']);
const doc = ({ items = null, ...over } = {}) => ({ ...docBase({ evidence: EV, items }), ...over });

const paths = (dir, name = 'observation-r3') => ({ jsonPath: join(dir, `${name}.json`), mdPath: join(dir, `${name}.md`) });

test('正例：合法产物 → 两个文件都写，且 md 等于渲染结果', () => {
  const dir = makeTmp();
  const p = paths(dir);
  const r = writeObservation(doc(), { jsonDir: dir, registeredIds: IDS });
  assert.equal(r.ok, true);
  assert.equal(r.wrote, true);
  assert.match(readFileSync(p.mdPath, 'utf8'), /命中/);
  assert.equal(readFileSync(p.mdPath, 'utf8'), renderObservation(doc()));
});

test('反例：缺 coverage → 不写盘（两个文件都不存在）', () => {
  const dir = makeTmp();
  const p = paths(dir);
  const d = doc(); delete d.coverage;
  const r = writeObservation(d, { jsonDir: dir, registeredIds: IDS });
  assert.equal(r.ok, false);
  assert.equal(r.wrote, false);
  assert.equal(existsSync(p.jsonPath), false);
  assert.equal(existsSync(p.mdPath), false);
});

test('反例：假证据 → 不写盘', () => {
  const dir = makeTmp();
  const p = paths(dir);
  const d = doc({ items: [{ id: 'k01', verdict: 'hit', evidence: { path: `${rel(dir)}/nope.md`, line: 1, quote: 'x' } }] });
  const r = writeObservation(d, { jsonDir: dir, registeredIds: IDS });
  assert.equal(r.wrote, false);
  assert.ok(r.errors.some((e) => e.code === 'EvidenceNotFound'));
  assert.equal(existsSync(p.mdPath), false);
});

test('反例：单字 quote 走写盘入口 → 拒绝且零写盘', () => {
  const dir = makeTmp();
  const p = paths(dir);
  writeFileSync(join(dir, 'ev.md'), '# 标题\n这是一段足够长的说明文字，用来验证单字引用被拒绝\n', 'utf8');
  const d = doc({ items: [{ id: 'k01', verdict: 'hit', evidence: { path: `${rel(dir)}/ev.md`, line: 2, quote: '的' } }] });
  const r = writeObservation(d, { jsonDir: dir, registeredIds: IDS });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.code === 'EvidenceQuoteTooShort'));
  assert.equal(existsSync(p.jsonPath), false);
  assert.equal(existsSync(p.mdPath), false);
});

test('反例：证据路径逃出根目录 → 拒绝且零写盘', () => {
  const dir = makeTmp();
  const p = paths(dir);
  const d = doc({ items: [{ id: 'k01', verdict: 'hit', evidence: { path: '../outside.md', line: 1, quote: '这是一段足够长的引用文字' } }] });
  const r = writeObservation(d, { jsonDir: dir, registeredIds: IDS });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.code === 'EvidencePathOutside'));
  assert.equal(existsSync(p.jsonPath), false);
  assert.equal(existsSync(p.mdPath), false);
});

test('正例：重复写入幂等（第二次结果相同）', () => {
  const dir = makeTmp();
  const p = paths(dir);
  writeObservation(doc(), { jsonDir: dir, registeredIds: IDS });
  const first = readFileSync(p.mdPath, 'utf8');
  writeObservation(doc(), { jsonDir: dir, registeredIds: IDS });
  assert.equal(readFileSync(p.mdPath, 'utf8'), first);
  // 覆盖写会先备份旧 md：备份与 tmp 都必须在成功路径上清掉，否则残留会进归档并被判未分类文件
  assert.deepEqual(readdirSync(dir).sort(), ['observation-r3.json', 'observation-r3.md']);
});

test('联动：写完手改 md → 读时校验报 RenderMismatch', () => {
  const dir = makeTmp();
  const p = paths(dir);
  writeObservation(doc(), { jsonDir: dir, registeredIds: IDS });
  const md = readFileSync(p.mdPath, 'utf8').replace('命中', '未命中');
  writeFileSync(p.mdPath, md, 'utf8');
  const r = validateArtifact(p.jsonPath, { registeredIds: IDS });
  assert.ok(r.errors.some((e) => e.code === 'RenderMismatch'));
});

test('正例：中文与换行按 UTF-8 落盘，可回读', () => {
  const dir = makeTmp();
  const p = paths(dir);
  writeObservation(doc({ items: [{ id: 'k01', verdict: 'na', reason: '本轮没有被审卡' }] }), { jsonDir: dir, registeredIds: IDS });
  const md = readFileSync(p.mdPath, 'utf8');
  assert.match(md, /本轮没有被审卡/);
  assert.equal(md.includes('\r\n'), false, 'md 应为 LF');
});

// ── E 组：写盘目的地与失败语义（E01 / E03–E07）──
const ROOT = repoRoot();

test('E01 文件名派生：r3 两文件；instance=A → 小写 -a', () => {
  for (const [instance, names] of [
    [null, ['observation-r3.json', 'observation-r3.md']],
    ['A', ['observation-r3-a.json', 'observation-r3-a.md']],
  ]) {
    const f = makeDir();
    const t = makeDir();
    try {
      const ev = evidenceLines(f.dir, ['第一条真实观察行']);
      const w = writeObservation(docBase({ evidence: ev, instance }), { jsonDir: t.dir, registeredIds: IDS });
      assert.equal(w.ok, true, JSON.stringify(w));
      assert.deepEqual(readdirSync(t.dir).sort(), names);   // 目标目录恰两文件，无杂物
    } finally { f.dispose(); t.dispose(); }
  }
});

test('E03 ArtifactPathOutside：非过程目录（tools/ 与 .session/tmp/ 两形态）', () => {
  const f = makeDir();
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    const doc = docBase({ evidence: ev });
    const r1 = writeObservation(doc, { jsonDir: join(ROOT, 'tools'), registeredIds: IDS });
    assert.ok(r1.errors.map((e) => e.code).includes('ArtifactPathOutside'), JSON.stringify(r1));
    assert.equal(existsSync(join(ROOT, 'tools', 'observation-r3.json')), false);

    const tmpRoot = join(ROOT, '.session', 'tmp');
    mkdirSync(tmpRoot, { recursive: true });
    const t2 = mkdtempSync(join(tmpRoot, 'test-artifact-out-'));
    try {
      const r2 = writeObservation(doc, { jsonDir: t2, registeredIds: IDS });
      assert.ok(r2.errors.map((e) => e.code).includes('ArtifactPathOutside'), JSON.stringify(r2));
      assert.equal(existsSync(join(t2, 'observation-r3.json')), false);
    } finally { rmSync(t2, { recursive: true, force: true }); }
  } finally { f.dispose(); }
});

test('E04 ArtifactPathOutside：归档目录只读（既有归档目录，零新建）', () => {
  const f = makeDir();
  // F019：本条本质就是「往归档写」，判据要求目标仍在 docs/superpowers/reviews/ 下；
  // 但不再在该目录 mkdtempSync（进程被 kill 时残留会进 git status）。
  // 改用已在版本管理里的既有归档目录：零新建 → 零残留，判据（归档路径 → ArtifactPathOutside）不变。
  const arch = join(ROOT, 'docs', 'superpowers', 'reviews', '2026-10-25-1723-s6-eval');
  try {
    assert.equal(existsSync(arch), true, '前置：既有归档目录必须存在（本条不新建目录）');
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    const r = writeObservation(docBase({ evidence: ev }), { jsonDir: arch, registeredIds: IDS });
    assert.ok(r.errors.map((e) => e.code).includes('ArtifactPathOutside'), JSON.stringify(r));
    assert.equal(existsSync(join(arch, 'observation-r3.json')), false);
  } finally { f.dispose(); }
});

test('E05 合法 jsonDir 正例：.session/reviews/<次>/ 写盘通过 + 读回零错误', () => {
  const f = makeDir();
  const t = makeDir();
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    const w = writeObservation(docBase({ evidence: ev }), { jsonDir: t.dir, registeredIds: IDS });
    assert.equal(w.ok, true, JSON.stringify(w));
    assert.deepEqual(validateArtifact(join(t.dir, 'observation-r3.json'), { registeredIds: IDS }).errors, []);
  } finally { f.dispose(); t.dispose(); }
});

test('E06 WriteFailed：md 侧失败 → json 不落盘 + 零 tmp 残留', () => {
  const f = makeDir();
  const t = makeDir();
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    mkdirSync(join(t.dir, 'observation-r3.md'));                 // 目录占位同名 md → rename 必失败
    const r = writeObservation(docBase({ evidence: ev }), { jsonDir: t.dir, registeredIds: IDS });
    assert.ok(r.errors.map((e) => e.code).includes('WriteFailed'), JSON.stringify(r));
    assert.equal(existsSync(join(t.dir, 'observation-r3.json')), false);   // rename 顺序 md 先 → json 未落地
    assert.equal(readdirSync(t.dir).filter((x) => x.includes('.tmp-')).length, 0);
  } finally { f.dispose(); t.dispose(); }
});

test('E06b WriteFailed（json 侧失败）→ 删掉刚落地的 md 并恢复旧 md，零 tmp/bak 残留', () => {
  const f = makeDir();
  const t = makeDir();
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    assert.equal(writeObservation(docBase({ evidence: ev }), { jsonDir: t.dir, registeredIds: IDS }).ok, true);
    const mdPath = join(t.dir, 'observation-r3.md');
    const oldMd = readFileSync(mdPath, 'utf8');

    // 让 json 侧 rename 必失败：用同名目录占住 json 路径（只失败在 json，md 已 rename 落地）
    const jsonPath = join(t.dir, 'observation-r3.json');
    rmSync(jsonPath, { force: true });
    mkdirSync(jsonPath, { recursive: true });

    const second = docBase({ evidence: ev, items: [{ id: 'k01', verdict: 'na', reason: '改口径后' }] });
    const r = writeObservation(second, { jsonDir: t.dir, registeredIds: IDS });
    assert.ok(r.errors.map((e) => e.code).includes('WriteFailed'), JSON.stringify(r));
    assert.equal(readFileSync(mdPath, 'utf8'), oldMd, '旧 md 未恢复（无 json 却换了 md）');
    assert.deepEqual(readdirSync(t.dir).filter((x) => x.includes('.tmp-') || x.includes('.bak-')), []);
  } finally { f.dispose(); t.dispose(); }
});

test('E06c WriteFailed（无旧 md + json 侧失败）→ 不留 md（无 json 不得留 md）', () => {
  const f = makeDir();
  const t = makeDir();
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    const jsonPath = join(t.dir, 'observation-r3.json');
    mkdirSync(jsonPath, { recursive: true });          // json 侧必失败；md 侧此前不存在
    const r = writeObservation(docBase({ evidence: ev }), { jsonDir: t.dir, registeredIds: IDS });
    assert.ok(r.errors.map((e) => e.code).includes('WriteFailed'), JSON.stringify(r));
    assert.equal(existsSync(join(t.dir, 'observation-r3.md')), false, '无 json 却留下了 md');
    assert.deepEqual(readdirSync(t.dir).filter((x) => x.includes('.tmp-') || x.includes('.bak-')), []);
  } finally { f.dispose(); t.dispose(); }
});

test('E07 InvalidWriteTarget：jsonDir 不存在 / 指向文件（两形态）', () => {
  const f = makeDir();
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    const doc = docBase({ evidence: ev });
    const missing = join(f.dir, 'no-such-dir');
    const r1 = writeObservation(doc, { jsonDir: missing, registeredIds: IDS });
    assert.ok(r1.errors.map((e) => e.code).includes('InvalidWriteTarget'), JSON.stringify(r1));
    assert.equal(existsSync(missing), false);

    const fileAsDir = join(f.dir, 'not-a-dir.txt');
    writeFileSync(fileAsDir, 'x', 'utf8');
    const r2 = writeObservation(doc, { jsonDir: fileAsDir, registeredIds: IDS });
    assert.ok(r2.errors.map((e) => e.code).includes('InvalidWriteTarget'), JSON.stringify(r2));
  } finally { f.dispose(); }
});
