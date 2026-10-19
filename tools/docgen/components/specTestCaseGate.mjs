import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const TEMPLATE_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'rule.md.tpl');

export const TEMPLATE_H2S = [
  '## 四要素声明',
  '## 核心判据',
  '## 正例 / 反例',
  '## 为什么',
  '## 适用范围（不因来源豁免）',
  '## 冲突裁决',
  '## 例外',
  '## 触发时机',
  '## 验证',
];

export const TARGET_SIGNATURES = [
  '一条 spec 要算「可交付」，下面五条必须同时成立，缺一不合格：',
  '测试用例是验收的执行清单；没有它，spec 的验收项只是一句愿望，谁都可以说「做完了」。',
  '与「先写 spec、测试以后补」「这次先快速交付」「用例由 spec 作者顺手写」冲突时，以本规则为准。拿不准先停下说明，等确认再动。',
];

export function buildData() {
  return {
    applicability: 'conditional',
    polarity: 'obligation',
    title: '在写或修改 spec 时，必须同批产出独立编写的 testcase 文件，并随 spec 一起送议会',
    sourceLine: '来源：用户当场指令（2026-10-18）｜证据：议会评审 PRD 的 105 张卡中 F02 指出——testcase 硬门只写在 `prd-to-specs` 技能里，新 session 不加载该技能就失效；实测仓库 25 份 spec 零 testcase｜落地：2026-10-18',
    fourElements: {
      scope: '写或修改 `docs/superpowers/specs/` 下的 spec（含 spike 类 spec；含文件形态与目录形态）',
      condition: '新建 spec、修订 spec、把 spec 送议会、或让 spec 进入 plan 之前',
      action: '必须同批产出配套 testcase 文件，由独立子代理编写，spec 用外链指向它，议会把两件一起审',
      object: 'spec 及其测试用例文件',
    },
    criteriaIntro: '一条 spec 要算「可交付」，下面五条必须同时成立，缺一不合格：',
    criteria: [
      {
        id: '文件存在',
        no: 1,
        name: '文件存在',
        pass: '与 spec 同目录；文件名 = spec 文件名去掉 `.md` 后 + `-testcase.md`（例：`2026-10-17-xxx-design.md` → `2026-10-17-xxx-design-testcase.md`）；spec 是目录形态时用目录内 `testcase.md`',
      },
      {
        id: '编写者独立',
        no: 2,
        name: '编写者独立',
        pass: '由 `senior-sdet` 子代理在**全新上下文**编写；编写者 ≠ spec 作者、≠ 施工者；文件头写「编写者 / 独立性声明」',
      },
      {
        id: '用例合格',
        no: 3,
        name: '用例合格',
        pass: '每条用例五要素齐（覆盖 / 前置 / 步骤 / 预期 / 判据）；负例与边界条数 ≥ 正例；覆盖总表每行能指回 spec 的节号或 R 编号',
      },
      {
        id: 'spec 外链',
        no: 4,
        name: 'spec 外链',
        pass: 'spec 的测试节只写「测什么 / 为什么」，并写「测试用例文件：`<路径>`」；**不内联具体用例**（两处维护必漂移）',
      },
      {
        id: '一起送审',
        no: 5,
        name: '一起送审',
        pass: 'spec 与 testcase 作为一件交付物送议会；测试评委主审用例质量，审计核字段与计数；缺 testcase 不得送议会、不得进 plan',
      },
    ],
    examples: {
      positive: [
        '**正例**：写 `2026-10-18-xxx-design.md` 时，同批派 `senior-sdet` 产出 `2026-10-18-xxx-testcase.md`；spec 测试节写「测试用例文件：`2026-10-18-xxx-testcase.md`」；议会开评时开卷清单同时列两份。',
      ],
      negative: [
        '**反例**：spec 写完直接进 plan，测试以后补（验收项等于没有验收）。',
        '**反例**：spec 作者自己顺手写用例、或在 spec 里内联用例表（自写自判 + 两处维护）。',
        '**反例**：议会只送 spec、不送 testcase（测试评委没有可审对象，字段核对落空）。',
      ],
    },
    why: '测试用例是验收的执行清单；没有它，spec 的验收项只是一句愿望，谁都可以说「做完了」。而这条规矩如果只写在按需加载的技能里，新 session 不加载该技能就等于没有——这正是「靠自觉必然漂移」的形态，必须由每轮自动加载的规则强制。',
    scope: '不因来源豁免——子代理、脚本、模板、AI 生成的 spec 同样要过；存量 spec 被修订并进入 plan 时同样要补。',
    conflict: '与「先写 spec、测试以后补」「这次先快速交付」「用例由 spec 作者顺手写」冲突时，以本规则为准。拿不准先停下说明，等确认再动。',
    exceptions: '只有一类：**2026-10-18 之前已定稿的存量 spec 不追溯**（用户 2026-10-18 裁定「存量不用管，以后一个个升级」）。除此之外没有例外——包括 spike 类 spec、包括目录形态 spec。',
    trigger: [
      '写或修改 spec 时；',
      '把 spec 送议会之前；',
      '让 spec 进入 `writing-plans` 或 plan 之前；',
      '评审/审计发现 spec 无 testcase 时，按本规则打回。',
    ],
    verification: [
      '送审前逐条核对五条判据：文件存在 → 编写者独立性声明在位 → 五要素与负例比例 → spec 外链在位 → 议会开卷清单含两份。',
      '`testcase-check.mjs` 落地后（PRD 的 S4），改为跑 `npm run check`：存在性、五要素、负例≥正例、覆盖列非空四条全绿才算通过；在脚本落地之前，以上人工核对结果必须写进送审说明。',
    ],
  };
}

