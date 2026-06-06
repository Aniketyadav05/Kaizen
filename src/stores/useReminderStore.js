/**
 * Kaizen — Reminder & Notification Store
 * 
 * Manages browser notifications for SIP reminders and credit card bill alerts.
 * Uses the Notification API for real browser notification banners.
 * Checks for due items on app open and periodically while running.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { format, startOfMonth, endOfMonth } from "date-fns";

const useReminderStore = create(persist((set, get) => ({
  notificationPermission: "default", // "default" | "granted" | "denied"
  lastNotificationCheck: null,
  dismissedReminders: [], // Array of { id, date } — reminders dismissed for today

  requestNotificationPermission: async () => {
    if (!("Notification" in window)) {
      set({ notificationPermission: "denied" });
      return "denied";
    }
    
    const permission = await Notification.requestPermission();
    set({ notificationPermission: permission });
    return permission;
  },

  checkPermissionStatus: () => {
    if (!("Notification" in window)) {
      set({ notificationPermission: "denied" });
      return;
    }
    set({ notificationPermission: Notification.permission });
  },

  /**
   * Fire browser notifications for due SIPs and credit card bills.
   * Called on app mount and periodically.
   */
  checkAndNotify: (sipStore, transactions) => {
    const { notificationPermission, dismissedReminders } = get();
    if (notificationPermission !== "granted") return;
    
    const today = format(new Date(), "yyyy-MM-dd");
    
    // Clean up old dismissed reminders (not from today)
    const todayDismissed = dismissedReminders.filter((r) => r.date === today);
    if (todayDismissed.length !== dismissedReminders.length) {
      set({ dismissedReminders: todayDismissed });
    }
    
    const dismissedIds = new Set(todayDismissed.map((r) => r.id));

    // Check due SIPs
    const dueSIPs = sipStore.getDueSIPs();
    const overdueSIPs = sipStore.getOverdueSIPs();
    
    [...overdueSIPs, ...dueSIPs].forEach((sip) => {
      const reminderId = `sip-${sip.id}-${today}`;
      if (dismissedIds.has(reminderId)) return;
      
      const isOverdue = overdueSIPs.some((s) => s.id === sip.id);
      
      new Notification(isOverdue ? "⚠️ Overdue SIP" : "💰 SIP Due Today", {
        body: `${sip.name} — ₹${sip.amount.toLocaleString("en-IN")}`,
        icon: "/favicon.svg",
        tag: reminderId, // Prevents duplicate notifications
        requireInteraction: true,
      });
    });

    // Check credit card bill (last 5 days of month)
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    
    if (dayOfMonth >= daysInMonth - 4) {
      const ccBill = getCreditCardBillFromTransactions(transactions, now.getMonth(), now.getFullYear());
      if (ccBill > 0) {
        const ccReminderId = `cc-bill-${format(now, "yyyy-MM")}`;
        if (!dismissedIds.has(ccReminderId)) {
          new Notification("💳 Credit Card Bill Reminder", {
            body: `Your credit card bill for ${format(now, "MMM yyyy")} is ₹${ccBill.toLocaleString("en-IN")}`,
            icon: "/favicon.svg",
            tag: ccReminderId,
            requireInteraction: true,
          });
        }
      }
    }

    set({ lastNotificationCheck: new Date().toISOString() });
  },

  dismissReminder: (reminderId) => {
    const today = format(new Date(), "yyyy-MM-dd");
    set((state) => ({
      dismissedReminders: [...state.dismissedReminders, { id: reminderId, date: today }],
    }));
  },
}), { name: "kaizen-reminders" }));

/**
 * Calculate total credit card spending for a given month.
 * This is a pure function, not a store action.
 */
export function getCreditCardBillFromTransactions(transactions, month, year) {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  
  return transactions
    .filter((t) => {
      if (t.type === "income") return false;
      const d = new Date(t.date);
      return d >= start && d <= end && (t.paymentMethod === "Credit Card" || t.payment_method === "Credit Card");
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);
}

export default useReminderStore;
