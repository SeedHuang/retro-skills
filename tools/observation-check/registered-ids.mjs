// registeredIds 的唯一来源（S2 期）。
// 不变量（S1 落地后切换时保持）：新旧集合**相等**——切到 Object.keys(CHECK_ITEMS) 时，
// 必须断言 Set(REGISTERED_IDS) 与 Set(Object.keys(CHECK_ITEMS)) 相等，随后删除本文件与所有 import。
// 本文件只登记 id 字符串，不含 check 分类字段（分类归 S1 的模型层，S2 不前置依赖）。
export const REGISTERED_IDS = ['k01', 'k02', 'k03'];
