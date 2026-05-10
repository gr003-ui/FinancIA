"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { useFinanceStore, getMonthlyAmount } from '../../store/useFinanceStore';
import { BrainCircuit, Send, Sparkles, Trash2, User, Bot, Clock, KeyRound, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../../components/motion/PageTransition';

type ChatMessage = { role: 'user' | 'model'; text: string };

function renderMarkdown(text) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={i}>
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="text-white font-black">{part}</strong> : <span key={j}>{part}</span>
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    );
  });
}

const QUICK_ACTIONS = [
  'Analiza mi situacion financiera actual',
  'En que estoy gastando demasiado?',
  'Cuantos dolares puedo comprar con mi saldo?',
  'Dame 3 consejos para ahorrar mas este mes',
  'Como esta mi balance comparado con lo ideal?',
  'Resumi mis movimientos del ultimo periodo',
];

function getSpecialType(text) {
  if (text.startsWith('__QUOTA__')) return '__QUOTA__';
  if (text === '__NO_KEY__')         return '__NO_KEY__';
  if (text === '__BAD_KEY__')        return '__BAD_KEY__';
  return null;
}

function KeyErrorBubble({ type }) {
  const isNoKey = type === '__NO_KEY__';
  return (
    <div className="max-w-[85%] px-5 py-4 rounded-[1.5rem] rounded-bl-sm bg-rose-500/10 border border-rose-500/20 text-sm space-y-2">
      <div className="flex items-center gap-2 text-rose-400 font-black">
        <KeyRound size={14} />
        <span>{isNoKey ? 'GEMINI_API_KEY faltante' : 'API Key invalida'}</span>
      </div>
      <p className="text-rose-400/70 text-xs leading-relaxed">
        {isNoKey ? 'No se encontro GEMINI_API_KEY en .env.local' : 'La API Key de Gemini es incorrecta o fue revocada.'}
      </p>
      <div className="bg-black/20 rounded-xl p-3 space-y-1.5">
        <p className="text-rose-300 text-[11px] font-black uppercase tracking-wider">Solucion:</p>
        <ol className="text-rose-400/70 text-[11px] leading-relaxed space-y-1 list-decimal list-inside">
          <li>Edita <code className="bg-white/10 px-1 rounded">.env.local</code> en la raiz del proyecto</li>
          <li>Confirma que tiene: <code className="bg-white/10 px-1 rounded">GEMINI_API_KEY=AIzaSy...</code></li>
          <li>Reinicia el servidor: Ctrl+C y luego npm run dev</li>
        </ol>
      </div>
    </div>
  );
}

