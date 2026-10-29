// 常驻回归测试（本段测试不是 testcase 文件：编写者 = 施工者，写进 `**/*.test.mjs` 全仓 glob 自动回归）。
// helper 逐字取自 testcase §0.3（:64-216）；56 条用例逐条对应 testcase §1 的 S1-TC-XX（计数口径 = 本文件 `test(` 块个数）。

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as M from '../card-model/index.mjs'; // 对外出口（spec §3 :48）
import * as EN from '../card-model/enums.mjs';
import * as LD from '../card-model/landings.mjs';
import * as SC from '../card-model/scenes.mjs';
import * as SIG from '../card-model/signals.mjs';
import * as SUB from '../card-model/subjects.mjs';
import * as OI from '../card-model/open-items.mjs';
import * as EX from '../card-model/expression.mjs';
import * as MG from '../card-model/merge.mjs';
import * as ST from '../card-model/vocab/subjective-terms.mjs';
import * as CT from '../card-model/vocab/criterion-terms.mjs';

const CM_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'card-model');
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..'); // = 仓库根
const SEAT = 'detective-observer'; // 非议会席（ProceduralWordOutsideParliament 的对照面）
const PARL = 'reviewer-audit'; // 议会席（豁免面）
const ID = /^[a-z][a-z0-9.:-]*$/;

const codes = (r) => r.errors.map((e) => e.code);
const pathsOf = (r) => r.errors.map((e) => e.path);
const green = (r) => {
  assert.equal(r.ok, true, `应绿，实得 ${codes(r).join('|') || '(空)'}`);
  assert.deepEqual(r.errors, []);
};
const only = (r, code, path) => {
  assert.deepEqual(codes(r), [code], `只应报 ${code}，实得 ${codes(r).join('|') || '(空)'}`);
  if (path !== null && path !== undefined) assert.ok(String(pathsOf(r)[0] || '').startsWith(path), `path 应以 ${path} 开头，实得 ${pathsOf(r)[0]}`);
};

// spec §6 :143-144 的 11 键（K01 双向对账用：既要逐键在位，也不许私自增键）
const ENV_KEYS = ['seat', 'sharedScenes', 'seatScenes', 'seatSignals', 'predicates', 'landings',
  'subjects', 'registeredIds', 'available', 'unboundVars', 'parliamentSeats'];

// §0.4 的合并码清单（A 表复用，不计入 36，§7 :206）
const MERGE_CODES = ['DuplicateStatement', 'OverrideWithoutReason', 'PointlessOverride'];

const deepFreeze = (o) => {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v);
  }
  return o;
};

// 主语从定义层派生 + 前置非空（否则 MissingSubject 的「label 不含 display」会恒真）
// spec §5 :131：`SUBJECT_VALIDATORS` = `SUBJECTS` 的 `validator` 投影（供 `UnverifiableOutput` 判「有没有校验器」）
// → 只取「display 非空 **且** validator 在位」的 subject：无校验器的 subject 一进基线卡就报 UnverifiableOutput，基线绿会假红
const pickSubject = (i = 0) => {
  const ks = Object.keys(SUB.SUBJECTS)
    .filter((k) => SUB.SUBJECTS[k] && String(SUB.SUBJECTS[k].display || '').trim())
    .filter((k) => SUB.SUBJECT_VALIDATORS && SUB.SUBJECT_VALIDATORS[k] != null);
  assert.ok(ks.length > i, `SUBJECTS 至少需 ${i + 1} 项「display 非空 + validator 在位」（当前 ${ks.length}；§5 :131）`);
  return ks[i];
};
const DISPLAY0 = () => SUB.SUBJECTS[pickSubject(0)].display;

const baseEnv = (p = {}) => ({
  seat: SEAT,
  sharedScenes: M.SHARED_SCENES,
  seatScenes: { [SEAT]: [] },
  seatSignals: { [SEAT]: [] }, // spec §6 :143 的正式键
  predicates: new Set(['ledger.row.exists']),
  landings: new Set(['deliverable.body', 'ledger.round.reflect']), // 真值见 observation-check/data.mjs 的 14–20 行
  subjects: M.SUBJECTS, // spec §5 :131：SUBJECTS 由 index.mjs 导出
  registeredIds: M.registeredIdsOf([baseCard()]), // spec §6 :154：由派生得到（**单源**）
  available: new Set(['question-card.md']),
  unboundVars: new Set(),
  parliamentSeats: new Set([PARL]),
  ...p,
});

// 最小合法卡：A01–B05 的绿基线；任一字段被误改都应在某条用例里暴露
// 注意：**不含 `open` / `openEmptyReason`**——它们属产物侧 ObservationDoc（spec §4 :77-78）
const baseCard = () => {
  const s = pickSubject(0);
  return {
    seat: SEAT, name: '侦探', description: '每轮答辩结束后开始观察',
    tools: ['Read', 'Glob', 'Grep'],
    duty: { trigger: '每轮答辩结束', categories: ['观察'], action: '给出观察记录', constraint: '只记录不裁决' },
    scenes: [{ id: 'issue.card' }], // 共用 id → label/why 可省
    signals: [{ type: 'event.arrive', observer: '轮初快照', match: '问题卡到达' }],
    must: [{
      id: 'observe', kind: 'must',
      trigger: { scene: 'issue.card', moment: 'start', repeat: 'once' },
      objects: ['question-card.md'], criterion: 'ledger.row.exists', landing: 'review.dir',
      requires: [{ id: 'question-card.md', kind: 'artifact', must: true }],
    }],
    never: [{
      id: 'no-verdict', kind: 'never',
      trigger: { scene: 'issue.card', moment: 'end', repeat: 'per-round' },
      objects: ['conclusion.md'], criterion: 'ledger.row.exists', landing: 'review.dir',
      requires: [],
    }],
    categories: [{ key: 'observe', label: '观察项' }],
    checkItems: [{
      id: 'k01', subject: s, label: `${SUB.SUBJECTS[s].display}观察表含证据行`,
      criterion: '观察表每行带路径与行号', check: 'manual', declarer: '侦探',
    }],
    rationale: '本席只核观察表，不改判结论。',
  };
};
const run = (mutate, envPatch) => {
  const c = baseCard();
  if (mutate) mutate(c);
  return M.validateCardModel(c, baseEnv(envPatch));
};
// 产物侧最小文档（spec §4 :77-78 的 ObservationDoc；**不属卡片数据**）
const baseDoc = (p = {}) => ({
  items: [{ id: 'k01', verdict: 'hit' }],
  open: [], openEmptyReason: '本轮零补充项（已逐项比对固定项）',
  ...p,
});
const runDoc = (mutate, envPatch, cards) => {
  const d = baseDoc();
  if (mutate) mutate(d);
  // spec §6 :139：validateOpenItems(doc, env, cards) —— **第三参 `cards` 必传**
  return M.validateOpenItems(d, baseEnv(envPatch), cards === undefined ? [baseCard()] : cards);
};
// 开放项五列齐的合法条目（scope 与 deriveScope 一致）；object 可替换
const openItem = (object = 'agents/detective-observer.md', scope = 'card') => ({
  category: '缺口', object, evidence: `${object}:12`, impact: '口径不一致', suggestion: '同批修订', scope,
});

