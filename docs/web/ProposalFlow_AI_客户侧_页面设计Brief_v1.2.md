# ProposalFlow AI｜客户侧页面设计 Brief v1.2
> Pencil 专用 / Customer-facing Product / Design-to-Build Brief

## 文档信息

- **文档名称**：ProposalFlow AI｜客户侧页面设计 Brief
- **版本**：v1.2
- **适用对象**：Pencil 设计生成、产品审核、Codex 开发对照
- **产品范围**：MVP（Customer-facing Web Product）
- **产品定位**：AI pre-proposal workflow copilot
- **设计目标**：建立稳定的“售前工作流控制台”气质，而不是传统 proposal 展示工具气质
- **默认语言**：English-first（本文档中文描述，界面文案默认按英文产品设计）
- **默认平台**：Web first；优先桌面端与 laptop 宽度体验，同时保持基础响应式可用
- **设计阶段定位**：本 Brief 不是重新定义产品，而是把已冻结的客户侧页面结构、流程、状态与约束翻译成可直接执行的页面设计输入

---

## Design Sync Note（v1.2）

本次版本在 v1.1 基础上，结合最终产品文档再次做交叉校对与收束，重点优化以下问题：

- 把设计约束从“方向正确”进一步收紧为 **可直接执行的冻结设计条款**
- 对齐产品 / 页面 / API 文档中已经冻结的事实：**机会中心化、规则层边界、版本语义、受限动作矩阵、workspace 级可见范围**
- 补强 **resource contract、workflow dependency、billing restriction explanation、file state** 的统一视觉落点
- 收紧 Billing / Templates & Rules / Settings / Dashboard 等全局页的边界，减少 Pencil 自由扩写空间
- 明确 Proposal Draft 页的非目标：**不做 e-sign、报价引擎、支付回款、正式签署文档体验**

---

## 1. 使用说明

Pencil 在使用本 Brief 时，不需要重新推导业务逻辑，也不要扩写未冻结需求。重点输出以下结果：

- 页面布局方案
- 页面间视觉层级与导航关系
- 核心模块排布
- 关键状态样式
- 主 CTA 强度
- 横切能力的统一落点（版本、限制、异常、规则层、步骤依赖）
- 可复用组件的命名、边界与变体建议

Pencil 设计时应始终围绕以下事实展开：

1. 这是一个 **AI pre-proposal workflow copilot**，不是通用 proposal 平台。
2. 页面必须围绕 **单个 opportunity** 组织，而不是围绕一组分散 AI 工具组织。
3. 产品价值不在“直接写出漂亮 proposal”，而在 **更快理解输入、更稳收敛范围、更快形成 proposal-ready draft**。
4. 所有核心输出都属于 **draft**，必须支持编辑、保存当前工作态、保存版本、查看历史版本、恢复版本。
5. 规则层、限制状态、低置信度、缺失信息，不是边角提示，而是页面主结构的一部分。
6. 页面应该帮助用户做 **scope judgement**，而不是只做“AI 帮我写”。

---

## 1.1 跨文档冻结事实（设计时必须视为已定）

以下内容已在产品、页面、MVP、API 文档中冻结；设计稿不得改写或弱化：

1. **产品定位**：ProposalFlow AI 是 **AI pre-proposal workflow copilot**，不是通用 proposal 平台，也不是 e-sign / payment / CRM 产品。
2. **主流程**：`Opportunity / Lead Intake → Lead Brief → Discovery Intelligence → Proposal Draft → Follow-up`。
3. **页面模型**：客户侧正式一级页面为 12 个，且 Lead Brief / Discovery / Proposal Draft / Follow-up 都必须作为 **opportunity 子流程页面** 进入。
4. **资源模型**：页面结构需与 API 资源结构一一对应，不得由视觉稿重新发明新的资源边界。
5. **规则层边界**：`Templates & Rules` 只承载 **workspace 基线规则**；opportunity 局部覆盖只应留在 Proposal Draft 当前上下文中，以 panel / drawer / modal 进入。
6. **版本语义**：所有核心工作区页面都要区分 **当前工作态、历史版本、Restore 到当前工作态**。
7. **受限动作矩阵**：在 `trial_expired / past_due / canceled / inactive` 下，统一进入 **工作流只读模式**，阻断 `generate`、`regenerate`、`save current`、`save-version`、`restore`、`export`，但允许查看历史数据与进入 Billing / Upgrade / Manage Billing。
8. **模板推荐边界**：首版不做复杂自动推荐，只保留 `industry_type → 默认模板` 与手动切换。
9. **成员可见范围**：首版 `owner / member` 默认都可查看当前 workspace 下的全部 opportunities，不在 Dashboard / Opportunities 中引入“仅参与可见”前提。

---

## 2. 全局设计原则

### 2.1 Opportunity-centered，不做工具堆叠
用户真实任务是推进某个售前机会，而不是依次打开几个 AI 页面。因此 Lead Intake、Lead Brief、Discovery、Proposal Draft、Follow-up 必须在统一的机会容器下被感知为连续流程。

### 2.2 Structured-first，不做黑盒生成器气质
页面要先强调结构化理解与可审阅性，再强调文本生成。用户应能看见来源、字段状态、缺失项、假设项、风险项，而不是只看一大段结果文本。

### 2.3 Draft-first，不做最终承诺感
所有视觉语言都应传达“可编辑、可审阅、可恢复、可继续迭代”的草稿气质。不要让页面看起来像最终合同、最终报价或正式签署文件。

### 2.4 Guided progression，不让用户迷路
用户必须随时清楚：
- 当前在哪一步
- 下一步是什么
- 哪些前置条件还不完整
- 当前限制来自输入不足、步骤依赖，还是计费状态

