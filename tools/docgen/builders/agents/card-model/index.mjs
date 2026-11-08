// 对外 barrel（spec §3 :48）。**纯 re-export，不重新实现**（防两份实现）。
// 出口面恰 18 项：8 张表 + `SUBJECTS` / `SUBJECT_VALIDATORS` + 四入口
// （`validateCardModel` / `validateOpenItems` / `compareVerdicts` / `verdictAllowed`）
// + `CARD_MODEL_CODES` + `SCAN_FIELDS` + `mergeActions` + `registeredIdsOf`。
// S2 的 `cardFaceIds` **不经本 barrel**：它扫渲染文本、必须 import 渲染器，
// 落在 `tools/docgen/components/cardFaceIds.mjs`（S2 spec §3 #5 / §6-D19；S1 §3 依赖红线：本目录只许 node: 与自身）。

export {
  SHARED_SCENES,
  MOMENTS,
  REPEATS,
  SIGNALS,
  VERDICTS,
  CHECK_KINDS,
  SCOPES,
  LANDING_VARS,
} from './enums.mjs';

export { SUBJECTS, SUBJECT_VALIDATORS, verdictAllowed, compareVerdicts } from './subjects.mjs';
export { validateOpenItems } from './open-items.mjs';
export { mergeActions } from './merge.mjs';
export { SCAN_FIELDS } from './enums.mjs';
export { CARD_MODEL_CODES, registeredIdsOf, validateCardModel } from './validateCardModel.mjs';
