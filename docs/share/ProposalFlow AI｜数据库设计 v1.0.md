# ProposalFlow AI｜数据库设计 v1.0

## 1. 文档目的

本文档用于明确 ProposalFlow AI 在 MVP 阶段的数据库设计基线，回答以下问题：

- 核心实体与关系如何建模
- 多租户、认证、会话与权限如何落库
- AI 结构化输出、版本历史、规则配置如何存储
- 文件处理、订阅计费、活动日志与 AI 调用审计如何承载
- 哪些约束、索引与状态机需要在首版就固定下来

本文档提供的是可直接进入迁移脚本、ORM 建模与 API 设计阶段的数据库基线，而不是最终 SQL 实现文件。

## 2. 适用范围

适用于以下工作：

- 数据库建模与迁移设计
- 后端 ORM 与 Schema 设计
- API 资源模型与持久化模型对齐
- 文件处理、计费、审计与事件模型落地
- admin 查询与后续分析能力的基础数据准备

## 3. 数据库设计结论

### 3.1 主数据库结论

MVP 阶段采用 **PostgreSQL** 作为主数据库。

原因如下：

- 足以承载当前全部核心业务实体、关系、状态和事务更新
- 支持 JSONB，适合承载结构化 AI 输出和规则配置
- 事务一致性更适合 opportunity、版本、计费与状态流转场景
- 生态成熟，便于配合 Alembic、SQLAlchemy 或 SQLModel 落地

### 3.2 建模策略结论

数据库正式采用 **“关系型主干 + JSONB 扩展 + 版本表快照”** 的混合策略：

- 强关系、外键、状态、租户、计费、审计主字段使用标准关系型字段
- 结构化但频繁演进的 AI 产物、模板规则、章节内容使用 JSONB
- 用户可回看的历史版本通过版本表保存完整快照，而不是做数据库层细粒度 diff

### 3.3 设计目标

本数据库设计必须同时满足以下目标：

1. 以 `workspace` 为最小租户边界，确保多租户数据隔离
2. 以 `opportunity` 为主业务容器，支撑 Lead Intake → Lead Brief → Discovery → Proposal Draft → Follow-up 主链路
3. 支撑 AI 结构化输出，而不仅是保存不可解释的长文本
4. 支撑版本记录、状态流转、试用计费和 AI 调用审计
5. 在保留演进空间的前提下，避免 MVP 阶段过度复杂化

## 4. 核心建模原则

### 4.1 租户隔离原则

`workspace` 是最小租户边界。所有核心业务数据都必须满足以下条件之一：

- 直接带有 `workspace_id`
- 或能通过稳定外键追溯到 `workspace_id`

### 4.2 Opportunity-centered 原则

以下核心 AI 产物都必须绑定到具体 `opportunity`：

- `lead_briefs`
- `discovery_intelligence`
- `proposal_drafts`
- `follow_up_drafts`

### 4.3 Current State + Version History 原则

对用户可编辑、可回看的 AI 产物，统一采用“当前态 + 历史版本”模型：

- 当前表保存最新工作态
- 版本表保存历史快照

正式语义如下：

- `PATCH` 默认只更新当前工作态
- `generate` 默认只刷新当前工作态
- `save-version` 才创建新的历史快照并递增 `version_no`
- `latest_version_no` 表示最近一次已保存历史版本号，而不是最近一次临时生成时间

### 4.4 JSONB 使用原则

适合使用 JSONB 的内容包括：

- Lead Brief 结构化字段
- Discovery Intelligence 结构化字段
- Proposal Draft 分章节内容
- Follow-up Draft 输出结构
- 模板与规则配置
- 部分结果型任务的 `result_payload`

不应放入 JSONB 的内容包括：

- 主键、外键
- 稳定状态字段
- 计费与权限主字段
- 用户与 workspace 关系
- 审计主字段

### 4.5 MVP 克制原则

首版不引入以下复杂设计：

- 通用工作流引擎表
- 通用文档引擎表
- 复杂权限矩阵表
- 独立 analytics 数据库
- 向量检索或复杂检索库内建模

