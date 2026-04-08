# ProposalFlow AI｜页面清单与页面级需求 v1.0

## 1. 文档目的

本文档将 PRD 与 MVP 功能清单进一步下钻到页面层，形成可直接用于页面设计、前后端联调与测试验收的页面级需求说明。

本审校版重点统一：

- 页面清单与机会中心化信息架构的一致性
- 各页面的目标、区块、状态与依赖
- 版本、重生成、规则层与计费限制在页面上的落点
- Follow-up、模板覆盖与版本恢复等跨文档关键口径

## 2. 适用范围

适用于：

- 页面设计与交互设计
- 前端页面实现与状态建模
- 后端接口联调
- 页面级测试与验收

## 3. 一级页面总览

### 3.1 页面级通用术语 / 定义

- **页面可进入**：用户可以打开页面并查看当前上下文、状态或说明。
- **正式生成**：会触发 AI 生成或重生成动作的主操作。
- **当前工作态**：当前可编辑内容，不等同于历史版本。
- **历史版本**：通过保存版本形成的历史快照。
- **Restore 到当前工作态**：把历史版本写回当前工作态，不自动新增历史版本。
- **P0 / P1**：若某能力在《MVP 功能清单》中被列为 P1，则本文件仅将其视为增强项，不默认视为首发必备能力。

### 3.2 一级页面列表

MVP 客户侧统一包含以下页面：

1. Auth
2. Workspace Setup
3. Dashboard
4. Opportunities List
5. Opportunity Overview / Lead Intake
6. Lead Brief Workspace
7. Discovery Workspace
8. Scope Builder / Proposal Draft
9. Follow-up Workspace
10. Templates & Rules
11. Billing / Trial
12. Settings

说明：

- Lead Brief、Discovery、Proposal Draft、Follow-up 都应作为 Opportunity 子流程页面进入。
- Templates & Rules 是独立一级页面，但只承载 workspace 基线规则。
- opportunity 局部规则覆盖必须留在 Scope Builder 当前上下文中。

## 4. 用户主路径

### 4.1 首次用户路径

Auth → Workspace Setup → Dashboard → Create Opportunity → Lead Intake → Lead Brief → Discovery → Proposal Draft → Follow-up

### 4.2 日常用户路径

Dashboard / Opportunities → Opportunity 当前步骤 → 编辑 / 生成 / 保存版本 / 恢复版本 → 导出 / 复制 → 返回 Dashboard 或 Opportunities

### 4.3 试用转化路径

Dashboard / Billing → Upgrade → Stripe Checkout → Billing Status Updated → Paid Workspace

## 5. 页面一：Auth

### 5.1 页面目标

让用户通过邮箱或 Google 低摩擦进入产品。

### 5.2 页面入口

- 官网 CTA
- 产品登录入口
- 试用入口

### 5.3 核心区块

- 品牌区
- Google 登录入口
- 邮箱登录 / 注册表单
- 账号辅助入口（忘记密码、切换登录 / 注册）

### 5.4 核心交互

- Google 登录 / 注册
- 邮箱注册 / 登录
- 忘记密码
- 首次登录后进入 Workspace Setup

### 5.5 页面状态

- 正常：Google 按钮 + 邮箱表单
- 加载：提交中、按钮禁用
- 错误：邮箱格式错误、密码错误、账号不存在、Google 授权失败、重置链接失效

### 5.6 依赖能力

- Auth service
- Google OAuth
- Email/password auth
- Password reset

### 5.7 验收标准

- 用户可通过 Google 或邮箱顺利进入产品
- 错误提示明确
- 首次登录会被正确引导至 Workspace Setup

## 6. 页面二：Workspace Setup

### 6.1 页面目标

建立最小业务上下文，使后续输出具备行业与模板默认值。

### 6.2 页面入口

- 首次登录自动进入
- workspace 未完成时强制进入

### 6.3 核心区块

