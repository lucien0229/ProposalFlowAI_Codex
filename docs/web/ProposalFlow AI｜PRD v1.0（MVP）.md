# ProposalFlow AI｜PRD v1.0（MVP）

## 1. 文档目的

本文档用于定义 ProposalFlow AI 的 MVP 产品需求，作为设计、研发、测试、试点与验收的统一依据。

本审校版重点完成三件事：
- 将产品定位、范围与优先级统一到同一口径。
- 将主流程、角色、规则层、版本语义与计费基线明确化。
- 对尚未能唯一裁定的问题保留为待确认项，而非擅自扩展需求。

## 2. 适用范围

适用于：
- MVP 范围判断与排期
- 页面、交互、API 与数据模型设计
- 开发实施与测试验收
- 试点验证与商业化基线制定

不替代页面级需求、API 契约与数据库设计明细。

## 3. 产品概述

### 3.1 产品名称

ProposalFlow AI

### 3.2 产品定位

ProposalFlow AI 是一款面向小型服务型团队的 AI pre-proposal workflow copilot，帮助团队将零散的售前信息转化为结构化、可复核、可编辑的 proposal-ready draft。

### 3.3 核心目标

MVP 的目标不是做完整 proposal 平台，而是验证：

对于 3–20 人的 web / product / development agency，是否存在一个高频、强痛点、可信且可付费的“提案前工作流”产品机会。

### 3.4 核心承诺

MVP 统一承诺为：

> 帮助小型服务团队将零散售前信息转化为结构化、可复核、可编辑的 proposal-ready draft，并显著提升从 lead 到 proposal draft 的效率与一致性。

## 4. 产品边界

### 4.1 In Scope（MVP 正式范围）

MVP 覆盖以下正式范围：
1. Workspace 与基础账户体系
2. Opportunity / Lead Intake
3. Lead Brief
4. Discovery Intelligence
5. Scope Builder / Proposal Draft
6. Follow-up Assistant
7. Templates & Rules（含 workspace 基线规则与 opportunity 局部覆盖）
8. 保存、复制、导出、版本记录与版本恢复
9. Billing / Trial

### 4.2 Out of Scope（MVP 不做）

以下内容不进入 MVP 首版范围：
- 电子签署
- 支付回款后的交付管理
- 自动报价引擎
- 深度 CRM 双向同步
- 完整项目管理系统
- 企业级复杂权限与审批流
- 模板市场
- 自动抓取会议录音
- 多语言本地化体系

### 4.3 Draft-first 边界

MVP 所有输出都属于 draft，不是最终法律或商务承诺。系统必须允许用户：
- 编辑与覆盖
- 查看风险与不确定项
- 保存当前工作态
- 显式保存历史版本
- 在必要时恢复历史版本到当前工作态

## 5. 目标用户与角色

### 5.1 Primary ICP

MVP 第一阶段统一聚焦：
- 3–20 人的 web / product / development agency
- 提供网站开发、产品设计、MVP 开发、数字产品咨询、技术交付等服务
- 项目通常需要 discovery 与 scope 定义
- proposal 质量会直接影响成交率与交付风险

### 5.2 买家角色

核心买家通常包括：
- Founder / Owner
- Managing Director
- Operations Lead
- Head of Delivery

### 5.3 使用者角色

高频使用者通常包括：
- Sales / BD
- Account Lead
- Project Lead
- Founder

### 5.4 租户角色

MVP 客户侧采用极简角色模型：
- **Owner**：管理 workspace 设置、模板与规则，并查看 workspace 数据。
- **Member**：创建与编辑机会，生成和编辑草稿。

说明：internal admin / analyst 属于未来平台内部角色体系，不与 Owner / Member 混用。

## 6. 统一术语与数据对象

### 6.1 关键业务对象

