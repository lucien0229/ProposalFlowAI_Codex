"use client";

import { useSearchParams } from "next/navigation";

import { WorkspaceSetupShell } from "@/components/workspace-setup-shell";
import { WorkspaceSetupForm } from "@/components/workspace-setup-form";
import { readReturnUrl } from "@/lib/auth-bootstrap";

export default function WorkspaceSetupPage() {
  const searchParams = useSearchParams();
  const returnUrl = readReturnUrl(searchParams);

  return (
    <WorkspaceSetupShell>
      <WorkspaceSetupForm returnUrl={returnUrl} />
    </WorkspaceSetupShell>
  );
}
