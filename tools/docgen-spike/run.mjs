// run.mjs —— docgen spike 的编排层：CLI、环境、路径、baseline、清理、用例。
// 本文件允许 IO；纯函数模块（specTestCaseGate.mjs / compare.mjs）不得 import 本文件。
// Task 5 落 V1–V9；gate / compare / write-baseline / V10 / V10b / V11 的编排在 Task 6。
import { spawnSync } from 'node:child_process';
import {
  existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  BASELINE_RULES, SENTINEL_V4, SENTINEL_V10, TARGET_SIGNATURES,
  assertTemplateClean, buildData, render, renderBaseline, renderBlocks, validateData,
} from './specTestCaseGate.mjs';
import { compareBuffers } from './compare.mjs';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// 默认值即 spec §7.1 / §7.4 的固定路径。
// DOCGEN_TMP_ROOT / DOCGEN_RULES_DIR 只服务于测试隔离（e2e 在 os.tmpdir 里跑，避免与其他测试文件并发抢
// 仓库内 .tmp-test 与 rules/ 临时文件）；正常 CLI 与 npm run check 不设置它们。
function pathFromEnv(name, fallback) {
  if (process.env.DOCGEN_TEST_MODE !== '1') return fallback;
  const raw = process.env[name];
  return raw ? resolve(REPO_ROOT, raw) : fallback;
}

export const ROOT = pathFromEnv(
  'DOCGEN_TMP_ROOT',
  join(REPO_ROOT, 'tools', 'docgen-spike', '.tmp-test'),
);

export const RULES_DIR = pathFromEnv('DOCGEN_RULES_DIR', join(REPO_ROOT, 'rules'));

export const BASELINE_PATH = pathFromEnv(
  'DOCGEN_BASELINE_PATH',
  join(REPO_ROOT, 'tools', 'docgen-spike', 'baseline.json'),
);

export const TARGET_PATH = join(REPO_ROOT, 'rules', 'spec-testcase-gate.md');

export const TEMPLATE_PATH = join(REPO_ROOT, 'tools', 'docgen-spike', 'template.md');

export const RENDER_MODULE_PATH = join(dirname(fileURLToPath(import.meta.url)), 'specTestCaseGate.mjs');

// ImpureRender 静态扫描：render 模块图固定，源码级禁止任何 fs 模块导入。
// 运行时探针无法 patch node:fs/promises 的 ESM 命名导出（实测 read-only、configurable=false），
// 因此用静态扫描兜底：命中 fs / fs/promises 的导入语句即判 ImpureRender。
const FS_IMPORT_RE = /(?:from\s*['"]|require\(\s*['"])(?:node:)?fs(?:\/promises)?['"]/;

export const CASE_VALUES = Object.freeze([
  'V1', 'V2', 'V2b', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V10b', 'V11',
]);

// spec §7.1：19 个错误码 → 退出码。未列出的内部错误（fixture 解析等）按 IO/依赖层归 3。
export const EXIT_CODES = Object.freeze({
  MissingSlot: 1,
  MissingPlaceholder: 1,
  InvalidRuleType: 1,
  TemplateSyntaxError: 1,
  TemplateHardcoded: 1,
  ImpureRender: 1,
  Mismatch: 1,
  UnregisteredHandwritten: 2,
  InvalidBaseline: 2,
  InvalidBaselinePath: 2,
  DanglingBaselineEntry: 2,
  BaselineDrift: 2,
  EnvironmentEOL: 2,
  InvalidInputPath: 2,
  InvalidOutputPath: 2,
  GeneratedMissing: 3,
  TemplateReadFailed: 3,
  TargetReadFailed: 3,
  WriteFailed: 3,
});

export function exitCodeFor(code) {
  return EXIT_CODES[code] ?? 3;
}

// spec §6.3：UnregisteredHandwritten 必须带可操作指引，否则使用者会把受控变更当成 gate 坏了。
const UNREGISTERED_GUIDANCE =
  '规则新增属受控变更：把路径并入 `BASELINE_RULES`，重跑 `renderBaseline()` 覆盖 `baseline.json`。';

export function fail(code, fields = {}) {
  const err = new Error(fields.message ?? code);
  err.code = code;
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'message') continue;
    err[key] = value;
  }
  throw err;
}

const USAGE = [
  'usage: node tools/docgen-spike/run.mjs [--case <V1..V11|V2b|V10b>] [--gate] [--write-baseline] [--no-clean]',
  '       [--template <path>] [--target <path>] [--compare <path>] [--fixture <path>]',
  '       [--out <path>] [--baseline <path>] [--raw]',
].join('\n');

const VALUE_OPTIONS = new Set([
  '--case', '--compare', '--template', '--target', '--baseline', '--fixture', '--out',
]);

const FLAG_OPTIONS = new Set(['--gate', '--write-baseline', '--no-clean', '--raw']);

function invalidArgs(reason, message, extra = {}) {
  fail('InvalidArgs', {
    reason,
    message,
    usage: USAGE,
    exitCode: 2,
    ...extra,
  });
}

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
    invalidArgs('unknown-role', `未知的环境角色：${role}`, { role });
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

function defaultListRuleFiles(root) {
  try {
    return readdirSync(join(root, 'rules'))
      .filter((name) => name.endsWith('.md'))
      .sort()
      .map((name) => `rules/${name}`);
  } catch {
    return [];
  }
}

/**
 * spec §6.3 五步，只报第一个：
 * 结构 → 路径 → 悬空 → 漂移 → 基线外新增。
 */
