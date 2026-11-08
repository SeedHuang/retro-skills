// 信号对账（spec §3 :40 / §7 :174-176 / §10-D6 :265）。
// `SIGNALS` 只在此 re-export（字面写死在 enums.mjs，不做第二份）。
// `SEAT_SIGNALS` 是**席局部登记的默认空集**（spec §5 :129）；判定输入 = `env.seatSignals`（testcase:525 / :1059 / :1071）。
// `MultiMomentInOneEntry` 的判定在发射点（validateCardModel），本模块只做「信号两码对账」。
import { SIGNALS } from './enums.mjs';

export { SIGNALS };

export const SEAT_SIGNALS = Object.freeze({});

const listOf = (seatSignals, seat) => (seatSignals && seatSignals[seat]) || [];

// `UnknownSignalType`（§7 :174）：`type` ∉ `SIGNALS` 且 ∉ 本席登记表（跨席借用不算「本席登记」）。
export function unknownSignalType(type, seatSignals, seat) {
  return !SIGNALS[type] && !listOf(seatSignals, seat).includes(type);
}

// `SignalProliferation`（§7 :176 / §10-D6）：本席局部 type（∉ `SIGNALS`）被 **< 2 个场景**引用。
// 引用计数口径 = 卡内动作 `trigger.scene` 的**去重**场景数（D6 的「scene 数」）。
export function signalProliferation(type, card, seatSignals, seat) {
  if (SIGNALS[type] || !listOf(seatSignals, seat).includes(type)) return false;
  const scenes = new Set(
    [...(card.must || []), ...(card.never || [])]
      .map((a) => a && a.trigger && a.trigger.scene)
      .filter((s) => typeof s === 'string'),
  );
  return scenes.size < 2;
}
