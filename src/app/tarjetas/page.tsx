"use client";
import { useState } from 'react';
import { useFinanceStore, filterByImpactMonth, getInstallmentForMonth, getMonthlyAmount } from '../../store/useFinanceStore';
import { Plus, Trash2, Receipt, ToggleLeft, ToggleRight, CheckCircle, Upload, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TransactionForm from '../../components/TransactionForm';
import CardCredit from '../../components/CardCredit';
import AlertsPanel from '../../components/AlertsPanel';
import CardStatementUploader from '../../components/CardStatementUploader';

const GRADIENTS = [
  'from-emerald-600 to-emerald-900',
  'from-blue-600 to-blue-900',
  'from-purple-600 to-purple-900',
  'from-rose-600 to-rose-900',
  'from-amber-600 to-amber-900',
];

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function TarjetasPage() {
  const {
    cards, transactions, billPayments,
    addCard, removeCard,
    markCardBillAsPaid, unmarkCardBillAsPaid,
    exchangeRate,
  } = useFinanceStore();

  const now = new Date();

  const [showAdd,   setShowAdd]   = useState(false);
  const [uploaderCard, setUploaderCard] = useState<{ id: string; bank: string } | null>(null);
  const [newCard,   setNewCard]   = useState({
    bank: '', limitOne: '', limitInst: '',
    type: 'Crédito' as 'Crédito' | 'Débito',
    singleLimit: false, closingDay: '', dueDay: '',
  });

  const formatM = (v: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
    }).format(v);

  const handleAddCard = () => {
    if (!newCard.bank) return;
    if (newCard.type === 'Crédito' && !newCard.limitOne) return;
    addCard({
      bank:             newCard.bank,
      type:             newCard.type,
      singleLimit:      newCard.type === 'Débito' ? true : newCard.singleLimit,
      limitOnePayment:  newCard.type === 'Débito' ? 0 : Number(newCard.limitOne),
      limitInstallments: newCard.type === 'Crédito' && !newCard.singleLimit ? Number(newCard.limitInst) : 0,
      closingDay:       newCard.closingDay ? Number(newCard.closingDay) : undefined,
      dueDay:           newCard.dueDay     ? Number(newCard.dueDay)     : undefined,
    });
    setShowAdd(false);
    setNewCard({ bank: '', limitOne: '', limitInst: '', type: 'Crédito', singleLimit: false, closingDay: '', dueDay: '' });
  };

  // El "mes de consumo" actual es el mes anterior (porque pagás el resumen de este mes el mes que viene)
  const billingMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const billingYear  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const isCardPaidThisMonth = (cardId: string) =>
    billPayments.some(
      (p) => p.cardId === cardId &&
             p.billingMonth === billingMonth &&
             p.billingYear  === billingYear
    );

  const getCardBillTotal = (cardId: string) => {
    return transactions
      .filter((t) => {
        if (t.type !== 'expense' || t.method !== 'Crédito' || t.cardId !== cardId) return false;
        const d = new Date(t.date);
        return d.getMonth() === billingMonth && d.getFullYear() === billingYear;
      })
      .reduce((acc, t) => {
        const monthly = t.installments > 1 ? t.amount / t.installments : t.amount;
        return acc + (t.currency === 'USD' ? monthly * exchangeRate : monthly);
      }, 0);
  };

  // Cuotas activas para mostrar
  const installmentTxs = transactions.filter(
    (t) => t.type === 'expense' && t.method === 'Crédito' && t.installments > 1
  );

  return (
    <main className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-8 space-y-8">

        <div className="flex justify-between items-center">
          <h1 className="text-5xl font-black tracking-tighter text-white">Mis Tarjetas</h1>
          <button onClick={() => setShowAdd(!showAdd)}
            className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black flex gap-2 items-center shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all">
            <Plus size={18} /> {showAdd ? 'CERRAR' : 'NUEVA TARJETA'}
          </button>
        </div>

        <AlertsPanel />

        {/* Formulario nueva tarjeta */}
        {showAdd && (
          <div className="bg-slate-900 p-10 rounded-[3rem] border border-white/10 space-y-6">
            <input placeholder="Nombre del Banco / Entidad"
              className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white placeholder:text-slate-500 focus:border-emerald-500 transition-all"
              value={newCard.bank} onChange={(e) => setNewCard({ ...newCard, bank: e.target.value })} />

            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo</p>
              <div className="flex bg-white/5 p-1 rounded-2xl gap-1">
                {(['Crédito','Débito'] as const).map((t) => (
                  <button key={t} type="button"
                    onClick={() => setNewCard({ ...newCard, type: t, singleLimit: false })}
                    className={`flex-1 p-3 rounded-xl font-bold text-sm transition-all ${
                      newCard.type === t
                        ? t === 'Crédito' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >{t}</button>
                ))}
              </div>
            </div>

            {newCard.type === 'Débito' && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 text-xs text-blue-400 font-bold">
                Las tarjetas de débito no tienen límite mensual propio.
              </div>
            )}

            {newCard.type === 'Crédito' && (
              <>
                <button type="button"
                  onClick={() => setNewCard({ ...newCard, singleLimit: !newCard.singleLimit })}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border font-bold text-sm transition-all ${
                    newCard.singleLimit ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' : 'border-white/10 bg-white/5 text-slate-400'
                  }`}>
                  <span>{newCard.singleLimit ? '✓ Límite único para todo' : 'Límite dual (1 pago + cuotas)'}</span>
                  {newCard.singleLimit ? <ToggleRight size={22} className="text-blue-400" /> : <ToggleLeft size={22} className="text-slate-500" />}
                </button>

                <input placeholder={newCard.singleLimit ? 'Límite disponible total' : 'Límite 1 Pago'} type="number"
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white placeholder:text-slate-500 focus:border-emerald-500 transition-all"
                  value={newCard.limitOne} onChange={(e) => setNewCard({ ...newCard, limitOne: e.target.value })} />

                {!newCard.singleLimit && (
                  <input placeholder="Sub-límite Cuotas" type="number"
                    className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white placeholder:text-slate-500 focus:border-emerald-500 transition-all"
                    value={newCard.limitInst} onChange={(e) => setNewCard({ ...newCard, limitInst: e.target.value })} />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 ml-2 uppercase">Día de Cierre</label>
                    <input type="number" min="1" max="31" placeholder="Ej: 15"
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white placeholder:text-slate-600 focus:border-emerald-500 transition-all text-center"
                      value={newCard.closingDay} onChange={(e) => setNewCard({ ...newCard, closingDay: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 ml-2 uppercase">Día de Vencimiento</label>
                    <input type="number" min="1" max="31" placeholder="Ej: 5"
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white placeholder:text-slate-600 focus:border-emerald-500 transition-all text-center"
                      value={newCard.dueDay} onChange={(e) => setNewCard({ ...newCard, dueDay: e.target.value })} />
                  </div>
                </div>
              </>
            )}

            <button onClick={handleAddCard}
              className="w-full bg-emerald-500 text-white p-6 rounded-2xl font-black uppercase hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
              Guardar Tarjeta
            </button>
          </div>
        )}

        {cards.length === 0 && (
          <div className="text-center py-16 text-slate-600 italic">
            No tenés tarjetas cargadas todavía.
          </div>
        )}

        {/* Lista de tarjetas */}
        <div className="grid gap-6">
          {cards.map((card, index) => {
            const isPaid     = isCardPaidThisMonth(card.id);
            const billTotal  = getCardBillTotal(card.id);

            return (
              <div key={card.id} className="space-y-3">
                <div className="relative group">
                  <CardCredit card={card} gradient={GRADIENTS[index % GRADIENTS.length]} />
                  <button onClick={() => removeCard(card.id)}
                    className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 hover:bg-rose-500 text-white p-2 rounded-xl">
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Acciones del resumen */}
                {card.type === 'Crédito' && (
                  <div className="flex items-center gap-3 flex-wrap">

                    {/* Marcar como pagada */}
                    {billTotal > 0 && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          if (isPaid) {
                            unmarkCardBillAsPaid(card.id, billingMonth, billingYear);
                          } else {
                            markCardBillAsPaid(card.id, billingMonth, billingYear);
                          }
                        }}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase transition-all border ${
                          isPaid
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-emerald-500/30 hover:text-emerald-400'
                        }`}
                      >
                        <CheckCircle size={14} />
                        {isPaid
                          ? `Resumen ${MONTHS_SHORT[billingMonth]} pagado`
                          : `Marcar resumen ${MONTHS_SHORT[billingMonth]} como pagado`}
                        {!isPaid && billTotal > 0 && (
                          <span className="ml-1 text-rose-400">({formatM(billTotal)})</span>
                        )}
                      </motion.button>
                    )}

                    {billTotal === 0 && !isPaid && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-slate-600 text-xs">
                        <AlertCircle size={12} />
                        Sin consumos en {MONTHS[billingMonth]}
                      </div>
                    )}

                    {/* Cargar resumen */}
                    <button
                      onClick={() => setUploaderCard({ id: card.id, bank: card.bank })}
                      className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20 transition-all"
                    >
                      <Upload size={14} />
                      Cargar resumen con IA
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Cuotas en curso */}
        {installmentTxs.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Receipt size={18} className="text-purple-400" />
              <h2 className="text-xl font-black text-white tracking-tight">Cuotas en Curso</h2>
              <span className="text-[10px] font-black bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">
                {installmentTxs.length}
              </span>
            </div>
            <div className="space-y-3">
              {installmentTxs.map((t) => {
                const card             = cards.find((c) => c.id === t.cardId);
                const cuotaAmount      = t.amount / t.installments;

                // Cuota actual: la que vence el mes que viene
                const nextM            = now.getMonth() + 1 > 11 ? 0 : now.getMonth() + 1;
                const nextY            = now.getMonth() + 1 > 11 ? now.getFullYear() + 1 : now.getFullYear();
                const cuotaActual      = getInstallmentForMonth(t, nextM, nextY);
                const cuotasRestantes  = t.installments - cuotaActual + 1;
                const progress         = ((cuotaActual - 1) / t.installments) * 100;

                if (cuotaActual > t.installments) return null; // ya terminó

                return (
                  <div key={t.id}
                    className="bg-slate-900 border border-white/10 p-5 rounded-[2rem] flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-white text-sm">{t.description}</p>
                        {card && <p className="text-[10px] text-slate-500 mt-0.5">{card.bank}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-black text-purple-400 text-sm">
                          {t.currency === 'USD'
                            ? `U$S ${cuotaAmount.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`
                            : formatM(cuotaAmount)}
                          <span className="text-slate-600 font-normal text-[10px] ml-1">/ mes</span>
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          total: {t.currency === 'USD' ? `U$S ${t.amount}` : formatM(t.amount)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase">
                        <span>
                          Próxima: cuota {cuotaActual} de {t.installments}
                          <span className="text-purple-400/60 ml-2">
                            (pago en {MONTHS_SHORT[nextM]})
                          </span>
                        </span>
                        <span>{cuotasRestantes > 0 ? `Faltan ${cuotasRestantes}` : 'Última cuota'}</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-400 h-full transition-all duration-700"
                          style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        )}

      </div>

      <div className="lg:col-span-4 h-fit sticky top-10">
        <TransactionForm />
      </div>

      {/* Modal de carga de resumen */}
      <AnimatePresence>
        {uploaderCard && (
          <CardStatementUploader
            cardId={uploaderCard.id}
            cardBank={uploaderCard.bank}
            onClose={() => setUploaderCard(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}