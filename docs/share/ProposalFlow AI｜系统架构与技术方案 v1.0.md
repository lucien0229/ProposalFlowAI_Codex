# ProposalFlow AI｜系统架构与技术方案 v1.0

## 1. 文档目的

本文档用于在正式进入数据库设计、API 设计和页面实现之前，先确定 ProposalFlow AI 的系统边界、模块拆分、核心技术选型和关键集成方案。

其重点回答：

- 系统由哪些核心运行单元组成
- 前端、后端、AI、支付、文件处理如何协同
- 哪些链路同步，哪些链路异步
- 哪些技术决策现在必须确定，哪些应后置
- 如何在保证交付速度的前提下控制复杂度与返工成本

## 2. 适用范围

适用于开发启动、技术选型、模块拆分、接口设计前置和数据库设计前置。

## 3. 架构设计约束

### 3.1 产品约束

ProposalFlow AI 当前阶段不是通用 proposal 平台，而是面向小型 web / product / development agency 的 pre-proposal workflow product。

MVP 核心业务链路为：

`Opportunity / Lead Intake → Lead Brief → Discovery Intelligence → Proposal Draft → Follow-up`

因此系统架构必须服务于以下原则：

- opportunity 为主业务容器
- draft-first，而非 final automation
- AI 输出优先结构化、可复核、可编辑
- 模板与规则作用于 Proposal Draft 生成
- 试用、计费、认证、版本与审计都是产品级能力

### 3.2 开发方式约束

技术方案需要满足：

- 文档驱动开发
- 契约优先（schema / API / state machine 先行）
- 页面和路由结构清晰
- 便于逐页、逐模块交付
- 便于按模块独立实现与测试

### 3.3 MVP 架构约束

MVP 阶段应避免：

- 过早引入多供应商抽象层
- 过早构建复杂事件驱动系统
- 过早拆分微服务
- 过早把所有生成逻辑异步任务化
- 过早为未来复杂权限或复杂协作做过度设计

## 4. 推荐总体架构

### 4.1 架构结论

ProposalFlow AI 的 MVP 推荐采用前后端分离的模块化单体（modular monolith）架构。

平台在产品面上扩展为：

- 客户侧产品
- 运营管理端

两者共享平台底座，但在前端入口、导航、权限和文档层保持分离。

### 4.2 推荐运行单元

| 运行单元 | 职责 |
| --- | --- |
| Web Frontend（`apps/web`） | 客户侧页面渲染、交互、登录入口、调用后端 API、展示 AI 输出、Billing 入口 |
| Admin Frontend（`apps/admin`） | 运营管理端入口、Overview、Workspaces、Users、Subscriptions、Funnels |
| Backend API（`apps/api`） | 业务规则、权限校验、数据持久化、AI orchestration、模板与规则应用、版本保存、Stripe / auth / file integration |
| Worker（`apps/worker`） | PDF 文本抽取、重试型 AI 任务、Webhook 后处理、导出与延迟任务 |
| PostgreSQL | 核心业务数据、版本数据、规则数据、试用与账单映射数据、AI 调用审计 |
| Redis | 短期缓存、幂等键、任务队列与后台作业协调 |
| Object Storage | PDF 与上传文件、解析中间文件、必要时的导出文件 |
| OpenAI | AI 推理与结构化输出 |
| Stripe | 订阅计费与客户自助账单管理 |

### 4.3 为什么不建议一开始做微服务

当前阶段的核心问题是：

- 跑通主业务链路
- 控制 AI 输出可靠性
- 验证试用、激活、留存与转化

而不是解决大规模组织协作或超大流量问题。

因此当前阶段更适合模块化单体，因为它：

- 交付速度更快
- 调试成本更低
- 数据一致性更易控制
- 业务规则更集中
- 更适合频繁迭代与重构

## 5. 技术栈建议

### 5.1 前端技术栈

推荐：

- React + TypeScript
- Next.js
- Tailwind CSS
- React Hook Form
- Zod
- TanStack Query

### 5.2 后端技术栈

推荐：

- Python
- FastAPI
- Pydantic
- SQLAlchemy 或 SQLModel

### 5.3 数据库与存储

推荐：

- PostgreSQL：主数据库
- Redis：缓存 + 队列协作
- S3 兼容对象存储：上传文件与中间产物

### 5.4 认证与账户体系

系统设计必须兼容：

- email/password
- Google OAuth

并满足：

- 认证层与应用用户表分离
- 应用层保留 `auth_provider`、`auth_provider_user_id` 等映射能力
- 可同时支持 web/admin 双会话类型

### 5.5 AI 能力接入

推荐：

- OpenAI Responses API
- Structured Outputs + JSON Schema
- 模型路由：高频任务用轻量模型，高价值 Proposal Draft 用高质量模型

