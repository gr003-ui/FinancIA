"use client";
import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useFinanceStore, getMonthlyAmount, CATEGORIES, TransactionCategory } from '../store/useFinanceStore';

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  Alimentación:   '#10b981',
  Transporte:     '#3b82f6',
  Servicios:      '#f59e0b',
  Salud:          '#ec4899',
  Entretenimiento:'#8b5cf6',
  Indumentaria:   '#f43f5e',
  Educación:      '#06b6d4',
  Viajes:         '#84cc16',
  Hogar:          '#fb923c',
  Otros:          '#94a3b8',
};

const LineTooltip = ({
  active, payload, label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  const fmt = (v: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
    }).format(v);
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-white/10 rounded-2xl p-4 text-xs shadow-xl space-y-1">
      <p className="font-black text-white mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-bold">
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function CategoryLineChart() {
  const { transactions, exchangeRate } = useFinanceStore();
  const [activeCategories, setActiveCategories] = useState<TransactionCategory[]>([...CATEGORIES]);

  const toARS = (amount: number, currency: 'ARS' | 'USD') =>
    currency === 'USD' ? amount * exchangeRate : amount;

  // Últimos 6 meses
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return { month: d.getMonth(), year: d.getFullYear(), label: MONTHS_SHORT[d.getMonth()] };
  });

  const chartData = useMemo(() => {
    return months.map(({ month, year, label }) => {
      const monthTx = transactions.filter((t) => {
        const d = new Date(t.date);
        return (
          t.type === 'expense' &&
          d.getMonth() === month &&
          d.getFullYear() === year
        );
      });

      const row: Record<string, number | string> = { name: label };

      CATEGORIES.forEach((cat) => {
        const total = monthTx
          .filter((t) => (t.category ?? 'Otros') === cat)
          .reduce((acc, t) => acc + toARS(getMonthlyAmount(t), t.currency), 0);
        row[cat] = total;
      });

      return row;
    });
  }, [transactions, exchangeRate]);

  // Categorías con al menos un gasto en el período
  const usedCategories = CATEGORIES.filter((cat) =>
    chartData.some((row) => (row[cat] as number) > 0)
  );

  const toggleCategory = (cat: TransactionCategory) => {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  if (usedCategories.length === 0) {
    return (
      <div className="bg-slate-900 p-8 rounded-[3rem] border border-white/10">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
          Evolución por Categoría
        </p>
        <div className="h-[260px] flex items-center justify-center text-slate-600 italic text-sm">
          Cargá gastos con categoría para ver la evolución
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 p-8 rounded-[3rem] border border-white/10 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Evolución por Categoría — Últimos 6 Meses
        </p>
        <div className="flex flex-wrap gap-2">
          {usedCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all border ${
                activeCategories.includes(cat)
                  ? 'border-transparent text-white'
                  : 'border-white/10 text-slate-600 bg-transparent'
              }`}
              style={
                activeCategories.includes(cat)
                  ? { backgroundColor: CATEGORY_COLORS[cat] + '33', color: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat] + '66' }
                  : {}
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
            }
          />
          <Tooltip content={<LineTooltip />} />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '11px', paddingTop: '12px' }} />
          {usedCategories
            .filter((cat) => activeCategories.includes(cat))
            .map((cat) => (
              <Line
                key={cat}
                type="monotone"
                dataKey={cat}
                stroke={CATEGORY_COLORS[cat]}
                strokeWidth={2}
                dot={{ r: 4, fill: CATEGORY_COLORS[cat], strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}