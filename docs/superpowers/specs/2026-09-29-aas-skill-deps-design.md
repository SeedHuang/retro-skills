# aas 技能依赖解析与源解析统一 — 设计 spec

> 收拢自 2026-09-29 设计对话（brainstorming）。跨两个仓库：`retro-skills`（依赖清单数据）+ `agent-assets-sync`（目录 / 解析器 / `--islocal` / CLI 版本管理）。
> 本文是唯一权威设计；`agent-assets-sync` 的 `docs/design.md` 只补指针，不抄写（双份真相禁令）。

## 1. 为什么（problem statement）

### 1.1 三个真实痛点

| # | 痛点 | 具体形态 | 现状 |
|---|---|---|---|
| P1 | **单技能安装会缺公共引用** | `npx skills add` / `aas add` 只把选中的技能文件夹拷进运行时；技能 A 引用技能 B 文件夹里的 `references/`（如 multi-lens → evolving-skills 的 `review-flywheel.md`）时，单装 A 就扑空 | 跨技能引用只在"整套装"下成立，是隐性契约，无人校验 |
| P2 | **技能依赖的 CLI 版本没人管** | 技能运行时需要某个 CLI，装没装、版本够不够，全靠人记得 | 无任何检查点 |
| P3 | **"远程还是本地"的源解析两套心智** | 本地调试要测未提交改动，但默认解析指远程；远程/本地判定散落在工具各处 | aas 的 `parseSource` 只认 URL/路径/配置短名，不认 GitHub 短写 |

### 1.2 关键洞察（为什么这样设计）

- **npx 用户本来就没有依赖解析**——市面上所有 skill 都不带依赖机制。所以依赖清单**不放进技能文件夹**（npx 只拷 `skills/<名>/`，永远带不走它），npx 用户保持行业标准行为。
- **依赖解析是 aas 的差异化优势**——只有用 aas 的人才享受自动装依赖、自动管 CLI 版本。
- **"远程还是本地"不该让依赖文件自己判断**——依赖默认继承"当前 add 用的那个源"，判定收敛到 aas 现有的 `parseSource` 一处。

## 2. 核心决定（不可违反）

| # | 决定 | 为什么（不这么做会发生什么） |
|---|---|---|
| R1 | 依赖清单放仓库根 `skilldependencies/`，**每个技能一份文件，文件名 = 技能名** | 放技能文件夹内会被 npx 拷走、污染发布物，且给 npx 用户制造"有依赖机制"的错觉；按名定位 O(1)，aas 装完技能后直接读对应文件 |
| R2 | 依赖条目**默认不写 source = 继承当前 add 的源**；跨仓库依赖显式写完整 URL | 本地 add 就本地解析、远程 add 就远程解析，歧义自动消失；显式 source 走现有 `parseSource`，判定统一 |
| R3 | 下载引擎用 aas 现有 `cloneToCache` + `installOne`；`npx skills add` **只作为目录未命中时的回退** | aas 引擎非交互、可测、单一账本；npx 是交互式的、写自己的锁，两套记账并存必乱 |
| R4 | `--islocal` 是**本地调试必加**开关；不加（默认）一律指向远程（显式本地路径不在此列——用户明说用本地文件，无需开关） | 默认语义 = 发布态（指向远程）；`--islocal` = 开发态（指向本地工作副本，能测未提交改动） |
| R5 | `--islocal` 本地解析顺序：目录条目的 `localPath` → 缓存 `~/.aas/repos/`；都没有 → 报「本地未找到：<名>」，**绝不联网** | localPath 是工作副本（最新）；缓存是历史快照（兜底）；联网会绕过"本地调试"意图 |
| R6 | CLI 依赖"能更新就更新"，**任一步失败打印完整错误（命令原文+退出码+stderr），不中断整批**，最后汇总失败清单 | 单用户现状，自动化优先；错误可见即可排查，一次批量尽量跑完 |
| R7 | 依赖解析**递归**（BFS + visited 防环） | 依赖的依赖也要装全；不防环会死循环 |
| R8 | 只动清单里声明、aas 自己管理的 CLI；**系统工具不声明就不碰** | 防止 aas 自动升 node/git 搞坏环境——升级权限只授予"清单点名的、aas 可管理的"CLI |
| R9 | 技能依赖**不设版本门禁**（只 ensure + 刷新）；版本检查只用于 CLI 依赖 | 技能没有统一的版本号来源；引入版本门禁会卡住"已装即最新"的链接形态语义 |

## 3. 架构总览

