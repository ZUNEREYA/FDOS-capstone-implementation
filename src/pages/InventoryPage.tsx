import React, { useMemo, useState } from 'react';
import {
  Check,
  Download,
  Edit2,
  FolderCog,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { CategoryManagerModal } from '../components/CategoryManagerModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { FreshnessBadge } from '../components/FreshnessBadge';
import { useFreshTrack } from '../context/FreshTrackContext';
import { FoodItem, FreshnessStatus, STORAGE_LOCATIONS } from '../types';
import { exportInventoryToCSV, formatReadableDate, getFreshnessMeta } from '../utils/freshnessEngine';

interface InventoryPageProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (item: FoodItem) => void;
  onOpenLogWaste: (item: FoodItem) => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  searchQuery,
  onSearchChange,
  onOpenAddModal,
  onOpenEditModal,
  onOpenLogWaste,
}) => {
  const { inventory, categories, settings, consumeFoodItem, deleteFoodItem, addToast } =
    useFreshTrack();

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | FreshnessStatus>('all');
  const [locationFilter, setLocationFilter] = useState('All');
  const [expiryFrom, setExpiryFrom] = useState('');
  const [expiryTo, setExpiryTo] = useState('');
  const [sortBy, setSortBy] = useState<'expiryAsc' | 'nameAsc' | 'purchaseDesc'>('expiryAsc');
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FoodItem | null>(null);

  const enriched = useMemo(() => {
    return inventory.map((item) => ({
      item,
      meta: getFreshnessMeta(item.expiryDate, settings),
    }));
  }, [inventory, settings]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enriched
      .filter(({ item, meta }) => {
        if (
          q &&
          !item.name.toLowerCase().includes(q) &&
          !item.category.toLowerCase().includes(q) &&
          !item.storageLocation.toLowerCase().includes(q)
        ) {
          return false;
        }
        if (categoryFilter !== 'All' && item.category !== categoryFilter) {
          return false;
        }
        if (statusFilter !== 'all' && meta.status !== statusFilter) {
          return false;
        }
        if (locationFilter !== 'All' && item.storageLocation !== locationFilter) {
          return false;
        }
        if (expiryFrom && item.expiryDate < expiryFrom) {
          return false;
        }
        if (expiryTo && item.expiryDate > expiryTo) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'expiryAsc') {
          return a.meta.daysRemaining - b.meta.daysRemaining;
        }
        if (sortBy === 'nameAsc') {
          return a.item.name.localeCompare(b.item.name);
        }
        return b.item.purchaseDate.localeCompare(a.item.purchaseDate);
      });
  }, [
    categoryFilter,
    enriched,
    expiryFrom,
    expiryTo,
    locationFilter,
    searchQuery,
    sortBy,
    statusFilter,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    categoryFilter !== 'All' ||
    statusFilter !== 'all' ||
    locationFilter !== 'All' ||
    expiryFrom !== '' ||
    expiryTo !== '';

  const clearFilters = () => {
    onSearchChange('');
    setCategoryFilter('All');
    setStatusFilter('all');
    setLocationFilter('All');
    setExpiryFrom('');
    setExpiryTo('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Food Inventory Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track quantities, storage locations, purchase dates, and manufacturer or estimated expiry dates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCatModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <FolderCog className="h-3.5 w-3.5 text-slate-500" />
            Manage Categories
          </button>
          <button
            type="button"
            onClick={() => {
              exportInventoryToCSV(filtered.map((f) => f.item), settings);
              addToast({
                type: 'success',
                title: 'Filtered inventory exported',
                message: `${filtered.length} records saved to CSV.`,
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#059669] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#064E3B] whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Food
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search food name, category, location..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#059669] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by storage location"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="All">All Locations</option>
            {STORAGE_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              aria-label="Expiry date from"
              title="Expiry date from"
              value={expiryFrom}
              onChange={(e) => setExpiryFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-mono-tabular text-slate-700 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
            <span className="text-xs text-slate-400">–</span>
            <input
              type="date"
              aria-label="Expiry date to"
              title="Expiry date to"
              value={expiryTo}
              onChange={(e) => setExpiryTo(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-mono-tabular text-slate-700 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <select
            aria-label="Sort inventory"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="expiryAsc">Soonest Expiry First</option>
            <option value="nameAsc">Name (A–Z)</option>
            <option value="purchaseDesc">Newest Purchase</option>
          </select>
        </div>

        {/* Status Segmented Tabs + Reset */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'fresh', label: 'Fresh' },
                { id: 'expiring_soon', label: 'Expiring Soon' },
                { id: 'warning', label: 'Warning' },
                { id: 'expired', label: 'Expired' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono-tabular">
              Showing {filtered.length} of {inventory.length} items
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 font-medium text-[#059669] hover:text-[#064E3B] dark:text-emerald-400"
              >
                <X className="h-3.5 w-3.5" />
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Table or Empty State */}
      {filtered.length === 0 ? (
        <EmptyState
          title={
            inventory.length === 0
              ? 'Your food inventory is empty'
              : 'No food items match your current filters'
          }
          description={
            inventory.length === 0
              ? 'Start by adding your groceries or kitchen stock to monitor freshness and prevent waste.'
              : 'Try clearing your search query or adjusting the category, date, and freshness filters.'
          }
          actionLabel={inventory.length === 0 ? 'Add First Food Item' : 'Clear All Filters'}
          onAction={inventory.length === 0 ? onOpenAddModal : clearFilters}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                  <th className="px-4 py-3 whitespace-nowrap">Food Item</th>
                  <th className="px-4 py-3 whitespace-nowrap">Category</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Quantity</th>
                  <th className="px-4 py-3 whitespace-nowrap">Purchase Date</th>
                  <th className="px-4 py-3 whitespace-nowrap">Expiry Date</th>
                  <th className="px-4 py-3 whitespace-nowrap">Storage &amp; Condition</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Est. Shelf Life</th>
                  <th className="px-4 py-3 whitespace-nowrap">Freshness Status</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(({ item, meta }) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {item.name}
                      </p>
                      {item.notes && (
                        <p className="max-w-[200px] truncate text-xs text-slate-500 dark:text-slate-400">
                          {item.notes}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {item.category}
                    </td>

                    <td className="px-4 py-3 text-right font-mono-tabular text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {item.quantity} {item.unit}
                    </td>

                    <td className="px-4 py-3 font-mono-tabular text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatReadableDate(item.purchaseDate)}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-mono-tabular text-xs font-medium text-slate-900 dark:text-slate-100">
                        {formatReadableDate(item.expiryDate)}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.expirySource === 'manufacturer'
                          ? 'Manufacturer Date'
                          : 'Rule-Based Estimate'}
                      </p>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {item.storageLocation}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.storageCondition}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-right font-mono-tabular text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {item.estimatedShelfLifeDays} days
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <FreshnessBadge
                        status={meta.status}
                        label={meta.label}
                        daysLabel={meta.daysLabel}
                      />
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => consumeFoodItem(item.id)}
                          title="Mark Consumed (Saved)"
                          aria-label={`Mark ${item.name} consumed`}
                          className="rounded-md p-1.5 text-[#059669] transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/60"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(item)}
                          title="Edit item"
                          aria-label={`Edit ${item.name}`}
                          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenLogWaste(item)}
                          title="Log Waste"
                          aria-label={`Log waste for ${item.name}`}
                          className="rounded-md p-1.5 text-amber-600 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/60"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          title="Delete item"
                          aria-label={`Delete ${item.name}`}
                          className="rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CategoryManagerModal open={catModalOpen} onClose={() => setCatModalOpen(false)} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name ?? 'item'}?`}
        description="This will permanently remove the item from your active food inventory without logging it as consumed or wasted."
        confirmLabel="Delete Item"
        onConfirm={() => {
          if (deleteTarget) {
            deleteFoodItem(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
