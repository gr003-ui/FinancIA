"use client";
import { useState, useRef } from 'react';
import { useFinanceStore, TransactionCategory } from '../store/useFinanceStore';
import { Upload, X, CheckCircle, Loader2, AlertCircle, FileImage, Info, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface ParsedStatement {
  date: string;
  description: string;
  amount: number;
  currentInstallment: number;
  totalInstallments: number;
  currency: 'ARS' | 'USD';
}

interface CardStatementUploaderProps {
  cardId: string;
  cardBank: string;
  onClose: () => void;
}

function parseArgDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const d   = parts[0] ?? '1';
    const m   = parts[1] ?? '1';
    const raw = parts[2] ?? String(new Date().getFullYear());
    const y   = raw.length === 2 ? `20${raw}` : raw;
    return new Date(Number(y), Number(m) - 1, Number(d), 12).toISOString();
  }
  return new Date().toISOString();
}

const MAX_SIZE_MB = 12;

export default function CardStatementUploader({
  cardId, cardBank, onClose,
}: CardStatementUploaderProps) {
  const { addTransaction } = useFinanceStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [parsing,    setParsing]    = useState(false);
  const [results,    setResults]    = useState<ParsedStatement[]>([]);
  const [selected,   setSelected]   = useState<Set<number>>(new Set());
  const [error,      setError]      = useState('');
  const [rawDebug,   setRawDebug]   = useState('');
  const [showRaw,    setShowRaw]    = useState(false);
  const [confirmed,  setConfirmed]  = useState(false);
  const [preview,    setPreview]    = useState('');
  const [fileInfo,   setFileInfo]   = useState('');

  const formatM = (v: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
    }).format(v);

  const handleFile = async (file: File) => {
    setError('');
    setRawDebug('');
    setShowRaw(false);
    setResults([]);
    setConfirmed(false);
    setPreview('');

    const sizeMB = file.size / (1024 * 1024);
    setFileInfo(`${file.name} · ${sizeMB.toFixed(1)} MB`);

    if (sizeMB > MAX_SIZE_MB) {
      setError(
        `El archivo pesa ${sizeMB.toFixed(1)} MB. El máximo es ${MAX_SIZE_MB} MB. ` +
        'Probá con una foto JPG del resumen.'
      );
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      setError('No se pudo leer el archivo. Intentá con otra imagen.');
      setParsing(false);
    };

    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;

      if (file.type.startsWith('image/')) {
        setPreview(dataUrl);
      }

      const base64 = dataUrl.split(',')[1];
      if (!base64) {
        setError('No se pudo leer el archivo. Intentá con otra imagen.');
        return;
      }

      const mimeType = file.type
        ? file.type
        : file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

      setParsing(true);
      try {
        const res = await fetch('/api/parse-statement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        });

        type ApiResponse = {
          error?: string;
          raw?: string;
          transactions?: ParsedStatement[];
        };

        let data: ApiResponse;
        try {
          data = await res.json() as ApiResponse;
        } catch {
          setError(
            `El servidor devolvió una respuesta inesperada (HTTP ${res.status}). ` +
            'Verificá que GEMINI_API_KEY esté en .env.local y reiniciá el servidor con npm run dev.'
          );
          setParsing(false);
          return;
        }

        if (data.error) {
          setError(data.error);
          if (data.raw) setRawDebug(data.raw);
        } else if (!data.transactions || data.transactions.length === 0) {
          setError(
            'Gemini no detectó consumos. Probá con una foto más clara ' +
            'o seleccioná solo la tabla de movimientos.'
          );
        } else {
          setResults(data.transactions);
          setSelected(new Set(data.transactions.map((_, i) => i)));
        }
      } catch (fetchErr) {
        console.error('Fetch error:', fetchErr);
        setError(
          'Error de red. Verificá que el servidor esté corriendo ' +
          'y que GEMINI_API_KEY esté configurada en .env.local.'
        );
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

  const toggleAll = () => {
    setSelected(
      selected.size === results.length
        ? new Set()
        : new Set(results.map((_, i) => i))
    );
  };

  const handleConfirm = () => {
    results.filter((_, i) => selected.has(i)).forEach((r) => {
      addTransaction({
        description:        r.description || 'Sin descripción',
        amount:             Number(r.amount) || 0,
        type:               'expense',
        method:             'Crédito',
        currency:           r.currency ?? 'ARS',
        date:               parseArgDate(r.date),
        installments:       Number(r.totalInstallments) || 1,
        currentInstallment: Number(r.currentInstallment) || 1,
        cardId,
        category:           'Otros' as TransactionCategory,
      });
    });
    setConfirmed(true);
    setTimeout(onClose, 1500);
  };

  const handleReset = () => {
    setError('');
    setRawDebug('');
    setShowRaw(false);
    setPreview('');
    setResults([]);
    setSelected(new Set());
    setConfirmed(false);
    setFileInfo('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1,   y: 0  }}
        exit={{    opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-2xl bg-slate-900 rounded-[3rem] border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/10">
          <div>
            <h2 className="text-xl font-black text-white">Cargar Resumen</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {cardBank} — Gemini detecta los consumos automáticamente
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Tip */}
          {!preview && results.length === 0 && !confirmed && !parsing && (
            <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
              <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-400/80 leading-relaxed">
                <strong>Mejor resultado:</strong> usá una foto JPG clara de la tabla de consumos.
                Los PDFs también funcionan pero pueden dar errores si son grandes.
                Máximo {MAX_SIZE_MB} MB.
              </p>
            </div>
          )}

          {/* Upload zone */}
          {!parsing && results.length === 0 && !confirmed && (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-white/10 hover:border-emerald-500/50 rounded-[2rem] p-12 text-center cursor-pointer transition-all group"
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <div className="w-14 h-14 bg-white/5 group-hover:bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all">
                <FileImage size={24} className="text-slate-500 group-hover:text-emerald-400 transition-all" />
              </div>
              <p className="text-white font-black">Subí una foto o PDF del resumen</p>
              <p className="text-slate-500 text-xs mt-1">
                JPG, PNG, PDF — máximo {MAX_SIZE_MB} MB
              </p>
              {fileInfo && (
                <p className="text-slate-600 text-[10px] mt-2">{fileInfo}</p>
              )}
            </div>
          )}

          {/* Preview imagen */}
          {preview && !parsing && results.length === 0 && !error && (
            <div className="relative rounded-2xl overflow-hidden">
              <img src={preview} alt="Resumen" className="w-full opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/60 rounded-2xl px-6 py-3 flex items-center gap-3">
                  <Loader2 size={16} className="text-emerald-400 animate-spin" />
                  <p className="text-white font-bold text-sm">Analizando con Gemini...</p>
                </div>
              </div>
            </div>
          )}

          {/* Parsing PDF (sin preview) */}
          {parsing && !preview && (
            <div className="flex flex-col items-center gap-4 py-10">
              <Loader2 size={36} className="text-emerald-400 animate-spin" />
              <p className="text-white font-bold">Analizando el archivo con Gemini...</p>
              <p className="text-slate-500 text-xs text-center">
                Puede tardar 10-30 segundos
              </p>
              {fileInfo && (
                <p className="text-slate-600 text-[10px]">{fileInfo}</p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-rose-400 font-bold text-sm">Error al parsear</p>
                  <p className="text-rose-400/70 text-xs mt-1 leading-relaxed">{error}</p>
                </div>
              </div>

              {rawDebug && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowRaw(!showRaw)}
                    className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-all"
                  >
                    <ChevronDown
                      size={12}
                      className={`transition-transform ${showRaw ? 'rotate-180' : ''}`}
                    />
                    Ver respuesta raw de Gemini
                  </button>
                  {showRaw && (
                    <pre className="text-[10px] text-slate-500 bg-black/30 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap">
                      {rawDebug}
                    </pre>
                  )}
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl font-black text-xs hover:bg-rose-500/20 transition-all"
                >
                  Intentar con otro archivo
                </button>
              </div>
            </div>
          )}

          {/* Resultados */}
          {results.length > 0 && !confirmed && (
            <div className="space-y-4">

              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {results.length} consumos detectados
                </p>
                <button
                  onClick={toggleAll}
                  className="text-xs font-bold text-slate-400 hover:text-white transition-all"
                >
                  {selected.size === results.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </button>
              </div>

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
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
                      selected.has(i)
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-white/20'
                    }`}>
                      {selected.has(i) && (
                        <CheckCircle size={12} className="text-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-bold truncate">
                        {r.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-slate-500">{r.date}</span>
                        {(r.totalInstallments ?? 1) > 1 && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                            cuota {r.currentInstallment}/{r.totalInstallments}
                          </span>
                        )}
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          r.currency === 'USD'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-white/5 text-slate-500'
                        }`}>
                          {r.currency}
                        </span>
                      </div>
                    </div>

                    <p className="text-rose-400 font-black text-sm flex-shrink-0">
                      {r.currency === 'USD'
                        ? `U$S ${r.amount}`
                        : formatM(r.amount)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="px-5 py-3 bg-white/5 border border-white/10 text-slate-400 rounded-2xl font-black text-xs hover:text-white transition-all"
                >
                  Cargar otro
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={selected.size === 0}
                  className="flex-1 bg-emerald-500 text-white p-4 rounded-2xl font-black hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Importar {selected.size} consumo{selected.size !== 1 ? 's' : ''}
                </button>
              </div>

            </div>
          )}

          {/* Confirmado */}
          {confirmed && (
            <div className="flex flex-col items-center gap-4 py-10">
              <CheckCircle size={40} className="text-emerald-400" />
              <p className="text-white font-black text-lg">¡Importación exitosa!</p>
              <p className="text-slate-500 text-sm">
                Los consumos fueron agregados al historial.
              </p>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}