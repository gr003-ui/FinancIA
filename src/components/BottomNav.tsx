"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CreditCard, BrainCircuit,
  ListOrdered, Target, Plus, X,
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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { budgets, cards, transactions, exchangeRate } = useFinanceStore();

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

  const handleClose = () => setOpen(false);

  return (
    <>
      {/* ── Modal nuevo movimiento ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
          >
            {/* Tap fuera para cerrar */}
            <div className="absolute inset-0" onClick={handleClose} />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 340 }}
              className="relative w-full max-w-lg rounded-t-[2rem] border border-white/10 p-6"
              style={{ backgroundColor: '#0d1117', zIndex: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle visual */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

              <div className="flex justify-between items-center mb-5">
                <p className="text-white font-black text-lg">Nuevo Movimiento</p>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl text-white active:bg-white/20 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <TransactionForm onSuccess={handleClose} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB + ── */}
      <motion.button
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.9 }}
        className="fixed z-40 flex items-center justify-center w-14 h-14 rounded-full text-white"
        style={{
          bottom: 'calc(4.5rem + env(safe-area-inset-bottom))',
          right: '1.25rem',
          backgroundColor: '#10b981',
          boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
        }}
      >
        <Plus size={26} />
      </motion.button>

      {/* ── Bottom Nav Bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10"
        style={{ backgroundColor: 'rgba(8,10,18,0.97)', backdropFilter: 'blur(20px)' }}
      >
        <div
          className="flex items-center justify-around px-1"
          style={{
            paddingTop: '0.5rem',
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          }}
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active    = pathname === href;
            const showAlert = href === '/tarjetas' && hasAlert;

            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-col items-center gap-1 flex-1 py-1"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-[0.5rem] left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full"
                    style={{ backgroundColor: '#10b981' }}
                  />
                )}

                <div
                  className="relative flex items-center justify-center w-10 h-10 rounded-2xl transition-colors duration-150"
                  style={{
                    backgroundColor: active ? 'rgba(16,185,129,0.12)' : 'transparent',
                    color: active ? '#10b981' : '#64748b',
                  }}
                >
                  <Icon size={20} />
                  {showAlert && (
                    <span
                      className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                      style={{ backgroundColor: '#f43f5e' }}
                    />
                  )}
                </div>

                <span
                  className="text-[10px] font-semibold leading-none"
                  style={{ color: active ? '#10b981' : '#475569' }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Espaciado para que el contenido no quede tapado por el nav */}
      <div style={{ height: 'calc(4rem + env(safe-area-inset-bottom))' }} />
    </>
  );
}