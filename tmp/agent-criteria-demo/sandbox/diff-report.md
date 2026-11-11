# P1 差异报告

## 总览

| 席 | 类型 | 沙箱行数 | 现役行数 | 沙箱字符 | 现役字符 | 段数（沙箱/现役） | 边界形态 | 边界一致 | 输出格式 |
|---|---|---|---|---|---|---|---|---|---|
| detective-observer | RespondentModel | 89 | 81 | 2861 | 2806 | 10/7 | policy | 是 | 有 |
| evidence-reader | RespondentModel | 82 | 67 | 2569 | 1780 | 9/7 | policy | 否 | 有 |
| respondent-architect | RespondentModel | 78 | 63 | 2324 | 1253 | 8/7 | policy | 否 | 有 |
| respondent-dev | RespondentModel | 78 | 63 | 2441 | 1256 | 8/7 | policy | 否 | 有 |
| reviewer-actuary | ReviewerModel | 94 | 75 | 2854 | 1913 | 9/7 | policy | 否 | 有 |
| reviewer-ai | ReviewerModel | 97 | 78 | 3074 | 2143 | 9/7 | policy | 否 | 有 |
| reviewer-audit | AuditorModel | 109 | 99 | 3667 | 3344 | 10/7 | policy | 是 | 有 |
| reviewer-product | ReviewerModel | 76 | 77 | 1583 | 2007 | 8/7 | default | 是 | 有 |
| reviewer-interaction | ReviewerModel | 76 | 77 | 1592 | 2018 | 8/7 | default | 是 | 有 |
| reviewer-ui | ReviewerModel | 74 | 75 | 1487 | 1914 | 8/7 | default | 是 | 有 |
| reviewer-frontend | ReviewerModel | 76 | 77 | 1596 | 2030 | 8/7 | default | 是 | 有 |
| senior-sdet | ReviewerModel | 85 | 86 | 2663 | 3142 | 8/7 | policy | 是 | 有 |
| speaker | ReviewerModel | 80 | 65 | 2296 | 1279 | 8/7 | policy | 否 | 有 |

## 段级差异