### 5.6 支付与订阅

推荐：

- Stripe Checkout
- Stripe Billing
- Stripe Customer Portal
- Stripe Webhooks

## 6. 系统模块划分

### 6.1 Frontend 模块

客户侧前端模块建议：

- auth
- workspace setup
- dashboard
- opportunities
- lead brief workspace
- discovery workspace
- proposal draft workspace
- follow-up workspace
- templates & rules
- billing
- settings

运营管理端前端模块建议：

- internal auth entry
- overview
- workspaces
- users
- subscriptions / trials
- funnel analytics

### 6.2 Backend 模块

后端建议按以下业务模块划分：

- auth integration module
- workspace module
- opportunity module
- lead brief module
- discovery module
- proposal draft module
- follow-up module
- templates & rules module
- billing module
- file processing module
- ai orchestration module
- versioning & audit module
- activity logging / analytics instrumentation module
- admin reporting module

> `admin reporting module` 应独立存在，不建议把运营查询逻辑直接混入客户侧工作流模块。

### 6.3 Worker 模块

Worker 建议承接：

- PDF text extraction
- 失败重试型任务
- Stripe webhook 后处理
- 导出文件生成（后续）
- 未来的异步通知任务

## 7. 核心架构决策

### 7.1 Opportunity-centered 架构

系统的主业务数据、页面和 AI 结果都围绕 opportunity 展开。

### 7.2 AI 生成采用两段式管线

Proposal Draft 不应直接从原始长文本一步生成，而应采用：

- 第 1 段：原始输入 → 结构化提炼（Lead Brief / Discovery Intelligence）
- 第 2 段：结构化数据 + 模板 + 规则 → Proposal Draft

### 7.3 同步优先，异步补强

MVP 阶段核心生成动作优先采用同步请求-响应模式：

- Lead Brief generation
- Discovery Intelligence generation
- Proposal Draft generation
- Proposal Draft section regeneration
- Follow-up generation

异步更适用于：

- PDF 解析
- 重试逻辑
- Webhook 后处理
- 导出文件生成

### 7.4 模板与规则属于业务层能力

模板与规则不应只是前端配置项，也不应仅停留在 prompt 文本拼接层。

正确做法：

- 规则以结构化字段持久化
- 规则由后端应用层解释和校验
- AI 调用时由后端根据规则拼装输入与约束
- 输出与规则冲突时显式标记风险

### 7.5 规则集作为生成时的唯一有效配置来源

明确结论：

- `workspaces.default_*` 仅用于初始化与轻量展示默认值
- `workspace_rule_sets` 是生成时的唯一有效规则来源
- `opportunity_rule_overrides` 表示单个 opportunity 的局部覆盖
- `effective rules` 由应用层在生成链路中计算

## 8. 核心链路设计

### 8.1 认证链路

`Frontend → Auth Flow → Backend session/token verification → App user record lookup/create → Workspace membership resolution → Enter product`

要求：

- Google 与邮箱登录最终都映射到同一个业务 user 记录模型
- 后端必须能根据 token/session 得到 `user_id` 与 `workspace_id`
- 未完成 workspace setup 的用户必须被引导至 setup

### 8.2 Opportunity 创建链路

`Frontend form / paste / PDF upload → Backend opportunity create → raw_input save → optional PDF text extraction → opportunity status update`

### 8.3 Lead Brief 生成链路

`Opportunity raw_input → AI orchestration → Structured Output → schema validation → persistence → UI render`

### 8.4 Discovery 生成链路

`Discovery notes / transcript → AI orchestration → Structured output → validation → persistence → UI render`

### 8.5 Proposal Draft 生成链路

`Lead Brief + Discovery Intelligence + Template + Rule Set → backend composition → generation → structured section payload → persistence → optional save-version → section editing`

### 8.6 Follow-up 生成链路

`Proposal Draft context + scenario + tone → AI orchestration → structured email fields → persistence → copy/export`

### 8.7 支付与试用链路

`Frontend upgrade CTA → Backend create checkout session → Stripe Checkout → webhook → subscription mapping persistence → billing_status update → Frontend reflect status`

## 9. AI 架构设计

### 9.1 AI Orchestration Layer

后端必须存在独立的 AI orchestration layer，而不是把模型调用散落在各业务模块中。

负责：

- 模型路由
- prompt/template assembling
- schema application
- input sanitization
- output validation
- retry policy
- cost logging
- error normalization

### 9.2 输出策略

推荐分两层输出：

- Layer A：Structured JSON
- Layer B：UI renderable content

不要把“给用户展示的文本”当作唯一真实数据源。

## 10. 认证与权限架构

### 10.1 认证分层

建议采用两层概念：