- Workspace 基础信息：`workspace_name`、`industry_type`
- 默认偏好：`default_template`、`default_tone_preference`
- Continue to Dashboard CTA

### 6.4 字段口径

`industry_type` 仅支持：

- Web/Development Agency
- Product/UX Agency

`default_template` 支持：

- Development Agency Template
- Product / UX Agency Template
- Web Delivery Proposal Template

### 6.5 页面状态

- 正常：空表单或已填默认值
- 错误：workspace_name 为空、industry_type 未选择
- 成功：创建后跳转 Dashboard

### 6.6 依赖能力

- Workspace create API
- Template metadata
- User profile

### 6.7 验收标准

- 用户可在单页完成 workspace 创建
- 默认模板与语气偏好可作用于后续流程

## 7. 页面三：Dashboard

### 7.1 页面目标

让用户快速开始新机会，或回到未完成机会继续推进。

### 7.2 核心区块

- 页面顶部工具栏：New Opportunity
- 状态概览卡片
- Recent Opportunities
- Needs Attention
- Trial / Billing Card

### 7.3 核心交互

- 创建新机会
- 进入某个现有机会
- 点击提醒项跳到对应未完成步骤
- 点击 Upgrade 进入 Billing / Checkout 路径

### 7.4 页面状态

- 正常：有机会数据
- 空状态：无 opportunities 时显示引导文案
- 错误：数据拉取失败，支持 retry

### 7.5 依赖能力

- Opportunity summary API
- Opportunity list API
- Billing snapshot API

### 7.6 验收标准

- 用户可从 Dashboard 发起新机会
- 用户可返回未完成机会继续推进
- Trial 状态与 Billing 数据一致

## 8. 页面四：Opportunities List

### 8.1 页面目标

提供系统化的机会管理视图。

### 8.2 核心区块

- 顶部操作栏：New Opportunity、Search、Status Filter
- 机会列表
- Archived toggle

说明：排序能力在《MVP 功能清单》中归为 P1 增强项，因此本页不将其视为首发默认必备区块。

### 8.3 核心交互

- 按 title / company 搜索
- 按 status 过滤
- 归档 / 取消归档
- 点击进入详情

### 8.4 页面状态

- 正常：列表展示
- 空状态：无机会时显示引导 CTA
- 过滤空状态：无匹配结果
- 错误：请求失败可 retry

### 8.5 依赖能力

- Opportunity list API
- Search / filter params
- Archive mutation

### 8.6 验收标准

- 搜索与过滤准确
- 归档后列表即时更新
- 行点击可稳定进入详情页

## 9. 页面五：Opportunity Overview / Lead Intake

### 9.1 页面目标

承载单个 opportunity 的原始输入、基础字段与流程入口，是整个工作流的上下文中心。

### 9.2 页面布局建议

- 上方：Opportunity Header + Progress Stepper
- 下方：基础字段表单 + Raw Input 区 + Primary Actions

### 9.3 核心区块

- Opportunity Header：title、company_name、status、updated_at、owner
- Progress Stepper：Lead Intake、Lead Brief、Discovery、Proposal Draft、Follow-up
- 基础字段表单：source_type、company_name、contact_name、contact_email、requested_service、owner
- Raw Input 区：文本粘贴、PDF 上传、抽取文本预览
- Primary Actions：Save Opportunity、Generate Lead Brief

### 9.4 核心交互

- 编辑基础字段并保存
- 粘贴 raw input
- 上传 PDF 并查看抽取结果
- 满足最小条件后生成 Lead Brief

### 9.5 页面状态

- 正常：已有数据并可编辑
- 空状态：新机会无输入时展示示例提示
- 错误：PDF 抽取失败、保存失败、raw input 太短
- 文件状态：uploaded / processing / ready / failed

### 9.6 关键规则

- raw_input 不能为空，否则禁止生成 Lead Brief
- contact_email 如填写，需校验格式
- PDF 抽取失败时，用户仍可手动粘贴文本继续
- failed 状态下必须提供 retry 入口

