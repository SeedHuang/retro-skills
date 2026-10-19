import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync,
  unlinkSync, writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  BASELINE_PATH, EXIT_CODES, REPO_ROOT, ROOT, RULES_DIR, TARGET_PATH, TEMPLATE_PATH,
  assertInside, checkBaseline, checkEnvironment, exitCodeFor, parseArgs, prepareRoot,
} from '../run.mjs';
import {
  BASELINE_RULES, SENTINEL_V4, SENTINEL_V10, TARGET_GIT_HASH, TARGET_SHA256,
} from '../specTestCaseGate.mjs';

const RUN_PATH = join(REPO_ROOT, 'tools', 'docgen-spike', 'run.mjs');
const COMPARE_PATH = join(REPO_ROOT, 'tools', 'docgen-spike', 'compare.mjs');
const GATE_PATH = join(REPO_ROOT, 'tools', 'docgen-spike', 'specTestCaseGate.mjs');
const REAL_BASELINE_TEXT = readFileSync(BASELINE_PATH, 'utf8');

function tmp(...parts) {
  return join(ROOT, ...parts);
}

function writeText(file, text) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text, 'utf8');
}

function runCli(args) {
  return spawnSync(process.execPath, [RUN_PATH, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
}

function combined(result) {
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

function countRules() {
  return readdirSync(RULES_DIR).filter((name) => name.endsWith('.md')).length;
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

const V4_TEMP = join(RULES_DIR, 'tmp-new-rule-V4.md');
const V10_TEMP = join(RULES_DIR, 'tmp-new-rule-V10.md');
const TC057_TEMP = join(RULES_DIR, 'tmp-new-rule-TC057.md');

after(() => {
  for (const file of [V4_TEMP, V10_TEMP, TC057_TEMP]) {
    try {
      rmSync(file, { force: true });
    } catch {
      // 尽力清理，不留测试残留。
    }
  }
  try {
    rmSync(ROOT, { recursive: true, force: true });
  } catch {
    // 同上。
  }
});

// ── 错误码 ───────────────────────────────────────────────────────────────────

test('EXIT_CODES：19 个错误码按 spec §7.1 映射 1/2/3', () => {
  assert.equal(Object.keys(EXIT_CODES).length, 19);
  for (const code of [
    'MissingSlot', 'MissingPlaceholder', 'InvalidRuleType', 'TemplateSyntaxError',
    'TemplateHardcoded', 'ImpureRender', 'Mismatch',
  ]) {
    assert.equal(EXIT_CODES[code], 1, code);
  }
  for (const code of [
    'UnregisteredHandwritten', 'InvalidBaseline', 'InvalidBaselinePath',
    'DanglingBaselineEntry', 'BaselineDrift', 'EnvironmentEOL',
    'InvalidInputPath', 'InvalidOutputPath',
  ]) {
    assert.equal(EXIT_CODES[code], 2, code);
  }
  for (const code of ['GeneratedMissing', 'TemplateReadFailed', 'TargetReadFailed', 'WriteFailed']) {
    assert.equal(EXIT_CODES[code], 3, code);
  }
  assert.equal(exitCodeFor('Mismatch'), 1);
  assert.equal(exitCodeFor('EnvironmentEOL'), 2);
  assert.equal(exitCodeFor('TemplateReadFailed'), 3);
  assert.equal(exitCodeFor('未知内部错误'), 3);
});

// ── 参数 ─────────────────────────────────────────────────────────────────────

test('TC-063：--gate / --case / --write-baseline / --compare 两两互斥 → InvalidArgs + exit 2', () => {
  const combinations = [
    ['--gate', '--case', 'V1'],
    ['--case', 'V1', '--gate'],
    ['--gate', '--write-baseline'],
    ['--gate', '--compare', tmp('x.md')],
    ['--case', 'V1', '--write-baseline'],
    ['--case', 'V1', '--compare', tmp('x.md')],
    ['--write-baseline', '--compare', tmp('x.md')],
  ];
  for (const args of combinations) {
    assert.throws(() => parseArgs(args), (err) => {
      assert.equal(err.code, 'InvalidArgs');
      assert.equal(err.exitCode, 2);
      assert.match(err.message, /互斥|不可同用|不能同用|mutually exclusive/i);
      for (const option of ['--gate', '--case', '--write-baseline', '--compare']) {
        if (args.includes(option)) assert.ok(err.message.includes(option), option);
      }
      return true;
    }, args.join(' '));
  }
});

test('TC-071：--write-baseline 与 --baseline 同给 → InvalidArgs + exit 2', () => {
  assert.throws(
    () => parseArgs(['--write-baseline', '--baseline', tmp('TC-071', 'baseline-copy.json')]),
    (err) => {
      assert.equal(err.code, 'InvalidArgs');
      assert.equal(err.exitCode, 2);
      assert.match(err.message, /--write-baseline/);
      assert.match(err.message, /--baseline/);
      assert.match(err.message, /互斥|不可同用|不能同用|mutually exclusive/i);
      return true;
    },
  );
});

test('非法参数：--case 枚举、未知选项、缺值 → InvalidArgs + exit 2（带 usage）', () => {
  for (const value of ['V12', 'V0', 'v1', 'V2c', '']) {
    assert.throws(() => parseArgs(['--case', value]), (err) => {
      assert.equal(err.code, 'InvalidArgs');
      assert.equal(err.exitCode, 2);
      assert.match(err.message, /V1\.\.V11/);
      assert.match(err.message, /usage|用法/i);
      return true;
    }, `--case ${value}`);
  }
  for (const args of [['--nope'], ['--case'], ['--out']]) {
    assert.throws(() => parseArgs(args), (err) => {
      assert.equal(err.code, 'InvalidArgs');
      assert.equal(err.exitCode, 2);
      return true;
    }, args.join(' '));
  }
});

test('parseArgs：合法参数解析为模式与 ROOT 内绝对路径', () => {
  const config = parseArgs([
    '--case', 'V2b', '--no-clean',
    '--target', tmp('t.md'),
    '--template', tmp('tpl.md'),
    '--baseline', tmp('b.json'),
    '--out', tmp('out.md'),
    '--fixture', 'tools/docgen-spike/fixtures/v5.json',
  ]);
  assert.equal(config.mode, 'case');
  assert.equal(config.case, 'V2b');
  assert.equal(config.noClean, true);
  assert.equal(config.paths.target, resolve(tmp('t.md')));
  assert.equal(config.paths.template, resolve(tmp('tpl.md')));
  assert.equal(config.paths.baseline, resolve(tmp('b.json')));
  assert.equal(config.paths.out, resolve(tmp('out.md')));
  assert.equal(config.paths.fixture, resolve(REPO_ROOT, 'tools/docgen-spike/fixtures/v5.json'));

  assert.equal(parseArgs([]).mode, 'all');
  assert.equal(parseArgs(['--gate']).mode, 'gate');
  assert.equal(parseArgs(['--write-baseline']).mode, 'write-baseline');
  assert.equal(parseArgs(['--compare', tmp('x.md')]).mode, 'compare');
});

// ── 路径 ─────────────────────────────────────────────────────────────────────

test('TC-042 / TC-046：--out 越界（含前缀、点段、ROOT 定义负例）→ InvalidOutputPath + exit 2', () => {
  const cases = [
    'rules/x.md',
    join(`${ROOT}x`, 'a.md'), // .tmp-testx：字符串前缀绕过
    join(ROOT, '..', '..', '..', 'rules', 'x.md'),
    ROOT,
  ];

  for (const value of cases) {
    assert.throws(() => parseArgs(['--case', 'V1', '--out', value]), (err) => {
      assert.equal(err.code, 'InvalidOutputPath');
      assert.equal(err.exitCode, 2);
      assert.ok(typeof err.path === 'string' && err.path.length > 0);
      return true;
    }, value);
  }

  assert.equal(existsSync(join(RULES_DIR, 'x.md')), false);
  assert.equal(existsSync(join(`${ROOT}x`, 'a.md')), false);
});

test('TC-046 正对照：ROOT 未被收窄，合法子路径被接受', () => {
  const out = tmp('TC-046-pos', 'a.md');
  const config = parseArgs(['--case', 'V1', '--out', out]);
  assert.equal(config.paths.out, resolve(out));
});

test('TC-047：Windows 反斜杠与正斜杠等效', (t) => {
  if (process.platform !== 'win32') {
    t.skip('仅 Windows 需要验证反斜杠等价');
    return;
  }
  const forward = tmp('TC-047', 'a.md');
  const backward = forward.replaceAll('/', '\\');
  assert.equal(
    parseArgs(['--case', 'V1', '--out', forward]).paths.out,
    parseArgs(['--case', 'V1', '--out', backward]).paths.out,
  );
});

test('R14：--target / --template / --baseline / --compare 指向 ROOT 外 → InvalidInputPath + exit 2', () => {
  const cases = [
    ['--target', 'rules/docs-convention.md'],
    ['--template', 'rules/spec-testcase-gate.md'],
    ['--baseline', 'rules/index.md'],
    ['--compare', 'rules/x.md'],
  ];
  for (const [option, value] of cases) {
    const args = option === '--compare' ? [option, value] : ['--case', 'V1', option, value];
    assert.throws(() => parseArgs(args), (err) => {
      assert.equal(err.code, 'InvalidInputPath');
      assert.equal(err.exitCode, 2);
      assert.ok(typeof err.path === 'string' && err.path.length > 0);
      return true;
    }, `${option} ${value}`);
  }
});

test('TC-065：ROOT 内经 junction 指向 rules/ → realpath 复判仍 InvalidOutputPath', (t) => {
  const dir = tmp('TC-065');
  const link = join(dir, 'link');
  mkdirSync(dir, { recursive: true });

  let linked = false;
  for (const type of ['junction', 'dir']) {
    try {
      rmSync(link, { recursive: true, force: true });
      symlinkSync(RULES_DIR, link, type);
      linked = true;
      break;
    } catch {
      // 依次尝试 Windows junction / POSIX dir。
    }
  }

  if (!linked) {
    rmSync(dir, { recursive: true, force: true });
    t.skip('当前平台无法创建 junction / symlink');
    return;
  }

  try {
    assert.equal(existsSync(link), true);
    const realLink = realpathSync(link);
    const realRules = realpathSync(RULES_DIR);
    assert.equal(
      process.platform === 'win32' ? realLink.toLowerCase() : realLink,
      process.platform === 'win32' ? realRules.toLowerCase() : realRules,
    );

    const probe = join(link, 'tc065-probe.md');
    assert.throws(() => assertInside(ROOT, probe, 'output'), (err) => {
      assert.equal(err.code, 'InvalidOutputPath');
      assert.equal(err.exitCode, 2);
      assert.ok(typeof err.path === 'string' && err.path.length > 0);
      return true;
    });
    assert.equal(existsSync(join(RULES_DIR, 'tc065-probe.md')), false);
  } finally {
    try {
      unlinkSync(link);
    } catch {
      try {
        rmSync(link, { recursive: true, force: true });
      } catch {
        // 链接已被删除。
      }
    }
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── 环境 ─────────────────────────────────────────────────────────────────────

test('TC-026 / TC-027 / TC-028 / TC-030：BOM → CR → INVALID_UTF8 顺序与字段', () => {
  assert.equal(checkEnvironment(Buffer.from('# x\n'), 'target'), null);

  assert.throws(
    () => checkEnvironment(Buffer.from('a\r\nb\n'), 'template', 'copy.tpl'),
    (err) => {
      assert.equal(err.code, 'EnvironmentEOL');
      assert.equal(err.violation, 'CR');
      assert.equal(err.role, 'template');
      assert.equal(err.path, 'copy.tpl');
      assert.equal(err.exitCode, 2);
      return true;
    },
  );

  assert.throws(
    () => checkEnvironment(Buffer.from([0xef, 0xbb, 0xbf, 0x61, 0x0a]), 'target'),
    (err) => err.code === 'EnvironmentEOL' && err.violation === 'BOM',
  );

  assert.throws(
    () => checkEnvironment(Buffer.from([0x61, 0xff, 0x0a]), 'target'),
    (err) => err.code === 'EnvironmentEOL' && err.violation === 'INVALID_UTF8',
  );

  const mixed = Buffer.concat([
    Buffer.from([0xef, 0xbb, 0xbf]),
    Buffer.from('a\r\n'),
    Buffer.from([0xff]),
  ]);
  assert.throws(
    () => checkEnvironment(mixed, 'target'),
    (err) => err.code === 'EnvironmentEOL' && err.violation === 'BOM',
  );
});

test('环境：缺尾换行 / 多尾换行 → EnvironmentEOL；generated 副本不预检', () => {
  assert.throws(
    () => checkEnvironment(Buffer.from('abc'), 'target'),
    (err) => err.code === 'EnvironmentEOL' && err.violation === 'NO_TRAILING_NEWLINE',
  );
  assert.throws(
    () => checkEnvironment(Buffer.from('abc\n\n'), 'target'),
    (err) => err.code === 'EnvironmentEOL' && err.violation === 'TRAILING_NEWLINE',
  );
  assert.equal(checkEnvironment(Buffer.from('a\r\nb'), 'generated'), null);
  assert.equal(checkEnvironment(Buffer.from([0xff]), 'generated'), null);
});

test('环境：仓库内 target / template / baseline 三个输入角色均通过', () => {
  const inputs = [
    [TARGET_PATH, 'target'],
    [TEMPLATE_PATH, 'template'],
    [BASELINE_PATH, 'baseline'],
  ];
  for (const [file, role] of inputs) {
    assert.equal(checkEnvironment(readFileSync(file), role, file), null, role);
  }
});

// ── baseline ─────────────────────────────────────────────────────────────────

test('§6.3 正例：真 baseline 五步全过（21 条）', () => {
  const result = checkBaseline(REAL_BASELINE_TEXT);
  assert.equal(result.count, 21);
  assert.deepEqual(result.entries, BASELINE_RULES);
  assert.equal(checkBaseline(readFileSync(BASELINE_PATH)).count, 21);
});

test('TC-033：坏 JSON / 非数组 / 空数组 / 重复条目 → InvalidBaseline', () => {
  const inputs = [
    '{bad',
    '{"a":1}',
    '[]',
    `${JSON.stringify([...BASELINE_RULES, BASELINE_RULES[0]], null, 2)}\n`,
  ];
  for (const text of inputs) {
    assert.throws(() => checkBaseline(text), (err) => {
      assert.equal(err.code, 'InvalidBaseline');
      assert.equal(err.exitCode, 2);
      return true;
    }, text.slice(0, 20));
  }
  assert.throws(
    () => checkBaseline(null),
    (err) => err.code === 'InvalidBaseline' && err.exitCode === 2,
  );
});

test('TC-035：路径含点段 / 反斜杠 / 非 rules 路径 → InvalidBaselinePath（先于悬空）', () => {
  const badEntries = ['rules/../rules/x.md', 'rules\\x.md', 'tools/x.md', 42];
  for (const entry of badEntries) {
    const text = `${JSON.stringify([...BASELINE_RULES, entry], null, 2)}\n`;
    assert.throws(() => checkBaseline(text), (err) => {
      assert.equal(err.code, 'InvalidBaselinePath');
      assert.equal(err.path, entry);
      assert.equal(err.exitCode, 2);
      return true;
    }, String(entry));
  }
});

test('TC-036：格式合法但文件不存在 → DanglingBaselineEntry（先于漂移）', () => {
  const text = `${JSON.stringify([...BASELINE_RULES, 'rules/does-not-exist.md'], null, 2)}\n`;
  assert.throws(() => checkBaseline(text), (err) => {
    assert.equal(err.code, 'DanglingBaselineEntry');
    assert.equal(err.path, 'rules/does-not-exist.md');
    assert.equal(err.exitCode, 2);
    return true;
  });
});

test('TC-034 / TC-037：缺一条 / 同一集合乱序 → BaselineDrift', () => {
  const inputs = [
    `${JSON.stringify(BASELINE_RULES.slice(0, 20), null, 2)}\n`,
    `${JSON.stringify([...BASELINE_RULES].reverse(), null, 2)}\n`,
  ];
  for (const text of inputs) {
    assert.throws(() => checkBaseline(text), (err) => {
      assert.equal(err.code, 'BaselineDrift');
      assert.equal(err.exitCode, 2);
      return true;
    });
  }
});

test('§6.3 步5：baseline 外的新增规则 → UnregisteredHandwritten + 可操作指引', () => {
  assert.throws(
    () => checkBaseline(REAL_BASELINE_TEXT, {
      listRuleFiles: () => [...BASELINE_RULES, 'rules/tmp-unregistered.md'],
    }),
    (err) => {
      assert.equal(err.code, 'UnregisteredHandwritten');
      assert.equal(err.path, 'rules/tmp-unregistered.md');
      assert.equal(err.exitCode, 2);
      assert.match(err.message, /BASELINE_RULES/);
      assert.match(err.message, /renderBaseline/);
      return true;
    },
  );
});

// ── 清理 ─────────────────────────────────────────────────────────────────────

test('R11 / TC-057：启动只清 ROOT 并重建', () => {
  const stale = tmp('stale', 'x.md');
  writeText(stale, 'stale');
  prepareRoot();
  assert.equal(existsSync(stale), false);
  assert.equal(existsSync(ROOT), true);
});

test('TC-057：--no-clean 跳过启动清理与哨兵自愈', () => {
  const stale = tmp('stale', 'x.md');
  writeText(stale, 'stale');
  writeFileSync(V4_TEMP, SENTINEL_V4, 'utf8');
  try {
    prepareRoot({ noClean: true });
    assert.equal(existsSync(stale), true);
    assert.equal(existsSync(V4_TEMP), true);
  } finally {
    rmSync(V4_TEMP, { force: true });
  }
});

test('TC-057：哨兵精确相等 → 删除并打印「已清理上次中断残留」', () => {
  writeFileSync(V4_TEMP, SENTINEL_V4, 'utf8');
  const logs = [];
  const original = console.log;
  console.log = (...args) => logs.push(args.join(' '));
  try {
    prepareRoot();
  } finally {
    console.log = original;
    rmSync(V4_TEMP, { force: true });
  }
  assert.equal(existsSync(V4_TEMP), false);
  assert.match(logs.join('\n'), /已清理上次中断残留/);
});

test('TC-057：近失内容（哨兵 + 追加行）不删除 → UnregisteredHandwritten', () => {
  writeFileSync(V10_TEMP, `${SENTINEL_V10}\n# extra\n`, 'utf8');
  try {
    assert.throws(() => prepareRoot(), (err) => {
      assert.equal(err.code, 'UnregisteredHandwritten');
      assert.equal(err.exitCode, 2);
      assert.match(err.message, /BASELINE_RULES/);
      return true;
    });
    assert.equal(existsSync(V10_TEMP), true);
  } finally {
    rmSync(V10_TEMP, { force: true });
  }
});

test('TC-057：非哨兵文件不被启动清理触碰', () => {
  writeFileSync(TC057_TEMP, 'handwritten rule\n', 'utf8');
  try {
    prepareRoot();
    assert.equal(existsSync(TC057_TEMP), true);
  } finally {
    rmSync(TC057_TEMP, { force: true });
  }
});

test('TC-057：测试不得手抄哨兵字面量（常量必须 import 自模块）', () => {
  const source = readFileSync(fileURLToPath(import.meta.url), 'utf8');
  assert.equal(source.includes(SENTINEL_V4), false);
  assert.equal(source.includes(SENTINEL_V10), false);
});

function runHookChild(fileName, signal) {
  mkdirSync(ROOT, { recursive: true });
  const script = tmp(`hooks-child-${fileName.replace(/\W/g, '_')}.mjs`);
  const moduleUrl = pathToFileURL(RUN_PATH).href;
  const code = `
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const mod = await import(${JSON.stringify(moduleUrl)});
mkdirSync(mod.ROOT, { recursive: true });
const file = join(mod.ROOT, process.env.CHILD_FILE);
writeFileSync(file, 'x');
mod.trackTempFile(file);
mod.registerCleanupHooks();
if (process.env.CHILD_SIGNAL) process.emit(process.env.CHILD_SIGNAL);
else process.exit(0);
`;
  writeText(script, code);
  const result = spawnSync(process.execPath, [script], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: { ...process.env, CHILD_FILE: fileName, CHILD_SIGNAL: signal ?? '' },
  });
  rmSync(script, { force: true });
  return { status: result.status, file: tmp(fileName), output: combined(result) };
}

test('R11：退出钩子在 process.exit() 时删除本次跟踪的临时文件', () => {
  const { status, file, output } = runHookChild('exit.txt');
  assert.equal(status, 0, output);
  assert.equal(existsSync(file), false);
});

test('R11：SIGINT 同步清理（exit 130）', () => {
  const { status, file, output } = runHookChild('sigint.txt', 'SIGINT');
  assert.equal(status, 130, output);
  assert.equal(existsSync(file), false);
});

test('R11：SIGTERM 同步清理（exit 143）', () => {
  const { status, file, output } = runHookChild('sigterm.txt', 'SIGTERM');
  assert.equal(status, 143, output);
  assert.equal(existsSync(file), false);
});

// ── CLI 退出码（Task 4 可测部分）─────────────────────────────────────────────

test('TC-063：模式互斥 → 进程 exit 2，且不出现 PASS/FAIL 汇总', () => {
  const result = runCli(['--gate', '--case', 'V1']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /--gate/);
  assert.match(result.stderr, /--case/);
  assert.match(result.stderr, /互斥|不可同用|不能同用|mutually exclusive/i);
  assert.doesNotMatch(combined(result), /PASS V\d|FAIL V\d/);
});

test('TC-063：非法 --case → 进程 exit 2 + usage', () => {
  const result = runCli(['--case', 'V12']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /V1\.\.V11/);
  assert.match(result.stderr, /usage|用法/i);
  assert.doesNotMatch(combined(result), /PASS V\d|FAIL V\d/);
});

test('TC-071：--write-baseline 互斥时 baseline.json 一个字节都不写', () => {
  const copy = tmp('TC-071', 'baseline-copy.json');
  const before = readFileSync(BASELINE_PATH);
  rmSync(copy, { force: true });
  const result = runCli(['--write-baseline', '--baseline', copy]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /--write-baseline/);
  assert.match(result.stderr, /--baseline/);
  assert.match(result.stderr, /互斥|不可同用|不能同用|mutually exclusive/i);
  assert.ok(readFileSync(BASELINE_PATH).equals(before));
  assert.equal(existsSync(copy), false);
});

test('TC-042 / TC-046：进程级 --out 越界 → exit 2 + InvalidOutputPath，真 rules/ 未被写', () => {
  const beforeCount = countRules();
  const outs = [
    'rules/x.md',
    join(`${ROOT}x`, 'a.md'),
    join(ROOT, '..', '..', '..', 'rules', 'x.md'),
  ];
  for (const out of outs) {
    const result = runCli(['--case', 'V1', '--out', out]);
    assert.equal(result.status, 2, out);
    assert.match(combined(result), /InvalidOutputPath/);
  }
  assert.equal(existsSync(join(RULES_DIR, 'x.md')), false);
  assert.equal(existsSync(join(`${ROOT}x`, 'a.md')), false);
  assert.equal(countRules(), beforeCount);
});

test('TC-046 正对照：ROOT 内 --out 不被误拒（后续由 Task 5/6 决定用例结果）', () => {
  const result = runCli(['--case', 'V1', '--out', tmp('TC-046-pos', 'a.md')]);
  assert.notEqual(result.status, 2);
  assert.doesNotMatch(combined(result), /InvalidOutputPath/);
});

test('TC-056：--raw 错误原文冒泡且固定 exit 2（不套用前置错误码）', () => {
  const missing = tmp('TC-056', 'nope.tpl');
  rmSync(missing, { force: true });
  const result = runCli(['--raw', '--gate', '--template', missing]);
  assert.equal(result.status, 2);
  assert.ok(combined(result).trim().length > 0);
  assert.doesNotMatch(combined(result), /PASS V\d|FAIL V\d/);
});

// ── 静态约束与只读 ───────────────────────────────────────────────────────────

test('TC-059：TARGET_GIT_HASH / TARGET_SHA256 与实文件一致', () => {
  assert.ok(typeof TARGET_GIT_HASH === 'string' && TARGET_GIT_HASH.length > 0);
  assert.ok(typeof TARGET_SHA256 === 'string' && TARGET_SHA256.length > 0);
  const gitHash = execFileSync('git', ['hash-object', 'rules/spec-testcase-gate.md'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  }).trim();
  assert.equal(gitHash, TARGET_GIT_HASH);
  assert.equal(sha256(TARGET_PATH), TARGET_SHA256);
});

test('TC-060：三个模块零第三方依赖，纯模块无 child_process', () => {
  const sources = [GATE_PATH, COMPARE_PATH, RUN_PATH].map((file) => [file, readFileSync(file, 'utf8')]);
  for (const [file, source] of sources) {
    const specifiers = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
    for (const specifier of specifiers) {
      if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('file:')) continue;
      assert.ok(specifier.startsWith('node:'), `${file}: ${specifier}`);
    }
  }
  assert.equal(readFileSync(GATE_PATH, 'utf8').includes('child_process'), false);
  assert.equal(readFileSync(COMPARE_PATH, 'utf8').includes('child_process'), false);
});

test('TC-061（Task 4 范围）：参数/环境/路径/baseline/清理函数不改写三份真文件', () => {
  const files = [TARGET_PATH, TEMPLATE_PATH, BASELINE_PATH];
  const before = files.map(sha256);

  parseArgs(['--case', 'V1']);
  assert.throws(() => checkBaseline('{bad'), (err) => err.code === 'InvalidBaseline');
  prepareRoot();

  assert.deepEqual(files.map(sha256), before);
});
