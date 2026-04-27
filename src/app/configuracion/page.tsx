"use client";
import { useFinanceStore } from '../../store/useFinanceStore';
import { User, LogOut, ShieldCheck, Bell, CreditCard } from 'lucide-react';

export default function ConfigPage() {
  const { cards, transactions } = useFinanceStore();

  const user = {
    name: 'Usuario FinancIA',
    email: 'hola@financia.com',
    plan: 'Pro',
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <main className="p-10 max-w-4xl mx-auto space-y-10">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Configuración</h1>
        <p className="text-slate-500 font-medium">Gestioná tu perfil y preferencias de la cuenta.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* PERFIL DEL USUARIO */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl text-center">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <User size={48} />
            </div>
            <h2 className="text-2xl font-black text-slate-900">{user.name}</h2>
            <p className="text-slate-400 font-medium text-sm mb-6">{user.email}</p>
            <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase rounded-full tracking-widest">
              Plan {user.plan}
            </span>
          </div>

          <div className="bg-emerald-600 rounded-[2.5rem] p-6 text-white shadow-lg">
            <p className="text-xs font-bold opacity-80 uppercase mb-2">Estadísticas rápidas</p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-black">{cards.length}</p>
                <p className="text-[10px] opacity-70">Tarjetas Activas</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black">{transactions.length}</p>
                <p className="text-[10px] opacity-70">Movimientos</p>
              </div>
            </div>
          </div>
        </div>

        {/* OPCIONES DE CONFIGURACIÓN */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm space-y-2">

            <button className="w-full flex items-center justify-between p-5 hover:bg-slate-50 rounded-2xl transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <ShieldCheck size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800">Seguridad y Privacidad</p>
                  <p className="text-xs text-slate-400">Cambiá tu contraseña y protegé tus datos.</p>
                </div>
              </div>
            </button>

            <button className="w-full flex items-center justify-between p-5 hover:bg-slate-50 rounded-2xl transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <Bell size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800">Notificaciones</p>
                  <p className="text-xs text-slate-400">Alertas de vencimientos y gastos altos.</p>
                </div>
              </div>
            </button>

            <button className="w-full flex items-center justify-between p-5 hover:bg-slate-50 rounded-2xl transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <CreditCard size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800">Suscripción</p>
                  <p className="text-xs text-slate-400">Gestioná tu método de pago de FinancIA.</p>
                </div>
              </div>
            </button>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 p-5 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all font-black uppercase text-xs tracking-widest justify-center"
              >
                <LogOut size={18} />
                Cerrar Sesión de la Cuenta
              </button>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}