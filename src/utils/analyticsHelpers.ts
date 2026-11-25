import { ConsumedRecord, FoodItem, UserSettings, WasteRecord } from '../types';
import { getFreshnessMeta, normalizeQuantityToKg } from './freshnessEngine';

export interface MonthlyComparisonPoint {
  monthKey: string;
  monthLabel: string;
  wastedKg: number;
  savedKg: number;
  wasteCost: number;
  savedValue: number;
}

export function computeSummaryMetrics(
  inventory: FoodItem[],
  wasteRecords: WasteRecord[],
  consumedRecords: ConsumedRecord[],
  settings: Pick<UserSettings, 'warningDaysThreshold' | 'expiringSoonDaysThreshold'>
) {
  let freshCount = 0;
  let expiringSoonCount = 0;
  let warningCount = 0;
  let expiredCount = 0;

  for (const item of inventory) {
    const meta = getFreshnessMeta(item.expiryDate, settings);
    if (meta.status === 'fresh') freshCount++;
    else if (meta.status === 'expiring_soon') expiringSoonCount++;
    else if (meta.status === 'warning') warningCount++;
    else expiredCount++;
  }

  const totalSavedKg = Number(
    consumedRecords.reduce((acc, r) => acc + r.normalizedKg, 0).toFixed(2)
  );
  const totalWasteKg = Number(
    wasteRecords.reduce((acc, r) => acc + r.normalizedKg, 0).toFixed(2)
  );
  const totalMoneySaved = Number(
    consumedRecords.reduce((acc, r) => acc + r.estimatedValueSaved, 0).toFixed(2)
  );
  const totalFinancialLoss = Number(
    wasteRecords.reduce((acc, r) => acc + r.estimatedCost, 0).toFixed(2)
  );

  const totalHandledKg = totalSavedKg + totalWasteKg;
  const foodWastePercentage =
    totalHandledKg > 0 ? Number(((totalWasteKg / totalHandledKg) * 100).toFixed(1)) : 0;
  const wasteReductionPercentage =
    totalHandledKg > 0 ? Number(((totalSavedKg / totalHandledKg) * 100).toFixed(1)) : 100;

  return {
    totalItems: inventory.length,
    freshCount,
    expiringSoonCount,
    warningCount,
    approachingExpiryCount: expiringSoonCount + warningCount,
    expiredCount,
    totalSavedKg,
    totalWasteKg,
    totalMoneySaved,
    totalFinancialLoss,
    foodWastePercentage,
    wasteReductionPercentage,
  };
}

export function buildMonthlyTrends(
  wasteRecords: WasteRecord[],
  consumedRecords: ConsumedRecord[]
): MonthlyComparisonPoint[] {
  const map = new Map<string, MonthlyComparisonPoint>();

  // Ensure last 6 calendar months exist for smooth timeline
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    map.set(key, {
      monthKey: key,
      monthLabel: label,
      wastedKg: 0,
      savedKg: 0,
      wasteCost: 0,
      savedValue: 0,
    });
  }

  for (const w of wasteRecords) {
    const key = w.date.slice(0, 7);
    const [y, m] = key.split('-').map(Number);
    if (!y || !m) continue;
    const existing = map.get(key) ?? {
      monthKey: key,
      monthLabel: new Date(y, m - 1, 1).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      }),
      wastedKg: 0,
      savedKg: 0,
      wasteCost: 0,
      savedValue: 0,
    };
    existing.wastedKg = Number((existing.wastedKg + w.normalizedKg).toFixed(2));
    existing.wasteCost = Number((existing.wasteCost + w.estimatedCost).toFixed(2));
    map.set(key, existing);
  }

  for (const c of consumedRecords) {
    const key = c.date.slice(0, 7);
    const [y, m] = key.split('-').map(Number);
    if (!y || !m) continue;
    const existing = map.get(key) ?? {
      monthKey: key,
      monthLabel: new Date(y, m - 1, 1).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      }),
      wastedKg: 0,
      savedKg: 0,
      wasteCost: 0,
      savedValue: 0,
    };
    existing.savedKg = Number((existing.savedKg + c.normalizedKg).toFixed(2));
    existing.savedValue = Number((existing.savedValue + c.estimatedValueSaved).toFixed(2));
    map.set(key, existing);
  }

  return Array.from(map.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

export function buildCategoryDistribution(inventory: FoodItem[]) {
  const counts = new Map<string, { category: string; items: number; totalKg: number }>();
  for (const item of inventory) {
    const current = counts.get(item.category) ?? {
      category: item.category,
      items: 0,
      totalKg: 0,
    };
    current.items += 1;
    current.totalKg = Number(
      (current.totalKg + normalizeQuantityToKg(item.quantity, item.unit)).toFixed(2)
    );
    counts.set(item.category, current);
  }
  return Array.from(counts.values()).sort((a, b) => b.items - a.items);
}

export function buildMostWastedItems(wasteRecords: WasteRecord[]) {
  const map = new Map<
    string,
    { foodName: string; totalKg: number; totalCost: number; events: number }
  >();
  for (const w of wasteRecords) {
    const key = w.foodName.trim();
    const cur = map.get(key) ?? {
      foodName: key,
      totalKg: 0,
      totalCost: 0,
      events: 0,
    };
    cur.totalKg = Number((cur.totalKg + w.normalizedKg).toFixed(2));
    cur.totalCost = Number((cur.totalCost + w.estimatedCost).toFixed(2));
    cur.events += 1;
    map.set(key, cur);
  }
  return Array.from(map.values())
    .sort((a, b) => b.totalCost - a.totalCost || b.totalKg - a.totalKg)
    .slice(0, 7);
}
