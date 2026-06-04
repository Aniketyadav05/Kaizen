/**
 * FinPilot — App Layout
 * 
 * Root layout wrapper that provides:
 * - Desktop sidebar + mobile bottom nav
 * - Safe area padding on all sides
 * - Content area with proper spacing
 * - FAB quick-add trigger
 */

import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";
import AddTransactionSheet from "../transactions/AddTransactionSheet";

export default function AppLayout() {
  const [showAddSheet, setShowAddSheet] = useState(false);

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="md:pl-[288px] pb-safe-bottom md:pb-0">
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Outlet context={{ openAddSheet: () => setShowAddSheet(true) }} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav />

      {/* Quick Add Transaction Sheet */}
      <AddTransactionSheet
        open={showAddSheet}
        onOpenChange={setShowAddSheet}
      />
    </div>
  );
}
