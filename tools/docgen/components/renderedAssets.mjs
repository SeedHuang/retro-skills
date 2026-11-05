// renderedAssets —— 「渲染物」注册表：agent 卡与 rule 正文共用同一套「数据 → 渲染 → 逐字节比对」
// rule 侧的数据与渲染器都在判据引擎里（单一 DSL / 单一目录）：
//   `tools/quality/criteria-engine/carriers/<name>.json` → `renderCarrier(name)`；
// 本文件只做「接到 docgen 的比对/落盘」这一层，不另存一份文案或渲染逻辑。
import { writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listCarriers, renderCarrier } from '../../quality/criteria-engine/carriers.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/** 引擎里登记了正文的 rule 名单（新增 = 在 carriers/ 加一个 json，代码零改动） */
export const RENDERED_RULES = listCarriers();

/** rule 侧渲染物清单：[{ kind:'rule', name, path, bytes }] */
export function renderedRuleAssets() {
  return RENDERED_RULES.map((name) => ({
    kind: 'rule',
    name,
    path: `rules/${name}.md`,
    bytes: renderCarrier(name),
  }));
}

/** 显式落盘（只有 `generate --kind rule --name <名> --apply` 会调；gate 只比对不写） */
export function writeRenderedRule(name) {
  const p = join(ROOT, 'rules', `${name}.md`);
  writeFileSync(p, renderCarrier(name), 'utf8');
  return p;
}

export function renderRenderedRule(name) {
  return renderCarrier(name);
}