## 5. 命名与字段规范

### 5.1 命名规范

- 表名、字段名统一使用 `snake_case`
- 主键统一使用 `id`
- 外键统一使用 `<entity>_id`
- 时间字段统一使用 `created_at`、`updated_at`、`archived_at`、`deleted_at` 等语义化命名
- 布尔字段统一使用 `is_*` 或 `has_*`

### 5.2 字段类型规范

- 主键推荐统一使用 UUID
- 所有时间字段统一使用 `timestamptz`
- 长文本使用 `text`
- 稳定状态字段采用 `text + 应用层枚举 + check constraint`
- JSONB 字段必须有明确 schema，并在应用层完成验证后写入

### 5.3 状态字段约束原则

以下较稳定状态正式采用 `text + 应用层枚举 + check constraint`：

- `opportunities.status`
- `workspaces.trial_status`
- `workspaces.billing_status`
- `workspace_members.role`
- `file_assets.file_status`
- `file_processing_jobs.status`
- `billing_webhook_events.processing_status`
- `ai_call_logs.success_status`

## 6. 认证、用户、租户与会话模型

### 6.1 正式结论

数据库层不把“一个用户只属于一个 workspace”写死为永久模型，而是采用更稳妥的可扩展建模：

- `users`
- `user_auth_identities`
- `workspaces`
- `workspace_members`
- `internal_role_assignments`
- `user_sessions`

这样既兼容当前 MVP 的简化约束，也为未来多 workspace 或多认证源扩展保留空间。

### 6.2 用户与认证

#### `users`

承载应用层用户主体信息。

关键字段包括：

- `email`
- `full_name`
- `primary_auth_provider`
- `is_active`

约束要点：

- `email` 唯一
- `primary_auth_provider` 用于展示默认登录方式，不替代认证身份映射

#### `user_auth_identities`

承载用户与认证提供方的映射关系。

关键字段包括：

- `user_id`
- `provider`
- `provider_user_id`
- `provider_email`

约束要点：

- `unique(provider, provider_user_id)`
- `unique(user_id, provider)`

### 6.3 租户与成员关系

#### `workspaces`

租户主表，同时承载默认配置和当前试用 / 计费快照。

关键字段包括：

- `name`
- `industry_type`
- `default_template_key`
- `default_tone_preference`
- `trial_status`
- `trial_start_at`
- `trial_end_at`
- `billing_status`
- `plan_type`
- `stripe_customer_id`
- `stripe_subscription_id`
- `current_period_end`

说明：

- `workspaces` 保存当前计费状态快照，便于前端展示与访问控制
- 更完整的订阅历史与 webhook 事件通过独立表承载

#### `workspace_members`

承载用户与 workspace 的成员关系。

关键字段包括：

- `workspace_id`
- `user_id`
- `role`
- `joined_at`
- `is_active`

MVP 角色固定为：

- `owner`
- `member`

约束要点：

- `unique(workspace_id, user_id)`

### 6.4 internal 角色模型

#### `internal_role_assignments`

用于承载平台内部控制台角色，不进入 `workspace_members` 体系。

关键字段包括：

- `user_id`
- `role_key`
- `scope_type`
- `scope_value`
- `is_active`
- `granted_by_user_id`

首版角色固定为：

- `internal_admin`
- `internal_analyst`

约束要点：

- `unique(user_id, role_key, scope_type, scope_value)`

正式原则：

- internal role 不属于 workspace membership
- admin 鉴权必须查询 `internal_role_assignments`
- 不得复用 workspace 角色来表达 admin 权限

### 6.5 会话模型

#### `user_sessions`

用于保存浏览器会话事实状态，并显式区分会话类型。

关键字段包括：

- `user_id`
- `session_type`
- `session_status`
- `csrf_secret`
- `issued_at`
- `expires_at`
- `revoked_at`
- `last_seen_at`
- `ip_address`
- `user_agent`

首版 `session_type` 固定为：

- `web`
- `admin`

正式原则：

