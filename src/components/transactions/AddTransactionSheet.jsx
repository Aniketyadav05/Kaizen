import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpRight, ArrowDownRight, Calendar, Tag, CreditCard } from "lucide-react";
import useTransactionStore from "@/stores/useTransactionStore";
import useCategoryStore from "@/stores/useCategoryStore";
import { transactionSchema, incomeSchema } from "@/lib/validators";
import { getIcon } from "@/lib/iconMap";
import { cn } from "@/lib/utils";
import { DEFAULT_PAYMENT_METHODS, DEFAULT_INCOME_SOURCES } from "@/lib/seedData";

export default function AddTransactionSheet({ open, onOpenChange, editTransaction = null }) {
  const [mode, setMode] = useState("expense"); // "expense" | "income"
  const categories = useCategoryStore((s) => s.categories);
  const paymentMethods = DEFAULT_PAYMENT_METHODS;
  const incomeSources = DEFAULT_INCOME_SOURCES;
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);

  const schema = mode === "expense" ? transactionSchema : incomeSchema;

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
      category: "",
      source: "",
      amount: "",
      paymentMethod: "",
      budgetType: "Want",
      type: "expense",
      notes: "",
    },
  });

  const selectedCategory = watch("category");
  const selectedSource = watch("source");

  // Auto-set budget type when category changes
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
      setMode(editTransaction.type === "income" ? "income" : "expense");
      Object.entries(editTransaction).forEach(([key, value]) => {
        setValue(key, value);
      });
    }
  }, [editTransaction, setValue]);

  // Reset form when opening
  useEffect(() => {
    if (open && !editTransaction) {
      reset({
        date: format(new Date(), "yyyy-MM-dd"),
        description: "",
        category: "",
        source: "",
        amount: "",
        paymentMethod: paymentMethods[0]?.name || "",
        budgetType: "Want",
        type: "expense",
        notes: "",
      });
    }
  }, [open, editTransaction, reset, paymentMethods]);

  const onSubmit = (data) => {
    if (editTransaction) {
      updateTransaction(editTransaction.id, data);
    } else {
      addTransaction({
        ...data,
        category: mode === "income" ? data.source : data.category,
        description: data.description || (mode === "income" ? data.source : ""),
        type: mode
      });
    }
    onOpenChange(false);
    reset();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Gamified Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 z-[101] max-h-[92vh] overflow-y-auto rounded-t-[32px] bg-[var(--color-background)] shadow-2xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="px-6 pb-8">
              {/* Handle */}
              <div className="flex justify-center pt-4 pb-2">
                <div className="h-1.5 w-12 rounded-full bg-[var(--color-gray-4)]" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between mb-6 mt-2">
                <h2 className="text-2xl font-bold font-['Clash_Grotesk']">
                  {editTransaction ? "Edit" : "New"} {mode === "income" ? "Income" : "Expense"}
                </h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8 rounded-full bg-[var(--color-gray-5)] flex items-center justify-center text-[var(--color-gray-1)] active:scale-95"
                >
                  <X className="h-5 w-5" strokeWidth={3} />
                </button>
              </div>

              {/* Segmented Control */}
              {!editTransaction && (
                <div className="flex bg-[var(--color-gray-6)] rounded-2xl p-1 mb-8 shadow-inner border border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => setMode("expense")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all",
                      mode === "expense"
                        ? "bg-[var(--color-card)] shadow-sm text-[var(--color-expense)]"
                        : "text-[var(--color-gray-1)]"
                    )}
                  >
                    <ArrowDownRight className="h-5 w-5" strokeWidth={2.5} />
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("income")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all",
                      mode === "income"
                        ? "bg-[var(--color-card)] shadow-sm text-[var(--color-income)]"
                        : "text-[var(--color-gray-1)]"
                    )}
                  >
                    <ArrowUpRight className="h-5 w-5" strokeWidth={2.5} />
                    Income
                  </button>
                </div>
              )}

              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); }}>
                {/* Massive Amount Input */}
                <div className="text-center py-2 relative">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-4xl font-bold text-[var(--color-gray-2)]">₹</span>
                    <input
                      type="number"
                      placeholder="0"
                      {...register("amount")}
                      className={cn(
                        "text-[64px] sf-rounded font-extrabold bg-transparent outline-none text-center w-full placeholder:text-[var(--color-gray-4)]",
                        mode === "expense" ? "text-[var(--color-expense)]" : "text-[var(--color-income)]"
                      )}
                      autoFocus
                    />
                  </div>
                  {errors.amount && <p className="text-[15px] font-bold text-[var(--color-expense)] mt-2">{errors.amount.message}</p>}
                </div>

                {/* Description (Playful Input) */}
                <div>
                  <input
                    placeholder={mode === "expense" ? "What was this for?" : "Source of income"}
                    {...register("description")}
                    className="w-full bg-[var(--color-gray-5)] rounded-2xl p-4 text-lg font-bold outline-none focus:ring-2 focus:ring-[var(--color-brand)] placeholder:text-[var(--color-gray-2)] text-center shadow-inner"
                  />
                  {errors.description && <p className="text-[13px] font-bold text-[var(--color-expense)] text-center mt-2">{errors.description.message}</p>}
                </div>

                {/* Grid Pickers */}
                <div className="pt-2">
                  <h3 className="text-[14px] font-bold text-[var(--color-gray-1)] uppercase tracking-wide mb-3 pl-1">
                    {mode === "expense" ? "Category" : "Income Source"}
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    {(mode === "expense" ? categories : incomeSources).map((item) => {
                      const Icon = getIcon(item.icon);
                      const isSelected = mode === "expense" ? selectedCategory === item.name : selectedSource === item.name;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => mode === "expense" ? setValue("category", item.name, { shouldValidate: true }) : setValue("source", item.name, { shouldValidate: true })}
                          className={cn(
                            "flex flex-col items-center justify-center gap-2 aspect-square rounded-[20px] transition-all font-bold border-2",
                            isSelected
                              ? "border-[var(--color-brand)] opacity-100 scale-105 bg-transparent"
                              : "border-transparent bg-[var(--color-gray-5)] text-[var(--color-foreground)] active:scale-95"
                          )}
                        >
                          {isSelected && <div className="absolute inset-0 bg-[var(--color-brand)] opacity-10 rounded-[18px]" />}
                          <Icon className="h-7 w-7" style={{ color: isSelected ? 'var(--color-brand)' : item.color }} strokeWidth={2.5} />
                          <span className="text-[11px] truncate w-full px-1 text-center">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {(errors.category || errors.source) && (
                    <p className="text-[14px] font-bold text-[var(--color-expense)] mt-2 text-center">Please select a category</p>
                  )}
                </div>

                {/* Additional Details (Date, Payment) */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-[var(--color-gray-5)] rounded-2xl p-3 flex items-center gap-2 relative">
                    <Calendar className="h-5 w-5 text-[var(--color-gray-1)]" />
                    <input
                      type="date"
                      {...register("date")}
                      className="bg-transparent border-none outline-none font-bold text-[15px] w-full"
                    />
                  </div>
                  <div className="bg-[var(--color-gray-5)] rounded-2xl p-3 flex items-center gap-2 relative">
                    <CreditCard className="h-5 w-5 text-[var(--color-gray-1)] shrink-0" />
                    <select
                      {...register("paymentMethod")}
                      className="bg-transparent border-none outline-none font-bold text-[15px] w-full appearance-none pr-6 cursor-pointer text-ellipsis overflow-hidden"
                    >
                      {paymentMethods.map((pm) => (
                        <option key={pm.id} value={pm.name}>{pm.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-4">
                  <button 
                    onClick={handleSubmit(onSubmit)}
                    className="w-full duo-btn duo-btn-primary !text-xl !py-4"
                  >
                    {editTransaction ? "Update" : "Save"} {mode === "income" ? "Income" : "Expense"}
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
