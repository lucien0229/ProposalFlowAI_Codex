# ProposalFlow AI｜MVP 功能清单 v1.0

## 1. 文档目的

本文档将 PRD 的产品要求进一步拆解为可执行的 MVP 功能清单，用于支持设计拆页、研发排期、测试准备与发布验收。

本审校版重点统一：

- MVP、P0、P1、P2 的判断标准
- 模块与页面的边界
- 重生成、版本、规则层与计费限制的正式口径
- 与页面、API 文档的一致性

## 2. 适用范围

适用于：

- 产品需求拆解
- 设计与研发任务分配
- 测试验收清单编制
- 发布最小闭环判断

## 3. 统一术语与优先级规则

### 3.1 统一术语

- **MVP**：用于验证产品价值的正式范围。
- P0：：首版必须交付的最小闭环。
- P1：：不阻断首发，但显著影响可用性、可靠性、转化或留存的增强项。
- **P2**：后置扩展能力，不进入首版验证门槛。
- **当前工作态**：当前可编辑内容。
- **历史版本**：通过 save-version 显式保存的历史快照。
- **Restore**：把历史版本写回当前工作态，不自动新增历史版本。

### 3.2 优先级判断标准

- 若缺少该能力，主流程无法跑通，则为 P0：。
- 若缺少该能力，主流程虽能跑通，但体验、留存或转化明显受损，则为 P1：。
- 若缺少该能力，对 MVP 验证不构成关键影响，则为 **P2**。

## 4. MVP 功能域总览

### 4.1 P0 功能域

P0 必须覆盖以下最小闭环：

- Authentication
- Workspace Setup
- Dashboard 基础入口
- Opportunities 列表与创建
- Opportunity Overview / Lead Intake
- Lead Brief
- Discovery Intelligence
- Scope Builder / Proposal Draft
- Follow-up Assistant
- Templates & Rules（最小可用版本）
- 保存、复制、导出、版本与版本恢复
- Billing / Trial
- 基础埋点与状态流转

### 4.2 P1 功能域

P1 主要用于增强：

- 更细粒度重生成
- 更好的 Dashboard 效率
- 更清晰的规则冲突与预览
- 更清晰的 Billing 提示与错误恢复

### 4.3 P2 功能域

P2 主要包括：

- 轻量集成
- 评论 / 协作增强
- 历史案例深度约束
- 更细角色权限
- 更多第三方登录与多 workspace 能力

## 5. 页面级功能清单

### 5.1 Page A：Auth（注册 / 登录 / 忘记密码）

页面目标：让新用户以最低摩擦进入产品。

P0：

- 邮箱注册
- 邮箱登录
- Google 登录 / 注册
- 忘记密码 / 重置密码

P1：

- 登录异常提示优化

验收要点：

- 首次登录用户可被正确引导至 Workspace Setup
- 错误状态有明确提示

### 5.2 Page B：Workspace Setup

页面目标：建立最小业务上下文。

P0：

- 创建 workspace
- 选择 `industry_type`
- 设置 `default_template`
- 设置 `default_tone_preference`

固定字段口径：

- `industry_type`：Web/Development Agency、Product/UX Agency
- `default_template`：Development Agency Template、Product / UX Agency Template、Web Delivery Proposal Template

P1：

- 首次引导文案与空状态说明

### 5.3 Page C：Dashboard

页面目标：作为工作台首页，帮助用户开始新机会或回到未完成机会。

P0：

- New Opportunity CTA
- Recent Opportunities
- 状态概览卡片
- Needs Attention 提醒
- Trial / Billing Card

P1：

- Dashboard 快捷操作
- 更好的试用转化引导

### 5.4 Page D：Opportunities List

页面目标：集中管理全部机会。

P0：

- 列表展示
- 搜索 title / company
- 按状态筛选
- 归档 / 取消归档

P1：

- 排序
- 空状态增强

