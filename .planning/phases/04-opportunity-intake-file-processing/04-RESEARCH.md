# Phase 04: opportunity-intake-file-processing - Research

**Researched:** 2026-04-09
**Domain:** Opportunity intake workflow, asynchronous PDF extraction, and Lead Brief handoff
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Opportunity container and page structure
- **D-01:** Phase 4 must make `/opportunities/:opportunityId/overview` feel like the top of a real opportunity container, not a placeholder detail page or standalone form screen.
- **D-02:** The page must preserve the Phase 3 global customer shell and add a stable opportunity context header plus stepper for `Lead Intake`, `Lead Brief`, `Discovery`, `Proposal Draft`, and `Follow-up`.
- **D-03:** The intake screen uses a two-column working layout on desktop/laptop: the left side is the input/source workspace, and the right side is the structured minimum-field and action workspace. This should not be a symmetric 50/50 split; source content gets more room.
- **D-04:** The page hierarchy is fixed as: opportunity header, workflow stepper, intake working surface, then recovery/helpful secondary notices. Do not bury the stepper or primary action below long form content.

### Intake information architecture
- **D-05:** The intake surface must be organized around two distinct concepts: `source material` and `minimum opportunity context`. Do not blend extracted text, freeform raw input, and business fields into one undifferentiated form.
- **D-06:** The left/source side must include `raw input`, PDF upload, file/extraction state, and extracted-text preview. The right/context side must include the minimum editable fields needed to start the workflow.
- **D-07:** The minimum editable fields for Phase 4 are `title`, `company_name`, `contact_name`, `contact_email`, and `requested_service`, plus a visible `source_type`. `owner` remains visible as context metadata and defaults to the current user; Phase 4 does not introduce assignment-management UX.
- **D-08:** `title` may be suggested from source material, but the suggestion must never silently overwrite the user's text. Any auto-suggested title should be applied only through an explicit user action or stay as a non-destructive default before manual editing begins.
- **D-09:** `raw_input` is a first-class editable resource, not a temporary upload note. It must support long text comfortably and remain readable after save/refresh.

### Save semantics and editing model
- **D-10:** `Generate Lead Brief` is the only primary CTA on this page. `Save opportunity` is secondary and must not compete with the generation action in visual weight.
- **D-11:** The product should behave as draft-preserving by default: field edits and raw input changes should autosave or save with low friction, while the explicit save action serves as a user-trust and retry anchor rather than the only persistence path.
- **D-12:** Validation should be strict where it protects real flow quality, but not so strict that the page becomes a dead form. `contact_email` validates only when present; missing optional fields should not block save.
- **D-13:** Save failures must surface inline on the page near the working surface or action area. They cannot rely on transient toast-only feedback.

### File processing and recovery behavior
- **D-14:** PDF upload is an augmentation path, not a hard prerequisite. Users must be able to continue editing raw input and minimum fields while a file is processing.
- **D-15:** File states are locked to the API/doc contract: `uploaded`, `processing`, `ready`, and `failed`, and each state must have a distinct visible UI treatment on the page itself.
- **D-16:** When a file reaches `ready`, the page must expose extracted text preview in the intake workspace so users can verify what the system captured before moving on.
- **D-17:** When a file reaches `failed`, the page must keep the user moving: show a visible retry CTA and keep manual raw-input entry usable without forcing the file path to recover first.
- **D-18:** Retry must be explicit and job-based, matching the API contract. The product should treat retry as a new processing attempt, not as hidden replacement of prior failure history.
- **D-19:** File state must never be represented only by a tiny badge, icon, or toast. Worker latency is expected, so the page must always explain what is happening and what the user can do next.

### Lead Brief generation gate and blocked semantics
- **D-20:** `Generate Lead Brief` is allowed only from a valid opportunity context with sufficient intake input. The gate should be strict enough to prevent empty generations but permissive enough to preserve workflow momentum.
- **D-21:** Recommended minimum generation gate for Phase 4: `title`, `company_name`, and `requested_service` are present, and either `raw_input` contains meaningful text or a file extraction has produced usable text. A processing file alone is not sufficient.
- **D-22:** File `ready` is not a universal hard dependency. If the user has already provided sufficient manual raw input, generation may proceed even when a PDF has failed or is absent.
- **D-23:** Blocked states for Lead Brief generation must explain the exact missing condition in product language, such as missing intake details, insufficient source text, or file still processing. A disabled button without explanation is not acceptable.
- **D-24:** Successful generation should hand off directly into the Lead Brief workspace rather than leaving the user on Overview to figure out the next move.