### 9.7 依赖能力

- Opportunity detail / update API
- PDF text extraction API
- Lead Brief generation API

### 9.8 验收标准

- 用户可在该页完成从原始输入录入到触发 Lead Brief 生成
- Stepper 可正确反映当前状态
- 文件失败时可重试或改用手动录入

## 10. 页面六：Lead Brief Workspace

### 10.1 页面目标

把原始输入转成结构化的初步判断结果。

### 10.2 页面布局建议

左右双栏：

- 左侧：raw input source
- 右侧：Lead Brief structured output

### 10.3 核心区块

- Source Panel：原始文本、来源类型、更新时间
- Structured Fields Panel：client/company、contact、requested service、business context、urgency/timeline、budget signal、fit assessment、missing information、recommended next step
- Field Meta：状态标签、编辑、确认
- Action Bar：Regenerate、Save Current、Save Version、View History、Restore 到当前工作态、Copy Summary、Continue to Discovery

### 10.4 核心交互

- 字段级编辑
- 字段确认
- 整体重生成
- 保存当前工作态
- 保存版本
- 查看历史版本
- 预览并恢复历史版本

### 10.5 页面状态

- 正常：结构化字段完整展示
- 加载：生成中
- 错误：生成失败 / 输入不足
- 空状态：尚未生成时显示 CTA

### 10.6 异常处理

- 输入不足时仍可生成，但需高亮 missing information
- 重生成不得无提示覆盖已编辑内容
- Restore 不自动创建新历史版本

### 10.7 依赖能力

- Lead Brief read / generate / update API
- Version save / list / detail / restore API

### 10.8 验收标准

- 用户能区分事实、推断、缺失与待审阅信息
- 用户可在页面内完成修正、保存版本与恢复版本

## 11. 页面七：Discovery Workspace

### 11.1 页面目标

把 discovery notes / transcript 转成 proposal-ready understanding。

### 11.2 页面布局建议

左右双栏：

- 左侧：Discovery 输入
- 右侧：Discovery Intelligence 输出

### 11.3 核心区块

- Input Panel：notes / transcript paste area、optional comment、save input
- Intelligence Panel：client goals、current problems、desired outcomes、constraints、stakeholders、timeline signals、budget signals、assumptions、ambiguities、risk flags、follow-up questions
- Meta & Actions：状态标签、编辑、确认、Generate / Regenerate、Save Current、Save Version、View History、Restore 到当前工作态、Continue to Proposal Draft

### 11.4 核心交互

- 粘贴 / 编辑 discovery 内容
- 触发生成
- 对当前 Discovery Intelligence 执行整体重生成
- 字段级编辑 / 确认
- 保存当前工作态
- 保存版本
- 查看 / 恢复历史版本

### 11.5 页面状态

- 正常：有 intelligence 输出
- 加载：生成中
- 空状态：尚未输入 notes
- 错误：内容过短 / 生成失败

### 11.6 异常处理

- transcript 太短时提示结果可能不完整
- timeline / budget 缺失时显示 Not enough evidence
- Discovery 页面应提供整体重生成入口，用于基于当前 discovery 输入重新生成当前 Discovery Intelligence
- 整体重生成不得无提示覆盖用户已编辑内容
- Restore 不自动创建新历史版本，且不得静默覆盖用户已编辑内容

### 11.7 依赖能力

- Discovery input save API
- Discovery read / generate / update API
- Version save / list / detail / restore API

### 11.8 验收标准

- 输出中必须可见 ambiguities、risk flags 与 follow-up questions
- 用户可从该页直接进入 Proposal Draft 流程

## 12. 页面八：Scope Builder / Proposal Draft

### 12.1 页面目标

生成并编辑 proposal-ready draft，是 MVP 的核心价值页面。

### 12.2 页面布局建议

建议采用三段式结构：

- 顶部：Template & Rules Control Bar
- 中部：章节式 Proposal Draft 编辑区
- 侧边 / 底部：版本、导出、风险与限制提示区

