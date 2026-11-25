import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, Calendar, Info, X } from 'lucide-react';
import { useFreshTrack } from '../context/FreshTrackContext';
import {
  ExpirySource,
  FOOD_UNITS,
  FoodItem,
  STORAGE_CONDITIONS,
  STORAGE_LOCATIONS,
  StorageCondition,
} from '../types';
import {
  getDefaultUnitCost,
  getTodayISO,
  predictShelfLife,
} from '../utils/freshnessEngine';

interface FoodItemModalProps {
  open: boolean;
  editingItem?: FoodItem | null;
  onClose: () => void;
}

export const FoodItemModal: React.FC<FoodItemModalProps> = ({
  open,
  editingItem,
  onClose,
}) => {
  const { categories, addFoodItem, updateFoodItem, settings } = useFreshTrack();

  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0] ?? 'Vegetables');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('KG');
  const [purchaseDate, setPurchaseDate] = useState(getTodayISO());
  const [expiryDate, setExpiryDate] = useState('');
  const [expirySource, setExpirySource] = useState<ExpirySource>('manufacturer');
  const [storageLocation, setStorageLocation] = useState(STORAGE_LOCATIONS[0]);
  const [storageCondition, setStorageCondition] = useState<StorageCondition>(
    STORAGE_CONDITIONS[0]
  );
  const [unitCost, setUnitCost] = useState('3.00');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (editingItem) {
      setName(editingItem.name);
      setCategory(editingItem.category);
      setQuantity(String(editingItem.quantity));
      setUnit(editingItem.unit);
      setPurchaseDate(editingItem.purchaseDate);
      setExpiryDate(editingItem.expiryDate);
      setExpirySource(editingItem.expirySource);
      setStorageLocation(editingItem.storageLocation);
      setStorageCondition(editingItem.storageCondition);
      setUnitCost(String(editingItem.unitCost));
      setNotes(editingItem.notes ?? '');
    } else {
      const today = getTodayISO();
      const defaultCat = categories[0] ?? 'Vegetables';
      const defaultCond: StorageCondition = 'Refrigerated (2–4°C)';
      const pred = predictShelfLife('', defaultCat, defaultCond, today);
      setName('');
      setCategory(defaultCat);
      setQuantity('1');
      setUnit('KG');
      setPurchaseDate(today);
      setExpiryDate(pred.estimatedExpiryDate);
      setExpirySource('estimated');
      setStorageLocation('Refrigerator');
      setStorageCondition(defaultCond);
      setUnitCost(getDefaultUnitCost(defaultCat).toFixed(2));
      setNotes('');
    }
    setErrors({});
  }, [categories, editingItem, open]);

  const prediction = useMemo(
    () => predictShelfLife(name, category, storageCondition, purchaseDate),
    [name, category, storageCondition, purchaseDate]
  );

  // When expirySource is 'estimated' on a new item, keep expiryDate synced with prediction
  useEffect(() => {
    if (!editingItem && expirySource === 'estimated') {
      setExpiryDate(prediction.estimatedExpiryDate);
    }
  }, [editingItem, expirySource, prediction.estimatedExpiryDate]);

  if (!open) return null;

  const handleCategoryChange = (nextCat: string) => {
    setCategory(nextCat);
    if (!editingItem) {
      setUnitCost(getDefaultUnitCost(nextCat).toFixed(2));
    }
  };

  const applyEstimatedDate = () => {
    setExpirySource('estimated');
    setExpiryDate(prediction.estimatedExpiryDate);
    setErrors((prev) => ({ ...prev, expiryDate: '' }));
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) {
      nextErrors.name = 'Food name is required.';
    }
    const qtyNum = Number(quantity);
    if (!quantity || Number.isNaN(qtyNum) || qtyNum <= 0) {
      nextErrors.quantity = 'Enter a valid quantity greater than 0.';
    }
    if (!purchaseDate) {
      nextErrors.purchaseDate = 'Purchase date is required.';
    }
    if (!expiryDate) {
      nextErrors.expiryDate = 'Expiry date is required.';
    } else if (purchaseDate && expiryDate < purchaseDate) {
      nextErrors.expiryDate = 'Expiry date cannot be earlier than purchase date.';
    }
    const costNum = Number(unitCost);
    if (unitCost === '' || Number.isNaN(costNum) || costNum < 0) {
      nextErrors.unitCost = 'Enter a valid non-negative unit cost.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      category,
      quantity: Number(quantity),
      unit,
      purchaseDate,
      expiryDate,
      expirySource,
      storageLocation,
      storageCondition,
      estimatedShelfLifeDays: prediction.estimatedDays,
      estimatedExpiryDate: prediction.estimatedExpiryDate,
      unitCost: Number(unitCost),
      notes: notes.trim() || undefined,
    };

    if (editingItem) {
      updateFoodItem(editingItem.id, payload);
    } else {
      addFoodItem(payload);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="food-modal-title"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2
              id="food-modal-title"
              className="text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              {editingItem ? `Edit ${editingItem.name}` : 'Add Food Item'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Record inventory quantities, storage conditions, and expiry tracking details.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="food-name"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Food Name *
              </label>
              <input
                id="food-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Organic Whole Milk"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="food-category"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Category *
              </label>
              <select
                id="food-category"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="food-qty"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Quantity *
              </label>
              <input
                id="food-qty"
                type="number"
                step="0.01"
                min="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono-tabular text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              {errors.quantity && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="food-unit"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Unit *
              </label>
              <select
                id="food-unit"
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

            <div>
              <label
                htmlFor="food-cost"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Cost per Unit ({settings.currencySymbol})
              </label>
              <input
                id="food-cost"
                type="number"
                step="0.01"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono-tabular text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              {errors.unitCost && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.unitCost}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="storage-location"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Storage Location *
              </label>
              <select
                id="storage-location"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {STORAGE_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="storage-condition"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Storage Condition *
              </label>
              <select
                id="storage-condition"
                value={storageCondition}
                onChange={(e) => setStorageCondition(e.target.value as StorageCondition)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {STORAGE_CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="purchase-date"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Purchase Date *
              </label>
              <input
                id="purchase-date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono-tabular text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              {errors.purchaseDate && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.purchaseDate}
                </p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label
                  htmlFor="expiry-date"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Expiry Date *
                </label>
                <button
                  type="button"
                  onClick={applyEstimatedDate}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#059669] hover:text-[#064E3B] dark:text-emerald-400 dark:hover:text-emerald-300 whitespace-nowrap"
                >
                  <Calculator className="h-3 w-3" />
                  Use Estimated ({prediction.estimatedDays}d)
                </button>
              </div>
              <input
                id="expiry-date"
                type="date"
                value={expiryDate}
                onChange={(e) => {
                  setExpiryDate(e.target.value);
                  setExpirySource('manufacturer');
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono-tabular text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              {errors.expiryDate && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.expiryDate}</p>
              )}
            </div>
          </div>

          {/* Transparent Source Toggle & Rule Explanation */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                <Calendar className="h-4 w-4 text-[#059669]" />
                <span>Expiry Date Source</span>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setExpirySource('manufacturer')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    expirySource === 'manufacturer'
                      ? 'bg-[#059669] text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  Manufacturer Date
                </button>
                <button
                  type="button"
                  onClick={applyEstimatedDate}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    expirySource === 'estimated'
                      ? 'bg-[#059669] text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  Rule-Based Estimate
                </button>
              </div>
            </div>

            <div className="mt-2.5 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <p>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Shelf-Life Rule:
                </span>{' '}
                {prediction.appliedRuleReason} (Estimated date:{' '}
                <span className="font-mono-tabular font-medium text-slate-800 dark:text-slate-200">
                  {prediction.estimatedExpiryDate}
                </span>
                ).
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="food-notes"
              className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Notes (Optional)
            </label>
            <input
              id="food-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Batch label, supplier, or storage tip"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#059669] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#064E3B] whitespace-nowrap shrink-0"
            >
              {editingItem ? 'Save Changes' : 'Add Food Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
