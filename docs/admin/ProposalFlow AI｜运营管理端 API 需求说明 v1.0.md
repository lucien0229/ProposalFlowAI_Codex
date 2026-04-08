# ProposalFlow AI｜运营管理端 API 需求说明 v1.0

## 1. 文档目的

本文档用于定义 ProposalFlow AI 运营管理端首版所需的接口范围、命名空间、权限边界、查询模式、参数协议、返回结构与实施优先级，确保前后端、测试与数据侧对 admin API 的职责与口径有统一理解。

本文档重点回答以下问题：

- 运营端接口如何与客户侧 product API 分离
- 首版需要哪些 admin API
- 每类接口应承担什么职责
- 列表、聚合和漏斗查询如何统一参数协议
- 哪些指标由哪些接口提供
- 哪些能力当前不应通过 admin API 提供

## 2. 适用范围

适用于运营管理端首版的前端接入、后端接口设计、权限控制、测试验收与口径校对。

本文档只定义 admin API 的需求边界与建议结构，不替代数据库设计、缓存策略或内部实现细节。

## 3. 首版统一裁定

在定义接口前，先固化本文件必须遵守的统一结论。

### 3.1 主漏斗起点

`/api/v1/admin/funnels/workspace` 的正式起点固定为 `workspace_created`。

- `signup_completed` 不得混入 workspace 主漏斗
- 若未来提供 `/api/v1/admin/funnels/user`，需作为独立对象链路单独实现

### 3.2 `workflow_completion_rate` 分母

首版主展示口径固定为：

`workflow_completion_rate = Workflow Completed Workspaces / Activated Workspaces`

任何返回该指标的 Overview、Metrics 或 Funnel 相关接口，都必须遵守此口径，不得默认使用 `New Workspaces` 作为分母。

### 3.3 Overview 指标命名、统计对象与时间窗口

Overview 相关接口返回的指标必须满足以下要求：

- 指标命名能体现对象与窗口，不混淆对象量与事件量
- 规模类指标为截至统计时点的累计值
- 新增、转化、激活、完成类指标必须回显明确时间窗口
- 核心转化指标默认按 workspace 口径返回

### 3.4 过滤参数协议

admin 列表接口统一采用：

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
- `limit`
- `cursor`

指标与聚合接口统一采用：

- `from`
- `to`

### 3.5 订阅限制字段是否属于首版

属于首版。

订阅相关接口返回中，应补充以下字段以统一解释当前能力限制：

- `is_generation_allowed`
- `restriction_reason`

## 4. 边界结论

### 4.1 命名空间结论

运营管理端接口应使用独立命名空间：

- `/api/v1/admin/*`

客户侧业务接口继续使用：

- `/api/v1/*`

### 4.2 职责结论

admin API 的职责包括：

- 平台级查询
- 聚合统计
- 列表检索
- 明细查看
- 漏斗与指标读取

admin API 不应承担以下职责：

- 客户侧工作流事务写入
- opportunity 工作流推进
- 复杂运维控制
- 高风险手工改写

### 4.3 首版能力边界

首版 admin API 以只读为主，不要求提供以下能力：

- 手工修改 `trial_status`
- 手工修改 `billing_status`
- 批量禁用 workspace
- 强制修改主流程状态
- 复杂批量导出
- impersonation

## 5. 设计原则

### 5.1 平台视角原则

admin API 面向平台内部视角，允许跨 workspace 查询，但必须受 internal role 严格控制。

### 5.2 聚合优先原则

运营端页面需要的是能够直接支撑卡片、列表和明细的聚合型接口，而不是大量细碎资源接口。

### 5.3 口径一致原则

所有涉及指标、漏斗、试用与订阅状态的接口，必须与《运营管理端指标与口径说明》保持一致。

### 5.4 只读优先原则

首版 admin API 优先提供只读能力，以降低权限风险与实现复杂度。

## 6. 权限与鉴权要求

### 6.1 内部角色要求

admin API 仅允许以下角色访问：

- `internal_admin`
- `internal_analyst`

### 6.2 与客户侧角色分离

`workspace owner/member` 不能作为访问 admin API 的依据。

### 6.3 Guard 要求