```
retro-skills 仓库                          agent-assets-sync（aas）
┌────────────────────────┐                ┌─────────────────────────────┐
│ skills/<名>/           │  被 aas 读取   │ aas add <名>                 │
│   （技能本体，纯净）     │ ─────────────► │   ├─ 目录命中 → 按目录源装    │
│ skilldependencies/     │                │   ├─ 目录未命中 → 回退 npx    │
│   <技能名>.json        │                │   └─ --islocal → 只从本地解析  │
│   （依赖清单）          │                │ aas update --all             │
└────────────────────────┘                │   └─ 重校验所有已装技能依赖    │
                                          │ 依赖解析器（BFS + CLI 版本）   │
                                          └─────────────────────────────┘
```

- **retro-skills**：只承载数据（`skilldependencies/`），不含解析逻辑。
- **agent-assets-sync**：承载全部逻辑（目录、解析器、`--islocal`、CLI 版本管理、npx 回退）。
- 单向依赖：aas → 清单。清单不依赖 aas。

## 4. 数据模型

### 4.1 `skilldependencies/manifest.json`（目录声明）

```json
{
  "schemaVersion": 1,
  "skills": ["multi-lens-review", "prd-to-specs", "retro-collect", "retro-analyze", "retro-institutionalize", "evolving-skills", "using-retrospective", "managing-lessons-store"]
}
```

- `schemaVersion`：必填，整数，当前 `1`。aas 读到不支持的版本 → 报错，不静默忽略。
- `skills`：本仓库含依赖清单的技能名清单（供 aas 快速枚举；也作为"仓库声明了依赖机制"的信号）。

### 4.2 `skilldependencies/<技能名>.json`（每技能依赖）

```json
{
  "schemaVersion": 1,
  "skill": "multi-lens-review",
  "dependencies": {
    "skills": [
      { "name": "evolving-skills" },
      { "name": "find-skills", "source": "https://github.com/vercel-labs/skills.git" }
    ],
    "cli": [
      { "name": "prettier", "versionSource": "npm", "minVersion": "2.0.0" }
    ]
  }
}
```

> 示例仅示意字段结构。**不要把正在运行的 aas 自己写进 cli 依赖**（aas 更新自己是危险操作，见 §5.3 步 4 / B2）。

字段规则：

| 字段 | 必填 | 说明 | 校验失败行为 |
|---|---|---|---|
| `schemaVersion` | 是 | 整数，当前 `1` | 非 `1` → 拒绝该清单并报错 |
| `skill` | 是 | 本技能名，须与文件名一致 | 不一致 → 报错 |
| `dependencies.skills[].name` | 是 | 目标技能名 | 缺 → 报错 |
| `dependencies.skills[].source` | 否 | 省略 = 继承当前源；写 = 跨仓库，须完整 URL / 本地路径 | 写了无法解析 → 报错 |
| `dependencies.cli[].name` | 是 | CLI 名（npm 包名，也是可执行名） | 缺 → 报错 |
| `dependencies.cli[].versionSource` | 是 | 当前只支持 `"npm"` | 其他值 → 报错（YAGNI，见 §8） |
| `dependencies.cli[].minVersion` | 否 | semver 下限；省略 = 只保证存在 | 非法 semver → 报错 |
| `dependencies` | 否 | 无依赖可省略或写空对象 | — |

### 4.3 `sync.config.json` 新增 `skills` 目录（源解析统一）

```json
{
  "skills": {
    "multi-lens-review": {
      "source": "https://github.com/seedhuang/retro-skills.git",
      "localPath": "D:/Seed/retro-skills"
    },
    "evolving-skills": {
      "source": "https://github.com/seedhuang/retro-skills.git",
      "localPath": "D:/Seed/retro-skills"
    }
  }
}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| key（短名） | — | 技能名或源短名；`aas add <key>` 按它查目录 |
| `source` | 是 | 远程/本地源（默认解析用） |
| `localPath` | 否 | 本地工作副本路径（`--islocal` 优先用它） |

条目校验（B4）：缺 `source` → 报错并指出条目名；`localPath` 指向不存在的路径 → 仅在 `--islocal` 时按「本地未找到」处理，默认解析时忽略 `localPath`。

## 5. 机制

### 5.1 `aas add <名>` 的源解析（统一入口）

```
1. 名字是本地存在的路径        → 本地源（现有 parseSource，isLocal=true）
2. 名字在 sync.config.json 的 skills 目录里：
     默认     → 用条目 source（远程/本地由形态判定）
     --islocal → 只从本地解析：条目 localPath（存在）→ 否则缓存 → 否则报「本地未找到：<名>」
3. 名字不在目录里：
     --islocal → 直接报「本地未找到：<名>」（绝不联网，R5）
     默认      → 原样交给 `npx skills add <名> -g -y`（-y 免交互，避免自动化挂起；npx 认 owner/repo、URL、本地路径）
