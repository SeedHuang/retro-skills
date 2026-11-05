// carriers.mjs —— 「载体正文」数据（rule 正文的唯一真源）+ 渲染
// 为什么并进判据引擎：rule 正文与它的机判判据必须是**同一套 DSL / 同一目录**，否则两处可各自漂移。
// 文件族：carriers/<name>.json（正文数据，kind/name/criteria + 文案字段）；判据仍是 <id>.json（when/assert）。
// 关系：carrier 用 `criteria` 引用判据 id —— 引用必须存在，由 `scripts/check-criteria-engine.mjs` 断言。
// 渲染是通用的（不写死任何一条 rule）：新增 rule = 加一个 carrier json，代码零改动。
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
export const CARRIERS_DIR = join(DIR, 'carriers');
const REQUIRED = ['kind', 'name', 'title', 'trigger', 'source', 'obligation', 'stations', 'lookupFail', 'complexDerivation', 'exceptions'];

const stripBom = (t) => t.replace(/^\uFEFF/, '');

export function listCarriers() {
  if (!existsSync(CARRIERS_DIR)) return [];
  return readdirSync(CARRIERS_DIR)
    .filter((n) => n.endsWith('.json'))
    .map((n) => n.replace(/\.json$/, ''))
    .sort();
}

/** 结构校验（供 build / 门禁共用；不判语义） */
export function checkCarrier(carrier, file, errors, knownCriteria) {
  if (!carrier || typeof carrier !== 'object' || Array.isArray(carrier)) { errors.push(`${file}: 必须是对象`); return; }
  for (const k of REQUIRED) {
    const v = carrier[k];
    if (k === 'stations') {
      if (!Array.isArray(v) || v.length === 0) errors.push(`${file}: stations 必须是非空数组`);
      continue;
    }
    if (typeof v !== 'string' || v.trim() === '') errors.push(`${file}: 缺字段或为空 ${k}`);
  }
  if (!Array.isArray(carrier.criteria) || carrier.criteria.length === 0) {
    errors.push(`${file}: criteria 必须是非空数组（指向判据 id）`);
  } else if (knownCriteria) {
    for (const id of carrier.criteria) {
      if (!knownCriteria.has(id)) errors.push(`${file}: criteria 引用了不存在的判据 ${id}`);
    }
  }
}

export function ruleData(name) {
  const p = join(CARRIERS_DIR, `${name}.json`);
  if (!existsSync(p)) {
    const e = new Error(`MissingCarrier: carriers/${name}.json 不存在`);
    e.code = 'MissingCarrier';
    e.exitCode = 2;
    throw e;
  }
  const data = JSON.parse(stripBom(readFileSync(p, 'utf8')));
  const errors = [];
  checkCarrier(data, `carriers/${name}.json`, errors);
  if (data.name !== name) errors.push(`carriers/${name}.json: name=${JSON.stringify(data.name)} ≠ 文件名`);
  if (errors.length) {
    const e = new Error(`InvalidCarrier: ${errors.join('；')}`);
    e.code = 'InvalidCarrier';
    e.exitCode = 2;
    throw e;
  }
  return data;
}

/** 渲染 rule 正文（输出与已签文案逐字节一致；387 非空白字符） */
export function renderCarrier(name) {
  return renderCarrierData(ruleData(name));
}

/** 纯渲染（入参是已校验的 carrier 数据；校验器在 `--root` 临时根里必须用这一版） */
export function renderCarrierData(d) {
  return [
    `# ${d.title}`,
    '',
    `> 触发：${d.trigger}`,
    `> 来源：${d.source}`,
    '',
    `义务：${d.obligation}`,
    ...d.stations.map((s, i) => `${i + 1}. ${s}`),
    '',
    d.lookupFail,
    '',
    d.complexDerivation,
    '',
    d.exceptions,
    '',
  ].join('\n');
}
