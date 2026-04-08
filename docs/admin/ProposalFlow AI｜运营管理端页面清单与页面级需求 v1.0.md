# ProposalFlow AI｜运营管理端页面清单与页面级需求 v1.0

## 1. 文档目的

本文档用于将运营管理端 PRD 继续下钻到页面层，形成可直接用于页面设计、前端实现、后端查询规划和测试验收的页面级需求说明。

本文档重点回答以下问题：

- 首版运营管理端包含哪些页面
- 每个页面的业务目标是什么
- 每个页面应展示哪些关键区块与核心字段
- 页面之间如何跳转
- 页面依赖哪些查询能力与后台数据
- 哪些能力属于首版，哪些应后置

## 2. 适用范围

适用于运营管理端首版页面设计、前端实现、接口联调和测试验收。

本文档以《运营管理端 PRD》中的产品边界和统一裁定为前提，以《运营管理端指标与口径说明》中的统计定义为口径基础，以《运营管理端页面流程与信息架构说明》中的路由结构为页面组织依据。

## 3. 页面级统一裁定

在进入页面清单前，先固化本文件必须遵守的统一结论。

### 3.1 主漏斗起点

Funnel Analytics 页面默认展示 workspace 主漏斗，正式起点为 `workspace_created`。

- `signup_completed` 不纳入 workspace 主漏斗主链路
- 如未来展示 user funnel，必须明确切换维度并单独标注

### 3.2 `workflow_completion_rate` 分母

所有页面涉及 `workflow_completion_rate` 时，主展示口径统一为：

`workflow_completion_rate = Workflow Completed Workspaces / Activated Workspaces`

不得将其默认解释为相对于 `New Workspaces` 的完成率。

### 3.3 Overview 指标命名、统计对象与时间窗口

Overview 页面中的指标展示必须遵守：

- 规模类指标采用累计时点口径
- 新增、激活、完成、转化类指标采用窗口口径
- 核心转化指标默认按 workspace 统计
- 指标命名中应体现对象和时间窗口，避免混淆“事件量”和“对象量”

### 3.4 过滤参数协议

页面筛选和跨页跳转统一采用以下 query params：

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

指标与聚合视图统一采用：

- `from`
- `to`

### 3.5 订阅限制字段是否属于首版

属于首版。

Subscriptions / Trials 页面及相关 drill-down 场景中，应补充以下字段，以保证与客户侧对限制状态的解释一致：

- `is_generation_allowed`
- `restriction_reason`

## 4. 页面总览

### 4.1 首版页面目录

首版运营管理端包含以下页面：

1. Admin Auth
2. Overview
3. Workspaces List
4. Workspace Detail
5. Users List
6. User Detail（P1 预留）
7. Subscriptions / Trials
8. Funnel Analytics

### 4.2 页面优先级

**P0 页面**

- Admin Auth
- Overview
- Workspaces List
- Workspace Detail
- Users List
- Subscriptions / Trials
- Funnel Analytics

**P1 页面或增强项**

- User Detail
- 更复杂的筛选、对比与导出
- 更细的趋势图与时间范围分析
- Funnel Analytics 跳转到过滤后的列表

### 4.3 主导航

首版主导航为：

- Overview
- Workspaces
- Users
- Subscriptions / Trials
- Funnel Analytics

说明：

- 首版不将系统配置、运维控制等入口纳入运营端导航
- 运营端导航应围绕“看总览、查对象、看漏斗、判断商业状态”展开

## 5. 页面一：Admin Auth

### 5.1 页面目标

提供运营端独立登录入口，确保内部访问与客户侧产品入口分离。

### 5.2 页面入口

- 独立 admin 域名或独立 admin 路径
- 不从客户侧主导航进入

### 5.3 页面核心区块

**区块 A：品牌与说明**

- ProposalFlow AI Admin
- 仅供内部人员使用的说明

**区块 B：登录入口**

- 统一登录入口
- 具体登录实现依身份体系能力决定

**区块 C：异常提示**

- 登录失败
- 无权限访问
- 会话失效

### 5.4 核心交互

- 内部用户登录
- 登录成功后进入 Overview
- 非内部角色被拒绝访问

