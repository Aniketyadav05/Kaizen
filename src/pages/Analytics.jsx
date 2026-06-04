/**
 * FinPilot — Analytics Page (Apple HIG Style)
 * 
 * Segmented control for Weekly/Monthly/Yearly.
 * Clean, flat charts mimicking Apple Stocks / Health.
 */

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, AreaChart, Area,
  ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine,
} from "recharts";
import useTransactionStore from "@/stores/useTransactionStore";
import useCategoryStore from "@/stores/useCategoryStore";
import useBudgetStore from "@/stores/useBudgetStore";
import {
  calculateWeeklyAnalysis,
  calculateDailySpending,
  calculateMonthlySummary,
  calculateCategoryBreakdown,
  calculateYearlyTrend,
  calculateBudgetVsActual,
} from "@/lib/calculations";
import { formatCurrency, cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, PieChart as PieChartIcon, Activity } from "lucide-react";
import { startOfMonth, endOfMonth, format, subMonths, addMonths } from "date-fns";

export default function Analytics() {
  const transactions = useTransactionStore((s) => s.transactions);
  const categories = useCategoryStore((s) => s.categories);
  const budgetConfig = useBudgetStore((s) => s.budgetConfig);

  const [currentDate, setCurrentDate] = useState(new Date());
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const [tab, setTab] = useState("monthly");

  const navigateMonth = (dir) => {
    setCurrentDate((d) => (dir > 0 ? addMonths(d, 1) : subMonths(d, 1)));
  };

  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);

  // Lazy load transactions for the selected month
  useEffect(() => {
    if (tab !== "yearly") {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      fetchTransactions(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
    }
  }, [currentDate, tab, fetchTransactions]);

  // Lazy load transactions for the whole year when yearly tab is selected
  useEffect(() => {
    if (tab === "yearly") {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      fetchTransactions(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
    }
  }, [tab, year, fetchTransactions]);

  const monthlyData = useMemo(() => {
    const daily = calculateDailySpending(transactions, month, year);
    const summary = calculateMonthlySummary(transactions, budgetConfig, month, year);
    const catBreakdown = calculateCategoryBreakdown(
      transactions,
      categories,
      startOfMonth(new Date(year, month)),
      endOfMonth(new Date(year, month))
    );
    const weeklyAnalysis = calculateWeeklyAnalysis(transactions, budgetConfig.weeklyLimit, month, year);
    const budgetVsActual = budgetConfig.salary > 0
      ? calculateBudgetVsActual(transactions, budgetConfig, {
          start: startOfMonth(new Date(year, month)),
          end: endOfMonth(new Date(year, month)),
        })
      : [];

    return { daily, summary, catBreakdown, weeklyAnalysis, budgetVsActual };
  }, [transactions, categories, budgetConfig, month, year]);

  const yearlyData = useMemo(() => {
    return calculateYearlyTrend(transactions, year);
  }, [transactions, year]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="large-title m-0">Analytics</h1>
        <div className="flex items-center gap-1 bg-[var(--color-gray-5)] rounded-full px-2 py-1">
          <button onClick={() => navigateMonth(-1)} className="p-1 active:opacity-50">
            <ChevronLeft className="h-4 w-4 text-[var(--color-brand)]" />
          </button>
          <span className="text-[13px] font-semibold min-w-[80px] text-center">
            {format(currentDate, "MMM yyyy")}
          </span>
          <button onClick={() => navigateMonth(1)} className="p-1 active:opacity-50">
            <ChevronRight className="h-4 w-4 text-[var(--color-brand)]" />
          </button>
        </div>
      </div>

      {/* iOS Segmented Control */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full bg-[var(--color-gray-5)] rounded-lg p-1 h-8">
          <TabsTrigger value="weekly" className="rounded-md text-[13px] h-6 flex-1 data-[state=active]:bg-[var(--color-card)] data-[state=active]:shadow-sm">Weekly</TabsTrigger>
          <TabsTrigger value="monthly" className="rounded-md text-[13px] h-6 flex-1 data-[state=active]:bg-[var(--color-card)] data-[state=active]:shadow-sm">Monthly</TabsTrigger>
          <TabsTrigger value="yearly" className="rounded-md text-[13px] h-6 flex-1 data-[state=active]:bg-[var(--color-card)] data-[state=active]:shadow-sm">Yearly</TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-6">
          {/* ─── WEEKLY ─── */}
          <TabsContent value="weekly" className="space-y-6 m-0">
            <div className="ios-list p-4 overflow-hidden">
              <h3 className="font-semibold text-[17px] mb-4">Weekly Spending</h3>
              <div className="h-[200px] -mx-2 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData.weeklyAnalysis}>
                    <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: "var(--color-gray-1)" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{fill: "transparent"}}
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "none", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", fontSize: "12px", fontWeight: "600" }}
                      itemStyle={{ color: "var(--color-foreground)" }}
                      formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Spent"]}
                    />
                    <ReferenceLine y={budgetConfig.weeklyLimit} stroke="var(--color-expense)" strokeDasharray="4 4" />
                    <Bar dataKey="spend" radius={[4, 4, 0, 0]} barSize={30}>
                      {monthlyData.weeklyAnalysis.map((entry, index) => (
                        <cell key={`cell-${index}`} fill={entry.ratio > 100 ? "var(--color-expense)" : entry.ratio > 70 ? "var(--color-want)" : "var(--color-brand)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <h3 className="font-semibold text-[17px] mb-2 px-2 mt-6">Week by Week</h3>
            <div className="ios-list">
              {monthlyData.weeklyAnalysis.map((w) => (
                <div key={w.week} className="ios-list-item flex-col items-stretch p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-[15px]">{w.weekLabel}</span>
                    <span className="font-semibold text-[15px]">{formatCurrency(w.spend)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[var(--color-gray-1)]">{w.start} - {w.end}</span>
                    <span className={cn(
                      "text-[12px] font-medium",
                      w.ratio > 100 ? "text-[var(--color-expense)]" : w.ratio > 70 ? "text-[var(--color-want)]" : "text-[var(--color-income)]"
                    )}>
                      {w.ratio}% of limit
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ─── MONTHLY ─── */}
          <TabsContent value="monthly" className="space-y-6 m-0">
            {/* Monthly Score */}
            <div className="ios-list p-4 flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[var(--color-gray-5)] flex items-center justify-center shrink-0">
                <Activity className="h-8 w-8 text-[var(--color-brand)]" />
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-semibold text-[var(--color-gray-1)] uppercase">Health Score</p>
                <p className="text-[32px] sf-rounded font-bold leading-none mt-1">
                  {monthlyData.summary.score}<span className="text-[20px] text-[var(--color-gray-1)]">/10</span>
                </p>
              </div>
            </div>

            {/* Daily Spending Area Chart */}
            <div className="ios-list p-4 overflow-hidden">
              <h3 className="font-semibold text-[17px] mb-4">Daily Trend</h3>
              <div className="h-[180px] -mx-2 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData.daily}>
                    <defs>
                      <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="formattedDate" tick={{ fontSize: 10, fill: "var(--color-gray-1)" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "none", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", fontSize: "12px", fontWeight: "600" }}
                      itemStyle={{ color: "var(--color-foreground)" }}
                      formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Spent"]}
                      labelFormatter={(l) => `Day ${l}`}
                      cursor={{ stroke: 'var(--color-gray-3)', strokeDasharray: '3 3' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="var(--color-brand)" strokeWidth={3} fill="url(#dailyGrad)" activeDot={{ r: 6, strokeWidth: 0, fill: "var(--color-brand)" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown */}
            {monthlyData.catBreakdown.length > 0 && (
              <div>
                <h3 className="font-semibold text-[17px] mb-2 px-2">Top Spending</h3>
                <div className="ios-list">
                  {monthlyData.catBreakdown.map((cat, i) => (
                    <div key={cat.category} className="ios-list-item flex-col items-stretch p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-[15px]">{cat.category}</span>
                        <span className="font-semibold text-[15px]">{formatCurrency(cat.amount)}</span>
                      </div>
                      <Progress value={cat.percentage} className="h-1.5 bg-[var(--color-gray-5)] [&>div]:bg-[var(--color-brand)]" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ─── YEARLY ─── */}
          <TabsContent value="yearly" className="space-y-6 m-0">
            {/* Savings Trend */}
            <div className="ios-list p-4 overflow-hidden">
              <h3 className="font-semibold text-[17px] mb-4">Savings Trend</h3>
              <div className="h-[180px] -mx-2 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={yearlyData}>
                    <defs>
                      <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-income)" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="var(--color-income)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--color-gray-1)" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "none", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", fontSize: "12px", fontWeight: "600" }}
                      itemStyle={{ color: "var(--color-foreground)" }}
                      formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Savings"]}
                    />
                    <Area type="monotone" dataKey="savings" stroke="var(--color-income)" strokeWidth={3} fill="url(#savingsGrad)" activeDot={{ r: 6, strokeWidth: 0, fill: "var(--color-income)" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Income vs Expense Bars */}
            <div className="ios-list p-4 overflow-hidden">
              <h3 className="font-semibold text-[17px] mb-4">Cash Flow</h3>
              <div className="h-[200px] -mx-2 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyData}>
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--color-gray-1)" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{fill: "transparent"}}
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "none", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", fontSize: "12px", fontWeight: "600" }}
                      itemStyle={{ color: "var(--color-foreground)" }}
                      formatter={(v) => [`₹${v.toLocaleString("en-IN")}`]}
                    />
                    <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} name="Income" barSize={10} />
                    <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} name="Expense" barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
