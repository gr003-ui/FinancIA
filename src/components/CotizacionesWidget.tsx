"use client";
import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, RefreshCw, Clock, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/useFinanceStore';
import type { CotizacionesData } from '../app/api/cotizaciones/route';

const fmt = (n: number) =>
  n > 0
    ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
    : '—';

const TIPOS = [
  { key: 'blue',      label: 'Blue',      color: 'text-sky-400',     bg: 'bg-sky-500/10'     },
  { key: 'oficial',   label: 'Oficial',   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { key: 'mep',       label: 'MEP',       color: 'text-violet-400',  bg: 'bg-violet-500/10'  },
  { key: 'crypto',    label: 'Cripto',    color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  { key: 'tarjeta',   label: 'Tarjeta',   color: 'text-rose-400',    bg: 'bg-rose-500/10'    },
  { key: 'mayorista', label: 'Mayorista', color: 'text-slate-400',   bg: 'bg-slate-500/10'   },
] as const;

export default function CotizacionesWidget() {
  const { setExchangeRate } = useFinanceStore();
  const [data,     setData]     = useState<CotizacionesData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchCotizaciones = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/cotizaciones');
      if (!res.ok) throw new Error('fetch failed');
      const json: CotizacionesData = await res.json();
      setData(json);
      setLastFetch(new Date());
      // Auto-actualizar el store con el blue
      if (json.blue?.venta > 0) {
        setExchangeRate(json.blue.venta);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [setExchangeRate]);

  useEffect(() => {
    fetchCotizaciones();
    // Refrescar cada 30 minutos
    const interval = setInterval(fetchCotizaciones, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchCotizaciones]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-white font-black text-sm">Cotizaciones USD/ARS</p>
            {lastFetch && (
              <div className="flex items-center gap-1 mt-0.5">
                <Clock size={10} className="text-slate-600" />
                <span className="text-[10px] text-slate-600">
                  Actualizado {lastFetch.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={fetchCotizaciones}
          disabled={loading}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Estado */}
      <AnimatePresence mode="wait">
        {loading && !data && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-2"
          >
            {TIPOS.map(({ key }) => (
              <div key={key} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </motion.div>
        )}

        {error && !data && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4"
          >
            <WifiOff size={16} className="text-rose-400 flex-shrink-0" />
            <div>
              <p className="text-rose-400 font-bold text-sm">Sin conexión a cotizaciones</p>
              <p className="text-rose-400/60 text-xs">Usando cotización manual del store</p>
            </div>
          </motion.div>
        )}

        {data && (
          <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-2"
          >
            {TIPOS.map(({ key, label, color, bg }) => {
              const tipo = data[key];
              if (!tipo) return null;
              return (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (tipo.venta > 0) setExchangeRate(tipo.venta);
                  }}
                  className={`${bg} border border-white/5 rounded-2xl p-3 text-left transition-all hover:border-white/15 active:border-white/20`}
                  title={`Usar ${label} como cotización de referencia`}
                >
                  <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${color}`}>
                    {label}
                  </p>
                  <p className="text-white font-black text-sm leading-none">
                    {fmt(tipo.venta)}
                  </p>
                  <p className="text-slate-600 text-[10px] mt-0.5">
                    Compra {fmt(tipo.compra)}
                  </p>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nota */}
      {data && (
        <div className="flex items-center gap-2 pt-1">
          <Wifi size={10} className="text-emerald-500 flex-shrink-0" />
          <p className="text-[10px] text-slate-600">
            Tocá cualquier tipo de cambio para usarlo como referencia en la app
          </p>
        </div>
      )}
    </div>
  );
}