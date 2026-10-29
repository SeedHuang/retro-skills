// 判据表达式判定（spec §3 :43 / §7 :191-195 / §10-D13 :272）。
// 只做判定、不发射错误码（码由 validateCardModel 在 Task 6 的发射点按 §8 组 3 / 组 4 的次序发）。
import { criterionTerms } from './vocab/criterion-terms.mjs';

// ▸ `ALLOWED_OPS` = JSON Logic 标准算子集（spec §7 :191 只写「JSON Logic 算子集」，未枚举；
//   清单**写死在本文一处**——复列即第二处口径，必漂）。
export const ALLOWED_OPS = Object.freeze(Object.fromEntries([
  'if', 'and', 'or', '==', '===', '!=', '!==', '!', '!!',
  '?:', '<', '<=', '>', '>=', 'min', 'max', '+', '-', '*', '/', '%',
  'cat', 'substr', 'in', 'log', 'merge', 'array', 'var', 'missing', 'missing_some',
  'some', 'none', 'all', 'filter', 'map', 'reduce', 'method',
].map((k) => [k, k])));

// ▸ 单位 → `params` 键映射（spec §7 :194 写死的七项，唯一写死处；映射外单位一律红）。
export const UNIT_KEY = Object.freeze({
  次: 'times', 条: 'count', 字: 'chars', 个: 'items', 轮: 'rounds', 处: 'spots', '%': 'percent',
});

// `异` 取值器不是算子（单层 `{<op>:[{var:'x'}]}` 合法，testcase C03 ③）。
const LEAF_OPS = new Set(['var', 'missing', 'missing_some']);

// `isJsonLogic(expr)`：出现 `&&` / `||` 串、对象节点键数 ≠ 1、键 ∉ `ALLOWED_OPS` → 不可读（§7 :191）。
export function isJsonLogic(expr) {
  if (typeof expr === 'string') return !(expr.includes('&&') || expr.includes('||'));
  if (Array.isArray(expr)) return expr.every((c) => isJsonLogic(c));
  if (expr === null || typeof expr !== 'object') return true;
  const keys = Object.keys(expr);
  if (keys.length !== 1) return false;
  if (!ALLOWED_OPS[keys[0]]) return false;
  return isJsonLogic(expr[keys[0]]);
}

// `operatorDepth(expr)`：算子嵌算子 = 深度 > 1；单层合法（§7 :192）。
export function operatorDepth(expr) {
  const depth = (node) => {
    if (Array.isArray(node)) return node.reduce((m, c) => Math.max(m, depth(c)), 0);
    if (node === null || typeof node !== 'object') return 0;
    const keys = Object.keys(node);
    if (keys.length !== 1) return 0;
    const op = keys[0];
    if (LEAF_OPS.has(op)) return 0;
    return 1 + depth(node[op]);
  };
  return depth(expr);
}

// `scanCriterionText(text)`：返回三个命中面（termHits / thresholdHits / unitHits，§7 :193-195 与 §4.2 :106）。
// 阈值探针 = 「数字 + 单位字符」；命中映射外单位时 `key === null`（调用方一律判红）。
const THRESHOLD_RE = /([0-9０-９]+|[零一二三四五六七八九十百千万]+)\s*([^\s\d０-９，。、；：！？（）()\[\]{}])/g;

export function scanCriterionText(text) {
  const s = typeof text === 'string' ? text : '';
  const termHits = criterionTerms.filter((t) => s.includes(t));
  const thresholdHits = [...s.matchAll(THRESHOLD_RE)].map((m) => {
    const unit = m[2];
    return { value: m[1], unit, key: UNIT_KEY[unit] || null };
  });
  return { termHits, thresholdHits, unitHits: thresholdHits.map((t) => t.unit) };
}
