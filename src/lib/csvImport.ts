import { TransactionCategory } from '../store/useFinanceStore';

export interface ParsedRow {
  date: string;        // ISO string
  description: string;
  amount: number;
  type: 'income' | 'expense';
  currency: 'ARS' | 'USD';
  category: TransactionCategory;
  rawDate: string;
  rawAmount: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: string[];
  headers: string[];
}

// Limpia un string de CSV (quita comillas, espacios, puntos de miles, reemplaza coma decimal)
function cleanAmount(raw: string): number {
  const cleaned = raw
    .replace(/["""]/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')    // miles con punto → quitar
    .replace(',', '.');    // decimal con coma → punto
  return parseFloat(cleaned);
}

function parseDate(raw: string): string | null {
  const cleaned = raw.trim().replace(/["""]/g, '');

  // DD/MM/YYYY o DD-MM-YYYY
  const dmy = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y.length === 2 ? `20${y}` : y;
    return new Date(Number(year), Number(m) - 1, Number(d), 12).toISOString();
  }

  // YYYY-MM-DD
  const ymd = cleaned.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return new Date(Number(y), Number(m) - 1, Number(d), 12).toISOString();
  }

  // MM/DD/YYYY (fallback)
  const mdy = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mdy) {
    const [, m, d, y] = mdy;
    return new Date(Number(y), Number(m) - 1, Number(d), 12).toISOString();
  }

  return null;
}

