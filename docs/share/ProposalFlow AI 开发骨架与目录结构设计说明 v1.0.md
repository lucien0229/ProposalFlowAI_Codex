# ProposalFlow AI｜开发骨架与目录结构设计说明 v1.0

## 1. 文档目的

本文档用于把已经确认的产品、架构、数据库、部署与权限设计，翻译成可执行的工程骨架方案，重点回答以下问题：

- 仓库应该如何组织
- 是否拆成两个前端应用
- product API 与 admin API 如何在代码层分离
- 共享能力、共享常量和共享 schema 放在哪里
- migrations、scripts、infra、tests 应如何组织
- 当前阶段哪些模块必须落地，哪些只需预留扩展位

本文档不重复解释系统为什么这样设计，而是给出开发启动阶段可直接执行的目录与分层基线。

## 2. 适用范围

适用于以下工作：

- 开发启动前的仓库初始化
- monorepo 结构设计与目录划分
- web / admin / api / worker 应用边界定义
- 后端模块拆分、路由命名空间和权限边界建立
- infra、scripts、migrations、tests 的基础骨架落地

## 3. 工程骨架正式结论

### 3.1 仓库形态结论

ProposalFlow AI 推荐采用 **单仓 monorepo**。

原因如下：

- 客户侧产品、运营管理端与共享平台底座属于同一平台
- 共用大量类型、schema、事件定义、鉴权逻辑与部署基线
- 单仓更适合当前阶段 0→1 开发与快速迭代
- 可避免过早引入多仓同步、版本漂移与跨仓发布复杂度

### 3.2 前端形态结论

正式采用两个前端应用：

- `apps/web`：客户侧产品
- `apps/admin`：运营管理端

即使首版不开发完整 admin 页面，也必须在工程结构中预留 `apps/admin`，而不是把 admin 能力塞进 `apps/web`。

> 当前仍有一个影响 P0 范围的开放决策：`apps/admin` 在首版究竟是“结构占位应用”、“最小可运行应用”，还是“实际部署但仅内部可见的最小控制台”。骨架必须先预留边界，但最终交付深度仍需单独拍板。

### 3.3 后端形态结论

正式采用一套共享后端平台，并在代码层明确区分：

- product API 层
- admin API 层
- shared platform services 层

### 3.4 数据层结论

继续使用一套核心数据库，不单独拆 product DB 与 admin DB。admin 首版查询基线为：

- `activity_logs`
- 核心业务表聚合查询

## 4. 目录结构总览

### 4.1 顶层目录建议

推荐仓库顶层采用如下结构：

- `apps/`
- `packages/`
- `infra/`
- `scripts/`
- `docs/`
- `tests/`
- `.github/`（或等价 CI 目录）

### 4.2 推荐落地结构

当前阶段更推荐以下明确形态：

- `apps/web`
- `apps/admin`
- `apps/api`
- `apps/worker`
- `packages/shared-types`
- `packages/shared-schemas`
- `packages/shared-config`
- `packages/ui`（可选）
- `infra`
- `scripts`
- `docs`
- `tests`

### 4.3 推荐目录树（示意）

```text
proposalflow/
├── apps/
│   ├── web/
│   ├── admin/
│   ├── api/
│   └── worker/
├── packages/
│   ├── shared-types/
│   ├── shared-schemas/
│   ├── shared-config/
│   └── ui/                # 可选，若 web/admin 共享组件较多
├── infra/
│   ├── docker/
│   ├── compose/
│   ├── deploy/
│   └── nginx/             # 可选
├── scripts/
│   ├── dev/
│   ├── db/
│   └── release/
├── docs/
├── tests/
│   ├── e2e/
│   ├── integration/
│   └── fixtures/
├── .github/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json             # 可选
└── README.md
```

## 5. 前端骨架设计

### 5.1 `apps/web` 定位

`apps/web` 仅承载客户侧产品。

正式职责包括：

- auth
- workspace setup
- dashboard
- opportunities
- lead brief
- discovery
- proposal draft
- follow-up
- templates & rules
- billing
- settings

不应放入：

- admin 运营管理端页面
- internal admin 导航
- 平台级统计看板

### 5.2 `apps/admin` 定位

`apps/admin` 仅承载运营管理端。

正式职责包括：

- internal auth entry
- overview
- workspaces
- users
- subscriptions / trials
- funnel analytics

正式原则：

- 当前阶段即使不实现 admin 全量页面，也要预留 app 目录与基础工程位
- `apps/admin` 不应复用 `apps/web` 的路由树
- admin 会话与权限语义必须与 web 分离

