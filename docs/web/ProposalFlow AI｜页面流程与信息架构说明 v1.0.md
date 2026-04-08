# ProposalFlow AI｜页面流程与信息架构说明 v1.0

## 1. 文档目的

本文档从系统结构与用户流转两个角度，定义 ProposalFlow AI MVP 的页面树、导航层级、主路径、异常路径与路由保护逻辑。

本审校版重点统一：

- 页面必须围绕 opportunity 组织，而不是围绕一组孤立工具组织。
- 页面模型需与 API 资源模型保持一致。
- Lead Brief、Discovery、Proposal Draft、Follow-up 的步骤依赖、版本语义与计费限制展示必须贯穿整个页面结构。

## 2. 适用范围

适用于：

- 信息架构确认
- 原型绘制与站点地图设计
- 前端路由设计与状态容器设计
- 页面守卫、限制提示与异常流程梳理

## 3. 核心定义与术语

- **Global Navigation**：登录后始终稳定可见的一级入口。
- **Opportunity Context**：围绕单个 opportunity 的业务上下文容器。
- **Stepper / Context Navigation**：在 opportunity 内部指示当前步骤与下一步的二级导航。
- **Current Resource**：当前工作态。
- **Version History**：显式保存版本形成的历史快照。
- **Restore 到当前工作态**：将历史版本写回当前工作态。
- **Route Guard**：用于控制登录态、workspace 完整度、机会存在性、步骤依赖与计费限制的页面保护逻辑。

## 4. 设计原则

### 4.1 Opportunity-centered

页面结构必须围绕单个 opportunity 组织。原因是：

- 用户的真实任务是推进某个机会，而不是单独打开某个 AI 工具。
- Lead Brief、Discovery、Proposal Draft、Follow-up 都天然依附于同一机会。
- 在机会容器内组织页面，才能稳定承载 stepper、header、状态和版本行为。

### 4.2 Shallow Navigation

一级导航应尽量少，只保留稳定入口：

- Dashboard
- Opportunities
- Templates & Rules
- Billing
- Settings

Lead Brief、Discovery、Proposal Draft、Follow-up 不应成为一级导航，而应作为 opportunity 的子流程页面。

### 4.3 Guided Progression

用户在任一机会中都应清楚知道：

- 当前在第几步
- 下一步是什么
- 哪些步骤缺少前置条件
- 当前限制来自输入不足、步骤依赖，还是计费状态

### 4.4 Draft Safety

所有生成页都必须支持：

- 保存当前工作态
- 保存版本
- 查看历史版本
- Restore 到当前工作态
- 重生成前的覆盖保护
- 风险和限制提示

## 5. 顶层页面树

### 5.1 未登录层

- `/auth/sign-in`
- `/auth/sign-up`
- `/auth/forgot-password`
- `/auth/google-callback`

### 5.2 首次初始化层

- `/setup/workspace`

### 5.3 已登录客户侧产品层

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

### 5.4 未来独立运营管理端扩展位

- `/admin/*`

说明：admin 路由域应独立，不进入客户侧主导航，也不复用客户侧 workspace guard 或 opportunity-centered 结构。

## 6. 导航结构

### 6.1 主导航（Global Navigation）

登录后稳定显示的一级导航统一为：

- Dashboard
- Opportunities
- Templates & Rules
- Billing
- Settings

要求：

- 在所有业务页面保持一致
- 可高亮当前一级入口
- 不直接承载机会子步骤

### 6.2 Opportunity 内导航（Context Navigation）

在 `/opportunities/:opportunityId/*` 下统一提供二级导航或 stepper：

- Overview / Lead Intake
- Lead Brief
- Discovery
- Proposal Draft
- Follow-up

要求：

- 高亮当前步骤
- 展示 `Not started / In progress / Completed / Needs attention` 等状态
- 清晰反映步骤依赖与受限原因

### 6.3 辅助入口

- Dashboard 可跳到某个 opportunity 的当前步骤
- Scope Builder 可跳转到 Templates & Rules 配置 workspace 基线规则
- Billing 可返回 Dashboard
- Templates & Rules 返回 Scope Builder 时不应丢失当前 opportunity 上下文

## 7. 主流程（Happy Path）

### 7.1 首次试用主流程

1. 用户进入 Auth 页面
2. 通过 Google 或邮箱完成登录 / 注册
3. 若无 workspace，则进入 Workspace Setup
4. 完成 setup 后进入 Dashboard
5. 点击 New Opportunity
6. 进入 Opportunity Overview / Lead Intake
7. 录入原始输入或上传 PDF
8. 生成 Lead Brief
9. 审核并修正 Lead Brief
10. 进入 Discovery 页面并录入 notes / transcript
11. 生成 Discovery Intelligence
12. 审核并修正 Discovery Intelligence
13. 进入 Proposal Draft 页面
14. 选择模板并基于 effective rules 生成 Proposal Draft
15. 编辑、保存当前工作态、保存版本、导出或复制
16. 进入 Follow-up 页面生成上下文化 follow-up 草稿
17. 返回 Dashboard 或 Opportunities 继续管理机会

