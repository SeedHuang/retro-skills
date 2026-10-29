// 合并族（spec §3 :44 / §7 :206 / §10-D9 :268 / §10-D19 :278）。
// 3 个合并码**不入** `CARD_MODEL_CODES`，也不经四入口——合并是独立第五调用，`validateCardModel` **不执行合并**。
export const OVERRIDABLE_FIELDS = Object.freeze(['kind', 'trigger', 'objects', 'criterion', 'landing', 'requires']);

// 合并码用本文件的局部常量（不进唯一码表，§6 :147）。
export const MERGE_CODES = Object.freeze({
  DuplicateStatement: 'DuplicateStatement',
  OverrideWithoutReason: 'OverrideWithoutReason',
  PointlessOverride: 'PointlessOverride',
});

const stable = (v) => JSON.stringify(v, (k, val) => {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    return Object.fromEntries(Object.keys(val).sort().map((kk) => [kk, val[kk]]));
  }
  return val;
});
const sameFields = (a, b) => OVERRIDABLE_FIELDS.every((f) => stable(a[f]) === stable(b[f]));

// `mergeActions(shared, own) → { ok, errors, overrides }`（§6 :142；返回形状写死 `{ok, errors}`）。
// - 同层同 id（本层内重复）或跨层「零差异且无 `reason`」→ `DuplicateStatement`
// - 跨层覆盖（字段有差异）但无 `reason` → `OverrideWithoutReason`
// - 跨层覆盖带 `reason` 但零差异 → `PointlessOverride`
// - 否则接受覆盖：`overrides[] = { id, changed: [...OVERRIDABLE_FIELDS 中的差异项] }`
export function mergeActions(shared, own) {
  const errors = [];
  const overrides = [];
  const sh = Array.isArray(shared) ? shared : [];
  const ow = Array.isArray(own) ? own : [];
  const pushErr = (code, id) => errors.push({ code, path: `actions[${id}]`, message: `${code}：${id}` });

  const dupInLayer = (list) => {
    const seen = new Set();
    const dups = new Set();
    for (const a of list) {
      if (!a || typeof a.id !== 'string') continue;
      if (seen.has(a.id)) dups.add(a.id);
      seen.add(a.id);
    }
    return dups;
  };
  for (const id of dupInLayer(sh)) pushErr(MERGE_CODES.DuplicateStatement, id);
  for (const id of dupInLayer(ow)) pushErr(MERGE_CODES.DuplicateStatement, id);

  for (const a of ow) {
    if (!a || typeof a.id !== 'string') continue;
    const base = sh.find((x) => x && x.id === a.id);
    if (!base) continue;
    const hasReason = typeof a.reason === 'string' && a.reason.trim() !== '';
    const identical = sameFields(base, a);
    if (identical && !hasReason) {
      pushErr(MERGE_CODES.DuplicateStatement, a.id);
    } else if (!hasReason) {
      pushErr(MERGE_CODES.OverrideWithoutReason, a.id);
    } else if (identical) {
      pushErr(MERGE_CODES.PointlessOverride, a.id);
    } else {
      overrides.push({ id: a.id, changed: OVERRIDABLE_FIELDS.filter((f) => stable(base[f]) !== stable(a[f])) });
    }
  }
  return { ok: errors.length === 0, errors, overrides };
}
