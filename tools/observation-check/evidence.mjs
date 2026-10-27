// 证据可解析（七道）：路径相对 → 根内 → 敏感路径 → 存在 → 可读 → 行号 → 含 quote → 长度 → 结构行 → 敏感内容
// 根唯一来源 = git rev-parse --show-toplevel（PRD §4.3-2 / C-03），接口不接受 root 参数。
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { isAbsolute, resolve, sep } from 'node:path';
import { MD_SKELETON } from './md-format.mjs';

const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const cpLen = (s) => [...s].length;                       // 字数按码点计（PRD §4.3-5）

const MIN_QUOTE_CHARS = 10;
const MIN_QUOTE_RATIO = 0.5;
const MIN_QUOTE_FLOOR = 4;

// 第 6 道：按 / \ 拆段，任一段命中即红（PRD §4.3-6）
const SENSITIVE_SEGMENTS = [
  /^\.env(\.|$)/, /\.pem$/i, /\.key$/i, /\.p12$/i, /^id_rsa/, /^id_ed25519/,
  /^\.npmrc$/, /^\.netrc$/, /^credentials/i, /secret/i,
];
// 第 7 道：引用内容（PRD §4.3-7，四形态逐字）
const SENSITIVE_QUOTE = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/,
  /ghp_[A-Za-z0-9]{36}/,
  /https?:\/\/[^/@\s]+:[^/@\s]+@/,
];
// 第 5 道附带：纯结构行不可作证据（码名 EvidenceStructuralRow，PRD §4.4 B 表 2026-10-27 登记）
const STRUCTURAL_ROW = [
  /^[-*_]{3,}$/,                                   // 水平线 / 标题分隔
  /^(`{3,}|~{3,})/,                                 // 围栏行
  /^\|?(\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?$/,    // 表格分隔行
  /^\|?\s*:?-{3,}:?\s*\|$/,                        // 单栏表格分隔行（同上一条的 1 栏形态）
];

// 第 5 道附带：渲染器固定骨架行（版本横幅 / 固定标题 / 「无。」/ 两张表头）同样零信息，不可作证据。
// 常量取自 md-format.mjs（与渲染侧同源）：格式改一处即可，避免「自己产出的常量又能当证据」。
const SKELETON_SET = new Set(MD_SKELETON.map(norm));

let cachedRoot = null;
export function repoRoot() {
  if (cachedRoot) return cachedRoot;
  try {
    const out = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
    if (!out) throw new Error('git rev-parse 输出为空');
    cachedRoot = realpathSync(out);
    return cachedRoot;
  } catch (e) {
    const err = new Error(`RepoRootUnresolved: 取不到仓库根（${e.message}）`);
    err.code = 'RepoRootUnresolved';
    throw err;
  }
}

const isSensitivePath = (p) => p.split('/').some((seg) => SENSITIVE_SEGMENTS.some((re) => re.test(seg)));

function confine(p, root) {
  if (isAbsolute(p) || /^[A-Za-z]:/.test(p) || p.startsWith('\\\\')) {
    return { error: { code: 'EvidencePathAbsolute', detail: `evidence.path 必须是相对路径：${p}` } };
  }
  const inside = (abs) => abs === root || abs.startsWith(root + sep);
  const abs = resolve(root, p);
  if (!inside(abs)) return { error: { code: 'EvidencePathOutside', detail: `evidence.path 解析后落在根目录外：${p}` } };
  // 无法证明在根内 = fail-closed（realpath 失败不得冒泡，同 artifact.mjs 口径）
  if (existsSync(abs)) {
    let real;
    try { real = realpathSync(abs); } catch (e) {
      return { error: { code: 'EvidencePathOutside', detail: `路径无法解析（realpath 失败）：${p}（${e.code ?? e.message}）` } };
    }
    if (!inside(real)) {
      return { error: { code: 'EvidencePathOutside', detail: `evidence.path 是软链，指向根目录外：${p}` } };
    }
  }
  return { abs };
}

export function checkEvidence(ev, { read = (p) => readFileSync(p, 'utf8') } = {}) {
  if (!ev || typeof ev !== 'object' || Array.isArray(ev)) {
    return { ok: false, code: 'InvalidFieldType', detail: 'evidence 必须是 { path, line, quote }' };
  }
  const { path, line, quote } = ev;
  if (typeof path !== 'string' || !path.trim()) return { ok: false, code: 'InvalidFieldType', detail: 'evidence.path 必填' };
  if (!Number.isInteger(line) || line < 1) return { ok: false, code: 'InvalidFieldType', detail: 'evidence.line 必须是 ≥1 的整数' };
  if (typeof quote !== 'string' || !quote.trim()) return { ok: false, code: 'InvalidFieldType', detail: 'evidence.quote 必填' };

  const normalized = path.replace(/\\/g, '/');            // PRD §4.3-1：反斜杠按 / 归一
  let root;
  try { root = repoRoot(); } catch (e) { return { ok: false, code: e.code ?? 'RepoRootUnresolved', detail: e.message }; }
  const confined = confine(normalized, root);
  if (confined.error) return { ok: false, ...confined.error };
  if (isSensitivePath(normalized)) {
    return { ok: false, code: 'EvidenceSensitivePath', detail: `证据路径命中敏感名单：${normalized}` };
  }
  const abs = confined.abs;
  if (!existsSync(abs)) return { ok: false, code: 'EvidenceNotFound', detail: `文件不存在：${normalized}` };
  let text;
  try { text = String(read(abs)); } catch (e) { return { ok: false, code: 'EvidenceUnreadable', detail: `无法读取 ${normalized}：${e.message}` }; }
  const lines = text.split(/\r?\n/);
  // 文件以换行结尾时 split 会多出一个空元素：去掉它，否则「末行 + 1」会被误判为行内
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  if (line > lines.length) {
    return { ok: false, code: 'EvidenceLineOutOfRange', detail: `${normalized}:${line} 超出文件行数 ${lines.length}` };
  }
  const cited = norm(lines[line - 1]);
  const nq = norm(quote);
  if (!cited.includes(nq)) return { ok: false, code: 'EvidenceQuoteMismatch', detail: `${normalized}:${line} 不含引用片段` };

  const longEnough = cpLen(nq) >= MIN_QUOTE_CHARS;
  const coversLine = cpLen(nq) >= MIN_QUOTE_FLOOR && cpLen(nq) / cpLen(cited) >= MIN_QUOTE_RATIO;
  if (!longEnough && !coversLine) {
    return {
      ok: false,
      code: 'EvidenceQuoteTooShort',
      detail: `引用只有 ${cpLen(nq)} 字（该行 ${cpLen(cited)} 字）：须 ≥${MIN_QUOTE_CHARS} 字，或 ≥${MIN_QUOTE_FLOOR} 字且占该行 ${MIN_QUOTE_RATIO * 100}% 以上`,
    };
  }
  if (STRUCTURAL_ROW.some((re) => re.test(cited)) || SKELETON_SET.has(cited)) {
    return { ok: false, code: 'EvidenceStructuralRow', detail: `${normalized}:${line} 是纯结构行，不可作证据` };
  }
  if (SENSITIVE_QUOTE.some((re) => re.test(nq))) {
    return { ok: false, code: 'EvidenceQuoteSensitive', detail: `引用命中敏感内容：${normalized}:${line}` };
  }
  return { ok: true };
}
