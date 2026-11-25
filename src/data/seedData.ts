import {
  ActivityEntry,
  ConsumedRecord,
  FoodItem,
  UserSettings,
  WasteRecord,
} from '../types';
import { addDaysISO, getTodayISO, normalizeQuantityToKg, predictShelfLife } from '../utils/freshnessEngine';

export function buildSeedInventory(): FoodItem[] {
  const today = getTodayISO();
  const nowISO = new Date().toISOString();

  const specs: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    purchaseOffsetDays: number;
    expiryOffsetDays: number;
    expirySource: 'manufacturer' | 'estimated';
    storageLocation: string;
    storageCondition: FoodItem['storageCondition'];
    unitCost: number;
    notes?: string;
  }> = [
    {
      id: 'seed-milk',
      name: 'Milk',
      category: 'Dairy Products',
      quantity: 2,
      unit: 'Litres',
      purchaseOffsetDays: -5,
      expiryOffsetDays: 2,
      expirySource: 'manufacturer',
      storageLocation: 'Refrigerator',
      storageCondition: 'Refrigerated (2–4°C)',
      unitCost: 2.8,
      notes: 'Whole organic pasteurized milk',
    },
    {
      id: 'seed-apple',
      name: 'Apple',
      category: 'Fruits',
      quantity: 10,
      unit: 'Pieces',
      purchaseOffsetDays: -4,
      expiryOffsetDays: 8,
      expirySource: 'estimated',
      storageLocation: 'Refrigerator',
      storageCondition: 'Refrigerated (2–4°C)',
      unitCost: 0.65,
      notes: 'Honeycrisp batch in crisper drawer',
    },
    {
      id: 'seed-bread',
      name: 'Bread',
      category: 'Bakery',
      quantity: 1,
      unit: 'Packets',
      purchaseOffsetDays: -2,
      expiryOffsetDays: 3,
      expirySource: 'manufacturer',
      storageLocation: 'Pantry',
      storageCondition: 'Room Temperature (18–22°C)',
      unitCost: 4.2,
      notes: 'Whole grain sourdough loaf',
    },
    {
      id: 'seed-spinach',
      name: 'Spinach',
      category: 'Vegetables',
      quantity: 500,
      unit: 'Grams',
      purchaseOffsetDays: -4,
      expiryOffsetDays: 1,
      expirySource: 'manufacturer',
      storageLocation: 'Refrigerator',
      storageCondition: 'Refrigerated (2–4°C)',
      unitCost: 0.01,
      notes: 'Triple-washed baby spinach',
    },
    {
      id: 'seed-rice',
      name: 'Rice',
      category: 'Grains',
      quantity: 5,
      unit: 'KG',
      purchaseOffsetDays: -14,
      expiryOffsetDays: 180,
      expirySource: 'estimated',
      storageLocation: 'Dry Storage',
      storageCondition: 'Cool & Dry (10–15°C)',
      unitCost: 2.4,
      notes: 'Long-grain basmati airtight bin',
    },
    {
      id: 'seed-banana',
      name: 'Banana',
      category: 'Fruits',
      quantity: 6,
      unit: 'Pieces',
      purchaseOffsetDays: -2,
      expiryOffsetDays: 4,
      expirySource: 'estimated',
      storageLocation: 'Countertop',
      storageCondition: 'Room Temperature (18–22°C)',
      unitCost: 0.4,
      notes: 'Ripening on counter rack',
    },
    {
      id: 'seed-tomato',
      name: 'Tomato',
      category: 'Vegetables',
      quantity: 750,
      unit: 'Grams',
      purchaseOffsetDays: -3,
      expiryOffsetDays: 6,
      expirySource: 'estimated',
      storageLocation: 'Refrigerator',
      storageCondition: 'Refrigerated (2–4°C)',
      unitCost: 0.006,
      notes: 'Vine-ripened Roma tomatoes',
    },
    {
      id: 'seed-eggs',
      name: 'Eggs',
      category: 'Dairy Products',
      quantity: 12,
      unit: 'Pieces',
      purchaseOffsetDays: -7,
      expiryOffsetDays: 16,
      expirySource: 'manufacturer',
      storageLocation: 'Refrigerator',
      storageCondition: 'Refrigerated (2–4°C)',
      unitCost: 0.45,
      notes: 'Free-range large eggs',
    },
    {
      id: 'seed-cheese',
      name: 'Cheese',
      category: 'Dairy Products',
      quantity: 350,
      unit: 'Grams',
      purchaseOffsetDays: -23,
      expiryOffsetDays: -2,
      expirySource: 'manufacturer',
      storageLocation: 'Refrigerator',
      storageCondition: 'Refrigerated (2–4°C)',
      unitCost: 0.02,
      notes: 'Aged sharp cheddar block',
    },
    {
      id: 'seed-chicken',
      name: 'Chicken',
      category: 'Meat',
      quantity: 1.2,
      unit: 'KG',
      purchaseOffsetDays: -4,
      expiryOffsetDays: -1,
      expirySource: 'manufacturer',
      storageLocation: 'Refrigerator',
      storageCondition: 'Refrigerated (2–4°C)',
      unitCost: 9.5,
      notes: 'Boneless skinless breast pack',
    },
  ];

  return specs.map((spec) => {
    const purchaseDate = addDaysISO(today, spec.purchaseOffsetDays);
    const expiryDate = addDaysISO(today, spec.expiryOffsetDays);
    const prediction = predictShelfLife(
      spec.name,
      spec.category,
      spec.storageCondition,
      purchaseDate
    );

    return {
      id: spec.id,
      name: spec.name,
      category: spec.category,
      quantity: spec.quantity,
      unit: spec.unit,
      purchaseDate,
      expiryDate,
      expirySource: spec.expirySource,
      storageLocation: spec.storageLocation,
      storageCondition: spec.storageCondition,
      estimatedShelfLifeDays: prediction.estimatedDays,
      estimatedExpiryDate: prediction.estimatedExpiryDate,
      unitCost: spec.unitCost,
      notes: spec.notes,
      createdAt: nowISO,
      updatedAt: nowISO,
    };
  });
}

