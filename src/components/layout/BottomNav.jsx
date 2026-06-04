/**
 * FinPilot — Bottom Navigation Bar (Apple HIG Style)
 * 
 * 4-5 tab mobile navigation matching native iOS:
 * - No central FAB
 * - Frosted glass background
 * - Icon and label tint on active
 * - No animated indicator line
 */

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  Home,
  List,
  PieChart,
  Settings,
  MoreHorizontal,
  Wallet,
  Target,
  Calendar,
  FileText,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: Home, label: "Summary" },
  { path: "/transactions", icon: List, label: "Activity" },
  { path: "/analytics", icon: PieChart, label: "Analytics" },
  { path: "menu", icon: MoreHorizontal, label: "Menu" },
];

const menuItems = [
  { path: "/budget", icon: Wallet, label: "Budget" },
  { path: "/goals", icon: Target, label: "Goals" },
  { path: "/calendar", icon: Calendar, label: "Calendar" },
  { path: "/reports", icon: FileText, label: "Reports" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (path) => {
    if (path === "menu") {
      setMenuOpen(true);
    } else {
      setMenuOpen(false);
      navigate(path);
    }
  };

  return (
    <>
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-[var(--color-background)] md:hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-border pt-[max(env(safe-area-inset-top),20px)]">
              <h2 className="text-xl font-bold">Menu</h2>
              <button onClick={() => setMenuOpen(false)} className="p-2 bg-[var(--color-gray-6)] rounded-full text-foreground active:scale-95">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className={cn(
                      "flex items-center gap-4 w-full p-4 rounded-2xl transition-colors",
                      isActive ? "bg-[var(--color-brand)]/10 text-[var(--color-brand)]" : "bg-[var(--color-card)] text-foreground active:bg-[var(--color-gray-5)]"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-[17px] font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}>
        {/* iOS Frosted Glass Floating Pill */}
        <div className="mx-4 glass rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[var(--color-border)] pointer-events-auto">
          <div className="flex items-center justify-around px-2 py-3">
            {navItems.map((item) => {
              const isMenu = item.path === "menu";
              const isActive = isMenu ? menuOpen : (location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path)));
              const Icon = item.icon;

              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 min-w-[64px] transition-colors",
                    isActive
                      ? "text-[var(--color-brand)]"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label={item.label}
                >
                  <Icon
                    className={cn("h-6 w-6")}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
