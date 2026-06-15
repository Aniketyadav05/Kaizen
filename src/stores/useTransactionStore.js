import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../lib/api";
import useSummaryStore from "./useSummaryStore";
import useCategoryStore from "./useCategoryStore";
import { DEFAULT_CATEGORIES } from "../lib/seedData";

const LEGACY_CATEGORY_TYPES = {
  "Food": "Want",
  "Rent": "Need",
  "Shopping": "Want",
  "Travel": "Want",
  "Entertainment": "Want",
  "Utilities": "Need",
  "Healthcare": "Need",
  "Insurance": "Need",
  "Education": "Need",
  "Investment": "Saving"
};

/**
 * Derive budgetType from category name using the category store.
 * Falls back to DEFAULT_CATEGORIES if store is empty.
 */
function deriveBudgetType(categoryName) {
  const storeCategories = useCategoryStore.getState().categories;
  const cats = storeCategories.length > 0 ? storeCategories : DEFAULT_CATEGORIES;
  const cat = cats.find((c) => c.name === categoryName);
  if (cat) return cat.type;
  if (LEGACY_CATEGORY_TYPES[categoryName]) return LEGACY_CATEGORY_TYPES[categoryName];
  return "Want";
}

const useTransactionStore = create(persist((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  
  // Smart Defaults
  lastUsedAccount: null,
  lastUsedCategory: null,

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
        .map(t => ({...t, type: t.type || (t.source ? 'income' : 'expense')}))
        // Ensure budgetType is set for legacy expenses
        .map(t => {
          if (t.type === 'expense') {
             return { ...t, budgetType: t.budgetType || deriveBudgetType(t.category) };
          }
          return t;
        });
        
      set(state => {
        const existingMap = new Map(state.transactions.map(t => [t.id, t]));
        for (const t of fetched) {
          existingMap.set(t.id, t);
        }
        const combined = Array.from(existingMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
        return { transactions: combined, isLoading: false };
      });
    } catch (error) {
      // In local mode, just continue with existing
      set({ isLoading: false });
    }
  },

  addTransaction: async (transaction) => {
    const isIncome = transaction.type === "income";
    const isTransfer = transaction.type === "transfer";
    const endpoint = isIncome ? "/income" : "/transactions"; // Backend doesn't formally support transfers yet, we will mock it
    
    // Explicit budget type is now provided by the form, but fallback just in case
    let budgetType = undefined;
    if (transaction.type === "expense") {
       budgetType = transaction.budgetType || deriveBudgetType(transaction.category);
    }
    
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newTransaction = { 
      ...transaction, 
      id: tempId, 
      date: transaction.date || new Date().toISOString().split("T")[0],
      amount: Number(transaction.amount),
      budgetType,
    };
    
    set((state) => ({ 
      transactions: [newTransaction, ...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)),
      lastUsedAccount: isTransfer ? transaction.fromAccount : transaction.account,
      lastUsedCategory: isIncome ? null : (isTransfer ? null : transaction.category),
    }));
    
    try {
      let payload;
      if (isIncome) {
        payload = { date: newTransaction.date, source: transaction.source, amount: newTransaction.amount, notes: transaction.notes || "", type: "income", payment_method: transaction.account };
      } else if (isTransfer) {
        // Mock API call for transfer since backend doesn't support it yet
        // We will just resolve immediately for local persistence
        return; 
      } else {
        payload = { date: newTransaction.date, description: transaction.description || "", category: transaction.category, amount: newTransaction.amount, payment_method: transaction.account, type: "expense", notes: transaction.notes || "", budgetType };
      }

      if (!isTransfer) {
        const { data } = await api.post(endpoint, payload);
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === tempId ? { ...t, ...data, id: data.id } : t)),
        }));
        useSummaryStore.getState().fetchSummariesAndMetadata();
      }
    } catch (error) {
      // Keep it in local state even if API fails (offline mode)
    }
  },

  updateTransaction: async (id, updates) => {
    const original = get().transactions.find((t) => t.id === id);
    if (!original) return;
    
    const normalizedUpdates = { ...updates, amount: Number(updates.amount) };
    if (normalizedUpdates.account) {
      normalizedUpdates.payment_method = normalizedUpdates.account;
    }

    const isIncome = original.type === "income";
    const isTransfer = original.type === "transfer";
    const endpoint = isIncome ? `/income/${id}` : `/transactions/${id}`;

    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...normalizedUpdates } : t)),
    }));
    
    if (isTransfer) return;

    try {
      let payload;
      if (isIncome) {
        payload = { 
          date: normalizedUpdates.date, 
          source: normalizedUpdates.source || original.source, 
          amount: normalizedUpdates.amount, 
          notes: normalizedUpdates.notes || "", 
          type: "income", 
          payment_method: normalizedUpdates.account || original.payment_method || original.paymentMethod 
        };
      } else {
        payload = { 
          date: normalizedUpdates.date, 
          description: normalizedUpdates.description || original.description, 
          category: normalizedUpdates.category || original.category, 
          amount: normalizedUpdates.amount, 
          payment_method: normalizedUpdates.account || original.payment_method || original.paymentMethod, 
          type: "expense", 
          notes: normalizedUpdates.notes || "", 
          budgetType: normalizedUpdates.budgetType || original.budgetType 
        };
      }
      await api.put(endpoint, payload);
      useSummaryStore.getState().fetchSummariesAndMetadata();
    } catch (error) {
      // Ignore API errors for local persistence
    }
  },

  deleteTransaction: async (id) => {
    const original = get().transactions.find((t) => t.id === id);
    if (!original) return;
    
    const isIncome = original.type === "income";
    const isTransfer = original.type === "transfer";
    const endpoint = isIncome ? `/income/${id}` : `/transactions/${id}`;

    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
    
    if (isTransfer) return;

    try {
      await api.delete(endpoint);
      useSummaryStore.getState().fetchSummariesAndMetadata();
    } catch (error) {
      // Ignore API errors for local persistence
    }
  },

  duplicateTransaction: async (id) => {
    const original = get().transactions.find((t) => t.id === id);
    if (!original) return;

    const { id: _id, ...rest } = original;
    const duplicate = {
      ...rest,
      date: new Date().toISOString().split("T")[0],
      description: rest.description ? `${rest.description} (copy)` : "",
    };
    
    get().addTransaction(duplicate);
  },
}), { name: "finpilot-transactions" }));

export default useTransactionStore;
