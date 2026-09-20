"use client";
import { useEffect, useRef } from "react";

/** Native <dialog> driven by `open`; closes on backdrop click and Esc. */
export function Dialog({ open, onClose, title, closeLabel, children }: {
  open: boolean; onClose: () => void; title: React.ReactNode; closeLabel: string; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      {open && (
        <>
          <div className="dlg-head">
            <div>{title}</div>
            <button className="x" type="button" aria-label={closeLabel} onClick={onClose}>×</button>
          </div>
          <div className="dlg-body">{children}</div>
        </>
      )}
    </dialog>
  );
}
