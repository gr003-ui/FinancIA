import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateId = () =>
  Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export type AccentTheme = 'emerald' | 'blue' | 'purple' | 'rose' | 'amber' | 'cyan';

export type TransactionCategory =
  | 'Alimentación' | 'Transporte' | 'Servicios' | 'Salud'
  | 'Entretenimiento' | 'Indumentaria' | 'Educación' | 'Viajes'
  | 'Hogar' | 'Otros';

export const CATEGORIES: TransactionCategory[] = [
  'Alimentación','Transporte','Servicios','Salud',
  'Entretenimiento','Indumentaria','Educación','Viajes','Hogar','Otros',
];

export interface Budget {
  id: string;
  category: TransactionCategory;
  amount: number;
  currency: 'ARS' | 'USD';
}

// Registro de que una factura de tarjeta fue pagada
export interface CardBillPayment {
  id: string;
  cardId: string;
  billingMonth: number; // mes de consumo (no de pago)
  billingYear: number;
  paidAt: string;       // ISO date
  totalPaid: number;    // en ARS
}

export interface Card {
  id: string;
  bank: string;
  type: 'Crédito' | 'Débito';
  singleLimit: boolean;
  limitOnePayment: number;
  limitInstallments: number;
  availableOnePayment: number;
  availableInstallments: number;
  closingDay?: number;
  dueDay?: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  currency: 'ARS' | 'USD';
  method: 'Efectivo' | 'Débito' | 'Crédito';
  type: 'income' | 'expense';
  incomeType?: 'fixed' | 'variable';
  category?: TransactionCategory;
  date: string;
  installments: number;
  currentInstallment: number;
  cardId?: string;
}

interface FinanceState {
  cards: Card[];
  transactions: Transaction[];
  budgets: Budget[];
  billPayments: CardBillPayment[];
  exchangeRate: number;
  userName: string;
  accentTheme: AccentTheme;
  onboardingComplete: boolean;
  addCard: (card: Omit<Card, 'id' | 'availableOnePayment' | 'availableInstallments'>) => void;
  removeCard: (id: string) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;
  setBudget: (category: TransactionCategory, amount: number, currency: 'ARS' | 'USD') => void;
  removeBudget: (category: TransactionCategory) => void;
  markCardBillAsPaid: (cardId: string, billingMonth: number, billingYear: number) => void;
  unmarkCardBillAsPaid: (cardId: string, billingMonth: number, billingYear: number) => void;
  setExchangeRate: (rate: number) => void;
  setUserName: (name: string) => void;
  setAccentTheme: (theme: AccentTheme) => void;
  setOnboardingComplete: () => void;
  resetAll: () => void;
}

// ── Helpers de tarjeta ────────────────────────────────────────────────────────

function monthsPassedSince(dateISO: string): number {
  const txDate = new Date(dateISO);
  const now    = new Date();
  return Math.max(
    0,
    (now.getFullYear() - txDate.getFullYear()) * 12 +
      (now.getMonth() - txDate.getMonth())
  );
}

function effectiveCardDeduction(
  amountInARS: number,
  installments: number,
  txDateISO: string
): number {
  if (installments <= 1) return amountInARS;
  const passed      = monthsPassedSince(txDateISO);
  const alreadyPaid = Math.min(passed, installments);
  return (amountInARS * (installments - alreadyPaid)) / installments;
}

function applyDeductionToCard(card: Card, deduction: number): Card {
  if (deduction <= 0 || card.type === 'Débito') return card;
  if (card.singleLimit) {
    return { ...card, availableOnePayment: Math.max(0, card.availableOnePayment - deduction) };
  }
  const total = card.availableOnePayment + card.availableInstallments;
  if (total <= 0) return card;
  return {
    ...card,
    availableOnePayment:   Math.max(0, card.availableOnePayment   - deduction * (card.availableOnePayment   / total)),
    availableInstallments: Math.max(0, card.availableInstallments - deduction * (card.availableInstallments / total)),
  };
}