- **Workspace**：租户边界与默认配置容器。
- **Opportunity**：单个售前机会，承载主流程上下文。
- **Opportunity Input**：原始售前输入，包括粘贴文本与 PDF 抽取结果。
- **Lead Brief**：机会的第一轮结构化摘要。
- **Discovery Record / Discovery Intelligence**：discovery 原始记录与其结构化理解。
- **Proposal Draft**：在 Scope Builder 中生成和编辑的 proposal-ready draft。
- **Follow-up Draft**：基于当前 Proposal Draft 场景化生成的后续沟通草稿。
- **Workspace Rule Set**：workspace 级基线规则的唯一有效来源。
- **Opportunity Rule Override**：当前机会的局部规则覆盖。
- **Effective Rules**：模板定义、workspace 基线规则与 opportunity 覆盖合成后的实际生效规则。

### 6.2 状态术语

关键字段透明度统一使用：
- Confirmed
- Inferred
- Missing
- Needs Review

## 7. 产品原则

1. **Draft-first**：始终输出草稿，而不是最终承诺。
2. **Structured-first**：先结构化提炼，再模板化生成，不从原始长文本直接跳到最终大段文本。
3. **Explicit-uncertainty**：不确定信息必须显式标记，不得伪装成事实。
4. **Rule-constrained**：输出受模板、术语、章节、assumptions / exclusions 和服务模块约束。
5. **Editable-by-default**：所有关键输出必须支持编辑、覆盖、保存与重生成。
6. **Opportunity-centered**：页面与 API 都围绕单个机会组织工作流。

## 8. 端到端主流程

### 8.1 Happy Path

1. 用户注册 / 登录
2. 首次进入时完成 Workspace Setup
3. 进入 Dashboard
4. 创建 Opportunity
5. 在 Opportunity Overview / Lead Intake 录入原始输入或上传 PDF
6. 生成并修正 Lead Brief
7. 导入 discovery notes / transcript
8. 生成并修正 Discovery Intelligence
9. 进入 Scope Builder
10. 选择模板并基于 effective rules 生成 Proposal Draft
11. 编辑、保存当前工作态、保存版本、复制或导出
12. 基于当前 Proposal Draft 生成 Follow-up Draft

### 8.2 步骤依赖

统一依赖口径如下：
- Lead Brief 是推荐先完成的结构化提炼步骤。
- Discovery 是推荐先完成的需求理解步骤。
- **Proposal Draft 生成必须依赖可用的 Lead Brief 与基础 Discovery 信息。**
- **Follow-up Draft 生成按“已有 current Proposal Draft”处理；页面可进入，但无 Proposal Draft 上下文时不放开正式生成。**

## 9. MVP / P0 / P1 范围口径

### 9.1 MVP 与 P0 的关系

- **MVP**：用于验证产品价值的正式范围。
- **P0**：MVP 首版必须交付的最小闭环。
- **P1**：不影响闭环，但显著影响可用性、可靠性、转化与留存的增强项。

### 9.2 P0 最小闭环

P0 至少必须覆盖：
- Auth + Workspace Setup
- Opportunities / Lead Intake
- Lead Brief
- Discovery Intelligence
- Scope Builder / Proposal Draft
- Follow-up Assistant
- Templates & Rules 的最小可用约束层
- 保存、版本、导出 / 复制
- Billing / Trial 基线

### 9.3 P1 统一口径

P1 典型内容包括：
- Lead Brief / Discovery 更细粒度重生成
- 更好的 Dashboard 快捷操作
- 规则冲突提示与预览增强
- 更好的导出格式
- 更清晰的 Billing 提示与错误恢复路径

## 10. 功能需求总览

### 10.1 Workspace 与账户体系

目标：提供用户认证、workspace 创建与租户隔离。

必须支持：
- 邮箱注册 / 登录
- Google 登录 / 注册
- 忘记密码 / 重置密码
- 首次创建 workspace
- workspace 基础信息、默认模板、默认语气偏好配置

核心规则：
- 未登录用户不得访问业务数据
- 未完成 workspace setup 的用户不得进入业务页
- workspace 之间数据完全隔离

### 10.2 Opportunity / Lead Intake

目标：将零散原始输入转化为可跟踪的 opportunity 记录。

支持的输入形式：
- 邮件正文粘贴
- 网站表单内容粘贴
- brief / RFP / DM 摘要文本粘贴
- PDF 上传并抽取文本
- 手动补充标题、公司、联系人等字段