- web 与 admin 共用 `users` 主体身份模型
- 但会话类型必须分离
- Cookie 名称与域名策略由应用与部署层负责，本表仅承载会话状态事实

## 7. Opportunity 与输入模型

### 7.1 核心结论

机会本身与原始输入来源必须拆开建模，而不是把所有输入直接塞进 `opportunities`。

原因如下：

- 一个机会未来可能有多个输入来源
- PDF 抽取结果与手动粘贴内容应可区分
- 便于后续扩展 Gmail、表单、会议纪要等来源

### 7.2 `opportunities`

作为主工作流的核心业务容器。

关键字段包括：

- `workspace_id`
- `owner_user_id`
- `title`
- `source_type`
- `company_name`
- `contact_name`
- `contact_email`
- `requested_service`
- `status`
- `archived_at`

建议状态：

- `new`
- `lead_brief_generated`
- `discovery_added`
- `discovery_reviewed`
- `proposal_draft_generated`
- `proposal_in_review`
- `proposal_ready`
- `follow_up_drafted`
- `archived`

说明：

- `status` 用于驱动 Dashboard、列表筛选与页面 Stepper
- `archived_at` 用于保留归档审计时间，`status = archived` 用于业务展示

### 7.3 `opportunity_inputs`

保存机会的原始输入与输入来源。

关键字段包括：

- `opportunity_id`
- `workspace_id`
- `input_type`
- `raw_text`
- `normalized_text`
- `is_primary`
- `file_asset_id`
- `created_by_user_id`

建议 `input_type`：

- `pasted_email`
- `pasted_form`
- `pasted_brief`
- `pasted_dm`
- `pasted_rfp`
- `uploaded_pdf`
- `manual_note`

关键约束：

- 同一 `opportunity` 只能有一个 `primary input`
- 推荐使用部分唯一索引：`unique(opportunity_id) where is_primary = true`

## 8. 文件处理模型

### 8.1 核心结论

文件处理链路正式采用两套状态机，分别对应文件事实状态与任务执行状态：

- `file_assets.file_status`：`uploaded → processing → ready | failed`
- `file_processing_jobs.status`：`pending → processing → succeeded | failed`

> `complete` 是接口动作，不是持久化状态。

### 8.2 `file_assets`

保存上传文件元数据，不保存二进制文件本体。

关键字段包括：

- `workspace_id`
- `opportunity_id`
- `uploaded_by_user_id`
- `storage_key`
- `original_filename`
- `mime_type`
- `file_size_bytes`
- `file_status`

正式状态：

- `uploaded`
- `processing`
- `ready`
- `failed`

### 8.3 `file_processing_jobs`

用于跟踪 PDF 文本抽取等后台任务。

关键字段包括：

- `file_asset_id`
- `workspace_id`
- `job_type`
- `status`
- `result_payload`
- `error_message`
- `started_at`
- `finished_at`

首版 `job_type` 固定为：

- `pdf_text_extraction`

正式执行规则：

1. 用户上传后创建 `file_assets`，初始状态为 `uploaded`
2. `complete` 动作成功后创建 `file_processing_jobs`，并将 `file_status` 更新为 `processing`
3. 抽取成功后，`job.status = succeeded`，`file_status = ready`，并由应用层回填 `opportunity_inputs.normalized_text`
4. 抽取失败后，`job.status = failed`，`file_status = failed`
5. 重试时新增新 job 记录，而不是覆盖历史记录

## 9. AI 产物与版本模型

### 9.1 Lead Brief

#### `lead_briefs`

保存某个 opportunity 当前最新可用的 Lead Brief。

关键字段包括：

- `workspace_id`
- `opportunity_id`（唯一）
- `latest_version_no`
- `current_payload`
- `source_input_id`
- `last_ai_call_id`
- `updated_by_user_id`

建议 payload 结构包括：

- `client_company`
- `contact`
- `requested_service`
- `business_context`
- `urgency_timeline`
- `budget_signal`
- `fit_assessment`
- `missing_information[]`
- `recommended_next_step`
- `field_meta`

#### `lead_brief_versions`

