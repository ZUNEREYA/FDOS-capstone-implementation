import React, { useState } from 'react';
import { Download, FolderCog, RotateCcw, Save } from 'lucide-react';
import { CategoryManagerModal } from '../components/CategoryManagerModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useFreshTrack } from '../context/FreshTrackContext';
import { UserSettings } from '../types';
import { getTodayISO } from '../utils/freshnessEngine';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    inventory,
    wasteRecords,
    consumedRecords,
    categories,
    updateSettings,
    resetAllData,
    addToast,
  } = useFreshTrack();

  const [userName, setUserName] = useState(settings.userName);
  const [organizationName, setOrganizationName] = useState(settings.organizationName);
  const [currencySymbol, setCurrencySymbol] = useState<UserSettings['currencySymbol']>(
    settings.currencySymbol
  );
  const [warningDays, setWarningDays] = useState(String(settings.warningDaysThreshold));
  const [soonDays, setSoonDays] = useState(String(settings.expiringSoonDaysThreshold));
  const [catOpen, setCatOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [error, setError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const w = Number(warningDays);
    const s = Number(soonDays);
    if (!userName.trim() || !organizationName.trim()) {
      setError('Profile name and organization name cannot be empty.');
      return;
    }
    if (Number.isNaN(w) || Number.isNaN(s) || w < 1 || s <= w) {
      setError('Expiring Soon threshold must be greater than Warning threshold (min 1 day).');
      return;
    }
    setError('');
    updateSettings({
      userName: userName.trim(),
      organizationName: organizationName.trim(),
      currencySymbol,
      warningDaysThreshold: w,
      expiringSoonDaysThreshold: s,
    });
    addToast({
      type: 'success',
      title: 'Settings saved',
      message: 'Alert thresholds and profile preferences updated.',
    });
  };

  const handleExportJSONBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      settings,
      categories,
      inventory,
      wasteRecords,
      consumedRecords,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `freshtrack-backup-${getTodayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({
      type: 'success',
      title: 'Backup exported',
      message: 'Full JSON snapshot downloaded.',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Workspace Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Customize profile details, expiry alert windows, theme appearance, categories, and data backups.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form
          onSubmit={handleSave}
          className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Profile &amp; Alert Thresholds
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="set-username"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                User Name
              </label>
              <input
                id="set-username"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="set-org"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Kitchen / Organization Name
              </label>
              <input
                id="set-org"
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="set-currency"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Currency Symbol
              </label>
              <select
                id="set-currency"
                value={currencySymbol}
                onChange={(e) =>
                  setCurrencySymbol(e.target.value as UserSettings['currencySymbol'])
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
                <option value="₹">₹ (INR)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="set-warning"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Orange Warning Window (Days)
              </label>
              <input
                id="set-warning"
                type="number"
                min="1"
                max="14"
                value={warningDays}
                onChange={(e) => setWarningDays(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono-tabular text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="set-soon"
                className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Yellow Expiring Soon (Days)
              </label>
              <input
                id="set-soon"
                type="number"
                min="2"
                max="30"
                value={soonDays}
                onChange={(e) => setSoonDays(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono-tabular text-slate-900 focus:border-[#059669] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Dark Mode</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Toggle between light canvas and high-contrast slate dark mode.
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ darkMode: !settings.darkMode })}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                settings.darkMode
                  ? 'bg-[#059669] text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {settings.darkMode ? 'Dark Enabled' : 'Enable Dark Mode'}
            </button>
          </div>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#059669] px-5 py-2 text-sm font-medium text-white hover:bg-[#064E3B]"
            >
              <Save className="h-4 w-4" />
              Save Preferences
            </button>
          </div>
        </form>

        {/* Data Management & Categories */}
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Data &amp; Categories
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            All records are persisted automatically in browser LocalStorage.
          </p>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => setCatOpen(true)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span>Manage Food Categories ({categories.length})</span>
              <FolderCog className="h-4 w-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={handleExportJSONBackup}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span>Download JSON Backup</span>
              <Download className="h-4 w-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => setResetConfirmOpen(true)}
              className="flex w-full items-center justify-between rounded-lg border border-red-200 bg-red-50/50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/60"
            >
              <span>Reset Sample Dataset</span>
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>

      <CategoryManagerModal open={catOpen} onClose={() => setCatOpen(false)} />

      <ConfirmDialog
        open={resetConfirmOpen}
        title="Reset all FreshTrack data?"
        description="This will replace your current inventory, waste logs, and saved records with the dynamic sample dataset calculated relative to today."
        confirmLabel="Reset Data"
        variant="warning"
        onConfirm={() => {
          resetAllData();
          setResetConfirmOpen(false);
        }}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </div>
  );
};