所有 `/api/v1/admin/*` 接口均需经过：

- internal auth guard
- internal role guard

### 6.4 数据范围要求

首版允许 `internal_admin` 与 `internal_analyst` 查看平台级数据。若后续需要字段级限制，应单独扩展权限模型。

## 7. 统一返回与查询约定

### 7.1 成功返回结构建议

推荐统一使用：

```json
{
  "data": {},
  "meta": {
    "request_id": "...",
    "query_window": {
      "from": "...",
      "to": "..."
    }
  }
}
```

说明：

- 列表接口可在 `meta` 中补充分页信息
- 非窗口型接口可省略 `query_window`，但若接口支持 `from/to`，应回显最终生效值

### 7.2 列表分页建议

列表类接口建议统一支持：

- `limit`
- `cursor`
- `sort_by`
- `sort_direction`

首版若实现复杂度受限，可暂时采用 `page/page_size`，但不长期混用两套分页方式。当前正式协议仍推荐 cursor-based。

### 7.3 过滤参数建议

常见过滤参数建议统一命名：

- `q`
- `trial_status`
- `billing_status`
- `plan_type`
- `auth_method`
- `created_from`
- `created_to`
- `active_from`
- `active_to`

### 7.4 时间范围参数建议

指标与聚合接口统一支持：

- `from`
- `to`

说明：

- 所有趋势、转化、漏斗和聚合接口都应明确时间窗口
- 接口返回 `meta` 中应回显最终使用的时间窗口

### 7.5 错误结构建议

推荐统一使用：

```json
{
  "error": {
    "code": "...",
    "message": "...",
    "request_id": "..."
  }
}
```

权限错误建议：

- 未登录：401
- 非内部角色：403
- 对象不存在：404

## 8. 接口域一：Admin Auth

### 8.1 GET `/api/v1/admin/auth/me`

用途：

返回当前 admin 页面初始化所需的内部登录态与角色信息。

建议返回内容：

- `current_internal_user`
- `role_keys`
- `session_type`
- `is_authenticated`

说明：

- admin 端不得复用客户侧 `/api/v1/auth/me` 作为内部登录态判断依据
- 该接口是所有 `/admin/*` 页面 route guard 的基础依赖

## 9. 接口域二：Overview

### 9.1 GET `/api/v1/admin/overview`

用途：

返回 Overview 页面需要的核心平台级总览数据。

建议查询参数：

- `from`
- `to`

建议返回内容：

- `total_users`
- `total_workspaces`
- `active_workspaces`
- `paid_workspaces`
- `trial_active_workspaces`
- `trial_expired_workspaces`
- `new_users`
- `new_workspaces`
- `proposal_draft_generated_workspaces`
- `activation_rate`
- `workflow_completion_rate`
- `trial_to_paid_conversion_rate`
- `expiring_soon_count`
- `past_due_count`

说明：

- 该接口应直接返回卡片级可用数据
- 不要求前端自行聚合多个资源接口
- 返回中应明确窗口型指标的时间范围

## 10. 接口域三：Workspaces

### 10.1 GET `/api/v1/admin/workspaces`

用途：

返回 workspace 列表页数据。

建议查询参数：

- `q`
- `trial_status`
- `billing_status`
- `plan_type`
- `created_from`
- `created_to`
- `active_from`
- `active_to`
- `limit`
- `cursor`
- `sort_by`
- `sort_direction`

建议列表字段：

- `workspace_id`
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
- `high_activity_flag`
- `expiring_soon_flag`
- `is_generation_allowed`
- `restriction_reason`

### 10.2 GET `/api/v1/admin/workspaces/{workspace_id}`

用途：

返回单个 workspace 的详情页数据。

建议返回内容：

- workspace summary
- subscription summary
- members summary
- usage summary
- recent opportunities summary
- recent activity timeline summary

建议返回字段：

- `workspace_id`
- `workspace_name`
- `created_at`
- `trial_status`
- `billing_status`
- `plan_type`
- `current_period_end`
- `recent_activity_at`
- `is_generation_allowed`
- `restriction_reason`
- `members[]`
- `usage_snapshot`
- `recent_opportunities[]`
- `recent_activities[]`

