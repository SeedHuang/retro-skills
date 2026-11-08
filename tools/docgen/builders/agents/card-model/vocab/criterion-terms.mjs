// 判据词表（**派生**物料）。词面唯一单源 = `tools/docgen/dsl/rules/vocab/observable-terms.json`（S1 起）。
// 本文件只做派生：不得再写字面值（含注释），否则会出现第二份真相（spec §3 `:65` / §8 `:139`）。
// 依赖约束：`card-model/**` 只许 import `node:` 标准库与目录内相对路径。
import { readFileSync } from 'node:fs';

const OBSERVABLE = JSON.parse(
  readFileSync(new URL('../../../../dsl/rules/vocab/observable-terms.json', import.meta.url), 'utf8'),
);

export const criterionTerms = Object.freeze([...OBSERVABLE.criterionTerms]);