export function checkBaseline(baselineText, options = {}) {
  const root = options.root ?? dirname(RULES_DIR);
  const path = options.path;
  const expected = options.expected ?? renderBaseline();
  const exists = options.exists ?? ((entry) => existsSync(join(root, entry)));
  const listRuleFiles = options.listRuleFiles ?? (() => defaultListRuleFiles(root));

  if (baselineText === null || baselineText === undefined) {
    fail('InvalidBaseline', { path, reason: 'unreadable', exitCode: 2 });
  }
  const raw = Buffer.isBuffer(baselineText) ? baselineText : Buffer.from(baselineText, 'utf8');
  const text = raw.toString('utf8');

  // 步 1：JSON 合法、数组、非空、无重复。
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    fail('InvalidBaseline', { path, reason: 'json', exitCode: 2 });
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    fail('InvalidBaseline', { path, reason: 'shape', exitCode: 2 });
  }
  if (new Set(parsed).size !== parsed.length) {
    fail('InvalidBaseline', { path, reason: 'duplicate', exitCode: 2 });
  }

  // 步 2：条目是字符串、形如 rules/<name>.md、不含 .. 或反斜杠。
  for (const entry of parsed) {
    const valid = typeof entry === 'string'
      && /^rules\/[^/\\]+\.md$/.test(entry)
      && !entry.includes('..');
    if (!valid) {
      fail('InvalidBaselinePath', { path: entry, entry, exitCode: 2 });
    }
  }

  // 步 3：条目指向的文件存在。
  for (const entry of parsed) {
    if (!exists(entry)) {
      fail('DanglingBaselineEntry', { path: entry, entry, exitCode: 2 });
    }
  }

  // 步 4：原始字节 === renderBaseline()（乱序、缺项、手改都在这里被抓）。
  const expectedBuffer = Buffer.isBuffer(expected) ? expected : Buffer.from(expected, 'utf8');
  if (!raw.equals(expectedBuffer)) {
    fail('BaselineDrift', { path, exitCode: 2 });
  }

  // 步 5：rules/*.md 的每个文件都必须在 baseline 中。
  const registered = new Set(parsed);
  for (const entry of listRuleFiles()) {
    if (!registered.has(entry)) {
      fail('UnregisteredHandwritten', {
        path: entry,
        entry,
        message: UNREGISTERED_GUIDANCE,
        exitCode: 2,
      });
    }
  }

  return { count: parsed.length, entries: parsed };
}

/**
 * 解析 CLI。互斥/枚举/值缺失 → InvalidArgs（exitCode 2）；
 * 覆盖路径越出 ROOT → InvalidInputPath / InvalidOutputPath（exitCode 2）。
 */
export function parseArgs(argv = []) {
  const opts = { gate: false, writeBaseline: false, noClean: false, raw: false };
  const values = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (FLAG_OPTIONS.has(arg)) {
      if (arg === '--gate') opts.gate = true;
      else if (arg === '--write-baseline') opts.writeBaseline = true;
      else if (arg === '--no-clean') opts.noClean = true;
      else opts.raw = true;
      continue;
    }
    if (VALUE_OPTIONS.has(arg)) {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) {
        invalidArgs('missing-value', `参数 ${arg} 缺少取值`, { option: arg });
      }
      values[arg] = value;
      i += 1;
      continue;
    }
    invalidArgs('unknown-option', `未知参数：${arg}`, { option: arg });
  }

  const modes = [];
  if (opts.gate) modes.push('--gate');
  if (values['--case'] !== undefined) modes.push('--case');
  if (opts.writeBaseline) modes.push('--write-baseline');
  if (values['--compare'] !== undefined) modes.push('--compare');
  if (modes.length > 1) {
    invalidArgs(
      'conflict',
      `参数互斥：${modes.join(' 与 ')} 不可同用（mutually exclusive）`,
      { args: modes },
    );
  }

  if (opts.writeBaseline && values['--baseline'] !== undefined) {
    invalidArgs(
      'conflict',
      '参数互斥：--write-baseline 与 --baseline 不可同用（mutually exclusive）',
      { args: ['--write-baseline', '--baseline'] },
    );
  }

  const caseValue = values['--case'];
  if (caseValue !== undefined && !CASE_VALUES.includes(caseValue)) {
    invalidArgs(
      'unknown-case',
      `非法 --case 值：${caseValue}；usage: --case <V1..V11|V2b|V10b>`,
      { value: caseValue },
    );
  }

  const inputPath = (option) => (
    values[option] === undefined ? null : assertInside(ROOT, values[option], 'input')
  );
  const paths = {
    template: inputPath('--template'),
    target: inputPath('--target'),
    baseline: inputPath('--baseline'),
    // fixture 不在 R14 的 ROOT 白名单内：允许指向仓库内只读 fixtures。
    fixture: values['--fixture'] === undefined ? null : resolve(values['--fixture']),
    out: values['--out'] === undefined
      ? null
      : assertInside(ROOT, values['--out'], 'output'),
    compare: inputPath('--compare'),
  };

  let mode = 'all';
  if (opts.gate) mode = 'gate';
  else if (caseValue !== undefined) mode = 'case';
  else if (opts.writeBaseline) mode = 'write-baseline';
  else if (paths.compare !== null) mode = 'compare';

  return {
    mode,
    case: caseValue ?? null,
    compare: paths.compare,
    noClean: opts.noClean,
    raw: opts.raw,
    paths,
  };
}

// ── 清理（spec §7.4 / R11）────────────────────────────────────────────────────

const trackedTempFiles = new Set();
let rootOwned = false;
let hooksRegistered = false;

export function trackTempFile(file) {
  trackedTempFiles.add(resolve(file));
}

export function cleanupSync() {
  for (const file of [...trackedTempFiles]) {
    try {
      rmSync(file, { force: true });
    } catch {
      // 删除失败则保留，由下次启动清理。
    }
  }
  trackedTempFiles.clear();
  if (rootOwned) {
    try {
      rmSync(ROOT, { recursive: true, force: true });
    } catch {
      // 同上：删不掉就留给下次启动。
    }
    rootOwned = false;
  }
}

export function registerCleanupHooks() {
  if (hooksRegistered) return;
  hooksRegistered = true;
  process.on('exit', cleanupSync);
  process.on('SIGINT', () => {
    cleanupSync();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    cleanupSync();
    process.exit(143);
  });
}