### 2.5 Rule-constrained，不做泛写作工具
Template、assumptions、exclusions、terminology、section order、effective rules、override active 都必须在 Proposal Draft 体验中明确可见，而不是隐藏在设置角落。

### 2.6 Evidence-aware，不做“无来源 AI 结论”
Lead Brief 和 Discovery 页面中的结构化结论应尽量能让用户感知其来自哪些输入、哪些是明确确认、哪些是推断，哪些仍需人工判断。

### 2.7 Professional B2B，不做营销 SaaS 首页气质
面向 3–20 人 web / product / development agency。视觉应专业、克制、可信、偏工作流与编辑器体验，不要娱乐化，不要内容社区化，不要聊天机器人化。

### 2.8 English-first，不做中文短词布局
标题、字段、按钮、错误提示、状态说明均应预留真实英文长度。避免只适合中文短文本的密集布局。

### 2.9 Explain the risk，不要只提示结果
当页面阻断、降级、低置信度、覆盖风险、规则冲突、计费受限时，必须解释 **为什么**，而不是只显示技术错误或状态名。

### 2.10 Contract-first，不让页面脱离资源边界
设计稿中的页面、模块、主动作与辅助动作，都应能回指到稳定的资源模型与动作语义：`read / generate / update / save-version / list versions / restore / retry / checkout / portal`。不要为了视觉稿便利，新增文档中不存在的产品面。

---

## 3. 设计系统约束（给 Pencil）

### 3.1 视觉原型
ProposalFlow 的视觉原型更接近：
- workflow console
- structured editor
- review workspace

而不是：
- proposal showroom
- PDF viewer
- chat app
- CRM data grid

### 3.2 色彩系统
- **Base Surface**：deep neutral / slate / muted blue-gray
- **Primary Emphasis**：用于主 CTA、当前步骤、关键继续动作
- **Success**：保存成功、步骤完成、状态可继续
- **Warning**：信息不足、需补充、轻度风险
- **Danger / Restriction**：受限、阻断、关键失败
- **Review / Confidence**：低置信度、needs review、inferred

要求：
- 状态色的含义必须稳定，不可每页重新解释
- 不使用过多装饰色
- 大面积品牌色不应压过正文与结构化字段可读性
- `Restricted` 与普通 `Error` 需要颜色和语义双重区分，避免用户误以为只是系统故障
- `Needs Review / Inferred / Missing` 建议形成一组稳定的“判断语义色”，让用户在 W08 / W09 / W10 能快速扫读

### 3.3 字体与层级
- 无衬线字体
- 标题层级清楚，不依赖大面积装饰
- 信息密度适中，优先保证表单、结构化字段与章节文本可读性
- 长段英文必须有舒适行长与段落间距
- 章节型内容与结构化字段要有明显层级差异

### 3.4 布局语法
客户侧设计建议尽量复用以下布局语法：

#### A. Global Chrome
- 一级导航
- 顶部页面标题 / 一级操作

#### B. Opportunity Chrome
- Opportunity Header
- Workflow Stepper
- step 状态与依赖提示

#### C. Work Surface
- 主内容编辑区 / 结构化字段区 / 章节区

#### D. Context / Evidence Surface
- 原始输入
- discovery notes / transcript
- 文件状态与抽取结果
- effective rules summary

#### E. Auxiliary Surface
- version history
- restore preview
- override panel
- restriction explanation

要求：
- 主流程主内容应始终处在视觉主区
- drawer / modal / side panel 只承载辅助操作，不承载主流程核心内容

### 3.5 组件方向
- 卡片与面板边界清晰
- 表单字段、状态标签、版本入口、规则摘要需要统一组件语言
- Opportunity 子页建议复用统一 Header + Stepper + Action Bar
- 结构化字段与草稿章节使用不同组件层级，避免混淆
- Primary CTA 与 Generate CTA 应有稳定、可预期的视觉权重

### 3.6 状态表达
必须能清晰区分：
- normal
- loading
- empty
- saved
- error
- blocked / restricted
- low confidence
- needs review
- override active
- overwrite risk
- version restore confirmation

### 3.7 语义标签系统
至少建立以下稳定标签体系：
- Confirmed
- Inferred
- Missing
- Needs Review
- Restricted
- Override Active
- Draft Updated
- Restored from Version

要求：
- 标签不要只作为颜色小点存在
- 需要在关键页面具备可读文字与一致语义

### 3.8 内容区结构
对 Lead Brief / Discovery / Proposal Draft / Follow-up 页面：
- 不要采用聊天流气泡
- 不要把所有动作压进顶部工具条
- 不要让版本、限制、规则和风险信息消失在二级入口里
- 不要让 source 与 output 混成一大片无分区内容

### 3.9 生成动作层级
生成类操作建议遵循统一层级：
- 首次生成：Primary
- 重生成：Secondary but prominent
- 保存当前工作态：Secondary
- 保存版本：Secondary
- Restore：Danger-adjacent / confirm required
- Export / Copy：Utility action

### 3.10 动效与反馈
- 优先轻量过渡
- 生成中需提供持续反馈，避免“卡死感”
- 覆盖风险、restore、受限动作必须有明确确认反馈
- 不做炫技动效，不模拟 AI 思考过程

### 3.11 AI-first 交付要求
每页设计输出应尽量包含：
- 页面说明
- 模块命名建议
- 关键状态说明
- 主 CTA / 次 CTA
- 可复用组件标注
- 对 Codex 的实现提示
- 与相邻页面的切换关系

---

## 4. 页面总览与优先级

> 说明：客户侧正式页面模型以 12 个一级页面为准；为便于设计落地，本 Brief 将 Auth 拆成 3 个具体 screen。`/auth/google-callback` 视为技术路由，不作为独立视觉页设计。

