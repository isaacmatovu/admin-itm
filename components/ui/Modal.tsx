"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A modal built on the native <dialog> element — free focus trap and
 * Escape-to-close, which TT-09 (Approve/Send Back) explicitly needs. Focus
 * returns to whatever invoked it automatically (native dialog behavior).
 */
export function Modal({
  open,
  onClose,
  children,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={labelledBy}
      onClose={onClose}
      onCancel={onClose}
      onClick={(e) => {
        // Clicking the backdrop (the dialog element itself, outside the
        // panel) closes it — clicking inside .dialog-panel does not.
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dialog-panel">{children}</div>
    </dialog>
  );
}
