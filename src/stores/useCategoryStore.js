import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../lib/api";
import { DEFAULT_CATEGORIES } from "../lib/seedData";

const useCategoryStore = create(persist((set, get) => ({
  categories: DEFAULT_CATEGORIES,

  fetchCategories: async () => {
    try {
      const { data } = await api.get("/categories");
      if (data && data.length > 0) {
        set({ categories: data });
      }
    } catch (error) {}
  },

  addCategory: async (category) => {
    const tempId = `temp-${Date.now()}`;
    const newCategory = { ...category, id: tempId };
    set((state) => ({ categories: [...state.categories, newCategory] }));
    try {
      const { data } = await api.post("/categories", category);
      set((state) => ({
        categories: state.categories.map((c) => (c.id === tempId ? data : c)),
      }));
    } catch (error) {
      set((state) => ({ categories: state.categories.filter((c) => c.id !== tempId) }));
    }
  },

  deleteCategory: async (id) => {
    const original = get().categories.find((c) => c.id === id);
    set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
    try {
      await api.delete(`/categories/${id}`);
    } catch (error) {
      if (original) set((state) => ({ categories: [...state.categories, original] }));
    }
  },
}), { name: "finpilot-categories" }));

export default useCategoryStore;
