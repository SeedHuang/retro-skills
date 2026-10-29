// 场景对账（spec §3 :39 / §7 :168-171 / §10-D5 :264）。
// `SHARED_SCENES` 只在此 re-export（字面写死在 enums.mjs，不做第二份）。
// `SEAT_SCENES` 是**席局部登记的默认空集**（spec §5 :129「本轮两表为空集，内容由 S4 填」）；
// 判定的真实输入是 `env.seatScenes`（testcase:524 / :1087-1089）。
import { SHARED_SCENES } from './enums.mjs';

export { SHARED_SCENES };

export const SEAT_SCENES = Object.freeze({});

const listOf = (seatScenes, seat) => seatScenes[seat] || [];
const otherSeats = (seatScenes, seat) => Object.keys(seatScenes).filter((k) => k !== seat);

// `DuplicateScene`（§7 :168）两子面：① 同 id 在本卡出现 2 次；② 共用 id 又出现在本席登记表。
export function duplicateScene(scenes, index, seatScenes, seat) {
  const id = scenes[index] && scenes[index].id;
  const earlier = scenes.slice(0, index).some((s) => s && s.id === id);
  const seatHasShared = Boolean(SHARED_SCENES[id]) && listOf(seatScenes, seat).includes(id);
  return earlier || seatHasShared;
}

// `ScenePromotionRequired`（§7 :169）：同一**席局部** id 出现在 ≥2 个席的登记表。
export function promotionCheck(seatScenes) {
  const counts = new Map();
  for (const seat of Object.keys(seatScenes)) {
    for (const id of listOf(seatScenes, seat)) {
      if (SHARED_SCENES[id]) continue; // 共用 id 不走「须上移」这条（它们本来就在全局表）
      counts.set(id, (counts.get(id) || 0) + 1);
    }
  }
  for (const n of counts.values()) if (n >= 2) return true;
  return false;
}

// `UnusedScene`（§7 :170）：本席**声明过**的场景未被任何动作引用；共用 8 个未声明者不判（§10-D5）。
export function unusedScene(sceneId, card) {
  const actions = [...(card.must || []), ...(card.never || [])];
  return !actions.some((a) => a && a.trigger && a.trigger.scene === sceneId);
}
