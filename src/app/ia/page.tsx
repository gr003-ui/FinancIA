"use client";
import { useState, useRef, useEffect } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { sendChatMessage, ChatMessage } from '../../lib/gemini';
import { BrainCircuit, Send, Sparkles, Trash2 } from 'lucide-react';

// Renderiza **negrita** y saltos de línea sin librerías externas
function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={i}>
        {parts.map((part, j) =>
          j % 2 === 1
            ? <strong key={j} className="text-white font-black">{part}</strong>
            : <span key={j}>{part}</span>
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    );
  });
}

export default function IAPage() {
  const { transactions, exchangeRate } = useFinanceStore();
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const balance = transactions.reduce((acc, t) => {
    const val = t.currency === 'USD' ? t.amount * exchangeRate : t.amount;
    return t.type === 'income' ? acc + val : acc - val;
  }, 0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const handleSend = async (messageText?: string) => {
    const text = (messageText ?? input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', text };
    const updatedHistory = [...history, userMsg];
    setHistory(updatedHistory);
    setInput('');
    setLoading(true);

    const response = await sendChatMessage(text, history, transactions, balance, exchangeRate);
    setHistory([...updatedHistory, { role: 'model', text: response }]);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const QUICK_ACTIONS = [
    'Analizá mi situación financiera actual',
    '¿Estoy gastando demasiado?',
    '¿Cuánto dólares puedo comprar con mi saldo?',
    'Dame 3 consejos para ahorrar más',
  ];

  return (
    <main className="p-6 md:p-10 max-w-4xl mx-auto space-y-6 h-screen flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Analista FinancIA</h1>
            <p className="text-slate-500 text-xs">Basado en Gemini 1.5 Flash · contexto financiero en vivo</p>
          </div>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => setHistory([])}
            className="flex items-center gap-2 p-3 rounded-2xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-bold"
          >
            <Trash2 size={14} /> Limpiar chat
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-slate-900 rounded-[3rem] border border-white/10 p-8 overflow-y-auto flex flex-col gap-4 min-h-0">
        {history.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-slate-600">
            <Sparkles size={40} className="opacity-20" />
            <p className="italic text-sm">Preguntame lo que quieras sobre tus finanzas</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => handleSend(action)}
                  className="text-left p-4 bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-400 border border-white/10 hover:border-emerald-500/30 rounded-2xl text-xs font-bold text-slate-400 transition-all"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {history.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-5 py-4 rounded-[1.5rem] text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-500 text-white rounded-br-sm font-medium'
                      : 'bg-white/5 text-slate-300 rounded-bl-sm border border-white/10'
                  }`}
                >
                  {msg.role === 'model' ? renderMarkdown(msg.text) : msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 px-5 py-4 rounded-[1.5rem] rounded-bl-sm">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="bg-slate-900 rounded-[2rem] border border-white/10 p-4 flex items-end gap-4">
        <textarea
          className="flex-1 bg-transparent outline-none text-white text-sm resize-none placeholder:text-slate-600 max-h-32"
          placeholder="Escribí tu consulta... (Enter para enviar, Shift+Enter para nueva línea)"
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="p-3 bg-emerald-500 rounded-xl text-white hover:bg-emerald-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </div>

    </main>
  );
}