export function buildSeedWasteRecords(): WasteRecord[] {
  const today = getTodayISO();
  const nowISO = new Date().toISOString();

  const entries: Array<{
    id: string;
    foodName: string;
    category: string;
    quantityWasted: number;
    unit: string;
    reason: WasteRecord['reason'];
    offsetDays: number;
    estimatedCost: number;
  }> = [
    {
      id: 'waste-1',
      foodName: 'Spinach',
      category: 'Vegetables',
      quantityWasted: 300,
      unit: 'Grams',
      reason: 'Spoilage / Mold',
      offsetDays: -4,
      estimatedCost: 3.2,
    },
    {
      id: 'waste-2',
      foodName: 'Milk',
      category: 'Dairy Products',
      quantityWasted: 0.8,
      unit: 'Litres',
      reason: 'Expired Before Use',
      offsetDays: -12,
      estimatedCost: 2.25,
    },
    {
      id: 'waste-3',
      foodName: 'Bread',
      category: 'Bakery',
      quantityWasted: 1,
      unit: 'Packets',
      reason: 'Over-Purchased',
      offsetDays: -25,
      estimatedCost: 4.2,
    },
    {
      id: 'waste-4',
      foodName: 'Tomato',
      category: 'Vegetables',
      quantityWasted: 500,
      unit: 'Grams',
      reason: 'Spoilage / Mold',
      offsetDays: -38,
      estimatedCost: 3.0,
    },
    {
      id: 'waste-5',
      foodName: 'Chicken',
      category: 'Meat',
      quantityWasted: 0.6,
      unit: 'KG',
      reason: 'Expired Before Use',
      offsetDays: -55,
      estimatedCost: 5.7,
    },
    {
      id: 'waste-6',
      foodName: 'Banana',
      category: 'Fruits',
      quantityWasted: 4,
      unit: 'Pieces',
      reason: 'Over-Purchased',
      offsetDays: -78,
      estimatedCost: 1.6,
    },
    {
      id: 'waste-7',
      foodName: 'Milk',
      category: 'Dairy Products',
      quantityWasted: 1.5,
      unit: 'Litres',
      reason: 'Storage Failure',
      offsetDays: -102,
      estimatedCost: 4.2,
    },
    {
      id: 'waste-8',
      foodName: 'Spinach',
      category: 'Vegetables',
      quantityWasted: 450,
      unit: 'Grams',
      reason: 'Expired Before Use',
      offsetDays: -125,
      estimatedCost: 4.5,
    },
  ];

  return entries.map((e) => ({
    id: e.id,
    foodName: e.foodName,
    category: e.category,
    quantityWasted: e.quantityWasted,
    unit: e.unit,
    normalizedKg: normalizeQuantityToKg(e.quantityWasted, e.unit),
    reason: e.reason,
    date: addDaysISO(today, e.offsetDays),
    estimatedCost: e.estimatedCost,
    createdAt: nowISO,
  }));
}

