// 落点解析（spec §3 :38 / §7 :180 / §10-D18 :277 / §10-D21 :280）。
// `LANDING_VARS` 只在此 re-export（字面写死在 enums.mjs，不做第二份）。
import { LANDING_VARS } from './enums.mjs';

export { LANDING_VARS };

const membersOf = (v) => (v instanceof Set ? [...v] : Array.isArray(v) ? v : [...v]);
const has = (v, x) => (v && typeof v.has === 'function' ? v.has(x) : membersOf(v).includes(x));

// `resolveLanding(landing, landings, unboundVars) → { ok, reason? }`
// 三档（§7 :180）：
//   ① `landing` 缺 / 空 / 非字符串 → 不通过；
//   ② 按**最长已登记前缀**匹配（登记集 = `landings` ∪ `LANDING_VARS`），允许 `<登记值>/<子段>`，
//      子段按 `/` 逐段判、任一段 ∈ `unboundVars` 即红；
//   ③ 命中的**登记值本身** ∈ `unboundVars` → 红（`landing = 'review.dir'` 这一形态）。
// 本函数**不发射错误码**（码由 validateCardModel 的发射点按 Action 面发），只给判定结果。
export function resolveLanding(landing, landings, unboundVars) {
  if (typeof landing !== 'string' || landing.trim() === '') {
    return { ok: false, reason: 'missing' };
  }
  const registered = new Set([...Object.keys(LANDING_VARS), ...membersOf(landings)]);
  let hit = null;
  for (const reg of registered) {
    if (landing === reg || landing.startsWith(`${reg}/`)) {
      if (hit === null || reg.length > hit.length) hit = reg;
    }
  }
  if (hit === null) return { ok: false, reason: 'unregistered' };
  if (has(unboundVars, hit)) return { ok: false, reason: `unbound:${hit}` };
  const tail = landing.slice(hit.length + 1);
  if (tail) {
    for (const seg of tail.split('/').filter(Boolean)) {
      if (has(unboundVars, seg)) return { ok: false, reason: `unbound-segment:${seg}` };
    }
  }
  return { ok: true };
}
