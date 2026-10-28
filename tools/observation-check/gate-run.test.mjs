// ⑥ 观察产物门禁接线（H01–H36、H53–H55）：夹具一律 mkdtemp 自建，gate 调用一律走子进程
// 编写者：主 agent（施工者本人）。本文件是常驻测试、不是 testcase 文件，不受「独立编写 testcase」义务约束；
// 判据来源 = S3 testcase 的 H 组（`docs/superpowers/specs/2026-10-27-s3-gate-wiring-design-testcase.md`）。
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, renameSync, readdirSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import os from 'node:os';
import { formatGateLine } from './gate-run.mjs';
import { renderObservation } from './checks.mjs';

// 静态红线（S2 baseline.test.mjs A05）：本目录测试文件不得出现角色卡目录字面量；
// 仓库路径一律按段拼装，避免 path 字面量形态。
const HERE = dirname(fileURLToPath(import.meta.url));
const GATE_URL = pathToFileURL(join(HERE, 'gate-run.mjs')).href;
const DRIVER = `const { runObservationGate } = await import(${JSON.stringify(GATE_URL)});
process.stdout.write(JSON.stringify(await runObservationGate()))`;
const ARCHIVE_REL = ['docs', 'superpowers', 'reviews'].join('/');
const SESSION_REL = ['.session', 'reviews'].join('/');
const STOCK_DIR = '2026-10-25-1723-s6-eval';

const norm = (p) => String(p).replace(/\\/g, '/').replace(/\/+$/, '');

const git = (repo, ...args) => {
  const x = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
  assert.strictEqual(x.status, 0, `git ${args.join(' ')}: ${x.stderr}`);
  return x;
};

// 临时 git 仓：必须先有 HEAD（否则 H36 的 rev-parse HEAD 会 exit 128）
const mkRepo = ({ session = true, archive = true } = {}) => {
  const r = mkdtempSync(join(os.tmpdir(), 's3-gate-'));
  git(r, 'init');
  git(r, 'config', 'user.email', 't@t');
  git(r, 'config', 'user.name', 't');
  git(r, 'commit', '--allow-empty', '-m', 'init');
  if (archive) mkdirSync(join(r, ARCHIVE_REL), { recursive: true });
  if (session) mkdirSync(join(r, SESSION_REL), { recursive: true });
  return r;
};

const cleanup = (r) => rmSync(r, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });

// 子进程注入（repoRoot 有进程内缓存，Q13）。
// allowStderr 仅给 H24：git 自己把 `fatal: not a git repository` 写到 stderr（实测），
// 那不是 gate 在 print——gate 不 print 由 stdout 必须可解析为纯 JSON 保证。
const runGate = (repo, { cwd = repo, env = process.env, allowStderr = false } = {}) => {
  const x = spawnSync(process.execPath, ['--input-type=module', '-e', DRIVER], { cwd, env, encoding: 'utf8' });
  assert.strictEqual(x.status, 0, x.stderr);
  if (!allowStderr) assert.strictEqual(x.stderr.trim(), '');
  return JSON.parse(x.stdout);
};

const put = (repo, rel, body = '') => {
  const abs = join(repo, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body, 'utf8');
  return abs;
};

const codesOf = (res) => res.findings.map((f) => f.code);

// 合法产物（四段全过的最小 doc）：全 na items + 与 read/total 对账一致
const validDoc = () => ({
  round: 1,
  instance: null,
  items: [
    { id: 'k01', verdict: 'na', reason: '不适用' },
    { id: 'k02', verdict: 'na', reason: '不适用' },
    { id: 'k03', verdict: 'na', reason: '不适用' },
  ],
  open: [],
  coverage: { read: 3, total: 3, skipped: [] },
  closure: null,
});

const writeArtifact = (repo, relDir, doc = validDoc(), name = 'observation-r1') => {
  put(repo, `${relDir}/${name}.json`, `${JSON.stringify(doc, null, 2)}\n`);
  put(repo, `${relDir}/${name}.md`, renderObservation(doc));
};

const commitAll = (repo, msg = 'artifact') => {
  git(repo, 'add', '-A');
  git(repo, 'commit', '-m', msg);
};


