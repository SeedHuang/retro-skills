// .gitignore 判定（读仓根文件，供渲染与测试共用同一实现）。
// 支持本仓现有形态：目录项（`dir/`）、任意层级前缀（`**/x`）、无斜杠文件名（`*.x`）、普通相对路径。
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const GITIGNORE = join(ROOT, '.gitignore');
// 副本仓（测试夹具）可能不带 .gitignore：缺失时按「无忽略项」处理，渲染不因缺文件崩。
const PATTERNS = !existsSync(GITIGNORE) ? [] : readFileSync(GITIGNORE, 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l !== '' && !l.startsWith('#'));

const escapeRe = (s) => s.replace(/[.+^${}()|[\]\\]/g, '\\$&');
const globRe = (s) => escapeRe(s).replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]');

// 单个模式匹配（rel 统一用 `/`；占位符如 `{session}` 已由调用方替换成占位值）
export function matchesPattern(rel, pattern) {
  let p = pattern.replace(/^\/+/, '');
  if (p.endsWith('/')) {
    const d = p.slice(0, -1);
    return rel === d || rel.startsWith(d + '/');
  }
  if (p.startsWith('**/')) {
    const rest = p.slice(3);
    return rel === rest || rel.endsWith('/' + rest) || new RegExp(`(^|/)${globRe(rest)}$`).test(rel);
  }
  if (!p.includes('/')) return new RegExp(`(^|/)${globRe(p)}$`).test(rel);
  return new RegExp(`^${globRe(p)}$`).test(rel) || rel.startsWith(p + '/');
}

export function isIgnored(rel) {
  return PATTERNS.some((p) => matchesPattern(rel, p));
}

// 模型声明可写的产物路径中被 .gitignore 覆盖的那些（{session} 视为任意目录名）
export function ignoredArtifacts(M) {
  const ids = M?.permissions?.write?.allow ?? [];
  const forms = M?.forms ?? {};
  return ids
    .map((id) => forms[id]?.path)
    .filter((p) => typeof p === 'string' && p !== '')
    .map((p) => p.replace(/\{[^}]+\}/g, 'x'))
    .filter((p) => isIgnored(p));
}