### 5.5 Page E：Opportunity Overview / Lead Intake

页面目标：承载单个机会的原始信息、基础字段与主流程入口。

P0：

- Opportunity 基础信息编辑
- Raw Input 文本粘贴
- PDF 上传并抽取文本
- 自动生成标题建议
- Generate Lead Brief 入口
- 文件处理状态：uploaded / processing / ready / failed
- failed 时提供 retry 与手动粘贴继续

P1：

- 输入不足告警优化
- Opportunity Activity Summary

关键规则：

- raw input 不能为空，否则禁止生成 Lead Brief
- PDF 仅做文本抽取

### 5.6 Page F：Lead Brief Workspace

页面目标：把原始输入转成结构化机会摘要。

P0：

- 生成 Lead Brief
- 左右双栏视图
- 字段级编辑
- 状态标签展示（Confirmed / Inferred / Missing / Needs Review）
- 字段级确认
- 整体重生成
- 保存当前工作态
- 保存版本
- 查看历史版本
- Restore 历史版本到当前工作态

P1：

- 单字段重生成
- 一键复制摘要

统一口径：

- Lead Brief 在 MVP 支持整体重生成；更细粒度重生成属于 P1。

### 5.7 Page G：Discovery Workspace

页面目标：把 discovery notes / transcript 转成 proposal-ready understanding。

P0：

- Discovery 输入区
- 生成 Discovery Intelligence
- 双栏视图
- 状态标签
- 字段编辑与确认
- 保存当前工作态
- 保存版本
- 查看历史版本
- Restore 历史版本到当前工作态
- 前往 Scope Builder 入口

P1：

- 单字段或单块重生成
- 一键将 ambiguities / missing points 转为 follow-up questions

统一口径：

- Discovery 可先行进入，但 Proposal Draft 生成必须依赖可用的 Lead Brief 与基础 Discovery 信息。

### 5.8 Page H：Scope Builder / Proposal Draft

页面目标：在模板与规则约束下生成并编辑 proposal-ready draft。

P0：

- 模板选择
- 查看 current effective rules 摘要
- 查看 override active 状态
- 编辑当前 opportunity 的最小规则覆盖
- 清除 override 并恢复 workspace 基线
- 生成 Proposal Draft
- 章节级展示与编辑
- 章节级重生成
- 风险 / 低置信度提示
- 保存当前工作态
- 保存版本
- 查看历史版本
- Restore 历史版本到当前工作态
- 复制全文 / 导出文本

P1：

- 保存版本说明
- 更好的低置信度提示
- 更好的 Markdown 导出格式
- 规则冲突与影响预览增强

统一口径：

- Proposal Draft 章节级重生成属于 P0。
- required_sections 缺失时必须提示 Needs Review。
- 章节重生成不得无提示覆盖用户编辑。

### 5.9 Page I：Follow-up Workspace

页面目标：在 proposal 发送后提供上下文化 follow-up 草稿。

P0：

- 场景选择
- 生成 Follow-up Draft
- 编辑并保存当前工作态
- 保存版本
- 查看历史版本
- Restore 历史版本到当前工作态
- 一键复制

P1：

- 历史草稿查看优化
- 更强 Proposal Draft 上下文增强

待确认项：

- 显式“语气切换”是否作为首发必备交互单独提供，当前材料无法唯一裁定，暂不冻结为 P0。

统一口径：

- Follow-up 生成按“已有 current Proposal Draft”处理。
- 页面可进入，但无 Proposal Draft 上下文时不放开正式生成。
- Follow-up 的语气能力口径暂按待确认处理；在未冻结前，不将显式语气切换控件视为首发必备。

### 5.10 Page J：Templates & Rules

页面目标：提供 workspace 基线规则配置。

P0：

- 默认模板设置
- 默认 assumptions 设置
- 默认 exclusions 设置
- 默认语气偏好设置
- preferred terminology
- banned terminology
- section_order / required_sections
- service_modules
- 规则保存与持久化