test('H01① formatGateLine 四形态逐字（零产物 / 无 findings / 单条 / 多条）', () => {
  const a = { scannedDirs: 0, archivePairs: 0, processPairs: 0, findings: [] };
  assert.strictEqual(
    formatGateLine(a),
    '⑥ 观察产物门禁：扫描 0 个子目录 / 归档 0 对 / 过程 0 对 / findings 0（归档 0 件，跳过）',
  );

  const b = { scannedDirs: 1, archivePairs: 1, processPairs: 0, findings: [] };
  assert.strictEqual(
    formatGateLine(b),
    '⑥ 观察产物门禁：扫描 1 个子目录 / 归档 1 对 / 过程 0 对 / findings 0',
  );

  // 目录级 path 按段拼装（A05 静态红线：本目录测试不得出现 `path:` + 仓内路径字面量）
  const X = `${ARCHIVE_REL}/x`;
  const f1 = { code: 'ArtifactMissing', path: `${X}/`, message: '无产物' };
  const c = { scannedDirs: 1, archivePairs: 1, processPairs: 0, findings: [f1] };
  assert.strictEqual(
    formatGateLine(c),
    `[observation] ArtifactMissing: ${X}/ —— 无产物`,
  );

  // 多条：g1 的码字母序在 g2 之后 —— 若实现按码排序，输出顺序会与期望相反
  const g1 = { code: 'RenderMismatch', path: `${X}/observation-r1.md`, message: 'md 与渲染不一致' };
  const g2 = { code: 'ArtifactMissing', path: `${X}/`, message: '无产物' };
  const d = { scannedDirs: 1, archivePairs: 1, processPairs: 0, findings: [g1, g2] };
  assert.strictEqual(
    formatGateLine(d),
    `[observation] RenderMismatch: ${X}/observation-r1.md —— md 与渲染不一致`
      + `\n[observation] ArtifactMissing: ${X}/ —— 无产物`,
    JSON.stringify(formatGateLine(d)),
  );
});

test('H01② 空仓结构：四字段齐、全 0、stdout 纯 JSON 且 stderr 空', () => {
  const repo = mkRepo();
  try {
    const res = runGate(repo);
    assert.deepEqual(res.findings, []);
    assert.strictEqual(res.scannedDirs, 0);
    assert.strictEqual(res.archivePairs, 0);
    assert.strictEqual(res.processPairs, 0);
    assert.deepEqual(['scannedDirs', 'archivePairs', 'processPairs', 'findings'].every((k) => k in res), true);
  } finally {
    cleanup(repo);
  }
});

test('H02 扫描根不存在 → 恰 1 条 ArtifactNamingOff', () => {
  const repo = mkRepo({ archive: false });
  try {
    const res = runGate(repo);
    assert.strictEqual(res.findings.length, 1, JSON.stringify(res.findings));
    assert.strictEqual(res.findings[0].code, 'ArtifactNamingOff');
    assert.ok(norm(res.findings[0].path).endsWith(ARCHIVE_REL), res.findings[0].path);
  } finally {
    cleanup(repo);
  }
});

test('H03 扫描根是文件（不可枚举）→ ArtifactNamingOff 且不抛栈', () => {
  const repo = mkRepo({ archive: false });
  try {
    put(repo, ARCHIVE_REL, 'not a dir');
    const res = runGate(repo);
    assert.ok(codesOf(res).includes('ArtifactNamingOff'), JSON.stringify(res.findings));
  } finally {
    cleanup(repo);
  }
});

test('H04 存量白名单目录无产物 → 0 findings', () => {
  const repo = mkRepo();
  try {
    mkdirSync(join(repo, ARCHIVE_REL, STOCK_DIR), { recursive: true });
    const res = runGate(repo);
    assert.deepEqual(res.findings, []);
  } finally {
    cleanup(repo);
  }
});

