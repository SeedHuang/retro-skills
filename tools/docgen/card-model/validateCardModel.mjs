// 唯一发射点（spec §3 :47 / §6 :137-157 / §7 :166-203 / §8 :222-241）。
// `CARD_MODEL_CODES`（36 键）是唯一码表：键 = 码名，值 = 判定面**字段引用**（不写行号，§6 :147 / §10-D21 :280）。
// 三个合并码与 `WeakReason`（manual）**不在**本常量（V-5 / §6 :147）。
// `SCAN_FIELDS` 只在 `enums.mjs` 写死一份，本文件 import 消费（不另写第二份）。
// 纯函数：零 IO、零环境依赖（全部经 `env` 注入）、不改入参（§6 :151）。
import {
  SHARED_SCENES, MOMENTS, VAGUE_TERMS, HARDCODED_COUNT, POINTER_WORDS, PROC_WORDS, MIXED_PAIR, SCAN_FIELDS,
} from './enums.mjs';
import { subjectiveTerms } from './vocab/subjective-terms.mjs';
import { resolveLanding } from './landings.mjs';
import { duplicateScene, promotionCheck, unusedScene } from './scenes.mjs';
import { unknownSignalType, signalProliferation } from './signals.mjs';
import { isJsonLogic, operatorDepth, scanCriterionText } from './expression.mjs';
import { SUBJECT_VALIDATORS } from './subjects.mjs';

export const CARD_MODEL_CODES = Object.freeze({
  // 场景（5）
  DuplicateScene: 'scenes',
  ScenePromotionRequired: 'SEAT_SCENES',
  UnusedScene: 'scenes',
  MissingSceneRationale: 'scenes',
  FreeTextEnum: 'scene.id',
  // 信号（5）
  MissingSignal: 'trigger',
  UnknownSignalType: 'signals[].type',
  UnobservableSignal: 'checkItems[].declarer',
  SignalProliferation: 'signals[].type',
  MultiMomentInOneEntry: 'trigger.moment',
  // 动作（5）
  VagueReferent: 'must[].objects',
  MissingPrerequisite: 'must[].requires',
  UnboundLanding: 'must[].landing',
  MissingCriterionImpl: 'must[].criterion',
  FalseScriptCheck: 'checkItems',
  // 检查项（8）
  MissingSubject: 'checkItems[].subject',
  DuplicateCheckItem: 'checkItems',
  CrossSubjectSharedItem: 'checkItems[].id',
  SubjectiveLabel: 'checkItems[].label',
  HardcodedCount: 'duty',
  PointerToElsewhere: 'duty',
  MixedTermInCard: 'card',
  ProceduralWordOutsideParliament: 'duty',
  // 表达式（6）
  UnreadableExpression: 'expr',
  NestingTooDeep: 'expr',
  InlineTermList: 'checkItems[].criterion',
  InlineThreshold: 'checkItems[].criterion',
  AmbiguousCriterion: 'checkItems[].criterion',
  MissingAiAudit: 'checkItems[].rubric',
  // 开放项（3）
  EmptyOpenWithoutReason: 'open',
  OutOfScopeOpenItem: 'open[].scope',
  DuplicateAsOpen: 'open[].object',
  // 三态（1）
  SubjectMismatch: 'objectType',
  // 审计（3）
  MissingRationale: 'rationale',
  DisagreementOpen: 'items[].verdict',
  UnverifiableOutput: 'subject',
});

// `registeredIdsOf(cards)` = 入参全部卡的 `checkItems[].id` 并集去重（§4 :90）；空集是**期望值**（J04）。
export function registeredIdsOf(cards) {
  const ids = new Set();
  for (const c of Array.isArray(cards) ? cards : []) {
    for (const it of (c && Array.isArray(c.checkItems) ? c.checkItems : [])) {
      if (it && typeof it.id === 'string') ids.add(it.id);
    }
  }
  return ids;
}

const ENV_KEYS = ['seat', 'sharedScenes', 'seatScenes', 'seatSignals', 'predicates', 'landings',
  'subjects', 'registeredIds', 'available', 'unboundVars', 'parliamentSeats'];

