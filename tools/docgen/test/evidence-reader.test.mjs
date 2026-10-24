// S1 · B 组（evidence-reader 卡）+ D 组（生成器兼容与槽位判别力）+ 卡侧负例
// TC-B01~B05、B08~B12；TC-D01、D03~D05、D07~D09；TC-E07、E08、E13、E14、E18、E20
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { agentData, triggerTable } from '../components/agentData.mjs';
import { validateAgentData } from '../components/validateAgentData.mjs';
import { renderAgent } from '../components/renderAgent.mjs';
import { patternRegistry, DOMAIN } from '../components/patternRegistry.mjs';
import { sharedBlocks } from '../components/sharedBlocks.mjs';
import { outputFormats } from '../components/outputFormats.mjs';
import { checkAgentFile } from '../../execution-matrix/check-agent.mjs';
import { ROOT, readRepo, withRepoCopy, runCli, runEsm } from './support/dev-workflow-checks.mjs';

const CARD = 'agents/evidence-reader.md';
const TPL = 'tools/docgen/templates/agent.md.tpl';
const card = readRepo(CARD);
const tpl = readRepo(TPL);
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

test('TC-B03 description 走 domain 分支且不含「议会评审」', () => {
  const d = /^description:\s*(.+)$/m.exec(card)[1];
  assert.ok(d.startsWith('在开发工作流中担任阅读取证员。'), d);
  assert.ok(d.endsWith('时调用'), d);
  assert.equal(d.includes('议会评审'), false);
});

