"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
  Workflow,
} from "lucide-react";

import { BUSINESS_ROUTE_PATHS } from "@proposalflow/shared-config";

type ProductNavProps = {
  workspaceName: string | null;
};

const navItems = [
  {
    href: BUSINESS_ROUTE_PATHS.dashboard,
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: BUSINESS_ROUTE_PATHS.opportunities,
    label: "Opportunities",
    icon: Workflow,
  },
  {
    href: BUSINESS_ROUTE_PATHS.templatesRules,
    label: "Templates & Rules",
    icon: SlidersHorizontal,
  },
  {
    href: BUSINESS_ROUTE_PATHS.billing,
    label: "Billing",
    icon: CreditCard,
  },
  {
    href: BUSINESS_ROUTE_PATHS.settings,
    label: "Settings",
    icon: Settings,
  },
] as const;

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ProductNav({ workspaceName }: ProductNavProps) {
  const pathname = usePathname();

  return (
    <aside className="product-nav">
      <div className="product-nav__brand">
        <span className="product-nav__badge">ProposalFlow AI</span>
        <strong>{workspaceName ?? "Workspace"}</strong>
        <p>Proposal-ready command center</p>
      </div>

      <nav className="product-nav__links" aria-label="Primary product navigation">
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="product-nav__link"
              data-active={active}
              aria-current={active ? "page" : undefined}
            >
              <Icon aria-hidden="true" size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="product-nav__footer">
        <span className="product-nav__footer-label">Web app only</span>
        <p>Desktop and laptop workflow surface for intake, resume, and handoff.</p>
      </div>
    </aside>
  );
}
