'use client';

import { type ReactNode, type SyntheticEvent, useEffect, useId, useRef } from 'react';

export interface EditorDialogProps {
  children: ReactNode;
  className?: string;
  closeLabel?: string;
  footer?: ReactNode;
  onClose(): void;
  open: boolean;
  title: string;
}

export function EditorDialog({
  children,
  className,
  closeLabel = 'Close',
  footer,
  onClose,
  open,
  title,
}: EditorDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const cancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onClose();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog aria-labelledby={titleId} className={className} onCancel={cancel} ref={dialogRef}>
      <header>
        <h2 id={titleId}>{title}</h2>
        <button aria-label={closeLabel} onClick={onClose} type="button">
          ×
        </button>
      </header>
      <section>{children}</section>
      {footer ? <footer>{footer}</footer> : null}
    </dialog>
  );
}
