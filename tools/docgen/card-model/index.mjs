// 对外 barrel（spec §3 :48）。**纯 re-export，不重新实现**（防两份实现）。
// 出口面恰 18 项：8 张表 + `SUBJECTS` / `SUBJECT_VALIDATORS` + 四入口
// （`validateCardModel` / `validateOpenItems` / `compareVerdicts` / `verdictAllowed`）
// + `CARD_MODEL_CODES` + `SCAN_FIELDS` + `mergeActions` + `registeredIdsOf`。
// 词表物料与 `resolveLanding` 等内部面**不经 barrel**（各自从模块取，避免出口面多出非契约项）。

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
