import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Target, Trash2, Pencil, Flame } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useGoalStore from "@/stores/useGoalStore";
import { goalSchema } from "@/lib/validators";
import { calculateGoalProgress } from "@/lib/calculations";
import { formatCurrency, cn } from "@/lib/utils";
import { getIcon } from "@/lib/iconMap";
import { GOAL_TYPES } from "@/lib/seedData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Goals() {
  const goals = useGoalStore((s) => s.goals);
  const addGoal = useGoalStore((s) => s.addGoal);
  const updateGoal = useGoalStore((s) => s.updateGoal);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);
  const contributeToGoal = useGoalStore((s) => s.contributeToGoal);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [contributeAmount, setContributeAmount] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      type: "custom",
      targetAmount: "",
      currentAmount: 0,
      deadline: "",
      icon: "Target",
      color: "#4C3C92",
    },
  });

  const selectedType = watch("type");

  const goalsWithProgress = useMemo(() => {
    return goals.map((g) => calculateGoalProgress(g)).sort((a,b) => b.progress - a.progress);
  }, [goals]);

  const handleAdd = (data) => {
    const goalType = GOAL_TYPES.find((t) => t.key === data.type);
    const goalData = {
      ...data,
      icon: goalType?.icon || "Target",
      color: goalType?.color || "var(--color-brand)",
    };

    if (editingGoal) {
      updateGoal(editingGoal.id, goalData);
    } else {
      addGoal(goalData);
    }
    setShowAddDialog(false);
    setEditingGoal(null);
    reset();
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    Object.entries(goal).forEach(([key, value]) => setValue(key, value));
    setShowAddDialog(true);
  };

  const handleContribute = () => {
    const amount = Number(contributeAmount);
    if (amount > 0 && expandedId) {
      contributeToGoal(expandedId, amount);
      setExpandedId(null);
      setContributeAmount("");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-3xl font-bold font-['Clash_Grotesk'] tracking-tight">Active Missions 🎯</h1>
        </div>
        <button
          onClick={() => { reset(); setEditingGoal(null); setShowAddDialog(true); }}
          className="duo-btn duo-btn-primary h-12 w-12 rounded-full !p-0 flex items-center justify-center shrink-0"
        >
          <Plus className="h-6 w-6" strokeWidth={3} />
        </button>
      </div>

      {/* Goal Cards */}
      <div className="space-y-4">
        {goalsWithProgress.map((goal) => {
          const Icon = getIcon(goal.icon);
          const isExpanded = expandedId === goal.id;
          const isCompleted = goal.progress >= 100;

          return (
            <div 
              key={goal.id} 
              className={cn(
                "ios-card overflow-hidden",
                isCompleted ? "border-2 border-[var(--color-income)] bg-[var(--color-income)]/5" : ""
              )}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : goal.id)}
                className="w-full text-left p-5 active:bg-[var(--color-gray-6)] transition-colors"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl shrink-0 shadow-sm"
                    style={{ backgroundColor: goal.color ? `${goal.color}20` : 'var(--color-gray-5)' }}
                  >
                    <Icon className="h-7 w-7" style={{ color: goal.color || 'var(--color-brand)' }} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xl font-bold font-['Clash_Grotesk'] truncate">{goal.name}</p>
                    <p className="text-sm font-bold text-[var(--color-gray-1)]">
                      {isCompleted ? "Mission Accomplished! 🎉" : `${goal.progress}% complete — Keep going!`}
                    </p>
                  </div>
                </div>

                {/* Thick Progress Bar */}
                <div className="h-5 w-full bg-[var(--color-gray-5)] rounded-full overflow-hidden mb-3 shadow-inner">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end px-2"
                    style={{ 
                      width: `${Math.min(goal.progress, 100)}%`,
                      backgroundColor: isCompleted ? 'var(--color-income)' : (goal.color || 'var(--color-brand)')
                    }}
                  >
                    {goal.progress >= 20 && (
                      <span className="text-[10px] text-white font-bold opacity-80">{goal.progress}%</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between text-sm font-bold text-[var(--color-gray-1)] sf-rounded">
                  <span className={isCompleted ? "text-[var(--color-income)]" : "text-foreground"}>
                    {formatCurrency(goal.currentAmount)}
                  </span>
                  <span>{formatCurrency(goal.targetAmount)}</span>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-[var(--color-gray-6)] border-t border-[var(--color-border)]"
                  >
                    <div className="p-5">
                      <div className="flex gap-3 mb-5">
                        <input
                          type="number"
                          placeholder="Amount to add"
                          value={contributeAmount}
                          onChange={(e) => setContributeAmount(e.target.value)}
                          className="flex-1 bg-[var(--color-card)] rounded-2xl px-4 py-3 text-[17px] font-bold outline-none sf-rounded shadow-sm"
                        />
                        <button
                          onClick={handleContribute}
                          disabled={!contributeAmount}
                          className="duo-btn duo-btn-success !py-3 !px-6 disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex gap-4 justify-end">
                        <button
                          onClick={() => handleEdit(goal)}
                          className="text-[var(--color-brand)] font-bold flex items-center gap-2 active:opacity-50 px-3 py-2 bg-[var(--color-brand)]/10 rounded-xl"
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </button>
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="text-[var(--color-expense)] font-bold flex items-center gap-2 active:opacity-50 px-3 py-2 bg-[var(--color-expense)]/10 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
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

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="text-center py-20 px-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-gray-5)] mx-auto mb-6 shadow-sm">
            <Target className="h-10 w-10 text-[var(--color-gray-2)]" strokeWidth={2.5} />
          </div>
          <h3 className="text-2xl font-bold font-['Clash_Grotesk'] mb-2">No Active Missions</h3>
          <p className="text-[15px] font-medium text-[var(--color-gray-1)] mb-8">
            Set a financial goal to start your first mission!
          </p>
          <button 
            onClick={() => setShowAddDialog(true)}
            className="duo-btn duo-btn-primary"
          >
            Start a Mission
          </button>
        </div>
      )}

      {/* Add/Edit Goal Modal */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) { setEditingGoal(null); reset(); } }}>
        <DialogContent className="bg-[var(--color-background)] border-none shadow-2xl rounded-[32px] p-6 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-['Clash_Grotesk'] text-center">
              {editingGoal ? "Edit Mission" : "New Mission"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleAdd)} className="space-y-5 mt-4 min-w-0 w-full max-w-full">
            <div className="w-full max-w-full overflow-hidden">
              <label className="text-[13px] font-bold text-[var(--color-gray-1)] uppercase ml-1">Mission Type</label>
              <div className="flex overflow-x-auto gap-2 mt-2 pb-3 scrollbar-none w-full px-1">
                {GOAL_TYPES.map((type) => {
                  const Icon = getIcon(type.icon);
                  const isSelected = selectedType === type.key;
                  return (
                    <button
                      key={type.key}
                      type="button"
                      onClick={() => {
                        setValue("type", type.key);
                        setValue("icon", type.icon);
                        setValue("color", type.color);
                        if (!watch("name")) setValue("name", type.label);
                      }}
                      className={cn(
                         "flex items-center gap-2 px-4 py-3 rounded-2xl shrink-0 transition-all font-bold border-2",
                        isSelected 
                          ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand)]"
                          : "border-transparent bg-[var(--color-gray-5)] text-[var(--color-foreground)]"
                      )}
                    >
                      <Icon className="h-5 w-5" style={{ color: isSelected ? 'var(--color-brand)' : type.color }} />
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <input 
                {...register("name")} 
                placeholder="Mission Name" 
                className="w-full bg-[var(--color-gray-5)] rounded-2xl px-4 py-4 text-[17px] font-bold outline-none focus:ring-2 focus:ring-[var(--color-brand)]" 
              />
              <div className="flex gap-3">
                <input 
                  type="number" 
                  {...register("targetAmount")} 
                  placeholder="Target Amount" 
                  className="w-full bg-[var(--color-gray-5)] rounded-2xl px-4 py-4 text-[17px] font-bold outline-none focus:ring-2 focus:ring-[var(--color-brand)] sf-rounded" 
                />
                {editingGoal && (
                  <input 
                    type="number" 
                    {...register("currentAmount")} 
                    placeholder="Current" 
                    className="w-1/3 bg-[var(--color-gray-5)] rounded-2xl px-4 py-4 text-[17px] font-bold outline-none focus:ring-2 focus:ring-[var(--color-brand)] sf-rounded" 
                  />
                )}
              </div>
              <input 
                type="date" 
                {...register("deadline")} 
                className="w-full bg-[var(--color-gray-5)] rounded-2xl px-4 py-4 text-[17px] font-bold outline-none focus:ring-2 focus:ring-[var(--color-brand)]" 
              />
            </div>

            <button type="submit" className="w-full duo-btn duo-btn-primary mt-4">
              {editingGoal ? "Update Mission" : "Start Mission"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
