// 两清单（§4.3）：rule 21（P1 沿用）+ agent 14（= Object.keys(agentData) 字典序 POSIX）
import { agentData } from './agentData.mjs';

export const BASELINE_RULES = [
  'rules/core-working-principles.md', 'rules/data-support-triple.md',
  'rules/docs-convention.md', 'rules/global-ask-before-acting.md',
  'rules/how-i-must-reason.md', 'rules/import-guard.md',
  'rules/import-path-choice.md', 'rules/landing-sweep.md',
  'rules/list-empty-state.md', 'rules/no-git-write.md',
  'rules/plain-language-to-user.md', 'rules/poll-deferred-at-start.md',
  'rules/powershell-file-encoding.md', 'rules/reference-read-output-loop.md',
  'rules/rules-single-source.md', 'rules/skill-assets-convention.md',
  'rules/skill-authoring-convention.md', 'rules/spec-testcase-gate.md',
  'rules/styled-component-file.md', 'rules/ts-expect-error.md',
  'rules/vitest-queued-alternative.md',
];

export function agentPaths() {
  return agentData.map((a) => a.name).sort().map((name) => `agents/${name}.md`);
}

export function renderBaseline() {
  return JSON.stringify([...BASELINE_RULES, ...agentPaths()], null, 2) + '\n';
}
