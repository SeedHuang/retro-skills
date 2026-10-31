// renderByName —— 单席渲染入口（从 cli.mjs 抽出）
// 为什么抽出来：check-agent 需要渲染产物，而 cli 需要 check-agent 的结构检查与语义键。
// 渲染器放独立模块后，依赖单向：cli → check-agent → renderByName → components，不再成环
// （2026-10-21 代码审查问题 1：此前 cli 与 check-agent 互相 import，只靠「跨环调用都在函数体内」才不崩）。
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { agentData, triggerTable } from './agentData.mjs';
import { renderAgent } from './renderAgent.mjs';
import { renderSeat } from './cardPipeline.mjs';
import { sharedBlocks } from './sharedBlocks.mjs';
// 过渡期：旧模板渲染走 `legacyOutputFormats`（逐字散文块）；新卡分支（S4）读结构化 `outputFormats`
import { legacyOutputFormats as outputFormats } from './outputFormats.mjs';
import { exitCodeFor } from './validateAgentData.mjs';

function fail(code, fields = {}) {
  const e = new Error(fields.message ?? code);
  e.code = code;
  Object.assign(e, fields);
  e.exitCode = exitCodeFor(code);
  throw e;
}

export function renderByName(name) {
  const agent = agentData.find((a) => a.name === name);
  if (!agent) fail('MissingComponentData', { name });
  const t = triggerTable[name];
  if (!t || t.when === undefined) {
    fail('MissingComponentData', { name, reason: 'registered 未拆槽席不可渲染（S2+ 拆槽后可用）' });
  }
  // 新卡分支（S4）：已迁移席走 cardPipeline 的卡面投影；旧模板分支保留到收口（spec §7-⑥）
  if (agent.card) return renderSeat(name).card;
  const tplName = agent.outputKind === 'testcase' ? 'agent-handwritten.md.tpl' : 'agent.md.tpl';
  const template = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'templates', tplName), 'utf8');
  return renderAgent({ agent, trigger: t, template, sharedBlocks, outputFormats });
}