核心规则：
- raw input 是 Lead Brief 生成的基础输入
- title 可自动建议，但必须允许手动改写
- PDF 仅做文本抽取，不做复杂版面还原
- 文件处理状态需支持 uploaded / processing / ready / failed

### 10.3 Lead Brief

目标：从原始输入生成用于初步判断与推进的结构化摘要。

输出字段统一包括：
- client / company
- contact
- requested service
- business context
- urgency / timeline
- budget signal
- fit assessment
- missing information
- recommended next step

核心规则：
- 优先提取明确事实
- 推断字段可为空，不强行补齐
- missing information 必须可行动
- fit assessment 不输出绝对结论

### 10.4 Discovery Intelligence

目标：将 discovery 内容转为 proposal-ready understanding。

输出字段统一包括：
- client goals
- current problems
- desired outcomes
- constraints
- stakeholders
- timeline signals
- budget signals
- assumptions
- ambiguities
- risk flags
- follow-up questions

核心规则：
- 区分事实与推断
- 对范围不清、交付依赖、时间线不一致、预算模糊等进行风险提示
- timeline / budget 证据不足时明确标记“Not enough evidence”

### 10.5 Templates & Rules

目标：提供 Proposal Draft 的约束层，防止产品退化为自由生成工具。

统一规则层级：
1. Template Definition
2. Workspace Rule Set
3. Opportunity Rule Override
4. 用户在当前草稿中的最终手动编辑

其中第 4 层优先级最高，不得被后续重生成无提示覆盖。

workspace 基线规则至少包含：
- template_key
- tone_profile
- default_assumptions
- default_exclusions
- preferred_terminology
- banned_terminology
- service_modules
- section_order
- required_sections
- default_cta_style

opportunity 局部覆盖只对当前 opportunity 生效，不回写 workspace 基线。

### 10.6 Scope Builder / Proposal Draft

目标：基于结构化输入、模板与规则，生成 proposal-ready draft。

统一输出结构：
- Executive Summary
- Objectives
- Recommended Approach
- Deliverables
- Timeline
- Assumptions
- Exclusions
- Next Steps / CTA

核心规则：
- 必须优先使用 Lead Brief 与 Discovery Intelligence 等结构化输入
- 生成时必须基于 effective rules
- Assumptions 与 Exclusions 必须保留独立章节
- 不确定范围优先写入 assumptions 或待确认项，而不是直接承诺
- Timeline 在证据不足时只能写建议性表达

### 10.7 Follow-up Assistant

目标：在 proposal 发送后提供场景化 follow-up 草稿。

统一场景：

- same day follow-up
- 3-day follow-up
- no response reminder
- objection handling
- discovery recap + next steps

统一输出：

- subject
- body
- CTA

核心规则：
- 尽可能引用当前 Proposal Draft 上下文
- CTA 必须明确
- 不输出不符合 B2B 沟通礼仪的表达
- Follow-up 的语气能力在 MVP 中保留为待确认项；现阶段只冻结 workspace 默认语气偏好可参与生成上下文，不单独冻结显式“语气切换”为 P0

### 10.8 Billing / Trial

目标：支撑免费自助试用与首版正式付费基线。

正式基线：
- 免费自助试用
- 按 workspace 收费
- Stripe Checkout / Billing / Customer Portal / Webhooks
- 首版一个正式付费计划
- 仅支持 USD

统一状态约束：
- trial_active：允许完整使用
- trial_expired：允许只读访问既有数据与 Billing，默认阻断新生成动作；regenerate / export / restore 是否受限待冻结
- paid_active：允许完整使用
- past_due：允许查看历史数据、管理订阅与修复支付，默认阻断新生成动作；regenerate / export / restore 是否受限待冻结
- canceled / inactive：允许只读访问与升级入口，默认阻断新生成动作；regenerate / export / restore 是否受限待冻结

## 11. 版本、重生成与恢复语义

### 11.1 当前工作态与历史版本

以下资源均采用“当前工作态 + 历史版本”模型：
- Lead Brief
- Discovery Intelligence
- Proposal Draft
- Follow-up Draft

统一规则：
- 普通编辑保存只更新当前工作态
- 显式执行 save-version 才创建新的历史版本
- generate / regenerate 默认刷新当前工作态，不自动创建历史版本

