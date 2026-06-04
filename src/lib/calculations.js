/**
 * FinPilot — Financial Calculations Engine
 * 
 * All business logic from the Excel tracker, reimplemented as pure functions.
 * No side effects, no store access — pass data in, get results out.
 * 
 * Key formulas replicated:
 *   Budget(Need)  = FLOOR(Salary × 0.5, 1)
 *   Budget(Want)  = FLOOR(Salary × 0.3, 1)
 *   Budget(Save)  = CEIL(Salary × 0.2, 1)
 *   Weekly Ratio  = (Week Spend / Weekly Limit) × 100
 *   Amount Left   = Salary − Total Spend
 *   % Left        = Amount Left / Salary
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
  getWeek,
  differenceInDays,
  addMonths,
} from "date-fns";

// ─── Budget Calculations ─────────────────────────────────────

/**
 * Calculate 50/30/20 budget split from salary.
 * Matches Excel: FLOOR(salary*0.5), FLOOR(salary*0.3), CEIL(salary*0.2)
 */
export function calculateBudgetSplit(salary, needsPct = 50, wantsPct = 30, savingsPct = 20) {
  return {
    needs: Math.floor(salary * (needsPct / 100)),
    wants: Math.floor(salary * (wantsPct / 100)),
    savings: Math.ceil(salary * (savingsPct / 100)),
    total: salary,
  };
}

/**
 * Calculate budget vs actual spend for each type.
 * Returns array of { type, budget, actual, remaining, percentage }
 */
export function calculateBudgetVsActual(transactions, budgetConfig, dateRange) {
  const { salary, needsPercent, wantsPercent, savingsPercent } = budgetConfig;
  const split = calculateBudgetSplit(salary, needsPercent, wantsPercent, savingsPercent);

  const filtered = filterTransactionsByDate(transactions, dateRange.start, dateRange.end);
  const expenses = filtered.filter(t => t.amount > 0 && t.type !== "income");

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
    },
    {
      type: "Want",
      label: "Wants",
      budget: split.wants,
      actual: wantActual,
      remaining: split.wants - wantActual,
      percentage: split.wants > 0 ? Math.round((wantActual / split.wants) * 100) : 0,
    },
    {
      type: "Saving",
      label: "Savings",
      budget: split.savings,
      actual: savingActual,
      remaining: split.savings - savingActual,
      percentage: split.savings > 0 ? Math.round((savingActual / split.savings) * 100) : 0,
    },
  ];
}

// ─── Spending Calculations ───────────────────────────────────

/**
 * Calculate total spending within a date range.
 */
