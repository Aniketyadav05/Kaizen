/**
 * Kaizen — SIP (Systematic Investment Plan) Store
 * 
 * Manages SIP tracking: add, update, delete, mark paid, due/overdue checks.
 * Data persisted to localStorage via Zustand persist middleware.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { addMonths, addQuarters, format, startOfDay, isBefore, isEqual, isToday } from "date-fns";

function calculateNextDueDate(lastPaidDate, frequency, dayOfMonth) {
  const base = lastPaidDate ? new Date(lastPaidDate) : new Date();
  let next;
  
  if (frequency === "quarterly") {
    next = addQuarters(base, 1);
  } else {
    next = addMonths(base, 1);
  }
  
  // Set to the specific day of month
  const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  const day = Math.min(dayOfMonth, maxDay);
  next.setDate(day);
  
  return format(startOfDay(next), "yyyy-MM-dd");
}

const useSIPStore = create(persist((set, get) => ({
  sips: [],

  addSIP: (sip) => {
    const id = `sip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nextDueDate = calculateNextDueDate(null, sip.frequency, sip.dayOfMonth);
    
    const newSIP = {
      id,
      name: sip.name,
      amount: Number(sip.amount),
      frequency: sip.frequency || "monthly",
      dayOfMonth: sip.dayOfMonth || 1,
      fundName: sip.fundName || "",
      category: sip.category || "Investments & SIP",
      isActive: true,
      lastPaidDate: null,
      nextDueDate,
      notes: sip.notes || "",
      createdAt: new Date().toISOString(),
    };
    
    set((state) => ({ sips: [...state.sips, newSIP] }));
  },

  updateSIP: (id, updates) => {
    set((state) => ({
      sips: state.sips.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, ...updates };
        // Recalculate next due if frequency or day changed
        if (updates.frequency || updates.dayOfMonth) {
          updated.nextDueDate = calculateNextDueDate(
            s.lastPaidDate,
            updates.frequency || s.frequency,
            updates.dayOfMonth || s.dayOfMonth
          );
        }
        return updated;
      }),
    }));
  },

  deleteSIP: (id) => {
    set((state) => ({ sips: state.sips.filter((s) => s.id !== id) }));
  },

  toggleSIP: (id) => {
    set((state) => ({
      sips: state.sips.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)),
    }));
  },

  markSIPPaid: (id) => {
    set((state) => ({
      sips: state.sips.map((s) => {
        if (s.id !== id) return s;
        const today = format(new Date(), "yyyy-MM-dd");
        const nextDueDate = calculateNextDueDate(today, s.frequency, s.dayOfMonth);
        return { ...s, lastPaidDate: today, nextDueDate };
      }),
    }));
  },

  getDueSIPs: () => {
    const today = startOfDay(new Date());
    return get().sips.filter((s) => {
      if (!s.isActive) return false;
      const due = startOfDay(new Date(s.nextDueDate));
      return isEqual(due, today);
    });
  },

  getOverdueSIPs: () => {
    const today = startOfDay(new Date());
    return get().sips.filter((s) => {
      if (!s.isActive) return false;
      const due = startOfDay(new Date(s.nextDueDate));
      return isBefore(due, today);
    });
  },

  getUpcomingSIPs: () => {
    const today = startOfDay(new Date());
    return get().sips
      .filter((s) => s.isActive && !isBefore(startOfDay(new Date(s.nextDueDate)), today))
      .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate));
  },

  getMonthlyTotal: () => {
    return get().sips
      .filter((s) => s.isActive)
      .reduce((sum, s) => {
        if (s.frequency === "quarterly") return sum + (s.amount / 3);
        return sum + s.amount;
      }, 0);
  },
}), { name: "kaizen-sips" }));

export default useSIPStore;
