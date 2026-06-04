import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../lib/api";

const useSummaryStore = create(persist((set, get) => ({
  summaries: [],
  metadata: [],
  isLoading: false,
  error: null,

  fetchSummariesAndMetadata: async () => {
    set({ isLoading: true, error: null });
    try {
      const [sumRes, metaRes] = await Promise.all([
        api.get("/summaries"),
        api.get("/metadata")
      ]);
      set({ summaries: sumRes.data, metadata: metaRes.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  }
}), { name: "kaizen-summaries" }));

export default useSummaryStore;
