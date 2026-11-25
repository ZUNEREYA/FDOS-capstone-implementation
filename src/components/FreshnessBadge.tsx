import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { FreshnessStatus } from '../types';

interface FreshnessBadgeProps {
  status: FreshnessStatus;
  label: string;
  daysLabel?: string;
  compact?: boolean;
}

const STATUS_STYLES: Record<
  FreshnessStatus,
  {
    container: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  fresh: {
    container:
      'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800/80',
    icon: CheckCircle2,
  },
  expiring_soon: {
    container:
      'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/60 dark:border-amber-800/80',
    icon: Clock,
  },
  warning: {
    container:
      'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-950/60 dark:border-orange-800/80',
    icon: AlertTriangle,
  },
  expired: {
    container:
      'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/60 dark:border-red-800/80',
    icon: AlertCircle,
  },
};

export const FreshnessBadge: React.FC<FreshnessBadgeProps> = ({
  status,
  label,
  daysLabel,
  compact = false,
}) => {
  const style = STATUS_STYLES[status];
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium whitespace-nowrap shrink-0 ${style.container}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
      {!compact && daysLabel && (
        <>
          <span aria-hidden="true" className="opacity-50">
            ·
          </span>
          <span className="font-mono-tabular">{daysLabel}</span>
        </>
      )}
    </span>
  );
};