| 席 | 段 | 状态 | 字符差 |
|---|---|---|---|
| detective-observer | 职责 | 文本不同 | 4 |
| detective-observer | 一定会 | 文本不同 | -176 |
| detective-observer | 禁止 | 文本不同 | -78 |
| detective-observer | 冲突裁决 | 文本不同 | -25 |
| detective-observer | 本席清单 | 文本不同 | 38 |
| detective-observer | 输出格式 | 文本不同 | -87 |
| detective-observer | 产出 | 仅沙箱 | - |
| detective-observer | 权限 | 仅沙箱 | - |
| detective-observer | 越界处置 | 仅沙箱 | - |
| detective-observer | 边界 | 一致 | 0 |
| evidence-reader | 职责 | 文本不同 | 10 |
| evidence-reader | 一定会 | 文本不同 | -265 |
| evidence-reader | 禁止 | 文本不同 | -78 |
| evidence-reader | 冲突裁决 | 文本不同 | -25 |
| evidence-reader | 本席清单 | 文本不同 | 24 |
| evidence-reader | 输出格式 | 文本不同 | -101 |
| evidence-reader | 产出 | 仅沙箱 | - |
| evidence-reader | 权限 | 仅沙箱 | - |
| evidence-reader | 边界 | 文本不同 | 1032 |
| respondent-architect | 职责 | 文本不同 | 13 |
| respondent-architect | 一定会 | 文本不同 | -25 |
| respondent-architect | 冲突裁决 | 文本不同 | -25 |
| respondent-architect | 本席清单 | 文本不同 | 14 |
| respondent-architect | 输出格式 | 文本不同 | -134 |
| respondent-architect | 产出 | 仅沙箱 | - |
| respondent-architect | 权限 | 仅沙箱 | - |
| respondent-architect | 边界 | 文本不同 | 1046 |
| respondent-architect | 禁止 | 仅现役 | - |
| respondent-dev | 职责 | 文本不同 | -1 |
| respondent-dev | 一定会 | 文本不同 | -25 |
| respondent-dev | 冲突裁决 | 文本不同 | -25 |
| respondent-dev | 本席清单 | 文本不同 | 13 |
| respondent-dev | 输出格式 | 文本不同 | -134 |
| respondent-dev | 产出 | 仅沙箱 | - |
| respondent-dev | 权限 | 仅沙箱 | - |
| respondent-dev | 边界 | 文本不同 | 1061 |
| respondent-dev | 禁止 | 仅现役 | - |
| reviewer-actuary | 职责 | 文本不同 | 22 |
| reviewer-actuary | 一定会 | 文本不同 | -175 |
| reviewer-actuary | 禁止 | 文本不同 | 18 |
| reviewer-actuary | 冲突裁决 | 文本不同 | -25 |
| reviewer-actuary | 本席清单 | 文本不同 | 45 |
| reviewer-actuary | 输出格式 | 文本不同 | -194 |
| reviewer-actuary | 产出 | 仅沙箱 | - |
| reviewer-actuary | 权限 | 仅沙箱 | - |
| reviewer-actuary | 边界 | 文本不同 | 1055 |
| reviewer-ai | 职责 | 文本不同 | 20 |
| reviewer-ai | 一定会 | 文本不同 | -175 |
| reviewer-ai | 禁止 | 文本不同 | 18 |
| reviewer-ai | 冲突裁决 | 文本不同 | -25 |
| reviewer-ai | 本席清单 | 文本不同 | 37 |
| reviewer-ai | 输出格式 | 文本不同 | -194 |
| reviewer-ai | 产出 | 仅沙箱 | - |
| reviewer-ai | 权限 | 仅沙箱 | - |
| reviewer-ai | 边界 | 文本不同 | 1055 |
| reviewer-audit | 职责 | 文本不同 | 44 |
| reviewer-audit | 一定会 | 文本不同 | -174 |
| reviewer-audit | 禁止 | 文本不同 | -78 |
| reviewer-audit | 冲突裁决 | 文本不同 | -25 |
| reviewer-audit | 本席清单 | 文本不同 | 87 |
| reviewer-audit | 输出格式 | 文本不同 | -159 |
| reviewer-audit | 产出 | 仅沙箱 | - |
| reviewer-audit | 权限 | 仅沙箱 | - |
| reviewer-audit | 越界处置 | 仅沙箱 | - |
| reviewer-audit | 边界 | 一致 | 0 |
| reviewer-product | 职责 | 文本不同 | 0 |
| reviewer-product | 一定会 | 文本不同 | -180 |
| reviewer-product | 禁止 | 文本不同 | -35 |
| reviewer-product | 冲突裁决 | 文本不同 | -25 |
| reviewer-product | 本席清单 | 文本不同 | -13 |
| reviewer-product | 输出格式 | 文本不同 | -194 |
| reviewer-product | 权限 | 仅沙箱 | - |
| reviewer-product | 边界 | 一致 | 0 |
| reviewer-interaction | 职责 | 文本不同 | 0 |
| reviewer-interaction | 一定会 | 文本不同 | -180 |
| reviewer-interaction | 禁止 | 文本不同 | -35 |
| reviewer-interaction | 冲突裁决 | 文本不同 | -25 |
| reviewer-interaction | 本席清单 | 文本不同 | -15 |
| reviewer-interaction | 输出格式 | 文本不同 | -194 |
| reviewer-interaction | 权限 | 仅沙箱 | - |
| reviewer-interaction | 边界 | 一致 | 0 |
| reviewer-ui | 职责 | 文本不同 | -1 |
| reviewer-ui | 一定会 | 文本不同 | -180 |
| reviewer-ui | 禁止 | 文本不同 | -35 |
| reviewer-ui | 冲突裁决 | 文本不同 | -25 |
| reviewer-ui | 本席清单 | 文本不同 | -15 |
| reviewer-ui | 输出格式 | 文本不同 | -194 |
| reviewer-ui | 权限 | 仅沙箱 | - |
| reviewer-ui | 边界 | 一致 | 0 |
| reviewer-frontend | 职责 | 文本不同 | 0 |
| reviewer-frontend | 一定会 | 文本不同 | -180 |
| reviewer-frontend | 禁止 | 文本不同 | -35 |
| reviewer-frontend | 冲突裁决 | 文本不同 | -25 |
| reviewer-frontend | 本席清单 | 文本不同 | -23 |
| reviewer-frontend | 输出格式 | 文本不同 | -194 |
| reviewer-frontend | 权限 | 仅沙箱 | - |
| reviewer-frontend | 边界 | 一致 | 0 |
| senior-sdet | 职责 | 文本不同 | -54 |
| senior-sdet | 一定会 | 文本不同 | -179 |
| senior-sdet | 禁止 | 文本不同 | -78 |
| senior-sdet | 冲突裁决 | 文本不同 | -25 |
| senior-sdet | 本席清单 | 文本不同 | -11 |
| senior-sdet | 输出格式 | 文本不同 | -148 |
| senior-sdet | 权限 | 仅沙箱 | - |
| senior-sdet | 边界 | 一致 | 0 |
| speaker | 职责 | 文本不同 | -7 |
| speaker | 一定会 | 文本不同 | -24 |
| speaker | 冲突裁决 | 文本不同 | -25 |
| speaker | 本席清单 | 文本不同 | -14 |
| speaker | 输出格式 | 文本不同 | -101 |
| speaker | 产出 | 仅沙箱 | - |
| speaker | 权限 | 仅沙箱 | - |
| speaker | 边界 | 文本不同 | 997 |
| speaker | 禁止 | 仅现役 | - |

