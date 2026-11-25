import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useFreshTrack } from '../context/FreshTrackContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useFreshTrack();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2.5"
    >
      {toasts.map((toast) => {
        const iconMap = {
          success: <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0" />,
          error: <AlertCircle className="h-4 w-4 text-[#EF4444] shrink-0" />,
          warning: <AlertTriangle className="h-4 w-4 text-[#F59E0B] shrink-0" />,
          info: <Info className="h-4 w-4 text-slate-600 dark:text-slate-300 shrink-0" />,
        };

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg transition-all dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="mt-0.5">{iconMap[toast.type]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {toast.title}
              </p>
              {toast.message && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
