// 主观词表（**派生**物料）。词面唯一单源 = `tools/quality/observable-terms.json`（S1 起）。
// 本文件只做派生：不得再写字面值（含注释），否则会出现第二份真相（spec §3 `:65` / §8 `:138`）。
// 依赖约束：`card-model/**` 只许 import `node:` 标准库与目录内相对路径（S1 `card-model.test.mjs` 以此为红线）。
import { readFileSync } from 'node:fs';

const OBSERVABLE = JSON.parse(
  readFileSync(new URL('../../../quality/observable-terms.json', import.meta.url), 'utf8'),
);

export const subjectiveTerms = Object.freeze([...OBSERVABLE.terms]);
