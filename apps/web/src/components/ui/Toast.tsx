import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

// ─── Toast Store (simple — no extra lib) ─────────────────────────────────────
type Listener = (toasts: ToastData[]) => void;
let toasts: ToastData[] = [];
let listeners: Listener[] = [];

function notify() { listeners.forEach((l) => l([...toasts])); }

export const toast = {
  show: (t: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    toasts = [...toasts, { ...t, id }];
    notify();
    return id;
  },
  success: (title: string, message?: string) => toast.show({ type: 'success', title, message, duration: 4000 }),
  error:   (title: string, message?: string) => toast.show({ type: 'error',   title, message, duration: 6000 }),
  warning: (title: string, message?: string) => toast.show({ type: 'warning', title, message, duration: 5000 }),
  info:    (title: string, message?: string) => toast.show({ type: 'info',    title, message, duration: 4000 }),
  dismiss: (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  },
};

function useToasts() {
  const [items, setItems] = React.useState<ToastData[]>([]);
  React.useEffect(() => {
    listeners.push(setItems);
    return () => { listeners = listeners.filter((l) => l !== setItems); };
  }, []);
  return items;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const icons: Record<ToastType, { icon: React.ElementType; className: string }> = {
  success: { icon: CheckCircle,    className: 'text-healthy' },
  error:   { icon: AlertCircle,   className: 'text-critical' },
  warning: { icon: AlertTriangle, className: 'text-warning' },
  info:    { icon: Info,           className: 'text-info' },
};

// ─── Toast Provider ───────────────────────────────────────────────────────────
export function ToastProvider() {
  const items = useToasts();

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {items.map((t) => {
        const { icon: Icon, className } = icons[t.type];
        return (
          <ToastPrimitive.Root
            key={t.id}
            duration={t.duration ?? 4000}
            onOpenChange={(open) => !open && toast.dismiss(t.id)}
            className={cn(
              'flex items-start gap-3 p-3 rounded bg-surface border border-border shadow-lg',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[swipe=end]:animate-out data-[state=closed]:fade-out-80',
              'data-[state=open]:slide-in-from-right-4 data-[state=closed]:slide-out-to-right-4',
              'max-w-sm w-full'
            )}
          >
            <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', className)} />
            <div className="flex-1 min-w-0">
              <ToastPrimitive.Title className="text-sm font-medium text-ink">
                {t.title}
              </ToastPrimitive.Title>
              {t.message && (
                <ToastPrimitive.Description className="text-xs text-ink-muted mt-0.5">
                  {t.message}
                </ToastPrimitive.Description>
              )}
              {t.action && (
                <button
                  onClick={() => { t.action!.onClick(); toast.dismiss(t.id); }}
                  className="text-xs text-accent font-medium mt-1 hover:underline"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <ToastPrimitive.Close
              onClick={() => toast.dismiss(t.id)}
              className="text-ink-faint hover:text-ink"
            >
              <X className="w-3.5 h-3.5" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        );
      })}
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 z-[200] max-h-screen w-full max-w-sm" />
    </ToastPrimitive.Provider>
  );
}
