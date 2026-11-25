import React, { useMemo, useState } from 'react';
import {
  DollarSign,
  Download,
  Leaf,
  PlusCircle,
  Scale,
  TrendingDown,
  X,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { useFreshTrack } from '../context/FreshTrackContext';
import {
  FOOD_UNITS,
  WASTE_REASONS,
  WasteReason,
  WasteRecord,
} from '../types';
import { computeSummaryMetrics } from '../utils/analyticsHelpers';
import {
  downloadCSV,
  formatReadableDate,
  getDefaultUnitCost,
  getTodayISO,
} from '../utils/freshnessEngine';

export const WasteTrackingPage: React.FC = () => {
  const {
    inventory,
    wasteRecords,
    consumedRecords,
    categories,
    settings,
    logWasteRecord,
    deleteWasteRecord,
    addToast,
  } = useFreshTrack();

  // Form State
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [foodName, setFoodName] = useState('');
  const [category, setCategory] = useState(categories[0] ?? 'Vegetables');
  const [quantityWasted, setQuantityWasted] = useState('1');
  const [unit, setUnit] = useState('KG');
  const [reason, setReason] = useState<WasteReason>('Expired Before Use');
  const [date, setDate] = useState(getTodayISO());
  const [estimatedCost, setEstimatedCost] = useState('3.50');
  const [deductFromStock, setDeductFromStock] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Table Filters
  const [reasonFilter, setReasonFilter] = useState<'All' | WasteReason>('All');
  const [deleteTarget, setDeleteTarget] = useState<WasteRecord | null>(null);

  const metrics = useMemo(
    () => computeSummaryMetrics(inventory, wasteRecords, consumedRecords, settings),
    [inventory, wasteRecords, consumedRecords, settings]
  );

  const handleSelectInventoryItem = (id: string) => {
    setSelectedInventoryId(id);
    if (!id) return;
    const item = inventory.find((i) => i.id === id);
    if (item) {
      setFoodName(item.name);
      setCategory(item.category);
      setQuantityWasted(String(item.quantity));
      setUnit(item.unit);
      setEstimatedCost((item.quantity * item.unitCost).toFixed(2));
      setFormErrors({});
    }
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!foodName.trim()) errs.foodName = 'Food name is required.';
    const qty = Number(quantityWasted);
    if (!qty || qty <= 0) errs.quantityWasted = 'Enter a quantity greater than 0.';
    if (!date) errs.date = 'Date is required.';
    const cost = Number(estimatedCost);
    if (estimatedCost === '' || Number.isNaN(cost) || cost < 0) {
      errs.estimatedCost = 'Enter a valid non-negative cost.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    logWasteRecord(
      {
        foodItemId: selectedInventoryId || undefined,
        foodName: foodName.trim(),
        category,
        quantityWasted: Number(quantityWasted),
        unit,
        reason,
        date,
        estimatedCost: Number(Number(estimatedCost).toFixed(2)),
      },
      selectedInventoryId && deductFromStock ? selectedInventoryId : undefined
    );

    setSelectedInventoryId('');
    setFoodName('');
    setQuantityWasted('1');
    setEstimatedCost(getDefaultUnitCost(category).toFixed(2));
    setFormErrors({});
  };

  const filteredWaste = useMemo(() => {
    return wasteRecords
      .filter((w) => reasonFilter === 'All' || w.reason === reasonFilter)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [reasonFilter, wasteRecords]);

  const handleExportWasteCSV = () => {
    const headers = [
      'Food Name',
      'Category',
      'Quantity Wasted',
      'Unit',
      'Normalized KG',
      'Reason',
      'Date',
      'Estimated Cost',
    ];
    const rows = filteredWaste.map((w) => [
      w.foodName,
      w.category,
      w.quantityWasted,
      w.unit,
      w.normalizedKg,
      w.reason,
      w.date,
      w.estimatedCost.toFixed(2),
    ]);
    downloadCSV(`freshtrack-waste-log-${getTodayISO()}.csv`, headers, rows);
    addToast({
      type: 'success',
      title: 'Waste log exported',
      message: `${filteredWaste.length} records saved to CSV.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Food Waste Reduction &amp; Tracking
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Record wasted food, quantify financial losses, and measure your sustainability savings over time.
        </p>
      </div>

      {/* Sustainability Impact Section */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Food Saved
            </p>
            <Leaf className="h-4 w-4 text-[#059669]" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
            {metrics.totalSavedKg} kg
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Across {consumedRecords.length} consumed batches
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Food Waste
            </p>
            <Scale className="h-4 w-4 text-[#EF4444]" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
            {metrics.totalWasteKg} kg
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {settings.currencySymbol}
            {metrics.totalFinancialLoss.toFixed(2)} estimated loss
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Estimated Money Saved
            </p>
            <DollarSign className="h-4 w-4 text-[#059669]" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold font-mono-tabular text-[#059669] dark:text-emerald-400">
            {settings.currencySymbol}
            {metrics.totalMoneySaved.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Value retained before expiry
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Waste Reduction Percentage
            </p>
            <TrendingDown className="h-4 w-4 text-[#064E3B] dark:text-emerald-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
            {metrics.wasteReductionPercentage}%
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Saved share of total tracked food
          </p>
        </div>
      </section>

      {/* Main Split: Recording Form + Waste Ledger */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Food Waste Recording Form */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-[#059669]" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Record Food Waste
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Log spoiled or discarded items to update analytics and cost impact.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <div>
              <label
                htmlFor="link-inv"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Quick-Fill from Active Inventory (Optional)
              </label>
              <select
                id="link-inv"
                value={selectedInventoryId}
                onChange={(e) => handleSelectInventoryItem(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">— Enter manually —</option>
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.quantity} {item.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="waste-food-name"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Food Name *
              </label>
              <input
                id="waste-food-name"
                type="text"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="e.g., Baby Spinach"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              {formErrors.foodName && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {formErrors.foodName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="waste-cat"
                  className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Category
                </label>
                <select
                  id="waste-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
                  htmlFor="waste-unit"
                  className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Unit
                </label>
                <select
                  id="waste-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {FOOD_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="waste-qty"
                  className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Quantity Wasted *
                </label>
                <input
                  id="waste-qty"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={quantityWasted}
                  onChange={(e) => setQuantityWasted(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono-tabular text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                {formErrors.quantityWasted && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {formErrors.quantityWasted}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="waste-cost"
                  className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Estimated Cost ({settings.currencySymbol}) *
                </label>
                <input
                  id="waste-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono-tabular text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                {formErrors.estimatedCost && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {formErrors.estimatedCost}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="waste-reason"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Reason for Wastage *
              </label>
              <select
                id="waste-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as WasteReason)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {WASTE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="waste-date"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Date *
              </label>
              <input
                id="waste-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono-tabular text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              {formErrors.date && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.date}</p>
              )}
            </div>

            {selectedInventoryId && (
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={deductFromStock}
                  onChange={(e) => setDeductFromStock(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#059669] focus:ring-[#059669]"
                />
                <span>Deduct wasted quantity from selected inventory item</span>
              </label>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-[#059669] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#064E3B]"
            >
              Log Food Waste
            </button>
          </form>
        </section>

        {/* Waste Records Table */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Recorded Food Waste Ledger
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {filteredWaste.length} waste events logged
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Filter waste by reason"
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value as 'All' | WasteReason)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="All">All Reasons</option>
                {WASTE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleExportWasteCSV}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          {filteredWaste.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No waste records found"
                description="No food waste entries match the current filter. Keep up the zero-waste streak!"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                    <th className="px-4 py-3 whitespace-nowrap">Food Name</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Quantity</th>
                    <th className="px-4 py-3 whitespace-nowrap">Reason</th>
                    <th className="px-4 py-3 whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Est. Loss</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredWaste.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {record.foodName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {record.category}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono-tabular text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {record.quantityWasted} {record.unit}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {record.reason}
                      </td>
                      <td className="px-4 py-3 font-mono-tabular text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatReadableDate(record.date)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-tabular text-xs font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                        {settings.currencySymbol}
                        {record.estimatedCost.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(record)}
                          aria-label={`Delete waste record for ${record.foodName}`}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/60 dark:hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete waste record for ${deleteTarget?.foodName ?? ''}?`}
        description="Removing this waste log will immediately recalculate your total food waste and financial loss charts."
        confirmLabel="Delete Record"
        onConfirm={() => {
          if (deleteTarget) deleteWasteRecord(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
