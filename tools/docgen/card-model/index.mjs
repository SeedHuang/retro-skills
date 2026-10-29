// 对外 barrel（spec §3 :48）。**纯 re-export，不重新实现**（防两份实现）。
// 终态出口面 = 18 项：8 张表 + `SUBJECTS` / `SUBJECT_VALIDATORS` + 四入口
// （`validateCardModel` / `validateOpenItems` / `compareVerdicts` / `verdictAllowed`）
// + `CARD_MODEL_CODES` + `SCAN_FIELDS` + `mergeActions` + `registeredIdsOf`。
// 本文件按 Task 逐块增长；**不得**写成「先空后补占位函数」。

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

export { subjectiveTerms } from './vocab/subjective-terms.mjs';
export { criterionTerms } from './vocab/criterion-terms.mjs';
export { resolveLanding } from './landings.mjs';
