/**
 * FinPilot — Zod Validation Schemas
 * 
 * All data types validated with Zod.
 * Used by React Hook Form via @hookform/resolvers/zod.
 */

import { z } from "zod";

export const transactionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required").max(200),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  budgetType: z.enum(["Need", "Want", "Saving"]),
  type: z.enum(["expense", "income"]).default("expense"),
  notes: z.string().max(500).optional().default(""),
});

export const incomeSchema = z.object({
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required").max(200),
  source: z.string().min(1, "Income source is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  notes: z.string().max(500).optional().default(""),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  icon: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color"),
  type: z.enum(["Need", "Want", "Saving"]),
});

export const goalSchema = z.object({
  name: z.string().min(1, "Goal name is required").max(100),
  type: z.string().min(1),
  targetAmount: z.coerce.number().positive("Target must be positive"),
  currentAmount: z.coerce.number().min(0).default(0),
  deadline: z.string().optional(),
  icon: z.string().optional().default("Target"),
  color: z.string().optional().default("#64748b"),
});

export const budgetConfigSchema = z.object({
  salary: z.coerce.number().min(0, "Salary must be 0 or more"),
  needsPercent: z.coerce.number().min(0).max(100),
  wantsPercent: z.coerce.number().min(0).max(100),
  savingsPercent: z.coerce.number().min(0).max(100),
  weeklyLimit: z.coerce.number().min(0),
  yearlyGrowthRate: z.coerce.number().min(0).max(100),
}).refine(
  (data) => data.needsPercent + data.wantsPercent + data.savingsPercent === 100,
  { message: "Budget percentages must add up to 100%", path: ["needsPercent"] }
);

export const passwordSchema = z.object({
  password: z.string().min(4, "Password must be at least 4 characters").max(32),
  confirmPassword: z.string().min(4),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const unlockSchema = z.object({
  password: z.string().min(1, "Enter your password"),
});
