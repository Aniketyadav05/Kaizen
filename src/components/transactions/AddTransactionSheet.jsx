import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpRight, ArrowDownRight, ArrowLeftRight, Calendar, CreditCard, ChevronDown } from "lucide-react";
import useTransactionStore from "@/stores/useTransactionStore";
import useCategoryStore from "@/stores/useCategoryStore";
import useAccountStore from "@/stores/useAccountStore";
import { transactionSchema, incomeSchema, transferSchema } from "@/lib/validators";
import { getIcon } from "@/lib/iconMap";
import { cn } from "@/lib/utils";
import { DEFAULT_INCOME_SOURCES } from "@/lib/seedData";

export default function AddTransactionSheet({ open, onOpenChange, editTransaction = null }) {
  const [mode, setMode] = useState("expense"); // "expense" | "income" | "transfer"
  const [showNotes, setShowNotes] = useState(false);
  
  const categories = useCategoryStore((s) => s.categories);
  const accounts = useAccountStore((s) => s.accounts);
  const incomeSources = DEFAULT_INCOME_SOURCES;
  
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const lastUsedAccount = useTransactionStore((s) => s.lastUsedAccount);
  const lastUsedCategory = useTransactionStore((s) => s.lastUsedCategory);

  const defaultAccount = useMemo(() => {
    if (lastUsedAccount && accounts.some(a => a.name === lastUsedAccount)) return lastUsedAccount;
    return accounts.find(a => a.type === 'bank')?.name || accounts[0]?.name || "";
  }, [lastUsedAccount, accounts]);

  const schema = mode === "expense" ? transactionSchema : (mode === "income" ? incomeSchema : transferSchema);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      description: "",
      category: lastUsedCategory || "",
      source: "",
      amount: "",
      account: defaultAccount,
      fromAccount: defaultAccount,
      toAccount: accounts.find(a => a.type === 'cash')?.name || "",
      budgetType: "Want",
      type: "expense",
      notes: "",
    },
  });

  const selectedCategory = watch("category");
  const selectedSource = watch("source");
  const currentBudgetType = watch("budgetType");
  const amountValue = watch("amount");

  // Auto-set budget type when category changes (but user can override)
  useEffect(() => {
    if (mode === "expense" && selectedCategory) {
      const cat = categories.find((c) => c.name === selectedCategory);
      if (cat) {
        setValue("budgetType", cat.type);
      }
    }
  }, [selectedCategory, categories, setValue, mode]);

  // Populate form for editing
  useEffect(() => {
    if (editTransaction) {
      setMode(editTransaction.type);
      Object.entries(editTransaction).forEach(([key, value]) => {
        if (key === "date" && typeof value === "string") {
          setValue(key, value.split("T")[0]);
        } else {
          setValue(key, value);
        }
      });
      if (editTransaction.notes) setShowNotes(true);
    }
  }, [editTransaction, setValue]);

  // Reset form when opening
  useEffect(() => {
    if (open && !editTransaction) {
      reset({
        date: format(new Date(), "yyyy-MM-dd"),
        description: "",
        category: lastUsedCategory || "",
        source: "",
        amount: "",
        account: defaultAccount,
        fromAccount: defaultAccount,
        toAccount: accounts.find(a => a.type === 'cash')?.name || "",
        budgetType: "Want",
        type: mode,
        notes: "",
      });
      setShowNotes(false);
    }
  }, [open, editTransaction, reset, defaultAccount, lastUsedCategory, mode, accounts]);

  const onSubmit = (data) => {
    let finalData = { ...data, type: mode };
    
    if (mode === "expense") {
      finalData.description = data.description || data.category;
    } else if (mode === "income") {
      finalData.category = data.source;
      finalData.description = data.description || data.source;
    } else if (mode === "transfer") {
      finalData.description = data.description || `Transfer to ${data.toAccount}`;
    }

    if (editTransaction) {
      updateTransaction(editTransaction.id, finalData);
    } else {
      addTransaction(finalData);
    }
    onOpenChange(false);
    reset();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 z-[101] max-h-[92vh] overflow-y-auto rounded-t-[28px] bg-[var(--color-background)] shadow-2xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="px-5 pb-6 pt-3">
              <div className="flex justify-center pb-2">
                <div className="h-1.5 w-12 rounded-full bg-[var(--color-gray-4)]" />
              </div>

              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold font-['Clash_Grotesk']">
                  {editTransaction ? "Edit" : "Add"}
                </h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8 rounded-full bg-[var(--color-gray-5)] flex items-center justify-center text-[var(--color-gray-1)] active:scale-95"
                >
                  <X className="h-5 w-5" strokeWidth={3} />
                </button>
              </div>

              {!editTransaction && (
                <div className="flex bg-[var(--color-gray-6)] rounded-[14px] p-1 mb-5 shadow-inner border border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => { setMode("expense"); setValue("type", "expense"); }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] font-bold text-[14px] transition-all",
                      mode === "expense" ? "bg-[var(--color-card)] shadow-sm text-[var(--color-expense)]" : "text-[var(--color-gray-1)]"
                    )}
                  >
                    <ArrowDownRight className="h-4 w-4" strokeWidth={2.5} /> Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode("transfer"); setValue("type", "transfer"); }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] font-bold text-[14px] transition-all",
                      mode === "transfer" ? "bg-[var(--color-card)] shadow-sm text-[var(--color-brand)]" : "text-[var(--color-gray-1)]"
                    )}
                  >
                    <ArrowLeftRight className="h-4 w-4" strokeWidth={2.5} /> Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode("income"); setValue("type", "income"); }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] font-bold text-[14px] transition-all",
                      mode === "income" ? "bg-[var(--color-card)] shadow-sm text-[var(--color-income)]" : "text-[var(--color-gray-1)]"
                    )}
                  >
                    <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} /> Income
                  </button>
                </div>
              )}

              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); }}>
                {/* Amount Input */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-3xl font-bold text-[var(--color-gray-2)]">₹</span>
                    <input
                      type="number"
                      placeholder="0"
                      {...register("amount")}
                      className={cn(
                        "text-[56px] sf-rounded font-extrabold bg-transparent outline-none text-center w-full placeholder:text-[var(--color-gray-4)] transition-colors",
                        mode === "expense" && amountValue ? "text-[var(--color-expense)]" : "",
                        mode === "income" && amountValue ? "text-[var(--color-income)]" : "",
                        mode === "transfer" && amountValue ? "text-[var(--color-brand)]" : ""
                      )}
                      autoFocus
                    />
                  </div>
                  {errors.amount && <p className="text-[13px] font-bold text-[var(--color-expense)] mt-1">{errors.amount.message}</p>}
                </div>

                {/* Explicit Need/Want/Saving (Only for Expense) */}
                {mode === "expense" && (
                  <div>
                    <h3 className="text-[12px] font-bold text-[var(--color-gray-1)] uppercase tracking-wide pl-1 mb-2">
                      Budget Allocation
                    </h3>
                    <div className="flex bg-[var(--color-gray-6)] rounded-[14px] p-1 shadow-inner border border-[var(--color-border)]">
                      {["Need", "Want", "Saving"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setValue("budgetType", type)}
                        className={cn(
                          "flex-1 py-2 rounded-[10px] font-bold text-[13px] transition-all uppercase tracking-wide",
                          currentBudgetType === type
                            ? `bg-[var(--color-card)] shadow-sm text-[var(--color-${type.toLowerCase()})] ring-1 ring-[var(--color-${type.toLowerCase()})]/30`
                            : "text-[var(--color-gray-1)]"
                        )}
                      >
                        {type}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category / Income Source — Horizontal Scroll */}
                {mode !== "transfer" && (
                  <div>
                    <h3 className="text-[12px] font-bold text-[var(--color-gray-1)] uppercase tracking-wide pl-1 mb-2">
                      {mode === "expense" ? "Category" : "Source"}
                    </h3>
                    <div className="category-scroll pb-1">
                      {(mode === "expense" ? categories : incomeSources).map((item) => {
                        const Icon = getIcon(item.icon);
                        const isSelected = mode === "expense" ? selectedCategory === item.name : selectedSource === item.name;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => mode === "expense" ? setValue("category", item.name, { shouldValidate: true }) : setValue("source", item.name, { shouldValidate: true })}
                            className={cn(
                              "flex flex-col items-center justify-center gap-1.5 min-w-[72px] w-[72px] py-3 rounded-[16px] transition-all font-bold border-2",
                              isSelected
                                ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10"
                                : "border-transparent bg-[var(--color-gray-5)] active:bg-[var(--color-gray-4)]"
                            )}
                          >
                            <Icon className="h-6 w-6" style={{ color: isSelected ? 'var(--color-brand)' : item.color }} strokeWidth={2} />
                            <span className="text-[10px] leading-tight truncate w-full px-0.5 text-center font-semibold">
                              {item.name.length > 12 ? item.name.split(" ")[0] : item.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {(errors.category || errors.source) && (
                      <p className="text-[13px] font-bold text-[var(--color-expense)] mt-1 pl-1">Selection required</p>
                    )}
                  </div>
                )}

                {/* Account Selection */}
                {mode === "transfer" ? (
                  <div className="grid grid-cols-2 gap-3 bg-[var(--color-gray-6)] p-3 rounded-2xl border border-[var(--color-border)]">
                    <div>
                      <p className="text-[11px] font-bold text-[var(--color-gray-1)] uppercase tracking-wider mb-1 pl-1">From</p>
                      <select {...register("fromAccount")} className="w-full bg-[var(--color-card)] rounded-xl p-2.5 font-bold text-[14px] outline-none border border-[var(--color-border)]">
                        {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[var(--color-gray-1)] uppercase tracking-wider mb-1 pl-1">To</p>
                      <select {...register("toAccount")} className="w-full bg-[var(--color-card)] rounded-xl p-2.5 font-bold text-[14px] outline-none border border-[var(--color-border)]">
                        {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                      </select>
                    </div>
                    {errors.toAccount && <p className="col-span-2 text-[12px] font-bold text-[var(--color-expense)] mt-1">{errors.toAccount.message}</p>}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-[var(--color-gray-6)] p-1.5 rounded-2xl border border-[var(--color-border)]">
                    <div className="flex-1 flex items-center gap-2 bg-[var(--color-card)] rounded-xl p-2.5 border border-[var(--color-border)]">
                      <CreditCard className="h-4 w-4 text-[var(--color-brand)] shrink-0" />
                      <select {...register("account")} className="bg-transparent border-none outline-none font-bold text-[14px] w-full appearance-none pr-4">
                        {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 flex items-center gap-2 bg-[var(--color-card)] rounded-xl p-2.5 border border-[var(--color-border)]">
                      <Calendar className="h-4 w-4 text-[var(--color-brand)] shrink-0" />
                      <input type="date" {...register("date")} className="bg-transparent border-none outline-none font-bold text-[14px] w-full" />
                    </div>
                  </div>
                )}

                {/* Transfer Date (if in transfer mode) */}
                {mode === "transfer" && (
                  <div className="flex items-center gap-2 bg-[var(--color-gray-5)] rounded-xl p-3">
                    <Calendar className="h-4 w-4 text-[var(--color-brand)] shrink-0" />
                    <input type="date" {...register("date")} className="bg-transparent border-none outline-none font-bold text-[14px] w-full" />
                  </div>
                )}

                {/* Description (Optional) */}
                <input
                  placeholder={mode === "expense" ? "What was this for? (Optional)" : (mode === "income" ? "Note (Optional)" : "Transfer Note (Optional)")}
                  {...register("description")}
                  className="w-full bg-[var(--color-gray-5)] rounded-xl p-3.5 text-[15px] font-semibold outline-none focus:ring-2 focus:ring-[var(--color-brand)] placeholder:text-[var(--color-gray-2)]"
                />

                <div className="pt-2 flex gap-3">
                  {editTransaction && (
                    <button 
                      type="button" 
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this transaction?")) {
                          deleteTransaction(editTransaction.id);
                          onOpenChange(false);
                        }
                      }} 
                      className="w-1/3 duo-btn bg-[var(--color-expense)]/10 text-[var(--color-expense)] !text-lg !py-4"
                    >
                      Delete
                    </button>
                  )}
                  <button onClick={handleSubmit(onSubmit)} className="flex-1 duo-btn duo-btn-primary !text-lg !py-4">
                    Save {mode === "expense" ? "Expense" : (mode === "income" ? "Income" : "Transfer")}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