### 12.3 核心区块

#### A. Template & Rules Control Bar

- current template
- current effective rules 摘要
- assumptions / exclusions preview
- tone preview
- terminology summary
- override active 状态
- opportunity override entry

#### B. Draft Sections

- Executive Summary
- Objectives
- Recommended Approach
- Deliverables
- Timeline
- Assumptions
- Exclusions
- Next Steps / CTA

#### C. Section Actions

- edit
- save current draft state
- regenerate section

#### D. Global Actions

- Generate Draft
- Save Current
- Save Version
- View History
- Restore 到当前工作态
- Copy All
- Export Text / Markdown
- Go to Follow-up

#### E. Risk / Confidence / Restriction Notice

- low confidence notice
- missing inputs notice
- rules conflict notice
- missing required sections notice
- billing restriction notice

### 12.4 核心交互

- 切换模板
- 查看 effective rules
- 打开 override panel
- 编辑当前 opportunity 局部规则覆盖
- 清除 override 并恢复 workspace 基线
- 生成 Proposal Draft
- 按章节编辑
- 章节级重生成
- 保存当前工作态
- 保存版本
- 查看 / 恢复历史版本
- 复制 / 导出

### 12.5 页面状态

- 正常：已有 draft 且可查看 effective rules
- 空状态：尚未生成时显示 Generate CTA
- 加载：生成中 / 章节重生成中 / override 保存中
- 错误：关键输入缺失 / 生成失败 / override 保存失败
- 低置信度：输入不足、规则冲突、范围不清
- 覆盖激活：override active 明确可见
- 受限状态：显示 `restriction_reason`

### 12.6 异常与保护逻辑

- 无可用 Lead Brief 或基础 Discovery 时，不允许正式生成
- 章节重生成不得无提示覆盖用户编辑
- required_sections 缺失时必须标记 Needs Review
- override 保存失败时，必须明确提示当前仍使用哪组规则
- 在计费受限状态下，若生成动作被阻断，必须展示原因而非通用错误

### 12.7 依赖能力

- Template / workspace rules read API
- Effective rules read API
- Opportunity override read / update / clear API
- Proposal Draft read / generate / update API
- Section regenerate API
- Version save / list / detail / restore API
- Export API

### 12.8 验收标准

- 输出必须包含 Assumptions 与 Exclusions
- 用户可编辑任意章节并执行章节重生成
- 用户可查看 effective rules 与 override active 状态
- 用户可保存、查看并恢复多个版本
- 页面在依赖缺失或计费受限时给出明确阻断说明

## 13. 页面九：Follow-up Workspace

### 13.1 页面目标

帮助用户在 proposal 发送后快速生成上下文化的推进文案。

### 13.2 核心区块

- Scenario Selector：same day、3-day、no response、objection handling、discovery recap + next steps
- Tone Selector：Follow-up 的显式“语气切换”在 MVP 中暂列待确认项；现阶段仅冻结 workspace 默认语气偏好与当前上下文可参与生成，不将该控件视为首发必备
- Draft Output：subject、body、CTA
- Actions：Generate、Save Current、Save Version、View History、Restore 到当前工作态、Copy Email
- Restriction / Dependency Notice

### 13.3 核心交互

- 切换场景
- 如后续冻结显式语气能力，则支持切换语气；在冻结前不将该交互视为首发必备
- 生成 Follow-up Draft
- 编辑并保存当前工作态
- 保存版本
- 查看 / 恢复历史版本
- 一键复制

### 13.4 页面状态

- 正常：可查看和编辑草稿
- 空状态：尚未生成
- 加载：生成中
- 错误：缺失 Proposal Draft 上下文 / 生成失败
- 受限：显示 billing restriction_reason

### 13.5 核心规则

- Follow-up 生成按“已有 current Proposal Draft”处理
- 无 Proposal Draft 上下文时页面可进入，但不应放开正式生成
- 输出必须包含 subject、body、CTA