| ID | 页面名称 | 优先级 | 页面类型 | 说明 |
| --- | --- | --- | --- | --- |
| W01 | Sign In | P0 | 认证页 | 登录入口，支持 Email / Google |
| W02 | Sign Up | P0 | 认证页 | 新用户注册入口 |
| W03 | Forgot Password | P0 | 认证页 | 找回 / 重置密码入口 |
| W04 | Workspace Setup | P0 | 初始化页 | 建立最小业务上下文 |
| W05 | Dashboard | P0 | 全局页 | 快速开始新机会或继续未完成机会 |
| W06 | Opportunities List | P0 | 全局页 | 机会列表、检索、过滤、归档 |
| W07 | Opportunity Overview / Lead Intake | P0 | 机会子页 | 原始输入、基础字段、文件处理与流程起点 |
| W08 | Lead Brief Workspace | P0 | 机会子页 | 结构化摘要工作区 |
| W09 | Discovery Workspace | P0 | 机会子页 | Discovery Intelligence 工作区 |
| W10 | Scope Builder / Proposal Draft | P0 | 机会子页 | 核心价值页，规则约束下的草稿生成与编辑 |
| W11 | Follow-up Workspace | P0 | 机会子页 | 基于 Proposal Draft 的跟进文案生成 |
| W12 | Templates & Rules | P0 | 全局页 | workspace 基线规则配置 |
| W13 | Billing / Trial | P0 | 商业化页 | 试用状态、升级、订阅管理 |
| W14 | Settings | P0 | 设置页 | workspace / user / members 基础设置 |

---

## 5. 核心用户主路径

### 5.1 首次试用主路径
Sign In / Sign Up → Workspace Setup → Dashboard → New Opportunity → Lead Intake → Lead Brief → Discovery → Proposal Draft → Follow-up

### 5.2 日常使用主路径
Dashboard / Opportunities → 进入某个 opportunity 的当前步骤 → 编辑 / 生成 / 保存当前工作态 / 保存版本 / 恢复版本 → 导出 / 复制 → 返回 Dashboard 或 Opportunities

### 5.3 规则调整路径
Proposal Draft → Templates & Rules → 保存 workspace 基线规则 → 返回当前 opportunity → 基于新的 effective rules 重新生成

### 5.4 局部覆盖路径
Proposal Draft → 打开 opportunity override panel → 修改最小规则覆盖 → 刷新 effective rules 摘要 → 继续章节级或整体生成

### 5.5 试用转化路径
Dashboard / Billing → Upgrade → Stripe Checkout → 返回产品 → Billing 状态更新 → 继续使用主链路

---

## 6. 全局导航与机会容器要求

### 6.1 主导航（Global Navigation）
登录后稳定显示的一级导航统一为：
- Dashboard
- Opportunities
- Templates & Rules
- Billing
- Settings

要求：
- 在所有业务页保持一致
- 可高亮当前一级入口
- 不直接承载机会子步骤

### 6.2 Opportunity 内导航（Context Navigation）
在 `/opportunities/:id/*` 下统一提供 Header + Stepper：
- Overview / Lead Intake
- Lead Brief
- Discovery
- Proposal Draft
- Follow-up

要求：
- 高亮当前步骤
- 可展示 `Not started / In progress / Completed / Needs attention`
- 能反映步骤依赖与受限原因
- Header 中建议统一保留：title、company_name、status badge、updated_at、owner、返回列表、关键 quick actions

### 6.3 横切能力
以下能力必须在相关页面中统一接入：
- current resource
- version history
- restore
- effective rules summary
- override active
- billing restriction
- low confidence / missing inputs / needs review
- file processing state
- retry
- overwrite confirmation

### 6.4 页面保护逻辑的视觉落点
设计稿需要为以下 guard 留出明确视觉表达：
- 未登录：回到 Sign In，并保留 return intent
- 未完成 workspace setup：统一回到 Workspace Setup
- Proposal Draft 依赖缺失：页面可进入，但主生成动作被阻断并给出补齐指引
- Follow-up 依赖缺失：页面可进入，但主生成动作被阻断并解释为何不可继续
- Billing 受限：页面仍可查看，但不可假装“只是在出错”

### 6.5 页面与资源契约映射（设计时必须保持一致）
- Opportunity Overview / Lead Intake ↔ `/opportunities/{id}`
- Lead Brief Workspace ↔ `/opportunities/{id}/lead-brief`
- Discovery Workspace ↔ `/opportunities/{id}/discovery`
- Proposal Draft ↔ `/opportunities/{id}/proposal-draft`
- Follow-up Workspace ↔ `/opportunities/{id}/follow-up`
- Templates & Rules ↔ `/workspaces/current/rules`
- Proposal Draft 中的 rules summary / override ↔ `/rules/effective` 与 `/rules/override`
- File retry ↔ `/opportunities/{id}/files/{file_asset_id}/retry`

要求：
- 设计稿不要再拆出新的一级产品面去承载这些能力
- `View History / Preview Version / Restore` 需要在交互上明显区分，与 API 的 list / detail / restore 语义保持一致

---

## 7. 跨页面统一模式

### 7.1 Source / Output 分离模式
适用于 W08 / W09：
- 左侧或上方：source / notes / transcript / raw input
- 右侧或下方：structured output / intelligence output
- source 与 output 必须有清晰边界

### 7.2 Rules / Draft 分离模式
适用于 W10：
- rules summary 永远可见
- draft 主体保持足够编辑空间
- override 不进入单独一级页面

### 7.3 历史版本模式
适用于 W08 / W09 / W10 / W11：
- View History 可发现
- Version List 可扫读
- Preview 与 Restore 明确分离
- Restore 必须二次确认
- 如可能丢失当前内容，应先提示 Save Version

