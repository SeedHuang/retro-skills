# 类型规则配置外置设计（review-loop L3 演进 spec）

> 目标：把「项目类型 ↔ path ↔ ignore」的对应关系从 review-init.mjs 内嵌常量**外置**到用户目录 `~/.retro-skills/reviewconfig/type-rules.json`，让用户不改技能代码就能加类型、调 ignore。
> 取代：`2026-10-10-review-loop-l3-project-type-design.md` §四「技能内置常量」部分 + §五「三层预设」的落点（其余不变：用户选类型、项目派生 rule.json、叠加语义 `merge_system_rule: true`）。
> 演进：v2.1（三层预设，2026-10-10 定稿）→ 本 spec（配置外置，2026-10-11）。

---

## 一、动机与现状问题

### 现状：三层预设的「类型 ↔ path ↔ ignore」对应关系不完整

| 层 | 有没有 name+path+ignore 完整配置 | 放哪 |
|---|---|---|
| `languagePresets`（语言级，6 个） | ✅ 有（python-backend 等，各带 path + ignore） | review-init.mjs 常量 |
| `ecosystemPresets`（生态级，合并前 12 个 → 合并后 11 个） | ❌ **没有**——纯名字字符串，无 path、无 ignore | review-init.mjs 常量 |
| `activeProjectTypes`（个人累积，种子 6 个） | ✅ 有（node-cli 等，各带 path + ignore） | `~/.retro-skills/reviewconfig/activeProjectTypes.config.json` |

**问题 1（功能缺口）**：ecosystemPresets 里的类型（如「Agent Skill 项目」「React H5」）只有名字，选中后没有配套 rule 配置，无法直接派生 rule.json——想用它们，得走「无候选 → 新建类型条目」的路，现场问忽略声明。

**问题 2（改造成本）**：预设全写在 review-init.mjs 代码里，用户想加类型 / 调 ignore 必须改技能代码，不符合「用户配置不进代码」的既有原则（`activeProjectTypes.config.json` 已经在用户目录，预设却还在代码里，两处规则来源不一致）。

### 用户实际用到的生态类型（2026-10-11 确认）

12 个生态类型里用户用到 8 个：纯静态 H5（1）、React H5（2）、React（6）、node（8）、electron（9）、CLI、纯静态页面（11，**合并后并入「纯静态 H5」**）、Agent Skill 项目（12）。
未用到：Vue H5、小程序 H5、Angular H5、Vue。

---

## 二、设计：配置外置到 type-rules.json

### 新文件

| 项 | 值 |
|---|---|
| 路径 | `~/.retro-skills/reviewconfig/type-rules.json` |
| 装什么 | 全部预设类型的 `name / path / ignore` 映射（语言级 6 + 生态级合并后 11 + 种子 6） |
| 进 git | **否**（用户机器配置，与 `activeProjectTypes.config.json` 同性质） |
| 谁写入 | review-init.mjs 首次初始化（**不存在才写，已存在只读不碰**） |

### 写入幂等（硬约束，防共享目录覆盖）

`~/.retro-skills` 是**多项目共享**的用户目录，任何项目跑 review-init 都会经过它。必须写死：

```
ensureTypeRules() {
  if 文件不存在 → 写入内置默认（临时文件 + 原子改名）
  if 文件已存在 → 读出来用，绝不写；但读失败 / JSON 解析失败 / 形状非法 → 报错停止，不自动覆盖（与 activeProjectTypes.config.json 同口径，防丢用户数据）
}
```

- 任何人、任何项目、任何一次 review-init，都只是**读**它；只有**第一次**会写入。
- 用户改过的配置，后续 review-init 一律不覆盖。
- **重置方式**：手动删除该文件，下次 review-init 重新写入内置默认（与 `activeProjectTypes.config.json` 行为一致）。

### 文件形态

