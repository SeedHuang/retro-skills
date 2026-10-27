// 结构化产物校验 + 渲染：机器校验 JSON，markdown 只是视图
// 这样"代码块藏字段/全角竖线/标题变体/结论换说法"这类绕过在结构上不再可能
import { checkEvidence } from './evidence.mjs';

const VERDICTS = new Set(['hit', 'miss', 'na']);
const CLOSURES = new Set([null, 'no-findings', 'blocked']);

function err(list, code, message, field) {
  list.push({ code, message, field });
}

// 结构化 evidence：{ path, line, quote }。给了 resolver 才做"可解析"校验（需要读盘）
function checkEvidenceField(ev, at, errors, resolveEvidence) {
  if (!ev || typeof ev !== 'object' || Array.isArray(ev)) {
    err(errors, 'InvalidFieldType', 'evidence 必须是 { path, line, quote }', `${at}.evidence`);
    return;
  }
  if (resolveEvidence) {
    const r = checkEvidence(ev, resolveEvidence);
    if (!r.ok) err(errors, r.code, r.detail, `${at}.evidence`);
    return;
  }
  if (typeof ev.path !== 'string' || !Number.isInteger(ev.line) || typeof ev.quote !== 'string') {
    err(errors, 'InvalidFieldType', 'evidence 结构必须为 { path, line, quote }', `${at}.evidence`);
  }
}

export function validateObservation(doc, { registeredIds = [], resolveEvidence = null } = {}) {
  const errors = [];
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    err(errors, 'InvalidDocument', '产物必须是对象');
    return { errors };
  }

  // round
  if (!Number.isInteger(doc.round) || doc.round < 1) {
    err(errors, 'InvalidFieldType', 'round 必须是 ≥1 的整数', 'round');
  }

  // items
  if (!Array.isArray(doc.items) || doc.items.length === 0) {
    err(errors, 'MissingItems', 'items 必须是非空数组', 'items');
  } else {
    doc.items.forEach((it, i) => {
      const at = `items[${i}]`;
      if (!it || typeof it !== 'object') return err(errors, 'InvalidFieldType', 'item 必须是对象', at);
      if (!registeredIds.includes(it.id)) err(errors, 'UnknownItem', `未登记的检查项 ${it.id}`, `${at}.id`);
      if (!VERDICTS.has(it.verdict)) err(errors, 'UnknownVerdict', `verdict 只能是 hit/miss/na`, `${at}.verdict`);
      if (it.verdict === 'hit') checkEvidenceField(it.evidence, at, errors, resolveEvidence);
      if (it.verdict === 'na' && !String(it.reason ?? '').trim()) {
        err(errors, 'MissingReason', '判 na 必须带 reason', `${at}.reason`);
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
      for (const k of ['object', 'impact', 'suggestion']) {
        if (!String(o[k] ?? '').trim()) err(errors, 'MissingOpenField', `open 项缺 ${k}`, `${at}.${k}`);
      }
      checkEvidenceField(o.evidence, at, errors, resolveEvidence);
    });
  }

  // coverage
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

// 归一化：CRLF→LF、去行尾空白、去末尾空行。避免"换行风格不同"被误报
const normText = (s) =>
  String(s ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .join('\n')
    .trimEnd();

// md 必须由 json 渲染得到：手改 md（而不改 json）→ RenderMismatch
export function checkRendered(doc, mdText) {
  const expected = normText(renderObservation(doc));
  const actual = normText(mdText);
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

export function renderObservation(doc) {
  const lines = ['# 观察表', ''];
  lines.push('| 编号 | 结论 | 依据/理由 |', '|---|---|---|');
  for (const it of doc.items ?? []) {
    const why = it.verdict === 'hit' ? it.evidence : it.verdict === 'na' ? it.reason : (it.reason ?? '—');
    lines.push(`| ${it.id} | ${V_LABEL[it.verdict] ?? it.verdict} | ${why ?? '—'} |`);
  }
  lines.push('', '## 补充项', '');
  if (!doc.open || doc.open.length === 0) {
    lines.push('无。');
  } else {
    lines.push('| 对象 | 依据 | 影响 | 建议 |', '|---|---|---|---|');
    for (const o of doc.open) lines.push(`| ${o.object} | ${o.evidence} | ${o.impact} | ${o.suggestion} |`);
  }
  const c = doc.coverage ?? {};
  lines.push('', `覆盖度：读 ${c.read ?? '?'} 部分 / 共 ${c.total ?? '?'} 部分；跳过 ${(c.skipped ?? []).length}（${(c.skipped ?? []).join('、') || '无'}）`);
  lines.push(`结论：${doc.closure === null || doc.closure === undefined ? '有补充项，无总体结论' : doc.closure}`);
  return lines.join('\n');
}

// 前置条件：字段名与类型都要校验，未知字段不得静默当"可选"
export function checkPrerequisites(requires = [], providedIds = []) {
  const errors = [];
  const missing = [];
  requires.forEach((r, i) => {
    const at = `requires[${i}]`;
    const unknown = Object.keys(r).filter((k) => !['id', 'must'].includes(k));
    if (unknown.length) err(errors, 'UnknownField', `未知字段：${unknown.join(', ')}`, at);
    if (typeof r.must !== 'boolean') err(errors, 'InvalidFieldType', 'must 必须是布尔值', `${at}.must`);
    if (r.must === true && !providedIds.includes(r.id)) missing.push(r.id);
  });
  return { ok: missing.length === 0 && errors.length === 0, missing, errors };
}
