# ProposalFlow AI｜运营管理端页面设计 Brief v1.1
> Pencil 专用 / Admin Surface / Final Design-to-Build Brief

## 文档信息

- **文档名称**：ProposalFlow AI｜运营管理端页面设计 Brief
- **版本**：v1.1
- **适用对象**：Pencil 设计生成、产品审核、Codex 开发对照
- **产品范围**：Admin Surface（Internal Admin Console / MVP）
- **产品定位**：ProposalFlow AI 平台面向内部角色的运营管理端
- **设计目标**：建立一套独立、可信、可扫描、可判断的内部运营控制台，用于平台级规模判断、增长判断、激活判断、主流程完成判断与商业状态判断
- **默认语言**：English-first（本文档中文描述，界面文案默认按英文产品设计）
- **默认平台**：Desktop first；优先 1280px+ 桌面端体验，同时保证基础 laptop 宽度可用
- **设计阶段定位**：本 Brief 不重新定义 admin 产品范围；只把已冻结的产品边界、口径、路由、查询协议与只读原则翻译成可直接出图与实现的设计输入

---

## Final Sync Note（v1.1）

本版已基于以下 admin 文档完成最后一轮交叉收口：

- 运营管理端 PRD
- 运营管理端页面流程与信息架构说明
- 运营管理端页面清单与页面级需求
- 运营管理端指标与口径说明
- 运营管理端 API 需求说明
- 开发骨架与目录结构设计说明

设计稿必须严格遵守以下大前提：

1. **admin 端是独立产品面**，不是客户侧页面的延伸，也不是 `apps/web` 的一个隐藏页面。
2. **admin 端是独立登录态与独立 guard**，所有 `/admin/*` 页面都依赖 internal auth guard 与 internal role guard。
3. **首版 admin 端以只读查询为主**，目标是建立平台级可见性与一致判断，而不是做复杂后台、客服后台、CRM、运维控制台或 BI 大盘。
4. **页面结构围绕平台级对象和平台级问题组织**，而不是围绕客户侧 opportunity 工作流组织。
5. **workspace 主漏斗正式从 `workspace_created` 开始**；`signup_completed` 不能混入默认 workspace funnel。
6. **`workflow_completion_rate` 的主展示口径固定为 `Workflow Completed Workspaces / Activated Workspaces`**；不得默认使用 `New Workspaces` 作为分母。
7. **Subscriptions / Trials 与相关 drill-down 场景中，`is_generation_allowed` 与 `restriction_reason` 属于首版正式字段**，必须稳定可见。
8. **首版不支持任何高风险写操作**：手工修改 `trial_status`、手工修改 `billing_status`、impersonation、强制推进客户侧主流程状态、批量高风险操作均不进入设计范围。
9. **设计稿必须映射到 admin API 协议**：筛选、排序、分页、时间范围、返回列表保留查询条件，均不得脱离 `/api/v1/admin/*` 的正式协议。

---

## 1. 使用说明

Pencil 使用本 Brief 时，不需要重新推导 admin 产品价值，也不要扩写未冻结需求。重点输出以下结果：

- Admin sitemap
- 全局布局与主导航方案
- 页面级模块排布
- 指标卡、状态标签、筛选栏、表格、时间范围切换器、提示块、时间线的统一样式
- support states（loading / empty / error / insufficient data / unauthorized / object not found）的统一表达
- 列表 → 明细 → 返回列表的查询条件承接
- 可复用组件命名、边界与变体建议

设计时必须始终围绕以下事实展开：

1. 这是 **内部运营管理端**，不是客户侧产品，不承担售前工作流交互。
2. 这是 **判断型界面**，重点是“看清状态、识别异常、快速筛查、形成一致判断”。
3. 这是 **平台视角界面**，而不是单个 workspace 内部的操作工作台。
4. 首版以 **只读查询** 为主，不通过 UI 承担复杂手工改写。
5. 指标、漏斗、订阅限制解释、筛选协议都已冻结，设计稿不得自行改变对象、分子分母或查询协议。
6. 页面应强调 **可扫描性、可判断性、可追踪性**，而不是图表堆叠、装饰化布局或复杂交互炫技。

---

## 2. 跨文档冻结事实（设计时必须视为已定）

以下内容已冻结，设计稿不得改写：