### 7.4 受限动作模式
当受限状态存在时：
- 页面不应只禁用按钮后不解释
- 页面应同时说明：当前状态、受限原因、受影响动作、下一步动作

### 7.5 生成失败模式
当生成失败时：
- 主内容区保留当前已保存内容
- retry 路径明确
- 错误区不淹没主页面结构
- 不把错误处理降格成只有 toast

### 7.6 已冻结的受限动作模式
当 `trial_expired / past_due / canceled / inactive` 时，以下动作统一视为 **blocked actions**：
- `generate`
- `regenerate`
- `save current`
- `save-version`
- `restore`
- `export`

设计要求：
- 以上动作不能只做静默禁用
- 页面需要同时展示：`restriction_reason`、受影响动作、可行下一步（Upgrade / Manage Billing / Continue Viewing）
- `Copy` 是否保留按产品文档未冻结能力处理时，不应在视觉稿中擅自扩大为完整编辑权

---

## 8. 逐页设计 Brief

---

## W01｜Sign In

### 页面目标
让已有用户以最低摩擦进入产品。

### 进入条件 / 入口
- 官网 CTA
- 直接访问产品登录入口
- 受保护页面跳转
- return_url 回流

### 主要用户状态
用户想尽快进入 Dashboard 或继续处理某个 opportunity。

### 核心模块
- 品牌标题与一句话价值
- Email 登录表单
- Continue with Google
- Sign Up 入口
- Forgot Password 入口

### 主 CTA
- Sign In
- Continue with Google

### 关键状态
- 默认
- 提交中
- 邮箱 / 密码错误
- Google 授权失败
- 会话恢复成功后自动跳转

### 主要交互
- Email 登录
- Google 登录
- 跳转 Sign Up
- 跳转 Forgot Password

### Pencil 设计提示
- 极简、可信、低摩擦
- 不需要营销长页
- 首屏先给登录动作，不先堆产品说明

### 必须避免
- 不要把注册、登录、找回密码塞进同一张拥挤长表单
- 不要做泛聊天产品风格
- 不要出现 admin 相关入口

---

## W02｜Sign Up

### 页面目标
让新用户快速创建账户并进入 Workspace Setup。

### 进入条件 / 入口
- Sign In 页
- 官网试用入口

### 主要用户状态
用户对产品有初步兴趣，希望快速开始试用。

### 核心模块
- Email 注册表单
- Continue with Google
- Password 输入 / 校验提示
- 已有账户？返回 Sign In

### 主 CTA
- Create Account
- Continue with Google

### 关键状态
- 默认
- 邮箱校验失败
- 密码不符合要求
- 提交中
- 注册成功自动进入 Workspace Setup

### 主要交互
- Email 注册
- Google 注册
- 返回 Sign In

### Pencil 设计提示
- 让“开始试用”感更强于“创建复杂账户”
- 表单信息保持最少

### 必须避免
- 不要额外引入 profile、company profile、billing 等字段
- 不要在此页要求填写 workspace 相关信息

---

## W03｜Forgot Password

### 页面目标
支持低阻力密码重置。

### 进入条件 / 入口
- Sign In 页
- 登录失败后的辅助路径

### 主要用户状态
用户只想恢复访问，不想重新注册。

### 核心模块
- Email 输入
- Send Reset Link
- 返回 Sign In
- 成功提示 / 邮件说明

### 主 CTA
- Send Reset Link

### 关键状态
- 默认
- 输入错误
- 发送中
- 发送成功
- 链接失效 / 重试提示

### 主要交互
- 提交邮箱
- 返回登录
- 重新发送

### Pencil 设计提示
- 单任务页面
- 强调清楚结果反馈

### 必须避免
- 不要把它设计成复杂多步流程
- 不要出现与主工作流无关内容

---

## W04｜Workspace Setup

### 页面目标
建立最小业务上下文，使后续输出具备行业、模板与默认语气基线。

### 进入条件 / 入口
- 首次注册后自动进入
- 已登录但 workspace 未完成时强制进入

### 主要用户状态
用户愿意填写最少必要信息，以换取更可用的输出。

### 核心模块
- Workspace Name
- Industry Type
- Default Template
- Default Tone Preference
- Continue to Dashboard

### 主 CTA
- Continue to Dashboard

### 关键状态
- 默认空表单
- 字段校验失败
- 创建中
- 创建成功后跳转 Dashboard

### 主要交互
- 填写并提交 workspace 基础配置
- 切换行业类型与默认模板
- 进入 Dashboard

### Pencil 设计提示
- 单页完成
- 表单不应显得繁重
- 可用分组卡片减少表单压力

### 必须避免
- 不要加入复杂协作设置
- 不要加入 billing 购买步骤
- 不要把 rules 详细配置提前到 setup 阶段

---

## W05｜Dashboard

### 页面目标
让用户快速开始一个新机会，或回到未完成机会继续推进。

### 进入条件 / 入口
- 登录后默认页
- 全局导航：Dashboard

### 主要用户状态
用户希望明确“下一步做什么”，而不是浏览大盘信息。

### 核心模块
- 顶部工具栏：New Opportunity
- 状态概览卡片
- Recent Opportunities
- Needs Attention
- Trial / Billing Card

### 主 CTA
- New Opportunity
- Continue Current Step
- Upgrade

### 关键状态
- 空状态：无机会时引导创建第一条 opportunity
- 正常：展示最近机会与提醒
- 错误：数据拉取失败，支持 retry
- 受限：计费限制说明仍可见，Upgrade 入口清晰

### 主要交互
- 创建新机会
- 进入某机会当前步骤
- 从提醒项跳到对应未完成步骤
- 进入 Billing / Upgrade

