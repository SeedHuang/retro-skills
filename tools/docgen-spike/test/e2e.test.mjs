import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { REPO_ROOT, checkEnvironment } from '../run.mjs';
import { compareBuffers } from '../compare.mjs';
import { BASELINE_RULES, renderBaseline } from '../specTestCaseGate.mjs';

const RUN_PATH = join(REPO_ROOT, 'tools', 'docgen-spike', 'run.mjs');
const TARGET_PATH = join(REPO_ROOT, 'rules', 'spec-testcase-gate.md');
const TEMPLATE_PATH = join(REPO_ROOT, 'tools', 'docgen-spike', 'template.md');
const BASELINE_PATH = join(REPO_ROOT, 'tools', 'docgen-spike', 'baseline.json');

// 测试隔离：e2e 与其他 *.test.mjs 并行（npm run check 的 node --test），
// 若共用仓库内 .tmp-test/ 与 rules/，env.test.mjs 的哨兵/临时规则会互相踩。
// 这里把被 spawn 的 run.mjs 的 ROOT 与 rules 根都指到 os.tmpdir 沙箱，真实文件只读。
const SANDBOX = mkdtempSync(join(tmpdir(), 'docgen-spike-e2e-'));
const SANDBOX_RULES = join(SANDBOX, 'rules');
const SANDBOX_ROOT = join(SANDBOX, '.tmp-test');
mkdirSync(SANDBOX_RULES, { recursive: true });
for (const entry of BASELINE_RULES) {
  copyFileSync(join(REPO_ROOT, entry), join(SANDBOX_RULES, basename(entry)));
}
const ENV = {
  ...process.env,
  DOCGEN_TEST_MODE: '1',
  DOCGEN_TMP_ROOT: SANDBOX_ROOT,
  DOCGEN_RULES_DIR: SANDBOX_RULES,
};

after(() => {
  rmSync(SANDBOX, { recursive: true, force: true });
});

