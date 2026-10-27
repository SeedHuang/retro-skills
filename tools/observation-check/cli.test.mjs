// CLI 端到端：退出码 + 零写盘 + rewrite 只重渲染 md（testcase E02 / E08–E14）
// 编写者 / 独立性声明：senior-sdet 子代理，全新上下文；≠ spec 作者、≠ 施工者
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateArtifact, writeObservation } from './artifact.mjs';
import { renderObservation, checkRendered } from './checks.mjs';
import { repoRoot } from './evidence.mjs';
import { docBase, evidenceLines, makeDir, IDS } from './fixtures.mjs';

const ROOT = repoRoot();
const CLI = join(dirname(fileURLToPath(import.meta.url)), 'cli.mjs');
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

// 退出码捕获：execFileSync 失败时 e.status / e.stdout / e.stderr 一并取
function runCli(args) {
  try {
    const out = execFileSync(process.execPath, [CLI, ...args], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { status: 0, out };
  } catch (e) {
    return { status: e.status, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

test('E02 RoundMismatch：文件名 r5 与内容 round=3 不一致 → exit 1', () => {
  const f = makeDir();
  const t = makeDir();
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    writeFileSync(join(t.dir, 'observation-r5.json'), `${JSON.stringify(docBase({ evidence: ev }), null, 2)}\n`, 'utf8');
    const r = runCli([join(t.dir, 'observation-r5.json')]);
    assert.equal(r.status, 1);
    assert.ok(r.out.includes('RoundMismatch'), r.out);
  } finally { f.dispose(); t.dispose(); }
});

test('E08 CLI 正例：合法产物 exit 0 且零写盘（清单 + hash 前后相等）', () => {
  const f = makeDir();
  const t = makeDir();
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    assert.equal(writeObservation(docBase({ evidence: ev }), { jsonDir: t.dir, registeredIds: IDS }).ok, true);
    const snap = () => readdirSync(t.dir).sort().map((x) => `${x}:${sha(join(t.dir, x))}`).join('|');
    const before = snap();
    const r = runCli([join(t.dir, 'observation-r3.json')]);
    assert.equal(r.status, 0, r.out);
    assert.equal(snap(), before);
  } finally { f.dispose(); t.dispose(); }
});

test('E09 CLI 反例：结构坏件 exit 1 且两码并列（非首错即停）', () => {
  const f = makeDir();
  const t = makeDir();
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    const bad = { ...docBase({ evidence: ev }), coverage: undefined, items: [{ id: 'k01', verdict: 'bogus' }] };
    writeFileSync(join(t.dir, 'observation-r3.json'), `${JSON.stringify(bad, null, 2)}\n`, 'utf8');
    const r = runCli([join(t.dir, 'observation-r3.json')]);
    assert.equal(r.status, 1);
    assert.ok(r.out.includes('MissingCoverage'), r.out);
    assert.ok(r.out.includes('UnknownVerdict'), r.out);
  } finally { f.dispose(); t.dispose(); }
});

test('E10 CLI：路径不存在 → JsonNotFound + exit 1', () => {
  const r = runCli([join(ROOT, '.session', 'reviews', 'no-such-round', 'observation-r9.json')]);
  assert.equal(r.status, 1);
  assert.ok(r.out.includes('JsonNotFound'), r.out);
});

test('E11 CLI：md 缺失必判 MdMissing（缺省不得跳过）', () => {
  const f = makeDir();
  const t = makeDir();
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    writeFileSync(join(t.dir, 'observation-r3.json'), `${JSON.stringify(docBase({ evidence: ev }), null, 2)}\n`, 'utf8');
    const r = runCli([join(t.dir, 'observation-r3.json')]);
    assert.equal(r.status, 1);
    assert.ok(r.out.includes('MdMissing'), r.out);
  } finally { f.dispose(); t.dispose(); }
});

