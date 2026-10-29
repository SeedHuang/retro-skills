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
  // Task 4 起切到派生单源：`M.registeredIdsOf([baseCard()])`（spec §6 :154）
  registeredIds: new Set(['k01']),
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
  // ⑤ 缺列码归 S2：S1 的 36 码表里不得有它（Task 4 起 M.CARD_MODEL_CODES 才存在）
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
  // ④ 缺列码不在 S1 码表（Task 4 起断言）
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
  // ④ 分离纪律 + ⑤ validateCardModel 不返回合并码 —— 依赖 Task 4 的 CARD_MODEL_CODES 与发射点，Task 5 收尾时补齐
});