const firstLine = (err) => String((err && err.message) || err).split(/\r?\n/)[0];
const TOKEN_SPLIT = /[、，,/\s]+/;
const tokensOf = (text) => (typeof text === 'string' ? text.split(TOKEN_SPLIT).map((x) => x.trim()).filter(Boolean) : []);
const subjectiveHit = (text) => tokensOf(text).some((t) => subjectiveTerms.includes(t));
const hasSlash = (v) => typeof v === 'string' && (v.includes('/') || v.includes('／'));
const blank = (v) => typeof v !== 'string' || v.trim() === '';
const own = (obj, key) => obj !== null && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, key);

// `moment` 的「多时刻」计数（§7 :177：数组长 > 1；或字符串同时命中 ≥2 个 `MOMENTS` 成员 id / label）
function momentInfo(moment) {
  const texts = Array.isArray(moment) ? moment : [moment];
  const members = new Set();
  for (const t of texts) {
    if (typeof t !== 'string') continue;
    for (const [id, v] of Object.entries(MOMENTS)) {
      if (t.includes(id) || t.includes(v.label)) members.add(id);
    }
  }
  return { isArray: Array.isArray(moment), length: texts.length, members: members.size };
}

// 指针词按「词 + 后随章节号」判（裸子串会把真实句「遇意见冲突」判死，G06 的假阳性守卫）
function pointerHit(text) {
  return POINTER_WORDS.some((w) => (w === '按 §'
    ? text.includes('按 §')
    : new RegExp(`${w}\\s*[§#]?\\s*[0-9０-９]`).test(text)));
}

// `SCAN_FIELDS` 驱动的卡文本面解析：字段引用 → 具体路径 + 文本（路径用于 `errors[].path`）
function surfaceTexts(card, refs) {
  const out = [];
  const push = (path, t) => { if (typeof t === 'string' && t.trim() !== '') out.push({ path, text: t }); };
  const each = (arr, fn) => (Array.isArray(arr) ? arr : []).forEach(fn);
  for (const ref of refs || []) {
    if (ref === 'duty.trigger') push('duty.trigger', card.duty && card.duty.trigger);
    else if (ref === 'duty.categories[]') each(card.duty && card.duty.categories, (t, i) => push(`duty.categories[${i}]`, t));
    else if (ref === 'duty.action') push('duty.action', card.duty && card.duty.action);
    else if (ref === 'duty.constraint') push('duty.constraint', card.duty && card.duty.constraint);
    else if (ref === 'Action.objects[]') {
      for (const [list, arr] of [['must', card.must], ['never', card.never]]) {
        each(arr, (a, i) => each(a && a.objects, (o, j) => push(`${list}[${i}].objects[${j}]`, o)));
      }
    } else if (ref === 'CheckItem.label' || ref === 'checkItems[].label') each(card.checkItems, (it, i) => push(`checkItems[${i}].label`, it && it.label));
    else if (ref === 'checkItems[].criterion') each(card.checkItems, (it, i) => push(`checkItems[${i}].criterion`, it && it.criterion));
    else if (ref === 'categories[].label') each(card.categories, (c, i) => push(`categories[${i}].label`, c && c.label));
    else if (ref === 'rationale') push('rationale', card.rationale);
  }
  return out;
}

// `MissingAiAudit`（§7 :196 + §10-D16 :275）：`check === 'ai'` 且 rubric 三组任一组 < 1 条、
// 任一条 source 无 `path:line`（含缺 source 键）、`audit.sample` / `audit.command` 缺。
function aiAuditBad(it) {
  const groups = ['positive', 'negative', 'boundary'];
  const rubric = it.rubric;
  if (rubric === null || typeof rubric !== 'object') return true;
  if (groups.some((g) => !Array.isArray(rubric[g]) || rubric[g].length < 1)) return true;
  if (groups.some((g) => rubric[g].some((x) => !x || typeof x.source !== 'string' || !/:\d+/.test(x.source)))) return true;
  const audit = it.audit;
  return !audit || blank(audit.sample) || blank(audit.command);
}

