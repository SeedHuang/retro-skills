// 禁写路径（spec §3.2）：6 组、18 个数组元素；`代码、测试` 合写一个元素、盖 2 个点名项。
// `spec / plan` 以 pattern 项表达、不进数组（否则 `spec/plan` 无空格写法会假红）。
// 检测盲区是**独立导出**、不进 `pathGroups`（故不进 ③ 段禁写清单）。
// Q8（2026-11-03，PRD §3）：删本仓专属的 3 项（`lessons/` / `skills-lock.json` / `tools/docgen-spike/.tmp-test/`），
// 使「通用角色卡」不含项目专属内容；`DETECTION_BLIND_SPOTS` 里的 `lessons/` 属「检测限度」段，保留不动。
export const pathGroups = {
  code: ['代码、测试'],
  governance: ['rules/', 'skills/', 'agents/'],
  'docs.input': ['docs/prd/'],
  build: ['tools/', 'scripts/', '配置与依赖清单'],
  ledger: ['docs/after/', 'docs/handoffs/', 'docs/reports/', 'docs/superpowers/retro/'],
  workspace: [
    '.superpowers/',
    '*.local.md',
    '**/ledger.md',
    '.trae/',
    'node_modules/',
    '其他评审目录',
  ],
};

// 卡面形态 = `spec / plan`；两种写法（有无空格）都要命中。
export const FORBIDDEN_SPEC_PLAN = { pattern: /spec\s*\/\s*plan/ };

// 检测盲区（≠ 禁写清单）：由检测限度段单独注入。
export const DETECTION_BLIND_SPOTS = ['.session/', '.superpowers/', 'lessons/'];
