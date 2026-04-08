# ProposalFlow AI｜共享平台边界说明 v1.0

## 1. 文档目的

本文档用于明确 ProposalFlow AI 平台内三类对象之间的边界关系：

- 客户侧产品
- 运营管理端
- 共享平台底座

本文档不定义具体页面交互，而是定义能力归属、共享与分离原则，以及未来扩展时哪些能力必须共用、哪些能力必须隔离。

## 2. 适用范围

适用于客户侧产品与运营管理端并行规划、工程骨架设计、权限与 API 分层确认。

## 3. 边界总论

### 3.1 三层结构结论

ProposalFlow AI 平台应按以下三层理解：

| 层级 | 对象 | 目标 |
| --- | --- | --- |
| Layer A | 客户侧产品（External Product） | 面向 workspace 用户，完成售前工作流 |
| Layer B | 运营管理端（Internal Admin / Growth Console） | 面向平台内部人员，查看平台数据、主流程转化和订阅状态 |
| Layer C | 共享平台底座（Shared Platform） | 为客户侧与运营端提供共用能力，不直接等于某个前端产品面 |

### 3.2 核心原则

- 客户侧产品与运营管理端必须分开设计、分开入口、分开文档
- 客户侧产品与运营管理端共享核心平台能力
- 共享平台底座不应被写成某一侧产品的专属能力

## 4. 客户侧产品边界

### 4.1 正式职责

客户侧产品负责：

- 用户注册 / 登录
- Workspace setup
- Opportunity 创建与推进
- Lead Brief
- Discovery Intelligence
- Proposal Draft
- Follow-up
- Templates & Rules
- Billing / Trial 展示与升级入口

### 4.2 明确不做

客户侧产品明确不做：

- 平台级用户总览
- 跨 workspace 分析
- 平台级漏斗统计
- 平台级订阅总览
- 内部业务运营分析

### 4.3 边界原则

客户侧产品始终围绕单个 workspace 与单个 opportunity 上下文展开。

## 5. 运营管理端边界

### 5.1 正式职责

运营管理端负责：

- 查看平台级用户数据
- 查看 workspace 数据
- 查看 trial / billing / subscription 数据
- 查看主流程漏斗
- 查看平台级关键行为数据

### 5.2 明确不做

运营管理端明确不做：

- 代替客户侧产品完成 Opportunity 工作流
- 代替运维系统监控服务状态
- 代替数据库管理工具或日志平台
- 成为复杂 BI 平台

### 5.3 边界原则

运营管理端以平台内部查询和分析为主，首版以只读能力为主，不承接复杂手工操作。

## 6. 共享平台底座边界

### 6.1 正式职责

共享平台底座承载以下共用能力：

- 身份认证基础设施
- 用户与 workspace 基础模型
- 订阅与 trial 状态模型
- Opportunity 及相关生成物的数据模型
- 统一事件体系与 `activity_logs`
- 统一 API 服务入口、路由分层与会话体系
- 统一部署、数据库、Redis、对象存储

> 这里采用“统一 API 服务入口”而不是“统一 API 网关”的表述，避免误解为必须额外建设独立网关产品。

### 6.2 不等于某一侧页面

共享平台底座是能力层，不是页面层。它既不应写成客户侧页面，也不应写成运营端页面。

## 7. 共享与分离清单

### 7.1 必须共享的内容

以下内容应共享：

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
- 认证基础设施
- 部署基线
- Docker 镜像与运行平台
- PostgreSQL / Redis / Object Storage

### 7.2 必须分离的内容

以下内容必须分离：

- 前端入口
- 主导航
- 页面 layout
- 权限角色语义
- API 命名空间
- 产品文档体系
- 会话类型与 guard 行为

## 8. 身份与权限边界

### 8.1 客户侧角色

客户侧租户角色：

- `owner`
- `member`

### 8.2 平台内部角色

平台内部角色：

- `internal_admin`
- `internal_analyst`

### 8.3 权限边界原则

- internal role 不属于 `workspace_members` 体系
- internal role 不得通过伪装客户角色来访问平台数据
- 客户侧 guard 与 admin guard 必须分开

## 9. API 边界

### 9.1 客户侧 API

客户侧 API 以资源型、事务型、工作流型为主，例如：

- `/api/v1/opportunities/*`
- `/api/v1/lead-brief/*`
- `/api/v1/discovery/*`
- `/api/v1/proposal-draft/*`
- `/api/v1/follow-up/*`

### 9.2 运营端 API

运营端 API 以聚合型、统计型、查询型为主，例如：

- `/api/v1/admin/overview`
- `/api/v1/admin/workspaces`
- `/api/v1/admin/users`
- `/api/v1/admin/subscriptions`
- `/api/v1/admin/funnels`

