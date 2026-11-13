// 边界规则解释器场景表（spec `2026-11-13-boundary-logic-interpreter-design.md` §5 验收 2）。
// 每组用例 = 输入场景 → 期望判定方向；不比对文案字符串（文案一致性由 boundary-copy-consistency 负责）。
import test from 'node:test';
import assert from 'node:assert/strict';
import { decideWrite, decideCommand, visibility, escalationObligations, isEnvAssign, boundaryFacts } from '../policy/boundaryInterpreter.mjs';
import { modelWithShared } from '../../../models/agents/source.mjs';

const M = (seat) => modelWithShared(seat);
const ids = (r) => r.obligations.map((o) => o.id);

test('写判定：允许产物放行，且 .gitignore 例外（.session 下的 defense.md）', () => {
  const r = decideWrite('respondent-dev', '.session/reviews/r1/defense.md', { model: M('respondent-dev') });
  assert.equal(r.decision, 'allow');
  assert.equal(r.ruleId, 'write.allow:artifact.defenseRecord');
});

test('写判定：禁写路径组 → 拒绝', () => {
  const r = decideWrite('respondent-dev', 'rules/core-working-principles.md', { model: M('respondent-dev') });
  assert.equal(r.decision, 'deny');
  assert.match(r.ruleId, /^pathGroups:/);
});

test('写判定：签字账 → 拒绝', () => {
  const r = decideWrite('respondent-dev', 'docs/devworkflows/t1/gate-record.md', { model: M('respondent-dev') });
  assert.equal(r.decision, 'deny');
  assert.equal(r.ruleId, 'SIGNOFF_LEDGER');
});

test('写判定：签字账深层路径同样归因 SIGNOFF_LEDGER（中段 ** 跨多级）', () => {
  const r = decideWrite('respondent-dev', 'docs/devworkflows/a/b/gate-record.md', { model: M('respondent-dev') });
  assert.equal(r.decision, 'deny');
  assert.equal(r.ruleId, 'SIGNOFF_LEDGER');
});

test('写判定：.gitignore 兜底 → 拒绝', () => {
  const r = decideWrite('speaker', '.session/tmp/scratch.md', { model: M('speaker') });
  assert.equal(r.decision, 'deny');
  assert.equal(r.ruleId, 'gitignore');
});

test('写判定：无白名单席 → 默认拒绝', () => {
  const r = decideWrite('reviewer-qa', 'src/app.js', { model: M('reviewer-qa') });
  assert.equal(r.decision, 'deny');
  assert.equal(r.ruleId, 'write.denyByDefault');
});

test('写判定：组 id 入口——允许产物放行 / 作用域排除项不再按禁写组拒绝', () => {
  assert.equal(decideWrite('respondent-dev', '', { model: M('respondent-dev'), groupId: 'artifact.defenseRecord' }).decision, 'allow');
  const excluded = decideWrite('senior-sdet', '', { model: M('senior-sdet'), groupId: 'code.test' });
  assert.equal(excluded.decision, 'deny');
  assert.equal(excluded.ruleId, 'write.denyByDefault'); // 排除项不命中禁写组，落默认拒绝
});

test('命令判定：白名单 verb 放行 / 禁止组拒绝 / 默认拒绝', () => {
  assert.equal(decideCommand('respondent-dev', 'scs time', { model: M('respondent-dev') }).decision, 'allow');
  assert.equal(decideCommand('respondent-dev', 'git commit -m x', { model: M('respondent-dev') }).decision, 'deny');
  assert.equal(decideCommand('respondent-dev', 'git --no-optional-locks checkout main', { model: M('respondent-dev') }).decision, 'deny');
  const fallback = decideCommand('respondent-dev', 'curl http://example.com', { model: M('respondent-dev') });
  assert.equal(fallback.decision, 'deny');
  assert.equal(fallback.ruleId, 'command.denyByDefault');
});

test('命令判定：环境变量赋值五形态全部拒绝', () => {
  const forms = ['FOO=1 npm test', 'export FOO=1', '$env:FOO=1', 'set FOO=1', 'setx FOO 1'];
  for (const cmd of forms) {
    assert.equal(isEnvAssign(cmd), true, cmd);
    assert.equal(decideCommand('respondent-dev', cmd, { model: M('respondent-dev') }).ruleId, 'forbiddenGroups:env.assign', cmd);
  }
});

test('检测可见性：tracked 未提交 / staged 可见，其余不可见', () => {
  assert.equal(visibility('tracked-dirty').visible, true);
  assert.equal(visibility('staged').visible, true);
  assert.equal(visibility('committed').visible, false);
  assert.equal(visibility('restored').visible, false);
  assert.equal(visibility('ignored').visible, false);
  assert.throws(() => visibility('unknown'), (e) => e.code === 'UnknownState');
});

test('越权义务：可复原 → record/recompute/restore；不可复原 → record/recompute/baseline', () => {
  assert.deepEqual(ids(escalationObligations({ recoverable: true })), ['record', 'recompute', 'restore']);
  assert.deepEqual(ids(escalationObligations({ recoverable: false })), ['record', 'recompute', 'baseline']);
  const restore = escalationObligations({ recoverable: true }).obligations.find((o) => o.id === 'restore');
  assert.ok(restore.text.includes('`checkout` / `restore`'), restore.text);
});

test('越权义务：越权者自写产物与非本席复算两形态由席数据决定', () => {
  const self = escalationObligations({ recoverable: true, seat: 'reviewer-audit' }).obligations.find((o) => o.id === 'record');
  assert.ok(self.text.includes('越权者即本席'), self.text);
  const other = escalationObligations({ recoverable: true, seat: 'detective-observer' }).obligations.find((o) => o.id === 'record');
  assert.ok(other.text.includes('交审计在 `round-check.md` 独立复算。'), other.text);
  const none = escalationObligations({ recoverable: true, seat: 'speaker' }).obligations.find((o) => o.id === 'record');
  assert.equal(none.text.includes('越权者即本席'), false);
});

test('boundaryFacts：四个槽值非空且无未替换占位符', () => {
  for (const seat of ['detective-observer', 'senior-sdet', 'speaker']) {
    const f = boundaryFacts(seat, M(seat));
    for (const [k, v] of Object.entries(f)) {
      assert.ok(typeof v === 'string' && v.trim() !== '', `${seat}:${k}`);
      assert.equal(v.includes('{'), false, `${seat}:${k} 残留占位符`);
    }
  }
});
