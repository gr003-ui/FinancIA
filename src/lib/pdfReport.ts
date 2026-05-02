import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Card, Budget, getMonthlyAmount } from '../store/useFinanceStore';

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun',
                      'Jul','Ago','Sep','Oct','Nov','Dic'];

function formatARS(v: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(v);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

interface ReportParams {
  month: number;
  year: number;
  transactions: Transaction[];
  cards: Card[];
  budgets: Budget[];
  exchangeRate: number;
  userName: string;
}

export function generateMonthlyPDF({
  month, year, transactions, cards, budgets, exchangeRate, userName,
}: ReportParams): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const toARS = (amount: number, currency: 'ARS' | 'USD') =>
    currency === 'USD' ? amount * exchangeRate : amount;

  const periodTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const totalIngresos = periodTx
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + toARS(t.amount, t.currency), 0);

  const totalGastos = periodTx
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + toARS(getMonthlyAmount(t), t.currency), 0);

  const balance = totalIngresos - totalGastos;

  const pageW   = doc.internal.pageSize.getWidth();
  const margin  = 15;
  const colW    = (pageW - margin * 2) / 3;

  // ── Paleta ────────────────────────────────────────────────────────────────
  const DARK   = [8,  10,  18]  as [number,number,number];
  const SLATE  = [15, 23,  42]  as [number,number,number];
  const EMERALD= [16, 185, 129] as [number,number,number];
  const ROSE   = [244, 63, 94]  as [number,number,number];
  const AMBER  = [245,158, 11]  as [number,number,number];
  const WHITE  = [241,245,249]  as [number,number,number];
  const MUTED  = [100,116,139]  as [number,number,number];

  // ── HEADER ────────────────────────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageW, 40, 'F');

  doc.setFillColor(...EMERALD);
  doc.rect(0, 0, 4, 40, 'F');

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('FinancIA', margin + 4, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text(`Reporte mensual — ${MONTHS[month]} ${year}`, margin + 4, 24);
  doc.text(`Usuario: ${userName}`, margin + 4, 31);

  doc.setFontSize(8);
  doc.text(
    `Generado el ${new Date().toLocaleDateString('es-AR')} · Cotización USD: ${formatARS(exchangeRate)}`,
    pageW - margin, 31, { align: 'right' }
  );

  // ── KPI CARDS ─────────────────────────────────────────────────────────────
  let y = 50;

  const kpis = [
    { label: 'Balance',  value: formatARS(balance),         color: balance >= 0 ? EMERALD : ROSE },
    { label: 'Ingresos', value: formatARS(totalIngresos),   color: EMERALD },
    { label: 'Gastos',   value: formatARS(totalGastos),     color: ROSE },
  ];

  kpis.forEach((kpi, i) => {
    const x = margin + i * colW;
    doc.setFillColor(...SLATE);
    doc.roundedRect(x, y, colW - 4, 22, 3, 3, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(kpi.label.toUpperCase(), x + 5, y + 6);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...kpi.color);
    doc.text(kpi.value, x + 5, y + 16);
  });

  y += 30;

  // ── MOVIMIENTOS ───────────────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('Movimientos del Período', margin, y);
  y += 5;

  const txRows = periodTx.map((t) => {
    const monthly = getMonthlyAmount(t);
    const arsVal  = toARS(monthly, t.currency);
    return [
      formatDate(t.date),
      t.description.slice(0, 38),
      t.type === 'income' ? 'Ingreso' : 'Gasto',
      t.method,
      t.category ?? '-',
      t.installments > 1 ? `${t.currentInstallment}/${t.installments}` : '-',
      t.currency === 'USD'
        ? `U$S ${monthly.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`
        : formatARS(arsVal),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Fecha','Descripción','Tipo','Método','Categoría','Cuota','Monto']],
    body: txRows,
    theme: 'plain',
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: WHITE,
      fillColor: DARK,
    },
    headStyles: {
      fillColor: SLATE,
      textColor: MUTED,
      fontStyle: 'bold',
      fontSize: 7,
    },
    alternateRowStyles: { fillColor: [12, 18, 30] as [number,number,number] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 52 },
      2: { cellWidth: 16 },
      3: { cellWidth: 18 },
      4: { cellWidth: 24 },
      5: { cellWidth: 12 },
      6: { cellWidth: 28, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        const val = data.cell.raw as string;
        data.cell.styles.textColor = val === 'Ingreso' ? EMERALD : ROSE;
      }
    },
  });

  // ── RESUMEN POR CATEGORÍA ─────────────────────────────────────────────────
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  if (finalY > 250) doc.addPage();

  const catY = finalY > 250 ? 20 : finalY;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('Resumen por Categoría', margin, catY);

  const catMap: Record<string, number> = {};
  periodTx
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = t.category ?? 'Otros';
      catMap[cat] = (catMap[cat] ?? 0) + toARS(getMonthlyAmount(t), t.currency);
    });

  const catRows = Object.entries(catMap)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => {
      const budget = budgets.find((b) => b.category === cat);
      const limit  = budget ? toARS(budget.amount, budget.currency) : null;
      const pct    = limit ? Math.round((amount / limit) * 100) : null;
      return [
        cat,
        formatARS(amount),
        limit ? formatARS(limit) : 'Sin presupuesto',
        pct !== null ? `${pct}%` : '-',
      ];
    });

  autoTable(doc, {
    startY: catY + 5,
    head: [['Categoría','Gastado','Presupuesto','% Usado']],
    body: catRows,
    theme: 'plain',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: WHITE,
      fillColor: DARK,
    },
    headStyles: {
      fillColor: SLATE,
      textColor: MUTED,
      fontStyle: 'bold',
      fontSize: 7,
    },
    alternateRowStyles: { fillColor: [12, 18, 30] as [number,number,number] },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const raw = data.cell.raw as string;
        const num = parseInt(raw);
        if (!isNaN(num)) {
          data.cell.styles.textColor = num >= 100 ? ROSE : num >= 80 ? AMBER : EMERALD;
        }
      }
    },
  });

  // ── TARJETAS ──────────────────────────────────────────────────────────────
  const creditCards = cards.filter((c) => c.type === 'Crédito');
  if (creditCards.length > 0) {
    const cardsY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    const needsPage = cardsY > 240;
    if (needsPage) doc.addPage();
    const cY = needsPage ? 20 : cardsY;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text('Estado de Tarjetas de Crédito', margin, cY);

    const cardRows = creditCards.map((c) => [
      c.bank,
      formatARS(c.limitOnePayment),
      formatARS(c.availableOnePayment),
      `${Math.round((c.availableOnePayment / c.limitOnePayment) * 100)}%`,
      c.singleLimit ? '-' : formatARS(c.limitInstallments),
      c.singleLimit ? '-' : formatARS(c.availableInstallments),
    ]);

    autoTable(doc, {
      startY: cY + 5,
      head: [['Banco','Límite 1P','Disponible 1P','% Libre','Límite Cuotas','Disp. Cuotas']],
      body: cardRows,
      theme: 'plain',
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: WHITE,
        fillColor: DARK,
      },
      headStyles: {
        fillColor: SLATE,
        textColor: MUTED,
        fontStyle: 'bold',
        fontSize: 7,
      },
      alternateRowStyles: { fillColor: [12, 18, 30] as [number,number,number] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
      },
    });
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(
      `FinancIA · ${MONTHS[month]} ${year} · Página ${i} de ${pageCount}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  doc.save(`financia_${MONTHS[month].toLowerCase()}_${year}.pdf`);
}