/**
 * FinPilot — Default Categories, Accounts & Initial Config
 * 
 * Strict category-to-type defaults to enforce 50/30/20 methodology.
 */

export const DEFAULT_CATEGORIES = [
  // Needs
  { id: "cat-1", name: "Life Infrastructure", icon: "Home", color: "#3b82f6", type: "Need" },
  { id: "cat-2", name: "Groceries", icon: "ShoppingCart", color: "#34C759", type: "Need" },
  { id: "cat-3", name: "Rent & Housing", icon: "Building", color: "#2563eb", type: "Need" },
  { id: "cat-4", name: "Electricity & Utilities", icon: "Zap", color: "#eab308", type: "Need" },
  { id: "cat-5", name: "Mobile & Internet", icon: "Smartphone", color: "#0ea5e9", type: "Need" },
  { id: "cat-6", name: "Fuel & Transport", icon: "Car", color: "#6366f1", type: "Need" },
  { id: "cat-7", name: "Insurance", icon: "Shield", color: "#14b8a6", type: "Need" },
  { id: "cat-8", name: "Education", icon: "GraduationCap", color: "#8b5cf6", type: "Need" },
  
  // Wants
  { id: "cat-9", name: "Eating Out", icon: "UtensilsCrossed", color: "#f97316", type: "Want" },
  { id: "cat-10", name: "Shopping", icon: "ShoppingBag", color: "#a855f7", type: "Want" },
  { id: "cat-11", name: "Entertainment", icon: "Gamepad2", color: "#e11d48", type: "Want" },
  { id: "cat-12", name: "Movies", icon: "Film", color: "#ec4899", type: "Want" },
  { id: "cat-13", name: "Subscriptions", icon: "Repeat", color: "#7c3aed", type: "Want" },
  { id: "cat-14", name: "Travel & Vacations", icon: "Plane", color: "#f43f5e", type: "Want" },
  { id: "cat-15", name: "Gifts", icon: "Gift", color: "#e879f9", type: "Want" },
  { id: "cat-16", name: "Grooming & Care", icon: "Scissors", color: "#f472b6", type: "Want" },
  
  // Savings
  { id: "cat-17", name: "SIP", icon: "TrendingUp", color: "#059669", type: "Saving" },
  { id: "cat-18", name: "Mutual Funds", icon: "PieChart", color: "#10b981", type: "Saving" },
  { id: "cat-19", name: "Stocks", icon: "BarChart3", color: "#059669", type: "Saving" },
  { id: "cat-20", name: "Emergency Fund", icon: "ShieldCheck", color: "#34C759", type: "Saving" },
  { id: "cat-21", name: "FD & PPF", icon: "PiggyBank", color: "#10b981", type: "Saving" },
];

export const DEFAULT_ACCOUNTS = [
  { id: "acc-1", name: "Cash Wallet", icon: "Banknote", type: "cash" },
  { id: "acc-2", name: "Primary Bank Account", icon: "Building2", type: "bank" },
  { id: "acc-3", name: "Secondary Bank Account", icon: "Building2", type: "bank" },
  { id: "acc-4", name: "Credit Card", icon: "CreditCard", type: "credit" },
  { id: "acc-5", name: "UPI Wallet", icon: "Smartphone", type: "wallet" },
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
  needsPercent: 50,
  wantsPercent: 30,
  savingsPercent: 20,
};

export const DEFAULT_SETTINGS = {
  theme: "system",
  currency: "₹",
  passwordEnabled: false,
  passwordHash: null,
  isLocked: false,
  notificationsEnabled: false,
};

export const SIP_FREQUENCIES = [
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
];

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
