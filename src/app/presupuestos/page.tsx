"use client";
import { useState } from 'react';
import { useFinanceStore, CATEGORIES, TransactionCategory, getMonthlyAmount } from '../../store/useFinanceStore';
import { Target, Plus, Trash2, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';

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

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function PresupuestosPage() {
  const {
    budgets, setBudget, removeBudget,
    transactions, exchangeRate,
  } = useFinanceStore();

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterYear,  setFilterYear]  = useState(now.getFullYear());

  const [newCat,      setNewCat]      = useState<TransactionCategory>('Alimentación');
  const [newAmount,   setNewAmount]   = useState('');
  const [newCurrency, setNewCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [showForm,    setShowForm]    = useState(false);

  const toARS = (amount: number, currency: 'ARS' | 'USD') =>
    currency === 'USD' ? amount * exchangeRate : amount;

  const formatM = (v: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
    }).format(v);

  const availableYears = [
    ...new Set([now.getFullYear(), ...transactions.map((t) => new Date(t.date).getFullYear())]),
  ].sort((a, b) => b - a);

  const periodExpenses = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      t.type === 'expense' &&
      d.getMonth() === filterMonth &&
      d.getFullYear() === filterYear
    );
  });

  const spentByCategory = CATEGORIES.reduce<Record<TransactionCategory, number>>(
    (acc, cat) => {
      acc[cat] = periodExpenses
        .filter((t) => (t.category ?? 'Otros') === cat)
        .reduce((s, t) => s + toARS(getMonthlyAmount(t), t.currency), 0);
      return acc;
    },
    {} as Record<TransactionCategory, number>
  );

  const handleAdd = () => {
    if (!newAmount || Number(newAmount) <= 0) return;
    setBudget(newCat, Number(newAmount), newCurrency);
    setNewAmount('');
    setShowForm(false);
  };

  const usedCategories = new Set(budgets.map((b) => b.category));
  const availableCats  = CATEGORIES.filter((c) => !usedCategories.has(c));

  const totalBudgetARS = budgets.reduce((acc, b) => acc + toARS(b.amount, b.currency), 0);
  const totalSpentARS  = budgets.reduce((acc, b) => acc + (spentByCategory[b.category] ?? 0), 0);
  const overBudget     = budgets.filter((b) => (spentByCategory[b.category] ?? 0) > toARS(b.amount, b.currency));

  return (
    <main className="p-10 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-white">Presupuestos</h1>
          <p className="text-slate-500 text-sm mt-1">
            Definí límites mensuales por categoría y controlá tus gastos.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); if (availableCats.length > 0) setNewCat(availableCats[0]!); }}
          disabled={availableCats.length === 0}
          className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-30"
        >
          <Plus size={16} /> {showForm ? 'Cancelar' : 'Nuevo Presupuesto'}
        </button>
      </div>

      {/* Selector de período */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Período:</span>
        <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))}
          className="bg-slate-900 border border-white/10 text-white text-xs font-bold px-4 py-2 rounded-2xl outline-none">
          {MONTHS.map((m, i) => <option key={m} value={i} className="bg-slate-900">{m}</option>)}
        </select>
        <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}
          className="bg-slate-900 border border-white/10 text-white text-xs font-bold px-4 py-2 rounded-2xl outline-none">
          {availableYears.map((y) => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
        </select>
      </div>

      {/* KPIs */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-white/10 flex flex-col gap-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Presupuesto Total</p>
            <p className="text-2xl font-black text-white">{formatM(totalBudgetARS)}</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-white/10 flex flex-col gap-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gastado</p>
            <p className={`text-2xl font-black ${totalSpentARS > totalBudgetARS ? 'text-rose-400' : 'text-white'}`}>
              {formatM(totalSpentARS)}
            </p>
            <p className="text-[10px] text-slate-600">
              {Math.round((totalSpentARS / totalBudgetARS) * 100) || 0}% del total
            </p>
          </div>
          <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-white/10 flex flex-col gap-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Categorías Excedidas</p>
            <p className={`text-2xl font-black ${overBudget.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {overBudget.length}
            </p>
            <p className="text-[10px] text-slate-600">de {budgets.length} presupuestos</p>
          </div>
        </div>
      )}

      {/* Formulario nuevo presupuesto */}
      {showForm && availableCats.length > 0 && (
        <div className="bg-slate-900 p-8 rounded-[3rem] border border-white/10 space-y-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nuevo Presupuesto</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select
              value={newCat}
              onChange={(e) => setNewCat(e.target.value as TransactionCategory)}
              className="bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none font-bold focus:border-emerald-500 transition-all"
            >
              {availableCats.map((c) => (
                <option key={c} value={c} className="bg-slate-900">{c}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <div className="flex bg-white/5 p-1 rounded-2xl gap-1">
                {(['ARS','USD'] as const).map((cur) => (
                  <button key={cur} type="button"
                    onClick={() => setNewCurrency(cur)}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${newCurrency === cur ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}>
                    {cur}
                  </button>
                ))}
              </div>
              <input
                type="number" min="0" placeholder="Límite mensual"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="flex-1 bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none font-bold focus:border-emerald-500 transition-all placeholder:text-slate-600"
              />
            </div>
            <button
              onClick={handleAdd}
              className="bg-emerald-500 text-white p-4 rounded-2xl font-black hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Lista de presupuestos */}
      {budgets.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <Target size={48} className="text-slate-700 mx-auto" />
          <p className="text-slate-500 italic">
            No hay presupuestos configurados. Creá uno para empezar a controlar tus gastos.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => {
            const spent   = spentByCategory[budget.category] ?? 0;
            const limit   = toARS(budget.amount, budget.currency);
            const pct     = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
            const over    = spent > limit;
            const warning = pct >= 80 && !over;
            const color   = CATEGORY_COLORS[budget.category];

            const periodTxForCat = periodExpenses.filter(
              (t) => (t.category ?? 'Otros') === budget.category
            );

            return (
              <div key={budget.id}
                className={`bg-slate-900 rounded-[2.5rem] border p-6 space-y-4 transition-all ${
                  over    ? 'border-rose-500/30'  :
                  warning ? 'border-amber-500/20' :
                            'border-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                      style={{ background: `${color}20` }}>
                      {over
                        ? <AlertTriangle size={18} className="text-rose-400" />
                        : warning
                        ? <AlertTriangle size={18} className="text-amber-400" />
                        : <CheckCircle  size={18} style={{ color }} />
                      }
                    </div>
                    <div>
                      <p className="font-black text-white">{budget.category}</p>
                      <p className="text-[10px] text-slate-500">
                        {periodTxForCat.length} gasto{periodTxForCat.length !== 1 ? 's' : ''} en este período
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-black text-white">
                        <span style={{ color: over ? '#f43f5e' : warning ? '#f59e0b' : color }}>
                          {formatM(spent)}
                        </span>
                        <span className="text-slate-600 font-normal text-sm"> / {formatM(limit)}</span>
                      </p>
                      <p className={`text-[10px] font-bold ${over ? 'text-rose-400' : 'text-slate-600'}`}>
                        {over
                          ? `¡Excedido en ${formatM(spent - limit)}!`
                          : `Disponible: ${formatM(limit - spent)}`}
                      </p>
                    </div>
                    <button
                      onClick={() => removeBudget(budget.category)}
                      className="p-2 rounded-xl hover:bg-rose-500/20 text-slate-600 hover:text-rose-400 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Barra */}
                <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: over ? '#f43f5e' : warning ? '#f59e0b' : color,
                    }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>{Math.round(pct)}% utilizado</span>
                  <span>
                    {budget.currency === 'USD'
                      ? `Límite original: U$S ${budget.amount.toLocaleString('es-AR')}`
                      : ''}
                  </span>
                </div>

                {/* Detalle de gastos */}
                {periodTxForCat.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    {periodTxForCat.slice(0, 3).map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <TrendingDown size={10} className="text-rose-500" />
                          <span className="truncate max-w-[200px]">{t.description}</span>
                        </div>
                        <span className="font-bold text-slate-400">
                          {t.currency === 'USD'
                            ? `U$S ${getMonthlyAmount(t).toLocaleString('es-AR')}`
                            : formatM(getMonthlyAmount(t))}
                        </span>
                      </div>
                    ))}
                    {periodTxForCat.length > 3 && (
                      <p className="text-[10px] text-slate-600 text-center">
                        +{periodTxForCat.length - 3} más en esta categoría
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}