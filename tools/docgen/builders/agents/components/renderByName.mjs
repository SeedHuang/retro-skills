// renderByName —— 单席渲染入口（从 cli.mjs 抽出）
// 为什么抽出来：check-agent 需要渲染产物，而 cli 需要 check-agent 的结构检查与语义键。
// 渲染器放独立模块后，依赖单向：cli → check-agent → renderByName → components，不再成环
// （2026-10-21 代码审查问题 1：此前 cli 与 check-agent 互相 import，只靠「跨环调用都在函数体内」才不崩）。
// S4 Task 7：旧 agent 模板与旧渲染分支已退场，本文件只委派新卡管线。
import { agentData, triggerTable } from './agentData.mjs';
import { renderSeat } from './cardPipeline.mjs';
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
  if (!agent.card) {
    fail('MissingComponentData', { name, reason: '未迁移席不可走新卡管线（旧模板分支已于 S4 Task 7 退场）' });
  }
  return renderSeat(name).card;
}