test('H07 无产物且不在白名单 → 恰 1 条 ArtifactMissing（两形态：仅账本 / 全允许类账本）', () => {
  const repo = mkRepo();
  try {
    const dir = join(repo, ARCHIVE_REL, '2026-10-20-0000-no-obs');
    put(repo, `${ARCHIVE_REL}/2026-10-20-0000-no-obs/progress.md`, '# p');
    const one = runGate(repo);
    assert.strictEqual(one.findings.length, 1, JSON.stringify(one.findings));
    assert.strictEqual(one.findings[0].code, 'ArtifactMissing');
    assert.strictEqual(norm(one.findings[0].path), `${ARCHIVE_REL}/2026-10-20-0000-no-obs`);

    put(repo, `${ARCHIVE_REL}/2026-10-20-0000-no-obs/cards.md`, '# c');
    put(repo, `${ARCHIVE_REL}/2026-10-20-0000-no-obs/problems.md`, '# p2');
    const ledger = runGate(repo);
    assert.strictEqual(ledger.findings.length, 1, JSON.stringify(ledger.findings));
    assert.strictEqual(ledger.findings[0].code, 'ArtifactMissing');
    assert.ok(dir.length > 0);
  } finally {
    cleanup(repo);
  }
});

test('H11 扫描根根层散文件 → 恰 1 条 UnclassifiedArtifact（允许名亦不豁免、不出 ArtifactMissing）', () => {
  const repo = mkRepo();
  try {
    writeArtifact(repo, `${ARCHIVE_REL}/2026-10-27-1000-r1`);
    put(repo, `${ARCHIVE_REL}/notes.md`, '# n');
    commitAll(repo);
    const first = runGate(repo);
    assert.strictEqual(first.findings.length, 1, JSON.stringify(first.findings));
    assert.strictEqual(first.findings[0].code, 'UnclassifiedArtifact');
    assert.ok(first.findings[0].message.includes('notes.md'), first.findings[0].message);

    put(repo, `${ARCHIVE_REL}/progress.md`, '# p');
    commitAll(repo, 'root ledger');
    const second = runGate(repo);
    assert.strictEqual(second.findings.length, 1, JSON.stringify(second.findings));
    assert.strictEqual(second.findings[0].code, 'UnclassifiedArtifact');
    assert.ok(second.findings[0].message.includes('progress.md'), second.findings[0].message);
    assert.ok(!codesOf(second).includes('ArtifactMissing'), JSON.stringify(second.findings));
  } finally {
    cleanup(repo);
  }
});

test('H14 根层产物名（无归属）仍判 UnclassifiedArtifact，无 ArtifactMissing', () => {
  const repo = mkRepo();
  try {
    writeArtifact(repo, `${ARCHIVE_REL}/2026-10-27-1000-r1`);
    put(repo, `${ARCHIVE_REL}/observation-r1.json`, '{}');
    commitAll(repo);
    const res = runGate(repo);
    assert.strictEqual(res.findings.length, 1, JSON.stringify(res.findings));
    assert.strictEqual(res.findings[0].code, 'UnclassifiedArtifact');
    assert.ok(!codesOf(res).includes('ArtifactMissing'));
  } finally {
    cleanup(repo);
  }
});

test('H24 非 git 工作树 → RepoRootUnresolved（fail-closed）', () => {
  const bare = mkdtempSync(join(os.tmpdir(), 's3-gate-'));
  try {
    writeArtifact(bare, `${ARCHIVE_REL}/2026-10-27-1000-r1`);
    mkdirSync(join(bare, SESSION_REL), { recursive: true });
    const res = runGate(bare, { allowStderr: true });
    assert.ok(codesOf(res).includes('RepoRootUnresolved'), JSON.stringify(res.findings));
    assert.ok(res.findings.length > 0);
    assert.ok(!codesOf(res).includes('ArtifactNamingOff'), JSON.stringify(res.findings));
  } finally {
    cleanup(bare);
  }
});

test('H25 子进程 PATH 置空 → spawn ENOENT → RepoRootUnresolved', () => {
  const repo = mkRepo();
  try {
    const res = runGate(repo, { env: { ...process.env, PATH: '' } });
    assert.deepEqual(codesOf(res), ['RepoRootUnresolved']);
  } finally {
    cleanup(repo);
  }
});

test('H54 根层散文件 + 0 子目录 → 仍 UnclassifiedArtifact，不是「0 件，跳过」', () => {
  const repo = mkRepo();
  try {
    put(repo, `${ARCHIVE_REL}/notes.md`, '# n');
    const res = runGate(repo);
    assert.strictEqual(res.findings.length, 1, JSON.stringify(res.findings));
    assert.strictEqual(res.findings[0].code, 'UnclassifiedArtifact');
    assert.notStrictEqual(formatGateLine(res), '⑥ 观察产物门禁：扫描 0 个子目录 / 归档 0 对 / 过程 0 对 / findings 0（归档 0 件，跳过）');
  } finally {
    cleanup(repo);
  }
});

