"use client";
import { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { getDolarBlue } from '../lib/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, DollarSign,
  ArrowUpCircle, ArrowDownCircle, RefreshCw, Trash2,
} from 'lucide-react';

export default function Dashboard() {
  const { transactions, exchangeRate, setExchangeRate, removeTransaction } = useFinanceStore();
  const [refreshing, setRefreshing] = useState(false);

  const toARS = (amount: number, currency: 'ARS' | 'USD') =>
    currency === 'USD' ? amount * exchangeRate : amount;

  const formatM = (v: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });

  const totalIngresos = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + toARS(t.amount, t.currency), 0);

  const totalGastos = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + toARS(t.amount, t.currency), 0);

  const balance = totalIngresos - totalGastos;

  const chartData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: { name: string; value: number }[], curr) => {
      const val = toARS(curr.amount, curr.currency);
      const found = acc.find(i => i.name === curr.method);
      if (found) found.value += val;
      else acc.push({ name: curr.method, value: val });
      return acc;
    }, []);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  const methodColor: Record<string, string> = {
    'Efectivo':  'bg-emerald-500/10 text-emerald-400',
    'Débito':    'bg-blue-500/10 text-blue-400',
    'Crédito':   'bg-purple-500/10 text-purple-400',
  };

  const handleRefreshDolar = async () => {
    setRefreshing(true);
    const data = await getDolarBlue();
    if (data.venta > 0) setExchangeRate(data.venta);
    setRefreshing(false);
  };

  return (
    <div className="p-10 space-y-10">

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

        <div className="bg-slate-900 p-7 rounded-[2.5rem] border border-white/10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Balance Total</p>
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Wallet size={18} className="text-emerald-400" />
            </div>
          </div>
          <p className={`text-3xl font-black tracking-tight ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatM(balance)}
          </p>
          <p className="text-[10px] text-slate-600">ingresos − gastos (pesificado)</p>
        </div>

        <div className="bg-slate-900 p-7 rounded-[2.5rem] border border-white/10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Ingresos</p>
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <TrendingUp size={18} className="text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-black tracking-tight text-white">{formatM(totalIngresos)}</p>
          <p className="text-[10px] text-slate-600">
            {transactions.filter(t => t.type === 'income').length} movimientos
          </p>
        </div>

        <div className="bg-slate-900 p-7 rounded-[2.5rem] border border-white/10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Gastos</p>
            <div className="p-2 bg-rose-500/10 rounded-xl">
              <TrendingDown size={18} className="text-rose-400" />
            </div>
          </div>
          <p className="text-3xl font-black tracking-tight text-white">{formatM(totalGastos)}</p>
          <p className="text-[10px] text-slate-600">
            {transactions.filter(t => t.type === 'expense').length} movimientos
          </p>
        </div>

        <div className="bg-slate-900 p-7 rounded-[2.5rem] border border-white/10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cotización USD/ARS</p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshDolar}
                title="Actualizar con dólar blue real"
                className="p-2 bg-amber-500/10 rounded-xl hover:bg-amber-500/20 transition-all"
              >
                <RefreshCw
                  size={18}
                  className={`text-amber-400 ${refreshing ? 'animate-spin' : ''}`}
                />
              </button>
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <DollarSign size={18} className="text-amber-400" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-amber-400">$</span>
            <input
              type="number"
              className="text-3xl font-black w-full outline-none bg-transparent text-white"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(Number(e.target.value))}
            />
          </div>
          <p className="text-[10px] text-slate-600">editá o actualizá con el azul real</p>
        </div>

      </div>

      {/* CHART + TRANSACCIONES */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        <div className="xl:col-span-5 bg-slate-900 p-8 rounded-[3rem] border border-white/10">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">
            Gastos por Método de Pago
          </p>
          {chartData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-slate-600 italic text-sm">
              Sin gastos registrados todavía
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={chartData} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '1.5rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: '#0f172a',
                    color: '#f1f5f9',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.4)',
                  }}
                />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="xl:col-span-7 bg-slate-900 p-8 rounded-[3rem] border border-white/10">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">
            Últimos Movimientos
          </p>
          {transactions.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-slate-600 italic text-sm">
              Sin movimientos registrados todavía
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {transactions.slice(0, 20).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${t.type === 'income' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                      {t.type === 'income' ? (
                        <ArrowUpCircle size={20} className="text-emerald-400" />
                      ) : (
                        <ArrowDownCircle size={20} className="text-rose-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm leading-tight">{t.description}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] text-slate-500">{formatDate(t.date)}</span>
                        {t.type === 'expense' && (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${methodColor[t.method] ?? 'bg-white/10 text-slate-400'}`}>
                            {t.method}
                          </span>
                        )}
                        {t.type === 'income' && t.incomeType && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                            {t.incomeType === 'fixed' ? 'Fijo' : 'Variable'}
                          </span>
                        )}
                        {t.installments > 1 && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/10 text-slate-400">
                            cuota {t.currentInstallment}/{t.installments}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.type === 'income' ? '+' : '-'}
                        {t.currency === 'USD'
                          ? `U$S ${t.amount.toLocaleString('es-AR')}`
                          : formatM(t.amount)}
                      </p>
                      {t.currency === 'USD' && (
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          ≈ {formatM(t.amount * exchangeRate)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeTransaction(t.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl hover:bg-rose-500/20 text-slate-600 hover:text-rose-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}