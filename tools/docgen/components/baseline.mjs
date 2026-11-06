// 两清单（§4.3）：rule（本数组）+ agent（= agentData 名单字典序 POSIX）
// 计数一律从这两个来源派生（gate / check-all / 测试同源），本文件不写死条数
// 阶段 1（2026-11-05）：23 条 rule 全量退出 `rules/` → 本数组收敛为 0
// 阶段 2（2026-11-05）：触发声明 `rules/evidence-before-conclusion.md` 上线，保留集 = 1 条
// 阶段 2b（2026-11-06）：`rules/anchor-forms.md` 上线（判据引擎第 6 条），保留集 = 2 条
// （PRD `docs/prd/20261105182104-rule-refactor/prd/stage-2-new-mode-pilot.md` §1 步骤 1–2）
import { agentData } from './agentData.mjs';

export const BASELINE_RULES = ['rules/anchor-forms.md', 'rules/evidence-before-conclusion.md'];

// 单席角色卡路径的唯一派生式（`agentPaths()` 与 `collectCardFindings` 的 `finding.file` 共用；
// 形态与 `observation-check/card-exempt.mjs` 的 `EXEMPT_CARDS` 同域——改路径方案只改这一处）。
export function cardPathOfSeat(name) {
  return `agents/${name}.md`;
}

export function agentPaths() {
  return agentData.map((a) => a.name).sort().map(cardPathOfSeat);
}

export function renderBaseline() {
  return JSON.stringify([...BASELINE_RULES, ...agentPaths()], null, 2) + '\n';
}