test('E12 rewrite 只重渲染 md：json 字节不动；坏件 exit 1 且 md 不动', () => {
  const f = makeDir();
  const t = makeDir();
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    const doc = docBase({ evidence: ev });
    assert.equal(writeObservation(doc, { jsonDir: t.dir, registeredIds: IDS }).ok, true);
    const jp = join(t.dir, 'observation-r3.json');
    const mp = join(t.dir, 'observation-r3.md');
    writeFileSync(mp, `${readFileSync(mp, 'utf8')}\n手改一行`, 'utf8');

    const jh = sha(jp);
    const r = runCli(['rewrite', jp]);
    assert.equal(r.status, 0, r.out);
    assert.equal(sha(jp), jh, 'json 被改写');
    assert.equal(checkRendered(doc, readFileSync(mp, 'utf8')).ok, true);

    // 回扫义务（testcase E12「不覆盖」条）：坏件必须先校验再拒，md 一字不动
    const bad = { ...doc, items: [{ id: 'k01', verdict: 'bogus' }] };
    writeFileSync(jp, `${JSON.stringify(bad, null, 2)}\n`, 'utf8');
    const mh = sha(mp);
    const r2 = runCli(['rewrite', jp]);
    assert.equal(r2.status, 1);
    assert.ok(r2.out.includes('UnknownVerdict'), r2.out);
    assert.equal(sha(mp), mh, '坏件被 rewrite 改了 md');
  } finally { f.dispose(); t.dispose(); }
});

test('E13 rewrite 写非过程目录 → ArtifactPathOutside 且 md 不变', () => {
  const f = makeDir();
  // override O6（D13）：夹具落 .session/ 非过程子目录——tools/ 下自建目录会污染仓库目录树；
  // 落点必须在封闭清单档位 tmp/ 内（否则进程被 kill 残留会让 npm run check ⑤ 段红）
  mkdirSync(join(ROOT, '.session', 'tmp'), { recursive: true });
  const t = mkdtempSync(join(ROOT, '.session', 'tmp', 'test-nonproc-'));
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    const doc = docBase({ evidence: ev });
    const jp = join(t, 'observation-r3.json');
    const mp = join(t, 'observation-r3.md');
    writeFileSync(jp, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
    writeFileSync(mp, renderObservation(doc), 'utf8');
    const mh = sha(mp);
    const r = runCli(['rewrite', jp]);
    assert.equal(r.status, 1);
    assert.ok(r.out.includes('ArtifactPathOutside'), r.out);
    assert.equal(sha(mp), mh);
  } finally { rmSync(t, { recursive: true, force: true }); f.dispose(); }
});

test('E14 归档件要改：复制到同次过程目录 rewrite，归档 hash 不变', () => {
  const f = makeDir();
  // F019：临时写盘件一律落 .session/reviews/（原先在 docs/superpowers/reviews/ 下 mkdtempSync——
  // 进程被 kill 时残留会进 git status）。判据不变：只有过程目录那一份被 rewrite，归档原件 hash 不动。
  const arch = makeDir('test-archive-');
  const proc = makeDir('test-rewrite-');
  try {
    const ev = evidenceLines(f.dir, ['第一条真实观察行']);
    const doc = docBase({ evidence: ev });
    const aj = join(arch.dir, 'observation-r3.json');
    const am = join(arch.dir, 'observation-r3.md');
    writeFileSync(aj, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
    writeFileSync(am, renderObservation(doc), 'utf8');
    const before = [sha(aj), sha(am)];

    const pj = join(proc.dir, 'observation-r3.json');
    const pm = join(proc.dir, 'observation-r3.md');
    copyFileSync(aj, pj);
    const r = runCli(['rewrite', pj]);
    assert.equal(r.status, 0, r.out);
    assert.deepEqual([sha(aj), sha(am)], before, '归档件被改写');
    assert.equal(existsSync(pm), true);
    assert.equal(checkRendered(doc, readFileSync(pm, 'utf8')).ok, true);
  } finally {
    proc.dispose();
    arch.dispose();
    f.dispose();
  }
});
