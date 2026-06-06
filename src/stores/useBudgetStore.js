import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../lib/api";
import { DEFAULT_BUDGET_CONFIG } from "../lib/seedData";

const useBudgetStore = create(persist((set) => ({
  budgetConfig: DEFAULT_BUDGET_CONFIG,

  fetchBudget: async () => {
    try {
      const { data } = await api.get("/budget");
      if (data && data.length > 0) {
        // Assuming first row is current config
        const b = data[data.length - 1];
        set({
          budgetConfig: {
            ...DEFAULT_BUDGET_CONFIG,
            needsPercent: Number(b.needs_budget) || DEFAULT_BUDGET_CONFIG.needsPercent,
            wantsPercent: Number(b.wants_budget) || DEFAULT_BUDGET_CONFIG.wantsPercent,
            savingsPercent: Number(b.savings_budget) || DEFAULT_BUDGET_CONFIG.savingsPercent,
          },
        });
      }
    } catch (error) {}
  },

  updateBudgetConfig: async (updates) => {
    set((state) => ({ budgetConfig: { ...state.budgetConfig, ...updates } }));
    try {
      // In a real app we'd map this properly or send it as a new config row
      await api.post("/budget", {
        month: new Date().toISOString().slice(0, 7),
        needs_budget: updates.needsPercent,
        wants_budget: updates.wantsPercent,
        savings_budget: updates.savingsPercent,
      });
    } catch (error) {}
  },
}), { name: "finpilot-budgets" }));

export default useBudgetStore;
