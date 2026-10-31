// S1 · C 组（计数与 baseline）+ 仓级负例：TC-C01~C09、C11；D02、D06；E05、E09、E12、E32
// 12 处计数一律派生化：正常态三条探针零命中；负例只把「某个派生表达式换回字面量」喂给同一探针。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync, renameSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { BASELINE_RULES, agentPaths } from '../components/baseline.mjs';
import { agentData, triggerTable } from '../components/agentData.mjs';
import { validateAgentData } from '../components/validateAgentData.mjs';
import { checkAgentFile } from '../../execution-matrix/check-agent.mjs';
import {
  ROOT, readRepo, readCounterFiles, counterProbes, withRepoCopy, runCli, runEsm,
} from './support/dev-workflow-checks.mjs';

const N = BASELINE_RULES.length + agentPaths().length;

test('TC-C01 gate 输出 baseline N/N（N = rule 数 + agent 数，从常量派生）', () => {
  const r = runCli(ROOT, ['gate']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(r.stdout.trim(), `baseline ${N}/${N}`);
  assert.equal(r.stderr, '');
});

test('TC-C02 baseline.json 条数与派生值一致，evidence-reader 排序位正确', () => {
  const j = JSON.parse(readRepo('tools/docgen/baseline.json'));
  assert.equal(j.length, BASELINE_RULES.length + agentPaths().length);
  assert.equal(j.indexOf('agents/evidence-reader.md') - j.indexOf('agents/detective-observer.md'), 1);
  assert.ok(j[j.length - 1].startsWith('agents/'), 'rule 在前、agent 按字典序在后');
});

test('TC-C03 BASELINE_RULES 含新规则，agentPaths 含 evidence-reader 且条数同源', () => {
  assert.equal(BASELINE_RULES.includes('rules/dev-workflow-mainline.md'), true);
  assert.equal(agentPaths().includes('agents/evidence-reader.md'), true);
  assert.equal(agentPaths().length, agentData.length);
});

test('TC-C04 全仓检查的前三环在本仓为绿（gate / A 组 15 席 / skill-inspector）', () => {
  const g = runCli(ROOT, ['gate']);
  assert.equal(g.status, 0, g.stdout + g.stderr);
  for (const a of agentData) {
    const r = checkAgentFile(a.name);
    assert.equal(r.ok, true, `${a.name}: ${JSON.stringify(r.findings)}`);
  }
  const s = spawnSync(process.execPath, ['skills/skill-inspector/scripts/check.mjs'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(s.status, 0, s.stdout + s.stderr);
  assert.match(s.stdout, /^0 findings/);
});

test('TC-C05 生产侧已升级、测试侧仍写死 35 → 探针必红', () => {
  const files = readCounterFiles();
  const text = files['check-baseline.test.mjs'];
  assert.ok(text.includes('BASELINE_RULES.length + agentPaths().length'), '正常态必须是派生式');
  const mutated = { 'check-baseline.test.mjs': text.replace('assert.equal(json.length, BASELINE_RULES.length + agentPaths().length);', 'assert.equal(json.length, 35);') };
  assert.notEqual(mutated['check-baseline.test.mjs'], text, '构造必须真的改到文本');
  assert.ok(counterProbes(mutated).baseline.length >= 1, '写回字面量必须被探针抓到');
});

test('TC-C06 12 处一个字未改 → 探针必红', () => {
  const files = readCounterFiles();
  assert.deepEqual(counterProbes(files).baseline, [], '正常态不得再有 35/36/37 字面量');
  assert.deepEqual(counterProbes(files).seatAssert, [], '正常态断言行不得有 14/15 字面量');
  const mutated = { ...files, 'data.test.mjs': files['data.test.mjs'].replace('assert.equal(paths.length, agentData.length);', 'assert.equal(paths.length, 14);') };
  assert.ok(counterProbes(mutated).seatAssert.length >= 1, '半改必须被探针抓到');
});

test('TC-C07 同文件第三处席位计数写成字面量 → 必红', () => {
  const files = readCounterFiles();
  const mutated = { ...files, 'data.test.mjs': files['data.test.mjs'].replace('assert.equal(new Set(names).size, names.length);', 'assert.equal(new Set(names).size, 14);') };
  assert.notEqual(mutated['data.test.mjs'], files['data.test.mjs']);
  assert.ok(counterProbes(mutated).seatAssert.length >= 1);
});

test('TC-C08 baseline 正则 / 未迁移计数写回字面量 → 必红', () => {
  const files = readCounterFiles();
  const cli = files['cli-gate.test.mjs'].replace('assert.match(r.stdout, new RegExp(`baseline ${N}\\\\/${N}`));', 'assert.match(r.stdout, /baseline 35\\/35/);');
  const pilot = files['pilot-gate.test.mjs'].replace('new RegExp(`已接管 0，未迁移 ${agentData.length}`)', '/已接管 0，未迁移 14/');
  assert.notEqual(cli, files['cli-gate.test.mjs']);
  assert.notEqual(pilot, files['pilot-gate.test.mjs']);
  const p = counterProbes({ 'cli-gate.test.mjs': cli, 'pilot-gate.test.mjs': pilot });
  assert.ok(p.baseline.length >= 1);
  assert.ok(p.seatAssert.length >= 1);
});

test('TC-C09 BASELINE_RULES 加了条目但 baseline.json 未重生成 → gate 报 BaselineDrift（exit 2）', () => {
  withRepoCopy((dst) => {
    const p = join(dst, 'tools', 'docgen', 'components', 'baseline.mjs');
    const t = readFileSync(p, 'utf8');
    const patched = t.replace("'rules/vitest-queued-alternative.md',", "'rules/vitest-queued-alternative.md', 'rules/zzz-drift-probe.md',");
    assert.notEqual(patched, t, '构造前提：能改到 BASELINE_RULES');
    writeFileSync(p, patched);
    writeFileSync(join(dst, 'rules', 'zzz-drift-probe.md'), '# 探针\n');
    const r = runCli(dst, ['gate']);
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.match(r.stderr, /^BaselineDrift:/m);
  });
});

test('TC-C11 12 处逐行派生化：三条探针零命中 + 每条处置后表达式在位', () => {
  const files = readCounterFiles();
  const p = counterProbes(files);
  assert.deepEqual(p.baseline, [], `仍有 baseline 字面量：${p.baseline.join(',')}`);
  assert.deepEqual(p.seatAssert, [], `仍有席位数字面量：${p.seatAssert.join(',')}`);

  const data = files['data.test.mjs'];
  for (const expr of [
    'assert.equal(agentData.length, new Set(agentData.map((a) => a.name)).size)',
    'assert.equal(new Set(names).size, names.length)',
    'assert.equal(paths.length, agentData.length)',
    '// rule 数 + agent 数',
    "assert.ok(names.includes('evidence-reader'))",
  ]) assert.ok(data.includes(expr), `data.test.mjs 缺：${expr}`);

  assert.ok(files['check-baseline.test.mjs'].includes('BASELINE_RULES.length + agentPaths().length'));
  assert.ok(files['check-baseline.test.mjs'].includes('new RegExp(`baseline ${N}'));
  assert.ok(files['e2e-final.test.mjs'].includes('new RegExp(`baseline ${n}'));
  // 下限而非等式：删掉一处派生断言仍会红，正常新增一处 gate 调用不再误红（字面量零残留由上面的探针兜）
  assert.ok((files['cli-gate.test.mjs'].match(/new RegExp\(`baseline \$\{N\}/g) ?? []).length >= 3, 'cli-gate 的 baseline 断言必须保留派生式（不得删或回写字面量）');
  assert.ok((files['review-fixes.test.mjs'].match(/new RegExp\(`baseline \$\{N\}/g) ?? []).length >= 1, 'review-fixes 的 baseline 断言必须保留派生式');
  assert.ok(files['pilot-gate.test.mjs'].includes('未迁移 ${agentData.length}'));
});

test('TC-D02 agents/ 下文件恰为 agentPaths()（无凭空手写卡）', () => {
  const onDisk = readdirSync(join(ROOT, 'agents')).filter((f) => f.endsWith('.md')).sort();
  assert.deepEqual(onDisk, agentPaths().map((p) => p.slice('agents/'.length)).sort());
});

test('TC-D06 触发条件被改 → gate 报 Mismatch（exit 1）', () => {
  withRepoCopy((dst) => {
    // S4 迁移后 description = trigger.when 直出：改 triggerTable 的 when 即可造出「渲染 ≠ 盘上」；
    // 本席取仍未迁移的 senior-sdet（其余席已走新卡，DOMAIN 不再参与 description 拼装）
    const p = join(dst, 'tools', 'docgen', 'components', 'agentData.mjs');
    const t = readFileSync(p, 'utf8');
    const patched = t.replace('或专门找出被忽视的边界与失败场景', '或专门找出被忽视的边界与失败情形');
    assert.notEqual(patched, t, '构造前提：能改到 senior-sdet 的 when');
    writeFileSync(p, patched);
    const r = runCli(dst, ['gate']);
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stderr, /^Mismatch:/m);
  });
});

test('TC-E05 手写卡绕过生成器 → gate 非 0，明细含 UnregisteredHandwritten', () => {
  // 构造 A：把条目从 agentData 与 triggerTable 一并删掉（卡仍在原路径）→ 该卡变成「无人登记的手写卡」
  withRepoCopy((dst) => {
    const p = join(dst, 'tools', 'docgen', 'components', 'agentData.mjs');
    const t = readFileSync(p, 'utf8');
    const s = t.indexOf('  // 阅读取证员');
    const e = t.indexOf('  // translation-self-check');
    assert.ok(s > -1 && e > s, '构造前提：能找到 evidence-reader 条目块');
    let patched = t.slice(0, s) + t.slice(e);
    const withTrigger = patched;
    patched = patched.replace(/\n  'evidence-reader': \{\n    when: '[^']*',\n    route: 'evidence-reader',\n  \},/, '');
    assert.notEqual(patched, withTrigger, '构造前提：能删到 triggerTable 条目');
    writeFileSync(p, patched);
    const g = runCli(dst, ['gate']);
    assert.notEqual(g.status, 0, '绕过生成器必须非 0');
    const detail = runEsm(dst, "import {collectGate} from './tools/docgen/cli.mjs'; console.log(collectGate().map(d=>d.code+':'+d.path).join('|'))");
    assert.ok(detail.stdout.includes('UnregisteredHandwritten:agents/evidence-reader.md'), detail.stdout + detail.stderr);
  });
  // 构造 B：另加一个手写文件
  withRepoCopy((dst) => {
    writeFileSync(join(dst, 'agents', 'ghost-handwritten.md'), '# 手写卡\n');
    const r = runCli(dst, ['gate']);
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.match(r.stderr, /^UnregisteredHandwritten:/m);
  });
});

test('TC-E09 全量门在计数只改一处时必红（探针在单点构造下命中）', () => {
  const files = readCounterFiles();
  const mutated = { ...files, 'data.test.mjs': files['data.test.mjs'].replace('assert.equal(agentData.length, new Set(agentData.map((a) => a.name)).size);', 'assert.equal(agentData.length, 14);') };
  assert.notEqual(mutated['data.test.mjs'], files['data.test.mjs'], '构造前提：只改这一处');
  assert.equal(counterProbes(mutated).seatAssert.length, 1, '只改一处时探针恰好命中一处');
});

test('TC-E12 规则登记了但文件不存在 → gate 报 DanglingBaselineEntry（exit 2）', () => {
  withRepoCopy((dst) => {
    renameSync(join(dst, 'rules', 'dev-workflow-mainline.md'), join(dst, 'rules', 'dev-workflow-mainline.md.bak'));
    const r = runCli(dst, ['gate']);
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.match(r.stderr, /^DanglingBaselineEntry:/m);
    const detail = runEsm(dst, "import {collectGate} from './tools/docgen/cli.mjs'; console.log(collectGate().map(d=>d.code+':'+d.path).join('|'))");
    assert.ok(detail.stdout.includes('DanglingBaselineEntry:rules/dev-workflow-mainline.md'), detail.stdout + detail.stderr);
  });
});

test('TC-E32 槽位字段真被 BASE_KEYS 管住：非声明席带 boundary 报 DescriptionDerivation，未知键报 TriggerFieldMisplaced', () => {
  const src = readRepo('tools/docgen/components/validateAgentData.mjs');
  assert.ok(src.includes("'domain', 'boundary', 'explorePolicy'"), 'BASE_KEYS 必须显式声明三键');

  const withBoundary = structuredClone(agentData);
  withBoundary.find((a) => a.name === 'reviewer-qa').boundary = '越界声明';
  assert.throws(() => validateAgentData(withBoundary, triggerTable), (e) => e.code === 'DescriptionDerivation');

  const withUnknown = structuredClone(agentData);
  withUnknown.find((a) => a.name === 'evidence-reader').notARealKey = 1;
  assert.throws(() => validateAgentData(withUnknown, triggerTable), (e) => e.code === 'TriggerFieldMisplaced');
});
