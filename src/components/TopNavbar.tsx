import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Clock,
  Download,
  Leaf,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { useFreshTrack } from '../context/FreshTrackContext';
import { NavSection } from '../types';
import { exportInventoryToCSV, getFreshnessMeta } from '../utils/freshnessEngine';

interface TopNavbarProps {
  activeNav: NavSection;
  onSelectNav: (nav: NavSection) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenMobileMenu: () => void;
  onOpenAddModal: () => void;
}

const SECTION_LABELS: Record<NavSection, string> = {
  dashboard: 'Dashboard',
  inventory: 'Food Inventory',
  prediction: 'Expiry Prediction',
  alerts: 'Smart Alerts',
  waste: 'Food Waste Tracking',
  analytics: 'Analytics & Reports',
  settings: 'Settings',
};

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeNav,
  onSelectNav,
  searchQuery,
  onSearchChange,
  onOpenMobileMenu,
  onOpenAddModal,
}) => {
  const {
    inventory,
    alerts,
    settings,
    updateSettings,
    dismissAlert,
    consumeFoodItem,
    addToast,
  } = useFreshTrack();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return inventory
      .filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.storageLocation.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [inventory, searchQuery]);

  const unreadCount = alerts.length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
      {/* Left: Mobile Trigger + Brand/Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#059669] text-white">
            <Leaf className="h-4 w-4" />
          </div>
          <span className="font-display text-base font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
            FreshTrack
          </span>
        </div>

        <div className="hidden items-center gap-2 text-sm lg:flex whitespace-nowrap">
          <span className="text-slate-400 dark:text-slate-500">FreshTrack</span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {SECTION_LABELS[activeNav]}
          </span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div ref={searchRef} className="relative hidden max-w-md flex-1 md:block">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setSearchFocused(true);
            }}
            placeholder="Search food items, categories, or storage..."
            aria-label="Search food inventory"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-8 pl-9 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#059669] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {searchFocused && searchQuery.trim().length > 0 && (
          <div className="absolute right-0 left-0 top-full mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            {searchResults.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {searchResults.map((item) => {
                  const meta = getFreshnessMeta(item.expiryDate, settings);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectNav('inventory');
                        setSearchFocused(false);
                      }}
                      className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/70"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.category} · {item.quantity} {item.unit} · {item.storageLocation}
                        </p>
                      </div>
                      <span className="text-xs font-mono-tabular font-medium text-slate-600 dark:text-slate-300">
                        {meta.daysLabel}
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    onSelectNav('inventory');
                    setSearchFocused(false);
                  }}
                  className="w-full bg-slate-50 px-3.5 py-2 text-center text-xs font-medium text-[#059669] hover:bg-slate-100 dark:bg-slate-800/50 dark:text-emerald-400"
                >
                  View all matching items in Food Inventory
                </button>
              </div>
            ) : (
              <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                No inventory items match &ldquo;{searchQuery}&rdquo;.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Primary Action + Theme Toggle + Notifications + Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#059669] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#064E3B] whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Food</span>
        </button>

        <button
          type="button"
          onClick={() => updateSettings({ darkMode: !settings.darkMode })}
          aria-label={settings.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={settings.darkMode ? 'Light mode' : 'Dark mode'}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {settings.darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Intelligent Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((prev) => !prev);
              setProfileOpen(false);
            }}
            aria-label="Open smart notifications"
            className="relative rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-mono-tabular font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Smart Expiry Alerts
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {unreadCount} active {unreadCount === 1 ? 'notification' : 'notifications'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelectNav('alerts');
                    setNotifOpen(false);
                  }}
                  className="text-xs font-medium text-[#059669] hover:text-[#064E3B] dark:text-emerald-400"
                >
                  Open Alerts Center
                </button>
              </div>

              <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                {alerts.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    All food items are fresh and within safe shelf-life windows.
                  </div>
                ) : (
                  alerts.slice(0, 6).map((alert) => {
                    const icon =
                      alert.severity === 'critical' ? (
                        <AlertCircle className="h-4 w-4 text-[#EF4444] shrink-0" />
                      ) : alert.severity === 'warning' ? (
                        <AlertTriangle className="h-4 w-4 text-[#F59E0B] shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                      );

                    return (
                      <div key={alert.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5">{icon}</div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {alert.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                              {alert.message}
                            </p>
                            <div className="mt-2 flex items-center gap-3">
                              {alert.itemId && alert.actionLabel === 'Mark Consumed' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    consumeFoodItem(alert.itemId!);
                                    setNotifOpen(false);
                                  }}
                                  className="text-xs font-medium text-[#059669] hover:underline dark:text-emerald-400"
                                >
                                  Mark Consumed
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => dismissAlert(alert.id)}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((prev) => !prev);
              setNotifOpen(false);
            }}
            aria-label="Open user profile menu"
            className="flex items-center gap-2 rounded-lg border border-slate-200 py-1 pr-2.5 pl-1 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {!avatarError ? (
              <img
                src="/src/assets/images/avatar_profile_1795097012638.jpg"
                alt={settings.userName}
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
                className="h-7 w-7 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#064E3B] text-xs font-semibold text-white">
                {settings.userName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="hidden max-w-[110px] truncate text-xs font-medium text-slate-700 sm:inline dark:text-slate-200">
              {settings.userName}
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {settings.userName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {settings.organizationName}
                </p>
              </div>
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    exportInventoryToCSV(inventory, settings);
                    addToast({
                      type: 'success',
                      title: 'Inventory exported',
                      message: 'CSV file downloaded.',
                    });
                    setProfileOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Download className="h-4 w-4 text-slate-400" />
                  Export Inventory CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectNav('settings');
                    setProfileOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  Workspace Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
