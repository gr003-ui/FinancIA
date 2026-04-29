"use client";
import { useFinanceStore } from '../../store/useFinanceStore';
import {
  TrendingUp, TrendingDown, Wallet, CalendarDays,
  ArrowUpCircle, ArrowDownCircle, AlertCircle,
} from 'lucide-react';

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

export default function ProyeccionPage() {
  const { transactions, exchangeRate } = useFinanceStore();

  const now    = new Date();
  const nextM  = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonth = nextM.getMonth();
  const nextYear  = nextM.getFullYear();

  const toARS = (amount: number, currency: 'ARS' | 'USD') =>
    currency === 'USD' ? amount * exchangeRate : amount;

  const formatM = (v: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
    }).format(v);

  // ── Ingresos fijos: todos los marcados como 'fixed' del mes actual ──────────
  const fixedIncomes = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      t.type === 'income' &&
      t.incomeType === 'fixed' &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });

  // ── Cuotas activas que llegan al mes siguiente ────────────────────────────
  // Una cuota es "activa en el mes siguiente" si:
  // - es gasto en crédito con installments > 1
  // - la cuota (currentInstallment + meses transcurridos + 1) <= installments
  const activeCuotas = transactions.filter((t) => {
    if (t.type !== 'expense' || t.installments <= 1) return false;
    const txDate   = new Date(t.date);
    const monthsDiff =
      (nextYear - txDate.getFullYear()) * 12 + (nextMonth - txDate.getMonth());
    const cuotaEnProximo = t.currentInstallment + monthsDiff;
    return cuotaEnProximo <= t.installments;
  });

  // ── Gastos variables del mes actual (no cuotas, no crédito en cuotas) ──────
  // Los mostramos como "probables" si el usuario los repite seguido
  const variableExpenses = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      t.type === 'expense' &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear() &&
      t.installments <= 1
    );
  });

  // ── Totales proyectados ────────────────────────────────────────────────────
  const projIngresos = fixedIncomes.reduce(
    (acc, t) => acc + toARS(t.amount, t.currency), 0
  );

  const projCuotas = activeCuotas.reduce(
    (acc, t) => acc + toARS(t.amount / t.installments, t.currency), 0
  );

  const projGastosVariables = variableExpenses.reduce(
    (acc, t) => acc + toARS(t.amount, t.currency), 0
  );

  const projGastosTotal = projCuotas + projGastosVariables;
  const projBalance     = projIngresos - projGastosTotal;

  // ── Balance actual (para comparar) ────────────────────────────────────────
  const currentTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const currentBalance = currentTx.reduce((acc, t) => {
    const monthly =
      t.type === 'expense' && t.installments > 1
        ? t.amount / t.installments
        : t.amount;
    const val = toARS(monthly, t.currency);
    return t.type === 'income' ? acc + val : acc - val;
  }, 0);

  const diff = projBalance - currentBalance;

  return (
    <main className="p-10 max-w-5xl mx-auto space-y-10">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-500/10 rounded-2xl">
          <CalendarDays size={28} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Proyección — {MONTHS[nextMonth]} {nextYear}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Basada en ingresos fijos y cuotas activas del período actual
          </p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

        <div className="bg-slate-900 p-7 rounded-[2.5rem] border border-white/10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Balance Proyectado
            </p>
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Wallet size={18} className="text-blue-400" />
            </div>
          </div>
          <p className={`text-3xl font-black tracking-tight ${projBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatM(projBalance)}
          </p>
          <div className={`flex items-center gap-1 text-[10px] font-black ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {diff >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {diff >= 0 ? '+' : ''}{formatM(diff)} vs mes actual
          </div>
        </div>

        <div className="bg-slate-900 p-7 rounded-[2.5rem] border border-white/10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Ingresos Fijos
            </p>
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <TrendingUp size={18} className="text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-black tracking-tight text-white">
            {formatM(projIngresos)}
          </p>
          <p className="text-[10px] text-slate-600">{fixedIncomes.length} conceptos fijos</p>
        </div>

        <div className="bg-slate-900 p-7 rounded-[2.5rem] border border-white/10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Cuotas Activas
            </p>
            <div className="p-2 bg-purple-500/10 rounded-xl">
              <TrendingDown size={18} className="text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-black tracking-tight text-white">
            {formatM(projCuotas)}
          </p>
          <p className="text-[10px] text-slate-600">{activeCuotas.length} compras en cuotas</p>
        </div>

        <div className="bg-slate-900 p-7 rounded-[2.5rem] border border-white/10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Gastos Variables
            </p>
            <div className="p-2 bg-rose-500/10 rounded-xl">
              <TrendingDown size={18} className="text-rose-400" />
            </div>
          </div>
          <p className="text-3xl font-black tracking-tight text-white">
            {formatM(projGastosVariables)}
          </p>
          <p className="text-[10px] text-slate-600">
            repetición del mes actual
          </p>
        </div>

      </div>

      {/* Aviso */}
      <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-[2rem] p-5">
        <AlertCircle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-400 font-medium leading-relaxed">
          <span className="font-black">Proyección estimada.</span> Los ingresos variables del mes
          actual se incluyen como referencia pero pueden no repetirse. Solo los ingresos marcados
          como <span className="font-black">Fijo</span> se consideran garantizados.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* Ingresos fijos del próximo mes */}
        <div className="bg-slate-900 p-8 rounded-[3rem] border border-white/10 space-y-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Ingresos Fijos Confirmados
          </p>
          {fixedIncomes.length === 0 ? (
            <p className="text-slate-600 italic text-sm py-6 text-center">
              No hay ingresos marcados como Fijo este mes.
              Marcá tus ingresos recurrentes para proyectar.
            </p>
          ) : (
            <div className="space-y-3">
              {fixedIncomes.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                      <ArrowUpCircle size={18} className="text-emerald-400" />
                    </div>
                    <p className="font-bold text-white text-sm">{t.description}</p>
                  </div>
                  <p className="font-black text-emerald-400 text-sm">
                    +{t.currency === 'USD'
                      ? `U$S ${t.amount.toLocaleString('es-AR')}`
                      : formatM(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cuotas activas en el próximo mes */}
        <div className="bg-slate-900 p-8 rounded-[3rem] border border-white/10 space-y-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Cuotas que Vencen en {MONTHS[nextMonth]}
          </p>
          {activeCuotas.length === 0 ? (
            <p className="text-slate-600 italic text-sm py-6 text-center">
              No hay cuotas activas para el próximo mes.
            </p>
          ) : (
            <div className="space-y-3">
              {activeCuotas.map((t) => {
                const txDate = new Date(t.date);
                const monthsDiff =
                  (nextYear - txDate.getFullYear()) * 12 +
                  (nextMonth - txDate.getMonth());
                const cuotaNum = t.currentInstallment + monthsDiff;
                const cuotaAmount = t.amount / t.installments;
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-xl">
                        <ArrowDownCircle size={18} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm leading-tight">
                          {t.description}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Cuota {cuotaNum} de {t.installments}
                        </p>
                      </div>
                    </div>
                    <p className="font-black text-purple-400 text-sm">
                      -{t.currency === 'USD'
                        ? `U$S ${cuotaAmount.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`
                        : formatM(cuotaAmount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}