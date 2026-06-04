/**
 * FinPilot — Lock Screen (Apple HIG Style)
 * 
 * Clean, native-feeling passcode entry screen.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import useSettingsStore from "@/stores/useSettingsStore";

export default function LockScreen() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const settings = useSettingsStore((s) => s.settings);
  const unlock = useSettingsStore((s) => s.unlock);

  const handleUnlock = (e) => {
    e.preventDefault();
    const hash = btoa(password);
    if (hash === settings.passwordHash) {
      unlock();
    } else {
      setError(true);
      setPassword("");
      setTimeout(() => setError(false), 800);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[var(--color-background)] px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xs text-center"
      >
        <Lock className="h-10 w-10 text-[var(--color-brand)] mx-auto mb-4 opacity-80" />
        <h1 className="text-2xl font-bold mb-2">Enter Passcode</h1>
        <p className="text-[15px] text-[var(--color-gray-1)] mb-8">Kaizen is locked</p>

        <form onSubmit={handleUnlock}>
          <motion.div 
            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex justify-center mb-8"
          >
            <input
              type="password"
              placeholder="••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className="w-40 text-center text-3xl tracking-[1em] bg-transparent outline-none border-b-2 border-[var(--color-gray-3)] focus:border-[var(--color-brand)] transition-colors py-2"
              autoFocus
            />
          </motion.div>

          <button
            type="submit"
            className="w-full bg-[var(--color-brand)] text-white text-[17px] font-semibold py-3.5 rounded-2xl active:opacity-80 transition-opacity"
          >
            Unlock
          </button>
        </form>
      </motion.div>
    </div>
  );
}
