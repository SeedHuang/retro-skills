import { patternRegistry } from './patternRegistry.mjs';

function fill(template, key, value) {
  if (value === '') return template.replaceAll(`${key}\n`, '').replaceAll(key, '');
  return template.replaceAll(key, () => value);
}

export function renderAgent({ agent, trigger, template, sharedBlocks = {}, outputFormats = {} }) {
  const description = agent.outputKind === 'testcase'
    ? patternRegistry.description.handwritten(agent.role, trigger.when, trigger.notWhen?.text ?? '')
    : patternRegistry.description.parliament(agent.role, trigger.when);

  const fixedList = agent.fixedList && agent.fixedList.length
    ? `| # | 必问 | 回答 |\n|---|---|---|\n${agent.fixedList.map((q, i) => `| ${i + 1} | ${q} | 待答 |`).join('\n')}`
    : '| # | 必问 | 回答 |\n|---|---|---|';

  let out = template;
  out = fill(out, '{{NAME}}', agent.name);
  out = fill(out, '{{DESCRIPTION}}', description);
  out = fill(out, '{{TOOLS}}', (agent.tools ?? []).join(', '));
  out = fill(out, '{{ZH_NAME}}', agent.role);
  out = fill(out, '{{DIMENSION}}', agent.dimension ?? '');
  out = fill(out, '{{IDENTITY}}', agent.identity ?? '');
  out = fill(out, '{{FIXED_LIST}}', fixedList);
  out = fill(out, '{{OUTPUT_FORMAT}}', outputFormats[agent.outputKind] ?? '');
  out = fill(out, '{{SHARED_BLOCK}}', sharedBlocks[agent.sharedBlock] ?? '');
  return out;
}
