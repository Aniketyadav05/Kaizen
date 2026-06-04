/**
 * FinPilot — Transactions Page (Apple HIG Style)
 * 
 * - iOS Large Title Navigation
 * - iOS Search Bar style
 * - iOS Grouped List layout for transactions
 * - Clean date section headers
 */

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, Pencil, Copy, X, Plus } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import useTransactionStore from "@/stores/useTransactionStore";
import useCategoryStore from "@/stores/useCategoryStore";
import { formatCurrency, formatDate, groupTransactionsByDate, cn } from "@/lib/utils";
import { getIcon } from "@/lib/iconMap";
import { Input } from "@/components/ui/input";
import AddTransactionSheet from "@/components/transactions/AddTransactionSheet";

const FILTER_TYPES = ["All", "Need", "Want", "Saving", "Income"];

export default function Transactions() {
  const { openAddSheet } = useOutletContext();
  const transactions = useTransactionStore((s) => s.transactions);
  const categories = useCategoryStore((s) => s.categories);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const duplicateTransaction = useTransactionStore((s) => s.duplicateTransaction);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);

  useEffect(() => {
    const d = new Date();
    fetchTransactions(`${d.getFullYear()}-01-01`, `${d.getFullYear()}-12-31`);
  }, [fetchTransactions]);

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (activeFilter !== "All") {
      if (activeFilter === "Income") {
        result = result.filter((t) => t.type === "income");
      } else {
        result = result.filter((t) => t.budgetType === activeFilter && t.type !== "income");
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.description?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [transactions, search, activeFilter]);

  const grouped = useMemo(() => groupTransactionsByDate(filtered), [filtered]);

  const handleEdit = (t) => {
    setEditingTransaction(t);
    setShowEditSheet(true);
    setExpandedId(null);
  };

  const handleDelete = (id) => {
    deleteTransaction(id);
    setExpandedId(null);
  };

  const handleDuplicate = (id) => {
    duplicateTransaction(id);
    setExpandedId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* iOS Navigation Bar */}
      <div className="flex items-center justify-between">
        <h1 className="large-title m-0">Activity</h1>
        <button
          onClick={openAddSheet}
          className="h-8 w-8 rounded-full bg-[var(--color-gray-5)] flex items-center justify-center text-[var(--color-brand)] active:opacity-70 transition-opacity"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* iOS Search Bar */}
      <div className="relative px-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-gray-1)]" />
        <Input
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-10 bg-[var(--color-gray-5)] border-transparent rounded-xl h-10 text-[17px] focus-visible:ring-transparent focus-visible:bg-[var(--color-gray-4)] transition-colors"
          id="transaction-search"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-[var(--color-gray-2)] flex items-center justify-center text-[var(--color-background)]"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* iOS Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-none">
        {FILTER_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveFilter(type)}
            className={cn(
              "px-4 py-1.5 rounded-full text-[15px] font-medium whitespace-nowrap transition-all",
              activeFilter === type
                ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                : "bg-[var(--color-gray-5)] text-[var(--color-foreground)] active:bg-[var(--color-gray-4)]"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Transaction Groups (iOS Grouped Lists) */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {grouped.map((group) => (
            <motion.div
              key={group.date}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Date Header */}
              <div className="flex items-center justify-between mb-1.5 px-3">
                <span className="text-[13px] font-semibold text-[var(--color-gray-1)] uppercase tracking-wide">
                  {formatDate(group.date)}
                </span>
                <span className="text-[13px] font-medium text-[var(--color-gray-1)]">
                  {formatCurrency(group.total)}
                </span>
              </div>

              {/* Transactions List */}
              <div className="ios-list">
                {group.transactions.map((t) => {
                  const cat = categories.find((c) => c.name === t.category);
                  const Icon = getIcon(cat?.icon || "Circle");
                  const isIncome = t.type === "income";
                  const isExpanded = expandedId === t.id;

                  return (
                    <div key={t.id} className="flex flex-col border-b border-[var(--color-border)] last:border-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : t.id)}
                        className="ios-list-item gap-3 border-0 active:bg-[var(--color-gray-5)]"
                      >
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
                          style={{ backgroundColor: (cat?.color || "#8E8E93") + "20" }}
                        >
                          <Icon
                            className="h-5 w-5"
                            style={{ color: cat?.color || "#8E8E93" }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-[17px] font-medium truncate text-[var(--color-foreground)]">
                            {t.description || t.category}
                          </p>
                          <p className="text-[13px] text-[var(--color-gray-1)] mt-0.5">
                            {t.category} {t.budgetType && !isIncome ? `• ${t.budgetType}` : ''}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={cn(
                            "text-[17px] font-semibold",
                            isIncome ? "text-[var(--color-income)]" : "text-[var(--color-foreground)]"
                          )}>
                            {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
                          </p>
                          <p className="text-[13px] text-[var(--color-gray-1)] mt-0.5">{t.paymentMethod}</p>
                        </div>
                      </button>

                      {/* iOS-style Expanded Actions */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-[var(--color-gray-6)]"
                          >
                            <div className="px-16 pb-3 pt-1 flex items-center justify-between">
                              {t.notes ? (
                                <p className="text-[13px] text-[var(--color-gray-1)] flex-1 italic truncate mr-2">
                                  "{t.notes}"
                                </p>
                              ) : <div className="flex-1" />}
                              <div className="flex gap-4">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEdit(t); }}
                                  className="text-[var(--color-brand)] flex flex-col items-center justify-center active:opacity-50"
                                >
                                  <Pencil className="h-4 w-4 mb-1" />
                                  <span className="text-[10px]">Edit</span>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDuplicate(t.id); }}
                                  className="text-[var(--color-brand)] flex flex-col items-center justify-center active:opacity-50"
                                >
                                  <Copy className="h-4 w-4 mb-1" />
                                  <span className="text-[10px]">Copy</span>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                                  className="text-[var(--color-expense)] flex flex-col items-center justify-center active:opacity-50"
                                >
                                  <Trash2 className="h-4 w-4 mb-1" />
                                  <span className="text-[10px]">Delete</span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {grouped.length === 0 && (
        <div className="text-center py-20 px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-gray-5)] mx-auto mb-4">
            <Search className="h-8 w-8 text-[var(--color-gray-2)]" />
          </div>
          <h3 className="text-[17px] font-semibold mb-1">
            {search ? "No Results" : "No Activity"}
          </h3>
          <p className="text-[15px] text-[var(--color-gray-1)]">
            {search
              ? "Check the spelling or try a new search."
              : "Transactions you add will appear here."}
          </p>
        </div>
      )}

      {/* Edit Sheet */}
      <AddTransactionSheet
        open={showEditSheet}
        onOpenChange={(open) => {
          setShowEditSheet(open);
          if (!open) setEditingTransaction(null);
        }}
        editTransaction={editingTransaction}
      />
    </div>
  );
}
