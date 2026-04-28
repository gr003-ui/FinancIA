"use client";
import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Plus, Trash2, Receipt, ToggleLeft, ToggleRight } from 'lucide-react';
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
  const { cards, transactions, addCard, removeCard } = useFinanceStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newCard, setNewCard] = useState({
    bank: '',
    limitOne: '',
    limitInst: '',
    type: 'Crédito' as 'Crédito' | 'Débito',
    singleLimit: false,
  });

  const formatM = (v: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(v);

  const handleAddCard = () => {
    if (!newCard.bank) return;
    if (newCard.type === 'Crédito' && !newCard.limitOne) return;

    addCard({
      bank: newCard.bank,
      type: newCard.type,
      singleLimit: newCard.type === 'Débito' ? true : newCard.singleLimit,
      limitOnePayment: newCard.type === 'Débito' ? 0 : Number(newCard.limitOne),
      limitInstallments:
        newCard.type === 'Crédito' && !newCard.singleLimit
          ? Number(newCard.limitInst)
          : 0,
    });
    setShowAdd(false);
    setNewCard({ bank: '', limitOne: '', limitInst: '', type: 'Crédito', singleLimit: false });
  };

  const installmentTxs = transactions.filter(
    (t) => t.type === 'expense' && t.method === 'Crédito' && t.installments > 1
  );

  return (
    <main className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-8 space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-5xl font-black tracking-tighter text-white">
            Mis Tarjetas
          </h1>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black flex gap-2 items-center shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            <Plus size={18} /> {showAdd ? 'CERRAR' : 'NUEVA TARJETA'}
          </button>
        </div>

        {/* Formulario nueva tarjeta */}
        {showAdd && (
          <div className="bg-slate-900 p-10 rounded-[3rem] border border-white/10 space-y-6">

            <input
              placeholder="Nombre del Banco / Entidad"
              className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white placeholder:text-slate-500 focus:border-emerald-500 transition-all"
              value={newCard.bank}
              onChange={(e) => setNewCard({ ...newCard, bank: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCard()}
            />

            {/* Tipo de tarjeta */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Tipo de tarjeta
              </p>
              <div className="flex bg-white/5 p-1 rounded-2xl gap-1">
                {(['Crédito', 'Débito'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setNewCard({ ...newCard, type: t, singleLimit: false })
                    }
                    className={`flex-1 p-3 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-white/30 ${
                      newCard.type === t
                        ? t === 'Crédito'
                          ? 'bg-purple-500 text-white'
                          : 'bg-blue-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Débito: sin límites */}
            {newCard.type === 'Débito' && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 text-xs text-blue-400 font-bold">
                Las tarjetas de débito no tienen límite mensual propio. El saldo disponible
                se calcula a partir de tus ingresos mensuales menos los gastos registrados.
              </div>
            )}

            {/* Crédito: opciones de límite */}
            {newCard.type === 'Crédito' && (
              <>
                {/* Toggle límite único / dual */}
                <button
                  type="button"
                  onClick={() =>
                    setNewCard({ ...newCard, singleLimit: !newCard.singleLimit })
                  }
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-white/20 ${
                    newCard.singleLimit
                      ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                      : 'border-white/10 bg-white/5 text-slate-400'
                  }`}
                >
                  <span>
                    {newCard.singleLimit
                      ? '✓ Límite único para todo'
                      : 'Límite dual (1 pago + cuotas)'}
                  </span>
                  {newCard.singleLimit ? (
                    <ToggleRight size={22} className="text-blue-400" />
                  ) : (
                    <ToggleLeft size={22} className="text-slate-500" />
                  )}
                </button>

                <div
                  className={`text-xs px-4 py-3 rounded-2xl border ${
                    newCard.singleLimit
                      ? 'bg-blue-500/5 border-blue-500/20 text-blue-400'
                      : 'bg-white/5 border-white/10 text-slate-500'
                  }`}
                >
                  {newCard.singleLimit
                    ? 'Un solo límite disponible para compras en 1 pago y en cuotas. Ej: Visa Débito o tarjetas simples.'
                    : 'Límite separado para 1 pago y para cuotas. Las compras reducen AMBOS límites proporcionalmente. Ej: Mastercard con sub-límite.'}
                </div>

                <input
                  placeholder={newCard.singleLimit ? 'Límite disponible total' : 'Límite 1 Pago'}
                  type="number"
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white placeholder:text-slate-500 focus:border-emerald-500 transition-all"
                  value={newCard.limitOne}
                  onChange={(e) => setNewCard({ ...newCard, limitOne: e.target.value })}
                />

                {!newCard.singleLimit && (
                  <input
                    placeholder="Sub-límite Cuotas (menor o igual al límite 1 pago)"
                    type="number"
                    className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white placeholder:text-slate-500 focus:border-emerald-500 transition-all"
                    value={newCard.limitInst}
                    onChange={(e) => setNewCard({ ...newCard, limitInst: e.target.value })}
                  />
                )}
              </>
            )}

            <button
              onClick={handleAddCard}
              className="w-full bg-emerald-500 text-white p-6 rounded-2xl font-black uppercase hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              Guardar Tarjeta
            </button>
          </div>
        )}

        {cards.length === 0 && (
          <div className="text-center py-16 text-slate-600 italic">
            No tenés tarjetas cargadas todavía.
          </div>
        )}

        <div className="grid gap-6">
          {cards.map((card, index) => (
            <div key={card.id} className="relative group">
              <CardCredit card={card} gradient={GRADIENTS[index % GRADIENTS.length]} />
              <button
                onClick={() => removeCard(card.id)}
                className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 hover:bg-rose-500 text-white p-2 rounded-xl focus:outline-none focus:opacity-100 focus:ring-2 focus:ring-rose-400"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Cuotas en curso */}
        {installmentTxs.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Receipt size={18} className="text-purple-400" />
              <h2 className="text-xl font-black text-white tracking-tight">
                Cuotas en Curso
              </h2>
              <span className="text-[10px] font-black bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">
                {installmentTxs.length}
              </span>
            </div>
            <div className="space-y-3">
              {installmentTxs.map((t) => {
                const card = cards.find((c) => c.id === t.cardId);
                const progress = (t.currentInstallment / t.installments) * 100;
                const remaining = t.installments - t.currentInstallment;
                const cuotaAmount = t.amount / t.installments;
                return (
                  <div
                    key={t.id}
                    className="bg-slate-900 border border-white/10 p-5 rounded-[2rem] flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-white text-sm">{t.description}</p>
                        {card && (
                          <p className="text-[10px] text-slate-500 mt-0.5">{card.bank}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-black text-purple-400 text-sm">
                          {t.currency === 'USD'
                            ? `U$S ${cuotaAmount.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`
                            : formatM(cuotaAmount)}
                          <span className="text-slate-600 font-normal text-[10px] ml-1">
                            / mes
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          total:{' '}
                          {t.currency === 'USD' ? `U$S ${t.amount}` : formatM(t.amount)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase">
                        <span>Cuota {t.currentInstallment} de {t.installments}</span>
                        <span>{remaining > 0 ? `Faltan ${remaining}` : 'Última cuota'}</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-400 h-full transition-all duration-700"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-4 h-fit sticky top-10">
        <TransactionForm />
      </div>
    </main>
  );
}