### 5.3 前端共享包建议

建议将共享能力抽入 `packages`：

#### `packages/shared-types`

承载：

- 基础枚举
- 角色常量
- 状态类型
- API response envelope types
- 共享 DTO 类型

#### `packages/shared-schemas`

承载：

- activity event schema
- filters schema
- shared validation schema
- metrics window schema
- AI 结构化 payload 对应 schema

#### `packages/shared-config`

承载：

- 环境名常量
- API base path 常量
- 事件名常量
- 默认分页参数
- 时间窗口常量
- 路由与过滤协议常量

#### `packages/ui`（可选）

仅在 web/admin 之间确有复用组件需求时建立。当前阶段不建议为未来假设场景过度抽象。

### 5.4 前端路由原则

#### `apps/web` 路由建议

- `/dashboard`
- `/opportunities`
- `/opportunities/:opportunityId/overview`
- `/opportunities/:opportunityId/lead-brief`
- `/opportunities/:opportunityId/discovery`
- `/opportunities/:opportunityId/proposal-draft`
- `/opportunities/:opportunityId/follow-up`
- `/templates-rules`
- `/billing`
- `/settings`

#### `apps/admin` 路由建议

- `/admin/auth`
- `/admin/overview`
- `/admin/workspaces`
- `/admin/workspaces/:workspaceId`
- `/admin/users`
- `/admin/users/:userId`（预留）
- `/admin/subscriptions`
- `/admin/funnels`

### 5.5 前端状态边界

web 与 admin 的全局状态不应混用，至少应明确分开：

- 客户侧 session / workspace context
- admin session / internal role context
- web filters / admin filters

## 6. 后端骨架设计

### 6.1 `apps/api` 定位

`apps/api` 作为统一后端应用，负责：

- product API
- admin API
- auth / session
- billing integration
- file handling
- AI orchestration
- shared domain services

### 6.2 `apps/worker` 定位

`apps/worker` 负责异步任务与后台处理。

正式职责包括：

- PDF 抽取
- 文件处理后续任务
- Stripe webhook 重试 / 补偿类任务（如需要）
- 导出与其他耗时任务

### 6.3 `apps/api` 推荐目录结构

```text
apps/api/
├── app/
│   ├── api/
│   │   ├── product/
│   │   └── admin/
│   ├── core/
│   ├── modules/
│   │   ├── auth/
│   │   ├── workspace/
│   │   ├── opportunity/
│   │   ├── lead_brief/
│   │   ├── discovery/
│   │   ├── proposal_draft/
│   │   ├── follow_up/
│   │   ├── templates_rules/
│   │   ├── billing/
│   │   ├── file_processing/
│   │   ├── ai_orchestration/
│   │   ├── activity_logging/
│   │   └── admin_reporting/
│   ├── db/
│   ├── schemas/
│   ├── services/
│   └── main.py
├── alembic/
├── tests/
└── pyproject.toml
```

### 6.4 product API 与 admin API 分层

路由层必须显式分开：

- `app/api/product/` 对应 `/api/v1/*`
- `app/api/admin/` 对应 `/api/v1/admin/*`

正式原则：

- 不把 admin 查询路由放进 product router
- 不把客户侧事务型接口复用成 admin 聚合接口
- admin 查询与 product workflow 在代码层保持清晰边界

### 6.5 模块职责建议

#### `auth/`

负责用户登录、注册、OAuth、session 与 internal auth 基础判断。

#### `workspace/`

负责 `workspaces`、`workspace_members`、workspace settings 与 workspace context。

#### `opportunity/`

负责 `opportunities`、`opportunity_inputs` 与主流程状态摘要。

#### `lead_brief/`

负责 current lead brief、版本、generate 与 save-version。

#### `discovery/`

负责 `discovery_records`、`discovery_intelligence`、版本与 generate。

#### `proposal_draft/`

负责 current proposal draft、section regeneration、版本与 export。

#### `follow_up/`

负责 current follow-up、generate 与版本。

#### `templates_rules/`

负责 `template_definitions`、`workspace_rule_sets`、`opportunity_rule_overrides` 与 effective rules 计算。

#### `billing/`

负责 trial state、subscription state、checkout、portal 与 webhooks。

#### `file_processing/`

负责 `file_assets`、upload-url、complete 与 processing status。

#### `ai_orchestration/`

负责模型调用、structured outputs、retry 与 AI 审计记录。

#### `activity_logging/`

负责事件写入、基础查询与共享事件字典落地。

