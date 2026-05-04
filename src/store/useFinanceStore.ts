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
  date: string;       // mes en que se realizó el consumo
  installments: number;
  currentInstallment: number;
  cardId?: string;
}

interface FinanceState {
  cards: Card[];
  transactions: Transaction[];
  budgets: Budget[];
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
  setExchangeRate: (rate: number) => void;
  setUserName: (name: string) => void;
  setAccentTheme: (theme: AccentTheme) => void;
  setOnboardingComplete: () => void;
  resetAll: () => void;
}

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

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      cards:              [],
      transactions:       [],
      budgets:            [],
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
          return {
            budgets: [...state.budgets, { id: generateId(), category, amount, currency }],
          };
        }),

      removeBudget: (category) =>
        set((state) => ({
          budgets: state.budgets.filter((b) => b.category !== category),
        })),

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

// Monto mensual de la cuota (para cuotas divide por total, para resto es el monto completo)
export function getMonthlyAmount(t: Transaction): number {
  if (t.type === 'expense' && t.installments > 1) return t.amount / t.installments;
  return t.amount;
}

/**
 * Devuelve la fecha en que un gasto de crédito REALMENTE impacta el balance.
 * Los consumos de crédito se pagan el mes SIGUIENTE al de la transacción.
 * Efectivo y débito impactan en el mismo mes.
 */
export function getPaymentDate(t: Transaction): Date {
  const txDate = new Date(t.date);
  if (t.type === 'expense' && t.method === 'Crédito') {
    return new Date(txDate.getFullYear(), txDate.getMonth() + 1, 1);
  }
  return txDate;
}

/**
 * Filtra transacciones que impactan en un mes/año dado.
 * Para crédito: impacta en mes+1 del registro.
 * Para todo lo demás: impacta en el mes del registro.
 */
export function filterByImpactMonth(
  transactions: Transaction[],
  month: number,
  year: number
): Transaction[] {
  return transactions.filter((t) => {
    const payDate = getPaymentDate(t);
    return payDate.getMonth() === month && payDate.getFullYear() === year;
  });
}

export function getDaysUntil(day: number): number {
  const now    = new Date();
  const today  = now.getDate();
  const target = day >= today
    ? new Date(now.getFullYear(), now.getMonth(), day)
    : new Date(now.getFullYear(), now.getMonth() + 1, day);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}