### 13.6 依赖能力

- Proposal context API
- Follow-up read / generate / update API
- Version save / list / detail / restore API

### 13.7 验收标准

- 用户可生成并复制可用的 Follow-up 草稿
- subject、body、CTA 三部分完整
- 在依赖缺失或计费受限时有清晰说明

## 14. 页面十：Templates & Rules

### 14.1 页面目标

提供 workspace 基线规则配置页面。

### 14.2 页面边界

- 本页面只负责 workspace 基线规则配置
- opportunity 局部规则覆盖不在此页编辑
- opportunity 局部覆盖应在 Scope Builder 当前上下文中完成

### 14.3 核心区块

- Template Basics：default_template、template_scope
- Assumptions & Exclusions：default_assumptions、default_exclusions
- Tone & Terminology：tone_profile、preferred_terminology、banned_terminology
- Sections & Modules：section_order、required_sections、service_modules、default_cta_style
- Actions：Save Rules、可选 Reset、可选 Rule Impact Notes

### 14.4 核心交互

- 编辑规则字段
- 保存规则
- 校验冲突
- 返回 Scope Builder

### 14.5 页面状态

- 正常：显示当前 workspace 基线规则
- 空状态：显示系统默认值
- 错误：保存失败 / 配置无效 / 规则冲突

### 14.6 校验逻辑

- required_sections 至少应包含 assumptions 与 exclusions
- banned_terminology 与 preferred_terminology 重复时提示冲突
- section_order 不能为空

### 14.7 依赖能力

- Workspace rule set read / update API
- Template metadata API
- Rule validation API

### 14.8 验收标准

- 保存后的基线规则会影响 Proposal Draft 输出
- 规则冲突可被提示
- 返回 Scope Builder 时不丢失当前 opportunity 上下文

## 15. 页面十一：Billing / Trial

### 15.1 页面目标

承载试用状态、升级动作和订阅管理入口。

### 15.2 核心区块

- Current Plan Summary：plan_type、billing_status、trial_status、current_period_end
- Trial Status：days_left、trial start / end、upgrade CTA
- Billing Actions：Go to Checkout、Manage Billing
- Billing Alerts：past_due、expired、canceled
- Restriction Notes：is_generation_allowed、restriction_reason

### 15.3 核心交互

- 点击 Upgrade 进入 Stripe Checkout
- 点击 Manage Billing 跳转 Customer Portal
- 查看当前计划与状态限制说明

### 15.4 页面状态

- trial_active：显示剩余试用天数
- trial_expired：显示升级提示与限制说明，默认阻断新生成动作；regenerate / export / restore 是否受限待冻结
- paid_active：显示当前计划与账期
- past_due：显示修复支付入口与限制说明，默认阻断新生成动作；regenerate / export / restore 是否受限待冻结
- canceled / inactive：显示只读状态与升级入口，默认阻断新生成动作；regenerate / export / restore 是否受限待冻结

### 15.5 依赖能力

- Billing status API
- Checkout session API
- Portal session API

### 15.6 验收标准

- 状态展示与 webhook 同步结果一致
- 用户可顺利进入 Checkout 与 Portal
- 限制说明明确，不仅有状态名，也有动作影响解释

## 16. 页面十二：Settings

### 16.1 页面目标

承载不属于主工作流的基础设置。

### 16.2 核心区块

- Workspace Info：workspace_name、industry_type
- User Account：name、email、auth provider
- Members（极简版）：member list、role

### 16.3 核心交互

- 修改 workspace 名称
- 查看当前登录方式
- 查看成员列表

### 16.4 页面状态

- 正常：基础信息可读写
- 错误：保存失败 / 权限不足

### 16.5 依赖能力

- Workspace update API
- User profile API
- Member list API

### 16.6 验收标准

- 用户可查看并更新基础设置
- Google 登录用户可看到 auth provider 信息

## 17. 页面间跳转规则

