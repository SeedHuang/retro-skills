// 证据可解析：路径白名单 + 存在性 + 行号 + 引用命中 + 引用长度
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkEvidence, repoRoot } from './evidence.mjs';
import { MD_SKELETON } from './md-format.mjs';
import { evidenceLines, makeDir, rel } from './fixtures.mjs';

const tmp = makeDir();
test.after(() => tmp.dispose());

// 自建证据件（相对仓库根的路径由 rel() 给出；checkEvidence 的根唯一 = 仓库根）
const dir = tmp.dir;
writeFileSync(join(dir, 'a.md'), ['# 标题', '', '第二行有  多余空格  的句子', '第三行'].join('\n'), 'utf8');
const A = `${rel(dir)}/a.md`;

// 长度专项：第 1 行短标题、第 2 行长句、第 3/4 行极短行
const LONG = '这一行是一段很长的说明文字，用来验证短片段即使命中也会因为占比过低而被拒绝。';
writeFileSync(join(dir, 'len.md'), ['# 角色：侦探（独立观察）', LONG, '## 三态', '###'].join('\n'), 'utf8');
const LEN = `${rel(dir)}/len.md`;

const chk = (ev) => checkEvidence(ev);

test('正例：路径存在 + 行号正确 + 引用命中（含空白归一）', () => {
  const r = chk({ path: A, line: 3, quote: '第二行有 多余空格 的句子' });
  assert.equal(r.ok, true);
});

test('正例：自建证据件可解析（默认根 = 仓库根）', () => {
  const r = checkEvidence({ path: A, line: 1, quote: '# 标题' });
  assert.equal(r.ok, true);
});

test('反例：文件不存在 → EvidenceNotFound', () => {
  const r = chk({ path: `${rel(dir)}/nope.md`, line: 1, quote: 'x' });
  assert.equal(r.code, 'EvidenceNotFound');
});

test('反例：行号超出 → EvidenceLineOutOfRange', () => {
  const r = chk({ path: A, line: 99, quote: 'x' });
  assert.equal(r.code, 'EvidenceLineOutOfRange');
});

test('反例：该行不含引用 → EvidenceQuoteMismatch', () => {
  const r = chk({ path: A, line: 4, quote: '第二行' });
  assert.equal(r.code, 'EvidenceQuoteMismatch');
});

test('反例：evidence 是字符串（旧写法）→ InvalidFieldType', () => {
  const r = chk('a.md:12');
  assert.equal(r.code, 'InvalidFieldType');
});

test('反例：line 是字符串 "3" → InvalidFieldType', () => {
  const r = chk({ path: A, line: '3', quote: 'x' });
  assert.equal(r.code, 'InvalidFieldType');
});

test('反例：quote 全是空白 → InvalidFieldType', () => {
  const r = chk({ path: A, line: 1, quote: '   ' });
  assert.equal(r.code, 'InvalidFieldType');
});

// —— 路径白名单 ——

test('反例：绝对路径 → EvidencePathAbsolute', () => {
  const r = chk({ path: join(dir, 'a.md'), line: 3, quote: '第二行有 多余空格 的句子' });
  assert.equal(r.code, 'EvidencePathAbsolute');
});

test('反例：盘符相对路径 "C:a.md" → EvidencePathAbsolute', () => {
  const r = chk({ path: 'C:a.md', line: 1, quote: 'x' });
  assert.equal(r.code, 'EvidencePathAbsolute');
});

test('反例：UNC 路径 → EvidencePathAbsolute', () => {
  const r = chk({ path: '\\\\server\\share\\a.md', line: 1, quote: 'x' });
  assert.equal(r.code, 'EvidencePathAbsolute');
});

test('反例：../ 逃出根目录 → EvidencePathOutside', () => {
  const r = chk({ path: '../a.md', line: 1, quote: 'x' });
  assert.equal(r.code, 'EvidencePathOutside');
});

test('正例：路径含 .. 但解析后仍在根内 → 正常解析（不过度拒绝）', () => {
  const r = chk({ path: `sub/../${A}`, line: 3, quote: '第二行有 多余空格 的句子' });
  assert.equal(r.ok, true);
});

