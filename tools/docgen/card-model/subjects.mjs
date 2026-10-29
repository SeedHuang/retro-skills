// 主语登记表与三态入口（spec §3 :41 / §5 :131 / §6 :140-141 / §7 :184-185 / :200 / :202）。
// `SUBJECTS` 是**登记表、不是第 9 张封闭枚举**（§5 :131）：迁移起点 = PRD `:293` 的两项，S4 扩到 15 席。
// `SUBJECT_VALIDATORS` = `SUBJECTS` 的 `validator` 投影（供 `UnverifiableOutput` 判「有没有校验器」）。
import { VERDICTS } from './enums.mjs';

const nonEmptyObject = (v) => v !== null && typeof v === 'object' && Object.keys(v).length > 0;

export const SUBJECTS = Object.freeze({
  'reviewer-detective.card': Object.freeze({ display: '侦探卡', validator: nonEmptyObject }),
  'artifact.observation': Object.freeze({ display: '观察产物', validator: nonEmptyObject }),
});

export const SUBJECT_VALIDATORS = Object.freeze(
  Object.fromEntries(Object.entries(SUBJECTS).map(([k, v]) => [k, v.validator])),
);

const errorsOf = (code, path, message) => ({ ok: false, errors: [{ code, path, message }] });
const OK = Object.freeze([]);

// `subjectMatches(subject, objectType)`：缺省 `objectType` 沿用 `subject`（PRD §3.5 :208）。
export function subjectMatches(subject, objectType) {
  return (objectType === undefined || objectType === null ? subject : objectType) === subject;
}

// `verdictAllowed(subject, objectType, verdict) → { ok, errors }`（不是布尔，§6 :141）。
// `FreeTextEnum`：`verdict` 含 `/`（半角或全角）或不在 `VERDICTS`（§7 :172 的 `verdict` 面，§7 :219 入口归属）。
// `SubjectMismatch`：`objectType` ≠ `subject` 且 `verdict ∈ {hit, miss}`；`na` 一律允许（§7 :200）。
export function verdictAllowed(subject, objectType, verdict) {
  if (!SUBJECT_VALIDATORS[subject]) {
    return errorsOf('UnverifiableOutput', 'subject', `subject「${subject}」没有校验器（§5 :131）`);
  }
  const v = String(verdict);
  if (v.includes('/') || v.includes('／') || !VERDICTS[v]) {
    return errorsOf('FreeTextEnum', 'verdict', `verdict「${v}」不是封闭取值（§7 :172）`);
  }
  if ((v === 'hit' || v === 'miss') && !subjectMatches(subject, objectType)) {
    return errorsOf('SubjectMismatch', 'objectType', `objectType「${objectType}」≠ subject「${subject}」（§7 :200）`);
  }
  return { ok: true, errors: [...OK] };
}

// `compareVerdicts(docA, docB, env) → { ok, errors }`（§6 :140）。
// 同 `id` 两实例 `verdict` 不同 → 一条 `DisagreementOpen`（不取多数、不改判，§7 :202 / PRD :203）；
// `verdict` 含 `/` → 只报 `FreeTextEnum`（§7 :219 的入口归属），且不构成分歧。
export function compareVerdicts(docA, docB) {
  const errors = [];
  const seen = new Set();
  const push = (e) => {
    if (seen.has(e.path)) return; // M1：同一次返回内 path 唯一（§6 :157）
    seen.add(e.path);
    errors.push(e);
  };
  const itemsOf = (d) => (d && Array.isArray(d.items) ? d.items : []);
  const a = itemsOf(docA);
  const b = itemsOf(docB);
  const badVerdict = (v) => {
    const s = String(v);
    return s.includes('/') || s.includes('／') || !VERDICTS[s];
  };
  a.forEach((it, i) => {
    if (it && badVerdict(it.verdict)) {
      push({ code: 'FreeTextEnum', path: `items[${i}].verdict`, message: `verdict「${it.verdict}」不是封闭取值（§7 :172）` });
    }
  });
  b.forEach((it, i) => {
    if (it && badVerdict(it.verdict)) {
      push({ code: 'FreeTextEnum', path: `items[${i}].verdict`, message: `verdict「${it.verdict}」不是封闭取值（§7 :172）` });
    }
  });
  for (const it of a) {
    if (!it || !it.id || badVerdict(it.verdict)) continue;
    const other = b.find((x) => x && x.id === it.id);
    if (!other || badVerdict(other.verdict)) continue;
    if (it.verdict !== other.verdict) {
      errors.push({ code: 'DisagreementOpen', path: 'open', message: `双实例 verdict 不一致：${it.verdict} vs ${other.verdict}（§7 :202）` });
    }
  }
  return { ok: errors.length === 0, errors };
}
