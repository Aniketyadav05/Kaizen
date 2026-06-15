import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../lib/api";
import { DEFAULT_SETTINGS } from "../lib/seedData";

const useSettingsStore = create(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      fetchSettings: async () => {
        try {
          const { data } = await api.get("/settings");
          if (data && Object.keys(data).length > 0) {
            // Convert string booleans back to actual booleans if needed
            const parsedData = { ...data };
            if (parsedData.passwordEnabled === 'true') parsedData.passwordEnabled = true;
            if (parsedData.passwordEnabled === 'false') parsedData.passwordEnabled = false;
            
            set((state) => ({
              settings: {
                ...state.settings,
                ...parsedData,
                // Only force lock if it was already locked or if password wasn't previously enabled
                isLocked: state.settings.isLocked || (!state.settings.passwordEnabled && (parsedData.passwordEnabled === true || parsedData.passwordEnabled === 'true')),
              }
            }));
          }
        } catch (error) {
          console.error("Failed to fetch settings", error);
        }
      },

      updateSettings: async (updates) => {
        set((state) => ({ settings: { ...state.settings, ...updates } }));
        try {
          await api.post("/settings", updates);
        } catch (error) {
          console.error("Failed to sync settings", error);
        }
      },

      setTheme: async (theme) => {
        set((state) => ({ settings: { ...state.settings, theme } }));
        try {
          await api.post("/settings", { theme });
        } catch (error) {
          console.error("Failed to sync theme", error);
        }
      },

      setPasswordEnabled: async (enabled, passwordHash = null) => {
        const updates = {
          passwordEnabled: enabled,
          passwordHash: enabled ? passwordHash : null,
        };
        set((state) => ({
          settings: {
            ...state.settings,
            ...updates,
            isLocked: enabled,
          },
        }));
        try {
          await api.post("/settings", updates);
        } catch (error) {
          console.error("Failed to sync password settings", error);
        }
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
    { 
      name: "finpilot-settings",
      merge: (persistedState, currentState) => {
        const mergedSettings = {
          ...currentState.settings,
          ...(persistedState?.settings || {})
        };
        // Force the app to be locked on reload if a password is set
        mergedSettings.isLocked = mergedSettings.passwordEnabled === true || mergedSettings.passwordEnabled === 'true';
        
        return {
          ...currentState,
          settings: mergedSettings
        };
      }
    }
  )
);

export default useSettingsStore;
