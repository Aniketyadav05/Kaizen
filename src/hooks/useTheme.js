/**
 * FinPilot — Theme Hook
 * 
 * Manages light/dark/system theme preference.
 * - Reads user preference from Zustand store
 * - Detects system theme via matchMedia
 * - Applies .dark class to <html> element
 * - Syncs meta theme-color tag
 */

import { useEffect, useCallback } from "react";
import useSettingsStore from "../stores/useSettingsStore";

export function useTheme() {
  const theme = useSettingsStore((s) => s.settings.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const applyTheme = useCallback((resolvedTheme) => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Update meta theme-color
    const metaTags = document.querySelectorAll('meta[name="theme-color"]');
    metaTags.forEach((tag) => tag.remove());
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = resolvedTheme === "dark" ? "#0a0a0f" : "#ffffff";
    document.head.appendChild(meta);
  }, []);

  useEffect(() => {
    if (theme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mql.matches ? "dark" : "light");

      const handler = (e) => applyTheme(e.matches ? "dark" : "light");
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    } else {
      applyTheme(theme);
    }
  }, [theme, applyTheme]);

  const resolvedTheme = (() => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme;
  })();

  return { theme, setTheme, resolvedTheme };
}
