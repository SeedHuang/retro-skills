// ⑥ 观察产物门禁的接线层：runObservationGate()（无参、不 print）+ formatGateLine(res)（纯函数，唯一文案来源）。
// 判定纯函数归 S2（gate-scan / artifact），本模块只做「列文件 → 调纯函数 → 报码」（S3 spec R1/R4）。
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ARTIFACT_RE, scanReviewDir } from './gate-scan.mjs';
import { validateArtifact } from './artifact.mjs';
import { REGISTERED_IDS } from './registered-ids.mjs';
import { repoRoot } from './evidence.mjs';

const GATE_PREFIX = '⑥ 观察产物门禁：扫描 ';
const ARCHIVE_SEGMENTS = ['docs', 'superpowers', 'reviews'];
const ARCHIVE_TOP = ARCHIVE_SEGMENTS.join('/');
const PROCESS_TOP = ['.session', 'reviews'].join('/');

// 归档侧目录级 path：docs/superpowers/reviews/<次>/（根层散文件用 docs/superpowers/reviews/）
const archiveRel = (dirName) => `${ARCHIVE_TOP}/${dirName ? `${dirName}/` : ''}`;

// <次>/ 下全部相对路径（POSIX），子层一并返回——裁剪与豁免判定归 S2 纯函数，本模块不重算（R4）
function listFiles(absDir, rel = '') {
  const out = [];
  for (const entry of readdirSync(absDir, { withFileTypes: true })) {
    const r = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...listFiles(join(absDir, entry.name), r));
    else out.push(r);
  }
  return out;
}

// 成对组数：根层 json 与同名 md 都在即 1 组（-a / -b 各自成对，Q14）
const countPairs = (files) =>
  files.filter((f) => !f.includes('/') && f.endsWith('.json') && ARTIFACT_RE.test(f)
    && files.includes(f.replace(/\.json$/, '.md'))).length;

const UNTRACKED_MSG = '归档件未进 git 索引（迁移步骤 1 属预期，下一步 `git add`）';
const DIRTY_MSG = '归档件与 git 索引不一致（归档后被手改）';

// git 三条命令一律带 cwd 与 timeout（R5）
const runGit = (root, args) => spawnSync('git', args, { cwd: root, encoding: 'utf8', timeout: 30000 });

// 四条分支：有 findings → 逐条一行（顺序 = 数组顺序，不排序不去重不聚合）；
// 零产物（无 findings 且 0 子目录 + 0 对）→ 计数行 + 「（归档 0 件，跳过）」后缀（只跳归档侧）；
// 其余无 findings → 计数行无后缀。本函数不读进程状态、不读磁盘。
export function formatGateLine(res) {
  const { scannedDirs, archivePairs, processPairs, findings } = res;
  if (findings.length > 0) {
    return findings.map((f) => `[observation] ${f.code}: ${f.path} —— ${f.message}`).join('\n');
  }
  const counts = `${GATE_PREFIX}${scannedDirs} 个子目录 / 归档 ${archivePairs} 对 / 过程 ${processPairs} 对 / findings 0`;
  return scannedDirs === 0 && archivePairs === 0 ? `${counts}（归档 0 件，跳过）` : counts;
}