test('H08 子目录含杂件 → 恰 1 条 UnclassifiedArtifact（path 到 <次>/，文件名只在 message）', () => {
  const repo = mkRepo();
  try {
    const rel = `${ARCHIVE_REL}/2026-10-27-1000-r1`;
    writeArtifact(repo, rel);
    put(repo, `${rel}/random-notes.md`, '# r');
    commitAll(repo);
    const res = runGate(repo);
    const un = res.findings.filter((f) => f.code === 'UnclassifiedArtifact');
    assert.strictEqual(un.length, 1, JSON.stringify(res.findings));
    assert.strictEqual(norm(un[0].path), rel);
    assert.ok(/random-notes\.md/.test(un[0].message), un[0].message);
    assert.strictEqual(res.findings.length, 1, JSON.stringify(res.findings));
  } finally {
    cleanup(repo);
  }
});

test('H09 杂件 + 缺产物 → 两码并列', () => {
  const repo = mkRepo();
  try {
    put(repo, `${ARCHIVE_REL}/2026-10-27-1000-r1/random-notes.md`, '# r');
    const cs = codesOf(runGate(repo));
    assert.ok(cs.includes('ArtifactMissing'), cs.join(','));
    assert.ok(cs.includes('UnclassifiedArtifact'), cs.join(','));
  } finally {
    cleanup(repo);
  }
});

test('H10 允许文件名类 8 类（含 cards/ 子层）→ 不误报 UnclassifiedArtifact', () => {
  const repo = mkRepo();
  try {
    const rel = `${ARCHIVE_REL}/2026-10-27-1000-r1`;
    const allowed = ['progress.md', 'cards.md', 'problems.md', 'submission.md',
      'impact-sheet.md', 'detective.md', 'round-check.md', 'delivery-audit.md'];
    for (const f of allowed) put(repo, `${rel}/${f}`, '# x');
    put(repo, `${rel}/cards/round-check.md`, '# c');
    const cs = codesOf(runGate(repo));
    assert.ok(!cs.includes('UnclassifiedArtifact'), cs.join(','));
    assert.ok(cs.includes('ArtifactMissing'), cs.join(','));
  } finally {
    cleanup(repo);
  }
});

test('H12 attachments/<file> 一层快照 → 0 findings', () => {
  const repo = mkRepo();
  try {
    const rel = `${ARCHIVE_REL}/2026-10-27-1000-r1`;
    writeArtifact(repo, rel);
    put(repo, `${rel}/attachments/niku-detection.md`, '# snap');
    commitAll(repo);
    const res = runGate(repo);
    assert.deepEqual(res.findings, []);
  } finally {
    cleanup(repo);
  }
});

test('H13 attachments/a/b.md 两层嵌套 → 恰 1 条 UnclassifiedArtifact（原样相对路径进 message）', () => {
  const repo = mkRepo();
  try {
    const rel = `${ARCHIVE_REL}/2026-10-27-1000-r1`;
    writeArtifact(repo, rel);
    put(repo, `${rel}/attachments/a/b.md`, '# deep');
    commitAll(repo);
    const res = runGate(repo);
    const un = res.findings.filter((f) => f.code === 'UnclassifiedArtifact');
    assert.strictEqual(un.length, 1, JSON.stringify(res.findings));
    assert.strictEqual(norm(un[0].path), rel);
    assert.ok(/attachments\/a\/b\.md/.test(un[0].message), un[0].message);
  } finally {
    cleanup(repo);
  }
});

test('H20 产物名大写后缀 → ArtifactMissing + UnclassifiedArtifact，且无 ArtifactNamingOff', () => {
  const repo = mkRepo();
  try {
    const rel = `${ARCHIVE_REL}/2026-10-27-1000-r1`;
    put(repo, `${rel}/observation-r1-A.json`, '{}');
    put(repo, `${rel}/observation-r1-A.md`, '# a');
    const cs = codesOf(runGate(repo));
    assert.ok(cs.includes('ArtifactMissing'), cs.join(','));
    assert.ok(cs.includes('UnclassifiedArtifact'), cs.join(','));
    assert.ok(!cs.includes('ArtifactNamingOff'), cs.join(','));
  } finally {
    cleanup(repo);
  }
});

