"use client";
import { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
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
    month: toMonthValue(new Date()), // YYYY-MM
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.desc || !formData.amount) return;

    // Construye la fecha usando el mes seleccionado (día 1 a medianoche)
    const [year, month] = formData.month.split('-').map(Number);
    const txDate = new Date(year, month - 1, 1, 12, 0, 0).toISOString();

    addTransaction({
      description: formData.desc,
      amount: parseFloat(formData.amount),
      type: formData.type,
      incomeType: formData.type === 'income' ? formData.incomeType : undefined,
      method: formData.method,
      currency: formData.currency,
      date: txDate,
      installments: parseInt(formData.installments) || 1,
      currentInstallment: parseInt(formData.currentInst) || 1,
      cardId: (formData.type === 'expense' && formData.method !== 'Efectivo')
        ? formData.cardId
        : undefined,
    });

    setFormData({
      ...formData,
      desc: '',
      amount: '',
      installments: '1',
      currentInst: '1',
    });
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-4 shadow-2xl">

      {/* Tipo: Ingreso / Gasto */}
      <div className="flex bg-white/5 p-1 rounded-2xl">
        <button type="button"
          onClick={() => setFormData({ ...formData, type: 'income' })}
          className={`flex-1 p-3 rounded-xl font-bold transition-all ${formData.type === 'income' ? 'bg-emerald-500' : 'text-slate-400'}`}>
          Ingreso
        </button>
        <button type="button"
          onClick={() => setFormData({ ...formData, type: 'expense' })}
          className={`flex-1 p-3 rounded-xl font-bold transition-all ${formData.type === 'expense' ? 'bg-rose-500' : 'text-slate-400'}`}>
          Gasto
        </button>
      </div>

      {/* Selector de mes */}
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-emerald-500/50 transition-all">
        <CalendarDays size={16} className="text-slate-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Mes del movimiento</p>
          <input
            type="month"
            value={formData.month}
            onChange={e => setFormData({ ...formData, month: e.target.value })}
            className="bg-transparent text-white text-sm font-bold outline-none w-full"
          />
        </div>
      </div>

      {/* Moneda */}
      <div className="grid grid-cols-2 gap-2">
        <button type="button"
          onClick={() => setFormData({ ...formData, currency: 'ARS' })}
          className={`p-2 rounded-xl border text-xs font-black transition-all ${formData.currency === 'ARS' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-white/10 text-slate-500'}`}>
          $ ARS
        </button>
        <button type="button"
          onClick={() => setFormData({ ...formData, currency: 'USD' })}
          className={`p-2 rounded-xl border text-xs font-black transition-all ${formData.currency === 'USD' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/10 text-slate-500'}`}>
          U$S USD
        </button>
      </div>

      {/* Descripción */}
      <input
        placeholder="Descripción"
        className="w-full bg-white/10 p-4 rounded-2xl outline-none border border-transparent focus:border-emerald-500 transition-all placeholder:text-slate-600"
        value={formData.desc}
        onChange={e => setFormData({ ...formData, desc: e.target.value })}
      />

      {/* Monto */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">
          {formData.currency === 'ARS' ? '$' : 'U$S'}
        </span>
        <input
          type="number"
          placeholder="0.00"
          className="w-full bg-white/10 p-4 pl-12 rounded-2xl outline-none text-2xl font-black placeholder:text-slate-700"
          value={formData.amount}
          onChange={e => setFormData({ ...formData, amount: e.target.value })}
        />
      </div>

      {/* Campos según tipo */}
      {formData.type === 'income' ? (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de ingreso</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button"
              onClick={() => setFormData({ ...formData, incomeType: 'variable' })}
              className={`p-3 rounded-2xl border text-xs font-black transition-all text-left space-y-0.5 ${
                formData.incomeType === 'variable'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-white/10 text-slate-500 hover:border-white/20'
              }`}>
              <p className="font-black">Variable</p>
              <p className="text-[10px] opacity-70 font-normal">Solo este mes</p>
            </button>
            <button type="button"
              onClick={() => setFormData({ ...formData, incomeType: 'fixed' })}
              className={`p-3 rounded-2xl border text-xs font-black transition-all text-left space-y-0.5 ${
                formData.incomeType === 'fixed'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-white/10 text-slate-500 hover:border-white/20'
              }`}>
              <p className="font-black">Fijo</p>
              <p className="text-[10px] opacity-70 font-normal">Sueldo / Regular</p>
            </button>
          </div>
        </div>
      ) : (
        <>
          <select
            className="w-full bg-white/10 p-4 rounded-2xl outline-none"
            value={formData.method}
            onChange={e => setFormData({ ...formData, method: e.target.value as 'Efectivo' | 'Débito' | 'Crédito' })}>
            <option value="Efectivo" className="bg-slate-900">Efectivo</option>
            <option value="Débito" className="bg-slate-900">Tarjeta Débito</option>
            <option value="Crédito" className="bg-slate-900">Tarjeta Crédito</option>
          </select>

          {formData.method === 'Crédito' && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cuotas</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 ml-2 uppercase">Cuota actual N°</label>
                  <input type="number" min="1"
                    className="w-full bg-white/10 p-3 rounded-xl text-center font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                    value={formData.currentInst}
                    onChange={e => setFormData({ ...formData, currentInst: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 ml-2 uppercase">Total cuotas</label>
                  <input type="number" min="1"
                    className="w-full bg-white/10 p-3 rounded-xl text-center font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                    value={formData.installments}
                    onChange={e => setFormData({ ...formData, installments: e.target.value })} />
                </div>
              </div>
              {parseInt(formData.installments) > 1 && parseFloat(formData.amount) > 0 && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl px-4 py-2.5 text-center">
                  <p className="text-[10px] text-slate-500 font-bold">Cuota mensual</p>
                  <p className="text-purple-400 font-black text-sm">
                    $ {(parseFloat(formData.amount) / parseInt(formData.installments)).toLocaleString('es-AR', { maximumFractionDigits: 2 })} / mes
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
          className="w-full bg-white/10 p-4 rounded-2xl outline-none border border-emerald-500/30"
          value={formData.cardId}
          onChange={e => setFormData({ ...formData, cardId: e.target.value })}>
          <option value="" className="bg-slate-900">— Seleccionar Tarjeta —</option>
          {cards.map(c => (
            <option key={c.id} value={c.id} className="bg-slate-900">
              {c.bank} ({c.type})
            </option>
          ))}
        </select>
      )}

      <button type="submit"
        className="w-full bg-emerald-500 p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all">
        Registrar Movimiento
      </button>
    </form>
  );
}