### 5.5 依赖数据与能力

- 独立 admin 登录态校验
- `/api/v1/admin/auth/me`
- internal auth guard
- internal role guard

### 5.6 页面验收标准

- `internal_admin` / `internal_analyst` 可进入系统
- 普通客户侧角色不可进入运营端
- 登录失败与权限不足提示清晰可理解

## 6. 页面二：Overview

### 6.1 页面目标

以最小信息密度提供平台整体业务总览，帮助内部快速判断平台当前规模、增长、激活、流程完成与商业化状态。

### 6.2 页面核心区块

**区块 A：核心规模指标**

- `Total Users`
- `Total Workspaces`
- `Active Workspaces`
- `Paid Workspaces`
- `Trial Active Workspaces`
- `Trial Expired Workspaces`

**区块 B：近期增长指标**

- `New Users (7d/30d)`
- `New Workspaces (7d/30d)`
- `Proposal Draft Generated Workspaces (7d/30d)`

说明：此处应强调对象量，不建议使用歧义性的事件量命名。

**区块 C：核心转化指标**

- `Activation Rate (7d)`
- `Workflow Completion Rate (7d)`
- `Trial to Paid Conversion Rate (30d)`

**区块 D：重点提醒区**

- 即将到期的 trials
- `past_due` subscriptions
- 高活跃但未付费 workspace

### 6.3 核心交互

- 点击指标卡跳转到对应列表页
- 点击提醒项跳转到带过滤条件的 Workspaces 或 Subscriptions 视图
- 支持时间范围切换，首版采用 7d / 30d

### 6.4 页面状态

- 正常状态：展示平台整体数据
- 空状态：显示“暂无足够数据”说明
- 错误状态：查询失败时支持 retry

### 6.5 依赖数据与能力

- admin overview query
- workspace aggregate query
- subscription aggregate query
- funnel / event aggregate query

### 6.6 页面验收标准

- 关键平台指标可稳定展示
- 数值与统一口径一致
- 跳转到下级列表页时过滤条件能正确承接
- 指标卡文案能体现对象与时间窗口

## 7. 页面三：Workspaces List

### 7.1 页面目标

以 workspace 为主视角查看平台使用状态、试用与订阅状态、近期活跃程度与主流程使用深度。

### 7.2 页面核心区块

**区块 A：顶部筛选栏**

- workspace 名称搜索
- `trial_status` filter
- `billing_status` filter
- `plan_type` filter
- `created_from` / `created_to`
- `active_from` / `active_to`

**区块 B：workspace 列表**

- `workspace_name`
- `created_at`
- `members_count`
- `trial_status`
- `billing_status`
- `plan_type`
- `current_period_end`
- `recent_activity_at`
- `opportunities_count`
- `proposal_draft_generated_count`
- `is_generation_allowed`
- `restriction_reason`

**区块 C：快捷标签**

- high activity
- no recent activity
- `past_due`
- trial expiring soon

### 7.3 核心交互

- 搜索 workspace
- 按试用 / 订阅状态过滤
- 按创建时间或最近活跃时间排序
- 点击进入 Workspace Detail

### 7.4 页面状态

- 正常状态：列表展示
- 空状态：无匹配结果
- 错误状态：查询失败可 retry

### 7.5 依赖数据与能力

- admin workspaces list query
- workspace aggregate metrics query

### 7.6 页面验收标准

- 能稳定检索到 workspace
- `trial_status` / `billing_status` 过滤准确
- 行点击可稳定进入 Workspace Detail
- 限制字段解释与客户侧 Billing 规则一致

## 8. 页面四：Workspace Detail

### 8.1 页面目标

围绕单个 workspace 查看其业务状态、商业状态、主流程使用情况和关键时间线，以支持运营排查与商业判断。

### 8.2 页面核心区块

**区块 A：Workspace Summary**

- `workspace_name`
- `created_at`
- `trial_status`
- `billing_status`
- `plan_type`
- `current_period_end`
- `recent_activity_at`
- `is_generation_allowed`
- `restriction_reason`

**区块 B：Members**

- 成员列表
- `auth_method`
- 最近活跃时间

