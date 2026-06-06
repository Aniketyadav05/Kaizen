/**
 * FinPilot — Financial Calculations Engine
 * 
 * Strict 50/30/20 Math and Analytics.
 * NOTE: Transactions with type "transfer" are completely excluded from all budget calculations.
 */

import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
  isWithinInterval,
  subMonths,
  addMonths,
} from "date-fns";

// ─── Budget Calculations ─────────────────────────────────────

export function calculateDynamicIncome(transactions, startDate, endDate) {
  return filterTransactionsByDate(transactions, startDate, endDate)
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
}

export function calculateDynamicBudget(dynamicIncome, needsPercent, wantsPercent) {
  const n = Number(needsPercent) || 50;
  const w = Number(wantsPercent) || 30;
  return Math.floor((dynamicIncome * (n + w)) / 100);
}

export function calculateBudgetSplit(dynamicIncome, needsPct, wantsPct, savingsPct) {
  const n = Number(needsPct) || 50;
  const w = Number(wantsPct) || 30;
  const s = Number(savingsPct) || 20;
  return {
    needs: Math.floor(dynamicIncome * (n / 100)),
    wants: Math.floor(dynamicIncome * (w / 100)),
    savings: Math.ceil(dynamicIncome * (s / 100)),
    total: dynamicIncome,
  };
}

export function calculateBudgetVsActual(transactions, budgetConfig, dateRange) {
  const needsPercent = Number(budgetConfig.needsPercent) || 50;
  const wantsPercent = Number(budgetConfig.wantsPercent) || 30;
  const savingsPercent = Number(budgetConfig.savingsPercent) || 20;
  const dynamicIncome = calculateDynamicIncome(transactions, dateRange.start, dateRange.end);
  const split = calculateBudgetSplit(dynamicIncome, needsPercent, wantsPercent, savingsPercent);

  const filtered = filterTransactionsByDate(transactions, dateRange.start, dateRange.end);
  const expenses = filtered.filter(t => t.type === "expense" && t.amount > 0);

  const needActual = sumByType(expenses, "Need");
  const wantActual = sumByType(expenses, "Want");
  const savingActual = sumByType(expenses, "Saving");

  return [
    {
      type: "Need",
      label: "Needs",
      budget: split.needs,
      actual: needActual,
      remaining: split.needs - needActual,
      percentage: split.needs > 0 ? Math.round((needActual / split.needs) * 100) : 0,
      color: "var(--color-need)",
    },
    {
      type: "Want",
      label: "Wants",
      budget: split.wants,
      actual: wantActual,
      remaining: split.wants - wantActual,
      percentage: split.wants > 0 ? Math.round((wantActual / split.wants) * 100) : 0,
      color: "var(--color-want)",
    },
    {
      type: "Saving",
      label: "Savings",
      budget: split.savings,
      actual: savingActual,
      remaining: split.savings - savingActual,
      percentage: split.savings > 0 ? Math.round((savingActual / split.savings) * 100) : 0,
      color: "var(--color-saving)",
    },
  ];
}

// ─── Spending Calculations ───────────────────────────────────