```

- **顺带给 `parseSource` 加 GitHub 短写支持**（`owner/repo` → `https://github.com/owner/repo.git`），与 npx 对齐；依赖文件的 `source` 建议写完整 URL（两个工具都认）。

### 5.2 依赖解析（`aas add` 装完后自动执行；`aas update --all` 重校验）

**清单读取源 = 技能安装源（同一解析上下文，M1）**：`--islocal` → 读 `<localPath>/skilldependencies/<S>.json`；默认 → 读 clone 缓存 `~/.aas/repos/<key>/skilldependencies/<S>.json`。**绝不对"本地装的技能"读"远程克隆的清单"**——否则本地调试会解析到远程依赖，测不到未提交的依赖改动。

```
1. 读清单；schema 校验失败 → 记错误，继续下一个技能（不中断批次）
2. 对 dependencies.skills 里的每个 D：
     a. D.source 存在 → parseSource(D.source) → clone 到缓存
     b. D.source 省略 → 复用当前解析上下文（默认=远程源 / --islocal=localPath 源）
     c. D 已在账本 → 刷新（同 aas update <D> 语义）；未装且运行时无同名 → installOne 装
     d. D 运行时已有同名但账本未记录（npx 装 / 手工放）→ 记错误「已存在但非 aas 管理：用 aas import 收编或手动移除」，不覆盖、不中断批次（B1）
     e. 递归 D 的依赖（BFS；visited 集 = 技能名 + 源，防环）
3. 对 dependencies.cli 里的每个 C：见 §5.3
4. 输出汇总：新增 X / 刷新 Y / CLI 更新 Z / 失败清单（每条：名字 + 命令原文 + 退出码 + stderr 尾部）+ 本次清单读取源与缓存 commit（若缓存是复用的旧快照 → 提示「缓存可能过期，如需最新请先清理缓存」，B3）
```

### 5.3 CLI 版本检查与更新

```
1. 本地版本：跑 `<C> --version`（失败 → 记错误「无法获取本地版本」）
2. 远端版本：`npm view <C> version`（失败 → 记错误「无法获取远端版本」）
3. 判定更新：
     minVersion 存在且本地 < minVersion   → 更新
     或 远端 > 本地（semver 比较）        → 更新
     本地缺失                            → 安装
4. **`<C>` 是正在运行的 aas 自身 → 不自动更新**，记错误并提示「请手动 npm install -g <C>@latest 后重跑」（B2）
5. 更新命令：`npm install -g <C>@latest`（**不可逆**：升级后降级需手动 `npm install -g <C>@<旧版>`，O1）
6. 任何一步失败 → 记详细错误（命令原文 + 退出码 + stderr 尾部），不中断批次
```

- 只处理清单里声明的 CLI；`node` / `git` 等系统工具**不出现在清单里就不碰**（R8）。
- 版本比较用 semver 规则；本地版本无法解析 → 当"未知"，按"需要更新"处理并提示。

## 6. 硬约束

1. **清单不放进 `skills/<名>/`**——发布物纯净 + npx 用户不带依赖机制（R1）。
2. **依赖默认继承当前源**——依赖文件不为"远程/本地"自作主张（R2）。
3. **`--islocal` 绝不联网**——解析不到就报「本地未找到」，不自动降级远程（R5）。
4. **系统工具不声明不碰**——CLI 升级权限只授予清单点名的（R8）。
5. **CLI 失败不中断批次**——错误要完整、可排查（R6）。
6. **技能依赖无版本门禁**——只 ensure + 刷新（R9）。
7. **aas 账本是唯一安装账本**——npx 只作回退，不并记账（R3）。
8. **清单读取源与技能安装源一致**——`--islocal` 读 `localPath` 的清单，默认读 clone 缓存的清单，绝不错配（M1）。
9. **不自动更新正在运行的 aas 自身**——命中则记错误并提示手动更新（B2）。
10. **部署前置（O6）**：CLI 更新需 npm 全局写权限；npx 回退需 npx 可用且网络可达；前置不满足 → 按 §5.3 详细报错，不静默。

## 7. 测试