### Pencil 设计提示
- Dashboard 更像“工作流入口页”，不是 BI 大屏
- 主 CTA 必须在首屏可见
- Needs Attention 的视觉权重要高于摘要数字
- 首版默认按 workspace 全量 opportunities 可见设计，不需要预埋“仅参与 / 仅分配”的默认视图

### 必须避免
- 不要把页面做成数据分析看板
- 不要让 trial / billing 卡压过主流程入口
- 不要引入内容流、社区、模板市场

---

## W06｜Opportunities List

### 页面目标
提供系统化机会管理视图，支持检索、过滤与归档。

### 进入条件 / 入口
- 全局导航：Opportunities
- Dashboard 跳转

### 主要用户状态
用户想快速定位某个机会，或管理进行中 / 已归档机会。

### 核心模块
- 顶部操作栏：New Opportunity、Search、Status Filter
- 列表主区域
- Archived toggle
- 行级状态信息（title、company、status、updated_at、owner）

### 主 CTA
- New Opportunity
- Open Opportunity

### 关键状态
- 默认列表
- 空状态
- 过滤空状态
- 归档视图
- 请求失败 / retry

### 主要交互
- 搜索 title / company
- 按 status 过滤
- 归档 / 取消归档
- 点击进入 opportunity

### Pencil 设计提示
- 列表页应突出“定位与继续处理”
- 行信息足够支持判断，但不过度密集
- 归档不要藏得太深
- 首版默认按 workspace 全量数据可见设计，不需要额外分裂“我的 / 分配给我”的主视图

### 必须避免
- 不要做成 CRM 复杂大表格
- 不要引入首版未冻结的复杂排序面板
- 不要把列表页设计成仅适合超大后台屏宽

---

## W07｜Opportunity Overview / Lead Intake

### 页面目标
承载单个 opportunity 的原始输入、基础字段与流程入口，是整个工作流的上下文中心。

### 进入条件 / 入口
- Dashboard 新建机会
- Opportunities List 行点击
- Dashboard / Needs Attention 跳转回流

### 主要用户状态
用户开始整理零散输入，准备进入结构化提炼。

### 核心模块
- Opportunity Header
- Progress Stepper
- 基础字段表单
- Raw Input 区（文本粘贴）
- PDF 上传与抽取结果预览
- Primary Actions：Save Opportunity、Generate Lead Brief

### 主 CTA
- Generate Lead Brief

### 关键状态
- 新机会空状态
- 正常编辑
- 文件 `uploaded / processing / ready / failed`
- raw input 太短
- 保存失败
- PDF 抽取失败但可手动继续

### 主要交互
- 编辑 title / company / contact / requested service / owner
- 粘贴原始输入
- 上传 PDF
- 查看抽取结果
- Retry 文件处理
- 满足条件后生成 Lead Brief

### Pencil 设计提示
- 这里是机会容器起点，Header 与 Stepper 需稳定
- 文件状态必须清楚，不可只靠 toast
- Raw Input 区要支持较长文本

### 必须避免
- 不要把 Lead Brief 结果提前混入本页
- 不要把 PDF 状态藏进小角标
- 不要让“Save”与“Generate Lead Brief”竞争主次关系

---

## W08｜Lead Brief Workspace

### 页面目标
把原始输入转成结构化的初步判断结果。

### 进入条件 / 入口
- Opportunity Overview 生成后进入
- Stepper 进入

### 主要用户状态
用户希望快速理解：客户是谁、要什么、缺什么、下一步该怎么推进。

### 页面布局建议
左右双栏：
- 左侧：raw input source
- 右侧：Lead Brief structured output

### 核心模块
- Source Panel：原始文本、来源类型、更新时间
- Structured Fields Panel：
  - client / company
  - contact
  - requested service
  - business context
  - urgency / timeline
  - budget signal
  - fit assessment
  - missing information
  - recommended next step
- Field Meta：Confirmed / Inferred / Missing / Needs Review
- Action Bar：
  - Regenerate
  - Save Current
  - Save Version
  - View History
  - Restore
  - Copy Summary
  - Continue to Discovery

### 主 CTA
- Generate Lead Brief（首次）
- Continue to Discovery（已有可用结果后）

### 关键状态
- 空状态：尚未生成
- 正常：结构化字段展示
- 生成中
- 输入不足
- 生成失败
- Restore 预览 / 确认
- 受限状态说明

### 主要交互
- 字段级编辑
- 字段确认
- 整体重生成
- 保存当前工作态
- 保存版本
- 查看历史版本
- 预览并恢复历史版本
- 进入 Discovery

### Pencil 设计提示
- 强调“结构化判断”，不是普通文本编辑器
- 字段状态标签要清楚、稳定、可扫描
- 历史版本入口不能过深
- Source 与 Output 的视觉区分要明显，避免用户误认 AI 输出就是原始事实

### 必须避免
- 不要做成长文档预览页
- 不要隐藏 Missing / Needs Review
- 不要无提示覆盖用户编辑内容

---

## W09｜Discovery Workspace

### 页面目标
把 discovery notes / transcript 转成 proposal-ready understanding。

### 进入条件 / 入口
- Lead Brief 后主流程进入
- Stepper 进入

### 主要用户状态
用户希望把零散会议记录、通话纪要、discovery notes 变成可用于 scope 定义的结构化理解。

### 页面布局建议
左右双栏：
- 左侧：Discovery 输入
- 右侧：Discovery Intelligence 输出

### 核心模块
- Input Panel：notes / transcript、optional comment、save input
- Intelligence Panel：
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
- Meta & Actions：
  - 状态标签
  - 编辑 / 确认
  - Generate / Regenerate
  - Save Current
  - Save Version
  - View History
  - Restore
  - Continue to Proposal Draft

