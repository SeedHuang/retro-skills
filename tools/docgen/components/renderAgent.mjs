import { patternRegistry, DEFAULT_BOUNDARY, DEFAULT_EXPLORE, DEFAULT_EXPLORE_NONE, resolveDomain } from './patternRegistry.mjs';

function fill(template, key, value) {
  if (value === '') return template.replaceAll(`${key}\n`, '').replaceAll(key, '');
  return template.replaceAll(key, () => value);
}

// fixedList 渲染按模板分流：testcase（手写卡）的元素是整行 markdown 原文，直接按行拼接；
// 议会席仍按单元格重拼成「必问 / 回答」两列（两条分支互不影响，改动需跑 15 席渲染快照）。
function fixedListBlock(agent) {
  if (agent.outputKind === 'testcase') return (agent.fixedList ?? []).join('\n');
  return agent.fixedList && agent.fixedList.length
    ? `| # | 必问 | 回答 |\n|---|---|---|\n${agent.fixedList.map((q, i) => `| ${i + 1} | ${q} | 待答 |`).join('\n')}`
    : '| # | 必问 | 回答 |\n|---|---|---|';
}

export function renderAgent({ agent, trigger, template, sharedBlocks = {}, outputFormats = {} }) {
  const description = agent.outputKind === 'testcase'
    ? patternRegistry.description.handwritten(agent.role, trigger.when, trigger.notWhen?.text ?? '')
    : patternRegistry.description.parliament(agent.role, trigger.when, resolveDomain(agent));

  const fixedList = fixedListBlock(agent);
  // 两个槽位（C10 / C11）：不带字段的席走默认常量 → 逐字节等于改造前模板现句。
  // 用 `||` 而不是 `??`：空串走 fill 的空值分支会把整句删掉，只有 `||` 能兜住（值域另由 validateAgentData 校验）。
  const boundary = agent.boundary || DEFAULT_BOUNDARY;
  const explore = agent.explorePolicy === 'none' ? DEFAULT_EXPLORE_NONE : DEFAULT_EXPLORE;

  let out = template;
  out = fill(out, '{{NAME}}', agent.name);
  out = fill(out, '{{DESCRIPTION}}', description);
  out = fill(out, '{{TOOLS}}', (agent.tools ?? []).join(', '));
  out = fill(out, '{{HEADING}}', agent.heading ?? '');
  out = fill(out, '{{SOURCE_LINE}}', agent.sourceLine ?? '');
  out = fill(out, '{{ZH_NAME}}', agent.role);
  out = fill(out, '{{DIMENSION}}', agent.dimension ?? '');
  out = fill(out, '{{IDENTITY}}', agent.identity ?? '');
  out = fill(out, '{{FIXED_LIST}}', fixedList);
  out = fill(out, '{{OUTPUT_FORMAT}}', outputFormats[agent.outputKind] ?? '');
  out = fill(out, '{{EXPLORE}}', explore);
  out = fill(out, '{{BOUNDARY}}', boundary);
  // {{SHARED_BLOCK}} 空值时只删占位符、保留该行换行（B 组席位：通用纪律末条与 `## 边界` 之间保留恰一空行）；
  // fill 的通用空值分支仍连行尾换行一起删，不改（spec §6-11）
  out = out.replaceAll('{{SHARED_BLOCK}}', () => sharedBlocks[agent.sharedBlock] ?? '');
  // 未实现/未消费的槽位只做 replaceAll，不校验残留 → 一旦模板写了没人填的槽位，{{XXX}} 会原样进产物。
  if (/\{\{[A-Z_]+\}\}/.test(out)) {
    const e = new Error(`MissingSlot：模板槽位未填充（${agent.name}）`);
    e.code = 'MissingSlot';
    throw e;
  }
  return out;
}
