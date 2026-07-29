'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

export type NotificationTone = 'error' | 'info' | 'success';

export interface EditorNotification {
  id: number;
  message: string;
  tone: NotificationTone;
}

interface NotificationContextValue {
  dismiss(id: number): void;
  notify(message: string, tone?: NotificationTone): number;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const sequence = useRef(0);
  const [notifications, setNotifications] = useState<readonly EditorNotification[]>([]);

  const dismiss = useCallback((id: number) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id));
  }, []);
  const notify = useCallback(
    (message: string, tone: NotificationTone = 'info') => {
      const id = ++sequence.current;
      setNotifications((current) => [...current, { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 4_000);
      return id;
    },
    [dismiss],
  );
  const context = useMemo(() => ({ dismiss, notify }), [dismiss, notify]);

  return (
    <NotificationContext.Provider value={context}>
      {children}
      <ol aria-live="polite" className="editor-notifications">
        {notifications.map((notification) => (
          <li data-tone={notification.tone} key={notification.id}>
            <span>{notification.message}</span>
            <button aria-label="Dismiss" onClick={() => dismiss(notification.id)} type="button">
              ×
            </button>
          </li>
        ))}
      </ol>
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used inside NotificationProvider.');
  return context;
}
