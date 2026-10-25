// 渲染层（spec §3.4）：槽集 12 个，顺序 = §3.4 表行序（= `dump.expanded` 的索引口径）。
// 依赖方向写死（spec:120）：只 import 定义层 + 配置层，**不得**反向 import `patternRegistry`（否则初始化环）。
// 替换机制 = **单趟** `tpl.replace(/…/g, …)`：槽值不参与二次扫描、不解释 `$&` / `$'` / `$$`。
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as CAP from '../policy/definitions/capabilities.mjs';
import { tierOfCapabilities } from '../policy/definitions/tiers.mjs';
import * as CMD from '../policy/definitions/commands.mjs';
import * as PTH from '../policy/definitions/paths.mjs';
import * as ART from '../policy/definitions/artifacts.mjs';
import * as SEATS from '../policy/definitions/seats.mjs';
import { SEAT_POLICY } from '../policy/seat-policy.mjs';

const TPL_REL = 'tools/docgen/templates/boundary.md.tpl';
const TPL_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'boundary.md.tpl');
// 导入期读取（spec:195）：读取失败 = 未捕获异常，不承诺任何错误码 / 退出码；换行统一 `\n`、去掉末尾空行
const TPL = readFileSync(TPL_PATH, 'utf8').replace(/\r\n/g, '\n').replace(/\n+$/, '');

// 12 槽，顺序 = spec §3.4 表行序（不是卡面首次出现顺序）
export const SLOTS = ['SEAT', 'TIER', 'CAPABILITIES', 'ARTIFACTS', 'SEAT_CLAUSE', 'ESCALATION_WRITER',
  'ALLOW_GROUPS', 'DENY_GROUPS', 'ENV_FORMS', 'FORBIDDEN_PATHS', 'DETECTION_PATHS', 'DETECTION_CMD'];

// 结构性文本白名单（§3.4 纯度规则 3）：只登记**非清单类**成员；登记清单类成员本身即违规（不变量 6）
export const TEMPLATE_ALLOWED_LITERALS = new Set([
  '.session/reviews/<本次>/',
  'docs/superpowers/reviews/<本次>/',
  'skills/dev-workflow/references/gate-record.md',
  '.gitignore',
  'DOCGEN_*',
  'sha256',
  '检测限度',
  '越权清单',
]);

// `spec / plan` 的**卡面形态**（§3.4 槽 10）：`paths.mjs` 只以正则表达（`spec/plan` 无空格写法也要命中），
// 卡面这一项取标签形态、紧跟 `docs.prd/` 之后（与改造前两卡顺序一致）
const SPEC_PLAN_LABEL = 'spec / plan';

function impure(fragment) {
  const e = new Error(`TemplateImpure: ${TPL_REL}:${fragment}`);
  e.code = 'TemplateImpure';
  e.fragment = fragment;
  throw e;
}

const hasOwn = (o, k) => Object.hasOwn(o, k);
// 读配置侧一律 `Object.hasOwn`（spec:131）：`__proto__` / `constructor` 回落 `__default__`
const policyOf = (seat) => (hasOwn(SEAT_POLICY, seat) ? SEAT_POLICY[seat] : SEAT_POLICY.__default__);
const seatOf = (seat) => (hasOwn(SEATS.SEATS, seat) ? SEATS.SEATS[seat] : SEATS.SEATS.__default__);
const displayOf = (slug) => (hasOwn(SEATS.SEATS, slug) ? SEATS.SEATS[slug].display : SEATS.SEATS.__default__.display);
const code = (v) => `\`${v}\``;

// 渲染是**全函数**（spec：不校验、不抛错）：未登记的 capability / 组一律按原样渲染，
// 非法配置由 `validatePolicy` 统一发码（不变量在此处不判，否则导入期渲染先崩、五码发不出来）
function capTools(caps) {
  const out = [];
  for (const c of Array.isArray(caps) ? caps : []) {
    if (!hasOwn(CAP.capabilities, c)) { out.push(code(c)); continue; }
    out.push(...CAP.capabilities[c]);
  }
  return out;
}

function allowGroups(groups) {
  return groups.map((g) => {
    // 已登记全局组 → 展开其 verbs；未登记的组（含席级组）→ 原样渲染组 ID，不判红
    const def = hasOwn(CMD.commandGroups, g) ? CMD.commandGroups[g] : undefined;
    return def ? def.verbs.map(code).join(' / ') : code(g);
  }).join('；');
}

