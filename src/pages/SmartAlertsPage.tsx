import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Clock,
  Info,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { useFreshTrack } from '../context/FreshTrackContext';
import { FoodItem, SmartAlert } from '../types';

interface SmartAlertsPageProps {
  onOpenLogWaste: (item: FoodItem) => void;
}

export const SmartAlertsPage: React.FC<SmartAlertsPageProps> = ({ onOpenLogWaste }) => {
  const {
    alerts,
    dismissedAlertIds,
    inventory,
    consumeFoodItem,
    dismissAlert,
    dismissAllAlerts,
    restoreAlerts,
  } = useFreshTrack();

  const [severityFilter, setSeverityFilter] = useState<
    'all' | SmartAlert['severity']
  >('all');

  const filteredAlerts = useMemo(() => {
    if (severityFilter === 'all') return alerts;
    return alerts.filter((a) => a.severity === severityFilter);
  }, [alerts, severityFilter]);

  const counts = useMemo(() => {
    return {
      critical: alerts.filter((a) => a.severity === 'critical').length,
      warning: alerts.filter((a) => a.severity === 'warning').length,
      caution: alerts.filter((a) => a.severity === 'caution').length,
      advice: alerts.filter((a) => a.severity === 'advice').length,
    };
  }, [alerts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Smart Expiry Alerts
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Actionable notifications prioritized by expiration urgency, FIFO consumption order, and spoilage risk.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {dismissedAlertIds.length > 0 && (
            <button
              type="button"
              onClick={restoreAlerts}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Restore Dismissed ({dismissedAlertIds.length})
            </button>
          )}
          {alerts.length > 0 && (
            <button
              type="button"
              onClick={dismissAllAlerts}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              Dismiss All
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
        {[
          { id: 'all', label: `All (${alerts.length})` },
          { id: 'critical', label: `Expired (${counts.critical})` },
          { id: 'warning', label: `Urgent 1–3d (${counts.warning})` },
          { id: 'caution', label: `Expiring Soon 4–7d (${counts.caution})` },
          { id: 'advice', label: `Stock Advice (${counts.advice})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSeverityFilter(tab.id as typeof severityFilter)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              severityFilter === tab.id
                ? 'bg-[#059669] text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <EmptyState
          title="No active alerts in this view"
          description={
            dismissedAlertIds.length > 0
              ? 'You have dismissed alerts for current items. Restore dismissed alerts if you want to review them again.'
              : 'All tracked inventory items are in healthy freshness condition.'
          }
          actionLabel={dismissedAlertIds.length > 0 ? 'Restore Dismissed Alerts' : undefined}
          onAction={dismissedAlertIds.length > 0 ? restoreAlerts : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const linkedItem = alert.itemId
              ? inventory.find((i) => i.id === alert.itemId)
              : undefined;

            const styleMap = {
              critical: {
                border: 'border-red-200 dark:border-red-900/70',
                iconBg: 'bg-red-50 text-[#EF4444] dark:bg-red-950/60 dark:text-red-400',
                Icon: AlertCircle,
                label: 'Critical',
              },
              warning: {
                border: 'border-orange-200 dark:border-orange-900/70',
                iconBg: 'bg-orange-50 text-[#F59E0B] dark:bg-orange-950/60 dark:text-orange-400',
                Icon: AlertTriangle,
                label: 'Urgent',
              },
              caution: {
                border: 'border-amber-200 dark:border-amber-900/70',
                iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
                Icon: Clock,
                label: 'Approaching',
              },
              advice: {
                border: 'border-emerald-200 dark:border-emerald-900/70',
                iconBg: 'bg-emerald-50 text-[#059669] dark:bg-emerald-950/60 dark:text-emerald-400',
                Icon: Info,
                label: 'Stock Advice',
              },
            }[alert.severity];

            const Icon = styleMap.Icon;

            return (
              <div
                key={alert.id}
                className={`flex flex-col justify-between gap-4 rounded-xl border bg-white p-4 sm:flex-row sm:items-center dark:bg-slate-900 ${styleMap.border}`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${styleMap.iconBg}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {alert.title}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {styleMap.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {alert.message}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {linkedItem && alert.severity !== 'critical' && (
                    <button
                      type="button"
                      onClick={() => consumeFoodItem(linkedItem.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#059669] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#064E3B] whitespace-nowrap"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Mark Consumed
                    </button>
                  )}
                  {linkedItem && (
                    <button
                      type="button"
                      onClick={() => onOpenLogWaste(linkedItem)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-slate-500" />
                      Log Waste
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => dismissAlert(alert.id)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 whitespace-nowrap"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