P1：

- 规则冲突提示
- 模板预览
- 规则效果预览

统一边界：

- 本页只负责 workspace 基线规则。
- opportunity 局部规则覆盖必须在 Scope Builder 当前上下文中完成。

### 5.11 Page K：Billing / Trial

页面目标：展示试用状态、升级入口与订阅管理入口。

P0：

- Trial 状态展示
- Upgrade 入口
- Billing 状态展示
- Manage Billing 跳转
- 限制说明展示：`is_generation_allowed`、`restriction_reason`

P1：

- 支付失败提示与恢复入口优化
- 更清晰的升级文案与限制说明

统一状态基线：

- trial_active：允许完整使用
- trial_expired：允许查看既有数据与 Billing，默认阻断新生成动作；regenerate / export / restore 是否受限待冻结
- paid_active：允许完整使用
- past_due：允许查看历史数据、修复支付与管理订阅，默认阻断新生成动作；regenerate / export / restore 是否受限待冻结
- canceled / inactive：允许只读访问与升级入口，默认阻断新生成动作；regenerate / export / restore 是否受限待冻结

### 5.12 Page L：Settings

页面目标：承载非主工作流的基础设置。

P0：

- Workspace 基础信息修改
- 成员展示（极简版）
- 账户基础设置

P1：

- 成员邀请与移除（如首版多人使用刚需提高）

## 6. 模块级功能清单

### 6.1 M1：Authentication

P0：

- 邮箱注册 / 登录
- Google 登录 / 注册
- 重置密码

P1：

- 异常态与错误文案优化

### 6.2 M2：Workspace Context

P0：

- workspace 创建
- 默认行业、模板、语气

P1：

- onboarding 引导优化

### 6.3 M3：Opportunity Management

P0：

- 创建、编辑、列表、搜索、筛选、归档
- 机会工作流摘要

P1：

- 排序、活动摘要增强、空状态优化

### 6.4 M4：Lead Brief Engine

P0：

- 整体生成
- 字段编辑
- 状态标签
- 保存当前工作态
- 保存版本
- 查看历史版本
- Restore

P1：

- 单字段重生成
- 复制摘要

### 6.5 M5：Discovery Intelligence Engine

P0：

- 整体生成
- 字段编辑
- 状态标签
- 保存当前工作态
- 保存版本
- 查看历史版本
- Restore

P1：

- 单字段 / 单块重生成
- question actionization

### 6.6 M6：Proposal Draft Engine

P0：

- 两段式生成
- 模板约束
- effective rules 预览
- opportunity 局部规则覆盖
- 章节编辑
- 章节重生成
- 保存当前工作态
- 风险提示
- 保存版本
- 查看历史版本
- Restore
- 导出 / 复制

P1：

- 版本说明
- 低置信度展示优化
- 导出格式优化

### 6.7 M7：Follow-up Engine

P0：

- 场景选择
- 生成
- 编辑保存当前工作态
- 保存版本
- 查看历史版本
- Restore
- 复制

P1：

- 历史草稿查看优化
- Proposal Draft 上下文增强

待确认项：

- 显式“语气切换”是否作为首发必备交互单独提供，当前材料无法唯一裁定，暂不冻结为 P0

### 6.8 M8：Rules Layer

P0：

- workspace 基线规则
- opportunity 局部规则覆盖
- effective rules 预览

P1：

- 规则冲突提示
- 规则预览与影响说明

### 6.9 M9：Billing & Trial

P0：

- trial_status、billing_status、plan_type 展示
- 升级入口
- Stripe 状态同步
- 受限状态解释

P1：

- 失败恢复路径优化

### 6.10 M10：Versioning & Audit

P0：

- 四类核心资源的当前工作态保存
- 保存版本
- 查看历史版本
- Restore 到当前工作态

P1：

- 版本说明

