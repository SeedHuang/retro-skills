# 在使用 styled-components 的项目中，styled.xxx 定义必须使用独立 sc.tsx 文件，不得写在业务组件文件内

> 来源：项目约定（2026-10-10）｜落地：2026-10-15

## 核心判据

在使用 styled-components 的项目中，所有 `styled.xxx` 定义必须放在单独的 `sc.tsx`（或 `SC.tsx`）文件中。

| 场景 | 文件位置 |
| --- | --- |
| 单组件 | 与组件同目录的 `sc.tsx`，如 `./sc.tsx` |
| 多子组件共享 | 父目录统一 `sc.tsx`，或各子组件各自的 `./sc.tsx` |

```tsx
// ✅ 正确：styled 定义在 sc.tsx，业务组件从 sc.tsx 导入
// sc.tsx
import styled from 'styled-components';
export const RiskContainer = styled.div`...`;

// index.tsx
import { RiskContainer } from './sc';

// ❌ 错误：styled 定义直接写在业务组件文件里
const RiskContainer = styled.div`...`;
```

## 为什么

业务逻辑与样式关注点分离，组件文件更干净；便于复用和独立维护 styled 组件。

## 适用范围

本规则不因来源豁免——代码生成工具、子代理补写的代码同样必须遵守。

## 冲突裁决

与其它样式组织方式冲突时，以本规则为准。

## 例外

只有不使用 styled-components 的项目才算例外。

## 触发时机

编辑后写 / 改 styled-components 定义时。

## 验证

写 styled 定义时自查：定义是否在 `sc.tsx` 文件中；业务组件文件内出现 `styled.xxx =` 即视为违规。
