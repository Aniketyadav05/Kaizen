/**
 * Kaizen — SIPs Page
 * 
 * SIP management dashboard:
 * - Total Invested
 * - Due/overdue reminders at top
 * - Active SIPs list with status
 * - Add SIP bottom sheet
 * - Mark as paid action
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Check, Repeat, AlertTriangle, Clock, Calendar, Trash2, TrendingUp, DollarSign } from "lucide-react";
import useSIPStore from "@/stores/useSIPStore";
import useTransactionStore from "@/stores/useTransactionStore";
import { formatCurrency, cn } from "@/lib/utils";
import { format, isBefore, isEqual, startOfDay } from "date-fns";
import { SIP_FREQUENCIES } from "@/lib/seedData";

export default function SIPs() {
  const sips = useSIPStore((s) => s.sips);
  const addSIP = useSIPStore((s) => s.addSIP);
  const deleteSIP = useSIPStore((s) => s.deleteSIP);
  const markSIPPaid = useSIPStore((s) => s.markSIPPaid);
  const toggleSIP = useSIPStore((s) => s.toggleSIP);
  const getMonthlyTotal = useSIPStore((s) => s.getMonthlyTotal);
  const transactions = useTransactionStore((s) => s.transactions);
  
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "", amount: "", frequency: "monthly", dayOfMonth: "1",
    fundName: "", notes: "",
  });
  const [formError, setFormError] = useState("");

  const today = startOfDay(new Date());

  const totalInvested = useMemo(() => {
    return transactions
      .filter(t => t.budgetType === "Saving" || t.category === "SIP" || t.category === "Mutual Funds")
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions]);

  const categorized = useMemo(() => {
    const overdue = [];
    const dueToday = [];
    const upcoming = [];
    const inactive = [];

    sips.forEach((sip) => {
      if (!sip.isActive) {
        inactive.push(sip);
        return;
      }
      const due = startOfDay(new Date(sip.nextDueDate));
      if (isBefore(due, today)) {
        overdue.push(sip);
      } else if (isEqual(due, today)) {
        dueToday.push(sip);
      } else {
        upcoming.push(sip);
      }
    });

    upcoming.sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate));
    return { overdue, dueToday, upcoming, inactive };
  }, [sips, today]);

  const monthlyTotal = getMonthlyTotal();

  const handleAdd = () => {
    setFormError("");
    if (!formData.name.trim()) { setFormError("SIP name is required"); return; }
    if (!formData.amount || Number(formData.amount) <= 0) { setFormError("Valid amount is required"); return; }
    const day = Number(formData.dayOfMonth);
    if (day < 1 || day > 28) { setFormError("Day must be between 1 and 28"); return; }

    addSIP({
      name: formData.name.trim(),
      amount: Number(formData.amount),
      frequency: formData.frequency,
      dayOfMonth: day,
      fundName: formData.fundName.trim(),
      notes: formData.notes.trim(),
    });
    setFormData({ name: "", amount: "", frequency: "monthly", dayOfMonth: "1", fundName: "", notes: "" });
    setShowAddSheet(false);
  };

  const getSIPStatus = (sip) => {
    if (!sip.isActive) return { label: "Paused", class: "bg-[var(--color-gray-5)] text-[var(--color-gray-1)]" };
    const due = startOfDay(new Date(sip.nextDueDate));
    if (isBefore(due, today)) return { label: "Overdue", class: "sip-badge-overdue" };
    if (isEqual(due, today)) return { label: "Due Today", class: "sip-badge-due" };
    return { label: format(new Date(sip.nextDueDate), "dd MMM"), class: "sip-badge-paid" };
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="large-title m-0">SIPs</h1>
        <button
          onClick={() => setShowAddSheet(true)}
          className="h-8 w-8 rounded-full bg-[var(--color-gray-5)] flex items-center justify-center text-[var(--color-brand)] active:opacity-70 transition-opacity"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Monthly Total Card */}
        <div className="ios-card bg-[var(--color-saving)] border-none p-4 text-white relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-6 -mt-6 blur-xl"></div>
          <p className="text-white/80 font-bold uppercase tracking-wider text-[11px] mb-1">Monthly SIP</p>
          <h2 className="sf-rounded text-2xl font-extrabold tracking-tight">
            {formatCurrency(Math.round(monthlyTotal), true)}
          </h2>
        </div>

        {/* Total Invested */}
        <div className="ios-card bg-[var(--color-brand)] border-none p-4 text-white relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-6 -mt-6 blur-xl"></div>
          <p className="text-white/80 font-bold uppercase tracking-wider text-[11px] mb-1">Total Invested</p>
          <h2 className="sf-rounded text-2xl font-extrabold tracking-tight">
            {formatCurrency(totalInvested, true)}
          </h2>
        </div>
      </div>

      {/* Missed / Overdue SIPs */}
      {categorized.overdue.length > 0 && (
        <div>
          <h2 className="text-[13px] font-bold text-[var(--color-expense)] uppercase tracking-wide mb-1.5 px-2 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" strokeWidth={2.5} /> Missed SIPs
          </h2>
          <div className="ios-list border border-[var(--color-expense)]/20 shadow-sm">
            {categorized.overdue.map((sip) => (
              <SIPRow key={sip.id} sip={sip} status={getSIPStatus(sip)} expanded={expandedId === sip.id}
                onToggleExpand={() => setExpandedId(expandedId === sip.id ? null : sip.id)}
                onMarkPaid={() => markSIPPaid(sip.id)} onDelete={() => deleteSIP(sip.id)}
                onToggle={() => toggleSIP(sip.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Due Today */}
      {categorized.dueToday.length > 0 && (
        <div>
          <h2 className="text-[13px] font-bold text-[var(--color-warning)] uppercase tracking-wide mb-1.5 px-2 flex items-center gap-1.5">
            <Clock className="h-4 w-4" strokeWidth={2.5} /> Due Today
          </h2>
          <div className="ios-list border border-[var(--color-warning)]/20 shadow-sm">
            {categorized.dueToday.map((sip) => (
              <SIPRow key={sip.id} sip={sip} status={getSIPStatus(sip)} expanded={expandedId === sip.id}
                onToggleExpand={() => setExpandedId(expandedId === sip.id ? null : sip.id)}
                onMarkPaid={() => markSIPPaid(sip.id)} onDelete={() => deleteSIP(sip.id)}
                onToggle={() => toggleSIP(sip.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {categorized.upcoming.length > 0 && (
        <div>
          <h2 className="text-[12px] font-bold text-[var(--color-gray-1)] uppercase tracking-wider mb-1.5 px-2">Upcoming</h2>
          <div className="ios-list">
            {categorized.upcoming.map((sip) => (
              <SIPRow key={sip.id} sip={sip} status={getSIPStatus(sip)} expanded={expandedId === sip.id}
                onToggleExpand={() => setExpandedId(expandedId === sip.id ? null : sip.id)}
                onMarkPaid={() => markSIPPaid(sip.id)} onDelete={() => deleteSIP(sip.id)}
                onToggle={() => toggleSIP(sip.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Inactive/Paused */}
      {categorized.inactive.length > 0 && (
        <div>
          <h2 className="text-[12px] font-bold text-[var(--color-gray-1)] uppercase tracking-wider mb-1.5 px-2">Paused</h2>
          <div className="ios-list opacity-75">
            {categorized.inactive.map((sip) => (
              <SIPRow key={sip.id} sip={sip} status={getSIPStatus(sip)} expanded={expandedId === sip.id}
                onToggleExpand={() => setExpandedId(expandedId === sip.id ? null : sip.id)}
                onMarkPaid={() => markSIPPaid(sip.id)} onDelete={() => deleteSIP(sip.id)}
                onToggle={() => toggleSIP(sip.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {sips.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-saving)]/20 mx-auto mb-4">
            <TrendingUp className="h-8 w-8 text-[var(--color-saving)]" />
          </div>
          <h3 className="text-[17px] font-bold mb-1">No SIPs Yet</h3>
          <p className="text-[14px] font-medium text-[var(--color-gray-1)] mb-4">
            Start tracking your systematic investments
          </p>
          <button onClick={() => setShowAddSheet(true)} className="duo-btn duo-btn-primary !text-[14px] !py-2.5 !px-6">
            Add First SIP
          </button>
        </div>
      )}

      {/* Add SIP Sheet */}
      <AnimatePresence>
        {showAddSheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={() => setShowAddSheet(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 350 }} className="fixed bottom-0 left-0 right-0 z-[101] max-h-[85vh] overflow-y-auto rounded-t-[28px] bg-[var(--color-background)] shadow-2xl" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
              <div className="px-5 pb-6">
                <div className="flex justify-center pt-3 pb-1"><div className="h-1.5 w-12 rounded-full bg-[var(--color-gray-4)]" /></div>
                <div className="flex items-center justify-between mb-5 mt-1">
                  <h2 className="text-2xl font-bold font-['Clash_Grotesk']">New SIP</h2>
                  <button onClick={() => setShowAddSheet(false)} className="h-8 w-8 rounded-full bg-[var(--color-gray-5)] flex items-center justify-center text-[var(--color-gray-1)] active:scale-95"><X className="h-5 w-5" strokeWidth={3} /></button>
                </div>
                <div className="space-y-4">
                  <input placeholder="SIP Name (e.g. Nifty 50)" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[var(--color-gray-5)] rounded-xl p-3.5 text-[15px] font-bold outline-none focus:ring-2 focus:ring-[var(--color-brand)] placeholder:text-[var(--color-gray-2)]" />
                  <div className="text-center py-1">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-3xl font-bold text-[var(--color-gray-2)]">₹</span>
                      <input type="number" placeholder="0" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="text-[56px] sf-rounded font-extrabold bg-transparent outline-none text-center w-full placeholder:text-[var(--color-gray-4)] text-[var(--color-saving)]" />
                    </div>
                  </div>
                  <input placeholder="Fund/Platform (e.g. Zerodha)" value={formData.fundName} onChange={(e) => setFormData({...formData, fundName: e.target.value})} className="w-full bg-[var(--color-gray-5)] rounded-xl p-3.5 text-[15px] font-bold outline-none focus:ring-2 focus:ring-[var(--color-brand)] placeholder:text-[var(--color-gray-2)]" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[var(--color-gray-5)] rounded-xl p-3 flex items-center gap-2">
                      <Repeat className="h-4 w-4 text-[var(--color-gray-1)] shrink-0" />
                      <select value={formData.frequency} onChange={(e) => setFormData({...formData, frequency: e.target.value})} className="bg-transparent border-none outline-none font-bold text-[14px] w-full appearance-none">
                        {SIP_FREQUENCIES.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                      </select>
                    </div>
                    <div className="bg-[var(--color-gray-5)] rounded-xl p-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[var(--color-gray-1)] shrink-0" />
                      <input type="number" placeholder="Day" min="1" max="28" value={formData.dayOfMonth} onChange={(e) => setFormData({...formData, dayOfMonth: e.target.value})} className="bg-transparent border-none outline-none font-bold text-[14px] w-full" />
                      <span className="text-[12px] font-bold text-[var(--color-gray-1)] shrink-0">of month</span>
                    </div>
                  </div>
                  {formError && <p className="text-[13px] font-bold text-[var(--color-expense)] text-center">{formError}</p>}
                  <button onClick={handleAdd} className="w-full duo-btn duo-btn-primary !text-lg !py-4 mt-2">Add SIP</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SIPRow({ sip, status, expanded, onToggleExpand, onMarkPaid, onDelete, onToggle }) {
  return (
    <div className="flex flex-col border-b border-[var(--color-border)] last:border-0">
      <button onClick={onToggleExpand} className={cn("ios-list-item gap-3 border-0 active:bg-[var(--color-gray-5)]", !sip.isActive && "opacity-60")}>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-saving)]/15 shrink-0">
          <TrendingUp className="h-5 w-5 text-[var(--color-saving)]" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[15px] font-bold truncate text-[var(--color-foreground)]">{sip.name}</p>
          <p className="text-[12px] font-semibold text-[var(--color-gray-1)] mt-0.5">
            {sip.fundName || sip.frequency === "quarterly" ? "Quarterly" : "Monthly"}
            {sip.fundName && ` • ${sip.fundName}`}
          </p>
        </div>
        <div className="text-right shrink-0 flex flex-col items-end gap-1">
          <p className="text-[15px] font-extrabold sf-rounded text-[var(--color-foreground)]">{formatCurrency(sip.amount)}</p>
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", status.class)}>{status.label}</span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-[var(--color-gray-6)] shadow-inner">
            <div className="px-4 pb-3 pt-2 flex items-center justify-between">
              <p className="text-[11px] font-bold text-[var(--color-gray-1)] uppercase tracking-wider">
                Due {sip.dayOfMonth}{getOrdinal(sip.dayOfMonth)}
                {sip.lastPaidDate && ` • Paid ${format(new Date(sip.lastPaidDate), "dd MMM")}`}
              </p>
              <div className="flex gap-2">
                {sip.isActive && (
                  <button onClick={(e) => { e.stopPropagation(); onMarkPaid(); }} className="bg-[var(--color-income)]/10 text-[var(--color-income)] px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95 transition-transform">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Paid</span>
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="bg-[var(--color-brand)]/10 text-[var(--color-brand)] px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95 transition-transform">
                  <Repeat className="h-3.5 w-3.5" strokeWidth={3} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">{sip.isActive ? "Pause" : "Resume"}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="bg-[var(--color-expense)]/10 text-[var(--color-expense)] p-1.5 rounded-full flex items-center justify-center active:scale-95 transition-transform">
                  <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