test('反例：path 指向目录 → EvidenceUnreadable（不抛异常）', () => {
  const r = chk({ path: '.', line: 1, quote: '这一行是一段很长的说明文字' });
  assert.equal(r.code, 'EvidenceUnreadable');
});

// —— 引用长度 ——

test('反例：单字引用（该行确实含有）→ EvidenceQuoteTooShort', () => {
  const r = chk({ path: LEN, line: 2, quote: '的' });
  assert.equal(r.code, 'EvidenceQuoteTooShort');
});

test('反例：4 字片段但只占长行一小截 → EvidenceQuoteTooShort', () => {
  const r = chk({ path: LEN, line: 2, quote: '说明文字' });
  assert.equal(r.code, 'EvidenceQuoteTooShort');
});

test('反例：9 字片段（差 1 字到绝对下限、占比也低）→ EvidenceQuoteTooShort', () => {
  const r = chk({ path: LEN, line: 2, quote: '这一行是一段很长的' });
  assert.equal(r.code, 'EvidenceQuoteTooShort');
});

test('正例：恰好 10 字（绝对下限边界，占比低也放行）', () => {
  const r = chk({ path: LEN, line: 2, quote: '这一行是一段很长的说' });
  assert.equal(r.ok, true);
});

test('正例：短标题片段占该行一半以上 → 放行（不逼迫凑字）', () => {
  const r = chk({ path: LEN, line: 1, quote: '# 角色：侦探' });
  assert.equal(r.ok, true);
});

test('正例：极短行整行引用（5 字）→ 放行', () => {
  const r = chk({ path: LEN, line: 3, quote: '## 三态' });
  assert.equal(r.ok, true);
});

test('反例：极短行整行引用但不足 4 字（"###"）→ EvidenceQuoteTooShort', () => {
  const r = chk({ path: LEN, line: 4, quote: '###' });
  assert.equal(r.code, 'EvidenceQuoteTooShort');
});

test('反例：太短且不在行内 → 先报 EvidenceQuoteMismatch（不报太短）', () => {
  const r = chk({ path: LEN, line: 2, quote: 'zzz' });
  assert.equal(r.code, 'EvidenceQuoteMismatch');
});

// —— 证据组：C01–C05 / C07（plan Task 10 Step 3；夹具在本块内自建，不依赖文件级 dir）——

const cdir = makeDir();
test.after(cdir.dispose);

const sensitiveNames = ['.env', '.env.local', 'server.pem', 'ca.key', 'client.p12', 'id_rsa', 'id_ed25519_x', '.npmrc', '.netrc', 'credentials.json', 'my-secret-notes.md'];
test('C01 EvidenceSensitivePath：11 形态逐类命中', () => {
  for (const name of sensitiveNames) {
    const ev = evidenceLines(cdir.dir, ['内容足够长的真实观察行'], { name });
    const r = checkEvidence(ev);
    assert.equal(r.code, 'EvidenceSensitivePath', `${name} → ${JSON.stringify(r)}`);
  }
});

test('C02 EvidenceSensitivePath：反斜杠 / 混合分隔', () => {
  for (const p of ['fixtures\\.env', 'a/b\\.env']) {
    const ev = { ...evidenceLines(cdir.dir, ['内容足够长的真实观察行'], { name: '.env' }), path: p };
    assert.equal(checkEvidence(ev).code, 'EvidenceSensitivePath', p);
  }
});

test('C03 假阳性守卫：普通路径不误报', () => {
  for (const name of ['observation.mjs', 'key-terms.md', '.gitignore']) {
    const ev = evidenceLines(cdir.dir, ['内容足够长的真实观察行'], { name });
    assert.notEqual(checkEvidence(ev).code, 'EvidenceSensitivePath', name);
  }
});