### Product UI quality bar
- **D-25:** The page must continue the Phase 1 and Phase 3 dark, calm, Linear-inspired workflow console language from `DESIGN.md`; do not switch to a bright form-builder or marketing-style upload page.
- **D-26:** The intake surface should feel like a working desk for one opportunity: restrained panels, dense-but-readable text, minimal chrome, one indigo accent, and no heavy dashboard-card mosaic.
- **D-27:** File state, readiness, and blocker semantics must use text + iconography + color together. Do not rely on color alone for success, warning, or failure.
- **D-28:** ProposalFlow AI in Phase 4 is a web app only. Planning and implementation should target desktop and standard laptop browser widths only, and must not spend scope on mobile or tablet product layouts, navigation patterns, or touch-first interaction design.

### Backend and workflow contract
- **D-29:** The opportunity detail resource must expand beyond Phase 3 list/detail metadata to serve the overview page as a real workflow container: opportunity fields, current workflow summary, step readiness, and generation restriction context belong in the API response shape.
- **D-30:** Intake inputs and file processing should follow the explicit opportunity-scoped API surface in the frozen API doc: opportunity detail/update, inputs CRUD-lite, file upload URL, upload completion, file detail polling, and explicit retry.
- **D-31:** PDF extraction remains asynchronous through the worker, while Lead Brief generation stays synchronous request-response in MVP. The UI must reflect that split clearly.
- **D-32:** Phase 4 should create the clean handoff seam to Phase 5: the overview page owns intake readiness and trigger intent, while Lead Brief owns structured output, version history, and downstream editing semantics.

### Claude's Discretion
- Exact placement of secondary helper copy, extracted-text preview formatting, and file-state iconography as long as the hierarchy above remains intact.
- Whether the intake page uses subtle inline autosave indicators, save timestamps, or quiet success messaging, as long as persistence behavior stays trustworthy and non-disruptive.
- The exact visual treatment of the stepper and action bar, provided they remain stable, readable, and visibly part of the opportunity container.

### Deferred Ideas (OUT OF SCOPE)
- Full assignment management or reassignment workflows for opportunity owners.
- Opportunity activity summary and richer collaboration context on the overview page.
- Advanced document reconstruction, OCR-heavy file intelligence, or multi-file document management beyond the MVP extraction/status model.
- Mobile or tablet-specific opportunity workspace design.
- Pulling any Lead Brief structured output or version-history UI into the intake surface.

### Additional Direct Instructions (from current request)
- Use TDD for implementation: no production code without failing tests first.
- UI/UX must be shipping-grade and use skills rigorously; a UI-SPEC already exists at `.planning/phases/04-opportunity-intake-file-processing/04-UI-SPEC.md`.
- Success means full productization: complete UI/UX, frontend/backend integration, loading/empty/error/blocked/retry/success states, file recovery, and browser-side verification.
- Product is web app only; do not include mobile or tablet layouts.
- Research should identify data model changes, API surface, worker/file-processing design, backend/frontend seams, state modeling, and verification strategy needed to execute this phase safely.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OPP-02 | Each opportunity has a single container for intake and downstream work instead of separate disconnected pages. | Opportunity detail must become a richer overview container with header, stepper, step readiness, generation gate, and redirect handoff to `/lead-brief`. |
| INTAKE-01 | Opportunity overview captures raw input and the minimum opportunity fields needed to start the workflow. | Use a split data model: editable opportunity fields plus primary `opportunity_inputs` resource for manual source text. |
| INTAKE-02 | PDF upload processing exposes the states `uploaded`, `processing`, `ready`, and `failed`, and supports retry. | Use `file_assets` + `file_processing_jobs`, direct upload URL, explicit `complete`, polling, and explicit retry that creates a new job record. |
| INTAKE-03 | Lead Brief generation can only be triggered from a valid opportunity context with intake inputs present. | Add server-derived `generation_gate` semantics to detail response and enforce identical gate in API and browser. |
</phase_requirements>

