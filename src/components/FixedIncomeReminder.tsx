"use client";
import { useFinanceStore } from '../store/useFinanceStore';
import { Bell, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useState } from 'react';

export default function FixedIncomeReminder() {
  const { transactions } = useFinanceStore();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const now      = new Date();
  const thisM    = now.getMonth();
  const thisY    = now.getFullYear();
  const prevM    = thisM === 0 ? 11 : thisM - 1;
  const prevY    = thisM === 0 ? thisY - 1 : thisY;

  // Ingresos fijos del mes anterior
  const fixedLast = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      t.type === 'income' &&
      t.incomeType === 'fixed' &&
      d.getMonth() === prevM &&
      d.getFullYear() === prevY
    );
  });

  // Ingresos registrados este mes (por descripción exacta)
  const thisMonthDescriptions = new Set(
    transactions
      .filter((t) => {
        const d = new Date(t.date);
        return (
          t.type === 'income' &&
          d.getMonth() === thisM &&
          d.getFullYear() === thisY
        );
      })
      .map((t) => t.description.toLowerCase().trim())
  );

  // Fijos del mes pasado que NO aparecen este mes
  const missing = fixedLast.filter(
    (t) =>
      !thisMonthDescriptions.has(t.description.toLowerCase().trim()) &&
      !dismissed.includes(t.id)
  );

  if (missing.length === 0) return null;

  const formatM = (v: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
    }).format(v);

  const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun',
                        'Jul','Ago','Sep','Oct','Nov','Dic'];

  return (
    <div className="bg-slate-900 rounded-[3rem] border border-amber-500/20 p-6 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/10 rounded-xl">
          <Bell size={18} className="text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="font-black text-white text-sm">
            Ingresos Fijos Pendientes
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Estos ingresos del mes pasado todavía no fueron registrados este mes
          </p>
        </div>
        <span className="text-[10px] font-black bg-amber-400/10 text-amber-400 px-2 py-1 rounded-full">
          {missing.length}
        </span>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {missing.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-amber-500/20 transition-all"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-white text-xs font-bold leading-tight">
                  {t.description}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Último registro: {MONTHS_SHORT[prevM]} {prevY}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-400">
                {t.currency === 'USD'
                  ? `U$S ${t.amount.toLocaleString('es-AR')}`
                  : formatM(t.amount)}
              </span>
              <button
                onClick={() => setDismissed((prev) => [...prev, t.id])}
                title="Marcar como visto"
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-600 hover:text-slate-400 transition-all"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Acción rápida */}
      <div className="flex items-center gap-2 pt-1">
        <CheckCircle size={12} className="text-slate-600" />
        <p className="text-[10px] text-slate-600">
          Registrá estos ingresos en el formulario o descartá los recordatorios con la ✕
        </p>
      </div>
    </div>
  );
}