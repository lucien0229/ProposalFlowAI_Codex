# ProposalFlow AI｜API 设计 v1.0

## 1. 文档目的

本文档定义 ProposalFlow AI MVP 阶段的产品 API 契约，用于支撑前端实现、后端开发、接口联调、自动化测试与后续 OpenAPI 输出。

本审校版重点统一：
- API 资源边界与机会中心化模型
- current resource、version history 与 restore 语义
- 页面模型与 API 资源模型的对应关系
- 规则层、文件处理、计费限制与 web/admin 会话边界

## 2. 适用范围

适用于：
- 接口建模与命名
- 前后端联调
- 接口测试设计
- OpenAPI 文档生成

## 3. 核心定义与术语

- **Opportunity-centered API**：围绕 opportunity 组织 Lead Brief、Discovery、Proposal Draft 与 Follow-up 子资源。
- **Current Resource**：当前工作态的业务资源。
- **Version History**：通过 save-version 显式保存的历史快照。
- **Restore**：把指定历史版本写回当前工作态，不自动创建新历史版本。
- **Workspace Rule Set**：workspace 级基线规则的唯一有效来源。
- **Opportunity Rule Override**：只对当前机会生效的局部规则覆盖。
- **Effective Rules**：模板定义、workspace 基线规则与 opportunity 覆盖合成后的实际生效规则。
- **restriction_reason**：计费或权限限制下返回给前端的明确解释字段。

## 4. API 设计原则

### 4.1 Opportunity-centered

Lead Brief、Discovery、Proposal Draft、Follow-up 都属于机会上下文的一部分，因此 API 必须围绕 opportunity 组织资源，而不是围绕分散的生成动作组织。

### 4.2 Current Resource + Version History

所有可编辑核心资源都需要同时支持：
- 当前工作态读取 / 更新
- 历史版本保存与查询
- Restore 到当前工作态

### 4.3 Structured-first

生成类接口优先返回结构化数据，由前端按页面 schema 渲染，而不是直接返回不可解释的大段长文本。

### 4.4 Predictable Error

所有错误响应必须使用统一结构、明确错误码，并在涉及限制状态时返回可展示的 restriction 信息。

### 4.5 Minimal Surface

MVP 不追求大而全，只暴露当前产品面真实需要的 API 资源与动作。

## 5. 总体风格

### 5.1 风格结论

MVP API 应采用清晰、可稳定扩展的资源化接口风格，前缀统一为：

`/api/v1`

### 5.2 路由命名原则

- 资源名使用复数：`/workspaces`、`/opportunities`
- 子资源嵌套在父资源下：`/opportunities/{id}/lead-brief`
- 仅在必要时使用动作型后缀：`/generate`、`/save-version`、`/restore`
- URL 表示资源位置，不表达一次性 UI 动作

### 5.3 版本控制

当前阶段统一使用 URL 前缀版本：

`/api/v1`

发生破坏性变更时再升级到 `/api/v2`。

## 6. 认证、会话与安全边界

### 6.1 Web 会话结论

MVP 客户侧 API 需要采用统一的登录态机制：

- 登录后应建立可持续识别用户身份的会话
- 业务 API 需能解析 current_user 与 current_workspace
- 具体会话载体与防护细节不在本轮文档中拍板

### 6.2 支持的登录方式

- email/password
- Google OAuth

但进入业务 API 层后，统一以应用用户与 workspace 上下文为准。

### 6.3 web/admin 会话边界

正式冻结约束：

- `/api/v1/auth/*` 仅处理客户侧 web 登录态
- 未来运营管理端使用独立命名空间：`/api/v1/admin/*` 与 `/api/v1/admin/auth/*`
- web 与 admin 不得共用同一个 `auth/me` 语义
- web 与 admin 的认证实现必须相互隔离

### 6.4 安全边界

本文件只冻结安全边界要求，不冻结具体实现细节：

- 客户侧登录态必须具备基础会话安全保护
- 写操作需要有相应的请求防护机制
- 第三方登录回调需要有完整校验
- 允许哪些前端来源访问受保护接口，需在实现前明确

## 7. 统一响应模型

### 7.1 成功响应

```json
{
  "data": { ... },
  "meta": { ... }
}
```

### 7.2 列表响应