### 10.3 GET `/api/v1/admin/workspaces/{workspace_id}/activities`

用途：

读取该 workspace 的关键行为时间线。

建议查询参数：

- `from`
- `to`
- `limit`
- `cursor`

建议返回字段：

- `event_name`
- `occurred_at`
- `user_id`
- `opportunity_id`
- `summary`

说明：

- 若团队希望减小接口数，可折叠进 workspace detail 接口
- 首版避免过度拆分接口

## 11. 接口域四：Users

### 11.1 GET `/api/v1/admin/users`

用途：

返回用户列表页数据。

建议查询参数：

- `q`
- `auth_method`
- `created_from`
- `created_to`
- `active_from`
- `active_to`
- `limit`
- `cursor`
- `sort_by`
- `sort_direction`

建议列表字段：

- `user_id`
- `email`
- `full_name`
- `auth_method`
- `created_at`
- `last_active_at`
- `workspace_count`
- `primary_workspace_name`

### 11.2 GET `/api/v1/admin/users/{user_id}`

用途：

返回单个用户详情数据。

说明：

- User Detail 当前为 P1，可先预留接口定义
- 若首版不做页面，可不实现该接口

建议返回内容：

- user summary
- auth identity summary
- related workspaces
- recent activities

## 12. 接口域五：Subscriptions / Trials

### 12.1 GET `/api/v1/admin/subscriptions`

用途：

返回试用与订阅状态列表。

建议查询参数：

- `trial_status`
- `billing_status`
- `plan_type`
- `limit`
- `cursor`
- `sort_by`
- `sort_direction`
- `from`
- `to`

说明：Subscriptions 页首版时间相关筛选统一沿用窗口参数，不额外定义新的账期筛选命名。

建议列表字段：

- `workspace_id`
- `workspace_name`
- `trial_status`
- `trial_start_at`
- `trial_end_at`
- `billing_status`
- `plan_type`
- `current_period_end`
- `stripe_customer_id`
- `stripe_subscription_id`
- `expiring_soon_flag`
- `is_generation_allowed`
- `restriction_reason`

### 12.2 GET `/api/v1/admin/subscriptions/summary`

用途：

返回 Subscriptions / Trials 页面顶部卡片或摘要信息。

建议返回内容：

- `trial_active_workspaces`
- `trial_expired_workspaces`
- `paid_workspaces`
- `past_due_workspaces`
- `canceled_workspaces`
- `expiring_soon_workspaces`

说明：

- 若页面不需要独立卡片区，也可将该能力并入 `/api/v1/admin/subscriptions` 的 `meta`
- 当前建议作为 P1 预留能力

## 13. 接口域六：Funnel Analytics

### 13.1 GET `/api/v1/admin/funnels/workspace`

用途：

返回以 workspace 为主对象的核心漏斗数据。

建议查询参数：

- `from`
- `to`

建议返回内容：

- `steps[]`
- `counts[]`
- `conversion_rates[]`
- `total_start_count`
- `total_end_count`

建议节点顺序：

1. `workspace_created`
2. `opportunity_created`
3. `lead_brief_generated`
4. `discovery_intelligence_generated`
5. `proposal_draft_generated`
6. `followup_generated`
7. `upgrade_clicked`
8. `subscription_activated`

说明：

- 首版默认仅要求 workspace funnel
- `signup_completed` 仅能进入独立 user funnel 或 Overview 辅助指标，不得混入此接口

### 13.2 GET `/api/v1/admin/funnels/user`

用途：

返回 user 级漏斗数据。

说明：

- 首版可不实现，但在文档中预留
- 若实现，需明确其对象与 workspace funnel 不可直接混比

### 13.3 GET `/api/v1/admin/metrics/conversion`

用途：

返回核心转化指标集合。

建议返回内容：

- `activation_rate`
- `workflow_completion_rate`
- `trial_to_paid_conversion_rate`
- `week3_retention_rate`（如已具备口径和数据基础）

说明：

- 若团队希望减少接口数量，可并入 `/api/v1/admin/overview`
- 当前更适合作为 P1 预留能力

## 14. 接口域七：Metrics / Summary

### 14.1 GET `/api/v1/admin/metrics/usage`

