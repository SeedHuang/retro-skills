// check-agent.mjs —— A 组检查：结构项 A3-A7 机器查（存在性 + 语义，兼容两种模板形态）
// 语义项 A1/A2 + B 组 4 项 + C 组 4 项 = 10 键，从 annotations 机械接收（三态，脚本不重判语义）
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderByName } from '../docgen/cli.mjs';
import { splitRow, fenceMask } from './markdown-rows.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ANNOTATIONS = join(ROOT, 'rules', '.inspector-annotations.json');
const AGENTS_DIR = join(ROOT, 'agents');

// AI 判的 10 键（A 语义 2 + B 4 + C 4）——键命名 = `agent 卡名:判定项名`
export const SEMANTIC_KEYS = ['A1', 'A2', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4'];

// 表格单元格切分 / 围栏掩码 = markdown-rows.mjs 的共享单源（本文件不保留第二份实现）
// 围栏内内容（```markdown 示例块里的表格、标题）**不是卡的真实结构**，A3-A7 一律不看。

// 切分卡片的标题节（# 一级 ~ 六级），每节 = 标题 + 正文
// ⚠ 跳过代码围栏内部：围栏里常嵌示例标题（如示例块里写 `## 边界`），若当成真节，
//   A6「边界声明」/ A7「输出格式指定」会被示例标题假通过（卡里其实没有这两个节）。
export function splitSections(card) {
  const lines = card.split(/\r?\n/);
  const { mask } = fenceMask(lines);
  const sections = [];
  let cur = { heading: '', level: 0, lines: [] };
  for (let i = 0; i < lines.length; i++) {
    if (mask[i]) { cur.lines.push(lines[i]); continue; }   // 围栏内部：既不是标题也不单独成节
    const m = /^(#{1,6})\s+(.*)$/.exec(lines[i]);
    if (m) {
      sections.push(cur);
      cur = { heading: m[2].trim(), level: m[1].length, lines: [] };
    } else {
      cur.lines.push(lines[i]);
    }
  }
  sections.push(cur);
  return sections.filter((s) => s.heading || s.lines.some((l) => l.trim()));
}

function sectionText(section) {
  return [section.heading, ...section.lines].join('\n');
}

// 表格块（连续以 | 开头的行）；块首行 = 表头
// ⚠ 必须跳过代码围栏内部：卡里常有 ```markdown 示例块内嵌示例表格（如 agents/senior-sdet.md:63-66），
//   若把示例表当真实表格，A3「必答清单存在」会被示例表假通过（卡里其实没有真实清单）。
export function tableBlocks(text) {
  const lines = text.split(/\r?\n/);
  const { mask } = fenceMask(lines);
  const blocks = [];
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
    if (mask[i]) { cur = null; continue; }   // 围栏内部（含围栏分隔行）：不是真实表格，且打断表格块
    if (/^\s*\|/.test(lines[i])) {
      if (!cur) { cur = []; blocks.push(cur); }
      cur.push(lines[i]);
    } else {
      cur = null;
    }
  }
  return blocks;
}

// 「必答 / 必问」列头存在性（存在性 + 语义，不按逐字模板句）
function hasMustAnswerColumn(block) {
  if (!block || block.length < 2) return false;
  const header = splitRow(block[0]);
  return header.some((c) => c.includes('必答') || c.includes('必问'));
}

// A4 闭环字样（criteria.md A4 判定方式：含「缺答 / 只答固定清单 = 不合格」任一字样）
const CLOSURE_RE = /(缺答|只答固定清单)[^。\n]{0,20}=\s*不合格/;
// A5 证据约束字样（criteria.md A5 判定方式：含「证据可复算」或「证据栏」）
const EVIDENCE_RE = /证据可复算|证据栏/;

// 「固定清单」节：节名含「固定」且含「清单」（semantic 定位，不按逐字节节名）
function isFixedListSection(section) {
  return section.heading.includes('固定') && section.heading.includes('清单');
}

// A3-A7 结构断言（存在性 + 语义）
// 模板形态适配（criteria.md §0.2）：判定词按「存在性 + 语义」写，不按逐字模板句——
//   A3 判卡内任一表格含「必答/必问」列头（无唯一目标节，直接全卡扫表格；**跳过代码围栏内的示例表**）。
// A4/A5 的判定口径（criteria.md §0.5「节内优先、整卡兜底」，正文与本实现必须一致）：
//   ① 先在目标节内匹配判定词（节内优先，收紧精度）；② 未命中再退回全卡搜索（整卡兜底，防误伤——
//      senior-sdet 的闭环字样就写在「自由探索」节内，严格限节内会把合规卡判红）；③ 命中位置记进 notes。
//   下方 A4/A5 两段代码严格按 ①②③ 顺序执行，勿调换。
export function checkStruct(card) {
  const findings = [];
  const notes = [];
  const sections = splitSections(card);

  // A3 必答清单存在：卡内任一表格含「必答/必问」列头
  if (!tableBlocks(card).some(hasMustAnswerColumn)) findings.push({ code: 'A3' });

  // A4 必答闭环：「固定清单」节内查闭环字样；节内无则退回整卡（存在性 + 语义）
  const fixedSections = sections.filter(isFixedListSection);
  const closureInFixed = fixedSections.find((s) => CLOSURE_RE.test(sectionText(s)));
  if (closureInFixed) {
    notes.push(`A4: 闭环字样在「${closureInFixed.heading}」节内`);
  } else if (CLOSURE_RE.test(card)) {
    notes.push('A4: 闭环字样在卡内（「固定清单」节外）——存在性 + 语义，判通过');
  } else {
    findings.push({ code: 'A4' });
  }

  // A5 证据约束：「通用纪律」节或「核对项」节内查证据字样；无此节时退回整卡
  const discipline = sections.filter((s) => s.heading.includes('通用纪律') || s.heading.includes('核对项'));
  const evidenceInDiscipline = discipline.find((s) => EVIDENCE_RE.test(sectionText(s)));
  if (evidenceInDiscipline) {
    notes.push(`A5: 证据字样在「${evidenceInDiscipline.heading}」节内`);
  } else if (EVIDENCE_RE.test(card)) {
    notes.push('A5: 证据字样在卡内（「通用纪律」/「核对项」节外）——存在性 + 语义，判通过');
  } else {
    findings.push({ code: 'A5' });
  }

  // A6 边界声明 / A7 输出格式指定（节名存在性，两模板一致）
  if (!sections.some((s) => s.heading.startsWith('边界'))) findings.push({ code: 'A6' });
  if (!sections.some((s) => s.heading.startsWith('输出格式'))) findings.push({ code: 'A7' });

  return { findings, notes };
}

export function readAnnotations() {
  if (!existsSync(ANNOTATIONS)) return {};
  return JSON.parse(readFileSync(ANNOTATIONS, 'utf8'));
}

// 三态机械接收（脚本不重判语义，只按值透传）
//   pass → 绿；fail / fail: 理由 → 红；pending → 红；非字符串 / 未知值 → 红（InvalidAnnotation）
export function judgeAnnotation(raw) {
  if (typeof raw !== 'string') {
    return { red: true, code: 'InvalidAnnotation', reason: `非字符串判定值（${raw === null ? 'null' : typeof raw}）` };
  }
  const value = raw.trim().toLowerCase();
  if (value === 'pass') return { red: false, code: null, reason: null };
  if (value === 'pending') return { red: true, code: null, reason: '未判（pending）' };
  if (value.startsWith('fail')) return { red: true, code: null, reason: raw.trim() };
  return { red: true, code: 'InvalidAnnotation', reason: `未知判定值：${raw.trim()}` };
}

// annotations 里的 10 键 → findings（缺键按 pending 处理）
export function checkSemantic(ann, name) {
  const findings = [];
  for (const key of SEMANTIC_KEYS) {
    const full = `${name}:${key}`;
    const raw = Object.prototype.hasOwnProperty.call(ann, full) ? ann[full] : 'pending';
    const verdict = judgeAnnotation(raw);
    if (!verdict.red) continue;
    if (verdict.code === 'InvalidAnnotation') {
      findings.push({ code: 'InvalidAnnotation', key: full, state: raw, reason: verdict.reason });
    } else {
      findings.push({ code: key, state: raw, reason: verdict.reason });
    }
  }
  return findings;
}

// 渲染卡（docgen 模板产物）跑全套检查
export function checkAgent(name) {
  const card = renderByName(name);
  const { findings: struct, notes } = checkStruct(card);
  const semantic = checkSemantic(readAnnotations(), name);
  return {
    ok: struct.length === 0 && semantic.length === 0,
    findings: [...struct, ...semantic],
    notes,
    a1a2From: 'annotations',
  };
}

// 真卡路径：直接读 agents/<name>.md（handwritten 模板卡不在 docgen 渲染范围内，须走真卡）
export function checkAgentFile(name) {
  const path = join(AGENTS_DIR, `${name}.md`);
  if (!existsSync(path)) {
    return { ok: false, findings: [{ code: 'CardNotFound', name }], notes: [], a1a2From: 'annotations' };
  }
  const card = readFileSync(path, 'utf8');
  const { findings: struct, notes } = checkStruct(card);
  const semantic = checkSemantic(readAnnotations(), name);
  return {
    ok: struct.length === 0 && semantic.length === 0,
    findings: [...struct, ...semantic],
    notes,
    a1a2From: 'annotations',
  };
}

export function checkAgentFromText(card) {
  const { findings, notes } = checkStruct(card);
  return { ok: findings.length === 0, findings, notes };
}
