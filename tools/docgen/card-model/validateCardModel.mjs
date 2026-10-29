// 唯一发射点（spec §3 :47 / §6 :137-157 / §7 :166-203 / §8 :222-241）。
// `CARD_MODEL_CODES`（36 键）是唯一码表：键 = 码名，值 = 判定面**字段引用**（不写行号，§6 :147 / §10-D21 :280）。
// 三个合并码与 `WeakReason`（manual）**不在**本常量（V-5 / §6 :147）。
// `SCAN_FIELDS` 只在 `enums.mjs` 写死一份，本文件 import 消费（不另写第二份）。
// 纯函数：零 IO、零环境依赖（全部经 `env` 注入）、不改入参（§6 :151）。
import { VAGUE_TERMS, SCAN_FIELDS } from './enums.mjs';
import { subjectiveTerms } from './vocab/subjective-terms.mjs';
import { unusedScene } from './scenes.mjs';

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

export function validateCardModel(card, env) {
  const errors = [];
  const paths = new Set();
  // M1（§8 :224）：同一次返回内 path 唯一 —— 先到先得，后到的同 path 码被抑制（`errors[].path` 仍带下标）
  const emit = (code, path, message) => {
    if (paths.has(path)) return;
    paths.add(path);
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

  // 卡级（§6 :156 固定序第一段）：`MissingRationale`（§7 :201）
  if (typeof card.rationale !== 'string' || card.rationale.trim() === '') {
    emit('MissingRationale', 'rationale', 'rationale 缺或去空白为空（§7 :201）');
  }

  // 场景段
  const scenes = Array.isArray(card.scenes) ? card.scenes : [];
  if (ready('seatScenes')) {
    scenes.forEach((s, i) => {
      try {
        if (s && typeof s.id === 'string' && unusedScene(s.id, card)) {
          emit('UnusedScene', `scenes[${i}].id`, `场景 ${s.id} 未被任何动作引用（§7 :170）`);
        }
      } catch (err) {
        emit('UnverifiableOutput', `scenes[${i}].id`, firstLine(err));
      }
    });
  }

  // 动作段（`must` → `never`，数组序；§6 :156）
  for (const [list, arr] of [['must', card.must], ['never', card.never]]) {
    if (!Array.isArray(arr)) continue;
    arr.forEach((a, i) => {
      const p = `${list}[${i}]`;
      if (a === null || typeof a !== 'object') {
        emit('UnverifiableOutput', p, `${p} 非对象（§6 :153）`);
        return;
      }
      try {
        const objects = a.objects;
        if (!Array.isArray(objects) || objects.length === 0 || objects.some((o) => VAGUE_TERMS.includes(o))) {
          emit('VagueReferent', `${p}.objects`, 'objects 缺/空或含模糊词（§7 :178）');
        }
      } catch (err) {
        emit('UnverifiableOutput', `${p}.objects`, firstLine(err));
      }
      if (ready('predicates')) {
        try {
          const c = a.criterion;
          if (typeof c !== 'string' || c.trim() === '' || !e.predicates.has(c)) {
            emit('MissingCriterionImpl', `${p}.criterion`, 'Action.criterion 缺/空或未登记谓词（§7 :181）');
          }
        } catch (err) {
          emit('UnverifiableOutput', `${p}.criterion`, firstLine(err));
        }
      }
    });
  }

  // 检查项段
  const items = Array.isArray(card.checkItems) ? card.checkItems : [];
  items.forEach((it, i) => {
    const p = `checkItems[${i}]`;
    if (it === null || typeof it !== 'object') {
      emit('UnverifiableOutput', p, `${p} 非对象（§6 :153）`);
      return;
    }
    try {
      // `SubjectiveLabel` 的 label 面（`SCAN_FIELDS` 消费；criterion 面与组 3 四码在 Task 6 接）
      if (Array.isArray(SCAN_FIELDS.SubjectiveLabel) && SCAN_FIELDS.SubjectiveLabel.some((f) => f === 'checkItems[].label')
        && subjectiveHit(it.label)) {
        emit('SubjectiveLabel', `${p}.label`, 'label 命中主观词表（§7 :186）');
      }
    } catch (err) {
      emit('UnverifiableOutput', `${p}.label`, firstLine(err));
    }
  });

  return { ok: errors.length === 0, errors };
}