1. **入口分离**：admin 端必须是独立入口；推荐独立子域名 `admin.<domain>` 或独立 `/admin` 路由域。
2. **登录态分离**：admin 页面初始化登录态查询必须使用 `/api/v1/admin/auth/me`；不得复用客户侧 `/api/v1/auth/me`。
3. **内部角色分离**：仅 `internal_admin` / `internal_analyst` 可访问运营端；普通客户侧 `owner/member` 不可访问。
4. **主导航冻结**：Overview、Workspaces、Users、Subscriptions / Trials、Funnel Analytics。
5. **首版页面目录冻结**：Admin Auth、Overview、Workspaces List、Workspace Detail、Users List、User Detail（P1 预留）、Subscriptions / Trials、Funnel Analytics。
6. **只读边界冻结**：首版不支持手工修改 trial / billing 状态，不做 impersonation，不做强制主流程状态改写，不做批量高风险操作。
7. **主漏斗起点冻结**：默认展示 workspace funnel，正式起点固定为 `workspace_created`；`signup_completed` 仅可作为 user-level 辅助指标或未来独立 user funnel 起点。
8. **关键转化口径冻结**：`workflow_completion_rate = Workflow Completed Workspaces / Activated Workspaces`。
9. **Overview 时间范围冻结**：页面级统一时间范围控件，默认 `7d`，支持 `7d / 30d`；custom range 为增强项。
10. **统一过滤协议冻结**：列表与跳转统一使用 `q`、`trial_status`、`billing_status`、`plan_type`、`auth_method`、`created_from`、`created_to`、`active_from`、`active_to`、`sort_by`、`sort_direction`、`cursor`、`limit`；指标与聚合统一使用 `from`、`to`。
11. **限制解释字段冻结**：Subscriptions / Trials 及相关 drill-down 中必须包含 `is_generation_allowed` 与 `restriction_reason`。
12. **User Detail 首版策略冻结**：只作为 P1 预留，不进入首版正式交付。
13. **Funnel → 列表跳转冻结**：点击漏斗节点跳转到过滤后的 Workspaces 列表属于增强项，不进入首版 P0。
14. **Subscriptions 时间筛选冻结**：首版统一沿用列表协议中的 `from / to`，不新增专门针对 `current_period_end` 的特殊筛选字段命名。
15. **Workspace Detail 活动时间线冻结**：首版不单独拆活动接口，时间线折叠进 workspace detail 查询结果。

---

## 3. 全局设计原则

### 3.1 Internal-first，不做客户侧延伸页
admin 端必须一眼看出是内部系统：更重判断与检索，不重营销、品牌转化或客户教育。

### 3.2 Platform-first，不做 workspace 内工作台
页面组织必须围绕平台级对象和平台级判断：规模、增长、激活、主流程完成、试用与订阅状态、流失位置。

### 3.3 Read-only first，不做复杂操作后台
首版 UI 必须传达“查询与判断优先”，而不是“修改与控制优先”。任何看起来像可写操作的入口都应极其克制，避免设计误导。

### 3.4 Scanability first，不做重内容页面
使用者通常会快速扫读指标卡、提醒区、表格、状态标签与时间线。布局优先级应是：
- 是否能快速扫到关键信号
- 是否能快速定位异常对象
- 是否能快速理解状态含义
- 是否能快速进入相关对象查看证据

### 3.5 Consistent metrics language，不让对象混淆
任何指标卡、表头、趋势说明、漏斗说明都必须明确对象与窗口。不得把“workspace 数”“用户数”“事件次数”“转化率”混在同一命名体系里。

### 3.6 Shallow navigation，不做层级过深后台
首版导航保持浅层：一级页固定，详情页只承接对象深入查看。不引入复杂菜单树、配置页集群或多层嵌套子导航。

### 3.7 Explain the restriction，不只显示状态名
当页面展示 `trial_expired`、`past_due`、`canceled`、`is_generation_allowed = false` 等状态时，必须给出可读的限制解释，而不是只显示内部状态码。

### 3.8 Stable support states，不让异常打断主导航
列表失败、数据不足、对象不存在、会话失效、权限不足都应有清晰表达，但不应破坏整个 admin 的主导航结构。

### 3.9 Table-first, chart-light，不做 BI 炫图
首版重点是可判断和可追踪。表格、标签、摘要卡、时间线优先；图表可存在，但不能挤压状态解释和对象检索。

