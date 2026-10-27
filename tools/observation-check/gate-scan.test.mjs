// 归档目录三态判定（G03–G05）：纯函数，只喂文件名数组不碰盘
// 编写者 / 独立性声明：senior-sdet 子代理，全新上下文；≠ spec 作者、≠ 施工者
import test from 'node:test';
import assert from 'node:assert/strict';
import { ALLOWED_FILE_RE, STOCK_DIR_WHITELIST, STOCK_FILE_WHITELIST, scanReviewDir } from './gate-scan.mjs';

const codesOf = (dir, files) => scanReviewDir(dir, files).map((c) => c.code);

test('G03 ArtifactMissing：无产物且不在存量白名单（允许类文件不误报）', () => {
  assert.deepEqual(codesOf('2026-10-20-0000-no-obs', ['progress.md']), ['ArtifactMissing']);
});

test('G04 UnclassifiedArtifact：杂件与缺产物并列（两形态）', () => {
  assert.ok(codesOf('2026-10-20-0000-stray', ['random-notes.md']).includes('UnclassifiedArtifact'));
  const both = codesOf('2026-10-20-0000-stray', ['random-notes.md', 'progress.md']);
  assert.equal(both.filter((c) => c === 'ArtifactMissing' || c === 'UnclassifiedArtifact').length, 2, both.join(','));
});

test('G05 三态绿分支：存量目录白名单 + 允许类 8 类（含 cards/ 子层）不误报', () => {
  assert.ok(STOCK_DIR_WHITELIST.has('2026-10-25-1723-s6-eval'));
  assert.equal(STOCK_FILE_WHITELIST.size, 9);
  assert.deepEqual(codesOf('2026-10-25-1723-s6-eval', ['rubric.md', 'cards/card-01.md']), []);
  assert.deepEqual(codesOf('2026-10-20-0000-ok', ['observation-r1.json', 'observation-r1.md']), []);

  const allowed = ['progress.md', 'cards.md', 'problems.md', 'submission.md', 'impact-sheet.md', 'detective.md', 'round-check.md', 'delivery-audit.md'];
  assert.deepEqual(allowed.filter((f) => !ALLOWED_FILE_RE.test(f)), []);
  // override O3（PRD §5.2 :403）：账本目录无产物 → ArtifactMissing 属预期；
  // 本用例只钉「允许类 8 类不误报 UnclassifiedArtifact」，故不在此断言零码
  const ledger = codesOf('2026-10-20-0000-ledger', [...allowed, 'cards/round-check.md']);
  assert.deepEqual(ledger, ['ArtifactMissing'], ledger.join(','));
});

test('G06 attachments/ 子层（PRD §5.2 C-15）：一层快照不误报，两层嵌套与根层同名判红', () => {
  // ① 一层：C-12 的仓外证据快照随产物归档 → 零码（通道走通）
  assert.deepEqual(codesOf('2026-10-20-0000-ok', ['observation-r1.json', 'observation-r1.md', 'attachments/niku-detection.md']), []);
  // ② 两层嵌套：C-15 只许一层 → UnclassifiedArtifact
  const deep = codesOf('2026-10-20-0000-ok', ['observation-r1.json', 'attachments/a/b.md']);
  assert.ok(deep.includes('UnclassifiedArtifact'), deep.join(','));
  // ③ 同一文件名放在根层不享受 attachments 豁免（防豁免泛化到 <次>/ 根层）
  const root = codesOf('2026-10-20-0000-ok', ['observation-r1.json', 'niku-detection.md']);
  assert.ok(root.includes('UnclassifiedArtifact'), root.join(','));
});
