// 证据可解析：path 在根目录内、文件存在、line 在范围内、该行确实含 quote、quote 足够长
// 目的：挡住"格式对的假证据"（指向仓库外/不存在/不相符的位置，或引用只是单字/常见片段）
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, resolve, sep } from 'node:path';

const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

// 引用长度三档：够长 / 或占该行一半以上（短标题不逼人凑字）/ 但仍不得少于 4 字
const MIN_QUOTE_CHARS = 10;
const MIN_QUOTE_RATIO = 0.5;
const MIN_QUOTE_FLOOR = 4;

// 路径白名单：只许相对路径，且解析（含软链）后必须落在 root 内
function confine(p, root) {
  if (isAbsolute(p) || /^[A-Za-z]:/.test(p) || p.startsWith('\\\\')) {
    return { error: { code: 'EvidencePathAbsolute', detail: `evidence.path 必须是相对路径：${p}` } };
  }
  const rootReal = realpathSync(resolve(root));
  const inside = (abs) => abs === rootReal || abs.startsWith(rootReal + sep);
  const abs = resolve(rootReal, p);
  if (!inside(abs)) {
    return { error: { code: 'EvidencePathOutside', detail: `evidence.path 解析后落在根目录外：${p}` } };
  }
  if (existsSync(abs) && !inside(realpathSync(abs))) {
    return { error: { code: 'EvidencePathOutside', detail: `evidence.path 是软链，指向根目录外：${p}` } };
  }
  return { abs };
}

export function checkEvidence(ev, { exists = existsSync, read = (p) => readFileSync(p, 'utf8'), root = process.cwd() } = {}) {
  if (!ev || typeof ev !== 'object' || Array.isArray(ev)) {
    return { ok: false, code: 'InvalidFieldType', detail: 'evidence 必须是 { path, line, quote }' };
  }
  const { path, line, quote } = ev;
  if (typeof path !== 'string' || !path.trim()) {
    return { ok: false, code: 'InvalidFieldType', detail: 'evidence.path 必填' };
  }
  if (!Number.isInteger(line) || line < 1) {
    return { ok: false, code: 'InvalidFieldType', detail: 'evidence.line 必须是 ≥1 的整数' };
  }
  if (typeof quote !== 'string' || !quote.trim()) {
    return { ok: false, code: 'InvalidFieldType', detail: 'evidence.quote 必填' };
  }
  const confined = confine(path, root);
  if (confined.error) return { ok: false, ...confined.error };
  const abs = confined.abs;
  if (!exists(abs)) {
    return { ok: false, code: 'EvidenceNotFound', detail: `文件不存在：${path}` };
  }
  let text;
  try {
    text = String(read(abs));
  } catch (e) {
    return { ok: false, code: 'EvidenceUnreadable', detail: `无法读取 ${path}：${e.message}` };
  }
  const lines = text.split(/\r?\n/);
  if (line > lines.length) {
    return { ok: false, code: 'EvidenceLineOutOfRange', detail: `${path}:${line} 超出文件行数 ${lines.length}` };
  }
  if (!norm(lines[line - 1]).includes(norm(quote))) {
    return { ok: false, code: 'EvidenceQuoteMismatch', detail: `${path}:${line} 不含引用片段` };
  }
  const nq = norm(quote);
  const nl = norm(lines[line - 1]);
  const longEnough = nq.length >= MIN_QUOTE_CHARS;
  const coversLine = nq.length >= MIN_QUOTE_FLOOR && nq.length / nl.length >= MIN_QUOTE_RATIO;
  if (!longEnough && !coversLine) {
    return {
      ok: false,
      code: 'EvidenceQuoteTooShort',
      detail: `引用只有 ${nq.length} 字（该行 ${nl.length} 字）：须 ≥${MIN_QUOTE_CHARS} 字，或 ≥${MIN_QUOTE_FLOOR} 字且占该行 ${MIN_QUOTE_RATIO * 100}% 以上`,
    };
  }
  return { ok: true };
}
