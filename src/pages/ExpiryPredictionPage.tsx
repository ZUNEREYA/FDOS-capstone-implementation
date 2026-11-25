import React, { useMemo, useState } from 'react';
import { Calculator, CalendarClock, Info, ShieldCheck } from 'lucide-react';
import { FreshnessBadge } from '../components/FreshnessBadge';
import { useFreshTrack } from '../context/FreshTrackContext';
import { STORAGE_CONDITIONS, StorageCondition } from '../types';
import {
  formatReadableDate,
  getDaysRemaining,
  getFreshnessMeta,
  getTodayISO,
  predictShelfLife,
  SHELF_LIFE_RULES,
} from '../utils/freshnessEngine';

export const ExpiryPredictionPage: React.FC = () => {
  const { inventory, categories, settings } = useFreshTrack();

  const [simName, setSimName] = useState('Spinach');
  const [simCategory, setSimCategory] = useState('Vegetables');
  const [simCondition, setSimCondition] = useState<StorageCondition>('Refrigerated (2–4°C)');
  const [simPurchaseDate, setSimPurchaseDate] = useState(getTodayISO());

  const activePrediction = useMemo(
    () => predictShelfLife(simName, simCategory, simCondition, simPurchaseDate),
    [simName, simCategory, simCondition, simPurchaseDate]
  );

  const conditionComparisons = useMemo(() => {
    return STORAGE_CONDITIONS.map((cond) => ({
      condition: cond,
      prediction: predictShelfLife(simName, simCategory, cond, simPurchaseDate),
    }));
  }, [simName, simCategory, simPurchaseDate]);

  const inventoryComparison = useMemo(() => {
    return inventory
      .map((item) => {
        const meta = getFreshnessMeta(item.expiryDate, settings);
        const predicted = predictShelfLife(
          item.name,
          item.category,
          item.storageCondition,
          item.purchaseDate
        );
        const predictedDaysLeft = getDaysRemaining(predicted.estimatedExpiryDate);
        const varianceDays = meta.daysRemaining - predictedDaysLeft;
        return {
          item,
          meta,
          predicted,
          varianceDays,
        };
      })
      .sort((a, b) => a.meta.daysRemaining - b.meta.daysRemaining);
  }, [inventory, settings]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Expiry Prediction &amp; Shelf-Life Engine
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Transparent rule-based shelf-life modeling comparing manufacturer dates against storage-condition estimates.
        </p>
      </div>

      {/* Interactive Shelf-Life What-If Simulator */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[#059669] dark:bg-emerald-950/60 dark:text-emerald-400">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Interactive Shelf-Life Simulator
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Test how storage conditions impact predicted shelf life using our deterministic food-science rules.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="sim-name"
              className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Food Name
            </label>
            <input
              id="sim-name"
              type="text"
              value={simName}
              onChange={(e) => setSimName(e.target.value)}
              placeholder="e.g., Spinach, Milk, Chicken"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="sim-category"
              className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Category
            </label>
            <select
              id="sim-category"
              value={simCategory}
              onChange={(e) => setSimCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="sim-condition"
              className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Storage Condition
            </label>
            <select
              id="sim-condition"
              value={simCondition}
              onChange={(e) => setSimCondition(e.target.value as StorageCondition)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {STORAGE_CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="sim-date"
              className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Purchase Date
            </label>
            <input
              id="sim-date"
              type="date"
              value={simPurchaseDate}
              onChange={(e) => setSimPurchaseDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono-tabular text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Active Prediction Result Banner */}
        <div className="mt-5 flex flex-col justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 sm:flex-row sm:items-center dark:border-emerald-900/80 dark:bg-emerald-950/30">
          <div>
            <p className="text-xs font-medium text-[#064E3B] dark:text-emerald-300">
              Transparent Rule Explanation
            </p>
            <p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-slate-100">
              {activePrediction.appliedRuleReason}
            </p>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Predicted Shelf Life</p>
              <p className="font-display text-xl font-bold font-mono-tabular text-[#059669] dark:text-emerald-400">
                {activePrediction.estimatedDays} days
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Estimated Expiry</p>
              <p className="font-display text-xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
                {formatReadableDate(activePrediction.estimatedExpiryDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Storage Condition Comparison Strip */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {conditionComparisons.map(({ condition, prediction }) => {
            const isSelected = condition === simCondition;
            return (
              <button
                key={condition}
                type="button"
                onClick={() => setSimCondition(condition)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  isSelected
                    ? 'border-[#059669] bg-emerald-50/60 dark:border-emerald-500 dark:bg-emerald-950/40'
                    : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-slate-700'
                }`}
              >
                <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                  {condition}
                </p>
                <p className="mt-1 font-mono-tabular text-base font-bold text-slate-900 dark:text-slate-100">
                  {prediction.estimatedDays} days
                </p>
                <p className="mt-0.5 font-mono-tabular text-[11px] text-slate-500 dark:text-slate-400">
                  Until {formatReadableDate(prediction.estimatedExpiryDate)}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Manufacturer Date vs Rule-Based Estimate Audit Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <CalendarClock className="h-5 w-5 text-[#059669]" />
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Inventory Expiry Audit: Manufacturer vs. Rule Estimate
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Active monitoring uses your confirmed expiry date while displaying the model baseline alongside it.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-[#059669]" />
            <span>4-Tier Freshness Thresholds Active</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                <th className="px-4 py-3 whitespace-nowrap">Food Item</th>
                <th className="px-4 py-3 whitespace-nowrap">Storage Condition</th>
                <th className="px-4 py-3 whitespace-nowrap">Active Expiry Date</th>
                <th className="px-4 py-3 whitespace-nowrap">Date Source</th>
                <th className="px-4 py-3 whitespace-nowrap">Rule-Estimated Date</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Variance</th>
                <th className="px-4 py-3 whitespace-nowrap">Freshness Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {inventoryComparison.map(({ item, meta, predicted, varianceDays }) => (
                <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.category}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {item.storageCondition}
                  </td>
                  <td className="px-4 py-3 font-mono-tabular text-xs font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {formatReadableDate(item.expiryDate)}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    <span
                      className={
                        item.expirySource === 'manufacturer'
                          ? 'font-medium text-slate-800 dark:text-slate-200'
                          : 'text-slate-500 dark:text-slate-400'
                      }
                    >
                      {item.expirySource === 'manufacturer'
                        ? 'Manufacturer Provided'
                        : 'Rule-Based Estimate'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-mono-tabular text-xs text-slate-700 dark:text-slate-300">
                      {formatReadableDate(predicted.estimatedExpiryDate)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {predicted.estimatedDays}d from purchase
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono-tabular text-xs whitespace-nowrap">
                    {varianceDays === 0 ? (
                      <span className="text-slate-400">0d</span>
                    ) : varianceDays > 0 ? (
                      <span className="text-emerald-700 dark:text-emerald-400">
                        +{varianceDays}d
                      </span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-400">{varianceDays}d</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <FreshnessBadge
                      status={meta.status}
                      label={meta.label}
                      daysLabel={meta.daysLabel}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Transparent Category Rule Matrix */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <Info className="h-4 w-4 text-slate-400" />
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Baseline Shelf-Life Rule Matrix (Days)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reference baseline days before item-specific adjustments (e.g., leafy greens, pasteurized milk, raw poultry).
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                <th className="px-4 py-2.5 whitespace-nowrap">Category</th>
                {STORAGE_CONDITIONS.map((cond) => (
                  <th key={cond} className="px-4 py-2.5 text-right whitespace-nowrap">
                    {cond}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {Object.entries(SHELF_LIFE_RULES).map(([cat, condMap]) => (
                <tr key={cat} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {cat}
                  </td>
                  {STORAGE_CONDITIONS.map((cond) => (
                    <td
                      key={cond}
                      className="px-4 py-2.5 text-right font-mono-tabular text-slate-600 dark:text-slate-300 whitespace-nowrap"
                    >
                      {condMap[cond]}d
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
