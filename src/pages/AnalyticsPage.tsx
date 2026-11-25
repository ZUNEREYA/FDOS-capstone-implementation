import React, { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFreshTrack } from '../context/FreshTrackContext';
import {
  buildCategoryDistribution,
  buildMonthlyTrends,
  buildMostWastedItems,
  computeSummaryMetrics,
} from '../utils/analyticsHelpers';
import {
  addDaysISO,
  downloadCSV,
  getFreshnessMeta,
  getTodayISO,
} from '../utils/freshnessEngine';

const CATEGORY_COLORS = [
  '#059669',
  '#064E3B',
  '#0D9488',
  '#F59E0B',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#64748B',
];

export const AnalyticsPage: React.FC = () => {
  const { inventory, wasteRecords, consumedRecords, settings, addToast } = useFreshTrack();
  const [dateRange, setDateRange] = useState<'30d' | '90d' | '180d' | 'all'>('all');

  const cutoffDate = useMemo(() => {
    if (dateRange === 'all') return '';
    const days = dateRange === '30d' ? -30 : dateRange === '90d' ? -90 : -180;
    return addDaysISO(getTodayISO(), days);
  }, [dateRange]);

  const filteredWaste = useMemo(
    () =>
      cutoffDate
        ? wasteRecords.filter((w) => w.date >= cutoffDate)
        : wasteRecords,
    [cutoffDate, wasteRecords]
  );

  const filteredConsumed = useMemo(
    () =>
      cutoffDate
        ? consumedRecords.filter((c) => c.date >= cutoffDate)
        : consumedRecords,
    [consumedRecords, cutoffDate]
  );

  const summary = useMemo(
    () => computeSummaryMetrics(inventory, filteredWaste, filteredConsumed, settings),
    [inventory, filteredWaste, filteredConsumed, settings]
  );

  // 1 & 5: Monthly Food Waste Chart & Food Waste Trend Analysis
  const monthlyData = useMemo(
    () => buildMonthlyTrends(filteredWaste, filteredConsumed),
    [filteredWaste, filteredConsumed]
  );

  // 2 & 3: Food Category Distribution & Inventory Quantity Chart
  const categoryData = useMemo(() => buildCategoryDistribution(inventory), [inventory]);

  // 4: Expiry Status Distribution
  const expiryStatusData = useMemo(() => {
    let fresh = 0;
    let expiringSoon = 0;
    let warning = 0;
    let expired = 0;
    for (const item of inventory) {
      const m = getFreshnessMeta(item.expiryDate, settings);
      if (m.status === 'fresh') fresh++;
      else if (m.status === 'expiring_soon') expiringSoon++;
      else if (m.status === 'warning') warning++;
      else expired++;
    }
    return [
      { name: 'Fresh (>7d)', value: fresh, color: '#059669' },
      { name: 'Expiring Soon (4–7d)', value: expiringSoon, color: '#EAB308' },
      { name: 'Warning (1–3d)', value: warning, color: '#F59E0B' },
      { name: 'Expired (<0d)', value: expired, color: '#EF4444' },
    ];
  }, [inventory, settings]);

  // 6: Most Wasted Food Items
  const mostWastedData = useMemo(
    () => buildMostWastedItems(filteredWaste),
    [filteredWaste]
  );

  const handleExportAnalytics = () => {
    const headers = ['Month', 'Saved (kg)', 'Wasted (kg)', 'Saved Value', 'Waste Loss'];
    const rows = monthlyData.map((m) => [
      m.monthLabel,
      m.savedKg,
      m.wastedKg,
      m.savedValue.toFixed(2),
      m.wasteCost.toFixed(2),
    ]);
    downloadCSV(`freshtrack-analytics-${getTodayISO()}.csv`, headers, rows);
    addToast({
      type: 'success',
      title: 'Analytics report exported',
      message: 'Monthly waste and savings summary downloaded.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Analytics &amp; Sustainability Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Live data visualizations across inventory composition, expiry health, consumption, and waste trends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
            {(
              [
                { id: '30d', label: '30D' },
                { id: '90d', label: '90D' },
                { id: '180d', label: '6M' },
                { id: 'all', label: 'All Time' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDateRange(opt.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  dateRange === opt.id
                    ? 'bg-[#059669] text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportAnalytics}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#059669] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#064E3B] whitespace-nowrap"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">Food Saved (Selected Period)</p>
          <p className="mt-1 font-display text-xl font-bold font-mono-tabular text-[#059669] dark:text-emerald-400">
            {summary.totalSavedKg} kg
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">Food Wasted (Selected Period)</p>
          <p className="mt-1 font-display text-xl font-bold font-mono-tabular text-[#EF4444]">
            {summary.totalWasteKg} kg
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">Money Saved</p>
          <p className="mt-1 font-display text-xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
            {settings.currencySymbol}
            {summary.totalMoneySaved.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">Waste Financial Loss</p>
          <p className="mt-1 font-display text-xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
            {settings.currencySymbol}
            {summary.totalFinancialLoss.toFixed(2)}
          </p>
        </div>
      </div>

      {/* 6 Required Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Monthly Food Waste Chart */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 print-break-inside-avoid dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Monthly Food Waste Chart
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Wasted weight (kg) and financial loss ({settings.currencySymbol}) by month
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="wastedKg" name="Wasted (kg)" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="wasteCost"
                  name={`Loss (${settings.currencySymbol})`}
                  fill="#F59E0B"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 2. Food Waste Trend Analysis */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 print-break-inside-avoid dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Food Waste Trend Analysis
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Consumption savings vs. food waste trajectory (kg)
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="savedKg"
                  name="Saved (kg)"
                  stroke="#059669"
                  fill="#059669"
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="wastedKg"
                  name="Wasted (kg)"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 3. Food Category Distribution */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 print-break-inside-avoid dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Food Category Distribution
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Share of active inventory items per category
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="items"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={86}
                  paddingAngle={2}
                >
                  {categoryData.map((entry, idx) => (
                    <Cell
                      key={entry.category}
                      fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 4. Expiry Status Distribution */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 print-break-inside-avoid dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Expiry Status Distribution
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Current inventory health across all 4 freshness tiers
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expiryStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={86}
                  paddingAngle={2}
                >
                  {expiryStatusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 5. Inventory Quantity Chart */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 print-break-inside-avoid dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Inventory Quantity Chart
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Normalized stock weight (kg) and item count by category
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={48}
                />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="totalKg" name="Total Weight (kg)" fill="#064E3B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="items" name="Batches / Items" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 6. Most Wasted Food Items */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 print-break-inside-avoid dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Most Wasted Food Items
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Top wasted foods ranked by financial loss ({settings.currencySymbol}) and weight (kg)
          </p>
          <div className="mt-4 h-64 w-full">
            {mostWastedData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No waste events recorded in this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mostWastedData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="foodName"
                    width={84}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="totalCost"
                    name={`Loss (${settings.currencySymbol})`}
                    fill="#EF4444"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="totalKg"
                    name="Weight (kg)"
                    fill="#F59E0B"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
