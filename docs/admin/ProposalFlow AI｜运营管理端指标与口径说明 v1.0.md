# ProposalFlow AI｜运营管理端指标与口径说明 v1.0

## 1. 文档目的

本文档用于定义 ProposalFlow AI 运营管理端首版所使用的关键指标、统计对象、时间窗口、分子分母、去重规则与使用原则，确保不同页面、不同角色、不同接口对同一指标有一致解释。

本文档不规定具体 UI 图表样式，也不替代页面文档；其职责是明确“数据是什么意思、怎么数、哪些口径不能混用”。

## 2. 适用范围

适用于运营管理端的 Overview、Workspaces、Users、Subscriptions / Trials、Funnel Analytics 页面，以及对应 admin API、测试验收与数据校对流程。

## 3. 核心定义与术语

### 3.1 User

平台业务用户实体，对应 `users` 表单个用户记录。

### 3.2 Workspace

平台租户实体，是首版商业化与使用判断的核心统计对象。

### 3.3 Active Workspace

在指定时间窗口内，至少产生 1 次关键使用行为的 workspace。

首版关键使用行为包括以下任一事件：

- `opportunity_created`
- `lead_brief_generated`
- `discovery_intelligence_generated`
- `proposal_draft_generated`
- `followup_generated`
- `export_clicked`
- `copy_clicked`

说明：仅登录不计入 active workspace。

### 3.4 Activated Workspace

新建 workspace 在创建后 7 天内，至少完成 1 次 `proposal_draft_generated`，则计为 Activated Workspace。

### 3.5 Workflow Completion

在指定时间窗口内，workspace 至少完成 1 次 Opportunity → Lead Brief → Discovery Intelligence → Proposal Draft 的主流程闭环。

### 3.6 Paid Workspace

在统计时点或统计窗口内，`billing_status = active` 的 workspace。

### 3.7 Trial Active Workspace

`trial_status = active` 的 workspace。

### 3.8 Trial Expired Workspace

`trial_status = expired` 且 `billing_status != active` 的 workspace。

## 4. 口径总原则

### 4.1 以 workspace 为主统计对象

除特别说明外，首版核心指标优先以 workspace 为统计对象，而不是 user。用户数更多用于规模判断；激活、主流程完成、订阅、付费、留存等指标优先采用 workspace 口径。

### 4.2 使用系统内部状态作为正式口径

涉及试用与订阅的正式口径，应优先使用系统内部字段，不直接以前端对第三方原始对象的解释为准。正式字段包括：

- `trial_status`
- `billing_status`
- `plan_type`
- `current_period_end`

### 4.3 事件与业务表聚合并用

首版指标建议基于 `activity_logs` 的关键事件与核心业务表联合计算，不要求单独建设复杂 BI 系统或独立 analytics 数据仓。

### 4.4 同一指标不得跨对象混用

不得将 user 级指标直接并入 workspace 级转化分母链路，也不得将事件总次数与完成该节点的 workspace 数混作同一指标名称。

### 4.5 所有窗口型指标必须明确时间范围

首版统一支持：

- 今日
- 近 7 天
- 近 30 天
- 自定义时间范围（增强项）

凡是“新增、转化、激活、留存、完成率”类指标，页面和接口都必须明确时间窗口。

## 5. 冻结的关键口径决议

### 5.1 主漏斗起点

运营管理端主漏斗正式从 `workspace_created` 开始。

- `signup_completed` 不进入 workspace 主漏斗分母链路
- 如页面仍展示 `signup_completed`，必须标注为 user-level 指标或独立 user funnel 起点

### 5.2 `workflow_completion_rate` 分母

首版正式主展示口径固定为：

`workflow_completion_rate = 完成主流程闭环的 workspace 数 / Activated Workspaces`

说明：

- `New Workspaces` 不再作为默认主展示分母
- 该指标在首版更适合作为 secondary metric 单独标注。

### 5.3 Overview 指标命名、统计对象与时间窗口

Overview 页面指标必须遵守以下规则：

- 指标名称须体现对象属性或时间窗口，避免歧义
- 规模类指标按累计时点口径展示
- 新增类、转化类指标按查询窗口展示
- 核心转化指标默认按 workspace 口径

建议命名示例：

- `Total Users`
- `Total Workspaces`
- `New Users (7d)`
- `New Workspaces (7d)`
- `Activation Rate (7d)`
- `Workflow Completion Rate (7d)`
- `Trial to Paid Conversion Rate (30d)`

### 5.4 过滤参数协议

列表类 admin 页面和接口统一采用以下过滤参数：

- `q`
- `trial_status`
- `billing_status`
- `plan_type`
- `auth_method`
- `created_from`
- `created_to`
- `active_from`
- `active_to`
- `sort_by`
- `sort_direction`
- `cursor`
- `limit`

指标与聚合查询统一采用：

- `from`
- `to`

