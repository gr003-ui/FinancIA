"use client";
import { useFinanceStore, getMonthlyAmount } from '../store/useFinanceStore';
import { DollarSign, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';

interface MultiCurrencyBalanceProps {
  filterMonth?: number;
  filterYear?: number;
  allTime?: boolean;
}

export default function MultiCurrencyBalance({
  filterMonth,
  filterYear,
  allTime = false,
}: MultiCurrencyBalanceProps) {
  const { transactions, exchangeRate } = useFinanceStore();

  const now = new Date();
  const m = filterMonth ?? now.getMonth();
  const y = filterYear  ?? now.getFullYear();

  const periodTx = allTime
    ? transactions
    : transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === m && d.getFullYear() === y;
      });

  const formatARS = (v: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
    }).format(v);

  const formatUSD = (v: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 2,
    }).format(v);

  // ── ARS nativo ───────────────────────────────────────────────────────────
  const incomesARS = periodTx
    .filter((t) => t.type === 'income' && t.currency === 'ARS')
    .reduce((acc, t) => acc + t.amount, 0);

  const expensesARS = periodTx
    .filter((t) => t.type === 'expense' && t.currency === 'ARS')
    .reduce((acc, t) => acc + getMonthlyAmount(t), 0);

  const balanceARS = incomesARS - expensesARS;

  // ── USD nativo ───────────────────────────────────────────────────────────
  const incomesUSD = periodTx
    .filter((t) => t.type === 'income' && t.currency === 'USD')
    .reduce((acc, t) => acc + t.amount, 0);

  const expensesUSD = periodTx
    .filter((t) => t.type === 'expense' && t.currency === 'USD')
    .reduce((acc, t) => acc + getMonthlyAmount(t), 0);

  const balanceUSD = incomesUSD - expensesUSD;

  // ── Total pesificado (para la línea de equivalencia) ─────────────────────
  const totalARS = balanceARS + balanceUSD * exchangeRate;
  const totalUSD = balanceUSD + balanceARS / exchangeRate;

  return (
    <div className="bg-slate-900 p-8 rounded-[3rem] border border-white/10 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Balance por Moneda
        </p>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-600">
          <ArrowLeftRight size={12} />
          <span>1 USD = {formatARS(exchangeRate)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* ARS */}
        <div className="bg-white/5 rounded-[2rem] p-6 space-y-4 border border-white/5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Pesos ARS
            </p>
            <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
              ARS
            </span>
          </div>

          <p className={`text-3xl font-black tracking-tight ${balanceARS >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatARS(balanceARS)}
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <TrendingUp size={12} className="text-emerald-500" />
                <span>Ingresos</span>
              </div>
              <span className="font-bold text-white">{formatARS(incomesARS)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <TrendingDown size={12} className="text-rose-500" />
                <span>Gastos</span>
              </div>
              <span className="font-bold text-white">{formatARS(expensesARS)}</span>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-600">
              <span>Equivalente en USD</span>
              <span className="font-bold">{formatUSD(balanceARS / exchangeRate)}</span>
            </div>
          </div>
        </div>

        {/* USD */}
        <div className="bg-white/5 rounded-[2rem] p-6 space-y-4 border border-white/5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Dólares USD
            </p>
            <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">
              USD
            </span>
          </div>

          <p className={`text-3xl font-black tracking-tight ${balanceUSD >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
            {formatUSD(balanceUSD)}
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <TrendingUp size={12} className="text-emerald-500" />
                <span>Ingresos</span>
              </div>
              <span className="font-bold text-white">{formatUSD(incomesUSD)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <TrendingDown size={12} className="text-rose-500" />
                <span>Gastos</span>
              </div>
              <span className="font-bold text-white">{formatUSD(expensesUSD)}</span>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-600">
              <span>Equivalente en ARS</span>
              <span className="font-bold">{formatARS(balanceUSD * exchangeRate)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Totales unificados */}
      <div className="bg-white/5 rounded-[2rem] p-5 border border-white/5">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
          Patrimonio Total del Período (todo convertido)
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-[10px] text-slate-600 mb-1">Todo en ARS</p>
            <p className={`text-xl font-black ${totalARS >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatARS(totalARS)}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-600 mb-1">
              <DollarSign size={10} />
              <span>Todo en USD</span>
            </div>
            <p className={`text-xl font-black ${totalUSD >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
              {formatUSD(totalUSD)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}