test('C04 EvidenceQuoteSensitive：四形态逐字命中', () => {
  const lines = [
    '-----BEGIN RSA PRIVATE KEY-----',
    'AKIAIOSFODNN7EXAMPLE',
    `ghp_${'a'.repeat(36)}`,
    'https://user:pass@example.com/repo',
  ];
  for (let i = 0; i < lines.length; i += 1) {
    const ev = evidenceLines(cdir.dir, lines, { name: 'quotes.md', line: i + 1 });
    assert.equal(checkEvidence(ev).code, 'EvidenceQuoteSensitive', `第 ${i + 1} 行`);
  }
});

test('C05 假阳性守卫：无凭据 URL 零错误', () => {
  // 逐行各取一次（evidenceLines 的 quote = lines[line-1]，不能用 {...ev, line} 改写 line 而不改 quote）
  const p1 = evidenceLines(cdir.dir, ['https://github.com/org/repo/blob/main/a.md', 'https://example.com:8080/docs'], { name: 'urls.md', line: 1 });
  const p2 = evidenceLines(cdir.dir, ['https://github.com/org/repo/blob/main/a.md', 'https://example.com:8080/docs'], { name: 'urls.md', line: 2 });
  assert.equal(checkEvidence(p1).ok, true);
  assert.equal(checkEvidence(p2).ok, true);
});

test('C07 纯结构行不可作证据（3 形态）', () => {
  const table = evidenceLines(cdir.dir, ['| --- | --- | --- |'], { name: 'struct.md' });
  assert.equal(checkEvidence(table).code, 'EvidenceStructuralRow');      // ① 13 字过长度 → 结构行码
  const fence = evidenceLines(cdir.dir, ['```'], { name: 'fence.md' });
  assert.equal(checkEvidence(fence).code, 'EvidenceQuoteTooShort');      // ② 3 字 → 长度道
  const dash = evidenceLines(cdir.dir, ['---'], { name: 'dash.md' });
  assert.equal(checkEvidence(dash).code, 'EvidenceQuoteTooShort');       // ③ 3 字 → 长度道
});

// F017：②③ 只走到长度道，围栏 / 水平线两条正则本身零覆盖 → 各补一例过长度门、只由结构行判据拦下
test('C07 补充：围栏 ```js 与水平线 -----（各 5 字整行）→ EvidenceStructuralRow', () => {
  const fence = evidenceLines(cdir.dir, ['```js'], { name: 'struct-fence.md' });
  const rf = checkEvidence(fence);
  assert.equal(rf.code, 'EvidenceStructuralRow', JSON.stringify(rf));

  const dash = evidenceLines(cdir.dir, ['-----'], { name: 'struct-dash.md' });
  const rd = checkEvidence(dash);
  assert.equal(rd.code, 'EvidenceStructuralRow', JSON.stringify(rd));
});

// F020：渲染器固定骨架行（版本横幅 / 固定标题 / 「无。」/ 两张表头）零信息 → 不可作证据。
// 常量与渲染侧同源（md-format.mjs），逐行断言，防止「自己产出的常量又能当证据」。
test('C07 补充：渲染器固定骨架行逐行不可作证据', () => {
  MD_SKELETON.forEach((line, i) => {
    const ev = evidenceLines(cdir.dir, [line], { name: `skeleton-${i}.md` });
    const code = checkEvidence(ev).code;
    // 极短行（如「无。」2 字）先被长度道拦下，同样成不了证据
    assert.ok(code === 'EvidenceStructuralRow' || code === 'EvidenceQuoteTooShort', `${line} → ${code}`);
  });
});

// F021：EvidencePathOutside 的软链 realpath 分支（evidence.mjs:59-67）零覆盖。
// junction 在 Windows 无需管理员即可创建（实测可用），故不以「平台造不出」为由跳过。
test('C02-b 软链指向根外 → EvidencePathOutside（realpath 分支，不是 resolve 分支）', () => {
  const outside = mkdtempSync(join(tmpdir(), 'obs-check-outside-'));
  const link = join(cdir.dir, 'link-out');
  try {
    writeFileSync(join(outside, 'x.md'), '内容足够长的真实观察行\n', 'utf8');
    symlinkSync(outside, link, 'junction');
    const r = checkEvidence({ path: `${rel(cdir.dir)}/link-out/x.md`, line: 1, quote: '内容足够长的真实观察行' });
    assert.equal(r.code, 'EvidencePathOutside', JSON.stringify(r));
    assert.ok(/软链/.test(r.detail), r.detail);
  } finally {
    unlinkSync(link);                                   // 只删链接，不碰目标内容
    rmSync(outside, { recursive: true, force: true });
  }
});

