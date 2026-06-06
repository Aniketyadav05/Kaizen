/**
 * Kaizen — Account Store
 * 
 * Manages user accounts (Cash, Bank, CC, UPI).
 * Persisted to localStorage.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_ACCOUNTS } from "../lib/seedData";

const useAccountStore = create(persist((set, get) => ({
  accounts: DEFAULT_ACCOUNTS,

  // Future expansion: user can add/edit/delete accounts
  addAccount: (account) => {
    set((state) => ({ accounts: [...state.accounts, { ...account, id: `acc-${Date.now()}` }] }));
  },
  
  updateAccount: (id, updates) => {
    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  },

  deleteAccount: (id) => {
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
    }));
  },

  /**
   * Computes the balance of a specific account based on transaction history.
   * Income increases balance.
   * Expense decreases balance.
   * Transfer FROM decreases balance.
   * Transfer TO increases balance.
   * Credit Cards are typically negative balances (owed).
   */
  getAccountBalance: (accountId, transactions) => {
    const account = get().accounts.find(a => a.id === accountId || a.name === accountId);
    if (!account) return 0;

    let balance = 0;

    transactions.forEach(t => {
      // Handle legacy transactions that might use paymentMethod instead of account
      const tAccount = t.account || t.paymentMethod || t.payment_method;
      
      if (t.type === "income" && tAccount === account.name) {
        balance += Number(t.amount);
      } else if (t.type === "expense" && tAccount === account.name) {
        balance -= Number(t.amount);
      } else if (t.type === "transfer") {
        if (t.fromAccount === account.name) {
          balance -= Number(t.amount);
        }
        if (t.toAccount === account.name) {
          balance += Number(t.amount);
        }
      }
    });

    return balance;
  }
}), { name: "kaizen-accounts" }));

export default useAccountStore;
