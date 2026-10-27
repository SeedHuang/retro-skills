// PRD §5.2 归档目录三态判定（纯函数）。运行时门禁接线（check-all.mjs 增段 / 扫描根 / git 断言）归 S3。
export const STOCK_DIR_WHITELIST = new Set(['2026-10-25-1723-s6-eval']);

// 允许文件名类（限 <次>/ 根层与 <次>/cards/ 子层）
export const ALLOWED_FILE_RE = /^(progress\.md|cards\.md|problems\.md|submission\.md|impact-sheet\.md|detective\.md|round-check\.md|delivery-audit\.md)$/;

// 仓外证据快照层（PRD §5.2 C-15）：attachments/<file> 仅一层、文件名不限 8 类
export const ATTACHMENT_RE = /^attachments\/[^/]+$/;

// 非产物文件白名单（精确相对路径，一次性；9 个）
const STOCK_PREFIX = '2026-10-25-1723-s6-eval/';
export const STOCK_FILE_WHITELIST = new Set([
  'ab-score.md', 'capability-diff.md', 'checklist.md', 'impact-sheet.md', 'rubric.md',
  'cards/card-01.md', 'cards/card-02.md', 'cards/card-03.md', 'cards/card-04.md',
].map((f) => `${STOCK_PREFIX}${f}`));

export const ARTIFACT_RE = /^observation-r\d+(-[ab])?\.(json|md)$/;

// files = <次>/ 下的相对路径数组（如 ['progress.md', 'cards/card-01.md']）
export function scanReviewDir(dirName, files) {
  const codes = [];
  const hasArtifact = files.some((f) => !f.includes('/') && ARTIFACT_RE.test(f));
  if (!hasArtifact && !STOCK_DIR_WHITELIST.has(dirName)) {
    codes.push({ code: 'ArtifactMissing', message: `${dirName} 无 observation 产物且不在存量白名单` });
  }
  const stray = files.filter((f) => {
    if (!f.includes('/') && ARTIFACT_RE.test(f)) return false;
    if (STOCK_FILE_WHITELIST.has(`${dirName}/${f}`)) return false;
    if (f.startsWith('cards/')) return !ALLOWED_FILE_RE.test(f.slice('cards/'.length));
    if (f.startsWith('attachments/')) return !ATTACHMENT_RE.test(f);
    return !ALLOWED_FILE_RE.test(f);
  });
  if (stray.length) {
    codes.push({ code: 'UnclassifiedArtifact', message: `${dirName} 含未分类文件：${stray.join('、')}` });
  }
  return codes;
}
