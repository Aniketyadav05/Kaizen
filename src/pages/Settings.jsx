/**
 * FinPilot — Settings Page (Apple HIG Style)
 * 
 * iOS Settings app grouped list layout.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Moon, Sun, Monitor, Lock, Download, Upload, Trash2, Wallet, Shield, Database, ChevronRight } from "lucide-react";
import useTransactionStore from "@/stores/useTransactionStore";
import useBudgetStore from "@/stores/useBudgetStore";
import useSettingsStore from "@/stores/useSettingsStore";
import { useTheme } from "@/hooks/useTheme";
import { formatCurrency, cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const budgetConfig = useBudgetStore((s) => s.budgetConfig);
  const updateBudgetConfig = useBudgetStore((s) => s.updateBudgetConfig);
  const settings = useSettingsStore((s) => s.settings);
  const setPasswordEnabled = useSettingsStore((s) => s.setPasswordEnabled);

  const transactions = useTransactionStore((s) => s.transactions);

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExport = () => {
    const data = { transactions, budgetConfig, settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finpilot-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!transactions.length) return;
    const headers = ["Date", "Description", "Category", "Amount", "Type", "Payment Method", "Notes"].join(",");
    const rows = transactions.map(t => 
      `${t.date},"${t.description || t.source || ''}","${t.category}",${t.amount},${t.type},"${t.payment_method || ''}","${t.notes || ''}"`
    ).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finpilot-transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSetPassword = () => {
    if (password.length >= 4) {
      const hash = btoa(password);
      setPasswordEnabled(true, hash);
      setPassword("");
      setShowPassword(false);
    }
  };

  const themeOptions = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-8">
      {/* iOS Navigation Bar */}
      <h1 className="large-title m-0">Settings</h1>

      {/* Appearance Group */}
      <div>
        <h2 className="text-[13px] font-semibold text-[var(--color-gray-1)] uppercase tracking-wide mb-1.5 px-3">Appearance</h2>
        <div className="ios-list">
          <div className="flex items-center justify-between p-3 gap-2">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[10px] transition-colors",
                    isActive 
                      ? "bg-[var(--color-brand)] text-[var(--color-background)]"
                      : "bg-[var(--color-gray-5)] text-[var(--color-foreground)] active:bg-[var(--color-gray-4)]"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[12px] font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Budget Setup Group */}
      <div>
        <h2 className="text-[13px] font-semibold text-[var(--color-gray-1)] uppercase tracking-wide mb-1.5 px-3">Budget</h2>
        <div className="ios-list">
          <div className="flex items-center justify-between p-3 border-b border-[var(--color-border)] bg-[var(--color-card)]">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-[6px] bg-[#34C759] flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <span className="text-[17px]">Salary</span>
            </div>
            <input
              type="number"
              value={budgetConfig.salary || ""}
              onChange={(e) => updateBudgetConfig({ salary: Number(e.target.value) })}
              className="text-right text-[17px] text-[var(--color-gray-1)] bg-transparent border-none outline-none w-32"
              placeholder="0"
            />
          </div>
          <div className="flex items-center justify-between p-3 border-b border-[var(--color-border)] bg-[var(--color-card)]">
            <span className="text-[17px] ml-10">Weekly Limit</span>
            <input
              type="number"
              value={budgetConfig.weeklyLimit || ""}
              onChange={(e) => updateBudgetConfig({ weeklyLimit: Number(e.target.value) })}
              className="text-right text-[17px] text-[var(--color-gray-1)] bg-transparent border-none outline-none w-32"
              placeholder="0"
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-[var(--color-card)]">
            <span className="text-[17px] ml-10">Annual Growth %</span>
            <input
              type="number"
              value={budgetConfig.yearlyGrowthRate || ""}
              onChange={(e) => updateBudgetConfig({ yearlyGrowthRate: Number(e.target.value) })}
              className="text-right text-[17px] text-[var(--color-gray-1)] bg-transparent border-none outline-none w-16"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Security Group */}
      <div>
        <h2 className="text-[13px] font-semibold text-[var(--color-gray-1)] uppercase tracking-wide mb-1.5 px-3">Security</h2>
        <div className="ios-list">
          <div className="flex items-center justify-between p-3 bg-[var(--color-card)]">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-[6px] bg-[#007AFF] flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="text-[17px]">App Lock</span>
            </div>
            <Switch
              checked={settings.passwordEnabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  setShowPassword(true);
                } else {
                  setPasswordEnabled(false);
                }
              }}
            />
          </div>
          
          {showPassword && (
            <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-gray-5)] flex items-center gap-2">
              <input
                type="password"
                placeholder="Enter 4-digit passcode"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-[17px]"
              />
              <button 
                onClick={handleSetPassword} 
                disabled={password.length < 4}
                className="text-[var(--color-brand)] font-semibold text-[15px] disabled:opacity-50"
              >
                Set
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Data Group */}
      <div>
        <h2 className="text-[13px] font-semibold text-[var(--color-gray-1)] uppercase tracking-wide mb-1.5 px-3">Data Management</h2>
        <div className="ios-list">
          <button 
            onClick={handleExport}
            className="w-full flex items-center justify-between p-3 border-b border-[var(--color-border)] bg-[var(--color-card)] active:bg-[var(--color-gray-5)] transition-colors text-left"
          >
            <span className="text-[17px] text-[var(--color-brand)]">Export as JSON Backup</span>
            <Download className="h-5 w-5 text-[var(--color-brand)]" />
          </button>
          <button 
            onClick={handleExportCSV}
            className="w-full flex items-center justify-between p-3 bg-[var(--color-card)] active:bg-[var(--color-gray-5)] transition-colors text-left"
          >
            <span className="text-[17px] text-[var(--color-brand)]">Export Transactions (CSV)</span>
            <Database className="h-5 w-5 text-[var(--color-brand)]" />
          </button>
        </div>
      </div>

      <div className="text-center pt-4">
        <p className="text-[13px] text-[var(--color-gray-1)] font-medium">Kaizen Version 1.0.0</p>
      </div>
    </div>
  );
}
