// compare.mjs —— docgen 纯组件：buffer 比较 / 环境检查 / 路径越界判定 / render 纯度探针。
// Ruling S12 例外：本文件允许 import node:fs（existsSync / realpathSync），
// assertInside 的 realpath 复判（P1 TC-065 junction 防御）必须保留。其余组件保持零 fs。
import { existsSync, realpathSync } from 'node:fs'; // Ruling S12 例外
import { resolve, relative, isAbsolute, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

function fail(code, fields = {}) {
  const e = new Error(code);
  e.code = code;
  Object.assign(e, fields);
  throw e;
}

export function compareBuffers(actual, expected) {
  const a = Buffer.isBuffer(actual) ? actual : Buffer.from(actual, 'utf8');
  const b = Buffer.isBuffer(expected) ? expected : Buffer.from(expected, 'utf8');
  if (a.equals(b)) return null;
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i += 1;
  const line = a.subarray(0, i).toString('utf8').split('\n').length;
  return { code: 'Mismatch', line, byte: i };
}

// spec §4「比对 helper 契约」：逐行比对并按**行内容**排除允许差异（本席 = 来源声明行的改前/改后文本）。
// raw = 全部逐行差异；unallowed = raw 中 line 不在 ignorable 的条目。
// line = 期望侧（expected）该 index 的内容，期望侧无该行（实际侧多行）时为 null；index 0 基。
// 排除判定只看行内容——不得按 index、不得按 `>` 前缀过滤（否则行号偏移/其它引用行会漏检）。
export function diffSet(actual, expected, ignorable = []) {
  const a = (Buffer.isBuffer(actual) ? actual : Buffer.from(actual, 'utf8')).toString('utf8').split('\n');
  const b = (Buffer.isBuffer(expected) ? expected : Buffer.from(expected, 'utf8')).toString('utf8').split('\n');
  const allowed = new Set(ignorable);
  const raw = [];
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    const line = i < b.length ? b[i] : null;
    const actualLine = i < a.length ? a[i] : null;
    if (line !== actualLine) raw.push({ index: i, line });
  }
  const unallowed = raw.filter((d) => d.line === null || !allowed.has(d.line));
  return { raw, unallowed };
}

// ImpureRender 静态扫描：render 模块图固定，源码级禁止任何 fs 模块导入。
// 运行时探针无法 patch node:fs/promises 的 ESM 命名导出（实测 read-only、configurable=false），
// 因此用静态扫描兜底：命中 fs / fs/promises 的导入语句即判 ImpureRender。
const FS_IMPORT_RE = /(?:from\s*['"]|require\(\s*['"])(?:node:)?fs(?:\/promises)?['"]/;

function isOutside(base, target) {
  const rel = relative(base, target);
  if (rel === '') return true;
  if (isAbsolute(rel)) return true;
  return rel === '..' || rel.startsWith(`..${sep}`);
}

function safeRealpath(path) {
  try {
    return realpathSync(path);
  } catch {
    return resolve(path);
  }
}

/**
 * spec §7.1：path.relative 判定 + 最近已存在祖先的 realpath 复判。
 * kind = 'input' → InvalidInputPath；kind = 'output' → InvalidOutputPath。
 * 返回解析后的绝对路径；越界直接抛错（exitCode 2）。
 */
export function assertInside(root, input, kind = 'input') {
  const code = kind === 'output' ? 'InvalidOutputPath' : 'InvalidInputPath';
  const abs = resolve(input);
  const resolvedRoot = resolve(root);

  if (isOutside(resolvedRoot, abs)) {
    fail(code, { path: abs, exitCode: 2 });
  }

  // 输出文件往往尚不存在：从 abs 向上找最近的已存在祖先做 realpath 复判，防 junction / symlink / 大小写。
  let probe = abs;
  while (!existsSync(probe)) {
    const parent = dirname(probe);
    if (parent === probe) break;
    probe = parent;
  }
  const realRoot = safeRealpath(resolvedRoot);
  const realProbe = safeRealpath(probe);
  const reconstructed = resolve(realProbe, relative(probe, abs));
  if (isOutside(realRoot, reconstructed)) {
    fail(code, { path: abs, exitCode: 2 });
  }

  return abs;
}

/**
 * spec §6.2（按输入角色）：BOM → CR → 非法 UTF-8 → 末尾恰一个 \n。
 * generated 副本是比对对象，不预检。
 */
export function checkEnvironment(buffer, role, path) {
  if (role === 'generated') return null;
  if (!['target', 'template', 'baseline'].includes(role)) {
    fail('InvalidArgs', {
      reason: 'unknown-role',
      message: `未知的环境角色：${role}`,
      exitCode: 2,
      role,
    });
  }

  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(String(buffer), 'utf8');
  const error = (violation) => {
    const fields = { violation, role, exitCode: 2 };
    if (path !== undefined) fields.path = path;
    fields.message = `EnvironmentEOL（violation=${violation}，role=${role}）`;
    fail('EnvironmentEOL', fields);
  };

  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    error('BOM');
  }
  if (buf.includes(0x0d)) {
    error('CR');
  }
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    error('INVALID_UTF8');
  }
  if (buf.length === 0 || buf[buf.length - 1] !== 0x0a) {
    error('NO_TRAILING_NEWLINE');
  }
  if (buf.length > 1 && buf[buf.length - 2] === 0x0a) {
    error('TRAILING_NEWLINE');
  }

  return null;
}

