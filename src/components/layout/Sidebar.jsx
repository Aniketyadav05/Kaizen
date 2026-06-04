/**
 * FinPilot — Desktop Sidebar Navigation
 * 
 * Shown on md+ screens. Collapsible sidebar with full navigation,
 * quick stats summary, and theme toggle.
 */

import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Target,
  Settings,
  PiggyBank,
  Calendar,
  FileText,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { section: "Overview", items: [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/transactions", icon: Receipt, label: "Transactions" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
  ]},
  { section: "Finance", items: [
    { path: "/budget", icon: Wallet, label: "Budget" },
    { path: "/goals", icon: Target, label: "Goals" },
    { path: "/calendar", icon: Calendar, label: "Calendar" },
  ]},
  { section: "More", items: [
    { path: "/reports", icon: FileText, label: "Reports" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ]},
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex flex-col w-64 h-[calc(100vh-2rem)] m-4 rounded-3xl bg-[var(--color-card)] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[var(--color-border)] fixed left-0 top-0 z-40 overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-[var(--color-gray-6)] bg-[var(--color-brand)]/5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand)] text-white">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Kaizen</h1>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Finance Copilot</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {sidebarItems.map((section) => (
          <div key={section.section}>
            <p className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {section.section}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "relative flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-[15px] font-bold font-['Clash_Grotesk'] transition-all duration-200",
                      isActive
                        ? "bg-[var(--color-brand)] text-white shadow-md shadow-[var(--color-brand)]/20"
                        : "text-[var(--color-gray-1)] hover:bg-[var(--color-gray-5)] hover:text-foreground"
                    )}
                    id={`sidebar-${item.label.toLowerCase()}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-indicator"
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-white/40"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <Icon className="h-[18px] w-[18px]" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--color-gray-6)] bg-[var(--color-gray-6)]/30">
        <div className="flex items-center gap-2 px-2 text-[var(--color-gray-1)]">
          <PiggyBank className="h-5 w-5" strokeWidth={2.5} />
          <p className="text-sm font-bold">Kaizen v1.0</p>
        </div>
      </div>
    </aside>
  );
}
