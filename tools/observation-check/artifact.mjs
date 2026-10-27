// 入口：校验（validateArtifact / validateArtifactExitCode）+ 唯一写盘入口（writeObservation）
// 目的地判据（PRD §4.5）：realpath 在 git 顶层内 + 匹配过程目录正则 + 不在 .git/** + 归档目录只读
import {
  existsSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { validateObservation, renderObservation, checkRendered, findBrokenTable } from './checks.mjs';
import { repoRoot } from './evidence.mjs';

// 目的地硬编码正则（不留配置项 / 环境变量 / skip 开关）
const PROCESS_DIR_RE = /^\.session\/reviews\/[^/]+\/observation-r\d+(-[ab])?\.(json|md)$/;
const ARTIFACT_NAME_RE = /^(observation-r\d+)(-[ab])?$/;

export function resolveWriteTarget({ jsonDir, name }) {
  if (typeof jsonDir !== 'string' || !jsonDir.trim()) {
    return { error: { code: 'InvalidWriteTarget', message: 'jsonDir 必填（过程目录路径）' } };
  }
  if (!existsSync(jsonDir)) {
    return { error: { code: 'InvalidWriteTarget', message: `jsonDir 不存在或不是目录：${jsonDir}` } };
  }
  // 异常纪律：IO 异常收敛为码，不得冒泡（PRD §4.2）
  let isDir;
  try { isDir = statSync(jsonDir).isDirectory(); } catch (e) {
    return { error: { code: 'InvalidWriteTarget', message: `jsonDir 不可读：${jsonDir}（${e.code ?? e.message}）` } };
  }
  if (!isDir) {
    return { error: { code: 'InvalidWriteTarget', message: `jsonDir 不存在或不是目录：${jsonDir}` } };
  }
  let root;
  try { root = repoRoot(); } catch (e) {
    return { error: { code: e.code ?? 'RepoRootUnresolved', message: e.message } };
  }
  // 无法证明在根内 = fail-closed（realpath 失败不得冒泡）
  let real;
  try { real = realpathSync(resolve(jsonDir)); } catch (e) {
    return { error: { code: 'ArtifactPathOutside', message: `路径无法解析（realpath 失败）：${jsonDir}（${e.code ?? e.message}）` } };
  }
  if (!(real === root || real.startsWith(root + sep))) {
    return { error: { code: 'ArtifactPathOutside', message: `jsonDir 不在仓库内：${jsonDir}` } };
  }
  const jsonPath = join(real, `${name}.json`);
  const mdPath = join(real, `${name}.md`);
  for (const abs of [jsonPath, mdPath]) {
    const rel = relative(root, abs).split(sep).join('/');
    if (rel.startsWith('docs/superpowers/reviews/')) {
      return { error: { code: 'ArtifactPathOutside', message: `归档目录只读：${rel}` } };
    }
    if (rel.split('/').includes('.git')) {
      return { error: { code: 'ArtifactPathOutside', message: `不得写 .git：${rel}` } };
    }
    if (!PROCESS_DIR_RE.test(rel)) {
      return { error: { code: 'ArtifactPathOutside', message: `目的地不在过程目录：${rel}` } };
    }
  }
  return { jsonPath, mdPath };
}

const artifactName = (doc) => `observation-r${doc.round}${doc.instance ? '-' + String(doc.instance).toLowerCase() : ''}`;

export function roundMismatch(jsonPath, doc) {
  const m = ARTIFACT_NAME_RE.exec(basename(jsonPath, '.json'));
  if (!m || !doc || !Number.isInteger(doc.round)) return null;
  const n = Number(m[1].slice('observation-r'.length));
  if (n !== doc.round) {
    return { code: 'RoundMismatch', message: `文件名 ${basename(jsonPath)} 的轮次 ${n} ≠ doc.round ${doc.round}`, path: 'round' };
  }
  return null;
}

// InstanceMissing：items 含 check:'ai' 条目时，同目录必须有 -a / -b 两份（PRD §4.1 / §4.4 B 表）
function instanceMissing(doc, jsonPath) {
  if (!Array.isArray(doc.items) || !doc.items.some((it) => it && it.check === 'ai')) return null;
  const m = ARTIFACT_NAME_RE.exec(basename(jsonPath, '.json'));
  if (!m) return null;
  const dir = dirname(jsonPath);
  for (const suffix of ['-a', '-b']) {
    if (!existsSync(join(dir, `${m[1]}${suffix}.json`))) {
      return { code: 'InstanceMissing', message: `${m[1]} 含 check:'ai' 条目，但缺 ${m[1]}${suffix}.json`, path: 'instance' };
    }
  }
  return null;
}

export function validateArtifact(jsonPath, { registeredIds } = {}) {
  if (!existsSync(jsonPath)) {
    return { ok: false, errors: [{ code: 'JsonNotFound', message: `json 不存在：${jsonPath}` }] };
  }
  let doc;
  try { doc = JSON.parse(readFileSync(jsonPath, 'utf8')); } catch (e) {
    return { ok: false, errors: [{ code: 'InvalidJson', message: `JSON 解析失败：${e.message}` }] };
  }

  const errors = [];
  const rm = roundMismatch(jsonPath, doc);
  if (rm) errors.push(rm);
  errors.push(...validateObservation(doc, { registeredIds, resolveEvidence: true }).errors);
  const im = instanceMissing(doc, jsonPath);
  if (im) errors.push(im);

  // 结构错时不比渲染（避免级联噪声）；md 存在性始终必判（缺省不得跳过）
  const mdPath = jsonPath.replace(/\.json$/i, '.md');
  if (!existsSync(mdPath)) {
    errors.push({ code: 'MdMissing', message: `md 不存在：${mdPath}`, path: 'mdPath' });
  } else if (errors.length === 0) {
    let text;
    try { text = readFileSync(mdPath, 'utf8'); } catch (e) {
      // 异常纪律：IO 异常收敛为码，不得冒泡（PRD §4.2）
      errors.push({ code: 'MdUnreadable', message: `md 不可读：${mdPath}（${e.message}）`, path: 'mdPath' });
    }
    if (text !== undefined) {
      const r = checkRendered(doc, text);
      if (!r.ok) errors.push({ code: r.code, message: r.detail, path: 'mdPath' });
    }
  }
  return { ok: errors.length === 0, errors };
}

export function validateArtifactExitCode(jsonPath, { registeredIds } = {}) {
  return validateArtifact(jsonPath, { registeredIds }).ok ? 0 : 1;
}

export function writeObservation(doc, { jsonDir, registeredIds } = {}) {
  const errors = validateObservation(doc, { registeredIds, resolveEvidence: true }).errors;
  if (errors.length > 0) return { ok: false, wrote: false, errors };

  const target = resolveWriteTarget({ jsonDir, name: artifactName(doc) });
  if (target.error) return { ok: false, wrote: false, errors: [target.error] };

  // 异常纪律：序列化异常收敛为码，不得冒泡（PRD §4.2）
  let jsonText;
  try { jsonText = `${JSON.stringify(doc, null, 2)}\n`; } catch (e) {
    return { ok: false, wrote: false, errors: [{ code: 'WriteFailed', message: `产物无法序列化：${e.message}`, path: 'doc' }] };
  }
  // 渲染段前置（PRD §4.2③「四段全过才落盘」）：转义后每行列数必须等于表头列数。
  // 未落地就写盘 = 把坏表写进唯一给人读的投影，故在写盘入口同判，不靠事后读校验兜。
  const mdText = renderObservation(doc);
  const broken = findBrokenTable(mdText);
  if (broken) {
    return { ok: false, wrote: false, errors: [{ code: 'RenderMismatch', message: `第 ${broken.line} 行列数 ${broken.got} ≠ 本块表头列数 ${broken.want}`, path: 'mdPath' }] };
  }
  const fail = atomicWritePair(target.jsonPath, jsonText, target.mdPath, mdText);
  if (fail) return { ok: false, wrote: false, errors: [fail] };
  return { ok: true, wrote: true, errors: [] };
}

// 先全部渲染/序列化到内存 → 各写 tmp → 目标 md 已有则先备份 → 逐个 rename（md 先、json 后）
// 任一失败统一回滚：清两个 tmp；新 md 已落地则删掉它、有备份则恢复旧 md（无 json 不得留 md）
// 所有清理动作各自包 try —— 清理本身失败不得冒泡（PRD §4.2：失败即一个字都不写）
function atomicWritePair(jsonPath, jsonText, mdPath, mdText) {
  const jTmp = `${jsonPath}.tmp-${process.pid}`;
  const mTmp = `${mdPath}.tmp-${process.pid}`;
  const mBak = `${mdPath}.bak-${process.pid}`;
  let hadOldMd = false;
  let mdLanded = false;
  try {
    writeFileSync(mTmp, mdText, 'utf8');
    writeFileSync(jTmp, jsonText, 'utf8');
    // 只备份普通文件：md 被目录占位时不得把目录挪走（否则 rename 会「成功」并留下 .bak- 残留）
    if (existsSync(mdPath) && statSync(mdPath).isFile()) {
      renameSync(mdPath, mBak);
      hadOldMd = true;
    }
    renameSync(mTmp, mdPath);
    mdLanded = true;
    renameSync(jTmp, jsonPath);
    if (hadOldMd) try { rmSync(mBak, { force: true }); } catch { /* 备份清理失败不影响已落地产物 */ }
    return null;
  } catch (e) {
    try { rmSync(mTmp, { force: true }); } catch { /* 清理失败不得冒泡 */ }
    try { rmSync(jTmp, { force: true }); } catch { /* 同上 */ }
    if (mdLanded) try { rmSync(mdPath, { force: true }); } catch { /* 同上 */ }
    if (hadOldMd) try { renameSync(mBak, mdPath); } catch { /* 同上 */ }
    return { code: 'WriteFailed', message: `写盘失败：${e.message}（已回滚，旧产物不变）`, path: 'jsonDir' };
  }
}