test('C02-c 软链指向根内 → 正常解析（不过度拒绝）', () => {
  const inner = join(cdir.dir, 'link-inner');
  const link = join(cdir.dir, 'link-in');
  mkdirSync(inner, { recursive: true });
  writeFileSync(join(inner, 'y.md'), '内容足够长的真实观察行\n', 'utf8');
  try {
    symlinkSync(inner, link, 'junction');
    const r = checkEvidence({ path: `${rel(cdir.dir)}/link-in/y.md`, line: 1, quote: '内容足够长的真实观察行' });
    assert.equal(r.ok, true, JSON.stringify(r));
  } finally {
    unlinkSync(link);
  }
});

// F015：把 repoRoot 的唯一来源钉死（仓内 git rev-parse --show-toplevel）。
// 注意：单靠 in-process 比对在「从仓根启动」时判不出 process.cwd() 兜底（两者恰好相等），
// 故补一条与启动目录无关的判据：子进程 cwd = 仓内子目录（tools/observation-check）→ 根仍须是仓根。
const SELF_DIR = dirname(fileURLToPath(import.meta.url));
const EVIDENCE_URL = pathToFileURL(join(SELF_DIR, 'evidence.mjs')).href;

test('repoRoot 来源 = git rev-parse：常驻钉（不得以 process.cwd() 兜底）', () => {
  const fromGit = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  assert.equal(realpathSync(repoRoot()), realpathSync(fromGit));
  const script = `import(${JSON.stringify(EVIDENCE_URL)}).then(({ repoRoot }) => console.log(repoRoot()));`;
  const fromSub = execFileSync(process.execPath, ['-e', script], { cwd: SELF_DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  assert.equal(realpathSync(fromSub), realpathSync(fromGit), '子目录 cwd 下取到的根不对（疑似 process.cwd() 兜底）');
});

// F010：PRD §4.4 B 表 S2 组 RepoRootUnresolved 的零覆盖补齐（C08）。
// 必须在全新子进程里跑：repoRoot() 有模块级缓存，同进程先跑过别的证据用例后根已填，本条会恒绿（假绿）。
test('C08 RepoRootUnresolved：子进程 cwd 不在任何 git 仓库内 → fail-closed（不退化为 process.cwd）', () => {
  const root = mkdtempSync(join(tmpdir(), 'obs-check-nogit-'));
  const leaf = join(root, 'a', 'b');
  mkdirSync(leaf, { recursive: true });
  try {
    // GIT_CEILING_DIRECTORIES 把 git 的上溯封在 root：即便本机 tmpdir 落在某个工作树内，
    // 「不是 git 仓库」这一前提仍可构造——不靠环境运气，也不允许 skip 掉本码唯一反例
    const env = { ...process.env, GIT_CEILING_DIRECTORIES: root };
    const script = `import(${JSON.stringify(EVIDENCE_URL)}).then(({ checkEvidence }) => console.log(JSON.stringify(checkEvidence({ path: 'x.md', line: 1, quote: '0123456789' }))));`;
    const stdout = execFileSync(process.execPath, ['-e', script], { cwd: leaf, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const r = JSON.parse(stdout.trim());
    assert.equal(r.ok, false, JSON.stringify(r));
    // stderr 里 git 的 `fatal: not a git repository` 不作判据（是被捕获的异常文本，已重定向丢弃）
    assert.equal(r.code, 'RepoRootUnresolved', JSON.stringify(r));
    // 判别力：若实现拿 process.cwd() 兜底 → 根 = leaf → confine 过 → leaf/x.md 不存在 → EvidenceNotFound
    assert.notEqual(r.code, 'EvidenceNotFound', '根被兜底解析成了子进程 cwd（应为 fail-closed）');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
