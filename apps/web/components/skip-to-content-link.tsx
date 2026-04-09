"use client";

type SkipToContentLinkProps = {
  targetId: string;
};

export function SkipToContentLink({ targetId }: SkipToContentLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="skip-link"
      onClick={(event) => {
        const target = document.getElementById(targetId);
        if (!target) {
          return;
        }

        event.preventDefault();
        target.scrollIntoView({ block: "start" });
        target.focus();
        window.history.replaceState(null, "", `#${targetId}`);
      }}
    >
      Skip to main content
    </a>
  );
}
