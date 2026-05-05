"use client";
import { useState, useRef } from 'react';
import { useFinanceStore, TransactionCategory } from '../store/useFinanceStore';
import { Upload, X, CheckCircle, Loader2, AlertCircle, FileImage } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ParsedStatement {
  date: string;
  description: string;
  amount: number;
  installments: number;
  currentInstallment: number;
  totalInstallments: number;
  currency: 'ARS' | 'USD';
}

interface CardStatementUploaderProps {
  cardId: string;
  cardBank: string;
  onClose: () => void;
}

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function parseArgDate(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const year = y!.length === 2 ? `20${y}` : y;
    return new Date(Number(year), Number(m) - 1, Number(d), 12).toISOString();
  }
  return new Date().toISOString();
}

export default function CardStatementUploader({
  cardId, cardBank, onClose,
}: CardStatementUploaderProps) {
  const { addTransaction } = useFinanceStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [parsing,    setParsing]    = useState(false);
  const [results,    setResults]    = useState<ParsedStatement[]>([]);
  const [selected,   setSelected]   = useState<Set<number>>(new Set());
  const [error,      setError]      = useState('');
  const [confirmed,  setConfirmed]  = useState(false);
  const [preview,    setPreview]    = useState('');

  const formatM = (v: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
    }).format(v);

  const handleFile = async (file: File) => {
    setError('');
    setResults([]);
    setConfirmed(false);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);

      const base64 = dataUrl.split(',')[1];
      const mimeType = file.type || 'image/jpeg';

      setParsing(true);
      try {
        const res = await fetch('/api/parse-statement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        });

        const data = await res.json();

        if (data.error) {
          setError(data.error);
        } else {
          setResults(data.transactions ?? []);
          setSelected(new Set(data.transactions.map((_: unknown, i: number) => i)));
        }
      } catch {
        setError('No se pudo conectar con la API. Verificá tu clave de Gemini.');
      } finally {
        setParsing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleSelect = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  };

  const handleConfirm = () => {
    const toImport = results.filter((_, i) => selected.has(i));
    toImport.forEach((r) => {
      addTransaction({
        description:        r.description,
        amount:             r.amount,
        type:               'expense',
        method:             'Crédito',
        currency:           r.currency,
        date:               parseArgDate(r.date),
        installments:       r.totalInstallments ?? r.installments ?? 1,
        currentInstallment: r.currentInstallment ?? 1,
        cardId,
        category:           'Otros' as TransactionCategory,
      });
    });
    setConfirmed(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-2xl bg-slate-900 rounded-[3rem] border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/10">
          <div>
            <h2 className="text-xl font-black text-white">Cargar Resumen</h2>
            <p className="text-slate-500 text-xs mt-0.5">{cardBank} — Gemini detecta los consumos automáticamente</p>
          </div>
          <button onClick={onClose}
            className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">

          {/* Upload zone */}
          {!preview && (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-white/10 hover:border-emerald-500/50 rounded-[2rem] p-12 text-center cursor-pointer transition-all group"
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <div className="w-14 h-14 bg-white/5 group-hover:bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all">
                <FileImage size={24} className="text-slate-500 group-hover:text-emerald-400 transition-all" />
              </div>
              <p className="text-white font-black">Subí una foto del resumen</p>
              <p className="text-slate-500 text-xs mt-1">JPG, PNG o PDF — Gemini extrae los consumos automáticamente</p>
            </div>
          )}

          {/* Preview */}
          {preview && !parsing && results.length === 0 && !error && (
            <div className="relative">
              <img src={preview} alt="Resumen" className="w-full rounded-2xl opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white font-bold bg-black/50 px-4 py-2 rounded-xl text-sm">
                  Procesando con Gemini...
                </p>
              </div>
            </div>
          )}

          {/* Parsing */}
          {parsing && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 size={36} className="text-emerald-400 animate-spin" />
              <p className="text-white font-bold">Analizando el resumen con IA...</p>
              <p className="text-slate-500 text-xs">Gemini está detectando consumos, cuotas y montos</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
              <AlertCircle size={18} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-rose-400 font-bold text-sm">Error al parsear</p>
                <p className="text-rose-400/70 text-xs mt-1">{error}</p>
                <button
                  onClick={() => { setError(''); setPreview(''); }}
                  className="text-xs text-rose-400 underline mt-2"
                >
                  Intentar con otra imagen
                </button>
              </div>
            </div>
          )}

          {/* Resultados */}
          {results.length > 0 && !confirmed && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {results.length} consumos detectados — seleccioná los que querés importar
                </p>
                <button
                  onClick={() => setSelected(
                    selected.size === results.length
                      ? new Set()
                      : new Set(results.map((_, i) => i))
                  )}
                  className="text-xs font-bold text-slate-400 hover:text-white transition-all"
                >
                  {selected.size === results.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {results.map((r, i) => (
                  <div
                    key={i}
                    onClick={() => toggleSelect(i)}
                    className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                      selected.has(i)
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'bg-white/5 border border-white/5 opacity-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-lg border flex-shrink-0 flex items-center justify-center transition-all ${
                      selected.has(i) ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'
                    }`}>
                      {selected.has(i) && <CheckCircle size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-bold truncate">{r.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500">{r.date}</span>
                        {r.totalInstallments > 1 && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                            cuota {r.currentInstallment}/{r.totalInstallments}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-rose-400 font-black text-sm flex-shrink-0">
                      {r.currency === 'USD' ? `U$S ${r.amount}` : formatM(r.amount)}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleConfirm}
                disabled={selected.size === 0}
                className="w-full bg-emerald-500 text-white p-4 rounded-2xl font-black hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-30"
              >
                Importar {selected.size} consumo{selected.size !== 1 ? 's' : ''}
              </button>
            </div>
          )}

          {/* Confirmado */}
          {confirmed && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle size={40} className="text-emerald-400" />
              <p className="text-white font-black text-lg">¡Importación exitosa!</p>
              <p className="text-slate-500 text-sm">Los consumos fueron agregados al historial.</p>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}