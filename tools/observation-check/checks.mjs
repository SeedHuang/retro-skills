// 结构化产物校验 + 渲染：机器校验 JSON，markdown 只是视图
import { splitRow, escapeCell, fenceMask } from '../execution-matrix/markdown-rows.mjs';
import { MD_BANNER, MD_TITLE, MD_OPEN_SECTION, MD_NONE, MD_ITEMS_HEADER, MD_OPEN_HEADER } from './md-format.mjs';
import { checkEvidence } from './evidence.mjs';

const VERDICTS = new Set(['hit', 'miss', 'na']);
const CLOSURES = new Set([null, 'no-findings', 'blocked']);

function err(list, code, message, path) {
  list.push({ code, message, path });
}

// 结构化 evidence：{ path, line, quote }。给了 resolver 才做「可解析」校验（需要读盘）
function checkEvidenceField(ev, at, errors, resolveEvidence) {
  if (!ev || typeof ev !== 'object' || Array.isArray(ev)) {
    err(errors, 'InvalidFieldType', 'evidence 必须是 { path, line, quote }', `${at}.evidence`);
    return;
  }
  if (resolveEvidence) {
    const r = checkEvidence(ev);
    if (!r.ok) err(errors, r.code, r.detail, `${at}.evidence`);
    return;
  }
  if (typeof ev.path !== 'string' || !Number.isInteger(ev.line) || typeof ev.quote !== 'string') {
    err(errors, 'InvalidFieldType', 'evidence 结构必须为 { path, line, quote }', `${at}.evidence`);
  }
}

// 七条覆盖对账（PRD §4.2 ①）。只在该段各字段类型合法时跑，避免类型错引发级联噪声。
function checkCoverageReconciliation(items, c, registeredIds, errors) {
  const skipped = Array.isArray(c.skipped) ? c.skipped : null;
  const ids = Array.isArray(registeredIds) ? registeredIds : null;
  if (!Array.isArray(items) || !skipped || !ids) return;
  if (!Number.isInteger(c.read) || !Number.isInteger(c.total)) return;

  if (items.length !== c.read) {
    err(errors, 'CoverageMismatch', `items 条数 ${items.length} ≠ coverage.read ${c.read}`, 'coverage.read');
  }
  if (c.total !== ids.length) {
    err(errors, 'CoverageMismatch', `coverage.total ${c.total} ≠ registeredIds 长度 ${ids.length}`, 'coverage.total');
  }
  if (c.read + skipped.length !== c.total) {
    err(errors, 'CoverageMismatch', `read + skipped ${c.read + skipped.length} ≠ total ${c.total}`, 'coverage');
  }
  const unregistered = skipped.filter((id) => !ids.includes(id));
  if (unregistered.length) {
    err(errors, 'CoverageMismatch', `skipped 含未登记 id：${unregistered.join('、')}`, 'coverage.skipped');
  }
  const dup = skipped.filter((id, i) => skipped.indexOf(id) !== i);
  if (dup.length) {
    err(errors, 'CoverageMismatch', `skipped 内 id 重复：${[...new Set(dup)].join('、')}`, 'coverage.skipped');
  }
  const itemIds = items.map((it) => it && it.id);
  const both = skipped.filter((id) => itemIds.includes(id));
  if (both.length) {
    err(errors, 'CoverageMismatch', `同一 id 又判又跳：${both.join('、')}`, 'coverage.skipped');
  }
}