```json
{
  "languagePresets": [
    { "name": "python-backend", "path": "**/*.py", "ignore": "Python 后端，无前端，忽略 React/前端类检查" },
    { "name": "python-data",    "path": "**/*.py", "ignore": "Python 数据处理，无前端，忽略 React/前端类检查" },
    { "name": "go-backend",     "path": "**/*.go", "ignore": "Go 后端，无前端，忽略 React/前端类检查" },
    { "name": "java-backend",   "path": "**/*.java", "ignore": "Java 后端，无前端，忽略 React/前端类检查" },
    { "name": "csharp-backend", "path": "**/*.cs", "ignore": "C# 后端，无前端，忽略 React/前端类检查" },
    { "name": "rust",           "path": "**/*.rs", "ignore": "Rust，无前端，忽略 React/前端类检查" }
  ],
  "ecosystemPresets": [
    { "name": "纯静态 H5",  "path": "**/*.{html,js,mjs,cjs}", "ignore": "纯静态页面（H5），无框架，忽略框架类检查（React/Vue/Hooks 等）" },
    { "name": "React H5",   "path": "**/*.{js,mjs,cjs,ts,tsx,jsx}", "ignore": "" },
    { "name": "Vue H5",     "path": "**/*.{js,mjs,cjs,ts,tsx,jsx}", "ignore": "Vue 项目，无 React 代码，忽略 React 专属检查项（React Best Practices / Hooks / useState / useEffect）" },
    { "name": "小程序 H5",  "path": "**/*.{js,mjs,cjs,ts,tsx,jsx}", "ignore": "小程序（非 Web 页面），无 React、无浏览器 DOM，忽略 React 类检查（Hooks / useState / useEffect）与 Web DOM 类检查（XSS / innerHTML / document.write）" },
    { "name": "Angular H5", "path": "**/*.{js,mjs,cjs,ts,tsx,jsx}", "ignore": "Angular 项目，无 React 代码，忽略 React 专属检查项（React Best Practices / Hooks / useState / useEffect）" },
    { "name": "React",      "path": "**/*.{js,mjs,cjs,ts,tsx,jsx}", "ignore": "" },
    { "name": "Vue",        "path": "**/*.{js,mjs,cjs,ts,tsx,jsx}", "ignore": "Vue 项目，无 React 代码，忽略 React 专属检查项（React Best Practices / Hooks / useState / useEffect）" },
    { "name": "node",       "path": "**/*.{js,mjs,cjs,ts,tsx,jsx}", "ignore": "无前端，忽略 React 类检查" },
    { "name": "electron",   "path": "**/*.{js,mjs,cjs,ts,tsx,jsx}", "ignore": "桌面端（electron），无前端 Web 检查，忽略 React 类检查" },
    { "name": "CLI",        "path": "**/*.{js,mjs,cjs,ts,tsx,jsx}", "ignore": "CLI 工具，无前端，忽略 React 类检查" },
    { "name": "Agent Skill 项目", "path": "**/*.{js,mjs,cjs,ts,tsx,jsx}", "ignore": "Agent Skill 项目（Node 脚本 + Markdown 主导），无前端，忽略 React 类检查" }
  ],
  "seedProjectTypes": [
    { "name": "node-cli",            "path": "**/*.{js,mjs,cjs,ts,tsx,jsx}", "ignore": "无前端，忽略 React 类检查（Hooks / useState / XSS 等）" },
    { "name": "electron",            "path": "**/*.{js,mjs,cjs,ts,tsx,jsx}", "ignore": "桌面端（electron），无前端 Web 检查，忽略 React 类检查" },
    { "name": "react",               "path": "**/*.{js,mjs,cjs,ts,tsx,jsx}", "ignore": "" },
    { "name": "cli",                 "path": "**/*.{js,mjs,cjs,ts,tsx,jsx}", "ignore": "CLI 工具，无前端，忽略 React 类检查" },
    { "name": "electron-monorepo",   "path": "**/*.{js,mjs,cjs,ts,tsx,jsx}", "ignore": "桌面端 monorepo，忽略 React 类检查" },
    { "name": "react-node-monorepo", "path": "**/*.{js,mjs,cjs,ts,tsx,jsx}", "ignore": "前后端同仓，不忽略前端检查；后端代码的 React 噪音走 A2 处置侧过滤" }
  ]
}
```