## Summary

Phase 04 should be planned as a cross-cutting workflow seam, not a single page task. The frozen docs consistently require four things to land together: a real opportunity container UI, a durable intake data model, an asynchronous file-processing pipeline with visible recovery, and a synchronous Lead Brief handoff that respects intake readiness. Planning only the surface page will fail because the page depends on richer opportunity detail responses, new persistence tables, a real worker queue, and browser-safe upload semantics.

The safest implementation path is incremental and aligned with the current codebase. Keep the overview route server-rendered for auth/bootstrap and initial fetch, move the editable intake desk into a client component, use React Hook Form + Zod for draft-preserving form state, and use TanStack Query for mutations plus file-status polling. On the backend, extend the current service/repository seam instead of doing a full architecture rewrite, but add dedicated routers and services for `inputs`, `files`, and `lead-brief/generate` so the API surface matches the frozen docs.

The largest planning risk is repo drift rather than product ambiguity. The current branch already shows missing shared opportunity types, missing `lucide-react` dependency declarations despite imports, a minimal `product.py` router that does not yet expose the opportunity endpoints the tests expect, broken pytest fixture coverage, and no installed Playwright CLI. Phase planning should explicitly include a Wave 0 baseline repair for test/bootstrap gaps if these branch conditions still exist when execution starts.

**Primary recommendation:** Keep the repo-pinned framework versions, add React Query + React Hook Form + Zod on the frontend and Redis + RQ + pypdf + boto3 on the backend, and implement the phase around `opportunity_inputs` + `file_assets` + `file_processing_jobs` with explicit upload-complete-poll-retry semantics.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | repo-pinned `15.5.2` | Web route shell, App Router, SSR bootstrap | Already drives guarded business routes and server-side auth bootstrap. Upgrading to latest `16.2.3` is out of scope for this phase. |
| React | repo-pinned `19.1.1` | Client UI and interactive intake desk | Already pinned in the repo. Upgrading to latest `19.2.5` would add unrelated risk. |
| FastAPI | repo floor `>=0.115.0` | Product API and route guards | Current backend framework. Latest verified is `0.135.3`, but a framework upgrade is not required to land Phase 04 safely. |
| SQLAlchemy + Alembic | repo floors `>=2.0.0` / `>=1.13.0` | Persistence model and migrations | Already the repo’s persistence baseline and the right place to add intake/file tables. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tanstack/react-query` | `5.97.0` | Mutation state, cache invalidation, file-status polling | Use for detail refresh, autosave mutations, retry, and terminal-state-aware polling. |
| `react-hook-form` | `7.72.1` | Low-rerender form state for the intake desk | Use for the right-column editable fields and long-form raw input state. |
| `zod` + `@hookform/resolvers` | `4.3.6` + `5.2.2` | Shared validation for browser + API-friendly payload shaping | Use for optional-email validation, meaningful-text checks, and DTO coercion. |
| `redis` + `rq` | `7.4.0` + `2.7.0` | Durable queueing for async PDF extraction | Use for `complete` enqueue, explicit retry, and testable worker execution. |
| `pypdf` | `6.9.2` | PDF text extraction | Use for MVP text extraction only. It does not solve OCR, which is out of scope. |
| `boto3` | `1.42.86` | S3-compatible presigned upload URLs and object retrieval | Use for upload URL creation and worker-side object fetches. |
| `lucide-react` | `1.8.0` | Stepper, status, and file-state iconography | The UI spec and current components already assume it; the package declaration just needs to be made explicit. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TanStack Query | ad hoc `useEffect` + local state | Faster to start, but worse for polling stop conditions, mutation state, invalidation, and retry/error consistency. |
| Redis + RQ worker | FastAPI `BackgroundTasks` | Simpler, but not durable enough for explicit retry/history/polling semantics. FastAPI docs explicitly point heavier or distributed work toward bigger tools. |
| `pypdf` text extraction | OCR stack (`ocrmypdf`, Tesseract, cloud OCR) | Better for scanned PDFs, but materially expands scope beyond the frozen MVP boundary. |
| direct-to-storage presigned upload | proxying the full PDF through the API | Easier to reason about initially, but worse for large files, retry behavior, and object-storage contract fidelity. |

**Installation:**
```bash
pnpm --filter @proposalflow/web add @tanstack/react-query react-hook-form zod @hookform/resolvers lucide-react
python3 -m pip install redis rq pypdf boto3
```

**Version verification:** Verified on 2026-04-09 via the package registries.

| Package | Verified version | Registry publish / modified date |
|---------|------------------|----------------------------------|
| `@tanstack/react-query` | `5.97.0` | `2026-04-09T08:40:06.801Z` |
| `react-hook-form` | `7.72.1` | `2026-04-03T06:54:37.048Z` |
| `zod` | `4.3.6` | `2026-01-25T21:51:57.252Z` |
| `@hookform/resolvers` | `5.2.2` | `2025-09-14T08:30:01.130Z` |
| `redis` | `7.4.0` | `2026-03-24T09:14:37.530329Z` |
| `rq` | `2.7.0` | `2026-02-22T11:10:50.775968Z` |
| `pypdf` | `6.9.2` | `2026-03-23T14:53:27.983680Z` |
| `boto3` | `1.42.86` | `2026-04-09T01:00:47.129524Z` |

## Architecture Patterns

### Recommended Project Structure
```text
apps/
├── web/
│   ├── app/opportunities/[opportunityId]/[step]/page.tsx   # SSR shell for overview + later steps
│   ├── components/opportunities/overview/                  # page-local workspace components
│   ├── lib/opportunity-overview-api.ts                     # typed client calls for detail/update/input/file/generate
│   └── lib/opportunity-intake-state.ts                     # gate + view-model helpers
├── api/
│   ├── app/product.py                                      # mounts dedicated intake/file/generate routers
│   ├── app/opportunity_service.py                          # expand detail/update/gate logic
│   ├── app/opportunity_repository.py                       # opportunity + input/file reads/writes
│   ├── app/opportunity_models.py                           # add new tables or split into models modules
│   └── alembic/versions/                                   # schema changes for inputs/files/jobs
└── worker/
    ├── main.py                                             # queue worker boot
    └── tasks/file_processing.py                            # PDF extraction jobs
