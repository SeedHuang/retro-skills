// S1 · A 组（规则侧）：TC-A07 / E04 / E31
// 为什么单独成文件：A07 只依赖 rules/dev-workflow-mainline.md，T1 后即可绿；
// 与 A 组其余用例（依赖 skills/dev-workflow/**，T3 后才有）分开放，中间态不会整片红。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readRepo, ruleHeadings, ruleItems, ruleExceptionReport, ruleVerifyReport, ruleCopyReport, section } from './support/dev-workflow-checks.mjs';

const RULE = 'rules/dev-workflow-mainline.md';
const rule = readRepo(RULE);

test('TC-A07 规则五段结构齐 + R1–R7 七条 + 例外节（存量豁免 + 时点）+ 验证节两条自查命令', () => {
  assert.deepEqual(ruleHeadings(rule), [true, true, true, true, true], '五个必备节标题');
  assert.deepEqual(ruleItems(rule), [true, true, true, true, true, true, true], 'R1–R7');

  const ex = ruleExceptionReport(rule);
  assert.equal(ex.exists, true);
  assert.equal(ex.hasStock, true, '例外节必须写存量豁免');
  assert.equal(ex.hasPoint, true, '例外节必须写升级时点（具体日期或可核事件）');
  assert.equal(ex.longEnough, true, '例外节不得只写一句');
  assert.equal(ex.vague, false, '时点不得写「以后 / 下次」');

  const v = ruleVerifyReport(rule);
  assert.ok(v.commands >= 2, `验证节必须给两条可粘贴命令，实为 ${v.commands}`);
  assert.equal(v.signDiff, true, '验证节须含「签字人 ≠ 申报人」自查');
  assert.equal(v.splitting, true, '验证节须含「拆 spec 中」计数自查');
});

test('TC-A07b（本批新增）「可粘贴命令」判据收紧：散文中提及不计数、删一条真命令必降', () => {
  const v = ruleVerifyReport(rule);
  assert.equal(v.commands, 2, `验证节现应恰 2 条可粘贴命令，实为 ${v.commands}`);
  const lines = rule.split('\n');
  const i = lines.findIndex((l) => l.startsWith('`node scripts/scope-sweep.mjs --check`'));
  assert.ok(i > -1, '验证节应有 scope-sweep 那条命令');
  const mutated = [...lines.slice(0, i), ...lines.slice(i + 1)].join('\n');
  assert.equal(ruleVerifyReport(mutated).commands, 1, '删掉一条真命令后必须降为 1（防散文凑数）');
});

test('TC-E04 规则不复制 PRD 判据正文（禁句零命中），且以 PRD § 节号引用 ≥ 6 处', () => {
  const r = ruleCopyReport(rule);
  assert.deepEqual(r.bannedHits, [], '规则里出现了 PRD 判据正文原句（两处维护必漂）');
  assert.ok(r.prdRefs >= 6, `PRD § 引用过少（${r.prdRefs}），判据出处不足`);
});

test('TC-E31 例外节只写「无例外」→ 判据三项不全为真，必被检出', () => {
  const i = rule.indexOf('## 例外');
  const j = rule.indexOf('## 触发时机');
  assert.ok(i > -1 && j > i, '正常态应有「## 例外」节');
  const mutated = `${rule.slice(0, i)}## 例外\n\n无例外。\n\n${rule.slice(j)}`;
  assert.notEqual(mutated, rule, '构造必须真的改到文本');
  assert.equal(section(mutated, '例外').includes('无例外'), true, '构造态应已写入「无例外」');

  const ex = ruleExceptionReport(mutated);
  assert.equal(ex.exists, true, '「无例外」在语法上仍满足「有这一节」——这正是漏检形态');
  assert.ok(!(ex.hasStock && ex.hasPoint && ex.longEnough), '构造态必须被判红（三项不全为真）');
});
