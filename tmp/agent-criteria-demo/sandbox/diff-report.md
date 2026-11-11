# P1 差异报告

## 总览

| 席 | 类型 | 沙箱行数 | 现役行数 | 沙箱字符 | 现役字符 | 段数（沙箱/现役） | 边界形态 | 边界一致 | 输出格式 |
|---|---|---|---|---|---|---|---|---|---|
| detective-observer | RespondentModel | 93 | 81 | 2907 | 2806 | 10/7 | policy | 是 | 有 |
| evidence-reader | RespondentModel | 73 | 67 | 1582 | 1767 | 9/7 | literal | 是 | 有 |
| respondent-architect | RespondentModel | 68 | 63 | 1313 | 1240 | 8/7 | literal | 是 | 有 |
| respondent-dev | RespondentModel | 67 | 63 | 1405 | 1243 | 8/7 | literal | 是 | 有 |
| reviewer-actuary | ReviewerModel | 82 | 75 | 1723 | 1900 | 9/7 | default | 是 | 有 |
| reviewer-ai | ReviewerModel | 85 | 78 | 1942 | 2130 | 9/7 | default | 是 | 有 |
| reviewer-audit | AuditorModel | 82 | 99 | 3331 | 3344 | 9/7 | policy | 是 | 无 |

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
| evidence-reader | 边界 | 一致 | 0 |
| respondent-architect | 职责 | 文本不同 | 13 |
| respondent-architect | 一定会 | 文本不同 | -25 |
| respondent-architect | 冲突裁决 | 文本不同 | -25 |
| respondent-architect | 本席清单 | 文本不同 | 14 |
| respondent-architect | 输出格式 | 文本不同 | -141 |
| respondent-architect | 产出 | 仅沙箱 | - |
| respondent-architect | 权限 | 仅沙箱 | - |
| respondent-architect | 边界 | 一致 | 0 |
| respondent-architect | 禁止 | 仅现役 | - |
| respondent-dev | 职责 | 文本不同 | -1 |
| respondent-dev | 一定会 | 文本不同 | -25 |
| respondent-dev | 冲突裁决 | 文本不同 | -25 |
| respondent-dev | 本席清单 | 文本不同 | 13 |
| respondent-dev | 输出格式 | 文本不同 | -141 |
| respondent-dev | 产出 | 仅沙箱 | - |
| respondent-dev | 权限 | 仅沙箱 | - |
| respondent-dev | 边界 | 一致 | 0 |
| respondent-dev | 禁止 | 仅现役 | - |
| reviewer-actuary | 职责 | 文本不同 | 22 |
| reviewer-actuary | 一定会 | 文本不同 | -175 |
| reviewer-actuary | 禁止 | 文本不同 | 18 |
| reviewer-actuary | 冲突裁决 | 文本不同 | -25 |
| reviewer-actuary | 本席清单 | 文本不同 | -21 |
| reviewer-actuary | 输出格式 | 文本不同 | -244 |
| reviewer-actuary | 产出 | 仅沙箱 | - |
| reviewer-actuary | 权限 | 仅沙箱 | - |
| reviewer-actuary | 边界 | 一致 | 0 |
| reviewer-ai | 职责 | 文本不同 | 20 |
| reviewer-ai | 一定会 | 文本不同 | -175 |
| reviewer-ai | 禁止 | 文本不同 | 18 |
| reviewer-ai | 冲突裁决 | 文本不同 | -25 |
| reviewer-ai | 本席清单 | 文本不同 | -30 |
| reviewer-ai | 输出格式 | 文本不同 | -244 |
| reviewer-ai | 产出 | 仅沙箱 | - |
| reviewer-ai | 权限 | 仅沙箱 | - |
| reviewer-ai | 边界 | 一致 | 0 |
| reviewer-audit | 职责 | 文本不同 | 44 |
| reviewer-audit | 一定会 | 文本不同 | -174 |
| reviewer-audit | 禁止 | 文本不同 | -78 |
| reviewer-audit | 冲突裁决 | 文本不同 | -25 |
| reviewer-audit | 本席清单 | 文本不同 | 87 |
| reviewer-audit | 产出 | 仅沙箱 | - |
| reviewer-audit | 权限 | 仅沙箱 | - |
| reviewer-audit | 越界处置 | 仅沙箱 | - |
| reviewer-audit | 边界 | 一致 | 0 |
| reviewer-audit | 输出格式 | 仅现役 | - |

## 边界核对

| 席 | 形态 | 沙箱长度 | 现役长度 | 逐字节相等 |
|---|---|---|---|---|
| detective-observer | policy | 1200 | 1200 | 是 |
| evidence-reader | literal | 60 | 60 | 是 |
| respondent-architect | literal | 46 | 46 | 是 |
| respondent-dev | literal | 50 | 50 | 是 |
| reviewer-actuary | default | 41 | 41 | 是 |
| reviewer-ai | default | 41 | 41 | 是 |
| reviewer-audit | policy | 1240 | 1240 | 是 |

## 缺失项

| 席 | 缺失项 | 原因 |
|---|---|---|
| reviewer-audit | 输出格式 | 模型无 outputFormat 配置（P4 建模） |

## 已知差异归类

| # | 差异 | 依据 |
|---|---|---|
| K1 | 沙箱多出 `## 产出` / `## 权限` 两段；2 张 policy 席另多 `## 越界处置` | spec S8；现役卡无这三段 |
| K2 | `outputFormat` 校验由 observable 派生，措辞弱于现役散文 | spec S5 |
| K3 | `reviewer-audit` 缺 `## 输出格式` | spec S6；P4 补建模 |
| K4 | 边界形态三套并存 | spec S1/S2；现役事实 |
| K5 | `seat.tier` 与策略档位并存 | spec S4；`TIER_MISMATCH` 守卫 |
