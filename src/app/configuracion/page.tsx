"use client";
import { useState } from 'react';
import { useFinanceStore, AccentTheme } from '../../store/useFinanceStore';
import { User, ShieldCheck, Bell, CreditCard, Save, AlertTriangle, DollarSign, Palette } from 'lucide-react';

const THEMES: { id: AccentTheme; label: string; color: string; bg: string }[] = [
  { id: 'emerald', label: 'Esmeralda', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  { id: 'blue',    label: 'Azul',      color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  { id: 'purple',  label: 'Violeta',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  { id: 'rose',    label: 'Rosa',      color: '#f43f5e', bg: 'rgba(244,63,94,0.15)'  },
  { id: 'amber',   label: 'Ámbar',     color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  { id: 'cyan',    label: 'Cyan',      color: '#06b6d4', bg: 'rgba(6,182,212,0.15)'  },
];

export default function ConfigPage() {
  const {
    cards, transactions, userName, exchangeRate, accentTheme,
    setUserName, setExchangeRate, setAccentTheme, resetAll,
  } = useFinanceStore();

  const [nameInput,    setNameInput]    = useState(userName);
  const [rateInput,    setRateInput]    = useState(String(exchangeRate));
  const [confirmReset, setConfirmReset] = useState(false);
  const [savedName,    setSavedName]    = useState(false);
  const [savedRate,    setSavedRate]    = useState(false);

  const handleSaveName = () => {
    if (!nameInput.trim()) return;
    setUserName(nameInput.trim());
    setSavedName(true);
    setTimeout(() => setSavedName(false), 2000);
  };

  const handleSaveRate = () => {
    const rate = Number(rateInput);
    if (!rate || rate <= 0) return;
    setExchangeRate(rate);
    setSavedRate(true);
    setTimeout(() => setSavedRate(false), 2000);
  };

  const handleReset = () => {
    resetAll();
    setConfirmReset(false);
  };

  return (
    <main className="p-10 max-w-4xl mx-auto space-y-10">
      <header>
        <h1 className="text-4xl font-black text-white tracking-tighter">Configuración</h1>
        <p className="text-slate-500 font-medium">Gestioná tu perfil y preferencias de la cuenta.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* PERFIL */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-900 rounded-[3rem] p-8 border border-white/10 text-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: `rgba(var(--accent-muted))`, color: 'var(--accent-text)' }}>
              <User size={48} />
            </div>
            <h2 className="text-2xl font-black text-white">{userName}</h2>
            <p className="text-slate-500 font-medium text-sm mb-6">hola@financia.com</p>
            <span className="px-4 py-1.5 text-[10px] font-black uppercase rounded-full tracking-widest"
              style={{ background: 'var(--accent-muted)', color: 'var(--accent-text)' }}>
              Plan Pro
            </span>
          </div>

          <div className="rounded-[2.5rem] p-6 text-white shadow-lg"
            style={{ background: 'var(--accent)', boxShadow: `0 10px 30px var(--accent-shadow)` }}>
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

        {/* OPCIONES */}
        <div className="md:col-span-2 space-y-4">

          {/* TEMA DE COLOR */}
          <div className="bg-slate-900 rounded-[3rem] p-8 border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl" style={{ background: 'var(--accent-muted)' }}>
                <Palette size={20} style={{ color: 'var(--accent-text)' }} />
              </div>
              <div>
                <p className="font-bold text-white">Color de Acento</p>
                <p className="text-xs text-slate-500">Personalizá la paleta de colores de la app.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setAccentTheme(theme.id)}
                  title={theme.label}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all focus:outline-none focus:ring-2 ${
                    accentTheme === theme.id
                      ? 'border-white/30 scale-105'
                      : 'border-white/5 hover:border-white/15'
                  }`}
                  style={{
                    background: accentTheme === theme.id ? theme.bg : 'rgba(255,255,255,0.03)',
                    ...(accentTheme === theme.id ? { boxShadow: `0 0 0 2px ${theme.color}40` } : {}),
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full shadow-lg"
                    style={{ background: theme.color, boxShadow: `0 4px 12px ${theme.color}50` }}
                  />
                  <span className="text-[9px] font-black uppercase tracking-wider"
                    style={{ color: accentTheme === theme.id ? theme.color : '#64748b' }}>
                    {theme.label}
                  </span>
                  {accentTheme === theme.id && (
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                      style={{ background: theme.color }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* NOMBRE */}
          <div className="bg-slate-900 rounded-[3rem] p-8 border border-white/10 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl" style={{ background: 'var(--accent-muted)' }}>
                <User size={20} style={{ color: 'var(--accent-text)' }} />
              </div>
              <div>
                <p className="font-bold text-white">Nombre de Usuario</p>
                <p className="text-xs text-slate-500">Se muestra en el perfil y reportes.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="flex-1 bg-white/5 border border-white/10 text-white p-3 rounded-2xl outline-none transition-all text-sm font-bold placeholder:text-slate-600 focus:border-white/30"
                placeholder="Tu nombre"
              />
              <button
                onClick={handleSaveName}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-black text-xs uppercase transition-all ${
                  savedName ? 'text-white border border-white/20' : 'text-white'
                }`}
                style={{
                  background: savedName ? 'var(--accent-muted)' : 'var(--accent)',
                  ...(savedName ? { borderColor: 'var(--accent-border)' } : {}),
                }}
              >
                <Save size={14} />
                {savedName ? '¡Guardado!' : 'Guardar'}
              </button>
            </div>
          </div>

          {/* COTIZACIÓN */}
          <div className="bg-slate-900 rounded-[3rem] p-8 border border-white/10 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="font-bold text-white">Cotización USD/ARS</p>
                <p className="text-xs text-slate-500">Valor por defecto para la pesificación.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 focus-within:border-amber-500/50 transition-all">
                <span className="text-amber-400 font-black mr-2">$</span>
                <input
                  type="number"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveRate()}
                  className="flex-1 bg-transparent text-white p-3 outline-none text-sm font-bold"
                />
              </div>
              <button
                onClick={handleSaveRate}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-black text-xs uppercase transition-all ${
                  savedRate
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-amber-500 text-white hover:bg-amber-400'
                }`}
              >
                <Save size={14} />
                {savedRate ? '¡Guardado!' : 'Guardar'}
              </button>
            </div>
          </div>

          {/* OTROS BOTONES */}
          <div className="bg-slate-900 rounded-[3rem] p-8 border border-white/10 space-y-2">
            <button className="w-full flex items-center p-5 hover:bg-white/5 rounded-2xl transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <ShieldCheck size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">Seguridad y Privacidad</p>
                  <p className="text-xs text-slate-500">Cambiá tu contraseña y protegé tus datos.</p>
                </div>
              </div>
            </button>

            <button className="w-full flex items-center p-5 hover:bg-white/5 rounded-2xl transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <Bell size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">Notificaciones</p>
                  <p className="text-xs text-slate-500">Alertas de vencimientos y gastos altos.</p>
                </div>
              </div>
            </button>

            <button className="w-full flex items-center p-5 hover:bg-white/5 rounded-2xl transition-all group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <CreditCard size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">Suscripción</p>
                  <p className="text-xs text-slate-500">Gestioná tu método de pago de FinancIA.</p>
                </div>
              </div>
            </button>
          </div>

          {/* RESET */}
          <div className="bg-slate-900 rounded-[3rem] p-8 border border-rose-500/20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="font-bold text-white">Zona de Peligro</p>
                <p className="text-xs text-slate-500">
                  Borra todos los movimientos y restaura los límites de tarjetas.
                </p>
              </div>
            </div>
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full p-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rose-500/20 transition-all"
              >
                Resetear todos los datos
              </button>
            ) : (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 space-y-3">
                <p className="text-rose-300 font-bold text-sm text-center">
                  ¿Estás seguro? Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 p-3 bg-white/5 text-slate-400 rounded-xl font-black text-xs uppercase hover:bg-white/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 p-3 bg-rose-500 text-white rounded-xl font-black text-xs uppercase hover:bg-rose-400 transition-all"
                  >
                    Sí, resetear
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}