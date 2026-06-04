/**
 * FinPilot — Default Categories, Payment Methods & Initial Config
 * 
 * These are the default values the app ships with.
 * Categories match the Excel tracker's structure:
 *   - Life Infrastructure → Need
 *   - Performance & Growth → Need
 *   - Lifestyle Enjoyment → Want
 *   - Relationships & Generosity → Want
 *   - Future Me → Saving
 */

export const DEFAULT_CATEGORIES = [
  { id: "cat-1", name: "Life Infrastructure", icon: "Home", color: "#3b82f6", type: "Need" },
  { id: "cat-2", name: "Performance & Growth", icon: "TrendingUp", color: "#6366f1", type: "Need" },
  { id: "cat-3", name: "Lifestyle Enjoyment", icon: "Sparkles", color: "#f43f5e", type: "Want" },
  { id: "cat-4", name: "Relationships & Generosity", icon: "Heart", color: "#ec4899", type: "Want" },
  { id: "cat-5", name: "Future Me", icon: "PiggyBank", color: "#10b981", type: "Saving" },
  { id: "cat-6", name: "Food & Dining", icon: "UtensilsCrossed", color: "#f97316", type: "Want" },
  { id: "cat-7", name: "Transport", icon: "Car", color: "#0ea5e9", type: "Need" },
  { id: "cat-8", name: "Shopping", icon: "ShoppingBag", color: "#a855f7", type: "Want" },
  { id: "cat-9", name: "Health & Fitness", icon: "Dumbbell", color: "#14b8a6", type: "Need" },
  { id: "cat-10", name: "Education", icon: "GraduationCap", color: "#8b5cf6", type: "Need" },
  { id: "cat-11", name: "Entertainment", icon: "Gamepad2", color: "#e11d48", type: "Want" },
  { id: "cat-12", name: "Bills & Utilities", icon: "Zap", color: "#eab308", type: "Need" },
];

export const DEFAULT_PAYMENT_METHODS = [
  { id: "pm-1", name: "UPI", icon: "Smartphone" },
  { id: "pm-2", name: "Credit Card", icon: "CreditCard" },
  { id: "pm-3", name: "Debit Card", icon: "CreditCard" },
  { id: "pm-4", name: "Cash", icon: "Banknote" },
  { id: "pm-5", name: "Bank Transfer", icon: "Building2" },
  { id: "pm-6", name: "Wallet", icon: "Wallet" },
  { id: "pm-7", name: "Net Banking", icon: "Globe" },
];

export const DEFAULT_INCOME_SOURCES = [
  { id: "inc-1", name: "Salary", icon: "Briefcase", color: "#10b981" },
  { id: "inc-2", name: "Freelancing", icon: "Laptop", color: "#6366f1" },
  { id: "inc-3", name: "Business", icon: "Building2", color: "#f97316" },
  { id: "inc-4", name: "Investments", icon: "TrendingUp", color: "#3b82f6" },
  { id: "inc-5", name: "Rental Income", icon: "Home", color: "#8b5cf6" },
  { id: "inc-6", name: "Other", icon: "Plus", color: "#64748b" },
];

export const BUDGET_TYPES = [
  { key: "Need", label: "Needs", percent: 50, color: "var(--color-need)", description: "Essentials you can't avoid" },
  { key: "Want", label: "Wants", percent: 30, color: "var(--color-want)", description: "Things you enjoy but don't need" },
  { key: "Saving", label: "Savings", percent: 20, color: "var(--color-saving)", description: "Investing in your future" },
];

export const DEFAULT_BUDGET_CONFIG = {
  salary: 0,
  needsPercent: 50,
  wantsPercent: 30,
  savingsPercent: 20,
  weeklyLimit: 10000,
  yearlyGrowthRate: 10,
};

export const DEFAULT_SETTINGS = {
  theme: "system",
  currency: "₹",
  passwordEnabled: false,
  passwordHash: null,
  isLocked: false,
  notificationsEnabled: false,
};

export const GOAL_TYPES = [
  { key: "emergency", label: "Emergency Fund", icon: "ShieldCheck", color: "#10b981" },
  { key: "house", label: "House", icon: "Home", color: "#3b82f6" },
  { key: "car", label: "Car", icon: "Car", color: "#6366f1" },
  { key: "vacation", label: "Vacation", icon: "Plane", color: "#f97316" },
  { key: "investment", label: "Investment", icon: "TrendingUp", color: "#8b5cf6" },
  { key: "education", label: "Education", icon: "GraduationCap", color: "#0ea5e9" },
  { key: "wedding", label: "Wedding", icon: "Heart", color: "#ec4899" },
  { key: "retirement", label: "Retirement", icon: "Sunset", color: "#eab308" },
  { key: "custom", label: "Custom", icon: "Target", color: "#64748b" },
];
