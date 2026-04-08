# ProposalFlow AI｜运营管理端页面流程与信息架构说明 v1.0

## 1. 文档目的

本文档用于从页面结构、导航关系、内部使用流转和路由保护四个维度，明确 ProposalFlow AI 运营管理端首版的信息架构与页面流程。其目标是为产品、交互、UI、前端、后端和测试团队提供统一的页面组织依据。

本文档重点回答以下问题：

- 运营管理端页面树如何组织
- 页面之间如何跳转与回退
- 哪些是主路径，哪些是辅助与异常路径
- 运营管理端如何与客户侧产品边界分离
- 页面级鉴权与对象存在性如何处理
- 页面级过滤协议如何与其他 admin 文档统一

## 2. 适用范围

适用于运营管理端首版信息架构确认、原型设计、前端路由规划、查询链路设计与测试验收。

本文档不负责定义具体指标口径和接口字段明细；相关内容分别以下列文档为准：

- 《运营管理端 PRD》：定义产品目标、边界与统一裁定
- 《运营管理端指标与口径说明》：定义指标对象、时间窗口和统计规则
- 《运营管理端页面清单与页面级需求》：定义页面区块、字段和交互细节
- 《运营管理端 API 需求说明》：定义接口边界、参数协议和返回结构

## 3. 设计原则

### 3.1 独立入口原则

运营管理端必须作为独立入口存在，不进入客户侧产品主导航，不复用客户侧 workspace 访问链路。

### 3.2 平台视角原则

页面结构围绕平台级对象和平台级判断组织，而不是围绕单个客户侧 opportunity 工作流组织。

### 3.3 只读优先原则

首版页面流转以查看、搜索、筛选、排序、判断为主，不以复杂写操作为核心。

### 3.4 清晰导航原则

首版导航应保持简单、稳定、层级浅，避免出现过多分支页、深层配置页或碎片化路由。

### 3.5 统一口径原则

页面流转涉及的漏斗对象、Overview 指标理解、过滤参数与订阅限制解释，必须与其他 admin 文档保持一致，不得在页面流程文档中单独发明新定义。

## 4. 首版统一裁定

本节用于固化页面流程与信息架构层面必须遵循的统一结论。

### 4.1 主漏斗起点

运营管理端主漏斗正式从 `workspace_created` 开始。

- `signup_completed` 仅作为 user-level 指标或独立 user funnel 起点
- `/admin/funnels` 默认展示 workspace funnel
- 页面中不得将 `signup_completed` 直接并入 workspace 主漏斗链路

### 4.2 `workflow_completion_rate` 分母

页面上如展示 `workflow_completion_rate`，其主展示口径固定为：

`workflow_completion_rate = Workflow Completed Workspaces / Activated Workspaces`

页面不得将该指标默认解释为“完成主流程闭环的 workspace / New Workspaces”。若未来需要展示其他分母口径，必须显式标注为补充指标。

### 4.3 Overview 指标命名、统计对象与时间窗口

Overview 页面中的指标卡片必须满足以下要求：

- 命名体现对象与时间窗口，不混用对象量和事件量
- 累计规模类指标按当前时点展示
- 新增、激活、完成、转化类指标必须绑定明确时间窗口
- 核心转化指标默认按 workspace 口径展示

### 4.4 过滤参数协议

所有 admin 列表页、跳转链接和路由 query params 统一采用以下字段：

- `q`
- `trial_status`
- `billing_status`
- `plan_type`
- `auth_method`
- `created_from`
- `created_to`
- `active_from`
- `active_to`
- `sort_by`
- `sort_direction`
- `cursor`
- `limit`

指标和聚合类查询统一采用：

- `from`
- `to`

### 4.5 订阅限制字段是否属于首版

属于首版。

运营端在 Subscriptions / Trials 视图及相关跳转中，应能看到并传递以下限制解释字段，以确保与客户侧 Billing 解释一致：

- `is_generation_allowed`
- `restriction_reason`

## 5. 页面树

### 5.1 顶层页面树

未登录层：

- `/admin/auth`

已登录产品层：

- `/admin/overview`
- `/admin/workspaces`
- `/admin/workspaces/:workspaceId`
- `/admin/users`
- `/admin/users/:userId`（P1 预留）
- `/admin/subscriptions`
- `/admin/funnels`

### 5.2 页面树解读

首版建议聚焦五类核心视图：

- 平台总览
- workspace 列表与明细
- 用户列表
- 订阅 / 试用状态
- 漏斗分析

User Detail 允许在路由层预留，但不作为首版必交页面依赖项。

## 6. 导航结构

### 6.1 主导航

建议固定主导航为：

- Overview
- Workspaces
- Users
- Subscriptions / Trials
- Funnel Analytics

### 6.2 导航规则

- 主导航在已登录产品层保持固定
- 不引入客户侧产品的流程型导航
- 不把 Opportunity 级工作流页面纳入运营端主导航
- 明细页通过列表或卡片 drill-down 进入，而不是作为一级导航

## 7. 主使用路径

### 7.1 日常运营查看路径

`Admin Auth → Overview → Workspaces / Subscriptions / Funnel Analytics → Workspace Detail → 返回列表或切换其他导航`

### 7.2 订阅查看路径

`Overview / Subscriptions → 过滤 trial_status / billing_status → 查看 workspace → 返回列表`

### 7.3 漏斗分析路径

`Overview / Funnel Analytics → 查看关键节点与转化率 → 识别流失位置 → 跳转到相关过滤后的 workspace 列表（增强项）`

