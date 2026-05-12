"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ListOrdered, TrendingUp, Target,
  FileText, CreditCard, Upload, BrainCircuit, Settings,
  Menu, X, Plus, Wallet, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import TransactionForm from './TransactionForm';
import UserMenu from './UserMenu';
import { useFinanceStore, getMonthlyAmount } from '../store/useFinanceStore';

// ── Mismos items que el Sidebar de desktop ─────────────────────
const NAV_ITEMS = [
  { name: 'Inicio',        href: '/',              icon: LayoutDashboard },
  { name: 'Movimientos',   href: '/movimientos',   icon: ListOrdered     },
  { name: 'Proyección',    href: '/proyeccion',    icon: TrendingUp      },
  { name: 'Presupuestos',  href: '/presupuestos',  icon: Target          },
  { name: 'Reporte PDF',   href: '/reporte',       icon: FileText        },
  { name: 'Tarjetas',      href: '/tarjetas',      icon: CreditCard      },
  { name: 'Importar CSV',  href: '/importar',      icon: Upload          },
  { name: 'Analista IA',   href: '/ia',            icon: BrainCircuit    },
  { name: 'Configuración', href: '/configuracion', icon: Settings        },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [modalOpen,   setModalOpen]   = useState(false);
  const { budgets, cards, transactions, exchangeRate } = useFinanceStore();

  // ── Alertas (misma lógica que Sidebar) ─────────────────────
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
  const hasLowLimit = cards.some(
    (c) => c.type !== 'Débito' && c.limitOnePayment > 0 &&
      (c.availableOnePayment / c.limitOnePayment) * 100 < 20
  );
  const prevM = thisM === 0 ? 11 : thisM - 1;
  const prevY = thisM === 0 ? thisY - 1 : thisY;
  const fixedLast = transactions.filter((t) => {
    const d = new Date(t.date);
    return t.type === 'income' && d.getMonth() === prevM && d.getFullYear() === prevY;
  });
  const thisMonthDesc = new Set(
    transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === 'income' && d.getMonth() === thisM && d.getFullYear() === thisY;
      })
      .map((t) => t.description.toLowerCase().trim())
  );
  const hasPendingFixed = fixedLast.some(
    (t) => !thisMonthDesc.has(t.description.toLowerCase().trim())
  );

  const alertMap: Record<string, boolean> = {
    '/':            hasPendingFixed,
    '/presupuestos': hasBudgetAlert,
    '/tarjetas':    hasLowLimit,
  };

  const closeDrawer = () => setDrawerOpen(false);
  const closeModal  = () => setModalOpen(false);

  return (
    <>
      {/* ── Top bar mobile ──────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14 border-b border-white/5"
        style={{ backgroundColor: 'rgba(8,10,18,0.97)', backdropFilter: 'blur(20px)' }}
      >
        {/* Hamburger */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 active:bg-white/10 transition-colors"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Menu size={22} />
        </button>

        {/* Logo centrado */}
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-emerald-500" />
          <span className="text-white font-black text-base">FinancIA</span>
        </div>

        {/* User menu */}
        <div className="w-10 h-10 flex items-center justify-center">
          <UserMenu collapsed />
        </div>
      </header>

      {/* Espaciado para que el contenido no quede bajo el header */}
      <div className="h-14" />

      {/* ── Drawer overlay ──────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Fondo oscuro */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
              onClick={closeDrawer}
            />

            {/* Drawer izquierdo */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 z-50 flex flex-col w-72 border-r border-white/10"
              style={{ backgroundColor: '#0d1117' }}
            >
              {/* Header del drawer */}
              <div className="flex items-center justify-between px-5 h-14 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Wallet size={20} className="text-emerald-500" />
                  <span className="text-white font-black text-lg">FinancIA</span>
                </div>
                <button
                  onClick={closeDrawer}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 active:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Nav items */}
              <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                {NAV_ITEMS.map(({ name, href, icon: Icon }) => {
                  const isActive = pathname === href;
                  const hasAlert = alertMap[href] ?? false;

                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={closeDrawer}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-sm transition-colors ${
                        isActive
                          ? 'bg-emerald-500 text-white'
                          : 'text-slate-400 active:bg-slate-800'
                      }`}
                    >
                      <Icon size={19} className="flex-shrink-0" />
                      <span className="flex-1">{name}</span>
                      {hasAlert && !isActive && (
                        <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* User menu abajo */}
              <div className="px-4 py-4 border-t border-white/5 flex-shrink-0">
                <UserMenu collapsed />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── FAB + nuevo movimiento ───────────────────────────── */}
      <motion.button
        onClick={() => setModalOpen(true)}
        whileTap={{ scale: 0.9 }}
        className="fixed z-30 flex items-center justify-center w-14 h-14 rounded-full text-white"
        style={{
          bottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
          right: '1.25rem',
          backgroundColor: '#10b981',
          boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
        }}
      >
        <Plus size={26} />
      </motion.button>

      {/* ── Modal nuevo movimiento ───────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
          >
            <div className="absolute inset-0" onClick={closeModal} />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 340 }}
              className="relative w-full max-w-lg rounded-t-[2rem] border border-white/10 p-6"
              style={{ backgroundColor: '#0d1117', zIndex: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
              <div className="flex justify-between items-center mb-5">
                <p className="text-white font-black text-lg">Nuevo Movimiento</p>
                <button
                  onClick={closeModal}
                  className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl text-white active:bg-white/20 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <TransactionForm onSuccess={closeModal} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}