packages/
├── shared-types/                                           # opportunity detail DTOs + enums
└── shared-config/                                          # route names, query keys, status constants
tests/
├── api/                                                    # intake/file/generation gate tests
└── e2e/                                                    # overview workflow browser specs
```

### Pattern 1: SSR Shell, Client Workspace
**What:** Keep `/opportunities/[opportunityId]/[step]/page.tsx` as the auth/bootstrap and initial-data boundary, then hand the editable intake workspace to a client component.

**When to use:** Use for `overview` because the route needs server guards and shell continuity, but the intake desk needs live mutation state, autosave, and polling.

**Example:**
```tsx
// Source: current repo pattern + TanStack Query docs
export default async function OpportunityStepRoute({ params }: Props) {
  const { bootstrap, cookieHeader } = await requireBusinessContext("/opportunities")
  const { opportunityId, step } = await params
  const detail = await fetchOpportunityOverview(opportunityId, { cookieHeader })

  if (step !== "overview") {
    return <OtherOpportunityStep ... />
  }

  return (
    <ProductShell ...>
      <OpportunityOverviewWorkspace
        initialDetail={detail}
        opportunityId={opportunityId}
        workspaceName={bootstrap.workspace?.name ?? null}
      />
    </ProductShell>
  )
}
```

### Pattern 2: Separate Opportunity, Input, and File Resources
**What:** Keep editable opportunity fields, manual raw input, and uploaded-file processing as separate resources. Do not cram `raw_input`, extracted text, and file status into the `opportunities` table.

**When to use:** Always for this phase. The frozen database and API docs already separate `opportunity_inputs`, `file_assets`, and `file_processing_jobs`.

**Example:**
```python
# Source: frozen API + database docs
opportunity = get_opportunity(...)
primary_input = get_primary_input(...)
latest_file = get_latest_file_asset(...)

