// rating.mjs —— 置信度评级现算（N=3，不持久化）
export const N = 3;
export function rateFromRecords({ records, zero }) {
  if (records <= 0) return { level: 'low', records, zeroRegression: zero };
  if (records >= N && zero === records) return { level: 'high', records, zeroRegression: zero };
  return { level: 'mid', records, zeroRegression: zero };
}
// 高风险永不免验由调用方强制：rate() 只出档位，高风险场景调用方不得降档
export const HIGH_RISK_NEVER_SKIP = true;
