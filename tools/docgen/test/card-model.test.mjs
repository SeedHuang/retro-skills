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

const deepFreeze = (o) => {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v);
  }
  return o;
};

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