#### `admin_reporting/`

负责 overview aggregates、workspace list/detail aggregates、subscription aggregates 与 funnel aggregates。

### 6.6 `admin_reporting` 模块原则

该模块必须独立存在，而不是散落在普通 workflow 模块中。

原因如下：

- 运营端接口主要是聚合型、统计型、查询型
- 与客户侧 opportunity 工作流事务逻辑不同
- 后续如需优化查询、缓存或预聚合，更容易单独演进

## 7. 权限与会话骨架

### 7.1 角色分层原则

工程骨架必须明确区分两类角色：

- workspace 角色
- internal 角色

workspace 角色首版为：

- `owner`
- `member`

internal 角色首版为：

- `internal_admin`
- `internal_analyst`

### 7.2 权限代码位置建议

建议建立清晰的权限目录，例如：

- `app/core/auth/`
- `app/core/permissions/`

并显式区分：

- `require_workspace_role(...)`
- `require_internal_role(...)`

正式要求：

- workspace role 与 internal role 不得共用同一 guard helper
- admin 会话判断不得复用客户侧 `auth/me` 语义
- 会话与权限分离必须在骨架层显式体现，不能只在业务代码中隐式处理

### 7.3 会话边界

工程骨架必须支持 web/admin 双会话分离：

- web 与 admin 共用 `users` 主体身份模型
- 但浏览器态会话必须显式区分 `session_type = web | admin`
- 对应路由、中间件、Cookie 语义和 guard 都应在代码结构上清晰可见

## 8. 共享事件与过滤协议骨架

### 8.1 `activity_logs` 的工程角色

`activity_logs` 在工程骨架中应视为共享平台基础模块，而不是某个单一页面的附属产物。

正式职责包括：

- 主流程关键事件记录
- 行为审计基础
- future admin read model 的事件来源
- 核心漏斗与指标计算输入之一

### 8.2 事件常量收口

事件名不得散落在前后端各处硬编码。工程骨架中必须有统一收口点，建议放在 `shared-config` 或 `shared-schemas`。

首版最小事件集包括：

- `signup_completed`
- `workspace_created`
- `opportunity_created`
- `lead_brief_generated`
- `lead_brief_saved`
- `discovery_added`
- `discovery_intelligence_generated`
- `proposal_draft_generated`
- `proposal_draft_saved`
- `followup_generated`
- `export_clicked`
- `copy_clicked`
- `upgrade_clicked`
- `subscription_activated`

### 8.3 过滤协议常量收口

为避免 product/admin 查询参数漂移，应在 `shared-config` 或 `shared-schemas` 中统一定义列表过滤字段命名，例如：

- `q`
- `trial_status`
- `billing_status`
- `plan_type`
- `auth_method`
- `created_from`
- `created_to`
- `sort_by`
- `sort_direction`
- `cursor`
- `limit`

## 9. 数据库迁移与数据层骨架

### 9.1 单库结论

继续使用单一核心数据库，不拆分 product DB 与 admin DB。

### 9.2 迁移目录建议

在 `apps/api` 内保留统一迁移目录，例如：

- `alembic/`
- `alembic/versions/`

正式要求：

- 所有 schema 变更必须通过迁移完成
- 不允许手工 SQL 替代正式迁移基线

### 9.3 数据层分层建议

建议区分以下层：

- ORM models / SQL models
- repositories / query layer
- domain services
- reporting query layer

其中 admin reporting 相关查询不应直接散落在普通 repository 中。

## 10. 测试骨架

### 10.1 顶层测试结构建议

推荐保留：

- `tests/integration/`
- `tests/e2e/`
- `tests/fixtures/`

`apps/api` 内也可保留服务端单测目录。

### 10.2 测试分层建议

#### 客户侧测试

- auth
- workspace setup
- opportunity workflow
- rules application
- billing / trial

#### 运营侧测试

- admin auth guard
- admin list queries
- metrics queries
- funnel aggregates

#### 共享平台测试

- `activity_logs` 写入
- event schema
- internal role / workspace role guard
- db migrations

## 11. 基础设施与脚本骨架

### 11.1 `infra/` 目录职责

`infra/` 用于承载：

- Dockerfile
- docker-compose
- 本地反向代理配置（如需）
- 部署脚本或基础配置模板

推荐结构：

```text
infra/
├── docker/
│   ├── web.Dockerfile
│   ├── admin.Dockerfile
│   ├── api.Dockerfile
│   └── worker.Dockerfile
├── compose/
│   └── docker-compose.local.yml
├── deploy/
│   ├── staging/
│   └── production/
└── nginx/
```