export function calculateTotalSpend(transactions, startDate, endDate) {
  return filterTransactionsByDate(transactions, startDate, endDate)
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateTotalIncome(transactions, startDate, endDate) {
  return filterTransactionsByDate(transactions, startDate, endDate)
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateCategoryBreakdown(transactions, categories, startDate, endDate) {
  const filtered = filterTransactionsByDate(transactions, startDate, endDate)
    .filter(t => t.type === "expense");
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  const grouped = {};
  filtered.forEach((t) => {
    if (!grouped[t.category]) {
      const cat = categories.find((c) => c.name === t.category);
      grouped[t.category] = {
        category: t.category,
        amount: 0,
        color: cat?.color || "#64748b",
        icon: cat?.icon || "Circle",
        type: t.budgetType || cat?.type || "Want",
      };
    }
    grouped[t.category].amount += t.amount;
  });

  return Object.values(grouped)
    .map((g) => ({
      ...g,
      percentage: total > 0 ? Math.round((g.amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function calculateDailySpending(transactions, month, year) {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  const days = eachDayOfInterval({ start, end });

  return days.map((day) => {
    const dayTransactions = transactions.filter(
      (t) =>
        t.type === "expense" &&
        format(new Date(t.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
    return {
      date: format(day, "yyyy-MM-dd"),
      formattedDate: format(day, "dd"),
      dayName: format(day, "EEE"),
      amount: dayTransactions.reduce((sum, t) => sum + t.amount, 0),
    };
  });
}

// ─── Weekly Analysis ─────────────────────────────────────────

export function calculateWeeklyAnalysis(transactions, month, year, dynamicBudget) {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
  
  // Distribute the dynamic budget evenly across the weeks
  const weeklyLimit = dynamicBudget > 0 ? Math.round(dynamicBudget / weeks.length) : 0;

  return weeks.map((weekStart, index) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekTransactions = transactions.filter(
      (t) =>
        t.type === "expense" &&
        isWithinInterval(new Date(t.date), { start: weekStart, end: weekEnd })
    );
    const spend = weekTransactions.reduce((sum, t) => sum + t.amount, 0);
    const ratio = weeklyLimit > 0 ? Math.round((spend / weeklyLimit) * 100) : 0;

    return {
      week: index + 1,
      weekLabel: `Week ${index + 1}`,
      start: format(weekStart, "dd MMM"),
      end: format(weekEnd, "dd MMM"),
      startDate: weekStart,
      endDate: weekEnd,
      spend,
      limit: weeklyLimit,
      ratio,
      transactions: weekTransactions,
    };
  });
}

export function calculateCurrentWeekSpend(transactions) {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });

  return filterTransactionsByDate(transactions, start, end)
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
}

// ─── Monthly Analysis & 50/30/20 Compliance ────────────────────────────────────────

export function calculateMonthlySummary(transactions, budgetConfig, month, year) {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  const filtered = filterTransactionsByDate(transactions, start, end);

  const expenses = filtered.filter(t => t.type === "expense");
  const income = filtered.filter(t => t.type === "income");
  
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  
  const savings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

  const split = calculateBudgetSplit(
    totalIncome, // Use dynamic income instead of budgetConfig.salary
    budgetConfig.needsPercent,
    budgetConfig.wantsPercent,
    budgetConfig.savingsPercent
  );

  // 50/30/20 Compliance Score
  const needSpend = sumByType(expenses, "Need");
  const wantSpend = sumByType(expenses, "Want");
  const savingSpend = sumByType(expenses, "Saving");
  
  const needScore = split.needs > 0 ? Math.max(0, 100 - Math.max(0, ((needSpend - split.needs) / split.needs) * 100)) : 0;
  const wantScore = split.wants > 0 ? Math.max(0, 100 - Math.max(0, ((wantSpend - split.wants) / split.wants) * 100)) : 0;
  // Saving score: you get 100% if you hit your target or more
  const savingScore = split.savings > 0 ? Math.min(100, (savingSpend / split.savings) * 100) : 0;
  
  const score = Math.round((needScore + wantScore + savingScore) / 3);

  return {
    month: format(start, "MMM"),
    year,
    totalExpense,
    totalIncome,
    savings,
    savingsRate,
    budgetNeeds: split.needs,
    budgetWants: split.wants,
    budgetSavings: split.savings,
    score, // 0-100% compliance
    daysInMonth: eachDayOfInterval({ start, end }).length,
    averageDailySpend: eachDayOfInterval({ start, end }).length > 0
      ? Math.round(totalExpense / eachDayOfInterval({ start, end }).length)
      : 0,
  };
}

export function calculateYearlyTrend(transactions, year) {
  return Array.from({ length: 12 }, (_, i) => {
    const start = startOfMonth(new Date(year, i));
    const end = endOfMonth(new Date(year, i));
    const filtered = filterTransactionsByDate(transactions, start, end);

    const expense = filtered
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const income = filtered
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month: format(start, "MMM"),
      monthIndex: i,
      income,
      expense,
      savings: income - expense,
      savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : 0,
    };
  });
}

// ─── Payment Method Breakdown ────────────────────────────────

export function calculatePaymentMethodBreakdown(transactions, startDate, endDate) {
  const filtered = filterTransactionsByDate(transactions, startDate, endDate)
    .filter(t => t.type === "expense");
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  const grouped = {};
  filtered.forEach((t) => {
    const method = t.account || t.paymentMethod || t.payment_method || "Other";
    if (!grouped[method]) {
      grouped[method] = { method, amount: 0 };
    }
    grouped[method].amount += t.amount;
  });

  return Object.values(grouped)
    .map((g) => ({
      ...g,
      percentage: total > 0 ? Math.round((g.amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

// ─── Credit Card Bill ────────────────────────────────────────

export function calculateCreditCardBill(transactions, month, year) {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));

  return filterTransactionsByDate(transactions, start, end)
    .filter(t => {
      if (t.type === "income" || t.type === "transfer") return false;
      const method = t.account || t.paymentMethod || t.payment_method || "";
      return method === "Credit Card";
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);
}

// ─── Utility Helpers ─────────────────────────────────────────

function filterTransactionsByDate(transactions, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= start && d <= end;
  });
}

function sumByType(transactions, type) {
  return transactions
    .filter((t) => t.budgetType === type)
    .reduce((sum, t) => sum + t.amount, 0);
}

// ─── Missing Exports (Restored) ──────────────────────────────

export function calculateGoalProgress(goal) {
  const currentAmount = goal.currentAmount || 0;
  const targetAmount = goal.targetAmount || 1;
  const progress = Math.min(100, Math.round((currentAmount / targetAmount) * 100));
  return { ...goal, progress };
}

export function calculateCalendarHeatmap(transactions, year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const days = eachDayOfInterval({ start, end });
  
  const dailyTotals = {};
  transactions.forEach(t => {
    if (t.type !== 'expense') return;
    const dateStr = format(new Date(t.date), "yyyy-MM-dd");
    dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + Number(t.amount);
  });

  const maxDaily = Math.max(...Object.values(dailyTotals), 1);

  return days.map(day => {
    const dateStr = format(day, "yyyy-MM-dd");
    const amount = dailyTotals[dateStr] || 0;
    
    let intensity = 0;
    if (amount > 0) {
      const ratio = amount / maxDaily;
      if (ratio > 0.75) intensity = 4;
      else if (ratio > 0.5) intensity = 3;
      else if (ratio > 0.25) intensity = 2;
      else intensity = 1;
    }

    return {
      date: dateStr,
      amount,
      intensity,
      month: day.getMonth()
    };
  });
}