export function renderBlocks(data) {
  const four = data.fourElements;
  return {
    fourElements: [
      `- **范围（在哪）**：${four.scope}`,
      `- **条件（何时）**：${four.condition}`,
      `- **动作（极性 = 义务）**：${four.action}`,
      `- **宾语（对什么）**：${four.object}`,
    ].join('\n'),
    criteriaTable: [
      '| # | 判据 | 怎么算合格 |',
      '|---|---|---|',
      ...data.criteria.map((c) => `| ${c.no} | **${c.name}** | ${c.pass} |`),
      '',
      '无子代理环境时：只能产出**草稿**并在文件头标「降级模式（角色卡内联）」，**不得定稿**——同一实例写、同一实例判，等于把自评偏差搬进验收。',
    ].join('\n'),
    examples: [
      ...data.examples.positive.map((line) => `- ${line}`),
      ...data.examples.negative.map((line) => `- ${line}`),
    ].join('\n'),
    trigger: data.trigger.map((line) => `- ${line}`).join('\n'),
    verification: data.verification.join('\n\n'),
  };
}

const SCALAR_KEYS = new Set([
  'title', 'sourceLine', 'criteriaIntro', 'why', 'scope', 'conflict', 'exceptions',
]);

const BLOCK_KEYS = new Set([
  'fourElements', 'criteriaTable', 'examples', 'trigger', 'verification',
]);

const APPLICABILITY = new Set(['sustained', 'conditional', 'mode-gated']);

const POLARITY = new Set(['obligation', 'prohibition']);

const SCALAR_FIELDS = ['title', 'sourceLine', 'criteriaIntro', 'why', 'scope', 'conflict', 'exceptions'];

const FOUR_ELEMENT_KEYS = ['scope', 'condition', 'action', 'object'];

function fail(code, fields) {
  const err = new Error(code);
  err.code = code;
  Object.assign(err, fields);
  return err;
}

function isBlank(value) {
  return typeof value !== 'string' || value.trim() === '' || value.trim() === 'TODO';
}

function hasBlockSource(data, key) {
  switch (key) {
    case 'fourElements':
      return data.fourElements !== null && typeof data.fourElements === 'object';
    case 'criteriaTable':
      return Array.isArray(data.criteria);
    case 'examples':
      return data.examples !== null && typeof data.examples === 'object';
    case 'trigger':
      return Array.isArray(data.trigger);
    case 'verification':
      return Array.isArray(data.verification);
    default:
      return false;
  }
}

