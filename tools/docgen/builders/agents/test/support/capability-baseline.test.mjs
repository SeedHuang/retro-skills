// 抽取器自测（plan Task 1 Step 1）：基线端切分口径 + 恒真守卫（V-2 判定只看集合 diff）。
// 用例来源：docs/superpowers/plans/2026-10-25-s6-policy-single-source.md Task 1 Step 1（逐字）。
// 末两条为修复轮 1（评审 Important #1）补的 emit 门：缺 `--commit` 必抛（不取 HEAD 兜底）；
// 「改造前 commit 之外」的拒绝分支要等改造后提交才存在（当前本仓无含 policy/ 的 commit，见报告 §7.3）。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { factsFromBaselineText, diffFacts, verdict, emit } from './capability-baseline.mjs';

// 冻结来源 = **改造前那次提交里的旧卡文本**（Q8 删 3 项后，当前卡只剩 20 项，不能再读当前卡断言 23）。
// 为什么不用 `fixtures/capability-baseline.golden.json`：那是 facts JSON（只有数组、没有卡面 markdown），
// 喂不进 `factsFromBaselineText`（markdown 抽取器）。
// 锚 `641a7e7`（S6 交付提交）实测：`factsFromBaselineText` → `paths 23 / tools 6 / tier producer`。
const CARD = execFileSync('git', ['show', '641a7e7:agents/reviewer-audit.md'], { encoding: 'utf8' });

test('基线端：旧卡切分 8 字段，工具 6、路径 23（含 spec / plan）', () => {
  const f = factsFromBaselineText(CARD);
  assert.equal(f.tools.length, 6);
  assert.equal(f.tier, 'producer');
  assert.equal(f.forbiddenPaths.length, 23);
  assert.ok(f.forbiddenPaths.includes('spec / plan'));
});
test('恒真守卫：同输入判 pass，少一项判 fail', () => {
  const a = factsFromBaselineText(CARD);
  const b = structuredClone(a); b.forbiddenPaths.pop();
  assert.equal(verdict(diffFacts(a, b)), 'fail');
});
test('emit 守卫：缺 --commit 抛缺参数（不取 HEAD 兜底）', () => {
  assert.throws(() => emit({}), /--commit/);
});
test('emit：改造前 commit 通过守卫，只写指定 out-dir', () => {
  const base = JSON.parse(readFileSync('tools/docgen/fixtures/capability-baseline.json', 'utf8'));
  const dir = mkdtempSync(join(tmpdir(), 'cap-baseline-'));
  try {
    emit({ commit: base.sourceCommit, 'out-dir': dir });
    assert.deepEqual(readdirSync(dir).sort(), ['capability-baseline.golden.json', 'capability-baseline.json']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
