import { useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Plus, Target, Wallet, Flame, TrendingUp } from "lucide-react";
import useTransactionStore from "@/stores/useTransactionStore";
import useGoalStore from "@/stores/useGoalStore";
import useBudgetStore from "@/stores/useBudgetStore";
import useSummaryStore from "@/stores/useSummaryStore";
import { calculateDailySpending } from "@/lib/calculations";
import { formatCurrency, cn } from "@/lib/utils";
import { startOfMonth, endOfMonth, isToday } from "date-fns";
import NumberCounter from "@/components/ui/NumberCounter";

export default function Dashboard() {
  const navigate = useNavigate();
  const { openAddSheet } = useOutletContext();
  const transactions = useTransactionStore((s) => s.transactions);
  const goals = useGoalStore((s) => s.goals);
  const budgetConfig = useBudgetStore((s) => s.budgetConfig);
  const summaries = useSummaryStore((s) => s.summaries);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const data = useMemo(() => {
    const currentMonthKey = `${now.getFullYear()}_${String(now.getMonth()+1).padStart(2, '0')}`;
    const currentSummary = summaries.find(s => s.month === currentMonthKey) || { expenses: 0 };
    
    const totalExpense = currentSummary.expenses;
    const todayExpense = transactions
      .filter((t) => t.type === "expense" && isToday(new Date(t.date)))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const budgetLimit = (budgetConfig.salary || 0) * ((budgetConfig.needsPercent + budgetConfig.wantsPercent) / 100);
    const budgetPercent = budgetLimit > 0 ? (totalExpense / budgetLimit) * 100 : 0;

    let budgetMessage = "You're crushing your budget this month 🎉";
    let budgetColor = "var(--color-income)";
    if (budgetPercent > 90) {
      budgetMessage = "Slow down, you're near your limit 🛑";
      budgetColor = "var(--color-expense)";
    } else if (budgetPercent > 75) {
      budgetMessage = "Watch out, spending is getting high ⚠️";
      budgetColor = "var(--color-warning)";
    } else if (budgetLimit === 0) {
      budgetMessage = "Set up your budget to earn streaks! 🎯";
      budgetColor = "var(--color-brand)";
    }

    const activeGoals = goals.filter((g) => g.currentAmount < g.targetAmount);
    const topGoal = activeGoals.sort((a, b) => (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount))[0];

    return { totalExpense, todayExpense, budgetPercent, budgetMessage, budgetColor, topGoal, budgetLimit };
  }, [transactions, goals, budgetConfig, monthStart, monthEnd]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-3xl font-bold font-['Clash_Grotesk'] tracking-tight">Overview</h1>
        </div>
        <button
          onClick={openAddSheet}
          className="duo-btn duo-btn-primary h-12 w-12 rounded-full !p-0 flex items-center justify-center shrink-0"
        >
          <Plus className="h-6 w-6" strokeWidth={3} />
        </button>
      </div>

      {/* Hero Card: Today's Spending */}
      <div className="ios-card bg-[var(--color-brand)] border-none p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
        <p className="text-white/80 font-bold uppercase tracking-wider text-sm mb-2">Today's Spending</p>
        <h2 className="sf-rounded text-5xl font-extrabold tracking-tighter">
          <NumberCounter value={data.todayExpense} />
        </h2>
        <div className="mt-4 flex items-center gap-2 text-white/90 font-medium">
          <TrendingUp className="h-4 w-4" />
          <span>On track to save this week</span>
        </div>
      </div>

      {/* Gamified Budget Health */}
      <div className="ios-card p-5">
        <div className="flex justify-between items-end mb-3">
          <h3 className="font-bold text-lg font-['Clash_Grotesk']">Budget Health</h3>
          <span className="sf-rounded font-bold text-[var(--color-gray-1)]">
            {formatCurrency(data.totalExpense)} / {formatCurrency(data.budgetLimit || 0)}
          </span>
        </div>
        
        {/* Thick, rounded progress bar */}
        <div className="h-4 w-full bg-[var(--color-gray-6)] rounded-full overflow-hidden mb-3">
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ 
              width: `${Math.min(data.budgetPercent, 100)}%`,
              backgroundColor: data.budgetColor
            }}
          />
        </div>
        
        <p className="font-bold text-[15px]" style={{ color: data.budgetColor }}>
          {data.budgetMessage}
        </p>
      </div>

      {/* Top Mission (Goal) */}
      {data.topGoal && (
        <div className="ios-card p-5 border-2 border-[var(--color-savings)] bg-[var(--color-savings)]/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-[var(--color-savings)] text-white flex items-center justify-center">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg font-['Clash_Grotesk'] text-[var(--color-savings)]">Active Mission</h3>
              <p className="text-sm font-bold text-[var(--color-gray-1)]">{data.topGoal.goalName}</p>
            </div>
          </div>
          
          <div className="h-4 w-full bg-white dark:bg-black rounded-full overflow-hidden mb-3 border border-[var(--color-border)]">
            <div 
              className="h-full bg-[var(--color-savings)] rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min((data.topGoal.currentAmount / data.topGoal.targetAmount) * 100, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <p className="font-bold text-[15px] text-[var(--color-savings)]">
              {Math.round((data.topGoal.currentAmount / data.topGoal.targetAmount) * 100)}% complete — Keep going!
            </p>
            <button onClick={() => navigate('/goals')} className="text-[var(--color-savings)] font-bold px-3 py-1 bg-[var(--color-savings)]/10 rounded-full active:scale-95 transition-transform">
              View
            </button>
          </div>
        </div>
      )}

      {/* Grid Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => navigate('/transactions')}
          className="ios-card p-5 text-left active:scale-95 transition-transform flex flex-col items-center text-center gap-3"
        >
          <div className="h-12 w-12 rounded-2xl bg-[var(--color-warning)]/20 text-[var(--color-warning)] flex items-center justify-center">
            <Wallet className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-bold font-['Clash_Grotesk'] text-lg">Activity</p>
            <p className="text-[13px] font-bold text-[var(--color-gray-1)]">View all history</p>
          </div>
        </button>
        
        <button 
          onClick={openAddSheet}
          className="ios-card p-5 text-left active:scale-95 transition-transform flex flex-col items-center text-center gap-3 border-[var(--color-brand)] bg-transparent"
        >
          <div className="h-12 w-12 rounded-2xl bg-[var(--color-brand)] text-white flex items-center justify-center shadow-md">
            <Plus className="h-6 w-6" strokeWidth={3} />
          </div>
          <div>
            <p className="font-bold font-['Clash_Grotesk'] text-lg text-[var(--color-brand)]">Add New</p>
            <p className="text-[13px] font-bold text-[var(--color-gray-1)]">Log expense</p>
          </div>
        </button>
      </div>

    </div>
  );
}