export function assertTemplateClean(template) {
  const hit = TARGET_SIGNATURES.find((snippet) => template.includes(snippet));
  if (hit !== undefined) {
    throw fail('TemplateHardcoded', {
      snippet: hit,
      message: `模板含 target 硬编码正文（snippet=${hit}）`,
    });
  }
  const lines = template.split('\n');
  const allowed = (line) =>
    line === '' ||
    line.startsWith('# ') ||
    line.startsWith('## ') ||
    line.startsWith('> {{') ||
    /^\{\{[a-zA-Z]+\}\}$/.test(line) ||
    line.startsWith('|');
  const bad = lines.find((line) => !allowed(line));
  if (bad !== undefined) {
    throw fail('TemplateHardcoded', {
      snippet: bad.slice(0, 80),
      message: `模板含硬编码正文（snippet=${bad.slice(0, 80)}）`,
    });
  }
}

function lineNumberAt(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (text.charCodeAt(i) === 0x0a) line += 1;
  }
  return line;
}

function renderPlaceholder(data, key) {
  if (!SCALAR_KEYS.has(key) && !BLOCK_KEYS.has(key)) {
    throw fail('MissingPlaceholder', { key });
  }
  if (BLOCK_KEYS.has(key) && hasBlockSource(data, key)) {
    return renderBlocks(data)[key];
  }
  const value = data[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw fail('MissingPlaceholder', { key });
  }
  return value;
}

export function render(data, template) {
  let output = '';
  let cursor = 0;
  for (;;) {
    const open = template.indexOf('{{', cursor);
    if (open < 0) {
      output += template.slice(cursor);
      break;
    }
    output += template.slice(cursor, open);
    const close = template.indexOf('}}', open + 2);
    if (close < 0) {
      throw fail('TemplateSyntaxError', { line: lineNumberAt(template, open) });
    }
    const key = template.slice(open + 2, close);
    if (key.includes('{{') || !/^[A-Za-z][A-Za-z0-9]*$/.test(key)) {
      throw fail('TemplateSyntaxError', { line: lineNumberAt(template, open) });
    }
    output += renderPlaceholder(data, key);
    cursor = close + 2;
  }
  return output;
}

export function validateData(data) {
  if (!APPLICABILITY.has(data.applicability)) {
    throw fail('InvalidRuleType', { field: 'applicability', value: data.applicability });
  }
  if (!POLARITY.has(data.polarity)) {
    throw fail('InvalidRuleType', { field: 'polarity', value: data.polarity });
  }

  for (const slot of SCALAR_FIELDS) {
    if (isBlank(data[slot])) {
      throw fail('MissingSlot', { slot });
    }
  }

  for (const key of FOUR_ELEMENT_KEYS) {
    if (!data.fourElements || isBlank(data.fourElements[key])) {
      throw fail('MissingSlot', { slot: `fourElements.${key}` });
    }
  }

  if (!Array.isArray(data.criteria) || data.criteria.length === 0) {
    throw fail('MissingSlot', { slot: 'criteria' });
  }
  const seenIds = new Set();
  data.criteria.forEach((criterion, index) => {
    const name = criterion && criterion.name;
    const pass = criterion && criterion.pass;
    if (isBlank(name) || isBlank(pass)) {
      throw fail('MissingSlot', { slot: `criteria.${isBlank(name) ? index : name}.pass` });
    }
    const id = criterion.id ?? name;
    if (isBlank(id)) {
      throw fail('MissingSlot', { slot: `criteria.${index}.id` });
    }
    // spec §4.1：id 必须唯一；错误码表无专用码，按 InvalidRuleType(field=criteria.id) 报出。
    if (seenIds.has(id)) {
      throw fail('InvalidRuleType', { field: 'criteria.id', value: id });
    }
    seenIds.add(id);
  });

  for (const field of ['positive', 'negative']) {
    const list = data.examples && data.examples[field];
    if (!Array.isArray(list) || list.length === 0) {
      throw fail('MissingSlot', { slot: `examples.${field}` });
    }
    list.forEach((item, index) => {
      if (isBlank(item)) {
        throw fail('MissingSlot', { slot: `examples.${field}.${index}` });
      }
    });
  }

  for (const field of ['trigger', 'verification']) {
    if (!Array.isArray(data[field]) || data[field].length === 0) {
      throw fail('MissingSlot', { slot: field });
    }
    data[field].forEach((item, index) => {
      if (isBlank(item)) {
        throw fail('MissingSlot', { slot: `${field}.${index}` });
      }
    });
  }

  return data;
}
