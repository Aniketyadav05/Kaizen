import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_SETTINGS } from "../lib/seedData";

const useSettingsStore = create(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      updateSettings: (updates) => {
        set((state) => ({ settings: { ...state.settings, ...updates } }));
      },

      setTheme: (theme) => {
        set((state) => ({ settings: { ...state.settings, theme } }));
      },

      setPasswordEnabled: (enabled, passwordHash = null) => {
        set((state) => ({
          settings: {
            ...state.settings,
            passwordEnabled: enabled,
            passwordHash: enabled ? passwordHash : null,
            isLocked: enabled,
          },
        }));
      },

      unlock: () => {
        set((state) => ({ settings: { ...state.settings, isLocked: false } }));
      },

      lock: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            isLocked: state.settings.passwordEnabled,
          },
        }));
      },
    }),
    { name: "finpilot-settings" }
  )
);

export default useSettingsStore;
