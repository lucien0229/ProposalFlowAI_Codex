"use client";

import { useEffect, useState } from "react";

import {
  OPPORTUNITY_SORT_PRESETS,
} from "@proposalflow/shared-config";
import { OPPORTUNITY_STATUSES } from "@proposalflow/shared-types";

import { NewOpportunityAction } from "@/components/new-opportunity-action";
import type { OpportunityListQuery } from "@/lib/opportunities-api";

type OpportunitiesToolbarProps = {
  query: OpportunityListQuery;
  pending?: boolean;
  restrictedReason?: string | null;
  onQueryChange: (patch: Partial<OpportunityListQuery>) => void;
  onOpenNewOpportunity: () => void;
};

export function OpportunitiesToolbar({
  query,
  pending = false,
  restrictedReason = null,
  onQueryChange,
  onOpenNewOpportunity,
}: OpportunitiesToolbarProps) {
  const [searchDraft, setSearchDraft] = useState(query.q ?? "");
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    setSearchDraft(query.q ?? "");
  }, [query.q]);

  useEffect(() => {
    if (isComposing) {
      return;
    }

    const committedSearch = query.q ?? "";
    if (searchDraft === committedSearch) {
      return;
    }

    const debounceTimer = window.setTimeout(() => {
      onQueryChange({ q: searchDraft || undefined, cursor: null });
    }, 300);

    return () => {
      window.clearTimeout(debounceTimer);
    };
  }, [isComposing, onQueryChange, query.q, searchDraft]);

  return (
    <section className="product-panel opportunities-toolbar" aria-label="Opportunities toolbar">
      <NewOpportunityAction
        blockedReason={restrictedReason}
        noteId="opportunities-toolbar-new-opportunity-note"
        onAction={onOpenNewOpportunity}
      />

      <label className="field field--toolbar">
        <span>Search</span>
        <input
          type="search"
          role="searchbox"
          aria-label="Search"
          value={searchDraft}
          onChange={(event) => {
            setSearchDraft(event.target.value);
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={(event) => {
            setIsComposing(false);
            setSearchDraft(event.currentTarget.value);
          }}
          placeholder="Search title or company"
        />
      </label>

      <label className="field field--toolbar">
        <span>Status</span>
        <select
          aria-label="Status"
          value={query.status ?? "all"}
          onChange={(event) =>
            onQueryChange({
              status: event.target.value as OpportunityListQuery["status"],
              cursor: null,
            })
          }
        >
          <option value="all">All statuses</option>
          {OPPORTUNITY_STATUSES.filter((status) => status !== "archived").map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>

      <label className="toolbar-checkbox">
        <input
          type="checkbox"
          checked={Boolean(query.archived)}
          onChange={(event) =>
            onQueryChange({
              archived: event.target.checked,
              cursor: null,
            })
          }
          aria-label="Archived"
        />
        <span>Archived</span>
      </label>

      <label className="field field--toolbar">
        <span>Sort</span>
        <select
          aria-label="Sort"
          value={`${query.orderBy ?? "updated_at"}:${query.orderDirection ?? "desc"}`}
          onChange={(event) => {
            const [orderBy, orderDirection] = event.target.value.split(":");
            onQueryChange({
              orderBy: orderBy as OpportunityListQuery["orderBy"],
              orderDirection: orderDirection as OpportunityListQuery["orderDirection"],
              cursor: null,
            });
          }}
        >
          {OPPORTUNITY_SORT_PRESETS.map((preset) => (
            <option
              key={preset.key}
              value={`${preset.order_by}:${preset.order_direction}`}
            >
              {preset.label}
            </option>
          ))}
        </select>
      </label>

      {pending ? <span className="product-muted">Updating view…</span> : null}
    </section>
  );
}
