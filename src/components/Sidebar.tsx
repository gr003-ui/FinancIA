"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CreditCard, BrainCircuit, Settings,
  Wallet, ListOrdered, AlertTriangle, TrendingUp,
  Upload, Target,
} from 'lucide-react';
import { useFinanceStore, getMonthlyAmount } from '../store/useFinanceStore';

const Sidebar = () => {
  const pathname = usePathname();
  const { cards, budgets, transactions, exchangeRate } = useFinanceStore();

  const now  = new Date();
  const thisM = now.getMonth();
  const thisY = now.getFullYear();
  const prevM = thisM === 0 ? 11 : thisM - 1;
  const prevY = thisM === 0 ? thisY - 1 : thisY;

  // Alerta de límite bajo en tarjetas
  const hasLowLimit = cards.some((card) => {
    if (card.type === 'Débito') return false;
    return (
      card.limitOnePayment > 0 &&
      (card.availableOnePayment / card.limitOnePayment) * 100 < 20
    );
  });

  const toARS = (amount: number, currency: 'ARS' | 'USD') =>
    currency === 'USD' ? amount * exchangeRate : amount;

  // Gastos del mes actual para calcular alertas de presupuesto
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

  // Recordatorios de ingresos fijos pendientes
  const fixedLast = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      t.type === 'income' &&
      t.incomeType === 'fixed' &&
      d.getMonth() === prevM &&
      d.getFullYear() === prevY
    );
  });

  const thisMonthDescriptions = new Set(
    transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === 'income' && d.getMonth() === thisM && d.getFullYear() === thisY;
      })
      .map((t) => t.description.toLowerCase().trim())
  );

  const hasPendingFixed = fixedLast.some(
    (t) => !thisMonthDescriptions.has(t.description.toLowerCase().trim())
  );

  const menuItems = [
    { name: 'Inicio',        href: '/',              icon: LayoutDashboard, alert: hasPendingFixed },
    { name: 'Movimientos',   href: '/movimientos',   icon: ListOrdered,     alert: false },
    { name: 'Proyección',    href: '/proyeccion',    icon: TrendingUp,      alert: false },
    { name: 'Presupuestos',  href: '/presupuestos',  icon: Target,          alert: hasBudgetAlert },
    { name: 'Tarjetas',      href: '/tarjetas',      icon: CreditCard,      alert: hasLowLimit },
    { name: 'Importar CSV',  href: '/importar',      icon: Upload,          alert: false },
    { name: 'Analista IA',   href: '/ia',            icon: BrainCircuit,    alert: false },
    { name: 'Configuración', href: '/configuracion', icon: Settings,        alert: false },
  ];

  return (
    <aside className="w-64 bg-slate-900 h-screen sticky top-0 p-6 flex flex-col text-white border-r border-white/5">
      <div className="flex items-center gap-3 mb-10 px-2">
        <Wallet size={24} className="text-emerald-500" />
        <h1 className="text-xl font-black">FinancIA</h1>
      </div>
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon     = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all relative ${
                isActive
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
              {item.alert && !isActive && (
                <span className="ml-auto flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                  <AlertTriangle size={10} />
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="px-2 pt-6 border-t border-white/10">
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          FinancIA v1.0
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;