return {
    "opportunity": opportunity,
    "intake": {
        "primary_input": primary_input,
        "latest_file": latest_file,
        "generation_gate": build_generation_gate(opportunity, primary_input, latest_file),
    },
}
```

### Pattern 3: Upload URL -> Complete -> Enqueue -> Poll
**What:** Treat file upload and text extraction as a two-step workflow. Uploading bytes is not the same thing as starting extraction.

**When to use:** Use for every PDF upload. The API docs explicitly freeze `upload-url`, `complete`, `detail`, and `retry` as distinct actions.

**Example:**
```python
# Source: AWS S3 presign docs + frozen API/file-state docs
@router.post("/api/v1/opportunities/{opportunity_id}/files/upload-url")
def create_upload_url(...):
    file_asset = create_uploaded_file_asset(...)
    return {"file_asset_id": file_asset.id, "upload_url": presigned_put_url}

@router.post("/api/v1/opportunities/{opportunity_id}/files/{file_asset_id}/complete")
def complete_upload(...):
    verify_uploaded_object_exists(...)
    job = create_processing_job(status="pending")
    set_file_status(file_asset_id, "processing")
    queue.enqueue(process_pdf_text_extraction, job.id)
    return {"file_status": "processing", "latest_job_status": "pending"}
```

### Pattern 4: Server-Derived Generation Gate
**What:** Compute the generate gate on the server and return both `can_generate` and machine-readable reasons. Mirror that same logic in the browser only for immediate UX hints.

**When to use:** Always for the Generate Lead Brief CTA.

**Example:**
```typescript
// Source: frozen Phase 4 gate rules + page/state docs
type GenerationGate =
  | { can_generate: true; source: "manual" | "file" }
  | { can_generate: false; reason: "missing_fields" | "missing_source" | "file_processing" | "save_failed" }
```

### Anti-Patterns to Avoid
- **Flat detail DTOs:** The Phase 3 list-item shape is too small for Phase 4. Do not overload it until it becomes an ambiguous blob.
- **Toast-only async feedback:** Save failures and file-state changes must stay inline.
- **Background task in the request process:** Not durable enough for explicit retry history or page polling.
- **Silent source promotion:** Do not silently replace manual raw input or title with extracted PDF output.
- **Single error bucket:** `blocked`, `save_failed`, `file_failed`, and `page_load_failed` need different UI and API semantics.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form dirtiness + async resets | Custom reducer-based form engine | `react-hook-form` + `zod` | Async value resets, dirty tracking, and validation edge cases already exist. |
| Polling and mutation orchestration | `setInterval` + local booleans | `@tanstack/react-query` | It already handles cache invalidation, pending/error states, refetch intervals, and query disabling. |
| Durable background work | In-process background callbacks | `rq` + Redis | Explicit retry and pollable status need a real queue boundary. |
| PDF text extraction | DIY PDF parser | `pypdf` | MVP only needs extractable text, not custom PDF parsing. |
| Signed object uploads | Ad hoc signed-token scheme | S3-compatible presigned URLs via `boto3` | The storage contract, expiry, and header matching are solved problems. |

**Key insight:** The dangerous complexity in this phase is not the form fields. It is the interaction between autosave, source precedence, upload completion, worker latency, terminal file states, and generation gating. The planning goal is to keep those semantics explicit and centralized, not to save a dependency or two.

## Common Pitfalls

### Pitfall 1: Treating `complete` as a durable state
**What goes wrong:** The API and UI start treating `complete` as another file status and the state machine becomes inconsistent.

**Why it happens:** Upload completion feels like a status transition, but the frozen docs define it as an API action only.

**How to avoid:** Persist only `uploaded`, `processing`, `ready`, and `failed` on `file_assets`, and `pending`, `processing`, `succeeded`, and `failed` on jobs.

**Warning signs:** UI copy says “complete” or the database needs a `complete` enum to make the flow work.

### Pitfall 2: Using FastAPI `BackgroundTasks` for extraction
**What goes wrong:** File jobs become hard to retry, hard to inspect, and coupled to API worker lifecycle.

**Why it happens:** `BackgroundTasks` is tempting for “just run something after the response”.

**How to avoid:** Enqueue to Redis/RQ from the `complete` handler and let the worker own extraction.

**Warning signs:** Job history only exists in logs, or retry means “call the same endpoint again and hope”.

### Pitfall 3: Letting file readiness overwrite manual work
**What goes wrong:** A ready file silently changes title, raw input, or source selection, which breaks user trust.

**Why it happens:** Extraction success is treated as a higher-quality input automatically.

**How to avoid:** Keep extracted text preview separate, use explicit apply/suggest actions, and preserve manual primary input unless the user chooses otherwise.

**Warning signs:** The raw input textarea changes after polling completes.

### Pitfall 4: Making generation depend on `ready` even when manual text exists
**What goes wrong:** The CTA stays blocked after a failed file upload even though the user already entered enough raw input manually.

**Why it happens:** Teams gate on file state instead of usable source text.

**How to avoid:** Implement the server gate exactly as frozen: required fields plus meaningful manual text OR usable extracted text.

**Warning signs:** The UI keeps saying “wait for file processing” when the textarea already has content.

### Pitfall 5: Collapsing page states and file states into one error panel
**What goes wrong:** A failed file upload makes the whole page look broken, or a page-load error reuses file-failure copy.

**Why it happens:** Both are “errors”, but they belong to different scopes.

**How to avoid:** Keep opportunity-level states in `ProductStateBlock` and file-level states local to the upload module.

**Warning signs:** Retry buttons are ambiguous about whether they refetch the page, resave the form, or reprocess the file.

### Pitfall 6: Planning on today’s repo tests without repairing them first
**What goes wrong:** TDD gets declared but not actually practiced because the current API/browser test harness is not in a runnable state.

**Why it happens:** The repo has test files, but the infrastructure underneath them is incomplete.

**How to avoid:** Add a Wave 0 test-bootstrap task before any production work if the current branch still lacks fixtures, installed browser tooling, and queue test helpers.

**Warning signs:** `pytest` cannot collect API tests without manual `PYTHONPATH` fixes, or `pnpm exec playwright` is unavailable.

## Code Examples

Verified patterns from official sources:

### React Query polling that stops on terminal file states
```tsx
// Source: https://tanstack.com/query/latest/docs/framework/react/reference/useQuery
const fileQuery = useQuery({
  queryKey: ["opportunity-file", opportunityId, fileId],
  queryFn: () => getOpportunityFile(opportunityId, fileId),
  enabled: Boolean(fileId),
  refetchInterval: (query) => {
    const status = query.state.data?.file_status
    if (status === "ready" || status === "failed") return false
    return 2_000
  },
})
```

### React Hook Form with Zod and async-safe resets
```tsx
// Source: https://github.com/react-hook-form/documentation/blob/master/src/content/docs/useform.mdx
const form = useForm<IntakeForm>({
  resolver: zodResolver(intakeSchema),
  defaultValues: initialValues,
  resetOptions: {
    keepDirtyValues: true,
    keepErrors: true,
  },
})

