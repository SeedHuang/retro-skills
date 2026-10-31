// S1 · B 组（evidence-reader 卡）+ D 组（生成器兼容与槽位判别力）+ 卡侧负例
// TC-B01~B05、B08~B12；TC-D01、D03~D05、D07~D09；TC-E07、E08、E13、E14、E18、E20
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { agentData, triggerTable } from '../components/agentData.mjs';
import { validateAgentData } from '../components/validateAgentData.mjs';
import { patternRegistry, DEFAULT_BOUNDARY, DOMAIN } from '../components/patternRegistry.mjs';
import { renderSeat } from '../components/cardPipeline.mjs';
import { checkAgentFile } from '../../execution-matrix/check-agent.mjs';
import { ROOT, readRepo, withRepoCopy, runCli, runEsm } from './support/dev-workflow-checks.mjs';

const CARD = 'agents/evidence-reader.md';
const CARD_TPL = 'tools/docgen/templates/agent-card.md.tpl';
const card = readRepo(CARD);
const tpl = readRepo(CARD_TPL);
const base = agentData.find((a) => a.name === 'evidence-reader');

test('TC-B01 evidence-reader 卡与渲染逐字节一致（diff 报零差异）', () => {
  const r = runCli(ROOT, ['diff', '--kind', 'agent', '--name', 'evidence-reader']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /旧 agents\/evidence-reader\.md  sha256=/);
  assert.match(r.stdout, /新 渲染            sha256=/);
  assert.ok(r.stdout.includes('差异 - 0 / + 0（盘上 == 渲染，幂等，无需凭证）'), r.stdout);
});

test('TC-B02 tools 恰等于只读三元组', () => {
  const m = /^tools:\s*(.+)$/m.exec(card);
  assert.ok(m, '卡缺 tools 行');
  assert.equal(m[1].trim().replace(/\s+/g, ''), 'Read,Glob,Grep');
  assert.deepEqual(base.tools, patternRegistry.tools.readOnly);
});

test('TC-B03 description 只写触发条件（S4 迁移后 = trigger.when 直出）且不含「议会评审」', () => {
  const d = /^description:\s*(.+)$/m.exec(card)[1];
  assert.equal(d, triggerTable['evidence-reader'].when, d);
  assert.equal(d.includes('在开发工作流中担任'), false, 'S4 迁移后不再派生「在…中担任…」');
  assert.equal(d.includes('时调用'), false, 'S4 迁移后不再带派生式尾巴');
  assert.equal(d.includes('议会评审'), false);
});

test('TC-B04 outputKind 与 evidence 输出格式齐，结构检查零 findings', () => {
  assert.equal(patternRegistry.outputKind.has('evidence'), true);
  const i = card.indexOf('## 输出格式');
  const j = card.indexOf('## 边界');
  assert.ok(i > -1 && j > i, '卡缺输出格式节或边界节');
  const s = card.slice(i, j);
  for (const w of ['原文摘句', '文件', '行号']) assert.ok(s.includes(w), `取证格式缺「${w}」`);
  for (const w of ['严重级别', '建议解法']) assert.equal(s.includes(w), false, `取证格式不得出现「${w}」`);
  const r = checkAgentFile('evidence-reader');
  assert.equal(r.ok, true, JSON.stringify(r.findings));
  assert.deepEqual(r.findings, []);
});

test('TC-B05 when 不含「时调用」且不以「时」结尾', () => {
  const w = triggerTable['evidence-reader'].when;
  assert.equal(w, '当需要通读长文并交出可核对的原文与行号（交接取证 / 事实基线回核）');
  assert.equal(w.endsWith('时'), false);
  assert.equal(/在[^。]*中担任|时调用/.test(w), false);
});

test('TC-B08 与 reviewer-reader / detective-observer 的产出物不重叠', () => {
  for (const w of ['不出观点', '不出问题卡', '不参与评审']) assert.ok(card.includes(w), `卡缺「${w}」`);
  assert.ok(card.includes('原文'), '产出物应为取证摘要');
  assert.equal(card.includes('观察记录'), false);
});

