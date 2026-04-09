import type { ComponentProps } from "react";

import { ProductShell } from "@/components/product-shell";
import { ProductStateBlock } from "@/components/product-state-block";

type ProductPlaceholderPageProps = {
  workspaceName: string | null;
  title: string;
  description: string;
  state: ComponentProps<typeof ProductStateBlock>["state"];
  body: string;
  detail?: string;
  primaryAction?: ComponentProps<typeof ProductStateBlock>["primaryAction"];
  secondaryAction?: ComponentProps<typeof ProductStateBlock>["secondaryAction"];
};

export function ProductPlaceholderPage({
  workspaceName,
  title,
  description,
  state,
  body,
  detail,
  primaryAction,
  secondaryAction,
}: ProductPlaceholderPageProps) {
  return (
    <ProductShell
      workspaceName={workspaceName}
      pageTitle={title}
      pageDescription={description}
      eyebrow="Workspace surface"
    >
      <ProductStateBlock
        state={state}
        title={title}
        body={body}
        detail={detail}
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
      />
    </ProductShell>
  );
}