useEffect(() => {
  form.reset(serverValues)
}, [serverValues, form])
```

### Queueing PDF extraction after explicit upload completion
```python
# Source: https://python-rq.org/ and https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html
def complete_file_upload(opportunity_id: str, file_asset_id: str) -> dict[str, str]:
    verify_uploaded_object(file_asset_id)
    job = create_file_processing_job(file_asset_id=file_asset_id, status="pending")
    set_file_status(file_asset_id, "processing")
    rq_queue.enqueue(process_pdf_text_extraction, job.id)
    return {"file_status": "processing", "latest_job_status": "pending"}
```

### Worker extraction with explicit non-OCR failure path
```python
# Source: https://pypdf.readthedocs.io/en/latest/user/extract-text.html
def process_pdf_text_extraction(job_id: str) -> None:
    job = start_job(job_id)
    pdf_bytes = download_uploaded_object(job.file_asset_id)
    reader = PdfReader(io.BytesIO(pdf_bytes))
    extracted = "\n".join(page.extract_text() or "" for page in reader.pages).strip()

    if not extracted:
        fail_job(job_id, "No extractable text found. OCR is not part of the MVP pipeline.")
        return

    persist_uploaded_pdf_input(job.file_asset_id, extracted)
    finish_job(job_id)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Page-local async state with `useEffect` timers | Query-library-managed polling and mutation state | TanStack Query v5 era | Cleaner polling stop conditions and fewer race conditions for file status and autosave. |
