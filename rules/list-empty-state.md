# 在列表数据为空时，空态必须使用 antd Empty 渲染，不得用纯文本占位

> 来源：项目约定（2026-10-10）｜落地：2026-10-15

## 核心判据

在使用 antd 的项目中，列表数据为空（`[]` 或 `length === 0`）时，列表、Table、List 等列表型组件的空态必须使用 antd `Empty` 组件渲染。

```tsx
// 列表空态
import { Empty } from 'antd';

{
  items.length === 0 ? (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
  ) : (
    items.map((item) => <Item key={item.id} data={item} />)
  );
}

// Table 空态
<Table locale={{ emptyText: <Empty description="暂无数据" /> }} dataSource={list} />;
```

## 为什么

与 antd 设计语言统一，空态视觉一致；避免每个开发者自写占位样式（颜色、字号、对齐不统一）。

## 验证

写列表 / Table / List 时自查：数据源为空的分支是否渲染了 `Empty`；出现纯文本占位（如 `<span style={{ color: '#999' }}>暂无数据</span>`）即视为违规。

## 触发时机

编辑后写 / 改列表型组件，且数据源可能为空时。

## 例外

不使用 antd 的项目不适用本规则。
