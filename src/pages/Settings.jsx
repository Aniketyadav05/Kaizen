/**
 * FinPilot — Settings Page (Apple HIG Style)
 * 
 * iOS Settings app grouped list layout.
 * - Persistent salary & monthly budget
 * - Live needs/wants/savings breakdown preview
 * - Editable budget percentages
 * - Notification permission toggle
 * - Credit card bill display
 */

import { useState, useMemo } from "react";
import { Moon, Sun, Monitor, Lock, Download, Database, Wallet, Shield, Bell, CreditCard, ChevronRight } from "lucide-react";
import useTransactionStore from "@/stores/useTransactionStore";
import useBudgetStore from "@/stores/useBudgetStore";
import useSettingsStore from "@/stores/useSettingsStore";
import useReminderStore from "@/stores/useReminderStore";
import { useTheme } from "@/hooks/useTheme";
import { formatCurrency, cn } from "@/lib/utils";
import { calculateCreditCardBill } from "@/lib/calculations";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const budgetConfig = useBudgetStore((s) => s.budgetConfig);
  const updateBudgetConfig = useBudgetStore((s) => s.updateBudgetConfig);
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const setPasswordEnabled = useSettingsStore((s) => s.setPasswordEnabled);
  const transactions = useTransactionStore((s) => s.transactions);
  const notificationPermission = useReminderStore((s) => s.notificationPermission);
  const requestNotificationPermission = useReminderStore((s) => s.requestNotificationPermission);
  const checkPermissionStatus = useReminderStore((s) => s.checkPermissionStatus);

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  // Live budget preview
  const budgetPreview = useMemo(() => {
    // Use expected salary from settings, defaulting to 0
    const salary = Number(settings?.expectedSalary) || 0;
    return {
      needs: Math.floor(salary * (budgetConfig.needsPercent / 100)),
      wants: Math.floor(salary * (budgetConfig.wantsPercent / 100)),
      savings: Math.ceil(salary * (budgetConfig.savingsPercent / 100)),
    };
  }, [budgetConfig, settings?.expectedSalary]);

  // Percentages validation
  const percentTotal = (budgetConfig.needsPercent || 0) + (budgetConfig.wantsPercent || 0) + (budgetConfig.savingsPercent || 0);
  const percentValid = percentTotal === 100;

  // Credit card bill for current month
  const now = new Date();
  const ccBill = useMemo(() => {
    return calculateCreditCardBill(transactions, now.getMonth(), now.getFullYear());
  }, [transactions]);

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
    const headers = ["Date", "Description", "Category", "Amount", "Type", "Payment Method", "Budget Type", "Notes"].join(",");
    const rows = transactions.map(t => 
      `${t.date},"${t.description || t.source || ''}","${t.category}",${t.amount},${t.type},"${t.paymentMethod || t.payment_method || ''}","${t.budgetType || ''}","${t.notes || ''}"`
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

  const handleNotificationToggle = async (checked) => {
    if (checked) {
      await requestNotificationPermission();
    }
    // If unchecked, we don't revoke — browser handles that
    checkPermissionStatus();
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
          {/* Budget Percentages */}
          <div className="p-3 border-b border-[var(--color-border)] bg-[var(--color-card)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[14px] font-semibold text-[var(--color-gray-1)] uppercase tracking-wide">Budget Split</span>
              <span className={cn(
                "text-[12px] font-bold",
                percentValid ? "text-[var(--color-income)]" : "text-[var(--color-expense)]"
              )}>
                {percentTotal}% {percentValid ? "✓" : "(must be 100%)"}
              </span>
            </div>
            
            {/* Needs */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[var(--color-need)]" />
                <span className="text-[15px] font-medium">Needs</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={budgetConfig.needsPercent || ""}
                  onChange={(e) => updateBudgetConfig({ needsPercent: Number(e.target.value) })}
                  className="text-right text-[15px] font-semibold bg-[var(--color-gray-5)] rounded-lg w-14 p-1 outline-none text-center"
                />
                <span className="text-[13px] text-[var(--color-gray-1)] w-20 text-right font-medium">
                  {formatCurrency(budgetPreview.needs)}
                </span>
              </div>
            </div>
            
            {/* Wants */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[var(--color-want)]" />
                <span className="text-[15px] font-medium">Wants</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={budgetConfig.wantsPercent || ""}
                  onChange={(e) => updateBudgetConfig({ wantsPercent: Number(e.target.value) })}
                  className="text-right text-[15px] font-semibold bg-[var(--color-gray-5)] rounded-lg w-14 p-1 outline-none text-center"
                />
                <span className="text-[13px] text-[var(--color-gray-1)] w-20 text-right font-medium">
                  {formatCurrency(budgetPreview.wants)}
                </span>
              </div>
            </div>
            
            {/* Savings */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[var(--color-saving)]" />
                <span className="text-[15px] font-medium">Savings</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={budgetConfig.savingsPercent || ""}
                  onChange={(e) => updateBudgetConfig({ savingsPercent: Number(e.target.value) })}
                  className="text-right text-[15px] font-semibold bg-[var(--color-gray-5)] rounded-lg w-14 p-1 outline-none text-center"
                />
                <span className="text-[13px] text-[var(--color-gray-1)] w-20 text-right font-medium">
                  {formatCurrency(budgetPreview.savings)}
                </span>
              </div>
            </div>
          </div>

          {/* Expected Salary & Annual Growth */}
          <div className="flex items-center justify-between p-3 bg-[var(--color-card)] border-b border-[var(--color-border)]">
            <span className="text-[16px] font-medium ml-10 text-[var(--color-gray-1)]">Expected Monthly Income</span>
            <input
              type="number"
              value={settings?.expectedSalary || ""}
              onChange={(e) => updateSettings({ expectedSalary: Number(e.target.value) })}
              className="text-right text-[16px] font-semibold text-[var(--color-brand)] bg-transparent border-none outline-none w-24"
              placeholder="0"
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-[var(--color-card)]">
            <span className="text-[16px] font-medium ml-10 text-[var(--color-gray-1)]">Annual Growth %</span>
            <input
              type="number"
              value={budgetConfig.yearlyGrowthRate || ""}
              onChange={(e) => updateBudgetConfig({ yearlyGrowthRate: Number(e.target.value) })}
              className="text-right text-[16px] font-semibold text-[var(--color-brand)] bg-transparent border-none outline-none w-16"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Credit Card Bill */}
      {ccBill > 0 && (
        <div>
          <h2 className="text-[13px] font-semibold text-[var(--color-gray-1)] uppercase tracking-wide mb-1.5 px-3">Credit Card</h2>
          <div className="ios-list">
            <div className="flex items-center justify-between p-3 bg-[var(--color-card)]">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-[6px] bg-[#FF9500] flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <span className="text-[16px] font-medium">This Month's Bill</span>
              </div>
              <span className="text-[16px] font-bold text-[var(--color-expense)]">
                {formatCurrency(ccBill)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Group */}
      <div>
        <h2 className="text-[13px] font-semibold text-[var(--color-gray-1)] uppercase tracking-wide mb-1.5 px-3">Notifications</h2>
        <div className="ios-list">
          <div className="flex items-center justify-between p-3 bg-[var(--color-card)]">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-[6px] bg-[#FF3B30] flex items-center justify-center">
                <Bell className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-[16px] font-medium">SIP & Bill Reminders</span>
                <p className="text-[12px] text-[var(--color-gray-1)]">
                  {notificationPermission === "granted" ? "Notifications enabled" : 
                   notificationPermission === "denied" ? "Blocked by browser" : "Tap to enable"}
                </p>
              </div>
            </div>
            <Switch
              checked={notificationPermission === "granted"}
              onCheckedChange={handleNotificationToggle}
              disabled={notificationPermission === "denied"}
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
              <span className="text-[16px] font-medium">App Lock</span>
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
                className="flex-1 bg-transparent border-none outline-none text-[16px]"
              />
              <button 
                onClick={handleSetPassword} 
                disabled={password.length < 4}
                className="text-[var(--color-brand)] font-semibold text-[14px] disabled:opacity-50"
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
            <span className="text-[16px] text-[var(--color-brand)] font-medium">Export as JSON Backup</span>
            <Download className="h-5 w-5 text-[var(--color-brand)]" />
          </button>
          <button 
            onClick={handleExportCSV}
            className="w-full flex items-center justify-between p-3 bg-[var(--color-card)] active:bg-[var(--color-gray-5)] transition-colors text-left"
          >
            <span className="text-[16px] text-[var(--color-brand)] font-medium">Export Transactions (CSV)</span>
            <Database className="h-5 w-5 text-[var(--color-brand)]" />
          </button>
        </div>
      </div>

      <div className="text-center pt-4">
        <p className="text-[13px] text-[var(--color-gray-1)] font-medium">Kaizen Version 2.0.0</p>
      </div>
    </div>
  );
}