export function validateObservation(doc, { registeredIds, resolveEvidence = null } = {}) {
  const errors = [];
  const idsKnown = Array.isArray(registeredIds);
  if (!idsKnown) {
    err(errors, 'UnregisteredIdsMissing', '必须传入 registeredIds（本轮登记检查项 id 清单）', 'registeredIds');
  }
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    err(errors, 'InvalidDocument', '产物必须是对象');
    return { errors };
  }

  // round
  if (!Number.isInteger(doc.round) || doc.round < 1) {
    err(errors, 'InvalidFieldType', 'round 必须是 ≥1 的整数', 'round');
  }

  // instance 枚举（PRD §4.1）：只允许 null（单实例）/ 'A' / 'B'；缺省按 null 处理
  if (doc.instance !== undefined && doc.instance !== null && doc.instance !== 'A' && doc.instance !== 'B') {
    err(errors, 'InvalidFieldType', "instance 只能是 'A' / 'B' / null", 'instance');
  }

  // items
  if (!Array.isArray(doc.items) || doc.items.length === 0) {
    err(errors, 'MissingItems', 'items 必须是非空数组', 'items');
  } else {
    const seen = new Set();
    doc.items.forEach((it, i) => {
      const at = `items[${i}]`;
      if (!it || typeof it !== 'object') return err(errors, 'InvalidFieldType', 'item 必须是对象', at);
      if (idsKnown && !registeredIds.includes(it.id)) err(errors, 'UnknownItem', `未登记的检查项 ${it.id}`, `${at}.id`);
      if (seen.has(it.id)) err(errors, 'DuplicateItem', `检查项 id 重复：${it.id}`, `${at}.id`);
      seen.add(it.id);
      if (!VERDICTS.has(it.verdict)) err(errors, 'UnknownVerdict', 'verdict 只能是 hit/miss/na', `${at}.verdict`);
      if (it.verdict === 'hit') {
        if (it.evidence === undefined) err(errors, 'MissingEvidence', '判 hit 必须带 evidence', `${at}.evidence`);
        else checkEvidenceField(it.evidence, at, errors, resolveEvidence);
      }
      if ((it.verdict === 'miss' || it.verdict === 'na') && !String(it.reason ?? '').trim()) {
        err(errors, 'MissingReason', `判 ${it.verdict} 必须带 reason`, `${at}.reason`);
      }
    });
  }

  // open
  if (!Array.isArray(doc.open)) {
    err(errors, 'InvalidFieldType', 'open 必须是数组（可为空）', 'open');
  } else {
    doc.open.forEach((o, i) => {
      const at = `open[${i}]`;
      if (!o || typeof o !== 'object') return err(errors, 'InvalidFieldType', 'open 项必须是对象', at);
      for (const k of ['category', 'object', 'impact', 'suggestion']) {
        if (!String(o[k] ?? '').trim()) err(errors, 'MissingOpenField', `open 项缺 ${k}`, `${at}.${k}`);
      }
      if (o.evidence === undefined) err(errors, 'MissingOpenField', 'open 项缺 evidence', `${at}.evidence`);
      else checkEvidenceField(o.evidence, at, errors, resolveEvidence);
    });
  }

  // coverage：类型 / 值域（InvalidCoverage）+ 七条对账（CoverageMismatch）
  const c = doc.coverage;
  if (!c || typeof c !== 'object' || Array.isArray(c)) {
    err(errors, 'MissingCoverage', 'coverage 必须是对象', 'coverage');
  } else {
    if (!Number.isInteger(c.read) || c.read < 0) err(errors, 'InvalidCoverage', 'coverage.read 必须是非负整数', 'coverage.read');
    if (!Number.isInteger(c.total) || c.total < 1) err(errors, 'InvalidCoverage', 'coverage.total 必须是正整数', 'coverage.total');
    if (Number.isInteger(c.read) && Number.isInteger(c.total) && c.read > c.total) {
      err(errors, 'InvalidCoverage', 'coverage.read 不得大于 coverage.total', 'coverage');
    }
    if (!Array.isArray(c.skipped)) err(errors, 'InvalidCoverage', 'coverage.skipped 必须是数组', 'coverage.skipped');
    checkCoverageReconciliation(doc.items, c, registeredIds, errors);
  }

  // closure：与 open 条数做结构对账，不依赖词表
  if (!CLOSURES.has(doc.closure)) {
    err(errors, 'UnknownClosure', 'closure 只能是 null / "no-findings" / "blocked"', 'closure');
  } else if (Array.isArray(doc.open) && doc.open.length > 0 && doc.closure === 'no-findings') {
    err(errors, 'ContradictoryClosure', `open 有 ${doc.open.length} 条，closure 却声明 no-findings`, 'closure');
  }

  return { errors };
}

const V_LABEL = { hit: '命中', miss: '未命中', na: '不适用' };

// R-7 版本横幅（PRD §5.4）：渲染器升级时存量归档 md 才有版本声明
// 骨架常量统一在 md-format.mjs（校验侧判结构行也取同一份，避免两处漂移）

// 单元格转义：实现与 splitRow 同源（markdown-rows.mjs）——转义与切分是一对互逆口径，分开必漂移
const cell = escapeCell;

// 渲染最小信息集：hit 行必须含 path:line；open 行必须含 evidence 的 path 与 line
const refOf = (ev, withQuote) => {
  if (!ev || typeof ev !== 'object') return '—';
  const head = `${cell(ev.path)}:${ev.line ?? '?'}`;
  return withQuote && ev.quote ? `${head}「${cell(ev.quote)}」` : head;
};

