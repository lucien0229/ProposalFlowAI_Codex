# ProposalFlow AI｜产品方案升级版（海外市场重构版）

## 1. 文档目的

本文档用于在现有材料基础上，重新明确 ProposalFlow AI 的市场切入点、产品边界与验证路径，为后续 PRD、功能清单、页面设计与 API 设计提供统一的产品总口径。

本审校版遵循两条原则：

- 忠于原始文档的核心判断，不引入无依据的新产品方向。
- 统一跨文档已明确的口径；仍无法唯一裁定的内容，保留为待确认项。

## 2. 适用范围

适用于以下工作：

- 产品定位与对外叙事
- MVP 范围判断
- ICP、GTM 与商业化假设统一
- 后续 PRD、页面、API 与数据模型设计的总约束

不直接替代详细 PRD、页面需求或 API 契约文档。

## 3. 核心定义与术语

### 3.1 产品定位

**ProposalFlow AI** 是一款面向小型服务型团队的 **AI pre-proposal workflow copilot**，帮助团队把零散的售前输入转化为结构化、可复核、可编辑的 **proposal-ready draft**。

### 3.2 关键术语

- **Opportunity**：单个售前机会，是系统的主业务容器。
- **Lead Intake**：录入原始线索、brief、邮件、RFP、PDF 或手动信息的阶段。
- **Lead Brief**：对原始输入进行第一轮结构化提炼，输出可判断、可跟进的机会摘要。
- **Discovery Intelligence**：对 discovery notes / transcript 的结构化理解，用于沉淀目标、约束、风险和待追问项。
- **Proposal Draft / Scope Builder**：基于结构化输入、模板与规则生成的 proposal-ready draft 工作区。
- **Follow-up Draft**：基于当前 Proposal Draft 上下文生成的后续沟通草稿。
- **Workspace 基线规则**：workspace 级模板、术语、语气、章节与 assumptions / exclusions 等默认约束。
- **Opportunity 局部规则覆盖**：只对当前机会生效的最小规则覆盖。
- **Effective Rules**：模板定义、workspace 基线规则与 opportunity 局部覆盖合成后的实际生效规则。
- **当前工作态**：当前可编辑版本，不等同于历史版本。
- **历史版本**：用户显式执行“保存版本”后形成的历史快照。

## 4. 产品定义与边界

### 4.1 一句话定位

ProposalFlow AI 不是通用 proposal 软件，而是帮助小型服务团队把 proposal 之前最容易混乱、最依赖经验的售前范围定义过程结构化的工作流产品。

### 4.2 产品本质

产品核心价值不在于“自动写出一份漂亮 proposal”，而在于：

- 更快理解线索
- 更稳沉淀 discovery 信息
- 更少遗漏 deliverables、assumptions、exclusions、timeline 等关键边界
- 更快形成可审核的 proposal-ready draft
- 更持续推进 follow-up

### 4.3 明确不做

MVP 不将自身定义为以下产品：

- 传统 proposal / e-sign / payment 平台
- 完整 CRM
- 自动报价引擎
- 项目管理系统
- 输入一句话直接生成最终商务文件的黑盒工具

### 4.4 风险边界

系统输出始终是 **draft**，不是最终法律或商务承诺。所有关键内容必须允许用户：

- 查看来源与上下文
- 编辑与覆盖
- 保存当前工作态
- 显式保存历史版本
- 在重生成前获得覆盖提示

## 5. 目标用户与切入策略

### 5.1 统一 ICP

MVP 第一阶段统一聚焦：

- 3–20 人的 web / product / development agency
- 提供网站开发、产品设计、MVP 开发、数字产品咨询、技术交付等服务
- 单项目通常需要 discovery、scope 定义与阶段性交付说明
- proposal 质量会直接影响成交率与交付风险

### 5.2 为什么选择该 ICP

这类团队通常具备以下共同特征：

- 售前流程不够规范，但 scope 风险高
- 创始人或核心负责人深度参与售前，时间稀缺
- 需要控制边界，而不是只追求展示效果
- 对 assumptions、exclusions、timeline、deliverables 的准确性更敏感

### 5.3 MVP 不优先覆盖对象

- 仅需简单报价单的自由职业者
- 主要卖标准化套餐、很少做 discovery 的服务商
- 依赖复杂采购、法务和审批的大企业销售团队
- 以签署、支付、展示效果为首要诉求的用户

## 6. 统一工作流主线

