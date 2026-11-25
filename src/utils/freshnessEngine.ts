import { FoodItem, FreshnessStatus, StorageCondition, UserSettings } from '../types';

/**
 * Format a Date object to YYYY-MM-DD in local time.
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's date string in YYYY-MM-DD (local time).
 */
export function getTodayISO(): string {
  return formatDateISO(new Date());
}

/**
 * Adds a number of days to a YYYY-MM-DD string and returns YYYY-MM-DD.
 */
export function addDaysISO(baseISO: string, days: number): string {
  const [y, m, d] = baseISO.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return formatDateISO(dt);
}

/**
 * Computes signed integer days between today (local midnight) and target YYYY-MM-DD.
 */
export function getDaysRemaining(expiryDateISO: string): number {
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = expiryDateISO.split('-').map(Number);
  if (!y || !m || !d) return 0;
  const targetMidnight = new Date(y, m - 1, d);
  const diffMs = targetMidnight.getTime() - todayMidnight.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatReadableDate(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  if (!y || !m || !d) return dateISO;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export interface FreshnessMeta {
  status: FreshnessStatus;
  label: string;
  shortLabel: string;
  daysRemaining: number;
  daysLabel: string;
  description: string;
}

export function getFreshnessMeta(
  expiryDateISO: string,
  settings?: Pick<UserSettings, 'warningDaysThreshold' | 'expiringSoonDaysThreshold'>
): FreshnessMeta {
  const warningMax = settings?.warningDaysThreshold ?? 3;
  const expiringSoonMax = settings?.expiringSoonDaysThreshold ?? 7;
  const days = getDaysRemaining(expiryDateISO);

  if (days < 0) {
    const overdue = Math.abs(days);
    return {
      status: 'expired',
      label: 'Expired',
      shortLabel: 'Expired',
      daysRemaining: days,
      daysLabel: overdue === 1 ? '1 day ago' : `${overdue} days ago`,
      description: 'Expiry date has passed',
    };
  }

  if (days <= warningMax) {
    return {
      status: 'warning',
      label: 'Warning',
      shortLabel: 'Warning',
      daysRemaining: days,
      daysLabel: days === 0 ? 'Expires today' : days === 1 ? '1 day left' : `${days} days left`,
      description: `1 to ${warningMax} days remaining`,
    };
  }

  if (days <= expiringSoonMax) {
    return {
      status: 'expiring_soon',
      label: 'Expiring Soon',
      shortLabel: 'Expiring Soon',
      daysRemaining: days,
      daysLabel: `${days} days left`,
      description: `${warningMax + 1} to ${expiringSoonMax} days remaining`,
    };
  }

  return {
    status: 'fresh',
    label: 'Fresh',
    shortLabel: 'Fresh',
    daysRemaining: days,
    daysLabel: `${days} days left`,
    description: `More than ${expiringSoonMax} days remaining`,
  };
}

/**
 * Transparent Rule-Based Shelf-Life Prediction Matrix (days)
 * Mapped by Category -> StorageCondition.
 */
export const SHELF_LIFE_RULES: Record<string, Record<StorageCondition, number>> = {
  Fruits: {
    'Refrigerated (2–4°C)': 12,
    'Frozen (-18°C)': 180,
    'Room Temperature (18–22°C)': 6,
    'Cool & Dry (10–15°C)': 10,
    'Vacuum Sealed': 18,
  },
  Vegetables: {
    'Refrigerated (2–4°C)': 9,
    'Frozen (-18°C)': 240,
    'Room Temperature (18–22°C)': 4,
    'Cool & Dry (10–15°C)': 14,
    'Vacuum Sealed': 15,
  },
  'Dairy Products': {
    'Refrigerated (2–4°C)': 10,
    'Frozen (-18°C)': 90,
    'Room Temperature (18–22°C)': 1,
    'Cool & Dry (10–15°C)': 2,
    'Vacuum Sealed': 18,
  },
  Meat: {
    'Refrigerated (2–4°C)': 4,
    'Frozen (-18°C)': 180,
    'Room Temperature (18–22°C)': 1,
    'Cool & Dry (10–15°C)': 1,
    'Vacuum Sealed': 12,
  },
  Seafood: {
    'Refrigerated (2–4°C)': 2,
    'Frozen (-18°C)': 150,
    'Room Temperature (18–22°C)': 0,
    'Cool & Dry (10–15°C)': 1,
    'Vacuum Sealed': 6,
  },
  Grains: {
    'Refrigerated (2–4°C)': 365,
    'Frozen (-18°C)': 540,
    'Room Temperature (18–22°C)': 180,
    'Cool & Dry (10–15°C)': 300,
    'Vacuum Sealed': 730,
  },
  Bakery: {
    'Refrigerated (2–4°C)': 8,
    'Frozen (-18°C)': 90,
    'Room Temperature (18–22°C)': 4,
    'Cool & Dry (10–15°C)': 5,
    'Vacuum Sealed': 10,
  },
  Beverages: {
    'Refrigerated (2–4°C)': 21,
    'Frozen (-18°C)': 180,
    'Room Temperature (18–22°C)': 90,
    'Cool & Dry (10–15°C)': 120,
    'Vacuum Sealed': 180,
  },
  'Frozen Foods': {
    'Refrigerated (2–4°C)': 3,
    'Frozen (-18°C)': 240,
    'Room Temperature (18–22°C)': 0,
    'Cool & Dry (10–15°C)': 1,
    'Vacuum Sealed': 270,
  },
  Other: {
    'Refrigerated (2–4°C)': 45,
    'Frozen (-18°C)': 180,
    'Room Temperature (18–22°C)': 30,
    'Cool & Dry (10–15°C)': 60,
    'Vacuum Sealed': 120,
  },
};

interface ItemAdjustmentRule {
  keywords: string[];
  label: string;
  multiplier: number;
  refrigeratedOverride?: number;
  roomTempOverride?: number;
}

const ITEM_SPECIFIC_RULES: ItemAdjustmentRule[] = [
  {
    keywords: ['spinach', 'lettuce', 'kale', 'arugula', 'greens', 'cilantro', 'parsley'],
    label: 'Leafy green high-respiration adjustment',
    multiplier: 0.6,
    refrigeratedOverride: 5,
  },
  {
    keywords: ['milk', 'cream', 'buttermilk'],
    label: 'Liquid pasteurized dairy rule',
    multiplier: 0.7,
    refrigeratedOverride: 7,
  },
  {
    keywords: ['cheese', 'cheddar', 'parmesan', 'mozzarella'],
    label: 'Aged/cured dairy extension',
    multiplier: 1.8,
    refrigeratedOverride: 21,
  },
  {
    keywords: ['egg', 'eggs'],
    label: 'Shell egg protective cuticle rule',
    multiplier: 2.5,
    refrigeratedOverride: 28,
  },
  {
    keywords: ['banana', 'avocado', 'berry', 'berries', 'strawberry'],
    label: 'Ethylene-sensitive soft fruit rule',
    multiplier: 0.75,
    roomTempOverride: 5,
  },
  {
    keywords: ['apple', 'orange', 'lemon', 'citrus', 'pear'],
    label: 'Firm pome/citrus fruit rule',
    multiplier: 1.4,
    refrigeratedOverride: 21,
  },
  {
    keywords: ['rice', 'oat', 'oats', 'quinoa', 'lentil', 'pasta', 'flour'],
    label: 'Low-moisture dry grain stability rule',
    multiplier: 1.2,
  },
  {
    keywords: ['chicken', 'poultry', 'turkey', 'ground beef', 'mince'],
    label: 'High-surface-area raw poultry/mince safety rule',
    multiplier: 0.75,
    refrigeratedOverride: 3,
  },
];

export interface ShelfLifePrediction {
  estimatedDays: number;
  estimatedExpiryDate: string;
  baseCategoryDays: number;
  appliedRuleReason: string;
}

/**
 * Transparent rule-based shelf-life estimation system.
 * Always explains the exact category baseline, storage condition, and any keyword adjustment.
 */
export function predictShelfLife(
  foodName: string,
  category: string,
  storageCondition: StorageCondition,
  purchaseDateISO: string
): ShelfLifePrediction {
  const categoryMap = SHELF_LIFE_RULES[category] ?? SHELF_LIFE_RULES['Other'];
  const baseCategoryDays = categoryMap[storageCondition] ?? 14;

  const lower = foodName.trim().toLowerCase();
  let estimatedDays = baseCategoryDays;
  let ruleNote = `Category baseline (${category} under ${storageCondition}): ${baseCategoryDays} days`;

  if (lower) {
    const matched = ITEM_SPECIFIC_RULES.find((rule) =>
      rule.keywords.some((kw) => lower.includes(kw))
    );
    if (matched) {
      if (
        storageCondition === 'Refrigerated (2–4°C)' &&
        matched.refrigeratedOverride !== undefined
      ) {
        estimatedDays = matched.refrigeratedOverride;
      } else if (
        storageCondition === 'Room Temperature (18–22°C)' &&
        matched.roomTempOverride !== undefined
      ) {
        estimatedDays = matched.roomTempOverride;
      } else {
        estimatedDays = Math.max(1, Math.round(baseCategoryDays * matched.multiplier));
      }
      ruleNote = `${category} baseline (${baseCategoryDays}d) + ${matched.label} → ${estimatedDays} days`;
    }
  }

  return {
    estimatedDays,
    estimatedExpiryDate: addDaysISO(purchaseDateISO || getTodayISO(), estimatedDays),
    baseCategoryDays,
    appliedRuleReason: ruleNote,
  };
}

/**
 * Normalizes diverse food units into approximate KG equivalents for analytics aggregation.
 */
export function normalizeQuantityToKg(quantity: number, unit: string): number {
  const q = Number(quantity) || 0;
  switch (unit.toLowerCase()) {
    case 'kg':
      return Number(q.toFixed(2));
    case 'grams':
      return Number((q / 1000).toFixed(2));
    case 'litres':
      return Number((q * 1.0).toFixed(2));
    case 'bottles':
    case 'cartons':
      return Number((q * 0.85).toFixed(2));
    case 'packets':
    case 'cans':
      return Number((q * 0.45).toFixed(2));
    case 'dozen':
      return Number((q * 0.72).toFixed(2));
    case 'pieces':
      return Number((q * 0.16).toFixed(2));
    default:
      return Number((q * 0.35).toFixed(2));
  }
}

/**
 * Default unit cost helper when logging new items.
 */
export function getDefaultUnitCost(category: string): number {
  switch (category) {
    case 'Meat':
      return 8.5;
    case 'Seafood':
      return 12.0;
    case 'Dairy Products':
      return 3.25;
    case 'Fruits':
      return 1.2;
    case 'Vegetables':
      return 2.4;
    case 'Grains':
      return 2.1;
    case 'Bakery':
      return 3.5;
    case 'Beverages':
      return 2.8;
    case 'Frozen Foods':
      return 4.75;
    default:
      return 3.0;
  }
}

/**
 * Exports inventory or generic rows to a clean RFC-4180 CSV download.
 */
export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escape = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent = [
    headers.map(escape).join(','),
    ...rows.map((r) => r.map(escape).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportInventoryToCSV(
  inventory: FoodItem[],
  settings?: Pick<UserSettings, 'warningDaysThreshold' | 'expiringSoonDaysThreshold'>
): void {
  const headers = [
    'Food Name',
    'Category',
    'Quantity',
    'Unit',
    'Purchase Date',
    'Expiry Date',
    'Date Source',
    'Estimated Shelf Life (Days)',
    'Estimated Expiry Date',
    'Storage Location',
    'Storage Condition',
    'Freshness Status',
    'Days Remaining',
    'Unit Cost',
  ];

  const rows = inventory.map((item) => {
    const meta = getFreshnessMeta(item.expiryDate, settings);
    return [
      item.name,
      item.category,
      item.quantity,
      item.unit,
      item.purchaseDate,
      item.expiryDate,
      item.expirySource === 'manufacturer' ? 'Manufacturer Provided' : 'Rule-Based Estimate',
      item.estimatedShelfLifeDays,
      item.estimatedExpiryDate,
      item.storageLocation,
      item.storageCondition,
      meta.label,
      meta.daysRemaining,
      item.unitCost.toFixed(2),
    ];
  });

  downloadCSV(`freshtrack-inventory-${getTodayISO()}.csv`, headers, rows);
}
