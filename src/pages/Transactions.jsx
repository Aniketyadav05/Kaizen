import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from "date-fns";
import { Search, Filter, Plus, ArrowUpRight, ArrowDownRight, ArrowLeftRight, X } from "lucide-react";
import useTransactionStore from "@/stores/useTransactionStore";
import useCategoryStore from "@/stores/useCategoryStore";
import useAccountStore from "@/stores/useAccountStore";
import { getIcon } from "@/lib/iconMap";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useOutletContext } from "react-router-dom";

export default function Transactions() {
  const transactions = useTransactionStore((s) => s.transactions);
  const categories = useCategoryStore((s) => s.categories);
  const accounts = useAccountStore((s) => s.accounts);
  const { openAddSheet, openEditSheet } = useOutletContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filters state
  const [filterType, setFilterType] = useState("all"); // all | expense | income | transfer
  const [filterBudgetType, setFilterBudgetType] = useState("all"); // all | Need | Want | Saving
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterTime, setFilterTime] = useState("thisMonth"); // all | thisMonth | lastMonth

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    
    let timeRange = null;
    if (filterTime === "thisMonth") {
      timeRange = { start: startOfMonth(now), end: endOfMonth(now) };
    } else if (filterTime === "lastMonth") {
      const lastMonth = subMonths(now, 1);
      timeRange = { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    }

    return transactions.filter((t) => {
      // Time filter
      if (timeRange) {
        const d = new Date(t.date);
        if (!isWithinInterval(d, timeRange)) return false;
      }
      // Type filter
      if (filterType !== "all" && t.type !== filterType) return false;
      // Budget Type filter (only applies to expenses)
      if (filterBudgetType !== "all" && t.type === "expense" && t.budgetType !== filterBudgetType) return false;
      // Category filter
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      // Account filter
      if (filterAccount !== "all") {
        if (t.type === "transfer") {
          if (t.fromAccount !== filterAccount && t.toAccount !== filterAccount) return false;
        } else {
          const acc = t.account || t.paymentMethod;
          if (acc !== filterAccount) return false;
        }
      }
      // Search
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        return (
          t.description?.toLowerCase().includes(s) ||
          t.category?.toLowerCase().includes(s) ||
          t.notes?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [transactions, filterType, filterBudgetType, filterCategory, filterAccount, filterTime, searchTerm]);

  // Group by Date
  const groupedTransactions = useMemo(() => {
    const groups = {};
    filteredTransactions.forEach((t) => {
      const dateKey = t.date;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [filteredTransactions]);

  const resetFilters = () => {
    setFilterType("all");
    setFilterBudgetType("all");
    setFilterCategory("all");
    setFilterAccount("all");
    setFilterTime("all");
    setShowFilters(false);
  };

  const activeFilterCount = [
    filterType !== "all",
    filterBudgetType !== "all",
    filterCategory !== "all",
    filterAccount !== "all",
    filterTime !== "all"
  ].filter(Boolean).length;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-8 h-full flex flex-col">
      <div className="flex items-center justify-between pt-2">
        <h1 className="large-title m-0">Activity</h1>
        <button
          onClick={openAddSheet}
          className="h-8 w-8 rounded-full bg-[var(--color-brand)] flex items-center justify-center text-white active:scale-95 transition-transform shadow-sm shrink-0"
        >
          <Plus className="h-5 w-5" strokeWidth={3} />
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[12px] px-3 h-11 transition-shadow focus-within:ring-2 ring-[var(--color-brand)]/20 shadow-sm">
          <Search className="h-4 w-4 text-[var(--color-gray-2)] shrink-0" />
          <input
            type="text"
            placeholder="Search activity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-[15px] font-medium placeholder:text-[var(--color-gray-2)]"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-[var(--color-gray-2)] active:text-[var(--color-foreground)]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "h-11 px-3 rounded-[12px] flex items-center justify-center gap-1.5 transition-colors border shadow-sm",
            showFilters || activeFilterCount > 0
              ? "bg-[var(--color-brand)] border-[var(--color-brand)] text-white"
              : "bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-gray-1)]"
          )}
        >
          <Filter className="h-4 w-4" />
          {activeFilterCount > 0 && <span className="font-bold text-[13px]">{activeFilterCount}</span>}
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="ios-card p-4 space-y-4">
           {/* Time Filter */}
           <div>
            <p className="text-[12px] font-bold text-[var(--color-gray-1)] uppercase tracking-wider mb-2">Time Period</p>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
               {["all", "thisMonth", "lastMonth"].map(t => (
                 <button
                   key={t}
                   onClick={() => setFilterTime(t)}
                   className={cn(
                     "px-3 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors",
                     filterTime === t ? "bg-[var(--color-brand)] text-white" : "bg-[var(--color-gray-5)] text-[var(--color-gray-1)]"
                   )}
                 >
                   {t === "all" ? "All Time" : t === "thisMonth" ? "This Month" : "Last Month"}
                 </button>
               ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <p className="text-[12px] font-bold text-[var(--color-gray-1)] uppercase tracking-wider mb-2">Transaction Type</p>
            <div className="flex gap-2">
              {["all", "expense", "income", "transfer"].map(t => (
                <button
                  key={t}
                  onClick={() => { setFilterType(t); setFilterBudgetType("all"); }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[13px] font-bold capitalize transition-colors",
                    filterType === t ? "bg-[var(--color-brand)] text-white" : "bg-[var(--color-gray-5)] text-[var(--color-gray-1)]"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Type (50/30/20) - Only if expense or all */}
          {(filterType === "expense" || filterType === "all") && (
            <div>
              <p className="text-[12px] font-bold text-[var(--color-gray-1)] uppercase tracking-wider mb-2">Budget Allocation</p>
              <div className="flex gap-2">
                {["all", "Need", "Want", "Saving"].map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterBudgetType(t)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[13px] font-bold transition-colors",
                      filterBudgetType === t 
                        ? (t === "Need" ? "bg-[var(--color-need)] text-white" : t === "Want" ? "bg-[var(--color-want)] text-white" : t === "Saving" ? "bg-[var(--color-saving)] text-white" : "bg-[var(--color-brand)] text-white")
                        : "bg-[var(--color-gray-5)] text-[var(--color-gray-1)]"
                    )}
                  >
                    {t === "all" ? "All" : t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
             {/* Category Filter */}
            <div>
              <p className="text-[12px] font-bold text-[var(--color-gray-1)] uppercase tracking-wider mb-1">Category</p>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full bg-[var(--color-gray-5)] rounded-xl p-2 font-bold text-[13px] outline-none border-none">
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            
            {/* Account Filter */}
            <div>
              <p className="text-[12px] font-bold text-[var(--color-gray-1)] uppercase tracking-wider mb-1">Account</p>
              <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} className="w-full bg-[var(--color-gray-5)] rounded-xl p-2 font-bold text-[13px] outline-none border-none">
                <option value="all">All Accounts</option>
                {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
            </div>
          </div>

          {activeFilterCount > 0 && (
             <button onClick={resetFilters} className="w-full py-2 mt-2 text-[13px] font-bold text-[var(--color-expense)] text-center bg-[var(--color-expense)]/10 rounded-xl">
               Clear All Filters
             </button>
          )}
        </div>
      )}

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4">
        {groupedTransactions.length > 0 ? (
          groupedTransactions.map(([date, groupTransactions]) => (
            <div key={date} className="ios-list">
              <div className="bg-[var(--color-gray-6)] px-4 py-1.5 border-b border-[var(--color-border)]">
                <span className="text-[12px] font-bold text-[var(--color-gray-1)] uppercase tracking-wider">
                  {formatDate(date)}
                </span>
              </div>
              
              {groupTransactions.map((t) => {
                const isIncome = t.type === "income";
                const isTransfer = t.type === "transfer";
                let iconColor, IconComp, typeLabel;
                
                if (isTransfer) {
                  iconColor = "#8E8E93";
                  IconComp = ArrowLeftRight;
                  typeLabel = "Transfer";
                } else {
                  const cat = categories.find((c) => c.name === t.category);
                  IconComp = getIcon(cat?.icon || (isIncome ? "ArrowDownRight" : "Circle"));
                  iconColor = cat?.color || (isIncome ? "#34C759" : "#FF3B30");
                  typeLabel = t.budgetType;
                }

                return (
                  <button
                    key={t.id}
                    onClick={() => openEditSheet(t)}
                    className="ios-list-item text-left w-full active:bg-[var(--color-gray-5)]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: iconColor + "20" }}>
                      <IconComp className="h-5 w-5" style={{ color: iconColor }} strokeWidth={2.5} />
                    </div>
                    
                    <div className="flex-1 min-w-0 px-3">
                      <p className="text-[16px] font-bold truncate text-[var(--color-foreground)]">
                        {t.description || t.category || "Transfer"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isTransfer ? (
                           <span className="text-[12px] font-bold text-[var(--color-gray-1)]">
                             {t.fromAccount} → {t.toAccount}
                           </span>
                        ) : (
                          <>
                            <span className="text-[12px] font-bold text-[var(--color-gray-1)]">{t.account || t.paymentMethod}</span>
                            {t.type === "expense" && typeLabel && (
                              <>
                                <span className="text-[10px] text-[var(--color-gray-2)]">•</span>
                                <span className={cn(
                                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                                  typeLabel === "Need" ? "bg-[var(--color-need)]/10 text-[var(--color-need)]" :
                                  typeLabel === "Want" ? "bg-[var(--color-want)]/10 text-[var(--color-want)]" :
                                  "bg-[var(--color-saving)]/10 text-[var(--color-saving)]"
                                )}>
                                  {typeLabel}
                                </span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <p className={cn(
                        "text-[16px] font-extrabold sf-rounded",
                        isIncome ? "text-[var(--color-income)]" : (isTransfer ? "text-[var(--color-gray-1)]" : "text-[var(--color-foreground)]")
                      )}>
                        {isIncome ? "+" : (isTransfer ? "" : "-")}{formatCurrency(t.amount)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ))
        ) : (
          <div className="text-center py-20 px-4">
            <div className="h-16 w-16 bg-[var(--color-gray-5)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-[var(--color-gray-2)]" />
            </div>
            <p className="text-[17px] font-bold text-[var(--color-foreground)] mb-1">No activity found</p>
            <p className="text-[14px] text-[var(--color-gray-1)] font-medium">
              Try adjusting your filters or search term.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