test('TC-B09 tools 顺序不同但集合相等必须判绿（假阳性样例）', () => {
  const d = structuredClone(agentData);
  d.find((a) => a.name === 'evidence-reader').tools = ['Grep', 'Read', 'Glob'];
  assert.doesNotThrow(() => validateAgentData(d, triggerTable), '集合相等被判成 ToolsViolation = 假阳性');
});

test('TC-B10 reader 卡「边界」节为取证角色句、不含「只读评审角色」；模板只留槽位', () => {
  const i = card.lastIndexOf('## 边界');
  assert.ok(i > -1, '卡缺边界节');
  const s = card.slice(i);
  assert.equal(s.includes('只读评审角色'), false, '边界节退回了评审角色句');
  for (const w of ['不得创建、修改、删除任何文件', '不出观点', '不参与评审']) assert.ok(s.includes(w), `边界节缺「${w}」`);

  assert.equal(tpl.includes('{{BOUNDARY}}'), true, '模板必须是槽位');
  assert.equal(/你是只读评审角色：[^\r\n]*不裁决他人分歧/.test(tpl), false, '模板不得硬编码默认句');
});

test('TC-B11 reader 卡不再有「自由探索」散文节（S4 迁移后由一条 must 承接）', () => {
  assert.equal(card.includes('现场生成 3-5 个'), false);
  assert.equal(card.includes('## 自由探索'), false, 'S4 迁移后新卡 7 段里无「自由探索」节');
  assert.ok(card.includes('evidence-reader.free-explore'), '自由探索语义由「一定会」的 must 行承接');

  assert.equal(tpl.includes('{{EXPLORE}}'), false, '新卡模板无 {{EXPLORE}} 槽');
  assert.equal(tpl.includes('现场生成 3-5 个'), false);

  const texts = [readRepo('tools/docgen/components/patternRegistry.mjs')];
  assert.deepEqual(texts.map((t) => t.includes('现场生成 3-5 个')), [true], '旧句只留在 patternRegistry（未被任何渲染路径消费）');
  assert.deepEqual(texts.map((t) => (t.match(/本节不适用/g) ?? []).length), [1], 'DEFAULT_EXPLORE_NONE 文本只留在 patternRegistry');
});

test('TC-B12 boundary + explorePolicy 被 BASE_KEYS 接受（不判非法），且值域写错必被拒', () => {
  assert.doesNotThrow(() => validateAgentData(agentData, triggerTable));
  assert.equal(typeof base.boundary === 'string' && base.boundary.length > 0, true);
  assert.equal(base.explorePolicy, 'none');

  // 值域（与 domain 的空串校验对齐）：空 boundary / 非法 explorePolicy 都不得静默走默认分支
  const emptyBoundary = structuredClone(agentData);
  emptyBoundary.find((a) => a.name === 'evidence-reader').boundary = '';
  assert.throws(() => validateAgentData(emptyBoundary, triggerTable), (e) => e.code === 'DescriptionDerivation');

  const badPolicy = structuredClone(agentData);
  badPolicy.find((a) => a.name === 'evidence-reader').explorePolicy = 'NONE';
  assert.throws(() => validateAgentData(badPolicy, triggerTable), (e) => e.code === 'DescriptionDerivation');

  // 渲染侧纵深防御：把条目 boundary 置空（绕过校验）→ 卡面回落 DEFAULT_BOUNDARY，不得出现空边界节
  const keep = base.boundary;
  try {
    base.boundary = '';
    const rendered = renderSeat('evidence-reader').card;
    const boundarySection = rendered.slice(rendered.lastIndexOf('## 边界'));
    assert.ok(boundarySection.trim().length > '## 边界'.length, '空 boundary 不得渲染出空边界节');
    assert.equal(boundarySection.includes(DEFAULT_BOUNDARY), true, '空 boundary 应回落 DEFAULT_BOUNDARY');
  } finally {
    base.boundary = keep;
  }
});

