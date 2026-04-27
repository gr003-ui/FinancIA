"use client";
import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { getIAAdvice } from '../../lib/gemini';
import { BrainCircuit, Send, Sparkles } from 'lucide-react';

export default function IAPage() {
  const { transactions, balance } = useFinanceStore();
  const [chat, setChat] = useState<{role: string, text: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const pedirConsejo = async () => {
    setLoading(true);
    const advice = await getIAAdvice(transactions, balance, 1250); // Ejemplo con dolar a 1250
    setChat([...chat, { role: 'ai', text: advice }]);
    setLoading(false);
  };

  return (
    <main className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
          <BrainCircuit size={32} />
        </div>
        <h1 className="text-3xl font-black text-slate-800">Analista FinancIA</h1>
        <p className="text-slate-500 font-medium text-sm">Tu consultor personal basado en Gemini 1.5 Pro</p>
      </div>

      <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl min-h-[400px] flex flex-col justify-between">
        <div className="space-y-4">
          {chat.length === 0 && (
            <div className="text-center py-20 text-slate-300">
              <Sparkles size={40} className="mx-auto mb-4 opacity-20" />
              <p>Hacé clic abajo para que la IA analice tu situación actual.</p>
            </div>
          )}
          {chat.map((msg, i) => (
            <div key={i} className="p-6 bg-slate-50 rounded-[2rem] border-l-4 border-emerald-500 text-slate-700 leading-relaxed">
              {msg.text}
            </div>
          ))}
        </div>

        <button 
          onClick={pedirConsejo}
          disabled={loading}
          className="w-full mt-8 bg-slate-900 text-white p-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all disabled:opacity-50"
        >
          {loading ? "Pensando..." : "SOLICITAR ANÁLISIS COMPLETO"} <Send size={18} />
        </button>
      </div>
    </main>
  );
}