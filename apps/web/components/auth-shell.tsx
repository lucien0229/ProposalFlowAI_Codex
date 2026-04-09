import type { ReactNode } from "react";

type AuthShellVariant = "sign-in" | "sign-up" | "forgot-password";

type AuthShellProps = {
  variant: AuthShellVariant;
  title: string;
  eyebrow: string;
  description: string;
  footer?: ReactNode;
  children: ReactNode;
};

const shellContent: Record<
  AuthShellVariant,
  {
    notes: Array<{ label: string; value: string }>;
  }
> = {
  "sign-in": {
    notes: [
      {
        label: "Faster starts",
        value: "Return with Google in one click.",
      },
      {
        label: "Repeatable output",
        value: "Defaults keep every proposal aligned.",
      },
    ],
  },
  "sign-up": {
    notes: [
      {
        label: "Canonical account",
        value: "Create one business identity for the workspace.",
      },
      {
        label: "Setup next",
        value: "Move straight into defaults and first draft setup.",
      },
    ],
  },
  "forgot-password": {
    notes: [
      {
        label: "Secure recovery",
        value: "Reset access without exposing account state.",
      },
      {
        label: "No disclosure",
        value: "Protect account privacy by default.",
      },
    ],
  },
};

export function AuthShell({ variant, title, eyebrow, description, footer, children }: AuthShellProps) {
  const content = shellContent[variant];
  return (
    <main className="auth-shell">
      <section className="auth-shell__frame">
        <aside className="auth-shell__intro">
          <div className="auth-shell__brand">
            <span className="auth-shell__badge">ProposalFlow AI</span>
            <span className="auth-shell__kicker">{eyebrow}</span>
            <h1 className="auth-shell__title">{title}</h1>
            <p className="auth-shell__description">{description}</p>
          </div>

          <div className="auth-shell__notes" aria-label="Auth flow notes">
            {content.notes.map((note) => (
              <div className="auth-shell__note" key={note.label}>
                <strong>{note.label}</strong>
                <span>{note.value}</span>
              </div>
            ))}
          </div>

        </aside>

        <section className="auth-shell__panel">{children}</section>
      </section>

      {footer ? <div className="auth-shell__footer">{footer}</div> : null}
    </main>
  );
}