| In-process framework background callbacks | Durable queue + separate worker | Established before 2026 across FastAPI ecosystems | Necessary for retryable, inspectable background jobs. |
| Proxy uploads through app servers | Direct browser upload to object storage with presigned URL, then explicit completion | Common current S3-compatible pattern | Better matches object storage, lowers API load, and gives a clean enqueue seam. |
| “PDF extraction” implies OCR | Text extraction first, OCR as separate capability | Stable current practice | Avoids hidden OCR complexity in MVP; scanned PDFs should fail clearly, not silently. |

**Deprecated/outdated:**
- Treating `BackgroundTasks` as the durable async strategy for pollable file workflows. Official FastAPI guidance frames heavier, distributed work as a case for bigger tooling.
- Building page logic around a flat `OpportunityListItem` DTO. Phase 04 needs a richer detail contract.

## Open Questions

1. **How should manual raw input and ready file extraction coexist when both exist?**
   - What we know: docs separate `opportunity_inputs` from `file_assets`, and the UI must show both raw input and extracted preview.
   - What's unclear: whether Phase 4 should combine them automatically for generation or pick one source.
   - Recommendation: keep manual raw input as the primary editable source, keep uploaded PDF extraction as a separate linked input, and make source precedence explicit in the backend gate.

2. **How far should the API restructure go in this phase?**
   - What we know: frozen engineering docs want moduleized routers; the current repo still has a minimal `product.py`.
   - What's unclear: whether Phase 4 should do the full `app/api/product/*` reorg or just enough router extraction to land the feature safely.
   - Recommendation: do the minimum modularization needed now: add dedicated routers/services for opportunities, inputs/files, and lead-brief handoff, but do not turn Phase 4 into a large backend architecture migration.

3. **Can browser verification cover the true upload path in the current environment?**
   - What we know: web and API are reachable, PostgreSQL is up, Redis is not responding, and MinIO/object storage is not available locally.
   - What's unclear: whether execution will provision MinIO/S3-compatible storage before phase work starts.
   - Recommendation: plan both mocked browser coverage and a real end-to-end upload path only if object storage and Redis are brought up in Wave 0.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js web app, Playwright | ✓ | `v25.8.1` | — |
| pnpm | JS dependency install and scripts | ✓ | `10.33.0` | — |
| Python 3 | FastAPI API, worker, pytest | ✓ | `3.13.5` | — |
| PostgreSQL | API persistence | ✓ | `psql 18.3`, `pg_isready` accepting on `:5432` | — |
| Docker | local service orchestration | ✓ | `29.3.1` | — |
| Web app | browser verification target | ✓ | HTTP `307` on `http://127.0.0.1:3000/` | — |
| API app | backend verification target | ✓ | HTTP `200` on `http://127.0.0.1:8000/ready` | — |
| Redis server | worker queue / RQ | ✗ | CLI `redis-cli 7.0.0` installed, but no `PING` response | Start local Redis before full async verification |
| S3-compatible object storage / MinIO | upload-url -> PUT -> complete flow | ✗ | `minio` CLI missing; health endpoint on `:9000` returned `000` | No real fallback for end-to-end upload testing; use mocks only for unit/browser seams |
| Playwright CLI | browser-side verification | ✗ | package declared as `@playwright/test 1.55.0`, but `pnpm exec playwright` fails | Run `pnpm install` before browser testing |

**Missing dependencies with no fallback:**
- Real object storage for the signed-upload chain