## 边界核对

| 席 | 形态 | 沙箱长度 | 现役长度 | 逐字节相等 |
|---|---|---|---|---|
| detective-observer | policy | 1200 | 1200 | 是 |
| evidence-reader | policy | 1092 | 60 | 否 |
| respondent-architect | policy | 1092 | 46 | 否 |
| respondent-dev | policy | 1111 | 50 | 否 |
| reviewer-actuary | policy | 1096 | 41 | 否 |
| reviewer-ai | policy | 1096 | 41 | 否 |
| reviewer-audit | policy | 1240 | 1240 | 是 |
| reviewer-product | default | 41 | 41 | 是 |
| reviewer-interaction | default | 41 | 41 | 是 |
| reviewer-ui | default | 41 | 41 | 是 |
| reviewer-frontend | default | 41 | 41 | 是 |
| senior-sdet | policy | 1080 | 1080 | 是 |
| speaker | policy | 1081 | 84 | 否 |

## 缺失项

| 席 | 缺失项 | 原因 |
|---|---|---|
| - | - | 无 |

## 已知差异归类

| # | 差异 | 依据 |
|---|---|---|
| K1 | 沙箱多出 `## 产出` / `## 权限` 两段；2 张 policy 席另多 `## 越界处置` | spec S8；现役卡无这三段 |
| K2 | `outputFormat` 校验由 observable 派生，措辞弱于现役散文 | spec S5 |
| K3 | `reviewer-audit` 缺 `## 输出格式`——已补（P2 v3 补 `outputFormat`，本表已无缺失行） | spec S6；`reviewer-audit-model.json` 已建模 |
| K4 | 边界形态三套并存 | spec S1/S2；现役事实 |
| K5 | `seat.tier` 与策略档位并存 | spec S4；`TIER_MISMATCH` 守卫 |
| K6 | 5 席（取证 / 架构答辩 / 研发答辩 / 精算 / AI）边界改由 `policy` 派生，卡面仍是旧短句、工具行仍是旧档位——待 S4 首次重生成 | P4 决策 A；`boundary-source.test.mjs` 强制「有写落点 ⇒ policy + 档位含 Write」 |
