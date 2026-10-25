// 回归测试：TRAE-code-review 修复（I1/I3/I5 + 二轮 J1/J4）
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { validateAgentData } from '../components/validateAgentData.mjs';
import { agentData, triggerTable } from '../components/agentData.mjs';
import { tierOf, toolsForSeat } from '../components/patternRegistry.mjs';
import { cmdDraft, cmdReplace } from '../cli.mjs';
import { BASELINE_RULES, agentPaths } from '../components/baseline.mjs';

const CLI = 'tools/docgen/cli.mjs';
// gate 打印的 baseline N/N 与两清单同源：正则从常量拼，不写死条数
const N = BASELINE_RULES.length + agentPaths().length;
// J3 fix：模块级单一草稿箱，after 清理，不逐调用 mkdtempSync 泄漏
const box = mkdtempSync(join(tmpdir(), 'dg-rf-'));
after(() => rmSync(box, { recursive: true, force: true }));
const run = (args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, DOCGEN_DRAFTS_DIR: box } });

// 未拆槽样本必须进程内合成：12 席拆槽后没有现成的 registered 席可当样本（TC-203 合法方式）
const assertFail = (fn, code) => {
  try { fn(); assert.fail(`应抛 ${code}`); }
  catch (e) {
    if (e.code === undefined) throw e; // assert.fail 的 AssertionError 原样抛出，不吞
    assert.equal(e.code, code);
    assert.equal(e.exitCode, 2, 'MissingComponentData 属 exit 2 档');
  }
};

test('I1：draft/replace 对未拆槽席 → MissingComponentData（exit 2，不再崩溃/误标）', () => {
  const saved = triggerTable['reviewer-qa'];
  delete triggerTable['reviewer-qa'];
  try {
    assertFail(() => cmdDraft({ kind: 'agent', name: 'reviewer-qa' }, ['draft']), 'MissingComponentData');
    const fake = join(box, 'fake.md');
    writeFileSync(fake, '# 伪造草稿\n');
    assertFail(() => cmdReplace({ kind: 'agent', name: 'reviewer-qa', draft: fake, yes: true }), 'MissingComponentData');
  } finally {
    triggerTable['reviewer-qa'] = saved;
  }
});

test('I3：generate --kind rule --name 精确到单对象（正：生成规则 exit 0；负：不存在 → DanglingBaselineEntry exit 2）', () => {
  const ok = run(['generate', '--kind', 'rule', '--name', 'spec-testcase-gate']);
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, new RegExp(`baseline ${N}\\/${N}`));
  const bad = run(['generate', '--kind', 'rule', '--name', 'ghost-rule']);
  assert.equal(bad.status, 2, bad.stdout + bad.stderr);
  assert.match(bad.stdout + bad.stderr, /DanglingBaselineEntry/);
});

test('I5：断言 4 tools 多出允许集 → ToolsViolation（恰等，不只查包含）', () => {
  const data = structuredClone(agentData);
  // 样本必须是运行时 readOnly 席：data[0] 是 reviewer-audit（producer 档），拿它当普通席会把命题换成「producer 少给工具被拒」
  const sample = data.find((a) => a.name === 'reviewer-qa');
  assert.equal(tierOf(sample.name), 'readOnly');
  sample.tools = [...toolsForSeat(sample.name), 'Write']; // 普通席多带 Write
  try {
    validateAgentData(data, triggerTable);
    assert.fail('应抛 ToolsViolation');
  } catch (e) {
    assert.equal(e.code, 'ToolsViolation');
  }
});

test('J1：断言 4 对非数组 tools → ToolsViolation（不抛 TypeError）', () => {
  const data = structuredClone(agentData);
  data[0].tools = 'ReadGlobGrep'; // 畸形非数组 truthy，含全部允许名
  try {
    validateAgentData(data, triggerTable);
    assert.fail('应抛 ToolsViolation');
  } catch (e) {
    assert.equal(e.code, 'ToolsViolation');
  }
});

test('J4：未拆槽席 draft 失败不创建草稿箱目录', () => {
  const p = join(tmpdir(), `dg-rf4-${Date.now()}`);
  const saved = triggerTable['reviewer-qa'];
  const savedEnv = process.env.DOCGEN_DRAFTS_DIR;
  delete triggerTable['reviewer-qa'];
  process.env.DOCGEN_DRAFTS_DIR = p;
  try {
    assertFail(() => cmdDraft({ kind: 'agent', name: 'reviewer-qa' }, ['draft']), 'MissingComponentData');
  } finally {
    triggerTable['reviewer-qa'] = saved;
    if (savedEnv === undefined) delete process.env.DOCGEN_DRAFTS_DIR;
    else process.env.DOCGEN_DRAFTS_DIR = savedEnv;
  }
  assert.ok(!existsSync(p), '失败路径不应创建草稿箱目录');
});
