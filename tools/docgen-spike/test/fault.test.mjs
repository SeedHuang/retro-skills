import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync,
  rmSync, symlinkSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { REPO_ROOT } from '../run.mjs';
import { BASELINE_RULES, SENTINEL_V4, SENTINEL_V10, TARGET_GIT_HASH, TARGET_SHA256, renderBaseline } from '../specTestCaseGate.mjs';

const RUN_PATH = join(REPO_ROOT, 'tools', 'docgen-spike', 'run.mjs');
const TARGET_PATH = join(REPO_ROOT, 'rules', 'spec-testcase-gate.md');
const TEMPLATE_PATH = join(REPO_ROOT, 'tools', 'docgen-spike', 'template.md');
const REAL_BASELINE_PATH = join(REPO_ROOT, 'tools', 'docgen-spike', 'baseline.json');

// 测试隔离：被 spawn 的 run.mjs 用沙箱 ROOT / rules / baseline，真实文件只读。
// V10 需要「临时规则落进 check 扫描的目录」，因此 rules 也用沙箱副本（21 个真规则复制一份）。
const SANDBOX = mkdtempSync(join(tmpdir(), 'docgen-spike-fault-'));
const SANDBOX_RULES = join(SANDBOX, 'rules');
const SANDBOX_ROOT = join(SANDBOX, '.tmp-test');
const SANDBOX_BASELINE = join(SANDBOX, 'baseline.json');
mkdirSync(SANDBOX_RULES, { recursive: true });
for (const entry of BASELINE_RULES) {
  copyFileSync(join(REPO_ROOT, entry), join(SANDBOX_RULES, basename(entry)));
}
writeFileSync(SANDBOX_BASELINE, renderBaseline(), 'utf8');

const ENV = {
  ...process.env,
  DOCGEN_TEST_MODE: '1',
  DOCGEN_TMP_ROOT: SANDBOX_ROOT,
  DOCGEN_RULES_DIR: SANDBOX_RULES,
  DOCGEN_BASELINE_PATH: SANDBOX_BASELINE,
};

// spec §7.2：被 check 嵌套时，涉及 check / baseline 状态的用例显式跳过。
const NESTED_SKIP = process.env.DOCGEN_CHECK_ACTIVE === '1'
  ? 'nested check: 外层 V10 持有 rules/tmp-new-rule-V10.md，干净树/基线前提不成立（spec §7.2）'
  : false;

after(() => {
  rmSync(SANDBOX, { recursive: true, force: true });
});

function runCli(args, env = ENV) {
  return spawnSync(process.execPath, [RUN_PATH, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env,
  });
}

