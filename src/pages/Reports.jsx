/**
 * FinPilot — Reports Page (Apple HIG Style)
 * 
 * Clean tabular grouped lists and export buttons matching iOS native look.
 */

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, FileText, FileSpreadsheet, FileJson, ChevronLeft, ChevronRight } from "lucide-react";
import useTransactionStore from "@/stores/useTransactionStore";
import useCategoryStore from "@/stores/useCategoryStore";
import useBudgetStore from "@/stores/useBudgetStore";
import {
  calculateMonthlySummary,
  calculateCategoryBreakdown,
  calculateBudgetVsActual,
  calculateWeeklyAnalysis,
} from "@/lib/calculations";
import { formatCurrency, cn } from "@/lib/utils";
import { startOfMonth, endOfMonth, format, subMonths, addMonths } from "date-fns";

export default function Reports() {
  const transactions = useTransactionStore((s) => s.transactions);
  const categories = useCategoryStore((s) => s.categories);
  const budgetConfig = useBudgetStore((s) => s.budgetConfig);
  const [currentDate, setCurrentDate] = useState(new Date());

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(new Date(year, month));

  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);

  useEffect(() => {
    fetchTransactions(monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]);
  }, [currentDate, fetchTransactions]);

  const reportData = useMemo(() => {
    const summary = calculateMonthlySummary(transactions, budgetConfig, month, year);
    const catBreakdown = calculateCategoryBreakdown(transactions, categories, monthStart, monthEnd);
    return { summary, catBreakdown };
  }, [transactions, categories, budgetConfig, month, year]);

  const exportJSON = () => {
    const data = {
      period: format(currentDate, "MMMM yyyy"),
      summary: reportData.summary,
      categoryBreakdown: reportData.catBreakdown,
      generatedAt: new Date().toISOString(),
    };
    downloadFile(JSON.stringify(data, null, 2), `finpilot-report-${format(currentDate, "yyyy-MM")}.json`, "application/json");
  };

  const exportCSV = () => {
    const monthTransactions = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= monthStart && d <= monthEnd;
    });

    const headers = ["Date", "Description", "Category", "Amount", "Type"];
    const rows = monthTransactions.map((t) => [
      format(new Date(t.date), "yyyy-MM-dd"),
      t.description,
      t.category,
      t.amount,
      t.type,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    downloadFile(csvContent, `finpilot-report-${format(currentDate, "yyyy-MM")}.csv`, "text/csv");
  };

  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="large-title m-0">Reports</h1>
        <div className="flex items-center gap-1 bg-[var(--color-gray-5)] rounded-full px-2 py-1">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 active:opacity-50">
            <ChevronLeft className="h-4 w-4 text-[var(--color-brand)]" />
          </button>
          <span className="text-[13px] font-semibold min-w-[80px] text-center">{format(currentDate, "MMM yyyy")}</span>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 active:opacity-50">
            <ChevronRight className="h-4 w-4 text-[var(--color-brand)]" />
          </button>
        </div>
      </div>

      {/* Summary Group */}
      <div>
        <h2 className="text-[13px] font-semibold text-[var(--color-gray-1)] uppercase tracking-wide mb-1.5 px-3">Monthly Summary</h2>
        <div className="ios-list p-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--color-gray-6)] p-3 rounded-xl border border-[var(--color-border)]">
              <p className="text-[12px] text-[var(--color-gray-1)] font-medium">Income</p>
              <p className="text-[20px] font-semibold text-[var(--color-income)] mt-1">{formatCurrency(reportData.summary.totalIncome)}</p>
            </div>
            <div className="bg-[var(--color-gray-6)] p-3 rounded-xl border border-[var(--color-border)]">
              <p className="text-[12px] text-[var(--color-gray-1)] font-medium">Expenses</p>
              <p className="text-[20px] font-semibold text-[var(--color-expense)] mt-1">{formatCurrency(reportData.summary.totalExpense)}</p>
            </div>
            <div className="bg-[var(--color-gray-6)] p-3 rounded-xl border border-[var(--color-border)]">
              <p className="text-[12px] text-[var(--color-gray-1)] font-medium">Savings</p>
              <p className={cn("text-[20px] font-semibold mt-1", reportData.summary.savings >= 0 ? "text-[var(--color-income)]" : "text-[var(--color-expense)]")}>
                {formatCurrency(reportData.summary.savings)}
              </p>
            </div>
            <div className="bg-[var(--color-gray-6)] p-3 rounded-xl border border-[var(--color-border)]">
              <p className="text-[12px] text-[var(--color-gray-1)] font-medium">Score</p>
              <p className="text-[20px] font-semibold mt-1">{reportData.summary.score}/10</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Group */}
      {reportData.catBreakdown.length > 0 && (
        <div>
          <h2 className="text-[13px] font-semibold text-[var(--color-gray-1)] uppercase tracking-wide mb-1.5 px-3">Category Breakdown</h2>
          <div className="ios-list">
            {reportData.catBreakdown.map((cat) => (
              <div key={cat.category} className="ios-list-item px-3 py-2.5">
                <span className="text-[17px] font-medium flex-1">{cat.category}</span>
                <div className="text-right flex items-center gap-3">
                  <span className="text-[13px] text-[var(--color-gray-1)]">{cat.type}</span>
                  <span className="text-[17px] font-semibold min-w-[80px]">{formatCurrency(cat.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Actions */}
      <div>
        <h2 className="text-[13px] font-semibold text-[var(--color-gray-1)] uppercase tracking-wide mb-1.5 px-3">Export Options</h2>
        <div className="ios-list">
          <button onClick={exportCSV} className="ios-list-item px-3 py-3 w-full text-left active:bg-[var(--color-gray-5)]">
            <FileSpreadsheet className="h-5 w-5 text-[#34C759] mr-3" />
            <span className="text-[17px] flex-1">Export as CSV</span>
            <Download className="h-4 w-4 text-[var(--color-gray-2)]" />
          </button>
          <button onClick={exportJSON} className="ios-list-item px-3 py-3 w-full text-left active:bg-[var(--color-gray-5)]">
            <FileJson className="h-5 w-5 text-[#007AFF] mr-3" />
            <span className="text-[17px] flex-1">Export as JSON</span>
            <Download className="h-4 w-4 text-[var(--color-gray-2)]" />
          </button>
        </div>
      </div>
    </div>
  );
}
