"use client";
import { useState, useRef } from 'react';
import { useFinanceStore, CATEGORIES, TransactionCategory } from '../../store/useFinanceStore';
import { parseCSV, ParsedRow } from '../../lib/csvImport';
import {
  Upload, FileText, CheckCircle, XCircle,
  AlertCircle, ArrowUpCircle, ArrowDownCircle, Trash2, ChevronDown,
} from 'lucide-react';

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function ImportarPage() {
  const { addTransaction } = useFinanceStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rows,     setRows]     = useState<ParsedRow[]>([]);
  const [errors,   setErrors]   = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [imported, setImported] = useState(false);
  const [fileName, setFileName] = useState('');
  const [editRow,  setEditRow]  = useState<number | null>(null);

  const formatM = (v: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
    }).format(v);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    setImported(false);
    setRows([]);
    setErrors([]);
    setSelected(new Set());

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result  = parseCSV(content);
      setRows(result.rows);
      setErrors(result.errors);
      setSelected(new Set(result.rows.map((_, i) => i)));
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.csv')) handleFile(file);
  };

  const toggleRow = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((_, i) => i)));
  };

  const updateRow = (i: number, patch: Partial<ParsedRow>) => {
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  };

  const handleImport = () => {
    const toImport = rows.filter((_, i) => selected.has(i));
    toImport.forEach((row) => {
      addTransaction({
        description:        row.description,
        amount:             row.amount,
        type:               row.type,
        method:             'Efectivo',
        currency:           row.currency,
        date:               row.date,
        installments:       1,
        currentInstallment: 1,
        category:           row.category,
      });
    });
    setImported(true);
    setRows([]);
    setSelected(new Set());
    setFileName('');
  };

  return (
    <main className="p-10 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-5xl font-black tracking-tighter text-white">Importar Extracto</h1>
        <p className="text-slate-500 text-sm mt-1">
          Subí un CSV de tu banco para cargar movimientos automáticamente.
          Compatible con Galicia, Santander, BBVA, Macro, Naranja X y otros.
        </p>
      </div>

      {/* Éxito */}
      {imported && (
        <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/30 rounded-[2rem] p-6">
          <CheckCircle size={28} className="text-emerald-400 flex-shrink-0" />
          <div>
            <p className="font-black text-white">¡Importación exitosa!</p>
            <p className="text-slate-400 text-sm">Los movimientos fueron agregados a tu historial.</p>
          </div>
          <button
            onClick={() => setImported(false)}
            className="ml-auto px-4 py-2 bg-emerald-500 text-white rounded-xl font-black text-xs hover:bg-emerald-400 transition-all"
          >
            Importar otro
          </button>
        </div>
      )}

      {/* Zona de drop */}
      {!imported && rows.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-white/10 hover:border-emerald-500/50 bg-slate-900 rounded-[3rem] p-16 text-center cursor-pointer transition-all group"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="w-16 h-16 bg-white/5 group-hover:bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all">
            <Upload size={28} className="text-slate-500 group-hover:text-emerald-400 transition-all" />
          </div>
          <p className="text-white font-black text-lg">Arrastrá tu archivo CSV acá</p>
          <p className="text-slate-500 text-sm mt-2">o hacé clic para seleccionarlo</p>
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {['Galicia','Santander','BBVA','Macro','Naranja X','Brubank'].map((b) => (
              <span key={b} className="px-3 py-1 bg-white/5 text-slate-500 text-[10px] font-bold rounded-full uppercase">
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Instrucciones */}
      {!imported && rows.length === 0 && (
        <div className="bg-slate-900 rounded-[2.5rem] border border-white/10 p-8 space-y-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            ¿Cómo exportar el CSV de tu banco?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
            <div className="space-y-1">
              <p className="font-bold text-white">Galicia / BBVA</p>
              <p>Movimientos → Descargar → CSV</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-white">Santander</p>
              <p>Cuenta → Extracto → Exportar Excel/CSV</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-white">Naranja X</p>
              <p>Movimientos → Descargar resumen → CSV</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-white">Brubank</p>
              <p>Historial → Exportar → Formato CSV</p>
            </div>
          </div>
          <div className="pt-3 border-t border-white/10 flex items-start gap-2 text-[10px] text-slate-600">
            <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
            <span>
              El archivo debe tener encabezados con al menos: <strong className="text-slate-400">Fecha</strong>,{' '}
              <strong className="text-slate-400">Descripción</strong> y{' '}
              <strong className="text-slate-400">Importe</strong> (o Débito/Crédito por separado).
            </span>
          </div>
        </div>
      )}

      {/* Errores del parser */}
      {errors.length > 0 && (
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-[2rem] p-6 space-y-2">
          <div className="flex items-center gap-2">
            <XCircle size={18} className="text-rose-400" />
            <p className="text-rose-400 font-black text-sm">
              {errors.length} advertencia{errors.length !== 1 ? 's' : ''} al parsear
            </p>
          </div>
          <ul className="space-y-1">
            {errors.map((err, i) => (
              <li key={i} className="text-xs text-rose-400/70 ml-6">• {err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview de filas */}
      {rows.length > 0 && (
        <div className="space-y-4">

          {/* Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-900 border border-white/10 p-1 rounded-2xl">
                <FileText size={14} className="text-slate-500 ml-2" />
                <span className="text-xs font-bold text-slate-400 pr-3">{fileName}</span>
              </div>
              <p className="text-slate-500 text-xs">
                <span className="font-black text-white">{selected.size}</span> de {rows.length} filas seleccionadas
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAll}
                className="px-4 py-2 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                {selected.size === rows.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>
              <button
                onClick={handleImport}
                disabled={selected.size === 0}
                className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black hover:bg-emerald-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
              >
                Importar {selected.size} movimiento{selected.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div
                key={i}
                className={`bg-slate-900 border rounded-[2rem] transition-all ${
                  selected.has(i) ? 'border-white/10' : 'border-white/5 opacity-40'
                }`}
              >
                <div className="flex items-center gap-4 p-4">

                  {/* Checkbox */}
                  <button
                    onClick={() => toggleRow(i)}
                    className={`w-5 h-5 rounded-lg border flex-shrink-0 flex items-center justify-center transition-all ${
                      selected.has(i)
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-white/20 bg-white/5'
                    }`}
                  >
                    {selected.has(i) && <CheckCircle size={12} className="text-white" />}
                  </button>

                  {/* Ícono tipo */}
                  <div className={`p-2 rounded-xl flex-shrink-0 ${
                    row.type === 'income' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                  }`}>
                    {row.type === 'income'
                      ? <ArrowUpCircle size={16} className="text-emerald-400" />
                      : <ArrowDownCircle size={16} className="text-rose-400" />}
                  </div>

                  {/* Fecha */}
                  <span className="text-[10px] text-slate-500 w-20 flex-shrink-0">
                    {formatDate(row.date)}
                  </span>

                  {/* Descripción */}
                  <span className="text-sm font-bold text-white flex-1 truncate">
                    {row.description}
                  </span>

                  {/* Categoría */}
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/5 text-slate-500 hidden sm:block">
                    {row.category}
                  </span>

                  {/* Monto */}
                  <span className={`font-black text-sm flex-shrink-0 ${
                    row.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {row.type === 'income' ? '+' : '-'}{formatM(row.amount)}
                  </span>

                  {/* Expandir para editar */}
                  <button
                    onClick={() => setEditRow(editRow === i ? null : i)}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-slate-600 hover:text-white transition-all flex-shrink-0"
                  >
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${editRow === i ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Eliminar */}
                  <button
                    onClick={() => {
                      setRows((prev) => prev.filter((_, idx) => idx !== i));
                      setSelected((prev) => {
                        const next = new Set<number>();
                        prev.forEach((v) => { if (v < i) next.add(v); else if (v > i) next.add(v - 1); });
                        return next;
                      });
                    }}
                    className="p-1.5 rounded-xl hover:bg-rose-500/20 text-slate-600 hover:text-rose-400 transition-all flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Edición inline expandible */}
                {editRow === i && (
                  <div className="px-6 pb-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/5 pt-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Descripción</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold outline-none focus:border-emerald-500 transition-all"
                        value={row.description}
                        onChange={(e) => updateRow(i, { description: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Tipo</label>
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold outline-none"
                        value={row.type}
                        onChange={(e) => updateRow(i, { type: e.target.value as 'income' | 'expense' })}
                      >
                        <option value="expense" className="bg-slate-900">Gasto</option>
                        <option value="income"  className="bg-slate-900">Ingreso</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Categoría</label>
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold outline-none"
                        value={row.category}
                        onChange={(e) => updateRow(i, { category: e.target.value as TransactionCategory })}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c} className="bg-slate-900">{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Moneda</label>
                      <select
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold outline-none"
                        value={row.currency}
                        onChange={(e) => updateRow(i, { currency: e.target.value as 'ARS' | 'USD' })}
                      >
                        <option value="ARS" className="bg-slate-900">ARS</option>
                        <option value="USD" className="bg-slate-900">USD</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      )}
    </main>
  );
}