### 6.11 M11：Analytics & Instrumentation

P0：

- 主流程关键埋点
- 状态流转记录
- 共享事件体系接入

P1：

- 更细粒度漏斗分析

## 7. P0 / P1 / P2 总表

### 7.1 P0 必做清单

P0 正式必做项：

- Auth：邮箱 / Google 登录注册、重置密码
- Workspace：创建与默认配置
- Dashboard：新建入口、最近机会、状态概览、待处理提醒、Trial 卡片
- Opportunities：列表、搜索、筛选、归档
- Lead Intake：基础字段、raw input、PDF 上传抽取、文件状态机、Lead Brief 入口
- Lead Brief：生成、编辑、状态标签、当前工作态、版本、Restore
- Discovery：生成、编辑、状态标签、当前工作态、版本、Restore
- Scope Builder：模板选择、effective rules、override、生成、章节编辑、章节重生成、风险提示、当前工作态、版本、Restore、导出复制
- Follow-up：场景、生成、当前工作态、版本、Restore、复制
- Templates & Rules：模板、assumptions、exclusions、tone、术语、section_order、required_sections、service_modules
- Billing / Trial：状态展示、升级、Manage Billing、限制解释
- Versioning：核心四类资源的版本闭环
- Analytics：关键埋点与状态流转

### 7.2 P1 推荐清单

- Dashboard 快捷操作
- Lead Brief / Discovery 更细粒度重生成
- 导出格式优化
- 规则冲突提示与模板预览
- Billing 异常状态体验优化
- 更好的错误提示与恢复路径

### 7.3 P2 后置清单

- 轻集成
- 协作评论
- 历史案例深度约束
- 多 workspace
- 更多第三方登录
- 自动 follow-up 提醒或发送

## 8. 关键依赖关系

### 8.1 主流程依赖

`Opportunity / Lead Intake → Lead Brief → Discovery Intelligence → Proposal Draft → Follow-up`

统一说明：

- 没有 Opportunity 与 raw input，Lead Brief 无法生成
- 没有可用 Lead Brief 与基础 Discovery，Proposal Draft 不允许正式生成
- 没有 current Proposal Draft，Follow-up 不放开正式生成

### 8.2 规则层依赖

Templates & Rules 是 Proposal Draft 输出可控性的关键依赖。若缺失该层，产品会退化为通用文本生成器。

### 8.3 版本依赖

版本系统依赖每个工作区页面都区分：

- 当前工作态
- 历史版本
- Restore 行为

### 8.4 Billing 依赖

Billing / Trial 依赖：

- Auth 与 workspace
- Stripe Checkout / Portal / Webhooks
- 服务端限制状态返回

## 9. 与其他文档的关系

- 与《PRD》：本文件是 PRD 的执行化拆解。
- 与《页面流程与信息架构说明》：本文件定义页面要实现哪些步骤与守卫。
- 与《页面清单与页面级需求》：本文件为各页面区块和交互提供功能边界。
- 与《API 设计》：本文件要求 API 支撑当前工作态、版本、Restore、规则层和状态限制。

## 10. 已冻结决策

1. **模板自动推荐规则**
   - 首版不进入复杂推荐，仅保留默认映射与手动切换。
2. **Member 可见范围**
   - `member` 默认可见当前 workspace 下全部 opportunities。
3. **受限计费状态下的具体动作清单**
   - 首版统一采用工作流只读模式：阻断 `generate`、`regenerate`、`save current`、`save-version`、`restore`、`export`，但允许查看历史数据与进入 Billing / Upgrade 流程。

## 11. 结论

ProposalFlow AI 的 MVP 功能清单必须围绕一条主链路服务：

**自助试用 → 录入原始输入 → 结构化提炼 → 模板与规则约束 → Proposal Draft → Follow-up → 试用转化**。

所有不直接强化这条主链路的能力，都应后置到 P1 或 P2。