test('H15 孤立 md（无同名 json）→ JsonNotFound，无 ArtifactMissing', () => {
  const repo = mkRepo();
  try {
    const rel = `${ARCHIVE_REL}/2026-10-27-1000-r1`;
    put(repo, `${rel}/observation-r1.md`, '# 手写');
    commitAll(repo);
    const cs = codesOf(runGate(repo));
    assert.ok(cs.includes('JsonNotFound'), cs.join(','));
    assert.ok(!cs.includes('ArtifactMissing'), cs.join(','));
  } finally {
    cleanup(repo);
  }
});

test('H16 json 在而 md 缺 → 恰 1 条 MdMissing（S2 原码透传）', () => {
  const repo = mkRepo();
  try {
    const rel = `${ARCHIVE_REL}/2026-10-27-1000-r1`;
    put(repo, `${rel}/observation-r1.json`, `${JSON.stringify(validDoc(), null, 2)}\n`);
    commitAll(repo);
    const res = runGate(repo);
    assert.strictEqual(res.findings.length, 1, JSON.stringify(res.findings));
    assert.strictEqual(res.findings[0].code, 'MdMissing');
  } finally {
    cleanup(repo);
  }
});

test('H17 结构错（items: []）→ MissingItems 透传', () => {
  const repo = mkRepo();
  try {
    const rel = `${ARCHIVE_REL}/2026-10-27-1000-r1`;
    const doc = validDoc();
    doc.items = [];
    doc.coverage = { read: 0, total: 3, skipped: [] };
    writeArtifact(repo, rel, doc);
    commitAll(repo);
    const cs = codesOf(runGate(repo));
    assert.ok(cs.includes('MissingItems'), cs.join(','));
  } finally {
    cleanup(repo);
  }
});

test('H18 已提交后手改 md → RenderMismatch 透传', () => {
  const repo = mkRepo();
  try {
    const rel = `${ARCHIVE_REL}/2026-10-27-1000-r1`;
    writeArtifact(repo, rel);
    commitAll(repo);
    const mdAbs = join(repo, rel, 'observation-r1.md');
    writeFileSync(mdAbs, `${renderObservation(validDoc())}\n手写追加一行\n`, 'utf8');
    const cs = codesOf(runGate(repo));
    assert.ok(cs.includes('RenderMismatch'), cs.join(','));
  } finally {
    cleanup(repo);
  }
});

test('H19 含 check:ai 条目缺 -a/-b → InstanceMissing 透传', () => {
  const repo = mkRepo();
  try {
    const rel = `${ARCHIVE_REL}/2026-10-27-1000-r1`;
    const doc = validDoc();
    doc.items[0] = { id: 'k01', verdict: 'na', reason: '不适用', check: 'ai' };
    writeArtifact(repo, rel, doc);
    commitAll(repo);
    const cs = codesOf(runGate(repo));
    assert.ok(cs.includes('InstanceMissing'), cs.join(','));
  } finally {
    cleanup(repo);
  }
});

test('H06/H21 产物对已提交且工作树一致 → 0 findings，计数 1 子目录 / 1 对', () => {
  const repo = mkRepo();
  try {
    writeArtifact(repo, `${ARCHIVE_REL}/2026-10-27-1000-r1`);
    commitAll(repo);
    const res = runGate(repo);
    assert.deepEqual(res.findings, []);
    assert.strictEqual(res.scannedDirs, 1);
    assert.strictEqual(res.archivePairs, 1);
    assert.ok(!codesOf(res).includes('UntrackedArtifact'));
    assert.ok(!codesOf(res).includes('ArtifactDirty'));
  } finally {
    cleanup(repo);
  }
});

test('H22 归档件未 git add → 恰 2 条 UntrackedArtifact（json + md 各一条，path 精确）', () => {
  const repo = mkRepo();
  try {
    const rel = `${ARCHIVE_REL}/2026-10-27-1000-r1`;
    writeArtifact(repo, rel);
    const res = runGate(repo);
    const un = res.findings.filter((f) => f.code === 'UntrackedArtifact');
    assert.strictEqual(un.length, 2, JSON.stringify(res.findings));
    assert.deepEqual(
      un.map((f) => norm(f.path)).sort(),
      [`${rel}/observation-r1.json`, `${rel}/observation-r1.md`].sort(),
    );
    assert.ok(!codesOf(res).includes('ArtifactDirty'), JSON.stringify(res.findings));
  } finally {
    cleanup(repo);
  }
});