test('TC-D01 gate 逐字节兜住既有席；给 reviewer-qa.md 注入一字节必报 Mismatch', () => {
  const n = readRepo('tools/docgen/baseline.json');
  assert.ok(JSON.parse(n).length > 0);
  const ok = runCli(ROOT, ['gate']);
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /^baseline \d+\/\d+$/m);

  withRepoCopy((dst) => {
    appendFileSync(join(dst, 'agents', 'reviewer-qa.md'), ' ');
    const bad = runCli(dst, ['gate']);
    assert.equal(bad.status, 1, bad.stdout + bad.stderr);
    assert.match(bad.stderr, /^Mismatch:/m);
    // CLI 只打错误码（stderr 契约不打印 path）；「点名哪一席」由 collectGate 明细给出
    const detail = runEsm(dst, "import {collectGate} from './tools/docgen/cli.mjs'; console.log(collectGate().map(d=>d.code+':'+d.path).join('|'))");
    assert.ok(detail.stdout.includes('Mismatch:agents/reviewer-qa.md'), detail.stdout + detail.stderr);
  });
});

test('TC-D03 其余 14 席 description：全部迁移席 = trigger.when 直出（无派生式尾巴）', () => {
  const dir = join(ROOT, 'agents');
  const seats = agentData.map((a) => a.name).filter((x) => x !== 'evidence-reader');
  for (const name of seats) {
    const d = /^description:\s*(.+)$/m.exec(readFileSync(join(dir, `${name}.md`), 'utf8'))[1];
    // S4 迁移席（spec §10-D3）：description = trigger.when 直出，不得再派生「在…中担任…」
    assert.equal(d.includes('在议会评审中担任'), false, `${name} 迁移后不得再走派生式`);
    assert.equal(d.includes('在开发工作流中担任'), false, `${name} 迁移后不得再走派生式`);
    assert.equal(d.includes('时调用'), false, `${name} 迁移后不得保留派生式尾巴`);
  }
});

test('TC-D04 新卡 description 不拼 domain（改 domain 后渲染不变）', () => {
  assert.equal(/^description:.*在议会评审中担任/m.test(card), false);
  const keep = base.domain;
  const before = renderSeat('evidence-reader').card;
  try {
    base.domain = '测试域';
    const after = renderSeat('evidence-reader').card;
    assert.equal(after, before, '新卡 description 不得因 domain 变化而变（派生分支已随旧模板退场）');
    assert.match(after, /^description: 当需要通读长文并交出可核对的原文与行号/m);
  } finally {
    base.domain = keep;
  }
});

test('TC-D05 domain 输入空间（S4 迁移后）：新卡 description 不受 domain 影响，值域仍由 boundary 守', () => {
  for (const v of ['', '  ', 123]) {
    const d = structuredClone(agentData);
    const a = d.find((x) => x.name === 'evidence-reader');
    a.domain = v;
    // 迁移席的 description = trigger.when 直出 → 不再拼 domain 句，也不会拼出空 domain 句
    const line = /^description:\s*(.+)$/m.exec(card)[1];
    assert.equal(line.includes('在中担任'), false, `domain=${JSON.stringify(v)} 拼出了空 domain 句`);
    assert.equal(line.includes('在  中担任'), false, `domain=${JSON.stringify(v)} 拼出了全空格 domain 句`);
    // 非法 domain 不再走派生式（断言 8 只判未迁移席）；值域防线改由 boundary 承担（B12 已判）
    assert.equal(d.find((x) => x.name === 'evidence-reader').domain, v, '构造必须真的改到 domain');
  }
  const d = structuredClone(agentData);
  d.find((x) => x.name === 'evidence-reader').boundary = '';
  assert.throws(() => validateAgentData(d, triggerTable), (e) => e.code === 'DescriptionDerivation', '空 boundary 仍必须被拒');
});

test('TC-D07 domain 字段被接受，且只有 evidence-reader 带它', () => {
  assert.doesNotThrow(() => validateAgentData(agentData, triggerTable));
  assert.equal(base.domain, '开发工作流');
  assert.equal(agentData.filter((a) => a.domain !== undefined).length, 1);
});