export default function IAPage() {
  const { transactions, exchangeRate } = useFinanceStore();
  const [history,   setHistory]   = useState([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [countdown, setCountdown] = useState(0);
  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);
  const timerRef    = useRef(null);

  const balance = transactions.reduce((acc, t) => {
    const val = t.currency === 'USD' ? getMonthlyAmount(t) * exchangeRate : getMonthlyAmount(t);
    return t.type === 'income' ? acc + val : acc - val;
  }, 0);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history, loading]);
  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  const startCountdown = useCallback((seconds) => {
    setCountdown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleSend = async (messageText) => {
    const text = (messageText ?? input).trim();
    if (!text || loading || countdown > 0) return;

    const userMsg = { role: 'user', text };
    const updatedHistory = [...history, userMsg];
    setHistory(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const res  = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text, history, balance, exchangeRate, transactions: transactions.slice(0, 10) }),
      });
      let data;
      try { data = await res.json(); }
      catch { data = { text: 'Error de red.', retryAfter: 0 }; }

      const special = getSpecialType(data.text);
      if (special === '__QUOTA__') {
        const wait = data.retryAfter ?? 60;
        startCountdown(wait);
        setHistory([...updatedHistory, { role: 'model', text: `__QUOTA__:${wait}` }]);
      } else if (special === '__NO_KEY__' || special === '__BAD_KEY__') {
        setHistory([...updatedHistory, { role: 'model', text: special }]);
      } else {
        setHistory([...updatedHistory, { role: 'model', text: data.text }]);
      }
    } catch {
      setHistory([...updatedHistory, { role: 'model', text: 'Error de red.' }]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const isDisabled = loading || countdown > 0;

  return (
    <PageTransition>
      <main className="h-screen flex flex-col p-6 md:p-10 max-w-4xl mx-auto gap-6">
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
              <BrainCircuit size={24} />
            </motion.div>
            <div>
              <h1 className="text-2xl font-black text-white">Analista FinancIA</h1>
              <p className="text-slate-500 text-xs">Gemini 2.0 Flash Lite · 30 consultas/min gratuitas</p>
            </div>
          </div>
          {history.length > 0 && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => { setHistory([]); setCountdown(0); }}
              className="flex items-center gap-2 p-3 rounded-2xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-bold">
              <Trash2 size={14} /> Limpiar
            </motion.button>
          )}
        </div>

        {countdown > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex-shrink-0">
            <Clock size={16} className="text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-amber-400 font-black text-sm">Limite de consultas alcanzado</p>
              <p className="text-amber-400/70 text-xs mt-0.5">Podes enviar otra en <strong className="text-amber-300">{countdown}s</strong></p>
            </div>
            <span className="text-amber-400 font-black text-sm w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">{countdown}</span>
          </motion.div>
        )}

        <div className="flex-1 bg-slate-900 rounded-[3rem] border border-white/10 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
            <AnimatePresence initial={false}>
              {history.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center gap-6 text-slate-600 py-8">
                  <Sparkles size={40} className="opacity-20" />
                  <p className="italic text-sm text-center">Preguntame lo que quieras sobre tus finanzas</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                    {QUICK_ACTIONS.map((action) => (
                      <motion.button key={action} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => handleSend(action)} disabled={isDisabled}
                        className="text-left p-4 bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-400 border border-white/10 hover:border-emerald-500/30 rounded-2xl text-xs font-bold text-slate-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        {action}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                history.map((msg, i) => {
                  const special  = getSpecialType(msg.text);
                  const isQuota  = special === '__QUOTA__';
                  const isKeyErr = special === '__NO_KEY__' || special === '__BAD_KEY__';
                  const waitSecs = isQuota ? parseInt(msg.text.split(':')[1] ?? '60') : 0;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'model' && (
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 ${isKeyErr ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
                          {isKeyErr ? <AlertTriangle size={14} className="text-rose-400" /> : <Bot size={14} className="text-emerald-400" />}
                        </div>
                      )}
                      {isQuota && (
                        <div className="max-w-[80%] px-5 py-4 rounded-[1.5rem] rounded-bl-sm bg-amber-500/10 border border-amber-500/20 text-sm">
                          <div className="flex items-center gap-2 text-amber-400 font-black mb-1"><Clock size={14} /><span>Limite de consultas</span></div>
                          <p className="text-amber-400/70 text-xs">Espera {waitSecs}s. Para uso ilimitado activa facturacion en Google Cloud.</p>
                        </div>
                      )}
                      {isKeyErr && <KeyErrorBubble type={special} />}
                      {!special && (
                        <div className={`max-w-[80%] px-5 py-4 rounded-[1.5rem] text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-emerald-500 text-white rounded-br-sm font-medium'
                            : 'bg-white/5 text-slate-300 rounded-bl-sm border border-white/10'
                        }`}>
                          {msg.role === 'model' ? renderMarkdown(msg.text) : msg.text}
                        </div>
                      )}
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                          <User size={14} className="text-slate-400" />
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-emerald-400" />
                </div>
                <div className="bg-white/5 border border-white/10 px-5 py-4 rounded-[1.5rem] rounded-bl-sm">
                  <div className="flex gap-1.5 items-center">
                    {[0, 0.15, 0.3].map((delay) => (
                      <motion.span key={delay} animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay }}
                        className="w-2 h-2 bg-emerald-500 rounded-full block" />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-white/5 p-4 flex items-end gap-3 flex-shrink-0">
            <textarea ref={textareaRef} rows={1} disabled={isDisabled}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm resize-none outline-none placeholder:text-slate-600 focus:border-emerald-500/50 transition-all disabled:opacity-40"
              placeholder={countdown > 0 ? `Espera ${countdown}s...` : 'Escribi tu consulta... (Enter para enviar)'}
              value={input}
              onChange={(e) => { setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=`${Math.min(e.target.scrollHeight,120)}px`; }}
              onKeyDown={(e) => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              style={{ minHeight: '44px' }}
            />
            <motion.button onClick={() => handleSend()} disabled={!input.trim() || isDisabled}
              whileHover={{ scale: isDisabled ? 1 : 1.05 }} whileTap={{ scale: isDisabled ? 1 : 0.95 }}
              className="p-3 bg-emerald-500 rounded-xl text-white hover:bg-emerald-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0">
              <Send size={18} />
            </motion.button>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
