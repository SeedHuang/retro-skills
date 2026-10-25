// scope-sweep.test.mjs —— 改判回扫脚本的判别力测试（6 例）
// 运行：node --test scripts/scope-sweep.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runSweep, runCheck, classify, loadConfig } from './scope-sweep.mjs';

function fixture({ doc = '旧话说一次\n无关行\n', baseline = { counts: { X: 1 } }, impact = '# 清单\n\nX 口径：docs/a.md 改\n' } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'scope-sweep-'));
  mkdirSync(join(root, 'docs'), { recursive: true });
  mkdirSync(join(root, 'tools/scope-sweep'), { recursive: true });
  writeFileSync(join(root, 'docs/a.md'), doc);
  writeFileSync(join(root, 'tools/scope-sweep/keywords.json'), JSON.stringify({
    entries: [{ id: 'X', words: ['旧话'], scope: ['docs/a.md'] }],
  }));
  if (baseline) writeFileSync(join(root, 'tools/scope-sweep/baseline.json'), JSON.stringify(baseline));
  if (impact !== null) {
    mkdirSync(join(root, '.session/reviews/r1'), { recursive: true });
    writeFileSync(join(root, '.session/reviews/r1/impact-sheet.md'), impact);
  }
  return root;
}

test('扫描：按口径计命中数，命中带 file:line', () => {
  const root = fixture();
  const r = runSweep({ root });
  assert.equal(r.counts.X, 1);
  assert.equal(r.hits[0].file, 'docs/a.md');
  assert.equal(r.hits[0].line, 1);
  rmSync(root, { recursive: true, force: true });
});

test('分类：历史 / 引用 / 正文三分', () => {
  assert.equal(classify('docs/handoffs/x.md', '旧话'), '历史');
  assert.equal(classify('docs/superpowers/specs/x.md', '见 §3.2 的旧话'), '引用');
  assert.equal(classify('docs/superpowers/specs/x.md', '旧话'), '正文');
});

test('判红：scope 里文件不存在 → 红（fail-closed）', () => {
  const root = fixture();
  writeFileSync(join(root, 'tools/scope-sweep/keywords.json'), JSON.stringify({
    entries: [{ id: 'X', words: ['旧话'], scope: ['docs/a.md', 'docs/missing.md'] }],
  }));
  const r = runCheck({ root });
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((s) => s.includes('scope 文件缺失')));
  rmSync(root, { recursive: true, force: true });
});

test('判绿：命中数 = 基线 + 清单含口径与文件', () => {
  const root = fixture();
  const r = runCheck({ root });
  assert.deepEqual(r.reasons, []);
  assert.equal(r.ok, true);
  rmSync(root, { recursive: true, force: true });
});

test('判红：命中数超过基线（改判后新增旧说法）', () => {
  const root = fixture({ doc: '旧话\n旧话\n' });
  const r = runCheck({ root });
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((s) => s.includes('> 基线')));
  rmSync(root, { recursive: true, force: true });
});

test('判红：无基线 / 无影响清单 → 红；配置含通配 → 加载即抛', () => {
  const noBaseline = fixture({ baseline: null });
  assert.ok(runCheck({ root: noBaseline }).reasons.some((s) => s.includes('无基线')));
  rmSync(noBaseline, { recursive: true, force: true });

  const noImpact = fixture({ impact: null });
  assert.ok(runCheck({ root: noImpact }).reasons.some((s) => s.includes('impact-sheet')));
  rmSync(noImpact, { recursive: true, force: true });

  const wild = fixture();
  writeFileSync(join(wild, 'tools/scope-sweep/keywords.json'), JSON.stringify({
    entries: [{ id: 'X', words: ['旧话'], scope: ['docs/**'] }],
  }));
  assert.throws(() => loadConfig(wild), /不许用通配/);
  rmSync(wild, { recursive: true, force: true });
});