| 测什么 | 为什么 |
|---|---|
| manifest schema 校验（缺字段 / schemaVersion≠1 / skill 名与文件名不符） | 清单是解析的输入，坏了要有明确报错而非静默 |
| 依赖 BFS（递归、visited 防环、同源去重） | 环和重复是解析器最易错处 |
| source 继承 vs 显式 source 两条路径 | R2 的核心行为 |
| `--islocal` 三态：localPath 命中 / 缓存兜底 / 都没有报「本地未找到」 | R5 的完整分支 |
| CLI 版本：semver 比较、远端>本地、本地缺失、minVersion 下限 | 判定逻辑的边界 |
| 错误路径：clone 失败 / npm view 失败 / npm install 失败 → 详细错误且批次继续 | R6 的验收标准 |
| `parseSource` 短写支持（`owner/repo` → GitHub URL） | 与 npx 对齐的新能力 |
| `--islocal` 读 localPath 的清单（而非远程缓存） | M1 的回归防线 |
| 依赖技能已存在但非本账本 → 记错误、不覆盖、批次继续 | B1 的行为验收 |
| CLI 依赖 == 运行中的 aas → 不自动更新、提示手动 | B2 的行为验收 |
| 目录条目缺 source / localPath 不存在 → 明确报错 | B4 的行为验收 |
| 复用旧缓存时输出 commit + 过期提示 | B3 的行为验收 |

## 8. 不在这一轮（YAGNI，每条带理由）

- **git tag 版本源**：CLI 版本源只做 `npm`。理由：当前依赖的 CLI 都是 npm 包；真有 git 装的工具再加。
- **npx 包装为下载引擎**：npx 只作目录未命中的回退，不做主引擎。理由：aas 现有引擎非交互、可测、单一账本（R3）。
- **技能版本号门禁**：技能依赖不做 minVersion。理由：技能无统一版本号来源（R9）。
- **多编辑器 / 多用户配置化**：目录与 `--islocal` 只服务当前单编辑器、单用户。理由：使用方当前只有一人。
- **非 Windows 平台**：junction/路径语义只保证 Windows。理由：现行环境即 Windows。
- **清单的集中校验命令**：不加 `aas doctor` 之类的清单体检。理由：解析时报错已覆盖，触发信号"清单写错导致装坏 ≥ 1 次"未到。

## 9. 落地清单（两仓库分工）

| 仓库 | 交付物 |
|---|---|
| retro-skills | `skilldependencies/manifest.json` + 8 个 `<技能名>.json`（按真实跨技能引用与运行时 CLI 依赖填写） |
| agent-assets-sync | ① `sync.config.json` 支持 `skills` 目录 + 现有 8 技能条目；② `parseSource` 短写支持；③ `src/catalog.mjs`（目录解析 + `--islocal` + B4 校验）；④ `src/deps.mjs`（依赖解析 BFS + 环检测 + M1 清单读取源一致性 + B1/B3）；⑤ `src/cli-version.mjs`（CLI 版本检查/更新 + B2）；⑥ 目录未命中回退 `npx skills add`；⑦ 详细错误汇总输出；⑧ 对应测试 |

## 10. 评审记录（2026-09-29 multi-lens-review）

### 已修复（第 1 轮 P0 / P1）

| # | 级别 | 问题 | 落点 |
|---|---|---|---|
| M1 | 矛盾 | 清单读取源与技能安装源不一致（--islocal 读到远程清单） | §5.2 / §6 硬约束 8 / §7 测试 |
| B1 | 盲点 | 依赖技能"运行时已有但非本账本"行为未定义 | §5.2 步 2d |
| B2 | 盲点 | aas 可能尝试更新正在运行的自己 | §5.3 步 4 / §4.2 示例 |
| B3 | 盲点 | 缓存复用导致依赖清单可能过期 | §5.2 步 4 |
| B4 | 盲点 | 目录条目字段校验未定义 | §4.3 |

### P2 处置（三态，禁止凭对话流失）

| # | 项 | 处置 | 落点 / 触发信号 |
|---|---|---|---|
| O1 | CLI 升级不可逆但自动执行 | 采纳 | §5.3 不可逆说明 + 降级路径 |
| O2 | 每次 add 刷新全部依赖成本 / 依赖关系不入账本 | 候选 | 信号：刷新显著拖慢 add，或需审计依赖来源时 |
| O3 | manifest 列表与实文件/技能目录一致性无校验 | 候选 | 信号：不一致导致装错 ≥ 1 次 |
| O4 | 解析器代码组织未定 | 采纳 | §9 拆 src/catalog.mjs / deps.mjs / cli-version.mjs |
| O5 | scoped 包可执行名≠包名 | 关闭 | 当前无 scoped CLI 依赖；`npm view` 以包名为准 |
| O6 | 部署前置条件未列 | 采纳 | §6 硬约束 10 |

### 收敛判定

第 1 轮发现 1 矛盾 + 4 盲点，全部修复（见上表）；修复后重跑手法 3（§6/§7 交叉核对）零新增 P0/P1。按收敛协议，需再跑 1 轮确认「连续两轮零新增 P0/P1」后判定收敛。
