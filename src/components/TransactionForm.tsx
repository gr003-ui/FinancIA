"use client";
import { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';

interface TransactionFormProps {
  onSuccess?: () => void;
}

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const { cards, addTransaction } = useFinanceStore();
  const [formData, setFormData] = useState({
    desc: '', amount: '', type: 'expense' as 'income' | 'expense',
    incomeType: 'variable' as 'fixed' | 'variable',
    method: 'Efectivo' as 'Efectivo' | 'Débito' | 'Crédito',
    currency: 'ARS' as 'ARS' | 'USD',
    installments: '1', currentInst: '1', cardId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.desc || !formData.amount) return;

    addTransaction({
      description: formData.desc,
      amount: parseFloat(formData.amount),
      type: formData.type,
      incomeType: formData.type === 'income' ? formData.incomeType : undefined,
      method: formData.method,
      currency: formData.currency,
      date: new Date().toISOString(),
      installments: parseInt(formData.installments) || 1,
      currentInstallment: parseInt(formData.currentInst) || 1,
      cardId: (formData.type === 'expense' && formData.method !== 'Efectivo') ? formData.cardId : undefined,
    });

    setFormData({ ...formData, desc: '', amount: '', installments: '1', currentInst: '1' });
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-4 shadow-2xl">
      <div className="flex bg-white/5 p-1 rounded-2xl">
        <button type="button" onClick={() => setFormData({ ...formData, type: 'income' })}
          className={`flex-1 p-3 rounded-xl font-bold transition-all ${formData.type === 'income' ? 'bg-emerald-500' : 'text-slate-400'}`}>
          Ingreso
        </button>
        <button type="button" onClick={() => setFormData({ ...formData, type: 'expense' })}
          className={`flex-1 p-3 rounded-xl font-bold transition-all ${formData.type === 'expense' ? 'bg-rose-500' : 'text-slate-400'}`}>
          Gasto
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setFormData({ ...formData, currency: 'ARS' })}
          className={`p-2 rounded-xl border text-xs font-black ${formData.currency === 'ARS' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-white/10 text-slate-500'}`}>
          ARS
        </button>
        <button type="button" onClick={() => setFormData({ ...formData, currency: 'USD' })}
          className={`p-2 rounded-xl border text-xs font-black ${formData.currency === 'USD' ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-white/10 text-slate-500'}`}>
          USD
        </button>
      </div>

      <input
        placeholder="Descripción"
        className="w-full bg-white/10 p-4 rounded-2xl outline-none border border-transparent focus:border-emerald-500 transition-all"
        value={formData.desc}
        onChange={e => setFormData({ ...formData, desc: e.target.value })}
      />

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">
          {formData.currency === 'ARS' ? '$' : 'U$S'}
        </span>
        <input
          type="number"
          placeholder="0.00"
          className="w-full bg-white/10 p-4 pl-12 rounded-2xl outline-none text-2xl font-black"
          value={formData.amount}
          onChange={e => setFormData({ ...formData, amount: e.target.value })}
        />
      </div>

      {formData.type === 'income' ? (
        <select
          className="w-full bg-white/10 p-4 rounded-2xl outline-none"
          value={formData.incomeType}
          onChange={e => setFormData({ ...formData, incomeType: e.target.value as 'fixed' | 'variable' })}
        >
          <option value="variable" className="bg-slate-900">Ingreso Variable</option>
          <option value="fixed" className="bg-slate-900">Ingreso Fijo (Sueldo)</option>
        </select>
      ) : (
        <>
          <select
            className="w-full bg-white/10 p-4 rounded-2xl outline-none"
            value={formData.method}
            onChange={e => setFormData({ ...formData, method: e.target.value as 'Efectivo' | 'Débito' | 'Crédito' })}
          >
            <option value="Efectivo" className="bg-slate-900">Efectivo</option>
            <option value="Débito" className="bg-slate-900">Tarjeta Débito</option>
            <option value="Crédito" className="bg-slate-900">Tarjeta Crédito</option>
          </select>

          {formData.method === 'Crédito' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 ml-2 uppercase">Cuota N°</label>
                <input type="number" className="w-full bg-white/10 p-3 rounded-xl text-center font-bold"
                  value={formData.currentInst}
                  onChange={e => setFormData({ ...formData, currentInst: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 ml-2 uppercase">De un total de</label>
                <input type="number" className="w-full bg-white/10 p-3 rounded-xl text-center font-bold"
                  value={formData.installments}
                  onChange={e => setFormData({ ...formData, installments: e.target.value })} />
              </div>
            </div>
          )}
        </>
      )}

      {(formData.method !== 'Efectivo' && formData.type === 'expense') && (
        <select
          className="w-full bg-white/10 p-4 rounded-2xl outline-none border border-emerald-500/30"
          value={formData.cardId}
          onChange={e => setFormData({ ...formData, cardId: e.target.value })}
        >
          <option value="" className="bg-slate-900">Seleccionar Tarjeta</option>
          {cards.map(c => (
            <option key={c.id} value={c.id} className="bg-slate-900">{c.bank} ({c.type})</option>
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