export function renderObservation(doc) {
  const lines = [MD_BANNER, MD_TITLE, '', MD_ITEMS_HEADER, '|---|---|---|'];
  for (const it of doc.items ?? []) {
    const why = it.verdict === 'hit'
      ? refOf(it.evidence, true)
      : it.verdict === 'na' || it.verdict === 'miss'
        ? cell(it.reason)
        : '—';
    lines.push(`| ${cell(it.id)} | ${V_LABEL[it.verdict] ?? cell(it.verdict)} | ${why} |`);
  }
  lines.push('', MD_OPEN_SECTION, '');
  if (!doc.open || doc.open.length === 0) {
    lines.push(MD_NONE);
  } else {
    lines.push(MD_OPEN_HEADER, '|---|---|---|---|');
    for (const o of doc.open) {
      lines.push(`| ${cell(o.object)} | ${refOf(o.evidence, false)} | ${cell(o.impact)} | ${cell(o.suggestion)} |`);
    }
  }
  const c = doc.coverage ?? {};
  const skipped = c.skipped ?? [];
  lines.push('', `覆盖度：已判 ${c.read ?? '?'} 条 / 共 ${c.total ?? '?'} 条（跳过 ${skipped.length}：${skipped.map(cell).join('、') || '无'}）`);
  // 结论必须由 open 派生：open 为空却写「有补充项」是与事实相反的陈述（md 是唯一给人读的投影）
  const closureText = doc.closure === null || doc.closure === undefined
    ? (doc.open && doc.open.length ? '有补充项，无总体结论' : '无补充项，无总体结论')
    : cell(doc.closure);
  lines.push(`结论：${closureText}`);
  return lines.join('\n');
}

// 归一化：CRLF→LF、去行尾空白、去末尾空行。避免"换行风格不同"被误报
const normText = (s) =>
  String(s ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .join('\n')
    .trimEnd();

// 列数守卫（PRD §4.2③）：每块表格的每行列数必须等于本块表头列数，用同一 splitRow 复算。
// 为什么要独立于「全文一致」：两边都由同一渲染器产出时，转义再多错一处也会两边一致（自洽 ≠ 正确）。
// 表格行判定与围栏掩码都取 markdown-rows.mjs 的单源实现——与 check-all 的机械检查同口径，避免两套「什么算表格行」。
export function findBrokenTable(text) {
  const lines = String(text ?? '').split('\n');
  const { mask } = fenceMask(lines);
  let width = null;
  for (let i = 0; i < lines.length; i += 1) {
    if (mask[i] || !/^\s*\|/.test(lines[i])) { width = null; continue; }
    if (width === null) { width = splitRow(lines[i]).length; continue; }
    const got = splitRow(lines[i]).length;
    if (got !== width) return { line: i + 1, want: width, got };
  }
  return null;
}

// md 必须由 json 渲染得到：手改 md（而不改 json）→ RenderMismatch
export function checkRendered(doc, mdText) {
  const expected = normText(renderObservation(doc));
  const actual = normText(mdText);
  const broken = findBrokenTable(actual);
  if (broken) {
    return { ok: false, code: 'RenderMismatch', detail: `第 ${broken.line} 行列数 ${broken.got} ≠ 本块表头列数 ${broken.want}` };
  }
  if (expected === actual) return { ok: true };
  const a = expected.split('\n');
  const b = actual.split('\n');
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    if ((a[i] ?? '') !== (b[i] ?? '')) {
      return {
        ok: false,
        code: 'RenderMismatch',
        detail: `第 ${i + 1} 行不同：期望「${(a[i] ?? '<缺>').slice(0, 60)}」实际「${(b[i] ?? '<缺>').slice(0, 60)}」`,
      };
    }
  }
  return { ok: false, code: 'RenderMismatch', detail: '文本不同但未定位到行' };
}

// 前置条件：字段名与类型都要校验，未知字段不得静默当"可选"
export function checkPrerequisites(requires = [], providedIds = []) {
  const errors = [];
  const missing = [];
  requires.forEach((r, i) => {
    const at = `requires[${i}]`;
    // 异常纪律：非对象项（如 null / 字符串）必须收敛为码，不得抛 TypeError
    if (!r || typeof r !== 'object' || Array.isArray(r)) {
      err(errors, 'InvalidFieldType', 'requires 项必须是对象', at);
      return;
    }
    const unknown = Object.keys(r).filter((k) => !['id', 'must'].includes(k));
    if (unknown.length) err(errors, 'UnknownField', `未知字段：${unknown.join(', ')}`, at);
    if (typeof r.must !== 'boolean') err(errors, 'InvalidFieldType', 'must 必须是布尔值', `${at}.must`);
    if (r.must === true && !providedIds.includes(r.id)) missing.push(r.id);
  });
  return { ok: missing.length === 0 && errors.length === 0, missing, errors };
}
