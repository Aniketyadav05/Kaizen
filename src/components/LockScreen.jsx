/**
 * FinPilot — Lock Screen (Apple HIG Style)
 * 
 * Clean, native-feeling passcode entry screen.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Delete, Fingerprint } from "lucide-react";
import useSettingsStore from "@/stores/useSettingsStore";
import { cn } from "@/lib/utils";

export default function LockScreen() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const settings = useSettingsStore((s) => s.settings);
  const unlock = useSettingsStore((s) => s.unlock);

  useEffect(() => {
    if (password.length === 4) {
      const hash = btoa(password);
      if (hash === settings.passwordHash) {
        unlock();
      } else {
        setError(true);
        setTimeout(() => {
          setPassword("");
          setError(false);
        }, 500);
      }
    }
  }, [password, settings.passwordHash, unlock]);

  const handleKeyPress = (num) => {
    if (password.length < 4 && !error) {
      setPassword(prev => prev + num);
    }
  };

  const handleDelete = () => {
    if (!error) {
      setPassword(prev => prev.slice(0, -1));
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[var(--color-background)] overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[var(--color-brand)]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-[var(--color-income)]/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm px-6 flex flex-col items-center"
      >
        <div className="h-16 w-16 bg-[var(--color-card)] shadow-lg rounded-[22px] flex items-center justify-center mb-8 ring-1 ring-[var(--color-border)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-brand)]/10 to-transparent"></div>
          <Shield className="h-8 w-8 text-[var(--color-brand)]" />
        </div>
        
        <h1 className="text-3xl font-bold font-['Clash_Grotesk'] mb-2">Welcome Back</h1>
        <p className="text-[15px] text-[var(--color-gray-1)] mb-10 font-medium tracking-wide">Enter passcode to unlock Kaizen</p>

        {/* Dots */}
        <motion.div 
          animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.3 }}
          className="flex justify-center gap-5 mb-14 h-4"
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < password.length;
            return (
              <motion.div
                key={index}
                initial={false}
                animate={{
                  scale: isFilled ? 1.1 : 1,
                  backgroundColor: isFilled 
                    ? error ? 'var(--color-expense)' : 'var(--color-brand)' 
                    : 'transparent',
                  borderColor: isFilled 
                    ? error ? 'var(--color-expense)' : 'var(--color-brand)' 
                    : 'var(--color-gray-3)'
                }}
                className={cn(
                  "w-[18px] h-[18px] rounded-full border-2 transition-all duration-300 shadow-sm"
                )}
              />
            );
          })}
        </motion.div>

        {/* Custom Numpad */}
        <div className="w-full grid grid-cols-3 gap-y-5 gap-x-6 max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="h-[72px] w-[72px] mx-auto rounded-full bg-[var(--color-gray-6)] hover:bg-[var(--color-gray-5)] active:bg-[var(--color-gray-4)] active:scale-95 text-[28px] font-semibold sf-rounded transition-all border border-[var(--color-border)] flex items-center justify-center shadow-sm"
            >
              {num}
            </button>
          ))}
          <div className="h-[72px] w-[72px] mx-auto flex items-center justify-center">
             <Fingerprint className="h-8 w-8 text-[var(--color-brand)]/40" />
          </div>
          <button
            onClick={() => handleKeyPress("0")}
            className="h-[72px] w-[72px] mx-auto rounded-full bg-[var(--color-gray-6)] hover:bg-[var(--color-gray-5)] active:bg-[var(--color-gray-4)] active:scale-95 text-[28px] font-semibold sf-rounded transition-all border border-[var(--color-border)] flex items-center justify-center shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-[72px] w-[72px] mx-auto rounded-full text-[var(--color-gray-1)] hover:text-[var(--color-foreground)] active:bg-[var(--color-gray-6)] active:scale-95 transition-all flex items-center justify-center"
          >
            <Delete className="h-8 w-8" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
