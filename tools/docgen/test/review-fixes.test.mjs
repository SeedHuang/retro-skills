// 回归测试：TRAE-code-review 修复（I1/I3/I5 + 二轮 J1/J4）
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { validateAgentData } from '../components/validateAgentData.mjs';
import { agentData, triggerTable } from '../components/agentData.mjs';
import { patternRegistry } from '../components/patternRegistry.mjs';

const CLI = 'tools/docgen/cli.mjs';
// J3 fix：模块级单一草稿箱，after 清理，不逐调用 mkdtempSync 泄漏
const box = mkdtempSync(join(tmpdir(), 'dg-rf-'));
after(() => rmSync(box, { recursive: true, force: true }));
const run = (args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, DOCGEN_DRAFTS_DIR: box } });

test('I1：draft/replace 对 registered 未拆槽席 → MissingComponentData（exit 2，不再崩溃/误标）', () => {
  const d = run(['draft', '--kind', 'agent', '--name', 'reviewer-qa']);
  assert.equal(d.status, 2, d.stdout + d.stderr);
  assert.match(d.stdout + d.stderr, /MissingComponentData/);
  const fake = join(box, 'fake.md');
  writeFileSync(fake, '# 伪造草稿\n');
  const r = run(['replace', '--kind', 'agent', '--name', 'reviewer-qa', '--draft', fake, '--yes']);
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stdout + r.stderr, /MissingComponentData/);
});

test('I3：generate --kind rule --name 精确到单对象（正：生成规则 exit 0；负：不存在 → DanglingBaselineEntry exit 2）', () => {
  const ok = run(['generate', '--kind', 'rule', '--name', 'spec-testcase-gate']);
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /baseline 35\/35/);
  const bad = run(['generate', '--kind', 'rule', '--name', 'ghost-rule']);
  assert.equal(bad.status, 2, bad.stdout + bad.stderr);
  assert.match(bad.stdout + bad.stderr, /DanglingBaselineEntry/);
});

test('I5：断言 4 tools 多出允许集 → ToolsViolation（恰等，不只查包含）', () => {
  const data = structuredClone(agentData);
  data[0].tools = [...patternRegistry.tools.readOnly, 'Write']; // 普通席多带 Write
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

test('J4：registered 席 draft 失败不创建草稿箱目录', () => {
  const p = join(tmpdir(), `dg-rf4-${Date.now()}`);
  const r = spawnSync(process.execPath, [CLI, 'draft', '--kind', 'agent', '--name', 'reviewer-qa'], { encoding: 'utf8', env: { ...process.env, DOCGEN_DRAFTS_DIR: p } });
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.ok(!existsSync(p), '失败路径不应创建草稿箱目录');
});