ProposalFlow AI 的核心工作流统一为：

1. 创建 Opportunity
2. 录入 Lead Intake 原始输入
3. 生成并修正 Lead Brief
4. 导入 discovery notes / transcript
5. 生成并修正 Discovery Intelligence
6. 在 Scope Builder 中按模板与规则生成 Proposal Draft
7. 编辑、保存版本、复制或导出 Proposal Draft
8. 基于当前 Proposal Draft 生成 Follow-up Draft
9. 将输出用于正式 proposal、邮件或外部系统

统一约束：

- Lead Brief 是推荐先完成的第一轮结构化提炼步骤。
- Discovery 也是推荐前置步骤。
- **Proposal Draft 生成必须依赖可用的 Lead Brief 与基础 Discovery 信息。**
- **Follow-up Draft 生成在 MVP 中按“已有 current Proposal Draft”处理。页面可进入，但无 Proposal Draft 上下文时不应放开正式生成。**

## 7. 统一的 MVP / P0 / P1 范围口径

### 7.1 MVP 范围

MVP 是对“提案前工作流”是否成立的产品验证，不是完整 proposal 生命周期平台。统一包含以下核心域：

- Workspace 与基础账户体系
- Opportunity / Lead Intake
- Lead Brief
- Discovery Intelligence
- Scope Builder / Proposal Draft
- Follow-up Assistant
- 基础 Templates & Rules（含 opportunity 局部覆盖）
- 保存、复制、导出、版本记录
- Billing / Trial

### 7.2 P0 定义

P0 是首版必须交付的最小闭环，用于跑通自助试用与核心工作流。P0 统一以“主流程能否连续完成”为判断标准。

### 7.3 P1 定义

P1 是不影响主流程闭环、但会显著影响可用性、可靠性、转化或留存的增强项，例如：

- 更细粒度重生成
- 更好的 Dashboard 可操作性
- 更完整的规则预览与冲突提示
- 更优化的导出和计费提示

### 7.4 统一结论

- **MVP ≠ P0**：MVP 是验证范围，P0 是首版必须交付的最小闭环。
- **P1 属于 MVP 后续增强，不应阻断首发。**
- **P2 属于后置扩展，不进入首版验证门槛。**

## 8. 统一的重生成能力边界

### 8.1 MVP 已确定能力

MVP 对重生成能力的统一口径如下：

- Lead Brief：支持整体重生成；字段级更细粒度重生成归入 P1。
- Discovery Intelligence：支持整体重生成；字段级或单块重生成归入 P1。
- Proposal Draft：至少支持章节级重生成，且该能力属于 P0。
- Follow-up Draft：支持按场景重新生成当前草稿；显式“语气切换”是否作为首发必备交互，现阶段保留为待确认项。

### 8.2 统一保护规则

所有重生成动作必须遵守：

- 不得无提示覆盖用户已编辑内容。
- generate / regenerate 默认刷新当前工作态，不自动创建历史版本。
- 若需要保留恢复前内容，用户应先显式保存版本。

## 9. 行业类型与模板映射口径

### 9.1 已统一口径

MVP 明确支持的 workspace 行业类型为：

- Web/Development Agency
- Product/UX Agency

MVP 明确提供的预设模板为：

- Development Agency Template
- Product / UX Agency Template
- Web Delivery Proposal Template

### 9.2 当前可执行映射

在现有材料下，统一采用以下可执行映射：

- `Web/Development Agency` 默认对应 `Development Agency Template`
- `Product/UX Agency` 默认对应 `Product / UX Agency Template`
- `Web Delivery Proposal Template` 作为与网站交付场景强相关的补充模板，可在 Scope Builder 中按具体机会选择

### 9.3 不擅自拍板的部分

原始材料没有给出“行业类型 → requested_service → template_key”的唯一自动映射算法，因此不在本阶段固化自动推荐规则，只保留默认映射与手动切换能力。

## 10. 页面模型与 API 资源模型关系

### 10.1 页面模型

客户侧产品统一采用 **opportunity-centered** 结构：

- 全局稳定入口：Dashboard、Opportunities、Templates & Rules、Billing、Settings
- 机会内子流程：Overview / Lead Intake、Lead Brief、Discovery、Proposal Draft、Follow-up

### 10.2 API 资源模型

API 统一采用以 Opportunity 为容器的子资源设计：

