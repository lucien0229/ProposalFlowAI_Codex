"use client";

import { useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";
import { readReturnUrl } from "@/lib/auth-bootstrap";

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const returnUrl = readReturnUrl(searchParams);

  return (
    <AuthShell
      variant="forgot-password"
      eyebrow="Password recovery"
      title="Reset access safely."
      description="Reset safely, preserve the return target, and get back to work quickly."
    >
      <AuthForm variant="forgot-password" returnUrl={returnUrl} />
    </AuthShell>
  );
}