function healSentinels() {
  const sentinels = [
    { file: join(RULES_DIR, 'tmp-new-rule-V4.md'), content: SENTINEL_V4 },
    { file: join(RULES_DIR, 'tmp-new-rule-V10.md'), content: SENTINEL_V10 },
  ];
  for (const { file, content } of sentinels) {
    if (!existsSync(file)) continue;
    const actual = readFileSync(file, 'utf8');
    if (actual === content) {
      rmSync(file, { force: true });
      console.log(`已清理上次中断残留：${relative(REPO_ROOT, file)}`);
      continue;
    }
    // 近失 / 非哨兵内容不得删：fail-closed，交给 baseline 步 5 报 UnregisteredHandwritten。
    fail('UnregisteredHandwritten', {
      path: relative(REPO_ROOT, file),
      message: UNREGISTERED_GUIDANCE,
      exitCode: 2,
    });
  }
}

/**
 * 启动：只清 ROOT（--no-clean 跳过）→ 重建 ROOT → 对 V4/V10 唯一临时文件做哨兵自愈。
 */
export function prepareRoot({ noClean = false } = {}) {
  if (!noClean) {
    rmSync(ROOT, { recursive: true, force: true });
    trackedTempFiles.clear();
    rootOwned = true;
  }
  mkdirSync(ROOT, { recursive: true });
  if (!noClean) healSentinels();
  return ROOT;
}

// ── 用例（spec §7.3；Task 5 只实现 V1–V9）────────────────────────────────────

const MISMATCH_GUIDANCE =
  '`rules/spec-testcase-gate.md` 是生成视图，内容源在 `tools/docgen-spike/specTestCaseGate.mjs::buildData()`。';

function caseFail(name, detail) {
  const err = new Error(detail);
  err.code = 'CaseFail';
  err.caseName = name;
  err.exitCode = 1;
  throw err;
}

function inputPath(ctx, key, fallback) {
  const value = ctx && ctx.paths ? ctx.paths[key] : null;
  return value || fallback;
}

function readInputBuffer(file, code, exitCode) {
  try {
    return readFileSync(file);
  } catch (err) {
    fail(code, {
      path: file,
      exitCode,
      message: `${code}：${file}（${err.code ?? err.message}）`,
    });
  }
}

function readBaselineBuffer(file) {
  try {
    return readFileSync(file);
  } catch {
    fail('InvalidBaseline', {
      path: file,
      reason: 'unreadable',
      exitCode: 2,
      message: `InvalidBaseline：无法读取 ${file}`,
    });
  }
}

function caught(fn) {
  try {
    fn();
    return null;
  } catch (err) {
    return err;
  }
}

async function caughtAsync(fn) {
  try {
    await fn();
    return null;
  } catch (err) {
    return err;
  }
}

function expectFields(name, err, code, fields = []) {
  if (!err) caseFail(name, `期望 ${code}，实际无错误`);
  if (err.code !== code) caseFail(name, `期望 ${code}，实际 ${err.code ?? err.message}`);
  for (const field of fields) {
    if (err[field] === undefined || err[field] === null || err[field] === '') {
      caseFail(name, `${code} 缺少字段 ${field}`);
    }
  }
  return err;
}

function expectCode(name, fn, code) {
  const err = caught(fn);
  if (!err) caseFail(name, `期望 ${code}，实际无错误`);
  if (err.code !== code) caseFail(name, `期望 ${code}，实际 ${err.code ?? err.message}`);
  return err;
}

function caseDir(name) {
  return join(ROOT, name);
}