**说明**：
- **合并「纯静态 H5」+「纯静态页面」为一个**（用户 2026-10-11 裁定）：两者 path/ignore 一致，原 12 个生态类型 → 11 个。
- **React H5 / React 的 ignore 留空**：有 React 代码，让 OCR 系统规则照常抓 React 类真问题（前端检查抓真问题）。
- **Angular H5 / Vue H5 / Vue 的 ignore 忽略 React 专属项**（用户 2026-10-11 裁定，Angular 方案统一处理 Vue）：这些是「有前端但无 React」的框架——OCR 的 JS 规则是「JS/TS 生态通用模板」，把 React Best Practices / Hooks / useState / useEffect 嵌在里面（实测 `ocr rules check` 确认），Angular/Vue 项目没有 React 代码，报这些是凑数噪音 → 忽略 React 专属项，但保留通用前端检查（DOM / XSS / 死代码等 Angular/Vue 同样适用）。
- **小程序 H5 更彻底**（用户 2026-10-11 要求修正措辞）：无 React 也无浏览器 DOM → React 专属项 + Web DOM 类检查（XSS / innerHTML / document.write）都忽略。
- 生态级补全 path 后，选中即能直接派生 rule.json，不再需要「当作无候选新建」。

### review-init.mjs 改造

| 现状 | 改为 |
|---|---|
| `languagePresets` / `ecosystemPresets` 常量内嵌 | 删除常量，改为读 `type-rules.json` |
| `seedProjectTypes` 常量内嵌（写进注册表的种子） | 改为读 `type-rules.json` 的 `seedProjectTypes` 段 |
| 候选集 = 三层 union | 不变（从 type-rules.json 读三层，去重逻辑保留） |

**内置默认放哪**：review-init.mjs 内嵌一份「内置默认 type-rules 数据」作为 fallback——文件不存在时用它初始化；文件已存在时只读文件。内置默认与「落盘内容」必须一致（单一来源，防漂移），落盘后内置默认只在「文件被删后重建」时用到。

### 与 L3 spec §四/§五 的关系

| L3 spec 原内容 | 本 spec 的处理 |
|---|---|
| §四 全局注册表 `activeProjectTypes.config.json` | **不变**（个人累积仍在那） |
| §四 项目派生 `.opencodereview/rule.json` | **不变** |
| §五 三层预设「技能内置常量」 | **取代**：语言级 + 生态级外置到 type-rules.json；个人累积仍在注册表 |
| §五 `ecosystemPresets` 纯名字 | **取代**：补全 path + ignore，合并 1/11 |

---

## 三、风险与应对

| 风险 | 应对 |
|---|---|
| **共享目录被覆盖**（任何人 review-init 都碰它） | 写死「不存在才写、已存在只读不碰」（§二 写入幂等），实测验证二次运行不覆盖 |
| 内置默认与落盘内容漂移 | 单一来源：内置默认 = 初始化时写出的那份内容，落盘后代码里的默认只在「重建」时用 |
| 用户改了 type-rules.json 想恢复默认 | 手动删文件 → 下次 review-init 重建（与 activeProjectTypes 行为一致，写进操作卡） |
| 生态级 ignore 配错（如 React H5 不该忽略前端却忽略了） | React 家族 ignore 留空（§二 说明），只在「明确无前端」的类型上写忽略声明 |
| 老用户尚无 type-rules.json | 首次跑 review-init 自动创建；已有 `activeProjectTypes.config.json` 不受影响（两文件职责不同） |

---

## 四、验证方式

| 验证项 | 怎么验 |
|---|---|
| 首次初始化写入 | 删 type-rules.json → 跑 review-init → 文件出现且内容 = 内置默认 |
| 幂等不覆盖 | 改 type-rules.json（如改 ignore）→ 再跑 review-init → 文件保持用户改的，没被还原 |
| 候选集正确 | review-init 输出 = 语言级 6 + 生态级 11 + 个人累积（个人累积 = 注册表内容，含初始化时从 seedProjectTypes 写入的种子 6 条；去重后） |
| 派生 rule.json | 选中 Agent Skill 项目 → 派生 `.opencodereview/rule.json` → `ocr rules check` 显示 `Source: Project` |
| 语法/体检 | `node --check review-init.mjs` + `check.mjs` 0 findings |

---

## 五、落地改动清单

1. 新建 review-init.mjs 内置默认 type-rules 数据（§二 形态）+ `ensureTypeRules()`（不存在才写）
2. review-init.mjs 删 `languagePresets` / `ecosystemPresets` / `seedProjectTypes` 常量，改从 type-rules.json 读三层
3. 候选集去重逻辑保留（active 覆盖 language、对象覆盖字符串、大小写归一）
4. 同步 `skills/review-loop/references/project-type.md` 操作卡：三层预设的落点、初始化步骤、重置方式
5. 同步 review-init.mjs 头注释职责描述