### 3.10 Contract-first，不让设计脱离查询协议
设计稿中的筛选、排序、分页、时间范围、跳转承接都必须能回指到正式 admin API 协议。不要为了视觉方便，自行发明未定义维度、跳转规则或写操作入口。

---

## 4. 设计系统约束（给 Pencil）

### 4.1 视觉原型
ProposalFlow Admin 的视觉原型更接近：
- internal analytics console
- platform operations dashboard
- query-first admin surface

而不是：
- CRM 销售管道工具
- customer support console
- infrastructure monitoring center
- full BI dashboard
- generic marketing SaaS app

### 4.2 色彩系统
- **Base Surface**：neutral / slate / muted gray-blue
- **Primary Emphasis**：用于当前导航、主要时间范围选择、核心 drill-down
- **Success**：paid / healthy / active / success state
- **Warning**：expiring soon / insufficient data / needs attention
- **Danger**：past_due / canceled / access denied / hard error
- **Info / Neutral Status**：trial_active / default tags / internal context

要求：
- 状态色语义必须全局固定。
- 指标卡不应依赖纯色块堆砌表达重要性。
- `restricted generation` 必须与普通查询失败区分。
- `past_due`、`trial expiring soon`、`high activity but unpaid` 应形成稳定提醒语义。

### 4.3 字体与层级
- 使用无衬线字体。
- 指标数字、对象名称、状态标签、辅助解释之间必须有明确层级。
- 列表页优先保证英文长 workspace 名、邮箱、时间字段可读。
- badge / chip 不应压过主内容。
- Overview 指标卡标题必须保留对象与时间窗口的阅读空间。

### 4.4 布局语法
建议 admin 端统一使用以下布局语法：

#### A. Global Admin Chrome
- 左侧主导航或顶部主导航
- 顶部页面标题
- 页面级说明与全局控件

#### B. Summary Surface
- 指标卡区
- 时间范围切换
- 提醒区 / warning rail / anomaly rail

#### C. Query Surface
- 顶部筛选栏
- 列表 / 表格 / 分页
- 辅助标签区

#### D. Detail Surface
- summary panel
- usage snapshot
- members summary
- recent opportunities
- activity timeline

#### E. Support State Surface
- empty state
- query error
- insufficient data
- access denied
- object not found

要求：
- Overview 首屏先给关键判断，不先给装饰图表。
- 列表页先保证筛选与表格可用，再考虑 summary 卡片。
- Detail 页优先展示 summary / usage / activity，不堆叠说明性长文案。

### 4.5 组件方向
- Metric Card
- Status Badge
- Attention Card / Alert Row
- Filter Bar
- Data Table
- Empty State / Error State Block
- Window Switcher
- Detail Summary Panel
- Activity Timeline
- Support Callout
- Query Chips / Quick Filters

### 4.6 状态表达
必须能清晰区分：
- normal
- loading
- empty
- query failed
- insufficient data
- unauthorized
- forbidden
- object not found
- expiring soon
- restricted generation

### 4.7 图表方向
首版允许轻量图表，但必须克制：
- 漏斗图或分层条形图可用
- 趋势线只在确有必要时使用
- 不做复杂 BI 组合图
- 不用多图堆叠取代文字说明与表格明细

### 4.8 数据表方向
- 优先表格可扫描性
- 支持英文长 workspace 名与邮箱
- 状态列必须便于扫读
- 时间列统一格式
- 默认排序要有清晰提示
- 行点击进入 Detail 的 affordance 要清楚，但不要过度像可编辑表格

### 4.9 口径提示规则
凡出现以下内容时，页面必须在必要位置提供简短口径提示：
- 统计对象（user 或 workspace）
- 时间窗口（7d / 30d / from-to）
- 关键分母定义（尤其是 `workflow_completion_rate`）
- 该视图是否为正式 workspace funnel

### 4.10 动效与反馈
- 优先轻量过渡
- 筛选变化、时间范围切换、分页切换要有明确 loading 反馈
- 返回列表时应尽量恢复原 query params 与页面状态
- 不做复杂交互动效