### 5.5 订阅限制字段属于首版

为保证 admin 与客户侧对限制解释一致，Subscriptions / Trials 相关展示与接口首版应补充：

- `is_generation_allowed`
- `restriction_reason`

## 6. 基础规模指标

### 6.1 Total Users

定义：当前系统用户总数。

- 统计对象：user
- 去重主键：`user_id`
- 统计方式：截至统计时点累计值

### 6.2 Total Workspaces

定义：当前系统 workspace 总数。

- 统计对象：workspace
- 去重主键：`workspace_id`
- 统计方式：截至统计时点累计值

### 6.3 New Users

定义：指定时间窗口内新创建的用户数。

- 统计对象：user
- 去重主键：`user_id`
- 统计条件：`created_at` 落在时间窗口内

### 6.4 New Workspaces

定义：指定时间窗口内新创建的 workspace 数。

- 统计对象：workspace
- 去重主键：`workspace_id`
- 统计条件：`created_at` 落在时间窗口内

## 7. 试用与订阅指标

### 7.1 Trial Active Workspaces

定义：当前或指定时间点 `trial_status = active` 的 workspace 数。

### 7.2 Trial Expired Workspaces

定义：当前或指定时间点 `trial_status = expired` 的 workspace 数。

### 7.3 Paid Workspaces

定义：当前或指定时间点 `billing_status = active` 的 workspace 数。

### 7.4 Past Due Workspaces

定义：当前或指定时间点 `billing_status = past_due` 的 workspace 数。

### 7.5 Canceled Workspaces

定义：当前或指定时间点 `billing_status = canceled` 的 workspace 数。

### 7.6 Expiring Soon Workspaces

定义：当前或指定时间点，`trial_end_at` 或 `current_period_end` 距离当前小于预设阈值的 workspace 数。

首版建议阈值：

- 试用即将到期：7 天内
- 订阅周期即将结束：7 天内

说明：页面必须区分“试用即将到期”与“订阅周期即将结束”，两者不可混淆。

### 7.7 Billing 限制矩阵说明

首版限制解释建议按如下状态理解：

- `trial_active`：可完整使用
- `trial_expired`：计入试用过期，默认不再计入可生成对象
- `paid_active`：计入 paid
- `past_due`：计入 past due，保留商业信号，但不计入 active paid
- `canceled`：计入 canceled，不计入 active paid

对应限制解释应由 `is_generation_allowed` 与 `restriction_reason` 明确承载。

## 8. 激活与主流程指标

### 8.1 Activation Rate

定义：新建 workspace 在创建后 7 天内至少完成 1 次 `proposal_draft_generated` 的占比。

- 统计对象：workspace
- 分子：在创建后 7 天内触发 `proposal_draft_generated` 的新 workspace 数
- 分母：同一统计窗口内新创建的 workspace 数

公式：

`activation_rate = Activated Workspaces / New Workspaces`

说明：该指标用于判断新建 workspace 是否真正接近核心价值兑现。

### 8.2 Workflow Completion Rate

定义：指定时间窗口内，完成主流程闭环的 workspace 在 Activated Workspaces 中的占比。

- 统计对象：workspace
- 分子：完成主流程闭环的 workspace 数
- 分母：Activated Workspaces

公式：

`workflow_completion_rate = Workflow Completed Workspaces / Activated Workspaces`

### 8.3 Proposal Draft Generated Workspaces

定义：指定时间窗口内，至少触发过 1 次 `proposal_draft_generated` 的 workspace 数。

### 8.4 Follow-up Generated Workspaces

定义：指定时间窗口内，至少触发过 1 次 `followup_generated` 的 workspace 数。

## 9. 漏斗指标

### 9.1 首版正式 workspace 漏斗节点

首版建议按以下顺序定义 workspace 主漏斗：

1. `workspace_created`
2. `opportunity_created`
3. `lead_brief_generated`
4. `discovery_intelligence_generated`
5. `proposal_draft_generated`
6. `followup_generated`
7. `upgrade_clicked`
8. `subscription_activated`

### 9.2 辅助 user-level 节点

`signup_completed` 可作为 user-level 指标或独立 user funnel 起点，但不得混入 workspace 主漏斗。

### 9.3 节点完成定义

- `signup_completed`：用户完成注册
- `workspace_created`：成功创建 workspace
- `opportunity_created`：至少创建 1 个 opportunity
- `lead_brief_generated`：至少完成 1 次 Lead Brief 生成
- `discovery_intelligence_generated`：至少完成 1 次 Discovery Intelligence 生成
- `proposal_draft_generated`：至少完成 1 次 Proposal Draft 生成
- `followup_generated`：至少完成 1 次 Follow-up 生成
- `upgrade_clicked`：触发过升级入口点击
- `subscription_activated`：进入 `billing_status = active` 或出现明确支付成功内部状态

### 9.4 转化率定义

