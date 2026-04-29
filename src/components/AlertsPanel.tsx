"use client";
import { useFinanceStore, getDaysUntil } from '../store/useFinanceStore';
import { Bell, X, CreditCard, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function AlertsPanel() {
  const { cards } = useFinanceStore();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const alerts: {
    id: string;
    type: 'closing' | 'due' | 'limit';
    cardBank: string;
    days: number;
    label: string;
    color: string;
  }[] = [];

  cards.forEach((card) => {
    if (card.type === 'Débito') return;

    // Alerta de cierre
    if (card.closingDay) {
      const days = getDaysUntil(card.closingDay);
      if (days <= 7) {
        alerts.push({
          id: `closing-${card.id}`,
          type: 'closing',
          cardBank: card.bank,
          days,
          label: days === 0 ? 'Cierra HOY' : `Cierra en ${days} día${days !== 1 ? 's' : ''}`,
          color: days <= 2 ? 'border-rose-500/30 bg-rose-500/5' : 'border-amber-500/30 bg-amber-500/5',
        });
      }
    }

    // Alerta de vencimiento
    if (card.dueDay) {
      const days = getDaysUntil(card.dueDay);
      if (days <= 7) {
        alerts.push({
          id: `due-${card.id}`,
          type: 'due',
          cardBank: card.bank,
          days,
          label: days === 0 ? '¡Vence HOY!' : `Vence en ${days} día${days !== 1 ? 's' : ''}`,
          color: days <= 2 ? 'border-rose-500/30 bg-rose-500/5' : 'border-orange-500/30 bg-orange-500/5',
        });
      }
    }

    // Alerta de límite bajo
    const percentFree =
      card.limitOnePayment > 0
        ? (card.availableOnePayment / card.limitOnePayment) * 100
        : 100;
    if (percentFree < 20) {
      alerts.push({
        id: `limit-${card.id}`,
        type: 'limit',
        cardBank: card.bank,
        days: 0,
        label: `Límite bajo: ${Math.round(percentFree)}% disponible`,
        color: 'border-amber-500/30 bg-amber-500/5',
      });
    }
  });

  const visible = alerts.filter((a) => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Bell size={14} className="text-amber-400" />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Alertas ({visible.length})
        </p>
      </div>
      {visible.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-center justify-between p-4 rounded-2xl border ${alert.color}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/10 rounded-xl">
              {alert.type === 'limit'
                ? <AlertTriangle size={14} className="text-amber-400" />
                : <CreditCard size={14} className="text-white/70" />
              }
            </div>
            <div>
              <p className="text-white text-xs font-black leading-tight">{alert.cardBank}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{alert.label}</p>
            </div>
          </div>
          <button
            onClick={() => setDismissed([...dismissed, alert.id])}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-slate-500 hover:text-white"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}