### 4.11 Build-first 交付要求
每页设计输出应尽量包含：
- 页面说明
- 模块命名建议
- 关键状态说明
- Primary CTA / Secondary CTA
- 可复用组件标注
- 对 Codex 的实现提示
- 与相邻页面的跳转关系
- 需要保留的 query params

---

## 5. 页面总览与优先级

| ID | 页面名称 | 优先级 | 页面类型 | 说明 |
| --- | --- | --- | --- | --- |
| A01 | Admin Auth | P0 | 认证页 | 运营端独立登录入口 |
| A02 | Overview | P0 | 全局总览页 | 平台规模、增长、转化、商业化提醒 |
| A03 | Workspaces List | P0 | 列表页 | workspace 主视角检索与筛查 |
| A04 | Workspace Detail | P0 | 明细页 | 单个 workspace 的业务 / 商业 / 活动深入查看 |
| A05 | Users List | P0 | 列表页 | 平台用户检索与归属追踪 |
| A06 | User Detail | P1 | 明细页 | 单个用户身份与行为详情 |
| A07 | Subscriptions / Trials | P0 | 列表页 | trial / billing 状态集中查看 |
| A08 | Funnel Analytics | P0 | 分析页 | workspace 主漏斗与流失位置查看 |

---

## 6. 核心使用路径

### 6.1 日常运营查看路径
Admin Auth → Overview → Workspaces / Subscriptions / Funnel Analytics → Workspace Detail → 返回列表或切换其他导航

### 6.2 订阅判断路径
Overview / Subscriptions → 过滤 `trial_status` / `billing_status` → 查看 Workspace Detail → 返回列表

### 6.3 漏斗排查路径
Overview / Funnel Analytics → 识别流失节点 → 对照 Workspaces / Subscriptions 进一步判断

### 6.4 用户检索路径
Users → 搜索邮箱或姓名 → 查看基础信息 →（P1）进入 User Detail

设计时必须让内部用户感受到：
- 这是一条连续的平台判断流程，而不是若干互不相关的报表页。
- 主导航固定，support state 不打断主路径。
- 从列表进入明细后，返回时尽量保留原过滤条件与排序状态。

---

## 7. 逐页设计 Brief

## A01｜Admin Auth

### 页面目标
提供运营端独立登录入口，确保内部访问与客户侧产品入口分离。

### 进入条件 / 入口
- 独立 admin 域名或独立 `/admin` 路由域
- 未登录访问任意 `/admin/*` 页面时跳转进入

### 主要用户状态
内部用户准备进入平台查看整体运营情况；非内部角色可能误入。

### 核心模块
- 品牌标题：ProposalFlow AI Admin
- internal-only 说明
- 统一登录入口
- 异常提示：登录失败 / 无权限访问 / 会话失效

### 主 CTA
- Sign In

### 关键状态
- default
- signing in
- login failed
- permission denied
- session expired

### 主要交互
- 内部用户登录
- 登录成功进入 Overview
- 非内部角色被拒绝访问

### Pencil 设计提示
- 页面应明显区别于客户侧 Auth。
- 视觉上强调 internal-only，而不是营销转化。
- 不做注册页、欢迎页、长找回密码流程。

### 必须避免
- 不要与客户侧登录页共用 layout 语义。
- 不要放入客户侧产品入口。
- 不要默认展示普通用户可见的说明文案。

---

## A02｜Overview

### 页面目标
以最小信息密度提供平台整体业务总览，帮助内部快速判断平台当前规模、近期增长、激活、主流程完成与商业状态。

### 进入条件 / 入口
- Admin 登录后默认首页
- 主导航 Overview

### 主要用户状态
内部用户希望在 30–60 秒内完成一次高信号判断：平台规模是否正常、近期增长是否健康、主流程是否跑通、商业状态是否有异常。

### 核心模块
#### 区块 A：Window Switcher
- `7d / 30d`
- 默认 `7d`
- 所有窗口型指标卡共用同一顶部选择器

#### 区块 B：Scale Metrics
- `Total Users`
- `Total Workspaces`
- `Active Workspaces`
- `Paid Workspaces`
- `Trial Active Workspaces`
- `Trial Expired Workspaces`

#### 区块 C：Growth / Usage Snapshot
- `New Users (window)`
- `New Workspaces (window)`
- `Proposal Draft Generated Workspaces (window)`
- 需要时可补 `Follow-up Generated Workspaces (window)`，但不应挤压主转化指标

