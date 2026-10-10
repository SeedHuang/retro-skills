# 代码风格规则

## 1. 何时用 `@/` 别名，何时用相对路径

不要机械地一律用别名，**根据目录层级关系选择合适的路径写法**。

### 核心判断

> **能表达「这属于当前业务模块」的位置，用相对路径；位置远离当前模块、用 `@/`。**

### 规则表

| 场景 | 写法 | 例子 |
| --- | --- | --- |
| 同目录 / 邻近目录（≤2 层 `../`） | 相对路径 | `./sc`、`../mock/...` |
| 跨 3 层及以上相对路径 | 必须用 `@/` 别名 | `../../../../components/...` ❌ → `@/components/...` ✅ |
| 公共组件、工具、模型等「项目级资源」 | 推荐用 `@/` | `@/components/Card`、`@/utils/...` |
| 业务模块内部资源（types、mock、邻近 components） | 用相对路径 | `../../types`、`../mock/...` |

### 为什么

- `../../types`、`../../mock/...` 这种 1-2 层相对路径，能体现「这是当前业务模块内的类型/数据」，可读性好
- `../../../../components/...` 这种 4 层以上长路径，路径脆弱、易数错、文件移动易崩
- `@/` 别名主要用于指向「项目级公共资源」（`components/`、`hooks/`、`utils/`、`models/` 等）

### 正确 vs 错误

```tsx
// ✅ 正确：业务模块内部用相对路径
import { RiskItem as RiskItemType } from '../../types';
import { mockRiskFollow } from '../../mock/riskFollow';

// ✅ 正确：项目级公共资源用 @/
import { Card } from '@/components/Card';
import ColPanel from '@/components/ColPanel';

// ❌ 错误：公共资源用长相对路径
import ColPanel from '../../../../components/ColPanel';
```

### 验证方式

编辑后调用 `GetDiagnostics`，确认无 `Cannot find module` 错误。

## 2. 列表 / 表格空态统一使用 antd Empty

**任何 `.map` 渲染的列表、antd `Table`、antd `List` 等列表型组件，当数据源为空（`[]` 或 `length === 0`）时，必须使用 antd `Empty` 组件渲染空状态，禁止使用纯文本占位。**

```tsx
// ✅ 正确：列表空态
import { Empty } from 'antd';

{
  items.length === 0 ? (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
  ) : (
    items.map((item) => <Item key={item.id} data={item} />)
  );
}

// ✅ 正确：Table 空态
<Table locale={{ emptyText: <Empty description="暂无数据" /> }} dataSource={list} />;

// ❌ 错误：纯文本占位
{
  items.length === 0 && <span style={{ color: '#999' }}>暂无数据</span>;
}
```

### 为什么

- 与 antd 设计语言统一，空态视觉一致
- 避免每个开发者自写占位样式（颜色、字号、对齐不统一）

## 3. Styled-Component 必须放在独立 SC 文件中

**所有 `styled.xxx` 定义必须放在单独的 `sc.tsx`（或 `SC.tsx`）文件中，禁止直接写在业务组件文件内。**

### 文件命名

| 场景 | 文件位置 |
| --- | --- |
| 单组件 | 与组件同目录的 `sc.tsx`，如 `./sc.tsx` |
| 多子组件共享 | 父目录统一 `sc.tsx`，或各子组件各自的 `./sc.tsx` |

```tsx
// ✅ 正确：styled 定义在 sc.tsx，业务组件从 sc.tsx 导入
// sc.tsx
import styled from 'styled-components';
export const RiskContainer = styled.div`...`;
export const RiskItem = styled.div`...`;

// index.tsx
import { RiskContainer, RiskItem } from './sc';

// ❌ 错误：styled 定义直接写在业务组件文件里
// index.tsx
const RiskContainer = styled.div`...`;  // 不允许
```

### 为什么

- 业务逻辑与样式关注点分离，组件文件更干净
- 便于复用和独立维护 styled 组件
- 与项目现有约定一致（项目中同目录下已有 `sc.tsx` 文件）
