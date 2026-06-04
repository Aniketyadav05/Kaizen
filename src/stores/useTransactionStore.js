import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../lib/api";
import useSummaryStore from "./useSummaryStore";

const useTransactionStore = create(persist((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,

  fetchTransactions: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      let query = "";
      if (startDate && endDate) {
        query = `?startDate=${startDate}&endDate=${endDate}`;
      } else if (!startDate && !endDate) {
        const d = new Date();
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const prevM = m === 1 ? 12 : m - 1;
        const prevY = m === 1 ? y - 1 : y;
        query = `?startDate=${prevY}-${String(prevM).padStart(2, '0')}-01`;
      }

      const [txRes, incRes] = await Promise.all([
        api.get(`/transactions${query}`),
        api.get(`/income${query}`)
      ]);
      
      const fetched = [...txRes.data, ...incRes.data]
        .map(t => ({...t, amount: Number(t.amount)}))
        .map(t => ({...t, type: t.type || (t.source ? 'income' : 'expense')}));
        
      set(state => {
        const existingMap = new Map(state.transactions.map(t => [t.id, t]));
        for (const t of fetched) {
          existingMap.set(t.id, t);
        }
        const combined = Array.from(existingMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
        return { transactions: combined, isLoading: false };
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  addTransaction: async (transaction) => {
    const isIncome = transaction.type === "income";
    const endpoint = isIncome ? "/income" : "/transactions";
    
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newTransaction = { 
      ...transaction, 
      id: tempId, 
      date: transaction.date || new Date().toISOString().split("T")[0],
      amount: Number(transaction.amount)
    };
    
    set((state) => ({ transactions: [newTransaction, ...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)) }));
    
    try {
      const payload = isIncome 
        ? { date: newTransaction.date, source: transaction.category, amount: newTransaction.amount, notes: transaction.notes || "", type: "income" }
        : { date: newTransaction.date, description: transaction.description || "", category: transaction.category, amount: newTransaction.amount, payment_method: transaction.paymentMethod || "Cash", type: "expense", notes: transaction.notes || "" };

      const { data } = await api.post(endpoint, payload);
      set((state) => ({
        transactions: state.transactions.map((t) => (t.id === tempId ? { ...data, amount: Number(data.amount), type: isIncome ? 'income' : 'expense', category: isIncome ? data.source : data.category } : t)),
      }));
      useSummaryStore.getState().fetchSummariesAndMetadata();
    } catch (error) {
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== tempId),
        error: error.message,
      }));
    }
  },

  updateTransaction: async (id, updates) => {
    const original = get().transactions.find((t) => t.id === id);
    if (!original) return;
    
    const isIncome = original.type === "income";
    const endpoint = isIncome ? `/income/${id}` : `/transactions/${id}`;

    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    try {
      await api.put(endpoint, updates);
      useSummaryStore.getState().fetchSummariesAndMetadata();
    } catch (error) {
      set((state) => ({
        transactions: state.transactions.map((t) => (t.id === id ? original : t)),
        error: error.message,
      }));
    }
  },

  deleteTransaction: async (id) => {
    const original = get().transactions.find((t) => t.id === id);
    if (!original) return;
    
    const isIncome = original.type === "income";
    const endpoint = isIncome ? `/income/${id}` : `/transactions/${id}`;

    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
    try {
      await api.delete(endpoint);
      useSummaryStore.getState().fetchSummariesAndMetadata();
    } catch (error) {
      set((state) => ({
        transactions: [...state.transactions, original].sort((a, b) => new Date(b.date) - new Date(a.date)),
        error: error.message,
      }));
    }
  },
}), { name: "finpilot-transactions" }));

export default useTransactionStore;