#### 区块 D：Core Conversion Metrics
- `Activation Rate (window)`
- `Workflow Completion Rate (window)`
- `Trial to Paid Conversion Rate (window)`

#### 区块 E：Attention / Exceptions Rail
- trial expiring soon
- `past_due`
- high activity but unpaid
- data quality / data insufficient 提示

### 主 CTA
- Drill into Workspaces
- Drill into Subscriptions

### 关键状态
- normal
- insufficient data
- query failed

### 主要交互
- 切换时间范围
- 点击指标卡跳转到相关列表页
- 点击提醒项跳转到带过滤条件的 Workspaces 或 Subscriptions

### 设计约束
- 指标命名必须体现对象与时间窗口。
- 累计规模类指标与窗口型指标必须视觉区分。
- `Workflow Completion Rate` 需要在必要处有简短分母提示。
- 不展示误导性空转化判断；若数据不足，应显示“当前数据不足以形成稳定判断”。

### Pencil 设计提示
- Overview 首屏优先传达关键判断，不先传达“图表丰富”。
- 提醒区应足够醒目，但不能压过总览判断。
- 图表是辅助，不是主内容。

### 必须避免
- 不要把 Overview 画成 BI 大盘。
- 不要混入 event count 与 object count 的歧义命名。
- 不要将 `New Workspaces` 默认误写成 `workflow_completion_rate` 的分母。

---

## A03｜Workspaces List

### 页面目标
以 workspace 为主视角查看平台使用状态、试用与订阅状态、近期活跃程度与主流程使用深度。

### 进入条件 / 入口
- 主导航 Workspaces
- 从 Overview 指标卡或提醒区跳转进入

### 主要用户状态
用户希望快速筛出高活跃但未付费、trial expiring soon、`past_due`、近期无活跃、当前不可生成内容等重点 workspace。

### 核心模块
#### 区块 A：Filter Bar
- `q`
- `trial_status`
- `billing_status`
- `plan_type`
- `created_from / created_to`
- `active_from / active_to`
- `sort_by / sort_direction`

#### 区块 B：Quick Filters / Query Chips
- high activity
- no recent activity
- `past_due`
- trial expiring soon

#### 区块 C：Data Table
建议字段：
- `workspace_name`
- `created_at`
- `members_count`
- `trial_status`
- `billing_status`
- `plan_type`
- `current_period_end`
- `recent_activity_at`
- `opportunities_count`
- `proposal_draft_generated_count`
- `is_generation_allowed`
- `restriction_reason`

### 默认排序
- 推荐默认按 `recent_activity_at desc`

### 主 CTA
- Open Workspace Detail

### 关键状态
- normal list
- no matching results
- query failed

### 主要交互
- 搜索 workspace
- 按试用 / 订阅 / plan / 时间过滤
- 按最近活跃或创建时间排序
- 点击行进入 Workspace Detail

### 设计约束
- 返回列表时尽量保留原 query params。
- `restriction_reason` 不得隐藏在深层 tooltip；至少要有可稳定发现的表达。
- 表格页优先可扫描性，不做复杂高级搜索器。

### Pencil 设计提示
- Workspaces 页应像 query-first list，而不是 pipeline。
- 快捷标签可辅助，但不应替代表格主体。
- 状态列要支持一眼扫读。

### 必须避免
- 不要把页面设计成 CRM pipeline。
- 不要加入首版未冻结的批量运营动作。
- 不要弱化 `is_generation_allowed / restriction_reason`。

---

## A04｜Workspace Detail

### 页面目标
围绕单个 workspace 查看其业务状态、商业状态、主流程使用情况和关键时间线，以支持运营排查与商业判断。

### 进入条件 / 入口
- Workspaces List 行点击进入
- Subscriptions / Trials 列表 drill-down 进入

### 主要用户状态
用户希望快速判断该 workspace：
- 是否已激活
- 是否还在使用
- 是否有付费信号
- 当前是否受限
- 最近关键行为发生了什么

### 核心模块
#### 区块 A：Workspace Summary
- `workspace_name`
- `created_at`
- `trial_status`
- `billing_status`
- `plan_type`
- `current_period_end`
- `recent_activity_at`
- `is_generation_allowed`
- `restriction_reason`