function ensureCaseDir(name) {
  const dir = caseDir(name);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function removeCaseDir(name) {
  rmSync(caseDir(name), { recursive: true, force: true });
}

function serializeBaseline(entries) {
  return `${JSON.stringify(entries, null, 2)}\n`;
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

function loadInputs(ctx) {
  const targetPath = inputPath(ctx, 'target', TARGET_PATH);
  const templatePath = inputPath(ctx, 'template', TEMPLATE_PATH);
  const baselinePath = inputPath(ctx, 'baseline', BASELINE_PATH);
  const targetBuf = readInputBuffer(targetPath, 'TargetReadFailed', 3);
  const templateBuf = readInputBuffer(templatePath, 'TemplateReadFailed', 3);
  const baselineBuf = readBaselineBuffer(baselinePath);
  checkEnvironment(targetBuf, 'target', targetPath);
  checkEnvironment(templateBuf, 'template', templatePath);
  checkEnvironment(baselineBuf, 'baseline', baselinePath);
  return {
    targetPath, templatePath, baselinePath, targetBuf, templateBuf, baselineBuf,
  };
}

/**
 * spec §7.2 七步 gate：环境 → baseline → 模板 → 模板硬编码 → 数据校验 → 渲染（探针）→ 比对。
 * 任一步失败按 §7.1 的错误码/退出码抛错；全部通过打印 `baseline 21/21`。
 */
export async function runGate(ctx = {}) {
  const targetPath = inputPath(ctx, 'target', TARGET_PATH);
  const baselinePath = inputPath(ctx, 'baseline', BASELINE_PATH);
  const targetBuf = readInputBuffer(targetPath, 'TargetReadFailed', 3);
  const baselineBuf = readBaselineBuffer(baselinePath);
  checkEnvironment(targetBuf, 'target', targetPath);
  checkEnvironment(baselineBuf, 'baseline', baselinePath);
  const { count } = checkBaseline(baselineBuf, { path: baselinePath });

  const templatePath = inputPath(ctx, 'template', TEMPLATE_PATH);
  const templateBuf = readInputBuffer(templatePath, 'TemplateReadFailed', 3);
  checkEnvironment(templateBuf, 'template', templatePath);
  const template = templateBuf.toString('utf8');
  assertTemplateClean(template);

  const data = validateData(buildData());
  const renderSource = readFileSync(RENDER_MODULE_PATH, 'utf8');
  const rendered = await withReadProbe(() => render(data, template), [targetPath], [renderSource]);

  const diff = compareBuffers(Buffer.from(rendered, 'utf8'), targetBuf);
  if (diff) {
    console.log(`Mismatch line=${diff.line} byte=${diff.byte}`);
    console.log(MISMATCH_GUIDANCE);
    fail('Mismatch', {
      line: diff.line,
      byte: diff.byte,
      exitCode: 1,
      message: `Mismatch line=${diff.line} byte=${diff.byte}：${MISMATCH_GUIDANCE}`,
    });
  }

  console.log(`baseline ${count}/${BASELINE_RULES.length}`);
  return { count, rendered };
}

/** `--compare <path>`：只与 target 比对；generated 副本不预检 EOL/BOM（spec §6.2 / R8）。 */
export function runCompare(file, ctx = {}) {
  let generated;
  try {
    generated = readFileSync(file);
  } catch (err) {
    fail('GeneratedMissing', {
      path: file,
      exitCode: 3,
      message: `GeneratedMissing：${file}（${err.code ?? err.message}）`,
    });
  }

  const targetPath = inputPath(ctx, 'target', TARGET_PATH);
  const targetBuf = readInputBuffer(targetPath, 'TargetReadFailed', 3);
  checkEnvironment(targetBuf, 'target', targetPath);

  const diff = compareBuffers(generated, targetBuf);
  if (diff) {
    console.log(`Mismatch line=${diff.line} byte=${diff.byte}`);
    console.log(MISMATCH_GUIDANCE);
    fail('Mismatch', {
      line: diff.line,
      byte: diff.byte,
      exitCode: 1,
      message: `Mismatch line=${diff.line} byte=${diff.byte}：${MISMATCH_GUIDANCE}`,
    });
  }
  console.log(`compare 一致：${file}`);
  return { count: generated.length };
}

/** `--write-baseline`：只写默认 baseline.json，不碰 target / template（spec §7.1）。 */
export function runWriteBaseline(path = BASELINE_PATH) {
  writeGenerated(path, Buffer.from(renderBaseline(), 'utf8'));
  console.log(`baseline 已写入：${relative(REPO_ROOT, path)}（${BASELINE_RULES.length} 条）`);
  return { path, count: BASELINE_RULES.length };
}

/** 落盘统一包装：失败 → WriteFailed（path / errno / exit 3）。 */
export function writeGenerated(file, buffer) {
  try {
    writeFileSync(file, buffer);
  } catch (err) {
    fail('WriteFailed', {
      path: file,
      errno: err.code ?? 'UNKNOWN',
      exitCode: 3,
      message: `WriteFailed：${file}（${err.code ?? err.message}）`,
    });
  }
}

function checkAllWired() {
  try {
    const src = readFileSync(join(REPO_ROOT, 'scripts', 'check-all.mjs'), 'utf8');
    return src.includes('docgen-spike/run.mjs') && src.includes("'--gate'");
  } catch {
    return false;
  }
}

/**
 * 嵌套 check（V10 / V10b）：`DOCGEN_CHECK_ACTIVE=1` 或 check-all 尚未接线时返回 null，
 * 由用例改用直接 gate（spec §7.2 的跳过语义）。
 */
function nestedCheck() {
  if (process.env.DOCGEN_CHECK_ACTIVE === '1' || !checkAllWired()) return null;
  const result = spawnSync('npm run check', {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    shell: true,
    env: { ...process.env, DOCGEN_CHECK_ACTIVE: '1', DOCGEN_NESTED: '1' },
    maxBuffer: 64 * 1024 * 1024,
  });
  return { status: result.status, output: `${result.stdout ?? ''}${result.stderr ?? ''}` };
}

// V2 的固定构造（TC-023）：第 1 个 0x0A 之后第 1 个非 0x0A 字节。
function firstMutatedOffset(buffer) {
  const firstNewline = buffer.indexOf(0x0a);
  if (firstNewline < 0) return 0;
  let index = firstNewline + 1;
  while (index < buffer.length && buffer[index] === 0x0a) index += 1;
  return index < buffer.length ? index : buffer.length - 1;
}

async function caseV1(ctx) {
  const inputs = loadInputs(ctx);
  const { count } = checkBaseline(inputs.baselineBuf, { path: inputs.baselinePath });
  const data = validateData(buildData());
  const template = inputs.templateBuf.toString('utf8');
  const rendered = await withReadProbe(() => render(data, template), [inputs.targetPath]);
  const diff = compareBuffers(Buffer.from(rendered, 'utf8'), inputs.targetBuf);
  if (diff) {
    console.log(`Mismatch line=${diff.line} byte=${diff.byte}`);
    console.log(MISMATCH_GUIDANCE);
    caseFail('V1', `渲染结果与 target 不一致（line=${diff.line} byte=${diff.byte}）`);
  }
  console.log(`baseline ${count}/${BASELINE_RULES.length}`);
}

async function caseV2(ctx) {
  const inputs = loadInputs(ctx);
  const rendered = Buffer.from(render(buildData(), inputs.templateBuf.toString('utf8')), 'utf8');
  const mutated = Buffer.from(rendered);
  const offset = firstMutatedOffset(mutated);
  mutated[offset] = 0x40;
  const dir = ensureCaseDir('V2');
  try {
    const outPath = join(dir, 'generated.md');
    writeFileSync(outPath, mutated);
    const diff = compareBuffers(readFileSync(outPath), inputs.targetBuf);
    if (!diff || diff.code !== 'Mismatch') {
      caseFail('V2', '副本改 1 个 ASCII 字节后期望 Mismatch，实际逐字节相等');
    }
    console.log(`Mismatch line=${diff.line} byte=${diff.byte}`);
    console.log(MISMATCH_GUIDANCE);
  } finally {
    removeCaseDir('V2');
  }
}

async function caseV2b(ctx) {
  const inputs = loadInputs(ctx);
  const rendered = Buffer.from(render(buildData(), inputs.templateBuf.toString('utf8')), 'utf8');
  let newline = rendered.indexOf(0x0a, Math.floor(rendered.length / 2));
  if (newline < 0) newline = rendered.lastIndexOf(0x0a);
  if (newline < 0) caseFail('V2b', '渲染结果里没有换行可替换');
  const crlf = Buffer.concat([
    rendered.subarray(0, newline),
    Buffer.from('\r\n', 'utf8'),
    rendered.subarray(newline + 1),
  ]);
  const dir = ensureCaseDir('V2b');
  try {
    const outPath = join(dir, 'generated-crlf.md');
    writeFileSync(outPath, crlf);
    const diff = compareBuffers(readFileSync(outPath), inputs.targetBuf);
    if (!diff || diff.code !== 'Mismatch') {
      caseFail('V2b', '把 \\n 换成 \\r\\n 后期望 Mismatch（不得做 EOL 归一），实际逐字节相等');
    }
    console.log(`Mismatch line=${diff.line} byte=${diff.byte}`);
  } finally {
    removeCaseDir('V2b');
  }
}

async function caseV3() {
  const base = buildData();
  const thirdName = base.criteria[2] && base.criteria[2].name;
  if (!thirdName) caseFail('V3', '默认数据缺少第 3 条判据');
  for (const value of ['', '   ', 'TODO', '\t\n', '\u3000']) {
    const data = structuredClone(base);
    const index = data.criteria.findIndex((criterion) => criterion.name === thirdName);
    if (index < 0) caseFail('V3', `未找到判据 ${thirdName}`);
    data.criteria[index].pass = value;
    const err = expectCode('V3', () => validateData(data), 'MissingSlot');
    if (!String(err.slot).startsWith('criteria.')
      || !String(err.slot).endsWith('.pass')
      || !String(err.slot).includes(thirdName)) {
      caseFail('V3', `slot 未指向该格：${err.slot}`);
    }
    console.log(`MissingSlot slot=${err.slot}`);
  }
  if (existsSync(caseDir('V3'))) caseFail('V3', 'V3 不应产生输出文件');
}

async function caseV4() {
  const inputs = loadInputs({});
  const file = join(RULES_DIR, 'tmp-new-rule-V4.md');
  trackTempFile(file);
  try {
    writeFileSync(file, SENTINEL_V4, 'utf8');
    const err = expectCode(
      'V4',
      () => checkBaseline(inputs.baselineBuf, { path: inputs.baselinePath }),
      'UnregisteredHandwritten',
    );
    if (!String(err.path).endsWith('rules/tmp-new-rule-V4.md')
      && !String(err.path).endsWith('rules\\tmp-new-rule-V4.md')) {
      caseFail('V4', `path 未指向唯一临时文件：${err.path}`);
    }
    if (!/BASELINE_RULES/.test(err.message) || !/renderBaseline/.test(err.message)) {
      caseFail('V4', 'UnregisteredHandwritten 缺少可操作指引');
    }
    console.log(`UnregisteredHandwritten path=${String(err.path).replaceAll('\\', '/')}`);
    console.log(err.message);
  } finally {
    rmSync(file, { force: true });
  }
  if (existsSync(file)) caseFail('V4', '临时规则文件未被删除');
}

function loadFixture(file) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (err) {
    fail('FixtureError', {
      path: file,
      exitCode: 3,
      message: `fixture 读取失败：${file}（${err.code ?? err.message}）`,
    });
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    fail('FixtureError', { path: file, exitCode: 3, message: `fixture 非 JSON：${file}` });
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    fail('FixtureError', { path: file, exitCode: 3, message: `fixture 必须是对象：${file}` });
  }
  return parsed;
}

function applyFixture(data, fixture) {
  for (const key of Object.keys(fixture)) {
    if (!(key in data)) {
      const err = new Error(`fixture 含未声明键：${key}`);
      err.exitCode = 3;
      throw err;
    }
  }
  // spec §4.3：浅覆盖 = 整键替换（嵌套对象必须给全子键）。
  return { ...data, ...fixture };
}

async function caseV5(ctx) {
  const base = buildData();
  validateData(structuredClone(base));
  if (base.criteria.length !== 5) {
    caseFail('V5', `默认数据期望 5 格判据，实际 ${base.criteria.length}`);
  }
  console.log(`V5 默认数据：applicability=${base.applicability} polarity=${base.polarity} criteria=${base.criteria.length} 格`);

  const fixturePath = ctx && ctx.paths ? ctx.paths.fixture : null;
  if (fixturePath) {
    // --fixture 选择本例输入：非法类型 fixture → InvalidRuleType；合法 fixture → 通过。
    const fixture = loadFixture(fixturePath);
    const err = caught(() => validateData(applyFixture(structuredClone(base), fixture)));
    if (err) {
      if (err.code !== 'InvalidRuleType') {
        caseFail('V5', `fixture 期望 InvalidRuleType，实际 ${err.code ?? err.message}`);
      }
      console.log(`InvalidRuleType field=${err.field} value=${err.value}`);
    } else {
      console.log(`V5 fixture 合法：${fixturePath}`);
    }
    return;
  }

  const variants = [
    { field: 'polarity', value: 'ban', data: { ...structuredClone(base), polarity: 'ban' } },
    { field: 'applicability', value: 'sometimes', data: { ...structuredClone(base), applicability: 'sometimes' } },
  ];
  for (const variant of variants) {
    const err = expectCode('V5', () => validateData(variant.data), 'InvalidRuleType');
    if (err.field !== variant.field || err.value !== variant.value) {
      caseFail('V5', `InvalidRuleType 字段不符：field=${err.field} value=${err.value}`);
    }
    console.log(`InvalidRuleType field=${err.field} value=${err.value}`);
  }
}

async function caseV6(ctx) {
  const inputs = loadInputs(ctx);
  const dir = ensureCaseDir('V6');
  const stubPath = join(dir, 'impureStub.mjs');
  const stubSource = [
    "import { open } from 'node:fs/promises';",
    `const TARGET = ${JSON.stringify(inputs.targetPath)};`,
    'export async function render() {',
    "  const handle = await open(TARGET, 'r');",
    '  const buf = Buffer.alloc(16);',
    '  await handle.read(buf, 0, 16, 0);',
    '  await handle.close();',
    "  return buf.toString('utf8');",
    '}',
    '',
  ].join('\n');
  writeFileSync(stubPath, stubSource, 'utf8');
  try {
    const err = await (async () => {
      try {
        await withReadProbe(async () => {
          const stub = await import(pathToFileURL(stubPath).href);
          await stub.render();
        }, [inputs.targetPath], [stubSource]);
        return null;
      } catch (caughtErr) {
        return caughtErr;
      }
    })();
    if (!err || err.code !== 'ImpureRender') {
      caseFail('V6', `impure render 期望 ImpureRender，实际 ${err ? err.code ?? err.message : '无错误'}`);
    }
    console.log(`ImpureRender path=${err.path}`);

    const template = inputs.templateBuf.toString('utf8');
    const hits = TARGET_SIGNATURES.filter((snippet) => template.includes(snippet));
    if (hits.length > 0) caseFail('V6', `模板含 ${hits.length} 段 target 特征串`);
    console.log(`V6 模板签名 0/${TARGET_SIGNATURES.length}`);

    try {
      await withReadProbe(() => render(buildData(), template), [inputs.targetPath]);
    } catch (probeErr) {
      caseFail('V6', `真实 render 在探针下触发 ${probeErr.code ?? probeErr.message}`);
    }

    const base = buildData();
    const added = structuredClone(base);
    added.criteria.push({
      id: '新增判据V6', no: 6, name: '新增判据V6', pass: '用于验证增删同步',
    });
    if (!renderBlocks(added).criteriaTable.includes('| 6 | **新增判据V6** | 用于验证增删同步 |')) {
      caseFail('V6', '新增判据未同步到判据表');
    }
    const removed = structuredClone(base);
    const removedName = removed.criteria.splice(2, 1)[0].name;
    if (renderBlocks(removed).criteriaTable.includes(`**${removedName}**`)) {
      caseFail('V6', '删除判据后判据表仍有该行');
    }
    console.log('V6 判据增删：+1/-1 同步');
  } finally {
    removeCaseDir('V6');
  }
}

async function caseV7(ctx) {
  const inputs = loadInputs(ctx);
  const parsed = JSON.parse(inputs.baselineBuf.toString('utf8'));
  const dir = ensureCaseDir('V7');
  const variants = [
    { file: 'valid.json', display: '合法副本', content: inputs.baselineBuf.toString('utf8'), expected: null },
    { file: 'drift.json', display: '删除一条', content: serializeBaseline(parsed.slice(0, -1)), expected: 'BaselineDrift' },
    { file: 'duplicate.json', display: '重复条目', content: serializeBaseline([...parsed, parsed[0]]), expected: 'InvalidBaseline' },
    { file: 'dangling.json', display: '悬空条目', content: serializeBaseline([...parsed, 'rules/does-not-exist.md']), expected: 'DanglingBaselineEntry' },
    { file: 'empty.json', display: '空数组', content: '[]\n', expected: 'InvalidBaseline' },
    { file: 'dotdot.json', display: '含点段', content: serializeBaseline([...parsed, 'rules/../rules/x.md']), expected: 'InvalidBaselinePath' },
    { file: 'backslash.json', display: '含反斜杠', content: serializeBaseline([...parsed, 'rules\\x.md']), expected: 'InvalidBaselinePath' },
    { file: 'reordered.json', display: '乱序', content: serializeBaseline([...parsed].reverse()), expected: 'BaselineDrift' },
    { file: 'dangling-before-drift.json', display: '删一条+悬空', content: serializeBaseline([...parsed.slice(0, -1), 'rules/nope.md']), expected: 'DanglingBaselineEntry' },
    { file: 'duplicate-before-path.json', display: '重复+非法路径', content: serializeBaseline([...parsed, parsed[0], 'rules/../rules/x.md']), expected: 'InvalidBaseline' },
  ];
  try {
    for (const variant of variants) {
      const copyPath = join(dir, variant.file);
      writeFileSync(copyPath, variant.content, 'utf8');
      const err = caught(() => checkBaseline(variant.content, { path: copyPath }));
      if (variant.expected === null) {
        if (err) caseFail('V7', `[${variant.display}] 期望通过，实际 ${err.code ?? err.message}`);
        console.log(`V7 [${variant.display}] 通过（${BASELINE_RULES.length} 条）`);
        continue;
      }
      if (!err || err.code !== variant.expected) {
        caseFail('V7', `[${variant.display}] 期望 ${variant.expected}，实际 ${err ? err.code ?? err.message : '无错误'}`);
      }
      console.log(`V7 [${variant.display}] ${err.code}${err.path ? ` path=${String(err.path).replaceAll('\\', '/')}` : ''}`);
    }
  } finally {
    removeCaseDir('V7');
  }
}

function expectEnvironment(file, role, violation) {
  const buf = readFileSync(file);
  try {
    checkEnvironment(buf, role, file);
  } catch (err) {
    if (err.code !== 'EnvironmentEOL') caseFail('V8', `期望 EnvironmentEOL，实际 ${err.code ?? err.message}`);
    if (err.violation !== violation) {
      caseFail('V8', `期望 violation=${violation}，实际 ${err.violation}`);
    }
    if (resolve(err.path) !== resolve(file)) caseFail('V8', `path 未指向副本：${err.path}`);
    console.log(`EnvironmentEOL violation=${err.violation} path=${err.path}`);
    return;
  }
  caseFail('V8', `[${role}] 期望 EnvironmentEOL(${violation})，实际通过`);
}

async function caseV8(ctx) {
  const inputs = loadInputs(ctx);
  const dir = ensureCaseDir('V8');
  const toCrlf = (buffer) => Buffer.from(buffer.toString('utf8').replace(/\r?\n/g, '\r\n'), 'utf8');
  try {
    const templateCrlf = join(dir, 'rule.md.tpl');
    writeFileSync(templateCrlf, toCrlf(inputs.templateBuf));
    expectEnvironment(templateCrlf, 'template', 'CR');

    const targetCr = join(dir, 'target-cr.md');
    writeFileSync(targetCr, toCrlf(inputs.targetBuf));
    expectEnvironment(targetCr, 'target', 'CR');

    const targetBom = join(dir, 'target-bom.md');
    writeFileSync(targetBom, Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), inputs.targetBuf]));
    expectEnvironment(targetBom, 'target', 'BOM');

    const targetInvalid = join(dir, 'target-invalid.md');
    const middle = Math.floor(inputs.targetBuf.length / 2);
    writeFileSync(targetInvalid, Buffer.concat([
      inputs.targetBuf.subarray(0, middle),
      Buffer.from([0xff]),
      inputs.targetBuf.subarray(middle),
    ]));
    expectEnvironment(targetInvalid, 'target', 'INVALID_UTF8');

    const baselineCr = join(dir, 'baseline-cr.json');
    writeFileSync(baselineCr, toCrlf(inputs.baselineBuf));
    expectEnvironment(baselineCr, 'baseline', 'CR');
  } finally {
    removeCaseDir('V8');
  }
}

