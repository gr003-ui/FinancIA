"use client";
import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Plus, CreditCard as CardIcon, Trash2 } from 'lucide-react';
import TransactionForm from '../../components/TransactionForm';

export default function TarjetasPage() {
  const { cards, addCard, removeCard } = useFinanceStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newCard, setNewCard] = useState({
    bank: '',
    limitOne: '',
    limitInst: '',
    type: 'Crédito' as 'Crédito' | 'Débito',
  });

  const formatM = (v: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v);

  const handleAddCard = () => {
    if (!newCard.bank || !newCard.limitOne) return;
    addCard({
      bank: newCard.bank,
      type: newCard.type,
      limitOnePayment: Number(newCard.limitOne),
      limitInstallments: newCard.type === 'Crédito' ? Number(newCard.limitInst) : 0,
    });
    setShowAdd(false);
    setNewCard({ bank: '', limitOne: '', limitInst: '', type: 'Crédito' });
  };

  return (
    <main className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-8 space-y-8">

        <div className="flex justify-between items-center">
          <h1 className="text-5xl font-black tracking-tighter text-white">Mis Tarjetas</h1>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black flex gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
          >
            <Plus /> {showAdd ? 'CERRAR' : 'NUEVA TARJETA'}
          </button>
        </div>

        {showAdd && (
          <div className="bg-slate-900 p-10 rounded-[3rem] border border-white/10 grid grid-cols-2 gap-6">
            <input
              placeholder="Nombre del Banco"
              className="col-span-2 p-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white placeholder:text-slate-500 focus:border-emerald-500 transition-all"
              value={newCard.bank}
              onChange={e => setNewCard({ ...newCard, bank: e.target.value })}
            />
            <select
              className="p-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white"
              value={newCard.type}
              onChange={e => setNewCard({ ...newCard, type: e.target.value as 'Crédito' | 'Débito' })}
            >
              <option value="Crédito" className="bg-slate-900">Crédito</option>
              <option value="Débito" className="bg-slate-900">Débito</option>
            </select>
            <input
              placeholder="Límite 1 Pago"
              type="number"
              className="p-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white placeholder:text-slate-500 focus:border-emerald-500 transition-all"
              value={newCard.limitOne}
              onChange={e => setNewCard({ ...newCard, limitOne: e.target.value })}
            />
            {newCard.type === 'Crédito' && (
              <input
                placeholder="Límite Cuotas"
                type="number"
                className="col-span-2 p-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white placeholder:text-slate-500 focus:border-emerald-500 transition-all"
                value={newCard.limitInst}
                onChange={e => setNewCard({ ...newCard, limitInst: e.target.value })}
              />
            )}
            <button
              onClick={handleAddCard}
              className="col-span-2 bg-emerald-500 text-white p-6 rounded-2xl font-black uppercase hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
            >
              Guardar Tarjeta
            </button>
          </div>
        )}

        <div className="grid gap-6">
          {cards.length === 0 && (
            <div className="text-center py-20 text-slate-600 italic">
              No tenés tarjetas cargadas todavía.
            </div>
          )}
          {cards.map(c => (
            <div
              key={c.id}
              className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center border border-white/10 relative group"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <CardIcon className="text-emerald-500" size={28} />
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full uppercase">
                    {c.type}
                  </span>
                </div>
                <h3 className="text-3xl font-black tracking-tighter">{c.bank}</h3>
              </div>

              <div className="flex gap-4 mt-4 md:mt-0">
                <div className="bg-white/5 p-6 rounded-[2rem] text-right min-w-[160px] border border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase">1 Pago</p>
                  <p className="text-xl font-black text-emerald-400">{formatM(c.availableOnePayment)}</p>
                  <p className="text-[10px] text-slate-600 mt-1">de {formatM(c.limitOnePayment)}</p>
                </div>
                {c.type === 'Crédito' && (
                  <div className="bg-white/5 p-6 rounded-[2rem] text-right min-w-[160px] border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Cuotas</p>
                    <p className="text-xl font-black text-blue-400">{formatM(c.availableInstallments)}</p>
                    <p className="text-[10px] text-slate-600 mt-1">de {formatM(c.limitInstallments)}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => removeCard(c.id)}
                className="absolute top-6 right-6 text-slate-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-4 h-fit sticky top-10">
        <TransactionForm />
      </div>
    </main>
  );
}