### 11.2 `scripts/` 目录职责

`scripts/` 建议承载：

- 启动本地依赖
- 数据库迁移
- 初始化测试数据
- 发布前检查脚本
- 本地回归脚本

## 12. 环境变量与配置骨架

### 12.1 配置分层建议

至少区分以下环境：

- `local`
- `staging`
- `production`

### 12.2 应用级配置拆分建议

可采用如下形态：

- `apps/web/.env.local`
- `apps/admin/.env.local`
- `apps/api/.env.local`
- `apps/worker/.env.local`

也可由统一配置注入方案承接，但必须满足以下原则：

- 秘钥不进入仓库
- 前端公开变量与后端私有变量严格分离
- admin app 与 web app 的公开变量分开配置

## 13. 当前阶段必须落地的骨架项

### 13.1 P0 必落地

- monorepo 基线
- `apps/web`
- `apps/admin`（可为最小占位应用）
- `apps/api`
- `apps/worker`
- `packages/shared-types`
- `packages/shared-config`
- `packages/shared-schemas` 的基础承载位
- product API 与 admin API 路由边界
- internal role 与 workspace role 权限边界
- `activity_logs` 事件基础结构
- migrations 目录
- `infra/docker` 与 local compose 基线

### 13.2 P1 可后置增强

- `packages/ui`
- 更完整的 shared-schemas 抽象
- admin metrics 预聚合层
- 更细的测试基座
- 更复杂的 infra/deploy 自动化
- restore-to-current 等版本恢复链路的完整实现

## 14. 当前阶段不建议的过度设计

当前不建议：

- 拆成多个独立仓库
- 过早拆成大量微服务
- 先建设复杂数据仓库
- 先建设完整 BI 平台
- 把 admin 侧提前实现成大而全后台
- 为未来扩展而过度抽象每一层

## 15. 推荐实施顺序

建议按以下顺序落地工程骨架：

1. 初始化 monorepo
2. 建立 `apps/web`、`apps/admin`、`apps/api`、`apps/worker`
3. 建立 `shared-types`、`shared-config`、`shared-schemas` 基础位
4. 建立 product/admin API 路由边界与权限边界
5. 落地 migrations、`activity_logs`、基础 infra
6. 开始客户侧 P0 主链路实现
7. 保留 admin 查询模块位，不急于全量实现 admin 页面

## 16. 验收标准

当以下条件满足时，可认为开发骨架已达标：

- 仓库结构清晰，`web/admin/api/worker` 边界明确
- product API 与 admin API 已分 namespace
- internal role 与 workspace role 已分离
- shared packages 已建立基础常量、schema 与类型承载位
- infra 与 scripts 已具备本地开发与迁移运行能力
- 客户侧主链路可以在不推翻目录结构的前提下持续扩展
- future admin 可以在不重构主仓库结构的前提下接入

## 17. 与其他文档的关系

- 《共享平台边界说明》定义两个产品面与共享平台底座的分离 / 共享原则
- 《系统架构与技术方案》定义运行单元、模块边界与核心链路
- 《部署与环境搭建说明》定义 `web/admin/api/worker` 的部署对象与环境策略
- 《数据库设计》定义本骨架所依赖的持久化模型、会话与权限数据结构
- web / admin 侧 PRD、API 和页面文档将在此工程骨架上继续实现

## 18. 已冻结决策

1. `apps/admin` 首版采用最小可运行应用，而不是仅保留纯占位目录。
2. `packages/ui` 不作为 P0 必建项，等 web/admin 出现稳定复用组件后再抽离。
3. 不额外建立通用 restore 骨架占位；只为当前已冻结的具体资源实现 restore 路由 / service / handler。
4. monorepo 工具链首版采用更轻量的最小工作区方案，以 `pnpm workspace` 为基线，`turbo` 可选，`nx` 不作为当前基线要求。

## 19. 结论

ProposalFlow AI 当前阶段最合理的工程骨架，不是“大而全”的平台化抽象，而是：

- 一个 monorepo
- 两个前端应用（`web` / `admin`）
- 一套共享后端平台（`api` / `worker`）
- 一组明确的共享包（types / schemas / config）
- 一套清晰的权限、事件、迁移、脚本与基础设施骨架

一句话总结：ProposalFlow AI 的开发骨架应以“一个平台、两个产品面、一套后端、统一底座、清晰边界”为原则，把现有产品与技术设计稳定地翻译成可执行、可协作、可扩展的工程结构。