**区块 C：Usage Snapshot**

- `opportunities_count`
- `lead_brief_generated_count`
- `discovery_generated_count`
- `proposal_draft_generated_count`
- `followup_generated_count`

**区块 D：Recent Opportunities**

- opportunity title
- status
- updated_at
- owner

**区块 E：Activity Timeline**

- 注册
- 创建 workspace
- 创建 opportunity
- 生成 proposal
- 升级 / 付费等关键行为

### 8.3 核心交互

- 查看 workspace 基础信息
- 查看成员与最近机会
- 查看主流程使用情况
- 视实现情况跳转到用户明细或订阅相关视图

### 8.4 页面状态

- 正常状态：展示完整 summary + usage + timeline
- 空状态：数据不足时显示简化视图
- 错误状态：查询失败可 retry

### 8.5 依赖数据与能力

- admin workspace detail query
- workspace members query
- workspace opportunities summary query
- workspace activity timeline query

### 8.6 页面验收标准

- 可稳定展示单个 workspace 的业务与商业信息
- 关键数据维度完整
- 能帮助内部快速判断该 workspace 是否已激活、是否在使用、是否具备付费信号

## 9. 页面五：Users List

### 9.1 页面目标

从平台级视角查看用户规模、登录方式和活跃情况，支持内部用户检索与归属追踪。

### 9.2 页面核心区块

**区块 A：顶部筛选栏**

- 邮箱 / 姓名搜索
- `auth_method` filter
- `created_from` / `created_to`
- `active_from` / `active_to`

**区块 B：用户列表**

- `user_id`
- `email`
- `full_name`
- `auth_method`
- `created_at`
- `last_active_at`
- `workspace_count`
- `primary_workspace`

### 9.3 核心交互

- 搜索用户
- 按登录方式筛选
- 若 User Detail 已实现，则可点击进入

### 9.4 页面状态

- 正常状态：列表展示
- 空状态：无匹配结果
- 错误状态：查询失败可 retry

### 9.5 依赖数据与能力

- admin users list query

### 9.6 页面验收标准

- 可快速定位用户
- 登录方式与活跃信息可读
- 与 workspace 归属关系可追溯

## 10. 页面六：User Detail（P1 预留）

### 10.1 页面目标

查看单个用户的身份信息、归属关系和关键行为。

### 10.2 页面核心区块

- 用户基础信息
- 所属 workspace 列表
- 最近关键行为时间线
- 最近参与的 opportunities（若可聚合）

### 10.3 首版策略

当前按 P1 预留处理：

- 可在路由与接口文档中预留定义
- 不作为首版 P0 页面硬性交付要求

## 11. 页面七：Subscriptions / Trials

### 11.1 页面目标

集中查看 trial、订阅与付费状态，支撑商业化判断、到期跟踪与限制解释。

### 11.2 页面核心区块

**区块 A：顶部筛选栏**

- `trial_status`
- `billing_status`
- `plan_type`
- expiring soon
- `from` / `to`（用于窗口型查询与到期相关筛选，避免额外定义专用命名）

**区块 B：列表视图**

- `workspace_name`
- `trial_status`
- `trial_start_at`
- `trial_end_at`
- `billing_status`
- `plan_type`
- `current_period_end`
- `stripe_customer_id`
- `stripe_subscription_id`
- `is_generation_allowed`
- `restriction_reason`

**区块 C：重点提醒区**

- expiring soon
- `past_due`
- `canceled`
- active paid

### 11.3 核心交互

- 按状态过滤
- 查看即将到期、已过期、支付失败等列表
- 点击跳转到 Workspace Detail

### 11.4 页面状态

- 正常状态：列表展示
- 空状态：无匹配记录
- 错误状态：查询失败可 retry

### 11.5 依赖数据与能力

- admin subscriptions list query
- billing status aggregate query

### 11.6 页面验收标准

- 试用与订阅状态可准确展示
- 可快速筛出 expiring soon / `past_due` / paid workspace
- 限制字段能解释当前 workspace 是否仍可生成内容
- 与内部状态字段保持一致，不依赖人工解释 Stripe 原始对象

## 12. 页面八：Funnel Analytics