#### 区块 B：Members Summary
- 成员列表
- `auth_method`
- 最近活跃时间

#### 区块 C：Usage Snapshot
- `opportunities_count`
- `lead_brief_generated_count`
- `discovery_generated_count`
- `proposal_draft_generated_count`
- `followup_generated_count`

#### 区块 D：Recent Opportunities
- opportunity title
- status
- updated_at
- owner

#### 区块 E：Activity Timeline
- 注册 / 登录关键节点
- 创建 workspace
- 创建 opportunity
- 生成 lead brief / discovery / proposal draft / follow-up
- 升级点击 / 订阅激活等关键行为

### 主 CTA
- Return to List
- Open Related Subscription Context（若当前页面承接该 drill-down）

### 关键状态
- normal
- simplified view because data is partial
- query failed
- object not found

### 主要交互
- 查看 summary / usage / timeline
- 查看成员与最近机会
- 视实现情况跳转到订阅相关视图或用户明细（若已实现）

### 设计约束
- Detail 页应是“判断面板 + 证据面板”，不是编辑表单页。
- Summary、Usage、Timeline 为必需主区块，优先级必须高于说明文案。
- `restriction_reason` 必须是 summary 的正式一部分，而不是附加信息。
- 对象不存在时必须给出 not found 或返回列表路径。

### Pencil 设计提示
- 页面应帮助内部快速回答“是否已激活、是否在使用、是否有付费信号”。
- 时间线可读性比视觉复杂度更重要。
- recent opportunities 只做上下文，不要扩成完整机会管理表。

### 必须避免
- 不要设计成可直接修改 trial / billing 状态。
- 不要加入高风险运营动作按钮。
- 不要用大量说明文案淹没 summary。

---

## A05｜Users List

### 页面目标
从平台级视角查看用户规模、登录方式和活跃情况，支持内部用户检索与归属追踪。

### 进入条件 / 入口
- 主导航 Users

### 主要用户状态
内部用户希望快速定位某个邮箱 / 姓名对应的用户，并理解其登录方式、最近活跃和 workspace 归属。

### 核心模块
#### 区块 A：Filter Bar
- `q`
- `auth_method`
- `created_from / created_to`
- `active_from / active_to`
- `sort_by / sort_direction`

#### 区块 B：Data Table
建议字段：
- `user_id`
- `email`
- `full_name`
- `auth_method`
- `created_at`
- `last_active_at`
- `workspace_count`
- `primary_workspace_name`

### 默认排序
- 首版固定一种：`created_at desc` 或 `last_active_at desc`
- 设计稿需预留排序表达，但不要同时默认两种排序

### 主 CTA
- Search
- Open User Detail（P1 预留）

### 关键状态
- normal list
- no matching results
- query failed

### 主要交互
- 搜索用户
- 按登录方式筛选
- 若 User Detail 已实现，则可点击进入

### 设计约束
- Users 页是检索页，不是用户管理页。
- 表格信息够用即可；不扩成身份管理后台。
- `auth_method` 与 `workspace_count` 应便于扫读。

### Pencil 设计提示
- Users 页可比 Workspaces 更轻，但不能弱化检索效率。
- 行点击 affordance 应清楚，但 P1 页面不要反向绑架当前出图结构。

### 必须避免
- 不要加入用户封禁、强制重置等未冻结操作。
- 不要引入复杂多层过滤器压垮页面。

---

## A06｜User Detail（P1 预留）

### 页面目标
查看单个用户的身份信息、归属关系和关键行为。

### 进入条件 / 入口
- Users List 行点击（仅在后续启用时）

### 主要用户状态
需要对某个用户做更深入归属判断，但这不是首版必须能力。

### 核心模块
- user summary
- auth identity summary
- related workspaces
- recent activities

### 主 CTA
- Return to Users

### 首版策略
- 路由与结构可预留
- 不进入首版 P0 正式设计优先级

### Pencil 设计提示
- 只做轻量预留，不展开复杂详情页。

### 必须避免
- 不要把 P1 页面做成当前主交付阻塞项。

---

## A07｜Subscriptions / Trials

### 页面目标
集中查看 trial、paid、past_due、canceled、即将到期等商业化状态，是连接产品使用与商业判断的关键模块。

### 进入条件 / 入口
- 主导航 Subscriptions / Trials
- Overview 提醒区 drill-down 进入

