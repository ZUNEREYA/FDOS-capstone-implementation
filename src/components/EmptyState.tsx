import React, { useState } from 'react';
import { Leaf } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900">
      {!imgError ? (
        <div className="mb-5 h-36 w-48 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
          <img
            src="/src/assets/images/empty_state_produce_1795097011232.jpg"
            alt="FreshTrack empty state produce illustration"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
          <Leaf className="h-7 w-7" />
        </div>
      )}

      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#064E3B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#059669] whitespace-nowrap shrink-0"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
