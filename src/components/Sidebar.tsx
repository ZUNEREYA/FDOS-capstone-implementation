import React from 'react';
import {
  BarChart3,
  BellRing,
  CalendarClock,
  LayoutDashboard,
  Leaf,
  Package,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { useFreshTrack } from '../context/FreshTrackContext';
import { NavSection } from '../types';

interface SidebarProps {
  activeNav: NavSection;
  onSelectNav: (nav: NavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Food Inventory', icon: Package },
  { id: 'prediction', label: 'Expiry Prediction', icon: CalendarClock },
  { id: 'alerts', label: 'Smart Alerts', icon: BellRing },
  { id: 'waste', label: 'Food Waste Tracking', icon: Trash2 },
  { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onSelectNav,
  mobileOpen,
  onCloseMobile,
}) => {
  const { alerts, inventory, settings } = useFreshTrack();
  const urgentCount = alerts.filter(
    (a) => a.severity === 'critical' || a.severity === 'warning'
  ).length;

  const navContent = (
    <div className="flex h-full flex-col justify-between border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              onSelectNav('dashboard');
              onCloseMobile();
            }}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#059669] text-white">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
              FreshTrack
            </span>
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 p-3" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            const showCount = item.id === 'alerts' && urgentCount > 0;
            const showInventoryCount = item.id === 'inventory';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectNav(item.id);
                  onCloseMobile();
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-50 text-[#064E3B] dark:bg-emerald-950/70 dark:text-emerald-300'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive
                        ? 'text-[#059669] dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>

                {showCount && (
                  <span className="ml-2 rounded-md bg-red-100 px-1.5 py-0.5 text-xs font-mono-tabular font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
                    {urgentCount}
                  </span>
                )}
                {showInventoryCount && (
                  <span className="ml-2 text-xs font-mono-tabular text-slate-400 dark:text-slate-500">
                    {inventory.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
            {settings.organizationName}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Local storage synced · {inventory.length} active items
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-[260px] shrink-0 lg:block">{navContent}</aside>

      {/* Mobile Slide-Over Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-50 h-full w-[260px]">{navContent}</aside>
        </div>
      )}
    </>
  );
};
