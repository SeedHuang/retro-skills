// 配置 / 模板校验（spec §3.5 九条不变量）：**五个 CLI 码的唯一发射点**（spec:161）。
// 由 `cli.mjs` 在 `gate` 与 `policy --dump` 两处调用；本模块只判、不写盘、不改任何数据。
// 归码优先级写死（spec:99）：**形态 → 存在性 → 禁止**——三条不重复报。
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as CAP from '../policy/definitions/capabilities.mjs';
import { tierOfCapabilities } from '../policy/definitions/tiers.mjs';
import * as CMD from '../policy/definitions/commands.mjs';
import * as ART from '../policy/definitions/artifacts.mjs';
import * as SEATS from '../policy/definitions/seats.mjs';
import { SEAT_POLICY } from '../policy/seat-policy.mjs';
import { SLOTS, assertTemplatePure, slotValues } from './renderBoundary.mjs';
import { toolsForSeat } from './patternRegistry.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
// 报文路径一律仓内 POSIX 相对路径（spec:197）：首行会被贴进日志与账本，禁绝对路径 / 盘符 / file://
const CFG_REL = 'tools/docgen/policy/seat-policy.mjs';
const CFG_PATH = join(HERE, '..', 'policy', 'seat-policy.mjs');
const TPL_REL = 'tools/docgen/templates/boundary.md.tpl';
const TPL_PATH = join(HERE, '..', 'templates', 'boundary.md.tpl');
const DEF_REL = 'tools/docgen/policy/definitions';
const DEF_DIR = join(HERE, '..', 'policy', 'definitions');
// 席 slug / 显示名允许出现的位置（spec §3.5 不变量 3）：`seats.mjs` 是显示名的唯一住处，故不扫；
// 其余五个定义文件的例外只有两处 —— `artifacts.owner`（归属）与席级组键名 `seat:<slug>.extra`
const DEF_FILES = ['capabilities.mjs', 'tiers.mjs', 'commands.mjs', 'paths.mjs', 'artifacts.mjs'];
const CONFIG_KEYS = ['capabilities', 'allowGroups', 'artifacts'];
const ID = /^[a-z][a-z0-9.:-]*$/;                    // = spec §3.4 归码谓词（与测试同一口径，不另造）
const SEAT_GROUP = /^seat:([a-z][a-z0-9-]*)\.extra$/;

const hasOwn = (o, k) => Object.hasOwn(o, k);
function fail(code, detail) {
  const e = new Error(`${code}: ${detail}`);
  e.code = code;
  throw e;
}
// 只剥注释：配置层若用注释藏路径 / 命令，仍需判红（与 testcase §0.3 的 `stripComments` 同口径）
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const lineOf = (src, needle) => {
  const i = src.indexOf(needle);
  return i < 0 ? 1 : src.slice(0, i).split('\n').length;
};
// 违规值所在行：先定位**席块**起点，再在块内找该值（同一字面量可能在多席重复出现，
// 全局 `indexOf` 会把它报成第一处，红点就指错了席）
const lineOfValue = (src, seat, value) => {
  const lines = src.split('\n');
  const start = lines.findIndex((l) => l.includes(`'${seat}'`));
  if (start < 0) return lineOf(src, String(value));
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^\s{2}'[^']+'\s*:/.test(lines[i]) || /^\s{2}__default__\s*:/.test(lines[i])) { end = i; break; }
  }
  const esc = String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const quoted = new RegExp("['\"`]" + esc + "['\"`]");
  for (let i = start; i < end; i += 1) if (quoted.test(lines[i])) return i + 1;
  return start + 1;
};

// closed-world 允许集（spec §3.7 / 不变量 2）：对象键（席 slug）与三键名不计入字面量，
// 但原始扫串会把键一起抓出来，故仍列入允许集；`__default__` 是保留键。
function allowedLiterals() {
  return new Set([
    ...Object.keys(CAP.capabilities),
    ...Object.keys(CMD.commandGroups),
    ...Object.keys(CMD.forbiddenGroups),
    ...Object.keys(CMD.seatGroups ?? {}),
    ...Object.keys(ART.artifacts),
    ...SEATS.SEAT_NAMES,
    // 三键名本身不计入字面量（spec §3.7 `spec:128`）：带引号的键是合法写法，不得判红
    ...CONFIG_KEYS,
    '__default__',
  ]);
}
// 全部引号字面量（单 / 双 / 反引号）及其行号：值里出现路径 / 命令时仍要能定位到行
function literalHits(src) {
  const out = [];
  stripComments(src).split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`\n]*)`/g)) {
      out.push({ value: m[1] ?? m[2] ?? m[3], line: i + 1 });
    }
  });
  return out;
}