### 12.1 页面目标

查看从 workspace 创建到主流程使用、升级点击与订阅激活的关键漏斗，以识别主要流失点。

### 12.2 首版正式漏斗节点

workspace 主漏斗节点固定为：

1. `workspace_created`
2. `opportunity_created`
3. `lead_brief_generated`
4. `discovery_intelligence_generated`
5. `proposal_draft_generated`
6. `followup_generated`
7. `upgrade_clicked`
8. `subscription_activated`

补充说明：

- `signup_completed` 不属于该页面默认主漏斗节点
- 如未来加入 user funnel，必须在 UI 上显式切换对象维度

### 12.3 页面核心区块

**区块 A：漏斗主视图**

- 各节点完成对象数
- 节点间转化率
- 整体从起点到终点的转化表现

**区块 B：时间范围筛选**

- 7d
- 30d
- custom range（P1）

**区块 C：维度切换（P1）**

- by user
- by workspace
- by acquisition method

### 12.4 核心交互

- 切换时间范围
- 查看各节点转化率
- 后续可支持点击节点跳转到过滤后的 Workspaces 列表

### 12.5 页面状态

- 正常状态：展示漏斗数据
- 空状态：数据量不足时显示说明
- 错误状态：查询失败可 retry

### 12.6 依赖数据与能力

- funnel aggregate query
- event metrics query based on `activity_logs` and core business entities

### 12.7 页面验收标准

- 漏斗节点口径稳定
- 能清楚看出主流程流失位置
- 能支撑内部判断 activation 与 paid conversion
- 不混入 user-level 指标导致对象混淆

## 13. 页面间跳转规则

### 13.1 主导航跳转

- Overview → Workspaces / Users / Subscriptions / Funnel Analytics
- Workspaces → Workspace Detail
- Users → User Detail（若已实现）
- Subscriptions / Trials → Workspace Detail
- Funnel Analytics → 过滤后的 Workspaces（增强项）

### 13.2 跳转原则

- 跳转应尽量保留过滤条件
- 从列表进入明细后返回列表时，应尽量保留原查询条件
- 不引入复杂多层回跳逻辑

## 14. 页面级数据边界

### 14.1 首版只读为主

除未来极少数低风险运营动作外，首版页面应以只读查询为主。

### 14.2 不纳入首版的写操作

- 手工修改 `trial_status`
- 手工修改 `billing_status`
- 批量禁用 workspace
- 手工强制更改主流程状态
- impersonation

若后续确有需要，应单独立项并增加审计设计。

## 15. 设计与研发注意事项

### 15.1 设计侧注意事项

- 强调可扫描性与可判断性
- 指标卡片、表格和状态标签要清晰
- 首版优先保证结构清楚、文案不歧义、状态解释一致

### 15.2 研发侧注意事项

- 页面查询优先使用 `/api/v1/admin/*` 命名空间
- 不复用客户侧 product API 充当运营查询接口
- 列表页以分页、筛选、基础排序为主
- 对重型统计查询保持克制

## 16. 与其他文档的关系

- 本文档承接《运营管理端 PRD》的产品范围和优先级判断
- 页面中的指标解释必须以《运营管理端指标与口径说明》为准
- 页面路由与主路径应与《运营管理端页面流程与信息架构说明》一致
- 页面依赖的数据与接口边界应与《运营管理端 API 需求说明》一致

## 17. 已冻结决策

### 17.1 User Detail 是否进入首版正式交付

`User Detail` 按 P1 预留处理，不进入首版 P0 正式交付。

### 17.2 Subscriptions 页时间筛选字段协议

Subscriptions 页统一沿用列表协议中的通用时间字段：`from` / `to`。

### 17.3 Funnel 节点跳转到过滤后列表

该能力不纳入首版必做，保留为后续增强项。

## 18. 结论

运营管理端首版页面体系应控制在最小、稳定、可判断的范围内，以 Overview、Workspaces、Users、Subscriptions / Trials、Funnel Analytics 为核心，配合 Workspace Detail 承接深入查看，优先保证数据正确、口径统一、结构清晰，而不是过早演变为复杂后台系统。
