/**
 * FinPilot — Insights Engine
 * 
 * Auto-generates financial insights from transaction data.
 * Displayed on the dashboard as actionable cards.
 * 
 * Each insight has: type (positive/negative/info), icon, title, description.
 */

import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
} from "date-fns";

/**
 * Generate all insights for the current period.
 * @param {Array} transactions - All transactions
 * @param {Object} budgetConfig - Budget configuration
 * @param {Array} categories - Category list
 * @returns {Array<{ type, icon, title, description, priority }>}
 */
export function generateInsights(transactions, budgetConfig, categories) {
  const insights = [];
  const now = new Date();
  const currentStart = startOfMonth(now);
  const currentEnd = endOfMonth(now);
  const prevStart = startOfMonth(subMonths(now, 1));
  const prevEnd = endOfMonth(subMonths(now, 1));

  const currentExpenses = transactions.filter(
    (t) => t.type !== "income" && new Date(t.date) >= currentStart && new Date(t.date) <= currentEnd
  );
  const prevExpenses = transactions.filter(
    (t) => t.type !== "income" && new Date(t.date) >= prevStart && new Date(t.date) <= prevEnd
  );
  const currentIncome = transactions.filter(
    (t) => t.type === "income" && new Date(t.date) >= currentStart && new Date(t.date) <= currentEnd
  );

  const currentTotal = currentExpenses.reduce((s, t) => s + t.amount, 0);
  const prevTotal = prevExpenses.reduce((s, t) => s + t.amount, 0);
  const incomeTotal = currentIncome.reduce((s, t) => s + t.amount, 0);

  // ─── Spending Trend ───
  if (prevTotal > 0 && currentTotal > 0) {
    const changePercent = Math.round(((currentTotal - prevTotal) / prevTotal) * 100);
    if (changePercent > 15) {
      insights.push({
        type: "warning",
        icon: "TrendingUp",
        title: "Spending Up",
        description: `You've spent ${changePercent}% more this month compared to last month.`,
        priority: 1,
      });
    } else if (changePercent < -10) {
      insights.push({
        type: "positive",
        icon: "TrendingDown",
        title: "Spending Down",
        description: `Great job! Spending is down ${Math.abs(changePercent)}% vs last month.`,
        priority: 1,
      });
    }
  }

  // ─── Savings Rate ───
  if (incomeTotal > 0) {
    const savingsRate = Math.round(((incomeTotal - currentTotal) / incomeTotal) * 100);
    if (savingsRate >= 30) {
      insights.push({
        type: "positive",
        icon: "PiggyBank",
        title: "Strong Saver",
        description: `Your savings rate is ${savingsRate}% this month. Keep it up!`,
        priority: 2,
      });
    } else if (savingsRate < 10 && savingsRate >= 0) {
      insights.push({
        type: "warning",
        icon: "AlertTriangle",
        title: "Low Savings",
        description: `Savings rate is only ${savingsRate}%. Try to cut discretionary spending.`,
        priority: 1,
      });
    } else if (savingsRate < 0) {
      insights.push({
        type: "negative",
        icon: "AlertOctagon",
        title: "Overspending",
        description: `You've spent more than your income this month. Review your expenses.`,
        priority: 0,
      });
    }
  }

  // ─── Budget Adherence ───
  if (budgetConfig.salary > 0) {
    const budgetUsed = Math.round((currentTotal / budgetConfig.salary) * 100);
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const expectedUsage = Math.round((dayOfMonth / daysInMonth) * 100);

    if (budgetUsed > expectedUsage + 15) {
      insights.push({
        type: "warning",
        icon: "Gauge",
        title: "Ahead of Budget",
        description: `You've used ${budgetUsed}% of your budget but we're only ${expectedUsage}% through the month.`,
        priority: 1,
      });
    } else if (budgetUsed < expectedUsage - 10) {
      insights.push({
        type: "positive",
        icon: "Shield",
        title: "Under Budget",
        description: `Nice! Budget usage (${budgetUsed}%) is below the expected pace (${expectedUsage}%).`,
        priority: 2,
      });
    }
  }

  // ─── Category-Level Insights ───
  const currentCategorySpend = {};
  const prevCategorySpend = {};
  
  currentExpenses.forEach((t) => {
    currentCategorySpend[t.category] = (currentCategorySpend[t.category] || 0) + t.amount;
  });
  prevExpenses.forEach((t) => {
    prevCategorySpend[t.category] = (prevCategorySpend[t.category] || 0) + t.amount;
  });

  Object.entries(currentCategorySpend).forEach(([cat, amount]) => {
    const prevAmount = prevCategorySpend[cat] || 0;
    if (prevAmount > 0) {
      const change = Math.round(((amount - prevAmount) / prevAmount) * 100);
      if (change > 30) {
        insights.push({
          type: "info",
          icon: "BarChart3",
          title: `${cat} ↑ ${change}%`,
          description: `${cat} spending increased ${change}% vs last month.`,
          priority: 3,
        });
      }
    }
  });

  // ─── Highest Spending Day ───
  if (currentExpenses.length > 0) {
    const dailySpend = {};
    currentExpenses.forEach((t) => {
      const day = format(new Date(t.date), "yyyy-MM-dd");
      dailySpend[day] = (dailySpend[day] || 0) + t.amount;
    });
    const maxDay = Object.entries(dailySpend).sort((a, b) => b[1] - a[1])[0];
    if (maxDay) {
      insights.push({
        type: "info",
        icon: "Calendar",
        title: "Peak Spending Day",
        description: `${format(new Date(maxDay[0]), "dd MMM")} was your highest spending day (₹${maxDay[1].toLocaleString("en-IN")}).`,
        priority: 4,
      });
    }
  }

  // ─── No Transactions Warning ───
  if (currentExpenses.length === 0 && now.getDate() > 3) {
    insights.push({
      type: "info",
      icon: "Edit3",
      title: "No Expenses Logged",
      description: "Start tracking your expenses to get personalized insights!",
      priority: 0,
    });
  }

  return insights.sort((a, b) => a.priority - b.priority);
}
