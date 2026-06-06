/**
 * FinPilot — Analytics Page
 * 
 * Segmented control for Monthly/Yearly.
 * Detailed 50/30/20 compliance and breakdown charts.
 */

import { useState, useMemo } from "react";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, ReferenceLine, PieChart, Pie, Cell } from "recharts";
import useTransactionStore from "@/stores/useTransactionStore";
import useCategoryStore from "@/stores/useCategoryStore";
import useBudgetStore from "@/stores/useBudgetStore";
import {
  calculateWeeklyAnalysis,
  calculateMonthlySummary,
  calculateCategoryBreakdown,
  calculateYearlyTrend,
  calculateBudgetVsActual,
  calculateDynamicIncome,
  calculateDynamicBudget,
} from "@/lib/calculations";
import { formatCurrency, cn } from "@/lib/utils";
import { startOfMonth, endOfMonth } from "date-fns";

export default function Analytics() {
  const [timeframe, setTimeframe] = useState("monthly"); // "monthly" | "yearly"
  
  const transactions = useTransactionStore((s) => s.transactions);
  const categories = useCategoryStore((s) => s.categories);
  const budgetConfig = useBudgetStore((s) => s.budgetConfig);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const monthlyData = useMemo(() => {
    if (timeframe !== "monthly") return null;
    const start = startOfMonth(new Date(selectedYear, selectedMonth));
    const end = endOfMonth(new Date(selectedYear, selectedMonth));
    const dynamicIncome = calculateDynamicIncome(transactions, start, end);
    const dynamicBudget = calculateDynamicBudget(dynamicIncome, budgetConfig.needsPercent, budgetConfig.wantsPercent);

    const summary = calculateMonthlySummary(transactions, budgetConfig, selectedMonth, selectedYear);
    const categoryData = calculateCategoryBreakdown(transactions, categories, start, end);
    const weeklyAnalysis = calculateWeeklyAnalysis(transactions, selectedMonth, selectedYear, dynamicBudget);
    const budgetVsActual = dynamicIncome > 0
      ? calculateBudgetVsActual(transactions, budgetConfig, { start, end })
      : [];

    return { summary, categoryData, weeklyAnalysis, budgetVsActual, dynamicBudget };
  }, [transactions, budgetConfig, selectedMonth, selectedYear, timeframe, categories]);

  const yearlyData = useMemo(() => {
    if (timeframe !== "yearly") return null;
    return {
      trend: calculateYearlyTrend(transactions, selectedYear),
    };
  }, [transactions, selectedYear, timeframe]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-8 h-full overflow-y-auto">
      <div className="flex items-center justify-between pt-2">
        <h1 className="large-title m-0">Analytics</h1>
      </div>

      {/* Segmented Control */}
      <div className="flex bg-[var(--color-gray-6)] rounded-[14px] p-1 shadow-inner border border-[var(--color-border)]">
        {["monthly", "yearly"].map((t) => (
          <button
            key={t}
            onClick={() => setTimeframe(t)}
            className={cn(
              "flex-1 py-2 rounded-[10px] font-bold text-[13px] capitalize transition-all tracking-wide",
              timeframe === t ? "bg-[var(--color-card)] shadow-sm text-[var(--color-foreground)]" : "text-[var(--color-gray-1)]"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {timeframe === "monthly" && monthlyData && (
        <>
          {/* Compliance Score Hero */}
          <div className="ios-card bg-[var(--color-brand)] border-none p-5 text-white relative overflow-hidden flex justify-between items-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
            <div>
              <p className="text-white/80 font-bold uppercase tracking-wider text-[11px] mb-1">50/30/20 Compliance</p>
              <h2 className="sf-rounded text-4xl font-extrabold tracking-tighter">
                {monthlyData.summary.score}%
              </h2>
              <p className="text-white/90 font-medium text-[13px] mt-1">
                {monthlyData.summary.score > 80 ? "Excellent budget discipline! 🎉" : 
                 monthlyData.summary.score > 50 ? "Doing okay, room for improvement." : "Straying off the path. ⚠️"}
              </p>
            </div>
          </div>

          {/* 50/30/20 Chart */}
          <div className="ios-card p-5">
            <h3 className="font-bold text-[16px] font-['Clash_Grotesk'] mb-4">Budget Utilization</h3>
            {monthlyData.budgetVsActual.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between gap-2 h-4 mb-2 rounded-full overflow-hidden">
                  {monthlyData.budgetVsActual.map((item) => (
                    <div 
                      key={item.type} 
                      style={{ 
                        width: `${Math.max(5, (item.actual / (monthlyData.summary.totalExpense || 1)) * 100)}%`, 
                        backgroundColor: item.color 
                      }} 
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                   {monthlyData.budgetVsActual.map((item) => (
                     <div key={item.type} className="text-center">
                       <div className="h-2.5 w-2.5 rounded-full inline-block mr-1.5" style={{ backgroundColor: item.color }} />
                       <span className="text-[12px] font-bold text-[var(--color-gray-1)]">{item.label}</span>
                       <p className="text-[14px] font-extrabold sf-rounded mt-1" style={{ color: item.color }}>
                         {item.percentage}%
                       </p>
                       <p className="text-[10px] font-semibold text-[var(--color-gray-2)]">
                         {formatCurrency(item.actual)}
                       </p>
                     </div>
                   ))}
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-[var(--color-gray-1)] text-center py-2 font-medium">Log your income this month to see budget insights.</p>
            )}
          </div>

          {/* Weekly Spending Trend */}
          <div className="ios-card p-5">
            <h3 className="font-bold text-[16px] font-['Clash_Grotesk'] mb-4">Weekly Spending</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData.weeklyAnalysis} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="weekLabel" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-gray-1)", fontWeight: 600 }} dy={10} />
                  <Tooltip
                    cursor={{ fill: "var(--color-gray-5)" }}
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", backgroundColor: "var(--color-card)", color: "var(--color-foreground)", fontWeight: "bold" }}
                    itemStyle={{ color: "var(--color-foreground)" }}
                    formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Spent"]}
                  />
                  <ReferenceLine y={monthlyData.dynamicBudget > 0 ? Math.round(monthlyData.dynamicBudget / 4) : 10000} stroke="var(--color-expense)" strokeDasharray="4 4" />
                  <Bar dataKey="spend" radius={[6, 6, 0, 0]} barSize={24}>
                    {monthlyData.weeklyAnalysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.ratio > 100 ? "var(--color-expense)" : "var(--color-brand)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="ios-card p-5">
            <h3 className="font-bold text-[16px] font-['Clash_Grotesk'] mb-4">Category Breakdown</h3>
            {monthlyData.categoryData.length > 0 ? (
              <div className="space-y-3">
                {monthlyData.categoryData.slice(0, 5).map((cat) => (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-[13px] font-semibold">{cat.category}</span>
                      </div>
                      <span className="text-[13px] font-bold text-[var(--color-foreground)]">{formatCurrency(cat.amount)}</span>
                    </div>
                    <div className="h-2 w-full bg-[var(--color-gray-6)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[var(--color-gray-1)] text-center py-4 font-medium">No expenses this month</p>
            )}
          </div>
        </>
      )}

      {timeframe === "yearly" && yearlyData && (
        <div className="ios-card p-5">
          <h3 className="font-bold text-[16px] font-['Clash_Grotesk'] mb-4">Yearly Trend</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyData.trend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-gray-1)", fontWeight: 600 }} dy={10} />
                <Tooltip
                  cursor={{ fill: "var(--color-gray-5)" }}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", backgroundColor: "var(--color-card)", color: "var(--color-foreground)", fontWeight: "bold" }}
                  itemStyle={{ color: "var(--color-foreground)" }}
                />
                <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