### 主 CTA
- Generate Discovery
- Continue to Proposal Draft

### 关键状态
- 空状态：尚未输入 notes
- 正常：有 intelligence 输出
- 生成中
- 内容过短
- 生成失败
- Not enough evidence
- Restore 确认
- 受限状态说明

### 主要交互
- 粘贴 / 编辑 discovery 内容
- 触发生成
- 整体重生成
- 字段级编辑 / 确认
- 保存当前工作态
- 保存版本
- 查看 / 恢复历史版本

### Pencil 设计提示
- 输出应突出 ambiguities、risk flags、follow-up questions
- 比 Lead Brief 更强调“风险与约束”
- 继续进入 Proposal Draft 的路径要明显
- 风险与待追问项不应被折叠成低优先级小模块

### 必须避免
- 不要做成会议纪要阅读器
- 不要把 risk flags 当成次要折叠信息
- 不要静默覆盖用户已编辑内容

---

## W10｜Scope Builder / Proposal Draft

### 页面目标
在模板与规则约束下生成并编辑 proposal-ready draft，是 MVP 的核心价值页。

### 进入条件 / 入口
- Discovery 后主流程进入
- Stepper 进入
- 历史 opportunity 回流

### 主要用户状态
用户希望在可控边界下，快速形成能继续审核、编辑、导出与发送的草稿。

### 页面布局建议
三段式结构：
- 顶部：Template & Rules Control Bar
- 中部：章节式 Proposal Draft 编辑区
- 侧边 / 底部：版本、导出、风险与限制提示区

### 核心模块

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
- Restore
- Copy All
- Export Text / Markdown
- Go to Follow-up

#### E. Risk / Confidence / Restriction Notice
- low confidence notice
- missing inputs notice
- rules conflict notice
- missing required sections notice
- billing restriction notice

### 主 CTA
- Generate Draft
- Go to Follow-up

### 关键状态
- 空状态：尚未生成
- 正常：已有 draft 且可见 effective rules
- 生成中
- 章节重生成中
- override 保存中
- 关键输入缺失
- 规则冲突
- 低置信度
- override active
- 受限状态

### 主要交互
- 切换模板
- 查看 effective rules
- 打开并编辑 override panel
- 清除 override 并恢复 workspace 基线
- 生成 Proposal Draft
- 按章节编辑
- 章节级重生成
- 保存当前工作态
- 保存版本
- 查看 / 恢复历史版本
- 复制 / 导出
- 进入 Follow-up

### Pencil 设计提示
- 这是全产品最重要页面，必须兼顾“编辑器感 + 规则感 + 风险感”
- rules、版本、限制、低置信度都不能成为隐藏功能
- 章节编辑与章节级重生成要有清楚层级区分
- `Assumptions` 与 `Exclusions` 必须显式可见，不得并入正文深处
- 需要让用户感知“这已经接近可发出的 draft”，但仍明确属于 current draft state，而不是 final signed document

### 必须避免
- 不要做成黑盒一键生成器
- 不要把规则层藏到二级设置
- 不要把整个页面做成密集文档编辑器而失去流程控制感
- 不要无提示覆盖章节手动编辑内容
- 不要加入 e-sign、报价计算、付款收款、正式签署等超出 MVP 边界的区块或 CTA

---

## W11｜Follow-up Workspace

### 页面目标
帮助用户在 proposal 发送后快速生成上下文化的推进文案。

### 进入条件 / 入口
- Proposal Draft 页面进入
- Stepper 进入
- 某些推荐动作路径进入

### 主要用户状态
用户想快速拿到一个 B2B 礼仪合理、带明确 CTA 的跟进草稿。

### 核心模块
- Scenario Selector：
  - same day
  - 3-day
  - no response
  - objection handling
  - discovery recap + next steps
- Tone Selector：
  - 显式语气切换暂不视为首发必备控件
- Draft Output：
  - subject
  - body
  - CTA
- Actions：
  - Generate
  - Save Current
  - Save Version
  - View History
  - Restore
  - Copy Email
- Restriction / Dependency Notice

### 主 CTA
- Generate Follow-up
- Copy Email

### 关键状态
- 空状态
- 正常
- 生成中
- 生成失败
- 缺失 Proposal Draft 上下文
- 受限状态：billing restriction_reason

### 主要交互
- 切换场景
- 生成 Follow-up Draft
- 编辑并保存当前工作态
- 保存版本
- 查看 / 恢复历史版本
- 一键复制

### Pencil 设计提示
- 比 Proposal Draft 更轻，但仍应保持工作流专业感
- subject / body / CTA 三层结构要非常清楚
- Dependency Notice 不能只有系统错误语气

### 必须避免
- 不要做成普通邮件客户端
- 不要默认高压销售口吻
- 不要在无 Proposal Draft 上下文时继续显示可点击主生成按钮

---

## W12｜Templates & Rules

### 页面目标
提供 workspace 基线规则配置页面。

### 进入条件 / 入口
- 全局导航：Templates & Rules
- Proposal Draft 中的 workspace rules preview 跳转

### 主要用户状态
用户希望修正默认模板、语气、术语与章节结构，让后续 Proposal Draft 更稳定。

### 核心模块
- Template Basics：
  - default_template
  - template_scope
- Assumptions & Exclusions：
  - default_assumptions
  - default_exclusions
- Tone & Terminology：
  - tone_profile
  - preferred_terminology
  - banned_terminology
- Sections & Modules：
  - section_order
  - required_sections
  - service_modules
  - default_cta_style
- Actions：
  - Save Rules
  - Reset（可选）
  - Rule Impact Notes（可选）

### 主 CTA
- Save Rules