**Missing dependencies with fallback:**
- Redis server: API/unit tests can still run without it, but the true async file pipeline cannot
- Playwright CLI install: browser verification is blocked until JS dependencies are installed

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `pytest 8.4.1` for API/integration + `@playwright/test 1.55.0` for browser/e2e |
| Config file | [`playwright.config.ts`](../../../playwright.config.ts) and `none` for pytest |
| Quick run command | `PYTHONPATH=apps/api pytest tests/api/test_opportunity_intake_api.py -q` |
| Full suite command | `PYTHONPATH=apps/api pytest tests/api -q && pnpm exec playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OPP-02 | Overview feels like the top of one opportunity container, with header + stepper + direct Lead Brief handoff | browser e2e | `pnpm exec playwright test tests/e2e/opportunity-overview-shell.spec.ts` | ❌ Wave 0 |
| INTAKE-01 | Minimum fields and raw input can be edited, autosaved, refreshed, and manually saved after failure | API integration | `PYTHONPATH=apps/api pytest tests/api/test_opportunity_intake_api.py -q` | ❌ Wave 0 |
| INTAKE-02 | PDF upload shows `uploaded -> processing -> ready|failed`, exposes preview, and supports explicit retry | API + worker integration | `PYTHONPATH=apps/api pytest tests/api/test_opportunity_file_processing_api.py -q` | ❌ Wave 0 |
| INTAKE-03 | Generate Lead Brief stays blocked until intake gate passes and redirects on success | API integration + browser e2e | `PYTHONPATH=apps/api pytest tests/api/test_lead_brief_gate_api.py -q` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `PYTHONPATH=apps/api pytest tests/api/test_opportunity_intake_api.py -q`
- **Per wave merge:** `PYTHONPATH=apps/api pytest tests/api -q` and `pnpm exec playwright test tests/e2e/opportunity-intake.spec.ts`
- **Phase gate:** Full API suite green plus browser verification of ready, failed, retry, and blocked-to-ready transitions before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/conftest.py` currently only defines `smoke_urls`; add `api_client`, authenticated session fixtures, and payload builders
- [ ] Python test import path is not wired; `pytest tests/api/test_dashboard_opportunities_api.py -q` fails with `ModuleNotFoundError: No module named 'app'` unless `PYTHONPATH=apps/api` is set
- [ ] Even with `PYTHONPATH=apps/api`, existing API tests fail because fixtures such as `api_client` are missing
- [ ] `pnpm exec playwright test --list` currently fails because the Playwright CLI is not installed in the workspace yet
- [ ] `tests/e2e/opportunity-intake.spec.ts` and API tests for intake/file/gate behavior do not exist yet
- [ ] Queue test helpers are missing; add a way to run RQ synchronously in tests or to inject a fake queue

## Sources

### Primary (HIGH confidence)
- Local frozen docs:
  - `.planning/phases/04-opportunity-intake-file-processing/04-CONTEXT.md`
  - `.planning/phases/04-opportunity-intake-file-processing/04-UI-SPEC.md`
  - `.planning/ROADMAP.md`
  - `.planning/PROJECT.md`
  - `.planning/REQUIREMENTS.md`
  - `docs/web/ProposalFlow AI｜API 设计 v1.0.md`
  - `docs/web/ProposalFlow AI｜页面清单与页面级需求 v1.0.md`
  - `docs/web/ProposalFlow AI｜页面流程与信息架构说明 v1.0.md`
  - `docs/web/ProposalFlow AI｜MVP 功能清单 v1.0.md`
  - `docs/web/ProposalFlow AI｜PRD v1.0（MVP）.md`
  - `docs/share/ProposalFlow AI｜系统架构与技术方案 v1.0.md`
  - `docs/share/ProposalFlow AI｜数据库设计 v1.0.md`
  - `docs/share/ProposalFlow AI 开发骨架与目录结构设计说明 v1.0.md`
  - `docs/share/ProposalFlow AI｜部署与环境搭建说明 v1.0.md`
- Context7:
  - `/tanstack/query` - React Query polling, mutation, `enabled`, and invalidation patterns
  - `/react-hook-form/documentation` - `useForm`, `defaultValues`, `resetOptions`, and Zod resolver usage
- Official docs:
  - https://tanstack.com/query/latest/docs/framework/react/reference/useQuery
  - https://github.com/react-hook-form/documentation/blob/master/src/content/docs/useform.mdx
  - https://fastapi.tiangolo.com/tutorial/background-tasks/
  - https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html
  - https://pypdf.readthedocs.io/en/latest/user/extract-text.html
  - https://python-rq.org/
  - https://python-rq.org/docs/testing/

### Secondary (MEDIUM confidence)
- npm registry metadata for JS package version verification (`npm view`)
- PyPI JSON metadata for Python package version verification

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - core repo framework choices are clear, but some supporting-library choices are recommendations layered on top of partially incomplete repo infrastructure
- Architecture: HIGH - frozen product/API/database docs are internally consistent about the data model and async file flow
- Pitfalls: HIGH - directly supported by frozen docs, official library docs, and current repo/environment checks

**Research date:** 2026-04-09
**Valid until:** 2026-05-09
