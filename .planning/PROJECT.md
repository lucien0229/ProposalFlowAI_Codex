# ProposalFlow AI

## What This Is

ProposalFlow AI 是一款面向小型服务型团队的 AI pre-proposal workflow copilot，帮助团队把零散的售前信息整理成结构化、可复核、可编辑的 proposal-ready draft。

它的产品主线是 opportunity-centered：从 Lead Intake 开始，依次进入 Lead Brief、Discovery Intelligence、Proposal Draft 和 Follow-up，最终交付可上线的 customer-side MVP，而不是规格说明页或内部工具页。

## Core Value

把碎片化售前信息变成可以持续推进、可以回看版本、可以解释限制原因的 proposal-ready 工作流。

## Requirements

### Validated

(None yet — ship to validate)

### Active

- Customer-side MVP 必须交付为 shipping UI，而不是 rendered specification page。
- 主链路必须围绕 `Opportunity / Lead Intake → Lead Brief → Discovery Intelligence → Proposal Draft → Follow-up` 闭环推进。
- 需要正式落实 current resource、version history 和 restore 语义，且不能无提示覆盖用户编辑内容。
- Billing / Trial / restriction_reason / 只读限制矩阵必须在产品与 API 两侧同时成立。
- 工程必须采用单仓 monorepo，并严格区分 `apps/web`、`apps/admin`、`apps/api`、`apps/worker` 与共享 packages。
- Admin 端本轮只做边界预留或最小占位，不作为首发主体。

### Out of Scope

- e-sign、正式报价引擎、支付回款流程、CRM、BI 平台、客服后台、运维监控面板、批量风险写操作。
- 复杂多租户权限矩阵、微服务拆分、复杂事件总线、向量检索或独立 analytics 数据仓。
- 把 admin 端塞进 web，或者把 admin 端做成首发主线。
- 把 customer-facing page 做成 spec sheet、contract sheet、QA checklist。

## Context

- `/docs` 下的文档是冻结事实源，后续实现不得擅自扩 scope 或改写产品边界。
- `DESIGN.md` 是唯一的 UI 设计规范与前端开发规范，customer-facing UI 必须按它来落地。
- 后端采用一套共享平台底座，但在代码层必须区分 product API、admin API 与 shared platform services。
- 数据层使用单 PostgreSQL 主库，不拆 product DB / admin DB。
- 环境必须按 `local / staging / production` 三层设计，部署对象统一为 `web / admin / api / worker`。
- `current resource / version history / restore`、`billing / trial / restriction_reason`、`read-only restriction matrix` 都是正式产品语义，不是附带说明。

## Constraints

- **Source of Truth**: 冻结文档以 `/docs` 为唯一事实来源，不能靠猜测补产品边界。
- **Repo Shape**: 必须是单仓 monorepo，且目录边界固定为 `apps/web`、`apps/admin`、`apps/api`、`apps/worker`、`packages/shared-types`、`packages/shared-schemas`、`packages/shared-config`。
- **UI Standard**: customer-facing 页面必须输出 shipping UI，shared states 只是正式产品状态，不是规格说明层。
- **Data Model**: 单 PostgreSQL 主库，`workspace` 是最小租户边界，`opportunity` 是核心业务容器。
- **Deployment**: local / staging / production 必须同构设计，staging 不能跳过，不能直接按 production 思路硬推。
- **Integrations**: Auth、OpenAI、Stripe、文件处理和 worker 都必须纳入实施计划。
- **Admin Boundary**: admin 只能作为独立入口和边界预留存在，不能混入 customer web。

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 单仓 monorepo + `apps/web` / `apps/admin` / `apps/api` / `apps/worker` | 共享类型、schema、鉴权、部署基线，且便于 0→1 交付 | Pending |
| 单 PostgreSQL 主库 | 保持事务一致性并降低 MVP 复杂度 | Pending |
| customer-side 采用 opportunity-centered 闭环 | 真实任务是推进单个售前机会，而不是打开一堆 AI 页面 | Pending |
| customer-facing 页面必须是 shipping UI | 删除 route/API/acceptance 文本后页面仍然成立，才算产品化 | Pending |
| admin 端首发只做边界预留 | 防止 admin 抢占 customer MVP 的交付和验证资源 | Pending |

---
*Last updated: 2026-04-08 after new-project initialization*