### 7.2 日常使用主流程

1. 登录后进入 Dashboard
2. 选择 Recent Opportunities 或在 Opportunities 列表中进入某机会
3. 回到该机会的当前步骤
4. 继续编辑、生成、保存版本或恢复版本
5. 导出 / 复制结果
6. 返回机会列表或 Dashboard

## 8. 辅助流程

### 8.1 Workspace 基线规则调整流程

1. 用户在 Proposal Draft 中发现输出边界不理想
2. 点击进入 Templates & Rules
3. 调整 workspace 基线规则
4. 保存后返回当前 opportunity 的 Proposal Draft
5. 基于新的 effective rules 重新生成章节或整体草稿

### 8.2 Opportunity 局部覆盖流程

1. 用户在 Proposal Draft 中发现当前机会需要局部规则修正
2. 在当前 Scope Builder 页面打开 override panel
3. 修改当前 opportunity 的最小规则覆盖
4. 页面刷新 current effective rules 摘要
5. 用户继续章节级或整体生成
6. 如清除 override，则立即恢复为 workspace 基线规则

### 8.3 版本回看与恢复流程

适用于 Lead Brief、Discovery、Proposal Draft、Follow-up：
1. 点击 View History
2. 查看版本列表
3. 选择 Preview Version
4. 按需要执行 Restore 到当前工作态
5. 若需保留恢复前内容，应先 Save Version

### 8.4 试用转化流程

1. 用户在 Dashboard / Billing 看到 trial 状态
2. 点击 Upgrade
3. 进入 Stripe Checkout
4. 支付完成后返回产品
5. Billing 状态更新为 paid_active
6. Billing 页面展示 plan、period 与 Manage Billing 入口

## 9. 异常流程

### 9.1 未登录访问受保护页面

- 用户访问 `/dashboard` 或任一业务页
- 系统检测无登录态
- 跳转 `/auth/sign-in`
- 尽量保留 `return_url`

### 9.2 未完成 workspace setup 访问业务页

- 用户已登录，但 workspace 未创建或未完成初始化
- 系统统一跳转 `/setup/workspace`

### 9.3 未完成前置步骤直接访问 Proposal Draft

- 用户访问 `/opportunities/:id/proposal-draft`
- 系统检测缺少可用 Lead Brief 或基础 Discovery
- 页面显示阻断状态与补齐指引
- 不放开正式生成按钮

### 9.4 无 Proposal Draft 直接尝试生成 Follow-up

- 用户进入 `/opportunities/:id/follow-up`
- 页面可展示场景与说明，但若缺少 current Proposal Draft，应显示依赖提示并阻断正式生成

### 9.5 PDF 上传失败

- 文件状态进入 `failed`
- 页面显示失败提示
- 用户可 Retry
- 用户也可改为手动粘贴文本继续

### 9.6 AI 生成失败

适用于 Lead Brief、Discovery、Proposal Draft、Follow-up：
- 页面显示失败提示与 Retry
- 已保存的当前工作态与历史版本不得丢失
- Discovery 页面中的整体重生成入口应继续可见，但在存在手动编辑内容时仍需先给出覆盖提示

### 9.7 计费状态受限

- 当 `trial_expired / past_due / canceled / inactive` 时
- 页面必须展示 `restriction_reason`
- 对受限动作给出明确解释，而不是只返回通用报错

## 10. Route Guards

### 10.1 Guard A：Auth Guard

适用页面：
- `/dashboard`
- `/opportunities/*`
- `/templates-rules`
- `/billing`
- `/settings`

规则：未登录则跳转 `/auth/sign-in`。

### 10.2 Guard B：Workspace Guard

适用页面：所有登录后的客户侧业务页。

规则：若 workspace 未完成，则跳转 `/setup/workspace`。

### 10.3 Guard C：Opportunity Existence Guard

适用页面：`/opportunities/:opportunityId/*`

规则：若 opportunity 不存在，展示 Not Found 或引导返回列表。

### 10.4 Guard D：Step Dependency Guard

统一规则：
- Discovery：可进入，但应提示推荐先完成 Lead Brief
- Proposal Draft：必须要求可用 Lead Brief 与基础 Discovery
- Follow-up：按已有 current Proposal Draft 处理，无则阻断正式生成

### 10.5 Guard E：Billing Restriction Guard

适用页面：所有涉及生成动作的页面。