export function runObservationGate() {
  const findings = [];
  const res = { scannedDirs: 0, archivePairs: 0, processPairs: 0, findings };

  // 根不可用（含 spawn 失败 / 超时）→ 收敛为码直接返回，不抛栈（spec:75）
  let root;
  try {
    root = repoRoot();
  } catch (e) {
    findings.push({ code: e.code ?? 'RepoRootUnresolved', path: '', message: e.message });
    return res;
  }

  // 扫描根不存在 / 不可枚举（含路径是文件）→ ArtifactNamingOff（spec:101）
  const scanRoot = join(root, ...ARCHIVE_SEGMENTS);
  let entries;
  try {
    entries = readdirSync(scanRoot, { withFileTypes: true });
  } catch (e) {
    findings.push({
      code: 'ArtifactNamingOff',
      path: ARCHIVE_TOP,
      message: `扫描根不可枚举：${ARCHIVE_TOP}（${e.code ?? e.message}）`,
    });
    return res;
  }

  const rootFiles = [];
  // git 前置探测（R5）：非 0 / spawn error / 超时 → RepoRootUnresolved（fail-closed）
  const pre = runGit(root, ['rev-parse', '--is-inside-work-tree']);
  const gitUsable = !pre.error && pre.status === 0;
  if (!gitUsable) {
    findings.push({
      code: 'RepoRootUnresolved',
      path: '',
      message: `git 前置探测失败（${pre.error ? pre.error.message : String(pre.stderr ?? '').trim()}）`,
    });
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      rootFiles.push(entry.name);
      continue;
    }
    const dirName = entry.name;
    const files = listFiles(join(scanRoot, dirName));
    for (const c of scanReviewDir(dirName, files)) {
      findings.push({ code: c.code, path: archiveRel(dirName), message: c.message });
    }
    // 成对判定（D2）：以 json 为锚逐个四段校验（错误码原样透传，R8）；孤立 md → JsonNotFound
    const topLevel = files.filter((f) => !f.includes('/'));
    const anchors = topLevel.filter((f) => f.endsWith('.json') && ARTIFACT_RE.test(f));
    for (const anchor of anchors) {
      const relPath = `${archiveRel(dirName)}${anchor}`;
      const v = validateArtifact(join(scanRoot, dirName, anchor), { registeredIds: REGISTERED_IDS });
      for (const e of v.errors) findings.push({ code: e.code, path: relPath, message: e.message });
    }
    const orphanMd = topLevel.filter((f) => f.endsWith('.md') && ARTIFACT_RE.test(f)
      && !files.includes(f.replace(/\.md$/, '.json')));
    for (const md of orphanMd) {
      findings.push({
        code: 'JsonNotFound',
        path: `${archiveRel(dirName)}${md}`,
        message: `孤立 md（无同名 json）：${archiveRel(dirName)}${md}`,
      });
    }
    // git 两条断言：只对归档侧产物文件（json 与 md 各一条），每文件每命令最多 1 条 finding
    if (gitUsable) {
      for (const anchor of anchors) {
        const pair = [anchor];
        const mdName = anchor.replace(/\.json$/, '.md');
        if (files.includes(mdName)) pair.push(mdName);
        for (const file of pair) {
          const relFile = `${archiveRel(dirName)}${file}`;
          const ls = runGit(root, ['ls-files', '--error-unmatch', '--', relFile]);
          if (ls.error || ls.status !== 0) {
            findings.push({ code: 'UntrackedArtifact', path: relFile, message: UNTRACKED_MSG });
          }
          const df = runGit(root, ['diff', '--quiet', '--', relFile]);
          if (df.error || df.status !== 0) {
            findings.push({ code: 'ArtifactDirty', path: relFile, message: DIRTY_MSG });
          }
        }
      }
    }
    res.scannedDirs += 1;
    res.archivePairs += countPairs(files);
  }

  // D1 根层散文件：一律 UnclassifiedArtifact（不调 scanReviewDir、不套允许类白名单），
  // 目录级 path + 文件名进 message；同一目录的散件合并成一条（不逐个刷屏）
  if (rootFiles.length > 0) {
    const parts = rootFiles.map((f) => `${f}${ARTIFACT_RE.test(f) ? '（产物名，缺 <次>/ 归属）' : '（非产物名）'}`);
    findings.push({
      code: 'UnclassifiedArtifact',
      path: archiveRel(''),
      message: `扫描根根层散文件：${parts.join('、')}（归档产物必须放在 <次>/ 目录内）`,
    });
  }

  // 过程侧（R3）：只对 <次>/ 根层 observation-r*.json 跑四段校验；不做三态 / 不成对 / 不跑 git。
  // 过程根不存在 → processPairs 0、不报码（与 ⑤ 段同口径）；存在但不可读 → RepoRootUnresolved。
  const processRoot = join(root, '.session', 'reviews');
  if (existsSync(processRoot)) {
    let procEntries;
    try {
      procEntries = readdirSync(processRoot, { withFileTypes: true });
    } catch (e) {
      procEntries = [];
      findings.push({
        code: 'RepoRootUnresolved',
        path: '',
        message: `过程根不可读：${PROCESS_TOP}（${e.code ?? e.message}）`,
      });
    }
    for (const entry of procEntries) {
      if (!entry.isDirectory()) continue;
      let names;
      try {
        names = readdirSync(join(processRoot, entry.name));
      } catch (e) {
        findings.push({
          code: 'RepoRootUnresolved',
          path: '',
          message: `过程目录不可读：${PROCESS_TOP}/${entry.name}（${e.code ?? e.message}）`,
        });
        continue;
      }
      const top = names.filter((f) => ARTIFACT_RE.test(f));
      const jsons = top.filter((f) => f.endsWith('.json'));
      const mds = top.filter((f) => f.endsWith('.md'));
      for (const j of jsons) {
        const v = validateArtifact(join(processRoot, entry.name, j), { registeredIds: REGISTERED_IDS });
        for (const e of v.errors) {
          findings.push({ code: e.code, path: `${PROCESS_TOP}/${entry.name}/${j}`, message: e.message });
        }
      }
      res.processPairs += jsons.filter((j) => mds.includes(j.replace(/\.json$/, '.md'))).length;
    }
  }

  return res;
}
