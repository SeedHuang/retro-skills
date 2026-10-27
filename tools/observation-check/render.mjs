// 一份数据 → 两个投影：卡面（句子，给 AI）/ README（表格 + 覆盖记录，给人）
import { pathToFileURL } from 'node:url';
import { escapeCell } from '../execution-matrix/markdown-rows.mjs';
import { SHARED_ACTIONS, SEATS, PREDICATES, LANDINGS } from './data.mjs';

// 表格单元格与 checks.mjs 同源（转义必须与 splitRow 互逆，见 markdown-rows.mjs）
const cell = escapeCell;
// 散文行（卡面 bullet / 职责句）只需压掉换行：表格外竖线不切列，转义反而会把反斜杠显示出来
const oneLine = (s) => String(s ?? '').replace(/\r\n|\r|\n/g, ' ');

const CODE = {
  MissingTrigger: '缺少触发条件',
  MissingCriterion: '缺少判据',
  MissingLanding: '缺少落点',
  MissingCriterionImpl: '判据 id 未登记（散文兜底不允许）',
  UnknownLanding: '落点 id 未登记',
  DuplicateStatement: '同一层内 id 重复',
  OverrideWithoutReason: '覆盖没写理由',
  PointlessOverride: '覆盖后与原条完全一致',
};

function bad(code, detail) {
  const e = new Error(`${code}: ${CODE[code]}（${detail}）`);
  e.code = code;
  throw e;
}

// 合并：跨层同 id = 覆盖；同层重复 = 报错；覆盖必须带 reason 且必须有差异
export function personalActions(seat) {
  const shared = SHARED_ACTIONS.filter((a) => seat.use.includes(a.id)).map((a) => ({ ...a, scope: '共用' }));
  const seen = new Set();
  const overrides = [];
  const own = seat.own.map((a) => {
    if (seen.has(a.id)) bad('DuplicateStatement', a.id);
    seen.add(a.id);
    const base = shared.find((s) => s.id === a.id);
    if (!base) return { ...a, scope: '本席' };
    if (!a.reason) bad('OverrideWithoutReason', a.id);
    const changed = ['trigger', 'text', 'criterion', 'landing'].filter((k) => a[k] !== undefined && a[k] !== base[k]);
    if (changed.length === 0) bad('PointlessOverride', a.id);
    overrides.push({ id: a.id, base, changed, reason: a.reason });
    return { ...a, scope: '本席覆盖', changed };
  });
  const ownIds = new Set(own.map((a) => a.id));
  return { actions: [...shared.filter((s) => !ownIds.has(s.id)), ...own], overrides };
}

const labelOf = (a) => {
  if (!a.trigger) bad('MissingTrigger', a.id);
  if (!a.criterion) bad('MissingCriterion', a.id);
  if (!a.landing) bad('MissingLanding', a.id);
  const c = PREDICATES[a.criterion];
  if (!c) bad('MissingCriterionImpl', `${a.id}: criterion=${a.criterion}`);
  const l = LANDINGS[a.landing];
  if (!l) bad('UnknownLanding', `${a.id}: landing=${a.landing}`);
  return { c, l };
};

const BANNER = (src) => `> 本文件由 \`${src}\` 生成，请改数据源，勿手改。\n`;

const dutyLine = (seat) => {
  const { trigger, categories, action, constraint } = seat.duty;
  return `${oneLine(trigger)}：对「${categories.map(oneLine).join('、')}」共 ${categories.length} 类${oneLine(action)}；${oneLine(constraint)}。`;
};

export function renderCard(seat) {
  const { actions } = personalActions(seat);
  const must = actions.filter((a) => a.kind === 'must');
  const never = actions.filter((a) => a.kind === 'never');
  const conflict = must.filter((a) => a.trigger === '遇意见冲突');
  const lines = [
    BANNER('policy/actions/seat/' + seat.name + '.mjs'),
    `# 角色：${seat.name}`,
    '',
    '## 职责',
    dutyLine(seat),
    '',
    '## 一定会（缺一条 = 不合格）',
    ...must.filter((a) => !conflict.includes(a)).map((a) => {
      const { c } = labelOf(a);
      return `- ${oneLine(a.trigger)}：${oneLine(a.text)}。（判定：${c}）`;
    }),
    '',
    '## 禁止',
    ...never.map((a) => {
      labelOf(a);
      return `- ${oneLine(a.trigger)}，不得${oneLine(a.text)}。`;
    }),
    '',
    '## 冲突裁决',
    ...conflict.map((a) => {
      labelOf(a);
      return `- ${oneLine(a.text)}`;
    }),
    '',
    '## 边界',
    `档位：${seat.permissions.tier}；可写产物：${seat.permissions.artifacts.join('、')}；允许组：${seat.permissions.allowGroups.join('、')}。（demo 从简）`,
    '',
  ];
  return lines.join('\n');
}

export function renderReadme(seat) {
  const { actions, overrides } = personalActions(seat);
  const rows = actions.map((a) => {
    const { c, l } = labelOf(a);
    const src = a.scope === '本席覆盖' ? `**本席覆盖**（改动：${a.changed.join('、')}）` : a.scope;
    return `| ${cell(a.id)} | ${a.kind === 'must' ? '一定会' : '禁止'} | ${cell(a.trigger)} | ${cell(a.text)} | ${cell(c)}（\`${cell(a.criterion)}\`） | ${cell(l)}（\`${cell(a.landing)}\`） | ${cell(src)} |`;
  });
  const ov = overrides.length
    ? [
        '',
        '## 覆盖记录',
        '',
        '| 编号 | 原条落点 | 本席落点 | 改动字段 | 理由 |',
        '|---|---|---|---|---|',
        ...overrides.map((o) => `| ${cell(o.id)} | ${cell(LANDINGS[o.base.landing] ?? o.base.landing)} | ${cell(LANDINGS[actions.find((a) => a.id === o.id).landing])} | ${cell(o.changed.join('、'))} | ${cell(o.reason)} |`),
      ]
    : [];
  return [
    BANNER('policy/actions/seat/' + seat.name + '.mjs'),
    `# ${seat.name} · 动作清单`,
    '',
    dutyLine(seat),
    '',
    '| 编号 | 类型 | 触发 | 动作 | 判定 | 落点 | 来源 |',
    '|---|---|---|---|---|---|---|',
    ...rows,
    ...ov,
    '',
  ].join('\n');
}

// demo：只在直接执行本文件时打印（import 时不产生噪声）
const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  for (const seat of SEATS) {
    console.log('================ 卡面（给 AI）================');
    console.log(renderCard(seat));
    console.log('================ README（给人）================');
    console.log(renderReadme(seat));
  }
}
