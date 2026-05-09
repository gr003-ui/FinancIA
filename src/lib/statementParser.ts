export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  currentInstallment: number;
  totalInstallments: number;
  currency: 'ARS' | 'USD';
}

// Convierte formato argentino: $1.234,56 → 1234.56
function parseArgAmount(raw: string): number {
  const s = raw.replace(/\$/g, '').replace(/\s/g, '').trim();
  // 1.234,56 → 1234.56
  if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(s)) {
    return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  }
  // 1.234 (sin decimales)
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    return parseFloat(s.replace(/\./g, ''));
  }
  // 1234,56
  if (/^\d+,\d{2}$/.test(s)) {
    return parseFloat(s.replace(',', '.'));
  }
  return parseFloat(s) || 0;
}

// Normaliza fecha a DD/MM/YYYY
function normalizeDate(raw: string): string {
  const s   = raw.trim();
  const now = new Date();

  const full = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (full) {
    const y = full[3]!.length === 2 ? `20${full[3]}` : full[3];
    return `${full[1]!.padStart(2,'0')}/${full[2]!.padStart(2,'0')}/${y}`;
  }
  const short = s.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (short) {
    return `${short[1]!.padStart(2,'0')}/${short[2]!.padStart(2,'0')}/${now.getFullYear()}`;
  }
  return `01/01/${now.getFullYear()}`;
}

// Extrae info de cuotas de la descripción
function extractInstallments(text: string): {
  desc: string;
  current: number;
  total: number;
} {
  let current = 1;
  let total   = 1;
  let desc    = text;

  const patterns: RegExp[] = [
    /\((\d+)\s*\/\s*(\d+)\)/,           // (3/12)
    /\[(\d+)\s*\/\s*(\d+)\]/,           // [3/12]
    /\bC\.?(\d+)\s*\/\s*(\d+)\b/i,      // C3/12 o C.3/12
    /CUOTA\s+(\d+)\s+(?:DE|\/)\s+(\d+)/i, // CUOTA 3 DE 12
    /(\d+)\s*\/\s*(\d+)\s+(?:CUOTA|CTA)/i, // 3/12 CUOTA
    /(?:CUOTA|CTA)[:\s]+(\d+)\s*\/\s*(\d+)/i, // CUOTA: 3/12
  ];

  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      const c = parseInt(m[1]!);
      const t = parseInt(m[2]!);
      if (c >= 1 && t >= c && t <= 99) {
        current = c;
        total   = t;
        desc    = text.replace(pat, '').replace(/\s+/g, ' ').trim();
        break;
      }
    }
  }

  return { desc, current, total };
}

// Lista de palabras que indican líneas a ignorar
const SKIP_KEYWORDS = [
  'TOTAL A PAGAR', 'PAGO MÍNIMO', 'PAGO MINIMO', 'SALDO ANTERIOR',
  'SALDO ACTUAL', 'FECHA DE CIERRE', 'FECHA DE VENCIMIENTO',
  'LÍMITE DE COMPRA', 'LIMITE DE COMPRA', 'DISPONIBLE',
  'RESUMEN DE CUENTA', 'PERÍODO', 'PERIODO', 'PÁGINA', 'PAGINA',
  'SUBTOTAL', 'INTERÉS', 'INTERES', 'FINANCIERO', 'I.V.A',
  'CARGOS Y CRÉDITOS', 'DÉBITOS AUTOMÁTICOS', 'TRANSFERENCIA',
];

export function parseStatementText(text: string): ParsedTransaction[] {
  const results: ParsedTransaction[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 4);

  // Patrón de fecha al inicio de la línea: DD/MM o DD/MM/YYYY
  const dateRE = /^(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\s+/;

  // Patrón de monto al final: $1.234,56 o 1.234,56
  const amountRE = /(\$?\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d{1,3}(?:\.\d{3})*,\d{2})\s*$/;

  for (const line of lines) {
    // Ignorar líneas con palabras clave de encabezados/totales
    const upper = line.toUpperCase();
    if (SKIP_KEYWORDS.some(kw => upper.includes(kw))) continue;

    // Debe empezar con fecha
    const dateMatch = line.match(dateRE);
    if (!dateMatch) continue;

    const date   = normalizeDate(dateMatch[1]!);
    const rest   = line.slice(dateMatch[0].length).trim();
    if (rest.length < 3) continue;

    // Detectar moneda
    const isUSD = /USD|U\$S|US\$|\bDOLAR/i.test(rest);

    // Buscar monto al final
    const amountMatch = rest.match(amountRE);
    if (!amountMatch) continue;

    const amount = parseArgAmount(amountMatch[1]!);
    if (amount < 10) continue; // Ignorar montos irrisorios

    // Descripción = todo antes del monto
    const rawDesc = rest.slice(0, rest.lastIndexOf(amountMatch[1]!)).trim();
    if (rawDesc.length < 2) continue;

    const { desc, current, total } = extractInstallments(rawDesc);

    results.push({
      date,
      description: desc || rawDesc,
      amount,
      currentInstallment: current,
      totalInstallments:  total,
      currency: isUSD ? 'USD' : 'ARS',
    });
  }

  return results;
}