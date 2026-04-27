"use client";
import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { getIAAdvice } from '../../lib/gemini';
import { BrainCircuit, Send, Sparkles } from 'lucide-react';

export default function IAPage() {
  const { transactions, exchangeRate } = useFinanceStore();
  const [chat, setChat] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const balance = transactions.reduce((acc, t) => {
    const val = t.currency === 'USD' ? t.amount * exchangeRate : t.amount;
    return t.type === 'income' ? acc + val : acc - val;
  }, 0);

  const pedirConsejo = async () => {
    setLoading(true);
    const advice = await getIAAdvice(transactions, balance, exchangeRate);
    setChat([...chat, { role: 'ai', text: advice }]);
    setLoading(false);
  };

  return (
    <main className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
          <BrainCircuit size={32} />
        </div>
        <h1 className="text-3xl font-black text-white">Analista FinancIA</h1>
        <p className="text-slate-500 font-medium text-sm">Tu consultor personal basado en Gemini 1.5 Flash</p>
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-8 border border-white/10 min-h-[400px] flex flex-col justify-between">
        <div className="space-y-4">
          {chat.length === 0 && (
            <div className="text-center py-20 text-slate-600">
              <Sparkles size={40} className="mx-auto mb-4 opacity-20" />
              <p>Hacé clic abajo para que la IA analice tu situación actual.</p>
            </div>
          )}
          {chat.map((msg, i) => (
            <div
              key={i}
              className="p-6 bg-white/5 rounded-[2rem] border-l-4 border-emerald-500 text-slate-300 leading-relaxed"
            >
              {msg.text}
            </div>
          ))}
        </div>

        <button
          onClick={pedirConsejo}
          disabled={loading}
          className="w-full mt-8 bg-emerald-500 text-white p-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
        >
          {loading ? 'Pensando...' : 'SOLICITAR ANÁLISIS COMPLETO'} <Send size={18} />
        </button>
      </div>
    </main>
  );
}