export function buildSeedConsumedRecords(): ConsumedRecord[] {
  const today = getTodayISO();
  const nowISO = new Date().toISOString();

  const entries = [
    {
      id: 'saved-1',
      foodName: 'Milk',
      category: 'Dairy Products',
      quantityConsumed: 2,
      unit: 'Litres',
      offsetDays: -3,
      estimatedValueSaved: 5.6,
    },
    {
      id: 'saved-2',
      foodName: 'Apple',
      category: 'Fruits',
      quantityConsumed: 8,
      unit: 'Pieces',
      offsetDays: -9,
      estimatedValueSaved: 5.2,
    },
    {
      id: 'saved-3',
      foodName: 'Chicken',
      category: 'Meat',
      quantityConsumed: 1.5,
      unit: 'KG',
      offsetDays: -16,
      estimatedValueSaved: 14.25,
    },
    {
      id: 'saved-4',
      foodName: 'Rice',
      category: 'Grains',
      quantityConsumed: 2,
      unit: 'KG',
      offsetDays: -32,
      estimatedValueSaved: 4.8,
    },
    {
      id: 'saved-5',
      foodName: 'Eggs',
      category: 'Dairy Products',
      quantityConsumed: 12,
      unit: 'Pieces',
      offsetDays: -44,
      estimatedValueSaved: 5.4,
    },
    {
      id: 'saved-6',
      foodName: 'Tomato',
      category: 'Vegetables',
      quantityConsumed: 1.2,
      unit: 'KG',
      offsetDays: -65,
      estimatedValueSaved: 7.2,
    },
    {
      id: 'saved-7',
      foodName: 'Bread',
      category: 'Bakery',
      quantityConsumed: 2,
      unit: 'Packets',
      offsetDays: -90,
      estimatedValueSaved: 8.4,
    },
    {
      id: 'saved-8',
      foodName: 'Cheese',
      category: 'Dairy Products',
      quantityConsumed: 500,
      unit: 'Grams',
      offsetDays: -115,
      estimatedValueSaved: 10.0,
    },
  ];

  return entries.map((e) => ({
    id: e.id,
    foodName: e.foodName,
    category: e.category,
    quantityConsumed: e.quantityConsumed,
    unit: e.unit,
    normalizedKg: normalizeQuantityToKg(e.quantityConsumed, e.unit),
    date: addDaysISO(today, e.offsetDays),
    estimatedValueSaved: e.estimatedValueSaved,
    createdAt: nowISO,
  }));
}

export function buildSeedActivities(): ActivityEntry[] {
  const now = Date.now();
  return [
    {
      id: 'act-1',
      type: 'added',
      title: 'Added Bread to Pantry',
      detail: '1 Packet · Manufacturer expiry in 3 days',
      timestamp: new Date(now - 1000 * 60 * 35).toISOString(),
    },
    {
      id: 'act-2',
      type: 'consumed',
      title: 'Marked Milk as consumed',
      detail: '2 Litres saved before expiry ($5.60 value)',
      timestamp: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      id: 'act-3',
      type: 'wasted',
      title: 'Logged waste for Spinach',
      detail: '300 Grams · Spoilage / Mold ($3.20 loss)',
      timestamp: new Date(now - 1000 * 60 * 60 * 28).toISOString(),
    },
    {
      id: 'act-4',
      type: 'added',
      title: 'Added Apple batch to Refrigerator',
      detail: '10 Pieces · Estimated shelf life 12 days',
      timestamp: new Date(now - 1000 * 60 * 60 * 52).toISOString(),
    },
  ];
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  userName: 'Sarah Jenkins',
  organizationName: 'GreenLeaf Kitchen Ops',
  currencySymbol: '$',
  warningDaysThreshold: 3,
  expiringSoonDaysThreshold: 7,
  darkMode: false,
};
