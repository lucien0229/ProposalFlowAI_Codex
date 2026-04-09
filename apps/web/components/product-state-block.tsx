"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  CircleCheckBig,
  Inbox,
  LoaderCircle,
  RotateCcw,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";

type ProductStateBlockKind =
  | "loading"
  | "empty"
  | "error"
  | "blocked"
  | "retry"
  | "success";

type ProductStateAction = {
  label: string;
  href?: string;
  onAction?: () => void;
};

type ProductStateBlockProps = {
  state: ProductStateBlockKind;
  title: string;
  body: string;
  label?: string | undefined;
  detail?: string | undefined;
  primaryAction?: ProductStateAction | undefined;
  secondaryAction?: ProductStateAction | undefined;
  children?: ReactNode | undefined;
};

const stateConfig = {
  loading: {
    label: "Loading workspace state",
    icon: LoaderCircle,
    role: "status",
    live: "polite" as const,
  },
  empty: {
    label: "Empty workspace state",
    icon: Inbox,
    role: "region",
    live: undefined,
  },
  error: {
    label: "Error workspace state",
    icon: TriangleAlert,
    role: "alert",
    live: "assertive" as const,
  },
  blocked: {
    label: "Blocked workspace state",
    icon: ShieldAlert,
    role: "alert",
    live: "assertive" as const,
  },
  retry: {
    label: "Retry workspace state",
    icon: RotateCcw,
    role: "status",
    live: "polite" as const,
  },
  success: {
    label: "Success workspace state",
    icon: CircleCheckBig,
    role: "status",
    live: "polite" as const,
  },
} as const;

function StateAction({
  action,
  className,
}: {
  action: ProductStateAction;
  className: string;
}) {
  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={action.onAction}>
      {action.label}
    </button>
  );
}

export function ProductStateBlock({
  state,
  title,
  body,
  label,
  detail,
  primaryAction,
  secondaryAction,
  children,
}: ProductStateBlockProps) {
  const config = stateConfig[state];
  const Icon = config.icon;

  return (
    <section
      className="product-state-block"
      data-state={state}
      role={config.role}
      aria-live={config.live}
      aria-label={label ?? config.label}
    >
      <div className="product-state-block__icon">
        <Icon aria-hidden="true" size={18} className={state === "loading" ? "is-spinning" : undefined} />
      </div>

      <div className="product-state-block__copy">
        <h2>{title}</h2>
        <p>{body}</p>
        {detail ? <span className="product-state-block__detail">{detail}</span> : null}
      </div>

      {primaryAction || secondaryAction ? (
        <div className="product-state-block__actions">
          {primaryAction ? (
            <StateAction action={primaryAction} className="product-button product-button--primary" />
          ) : null}
          {secondaryAction ? (
            <StateAction action={secondaryAction} className="product-button product-button--ghost" />
          ) : null}
        </div>
      ) : null}

      {children ? <div className="product-state-block__body">{children}</div> : null}
    </section>
  );
}
