import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// 语义键的权威单源（10 键），从执行力度矩阵导入
import { SEMANTIC_KEYS } from '../execution-matrix/check-agent.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
export const evidenceDir = () => process.env.DOCGEN_EVIDENCE_DIR || join(ROOT, 'fixtures');
export const evidencePath = (name) => join(evidenceDir(), `${name}.evidence.json`);

const HEX40 = /^[0-9a-f]{40}$/;
const SHA = /^[0-9A-F]{64}$/;
const MACHINE_KEYS = ['A3', 'A4', 'A5', 'A6', 'A7'];
const PENDING = 'pending';

function fail(code, fields = {}) {
  const e = new Error(fields.message ?? code);
  e.code = code;
  Object.assign(e, fields);
  e.exitCode = 2;
  throw e;
}

// changes 校验（spec §3.4，只增不改）：字段缺省合法；出现即按逐项类型 + 键域 + 三元对齐校验
function checkChanges(p, changes) {
  const bad = (reason, extra = {}) => fail('EvidenceInvalid', { path: p, reason, ...extra });
  if (!Array.isArray(changes)) bad('changes 不是数组');
  for (const it of changes) {
    if (!it || typeof it !== 'object' || Array.isArray(it)) bad('changes 项不是对象');
    if (!SHA.test(it.from) || !SHA.test(it.to)) bad('changes.from / to 须为 64 位大写 hex');
    if (typeof it.at !== 'string' || it.at.trim() === '') bad('changes.at 须为非空 ISO 字符串');
    if (!Array.isArray(it.rejudged) || it.rejudged.some((k) => typeof k !== 'string')) bad('changes.rejudged 须为字符串数组');
    // A3–A7 没有注解位：混进 rejudged 会让该席键集变 11 → check-all 判红
    const unknown = it.rejudged.filter((k) => !SEMANTIC_KEYS.includes(k));
    if (unknown.length > 0) bad(`changes.rejudged 含不属于 10 语义键的键：${unknown.join(',')}（A3–A7 走 machineChecks）`);
    if (!Array.isArray(it.judged)) bad('changes.judged 须为数组');
    if (it.rejudged.length === 0) {
      if (it.judged.length !== 0) bad('rejudged 为空时 judged 必须为 []');
      if (it.judgeMode !== 'none') bad('rejudged 为空时 judgeMode 必须为 none');
    } else {
      if (!['subagent', 'self-degraded'].includes(it.judgeMode)) bad('judgeMode 须为 subagent / self-degraded');
      if (typeof it.judgedBy !== 'string' || it.judgedBy.trim() === '') bad('rejudged 非空时 judgedBy 必填');
      if (it.judged.length !== it.rejudged.length) bad('judged 须逐键一条（条数 == rejudged 条数）');
      for (const key of it.rejudged) {
        const rec = it.judged.find((x) => x && x.key === key);
        if (!rec) bad(`judged 缺 ${key} 的判定记录（只报不判 = 视为漏报）`);
        if (!['pass', 'fail'].includes(rec.verdict)) bad(`judged[${key}].verdict 须为 pass / fail`);
        if (typeof rec.basis !== 'string' || rec.basis.trim() === '') bad(`judged[${key}].basis 不得为空`);
      }
      if (it.judged.some((x) => !it.rejudged.includes(x.key))) bad('judged 含未在 rejudged 中声明的键');
    }
    const mc = it.machineChecks;
    if (!mc || typeof mc !== 'object' || Array.isArray(mc)) bad('changes.machineChecks 必填');
    const keys = Object.keys(mc);
    const missing = MACHINE_KEYS.filter((k) => !['pass', 'fail'].includes(mc[k]));
    if (missing.length > 0 || keys.length !== MACHINE_KEYS.length) bad(`machineChecks 须恰含 A3–A7 五键且值为 pass / fail（缺/非法：${missing.join(',') || '无'}）`);
  }
}

export function readEvidence(name) {
  const p = evidencePath(name);
  if (!existsSync(p)) fail('EvidenceInvalid', { path: p, reason: '缺失' });
  let e;
  try {
    e = JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    fail('EvidenceInvalid', { path: p, reason: 'JSON 解析失败' });
  }
  const ok = e
    && HEX40.test(e.commit)
    && HEX40.test(e.blob)
    && SHA.test(e.sha256)
    && HEX40.test(e.hashObject)
    && ['pass', 'fail', PENDING].includes(e.goldenAssertion)
    && (e.compareResult === null || (typeof e.compareResult === 'object' && 'code' in e.compareResult))
    && (e.renderSha256 === PENDING || SHA.test(e.renderSha256))
    && SHA.test(e.lastWrittenHash);
  if (!ok) fail('EvidenceInvalid', { path: p, reason: '字段缺失或类型非法' });
  if (e.changes !== undefined) checkChanges(p, e.changes);
  return e;
}

export function writeEvidence(name, data) {
  const p = evidencePath(name);
  mkdirSync(dirname(p), { recursive: true });
  // 原子写（与 state.mjs writeState 同构）：崩溃不留下半截 JSON
  const tmp = `${p}.tmp-${process.pid}`;
  try {
    writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`);
    renameSync(tmp, p);
  } catch (e) {
    rmSync(tmp, { force: true });
    throw e;
  }
}