export function validatePolicy() {
  const cfgSrc = readFileSync(CFG_PATH, 'utf8');
  const seats = Object.keys(SEAT_POLICY);
  const seatNames = SEATS.SEAT_NAMES;

  // ---- 不变量 1（席键面）：SEATS 必须含 SEAT_POLICY 的全部席键 + 保留键 `__default__`，且 display 非空 ----
  if (!hasOwn(SEAT_POLICY, '__default__') || !hasOwn(SEATS.SEATS, '__default__')) {
    fail('UnknownPolicyRef', '__default__:seat=__default__');
  }
  for (const seat of seats) {
    if (!hasOwn(SEATS.SEATS, seat)) fail('UnknownPolicyRef', `${seat}:seat=${seat}`);
    if (String(SEATS.SEATS[seat].display ?? '').trim() === '') fail('UnknownPolicyRef', `${seat}:seat=${seat}`);
  }

  // ---- 不变量 2（形态）/ 1（存在性）/ 4·5（禁止）：逐席逐键，归码优先级 = 形态 → 存在性 → 禁止 ----
  for (const seat of seats) {
    const p = SEAT_POLICY[seat];
    const keys = Object.keys(p);
    if (keys.length !== CONFIG_KEYS.length || CONFIG_KEYS.some((k) => !hasOwn(p, k))) {
      fail('LiteralInConfig', `${CFG_REL}:${lineOf(cfgSrc, `'${seat}'`)}`);
    }
    for (const key of CONFIG_KEYS) {
      const values = p[key];
      if (!Array.isArray(values)) fail('LiteralInConfig', `${CFG_REL}:${lineOf(cfgSrc, `'${seat}'`)}`);
      for (const v of values) {
        // 形态：必须是合法 ID（不是 → LiteralInConfig；形态对但未登记 → 下一条 UnknownPolicyRef）
        if (typeof v !== 'string' || !ID.test(v)) fail('LiteralInConfig', `${CFG_REL}:${lineOfValue(cfgSrc, seat, v)}`);
        if (key === 'capabilities') {
          if (!hasOwn(CAP.capabilities, v)) fail('UnknownPolicyRef', `${seat}:capability=${v}`);
        } else if (key === 'allowGroups') {
          // 存在性 = 定义层**登记过**即可（允许 ∪ 禁止 ∪ 席级）；「属禁止 / 越席」是下一关的归码，
          // 故已登记的禁止组必须先过存在性再报 `:forbidden`（B09：「不得先报 UnknownPolicyRef」）
          if (!hasOwn(CMD.commandGroups, v) && !hasOwn(CMD.forbiddenGroups, v) && !hasOwn(CMD.seatGroups ?? {}, v)) {
            fail('UnknownPolicyRef', `${seat}:group=${v}`);
          }
          if (hasOwn(CMD.forbiddenGroups, v)) fail('ForbiddenGroupGranted', `${seat}:${v}:forbidden`);
          const m = SEAT_GROUP.exec(v);
          if (m && m[1] !== seat) fail('ForbiddenGroupGranted', `${seat}:${v}:other-seat`);
        } else if (!hasOwn(ART.artifacts, v)) {
          fail('UnknownPolicyRef', `${seat}:artifact=${v}`);
        }
      }
    }
  }

  // ---- 不变量 2（closed-world 兜底）：三键之外的字符串字面量一律判红（含拼错 / 多出的键）----
  const allowed = allowedLiterals();
  for (const hit of literalHits(cfgSrc)) {
    if (!allowed.has(hit.value)) fail('LiteralInConfig', `${CFG_REL}:${hit.line}`);
  }

  // ---- 不变量 3：席 slug 不得作为**权限授予键**出现在定义层；显示名只许出现在 `seats.mjs` ----
  // 例外①（spec §3.5 #3）：`artifacts.owner` 是**归属**，值 ∈ `SEAT_NAMES ∪ {'host'}` 且 `'host'` 只配 `host: true`
  for (const def of Object.values(ART.artifacts)) {
    const owner = def?.owner;
    if (!seatNames.includes(owner) && owner !== 'host') fail('SeatNameInDefinition', `${DEF_REL}/artifacts.mjs`);
    if (owner === 'host' && def.host !== true) fail('SeatNameInDefinition', `${DEF_REL}/artifacts.mjs`);
  }
  for (const f of DEF_FILES) {
    const src = stripComments(readFileSync(join(DEF_DIR, f), 'utf8'));
    for (const slug of seatNames) {
      let i = src.indexOf(slug);
      while (i >= 0) {
        const ownerOk = f === 'artifacts.mjs' && /owner:\s*'$/.test(src.slice(0, i));
        const seatGroupOk = f === 'commands.mjs' && /seat:$/.test(src.slice(0, i))
          && src.startsWith('.extra', i + slug.length);
        if (!ownerOk && !seatGroupOk) fail('SeatNameInDefinition', `${DEF_REL}/${f}`);
        i = src.indexOf(slug, i + slug.length);
      }
    }
    for (const seat of Object.keys(SEATS.SEATS)) {
      if (src.includes(SEATS.SEATS[seat].display)) fail('SeatNameInDefinition', `${DEF_REL}/${f}`);
    }
  }

  // ---- 不变量 1（槽 6 引用面）：`escalationWriter` 的 `slug` / `artifact` 必须指到已登记项 ----
  // 缺这层时 `renderBoundary` 的 `displayOf` 会静默回落 `__default__.display`，卡面变成「默认席写 …」而无一码。
  for (const [slug, seat] of Object.entries(SEATS.SEATS)) {
    if (slug === '__default__' || !hasOwn(seat, 'escalationWriter')) continue;
    const ew = seat.escalationWriter;
    if (!ew || typeof ew !== 'object') fail('UnknownPolicyRef', `${slug}:escalationWriter=invalid`);
    if (!hasOwn(SEATS.SEATS, ew.slug) || !seatNames.includes(ew.slug)) {
      fail('UnknownPolicyRef', `${slug}:escalationWriter=${ew.slug ?? '(missing)'}`);
    }
    if (!hasOwn(ART.artifacts, ew.artifact)) {
      fail('UnknownPolicyRef', `${slug}:escalationWriter-artifact=${ew.artifact ?? '(missing)'}`);
    }
  }

  // ---- 不变量 8：席级组内容合法（方向② 撞禁止 → `:verb`；方向① 越出允许集 → `:not-allowed`）----
  // 撞禁止的判定：**已登记的允许 verb 直接放行**（否则 `draft`（生成）这类单 token 禁令会误伤
  // 允许组里的 `draft ls`、`node scripts/*` 等 8 条命令，token `node` 来自 `node -e`）；
  // 其余按「禁止 verb 的 token 序列」做**连续子序列**匹配——`git commit` 撞 `commit`、`x node -e y` 撞 `node -e`
  const allowVerbs = new Set(Object.values(CMD.commandGroups).flatMap((g) => g.verbs));
  const denySeqs = Object.values(CMD.forbiddenGroups).flatMap((g) => g.verbs)
    .map((v) => String(v).split(/\s+/).filter(Boolean));
  const containsSeq = (tokens, seq) => seq.length > 0
    && tokens.some((_, i) => seq.every((t, k) => tokens[i + k] === t));
  for (const [g, def] of Object.entries(CMD.seatGroups ?? {})) {
    const m = SEAT_GROUP.exec(g);
    if (!m || !seatNames.includes(m[1])) fail('SeatNameInDefinition', `${DEF_REL}/commands.mjs`);
    const verbs = Array.isArray(def?.verbs) ? def.verbs : [];
    for (const v of verbs) {
      if (allowVerbs.has(v)) continue;
      const tokens = String(v).split(/\s+/).filter(Boolean);
      if (denySeqs.some((seq) => containsSeq(tokens, seq))) {
        fail('ForbiddenGroupGranted', `${m[1]}:${g}:verb`);
      }
    }
    for (const v of verbs) if (!allowVerbs.has(v)) fail('ForbiddenGroupGranted', `${m[1]}:${g}:not-allowed`);
  }

  // ---- 不变量 6：模板违反 §3.4 纯度三条 / 白名单登记清单类成员 → TemplateImpure ----
  assertTemplatePure();

  // ---- 不变量 7：槽集恰合（模板槽集 = 渲染器消费的槽集 = §3.4 表的 12 个；每槽至少被引用一次）----
  const impure = (fragment) => {
    const e = new Error(`TemplateImpure: ${TPL_REL}:${fragment}`);
    e.code = 'TemplateImpure';
    throw e;
  };
  const tplSlots = new Set([...readFileSync(TPL_PATH, 'utf8').matchAll(/\{\{([A-Z_]+)\}\}/g)].map((m) => m[1]));
  for (const s of SLOTS) if (!tplSlots.has(s)) impure(s);
  for (const s of tplSlots) if (!SLOTS.includes(s)) impure(s);

  // ---- 不变量 9：`capabilities` 展开 ≡ `patternRegistry.toolsForSeat(席)`（同一事实的两处表达必须相等）----
  for (const seat of seats) {
    const caps = SEAT_POLICY[seat].capabilities;
    const derived = tierOfCapabilities(caps);
    const expanded = caps.flatMap((c) => CAP.capabilities[c]);
    if (!derived || expanded.join(',') !== toolsForSeat(seat).join(',')) {
      fail('UnknownPolicyRef', `${seat}:tier=${derived ?? 'unknown'}`);
    }
  }

  // 槽值守卫（spec:57 / spec:93）：逐席取值——显式 `undefined` / `null` → TemplateImpure（片段 = 槽名）；
  // 「缺省未声明」的可选槽走缺省分支，不在此报错。渲染器与 dump 共用同一套取值，故此处一遍即够。
  for (const seat of Object.keys(SEATS.SEATS)) slotValues(seat);
}
