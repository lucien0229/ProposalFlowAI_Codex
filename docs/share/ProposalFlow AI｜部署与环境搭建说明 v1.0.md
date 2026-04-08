# ProposalFlow AI｜部署与环境搭建说明 v1.0

## 1. 文档目的

本文档用于明确 ProposalFlow AI 在本地开发、联调测试、预发验证和正式生产阶段的部署基线、环境分层、运行单元、配置策略和发布要求。

## 2. 结论摘要

1. 推荐使用 Docker 作为标准化环境封装与发布产物的核心手段。
2. 本地开发推荐采用“依赖服务容器化 + 应用本机运行”的方式。
3. staging / production 建议采用容器镜像部署，并与生产保持尽量同构。
4. 正式生产不建议将单机 `docker-compose` 作为长期基线，更适合采用托管容器平台 + 托管数据库 / Redis / 对象存储。
5. 正式部署对象应统一到：`web / admin / api / worker`，而不是混用 `frontend / backend` 命名。

## 3. 部署目标与原则

### 3.1 部署目标

确保 ProposalFlow AI 在以下场景中具备可重复、可验证、可回滚的运行能力：

- 本地开发与单机联调
- 团队共享测试 / 预发验证
- 正式生产发布与运维

### 3.2 部署原则

- 环境同构：测试环境尽量接近生产环境
- 配置外置：代码与配置分离
- 镜像一致：同一版本的 web/admin/api/worker 使用固定镜像标签
- 发布可回滚：任一版本上线后可快速回退
- 数据安全：数据库、对象存储和第三方密钥隔离管理
- 最小人工步骤：构建、迁移、部署、验证尽量标准化

## 4. 系统部署对象

### 4.1 运行单元

根据当前架构，部署对象包括：

- Web Frontend（`web` / `apps/web`）：客户侧产品前端
- Admin Frontend（`admin` / `apps/admin`）：运营管理端前端
- Backend API（`api` / `apps/api`）：业务后端
- Worker（`worker` / `apps/worker`）：异步任务单元
- PostgreSQL：主业务数据库
- Redis：缓存、任务队列与幂等协调
- Object Storage：上传文件、解析中间结果、导出文件
- External Services：OpenAI、Stripe、OAuth Provider

### 4.2 核心边界

- Frontend 不直接访问数据库
- Frontend 仅通过 Backend API 访问业务数据
- Worker 不直接暴露公网
- OpenAI / Stripe / OAuth 凭据仅在服务端可见
- Billing 状态以系统内部状态为准，并通过 Webhook 同步回写

## 5. 环境分层

### 5.1 推荐环境分层

至少划分：

- `local`
- `staging`
- `production`

### 5.2 各环境职责

#### local

- 面向开发者个人
- 用于页面开发、接口联调、数据库迁移调试、任务链路验证
- 可使用简化域名与少量测试数据

#### staging

- 面向团队联调、测试、验收、发布前回归
- 使用独立数据库、独立 Redis、独立对象存储 Bucket
- Stripe 使用 Test Mode
- OpenAI 使用独立非生产 Key，并建议配置预算上限

#### production

- 面向真实用户
- 必须使用独立生产级数据库、Redis、对象存储、域名、TLS、Secrets 管理
- 需要备份、监控、告警、日志留存与回滚机制

## 6. Docker 结论

### 6.1 推荐结论

可以使用 Docker，且推荐使用。

### 6.2 推荐使用方式

#### 本地环境

- 强烈建议使用 Docker Compose 启动依赖服务
- web / admin / api / worker 可视团队习惯选择本机运行或容器运行

#### staging 环境

- 推荐所有服务统一使用容器镜像部署
- 保证与 production 的运行方式尽量一致

#### production 环境

- 推荐使用 Docker 镜像作为标准发布产物
- 推荐运行在托管容器平台或编排平台上
- 不建议把单机 `docker-compose` 作为正式长期生产方案

## 7. 推荐部署拓扑

### 7.1 本地开发环境

推荐拓扑：

- Web Frontend：本机启动
- Admin Frontend：本机启动或最小占位预留
- Backend API：本机启动
- Worker：本机启动
- PostgreSQL：Docker Compose
- Redis：Docker Compose
- Object Storage：Docker Compose（如 MinIO）或测试桶

### 7.2 staging 环境

推荐拓扑：

- Web Frontend：容器部署
- Admin Frontend：容器部署或预留独立部署对象
- Backend API：容器部署
- Worker：容器部署
- PostgreSQL：托管数据库
- Redis：托管 Redis
- Object Storage：云对象存储

