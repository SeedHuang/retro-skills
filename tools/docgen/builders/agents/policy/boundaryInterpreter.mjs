// 边界规则解释器（spec `2026-11-13-boundary-logic-interpreter-design.md` §4）。
// 纯函数：只依赖定义层 + 席位模型入参，不读盘、不 import 渲染层（保持 build 依赖方向）。
// 四类逻辑各一个入口：写判定 / 命令判定 / 检测可见性 / 越权处置义务；`boundaryFacts` 供渲染层取槽值。
import { boundaryRules } from './definitions/boundaryRules.mjs';
import { SEAT_POLICY } from './seat-policy.mjs';
import { writeScopes } from './definitions/writeScopes.mjs';
import * as PTH from './definitions/paths.mjs';
import * as CMD from './definitions/commands.mjs';
import * as SEATS from './definitions/seats.mjs';
import { isIgnored, matchesPattern } from '../components/ignoredPaths.mjs';

const hasOwn = (o, k) => Object.hasOwn(o, k);
// 配置侧一律 `Object.hasOwn`：`__proto__` / `constructor` 回落 `__default__`（与渲染层同口径）
const policyOf = (seat) => (hasOwn(SEAT_POLICY, seat) ? SEAT_POLICY[seat] : SEAT_POLICY.__default__);
const seatOf = (seat) => (hasOwn(SEATS.SEATS, seat) ? SEATS.SEATS[seat] : SEATS.SEATS.__default__);
const displayOf = (slug) => (hasOwn(SEATS.SEATS, slug) ? SEATS.SEATS[slug].display : SEATS.SEATS.__default__.display);
const code = (v) => `\`${v}\``;
const escapeRe = (s) => s.replace(/[.+^${}()|[\]\\]/g, '\\$&');
const fill = (form, vars) => form.replace(/\{([a-zA-Z][\w-]*)\}/g, (m, k) => (hasOwn(vars, k) ? String(vars[k]) : m));
const normPath = (p) => String(p ?? '').replace(/\\/g, '/').replace(/^\.\//, '');
// 中段 `**` 跨多级目录：`ignoredPaths.matchesPattern` 只认前导 `**/`，签字账模板
// `docs/devworkflows/**/gate-record.md` 需要跨级匹配（否则深层路径会落到默认拒绝、归因丢失）
const globSegmentRe = (seg) => (seg === '**' ? '.*' : escapeRe(seg).replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]'));
const matchesDeep = (rel, pattern) => new RegExp(`^${String(pattern).split('/').map(globSegmentRe).join('/')}$`).test(rel);
const verbsOf = (groups) => Object.values(groups).flatMap((g) => g.verbs);
const PATH_ITEM_TEXT = new Map(Object.values(PTH.pathGroups).flat().map((item) => [item.id, item.text]));
const STATE = new Map(boundaryRules.detection.states.map((s) => [s.id, s]));

function scopeOfSeat(seat) {
  const s = seatOf(seat);
  const id = hasOwn(s, 'writeScope') ? s.writeScope : 'review.ledger';
  if (typeof id !== 'string' || id === '' || !hasOwn(writeScopes, id)) return null;
  return writeScopes[id];
}

// 产物路径（`forms[].path`）→ 正则：`{session}` 等占位符视作单段任意名
const artifactRe = (p) => new RegExp(`^${String(p).split(/\{[^}]+\}/).map(escapeRe).join('[^/]+')}$`);
// 路径组成员只有「含 `/` 或 `*`」的 text 可直接匹配路径；其余是卡面标签（如「代码」），只能按组 id 判
const isPathLike = (text) => /[/\\*]/.test(text);
const excludedItems = (seat) => new Set(scopeOfSeat(seat)?.excludePathItems ?? []);

function artifactPaths(model) {
  const ids = model?.permissions?.write?.allow ?? [];
  const forms = model?.forms ?? {};
  return ids.map((id) => ({ id, path: forms[id]?.path })).filter((x) => typeof x.path === 'string' && x.path !== '');
}

/**
 * 写判定：席 + 路径（或组 id）→ 允许 / 拒绝。
 * 顺序：允许产物（显式放行，含 gitignore 例外）→ 禁写源 → .gitignore → 默认拒绝。
 */
export function decideWrite(seat, path, opts = {}) {
  const model = opts.model ?? null;
  const ignored = opts.ignored ?? isIgnored;
  const allowIds = model?.permissions?.write?.allow ?? [];
  const excluded = excludedItems(seat);

  if (opts.groupId) {
    const gid = opts.groupId;
    if (allowIds.includes(gid)) return { decision: 'allow', ruleId: `write.allow:${gid}`, reason: '席位模型允许的产物' };
    if (gid === 'signoff-ledger') return { decision: 'deny', ruleId: 'SIGNOFF_LEDGER', reason: '签字账全局禁写' };
    if (PATH_ITEM_TEXT.has(gid) && !excluded.has(gid)) return { decision: 'deny', ruleId: `pathGroups:${gid}`, reason: '命中禁写路径项' };
    return { decision: 'deny', ruleId: 'write.denyByDefault', reason: '不在允许落点内（默认拒绝）' };
  }

  const p = normPath(path);
  for (const a of artifactPaths(model)) {
    if (artifactRe(a.path).test(p)) return { decision: 'allow', ruleId: `write.allow:${a.id}`, reason: '席位模型允许的产物' };
  }
  for (const [group, items] of Object.entries(PTH.pathGroups)) {
    for (const item of items) {
      if (excluded.has(item.id) || !isPathLike(item.text)) continue;
      if (matchesPattern(p, item.text)) return { decision: 'deny', ruleId: `pathGroups:${group}:${item.id}`, reason: '命中禁写路径项' };
    }
  }
  if (matchesDeep(p, PTH.SIGNOFF_LEDGER.template)) {
    return { decision: 'deny', ruleId: 'SIGNOFF_LEDGER', reason: '签字账全局禁写' };
  }
  if (ignored(p)) return { decision: 'deny', ruleId: 'gitignore', reason: '.gitignore 兜底禁写' };
  return { decision: 'deny', ruleId: 'write.denyByDefault', reason: '不在允许落点内（默认拒绝）' };
}

// 命令组内 verb 的前缀口径：`scs ledger gate <目录>` 先截参数段
const verbPrefix = (v) => String(v).split(/\s+</)[0].trim();

/** 席位模型 `permissions.command.allow` → 允许组 ID（唯一实现；渲染层与测试都从这里取） */
export function commandGroupsOfModel(model) {
  const ids = model?.permissions?.command?.allow;
  if (!Array.isArray(ids)) return null;
  const forms = model?.forms ?? {};
  const hit = new Set();
  for (const id of ids) {
    const prefix = forms[id]?.prefix;
    if (typeof prefix !== 'string' || prefix === '') continue;
    for (const [g, def] of Object.entries(CMD.commandGroups)) {
      if ((def.verbs || []).some((v) => v === prefix || verbPrefix(v) === prefix)) hit.add(g);
    }
  }
  return Object.keys(CMD.commandGroups).filter((g) => hit.has(g));
}

function allowedVerbs(model) {
  return (commandGroupsOfModel(model) ?? []).flatMap((g) => CMD.commandGroups[g].verbs);
}

// git 子命令形态（`git [options] <verb>`）与单 token verb 对齐；多词 verb 仍按原文前缀
function matchesVerb(cmd, verb) {
  const c = String(cmd).trim();
  const v = String(verb).trim();
  if (c.startsWith(v)) return true;
  const m = c.match(/^git\s+(?:-[^\s]+\s+)*(.+)$/);
  if (!m) return false;
  const rest = m[1];
  return rest.startsWith(v) || (!v.includes(' ') && rest.split(/\s+/)[0] === v);
}

const longest = (hits) => hits.reduce((max, h) => Math.max(max, h.length), 0);

// 环境变量赋值五形态（与 forbiddenGroups['env.assign'] 的 purpose 对齐）
export function isEnvAssign(cmd) {
  const s = String(cmd).trim();
  return /^[A-Za-z_][A-Za-z0-9_]*=/.test(s)
    || /^export\s+[A-Za-z_][A-Za-z0-9_]*=/.test(s)
    || /^\$env:[A-Za-z_][A-Za-z0-9_]*=/i.test(s)
    || /^set\s+[A-Za-z_][A-Za-z0-9_]*=/i.test(s)
    || /^setx\s+/i.test(s);
}

/**
 * 命令判定：席 + 命令 → 允许 / 拒绝。
 * 顺序：env 赋值 → 禁止组 → 允许组；允许与禁止同时命中按最长前缀（同 `schema.mjs:44-55`）。
 */
export function decideCommand(seat, cmd, opts = {}) {
  const model = opts.model ?? null;
  if (isEnvAssign(cmd)) return { decision: 'deny', ruleId: 'forbiddenGroups:env.assign', matched: [] };

  // 禁止 verb 按组排除 env.assign（不按字面「含 =」过滤：`setx VAR …` 不含 =，也必须留在 env 分支）
  const denyVerbs = Object.entries(CMD.forbiddenGroups)
    .filter(([g]) => g !== boundaryRules.command.envGroup)
    .flatMap(([, def]) => def.verbs);
  const allowVerbs = model ? allowedVerbs(model) : [];
  const denyHits = denyVerbs.filter((v) => matchesVerb(cmd, v));
  const allowHits = allowVerbs.filter((v) => matchesVerb(cmd, v));

  if (denyHits.length === 0 && allowHits.length === 0) {
    return { decision: 'deny', ruleId: 'command.denyByDefault', matched: [] };
  }
  if (denyHits.length === 0) return { decision: 'allow', ruleId: 'command.allow', matched: allowHits };
  if (allowHits.length === 0) return { decision: 'deny', ruleId: 'forbiddenGroups', matched: denyHits };
  const allowed = longest(allowHits) > longest(denyHits);
  return { decision: allowed ? 'allow' : 'deny', ruleId: allowed ? 'command.allow:longestPrefix' : 'forbiddenGroups:longestPrefix', matched: allowed ? allowHits : denyHits };
}

/** 检测可见性：写场景状态 → `git status --porcelain` 是否可见（未知状态抛错，不静默放行） */
export function visibility(stateId) {
  const s = STATE.get(stateId);
  if (!s) {
    const e = new Error(`UnknownState: ${stateId}`);
    e.code = 'UnknownState';
    throw e;
  }
  return { visible: s.visible, reason: s.label };
}

function agentForbiddenVerbsOf(o) {
  const wanted = o.agentForbiddenVerbs ?? [];
  return verbsOf({ git: CMD.forbiddenGroups['git.write'] }).filter((v) => wanted.includes(v));
}

function obligationText(o, seat) {
  const forms = boundaryRules.escalation.forms;
  if (o.id === 'record') {
    return fill(forms.record, { fields: boundaryRules.escalation.recordFields.join(' + '), writer: seat ? escalationWriterOf(seat) : '' });
  }
  if (o.id === 'restore') return fill(forms.restore, { verbs: agentForbiddenVerbsOf(o).map(code).join(' / ') });
  return forms[o.id];
}

/** 越权处置义务：可复原 / 不可复原场景 → 适用义务清单（文本同卡面口径） */
export function escalationObligations({ recoverable, seat = null } = {}) {
  const applicable = boundaryRules.escalation.obligations.filter((o) => o.when === 'always'
    || (o.when === 'recoverable' && recoverable === true)
    || (o.when === 'unrecoverable' && recoverable === false));
  return { obligations: applicable.map((o) => ({ id: o.id, actor: o.actor, when: o.when, text: obligationText(o, seat) })) };
}

// 槽 10 同款：禁写集合指针句（排除项按本席写作用域追加）
function forbiddenPathsOf(seat) {
  const base = `${code('pathGroups')} 与 spec / plan 的写法项`;
  const exclusions = scopeOfSeat(seat)?.excludePathItems ?? [];
  if (exclusions.length === 0) return base;
  const texts = exclusions
    .map((id) => PATH_ITEM_TEXT.get(id))
    .filter((t) => typeof t === 'string' && t !== '')
    .map((t) => `「${t}」`)
    .join('、');
  return texts === '' ? base : `${base}（本席按写作用域排除${texts}）`;
}

// 槽 6 同款：越权者写谁的产物；未登记 = 空串，显式 null/undefined = 配置错（TemplateImpure）
function escalationWriterOf(seat) {
  const s = seatOf(seat);
  if (!hasOwn(s, 'escalationWriter')) return '';
  const ew = s.escalationWriter;
  if (ew === undefined || ew === null) {
    const e = new Error('TemplateImpure: ESCALATION_WRITER');
    e.code = 'TemplateImpure';
    throw e;
  }
  const d = displayOf(ew.slug);
  const a = code(ew.artifact);
  return ew.slug === seat ? `越权者即本席，写 ${a}。` : `交${d}在 ${a} 独立复算。`;
}

// 检测状态取值守卫：缺项 = 配置错，发 TemplateImpure 码（不在导入期抛无码 TypeError）
function stateLabel(id) {
  const s = STATE.get(id);
  if (!s) {
    const e = new Error(`TemplateImpure: DETECTION_LIMIT:${id}`);
    e.code = 'TemplateImpure';
    throw e;
  }
  return s.label;
}

/** 渲染层取用的四个槽值（模型可省略：patternRegistry 导入期无模型，标签走 fallback） */
export function boundaryFacts(seat, model = null) {
  const labelOf = (id) => model?.permissionGroups?.[id]?.label
    ?? boundaryRules.permissionLabelFallback[id]
    ?? id;
  const ACTION_FORBID = `${boundaryRules.fixedProhibitions.map((p) => fill(p.form, { label: labelOf(p.id) })).join('；')}。`;
  const WRITE_DEFAULT = fill(boundaryRules.write.form, { sources: forbiddenPathsOf(seat) });
  const ESCALATION_OBLIGATIONS = boundaryRules.escalation.obligations.map((o) => obligationText(o, seat)).join('\n');
  const DETECTION_LIMIT = fill(boundaryRules.detection.form, {
    ignored: stateLabel('ignored'),
    committed: stateLabel('committed'),
    restored: stateLabel('restored'),
  });
  return { ACTION_FORBID, WRITE_DEFAULT, ESCALATION_OBLIGATIONS, DETECTION_LIMIT };
}