用途：

返回使用深度相关指标。

建议返回内容：

- `active_workspaces`
- `opportunities_per_workspace`
- `proposal_drafts_per_workspace`
- `multi_opportunity_workspace_rate`

### 14.2 GET `/api/v1/admin/metrics/retention`

用途：

返回留存相关指标。

建议返回内容：

- `activated_workspaces`
- `retained_workspaces_week3`
- `week3_retention_rate`

说明：

- 若当前阶段留存数据基础不足，可保留文档定义，接口后置实现

## 15. 字段与口径约束

### 15.1 状态字段统一来源

以下字段必须以系统内部字段为正式来源：

- `trial_status`
- `billing_status`
- `plan_type`
- `current_period_end`

### 15.2 事件来源统一原则

漏斗与行为量统计应基于 `activity_logs` 与核心业务表联合校验，不得由前端临时推导。

### 15.3 统计对象必须清晰

每个 admin 指标接口必须在实现和测试中明确：

- 统计对象是 user、workspace 还是 opportunity
- 去重主键是什么
- 时间窗口是什么

## 16. 排序与筛选建议

### 16.1 Workspaces 默认排序

建议默认按 `recent_activity_at desc` 排序。

### 16.2 Users 默认排序

建议默认按 `created_at desc` 或 `last_active_at desc`，并在首版固定一种。

### 16.3 Subscriptions 默认排序

建议默认按 `current_period_end asc` 或 expiring soon 优先排序。

## 17. 测试要求

### 17.1 测试重点

测试 admin API 时，必须验证：

- 权限正确
- 过滤正确
- 分页正确
- 排序正确
- 统计对象正确
- 时间窗口正确
- 指标口径与文档一致

### 17.2 数据校验原则

对于关键指标接口，应至少通过以下方式校验：

- 小样本人工验算
- 与数据库直接聚合比对
- 与页面展示交叉验证

## 18. 实施建议

### 18.1 首版实现优先级

**P0 建议实现**

- `GET /api/v1/admin/auth/me`
- `GET /api/v1/admin/overview`
- `GET /api/v1/admin/workspaces`
- `GET /api/v1/admin/workspaces/{workspace_id}`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/subscriptions`
- `GET /api/v1/admin/funnels/workspace`

**P1 可预留**

- `GET /api/v1/admin/users/{user_id}`
- `GET /api/v1/admin/subscriptions/summary`
- `GET /api/v1/admin/metrics/conversion`
- `GET /api/v1/admin/metrics/usage`
- `GET /api/v1/admin/metrics/retention`
- `GET /api/v1/admin/funnels/user`

### 18.2 实现策略建议

- 先满足页面最小查询需求
- 不先做大而全数据接口
- 不把 admin API 写成客户侧 product API 的变体
- 对重型统计查询保持克制，必要时再做缓存或预聚合

## 19. 与其他文档的关系

- 本文档承接《运营管理端 PRD》的产品边界和统一裁定
- 指标含义、分子分母与时间窗口以《运营管理端指标与口径说明》为准
- 页面消费方式和路由语义应与《运营管理端页面流程与信息架构说明》一致
- 页面字段颗粒度与优先级应与《运营管理端页面清单与页面级需求》一致

## 20. 已冻结决策

### 20.1 Subscriptions 页时间筛选参数形式

首版统一沿用通用列表协议中的 `from` / `to`，不新增专门针对 `current_period_end` 的独立筛选字段。

### 20.2 `GET /api/v1/admin/metrics/conversion` 的首版形态

首版不单独实现，统一并入 `/api/v1/admin/overview`。

### 20.3 `GET /api/v1/admin/workspaces/{workspace_id}/activities` 的首版形态

首版不单独拆分，活动时间线折叠进 `workspace detail` 查询结果。

## 21. 结论

ProposalFlow AI 运营管理端首版 API 设计，应坚持“命名空间独立、权限严格、只读优先、聚合优先、口径一致”的原则，围绕 Overview、Workspaces、Users、Subscriptions / Trials、Funnel Analytics 五类核心读接口提供稳定、清晰、可直接支撑页面的 admin 查询能力，而不混入客户侧事务型工作流接口。
