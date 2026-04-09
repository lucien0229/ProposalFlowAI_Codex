"use client";

import { useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";
import { readReturnUrl } from "@/lib/auth-bootstrap";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const returnUrl = readReturnUrl(searchParams);

  return (
    <AuthShell
      variant="sign-up"
      eyebrow="Create account"
      title="Build a repeatable workspace."
      description="Create the canonical account now, then turn proposal setup into a repeatable system."
    >
      <AuthForm variant="sign-up" returnUrl={returnUrl} />
    </AuthShell>
  );
}
