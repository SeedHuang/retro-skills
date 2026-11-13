// 文案一致性（spec `2026-11-13-boundary-logic-interpreter-design.md` §5 验收 3/4）。
// 断言方向：卡面规则句里的每个集合成员，解释器判定必须同向；再用变异负例证明文案确实来自模型（防自证）。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { boundaryFacts, decideWrite, decideCommand, visibility, commandGroupsOfModel } from '../../../builders/agents/policy/boundaryInterpreter.mjs';
import { boundaryRules } from '../../../builders/agents/policy/definitions/boundaryRules.mjs';
import * as PTH from '../../../builders/agents/policy/definitions/paths.mjs';
import * as CMD from '../../../builders/agents/policy/definitions/commands.mjs';
import { writeScopes } from '../../../builders/agents/policy/definitions/writeScopes.mjs';
import { SEATS } from '../../../builders/agents/policy/definitions/seats.mjs';
import { renderBoundary } from '../../../builders/agents/components/renderBoundary.mjs';
import { modelWithShared } from '../source.mjs';

const GOLDEN = JSON.parse(readFileSync(new URL('./fixtures/boundary-baseline.json', import.meta.url), 'utf8'));
const POLICY_SEATS = Object.keys(GOLDEN);
const M = (seat) => modelWithShared(seat);
const scopeOf = (seat) => writeScopes[SEATS[seat]?.writeScope ?? 'review.ledger'];
const artifactPath = (path) => path.replace(/\{[^}]+\}/g, 'x');

test('文案 ↔ 写判定：卡面禁写集合的每个路径项都被拒绝；每个允许产物都被放行', () => {
  for (const seat of POLICY_SEATS) {
    const model = M(seat);
    const excluded = new Set(scopeOf(seat)?.excludePathItems ?? []);
    for (const items of Object.values(PTH.pathGroups)) {
      for (const item of items) {
        const r = decideWrite(seat, '', { model, groupId: item.id });
        if (excluded.has(item.id)) {
          assert.notEqual(r.ruleId, `pathGroups:${item.id}`, `${seat}:${item.id} 应被作用域排除`);
        } else {
          assert.equal(r.decision, 'deny', `${seat}:${item.id}`);
          assert.equal(r.ruleId, `pathGroups:${item.id}`, `${seat}:${item.id}`);
        }
      }
    }
    for (const id of model.permissions.write.allow) {
      const p = artifactPath(model.forms[id].path);
      const r = decideWrite(seat, p, { model });
      assert.equal(r.decision, 'allow', `${seat}:${p}`);
      assert.equal(r.ruleId, `write.allow:${id}`, `${seat}:${p}`);
    }
  }
});

test('文案 ↔ 命令判定：允许组里的每个 verb 放行；禁止组的每个 verb 拒绝', () => {
  const gitWrite = new Set(CMD.forbiddenGroups['git.write'].verbs);
  for (const seat of POLICY_SEATS) {
    const model = M(seat);
    const allowIds = model.permissions.command.allow ?? [];
    // 组反推唯一实现 = 解释器（测试不再复制一份，避免漂移后失去独立预言机）
    const allowGroups = commandGroupsOfModel(model) ?? [];
    if (allowIds.length > 0) assert.ok(allowGroups.length > 0, `${seat}: allow 非空但推导不出组`);
    for (const g of allowGroups) {
      for (const verb of CMD.commandGroups[g].verbs) {
        assert.equal(decideCommand(seat, verb, { model }).decision, 'allow', `${seat}:${verb}`);
      }
    }
    for (const [g, def] of Object.entries(CMD.forbiddenGroups)) {
      if (g === 'env.assign') continue;
      for (const verb of def.verbs) {
        const cmd = gitWrite.has(verb) ? `git ${verb}` : verb;
        assert.equal(decideCommand(seat, cmd, { model }).decision, 'deny', `${seat}:${cmd}`);
      }
    }
  }
});

test('文案 ↔ 检测可见性：检测限度句列出的隐式状态全部不可见；命令分支与授权一致', () => {
  const hidden = boundaryRules.detection.states.filter((s) => !s.visible);
  for (const seat of POLICY_SEATS) {
    const text = renderBoundary(seat, M(seat));
    for (const s of hidden) {
      assert.ok(text.includes(s.label), `${seat} 缺隐式状态「${s.label}」`);
      assert.equal(visibility(s.id).visible, false, `${seat}:${s.id}`);
    }
    const hasStatus = (M(seat).permissions.command.allow ?? []).includes('cmd.git.status');
    assert.equal(text.includes('本席未授任何命令，无法读取 tracked 工作区。'), !hasStatus, `${seat}:检测命令分支`);
  }
});

test('文案 ↔ 越权义务：越权段覆盖四个义务的文本；卡面无未替换占位符', () => {
  for (const seat of POLICY_SEATS) {
    const text = renderBoundary(seat, M(seat));
    const facts = boundaryFacts(seat, M(seat));
    for (const line of facts.ESCALATION_OBLIGATIONS.split('\n')) {
      assert.ok(text.includes(line), `${seat}: 缺义务句 ${line.slice(0, 20)}`);
    }
    assert.equal(/[{}]/.test(text.replace(/`[^`]*`/g, '')), false, `${seat}: 残留占位符`);
  }
});

test('变异负例：改规则模型 → 卡面必须随之变化（证明文案不是写死在渲染器里）', () => {
  const seat = 'reviewer-audit';
  const before = renderBoundary(seat, M(seat));

  const fields = boundaryRules.escalation.recordFields;
  const backup = [...fields];
  fields.push('负例字段');
  try {
    const after = renderBoundary(seat, M(seat));
    assert.ok(after.includes('负例字段'), '改越权字段后卡面未变化');
    assert.notEqual(after, before);
  } finally {
    fields.length = 0;
    fields.push(...backup);
  }

  const states = boundaryRules.detection.states;
  const ignored = states.find((s) => s.id === 'ignored');
  const oldLabel = ignored.label;
  ignored.label = '负例盲区';
  try {
    assert.ok(renderBoundary(seat, M(seat)).includes('负例盲区'), '改盲区标签后卡面未变化');
  } finally {
    ignored.label = oldLabel;
  }
});

test('变异负例：改席位模型的 permissionGroups 标签 → 固定禁令句随之变化', () => {
  const seat = 'reviewer-audit';
  const model = M(seat);
  const backup = model.permissionGroups.interrupt.label;
  model.permissionGroups.interrupt.label = '负例中断';
  try {
    assert.ok(renderBoundary(seat, model).includes('无负例中断的权力'), '改模型标签后卡面未变化');
  } finally {
    model.permissionGroups.interrupt.label = backup;
  }
});

test('固定禁令标签 fallback 与模型 permissionGroups 单一来源一致', () => {
  const shared = JSON.parse(readFileSync(new URL('../jsons/_shared.json', import.meta.url), 'utf8'));
  for (const [id, label] of Object.entries(boundaryRules.permissionLabelFallback)) {
    assert.equal(shared.permissionGroups[id]?.label, label, id);
  }
});
