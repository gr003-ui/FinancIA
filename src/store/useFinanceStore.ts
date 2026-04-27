import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export interface Card {
  id: string;
  bank: string;
  type: 'Crédito' | 'Débito';
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

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      cards: [],
      transactions: [],
      exchangeRate: 1000,
      userName: 'Usuario FinancIA',

      setExchangeRate: (rate) => set({ exchangeRate: rate }),
      setUserName: (name) => set({ userName: name }),

      addCard: (card) => set((state) => ({
        cards: [...state.cards, {
          ...card,
          id: generateId(),
          availableOnePayment: card.limitOnePayment,
          availableInstallments: card.limitInstallments,
        }],
      })),

      removeCard: (id) => set((state) => ({
        cards: state.cards.filter(c => c.id !== id),
      })),

      addTransaction: (tx) => set((state) => {
        const newTx = { ...tx, id: generateId() };
        let updatedCards = [...state.cards];

        if (tx.type === 'expense' && tx.cardId) {
          const amountInARS = tx.currency === 'USD' ? tx.amount * state.exchangeRate : tx.amount;
          updatedCards = state.cards.map(card => {
            if (card.id === tx.cardId) {
              const isInstallment = tx.method === 'Crédito' && tx.installments > 1;
              return {
                ...card,
                availableOnePayment: !isInstallment
                  ? card.availableOnePayment - amountInARS
                  : card.availableOnePayment,
                availableInstallments: isInstallment
                  ? card.availableInstallments - amountInARS
                  : card.availableInstallments,
              };
            }
            return card;
          });
        }

        return { transactions: [newTx, ...state.transactions], cards: updatedCards };
      }),

      removeTransaction: (id) => set((state) => {
        const tx = state.transactions.find(t => t.id === id);
        if (!tx) return state;

        let updatedCards = [...state.cards];

        if (tx.type === 'expense' && tx.cardId) {
          const amountInARS = tx.currency === 'USD' ? tx.amount * state.exchangeRate : tx.amount;
          updatedCards = state.cards.map(card => {
            if (card.id === tx.cardId) {
              const isInstallment = tx.method === 'Crédito' && tx.installments > 1;
              return {
                ...card,
                availableOnePayment: !isInstallment
                  ? Math.min(card.availableOnePayment + amountInARS, card.limitOnePayment)
                  : card.availableOnePayment,
                availableInstallments: isInstallment
                  ? Math.min(card.availableInstallments + amountInARS, card.limitInstallments)
                  : card.availableInstallments,
              };
            }
            return card;
          });
        }

        return {
          transactions: state.transactions.filter(t => t.id !== id),
          cards: updatedCards,
        };
      }),

      // Borra movimientos y restaura los límites disponibles de cada tarjeta
      resetAll: () => set((state) => ({
        transactions: [],
        cards: state.cards.map(card => ({
          ...card,
          availableOnePayment: card.limitOnePayment,
          availableInstallments: card.limitInstallments,
        })),
      })),
    }),
    { name: 'financia-storage-v8' }
  )
);