统一规则：
- `trial_active` / `paid_active`：允许完整使用
- `trial_expired`：可查看，默认阻断新生成动作；`regenerate` / `export` / `restore` 是否受限待冻结
- `past_due`：可查看、修复支付、管理订阅，默认阻断新生成动作；`regenerate` / `export` / `restore` 是否受限待冻结
- `canceled / inactive`：只读查看与升级入口，默认阻断新生成动作；`regenerate` / `export` / `restore` 是否受限待冻结

## 11. Opportunity 上下文结构

### 11.1 Context Container 必备信息

在 `/opportunities/:id/*` 下建议统一加载：
- opportunity 基础信息
- 当前 status
- 当前 step
- 最近更新时间
- 是否存在 current Lead Brief
- 是否存在 current Discovery
- 是否存在 current Proposal Draft
- 是否存在 current Follow-up Draft
- 当前 billing restriction 信息（如适用）

### 11.2 公共 Header

建议在所有机会子页复用统一 Header：
- title
- company_name
- status badge
- updated_at
- owner
- quick actions（如返回列表、保存当前工作态）

### 11.3 公共 Stepper

建议步骤统一为：
- Lead Intake
- Lead Brief
- Discovery
- Proposal Draft
- Follow-up

## 12. 信息架构分层

### 12.1 分层结构

1. **Authentication Layer**：登录、注册、找回密码、OAuth
2. **Workspace Setup Layer**：workspace 创建与默认配置
3. **Global Product Layer**：Dashboard、Opportunities、Templates & Rules、Billing、Settings
4. **Opportunity Workflow Layer**：Overview、Lead Brief、Discovery、Proposal Draft、Follow-up
5. **Support System Layer**：Versioning、Billing restrictions、Analytics、Error handling

### 12.2 分层收益

- 认证逻辑与业务逻辑分离
- 全局稳定入口与机会子流程职责清晰
- 版本、限制、异常可以作为横切能力统一接入

## 13. 前端状态管理建议

### 13.1 全局状态

建议统一管理：
- current_user
- auth_status
- current_workspace
- trial_status
- billing_status
- is_generation_allowed
- restriction_reason

### 13.2 Opportunity 容器状态

建议集中管理：
- opportunity detail
- lead brief latest state
- discovery latest state
- proposal draft latest state
- follow-up latest state
- workflow completion status
- current effective rules summary
- override active 状态

### 13.3 页面局部状态

建议各工作区页面管理：
- form state
- loading state
- save state
- regenerate state
- version history modal / drawer state
- restore confirmation state
- error state

## 14. 与 API 资源模型的关系

页面结构与 API 资源结构应一一对应：
- Opportunity 页面容器对应 `/opportunities/{id}`
- Lead Brief 页面对应 `/opportunities/{id}/lead-brief`
- Discovery 页面对应 `/opportunities/{id}/discovery`
- Proposal Draft 页面对应 `/opportunities/{id}/proposal-draft`
- Follow-up 页面对应 `/opportunities/{id}/follow-up`
- 规则面板对应 `/opportunities/{id}/rules/effective` 与 `/rules/override`

版本相关页面能力应对应：
- `GET versions`
- `GET version detail`
- `POST restore`

## 15. 与其他文档的关系

- 与《产品方案升级版》：承接 opportunity-centered、draft-first、rule-constrained 的总原则。
- 与《PRD》：把主流程、依赖、版本与计费口径落到页面层。
- 与《MVP 功能清单》：把 P0 / P1 的能力映射到导航和页面流转。
- 与《页面清单与页面级需求》：为每一页的具体区块和交互提供骨架。
- 与《API 设计》：确保页面路由、守卫和接口资源模型一致。

## 16. 已冻结决策

1. **受限计费状态下的动作矩阵**
   - `trial_expired`、`past_due`、`canceled`、`inactive` 下统一采用工作流只读模式。
   - 页面允许查看历史数据与进入 Billing / Upgrade / Manage Billing，但阻断 `generate`、`regenerate`、`save current`、`save-version`、`restore`、`export`。
2. **Member 默认可见范围对导航的影响**
   - 首版不收紧到“仅参与 / 仅分配可见”，因此 Dashboard 与 Opportunities 默认按 workspace 全量数据设计，不额外分裂导航或默认视图。
3. **模板推荐入口的交互形态**
   - 首版不增加单独“推荐模板”提示，页面只保留默认模板落点与手动模板选择。

## 17. 结论

ProposalFlow AI 的页面流程与信息架构必须服务于同一个目标：

**让用户围绕单个 opportunity，连续、清晰、低风险地从原始输入推进到 proposal-ready draft 与 follow-up。**

因此，正确的信息架构不是“多个 AI 工具页的堆叠”，而是：
- 全局导航只保留稳定入口
- 机会子流程承载生成与编辑工作
- 版本、限制、异常与规则层作为横切能力贯穿全流程