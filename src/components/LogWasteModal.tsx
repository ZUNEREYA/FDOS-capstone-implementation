import React, { useEffect, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { useFreshTrack } from '../context/FreshTrackContext';
import { FoodItem, WASTE_REASONS, WasteReason } from '../types';
import { getTodayISO } from '../utils/freshnessEngine';

interface LogWasteModalProps {
  open: boolean;
  targetItem: FoodItem | null;
  onClose: () => void;
}

export const LogWasteModal: React.FC<LogWasteModalProps> = ({ open, targetItem, onClose }) => {
  const { logWasteRecord, settings } = useFreshTrack();

  const [quantityWasted, setQuantityWasted] = useState('');
  const [reason, setReason] = useState<WasteReason>('Expired Before Use');
  const [date, setDate] = useState(getTodayISO());
  const [estimatedCost, setEstimatedCost] = useState('');
  const [deductInventory, setDeductInventory] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !targetItem) return;
    setQuantityWasted(String(targetItem.quantity));
    setReason('Expired Before Use');
    setDate(getTodayISO());
    setEstimatedCost((targetItem.quantity * targetItem.unitCost).toFixed(2));
    setDeductInventory(true);
    setError('');
  }, [open, targetItem]);

  if (!open || !targetItem) return null;

  const handleQtyChange = (val: string) => {
    setQuantityWasted(val);
    const num = Number(val);
    if (!Number.isNaN(num) && num >= 0) {
      setEstimatedCost((num * targetItem.unitCost).toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(quantityWasted);
    const cost = Number(estimatedCost);
    if (!qty || qty <= 0) {
      setError('Enter a valid wasted quantity greater than 0.');
      return;
    }
    if (Number.isNaN(cost) || cost < 0) {
      setError('Enter a valid estimated cost.');
      return;
    }

    logWasteRecord(
      {
        foodItemId: targetItem.id,
        foodName: targetItem.name,
        category: targetItem.category,
        quantityWasted: qty,
        unit: targetItem.unit,
        reason,
        date,
        estimatedCost: Number(cost.toFixed(2)),
      },
      deductInventory ? targetItem.id : undefined
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-waste-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
              <Trash2 className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="log-waste-title"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                Log Food Waste
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {targetItem.name} · {targetItem.category}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="modal-waste-qty"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Quantity Wasted ({targetItem.unit})
              </label>
              <input
                id="modal-waste-qty"
                type="number"
                step="0.01"
                min="0.01"
                value={quantityWasted}
                onChange={(e) => handleQtyChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono-tabular text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="modal-waste-cost"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Estimated Loss ({settings.currencySymbol})
              </label>
              <input
                id="modal-waste-cost"
                type="number"
                step="0.01"
                min="0"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono-tabular text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="modal-waste-reason"
              className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Reason for Wastage
            </label>
            <select
              id="modal-waste-reason"
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
              htmlFor="modal-waste-date"
              className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Date Recorded
            </label>
            <input
              id="modal-waste-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono-tabular text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={deductInventory}
              onChange={(e) => setDeductInventory(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#059669] focus:ring-[#059669]"
            />
            <span>Deduct wasted quantity from active inventory</span>
          </label>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#EF4444] px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              Record Waste
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