### 主要用户状态
内部用户希望快速筛出：
- 即将到期的试用
- 过期试用
- 已付费 workspace
- `past_due` / `canceled` 对象
- 当前是否还能生成内容

### 核心模块
#### 区块 A：Filter Bar
- `trial_status`
- `billing_status`
- `plan_type`
- `from / to`
- `sort_by / sort_direction`

#### 区块 B：Optional Summary Strip（P1 预留）
- `trial_active_workspaces`
- `trial_expired_workspaces`
- `paid_workspaces`
- `past_due_workspaces`
- `canceled_workspaces`
- `expiring_soon_workspaces`

#### 区块 C：Data Table
建议字段：
- `workspace_name`
- `trial_status`
- `trial_start_at`
- `trial_end_at`
- `billing_status`
- `plan_type`
- `current_period_end`
- `expiring_soon_flag`
- `is_generation_allowed`
- `restriction_reason`

### 默认排序
- 推荐默认按 `current_period_end asc` 或 expiring soon 优先排序

### 主 CTA
- Open Workspace Detail

### 关键状态
- normal list
- no matching results
- query failed

### 主要交互
- 按 trial / billing / plan / 时间范围过滤
- 查看即将到期与受限对象
- 进入对应 Workspace Detail

### 设计约束
- 这是商业状态判断页，不是 Stripe 原始对象浏览页。
- `is_generation_allowed` 与 `restriction_reason` 是主判断字段，不得弱化。
- 时间筛选必须沿用 `from / to`，不要额外发明账期专用筛选名。

### Pencil 设计提示
- 试用 / 订阅 / 是否可生成三者要能被一眼关联理解。
- 若保留 summary strip，应保持极简，不可挤压主表格。
- 优先状态解释，不优先显示 Stripe 内部字段。

### 必须避免
- 不要把页面做成账单后台。
- 不要直接展示难懂的 Stripe 原始字段作为主内容。
- 不要把 `is_generation_allowed` 藏进深层 tooltip。

---

## A08｜Funnel Analytics

### 页面目标
查看从 workspace 创建到主流程使用、升级点击与订阅激活的关键漏斗，以识别主要流失点。

### 进入条件 / 入口
- 主导航 Funnel Analytics
- Overview 转化判断后进入

### 主要用户状态
内部用户希望快速看出：
- 主流程最主要流失点在哪
- 激活与工作流完成表现如何
- 从使用到升级 / 订阅转化是否顺畅

### 首版正式漏斗节点
1. `workspace_created`
2. `opportunity_created`
3. `lead_brief_generated`
4. `discovery_intelligence_generated`
5. `proposal_draft_generated`
6. `followup_generated`
7. `upgrade_clicked`
8. `subscription_activated`

### 核心模块
#### 区块 A：Funnel Main View
- 各节点完成对象数
- 节点间转化率
- 起点到终点的整体转化表现

#### 区块 B：Time Range
- `7d`
- `30d`
- custom range（P1）

#### 区块 C：P1 Reserved Dimension Switch
- by user
- by workspace
- by acquisition method

### 主 CTA
- Change Time Range

### 关键状态
- normal
- insufficient data
- query failed

### 主要交互
- 切换时间范围
- 查看各节点转化率
- 后续可支持点击节点跳转到过滤后的 Workspaces 列表（增强项）

### 设计约束
- 首版 funnel 的正式对象是 workspace，不是 user。
- `signup_completed` 不得出现在默认 workspace 主漏斗中。
- 页面需要帮助用户识别流失位置，而不是堆叠复杂分析控件。
- 如未来加入 user funnel，必须在 UI 上显式切换对象维度，不能默认混排。

### Pencil 设计提示
- 首版重点是“解释流失位置”，不是“做复杂分析台”。
- 漏斗图与文字说明的组合优先于复杂组合图。
- 数据不足时要明确提示“当前数据不足以形成稳定判断”。

### 必须避免
- 不要混用 user-level 与 workspace-level 指标。
- 不要把漏斗页做成复杂分析工作台。
- 不要默认加入 P1 维度切换与跳表功能。

---

## 8. 全局组件清单（供 Pencil 与 Codex 对齐）

