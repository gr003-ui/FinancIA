"use client";
import { useFinanceStore, getMonthlyAmount, CATEGORIES, TransactionCategory } from '../store/useFinanceStore';
import { AlertTriangle, CheckCircle, Target } from 'lucide-react';

interface BudgetPanelProps {
  month?: number;
  year?: number;
}

const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  Alimentación:    '#10b981',
  Transporte:      '#3b82f6',
  Servicios:       '#f59e0b',
  Salud:           '#ec4899',
  Entretenimiento: '#8b5cf6',
  Indumentaria:    '#f43f5e',
  Educación:       '#06b6d4',
  Viajes:          '#84cc16',
  Hogar:           '#fb923c',
  Otros:           '#94a3b8',
};

export default function BudgetPanel({ month, year }: BudgetPanelProps) {
  const { transactions, budgets, exchangeRate } = useFinanceStore();

  const now = new Date();
  const m   = month ?? now.getMonth();
  const y   = year  ?? now.getFullYear();

  const toARS = (amount: number, currency: 'ARS' | 'USD') =>
    currency === 'USD' ? amount * exchangeRate : amount;

  const formatM = (v: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
    }).format(v);

  const periodExpenses = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      t.type === 'expense' &&
      d.getMonth() === m &&
      d.getFullYear() === y
    );
  });

  // Gasto real por categoría en el período
  const spentByCategory = CATEGORIES.reduce<Record<TransactionCategory, number>>(
    (acc, cat) => {
      acc[cat] = periodExpenses
        .filter((t) => (t.category ?? 'Otros') === cat)
        .reduce((s, t) => s + toARS(getMonthlyAmount(t), t.currency), 0);
      return acc;
    },
    {} as Record<TransactionCategory, number>
  );

  if (budgets.length === 0) {
    return (
      <div className="bg-slate-900 p-8 rounded-[3rem] border border-white/10 text-center space-y-3">
        <Target size={32} className="text-slate-600 mx-auto" />
        <p className="text-slate-500 italic text-sm">
          No hay presupuestos configurados.
          <br />Andá a <strong className="text-slate-400">Presupuestos</strong> para definirlos.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 p-8 rounded-[3rem] border border-white/10 space-y-5">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
        Presupuestos del Mes
      </p>
      <div className="space-y-4">
        {budgets.map((budget) => {
          const spent    = spentByCategory[budget.category] ?? 0;
          const limit    = toARS(budget.amount, budget.currency);
          const pct      = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
          const over     = spent > limit;
          const warning  = pct >= 80 && !over;
          const color    = CATEGORY_COLORS[budget.category];

          return (
            <div key={budget.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {over
                    ? <AlertTriangle size={14} className="text-rose-400" />
                    : warning
                    ? <AlertTriangle size={14} className="text-amber-400" />
                    : <CheckCircle  size={14} className="text-slate-600" />
                  }
                  <span className="text-sm font-bold text-white">{budget.category}</span>
                </div>
                <div className="text-right">
                  <span
                    className="text-xs font-black"
                    style={{ color: over ? '#f43f5e' : warning ? '#f59e0b' : color }}
                  >
                    {formatM(spent)}
                  </span>
                  <span className="text-[10px] text-slate-600"> / {formatM(limit)}</span>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: over ? '#f43f5e' : warning ? '#f59e0b' : color,
                    boxShadow: over ? '0 0 8px rgba(244,63,94,0.5)' : undefined,
                  }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-600">
                <span>{Math.round(pct)}% usado</span>
                <span>
                  {over
                    ? `Excedido en ${formatM(spent - limit)}`
                    : `Disponible: ${formatM(limit - spent)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}