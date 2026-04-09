"use client";

type ArchiveToggleProps = {
  archived: boolean;
  busy?: boolean;
  onToggle: () => void;
};

export function ArchiveToggle({ archived, busy = false, onToggle }: ArchiveToggleProps) {
  return (
    <button
      type="button"
      className="archive-toggle"
      onClick={onToggle}
      disabled={busy}
      aria-label={archived ? "Unarchive opportunity" : "Archive opportunity"}
    >
      {busy ? "Working..." : archived ? "Unarchive" : "Archive"}
    </button>
  );
}
