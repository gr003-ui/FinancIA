"use client";
import { useState } from 'react';
import { useFinanceStore, getMonthlyAmount } from '../../store/useFinanceStore';
import { generateMonthlyPDF } from '../../lib/pdfReport';
import {
  FileText, Download, TrendingUp, TrendingDown,
  Wallet, CalendarDays, ArrowUpCircle, ArrowDownCircle,
} from 'lucide-react';

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun',
                      'Jul','Ago','Sep','Oct','Nov','Dic'];

export default function ReportePage() {
  const {
    transactions, cards, budgets,
    exchangeRate, userName,
  } = useFinanceStore();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year,  setYear]  = useState(now.getFullYear());
  const [generating, setGenerating] = useState(false);

  const availableYears = [
    ...new Set([now.getFullYear(), ...transactions.map((t) => new Date(t.date).getFullYear())]),
  ].sort((a, b) => b - a);

  const toARS = (amount: number, currency: 'ARS' | 'USD') =>
    currency === 'USD' ? amount * exchangeRate : amount;

  const formatM = (v: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
    }).format(v);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  };

  const periodTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const totalIngresos = periodTx
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + toARS(t.amount, t.currency), 0);

  const totalGastos = periodTx
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + toARS(getMonthlyAmount(t), t.currency), 0);

  const balance = totalIngresos - totalGastos;

  const catMap: Record<string, number> = {};
  periodTx
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = t.category ?? 'Otros';
      catMap[cat] = (catMap[cat] ?? 0) + toARS(getMonthlyAmount(t), t.currency);
    });

  const topCats = Object.entries(catMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 300));
    generateMonthlyPDF({
      month, year, transactions, cards, budgets, exchangeRate, userName,
    });
    setGenerating(false);
  };

  const methodColor: Record<string, string> = {
    Efectivo: 'bg-emerald-500/10 text-emerald-400',
    Débito:   'bg-blue-500/10 text-blue-400',
    Crédito:  'bg-purple-500/10 text-purple-400',
  };

  return (
    <main className="p-10 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-white">Reporte Mensual</h1>
          <p className="text-slate-500 text-sm mt-1">
            Generá un PDF completo con movimientos, categorías y estado de tarjetas.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating || periodTx.length === 0}
          className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {generating
            ? <><FileText size={16} className="animate-pulse" /> Generando...</>
            : <><Download size={16} /> Descargar PDF</>
          }
        </button>
      </div>

      {/* Selector de período */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-slate-500">
          <CalendarDays size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">Período</span>
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="bg-slate-900 border border-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-2xl outline-none focus:border-emerald-500/50"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i} className="bg-slate-900">{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-slate-900 border border-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-2xl outline-none focus:border-emerald-500/50"
        >
          {availableYears.map((y) => (
            <option key={y} value={y} className="bg-slate-900">{y}</option>
          ))}
        </select>
        <span className="text-[10px] text-slate-600">
          {periodTx.length} movimientos en {MONTHS[month]} {year}
        </span>
      </div>

      {periodTx.length === 0 ? (
        <div className="text-center py-24 space-y-4">
          <FileText size={48} className="text-slate-700 mx-auto" />
          <p className="text-slate-500 italic">
            No hay movimientos en {MONTHS[month]} {year}.<br />
            Seleccioná otro período para generar el reporte.
          </p>
        </div>
      ) : (
        <>
          {/* KPIs del período */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Balance</p>
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <Wallet size={16} className="text-emerald-400" />
                </div>
              </div>
              <p className={`text-2xl font-black ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatM(balance)}
              </p>
            </div>
            <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ingresos</p>
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <TrendingUp size={16} className="text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-black text-white">{formatM(totalIngresos)}</p>
              <p className="text-[10px] text-slate-600">
                {periodTx.filter((t) => t.type === 'income').length} movimientos
              </p>
            </div>
            <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gastos</p>
                <div className="p-2 bg-rose-500/10 rounded-xl">
                  <TrendingDown size={16} className="text-rose-400" />
                </div>
              </div>
              <p className="text-2xl font-black text-white">{formatM(totalGastos)}</p>
              <p className="text-[10px] text-slate-600">
                {periodTx.filter((t) => t.type === 'expense').length} movimientos
              </p>
            </div>
          </div>

          {/* Preview del contenido */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* Top categorías */}
            <div className="bg-slate-900 p-8 rounded-[3rem] border border-white/10 space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Top Categorías
              </p>
              {topCats.length === 0 ? (
                <p className="text-slate-600 italic text-sm">Sin gastos categorizados</p>
              ) : (
                <div className="space-y-3">
                  {topCats.map(([cat, amount]) => {
                    const pct = totalGastos > 0
                      ? Math.round((amount / totalGastos) * 100) : 0;
                    return (
                      <div key={cat} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-bold text-white">{cat}</span>
                          <span className="text-slate-400">{formatM(amount)}</span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-600 text-right">{pct}% del total</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Últimos movimientos del período */}
            <div className="bg-slate-900 p-8 rounded-[3rem] border border-white/10 space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Movimientos del Período
              </p>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {periodTx.slice(0, 15).map((t) => (
                  <div key={t.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${t.type === 'income' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                        {t.type === 'income'
                          ? <ArrowUpCircle   size={14} className="text-emerald-400" />
                          : <ArrowDownCircle size={14} className="text-rose-400" />}
                      </div>
                      <div>
                        <p className="text-white text-xs font-bold leading-tight truncate max-w-[140px]">
                          {t.description}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-500">{formatDate(t.date)}</span>
                          {t.type === 'expense' && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${methodColor[t.method] ?? ''}`}>
                              {t.method}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className={`text-xs font-black ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.type === 'income' ? '+' : '-'}
                      {t.currency === 'USD'
                        ? `U$S ${getMonthlyAmount(t).toLocaleString('es-AR')}`
                        : formatM(getMonthlyAmount(t))}
                    </p>
                  </div>
                ))}
                {periodTx.length > 15 && (
                  <p className="text-[10px] text-slate-600 text-center pt-1">
                    +{periodTx.length - 15} más en el PDF completo
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Botón inferior */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-3 bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-40"
            >
              {generating
                ? <><FileText size={20} className="animate-pulse" /> Generando PDF...</>
                : <><Download size={20} /> Descargar Reporte {MONTHS[month]} {year}</>
              }
            </button>
          </div>
        </>
      )}
    </main>
  );
}