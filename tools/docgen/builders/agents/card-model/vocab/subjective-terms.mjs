// 主观词表（**派生**物料）。词面唯一单源 = `tools/quality/observable-terms.json`（S1 起）。
// 本文件只做派生：不得再写字面值（含注释），否则会出现第二份真相（spec §3 `:65` / §8 `:138`）。
// 依赖约束：`card-model/**` 只许 import `node:` 标准库与目录内相对路径（S1 `card-model.test.mjs` 以此为红线）。
import { readFileSync } from 'node:fs';

const OBSERVABLE = JSON.parse(
  readFileSync(new URL('../../../quality/observable-terms.json', import.meta.url), 'utf8'),
);

export const subjectiveTerms = Object.freeze([...OBSERVABLE.terms]);

// substring 判定**唯一实现点**（S3 spec §4）：文本是否**包含**任一词面（不是 token 全等）。
// `validateCardModel` 与 `validatePredicates` 都只 import 本函数——复本即第二实现点（V-9）。
export const subjectiveHit = (text) => subjectiveTerms.some((t) => typeof text === 'string' && text.includes(t));
