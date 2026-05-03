"use client";
import { useState } from 'react';
import { useFinanceStore, getMonthlyAmount } from '../store/useFinanceStore';
import { getDolarBlue } from '../lib/api';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, DollarSign,
  ArrowUpCircle, ArrowDownCircle, RefreshCw, Trash2, CalendarDays,
} from 'lucide-react';
import CategoryLineChart    from '../components/CategoryLineChart';
import MultiCurrencyBalance from '../components/MultiCurrencyBalance';
import FixedIncomeReminder  from '../components/FixedIncomeReminder';
import BudgetPanel          from '../components/BudgetPanel';
import FadeIn               from '../components/motion/FadeIn';
import StaggerList, { StaggerItem } from '../components/motion/StaggerList';
import AnimatedNumber       from '../components/motion/AnimatedNumber';
import PageTransition       from '../components/motion/PageTransition';

const MONTHS       = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun',
                      'Jul','Ago','Sep','Oct','Nov','Dic'];

const BarTooltip = ({
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
    <div className="bg-slate-800 border border-white/10 rounded-2xl p-4 text-xs shadow-xl">
      <p className="font-black text-white mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-bold">
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

const formatM = (v: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(v);

const formatUSD = (v: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 2,
  }).format(v);

export default function Dashboard() {
  const { transactions, exchangeRate, setExchangeRate, removeTransaction } = useFinanceStore();
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState<number>(now.getMonth());
  const [filterYear,  setFilterYear]  = useState<number>(now.getFullYear());
  const [allTime, setAllTime]         = useState(false);

  const availableYears = [
    ...new Set([now.getFullYear(), ...transactions.map((t) => new Date(t.date).getFullYear())]),
  ].sort((a, b) => b - a);

  const toARS = (amount: number, currency: 'ARS' | 'USD') =>
    currency === 'USD' ? amount * exchangeRate : amount;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  };

  const periodTx = allTime
    ? transactions
    : transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
      });

  const totalIngresos = periodTx
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + toARS(t.amount, t.currency), 0);

  const totalGastos = periodTx
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + toARS(getMonthlyAmount(t), t.currency), 0);

  const balance    = totalIngresos - totalGastos;
  const balanceUSD = balance / exchangeRate;

  const chartData = periodTx
    .filter((t) => t.type === 'expense')
    .reduce((acc: { name: string; value: number }[], curr) => {
      const val   = toARS(getMonthlyAmount(curr), curr.currency);
      const found = acc.find((i) => i.name === curr.method);
      if (found) found.value += val;
      else acc.push({ name: curr.method, value: val });
      return acc;
    }, []);

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    const m = d.getMonth();
    const y = d.getFullYear();
    const mTx = transactions.filter((t) => {
      const td = new Date(t.date);
      return td.getMonth() === m && td.getFullYear() === y;
    });
    return {
      name: MONTHS_SHORT[m],
      Ingresos: mTx.filter((t) => t.type === 'income')
        .reduce((acc, t) => acc + toARS(t.amount, t.currency), 0),
      Gastos: mTx.filter((t) => t.type === 'expense')
        .reduce((acc, t) => acc + toARS(getMonthlyAmount(t), t.currency), 0),
    };
  });

  const COLORS = ['#10b981','#3b82f6','#f59e0b','#ef4444'];
  const methodColor: Record<string, string> = {
    Efectivo: 'bg-emerald-500/10 text-emerald-400',
    Débito:   'bg-blue-500/10 text-blue-400',
    Crédito:  'bg-purple-500/10 text-purple-400',
  };

  const handleRefreshDolar = async () => {
    setRefreshing(true);
    const data = await getDolarBlue();
    if (data.venta > 0) setExchangeRate(data.venta);
    setRefreshing(false);
  };

  return (
    <PageTransition>
      <div className="p-10 space-y-10">

        {/* SELECTOR DE PERÍODO */}
        <FadeIn direction="down" duration={0.3}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-slate-500">
              <CalendarDays size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Período</span>
            </div>
            <div className="flex bg-slate-900 border border-white/10 p-1 rounded-2xl gap-1">
              <button onClick={() => setAllTime(false)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${!allTime ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-white'}`}>
                Mensual
              </button>
              <button onClick={() => setAllTime(true)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${allTime ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-white'}`}>
                Todo
              </button>
            </div>
            {!allTime && (
              <>
                <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))}
                  className="bg-slate-900 border border-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-2xl outline-none">
                  {MONTHS.map((m, i) => <option key={m} value={i} className="bg-slate-900">{m}</option>)}
                </select>
                <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}
                  className="bg-slate-900 border border-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-2xl outline-none">
                  {availableYears.map((y) => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
                </select>
              </>
            )}
            <span className="text-[10px] text-slate-600">
              {periodTx.length} movimientos{!allTime && ` · ${MONTHS[filterMonth]} ${filterYear}`}
            </span>
          </div>
        </FadeIn>

        {/* RECORDATORIOS Y PRESUPUESTOS */}
        {!allTime && (
          <FadeIn delay={0.05}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <FixedIncomeReminder />
              <BudgetPanel month={filterMonth} year={filterYear} />
            </div>
          </FadeIn>
        )}

        {/* KPI CARDS — stagger */}
        <StaggerList className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            {
              label: 'Balance',
              node: (
                <AnimatedNumber
                  value={balance}
                  formatter={formatM}
                  className={`text-3xl font-black tracking-tight ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                />
              ),
              sub: (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                  <DollarSign size={10} />
                  <span>≈ {formatUSD(balanceUSD)}</span>
                </div>
              ),
              hint: 'cuotas = valor mensual',
              icon: <Wallet size={18} className="text-emerald-400" />,
              iconBg: 'bg-emerald-500/10',
            },
            {
              label: 'Ingresos',
              node: (
                <AnimatedNumber
                  value={totalIngresos}
                  formatter={formatM}
                  className="text-3xl font-black tracking-tight text-white"
                />
              ),
              sub: null,
              hint: `${periodTx.filter((t) => t.type === 'income').length} movimientos`,
              icon: <TrendingUp size={18} className="text-blue-400" />,
              iconBg: 'bg-blue-500/10',
            },
            {
              label: 'Gastos',
              node: (
                <AnimatedNumber
                  value={totalGastos}
                  formatter={formatM}
                  className="text-3xl font-black tracking-tight text-white"
                />
              ),
              sub: null,
              hint: `${periodTx.filter((t) => t.type === 'expense').length} movimientos`,
              icon: <TrendingDown size={18} className="text-rose-400" />,
              iconBg: 'bg-rose-500/10',
            },
            {
              label: 'USD / ARS',
              node: (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-amber-400">$</span>
                  <input
                    type="number"
                    className="text-3xl font-black w-full outline-none bg-transparent text-white"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(Number(e.target.value))}
                  />
                </div>
              ),
              sub: null,
              hint: 'editá o actualizá con el azul real',
              icon: (
                <div className="flex items-center gap-2">
                  <button onClick={handleRefreshDolar}
                    className="p-2 bg-amber-500/10 rounded-xl hover:bg-amber-500/20 transition-all">
                    <RefreshCw size={16} className={`text-amber-400 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                  <div className="p-2 bg-amber-500/10 rounded-xl">
                    <DollarSign size={18} className="text-amber-400" />
                  </div>
                </div>
              ),
              iconBg: '',
            },
          ].map((kpi) => (
            <StaggerItem key={kpi.label}>
              <div className="bg-slate-900 p-7 rounded-[2.5rem] border border-white/10 flex flex-col gap-3 h-full">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {kpi.label}
                  </p>
                  <div className={kpi.iconBg ? `p-2 ${kpi.iconBg} rounded-xl` : ''}>
                    {kpi.icon}
                  </div>
                </div>
                {kpi.node}
                {kpi.sub}
                <p className="text-[10px] text-slate-600">{kpi.hint}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerList>

        {/* BALANCE MULTI-MONEDA */}
        <FadeIn delay={0.2}>
          <MultiCurrencyBalance
            filterMonth={filterMonth}
            filterYear={filterYear}
            allTime={allTime}
          />
        </FadeIn>

        {/* TORTA + MOVIMIENTOS */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <FadeIn delay={0.25} className="xl:col-span-5">
            <div className="bg-slate-900 p-8 rounded-[3rem] border border-white/10 h-full">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">
                Gastos por Método de Pago
              </p>
              {chartData.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-slate-600 italic text-sm">
                  Sin gastos en este período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={chartData} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{
                      borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: '#0f172a', color: '#f1f5f9',
                    }} />
                    <Legend verticalAlign="middle" align="right" layout="vertical"
                      wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </FadeIn>

          <FadeIn delay={0.3} className="xl:col-span-7">
            <div className="bg-slate-900 p-8 rounded-[3rem] border border-white/10 h-full">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">
                Últimos Movimientos
              </p>
              {periodTx.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-slate-600 italic text-sm">
                  Sin movimientos en este período
                </div>
              ) : (
                <StaggerList
                  className="space-y-3 max-h-[300px] overflow-y-auto pr-2"
                  staggerDelay={0.04}
                >
                  {periodTx.slice(0, 20).map((t) => (
                    <StaggerItem key={t.id}>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl ${t.type === 'income' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                            {t.type === 'income'
                              ? <ArrowUpCircle   size={20} className="text-emerald-400" />
                              : <ArrowDownCircle size={20} className="text-rose-400"    />}
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
                              {t.category && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/5 text-slate-500">
                                  {t.category}
                                </span>
                              )}
                              {t.type === 'income' && t.incomeType && (
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${t.incomeType === 'fixed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                  {t.incomeType === 'fixed' ? 'Fijo' : 'Variable'}
                                </span>
                              )}
                              {t.installments > 1 && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
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
                                ? `U$S ${getMonthlyAmount(t).toLocaleString('es-AR')}`
                                : formatM(getMonthlyAmount(t))}
                            </p>
                            {t.installments > 1 && (
                              <p className="text-[10px] text-slate-600 mt-0.5">
                                total: {t.currency === 'USD' ? `U$S ${t.amount}` : formatM(t.amount)}
                              </p>
                            )}
                            {t.currency === 'USD' && t.installments <= 1 && (
                              <p className="text-[10px] text-slate-600 mt-0.5">
                                ≈ {formatM(t.amount * exchangeRate)}
                              </p>
                            )}
                          </div>
                          <button onClick={() => removeTransaction(t.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl hover:bg-rose-500/20 text-slate-600 hover:text-rose-400">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerList>
              )}
            </div>
          </FadeIn>
        </div>

        {/* GRÁFICO MENSUAL */}
        <FadeIn delay={0.35}>
          <div className="bg-slate-900 p-8 rounded-[3rem] border border-white/10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">
              Evolución Mensual — Últimos 6 Meses
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px', paddingTop: '16px' }} />
                <Bar dataKey="Ingresos" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Gastos"   fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </FadeIn>

        {/* GRÁFICO POR CATEGORÍA */}
        <FadeIn delay={0.4}>
          <CategoryLineChart />
        </FadeIn>

      </div>
    </PageTransition>
  );
}