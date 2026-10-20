import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
export const evidenceDir = () => process.env.DOCGEN_EVIDENCE_DIR || join(ROOT, 'fixtures');
export const evidencePath = (name) => join(evidenceDir(), `${name}.evidence.json`);

const HEX40 = /^[0-9a-f]{40}$/;
const SHA = /^[0-9A-F]{64}$/;
const PENDING = 'pending';

function fail(code, fields = {}) {
  const e = new Error(code);
  e.code = code;
  Object.assign(e, fields);
  e.exitCode = 2;
  throw e;
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
