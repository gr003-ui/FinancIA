"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CreditCard, BrainCircuit, Settings,
  Wallet, ListOrdered, AlertTriangle, TrendingUp,
  Upload, Target, FileText, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useFinanceStore, getMonthlyAmount } from '../store/useFinanceStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const Sidebar = () => {
  const pathname = usePathname();
  const { cards, budgets, transactions, exchangeRate } = useFinanceStore();

  const [collapsed, setCollapsed] = useState(false);

  // Persistir estado de colapso en localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) setCollapsed(saved === 'true');
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      localStorage.setItem('sidebar-collapsed', String(!prev));
      return !prev;
    });
  };

  const now   = new Date();
  const thisM = now.getMonth();
  const thisY = now.getFullYear();
  const prevM = thisM === 0 ? 11 : thisM - 1;
  const prevY = thisM === 0 ? thisY - 1 : thisY;

  const hasLowLimit = cards.some((card) => {
    if (card.type === 'Débito') return false;
    return (
      card.limitOnePayment > 0 &&
      (card.availableOnePayment / card.limitOnePayment) * 100 < 20
    );
  });

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

  const fixedLast = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      t.type === 'income' &&
      t.incomeType === 'fixed' &&
      d.getMonth() === prevM &&
      d.getFullYear() === prevY
    );
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

  const menuItems = [
    { name: 'Inicio',        href: '/',              icon: LayoutDashboard, alert: hasPendingFixed },
    { name: 'Movimientos',   href: '/movimientos',   icon: ListOrdered,     alert: false },
    { name: 'Proyección',    href: '/proyeccion',    icon: TrendingUp,      alert: false },
    { name: 'Presupuestos',  href: '/presupuestos',  icon: Target,          alert: hasBudgetAlert },
    { name: 'Reporte PDF',   href: '/reporte',       icon: FileText,        alert: false },
    { name: 'Tarjetas',      href: '/tarjetas',      icon: CreditCard,      alert: hasLowLimit },
    { name: 'Importar CSV',  href: '/importar',      icon: Upload,          alert: false },
    { name: 'Analista IA',   href: '/ia',            icon: BrainCircuit,    alert: false },
    { name: 'Configuración', href: '/configuracion', icon: Settings,        alert: false },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-slate-900 h-screen sticky top-0 flex flex-col text-white border-r border-white/5 overflow-hidden flex-shrink-0"
    >
      {/* Logo + toggle */}
      <div className={`flex items-center h-20 px-4 flex-shrink-0 ${collapsed ? 'justify-center' : 'justify-between px-6'}`}>
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="full-logo"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <Wallet size={24} className="text-emerald-500 flex-shrink-0" />
              <span className="text-xl font-black whitespace-nowrap">FinancIA</span>
            </motion.div>
          ) : (
            <motion.div
              key="icon-logo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Wallet size={24} className="text-emerald-500" />
            </motion.div>
          )}
        </AnimatePresence>

        {!collapsed && (
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-all flex-shrink-0"
            title="Colapsar sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const Icon     = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={`flex items-center rounded-2xl font-bold transition-all relative group ${
                collapsed ? 'justify-center p-3' : 'gap-3 p-3.5'
              } ${
                isActive
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="relative flex-shrink-0">
                <Icon size={20} />
                {/* Badge de alerta en modo compacto */}
                {item.alert && !isActive && collapsed && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
                )}
              </div>

              {/* Label animado */}
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm whitespace-nowrap overflow-hidden"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Badge de alerta en modo expandido */}
              {item.alert && !isActive && !collapsed && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="ml-auto flex-shrink-0"
                >
                  <AlertTriangle size={12} className="text-amber-400" />
                </motion.span>
              )}

              {/* Tooltip en modo compacto */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 border border-white/10 text-white text-xs font-bold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                  {item.name}
                  {item.alert && (
                    <span className="ml-2 text-amber-400">●</span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-white/10 flex-shrink-0 ${collapsed ? 'py-4 flex justify-center' : 'p-4'}`}>
        {collapsed ? (
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-all"
            title="Expandir sidebar"
          >
            <ChevronRight size={16} />
          </button>
        ) : (
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            FinancIA v1.0
          </p>
        )}
      </div>
    </motion.aside>
  );
};

export default Sidebar;