```json
{
  "data": [ ... ],
  "meta": {
    "pagination": {
      "cursor": "...",
      "next_cursor": "...",
      "has_more": true
    },
    "request_id": "..."
  }
}
```

### 7.3 错误响应

```json
{
  "error": {
    "code": "OPPORTUNITY_NOT_FOUND",
    "message": "Opportunity not found.",
    "details": { ... },
    "restriction_reason": null,
    "request_id": "..."
  }
}
```

### 7.4 常见错误码

- UNAUTHORIZED
- FORBIDDEN
- VALIDATION_ERROR
- WORKSPACE_SETUP_REQUIRED
- WORKSPACE_NOT_FOUND
- OPPORTUNITY_NOT_FOUND
- LEAD_BRIEF_REQUIRED
- DISCOVERY_REQUIRED
- PROPOSAL_DRAFT_REQUIRED
- PROPOSAL_DRAFT_GENERATION_FAILED
- PDF_EXTRACTION_FAILED
- BILLING_STATE_INVALID
- TRIAL_EXPIRED
- PLAN_RESTRICTED
- RATE_LIMITED

## 8. HTTP 状态处理建议

当前文档仅冻结以下较粗粒度口径：

- 成功请求返回 2xx
- 参数、权限、依赖或状态不满足时返回对应错误状态
- 资源不存在时返回未找到语义
- 并发、限制或外部依赖异常时返回可解释错误

说明：更细的 HTTP 状态码映射策略可在实现阶段结合技术栈进一步细化。

## 9. 分页、排序与过滤协议

### 9.1 分页

MVP 列表接口优先采用 cursor-based pagination。

统一参数：
- `limit`
- `cursor`
- `order_by`
- `order_direction`

### 9.2 过滤协议冻结

统一命名风格：
- `q`
- `status`
- `trial_status`
- `billing_status`
- `plan_type`
- `created_from` / `created_to`
- `updated_from` / `updated_to`
- `limit` / `cursor`

说明：业务过滤字段需显式列举，不接受任意自由字段透传。

## 10. 并发控制与幂等

### 10.1 乐观并发控制

以下资源建议支持并发控制：
- lead_brief
- discovery
- proposal_draft
- follow_up_draft
- workspace_rule_set
- opportunity_rule_override

推荐方式：请求携带 `version_no`、`updated_at` 或等价字段；若版本落后，应返回可识别的并发冲突错误。

### 10.2 幂等策略

建议支持幂等的接口：
- opportunity create（可选）
- generate 类接口
- Stripe webhook processing
- upload completion callbacks

实现建议：Idempotency-Key 或外部事件去重。

## 11. 资源总览

MVP API 资源分为：
1. Auth
2. Workspace
3. Opportunities
4. Opportunity Inputs / Files
5. Lead Brief
6. Discovery
7. Proposal Draft
8. Follow-up
9. Templates & Rules
10. Billing / Trial
11. Webhooks
12. System / Health

## 12. Auth API

### 12.1 端点