export function validateCardModel(card, env) {
  const errors = [];
  const paths = new Set();
  const faces = new Set();
  // M1（§8 :224）：同一次返回内 `path` 唯一 —— 先到先得（`errors[].path` 仍带下标）。
  // M2 / D20（§8 :226）：**判定面（face）粒度**——同组多码落同一判定面时按组序抑制；
  // 判定面与输出 path 解耦（例：`must[0].landing` / `never[0].landing` 同属 `Action.landing` 面，只报一条）。
  const emit = (code, path, message, face = path) => {
    if (paths.has(path) || faces.has(face)) return;
    paths.add(path);
    faces.add(face);
    errors.push({ code, path, message });
  };

  // `card` 非对象 → 只报本码（§6 :153）
  if (card === null || typeof card !== 'object' || Array.isArray(card)) {
    emit('UnverifiableOutput', 'card', 'card 非对象（§6 :153）');
    return { ok: false, errors };
  }

  // 缺键纪律（§6 :153）：`env` 缺任一键 → 每键一条 `UnverifiableOutput`（path `env.<键名>`）并**继续判**
  const e = env !== null && typeof env === 'object' ? env : {};
  const missing = new Set(ENV_KEYS.filter((k) => e[k] === undefined));
  for (const k of missing) emit('UnverifiableOutput', `env.${k}`, `env 缺键 ${k}（§6 :153）`);
  const ready = (...keys) => keys.every((k) => !missing.has(k));

  // ── 卡级（§6 :156 固定序第一段） ───────────────────────────────────────────────
  if (blank(card.rationale)) {
    emit('MissingRationale', 'rationale', 'rationale 缺或去空白为空（§7 :201）');
  }
  try {
    // `MixedTermInCard`（§7 :189）：卡文本面 ∪ `rationale` 同时出现两词
    const mixedTexts = surfaceTexts(card, SCAN_FIELDS.MixedTermInCard);
    if (MIXED_PAIR.every((w) => mixedTexts.some((t) => t.text.includes(w)))) {
      emit('MixedTermInCard', 'card', `同一张卡同时出现「${MIXED_PAIR[0]}」与「${MIXED_PAIR[1]}」（§7 :189）`);
    }
    // `ProceduralWordOutsideParliament`（§7 :190）：席 ∉ `parliamentSeats` 且命中程序词
    if (ready('parliamentSeats', 'seat') && !e.parliamentSeats.has(e.seat)) {
      const procTexts = surfaceTexts(card, SCAN_FIELDS.ProceduralWordOutsideParliament);
      for (const t of procTexts) {
        const hit = PROC_WORDS.find((w) => t.text.includes(w));
        if (hit) {
          emit('ProceduralWordOutsideParliament', t.path, `非议会席出现程序词「${hit}」（§7 :190）`);
          break;
        }
      }
    }
    // `PointerToElsewhere`（§7 :188）：卡面文本命中指针词（散文只进 rationale）
    const ptrTexts = surfaceTexts(card, SCAN_FIELDS.PointerToElsewhere);
    for (const t of ptrTexts) {
      if (pointerHit(t.text)) {
        emit('PointerToElsewhere', t.path, '卡面文本命中指针词（§7 :188）');
        break;
      }
    }
    // `HardcodedCount`（§7 :187）：三条正则 + `N` 的字符面（半角 / 全角 / 汉字数字）
    const countTexts = surfaceTexts(card, SCAN_FIELDS.HardcodedCount);
    for (const t of countTexts) {
      const re = HARDCODED_COUNT.find((r) => r.test(t.text));
      if (re) {
        emit('HardcodedCount', t.path, '卡面文本出现硬编码数量（§7 :187）');
        break;
      }
    }
  } catch (err) {
    emit('UnverifiableOutput', 'card', firstLine(err));
  }

  // ── 场景段（§8 组 1 的 scene 面 + 组 5 的三码，同判定面 `scenes` 按组序只报一个） ──
  const scenes = Array.isArray(card.scenes) ? card.scenes : [];
  scenes.forEach((s, i) => {
    try {
      if (s && hasSlash(s.id)) emit('FreeTextEnum', `scenes[${i}].id`, 'scene.id 含 / 的多条件串（§7 :172）', 'scenes.id');
    } catch (err) {
      emit('UnverifiableOutput', `scenes[${i}].id`, firstLine(err));
    }
  });
  if (ready('seatScenes', 'seat')) {
    try {
      let picked = null;
      for (let i = 0; i < scenes.length && !picked; i += 1) {
        if (scenes[i] && typeof scenes[i].id === 'string' && duplicateScene(scenes, i, e.seatScenes, e.seat)) {
          picked = ['DuplicateScene', `scenes[${i}].id`, '同 id 重复或共用 id 又出现在本席登记表（§7 :168）'];
        }
      }
      for (let i = 0; i < scenes.length && !picked; i += 1) {
        const s = scenes[i];
        if (s && typeof s.id === 'string' && !SHARED_SCENES[s.id] && blank(s.why)) {
          picked = ['MissingSceneRationale', `scenes[${i}].why`, '局部场景缺 why 或去空白为空（§7 :171）'];
        }
      }
      for (let i = 0; i < scenes.length && !picked; i += 1) {
        const s = scenes[i];
        if (s && typeof s.id === 'string' && unusedScene(s.id, card)) {
          picked = ['UnusedScene', `scenes[${i}].id`, `场景 ${s.id} 未被任何动作引用（§7 :170）`];
        }
      }
      if (picked) emit(picked[0], picked[1], picked[2], 'scenes');
      if (promotionCheck(e.seatScenes)) {
        emit('ScenePromotionRequired', 'SEAT_SCENES', '席局部 id 出现在 ≥2 席登记表，须上移（§7 :169）');
      }
    } catch (err) {
      emit('UnverifiableOutput', 'scenes', firstLine(err));
    }
  }

  // ── 信号段（组 1 / 组 6 + `MissingSignal` 的 signals 面） ───────────────────────
  if (ready('seatSignals', 'seat')) {
    const sigs = Array.isArray(card.signals) ? card.signals : [];
    sigs.forEach((s, i) => {
      const p = `signals[${i}]`;
      if (s === null || typeof s !== 'object') {
        emit('UnverifiableOutput', p, `${p} 非对象（§6 :153）`);
        return;
      }
      try {
        const type = s.type;
        if (hasSlash(type)) emit('FreeTextEnum', `${p}.type`, 'signals[].type 含 / 的多条件串（§7 :172）', 'signals[].type');
        else if (unknownSignalType(type, e.seatSignals, e.seat)) emit('UnknownSignalType', `${p}.type`, `type「${type}」不在任何表（§7 :174）`, 'signals[].type');
        else if (signalProliferation(type, card, e.seatSignals, e.seat)) emit('SignalProliferation', `${p}.type`, `局部 type「${type}」被 < 2 个场景引用（§7 :176）`, 'signals[].type');
      } catch (err) {
        emit('UnverifiableOutput', `${p}.type`, firstLine(err));
      }
      if (blank(s.observer) || blank(s.match)) {
        emit('MissingSignal', p, '信号条目缺 observer / match（§7 :173）', 'signals');
      }
    });
  }

  // ── 动作段（`must` → `never`，数组序；trigger 面按组 1 / 2 的序） ───────────────
  for (const [list, arr] of [['must', card.must], ['never', card.never]]) {
    if (!Array.isArray(arr)) continue;
    arr.forEach((a, i) => {
      const p = `${list}[${i}]`;
      if (a === null || typeof a !== 'object') {
        emit('UnverifiableOutput', p, `${p} 非对象（§6 :153）`);
        return;
      }
      // ① trigger 面：FreeTextEnum → MissingSignal → MultiMomentInOneEntry（§8 组 1 / 组 2）
      try {
        const t = a.trigger && typeof a.trigger === 'object' ? a.trigger : null;
        if (t && hasSlash(t.scene)) emit('FreeTextEnum', `${p}.trigger.scene`, 'trigger.scene 含 / 的多条件串（§7 :172）', 'trigger');
        else if (!t || !('scene' in t) || !('moment' in t) || !('repeat' in t)) emit('MissingSignal', `${p}.trigger`, 'trigger 缺 scene / moment / repeat 任一键（§7 :173）', 'trigger');
        else if (hasSlash(t.moment) || hasSlash(t.repeat)) emit('FreeTextEnum', `${p}.trigger.moment`, 'trigger.moment / repeat 含 / 的多条件串（§7 :172）', 'trigger');
        else {
          const m = momentInfo(t.moment);
          if ((m.isArray && m.length > 1) || m.members >= 2) emit('MultiMomentInOneEntry', `${p}.trigger`, '一行写两个时刻（§7 :177）', 'trigger');
        }
      } catch (err) {
        emit('UnverifiableOutput', `${p}.trigger`, firstLine(err));
      }
      // ② 宾语
      try {
        const objects = a.objects;
        if (!Array.isArray(objects) || objects.length === 0 || objects.some((o) => VAGUE_TERMS.includes(o))) {
          emit('VagueReferent', `${p}.objects`, 'objects 缺/空或含模糊词（§7 :178）', 'Action.objects');
        }
      } catch (err) {
        emit('UnverifiableOutput', `${p}.objects`, firstLine(err));
      }
      // ③ 判据（Action face：谓词 id；动作没有 `check` 字段 → 无 manual 豁免，§7 :181 / §10-D15）
      if (ready('predicates')) {
        try {
          const c = a.criterion;
          if (blank(c) || !e.predicates.has(c)) {
            emit('MissingCriterionImpl', `${p}.criterion`, 'Action.criterion 缺/空或未登记谓词（§7 :181）', 'Action.criterion');
          }
        } catch (err) {
          emit('UnverifiableOutput', `${p}.criterion`, firstLine(err));
        }
      }
      // ④ 落点（最长已登记前缀 + 子段 + 登记值本身未赋值，§7 :180）
      if (ready('landings', 'unboundVars')) {
        try {
          const r = resolveLanding(a.landing, e.landings, e.unboundVars);
          if (!r.ok) emit('UnboundLanding', `${p}.landing`, `landing 未登记或变量未赋值（${r.reason}；§7 :180）`, 'Action.landing');
        } catch (err) {
          emit('UnverifiableOutput', `${p}.landing`, firstLine(err));
        }
      }
      // ⑤ 前置
      if (ready('available')) {
        try {
          for (const req of Array.isArray(a.requires) ? a.requires : []) {
            if (req && req.must === true && !e.available.has(req.id)) {
              emit('MissingPrerequisite', `${p}.requires`, `缺 ${req.id}，未开始`, 'Action.requires');
              break;
            }
          }
        } catch (err) {
          emit('UnverifiableOutput', `${p}.requires`, firstLine(err));
        }
      }
      // ⑥ 表达式（组 4：不可读优先于过深，§8 :233）
      try {
        if (a.expr !== undefined) {
          if (!isJsonLogic(a.expr)) emit('UnreadableExpression', `${p}.expr`, '表达式不是 JSON Logic（§7 :191）', 'Action.expr');
          else if (operatorDepth(a.expr) > 1) emit('NestingTooDeep', `${p}.expr`, '算子嵌算子（§7 :192）', 'Action.expr');
        }
      } catch (err) {
        emit('UnverifiableOutput', `${p}.expr`, firstLine(err));
      }
    });
  }

  // ── 检查项段 ──────────────────────────────────────────────────────────────────
  // `SubjectiveLabel` 的 categories 面（`SCAN_FIELDS` 消费）
  (Array.isArray(card.categories) ? card.categories : []).forEach((c, i) => {
    try {
      if (c && subjectiveHit(c.label)) emit('SubjectiveLabel', `categories[${i}].label`, 'label 命中主观词表（§7 :186）', 'categories[].label');
    } catch (err) {
      emit('UnverifiableOutput', `categories[${i}].label`, firstLine(err));
    }
  });

  const items = Array.isArray(card.checkItems) ? card.checkItems : [];
  items.forEach((it, i) => {
    const p = `checkItems[${i}]`;
    if (it === null || typeof it !== 'object') {
      emit('UnverifiableOutput', p, `${p} 非对象（§6 :153）`);
      return;
    }
    // 跨条目两码（同 subject+criterion 重复 / 同 id 异 subject）
    const earlier = items.slice(0, i).filter((x) => x && typeof x === 'object');
    if (earlier.some((x) => x.subject === it.subject && x.criterion === it.criterion)) {
      emit('DuplicateCheckItem', p, `同 subject + criterion 出现 2 次（§7 :184）`, 'CheckItem');
    }
    if (earlier.some((x) => x.id === it.id && x.subject !== it.subject)) {
      emit('CrossSubjectSharedItem', `${p}.id`, '同一 id 被 2 个不同 subject 引用（§7 :185）', 'CheckItem.id');
    }
    // `check` 的枚举面
    try {
      if (hasSlash(it.check)) emit('FreeTextEnum', `${p}.check`, 'check 含 / 的多条件串（§7 :172）', 'CheckItem.check');
    } catch (err) {
      emit('UnverifiableOutput', `${p}.check`, firstLine(err));
    }
    // 组 8：subject → label 派生 → 主观词（同判定面，先到先得）
    if (ready('subjects')) {
      try {
        if (blank(it.subject)) {
          emit('MissingSubject', `${p}.subject`, 'subject 缺/空（§7 :183）', 'CheckItem.subject');
        } else if (!SUBJECT_VALIDATORS[it.subject]) {
          emit('UnverifiableOutput', `${p}.subject`, `subject「${it.subject}」没有校验器（§7 :203）`, 'CheckItem.subject');
        } else {
          const sub = e.subjects[it.subject];
          const display = sub && typeof sub.display === 'string' ? sub.display : '';
          if (!display || !String(it.label || '').includes(display)) {
            emit('MissingSubject', `${p}.label`, `label 不含 subject 的 display「${display}」（§7 :183）`, 'CheckItem.subject');
          } else if (subjectiveHit(it.label)) {
            emit('SubjectiveLabel', `${p}.label`, 'label 命中主观词表（§7 :186）', 'CheckItem.subject');
          }
        }
      } catch (err) {
        emit('UnverifiableOutput', `${p}.subject`, firstLine(err));
      }
    }
    // 组 3 + `MissingCriterionImpl` 的 `CheckItem` 面（criterion 文本面）
    try {
      const c = it.criterion;
      if (blank(c)) {
        if (it.check !== 'manual') emit('MissingCriterionImpl', `${p}.criterion`, 'CheckItem.criterion 缺/空且非 manual（§7 :181）', 'CheckItem.criterion');
      } else {
        const scan = scanCriterionText(c);
        if (subjectiveHit(c)) emit('SubjectiveLabel', `${p}.criterion`, 'criterion 命中主观词表（§7 :186）', 'CheckItem.criterion');
        else if (scan.termHits.length >= 3) emit('InlineTermList', `${p}.criterion`, '≥3 个判据词未进数组物料（§7 :193）', 'CheckItem.criterion');
        else if (scan.thresholdHits.some((h) => h.key === null || !own(it.params, h.key))) {
          emit('InlineThreshold', `${p}.criterion`, '判据文本含数字阈值且 params 无对应键（§7 :194）', 'CheckItem.criterion');
        } else if (scan.termHits.length >= 1 && !it.definitions) {
          emit('AmbiguousCriterion', `${p}.criterion`, '1–2 个判据词且无 definitions（§7 :195）', 'CheckItem.criterion');
        }
      }
    } catch (err) {
      emit('UnverifiableOutput', `${p}.criterion`, firstLine(err));
    }
    // 表达式（组 4）
    try {
      if (it.expr !== undefined) {
        if (!isJsonLogic(it.expr)) emit('UnreadableExpression', `${p}.expr`, '表达式不是 JSON Logic（§7 :191）', 'CheckItem.expr');
        else if (operatorDepth(it.expr) > 1) emit('NestingTooDeep', `${p}.expr`, '算子嵌算子（§7 :192）', 'CheckItem.expr');
      }
    } catch (err) {
      emit('UnverifiableOutput', `${p}.expr`, firstLine(err));
    }
    // `MissingAiAudit`（§7 :196）
    if (it.check === 'ai' && aiAuditBad(it)) {
      emit('MissingAiAudit', `${p}.rubric`, 'ai 条目 rubric / audit 不完整（§7 :196）', 'CheckItem.rubric');
    }
    // `FalseScriptCheck`（§7 :182）
    if (it.check === 'script' && !it.cmd && !it.impl) {
      emit('FalseScriptCheck', p, 'script 条目既无 cmd 也无 impl（§7 :182）');
    }
    // `UnobservableSignal`（§7 :175）
    if (it.check === 'manual' && blank(it.declarer)) {
      emit('UnobservableSignal', `${p}.declarer`, 'manual 条目缺宣告者（§7 :175）', 'CheckItem.declarer');
    }
  });

  return { ok: errors.length === 0, errors };
}
