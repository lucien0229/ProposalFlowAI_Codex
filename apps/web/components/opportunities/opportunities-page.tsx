"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { BUSINESS_ROUTE_PATHS } from "@proposalflow/shared-config";
import type { AuthBootstrapWorkspace } from "@/lib/auth-bootstrap";
import type { OpportunityListItem } from "@proposalflow/shared-types";

import { NewOpportunityDialog } from "@/components/dashboard/new-opportunity-dialog";
import { OpportunityRow } from "@/components/opportunities/opportunity-row";
import { OpportunitiesToolbar } from "@/components/opportunities/opportunities-toolbar";
import { ProductShell } from "@/components/product-shell";
import { ProductStateBlock } from "@/components/product-state-block";
import {
  buildOpportunityListSearchParams,
  isFilteredOpportunityQuery,
  type OpportunityListQuery,
  type OpportunityListResponse,
  updateOpportunityArchiveState,
} from "@/lib/opportunities-api";
import { ProductApiError } from "@/lib/product-api";
import { getWorkspaceRestrictionReason } from "@/lib/workspace-billing";

type OpportunitiesPageProps = {
  workspaceName: string | null;
  workspace: AuthBootstrapWorkspace | null;
  initialData: OpportunityListResponse | null;
  initialError: string | null;
  initialQuery: OpportunityListQuery;
};

export function OpportunitiesPage({
  workspaceName,
  workspace,
  initialData,
  initialError,
  initialQuery,
}: OpportunitiesPageProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(initialError);
  const [query, setQuery] = useState(initialQuery);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    setError(initialError);
  }, [initialError]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  function pushQuery(nextQuery: OpportunityListQuery) {
    setQuery(nextQuery);
    const searchParams = buildOpportunityListSearchParams(nextQuery);
    const search = searchParams.toString();
    startTransition(() => {
      router.replace(search ? `${BUSINESS_ROUTE_PATHS.opportunities}?${search}` : BUSINESS_ROUTE_PATHS.opportunities);
    });
  }

  async function handleArchiveToggle(item: OpportunityListItem) {
    if (!data) {
      return;
    }

    const nextArchived = !item.archived_at;
    const previousItems = data.items;
    const nextItems = previousItems.filter((entry) => {
      if (entry.id !== item.id) {
        return true;
      }

      if ((query.archived ?? false) !== nextArchived) {
        return false;
      }

      return true;
    });

    setBusyId(item.id);
    setError(null);
    setData({
      ...data,
      items: nextItems,
    });

    try {
      await updateOpportunityArchiveState(item.id, nextArchived);
      router.refresh();
    } catch (caughtError) {
      setData({
        ...data,
        items: previousItems,
      });
      setError(
        caughtError instanceof ProductApiError
          ? caughtError.message
          : "Archive state could not be updated.",
      );
    } finally {
      setBusyId(null);
    }
  }

  const items = data?.items ?? [];
  const filtered = isFilteredOpportunityQuery(query);
  const restrictedReason = getWorkspaceRestrictionReason(workspace);

  return (
    <ProductShell
      workspaceName={workspaceName}
      pageTitle="Opportunities"
      pageDescription="Search, filter, archive, and open the exact opportunity that needs work next."
      eyebrow="Workflow queue"
      headerMeta={data ? <span className="product-chip">{items.length} visible</span> : null}
    >
      <NewOpportunityDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCreated={(redirectTo) => router.push(redirectTo)}
      />

      <div className="opportunities-layout">
        <OpportunitiesToolbar
          query={query}
          pending={isPending}
          restrictedReason={restrictedReason}
          onQueryChange={(patch) => pushQuery({ ...query, ...patch })}
          onOpenNewOpportunity={() => setIsDialogOpen(true)}
        />

        {error && !data ? (
          <ProductStateBlock
            state="error"
            title="We couldn't load this opportunity view."
            body="Retry now or keep the current filters visible while you re-run the request."
            primaryAction={{
              label: "Retry now",
              onAction: () => router.refresh(),
            }}
          />
        ) : null}

        {error && data ? (
          <ProductStateBlock
            state="retry"
            title="We couldn't load this opportunity view."
            body="Retry now or keep the current filters visible while you re-run the request."
            primaryAction={{
              label: "Retry",
              onAction: () => router.refresh(),
            }}
          />
        ) : null}

        {!data && !error ? (
          <ProductStateBlock
            state="loading"
            title="Loading opportunities"
            body="Gathering queue state for this workspace."
          />
        ) : null}

        {data && items.length === 0 ? (
          <ProductStateBlock
            state="empty"
            title={filtered ? "No opportunities match this view." : "No opportunities yet."}
            body={
              filtered
                ? "Keep your current query visible, or reset the filters to return to the active queue."
                : "Create the first opportunity to start intake and keep the proposal pipeline moving."
            }
            primaryAction={
              filtered
                ? {
                    label: "Reset filters",
                    onAction: () =>
                      pushQuery({
                        status: "all",
                        archived: false,
                        orderBy: "updated_at",
                        orderDirection: "desc",
                        q: undefined,
                        cursor: null,
                      }),
                  }
                : {
                    label: "New opportunity",
                    onAction: () => setIsDialogOpen(true),
                  }
            }
            secondaryAction={
              filtered
                ? {
                    label: "New opportunity",
                    onAction: () => setIsDialogOpen(true),
                  }
                : undefined
            }
          />
        ) : null}

        {items.length > 0 ? (
          <div className="opportunities-list" role="list">
            {items.map((item) => (
              <OpportunityRow
                key={item.id}
                item={item}
                busy={busyId === item.id}
                onArchiveToggle={(currentItem) => {
                  void handleArchiveToggle(currentItem);
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </ProductShell>
  );
}
