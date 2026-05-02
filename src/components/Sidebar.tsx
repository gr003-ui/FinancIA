"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CreditCard, BrainCircuit,
  Settings, Wallet, ListOrdered, AlertTriangle,
  TrendingUp, Upload,
} from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';

const Sidebar = () => {
  const pathname = usePathname();
  const { cards } = useFinanceStore();

  const hasLowLimit = cards.some((card) => {
    if (card.type === 'Débito') return false;
    const pct = card.limitOnePayment > 0
      ? (card.availableOnePayment / card.limitOnePayment) * 100
      : 100;
    return pct < 20;
  });

  const menuItems = [
    { name: 'Inicio',        href: '/',             icon: LayoutDashboard, alert: false },
    { name: 'Movimientos',   href: '/movimientos',  icon: ListOrdered,     alert: false },
    { name: 'Proyección',    href: '/proyeccion',   icon: TrendingUp,      alert: false },
    { name: 'Tarjetas',      href: '/tarjetas',     icon: CreditCard,      alert: hasLowLimit },
    { name: 'Importar CSV',  href: '/importar',     icon: Upload,          alert: false },
    { name: 'Analista IA',   href: '/ia',           icon: BrainCircuit,    alert: false },
    { name: 'Configuración', href: '/configuracion',icon: Settings,        alert: false },
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
                  Límite
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="px-2 pt-6 border-t border-white/10">
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">FinancIA v1.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;