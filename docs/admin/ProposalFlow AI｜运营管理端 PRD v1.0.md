# ProposalFlow AI｜运营管理端 PRD v1.0

## 1. 文档目的

本文档用于重写并固化 ProposalFlow AI 运营管理端首版产品需求，明确其产品定位、首版范围、核心模块、边界约束与统一口径。本文档重点回答以下问题：

- 运营管理端是什么、服务谁、不服务谁
- 首版需要解决哪些平台级判断问题
- 首版包含哪些模块与页面能力
- 运营管理端与客户侧产品、数据层、接口层如何分离
- 首版必须统一的关键口径是什么

本文档作为 admin 文档组的总纲，后续页面、指标与 API 文档均应以本文档为上位依据。

## 2. 适用范围

适用对象：产品、架构、前端、后端、数据、测试、项目管理、业务负责人。

适用范围仅限平台内部运营管理端（Admin Surface），不适用于客户侧工作台，不覆盖运维监控平台、CRM、客服后台或独立 BI 平台。

## 3. 产品定位

### 3.1 产品定义

ProposalFlow AI Admin 是 ProposalFlow AI 平台面向内部角色的运营管理端，用于查看用户、workspace、试用与订阅状态、主流程转化与关键行为数据，以支撑试用转化判断、留存分析、产品复盘与业务决策。

### 3.2 明确不做

运营管理端不是客户侧产品的一部分，不服务普通 workspace 用户，不承担售前工作流交互，也不替代运维后台、数据库管理工具或通用 BI 系统。

### 3.3 其解决的问题

运营管理端首版要稳定回答以下问题：

- 平台当前有多少真实用户与真实 workspace
- 新建 workspace 是否跑通主流程并进入激活状态
- 主流程主要流失点出现在什么阶段
- 哪些 workspace 处于试用中、已付费、已过期、past due 或 canceled
- 哪些 workspace 具有持续使用或付费信号
- 当前产品是否形成“更稳的 scope + 更快的 proposal-ready draft”的核心价值

## 4. 目标用户与角色

### 4.1 首版目标角色

- Founder / 业务负责人
- 产品负责人
- 增长 / 运营负责人
- 商业化负责人

### 4.2 首版权限角色

首版仅定义两类内部角色：

- `internal_admin`
- `internal_analyst`

说明：内部角色独立于客户侧 `workspace owner/member` 体系，不能复用租户角色作为 admin 访问依据。

## 5. 产品目标与成功标准

### 5.1 核心目标

首版目标不是建设复杂后台，而是建立一套清晰、可信、可判断的平台级数据视图，使内部团队能围绕增长、激活、主流程完成和商业化信号进行一致判断。

### 5.2 成功标准

首版完成后，内部团队至少应能够：

- 查看注册、workspace、试用、付费的基础规模
- 查看 workspace 级主流程关键节点转化
- 识别高活跃、高潜在付费、高流失风险的 workspace
- 基于单个 workspace 进行基础排查与追踪
- 基于统一口径讨论 activation、workflow completion 与 trial-to-paid conversion

## 6. 首版范围

### 6.1 P0 模块

首版必须包含以下五个模块：

1. Overview
2. Workspaces
3. Users
4. Subscriptions / Trials
5. Funnel Analytics

### 6.2 首版能力边界

首版以只读查询与分析为主，仅提供必要的搜索、筛选、排序、分页和明细查看能力，不提供高风险写操作。

### 6.3 明确不纳入首版的能力

以下能力不属于首版正式范围：

- 运维监控面板
- 数据库管理能力
- 大而全 BI 平台能力
- 大量人工批量修改用户或 workspace 数据
- CRM / 工单 / 客服后台能力
- 风控引擎
- impersonation
- 手工推进客户侧主流程状态
- 手工修改 `trial_status` / `billing_status`

## 7. 统一核心定义与术语

### 7.1 User

平台业务用户实体，对应 `users` 中单个用户记录。

### 7.2 Workspace

平台租户实体，是首版运营管理端的核心统计对象。

### 7.3 Activated Workspace

建议定义为：新建 workspace 在创建后 7 天内至少完成 1 次 `proposal_draft_generated`，则计为已激活。

### 7.4 Workflow Completion

指 workspace 在指定时间窗口内，至少完成 1 次 Opportunity → Lead Brief → Discovery Intelligence → Proposal Draft 的主流程闭环。

### 7.5 Trial / Billing 状态

试用和订阅展示应以系统内部字段为正式口径，优先使用：

- `trial_status`
- `billing_status`
- `plan_type`
- `current_period_end`

## 8. 首版统一口径决议

本节用于统一 admin 文档组中的关键争议项，后续文档不得与本节冲突。

### 8.1 主漏斗起点

运营管理端主漏斗正式从 `workspace_created` 开始。

- `signup_completed` 仅作为 user-level 指标或独立 user funnel 起点
- `signup_completed` 不进入 workspace 主漏斗的分母链路
- Funnel Analytics 默认展示 workspace-level funnel

### 8.2 `workflow_completion_rate` 分母

首版正式主展示口径固定为：

