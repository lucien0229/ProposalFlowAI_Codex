"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { AUTH_ROUTE_PATHS, RETURN_URL_QUERY_PARAM } from "@proposalflow/shared-config";
import { buildForgotPasswordUrl, buildSignInUrl, buildSignUpUrl } from "@/lib/auth-bootstrap";

type AuthFormVariant = "sign-in" | "sign-up" | "forgot-password";

type AuthFormProps = {
  variant: AuthFormVariant;
  returnUrl: string | null;
};

type FormState = {
  email: string;
  password: string;
  fullName: string;
};

const copyByVariant: Record<
  AuthFormVariant,
  {
    submitLabel: string;
    googleLabel: string;
    helper: string;
  }
> = {
  "sign-in": {
    submitLabel: "Sign in",
    googleLabel: "Continue with Google",
    helper: "Use Google or email to return without losing the brief.",
  },
  "sign-up": {
    submitLabel: "Create account",
    googleLabel: "Sign up with Google",
    helper: "Create your business account and continue straight into setup.",
  },
  "forgot-password": {
    submitLabel: "Send reset link",
    googleLabel: "Continue with Google",
    helper: "We will send a reset email if the account exists.",
  },
};

function buildGoogleHref(returnUrl: string | null): string {
  const url = new URL(AUTH_ROUTE_PATHS.googleStart, "http://placeholder.local");
  if (returnUrl) {
    url.searchParams.set(RETURN_URL_QUERY_PARAM, returnUrl);
  }
  return `${AUTH_ROUTE_PATHS.googleStart}${url.search}`;
}

export function AuthForm({ variant, returnUrl }: AuthFormProps) {
  const router = useRouter();
  const [state, setState] = useState<FormState>({
    email: "",
    password: "",
    fullName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const labels = copyByVariant[variant];
  const googleHref = useMemo(() => buildGoogleHref(returnUrl), [returnUrl]);

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload =
        variant === "sign-up"
          ? {
              email: state.email,
              password: state.password,
              full_name: state.fullName,
              return_url: returnUrl,
            }
          : variant === "sign-in"
            ? {
                email: state.email,
                password: state.password,
                return_url: returnUrl,
              }
            : {
                email: state.email,
                return_url: returnUrl,
              };

      const response = await fetch(
        variant === "sign-up"
          ? "/api/v1/auth/sign-up"
          : variant === "sign-in"
            ? "/api/v1/auth/sign-in"
            : "/api/v1/auth/forgot-password",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        const message =
          typeof data.detail === "string"
            ? data.detail
            : variant === "forgot-password"
              ? "Could not send the reset email."
              : "Unable to complete the request.";
        setError(message);
        return;
      }

      if (variant === "forgot-password") {
        setSuccess("If the account exists, a reset link has been sent.");
        return;
      }

      const nextUrl =
        typeof data.redirect_to === "string"
          ? data.redirect_to
          : typeof data.next_url === "string"
            ? data.next_url
            : returnUrl ?? "/dashboard";
      router.replace(nextUrl);
    } catch {
      setError(variant === "forgot-password" ? "Could not send the reset email." : "Unable to complete the request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-form">
      {variant !== "forgot-password" ? (
        <div className="auth-form__lead">
          <a className="auth-form__google" href={googleHref}>
            <span className="auth-form__google-mark" aria-hidden="true">
              G
            </span>
            <span>{labels.googleLabel}</span>
          </a>

          <div className="auth-form__divider" aria-hidden="true" />
        </div>
      ) : null}

      <form className="auth-form__form" onSubmit={submitForm} aria-busy={isSubmitting}>
        <p className="auth-form__helper" id="auth-form-helper">
          {labels.helper}
        </p>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={state.email}
            onChange={(event) => setState((current) => ({ ...current, email: event.target.value }))}
            placeholder="owner@agency.com"
          />
        </label>

        {variant === "sign-up" ? (
          <label className="field">
            <span>Full name</span>
            <input
              type="text"
              autoComplete="name"
              required
              minLength={2}
              value={state.fullName}
              onChange={(event) => setState((current) => ({ ...current, fullName: event.target.value }))}
              placeholder="Alex Morgan"
            />
          </label>
        ) : null}

        {variant !== "forgot-password" ? (
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete={variant === "sign-up" ? "new-password" : "current-password"}
              required
              minLength={8}
              value={state.password}
              onChange={(event) => setState((current) => ({ ...current, password: event.target.value }))}
              placeholder="At least 8 characters"
            />
          </label>
        ) : null}

        {error ? (
          <div className="auth-form__alert auth-form__alert--error" role="alert" aria-live="assertive">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="auth-form__alert auth-form__alert--success" role="status" aria-live="polite">
            {success}
          </div>
        ) : null}

        <button className="auth-form__submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Working..." : labels.submitLabel}
        </button>

        <div className="auth-form__footer">
          {variant === "sign-in" ? (
            <>
              <span>Need an account?</span>
              <a href={buildSignUpUrl(returnUrl)}>Create account</a>
              <span aria-hidden="true">·</span>
              <a href={buildForgotPasswordUrl(returnUrl)}>Forgot password?</a>
            </>
          ) : variant === "sign-up" ? (
            <>
              <span>Already have an account?</span>
              <a href={buildSignInUrl(returnUrl)}>Sign in</a>
            </>
          ) : (
            <>
              <span>Remembered your password?</span>
              <a href={buildSignInUrl(returnUrl)}>Back to sign in</a>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
