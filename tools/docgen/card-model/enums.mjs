// 卡面内容模型的**唯一写死处**（spec §3 :37「封闭枚举 + ID 谓词 + 文本扫描常量」/ §5 :115-133）。
// 8 张封闭表 + id 谓词 + 文本扫描常量 + SCAN_FIELDS（8 键）。
// 任何模块要这些值都必须 import 本文件，不得另写一份字面（V-1 单源；A01 断同一引用）。

// ── 8 张封闭表（一张都没有「等 / 其他」这类开放口，V-1） ──────────────────────────
// 带中文 label 的三张（`id:label` 形态）：SHARED_SCENES / MOMENTS / SIGNALS。
// label 逐字取自 PRD §3.8 :249 / :250 / :252（A04 逐字对账）。

export const SHARED_SCENES = Object.freeze({
  session: Object.freeze({ label: '会话' }),
  'parliament.round': Object.freeze({ label: '议会轮' }),
  'issue.card': Object.freeze({ label: '问题卡' }),
  defense: Object.freeze({ label: '答辩' }),
  deliverable: Object.freeze({ label: '交付物' }),
  command: Object.freeze({ label: '命令' }),
  handoff: Object.freeze({ label: '交接' }),
  criterion: Object.freeze({ label: '判据口径' }),
});

export const MOMENTS = Object.freeze({
  start: Object.freeze({ label: '开始' }),
  end: Object.freeze({ label: '结束' }),
  before: Object.freeze({ label: '之前' }),
  after: Object.freeze({ label: '之后' }),
  during: Object.freeze({ label: '发生时' }),
  'on-fail': Object.freeze({ label: '失败时' }),
  'on-receive': Object.freeze({ label: '收到时' }),
  'on-change': Object.freeze({ label: '变更时' }),
});

export const SIGNALS = Object.freeze({
  'event.arrive': Object.freeze({ label: '事件到达' }),
  'artifact.appear': Object.freeze({ label: '产物出现' }),
  'state.transition': Object.freeze({ label: '状态转换' }),
  'command.return': Object.freeze({ label: '命令返回' }),
  'diff.hit': Object.freeze({ label: '差异命中' }),
});

// 只给 id 字面的五张（值 = 该 id 本身，A01 断 `typeof v === 'string'`）。
export const REPEATS = Object.freeze({
  once: 'once',
  'per-round': 'per-round',
  'per-item': 'per-item',
  'per-change': 'per-change',
});

export const VERDICTS = Object.freeze({ hit: 'hit', miss: 'miss', na: 'na' });

export const CHECK_KINDS = Object.freeze({ script: 'script', ai: 'ai', manual: 'manual' });

export const SCOPES = Object.freeze({ card: 'card', code: 'code', doc: 'doc', process: 'process', repo: 'repo' });

export const LANDING_VARS = Object.freeze({ 'review.dir': 'review.dir', 'round.no': 'round.no' });

// ── id 谓词（全部表共用，spec §5 :130）：`^[a-z][a-z0-9.:-]*$` ───────────────────
// `ID_RE` 是 `ID_NAME_RE` 的同一引用别名（testcase A03 的探测名），不是第二份字面。
export const ID_NAME_RE = /^[a-z][a-z0-9.:-]*$/;
export const ID_RE = ID_NAME_RE;

// ── 文本扫描常量（spec §7 :178 / :187 / :188 / :189 / :190 逐行写死） ────────────

// `VagueReferent` 的宾语模糊词（5）
export const VAGUE_TERMS = Object.freeze(['该内容', '上述', '相关', '前述', '该项']);

// `HardcodedCount` 的三条式（spec §7 :187）；`N` 的字符面 = 半角 + 全角 + 汉字数字。
// 第三条收窄为「全部命中」：spec 原文 `全部[命中]*` 会连裸「全部」一起命中（合法句「全部走查」被误报），
// 收窄属**实现侧收紧**，须回 ② 段把 spec 该行同步为 `全部命中`（已登记 `docs/after/…open-decisions.md` O-18）。
export const HARDCODED_COUNT = Object.freeze([
  /共\s*[0-9０-９零一二三四五六七八九十百千万]+\s*[条项个]/,
  /缺一[条项]/,
  /全部命中/,
]);

// `PointerToElsewhere` 的指针词（5，spec §7 :188）
export const POINTER_WORDS = Object.freeze(['见', '详见', '参见', '参考', '按 §']);

// `ProceduralWordOutsideParliament` 的程序词（5，spec §7 :190）
export const PROC_WORDS = Object.freeze(['收卡', '丢卡', '压卡', '点名', '判结束']);

// `MixedTermInCard` 的混称词对（spec §7 :189）
export const MIXED_PAIR = Object.freeze(['议长', '主持人']);

// ── 文本扫描面（spec §4.2 :101-112） ────────────────────────────────────────────
// 键 = 8 个文本类码名（**逐码一项**，不按「扫描面相同」合并成 4 组键，:112 写死）；
// 值 = 该码要扫的字段引用数组（容器形态不限，testcase G09 ⑨ 用 `flat()` 归一）。
const CARD_TEXT_FIELDS = Object.freeze([
  'duty.trigger',
  'duty.categories[]',
  'duty.action',
  'duty.constraint',
  'Action.objects[]',
  'CheckItem.label',
]);

export const SCAN_FIELDS = Object.freeze({
  SubjectiveLabel: Object.freeze(['categories[].label', 'checkItems[].label', 'checkItems[].criterion']),
  InlineTermList: Object.freeze(['checkItems[].criterion']),
  InlineThreshold: Object.freeze(['checkItems[].criterion']),
  AmbiguousCriterion: Object.freeze(['checkItems[].criterion']),
  PointerToElsewhere: CARD_TEXT_FIELDS,
  HardcodedCount: CARD_TEXT_FIELDS,
  MixedTermInCard: Object.freeze([...CARD_TEXT_FIELDS, 'rationale']),
  ProceduralWordOutsideParliament: Object.freeze([...CARD_TEXT_FIELDS, 'rationale']),
});

// ── `env` 的 11 键正式接口（spec §6 :143-144）──────────────────────────────────
// 唯一写死处（四个入口共用同一份，避免各入口各抄一遍导致缺键纪律漂移）。
export const ENV_KEYS = Object.freeze([
  'seat', 'sharedScenes', 'seatScenes', 'seatSignals', 'predicates', 'landings',
  'subjects', 'registeredIds', 'available', 'unboundVars', 'parliamentSeats',
]);
