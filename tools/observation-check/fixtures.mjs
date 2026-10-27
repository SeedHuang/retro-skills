// 测试夹具公共构造器：临时目录 + 自建证据件 + 合法 doc 基具。
// 纪律：一律 mkdtempSync 自建于仓库内 .session/reviews/ 下，不引用仓库既有文件作证据（PRD §4.3 仓外/自建口径）
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { repoRoot } from './evidence.mjs';
import { REGISTERED_IDS } from './registered-ids.mjs';

export const IDS = REGISTERED_IDS;
export const rel = (abs) => relative(repoRoot(), abs).split(sep).join('/');

export function makeDir(prefix = 'test-obs-check-') {
  // .session/ 在 .gitignore 里：干净克隆没有该目录，不先建父目录则 mkdtempSync 抛 ENOENT（换机即全红）
  const parent = join(repoRoot(), '.session', 'reviews');
  mkdirSync(parent, { recursive: true });
  const dir = mkdtempSync(join(parent, prefix));
  return { dir, dispose: () => rmSync(dir, { recursive: true, force: true }) };
}

// 自建证据件 → { path（相对仓库根）, line, quote }；内容与引用逐字对应
export function evidenceLines(dir, lines, { name = 'ev.md', line = 1 } = {}) {
  const abs = join(dir, name);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, `${lines.join('\n')}\n`, 'utf8');
  return { path: rel(abs), line, quote: lines[line - 1] };
}

// 合法 doc 基具：read = items.length、total = REGISTERED_IDS.length、skipped = 差集（七条对账天然成立）
export function docBase({ evidence, items = null, open = [], closure = 'no-findings', round = 3, instance = null } = {}) {
  const list = items ?? [
    { id: 'k01', verdict: 'hit', evidence },
    { id: 'k02', verdict: 'na', reason: '不适用' },
  ];
  return {
    round,
    instance,
    items: list,
    open,
    coverage: {
      read: list.length,
      total: IDS.length,
      skipped: IDS.filter((id) => !list.some((it) => it.id === id)),
    },
    closure,
  };
}
