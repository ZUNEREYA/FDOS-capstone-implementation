import React, { useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Leaf,
  Package,
  Plus,
  Printer,
  Trash2,
  TrendingDown,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FreshnessBadge } from '../components/FreshnessBadge';
import { useFreshTrack } from '../context/FreshTrackContext';
import { FoodItem, NavSection } from '../types';
import {
  buildCategoryDistribution,
  buildMonthlyTrends,
  computeSummaryMetrics,
} from '../utils/analyticsHelpers';
import { exportInventoryToCSV, formatReadableDate, getFreshnessMeta } from '../utils/freshnessEngine';

interface DashboardPageProps {
  onNavigate: (nav: NavSection) => void;
  onOpenAddModal: () => void;
  onOpenLogWaste: (item: FoodItem) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenAddModal,
  onOpenLogWaste,
}) => {
  const {
    inventory,
    wasteRecords,
    consumedRecords,
    activities,
    alerts,
    settings,
    consumeFoodItem,
    addToast,
  } = useFreshTrack();

  const metrics = useMemo(
    () => computeSummaryMetrics(inventory, wasteRecords, consumedRecords, settings),
    [inventory, wasteRecords, consumedRecords, settings]
  );

  const consumeFirstItems = useMemo(() => {
    return inventory
      .map((item) => ({
        item,
        meta: getFreshnessMeta(item.expiryDate, settings),
      }))
      .filter(({ meta }) => meta.status !== 'expired')
      .sort((a, b) => a.meta.daysRemaining - b.meta.daysRemaining)
      .slice(0, 5);
  }, [inventory, settings]);

  const monthlyTrends = useMemo(
    () => buildMonthlyTrends(wasteRecords, consumedRecords),
    [wasteRecords, consumedRecords]
  );

  const categoryDist = useMemo(() => buildCategoryDistribution(inventory), [inventory]);

  const storageOverview = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of inventory) {
      map.set(item.storageLocation, (map.get(item.storageLocation) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [inventory]);

  const summaryCards = [
    {
      label: 'Total Food Items',
      value: String(metrics.totalItems),
      subtext: `${storageOverview.length} active storage zones`,
      icon: Package,
      accentClass: 'text-slate-700 bg-slate-100 dark:text-slate-200 dark:bg-slate-800',
      onClick: () => onNavigate('inventory'),
    },
    {
      label: 'Fresh Items',
      value: String(metrics.freshCount),
      subtext: `More than ${settings.expiringSoonDaysThreshold} days remaining`,
      icon: CheckCircle2,
      accentClass:
        'text-[#059669] bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/60',
      onClick: () => onNavigate('inventory'),
    },
    {
      label: 'Expiring Soon',
      value: String(metrics.approachingExpiryCount),
      subtext: `${metrics.warningCount} urgent (1–${settings.warningDaysThreshold}d) · ${metrics.expiringSoonCount} soon`,
      icon: Clock,
      accentClass: 'text-[#F59E0B] bg-amber-50 dark:text-amber-300 dark:bg-amber-950/60',
      onClick: () => onNavigate('prediction'),
    },
    {
      label: 'Expired Items',
      value: String(metrics.expiredCount),
      subtext: 'Requires inspection or disposal',
      icon: AlertCircle,
      accentClass: 'text-[#EF4444] bg-red-50 dark:text-red-300 dark:bg-red-950/60',
      onClick: () => onNavigate('alerts'),
    },
    {
      label: 'Total Food Saved',
      value: `${metrics.totalSavedKg} kg`,
      subtext: `${settings.currencySymbol}${metrics.totalMoneySaved.toFixed(2)} saved from waste`,
      icon: Leaf,
      accentClass:
        'text-[#064E3B] bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/60',
      onClick: () => onNavigate('waste'),
    },
    {
      label: 'Food Waste Percentage',
      value: `${metrics.foodWastePercentage}%`,
      subtext: `${metrics.totalWasteKg} kg wasted (${settings.currencySymbol}${metrics.totalFinancialLoss.toFixed(2)})`,
      icon: TrendingDown,
      accentClass: 'text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800',
      onClick: () => onNavigate('analytics'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header & Quick Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Operations Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time inventory freshness, priority consumption queue, and waste reduction impact.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#059669] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#064E3B] whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Food Item
          </button>
          <button
            type="button"
            onClick={() => onNavigate('waste')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5 text-slate-500" />
            Log Waste
          </button>
          <button
            type="button"
            onClick={() => {
              exportInventoryToCSV(inventory, settings);
              addToast({
                type: 'success',
                title: 'Inventory exported',
                message: 'CSV report downloaded.',
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            Print Report
          </button>
        </div>
      </div>

      {/* 6 Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={card.onClick}
              className="group flex items-start justify-between rounded-xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {card.label}
                </p>
                <p className="mt-2 font-display text-2xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                  {card.subtext}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.accentClass}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Consume First Queue + Expiry Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Consume First Priority Queue (2 cols) */}
        <section className="rounded-xl border border-slate-200 bg-white lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Consume First
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Active inventory sorted automatically by earliest upcoming expiry date.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#059669] hover:text-[#064E3B] dark:text-emerald-400 whitespace-nowrap"
            >
              Full Inventory
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {consumeFirstItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No active non-expired items in inventory. Add items to start tracking priority usage.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {consumeFirstItems.map(({ item, meta }) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {item.name}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {item.category}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs font-mono-tabular text-slate-600 dark:text-slate-300">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {item.storageLocation} · Expires {formatReadableDate(item.expiryDate)} (
                      {item.expirySource === 'manufacturer' ? 'Manufacturer' : 'Estimated'})
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <FreshnessBadge
                      status={meta.status}
                      label={meta.label}
                      daysLabel={meta.daysLabel}
                    />
                    <button
                      type="button"
                      onClick={() => consumeFoodItem(item.id)}
                      title="Mark as consumed and add to Total Food Saved"
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-[#064E3B] transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 whitespace-nowrap"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Consumed
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenLogWaste(item)}
                      title="Log waste for this item"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
                    >
                      Waste
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Smart Expiry Alerts Summary */}
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Expiry Alerts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {alerts.length} active notifications
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('alerts')}
              className="text-xs font-medium text-[#059669] hover:text-[#064E3B] dark:text-emerald-400"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No urgent alerts right now. Everything is in good standing.
              </div>
            ) : (
              alerts.slice(0, 4).map((alert) => {
                const icon =
                  alert.severity === 'critical' ? (
                    <AlertCircle className="h-4 w-4 text-[#EF4444] shrink-0" />
                  ) : alert.severity === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 text-[#F59E0B] shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                  );

                return (
                  <div key={alert.id} className="px-5 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">{icon}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {alert.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Charts Row: Food Consumption Trends + Food Category Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Food Consumption &amp; Waste Trends
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly food saved vs. wasted (normalized kg)
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="text-xs font-medium text-[#059669] hover:text-[#064E3B] dark:text-emerald-400"
            >
              Full Analytics
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="savedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="wasteFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="savedKg"
                  name="Saved (kg)"
                  stroke="#059669"
                  strokeWidth={2}
                  fill="url(#savedFill)"
                />
                <Area
                  type="monotone"
                  dataKey="wastedKg"
                  name="Wasted (kg)"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fill="url(#wasteFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Inventory by Food Category
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Active item count across tracked food groups
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="text-xs font-medium text-[#059669] hover:text-[#064E3B] dark:text-emerald-400"
            >
              Manage Stock
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDist} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={48}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="items" name="Items" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Inventory Overview + Recent Activities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Storage &amp; Inventory Overview
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Distribution of current stock across storage locations
          </p>

          <div className="mt-4 space-y-3">
            {storageOverview.length === 0 ? (
              <p className="text-xs text-slate-500">No items in storage yet.</p>
            ) : (
              storageOverview.map(([location, count]) => {
                const pct =
                  inventory.length > 0 ? Math.round((count / inventory.length) * 100) : 0;
                return (
                  <div key={location}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {location}
                      </span>
                      <span className="font-mono-tabular text-slate-500 dark:text-slate-400">
                        {count} {count === 1 ? 'item' : 'items'} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-[#059669]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Recent Activities
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Latest inventory updates, consumption logs, and waste entries
          </p>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {activities.slice(0, 5).map((act) => (
              <div key={act.id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    {act.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {act.detail}
                  </p>
                </div>
                <span className="text-[11px] font-mono-tabular text-slate-400 whitespace-nowrap shrink-0">
                  {new Date(act.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