function applyRestorationToCard(card: Card, deduction: number): Card {
  if (deduction <= 0 || card.type === 'Débito') return card;
  if (card.singleLimit) {
    return { ...card, availableOnePayment: Math.min(card.limitOnePayment, card.availableOnePayment + deduction) };
  }
  const total = card.limitOnePayment + card.limitInstallments;
  if (total <= 0) return card;
  return {
    ...card,
    availableOnePayment:   Math.min(card.limitOnePayment,   card.availableOnePayment   + deduction * (card.limitOnePayment   / total)),
    availableInstallments: Math.min(card.limitInstallments, card.availableInstallments + deduction * (card.limitInstallments / total)),
  };
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      cards:              [],
      transactions:       [],
      budgets:            [],
      billPayments:       [],
      exchangeRate:       1000,
      userName:           'Usuario FinancIA',
      accentTheme:        'emerald',
      onboardingComplete: false,

      setExchangeRate:       (rate)  => set({ exchangeRate: rate }),
      setUserName:           (name)  => set({ userName: name }),
      setAccentTheme:        (theme) => set({ accentTheme: theme }),
      setOnboardingComplete: ()      => set({ onboardingComplete: true }),

      setBudget: (category, amount, currency) =>
        set((state) => {
          const existing = state.budgets.find((b) => b.category === category);
          if (existing) {
            return {
              budgets: state.budgets.map((b) =>
                b.category === category ? { ...b, amount, currency } : b
              ),
            };
          }
          return { budgets: [...state.budgets, { id: generateId(), category, amount, currency }] };
        }),

      removeBudget: (category) =>
        set((state) => ({
          budgets: state.budgets.filter((b) => b.category !== category),
        })),

      // Marca el resumen de una tarjeta como pagado y restaura el límite disponible
      markCardBillAsPaid: (cardId, billingMonth, billingYear) =>
        set((state) => {
          const alreadyPaid = state.billPayments.some(
            (p) => p.cardId === cardId && p.billingMonth === billingMonth && p.billingYear === billingYear
          );
          if (alreadyPaid) return state;

          // Calcula el total del resumen (consumos de ese mes de crédito)
          const billTxs = state.transactions.filter((t) => {
            if (t.type !== 'expense' || t.method !== 'Crédito' || t.cardId !== cardId) return false;
            const d = new Date(t.date);
            return d.getMonth() === billingMonth && d.getFullYear() === billingYear;
          });

          const totalPaid = billTxs.reduce((acc, t) => {
            const monthly = t.installments > 1 ? t.amount / t.installments : t.amount;
            return acc + (t.currency === 'USD' ? monthly * state.exchangeRate : monthly);
          }, 0);

          // Restaura el límite disponible de la tarjeta
          const updatedCards = state.cards.map((card) => {
            if (card.id !== cardId) return card;
            return applyRestorationToCard(card, totalPaid);
          });

          return {
            cards: updatedCards,
            billPayments: [
              ...state.billPayments,
              {
                id: generateId(),
                cardId,
                billingMonth,
                billingYear,
                paidAt: new Date().toISOString(),
                totalPaid,
              },
            ],
          };
        }),

      unmarkCardBillAsPaid: (cardId, billingMonth, billingYear) =>
        set((state) => {
          const payment = state.billPayments.find(
            (p) => p.cardId === cardId && p.billingMonth === billingMonth && p.billingYear === billingYear
          );
          if (!payment) return state;

          // Revierte la restauración del límite
          const updatedCards = state.cards.map((card) => {
            if (card.id !== cardId) return card;
            return applyDeductionToCard(card, payment.totalPaid);
          });

          return {
            cards: updatedCards,
            billPayments: state.billPayments.filter((p) => p.id !== payment.id),
          };
        }),

      addCard: (card) =>
        set((state) => ({
          cards: [
            ...state.cards,
            {
              ...card,
              id: generateId(),
              availableOnePayment:   card.limitOnePayment,
              availableInstallments: card.singleLimit ? 0 : card.limitInstallments,
            },
          ],
        })),

      removeCard: (id) =>
        set((state) => ({ cards: state.cards.filter((c) => c.id !== id) })),

      addTransaction: (tx) =>
        set((state) => {
          const newTx = { ...tx, id: generateId() };
          let updatedCards = [...state.cards];
          if (tx.type === 'expense' && tx.cardId && tx.method === 'Crédito') {
            const amountInARS = tx.currency === 'USD' ? tx.amount * state.exchangeRate : tx.amount;
            const deduction   = effectiveCardDeduction(amountInARS, tx.installments || 1, tx.date);
            updatedCards = state.cards.map((c) =>
              c.id === tx.cardId ? applyDeductionToCard(c, deduction) : c
            );
          }
          return { transactions: [newTx, ...state.transactions], cards: updatedCards };
        }),

      removeTransaction: (id) =>
        set((state) => {
          const tx = state.transactions.find((t) => t.id === id);
          if (!tx) return state;
          let updatedCards = [...state.cards];
          if (tx.type === 'expense' && tx.cardId && tx.method === 'Crédito') {
            const amountInARS = tx.currency === 'USD' ? tx.amount * state.exchangeRate : tx.amount;
            const deduction   = effectiveCardDeduction(amountInARS, tx.installments || 1, tx.date);
            updatedCards = state.cards.map((c) =>
              c.id === tx.cardId ? applyRestorationToCard(c, deduction) : c
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
          billPayments: [],
          cards: state.cards.map((card) => ({
            ...card,
            availableOnePayment:   card.limitOnePayment,
            availableInstallments: card.singleLimit ? 0 : card.limitInstallments,
          })),
        })),
    }),
    { name: 'financia-storage-v8' }
  )
);

