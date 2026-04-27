"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CreditCard, BrainCircuit, Settings, Wallet } from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();
  const menuItems = [
    { name: 'Inicio', href: '/', icon: LayoutDashboard },
    { name: 'Tarjetas', href: '/tarjetas', icon: CreditCard },
    { name: 'Analista IA', href: '/ia', icon: BrainCircuit },
    { name: 'Configuración', href: '/configuracion', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 h-screen sticky top-0 p-6 flex flex-col text-white">
      <div className="flex items-center gap-3 mb-10 px-2">
        <Wallet size={24} className="text-emerald-500" />
        <h1 className="text-xl font-black">FinancIA</h1>
      </div>
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          // CORRECCIÓN: Comparar con item.href, no con item.icon
          const isActive = pathname === item.href; 
          return (
            <Link key={item.name} href={item.href}
              className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${
                isActive ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar; // <--- ESTO ELIMINA EL "BUILD ERROR"