test('H23 已提交后手改 → ArtifactDirty（仍跟踪，不出 UntrackedArtifact）', () => {
  const repo = mkRepo();
  try {
    const rel = `${ARCHIVE_REL}/2026-10-27-1000-r1`;
    writeArtifact(repo, rel);
    commitAll(repo);
    const jsonAbs = join(repo, rel, 'observation-r1.json');
    writeFileSync(jsonAbs, `${JSON.stringify(validDoc(), null, 2)}\n\n`, 'utf8');
    const cs = codesOf(runGate(repo));
    assert.ok(cs.includes('ArtifactDirty'), cs.join(','));
    assert.ok(!cs.includes('UntrackedArtifact'), cs.join(','));
  } finally {
    cleanup(repo);
  }
});

test('H26 json 已跟踪干净、md 未跟踪 → UntrackedArtifact 的 path 逐字到 md', () => {
  const repo = mkRepo();
  try {
    const rel = `${ARCHIVE_REL}/2026-10-27-1000-r1`;
    writeArtifact(repo, rel);
    git(repo, 'add', `${rel}/observation-r1.json`);
    git(repo, 'commit', '-m', 'json only');
    const res = runGate(repo);
    const un = res.findings.filter((f) => f.code === 'UntrackedArtifact');
    assert.strictEqual(un.length, 1, JSON.stringify(res.findings));
    assert.strictEqual(norm(un[0].path), `${rel}/observation-r1.md`);
  } finally {
    cleanup(repo);
  }
});

test('H27 3 个过程目录、0 产物 → 0 findings、processPairs 0、无 ArtifactMissing', () => {
  const repo = mkRepo();
  try {
    for (const n of ['a', 'b', 'c']) mkdirSync(join(repo, SESSION_REL, n), { recursive: true });
    const res = runGate(repo);
    assert.deepEqual(res.findings, []);
    assert.strictEqual(res.processPairs, 0);
  } finally {
    cleanup(repo);
  }
});

test('H28 过程目录合法产物（未跟踪）→ 0 findings、processPairs 1（不做 git）', () => {
  const repo = mkRepo();
  try {
    writeArtifact(repo, `${SESSION_REL}/2026-10-27-230000-proc`);
    const res = runGate(repo);
    assert.deepEqual(res.findings, []);
    assert.strictEqual(res.processPairs, 1);
    assert.ok(!codesOf(res).includes('UntrackedArtifact'));
  } finally {
    cleanup(repo);
  }
});

test('H29 过程产物缺 md → MdMissing（四段真跑）', () => {
  const repo = mkRepo();
  try {
    const rel = `${SESSION_REL}/2026-10-27-230000-proc`;
    put(repo, `${rel}/observation-r1.json`, `${JSON.stringify(validDoc(), null, 2)}\n`);
    const cs = codesOf(runGate(repo));
    assert.ok(cs.includes('MdMissing'), cs.join(','));
  } finally {
    cleanup(repo);
  }
});

test('H30 过程目录只有 md → findings 空（不成对、不报三态码）', () => {
  const repo = mkRepo();
  try {
    put(repo, `${SESSION_REL}/2026-10-27-230000-proc/observation-r1.md`, '# 草稿');
    const res = runGate(repo);
    assert.deepEqual(res.findings, []);
    const cs = codesOf(res);
    assert.ok(!cs.includes('JsonNotFound'), cs.join(','));
    assert.ok(!cs.includes('ArtifactMissing'), cs.join(','));
    assert.ok(!cs.includes('UnclassifiedArtifact'), cs.join(','));
  } finally {
    cleanup(repo);
  }
});

test('H31 过程目录杂件 → 不出 UnclassifiedArtifact / ArtifactMissing', () => {
  const repo = mkRepo();
  try {
    const rel = `${SESSION_REL}/2026-10-27-230000-proc`;
    put(repo, `${rel}/progress.md`, '# p');
    put(repo, `${rel}/random.md`, '# r');
    const cs = codesOf(runGate(repo));
    assert.ok(!cs.includes('UnclassifiedArtifact'), cs.join(','));
    assert.ok(!cs.includes('ArtifactMissing'), cs.join(','));
  } finally {
    cleanup(repo);
  }
});

