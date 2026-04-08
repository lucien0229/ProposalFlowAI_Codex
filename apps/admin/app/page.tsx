import { ADMIN_ROUTE_PREFIX, APP_ENVIRONMENT_LABELS } from "@proposalflow/shared-config";

import { AdminShell } from "../components/admin-shell";

export default function Page() {
  return (
    <AdminShell>
      <section className="admin-callout">
        <span className="admin-callout__badge">Internal</span>
        <h1>Read-only admin placeholder surface.</h1>
        <p>
          This internal, read-only shell is deliberately sparse so the customer workflow never
          blends into the operational surface.
        </p>
        <div className="admin-callout__meta">
          <span>{ADMIN_ROUTE_PREFIX}</span>
          <span>{APP_ENVIRONMENT_LABELS.local}</span>
          <span>Boundary-first navigation</span>
        </div>
      </section>
    </AdminShell>
  );
}
