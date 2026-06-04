import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, isSameDay } from "date-fns";

/**
 * Merge Tailwind classes with clsx — the standard ShadCN utility.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian Rupee currency.
 * @param {number} amount
 * @param {boolean} compact - Use compact notation (e.g., 1.2L)
 * @returns {string}
 */
export function formatCurrency(amount, compact = false) {
  if (amount === null || amount === undefined) return "₹0";
  
  if (compact) {
    if (Math.abs(amount) >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    }
    if (Math.abs(amount) >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (Math.abs(amount) >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date for display.
 */
export function formatDate(date, pattern = "dd MMM yyyy") {
  if (!date) return "";
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, pattern);
}

/**
 * Generate a unique ID.
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get the percentage of a value relative to total.
 */
export function getPercentage(value, total) {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Group transactions by date.
 * @returns {Array<{ date: string, transactions: Array, total: number }>}
 */
export function groupTransactionsByDate(transactions) {
  const groups = {};
  
  transactions
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((t) => {
      const dateKey = format(new Date(t.date), "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = { date: dateKey, transactions: [], total: 0 };
      }
      groups[dateKey].transactions.push(t);
      groups[dateKey].total += t.amount;
    });

  return Object.values(groups).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
}

/**
 * Get color class based on ratio (budget utilization).
 * < 70% = green, 70-100% = yellow/orange, > 100% = red
 */
export function getRatioColor(ratio) {
  if (ratio <= 50) return "text-green-500";
  if (ratio <= 70) return "text-emerald-500";
  if (ratio <= 90) return "text-yellow-500";
  if (ratio <= 100) return "text-orange-500";
  return "text-red-500";
}

/**
 * Get the status label for a budget ratio.
 */
export function getRatioLabel(ratio) {
  if (ratio <= 50) return "Excellent";
  if (ratio <= 70) return "Good";
  if (ratio <= 90) return "Caution";
  if (ratio <= 100) return "Tight";
  return "Over Budget";
}

/**
 * Debounce a function.
 */
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Re-export useful date-fns
export {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  isSameDay,
};
