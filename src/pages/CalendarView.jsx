/**
 * FinPilot — Calendar Heatmap View (Apple HIG Style)
 * 
 * Clean, edge-to-edge GitHub-style contribution heatmap.
 */

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import useTransactionStore from "@/stores/useTransactionStore";
import useCategoryStore from "@/stores/useCategoryStore";
import { calculateCalendarHeatmap } from "@/lib/calculations";
import { formatCurrency, cn } from "@/lib/utils";
import { getIcon } from "@/lib/iconMap";
import { format } from "date-fns";
import { useOutletContext } from "react-router-dom";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function CalendarView() {
  const transactions = useTransactionStore((s) => s.transactions);
  const categories = useCategoryStore((s) => s.categories);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const { openEditSheet } = useOutletContext();

  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);

  useEffect(() => {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    fetchTransactions(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
  }, [year, fetchTransactions]);

  const heatmapData = useMemo(() => {
    return calculateCalendarHeatmap(transactions, year);
  }, [transactions, year]);

  const selectedTransactions = useMemo(() => {
    if (!selectedDate) return [];
    return transactions
      .filter((t) => format(new Date(t.date), "yyyy-MM-dd") === selectedDate)
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, selectedDate]);

  const selectedTotal = selectedTransactions.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);

  const monthGroups = useMemo(() => {
    const groups = {};
    heatmapData.forEach((d) => {
      if (!groups[d.month]) groups[d.month] = [];
      groups[d.month].push(d);
    });
    return groups;
  }, [heatmapData]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-8">
      {/* iOS Header */}
      <div className="flex items-center justify-between">
        <h1 className="large-title m-0">Calendar</h1>
        <div className="flex items-center gap-1 bg-[var(--color-gray-5)] rounded-full px-2 py-1">
          <button onClick={() => setYear(year - 1)} className="p-1 active:opacity-50">
            <ChevronLeft className="h-4 w-4 text-[var(--color-brand)]" />
          </button>
          <span className="text-[13px] font-semibold min-w-[50px] text-center">{year}</span>
          <button onClick={() => setYear(year + 1)} className="p-1 active:opacity-50">
            <ChevronRight className="h-4 w-4 text-[var(--color-brand)]" />
          </button>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="ios-list p-4 overflow-x-auto scrollbar-none">
        <div className="min-w-[640px]">
          {/* Month labels */}
          <div className="flex mb-1">
            {MONTHS.map((m) => (
              <div key={m} className="text-[11px] text-[var(--color-gray-1)] font-medium text-center" style={{ width: `${100 / 12}%` }}>
                {m}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-12 gap-x-1.5">
            {MONTHS.map((_, monthIdx) => {
              const days = monthGroups[monthIdx] || [];
              return (
                <div key={monthIdx} className="space-y-1.5">
                  {days.map((d) => (
                    <button
                      key={d.date}
                      onClick={() => setSelectedDate(d.date === selectedDate ? null : d.date)}
                      className={cn(
                        "w-full aspect-square rounded-[4px] transition-all",
                        d.date === selectedDate && "ring-2 ring-[var(--color-brand)] ring-offset-1 ring-offset-[var(--color-card)]",
                        d.intensity === 0 ? "bg-[var(--color-gray-5)]" :
                        d.intensity === 1 ? "opacity-20 bg-[var(--color-brand)]" :
                        d.intensity === 2 ? "opacity-50 bg-[var(--color-brand)]" :
                        d.intensity === 3 ? "opacity-80 bg-[var(--color-brand)]" :
                        "bg-[var(--color-brand)]"
                      )}
                    />
                  ))}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 mt-4">
            <span className="text-[11px] text-[var(--color-gray-1)] mr-1">Less</span>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={cn(
                "w-3.5 h-3.5 rounded-[3px]",
                i === 0 ? "bg-[var(--color-gray-5)]" :
                i === 1 ? "opacity-20 bg-[var(--color-brand)]" :
                i === 2 ? "opacity-50 bg-[var(--color-brand)]" :
                i === 3 ? "opacity-80 bg-[var(--color-brand)]" :
                "bg-[var(--color-brand)]"
              )} />
            ))}
            <span className="text-[11px] text-[var(--color-gray-1)] ml-1">More</span>
          </div>
        </div>
      </div>

      {/* Selected Date Modal/Sheet styled list */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <h3 className="text-[13px] font-semibold text-[var(--color-gray-1)] uppercase tracking-wide mb-1.5 px-3">
              {format(new Date(selectedDate), "EEEE, dd MMM yyyy")}
            </h3>
            <div className="ios-list">
              {selectedTransactions.length > 0 ? (
                <>
                  {selectedTransactions.map((t) => {
                    const cat = categories.find((c) => c.name === t.category);
                    const Icon = getIcon(cat?.icon || "Circle");
                    const isIncome = t.type === "income";

                    return (
                      <button key={t.id} onClick={() => openEditSheet(t)} className="ios-list-item text-left w-full active:bg-[var(--color-gray-5)]">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: (cat?.color || "#64748b") + "20" }}>
                          <Icon className="h-5 w-5" style={{ color: cat?.color || "#64748b" }} />
                        </div>
                        <div className="flex-1 min-w-0 px-1">
                          <p className="text-[17px] font-medium truncate">{t.description || t.category}</p>
                          <p className="text-[13px] text-[var(--color-gray-1)]">{t.paymentMethod || t.account}</p>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-[17px] font-semibold", isIncome ? "text-[var(--color-income)]" : "text-[var(--color-foreground)]")}>
                            {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                  <div className="flex items-center justify-between p-3 border-t border-[var(--color-border)] bg-[var(--color-gray-5)]/50">
                    <span className="text-[15px] font-medium text-[var(--color-gray-1)]">Net Total</span>
                    <span className={cn("text-[17px] font-bold", selectedTotal >= 0 ? "text-[var(--color-income)]" : "text-[var(--color-foreground)]")}>
                      {formatCurrency(Math.abs(selectedTotal))}
                    </span>
                  </div>
                </>
              ) : (
                <div className="p-4 text-center text-[15px] text-[var(--color-gray-1)]">
                  No transactions on this day
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
