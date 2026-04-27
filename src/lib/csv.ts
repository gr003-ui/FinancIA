import { Transaction } from '../store/useFinanceStore';

export function exportTransactionsToCSV(transactions: Transaction[], exchangeRate: number): void {
  const headers = ['Fecha', 'Descripción', 'Tipo', 'Subtipo', 'Método', 'Moneda', 'Monto', 'Monto ARS', 'Cuotas'];

  const rows = transactions.map(t => {
    const amountARS = t.currency === 'USD' ? t.amount * exchangeRate : t.amount;
    const subtype = t.type === 'income'
      ? (t.incomeType === 'fixed' ? 'Fijo' : 'Variable')
      : t.method;
    const cuotas = t.installments > 1 ? `${t.currentInstallment}/${t.installments}` : '-';

    return [
      new Date(t.date).toLocaleDateString('es-AR'),
      t.description,
      t.type === 'income' ? 'Ingreso' : 'Gasto',
      subtype,
      t.method,
      t.currency,
      t.amount.toString().replace('.', ','),
      amountARS.toFixed(2).replace('.', ','),
      cuotas,
    ];
  });

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(';'))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `financia_movimientos_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}