### 11.2 Restore 语义

MVP 正式包含版本恢复能力：
- 支持查看历史版本
- 支持预览历史版本
- 支持 restore 到当前工作态

统一规则：
- restore 不自动生成新的历史版本
- 若用户要保留恢复前状态，应先显式执行 save-version

### 11.3 重生成能力边界

统一口径如下：
- Lead Brief：支持整体重生成；更细字段级重生成归入 P1
- Discovery：支持整体重生成；单字段或单块重生成归入 P1
- Proposal Draft：章节级重生成属于 P0，必须具备
- Follow-up：支持按场景 / 语气重新生成当前草稿

所有重生成动作不得无提示覆盖手动编辑内容。

## 12. 页面模型与 API 资源模型关系

### 12.1 页面模型

客户侧产品采用机会中心化页面结构：
- 全局页：Dashboard、Opportunities、Templates & Rules、Billing、Settings
- 机会子页：Overview / Lead Intake、Lead Brief、Discovery、Proposal Draft、Follow-up

### 12.2 API 资源模型

接口层采用 Opportunity-centered 子资源结构：
- `/opportunities/{id}`
- `/opportunities/{id}/lead-brief`
- `/opportunities/{id}/discovery`
- `/opportunities/{id}/proposal-draft`
- `/opportunities/{id}/follow-up`
- `/opportunities/{id}/rules/effective`
- `/opportunities/{id}/rules/override`

统一意义：UI 的流程上下文与 API 的资源边界必须对应，避免页面和接口分别围绕不同模型组织。

## 13. 成功指标

### 13.1 北极星指标

从原始售前输入到形成可复核 proposal-ready draft 的平均时间。

### 13.2 核心产品指标

- Opportunity 创建率
- Lead Brief 生成率
- Discovery Intelligence 生成率
- Proposal Draft 生成率
- Proposal Draft 被保留并继续编辑的比例
- Follow-up Draft 使用率
- 单 workspace 周使用频次
- 单 workspace 有效 opportunity 数

### 13.3 质量指标

- Draft Retention Rate
- Assumptions / Exclusions 保留率
- Missing information / follow-up questions 的实际有用性
- 审核时间下降的主观反馈
- Draft Usability Score

### 13.4 漏斗口径

主漏斗对象统一从 `workspace_created` 开始；`signup_completed` 保留为 user-level 指标，不纳入 workspace 主漏斗分母链路。

## 14. 与其他文档的关系

- 与《产品方案升级版》：承接产品定位、边界、ICP 与商业化大口径。
- 与《MVP 功能清单》：将本文件范围进一步拆解为 P0 / P1 / P2 与页面模块清单。
- 与《页面流程与信息架构说明》：将机会中心化工作流落到导航、路由与 guard。
- 与《页面清单与页面级需求》：将模块要求展开为页面区块、状态与验收标准。
- 与《API 设计》：将资源边界、版本语义、规则层与计费约束落到接口契约。

## 15. 已冻结决策

1. **Member 的默认数据可见范围**
   - `owner` 与 `member` 默认都可查看当前 workspace 下的全部 opportunities；更细的机会级可见性控制不进入首版。
2. **模板自动推荐逻辑**
   - 首版不冻结复杂推荐算法，只保留默认行业映射与手动切换能力。
3. **受限计费状态下的动作矩阵**
   - `trial_expired`、`past_due`、`canceled`、`inactive` 下统一采用“工作流只读 + 商业化入口可用”模式。
   - 阻断 `generate`、`regenerate`、`save current`、`save-version`、`restore`、`export`。

## 16. 验收结论

当且仅当以下条件满足时，MVP 才可视为具备外部试用条件：
- 用户可独立完成从 Opportunity 创建到 Proposal Draft 生成的完整主流程
- 核心四类资源均可编辑、保存版本并恢复版本
- Proposal Draft 具备模板约束、effective rules 展示与 assumptions / exclusions 输出
- Follow-up 在 Proposal Draft 上下文下可顺利生成
- Billing / Trial、Checkout、Portal 与 Webhook 状态同步可用
- 关键状态流转与事件埋点可用
- workspace 数据隔离有效
