"use client";
import { CreditCard, AlertTriangle } from 'lucide-react';
import { Card } from '../store/useFinanceStore';

interface CardCreditProps {
  card: Card;
  gradient?: string;
}

const formatM = (v: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);

export default function CardCredit({ card, gradient = 'from-emerald-600 to-emerald-900' }: CardCreditProps) {
  const isSingle = card.singleLimit ?? false;

  const usedOne = card.limitOnePayment - card.availableOnePayment;
  const percentUsedOne = card.limitOnePayment > 0
    ? Math.min((usedOne / card.limitOnePayment) * 100, 100) : 0;

  const usedInst = card.limitInstallments - card.availableInstallments;
  const percentUsedInst = card.limitInstallments > 0
    ? Math.min((usedInst / card.limitInstallments) * 100, 100) : 0;

  const isLowOne = card.limitOnePayment > 0 && (card.availableOnePayment / card.limitOnePayment) < 0.2;
  const isLowInst = !isSingle && card.limitInstallments > 0 && (card.availableInstallments / card.limitInstallments) < 0.2;

  return (
    <div className={`bg-gradient-to-br ${gradient} p-7 rounded-[2rem] text-white shadow-xl space-y-6 relative overflow-hidden group`}>

      {(isLowOne || isLowInst) && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-black px-3 py-1.5 rounded-full z-20 backdrop-blur-sm">
          <AlertTriangle size={11} />
          LÍMITE BAJO
        </div>
      )}

      <div className="flex justify-between items-start relative z-10">
        <CreditCard size={32} strokeWidth={1.5} className="opacity-80" />
        <div className="text-right">
          <p className="font-black italic text-xl">{card.bank}</p>
          <div className="flex gap-2 justify-end mt-1">
            <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full uppercase">
              {card.type}
            </span>
            {isSingle && (
              <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full uppercase">
                Límite único
              </span>
            )}
          </div>
        </div>
      </div>

      {isSingle ? (
        /* LÍMITE ÚNICO — un solo pool para todo */
        <div className="relative z-10 space-y-1.5">
          <p className="text-[10px] font-bold uppercase opacity-60">Disponible</p>
          <p className={`text-2xl font-black ${isLowOne ? 'text-amber-300' : 'text-white'}`}>
            {formatM(card.availableOnePayment)}
          </p>
          <div className="flex justify-between text-[10px] font-bold opacity-50">
            <span>Límite: {formatM(card.limitOnePayment)}</span>
            <span>{Math.round(100 - percentUsedOne)}% libre</span>
          </div>
          <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${isLowOne ? 'bg-amber-300' : 'bg-white'}`}
              style={{ width: `${100 - percentUsedOne}%` }}
            />
          </div>
        </div>
      ) : (
        /* LÍMITE DUAL — 1 pago + cuotas */
        <>
          <div className="relative z-10 space-y-1.5">
            <p className="text-[10px] font-bold uppercase opacity-60">Disponible — 1 Pago</p>
            <p className={`text-2xl font-black ${isLowOne ? 'text-amber-300' : 'text-white'}`}>
              {formatM(card.availableOnePayment)}
            </p>
            <div className="flex justify-between text-[10px] font-bold opacity-50">
              <span>Límite: {formatM(card.limitOnePayment)}</span>
              <span>{Math.round(100 - percentUsedOne)}% libre</span>
            </div>
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${isLowOne ? 'bg-amber-300' : 'bg-white'}`}
                style={{ width: `${100 - percentUsedOne}%` }}
              />
            </div>
          </div>

          {card.type === 'Crédito' && card.limitInstallments > 0 && (
            <div className="relative z-10 space-y-1.5 pt-2 border-t border-white/20">
              <p className="text-[10px] font-bold uppercase opacity-60">Disponible — Cuotas</p>
              <p className={`text-xl font-black ${isLowInst ? 'text-amber-300' : 'text-white'}`}>
                {formatM(card.availableInstallments)}
              </p>
              <div className="flex justify-between text-[10px] font-bold opacity-50">
                <span>Límite: {formatM(card.limitInstallments)}</span>
                <span>{Math.round(100 - percentUsedInst)}% libre</span>
              </div>
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${isLowInst ? 'bg-amber-300' : 'bg-white'}`}
                  style={{ width: `${100 - percentUsedInst}%` }}
                />
              </div>
            </div>
          )}
        </>
      )}

      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 z-0" />
    </div>
  );
}