// 命令组（spec §3.2 / V-4）：允许 3 组、禁止 5 组、席级组本轮为空集。
// 组内顺序 = 卡面顺序；`verbs` 只放能逐项复算的字面成员，形态描述进 `purpose`（spec:54）。
export const commandGroups = {
  'check.local': {
    purpose: '本仓自检与计数：跑 check 与只读脚本，不改盘',
    verbs: [
      'npm run check',
      'node scripts/check-all.mjs',
      'node scripts/doc-name.mjs --check',
      'node scripts/skill-dir.mjs',
      'node skills/review-log/scripts/time.mjs',
    ],
  },
  'git.read': {
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
    purpose: 'docgen 只读子命令（gate / check-agents / diff / draft ls）',
    verbs: [
      'node tools/docgen/cli.mjs gate',
      'node tools/docgen/cli.mjs check-agents',
      'node tools/docgen/cli.mjs diff --kind agent --name <席>',
      'node tools/docgen/cli.mjs draft ls',
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