- `POST /api/v1/auth/sign-up`
- `POST /api/v1/auth/sign-in`
- `POST /api/v1/auth/sign-out`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/google/start`
- `GET /api/v1/auth/google/callback`
- `GET /api/v1/auth/me`

### 12.2 `GET /api/v1/auth/me` 统一语义

若用户已登录但未完成 workspace setup，建议返回：
- `workspace: null`
- `workspace_setup_required: true`

说明：前端可据此直接跳转 setup。

## 13. Workspace API

### 13.1 端点

- `POST /api/v1/workspaces`
- `GET /api/v1/workspaces/current`
- `PATCH /api/v1/workspaces/current`
- `GET /api/v1/workspaces/current/members`

### 13.2 字段口径

workspace 必须至少包含：
- `name`
- `industry_type`
- `default_template_key`
- `default_tone_preference`

`industry_type` 统一为：
- `web_development_agency`
- `product_ux_agency`

## 14. Opportunities API

### 14.1 端点

- `GET /api/v1/opportunities`
- `POST /api/v1/opportunities`
- `GET /api/v1/opportunities/{opportunity_id}`
- `PATCH /api/v1/opportunities/{opportunity_id}`
- `POST /api/v1/opportunities/{opportunity_id}/archive`
- `POST /api/v1/opportunities/{opportunity_id}/unarchive`

### 14.2 资源职责

`/opportunities/{id}` 应返回：
- 基础字段
- 当前 workflow summary
- step readiness
- 相关限制信息（如生成受限）

## 15. Opportunity Inputs / Files API

### 15.1 原始输入

- `GET /api/v1/opportunities/{opportunity_id}/inputs`
- `POST /api/v1/opportunities/{opportunity_id}/inputs`
- `PATCH /api/v1/opportunities/{opportunity_id}/inputs/{input_id}`

### 15.2 文件上传与处理

- `POST /api/v1/opportunities/{opportunity_id}/files/upload-url`
- `POST /api/v1/opportunities/{opportunity_id}/files/{file_asset_id}/complete`
- `GET /api/v1/opportunities/{opportunity_id}/files/{file_asset_id}`
- 可选补充：`POST /api/v1/opportunities/{opportunity_id}/files/{file_asset_id}/retry`

### 15.3 文件状态统一口径

页面与接口需统一支持：
- `uploaded`
- `processing`
- `ready`
- `failed`

补充约束：
- `complete` 后返回 `file_status = processing`
- `GET file detail` 必须返回 `file_status` 与 `latest_job_status`
- 抽取失败时，前端必须可展示 retry CTA
- 重试应新增处理 job，而不是覆盖历史 job 结果

## 16. Lead Brief API

### 16.1 端点

- `GET /api/v1/opportunities/{opportunity_id}/lead-brief`
- `POST /api/v1/opportunities/{opportunity_id}/lead-brief/generate`
- `PATCH /api/v1/opportunities/{opportunity_id}/lead-brief`
- `POST /api/v1/opportunities/{opportunity_id}/lead-brief/save-version`
- `GET /api/v1/opportunities/{opportunity_id}/lead-brief/versions`
- `GET /api/v1/opportunities/{opportunity_id}/lead-brief/versions/{version_id}`
- `POST /api/v1/opportunities/{opportunity_id}/lead-brief/versions/{version_id}/restore`

### 16.2 版本语义

- `PATCH`：只更新当前工作态
- `save-version`：创建新历史版本
- `generate`：默认刷新当前工作态，不自动保存历史版本
- `restore`：把指定历史版本写回当前工作态，不自动新增历史版本

### 16.3 重生成边界

MVP 统一按整体重生成处理；字段级更细粒度重生成不作为 API 基线强制要求。

## 17. Discovery API

### 17.1 端点

- `GET /api/v1/opportunities/{opportunity_id}/discovery`
- `POST /api/v1/opportunities/{opportunity_id}/discovery/records`
- `POST /api/v1/opportunities/{opportunity_id}/discovery/generate`
- `PATCH /api/v1/opportunities/{opportunity_id}/discovery`
- `POST /api/v1/opportunities/{opportunity_id}/discovery/save-version`
- `GET /api/v1/opportunities/{opportunity_id}/discovery/versions`
- `GET /api/v1/opportunities/{opportunity_id}/discovery/versions/{version_id}`
- `POST /api/v1/opportunities/{opportunity_id}/discovery/versions/{version_id}/restore`

### 17.2 版本语义

与 Lead Brief 一致：current resource、save-version、restore 三者分离。

### 17.3 依赖规则

Discovery 可作为推荐前置步骤进入；但 Proposal Draft 生成必须依赖可用 Lead Brief 与基础 Discovery。

## 18. Proposal Draft API

### 18.1 端点

- `GET /api/v1/opportunities/{opportunity_id}/proposal-draft`
- `POST /api/v1/opportunities/{opportunity_id}/proposal-draft/generate`
- `PATCH /api/v1/opportunities/{opportunity_id}/proposal-draft`
- `POST /api/v1/opportunities/{opportunity_id}/proposal-draft/sections/{section_key}/regenerate`
- `POST /api/v1/opportunities/{opportunity_id}/proposal-draft/save-version`
- `GET /api/v1/opportunities/{opportunity_id}/proposal-draft/versions`
- `GET /api/v1/opportunities/{opportunity_id}/proposal-draft/versions/{version_id}`
- `POST /api/v1/opportunities/{opportunity_id}/proposal-draft/versions/{version_id}/restore`
- `GET /api/v1/opportunities/{opportunity_id}/proposal-draft/export`

### 18.2 生成前置规则

Proposal Draft 生成必须满足：

- 存在 current Lead Brief
- 存在基础 Discovery 信息

否则返回依赖未满足的错误响应，错误码可参考：

- `LEAD_BRIEF_REQUIRED`
- `DISCOVERY_REQUIRED`

### 18.3 生成请求核心字段

建议包含：
- `template_key`
- `use_workspace_rules`
- `use_opportunity_overrides`
- `force_low_confidence`

### 18.4 统一响应要求

返回建议包含：
- `template_key`
- `current_payload`
- `latest_version_no`
- `confidence_notes`
- `warnings`
- `effective_rule_summary`
- `has_override`

### 18.5 章节重生成规则

`POST /sections/{section_key}/regenerate`：
- 至少支持章节级重生成
- 若章节已被手动编辑，必须要求显式覆盖策略
- 不允许无提示覆盖

### 18.6 导出

`GET /export` 查询参数建议支持：
- `format=text`
- `format=markdown`

## 19. Follow-up API

### 19.1 端点

- `GET /api/v1/opportunities/{opportunity_id}/follow-up`
- `POST /api/v1/opportunities/{opportunity_id}/follow-up/generate`
- `PATCH /api/v1/opportunities/{opportunity_id}/follow-up`
- `POST /api/v1/opportunities/{opportunity_id}/follow-up/save-version`
- `GET /api/v1/opportunities/{opportunity_id}/follow-up/versions`
- `GET /api/v1/opportunities/{opportunity_id}/follow-up/versions/{version_id}`
- `POST /api/v1/opportunities/{opportunity_id}/follow-up/versions/{version_id}/restore`

### 19.2 生成前置规则

Follow-up 统一按“已有 current Proposal Draft”处理。

若无 current Proposal Draft：
- 页面可进入，但正式生成应返回依赖错误
- 错误码建议：`PROPOSAL_DRAFT_REQUIRED`

### 19.3 生成请求字段

建议包含：
- `scenario_type`
- `tone`（是否作为显式用户可切换字段对外开放，当前仍待冻结）

返回至少包含：
- `subject`
- `body`
- `cta`

## 20. Templates & Rules API

### 20.1 端点

- `GET /api/v1/templates`
- `GET /api/v1/workspaces/current/rules`
- `PUT /api/v1/workspaces/current/rules`
- `POST /api/v1/workspaces/current/rules/validate`
- `GET /api/v1/opportunities/{opportunity_id}/rules/effective`
- `GET /api/v1/opportunities/{opportunity_id}/rules/override`
- `PUT /api/v1/opportunities/{opportunity_id}/rules/override`
- `DELETE /api/v1/opportunities/{opportunity_id}/rules/override`

### 20.2 模板与行业类型统一口径

MVP 模板：
- `development_agency`
- `product_ux_agency`
- `web_delivery_proposal`

行业类型默认映射：
- `web_development_agency` → `development_agency`
- `product_ux_agency` → `product_ux_agency`

说明：自动推荐算法尚未完全冻结，因此 API 不强制固化复杂推荐逻辑。

### 20.3 source of truth 规则

- `workspace_rule_sets` 是 workspace 基线规则的唯一有效来源
- `opportunity_rule_overrides` 是当前机会局部覆盖的唯一来源
- effective rules 由模板定义、workspace rule set 与 opportunity override 合成计算

### 20.4 冲突与并发

- `PUT /workspaces/current/rules` 应携带并发控制字段
- `PUT /opportunities/{id}/rules/override` 应携带 `updated_at` 或等价字段
- 过期写入应返回可识别的冲突错误

## 21. Billing / Trial API

### 21.1 端点

- `GET /api/v1/workspaces/current/billing`
- `POST /api/v1/workspaces/current/billing/checkout-session`
- `POST /api/v1/workspaces/current/billing/portal-session`
- `GET /api/v1/workspaces/current/billing/history`（MVP 可选）

### 21.2 统一状态字段

- `trial_status`
- `trial_start_at`
- `trial_end_at`
- `billing_status`
- `plan_type`
- `current_period_end`
- `is_generation_allowed`
- `restriction_reason`

### 21.3 状态矩阵基线

- `trial_active`：允许完整使用主链路
- `trial_expired`：允许查看既有数据与 Billing，默认阻断新生成动作；`regenerate` / `export` / `restore` 是否受限待冻结
- `paid_active`：允许完整使用
- `past_due`：允许查看历史数据与修复支付，默认阻断新生成动作；`regenerate` / `export` / `restore` 是否受限待冻结
- `canceled / inactive`：允许只读访问与升级入口，默认阻断新生成动作；`regenerate` / `export` / `restore` 是否受限待冻结

所有受限响应都应返回明确错误码与 `restriction_reason`。

## 22. Webhook API

### 22.1 端点

- `POST /api/v1/webhooks/stripe`

### 22.2 要求

- 校验 Stripe 签名
- 基于 `external_event_id` 幂等处理
- 原始事件落库后再更新 workspace / subscription 状态

建议处理事件：
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

## 23. System / Health API

- `GET /api/v1/health`
- `GET /api/v1/ready`

## 24. 同步 / 异步规则

### 24.1 同步接口

MVP 建议保持同步的生成接口：
- lead-brief/generate
- discovery/generate
- proposal-draft/generate
- proposal-draft section regenerate
- follow-up/generate

### 24.2 异步接口

建议异步的操作：
- PDF 文本抽取
- Stripe webhook 后处理中的重型逻辑
- 未来的大型导出任务

## 25. 请求与响应 schema 建议

### 25.1 Schema 原则

- 请求与响应使用显式 schema
- JSONB 数据在 API 层先做 schema 校验
- 版本类资源必须明确 `version_no`
- 列表资源返回最小字段集，不做过度返回

### 25.2 技术实现说明

请求与响应需要有明确的 schema 约束；具体采用何种校验或类型工具，可在实现阶段结合技术栈确定。

## 26. 接口测试建议

至少覆盖：
- contract tests
- auth tests
- permission tests
- workflow dependency tests
- stripe webhook tests
- file upload / extraction status tests
- generation failure / retry tests
- restore 语义测试

关键必测场景：
- 未登录访问受保护资源
- workspace 不匹配访问
- 无 Lead Brief 直接生成 Proposal Draft
- 无 Proposal Draft 直接生成 Follow-up
- PDF 上传后抽取失败与 retry
- Proposal Draft 章节重生成覆盖冲突
- 版本 restore 后 current payload 更新
- trial_expired / past_due 状态下动作限制

## 27. 与页面模型的关系

API 资源模型与页面模型应严格对应：

- Opportunity 页面容器 ↔ `/opportunities/{id}`
- Lead Brief 页面 ↔ `/lead-brief`
- Discovery 页面 ↔ `/discovery`
- Proposal Draft 页面 ↔ `/proposal-draft`
- Follow-up 页面 ↔ `/follow-up`
- Templates & Rules 页面 ↔ `/workspaces/current/rules`
- Scope Builder 规则面板 ↔ `/rules/effective` 与 `/rules/override`

版本 UI 的 `View History / Preview Version / Restore 到当前工作态`，必须在 API 层分别有可对应的 list、detail、restore 动作。

## 28. 与其他文档的关系

- 与《产品方案升级版》：承接 opportunity-centered、draft-first、rule-constrained 与计费基线。
- 与《PRD》：把核心对象、依赖、版本语义与限制矩阵落到接口层。
- 与《MVP 功能清单》：为 P0 的版本闭环、规则层、文件状态机和计费限制提供接口支撑。
- 与《页面流程与信息架构说明》：确保路由守卫与接口依赖一致。
- 与《页面清单与页面级需求》：为每个页面提供 read / write / generate / version / restore 能力。

## 29. 已冻结决策

1. **受限计费状态下的动作粒度**
   - `trial_expired`、`past_due`、`canceled`、`inactive` 下，统一阻断 `generate`、`regenerate`、`save current`、`save-version`、`restore`、`export`，但保留查看与商业化相关动作。
2. **文件 retry 的接口形态**
   - 首版保留显式 retry 端点：`POST /api/v1/opportunities/{opportunity_id}/files/{file_asset_id}/retry`。
3. **模板自动推荐是否进入 API 层**
   - 首版不提供独立 recommendation API，只保留默认模板映射与手动选择能力。

## 30. 结论

ProposalFlow AI 的 MVP API 应围绕以下统一模型展开：

- **workspace 租户边界**
- **opportunity 业务容器**
- **current resource + version history + restore**
- **workspace rule set + opportunity override + effective rules**
- **计费限制与文件状态的可解释响应**

这套设计的核心目标不是暴露尽可能多的接口，而是为页面与主流程提供稳定、可测试、可审计的工作流契约。