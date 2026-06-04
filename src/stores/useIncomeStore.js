import { create } from "zustand";
import api from "../lib/api";

const useIncomeStore = create((set, get) => ({
  incomes: [],
  isLoading: false,

  fetchIncomes: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get("/income");
      set({ incomes: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  addIncome: async (income) => {
    const tempId = `temp-${Date.now()}`;
    const newIncome = { ...income, id: tempId, date: income.date || new Date().toISOString().split("T")[0] };
    set((state) => ({ incomes: [newIncome, ...state.incomes] }));
    try {
      const { data } = await api.post("/income", income);
      set((state) => ({
        incomes: state.incomes.map((i) => (i.id === tempId ? data : i)),
      }));
    } catch (error) {
      set((state) => ({ incomes: state.incomes.filter((i) => i.id !== tempId) }));
    }
  },

  deleteIncome: async (id) => {
    const original = get().incomes.find((i) => i.id === id);
    set((state) => ({ incomes: state.incomes.filter((i) => i.id !== id) }));
    try {
      await api.delete(`/income/${id}`);
    } catch (error) {
      if (original) set((state) => ({ incomes: [...state.incomes, original] }));
    }
  },
}));

export default useIncomeStore;
