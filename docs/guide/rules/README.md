# 全局规则清单：各自的作用与适用范围

> 阶段 2（2026-11-05）起：**保留集 = 1 条触发声明**（`rules/evidence-before-conclusion.md`）。
> 原规则已全量退役（共 23 份），原文逐字留底在 `docs/bak/rules/`（承接去向见各 bak 文件的状态头与「承接对照表」，搬运在阶段 3 收口）。
> 规则源在 `rules/`，改源即生效（运行时是只读链接；增删后跑 `aas sync`）。

## 保留集

### 1. `evidence-before-conclusion` — 说出口的结论必须有可核出处

- **什么时候生效**：输出任何结论（判断 / 建议 / 数据 / 事实陈述）之前。
- **核心判据**：按四站过闸，顺序固定，每站缺证据 = 不合格——① 出处站：带锚（`path:line` / 「命令 + 输出首行」/ 引用件路径）；② 范围站：写「适用于 X；不适用于 Y」+ 可追推导链（每步带锚）；③ 目标站：写「回答什么问题」；④ 数字站：含数字时附取数命令 + 复算结果。查不到时写「查了什么 + 退出码 + 输出首行」三件。
- **不管什么**：纯偏好 / 纯建议、不声称任何事实依据的表述不适用；复杂推导的材料细则按需加载 `assertion-quality`。

## 退役清单（原文在 `docs/bak/rules/`）

| 原规则 | 去向 |
|---|---|
| `how-i-must-reason` / `data-support-triple` | 合并 → 触发声明 + `assertion-quality` |
| `core-working-principles` | **已承接（2026-11-08）** → `skills/dev-workflow/references/meta-working-principles.md` |
| `plain-language-to-user` / `powershell-file-encoding` | 下沉 → 对应 skill / references |
| `reference-read-output-loop` / `skill-authoring-convention` / `skill-assets-convention` / `observable-criteria` / `rules-single-source` / `docs-convention`（「rule 里放什么」半） | 下沉 → `carrier-conventions` + `writing-after-docs` |
| `spec-testcase-gate` | 下沉 → `carrier-conventions`（阶段 3，待建） |
| `dev-workflow-mainline` / `landing-sweep` | **已承接（2026-11-08）** → `skills/dev-workflow/` |
| `global-ask-before-acting` / `import-guard` / `import-path-choice` / `styled-component-file` / `list-empty-state` / `ts-expect-error` / `vitest-queued-alternative` / `no-git-write` / `poll-deferred-at-start` | 删除（平台机制已覆盖 / 工具链专属 / 按需触发） |

逐条字符数与处置依据见 PRD `docs/prd/20261105182104-rule-refactor/prd/stage-1-rules-exit.md` §3。