相邻节点转化率：

`当前节点完成对象数 / 上一节点完成对象数`

整体漏斗转化率：

`指定节点完成对象数 / 漏斗起点对象数`

## 10. 留存指标

### 10.1 留存对象

首版留存建议以 workspace 为主。

### 10.2 Week 3 Retention Rate

定义：激活后的第 3 周，仍存在关键使用行为的 activated workspace 占比。

- 统计对象：workspace
- 分子：激活后第 3 周仍有关键使用行为的 activated workspaces 数
- 分母：activated workspaces 数

说明：仅登录不应视为 retained。

## 11. 使用深度指标

### 11.1 Opportunities per Workspace

定义：指定时间窗口内，每个 workspace 平均创建的 opportunity 数。

公式：

`总 opportunities 数 / Active Workspaces`

### 11.2 Proposal Drafts per Workspace

定义：指定时间窗口内，每个 workspace 平均生成的 Proposal Draft 数。

说明：首版需明确展示的是事件次数还是去重后的 draft 数；页面不得混用。

### 11.3 Multi-Opportunity Workspace Rate

定义：指定时间窗口内，至少处理过 3 个不同 opportunities 的 activated workspace 占比。

- 分子：处理过 3 个及以上不同 opportunity 的 activated workspace 数
- 分母：activated workspace 数

## 12. 商业化指标

### 12.1 Trial to Paid Conversion Rate

定义：指定观察窗口内，从 trial workspace 转化为 active paid workspace 的占比。

公式：

`trial_to_paid_conversion_rate = 在观察窗口内转为 billing_status = active 的 trial workspaces 数 / 在同一观察窗口内进入 trial 的 workspaces 数`

说明：

- 页面必须注明观察窗口
- 不得用累计 paid / 累计 trial 代替正式转化率

### 12.2 Upgrade Click Rate

定义：指定时间窗口内，点击升级入口的 activated workspaces 占比。

### 12.3 Subscription Activation Rate

定义：指定时间窗口内，进入 paid active 状态的 workspace 占比。

如页面已展示 `Trial to Paid Conversion Rate`，必须明确两者差异，避免重复表达同一口径。

## 13. 时间口径与去重规则

### 13.1 时间口径

所有趋势、漏斗、转化、留存相关页面必须明确：

- 统计窗口
- 是按事件发生时间统计，还是按对象创建时间统计

### 13.2 去重规则

首版默认去重优先级如下：

- 用户相关指标：去重 `user_id`
- workspace 相关指标：去重 `workspace_id`
- opportunity 相关指标：去重 `opportunity_id`
- 漏斗页面：默认去重 `workspace_id`，除非页面明确为 user-level funnel

### 13.3 事件重复处理

若同一 workspace 在窗口内多次触发同一事件：

- 对“是否完成某节点”的漏斗统计，按去重 workspace 计 1 次
- 对“事件总次数”类行为量指标，可按事件条数统计

## 14. Overview 页面映射建议

Overview 页面建议优先使用以下指标：

- `Total Users`
- `Total Workspaces`
- `Active Workspaces`
- `Paid Workspaces`
- `Trial Active Workspaces`
- `Trial Expired Workspaces`
- `New Users (7d)`
- `New Workspaces (7d)`
- `Activation Rate (7d)`
- `Workflow Completion Rate (7d)`
- `Trial to Paid Conversion Rate (30d)`

页面必须在必要处提供简短口径提示，至少明确：

- 统计对象
- 时间窗口
- 关键分母定义

## 15. 与其他文档的关系

- 本文档承接《运营管理端 PRD》中定义的产品范围和统一决议
- 本文档为《运营管理端页面流程与信息架构说明》《页面清单与页面级需求》《API 需求说明》提供统一口径基线
- 页面文档不得另行发明与本文档冲突的指标定义
- API 文档中的聚合接口与字段解释必须与本文档保持一致

## 16. 已冻结决策

### 16.1 `discovery_added` 与 `discovery_intelligence_generated` 的关系

- `discovery_added` 作为辅助行为事件保留
- `discovery_intelligence_generated` 作为主漏斗正式节点
- 首版 workspace 主漏斗不使用 `discovery_added`

### 16.2 `Proposal Drafts per Workspace` 的正式分子定义

首版按事件次数统计：

`Proposal Drafts per Workspace = 指定时间窗口内的 proposal_draft_generated 事件总次数 / Active Workspaces`

### 16.3 Week 3 Retention 的首版范围

Week 3 Retention 首版仅保留文档定义，不进入 P0 页面展示，也不作为 P0 API 必出字段。

## 17. 结论

ProposalFlow AI 运营管理端首版指标体系应坚持 workspace 视角优先、内部状态优先、事件与业务表联合聚合、时间窗口明确、分母分子清晰的原则。首版目标不是堆叠复杂分析，而是建立一套稳定、可信、可复用的业务判断框架。