test('H53 码字面封闭：gate-run.mjs 不自造码', () => {
  const src = readFileSync(join(HERE, 'gate-run.mjs'), 'utf8');
  const literals = [...new Set([...src.matchAll(/code:\s*'([A-Za-z]+)'/g)].map((m) => m[1]))];
  const allowed = new Set([
    'RepoRootUnresolved', 'ArtifactNamingOff', 'UntrackedArtifact', 'ArtifactDirty',
    'ArtifactMissing', 'UnclassifiedArtifact', 'JsonNotFound',
  ]);
  assert.deepEqual(literals.filter((c) => !allowed.has(c)), []);
});

test('H55 过程根不存在（mkRepo session:false）→ processPairs 0、findings 空、无 ArtifactNamingOff', () => {
  const repo = mkRepo({ session: false });
  try {
    const res = runGate(repo);
    assert.strictEqual(res.processPairs, 0);
    assert.deepEqual(res.findings, []);
    assert.ok(!codesOf(res).includes('ArtifactNamingOff'));
  } finally {
    cleanup(repo);
  }
});

// ── Task 8：迁移状态机四步的期望序列（全部在临时仓内，不碰真仓） ──

test('H32 第 0 步产出后 move → UntrackedArtifact（message 含「属预期」「git add」），无 ArtifactMissing', () => {
  const repo = mkRepo();
  const drill = '2026-10-27-1200-migration-drill';
  try {
    writeArtifact(repo, `${SESSION_REL}/${drill}`);
    renameSync(join(repo, SESSION_REL, drill), join(repo, ARCHIVE_REL, drill));
    const res = runGate(repo);
    const un = res.findings.filter((f) => f.code === 'UntrackedArtifact');
    assert.strictEqual(un.length, 2, JSON.stringify(res.findings));
    for (const f of un) {
      assert.ok(f.message.includes('属预期'), f.message);
      assert.ok(f.message.includes('git add'), f.message);
    }
    assert.ok(!codesOf(res).includes('ArtifactMissing'), JSON.stringify(res.findings));
  } finally {
    cleanup(repo);
  }
});

test('H33 git add 后两码消、0 findings', () => {
  const repo = mkRepo();
  const drill = '2026-10-27-1200-migration-drill';
  try {
    writeArtifact(repo, `${SESSION_REL}/${drill}`);
    renameSync(join(repo, SESSION_REL, drill), join(repo, ARCHIVE_REL, drill));
    git(repo, 'add', '-A');
    const res = runGate(repo);
    assert.deepEqual(res.findings, []);
  } finally {
    cleanup(repo);
  }
});

test('H34 commit 后绿保持', () => {
  const repo = mkRepo();
  const drill = '2026-10-27-1200-migration-drill';
  try {
    writeArtifact(repo, `${SESSION_REL}/${drill}`);
    renameSync(join(repo, SESSION_REL, drill), join(repo, ARCHIVE_REL, drill));
    commitAll(repo, 'migrate');
    const res = runGate(repo);
    assert.deepEqual(res.findings, []);
  } finally {
    cleanup(repo);
  }
});

test('H35 迁移后 .session 副本仍在：归档侧报码、过程侧 0 findings（不双报）', () => {
  const repo = mkRepo();
  const drill = '2026-10-27-1200-migration-drill';
  try {
    writeArtifact(repo, `${SESSION_REL}/${drill}`);
    writeArtifact(repo, `${ARCHIVE_REL}/${drill}`);
    commitAll(repo, 'archive copy tracked');
    put(repo, `${ARCHIVE_REL}/${drill}/observation-r1.md`, `${renderObservation(validDoc())}\n手改\n`);
    const res = runGate(repo);
    assert.ok(codesOf(res).includes('ArtifactDirty'), JSON.stringify(res.findings));
    assert.strictEqual(res.findings.filter((f) => norm(f.path).startsWith(SESSION_REL)).length, 0, JSON.stringify(res.findings));
    assert.strictEqual(res.processPairs, 1);
  } finally {
    cleanup(repo);
  }
});

