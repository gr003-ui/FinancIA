"use client";
import { useState, useRef } from 'react';
import { useFinanceStore, CATEGORIES, TransactionCategory } from '../store/useFinanceStore';
import { CalendarDays } from 'lucide-react';

interface TransactionFormProps {
  onSuccess?: () => void;
}

const toMonthValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const { cards, addTransaction } = useFinanceStore();
  const [formData, setFormData] = useState({
    desc: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    incomeType: 'variable' as 'fixed' | 'variable',
    method: 'Efectivo' as 'Efectivo' | 'Débito' | 'Crédito',
    currency: 'ARS' as 'ARS' | 'USD',
    installments: '1',
    currentInst: '1',
    cardId: '',
    month: toMonthValue(new Date()),
    category: 'Otros' as TransactionCategory,
  });

  const descRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.desc || !formData.amount) return;

    const [year, month] = formData.month.split('-').map(Number);
    const txDate = new Date(year, month - 1, 1, 12, 0, 0).toISOString();

    addTransaction({
      description:     formData.desc,
      amount:          parseFloat(formData.amount),
      type:            formData.type,
      incomeType:      formData.type === 'income' ? formData.incomeType : undefined,
      method:          formData.method,
      currency:        formData.currency,
      date:            txDate,
      installments:    parseInt(formData.installments) || 1,
      currentInstallment: parseInt(formData.currentInst) || 1,
      cardId:
        formData.type === 'expense' && formData.method !== 'Efectivo'
          ? formData.cardId : undefined,
      category: formData.type === 'expense' ? formData.category : undefined,
    });

    setFormData({ ...formData, desc: '', amount: '', installments: '1', currentInst: '1' });
    descRef.current?.focus();
    onSuccess?.();
  };

  const handleToggleKey = (
    e: React.KeyboardEvent,
    options: string[],
    current: string,
    setter: (v: string) => void
  ) => {
    const idx = options.indexOf(current);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setter(options[(idx + 1) % options.length]);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setter(options[(idx - 1 + options.length) % options.length]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setter(options[(idx + 1) % options.length]);
    }
  };

  const filteredCards =
    formData.method === 'Débito'
      ? cards.filter((c) => c.type === 'Débito')
      : cards.filter((c) => c.type === 'Crédito');

  const cuotaAmount =
    parseInt(formData.installments) > 1 && parseFloat(formData.amount) > 0
      ? parseFloat(formData.amount) / parseInt(formData.installments)
      : null;

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-4 shadow-2xl">

      {/* Tipo */}
      <div
        className="flex bg-white/5 p-1 rounded-2xl"
        role="group"
        onKeyDown={(e) =>
          handleToggleKey(e, ['income','expense'], formData.type,
            (v) => setFormData({ ...formData, type: v as 'income'|'expense' }))
        }
      >
        {(['income','expense'] as const).map((t, i) => (
          <button key={t} type="button" tabIndex={i === 0 ? 0 : -1}
            onClick={() => setFormData({ ...formData, type: t })}
            aria-pressed={formData.type === t}
            className={`flex-1 p-3 rounded-xl font-bold transition-all focus:outline-none focus:ring-2 ${
              formData.type === t
                ? t === 'income' ? 'bg-emerald-500 focus:ring-emerald-400' : 'bg-rose-500 focus:ring-rose-400'
                : 'text-slate-400'
            }`}
          >
            {t === 'income' ? 'Ingreso' : 'Gasto'}
          </button>
        ))}
      </div>

      {/* Mes */}
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-emerald-500/50 transition-all">
        <CalendarDays size={16} className="text-slate-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
            Mes del movimiento
          </p>
          <input
            type="month"
            value={formData.month}
            onChange={(e) => setFormData({ ...formData, month: e.target.value })}
            className="bg-transparent text-white text-sm font-bold outline-none w-full"
          />
        </div>
      </div>

      {/* Moneda */}
      <div
        className="grid grid-cols-2 gap-2"
        role="group"
        onKeyDown={(e) =>
          handleToggleKey(e, ['ARS','USD'], formData.currency,
            (v) => setFormData({ ...formData, currency: v as 'ARS'|'USD' }))
        }
      >
        {(['ARS','USD'] as const).map((c, i) => (
          <button key={c} type="button" tabIndex={i === 0 ? 0 : -1}
            onClick={() => setFormData({ ...formData, currency: c })}
            aria-pressed={formData.currency === c}
            className={`p-2 rounded-xl border text-xs font-black transition-all focus:outline-none focus:ring-2 ${
              formData.currency === c
                ? c === 'ARS'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 focus:ring-emerald-400'
                  : 'border-blue-500 bg-blue-500/10 text-blue-400 focus:ring-blue-400'
                : 'border-white/10 text-slate-500'
            }`}
          >
            {c === 'ARS' ? '$ ARS' : 'U$S USD'}
          </button>
        ))}
      </div>

      {/* Descripción */}
      <input
        ref={descRef}
        placeholder="Descripción"
        className="w-full bg-white/10 p-4 rounded-2xl outline-none border border-transparent focus:border-emerald-500 transition-all placeholder:text-slate-600"
        value={formData.desc}
        onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
      />

      {/* Monto */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">
          {formData.currency === 'ARS' ? '$' : 'U$S'}
        </span>
        <input
          type="number" min="0" step="0.01" placeholder="0.00"
          className="w-full bg-white/10 p-4 pl-12 rounded-2xl outline-none text-2xl font-black placeholder:text-slate-700 border border-transparent focus:border-emerald-500 transition-all"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        />
      </div>

      {/* Ingreso: tipo fijo/variable */}
      {formData.type === 'income' ? (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Tipo de ingreso
          </p>
          <div
            className="grid grid-cols-2 gap-2"
            role="group"
            onKeyDown={(e) =>
              handleToggleKey(e, ['variable','fixed'], formData.incomeType,
                (v) => setFormData({ ...formData, incomeType: v as 'fixed'|'variable' }))
            }
          >
            {([
              { v: 'variable', label: 'Variable', sub: 'Solo este mes', color: 'blue' },
              { v: 'fixed',    label: 'Fijo',     sub: 'Sueldo / Regular', color: 'emerald' },
            ] as const).map(({ v, label, sub, color }, i) => (
              <button key={v} type="button" tabIndex={i === 0 ? 0 : -1}
                onClick={() => setFormData({ ...formData, incomeType: v })}
                aria-pressed={formData.incomeType === v}
                className={`p-3 rounded-2xl border text-xs font-black transition-all text-left space-y-0.5 focus:outline-none focus:ring-2 ${
                  formData.incomeType === v
                    ? color === 'blue'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400 focus:ring-blue-400'
                      : 'border-emerald-500 bg-emerald-500/10 text-emerald-400 focus:ring-emerald-400'
                    : 'border-white/10 text-slate-500'
                }`}
              >
                <p className="font-black">{label}</p>
                <p className="text-[10px] opacity-70 font-normal">{sub}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Método de pago */}
          <div
            className="flex bg-white/5 p-1 rounded-2xl"
            role="group"
            onKeyDown={(e) =>
              handleToggleKey(
                e,
                ['Efectivo','Débito','Crédito'],
                formData.method,
                (v) => setFormData({ ...formData, method: v as 'Efectivo'|'Débito'|'Crédito', cardId: '' })
              )
            }
          >
            {(['Efectivo','Débito','Crédito'] as const).map((m, i) => (
              <button key={m} type="button" tabIndex={i === 0 ? 0 : -1}
                onClick={() => setFormData({ ...formData, method: m, cardId: '' })}
                aria-pressed={formData.method === m}
                className={`flex-1 p-3 rounded-xl font-bold text-xs uppercase transition-all focus:outline-none focus:ring-2 focus:ring-white/30 ${
                  formData.method === m
                    ? m === 'Efectivo' ? 'bg-emerald-500 text-white'
                      : m === 'Débito' ? 'bg-blue-500 text-white'
                      : 'bg-purple-500 text-white'
                    : 'text-slate-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Categoría
            </p>
            <select
              className="w-full bg-white/10 p-4 rounded-2xl outline-none border border-transparent focus:border-emerald-500 transition-all text-sm font-bold"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as TransactionCategory })
              }
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
              ))}
            </select>
          </div>

          {/* Cuotas (solo crédito) */}
          {formData.method === 'Crédito' && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cuotas</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 ml-2 uppercase">Cuota actual N°</label>
                  <input type="number" min="1"
                    className="w-full bg-white/10 p-3 rounded-xl text-center font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                    value={formData.currentInst}
                    onChange={(e) => setFormData({ ...formData, currentInst: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 ml-2 uppercase">Total cuotas</label>
                  <input type="number" min="1"
                    className="w-full bg-white/10 p-3 rounded-xl text-center font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                    value={formData.installments}
                    onChange={(e) => setFormData({ ...formData, installments: e.target.value })} />
                </div>
              </div>
              {cuotaAmount !== null && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl px-4 py-2.5 text-center">
                  <p className="text-[10px] text-slate-500 font-bold">Cuota mensual</p>
                  <p className="text-purple-400 font-black text-sm">
                    {formData.currency === 'ARS' ? '$' : 'U$S'}{' '}
                    {cuotaAmount.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                    {' '}<span className="text-slate-600 font-normal text-[10px]">/ mes</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Selector de tarjeta */}
      {formData.type === 'expense' && formData.method !== 'Efectivo' && (
        <select
          className="w-full bg-white/10 p-4 rounded-2xl outline-none border border-emerald-500/30 focus:border-emerald-500/60 transition-all"
          value={formData.cardId}
          onChange={(e) => setFormData({ ...formData, cardId: e.target.value })}
        >
          <option value="" className="bg-slate-900">— Seleccionar Tarjeta —</option>
          {filteredCards.map((c) => (
            <option key={c.id} value={c.id} className="bg-slate-900">
              {c.bank} ({c.type})
            </option>
          ))}
          {filteredCards.length === 0 && (
            <option disabled className="bg-slate-900">No hay tarjetas de {formData.method}</option>
          )}
        </select>
      )}

      <button type="submit"
        className="w-full bg-emerald-500 p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-300">
        Registrar Movimiento
      </button>
    </form>
  );
}