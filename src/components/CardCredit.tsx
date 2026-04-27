"use client";
import { CreditCard } from 'lucide-react';

interface CardProps {
  bank: string;
  lastFour: string;
  limit: number;
  available: number;
  color: string;
}

export default function CardCredit({ bank, lastFour, limit, available, color }: CardProps) {
  const percentage = (available / limit) * 100;

  return (
    <div className={`${color} p-6 rounded-[2rem] text-white shadow-lg space-y-6 relative overflow-hidden group`}>
      <div className="flex justify-between items-start relative z-10">
        <CreditCard size={32} strokeWidth={1.5} />
        <span className="font-black italic text-xl">{bank}</span>
      </div>
      
      <div className="space-y-1 relative z-10">
        <p className="text-[10px] font-bold uppercase opacity-60">Disponible</p>
        <p className="text-2xl font-black">${available.toLocaleString('es-AR')}</p>
      </div>

      <div className="space-y-2 relative z-10">
        <div className="flex justify-between text-[10px] font-bold uppercase">
          <span>Límite: ${limit.toLocaleString('es-AR')}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
        <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-white h-full transition-all duration-1000" 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      
      <p className="text-sm font-medium tracking-widest opacity-80 relative z-10">**** **** **** {lastFour}</p>
      
      {/* Círculos decorativos de fondo */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
    </div>
  );
}