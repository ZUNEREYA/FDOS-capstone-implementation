export type NavSection =
  | 'dashboard'
  | 'inventory'
  | 'prediction'
  | 'alerts'
  | 'waste'
  | 'analytics'
  | 'settings';

export type FreshnessStatus = 'fresh' | 'expiring_soon' | 'warning' | 'expired';

export type StorageCondition =
  | 'Refrigerated (2–4°C)'
  | 'Frozen (-18°C)'
  | 'Room Temperature (18–22°C)'
  | 'Cool & Dry (10–15°C)'
  | 'Vacuum Sealed';

export type ExpirySource = 'manufacturer' | 'estimated';

export type WasteReason =
  | 'Expired Before Use'
  | 'Spoilage / Mold'
  | 'Over-Purchased'
  | 'Storage Failure'
  | 'Preparation Trim'
  | 'Other';

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  purchaseDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD (active user-confirmed or manufacturer date)
  expirySource: ExpirySource;
  storageLocation: string;
  storageCondition: StorageCondition;
  estimatedShelfLifeDays: number;
  estimatedExpiryDate: string; // YYYY-MM-DD (computed by rule-based engine)
  unitCost: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WasteRecord {
  id: string;
  foodItemId?: string;
  foodName: string;
  category: string;
  quantityWasted: number;
  unit: string;
  normalizedKg: number;
  reason: WasteReason;
  date: string; // YYYY-MM-DD
  estimatedCost: number;
  notes?: string;
  createdAt: string;
}

export interface ConsumedRecord {
  id: string;
  foodItemId?: string;
  foodName: string;
  category: string;
  quantityConsumed: number;
  unit: string;
  normalizedKg: number;
  date: string; // YYYY-MM-DD
  estimatedValueSaved: number;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  type: 'added' | 'updated' | 'deleted' | 'consumed' | 'wasted' | 'category';
  title: string;
  detail: string;
  timestamp: string;
}

export interface SmartAlert {
  id: string;
  severity: 'critical' | 'warning' | 'caution' | 'advice';
  title: string;
  message: string;
  itemId?: string;
  itemName?: string;
  daysRemaining?: number;
  actionLabel?: string;
  createdAt: string;
}

export interface UserSettings {
  userName: string;
  organizationName: string;
  currencySymbol: '$' | '€' | '£' | '₹';
  warningDaysThreshold: number; // default 3
  expiringSoonDaysThreshold: number; // default 7
  darkMode: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export const DEFAULT_CATEGORIES: string[] = [
  'Fruits',
  'Vegetables',
  'Dairy Products',
  'Meat',
  'Seafood',
  'Grains',
  'Bakery',
  'Beverages',
  'Frozen Foods',
  'Other',
];

export const STORAGE_LOCATIONS: string[] = [
  'Refrigerator',
  'Freezer',
  'Pantry',
  'Countertop',
  'Dry Storage',
  'Cold Cellar',
];

export const STORAGE_CONDITIONS: StorageCondition[] = [
  'Refrigerated (2–4°C)',
  'Frozen (-18°C)',
  'Room Temperature (18–22°C)',
  'Cool & Dry (10–15°C)',
  'Vacuum Sealed',
];

export const FOOD_UNITS: string[] = [
  'Litres',
  'KG',
  'Grams',
  'Pieces',
  'Packets',
  'Bottles',
  'Cartons',
  'Cans',
  'Dozen',
];

export const WASTE_REASONS: WasteReason[] = [
  'Expired Before Use',
  'Spoilage / Mold',
  'Over-Purchased',
  'Storage Failure',
  'Preparation Trim',
  'Other',
];