保存 Lead Brief 历史快照。

关键字段包括：

- `lead_brief_id`
- `workspace_id`
- `opportunity_id`
- `version_no`
- `payload`
- `version_origin`
- `saved_by_user_id`
- `ai_call_id`

约束要点：

- `unique(lead_brief_id, version_no)`

### 9.2 Discovery

#### `discovery_records`

保存 discovery 原始输入内容。

建议字段包括：

- `workspace_id`
- `opportunity_id`
- `raw_notes`
- `note_type`
- `created_by_user_id`

建议 `note_type`：

- `pasted_notes`
- `pasted_transcript`
- `meeting_summary`
- `manual_addition`

#### `discovery_intelligence`

保存当前最新可用的 Discovery Intelligence。

关键字段包括：

- `workspace_id`
- `opportunity_id`（唯一）
- `latest_version_no`
- `current_payload`
- `source_record_id`
- `last_ai_call_id`
- `updated_by_user_id`

建议 payload 结构包括：

- `client_goals[]`
- `current_problems[]`
- `desired_outcomes[]`
- `constraints[]`
- `stakeholders[]`
- `timeline_signals[]`
- `budget_signals[]`
- `assumptions[]`
- `ambiguities[]`
- `risk_flags[]`
- `follow_up_questions[]`
- `field_meta`

#### `discovery_intelligence_versions`

设计与 `lead_brief_versions` 同构。

### 9.3 Proposal Draft

#### 建模结论

Proposal Draft 是 MVP 核心输出，但不建议把每个章节完全拆成多张关系表。正式做法为：

- 当前表用 JSONB 保存章节结构
- 版本表保存完整章节快照
- section key 的约束由应用层统一控制

#### `proposal_drafts`

关键字段包括：

- `workspace_id`
- `opportunity_id`（唯一）
- `template_key`
- `rule_set_id`
- `latest_version_no`
- `current_payload`
- `last_ai_call_id`
- `updated_by_user_id`

建议 payload 结构包括：

- `executive_summary`
- `objectives`
- `recommended_approach`
- `deliverables`
- `timeline`
- `assumptions`
- `exclusions`
- `next_steps`
- `confidence_notes`
- `section_meta`

正式约束：

- 所有章节型 Proposal Draft payload 必须保留 `assumptions` 与 `exclusions` 两个稳定 section key
- `section_meta` 可记录章节状态、最后编辑人和最后生成时间

#### `proposal_draft_versions`

关键字段包括：

- `proposal_draft_id`
- `workspace_id`
- `opportunity_id`
- `version_no`
- `template_key`
- `payload`
- `version_origin`
- `version_note`
- `saved_by_user_id`
- `ai_call_id`

约束要点：

- `unique(proposal_draft_id, version_no)`

### 9.4 Follow-up Draft

#### `follow_up_drafts`

保存某个 opportunity 当前最新可用的 Follow-up Draft。

关键字段包括：

- `workspace_id`
- `opportunity_id`（唯一）
- `latest_version_no`
- `current_scenario_type`
- `current_tone`
- `current_payload`
- `last_ai_call_id`
- `updated_by_user_id`

建议 payload 结构包括：

- `subject`
- `body`
- `cta`
- `scenario_type`
- `tone_variant`

#### `follow_up_draft_versions`

设计与 `proposal_draft_versions` 同构。

## 10. 模板与规则模型

### 10.1 设计结论

模板定义与 workspace 级规则必须拆开：

- `template_definitions`：系统预设模板元数据
- `workspace_rule_sets`：workspace 当前生效规则
- `opportunity_rule_overrides`：相对 workspace 基线规则的局部覆盖

### 10.2 `template_definitions`

用于保存系统预设模板定义。

关键字段包括：

- `template_key`
- `name`
- `industry_scope`
- `section_order`
- `required_sections`
- `default_service_modules`
- `is_active`

### 10.3 `workspace_rule_sets`

用于保存 workspace 当前生效的模板与规则配置。

关键字段包括：