// Detecta qué índice de columna corresponde a fecha, descripción y monto
function detectColumns(headers: string[]): {
  dateIdx: number;
  descIdx: number;
  amountIdx: number;
  creditIdx: number;
  debitIdx: number;
} {
  const h = headers.map((h) => h.toLowerCase().replace(/["""]/g, '').trim());

  const dateIdx = h.findIndex((c) =>
    ['fecha', 'date', 'fec', 'día', 'dia'].some((k) => c.includes(k))
  );
  const descIdx = h.findIndex((c) =>
    ['descripcion', 'descripción', 'concepto', 'detalle', 'description', 'movimiento', 'glosa'].some((k) => c.includes(k))
  );
  const amountIdx = h.findIndex((c) =>
    ['importe', 'monto', 'amount', 'total', 'valor'].some((k) => c.includes(k))
  );
  const debitIdx = h.findIndex((c) =>
    ['debito', 'débito', 'cargo', 'debit', 'egreso', 'gasto'].some((k) => c.includes(k))
  );
  const creditIdx = h.findIndex((c) =>
    ['credito', 'crédito', 'haber', 'credit', 'ingreso', 'deposito', 'depósito'].some((k) => c.includes(k))
  );

  return { dateIdx, descIdx, amountIdx, creditIdx, debitIdx };
}

// Auto-categoriza por palabras clave en la descripción
function inferCategory(desc: string): TransactionCategory {
  const d = desc.toLowerCase();
  if (['super', 'market', 'carrefour', 'dia', 'coto', 'walmart', 'disco', 'jumbo', 'verduleria', 'panaderia', 'restaurant', 'resto', 'cafe', 'delivery', 'pedidos', 'rappi'].some(k => d.includes(k))) return 'Alimentación';
  if (['uber', 'cabify', 'taxi', 'subte', 'colectivo', 'sube', 'nafta', 'combustible', 'peaje', 'estacion', 'shell', 'ypf', 'axion'].some(k => d.includes(k))) return 'Transporte';
  if (['luz', 'gas', 'agua', 'telefon', 'internet', 'telecom', 'fibertel', 'cablevision', 'metrogas', 'edesur', 'edenor', 'movistar', 'claro', 'personal'].some(k => d.includes(k))) return 'Servicios';
  if (['farmacia', 'medic', 'salud', 'doctor', 'clinica', 'hospital', 'obra social', 'osde', 'swiss'].some(k => d.includes(k))) return 'Salud';
  if (['netflix', 'spotify', 'disney', 'amazon', 'hbo', 'cine', 'teatro', 'streaming', 'juego', 'steam'].some(k => d.includes(k))) return 'Entretenimiento';
  if (['ropa', 'zara', 'nike', 'adidas', 'indument', 'calzado', 'zapateria'].some(k => d.includes(k))) return 'Indumentaria';
  if (['universidad', 'colegio', 'escuela', 'curso', 'libro', 'capacitacion', 'udemy', 'educacion'].some(k => d.includes(k))) return 'Educación';
  if (['hotel', 'airbnb', 'vuelo', 'aerolinea', 'viaje', 'turismo'].some(k => d.includes(k))) return 'Viajes';
  if (['alquiler', 'expensas', 'inmobiliaria', 'hogar', 'ferreteria', 'pintura', 'mueble'].some(k => d.includes(k))) return 'Hogar';
  return 'Otros';
}

export function parseCSV(content: string): ParseResult {
  const errors: string[] = [];
  const rows: ParsedRow[] = [];

  // Detectar separador: ; o ,
  const firstLine = content.split('\n')[0];
  const separator = firstLine.includes(';') ? ';' : ',';

  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { rows: [], errors: ['El archivo no tiene suficientes filas.'], headers: [] };
  }

  const headers = lines[0].split(separator).map((h) => h.replace(/["""]/g, '').trim());
  const { dateIdx, descIdx, amountIdx, creditIdx, debitIdx } = detectColumns(headers);

  if (dateIdx === -1) errors.push('No se encontró columna de fecha. Verificá que el encabezado diga "Fecha" o "Date".');
  if (descIdx === -1) errors.push('No se encontró columna de descripción. Usá "Descripcion", "Concepto" o "Detalle".');
  if (amountIdx === -1 && debitIdx === -1 && creditIdx === -1) {
    errors.push('No se encontró columna de monto. Usá "Importe", "Monto", "Debito" o "Credito".');
  }

  if (errors.length > 0) return { rows, errors, headers };

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator).map((c) => c.replace(/^[""]|[""]$/g, '').trim());
    if (cols.length < 2) continue;

    const rawDate   = dateIdx  !== -1 ? cols[dateIdx]  ?? '' : '';
    const rawDesc   = descIdx  !== -1 ? cols[descIdx]  ?? '' : '';

    const parsedDate = parseDate(rawDate);
    if (!parsedDate) {
      errors.push(`Fila ${i + 1}: fecha inválida "${rawDate}"`);
      continue;
    }

    let amount = 0;
    let type: 'income' | 'expense' = 'expense';
    let rawAmount = '';

    if (amountIdx !== -1) {
      // Columna única de monto: negativo = gasto, positivo = ingreso
      rawAmount = cols[amountIdx] ?? '';
      amount    = cleanAmount(rawAmount);
      if (isNaN(amount)) {
        errors.push(`Fila ${i + 1}: monto inválido "${rawAmount}"`);
        continue;
      }
      type   = amount >= 0 ? 'income' : 'expense';
      amount = Math.abs(amount);
    } else {
      // Columnas separadas de débito y crédito
      const debitVal  = debitIdx  !== -1 && cols[debitIdx]  ? cleanAmount(cols[debitIdx]!)  : 0;
      const creditVal = creditIdx !== -1 && cols[creditIdx] ? cleanAmount(cols[creditIdx]!) : 0;

      if (!isNaN(debitVal) && debitVal > 0) {
        amount    = debitVal;
        type      = 'expense';
        rawAmount = cols[debitIdx] ?? '';
      } else if (!isNaN(creditVal) && creditVal > 0) {
        amount    = creditVal;
        type      = 'income';
        rawAmount = cols[creditIdx] ?? '';
      } else {
        continue; // fila vacía de montos
      }
    }

    if (amount === 0) continue;

    rows.push({
      date:        parsedDate,
      description: rawDesc || 'Sin descripción',
      amount,
      type,
      currency:    'ARS',
      category:    inferCategory(rawDesc),
      rawDate,
      rawAmount,
    });
  }

  return { rows, errors, headers };
}