function runCaseCli(name, extra = []) {
  return spawnSync(process.execPath, [RUN_PATH, '--case', name, '--no-clean', ...extra], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: ENV,
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

// TC-001 / V1：默认内存渲染 === target，末行汇总打印，不写盘。
test('TC-001 / V1：默认内存渲染与 target 逐字节一致，打印 baseline 21/21', () => {
  const before = { target: sha256(TARGET_PATH), template: sha256(TEMPLATE_PATH) };
  const result = runCaseCli('V1');

  assert.equal(result.status, 0, combined(result));
  assert.match(result.stdout, /^PASS V1$/m);
  assert.match(result.stdout, /baseline 21\/21/);
  assert.match(result.stdout, /^1\/13 PASS$/m);

  assert.equal(existsSync(join(SANDBOX_ROOT, 'V1')), false, 'V1 不应写盘');
  assert.equal(sha256(TARGET_PATH), before.target);
  assert.equal(sha256(TEMPLATE_PATH), before.template);
});

// TC-053（边界）/ V1 负例：target 副本改 1 个可打印 ASCII 字节 → FAIL V1 + exit 1。
test('TC-053 / V1 负例：target 改 1 字节 → FAIL V1 + exit 1，不是环境/IO 前置错误', () => {
  const dir = join(SANDBOX_ROOT, 'TC-053');
  mkdirSync(dir, { recursive: true });
  const copy = join(dir, 'target.md');
  const targetBytes = readFileSync(TARGET_PATH);
  const mutated = Buffer.from(targetBytes);
  const firstNewline = mutated.indexOf(0x0a);
  let offset = firstNewline + 1;
  while (mutated[offset] === 0x0a) offset += 1;
  assert.equal(mutated[offset], 0x3e, 'V2/TC-053 固定构造应落在第 3 行行首的 >');
  mutated[offset] = 0x40;
  writeFileSync(copy, mutated);

  try {
    const result = runCaseCli('V1', ['--target', copy]);
    assert.equal(result.status, 1, combined(result));
    assert.match(result.stdout, /^FAIL V1$/m);
    assert.doesNotMatch(
      combined(result),
      /PASS V1|EnvironmentEOL|TargetReadFailed|TemplateReadFailed/,
    );
    assert.match(combined(result), /Mismatch/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// TC-022 / TC-024：line 按 0x0A 计数、首字节差异、真前缀边界。
test('TC-022 / TC-024 / §6.1：\\r 不单独成行；首字节差异 line=1；真前缀取 min(length)', () => {
  // TC-022（第 10 轮已修正）：actual='a\nbc\rdef' vs expected='a\nbc\ndef'，首差异 byte=4、line=2。
  const crInActual = compareBuffers(Buffer.from('a\nbc\rdef'), Buffer.from('a\nbc\ndef'));
  assert.equal(crInActual.code, 'Mismatch');
  assert.equal(crInActual.line, 2);
  assert.equal(crInActual.byte, 4);

  const firstByte = compareBuffers(Buffer.from('aXbc'), Buffer.from('aYbc'));
  assert.deepEqual(firstByte, { code: 'Mismatch', line: 1, byte: 1 });

  const prefix = compareBuffers(Buffer.from('abc'), Buffer.from('abcdef'));
  assert.deepEqual(prefix, { code: 'Mismatch', line: 1, byte: 3 });

  assert.equal(compareBuffers(Buffer.from('same\n'), Buffer.from('same\n')), null);
});

// TC-023 / V2：固定位置改 1 个 ASCII 字节 → Mismatch + 精确 line/byte + 内容源指引 + 双哈希不变。
test('TC-023 / V2：副本改 1 字节 → 精确 line=3 / byte=固定偏移，消息指向内容源', () => {
  const targetBytes = readFileSync(TARGET_PATH);
  const firstNewline = targetBytes.indexOf(0x0a);
  let mutatedOffset = firstNewline + 1;
  while (targetBytes[mutatedOffset] === 0x0a) mutatedOffset += 1;
  assert.equal(targetBytes[mutatedOffset], 0x3e);

  const before = { target: sha256(TARGET_PATH), template: sha256(TEMPLATE_PATH) };
  const result = runCaseCli('V2');
  const output = combined(result);

  assert.equal(result.status, 0, output);
  assert.match(result.stdout, /^PASS V2$/m);
  assert.match(output, /Mismatch/);

  const byteMatch = /byte=(\d+)/.exec(output);
  const lineMatch = /line=(\d+)/.exec(output);
  assert.ok(byteMatch && lineMatch, `缺少 line=/byte=：${output}`);
  assert.equal(Number(byteMatch[1]), mutatedOffset, 'byte 必须精确等于固定偏移');
  assert.equal(Number(lineMatch[1]), 3, 'line 必须精确等于 3');

  assert.match(output, /specTestCaseGate\.mjs/);
  assert.match(output, /buildData/);

  assert.equal(sha256(TARGET_PATH), before.target);
  assert.equal(sha256(TEMPLATE_PATH), before.template);
});

// TC-025 / V2b：把 \n 换成 \r\n → Mismatch，而不是 EnvironmentEOL（不做 EOL 归一）。
test('TC-025 / V2b：副本 \\n → \\r\\n → Mismatch 且不报 EnvironmentEOL', () => {
  const before = { target: sha256(TARGET_PATH), template: sha256(TEMPLATE_PATH) };
  const result = runCaseCli('V2b');
  const output = combined(result);

  assert.equal(result.status, 0, output);
  assert.match(result.stdout, /^PASS V2b$/m);
  assert.match(output, /Mismatch/);
  assert.doesNotMatch(output, /EnvironmentEOL/);

  assert.equal(sha256(TARGET_PATH), before.target);
  assert.equal(sha256(TEMPLATE_PATH), before.template);
});

// TC-007 / TC-008 / V3：空串 / 纯空白 / TODO / 制表符 / 全角空格 → MissingSlot 指向该格，无输出文件。
test('TC-007 / TC-008 / V3：pass 五种非法值 → MissingSlot 指向该格，不产生输出文件', () => {
  const result = runCaseCli('V3');
  const output = combined(result);

  assert.equal(result.status, 0, output);
  assert.match(result.stdout, /^PASS V3$/m);
  assert.equal((output.match(/MissingSlot/g) ?? []).length, 5);
  assert.match(output, /criteria\.用例合格\.pass/);
  assert.equal(existsSync(join(SANDBOX_ROOT, 'V3')), false);
});

// TC-012 / V5：规则类型枚举 + 5 格义务模板；非法 fixture 归 IO/依赖层（exit 3）。
test('TC-012 / V5：polarity=ban / applicability=sometimes → InvalidRuleType field/value；默认 5 格', () => {
  const result = runCaseCli('V5');
  const output = combined(result);

  assert.equal(result.status, 0, output);
  assert.match(result.stdout, /^PASS V5$/m);
  assert.match(output, /criteria=5 格/);
  assert.match(output, /InvalidRuleType field=polarity value=ban/);
  assert.match(output, /InvalidRuleType field=applicability value=sometimes/);
});

test('TC-064（边界）/ V5：fixture 非 JSON → exit 3，且不产出 PASS/FAIL 或产品错误码', () => {
  const file = join(SANDBOX, 'broken-fixture.json');
  writeFileSync(file, '{bad', 'utf8');
  try {
    const result = runCaseCli('V5', ['--fixture', file]);
    const output = combined(result);
    assert.equal(result.status, 3, output);
    assert.doesNotMatch(output, /PASS V5|FAIL V5|MissingSlot|InvalidRuleType/);
    assert.ok(output.trim().length > 0, '必须给出 fixture 层失败信息');
  } finally {
    rmSync(file, { force: true });
  }
});

// TC-005 / TC-006 / TC-016 / TC-018 / V6：fs 探针、模板签名、数据驱动增删。
test('TC-005 / TC-006 / TC-016 / TC-018 / V6：ImpureRender + 模板 0 签名 + 判据增删同步', () => {
  const result = runCaseCli('V6');
  const output = combined(result);

  assert.equal(result.status, 0, output);
  assert.match(result.stdout, /^PASS V6$/m);
  assert.match(output, /ImpureRender/);
  assert.match(output, /V6 模板签名 0\/3/);
  assert.match(output, /V6 判据增删：\+1\/-1 同步/);
  assert.equal(existsSync(join(SANDBOX_ROOT, 'V6')), false, 'V6 的替身文件应被清理');
});

// TC-031 / TC-033–TC-040 / V7：合法副本通过；坏 baseline 各分支命中对应码；不假绿。
test('TC-031 / TC-033–TC-040 / V7：坏 baseline 分支各得其所，合法副本通过且不打印 21/21', () => {
  const before = sha256(BASELINE_PATH);
  const result = runCaseCli('V7');
  const output = combined(result);

  assert.equal(result.status, 0, output);
  assert.match(result.stdout, /^PASS V7$/m);
  assert.match(output, /V7 \[合法副本\] 通过（21 条）/);

  for (const code of ['BaselineDrift', 'InvalidBaseline', 'DanglingBaselineEntry', 'InvalidBaselinePath']) {
    assert.match(output, new RegExp(code), code);
  }
  // TC-052：target 一致但基线漂移时不得出现「baseline 21/21」的假绿信号。
  assert.doesNotMatch(output, /baseline 21\/21/);
  assert.equal(sha256(BASELINE_PATH), before, '真 baseline 不得被改写');
});

// TC-026 / TC-027 / TC-028 / TC-029 / V8：输入角色的 EOL/BOM/UTF-8 检查。
test('TC-026–TC-029 / V8：模板 CRLF、target BOM/非法 UTF-8、baseline CR → EnvironmentEOL', () => {
  const before = {
    target: sha256(TARGET_PATH),
    template: sha256(TEMPLATE_PATH),
    baseline: sha256(BASELINE_PATH),
  };
  const result = runCaseCli('V8');
  const output = combined(result);

  assert.equal(result.status, 0, output);
  assert.match(result.stdout, /^PASS V8$/m);
  assert.match(output, /EnvironmentEOL violation=CR/);
  assert.match(output, /EnvironmentEOL violation=BOM/);
  assert.match(output, /EnvironmentEOL violation=INVALID_UTF8/);

  assert.equal(sha256(TARGET_PATH), before.target);
  assert.equal(sha256(TEMPLATE_PATH), before.template);
  assert.equal(sha256(BASELINE_PATH), before.baseline);
  assert.equal(existsSync(join(SANDBOX_ROOT, 'V8')), false);
});

test('TC-030 / §6.2：BOM + CR + 非法字节同时存在 → 只报 BOM（固定顺序）', () => {
  const mixed = Buffer.concat([
    Buffer.from([0xef, 0xbb, 0xbf]),
    Buffer.from('a\r\n', 'utf8'),
    Buffer.from([0xff]),
  ]);
  assert.throws(
    () => checkEnvironment(mixed, 'target'),
    (err) => err.code === 'EnvironmentEOL' && err.violation === 'BOM',
  );
});

// TC-041 / V4：基线外新增唯一临时规则 → UnregisteredHandwritten + 两条可操作指引；finally 删除。
test('TC-041 / V4：新增 rules/tmp-new-rule-V4.md → UnregisteredHandwritten + 指引，结束无残留', () => {
  const beforeGit = git(['status', '--short', 'rules/']).stdout;
  const result = runCaseCli('V4');
  const output = combined(result);

  assert.equal(result.status, 0, output);
  assert.match(result.stdout, /^PASS V4$/m);
  assert.match(output, /UnregisteredHandwritten/);
  assert.match(output, /path=rules\/tmp-new-rule-V4\.md/);
  assert.match(output, /BASELINE_RULES/);
  assert.match(output, /renderBaseline/);

  assert.equal(existsSync(join(SANDBOX_RULES, 'tmp-new-rule-V4.md')), false, '唯一临时文件必须被删除');
  assert.equal(existsSync(join(REPO_ROOT, 'rules', 'tmp-new-rule-V4.md')), false);
  assert.equal(git(['status', '--short', 'rules/']).stdout, beforeGit);
});

// TC-032 / R5：baseline.json === 常量渲染结果，且路径字典序、21 条。
test('TC-032 / R5：baseline.json 与 renderBaseline() 逐字节一致，路径字典序 21 条', () => {
  const text = readFileSync(BASELINE_PATH, 'utf8');
  assert.equal(text, renderBaseline());
  assert.equal(BASELINE_RULES.length, 21);
  assert.equal(JSON.parse(text).length, 21);
  assert.deepEqual(BASELINE_RULES, [...BASELINE_RULES].sort());
  for (const entry of BASELINE_RULES) {
    assert.match(entry, /^rules\/[^/\\]+\.md$/);
  }
});

// TC-058 / V9：连跑两遍实现集 → 逐字一致、无残留、git 干净、check-ignore 0。
test('TC-058 / V9：两遍输出逐字一致、无残留、git status 无新增、git check-ignore 0', { skip: process.env.DOCGEN_CHECK_ACTIVE === '1' ? 'nested check: V9 内含 V10/V10b/V11' : false }, () => {
  rmSync(SANDBOX_ROOT, { recursive: true, force: true });
  const beforeGit = git(['status', '--short', 'rules/']).stdout;
  const result = runCaseCli('V9');
  const output = combined(result);

  assert.equal(result.status, 0, output);
  assert.match(result.stdout, /^PASS V9$/m);
  assert.match(output, /两遍输出逐字一致/);
  assert.match(output, /check-ignore 0/);

  if (existsSync(SANDBOX_ROOT)) {
    assert.deepEqual(readdirSync(SANDBOX_ROOT), [], 'V9 结束后不得留下用例目录');
  }
  assert.equal(git(['status', '--short', 'rules/']).stdout, beforeGit);
});