test('TC-B04 outputKind 与 evidence 输出格式齐，结构检查零 findings', () => {
  assert.equal(patternRegistry.outputKind.has('evidence'), true);
  const i = card.indexOf('## 输出格式');
  const j = card.indexOf('## 通用纪律');
  assert.ok(i > -1 && j > i, '卡缺输出格式节或通用纪律节');
  const s = card.slice(i, j);
  for (const w of ['原文摘句', '文件', '行号', '未找到']) assert.ok(s.includes(w), `取证格式缺「${w}」`);
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

test('TC-B11 reader 卡「自由探索」节为「本节不适用…」形态；旧句与新句各只存一份', () => {
  assert.equal(card.includes('现场生成 3-5 个'), false);
  assert.equal(card.includes('只答固定清单 = 不合格'), false);
  const i = card.indexOf('## 自由探索');
  assert.ok(i > -1);
  const s = card.slice(i);
  assert.match(s, /本节不适用/);
  assert.equal(/生成 3-5 个/.test(s), false);

  assert.equal(tpl.includes('{{EXPLORE}}'), true);
  assert.equal(tpl.includes('现场生成 3-5 个'), false);

  const files = ['tools/docgen/components/patternRegistry.mjs', 'tools/docgen/components/renderAgent.mjs', TPL];
  const texts = files.map((p) => readRepo(p));
  assert.deepEqual(texts.map((t) => t.includes('现场生成 3-5 个')), [true, false, false], '旧句只能出现在 patternRegistry');
  assert.deepEqual(texts.map((t) => (t.match(/本节不适用/g) ?? []).length), [1, 0, 0], 'DEFAULT_EXPLORE_NONE 文本只能出现在 patternRegistry');
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

  // 渲染侧的纵深防御：即使绕过校验直接渲染空 boundary，也不许出现空的「边界」节
  const rendered = renderAgent({ agent: { ...base, boundary: '' }, trigger: triggerTable['evidence-reader'], template: tpl, sharedBlocks, outputFormats });
  const boundarySection = rendered.slice(rendered.lastIndexOf('## 边界'));
  assert.ok(boundarySection.trim().length > '## 边界'.length, '空 boundary 不得渲染出空边界节');
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

test('TC-D03 其余 14 席 description：13 席走默认分支、senior-sdet 按手写卡判', () => {
  const dir = join(ROOT, 'agents');
  const seats = agentData.map((a) => a.name).filter((x) => x !== 'evidence-reader');
  for (const name of seats) {
    const d = /^description:\s*(.+)$/m.exec(readFileSync(join(dir, `${name}.md`), 'utf8'))[1];
    if (name === 'senior-sdet') {
      assert.equal(d.includes('在议会评审中担任'), false);
      assert.equal(d.includes('开发工作流'), false);
      assert.equal(d.includes('Do not use for'), true);
    } else {
      assert.equal(d.includes('在议会评审中担任'), true, `${name} 未走默认分支`);
      assert.equal(d.includes('开发工作流'), false);
      assert.equal(d.includes('Do not use for'), false);
    }
  }
});

test('TC-D04 renderAgent 未把 domain 接进 description 时会被 grep 判据抓住', () => {
  assert.equal(/^description:.*在议会评审中担任/m.test(card), false);
  const broken = renderAgent({
    agent: { ...base, domain: undefined },
    trigger: triggerTable['evidence-reader'],
    template: tpl,
    sharedBlocks: {},
    outputFormats: {},
  });
  assert.match(broken, /^description:.*在议会评审中担任/m, '未接 domain 时必须能被 grep 抓到');
});

test('TC-D05 domain 输入空间：空串 / 全空格 / 非字符串都不得拼出空 domain 句，且被 validate 拒绝', () => {
  for (const v of ['', '  ', 123]) {
    const d = structuredClone(agentData);
    const a = d.find((x) => x.name === 'evidence-reader');
    a.domain = v;
    const rendered = renderAgent({ agent: a, trigger: triggerTable[a.name], template: tpl, sharedBlocks: {}, outputFormats: {} });
    const line = /^description:\s*(.+)$/m.exec(rendered)[1];
    assert.equal(line.includes('在中担任'), false, `domain=${JSON.stringify(v)} 拼出了空 domain 句`);
    assert.equal(line.includes('在  中担任'), false, `domain=${JSON.stringify(v)} 拼出了全空格 domain 句`);
    assert.throws(() => validateAgentData(d, triggerTable), (e) => e.code === 'DescriptionDerivation', `domain=${JSON.stringify(v)} 未被拒绝`);
    assert.equal(line.includes(DOMAIN), true, '回落值必须引用 DOMAIN 常量');
  }
});

test('TC-D07 domain 字段被接受，且只有 evidence-reader 带它', () => {
  assert.doesNotThrow(() => validateAgentData(agentData, triggerTable));
  assert.equal(base.domain, '开发工作流');
  assert.equal(agentData.filter((a) => a.domain !== undefined).length, 1);
});

test('TC-D08 边界句退回模板现句 → reader 卡变回「只读评审角色」必被检出，且 gate 无判别力', () => {
  const hard = '你是只读评审角色：不得创建、修改、删除任何文件；不裁决他人分歧；无中断评审的权力。';
  const badTpl = tpl.replace('{{BOUNDARY}}', hard);
  const rendered = renderAgent({ agent: base, trigger: triggerTable['evidence-reader'], template: badTpl, sharedBlocks: {}, outputFormats: {} });
  const s = rendered.slice(rendered.lastIndexOf('## 边界'));
  assert.equal(s.includes('只读评审角色'), true, '失败态复现失败');
  assert.equal(s.includes('不得创建、修改、删除任何文件'), true, '旧句与新句都含这句 → 只查它会误判为通过');

  let diff14 = 0;
  for (const a of agentData) {
    // 已声明 boundary 槽位的席（evidence-reader / reviewer-audit / detective-observer）与 testcase 席不参与本对照
    if (a.boundary !== undefined || a.outputKind === 'testcase') continue;
    const t = renderAgent({ agent: a, trigger: triggerTable[a.name], template: badTpl, sharedBlocks, outputFormats });
    if (t !== readFileSync(join(ROOT, 'agents', `${a.name}.md`), 'utf8')) diff14 += 1;
  }
  assert.equal(diff14, 0, '14 席逐字节仍绿 → 证明 gate 对 C10 半改零判别力，唯一防线是卡文判据');
});

test('TC-D09 explore 槽位未接线 → gate 仍绿、卡仍含旧句，只有卡文判据抓得住', () => {
  const render = (policy) => {
    const a = structuredClone(base);
    a.explorePolicy = policy;
    return renderAgent({ agent: a, trigger: triggerTable[a.name], template: tpl, sharedBlocks: {}, outputFormats: {} });
  };
  const none = render('none');
  const full = render('full');
  assert.notEqual(none, full, 'explorePolicy 未被消费（槽位未接线）');
  assert.equal(none.includes('本节不适用'), true);
  assert.equal(full.includes('现场生成 3-5 个'), true);

  const g = runCli(ROOT, ['gate']);
  assert.equal(g.status, 0, 'gate 在这题上零判别力：盘上卡与渲染同源时恒绿');
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
  const j = card.indexOf('## 通用纪律');
  const s = card.slice(i, j);
  assert.equal(s.includes('严重级别'), false);
  assert.equal(s.includes('建议解法'), false);
  assert.equal(s.includes('P0'), false);
  assert.equal(s.includes('原文摘句'), true);
  assert.equal(s.includes('未找到'), true);
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
