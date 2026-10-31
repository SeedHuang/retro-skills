// 两清单（§4.3）：rule（本数组）+ agent（= agentData 名单字典序 POSIX）
// 计数一律从这两个来源派生（gate / check-all / 测试同源），本文件不写死条数
import { agentData } from './agentData.mjs';

export const BASELINE_RULES = [
  'rules/core-working-principles.md', 'rules/data-support-triple.md',
  'rules/dev-workflow-mainline.md', 'rules/docs-convention.md',
  'rules/global-ask-before-acting.md', 'rules/how-i-must-reason.md',
  'rules/import-guard.md', 'rules/import-path-choice.md',
  'rules/landing-sweep.md', 'rules/list-empty-state.md',
  'rules/no-git-write.md', 'rules/plain-language-to-user.md',
  'rules/poll-deferred-at-start.md', 'rules/powershell-file-encoding.md',
  'rules/reference-read-output-loop.md', 'rules/rules-single-source.md',
  'rules/skill-assets-convention.md', 'rules/skill-authoring-convention.md',
  'rules/spec-testcase-gate.md', 'rules/styled-component-file.md',
  'rules/ts-expect-error.md', 'rules/vitest-queued-alternative.md',
];

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
