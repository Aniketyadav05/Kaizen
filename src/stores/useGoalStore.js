import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../lib/api";

const useGoalStore = create(persist((set, get) => ({
  goals: [],

  fetchGoals: async () => {
    try {
      const { data } = await api.get("/goals");
      const formatted = data.map(g => ({
        id: g.id,
        name: g.goal_name,
        targetAmount: Number(g.target_amount),
        currentAmount: Number(g.current_amount),
        deadline: g.target_date,
        icon: "Target", // Defaulting for now
        color: "#007AFF"
      }));
      set({ goals: formatted });
    } catch (error) {}
  },

  addGoal: async (goal) => {
    const tempId = `temp-${Date.now()}`;
    const newGoal = { ...goal, id: tempId };
    set((state) => ({ goals: [...state.goals, newGoal] }));
    try {
      const { data } = await api.post("/goals", {
        goal_name: goal.name,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount || 0,
        target_date: goal.deadline
      });
      set((state) => ({
        goals: state.goals.map((g) => (g.id === tempId ? { ...g, id: data.id } : g)),
      }));
    } catch (error) {
      set((state) => ({ goals: state.goals.filter((g) => g.id !== tempId) }));
    }
  },

  updateGoal: async (id, updates) => {
    const original = get().goals.find((g) => g.id === id);
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
    try {
      const payload = {};
      if (updates.name) payload.goal_name = updates.name;
      if (updates.targetAmount !== undefined) payload.target_amount = updates.targetAmount;
      if (updates.currentAmount !== undefined) payload.current_amount = updates.currentAmount;
      if (updates.deadline) payload.target_date = updates.deadline;
      await api.put(`/goals/${id}`, payload);
    } catch (error) {
      if (original) {
        set((state) => ({ goals: state.goals.map((g) => (g.id === id ? original : g)) }));
      }
    }
  },

  deleteGoal: async (id) => {
    const original = get().goals.find((g) => g.id === id);
    set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }));
    try {
      await api.delete(`/goals/${id}`);
    } catch (error) {
      if (original) set((state) => ({ goals: [...state.goals, original] }));
    }
  },

  contributeToGoal: async (id, amount) => {
    const goal = get().goals.find((g) => g.id === id);
    if (!goal) return;
    const newAmount = goal.currentAmount + amount;
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, currentAmount: newAmount } : g)),
    }));
    try {
      await api.put(`/goals/${id}`, { current_amount: newAmount });
    } catch (error) {
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? { ...g, currentAmount: goal.currentAmount } : g)),
      }));
    }
  },
}), { name: "finpilot-goals" }));

export default useGoalStore;
