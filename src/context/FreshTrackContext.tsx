import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityEntry,
  ConsumedRecord,
  DEFAULT_CATEGORIES,
  FoodItem,
  SmartAlert,
  ToastMessage,
  UserSettings,
  WasteRecord,
} from '../types';
import {
  buildSeedActivities,
  buildSeedConsumedRecords,
  buildSeedInventory,
  buildSeedWasteRecords,
  DEFAULT_USER_SETTINGS,
} from '../data/seedData';
import { generateSmartAlerts } from '../utils/alertsEngine';
import { getTodayISO, normalizeQuantityToKg } from '../utils/freshnessEngine';

const STORAGE_KEYS = {
  inventory: 'freshtrack_v1_inventory',
  waste: 'freshtrack_v1_waste',
  consumed: 'freshtrack_v1_consumed',
  activities: 'freshtrack_v1_activities',
  categories: 'freshtrack_v1_categories',
  dismissedAlerts: 'freshtrack_v1_dismissed_alerts',
  settings: 'freshtrack_v1_settings',
};

function readStorage<T>(key: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback();
    return JSON.parse(raw) as T;
  } catch {
    return fallback();
  }
}

interface FreshTrackContextValue {
  inventory: FoodItem[];
  wasteRecords: WasteRecord[];
  consumedRecords: ConsumedRecord[];
  activities: ActivityEntry[];
  categories: string[];
  alerts: SmartAlert[];
  dismissedAlertIds: string[];
  settings: UserSettings;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  addFoodItem: (item: Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt'>) => FoodItem;
  updateFoodItem: (id: string, updates: Partial<Omit<FoodItem, 'id' | 'createdAt'>>) => void;
  deleteFoodItem: (id: string) => void;
  consumeFoodItem: (id: string, quantityUsed?: number) => void;
  logWasteRecord: (
    record: Omit<WasteRecord, 'id' | 'normalizedKg' | 'createdAt'>,
    deductInventoryId?: string
  ) => void;
  deleteWasteRecord: (id: string) => void;
  addCategory: (name: string) => boolean;
  removeCategory: (name: string) => void;
  dismissAlert: (id: string) => void;
  dismissAllAlerts: () => void;
  restoreAlerts: () => void;
  updateSettings: (partial: Partial<UserSettings>) => void;
  resetAllData: () => void;
}

const FreshTrackContext = createContext<FreshTrackContextValue | null>(null);

export const FreshTrackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<FoodItem[]>(() =>
    readStorage(STORAGE_KEYS.inventory, buildSeedInventory)
  );
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>(() =>
    readStorage(STORAGE_KEYS.waste, buildSeedWasteRecords)
  );
  const [consumedRecords, setConsumedRecords] = useState<ConsumedRecord[]>(() =>
    readStorage(STORAGE_KEYS.consumed, buildSeedConsumedRecords)
  );
  const [activities, setActivities] = useState<ActivityEntry[]>(() =>
    readStorage(STORAGE_KEYS.activities, buildSeedActivities)
  );
  const [categories, setCategories] = useState<string[]>(() =>
    readStorage(STORAGE_KEYS.categories, () => [...DEFAULT_CATEGORIES])
  );
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>(() =>
    readStorage(STORAGE_KEYS.dismissedAlerts, () => [])
  );
  const [settings, setSettings] = useState<UserSettings>(() =>
    readStorage(STORAGE_KEYS.settings, () => DEFAULT_USER_SETTINGS)
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Persist to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.waste, JSON.stringify(wasteRecords));
  }, [wasteRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.consumed, JSON.stringify(consumedRecords));
  }, [consumedRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.dismissedAlerts, JSON.stringify(dismissedAlertIds));
  }, [dismissedAlertIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 4200);
    },
    [dismissToast]
  );

  const pushActivity = useCallback(
    (entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => {
      const newEntry: ActivityEntry = {
        ...entry,
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
      };
      setActivities((prev) => [newEntry, ...prev].slice(0, 40));
    },
    []
  );

  const addFoodItem = useCallback(
    (item: Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt'>): FoodItem => {
      const nowISO = new Date().toISOString();
      const created: FoodItem = {
        ...item,
        id: `food-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: nowISO,
        updatedAt: nowISO,
      };
      setInventory((prev) => [created, ...prev]);
      pushActivity({
        type: 'added',
        title: `Added ${created.name} to ${created.storageLocation}`,
        detail: `${created.quantity} ${created.unit} · ${created.category}`,
      });
      addToast({
        type: 'success',
        title: `${created.name} added to inventory`,
        message: `${created.quantity} ${created.unit} stored in ${created.storageLocation}.`,
      });
      return created;
    },
    [addToast, pushActivity]
  );

  const updateFoodItem = useCallback(
    (id: string, updates: Partial<Omit<FoodItem, 'id' | 'createdAt'>>) => {
      let updatedName = '';
      setInventory((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          updatedName = updates.name ?? item.name;
          return {
            ...item,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        })
      );
      if (updatedName) {
        pushActivity({
          type: 'updated',
          title: `Updated ${updatedName}`,
          detail: 'Inventory details or expiry date modified',
        });
        addToast({
          type: 'info',
          title: `${updatedName} updated`,
          message: 'Changes saved to local storage.',
        });
      }
    },
    [addToast, pushActivity]
  );

  const deleteFoodItem = useCallback(
    (id: string) => {
      const target = inventory.find((i) => i.id === id);
      if (!target) return;
      setInventory((prev) => prev.filter((i) => i.id !== id));
      pushActivity({
        type: 'deleted',
        title: `Removed ${target.name}`,
        detail: `${target.quantity} ${target.unit} removed from ${target.storageLocation}`,
      });
      addToast({
        type: 'info',
        title: `${target.name} removed`,
        message: 'Item deleted from inventory.',
      });
    },
    [addToast, inventory, pushActivity]
  );

  const consumeFoodItem = useCallback(
    (id: string, quantityUsed?: number) => {
      const target = inventory.find((i) => i.id === id);
      if (!target) return;

      const qty =
        quantityUsed !== undefined && quantityUsed > 0
          ? Math.min(quantityUsed, target.quantity)
          : target.quantity;
      const remaining = Number((target.quantity - qty).toFixed(2));
      const valueSaved = Number((qty * target.unitCost).toFixed(2));
      const normalizedKg = normalizeQuantityToKg(qty, target.unit);

      const consumed: ConsumedRecord = {
        id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        foodItemId: target.id,
        foodName: target.name,
        category: target.category,
        quantityConsumed: qty,
        unit: target.unit,
        normalizedKg,
        date: getTodayISO(),
        estimatedValueSaved: valueSaved,
        createdAt: new Date().toISOString(),
      };

      setConsumedRecords((prev) => [consumed, ...prev]);

      if (remaining <= 0) {
        setInventory((prev) => prev.filter((i) => i.id !== id));
      } else {
        setInventory((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, quantity: remaining, updatedAt: new Date().toISOString() } : i
          )
        );
      }

      pushActivity({
        type: 'consumed',
        title: `Consumed ${target.name}`,
        detail: `${qty} ${target.unit} saved (${settings.currencySymbol}${valueSaved.toFixed(2)} value)`,
      });

      addToast({
        type: 'success',
        title: `${target.name} marked consumed`,
        message: `Saved ${qty} ${target.unit} (${settings.currencySymbol}${valueSaved.toFixed(2)}).`,
      });
    },
    [addToast, inventory, pushActivity, settings.currencySymbol]
  );

  const logWasteRecord = useCallback(
    (
      record: Omit<WasteRecord, 'id' | 'normalizedKg' | 'createdAt'>,
      deductInventoryId?: string
    ) => {
      const normalizedKg = normalizeQuantityToKg(record.quantityWasted, record.unit);
      const newWaste: WasteRecord = {
        ...record,
        id: `waste-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        normalizedKg,
        createdAt: new Date().toISOString(),
      };

      setWasteRecords((prev) => [newWaste, ...prev]);

      if (deductInventoryId) {
        setInventory((prev) =>
          prev.flatMap((item) => {
            if (item.id !== deductInventoryId) return [item];
            const remaining = Number((item.quantity - record.quantityWasted).toFixed(2));
            if (remaining <= 0) return [];
            return [{ ...item, quantity: remaining, updatedAt: new Date().toISOString() }];
          })
        );
      }

      pushActivity({
        type: 'wasted',
        title: `Logged waste for ${newWaste.foodName}`,
        detail: `${newWaste.quantityWasted} ${newWaste.unit} · ${newWaste.reason} (${settings.currencySymbol}${newWaste.estimatedCost.toFixed(2)})`,
      });

      addToast({
        type: 'warning',
        title: `Waste logged for ${newWaste.foodName}`,
        message: `${newWaste.quantityWasted} ${newWaste.unit} recorded under ${newWaste.reason}.`,
      });
    },
    [addToast, pushActivity, settings.currencySymbol]
  );

  const deleteWasteRecord = useCallback(
    (id: string) => {
      const target = wasteRecords.find((w) => w.id === id);
      if (!target) return;
      setWasteRecords((prev) => prev.filter((w) => w.id !== id));
      addToast({
        type: 'info',
        title: 'Waste record deleted',
        message: `Removed entry for ${target.foodName}.`,
      });
    },
    [addToast, wasteRecords]
  );

  const addCategory = useCallback(
    (name: string): boolean => {
      const trimmed = name.trim();
      if (!trimmed) return false;
      if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        addToast({
          type: 'warning',
          title: 'Category already exists',
          message: `"${trimmed}" is already in your category list.`,
        });
        return false;
      }
      setCategories((prev) => [...prev, trimmed]);
      pushActivity({
        type: 'category',
        title: `Added food category "${trimmed}"`,
        detail: 'Available across inventory forms and filters',
      });
      addToast({
        type: 'success',
        title: `Category "${trimmed}" added`,
      });
      return true;
    },
    [addToast, categories, pushActivity]
  );

  const removeCategory = useCallback(
    (name: string) => {
      if (DEFAULT_CATEGORIES.includes(name)) {
        addToast({
          type: 'warning',
          title: 'Core category protected',
          message: 'Default system categories cannot be deleted.',
        });
        return;
      }
      setCategories((prev) => prev.filter((c) => c !== name));
      addToast({
        type: 'info',
        title: `Category "${name}" removed`,
      });
    },
    [addToast]
  );

  const allAlerts = useMemo(
    () => generateSmartAlerts(inventory, settings),
    [inventory, settings]
  );

  const alerts = useMemo(
    () => allAlerts.filter((a) => !dismissedAlertIds.includes(a.id)),
    [allAlerts, dismissedAlertIds]
  );

  const dismissAlert = useCallback((id: string) => {
    setDismissedAlertIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const dismissAllAlerts = useCallback(() => {
    setDismissedAlertIds(allAlerts.map((a) => a.id));
    addToast({
      type: 'info',
      title: 'All current alerts dismissed',
    });
  }, [addToast, allAlerts]);

  const restoreAlerts = useCallback(() => {
    setDismissedAlertIds([]);
    addToast({
      type: 'info',
      title: 'Smart alerts refreshed',
    });
  }, [addToast]);

  const updateSettings = useCallback(
    (partial: Partial<UserSettings>) => {
      setSettings((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  const resetAllData = useCallback(() => {
    const freshInventory = buildSeedInventory();
    const freshWaste = buildSeedWasteRecords();
    const freshConsumed = buildSeedConsumedRecords();
    const freshActivities = buildSeedActivities();

    setInventory(freshInventory);
    setWasteRecords(freshWaste);
    setConsumedRecords(freshConsumed);
    setActivities(freshActivities);
    setCategories([...DEFAULT_CATEGORIES]);
    setDismissedAlertIds([]);
    addToast({
      type: 'success',
      title: 'Sample dataset restored',
      message: 'All dates dynamically recalculated relative to today.',
    });
  }, [addToast]);

  const value: FreshTrackContextValue = {
    inventory,
    wasteRecords,
    consumedRecords,
    activities,
    categories,
    alerts,
    dismissedAlertIds,
    settings,
    toasts,
    addToast,
    dismissToast,
    addFoodItem,
    updateFoodItem,
    deleteFoodItem,
    consumeFoodItem,
    logWasteRecord,
    deleteWasteRecord,
    addCategory,
    removeCategory,
    dismissAlert,
    dismissAllAlerts,
    restoreAlerts,
    updateSettings,
    resetAllData,
  };

  return <FreshTrackContext.Provider value={value}>{children}</FreshTrackContext.Provider>;
};

export function useFreshTrack(): FreshTrackContextValue {
  const ctx = useContext(FreshTrackContext);
  if (!ctx) {
    throw new Error('useFreshTrack must be used within a FreshTrackProvider');
  }
  return ctx;
}