- Identity layer：谁登录了
- Application access layer：该用户能看什么、改什么

### 10.2 权限模型

MVP 阶段采用极简租户权限：

- Workspace Owner
- Member

并额外支持独立 internal role：

- `internal_admin`
- `internal_analyst`

### 10.3 Guard 分层

- `/api/v1/*`：workspace session + workspace role guard
- `/api/v1/admin/*`：admin session + internal role guard

internal role 不得通过 workspace membership 推导。

## 11. 文件处理架构

### 11.1 文件处理范围

MVP 阶段覆盖：

- PDF 上传
- 文本抽取
- 抽取结果回填或关联至 opportunity 输入

### 11.2 推荐链路

`Frontend upload → Backend receive metadata → File store save original PDF → Worker extract text → store extraction result + status → UI fetch result`

### 11.3 正式状态机

统一拆分为两套状态机：

- `file_assets.file_status`：`uploaded → processing → ready | failed`
- `file_processing_jobs.status`：`pending → processing → succeeded | failed`

> `complete` 是接口动作，不是持久化状态。

## 12. 计费架构

### 12.1 Stripe 角色定位

Stripe 负责：

- 订阅购买
- 计费周期管理
- 客户自助账单管理

系统自身负责：

- 内部 `trial_status / billing_status` 映射
- workspace 功能访问控制
- 付费状态展示

### 12.2 推荐内部状态

建议内部保留：

- `trial_status`
- `billing_status`
- `plan_type`
- `stripe_customer_id`
- `stripe_subscription_id`
- `current_period_end`

### 12.3 Webhook 策略

必须处理：

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

## 13. 数据与版本架构

### 13.1 数据分层建议

建议把数据分为四类：

- Core business entities
- Generated structured entities
- Rule entities
- System entities

### 13.2 版本策略

以下内容支持独立版本：

- Lead Brief
- Discovery Intelligence
- Proposal Draft
- Follow-up Draft

推荐策略：

- current resource 表示当前工作态
- PATCH 当前资源只更新当前工作态
- `save-version` 动作才创建新的历史版本
- `generate` 默认刷新当前工作态

## 14. 部署拓扑建议

### 14.1 推荐环境

至少区分：

- local
- staging
- production

### 14.2 推荐部署单元

- Web Frontend：独立部署
- Admin Frontend：独立部署对象或明确预留
- Backend API：独立部署
- Worker：独立进程或独立服务
- PostgreSQL：托管数据库
- Redis：托管 Redis
- Object Storage：托管对象存储

## 15. 可观测性与安全要求

### 15.1 日志

必须记录：

- `request_id`
- `user_id`
- `workspace_id`
- `opportunity_id`（如适用）
- `module_type`
- `model_name`（如适用）
- `billing_event_id`（如适用）

### 15.2 错误监控

必须能区分：

- 页面错误
- API 业务错误
- 外部集成错误（OpenAI / Stripe / OAuth / file storage）
- Worker 任务失败

### 15.3 安全要求

- Stripe webhook 签名校验
- OAuth state / redirect 安全处理
- workspace 数据隔离
- 上传文件大小与类型校验
- Secrets 与环境变量管理

## 16. 当前阶段应明确但不应过度设计的事项

### 当前应明确

- 模块边界
- 模型路由
- trial / billing 状态映射
- 文件处理链路
- route guards
- versioning
- web/admin 双会话分离

### 当前不应过度设计

- 多云部署
- 微服务拆分
- 多模型供应商热切换
- 复杂事件总线
- 高级权限矩阵
- 大规模向量检索系统

## 17. 与其他文档的关系

- 《共享平台边界说明》定义平台边界与共享/分离原则
- 《开发骨架与目录结构设计说明》把当前架构落成 monorepo 与模块目录
- 《数据库设计》把当前架构落成表结构、状态机和约束
- 《部署与环境搭建说明》把运行单元落成环境、镜像和发布基线

## 18. 已冻结决策

1. admin 前端在首版采用“最小可运行应用 + 独立边界预留”策略，不要求当前客户侧 MVP 验收阶段完整启用 admin 全量页面。
2. AI 模型路由首版只冻结分层策略，不冻结具体模型矩阵；具体模型名通过集中配置管理。
3. admin reporting 首版不引入缓存或预聚合，先基于在线聚合查询实现。

## 19. 结论

ProposalFlow AI 当前阶段最合适的技术路线，不是复杂的企业级分布式架构，而是以模块化单体为核心、以前后端分离为交付方式、以 PostgreSQL 为主数据源、以 OpenAI 和 Stripe 为关键外部能力的开发启动级系统架构。

其核心是：一个共享平台底座、两个独立产品面（web/admin）、一套统一的数据与权限边界，并在此基础上保证交付速度、业务清晰度与系统可控性。
