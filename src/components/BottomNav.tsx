"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CreditCard, BrainCircuit,
  ListOrdered, Target, TrendingUp, Plus, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import TransactionForm from './TransactionForm';
import { useFinanceStore, getMonthlyAmount } from '../store/useFinanceStore';

const NAV_ITEMS = [
  { href: '/',            label: 'Inicio',     icon: LayoutDashboard },
  { href: '/movimientos', label: 'Movimientos', icon: ListOrdered     },
  { href: '/tarjetas',    label: 'Tarjetas',   icon: CreditCard      },
  { href: '/objetivos',   label: 'Objetivos',  icon: Target          },
  { href: '/ia',          label: 'IA',         icon: BrainCircuit    },
];

export default function BottomNav() {
  const pathname  = usePathname();
  const [open, setOpen] = useState(false);
  const { budgets, cards, transactions, exchangeRate } = useFinanceStore();

  // Badge de alertas
  const now   = new Date();
  const thisM = now.getMonth();
  const thisY = now.getFullYear();
  const toARS = (amount: number, currency: 'ARS' | 'USD') =>
    currency === 'USD' ? amount * exchangeRate : amount;

  const periodExpenses = transactions.filter((t) => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getMonth() === thisM && d.getFullYear() === thisY;
  });
  const hasBudgetAlert = budgets.some((b) => {
    const spent = periodExpenses
      .filter((t) => (t.category ?? 'Otros') === b.category)
      .reduce((s, t) => s + toARS(getMonthlyAmount(t), t.currency), 0);
    return spent >= toARS(b.amount, b.currency) * 0.8;
  });
  const hasCardAlert = cards.some(
    (c) => c.type !== 'Débito' && c.limitOnePayment > 0 &&
      (c.availableOnePayment / c.limitOnePayment) * 100 < 20
  );
  const hasAlert = hasBudgetAlert || hasCardAlert;

  return (
    <>
      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d1117]/95 backdrop-blur-xl border-t border-white/10">
        {/* Safe area para iPhones con home indicator */}
        <div className="flex items-center justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            const showAlert = href === '/tarjetas' && hasAlert;
            return (
              <Link key={href} href={href} className="relative flex flex-col items-center gap-1 px-3 py-1 min-w-[48px]">
                <div className={`relative p-2 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}>
                  <Icon size={20} />
                  {showAlert && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${
                  active ? 'text-emerald-400' : 'text-slate-600'
                }`}>
                  {label}
                </span>
                {active && (
                  <motion.div
                    layoutId="bottom-indicator"
                    className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-[2px] bg-emerald-400 rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* FAB (botón +) — sobre el bottom nav */}
      <motion.button
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.93 }}
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-5 z-50 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 text-white"
      >
        <Plus size={26} />
      </motion.button>

      {/* Modal nuevo movimiento */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0,  opacity: 1 }}
              exit={{   y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-full max-w-md bg-[#0d1117] rounded-t-[2rem] sm:rounded-[2rem] p-6 border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-5">
                <p className="text-white font-black text-lg">Nuevo Movimiento</p>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 bg-white/10 rounded-xl text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <TransactionForm onSuccess={() => setOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Espaciado para que el contenido no quede bajo el nav */}
      <div className="h-[calc(4rem+env(safe-area-inset-bottom))]" />
    </>
  );
}