// ── 词表常量：一律从 spec 原文切，不与自身字面 deepEqual（自比自恒真） ──
// 来源：spec §7 :194（七单位→键映射）/ :190（程序词五）/ :188（指针词五）；本块只做「切」，判据在各用例。
const SPEC_LINES = readFileSync(join(REPO, 'docs', 'superpowers', 'specs', '2026-10-29-agent-card-s1-card-model-design.md'), 'utf8').split(/\r?\n/);
const specLine = (n) => {
  const l = SPEC_LINES[n - 1];
  assert.ok(typeof l === 'string' && l.length > 0, `spec :${n} 不得为空（spec 行号已漂移）`);
  return l;
};
const UNIT_KEY = Object.fromEntries([...specLine(194).matchAll(/([^`\s/：；]+)→`([a-z%]+)`/g)].map((m) => [m[1], m[2]]));
const THRESHOLD_UNITS = Object.keys(UNIT_KEY);
const cutList = (lineNo, from, to) => {
  const l = specLine(lineNo);
  const i = l.indexOf(from);
  assert.ok(i >= 0, `spec :${lineNo} 应含「${from}」，实得 ${l}`);
  const tail = l.slice(i + from.length);
  const j = to === null ? tail.length : tail.indexOf(to);
  assert.ok(j > 0, `spec :${lineNo} 的「${from}」之后应能找到终止串「${to}」，实得 ${tail}`);
  const words = tail.slice(0, j).split('/').map((x) => x.replace(/[`*]/g, '').trim()).filter(Boolean);
  assert.ok(words.length > 0, `spec :${lineNo} 不得切出空集（否则逐词探针恒真）`);
  return words;
};
const PROC_WORDS = cutList(190, '文本命中', ' |'); // 程序词五：收卡 / 丢卡 / 压卡 / 点名 / 判结束
const POINTER_WORDS = cutList(188, '命中', '（'); // 指针词五：见 / 详见 / 参见 / 参考 / 按 §

// ── §0.4 登记向量（36 码表驱动：一张 `TABLE`，一次写死、三处复用） ──────────────
const PRD_S1_CODES = [ // PRD §4.4 :361 的 35 个脚本码（原文顺序，去 WeakReason(manual)）
  'UnverifiableOutput', 'FalseScriptCheck', 'EmptyOpenWithoutReason', 'OutOfScopeOpenItem',
  'DuplicateAsOpen', 'MissingPrerequisite', 'UnboundLanding', 'SubjectMismatch',
  'AmbiguousCriterion', 'MissingAiAudit', 'DuplicateCheckItem', 'CrossSubjectSharedItem',
  'InlineTermList', 'InlineThreshold', 'PointerToElsewhere', 'ProceduralWordOutsideParliament',
  'MixedTermInCard', 'HardcodedCount', 'VagueReferent', 'SubjectiveLabel', 'MissingSubject',
  'UnreadableExpression', 'NestingTooDeep', 'MultiMomentInOneEntry', 'UnknownSignalType',
  'MissingSignal', 'UnobservableSignal', 'SignalProliferation', 'FreeTextEnum', 'DuplicateScene',
  'UnusedScene', 'ScenePromotionRequired', 'MissingSceneRationale', 'MissingRationale',
  'DisagreementOpen',
];
// spec §7 :166-204 表 = PRD 的脚本码 + MissingCriterionImpl（A 表 :346 复用，§10-D4）；口径由 §7 :164 写死
const S1_CODES = [...PRD_S1_CODES, 'MissingCriterionImpl'];
// 计数一律派生、**不写 35 / 36 字面**：`dev-workflow-counts.test.mjs` 的 TC-C06 / C11 在用全仓 *.test.mjs 文本探针，
// 裸 35/36/37 会被当成「baseline 计数回写字面量」误判（该探针无按文件排除）。
assert.equal(new Set(PRD_S1_CODES).size, PRD_S1_CODES.length, 'PRD 脚本码表不得有重复');
assert.equal(S1_CODES.length, PRD_S1_CODES.length + 1, 'spec §7 写死的码数 = PRD 脚本码 + MissingCriterionImpl 一项');
assert.equal(S1_CODES.includes('WeakReason'), false, 'WeakReason 是 manual，不进脚本码表（spec :204 / V-5）');
for (const c of MERGE_CODES) assert.equal(S1_CODES.includes(c), false, `合并码 ${c} 不计入脚本码表（spec :206）`);

const TABLE = [
  // ── 场景（5）
  { fam: '场景', code: 'DuplicateScene', path: 'scenes', kind: 'card',
    mutate: (c) => { c.scenes.push({ id: 'issue.card' }); } },
  { fam: '场景', code: 'ScenePromotionRequired', path: null, kind: 'env',
    env: { seatScenes: { [SEAT]: ['local.scene'], 'other-seat': ['local.scene'] } } },
  { fam: '场景', code: 'UnusedScene', path: 'scenes', kind: 'card',
    mutate: (c) => { c.scenes.push({ id: 'local.unused', label: '局部场景', why: '本席专用' }); } },
  { fam: '场景', code: 'MissingSceneRationale', path: 'scenes', kind: 'card',
    mutate: (c) => { c.scenes.push({ id: 'local.bare', label: '局部场景' }); } },
  { fam: '场景', code: 'FreeTextEnum', path: 'signals[0].type', kind: 'card',
    mutate: (c) => { c.signals[0].type = 'event.arrive/diff.hit'; } },
  // ── 信号（5）
  { fam: '信号', code: 'MissingSignal', path: 'must[0].trigger', kind: 'card',
    mutate: (c) => { delete c.must[0].trigger.repeat; } },
  { fam: '信号', code: 'UnknownSignalType', path: 'signals[0].type', kind: 'card',
    mutate: (c) => { c.signals[0].type = 'event.unknown'; } },
  { fam: '信号', code: 'UnobservableSignal', path: 'checkItems[0].declarer', kind: 'card',
    mutate: (c) => { delete c.checkItems[0].declarer; } },
  { fam: '信号', code: 'SignalProliferation', path: 'signals[0].type', kind: 'env',
    mutate: (c) => { c.signals[0].type = 'signal.local'; },
    env: { seatSignals: { [SEAT]: ['signal.local'] } } },
  { fam: '信号', code: 'MultiMomentInOneEntry', path: 'must[0].trigger', kind: 'card',
    mutate: (c) => { c.must[0].trigger.moment = '结束时之前'; } },
  // ── 动作（5）
  { fam: '动作', code: 'VagueReferent', path: 'must[0].objects', kind: 'card',
    mutate: (c) => { c.must[0].objects = ['上述']; } },
  { fam: '动作', code: 'MissingPrerequisite', path: 'must[0].requires', kind: 'env',
    env: { available: new Set([]) } },
  { fam: '动作', code: 'UnboundLanding', path: 'must[0].landing', kind: 'card',
    mutate: (c) => { c.must[0].landing = 'other.landing'; } },
  { fam: '动作', code: 'MissingCriterionImpl', path: 'must[0].criterion', kind: 'card',
    mutate: (c) => { delete c.must[0].criterion; } },
  { fam: '动作', code: 'FalseScriptCheck', path: 'checkItems[0]', kind: 'card',
    mutate: (c) => { c.checkItems[0].check = 'script'; delete c.checkItems[0].declarer; } },
  // ── 检查项（8）
  { fam: '检查项', code: 'MissingSubject', path: 'checkItems[0].subject', kind: 'card',
    mutate: (c) => { delete c.checkItems[0].subject; } },
  { fam: '检查项', code: 'DuplicateCheckItem', path: 'checkItems[1]', kind: 'card',
    mutate: (c) => { c.checkItems.push({ ...c.checkItems[0], id: 'k02' }); } },
  { fam: '检查项', code: 'CrossSubjectSharedItem', path: 'checkItems[1].id', kind: 'card',
    mutate: (c) => {
      const s1 = pickSubject(1); // 先断前置：需 ≥2 个带 display 的 subject
      c.checkItems.push({ ...c.checkItems[0], subject: s1, label: `${SUB.SUBJECTS[s1].display}观察表含证据行` });
    } },
  { fam: '检查项', code: 'SubjectiveLabel', path: 'checkItems[0].label', kind: 'card',
    mutate: (c) => {
      assert.ok(ST.subjectiveTerms.length > 0, 'subjective-terms 不得为空（否则本码判据恒绿）');
      c.checkItems[0].label = `${SUB.SUBJECTS[pickSubject(0)].display}、${ST.subjectiveTerms[0]}`;
    } },
  { fam: '检查项', code: 'HardcodedCount', path: null, kind: 'card',
    mutate: (c) => { c.duty.action = '给出共 3 条观察'; } },
  { fam: '检查项', code: 'PointerToElsewhere', path: null, kind: 'card',
    mutate: (c) => { c.duty.action = '给出观察记录（见 3）'; } },
  { fam: '检查项', code: 'MixedTermInCard', path: null, kind: 'card',
    mutate: (c) => { c.duty.action = '主持人调度时记录'; c.duty.constraint = '与议长口径一致'; } },
  { fam: '检查项', code: 'ProceduralWordOutsideParliament', path: null, kind: 'card',
    mutate: (c) => { c.duty.action = '收卡'; } },
  // ── 表达式（6）
  { fam: '表达式', code: 'UnreadableExpression', path: 'must[0].expr', kind: 'card',
    mutate: (c) => { c.must[0].expr = 'a && b'; } },
  { fam: '表达式', code: 'NestingTooDeep', path: 'must[0].expr', kind: 'card',
    mutate: (c) => { c.must[0].expr = { and: [{ or: [{ '==': [1, 1] }] }] }; } },
  { fam: '表达式', code: 'InlineTermList', path: 'checkItems[0].criterion', kind: 'card',
    mutate: (c) => {
      assert.ok(CT.criterionTerms.length >= 3, 'criterion-terms 至少 3 词才能构造本码（起步 6 词）');
      c.checkItems[0].criterion = `${CT.criterionTerms[0]}与${CT.criterionTerms[1]}且${CT.criterionTerms[2]}`;
    } },
  { fam: '表达式', code: 'InlineThreshold', path: 'checkItems[0].criterion', kind: 'card',
    mutate: (c) => { c.checkItems[0].criterion = '少于 3 次'; delete c.checkItems[0].params; } },
  { fam: '表达式', code: 'AmbiguousCriterion', path: 'checkItems[0].criterion', kind: 'card',
    mutate: (c) => {
      assert.ok(CT.criterionTerms.length >= 2, 'criterion-terms 至少 2 词才能构造本码');
      c.checkItems[0].criterion = `${CT.criterionTerms[0]}${CT.criterionTerms[1]}`;
      delete c.checkItems[0].definitions;
    } },
  { fam: '表达式', code: 'MissingAiAudit', path: 'checkItems[0].rubric', kind: 'card',
    mutate: (c) => {
      c.checkItems[0].check = 'ai';
      c.checkItems[0].rubric = { positive: [{ text: '有证据行', source: 'agents/detective-observer.md:12' }], negative: [], boundary: [] };
      c.checkItems[0].audit = { sample: '每轮每条 ≥1', command: 'node tools/docgen/cli.mjs gate' };
    } },
  // ── 开放项（3，fn 型：产物侧入口 validateOpenItems(doc, env, cards)，§6 :139；第三参必传）
  { fam: '开放项', code: 'EmptyOpenWithoutReason', path: null, kind: 'fn',
    fn: () => M.validateOpenItems({ items: [{ id: 'k01', verdict: 'hit' }], open: [], openEmptyReason: '   ' }, baseEnv(), [baseCard()]) },
  { fam: '开放项', code: 'OutOfScopeOpenItem', path: 'open[0].scope', kind: 'fn',
    fn: () => M.validateOpenItems({ items: [{ id: 'k01', verdict: 'hit' }], open: [openItem('agents/detective-observer.md', 'code')] }, baseEnv(), [baseCard()]) },
  { fam: '开放项', code: 'DuplicateAsOpen', path: 'open[0].object', kind: 'fn',
    fn: () => M.validateOpenItems({ items: [{ id: 'k01', verdict: 'hit' }], open: [openItem('k01', 'repo')] }, baseEnv(), [baseCard()]) },
  // ── 三态（1，fn 型：verdictAllowed 三位置参，§6 :141）
  { fam: '三态', code: 'SubjectMismatch', path: null, kind: 'fn',
    fn: () => SUB.verdictAllowed(pickSubject(0), 'artifact.report', 'hit') },
  // ── 审计（3）
  { fam: '审计', code: 'MissingRationale', path: 'rationale', kind: 'card',
    mutate: (c) => { c.rationale = '   '; } },
  { fam: '审计', code: 'DisagreementOpen', path: null, kind: 'fn',
    fn: () => M.compareVerdicts( // §6 :140 写死的入口名
      { items: [{ id: 'k01', verdict: 'hit' }], open: [] },
      { items: [{ id: 'k01', verdict: 'miss' }], open: [] }, baseEnv()) },
  { fam: '审计', code: 'UnverifiableOutput', path: 'must[0].criterion', kind: 'env',
    mutate: (c) => { c.never = []; }, // 只留一个判据入口，保证「只报一码」
    env: { predicates: (() => { const p = new Set(['ledger.row.exists']); p.has = () => { throw new Error('boom: predicates 不可用'); }; return p; })() } },
];

let EXECUTED = 0;
function execRow(row) {
  EXECUTED += 1;
  let r;
  if (row.kind === 'fn') r = row.fn();
  else {
    const c = baseCard();
    if (row.mutate) row.mutate(c);
    r = M.validateCardModel(c, baseEnv(row.env || {}));
  }
  assert.deepEqual(codes(r), [row.code], `${row.code}：应只报本码，实得 ${codes(r).join('|') || '(空)'}`);
  if (row.path !== null) assert.ok(String(pathsOf(r)[0] || '').startsWith(row.path), `${row.code}：path 应以 ${row.path} 开头，实得 ${pathsOf(r)[0]}`);
  return r;
}
const rowsOf = (...fams) => TABLE.filter((r) => fams.includes(r.fam));

test('S1-TC-A02 表内容逐项等于期望集合（塞一条「其他」即红）', () => {
  assert.deepEqual(Object.keys(M.SHARED_SCENES), ['session', 'parliament.round', 'issue.card', 'defense', 'deliverable', 'command', 'handoff', 'criterion']);
  assert.deepEqual(Object.keys(M.MOMENTS), ['start', 'end', 'before', 'after', 'during', 'on-fail', 'on-receive', 'on-change']);
  assert.deepEqual(Object.keys(M.REPEATS), ['once', 'per-round', 'per-item', 'per-change']);
  assert.deepEqual(Object.keys(M.SIGNALS), ['event.arrive', 'artifact.appear', 'state.transition', 'command.return', 'diff.hit']);
  assert.deepEqual(Object.keys(M.VERDICTS), ['hit', 'miss', 'na']);
  assert.deepEqual(Object.keys(M.CHECK_KINDS), ['script', 'ai', 'manual']);
  assert.deepEqual(Object.keys(M.SCOPES), ['card', 'code', 'doc', 'process', 'repo']);
  assert.deepEqual(Object.keys(M.LANDING_VARS), ['review.dir', 'round.no']);
  const OPEN_WORDS = /等|其他|…|\.\.\./;
  const allText = JSON.stringify(M.SHARED_SCENES) + JSON.stringify(M.MOMENTS) + JSON.stringify(M.REPEATS)
    + JSON.stringify(M.SIGNALS) + JSON.stringify(M.VERDICTS) + JSON.stringify(M.CHECK_KINDS)
    + JSON.stringify(M.SCOPES) + JSON.stringify(M.LANDING_VARS);
  assert.ok(!OPEN_WORDS.test(allText), `枚举表不得含开放词：${allText.match(OPEN_WORDS)?.[0]}`);
  assert.deepEqual({ ...SC.SEAT_SCENES }, {}, 'spec v5 :129：SEAT_SCENES 本轮必须是空集（内容由 S4 填）');
  assert.deepEqual({ ...SIG.SEAT_SIGNALS }, {}, 'spec v5 :129：SEAT_SIGNALS 本轮必须是空集（内容由 S4 填）');
  const tampered = { ...M.MOMENTS, other: { label: '其他' } };
  assert.notDeepEqual(Object.keys(tampered), Object.keys(M.MOMENTS), '副本注入「其他」后集合必须不等（本断言的用途 = 证明上式不是恒真）');
});

test('S1-TC-A03 id 谓词 5 类变异逐项判不过', () => {
  const RE = EN.ID_RE || EN.ID_PATTERN || ID; // 定义层若未导出则退回本地同一正则（口径逐字相等，见用例尾断言）
  assert.ok(RE, '定义层必须提供 id 谓词（V-1 的唯一判据载体）');
  for (const ok of ['session', 'event.arrive', 'parliament.round', 'review.dir', 'on-fail', 'diff.hit', 'per-round', 'artifact.appear']) assert.ok(RE.test(ok), `${ok} 应合法`);
  for (const bad of ['Session', 'on_fail', '会议', 'event/arrive', '']) assert.ok(!RE.test(bad), `${bad} 应不合法`);
  assert.equal(RE.source, ID.source, '本地 ID 与定义层谓词必须同源同形（否则两处漂移）');
});

test('S1-TC-A04 8/8/5 个 label 与 PRD 原文逐字相等（第三方通道）', () => {
  const prd = readFileSync(join(REPO, 'docs/prd/20261026205821-agent-card-contract.md'), 'utf8').split(/\r?\n/);
  const line = (n) => prd[n - 1];
  const cut = (s) => s.split('|')[2].trim().split('（')[0].split(/[、/]/).map((x) => x.replace(/\s+/g, '').trim()).filter(Boolean);
  const sceneLabels = cut(line(249)); // 会话 / 议会轮 / …
  const momentLabels = cut(line(250)); // 开始 / 结束 / …
  const signalLabels = cut(line(252)); // 事件到达 / …
  assert.equal(sceneLabels.length, 8, `PRD :249 应切出 8 个 scene label，实得 ${sceneLabels.length}`);
  assert.equal(momentLabels.length, 8, `PRD :250 应切出 8 个 moment label，实得 ${momentLabels.length}`);
  assert.equal(signalLabels.length, 5, `PRD :252 应切出 5 个 signal label，实得 ${signalLabels.length}`);
  assert.deepEqual(Object.values(M.SHARED_SCENES).map((v) => v.label), sceneLabels);
  assert.deepEqual(Object.values(M.MOMENTS).map((v) => v.label), momentLabels);
  assert.deepEqual(Object.values(M.SIGNALS).map((v) => v.label), signalLabels);
});

test('S1-TC-A05 词表全成员对账 + 单位 / 程序词 / 指针词逐条必红', () => {
  const prd = readFileSync(join(REPO, 'docs/prd/20261026205821-agent-card-contract.md'), 'utf8').split(/\r?\n/);
  const cutVocab = (lineNo, label) => {
    const m = prd[lineNo - 1].match(new RegExp(label + '：(.+?)）'));
    assert.ok(m, `PRD :${lineNo} 应写「${label}：…」，实得 ${prd[lineNo - 1]}`);
    const w = m[1].split('/').map((x) => x.replace(/[*`]/g, '').trim()).filter(Boolean);
    assert.ok(w.length > 0, `PRD :${lineNo} 的 ${label} 不得切出空集（否则下面的 deepEqual 恒真）`);
    return w;
  };
  // ① 词表全成员对账（成员、顺序逐字相等；长度也断，防「塞一个词改绿」）
  const subWords = cutVocab(270, '起步词'); // 主观词：自省 / 客观 / 诚实 / 宽松 / 严格
  assert.equal(subWords.length, 5, `PRD :270 的起步主观词应为 5 个，实得 ${subWords.length}`);
  assert.deepEqual(ST.subjectiveTerms, subWords, `vocab/subjective-terms.mjs 必须与 PRD :270 逐字相等，实得 ${ST.subjectiveTerms}`);
  const critWords = cutVocab(202, '起步 6 词'); // 判据词：处置 / 依据 / 充分 / 合理 / 及时 / 适当
  assert.equal(critWords.length, 6, `PRD :202 的起步判据词应为 6 个，实得 ${critWords.length}`);
  assert.deepEqual(CT.criterionTerms, critWords, `vocab/criterion-terms.mjs 必须与 PRD :202 逐字相等，实得 ${CT.criterionTerms}`);
  // ② InlineThreshold：7 个单位**从 spec §7 :194 原文切**（§0.3 的 `UNIT_KEY` / `THRESHOLD_UNITS`），缺 params 逐条必红
  assert.ok(THRESHOLD_UNITS.length === 7, `前置：spec :194 应切出 7 个单位，实得 ${THRESHOLD_UNITS.length}（${THRESHOLD_UNITS.join('/')}）`);
  assert.ok(THRESHOLD_UNITS.includes('次'), '前置：`次` 必须在该单位表内（否则探针错位）');
  for (const u of THRESHOLD_UNITS) {
    only(run((c) => { c.checkItems[0].criterion = `少于 3 ${u} 即算通过`; delete c.checkItems[0].params; }), 'InlineThreshold', 'checkItems[0].criterion');
  }
  // ③ 程序词：从 spec §7 :190 原文切（§0.3 的 PROC_WORDS），逐条必红（非议会席 SEAT）
  assert.ok(PROC_WORDS.length === 5, `前置：spec :190 应切出 5 个程序词，实得 ${PROC_WORDS.length}（${PROC_WORDS.join('/')}）`);
  for (const w of PROC_WORDS) only(run((c) => { c.duty.action = `${w}并记录`; }), 'ProceduralWordOutsideParliament');
  // ④ 指针词：从 spec §7 :188 原文切（§0.3 的 POINTER_WORDS），逐条必红（散文只进 rationale，故卡文本面里的指针词必须报）
  assert.ok(POINTER_WORDS.length === 5, `前置：spec :188 应切出 5 个指针词，实得 ${POINTER_WORDS.length}（${POINTER_WORDS.join('/')}）`);
  for (const w of POINTER_WORDS) only(run((c) => { c.duty.action = `给出观察记录（${w} 3）`; }), 'PointerToElsewhere');
});

test('S1-TC-A01 8 张表数量逐项 + 值全过 id 谓词 + 各表同一引用', () => {
  const T = {
    SHARED_SCENES: M.SHARED_SCENES, MOMENTS: M.MOMENTS, REPEATS: M.REPEATS, SIGNALS: M.SIGNALS,
    VERDICTS: M.VERDICTS, CHECK_KINDS: M.CHECK_KINDS, SCOPES: M.SCOPES, LANDING_VARS: M.LANDING_VARS,
  };
  for (const [name, t] of Object.entries(T)) assert.ok(t && typeof t === 'object', `${name} 必须自 index 可达`);
  assert.deepEqual(Object.fromEntries(Object.entries(T).map(([k, v]) => [k, Object.keys(v).length])),
    { SHARED_SCENES: 8, MOMENTS: 8, REPEATS: 4, SIGNALS: 5, VERDICTS: 3, CHECK_KINDS: 3, SCOPES: 5, LANDING_VARS: 2 });
  // 形态断言**按表无条件**（删掉原「有 label 才断」的条件分支：那条在无 label 的表上恒真）
  const LABELED = ['SHARED_SCENES', 'MOMENTS', 'SIGNALS']; // spec §5 的 `id:label` 三行（其余五行只给 id 字面）
  let checked = 0;
  for (const [name, t] of Object.entries(T)) {
    for (const [id, v] of Object.entries(t)) {
      assert.ok(ID.test(id), `${name}: id "${id}" 不符 ^[a-z][a-z0-9.:-]*$`);
      if (LABELED.includes(name)) {
        assert.equal(typeof v, 'object', `${name}.${id}: 该表是 id:label 形态（值若为字符串字面 → 说明 label 丢了）`);
        assert.equal(typeof v.label, 'string', `${name}.${id}.label 必须是字符串（typeof v.label 非 string 即红）`);
        assert.ok(v.label.trim(), `${name}.${id}: label 不得为空`);
      } else {
        assert.equal(typeof v, 'string', `${name}.${id}: 该表只给 id 字面（值若是对象 → 说明把 label 结构塞进来了）`);
        assert.ok(v.trim(), `${name}.${id}: 字面不得为空`);
      }
      checked += 1;
    }
  }
  assert.equal(checked, 38, `8 表取值合计应为 38（8+8+4+5+3+3+5+2），实得 ${checked}`);
  assert.equal(M.SHARED_SCENES, SC.SHARED_SCENES, 'SHARED_SCENES 必须同引用（定义层单源，不得两处各写一份）');
  assert.deepEqual({ ...M.LANDING_VARS }, { ...LD.LANDING_VARS }, 'LANDING_VARS 两处取值必须相等');
  // §5 :131：SUBJECTS 是登记表（不是第 9 张封闭枚举），出口面 = index.mjs，与 subjects.mjs 必须同一引用
  assert.equal(M.SUBJECTS, SUB.SUBJECTS, 'SUBJECTS 必须由 index.mjs 导出且与 subjects.mjs 同引用（§5 :131）');
  assert.deepEqual(Object.keys(M.SUBJECTS).sort(), Object.keys(M.SUBJECT_VALIDATORS).sort(),
    'SUBJECTS 与 SUBJECT_VALIDATORS 必须是同一批 subject 键（validator 投影）');
});

test('S1-TC-I01 SubjectMismatch 三态表', () => {
  const S = pickSubject(0);
  const V = (objectType, verdict) => SUB.verdictAllowed(S, objectType, verdict);
  for (const verdict of ['hit', 'miss']) {
    const r = V('artifact.report', verdict);
    assert.deepEqual(codes(r), ['SubjectMismatch'], `${verdict} + 类型不符应只报 SubjectMismatch，实得 ${codes(r)}`);
  }
  green(V('artifact.report', 'na'));
  green(V(S, 'hit'));
  green(V(undefined, 'hit')); // objectType 缺省沿用 subject
  assert.ok(SUB.subjectMatches(S, S) !== false, 'subjectMatches 对同型必须为真');
  // §7 :172 / :219 / :241：verdict 含 `/` → FreeTextEnum（该面只由 verdictAllowed / compareVerdicts 判；码集去重，不锁条数）
  assert.deepEqual([...new Set(codes(V(S, 'hit/miss')))].sort(), ['FreeTextEnum'],
    `verdict 含 / → 应只报 FreeTextEnum（§7 :219 入口归属），实得 ${codes(V(S, 'hit/miss')).join('|') || '(空)'}`);
  assert.ok(!codes(V(S, 'hit/miss')).includes('SubjectMismatch'), '`hit/miss` 不在 VERDICTS → 不构成三态不匹配（不得夹带 SubjectMismatch）');
});

test('S1-TC-I02 DisagreementOpen：compareVerdicts(docA, docB, env) 两实例 verdict 不同 → 一条开放项', () => {
  assert.equal(typeof M.compareVerdicts, 'function', 'spec §6 :140 写死入口名 compareVerdicts，必须由 index 导出');
  const A = { items: [{ id: 'k01', verdict: 'hit' }], open: [] };
  const B = { items: [{ id: 'k01', verdict: 'miss' }], open: [] };
  const r = M.compareVerdicts(A, B, baseEnv());
  assert.deepEqual(codes(r), ['DisagreementOpen'], `应只报 DisagreementOpen，实得 ${codes(r)}`);
  assert.deepEqual(M.compareVerdicts(A, { items: [{ id: 'k01', verdict: 'hit' }], open: [] }, baseEnv()).errors, [], '两实例一致时不得报本码');
  assert.deepEqual(M.compareVerdicts(A, { items: [{ id: 'k02', verdict: 'miss' }], open: [] }, baseEnv()).errors, [], 'items 不同 id 不构成分歧');
  assert.equal(A.items[0].verdict, 'hit', '不得任一方改判（入参不被改写）');
  // §7 :219 / :241：verdict 含 `/` → FreeTextEnum；两侧同值 → 不构成分歧（不得夹带 DisagreementOpen）
  const slashA = { items: [{ id: 'k01', verdict: 'hit/miss' }], open: [] };
  const slashB = { items: [{ id: 'k01', verdict: 'hit/miss' }], open: [] };
  const rSlash = M.compareVerdicts(slashA, slashB, baseEnv());
  assert.deepEqual([...new Set(codes(rSlash))].sort(), ['FreeTextEnum'],
    `verdict 含 / → 应只报 FreeTextEnum（§7 :219），实得 ${codes(rSlash).join('|') || '(空)'}`);
  assert.ok(!codes(rSlash).includes('DisagreementOpen'), '两侧同写 hit/miss → 不构成分歧，不得报 DisagreementOpen');
});

test('S1-TC-H01 EmptyOpenWithoutReason 与「0 条须可核理由」', () => {
  only(runDoc((d) => { delete d.openEmptyReason; }), 'EmptyOpenWithoutReason');
  only(runDoc((d) => { d.openEmptyReason = '  '; }), 'EmptyOpenWithoutReason');
  green(runDoc((d) => { d.openEmptyReason = '已逐项比对固定项，无补充'; }));
  green(runDoc((d) => { d.open = [openItem()]; delete d.openEmptyReason; }));
});

test('S1-TC-H02 deriveScope 8 段路径映射逐项（顺序敏感最长前缀）', () => {
  const MAP = [
    ['agents/detective-observer.md', 'card'],
    ['tools/docgen/card-model/enums.mjs', 'code'],
    ['scripts/check-all.mjs', 'code'],
    ['docs/superpowers/specs/x.md', 'doc'], // 只命中 `docs/` 一段 → doc
    ['docs/superpowers/reviews/x/progress.md', 'process'], // 最长前缀 `docs/superpowers/reviews/` 先命中 → process
    ['.session/reviews/x/progress.md', 'process'],
    ['README.md', 'repo'],
    ['no/prefix/match.txt', 'repo'],
  ];
  for (const [obj, want] of MAP) assert.equal(OI.deriveScope(obj), want, `deriveScope(${obj}) 应为 ${want}`);
  // ③ 最长前缀的判别力（§5 :133 的反例形态）：按「首段」判会得 doc，与规定相反
  assert.equal(OI.deriveScope('docs/superpowers/reviews/x/progress.md'), 'process');
  assert.notEqual(OI.deriveScope('docs/superpowers/reviews/x/progress.md'), 'doc',
    '按首段（docs）判定会得 doc → 与 §5 :132 的 process 相反（这正是 D17 要守的反例）');
  // 顺序敏感的正面：`docs/` 若被判在 `docs/superpowers/reviews/` 之前，specs 那条仍得 doc、reviews 那条必错
  assert.equal(OI.deriveScope('docs/superpowers/specs/x.md'), 'doc', '`docs/` 段不能被 `docs/superpowers/reviews/` 蚕食');
  assert.ok(Object.keys(M.SCOPES).length === 5);
  only(runDoc((d) => { d.open = [openItem('agents/detective-observer.md', 'code')]; }), 'OutOfScopeOpenItem', 'open[0].scope');
});

test('S1-TC-H03 DuplicateAsOpen：object 逐字等于 registeredIds 成员', () => {
  assert.ok(baseCard().checkItems.map((i) => i.id).includes('k01'), '前置：k01 必须在本卡 registeredIds 内');
  assert.ok(baseEnv().registeredIds.has('k01'), 'env.registeredIds 必须由 registeredIdsOf 派生（spec :154），且含 k01');
  only(runDoc((d) => { d.open = [openItem('k01', 'repo')]; }), 'DuplicateAsOpen', 'open[0].object');
  green(runDoc((d) => { d.open = [openItem()]; }));
});

test('S1-TC-H04 Windows 反斜杠路径按 / 归一后派生', () => {
  for (const [posix, win, want] of [
    ['tools/docgen/x.mjs', 'tools\\docgen\\x.mjs', 'code'],
    ['docs/superpowers/reviews/x/progress.md', 'docs\\superpowers\\reviews\\x\\progress.md', 'process'],
    ['docs/superpowers/specs/x.md', 'docs\\superpowers\\specs\\x.md', 'doc'],
  ]) {
    assert.equal(OI.deriveScope(posix), want, `正斜杠基线：${posix} 应为 ${want}（先断基线，防「两侧同错」把同值比较变成恒真）`);
    assert.equal(OI.deriveScope(win), want, `反斜杠形态必须同值（否则正当 Windows 写法被判 repo / doc；§5 :132 要求先归一）：${win}`);
  }
  assert.equal(OI.deriveScope('tools\\docgen\\x.mjs'), 'code', '反斜杠 + tools/ → code（不得落 repo）');
  assert.equal(OI.deriveScope('docs\\superpowers\\reviews\\x\\progress.md'), 'process', '反斜杠形态同样走最长前缀 → process');
  assert.equal(OI.deriveScope('docs\\superpowers\\specs\\x.md'), 'doc', '反斜杠形态同样不能被 `docs/superpowers/reviews/` 蚕食');
  only(runDoc((d) => { d.open = [{ category: '缺口', object: 'tools\\docgen\\x.mjs', evidence: 'tools/docgen/x.mjs:1', impact: 'x', suggestion: 'y', scope: 'repo' }]; }), 'OutOfScopeOpenItem', 'open[0].scope');
});

test('S1-TC-H05 开放项五列齐 + scope 派生一致 → 绿（F-06 正向）', () => {
  green(runDoc());
  const full = openItem('.session/reviews/x/progress.md', 'process');
  assert.equal(OI.deriveScope(full.object), 'process');
  green(runDoc((d) => { d.open = [full]; }));
  // ③ 缺非派生列：S1 不复判缺列（§7 :208 + §10-D14）→ 必须仍绿，否则说明实现把缺列归进了 S1 码表
  for (const k of ['category', 'evidence', 'impact', 'suggestion']) {
    const d = baseDoc();
    d.open = [{ ...full }];
    delete d.open[0][k];
    assert.ok(Object.keys(d.open[0]).length >= 2, `前置：缺 ${k} 后条目仍有键，避免空对象把断言变成恒真`);
    green(M.validateOpenItems(d, baseEnv()));
  }
  // ④ 缺派生列 scope：不是「缺列码」，而是 scope 与派生值不一致 → OutOfScopeOpenItem
  const d4 = baseDoc();
  d4.open = [{ ...full }];
  delete d4.open[0].scope;
  assert.deepEqual(codes(M.validateOpenItems(d4, baseEnv())), ['OutOfScopeOpenItem'],
    `缺 scope → 只应报 OutOfScopeOpenItem（§7 :198），实得 ${codes(M.validateOpenItems(d4, baseEnv())).join('|')}`);
  // ⑤ 缺列码归 S2：S1 的 36 码表里不得有它
  assert.equal(Object.keys(M.CARD_MODEL_CODES).includes('MissingOpenField'), false,
    '§7 :208：缺列码 MissingOpenField 归 S2，不进 S1 的 36 码');
});

test('S1-TC-H06 validateOpenItems 只判三码：缺列在 S1 侧不报码（MissingOpenField 归 S2）', () => {
  // ① 缺 impact（非派生列）：S1 不复判缺列 → 不得报任何码
  green(runDoc((d) => {
    d.open = [(() => { const o = openItem(); delete o.impact; return o; })()];
  }));
  assert.deepEqual(Object.keys(openItem()).sort(), ['category', 'evidence', 'impact', 'object', 'scope', 'suggestion'], '前置：openItem() 六键（五列 + 派生 scope）');
  // ② 缺两列（impact + suggestion）：仍不报码
  green(runDoc((d) => {
    d.open = [(() => { const o = openItem(); delete o.impact; delete o.suggestion; return o; })()];
  }));
  // ③ 三码仍各报一次（缺列绿不得把三码一起放过）
  only(runDoc((d) => { d.open = []; d.openEmptyReason = '   '; }), 'EmptyOpenWithoutReason');
  only(runDoc((d) => { d.open = [openItem('agents/detective-observer.md', 'code')]; }), 'OutOfScopeOpenItem', 'open[0].scope');
  only(runDoc((d) => { d.open = [openItem('k01', 'repo')]; }), 'DuplicateAsOpen', 'open[0].object');
  // ④ 缺列码不在 S1 码表
  assert.equal(Object.keys(M.CARD_MODEL_CODES).includes('MissingOpenField'), false, '§7 :208：S1 的 36 码不含 MissingOpenField（否则 H05 ③ 必红）');
});

test('S1-TC-K03 open[].evidence 的内容本段不判（边界划在 S1/S2 之间）', () => {
  const mk = (evidence) => (d) => { d.open = [{ ...openItem(), evidence }]; };
  green(runDoc(mk('随便一句话，没有行号')));
  green(runDoc(mk('agents/detective-observer.md:12')));
});

test('S1-TC-J02 合并族：OVERRIDABLE_FIELDS 精确集合 + 三码各一构造（F-03）', () => {
  assert.deepEqual(MG.OVERRIDABLE_FIELDS, ['kind', 'trigger', 'objects', 'criterion', 'landing', 'requires'],
    'PRD §3.3 :187 要求含 kind；S2 render.mjs 的 39 行 的旧表缺 kind/objects（登记 §11-1，本段不修）');
  const base = { id: 'a01', kind: 'must', trigger: { scene: 'issue.card', moment: 'start', repeat: 'once' }, objects: ['x.md'], criterion: 'ledger.row.exists', landing: 'review.dir', requires: [] };
  // ② 三码 + 返回形状（§6 :142 写死 {ok, errors}）
  const dup = MG.mergeActions([base], [{ ...base }]);
  assert.deepEqual(dup.errors.map((e) => e.code), ['DuplicateStatement']);
  assert.equal(dup.ok, false, 'mergeActions 返回 {ok, errors}（spec :142）：有合并码时 ok 必须为 false');
  const noReason = MG.mergeActions([base], [{ ...base, objects: ['y.md'] }]);
  assert.deepEqual(noReason.errors.map((e) => e.code), ['OverrideWithoutReason']);
  assert.equal(noReason.ok, false, '同上：{ok, errors} 形状');
  const pointless = MG.mergeActions([base], [{ ...base, reason: '改了' }]);
  assert.deepEqual(pointless.errors.map((e) => e.code), ['PointlessOverride']);
  assert.equal(pointless.ok, false, '同上：{ok, errors} 形状');
  const good = MG.mergeActions([base], [{ ...base, kind: 'never', reason: '升级为禁止' }]);
  assert.deepEqual(good.errors, []);
  assert.equal(good.ok, true, '无合并码时 ok 必须为 true');
  assert.ok(good.overrides.length === 1 && good.overrides[0].changed.length >= 1);
  for (const k of good.overrides[0].changed) assert.ok(MG.OVERRIDABLE_FIELDS.includes(k), `changed 含不可覆盖字段 ${k}`);
  assert.ok(good.overrides[0].changed.includes('kind'), 'kind 必须算可覆盖字段（PRD :187 明文，S2 旧表缺它）');
  assert.equal(typeof MG.mergeActions, 'function', '合并码只能由 mergeActions 发出（入口对照表 :218 末行）');
  // ④ 分离纪律（§6 :147 / :218）：3 个合并码都不在唯一码表里
  for (const c of MERGE_CODES) {
    assert.ok(!Object.keys(M.CARD_MODEL_CODES).includes(c), `合并码 ${c} 不得进 CARD_MODEL_CODES（spec :147）`);
  }
});

test('S1-TC-B05 最小合法卡 → {ok:true, errors:[]}', () => {
  const c = baseCard();
  assert.ok(c.must.length > 0 && c.checkItems.length > 0 && Object.keys(c.duty).length > 0, '基线卡必须先非空（防止空对象恒绿）');
  assert.ok(String(SUB.SUBJECTS[c.checkItems[0].subject].display).trim(), '基线卡的 subject 必须有 display（否则 MissingSubject 恒真）');
  green(run());
});

test('S1-TC-C02 M1：同一次返回内 path 唯一', () => {
  const multi = run((c) => {
    c.rationale = '  ';
    c.scenes.push({ id: 'local.dead', label: '局部', why: 'x' });
    c.must[0].objects = ['上述'];
    c.checkItems[0].label = `${SUB.SUBJECTS[pickSubject(0)].display}、${ST.subjectiveTerms[0]}`;
  });
  assert.equal(multi.errors.length, 4, `多问题卡应报 4 条（不同 path 的多问题是正常多头），实得 ${codes(multi)}`);
  assert.equal(new Set(pathsOf(multi)).size, 4);
  // ① 遍历 TABLE 全部构造（36 码）
  for (const row of TABLE) {
    const r = row.kind === 'fn' ? row.fn() : (() => { const c = baseCard(); row.mutate?.(c); return M.validateCardModel(c, baseEnv(row.env || {})); })();
    const ps = pathsOf(r);
    assert.equal(new Set(ps).size, ps.length, `${row.code}：同 path 出现多码 → 违 M1（${ps.join(',')}）`);
  }
});

test('S1-TC-D01 深冻结 card + env 后调用成功、两次结果相等', () => {
  const c = deepFreeze(baseCard());
  const e = deepFreeze(baseEnv());
  assert.ok(Object.isFrozen(c) && Object.isFrozen(c.must[0]) && Object.isFrozen(e), '前置：必须真的冻结到嵌套层');
  const r1 = M.validateCardModel(c, e);
  const r2 = M.validateCardModel(c, e);
  green(r1);
  assert.deepEqual(r1, r2, '纯函数：同输入两次结果必须逐字相等');
  const bad = deepFreeze((() => { const x = baseCard(); x.rationale = '  '; return x; })());
  assert.deepEqual(codes(M.validateCardModel(bad, e)), ['MissingRationale'], '冻结的非法卡也必须能判红（不得因冻结抛 TypeError）');
});

test('S1-TC-D02 入参不被改写（调用前后快照逐字相等）', () => {
  const snap = (o) => JSON.stringify(o, (k, v) => (v instanceof Set ? [...v].sort() : v));
  const c = baseCard();
  const before = snap(c);
  const beforeEnv = snap(baseEnv());
  assert.deepEqual(codes(M.validateCardModel(c, baseEnv())), []);
  assert.equal(snap(c), before, '入参卡被改写');
  assert.equal(snap(baseEnv()), beforeEnv, '入参 env 被改写');
  const bad = baseCard();
  bad.must[0].objects = ['上述'];
  const b2 = snap(bad);
  assert.deepEqual(codes(M.validateCardModel(bad, baseEnv())), ['VagueReferent']);
  assert.equal(snap(bad), b2, '报错路径上同样不得改写入参');
});

test('S1-TC-D03 异常收敛为 UnverifiableOutput 且不中止后续判定', () => {
  const throwing = new Set(['ledger.row.exists']);
  throwing.has = () => { throw new Error('boom: predicates 不可用'); };
  const c = baseCard();
  c.never = [];
  c.rationale = '   ';
  let r;
  assert.doesNotThrow(() => { r = M.validateCardModel(c, baseEnv({ predicates: throwing })); }, '异常不得冒泡中止');
  assert.deepEqual([...codes(r)].sort(), ['MissingRationale', 'UnverifiableOutput'], `应双码并存，实得 ${codes(r)}`);
  const u = r.errors.find((e) => e.code === 'UnverifiableOutput');
  assert.ok(String(u.message).includes('boom'), `message 应取异常首行，实得 ${u.message}`);
  // ④ 畸形入参：§6 :153 写死「card / doc 非对象同此码」
  for (const bad of [null, undefined, 'not-a-card', 42]) {
    let rb;
    assert.doesNotThrow(() => { rb = M.validateCardModel(bad, baseEnv()); }, `card=${String(bad)} 不得冒泡`);
    assert.deepEqual(codes(rb), ['UnverifiableOutput'], `card 非对象应只报 UnverifiableOutput，实得 ${codes(rb)}`);
  }
});

test('S1-TC-D04 errors 顺序稳定且合 §6 固定序', () => {
  const mk = (reorder) => {
    const c = baseCard();
    c.rationale = '  ';
    c.scenes.push({ id: 'local.dead', label: '局部', why: 'x' });
    c.must[0].objects = ['上述'];
    c.checkItems[0].label = `${SUB.SUBJECTS[pickSubject(0)].display}、${ST.subjectiveTerms[0]}`;
    if (reorder) return { checkItems: c.checkItems, must: c.must, signals: c.signals, scenes: c.scenes, rationale: c.rationale, ...c };
    return c;
  };
  const order1 = codes(M.validateCardModel(mk(false), baseEnv()));
  const order2 = codes(M.validateCardModel(mk(true), baseEnv()));
  assert.equal(order1.length, 4, `应 4 条，实得 ${order1}`);
  assert.deepEqual(order1, ['MissingRationale', 'UnusedScene', 'VagueReferent', 'SubjectiveLabel'], `顺序不合 §6：${order1}`);
  assert.deepEqual(order2, order1, '字段声明顺序不得影响 errors 顺序');
});

test('S1-TC-K01 env 11 键接口逐键对账 + 缺键 → UnverifiableOutput（path env.<键>）+ registeredIds 单源', () => {
  assert.deepEqual(Object.keys(baseEnv()).sort(), [...ENV_KEYS].sort(),
    'baseEnv 必须与 §6 :143-144 的 11 键双向相等（缺一 = 少注入，多一 = 私自扩接口）');
  assert.equal(ENV_KEYS.length, 11, `§6 的 env 应为 11 键，实得 ${ENV_KEYS.length}`);
  // ② 缺键 → UnverifiableOutput，path = env.<键>
  const emptyEnv = {}; // 全缺：每个键各报一条，证明逐键判而不是「第一个缺键就停」
  let rAll;
  assert.doesNotThrow(() => { rAll = M.validateCardModel(baseCard(), emptyEnv); }, 'env 全缺不得冒泡');
  assert.equal(rAll.ok, false, 'env 缺键必须 fail-closed（不得默认全绿）');
  for (const key of ENV_KEYS) {
    const miss = rAll.errors.filter((e) => e.code === 'UnverifiableOutput' && String(e.path) === `env.${key}`);
    assert.ok(miss.length >= 1, `缺 ${key} 应报 path=env.${key} 的 UnverifiableOutput，实得 ${JSON.stringify(rAll.errors.map((e) => [e.code, e.path]))}`);
  }
  assert.deepEqual([...new Set(codes(M.validateCardModel(baseCard(), {})))].sort(), ['UnverifiableOutput'],
    'env 全缺时只允许 UnverifiableOutput（不得夹带别的码，也不得用 undefined 兜底把别的码放过）');
  // ③ 继续判（不 fail-fast）：缺 predicates + rationale 空白 → 两码并存
  const bothGap = baseCard();
  bothGap.rationale = '   ';
  const eNoPred = baseEnv(); delete eNoPred.predicates;
  assert.deepEqual([...new Set(codes(M.validateCardModel(bothGap, eNoPred)))].sort(), ['MissingRationale', 'UnverifiableOutput'],
    'env 缺键后必须继续判后续条目（spec :153「并继续判」）');
  // ④ registeredIds 单源（:154）：与派生不一致 → UnverifiableOutput（path env.registeredIds）
  only(M.validateOpenItems(baseDoc(), baseEnv({ registeredIds: new Set(['k01', 'ghost-id']) }), [baseCard()]),
    'UnverifiableOutput', 'env.registeredIds');
  green(run());
});

test('S1-TC-K02 §4 已列 cmd?/impl? 可注入，未列字段不做 closed-world', () => {
  green(run((c) => { c.checkItems[0] = { ...c.checkItems[0], check: 'script', cmd: 'node tools/docgen/cli.mjs gate' }; }));
  green(run((c) => { c.checkItems[0] = { ...c.checkItems[0], check: 'script', impl: 'ledger.row.exists' }; }));
  only(run((c) => { c.checkItems[0] = { ...c.checkItems[0], check: 'script' }; }), 'FalseScriptCheck', 'checkItems[0]');
  green(run((c) => { c.checkItems[0] = { ...c.checkItems[0], check: 'script', cmd: 'x', evidenceRequired: true }; }));
});

test('S1-TC-K04 四入口各自只报自己那族码（§6 入口分工）', () => {
  const leaky = baseCard();
  leaky.open = [];
  leaky.openEmptyReason = '   ';
  assert.deepEqual(codes(M.validateCardModel(leaky, baseEnv())), [],
    '开放项不属卡片数据（spec :77-78）：validateCardModel 不得报开放项族码（入口分工 :158）');
  // ①b open-world（:155）：本 spec 未列的字段一律忽略，不得判红
  const unknownField = baseCard();
  unknownField.evidenceRequired = true;
  unknownField.openEmptyReason = '   ';
  assert.deepEqual(codes(M.validateCardModel(unknownField, baseEnv())), [],
    'Card 上的未列字段必须忽略不判（§6 :155 open-world）；若判红说明实现做了 closed-world 字段检查');
  const cardish = { items: [{ id: 'k01', objectType: 'artifact.report', verdict: 'hit' }], open: [], openEmptyReason: '无补充' };
  const rDoc = M.validateOpenItems(cardish, baseEnv(), [baseCard()]);
  assert.ok(!codes(rDoc).includes('MissingRationale'), `validateOpenItems 不得报卡级码，实得 ${codes(rDoc)}`);
  assert.ok(!codes(rDoc).includes('SubjectMismatch'), `SubjectMismatch 不归 open 入口，实得 ${codes(rDoc)}`);
  const rCmp = M.compareVerdicts(cardish, { items: [{ id: 'k01', objectType: 'artifact.report', verdict: 'hit' }], open: [] }, baseEnv());
  assert.ok(!codes(rCmp).includes('SubjectMismatch'), `compareVerdicts 不得报 SubjectMismatch（由 verdictAllowed 单独判，spec :141），实得 ${codes(rCmp)}`);
  // ③b 第四个入口各自只报自己的族
  const rVa = SUB.verdictAllowed(pickSubject(0), 'artifact.report', 'hit');
  assert.deepEqual(codes(rVa), ['SubjectMismatch'], `verdictAllowed 只应报 SubjectMismatch，实得 ${codes(rVa).join('|') || '(空)'}`);
  for (const k of ['MissingRationale', 'EmptyOpenWithoutReason', 'DuplicateScene', 'VagueReferent']) {
    assert.ok(!codes(rVa).includes(k), `verdictAllowed 不得报 ${k}（四入口分工，spec :158 / :47-48）`);
  }
  // ④ 合并不经四入口（:147）：含覆盖动作的卡，validateCardModel 也绝不返回合并码
  const cover = baseCard();
  cover.must.push({ ...cover.must[0], id: 'observe', objects: ['y.md'], reason: '改宾语' });
  for (const c of MERGE_CODES) {
    assert.ok(!codes(M.validateCardModel(cover, baseEnv())).includes(c),
      `validateCardModel 不执行合并（:147）：不得返回 ${c}`);
  }
});

test('S1-TC-B02 场景族 + 信号族 10 码最小红点', () => {
  const rows = rowsOf('场景', '信号');
  assert.equal(rows.length, 10, `场景+信号应为 10 码，实得 ${rows.length}`);
  // 前置：每行的 code / mutate|fn 都必须是非空实体（否则 execRow 的「只报本码」会在空构造上恒真）
  assert.equal(rows.filter((r) => typeof r.code === 'string' && r.code.trim()).length, 10,
    '前置：10 行都必须带非空 code 字面（删掉原 `rows.every((r) => r.code)` 那句恒真断言——空行集上 every 恒真）');
  assert.equal(rows.filter((r) => typeof r.mutate === 'function' || typeof r.fn === 'function' || r.env).length, 10,
    '前置：10 行都必须有构造（mutate / fn / env —— env 型行以 env patch 构造，同样不是「无构造的空行」）');
  for (const row of rows) execRow(row); // execRow 内含「只报本码」+ path 前缀断言
});

test('S1-TC-B03 动作族 + 检查项族 13 码最小红点', () => {
  const rows = rowsOf('动作', '检查项');
  assert.equal(rows.length, 13, `动作+检查项应为 13 码，实得 ${rows.length}`);
  for (const row of rows) execRow(row);
  assert.equal(rows.filter((r) => r.path === null).length, 4, 'spec 未定义 path 的卡级文本码应为 4 个（写死数量防止日后偷改成 null 绕过 path 断言）');
});

test('S1-TC-E01 UnboundLanding 五个子面（含最长已登记前缀 + 第三档两形态）', () => {
  only(run((c) => { delete c.must[0].landing; }), 'UnboundLanding', 'must[0].landing'); // (a) 缺
  only(run((c) => { c.must[0].landing = 'no.such.landing'; }), 'UnboundLanding', 'must[0].landing'); // (b) 最长前缀无命中
  green(run((c) => { c.must[0].landing = 'deliverable.body/row'; })); // (c) 登记值 + 子段
  only(run((c) => { c.must[0].landing = 'deliverable.body/row'; }, { unboundVars: new Set(['row']) }), // (d) 子段未赋值（按 / 逐段判）
    'UnboundLanding', 'must[0].landing');
  // (e) §7 :180 第三档第一形态：命中的**登记值本身**未赋值（LANDING_VARS 的 'review.dir'）
  only(run((c) => { c.must[0].landing = 'review.dir'; }, { unboundVars: new Set(['review.dir']) }),
    'UnboundLanding', 'must[0].landing'); // 变量本身未赋值
  assert.ok(Object.prototype.hasOwnProperty.call(LD.LANDING_VARS, 'review.dir'), '前置：`review.dir` 必须是 LANDING_VARS 的登记值（否则 (e) 构造不成立）');
});

test('S1-TC-E02 UnusedScene：共用 8 场景未声明不判红', () => {
  assert.ok(Object.keys(M.SHARED_SCENES).length === 8);
  const declared = baseCard().scenes.map((s) => s.id);
  assert.equal(declared.length, 1, '基线卡只声明 1 个共用场景（其余 7 个未声明 → 不得判红）');
  green(run());
  only(run((c) => { c.scenes.push({ id: 'local.dead', label: '局部', why: '本席专用' }); }), 'UnusedScene', 'scenes');
});

test('S1-TC-E03 MissingSceneRationale：共用可省两字段，局部 why 白空格必红', () => {
  green(run());
  only(run((c) => { c.scenes.push({ id: 'local.bare', label: '局部场景', why: '   ' }); }), 'MissingSceneRationale', 'scenes');
  // testcase:1030 的第三条 green（局部场景无引用仍绿）与 E02 ②/§7 :170 冲突，按 plan Task 5 行文取 ①②，冲突记入 impl-3.md
});

test('S1-TC-E04 MultiMomentInOneEntry 的「子串命中」边界', () => {
  assert.ok(String(M.MOMENTS.end.label).includes('结束') && String(M.MOMENTS.before.label).includes('之前'));
  green(run((c) => { c.must[0].trigger.moment = M.MOMENTS.end.label; })); // 「结束」单命中
  only(run((c) => { c.must[0].trigger.moment = `${M.MOMENTS.end.label}${M.MOMENTS.before.label}`; }), 'MultiMomentInOneEntry', 'must[0].trigger');
  green(run((c) => { c.must[0].trigger.moment = ['start']; }));
  only(run((c) => { c.must[0].trigger.moment = ['start', 'end']; }), 'MultiMomentInOneEntry', 'must[0].trigger');
});

test('S1-TC-E05 SignalProliferation 阈值 2 的正向与反向', () => {
  const twoScenes = (c) => {
    c.scenes.push({ id: 'local.a', label: '局部A', why: 'x' }, { id: 'local.b', label: '局部B', why: 'y' });
    c.signals[0].type = 'signal.local';
    c.must.push({ ...c.must[0], id: 'observe-b', trigger: { scene: 'local.b', moment: 'start', repeat: 'once' } });
    c.must[0].trigger.scene = 'local.a';
  };
  green(run(twoScenes, { seatSignals: { [SEAT]: ['signal.local'] } }));
  only(run((c) => { c.signals[0].type = 'signal.local'; }, { seatSignals: { [SEAT]: ['signal.local'] } }), 'SignalProliferation', 'signals[0].type');
});

test('S1-TC-E06 DuplicateScene 两子面 + ScenePromotionRequired', () => {
  only(run((c) => { c.scenes = [{ id: 'issue.card' }, { id: 'issue.card' }]; }), 'DuplicateScene', 'scenes');
  only(run((c) => {}, { seatScenes: { [SEAT]: ['issue.card'] } }), 'DuplicateScene');
  only(run((c) => {}, { seatScenes: { [SEAT]: ['local.scene'], 'other-seat': ['local.scene'] } }), 'ScenePromotionRequired');
  green(run((c) => {}, { seatScenes: { [SEAT]: ['local.mine'] } }));
});

test('S1-TC-E07 落点正向：landings 已登记值 + LANDING_VARS 成员均绿', () => {
  assert.ok(Object.keys(LD.LANDING_VARS).length === 2, 'LANDING_VARS 必须恰两项（封闭，C-13）');
  for (const landing of ['deliverable.body', 'deliverable.body/row', 'review.dir', 'round.no', 'review.dir/x']) {
    green(run((c) => { c.must[0].landing = landing; c.never[0].landing = landing; }));
  }
  only(run((c) => { c.must[0].landing = 'no.such.landing'; }), 'UnboundLanding', 'must[0].landing');
});

test('S1-TC-F01 MissingPrerequisite 报文与 must:false 豁免', () => {
  const r = run((c) => {}, { available: new Set([]) });
  only(r, 'MissingPrerequisite', 'must[0].requires');
  assert.ok(/缺\s*question-card\.md\s*，\s*未开始/.test(r.errors[0].message), `报文应为固定句式，实得 ${r.errors[0].message}`);
  green(run((c) => { c.must[0].requires = [{ id: 'question-card.md', kind: 'artifact', must: false }]; }, { available: new Set([]) }));
  assert.ok(baseCard().never[0].requires.length === 0, '前置：`requires` 允许空数组（§4）');
});

test('S1-TC-F02 VagueReferent：5 个模糊词 + 缺 / 空 objects', () => {
  const VAGUE = ['该内容', '上述', '相关', '前述', '该项'];
  for (const w of VAGUE) only(run((c) => { c.must[0].objects = [w]; }), 'VagueReferent', 'must[0].objects');
  only(run((c) => { delete c.must[0].objects; }), 'VagueReferent', 'must[0].objects');
  only(run((c) => { c.must[0].objects = []; }), 'VagueReferent', 'must[0].objects');
  assert.ok(baseCard().must[0].objects.length > 0);
  green(run((c) => { c.must[0].objects = ['question-card.md', 'observation.md']; }));
});

test('S1-TC-F03 MissingCriterionImpl 的两个判定面与 FalseScriptCheck 的实体分工', () => {
  // 前置（§7 :181 的形式前提）：Action 形状没有 check 字段 → manual 豁免在动作侧无载体
  assert.equal('check' in baseCard().must[0], false, 'Action 不得有 check 字段（spec §4 :68-72）');
  assert.equal(baseCard().checkItems[0].check, 'manual', '前置：基线 CheckItem 必须是 manual（豁免承载面，§4 :73-74）');
  assert.ok(baseEnv().predicates.has('ledger.row.exists'), '前置：基线动作的谓词 id 已登记（否则第 1 组不成立）');
  // ① Action 缺 criterion → 本码（path must[i].criterion）
  only(run((c) => { delete c.must[0].criterion; }), 'MissingCriterionImpl', 'must[0].criterion');
  // ② CheckItem 走 script 且 cmd/impl 均缺 → 脚本入口码
  only(run((c) => { c.checkItems[0].check = 'script'; delete c.checkItems[0].declarer; }), 'FalseScriptCheck', 'checkItems[0]');
  // ③ 两者同时 → 两码共存（不同 path，M1 允许）
  const both = run((c) => { delete c.must[0].criterion; c.checkItems[0].check = 'script'; delete c.checkItems[0].declarer; });
  assert.deepEqual([...codes(both)].sort(), ['FalseScriptCheck', 'MissingCriterionImpl']);
  assert.equal(new Set(pathsOf(both)).size, 2, '两码必须落在不同 path（否则违 M1，也说明「同一 CheckItem 上互斥」被误实现成同 path）');
  // ④ 新增的 CheckItem 面：非 manual 条目缺 criterion 也报同码；manual 条目缺 criterion 仍豁免
  only(run((c) => { c.checkItems[0].check = 'script'; c.checkItems[0].cmd = 'node tools/docgen/cli.mjs gate'; delete c.checkItems[0].criterion; }),
    'MissingCriterionImpl', 'checkItems[0].criterion'); // 非 manual（script + cmd）→ 报
  green(run((c) => { delete c.checkItems[0].criterion; })); // manual → 豁免（不报）
  // ⑤ 两处 path 不同 → 同一次返回里同码报两次、互不抑制（§6 :157 只要求同 path 唯一，M1 允许）
  const twice = run((c) => {
    delete c.must[0].criterion;
    c.checkItems[0].check = 'script'; c.checkItems[0].cmd = 'node tools/docgen/cli.mjs gate';
    delete c.checkItems[0].criterion;
  });
  assert.deepEqual(codes(twice), ['MissingCriterionImpl', 'MissingCriterionImpl'],
    `两处各报一次（§6 顺序：must 先于 checkItems），实得 ${codes(twice).join('|') || '(空)'}`);
  assert.equal(new Set(pathsOf(twice)).size, 2, `两条 path 必须不同（must[0].criterion / checkItems[0].criterion），实得 ${pathsOf(twice).join('|')}`);
  assert.ok(String(pathsOf(twice)[0]).startsWith('must[0].criterion') && String(pathsOf(twice)[1]).startsWith('checkItems[0].criterion'),
    `path 顺序应为 must 先、checkItems 后（§6 :156 固定序），实得 ${pathsOf(twice).join('|')}`);
  // ⑥ Action.criterion 未登记 + 同卡有 manual CheckItem → Action 侧仍必报（豁免不外溢到 Action）
  const spill = run((c) => { c.must[0].criterion = 'ledger.unknown.predicate'; }); // 该 id 不在 baseEnv().predicates
  assert.deepEqual(codes(spill), ['MissingCriterionImpl'], `Action.criterion 未登记 → 必报（即使同卡有 manual 条目），实得 ${codes(spill).join('|')}`);
  assert.ok(String(pathsOf(spill)[0]).startsWith('must[0].criterion'), `path 必须落 must[0].criterion，实得 ${pathsOf(spill)[0]}`);
  // ⑦ 反向对照：把 manual 写进 Action 的契约外 check 字段也不构成豁免（§7 :181「动作条目没有 check 字段」）
  const fake = run((c) => { c.must[0].criterion = 'ledger.unknown.predicate'; c.must[0].check = 'manual'; });
  assert.deepEqual(codes(fake), ['MissingCriterionImpl'], `Action 上的 check 字段不得成为豁免载体，实得 ${codes(fake).join('|')}`);
});

test('S1-TC-F04 动作六字段齐 + requires:[] + 落点合法 → 绿', () => {
  const SIX = ['id', 'kind', 'trigger', 'objects', 'criterion', 'landing'];
  const a = baseCard().must[0];
  for (const k of SIX) assert.ok(k in a, `动作条目缺字段 ${k}`);
  assert.deepEqual(Object.keys(a.trigger).sort(), ['moment', 'repeat', 'scene'], 'trigger 必须三键齐');
  green(run());
  assert.deepEqual(baseCard().never[0].requires, []);
  green(run((c) => { c.never[0].trigger.repeat = 'once'; }));
});

test('S1-TC-F05 两个 criterion 的分形：Action.criterion 是谓词 id，CheckItem.criterion 才是文本扫描面', () => {
  assert.ok(CT.criterionTerms.length >= 3, '前置：criterion-terms 至少 3 词（否则 InlineTermList 判据恒真）');
  assert.ok(baseEnv().predicates.has('ledger.row.exists'), '前置：第 3 组的谓词 id 必须已登记（否则「配齐即绿」不成立）');
  const three = `${CT.criterionTerms[0]}与${CT.criterionTerms[1]}且${CT.criterionTerms[2]}`;
  const SCAN_CODES = ['InlineTermList', 'InlineThreshold', 'AmbiguousCriterion'];
  // ① 假阳性守卫：Action.criterion 是谓词 id，不是文本扫描面（§4.2 :106 的「不扫」列）
  const r1 = run((c) => { c.must[0].criterion = three; });
  assert.deepEqual(codes(r1), ['MissingCriterionImpl'], `Action.criterion 未登记 → 只应报 MissingCriterionImpl（§4.1），实得 ${codes(r1).join('|')}`);
  for (const k of SCAN_CODES) assert.ok(!codes(r1).includes(k), `Action.criterion（谓词 id 面）不得扫出 ${k}（§4.2 :106）`);
  assert.ok(String(pathsOf(r1)[0]).startsWith('must[0].criterion'), `path 应落 must[0].criterion，实得 ${pathsOf(r1)[0]}`);
  // ② 假阴性守卫：同一句进 CheckItem.criterion 必须报 InlineTermList，且不得串成动作码
  const r2 = run((c) => { c.checkItems[0].criterion = three; delete c.checkItems[0].definitions; });
  assert.deepEqual(codes(r2), ['InlineTermList'], `CheckItem.criterion 命中 ≥3 个不同词表词 → 只应报 InlineTermList（§8 组 3 先报规则），实得 ${codes(r2).join('|')}`);
  assert.ok(!codes(r2).includes('MissingCriterionImpl'), 'CheckItem.criterion 是文本面，不得报 MissingCriterionImpl（该码只判 Action.criterion）');
  assert.ok(String(pathsOf(r2)[0]).startsWith('checkItems[0].criterion'), `path 应落 checkItems[0].criterion，实得 ${pathsOf(r2)[0]}`);
  // ③ 配齐侧：两侧各守自己的面 → 绿
  green(run((c) => { c.must[0].criterion = 'ledger.row.exists'; }));
});

test('S1-TC-B01 登记向量完备性：TABLE / S1_CODES / CARD_MODEL_CODES 三方相等 + 每行执行 1 次', () => {
  assert.equal(TABLE.length, S1_CODES.length, `TABLE 行数应等于码数，实得 ${TABLE.length}`);
  const tableCodes = TABLE.map((r) => r.code);
  assert.equal(new Set(tableCodes).size, tableCodes.length, `TABLE 有重复码：${tableCodes.filter((c, i) => tableCodes.indexOf(c) !== i)}`);
  assert.deepEqual([...tableCodes].sort(), [...S1_CODES].sort(), 'TABLE 码集必须与 §7 表的码双向相等（缺一多一都红）');
  const keySet = Object.keys(M.CARD_MODEL_CODES);
  assert.equal(keySet.length, S1_CODES.length, `CARD_MODEL_CODES 键数必须与 §7 码数一致，实得 ${keySet.length}`);
  assert.deepEqual([...keySet].sort(), [...S1_CODES].sort(), 'CARD_MODEL_CODES 键集必须与 §7 的码双向相等（V-2 的唯一完备性判据）');
  for (const notCode of ['WeakReason', ...MERGE_CODES]) {
    assert.ok(!keySet.includes(notCode), `${notCode} 不得进脚本码表（V-5 / §7 末：manual 与合并码都不计入）`);
  }
  // ⑥ §6 :147 值形态 = 判定面字段引用（不写行号）：ASCII 字段引用 + 不含 `:`
  const FIELD_REF = /^[A-Za-z_][A-Za-z0-9_.[\]-]*$/; // must[] / checkItems[].label / SEAT_SCENES / checkItems 都过
  let shaped = 0;
  for (const [k, v] of Object.entries(M.CARD_MODEL_CODES)) {
    assert.equal(typeof v, 'string', `${k} 的值必须是字符串（§6 :147 值 = 判定面字段引用）`);
    assert.ok(v.trim().length > 0, `码表值不得为空（§6 :147），${k} 的值为 "${v}"`);
    assert.ok(!/[:：]/.test(v), `${k} 的值不得写行号（含 : / ：即违 §6 :147 / §10-D21），实得 "${v}"`);
    assert.ok(FIELD_REF.test(v.trim()), `${k} 的值必须是字段引用形态（如 must[].criterion），实得 "${v}"（散文 / 中文面名都不过，§6 :147）`);
    shaped += 1;
  }
  assert.equal(shaped, S1_CODES.length, `所有值都必须过形态断言（禁止抽样），实得 ${shaped}`);
  // 非恒真自证：把任一值改成行号写法 → 形态断言必抛（副本不写回源码表）
  const tampered = { ...M.CARD_MODEL_CODES, UnusedScene: ':180' };
  assert.throws(() => {
    assert.ok(!/[:：]/.test(tampered.UnusedScene) && FIELD_REF.test(tampered.UnusedScene.trim()));
  }, '副本把 UnusedScene 写成 ":180" 时形态断言必红（证明上式不是恒真）');
  EXECUTED = 0;
  for (const row of TABLE) execRow(row);
  assert.equal(EXECUTED, TABLE.length, '每行必须执行恰 1 次（禁止抽样）');
  const broken = TABLE.filter((r) => r.code !== 'UnusedScene').map((r) => r.code);
  assert.notDeepEqual([...broken].sort(), [...S1_CODES].sort(), '删一行后码集必须不齐（本断言证明上式不是恒真）');
});

test('S1-TC-B04 表达式 + 开放项 + 三态 + 审计 13 码最小红点', () => {
  const rows = rowsOf('表达式', '开放项', '三态', '审计');
  assert.equal(rows.length, 13, `表达式+开放项+三态+审计应为 13 码，实得 ${rows.length}`);
  assert.equal(rows.filter((r) => r.kind === 'fn').length, 5,
    'fn 型行应为 5（开放项 3 + SubjectMismatch + DisagreementOpen），且都返回 {ok, errors[]} 同形');
  for (const row of rows) execRow(row);
});

test('S1-TC-C01 §8 八组逐组「多码候选构造」→ 只返回该组先报码（7 组真双命中 + 组 6 误实现对位）', () => {
  assert.ok(ST.subjectiveTerms.length >= 1, '前置：subjective-terms 至少 1 词（组 3 / 组 8 的构造依赖它，否则 SubjectiveLabel 判据恒真）');
  assert.ok(CT.criterionTerms.length >= 3, '前置：criterion-terms 至少 3 词（组 3 的 InlineTermList 候选依赖它）');
  const pairs = [
    // 组1 枚举字段取值（:230）：含 / 的串必然不在表内 → FreeTextEnum 先于 UnknownSignalType
    () => { const c = baseCard(); c.signals[0].type = 'event.arrive/diff.hit'; return M.validateCardModel(c, baseEnv()); },
    // 组2 动作触发（:231）：三键缺 → MissingSignal 先于 MultiMomentInOneEntry
    () => { const c = baseCard(); delete c.must[0].trigger.scene; c.must[0].trigger.moment = '结束时之前'; return M.validateCardModel(c, baseEnv()); },
    // 组3 判据文本（:232，checkItems[].criterion 面，四码）
    () => {
      const c = baseCard();
      c.checkItems[0].criterion = `${ST.subjectiveTerms[0]} ${CT.criterionTerms[0]}与${CT.criterionTerms[1]}且${CT.criterionTerms[2]} 少于 3 次`;
      delete c.checkItems[0].definitions;
      delete c.checkItems[0].params;
      return M.validateCardModel(c, baseEnv());
    },
    // 组4 表达式结构（:233）：键 foo ∉ ALLOWED_OPS 且深度 2 → 两码候选，先报「不可读」
    () => { const c = baseCard(); c.must[0].expr = { and: [{ foo: [] }] }; return M.validateCardModel(c, baseEnv()); },
    // 组5 场景（:234）：两条局部 id、均无 why、均零引用 → DuplicateScene / MissingSceneRationale / UnusedScene 三码候选
    () => { const c = baseCard(); c.scenes = [{ id: 'issue.card' }, { id: 'local.dup' }, { id: 'local.dup' }]; return M.validateCardModel(c, baseEnv()); },
    // 组6 信号定义（:235）：两码定义互斥 → 验「实现必须读 SEAT_SIGNALS」
    () => { const c = baseCard(); c.signals[0].type = 'signal.local'; return M.validateCardModel(c, baseEnv({ seatSignals: { [SEAT]: ['signal.local'] } })); },
    // 组7 开放项（:236）：本不该是开放项 + scope 错 → 先报 DuplicateAsOpen
    () => M.validateOpenItems({ items: [{ id: 'k01', verdict: 'hit' }], open: [openItem('k01', 'code')] }, baseEnv(), [baseCard()]),
    // 组8 subject / label 面（:237）：subject 未登记 + label 命中主观词 → 先报 UnverifiableOutput
    () => {
      const c = baseCard();
      c.checkItems[0].subject = 'artifact.not-registered';
      c.checkItems[0].label = ST.subjectiveTerms[0];
      return M.validateCardModel(c, baseEnv());
    },
  ];
  assert.equal(pairs.length, 8, '§8 必须是八组、逐组一构造（:230-237）');
  const got = pairs.map((f) => codes(f()));
  assert.deepEqual(got[0], ['FreeTextEnum'], '组1：含 / 先于「不在表内」（:230）');
  assert.deepEqual(got[1], ['MissingSignal'], '组2：三键缺时无从判多时刻（:231）');
  assert.deepEqual(got[2], ['SubjectiveLabel'], '组3：判据文本四码按 :232 的顺序，先报主观词');
  assert.deepEqual(got[3], ['UnreadableExpression'], '组4：不可读优先于过深（:233）');
  assert.deepEqual(got[4], ['DuplicateScene'], '组5：三码候选（重复 / 缺 why / 零引用）先报「能否成为合法条目」（:234；按 :226 的判定面粒度，不同下标不推翻）');
  assert.deepEqual(got[5], ['SignalProliferation'], '组6：已登记的席局部类型只被 1 场景引用 → 走 :235 的下半段（Unknown 不命中）');
  assert.deepEqual(got[6], ['DuplicateAsOpen'], '组7：先判「本不该是开放项」（:236）');
  assert.deepEqual(got[7], ['UnverifiableOutput'], '组8：先判「这个 subject 有没有校验器」（:237；同判定面 `checkItems`，按 :226 只返回先报那一个）');
  // 组3 的另两条相邻优先对（只补断言，不改组数）：InlineThreshold 先于 AmbiguousCriterion
  const g3Threshold = run((c) => {
    c.checkItems[0].criterion = `${CT.criterionTerms[0]}${CT.criterionTerms[1]}少于 3 次`;
    delete c.checkItems[0].definitions;
    delete c.checkItems[0].params;
  });
  assert.deepEqual(codes(g3Threshold), ['InlineThreshold'],
    `组3 相邻对①：2 词 + 阈值无 params → 先报 InlineThreshold（:232 顺序），实得 ${codes(g3Threshold).join('|') || '(空)'}`);
  assert.ok(String(pathsOf(g3Threshold)[0]).startsWith('checkItems[0].criterion'), '组3 相邻对① path 应落 checkItems[0].criterion');
  const g3Ambiguous = run((c) => {
    c.checkItems[0].criterion = `${CT.criterionTerms[0]}${CT.criterionTerms[1]}`; // 去掉「3 次」→ 阈值候选不存在
    delete c.checkItems[0].definitions;
    delete c.checkItems[0].params;
  });
  assert.deepEqual(codes(g3Ambiguous), ['AmbiguousCriterion'],
    `组3 相邻对②：2 词无阈值无 definitions → 只报 AmbiguousCriterion（:232 末位），实得 ${codes(g3Ambiguous).join('|') || '(空)'}`);
  // 组6 的另一端（同组顺序的反向守卫）：未登记且不在任何表 → 只报 UnknownSignalType
  assert.deepEqual(codes(run((c) => { c.signals[0].type = 'signal.nowhere'; })),
    ['UnknownSignalType'], '组6 顺序：不在任何表优先于「局部新造」（:235）');
});

test('S1-TC-C03 表达式族两码分工：不可读优先于过深（§8 组 4，:233）', () => {
  const onlyUnreadable = run((c) => { c.must[0].expr = { and: [{ foo: [] }] }; });
  assert.deepEqual(codes(onlyUnreadable), ['UnreadableExpression'], '不可读优先：同 path 至多一码且必须先报不可读');
  assert.equal(pathsOf(onlyUnreadable).length, 1, `M1：同 path 至多一码，实得 ${pathsOf(onlyUnreadable).join('|')}`);
  assert.ok(String(pathsOf(onlyUnreadable)[0]).startsWith('must[0].expr'));
  const deep = run((c) => { c.must[0].expr = { and: [{ or: [{ '==': [1, 1] }] }] }; });
  assert.deepEqual(codes(deep), ['NestingTooDeep'], '可读但算子嵌算子 → 只报过深，不得同时报不可读');
  const flatOp = Object.keys(EX.ALLOWED_OPS)[0];
  assert.ok(flatOp, '前置：ALLOWED_OPS 必须非空（否则第 3 组恒真）');
  green(run((c) => { c.must[0].expr = { [flatOp]: [{ var: 'x' }] }; }));
});

test('S1-TC-G01 MissingSubject 两子面', () => {
  only(run((c) => { delete c.checkItems[0].subject; }), 'MissingSubject', 'checkItems[0].subject');
  only(run((c) => { c.checkItems[0].label = '观察表含证据行'; }), 'MissingSubject', 'checkItems[0].label');
  assert.ok(String(SUB.SUBJECTS[pickSubject(0)].display).trim(), '前置：display 非空（否则上式恒真）');
  green(run((c) => { c.checkItems[0].label = `${SUB.SUBJECTS[pickSubject(0)].display}含证据行`; }));
});

test('S1-TC-G02 DuplicateCheckItem / CrossSubjectSharedItem 与同 id 同 subject 的边界', () => {
  only(run((c) => { c.checkItems.push({ ...c.checkItems[0], id: 'k02' }); }), 'DuplicateCheckItem', 'checkItems[1]');
  only(run((c) => {
    const s1 = pickSubject(1);
    c.checkItems.push({ ...c.checkItems[0], subject: s1, label: `${SUB.SUBJECTS[s1].display}X` });
  }), 'CrossSubjectSharedItem', 'checkItems[1].id');
  const same = run((c) => { c.checkItems.push({ ...c.checkItems[0], criterion: '观察表每行带路径与行号且可回指' }); });
  assert.ok(!codes(same).includes('CrossSubjectSharedItem'), `同 id 同 subject 不得报 CrossSubjectSharedItem，实得 ${codes(same)}`);
});

test('S1-TC-G03 SubjectiveLabel：5 词 × 4 种分隔符', () => {
  assert.ok(ST.subjectiveTerms.length >= 5, `subjective-terms 起步 5 词，实得 ${ST.subjectiveTerms.length}`);
  const d = SUB.SUBJECTS[pickSubject(0)].display;
  for (const w of ST.subjectiveTerms.slice(0, 5)) {
    only(run((c) => { c.checkItems[0].label = `${d}、${w}`; }), 'SubjectiveLabel', 'checkItems[0].label');
  }
  for (const sep of ['，', '/', ' ']) {
    only(run((c) => { c.checkItems[0].label = `${d}${sep}${ST.subjectiveTerms[0]}`; }), 'SubjectiveLabel', 'checkItems[0].label');
  }
  only(run((c) => { c.categories[0].label = ST.subjectiveTerms[0]; }), 'SubjectiveLabel', 'categories');
});

test('S1-TC-G04 MissingAiAudit：6 形态必红 + 合法 ai 条目绿', () => {
  const aiCard = () => {
    const c = baseCard();
    c.checkItems[0] = {
      id: 'k01', subject: pickSubject(0), label: `${SUB.SUBJECTS[pickSubject(0)].display}观察表含证据行`,
      criterion: '观察表每行带路径与行号', check: 'ai',
      rubric: {
        positive: [{ text: '有 path:line', source: 'agents/detective-observer.md:12' }],
        negative: [{ text: '只写结论', source: 'agents/detective-observer.md:20' }],
        boundary: [{ text: '一行为空', source: 'agents/detective-observer.md:30' }],
      },
      audit: { sample: '每轮每条 ≥1', command: 'node tools/docgen/cli.mjs gate' },
    };
    return c;
  };
  green(M.validateCardModel(aiCard(), baseEnv()));
  for (const [name, mut] of [
    ['positive 空', (c) => { c.checkItems[0].rubric.positive = []; }],
    ['negative 空', (c) => { c.checkItems[0].rubric.negative = []; }],
    ['boundary 空', (c) => { c.checkItems[0].rubric.boundary = []; }],
    ['source 值不是 path:line', (c) => { c.checkItems[0].rubric.negative[0].source = '看到就行'; }],
    ['缺 source 键（PRD :262 收口）', (c) => { delete c.checkItems[0].rubric.positive[0].source; }],
    ['audit.sample 缺', (c) => { delete c.checkItems[0].audit.sample; }],
    ['audit.command 缺', (c) => { delete c.checkItems[0].audit.command; }],
  ]) {
    const c = aiCard(); mut(c);
    const r = M.validateCardModel(c, baseEnv());
    assert.deepEqual(codes(r), ['MissingAiAudit'], `${name}：应只报 MissingAiAudit，实得 ${codes(r)}`);
  }
  // 收口断言（§10-D16）：rubric 缺 source **不得**报成 AmbiguousCriterion（PRD :262 的旧写法在此作废）
  const noSource = aiCard();
  delete noSource.checkItems[0].rubric.positive[0].source;
  assert.ok(!codes(M.validateCardModel(noSource, baseEnv())).includes('AmbiguousCriterion'),
    'PRD :262 的「缺 source → AmbiguousCriterion」已由 §10-D16 收口到 MissingAiAudit（不得同形态双码）');
});

test('S1-TC-G05 判据配齐（definitions + params）时三码均不报（F-07 正向）', () => {
  green(run((c) => {
    c.checkItems[0].criterion = `${CT.criterionTerms[0]}${CT.criterionTerms[1]}`;
    c.checkItems[0].definitions = { [CT.criterionTerms[0]]: '按 agents/detective-observer.md:12 的口径' };
  }));
  green(run((c) => {
    c.checkItems[0].criterion = '同一问题卡少于 3 次观察';
    c.checkItems[0].params = { times: 3 };
  }));
  green(run((c) => {
    assert.ok(CT.criterionTerms.length >= 3);
    c.checkItems[0].criterion = `见 criterion-terms 全部成员（已进数组物料）`.replace('见 ', '');
    c.checkItems[0].definitions = Object.fromEntries(CT.criterionTerms.slice(0, 3).map((t) => [t, '已登记口径']));
  }));
  // ④ spec §7 :194 的「单位 → 键」映射：逐个配齐 → 绿（映射来自 §0.3 从 :194 原文切，不与自身字面 deepEqual）
  assert.equal(Object.keys(UNIT_KEY).length, 7, `前置：spec :194 应切出 7 个单位→键映射，实得 ${JSON.stringify(UNIT_KEY)}`);
  assert.equal(UNIT_KEY['处'], 'spots', '前置：`处→spots` 必须能从 :194 切出（改 spec 该映射 → 本行即红，这正是「不许自比自」的探针）');
  for (const [unit, key] of Object.entries(UNIT_KEY)) {
    green(run((c) => { c.checkItems[0].criterion = `少于 3 ${unit} 即算通过`; c.checkItems[0].params = { [key]: 3 }; }),
      `单位 ${unit} 的对应键 ${key} 在位时不得报 InlineThreshold`);
  }
});

test('S1-TC-G06 PointerToElsewhere 假阳性守卫：真实合法句「遇意见冲突」', () => {
  const realLine = readFileSync(join(REPO, 'tools/observation-check/data.mjs'), 'utf8').split(/\r?\n/)[26];
  assert.ok(realLine.includes('遇意见冲突'), `前置：:27 应含真实句，实得 ${realLine}`);
  const realPhrase = realLine.match(/遇意见冲突/)[0];
  assert.ok(realPhrase.includes('见'), '前置：该真实句确实含「见」字（否则本守卫无判别力）');
  green(run((c) => { c.duty.constraint = realPhrase; }));
  only(run((c) => { c.duty.action = '给出观察记录（见 §3）'; }), 'PointerToElsewhere');
  green(run((c) => { c.rationale = '理由见 §3 的判据口径。'; }));
});

test('S1-TC-G07 HardcodedCount 五形态（含全角 / 汉字数字）+ rationale 豁免（扫描面边界）', () => {
  // ① 五形态：半角 / 全角 / 汉字数字 + 「缺一X」+「全部」（§7 :187 的 N 字符面 + 三条正则）
  for (const text of ['给出共 3 条观察', '给出共３条观察', '给出共三条观察', '少写缺一项就算完成', '全部命中时收尾']) {
    only(run((c) => { c.duty.action = text; }), 'HardcodedCount');
  }
  // ② 全角 / 汉字形态在另两个卡文本面字段上同样必红（§4.2 :107 的扫描面逐字段列名）
  only(run((c) => { c.duty.constraint = '共３条以内'; }), 'HardcodedCount', 'duty.constraint');
  only(run((c) => { c.checkItems[0].label = `${SUB.SUBJECTS[pickSubject(0)].display}共三条`; }), 'HardcodedCount', 'checkItems[0].label');
  // ③ 豁免面保留：rationale 不在卡文本面（§4.2 :107 的「不扫」列）
  for (const text of ['本条不写数量（共 3 条属反例）', '全部命中时收尾', '共３条、共三条都属反例']) {
    green(run((c) => { c.rationale = text; }));
  }
});

test('S1-TC-G08 MixedTermInCard / ProceduralWordOutsideParliament：议会席豁免', () => {
  only(run((c) => { c.duty.action = '主持人调度时记录'; c.duty.constraint = '与议长口径一致'; }), 'MixedTermInCard');
  green(run((c) => { c.duty.action = '主持人调度时记录'; }));
  only(run((c) => { c.duty.action = '收卡'; }), 'ProceduralWordOutsideParliament');
  green(run((c) => { c.duty.action = '收卡'; }, { parliamentSeats: new Set([SEAT]) }));
});

test('S1-TC-G09 SCAN_FIELDS 扫描面边界：rationale / description / scenes[].why 三处「不扫」与卡文本面「必扫」', () => {
  // ①②③⑦：三处「不在扫描面」的字段 —— 写了违规词也不得报码
  green(run((c) => { c.rationale = '详见 §3 的口径（散文只进此处）'; })); // ① rationale 不扫指针词
  green(run((c) => { c.description = '每轮答辩结束后开始观察（共 3 条）'; })); // ② description 不扫数量词
  green(run((c) => { // ③ scenes[].why 不扫数量词
    c.scenes = [{ id: 'local.why', label: '局部场景', why: '全部命中时记录' }];
    c.must[0].trigger.scene = 'local.why';
    c.never[0].trigger.scene = 'local.why';
  }));
  green(run((c) => { c.description = '主持人调度，议长口径'; })); // ⑦ description 不扫混称词
  // ④⑤：卡文本面内同一违规词必须报
  only(run((c) => { c.duty.constraint = '共 3 条以内'; }), 'HardcodedCount', 'duty.constraint');
  only(run((c) => { c.checkItems[0].label = `${SUB.SUBJECTS[pickSubject(0)].display}见 §3`; }), 'PointerToElsewhere', 'checkItems[0].label');
  // ⑥⑧：∪ rationale 的两码 —— rationale 里的违规词必须报
  only(run((c) => { c.rationale = '收卡'; }), 'ProceduralWordOutsideParliament');
  only(run((c) => { c.duty.action = '主持人调度时记录'; c.rationale = '与议长口径一致'; }), 'MixedTermInCard');
  // ⑨ 常量侧对账（§4.2 :112 键形态写死：键 = 8 个码名、逐码一项、不合并成 4 组键）
  const SF = EN.SCAN_FIELDS;
  assert.ok(SF && typeof SF === 'object' && !Array.isArray(SF), 'enums.mjs 必须导出 SCAN_FIELDS 对象（§3 :37 / §4.2 :112）');
  assert.equal(Object.keys(SF).length, 8, `SCAN_FIELDS 必须恰 8 个键（逐码一项），实得 ${Object.keys(SF).length}：${Object.keys(SF).join('|')}`);
  const TEXT_CODES = ['SubjectiveLabel', 'InlineTermList', 'InlineThreshold', 'AmbiguousCriterion',
    'PointerToElsewhere', 'HardcodedCount', 'MixedTermInCard', 'ProceduralWordOutsideParliament'];
  assert.deepEqual(Object.keys(SF).sort(), [...TEXT_CODES].sort(),
    'SCAN_FIELDS 的键集必须逐字等于这 8 个文本类码名（不得合并成「扫描面相同」的 4 组键，§4.2 :112）');
  for (const k of TEXT_CODES) assert.ok(Object.prototype.hasOwnProperty.call(SF, k), `SCAN_FIELDS 必须为 ${k} 写扫描面（§4.2 八键表）`);
  const flat = (v) => [...(v instanceof Set ? v : Array.isArray(v) ? v : Object.keys(v || {}))].join('|'); // Set / Array / Object 三形态都归一
  const hasR = (k) => flat(SF[k]).includes('rationale');
  assert.equal(hasR('MixedTermInCard'), true, '§4.2 :108：MixedTermInCard 扫 卡文本面 ∪ rationale');
  assert.equal(hasR('ProceduralWordOutsideParliament'), true, '§4.2 :108：ProceduralWordOutsideParliament 扫 卡文本面 ∪ rationale');
  for (const k of ['SubjectiveLabel', 'InlineTermList', 'InlineThreshold', 'AmbiguousCriterion', 'PointerToElsewhere', 'HardcodedCount']) {
    assert.equal(hasR(k), false, `§4.2：${k} 不扫 rationale`);
  }
  assert.equal(flat(SF.InlineTermList).includes('criterion'), true, '§4.2 :106：三码仅扫 checkItems[].criterion');
  assert.equal(flat(SF.SubjectiveLabel).includes('categories'), true, '§4.2 :105：SubjectiveLabel 扫 categories[].label');
});

test('S1-TC-I03 UnverifiableOutput 的第二个判定面：subject ∉ SUBJECT_VALIDATORS', () => {
  const bad = run((c) => { c.checkItems[0].subject = 'artifact.not-registered'; });
  assert.ok(codes(bad).includes('UnverifiableOutput'), `subject 未登记应报 UnverifiableOutput，实得 ${codes(bad)}`);
  assert.ok(!codes(bad).includes('MissingSubject'), `不得同时报 MissingSubject（同一 subject 面归一码），实得 ${codes(bad)}`);
  const ok = run((c) => { c.checkItems[0].subject = pickSubject(0); });
  green(ok);
});

test('S1-TC-I04 WeakReason 不进脚本码表（V-5，第三方：PRD 原文）', () => {
  const prd = readFileSync(join(REPO, 'docs/prd/20261026205821-agent-card-contract.md'), 'utf8').split(/\r?\n/);
  assert.ok(prd[215].includes('manual') && prd[215].includes('WeakReason'), `PRD :216 应明写 WeakReason 是 manual；实得 ${prd[215]}`);
  const keySet = Object.keys(M.CARD_MODEL_CODES);
  assert.equal(keySet.length, S1_CODES.length, `前置：码表键数必须与 §7 码数一致，实得 ${keySet.length}`);
  assert.ok(!keySet.includes('WeakReason'), `脚本码表不得含 WeakReason，实得 ${keySet.filter((k) => /Weak/.test(k))}`);
  const tampered = [...keySet, 'WeakReason'];
  assert.ok(tampered.includes('WeakReason'), '副本注入后必含（证明上式不是恒真）');
  assert.equal(S1_CODES.includes('WeakReason'), false);
});

test('S1-TC-J01 全字段卡正向（F-01 / F-04）', () => {
  const rich = baseCard();
  rich.scenes.push({ id: 'local.extra', label: '局部场景', why: '本席专用' });
  const sig = Object.keys(M.SIGNALS)[1];
  rich.signals.push({ type: sig, observer: '轮末快照', match: '产物出现' });
  rich.must.push({ ...rich.must[0], id: 'observe2', trigger: { scene: 'local.extra', moment: Object.keys(M.MOMENTS)[1], repeat: Object.keys(M.REPEATS)[1] } });
  rich.categories.push({ key: 'observe2', label: '补充观察项' });
  rich.checkItems.push({ id: 'k02', subject: pickSubject(0), label: `${SUB.SUBJECTS[pickSubject(0)].display}补充行`, criterion: '补充行带路径与行号', check: 'script', cmd: 'node tools/docgen/cli.mjs gate' });
  const r = M.validateCardModel(rich, baseEnv());
  green(r);
  for (const s of rich.scenes) assert.ok(M.SHARED_SCENES[s.id] || s.why, `局部场景 ${s.id} 必须带 why`);
});
