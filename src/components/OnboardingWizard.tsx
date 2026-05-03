"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/useFinanceStore';
import {
  Wallet, User, DollarSign, CreditCard,
  ArrowRight, ArrowLeft, CheckCircle, Sparkles,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Bienvenida',  icon: Sparkles   },
  { id: 2, label: 'Tu nombre',   icon: User       },
  { id: 3, label: 'Cotización',  icon: DollarSign },
  { id: 4, label: 'Tu tarjeta',  icon: CreditCard },
];

export default function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const { setUserName, setExchangeRate, addCard } = useFinanceStore();

  const [step,       setStep]       = useState(0);
  const [name,       setName]       = useState('');
  const [rate,       setRate]       = useState('1200');
  const [bank,       setBank]       = useState('');
  const [cardType,   setCardType]   = useState<'Crédito' | 'Débito'>('Crédito');
  const [limitOne,   setLimitOne]   = useState('');
  const [limitInst,  setLimitInst]  = useState('');
  const [singleLimit,setSingleLimit]= useState(false);
  const [skipCard,   setSkipCard]   = useState(false);

  const canNext = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return Number(rate) > 0;
    return true;
  };

  const handleNext = () => {
    if (step === 1) setUserName(name.trim());
    if (step === 2) setExchangeRate(Number(rate));
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const handleFinish = () => {
    if (!skipCard && bank.trim()) {
      addCard({
        bank: bank.trim(),
        type: cardType,
        singleLimit: cardType === 'Débito' ? true : singleLimit,
        limitOnePayment:   cardType === 'Débito' ? 0 : Number(limitOne) || 0,
        limitInstallments: cardType === 'Crédito' && !singleLimit ? Number(limitInst) || 0 : 0,
      });
    }
    onComplete();
  };

  const slideVariants = {
    enter:  (dir: number) => ({ x: dir > 0 ?  40 : -40, opacity: 0 }),
    center:               ({ x: 0, opacity: 1 }),
    exit:   (dir: number) => ({ x: dir > 0 ? -40 :  40, opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);

  const goNext = () => { setDirection(1);  handleNext(); };
  const goPrev = () => { setDirection(-1); setStep((s) => s - 1); };

  return (
    <div className="fixed inset-0 bg-[#080A12] z-[100] flex items-center justify-center p-4">

      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 justify-center mb-8"
        >
          <div className="p-3 bg-emerald-500/10 rounded-2xl">
            <Wallet size={28} className="text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-white">FinancIA</span>
        </motion.div>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <motion.div
                animate={{
                  background: i <= step ? '#10b981' : 'rgba(255,255,255,0.1)',
                  scale: i === step ? 1.15 : 1,
                }}
                transition={{ duration: 0.3 }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
              >
                {i < step ? (
                  <CheckCircle size={16} className="text-white" />
                ) : (
                  <span className="text-[10px] font-black text-white">{i + 1}</span>
                )}
              </motion.div>
              {i < STEPS.length - 1 && (
                <motion.div
                  animate={{ background: i < step ? '#10b981' : 'rgba(255,255,255,0.1)' }}
                  className="w-8 h-0.5 rounded-full"
                />
              )}
            </div>
          ))}
        </div>

        {/* Card del paso */}
        <div className="bg-slate-900 rounded-[3rem] border border-white/10 p-8 overflow-hidden relative min-h-[340px] flex flex-col">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex-1 flex flex-col"
            >

              {/* Paso 0: Bienvenida */}
              {step === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4, type: 'spring' }}
                    className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center"
                  >
                    <Sparkles size={36} className="text-emerald-400" />
                  </motion.div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black text-white tracking-tight">
                      ¡Bienvenido a FinancIA!
                    </h2>
                    <p className="text-slate-400 leading-relaxed">
                      Tu gestor de finanzas personales para el mercado argentino.
                      Configuremos todo en 3 pasos rápidos.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['Bimoneda ARS/USD','Control de cuotas','Presupuestos','IA Financiera'].map((f) => (
                      <span key={f} className="px-3 py-1 bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold rounded-full uppercase">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Paso 1: Nombre */}
              {step === 1 && (
                <div className="flex-1 flex flex-col justify-center space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/10 rounded-2xl">
                      <User size={24} className="text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">¿Cómo te llamás?</h2>
                      <p className="text-slate-500 text-sm">Tu nombre aparecerá en el perfil y reportes.</p>
                    </div>
                  </div>
                  <input
                    autoFocus
                    placeholder="Ej: Juan Pérez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && canNext() && goNext()}
                    className="w-full bg-white/5 border border-white/10 text-white p-5 rounded-2xl outline-none text-lg font-bold placeholder:text-slate-600 focus:border-emerald-500/50 transition-all"
                  />
                  {name.trim().length > 0 && (
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-emerald-400 text-sm font-bold"
                    >
                      ¡Hola, {name.trim()}! 👋
                    </motion.p>
                  )}
                </div>
              )}

              {/* Paso 2: Cotización */}
              {step === 2 && (
                <div className="flex-1 flex flex-col justify-center space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500/10 rounded-2xl">
                      <DollarSign size={24} className="text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">Cotización del dólar</h2>
                      <p className="text-slate-500 text-sm">Usada para pesificar tus gastos en USD.</p>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-400 font-black text-xl">$</span>
                    <input
                      autoFocus
                      type="number"
                      placeholder="1200"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && canNext() && goNext()}
                      className="w-full bg-white/5 border border-white/10 text-white p-5 pl-10 rounded-2xl outline-none text-2xl font-black placeholder:text-slate-600 focus:border-amber-500/50 transition-all"
                    />
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-400/80 font-medium">
                    Podés cambiarlo en cualquier momento desde el Dashboard o Configuración.
                    El botón ↺ trae el dólar blue en tiempo real.
                  </div>
                </div>
              )}

              {/* Paso 3: Primera tarjeta */}
              {step === 3 && (
                <div className="flex-1 flex flex-col justify-center space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/10 rounded-2xl">
                      <CreditCard size={24} className="text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">Primera tarjeta</h2>
                      <p className="text-slate-500 text-sm">Opcional — podés agregarla después.</p>
                    </div>
                  </div>

                  {!skipCard ? (
                    <div className="space-y-3">
                      <input
                        placeholder="Nombre del banco (ej: Galicia)"
                        value={bank}
                        onChange={(e) => setBank(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none font-bold placeholder:text-slate-600 focus:border-emerald-500/50 transition-all"
                      />

                      <div className="flex bg-white/5 p-1 rounded-2xl gap-1">
                        {(['Crédito','Débito'] as const).map((t) => (
                          <button key={t} type="button"
                            onClick={() => setCardType(t)}
                            className={`flex-1 p-3 rounded-xl font-bold text-sm transition-all ${
                              cardType === t
                                ? t === 'Crédito' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
                                : 'text-slate-400'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>

                      {cardType === 'Crédito' && (
                        <>
                          <button type="button"
                            onClick={() => setSingleLimit(!singleLimit)}
                            className={`w-full flex items-center justify-between p-3 rounded-2xl border text-sm font-bold transition-all ${
                              singleLimit
                                ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                                : 'border-white/10 bg-white/5 text-slate-400'
                            }`}
                          >
                            <span>{singleLimit ? '✓ Límite único' : 'Límite dual (1 pago + cuotas)'}</span>
                          </button>

                          <input
                            type="number"
                            placeholder={singleLimit ? 'Límite total' : 'Límite 1 Pago'}
                            value={limitOne}
                            onChange={(e) => setLimitOne(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none font-bold placeholder:text-slate-600 focus:border-emerald-500/50 transition-all"
                          />

                          {!singleLimit && (
                            <input
                              type="number"
                              placeholder="Sub-límite cuotas"
                              value={limitInst}
                              onChange={(e) => setLimitInst(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none font-bold placeholder:text-slate-600 focus:border-emerald-500/50 transition-all"
                            />
                          )}
                        </>
                      )}

                      <button
                        onClick={() => setSkipCard(true)}
                        className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-all py-1"
                      >
                        Omitir este paso →
                      </button>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex-1 flex flex-col items-center justify-center gap-4 py-6"
                    >
                      <CheckCircle size={40} className="text-emerald-400" />
                      <p className="text-slate-400 text-sm text-center">
                        Sin problema. Podés agregar tarjetas desde la sección <strong className="text-white">Tarjetas</strong> cuando quieras.
                      </p>
                      <button
                        onClick={() => setSkipCard(false)}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-all"
                      >
                        ← Volver a agregar tarjeta
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navegación */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={goPrev}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-0 disabled:pointer-events-none"
          >
            <ArrowLeft size={16} />
            Atrás
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={goNext}
              disabled={!canNext()}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-sm hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continuar
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-sm hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle size={16} />
              ¡Comenzar!
            </button>
          )}
        </div>

      </div>
    </div>
  );
}