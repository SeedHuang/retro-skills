// 配置导出（spec §5 / `policy --dump` 的数据面）：**纯函数**——只读定义层 + 配置层 + 渲染层，
// 不写盘、不读 CLI 参数（写盘类 flag 的拒绝归 CLI，T4-2）。
// 形状写死：`{ capabilities, tiers, commands, seatGroups, paths:{groups,patterns:{specPlan}}, detectionBlindSpots, artifacts, seats }`；
// `commands` = 允许 3 组 ∪ 禁止 5 组 ∪ `seatGroups`；`seats` = 3 席 + `__default__`，每席 `{display, expanded}`，
// `expanded` = 12 个槽值（顺序 = spec §3.4 表行序）。
import * as CAP from '../policy/definitions/capabilities.mjs';
import { TIERS } from '../policy/definitions/tiers.mjs';
import * as CMD from '../policy/definitions/commands.mjs';
import * as PTH from '../policy/definitions/paths.mjs';
import * as ART from '../policy/definitions/artifacts.mjs';
import * as SEATS from '../policy/definitions/seats.mjs';
import { SLOTS, slotValues } from './renderBoundary.mjs';

// `dir` 保留 Interface（`dumpPolicy(dir)`）：定义层按模块自身位置解析，CLI 在副本进程内运行时 cwd / 模块
// 都指向该副本，故本批不按 dir 另取数；不得借此写盘。
export function dumpPolicy(_dir = process.cwd()) {
  void _dir;
  const seats = {};
  for (const slug of Object.keys(SEATS.SEATS)) {
    const values = slotValues(slug);
    seats[slug] = { display: values.SEAT, expanded: SLOTS.map((k) => values[k]) };
  }
  return {
    // 深拷贝：`dump` 是只读快照，调用方就地改 `json` 不得改到定义层（`capabilities` / `tiers` / `paths.groups` 等）
    json: structuredClone({
      capabilities: CAP.capabilities,
      tiers: TIERS,
      commands: { ...CMD.commandGroups, ...CMD.forbiddenGroups, ...CMD.seatGroups },
      seatGroups: CMD.seatGroups,
      paths: { groups: PTH.pathGroups, patterns: { specPlan: PTH.FORBIDDEN_SPEC_PLAN.pattern.source } },
      detectionBlindSpots: PTH.DETECTION_BLIND_SPOTS,
      artifacts: ART.artifacts,
      seats,
    }),
  };
}