// 禁止组间 `、`、组内 ` / `；**剔除 `env.assign`**（由槽 9 `{{ENV_FORMS}}` 单独注入，§3.4 槽 8/9）
function denyGroups() {
  return Object.entries(CMD.forbiddenGroups)
    .filter(([g]) => g !== 'env.assign')
    .map(([, def]) => def.verbs.map(code).join(' / '))
    .join('、');
}

// 槽 9 的值 = `commands['env.assign'].verbs` 原样 ` / ` 连接（不加反引号：与 `factsFromDump` / F02 同口径）
function envForms() {
  return CMD.forbiddenGroups['env.assign'].verbs.join(' / ');
}

// 槽 10 = `pathGroups` 六组按定义层顺序展开（`、` 连接；`代码、测试` 在卡面写作两项），
// `spec / plan` 紧跟 `docs.prd/` 之后（与改造前两卡顺序一致）
function forbiddenPaths() {
  const items = Object.values(PTH.pathGroups).flat().flatMap((x) => x.split('、'));
  const anchor = PTH.pathGroups['docs.input'].at(-1);
  const i = items.indexOf(anchor);
  return (i < 0 ? [...items, SPEC_PLAN_LABEL] : [...items.slice(0, i + 1), SPEC_PLAN_LABEL, ...items.slice(i + 1)])
    .map(code).join('、');
}

function detectionPaths() {
  return PTH.DETECTION_BLIND_SPOTS.map(code).join(' / ');
}

// 槽 12 = `commands['git.read'].verbs` 的 status 项（只读引用，不复制）
function detectionCmd() {
  const v = CMD.commandGroups['git.read'].verbs.find((x) => /status/.test(x));
  if (!v) impure('DETECTION_CMD:missing');
  return v;
}

// 槽值来源守卫（spec:57 / spec:93）：先 `Object.hasOwn` 判**是否登记**——
// **登记且值为 `undefined` / `null` → `TemplateImpure`（片段 = 槽名）**；只有未登记才取缺省。
// 「缺省未声明」（可选槽，渲染空串）≠「显式传 undefined」（配置错），`??` 会把两者抹平，故不用 `??`。
function slotSource(obj, key, slot, fallback) {
  if (!hasOwn(obj, key)) return fallback;
  const v = obj[key];
  if (v === undefined || v === null) impure(slot);
  return v;
}

// 槽 6 两形态（spec:85）：本席自写 = `<display>写 <artifact>`；他席写 = `交<display>在 <artifact> 独立复算`
function escalationWriter(seat) {
  // 未登记 → 可选槽「缺省未声明」→ 空串（显式 `undefined` / `null` 已在 slotSource 里判 TemplateImpure）
  const ew = slotSource(seatOf(seat), 'escalationWriter', 'ESCALATION_WRITER', undefined);
  if (ew === undefined) return '';
  const d = displayOf(ew.slug);
  const a = code(ew.artifact);
  return ew.slug === seat ? `${d}写 ${a}` : `交${d}在 ${a} 独立复算`;
}

// 12 槽值（键 = 槽名）。值必须全是字符串：`undefined` / `null` → `TemplateImpure`（片段 = 槽名）
export function slotValues(seat) {
  const p = policyOf(seat);
  const s = seatOf(seat);
  const rawCaps = slotSource(p, 'capabilities', 'CAPABILITIES', []);
  // 配置侧形态非法（非数组 / 凑不出档）不在渲染层判红：TIER 退成空串，由 `validatePolicy` 发 `LiteralInConfig`
  // / `UnknownPolicyRef`；否则 `patternRegistry` 在导入期就会抛 `TemplateImpure`，把配置错误指到模板上
  const caps = Array.isArray(rawCaps) ? rawCaps : [];
  const values = {
    SEAT: s.display,
    TIER: tierOfCapabilities(caps) ?? '',
    CAPABILITIES: capTools(caps).join(' / '),
    ARTIFACTS: slotSource(p, 'artifacts', 'ARTIFACTS', []).map(code).join('、'),
    SEAT_CLAUSE: slotSource(s, 'clause', 'SEAT_CLAUSE', ''),
    ESCALATION_WRITER: escalationWriter(seat),
    ALLOW_GROUPS: allowGroups(slotSource(p, 'allowGroups', 'ALLOW_GROUPS', [])),
    DENY_GROUPS: denyGroups(),
    ENV_FORMS: envForms(),
    FORBIDDEN_PATHS: forbiddenPaths(),
    DETECTION_PATHS: detectionPaths(),
    DETECTION_CMD: detectionCmd(),
  };
  for (const k of SLOTS) if (values[k] === undefined || values[k] === null) impure(k);
  return values;
}

