import React, { useState } from 'react';
import { FolderPlus, Trash2, X } from 'lucide-react';
import { useFreshTrack } from '../context/FreshTrackContext';
import { DEFAULT_CATEGORIES } from '../types';

interface CategoryManagerModalProps {
  open: boolean;
  onClose: () => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ open, onClose }) => {
  const { categories, inventory, addCategory, removeCategory } = useFreshTrack();
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) {
      setError('Enter a category name.');
      return;
    }
    const added = addCategory(newCategory);
    if (added) {
      setNewCategory('');
      setError('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2
              id="category-modal-title"
              className="text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              Food Category Management
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage food classifications used for filtering and shelf-life defaults.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close category manager"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleAdd} className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => {
                  setNewCategory(e.target.value);
                  setError('');
                }}
                placeholder="New category name (e.g., Condiments)"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#064E3B] whitespace-nowrap shrink-0"
            >
              <FolderPlus className="h-4 w-4" />
              Add Category
            </button>
          </form>

          <div className="mt-5 max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {categories.map((cat) => {
              const count = inventory.filter((item) => item.category === cat).length;
              const isDefault = DEFAULT_CATEGORIES.includes(cat);

              return (
                <div
                  key={cat}
                  className="flex items-center justify-between px-3.5 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                      {cat}
                    </span>
                    <span className="text-xs text-slate-400 font-mono-tabular">
                      {count} {count === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  {isDefault ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500">Default</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeCategory(cat)}
                      aria-label={`Remove category ${cat}`}
                      className="rounded-md p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
