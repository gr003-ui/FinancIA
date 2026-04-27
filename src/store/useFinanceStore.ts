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
  addCard: (card: Omit<Card, 'id' | 'availableOnePayment' | 'availableInstallments'>) => void;
  removeCard: (id: string) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  setExchangeRate: (rate: number) => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      cards: [],
      transactions: [],
      exchangeRate: 1000,

      setExchangeRate: (rate) => set({ exchangeRate: rate }),

      addCard: (card) => set((state) => ({
        cards: [...state.cards, { 
          ...card, 
          id: generateId(),
          availableOnePayment: card.limitOnePayment,
          availableInstallments: card.limitInstallments 
        }]
      })),

      removeCard: (id) => set((state) => ({
        cards: state.cards.filter(c => c.id !== id)
      })),

      addTransaction: (tx) => set((state) => {
        const newTx = { ...tx, id: generateId() };
        let updatedCards = [...state.cards];

        if (tx.type === 'expense' && tx.cardId) {
          // Si el gasto es en USD, se multiplica por la cotización para el límite en ARS
          const amountInARS = tx.currency === 'USD' ? tx.amount * state.exchangeRate : tx.amount;

          updatedCards = state.cards.map(card => {
            if (card.id === tx.cardId) {
              const isInstallment = tx.method === 'Crédito' && tx.installments > 1;
              return {
                ...card,
                availableOnePayment: !isInstallment ? card.availableOnePayment - amountInARS : card.availableOnePayment,
                availableInstallments: isInstallment ? card.availableInstallments - amountInARS : card.availableInstallments
              };
            }
            return card;
          });
        }

        return { transactions: [newTx, ...state.transactions], cards: updatedCards };
      }),
    }),
    { name: 'financia-storage-v8' } // Nueva versión para resetear datos incompatibles
  )
);