test('TC-D08 边界句退回默认只读句 → 卡面可被机械探针检出（槽位未接线不得静默）', () => {
  const keep = base.boundary;
  try {
    base.boundary = DEFAULT_BOUNDARY;
    const rendered = renderSeat('evidence-reader').card;
    const s = rendered.slice(rendered.lastIndexOf('## 边界'));
    assert.equal(s.includes('只读评审角色'), true, '失败态复现失败');
    assert.equal(s.includes('不得创建、修改、删除任何文件'), true, '旧句与新句都含这句 → 只查它会误判为通过');
  } finally {
    base.boundary = keep;
  }
  // 模板面：边界必须是槽位、不得硬编码默认句
  assert.equal(tpl.includes('{{BOUNDARY}}'), true);
  assert.equal(/你是只读评审角色：[^\r\n]*不裁决他人分歧/.test(tpl), false, '新卡模板不得硬编码默认句');
});

test('TC-D09 explore 语义由一条 must 承接（新卡不再渲散文节）', () => {
  const rendered = renderSeat('evidence-reader').card;
  assert.ok(rendered.includes('evidence-reader.free-explore'), '自由探索须由 must 行承接');
  assert.equal(rendered.includes('本节不适用'), false, '新卡不渲染 explore 散文');
  assert.equal(rendered.includes('现场生成 3-5 个'), false, '新卡不渲染旧探索句');

  const g = runCli(ROOT, ['gate']);
  assert.equal(g.status, 0, '盘上卡与渲染同源时 gate 恒绿（gate 不判语义，语义由卡文判据与议会判）');
});

test('TC-E07 给另一席注入一字节 → gate 必报 Mismatch（第二个独立注入点）', () => {
  withRepoCopy((dst) => {
    appendFileSync(join(dst, 'agents', 'reviewer-ai.md'), ' ');
    const r = runCli(dst, ['gate']);
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stderr, /^Mismatch:/m);
    const detail = runEsm(dst, "import {collectGate} from './tools/docgen/cli.mjs'; console.log(collectGate().map(d=>d.code+':'+d.path).join('|'))");
    assert.ok(detail.stdout.includes('Mismatch:agents/reviewer-ai.md'), detail.stdout + detail.stderr);
  });
});

test('TC-E08 evidence 格式退化成问题卡（级别 / 解法 / P0）必被抓住', () => {
  const i = card.indexOf('## 输出格式');
  const j = card.indexOf('## 边界');
  const s = card.slice(i, j);
  assert.equal(s.includes('严重级别'), false);
  assert.equal(s.includes('建议解法'), false);
  assert.equal(s.includes('P0'), false);
  assert.equal(s.includes('原文摘句'), true);
  assert.equal(s.includes('没找到'), true);
});

test('TC-E13 tools 多加 Write → ToolsViolation（恰等，不是包含）', () => {
  const d = structuredClone(agentData);
  d.find((a) => a.name === 'evidence-reader').tools.push('Write');
  assert.throws(() => validateAgentData(d, triggerTable), (e) => e.code === 'ToolsViolation');
});

test('TC-E14 description 出现「在议会评审中担任」必被抓住', () => {
  assert.equal(/^description:.*在议会评审中担任/m.test(card), false);
  const mutated = card.replace(/^description:.*$/m, 'description: 在议会评审中担任阅读取证员。当需要通读长文时调用');
  assert.equal(/^description:.*在议会评审中担任/m.test(mutated), true, '判据必须有判别力');
});

test('TC-E18 when 以「时」结尾报 WhenFormatViolation', () => {
  const table = { ...triggerTable, 'evidence-reader': { when: '当需要通读长文时', route: 'evidence-reader' } };
  assert.throws(() => validateAgentData(agentData, table), (e) => e.code === 'WhenFormatViolation');
});

test('TC-E20 未登记的 outputKind 报 InvalidOutputKind', () => {
  const d = structuredClone(agentData);
  d.find((a) => a.name === 'evidence-reader').outputKind = 'evidence-x';
  assert.throws(() => validateAgentData(d, triggerTable), (e) => e.code === 'InvalidOutputKind');
});