### 关键状态
- 正常
- 空状态（系统默认值）
- 配置无效
- 规则冲突
- 保存失败
- 保存成功后返回 Scope Builder 不丢上下文

### 主要交互
- 编辑规则字段
- 保存规则
- 校验冲突
- 返回 Scope Builder

### Pencil 设计提示
- 这是规则配置页，不是模板市场页
- 配置应模块化、可解释
- 与 Proposal Draft 的连接关系需要明确可感知

### 必须避免
- 不要把 opportunity 局部覆盖也放进本页
- 不要把字段排成巨长低可读表单
- 不要忽略冲突提示的视觉表达

---

## W13｜Billing / Trial

### 页面目标
承载试用状态、升级动作和订阅管理入口。

### 进入条件 / 入口
- 全局导航：Billing
- Dashboard 升级入口
- 受限页面的 Upgrade / Manage Billing 入口

### 主要用户状态
用户需要理解：当前能否继续生成、为什么受限、下一步是升级还是修复支付。

### 核心模块
- Current Plan Summary：
  - plan_type
  - billing_status
  - trial_status
  - current_period_end
  - currency（首版仅 USD）
- Plan Offer：
  - free trial
  - 一个正式付费计划
- Trial Status：
  - days_left
  - trial start / end
  - upgrade CTA
- Billing Actions：
  - Go to Checkout
  - Manage Billing
- Billing Alerts：
  - past_due
  - expired
  - canceled
- Restriction Notes：
  - is_generation_allowed
  - restriction_reason
  - affected actions summary

### 主 CTA
- Upgrade
- Manage Billing

### 关键状态
- trial_active
- trial_expired
- paid_active
- past_due
- canceled / inactive
- Checkout 创建失败
- Portal 跳转失败

### 主要交互
- 进入 Checkout
- 进入 Portal
- 查看限制说明
- 返回主流程继续处理

### Pencil 设计提示
- 重点是“解释状态与动作影响”，不是展示复杂套餐营销
- Upgrade 必须清楚
- `restriction_reason` 需要是可读说明区，不是小字脚注
- 首版按“免费试用 + 一个正式付费计划 + USD”设计，不要扩成多套餐价格墙

### 必须避免
- 不要把 Billing 设计成大营销落地页
- 不要只展示状态名，不解释对 generate / save / export 的影响
- 不要隐藏 Manage Billing

---

## W14｜Settings

### 页面目标
承载不属于主工作流的基础设置。

### 进入条件 / 入口
- 全局导航：Settings

### 主要用户状态
用户暂时离开主流程，处理 workspace / account / members 基础配置。

### 核心模块
- Workspace Info：
  - workspace_name
  - industry_type
- User Account：
  - name
  - email
  - auth provider
- Members（极简版）：
  - member list
  - role

### 主 CTA
- Save Changes

### 关键状态
- 正常
- 保存中
- 保存失败
- 权限不足

### 主要交互
- 修改 workspace 名称
- 查看当前登录方式
- 查看成员列表

### Pencil 设计提示
- 简洁、克制
- 不要让 Settings 成为第二个后台
- 与主流程保持统一设计语言，但信息密度可以更低

### 必须避免
- 不要加入大量高级权限设置
- 不要把 billing、rules、members 管理做成独立复杂系统
- 不要把低频配置压过主工作流入口
- 不要把 Settings 扩写成 admin console 或法律中心

---

## 9. 关键组件清单（供 Pencil 与 Codex 对齐）

| 组件 | 用途说明 |
| --- | --- |
| Global Navigation | Dashboard / Opportunities / Templates & Rules / Billing / Settings 的稳定一级导航 |
| Opportunity Header | opportunity 基础信息、状态、更新时间、owner、返回入口 |
| Workflow Stepper | Lead Intake → Lead Brief → Discovery → Proposal Draft → Follow-up 的上下文导航 |
| Primary CTA Button | 所有关键主操作按钮，需支持 normal / hover / disabled / loading / blocked |
| Secondary Action Button | Save Current / View History / Copy / Export / Retry 等二级动作 |
| Structured Field Card | 用于 Lead Brief / Discovery 的结构化字段展示、编辑与确认 |
| Field Status Tag | Confirmed / Inferred / Missing / Needs Review |
| Raw Input Panel | 粘贴原始输入、长文本编辑、来源信息 |
| File Upload Module | PDF 上传、处理状态、失败 retry、ready 预览 |
| Version History Drawer / Modal | 版本列表、预览、restore 确认 |
| Rules Summary Bar | current template、effective rules 摘要、override active |
| Override Panel | 当前 opportunity 的局部规则覆盖编辑区 |
| Draft Section Block | Proposal Draft 的章节容器，支持编辑、保存、章节重生成 |
| Restriction Notice | 展示 is_generation_allowed / restriction_reason / blocked action explanation |
| Low Confidence / Needs Review Notice | 用于输入不足、规则冲突、缺失必需章节等场景 |
| Billing Status Card | 试用 / 订阅状态与下一步商业化动作 |
| Empty State Block | 新用户、新 opportunity、未生成等状态引导 |
| Overwrite Confirmation Dialog | 重生成覆盖、restore 到当前工作态等高风险操作确认 |
| Evidence Marker / Source Hint | 表示字段或结论的来源、可信度、需复核状态 |

---

## 10. 页面状态与异常设计要求

### 10.1 所有关键页面至少设计以下状态
- loading
- empty
- error
- disabled / blocked
- success / saved
- retry

