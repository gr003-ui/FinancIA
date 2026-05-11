"use client";
import { BrainCircuit, Sparkles, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '../../components/motion/PageTransition';

export default function IAPage() {
  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-8">

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center"
        >
          <BrainCircuit size={36} className="text-emerald-500" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center space-y-3"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-black rounded-full border border-emerald-500/20 uppercase tracking-wider">
              Próximamente
            </span>
          </div>
          <h1 className="text-3xl font-black text-white">Analista FinancIA</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Tu asistente financiero con IA estará disponible muy pronto.
            Podrás consultarle sobre tus gastos, recibir consejos y analizar tu situación en segundos.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-sm space-y-3"
        >
          {[
            'Análisis de tu situación financiera',
            'Recomendaciones personalizadas',
            'Consultas en lenguaje natural',
            'Cobertura ante la inflación',
          ].map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
            >
              <div className="w-7 h-7 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles size={14} className="text-slate-500" />
              </div>
              <span className="text-slate-400 text-sm">{feature}</span>
              <Lock size={12} className="text-slate-600 ml-auto flex-shrink-0" />
            </div>
          ))}
        </motion.div>

      </main>
    </PageTransition>
  );
}