// ---- 纯度三条守卫（§3.4：清单类 / 单点类分治；判定粒度 = 整项相等，去反引号与首尾空白）----
const verbsOf = (groups) => Object.values(groups).flatMap((g) => g.verbs);
// 清单类：组 ID + 多词 verb + 路径组成员（含 `spec / plan` 卡面形态）+ 检测盲区
// （`DETECTION_BLIND_SPOTS` 是独立导出的清单，裸写 `.session/` 同样是「把清单抄进模板」；
//   判定粒度 = 整项相等，故白名单里的 `.session/reviews/<本次>/` 不会被误伤）
function listClassMembers() {
  const ids = [...Object.keys(CAP.capabilities), ...Object.keys(CMD.commandGroups),
    ...Object.keys(CMD.forbiddenGroups), ...Object.keys(PTH.pathGroups)];
  const multiWordVerbs = [...verbsOf(CMD.commandGroups), ...verbsOf(CMD.forbiddenGroups)].filter((v) => /\s/.test(v));
  const paths = [...Object.values(PTH.pathGroups).flat().flatMap((x) => x.split('、')),
    ...PTH.DETECTION_BLIND_SPOTS, SPEC_PLAN_LABEL];
  return new Set([...ids, ...multiWordVerbs, ...paths]);
}
// 单点类：单 token flag / 单个词 verb / 产物名 —— 允许留在模板，但必须 ∈ 定义层对应集合
function singlePointMembers() {
  const singleVerbs = [...verbsOf(CMD.commandGroups), ...verbsOf(CMD.forbiddenGroups)].filter((v) => !/\s/.test(v));
  return new Set([...singleVerbs, ...Object.keys(ART.artifacts)]);
}

export function assertTemplatePure(tpl = TPL) {
  // 槽位先换成哨兵：槽名本身不是模板文本，且防跨槽把两段文本粘成一项
  const masked = tpl.replace(/\{\{[A-Z_]+\}\}/g, '\u0000');
  const spans = [...masked.matchAll(/`([^`\n]+)`/g)]
    .map((m) => m[1].trim()).filter((s) => s && s !== '\u0000');
  const plain = masked.replace(/`[^`\n]*`/g, '\u0000')
    .split(/[\s、，；：。！？*（）「」【】→—|]+/)
    .map((s) => s.trim()).filter(Boolean);
  const listClass = listClassMembers();
  const singlePoint = singlePointMembers();

  // 规则 1：清单类成员不得整项出现在模板（整项相等）
  for (const item of [...spans, ...plain]) if (listClass.has(item)) impure(item);
  // 规则 1（多词 verb 的兜底）：多词命令是一句话，出现在散文里同样是「清单被复制」
  for (const v of listClass) if (/\s/.test(v) && masked.includes(v)) impure(v);
  // 规则 2 + 3：每个反引号项要么 ∈ 单点类定义层集合，要么已登记为结构性文本
  for (const s of spans) if (!singlePoint.has(s) && !TEMPLATE_ALLOWED_LITERALS.has(s)) impure(s);
  // 白名单不得登记清单类成员（不变量 6 后半）
  for (const w of TEMPLATE_ALLOWED_LITERALS) if (listClass.has(w)) impure(`ALLOWED_LITERALS:${w}`);
}

export function renderBoundary(seat) {
  // 模板纯度**不在此校验**：唯一发射点是 `validatePolicy`（它已调 `assertTemplatePure`），
  // 否则本函数在 `patternRegistry` 导入期被调用，模板非法会先崩、CLI 发不出 `TemplateImpure` 码
  const values = slotValues(seat);
  return TPL.replace(/\{\{([A-Z_]+)\}\}/g, (_, k) => {
    if (!Object.hasOwn(values, k)) impure(k);     // 未声明槽不得静默保留（C07）
    return values[k];
  });
}
