/**
 * FinPilot — App Root Component
 * 
 * Sets up:
 * - React Router with lazy-loaded pages
 * - Theme initialization
 * - Password lock screen
 * - Layout wrapper
 * - SIP/CC notification checks on mount
 */

import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import useSettingsStore from "@/stores/useSettingsStore";
import AppLayout from "@/components/layout/AppLayout";
import LockScreen from "@/components/LockScreen";
import ErrorBoundary from "@/components/ErrorBoundary";
import useTransactionStore from "@/stores/useTransactionStore";
import useCategoryStore from "@/stores/useCategoryStore";
import useBudgetStore from "@/stores/useBudgetStore";
import useGoalStore from "@/stores/useGoalStore";
import useSummaryStore from "@/stores/useSummaryStore";
import useSIPStore from "@/stores/useSIPStore";
import useReminderStore from "@/stores/useReminderStore";

// Lazy load all pages
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Transactions = lazy(() => import("@/pages/Transactions"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Goals = lazy(() => import("@/pages/Goals"));
const Settings = lazy(() => import("@/pages/Settings"));
const CalendarView = lazy(() => import("@/pages/CalendarView"));
const Reports = lazy(() => import("@/pages/Reports"));
const SIPs = lazy(() => import("@/pages/SIPs"));

// Loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/30 border-t-[var(--color-brand)] animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  // Initialize theme
  useTheme();

  const isLocked = useSettingsStore((s) => s.settings.isLocked);
  const passwordEnabled = useSettingsStore((s) => s.settings.passwordEnabled);

  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);
  const fetchBudget = useBudgetStore((s) => s.fetchBudget);
  const fetchGoals = useGoalStore((s) => s.fetchGoals);
  const fetchSummariesAndMetadata = useSummaryStore((s) => s.fetchSummariesAndMetadata);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  
  const transactions = useTransactionStore((s) => s.transactions);
  const checkPermissionStatus = useReminderStore((s) => s.checkPermissionStatus);
  const checkAndNotify = useReminderStore((s) => s.checkAndNotify);

  useEffect(() => {
    fetchSummariesAndMetadata();
    fetchSettings();
    fetchTransactions();
    fetchCategories();
    fetchBudget();
    fetchGoals();
    
    // Check notification permission status
    checkPermissionStatus();
  }, []);

  // Check for SIP/CC reminders on mount and periodically
  useEffect(() => {
    // Delay initial check to let data load
    const initialTimer = setTimeout(() => {
      checkAndNotify(useSIPStore.getState(), transactions);
    }, 3000);

    // Hourly check while app is open
    const interval = setInterval(() => {
      checkAndNotify(useSIPStore.getState(), useTransactionStore.getState().transactions);
    }, 60 * 60 * 1000); // Every hour

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [transactions]);

  // Show lock screen if password is enabled and app is locked
  if (passwordEnabled && isLocked) {
    return (
      <ErrorBoundary>
        <LockScreen />
      </ErrorBoundary>
    );
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/budget" element={<Settings />} />
              <Route path="/sips" element={<SIPs />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