### 17.1 主流程跳转

- Dashboard → New Opportunity → Opportunity Overview / Lead Intake
- Opportunity Overview / Lead Intake → Lead Brief Workspace
- Lead Brief Workspace → Discovery Workspace
- Discovery Workspace → Scope Builder / Proposal Draft
- Scope Builder / Proposal Draft → Follow-up Workspace

### 17.2 导航跳转

- 任意业务页可通过主导航进入 Dashboard / Opportunities / Templates & Rules / Billing / Settings
- 子流程返回时，应优先回到当前 opportunity 上下文，不强制回首页

### 17.3 规则跳转

- Scope Builder 中的 workspace rules preview 可跳到 Templates & Rules
- opportunity override 入口不应跳到独立一级页，应以 drawer / modal / side panel 在当前上下文中打开
- 清除 override 后，应立即刷新显示 workspace 基线下的 effective rules

### 17.4 保护逻辑

- 未完成 workspace setup 的用户，不可访问其他业务页
- 未登录用户不可访问业务页
- 无可用 Lead Brief / 基础 Discovery 的机会，不应直接正式生成 Proposal Draft
- 无 current Proposal Draft 的机会，不应正式生成 Follow-up

## 18. 页面级埋点建议

### 18.1 通用埋点

每页至少记录：

- `page_view`
- `page_load_failed`（如适用）
- `primary_cta_clicked`

### 18.2 关键页面埋点

Auth：

- `auth_method_selected`
- `signup_completed`
- `login_completed`

Lead Intake：

- `raw_input_saved`
- `pdf_uploaded`
- `lead_brief_generate_clicked`

Lead Brief：

- `lead_brief_generated`
- `lead_brief_saved`
- `lead_brief_version_saved`
- `lead_brief_restored`
- `field_confirmed`

Discovery：

- `discovery_saved`
- `discovery_generated`
- `discovery_version_saved`
- `discovery_restored`

Scope Builder：

- `proposal_generated`
- `section_regenerated`
- `proposal_saved`
- `proposal_version_saved`
- `proposal_restored`
- `proposal_exported`
- `proposal_copied`
- `opportunity_rule_override_updated`
- `opportunity_rule_override_cleared`

Follow-up：

- `followup_generated`
- `followup_saved`
- `followup_version_saved`
- `followup_restored`
- `followup_copied`

Billing：

- `billing_page_viewed`
- `upgrade_clicked`
- `manage_billing_clicked`

## 19. 与其他文档的关系

- 与《页面流程与信息架构说明》：本文件承接其页面树、导航与 guard 骨架。
- 与《PRD》：本文件将模块级需求落到页面区块、状态与验收层。
- 与《MVP 功能清单》：本文件将 P0 / P1 能力映射到具体页面。
- 与《API 设计》：本文件明确每个页面需要的 read / generate / update / version / restore 能力。

## 20. 已冻结决策

1. **Member 默认可见机会范围**
   - 首版按 workspace 全量数据可见处理，Dashboard 与 Opportunities 列表不引入“仅参与 / 仅分配”过滤前提。
2. **受限计费状态下的动作矩阵**
   - 工作流资源统一只读；阻断 `generate`、`regenerate`、`save current`、`save-version`、`restore`、`export`，但允许查看数据与进入 Billing / Upgrade 流程。
3. **模板推荐的页面提示方式**
   - Scope Builder 首版不增加独立“推荐模板”提示，只保留默认模板落点与手动模板选择。

## 21. 结论

ProposalFlow AI 的页面级设计必须围绕“单个 opportunity 的持续推进”来展开，而不是围绕一组分散的 AI 页面。

因此，页面设计的正确方向是：

- 一级导航少而稳定
- 子流程页面承载结构化提炼与草稿生成
- 规则层、版本、限制与异常以统一方式贯穿关键页面
- 所有页面共同服务于从原始输入到 proposal-ready draft 再到 follow-up 的主链路