test('H36 跑 gate 前后 HEAD 与 git status --porcelain 不变（0 git 写）', () => {
  const repo = mkRepo();
  try {
    writeArtifact(repo, `${ARCHIVE_REL}/2026-10-27-1000-r1`);
    commitAll(repo);
    const headBefore = git(repo, 'rev-parse', 'HEAD').stdout.trim();
    const statusBefore = git(repo, 'status', '--porcelain').stdout;
    runGate(repo);
    assert.strictEqual(git(repo, 'rev-parse', 'HEAD').stdout.trim(), headBefore);
    assert.strictEqual(git(repo, 'status', '--porcelain').stdout, statusBefore);
  } finally {
    cleanup(repo);
  }
});

// 递归收集生产文件（排除测试），只用于 H05 的调用点计数
const collectProd = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) collectProd(p, out);
    else if (e.name.endsWith('.mjs') && !e.name.endsWith('.test.mjs')) out.push(p);
  }
  return out;
};

test('H05 静态 + 集成：根无入参 / 不自建白名单 / 生产调用点唯一 / 文案不内联 / 子目录 cwd 仍扫仓根', () => {
  const src = readFileSync(join(HERE, 'gate-run.mjs'), 'utf8');
  // ① 无 root 形参（唯一入口无参）
  assert.ok(src.includes('export function runObservationGate()'), 'runObservationGate 必须无参');
  // ② 不自建允许类 / 白名单 / 产物正则（R4）
  assert.ok(!/ALLOWED_FILE_RE/.test(src), 'gate-run 不得引用或重写 ALLOWED_FILE_RE');
  assert.ok(!/STOCK_(DIR|FILE)_WHITELIST/.test(src), 'gate-run 不得自建白名单');
  assert.ok(!/ARTIFACT_RE\s*=/.test(src), 'gate-run 不得自定义产物正则');
  // ③ 三条 git 命令 + timeout: 30000
  for (const cmd of ['rev-parse', 'ls-files', 'diff']) {
    assert.ok(src.includes(`'${cmd}'`), `缺 git 命令 ${cmd}`);
  }
  assert.ok(/timeout:\s*30000/.test(src), 'git 命令必须带 timeout: 30000');

  // ④ 全仓生产调用点 = 1 且实参为空
  const repoRootDir = join(HERE, '..', '..');
  const callSites = collectProd(join(repoRootDir, 'scripts'))
    .concat(collectProd(join(repoRootDir, 'tools')))
    .filter((p) => !norm(p).endsWith('observation-check/gate-run.mjs'))   // 模块自身是定义处，不是调用点
    .filter((p) => readFileSync(p, 'utf8').includes('runObservationGate('));
  assert.deepEqual(callSites.map((p) => norm(p).slice(norm(repoRootDir).length + 1)), ['scripts/check-all.mjs']);
  const allCalls = [...readFileSync(callSites[0], 'utf8').matchAll(/runObservationGate\(([^)]*)\)/g)];
  assert.strictEqual(allCalls.length, 1, JSON.stringify(allCalls.map((m) => m[1])));
  assert.strictEqual(allCalls[0][1], '');

  // ⑤ 文案单源：check-all 必须调 formatGateLine，且不得内联 ⑥ 段字面量
  const checkAll = readFileSync(join(repoRootDir, 'scripts', 'check-all.mjs'), 'utf8');
  assert.ok(checkAll.includes('formatGateLine('), 'check-all 必须调用 formatGateLine');
  assert.ok(!checkAll.includes('⑥ 观察产物门禁：扫描'), 'check-all 不得内联计数行');
  assert.ok(!checkAll.includes('[observation]'), 'check-all 不得内联 [observation] 前缀');

  // ⑥ 根由 repoRoot() 派生：子目录 cwd 下仍扫到仓根归档目录
  const repo = mkRepo();
  try {
    writeArtifact(repo, `${ARCHIVE_REL}/2026-10-27-1000-r1`);
    commitAll(repo);
    const fromSub = runGate(repo, { cwd: join(repo, 'docs') });
    assert.strictEqual(fromSub.scannedDirs, 1, JSON.stringify(fromSub));
    assert.deepEqual(fromSub.findings, []);
  } finally {
    cleanup(repo);
  }
});
