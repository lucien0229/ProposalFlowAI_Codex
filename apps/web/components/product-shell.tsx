import type { ReactNode } from "react";

import { ProductNav } from "@/components/product-nav";
import { SkipToContentLink } from "@/components/skip-to-content-link";

const PRODUCT_MAIN_CONTENT_ID = "product-main-content";

type ProductShellProps = {
  workspaceName: string | null;
  pageTitle: string;
  pageDescription: string;
  eyebrow?: string;
  headerActions?: ReactNode;
  headerMeta?: ReactNode;
  children: ReactNode;
};

export function ProductShell({
  workspaceName,
  pageTitle,
  pageDescription,
  eyebrow = "Workspace command center",
  headerActions,
  headerMeta,
  children,
}: ProductShellProps) {
  return (
    <>
      <SkipToContentLink targetId={PRODUCT_MAIN_CONTENT_ID} />

      <main className="product-shell">
        <ProductNav workspaceName={workspaceName} />

        <div className="product-shell__content" id={PRODUCT_MAIN_CONTENT_ID} tabIndex={-1}>
          <header className="product-page-header">
            <div className="product-page-header__copy">
              <span className="product-page-header__eyebrow">{eyebrow}</span>
              <h1>{pageTitle}</h1>
              <p>{pageDescription}</p>
            </div>

            <div className="product-page-header__actions">
              {headerMeta}
              {headerActions}
            </div>
          </header>

          <section className="product-shell__surface">{children}</section>
        </div>
      </main>
    </>
  );
}
