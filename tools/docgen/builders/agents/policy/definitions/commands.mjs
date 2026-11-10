// 命令组（spec §3.1 / V-4）：允许 4 组、禁止 5 组、席级组本轮为空集。
// 组内顺序 = 卡面顺序；`verbs` 只放能逐项复算的字面成员，形态描述进 `purpose`（spec:54）。
// `layer` = 生命周期层（build 构建期 / dev 开发期 / run 运行期）：一组只装一层，卡面只渲染 run 组。
export const LAYERS = ['build', 'dev', 'run']

export const commandGroups = {
  'repo.check': {
    layer: 'dev',
    purpose: '本仓提交前自检：跑 check 与只读脚本，不改盘',
    verbs: ['npm run check', 'node scripts/check-all.mjs', 'node scripts/doc-name.mjs --check', 'node scripts/skill-dir.mjs'],
  },
  'tool.time': {
    layer: 'run',
    purpose: '平台工具链取数：只读，跨仓可用',
    verbs: ['scs time'],
  },
  'git.read': {
    layer: 'run',
    purpose: '只读 git 查询（status / diff / show / log / reflog show，禁 --output）',
    verbs: [
      'git --no-optional-locks status --porcelain',
      'git --no-optional-locks diff',
      'git --no-optional-locks show',
      'git --no-optional-locks log',
      'git --no-optional-locks reflog show',
    ],
  },
  'docgen.read': {
    layer: 'build',
    purpose: 'docgen 只读子命令（gate / check-agents / diff / draft ls）',
    verbs: [
      'node tools/docgen/builders/agents/cli.mjs gate',
      'node tools/docgen/builders/agents/cli.mjs check-agents',
      'node tools/docgen/builders/agents/cli.mjs diff --kind agent --name <席>',
      'node tools/docgen/builders/agents/cli.mjs draft ls',
    ],
  },
};

export const forbiddenGroups = {
  'docgen.write': {
    purpose: '生成 / 删除 / 替换类写操作：draft 生成与删除、baseline 写盘、replace 改卡（不是只读）',
    verbs: [
      'draft',
      'draft rm',
      'draft ensure',
      'baseline --write',
      'replace',
    ],
  },
  'git.write': {
    purpose: '改写仓库历史或工作区：提交 / 推送 / 切换 / 重置 / 复原 / 清理 / 删引用',
    verbs: [
      'commit',
      'push',
      'checkout',
      'reset',
      'restore',
      'clean',
      'rm',
      'reflog expire',
      'reflog delete',
    ],
  },
  'fs.write': {
    purpose: '任何写文件或重定向形态',
    verbs: [
      '>',
      '>>',
      'Set-Content',
      'Out-File',
      '--output',
      '--apply',
      '--write',
    ],
  },
  'env.assign': {
    purpose: '任何形式的环境变量赋值（由单独一个槽注入，不与其他禁止组合并）',
    verbs: [
      'export VAR=…',
      '$env:VAR=…',
      'set VAR=…',
      'setx VAR …',
      'VAR=… node …',
    ],
  },
  'network': {
    purpose: '安装 / 网络写 / `node -e`（不开放）/ 下载类命令',
    verbs: [
      '安装',
      '网络写',
      'node -e',
    ],
  },
};

// 席级组：键 = `seat:<slug>.extra`，本轮为空集（内容合法性由不变量 8 守，只允许副本内构造）。
export const seatGroups = {};

// 报码优先级（spec §3.1 表序，testcase §7 缺口 5 冻结）：Missing → Invalid → Mixed → Empty → Duplicated。
const LAYER_CODE_ORDER = ['GroupLayerMissing', 'GroupLayerInvalid', 'GroupMixedLayer', 'GroupEmpty', 'VerbDuplicated'];

// 一组只装一个 layer：数组只有一种取值时视同该值，出现两个以上不同值才算混装。
// 空数组 / null / 非字符串都是非法值（不当「混装」报，否则码面误导排查）。
function normalizeLayer(raw) {
  if (Array.isArray(raw)) {
    const distinct = new Set(raw);
    if (distinct.size === 1) return { layer: raw[0] };
    if (distinct.size > 1) return { mixed: true };
    return { layer: '[]' };
  }
  if (typeof raw !== 'string') return { layer: String(raw) };
  return { layer: raw };
}

// 纯函数、无 IO：校验命令组层标与组内 verb，命中即抛 `Error.code`（六码之一）。
export function validateCommandLayers(groups) {
  const found = [];
  const seen = new Map();
  for (const [name, g] of Object.entries(groups ?? {})) {
    const raw = g?.layer;
    if (raw === undefined) { found.push(['GroupLayerMissing', name]); continue; }
    const norm = normalizeLayer(raw);
    if (norm.mixed) { found.push(['GroupMixedLayer', name]); continue; }
    if (!LAYERS.includes(norm.layer)) { found.push(['GroupLayerInvalid', `${name}:${norm.layer}`]); continue; }
    if (!Array.isArray(g.verbs) || g.verbs.length === 0) { found.push(['GroupEmpty', name]); continue; }
    for (const v of g.verbs) {
      if (seen.has(v)) found.push(['VerbDuplicated', `${seen.get(v)}/${name}: ${v}`]);
      else seen.set(v, name);
    }
  }
  if (found.length === 0) return;
  found.sort((a, b) => LAYER_CODE_ORDER.indexOf(a[0]) - LAYER_CODE_ORDER.indexOf(b[0]));
  const [code, detail] = found[0];
  const e = new Error(`${code}: ${detail}`);
  e.code = code;
  throw e;
}