export function calculateTotalSpend(transactions, startDate, endDate) {
  return filterTransactionsByDate(transactions, startDate, endDate)
    .filter(t => t.type !== "income")
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate total income within a date range.
 */
export function calculateTotalIncome(transactions, startDate, endDate) {
  return filterTransactionsByDate(transactions, startDate, endDate)
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate spending grouped by category within a date range.
 * Returns sorted array of { category, amount, percentage, type }
 */
export function calculateCategoryBreakdown(transactions, categories, startDate, endDate) {
  const filtered = filterTransactionsByDate(transactions, startDate, endDate)
    .filter(t => t.type !== "income");
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
        type: cat?.type || t.budgetType || "Want",
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

/**
 * Calculate daily spending for a month (for monthly analysis chart).
 * Returns array of { date, amount, formattedDate }
 */
export function calculateDailySpending(transactions, month, year) {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  const days = eachDayOfInterval({ start, end });

  return days.map((day) => {
    const dayTransactions = transactions.filter(
      (t) =>
        t.type !== "income" &&
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

/**
 * Calculate weekly spending analysis.
 * Replicates the Weekly Analysis sheet: week start/end, spend, limit, ratio.
 */
export function calculateWeeklyAnalysis(transactions, weeklyLimit = 10000, month, year) {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }); // Monday start

  return weeks.map((weekStart, index) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekTransactions = transactions.filter(
      (t) =>
        t.type !== "income" &&
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

/**
 * Calculate current week's spending.
 */
export function calculateCurrentWeekSpend(transactions) {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });

  return filterTransactionsByDate(transactions, start, end)
    .filter(t => t.type !== "income")
    .reduce((sum, t) => sum + t.amount, 0);
}

// ─── Monthly Analysis ────────────────────────────────────────

/**
 * Calculate monthly summary (replicates Monthly Analysis sheet).
 */
export function calculateMonthlySummary(transactions, budgetConfig, month, year) {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  const filtered = filterTransactionsByDate(transactions, start, end);

  const expenses = filtered.filter(t => t.type !== "income");
  const income = filtered.filter(t => t.type === "income");
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const savings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

  const split = calculateBudgetSplit(
    budgetConfig.salary,
    budgetConfig.needsPercent,
    budgetConfig.wantsPercent,
    budgetConfig.savingsPercent
  );

  // Monthly score (1-10) based on budget adherence
  const score = calculateMonthlyScore(totalExpense, budgetConfig.salary);

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
    score,
    daysInMonth: eachDayOfInterval({ start, end }).length,
    averageDailySpend: eachDayOfInterval({ start, end }).length > 0
      ? Math.round(totalExpense / eachDayOfInterval({ start, end }).length)
      : 0,
  };
}

/**
 * Calculate monthly score (1-10).
 * 10 = spent <= 60% of salary, 1 = spent > 120%
 */
export function calculateMonthlyScore(totalExpense, salary) {
  if (salary <= 0) return 5;
  const ratio = totalExpense / salary;
  if (ratio <= 0.5) return 10;
  if (ratio <= 0.6) return 9;
  if (ratio <= 0.7) return 8;
  if (ratio <= 0.75) return 7;
  if (ratio <= 0.8) return 6;
  if (ratio <= 0.85) return 5;
  if (ratio <= 0.9) return 4;
  if (ratio <= 0.95) return 3;
  if (ratio <= 1.0) return 2;
  return 1;
}

// ─── Yearly Analysis ─────────────────────────────────────────

/**
 * Calculate monthly trend for a full year.
 * Returns array of { month, income, expense, savings, savingsRate }
 */
export function calculateYearlyTrend(transactions, year) {
  return Array.from({ length: 12 }, (_, i) => {
    const start = startOfMonth(new Date(year, i));
    const end = endOfMonth(new Date(year, i));
    const filtered = filterTransactionsByDate(transactions, start, end);

    const expense = filtered
      .filter(t => t.type !== "income")
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

/**
 * Calculate salary projection for next N years.
 * Replicates Setup sheet: salary * 1.1 each year
 */
export function calculateSalaryProjection(currentSalary, growthRate = 10, years = 5) {
  return Array.from({ length: years }, (_, i) => {
    const salary = Math.round(currentSalary * Math.pow(1 + growthRate / 100, i));
    const split = calculateBudgetSplit(salary);
    return {
      year: new Date().getFullYear() + i,
      salary,
      ...split,
    };
  });
}

// ─── Goal Calculations ───────────────────────────────────────

/**
 * Calculate goal progress and ETA.
 */
export function calculateGoalProgress(goal, monthlySavings = 0) {
  const progress =
    goal.targetAmount > 0
      ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
      : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  let etaMonths = null;
  if (monthlySavings > 0 && remaining > 0) {
    etaMonths = Math.ceil(remaining / monthlySavings);
  }

  return {
    ...goal,
    progress,
    remaining,
    etaMonths,
    etaDate: etaMonths ? format(addMonths(new Date(), etaMonths), "MMM yyyy") : null,
  };
}

// ─── Payment Method Breakdown ────────────────────────────────

/**
 * Calculate spending by payment method.
 */
export function calculatePaymentMethodBreakdown(transactions, startDate, endDate) {
  const filtered = filterTransactionsByDate(transactions, startDate, endDate)
    .filter(t => t.type !== "income");
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  const grouped = {};
  filtered.forEach((t) => {
    const method = t.paymentMethod || "Other";
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

// ─── Calendar Heatmap Data ───────────────────────────────────

/**
 * Generate heatmap data for a year (like the Yearly Calendar sheet).
 */
export function calculateCalendarHeatmap(transactions, year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const days = eachDayOfInterval({ start, end });

  // Calculate max daily spend for normalization
  const dailySpends = {};
  transactions
    .filter(t => t.type !== "income")
    .forEach((t) => {
      const key = format(new Date(t.date), "yyyy-MM-dd");
      dailySpends[key] = (dailySpends[key] || 0) + t.amount;
    });

  const maxSpend = Math.max(1, ...Object.values(dailySpends));

  return days.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    const amount = dailySpends[key] || 0;
    return {
      date: key,
      day: day.getDate(),
      month: day.getMonth(),
      dayOfWeek: day.getDay(),
      amount,
      intensity: amount > 0 ? Math.ceil((amount / maxSpend) * 4) : 0, // 0-4 scale
    };
  });
}

// ─── Comparison Helpers ──────────────────────────────────────

/**
 * Compare current month to previous month.
 */
export function calculateMonthComparison(transactions, currentMonth, currentYear) {
  const prevDate = subMonths(new Date(currentYear, currentMonth), 1);

  const currentStart = startOfMonth(new Date(currentYear, currentMonth));
  const currentEnd = endOfMonth(new Date(currentYear, currentMonth));
  const prevStart = startOfMonth(prevDate);
  const prevEnd = endOfMonth(prevDate);

  const currentExpense = calculateTotalSpend(transactions, currentStart, currentEnd);
  const prevExpense = calculateTotalSpend(transactions, prevStart, prevEnd);
  const currentIncome = calculateTotalIncome(transactions, currentStart, currentEnd);
  const prevIncome = calculateTotalIncome(transactions, prevStart, prevEnd);

  return {
    currentExpense,
    prevExpense,
    expenseChange: prevExpense > 0
      ? Math.round(((currentExpense - prevExpense) / prevExpense) * 100)
      : 0,
    currentIncome,
    prevIncome,
    incomeChange: prevIncome > 0
      ? Math.round(((currentIncome - prevIncome) / prevIncome) * 100)
      : 0,
  };
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
