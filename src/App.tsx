import React, { useState } from 'react';
import { FoodItemModal } from './components/FoodItemModal';
import { LogWasteModal } from './components/LogWasteModal';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { TopNavbar } from './components/TopNavbar';
import { FreshTrackProvider } from './context/FreshTrackContext';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExpiryPredictionPage } from './pages/ExpiryPredictionPage';
import { InventoryPage } from './pages/InventoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { SmartAlertsPage } from './pages/SmartAlertsPage';
import { WasteTrackingPage } from './pages/WasteTrackingPage';
import { FoodItem, NavSection } from './types';

function FreshTrackShell() {
  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [wasteTargetItem, setWasteTargetItem] = useState<FoodItem | null>(null);

  const openAddFood = () => {
    setEditingItem(null);
    setFoodModalOpen(true);
  };

  const openEditFood = (item: FoodItem) => {
    setEditingItem(item);
    setFoodModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar
          activeNav={activeNav}
          onSelectNav={setActiveNav}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenAddModal={openAddFood}
        />

        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 sm:p-6">
          {activeNav === 'dashboard' && (
            <DashboardPage
              onNavigate={setActiveNav}
              onOpenAddModal={openAddFood}
              onOpenLogWaste={(item) => setWasteTargetItem(item)}
            />
          )}

          {activeNav === 'inventory' && (
            <InventoryPage
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenAddModal={openAddFood}
              onOpenEditModal={openEditFood}
              onOpenLogWaste={(item) => setWasteTargetItem(item)}
            />
          )}

          {activeNav === 'prediction' && <ExpiryPredictionPage />}

          {activeNav === 'alerts' && (
            <SmartAlertsPage onOpenLogWaste={(item) => setWasteTargetItem(item)} />
          )}

          {activeNav === 'waste' && <WasteTrackingPage />}

          {activeNav === 'analytics' && <AnalyticsPage />}

          {activeNav === 'settings' && <SettingsPage />}
        </main>
      </div>

      <FoodItemModal
        open={foodModalOpen}
        editingItem={editingItem}
        onClose={() => {
          setFoodModalOpen(false);
          setEditingItem(null);
        }}
      />

      <LogWasteModal
        open={Boolean(wasteTargetItem)}
        targetItem={wasteTargetItem}
        onClose={() => setWasteTargetItem(null)}
      />

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <FreshTrackProvider>
      <FreshTrackShell />
    </FreshTrackProvider>
  );
}
