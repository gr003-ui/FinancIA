"use client";
import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Plus, Trash2 } from 'lucide-react';
import TransactionForm from '../../components/TransactionForm';
import CardCredit from '../../components/CardCredit';

const GRADIENTS = [
  'from-emerald-600 to-emerald-900',
  'from-blue-600 to-blue-900',
  'from-purple-600 to-purple-900',
  'from-rose-600 to-rose-900',
  'from-amber-600 to-amber-900',
];

export default function TarjetasPage() {
  const { cards, addCard, removeCard } = useFinanceStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newCard, setNewCard] = useState({
    bank: '',
    limitOne: '',
    limitInst: '',
    type: 'Crédito' as 'Crédito' | 'Débito',
  });

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
            className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black flex gap-2 items-center shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
          >
            <Plus size={18} /> {showAdd ? 'CERRAR' : 'NUEVA TARJETA'}
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

        {cards.length === 0 && (
          <div className="text-center py-20 text-slate-600 italic">
            No tenés tarjetas cargadas todavía.
          </div>
        )}

        <div className="grid gap-6">
          {cards.map((card, index) => (
            <div key={card.id} className="relative group">
              <CardCredit
                card={card}
                gradient={GRADIENTS[index % GRADIENTS.length]}
              />
              <button
                onClick={() => removeCard(card.id)}
                className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 hover:bg-rose-500 text-white p-2 rounded-xl"
              >
                <Trash2 size={16} />
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