### 7.3 production 环境

推荐拓扑：

- Web Frontend：独立 Web 容器 / 托管前端平台
- Admin Frontend：独立 Web 容器 / 托管前端平台
- Backend API：独立 API 容器
- Worker：独立后台任务容器
- PostgreSQL：托管数据库
- Redis：托管 Redis
- Object Storage：托管对象存储
- 统一网关：反向代理 / Load Balancer / CDN

## 8. 仓库与服务划分建议

### 8.1 服务划分建议

推荐运行单元命名统一为：

- `apps/web`
- `apps/admin`
- `apps/api`
- `apps/worker`

不再使用 `apps/frontend` / `apps/backend` 的命名，以避免与工程骨架、系统架构文档产生两套口径。

### 8.2 Docker 构建建议

推荐分别构建镜像：

- `proposalflow-web`
- `proposalflow-admin`
- `proposalflow-api`
- `proposalflow-worker`

## 9. 配置管理与环境变量

### 9.1 基本原则

- 所有环境变量均通过环境配置注入，不写死在代码中
- local 可使用本地 `.env.*` 文件
- staging / production 必须使用 Secrets 管理方式
- 前端仅暴露必要公开变量

### 9.2 推荐变量分类

#### Web / Admin 前端公开变量

- `NEXT_PUBLIC_APP_ENV`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

> web 与 admin 的公开变量应分开配置，不共用一套前端公开环境。

#### Backend 私有变量

- `APP_ENV`
- `APP_SECRET_KEY`
- `DATABASE_URL`
- `REDIS_URL`
- `OBJECT_STORAGE_*`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `OAUTH_GOOGLE_CLIENT_ID`
- `OAUTH_GOOGLE_CLIENT_SECRET`
- `SESSION_COOKIE_DOMAIN`
- `SESSION_COOKIE_SECURE`
- `CORS_ALLOWED_ORIGINS`

#### Worker 私有变量