/**
 * spec §5.5：在 fn 执行期间替换 fs 读取 API；命中 forbiddenPaths → ImpureRender。
 * finally 恢复原函数（探针只包住 render，不包模板读取与比较）。
 */
export async function withReadProbe(fn, forbiddenPaths = [], pureSources = []) {
  // 静态扫描先行：模块图的 fs 导入无法被运行时 patch 拦截（node:fs/promises 命名导出只读）。
  for (const source of pureSources) {
    if (FS_IMPORT_RE.test(source)) {
      fail('ImpureRender', {
        path: '(static)',
        exitCode: 1,
        message: 'ImpureRender：render 源码静态含 fs 模块导入，无法保证纯度（fs/promises 的命名导出不可 patch，必须走静态扫描）',
      });
    }
  }

  const fsDefault = (await import('node:fs')).default;
  const forbidden = new Set(forbiddenPaths.map((item) => resolve(item)));
  const originals = [];

  const checkPath = (path) => {
    if (typeof path !== 'string' && !(path instanceof URL)) return;
    const abs = path instanceof URL ? fileURLToPath(path) : resolve(path);
    if (forbidden.has(abs)) {
      fail('ImpureRender', {
        path: abs,
        exitCode: 1,
        message: `ImpureRender：render 读取了禁止路径 ${abs}`,
      });
    }
  };

  for (const name of ['readFileSync', 'openSync', 'readFile', 'open', 'createReadStream']) {
    const original = fsDefault[name];
    if (typeof original !== 'function') continue;
    fsDefault[name] = function probed(path, ...rest) {
      checkPath(path);
      return original.call(this, path, ...rest);
    };
    originals.push([name, original]);
  }

  const promises = fsDefault.promises;
  const originalPromisesRead = promises && promises.readFile;
  if (typeof originalPromisesRead === 'function') {
    promises.readFile = function probed(path, ...rest) {
      checkPath(path);
      return originalPromisesRead.call(this, path, ...rest);
    };
  }
  const originalPromisesOpen = promises && promises.open;
  if (typeof originalPromisesOpen === 'function') {
    promises.open = function probed(path, ...rest) {
      checkPath(path);
      return originalPromisesOpen.call(this, path, ...rest);
    };
  }

  try {
    return await fn();
  } finally {
    for (const [name, original] of originals) fsDefault[name] = original;
    if (typeof originalPromisesRead === 'function') promises.readFile = originalPromisesRead;
    if (typeof originalPromisesOpen === 'function') promises.open = originalPromisesOpen;
  }
}