| 组件 | 用途说明 |
| --- | --- |
| Admin Nav Item | 主导航入口，需有 default / active / hover / collapsed（如支持）状态 |
| Metric Card | Overview 的规模 / 增长 / 转化指标卡 |
| Window Switcher | `7d / 30d` 时间范围切换 |
| Filter Bar | 列表页统一筛选区，支持 query、status、date、sort |
| Query Chip | quick filter / query context 展示 |
| Status Badge | trial / billing / active / restricted / expiring soon 等状态标签 |
| Attention Card | Overview 提醒区与高优先异常对象提示 |
| Data Table | Workspaces / Users / Subscriptions 列表 |
| Empty State Block | 空结果 / 数据不足说明 |
| Error State Block | 查询失败 / retry |
| Detail Summary Panel | Workspace Detail 顶部 summary 区 |
| Usage Summary Block | Workspace Detail usage snapshot |
| Activity Timeline | Workspace Detail 关键行为时间线 |
| Support Callout | 权限不足、限制说明、对象不存在等 |

---

## 9. 页面状态与异常设计要求

所有关键页面至少应设计以下状态：
- loading
- empty
- error
- insufficient data
- unauthorized / forbidden

补充要求：
- A01 必须单独设计：登录失败、无权限、会话失效。
- A02 必须单独设计：数据不足，不展示误导性空转化判断。
- A03 / A05 / A07 必须单独设计：无匹配结果、查询失败、保留筛选条件。
- A04 必须单独设计：对象不存在、summary 可见但部分数据不足的简化视图。
- A08 必须单独设计：数据不足说明态，明确“当前数据不足以形成稳定判断”。
- 任何查询失败都不应打断主导航继续切换。

---

## 10. 文案与本地化要求

- 设计稿中的标题、按钮、字段名优先使用英文样例文案。
- 英文文案长度应按真实 admin 产品预留。
- 时间、日期、状态名、时间范围要统一格式。
- 若需出中文评审版，可在注释层保留中文解释，不建议主界面混用中英。
- admin 端语气应专业、客观、简洁，不使用营销式表达。

---

## 11. Pencil 交付要求

- Admin sitemap
- 主页面方案（desktop first）
- 关键状态方案（loading / empty / error / insufficient data / forbidden / not found）
- 页面级注释：模块名称、交互说明、信息层级
- 可复用组件标注：指标卡、筛选栏、表格、状态标签、提醒卡、时间线、support state block
- 视觉规范摘要：色板、文字层级、圆角、间距、icon 用法
- 给 Codex 的实现提示：哪些模块可共用、哪些页面是同组件变体、哪些 query params 需要保留

建议 refinement 顺序：
1. 先出 **Admin sitemap + Overview wireframe**
2. 再出 **Workspaces List + Workspace Detail**
3. 再出 **Subscriptions / Trials + Funnel Analytics**
4. 最后补 **Users List** 与 **User Detail 预留结构**

---

## 12. 设计验收标准（你审核时看什么）

- 是否一眼能看出这是内部运营管理端，而不是客户侧产品、CRM 或运维后台。
- Overview 是否能在 30–60 秒内说明：平台规模、近期增长、激活、工作流完成与商业状态。
- Workspaces List 是否能快速筛出高价值 / 异常 workspace。
- Workspace Detail 是否足够支撑“是否已激活、是否在使用、是否有付费信号”的判断。
- Users List 是否明确承担“检索与追踪”，而不是复杂用户管理。
- Subscriptions / Trials 是否把 trial / billing / restriction 三者关系解释清楚，而不是只显示状态名。
- Funnel Analytics 是否清楚表达 workspace 主漏斗，而没有混入 user-level 口径。
- 所有页面是否坚持只读优先，没有被设计成高风险操作后台。
- 所有页面是否为英文长度、统一过滤协议、后续 Codex 实现留出空间。

---

## 结论

这份 Brief 的目标不是让 admin 页面更“华丽”，而是让 Pencil 更快产出一套 **结构清楚、口径一致、便于 Codex 实现** 的运营端页面方案。

首版 admin 设计的正确方向是：
- 先建立 **独立入口 + 稳定主导航 + 可扫描列表 + 可判断详情 + 轻量漏斗视图**
- 优先保证 **数据正确、状态解释一致、查询路径清楚**
- 不让 admin 端过早演变为复杂 BI、CRM 或高风险运营后台
