# retro-skills

一套把「开发过程犯过的错」沉淀成**自动生效规范**的 Agent Skill 套件：采集事实 → 复盘分析 → 归置落地（自动化 / rule / skill / memory），并维护一份跨项目累积的错题集。

## 安装

```bash
# 从本地路径
npx skills add <本仓库路径> --agent trae-cn -g
# 发布后从 GitHub
npx skills add SeedHuang/retro-skills --agent trae-cn -g
```

`-g` 为全局（跨项目）。安装默认使用 symlink 模式（单一事实源、便于更新）。

## 六个技能

| 技能 | 作用 |
|---|---|
| `using-retrospective` | 入口：判断时机、路由到对应环节 |
| `retro-collect` | 采集事实包（纯事实、零判断） |
| `retro-analyze` | 产出问题清单 / 根因 / 优先级 + KB 条目 |
| `retro-institutionalize` | 归置落地分诊（决策树 + provenance + ledger 先行；skill/修订类转发 evolving-skills） |
| `evolving-skills` | 载体进化（协议 + rule / skill / 自动化三张差异卡） |
| `managing-lessons-store` | 错题集库的初始化 / 迁移 / 推迟项轮询 |

## 数据与仓库分离

**本仓库不含任何个人数据。** 错题集（累积的教训库）存在**用户指定**的本地目录，位置记录在 `~/.agents/lessons.config.json`，**永不进入本仓库**。

## 设计文档

`docs/superpowers/specs/2026-09-27-retro-suite-design.md`

## License

MIT