- `/opportunities/{id}`
- `/opportunities/{id}/lead-brief`
- `/opportunities/{id}/discovery`
- `/opportunities/{id}/proposal-draft`
- `/opportunities/{id}/follow-up`
- `/opportunities/{id}/rules/effective`
- `/opportunities/{id}/rules/override`

### 10.3 统一关系

页面中的“一个机会，多步骤子页”与 API 中“一个 opportunity，多子资源”是同一业务模型在 UI 与接口层的两种表达。由此统一以下原则：

- 页面推进不脱离当前 opportunity 上下文
- 权限、状态与版本都绑定到 opportunity
- current resource 与历史版本成对建模

## 11. Owner / Member 的 MVP 语义

### 11.1 已统一语义

MVP 采用极简租户角色：

- **Owner**：workspace 管理角色，可管理 workspace 设置、模板与规则，并查看 workspace 数据。
- **Member**：业务协作角色，可创建与编辑机会，以及生成和编辑草稿。

### 11.2 与内部角色的边界

Owner / Member 只属于客户侧 workspace 角色；未来 internal admin / analyst 属于独立平台内部角色体系，不混用同一语义。

### 11.3 MVP 约束

现有材料已明确：

- workspace_members 只承载租户角色
- internal role 独立建模
- web 与 admin 会话必须分离

## 12. Follow-up 的产品定位

Follow-up Assistant 在 MVP 中的定位不是营销自动化，而是 proposal 发送后的轻量上下文化沟通辅助。

优先支持的场景统一为：

- proposal sent same day follow-up
- 3-day follow-up
- no response reminder
- objection handling
- discovery recap + next steps

统一规则：

- 输出必须包含 subject、body、CTA
- CTA 应明确
- 不输出高压、不合 B2B 礼仪的措辞
- 尽可能引用当前 Proposal Draft 上下文

## 13. 商业化与试用口径

### 13.1 统一付费基线

MVP 正式基线采用：

- 免费自助试用
- workspace 级收费
- Stripe 作为支付基础设施
- 首版一个正式付费计划 + 免费试用
- 首版仅支持 USD

### 13.2 统一访问限制原则

现有文档已收敛出的统一基线：

- trial_active：允许完整使用主链路
- trial_expired：允许查看既有数据与 Billing，默认阻断新生成动作；regenerate / export / restore 是否受限待冻结
- paid_active：允许完整使用
- past_due：允许查看历史数据、管理订阅与修复支付，默认阻断新生成动作；regenerate / export / restore 是否受限待冻结
- canceled / inactive：允许只读查看与升级入口，默认阻断新生成动作；regenerate / export / restore 是否受限待冻结

## 14. 与其他文档的关系

- 与《PRD》：本文件提供产品定位、边界与优先级的总口径。
- 与《MVP 功能清单》：本文件决定什么进入 MVP / P0 / P1。
- 与《页面流程与信息架构说明》：本文件决定为何以 opportunity 为页面容器。
- 与《页面清单与页面级需求》：本文件决定页面设计应服务的主流程和风险控制原则。
- 与《API 设计》：本文件决定 Opportunity-centered 的 API 资源边界、规则层与版本语义。

## 15. 已冻结决策

1. **模板推荐策略**
   - 首版不引入复杂自动推荐算法。
   - 当前只冻结 `industry_type → 默认模板` 的基础映射，以及用户手动选择 / 切换模板能力。
2. **Member 的默认数据可见范围**
   - MVP 采用最小复杂度协作模型，`owner` 与 `member` 默认都可查看当前 workspace 下的全部 opportunities。
3. **受限计费状态下的动作矩阵**
   - 当 `trial_expired`、`past_due`、`canceled`、`inactive` 时，工作流资源统一进入只读模式。
   - 允许查看历史数据与进入 Billing / Upgrade / Manage Billing。
   - 正式阻断 `generate`、`regenerate`、`save current`、`save-version`、`restore`、`export`。

## 16. 结论

ProposalFlow AI 的正确方向不是做通用 proposal 软件，而是以小型 web / product / development agency 为切入口，把 proposal 之前的售前理解、范围定义与低风险起草流程做成一个可复核、可编辑、可约束的工作流产品。

当前统一结论可以支撑后续文档全部收敛到同一主线：

- 以 opportunity 为业务容器
- 以结构化提炼为生成前提
- 以 draft-first、rule-constrained 为边界
- 以自助试用验证 PMF
- 以 workspace 基线规则与 opportunity 局部覆盖控制输出质量
