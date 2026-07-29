'use client';

import { type ReactNode, useEffect, useRef } from 'react';

export interface EditorDialogProps {
  children: ReactNode;
  footer?: ReactNode;
  onClose(): void;
  open: boolean;
  title: string;
}

export function EditorDialog({ children, footer, onClose, open, title }: EditorDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog aria-labelledby="editor-dialog-title" onCancel={onClose} ref={dialogRef}>
      <header>
        <h2 id="editor-dialog-title">{title}</h2>
        <button aria-label="Close" onClick={onClose} type="button">
          ×
        </button>
      </header>
      <section>{children}</section>
      {footer ? <footer>{footer}</footer> : null}
    </dialog>
  );
}
