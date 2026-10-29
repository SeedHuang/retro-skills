// 开放项 scope 派生与三码校验（spec §3 :42 / §5 :132-133 / §7 :197-199 / §10-D7 :266 / §10-D14 :273）。
// `SCOPES` 只在此 re-export（字面写死在 enums.mjs，不做第二份）。
import { SCOPES } from './enums.mjs';
import { registeredIdsOf } from './validateCardModel.mjs';

export { SCOPES };

// 顺序敏感的**最长前缀**映射表（§5 :132：「为什么必须是最长前缀」见 :133）。
// 写死在本文件，不读配置（D7）。
const SCOPE_PREFIXES = Object.freeze([
  ['docs/superpowers/reviews/', 'process'],
  ['.session/', 'process'],
  ['agents/', 'card'],
  ['tools/', 'code'],
  ['scripts/', 'code'],
  ['docs/', 'doc'],
]);

// `deriveScope(object)`：先 `\` → `/` 归一（§5 :132），再自上而下取首个命中前缀；其余 → `repo`。
export function deriveScope(object) {
  const p = String(object === undefined || object === null ? '' : object).replace(/\\/g, '/');
  for (const [prefix, scope] of SCOPE_PREFIXES) {
    if (p.startsWith(prefix)) return scope;
  }
  return 'repo';
}

const errorsOf = (code, path, message) => ({ ok: false, errors: [{ code, path, message }] });

// `validateOpenItems(doc, env, cards) → { ok, errors }`（§6 :139）。
// **只判三码**（§7 :208）：`DuplicateAsOpen` → `OutOfScopeOpenItem` → `EmptyOpenWithoutReason`
//（§8 组 7 的同判定面顺序，先命中先报）；缺列（`MissingOpenField`）归 S2 `checks.mjs`，此处不复判（D14）。
// 第三参 `cards` 用于 §6 :154 的派生对账（`env.registeredIds` ≠ `registeredIdsOf(cards)` → `UnverifiableOutput`），
// 该对账在 validateCardModel 的 Task 4 契约层接入；缺参不单独报码（已签 testcase H05 ③/④ 以两参形态调用）。
export function validateOpenItems(doc, env, cards) {
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    return errorsOf('UnverifiableOutput', 'doc', 'doc 非对象（§6 :153）');
  }
  if (!env || !env.registeredIds) {
    return errorsOf('UnverifiableOutput', 'env.registeredIds', 'env.registeredIds 缺失（§6 :143）');
  }
  // §6 :154 registeredIds 单源：调用方给了 `cards` 就必须与 `registeredIdsOf(cards)` 一致
  if (Array.isArray(cards)) {
    const derived = registeredIdsOf(cards);
    const equal = env.registeredIds.size === derived.size && [...env.registeredIds].every((x) => derived.has(x));
    if (!equal) {
      return errorsOf('UnverifiableOutput', 'env.registeredIds', 'env.registeredIds ≠ registeredIdsOf(cards)（§6 :154）');
    }
  }
  const open = Array.isArray(doc.open) ? doc.open : [];
  // 组 7 顺序 ①：`object` 与任一 `registeredIds` 成员**逐字**相等（§7 :199）
  for (let i = 0; i < open.length; i += 1) {
    const it = open[i] || {};
    if (env.registeredIds.has(it.object)) {
      return errorsOf('DuplicateAsOpen', `open[${i}].object`, `「${it.object}」是固定项 id，不得登记为开放项（§7 :199）`);
    }
  }
  // 组 7 顺序 ②：`scope` ≠ `deriveScope(object)`（§7 :198；`scope` 缺失同此码，H05 ④）
  for (let i = 0; i < open.length; i += 1) {
    const it = open[i] || {};
    const want = deriveScope(it.object);
    if (it.scope !== want) {
      return errorsOf('OutOfScopeOpenItem', `open[${i}].scope`, `scope「${it.scope}」≠ 派生值「${want}」（§7 :198）`);
    }
  }
  // 组 7 顺序 ③：`open` 空且 `openEmptyReason` 缺 / 去空白为空（§7 :197）
  if (open.length === 0) {
    const reason = doc.openEmptyReason;
    if (typeof reason !== 'string' || reason.trim() === '') {
      return errorsOf('EmptyOpenWithoutReason', 'open', 'open 为空且未给可核理由（§7 :197）');
    }
  }
  return { ok: true, errors: [] };
}
