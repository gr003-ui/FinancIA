import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateId = () =>
  Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export interface Card {
  id: string;
  bank: string;
  type: 'Crédito' | 'Débito';
  singleLimit: boolean;
  limitOnePayment: number;
  limitInstallments: number;
  availableOnePayment: number;
  availableInstallments: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  currency: 'ARS' | 'USD';
  method: 'Efectivo' | 'Débito' | 'Crédito';
  type: 'income' | 'expense';
  incomeType?: 'fixed' | 'variable';
  date: string;
  installments: number;
  currentInstallment: number;
  cardId?: string;
}

interface FinanceState {
  cards: Card[];
  transactions: Transaction[];
  exchangeRate: number;
  userName: string;
  addCard: (card: Omit<Card, 'id' | 'availableOnePayment' | 'availableInstallments'>) => void;
  removeCard: (id: string) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;
  setExchangeRate: (rate: number) => void;
  setUserName: (name: string) => void;
  resetAll: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Meses transcurridos entre la fecha de la transacción y hoy.
 * Se usa para saber cuántas cuotas ya fueron "pagadas" en meses pasados.
 */
function monthsPassedSince(dateISO: string): number {
  const txDate = new Date(dateISO);
  const now = new Date();
  return Math.max(
    0,
    (now.getFullYear() - txDate.getFullYear()) * 12 +
      (now.getMonth() - txDate.getMonth())
  );
}

/**
 * Monto efectivo a descontar del límite de tarjeta al registrar un gasto.
 * Para cuotas: descuenta solo las cuotas aún no vencidas.
 * Para 1 pago: descuenta el total.
 */
function effectiveCardDeduction(
  amountInARS: number,
  installments: number,
  txDateISO: string
): number {
  if (installments <= 1) return amountInARS;
  const passed = monthsPassedSince(txDateISO);
  const alreadyPaid = Math.min(passed, installments);
  const remaining = installments - alreadyPaid;
  return (amountInARS * remaining) / installments;
}

/**
 * Aplica el descuento al card según su tipo de límite.
 * - singleLimit: descuenta todo de availableOnePayment
 * - dual: descuenta proporcionalmente de ambos límites
 */
function applyDeductionToCard(card: Card, deduction: number): Card {
  if (deduction <= 0) return card;
  if (card.type === 'Débito') return card; // débito no tiene límite

  if (card.singleLimit) {
    return {
      ...card,
      availableOnePayment: Math.max(0, card.availableOnePayment - deduction),
    };
  }

  // Límite dual proporcional
  const totalAvail = card.availableOnePayment + card.availableInstallments;
  if (totalAvail <= 0) return card;

  const ratioOne = card.availableOnePayment / totalAvail;
  const ratioInst = card.availableInstallments / totalAvail;

  return {
    ...card,
    availableOnePayment: Math.max(0, card.availableOnePayment - deduction * ratioOne),
    availableInstallments: Math.max(0, card.availableInstallments - deduction * ratioInst),
  };
}

/**
 * Restaura al card el monto que fue descontado al eliminar una transacción.
 * Usa la misma lógica proporcional pero a la inversa (con los límites máximos como techo).
 */
function applyRestorationToCard(card: Card, deduction: number): Card {
  if (deduction <= 0) return card;
  if (card.type === 'Débito') return card;

  if (card.singleLimit) {
    return {
      ...card,
      availableOnePayment: Math.min(
        card.limitOnePayment,
        card.availableOnePayment + deduction
      ),
    };
  }

  const totalLimit = card.limitOnePayment + card.limitInstallments;
  if (totalLimit <= 0) return card;

  const ratioOne = card.limitOnePayment / totalLimit;
  const ratioInst = card.limitInstallments / totalLimit;

  return {
    ...card,
    availableOnePayment: Math.min(
      card.limitOnePayment,
      card.availableOnePayment + deduction * ratioOne
    ),
    availableInstallments: Math.min(
      card.limitInstallments,
      card.availableInstallments + deduction * ratioInst
    ),
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      cards: [],
      transactions: [],
      exchangeRate: 1000,
      userName: 'Usuario FinancIA',

      setExchangeRate: (rate) => set({ exchangeRate: rate }),
      setUserName: (name) => set({ userName: name }),

      addCard: (card) =>
        set((state) => ({
          cards: [
            ...state.cards,
            {
              ...card,
              id: generateId(),
              availableOnePayment: card.limitOnePayment,
              availableInstallments: card.singleLimit ? 0 : card.limitInstallments,
            },
          ],
        })),

      removeCard: (id) =>
        set((state) => ({
          cards: state.cards.filter((c) => c.id !== id),
        })),

      addTransaction: (tx) =>
        set((state) => {
          const newTx = { ...tx, id: generateId() };
          let updatedCards = [...state.cards];

          if (tx.type === 'expense' && tx.cardId && tx.method === 'Crédito') {
            const amountInARS =
              tx.currency === 'USD' ? tx.amount * state.exchangeRate : tx.amount;
            const deduction = effectiveCardDeduction(
              amountInARS,
              tx.installments || 1,
              tx.date
            );

            updatedCards = state.cards.map((card) =>
              card.id === tx.cardId
                ? applyDeductionToCard(card, deduction)
                : card
            );
          }

          return {
            transactions: [newTx, ...state.transactions],
            cards: updatedCards,
          };
        }),

      removeTransaction: (id) =>
        set((state) => {
          const tx = state.transactions.find((t) => t.id === id);
          if (!tx) return state;

          let updatedCards = [...state.cards];

          if (tx.type === 'expense' && tx.cardId && tx.method === 'Crédito') {
            const amountInARS =
              tx.currency === 'USD' ? tx.amount * state.exchangeRate : tx.amount;
            const deduction = effectiveCardDeduction(
              amountInARS,
              tx.installments || 1,
              tx.date
            );

            updatedCards = state.cards.map((card) =>
              card.id === tx.cardId
                ? applyRestorationToCard(card, deduction)
                : card
            );
          }

          return {
            transactions: state.transactions.filter((t) => t.id !== id),
            cards: updatedCards,
          };
        }),

      resetAll: () =>
        set((state) => ({
          transactions: [],
          cards: state.cards.map((card) => ({
            ...card,
            availableOnePayment: card.limitOnePayment,
            availableInstallments: card.singleLimit ? 0 : card.limitInstallments,
          })),
        })),
    }),
    { name: 'financia-storage-v8' }
  )
);

/**
 * Monto mensual efectivo de una transacción para el cálculo del balance.
 * Gastos en cuotas → amount / installments (solo lo que paga este mes).
 * Todo lo demás → amount completo.
 */
export function getMonthlyAmount(t: Transaction): number {
  if (t.type === 'expense' && t.installments > 1) {
    return t.amount / t.installments;
  }
  return t.amount;
}