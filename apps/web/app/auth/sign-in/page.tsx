"use client";

import { useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";
import { readReturnUrl } from "@/lib/auth-bootstrap";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const returnUrl = readReturnUrl(searchParams);

  return (
    <AuthShell
      variant="sign-in"
      eyebrow="Sign in"
      title="Write proposals faster."
      description="Google-first access, reusable workspace defaults, and secure handoffs keep every proposal moving."
    >
      <AuthForm variant="sign-in" returnUrl={returnUrl} />
    </AuthShell>
  );
}
