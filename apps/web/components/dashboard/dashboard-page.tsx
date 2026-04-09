"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { BUSINESS_ROUTE_PATHS } from "@proposalflow/shared-config";
import type { DashboardSummary } from "@proposalflow/shared-types";

import { BillingCard } from "@/components/dashboard/billing-card";
import { NeedsAttentionList } from "@/components/dashboard/needs-attention-list";
import { NewOpportunityDialog } from "@/components/dashboard/new-opportunity-dialog";
import { RecentOpportunities } from "@/components/dashboard/recent-opportunities";
import { NewOpportunityAction } from "@/components/new-opportunity-action";
import { ProductShell } from "@/components/product-shell";
import { ProductStateBlock } from "@/components/product-state-block";
import { fetchDashboardSummary } from "@/lib/dashboard-api";
import { ProductApiError } from "@/lib/product-api";

type DashboardPageProps = {
  workspaceName: string | null;
  initialSummary: DashboardSummary | null;
  initialError: string | null;
};

const countLabels = [
  { key: "active", label: "Active" },
  { key: "needs_attention", label: "Needs attention" },
  { key: "proposal_ready", label: "Proposal ready" },
  { key: "archived", label: "Archived" },
] as const;

export function DashboardPage({
  workspaceName,
  initialSummary,
  initialError,
}: DashboardPageProps) {
  const router = useRouter();
  const [summary, setSummary] = useState(initialSummary);
  const [error, setError] = useState(initialError);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setSummary(initialSummary);
  }, [initialSummary]);

  useEffect(() => {
    setError(initialError);
  }, [initialError]);

  const isEmpty = useMemo(() => {
    if (!summary) {
      return false;
    }
    return (
      summary.recent_opportunities.length === 0 &&
      summary.needs_attention.length === 0 &&
      summary.summary_counts.active === 0
    );
  }, [summary]);

  async function refreshSummary() {
    setIsRefreshing(true);
    setError(null);

    try {
      const nextSummary = await fetchDashboardSummary();
      setSummary(nextSummary);
    } catch (caughtError) {
      setError(
        caughtError instanceof ProductApiError
          ? caughtError.message
          : "We couldn't load this workspace view. Retry now or return to the last working surface.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <ProductShell
      workspaceName={workspaceName}
      pageTitle="Dashboard"
      pageDescription="Start new work, resume the current step, and resolve blockers before they slow proposal delivery."
      headerMeta={
        summary ? <span className="product-chip">{summary.summary_counts.active} active</span> : null
      }
      headerActions={
        <NewOpportunityAction
          blockedReason={summary?.billing_snapshot.restriction_reason ?? null}
          noteId="dashboard-new-opportunity-note"
          onAction={() => setIsDialogOpen(true)}
        />
      }
    >
      <NewOpportunityDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCreated={(redirectTo) => router.push(redirectTo)}
      />

      {!summary && !error ? (
        <ProductStateBlock
          state="loading"
          title="Loading dashboard"
          body="Gathering recent opportunities, blockers, and workspace billing context."
        />
      ) : null}

      {error && !summary ? (
        <ProductStateBlock
          state="error"
          title="We couldn't load this workspace view."
          body="Retry now or return to the last working surface."
          primaryAction={{
            label: isRefreshing ? "Retrying..." : "Retry now",
            onAction: () => {
              void refreshSummary();
            },
          }}
          secondaryAction={{
            label: "Open opportunities",
            href: BUSINESS_ROUTE_PATHS.opportunities,
          }}
        />
      ) : null}

      {summary ? (
        <>
          {summary.billing_snapshot.is_restricted ? (
            <ProductStateBlock
              state="blocked"
              title="Some actions are blocked by workspace billing."
              body="The dashboard stays visible so the team can orient, but create and resume actions should explain the billing restriction."
              detail={summary.billing_snapshot.restriction_reason?.replaceAll("_", " ") ?? undefined}
              primaryAction={{
                label: "Review billing",
                href: BUSINESS_ROUTE_PATHS.billing,
              }}
              secondaryAction={{
                label: isRefreshing ? "Refreshing..." : "Retry summary",
                onAction: () => {
                  void refreshSummary();
                },
              }}
            />
          ) : null}

          {error && summary ? (
            <ProductStateBlock
              state="retry"
              title="Dashboard data needs another pass."
              body="The last good summary stays visible while you retry."
              primaryAction={{
                label: isRefreshing ? "Refreshing..." : "Retry now",
                onAction: () => {
                  void refreshSummary();
                },
              }}
            />
          ) : null}

          {isEmpty ? (
            <ProductStateBlock
              state="empty"
              title="No opportunities yet."
              body="Create the first opportunity to start intake and move toward a proposal-ready draft."
              primaryAction={{
                label: "New opportunity",
                onAction: () => setIsDialogOpen(true),
              }}
              secondaryAction={{
                label: "Open opportunities",
                href: BUSINESS_ROUTE_PATHS.opportunities,
              }}
            />
          ) : (
            <div className="dashboard-layout">
              <div className="dashboard-priority-grid">
                <div className="dashboard-main-stack">
                  <RecentOpportunities items={summary.recent_opportunities} />
                  <NeedsAttentionList items={summary.needs_attention} />
                </div>

                <div className="dashboard-sidebar-stack">
                  <section className="product-panel dashboard-panel" aria-labelledby="dashboard-summary-heading">
                    <div className="dashboard-panel__header">
                      <div>
                        <span className="panel-kicker">Current counts</span>
                        <h2 id="dashboard-summary-heading">Compact status summary</h2>
                      </div>
                    </div>

                    <div className="dashboard-summary-grid">
                      {countLabels.map((item) => (
                        <div key={item.key} className="dashboard-summary-grid__item">
                          <span>{item.label}</span>
                          <strong>{summary.summary_counts[item.key]}</strong>
                        </div>
                      ))}
                    </div>
                  </section>

                  <BillingCard snapshot={summary.billing_snapshot} />
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </ProductShell>
  );
}