### 10.2 必须单独设计的异常状态
- W07：PDF `uploaded / processing / ready / failed`
- W07：raw input 太短
- W08：输入不足但仍可生成，需要高亮 missing information
- W09：notes / transcript 太短，Not enough evidence
- W10：无可用 Lead Brief 或基础 Discovery 时阻断 Proposal Draft 生成
- W10：章节重生成覆盖冲突
- W10：rules conflict / missing required sections / low confidence
- W11：无 Proposal Draft 上下文时页面可进入但阻断生成
- W13：trial_expired / past_due / canceled / inactive 的限制解释
- 所有生成页：generate 失败但历史版本与当前已保存内容不得丢失

### 10.3 受限状态统一要求
当 `trial_expired / past_due / canceled / inactive` 时：
- 页面必须显示 `restriction_reason`
- 不得只给通用报错
- 页面仍可查看历史数据
- Upgrade / Manage Billing 路径需清楚可用
- 必须明确解释受影响动作范围：`generate / regenerate / save current / save-version / restore / export`
- 设计稿中不应再保留“这些动作是否受限待冻结”的措辞

### 10.4 Restore 与覆盖风险要求
- restore 必须进入确认态
- 如当前内容可能被覆盖，应明确提醒
- 如用户可能需要保留当前内容，应提示先 Save Version
- 章节级 regenerate 与整体 regenerate 的覆盖风险表达需要区分

---

## 11. 文案与本地化要求

- 设计稿标题、按钮、字段名优先用英文样例文案
- 保证长英文标题、长字段值、长章节内容的可读性
- 时间、日期、货币、账期按英文产品习惯呈现；首版 Billing 默认按 USD 表达
- Follow-up 文案语气偏 B2B、礼貌、克制、可执行
- 不要用高压销售口吻
- UI 层可保留中文注释给评审，但正式界面不建议中英混用
- MVP 不承诺完整多语言本地化体系；设计时以 English-first 为正式基线，不要为了假设中的多语言而稀释当前布局判断
- 错误说明优先解释业务原因，而不是展示技术异常语句

---

## 12. Pencil 交付要求

### 必交
- 全部 P0 页面主方案
- 关键状态方案（loading / empty / error / blocked / success）
- Opportunity 子流程统一容器（Header + Stepper + Action pattern）
- 版本历史与 restore 的统一交互方案
- rules summary / override panel 的统一交互方案
- billing restriction 的统一提示方案
- 基础 design system 摘要（色板、层级、间距、圆角、表单、标签、按钮）

### 页面级注释要求
每页尽量包含：
- 页面目标
- 模块名称
- 主 CTA / 次 CTA
- 依赖提示
- 关键状态
- 对 Codex 的实现提示
- 对应 API / 资源语义提示（例如：current resource、save-version、restore、retry、restriction_reason）

### 给 Codex 的统一实现提示
- 尽量按页面 ↔ 资源一一对应实现，避免页面自己发明状态模型
- Opportunity 子页优先复用统一容器：Header + Stepper + Action Bar + Notice pattern
- `Restricted`、`Needs Review`、`Override Active`、`Restored from Version` 建议实现为跨页复用的语义组件，而不是页面级一次性样式

### 建议的出图顺序
1. W10 Scope Builder / Proposal Draft
2. W07 Opportunity Overview / Lead Intake
3. W08 Lead Brief Workspace
4. W09 Discovery Workspace
5. W05 Dashboard
6. W11 Follow-up Workspace
7. W12 Templates & Rules
8. W13 Billing / Trial
9. W06 Opportunities List
10. W04 Workspace Setup
11. W01 / W02 / W03 Auth
12. W14 Settings

> 说明：v1.2 继续保持把 W10 提前。原因是它最能定义 ProposalFlow 的独特产品语言；其设计完成后，W08 / W09 / W11 / W12 的组件与语义更容易统一。

---

## 13. 设计验收标准（审核时看什么）

### 13.1 产品气质
- 是否一眼能看出这是 **提案前工作流产品**，而不是聊天工具、内容产品或传统 proposal 展示工具
- 是否体现 structured-first、draft-first、rule-constrained 的边界
- 是否避免把“是否够漂亮”误当成主要验收标准，而是以“是否更利于 scope judgement 与低风险推进”为主

### 13.2 主流程清晰度
- 用户是否能清楚感知从 Lead Intake 到 Follow-up 的连续路径
- Header + Stepper 是否稳定、清楚、可回流
- 当前步骤、下一步、阻断原因是否一眼可见

### 13.3 核心价值页质量
- W10 是否足够体现“规则约束下的可编辑草稿生成”
- W08 / W09 是否清楚区分“结构化提炼”和“正文草稿生成”
- W11 是否在轻量的同时保留上下文感与 B2B 专业感

### 13.4 横切能力落点
- 版本、恢复、限制、低置信度、缺失信息是否有统一交互
- 受限状态是否给出动作影响解释
- 重生成覆盖风险是否被明确表达

### 13.5 规则与信任表达
- effective rules 是否足够可见
- override active 是否不会被忽略
- Confirmed / Inferred / Missing / Needs Review 是否可快速扫读
- source / evidence 与 output 的区分是否足够清楚

### 13.6 商业化与设置层
- W13 是否清楚解释试用 / 订阅状态与下一步动作
- W14 是否保持克制，不抢主流程
- 全局导航是否始终稳定且不臃肿

### 13.7 可实现性
- 是否适合 Codex 直接实现
- 是否已形成可复用组件而不是大量一次性页面
- 是否为英文文案长度、状态扩展和后续增强留出空间

---

## 14. 结论

这份 Brief 的目标，不是让页面更“花”，而是让 Pencil 更快产出 **可被 Codex 直接实现**、并且 **与已冻结产品文档一致** 的客户侧页面方案。

ProposalFlow AI 客户侧设计的正确方向，应始终服务于同一主线：

**围绕单个 opportunity，连续、清晰、低风险地把用户从原始输入推进到 proposal-ready draft，再推进到 follow-up。**
