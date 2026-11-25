import { FoodItem, SmartAlert, UserSettings } from '../types';
import { getFreshnessMeta } from './freshnessEngine';

export function generateSmartAlerts(
  inventory: FoodItem[],
  settings: Pick<UserSettings, 'warningDaysThreshold' | 'expiringSoonDaysThreshold'>
): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const nowISO = new Date().toISOString();

  const expiredItems: { item: FoodItem; days: number }[] = [];
  const warningItems: { item: FoodItem; days: number }[] = [];
  const soonItems: { item: FoodItem; days: number }[] = [];

  for (const item of inventory) {
    const meta = getFreshnessMeta(item.expiryDate, settings);
    if (meta.status === 'expired') {
      expiredItems.push({ item, days: meta.daysRemaining });
    } else if (meta.status === 'warning') {
      warningItems.push({ item, days: meta.daysRemaining });
    } else if (meta.status === 'expiring_soon') {
      soonItems.push({ item, days: meta.daysRemaining });
    }
  }

  // 1. Aggregate Expired Summary Alert
  if (expiredItems.length > 0) {
    const names = expiredItems.map((e) => e.item.name).join(', ');
    alerts.push({
      id: `expired-summary-${expiredItems.length}`,
      severity: 'critical',
      title:
        expiredItems.length === 1
          ? '1 food item has expired'
          : `${expiredItems.length} food items have expired`,
      message: `Inspect and remove ${names} from ${
        expiredItems.length === 1 ? 'storage' : 'active storage'
      } immediately and log any waste to keep analytics accurate.`,
      createdAt: nowISO,
    });
  }

  // 2. Individual Expired Alerts for 1-click disposal logging
  for (const { item, days } of expiredItems.sort((a, b) => a.days - b.days)) {
    const overdue = Math.abs(days);
    alerts.push({
      id: `expired-item-${item.id}`,
      severity: 'critical',
      title: `${item.name} expired ${overdue === 1 ? 'yesterday' : `${overdue} days ago`}`,
      message: `${item.quantity} ${item.unit} in ${item.storageLocation} passed its ${
        item.expirySource === 'manufacturer' ? 'manufacturer expiry date' : 'estimated shelf life'
      }.`,
      itemId: item.id,
      itemName: item.name,
      daysRemaining: days,
      actionLabel: 'Log Waste',
      createdAt: nowISO,
    });
  }

  // 3. Urgent Warning Alerts (0-3 days)
  for (const { item, days } of warningItems.sort((a, b) => a.days - b.days)) {
    let message = `${item.name} is approaching its expiry date (${
      days === 0 ? 'expires today' : days === 1 ? '1 day remaining' : `${days} days remaining`
    }).`;

    if (days <= 1) {
      message = `${item.name} should be consumed soon — ${
        days === 0 ? 'expires today' : 'only 1 day remaining'
      } (${item.quantity} ${item.unit} in ${item.storageLocation}).`;
    } else if (item.category === 'Bakery' || item.category === 'Dairy Products') {
      message = `Use ${item.name.toLowerCase()} before purchasing additional ${item.name.toLowerCase()} (${days} days remaining).`;
    }

    alerts.push({
      id: `warning-item-${item.id}`,
      severity: 'warning',
      title: `${item.name} — Consume First`,
      message,
      itemId: item.id,
      itemName: item.name,
      daysRemaining: days,
      actionLabel: 'Mark Consumed',
      createdAt: nowISO,
    });
  }

  // 4. Approaching Expiry Alerts (4-7 days)
  for (const { item, days } of soonItems.sort((a, b) => a.days - b.days)) {
    alerts.push({
      id: `soon-item-${item.id}`,
      severity: 'caution',
      title: `${item.name} expires in ${days} days`,
      message: `Plan meals using ${item.quantity} ${item.unit} of ${item.name} from ${item.storageLocation} this week.`,
      itemId: item.id,
      itemName: item.name,
      daysRemaining: days,
      actionLabel: 'Mark Consumed',
      createdAt: nowISO,
    });
  }

  // 5. Smart Restock / Duplicate Category Advice
  const nameCounts = new Map<string, FoodItem[]>();
  for (const item of inventory) {
    const key = item.name.trim().toLowerCase();
    const arr = nameCounts.get(key) ?? [];
    arr.push(item);
    nameCounts.set(key, arr);
  }
  for (const [, group] of nameCounts) {
    if (group.length > 1) {
      alerts.push({
        id: `duplicate-${group[0].name.toLowerCase()}`,
        severity: 'advice',
        title: `Multiple batches of ${group[0].name}`,
        message: `You have ${group.length} separate entries for ${group[0].name}. Prioritize the earliest-expiring batch first (FIFO).`,
        itemId: group[0].id,
        itemName: group[0].name,
        createdAt: nowISO,
      });
    }
  }

  return alerts;
}
