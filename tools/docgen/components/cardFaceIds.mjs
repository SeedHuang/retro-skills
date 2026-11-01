// ── S2 卡面禁 id 守卫：`cardFaceIds(card, env) → string[]`（空数组 = 过） ─────────────────────
// 落点：本文件（`components/`）而**不是** `card-model/`（spec §3 #5 / §6-D19）——
// S1 §3 的依赖红线是「`card-model/**` 只 import `node:` 与自身」，本守卫的扫面 = 渲染文本，
// 必须 import 渲染器，故只能落在渲染链这一侧；`card-model/` 不得反向 import `components/`。
// 三层顺序钉死（spec §4 D3，层① 按行、层②③ 按 token）：
//   ① 按**行**排除「一定会」段末 5 行三态常量（逐行**全等** `TRISTATE` 才排除；正文行不整行豁免）
//   ② **先剔路径 span**（含 `/` / 全角 `／` 的连续串、`文件:行号` 形态）→ 再按 token 切
//      （切分集写死：`/`、全角 `／`、空白、`、，,`）→ 再剔「许」四类（产物字段名 / 工具名 / 真实路径 / 卡片字段中文名）
//   ③ 余下 token 命中任一即红：(a) `env` 六个登记集合键成员 (b) `REPEATS` 键 (c) `CHECK_KINDS` 键
//      (d) 点分 id 形态（点分小写、末段不是文件扩展名）
// **不判红**：`producer` / `S5-B`（PRD `:175` 明文不在本段扫描面，C-3 归 S6）与**裸词时刻 id**
// （`start` / `end` / `before` / `after` 在现盘 15 卡有 77 处合法渲染，纳入即全席误红 → spec §8 G-7 人工兜）
import { renderCard } from './renderCard.mjs';
import { ALLOWED_PRODUCT_NAMES, TRISTATE } from '../card-model/vocab/card-contract.mjs';
import { CARD_SEGMENTS } from '../card-model/vocab/card-must-fields.mjs';
import { ENV_KEYS, REPEATS, CHECK_KINDS } from '../card-model/enums.mjs';

const FACE_SPLIT = /[/／\s、，,]+/;
const PATH_SPAN_RE = /[^\s、，,]*(?:[/／]|:\d)[^\s、，,]*/g;
// (d) 点分 id 形态：≥1 个点的小写标识符（`a.b` / `a.b.c` 同判；末段是文件扩展名的不算，见 FILE_EXTS）
const DOTTED_ID_RE = /^[a-z][a-z0-9:-]*(?:\.[a-z][a-z0-9:-]+)+$/;
const FILE_EXTS = new Set(['md', 'mjs', 'json', 'yml', 'yaml']);
// 禁集来源 = `env` 的六个登记集合键（spec §6 D15 的 (a)）。这六个是 **spec 点名**的子集，
// 不能按「值是 Set / Object」从 `ENV_KEYS` 猜——`available` / `unboundVars` / `parliamentSeats` 也是 Set、
// `subjects` 也是对象，但 D15 明写它们不进 (a)。键名仍须 ⊆ `ENV_KEYS`，漂移即 import 期抛。
const ENV_SET_KEYS = ['registeredIds', 'predicates', 'landings', 'sharedScenes', 'seatScenes', 'seatSignals'];
for (const k of ENV_SET_KEYS) {
  if (!ENV_KEYS.includes(k)) throw new Error(`FaceEnvKeyDrift：${k} 不在 enums.mjs 的 ENV_KEYS 里（spec §6-D15 (a) 的键名已漂移）`);
}

// 六个集合键统一摊平成 token 集：Set 直接取成员，对象（场景 / 客席登记）取键名
function envRegisteredIds(env) {
  const e = env !== null && typeof env === 'object' ? env : {};
  const out = new Set();
  for (const k of ENV_SET_KEYS) {
    const v = e[k];
    if (v && typeof v.has === 'function') { for (const x of v) out.add(x); continue; }
    if (v !== null && typeof v === 'object') for (const x of Object.keys(v)) out.add(x);
  }
  return out;
}

// 「许」：产物字段名（`ALLOWED_PRODUCT_NAMES`，单源）+ 工具名（本卡 `tools`，派生）+ 卡片七字段中文名（`CARD_SEGMENTS`）
function allowedFaceTokens(card) {
  const out = new Set([...ALLOWED_PRODUCT_NAMES, ...CARD_SEGMENTS.map(String)]);
  for (const t of Array.isArray(card && card.tools) ? card.tools : []) out.add(String(t));
  return out;
}

export function cardFaceIds(card, env) {
  const text = renderCard(card, env);
  const banned = envRegisteredIds(env);
  const allowed = allowedFaceTokens(card);
  const tristate = new Set(TRISTATE.map((x) => String(x).trim()));
  const hits = [];
  const seen = new Set();
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (line === '') continue;
    if (tristate.has(line)) continue; // 层①：只排三态常量行本身（整行全等；不按段定位——段名改名会让豁免静默失效）
    for (const tok of line.replace(PATH_SPAN_RE, ' ').split(FACE_SPLIT)) {
      // token 归一化：剥掉首尾的非标识符字符（`标签：值` 的中文标签与句末标点都黏在 token 两侧，
      // 切分集本身不变——不剥就永远命中不到「动作：shared.foo」这类带标签的 id；**尾部的点也剥掉**，
      // 否则英文句末的 `shared.foo.` 会因尾点保留而漏判）
      const t = tok.trim().replace(/^[^A-Za-z0-9]+/, '').replace(/[^A-Za-z0-9]+$/, '');
      if (t === '' || allowed.has(t)) continue; // 层②：许四类先剔
      const hit = banned.has(t)
        || Object.prototype.hasOwnProperty.call(REPEATS, t)
        || Object.prototype.hasOwnProperty.call(CHECK_KINDS, t)
        || (DOTTED_ID_RE.test(t) && !FILE_EXTS.has(t.split('.').pop()));
      if (!hit || seen.has(t)) continue;
      seen.add(t);
      hits.push(t);
    }
  }
  return hits;
}