function combined(result) {
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function git(args) {
  return spawnSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' });
}

function passLines(output) {
  return output.match(/^PASS V\d+b?$/gm) ?? [];
}

// TC-049：V10b 后半（干净树）→ exit 0 且输出含 baseline 21/21。
test('TC-049 / V10b：干净树 check 退出 0，输出 baseline 21/21', { skip: NESTED_SKIP }, () => {
  const result = runCli(['--case', 'V10b']);
  const output = combined(result);
  assert.equal(result.status, 0, output);
  assert.match(result.stdout, /^PASS V10b$/m);
  assert.match(result.stdout, /baseline 21\/21/);
});

// TC-050：自建唯一临时规则 → 嵌套 check 非 0 且含 UnregisteredHandwritten；文件被删除。
test('TC-050 / V10：新增 rules/tmp-new-rule-V10.md → UnregisteredHandwritten，结束无残留', { skip: NESTED_SKIP }, () => {
  const beforeGit = git(['status', '--short', 'rules/']).stdout;
  const result = runCli(['--case', 'V10']);
  const output = combined(result);

  assert.equal(result.status, 0, output);
  assert.match(result.stdout, /^PASS V10$/m);
  assert.match(output, /UnregisteredHandwritten/);

  assert.equal(existsSync(join(SANDBOX_RULES, 'tmp-new-rule-V10.md')), false);
  assert.equal(existsSync(join(SANDBOX_RULES, 'tmp-new-rule-V4.md')), false);
  assert.equal(existsSync(join(REPO_ROOT, 'rules', 'tmp-new-rule-V10.md')), false);
  assert.equal(git(['status', '--short', 'rules/']).stdout, beforeGit);
});

// TC-051：V10b 前半（target 副本改 1 字节）→ Mismatch + PASS V10b + exit 0。
test('TC-051 / V10b：target 副本改 1 字节 → gate 报 Mismatch，命中期望即 PASS', { skip: NESTED_SKIP }, () => {
  const before = sha256(TARGET_PATH);
  const result = runCli(['--case', 'V10b', '--no-clean']);
  const output = combined(result);

  assert.equal(result.status, 0, output);
  assert.match(result.stdout, /^PASS V10b$/m);
  assert.match(output, /Mismatch/);
  assert.match(output, /line=\d+/);
  assert.doesNotMatch(output, /FAIL V10b/);
  assert.equal(sha256(TARGET_PATH), before);
});

// TC-052：V7 的漂移分支 → BaselineDrift，且不因 target 一致而假绿。
test('TC-052 / R6：漂移 baseline → BaselineDrift，不输出 baseline 21/21', { skip: NESTED_SKIP }, () => {
  const before = sha256(REAL_BASELINE_PATH);
  const result = runCli(['--case', 'V7', '--no-clean']);
  const output = combined(result);

  assert.equal(result.status, 0, output);
  assert.match(result.stdout, /^PASS V7$/m);
  assert.match(output, /BaselineDrift/);
  assert.doesNotMatch(output, /baseline 21\/21/);
  assert.doesNotMatch(output, /FAIL V7/);
  assert.equal(sha256(REAL_BASELINE_PATH), before);
});

// TC-052b / §7.2：baseline 错误优先于模板读取（检查顺序回归）。
test('TC-052b / §7.2：模板缺失 + baseline 坏 → InvalidBaseline 优先', () => {
  const dir = join(SANDBOX_ROOT, 'TC-052b');
  mkdirSync(dir, { recursive: true });
  const badBaseline = join(dir, 'bad-baseline.json');
  writeFileSync(badBaseline, '[]\n', 'utf8');
  const missingTemplate = join(dir, 'missing.tpl');
  const result = runCli([
    '--gate', '--baseline', badBaseline, '--template', missingTemplate, '--no-clean',
  ]);
  const output = combined(result);
  assert.equal(result.status, 2, output);
  assert.match(output, /InvalidBaseline/);
  assert.doesNotMatch(output, /TemplateReadFailed/);
});

// TC-053：--case V1 + 差异 target → 用例未达预期（exit 1）。
test('TC-053 / R10：--case V1 + 差异 target → FAIL V1 + exit 1', { skip: NESTED_SKIP }, () => {
  const dir = join(SANDBOX_ROOT, 'TC-053');
  mkdirSync(dir, { recursive: true });
  const copy = join(dir, 'target.md');
  const mutated = Buffer.from(readFileSync(TARGET_PATH));
  const firstNewline = mutated.indexOf(0x0a);
  let offset = firstNewline + 1;
  while (mutated[offset] === 0x0a) offset += 1;
  mutated[offset] = 0x40;
  writeFileSync(copy, mutated);

  try {
    const result = runCli(['--case', 'V1', '--target', copy, '--no-clean']);
    const output = combined(result);
    assert.equal(result.status, 1, output);
    assert.match(result.stdout, /^FAIL V1$/m);
    assert.doesNotMatch(output, /PASS V1|EnvironmentEOL|TargetReadFailed|TemplateReadFailed/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// TC-054：--case V1 + CRLF 模板 → EnvironmentEOL + exit 2（不套「命中期望 → PASS」）。
test('TC-054 / R10：--case V1 + CRLF 模板 → EnvironmentEOL(CR) + exit 2', () => {
  const dir = join(SANDBOX_ROOT, 'TC-054');
  mkdirSync(dir, { recursive: true });
  const copy = join(dir, 'tpl-crlf.tpl');
  writeFileSync(copy, readFileSync(TEMPLATE_PATH, 'utf8').replace(/\r?\n/g, '\r\n'), 'utf8');

  try {
    const result = runCli(['--case', 'V1', '--template', copy, '--no-clean']);
    const output = combined(result);
    assert.equal(result.status, 2, output);
    assert.match(output, /EnvironmentEOL/);
    assert.match(output, /violation=CR/);
    assert.doesNotMatch(output, /PASS V1|FAIL V1/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// TC-055：--gate + 模板不存在 → TemplateReadFailed + exit 3。
test('TC-055 / R10：--gate + 模板不存在 → TemplateReadFailed + exit 3', () => {
  const missing = join(SANDBOX_ROOT, 'TC-055', 'nope.tpl');
  rmSync(missing, { force: true });
  const result = runCli(['--gate', '--template', missing, '--no-clean']);
  const output = combined(result);
  assert.equal(result.status, 3, output);
  assert.match(output, /TemplateReadFailed/);
  assert.doesNotMatch(output, /EnvironmentEOL/);
});

// TC-056：--raw → 错误原文冒泡且固定 exit 2。
test('TC-056 / §7.1：--raw 错误原文冒泡，固定 exit 2', () => {
  const missing = join(SANDBOX_ROOT, 'TC-056', 'nope.tpl');
  rmSync(missing, { force: true });
  const result = runCli(['--raw', '--gate', '--template', missing, '--no-clean']);
  const output = combined(result);
  assert.equal(result.status, 2, output);
  assert.ok(output.trim().length > 0);
  assert.match(output, /TemplateReadFailed|ENOENT/);
  assert.doesNotMatch(output, /PASS V\d|FAIL V\d/);
});

// TC-057：启动清 ROOT + 哨兵精确自愈；近失/非哨兵 fail-closed。
test('TC-057 / R11：启动清 ROOT、精确哨兵自愈、近失与非哨兵保留并 fail-closed', { skip: NESTED_SKIP }, () => {
  const stale = join(SANDBOX_ROOT, 'stale', 'x.md');
  const v4 = join(SANDBOX_RULES, 'tmp-new-rule-V4.md');
  const v10 = join(SANDBOX_RULES, 'tmp-new-rule-V10.md');
  const hand = join(SANDBOX_RULES, 'tmp-new-rule-TC057.md');

  mkdirSync(join(SANDBOX_ROOT, 'stale'), { recursive: true });
  writeFileSync(stale, 'stale', 'utf8');
  writeFileSync(v4, SENTINEL_V4, 'utf8');
  writeFileSync(v10, `${SENTINEL_V10}\n# extra\n`, 'utf8');
  writeFileSync(hand, 'handwritten rule\n', 'utf8');

  assert.equal(existsSync(stale), true, '预置残留必须真实存在，否则「启动后被删」是空断言');

  try {
    const result = runCli(['--case', 'V1']);
    const output = combined(result);

    assert.equal(result.status, 2, output);
    assert.match(output, /UnregisteredHandwritten/);
    assert.match(output, /已清理上次中断残留/);
    assert.doesNotMatch(output, /PASS V1/);

    assert.equal(existsSync(stale), false, 'ROOT 内残留应被启动清理删除');
    assert.equal(existsSync(v4), false, '精确哨兵应被自愈删除');
    assert.equal(existsSync(v10), true, '近失内容不得删除');
    assert.equal(existsSync(hand), true, '非哨兵文件不得删除');
  } finally {
    rmSync(v4, { force: true });
    rmSync(v10, { force: true });
    rmSync(hand, { force: true });
  }

  assert.equal(existsSync(v10), false);
  assert.equal(existsSync(hand), false);
});

// TC-058 / TC-061 / TC-062：全量两遍逐字一致、13/13、无残留、真文件不变。
test('TC-058 / TC-061 / TC-062：全量两遍输出逐字一致、13/13 PASS、无残留、真文件不变', { skip: NESTED_SKIP }, () => {
  const files = [TARGET_PATH, TEMPLATE_PATH, REAL_BASELINE_PATH];
  const beforeHashes = files.map(sha256);
  const beforeGit = {
    rules: git(['status', '--short', 'rules/']).stdout,
    tools: git(['status', '--short', 'tools/docgen-spike/']).stdout,
  };
  rmSync(SANDBOX_ROOT, { recursive: true, force: true });

  const first = runCli([]);
  const second = runCli([]);
  const out1 = combined(first);
  const out2 = combined(second);

  assert.equal(first.status, 0, out1);
  assert.equal(second.status, 0, out2);
  assert.equal(out1, out2, '两遍输出必须逐字一致');

  assert.equal(passLines(out1).length, 13, out1);
  for (const name of ['V2b', 'V10', 'V10b', 'V11']) {
    assert.match(out1, new RegExp(`^PASS ${name}$`, 'm'), name);
  }
  assert.match(out1, /^13\/13 PASS$/m);

  assert.equal(existsSync(SANDBOX_ROOT), false, '退出后不得残留 .tmp-test');
  assert.deepEqual(files.map(sha256), beforeHashes);
  assert.equal(git(['status', '--short', 'rules/']).stdout, beforeGit.rules);
  assert.equal(git(['status', '--short', 'tools/docgen-spike/']).stdout, beforeGit.tools);
});

test('TC-062 / §7.1：--case V1 只跑该例，汇总 1/13 PASS', () => {
  const result = runCli(['--case', 'V1', '--no-clean']);
  const output = combined(result);
  assert.equal(result.status, 0, output);
  assert.equal(passLines(output).length, 1, output);
  assert.match(result.stdout, /^PASS V1$/m);
  assert.match(result.stdout, /^1\/13 PASS$/m);
  assert.doesNotMatch(output, /PASS V(2|2b|3|4|5|6|7|8|9|10|10b|11)\b/);
});

// TC-059：双哈希常量与实文件一致。
test('TC-059 / R12：TARGET_GIT_HASH 与 TARGET_SHA256 均与实文件一致', () => {
  assert.ok(typeof TARGET_GIT_HASH === 'string' && TARGET_GIT_HASH.length > 0);
  assert.ok(typeof TARGET_SHA256 === 'string' && TARGET_SHA256.length > 0);
  const gitHash = execFileSync('git', ['hash-object', 'rules/spec-testcase-gate.md'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  }).trim();
  assert.equal(gitHash, TARGET_GIT_HASH);
  assert.equal(sha256(TARGET_PATH), TARGET_SHA256);
});

// TC-060：三个模块只用 Node 内置；纯模块不得用 child_process。
test('TC-060 / R13：三个模块只用 Node 内置，纯模块无 child_process', () => {
  const files = [
    join(REPO_ROOT, 'tools', 'docgen-spike', 'specTestCaseGate.mjs'),
    join(REPO_ROOT, 'tools', 'docgen-spike', 'compare.mjs'),
    RUN_PATH,
  ];
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const specifier = match[1];
      if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('file:')) continue;
      assert.ok(specifier.startsWith('node:'), `${file}: ${specifier}`);
    }
  }
  assert.equal(readFileSync(files[0], 'utf8').includes('child_process'), false);
  assert.equal(readFileSync(files[1], 'utf8').includes('child_process'), false);
});

// TC-063：四模式互斥 + 非法 --case → exit 2，不进入任一模式。
test('TC-063 / §7.1：--gate / --case / --compare 两两同给与非法 --case → exit 2', () => {
  const cases = [
    ['--gate', '--case', 'V1'],
    ['--case', 'V1', '--gate'],
    ['--case', 'V1', '--compare', join(SANDBOX_ROOT, 'TC-063', 'gen.md')],
  ];
  for (const args of cases) {
    const result = runCli([...args, '--no-clean']);
    const output = combined(result);
    assert.equal(result.status, 2, `${args.join(' ')}：${output}`);
    assert.match(output, /互斥|不可同用|不能同用|mutually exclusive/i);
    assert.doesNotMatch(output, /PASS V\d|FAIL V\d/);
  }

  const badCase = runCli(['--case', 'V12']);
  const badOutput = combined(badCase);
  assert.equal(badCase.status, 2, badOutput);
  assert.match(badOutput, /V1\.\.V11/);
  assert.match(badOutput, /usage|用法/i);
});

// TC-064：fixture 非 JSON / 不存在 → exit 3，不出现产品错误码。
test('TC-064 / §4.3：fixture 非 JSON 或不存在 → exit 3', () => {
  const dir = join(SANDBOX_ROOT, 'TC-064');
  mkdirSync(dir, { recursive: true });
  const broken = join(dir, 'broken.json');
  writeFileSync(broken, '{bad', 'utf8');
  const missing = join(dir, 'nope.json');

  try {
    for (const fixture of [broken, missing]) {
      const result = runCli(['--case', 'V5', '--fixture', fixture, '--no-clean']);
      const output = combined(result);
      assert.equal(result.status, 3, output);
      assert.ok(output.trim().length > 0);
      assert.doesNotMatch(output, /PASS V5|FAIL V5|MissingSlot|InvalidRuleType/);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// TC-065：ROOT 内经 junction 指向 rules/ → realpath 复判仍 InvalidOutputPath。
test('TC-065 / §7.1：ROOT 内 junction 指向 rules/ → InvalidOutputPath + exit 2', (t) => {
  const dir = join(SANDBOX_ROOT, 'TC-065');
  const link = join(dir, 'link');
  mkdirSync(dir, { recursive: true });

  let linked = false;
  for (const type of ['junction', 'dir']) {
    try {
      rmSync(link, { recursive: true, force: true });
      symlinkSync(SANDBOX_RULES, link, type);
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
    const realRules = realpathSync(SANDBOX_RULES);
    assert.equal(
      process.platform === 'win32' ? realLink.toLowerCase() : realLink,
      process.platform === 'win32' ? realRules.toLowerCase() : realRules,
    );

    const probe = join(link, 'tc065-probe.md');
    const result = runCli(['--case', 'V1', '--out', probe, '--no-clean']);
    const output = combined(result);
    assert.equal(result.status, 2, output);
    assert.match(output, /InvalidOutputPath/);
    assert.equal(existsSync(join(SANDBOX_RULES, 'tc065-probe.md')), false);
  } finally {
    try {
      unlinkSync(link);
    } catch {
      rmSync(link, { recursive: true, force: true });
    }
    rmSync(dir, { recursive: true, force: true });
  }
});

// TC-066：.gitattributes 生效、三份文本工作区为 LF、双哈希一致。
test('TC-066 / R15：.gitattributes 强制 LF，三份文本无 CR，双哈希一致', () => {
  const attributes = readFileSync(join(REPO_ROOT, '.gitattributes'), 'utf8');
  assert.match(attributes, /eol=lf/);

  const files = [
    'rules/spec-testcase-gate.md',
    'tools/docgen-spike/template.md',
    'tools/docgen-spike/baseline.json',
  ];
  const attr = git(['check-attr', 'eol', '--', ...files]).stdout;
  for (const file of files) {
    assert.match(attr, new RegExp(`${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: eol: lf`));
  }
  for (const file of files) {
    assert.equal(readFileSync(join(REPO_ROOT, file)).includes(0x0d), false, file);
  }
  assert.equal(
    execFileSync('git', ['hash-object', 'rules/spec-testcase-gate.md'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }).trim(),
    TARGET_GIT_HASH,
  );
  assert.equal(sha256(TARGET_PATH), TARGET_SHA256);
});

// TC-067：静态扫描——测试文件不直接调仓库检查入口，run.mjs 持哨兵变量。
test('TC-067 / §7.2：测试文件不得直接调仓库检查入口，run.mjs 持有嵌套哨兵', () => {
  const testDir = join(REPO_ROOT, 'tools', 'docgen-spike', 'test');
  const pattern = new RegExp(`${['npm', 'run', 'check'].join('\\s+')}|${['check', 'all'].join('-')}`);
  for (const name of readdirSync(testDir).filter((entry) => entry.endsWith('.test.mjs'))) {
    const source = readFileSync(join(testDir, name), 'utf8')
      .replace(/\/\/[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(source, pattern, name);
  }

  const runSource = readFileSync(RUN_PATH, 'utf8');
  assert.match(runSource, /DOCGEN_CHECK_ACTIVE/);
  assert.match(runSource, /V10b/);

  const checkAllName = ['check', 'all'].join('-');
  const checkAllPath = join(REPO_ROOT, 'scripts', `${checkAllName}.mjs`);
  const checkAllSource = existsSync(checkAllPath) ? readFileSync(checkAllPath, 'utf8') : '';
  if (checkAllSource.includes('docgen-spike/run.mjs --gate')) {
    assert.match(checkAllSource, /DOCGEN_CHECK_ACTIVE/);
  }
});

// TC-068：--case V1 + ROOT 内不存在的 target → TargetReadFailed + exit 3。
test('TC-068 / §7.1：--case V1 + target 读失败 → TargetReadFailed + exit 3', () => {
  const before = { target: sha256(TARGET_PATH), template: sha256(TEMPLATE_PATH) };
  const missing = join(SANDBOX_ROOT, 'TC-068', 'nope.md');
  rmSync(missing, { force: true });

  const result = runCli(['--case', 'V1', '--target', missing, '--no-clean']);
  const output = combined(result);

  assert.equal(result.status, 3, output);
  assert.match(output, /TargetReadFailed/);
  assert.doesNotMatch(output, /InvalidInputPath|TemplateReadFailed|EnvironmentEOL|PASS V1/);
  assert.equal(sha256(TARGET_PATH), before.target);
  assert.equal(sha256(TEMPLATE_PATH), before.template);
});

// TC-069：--gate + 模板内容 = target 全文 → TemplateHardcoded + exit 1，不走比对。
test('TC-069 / §7.2：模板贴 target 全文 → TemplateHardcoded + exit 1，不出现 21/21', { skip: NESTED_SKIP }, () => {
  const dir = join(SANDBOX_ROOT, 'TC-069');
  mkdirSync(dir, { recursive: true });
  const full = join(dir, 'tpl-full.tpl');
  writeFileSync(full, readFileSync(TARGET_PATH));
  const before = { target: sha256(TARGET_PATH), template: sha256(TEMPLATE_PATH) };
  assert.equal(existsSync(full), true);

  try {
    const result = runCli(['--gate', '--template', full, '--no-clean']);
    const output = combined(result);
    assert.equal(result.status, 1, output);
    assert.match(output, /TemplateHardcoded/);
    assert.match(output, /snippet/);
    assert.doesNotMatch(output, /baseline 21\/21|Mismatch/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  assert.equal(sha256(TARGET_PATH), before.target);
  assert.equal(sha256(TEMPLATE_PATH), before.template);
});

// TC-070：--write-baseline 正例——坏 baseline 被覆盖回常量渲染结果，gate 随后变绿。
test('TC-070 / §7.1：--write-baseline 覆盖坏 baseline → 字节等于常量渲染，gate 绿', { skip: NESTED_SKIP }, () => {
  const before = {
    target: sha256(TARGET_PATH),
    template: sha256(TEMPLATE_PATH),
    realBaseline: sha256(REAL_BASELINE_PATH),
  };
  const original = readFileSync(SANDBOX_BASELINE);
  const parsed = JSON.parse(original.toString('utf8'));
  writeFileSync(SANDBOX_BASELINE, `${JSON.stringify(parsed.slice(0, -1), null, 2)}\n`, 'utf8');

  try {
    const write = runCli(['--write-baseline']);
    assert.equal(write.status, 0, combined(write));

    const written = readFileSync(SANDBOX_BASELINE);
    assert.ok(written.equals(Buffer.from(renderBaseline(), 'utf8')));
    assert.equal(JSON.parse(written.toString('utf8')).length, BASELINE_RULES.length);
    assert.equal(written[written.length - 1], 0x0a);

    const gate = runCli(['--gate']);
    assert.equal(gate.status, 0, combined(gate));
    assert.match(gate.stdout, /baseline 21\/21/);
  } finally {
    writeFileSync(SANDBOX_BASELINE, original);
  }

  assert.equal(sha256(SANDBOX_BASELINE), createHash('sha256').update(Buffer.from(renderBaseline(), 'utf8')).digest('hex'));
  assert.equal(sha256(TARGET_PATH), before.target);
  assert.equal(sha256(TEMPLATE_PATH), before.template);
  assert.equal(sha256(REAL_BASELINE_PATH), before.realBaseline);
  assert.equal(existsSync(SANDBOX_ROOT), false);
});

// TC-071：--write-baseline 与其他模式/--baseline 同给 → exit 2，且两边都不写。
test('TC-071 / §7.1：--write-baseline 互斥 → exit 2，baseline 一个字节都不写', () => {
  const before = readFileSync(SANDBOX_BASELINE);
  const copy = join(SANDBOX_ROOT, 'TC-071', 'baseline-copy.json');
  rmSync(copy, { force: true });

  const cases = [
    ['--write-baseline', '--gate'],
    ['--gate', '--write-baseline'],
    ['--write-baseline', '--case', 'V1'],
    ['--write-baseline', '--compare', join(SANDBOX_ROOT, 'TC-071', 'gen.md')],
    ['--write-baseline', '--baseline', copy],
  ];
  for (const args of cases) {
    const result = runCli([...args, '--no-clean']);
    const output = combined(result);
    assert.equal(result.status, 2, `${args.join(' ')}：${output}`);
    assert.match(output, /--write-baseline/);
    assert.match(output, /互斥|不可同用|不能同用|mutually exclusive/i);
    assert.doesNotMatch(output, /PASS V\d|FAIL V\d/);
  }

  assert.ok(readFileSync(SANDBOX_BASELINE).equals(before));
  assert.equal(existsSync(copy), false);
});