- `workspace_id`（唯一）
- `template_key`
- `tone_profile`
- `preferred_terminology`
- `banned_terminology`
- `default_assumptions`
- `default_exclusions`
- `service_modules`
- `section_order`
- `required_sections`
- `default_cta_style`
- `updated_by_user_id`

正式 source of truth 规则：

- `workspaces.default_*` 仅用于初始化和轻量展示默认值
- `workspace_rule_sets` 是生成时的唯一有效规则来源
- `opportunity_rule_overrides` 仅保存单个 opportunity 的局部覆盖
- `effective rules` 由应用层在生成时合成，不强制单独落库

### 10.4 `opportunity_rule_overrides`

用于保存某个 opportunity 相对于 workspace 基线规则的最小覆盖。

关键字段包括：

- `workspace_id`
- `opportunity_id`（唯一）
- `template_key_override`
- `tone_profile_override`
- `assumptions_override`
- `exclusions_override`
- `service_modules_override`
- `preferred_terminology_additions`
- `banned_terminology_additions`
- `default_cta_style_override`
- `updated_by_user_id`

## 11. 试用与计费模型

### 11.1 正式结论

当前 trial / billing 的实时业务状态保留在 `workspaces` 中，便于前端展示与访问控制；Stripe 原始事件与订阅历史通过独立表承载。

### 11.2 `workspace_subscriptions`

保存 workspace 的订阅记录与当前 / 历史映射。

关键字段包括：

- `workspace_id`
- `stripe_customer_id`
- `stripe_subscription_id`
- `plan_type`
- `status`
- `current_period_start`
- `current_period_end`
- `cancel_at_period_end`
- `started_at`
- `ended_at`

### 11.3 `billing_webhook_events`

记录 Stripe webhook 事件，支持幂等、审计和补偿。

关键字段包括：

- `provider`
- `external_event_id`
- `event_type`
- `payload`
- `processing_status`
- `processed_at`

约束要点：

- `unique(provider, external_event_id)`

正式 `processing_status`：

- `received`
- `processed`
- `failed`
- `ignored`

## 12. AI 审计与活动日志模型

### 12.1 `ai_call_logs`

用于记录关键 AI 调用元数据，服务于成本分析、失败追踪和质量诊断。

关键字段包括：

- `workspace_id`
- `opportunity_id`
- `module_type`
- `model_name`
- `provider`
- `request_schema_key`
- `prompt_fingerprint`
- `input_length`
- `output_length`
- `input_tokens`
- `output_tokens`
- `latency_ms`
- `success_status`
- `retry_count`
- `error_code`
- `error_message`

建议 `module_type`：

- `lead_brief`
- `discovery_intelligence`
- `proposal_draft`
- `proposal_section_regeneration`
- `follow_up`

### 12.2 `activity_logs`

用于记录核心用户动作与状态流转，既承担基础审计，也承担共享事件基线。

关键字段包括：

- `workspace_id`
- `user_id`
- `opportunity_id`
- `entity_type`
- `entity_id`
- `action_type`
- `metadata`
- `created_at`

正式原则：

- `activity_logs` 属于共享平台基础模块，不归属于单一产品面
- 是未来 admin 统计查询与平台级排查的重要事件来源

首版最小事件集固定为：

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

补充规则：

- 主漏斗统计对象默认按 `workspace_id` 去重
- `signup_completed` 是 user-level 事件，不纳入 workspace 主漏斗分母链路

## 13. 索引、唯一性与生命周期策略

### 13.1 首版必做索引

建议首版即建立以下关键索引：

- `users.unique(email)`
- `user_auth_identities.unique(provider, provider_user_id)`
- `user_auth_identities.unique(user_id, provider)`
- `workspace_members.unique(workspace_id, user_id)`
- `idx_workspace_members_user(user_id)`
- `idx_opportunities_workspace_updated(workspace_id, updated_at desc)`
- `idx_opportunities_workspace_status(workspace_id, status)`
- `idx_opportunities_workspace_owner(workspace_id, owner_user_id)`
- `partial_unique_primary_input on opportunity_inputs(opportunity_id) where is_primary = true`
- 各 current draft 表的 `unique(opportunity_id)`
- 各版本表的 `unique(parent_id, version_no)`
- `idx_ai_call_logs_workspace_created(workspace_id, created_at desc)`
- `idx_ai_call_logs_opportunity(opportunity_id)`
- `idx_ai_call_logs_module(module_type, created_at desc)`
- `billing_webhook_events.unique(provider, external_event_id)`