// ── Helpers exportados ────────────────────────────────────────────────────────

export function getMonthlyAmount(t: Transaction): number {
  if (t.type === 'expense' && t.installments > 1) return t.amount / t.installments;
  return t.amount;
}

/**
 * Para una transacción de crédito en cuotas, devuelve el número de cuota
 * que corresponde al mes/año indicado.
 */
export function getInstallmentForMonth(
  t: Transaction,
  month: number,
  year: number
): number {
  if (t.type !== 'expense' || t.method !== 'Crédito' || t.installments <= 1) {
    return t.currentInstallment;
  }
  const purchaseDate     = new Date(t.date);
  const purchaseMonthAbs = purchaseDate.getFullYear() * 12 + purchaseDate.getMonth();
  const targetMonthAbs   = year * 12 + month;
  const offset           = targetMonthAbs - purchaseMonthAbs - 1;
  return t.currentInstallment + offset;
}

/**
 * Filtra transacciones que IMPACTAN en el balance de un mes/año:
 * - Efectivo/Débito: impactan en el mes de la transacción
 * - Crédito 1 pago: impacta en el mes siguiente
 * - Crédito cuotas: cada cuota impacta en el mes correspondiente
 *   (cuota N° currentInstallment en purchaseMonth+1, siguientes en meses sucesivos)
 */
export function filterByImpactMonth(
  transactions: Transaction[],
  month: number,
  year: number
): Transaction[] {
  const targetMonthAbs = year * 12 + month;

  return transactions.filter((t) => {
    if (t.type !== 'expense' || t.method !== 'Crédito') {
      // Ingresos y gastos no-crédito: mismo mes
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    }

    const purchaseDate     = new Date(t.date);
    const purchaseMonthAbs = purchaseDate.getFullYear() * 12 + purchaseDate.getMonth();

    if (t.installments <= 1) {
      // 1 pago con crédito: mes siguiente al consumo
      return targetMonthAbs === purchaseMonthAbs + 1;
    }

    // Cuotas:
    // - currentInstallment paga en purchaseMonth + 1
    // - la última cuota (installments) paga en purchaseMonth + 1 + (installments - currentInstallment)
    const firstPaymentMonthAbs = purchaseMonthAbs + 1;
    const lastPaymentMonthAbs  = firstPaymentMonthAbs + (t.installments - t.currentInstallment);

    return targetMonthAbs >= firstPaymentMonthAbs && targetMonthAbs <= lastPaymentMonthAbs;
  });
}

export function getPaymentDate(t: Transaction): Date {
  const txDate = new Date(t.date);
  if (t.type === 'expense' && t.method === 'Crédito') {
    return new Date(txDate.getFullYear(), txDate.getMonth() + 1, 1);
  }
  return txDate;
}

export function getDaysUntil(day: number): number {
  const now    = new Date();
  const today  = now.getDate();
  const target = day >= today
    ? new Date(now.getFullYear(), now.getMonth(), day)
    : new Date(now.getFullYear(), now.getMonth() + 1, day);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}