- `APP_ENV`
- `DATABASE_URL`
- `REDIS_URL`
- `OBJECT_STORAGE_*`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`（如任务需要）

### 9.3 环境隔离要求

- local / staging / production 的数据库、Redis、对象存储 Bucket 不得混用
- Stripe 必须区分 Test 与 Live
- OpenAI 建议至少区分非生产与生产 Key
- OAuth 回调地址按环境单独配置

## 10. 本地环境搭建

### 10.1 推荐方式

推荐采用“依赖服务容器化 + 应用本机运行”。

### 10.2 本地前置依赖

建议安装：

- Git
- Node.js
- Python
- Docker Desktop 或等价 Docker Runtime
- Docker Compose
- Stripe CLI（建议）

### 10.3 本地依赖服务启动

推荐使用 Docker Compose 启动：

- PostgreSQL
- Redis
- MinIO（如需本地对象存储）

### 10.4 本地应用启动顺序

1. 启动 PostgreSQL / Redis / MinIO
2. 配置本地环境变量
3. 执行数据库迁移
4. 启动 API
5. 启动 Worker
6. 启动 Web Frontend
7. 启动 Admin Frontend（若当前阶段需要）
8. 验证主链路

### 10.5 本地健康检查

建议至少验证：

- Frontend 页面可访问
- Backend `/health` 可返回成功
- Backend `/ready` 能验证数据库和 Redis
- Worker 能消费队列
- PDF 上传后能形成正确状态链路

## 11. staging / 测试环境搭建

### 11.1 目标

用于：

- 前后端联调
- 功能测试与回归测试
- 数据库迁移验证
- 发布前验收
- Stripe Test Webhook 验证
- OpenAI 非生产额度与调用验证

### 11.2 部署要求

staging 应满足：

- 使用与 production 相同的 Dockerfile 和构建流程
- 使用独立域名
- 使用独立数据库与 Redis
- 使用独立对象存储 Bucket
- 使用独立 secrets
- 使用 Stripe Test Mode

## 12. production 环境部署建议

### 12.1 推荐正式生产基线

正式生产推荐采用：

- 容器镜像构建
- 托管容器运行平台
- 托管 PostgreSQL
- 托管 Redis
- 托管对象存储
- HTTPS + 反向代理 / 负载均衡
- Secret Manager
- 集中日志与告警

### 12.2 不建议的生产方案

不建议：

- 单机 `docker-compose` + 本地磁盘对象存储
- 手工 SSH 登录服务器执行发布脚本
- 应用与数据库同机且无资源隔离
- 无自动备份与无监控告警

### 12.3 生产部署顺序

推荐顺序：

1. 发布前检查镜像与版本号
2. 备份数据库或确认 PITR 正常
3. 执行数据库迁移
4. 部署 API
5. 部署 Worker
6. 部署 Web Frontend
7. 部署 Admin Frontend（如已启用）
8. 执行 smoke tests
9. 检查 Billing、Webhook、对象存储、AI 调用链路

## 13. Docker 镜像与构建建议

### 13.1 镜像原则

- web/admin/api/worker 分别构建独立镜像
- 镜像使用固定版本标签
- 同时保留 commit SHA 与语义版本标签
- 不在镜像中保存明文 secrets

### 13.2 Dockerfile 原则

- 使用精简基础镜像
- 安装系统依赖最小化
- 运行用户尽量非 root
- Frontend 构建与运行阶段分离
- Worker 与 API 可复用基础依赖层，但运行命令独立

## 14. 数据库、Redis 与对象存储部署要求

### 14.1 数据库要求

- local / staging / production 使用同一套迁移体系
- 迁移必须版本化管理
- 生产环境启用自动备份与 PITR 或等价恢复能力

### 14.2 Redis 要求

Redis 用于：

- 缓存
- 任务队列
- 幂等键
- 短期状态协调

### 14.3 对象存储要求

对象存储用于：

- 原始 PDF 上传文件
- 解析中间产物
- 后续导出文件

环境要求：

- local 可使用 MinIO
- staging / production 使用云对象存储
- Bucket 按环境隔离

## 15. 域名、HTTPS 与安全要求

### 15.1 域名建议

建议至少区分：

- `app.<domain>`
- `admin.<domain>`
- `api.<domain>`

### 15.2 HTTPS 要求

- staging 与 production 建议启用 HTTPS
- 生产环境必须使用 Secure Cookie
- OAuth 回调地址必须与实际域名一致

### 15.3 CORS / CSRF 要求

- API 仅允许显式受信 Origin 携带 credentials 访问
- 浏览器态写接口必须启用 CSRF 防护
- 不得在 production 使用通配 Origin 与 credentials 混用

## 16. CI/CD 流程建议

建议至少包含以下阶段：

1. Lint / Format Check
2. Unit Tests
3. Build web/admin/api/worker
4. Build Docker Images
5. Push Images
6. Run Database Migration
7. Deploy to Target Environment
8. Smoke Tests
9. Post-deploy Verification

## 17. 监控、日志与告警

### 必须监控的对象

- Frontend 可用性
- Backend API 错误率与响应时间
- Worker 任务成功率 / 失败率 / 堆积情况
- PostgreSQL 可用性、连接数、慢查询
- Redis 可用性与内存使用
- Object Storage 错误率
- Stripe Webhook 处理失败
- OpenAI 调用错误率与延迟

## 18. 补充冻结要求

### 18.1 域名与会话隔离

正式环境建议至少采用：

- `app.<domain>`
- `admin.<domain>`
- `api.<domain>`

Cookie 会话策略必须支持 web/admin 分离，不得在部署层混用同一 Cookie 语义。

### 18.2 Webhook 与补偿要求

- Stripe Webhook 必须具备幂等处理、失败重试与补偿能力
- failed webhook 事件必须可追踪、可重放

### 18.3 文件处理状态链路

本地、staging、production 均应验证：

- `file upload → processing → ready | failed`

failed 状态下必须支持后续 retry，不应覆盖历史 job 记录。

## 19. 与其他文档的关系

- 《系统架构与技术方案》定义运行单元与模块边界
- 《开发骨架与目录结构设计说明》定义仓库结构与应用命名
- 《共享平台边界说明》定义哪些能力共享、哪些入口分离
- 《数据库设计》定义会话、文件处理、计费与事件状态在数据层的落地方式

## 20. 已冻结决策

1. Admin Frontend 首版采用最小可运行应用策略，并保留独立部署边界；是否在某个环境正式启用，按内部控制台落地节奏决定。
2. 本地环境默认不启用 Admin Frontend，仅在需要时启动。
3. production 文档层保持 vendor-agnostic，只冻结“托管容器平台 + 托管数据库 / Redis / 对象存储”的能力基线，不指定具体厂商。

## 21. 结论

ProposalFlow AI 的推荐部署基线应为：

- 本地：依赖服务容器化，应用按需本机运行
- staging：同构容器化部署
- production：镜像化并运行于托管平台

同时统一采用 `web/admin/api/worker` 命名、双前端入口、共享后端平台与独立会话语义，从而在保证 MVP 交付效率的同时，兼顾后续上线、运维和扩展的可控性。
