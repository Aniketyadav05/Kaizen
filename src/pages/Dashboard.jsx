import { useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Plus, Target, Wallet, TrendingUp, CreditCard, Repeat, AlertTriangle, ChevronRight, Clock, ArrowLeftRight } from "lucide-react";
import useTransactionStore from "@/stores/useTransactionStore";
import useGoalStore from "@/stores/useGoalStore";
import useBudgetStore from "@/stores/useBudgetStore";
import useSIPStore from "@/stores/useSIPStore";
import useCategoryStore from "@/stores/useCategoryStore";
import { calculateBudgetVsActual, calculateCurrentWeekSpend, calculateDynamicIncome, calculateDynamicBudget } from "@/lib/calculations";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { startOfMonth, endOfMonth, isToday, format } from "date-fns";
import { getIcon } from "@/lib/iconMap";
import NumberCounter from "@/components/ui/NumberCounter";

export default function Dashboard() {
  const navigate = useNavigate();
  const { openAddSheet, openEditSheet } = useOutletContext();
  const transactions = useTransactionStore((s) => s.transactions);
  const categories = useCategoryStore((s) => s.categories);
  const goals = useGoalStore((s) => s.goals);
  const budgetConfig = useBudgetStore((s) => s.budgetConfig);
  const sips = useSIPStore((s) => s.sips);
  const getDueSIPs = useSIPStore((s) => s.getDueSIPs);
  const getOverdueSIPs = useSIPStore((s) => s.getOverdueSIPs);
  const getUpcomingSIPs = useSIPStore((s) => s.getUpcomingSIPs);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const data = useMemo(() => {
    const todayExpense = transactions
      .filter((t) => t.type === "expense" && isToday(new Date(t.date)))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const weekExpense = calculateCurrentWeekSpend(transactions);

    const monthExpenses = transactions
      .filter((t) => t.type === "expense" && new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd);
    const monthExpense = monthExpenses.reduce((sum, t) => sum + Number(t.amount), 0);

    const dynamicIncome = calculateDynamicIncome(transactions, monthStart, monthEnd);

    const budgetBreakdown = dynamicIncome > 0
      ? calculateBudgetVsActual(transactions, budgetConfig, { start: monthStart, end: monthEnd })
      : [];

    const totalBudget = calculateDynamicBudget(dynamicIncome, budgetConfig.needsPercent, budgetConfig.wantsPercent);
    const budgetLeft = totalBudget - monthExpense;

    const activeGoals = goals.filter((g) => g.currentAmount < g.targetAmount);
    const topGoal = activeGoals.sort((a, b) => (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount))[0];

    const dueSIPs = getDueSIPs();
    const overdueSIPs = getOverdueSIPs();
    const upcomingSIPs = getUpcomingSIPs();
    const nextSIP = upcomingSIPs.length > 0 ? upcomingSIPs[0] : null;

    const recentTx = transactions.slice(0, 4);

    return { todayExpense, weekExpense, monthExpense, budgetLeft, totalBudget, budgetBreakdown, topGoal, dueSIPs, overdueSIPs, nextSIP, recentTx, dynamicIncome };
  }, [transactions, goals, budgetConfig, monthStart, monthEnd, sips]);

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-8">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-3xl font-bold font-['Clash_Grotesk'] tracking-tight">Overview</h1>
        </div>
        <button
          onClick={openAddSheet}
          className="duo-btn duo-btn-primary h-11 w-11 rounded-[16px] !p-0 flex items-center justify-center shrink-0 shadow-sm"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>

      {/* Spend Priority Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="ios-card p-3 bg-[var(--color-card)] flex flex-col items-center justify-center text-center">
          <p className="text-[11px] font-bold text-[var(--color-gray-1)] uppercase tracking-wider mb-1">Today</p>
          <p className="text-[15px] sf-rounded font-extrabold text-[var(--color-foreground)]">{formatCurrency(data.todayExpense, true)}</p>
        </div>
        <div className="ios-card p-3 bg-[var(--color-card)] flex flex-col items-center justify-center text-center">
          <p className="text-[11px] font-bold text-[var(--color-gray-1)] uppercase tracking-wider mb-1">This Week</p>
          <p className="text-[15px] sf-rounded font-extrabold text-[var(--color-foreground)]">{formatCurrency(data.weekExpense, true)}</p>
        </div>
        <div className="ios-card p-3 bg-[var(--color-card)] flex flex-col items-center justify-center text-center">
          <p className="text-[11px] font-bold text-[var(--color-gray-1)] uppercase tracking-wider mb-1">This Month</p>
          <p className="text-[15px] sf-rounded font-extrabold text-[var(--color-foreground)]">{formatCurrency(data.monthExpense, true)}</p>
        </div>
      </div>

      {/* Budget Left Hero */}
      <div className="ios-card p-5 bg-[var(--color-brand)] border-none text-white relative overflow-hidden flex justify-between items-center">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
        <div>
          <p className="text-white/80 font-bold uppercase tracking-wider text-[11px] mb-1">Monthly Budget Left</p>
          {data.dynamicIncome > 0 ? (
            <>
              <h2 className="sf-rounded text-4xl font-extrabold tracking-tighter">
                {formatCurrency(data.budgetLeft)}
              </h2>
              {data.budgetLeft < 0 && (
                 <p className="text-[12px] font-bold bg-white/20 px-2 py-0.5 rounded-full inline-block mt-2 backdrop-blur-md">
                   Over budget by {formatCurrency(Math.abs(data.budgetLeft))}
                 </p>
              )}
            </>
          ) : (
            <div>
              <h2 className="sf-rounded text-2xl font-extrabold tracking-tight mt-1 mb-1">Log Income</h2>
              <p className="text-[12px] font-medium text-white/90">to unlock your dynamic budget</p>
            </div>
          )}
        </div>
        <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
          <Wallet className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* 50/30/20 Compliance */}
      <div className="ios-card p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-[16px] font-['Clash_Grotesk']">50/30/20 Breakdown</h3>
          <button onClick={() => navigate('/analytics')} className="text-[12px] font-bold text-[var(--color-brand)] flex items-center">
            Details <ChevronRight className="h-3 w-3 ml-0.5" />
          </button>
        </div>
        
        {data.budgetBreakdown.length > 0 ? (
          <div className="space-y-3.5">
            {data.budgetBreakdown.map((item) => {
              const pct = Math.min(item.percentage, 100);
              const overBudget = item.percentage > 100;
              return (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[13px] font-semibold">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[12px] font-bold",
                        overBudget ? "text-[var(--color-expense)]" : "text-[var(--color-gray-1)]"
                      )}>
                        {item.percentage}% used
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full bg-[var(--color-gray-6)] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${pct}%`,
                        backgroundColor: overBudget ? "var(--color-expense)" : item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[13px] text-[var(--color-gray-1)] text-center py-2 font-medium">
            Log an income this month to see 50/30/20 progress
          </p>
        )}
      </div>

      {/* SIPs & Goals Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* SIP Priority */}
        <div onClick={() => navigate('/sips')} className="ios-card p-4 bg-[var(--color-card)] active:scale-[0.98] transition-transform cursor-pointer">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-full bg-[var(--color-saving)]/15 flex items-center justify-center">
              <Repeat className="h-3.5 w-3.5 text-[var(--color-saving)]" strokeWidth={2.5} />
            </div>
            <p className="text-[12px] font-bold text-[var(--color-gray-1)] uppercase tracking-wide">Next SIP</p>
          </div>
          {(data.dueSIPs.length > 0 || data.overdueSIPs.length > 0) ? (
            <div>
               <p className="text-[14px] font-bold text-[var(--color-expense)] truncate">
                 {data.overdueSIPs[0]?.name || data.dueSIPs[0]?.name}
               </p>
               <p className="text-[12px] font-bold text-[var(--color-expense)]">Action Required</p>
            </div>
          ) : data.nextSIP ? (
            <div>
              <p className="text-[14px] font-bold text-[var(--color-foreground)] truncate">{data.nextSIP.name}</p>
              <p className="text-[12px] font-semibold text-[var(--color-gray-1)]">{format(new Date(data.nextSIP.nextDueDate), "dd MMM")}</p>
            </div>
          ) : (
            <div>
              <p className="text-[13px] font-bold text-[var(--color-gray-1)]">No upcoming</p>
            </div>
          )}
        </div>

        {/* Goal Priority */}
        <div onClick={() => navigate('/goals')} className="ios-card p-4 bg-[var(--color-card)] active:scale-[0.98] transition-transform cursor-pointer">
           <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-full bg-[var(--color-brand)]/15 flex items-center justify-center">
              <Target className="h-3.5 w-3.5 text-[var(--color-brand)]" strokeWidth={2.5} />
            </div>
            <p className="text-[12px] font-bold text-[var(--color-gray-1)] uppercase tracking-wide">Next Goal</p>
          </div>
          {data.topGoal ? (
             <div>
              <p className="text-[14px] font-bold text-[var(--color-foreground)] truncate">{data.topGoal.name}</p>
              <div className="w-full bg-[var(--color-gray-6)] h-1.5 rounded-full mt-2">
                <div className="bg-[var(--color-brand)] h-1.5 rounded-full" style={{ width: `${(data.topGoal.currentAmount / data.topGoal.targetAmount) * 100}%`}} />
              </div>
            </div>
          ) : (
             <div>
              <p className="text-[13px] font-bold text-[var(--color-gray-1)]">No active goal</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-2 px-1">
          <h3 className="font-bold text-[14px] text-[var(--color-gray-1)] uppercase tracking-wide">Recent Activity</h3>
          <button onClick={() => navigate('/transactions')} className="text-[12px] font-bold text-[var(--color-brand)] flex items-center">
            View All
          </button>
        </div>
        <div className="ios-list">
          {data.recentTx.map((t) => {
            const isIncome = t.type === "income";
            const isTransfer = t.type === "transfer";
            let iconColor, IconComp;
            
            if (isTransfer) {
              iconColor = "#8E8E93";
              IconComp = ArrowLeftRight;
            } else {
              const cat = categories.find((c) => c.name === t.category);
              IconComp = getIcon(cat?.icon || (isIncome ? "ArrowDownRight" : "Circle"));
              iconColor = cat?.color || (isIncome ? "#34C759" : "#FF3B30");
            }

            return (
              <button key={t.id} onClick={() => openEditSheet(t)} className="ios-list-item px-4 text-left w-full active:bg-[var(--color-gray-5)]">
                <div className="flex h-9 w-9 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: iconColor + "20" }}>
                  <IconComp className="h-4 w-4" style={{ color: iconColor }} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0 px-3">
                  <p className="text-[15px] font-bold truncate text-[var(--color-foreground)]">{t.description || t.category || "Transfer"}</p>
                  <p className="text-[11px] font-semibold text-[var(--color-gray-1)] mt-0.5">
                     {isTransfer ? `${t.fromAccount} → ${t.toAccount}` : (t.account || t.paymentMethod)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn(
                    "text-[15px] font-extrabold sf-rounded",
                    isIncome ? "text-[var(--color-income)]" : (isTransfer ? "text-[var(--color-gray-1)]" : "text-[var(--color-foreground)]")
                  )}>
                    {isIncome ? "+" : (isTransfer ? "" : "-")}{formatCurrency(t.amount)}
                  </p>
                  <p className="text-[11px] font-semibold text-[var(--color-gray-1)] mt-0.5">
                    {isToday(new Date(t.date)) ? "Today" : formatDate(t.date)}
                  </p>
                </div>
              </button>
            );
          })}
          {data.recentTx.length === 0 && (
             <div className="p-6 text-center text-[13px] font-medium text-[var(--color-gray-1)]">
               No transactions yet. Add your first expense!
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
