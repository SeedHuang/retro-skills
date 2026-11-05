// renderRule —— rule 正文渲染器（与 agent 卡共用同一套「数据 → 渲染 → 逐字节比对」机制）
// 为什么要有这一份：rule 正文也必须是生成物（手改即红）。数据唯一真源 = `data/rules/<name>.json`；
// 本渲染器是通用的（不写死任何一条 rule），新增 rule = 加一个 json，代码零改动。
// 与 agent 侧的对称点：renderByName(席) ↔ renderRule(名)；两边的生成物都由 docgen gate 做 compareBuffers。
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const DATA_DIR = join(ROOT, 'tools', 'docgen', 'data', 'rules');

const stripBom = (t) => t.replace(/^\uFEFF/, '');

export function ruleData(name) {
  const p = join(DATA_DIR, `${name}.json`);
  if (!existsSync(p)) {
    const e = new Error(`MissingRuleData: data/rules/${name}.json 不存在`);
    e.code = 'MissingRuleData';
    e.exitCode = 2;
    throw e;
  }
  const data = JSON.parse(stripBom(readFileSync(p, 'utf8')));
  for (const k of ['title', 'trigger', 'source', 'obligation', 'stations', 'lookupFail', 'complexDerivation', 'exceptions']) {
    const v = data[k];
    if (k === 'stations' ? !Array.isArray(v) || v.length === 0 : typeof v !== 'string' || v.trim() === '') {
      const e = new Error(`InvalidRuleData: data/rules/${name}.json 缺字段或为空：${k}`);
      e.code = 'InvalidRuleData';
      e.exitCode = 2;
      throw e;
    }
  }
  if (data.name !== name) {
    const e = new Error(`InvalidRuleData: data/rules/${name}.json 的 name=${JSON.stringify(data.name)} ≠ 文件名`);
    e.code = 'InvalidRuleData';
    e.exitCode = 2;
    throw e;
  }
  return data;
}

/** 渲染 rule 正文；输出形状与手写稿逐字节一致（目录审计口径：`387` 非空白字符） */
export function renderRule(name) {
  const d = ruleData(name);
  const lines = [
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
  ];
  return lines.join('\n');
}

/** 写盘（只允许显式调用；gate 只比对不写） */
export function writeRule(name) {
  const p = join(ROOT, 'rules', `${name}.md`);
  writeFileSync(p, renderRule(name), 'utf8');
  return p;
}