function gitStatus(paths) {
  const result = spawnSync('git', ['status', '--short', ...paths], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  if (result.status !== 0) caseFail('V9', `git status 失败：${result.stderr}`);
  return result.stdout;
}

// 沙箱模式下（e2e 与其他测试文件并行），其他测试可能瞬时创建 rules/tmp-new-rule-* 文件；
// 这些行不属于 V9 的残留判据，过滤后再比 before/after。默认模式（真实 rules/）不过滤。
function normalizeGitStatus(text) {
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  const filtered = process.env.DOCGEN_TEST_MODE === '1' && process.env.DOCGEN_RULES_DIR
    ? lines.filter((line) => !/rules[\/\\]tmp-new-rule-/.test(line))
    : lines;
  return filtered.sort().join('\n');
}

async function caseV9() {
  const names = ['V1', 'V2', 'V2b', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V10', 'V10b', 'V11'];
  const before = {
    rules: normalizeGitStatus(gitStatus(['rules/'])),
    tools: normalizeGitStatus(gitStatus(['tools/docgen-spike/'])),
  };

  const runPass = () => names.map((name) => {
    const result = spawnSync(process.execPath, [
      fileURLToPath(import.meta.url), '--case', name, '--no-clean',
    ], { cwd: REPO_ROOT, encoding: 'utf8' });
    if (result.status !== 0) {
      caseFail('V9', `${name} 退出码 ${result.status}：${result.stderr || result.stdout}`);
    }
    if (!new RegExp(`^PASS ${name}$`, 'm').test(result.stdout)) {
      caseFail('V9', `${name} 未输出 PASS`);
    }
    return `${result.stdout}${result.stderr}`;
  });

  const first = runPass();
  const firstResidue = existsSync(ROOT) ? readdirSync(ROOT) : [];
  if (firstResidue.length > 0) caseFail('V9', `第一遍后有残留：${firstResidue.join(',')}`);

  const second = runPass();
  for (let i = 0; i < names.length; i += 1) {
    if (first[i] !== second[i]) caseFail('V9', `${names[i]} 两遍输出不一致`);
  }

  const after = {
    rules: normalizeGitStatus(gitStatus(['rules/'])),
    tools: normalizeGitStatus(gitStatus(['tools/docgen-spike/'])),
  };
  if (after.rules !== before.rules) caseFail('V9', 'rules/ 的 git status 出现新增变化');
  if (after.tools !== before.tools) caseFail('V9', 'tools/docgen-spike/ 的 git status 出现新增残留');

  const ignore = spawnSync('git', ['check-ignore', '-q', 'tools/docgen-spike/.tmp-test/x'], {
    cwd: REPO_ROOT,
  });
  if (ignore.status !== 0) caseFail('V9', 'git check-ignore 退出码非 0');

  const secondResidue = existsSync(ROOT) ? readdirSync(ROOT) : [];
  if (secondResidue.length > 0) caseFail('V9', `第二遍后有残留：${secondResidue.join(',')}`);

  console.log(`V9 两遍输出逐字一致（${names.length} 例 × 2 遍；V9 自身不递归）`);
  console.log('V9 git status 无新增、git check-ignore 0、无残留');
}

// V10：基线外新增唯一临时规则 → 嵌套 check 非 0 且含 UnregisteredHandwritten。
// check-all 尚未接线（Task 7）时退化为直接 gate，避免在接线前伪造 PASS。
async function caseV10() {
  const file = join(RULES_DIR, 'tmp-new-rule-V10.md');
  trackTempFile(file);
  try {
    writeFileSync(file, SENTINEL_V10, 'utf8');
    const nested = nestedCheck();
    if (nested) {
      if (nested.status === 0) {
        caseFail('V10', '嵌套 check 退出码 0（gate 未接线或未守 baseline）');
      }
      if (!/UnregisteredHandwritten/.test(nested.output)) {
        caseFail('V10', '嵌套 check 输出缺少 UnregisteredHandwritten');
      }
      console.log(`V10 嵌套 check 退出码 ${nested.status}，命中 UnregisteredHandwritten`);
      console.log('UnregisteredHandwritten');
    } else {
      const err = expectCode(
        'V10',
        () => checkBaseline(readFileSync(BASELINE_PATH), { path: BASELINE_PATH }),
        'UnregisteredHandwritten',
      );
      console.log('check-all 尚未接线（Task 7）：V10 以直接 gate 校验代替嵌套 check');
      console.log(`UnregisteredHandwritten path=${String(err.path).replaceAll('\\', '/')}`);
      console.log(err.message);
    }
  } finally {
    rmSync(file, { force: true });
  }
  if (existsSync(file)) caseFail('V10', '临时规则文件未被删除');
}

// V10b：前半 target 副本改 1 字节 → gate 报 Mismatch；后半干净树 check 绿。
async function caseV10b(ctx) {
  const inputs = loadInputs(ctx);
  const dir = ensureCaseDir('V10b');
  try {
    const copy = join(dir, 'target.md');
    const mutated = Buffer.from(inputs.targetBuf);
    const offset = firstMutatedOffset(mutated);
    mutated[offset] = mutated[offset] === 0x40 ? 0x41 : 0x40;
    writeFileSync(copy, mutated);

    const gateCtx = { ...ctx, paths: { ...(ctx.paths ?? {}), target: copy } };
    const err = await caughtAsync(() => runGate(gateCtx));
    if (!err || err.code !== 'Mismatch') {
      caseFail('V10b', `前半期望 Mismatch，实际 ${err ? err.code ?? err.message : '无错误'}`);
    }
    console.log(`Mismatch line=${err.line} byte=${err.byte}`);
    console.log(MISMATCH_GUIDANCE);
  } finally {
    removeCaseDir('V10b');
  }

  const nested = nestedCheck();
  if (nested) {
    if (nested.status !== 0) {
      caseFail('V10b', `干净树 check 退出码 ${nested.status}：${nested.output.slice(-500)}`);
    }
    if (!/baseline 21\/21/.test(nested.output)) {
      caseFail('V10b', '干净树 check 输出缺少 baseline 21/21');
    }
    console.log('baseline 21/21');
    console.log('V10b 干净树 check 退出码 0');
    return;
  }

  await runGate(ctx);
  console.log('check-all 尚未接线（Task 7）：V10b 以直接 gate 校验代替干净树 check');
}

// V11：六个故障注入，逐个断言错误码与必需字段。
async function caseV11(ctx) {
  const dir = ensureCaseDir('V11');
  try {
    const checks = [];

    const unknown = caught(() => render(buildData(), '## A\n\n{{nope}}\n'));
    checks.push(expectFields('V11', unknown, 'MissingPlaceholder', ['key']));

    const unclosed = caught(() => render(buildData(), '## A\n\n{{title\n'));
    checks.push(expectFields('V11', unclosed, 'TemplateSyntaxError', ['line']));

    const missingGen = caught(() => runCompare(join(dir, 'missing.md'), ctx));
    checks.push(expectFields('V11', missingGen, 'GeneratedMissing', ['path']));

    const badOut = caught(() => parseArgs(['--case', 'V11', '--out', 'rules/x.md']));
    checks.push(expectFields('V11', badOut, 'InvalidOutputPath', ['path']));

    const missingTpl = await caughtAsync(() => runGate({
      ...ctx,
      paths: { ...(ctx.paths ?? {}), template: join(dir, 'nope.tpl') },
    }));
    checks.push(expectFields('V11', missingTpl, 'TemplateReadFailed', ['path']));

    const adir = join(dir, 'adir');
    mkdirSync(adir, { recursive: true });
    const dirOut = caught(() => writeGenerated(adir, Buffer.from('x', 'utf8')));
    checks.push(expectFields('V11', dirOut, 'WriteFailed', ['path', 'errno']));

    for (const err of checks) {
      const fields = ['key', 'line', 'path', 'errno']
        .filter((field) => err[field] !== undefined)
        .map((field) => `${field}=${String(err[field]).replaceAll('\\', '/')}`)
        .join(' ');
      console.log(`${err.code} ${fields}`.trim());
    }
  } finally {
    removeCaseDir('V11');
  }
}

const CASE_HANDLERS = {
  V1: caseV1,
  V2: caseV2,
  V2b: caseV2b,
  V3: caseV3,
  V4: caseV4,
  V5: caseV5,
  V6: caseV6,
  V7: caseV7,
  V8: caseV8,
  V9: caseV9,
  V10: caseV10,
  V10b: caseV10b,
  V11: caseV11,
};

export const FULL_ORDER = Object.freeze([
  'V1', 'V2', 'V2b', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V10b', 'V11',
]);

/**
 * 跑单个用例：命中期望 → 打印 `PASS V<n>` 并返回 true；
 * 用例期望未命中 → 打印 `FAIL V<n>` 并返回 false（调用方 exit 1）；
 * 前置错误（EnvironmentEOL / baseline / IO）向上抛，由 report 按码退出。
 */
export async function runCase(name, ctx = {}) {
  const handler = CASE_HANDLERS[name];
  if (!handler) {
    fail('NotImplemented', {
      exitCode: 1,
      message: `用例 ${name} 尚未实现（plan Task 6）`,
    });
  }
  try {
    await handler(ctx);
    console.log(`PASS ${name}`);
    return true;
  } catch (err) {
    if (err.code === 'CaseFail') {
      console.log(`FAIL ${name}`);
      console.error(`detail: ${err.message}`);
      return false;
    }
    throw err;
  }
}

// ── 入口 ─────────────────────────────────────────────────────────────────────

function report(err, raw) {
  const code = raw ? 2 : (err.exitCode ?? exitCodeFor(err.code));
  process.exitCode = code;
  const message = raw
    ? (err.raw ?? err.message)
    : `${err.code ?? 'Error'}: ${err.message}`;
  console.error(message);
  if (err.usage && !raw) console.error(err.usage);
  return code;
}

export async function main(argv = process.argv.slice(2)) {
  registerCleanupHooks();

  let args;
  try {
    args = parseArgs(argv);
  } catch (err) {
    return report(err, argv.includes('--raw'));
  }

  try {
    prepareRoot({ noClean: args.noClean });
    if (args.mode === 'gate') {
      await runGate(args);
      return process.exitCode ?? 0;
    }
    if (args.mode === 'compare') {
      runCompare(args.compare, args);
      return process.exitCode ?? 0;
    }
    if (args.mode === 'write-baseline') {
      runWriteBaseline();
      return process.exitCode ?? 0;
    }
    if (args.mode === 'case') {
      const pass = await runCase(args.case, args);
      console.log(`${pass ? 1 : 0}/${FULL_ORDER.length} PASS`);
      if (!pass) process.exitCode = 1;
      return process.exitCode ?? 0;
    }

    let passed = 0;
    for (const name of FULL_ORDER) {
      if (await runCase(name, args)) passed += 1;
    }
    console.log(`${passed}/${FULL_ORDER.length} PASS`);
    if (passed !== FULL_ORDER.length) process.exitCode = 1;
    return process.exitCode ?? 0;
  } catch (err) {
    return report(err, args.raw);
  }
}

function isDirectRun() {
  if (!process.argv[1]) return false;
  try {
    const invoked = realpathSync(process.argv[1]);
    const self = realpathSync(fileURLToPath(import.meta.url));
    return process.platform === 'win32'
      ? invoked.toLowerCase() === self.toLowerCase()
      : invoked === self;
  } catch {
    return false;
  }
}

if (isDirectRun()) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 3;
  });
}