### 13.2 当前态唯一性策略

必须明确以下唯一关系：

- 每个 opportunity 当前只有一个 `lead_brief`
- 每个 opportunity 当前只有一个 `discovery_intelligence`
- 每个 opportunity 当前只有一个 `proposal_draft`
- 每个 opportunity 当前只有一个 `follow_up_draft`
- 当前态与历史版本严格分离

### 13.3 搜索策略

MVP 阶段 `opportunities` 列表搜索可先采用：

- `title ILIKE`
- `company_name ILIKE`

若数据规模增长明显，再考虑 `pg_trgm` 与 trigram index。

### 13.4 生命周期策略

#### 机会生命周期

- 日常业务操作仅提供 archive
- hard delete 作为后台动作或延迟任务处理

#### 文件生命周期

从长期保留策略角度，可理解为文件会经历“已上传、已就绪、被保留、被删除”等阶段，但这不是正式持久化状态字段集合。

首版正式持久化状态机仍以文件处理链路为准：`uploaded → processing → ready | failed`。

其中：

- `ready` 表示文件已完成处理并可被业务链路使用
- `retained / deleted` 更适合作为后续保留与清理策略语义，而不是当前应用状态值

#### 版本生命周期

- 历史版本默认长期保留
- 首版不做自动裁剪
- 版本属于产品信任与审计能力的一部分

## 14. 建表顺序建议

推荐迁移顺序如下：

1. `users`
2. `user_auth_identities`
3. `workspaces`
4. `workspace_members`
5. `template_definitions`
6. `workspace_rule_sets`
7. `opportunities`
8. `file_assets`
9. `opportunity_inputs`
10. `file_processing_jobs`
11. `workspace_subscriptions`
12. `billing_webhook_events`
13. `ai_call_logs`
14. `lead_briefs`
15. `lead_brief_versions`
16. `discovery_records`
17. `discovery_intelligence`
18. `discovery_intelligence_versions`
19. `proposal_drafts`
20. `proposal_draft_versions`
21. `follow_up_drafts`
22. `follow_up_draft_versions`
23. `activity_logs`
24. `internal_role_assignments`
25. `user_sessions`

## 15. 与其他文档的关系

- 《系统架构与技术方案》定义运行单元、模块边界与文件处理状态机
- 《共享平台边界说明》定义 web / admin / shared platform 的共享与分离原则
- 《开发骨架与目录结构设计说明》将本数据库模型落成 apps、packages、migrations 与权限边界
- web / admin 侧 PRD、API 与页面文档以本数据库模型作为持久化与资源边界基线

## 16. 已冻结决策

1. `internal_analyst` 首版不扩展为字段级或对象级限制，按 global internal role 落地。
2. `user_sessions` 以数据库持久化为 source of truth；Redis 或其他 session/cache 方案只作为性能优化，不替代正式状态源。
3. 首版不新增规则版本表，继续由 `workspace_rule_sets` 与 `opportunity_rule_overrides` 承载规则系统。
4. admin 查询首版不引入预聚合层或只读派生表，先基于 `activity_logs + 核心业务表` 在线聚合。

## 17. 结论

ProposalFlow AI 的 MVP 数据库设计，应围绕三条主线建立：

- 以 `workspace` 为租户边界
- 以 `opportunity` 为业务中心
- 以“当前态 + 版本表 + JSONB 结构化输出”为核心建模方式

在此基础上，数据库同时承载认证与会话分层、规则系统、文件处理、计费映射、AI 审计与共享事件体系，从而为 web、admin 和 shared platform 三组文档提供统一、稳定、可演进的数据基线。