### 9.3 边界原则

- 不应把 admin 查询接口强行写进客户侧资源接口
- 不应把客户侧事务接口复用成平台级分析接口

## 10. 数据与事件边界

### 10.1 共享数据原则

客户侧产品与运营管理端共享同一套核心数据模型。

### 10.2 共享事件原则

平台关键事件应作为共享事件体系定义，不属于某单一产品面专属。

### 10.3 首版分析基线

当前阶段建议以 `activity_logs + 核心业务表聚合查询` 作为首版分析基线。

## 11. 前端边界

### 11.1 推荐形态

推荐前端采用两个产品面：

- 客户侧前端应用
- 运营端前端应用

### 11.2 当前阶段原则

当前阶段即使不实现正式运营端页面，也应在工程骨架上预留 `admin app` 或等价边界。

## 12. 部署边界

### 12.1 共享部分

客户侧产品与运营管理端应共享：

- 核心后端平台
- 核心数据库
- Redis
- 对象存储
- 部署基线

### 12.2 分离部分

建议分离：

- 域名 / 子域名入口
- 前端应用部署对象
- 访问控制与鉴权入口
- web / admin 会话语义

## 13. 文档边界

### 13.1 客户侧产品文档

只定义客户侧产品需求与实现边界。

### 13.2 运营端文档

独立定义其目标、范围、页面、数据视图与权限。

### 13.3 共享平台文档

用于定义：

- 平台底座能力
- 权限边界
- 共享事件
- admin API 预留
- 部署共享基线

## 14. 当前阶段执行口径

当前阶段的正式执行口径如下：

- 继续优先推进客户侧 MVP
- 不开发完整运营端页面
- 但在文档、架构、权限、API、数据和部署层预留运营端扩展位

### 14.1 认证与权限闭环

首版正式采用：

`users 共表 + internal_role_assignments 独立建模 + web/admin 双会话分离`

#### 用户模型

- 所有自然人统一存放于 `users`
- 第三方或密码身份统一存放于 `user_auth_identities`
- workspace 权限继续由 `workspace_members` 承载，仅表示 owner/member 等租户角色
- internal 权限不进入 `workspace_members`

#### 内部角色模型

- 运营端内部角色采用独立 `internal_role_assignments`
- 首版支持 `internal_admin`、`internal_analyst`
- internal role 默认 global 作用域；更细粒度限制后续扩展

#### 会话与 Cookie 策略

- web 与 admin 共享同一 users / auth identities 主体身份模型
- 浏览器态会话必须区分 `session_type = web | admin`
- 建议 Cookie 分离为 `pf_web_session` 与 `pf_admin_session`

#### 域名与跨域策略

正式环境建议采用：

- `app.<domain>`
- `admin.<domain>`
- `api.<domain>`

浏览器仅允许来自受信 Origin 的前端通过 credentials 访问 `api.<domain>`。

#### CSRF 与鉴权要求

- 所有浏览器态写接口必须启用 CSRF 防护
- `/api/v1/*` 使用 workspace session + workspace role guard
- `/api/v1/admin/*` 使用 admin session + internal role guard

### 14.2 共享事件与分析边界补充

- `activity_logs` 为共享平台基础模块，不归属于单一产品面
- 指标、漏斗、timeline 统一以共享事件字典为准
- 主漏斗正式从 `workspace_created` 开始；`signup_completed` 仅作为 user-level 指标或独立 user funnel 处理

## 15. 与其他文档的关系

- 本文档负责界定“客户侧 / 运营端 / 平台底座”三者的能力边界
- 《系统架构与技术方案》负责把这些边界落成运行单元、模块与链路
- 《开发骨架与目录结构设计说明》负责把边界落成 monorepo、apps、packages、路由和模块目录
- 《部署与环境搭建说明》负责把共享与分离原则落成部署对象与环境隔离
- 《数据库设计》负责把共享模型、事件、会话、角色和状态机落成表结构与约束

## 16. 已冻结决策

1. `internal_analyst` 首版不扩展为字段级或对象级限制，按 global internal role 落地。
2. admin 端正式入口采用独立子域名方案：`app.<domain>`、`admin.<domain>`、`api.<domain>`。
3. admin 端首版不单独建设只读聚合服务，继续由共享后端平台承接，并在共享后端内保持独立 `admin_reporting` 模块。

## 17. 结论

ProposalFlow AI 的长期结构应是“两个产品面 + 一套共享平台”。

最合理的边界是：产品面分离、平台底座共享、文档体系分离、权限与 API 分层清晰，从而在不打乱当前 MVP 推进的前提下，为未来运营端建设留下低返工、可扩展的路径。
