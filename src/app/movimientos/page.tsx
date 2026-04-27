"use client";
import { useState, useMemo } from 'react';
import { useFinanceStore, getMonthlyAmount } from '../../store/useFinanceStore';
import { exportTransactionsToCSV } from '../../lib/csv';
import { ArrowUpCircle, ArrowDownCircle, Trash2, Download, Search, X } from 'lucide-react';

type FilterType = 'todos' | 'income' | 'expense';
type FilterMethod = 'todos' | 'Efectivo' | 'Débito' | 'Crédito';
type FilterCurrency = 'todas' | 'ARS' | 'USD';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const methodColor: Record<string, string> = {
  'Efectivo': 'bg-emerald-500/10 text-emerald-400',
  'Débito': 'bg-blue-500/10 text-blue-400',
  'Crédito': 'bg-purple-500/10 text-purple-400',
};

export default function MovimientosPage() {
  const { transactions, exchangeRate, removeTransaction } = useFinanceStore();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('todos');
  const [filterMethod, setFilterMethod] = useState<FilterMethod>('todos');
  const [filterCurrency, setFilterCurrency] = useState<FilterCurrency>('todas');

  const formatM = (v: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };

  const toARS = (amount: number, currency: 'ARS' | 'USD') =>
    currency === 'USD' ? amount * exchangeRate : amount;

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (filterType !== 'todos' && t.type !== filterType) return false;
      if (filterMethod !== 'todos' && t.method !== filterMethod) return false;
      if (filterCurrency !== 'todas' && t.currency !== filterCurrency) return false;
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transactions, filterType, filterMethod, filterCurrency, search]);

  // Balance usa monto mensual
  const totalFiltered = filtered.reduce((acc, t) => {
    const val = toARS(getMonthlyAmount(t), t.currency);
    return t.type === 'income' ? acc + val : acc - val;
  }, 0);

  const clearFilters = () => {
    setSearch('');
    setFilterType('todos');
    setFilterMethod('todos');
    setFilterCurrency('todas');
  };

  const hasActiveFilters = search || filterType !== 'todos' || filterMethod !== 'todos' || filterCurrency !== 'todas';

  return (
    <main className="p-10 space-y-8 max-w-5xl mx-auto">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-white">Movimientos</h1>
          <p className="text-slate-500 text-sm mt-1">
            {filtered.length} de {transactions.length} movimientos
            {' · '}
            <span className={totalFiltered >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              Balance: {formatM(totalFiltered)}
            </span>
            <span className="text-slate-600 ml-1">(valor mensual)</span>
          </p>
        </div>
        <button
          onClick={() => exportTransactionsToCSV(filtered, exchangeRate)}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:border-emerald-500/50 px-6 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-30">
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-white/10 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Buscar por descripción..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-600" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex bg-white/5 p-1 rounded-2xl gap-1">
            {(['todos', 'income', 'expense'] as FilterType[]).map(f => (
              <button key={f} onClick={() => setFilterType(f)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                  filterType === f
                    ? f === 'income' ? 'bg-emerald-500 text-white'
                      : f === 'expense' ? 'bg-rose-500 text-white'
                      : 'bg-white/10 text-white'
                    : 'text-slate-500 hover:text-white'
                }`}>
                {f === 'todos' ? 'Todos' : f === 'income' ? 'Ingresos' : 'Gastos'}
              </button>
            ))}
          </div>

          <div className="flex bg-white/5 p-1 rounded-2xl gap-1">
            {(['todos', 'Efectivo', 'Débito', 'Crédito'] as FilterMethod[]).map(f => (
              <button key={f} onClick={() => setFilterMethod(f)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${filterMethod === f ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}>
                {f === 'todos' ? 'Todos' : f}
              </button>
            ))}
          </div>

          <div className="flex bg-white/5 p-1 rounded-2xl gap-1">
            {(['todas', 'ARS', 'USD'] as FilterCurrency[]).map(f => (
              <button key={f} onClick={() => setFilterCurrency(f)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${filterCurrency === f ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}>
                {f === 'todas' ? 'Todas' : f}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black text-rose-400 hover:bg-rose-500/10 transition-all border border-rose-500/20">
              <X size={12} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-600 italic text-sm">
            No hay movimientos que coincidan con los filtros.
          </div>
        ) : (
          filtered.map((t) => (
            <div key={t.id}
              className="flex items-center justify-between p-5 bg-slate-900 border border-white/10 rounded-[2rem] hover:border-white/20 transition-all group">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${t.type === 'income' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                  {t.type === 'income'
                    ? <ArrowUpCircle size={22} className="text-emerald-400" />
                    : <ArrowDownCircle size={22} className="text-rose-400" />}
                </div>
                <div>
                  <p className="font-bold text-white leading-tight">{t.description}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500">{formatDate(t.date)}</span>
                    {t.type === 'expense' && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${methodColor[t.method] ?? 'bg-white/10 text-slate-400'}`}>
                        {t.method}
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
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${t.currency === 'USD' ? 'bg-amber-500/10 text-amber-400' : 'bg-white/5 text-slate-600'}`}>
                      {t.currency}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`font-black ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
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
                      ≈ {formatM(toARS(t.amount, 'USD'))}
                    </p>
                  )}
                </div>
                <button onClick={() => removeTransaction(t.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl hover:bg-rose-500/20 text-slate-600 hover:text-rose-400">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}