## 8. 辅助流程

### 8.1 用户检索流程

`Users → 搜索邮箱或姓名 → 查看用户基础信息 →（若已实现）进入 User Detail`

### 8.2 Workspace 排查流程

`Workspaces → 搜索或筛选 → 进入 Workspace Detail → 查看成员、机会、使用情况、关键时间线`

## 9. 异常流程

### 9.1 未登录访问

流程：

1. 用户访问 `/admin/*`
2. 系统检测无内部登录态
3. 跳转 `/admin/auth`

### 9.2 非内部角色访问

流程：

1. 用户已登录
2. 角色不属于 `internal_admin` / `internal_analyst`
3. 系统拒绝访问并展示权限不足提示

### 9.3 查询失败

流程：

1. 列表页或详情页查询失败
2. 页面展示错误提示与 retry
3. 不影响主导航继续切换

### 9.4 数据不足

流程：

1. 页面可成功加载，但底层数据量不足
2. 页面展示“当前数据不足以形成稳定判断”说明
3. 不展示误导性的空转化判断

## 10. 页面保护逻辑

### 10.1 Guard A：Internal Auth Guard

适用页面：

- 所有 `/admin/*` 业务页面

规则：

- 若未登录，则跳转 `/admin/auth`
- 页面初始化登录态查询应对应 `/api/v1/admin/auth/me`
- 不得复用客户侧 `/api/v1/auth/me`

### 10.2 Guard B：Internal Role Guard

适用页面：

- 所有 `/admin/*` 业务页面

规则：

- 若登录成功但不具备内部角色，则拒绝访问

### 10.3 Guard C：Object Existence Guard

适用页面：

- `/admin/workspaces/:workspaceId`
- `/admin/users/:userId`

规则：

- 若对象不存在，则展示 not found 或引导返回列表页

## 11. 对象上下文结构

### 11.1 Workspace Detail 上下文

建议统一承载以下信息：

- workspace 基础信息
- `trial_status`
- `billing_status`
- `plan_type`
- `current_period_end`
- `recent_activity_at`
- members summary
- usage summary
- recent opportunities
- key activity timeline
- 订阅限制解释字段：`is_generation_allowed`、`restriction_reason`

### 11.2 User Detail 上下文

若后续启用 User Detail，建议承载：

- 用户基础信息
- `auth_method`
- 所属 workspace 列表
- 最近关键行为时间线

## 12. 信息架构分层

建议将运营管理端的信息架构划分为四层：

### 12.1 Layer 1：Internal Auth Layer

- Admin 登录入口

### 12.2 Layer 2：Global Admin Navigation Layer

- Overview
- Workspaces
- Users
- Subscriptions / Trials
- Funnel Analytics

### 12.3 Layer 3：Object Detail Layer

- Workspace Detail
- User Detail（P1）

### 12.4 Layer 4：Support State Layer

- filters
- date range
- sorting
- empty state
- error state

## 13. 推荐 URL 设计

### 13.1 Auth 相关

- `/admin/auth`

### 13.2 全局页

- `/admin/overview`
- `/admin/workspaces`
- `/admin/users`
- `/admin/subscriptions`
- `/admin/funnels`

### 13.3 明细页

- `/admin/workspaces/:workspaceId`
- `/admin/users/:userId`

### 13.4 URL 设计原则

- 路由用于表达页面位置，不用于表达查询动作
- 筛选与搜索通过 query params 承载
- 不把客户侧路由语义混入 admin 路由
- 从列表进入明细后返回列表时，应尽量保留原 query params

## 14. 前端状态管理建议

### 14.1 全局状态

建议管理：

- `internal_auth_status`
- `current_internal_user`
- `current_filters`（按页面作用域管理）

### 14.2 页面级状态

建议管理：

- list loading
- detail loading
- filter state
- empty state
- query error state

## 15. 设计与研发联动建议

### 15.1 设计侧优先产物

建议先产出：

- Admin sitemap
- Overview wireframe
- Workspaces List + Detail wireframe
- Subscriptions page wireframe
- Funnel Analytics wireframe

### 15.2 研发侧优先确认内容

建议先确认：

- `/admin` 路由域
- internal auth guard
- internal role guard
- admin query API 命名空间
- 基础分页、筛选、排序协议

### 15.3 首版只读边界冻结

首版明确不支持：

- 手工修改 `trial_status`
- 手工修改 `billing_status`
- impersonation
- 强制推进客户侧主流程状态
- 批量高风险写操作

## 16. 与其他文档的关系

- 本文档承接《运营管理端 PRD》的产品定位和统一裁定
- 页面中的指标命名和对象定义必须以《运营管理端指标与口径说明》为准
- 页面区块、展示字段和交互细节应与《运营管理端页面清单与页面级需求》保持一致
- 路由保护、过滤协议和查询入口应与《运营管理端 API 需求说明》对齐

## 17. 已冻结决策

### 17.1 User Detail 的首版交付策略

`User Detail` 仅作为 P1 预留，不进入首版 P0 正式交付。

### 17.2 Funnel Analytics 到过滤后列表的跳转

该能力不进入首版 P0，作为后续增强项处理。

## 18. 结论

ProposalFlow AI 运营管理端首版的信息架构，应坚持“独立入口、平台视角、只读优先、导航简洁、口径统一”的原则，以 Overview、Workspaces、Users、Subscriptions / Trials、Funnel Analytics 为稳定入口，并以 Workspace Detail 承接深入查看，从而以最小复杂度建立平台级可见性与判断能力。