`workflow_completion_rate = 完成主流程闭环的 workspace 数 / Activated Workspaces`

说明：

- `New Workspaces` 不再作为首版主展示分母
- 如后续分析需要使用 `New Workspaces` 口径，必须作为 secondary metric 明确标注，不得与主展示口径混用

### 8.3 Overview 指标命名、统计对象与时间窗口

Overview 页面指标必须做到三点统一：

1. 指标命名与页面文案统一，不混用事件量和对象量
2. 核心转化指标默认以 `workspace` 为统计对象
3. 所有新增、转化、激活类指标必须带明确时间窗口

建议 Overview 首版统一使用：

- 累计规模类：截至当前时点累计值，如 `Total Users`、`Total Workspaces`
- 窗口新增类：默认按 `近 7 天` 或 `近 30 天`，如 `New Users (7d)`、`New Workspaces (7d)`
- 转化类：必须与查询窗口绑定，如 `Activation Rate (7d)`、`Workflow Completion Rate (7d)`、`Trial to Paid Conversion Rate (30d)`

### 8.4 过滤参数协议

admin 端列表与跳转过滤协议统一采用以下字段，不允许各页各自发明命名：

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

指标与聚合接口统一使用：

- `from`
- `to`

### 8.5 订阅限制字段是否属于首版

属于首版。

为避免 admin 端与客户侧对订阅限制解释不一致，Subscriptions / Trials 相关页面与接口首版应补充以下限制解释字段：

- `is_generation_allowed`
- `restriction_reason`

这些字段的用途是解释当前 workspace 在试用过期、past due、canceled 等状态下的能力限制，不等同于新增高风险写操作。

## 9. 模块级需求

### 9.1 Overview

用于快速判断平台整体健康度、增长、激活与商业化状态。应展示核心规模、近期增长、关键转化与重点提醒。

### 9.2 Workspaces

以 workspace 为主视角查看使用状态、试用与订阅状态、近期活跃情况、主流程使用深度与付费信号。

### 9.3 Users

从平台级视角查看用户规模、身份与活跃情况。首版以查询为主，不承担复杂用户管理能力。

### 9.4 Subscriptions / Trials

集中查看 trial、paid、past due、canceled、即将到期等商业化状态，是连接产品使用与商业判断的关键模块。

### 9.5 Funnel Analytics

用于查看 workspace 从创建到主流程使用、再到升级与订阅激活的关键转化链路。首版重点是解释流失位置，而不是堆叠复杂图表。

## 10. 数据依赖与实现前提

首版运营管理端主要依赖以下对象与数据源：

- `users`
- `workspaces`
- `workspace_members`
- `workspace_subscriptions`
- `opportunities`
- `lead_briefs`
- `discovery_intelligence`
- `proposal_drafts`
- `follow_up_drafts`
- `activity_logs`

实现前提包括：

- 客户侧主流程关键事件定义稳定
- `activity_logs` 能承接首版核心事件
- `trial_status` / `billing_status` / `plan_type` 等字段稳定可读
- workspaces 与主流程实体具备基本聚合条件

## 11. 权限与安全约束

- 运营管理端必须为独立入口
- 首版必须具备独立 Admin Auth 与 `/api/v1/admin/auth/me`
- 不得复用客户侧登录态判断或 workspace guard
- 所有 `/admin/*` 页面与 `/api/v1/admin/*` 接口都必须经过 internal auth guard 与 internal role guard
- 客户侧用户不能访问运营管理端

## 12. 关键规则与约束

- 运营管理端以只读为主
- 页面应支持搜索、筛选、排序、分页
- 指标定义必须与《运营管理端指标与口径说明》一致
- 页面结构与路由必须与《运营管理端页面流程与信息架构说明》一致
- 页面字段与交互颗粒度应与《运营管理端页面清单与页面级需求》一致
- 查询协议与返回边界应与《运营管理端 API 需求说明》一致

## 13. 与其他文档的关系

- 本文档定义产品目标、边界和统一口径，是 admin 文档组上位文档
- 《运营管理端指标与口径说明》负责把本文档中的指标定义具体化
- 《运营管理端页面流程与信息架构说明》负责把模块结构落到路由、导航与页面关系
- 《运营管理端页面清单与页面级需求》负责把模块下钻到页面级字段、区块、状态与验收标准
- 《运营管理端 API 需求说明》负责把页面查询与指标读取能力落实为独立 admin API 设计

## 14. 已冻结决策

### 14.1 User Detail 的首版范围

`User Detail` 按 P1 预留处理，不作为首版必交页面。首版只要求 Users List 满足平台查询需求。

### 14.2 Overview 默认时间窗口的产品呈现方式

Overview 首版采用页面级统一时间窗口控件：

- 默认值为 `7d`
- 支持 `7d / 30d`
- 所有窗口型指标卡共用同一顶部选择器

## 15. 结论

ProposalFlow AI Admin 首版应作为平台内部独立产品面存在，以 workspace 视角为主、以只读查询为主、以统一口径为核心，帮助内部团队对增长、激活、主流程完成和商业化状态形成一致判断。
