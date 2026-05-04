"use client";
import { useState, useRef, useEffect } from 'react';
import { useFinanceStore, getMonthlyAmount } from '../../store/useFinanceStore';
import { BrainCircuit, Send, Sparkles, Trash2, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../../components/motion/PageTransition';

type ChatMessage = {
  role: 'user' | 'model';
  text: string;
};

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

const QUICK_ACTIONS = [
  'Analizá mi situación financiera actual',
  '¿En qué estoy gastando demasiado?',
  '¿Cuántos dólares puedo comprar con mi saldo?',
  'Dame 3 consejos para ahorrar más este mes',
  '¿Cómo está mi balance comparado con lo ideal?',
  'Resumí mis movimientos del último período',
];

export default function IAPage() {
  const { transactions, exchangeRate } = useFinanceStore();
  const [history,  setHistory]  = useState<ChatMessage[]>([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState(false);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const balance = transactions.reduce((acc, t) => {
    const val = t.currency === 'USD'
      ? getMonthlyAmount(t) * exchangeRate
      : getMonthlyAmount(t);
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
    setApiError(false);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:      text,
          history:      history,
          balance,
          exchangeRate,
          transactions: transactions.slice(0, 10),
        }),
      });

      const data = await res.json();
      setHistory([...updatedHistory, { role: 'model', text: data.text }]);
    } catch {
      setApiError(true);
      setHistory([
        ...updatedHistory,
        {
          role: 'model',
          text: 'No pude conectarme. Verificá tu conexión y que GEMINI_API_KEY esté en .env.local.',
        },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <PageTransition>
      <main className="h-screen flex flex-col p-6 md:p-10 max-w-4xl mx-auto gap-6">

        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center"
            >
              <BrainCircuit size={24} />
            </motion.div>
            <div>
              <h1 className="text-2xl font-black text-white">Analista FinancIA</h1>
              <p className="text-slate-500 text-xs">Gemini 1.5 Flash · contexto financiero en vivo</p>
            </div>
          </div>

          {history.length > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setHistory([])}
              className="flex items-center gap-2 p-3 rounded-2xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-bold"
            >
              <Trash2 size={14} />
              Limpiar
            </motion.button>
          )}
        </div>

        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-400 font-medium flex-shrink-0 space-y-2"
          >
            <p className="font-black">Configuración requerida</p>
            <p>
              Creá el archivo{' '}
              <code className="bg-white/10 px-1 py-0.5 rounded">.env.local</code>{' '}
              en la raíz del proyecto con:
            </p>
            <pre className="bg-black/30 rounded-xl p-3 font-mono text-emerald-400 text-[11px]">
              GEMINI_API_KEY=tu_api_key_aqui
            </pre>
            <p>
              Conseguila gratis en aistudio.google.com y reiniciá con{' '}
              <code className="bg-white/10 px-1 py-0.5 rounded">npm run dev</code>.
            </p>
          </motion.div>
        )}

        <div className="flex-1 bg-slate-900 rounded-[3rem] border border-white/10 overflow-hidden flex flex-col min-h-0">

          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
            <AnimatePresence initial={false}>
              {history.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center gap-6 text-slate-600 py-8"
                >
                  <Sparkles size={40} className="opacity-20" />
                  <p className="italic text-sm text-center">
                    Preguntame lo que quieras sobre tus finanzas
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                    {QUICK_ACTIONS.map((action) => (
                      <motion.button
                        key={action}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSend(action)}
                        className="text-left p-4 bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-400 border border-white/10 hover:border-emerald-500/30 rounded-2xl text-xs font-bold text-slate-400 transition-all"
                      >
                        {action}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                history.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'model' && (
                      <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot size={14} className="text-emerald-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-5 py-4 rounded-[1.5rem] text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-emerald-500 text-white rounded-br-sm font-medium'
                          : 'bg-white/5 text-slate-300 rounded-bl-sm border border-white/10'
                      }`}
                    >
                      {msg.role === 'model' ? renderMarkdown(msg.text) : msg.text}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                        <User size={14} className="text-slate-400" />
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-emerald-400" />
                </div>
                <div className="bg-white/5 border border-white/10 px-5 py-4 rounded-[1.5rem] rounded-bl-sm">
                  <div className="flex gap-1.5 items-center">
                    <motion.span
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-emerald-500 rounded-full block"
                    />
                    <motion.span
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                      className="w-2 h-2 bg-emerald-500 rounded-full block"
                    />
                    <motion.span
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                      className="w-2 h-2 bg-emerald-500 rounded-full block"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-white/5 p-4 flex items-end gap-3 flex-shrink-0">
            <textarea
              ref={textareaRef}
              rows={1}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm resize-none outline-none placeholder:text-slate-600 focus:border-emerald-500/50 transition-all"
              placeholder="Escribí tu consulta... (Enter para enviar, Shift+Enter para nueva línea)"
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              style={{ minHeight: '44px' }}
            />
            <motion.button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-emerald-500 rounded-xl text-white hover:bg-emerald-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send size={18} />
            </motion.button>
          </div>
        </div>

      </main>
    </PageTransition>
  );
}